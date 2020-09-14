import { Gen } from "./util";
import { runInNewContext } from "vm";
import { Emb } from "./parserInterface";

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

const ANY_TIER: string = "__ANY__";
const NO_TIER: string = "__NONE__";
const ANY_CHAR: BitSet = new BitSet().flip();
const NO_CHAR: BitSet = new BitSet();

export type StringDict = {[key: string]: string};


class Output {

    public add(tier: string, text: BitSet) {
        return new SuccessiveOutput(tier, text, this);
    }

    public *toObj(vocab: Vocab): Gen<StringDict> { 
        yield {};
    };
}

class SuccessiveOutput extends Output {

    constructor(
        public tier: string,
        public text: BitSet,
        public prev: Output
    ) { 
        super();
    }

    public *toObj(vocab: Vocab): Gen<StringDict> {
        for (const result of this.prev.toObj(vocab)) {
            if (this.tier == NO_TIER) {
                yield result;
                return;
            }
            if (!(this.tier in result)) {
                result[this.tier] = "";
            }
            const cs = vocab.fromBits(this.tier, this.text);
            for (const c of vocab.fromBits(this.tier, this.text)) {
                result[this.tier] += c;
                yield result;
            }
        }
    }
}


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

export abstract class State {

    public abstract get id(): string;
    
    public accepting(): boolean {
        return false;
    }

    public abstract probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]>;

        
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

            if (prevState.accepting()) {
                yield* prevOutput.toObj(vocab);
            }

            for (const [tier, c, matched, newState] of prevState.probe(ANY_TIER, ANY_CHAR, symbolStack, vocab)) {
                const nextOutput = prevOutput.add(tier, c);
                stateStack.push([nextOutput, newState]);
            }
        }
    }

    public *breadthFirst(maxRecursion: number = 4): Gen<StringDict> {

        const vocab = this.getVocab([]);

        const initialOutput: Output = new Output();
        var stateQueue: [Output, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);

        for (var i = 0; i < stateQueue.length; i++) {

            const [prevOutput, prevState] = stateQueue[i];

            if (prevState.accepting()) {
                yield* prevOutput.toObj(vocab);
            }

            for (const [tier, c, matched, newState] of prevState.probe(ANY_TIER, ANY_CHAR, symbolStack, vocab)) {
                const nextOutput = prevOutput.add(tier, c);
                stateQueue.push([nextOutput, newState]);
            }
        }
    }
}

export class AnyCharState extends State {


    constructor(
        public tier: string,
        public consumed: boolean = false
    ) {
        super();
    }

    public get id(): string {
        return '${this.tier}:(ANY)';
    }

    public accepting(): boolean {
        return this.consumed;
    }
    
    
    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (tier != ANY_TIER && tier != this.tier) {      // If the probe asks for a specific tier
            yield [tier, target, false, this];       // and it's not the tier we 
            return;                                  // care about, stay in place
        }
        
        if (this.accepting()) {
            return;
        }

        const nextState = new AnyCharState(this.tier, true);
        yield [this.tier, target, true, nextState];

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

    public accepting(): boolean {
        return this.text == "";
    }

    
    public getVocab(stateStack: String[]): Vocab {
        const result = new BasicVocab();
        for (const c of this.text) {
            result.add(this.tape, c);
        }
        return result;
    }

    public *probe(tier: string, 
            target: BitSet,
            symbols: CounterStack,
            vocab: Vocab): Gen<[string, BitSet, boolean, State]> {


        // If the probe asks for a specific tier and it's not the tier we care about, stay in place
        if (tier != ANY_TIER && tier != this.tape) {
            yield [tier, target, false, this];
            return;
        }
        
        if (this.accepting()) {
            return; 
        }

        const myBits = vocab.toBits(this.tape, this.text[0]);
        const result = myBits.and(target);

        if (result.isEmpty()) {
            return;
        }

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

    public accepting(): boolean {
        return true;
    }

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
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

    public accepting(): boolean {
        return this.child1.accepting() && this.child2.accepting();
    }
}

export class ConcatState extends BinaryState {

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        var yieldedAlready = false;

        for (const [child1tier, child1text, c1matched, child1next] of this.child1.probe(tier, target, symbols, vocab)) {

            if (!c1matched) { 
                // child1 didn't go anywhere, probably not interested in the requested tier
                // move on to child2
                for (const [c2tier, c2text, c2matched, child2Next] of this.child2.probe(tier, target, symbols, vocab)) {
                    yield [c2tier, c2text, c2matched, new ConcatState(this.child1, child2Next)];
                    yieldedAlready = true;
                }
                continue;
            }

            yield [child1tier, child1text, c1matched, new ConcatState(child1next, this.child2)];
        }

        if (!yieldedAlready && this.child1.accepting()) { 
            yield* this.child2.probe(tier, target, symbols, vocab);
        }  

    }

}


export class UnionState extends State {

    constructor(
        public children: State[]
    ) {
        super();
    }

    public get id(): string {
        return `(${this.children.map(c => c.id).join("|")})`;
    }

    
    public getVocab(stateStack: String[]): Vocab {
        const result = new BasicVocab();
        for (const child of this.children) {
            result.combine(child.getVocab(stateStack));
        }
        return result;
    }


    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        for (const child of this.children) {
            yield* child.probe(tier, target, symbols, vocab);
        }
    }
}

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

    public *probeLeftJoin(tier: string,
                          target: BitSet,
                          c1: State,
                          c2: State,
                          symbols: CounterStack,
                          vocab: Vocab): Gen<[string, BitSet, boolean, State]> {
                              
        for (const [c1tier, c1target, c1matched, c1next] of c1.probe(tier, target, symbols, vocab)) {

            if (c1tier == NO_TIER) {
                yield [c1tier, c1target, c1matched, new JoinState(c1next, c2)];
                continue;
            }
            
            for (const [c2tier, c2target, c2matched, c2next] of c2.probe(c1tier, c1target, symbols, vocab)) {
                yield [c2tier, c2target, c1matched || c2matched, new JoinState(c1next, c2next)];
            }
        } 
    }

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        const leftJoin = this.probeLeftJoin(tier, target, this.child1, this.child2, symbols, vocab);
        const rightJoin = this.probeLeftJoin(tier, target, this.child2, this.child1, symbols, vocab);
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


    public accepting(): boolean {
        return this.child.accepting();
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

    public accepting(): boolean {
        return this.index >= this.minRepetitions && 
            this.index <= this.maxRepetitions && 
            this.child.accepting();
    }

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (this.index > this.maxRepetitions) {
            return;
        }
        

        var yieldedAlready = false;

        if (this.child.accepting()) {
            // we just started, or the child is accepting, so our successor increases its index
            // and starts again with child.
            const successor = new RepetitionState(this.initialChild, 
                        this.minRepetitions, this.maxRepetitions, this.index+1, this.initialChild);
            for (const result of successor.probe(tier, target, symbols, vocab)) {
                yield result;
                yieldedAlready = true;
            }
        }

        if (yieldedAlready) {
            return;
        }

        for (const [childTier, childText, childMatched, childNext] of this.child.probe(tier, target, symbols, vocab)) {
            if (!childMatched) { // child doesn't care, neither do we
                yield [childTier, childText, false, this];
                continue;
            }

            yield [childTier, childText, childMatched, new RepetitionState(childNext, 
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

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (symbols.exceedsMax(this.symbolName)) {
            return;
        }

        symbols = symbols.add(this.symbolName);
        for (const [childTier, childTarget, childMatched, childNext] of this.child.probe(tier, target, symbols, vocab)) {
            const successor = new EmbedState(this.symbolName, this.symbolTable, childNext);
            yield [childTier, childTarget, childMatched, successor];
        }
    }
}

export class ProjectionState extends UnaryState {

    constructor(
        public child: State,
        public tierRestriction: Set<string>
    ) { 
        super();
    }

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {


        if (tier != ANY_TIER && !this.tierRestriction.has(tier)) {
            // if it's not a tier we care about, go nowhere
            yield [tier, target, false, this];
        }

        for (var [childTier, childTarget, childMatch, childNext] of this.child.probe(tier, target, symbols, vocab)) {

            if (childTier != ANY_TIER && !this.tierRestriction.has(childTier)) {
                // even if our child yields content on a restricted tier, we don't let our own parent know about it
                childTier = NO_TIER;
                childTarget = NO_CHAR;
            }
            yield [childTier, childTarget, childMatch, new ProjectionState(childNext, this.tierRestriction)];
        }
    }
}

export class RenameState extends UnaryState {

    constructor(
        public child: State,
        public fromTier: string,
        public toTier: string
    ) { 
        super();
    }

    public getVocab(stateStack: String[]): Vocab {
        const childVocab = new RenamedVocab(this.fromTier, this.toTier, this.child.getVocab(stateStack));
        return new BasicVocab().combine(childVocab);
    }

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {

        if (tier == this.toTier) {
            tier = this.fromTier;
        }

        const childVocab = new RenamedVocab(this.fromTier, this.toTier, vocab);
    
        for (var [childTier, childTarget, childMatched, childNext] of this.child.probe(tier, target, symbols, childVocab)) {
            if (childTier == this.fromTier) {
                childTier = this.toTier;
            }
            yield [childTier, childTarget, childMatched, new RenameState(childNext, this.fromTier, this.toTier)];
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

    public accepting(): boolean {
        if (this.child == undefined) {
            return true;
        }
        return !this.child.accepting();
    }

    public *probe(tier: string, 
        target: BitSet,
        symbols: CounterStack,
        vocab: Vocab): Gen<[string, BitSet, boolean, State]> {


        if (this.child == undefined) {  // we've can't possibly match the child, so we're basically .* from now on
            yield [tier, target, true, this]; 
            return;
        }

        
        var remainder = target.clone();

        for (const [childTier, childText, childMatched, childNext] of 
                                this.child.probe(tier, target, symbols, vocab)) {
            remainder = remainder.andNot(childText);
            yield [childTier, childText, childMatched, new NegationState(childNext)];
        }

        if (remainder.isEmpty()) {
            return;
        }

        yield [tier, remainder, true, new NegationState(undefined)];
    }



}