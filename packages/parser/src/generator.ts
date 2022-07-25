import { 
    constructPriority, CounterStack, 
    EpsilonExpr, Expr, NullExpr, PriorityExpr 
} from "./exprs";
import { OutputTrie, TapeNamespace } from "./tapes";
import { 
    Gen, GenOptions, logDebug, logStates, 
    logTime, msToTime, shuffleArray, StringDict
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
 * @param [tapePriority] A list of tapes, in the order they should be tried
 * @param [tapeNS] A namespace associating tape names to tape information
 * @returns a generator of { tape: string } dictionaries, one for each successful traversal. 
 */
export function* generate(
    expr: Expr,
    tapeNS: TapeNamespace,
    opt: GenOptions
): Gen<StringDict> {
    const stack = new CounterStack(opt.maxRecursion);

    const startingTime = Date.now();

    const initialOutput: OutputTrie = new OutputTrie();

    let states: [OutputTrie, Expr][] = [[initialOutput, expr]];
    let prev: [OutputTrie, Expr] | undefined = undefined;
    
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

        let nexts: [OutputTrie, Expr][] = [];
        let [prevOutput, prevExpr] = prev;

        logDebug(opt.verbose, "");
        logDebug(opt.verbose, `prevOutput is ${JSON.stringify(prevOutput.toDict(tapeNS, opt))}`);
        logDebug(opt.verbose, `prevExpr is ${prevExpr.id}`);

        if (prevExpr instanceof EpsilonExpr) {
            // we found a valid output and there's nothing left
            // we can do on this branch

            logDebug(opt.verbose, `YIELD ${JSON.stringify(prevOutput.toDict(tapeNS, opt))} `)
                
            // if we're random, don't yield immediately, wait
            if (opt.random) {
                candidates.push(prevOutput);
                continue;
            }

            // if we're not random, yield the result immediately.
            yield* prevOutput.toDict(tapeNS, opt);
            continue;
        } else if (prevExpr instanceof NullExpr) {
            // the search has failed here (there are no valid results
            // that have prevOutput as a prefix), so abandon this node 
            // and move on
            continue;
        } else if (prevExpr instanceof PriorityExpr) {
            // we've neither found a valid output nor failed; there is 
            // still a possibility of 

            // first check whether epsilon is a valid result on the 
            // prioritizer's current tape
            const delta = prevExpr.openDelta(tapeNS, stack, opt);
            if (!(delta instanceof NullExpr)) {    
                nexts.push([prevOutput, delta]);
            }

            // next see where we can go on that tape, along any char
            // transition.
            for (const [cTape, cTarget, cNext] of prevExpr.openDeriv(tapeNS, stack, opt)) {
                if (!(cNext instanceof NullExpr)) {
                    const nextOutput = prevOutput.add(cTape, cTarget);
                    nexts.push([nextOutput, cNext]);
                }
            }
        } else {
            throw new Error("Encountered a non-eps, non-null, non-prioritizer as root");
        }

        // if random, shuffle the possibilities to search through next
        if (opt.random) {
            shuffleArray(nexts);
        }

        // add the new ones to the stack
        states.push(...nexts);
    }
    
    logStates(opt.verbose, `States visited: ${stateCounter}`)

    const elapsedTime = msToTime(Date.now() - startingTime);
    logTime(opt.verbose, `Generation time: ${elapsedTime}`);

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