import {
    Gen,
    difference, foldRight, foldLeft,
    Dict,
    StringDict,
    outputProduct,
    flatten,
    iterUnit,
    update,
    Func,
} from "./utils/func";
import { 
    OldTape, TapeNamespace, 
    renameTape
} from "./tapes";
import { INPUT_TAPE, OUTPUT_TAPE } from "./utils/constants";
import { VERBOSE_DEBUG, logDebug, logStates, logTime } from "./utils/logging";
import { Namespace } from "./utils/namespace";
import { Env, Options } from "./utils/options";
import { CounterStack } from "./utils/counter";
import { randomCut, randomCutIter } from "./utils/random";

export type Query = TokenExpr | DotExpr;

export class DerivStats {
    public statesVisited: number = 0;
    public indentation: number = 0;
}

export class Deriv {
    
    constructor(
        public result: TokenExpr | EpsilonExpr,
        public next: Expr
    ) { }

    public wrap(f: Func<Expr,Expr>) {
        return new Deriv(this.result, f(this.next));
    }
}

export type Derivs = Gen<Deriv>;

export type ForwardGen = Gen<[boolean,Expr]>;

export class ExprNamespace extends Namespace<Expr> {}


/** 
 * An Env[ironment] encapsulates the execution environment for 
 * the core algorithm: the current state of the symbol stack, 
 * the tape namespace mapping local tape names to global tapes, 
 * and configuration options.
 */
export class DerivEnv extends Env {

    constructor(
        opt: Options,
        public tapeNS: TapeNamespace,
        public symbols: Dict<Expr>,
        public stack: CounterStack,
        public vocab: Set<string>,
        public atomic: boolean,
        public random: boolean,
        public stats: DerivStats
    ) { 
        super(opt);
    }

    public renameTape(fromKey: string, toKey: string): DerivEnv {
        const tapeNS = this.tapeNS.rename(fromKey, toKey);
        return update(this, {tapeNS});
    }

    public addTapes(tapes: Dict<OldTape>): DerivEnv {
        const tapeNS = new TapeNamespace(tapes, this.tapeNS);
        return update(this, {tapeNS});
    }

    public getTape(tapeName: string): OldTape {
        return this.tapeNS.get(tapeName);
    }

    public getSymbol(symbol: string): Expr {
        return this.symbols[symbol];
    }
    
    public setSymbols(symbols: Dict<Expr>): DerivEnv {
        return update(this, {symbols});
    }

    public addSymbol(symbol: string): DerivEnv {
        const stack = this.stack.add(symbol);
        return update(this, {stack});
    }

    public setVocab(vocab: Set<string>, atomic: boolean): DerivEnv {
        return update(this, {vocab, atomic});
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
            if (result instanceof TokenExpr && result.text == "") {
                this.logIndent(`└ d_${result.tapeName} = ${next.id}`);
                return;
            }
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
            console.log(`${msg} ${JSON.stringify(output.getOutputs(this))}`);
        }
    }

    public logTime(msg: string): void {
        logTime(this.opt.verbose, msg);
    }

    public logStates(msg: string): void {
        logStates(this.opt.verbose, msg);
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

function *wrap(
    ds: Derivs,
    f: (e: Expr) => Expr
): Derivs {
    for (const d of ds) {
        yield d.wrap(f);
    }
}

function *disjoin(
    ds: Iterable<Deriv>,
    env: DerivEnv,
    obligatory: boolean = false
): Derivs {
    if (!obligatory && env.random) {
        yield* ds;
        return;
    }

    const results: {[c: string]: [TokenExpr|EpsilonExpr, Expr[]]} = {};
    for (const d of ds) {
        const cString = d.result.id;
        if (!(cString in results)) {
            results[cString] = [d.result, []];
        }
        results[cString][1].push(d.next);
    }

    for (const [cResult, cNexts] of Object.values(results)) {
        const wrapped = constructAlternation(env, ...cNexts);
        yield new Deriv(cResult, wrapped);
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

    public simplify(env: Env): Expr {
        return this;
    }

    public getOutputs(env: DerivEnv): StringDict[] {
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
        //const tape = env.getTape(this.tapeName);
        //return tape.vocab;
        return env.vocab;
    }

    public rename(newTapeName: string): DotExpr {
        return constructDot(newTapeName);
    }

    public *deriv(
        query: Query, 
        env: DerivEnv
    ): Derivs { 
        if (query.tapeName != this.tapeName) return;
        const cs = [... query.expandStrings(env)];
        const csCut = randomCut(cs, env.random);
        for (const c of csCut) {
            const token = constructToken(query.tapeName, c);
            yield new Deriv(token, EPSILON);
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
        
        const cs = [... query.expandStrings(env)];
        const csCut = randomCut(cs, env.random);
        for (const c of csCut) {
            const token = constructToken(query.tapeName, c);
            yield new Deriv(token, this);
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

    public getOutputs(env: DerivEnv): StringDict[] {
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
        yield new Deriv(this, EPSILON);
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

        //const tape = env.getTape(query.tapeName);
        if (env.atomic) {
            if (query instanceof DotExpr || query.text == this.text) {
                const resultToken = constructToken(this.tapeName, this.text)
                yield new Deriv(resultToken, EPSILON);
            }
            return;
        }

        if (query instanceof DotExpr || query.text == this.tokens[this.index]) {
            const resultToken = constructToken(this.tapeName, this.tokens[this.index]);
            const wrapped = constructLiteral(env, this.tapeName, this.text, this.tokens, this.index+1);
            yield new Deriv(resultToken, wrapped);
        }
    }

    public simplify(env: Env): Expr {
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

        //const tape = env.getTape(query.tapeName);
        if (env.atomic) {
            if (query instanceof DotExpr || query.text == this.text) {
                const resultToken = constructToken(this.tapeName, this.text);
                yield new Deriv(resultToken, EPSILON);
            }
            return;
        }

        if (query instanceof DotExpr || query.text == this.tokens[this.index]) {
            const resultToken = constructToken(this.tapeName, this.tokens[this.index]);
            const wrapped = constructLiteral(env, this.tapeName, this.text, this.tokens, this.index-1);
            yield new Deriv(resultToken, wrapped);
        }
    }

    public simplify(env: Env): Expr {
        if (this.index < 0) {
            return EPSILON;
        }
        return this;
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
        return constructConcat(env, newChild1, newChild2);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        const [c1, c2] = env.opt.directionLTR ?
                        [this.child1, this.child2] :
                        [this.child2, this.child1];

        const c1derivs = c1.deriv(query, env);
        const c1wrapped = wrap(c1derivs, e => constructPrecede(env, e, c2));
        
        const c1next = c1.delta(query.tapeName, env);
        const c2derivs = c2.deriv(query, env);
        const c2wrapped = wrap(c2derivs, e => constructPrecede(env, c1next, e));

        yield* randomCutIter([c1wrapped, c2wrapped], env.random);
    }

    public *forward(
        env: DerivEnv
    ): Gen<[boolean,Expr]> {
        const [c1, c2] = env.opt.directionLTR ?
                        [this.child1, this.child2] :
                        [this.child2, this.child1];

        for (const [c1Handled,c1Next] of c1.forward(env)) {
            if (c1Handled) {
                const wrapped = constructPrecede(env, c1Next, c2);
                yield [c1Handled, wrapped];
                continue;
            } 
            for (const [c2Handled,c2Next] of c2.forward(env)) {
                const wrapped = constructPrecede(env, c1Next, c2Next);
                yield [c2Handled, wrapped];
            }
        }
    }

    public simplify(env: Env): Expr {
        if (this.child1 instanceof EpsilonExpr) return this.child2;
        if (this.child2 instanceof EpsilonExpr) return this.child1;
        if (this.child1 instanceof NullExpr) return this.child1;
        if (this.child2 instanceof NullExpr) return this.child2;
        return this;
    }

    public getOutputs(env: DerivEnv): StringDict[] {
        let results: StringDict[] = [{}];
        let current: Expr = this;
        while (current instanceof ConcatExpr) {
            const recursingChild = env.opt.directionLTR ? current.child2 : current.child1;
            const tailChild = env.opt.directionLTR ? current.child1 : current.child2;
            const unitDenotation = recursingChild.getOutputs(env);
            results = outputProduct(unitDenotation, results);
            current = tailChild;
        }

        // now we're at the last current, and it's not a ConcatExpr, get its
        // denotation, add it on, and we're done
        const unitDenotation = current.getOutputs(env);
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
        return constructAlternation(env, ...newChildren);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        if (env.random) {
            const childDerivs = this.children.map(c => 
                                    c.deriv(query, env));
            yield* randomCutIter(childDerivs, env.random);
            return;
        }

        const results: Deriv[] = [];
        for (const child of this.children) {
            results.push(...child.deriv(query, env));
        }
        yield* disjoin(results, env);
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        if (env.random) {
            const childForwards = this.children.map(c => 
                c.forward(env));
            yield* randomCutIter(childForwards, env.random);
            return;
        }

        let handled: boolean = false;
        let results: Expr[] = [];
        for (const child of this.children) {
            for (const [cHandled, cNext] of child.forward(env)) {
                handled ||= cHandled;
                results.push(cNext);
            }
        }
        yield [handled, constructAlternation(env, ...results)];
    }
    
    public simplify(env: Env): Expr {
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
            const alt = constructAlternation(env, ...newOutputs);
            newChildren.push(new OutputExpr(alt));
        }

        if (newChildren.length == 0) return NULL;
        if (newChildren.length == 1) return newChildren[0];
        return new UnionExpr(newChildren);
    }

    public getOutputs(env: DerivEnv): StringDict[] {
        return flatten(this.children.map(c => c.getOutputs(env)));
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
    
    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        for (const [handled1, next1] of this.child1.forward(env)) {
            for (const [handled2, next2] of this.child2.forward(env)) {
                const wrapped = constructJoin(env, next1, next2, 
                                    this.tapes1, this.tapes2);
                yield [handled1 || handled2, wrapped];
            }
        }
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        const newChild1 = this.child1.delta(tapeName, env);
        const newChild2 = this.child2.delta(tapeName, env);
        return constructJoin(env, newChild1, newChild2, 
                        this.tapes1, this.tapes2);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (!this.tapes2.has(query.tapeName)) {
            const c1derivs = this.child1.deriv(query, env);
            for (const d1 of disjoin(c1derivs, env)) {
                yield d1.wrap(c => constructJoin(env, c, this.child2, 
                                        this.tapes1, this.tapes2));
            }
            return;
        }
        
        if (!this.tapes1.has(query.tapeName)) {
            const c2derivs = this.child2.deriv(query, env);
            for (const d2 of disjoin(c2derivs, env)) {
                yield d2.wrap(c => constructJoin(env, this.child1, c, 
                                        this.tapes1, this.tapes2));
            }
            return;
        }
        
        const c1derivs = this.child1.deriv(query, env);
        for (const d1 of disjoin(c1derivs, env)) {

            if (d1.result instanceof EpsilonExpr) {
                yield d1.wrap(c => constructJoin(env, c, this.child2, 
                                            this.tapes1, this.tapes2));
                continue;
            }

            const c2derivs = this.child2.deriv(d1.result, env)
            for (const d2 of disjoin(c2derivs, env)) {
                const c1nxt = (d2.result instanceof EpsilonExpr) ? this.child1 : d1.next;
                yield d2.wrap(c => constructJoin(env, c1nxt, c, 
                                            this.tapes1, this.tapes2));
            }
        }
    } 

    public simplify(env: Env): Expr {
        if (this.child1 instanceof NullExpr) return this.child1;
        if (this.child2 instanceof NullExpr) return this.child2;
        if ((this.child1 instanceof EpsilonExpr || this.child1 instanceof OutputExpr) &&
            this.child2 instanceof EpsilonExpr) {
            return this.child1;
        }
        if (this.child1 instanceof EpsilonExpr && this.child2 instanceof OutputExpr) {
            return this.child2;
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
        public symbol: string,
        public child: Expr | undefined = undefined
    ) { 
        super();
    }

    public get id(): string {
        return `\$${this.symbol}`;
    }

    public getChild(env: DerivEnv): Expr {
        if (this.child == undefined) {
            let child = env.getSymbol(this.symbol);
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
        if (env.stack.exceedsMax(this.symbol)) {
            return;
        }

        const newEnv = env.addSymbol(this.symbol);
        let child = this.getChild(env);

        for (const [cHandled, cNext] of child.forward(newEnv)) {
            const wrapped = constructEmbed(env, this.symbol, cNext);
            yield [cHandled, wrapped];
        }
    }

    public delta(
        tapeName: string,
        env: DerivEnv
    ): Expr {
        if (env.stack.exceedsMax(this.symbol)) {
            return NULL;
        }
        const newEnv = env.addSymbol(this.symbol);
        const cNext = this.getChild(env).delta(tapeName, newEnv);
        return constructEmbed(env, this.symbol, cNext);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (env.stack.exceedsMax(this.symbol)) {
            return;
        }

        const newEnv = env.addSymbol(this.symbol);
        let child = this.getChild(env);

        for (const d of child.deriv(query, newEnv)) {
            yield d.wrap(c => constructEmbed(env, this.symbol, c));
        }
    }
    
    public simplify(env: Env): Expr {
        if (this.child === undefined) return this;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        return this;
    }
}

export function constructEmbed(
    env: Env,
    symbol: string, 
    child: Expr | undefined = undefined
): Expr {
    return new EmbedExpr(symbol, child).simplify(env);
}

/**
 * Abstract base class for expressions with only one child state. 
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

    public getOutputs(env: DerivEnv): StringDict[] {
        return this.child.getOutputs(env);
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
        const newEnv = env.setSymbols(this.symbols);
        const newChild = this.child.delta(tapeName, newEnv);
        return constructCollection(env, newChild, this.symbols);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        const newEnv = env.setSymbols(this.symbols);
        for (const d of 
                this.child.deriv(query, newEnv)) {
            yield d.wrap(c => constructCollection(env, c, this.symbols));
        }
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        const newEnv = env.setSymbols(this.symbols);
        for (const [cHandled, cNext] of this.child.forward(newEnv)) {
            const wrapped = constructCollection(env, cNext, this.symbols);
            yield [cHandled, wrapped];
        }
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        return this;
    }
}

export function constructCollection(
    env: Env,
    child: Expr, 
    symbols: Dict<Expr>
): Expr {
    return new CollectionExpr(child, symbols).simplify(env);
}

export class CountExpr extends UnaryExpr {

    constructor(
        child: Expr,
        public tapeName: string,
        public maxChars: number,
        public countEpsilon: boolean,
        public errorOnCountExceeded: boolean,
    ) {
        super(child);
    }

    public get id(): string {
        return `Count_${this.tapeName}:${this.maxChars}(${this.child.id})`;
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        for (const [handled, next] of this.child.forward(env)) {
            const wrapped = constructCount(env, next, this.tapeName, this.maxChars,
                this.countEpsilon, this.errorOnCountExceeded);
            yield [handled, wrapped];
        }
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
        return constructCount(env, newChild, this.tapeName, this.maxChars,
                              this.countEpsilon, this.errorOnCountExceeded);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        for (const d of this.child.deriv(query, env)) {
            
            if (query.tapeName != this.tapeName ||
                    (d.result instanceof EpsilonExpr && !this.countEpsilon)) {
                // not relevant to us, just move on
                yield d.wrap(c => constructCount(env, c, this.tapeName,
                                                 this.maxChars,
                                                 this.countEpsilon,
                                                 this.errorOnCountExceeded));
                continue;
            }

            const length = d.result instanceof EpsilonExpr ? 1 : d.result.text.length;
            if (this.maxChars < length) {
                if (this.errorOnCountExceeded)
                    throw new Error(`Count exceeded on ${this.tapeName}`);
                continue;
            }
            
            const newMax = this.maxChars - length;
            yield d.wrap(c => constructCount(env, c, this.tapeName,
                                             newMax,
                                             this.countEpsilon,
                                             this.errorOnCountExceeded));
        }
    }

    public simplify(env: Env): Expr {
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
        return "(OUT)";
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        return this;
    }

    public *deriv(query: Query, env: DerivEnv): Derivs {
        return;
    }

    public addOutput(env: Env, newOutput: Expr): OutputExpr {
        if (newOutput instanceof TokenExpr && newOutput.text == "") {
            return this;
        }
        if (newOutput instanceof OutputExpr) {
            return this.addOutput(env, newOutput.child);
        }
        const concat = constructConcat(env, this.child, newOutput);
        return new OutputExpr(concat);
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        return this;
    }
}

export class CursorExpr extends UnaryExpr {

    constructor(
        public tape: string,
        child: Expr,
        public vocab: Set<string>,
        public atomic: boolean,
        public output: OutputExpr = new OutputExpr(EPSILON),
        public finished: boolean = false
    ) {
        super(child);
    }

    public get id(): string {
        if (this.finished) {
            return `O_${this.tape}(${this.child.id})`;
        }
        return `T_${this.tape}(${this.child.id})`;
    }

    public delta(tapeName: string, env: DerivEnv): Expr {
        if (tapeName == this.tape) return this; 
                // a tape name "X" is considered to refer to different 
                // tapes inside and outside Cursor("X", child)

        const newEnv = env.setVocab(this.vocab, this.atomic);
        const cNext = this.child.delta(tapeName, newEnv);
        return constructCursor(env, this.tape, cNext, this.vocab, 
                    this.atomic, this.output, this.finished);
    }

    public *deriv(query: Query, env: DerivEnv): Derivs {
        if (query.tapeName == this.tape) return; 
                // a tape name "X" is considered to refer to different 
                // tapes inside and outside Cursor("X", child)

        const newEnv = env.setVocab(this.vocab, this.atomic);
        for (const d of this.child.deriv(query, newEnv)) {
            yield d.wrap(c => constructCursor(env, this.tape, c, 
                    this.vocab, this.atomic, this.output, this.finished));
        }
    }

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {

        if (this.finished) {
            for (const [cHandled, cNext] of this.child.forward(env)) {
                const wrapped = constructCursor(env, this.tape, cNext, 
                                this.vocab, this.atomic, this.output, true);
                yield [cHandled, wrapped];
            }
            return;
        }

        const newEnv = env.setVocab(this.vocab, this.atomic);
        const deltaToken = new TokenExpr(this.tape, '');
        const deltaNext = this.child.delta(this.tape, newEnv);
        const deltaGenerator = iterUnit(new Deriv(deltaToken, deltaNext));
        const derivQuery = constructDot(this.tape);
        const derivResults = disjoin(this.child.deriv(derivQuery, newEnv), env);
        const allResults = randomCutIter([deltaGenerator, derivResults], env.random);

        for (const d of allResults) {
            env.incrStates();
            const newOutput = this.output.addOutput(env, d.result);
            env.logDeriv(d.result, d.next);
            env.indentLog(1);
            for (const [_, nNext] of d.next.forward(env)) {
                const finished = (d.result instanceof TokenExpr && d.result.text == "");
                const wrapped = constructCursor(env, this.tape, nNext, 
                                this.vocab, this.atomic, newOutput, finished);
                yield [true, wrapped];
            }
            env.indentLog(-1);
        }
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof OutputExpr) {
            return this.child.addOutput(env, this.output);
        }
        if (this.child instanceof EpsilonExpr) return this.output;
        if (this.child instanceof NullExpr) return this.child;
        return this;
    }

    public getOutputs(env: DerivEnv): StringDict[] {
        const myOutput = this.output.getOutputs(env);
        const childOutput = this.child.getOutputs(env);
        return outputProduct(myOutput, childOutput);
    }

}

export function constructCursor(
    env: Env,
    tape: string, 
    child: Expr, 
    vocab: Set<string>,
    atomic: boolean,
    output?: OutputExpr,
    finished: boolean = false
): Expr {
    return new CursorExpr(tape, child, vocab, 
                atomic, output, finished).simplify(env);
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
        if (tapeName == this.tape1) {
            throw new Error(`something's gone wrong, querying on ` +
                `a PreTapeExpr tape1 ${this.tape1}`);
        }

        if (tapeName == this.tape2) {
            const t1next = this.child.delta(this.tape1, env);
            const t2next = t1next.delta(this.tape2, env);
            return constructPreTape(env, this.tape1, this.tape2, t2next, this.output);
        }

        const cNext = this.child.delta(tapeName, env);
        return constructPreTape(env, this.tape1, this.tape2, cNext, this.output);
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
            
            for (const d1 of this.child.deriv(t1query, env)) {
                if (d1.next instanceof NullExpr) {
                    continue;
                }
                env.incrStates();
                env.logDeriv(d1.result, d1.next);
                if (d1.result instanceof EpsilonExpr) {
                    // if we didn't go anywhere on tape1, don't query on
                    // tape2, just treat it as going nowhere on tape2
                    const t2result = d1.result.rename(this.tape2);
                    const wrapped = constructPreTape(env, this.tape1, this.tape2, 
                                                        d1.next, this.output);
                    yield new Deriv(t2result, wrapped);
                    continue;
                }
                env.indentLog(1);
                const newOutput = this.output.addOutput(env, d1.result);
                for (const d2 of d1.next.deriv(query, env)) {
                    env.logDeriv(d2.result, d2.next);
                    yield d2.wrap(c => constructPreTape(env, this.tape1, this.tape2, 
                                                        c, newOutput));
                }
                env.indentLog(-1);
            }
            return;
        }

        for (const d of this.child.deriv(query, env)) {
            yield d.wrap(c => constructPreTape(env, this.tape1, this.tape2, c, this.output));
        }

    }

    public simplify(env: Env): Expr {
        if (this.child instanceof EpsilonExpr) return this.output;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        return this;
    }
}

export function constructPreTape(
    env: Env,
    fromTape: string, 
    toTape: string, 
    child: Expr,
    output?: OutputExpr,
): Expr {
    return new PreTapeExpr(fromTape, toTape, child, output).simplify(env);
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
        return constructShort(env, cNext);
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
        const cDerivs = this.child.deriv(query, env);
        for (const d of disjoin(cDerivs, env, true)) {
            
            const cNextDelta = d.next.delta(query.tapeName, env);
            if (!(cNextDelta instanceof NullExpr)) {
                yield d.wrap(_ => cNextDelta);
                continue;
            }
            
            yield d.wrap(c => constructShort(env, c));
        }
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof OutputExpr) return this.child;
        return this;
    }
}

export function constructShort(
    env: Env, 
    child: Expr
): Expr {
    return new ShortExpr(child).simplify(env);
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
        return constructStar(env, newChild);
    }

    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        const oneLess = constructStar(env, this.child);
        const deltaNext = this.child.delta(query.tapeName, env);
        const oneLessDelta = constructStar(env, deltaNext);
        for (const d of this.child.deriv(query, env)) {
            yield d.wrap(c => constructPrecede(env, oneLessDelta, 
                            constructPrecede(env, c, oneLess)));
        }
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof DotExpr) return new DotStarExpr(this.child.tapeName);
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return EPSILON;
        return this;
    }

}

export function constructStar(env: Env, child: Expr): Expr {
    return new StarExpr(child).simplify(env);
}

/**
 * Creates A{min,max} from A.
 */
export function constructRepeat(
    env: Env,
    child: Expr, 
    minReps: number = 0, 
    maxReps: number = Infinity
): Expr {
    if (minReps > maxReps) {
        return NULL;
    }
    if (maxReps == 0) {
        return EPSILON;
    }
    if (child instanceof DotExpr && minReps <= 0 && maxReps == Infinity) {
        return new DotStarExpr(child.tapeName);
    }
    if (minReps == 0 && maxReps == Infinity) {
        return constructStar(env, child);
    }
    if (maxReps == Infinity) {
        const firstPart = constructRepeat(env, child, minReps, minReps);
        const secondPart = constructStar(env, child);
        return constructPrecede(env, firstPart, secondPart);
    }

    // maxReps is non-zero finite
    const firstPart = child;
    const secondPart = constructRepeat(env, child, minReps-1, maxReps-1);
    const result = constructPrecede(env, firstPart, secondPart);
    if (minReps > 0) return result;
    return constructAlternation(env, EPSILON, result);
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

    public *forward(env: DerivEnv): Gen<[boolean, Expr]> {
        const newEnv = env.renameTape(this.toTape, this.fromTape);
        for (const [cHandled, cNext] of this.child.forward(newEnv)) {
            const wrapped = constructRename(env, cNext, this.fromTape, this.toTape);
            yield [cHandled, wrapped];
        }
    }

    public getOutputs(env: DerivEnv): StringDict[] {
        const results: StringDict[] = [];
        for (const output of this.child.getOutputs(env)) {
            const newOutput: StringDict = {};
            for (const [k, v] of Object.entries(output)) {
                const newTape = (k == this.fromTape) ? this.toTape : k;
                newOutput[newTape] = v;
            }
            results.push(newOutput);
        }
        return results;
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
        return constructRename(env, newChild, this.fromTape, this.toTape);
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
        for (const d of this.child.deriv(newQuery, newEnv)) {
            const unRenamedResult = d.result.rename(query.tapeName);
            const wrapped = constructRename(env, d.next, this.fromTape, this.toTape);
            yield new Deriv(unRenamedResult, wrapped);
        }
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof OutputExpr) {
            const wrapped = constructRename(env, this.child.child, this.fromTape, this.toTape);
            return new OutputExpr(wrapped);
        }
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        if (this.child instanceof LiteralExpr && this.child.tapeName == this.fromTape) {
            return constructLiteral(env, this.toTape, this.child.text, this.child.tokens, this.child.index);
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
        const remainingTapes = difference(this.tapes, new Set([tapeName]));
        if (cNext instanceof NullExpr) return constructNegation(env, cNext, remainingTapes);
        if (remainingTapes.size == 0) return NULL;
        return constructNegation(env, cNext, remainingTapes);
    }
    
    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {

        if (!this.tapes.has(query.tapeName)) {
            return;
        }

        let results: Deriv[] = [];
        let remainder: Set<string> = new Set(query.expandStrings(env));

        const cDerivs = this.child.deriv(query, env);
        for (const d of disjoin(cDerivs, env, true)) {
            if (!(d.result instanceof EpsilonExpr)) {
                remainder.delete(d.result.text);  
            }
            const wrapped = d.wrap(c => constructNegation(env, c, this.tapes));
            results.push(wrapped);
        }

        // any chars not yet consumed by the above represent
        // cases where we've (in FSA terms) "fallen off" the graph,
        // and are now at a special consume-anything expression that always
        // succeeds.
        for (const char of remainder) {
            const token = constructToken(query.tapeName, char);
            const universe = constructUniverse(env, this.tapes);
            const remainderDeriv = new Deriv(token, universe);
            results.push(remainderDeriv);
        }

        yield* randomCut(results, env.random);
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof NullExpr) return constructUniverse(env, this.tapes);
        if (this.child instanceof NegationExpr) return this.child.child;
        if (this.child instanceof DotStarExpr) return NULL;
        return this;
    }
}

export class CorrespondExpr extends UnaryExpr {

    constructor(
        public child: Expr,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }   
    
    public get id(): string {
        // return this.child.id;
        return `NCor_${this.fromTape}>${this.toTape}(${this.child.id})`;
    }

    
    public delta(tapeName: string, env: DerivEnv): Expr {
        if (tapeName == this.fromTape) {
            // if we can delta on the fromTape, we're done being a Correspond
            return this.child.delta(tapeName, env);
        }

        if (tapeName == this.toTape) {
            // we can't delta out on the toTape, the only escape
            // is deltaing out on the fromTape
            return NULL;
        }
        
        return this; // it's neither tape we care about
    }

    public *deriv(query: Query, env: DerivEnv): Derivs {

        if (query.tapeName == this.fromTape) {
            for (const d of this.child.deriv(query, env)) {
                yield d.wrap(c => constructCorrespond(env, c, 
                        this.fromTape, this.toTape));
            }
            return;
        }

        if (query.tapeName == this.toTape) {
            for (const d of this.child.deriv(query, env)) {
                yield d.wrap(c => constructCorrespond(env, c, 
                                            this.fromTape,
                                            this.toTape));
            }

            // toTape is special, if it's nullable but has emitted fewer tokens than
            // fromTape has, it can emit an epsilon
            const cNext = this.child.delta(query.tapeName, env);
            if (!(cNext instanceof NullExpr)) {
                const wrapped = constructCorrespond(env, cNext, 
                    this.fromTape, this.toTape);
                yield new Deriv(EPSILON, wrapped);
            }
            return;
        }

        // if it's neither tape, nothing can happen here
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof NullExpr) return this.child;
        return this;
    }

}

export function constructCorrespond(
    env: Env,
    child: Expr,
    fromTape: string = INPUT_TAPE,
    toTape: string = OUTPUT_TAPE
): Expr {
    return new CorrespondExpr(child, fromTape, toTape).simplify(env);
}

export class MatchExpr extends UnaryExpr {

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
            return constructMatch(env, cNext, this.fromTape, this.toTape);  
        }
        const cNext = this.child.delta(tapeName, env);
        return constructMatch(env, cNext, this.fromTape, this.toTape);
    }
    
    public *deriv(
        query: Query,
        env: DerivEnv
    ): Derivs {
        
        // if it's a tape that isn't our to/from, just forward and wrap 
        if (query.tapeName != this.fromTape && query.tapeName != this.toTape) {
            for (const d of this.child.deriv(query, env)) {
                yield d.wrap(c => constructMatch(env, c, this.fromTape, this.toTape));
            }
            return;
        }

        // tapeName is either our toTape or fromTape.  The only differences
        // between these two cases is (a) we buffer the literal on the opposite
        // tape, that's what oppositeTape is below and (b) when tapeName is our
        // toTape, we have to act like a toTape->fromTape rename.  

        const oppositeTapeName = (query.tapeName == this.fromTape) ? this.toTape : this.fromTape;
        //const oppositeTape = env.getTape(oppositeTapeName);

        // We ask for a namespace rename either way; when tapeName == fromTape,
        // this is just a no-op
        const newEnv = env.renameTape(query.tapeName, this.fromTape); 
        const fromQuery = query.rename(this.fromTape);

        for (const d of 
                this.child.deriv(fromQuery, newEnv)) {
            const wrapped = constructMatch(env, d.next, this.fromTape, this.toTape);
            if (d.result instanceof EpsilonExpr) {
                env.logDebug("========= EpsilonToken ==========");
                yield d;
                continue;
            }

            for (const c of d.result.expandStrings(env)) {
                //if (!oppositeTape.vocab.has(c)) continue;
                
                const lit = constructToken(oppositeTapeName, c);
                const next = constructPrecede(env, lit, wrapped);
                const token = constructToken(query.tapeName, c);
                yield new Deriv(token, next);
            }
        }
    }

    public simplify(env: Env): Expr {
        if (this.child instanceof EpsilonExpr) return this.child;
        if (this.child instanceof NullExpr) return this.child;
        return this;
    }

}

export function constructMatch(
    env: Env,
    child: Expr,
    fromTape: string = INPUT_TAPE,
    toTape: string = OUTPUT_TAPE
): Expr {
    return new MatchExpr(child, fromTape, toTape).simplify(env);
}

/* CONVENIENCE FUNCTIONS */
export const EPSILON = new EpsilonExpr();
export const NULL = new NullExpr();

export function constructLiteral(
    env: Env,
    tape: string, 
    text: string,
    tokens: string[],
    index?: number
): Expr {
    if (env.opt.directionLTR) {
        return new LiteralExpr(tape, text, tokens, index).simplify(env);
    }
    return new RTLLiteralExpr(tape, text, tokens, index).simplify(env);
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
export function constructPrecede(
    env: Env, 
    firstChild: Expr, 
    secondChild: Expr
): Expr {
    if (env.opt.directionLTR) {
        return constructConcat(env, firstChild, secondChild);
    }
    return constructConcat(env, secondChild, firstChild);

}

export function constructConcat(
    env: Env, 
    c1: Expr, 
    c2: Expr
): Expr {
    return new ConcatExpr(c1, c2).simplify(env);
}

export function constructSequence(
    env: Env,
    ...children: Expr[]
): Expr {
    if (children.length == 0) return EPSILON;
    
    const folder = (c1:Expr,c2:Expr) => constructConcat(env, c1, c2);
    if (env.opt.directionLTR) {
        return foldRight(children, folder, EPSILON);
    } else {
        return foldLeft(children, folder, EPSILON);
    }
}

export function constructAlternation(
    env: Env,
    ...children: Expr[]
): Expr {
    return new UnionExpr(children).simplify(env);
}

export function constructCount(
    env: Env,
    child: Expr, 
    tapeName: string, 
    maxChars: number,
    countEpsilon: boolean,
    errorOnCountExceeded: boolean
): Expr {
    return new CountExpr(child, tapeName, maxChars,
                         countEpsilon, errorOnCountExceeded).simplify(env);
}

export function constructNegation(
    env: Env,
    child: Expr, 
    tapes: Set<string>,
): Expr {
    return new NegationExpr(child, tapes).simplify(env);
}

export function constructDotStar(tape: string): Expr {
    return new DotStarExpr(tape);
}

export function constructUniverse(
    env: Env,
    tapes: Set<string>, 
): Expr {
    return constructSequence(env, ...[...tapes]
                .map(t => constructDotStar(t)));
}

export function constructRename(
    env: Env,
    child: Expr, 
    fromTape: string, 
    toTape: string
): Expr {
    return new RenameExpr(child, fromTape, toTape).simplify(env);
}

export function constructJoin(
    env: Env,
    c1: Expr, 
    c2: Expr, 
    tapes1: Set<string>, 
    tapes2: Set<string>
): Expr {
    return new JoinExpr(c1, c2, tapes1, tapes2).simplify(env);
}

export function constructToken(
    tapeName: string,
    text: string
): TokenExpr {
    return new TokenExpr(tapeName, text);
}