import { 
    EmbedGrammar,
    Grammar,
    GrammarResult,
    CollectionGrammar,
    AlternationGrammar,
    SequenceGrammar,
    LiteralGrammar,
    EpsilonGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";

/**
 * Goes through collections and, if a symbol Default isn't present,
 * assigns that to an alternation of the symbols under the collection.
 */
export class CombineLiterals extends Pass<Grammar,Grammar> {

    public get desc(): string {
        return "Recombining literals";
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        
        const mapped = g.mapChildren(this, env);
        return mapped.bind(g => {
            switch(g.constructor) {
                case SequenceGrammar:
                    return this.handleSequence(g as SequenceGrammar, env);
                default: 
                    return g;
            }
        });
    }

    handleSequence(g: SequenceGrammar, env: PassEnv): GrammarResult {
        const results: Grammar[] = [];
        for (const child of g.children) {

            const lastChild = results.pop();
            if (lastChild == undefined) { // results are still empty
                results.push(child);
                continue;
            }

            if (child instanceof LiteralGrammar && 
                    lastChild instanceof LiteralGrammar &&
                    child.tapeName == lastChild.tapeName) {
                const newLit = new LiteralGrammar(child.tapeName, lastChild.text + child.text);
                results.push(newLit);
                continue;
            } 
            
            results.push(lastChild);
            results.push(child);
        }

        if (results.length == 0) return new EpsilonGrammar().msg();
        if (results.length == 1) return results[0].msg();
        return new SequenceGrammar(results).msg();
    }
}
