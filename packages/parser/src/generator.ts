import { 
    constructAlternation, constructPriority,
    CounterStack, DerivEnv, 
    EpsilonExpr, Expr, ExprNamespace, 
    NullExpr, PriorityExpr, CollectionExpr, 
    DerivStats, EPSILON, Output, addOutput 
} from "./exprs";
import { TapeNamespace, Token, EpsilonToken } from "./tapes";
import { 
    Gen, GenOptions,
    msToTime, shuffleArray, StringDict
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
    const symbolNS = new ExprNamespace();
    const stats = new DerivStats();
    const env = new DerivEnv(tapeNS, symbolNS, stack, opt, stats);

    const startingTime = Date.now();

    let states: [Output, Expr][] = [[EPSILON, expr]];
    let prev: [Output, Expr] | undefined = undefined;
    
    // if we're generating randomly, we store candidates rather than output them immediately
    const candidates: Output[] = [];

    env.logDebug("");
    env.logDebugId("*** Generating for expr", expr);

    while (prev = states.pop()) {

        // first, if we're random, see if it's time to stop and 
        // randomly emit a result.  candidates will only be length > 0
        // if we're random.
        if (candidates.length > 0 && Math.random()) {
            break;
        }

        let nexts: [Output, Expr][] = [];
        let [prevOutput, prevExpr] = prev;

        env.logDebug("");
        env.logDebugOutput("prevOutput is", prevOutput);
        env.logDebugId("prevExpr is", prevExpr);


        if (prevExpr instanceof EpsilonExpr) {
            // we found a valid output and there's nothing left
            // we can do on this branch

            env.logDebugOutput("YIELD", prevOutput);
                
            // if we're random, don't yield immediately, wait
            if (opt.random) {
                candidates.push(prevOutput);
                continue;
            }

            // if we're not random, yield the result immediately.
            yield prevOutput.toDenotation();
            continue;
        } else if (prevExpr instanceof NullExpr) {
            // the search has failed here (there are no valid results
            // that have prevOutput as a prefix), so abandon this node 
            // and move on
            continue;
        } else if (prevExpr instanceof PriorityExpr || prevExpr instanceof CollectionExpr) {
            // we've neither found a valid output nor failed; there is 
            // still a possibility of finding an output with prevOutput
            // as its prefix
            // Note: we delay pushing the delta until we know whether
            // we need to merge it with a nulled tape output from deriv.
            const delta = prevExpr.openDelta(env);
            let deltaPushed: boolean = false;

            // next see where we can go on that tape, along any char
            // transition.
            for (const [cTape, cTarget, cNext] of prevExpr.openDeriv(env)) {
                if (!(cNext instanceof NullExpr)) {
                    let nextExpr: Expr = cNext;
                    let nextOutput: Output;
                    if (! (cTarget instanceof EpsilonToken)) {
                        nextOutput = addOutput(prevOutput, cTape, cTarget);
                    } else {
                        nextOutput = prevOutput;
                        if (!(delta instanceof NullExpr)) {
                            let tapes: string[] = [];
                            if (cNext instanceof PriorityExpr) {
                                tapes = cNext.tapes
                            } else if (cNext instanceof CollectionExpr && cNext.child instanceof PriorityExpr) {
                                tapes = cNext.child.tapes;
                            }
                            nextExpr = constructPriority(tapes, constructAlternation(delta, cNext));
                            deltaPushed = true;
                        }
                    }
                    nexts.push([nextOutput, nextExpr]);
                }
            }
            if (!deltaPushed && !(delta instanceof NullExpr)) {    
                nexts.push([prevOutput, delta]);
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

    env.logDebug("");
    env.logDebugId("*** Finished generating for expr", expr);
    env.logStates(`States visited: ${env.stats.statesVisited}`);
    const elapsedTime = msToTime(Date.now() - startingTime);
    env.logTime(`Generation time: ${elapsedTime}`);

    // if we get here, we've exhausted the search.  usually we'd be done,
    // but with randomness, it's possible to have cached all outputs but not
    // actually yielded any.  The following does so.

    if (candidates.length == 0) {
        return;
    }

    const candidateIndex = Math.floor(Math.random()*candidates.length);
    const candidateOutput = candidates[candidateIndex];
    yield candidateOutput.toDenotation();
} 
