import { Gen, setDifference, shuffleArray, StringDict } from "./util";
import { MultiTapeOutput, Tape, RenamedTape, Token, ANY_CHAR } from "./tapes";
import BitSet from "bitset";

/**
 * This is the parsing/generation engine that underlies Gramble.
 * It generalizes Brzozowski derivatives (Brzozowski, 1964) to
 * multi-tape languages.
 * 
 *      - "Multi-tape" means that there are multiple "tapes"
 *      (in the Turing machine sense) from/to which the machine
 *      can read/write.  Finite-state acceptors are one-tape automata,
 *      they read in from one tape and either succeed or fail.  Finite-
 *      state transducers are two-tape automata, reading from one and
 *      writing to another.  This system allows any number of tapes, and
 *      reading/writing from them in any combination.  (E.g. you could have
 *      five tapes A,B,C,D,E, have the input tapes be B and C and the outputs
 *      be A,D,E.  You don't need to specify this in advance, the grammar just
 *      expresses a relationship between tapes, not the direction 
 *      of the "parse".)
 * 
 * The basic idea of a Brzozowski derivative is easy.  Consider a language that
 * only consists of the following six words 
 * 
 *    L = { "apple", "avocado", "banana", "blueberry", "cherry", "date" }
 * 
 * The Brzozowski derivative with respect to the character "b" of the above is
 * 
 *    D_b(L) = { "anana", "lueberry" }
 * 
 * Easy, no?  But we can also do this for languages that we haven't written out in 
 * full like this -- languages that we've only expressed in terms of a grammar.  For
 * example, here are the rules for union (| here) and the 
 * Kleene star with respect to some character c:
 * 
 *    D_c(A|B) = D_c(A) | D_c(B)
 *    D_c(A*) = D_c(A) + A*
 * 
 * In other words, we can distribute the derivative operation to the components of each grammar
 * element, depending on which grammar element it is, and eventually down to atomic elements like
 * literals.
 * 
 *   D_c("banana") = "anana" if c == "b"
 *                   0 otherwise
 * 
 * There is also an operation 𝛿 that checks if the grammar contains the empty string; if
 * so, it returns the set containing the empty string, otherwise it returns 0.
 * 
 *   L2 = { "", "abc", "de", "f" }
 *   𝛿(L2) = {""}
 * 
 *   L2 = { "abc", "de", "f" }
 *   𝛿(L2) = {}
 * 
 * Brzozowski proved that all regular grammars have only finitely many derivatives (even if 
 * the grammar itself generates infinitely).
 * 
 * You can generate from a grammar L by trying each possible letter for c, and then, for 
 * each derivative L' in D_c(L), trying each possible letter again to get L'' in D_c(L'), etc.
 * If you put those letters c into a tree, you've got L again, but this time in trie form. 
 * That's basically what we're doing!  Except we're not iterating through each letter each time; 
 * instead we're using sets of letters (expressed as bit sets).
 * 
 * A lot of our implementation of this algorithm uses the metaphor that these are states in a state
 * machine that has not been fully constructed yet.  You can picture the process of taking a Brz. 
 * derivative as moving from a state to a state along an edge labeled "c", but where instead of the state
 * graph already being constructed and in memory, each state constructing its successors on demand.  
 * Since states corresponding to (say) a particular position within a literal construct their successors
 * differently than those that (say) start off a subgraph corresponding to a Union, they belong to different 
 * classes here: there's a LiteralExpr, a UnionExpr, etc. that differ in how they construct 
 * their successors, and what information they need to keep track of to do so.  LiteralExprs, for example,
 * need to keep track of what that literal is and how far along they are within it.
 * 
 * Brzozowski derivatives can be applied to grammars beyond regular ones -- they're well-defined
 * on context-free grammars, and here we generalize them to multi-tape grammars.  Much of the complexity
 * here isn't in constructing the derivative (which is often easy) but in bookkeeping the multiple tapes,
 * dealing with sampling randomly from a grammar or compiling it into a more efficient grammar, etc.
 * 
 * Although an unoptimized Brzozowski-style algorithm has poor runtime complexity, the benefit of it to
 * us is that it gives us an easy-to-conceptualize flexibility between top-down parsing (poor runtime 
 * complexity, good space complexity) and compiling a grammar to a state graph (good runtime complexity, 
 * poor space complexity).  The reason for this is we can use the Brz. algorithm to actually
 * construct the state graph, but then still use the Brz. algorithm on that state graph (the Brz. derivative
 * of a language expressed as a state graph is easy, just follow that edge labeled "c").  That is to say,
 * compiling the state graph is just pre-running the algorithm.  This gives us a way to think about the 
 * _partial_ compilation of a grammar, and lets us decide things like where we want to allocate a potentially
 * limited compilation budget to the places it's going to matter the most at runtime.
 */

/**
 * CounterStack
 * 
 * A convenience class that works roughly like Python's collections.Counter.  Just
 * note that add() is non-destructive; it returns a new Counter without changing the original.
 * So use it like:
 * 
 *  * counter = counter.add("verb");
 * 
 * We use this to make sure we don't recurse an impractical number of times, like
 * infinitely.  
 * 
 * Infinite recursion is *correct* behavior for a grammar that's
 * genuinely infinite, but because this system is meant to be embedded in a 
 * programming language meant for beginner programmers,
 * we default to allowing four recursions before stopping recursion.  Advanced 
 * programmers will be able to turn this off and allow infinite recursion, but they
 * have to take an extra step to do so.
 */

export type SymbolTable = {[key: string]: Expr};

export class CounterStack {

    constructor(
        public max: number = 4
    ) { }

    public stack: {[key: string]: number} = {};
    public id: string = "ground";

    public add(key: string) {
        const result = new CounterStack(this.max);
        result.stack[key] = 0;
        Object.assign(result.stack, this.stack);
        result.stack[key] += 1;
        result.id = key + result.stack[key];
        return result;
    }

    public get(key: string): number {
        return (key in this.stack) ? this.stack[key] : 0;
    }

    public exceedsMax(key: string): boolean {
        return this.get(key) >= this.max;
    }

    public tostring(): string {
        return JSON.stringify(this.stack);
    }
}

const ANY_CHAR_STR = "__ANY_CHAR__";


/**
 * Expr is the basic class of the parser; it represents a symbolic 
 * expression like A|B or epsilon+(C&D).  These expressions also represent 
 * "states" or "nodes" in a (potentially abstract) state graph; this class was
 * originally called "State".  (You can think of Brzozowski's algorithm as 
 * simultaneously constructing and traversing a FSA.  Calculating the Brz. derivative of
 * expression A with respect to some character "c" can be conceptualized as following
 * the transition, labeled "c", between a node corresponding to A and a node 
 * corresponding to its derivative expression.)
 * 
 * There are three kinds of "transitions" that we can follow:
 * 
 *    deriv(T, c): The basic derivative function; it calculates the derivative
 *            w.r.t. character set c on tape T, but it doesn't guarantee that the
 *            results are disjoint.  (In other words, this will only create an
 *            abstract NDFSA, here nd (non-deterministic).)
 * 
 *    disjointDeriv(T, c): Determinizes the derivative; in our case that means that making
 *            sure the returned character sets are disjoint.  This is necessary for
 *            getting negation right, and we also call this at the highest level to 
 *            collapse trivially-identical results.
 * 
 *    delta(T): A derivative w.r.t. epsilon: it returns only those languages where the
 *            contents of tape T are epsilon.
 */

export abstract class Expr {

    /**
     * Gets an id() for the expression.  At the moment we're only using this
     * for debugging purposes, but we may want to use it in the future
     * as a unique identifier for a node in explicit graph construction.
     * 
     * If we do this, we should go through and make sure that IDs are actually
     * unique; right now they're often not.
     */
    public abstract get id(): string;

    public abstract concreteDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): Gen<[string, Expr]>;

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        return {};
    }

    public abstract delta(tape: Tape, stack: CounterStack): Expr;

    /**
     * Calculates the Brzozowski derivative of this expression.
     * 
     * The workhorse function of the parser, taking a <tape, char> pair and trying to match it to a transition
     * (e.g., matching it to the next character of a [LiteralExpr]).  It yields all matching <tape, char> pairs, and the respective
     * nextExprs to which we should move upon a successful transition.
     * 
     * Note that an deriv()'s results may "overlap" in the sense that you may get the same matched character
     * twice -- in the FSA metaphor, you might have two transitions to different states with the same label.
     * For some parts of the algorithm, this would be inappropriate (i.e., inside of a negation).  So rather
     * than call deriv() directly, call disjointDeriv, which calls deriv() and then adjusts
     * the results so that the results are disjoint.
     * 
     * @param tape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param stack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple [tape, match, next] where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * next is the derivative expression
     */

    public abstract deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]>;
        
    /** 
     * Calculates the derivative so that the results are deterministic (or more accurately, so that all returned 
     * transitions are disjoint).
     * 
     * This looks a bit complicated (and it kind of is) but what it's doing is handing off the calculation to
     * deriv(), then combining results so that there's no overlap between the tokens.  For example, say deriv() yields
     * two tokens X and Y, and they have no intersection.  Then we're good, we just yield those.  But if they 
     * do have an intersection, we need to return three paths:
     * 
     *    X&Y (leading to the UnionExpr of the exprs X and Y would have led to)
     *    X-Y (leading to the expr X would have led to)
     *    Y-X (leading to the expr Y would have led to)
     * 
     * @param nextTape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param stack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple [tape, match, next], where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * next is the derivative expression
     */ 

    public *disjointDeriv(
        tape: Tape,
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        const results: {[c: string]: Expr[]} = {};
        for (const [childTape, childToken, childExpr] of
                this.deriv(tape, target, stack)) {
            for (const c of tape.fromBits(childTape.tapeName, childToken.bits)) {
                if (!(c in results)) {
                    results[c] = [];
                }
                results[c].push(childExpr);
            }
        }

        for (const c in results) {
            const nextToken = tape.toToken(tape.tapeName, c);
            const nextExprs = results[c];
            const nextExpr = constructAlternation(...nextExprs);
            yield [tape, nextToken, nextExpr];
        }
    }

    public *disjointConcreteDeriv(
        tape: Tape,
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        const results: {[c: string]: Expr[]} = {};
        for (const [childToken, childExpr] of
            this.concreteDeriv(tape, target, stack)) {
            if (!(childToken in results)) {
                results[childToken] = [];
            }
            results[childToken].push(childExpr);
        }

        for (const c in results) {
            const nextExprs = results[c];
            const nextExpr = constructAlternation(...nextExprs);
            yield [c, nextExpr];
        }
    }

    /*
    public *disjointDeriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        let results: [Tape, Token, Expr][] = [];
        let nextExprs: [Tape, Token, Expr][] = [... this.deriv(tape, target, stack)];
        
        for (let [nextTape, nextBits, next] of nextExprs) {

            let newResults: [Tape, Token, Expr][] = [];
            for (let [otherTape, otherBits, otherNext] of results) {
                if (nextTape.tapeName != otherTape.tapeName) {
                    newResults.push([otherTape, otherBits, otherNext]);
                    continue;
                }

                // they both matched
                const intersection = nextBits.and(otherBits);
                if (!intersection.isEmpty()) {
                    // there's something in the intersection
                    const union = constructBinaryUnion(next, otherNext);
                    newResults.push([nextTape, intersection, union]); 
                }
                nextBits = nextBits.andNot(intersection)
                otherBits = otherBits.andNot(intersection);

                // there's something left over
                if (!otherBits.isEmpty()) {
                    newResults.push([otherTape, otherBits, otherNext]);
                }
            }
            results = newResults;
            if (!nextBits.isEmpty()) {
                results.push([nextTape, nextBits, next]);
            }
        }
        yield *results;
    }
    */

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
     * @param [maxRecursion] The maximum number of times the grammar can recurse; for infinite recursion pass Infinity.
     * @param [maxChars] The maximum number of steps any one traversal can take (roughly == the total number of characters
     *                    output to all tapes)
     * @returns a generator of { tape: string } dictionaries, one for each successful traversal. 
     */
    public *generate(
        tapes: Tape[],
        random: boolean = false,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {
    
        const stack = new CounterStack(maxRecursion);

        if (random) {
            yield* this.generateRandom(tapes, stack, maxChars);
            return;
        } 

        yield* this.generateDepthFirst(tapes, stack, maxChars);
    }

    public *generateDepthFirst(
        tapes: Tape[],
        stack: CounterStack,
        maxChars: number = 1000
    ): Gen<StringDict> {
        const initialOutput: MultiTapeOutput = new MultiTapeOutput();
        let states: [Tape[], MultiTapeOutput, Expr, number][] = [[tapes, initialOutput, this, 0]];
        let prev: [Tape[], MultiTapeOutput, Expr, number] | undefined = undefined;
        while (prev = states.pop()) {

            let nexts: [Tape[], MultiTapeOutput, Expr, number][] = [];
            let [tapes, prevOutput, prevExpr, chars] = prev;
            
            //console.log();
            //console.log(`remaining tapes are ${tapes.map(t => t.tapeName)}`);
            //console.log(`prevExpr is ${prevExpr.id}`);

            if (chars >= maxChars) {
                continue;
            }

            if (prevExpr instanceof EpsilonExpr) {
                yield* prevOutput.toStrings(false);
                continue;
            }
            
            if (tapes.length == 0) {
                continue; 
            }
            
            // rotate the tapes occasionally so that we don't just 
            // keep trying the same one every time
            //if (Math.random() < 0.2) {
            //    tapes = [... tapes.slice(1), tapes[0]];
            //}         

            const tapeToTry = tapes[0];

            for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, ANY_CHAR, stack)) {
                //console.log(`D^${cTape.tapeName}_${cTarget.stringify(cTape)} is ${cNext.id}`);

                if (tapeToTry.tapeName.startsWith("__")) {
                    // don't bother to add hidden characters
                    nexts.push([tapes, prevOutput, cNext, chars]);
                    continue;
                }
                
                const nextOutput = prevOutput.add(tapeToTry, cTarget);
                nexts.push([tapes, nextOutput, cNext, chars+1]);
            }

            const delta = prevExpr.delta(tapeToTry, stack);
            //console.log(`d^${tapeToTry.tapeName} is ${delta.id}`);
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta, chars]);
            }

            states.push(...nexts);
        }
    }

    
    public *generateDepthFirstDict(
        tapes: Tape[],
        stack: CounterStack,
        maxChars: number = 1000
    ): Gen<StringDict> {
        const initialOutput: MultiTapeOutput = new MultiTapeOutput();
        let states: [Tape[], MultiTapeOutput, Expr, number][] = [[tapes, initialOutput, this, 0]];
        let prev: [Tape[], MultiTapeOutput, Expr, number] | undefined = undefined;
        while (prev = states.pop()) {

            let nexts: [Tape[], MultiTapeOutput, Expr, number][] = [];
            let [tapes, prevOutput, prevExpr, chars] = prev;
            
            //console.log();
            //console.log(`remaining tapes are ${tapes.map(t => t.tapeName)}`);
            //console.log(`prevExpr is ${prevExpr.id}`);

            if (chars >= maxChars) {
                continue;
            }

            if (prevExpr instanceof EpsilonExpr) {
                yield* prevOutput.toStrings(false);
                continue;
            }
            
            if (tapes.length == 0) {
                continue; 
            }
            
            // rotate the tapes occasionally so that we don't just 
            // keep trying the same one every time
            //if (Math.random() < 0.2) {
            //    tapes = [... tapes.slice(1), tapes[0]];
            //}         

            const tapeToTry = tapes[0];

            for (const [cTarget, cNext] of Object.entries(
                    prevExpr.dictDeriv(tapeToTry, ANY_CHAR_STR, stack))) {
                //console.log(`D^${cTape.tapeName}_${cTarget.stringify(cTape)} is ${cNext.id}`);

                if (tapeToTry.tapeName.startsWith("__")) {
                    // don't bother to add hidden characters
                    nexts.push([tapes, prevOutput, cNext, chars]);
                    continue;
                }

                if (cTarget == ANY_CHAR_STR) {
                    for (const c of tapeToTry.fromToken(tapeToTry.tapeName, ANY_CHAR)) {
                        const cToken = tapeToTry.toToken(tapeToTry.tapeName, c);
                        const nextOutput = prevOutput.add(tapeToTry, cToken);
                        nexts.push([tapes, nextOutput, cNext, chars+1]);
                    }
                    continue;
                }

                const cToken = tapeToTry.toToken(tapeToTry.tapeName, cTarget);
                const nextOutput = prevOutput.add(tapeToTry, cToken);
                nexts.push([tapes, nextOutput, cNext, chars+1]);
            }

            const delta = prevExpr.delta(tapeToTry, stack);
            //console.log(`d^${tapeToTry.tapeName} is ${delta.id}`);
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta, chars]);
            }

            states.push(...nexts);
        }
    }

    
    public *generateDepthFirstConcrete(
        tapes: Tape[],
        stack: CounterStack,
        maxChars: number = 1000
    ): Gen<StringDict> {
        const initialOutput: MultiTapeOutput = new MultiTapeOutput();
        let states: [Tape[], MultiTapeOutput, Expr, number][] = [[tapes, initialOutput, this, 0]];
        let prev: [Tape[], MultiTapeOutput, Expr, number] | undefined = undefined;
        while (prev = states.pop()) {

            let nexts: [Tape[], MultiTapeOutput, Expr, number][] = [];
            let [tapes, prevOutput, prevExpr, chars] = prev;
            
            //console.log();
            //console.log(`remaining tapes are ${tapes.map(t => t.tapeName)}`);
            //console.log(`prevExpr is ${prevExpr.id}`);

            if (chars >= maxChars) {
                continue;
            }

            if (prevExpr instanceof EpsilonExpr) {
                yield* prevOutput.toStrings(false);
                continue;
            }
            
            if (tapes.length == 0) {
                continue; 
            }
            
            // rotate the tapes occasionally so that we don't just 
            // keep trying the same one every time
            //if (Math.random() < 0.2) {
            //    tapes = [... tapes.slice(1), tapes[0]];
            //}         

            const tapeToTry = tapes[0];

            for (const [cTarget, cNext] of prevExpr.disjointConcreteDeriv(tapeToTry, ANY_CHAR_STR, stack)) {
                //console.log(`D^${cTape.tapeName}_${cTarget.stringify(cTape)} is ${cNext.id}`);

                if (tapeToTry.tapeName.startsWith("__")) {
                    // don't bother to add hidden characters
                    nexts.push([tapes, prevOutput, cNext, chars]);
                    continue;
                }

                if (cTarget == ANY_CHAR_STR) {
                    for (const c of tapeToTry.fromToken(tapeToTry.tapeName, ANY_CHAR)) {
                        const cToken = tapeToTry.toToken(tapeToTry.tapeName, c);
                        const nextOutput = prevOutput.add(tapeToTry, cToken);
                        nexts.push([tapes, nextOutput, cNext, chars+1]);
                    }
                    continue;
                }

                const cToken = tapeToTry.toToken(tapeToTry.tapeName, cTarget);
                const nextOutput = prevOutput.add(tapeToTry, cToken);
                nexts.push([tapes, nextOutput, cNext, chars+1]);
            }

            const delta = prevExpr.delta(tapeToTry, stack);
            //console.log(`d^${tapeToTry.tapeName} is ${delta.id}`);
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta, chars]);
            }

            states.push(...nexts);
        }
    }

    public *generateBreadthFirst(
        tapes: Tape[],
        stack: CounterStack,
        maxChars: number = 1000
    ): Gen<StringDict> {

        const initialOutput: MultiTapeOutput = new MultiTapeOutput();
        let states: [Tape[], MultiTapeOutput, Expr, number][] = [[tapes, initialOutput, this, 0]];

        while (states.length > 0) {
            let nexts: [Tape[], MultiTapeOutput, Expr, number][] = [];
            for (let [tapes, prevOutput, prevExpr, chars] of states) {

                //console.log(`prevExpr is ${prevExpr.id}`);
                //console.log(`prevOutput is ${JSON.stringify([...prevOutput.toStrings(false)])}`);
                
                if (chars >= maxChars) {
                    continue;
                }

                if (prevExpr instanceof EpsilonExpr) {
                    yield* prevOutput.toStrings(false);
                    continue;
                }
                
                if (tapes.length == 0) {
                    //console.log(`no tapes left`);
                    continue; 
                }

                // rotate the tapes so that we don't keep trying the same one every time
                //tapes = [... tapes.slice(1), tapes[0]];

                const tapeToTry = tapes[0];
                
                //for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, ANY_CHAR, stack)) {
                  
                for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, ANY_CHAR, stack)) {
                    
                    if (tapeToTry.tapeName.startsWith("__")) {
                        // don't bother to add hidden characters
                        nexts.push([tapes, prevOutput, cNext, chars]);
                        continue;
                    }
                    //const cToken = tapeToTry.toToken(tapeToTry.tapeName, cTarget); 
                    const nextOutput = prevOutput.add(tapeToTry, cTarget);
                    nexts.push([tapes, nextOutput, cNext, chars+1]);  
                    //console.log(`D^${cTape.tapeName}_${cTarget.stringify(cTape)} is ${cNext.id}`);
                }

                const delta = prevExpr.delta(tapeToTry, stack);
                //console.log(`d^${tapeToTry.tapeName} is ${delta.id}`);
                if (!(delta instanceof NullExpr)) {                    
                    const newTapes = tapes.slice(1);
                    nexts.push([newTapes, prevOutput, delta, chars]);
                }

            }
            states = nexts;
        }
    }

    public *generateRandom(
        tapes: Tape[],
        stack: CounterStack,
        maxChars: number = 1000
    ): Gen<StringDict> {
        const initialOutput: MultiTapeOutput = new MultiTapeOutput();

        let states: [Tape[], MultiTapeOutput, Expr, number][] = [[tapes, initialOutput, this, 0]];
        const candidates: MultiTapeOutput[] = [];

        let prev: [Tape[], MultiTapeOutput, Expr, number] | undefined = undefined;
        while (prev = states.pop()) {

            // first, see if it's time to randomly emit a result
            if (Math.random() < 0.1 && candidates.length > 0) {
                const candidateIndex = Math.floor(Math.random()*candidates.length);
                const candidateOutput = candidates.splice(candidateIndex, 1)[0];
                yield* candidateOutput.toStrings(true);
            }

            let nexts: [Tape[], MultiTapeOutput, Expr, number][] = [];
            let [tapes, prevOutput, prevExpr, chars] = prev;
            if (chars >= maxChars) {
                continue;
            }

            if (prevExpr instanceof EpsilonExpr) {
                candidates.push(prevOutput);
                continue;
            }
            
            if (tapes.length == 0) {
                continue; 
            }

            // rotate the tapes so that we don't keep trying the same one every time
            //tapes = [... tapes.slice(1), tapes[0]];

            const tapeToTry = tapes[0];
            for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, ANY_CHAR, stack)) {
                
                if (cTape.tapeName.startsWith("__")) {
                    // don't bother to add hidden characters
                    nexts.push([tapes, prevOutput, cNext, chars]);
                    continue;
                }

                const nextOutput = prevOutput.add(cTape, cTarget);
                nexts.push([tapes, nextOutput, cNext, chars+1]);
            }

            const delta = prevExpr.delta(tapeToTry, stack);
            if (!(delta instanceof NullExpr)) {                    
                const newTapes = tapes.slice(1);
                nexts.push([newTapes, prevOutput, delta, chars]);
            }

            shuffleArray(nexts);
            states.push(...nexts);
        }

        if (candidates.length == 0) {
            return;
        }

        const candidateIndex = Math.floor(Math.random()*candidates.length);
        const candidateOutput = candidates.splice(candidateIndex, 1)[0];
        yield* candidateOutput.toStrings(true);
    }
}


type ExprDict = {[c: string]: Expr};

function addToExprDict(d: ExprDict, c: string, e: Expr): ExprDict {
    if (c in d) {
        d[c] = constructBinaryUnion(e, d[c]);
    } else {
        d[c] = e;
    }
    return d;
}

/*
function wrapExprDictInPlace(d: ExprDict, f: (e: Expr) => Expr): ExprDict {
    for (const c in d) {
        d[c] = f(d[c]);
    }
    return d;
} */

function mergeExprDictInPlace(d1: ExprDict, d2: ExprDict): ExprDict {
    for (const c in d2) {
        if (c in d1) {
            d1[c] = constructBinaryUnion(d2[c], d1[c]);
        } else {
            d1[c] = d2[c];
        }
    }
    return d1;
}

/**
 * An expression denoting the language with one entry, that's epsilon on all tapes.
 */
export class EpsilonExpr extends Expr {

    public get id(): string {
        return "ε";
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        return this;
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> { }

    public *concreteDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): Gen<[string, Expr]> { }

}

/**
 * An expression denoting the empty language {}
 */
export class NullExpr extends Expr {

    public get id(): string {
        return "∅";
    }
    
    public delta(tape: Tape, stack: CounterStack): Expr {
        return this;
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> { }

    public *concreteDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): Gen<[string, Expr]> { }

}


/**
 * The state that recognizes/emits any character on a specific tape; 
 * implements the "dot" in regular expressions.
 */
class DotExpr extends Expr {
    
    constructor(
        public tapeName: string
    ) {
        super();
    }

    public get id(): string {
        return `${this.tapeName}:.`;
    }
    
    public delta(tape: Tape, stack: CounterStack): Expr {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        return NULL;
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        yield [matchedTape, target, EPSILON];
    }

    public *concreteDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): Gen<[string, Expr]> { 
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        yield [target, EPSILON];
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return {};
        }
        return {[target]: EPSILON};
    }
}

class CharSetExpr extends Expr {
    
    constructor(
        public tapeName: string,
        public chars: string[]
    ) {
        super();
    }
    
    public get id(): string {
        return `${this.tapeName}:{${this.chars.join("|")}}`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        return NULL;
    }

    protected getToken(tape: Tape): Token {
        //return tape.tokenize(tape.tapeName, this.text[this.index])[0];
        let result = tape.none();
        for (const char of this.chars) {
            const t = new Token(tape.toBits(tape.tapeName, char));
            result = result.or(t);
        }
        return result;
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }

        const bits = this.getToken(matchedTape);
        const result = matchedTape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        yield [matchedTape, result, EPSILON];
    }

    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }

        if (target == ANY_CHAR_STR) {
            for (const c of this.chars) {
                yield [c, EPSILON];
            }
            return;
        }

        if (this.chars.indexOf(target) != -1) {
            yield [target, EPSILON];
        }
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return {};
        }

        if (target == ANY_CHAR_STR) {
            const result: ExprDict = {};
            for (const c of this.chars) {
                addToExprDict(result, c, EPSILON);
            }
            return result;
        }

        if (this.chars.indexOf(target) != -1) {
            return { [target]: EPSILON};
        }

        return {};
    }
    
}

class DotStarExpr extends Expr {
    
    constructor(
        public tapeName: string
    ) {
        super();
    }

    public get id(): string {
        return `${this.tapeName}:.*`;
    }
    
    public delta(tape: Tape, stack: CounterStack): Expr {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        return EPSILON;
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        yield [matchedTape, target, this];
    }

    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        yield [target, this];
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return {};
        }
        return { [target]: this};
    }
    
}

class LiteralExpr extends Expr {

    constructor(
        public tapeName: string,
        public text: string[],
        public index: number = 0
    ) {
        super();
    }

    public get id(): string {
        const index = this.index > 0 ? `[${this.index}]` : ""; 
        return `${this.tapeName}:${this.text.join("")}${index}`;
    }

    public getText(): string[] {
        // Return the remaining text for this LiteralState.
        return this.text.slice(this.index);
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        if (this.index >= this.text.length) {
            return EPSILON;
        }
        return NULL;
    }

    protected getToken(tape: Tape): Token {
        //return tape.tokenize(tape.tapeName, this.text[this.index])[0];
        return new Token(tape.toBits(tape.tapeName, this.text[this.index]));
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (this.index >= this.text.length) {
            return;
        }

        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }

        const bits = this.getToken(matchedTape);
        const result = matchedTape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        const nextExpr = constructLiteral(this.tapeName, this.text, this.index+1);
        yield [matchedTape, result, nextExpr];

    }

    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {

        if (this.index >= this.text.length) {
            return;
        }

        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }

        if (target == ANY_CHAR_STR || target == this.text[this.index]) {
            const nextExpr = constructLiteral(this.tapeName, this.text, this.index+1);
            yield [this.text[this.index], nextExpr];
        }
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {

        if (this.index >= this.text.length) {
            return {};
        }

        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return {};
        }

        if (target == ANY_CHAR_STR || target == this.text[this.index]) {
            const nextExpr = constructLiteral(this.tapeName, this.text, this.index+1);
            return { [this.text[this.index]] : nextExpr};
        }

        return {};
    }
}

/**
 * The abstract base class of all Exprs with two state children 
 * (e.g. [JoinExpr]).
 */
export abstract class BinaryExpr extends Expr {

    constructor(
        public child1: Expr,
        public child2: Expr
    ) {
        super();
    }

    public get id(): string {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }
}

class ConcatExpr extends BinaryExpr {

    public get id(): string {
        const child2ID = this.child2.id;

        if ((this.child1 instanceof LiteralExpr ||
            this.child1 instanceof DotStarExpr ||
            this.child1 instanceof DotExpr) && 
            child2ID.startsWith(this.child1.tapeName)) {
            // abbreviate!
            const child2IDTrunc = child2ID.slice(this.child1.tapeName.length+1);
            return this.child1.id + child2IDTrunc;
        }

        return `${this.child1.id}+${this.child2.id}`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructBinaryConcat( this.child1.delta(tape, stack),
                            this.child2.delta(tape, stack));
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        for (const [c1tape, c1target, c1next] of
                this.child1.deriv(tape, target, stack)) {
            yield [c1tape, c1target, 
                constructBinaryConcat(c1next, this.child2)];
        }

        const c1next = this.child1.delta(tape, stack);
        for (const [c2tape, c2target, c2next] of
                this.child2.deriv(tape, target, stack)) {
            const successor = constructBinaryConcat(c1next, c2next);
            yield [c2tape, c2target, successor];
        }
    }

    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {

        for (const [c1target, c1next] of
                this.child1.concreteDeriv(tape, target, stack)) {
            yield [c1target, 
                constructBinaryConcat(c1next, this.child2)];
        }

        const c1next = this.child1.delta(tape, stack);
        for (const [c2target, c2next] of
                this.child2.concreteDeriv(tape, target, stack)) {
            const successor = constructBinaryConcat(c1next, c2next);
            yield [c2target, successor];
        }
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const result = this.child1.dictDeriv(tape, target, stack);
        for (const c in result) {
            result[c] = constructBinaryConcat(result[c], this.child2);
        }
        //wrapExprDictInPlace(result, (e)=>constructBinaryConcat(e, this.child2));
        
        const c1next = this.child1.delta(tape, stack);
        const c2dict = this.child2.dictDeriv(tape, target, stack);
        //wrapExprDictInPlace(c2dict, (e)=>constructBinaryConcat(c1next, e));
        for (const c in c2dict) {
            c2dict[c] = constructBinaryConcat(c1next, c2dict[c]);
        }
        mergeExprDictInPlace(result, c2dict);
        return result;
    }
}

export class UnionExpr extends BinaryExpr {
    
    public get id(): string {
        return `(${this.child1.id}|${this.child2.id})`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructBinaryUnion( this.child1.delta(tape, stack),
                             this.child2.delta(tape, stack));
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        yield* this.child1.deriv(tape, target, stack);
        yield* this.child2.deriv(tape, target, stack);
    }

    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        yield* this.child1.concreteDeriv(tape, target, stack);
        yield* this.child2.concreteDeriv(tape, target, stack);
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const result = this.child1.dictDeriv(tape, target, stack);
        const c2dict = this.child2.dictDeriv(tape, target, stack);
        mergeExprDictInPlace(result, c2dict);
        return result;
    }
}

class IntersectExpr extends BinaryExpr {

    public get id(): string {
        return `(${this.child1.id}&${this.child2.id})`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructIntersection( this.child1.delta(tape, stack),
                                   this.child2.delta(tape, stack));
    }

    public *deriv(
        tape: Tape,
        target: Token,               
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        for (const [c1tape, c1target, c1next] of 
            this.child1.disjointDeriv(tape, target, stack)) {

            for (const [c2tape, c2target, c2next] of 
                    this.child2.disjointDeriv(c1tape, c1target, stack)) {
                const successor = constructIntersection(c1next, c2next);
                yield [c2tape, c2target, successor];
            }
        }
    } 

    public *concreteDeriv(
        tape: Tape,
        target: string,               
        stack: CounterStack
    ): Gen<[string, Expr]> {
        for (const [c1target, c1next] of 
            this.child1.disjointConcreteDeriv(tape, target, stack)) {

            for (const [c2target, c2next] of 
                    this.child2.disjointConcreteDeriv(tape, c1target, stack)) {
                const successor = constructIntersection(c1next, c2next);
                yield [c2target, successor];
            }
        }
    } 

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const results: ExprDict = {};

        const c1dict = this.child1.dictDeriv(tape, target, stack);
        for (const [c1str, c1next] of Object.entries(c1dict)) {
            const c2dict = this.child2.dictDeriv(tape, c1str, stack);
            //wrapExprDictInPlace(c2dict, (e)=>constructIntersection(c1next, e));
            for (const c in c2dict) {
                c2dict[c] = constructIntersection(c1next, c2dict[c]);
            }
            
            mergeExprDictInPlace(results, c2dict);
        }

        return results;
    }
}


class FilterExpr extends BinaryExpr {

    constructor(
        child1: Expr,
        child2: Expr,
        public tapes: Set<string>
    ) {
        super(child1, child2);
    }

    
    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructFilter( this.child1.delta(tape, stack),
                                   this.child2.delta(tape, stack), this.tapes);
    }

    public *deriv(
        tape: Tape,
        target: Token,               
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (!this.tapes.has(tape.tapeName)) {
            for (const [c1tape, c1target, c1next] of 
                    this.child1.disjointDeriv(tape, target, stack)) {
                const successor = constructFilter(c1next, this.child2, this.tapes);
                yield [c1tape, c1target, successor];
            }
            return;
        }
        
        for (const [c2tape, c2target, c2next] of 
            this.child2.disjointDeriv(tape, target, stack)) {

            for (const [c1tape, c1target, c1next] of 
                    this.child1.disjointDeriv(c2tape, c2target, stack)) {
                const successor = constructFilter(c1next, c2next, this.tapes);
                yield [c1tape, c1target, successor];
            }
        }
    } 
    
    public *concreteDeriv(
        tape: Tape,
        target: string,               
        stack: CounterStack
    ): Gen<[string, Expr]> {

        if (!this.tapes.has(tape.tapeName)) {
            for (const [c1target, c1next] of 
                    this.child1.disjointConcreteDeriv(tape, target, stack)) {
                const successor = constructFilter(c1next, this.child2, this.tapes);
                yield [c1target, successor];
            }
            return;
        }
        
        for (const [c2target, c2next] of 
            this.child2.disjointConcreteDeriv(tape, target, stack)) {

            for (const [c1target, c1next] of 
                    this.child1.disjointConcreteDeriv(tape, c2target, stack)) {
                const successor = constructFilter(c1next, c2next, this.tapes);
                yield [c1target, successor];
            }
        }
    } 

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {

        if (!this.tapes.has(tape.tapeName)) {
            const c1dict = this.child1.dictDeriv(tape, target, stack);
            //wrapExprDictInPlace(c1dict, (e)=>constructFilter(e, this.child2, this.tapes));
            for (const c in c1dict) {
                c1dict[c] = constructFilter(c1dict[c], this.child2, this.tapes);
            }
            return c1dict;
        }
        
        const results: ExprDict = {};
        const c2dict = this.child2.dictDeriv(tape, target, stack);
        for (const [c2str, c2next] of Object.entries(c2dict)) {
            const c1dict = this.child1.dictDeriv(tape, c2str, stack);
            //wrapExprDictInPlace(c1dict, (e)=>constructFilter(e, c2next, this.tapes));
            for (const c in c1dict) {
                c1dict[c] = constructFilter(c1dict[c], c2next, this.tapes);
            }
            mergeExprDictInPlace(results, c1dict);
        }
        return results;
    }
}


class JoinExpr extends BinaryExpr {

    constructor(
        child1: Expr,
        child2: Expr,
        public tapes1: Set<string>,
        public tapes2: Set<string>
    ) {
        super(child1, child2);
    }

    public get id(): string {
        return `(${this.child1.id}&&${this.child2.id})`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructJoin( this.child1.delta(tape, stack),
                                   this.child2.delta(tape, stack), this.tapes1, this.tapes2);
    }

    public *deriv(
        tape: Tape,
        target: Token,               
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (!this.tapes2.has(tape.tapeName)) {
            for (const [c1tape, c1target, c1next] of 
                    this.child1.disjointDeriv(tape, target, stack)) {
                const successor = constructJoin(c1next, this.child2, this.tapes1, this.tapes2);
                yield [c1tape, c1target, successor];
            }
            return;
        }
        
        if (!this.tapes1.has(tape.tapeName)) {
            for (const [c2tape, c2target, c2next] of 
                    this.child2.disjointDeriv(tape, target, stack)) {
                const successor = constructJoin(this.child1, c2next, this.tapes1, this.tapes2);
                yield [c2tape, c2target, successor];
            }
            return;
        }
        
        for (const [c2tape, c2target, c2next] of 
            this.child2.disjointDeriv(tape, target, stack)) {

            for (const [c1tape, c1target, c1next] of 
                    this.child1.disjointDeriv(c2tape, c2target, stack)) {
                const successor = constructJoin(c1next, c2next, this.tapes1, this.tapes2);
                yield [c1tape, c1target, successor];
            }
        }
    } 

    
    public *concreteDeriv(
        tape: Tape,
        target: string,               
        stack: CounterStack
    ): Gen<[string, Expr]> {

        if (!this.tapes2.has(tape.tapeName)) {
            for (const [c1target, c1next] of 
                    this.child1.disjointConcreteDeriv(tape, target, stack)) {
                const successor = constructJoin(c1next, this.child2, this.tapes1, this.tapes2);
                yield [c1target, successor];
            }
            return;
        }
        
        if (!this.tapes1.has(tape.tapeName)) {
            for (const [c2target, c2next] of 
                    this.child2.disjointConcreteDeriv(tape, target, stack)) {
                const successor = constructJoin(this.child1, c2next, this.tapes1, this.tapes2);
                yield [c2target, successor];
            }
            return;
        }
        
        for (const [c2target, c2next] of 
            this.child2.disjointConcreteDeriv(tape, target, stack)) {

            for (const [c1target, c1next] of 
                    this.child1.disjointConcreteDeriv(tape, c2target, stack)) {
                const successor = constructJoin(c1next, c2next, this.tapes1, this.tapes2);
                yield [c1target, successor];
            }
        }
    } 

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {

        if (!this.tapes2.has(tape.tapeName)) {
            const c1dict = this.child1.dictDeriv(tape, target, stack);
            //wrapExprDictInPlace(c1dict, (e)=>constructJoin(e, this.child2, this.tapes1, this.tapes2));
            for (const c in c1dict) {
                c1dict[c] = constructJoin(c1dict[c], this.child2, this.tapes1, this.tapes2);
            }
            return c1dict;
        }

        if (!this.tapes1.has(tape.tapeName)) {
            const c2dict = this.child2.dictDeriv(tape, target, stack);
            //wrapExprDictInPlace(c2dict, (e)=>constructJoin(this.child1, e, this.tapes1, this.tapes2));
            for (const c in c2dict) {
                c2dict[c] = constructJoin(this.child1, c2dict[c], this.tapes1, this.tapes2);
            }
            return c2dict;
        }

        const results: ExprDict = {};
        const c2dict = this.child2.dictDeriv(tape, target, stack);
        for (const [c2str, c2next] of Object.entries(c2dict)) {
            const c1dict = this.child1.dictDeriv(tape, c2str, stack);
            //wrapExprDictInPlace(c1dict, (e)=>constructJoin(e, c2next, this.tapes1, this.tapes2));
            for (const c in c1dict) {
                c1dict[c] = constructJoin(c1dict[c], c2next, this.tapes1, this.tapes2);
            }
            mergeExprDictInPlace(results, c1dict);
        }
        return results;
    }


}

/**
 * The parser that handles arbitrary subgrammars referred to by a symbol name; this is what makes
 * recursion possible.
 * 
 * Like most such implementations, EmbedExpr's machinery serves to delay the construction of a child
 * state, since this child may be the EmbedExpr itself, or refer to this EmbedExpr by indirect recursion.
 * So instead of having a child at the start, it just has a symbol name and a reference to a symbol table.
 * 
 * The successor states of the EmbedExpr may have an explicit child, though: the successors of that initial
 * child state.  (If we got the child from the symbol table every time, we'd just end up trying to match its 
 * first letter again and again.)  We keep track of that through the _child member, which is initially undefined
 * but which we specify when constructing EmbedExpr's successor.
 */
 class EmbedExpr extends Expr {

    constructor(
        public symbolName: string,
        public symbols: SymbolTable,
        public _child: Expr | undefined = undefined
    ) { 
        super();
    }

    public get id(): string {
        return `\$${this.symbolName}`;
    }

    public getChild(stack: CounterStack | undefined = undefined): Expr {
        if (this._child == undefined) {
            const child = this.symbols[this.symbolName];
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain. 
                //console.log(`error, can't find ${this.symbolName} in symbol table, symbol table contains ${Object.keys(this.symbols)}`);
                return EPSILON;
            } 
            this._child = child;
            //console.log(`found the child, it's ${child.id}`);
        }
        return this._child;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        if (stack.exceedsMax(this.symbolName)) {
            return NULL;
        }
        const newStack = stack.add(this.symbolName);
        return this.getChild(newStack).delta(tape, newStack);
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (stack.exceedsMax(this.symbolName)) {
            return;
        }

        stack = stack.add(this.symbolName);
        let child = this.getChild(stack);

        for (const [childTape, childTarget, childNext] of 
                        child.deriv(tape, target, stack)) {
            const successor = constructEmbed(this.symbolName, this.symbols, childNext);
            yield [childTape, childTarget, successor];
        }
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        if (stack.exceedsMax(this.symbolName)) {
            return {};
        }

        stack = stack.add(this.symbolName);
        let child = this.getChild(stack);

        const results = child.dictDeriv(tape, target, stack);
        //wrapExprDictInPlace(results, (e)=>constructEmbed(this.symbolName, this.symbols, e));
        for (const c in results) {
            results[c] = constructEmbed(this.symbolName, this.symbols, results[c]);
        }
        return results;
    }

    
    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {

        if (stack.exceedsMax(this.symbolName)) {
            return;
        }

        stack = stack.add(this.symbolName);
        let child = this.getChild(stack);

        for (const [childTarget, childNext] of 
                        child.concreteDeriv(tape, target, stack)) {
            const successor = constructEmbed(this.symbolName, this.symbols, childNext);
            yield [childTarget, successor];
        }
    }
}

/**
 * Abstract base class for expressions with only one child state.  Typically, UnaryExprs
 * handle derivatives by forwarding on the call to their child, and doing something special
 * before or after.  For example, [EmbedExprs] do a check a stack of symbol names to see
 * whether they've passed the allowable recursion limit, and [RenameExpr]s change what
 * the different tapes are named.
 * 
 * Note that [UnaryExpr.child] is a getter, rather than storing an actual child.  This is
 * because [EmbedExpr] doesn't actually store its child, it grabs it from a symbol table instead.
 * (If it tried to take it as a param, or construct it during its own construction, this wouldn't 
 * work, because the EmbedExpr's child can be that EmbedExpr itself.)
 */
export abstract class UnaryExpr extends Expr {

    constructor(
        public child: Expr
    ) { 
        super();
    }

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }
}


class StarExpr extends UnaryExpr {

    public get id(): string {
        return `${this.child.id}*`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        return constructStar(this.child.delta(tape, stack));
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {
        for (const [cTape, cTarget, cNext] of this.child.deriv(tape, target, stack)) {
            const successor = constructBinaryConcat(cNext, this);
            yield [cTape, cTarget, successor];
        }
    }
    
    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        for (const [cTarget, cNext] of this.child.concreteDeriv(tape, target, stack)) {
            const successor = constructBinaryConcat(cNext, this);
            yield [cTarget, successor];
        }
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {
        const results = this.child.dictDeriv(tape, target, stack);
        //wrapExprDictInPlace(results, (e)=>constructBinaryConcat(e, this));
        for (const c in results) {
            results[c] = constructBinaryConcat(results[c], this);    
        }
        return results;
    }
}

/**
 * Implements the Rename operation from relational algebra.
 */
class RenameExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public fromTape: string,
        public toTape: string
    ) { 
        super(child);
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        if (tape.tapeName != this.toTape && tape.tapeName == this.fromTape) {
            return this;
        }
        tape = new RenamedTape(tape, this.fromTape, this.toTape);
        const newChild = this.child.delta(tape, stack);
        return constructRename(newChild, this.fromTape, this.toTape);
    }
    
    public get id(): string {
        return `${this.fromTape}>${this.toTape}(${this.child.id})`;
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (tape.tapeName != this.toTape && tape.tapeName == this.fromTape) {
            return;
        }

        tape = new RenamedTape(tape, this.fromTape, this.toTape);
    
        for (let [childTape, childTarget, childNext] of 
                this.child.deriv(tape, target, stack)) {
            if (childTape instanceof RenamedTape) {
                childTape = childTape.child;
            }
            yield [childTape, childTarget, constructRename(childNext, this.fromTape, this.toTape)];
        }
    }
    
    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        if (tape.tapeName != this.toTape && tape.tapeName == this.fromTape) {
            return;
        }

        tape = new RenamedTape(tape, this.fromTape, this.toTape);
    
        for (let [childTarget, childNext] of 
                this.child.concreteDeriv(tape, target, stack)) {
            yield [childTarget, constructRename(childNext, this.fromTape, this.toTape)];
        }
    }
    
    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {

        if (tape.tapeName != this.toTape && tape.tapeName == this.fromTape) {
            return {};
        }

        tape = new RenamedTape(tape, this.fromTape, this.toTape);
        const results = this.child.dictDeriv(tape, target, stack);
        //wrapExprDictInPlace(results, (e)=>constructRename(e, this.fromTape, this.toTape));
        for (const c in results) {
            results[c] = constructRename(results[c], this.fromTape, this.toTape);
        }
        return results;

    }
}


class NegationExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Set<string>,
        public maxChars: number = Infinity
    ) { 
        super(child);
    }

    public get id(): string {
        return `~(${this.child.id})`;
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        const childDelta = this.child.delta(tape, stack);
        const remainingTapes = setDifference(this.tapes, new Set([tape.tapeName]));
        return constructNegation(childDelta, remainingTapes, this.maxChars);
    }
    
    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (!this.tapes.has(tape.tapeName)) {
            return;
        }

        if (this.maxChars == 0) {
            return;
        }

        let remainder = new Token(target.bits.clone());

        for (const [childTape, childText, childNext] of 
                this.child.disjointDeriv(tape, target, stack)) {
            remainder = remainder.andNot(childText);
            const successor = constructNegation(childNext, this.tapes, this.maxChars-1);
            yield [childTape, childText, successor];
        }

        if (remainder.isEmpty()) {
            return;
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything expression that always
        // succeeds.
        yield [tape, remainder, constructUniverse(this.tapes, this.maxChars-1)];
    }
    
    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {

        if (!this.tapes.has(tape.tapeName)) {
            return;
        }

        if (this.maxChars == 0) {
            return;
        }

        let remainder: Token;

        if (target == ANY_CHAR_STR) {
            remainder = tape.any();
        } else {
            remainder = tape.toToken(tape.tapeName, target);
        }

        for (const [childText, childNext] of 
                this.child.disjointConcreteDeriv(tape, target, stack)) {
            if (childText == ANY_CHAR_STR) {
                continue;
            }

            const childToken = tape.toToken(tape.tapeName, childText);
            remainder = remainder.andNot(childToken);
            const successor = constructNegation(childNext, this.tapes, this.maxChars-1);
            yield [childText, successor];
        }

        if (remainder.isEmpty()) {
            return;
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything expression that always
        // succeeds.
        for (const c of tape.fromToken(tape.tapeName, remainder)) {
            yield [c, constructUniverse(this.tapes, this.maxChars-1)];
        }
    }

    public dictDeriv(
        tape: Tape, 
        target: string, 
        stack: CounterStack
    ): ExprDict {

        if (!this.tapes.has(tape.tapeName)) {
            return {};
        }

        if (this.maxChars == 0) {
            return {};
        }

        const results: ExprDict = {};

        let remainder = (target == ANY_CHAR_STR)
                        ? tape.any()
                        : tape.toToken(tape.tapeName, target);

        const cDict = this.child.dictDeriv(tape, target, stack);

        for (const [cStr, cNext] of Object.entries(cDict)) {
            let childToken: Token;
            let cs: string[] = [];
            if (cStr == ANY_CHAR_STR) {
                childToken = tape.any();
                cs = tape.fromToken(tape.tapeName, childToken);
            } else {
                childToken = tape.toToken(tape.tapeName, cStr);
                cs = [cStr];
            }
            remainder = remainder.andNot(childToken);
            const successor = constructNegation(cNext, this.tapes, this.maxChars-1);
            for (const c of cs) {
                addToExprDict(results, c, successor);  
            }   
        }
        
        if (remainder.isEmpty()) {
            return results;
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything expression that always
        // succeeds.
        for (const c of tape.fromToken(tape.tapeName, remainder)) {
            const nextExpr = constructUniverse(this.tapes, this.maxChars-1);
            addToExprDict(results, c, nextExpr);
        }

        return results;
    }

}

export class MatchExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Set<string>,
        public buffers: {[key: string]: Expr} = {}
    ) {
        super(child);
    }

    public get id(): string {
        return `Match${[...this.tapes]}(${Object.values(this.buffers).map(b=>b.id)}, ${this.child.id})`;
    }

    public delta(
        tape: Tape,
        stack: CounterStack
    ): Expr {
        if (!this.tapes.has(tape.tapeName)) {
            // not a tape we care about, our result is just wrapping child.delta
            const childDelta = this.child.delta(tape, stack);
            return constructMatch(childDelta, this.tapes, this.buffers);
        }

        const newBuffers: {[key: string]: Expr} = {};
        Object.assign(newBuffers, this.buffers);
        const buffer = this.buffers[tape.tapeName];
        if (buffer != undefined) {
            const deltaBuffer = buffer.delta(tape, stack);
            if (!(deltaBuffer instanceof EpsilonExpr)) {
                return NULL;
            }
            newBuffers[tape.tapeName] = deltaBuffer;
        }

        let bufSeq = constructSequence(...Object.values(newBuffers));
        let result: Expr = this.child.delta(tape, stack);
        return constructIntersection(bufSeq, result);
        
        /*
        if (!(result instanceof NullExpr)) {
            return constructSequence(...Object.values(newBuffers), result);
        } else {
            return NULL;
        } */
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        symbolStack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        for (const [c1tape, c1target, c1next] of 
                    this.child.deriv(tape, target, symbolStack)) {

            if (!this.tapes.has(c1tape.tapeName)) {
                yield [c1tape, c1target, constructMatch(c1next, this.tapes, this.buffers)];
                continue;
            }

            // We need to match each character separately.
            for (const c of c1tape.fromToken(c1tape.tapeName, c1target)) {

                // cTarget: Token = c1tape.tokenize(c1tape.tapeName, c)[0]
                const cTarget: Token = c1tape.toToken(c1tape.tapeName, c);
                
                // STEP A: Are we matching something already buffered?
                const c1buffer = this.buffers[c1tape.tapeName]
                let c1bufMatched = false;
                if (c1buffer instanceof LiteralExpr) {

                    // that means we already matched a character on a different
                    // tape previously and now need to make sure it also matches
                    // this character on this tape
                    for (const [bufTape, bufTarget, bufNext] of 
                            c1buffer.deriv(c1tape, cTarget, symbolStack)) {
                        c1bufMatched = true;
                    }
                }

                // STEP B: If not, constrain my successors to match this on other tapes
                const newBuffers: {[key: string]: Expr} = {};
                for (const tapeName of this.tapes.keys()) {
                    const buffer = this.buffers[tapeName];
                    if (!c1bufMatched && tapeName != c1tape.tapeName) {
                        let prevText: string[] = [];
                        if (buffer instanceof LiteralExpr) {
                            // that means we already found stuff we needed to match,
                            // so we add to that
                            prevText = buffer.getText();
                        }
                        newBuffers[tapeName] = constructLiteral(tapeName, [...prevText, c]);
                    } else {
                        if (buffer != undefined) {
                            newBuffers[tapeName] = buffer;
                        }
                    }
                }
                
                // STEP C: Match the buffer
                if (c1buffer instanceof LiteralExpr) {
                    // that means we already matched a character on a different tape
                    // previously and now need to make sure it also matches on this
                    // tape
                    for (const [bufTape, bufTarget, bufNext] of 
                            c1buffer.deriv(c1tape, cTarget, symbolStack)) {
                        // We expect at most one match here.
                        // We expect bufTape == c1Tape,
                        //   bufTape == c1Tape
                        //   bufTarget == cTarget
                        //   bufMatched == c1Matched
                        //assert(bufTape == c1tape, "tape does not match");
                        //assert(bufTarget == cTarget, "target does not match");
                        //assert(bufMatched == c1matched, "matched does not match");
                        newBuffers[c1tape.tapeName] = bufNext;

                        yield [c1tape, cTarget, constructMatch(c1next, this.tapes, newBuffers)];
                    }
                } else {
                    // my predecessors have not previously required me to match
                    // anything in particular on this tape
                    yield [c1tape, cTarget, constructMatch(c1next, this.tapes, newBuffers)]
                }
            }
        }
    }

    public *concreteDeriv(
        tape: Tape, 
        target: string,
        stack: CounterStack
    ): Gen<[string, Expr]> {
        

        for (const [c1target, c1next] of 
            this.child.concreteDeriv(tape, target, stack)) {

            if (!this.tapes.has(tape.tapeName)) {
                yield [c1target, constructMatch(c1next, this.tapes, this.buffers)];
                continue;
            }

            
            const cs = (c1target == ANY_CHAR_STR) 
                        ? tape.fromToken(tape.tapeName, tape.any())
                        : [c1target];

            // We need to match each character separately.
            for (const c of cs) {
                
                // STEP A: Are we matching something already buffered?
                const c1buffer = this.buffers[tape.tapeName]
                let c1bufMatched = false;
                if (c1buffer instanceof LiteralExpr) {

                    // that means we already matched a character on a different
                    // tape previously and now need to make sure it also matches
                    // this character on this tape
                    for (const [bufTarget, bufNext] of 
                            c1buffer.concreteDeriv(tape, c, stack)) {
                        c1bufMatched = true;
                    }
                }

                // STEP B: If not, constrain my successors to match this on other tapes
                const newBuffers: {[key: string]: Expr} = {};
                for (const tapeName of this.tapes.keys()) {
                    const buffer = this.buffers[tapeName];
                    if (!c1bufMatched && tapeName != tape.tapeName) {
                        let prevText: string[] = [];
                        if (buffer instanceof LiteralExpr) {
                            // that means we already found stuff we needed to match,
                            // so we add to that
                            prevText = buffer.getText();
                        }
                        newBuffers[tapeName] = constructLiteral(tapeName, [...prevText, c]);
                    } else {
                        if (buffer != undefined) {
                            newBuffers[tapeName] = buffer;
                        }
                    }
                }
                
                // STEP C: Match the buffer
                if (c1buffer instanceof LiteralExpr) {
                    // that means we already matched a character on a different tape
                    // previously and now need to make sure it also matches on this
                    // tape
                    for (const [bufTarget, bufNext] of 
                            c1buffer.concreteDeriv(tape, c, stack)) {
                        // We expect at most one match here.
                        // We expect bufTape == c1Tape,
                        //   bufTape == c1Tape
                        //   bufTarget == cTarget
                        //   bufMatched == c1Matched
                        //assert(bufTape == c1tape, "tape does not match");
                        //assert(bufTarget == cTarget, "target does not match");
                        //assert(bufMatched == c1matched, "matched does not match");
                        newBuffers[tape.tapeName] = bufNext;

                        yield [c, constructMatch(c1next, this.tapes, newBuffers)];
                    }
                } else {
                    // my predecessors have not previously required me to match
                    // anything in particular on this tape
                    yield [c, constructMatch(c1next, this.tapes, newBuffers)]
                }
            }
        }

    }

    
    public dictDeriv(
        tape: Tape, 
        target: string,
        symbolStack: CounterStack
    ): ExprDict {

        const results: ExprDict = {};

        const c1dict = this.child.dictDeriv(tape, target, symbolStack);

        for (const [c1target, c1next] of Object.entries(c1dict)) {

            if (!this.tapes.has(tape.tapeName)) {
                addToExprDict(results, c1target, constructMatch(c1next, this.tapes, this.buffers));
                continue;
            }

            const cs = (c1target == ANY_CHAR_STR) 
                        ? tape.fromToken(tape.tapeName, tape.any())
                        : [c1target];

            // We need to match each character separately.
            for (const c of cs) {

                // STEP A: Are we matching something already buffered?
                const c1buffer = this.buffers[tape.tapeName]
                let c1bufMatched = false;
                if (c1buffer instanceof LiteralExpr) {
                    const c1bufDeriv = c1buffer.dictDeriv(tape, c, symbolStack);
                    for (const [bufTarget, bufNext] of Object.entries(c1bufDeriv)) {
                        c1bufMatched = true;
                    }
                }

                // STEP B: If not, constrain my successors to match this on other tapes
                const newBuffers: {[key: string]: Expr} = {};
                for (const tapeName of this.tapes.keys()) {
                    const buffer = this.buffers[tapeName];
                    if (!c1bufMatched && tapeName != tape.tapeName) {
                        let prevText: string[] = [];
                        if (buffer instanceof LiteralExpr) {
                            prevText = buffer.getText();
                        }
                        newBuffers[tapeName] = constructLiteral(tapeName, [...prevText, c]);
                    } else {
                        if (buffer != undefined) {
                            newBuffers[tapeName] = buffer;
                        }
                    }
                }
                
                // STEP C: Match the buffer
                if (c1buffer instanceof LiteralExpr) {
                    const c1bufDeriv = c1buffer.dictDeriv(tape, c, symbolStack);
                    for (const [bufTarget, bufNext] of Object.entries(c1bufDeriv)) {
                        newBuffers[tape.tapeName] = bufNext;
                        addToExprDict(results, c, constructMatch(c1next, this.tapes, newBuffers));
                    }
                } else {
                    addToExprDict(results, c, constructMatch(c1next, this.tapes, newBuffers));
                }
            }
        }
        return results;
    }
}

/* CONVENIENCE FUNCTIONS */
export const EPSILON = new EpsilonExpr();
export const NULL = new NullExpr();
//export const UNIVERSE = new UniverseExpr();

export function constructLiteral(tape: string, text: string[], index: number = 0): Expr {
    return new LiteralExpr(tape, text, index);
}

export function constructCharSet(tape: string, chars: string[]): CharSetExpr {
    return new CharSetExpr(tape, chars);
}

export function constructDot(tape: string): Expr {
    return new DotExpr(tape);
}

export function constructListExpr(
    children: Expr[], 
    constr: (c1: Expr, c2: Expr) => Expr,
    nullResult: Expr, 
): Expr {
    if (children.length == 0) {
        return nullResult;
    }
    if (children.length == 1) {
        return children[0];
    }
    const head = children[0];
    const tail = constructListExpr(children.slice(1), constr, nullResult);
    return constr(head, tail);
}

export function constructBinaryConcat(c1: Expr, c2: Expr): Expr {
    if (c1 instanceof EpsilonExpr) {
        return c2;
    }
    if (c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof NullExpr) {
        return c1;
    }
    if (c2 instanceof NullExpr) {
        return c2;
    }
    if (c1 instanceof ConcatExpr) {
        const head = c1.child1;
        const tail = constructBinaryConcat(c1.child2, c2);
        return constructBinaryConcat(head, tail);
    }
    return new ConcatExpr(c1, c2);
}

export function constructBinaryUnion(c1: Expr, c2: Expr): Expr {
    if (c1 instanceof NullExpr) {
        return c2;
    }
    if (c2 instanceof NullExpr) {
        return c1;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof UnionExpr) {
        const head = c1.child1;
        const tail = constructBinaryUnion(c1.child2, c2);
        return constructBinaryUnion(head, tail);
    }
    return new UnionExpr(c1, c2);
}

export function constructSequence(...children: Expr[]): Expr {
    return constructListExpr(children, constructBinaryConcat, EPSILON);
}

export function constructAlternation(...children: Expr[]): Expr {
    return constructListExpr(children, constructBinaryUnion, NULL);
}

export function constructIntersection(c1: Expr, c2: Expr): Expr {
    if (c1 instanceof NullExpr) {
        return c1;
    }
    if (c2 instanceof NullExpr) {
        return c2;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    if (c1 instanceof IntersectExpr) {
        const head = c1.child1;
        const tail = constructIntersection(c1.child2, c2);
        return constructIntersection(head, tail);
    }
    return new IntersectExpr(c1, c2);
}

export function constructMaybe(child: Expr): Expr {
    return constructAlternation(child, EPSILON);
}

/**
 * Creates A* from A.  Distinguished from createRepeat
 * in that that works for any range of reps, where as this
 * is only zero through infinity reps.
 */
export function constructStar(child: Expr): Expr {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return EPSILON;
    }
    if (child instanceof StarExpr) {
        return child;
    }
    return new StarExpr(child);
}

/**
 * Creates A{min,max} from A.  Distinguished from constructStar
 * in that that only works for A{0,infinity}, whereas this
 * works for any values of {min,max}.
 */
export function constructRepeat(
    child: Expr, 
    minReps: number = 0, 
    maxReps: number = Infinity
): Expr {
    if (maxReps < 0 || minReps > maxReps) {
        return NULL;
    }
    if (maxReps == 0) {
        return EPSILON;
    }
    if (minReps > 0) {
        const head = constructSequence(...Array(minReps).fill(child))
        const tail = constructRepeat(child, 0, maxReps - minReps);
        return constructSequence(head, tail);
    }
    if (maxReps == Infinity) {
        return constructStar(child);
    }
    const tail = constructRepeat(child, 0, maxReps - 1);
    return constructMaybe(constructSequence(child, tail));
}

export function constructEmbed(
    symbolName: string, 
    symbols: SymbolTable,
    child: Expr | undefined = undefined
): Expr {
    const symbol = symbols[symbolName];
    if (symbol != undefined && symbol instanceof EpsilonExpr) {
        return symbol;
    }
    if (child != undefined && child instanceof EpsilonExpr) {
        return child;
    }
    return new EmbedExpr(symbolName, symbols, child);
}

export function constructNegation(
    child: Expr, 
    tapes: Set<string>,
    maxChars: number = Infinity
): Expr {
    if (child instanceof NullExpr) {
        return constructUniverse(tapes, maxChars);
    }
    if (child instanceof NegationExpr) {
        return child.child;
    }
    return new NegationExpr(child, tapes, maxChars);
}

export function constructDotStar(tape: string): Expr {
    return new DotStarExpr(tape);
}

export function constructDotRep(tape: string, maxReps:number=Infinity): Expr {
    if (maxReps == Infinity) {
        return constructDotStar(tape);
    }
    return constructRepeat(constructDot(tape), 0, maxReps);
}

export function constructUniverse(
    tapes: Set<string>, 
    maxReps: number = Infinity
): Expr {
    return constructSequence(...[...tapes]
                .map(t => constructDotRep(t, maxReps)));
}

export function constructMatch(
    child: Expr,
    tapes: Set<string>,
    buffers: {[key: string]: Expr} = {}
): Expr {
    if (child instanceof EpsilonExpr && Object.values(buffers).every(b=>b instanceof EpsilonExpr)) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new MatchExpr(child, tapes, buffers);
}


export function constructMatchFrom(state: Expr, firstTape: string, ...otherTapes: string[]): Expr {
    // Construct a Match for multiple tapes given a expression for the first tape. 
    return constructMatch(constructSequence(state,
                            ...otherTapes.map((t: string) => constructRename(state, firstTape, t))),
                          new Set([firstTape, ...otherTapes]));
}

export function constructRename(
    child: Expr, 
    fromTape: string, 
    toTape: string
): Expr {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    if (child instanceof LiteralExpr && child.tapeName == fromTape) {
        return constructLiteral(toTape, child.text, child.index);
    }
    if (child instanceof DotExpr && child.tapeName == fromTape) {
        return constructDot(fromTape);
    }
    return new RenameExpr(child, fromTape, toTape);
}


export function constructFilter(c1: Expr, c2: Expr, tapes: Set<string>): Expr {
    if (c1 instanceof NullExpr) {
        return c1;
    }
    if (c2 instanceof NullExpr) {
        return c2;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    return new FilterExpr(c1, c2, tapes);
}

export function constructJoin(c1: Expr, c2: Expr, tapes1: Set<string>, tapes2: Set<string>): Expr {
    if (c1 instanceof NullExpr) {
        return c1;
    }
    if (c2 instanceof NullExpr) {
        return c2;
    }
    if (c1 instanceof EpsilonExpr && c2 instanceof EpsilonExpr) {
        return c1;
    }
    return new JoinExpr(c1, c2, tapes1, tapes2);
}