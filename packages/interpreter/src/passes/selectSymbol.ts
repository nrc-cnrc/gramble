import { Msg } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { qualifySymbol } from "./qualifySymbols";

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
    
    public transformAux(g: Grammar, env: PassEnv): Grammar {
        switch (g.tag) {
            case "collection": return this.selectSymbol(g, env);
            default:           throw g.err("Symbol not found", 
                                    `Cannot find symbol ${this.symbol} in ${g.tag} grammar`);
        }
    }

    public selectSymbol(g: CollectionGrammar, env: PassEnv): Grammar {

        const resolution = qualifySymbol(g, this.symbol);
        if (resolution == undefined) {
            throw g.err("Cannot resolve symbol", 
                `Cannot find symbol ${this.symbol} in grammar, candidates: ${Object.keys(g.symbols)}.`);
        }

        const referent = g.symbols[resolution[0]];
        if (referent == undefined) {
            // a resolved symbol should always exist
            throw new Error(
                `Cannot find symbol ${this.symbol} in grammar, candidates: ${Object.keys(g.symbols)}.`);
        }

        const result = new CollectionGrammar(g.symbols, resolution[0], g.qualifier);
        result.tapes = referent.tapes;
        return result;
    }

};