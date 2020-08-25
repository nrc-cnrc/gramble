import { Gen, setChain } from "./util";
import { assert } from "console";

export type SymbolTable = {[key: string]: SMComponent};
type StringDict = {[tier: string]: string};

export class CellPos {
    constructor(
        public sheet: string = "",
        public row: number = -1,
        public col: number = -1
    ) { }

    public toString(): string {
        return `${this.sheet}/${this.row}/${this.col}`;
    }
}

export abstract class SMState {

    public abstract get id(): string;
    
    public abstract get tiers(): Set<string>;

    public allAccepting(): boolean {
        const result = [...this.tiers].every(t => this.accepting(t));
        return result;
    }

    public accepting(tier: string): boolean {
        return false;
    }

    public abstract query(tier: string,
        prevOutput: SMOutput): Gen<[SMOutput, SMState]>;

    public abstract require(tier: string, 
        target: string): Gen<SMState>;
}

export class SMOutput { 

    constructor(
        public readonly tier: string = "",
        public readonly c: string = ""
    ) { }

    public next(tier: string, c: string): SMOutput {
        return new SMSubsequentOutput(tier, c, this);
    }

    public toObj(): StringDict {
        return {};
    }

    public toString(): string {
        return JSON.stringify(this.toObj());
    }
}

class SMSubsequentOutput extends SMOutput {

    constructor(
        tier: string,
        c: string,
        public prev: SMOutput
    ) { 
        super(tier, c);
    }

    public toObj(): StringDict {
        const result: StringDict = {};
        Object.assign(result, this.prev.toObj());
        if (!(this.tier in result)) {
            result[this.tier] = "";
        }
        result[this.tier] += this.c;
        return result;
    }

}

export abstract class SMComponent {

    constructor(
        public pos: CellPos
    ) { }

    private _tiers: Set<string> | undefined = undefined;

    public get tiers(): Set<string> {
        if (this._tiers == undefined) {
            this._tiers = this.calculateTiers([]);
        }
        return this._tiers;
    }

    public abstract calculateTiers(symbolStack: string[]): Set<string>;
    public abstract firstState(): SMState;

    public* run(): Gen<SMOutput> {
        const initialState = this.firstState();
        const initialOutput = new SMOutput();
        var stateStack: [SMOutput, SMState][] = [[initialOutput, initialState]];

        //console.log("------------");
        for (var topPair; topPair = stateStack.pop(); ) {

            const [topOutput, topState] = topPair;

            if (topState.allAccepting()) {
                yield topOutput;
            }

            var emitted = false;
            for (const tier of this.tiers) {
                for (const [newOutput, newState] of topState.query(tier, topOutput)) {
                    //console.log(`got ${newOutput.tier}:${newOutput.c}`);
                    stateStack.push([newOutput, newState]);
                    emitted = true;
                }
                if (emitted) {
                    break;
                }
            }
        }

        //console.log();
    }
}

abstract class SMComponentState<T extends SMComponent> extends SMState  {

    constructor(
        public component: T
    ) {
        super();
    }

    public get tiers(): Set<string> {
        return this.component.tiers;
    }

}


export class SMLiteralComponent extends SMComponent {

    constructor(
        public tier: string,
        public text: string,
        pos: CellPos
    ) { 
        super(pos);
    }

    public calculateTiers(symbolStack: string[]): Set<string> {
        return new Set([this.tier]);
    }

    public firstState(): SMState {
        return new SMLiteralState(this);
    }
}

class SMLiteralState extends SMComponentState<SMLiteralComponent> {

    constructor(
        component: SMLiteralComponent,
        public index: number = 0
    ) { 
        super(component);
    }

    public get tier(): string {
        return this.component.tier;
    }

    public get c(): string {
        if (this.index >= this.component.text.length) {
            return "";
        }
        return this.component.text[this.index];
    }

    public get id(): string {
        return `LIT:${this.component.pos}[${this.index}]`;
    }

    public successor() {
        return new SMLiteralState(this.component, this.index+1);
    }

    public accepting(tier: string): boolean {
        if (tier != this.tier) {
            return true;
        }
        return this.index >= this.component.text.length;
    } 

    public *query(tier: string,
                  prevOutput: SMOutput): Gen<[SMOutput, SMState]> {

        if (this.accepting(tier)) {
            return; // accepting SMLiteralStates (those that are 
        }           // on an irrelevant tier, or have an index beyond the
                    // literal) have no successors

        yield [prevOutput.next(tier, this.c), this.successor()];
    }

    public *require(tier: string, 
                   target: string): Gen<SMState> {

        if (this.accepting(tier)) {
            return; // accepting SMLiteralStates (those that are 
        }           // on an irrelevant tier, or have an index beyond the
                    // literal) have no successors
        

        if (target != this.c) {
            return;  // failed
        }
        yield this.successor();
    }
}


abstract class SMNAryComponent extends SMComponent {

    constructor(
        public children: SMComponent[],
        pos: CellPos
    ) {
        super(pos);
        if (children.length == 0) {
            throw new Error("Attempting to create an n-ary component with no children");
        }
    }
    
    public calculateTiers(symbolStack: string[]): Set<string> {
        const childTiers = this.children.map(o => o.calculateTiers(symbolStack));
        return setChain(childTiers);
    }

}

export class SMSequenceComponent extends SMNAryComponent {

    public firstState(): SMState {
        const result = new SMSequenceState(this);
        result.initialize();
        return result;
    }
}

class SMSequenceState extends SMComponentState<SMSequenceComponent> {

    public childStates: {[tier: string]: SMState} = {};
    public childIndices: {[tier: string]: number} = {};

    constructor(
        component: SMSequenceComponent,
    ) {
        super(component);
    }

    public initialize(): void {
        for (const tier of this.tiers) {
            this.childStates[tier] = this.component.children[0].firstState();
            this.childIndices[tier] = 0;
            this.incrementOnTier(tier);
        }
    }

    public accepting(tier: string): boolean {
        if (!this.tiers.has(tier)) {
            return true;
        }
        return this.childIndices[tier] >= this.component.children.length;
    }
    
    public get id(): string {
        return `SEQ:${this.component.pos}`;
    }

    public successorOnTier(tier: string, nextChild: SMState): SMSequenceState {
        const result = new SMSequenceState(this.component);
        Object.assign(result.childStates, this.childStates);
        Object.assign(result.childIndices, this.childIndices);
        result.childStates[tier] = nextChild;
        result.incrementOnTier(tier);
        return result;
    }

    public *query(tier: string,
                    prevOutput: SMOutput): Gen<[SMOutput, SMState]> {
        
        if (this.accepting(tier)) {
            return; // accepting SMSequenceState states have no successor
        } 
        
        for (var [nextOutput, nextState] of this.childStates[tier].query(tier, prevOutput)) {
            yield [nextOutput, this.successorOnTier(tier, nextState)];
        }
    }

    
    public *require(tier: string,
        target: string): Gen<SMState> {

        if (this.accepting(tier)) {
            return; // accepting SMSequenceState states have no successor
        } 
        
        for (var nextState of this.childStates[tier].require(tier, target)) {
            yield this.successorOnTier(tier, nextState);
        }
    }
    

    public incrementOnTier(tier: string): void {
        while (this.childStates[tier].accepting(tier)) {
            // if we've reached the end of the child, increment our index
            this.childIndices[tier]++; 
            if (this.childIndices[tier] >= this.component.children.length) {
                break;
            }
            this.childStates[tier] = this.component.children[this.childIndices[tier]].firstState();
        } 
    }
}


export class SMUnionComponent extends SMNAryComponent {

    public firstState(): SMState {
        return new SMUnionState(this);
    }
}

class SMUnionState extends SMComponentState<SMUnionComponent> {

    constructor(
        component: SMUnionComponent,
    ) {
        super(component);
    }


    public get id(): string {
        return `ALT:${this.component.pos}`;
    }

    public *query(tier: string, 
                  prevOutput: SMOutput): Gen<[SMOutput, SMState]> {

        yield *this.distribute((childState: SMState) => 
            childState.query(tier, prevOutput)
        );
    }

    
    public *require(tier: string, 
                    target: string): Gen<SMState> {

        yield *this.distribute((childState: SMState) => 
            childState.require(tier, target)
        );
    }


    public *distribute<T>(gen: (child: SMState) => Gen<T>): Gen<T> {
        for (const childComponent of this.component.children) {
            const childState = childComponent.firstState();
            yield* gen(childState);
        }
    }
}


export class SMEmbedComponent extends SMComponent {

    constructor(
        public symbolName: string,
        public symbolTable: SymbolTable,
        pos: CellPos,
    ) { 
        super(pos);
    }

    
    public calculateTiers(symbolStack: string[]): Set<string> {
        if (symbolStack.indexOf(this.symbolName) != -1) {
            return new Set();
        }
        return this.child.tiers;
    }


    public get child(): SMComponent {
        if (!(this.symbolName in this.symbolTable)) {
            throw new Error(`Symbol ${this.symbolName} not found in symbol table`);
        }
        return this.symbolTable[this.symbolName];
    }

    public firstState(): SMState {
        const childState = this.child.firstState();
        return new SMEmbedState(childState, this);
    }
} 

class SMEmbedState extends SMComponentState<SMEmbedComponent> {

    constructor(
        public child: SMState,
        component: SMEmbedComponent,
    ) { 
        super(component);
    }

    public get breadcrumb(): SMState {
        return this.child;
    }

    public get id(): string {
        return `EMB:${this.component.symbolName}[${this.child.id}]`;
    }

    public accepting(tier: string): boolean {
        return this.child.accepting(tier);
    }

    public *query(tier: string, 
        output: SMOutput): Gen<[SMOutput, SMState]> {

        for (const [nextOutput, nextState] of this.child.query(tier, output)) {
            yield [nextOutput, new SMEmbedState(nextState, this.component)];
        }
    }

    public *require(tier: string, 
        target: string): Gen<SMState> {

        for (const nextState of this.child.require(tier, target)) {
            yield new SMEmbedState(nextState, this.component);
        }
    }
}

/*
export class SMBinaryComponent extends SMComponent {

    constructor(
        public child1: SMComponent,
        public child2: SMComponent,
        pos: CellPos 
    ) {
        super(pos);
    }
}

export class SMIntersectionComponent extends SMComponent {


} */


export class SMNaturalJoinComponent extends SMComponent {

    constructor(
        public child1: SMComponent,
        public child2: SMComponent,
        pos: CellPos
    ) {
        super(pos);
    }

    public calculateTiers(symbolStack: string[]): Set<string> {
        return new Set([...this.child1.tiers, ...this.child2.tiers]);
    }

    public firstState(): SMState {
        const child1first = this.child1.firstState();
        const child2first = this.child2.firstState();
        return new SMNaturalJoinState(child1first, child2first, this);
    }
}



export class SMNaturalJoinState extends SMComponentState<SMNaturalJoinComponent> {

    constructor(
        public child1: SMState,
        public child2: SMState,
        component: SMNaturalJoinComponent
    ) {
        super(component);
    }

    public get id(): string {
        return `JOIN:(${this.child1.id} ^ ${this.child2.id})`;
    }

    public accepting(tier: string): boolean {
        return this.child1.accepting(tier) && this.child2.accepting(tier);
    }
    
    public next(newChild1: SMState, newChild2: SMState) {
        return new SMNaturalJoinState(newChild1, newChild2, this.component);
    }

    public *require(tier: string, 
                    target: string): Gen<SMState> {

        const child1hasTier = this.component.child1.tiers.has(tier);
        const child2hasTier = this.component.child2.tiers.has(tier);

        if (child1hasTier && child2hasTier) {
            for (const newChild1 of this.child1.require(tier, target)) {
                for (const newChild2 of this.child2.require(tier, target)) {
                    yield this.next(newChild1, newChild2);
                }
            }
            return;
        }

        if (child1hasTier) {
            for (const newChild1 of this.child1.require(tier, target)) {
                yield this.next(newChild1, this.child2);
            }
            return;

        }

        for (const newChild2 of this.child2.require(tier, target)) {
            yield this.next(this.child1, newChild2);
        }
    }

    public *query(tier: string, 
                prevOutput: SMOutput): Gen<[SMOutput, SMState]> {

        if (this.accepting(tier)) {
            return;
        }
        
        const child1hasTier = this.component.child1.tiers.has(tier);
        const child2hasTier = this.component.child2.tiers.has(tier);

        if (child1hasTier && child2hasTier) {
            for (const [o1, newChild1] of this.child1.query(tier, prevOutput)) {
                for (const newChild2 of this.child2.require(tier, o1.c)) {
                    yield [o1, this.next(newChild1, newChild2)];
                }
            }
            return;
        }

        if (child1hasTier) {
            for (const [o1, newChild1] of this.child1.query(tier, prevOutput)) {
                yield [o1, new SMNaturalJoinState(newChild1, this.child2, this.component)];

            }
            return;
        }

        // the tier is only in child2, go ahead and yield
        for (const [o2, newChild2] of this.child2.query(tier, prevOutput)) {
            yield [o2, new SMNaturalJoinState(this.child1, newChild2, this.component)];
        }
    }
}
