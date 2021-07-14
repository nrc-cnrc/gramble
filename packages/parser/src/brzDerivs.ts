import { Gen, StringDict } from "./util";
import { MultiTapeOutput, Tape, RenamedTape, TapeCollection, Token, ANY_CHAR } from "./tapes";
import { assert } from "chai";

/**
 * This is the parsing engine that underlies Gramble.
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
 * classes here: there's a LiteralState, a UnionState, etc. that differ in how they construct 
 * their successors, and what information they need to keep track of to do so.  LiteralStates, for example,
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
    getSymbol(name: string, stack: CounterStack | undefined): State | undefined;
    addSymbol(name: string, state: State): void;
    compileSymbol(
        name: string, 
        allTapes: TapeCollection, 
        stack: CounterStack,
        compileLevel: number
    ): void;
}

/**
 * State
 * 
 * State is the basic class of the parser.  It encapsulates the current state of the parse; you can think
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
 *  * delta(tape): if the language contains the empty string on that tape, returns the
 *                 grammar corresponding to the remaining tapes, otherwise fails (returns BrzNull) 
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

    public abstract delta(tape: Tape, stack: CounterStack): State;

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
     * than call ndQuery directly, call dQuery (deterministic Query), which calls ndQuery and then adjusts
     * the results so that the results are disjoint.
     * 
     * @param tape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param stack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */

    public abstract ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]>;
        
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
     * @param nextTape A Tape object identifying the name/type/vocabulary of the relevant tape
     * @param target A Token identifying what characters we need to match
     * @param stack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @returns A tuple <tape, match, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * match is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */ 

    public *dQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

        var results: [Tape, Token, State][] = [];
        var nextStates: [Tape, Token, State][] = [... this.ndQuery(tape, target, stack)];
        
        for (var [nextTape, nextBits, next] of nextStates) {

            var newResults: [Tape, Token, State][] = [];
            for (var [otherTape, otherBits, otherNext] of results) {
                if (nextTape.tapeName != otherTape.tapeName) {
                    newResults.push([otherTape, otherBits, otherNext]);
                    continue;
                }

                // they both matched
                const intersection = nextBits.and(otherBits);
                if (!intersection.isEmpty()) {
                    // there's something in the intersection
                    const union = createBinaryUnion(next, otherNext);
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
     * { text: "foo" } in grammar X, we would construct JoinState(LiteralState("text", "foo"), X).
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

        var stateQueue: [Tape[], MultiTapeOutput, State, number][] = [[startingTapes, initialOutput, this, 0]];

        while (stateQueue.length > 0) {
            let nextQueue: [Tape[], MultiTapeOutput, State, number][] = [];
            for (let [tapes, prevOutput, prevState, chars] of stateQueue) {

                if (chars >= maxChars) {
                    continue;
                }

                if (prevState instanceof BrzEpsilon) {
                    yield *prevOutput.toStrings(false);
                    continue;
                }
                
                if (tapes.length == 0) {
                    // this can happen in the case of ∅
                    continue; 
                }

                // rotate the tapes so that we don't keep trying the same one every time
                tapes = [... tapes.slice(1), tapes[0]];

                const tapeToTry = tapes[0];
                for (const [cTape, cTarget, cNext] of prevState.dQuery(tapeToTry, ANY_CHAR, stack)) {

                    const nextOutput = prevOutput.add(cTape, cTarget);
                    nextQueue.push([tapes, nextOutput, cNext, chars+1]);
                }

                const delta = prevState.delta(tapeToTry, stack);

                if (!(delta instanceof BrzNull)) {                    
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

        var stateQueue: [MultiTapeOutput, State, number][] = 
                        [[initialOutput, this, 0]];

        const candidates: [MultiTapeOutput, State, number][] = [];

        while (stateQueue.length > 0) {
            const randomIndex = Math.floor(Math.random()*stateQueue.length);
            const [currentOutput, currentState, chars] = stateQueue.splice(randomIndex, 1)[0];
            
            if (currentState.accepting(allTapes, stack)) {
                candidates.push([currentOutput, currentState, chars]);
            }

            if (chars < maxChars) {
                for (const [tape, c, newState] of 
                        currentState.ndQuery(allTapes, ANY_CHAR, stack)) {
                    const nextOutput = currentOutput.add(tape, c);
                    stateQueue.push([nextOutput, newState, chars+1]);
                }
            }
            
            if (Math.random() < 0.05 && candidates.length > 0) {
                const candidateIndex = Math.floor(Math.random()*candidates.length);
                const [candidateOutput, candidateState, candidateChars] = candidates.splice(candidateIndex, 1)[0];
                yield* candidateOutput.toStrings(true);
            }
        }

        if (candidates.length == 0) {
            return;
        }

        const candidateIndex = Math.floor(Math.random()*candidates.length);
        const [candidateOutput, candidateState, candidateChars] = candidates[candidateIndex];
        yield* candidateOutput.toStrings(true);

    } */
}

export class BrzNull extends State {

    public get id(): string {
        return "∅";
    }
    
    public delta(
        tape: Tape,
        stack: CounterStack
    ): State {
        return this;
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> { }

}


/**
 * The state that recognizes/emits any character on a specific tape; 
 * implements the "dot" in regular expressions.
 */
export class AnyCharState extends State {
    
    constructor(
        public tapeName: string
    ) {
        super();
    }

    public get id(): string {
        return `${this.tapeName}:.`;
    }
    
    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return this;
        }
        return NULL;
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

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
export class LiteralState extends State {

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

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
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

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

        const matchedTape = tape.matchTape(this.tapeName);
        if (matchedTape == undefined) {
            return;
        }
        
        if (this.index >= this.text.length) {
            return;
        }

        const bits = this.getToken(matchedTape);
        const result = matchedTape.match(bits, target);
        if (result.isEmpty()) {
            return;
        }
        const nextState = new LiteralState(this.tapeName, this.text, this.index+1);
        yield [matchedTape, result, nextState];

    }


}

/**
 * An expression that's the empty string on all tapes.
 */
export class BrzEpsilon extends State {

    public get id(): string {
        return "ε";
    }

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        return this;
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> { }
}


/**
 * The abstract base class of all States with two state children 
 * (e.g. [JoinState]).
 */
abstract class BinaryState extends State {

    constructor(
        public child1: State,
        public child2: State
    ) {
        super();
    }

    public get id(): string {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }
}

export class BrzConcat extends BinaryState {

    public get id(): string {
        return `(${this.child1.id}+${this.child2.id})`;
    }

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        return createBinaryConcat( this.child1.delta(tape, stack),
                            this.child2.delta(tape, stack));
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

        for (const [c1tape, c1target, c1next] of
                this.child1.ndQuery(tape, target, stack)) {
            yield [c1tape, c1target, 
                createBinaryConcat(c1next, this.child2)];
        }

        const c1next = this.child1.delta(tape, stack);
        for (const [c2tape, c2target, c2next] of
                this.child2.ndQuery(tape, target, stack)) {
            const successor = createBinaryConcat(c1next, c2next);
            yield [c2tape, c2target, successor];
        }
    }
}

export class BrzUnion extends BinaryState {

    
    public get id(): string {
        return `(${this.child1.id}|${this.child2.id})`;
    }

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        return createBinaryUnion( this.child1.delta(tape, stack),
                             this.child2.delta(tape, stack));
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

        yield* this.child1.ndQuery(tape, target, stack);
        yield* this.child2.ndQuery(tape, target, stack);
    }
}

export class IntersectionState extends BinaryState {

    public get id(): string {
        return `(${this.child1.id}&${this.child2.id})`;
    }

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        return createIntersection( this.child1.delta(tape, stack),
                             this.child2.delta(tape, stack));
            
    }

    public *ndQuery(
        tape: Tape,
        target: Token,               
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {
            
        for (const [c1tape, c1target, c1next] of 
            this.child1.ndQuery(tape, target, stack)) {

            for (const [c2tape, c2target, c2next] of 
                    this.child2.ndQuery(c1tape, c1target, stack)) {
                const successor = createIntersection(c1next, c2next);
                yield [c2tape, c2target, successor];
            }

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
 export class EmbedState extends State {

    constructor(
        public symbolName: string,
        public namespace: INamespace,
        public _child: State | undefined = undefined
    ) { 
        super();
    }

    public get id(): string {
        return `${this.constructor.name}(${this.symbolName})`;
    }

    public getChild(stack: CounterStack | undefined = undefined): State {
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

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        if (stack.exceedsMax(this.symbolName)) {
            return NULL;
        }
        const newStack = stack.add(this.symbolName);
        return this.getChild(newStack).delta(tape, newStack);
    
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

        if (stack.exceedsMax(this.symbolName)) {
            return;
        }

        stack = stack.add(this.symbolName);
        let child = this.getChild(stack);

        for (const [childchildTape, childTarget, childNext] of 
                        child.ndQuery(tape, target, stack)) {
            const successor = new EmbedState(this.symbolName, this.namespace, childNext);
            yield [childchildTape, childTarget, successor];
        }
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
}


export class BrzStar extends UnaryState {

    constructor(
        public child: State
    ) {
        super();
    }

    public get id(): string {
        return `${this.child.id}*`;
    }

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        return createStar(this.child.delta(tape, stack));
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {
        for (const [cTape, cTarget, cNext] of this.child.ndQuery(tape, target, stack)) {
            const successor = createBinaryConcat(cNext, this);
            yield [cTape, cTarget, successor];
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

    public delta(
        tape: Tape, 
        stack: CounterStack
    ): State {
        tape = new RenamedTape(tape, this.fromTape, this.toTape);
        return this.child.delta(tape, stack);
    }

    public *ndQuery(
        tape: Tape, 
        target: Token,
        stack: CounterStack
    ): Gen<[Tape, Token, State]> {

        if (tape.tapeName == this.fromTape) {
            return;
        }

        tape = new RenamedTape(tape, this.fromTape, this.toTape);
    
        for (var [childTape, childTarget, childNext] of 
                this.child.ndQuery(tape, target, stack)) {
            if (childTape instanceof RenamedTape) {
                childTape = childTape.child;
            }
            yield [childTape, childTarget, new RenameState(childNext, this.fromTape, this.toTape)];
        }
    }
}

// Reveal and Hide, as currently implemented, do name-mangling
// a la Python double-underscore variables.  Generally an 
// interface will supply a name for the show/hide and we'll use that
// to mangle the name, but if not, the Show()/Hide() function will use
// this variable to create a nonce name.

/*
let REVEAL_INDEX = 0; 
export function Reveal(child: State, tape: string[], name: string = ""): State {
    if (name == "") {
        name = `HIDDEN${REVEAL_INDEX}`;
        REVEAL_INDEX++;
    }
    const desiredTapes: Set<string> = new Set(tape);
    var result: State = child;
    for (const tape of child.getRelevantTapes(new CounterStack())) {
        if (!desiredTapes.has(tape)) {
            result = new RenameState(result, tape, `__${name}_${tape}`)
        }
    }
    return result;
} 

let HIDE_INDEX = 0; 
export function Hide(child: State, tape: string, name: string = ""): State {

    if (name == "") {
        name = `HIDDEN${HIDE_INDEX}`;
        HIDE_INDEX++;
    }
    return new RenameState(child, tape, `__${name}_${tape}`);
}
*/

export function Rename(child: State, fromTape: string, toTape: string): State {
    return new RenameState(child, fromTape, toTape);
}

/* CONVENIENCE FUNCTIONS */

export const EPSILON = new BrzEpsilon();
export const NULL = new BrzNull();

function createListExpr(
    children: State[], 
    constr: (c1: State, c2: State) => State,
    nullResult: State, 
): State {
    if (children.length == 0) {
        return nullResult;
    }
    if (children.length == 1) {
        return children[0];
    }
    const head = children[0];
    const tail = createListExpr(children.slice(1), constr, nullResult);
    return constr(head, tail);
}

export function createBinaryConcat(c1: State, c2: State) {

    if (c1 instanceof BrzEpsilon) {
        return c2;
    }
    if (c2 instanceof BrzEpsilon) {
        return c1;
    }
    if (c1 instanceof BrzNull) {
        return c1;
    }
    if (c2 instanceof BrzNull) {
        return c2;
    }
    return new BrzConcat(c1, c2);
}

export function createBinaryUnion(c1: State, c2: State) {
    if (c1 instanceof BrzNull) {
        return c2;
    }
    if (c2 instanceof BrzNull) {
        return c1;
    }
    if (c1 instanceof BrzEpsilon && c2 instanceof BrzEpsilon) {
        return c1;
    }
    return new BrzUnion(c1, c2);
}

export function createSequence(...children: State[]): State {
    return createListExpr(children, createBinaryConcat, EPSILON);
}

export function createUnion(...children: State[]): State {
    return createListExpr(children, createBinaryUnion, NULL);
}

export function createIntersection(c1: State, c2: State) {

    if (c1 instanceof BrzNull) {
        return c1;
    }
    if (c2 instanceof BrzNull) {
        return c2;
    }
    if (c1 instanceof BrzEpsilon && c2 instanceof BrzEpsilon) {
        return c1;
    }
    return new IntersectionState(c1, c2);
}

export function createMaybe(child: State): State {
    return createUnion(child, EPSILON);
}

/**
 * Creates A* from A.  Distinguished from createRepeat
 * in that that works for any range of reps, where as this
 * is only zero through infinity reps.
 */
export function createStar(child: State): State {
    if (child instanceof BrzEpsilon) {
        return child;
    }

    if (child instanceof BrzNull) {
        return EPSILON;
    }

    if (child instanceof BrzStar) {
        return child;
    }

    return new BrzStar(child);
}

/**
 * Creates A{min,max} from A.  Distinguished from createStar
 * in that that only works for A{0,infinity}, whereas this
 * works for any values of {min,max}.
 */
export function createRepeat(child: State, minReps=0, maxReps=Infinity): State {

    if (maxReps < 0 || minReps > maxReps) {
        return NULL;
    }
    
    if (maxReps == 0) {
        return EPSILON;
    }

    if (minReps > 0) {
        const head = createSequence(...Array(minReps).fill(child))
        const tail = createRepeat(child, 0, maxReps - minReps);
        return createSequence(head, tail);
    }

    if (maxReps == Infinity) {
        return createStar(child);
    }

    const tail = createRepeat(child, 0, maxReps - 1);
    return createMaybe(createSequence(child, tail));
}