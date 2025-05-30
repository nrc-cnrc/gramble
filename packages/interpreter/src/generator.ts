import { 
    DerivEnv, 
    EpsilonExpr, Expr,
    NullExpr, 
    DerivStats,
    OutputExpr,
    ForwardGen
} from "./exprs.js";
import { CounterStack } from "./utils/counter.js";
import { 
    Gen,
    iterTake,
    StringDict
} from "./utils/func.js";
import { msToTime } from "./utils/logging.js";
import { Options } from "./utils/options.js";
import { randomCut } from "./utils/random.js";

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
    random: boolean,
    opt: Options
): Gen<StringDict> {
    const stack = new CounterStack(opt.maxRecursion);
    const stats = new DerivStats();
    const env = new DerivEnv(opt, {}, stack, 
                    new Set(), false, random, stats);

    const NEXTS_TO_TAKE = random ? 1 : Infinity;
    const startingTime = Date.now();

    let states: (Expr|ForwardGen)[] = [expr];
    let prev: Expr | ForwardGen | undefined = undefined;

    env.logExpr("");
    env.logExprId("*** Generating for expr", expr);

    while (prev = states.pop()) {

        env.logExpr("");

        if (prev instanceof Expr) {
            env.logExprOutput("prevOutput is", prev);
            env.logExprId("prevExpr is", prev);
        }

        if (prev instanceof EpsilonExpr || prev instanceof OutputExpr) {
            env.logExprOutput("YIELD", prev);
            const outputs = prev.getOutputs(env);
            yield* randomCut(outputs, env.random);
            continue;
        }
        
        if (prev instanceof NullExpr) {
            continue;
        }

        const forwardGen = prev instanceof Expr ?
                                prev.forward(env) :
                                prev;
        const [partialResults, remainder] = iterTake(forwardGen, NEXTS_TO_TAKE);
        if (partialResults.length == NEXTS_TO_TAKE) {
            states.push(remainder);
        }

        for (const [cHandled, cNext] of partialResults) {
            if (cNext instanceof NullExpr) continue;
            if (!(cNext instanceof EpsilonExpr || cNext instanceof OutputExpr) &&
                    !cHandled) {
                const prevID = prev instanceof Expr ? prev.id : "GEN";
                throw new Error(`Unhandled forward: prev = ${prevID}, next = ${cNext.id}`);
            }
            env.logExprOutput("->", cNext);
            states.push(cNext);
        }
    }

    env.logExpr("");
    env.logExprId("*** Finished generating for expr", expr);
    env.logStates(`States visited: ${env.stats.statesVisited}`);
    const elapsedTime = msToTime(Date.now() - startingTime);
    env.logTime(`Generation time: ${elapsedTime}`);
} 
