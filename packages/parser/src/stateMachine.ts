import { Gen } from "./util";
import { BitSet } from "bitset";
import { Vocab, BasicVocab, RenamedVocab } from "./vocab";

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
 *      (In actual implementation we only write to tapes, because
 *      we actually implement "reading" from a tape as a join operation.)
 * 
 *      - "Recursive" means that states can themselves contain states,
 *      meaning that the machine can parse context-free languages rather
 *      than just regular languages.  (Recursive and push-down automata
 *      are equivalent, but I hesitate to call this "push-down" because 
 *      states/transitions don't perform any operations to the stack.)
 *      
 * The execution of this particular state machine is lazy, 
 * in the sense that at no point is the entire machine ever 
 * constructed, let alone made deterministic.  Each state 
 * constructs successor states whenever necessary.
 * 
 */

export type SymbolTable = {[key: string]: State};

const ANY_TAPE: string = "__ANY__";
const NO_TAPE: string = "__NONE__";
const ANY_CHAR: BitSet = new BitSet().flip();
const NO_CHAR: BitSet = new BitSet();

export type StringDict = {[key: string]: string};

/**
 * Output
 * 
 * The outputs of this algorithm are kept as tries, since that's the natural
 * shape of a set of outputs from a non-deterministic parsing algorithm.  (E.g., if
 * we've already output "fooba", and at the next state we could either output "r" or
 * "z", then just having "r" and "z" point to that previous output is both less effort
 * and less space than copying it twice and concatenating it.  Especially if "z" ends
 * up being a false path and we end up discarding it; that would mean we had copied/
 * concatenated for nothing.)  
 * 
 * Note that this isn't storing characters explicitly, but sets of characters implemented
 * as a BitSet (e.g. if our alphabet were ABCDEF, then the set {B,D} would be the BitSet
 * 010100).  So one Output object might correspond to multiple outputs, once we've finished
 * parsing and the client asks for the results as an explicit dictionary of strings (using the
 * function [Object.toObj]).  
 */

class Output {

    public add(tape: string, text: BitSet) {
        return new SuccessiveOutput(tape, text, this);
    }

    public *toObj(vocab: Vocab): Gen<StringDict> { 
        yield {};
    };
}

class SuccessiveOutput extends Output {

    constructor(
        public tape: string,
        public text: BitSet,
        public prev: Output
    ) { 
        super();
    }

    public *toObj(vocab: Vocab): Gen<StringDict> {
        for (const result of this.prev.toObj(vocab)) {
            if (this.tape == NO_TAPE) {
                yield result;
                return;
            }
            if (!(this.tape in result)) {
                result[this.tape] = "";
            }
            const cs = vocab.fromBits(this.tape, this.text);
            for (const c of vocab.fromBits(this.tape, this.text)) {
                result[this.tape] += c;
                yield result;
            }
        }
    }
}

/**
 * CounterStack
 * 
 * A convenience class that works roughly like Python's collections.Counter.
 * We use it to make sure we don't recurse an impractical number of times, like
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
        if (key in this.stack) {
            return this.stack[key];
        }
        return 0;
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
 * to 1 by consuming "h", state 1 leads to 2 by consuming "e", etc.).
 * 
 * Our pointer into this graph basically represents two pieces of information, what the word is ("hello") and 
 * how far into it we are.  We could also represent this information as an object { text: string, index: number }.
 * Rather than pre-compute each of these nodes, we can say that this object returns (upon matching) another 
 * object {text: string, index: number+1}... until we exceed the length of the literal, of course.
 * 
 * This idea, in general, allows us to avoid creating explicit state graphs that can be exponentially huge, 
 * although it comes with its own pitfalls.
 * 
 * For our purposes, a State is anything that can, upon being queried with a [tape, char] pair, return the possible
 * successor states it can get to.  
 * 
 * Many kinds of States have to contain references to other states (like an 
 * [EmbedState], which lets us embed grammars inside other grammars, keeps a point to the current parse state inside
 * that embedded grammar).  The structure of State components ends up being roughly isomorphic to the grammar that it's
 * parsing (e.g. if the grammar is (A+(B|C)), then the start State that we begin in will have the same structure,
 * it'll be a [ConcatState] of (A and a [UnionState] of (B and C)).  Then as the parse goes on, the State will
 * simplify bit-by-bit, like once A is recognized, the current state will just be one corresponding to B|C, and 
 * if B fails, the current state will just be C.
 */

export abstract class State {

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
     * The workhorse function of the parser, taking a <tape, char> pair and trying to match it to a transition
     * (e.g., matching it to the next character of a [LiteralState]).  It yields all matching <tape, char> pairs, and the respective
     * nextStates to which we should move upon a successful transition.
     * 
     * @param tape A string identifying what tape the target character(s) is on
     * @param target A BitSet identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @param vocab A [Vocab] keeping track of the indices of particular characters in the target BitSet 
     * @returns A tuple <tape, target, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * target is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */

    public abstract ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]>;


    /** 
     * Queries the state so that the results are deterministic (or more accurately, so that all returned 
     * transitions are disjoint).  (There can still be multiple results; when we query ANY:ANY, for example.)
     * 
     * This looks a bit complicated (and it kind of is) but what it's doing is handing off the query to
     * ndQuery, then combining results so that there's no overlap in the BitSets.  For example, say ndQuery yields
     * two tokens X and Y, and they have no intersection.  Then we're good, we just yield those.  But if they 
     * do have an intersection, we need to return three paths:
     * 
     *    X&Y (leading to the UnionState of the states X and Y would have led to)
     *    X-Y (leading to the state X would have led to)
     *    Y-X (leading to the state Y would have led to)
     * 
     * @param tape A string identifying what tape the target character(s) is on
     * @param target A BitSet identifying what characters we need to match
     * @param symbolStack A [CounterStack] that keeps track of symbols (for embedding grammars), used for preventing infinite recursion
     * @param vocab A [Vocab] keeping track of the indices of particular characters in the target BitSet 
     * @returns A tuple <tape, target, matched, nextState>, where:
     *      * tape is the tape we matched on, 
     *      * target is the intersection of the original target and our match,
     *      * matched is whether we actually made a match or ignored it (for being on the wrong tape)
     *      * nextState is the state the matched transition leads to
     */ 

    public *dQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        var results: [string, BitSet, boolean, State][] = [];
        var nextStates = [... this.ndQuery(tape, target, symbolStack, vocab)];
        
        for (var [tape, bits, matched, next] of nextStates) {

            if (tape == NO_TAPE) {
                results.push([tape, bits, matched, next]);
                continue;
            }

            var newResults: [string, BitSet, boolean, State][] = [];
            for (var [otherTape, otherBits, otherMatched, otherNext] of results) {
                if (tape != otherTape) {
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

        
    public *run(maxRecursion: number = 4): Gen<StringDict> {
        yield* this.breadthFirst(maxRecursion);
    }

    public getVocab(stateStack: String[]): Vocab {
        return new BasicVocab();
    }

    
    public *depthFirst(maxRecursion: number = 4): Gen<StringDict> {

        const vocab = this.getVocab([]);

        const initialOutput: Output = new Output();
        var stateStack: [Output, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);

        for (var topPair; topPair = stateStack.pop(); ) {

            const [prevOutput, prevState] = topPair;

            if (prevState.accepting(symbolStack)) {
                yield* prevOutput.toObj(vocab);
            }

            for (const [tape, c, matched, newState] of prevState.ndQuery(ANY_TAPE, ANY_CHAR, symbolStack, vocab)) {
                const nextOutput = prevOutput.add(tape, c);
                stateStack.push([nextOutput, newState]);
            }
        }
    } 

    public *breadthFirst(maxRecursion: number = 4, maxChars: number = 1000): Gen<StringDict> {

        const vocab = this.getVocab([]);

        const initialOutput: Output = new Output();
        var stateQueue: [Output, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);
        var chars = 0;

        while (stateQueue.length > 0 && chars < maxChars) {
            var nextQueue: [Output, State][] = [];
            for (var i = 0; i < stateQueue.length; i++) {

                const [prevOutput, prevState] = stateQueue[i];

                if (prevState.accepting(symbolStack)) {
                    yield* prevOutput.toObj(vocab);
                }

                for (const [tape, c, matched, newState] of prevState.dQuery(ANY_TAPE, ANY_CHAR, symbolStack, vocab)) {
                    const nextOutput = prevOutput.add(tape, c);
                    nextQueue.push([nextOutput, newState]);
                }
            }
            stateQueue = nextQueue;
            chars++;
        }
    }
}

export class AnyCharState extends State {


    constructor(
        public tape: string
    ) {
        super();
    }

    public get id(): string {
        return `${this.tape}:(ANY)`;
    }
    
    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (tape != ANY_TAPE && tape != this.tape) {      // If the probe asks for a specific tape
            yield [tape, target, false, this];       // and it's not the tape we 
            return;                                  // care about, stay in place
        }
        
        if (this.accepting(symbolStack)) {
            return;
        }

        yield [this.tape, target, true, new TrivialState()];

    }
}


export class LiteralState extends State {

    constructor(
        public tape: string,
        public text: string
    ) { 
        super();
    }

    public get id(): string {
        return `${this.tape}:${this.text}`;
    }

    public accepting(symbolStack: CounterStack): boolean {
        return this.text == "";
    }

    
    public getVocab(stateStack: String[]): Vocab {
        const result = new BasicVocab();
        for (const c of this.text) {
            result.add(this.tape, c);
        }
        return result;
    }

    public *ndQuery(tape: string, 
            target: BitSet,
            symbolStack: CounterStack,
            vocab: Vocab): Gen<[string, BitSet, boolean, State]> {


        // If the probe asks for a specific tape and it's not the tape we care about, stay in place
        if (tape != ANY_TAPE && tape != this.tape) {
            yield [tape, target, false, this];
            return;
        }
        
        if (this.accepting(symbolStack)) {
            return; 
        }

        const myBits = vocab.toBits(this.tape, this.text[0]);
        const result = myBits.and(target);

        const nextState = new LiteralState(this.tape, this.text.slice(1)); // success
        yield [this.tape, result, true, nextState];

    }

}


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

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> { }
}

abstract class BinaryState extends State {

    constructor(
        public child1: State,
        public child2: State
    ) {
        super();
    }

    
    public getVocab(stateStack: String[]): Vocab {
        const result = this.child1.getVocab(stateStack);
        result.combine(this.child2.getVocab(stateStack));
        return result;
    }


    public get id(): string {
        return `${this.constructor.name}(${this.child1.id},${this.child2.id})`;
    }

    public accepting(symbolStack: CounterStack): boolean {
        return this.child1.accepting(symbolStack) && this.child2.accepting(symbolStack);
    }
}

export class ConcatState extends BinaryState {

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        var yieldedAlready = false;

        for (const [c1tape, c1text, c1matched, c1next] of this.child1.dQuery(tape, target, symbolStack, vocab)) {

            if (!c1matched) { 
                // child1 not interested in the requested tape, move on to child2
                for (const [c2tape, c2text, c2matched, c2next] of this.child2.dQuery(tape, target, symbolStack, vocab)) {
                    yield [c2tape, c2text, c2matched, new ConcatState(this.child1, c2next)];
                    yieldedAlready = true;
                }
                continue;
            }

            yield [c1tape, c1text, c1matched, new ConcatState(c1next, this.child2)];
        }

        if (!yieldedAlready && this.child1.accepting(symbolStack)) { 
            yield* this.child2.dQuery(tape, target, symbolStack, vocab);
        }  

    }

}


export class UnionState extends BinaryState {

    public accepting(symbolStack: CounterStack): boolean {
        return this.child1.accepting(symbolStack) || this.child2.accepting(symbolStack);
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        yield* this.child1.dQuery(tape, target, symbolStack, vocab);
        yield* this.child2.dQuery(tape, target, symbolStack, vocab);
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
export class JoinState extends BinaryState {

    public *queryLeftJoin(tape: string,
                          target: BitSet,
                          c1: State,
                          c2: State,
                          symbolStack: CounterStack,
                          vocab: Vocab): Gen<[string, BitSet, boolean, State]> {
                              
        for (const [c1tape, c1target, c1matched, c1next] of c1.dQuery(tape, target, symbolStack, vocab)) {

            if (c1tape == NO_TAPE) {
                yield [c1tape, c1target, c1matched, new JoinState(c1next, c2)];
                continue;
            }
            
            for (const [c2tape, c2target, c2matched, c2next] of c2.dQuery(c1tape, c1target, symbolStack, vocab)) {
                yield [c2tape, c2target, c1matched || c2matched, new JoinState(c1next, c2next)];
            }
        } 
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        const leftJoin = this.queryLeftJoin(tape, target, this.child1, this.child2, symbolStack, vocab);
        const rightJoin = this.queryLeftJoin(tape, target, this.child2, this.child1, symbolStack, vocab);
        yield* iterPriorityUnion(leftJoin, rightJoin);
    }

} 

abstract class UnaryState extends State {

    public abstract get child(): State;

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }

    public getVocab(stateStack: String[]): Vocab {
        return this.child.getVocab(stateStack);
    }


    public accepting(symbolStack: CounterStack): boolean {
        return this.child.accepting(symbolStack);
    }
}

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

    
    public getVocab(stateStack: String[]): Vocab {
        return this.initialChild.getVocab(stateStack);
    }

    public accepting(symbolStack: CounterStack): boolean {
        return this.index >= this.minRepetitions && 
            this.index <= this.maxRepetitions && 
            this.child.accepting(symbolStack);
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (this.index > this.maxRepetitions) {
            return;
        }
        

        var yieldedAlready = false;

        if (this.child.accepting(symbolStack)) {
            // we just started, or the child is accepting, so our successor increases its index
            // and starts again with child.
            const successor = new RepetitionState(this.initialChild, 
                        this.minRepetitions, this.maxRepetitions, this.index+1, this.initialChild);
            for (const result of successor.dQuery(tape, target, symbolStack, vocab)) {
                yield result;
                yieldedAlready = true;
            }
        }

        if (yieldedAlready) {
            return;
        }

        for (const [childTape, childText, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack, vocab)) {
            if (!childMatched) { // child doesn't care, neither do we
                yield [childTape, childText, false, this];
                continue;
            }

            yield [childTape, childText, childMatched, new RepetitionState(childNext, 
                this.minRepetitions, this.maxRepetitions, this.index, this.initialChild)];
        }

    }
}


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
    
    public getVocab(stateStack: String[]): Vocab {
        if (stateStack.indexOf(this.symbolName) != -1) {
            return new BasicVocab();
        }
        const newStack = [...stateStack, this.symbolName];
        return this.child.getVocab(newStack);
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
        
        symbolStack = symbolStack.add(this.symbolName);
        return this.child.accepting(symbolStack);
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (symbolStack.exceedsMax(this.symbolName)) {
            return;
        }

        symbolStack = symbolStack.add(this.symbolName);
        for (const [childchildTape, childTarget, childMatched, childNext] of this.child.ndQuery(tape, target, symbolStack, vocab)) {
            const successor = new EmbedState(this.symbolName, this.symbolTable, childNext);
            yield [childchildTape, childTarget, childMatched, successor];
        }
    }
}

export class ProjectionState extends UnaryState {

    constructor(
        public child: State,
        public tapeRestriction: Set<string>
    ) { 
        super();
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {


        if (tape != ANY_TAPE && !this.tapeRestriction.has(tape)) {
            // if it's not a tape we care about, go nowhere
            yield [tape, target, false, this];
        }

        for (var [childTape, childTarget, childMatch, childNext] of 
                            this.child.dQuery(tape, target, symbolStack, vocab)) {

            if (childTape != ANY_TAPE && !this.tapeRestriction.has(childTape)) {
                // even if our child yields content on a restricted tape, 
                // we don't let our own parent know about it
                childTape = NO_TAPE;
                childTarget = NO_CHAR;
            }
            yield [childTape, childTarget, childMatch, new ProjectionState(childNext, this.tapeRestriction)];
        }
    }
}

export class RenameState extends UnaryState {

    constructor(
        public child: State,
        public fromTape: string,
        public toTape: string
    ) { 
        super();
    }

    public getVocab(stateStack: String[]): Vocab {
        const childVocab = new RenamedVocab(this.fromTape, this.toTape, this.child.getVocab(stateStack));
        return new BasicVocab().combine(childVocab);
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (tape == this.toTape) {
            tape = this.fromTape;
        }

        const childVocab = new RenamedVocab(this.fromTape, this.toTape, vocab);
    
        for (var [childTape, childTarget, childMatched, childNext] of this.child.dQuery(tape, target, symbolStack, childVocab)) {
            if (childTape == this.fromTape) {
                childTape = this.toTape;
            }
            yield [childTape, childTarget, childMatched, new RenameState(childNext, this.fromTape, this.toTape)];
        }
    }
}

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

    public getVocab(stateStack: String[]): Vocab {
        if (this.child == undefined) { 
            return new BasicVocab();
        }
        return this.child.getVocab(stateStack);
    }

    public accepting(symbolStack: CounterStack): boolean {
        if (this.child == undefined) {
            return true;
        }
        return !this.child.accepting(symbolStack);
    }

    public *ndQuery(tape: string, 
        target: BitSet,
        symbolStack: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {


        if (this.child == undefined) {  // we've can't possibly match the child, so we're basically .* from now on
            yield [tape, target, true, this]; 
            return;
        }
        
        var remainder = target.clone();

        for (const [childTape, childText, childMatched, childNext] of 
                                this.child.dQuery(tape, target, symbolStack, vocab)) {
            remainder = remainder.andNot(childText);
            yield [childTape, childText, childMatched, new NegationState(childNext)];
        }

        yield [tape, remainder, true, new NegationState(undefined)];
    }
}

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