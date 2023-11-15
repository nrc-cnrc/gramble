import { Result } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";

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
export class SelectSymbol extends Pass<Grammar,Grammar> {
    
    constructor(
        public symbol: string
    ) {
        super();
    }
    
    public transform(t: Grammar, env: PassEnv): Result<Grammar> {
        switch (t.tag) {
            case "locator": 
                return t.mapChildren(this, env);
            case "collection": 
                return this.selectSymbol(t, env);
            default:    
                return t.err("Symbol not found", 
                    `Cannot find symbol ${this.symbol} in ${t.tag} grammar`);
        }
    }

    public selectSymbol(t: CollectionGrammar, env: PassEnv): Result<Grammar> {

        const referent = t.getSymbol(this.symbol);
        if (referent == undefined) {
            return t.err("Symbol not found", 
                    `Cannot find symbol ${this.symbol} in grammar.`);
        }
        const result = new CollectionGrammar(t.symbols, this.symbol);
        result.tapeSet = referent.tapeSet;
        return result.msg();
    }

};