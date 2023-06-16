import {
    DIRECTION_LTR, Gen, GenOptions, 
    logDebug, logTime, logStates, 
    logGrammar, setDifference, foldRight, foldLeft,
    VERBOSE_DEBUG,
    Dict,
    Namespace,
    StringDict,
    concatStringDict,
    OPEN_TAPE,
    outputProduct,
    flatten
} from "./util";
import { 
    Tape, TapeNamespace, 
    renameTape
} from "./tapes";

export type Query = TokenExpr | DotExpr;

export class DerivStats {
    public statesVisited: number = 0;
    public indentation: number = 0;
}

export type Deriv = [TokenExpr | EpsilonExpr, Expr];
export type Derivs = Gen<Deriv>;

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

    public indentLog(indent: number): void {
        this.stats.indentation += indent;
    }

    public logIndent(msg: string): void {
        const indent = "  ".repeat(this.stats.indentation);
        this.logDebug(indent + msg);
    }

    public logDelta(tapeName: string, next: Expr): void {
        if ((this.opt.verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
            this.logIndent(`└ d_${tapeName} = ${next.id}`);
        }
    }
    
    public logDeriv(result: Expr, next: Expr): void {
        if ((this.opt.verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
            this.logIndent(`└ D_${result.id} = ${next.id}`);
        }
    }

    public logDebug(msg: string): void {
        logDebug(this.opt.verbose, msg);
    }

    public logDebugId(msg: string, expr: Expr): void {
        if ((this.opt.verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
            console.log(`${msg} ${expr.id}`);
        }
    }

    public logDebugOutput(msg: string, output: Expr): void {
        if ((this.opt.verbose & VERBOSE_DEBUG) == VERBOSE_DEBUG) {
            console.log(`${msg} ${JSON.stringify(output.getOutputs())}`);
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

function *disjoin(ds: Iterable<Deriv>): Derivs {
    const results: {[c: string]: [TokenExpr|EpsilonExpr, Expr[]]} = {};
    for (const [cResult, cNext] of ds) {
        const cString = cResult.id;
        if (!(cString in results)) {
            results[cString] = [cResult, []];
        }
        results[cString][1].push(cNext);
    }

    for (const [cResult, cNexts] of Object.values(results)) {
        const wrapped = constructAlternation(...cNexts);
        yield [cResult, wrapped];
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
     * @param query A token object representing our current hypothesis about the next character
     * @param env The generation environment containing the tape namespace, stack, etc.
     */

     public abstract deriv(
        query: Query,
        env: DerivEnv
    ): Derivs;

    public *forward(
        env: DerivEnv
    ): Gen<[boolean, Expr]> {
        yield [false, this];
    }

    public simplify(): Expr {
        return this;
    }

    public getOutputs(): StringDict[] {
        return [{}];
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
        query: Query,
        env: DerivEnv
    ): Derivs { }
    
    /*
    public addOutput(newOutput: Output): Output {
        return new OutputExpr(this, newOutput).simplify();
    } */

    public rename(tapeName: string) {
        return this;
    }

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
        query: Query,
        env: DerivEnv
    ): Derivs { }
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

    public expandStrings(env: DerivEnv): Set<string> {
        const tape = env.getTape(this.tapeName);
        return tape.vocab;
    }

    public rename(newTapeName: string): DotExpr {
        return constructDot(newTapeName);
    }

    public *deriv(
        query: Query, 
        env: DerivEnv
    ): Derivs { 
        if (query.tapeName != this.tapeName) {
            return;
        }

        for (const c of query.expandStrings(env)) {
            yield [constructToken(query.tapeName, c), EPSILON];
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

    public *deriv(
        query: Query, 
        env: DerivEnv
    ): Derivs {
        if (query.tapeName != this.tapeName) {
            return;
        }
        
        for (const c of query.expandStrings(env)) {
            yield [constructToken(query.tapeName, c), this];
        }
    }
}

/**
 * This is basically a LiteralExpr expressing only a single token, so that we don't 
 * have to worry about the details of tokenization, indexing LTR/RTL, etc.
 */
export class TokenExpr extends Expr {

    constructor(
        public tapeName: string,
        public text: string
    ) {
        super();
    }

    public get id(): string {
        return `${this.tapeName}:${this.text}`;
    }

    public getOutputs(): StringDict[] {
        return [{ [this.tapeName] : this.text }];
    }

    /*
    public addOutput(newOutput: Output): Output {
        return new OutputExpr(this, newOutput).simplify();
    } */

    public expandStrings(env: DerivEnv): Set<string> {
        return new Set([this.text]);
    }

    public rename(newTapeName: string): TokenExpr {
        return constructToken(newTapeName, this.text);
    }
    
    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName != this.tapeName) return this;
        return NULL;
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        if (query.tapeName != this.tapeName) return;
        if (!(query instanceof DotExpr) && query.text != this.text) return;
        yield [this, EPSILON];
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
        if (tapeName != this.tapeName) return this;
        if (this.index >= this.tokens.length) return EPSILON;
        return NULL;
    }

    public *deriv(
        query: Query, 
        env: DerivEnv
    ): Derivs {
        if (this.index >= this.tokens.length) return;
        if (query.tapeName != this.tapeName) return;

        const tape = env.getTape(query.tapeName);
        if (tape.atomic) {
            if (query instanceof DotExpr || query.text == this.text) {
                const resultToken = constructToken(this.tapeName, this.text)
                yield [resultToken, EPSILON];
            }
            return;
        }

        if (query instanceof DotExpr || query.text == this.tokens[this.index]) {
            const resultToken = constructToken(this.tapeName, this.tokens[this.index]);
            const wrapped = constructLiteral(this.tapeName, this.text, this.tokens, this.index+1);
            yield [resultToken, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.index >= this.tokens.length) return EPSILON;
        return this;
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
        if (tapeName != this.tapeName) return this;
        if (this.index < 0) return EPSILON;
        return NULL;
    }

    public *deriv(
        query: Query, 
        env: DerivEnv
    ): Derivs {
        if (this.index < 0) return;
        if (query.tapeName != this.tapeName) return;

        const tape = env.getTape(query.tapeName);
        if (tape.atomic) {
            if (query instanceof DotExpr || query.text == this.text) {
                const resultToken = constructToken(this.tapeName, this.text);
                yield [resultToken, EPSILON];
            }
            return;
        }

        if (query instanceof DotExpr || query.text == this.tokens[this.index]) {
            const resultToken = constructToken(this.tapeName, this.tokens[this.index]);
            const wrapped = constructLiteral(this.tapeName, this.text, this.tokens, this.index-1);
            yield [resultToken, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.index < 0) {
            return EPSILON;
        }
        return this;
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
        
        const cNext = this.children[tapeName].delta(tapeName, env);
        return updateParallel(this.children, tapeName, cNext);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        if (!(query.tapeName in this.children)) return;

        const child = this.children[query.tapeName];
        const cResults = disjoin(child.deriv(query, env));
        for (const [cResult, cNext] of cResults) {
            const wrapped = updateParallel(this.children, query.tapeName, cNext);
            yield [cResult, wrapped];
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
        query: Query,
        env: DerivEnv
    ): Derivs {

        const [c1, c2] = (DIRECTION_LTR) ?
                        [this.child1, this.child2] :
                        [this.child2, this.child1];

        for (const [c1result, c1next] of
                c1.deriv(query, env)) {
            yield [c1result, constructPrecede(c1next, c2)];
        }

        const c1next = c1.delta(query.tapeName, env);
        for (const [c2result, c2next] of
                c2.deriv(query, env)) {
            yield [c2result, constructPrecede(c1next, c2next)];
        }
    }

    public simplify(): Expr {
        if (this.child1 instanceof EpsilonExpr) {
            return this.child2;
        }
        if (this.child2 instanceof EpsilonExpr) {
            return this.child1;
        }
        if (this.child1 instanceof NullExpr) {
            return this.child1;
        }
        if (this.child2 instanceof NullExpr) {
            return this.child2;
        }
        return this;
    }

    public getOutputs(): StringDict[] {
        let results: StringDict[] = [{}];
        let current: Expr = this;
        while (current instanceof ConcatExpr) {
            const unitDenotation = current.child2.getOutputs();
            results = outputProduct(unitDenotation, results);
            current = current.child1;
        }

        // now we're at the last current, and it's not a ConcatExpr, get its
        // denotation, add it on, and we're done
        const unitDenotation = current.getOutputs();
        results = outputProduct(unitDenotation, results) 
        return results;
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
        return constructAlternation(...newChildren);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        const results: Deriv[] = [];
        for (const child of this.children) {
            results.push(...child.deriv(query, env));
        }
        yield* disjoin(results);
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        let handled: boolean = false;
        let results: Expr[] = [];
        for (const child of this.children) {
            for (const [cHandled, cNext] of child.forward(env)) {
                handled ||= cHandled;
                results.push(cNext);
            }
        }
        yield [handled, constructAlternation(...results)];
    }
    
    public simplify(): Expr {
        const newChildren: Expr[] = [];
        let foundEpsilon: boolean = false;
        const newOutputs: Expr[] = [];
        for (const child of this.children) {
            if (child instanceof NullExpr) continue;
            if (child instanceof EpsilonExpr) {
                if (foundEpsilon) continue;
                foundEpsilon = true;
            }
            if (child instanceof OutputExpr) {
                newOutputs.push(child.child);
                continue;
            }
            newChildren.push(child);
        }

        if (newOutputs.length > 0) {
            const alt = constructAlternation(...newOutputs);
            newChildren.push(new OutputExpr(alt));
        }

        if (newChildren.length == 0) return NULL;
        if (newChildren.length == 1) return newChildren[0];
        return new UnionExpr(newChildren);
    }

    public getOutputs(): StringDict[] {
        return flatten(this.children.map(c => c.getOutputs()));
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
        query: Query,
        env: DerivEnv
    ): Derivs {
        for (const [c1result, c1next] of 
                disjoin(this.child1.deriv(query, env))) {

            if (c1result instanceof EpsilonExpr) {
                const wrapped = constructIntersection(c1next, this.child2);
                yield [c1result, wrapped];
                continue;
            }
    
            for (const [c2result, c2next] of 
                    disjoin(this.child2.deriv(c1result, env))) {
                const c1nxt = (c2result instanceof EpsilonExpr) ? this.child1 : c1next;
                const wrapped = constructIntersection(c1nxt, c2next);
                yield [c2result, wrapped];
            }
        }
    } 

    public simplify(): Expr {
        if (this.child1 instanceof NullExpr) return this.child1;
        if (this.child2 instanceof NullExpr) return this.child2;
        if (this.child1 instanceof EpsilonExpr && this.child2 instanceof EpsilonExpr) {
            return this.child1;
        }
        if (this.child1 instanceof IntersectExpr) {
            const head = this.child1.child1;
            const tail = constructIntersection(this.child1.child2, this.child2);
            return constructIntersection(head, tail);
        }
        return this;
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
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (!this.tapes.has(query.tapeName)) {
            for (const [c1result, c1next] of 
                    disjoin(this.child1.deriv(query, env))) {
                const wrapped = constructFilter(c1next, this.child2, this.tapes);
                yield [c1result, wrapped];
            }
            return;
        }
        
        for (const [c2result, c2next] of 
                disjoin(this.child2.deriv(query, env))) {

            if (c2result instanceof EpsilonExpr) {
                const wrapped = constructFilter(this.child1, c2next, this.tapes);
                yield [c2result, wrapped];
                continue;
            }
    
            for (const [c1result, c1next] of 
                    disjoin(this.child1.deriv(c2result, env))) {
                const c2nxt = (c1result instanceof EpsilonExpr) ? this.child2 : c2next;
                const wrapped = constructFilter(c1next, c2nxt, this.tapes);
                yield [c1result, wrapped];
            }
        }
    } 

    public simplify(): Expr {
        if (this.child1 instanceof NullExpr) return this.child1
        if (this.child2 instanceof NullExpr) return this.child2;
        if (this.child1 instanceof EpsilonExpr && this.child2 instanceof EpsilonExpr) {
            return this.child1;
        }
        return this;
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
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (!this.tapes2.has(query.tapeName)) {
            for (const [leftResult, leftNext] of 
                    disjoin(this.child1.deriv(query, env))) {
                const wrapped = constructJoin(leftNext, this.child2, this.tapes1, this.tapes2);
                yield [leftResult, wrapped];
            }
            return;
        }
        
        if (!this.tapes1.has(query.tapeName)) {
            for (const [rightResult, rightNext] of 
                    disjoin(this.child2.deriv(query, env))) {
                const wrapped = constructJoin(this.child1, rightNext, this.tapes1, this.tapes2);
                yield [rightResult, wrapped];
            }
            return;
        }
        
        for (const [leftResult, leftNext] of 
                disjoin(this.child1.deriv(query, env))) {

            if (leftResult instanceof EpsilonExpr) {
                const wrapped = constructJoin(leftNext, this.child2, this.tapes1, this.tapes2);
                yield [leftResult, wrapped];
                continue;
            }

            for (const [rightResult, rightNext] of 
                    disjoin(this.child2.deriv(leftResult, env))) {
                const lnext = (rightResult instanceof EpsilonExpr) ? this.child1 : leftNext;
                const wrapped = constructJoin(lnext, rightNext, this.tapes1, this.tapes2);
                yield [rightResult, wrapped];
            }
        }
    } 

    public simplify(): Expr {
        if (this.child1 instanceof NullExpr) return this.child1;
        if (this.child2 instanceof NullExpr) return this.child2;
        if (this.child1 instanceof EpsilonExpr && this.child2 instanceof EpsilonExpr) {
            return this.child1;
        }
        return this;
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

    public *forward(env: DerivEnv): Gen<[boolean,Expr]> {
        if (env.stack.exceedsMax(this.symbolName)) {
            return;
        }

        const newEnv = env.addSymbol(this.symbolName);
        let child = this.getChild(env);

        for (const [cHandled, cNext] of child.forward(newEnv)) {
            const wrapped = constructEmbed(this.symbolName, cNext);
            yield [cHandled, wrapped];
        }
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (env.stack.exceedsMax(this.symbolName)) {
            return NULL;
        }
        const newEnv = env.addSymbol(this.symbolName);
        const cNext = this.getChild(env).delta(tapeName, newEnv);
        return constructEmbed(this.symbolName, cNext);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (env.stack.exceedsMax(this.symbolName)) {
            return;
        }

        const newEnv = env.addSymbol(this.symbolName);
        let child = this.getChild(env);

        for (const [cResult, cNext] of 
                        child.deriv(query, newEnv)) {
            const wrapped = constructEmbed(this.symbolName, cNext);
            yield [cResult, wrapped];
        }
    }
    
    public simplify(): Expr {
        if (this.child === undefined) return this;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        return this;
    }
}

export function constructEmbed(
    symbolName: string, 
    child: Expr | undefined = undefined
): Expr {
    return new EmbedExpr(symbolName, child).simplify();
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

    public getOutputs(): StringDict[] {
        return this.child.getOutputs();
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
        return `Col(${this.child.id})`;
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
        query: Query,
        env: DerivEnv
    ): Derivs {
        const newEnv = env.pushSymbols(this.symbols);
        for (const [cResult, cNext] of 
                this.child.deriv(query, newEnv)) {
            yield [cResult, constructCollection(cNext, this.symbols)];
        }
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        const newEnv = env.pushSymbols(this.symbols);
        for (const [cHandled, cNext] of this.child.forward(newEnv)) {
            const wrapped = constructCollection(cNext, this.symbols);
            yield [cHandled, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        return this;
    }
}

export function constructCollection(child: Expr, symbols: Dict<Expr>): Expr {
    return new CollectionExpr(child, symbols).simplify();
}

export class CountExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapeName: string,
        public maxChars: number
    ) {
        super(child);
    }

    public get id(): string {
        return `Count_${this.tapeName}:${this.maxChars}(${this.child.id})`;
    }
    
    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild = this.child.delta(tapeName, env);
        if (tapeName == this.tapeName) {
            // tape's done, we can delete this node
            return newChild;
        }
        return constructCount(newChild, this.tapeName, this.maxChars);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        for (const [cResult, cNext] of this.child.deriv(query, env)) {
            
            if (query.tapeName != this.tapeName || cResult instanceof EpsilonExpr) {
                // not relevant to us, just move on
                const wrapped = constructCount(cNext, this.tapeName, this.maxChars);
                yield [cResult, wrapped];
                continue;
            }
            
            if (this.maxChars < cResult.text.length) continue; 
            
            const newMax = this.maxChars - cResult.text.length;
            const wrapped = constructCount(cNext, this.tapeName, newMax);
            yield [cResult, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        return this;
    }
}

/**
 * OutputExpr is a holder for outputs.  For the purpose of delta/deriv
 * it acts like an epsilon -- it's all material that's "finished".
 */
export class OutputExpr extends UnaryExpr {

    constructor(
        child: Expr
    ) {
        super(child);
    }

    public get id(): string {
        let results = [];
        const denotation = this.getOutputs();
        for (const [k, v] of Object.entries(denotation)) {
            results.push(`${k}:${v}`)
        }
        return "O[" + results.join("+") + "]";
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        return this;
    }

    public *deriv(query: Query, env: DerivEnv): Derivs {
        return;
    }

    public addOutput(newOutput: Expr): OutputExpr {
        if (newOutput instanceof TokenExpr && newOutput.text == "") {
            return this;
        }
        if (newOutput instanceof OutputExpr) {
            return this.addOutput(newOutput.child);
        }
        const concat = constructConcat(this.child, newOutput);
        return new OutputExpr(concat);
    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        return this;
    }
}

export class CursorExpr extends UnaryExpr {

    constructor(
        public tape: string,
        child: Expr,
        public output: OutputExpr = new OutputExpr(EPSILON)
    ) {
        super(child);
    }

    public get id(): string {
        return `T_${this.tape}(${this.child.id})`;
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        if (tapeName == this.tape) return this; 
                // a tape name "X" is considered to refer to different 
                // tapes inside and outside Cursor("X", child)

        const cNext = this.child.delta(tapeName, env);
        return constructCursor(this.tape, cNext, this.output);
    }

    public *deriv(query: Query, env: DerivEnv): Derivs {
        if (query.tapeName == this.tape) return; 
                // a tape name "X" is considered to refer to different 
                // tapes inside and outside Cursor("X", child)

        for (const [cResult, cNext] of this.child.deriv(query, env)) {
            const wrapped = constructCursor(this.tape, cNext, this.output);
            yield [cResult, wrapped];
        }
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {

        const cResults: Deriv[] = [];
        
        // do a delta
        const deltaResult = constructToken(this.tape, "");
        const deltaNext = this.child.delta(this.tape, env);
        cResults.push([deltaResult, deltaNext]);

        // do a deriv
        const query = constructDot(this.tape);
        cResults.push(...this.child.deriv(query, env));

        // for each of those results, add the output to this.output,
        // call .forward() on each next, wrap and yield
        for (const [cResult, cNext] of disjoin(cResults)) {
            env.incrStates();
            const newOutput = this.output.addOutput(cResult);

            if (cResult instanceof TokenExpr && cResult.text == "") {
                env.logDelta(cResult.tapeName, cNext);
            } else {
                env.logDeriv(cResult, cNext);
            }

            const cHandled = !(cResult instanceof TokenExpr) || cResult.text != '';
                
            env.indentLog(1);
            for (const [nHandled, nNext] of cNext.forward(env)) {
                
                const wrapped = constructCursor(this.tape, nNext, newOutput);
                yield [cHandled || nHandled, wrapped];
            }
            env.indentLog(-1);
        }
    }

    public simplify(): Expr {
        if (this.child instanceof OutputExpr) {
            return this.child.addOutput(this.output);
        }
        if (this.child instanceof EpsilonExpr) return this.output;
        if (this.child instanceof NullExpr) return this.child;
        return this;
    }

    public getOutputs(): StringDict[] {
        const myOutput = this.output.getOutputs();
        const childOutput = this.child.getOutputs();
        return outputProduct(myOutput, childOutput);
    }

}

export function constructCursor(tape: string, child: Expr, output?: OutputExpr): Expr {
    return new CursorExpr(tape, child, output).simplify();
}

export class PreTapeExpr extends UnaryExpr {

    constructor(
        public tape1: string,
        public tape2: string,
        child: Expr,
        public output: OutputExpr = new OutputExpr(EPSILON)
    ) {
        super(child);
    }

    public get id(): string {
        return `Pre_${this.tape1}>${this.tape2}(${this.output.id},${this.child.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        console.log(`calculating d_${tapeName} for ${this.id}`);
        if (tapeName == this.tape1) {
            throw new Error(`something's gone wrong, querying on ` +
                `a PreTapeExpr tape1 ${this.tape1}`);
        }

        if (tapeName == this.tape2) {
            const t1next = this.child.delta(this.tape1, env);
            console.log(`t1next is ${t1next.id}`)
            const t2next = t1next.delta(this.tape2, env);
            console.log(`t2next is ${t2next.id}`);
            return constructPreTape(this.tape1, this.tape2, t2next, this.output);
        }

        const cNext = this.child.delta(tapeName, env);
        return constructPreTape(this.tape1, this.tape2, cNext, this.output);
    }
    
    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        if (query.tapeName == this.tape1) {
            throw new Error(`something's gone wrong, querying on ` +
                `a PreTapeExpr tape1 ${this.tape1}`);
        }

        if (query.tapeName == this.tape2) {
            
            // if the child is nullable on the fromTape, we can stop 
            // querying on fromTape -- that is, stop being a PreTapeExpr
            const childDelta = this.child.delta(this.tape1, env);
            if (!(childDelta instanceof NullExpr)) {
                yield* childDelta.deriv(query, env);
            }

            //const globalTapeName = env.getTape(this.fromTape).globalName;
            const t1query = query.rename(this.tape1);
            for (const [t1result, t1next] of this.child.deriv(t1query, env)) {
                if (t1next instanceof NullExpr) {
                    continue;
                }
                env.incrStates();
                env.logDeriv(t1result, t1next);
                if (t1result instanceof EpsilonExpr) {
                    // if we didn't go anywhere on tape1, don't query on
                    // tape2, just treat it as going nowhere on tape2
                    const t2result = t1result.rename(this.tape2);
                    const wrapped = constructPreTape(this.tape1, this.tape2, t1next, this.output);
                    yield [t2result, wrapped];
                    continue;
                }
                
                const newOutput = this.output.addOutput(t1result);
                for (const [t2result, t2next] of t1next.deriv(query, env)) {
                    env.logDeriv(t2result, t2next);
                    const wrapped = constructPreTape(this.tape1, this.tape2, t2next, newOutput);
                    yield [t2result, wrapped];
                }
            }
            return;
        }

        for (const [cResult, cNext] of this.child.deriv(query, env)) {
            const wrapped = constructPreTape(this.tape1, this.tape2, cNext, this.output);
            yield [cResult, wrapped];
        }

    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.output;
        if (this.child instanceof NullExpr) return this.child;
        return this;
    }
}

export function constructPreTape(
    fromTape: string, 
    toTape: string, 
    child: Expr,
    output?: OutputExpr,
): Expr {
    return new PreTapeExpr(fromTape, toTape, child, output).simplify();
}

export class PriorityExpr extends UnaryExpr {

    constructor(
        public tapes: string[],
        child: Expr
    ) { 
        super(child)
    }

    public get id(): string {
        return `P_${this.tapes}:${this.child.id}`;
    }

    public delta(
        tapeName: string, 
        env: DerivEnv
    ): Expr {
        let remainingTapes: string[] = this.tapes;
        if (tapeName == OPEN_TAPE) {
            tapeName = this.tapes[0];
            remainingTapes = this.tapes.slice(1);
        } 

        const cNext = this.child.delta(tapeName, env);
        if (tapeName == OPEN_TAPE) env.logDelta(tapeName, cNext);
        if (remainingTapes.length == 0 && (!(cNext instanceof NullExpr || cNext instanceof EpsilonExpr))) {
            if (cNext instanceof EmbedExpr) {
                const referent = cNext.child;
                throw new Error(`warning, nontrivial embed at end: ${cNext.symbolName}:${referent?.id}`);
            }
            throw new Error(`warning, nontrivial expr at end: ${cNext.id}`);
        }
        return constructPriority(remainingTapes, cNext);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        let tapes = this.tapes;
        if (query.tapeName == OPEN_TAPE) {
            const tapeToTry = this.tapes[0];
            tapes = [... this.tapes.slice(1), tapeToTry];
            query = constructDot(tapeToTry);
        }

        for (const [cResult, cNext] of 
                disjoin(this.child.deriv(query, env))) {

            if (!(cNext instanceof NullExpr)) {
                if (query.tapeName == OPEN_TAPE) {
                    env.incrStates();
                    env.logDeriv(cResult, cNext);
                }
                const wrapped = constructPriority(tapes, cNext);
                yield [cResult, wrapped];
            }
        }
    }

    public *forward(env: DerivEnv): Gen<[boolean,Expr]> {
        for (const [cHandled, cNext] of this.child.forward(env)) {
            const wrapped = constructPriority(this.tapes, cNext);
            yield [cHandled, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        if (this.tapes.length == 0) {
            throw new Error(`warning, nontrivial expr at end: ${this.child.id}`);
        }
        return this;
    }
}

export function constructPriority(tapes: string[], child: Expr): Expr {
    return new PriorityExpr(tapes, child).simplify();
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
        return `NEps_${this.tapeName}:${this.maxCount}(${this.child.id})`;
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        const childDelta = this.child.delta(tapeName, env);
        return constructNoEps(childDelta, this.tapeName);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        for (const [cResult, cNext] of this.child.deriv(query, env)) {
            if (query.tapeName == this.tapeName && cResult instanceof EpsilonExpr) {
                continue;
            }

            const wrapped = constructNoEps(cNext, this.tapeName);
            yield [cResult, wrapped];
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
        return `Sh(${this.child.id})`;
    }

    public delta(
        tapeName: string, 
        env: DerivEnv
    ): Expr {
        const cNext = this.child.delta(tapeName, env);
        return constructShort(cNext);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        const deltaNext = this.delta(query.tapeName, env);
        if (!(deltaNext instanceof NullExpr)) {
            // if our current tape is nullable, then we have 
            // no derivatives on that tape.
            return;
        }

        // Important: the deriv here MUST be disjoint, just like 
        // under negation.
        for (const [cResult, cNext] of disjoin(this.child.deriv(query, env))) {
            
            const cNextDelta = cNext.delta(query.tapeName, env);
            if (!(cNextDelta instanceof NullExpr)) {
                yield [cResult, cNextDelta];
                continue;
            }
            
            const wrapped = constructShort(cNext);
            yield [cResult, wrapped];
        }
    }
}

export function constructShort(child: Expr): Expr {
    if (child instanceof EpsilonExpr || child instanceof NullExpr) {
        return child;
    }
    return new ShortExpr(child);
}

class StarExpr extends UnaryExpr {

    constructor(
        child: Expr
    ) { 
        super(child);
    }

    public get id(): string {
         return `(${this.child.id})*`;
    }

    
    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild = this.child.delta(tapeName, env);
        return constructStar(newChild);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        const oneLess = constructStar(this.child);
        const deltaNext = this.child.delta(query.tapeName, env);
        const oneLessDelta = constructStar(deltaNext);
        for (const [cResult, cNext] of this.child.deriv(query, env)) {
            const wrapped = constructPrecede(oneLessDelta, 
                            constructPrecede(cNext, oneLess));
            yield [cResult, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return EPSILON;
        return this;
    }

}

export function constructStar(child: Expr): Expr {
    return new StarExpr(child).simplify();
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
        query: Query,
        env: DerivEnv
    ): Derivs {
        const oneLess = constructRepeat(this.child, this.minReps-1, this.maxReps-1);
        const deltad = this.child.delta(query.tapeName, env);

        let yielded: boolean = false;

        for (const [cResult, cNext] of this.child.deriv(query, env)) {
            yield [cResult, constructPrecede(cNext, oneLess)];
            yielded = true;
        }
        
        if (yielded &&
                !(deltad instanceof NullExpr) 
                && oneLess instanceof RepeatExpr) {
            yield [EPSILON, constructPrecede(deltad, oneLess)];
        } 
    }

    public simplify(): Expr {
        if (this.maxReps < 0) return NULL;
        if (this.minReps > this.maxReps) return NULL;
        if (this.maxReps == 0) return EPSILON;
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) {
            if (this.minReps <= 0) return EPSILON;
            return this.child;
        }
        return this;
    }
}


/**
 * Creates A{min,max} from A.
 */
export function constructRepeat(
    child: Expr, 
    minReps: number = 0, 
    maxReps: number = Infinity
): Expr {
    if (child instanceof DotExpr && minReps <= 0 && maxReps == Infinity) {
        return new DotStarExpr(child.tapeName);
    }
    return new RepeatExpr(child, minReps, maxReps).simplify();
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
        query: Query,
        env: DerivEnv
    ): Derivs {
        const newEnv = env.addTapes(this.tapes);
        for (const [cResult, cNext] of 
                this.child.deriv(query, newEnv)) {
            yield [cResult, constructTapeNS(cNext, this.tapes)];
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
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (query.tapeName != this.toTape && query.tapeName == this.fromTape) {
            return;
        }

        const newTapeName = renameTape(query.tapeName, this.toTape, this.fromTape);
        const newEnv = env.renameTape(this.toTape, this.fromTape);
        const newQuery = query.rename(newTapeName);
        for (const [cResult, cNext] of 
                this.child.deriv(newQuery, newEnv)) {
            const unRenamedResult = cResult.rename(query.tapeName);
            const wrapped = constructRename(cNext, this.fromTape, this.toTape);
            yield [unRenamedResult, wrapped];
        }
    }

    public simplify(): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof LiteralExpr && this.child.tapeName == this.fromTape) {
            return constructLiteral(this.toTape, this.child.text, this.child.tokens, this.child.index);
        }
        if (this.child instanceof DotExpr && this.child.tapeName == this.fromTape) {
            return constructDot(this.toTape);
        }
        return this;
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
        const cNext = this.child.delta(tapeName, env);
        const remainingTapes = setDifference(this.tapes, new Set([tapeName]));
        
        let result: Expr;
        
        if (cNext instanceof NullExpr) return constructNegation(cNext, remainingTapes);
        if (remainingTapes.size == 0) return NULL;
        
        return constructNegation(cNext, remainingTapes);
    }
    
    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (!this.tapes.has(query.tapeName)) {
            return;
        }

        let remainder: Set<string> = new Set(query.expandStrings(env));

        for (const [cResult, cNext] of disjoin(this.child.deriv(query, env))) {
            if (!(cResult instanceof EpsilonExpr)) {
                remainder.delete(cResult.text);  
            }
            const wrapped = constructNegation(cNext, this.tapes);
            yield [cResult, wrapped];
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything expression that always
        // succeeds.
        for (const c of remainder) {
            yield [constructToken(query.tapeName, c), constructUniverse(this.tapes)];
        }
    }

    public simplify(): Expr {
        if (this.child instanceof NullExpr) return constructUniverse(this.tapes);
        if (this.child instanceof NegationExpr) return this.child.child;
        if (this.child instanceof DotStarExpr) return NULL;
        return this;
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
        // return this.child.id;
        return `Cor_${this.fromTape}:${this.fromCount}>${this.toTape}:${this.toCount}(${this.child.id})`;
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        if (tapeName == this.fromTape) {
            const cNext = this.child.delta(tapeName, env);
            return constructCorrespond(cNext, this.fromTape, this.fromCount,
                                            this.toTape, this.toCount);
        }

        if (tapeName == this.toTape) {
            if (this.toCount < this.fromCount) {
                return NULL;
            }
            const cNext = this.child.delta(tapeName, env);
            return constructCorrespond(cNext, this.fromTape, this.fromCount,
                this.toTape, this.toCount);
        }

        // it's neither tape we care about
        return this;
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        if (query.tapeName == this.toTape) {
            for (const [cResult, cNext] of this.child.deriv(query, env)) {
                const wrapped = constructCorrespond(cNext, 
                                            this.fromTape, this.fromCount,
                                            this.toTape, this.toCount+1);
                yield [cResult, wrapped];
            }

            // toTape is special, if it's nullable but has emitted fewer tokens than
            // fromTape has, it can emit an epsilon
            const cNext = this.child.delta(query.tapeName, env);
            if (!(cNext instanceof NullExpr) && this.toCount < this.fromCount) {
                const wrapped = constructCorrespond(this.child, 
                    this.fromTape, this.fromCount,
                    this.toTape, this.toCount+1);
                yield [EPSILON, wrapped];
            }
            return;
        }

        if (query.tapeName == this.fromTape) {
            for (const [cResult, cNext] of this.child.deriv(query, env)) {
                const wrapped = constructCorrespond(cNext, 
                                            this.fromTape, this.fromCount+1,
                                            this.toTape, this.toCount);
                yield [cResult, wrapped];
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

export class MatchFromExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }

    public get id(): string {
        return `M_${this.fromTape}>${this.toTape}(${this.child.id})`;
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (tapeName == this.toTape) {
            const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            const newEnv = env.renameTape(this.toTape, this.fromTape);
            const cNext = this.child.delta(newTapeName, newEnv);
            return constructMatchFrom(cNext, this.fromTape, this.toTape);  
        }
        const cNext = this.child.delta(tapeName, env);
        return constructMatchFrom(cNext, this.fromTape, this.toTape);
    }
    
    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        
        // if it's a tape that isn't our to/from, just forward and wrap 
        if (query.tapeName != this.fromTape && query.tapeName != this.toTape) {
            for (const [cResult, cNext] of this.child.deriv(query, env)) {
                const wrapped = constructMatchFrom(cNext, this.fromTape, this.toTape);
                yield [cResult, wrapped];
            }
            return;
        }

        // tapeName is either our toTape or fromTape.  The only differences
        // between these two cases is (a) we buffer the literal on the opposite
        // tape, that's what oppositeTape is below and (b) when tapeName is our
        // toTape, we have to act like a toTape->fromTape rename.  

        const oppositeTapeName = (query.tapeName == this.fromTape) ? this.toTape : this.fromTape;
        const oppositeTape = env.getTape(oppositeTapeName);

        // We ask for a namespace rename either way; when tapeName == fromTape,
        // this is just a no-op
        const newEnv = env.renameTape(query.tapeName, this.fromTape); 
        const fromQuery = query.rename(this.fromTape);

        for (const [cResult, cNext] of 
                this.child.deriv(fromQuery, newEnv)) {
            const wrapped = constructMatchFrom(cNext, this.fromTape, this.toTape);
            if (cResult instanceof EpsilonExpr) {
                env.logDebug("========= EpsilonToken ==========");
                yield [cResult, wrapped];
            } else {
                for (const c of cResult.expandStrings(env)) {
                    if (!oppositeTape.vocab.has(c)) {
                        continue;
                    }
                    
                    const lit = constructToken(oppositeTapeName, c);
                    yield [constructToken(query.tapeName, c), constructPrecede(lit, wrapped)];
                }
            }
        }
    }

    public simplify(): Expr {
        
        if (this.child instanceof EpsilonExpr) {
            return this.child;
        }
        if (this.child instanceof NullExpr) {
            return this.child;
        }
        return this;
    }

}

/*
export class MatchExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapes: Set<string>
    ) {
        super(child);
    }

    public get id(): string {
        return `M_${JSON.stringify(this.tapes)}(${this.child.id})`;
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

    public *deriv(
        query: Query,
        env: DerivEnv
    ): DerivResults {
        env.logDebug(`matching ${query.id}`)
        if (!this.tapes.has(query.tapeName)) {
            // it's not a tape we're matching
            for (const [cTarget, cNext] of this.child.deriv(query, env)) {
                yield [cTarget, constructMatch(cNext, this.tapes)];
            }
            return;
        }

        let results: DerivResult[] = [[query.text, this.child]];
        for (const t of this.tapes) {
            const nextResults: DerivResult[] = [];
            for (const [prevTarget, prevExpr] of results) {
                if (prevTarget instanceof EpsilonToken) {
                    continue;
                }
                const newQuery = new TokenExpr(t, prevTarget.text)
                for (const [cTarget, cNext] of prevExpr.deriv(newQuery, env)) {
                    const tObj = env.getTape(t);
                    env.logDebug(`${t} atomic? ${tObj.atomic}`)
                    env.logDebug(`found ${t}:${cTarget}`)
                    nextResults.push([cTarget, cNext]);
                }
            }
            results = nextResults;    
        }

        const tape = env.getTape(query.tapeName);

        for (const [nextTarget, nextExpr] of results) {
            if (nextTarget instanceof EpsilonToken) {
                continue;
            }
            const cs = tape.expandStrings(nextTarget.text);

            for (const c of cs) {
                let bufferedNext: Expr = constructMatch(nextExpr, this.tapes);
                for (const matchTape of this.tapes) {
                    if (matchTape == query.tapeName) {
                        continue;
                    }
                    const lit = constructLiteral(matchTape, c, [c]);
                    bufferedNext = constructPrecede(lit, bufferedNext);
                }
                yield [constructToken(query.tapeName, c), bufferedNext];
            }
        }
    }
}
*/

/* CONVENIENCE FUNCTIONS */
export const EPSILON = new EpsilonExpr();
export const NULL = new NullExpr();

export function constructLiteral(
    tape: string, 
    text: string,
    tokens: string[],
    index?: number
): Expr {
    if (DIRECTION_LTR) {
        return new LiteralExpr(tape, text, tokens, index).simplify();
    }
    return new RTLLiteralExpr(tape, text, tokens, index).simplify();

}

export function constructDot(tape: string): DotExpr {
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
        return constructConcat(firstChild, secondChild).simplify();
    }
    return constructConcat(secondChild, firstChild).simplify();

}

export function constructConcat(c1: Expr, c2: Expr): Expr {
    return new ConcatExpr(c1, c2).simplify();
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
    return new UnionExpr(children).simplify();
}

export function constructIntersection(c1: Expr, c2: Expr): Expr {
    return new IntersectExpr(c1, c2).simplify();
}

export function constructMaybe(child: Expr): Expr {
    return constructAlternation(child, EPSILON).simplify();
}

export function constructCount(
    child: Expr, 
    tapeName: string, 
    maxChars: number
): Expr {
    return new CountExpr(child, tapeName, maxChars).simplify();
}

export function constructNegation(
    child: Expr, 
    tapes: Set<string>,
): Expr {
    return new NegationExpr(child, tapes).simplify();
}

export function constructDotStar(tape: string): Expr {
    return new DotStarExpr(tape);
}

export function constructUniverse(
    tapes: Set<string>, 
): Expr {
    return constructSequence(...[...tapes]
                .map(t => constructDotStar(t)));
}

export function constructMatchFrom(
    child: Expr,
    fromTape: string,
    ...toTapes: string[]
): Expr {
    let result = child;
    for (const tape of toTapes) {
        result = new MatchFromExpr(result, fromTape, tape);
    }
    return result.simplify();
}

export function constructRename(
    child: Expr, 
    fromTape: string, 
    toTape: string
): Expr {
    return new RenameExpr(child, fromTape, toTape).simplify();
}

export function constructFilter(c1: Expr, c2: Expr, tapes: Set<string>): Expr {
    return new FilterExpr(c1, c2, tapes).simplify();
}

export function constructJoin(c1: Expr, c2: Expr, tapes1: Set<string>, tapes2: Set<string>): Expr {
    return new JoinExpr(c1, c2, tapes1, tapes2).simplify();
}

export function constructNotContains(
    fromTapeName: string,
    children: Expr[], 
    tapes: string[], 
    begin: boolean,
    end: boolean
): Expr {
    const dotStar: Expr = constructDotStar(fromTapeName);
    let seq: Expr;
    if (begin && end) {
        seq = constructShort(constructSequence(...children));
    } else if (begin) {
        seq = constructSequence(constructShort(constructSequence(...children)), dotStar);
    } else if (end) {
        seq = constructSequence(dotStar, constructShort(constructSequence(...children)));
    } else {
        seq = DIRECTION_LTR ?
              constructSequence(constructShort(constructSequence(dotStar, ...children)), dotStar) :
              constructSequence(dotStar, constructShort(constructSequence(...children, dotStar)));
    }
    return constructNegation(seq, new Set(tapes));
}

export function constructToken(
    tapeName: string,
    text: string
): TokenExpr {
    return new TokenExpr(tapeName, text);
}