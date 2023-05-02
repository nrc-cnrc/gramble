import { 
    Grammar,
    GrammarResult,
    SequenceGrammar,
    LiteralGrammar,
    EpsilonGrammar
} from "../grammars";
import { Pass, PassEnv } from "../passes";

/**
 * Plaintext/regex parsing results in a lot of single-character
 * literals (e.g. `t1:a + t1:b + t1:c`); this joins them into
 * `t1:abc`.  This is faster (because moving on to the next char
 * in a literal is one step, whereas moving on from a concatenation
 * of literals is two), and also allows further optimizations like
 * atomicity.
 */
export class CombineLiterals extends Pass<Grammar,Grammar> {

    public get desc(): string {
        return "Combining literals";
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
