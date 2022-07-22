import { CounterStack, EpsilonExpr, Expr, NullExpr } from "./exprs";
import { Token, OutputTrie, TapeNamespace, BitsetToken, EntangledToken } from "./tapes";
import { 
    ANY_CHAR_STR, BITSETS_ENABLED, Gen, 
    GenOptions, logDebug, logStates, shuffleArray, StringDict, 
    VERBOSE_DEBUG, VERBOSE_STATES, VERBOSE_TIME 
} from "./util";

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

abstract class Generator {

    public abstract deriv(
        expr: Expr,
        tapeName: string,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[Token, Expr]>;

    public *generate(
        expr: Expr,
        tapePriority: string[],
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<StringDict> {

        const initialOutput: OutputTrie = new OutputTrie();
        let states: [string[], OutputTrie, Expr][] = [[tapePriority, initialOutput, expr]];
        let prev: [string[], OutputTrie, Expr] | undefined = undefined;
        
        // if we're generating randomly, we store candidates rather than output them immediately
        const candidates: OutputTrie[] = [];

        let stateCounter = 0;

        while (prev = states.pop()) {

            stateCounter++;

            // first, if we're random, see if it's time to stop and 
            // randomly emit a result.  candidates will only be length > 0
            // if we're random.
            if (candidates.length > 0 && Math.random()) {
                break;
            }

            let nexts: [string[], OutputTrie, Expr][] = [];
            let [tapes, prevOutput, prevExpr] = prev;
 
            logDebug(opt.verbose, "");
            logDebug(opt.verbose, `prevOutput is ${JSON.stringify(prevOutput.toDict(tapeNS, opt))}`);
            logDebug(opt.verbose, `prevExpr is ${prevExpr.id}`);
            logDebug(opt.verbose, `remaining tapes are [${tapes}]`);

            if (prevExpr instanceof EpsilonExpr) {
                // we found a valid output

                logDebug(opt.verbose, `YIELD ${JSON.stringify(prevOutput.toDict(tapeNS, opt))} `)
                    
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
            logDebug(opt.verbose, `d^${tapeToTry} is ${delta.id}`);

            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta]);
            }

            // rotate the tapes so that we don't just 
            // keep trying the same one every time
            tapes = [... tapes.slice(1), tapes[0]];

            for (const [cTarget, cNext] of 
                    this.deriv(prevExpr, tapeToTry, tapeNS, stack, opt)) {

                if (!(cNext instanceof NullExpr)) {      
                    logDebug(opt.verbose, `D^${tapeToTry}_${cTarget} is ${cNext.id}`);
                    const nextOutput = prevOutput.add(tapeToTry, cTarget);
                    nexts.push([tapes, nextOutput, cNext]);
                }
            }

            // if random, shuffle the possibilities to search through next
            if (opt.random) {
                shuffleArray(nexts);
            }

            // add the new ones to the stack
            states.push(...nexts);
        }
        
        logStates(opt.verbose, `States visited: ${stateCounter}`)

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

class StringGenerator extends Generator {

    public *deriv(
        expr: Expr,
        tapeName: string,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[Token, Expr]> {
        yield* expr.disjointDeriv(tapeName, ANY_CHAR_STR, tapeNS, stack, opt);
    }

}

class BitsetGenerator extends Generator {
        
    public *deriv(
        expr: Expr,
        tapeName: string,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[Token, Expr]> {
        const tape = tapeNS.get(tapeName);
        yield* expr.disjointDeriv(tapeName, tape.any, tapeNS, stack, opt);
    }

}