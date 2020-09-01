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

const ANY: string = "__ANY__";
const NONE: string = "__NONE__";

export type StringDict = {[key: string]: string};


class Output {

    constructor(
    ) { }

    public add(tier: string, text: string) {
        return new SuccessiveOutput(tier, text, this);
    }

    public toObj(): StringDict {
        return {};
    }
}

class SuccessiveOutput extends Output {

    constructor(
        public tier: string,
        public text: string,
        public prev: Output
    ) { 
        super();
    }

    public toObj(): StringDict {
        const result = this.prev.toObj();
        if (!(this.tier in result)) {
            result[this.tier] = "";
        }
        result[this.tier] += this.text;
        return result;
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
        target: string,
        symbols: CounterStack): Gen<[string, string, State]>;

        
    public *run(maxRecursion: number = 4): Gen<StringDict> {
        yield* this.breadthFirst(maxRecursion);
    }

    public *depthFirst(maxRecursion: number = 4): Gen<StringDict> {

        const initialOutput: Output = new Output();
        var stateStack: [Output, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);

        for (var topPair; topPair = stateStack.pop(); ) {

            const [prevOutput, prevState] = topPair;

            if (prevState.accepting()) {
                yield prevOutput.toObj();
            }

            for (const [tier, c, newState] of prevState.probe(ANY, ANY, symbolStack)) {
                const nextOutput = prevOutput.add(tier, c);
                stateStack.push([nextOutput, newState]);
            }
        }
    }

    public *breadthFirst(maxRecursion: number = 4): Gen<StringDict> {
        const initialOutput: Output = new Output();
        var stateQueue: [Output, State][] = [[initialOutput, this]];
        var symbolStack = new CounterStack(maxRecursion);

        for (var i = 0; i < stateQueue.length; i++) {

            const [prevOutput, prevState] = stateQueue[i];

            if (prevState.accepting()) {
                yield prevOutput.toObj();
            }

            for (const [tier, c, newState] of prevState.probe(ANY, ANY, symbolStack)) {
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
        target: string,
        symbols: CounterStack): Gen<[string, string, State]> {

        if (tier != ANY && tier != this.tier) {      // If the probe asks for a specific tier
            yield [tier, target, this];  // and it's not the tier we 
            return;                                  // care about, stay in place
        }
        
        if (this.accepting()) {
            return;
        }

        const nextState = new AnyCharState(this.tier, true);
        yield [this.tier, target, nextState];

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

    public accepting(): boolean {
        return this.text == "";
    }

    public *probe(tier: string, 
        target: string,
        symbols: CounterStack): Gen<[string, string, State]> {

        // If the probe asks for a specific tier and it's not the tier we care about, stay in place
        if (tier != ANY && tier != this.tier) {
            yield [tier, target, this];
            return;
        }
        
        // If it is the tier we care about, and we don't match, fail
        if (this.text == "" || (target != ANY && this.text[0] != target)) {
            return; // failure
        }

        // it's a match, or the target was __ANY__
        const nextState = new LiteralState(this.tier, this.text.slice(1)); // success
        yield [this.tier, this.text[0], nextState];

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

    public accepting(): boolean {
        return this.child1.accepting() && this.child2.accepting();
    }
}

export class ConcatState extends BinaryState {

    public *probe(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<[string, string, State]> {

        if (this.child1.accepting()) { 
            yield* this.child2.probe(tier, target, symbols);
            return;
        } 

        for (const [child1tier, child1text, child1next] of this.child1.probe(tier, target, symbols)) {

            if (child1next == this.child1) { 
                // child1 didn't go anywhere, probably not interested in the requested tier
                // move on to child2
                for (const [c1tier, c1text, child2Next] of this.child2.probe(tier, target, symbols)) {
                    if (child2Next.accepting()) {
                        yield [c1tier, c1text, this.child1];
                        continue;
                    } 
                    yield [c1tier, c1text, new ConcatState(this.child1, child2Next)];
                }
                continue;
            }

            if (child1next.accepting()) {
                yield [child1tier, child1text, this.child2];
                continue;
            }
            yield [child1tier, child1text, new ConcatState(child1next, this.child2)];
        }
        return;

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

    public *probe(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<[string, string, State]> {

        for (const child of this.children) {
            yield* child.probe(tier, target, symbols);
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
                          target: string,
                          c1: State,
                          c2: State,
                          symbols: CounterStack): Gen<[string, string, State]> {
                              
        for (const [c1tier, c1target, child1next] of c1.probe(tier, target, symbols)) {

            if (c1tier == NONE) {
                yield [c1tier, c1target, new JoinState(child1next, c2)];
                return;
            }
            
            for (const [c2tier, c2target, child2next] of c2.probe(c1tier, c1target, symbols)) {
                yield [c2tier, c2target, new JoinState(child1next, child2next)];
            }
        } 
    }

    public *probe(tier: string, 
                    target: string,
                    symbols: CounterStack): Gen<[string, string, State]> {

        const leftJoin = this.probeLeftJoin(tier, target, this.child1, this.child2, symbols);
        const rightJoin = this.probeLeftJoin(tier, target, this.child2, this.child1, symbols);
        yield* iterPriorityUnion(leftJoin, rightJoin);
    }

}

abstract class UnaryState extends State {

    public abstract get child(): State;

    public get id(): string {
        return `${this.constructor.name}(${this.child.id})`;
    }

    public accepting(): boolean {
        return this.child.accepting();
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

    public *probe(tier: string, 
                target: string,
                symbols: CounterStack): Gen<[string, string, State]> {

        if (symbols.exceedsMax(this.symbolName)) {
            return;
        }

        symbols = symbols.add(this.symbolName);
        for (const [childTier, childTarget, childNext] of this.child.probe(tier, target, symbols)) {
            yield [childTier, childTarget, this.successor(childNext)];
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
        target: string,
        symbols: CounterStack): Gen<[string, string, State]> {


        if (tier != ANY && !this.tierRestriction.has(tier)) {
            // if it's not a tier without our restriction, go nowhere
            yield [tier, target, this];
        }

        for (var [childTier, childTarget, childNext] of this.child.probe(tier, target, symbols)) {

            if (childTier != ANY && !this.tierRestriction.has(childTier)) {
                childTier = NONE;
                childTarget = NONE;
            }
            yield [childTier, childTarget, new ProjectionState(childNext, this.tierRestriction)];
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

    public *probe(tier: string, 
                target: string,
                symbols: CounterStack): Gen<[string, string, State]> {

        if (tier == this.toTier) {
            tier = this.fromTier;
        }
    
        for (var [childTier, childTarget, childNext] of this.child.probe(tier, target, symbols)) {
            if (childTier == this.fromTier) {
                childTier = this.toTier;
            }
            yield [childTier, childTarget, new RenameState(childNext, this.fromTier, this.toTier)];
        }
    }
}