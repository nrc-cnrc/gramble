import { 
    EmbedGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    AlternationGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { DEFAULT_SYMBOL_NAME } from "../util";

/**
 * Goes through collections and, if a symbol Default isn't present,
 * assigns that to an alternation of the symbols under the collection.
 */
export class AssignDefaults extends Pass<Grammar,Grammar> {

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        
        const mapped = g.mapChildren(this, env) as GrammarResult;
        return mapped.bind(g => {
            switch(g.constructor) {
                case CollectionGrammar:
                    return this.handleCollection(g as CollectionGrammar, env);
                default: 
                    return g;
            }
        });
    }
    
    public get desc(): string {
        return "Assigning default symbols";
    }

    public handleCollection(g: CollectionGrammar, env: PassEnv): Grammar {
        
        if (g.getSymbol(DEFAULT_SYMBOL_NAME)) {
            // if Default is already assigned, we don't have to do anything
            return g;
        }
        
        const keys = Object.keys(g.symbols);
        const embeds = keys.map(k => new EmbedGrammar(k));
        const alt = new AlternationGrammar(embeds);
        g.symbols[DEFAULT_SYMBOL_NAME] = alt;
        return g;
    }

}
