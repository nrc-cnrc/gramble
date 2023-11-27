import { Err, Msgs, Result } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
    EmbedGrammar,
    HideGrammar,
    RenameGrammar,
    FilterGrammar,
    ReplaceGrammar,
    ReplaceBlockGrammar,
    EpsilonGrammar,
    LiteralGrammar,
    DotGrammar,
    SingleTapeGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { 
    Dict, mapValues, 
    exhaustive, update, 
    foldRight, union 
} from "../utils/func";
import { 
    TapeInfo, TapeSum, 
    TapeLit, TapeRef, 
    TapeRename, tapeToStr 
} from "../tapes";
import { HIDDEN_PREFIX } from "../utils/constants";
import { VocabString } from "../vocab";

/**
 * Goes through the tree and 
 * 
 * (1) flattens the collection structure, replacing the 
 * potentially complex tree of collections with a single 
 * one at the root
 * 
 * (2) replaces unqualified symbol references (like "VERB") to 
 * fully-qualified names (like "MainSheet.VERB")
 */
export class CalculateTapes extends Pass<Grammar,Grammar> {

    constructor(
        public recalculate: boolean = false,
        public knownTapes: Dict<TapeInfo> = {}
    ) {
        super();
    }

    public transform(g: Grammar, env: PassEnv): Result<Grammar> {
        if (g.tapeSet.tag !== "TapeUnknown" && !this.recalculate) {
            return g.msg();
        }

        return g.mapChildren(this, env)
                .bind(g => this.transformAux(g, env))
                .bind(g => {    
                    console.log(`${g.tag} has tapes ${tapeToStr(g.tapeSet)}`);
                    return g;
                })
                .localize(g.pos);
    }

    public transformAux(g: Grammar, env: PassEnv): Grammar|Result<Grammar> {
        switch (g.tag) {

            // have no tapes
            case "epsilon":
            case "null": return updateTapes(g, TapeLit());

            // have their own tape name as tapes
            case "lit": return getTapesLit(g);
            case "dot": return getTapesDot(g);
            
            case "singletape": return getTapesSingleTape(g);

            // just the union of children's tapes
            case "seq": 
            case "alt": 
            case "intersect": 
            case "join":
            case "short": 
            case "count": 
            case "not":
            case "test":
            case "testnot":
            case "repeat":
            case "correspond":
            case "context":
            case "cursor":
            case "pretape": return getTapesDefault(g);
            
            // union of children's tapes, plus additional tapes
            case "starts":
            case "ends":
            case "contains": return getTapesDefault(g); // g.extraTapes);
            case "match":    return getTapesDefault(g); //[g.fromTape, g.toTape]);

            // something special
            case "embed":      return getTapesEmbed(g, this.knownTapes);
            case "collection": return getTapesCollection(g, env);
            case "rename":     return getTapesRename(g);
            case "hide":       return getTapesHide(g);
            case "filter":     return getTapesFilter(g);
            case "replace":    return getTapesReplace(g, env);
            case "replaceblock": return getTapesReplaceBlock(g);

            default: exhaustive(g);
            //default: throw new Error(`unhandled grammar in getTapes: ${g.tag}`);
        }

    }
}


function updateTapes(g: Grammar, tapes: TapeInfo): Grammar {
    return update(g, { tapeSet: tapes });
}

function getTapesDefault(
    g: Grammar, 
    extras: Map<string,VocabString> | undefined = undefined
): Grammar {
    if (extras === undefined) {
        return updateTapes(g, getChildTapes(g));
    }
    const lits = TapeLit(extras);
    const allTapes = TapeSum(getChildTapes(g), lits);
    return updateTapes(g, allTapes);
}

function getChildTapes(g: Grammar): TapeInfo {
    const childTapes = g.getChildren().map(c => c.tapeSet);
    if (childTapes.length === 0) return TapeLit();
    return foldRight(childTapes.slice(1), TapeSum, childTapes[0]);
}

function getTapesLit(g: LiteralGrammar): Grammar {
    const tapes: Map<string,VocabString> = new Map();
    tapes.set(g.tapeName, VocabString(g.tokens, false));
    return updateTapes(g, TapeLit(tapes));
}

function getTapesSingleTape(g: SingleTapeGrammar): Grammar {
    const tapes: Map<string,VocabString> = new Map();
    tapes.set(g.tapeName, VocabString());  // TODO: fix this
    return updateTapes(g, TapeLit(tapes));

}

function getTapesDot(g: DotGrammar): Grammar {
    const tapes: Map<string,VocabString> = new Map();
    tapes.set(g.tapeName, VocabString(new Set(), false));
    return updateTapes(g, TapeLit(tapes));
}


function getTapesEmbed(
    g: EmbedGrammar, 
    knownTapes:Dict<TapeInfo>
): Grammar {
    if (!(g.symbol in knownTapes)) return updateTapes(g, TapeRef(g.symbol));
    return updateTapes(g, knownTapes[g.symbol]);
}

function getTapesRename(g: RenameGrammar): Result<Grammar> {

    const tapes = TapeRename(g.child.tapeSet, g.fromTape, g.toTape);
    const result = updateTapes(g, tapes).msg();

    if (g.child.tapeSet.tag !== "TapeLit") {
        return result;
    }

    if (!g.child.tapeSet.tapes.has(g.fromTape)) {
        return g.child.err("Renaming missing tape",
            `The grammar to undergo renaming does not contain the tape ${g.fromTape}. ` +
            `Available tapes: [${[...g.child.tapes]}]`);
    }

    if (g.fromTape !== g.toTape && g.child.tapeSet.tapes.has(g.toTape)) {
        return g.child.err("Destination tape already exists",
                  `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
                  `to the left already contains the tape ${g.toTape}.`)
        
        //const errTapeName = `${HIDDEN_PREFIX}ERR${g.toTape}`;
        //let repair: Grammar = new RenameGrammar(g.child, g.toTape, errTapeName);
        //repair = updateTapes(repair, TapeRename(repair.child.tapeSet, g.toTape, errTapeName));
        //repair = new RenameGrammar(repair, g.fromTape, g.toTape);
        //repair = updateTapes(repair, TapeRename(repair.child.tapeSet, g.fromTape, g.toTape));
        //return repair.err("Destination tape already exists",
         //           `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
      //              `to the left already contains the tape ${g.toTape}. `)
    }

    return result;

}

function getTapesHide(g: HideGrammar): Result<Grammar> {
    if (g.child.tapeSet.tag === "TapeLit" &&
        !g.child.tapeSet.tapes.has(g.tapeName)) {
        return g.child.err("Hiding missing tape",
                    `The grammar being hidden does not contain the tape ${g.tapeName}. ` +
                    ` Available tapes: [${[...g.child.tapes]}]`);
    }

    const tapes = TapeRename(g.child.tapeSet, g.tapeName, g.toTape);
    return updateTapes(g, tapes).msg();
}

/**
 * FilterGrammars are just a kind of join with a single-tape requirement.
 * Here we check that requirement.  We could do this with SingleTapeGrammars
 * too but handling it specially lets us return a clearer error message. 
 * If we fail, we return the left child and an error message.
 */
function getTapesFilter(g: FilterGrammar): Result<Grammar> {

    if (g.child1.tapeSet.tag !== "TapeLit" || 
            g.child2.tapeSet.tag !== "TapeLit") {
        // there's nothing we can check right now
        return getTapesDefault(g).msg();
    }

    if (g.child2.tapeSet.tapes.size === 0) {
        // it's an epsilon or failure caught elsewhere
        return getTapesDefault(g).msg();
    }

    if (g.child2.tapeSet.tapes.size > 1) {
        return g.child1.err("Filters must be single-tape", 
        `A filter like equals, starts, etc. should only reference a single tape.`);
    }

    const t2 = g.child2.tapes[0];
    if (!g.child1.tapeSet.tapes.has(t2)) {
        return g.child1.err("Filtering non-existent tape", 
        `This filter references a tape ${t2} that does not exist`);
    }

    return getTapesDefault(g).msg();
}


function getTapesReplace(g: ReplaceGrammar, env: PassEnv): Result<Grammar> {

    // during normal construction it shouldn't be possible to construct
    // multitape rules, but just in case...
    const childrenToCheck: [string, Grammar][] = [
        ["from", g.fromGrammar],
        ["to", g.toGrammar],
        ["pre", g.preContext],
        ["post", g.postContext]
    ];

    const msgs: Msgs = [];
    for (const [childName, child] of childrenToCheck) {
        if (child.tapeSet.tag !== "TapeLit") continue; // nothing to check
        if (child.tapeSet.tapes.size <= 1) continue;
        msgs.push(Err( "Multitape rule", 
                    "This rule has the wrong number of tapes " +
                    ` in ${childName}: ${tapeToStr(child.tapeSet)}`));
    }

    if (msgs.length > 0)
        return new EpsilonGrammar().tapify(env).msg(msgs);

    return getTapesDefault(g).msg();

}
                
function getTapesReplaceBlock(g: ReplaceBlockGrammar): Result<Grammar> {

    // make sure the tape we're replacing exists, otherwise
    // we generate infinitely
    if (g.child.tapeSet.tag === "TapeLit" &&
        !g.child.tapeSet.tapes.has(g.inputTape)) {
        return g.child.err("Replacing non-existent tape",
                    `The grammar above does not have a tape ` +
                    `${g.inputTape} to replace on`);
    }

    // filter out any non-rules caused by children disappearing
    const isReplace = (r: Grammar): r is ReplaceGrammar => 
                        r instanceof ReplaceGrammar;
    g.rules = g.rules.filter(isReplace);

    if (g.rules.length == 0) {
        return g.child.warn("This replace has no valid rules");
    }

    // the block's tapes are its child's tapes plus the 
    // hidden tapes of its rules
    const hiddenTapes: TapeLit = TapeLit();
    for (const r of g.rules) {
        hiddenTapes.tapes.set(r.hiddenTapeName, VocabString());
    }

    //const hiddenTapes = TapeLit(g.rules.map(r => r.hiddenTapeName))
    const newTapes = TapeSum(g.child.tapeSet, hiddenTapes);
    return updateTapes(g, newTapes).msg();
}

function getTapesCollection(g: CollectionGrammar, env: PassEnv): Result<Grammar> {
    const msgs: Msgs = [];
    
    while (true) {
        const newMsgs: Msgs = [];

        // first get the initial tapes for each symbol
        let tapeIDs: Dict<TapeInfo> = mapValues(g.symbols, v => v.tapeSet);

        tapeIDs = unifySymbols(tapeIDs);

        // check for unresolved content, and throw an exception immediately.
        // otherwise we have to puzzle it out from exceptions elsewhere.
        for (const [k,v] of Object.entries(tapeIDs)) {
            if (v.tag !== "TapeLit") {
                throw new Error(`Unresolved tape structure in ${k}: ${tapeToStr(v)}`);
            }
        }

        // now feed those back into the structure so that every
        // grammar node has only literal tapes
        const tapePusher = new CalculateTapes(true, tapeIDs);
        g.symbols = mapValues(g.symbols, v => 
                tapePusher.transform(v, env).msgTo(newMsgs));

        msgs.push(...newMsgs);

        if (newMsgs.length === 0) break;
        
        // if there are any errors, the graph may have changed.  we
        // need to restart the process from scratch.
        const tapeRefresher = new CalculateTapes(true);
        g.symbols = mapValues(g.symbols, v => 
            tapeRefresher.transform(v, env).msgTo(newMsgs));
    }

    // TODO: The following interpretation of tapes is incorrect,
    // but matches what we've been doing previously.  I'm going to
    // get it "working" exactly like the old way, before fixing it to be
    // semantically sound.
    return getTapesDefault(g).msg(msgs);

    /*
    // TODO: This is the correct interpretation, restore it eventually

    // if a symbol is selected, we share its tape set
    const selectedSymbol = g.getSymbol(g.selectedSymbol);
    if (selectedSymbol === undefined) {
        // if there's no selected symbol, the collection as a whole
        // has the semantics of epsilon, and thus its tapes are
        // an empty TapeSet rather than TapeUnknown.   
        return updateTapes(g, TapeSet()).msg(msgs);
    }
    return updateTapes(g, selectedSymbol.tapeSet).msg(msgs);
    */

}


/* RESOLVING 
*
* Resolving tapes is the process of replacing TapeRefs
* inside TapeIDs into their corresponding TapeLits and sets thereof
*/

export function unifySymbols(symbols: Dict<TapeInfo>): Dict<TapeInfo> {
    let currentSymbols = symbols;
    for (const [symbol, ref] of Object.entries(symbols)) {
        const visited = new Set(symbol);
        const newRef = unify(ref, currentSymbols, visited);
        currentSymbols[symbol] = newRef;
    }
    return currentSymbols;
}

function unify(
    t: TapeInfo, 
    symbols: Dict<TapeInfo>,
    visited: Set<string>
): TapeInfo {
    switch (t.tag) {
        case "TapeUnknown": return TapeLit();
        case "TapeLit":     return t;
        case "TapeRef":     return unifyRef(t, symbols, visited);
        case "TapeRename":  return unifyRename(t, symbols, visited);
        case "TapeSum":     return unifySum(t, symbols, visited);
    }
}

function unifyRef(
    t: TapeRef, 
    symbols: Dict<TapeInfo>,
    visited: Set<string>
): TapeInfo {
    if (visited.has(t.symbol)) {
        return TapeLit();
    }
    const referent = symbols[t.symbol];
    if (referent === undefined) {
        // should never happen so long as FlattenCollections has been run
        throw new Error(`Unknown symbol ${t} in tape unification`);
    }
    const newVisited = union(visited, [t.symbol]);
    return unify(referent, symbols, newVisited);
}

function unifyRename(
    t: TapeRename, 
    symbols: Dict<TapeInfo>,
    visited: Set<string>
): TapeInfo {
    const newChild = unify(t.child, symbols, visited);
    return TapeRename(newChild, t.fromTape, t.toTape);
}

function unifySum(
    t: TapeSum, 
    symbols: Dict<TapeInfo>,
    visited: Set<string>
): TapeInfo {
    const newC1 = unify(t.c1, symbols, visited);
    const newC2 = unify(t.c2, symbols, visited);
    return TapeSum(newC1, newC2);
}