import { Msgs, Result } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
    EmbedGrammar,
    HideGrammar,
    MatchGrammar,
    RenameGrammar,
    FilterGrammar,
    JoinGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { Dict, setMap, update } from "../utils/func";
import { TapeID, TapeSet, TapeLit, TapeRef, hasTape, TapeRename, tapeToRefs, tapeToStr } from "../tapes";
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

                case "lit": return updateTapes(g, TapeLit(g.tapeName));
                case "dot": return updateTapes(g, TapeLit(g.tapeName));

                // tapes are just the union of children's tapes
                
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

                //default: exhaustive(g.tag);
                default: throw new Error(`unhandled grammar in getTapes: ${g.tag}`);
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
 * 
 * If it succeeds, we just return a join.
 * If we fail, we return the left child and an error message.
 */
function getTapesFilter(g: FilterGrammar): Result<Grammar> {

    const conditionTapes = g.child2.tapes;
    if (conditionTapes.length === 0) {
        // it's an epsilon or failure but it's caught elsewhere,
        //don't complain here
        return g.child1.msg(); 
    }

    if (conditionTapes.length > 1) {
        return g.child1.err("Filters must be single-tape", 
        `A filter like equals, starts, etc. should only reference a single tape.`);
    }

    const childTapes = new Set(g.child1.tapes);
    if (!(childTapes.has(conditionTapes[0]))) {
        return g.child1.err("Filtering non-existent tape", 
        `This filter references a tape ${conditionTapes[0]} that does not exist`);
    }
    const result = new JoinGrammar(g.child1, g.child2);
    return getTapesDefault(result).msg();
}

function getTapesCollection(g: CollectionGrammar, env: PassEnv): Result<Grammar> {
    const msgs: Msgs = [];
    
    // first get the initial tapes for each symbol
    const tapeIDs: Dict<TapeID> = {};
    for (const [k,v] of Object.entries(g.symbols)) {
        tapeIDs[k] = v.tapeSet;
    }

    // now resolve the references and renames until you're
    // left with only sets of literals
    for (const [k1,v1] of Object.entries(tapeIDs)) {
        for (const k2 of tapeToRefs(v1)) {
            tapeIDs[k1] = resolveTapes(tapeIDs[k1], k2, 
                                    tapeIDs[k2], new Set(k1));
        }
    }

    // now feed those back into the structure so that every
    // grammar node has only literal tapes
    const tapePusher = new CalculateTapes(true, tapeIDs);
    for (const [k,v] of Object.entries(g.symbols)) {
        const newV = tapePusher.transform(v, env).msgTo(msgs);
        g.symbols[k] = newV;
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
            return TapeSet(...setMap(t.children, c => 
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