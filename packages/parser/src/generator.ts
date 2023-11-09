import { 
    CounterStack, DerivEnv, 
    EpsilonExpr, Expr, ExprNamespace, 
    NullExpr, 
    DerivStats,
    OutputExpr,
    ForwardGen,
    randomCut
} from "./exprs";
import { TapeNamespace } from "./tapes";
import { 
    Gen,
    iterTake,
    StringDict
} from "./util";
import { msToTime } from "./utils/logging";
import { Options } from "./utils/options";

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
    random: boolean,
    opt: Options
): Gen<StringDict> {
    const stack = new CounterStack(opt.maxRecursion);
    const symbolNS = new ExprNamespace();
    const stats = new DerivStats();
    const env = new DerivEnv(opt, tapeNS, symbolNS, stack, random, stats);

    const NEXTS_TO_TAKE = random ? 1 : Infinity;
    const startingTime = Date.now();

    let states: (Expr|ForwardGen)[] = [expr];
    let prev: Expr | ForwardGen | undefined = undefined;

    env.logDebug("");
    env.logDebugId("*** Generating for expr", expr);

    while (prev = states.pop()) {

        env.logDebug("");

        if (prev instanceof Expr) {
            env.logDebugOutput("prevOutput is", prev);
            env.logDebugId("prevExpr is", prev);
        }

        if (prev instanceof EpsilonExpr || prev instanceof OutputExpr) {
            env.logDebugOutput("YIELD", prev);
            const outputs = prev.getOutputs(env);
            yield* randomCut(outputs, env);
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
            env.logDebugOutput("->", cNext);
            states.push(cNext);
        }
    }

    env.logDebug("");
    env.logDebugId("*** Finished generating for expr", expr);
    env.logStates(`States visited: ${env.stats.statesVisited}`);
    const elapsedTime = msToTime(Date.now() - startingTime);
    env.logTime(`Generation time: ${elapsedTime}`);
} 
