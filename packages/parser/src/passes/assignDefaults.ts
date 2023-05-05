import { 
    EmbedGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    AlternationGrammar,
    EpsilonGrammar,
    LocatorGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { ALL_SYMBOL_NAME, DEFAULT_SYMBOL_NAME } from "../util";

/**
 * Goes through collections and, if a symbol Default isn't present,
 * assigns that to an alternation of the symbols under the collection.
 */
export class AssignDefaults extends Pass<Grammar,Grammar> {

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        
        const mapped = g.mapChildren(this, env);
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
        
        const entries = Object.entries(g.symbols);
        
        if (g.getSymbol(ALL_SYMBOL_NAME) == undefined) {
            const embeds = entries.map(([k,v]) => {
                if (v instanceof CollectionGrammar || 
                    v instanceof LocatorGrammar && 
                    v.child instanceof CollectionGrammar) {
                    return new EmbedGrammar(`${k}.${ALL_SYMBOL_NAME}`);
                } else {
                    return new EmbedGrammar(k);
                }
            });
            const alt = new AlternationGrammar(embeds);
            g.symbols[ALL_SYMBOL_NAME] = alt;
        }
        return g;
    }
}
