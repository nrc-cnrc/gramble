import { Result } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { resolveNameAux } from "./resolveNames";

/**
 * CollectionGrammars have a "selectedSymbol" member that determines
 * how they will be interpreted.  E.g., if the selected symbol is "a",
 * it will be evaluated as if it's "a", and otherwise all it does is
 * put its own symbol table into the `env`.
 * 
 * This Pass turns a CollectionGrammar without any symbol selected
 * into one that has one.
 */
export class SelectSymbol extends Pass<Grammar,Grammar> {
    
    constructor(
        public symbol: string
    ) {
        super();
    }
    
    public transform(g: Grammar, env: PassEnv): Result<Grammar> {
        switch (g.tag) {
            case "locator":    return g.mapChildren(this, env);
            case "collection": return this.selectSymbol(g, env);
            default:           return g.err("Symbol not found", 
                                    `Cannot find symbol ${this.symbol} in ${g.tag} grammar`);
        }
    }

    public selectSymbol(g: CollectionGrammar, env: PassEnv): Result<Grammar> {

        const namePieces = this.symbol.split(".").filter(s => s.length > 0);
        const resolution = resolveNameAux(g.resolver, namePieces);
        if (resolution == undefined) {
            return g.err("Cannot resolve symbol", 
                `Cannot find symbol ${this.symbol} in grammar, candidates: ${Object.keys(g.symbols)}.`);
        }

        const referent = g.symbols[resolution];
        if (referent == undefined) {
            // a resolved symbol should always exist
            throw new Error(
                `Cannot find symbol ${this.symbol} in grammar, candidates: ${Object.keys(g.symbols)}.`);
        }

        const result = new CollectionGrammar(g.symbols, resolution, g.resolver);
        result.tapeSet = referent.tapeSet;
        return result.msg();
    }

};