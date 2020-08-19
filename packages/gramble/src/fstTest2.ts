import { Gen } from "./util";


type SymbolTable = {[key: string]: SMComponent};
type SymbolCounter = {[key: string]: number};

class CellPos {
    constructor(
        public sheet: string = "",
        public row: number = -1,
        public col: number = -1
    ) { }
}


class SMOutput {

    constructor(
        public tier: string,
        public c: string,
        public pos: CellPos,
        public parent: SMOutput | undefined = undefined
    ) { }

    public add(tier: string, c: string, pos: CellPos): SMOutput {
        return new SMOutput(tier, c, pos, this);
    }

    public toObj(): {[tier: string]: string} {
        if (this.parent == undefined) {
            return { };
        }
        const parentResult = this.parent.toObj();
        if (this.c == "") {
            return parentResult;
        }
        if (!(this.tier in parentResult)) {
            parentResult[this.tier] = "";
        } 
        parentResult[this.tier] = parentResult[this.tier] + this.c;
        return parentResult;
    }

    public toString(): string {
        return JSON.stringify(this.toObj());
    }
}

abstract class SMState {

    constructor(
        public pos: CellPos,
    ) { }

    public final: boolean = false;
    public edges: [string, string, SMState][] = [];

    public abstract get id(): string;
    public abstract get inputTiers(): Set<string>;

    public addEdge(tier: string, c: string, dest: SMState): void {
        this.edges.push([tier, c, dest]);
    }

    public *consume(tier: string, 
                    inChar: string, 
                    output: SMOutput): Gen<[SMState, SMOutput]> {
        for (const [t, c, dest] of this.edges) {
            if (t == tier && c == inChar) {
                yield [dest, output.add("", "", dest.pos)];
            }
        }
    }

    public *emit(output: SMOutput): Gen<[SMState, SMOutput]> {

        /*
        if (this.final) {
            yield [this.parent, output.add("", "", this.pos)];
        } */

        for (const [t, c, dest] of this.edges) {
            if (t == "" || !this.inputTiers.has(t)) {
                yield [dest, output.add(t, c, dest.pos)];
            }
        }
    }
}

class SMAtomicState extends SMState {

    public id: string;

    constructor(
        public inputTiers: Set<string>,
        pos: CellPos,
        id: string,
        //parent: SMState | undefined
    ) { 
        super(pos);
        this.id = `${pos.sheet}/${pos.row}/${pos.col}/${id}`;
    }
}

class SMComposedState extends SMState {

    constructor(
        public child1: SMState,
        public child2: SMState,
        pos: CellPos,
        //parent: SMState | undefined,
        public next: SMState
    ) {
        super(pos);
    }

    public get id(): string {
        return "[" + this.child1.id + "," + this.child2.id + "]"
    }

    public get inputTiers(): Set<string> {
        return this.child1.inputTiers;
    }

    public *consume(tier: string, 
                    inChar: string, 
                    output: SMOutput): Gen<[SMState, SMOutput]> {

        for (const [newChild1, output1] of 
                    this.child1.consume(tier, inChar, output)) {
            const newState = new SMComposedState(newChild1, this.child2, this.pos, this.next);
            yield [newState, output1];
        }
    }

    public *emit(output: SMOutput): Gen<[SMState, SMOutput]> {

        // if both children are final, emit your parent node
        if (this.child1.final && this.child2.final) {
            yield [this.next, output.add("", "", this.pos)];
            return;
        }
        
        var emittedEpsilonFromChild1 = false;

        // now handle the states that we can get to by emitting from state1,
        // then consuming from state2 if necessary
        for (const [newChild1, output1] of this.child1.emit(output)) {

            // if state1 emits an epsilon, we don't have to do anything
            // state2, just emit
            if (output1.c == "") {
                emittedEpsilonFromChild1 = true;
                yield [new SMComposedState(newChild1, this.child2, this.pos, this.next), output];
                continue;
            }

            // state1 has emitted a non-epsilon, so state2 has to consume it
            for (const [newChild2, output2] of 
                            this.child2.consume(output1.tier, output1.c, output)) {
                yield [new SMComposedState(newChild1, newChild2, this.pos, this.next), output2];
            }
        }
        
        if (emittedEpsilonFromChild1) {
            return;
        }

        for (const [newChild2, output2] of this.child2.emit(output)) {
            yield [new SMComposedState(this.child1, newChild2, this.pos, this.next), output2];
        }
    }
}


class SMSymbolState extends SMState {

    public _firstState: SMState | undefined = undefined;
    
    constructor(
        public inputTiers: Set<string>,
        public name: string,
        public child: SMState,
        public next: SMState,
        pos: CellPos,
    ) {
        super(pos);
    }

    public get id(): string {
        return `${this.name}[${this.child.id}]`;
    }

    public *consume(tier: string, 
        inChar: string, 
        output: SMOutput): Gen<[SMState, SMOutput]> {

        //yield* this.firstState.consume(tier, inChar, output);

        for (const [nextState, nextOutput] of this.child.consume(tier, inChar, output)) {
            const newState = new SMSymbolState(this.inputTiers, this.name, nextState, this.next, this.pos);
            yield [newState, nextOutput];
        }
    }

    public *emit(output: SMOutput): Gen<[SMState, SMOutput]> {
        //yield* this.firstState.emit(output);

        if (this.child.final) {
            yield [this.next, output.add("", "", this.pos)];
            return;
        }

        for (const [nextState, nextOutput] of this.child.emit(output)) {
            const newState = new SMSymbolState(this.inputTiers, this.name, nextState, this.next, this.pos);
            yield [newState, nextOutput];
        }
    }
}


abstract class SMComponent {

    constructor(
        public pos: CellPos
    ) { }

    public abstract asStateMachine(inputTiers: Set<string>): [SMState, SMState];
    public abstract getOutputTiers(inputTiers: Set<string>): Set<string>;
}

class SMLiteralComponent extends SMComponent {

    constructor(
        public tier: string,
        public text: string,
        pos: CellPos
    ) { 
        super(pos);
    }

    public getOutputTiers(inputTiers: Set<string>): Set<string> {
        if (inputTiers.has(this.tier)) {
            return new Set();
        }
        return new Set([this.tier]);
    }

    public asStateMachine(inputTiers: Set<string>): [SMState, SMState] {
        const firstState = new SMAtomicState(inputTiers, this.pos, "0");
        var currentState = firstState;
        for (var i = 0; i < this.text.length; i++) {
            const newState = new SMAtomicState(inputTiers, this.pos, (i+1).toString());
            currentState.addEdge(this.tier, this.text[i], newState);
            currentState = newState;
        }
        return [firstState, currentState];
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

    public getOutputTiers(inputTiers: Set<string>): Set<string> {
        const result: Set<string> = new Set();
        for (const child of this.children) {
            for (const tier of child.getOutputTiers(inputTiers)) {
                result.add(tier);
            }
        }
        return result;
    }
}


class SMSymbolComponent extends SMComponent {

    constructor(
        public symbolName: string,
        pos: CellPos,
        public symbolTable: SymbolTable
    ) { 
        super(pos);
    }

    public getOutputTiers(inputTiers: Set<string>): Set<string> {

        if (!(this.symbolName in this.symbolTable)) {
            throw new Error(`Symbol ${this.symbolName} not found in symbol table`);
        }
        return this.symbolTable[this.symbolName].getOutputTiers(inputTiers);
    }

    public asStateMachine(inputTiers: Set<string>): [SMState, SMState] {

        if (!(this.symbolName in this.symbolTable)) {
            throw new Error(`Symbol ${this.symbolName} not found in symbol table`);
        }

        const component = this.symbolTable[this.symbolName];
        const [componentFirst, componentLast] = component.asStateMachine(inputTiers);
        componentLast.final = true;
        
        const lastState = new SMAtomicState(inputTiers, this.pos, "symbolEnd");

        const firstState = new SMSymbolState(inputTiers, 
                                            this.symbolName,
                                            componentFirst,
                                            lastState,
                                            this.pos);
        return [firstState, lastState];
    }
} 


class SMComposeComponent extends SMComponent {

    constructor(
        public child1: SMComponent,
        public child2: SMComponent,
        pos: CellPos
    ) {
        super(pos);
    }

    public getOutputTiers(inTiers: Set<string>): Set<string> {
        const child1outputTiers = this.child1.getOutputTiers(inTiers);
        return this.child2.getOutputTiers(child1outputTiers);
    }

    public asStateMachine(inputTiers: Set<string>): [SMState, SMState] {
        
        const child1outputTiers = this.child1.getOutputTiers(inputTiers);
        const [child1first, child1last] = this.child1.asStateMachine(inputTiers);
        const [child2first, child2last] = this.child2.asStateMachine(child1outputTiers);
        child1last.final = true;
        child2last.final = true;
        const lastState = new SMAtomicState(child1outputTiers, this.pos, "X");
        const firstState = new SMComposedState(child1first, child2first, this.pos, lastState);
        return [firstState, lastState];
    }
} 

class SMConcatComponent extends SMNAryComponent {

    constructor(
        children: SMComponent[],
        pos: CellPos
    ) {
        super(children, pos);
    }

    
    public getOutputTiers(inputTiers: Set<string>): Set<string> {
        const result: Set<string> = new Set();
        for (const child of this.children) {
            for (const tier of child.getOutputTiers(inputTiers)) {
                result.add(tier);
            }
        }
        return result;
    }

    public asStateMachine(inputTiers: Set<string>): [SMState, SMState] {

        var [entryState, currentState] = this.children[0].asStateMachine(inputTiers);

        for (const child of this.children.slice(1)) {
            var [childFirstState, childLastState] = child.asStateMachine(inputTiers);
            currentState.addEdge("", "", childFirstState);
            currentState = childLastState;
        }

        return [entryState, currentState];
    }
}

class SMAltComponent extends SMNAryComponent {

    constructor(
        children: SMComponent[],
        pos: CellPos
    ) {
        super(children, pos);
    }

    public asStateMachine(inputTiers: Set<string>): [SMState, SMState] {

        const entryState = new SMAtomicState(inputTiers, this.pos, "altStart");
        const finalState = new SMAtomicState(inputTiers, this.pos, "altEnd");

        for (const child of this.children) {
            const [childEntryState, childFinalState] = child.asStateMachine(inputTiers);
            entryState.addEdge("", "", childEntryState);
            childFinalState.addEdge("", "", finalState);
        }

        return [entryState, finalState];
    }
}


const hello = new SMLiteralComponent("text", "hello", new CellPos("S",1,1));
const goodbye = new SMLiteralComponent("text", "goodbye", new CellPos("S",2,1));
const world = new SMLiteralComponent("text", "world", new CellPos("S",3,1));
const helloworld = new SMConcatComponent([hello, world], new CellPos("S",4,1));
const hellogoodbye = new SMAltComponent([hello, goodbye], new CellPos("S",5,1));
const hellogoodbyeworld = new SMConcatComponent([hellogoodbye, world], new CellPos("S",6,1));


const helloEmitter = new SMLiteralComponent("t1", "hi", new CellPos("S",1,1));
const helloConsumer = new SMLiteralComponent("t1", "hi", new CellPos("S",2,1));
const goodbyeEmitter = new SMLiteralComponent("t2", "bye", new CellPos("S",2,2));
const goodbyeConsumer = new SMLiteralComponent("t2", "bye", new CellPos("S",3,1));
const welcomeEmitter = new SMLiteralComponent("t3", "yo", new CellPos("S",3,2));
const hello2goodbye = new SMConcatComponent([helloConsumer, goodbyeEmitter], new CellPos("S",2,1));
const goodbye2welcome = new SMConcatComponent([goodbyeConsumer, welcomeEmitter], new CellPos("S",3,1));
const composeTest1 = new SMComposeComponent(helloEmitter, hello2goodbye, new CellPos("S",4,1));
const composeTest2 = new SMComposeComponent(composeTest1, goodbye2welcome, new CellPos("S",4,2));

const symbolTable: SymbolTable = {};

/*
symbolTable['hiBye'] = hellogoodbye;
const helloGoodbyeSymbol = new SMSymbolComponent("hiBye", new CellPos("S",7,1), symbolTable);
const helloGoodbyeSymbolWorld = new SMConcatComponent([helloGoodbyeSymbol, world], new CellPos("S", 6, 1));
*/

symbolTable["hi2bye"] = composeTest1;
const hi2byeSymbol = new SMSymbolComponent("hi2bye", new CellPos("S",7,2), symbolTable);
const composeSymbolTest = new SMComposeComponent(hi2byeSymbol, goodbye2welcome, new CellPos("S", 4, 2));


function* run(grammar: SMComponent): Gen<SMOutput> {

    const inTiers: Set<string> = new Set();
    const groundState = new SMAtomicState(inTiers, new CellPos(), "ground");
    const [firstState, lastState] = grammar.asStateMachine(inTiers);
    lastState.final = true;
    
    const startingOutput = new SMOutput("", "", new CellPos());
    const currentStates: [SMState, SMOutput][] = [[firstState, startingOutput]];

    const foundStateIDs: Set<string> = new Set();
    var statesVisited = 0;

    while (currentStates.length > 0) {

        const currentStateOutput = currentStates.pop();
        if (currentStateOutput == undefined) break;
        const [currentState, currentOutput] = currentStateOutput;
        console.log(currentState.id);
        for (const [resultState, resultOutput] of currentState.emit(currentOutput)) {

            console.log(" -> " + resultState.id);

            statesVisited++;

            if (resultState.final) {
                yield resultOutput;
            }

            currentStates.push([resultState, resultOutput]);
        }
    }

    console.log("states visited = " + statesVisited);
}

for (const output of run(composeSymbolTest)) {
    console.log("result = " + output.toString());
}

