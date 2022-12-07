import { 
    ANY_CHAR_STR, BITSETS_ENABLED, 
    DIRECTION_LTR, Gen, GenOptions, 
    logDebug, logTime, logStates, 
    logGrammar, setDifference, foldRight, foldLeft,
    VERBOSE_DEBUG,
    Dict,
    Namespace
} from "./util";
import { 
    Tape, BitsetToken, TapeNamespace, 
    renameTape, Token, EntangledToken,
    OutputTrie, EpsilonToken, EPSILON_TOKEN, NO_CHAR_BITSET
} from "./tapes";
import { Null } from "./grammars";

export interface OpenDifferentiable {

    openDelta(env: DerivEnv): Expr;
    openDeriv(env: DerivEnv): Gen<[string, Token | EpsilonToken, Expr]>;
}

export class DerivStats {
    public statesVisited: number = 0;
}

export class ExprNamespace extends Namespace<Expr> {}

/** 
 * An Env[ironment] encapsulates the execution environment for 
 * the core algorithm: the current state of the symbol stack, 
 * the tape namespace mapping local tape names to global tapes, 
 * and configuration options.
 */
export class DerivEnv {

    constructor(
        public tapeNS: TapeNamespace,
        public symbolNS: Namespace<Expr>,
        public stack: CounterStack,
        public opt: GenOptions,
        public stats: DerivStats
    ) { }

    public renameTape(fromKey: string, toKey: string): DerivEnv {
        const newTapeNS = this.tapeNS.rename(fromKey, toKey);
        return new DerivEnv(newTapeNS, this.symbolNS, this.stack, this.opt, this.stats);
    }

    public addTapes(tapes: Dict<Tape>): DerivEnv {
        const newTapeNS = new TapeNamespace(tapes, this.tapeNS);
        return new DerivEnv(newTapeNS, this.symbolNS, this.stack, this.opt, this.stats);
    }

    public getSymbol(symbolName: string): Expr {
        return this.symbolNS.get(symbolName);
    }
    
    public pushSymbols(symbols: Dict<Expr>): DerivEnv {
        const newSymbolNS = new ExprNamespace(symbols, this.symbolNS);
        return new DerivEnv(this.tapeNS, newSymbolNS, this.stack, this.opt, this.stats);
    }

    public getTape(tapeName: string): Tape {
        return this.tapeNS.get(tapeName);
    }

    public addSymbol(symbolName: string): DerivEnv {
        const newStack = this.stack.add(symbolName);
        return new DerivEnv(this.tapeNS, this.symbolNS, newStack, this.opt, this.stats);
    }

    public incrStates(): void {
        this.stats.statesVisited++;
    }

    public logDebug(msg: string): void {
        logDebug(this.opt.verbose, msg);
    }

    public logDebugId(msg: string, expr: Expr): void {
        if ((this.opt.verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
            console.log(`${msg} ${expr.id}`);
        }
    }

    public logDebugOutput(msg: string, output: OutputTrie): void {
        if ((this.opt.verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
            console.log(`${msg} ${JSON.stringify(output.toDict(this.tapeNS, this.opt))}`);
        }
    }

    public logTime(msg: string): void {
        logTime(this.opt.verbose, msg);
    }

    public logStates(msg: string): void {
        logStates(this.opt.verbose, msg);
    }

    public logGrammar(msg: string): void {
        logGrammar(this.opt.verbose, msg);
    }

}


export type DerivResult = [Token | EpsilonToken, Expr];
export type DerivResults = Gen<DerivResult>;

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
     * @param env The generation environment containing the tape namespace, stack, etc.
     */
    public abstract delta(
        tapeName: string,
        env: DerivEnv
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
     * @param target A token object representing our current hypothesis about the next character
     * @param env The generation environment containing the tape namespace, stack, etc.
     */

     public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        if (target instanceof BitsetToken) {
            yield* this.bitsetDeriv(tapeName, target, env);
            return;
        }
        yield* this.stringDeriv(tapeName, target, env);
    }

    public bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        throw new Error("not implemented");
    }

    public stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {
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
        env: DerivEnv
    ): DerivResults {
        if (target instanceof BitsetToken) {
            yield* this.disjointBitsetDeriv(tapeName, target, env);
            return;
        }
        yield* this.disjointStringDeriv(tapeName, target, env);
    }
    
    public *disjointBitsetDerivOld(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        const results: {[c: string]: Expr[]} = {};

        const tape = env.getTape(tapeName);

        for (const [childToken, childExpr] of
                this.deriv(tapeName, target, env)) {

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
        env: DerivEnv
    ): DerivResults {
        const results: {[c: string]: Expr[]} = {};
        for (const [childToken, childExpr] of this.deriv(tapeName, target, env)) {
            const childString: string = (childToken instanceof EpsilonToken) ?
                                        "" : childToken as string;
            if (!(childString in results)) {
                results[childString] = [];
            }
            results[childString].push(childExpr);
        }

        for (const c in results) {
            const nextExprs = results[c];
            const nextExpr = constructAlternation(...nextExprs);
            const cToken: Token | EpsilonToken = (c == "") ? EPSILON_TOKEN : c;
            yield [cToken, nextExpr];
        }
    }

    public *disjointBitsetDeriv(
        tapeName: string,
        target: BitsetToken, 
        env: DerivEnv
    ): DerivResults {

        let results: DerivResult[] = [];
        let nextExprs: DerivResult[] = [... this.deriv(tapeName, target, env)];
        
        for (let [nextToken, next] of nextExprs) {

            if (nextToken instanceof EntangledToken) {
                yield [nextToken, next];
                continue;
            } 

            let nextBits: BitsetToken = nextToken instanceof EpsilonToken ?
                                        NO_CHAR_BITSET : nextToken as BitsetToken;
            let epsilonPushed = false;
            let newResults: [BitsetToken | EpsilonToken, Expr][] = [];
            for (let [otherToken, otherNext] of results) {
                if (otherToken instanceof EpsilonToken) {
                    if (nextToken instanceof EpsilonToken) {
                        // there's something in the intersection
                        const union = constructAlternation(next, otherNext);
                        newResults.push([nextToken, union]);
                        epsilonPushed = true;
                    } else {
                        newResults.push([otherToken, otherNext]); 
                    }
                    continue;
                }
                let otherBits: BitsetToken = otherToken as BitsetToken;
                // they both matched
                const intersection: BitsetToken = nextBits.and(otherBits);
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
            } else if ((nextToken instanceof EpsilonToken) && !epsilonPushed) {
                results.push([nextToken, next]);
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
        env: DerivEnv
    ): Expr {
        return this;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults { }

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
        env: DerivEnv
    ): Expr {
        return this;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults { }
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
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return NULL;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }
        yield [target, EPSILON];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults { 
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);

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
        return `(bits:${this.token.bits})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return NULL;
    }
    
    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);
        const result = tape.match(this.token, target);
        if (result.isEmpty()) {
            return;
        }
        yield [result, EPSILON];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {
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
        env: DerivEnv
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
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);

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
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);
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
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return EPSILON;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }
        yield [target, this];
    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }
        
        const tape = env.getTape(tapeName);
        for (const c of tape.expandStrings(target)) {
            yield [c, this];
        }
    }
   
}

class LiteralExpr extends Expr {

    constructor(
        public tapeName: string,
        public text: string,
        public tokens: string[],
        public index: number = 0
    ) {
        super();
    }

    public get id(): string {
        const index = this.index > 0 ? `[${this.index}]` : ""; 
        return `${this.tapeName}:${this.tokens.join("")}${index}`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        if (this.index >= this.tokens.length) {
            return EPSILON;
        }
        return NULL;
    }

    protected getAtomicToken(tape: Tape): BitsetToken {
        return tape.toToken([this.text]);
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {

        if (this.index >= this.tokens.length) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);

        if (tape.atomic) {
            const currentToken = tape.toToken([this.text]);
            const result = tape.match(currentToken, target);
            if (result.isEmpty()) {
                return;
            }
            yield [result, EPSILON];
            return;
        }

        const currentToken = tape.toToken([this.tokens[this.index]]);
        const result = tape.match(currentToken, target);
        if (result.isEmpty()) {
            return;
        }
        const nextExpr = constructLiteral(this.tapeName, this.text, this.tokens, this.index+1);
        yield [result, nextExpr];

    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {

        if (this.index >= this.tokens.length) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);
        if (tape.atomic) {
            if (target == ANY_CHAR_STR || target == this.text) {
                yield [this.text, EPSILON];
            }
            return;
        }

        if (target == ANY_CHAR_STR || target == this.tokens[this.index]) {
            const nextExpr = constructLiteral(this.tapeName, this.text, this.tokens, this.index+1);
            yield [this.tokens[this.index], nextExpr];
        }
    }

}

class RTLLiteralExpr extends LiteralExpr {

    constructor(
        public tapeName: string,
        public text: string,
        public tokens: string[],
        public index: number = tokens.length-1
    ) {
        super(tapeName, text, tokens, index);
    }

    public get id(): string {
        const index = this.index < this.tokens.length-1 ? `[${this.index}]` : ""; 
        return `${this.tapeName}:${this.tokens.join("")}${index}`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }

        if (this.index < 0) {
            return EPSILON;
        }

        return NULL;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {

        if (this.index < 0) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);

        if (tape.atomic) {
            const currentToken = tape.toToken([this.text]);
            const result = tape.match(currentToken, target);
            if (result.isEmpty()) {
                return;
            }
            yield [result, EPSILON];
            return;
        }

        const currentToken = tape.toToken([this.tokens[this.index]]);
        const result = tape.match(currentToken, target);
        if (result.isEmpty()) {
            return;
        }
        const nextExpr = constructLiteral(this.tapeName, this.text, this.tokens, this.index-1);
        yield [result, nextExpr];

    }

    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {

        if (this.index < 0) {
            return;
        }

        if (tapeName != this.tapeName) {
            return;
        }

        const tape = env.getTape(tapeName);
        if (tape.atomic) {
            if (target == ANY_CHAR_STR || target == this.text) {
                yield [this.text, EPSILON];
            }
            return;
        }

        if (target == ANY_CHAR_STR || target == this.tokens[this.index]) {
            const nextExpr = constructLiteral(this.tapeName, this.text, this.tokens, this.index-1);
            yield [this.tokens[this.index], nextExpr];
        }
    }

}

class EpsilonLiteralExpr extends Expr {

    constructor(
        public tapeName: string,
    ) {
        super();
    }

    public get id(): string {
        return `${this.tapeName}:ε`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) {
            return this;
        }
        return NULL;
    }

    public *deriv(
        tapeName: string,
        target: Token, 
        env: DerivEnv
    ): DerivResults {
        if (tapeName != this.tapeName) {
            return;
        }

        if (target == ANY_CHAR_STR) {
            yield [EPSILON_TOKEN, EPSILON];
        }
    }

}

export class ParallelExpr extends Expr {

    constructor(
        public children: Dict<Expr>
    ) {
        super();
    }

    public get id(): string {
        const childIDs = Object.values(this.children).map(c => c.id);
        return `${childIDs.join("∙")}`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (!(tapeName in this.children)) {
            return this;
        }
        
        const delta = this.children[tapeName].delta(tapeName, env);
        return updateParallel(this.children, tapeName, delta);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        if (!(tapeName in this.children)) {
            return;
        }

        const childResults = this.children[tapeName].disjointDeriv(tapeName, target, env);
        for (const [cTarget, cNext] of childResults) {
            const successor = updateParallel(this.children, tapeName, cNext);
            yield [cTarget, successor];
        }
    }
}

export function constructParallel(
    children: Dict<Expr>,
): Expr {
    const newChildren: Dict<Expr> = {};
    let childFound = false;
    for (const [tapeName, child] of Object.entries(children)) {
        if (child instanceof NullExpr) {
            return child;
        }
        if (child instanceof EpsilonExpr) {
            continue;
        }
        newChildren[tapeName] = child;
        childFound = true;
    }
    if (!childFound) {
        return EPSILON;
    }

    return new ParallelExpr(newChildren);
}

export function updateParallel(
    children: Dict<Expr>,
    newTape: string,
    newChild: Expr
): Expr {
    if (newChild instanceof NullExpr) {
        return newChild;
    }

    const newChildren: Dict<Expr> = {};
    Object.assign(newChildren, children);
        
    if (newChild instanceof EpsilonExpr) {
        delete newChildren[newTape];
        if (Object.keys(newChildren).length == 0) {
            return EPSILON;
        }
    } else {
        newChildren[newTape] = newChild;
    }

    return new ParallelExpr(newChildren);
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
        if (!this.child1.id.startsWith("(")) {
            const child1IDpieces = this.child1.id.split(":");
            const child2IDpieces = this.child2.id.split(":");
            if (child1IDpieces[0] == child2IDpieces[0]) {
                return this.child1.id + child2IDpieces.slice(1).join(":");
            }
        }
        return this.child1.id + "+" + this.child2.id;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, env);
        const newChild2 = this.child2.delta(tapeName, env);
        return constructConcat(newChild1, newChild2);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        const [c1, c2] = (DIRECTION_LTR) ?
                        [this.child1, this.child2] :
                        [this.child2, this.child1];

        for (const [c1target, c1next] of
                c1.deriv(tapeName, target, env)) {
            yield [c1target, constructPrecede(c1next, c2)];
        }

        const c1next = c1.delta(tapeName, env);
        for (const [c2target, c2next] of
                c2.deriv(tapeName, target, env)) {
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
        env: DerivEnv
    ): Expr {
        const newChildren = this.children.map(c => c.delta(tapeName, env));
        const result = constructAlternation(...newChildren);
        return result;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        for (const child of this.children) {
            yield* child.deriv(tapeName, target, env);
        }
    }

}

class IntersectExpr extends BinaryExpr {

    public get id(): string {
        return `(${this.child1.id}&${this.child2.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, env);
        const newChild2 = this.child2.delta(tapeName, env);
        return constructIntersection(newChild1, newChild2);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        for (const [c1target, c1next] of 
                this.child1.disjointDeriv(tapeName, target, env)) {

            if (c1target instanceof EpsilonToken) {
                const successor = constructIntersection(c1next, this.child2);
                yield [c1target, successor];
                continue;
            }
    
            for (const [c2target, c2next] of 
                    this.child2.disjointDeriv(tapeName, c1target as Token, env)) {
                const c1nxt = (c2target instanceof EpsilonToken) ? this.child1 : c1next;
                const successor = constructIntersection(c1nxt, c2next);
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
        env: DerivEnv
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, env);
        const newChild2 = this.child2.delta(tapeName, env);
        return constructFilter(newChild1, newChild2, this.tapes);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        if (!this.tapes.has(tapeName)) {
            for (const [c1target, c1next] of 
                    this.child1.disjointDeriv(tapeName, target, env)) {
                const successor = constructFilter(c1next, this.child2, this.tapes);
                yield [c1target, successor];
            }
            return;
        }
        
        for (const [c2target, c2next] of 
                this.child2.disjointDeriv(tapeName, target, env)) {

            if (c2target instanceof EpsilonToken) {
                const successor = constructFilter(this.child1, c2next, this.tapes);
                yield [c2target, successor];
                continue;
            }
    
            for (const [c1target, c1next] of 
                    this.child1.disjointDeriv(tapeName, c2target as Token, env)) {
                const c2nxt = (c1target instanceof EpsilonToken) ? this.child2 : c2next;
                const successor = constructFilter(c1next, c2nxt, this.tapes);
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
        env: DerivEnv
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, env);
        const newChild2 = this.child2.delta(tapeName, env);
        return constructJoin(newChild1, newChild2, this.tapes1, this.tapes2);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        if (!this.tapes2.has(tapeName)) {
            for (const [leftTarget, leftNext] of 
                    this.child1.disjointDeriv(tapeName, target, env)) {
                const successor = constructJoin(leftNext, this.child2, this.tapes1, this.tapes2);
                yield [leftTarget, successor];
            }
            return;
        }
        
        if (!this.tapes1.has(tapeName)) {
            for (const [rightTarget, rightNext] of 
                    this.child2.disjointDeriv(tapeName, target, env)) {
                const successor = constructJoin(this.child1, rightNext, this.tapes1, this.tapes2);
                yield [rightTarget, successor];
            }
            return;
        }
        
        for (const [leftTarget, leftNext] of 
                this.child1.disjointDeriv(tapeName, target, env)) {

            if (leftTarget instanceof EpsilonToken) {
                const successor = constructJoin(leftNext, this.child2, this.tapes1, this.tapes2);
                yield [leftTarget, successor];
                continue;
            }

            for (const [rightTarget, rightNext] of 
                    this.child2.disjointDeriv(tapeName, leftTarget as Token, env)) {
                const lnext = (rightTarget instanceof EpsilonToken) ? this.child1 : leftNext;
                const successor = constructJoin(lnext, rightNext, this.tapes1, this.tapes2);
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
        public child: Expr | undefined = undefined
    ) { 
        super();
    }

    public get id(): string {
        return `\$${this.symbolName}`;
    }

    public getChild(env: DerivEnv): Expr {
        if (this.child == undefined) {
            let child = env.getSymbol(this.symbolName);
            if (child == undefined) {
                // this is an error, due to the programmer referring to an undefined
                // symbol, but now is not the time to complain. 
                child = EPSILON;
            } 
            this.child = child;
        }
        return this.child;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (env.stack.exceedsMax(this.symbolName)) {
            return NULL;
        }
        const newEnv = env.addSymbol(this.symbolName);
        const childNext = this.getChild(env).delta(tapeName, newEnv);
        return constructEmbed(this.symbolName, childNext, env.symbolNS);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        if (env.stack.exceedsMax(this.symbolName)) {
            return;
        }

        const newEnv = env.addSymbol(this.symbolName);
        let child = this.getChild(env);

        for (const [childTarget, childNext] of 
                        child.deriv(tapeName, target, newEnv)) {
            const successor = constructEmbed(this.symbolName, childNext, env.symbolNS);
            yield [childTarget, successor];
        }
    }
}

export function constructEmbed(
    symbolName: string, 
    child: Expr | undefined = undefined,
    symbolNS: ExprNamespace,
): Expr {
    const symbol = symbolNS.attemptGet(symbolName);
    if (symbol != undefined && 
            (symbol instanceof EpsilonExpr || symbol instanceof NullExpr)) {
        return symbol;
    }
    if (child != undefined && 
        (child instanceof EpsilonExpr || child instanceof NullExpr)) {
        return child;
    }
    return new EmbedExpr(symbolName, child);
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

export class CollectionExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public symbols: Dict<Expr>
    ) {
        super(child);
    }
    
    public get id(): string {
        return `${this.child.id}`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newEnv = env.pushSymbols(this.symbols);
        const newChild = this.child.delta(tapeName, newEnv);
        return constructCollection(newChild, this.symbols);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        const newEnv = env.pushSymbols(this.symbols);
        for (const [childTarget, childNext] of 
                this.child.deriv(tapeName, target, newEnv)) {
            yield [childTarget, constructCollection(childNext, this.symbols)];
        }
    }
    
    
    public openDelta(
        env: DerivEnv
    ): Expr {
        if (!(this.child instanceof PriorityExpr)) {
            throw new Error("child does not have openDelta");
        }
        const newEnv = env.pushSymbols(this.symbols);
        const newChild = this.child.openDelta(newEnv);
        return constructCollection(newChild, this.symbols);
    }

    public *openDeriv(
        env: DerivEnv
    ): Gen<[string, Token | EpsilonToken, Expr]> {
        if (!(this.child instanceof PriorityExpr)) {
            throw new Error("child does not have openDeriv");
        }
        const newEnv = env.pushSymbols(this.symbols);
        for (const [childTape, childTarget, childNext] of 
                this.child.openDeriv(newEnv)) {
            yield [childTape, childTarget, constructCollection(childNext, this.symbols)];
        }
    }
}

export function constructCollection(child: Expr, symbols: Dict<Expr>): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new CollectionExpr(child, symbols);
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
        env: DerivEnv
    ): Expr {
        const newChild = this.child.delta(tapeName, env);
        return constructCount(newChild, this.maxChars);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        if (this.maxChars <= 0) {
            return;
        }

        for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
            const newMax = (cTarget instanceof EpsilonToken) ? this.maxChars: this.maxChars-1;
            const successor = constructCount(cNext, newMax);
            yield [cTarget, successor];
        }
    }
}

export class CountTapeExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public maxChars: Dict<number>
    ) {
        super(child);
    }

    public get id(): string {
        return `CountTape(${JSON.stringify(this.maxChars)},${this.child.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild = this.child.delta(tapeName, env);
        return constructCountTape(newChild, this.maxChars);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        if (!(tapeName in this.maxChars)) {
            return;
        }

        for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
            
            if (cTarget instanceof EpsilonToken) {
                const successor = constructCountTape(cNext, this.maxChars);
                yield [cTarget, successor];
                continue;
            }
            
            if (this.maxChars[tapeName] <= 0) {
                return;
            }
            
            let newMax: Dict<number> = {};
            Object.assign(newMax, this.maxChars);
            newMax[tapeName] -= 1;
            const successor = constructCountTape(cNext, newMax);
            yield [cTarget, successor];
        }
    }
}

export class PreTapeExpr extends UnaryExpr {

    constructor(
        public fromTape: string,
        public toTape: string,
        child: Expr
    ) {
        super(child);
    }

    public get id(): string {
        return this.child.id;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName == this.fromTape) {
            throw new Error(`something's gone wrong, querying on ` +
                `a EagerHideExpr fromTape ${this.fromTape}`);
        }

        if (tapeName == this.toTape) {
            const fromDelta = this.child.delta(this.fromTape, env);
            const toDelta = fromDelta.delta(this.toTape, env);
            return constructPreTape(this.fromTape, this.toTape, toDelta);
        }

        const delta = this.child.delta(tapeName, env);
        return constructPreTape(this.fromTape, this.toTape, delta);
    }
    
    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        if (tapeName == this.fromTape) {
            throw new Error(`something's gone wrong, querying on ` +
                `a EagerHideExpr fromTape ${this.fromTape}`);
        }

        if (tapeName == this.toTape) {
            
            // if the child is nullable on the fromTape, we can stop 
            // querying on fromTape -- that is, stop being a PreTapeExpr
            const childDelta = this.child.delta(this.fromTape, env);
            if (!(childDelta instanceof NullExpr)) {
                yield* childDelta.deriv(this.toTape, target, env);
            }

            const globalTapeName = env.getTape(this.fromTape).globalName;
            for (const [fromTarget, fromNext] of this.child.deriv(this.fromTape, target, env)) {
                if (fromNext instanceof NullExpr) {
                    continue;
                }
                env.incrStates();
                const fromTarget_str = (fromTarget instanceof EpsilonToken) ? 'ε' : 
                                    (fromTarget instanceof BitsetToken) ?
                                    `[${fromTarget.bits}:${fromTarget.entanglements.toString()}]` :
                                    fromTarget;
                env.logDebug(`D^${globalTapeName}_${fromTarget_str} = ${fromNext.id}`);
                if (fromTarget instanceof EpsilonToken) {
                    const wrapped = constructPreTape(this.fromTape, this.toTape, fromNext);
                    yield [fromTarget, wrapped];
                    continue;
                }
                for (const [toTarget, toNext] of fromNext.deriv(this.toTape, target, env)) {
                    const wrapped = constructPreTape(this.fromTape, this.toTape, toNext);
                    yield [toTarget, wrapped];
                }
            }
            return;
        }

        for (const [toTarget, toNext] of this.child.deriv(tapeName, target, env)) {
            const wrapped = constructPreTape(this.fromTape, this.toTape, toNext);
            yield [toTarget, wrapped];
        }

    }
}

export function constructPreTape(fromTape: string, toTape: string, child: Expr): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new PreTapeExpr(fromTape, toTape, child);
}

export class PriorityExpr extends UnaryExpr {

    constructor(
        public tapes: string[],
        child: Expr
    ) { 
        super(child)
    }

    public get id(): string {
        return `${this.tapes}:${this.child.id}`;
    }

    public delta(
        tapeName: string, 
        env: DerivEnv
    ): Expr {
        const delta = this.child.delta(tapeName, env);
        if (this.tapes.length == 0 && (!(delta instanceof NullExpr || delta instanceof EpsilonExpr))) {
            if (delta instanceof EmbedExpr) {
                const referent = delta.child;
                throw new Error(`warning, nontrivial embed at end: ${delta.symbolName}:${referent?.id}`);
            }
            throw new Error(`warning, nontrivial expr at end: ${delta.id}`);
        }
        return constructPriority(this.tapes, delta);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        for (const [cTarget, cNext] of 
                this.child.deriv(tapeName, target, env)) {
            const successor = constructPriority(this.tapes, cNext);
            yield [cTarget, successor];
        }
    }

    public openDelta(
        env: DerivEnv
    ): Expr {
        const tapeToTry = this.tapes[0];
        const delta = this.child.delta(tapeToTry, env);
        env.logDebug(`d^${tapeToTry} is ${delta.id}`);
        const newTapes = this.tapes.slice(1);
        if (newTapes.length == 0 && (!(delta instanceof NullExpr || delta instanceof EpsilonExpr))) {
            if (delta instanceof EmbedExpr) {
                const referent = delta.child;
                throw new Error(`warning, nontrivial embed at end: ${delta.symbolName}:${referent?.id}`);
            }
            throw new Error(`warning, nontrivial expr at end: ${delta.id}`);
        }
        return constructPriority(newTapes, delta);
    }

    public *openDeriv(
        env: DerivEnv
    ): Gen<[string, Token | EpsilonToken, Expr]> {

        const tapeToTry = this.tapes[0];
        // rotate the tapes so that we don't just 
        // keep trying the same one every time
        const newTapes = [... this.tapes.slice(1), tapeToTry];
        const tape = env.getTape(tapeToTry);
        const startingToken = BITSETS_ENABLED ? tape.any : ANY_CHAR_STR;

        for (const [cTarget, cNext] of 
                this.child.disjointDeriv(tapeToTry, startingToken, env)) {

            if (!(cNext instanceof NullExpr)) {
                const cTarget_str = (cTarget instanceof EpsilonToken) ? 'ε' : 
                                    (cTarget instanceof BitsetToken) ?
                                    `[${cTarget.bits}:${cTarget.entanglements.toString()}]` :
                                    cTarget;
                env.incrStates();
                env.logDebug(`D^${tapeToTry}_${cTarget_str} is ${cNext.id}`);
                const successor = constructPriority(newTapes, cNext);
                yield [tapeToTry, cTarget, successor];
            }
        }
    }
}

class NoEpsExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapeName: string,
        public maxCount: number = 1
    ) {
        super(child);
    }

    public get id(): string {
        return `NEP${this.tapeName}(${this.child.id})`;
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        const childDelta = this.child.delta(tapeName, env);
        return constructNoEps(childDelta, this.tapeName);
    }

    public *deriv(
        tapeName: string, 
        target: Token, 
        env: DerivEnv
    ): DerivResults {
        for (const [childTarget, childNext] of this.child.deriv(tapeName, target, env)) {
            if (tapeName == this.tapeName && childTarget instanceof EpsilonToken) {
                continue;
            }

            const successor = constructNoEps(childNext, this.tapeName);
            yield [childTarget, successor];
        }
    }
}

export function constructNoEps(
    child: Expr, 
    tapeName: string,
): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new NoEpsExpr(child, tapeName);
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
        return this.child.id;
    }

    public delta(
        tapeName: string, 
        env: DerivEnv
    ): Expr {
        const childNext = this.child.delta(tapeName, env);
        return constructShort(childNext);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        const delta = this.delta(tapeName, env);
        if (!(delta instanceof NullExpr)) {
            // if our current tape is nullable, then we have 
            // no derivatives on that tape.
            return;
        }

        // Important: the deriv here MUST be disjoint, just like 
        // under negation.
        for (const [cTarget, cNext] of this.child.disjointDeriv(tapeName, target, env)) {
            
            const cNextDelta = cNext.delta(tapeName, env);
            if (!(cNextDelta instanceof NullExpr)) {
                yield [cTarget, cNextDelta];
                continue;
            }
            
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
        if (this.minReps <= 0 && this.maxReps == Infinity) {
            return `(${this.child.id})*`;
        }
        if (this.maxReps == Infinity) {
            return `(${this.child.id}){${this.minReps}+}`;
        }
        return `(${this.child.id}){${this.minReps},${this.maxReps}}`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild = this.child.delta(tapeName, env);
        return constructRepeat(newChild, this.minReps, this.maxReps);
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        const oneLess = constructRepeat(this.child, this.minReps-1, this.maxReps-1);
        const deltad = this.child.delta(tapeName, env);

        //const anyChar = BITSETS_ENABLED ? env.getTape(tapeName).any : ANY_CHAR_STR;

        let yielded: boolean = false;

        for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
            yield [cTarget, constructPrecede(cNext, oneLess)];
            yielded = true;
        }
        
        if (yielded &&
                !(deltad instanceof NullExpr) 
                && oneLess instanceof RepeatExpr) {
            yield [EPSILON_TOKEN, constructPrecede(deltad, oneLess)];
        } 
    }
}

class TapeNsExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Dict<Tape>
    ) {
        super(child);
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newEnv = env.addTapes(this.tapes);
        const newChild = this.child.delta(tapeName, newEnv);
        return constructTapeNS(newChild, this.tapes);
    }
    
    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {
        const newEnv = env.addTapes(this.tapes);
        for (const [childTarget, childNext] of 
                this.child.deriv(tapeName, target, newEnv)) {
            yield [childTarget, constructTapeNS(childNext, this.tapes)];
        }
    }

}

export function constructTapeNS(child: Expr, tapes: Dict<Tape>): TapeNsExpr {
    return new TapeNsExpr(child, tapes);
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
        env: DerivEnv
    ): Expr {
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return this;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        const newEnv = env.renameTape(this.toTape, this.fromTape);
        const newChild = this.child.delta(newTapeName, newEnv);
        return constructRename(newChild, this.fromTape, this.toTape);
    }
    
    public get id(): string {
        return `${this.toTape}<-${this.fromTape}(${this.child.id})`;
    }

    public *deriv(
        tapeName: string, 
        target: Token,
        env: DerivEnv
    ): DerivResults {

        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        const newEnv = env.renameTape(this.toTape, this.fromTape);
    
        for (const [childTarget, childNext] of 
                this.child.deriv(newTapeName, target, newEnv)) {
            yield [childTarget, constructRename(childNext, this.fromTape, this.toTape)];
        }
    }
    
}

class NegationExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Set<string>,
    ) { 
        super(child);
    }

    public get id(): string {
        return `~(${this.child.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const childDelta = this.child.delta(tapeName, env);
        const remainingTapes = setDifference(this.tapes, new Set([tapeName]));
        
        let result: Expr;
        
        if (childDelta instanceof NullExpr) {
            result = constructNegation(childDelta, remainingTapes);
            return result;
        }
        if (remainingTapes.size == 0) {
            result = NULL;
            return result;
        }
        
        result = constructNegation(childDelta, remainingTapes);
        return result;
    }
    
    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {

        if (!this.tapes.has(tapeName)) {
            return;
        }

        const [disentangledTarget, entanglements] = target.disentangle(); 
        let remainder = disentangledTarget.clone();

        for (const [childText, childNext] of 
                this.child.disjointDeriv(tapeName, disentangledTarget, env)) {
            const successor = constructNegation(childNext, this.tapes);
            if (childText instanceof EpsilonToken) {
                yield [childText, successor];
                continue;
            }

            const complement = (childText as BitsetToken).not();
            remainder = remainder.and(complement);
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
        yield [reEntangledRemainder, constructUniverse(this.tapes)];
    }
    
    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {

        if (!this.tapes.has(tapeName)) {
            return;
        }

        const tape = env.getTape(tapeName);

        let remainder = tape.toToken([target]);

        for (const [childText, childNext] of 
                this.child.disjointDeriv(tapeName, target, env)) {
            if (!(childText instanceof EpsilonToken)) {
                const childToken = tape.toToken([childText as string]);
                const complement = childToken.not();
                remainder = remainder.and(complement);    
            }
            const successor = constructNegation(childNext, this.tapes);
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
            yield [c, constructUniverse(this.tapes)];
        }
    }
}

export class CorrespondExpr extends Expr {

    constructor(
        public child: Expr,
        public fromTape: string,
        public fromCount: number,
        public toTape: string,
        public toCount: number
    ) {
        super();
    }

    public get id(): string {
        return this.child.id;
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        if (tapeName == this.fromTape) {
            const childDelta = this.child.delta(tapeName, env);
            return constructCorrespond(childDelta, this.fromTape, this.fromCount,
                                            this.toTape, this.toCount);
        }

        if (tapeName == this.toTape) {
            if (this.toCount < this.fromCount) {
                return NULL;
            }
            const childDelta = this.child.delta(tapeName, env);
            return constructCorrespond(childDelta, this.fromTape, this.fromCount,
                this.toTape, this.toCount);
        }

        // it's neither tape we care about
        return this;
    }

    public *deriv(
        tapeName: string, 
        target: Token, 
        env: DerivEnv
    ): DerivResults {
        if (tapeName == this.toTape) {
            for (const [childTarget, childNext] of this.child.deriv(tapeName, target, env)) {
                const successor = constructCorrespond(childNext, 
                                            this.fromTape, this.fromCount,
                                            this.toTape, this.toCount+1);
                yield [childTarget, successor];
            }

            // toTape is special, if it's nullable but has emitted fewer tokens than
            // fromTape has, it can emit an epsilon
            const childDelta = this.child.delta(tapeName, env);
            if (!(childDelta instanceof NullExpr) && this.toCount < this.fromCount) {
                const successor = constructCorrespond(this.child, 
                    this.fromTape, this.fromCount,
                    this.toTape, this.toCount+1);
                yield [EPSILON_TOKEN, successor];
            }
            return;
        }

        if (tapeName == this.fromTape) {
            for (const [childTarget, childNext] of this.child.deriv(tapeName, target, env)) {
                const successor = constructCorrespond(childNext, 
                                            this.fromTape, this.fromCount+1,
                                            this.toTape, this.toCount);
                yield [childTarget, successor];
            }
            return;
        }

        // if it's neither tape, nothing can happen here
    }
}

export function constructCorrespond(
    child: Expr,
    fromTape: string,
    fromCount: number,
    toTape: string,
    toCount: number
): Expr {
    if (child instanceof NullExpr) {
        return child;
    }
    if (child instanceof EpsilonExpr && fromCount <= toCount) {
        return child;
    }
    return new CorrespondExpr(child, fromTape, fromCount, toTape, toCount);
}

/**
 * A MatchCountExpr asserts that, for the tapes it cares about,
 * they have the same number of characters.  
 */
export class MatchCountExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapeCounts: Dict<number>
    ) {
        super(child);
    }

    public get id(): string {
        return this.child.id;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (!(tapeName in this.tapeCounts)) {
            return this;
        }

        // if the counts are not equal, we're not done yet
        let countFound : number | undefined = undefined;
        for (const [tapeName, count] of Object.entries(this.tapeCounts)) {
            if (countFound != undefined && countFound != count) {
                return NULL;
            }
            countFound = count;
        }

        // the counts are equal, go ahead
        const childDelta = this.child.delta(tapeName, env);
        return constructMatchCount(childDelta, this.tapeCounts);
    }

    public *stringDeriv(tapeName: string, target: string, env: DerivEnv): DerivResults {
        
        if (!(tapeName in this.tapeCounts)) {
            // not something we care about
            return;
        }

        const newCount = this.tapeCounts[tapeName] + 1;

        const newCounts: Dict<number> = {};
        Object.assign(newCounts, this.tapeCounts);
        newCounts[tapeName] = newCount;
        for (const [childTarget, childNext] of this.child.deriv(tapeName, target, env)) {
            const successor = constructMatchCount(childNext, newCounts);
            yield [childTarget, successor];
        }
    }
}

export function constructMatchCount(child: Expr, tapeCounts: Dict<number>): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new MatchCountExpr(child, tapeCounts);
}

export class MiniMatchExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }

    public get id(): string {
        return `M(${this.fromTape}>${this.toTape},${this.child.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName == this.toTape) {
            const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            const newEnv = env.renameTape(this.toTape, this.fromTape);
            const nextExpr = this.child.delta(newTapeName, newEnv);
            return constructMiniMatch(nextExpr, this.fromTape, this.toTape);  
        }

        const nextExpr = this.child.delta(tapeName, env);
        return constructMiniMatch(nextExpr, this.fromTape, this.toTape);
    }
    
    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        throw new Error("not implemented");
    }
    
    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {
        
        // if it's a tape that isn't our from, just forward and wrap 
        if (tapeName != this.fromTape) {
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
                const successor = constructMiniMatch(cNext, this.fromTape, this.toTape);
                yield [cTarget, successor];
            }
            return;
        }

        const fromTape = env.getTape(this.fromTape);
        const toTape = env.getTape(this.toTape);

        for (const [cTarget, cNext] of 
                this.child.deriv(this.fromTape, target, env)) {
            const successor = constructMiniMatch(cNext, this.fromTape, this.toTape);
            if (cTarget instanceof EpsilonToken) {
                //const lit = constructEpsilonLiteral(this.toTape);
                //yield [EPSILON_TOKEN, constructPrecede(lit, successor)];
                yield [EPSILON_TOKEN, successor];
            } else {
                for (const c of toTape.expandStrings(cTarget as string, fromTape)) {
                    const lit = constructLiteral(this.toTape, c, [c]);
                    yield [c, constructPrecede(lit, successor)];
                }
            }
        }
    }
}

export function constructMiniMatch(
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
        result = new MiniMatchExpr(result, fromTape, tape);
    }
    return result;
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
        return `M(${this.fromTape}>${this.toTape},${this.child.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName == this.toTape) {
            const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            const newEnv = env.renameTape(this.toTape, this.fromTape);
            const nextExpr = this.child.delta(newTapeName, newEnv);
            return constructMatchFrom(nextExpr, this.fromTape, this.toTape);  
        }
        const nextExpr = this.child.delta(tapeName, env);
        return constructMatchFrom(nextExpr, this.fromTape, this.toTape);
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        
        // if it's a tape that isn't our to/from, just forward and wrap 
        if (tapeName != this.fromTape && tapeName != this.toTape) {
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
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
        const oppositeTape = env.getTape(oppositeTapeName);
        //const fromTape = env.getTape(this.fromTape);
        //const toTape = env.getTape(this.toTape);

        // We ask for a namespace rename either way; when tapeName == fromTape,
        // this is just a no-op
        const newEnv = env.renameTape(tapeName, this.fromTape); 

        for (const [cTarget, cNext] of 
                this.child.deriv(this.fromTape, target, newEnv)) {
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
        env: DerivEnv
    ): DerivResults {
        
        // if it's a tape that isn't our to/from, just forward and wrap 
        if (tapeName != this.fromTape && tapeName != this.toTape) {
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
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
        const fromTape = env.getTape(this.fromTape);
        const toTape = env.getTape(this.toTape);

        // We ask for a namespace rename either way; when tapeName == fromTape,
        // this is just a no-op
        const newEnv = env.renameTape(tapeName, this.fromTape); 

        for (const [cTarget, cNext] of 
                this.child.deriv(this.fromTape, target, newEnv)) {
            const successor = constructMatchFrom(cNext, this.fromTape, this.toTape);
            if (cTarget instanceof EpsilonToken) {
                env.logDebug("========= EpsilonToken ==========");
                // const lit = constructEpsilonLiteral(oppositeTape);
                // yield [EPSILON_TOKEN, constructPrecede(lit, successor)];
                yield [EPSILON_TOKEN, successor];
            } else {
                for (const c of toTape.expandStrings(cTarget as string, fromTape)) {
                    const lit = constructLiteral(oppositeTape, c, [c]);
                    yield [c, constructPrecede(lit, successor)];
                }
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
        env: DerivEnv
    ): Expr {

        if (!this.tapes.has(tapeName)) {
            // it's not a tape we're matching
            const nextExpr = this.child.delta(tapeName, env);
            return constructMatch(nextExpr, this.tapes);
        }

        let result: Expr = this.child;
        for (const t of this.tapes) {
            result = result.delta(t, env);
        }
        return result;
    }

    public *bitsetDeriv(
        tapeName: string, 
        target: BitsetToken,
        env: DerivEnv
    ): DerivResults {
        throw new Error("Method not implemented.");
    }
    
    public *stringDeriv(
        tapeName: string,
        target: string, 
        env: DerivEnv
    ): DerivResults {
        env.logDebug(`matching ${tapeName}:${target}`)
        if (!this.tapes.has(tapeName)) {
            // it's not a tape we're matching
            for (const [cTarget, cNext] of this.child.deriv(tapeName, target, env)) {
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
                for (const [cTarget, cNext] of prevExpr.deriv(t, prevTarget, env)) {
                    const tObj = env.getTape(t);
                    env.logDebug(`${t} atomic? ${tObj.atomic}`)
                    env.logDebug(`found ${t}:${cTarget}`)
                    nextResults.push([cTarget as string, cNext]);
                }
            }
            results = nextResults;    
        }

        const tape = env.getTape(tapeName);

        for (const [nextTarget, nextExpr] of results) {
            
            const cs = tape.expandStrings(nextTarget);

            for (const c of cs) {
                let bufferedNext: Expr = constructMatch(nextExpr, this.tapes);
                for (const matchTape of this.tapes) {
                    if (matchTape == tapeName) {
                        continue;
                    }
                    const lit = constructLiteral(matchTape, c, [c]);
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
    text: string,
    tokens: string[],
    index: number | undefined = undefined
): Expr {

    if (DIRECTION_LTR) {
        if (index == undefined) { index = 0; }
        if (index >= tokens.length) {
            return EPSILON;
        }
        return new LiteralExpr(tape, text, tokens, index);
    }
    if (index == undefined) { index = tokens.length -1; }
    if (index < 0) {
        return EPSILON;
    }
    return new RTLLiteralExpr(tape, text, tokens, index);

}

export function constructEpsilonLiteral(tape: string): EpsilonLiteralExpr {
    return new EpsilonLiteralExpr(tape);
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
    
    if (DIRECTION_LTR) {
        return foldRight(children, constructConcat);
    } else {
        return foldLeft(children, constructConcat);
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

export function constructCountTape(child: Expr, maxChars: Dict<number>): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new CountTapeExpr(child, maxChars);
}

export function constructNegation(
    child: Expr, 
    tapes: Set<string>,
): Expr {
    if (child instanceof NullExpr) {
        return constructUniverse(tapes);
    }
    if (child instanceof NegationExpr) {
        return child.child;
    }
    if (child instanceof DotStarExpr) {
        return NULL;
    }
    return new NegationExpr(child, tapes);
}

export function constructDotStar(tape: string): Expr {
    return new DotStarExpr(tape);
}

export function constructDotRep(tape: string, maxReps: number=Infinity): Expr {
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
): Expr {
    return constructSequence(...[...tapes]
                .map(t => constructDotRep(t)));
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
        return constructLiteral(toTape, child.text, child.tokens, child.index);
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

export function constructNotContains(
    fromTapeName: string,
    children: Expr[], 
    tapes: string[], 
    begin: boolean,
    end: boolean
): Expr {
    const dotStar: Expr = constructDotRep(fromTapeName);
    let seq: Expr;
    if (begin) {
        seq = DIRECTION_LTR ?
              constructSequence(...children, dotStar) :
              constructShort(constructSequence(...children, dotStar));
    } else if (end)
        seq = DIRECTION_LTR ?
              constructShort(constructSequence(dotStar, ...children)) :
              constructSequence(dotStar, ...children);
    else {
        seq = DIRECTION_LTR ?
              constructSequence(constructShort(constructSequence(dotStar, ...children)), dotStar) :
              constructSequence(dotStar, constructShort(constructSequence(...children, dotStar)));
    }
    return constructNegation(seq, new Set(tapes));
}
