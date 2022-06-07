import { CounterStack, EpsilonExpr, Expr, GenOptions, NullExpr } from "./exprs";
import { AbstractToken, OutputTrie, TapeNamespace, Token } from "./tapes";
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
    tapePriority: string[],
    tapeNS: TapeNamespace,
    opt: GenOptions
): Gen<StringDict> {

    const generator = BITSETS_ENABLED ? 
                        new BitsetGenerator() : 
                        new StringGenerator();

    const stack = new CounterStack(opt.maxRecursion);
    yield* generator.generate(expr, tapePriority, tapeNS, stack, opt);

}

abstract class Generator<T extends AbstractToken> {

    public abstract deriv(
        expr: Expr,
        tapeName: string,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[T, Expr]>;

    public *generate(
        expr: Expr,
        tapePriority: string[],
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<StringDict> {
        const initialOutput: OutputTrie<T> = new OutputTrie<T>();
        let states: [string[], OutputTrie<T>, Expr][] = [[tapePriority, initialOutput, expr]];
        let prev: [string[], OutputTrie<T>, Expr] | undefined = undefined;
        
        // if we're generating randomly, we store candidates rather than output them immediately
        const candidates: OutputTrie<T>[] = [];

        while (prev = states.pop()) {

            // first, if we're random, see if it's time to stop and 
            // randomly emit a result.  candidates will only be length > 0
            // if we're random.
            if (candidates.length > 0 && Math.random()) {
                break;
            }

            let nexts: [string[], OutputTrie<T>, Expr][] = [];
            let [tapes, prevOutput, prevExpr] = prev;
 
            if (VERBOSE) {
                console.log();
                console.log(`prevOutput is ${JSON.stringify(prevOutput.toDict(tapeNS, opt))}`);
                console.log(`prevExpr is ${prevExpr.id}`);
                console.log(`remaining tapes are [${tapes})]`);
            }

            if (prevExpr instanceof EpsilonExpr) {
                // we found a valid output

                if (VERBOSE) {
                    console.log(`YIELD ${JSON.stringify(prevOutput.toDict(tapeNS, opt))} `)
                }
                    
                // if we're random, don't yield immediately, wait
                if (opt.random) {
                    candidates.push(prevOutput);
                    continue;
                }

                // if we're not random, yield the result immediately.
                yield* prevOutput.toDict(tapeNS, opt);
                continue;
            }
            
            if (tapes.length == 0) {
                if (!(prevExpr instanceof NullExpr || prevExpr instanceof EpsilonExpr)) {
                    throw new Error(`warning, nontrivial expr at end: ${prevExpr.id}`);
                }
                continue; 
            }
                
            const tapeToTry = tapes[0];
            
            const delta = prevExpr.delta(tapeToTry, tapeNS, stack, opt);
            if (VERBOSE) {
                console.log(`d^${tapeToTry} is ${delta.id}`);
            }
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta]);
            }

            // rotate the tapes so that we don't just 
            // keep trying the same one every time
            tapes = [... tapes.slice(1), tapes[0]];

            for (const [cTarget, cNext] of 
                    this.deriv(prevExpr, tapeToTry, tapeNS, stack, opt)) {
                
                if (VERBOSE) {
                    console.log(`D^${tapeToTry}_${cTarget} is ${cNext.id}`);
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
        yield* candidateOutput.toDict(tapeNS, opt);
    } 

}

class StringGenerator extends Generator<string> {

    public *deriv(
        expr: Expr,
        tapeName: string,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[string, Expr]> {
        yield* expr.disjointStringDeriv(tapeName, ANY_CHAR_STR, tapeNS, stack, opt);
    }

}

class BitsetGenerator extends Generator<Token> {
        
    public *deriv(
        expr: Expr,
        tapeName: string,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[Token, Expr]> {
        const tape = tapeNS.get(tapeName);
        yield* expr.disjointBitsetDeriv(tapeName, tape.any, tapeNS, stack, opt);
    }

}