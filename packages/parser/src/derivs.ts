import { Gen, setDifference, StringDict } from "./util";
import { MultiTapeOutput, Tape, RenamedTape, TapeCollection, Token, ANY_CHAR } from "./tapes";
import { assert } from "chai";
import { Match, Null } from "./ast";

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
 *   𝛿(L2) = 0
 * 
 * Brzozowski proved that all regular grammars have only finitely many derivatives (even if 
 * the grammar itself generates infinitely).
 * 
 * You can generate from a grammar L by trying each possible letter for c, and then, for 
 * each derivative L' in D_c(L), trying each possible letter again to get L'' in D_c(L'), etc.
 * If you put those letters c into a tree, you've got L again, but this time in trie form. 
 * That's basically what we're doing!  Except it'd be silly to actually iterate through all the possible
 * letters; instead we represent our vocabulary of possible letters as a set of bits and do bitwise
 * operations on them. 
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

export interface INamespace {
    register(symbolName: string): void;
    getSymbol(name: string, stack: CounterStack | undefined): Expr | undefined;
    addSymbol(name: string, expr: Expr): void;
    compileSymbol(
        name: string, 
        allTapes: TapeCollection, 
        stack: CounterStack,
        compileLevel: number
    ): void;
}

/**
 * Expr
 * 
 * Expr is the basic class of the parser; it represents a symbolic 
 * expression like A|B or epsilon+(C&D).  These expressions also represent 
 * "states" or "nodes" in a (potentially abstract) state graph; this class was
 * originally called "State".  (You can think of Brzozowski's algorithm as 
 * simultaneously constructing and traversing a FSA.  Calculating the Brz. derivative of
 * expression A with respect to some character "c" can be conceptualized as following
 * the transition, labeled "c", between a node corresponding to A and a node 
 * corresponding to its derivative expression.
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
 *            eliminate trivially-identical results.
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

        var results: [Tape, Token, Expr][] = [];
        var nextExprs: [Tape, Token, Expr][] = [... this.deriv(tape, target, stack)];
        
        for (var [nextTape, nextBits, next] of nextExprs) {

            var newResults: [Tape, Token, Expr][] = [];
            for (var [otherTape, otherBits, otherNext] of results) {
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
        allTapes: TapeCollection,
        random: boolean = false,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {
    
        const stack = new CounterStack(maxRecursion);

        /*
        if (random) {
            yield* this.generateRandom(allTapes, stack, maxChars);
            return;
        } */

        yield* this.generateBreadthFirst(allTapes, stack, maxChars);
    }

    public *generateBreadthFirst(
        allTapes: TapeCollection,
        stack: CounterStack,
        maxChars: number = 1000
    ) {

        const initialOutput: MultiTapeOutput = new MultiTapeOutput();

        const startingTapes = [...allTapes.tapes.values()];

        var stateQueue: [Tape[], MultiTapeOutput, Expr, number][] = [[startingTapes, initialOutput, this, 0]];

        while (stateQueue.length > 0) {
            let nextQueue: [Tape[], MultiTapeOutput, Expr, number][] = [];
            for (let [tapes, prevOutput, prevExpr, chars] of stateQueue) {

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

                // rotate the tapes so that we don't keep trying the same one every time
                tapes = [... tapes.slice(1), tapes[0]];

                //console.log(`querying ${prevExpr.id}`);
                const tapeToTry = tapes[0];
                for (const [cTape, cTarget, cNext] of prevExpr.disjointDeriv(tapeToTry, ANY_CHAR, stack)) {
                    //console.log(`D_${cTape.tapeName}:${cTarget.stringify(cTape)} = ${cNext.id}`);
                    const nextOutput = prevOutput.add(cTape, cTarget);
                    nextQueue.push([tapes, nextOutput, cNext, chars+1]);
                }

                const delta = prevExpr.delta(tapeToTry, stack);
                //console.log(`𝛿_${tapeToTry.tapeName} = ${delta.id}`)
                if (!(delta instanceof NullExpr)) {                    
                    const newTapes = tapes.slice(1);
                    nextQueue.push([newTapes, prevOutput, delta, chars]);
                }
            }
            stateQueue = nextQueue;
        }
    }

    /*
    public *generateRandom(
        allTapes: TapeCollection,
        stack: CounterStack,
        maxChars: number = 1000
    ): Gen<StringDict> {

        const initialOutput: MultiTapeOutput = new MultiTapeOutput();

        // the extra number in the queue here is:
        //    the number of chars, so that we can abort when we've exceeded
        //    the max.  unlike the normal breadth-first algorithm the hypotheses
        //    in the queue won't all share the same number of chars queried, so 
        //    we have to keep track of that for each

        var stateQueue: [MultiTapeOutput, Expr, number][] = 
                        [[initialOutput, this, 0]];

        const candidates: [MultiTapeOutput, Expr, number][] = [];

        while (stateQueue.length > 0) {
            const randomIndex = Math.floor(Math.random()*stateQueue.length);
            const [currentOutput, currentExpr, chars] = stateQueue.splice(randomIndex, 1)[0];
            
            if (currentExpr.accepting(allTapes, stack)) {
                candidates.push([currentOutput, currentExpr, chars]);
            }

            if (chars < maxChars) {
                for (const [tape, c, newExpr] of 
                        currentExpr.deriv(allTapes, ANY_CHAR, stack)) {
                    const nextOutput = currentOutput.add(tape, c);
                    stateQueue.push([nextOutput, newExpr, chars+1]);
                }
            }
            
            if (Math.random() < 0.05 && candidates.length > 0) {
                const candidateIndex = Math.floor(Math.random()*candidates.length);
                const [candidateOutput, candidateExpr, candidateChars] = candidates.splice(candidateIndex, 1)[0];
                yield* candidateOutput.toStrings(true);
            }
        }

        if (candidates.length == 0) {
            return;
        }

        const candidateIndex = Math.floor(Math.random()*candidates.length);
        const [candidateOutput, candidateExpr, candidateChars] = candidates[candidateIndex];
        yield* candidateOutput.toStrings(true);

    } */
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
}

/**
 * Recognizes/emits a literal string on a particular tape.  
 * Inside, it's just a string like "foo"; upon successfully 
 * matching "f" we construct a successor state looking for 
 * "oo", and so on.
 */
class LiteralExpr extends Expr {

    constructor(
        public tapeName: string,
        public text: string,
        public index: number = 0
    ) { 
        super();
    }

    public get id(): string {
        const index = this.index > 0 ? `[${this.index}]` : ""; 
        return `${this.tapeName}:${this.text}${index}`;
    }

    public getText(): string {
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

    public collectVocab(tapes: Tape, stack: string[]): void {
        tapes.tokenize(this.tapeName, this.text);
    }

    protected getToken(tape: Tape): Token {
        return tape.tokenize(tape.tapeName, this.text[this.index])[0];
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
        const nextExpr = new LiteralExpr(this.tapeName, this.text, this.index+1);
        yield [matchedTape, result, nextExpr];

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
        return `(${this.child1.id}+${this.child2.id})`;
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
            this.child1.deriv(tape, target, stack)) {

            for (const [c2tape, c2target, c2next] of 
                    this.child2.deriv(c1tape, c1target, stack)) {
                const successor = constructIntersection(c1next, c2next);
                yield [c2tape, c2target, successor];
            }
        }
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
        public namespace: INamespace,
        public _child: Expr | undefined = undefined
    ) { 
        super();
    }

    public get id(): string {
        return `${this.constructor.name}(${this.symbolName})`;
    }

    public getChild(stack: CounterStack | undefined = undefined): Expr {
        if (this._child == undefined) {
            const child = this.namespace.getSymbol(this.symbolName, stack);
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain. 
                return EPSILON;
            } 
            this._child = child;
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

        for (const [childchildTape, childTarget, childNext] of 
                        child.deriv(tape, target, stack)) {
            const successor = new EmbedExpr(this.symbolName, this.namespace, childNext);
            yield [childchildTape, childTarget, successor];
        }
    }
}

/**
 * Abstract base class for states with only one child state.  Typically, UnaryExprs
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
abstract class UnaryExpr extends Expr {

    constructor(
        public child: Expr
    ) { 
        super();
    }

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }
}

class MemoExpr extends UnaryExpr {

    public acceptingOnStart: {[tape: string]: boolean} = {};
    public transitionsByTape: {[tape: string]: [Tape, Token, Expr][]} = {};

    public addTransition(queryTape: Tape,
                        resultTape: Tape,
                        token: Token,
                        next: Expr): void {
        if (!(queryTape.tapeName in this.transitionsByTape)) {
            this.transitionsByTape[queryTape.tapeName] = [];
        }
        this.transitionsByTape[queryTape.tapeName].push([resultTape, token, next]);
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        const childNext = this.child.delta(tape, stack);
        return constructMemo(childNext);
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        var transitions = this.transitionsByTape[tape.tapeName];
        if (transitions == undefined) {
            this.transitionsByTape[tape.tapeName] = [];
            transitions = [];
        }

        var remainder = new Token(target.bits.clone());

        // first we go through results we've tried before
        for (const [origResultTape, token, next] of transitions) {
            /*if (origResultTape.isTrivial) { // no vocab, so no possible results
                yield [origResultTape, token, next];
                return;
            } */
            
            if (next instanceof NullExpr) {
                break;
            }

            const matchedTape = tape.matchTape(origResultTape.tapeName);
            if (matchedTape == undefined) {
                throw new Error(`Failed to match ${tape.tapeName} to ${origResultTape.tapeName}..?`);
            }
            
            const resultToken = matchedTape.match(token, target);
            if (resultToken.isEmpty()) {
                continue;
            }
            
            yield [matchedTape, resultToken, next];

            remainder = remainder.andNot(resultToken);
            if (remainder.isEmpty()) {
                return;
            }
        }

        if (remainder.isEmpty()) {
            return;
        }

        // if we get here, remainder is non-empty
        for (const [cTape, cTarget, cNext] of this.child.disjointDeriv(tape, remainder, stack)) {
            
            if (cNext instanceof NullExpr) {
                continue;
            }

            const shared = cTarget.and(remainder);
            const successor = constructMemo(cNext);
            yield [cTape, shared, successor];
            this.addTransition(tape, cTape, shared, successor);
            remainder = remainder.andNot(shared);
            if (remainder.isEmpty()) {
                return;
            }
        }

        if (remainder.isEmpty()) {
            return;
        }

        // if we get here, there are characters that don't match any result.  we don't
        // want to forever keep querying the child for characters we know don't have any 
        // result, so we remember that they're Null
        this.addTransition(tape, tape, remainder, NULL);
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
        tape = new RenamedTape(tape, this.fromTape, this.toTape);
        const newChild = this.child.delta(tape, stack);
        return constructRename(newChild, this.fromTape, this.toTape);
    }

    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (tape.tapeName == this.fromTape) {
            return;
        }

        tape = new RenamedTape(tape, this.fromTape, this.toTape);
    
        for (var [childTape, childTarget, childNext] of 
                this.child.deriv(tape, target, stack)) {
            if (childTape instanceof RenamedTape) {
                childTape = childTape.child;
            }
            yield [childTape, childTarget, new RenameExpr(childNext, this.fromTape, this.toTape)];
        }
    }
}

class NegationExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Set<string>
    ) { 
        super(child);
    }

    public delta(tape: Tape, stack: CounterStack): Expr {
        const childDelta = this.child.delta(tape, stack);
        const remainingTapes = setDifference(this.tapes, new Set([tape.tapeName]));
        return constructNegation(childDelta, remainingTapes);
    }
    
    public *deriv(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, Expr]> {

        if (!this.tapes.has(tape.tapeName)) {
            return;
        }

        var remainder = new Token(target.bits.clone());

        for (const [childTape, childText, childNext] of 
                this.child.disjointDeriv(tape, target, stack)) {
            remainder = remainder.andNot(childText);
            const successor = constructNegation(childNext, this.tapes);
            yield [childTape, childText, successor];
        }

        if (remainder.isEmpty()) {
            return;
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything state that always
        // succeeds.
        yield [tape, remainder, constructUniverse(this.tapes)];
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
        return `Match(${Object.values(this.buffers).map(b=>b.id).join("+")},${this.child.id}`;
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
                //console.log(`buffer for ${tape.tapeName} isn't empty: ${buffer.id}`);
                return NULL;
            }
            newBuffers[tape.tapeName] = deltaBuffer;
        }
        var result: Expr = this.child;
        for (const mTapeName of this.tapes) {
            const mTape = tape.getTape(mTapeName);
            if (mTape == undefined) {
                throw new Error(`Cannot find tape ${mTape}`);
            }
            result = result.delta(mTape, stack);
        }
        if (!(result instanceof NullExpr)) {
            return constructSequence(...Object.values(newBuffers), result);
        } else {
            //console.log(`child for ${tape.tapeName} isn't empty: ${this.child.id}, delta is ${result.id}`);
            return NULL;
        }
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
                var c1bufMatched = false;
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
                //Object.assign(newBuffers, this.buffers);
                if (!c1bufMatched) {
                    for (const tapeName of this.tapes.keys()) {
                        const buffer = this.buffers[tapeName];
                        if (tapeName == c1tape.tapeName) {
                            // we're going to match it in a moment, don't need to match
                            // it again!
                            if (buffer != undefined) {
                                newBuffers[tapeName] = buffer;
                            }
                            continue;
                        }
                        var prevText: string = "";
                        if (buffer instanceof LiteralExpr) {
                            // that means we already found stuff we needed to match,
                            // so we add to that
                            prevText = buffer.getText();
                        }
                        newBuffers[tapeName] = new LiteralExpr(tapeName, prevText + c);
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
}

/* CONVENIENCE FUNCTIONS */
export const EPSILON = new EpsilonExpr();
export const NULL = new NullExpr();
//export const UNIVERSE = new UniverseExpr();

export function constructLiteral(tape: string, text: string): Expr {
    return new LiteralExpr(tape, text);
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
 * Creates A{min,max} from A.  Distinguished from createStar
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

export function constructEmbed(symbolName: string, ns: INamespace): Expr {
    const symbol = ns.getSymbol(symbolName, undefined);
    if (symbol instanceof EpsilonExpr) {
        return symbol;
    }
    return new EmbedExpr(symbolName, ns);
}

export function constructNegation(child: Expr, tapes: Set<string>): Expr {
    if (child instanceof NullExpr) {
        return constructUniverse(tapes);
    }
    if (child instanceof NegationExpr) {
        return child.child;
    }
    return new NegationExpr(child, tapes);
}

export function constructDotStar(tape: string): Expr {
    return constructStar(constructDot(tape));
}

export function constructUniverse(tapes: Set<string>): Expr {
    return constructSequence(...[...tapes].map(t => constructDotStar(t)));

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
    return new RenameExpr(child, fromTape, toTape);
}

export function constructMemo(child: Expr): Expr {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new MemoExpr(child);
}