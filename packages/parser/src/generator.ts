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

    if (opt.random) {
        yield* generator.generateRandom(expr, tapes, stack, opt);
        return;
    } 

    yield* generator.generateDepthFirst(expr, tapes, stack, opt);

}

export abstract class Generator<T extends AbstractToken> {

    public abstract deriv(
        expr: Expr,
        tape: Tape, 
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[T, Expr]>;

    public *generateDepthFirst(
        expr: Expr,
        tapes: Tape[],
        stack: CounterStack,
        opt: GenOptions
    ): Gen<StringDict> {
        const initialOutput: OutputTrie<T> = new OutputTrie<T>();
        let states: [Tape[], OutputTrie<T>, Expr][] = [[tapes, initialOutput, expr]];
        let prev: [Tape[], OutputTrie<T>, Expr] | undefined = undefined;
        while (prev = states.pop()) {

            let nexts: [Tape[], OutputTrie<T>, Expr][] = [];
            let [tapes, prevOutput, prevExpr] = prev;
 
            if (VERBOSE) {
                console.log();
                console.log(`prevOutput is ${JSON.stringify(prevOutput.toDict(opt))}`);
                console.log(`prevExpr is ${prevExpr.id}`);
                console.log(`remaining tapes are ${tapes.map(t => t.tapeName)}`);
            }

            if (prevExpr instanceof EpsilonExpr) {
                if (VERBOSE) {
                    console.log(`YIELD ${JSON.stringify(prevOutput.toDict(opt))} `)
                }
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


            states.push(...nexts);
        }
    } 

    public *generateRandom(
        expr: Expr,
        tapes: Tape[],
        stack: CounterStack,
        opt: GenOptions
    ): Gen<StringDict> {
        const initialOutput: OutputTrie<string> = new OutputTrie();

        let states: [Tape[], OutputTrie<string>, Expr][] = [[tapes, initialOutput, expr]];
        const candidates: OutputTrie<string>[] = [];

        let prev: [Tape[], OutputTrie<string>, Expr] | undefined = undefined;
        while (prev = states.pop()) {

            // first, see if it's time to randomly emit a result
            if (Math.random() < 0.1 && candidates.length > 0) {
                const candidateIndex = Math.floor(Math.random()*candidates.length);
                const candidateOutput = candidates.splice(candidateIndex, 1)[0];
                yield* candidateOutput.toDict(opt);
            }

            let nexts: [Tape[], OutputTrie<string>, Expr][] = [];
            let [tapes, prevOutput, prevExpr] = prev;

            if (prevExpr instanceof EpsilonExpr) {
                candidates.push(prevOutput);
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
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta]);
            }

            // rotate the tapes so that we don't keep trying the same one every time
            tapes = [... tapes.slice(1), tapes[0]];

            for (const [cTarget, cNext] of prevExpr.stringDeriv(tapeToTry, ANY_CHAR_STR, stack, opt)) {

                if (cTarget == ANY_CHAR_STR) {
                    for (const c of tapeToTry.fromToken(tapeToTry.tapeName, tapeToTry.any())) {
                        //const cToken = tapeToTry.toToken(tapeToTry.tapeName, c);
                        const nextOutput = prevOutput.add(tapeToTry, c);
                        nexts.push([tapes, nextOutput, cNext]);
                    }
                    continue;
                }

                //const cToken = tapeToTry.toToken(tapeToTry.tapeName, cTarget);
                const nextOutput = prevOutput.add(tapeToTry, cTarget);
                nexts.push([tapes, nextOutput, cNext]);
            }

            shuffleArray(nexts);
            states.push(...nexts);
        }

        if (candidates.length == 0) {
            return;
        }

        const candidateIndex = Math.floor(Math.random()*candidates.length);
        const candidateOutput = candidates.splice(candidateIndex, 1)[0];
        yield* candidateOutput.toDict(opt);
    }

}

export class StringGenerator extends Generator<string> {

    public *deriv(
        expr: Expr,
        tape: Tape,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[string, Expr]> {
        yield* expr.disjointStringDeriv(tape, ANY_CHAR_STR, stack, opt);
    }

}

export class BitsetGenerator extends Generator<Token> {
        
    public *deriv(
        expr: Expr,
        tape: Tape,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[Token, Expr]> {
        for (const [_, token, next] of 
                expr.disjointBitsetDeriv(tape, tape.any(), stack)) {
            yield [token, next];
        }
    }

}