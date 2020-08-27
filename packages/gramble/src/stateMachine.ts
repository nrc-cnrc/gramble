import { Gen } from "./util";
import { runInNewContext } from "vm";
import { Emb } from "./parserInterface";

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
export type StringDict = {[key: string]: string};

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
    
    private _tiers: Set<string> | undefined = undefined;

    public get tiers(): Set<string> {
        if (this._tiers == undefined) {
            this._tiers = this.calculateTiers([]);
        }
        return this._tiers;
    }

    public abstract calculateTiers(symbolStack: string[]): Set<string>;

    public abstract accepting(): boolean;

    public abstract query(prevOutput: StringDict,
                          symbols: CounterStack): 
                Gen<[StringDict, State]>;

    public abstract require(tier: string, 
                            target: string,
                            symbols: CounterStack): Gen<State>;

        
    public *run(maxRecursion: number = 4): Gen<StringDict> {
        yield* this.breadthFirst(maxRecursion);
    }

    public *depthFirst(maxRecursion: number = 4): Gen<StringDict> {

        const initialOutput: StringDict = {};
        var stateStack: [StringDict, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);

        for (var topPair; topPair = stateStack.pop(); ) {

            const [prevOutput, prevState] = topPair;

            if (prevState.accepting()) {
                yield prevOutput;
            }

            for (const [newOutput, newState] of prevState.query(prevOutput, symbolStack)) {
                stateStack.push([newOutput, newState]);
            }
        }
    }

    public *breadthFirst(maxRecursion: number = 4): Gen<StringDict> {
        const initialOutput: StringDict = {};
        var stateQueue: [StringDict, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);

        for (var i = 0; i < stateQueue.length; i++) {

            const [prevOutput, prevState] = stateQueue[i];

            if (prevState.accepting()) {
                yield prevOutput;
            }

            for (const [newOutput, newState] of prevState.query(prevOutput, symbolStack)) {
                stateQueue.push([newOutput, newState]);
            }
        }
    }
}

export class LiteralState extends State {

    constructor(
        public tier: string,
        public text: string
    ) { 
        super();
    }

    public get id(): string {
        return `${this.tier}:${this.text}`;
    }

    public calculateTiers(symbolStack: string[]): Set<string> {
        return new Set([this.tier]);
    }

    public accepting(): boolean {
        return this.text == "";
    }

    public *query(prevOutput: StringDict,
                    symbols: CounterStack): Gen<[StringDict, State]> {
        if (this.text == "") {
            return;
        }

        const nextOutput: StringDict = { [this.tier]: "" };
        Object.assign(nextOutput, prevOutput);
        nextOutput[this.tier] += this.text[0];
        nextOutput["__LAST_TIER__"] = this.tier;
        nextOutput["__LAST_CHAR__"] = this.text[0];
        const nextState = new LiteralState(this.tier, this.text.slice(1));
        yield [nextOutput, nextState];
    }


    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {
        if (tier != this.tier) {
            yield this;
            return;
        }
        
        if (this.text == "" || this.text[0] != target) {
            return;
        }

        const nextState = new LiteralState(this.tier, this.text.slice(1));
        yield nextState;
    }
}

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
    
    public calculateTiers(symbolStack: string[]): Set<string> {
        return new Set([...this.child1.calculateTiers(symbolStack), 
                        ...this.child2.calculateTiers(symbolStack)]);
    }

    public accepting(): boolean {
        return this.child1.accepting() && this.child2.accepting();
    }
}

export class ConcatState extends BinaryState {
    

    public *query(prevOutput: StringDict,
                symbols: CounterStack): Gen<[StringDict, State]> {

        if (this.child1.accepting()) {
            yield* this.child2.query(prevOutput, symbols);
            return;
        } 

        for (const [child1Output, child1Next] of this.child1.query(prevOutput, symbols)) {
            if (child1Next.accepting()) {            
                yield [child1Output, this.child2];
                continue;
            }
            yield [child1Output, new ConcatState(child1Next, this.child2)];
        }
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {
        if (this.child1.accepting()) { 
            yield* this.child2.require(tier, target, symbols);
            return;
        } 

        if (this.child1.tiers.has(tier)) {
            for (const child1next of this.child1.require(tier, target, symbols)) {
                if (child1next.accepting()) {
                    yield this.child2;
                    continue;
                }
                yield new ConcatState(child1next, this.child2);
            }
            return;
        }

        for (const child2Next of this.child2.require(tier, target, symbols)) {
            if (child2Next.accepting()) {
                yield this.child1;
                continue;
            } 
            yield new ConcatState(this.child1, child2Next);
        }
    }
}

export class UnionState extends State {

    constructor(
        public children: State[]
    ) {
        super();
    }

    public accepting(): boolean {
        return false;
    }

    public calculateTiers(symbolStack: string[]): Set<string> {
        const result: Set<string> = new Set();
        for (const child of this.children) {
            for (const tier of child.calculateTiers(symbolStack)) {
                result.add(tier);
            }
        }
        return result;
    }

    public get id(): string {
        return `(${this.children.map(c => c.id).join("|")})`;
    }

    public *query(prevOutput: StringDict,
                symbols: CounterStack): Gen<[StringDict, State]> {
        for (const child of this.children) {
            yield* child.query(prevOutput, symbols);
        }
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {
        for (const child of this.children) {
            yield* child.require(tier, target, symbols);
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

    public *queryLeftJoin(prevOutput: StringDict, 
                          c1: State,
                          c2: State,
                          symbols: CounterStack): Gen<[StringDict, State]> {
        for (const [o1, newChild1] of c1.query(prevOutput, symbols)) {
            const tier = o1["__LAST_TIER__"];
            const c = o1["__LAST_CHAR__"];

            if (!("__LAST_TIER__" in o1) || !c2.tiers.has(tier)) {
                yield [o1, new JoinState(newChild1, c2)];
                continue;
            }
            
            for (const newChild2 of c2.require(tier, c, symbols)) {
                yield [o1, new JoinState(newChild1, newChild2)];
            }
        }
    }

    public *query(prevOutput: StringDict,
                symbols: CounterStack): Gen<[StringDict, State]> {

        /*
        if (this.accepting()) {
            return;
        } */

        const leftJoin = this.queryLeftJoin(prevOutput, this.child1, this.child2, symbols);
        const rightJoin = this.queryLeftJoin(prevOutput, this.child2, this.child1, symbols);
        yield* iterPriorityUnion(leftJoin, rightJoin);
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {
        
        var child1nexts: Iterable<State> = [ this.child1 ];
        var child2nexts: Iterable<State> = [ this.child2 ];

        if (this.child1.tiers.has(tier)) {
            child1nexts = this.child1.require(tier, target, symbols);
        }
        
        if (this.child2.tiers.has(tier)) {
            child2nexts = this.child2.require(tier, target, symbols);
        }

        for (const child1next of child1nexts) {
            for (const child2next of child2nexts) {
                yield new JoinState(child1next, child2next);
            }
        }
    }
}

abstract class UnaryState extends State {

    public abstract get child(): State;

    public calculateTiers(symbolStack: string[]): Set<string> {
        return this.child.calculateTiers(symbolStack);
    }

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }

    public accepting(): boolean {
        return this.child.accepting();
    }

    public *query(prevOutput: StringDict,
        symbols: CounterStack): Gen<[StringDict, State]> {
        yield* this.child.query(prevOutput, symbols);
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {
        yield* this.child.require(tier, target, symbols);
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
    
    public calculateTiers(symbolStack: string[]): Set<string> {
        if (symbolStack.indexOf(this.symbolName) != -1) {
            return new Set();
        }
        return this.child.calculateTiers([...symbolStack, this.symbolName]);
    }
    
    public get id(): string {
        return `${this.constructor.name}(${this.symbolName})`;
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

    public successor(newChild: State): EmbedState {
        return new EmbedState(this.symbolName, this.symbolTable, newChild);
    }
    
    public *query(prevOutput: StringDict,
                    symbols: CounterStack): Gen<[StringDict, State]> {

        if (symbols.exceedsMax(this.symbolName)) {
            return;
        }

        symbols = symbols.add(this.symbolName);

        /* alternative way of doing it using outputs, 
            could put this back later.

        const symbolTier = `__SYM_${this.symbolName}`;
        if (!(symbolTier in prevOutput)) {
            prevOutput[symbolTier] = "";
        }

        if (prevOutput[symbolTier].length >= 1) {
            return;
        }

        prevOutput[symbolTier] += "X";
        */
        
        for (const [childOutput, childNext] of this.child.query(prevOutput, symbols)) {
            //childOutput[symbolTier] = childOutput[symbolTier].slice(1);
            yield [childOutput, this.successor(childNext)];
        }
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {
        if (symbols.exceedsMax(this.symbolName)) {
            return;
        }

        symbols = symbols.add(this.symbolName);
        for (const childNext of this.child.require(tier, target, symbols)) {
            yield this.successor(childNext);
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

    public calculateTiers(symbolStack: string[]): Set<string> {
        return this.tierRestriction;
    }

    public *query(output: StringDict,
                    symbols: CounterStack): Gen<[StringDict, State]> {

        for (const [childOutput, childNext] of this.child.query(output, symbols)) {
            const newOutput: StringDict = {};
            for (const tier of this.tiers) {
                if (!(tier in childOutput)) {
                    continue;
                }
                newOutput[tier] = childOutput[tier];
            }
            if (this.tiers.has(childOutput["__LAST_TIER__"])) {
                newOutput["__LAST_TIER__"] = childOutput["__LAST_TIER__"];
                newOutput["__LAST_CHAR__"] = childOutput["__LAST_CHAR__"];
            }
            yield [newOutput, new ProjectionState(childNext, this.tiers)];
        }
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {

        for (const nextState of this.child.require(tier, target, symbols)) {
            yield new ProjectionState(nextState, this.tiers);
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

    public calculateTiers(symbolStack: string[]): Set<string> {
        const results: Set<string> = new Set();
        for (const tier in this.child.calculateTiers(symbolStack)) {
            if (tier == this.fromTier) {
                results.add(this.toTier);
                continue;
            }
            results.add(tier);
        }
        return results;
    }

    public *query(prevOutput: StringDict,
        symbols: CounterStack): Gen<[StringDict, State]> {

        for (const [childOutput, childNext] of this.child.query(prevOutput, symbols)) {
            const myOutput: StringDict = {};
            for (const tier in childOutput) {
                if (tier == this.fromTier) {
                    myOutput[this.toTier] = childOutput[tier];
                    continue;
                }
                myOutput[tier] = childOutput[tier];
            }
            yield [myOutput, new RenameState(childNext, this.fromTier, this.toTier)];
        }
    }

    public *require(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<State> {

        if (tier == this.fromTier) {
            tier = this.toTier;
        }

        yield* this.child.require(tier, target, symbols);
    }
     

}