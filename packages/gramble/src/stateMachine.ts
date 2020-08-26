import { Gen } from "./util";

/**
 * This is the parsing engine that underlies Gramble.
 * It executes a multi-tape push-down state machine.
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
 *      - "Push-down" means that the machine has access to a stack,
 *      making it possible to parse recursive grammars.  
 *      
 * The execution of this particular state machine is lazy, 
 * in the sense that at no point is the entire machine ever 
 * constructed, let alone made deterministic.  Each state 
 * constructs successor states whenever necessary.
 * 
 */

export type SymbolTable = {[key: string]: State};
export type StringDict = {[key: string]: string};

export abstract class State {

    public abstract get id(): string;
    
    public abstract get tiers(): Set<string>;

    public abstract accepting(): boolean;

    public abstract query(prevOutput: StringDict): 
                Gen<[StringDict, State]>;

    public abstract require(tier: string, 
        target: string): Gen<State>;

        
    public *run(): Gen<StringDict> {
        yield* this.depthFirst();
    }

    public *depthFirst(): Gen<StringDict> {

        const initialOutput: StringDict = {};
        var stateStack: [StringDict, State][] = [[initialOutput, this]];

        for (var topPair; topPair = stateStack.pop(); ) {

            const [prevOutput, prevState] = topPair;

            if (prevState.accepting()) {
                yield prevOutput;
            }

            for (const [newOutput, newState] of prevState.query(prevOutput)) {
                stateStack.push([newOutput, newState]);
            }
        }
    }

    public *breadthFirst(): Gen<StringDict> {
        const initialOutput: StringDict = {};
        var stateQueue: [StringDict, State][] = [[initialOutput, this]];

        for (var i = 0; i < stateQueue.length; i++) {

            const [prevOutput, prevState] = stateQueue[i];

            if (prevState.accepting()) {
                yield prevOutput;
            }

            for (const [newOutput, newState] of prevState.query(prevOutput)) {
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

    public get tiers(): Set<string> {
        return new Set([this.tier]);
    }

    public accepting(): boolean {
        return this.text == "";
    }

    public *query(prevOutput: StringDict): Gen<[StringDict, State]> {
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


    public *require(tier: string, target: string): Gen<State> {
        if (tier != this.tier) {
            yield this;
            return;
        }
        
        if (this.text == "") {
            return;
        }

        if (this.text[0] != target) {
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
    

    public get tiers(): Set<string> {
        return new Set([...this.child1.tiers, ...this.child2.tiers]);
    }

}


export class ConcatState extends BinaryState {

    
    public get id(): string {
        return `${this.child1.id}+${this.child2.id}`;
    }
    
    public accepting(): boolean {
        return false;
    }

    public *query(prevOutput: StringDict): Gen<[StringDict, State]> {
        if (this.child1.accepting()) {
            yield* this.child2.query(prevOutput);
            return;
        }

        for (const [child1Output, child1Next] of this.child1.query(prevOutput)) {
            yield [child1Output, new ConcatState(child1Next, this.child2)];
        }
    }

    public *require(tier: string, target: string): Gen<State> {
        if (this.child1.accepting()) { 
            yield* this.child2.require(tier, target);
            return;
        } 

        if (this.child1.tiers.has(tier)) {
            for (const child1next of this.child1.require(tier, target)) {
                if (child1next.accepting()) {
                    yield this.child2;
                    return;
                }
                yield new ConcatState(child1next, this.child2);
            }
            return;
        }

        for (const child2Next of this.child2.require(tier, target)) {
            if (child2Next.accepting()) {
                yield this.child1;
                return;
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

    public get tiers(): Set<string> {
        const result: Set<string> = new Set();
        for (const child of this.children) {
            for (const tier of child.tiers) {
                result.add(tier);
            }
        }
        return result;
    }

    public get id(): string {
        return `(${this.children.map(c => c.id).join("|")})`;
    }

    public *query(prevOutput: StringDict): Gen<[StringDict, State]> {
        for (const child of this.children) {
            yield* child.query(prevOutput);
        }
    }

    public *require(tier: string, target: string): Gen<State> {
        for (const child of this.children) {
            yield* child.require(tier, target);
        }
    }
}

export class JoinState extends BinaryState {

    public accepting(): boolean {
        return this.child1.accepting() && this.child2.accepting();
    }

    public get id(): string {
        return `(${this.child1.id}&${this.child2.id})`;
    }

    public *query(prevOutput: StringDict): Gen<[StringDict, State]> {

        if (this.accepting()) {
            return;
        }

        var emittedAlready = false;
        for (const [o1, newChild1] of this.child1.query(prevOutput)) {
            const tier = o1["__LAST_TIER__"];
            const c = o1["__LAST_CHAR__"];

            if (!("__LAST_TIER__" in o1) || !this.child2.tiers.has(tier)) {
                yield [o1, new JoinState(newChild1, this.child2)];
                emittedAlready = true;
                continue;
            }
            
            for (const newChild2 of this.child2.require(tier, c)) {
                yield [o1, new JoinState(newChild1, newChild2)];
                emittedAlready = true;
            }
        }

        if (emittedAlready) {
            return;
        }
        
        for (const [o2, newChild2] of this.child2.query(prevOutput)) {
            const tier = o2["__LAST_TIER__"];
            const c = o2["__LAST_CHAR__"];
            if (!("__LAST_TIER__" in o2) || !this.child1.tiers.has(tier)) {
                yield [o2, new JoinState(this.child1, newChild2)];
                continue;
            }
            for (const newChild1 of this.child1.require(tier, c)) {
                yield [o2, new JoinState(newChild1, newChild2)];
            }
        }
    }

    public *require(tier: string, target: string): Gen<State> {
        
        var child1nexts: Iterable<State> = [ this.child1 ];
        var child2nexts: Iterable<State> = [ this.child2 ];

        if (this.child1.tiers.has(tier)) {
            child1nexts = this.child1.require(tier, target);
        }
        
        if (this.child2.tiers.has(tier)) {
            child2nexts = this.child2.require(tier, target);
        }

        for (const child1next of child1nexts) {
            for (const child2next of child2nexts) {
                yield new JoinState(child1next, child2next);
            }
        }
    }
}


export class EmbedState extends State {

    constructor(
        public symbolName: string,
        public symbolTable: SymbolTable
    ) { 
        super();
    }

    public get id(): string {
        return `${this.symbolName}`;
    }

    public get tiers(): Set<string> {
        return this.child.tiers;
    }

    public get child(): State {
        if (!(this.symbolName in this.symbolTable)) {
            throw new Error(`Cannot find symbol name ${this.symbolName}`);
        }
        return this.symbolTable[this.symbolName];
    }

    public accepting(): boolean {
        return false;
    }

    public *query(prevOutput: StringDict): Gen<[StringDict, State]> {
        yield* this.child.query(prevOutput);
    }

    public *require(tier: string, target: string): Gen<State> {
        yield* this.child.require(tier, target);
    }
}


export class ProjectionState extends State {

    constructor(
        public child: State,
        public tiers: Set<string>
    ) { 
        super();
    }
    
    public accepting(): boolean {
        return this.child.accepting();
    }


    public get id(): string {
        return `PRJ:${[...this.tiers]}[${this.child.id}]`;
    }
    
    public *query(output: StringDict): Gen<[StringDict, State]> {

        for (const [childOutput, childNext] of this.child.query(output)) {
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
                    target: string): Gen<State> {

        for (const nextState of this.child.require(tier, target)) {
            yield new ProjectionState(nextState, this.tiers);
        }
    }
}
