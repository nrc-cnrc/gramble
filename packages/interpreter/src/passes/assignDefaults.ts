import { PassEnv } from "../components.js";
import { 
    EmbedGrammar,
    Grammar,
    QualifiedGrammar,
    AlternationGrammar,
    CollectionGrammar
} from "../grammars.js";
import { AutoPass } from "../passes.js";
import { ALL_SYMBOL } from "../utils/constants.js";
import { getCaseInsensitive } from "../utils/func.js";

/**
 * Goes through collections and, if a symbol Default isn't present,
 * assigns that to an alternation of the symbols under the collection.
 */
export class AssignDefaults extends AutoPass<Grammar> {

    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch(g.tag) {
            case "collection": return this.handleCollection(g, env);
            default:           return g;
        }
    }

    public handleCollection(g: CollectionGrammar, env: PassEnv): Grammar {
        
        const allReferent = getCaseInsensitive(g.symbols, ALL_SYMBOL);
        if (allReferent !== undefined) { 
            return g;  // .all is already assigned in this collection
        }

        const entries = Object.entries(g.symbols);
        const embeds = entries.map(([k,v]) => {
            if (v instanceof CollectionGrammar) {
                return new EmbedGrammar(`${k}.${ALL_SYMBOL}`);
            } else {
                return new EmbedGrammar(k);
            }
        });
        g.symbols[ALL_SYMBOL] =  new AlternationGrammar(embeds);
        return g;
    }
}
