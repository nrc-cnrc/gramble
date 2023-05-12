import { 
    Grammar,
    SequenceGrammar,
    LiteralGrammar,
    EpsilonGrammar
} from "../grammars";
import { PassEnv } from "../passes";
import { PostPass } from "./ancestorPasses";

/**
 * Plaintext/regex parsing results in a lot of single-character
 * literals (e.g. `t1:a + t1:b + t1:c`); this joins them into
 * `t1:abc`.  This is faster (because moving on to the next char
 * in a literal is one step, whereas moving on from a concatenation
 * of literals is two), and also allows further optimizations like
 * atomicity.
 */
export class CombineLiterals extends PostPass<Grammar> {

    public get desc(): string {
        return "Combining literals";
    }

    public postTransform(g: Grammar, env: PassEnv): Grammar {
        switch(g.tag) {
            case "seq": return this.handleSequence(g, env);
            default:    return g;
        }
    }

    handleSequence(g: SequenceGrammar, env: PassEnv): Grammar {
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

        if (results.length == 0) return new EpsilonGrammar();
        if (results.length == 1) return results[0];
        return new SequenceGrammar(results);
    }
}
