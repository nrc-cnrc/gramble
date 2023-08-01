import { MissingSymbolError, Msgs, Result } from "../msgs";
import { 
    EmbedGrammar,
    EpsilonGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    LocatorGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { DEFAULT_SYMBOL_NAME, flatten, listUnique } from "../util";

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
        public nameStack: string[] = [],
        public collectionStack: CollectionGrammar[] = []
    ) {
        super();
    }

    public transform(t: Grammar, env: PassEnv): Result<Grammar> {
        throw new Error("Method not implemented.");
    }

}


function getChildTapes(g: Grammar): string[] {
    const children = g.getChildren();
    const childTapes = children.map(s => calculateTapes(g));
    return listUnique(flatten(childTapes));
}

function calculateTapes(g: Grammar): string[] {
    switch (g.tag) {

        case "epsilon": return [];
        case "null": return [];
        case "lit": return [g.tapeName];
        case "dot": return [g.tapeName];
        case "seq": return getChildTapes(g);
        case "alt": return getChildTapes(g);
        case "intersect": return getChildTapes(g);
        case "join": return getChildTapes(g);
        case "collection": return [];
        case "contains": return getChildTapes(g);
        case "starts": return getChildTapes(g);
        case "ends": return getChildTapes(g);
        case "short": return getChildTapes(g);
        case "singletape": return [g.tapeName];
        case "count": return getChildTapes(g);
        case "locator": return getChildTapes(g);
        case "matchfrom": return listUnique([...getChildTapes(g), g.fromTape, g.toTape]);
        case "rename": 
            return getChildTapes(g).map(t => 
                t === g.fromTape ? g.toTape : t)
        
        //default: exhaustive(g.tag);
    }

    return [];
}
