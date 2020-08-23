import { Gen, setChain } from "./util";
import { assert } from "console";

/**
 * This is the parsing engine that underlies Gramble.
 * It executes a multi-tape push-down state machine.
 * 
 *      - "Multi-tape" means that there are multiple "tapes"
 *      (in the Turing machine sense) from/to which the machine
 *      can read/write.  Like a finite-state transducer, the "heads"
 *      on each tape can only move forward, and each tape is either
 *      read-only or write-only.  Unlike a finite-state transducer,
 *      we can have any number of tapes, not just two, and a machine
 *      can read from or write to multiple tapes.  We don't specify
 *      in advance what directions are possible; any combination of input
 *      and output tapes is possible.
 * 
 *      - "Push-down" means that the machine has access to a stack,
 *      making it possible to parse recursive grammars.  
 *      
 * The execution of this particular state machine is lazy, 
 * in the sense that at no point is the entire machine ever 
 * constructed, let alone made deterministic.  Each state 
 * constructs successor states whenever necessary.
 * 
 * At each point, we can ask a state "What states can you get
 * to by consuming character c off of tape t?", and also
 * "What states can you get to without consuming any input?"
 * 
 * There are two kinds of objects described in this file.
 * 
 *   (a) Grammar components, like [SMLiteralComponent] or
 *      [SMSequenceComponent], that describe the grammar
 *      being parsed.
 * 
 *   (b) State components, which encapsulate a particular state
 *      of parsing.  State components typically contain a reference
 *      to a grammar component, any additional information necessary
 *      to describe "where" they currently are within that component,
 *      and a "breadcrumb" trail of past states from which outputs
 *      can eventually be read.
 * 
 * To contrast this with an explicit state graph:
 * 
 *      - If we were constructing an explicit state graph, we might 
 *      turn a Literal "foo" into a series of four nodes, and then
 *      put "f", "o", and "o" on the edges between those nodes.  Then
 *      when it comes times to parse, our "state" would consist of a 
 *      reference to that node, and we would follow the edges (when
 *      they match our input, of course) to new states.
 * 
 *      - Instead, our actual state object only consists of a pointer
 *      to that original Literal object, and an index into that literal.
 *      When it comes times to parse, we get text[index] from that literal,
 *      and if it matches, generate a successor state that's basically the
 *      same except with index+1.
 * 
 * This example is almost trivial, and it doesn't really matter which way
 * we go for something as simple as a Literal.  But it pays off for complex
 * components, like ones that allow recursion (we don't have to recurse 
 * ahead of time, just when necessary), and intersections of two grammars 
 * (we don't have to generate the complete intersection of the two grammars, 
 * just the parts we can actually get to).
 * 
 * Each kind of grammar component is typically associated with a dedicated
 * kind of state, which keeps the kind of information you need for parsing 
 * that kind of component (e.g. indices and such).  Each component is 
 * responsible for producing an appropriate first state for parsing 
 * itself; e.g. [SMLiteralComponent.firstState] returns a [SMLiteralState] 
 * with a reference to itself and the index 0.
 * 
 * States can contain other states; indeed this is how most of the real work
 * of the grammar gets done.
 * 
 *      - The [SMIntersectionState], which is associated with 
 *      [SMIntersectionComponent], contains two child states, each one
 *      describing the current parse state of each grammar being
 *      intersected.
 * 
 *      - The [SMEmbedState], which handles grammars embedded as symbols 
 *      into other grammars, contains a child state describing where in 
 *      the embedded grammar the current parse state is.  (This is actually 
 *      the only place where we have a "stack"; from the point of view of 
 *      the other components/states, we might as well be a non-push-down/
 *      non-recursive automaton.) 
 * 
 *      - Actually, we handle concatenations like this as well, with the
 *      [SMSequenceState] keeping an index into a sequence of child components, 
 *      and its child state holding the current parse state with respect to the
 *      child component at that index.  This is kinda overkill, but it 
 *      simplified some other aspects of the algorithm.
 */

export type SymbolTable = {[key: string]: SMComponent};

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

class SMTextUnit {

}

const EPSILON = new SMTextUnit();

class TieredText {
    constructor(
        public tier: string,
        public c: string
    ) { }
}


export abstract class SMState {

    public abstract get id(): string;

    public get accepting(): boolean {
        return false;
    }
    
    public *transit(tier: string, 
        target: string, 
        inTiers: Set<string>): Gen<[string, string, SMState]> { 
    }

    public abstract outputAsObj(): StringDict;
}

type StringDict = {[tier: string]: string};

class SMStartState extends SMState {

    public get id(): string { return "S" };
    public outputAsObj(): StringDict {
        return { };
    }
}

abstract class SMComponentState<T extends SMComponent> extends SMState {

    constructor(
        public component: T
    ) {
        super();
    }

    public abstract get breadcrumb(): SMState;

    public outputAsObj(): StringDict {
        return this.breadcrumb.outputAsObj();
    }
}

/**
 * SMComponent
 * 
 * The abstract base class for all grammar components (e.g.
 * literals, concatenations, etc.).  Grammar components form 
 * a tree: unions, sequences, intersections etc. contain other
 * components as their children, with the leaf nodes being
 * either literals [SMLiteralComponent] or symbols [SMEmbedComponent].
 * 
 * Components need to do two things: 
 *    (a) they need to be able to provide inital states for 
 *        state traversal, 
 *    (b) they need to be able to say what tapes their grammar
 *        can read or write to.
 * 
 * States typically retain references to the component that created
 * them (or, if these states were created by previous states, the
 * component that created their ultimate ancestor).  That way individual
 * states don't have to keep track of information that doesn't change
 * in lineages of states, things like what tiers can be affected.
 */

abstract class SMComponent {

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
    public abstract firstState(breadcrumb: SMState): SMState;

    public* run(): Gen<SMState> {
        const inTiers: Set<string> = new Set();
        const firstState = this.firstState(new SMStartState());
        var stateStack: SMState[] = [firstState];

        //console.log("------------");
        for (var topState; topState = stateStack.pop(); ) {

            if (topState.accepting) {
                //console.log(JSON.stringify(topState.outputAsObj()));
                yield topState;
                continue;
            }

            for (const [t, c, nextState] of topState.transit("__eps__", "__eps__", inTiers)) {
                stateStack.push(nextState);
            }
        }

        console.log();
    }
}

/**
 * SMLiteralComponent
 * 
 * Represents a literal (e.g. a root or suffix) on a particular
 * tier (e.g. "gloss").  
 */

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



    public firstState(breadcrumb: SMState): SMState {
        return new SMLiteralState(this, breadcrumb);
    }
}

class SMLiteralState extends SMComponentState<SMLiteralComponent> {

    constructor(
        component: SMLiteralComponent,
        public breadcrumb: SMState,
        public index: number = 0
    ) { 
        super(component);
    }

    public get breadcrumbs(): SMState[] {
        return [this.breadcrumb];
    }

    public outputAsObj(): StringDict {
        const result = this.breadcrumb.outputAsObj();
        if (this.tier == "__eps__" || this.tier == "") {
            return result;
        }
        if (!(this.tier in result)) {
            result[this.tier] = "";
        } 
        result[this.tier] = result[this.tier] + this.c;
        return result;
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
        return new SMLiteralState(this.component, this, this.index+1);
    }

    public get accepting(): boolean {
        return this.index >= this.component.text.length;
    } 

    public *transit(tier: string, 
                    target: string, 
                    inTiers: Set<string>): Gen<[string, string, SMState]> {

        if (this.accepting) {
            return;
        }

        if (!inTiers.has(this.tier)) {
            // We're not consuming, emit the next character
            yield [this.tier, this.c, this.successor()];
            return;
        }

        // We're consuming, so if we match, we're good, emit an epsilon.
        if (this.tier == tier && this.c == target) {
            yield ["__eps__", "__eps__", this.successor()];
        }

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

    public firstState(breadcrumb: SMState): SMState {
        const childState = this.child.firstState(breadcrumb);
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

    public get accepting(): boolean {
        return this.child.accepting;
    }

    public *transit(tier: string, 
        target: string, 
        inTiers: Set<string>): Gen<[string, string, SMState]> {

        //assert(!this.accepting, `${this.id} is accepting yet transits`);

        for (const [t, c, nextState] of 
                this.child.transit(tier, target, inTiers)) {
            yield [t, c, new SMEmbedState(nextState, this.component)];
        }
    }
}

export class SMIntersectionComponent extends SMComponent {

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

    public firstState(breadcrumb: SMState): SMState {
        const child1first = this.child1.firstState(breadcrumb);
        const child2first = this.child2.firstState(breadcrumb);
        return new SMIntersectionState(child1first, child2first, this);
    }
}

export class SMIntersectionState extends SMComponentState<SMIntersectionComponent> {

    constructor(
        public child1: SMState,
        public child2: SMState,
        component: SMIntersectionComponent
    ) {
        super(component);
    }

    public get breadcrumb(): SMState {
        return this.child2;
    }

    public outputAsObj(): {[tier: string]: string} {
        const result = this.breadcrumb.outputAsObj();
        const child1result = this.child1.outputAsObj();
        for (const tier in child1result) {
            if (tier in result) {
                assert(result[tier] == child1result[tier], 
                    `Found different results in ${this.id}: ${child1result[tier]} vs ${result[tier]}`);
                continue;
            }
            result[tier] = child1result[tier];
        }
        return result;
    } 

    public get id(): string {
        return `INT:(${this.child1.id} ^ ${this.child2.id})`;
    }

    public get accepting(): boolean {
        return this.child1.accepting && this.child2.accepting;
    }
    

    public *transit(tier: string, 
        target: string, 
        inTiers: Set<string>): Gen<[string, string, SMState]>  {

        //assert(!this.accepting, `${this.id} is accepting yet transits`);

        const inTiers1 = this.component.child1.tiers;
        const inTiers2 = this.component.child2.tiers;

        if (inTiers.has(tier)) {

            const nextChildren1: SMState[] = [];
            if (this.component.child1.tiers.has(tier)) {
                for (const [t1, c1, nextChild1] of this.child1.transit(tier, target, inTiers)) {
                    assert(t1 == "__eps__" && c1 == "__eps__", `Expected epsilon during consume from ${this.child1.id}, got ${t1}:${c1}`);
                    nextChildren1.push(nextChild1);
                }
            } else {
                nextChildren1.push(this.child1);
            }

            if (nextChildren1.length == 0) {
                return;
            }

            const nextChildren2: SMState[] = [];
            if (this.component.child2.tiers.has(tier)) {
                for (const [t2, c2, nextChild2] of this.child2.transit(tier, target, inTiers)) {
                    assert(t2 == "__eps__" && c2 == "__eps__", `Expected epsilon during consume from ${this.child2.id}, got ${t2}:${c2}`);
                    nextChildren2.push(nextChild2);
                }
            } else {
                nextChildren2.push(this.child2);
            }

            for (const nextChild1 of nextChildren1) {
                for (const nextChild2 of nextChildren2) {
                    yield ["__eps__", "__eps__", new SMIntersectionState(nextChild1, nextChild2, this.component)];
                }
            }
        }

        var emittedAlready = false;

        for (const [t1, c1, nextChild1] of this.child1.transit("__eps__", "__eps__", inTiers)) {
            
            assert(t1 != "__eps__" && c1 != "__eps__", `Inside intersection: Expected a t:c from ${this.child1.id}, but got epsilon`);

            if (!inTiers2.has(t1)) {
                yield [t1, c1, new SMIntersectionState(nextChild1, this.child2, this.component)];
                emittedAlready = true;
                continue;
            }

            for (const [t2, c2, nextChild2] of this.child2.transit(t1, c1, inTiers2)) {
                assert(t2 == "__eps__" && c2 == "__eps__", `Inside intersection, Expected epsilon, got ${t2}:${c2}`);
                yield [t1, c1, new SMIntersectionState(nextChild1, nextChild2, this.component)];
                emittedAlready = true;
            }
        }
        
        // epsilon transmission from an intersection should only proceed
        // from one of the children, or else get end up getting to the 
        // same resulting state through two different routes.  This can
        // easily balloon into thousands of duplicate states in the parse
        if (emittedAlready) {
            return;
        }


        const child2emitTiers = new Set([...inTiers, ...inTiers1]);
        for (const [t, c, nextChild2] of this.child2.transit("__eps__", "__eps__", child2emitTiers)) {
            yield [t, c, new SMIntersectionState(this.child1, nextChild2, this.component)];
        }
        return;

    }
}

export class SMComposeComponent extends SMIntersectionComponent { }


export class SMSequenceComponent extends SMNAryComponent {

    constructor(
        children: SMComponent[],
        pos: CellPos
    ) {
        super(children, pos);
    }

    public firstState(breadcrumb: SMState): SMState {
        const childState = this.children[0].firstState(breadcrumb);
        return new SMSequenceState(childState, this);
    }
}

class SMSequenceState extends SMComponentState<SMSequenceComponent> {

    constructor(
        public childState: SMState,
        component: SMSequenceComponent,
        public index: number = 0
    ) {
        super(component);
    }
    
    public get breadcrumb(): SMState {
        return this.childState;
    }

    public get id(): string {
        return `SEQ:${this.component.pos.sheet}/${this.component.pos.row}/${this.index}`;
    }
    
    public get accepting(): boolean {
        return this.index >= this.component.children.length;
    } 

    public *transit(tier: string, 
                    target: string, 
                    inTiers: Set<string>): Gen<[string, string, SMState]> {

        //assert(!this.accepting, `${this.id} is accepting yet transits`);
        if (this.accepting) {
            return;
        }

        // like SMEmbedState, we execute the child state and construct
        // a successor state around it.  However, unlike SMEmbedState,
        // we have to decide whether to increment the current child,
        // and whether to build a new state from it.  

        for (var [t, c, nextState] of this.childState.transit(tier, target, inTiers)) {

            var index = this.index;

            if (nextState.accepting) {
                // if we've reached the end of the child, increment our index
                index++; 
                if (index < this.component.children.length) {
                    // if we haven't run out of children, get the first state of the new one
                    nextState = this.component.children[index].firstState(nextState);
                }
            }

            yield [t, c, new SMSequenceState(nextState, this.component, index)];
        }
    }
}


export class SMUnionComponent extends SMNAryComponent {

    constructor(
        children: SMComponent[],
        pos: CellPos
    ) {
        super(children, pos);
    }

    public firstState(breadcrumb: SMState): SMState {
        return new SMUnionState(this, breadcrumb);
    }
}


class SMUnionState extends SMComponentState<SMUnionComponent> {

    constructor(
        component: SMUnionComponent,
        public breadcrumb: SMState,
    ) {
        super(component);
    }

    public get id(): string {
        return `ALT:${this.component.pos}`;
    }

    public *transit(tier: string, 
            target: string, 
            inTiers: Set<string>): Gen<[string, string, SMState]> {

        for (const childComponent of this.component.children) {
            const childState = childComponent.firstState(this);
            yield* childState.transit(tier, target, inTiers);
        }
    }

}
