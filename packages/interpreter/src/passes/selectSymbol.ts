import { Msg } from "../utils/msgs.js";
import { 
    Grammar,
    QualifiedGrammar,
    SelectionGrammar,
} from "../grammars.js";
import { Pass } from "../passes.js";
import { qualifySymbol } from "./qualifySymbols.js";
import { PassEnv } from "../components.js";

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
            case "qualified":
                return this.selectSymbol(g, env);
            default:
                throw g.err("Symbol '${this.symbol}' not found", 
                            `Cannot find symbol '${this.symbol}' in ${g.tag} grammar.`);
        }
    }

    public selectSymbol(g: QualifiedGrammar, env: PassEnv): Grammar {

        const resolution = qualifySymbol(g, this.symbol);
        if (resolution == undefined) {
            throw g.err(`Cannot resolve symbol: ${this.symbol}`, 
                        `Cannot find symbol ${this.symbol} in grammar, ` +
                        `candidates: ${Object.keys(g.symbols)}.`);
        }

        const referent = g.symbols[resolution[0]];
        if (referent == undefined) {
            // a resolved symbol should always exist
            throw new Error(`Cannot find symbol ${this.symbol} in grammar, ` +
                            `candidates: ${Object.keys(g.symbols)}.`);
        }

        const result = new SelectionGrammar(g.symbols, resolution[0]);
        result.tapes = referent.tapes;
        return result;
    }

};
