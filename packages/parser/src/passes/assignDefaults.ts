import { 
    EmbedGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    AlternationGrammar,
    LocatorGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";
import { ALL_SYMBOL_NAME } from "../util";
import { PostGrammarPass } from "./ancestorPasses";

/**
 * Goes through collections and, if a symbol Default isn't present,
 * assigns that to an alternation of the symbols under the collection.
 */
export class AssignDefaults extends PostGrammarPass {

    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch(g.tag) {
            case "collection": return this.handleCollection(g as CollectionGrammar, env);
            default:           return g;
        }
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
