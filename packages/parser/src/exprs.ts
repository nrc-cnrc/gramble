import { ANY_CHAR_STR, BITSETS_ENABLED, DIRECTION_LTR, Gen, GenOptions, logDebug, setDifference } from "./util";
import { Tape, BitsetToken, TapeNamespace, renameTape, Token, EntangledToken } from "./tapes";

export type DerivResult = Gen<[Token, Expr]>;

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

    /**
     * delta can be seen as the Brz. derivative with respect to end-of-line: what grammars
     * are consistent with NO remaining characters on the relevant tape?  If there are no languages
     * consistent with this, the result will be a NullExpr, otherwise it's the grammar without material 
     * on that tape.  Once we've called delta(T) for some tape T, we will never again call 
     * delta(T) or deriv(T) on any successor grammar.
     * 
     * @param tapeName The local name of the tape we're querying about
     * @param tapeNS The current namespace mapping names to tapes
     * @param stack A stack of symbols already visited
     * @param opt A GenOptions object with generation configurations
     */
    public abstract delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr;

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
     * @param tapeName The local name of the tape we're querying about
     * @param target: A token object representing our current hypothesis about the next character
     * @param tapeNS The current namespace mapping names to tapes
     * @param stack A stack of symbols already visited
     * @param opt A GenOptions object with generation configurations
     */

     public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (target instanceof BitsetToken) {
            yield* this.bitsetDeriv(tapeName, target, tapeNS, stack, opt);
            return;
        }
        yield* this.stringDeriv(tapeName, target, tapeNS, stack, opt);
    }

    public bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        throw new Error("not implemented");
    }

    public stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        throw new Error("not implemented");
    }
        
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
     */ 

    public *disjointDeriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (target instanceof BitsetToken) {
            yield* this.disjointBitsetDeriv(tapeName, target, tapeNS, stack, opt);
            return;
        }
        yield* this.disjointStringDeriv(tapeName, target, tapeNS, stack, opt);
    }
    
    public *disjointBitsetDerivOld(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        const results: {[c: string]: Expr[]} = {};

        const tape = tapeNS.get(tapeName);

        for (const [childToken, childExpr] of
                this.deriv(tapeName, target, tapeNS, stack, opt)) {

            // don't perform this operation on entangled tokens
            if (childToken instanceof EntangledToken) {
                yield [childToken, childExpr];
                continue;
            }

            let c:string;
            for (c of tape.fromToken(childToken as BitsetToken)) {
                if (!(c in results)) {
                    results[c] = [];
                }
                results[c].push(childExpr);
            }
        }

        for (const c in results) {
            const nextToken = tape.toToken([c]);
            const nextExprs = results[c];
            const nextExpr = constructAlternation(...nextExprs);
            yield [nextToken, nextExpr];
        }
    }
    

    public *disjointStringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        const results: {[c: string]: Expr[]} = {};
        for (const [childToken, childExpr] of
            this.deriv(tapeName, target, tapeNS, stack, opt)) {
            const childString = childToken as string;
            if (!(childString in results)) {
                results[childString] = [];
            }
            results[childString].push(childExpr);
        }

        for (const c in results) {
            const nextExprs = results[c];
            const nextExpr = constructAlternation(...nextExprs);
            yield [c, nextExpr];
        }
    }

    public *disjointBitsetDeriv(
        tapeName: string,
        target: BitsetToken, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions,
    ): DerivResult {

        let results: [Token, Expr][] = [];
        let nextExprs: [Token, Expr][] = [... this.deriv(tapeName, target, tapeNS, stack, opt)];
        
        for (let [nextToken, next] of nextExprs) {

            if (nextToken instanceof EntangledToken) {
                yield [nextToken, next];
                continue;
            } 

            let nextBits = nextToken as BitsetToken;
            let newResults: [BitsetToken, Expr][] = [];
            for (let [otherToken, otherNext] of results) {
                let otherBits = otherToken as BitsetToken;
                // they both matched
                const intersection = nextBits.and(otherBits);
                if (!intersection.isEmpty()) {
                    // there's something in the intersection
                    const union = constructAlternation(next, otherNext);
                    newResults.push([intersection, union]); 
                }
                const notIntersection = intersection.not();
                nextBits = nextBits.and(notIntersection)
                otherBits = otherBits.and(notIntersection);

                // there's something left over
                if (!otherBits.isEmpty()) {
                    newResults.push([otherBits, otherNext]);
                }
            }
            results = newResults;
            if (!nextBits.isEmpty()) {
                results.push([nextBits, next]);
            }
        }
        yield *results;
    }

}

/**
 * An expression denoting the language with one entry, that's epsilon on all tapes.
 */
export class EpsilonExpr extends Expr {

    public get id(): string {
        return "ε";
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        return this;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult { }

}

/**
 * An expression denoting the empty language {}
 */
export class NullExpr extends Expr {

    public get id(): string {
        return "∅";
    }
    
    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        return this;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult { }
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
    
    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return NULL;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (tapeName != this.tapeName) {
            return;
        }
        yield [target, EPSILON];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult { 
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(tapeName);

        for (const c of tape.expandStrings(target)) {
            yield [c, EPSILON];
        }
    }
}

class EntangleExpr extends Expr {

    constructor(
        public tapeName: string,
        public token: EntangledToken
    ) {
        super();
    }

    public get id(): string {
        return `(bits)`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return NULL;
    }
    
    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(tapeName);
        const result = tape.match(this.token, target);
        if (result.isEmpty()) {
            return;
        }
        yield [result, EPSILON];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        throw new Error("not implemented")
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

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return NULL;
    }

    protected getToken(tape: Tape): BitsetToken {
        return tape.toToken(this.chars);
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(tapeName);

        const bits = this.getToken(tape);
        const result = tape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        yield [result, EPSILON];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(tapeName);
        for (const c of tape.expandStrings(target)) {
            if (this.chars.indexOf(c) == -1) {
                continue;
            }
            yield [c, EPSILON];
        }
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
    
    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return EPSILON;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (tapeName != this.tapeName) {
            return;
        }
        yield [target, this];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (tapeName != this.tapeName) {
            return;
        }
        
        const tape = tapeNS.get(tapeName);
        for (const c of tape.expandStrings(target)) {
            yield [c, this];
        }
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

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        if (this.index >= this.text.length) {
            return EPSILON;
        }
        return NULL;
    }

    protected getToken(tape: Tape): BitsetToken {
        return tape.toToken([this.text[this.index]]);
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (this.index >= this.text.length) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(tapeName);

        const currentToken = this.getToken(tape);
        const result = tape.match(currentToken, target);
        if (result.isEmpty()) {
            return;
        }
        const nextExpr = constructLiteral(this.tapeName, this.text, this.index+1);
        yield [result, nextExpr];

    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (this.index >= this.text.length) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        if (target == ANY_CHAR_STR || target == this.text[this.index]) {
            const nextExpr = constructLiteral(this.tapeName, this.text, this.index+1);
            yield [this.text[this.index], nextExpr];
        }
    }

}

class RTLLiteralExpr extends LiteralExpr {

    constructor(
        public tapeName: string,
        public text: string[],
        public index: number = text.length-1
    ) {
        super(tapeName, text, index);
    }

    public get id(): string {
        const index = this.index < this.text.length-1 ? `[${this.index}]` : ""; 
        return `${this.tapeName}:${this.text.join("")}${index}`;
    }

    public getText(): string[] {
        // Return the remaining text for this LiteralState.
        return this.text.slice(0, this.index+1);
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }

        if (this.index < 0) {
            return EPSILON;
        }

        return NULL;
    }

    protected getToken(tape: Tape): BitsetToken {
        return tape.toToken([this.text[this.index]]);
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (this.index < 0) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(tapeName);

        const currentToken = this.getToken(tape);
        const result = tape.match(currentToken, target);
        if (result.isEmpty()) {
            return;
        }
        const nextExpr = constructLiteral(this.tapeName, this.text, this.index-1);
        yield [result, nextExpr];

    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (this.index < 0) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        if (target == ANY_CHAR_STR || target == this.text[this.index]) {
            const nextExpr = constructLiteral(this.tapeName, this.text, this.index-1);
            yield [this.text[this.index], nextExpr];
        }
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

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, tapeNS, stack, opt);
        const newChild2 = this.child2.delta(tapeName, tapeNS, stack, opt);
        return constructConcat(newChild1, newChild2);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        const [c1, c2] = (DIRECTION_LTR) ?
                        [this.child1, this.child2] :
                        [this.child2, this.child1];

        for (const [c1target, c1next] of
                c1.deriv(tapeName, target, tapeNS, stack, opt)) {
            yield [c1target, constructPrecede(c1next, c2)];
        }

        const c1next = c1.delta(tapeName, tapeNS, stack, opt);
        for (const [c2target, c2next] of
                c2.deriv(tapeName, target, tapeNS, stack, opt)) {
            yield [c2target, constructPrecede(c1next, c2next)];
        }
    }

}

export class UnionExpr extends Expr {

    constructor(
        public children: Expr[]
    ) { 
        super()
    }

    public get id(): string {
        return "(" + this.children.map(c => c.id).join("|") + ")";
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChildren = this.children.map(c => 
                            c.delta(tapeName, tapeNS, stack, opt));
        const result = constructAlternation(...newChildren);
        return result;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        for (const child of this.children) {
            yield* child.deriv(tapeName, target, tapeNS, stack, opt);
        }
    }

}

class IntersectExpr extends BinaryExpr {

    public get id(): string {
        return `(${this.child1.id}&${this.child2.id})`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, tapeNS, stack, opt);
        const newChild2 = this.child2.delta(tapeName, tapeNS, stack, opt);
        return constructIntersection(newChild1, newChild2);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        for (const [c1target, c1next] of 
            this.child1.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {

            for (const [c2target, c2next] of 
                    this.child2.disjointDeriv(tapeName, c1target, tapeNS, stack, opt)) {
                const successor = constructIntersection(c1next, c2next);
                yield [c2target, successor];
            }
        }
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
    
    public get id(): string {
        return `${this.child1.id}[${this.child2.id}]`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, tapeNS, stack, opt);
        const newChild2 = this.child2.delta(tapeName, tapeNS, stack, opt);
        return constructFilter(newChild1, newChild2, this.tapes);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (!this.tapes.has(tapeName)) {
            for (const [c1target, c1next] of 
                    this.child1.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {
                const successor = constructFilter(c1next, this.child2, this.tapes);
                yield [c1target, successor];
            }
            return;
        }
        
        for (const [c2target, c2next] of 
            this.child2.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {

            for (const [c1target, c1next] of 
                    this.child1.disjointDeriv(tapeName, c2target, tapeNS, stack, opt)) {
                const successor = constructFilter(c1next, c2next, this.tapes);
                yield [c1target, successor];
            }
        }
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
        return `(${this.child1.id}⋈${this.child2.id})`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, tapeNS, stack, opt);
        const newChild2 = this.child2.delta(tapeName, tapeNS, stack, opt);
        return constructJoin(newChild1, newChild2, this.tapes1, this.tapes2);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (!this.tapes2.has(tapeName)) {
            for (const [leftTarget, leftNext] of 
                    this.child1.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {
                const successor = constructJoin(leftNext, this.child2, this.tapes1, this.tapes2);
                yield [leftTarget, successor];
            }
            return;
        }
        
        if (!this.tapes1.has(tapeName)) {
            for (const [rightTarget, rightNext] of 
                    this.child2.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {
                const successor = constructJoin(this.child1, rightNext, this.tapes1, this.tapes2);
                yield [rightTarget, successor];
            }
            return;
        }
        
        for (const [leftTarget, leftNext] of 
            this.child1.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {

            for (const [rightTarget, rightNext] of 
                    this.child2.disjointDeriv(tapeName, leftTarget, tapeNS, stack, opt)) {
                const successor = constructJoin(leftNext, rightNext, this.tapes1, this.tapes2);
                yield [rightTarget, successor];
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
        public symbols: SymbolTable,
        public _child: Expr | undefined = undefined
    ) { 
        super();
    }

    public get id(): string {
        return `\$${this.symbolName}`;
    }

    public getChild(): Expr {
        if (this._child == undefined) {
            let child = this.symbols[this.symbolName];
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain. 
                child = EPSILON;
            } 
            this._child = child;
        }
        return this._child;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (stack.exceedsMax(this.symbolName)) {
            return NULL;
        }
        const newStack = stack.add(this.symbolName);
        return this.getChild().delta(tapeName, tapeNS, newStack, opt);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (stack.exceedsMax(this.symbolName)) {
            return;
        }

        const newStack = stack.add(this.symbolName);
        let child = this.getChild();

        for (const [childTarget, childNext] of 
                        child.deriv(tapeName, target, tapeNS, newStack, opt)) {
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

export class CountExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public maxChars: number
    ) {
        super(child);
    }

    public get id(): string {
        return `Count(${this.maxChars},${this.child.id})`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild = this.child.delta(tapeName, tapeNS, stack, opt);
        return constructCount(newChild, this.maxChars);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        if (this.maxChars <= 0) {
            return;
        }

        for (const [cTarget, cNext] of this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
            const successor = constructCount(cNext, this.maxChars-1);
            yield [cTarget, successor];
        }
    }
}

export class CountTapeExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public maxChars: {[tape: string]: number}
    ) {
        super(child);
    }

    public get id(): string {
        return `CountTape(${JSON.stringify(this.maxChars)},${this.child.id})`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild = this.child.delta(tapeName, tapeNS, stack, opt);
        return constructCountTape(newChild, this.maxChars);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (!(tapeName in this.maxChars)) {
            return;
        }

        if (this.maxChars[tapeName] <= 0) {
            return;
        }

        for (const [cTarget, cNext] of this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
            let newMax: {[tape: string]: number} = {};
            Object.assign(newMax, this.maxChars);
            newMax[tapeName] -= 1;
            const successor = constructCountTape(cNext, newMax);
            yield [cTarget, successor];
        }
    }
}

export class PriorityExpr extends UnaryExpr {

    constructor(
        public tapes: string[],
        public child: Expr
    ) { 
        super(child)
    }

    public get id(): string {
        return `${this.tapes}:${this.child.id}`;
    }

    public delta(
        tapeName: string, 
        tapeNS: TapeNamespace, 
        stack: CounterStack, 
        opt: GenOptions
    ): Expr {
        const delta = this.child.delta(tapeName, tapeNS, stack, opt);
        return constructPriority(this.tapes, delta);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        for (const [cTarget, cNext] of 
                this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
            const successor = constructPriority(this.tapes, cNext);
            yield [cTarget, successor];
        }
    }

    public openDelta(
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const tapeToTry = this.tapes[0];
        const childDelta = this.child.delta(tapeToTry, tapeNS, stack, opt);
        logDebug(opt.verbose, `d^${tapeToTry} is ${childDelta.id}`);
        const newTapes = this.tapes.slice(1);
        return constructPriority(newTapes, childDelta);
    }

    public *openDeriv(
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): Gen<[string, Token, Expr]> {

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
                const successor = constructPriority(newTapes, cNext);
                yield [tapeToTry, cTarget, successor];
            }
        }
    }
}

/**
 * ShortExprs "short-circuit" as soon as any of their children
 * are nullable -- that is, it has no derivatives if it has any
 * delta.
 * 
 * The denotation of Short(X) is the denotation of X but where
 * no entries are prefixes of each other; if for any two entries
 * <X,Y> X is a prefix of Y, Y is thrown out.  So something like 
 * (h|hi|hello|goo|goodbye|golf) would be (h|goo|golf).
 */
class ShortExpr extends UnaryExpr {

    public get id(): string {
        return `Short(${this.child.id})`
    }

    public delta(
        tapeName: string, 
        tapeNS: TapeNamespace, 
        stack: CounterStack, 
        opt: GenOptions
    ): Expr {
        const childNext = this.child.delta(tapeName, tapeNS, stack, opt);
        return constructShort(childNext);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        const delta = this.delta(tapeName, tapeNS, stack, opt);
        if (!(delta instanceof NullExpr)) {
            // if our current tape is nullable, then we have 
            // no derivatives on that tape.
            return;
        }

        // Important: the deriv here MUST be disjoint, just like 
        // under negation.
        for (const [cTarget, cNext] of this.child.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {
            const successor = constructShort(cNext);
            yield [cTarget, successor];
        }
    }
}

export function constructShort(child: Expr): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new ShortExpr(child);
}

class RepeatExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public minReps: number = 0,
        public maxReps: number = Infinity
    ) { 
        super(child);
    }

    public get id(): string {
        if (this.minReps == 0 && this.maxReps == Infinity) {
            return `(${this.child.id})*`;
        }
        return `(${this.child.id}){${this.minReps},${this.maxReps}}`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const newChild = this.child.delta(tapeName, tapeNS, stack, opt);
        return constructRepeat(newChild, this.minReps, this.maxReps);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        for (const [cTarget, cNext] of this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
            const oneLess = constructRepeat(this.child, this.minReps-1, this.maxReps-1);
            yield [cTarget, constructPrecede(cNext, oneLess)];
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

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return this;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
        const newChild = this.child.delta(newTapeName, newTapeNS, stack, opt);
        return constructRename(newChild, this.fromTape, this.toTape);
    }
    
    public get id(): string {
        return `${this.fromTape}>${this.toTape}(${this.child.id})`;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
    
        for (const [childTarget, childNext] of 
                this.child.deriv(newTapeName, target, newTapeNS, stack, opt)) {
            yield [childTarget, constructRename(childNext, this.fromTape, this.toTape)];
        }
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

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        const childDelta = this.child.delta(tapeName, tapeNS, stack, opt);
        const remainingTapes = setDifference(this.tapes, new Set([tapeName]));
        
        let result: Expr;
        
        if (childDelta instanceof NullExpr) {
            result = constructNegation(childDelta, remainingTapes, this.maxChars);
            return result;
        }
        if (remainingTapes.size == 0) {
            result = NULL;
            return result;
        }
        
        result = constructNegation(childDelta, remainingTapes, this.maxChars);
        return result;
    }
    
    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (!this.tapes.has(tapeName)) {
            return;
        }

        if (this.maxChars == 0) {
            return;
        }

        const [disentangledTarget, entanglements] = target.disentangle(); 
        let remainder = disentangledTarget.clone();

        for (const [childText, childNext] of 
                this.child.disjointDeriv(tapeName, disentangledTarget, tapeNS, stack, opt)) {

            const complement = (childText as BitsetToken).not();
            remainder = remainder.and(complement);
            const successor = constructNegation(childNext, this.tapes, this.maxChars-1);
            const reEntangledText = (childText as BitsetToken).reEntangle(entanglements);
            yield [reEntangledText, successor];
        }

        if (remainder.isEmpty()) {
            return;
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything expression that always
        // succeeds.
        
        const reEntangledRemainder = remainder.reEntangle(entanglements);
        yield [reEntangledRemainder, constructUniverse(this.tapes, this.maxChars-1)];
    }
    
    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {

        if (!this.tapes.has(tapeName)) {
            return;
        }

        if (this.maxChars == 0) {
            return;
        }

        const tape = tapeNS.get(tapeName);

        let remainder = tape.toToken([target]);

        for (const [childText, childNext] of 
                this.child.disjointDeriv(tapeName, target, tapeNS, stack, opt)) {
            const childToken = tape.toToken([childText as string]);
            const complement = childToken.not();
            remainder = remainder.and(complement);
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
        for (const c of tape.fromToken(remainder)) {
            yield [c, constructUniverse(this.tapes, this.maxChars-1)];
        }
    }
}

export class MatchFromExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }

    public get id(): string {
        return `M(${this.child.id})`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {
        if (tapeName == this.toTape) {
            const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
            const nextExpr = this.child.delta(newTapeName, newTapeNS, stack, opt);
            return constructMatchFrom(nextExpr, this.fromTape, this.toTape);  
        }
        const nextExpr = this.child.delta(tapeName, tapeNS, stack, opt);
        return constructMatchFrom(nextExpr, this.fromTape, this.toTape);
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        
        // if it's a tape that isn't our to/from, just forward and wrap 
        if (tapeName != this.fromTape && tapeName != this.toTape) {
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
                const successor = constructMatchFrom(cNext, this.fromTape, this.toTape);
                yield [cTarget, successor];
            }
            return;
        }

        // tapeName is either our toTape or fromTape.  The only differences
        // between these two cases is (a) we buffer the literal on the opposite
        // tape, that's what oppositeTape is below and (b) when tapeName is our
        // toTape, we have to act like a toTape->fromTape rename.  

        const oppositeTapeName = (tapeName == this.fromTape) ? this.toTape : this.fromTape;
        const oppositeTape = tapeNS.get(oppositeTapeName);
        const fromTape = tapeNS.get(this.fromTape);
        const toTape = tapeNS.get(this.toTape);

        // We ask for a namespace rename either way; when tapeName == fromTape,
        // this is just a no-op
        const newTapeNS = tapeNS.rename(tapeName, this.fromTape); 

        for (const [cTarget, cNext] of 
                this.child.deriv(this.fromTape, target, newTapeNS, stack, opt)) {
            const successor = constructMatchFrom(cNext, this.fromTape, this.toTape);
            const maskedTarget = oppositeTape.restrictToVocab(cTarget as BitsetToken);
            if (maskedTarget.isEmpty()) {
                continue;
            }
            const entangledTarget = new EntangledToken(maskedTarget);
            const lit = constructEntangle(oppositeTapeName, entangledTarget);
            yield [entangledTarget, constructPrecede(lit, successor)];
        }
    }
    
    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        
        // if it's a tape that isn't our to/from, just forward and wrap 
        if (tapeName != this.fromTape && tapeName != this.toTape) {
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
                const successor = constructMatchFrom(cNext, this.fromTape, this.toTape);
                yield [cTarget, successor];
            }
            return;
        }

        // tapeName is either our toTape or fromTape.  The only differences
        // between these two cases is (a) we buffer the literal on the opposite
        // tape, that's what oppositeTape is below and (b) when tapeName is our
        // toTape, we have to act like a toTape->fromTape rename.  

        const oppositeTape = (tapeName == this.fromTape) ? this.toTape : this.fromTape;
        const fromTape = tapeNS.get(this.fromTape);
        const toTape = tapeNS.get(this.toTape);

        // We ask for a namespace rename either way; when tapeName == fromTape,
        // this is just a no-op
        const newTapeNS = tapeNS.rename(tapeName, this.fromTape); 

        for (const [cTarget, cNext] of 
                this.child.deriv(this.fromTape, target, newTapeNS, stack, opt)) {
            const successor = constructMatchFrom(cNext, this.fromTape, this.toTape);
            for (const c of toTape.expandStrings(cTarget as string, fromTape)) {
                const lit = constructLiteral(oppositeTape, [c]);
                yield [c, constructPrecede(lit, successor)];
            }
        }

        
    }
}

export class MatchExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Set<string>
    ) {
        super(child);
    }

    public get id(): string {
        return `M(${this.child.id})`;
    }

    public delta(
        tapeName: string,
        tapeNS: TapeNamespace, 
        stack: CounterStack,
        opt: GenOptions
    ): Expr {

        if (!this.tapes.has(tapeName)) {
            // it's not a tape we're matching
            const nextExpr = this.child.delta(tapeName, tapeNS, stack, opt);
            return constructMatch(nextExpr, this.tapes);
        }

        let result: Expr = this.child;
        for (const t of this.tapes) {
            result = result.delta(t, tapeNS, stack, opt);
        }
        return result;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        throw new Error("Method not implemented.");
    }
    
    public *stringDeriv(
        tapeName: string,
        target: string, 
        tapeNS: TapeNamespace,
        stack: CounterStack,
        opt: GenOptions
    ): DerivResult {
        
        if (!this.tapes.has(tapeName)) {
            // it's not a tape we're matching
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, tapeNS, stack, opt)) {
                yield [cTarget, constructMatch(cNext, this.tapes)];
            }
            return;
        }

        let results: [string, Expr][] = [[target, this.child]];
        for (const t of this.tapes) {
            const nextResults: [string, Expr][] = [];
            for (const [prevTarget, prevExpr] of results) {
                /*const actualTape = tapeNS.get(t);
                if (prevTarget != ANY_CHAR_STR && !actualTape.inVocab([prevTarget])) {
                    // don't attempt to match if the character isn't even in the vocabulary
                    break;
                }*/
                for (const [cTarget, cNext] of prevExpr.deriv(t, prevTarget, tapeNS, stack, opt)) {
                    nextResults.push([cTarget as string, cNext]);
                }
            }
            results = nextResults;    
        }

        const tape = tapeNS.get(tapeName);

        for (const [nextTarget, nextExpr] of results) {
            
            const cs = tape.expandStrings(nextTarget);

            for (const c of cs) {
                let bufferedNext: Expr = constructMatch(nextExpr, this.tapes);
                for (const matchTape of this.tapes) {
                    if (matchTape == tapeName) {
                        continue;
                    }
                    const lit = constructLiteral(matchTape, [c]);
                    bufferedNext = constructPrecede(lit, bufferedNext);
                }
                yield [c, bufferedNext];
            }
        }
    }
}

/* CONVENIENCE FUNCTIONS */
export const EPSILON = new EpsilonExpr();
export const NULL = new NullExpr();
//export const UNIVERSE = new UniverseExpr();

export function constructLiteral(
    tape: string, 
    text: string[],
    index: number | undefined = undefined
): Expr {
    if (DIRECTION_LTR) {
        if (index == undefined) { index = 0; }
        if (index >= text.length) {
            return EPSILON;
        }
        return new LiteralExpr(tape, text, index);
    }
    if (index == undefined) { index = text.length -1; }
    if (index <= 0) {
        return EPSILON;
    }
    return new RTLLiteralExpr(tape, text, index);
}

export function constructCharSet(tape: string, chars: string[]): CharSetExpr {
    return new CharSetExpr(tape, chars);
}

export function constructDot(tape: string): Expr {
    return new DotExpr(tape);
}

/**
 * constructPrecede is a lot like constructing a concat, except that
 * firstChild is going to be "first" according to whatever the parse order
 * (LTR or RTL) is.  That is, in a normal concat, A+B, you parse/generate A
 * before B when going LTR, and B before A when going RTL.  That's fine for
 * a normal concat, but there are some results of derivs where you have to be
 * sure that one child is parse/generated from before the others, whichever
 * order you happen to be generating from.  (In other words, concats say
 * "A is to the left of B", but 'precedes' say "A comes before B".)
 */
export function constructPrecede(firstChild: Expr, secondChild: Expr) {

    if (DIRECTION_LTR) {
        return constructConcat(firstChild, secondChild);
    }
    return constructConcat(secondChild, firstChild);

}

export function constructConcat(c1: Expr, c2: Expr): Expr {
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
    return new ConcatExpr(c1, c2);
}

export function constructSequence(...children: Expr[]): Expr {
    
    if (children.length == 0) {
        return EPSILON;
    }

    if (children.length == 1) {
        return children[0];
    }
    
    if (DIRECTION_LTR) {
        const c2 = constructSequence(...children.slice(1));
        return constructConcat(children[0], c2);
    } else {
        const c1 = constructSequence(...children.slice(0, children.length-1));
        return constructConcat(c1, children[children.length-1]);
    }
}

export function constructAlternation(...children: Expr[]): Expr {
    const newChildren: Expr[] = [];
    let foundEpsilon: boolean = false;
    for (const child of children) {
        if (child instanceof NullExpr) {
            continue;
        }
        if (child instanceof EpsilonExpr) {
            if (foundEpsilon) {
                continue;
            }
            foundEpsilon = true;
        }
        newChildren.push(child);
    }

    if (newChildren.length == 0) {
        return NULL;
    }
    if (newChildren.length == 1) {
        return newChildren[0];
    }
    return new UnionExpr(newChildren);
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

export function constructCount(child: Expr, maxChars: number): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new CountExpr(child, maxChars);
}

export function constructCountTape(child: Expr, maxChars: {[t: string]: number}): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new CountTapeExpr(child, maxChars);
}

export function constructEmbed(
    symbolName: string, 
    symbols: SymbolTable,
    child: Expr | undefined = undefined
): Expr {
    const symbol = symbols[symbolName];
    if (symbol != undefined && 
            (symbol instanceof EpsilonExpr || symbol instanceof NullExpr)) {
        return symbol;
    }
    if (child != undefined && 
        (child instanceof EpsilonExpr || child instanceof NullExpr)) {
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
    if (child instanceof DotStarExpr) {
        return NULL;
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


/**
 * Creates A{min,max} from A.
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

    if (child instanceof EpsilonExpr) {
        return child;
    }

    if (child instanceof NullExpr) {
        if (minReps <= 0) {
            return EPSILON;
        }
        return child;
    }

    if (child instanceof DotExpr && minReps <= 0 && maxReps == Infinity) {
        return new DotStarExpr(child.tapeName);
    }

    return new RepeatExpr(child, minReps, maxReps);
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
    tapes: Set<string>
): Expr {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    return new MatchExpr(child, tapes);
}

export function constructMatchFrom(
    child: Expr,
    fromTape: string,
    ...toTapes: string[]
): Expr {
    if (child instanceof EpsilonExpr) {
        return child;
    }
    if (child instanceof NullExpr) {
        return child;
    }
    let result = child;
    for (const tape of toTapes) {
        result = new MatchFromExpr(result, fromTape, tape);
    }
    return result;
}

/*
export function constructMatchFrom(state: Expr, firstTape: string, ...otherTapes: string[]): Expr {
    // Construct a Match for multiple tapes given a expression for the first tape. 
    return constructMatch(constructSequence(state,
                            ...otherTapes.map((t: string) => constructRename(state, firstTape, t))),
                          new Set([firstTape, ...otherTapes]));
} */


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
        return constructDot(toTape);
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

export function constructEntangle(
    tapeName: string, 
    token: EntangledToken
): Expr {
    return new EntangleExpr(tapeName, token);
}

export function constructPriority(tapes: string[], child: Expr): Expr {

    if (tapes.length == 0) {
        if (!(child instanceof NullExpr || child instanceof EpsilonExpr)) {
            throw new Error(`warning, nontrivial expr at end: ${child.id}`);
        }
        return child;
    }

    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }

    return new PriorityExpr(tapes, child);
}