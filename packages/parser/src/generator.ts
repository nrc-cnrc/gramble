import { CounterStack, EpsilonExpr, Expr, GenOptions, NullExpr } from "./exprs";
import { AbstractToken, OutputTrie, Tape, Token } from "./tapes";
import { ANY_CHAR_STR, BITSETS_ENABLED, Gen, shuffleArray, StringDict, VERBOSE } from "./util";

/**
 * Performs a breadth-first traversal of the graph.  This will be the function that most 
 * clients will be calling.
 * 
 * Even parsing is just calling generate.  (It's a separate function only because of a
 * complication with compilation.)  To do parses, we
 * join the grammar with a grammar corresponding to the query.  E.g., if we wanted to parse
 * { text: "foo" } in grammar X, we would construct JoinExpr(LiteralExpr("text", "foo"), X).
 * The reason for this is that it allows us a diverse collection of query types for free, by
 * choosing an appropriate "query grammar" to join X with.
 * 
 * @param [expr] An expression to be evaluated
 * @param [tapes] A list of tapes, in the order they should be tried
 * @returns a generator of { tape: string } dictionaries, one for each successful traversal. 
 */
export function* generate(
    expr: Expr,
    tapes: Tape[],
    opt: GenOptions
): Gen<StringDict> {

    const generator = BITSETS_ENABLED ? 
                        new BitsetGenerator() : 
                        new StringGenerator();

    const stack = new CounterStack(opt.maxRecursion);
    yield* generator.generate(expr, tapes, stack, opt);

}

abstract class Generator<T extends AbstractToken> {

    public abstract deriv(
        expr: Expr,
        tape: Tape, 
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[T, Expr]>;

    public *generate(
        expr: Expr,
        tapes: Tape[],
        stack: CounterStack,
        opt: GenOptions
    ): Gen<StringDict> {
        const initialOutput: OutputTrie<T> = new OutputTrie<T>();
        let states: [Tape[], OutputTrie<T>, Expr][] = [[tapes, initialOutput, expr]];
        let prev: [Tape[], OutputTrie<T>, Expr] | undefined = undefined;
        
        // if we're generating randomly, we store candidates rather than output them immediately
        const candidates: OutputTrie<T>[] = [];

        while (prev = states.pop()) {

            // first, if we're random, see if it's time to stop and randomly emit a result
            if (opt.random && Math.random() < 0.1 && candidates.length > 0) {
                break;
            }

            let nexts: [Tape[], OutputTrie<T>, Expr][] = [];
            let [tapes, prevOutput, prevExpr] = prev;
 
            if (VERBOSE) {
                console.log();
                console.log(`prevOutput is ${JSON.stringify(prevOutput.toDict(opt))}`);
                console.log(`prevExpr is ${prevExpr.id}`);
                console.log(`remaining tapes are ${tapes.map(t => t.tapeName)}`);
            }

            if (prevExpr instanceof EpsilonExpr) {
                // we found a valid output

                if (VERBOSE) {
                    console.log(`YIELD ${JSON.stringify(prevOutput.toDict(opt))} `)
                }
                    
                // if we're random, don't yield immediately, wait
                if (opt.random) {
                    candidates.push(prevOutput);
                    continue;
                }

                // if we're not random, yield the result immediately.
                yield* prevOutput.toDict(opt);
                continue;
            }
            
            if (tapes.length == 0) {
                if (!(prevExpr instanceof NullExpr || prevExpr instanceof EpsilonExpr)) {
                    throw new Error(`warning, nontrivial expr at end: ${prevExpr.id}`);
                }
                continue; 
            }
                
            const tapeToTry = tapes[0];

            const delta = prevExpr.delta(tapeToTry, stack);
            if (VERBOSE) {
                console.log(`d^${tapeToTry.tapeName} is ${delta.id}`);
            }
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta]);
            }

            // rotate the tapes so that we don't just 
            // keep trying the same one every time
            tapes = [... tapes.slice(1), tapes[0]];

            for (const [cTarget, cNext] of 
                    this.deriv(prevExpr, tapeToTry, stack, opt)) {
                
                if (VERBOSE) {
                    console.log(`D^${tapeToTry.tapeName}_${cTarget} is ${cNext.id}`);
                }

                const nextOutput = prevOutput.add(tapeToTry, cTarget);
                nexts.push([tapes, nextOutput, cNext]);
            }

            // if random, shuffle the possibilities to search through next
            if (opt.random) {
                shuffleArray(nexts);
            }

            // add the new ones to the stack
            states.push(...nexts);
        }

        // if we get here, we've exhausted the search.  usually we'd be done,
        // but with randomness, it's possible to have cached all outputs but not
        // actually yielded any.  The following does so.

        if (candidates.length == 0) {
            return;
        }

        const candidateIndex = Math.floor(Math.random()*candidates.length);
        const candidateOutput = candidates[candidateIndex];
        yield* candidateOutput.toDict(opt);
    } 

}

class StringGenerator extends Generator<string> {

    public *deriv(
        expr: Expr,
        tape: Tape,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[string, Expr]> {
        yield* expr.disjointStringDeriv(tape, ANY_CHAR_STR, stack, opt);
    }

}

class BitsetGenerator extends Generator<Token> {
        
    public *deriv(
        expr: Expr,
        tape: Tape,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[Token, Expr]> {
        for (const [token, next] of 
                expr.disjointBitsetDeriv(tape, tape.any(), stack, opt)) {
            yield [token, next];
        }
    }

}