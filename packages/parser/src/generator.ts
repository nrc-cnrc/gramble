import { 
    CounterStack, DerivEnv, 
    EpsilonExpr, Expr, ExprNamespace, 
    NullExpr, 
    DerivStats,
    OutputExpr,
    GenExpr
} from "./exprs";
import { TapeNamespace } from "./tapes";
import { 
    Gen, GenOptions,
    iterTake,
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

    let states: Expr[] = [expr];
    let prev: Expr | undefined = undefined;

    env.logDebug("");
    env.logDebugId("*** Generating for expr", expr);

    while (prev = states.pop()) {

        let nexts: Expr[] = [];
        let prevExpr = prev;

        env.logDebug("");
        env.logDebugOutput("prevOutput is", prevExpr);
        env.logDebugId("prevExpr is", prevExpr);

        if (prevExpr instanceof EpsilonExpr || prevExpr instanceof OutputExpr) {
            env.logDebugOutput("YIELD", prevExpr);

            // if we're not random, yield the result immediately.
            const outputs = prevExpr.getOutputs()
            yield* outputs;
            continue;
            
        }
        
        if (prevExpr instanceof NullExpr) {
            // the search has failed here (there are no valid results
            // that have prevOutput as a prefix), so abandon this node 
            // and move on
            continue;
        }
        
        const AMOUNT_TO_TAKE = 50;
        const generator = prevExpr.forward(env);
        const [partialResults, remainingGenerator] = iterTake(generator, AMOUNT_TO_TAKE);
        if (partialResults.length == AMOUNT_TO_TAKE) {
            nexts.push(new GenExpr(remainingGenerator));
        }

        for (const [cHandled, cNext] of partialResults) {
            
            if (cNext instanceof NullExpr) continue;
            if (!(cNext instanceof EpsilonExpr || cNext instanceof OutputExpr) &&
                    !cHandled) {
                throw new Error(`Unhandled forward: prev = ${prevExpr.id}, next = ${cNext.id}`);
            }
            env.logDebugOutput("->", cNext);
            nexts.push(cNext);
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
} 
