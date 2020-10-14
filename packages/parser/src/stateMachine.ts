import { Gen, StringDict } from "./util";
import { MultiTapeOutput, Tape, StringTape, RenamedTape, TapeCollection, Token, ANY_CHAR, NO_CHAR } from "./tapes";
import { assert } from "chai";

/**
 * This is the parsing engine that underlies Gramble.
 * It executes a multi-tape recursive state machine.
 * 
 *      - "Multi-tape" means that there are multiple "tapes"
 *      (in the Turing machine sense) from/to which the machine
 *      can read/write.  Finite-state acceptors are one-tape automata,
 *      they read in from one tape and either succeed or fail.  Finite-
 *      state transducers are two-tape automata, reading from one and
 *      writing to another.  This system allows any number of tapes.
 * 
 *      - "Recursive" means that states can themselves contain states,
 *      meaning that the machine can parse context-free languages rather
 *      than just regular languages.  (Recursive and push-down automata
 *      are equivalent, but I hesitate to call this "push-down" because 
 *      states/transitions don't perform any operations to the stack.)
 *      
 * The execution of this particular state machine is lazy, 
 * in the sense that we don't necessarily construct the entire machine.
 * Each state constructs successor states as necessary.
 */

export type SymbolTable = {[key: string]: State};

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

class CounterStack {

    constructor(
        public max: number = 4
    ) { }

    public stack: {[key: string]: number} = {};

    public add(key: string) {
        const result = new CounterStack(this.max);
        result.stack[key] = 0;
        Object.assign(result.stack, this.stack);
        result.stack[key] += 1;
        return result;
    }

    public get(key: string): number {
        return (key in this.stack) ? this.stack[key] : 0;
    }

    public exceedsMax(key: string): boolean {
        return this.get(key) >= this.max;
    }

    public toString(): string {
        return JSON.stringify(this.stack);
    }
}

/**
 * State
 * 
 * State is the basic class of the parser.  It encapsulate the current state of the parse; you can think
 * of it like a pointer into the state graph, if we were to ever construct that graph, which we don't.
 * Rather, a State encapsulates the *information* that that node would have represented.  
 * 
 * For example, imagine an automaton that recognizes the literal "hello".  We could implement this as an
 * explicit graph of nodes, where each node leads to the next by consuming a particular letter (state 0 leads
 * to 1 by consuming "h", state 1 leads to 2 by consuming "e", etc.).  Our pointer into this graph 
 * basically represents two pieces of information, what the word is ("hello") and 
 * how far into it we are.  We could also represent this information as an object { text: string, index: number }.
 * Rather than pre-compute each of these nodes, we can say that this object returns (upon matching) another 
 * object {text: string, index: number+1}... until we exceed the length of the literal, of course.  This 
 * idea, in general, allows us to avoid creating explicit state graphs that can be exponentially huge, 
 * although it comes with its own pitfalls.
 * 
 * For our purposes, a State is anything that can, upon being queried with a [tape, char] pair, 
 * return the possible successor states it can get to.  
 * 
 * Many kinds of States have to contain references to other states (like an 
 * [EmbedState], which lets us embed grammars inside other grammars, keeps a point to the current parse state inside
 * that embedded grammar).  The structure of State components ends up being roughly isomorphic to the grammar that it's
 * parsing (e.g. if the grammar is (A+(B|C)), then the start State that we begin in will have the same structure,
 * it'll be a [ConcatState] of (A and a [UnionState] of (B and C)).  Then as the parse goes on, the State will
 * simplify bit-by-bit, like once A is recognized, the current state will just be one corresponding to B|C, and 
 * if B fails, the current state will just be C.
 * 
 * For the purposes of the algorithm, there are three crucial functions of States:
 * 
 *  * ndQuery(tape, char): What states can this state get to, compatible with a given tape/character
 *  * dQuery(tape, char): Calls ndQuery and rearranges the outputs so that any specific character can 
 *                      only lead to one state.
 *  * accepting(): Whether this state is a final state, meaning it consistutes a complete parse
 */

export abstract class State {

    /**
     * Gets an id() for the state.  At the moment we're only using this
     * for debugging purposes, but we may want to use it in the future
     * as a unique identifier for a state in explicit graph construction.
     * 
     * If we do this, we should go through and make sure that IDs are actually
     * unique; right now they're often not.
     */
    public abstract get id(): string;
    
    /**
     * accepting 
     * 
     * Whether the state is accepting (i.e. indicates that we have achieved a complete parse).  (What is typically rendered as a "double circle"
     * in a state machine.) Note that, since this is a recursive state machine, getting to an accepting state doesn't necessarily
     * mean that the *entire* grammar has completed; we might just be in a subgrammar.  In this case, accepting() isn't the signal that we
     * can stop parsing, just that we've reached a complete parse within the subgrammar.  For example, [ConcatState] checks whether its left
     * child is accepting() to determine whether to move on and start parsing its right child.
     * 
     * @param symbolStack A [CounterStack] that keeps track of symbols, used for preventing infinite recursion.
     * @returns true if the state is an accepting state (i.e., constitutes a complete parse) 
     */
    public accepting(symbolStack: CounterStack): boolean {
        return false;
    }

    /**
     * non-deterministic Query
     * 
     * The workhorse function of the parser, taking a <tape, char> pair and trying to match it to a transition
     * (e.g., matching it to the next character of a [LiteralState]).  It yields all matching <tape, char> pairs, and the respective
     * nextStates to which we should move upon a successful transition.
     * 
     * Note that an ndQuery's results may "overlap" in the sense that you may get the same matched character
     * twice (e.g., you might get two results "q", or a result "q" and a result "__ANY__" that includes "q").
     * For some parts of the algorithm, this would be inappropriate (i.e., inside of a negation).  So rather
     * than call ndQuery directly, call dQuery (detreministic Query), which calls ndQuery and then adjusts
     * the results so that the results are disjoint.
     * 
     * @param tape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */

    public abstract ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]>;


    /** 
     * deterministic Query
     * 
     * Queries the state so that the results are deterministic (or more accurately, so that all returned 
     * transitions are disjoint).  (There can still be multiple results; when we query ANY:ANY, for example.)
     * 
     * This looks a bit complicated (and it kind of is) but what it's doing is handing off the query to
     * ndQuery, then combining results so that there's no overlap between the tokens.  For example, say ndQuery yields
     * two tokens X and Y, and they have no intersection.  Then we're good, we just yield those.  But if they 
     * do have an intersection, we need to return three paths:
     * 
     *    X&Y (leading to the UnionState of the states X and Y would have led to)
     *    X-Y (leading to the state X would have led to)
     *    Y-X (leading to the state Y would have led to)
     * 
     * @param tape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */ 

    public *dQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        var results: [Tape, Token, boolean, State][] = [];
        var nextStates = [... this.ndQuery(tape, target, symbolStack)];
        for (var [tape, bits, matched, next] of nextStates) {

            if (tape.numTapes == 0) {
                results.push([tape, bits, matched, next]);
                continue;
            }

            var newResults: [Tape, Token, boolean, State][] = [];
            for (var [otherTape, otherBits, otherMatched, otherNext] of results) {
                if (tape.tapeName != otherTape.tapeName) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                    continue;
                }

                const intersection = bits.and(otherBits);
                if (!intersection.isEmpty()) {
                    const union = new UnionState(next, otherNext);
                    newResults.push([tape, intersection, matched || otherMatched, union]); 
                }
                bits = bits.andNot(intersection)
                otherBits = otherBits.andNot(intersection);
                if (!otherBits.isEmpty()) {
                    newResults.push([otherTape, otherBits, otherMatched, otherNext]);
                }
            }
            results = newResults;
            if (!bits.isEmpty()) {
                results.push([tape, bits, matched, next]);
            }
        }
        yield *results;

    }

    /**
     * Performs a breadth-first traversal of the graph.  This will be the function that most 
     * clients will be calling.
     * 
     * Note that there's no corresponding "parse" function, only "generate".  To do parses, we
     * join the grammar with a grammar corresponding to the query.  E.g., if we wanted to parse
     * { text: "foo" } in grammar X, we would construct JoinState(LiteralState("text", "foo"), X).
     * The reason for this is that it allows us a diverse collection of query types for free, by
     * choosing an appropriate "query grammar" to join X with.
     * 
     * @param [maxRecursion] The maximum number of times the grammar can recurse; for infinite recursion pass Infinity.
     * @param [maxChars] The maximum number of steps any one traversal can take (usually == the total number of characters
     *                    output to all tapes)
     * @returns a generator of { tape: string } dictionaries, one for each successful traversal. 
     */
    public *generate(maxRecursion: number = 4, maxChars: number = 1000): Gen<StringDict> {
        const allTapes = new TapeCollection();
        this.collectVocab(allTapes, []);
        const initialOutput: MultiTapeOutput = new MultiTapeOutput();
        var stateQueue: [MultiTapeOutput, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);
        var chars = 0;

        while (stateQueue.length > 0 && chars < maxChars) {
            var nextQueue: [MultiTapeOutput, State][] = [];
            for (var i = 0; i < stateQueue.length; i++) {

                const [prevOutput, prevState] = stateQueue[i];

                if (prevState.accepting(symbolStack)) {
                    yield* prevOutput.toStrings();
                }

                for (const [tape, c, matched, newState] of 
                            prevState.dQuery(allTapes, ANY_CHAR, symbolStack)) {
                    if (!matched) {
                        console.log("Warning, got all the way through without a match");
                        continue;
                    }
                    const nextOutput = prevOutput.add(tape, c);
                    nextQueue.push([nextOutput, newState]);
                }
            }
            stateQueue = nextQueue;
            chars++;
        }
    }

    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     * 
     * @param tapes A TapeCollection for holding found characters
     * @param stateStack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab 
     */
    public collectVocab(tapes: Tape, stateStack: String[]): void { }
}

/**
 * Abstract base class for both LiteralState and AnyCharState,
 * since they share the same query algorithm template.
 * 
 * In order to implement TextState, a descendant class must implement
 * firstToken() (giving the first token that needs to be matched) and
 * successor() (returning the state to which we would translate upon successful
 * matching of the token).
 */
abstract class TextState extends State {

    constructor(
        public tapeName: string
    ) {
        super();
    }

    protected abstract firstToken(tape: Tape): Token;
    protected abstract successor(): State;

    public *ndQuery(tape: Tape, 
                    target: Token,
                    symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            yield [tape, target, false, this];
            return;
        }
        
        if (this.accepting(symbolStack)) {
            return; 
        }

        const bits = this.firstToken(matchedTape);
        const result = matchedTape.match(bits, target);
        const nextState = this.successor();
        yield [matchedTape, result, true, nextState];

    }

}

/**
 * The state that recognizes/emits any character on a specific tape; 
 * implements the "dot" in regular expressions.
 */
export class AnyCharState extends TextState {

    public get id(): string {
        return `${this.tapeName}:(ANY)`;
    }
    

    protected firstToken(tape: Tape): Token {
        return tape.any();
    }

    protected successor(): State {
        return new TrivialState();
    }
}

/**
 * Recognizese/emits a literal string on a particular tape.  
 * Inside, it's just a string like "foo"; upon successfully 
 * matching "f" we construct a successor state looking for 
 * "oo", and so on.
 */
export class LiteralState extends TextState {

    constructor(
        tape: string,
        public text: string,
        protected tokens: Token[] = []
    ) { 
        super(tape);
    }

    public get id(): string {
        return `${this.tapeName}:${this.text}`;
    }

    public accepting(symbolStack: CounterStack): boolean {
        return this.tokens.length == 0;
    }

    public collectVocab(tapes: Tape, stateStack: String[]): void {
        this.tokens = tapes.tokenize(this.tapeName, this.text);
    }

    protected firstToken(tape: Tape): Token {
        return this.tokens[0];
    }

    protected successor(): State {
        const newTokens = this.tokens.slice(1);
        const newText = newTokens.join("");
        return new LiteralState(this.tapeName, newText, newTokens);
    }

}

/**
 * Recognizes the empty grammar.  This is occassionally 
 * useful in implementing other states (e.g. when
 * you need a state that's accepting but won't go anywhere).
 */
export class TrivialState extends State {

    constructor() { 
        super();
    }

    public get id(): string {
        return "0";
    }

    public accepting(symbolStack: CounterStack): boolean {
        return true;
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> { }
}

/**
 * The abstract base class of all States with two state children 
 * (e.g. [JoinState], [ConcatState], [UnionState]).
 * States that conceptually might have infinite children (like Union) 
 * we treat as right-recursive binary (see for
 * example the helper function [Uni] which converts lists of
 * states into right-braching UnionStates).
 */
abstract class BinaryState extends State {

    constructor(
        public child1: State,
        public child2: State
    ) {
        super();
    }
    
    public collectVocab(tapes: Tape, stateStack: String[]): void {
        this.child1.collectVocab(tapes, stateStack);
        this.child2.collectVocab(tapes, stateStack);
    }


    public get id(): string {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }

    public accepting(symbolStack: CounterStack): boolean {
        return this.child1.accepting(symbolStack) && this.child2.accepting(symbolStack);
    }
}

/**
 * ConcatState represents the current state in a concatenation A+B of two grammars.  It
 * is a [BinaryState], meaning it has two children; sequences ABCDEF are constructed as
 * A+(B+(C+(D+(E+F)))).
 * 
 * The one thing that makes ConcatState a bit tricky is that they're the only part of the grammar
 * where there is a precedence order, which in a naive implementation can lead to a deadlock situation.
 * For example, if we have ConcatState(LiteralState("A","a"), LiteralState("B","b")), then the material
 * on tape A needs to be emitted/matched before the material on tape B.  But then consider the opposite,
 * ConcatState(LiteralState("B","b"), LiteralState("A","a")).  That grammar describes the same database,
 * but looks for the material in opposite tape order.  If we join these two, the first is emitting on A and
 * waiting for a match, but the second can't match it because it'll only get there later.  There are several
 * possible solutions for this, but the simplest by far is to implement ConcatState so that it can always emit/match
 * on any tape that any of its children refer to.  Basically, it goes through its children, and if child1
 * returns but doesn't match (meaning it doesn't care about tape T), it asks child2.  Then it returns the 
 * appropriate ConcatState consisting of the unmatched material.
 */
export class ConcatState extends BinaryState {

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        // We can yield from child2 if child1 is accepting, OR if child1 doesn't care about the requested tape,
        // but if child1 is accepting AND doesn't care about the requested tape, we don't want to yield twice;
        // that leads to duplicate results.  yieldedAlready is how we keep track of that.
        var yieldedAlready = false;

        for (const [c1tape, c1text, c1matched, c1next] of this.child1.dQuery(tape, target, symbolStack)) {

            if (c1matched) {         
                yield [c1tape, c1text, c1matched, new ConcatState(c1next, this.child2)];
                continue;
            }
   
            // child1 not interested in the requested tape, the first character on the tape must be
            // (if it exists at all) in child2.
            for (const [c2tape, c2text, c2matched, c2next] of this.child2.dQuery(tape, target, symbolStack)) {
                yield [c2tape, c2text, c2matched, new ConcatState(this.child1, c2next)];
                yieldedAlready = true;
            }
        }

        if (!yieldedAlready && this.child1.accepting(symbolStack)) { 
            yield* this.child2.dQuery(tape, target, symbolStack);
        }  
    }
}

/**
 * UnionStates are very simple, they just have a left child and a right child,
 * and upon querying they yield from the first and then yield from the second.
 * 
 * So note that UnionStates are only around initally; they don't construct 
 * successor UnionStates, their successors are just the successors of their children.
 */
export class UnionState extends BinaryState {

    public accepting(symbolStack: CounterStack): boolean {
        return this.child1.accepting(symbolStack) || this.child2.accepting(symbolStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        yield* this.child1.dQuery(tape, target, symbolStack);
        yield* this.child2.dQuery(tape, target, symbolStack);
    }
} 

/**
 * SemijoinState
 * 
 * This implements the left semijoin.  The full join is the priority union of the left and right
 * semijoins.

export class SemijoinState extends BinaryState {

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        for (const [c1tape, c1target, c1matched, c1next] of this.child1.dQuery(tape, target, symbolStack, vocab)) {

            if (c1tape == NO_TAPE) {
                yield [c1tape, c1target, c1matched, Join(c1next, this.child2)];
                continue;
            }
            
            for (const [c2tape, c2target, c2matched, c2next] of this.child2.dQuery(c1tape, c1target, symbolStack, vocab)) {
                yield [c2tape, c2target, c1matched || c2matched, Join(c1next, c2next)];
            }
        } 
    }

}

 */

/**
 * Convenience function that takes two generators, and yields from the
 * second only if it can't yield from the first.  This is handy in situations
 * like the implementation of join, where if we yielded from both we would
 * constantly be yielding the same states.
 */
function *iterPriorityUnion<T>(iter1: Gen<T>, iter2: Gen<T>): Gen<T> {

    var yieldedAlready = false;
    for (const output of iter1) {
        yield output;
        yieldedAlready = true;
    }

    if (!yieldedAlready) {   
        yield* iter2;
    }
}

/**
 * The JoinState implements the natural join (in the relational algebra sense)
 * for two automata. This is a fundamental operation in the parser, as we implement
 * parsing as a traversal of a corresponding join state.  You can think of join(X,Y)
 * as yielding from the intersection of X and Y on tapes that they share, and the product
 * on tapes that they don't share.
 * 
 * The algorithm is simplified by the fact that join(X, Y) can be implemented the union
 * of the left and right semijoins (or, put another way, the left semijoin of (X,Y) and 
 * the left semijoin of (Y,X)).  The left semijoin (X,Y) just consists of querying X, then 
 * taking the result of that and querying Y, and yielding the result of that.
 * 
 * Because the ordinary union of these would lead to the same states twice, we use the
 * priority union instead.
 */
export class JoinState extends BinaryState {

    public *ndQueryLeft(tape: Tape,
                          target: Token,
                          c1: State,
                          c2: State,
                          symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {
                              
        for (const [c1tape, c1target, c1matched, c1next] of c1.dQuery(tape, target, symbolStack)) {

            if (c1tape.tapeName == "__NO_TAPE__") { 
                // c1 contained a ProjectionState that hides the original tape; move on without
                // asking c2 to match anything.
                yield [c1tape, c1target, c1matched, new JoinState(c1next, c2)];
                continue;
            }
            
            for (const [c2tape, c2target, c2matched, c2next] of c2.dQuery(c1tape, c1target, symbolStack)) {
                yield [c2tape, c2target, c1matched || c2matched, new JoinState(c1next, c2next)];
            }
        } 
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        const leftJoin = this.ndQueryLeft(tape, target, this.child1, this.child2, symbolStack);
        const rightJoin = this.ndQueryLeft(tape, target, this.child2, this.child1, symbolStack);
        yield* iterPriorityUnion(leftJoin, rightJoin);
    }

} 

/**
 * Abstract base class for states with only one child state.  Typically, UnaryStates
 * handle queries by forwarding on the query to their child, and doing something special
 * before or after.  For example, [EmbedStates] do a check a stack of symbol names to see
 * whether they've passed the allowable recursion limit, and [RenameState]s change what
 * the different tapes are named.
 * 
 * Note that [UnaryState.child] is a getter, rather than storing an actual child.  This is
 * because [EmbedState] doesn't actually store its child, it grabs it from a symbol table instead.
 * (If it tried to take it as a param, or construct it during its own construction, this wouldn't 
 * work, because the EmbedState's child can be that EmbedState itself.)
 */
abstract class UnaryState extends State {

    public abstract get child(): State;

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }
    
    public collectVocab(tapes: Tape, stateStack: String[]): void {
        this.child.collectVocab(tapes, stateStack);
    }



    public accepting(symbolStack: CounterStack): boolean {
        return this.child.accepting(symbolStack);
    }
}


/**
 * RepetitionState implements the Kleene star, plus, question mark, and in general
 * repetitions between N and M times.  (E.g. x{2,3} matching x two or three times.)
 * 
 * The slightly odd part of implementing RepetitionState, compared to other states, is that only
 * RepetitionState needs to remember the initial state of its child.  That is, all the
 * other UnaryStates only keep track of the current state of the child parse.  RepetitionState,
 * however, needs to be able to *restart* the child.  To do that, it
 * keeps around the original child state, so that it can construct its appropriate successor
 * when the current child state is finished.
 * 
 * Note that the below algorithm is fairly similar to [ConcatState]; in the future
 * we might want to partially unify these the way we did [LiteralState] and [AnyCharState].
 */
export class RepetitionState extends UnaryState {

    constructor(
        public child: State,
        public minRepetitions: number = 0,
        public maxRepetitions: number = Infinity,
        public index: number = 0,
        public initialChild: State,
    ) { 
        super();
    }
    
    public collectVocab(tapes: Tape, stateStack: String[]): void {
        this.initialChild.collectVocab(tapes, stateStack);
    }


    public accepting(symbolStack: CounterStack): boolean {
        return this.index >= this.minRepetitions && 
            this.index <= this.maxRepetitions && 
            this.child.accepting(symbolStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (this.index > this.maxRepetitions) {
            return;
        }
        

        var yieldedAlready = false;

        if (this.child.accepting(symbolStack)) {
            // we just started, or the child is accepting, so our successor increases its index
            // and starts again with child.
            const successor = new RepetitionState(this.initialChild, 
                        this.minRepetitions, this.maxRepetitions, this.index+1, this.initialChild);
            for (const result of successor.dQuery(tape, target, symbolStack)) {
                yield result;
                yieldedAlready = true;
            }
        }

        if (yieldedAlready) {
            return;
        }

        for (const [childTape, childText, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack)) {
            if (!childMatched) { // child doesn't care, neither do we
                yield [childTape, childText, false, this];
                continue;
            }

            yield [childTape, childText, childMatched, new RepetitionState(childNext, 
                this.minRepetitions, this.maxRepetitions, this.index, this.initialChild)];
        }

    }
}

/**
 * The parser that handles arbitrary subgrammars referred to by a symbol name; this is what makes
 * recursion possible.
 * 
 * Like most such implementations, EmbedState's machinery serves to delay the construction of a child
 * state, since this child may be the EmbedState itself, or refer to this EmbedState by indirect recursion.
 * So instead of having a child at the start, it just has a symbol name and a reference to a symbol table.
 * 
 * The successor states of the EmbedState may have an explicit child, though: the successors of that initial
 * child state.  (If we got the child from the symbol table every time, we'd just end up trying to match its 
 * first letter again and again.)  We keep track of that through the _child member, which is initially undefined
 * but which we specify when constructing EmbedState's successor.
 */
export class EmbedState extends UnaryState {

    constructor(
        public symbolName: string,
        public symbolTable: SymbolTable,
        public _child: State | undefined = undefined
    ) { 
        super();
    }
    
    public get id(): string {
        return `${this.constructor.name}(${this.symbolName})`;
    }
    
    public collectVocab(tapes: Tape, stateStack: String[]): void {
        if (stateStack.indexOf(this.symbolName) != -1) {
            return;
        }
        const newStack = [...stateStack, this.symbolName];
        this.child.collectVocab(tapes, newStack);
    }

    public get child(): State {
        if (this._child == undefined) {
            if (!(this.symbolName in this.symbolTable)) {
                throw new Error(`Cannot find symbol name ${this.symbolName}`);
            }
            this._child = this.symbolTable[this.symbolName];
        }
        return this._child;
    }

    
    public accepting(symbolStack: CounterStack): boolean {
        if (symbolStack.exceedsMax(this.symbolName)) {
            return false;
        }
        
        return this.child.accepting(symbolStack.add(this.symbolName));
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (symbolStack.exceedsMax(this.symbolName)) {
            return;
        }

        symbolStack = symbolStack.add(this.symbolName);
        for (const [childchildTape, childTarget, childMatched, childNext] of this.child.ndQuery(tape, target, symbolStack)) {
            const successor = new EmbedState(this.symbolName, this.symbolTable, childNext);
            yield [childchildTape, childTarget, childMatched, successor];
        }
    }
}

/**
 * A state that implements Projection in the sense of relational algebra, only 
 * exposing a subset of fields (read: tapes) of its child state.
 * 
 * Note that the child state itself still has and operates on those fields/tapes.
 * For example, the Projection of a join can still fail when there's a conflict regarding
 * field T, even if the Projection hides field T.  We can think of the Project as encapsulating
 * the set of fields/tapes such that only a subset of its fields are exposed to the outside,
 * rather than removing those fields/tapes.
 */
export class ProjectionState extends UnaryState {

    constructor(
        public child: State,
        public tapeRestriction: Set<string>
    ) { 
        super();
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {

        if (tape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(tape.tapeName)) {
            // if it's not a tape we care about, go nowhere
            yield [tape, target, false, this];
        }

        for (var [childTape, childTarget, childMatch, childNext] of 
                            this.child.dQuery(tape, target, symbolStack)) {

            if (childTape.tapeName != "__ANY_TAPE__" && !this.tapeRestriction.has(childTape.tapeName)) {
                // even if our child yields content on a restricted tape, 
                // we don't let our own parent know about it
                childTape = new TapeCollection();
                childTarget = NO_CHAR;
            }
            yield [childTape, childTarget, childMatch, new ProjectionState(childNext, this.tapeRestriction)];
        }
    }
}

/**
 * Implements the Rename operation from relational algebra.
 *
 */
export class RenameState extends UnaryState {

    constructor(
        public child: State,
        public fromTape: string,
        public toTape: string
    ) { 
        super();
    }

    public collectVocab(tapes: Tape, stateStack: String[]): void {
        tapes = new RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stateStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {


        if (tape.tapeName == this.toTape || tape.tapeName == "__ANY_TAPE__") {
            tape = new RenamedTape(tape, this.fromTape, this.toTape);
        }
    
        for (var [childTape, childTarget, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack)) {
            assert(childTape instanceof RenamedTape);
            const trueChildTape = (childTape as RenamedTape).child;
            yield [trueChildTape, childTarget, childMatched, new RenameState(childNext, this.fromTape, this.toTape)];
        }
    }
}

/**
 * Negation leads to problems, which is why many languages' regex modules
 * don't allow negation of arbitrary parts of the grammar, only of operators
 * like lookahead where negation is well-behaved.  However, negated parsers
 * are genuinely used in linguistic programming (for, e.g., phonological
 * constraints) and so we should have them.
 * 
 * In general, we negate an automaton by:
 * 
 *  * turning all accepting states into non-accepting states and vice-versa, 
 *    which we can do easily in the accepting() function.
 * 
 *  * introducing a new accepting state that the parse goes to if it "falls off"
 *    the automaton (e.g., if the automaton recognizes "foo", and get "q", then
 *    that's an acceptable negation, you need a state to accept that).  Here
 *    we implement this state by having "undefined" in place of a child.
 * 
 * There are two snags that come up when (as we do) you try to avoid actually
 * constructing the graph.
 * 
 * In general, negation of an automaton requires two things:
 * 
 *  * the automaton is deterministic; we handle that by calling dQuery instead
 *    of ndQuery.
 * 
 *  * the automaton to be negated doesn't have loops that are always 
 *    accepting (because those become loops that are never accepting, 
 *    and the traversal of them can go on forever).  Or put another way,
 *    a negated automaton can have useless states that will never lead
 *    to an output, that would be properly pruned in a concrete & determinized
 *    automaton, but that we can't be sure of when we evaluate the graph 
 *    lazily because it's effectively "looking into the future".
 * 
 * So the second one effectively requires construction and determinization of the
 * graph, but that can take enormous space... and because this is intended as a 
 * programming language that is kind to beginners, we want a well-formed grammar to always
 * successfully compile.  So we're going to probably end up with a patchwork of partial solutions,
 * and beyond that guarantee that the traversal halts by simply capping the 
 * maximum number of steps the automaton can take.  Not ideal, but should cover
 * most reasonable use cases.
 */
export class NegationState extends State {

    constructor(
        public child: State | undefined
    ) { 
        super();
    }

    public get id(): string {
        if (this.child == undefined) {
            return "~()";
        }
        return `~(${this.child.id})`;
    }
    
    public collectVocab(tapes: Tape, stateStack: String[]): void {
        if (this.child == undefined) {
            return;
        }
        this.child.collectVocab(tapes, stateStack);
    }

    public accepting(symbolStack: CounterStack): boolean {
        if (this.child == undefined) {
            return true;
        }
        return !this.child.accepting(symbolStack);
    }

    public *ndQuery(tape: Tape, 
        target: Token,
        symbolStack: CounterStack): Gen<[Tape, Token, boolean, State]> {


        if (this.child == undefined) {  // we've can't possibly match the child, so we're basically .* from now on
            yield [tape, target, true, this]; 
            return;
        }
        
        var remainder = new Token(target.bits.clone());

        for (const [childTape, childText, childMatched, childNext] of 
                                this.child.dQuery(tape, target, symbolStack)) {
            remainder = remainder.andNot(childText);
            yield [childTape, childText, childMatched, new NegationState(childNext)];
        }

        yield [tape, remainder, true, new NegationState(undefined)];
    }
}


/* CONVENIENCE FUNCTIONS FOR CONSTRUCTING GRAMMARS */

export function Lit(tier: string, text: string): State {
    return new LiteralState(tier, text);
}

export function Literalizer(tier: string) {
    return function(text: string) {
        return Lit(tier, text);
    }
}

export function Seq(...children: State[]): State {
    if (children.length == 0) {
        throw new Error("Sequences must have at least 1 child");
    }

    if (children.length == 1) {
        return children[0];
    }

    return new ConcatState(children[0], Seq(...children.slice(1)));
}

export function Uni(...children: State[]): State {
    if (children.length == 0) {
        throw new Error("Unions must have at least 1 child");
    }

    if (children.length == 1) {
        return children[0];
    }

    return new UnionState(children[0], Uni(...children.slice(1)));
}

/*
export function Pri(...children: State[]): State {
    return new PriorityUnionState(children);
} */

export function Join(child1: State, child2: State): State {
    return new JoinState(child1, child2);
    /* const left = new SemijoinState(child1, child2);
    const right = new SemijoinState(child2, child1);
    return new PriorityUnionState([left, right]); */

}

export function Not(child: State): State {
    return new NegationState(child);
}

export function Emb(symbolName: string, symbolTable: SymbolTable): State {
    return new EmbedState(symbolName, symbolTable);
}

export function Proj(child: State, ...tiers: string[]): State {
    return new ProjectionState(child, new Set(tiers));
}

export function Rename(child: State, fromTier: string, toTier: string): State {
    return new RenameState(child, fromTier, toTier);
}

export function Any(tier: string): State {
    return new AnyCharState(tier);
}

export function Rep(child: State, minReps=0, maxReps=Infinity) {
    return new RepetitionState(new TrivialState(), minReps, maxReps, 0, child);
}

export function Empty(): State {
    return new TrivialState();
}