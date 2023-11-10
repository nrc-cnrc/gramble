import { Msgs, Result } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
    EmbedGrammar,
    HideGrammar,
    MatchGrammar,
    RenameGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { Dict, update } from "../utils/func";
import { TapeID, TapeSet, TapeLit, TapeRef, hasTape, TapeRename, resolveTapes } from "../tapes";
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

                // embeds get a special ad-hoc tape with their name
                case "embed": return getTapesEmbed(g, this.knownTapes);
                // tapes are just the union of children's tapes
                
                case "seq": 
                case "alt": 
                case "intersect": 
                case "join": 
                case "contains":
                case "starts": 
                case "ends":
                case "short": 
                case "count": 
                case "filter":
                case "not":
                case "test":
                case "testnot":
                case "repeat":
                case "correspond":
                case "context":
                case "locator": return getTapesDefault(g);
                
                // something special
                case "collection": return getTapesCollection(g, env);
                case "singletape": return updateTapes(g, TapeLit(g.tapeName));
                case "match":      return getTapesMatch(g);
                case "rename":     return getTapesRename(g);
                case "hide":       return getTapesHide(g);

                //default: exhaustive(g.tag);
                default: throw new Error(`unhandled grammar in getTapes: ${g.tag}`);
            }
        });
    }
}

function updateTapes(g: Grammar, tapes: TapeID): Grammar {
    return update(g, { tapeSet: tapes });
}

function getTapesDefault(g: Grammar): Grammar {
    const childTapes = getChildTapes(g);
    return updateTapes(g, getChildTapes(g));
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

function getTapesMatch(g: MatchGrammar): Grammar {
    const tapes = TapeSet(getChildTapes(g), 
            TapeLit(g.fromTape), TapeLit(g.toTape));
    return updateTapes(g, tapes);
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

function getTapesCollection(g: CollectionGrammar, env: PassEnv): Result<Grammar> {
    const msgs: Msgs = [];
    
    // first get the initial tapes for each symbol
    const tapeIDs: Dict<TapeID> = {};
    for (const [k,v] of Object.entries(g.symbols)) {
        tapeIDs[k] = v.tapeSet;
    }

    // now resolve the references and renames until you're
    // left with only sets of literals
    const keys = Object.keys(tapeIDs);
    for (let i = 0; i < keys.length; i++) {
        const k1 = keys[i];
        const v1 = tapeIDs[k1];
        for (let j = 0; j < keys.length; j++) {
            const k2 = keys[j];
            const v2 = resolveTapes(tapeIDs[k2], k1, v1, new Set(k2));
            tapeIDs[k2] = v2;
        }
    }

    // now feed those back into the structure so that every
    // grammar node has only literal tapes
    const tapePusher = new CalculateTapes(true, tapeIDs);
    for (const [k,v] of Object.entries(g.symbols)) {
        const newV = tapePusher.transform(v, env).msgTo(msgs);
        g.symbols[k] = newV;
    }

    // if a symbol is selected, we share its tape set
    const selectedSymbol = g.getSymbol(g.selectedSymbol);
    if (selectedSymbol === undefined) {
        // if there's no selected symbol, the collection as a whole
        // has the semantics of epsilon, and thus its tapes are
        // an empty TapeSet rather than TapeUnknown.   
        return updateTapes(g, TapeSet()).msg(msgs);
    }
    return updateTapes(g, selectedSymbol.tapeSet).msg(msgs);

}