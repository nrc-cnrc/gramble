import { CounterStack, DerivResult, EpsilonExpr, Expr, NullExpr } from "./exprs";
import { Token, OutputTrie, TapeNamespace, BitsetToken, EntangledToken } from "./tapes";
import { 
    ANY_CHAR_STR, BITSETS_ENABLED, Gen, 
    GenOptions, logDebug, logStates, logTime, msToTime, shuffleArray, StringDict, 
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
    const generator = new Generator();

    const stack = new CounterStack(opt.maxRecursion);
    yield* generator.generate(expr, tapePriority, tapeNS, stack, opt);

}

class Generator {

    public *generate(
        expr: Expr,
        tapePriority: string[],
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<StringDict> {

        const startingTime = Date.now();

        const initialOutput: OutputTrie = new OutputTrie();
        const tapePrioritizer: PrioritizerOutput = constructPrioritizer(tapePriority, expr);

        let states: [OutputTrie, PrioritizerOutput][] = [[initialOutput, tapePrioritizer]];
        let prev: [OutputTrie, PrioritizerOutput] | undefined = undefined;
        
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

            let nexts: [OutputTrie, PrioritizerOutput][] = [];
            let [prevOutput, prevExpr] = prev;
 
            logDebug(opt.verbose, "");
            logDebug(opt.verbose, `prevOutput is ${JSON.stringify(prevOutput.toDict(tapeNS, opt))}`);
            logDebug(opt.verbose, `prevExpr is ${prevExpr.id}`);

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

            if (prevExpr instanceof NullExpr) {
                continue;
            }

            const delta = prevExpr.delta(tapeNS, stack, opt);
            if (!(delta instanceof NullExpr)) {    
                nexts.push([prevOutput, delta]);
            }

            for (const [cTape, cTarget, cNext] of prevExpr.deriv(tapeNS, stack, opt)) {
                if (!(cNext instanceof NullExpr)) {
                    const nextOutput = prevOutput.add(cTape, cTarget);
                    nexts.push([nextOutput, cNext]);
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

}

class TapePrioritizer {

    constructor(
        public tapes: string[],
        public child: Expr
    ) { }

    public get id(): string {
        return `${this.tapes}:${this.child.id}`;
    }

    public delta(
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): PrioritizerOutput {
        const tapeToTry = this.tapes[0];
        const childDelta = this.child.delta(tapeToTry, tapeNS, stack, opt);
        logDebug(opt.verbose, `d^${tapeToTry} is ${childDelta.id}`);
        const newTapes = this.tapes.slice(1);
        return constructPrioritizer(newTapes, childDelta);
    }

    public *deriv(
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[string, Token, PrioritizerOutput]> {

        const tapeToTry = this.tapes[0];
        // rotate the tapes so that we don't just 
        // keep trying the same one every time
        const newTapes = [... this.tapes.slice(1), tapeToTry];
        const tape = tapeNS.get(tapeToTry);
        const startingToken = BITSETS_ENABLED ? tape.any : ANY_CHAR_STR;

        for (const [cTarget, cNext] of 
                this.child.disjointDeriv(tapeToTry, startingToken, tapeNS, stack, opt)) {

            if (!(cNext instanceof NullExpr)) {      
                logDebug(opt.verbose, `D^${tapeToTry}_${cTarget} is ${cNext.id}`);
                const successor = constructPrioritizer(newTapes, cNext);
                yield [tapeToTry, cTarget, successor];
            }
        }
    }
}

function constructPrioritizer(tapes: string[], child: Expr): PrioritizerOutput {

    if (tapes.length == 0) {
        if (!(child instanceof NullExpr || child instanceof EpsilonExpr)) {
            throw new Error(`warning, nontrivial expr at end: ${child.id}`);
        }
        return child;
    }

    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }

    return new TapePrioritizer(tapes, child);
}

type PrioritizerOutput = EpsilonExpr | NullExpr | TapePrioritizer;