import { Err, Msgs, Result } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
    EmbedGrammar,
    HideGrammar,
    MatchGrammar,
    RenameGrammar,
    FilterGrammar,
    JoinGrammar,
    ReplaceGrammar,
    ReplaceBlockGrammar,
    SequenceGrammar,
    EpsilonGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { Dict, mapValues, exhaustive, mapSet, update } from "../utils/func";
import { TapeID, TapeSet, TapeLit, TapeRef, hasTape, TapeRename, tapeToRefs, tapeToStr, tapeLength } from "../tapes";
import { HIDDEN_PREFIX } from "../utils/constants";

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
        public knownTapes: Dict<TapeID> = {}
    ) {
        super();
    }

    public transform(g: Grammar, env: PassEnv): Result<Grammar> {
        if (g.tapeSet.tag !== "tapeUnknown" && !this.recalculate) {
            return g.msg();
        }

        return g.mapChildren(this, env).bind(g => {
            switch (g.tag) {

                // have no tapes
                case "epsilon":
                case "null": return updateTapes(g, TapeSet())

                // have their own tape name as tapes
                case "lit": return updateTapes(g, TapeLit(g.tapeName));
                case "dot": return updateTapes(g, TapeLit(g.tapeName));

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
                case "pretape":
                case "locator": return getTapesDefault(g);
                
                // union of children's tapes, plus additional tapes
                case "starts":
                case "ends":
                case "contains": return getTapesDefault(g, g.extraTapes);
                case "match":    return getTapesDefault(g, [g.fromTape, g.toTape]);

                // something special
                case "embed":      return getTapesEmbed(g, this.knownTapes);
                case "collection": return getTapesCollection(g, env);
                case "singletape": return updateTapes(g, TapeLit(g.tapeName));
                case "rename":     return getTapesRename(g);
                case "hide":       return getTapesHide(g);
                case "filter":     return getTapesFilter(g);
                case "replace":    return getTapesReplace(g, env);
                case "replaceblock": return getTapesReplaceBlock(g);

                default: exhaustive(g);
                //default: throw new Error(`unhandled grammar in getTapes: ${g.tag}`);
            }
        });
    }
}

function updateTapes(g: Grammar, tapes: TapeID): Grammar {
    return update(g, { tapeSet: tapes });
}

function getTapesDefault(
    g: Grammar, 
    extras: Iterable<string> | undefined = undefined
): Grammar {
    if (extras === undefined) {
        return updateTapes(g, getChildTapes(g));
    }
    const lits = [...extras].map(s => TapeLit(s));
    const allTapes = TapeSet(getChildTapes(g), ...lits);
    return updateTapes(g, allTapes);
}

function getChildTapes(g: Grammar): TapeID {
    const childTapes = g.getChildren().map(c => c.tapeSet);
    return TapeSet(...childTapes);
}

function getTapesEmbed(
    g: EmbedGrammar, 
    knownTapes:Dict<TapeID>
): Grammar {
    if (!(g.name in knownTapes)) return updateTapes(g, TapeRef(g.name));
    return updateTapes(g, knownTapes[g.name]);
}

function getTapesRename(g: RenameGrammar): Result<Grammar> {

    if (hasTape(g.child.tapeSet, g.fromTape) === false) {
        return g.child.err("Renaming missing tape",
            `The ${g.child.constructor.name} to undergo renaming does not contain the tape ${g.fromTape}. ` +
            `Available tapes: [${[...g.child.tapes]}]`);
    }

    if (g.fromTape !== g.toTape && hasTape(g.child.tapeSet, g.toTape) === true) {
        const errTapeName = `${HIDDEN_PREFIX}ERR${g.toTape}`;
        let repair: Grammar = new RenameGrammar(g.child, g.toTape, errTapeName);
        repair = updateTapes(repair, TapeRename(repair.child.tapeSet, g.toTape, errTapeName));
        repair = new RenameGrammar(repair, g.fromTape, g.toTape);
        repair = updateTapes(repair, TapeRename(repair.child.tapeSet, g.fromTape, g.toTape));
        return repair.err("Destination tape already exists",
                    `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
                    `to the left already contains the tape ${g.toTape}. `)
    }

    const tapes = TapeRename(g.child.tapeSet, g.fromTape, g.toTape);
    return updateTapes(g, tapes).msg();
}

function getTapesHide(g: HideGrammar): Result<Grammar> {
    if (hasTape(g.child.tapeSet, g.tapeName) === false) {
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

    const lenTapes1 = tapeLength(g.child1.tapeSet);
    const lenTapes2 = tapeLength(g.child2.tapeSet);
    if (lenTapes1 === "unknown" || lenTapes2 === "unknown") {
        // there's nothing more to do right now
        return getTapesDefault(g).msg();
    }

    if (lenTapes2 === 0) {
        // it's an epsilon or failure caught elsewhere
        return getTapesDefault(g).msg();
    }

    if (lenTapes2 > 1) {
        return g.child1.err("Filters must be single-tape", 
        `A filter like equals, starts, etc. should only reference a single tape.`);
    }

    const t2 = g.child2.tapes[0];
    if (hasTape(g.child1.tapeSet, t2) === false) {
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
        const len = tapeLength(child.tapeSet);
        if (len === "unknown" || len <= 1) continue;
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
    if (hasTape(g.child.tapeSet, g.inputTape) === false) {
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
    const hiddenTapes = g.rules.map(r => r.hiddenTapeName)
                                   .map(t => TapeLit(t));
    const newTapes = TapeSet(g.child.tapeSet, ...hiddenTapes);
    return updateTapes(g, newTapes).msg();
}

function getTapesCollection(g: CollectionGrammar, env: PassEnv): Result<Grammar> {
    const msgs: Msgs = [];
    
    // first get the initial tapes for each symbol
    const tapeIDs: Dict<TapeID> = mapValues(g.symbols, v => v.tapeSet);
    
    // now resolve the references and renames until you're
    // left with only sets of literals
    for (const [k1,v1] of Object.entries(tapeIDs)) {
        let refs = tapeToRefs(v1);
        for (let i = 0; i < refs.length; i++) {
            const k2 = refs[i];
            const newV1 = resolveTapes(tapeIDs[k1], k2, 
                tapeIDs[k2], new Set(k1));
            refs = [...new Set([...refs, ...tapeToRefs(newV1)])];
            tapeIDs[k1] = newV1;
        }
    }

    // check for unresolved content, and throw an exception immediately.
    // otherwise we have to puzzle it out from exceptions elsewhere.
    for (const [k,v] of Object.entries(tapeIDs)) {
        if (tapeLength(v) === "unknown") { 
            throw new Error(`Unresolved tape structure in ${k}: ${tapeToStr(v)}`);
        }
    }

    // now feed those back into the structure so that every
    // grammar node has only literal tapes
    const tapePusher = new CalculateTapes(true, tapeIDs);
    g.symbols = mapValues(g.symbols, v => 
            tapePusher.transform(v, env).msgTo(msgs));

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
function resolveTapes(
    t: TapeID, 
    key:string, 
    val:TapeID,
    visited: Set<string>
): TapeID {
    switch (t.tag) {
        case "tapeUnknown": return TapeSet();
        case "tapeLit": return t;
        case "tapeRef": return resolveTapeRefs(t, key, val, visited);
        case "tapeRename": 
            return TapeRename(resolveTapes(t.child, key, val, visited), 
                                t.fromTape, t.toTape);
        case "tapeSet": 
            return TapeSet(...mapSet(t.children, c => 
                resolveTapes(c, key, val, visited)));
    }
}

function resolveTapeRefs(    
    t: TapeRef, 
    key:string, 
    val:TapeID,
    visited: Set<string>
): TapeID {
    if (key !== t.symbol) return t;
    if (visited.has(key)) return TapeSet();
    const newVisited = new Set([...visited, key]);
    return resolveTapes(val, key, val, newVisited);
}