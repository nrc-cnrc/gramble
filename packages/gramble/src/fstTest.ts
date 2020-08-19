

// Recursive state machine

// Each state can either be an atomic state, or
// itself consist of a state machine.

// To simplify things, we assume that every machine will
// have a single entry point and a single exit point.  (If they
// don't, make a new entry or exit and put epsilon transitions 
// to the non-unique entries or exits.)

// When a state machine reaches a final state, we "pop" to the
// parent node, which may have its own transitions out.  (In practice 
// that's usually going to be epsilon.)

class RSMNode {

    public id: string;
    public final: boolean = false;
    public transitions: {[tier: string]: {[c: string]: RSMNode}} = {};
    public epsilons: RSMNode[] = [];

    constructor(
        public pos: CellPosition,
        id: string
    ) { 
        this.id = pos.sheet + "-" 
                + pos.rowStart + "-"
                + pos.rowEnd + "-" 
                + pos.colStart + "-"
                + pos.colEnd + "-"
                + id;
    }

    public static isComposite: boolean = false;

    public hasNonEpsilonTransitions(): boolean {
        return Object.keys(this.transitions).length > 0;
    }


    public transit(inputTiers: Set<string>, tier: string, c: string): [string, string, RSMNode][] {

        if (tier == "" || c == "") {
            return this.transitTrivial(inputTiers);
        } else {
            return this.transitNonTrivial(tier, c);
        }
    }

    public transitNonTrivial(tier: string, c: string): [string, string, RSMNode][] {

        const transitions = this.transitions[tier];

        if (transitions == undefined) {
            return [];
        }

        const results: [string, string, RSMNode][] = [];
        for (const target in transitions) {
            if (c == target) {
                results.push([tier, c, transitions[target]]);
            }
        }
        return results;
    }

    public transitTrivial(inputTiers: Set<string>): [string, string, RSMNode][] {

        var results: [string, string, RSMNode][] = [];

        for (const tier in this.transitions) {
            if (inputTiers.has(tier)) {
                continue;
            }
            for (const c in this.transitions[tier]) {
                results.push([tier, c, this.transitions[tier][c]]);
            }
        }

        for (const eps of this.epsilons) {
            results.push(["","",eps]);
        }
        
        return results;
    }

    /*
    public transitEpsilon(): RSMNode[] {
        return this.epsilons;
    } */

    public addTransition(tier: string, c: string, dest: RSMNode): void {
        if (c == "") {
            throw new Error("use addEpsilonTransition instead");
        }
        if (this.epsilons.length > 0) {
            throw new Error("A node cannot have both epsilon and non-epsilon transitions");
        }
        if (!(tier in this.transitions)) {
            this.transitions[tier] = {};
        }
        this.transitions[tier][c] = dest;
    }

    public addEpsilonTransition(dest: RSMNode) {
        if (this.hasNonEpsilonTransitions()) {
            throw new Error("A node cannot have both epsilon and non-epsilon transitions");
        }
        this.epsilons.push(dest);
    }

}


class Box extends RSMNode {

    constructor(
        public entryPoint: RSMNode,
        pos: CellPosition,
        id: string
    ) { 
        super(pos, id);
    }

    public static isComposite: boolean = true;

}

class CellPosition {

    constructor(
        public sheet: string = "",
        public rowStart: number = -1,
        public rowEnd: number = -1,
        public colStart: number = -1,
        public colEnd: number = -1
    ) { }
}

abstract class RSMTransducer {

    constructor( ) { }

    public abstract get pos(): CellPosition;
    public abstract asRSM(): [RSMNode, RSMNode];
}

class RSMLiteral extends RSMTransducer {

    constructor(
        public tier: string,
        public text: string,
        public pos: CellPosition
    ) { 
        super();
    }

    public asRSM(): [RSMNode, RSMNode] {

        const entryState = new RSMNode(this.pos, "0");
        var currentState: RSMNode = entryState;

        for (var i = 0; i < this.text.length; i++) {
            const nextState = new RSMNode(this.pos, (i+1).toString());
            currentState.addTransition(this.tier, this.text[i], nextState);
            currentState = nextState; 
        }
        //currentState.final = true;

        return [entryState, currentState];
    }
}

abstract class RSMNAryCombinator extends RSMTransducer {

    public pos: CellPosition;

    constructor(
        public children: RSMTransducer[]
    ) {
        super();
        if (this.children.length == 0) {
            throw new Error("Trying to build an RSMConcatenation without any children");
        }

        const firstChildPos = this.children[0].pos;
        const lastChildPos = this.children[this.children.length-1].pos;
        this.pos = new CellPosition(firstChildPos.sheet,
                                firstChildPos.rowStart,
                                lastChildPos.rowEnd,
                                firstChildPos.colStart,
                                firstChildPos.rowEnd);
    }
}


class RSMConcatenation extends RSMNAryCombinator {

    constructor(
        children: RSMTransducer[]
    ) {
        super(children);
    }

    public asRSM(): [RSMNode, RSMNode] {


        var [entryState, currentState] = this.children[0].asRSM();

        for (const child of this.children.slice(1)) {
            var [childFirstState, childLastState] = child.asRSM();
            currentState.addEpsilonTransition(childFirstState);
            currentState = childLastState;
        }

        return [entryState, currentState];
    }
}

class RSMAlternation extends RSMNAryCombinator {

    constructor(
        public children: RSMTransducer[]
    ) {
        super(children);
    }

    public asRSM(): [RSMNode, RSMNode] {

        const entryState = new RSMNode(this.pos, "altStart");
        const finalState = new RSMNode(this.pos, "altEnd");

        for (const child of this.children) {
            const [childEntryState, childFinalState] = child.asRSM();
            entryState.addEpsilonTransition(childEntryState);
            childFinalState.addEpsilonTransition(finalState);
        }

        return [entryState, finalState];
    }

}

class RSMEmitter {

    public texts : {[tier: string]: string} = {};

}

class RSMParseState {

    constructor(
        public texts : {[tier: string]: string} = {},
        public stateStack : RSMNode[] = []
    ) { }

    public appendCharToTexts(tier: string, c: string) {
        if (tier == "" || c == "") {
            return this.texts;
        }

        const result: {[tier: string]: string} = {};
        var foundTier = false;
        for (const key in this.texts) {
            if (key == tier) {
                foundTier = true;
                result[key] = this.texts[key] + c;
                continue;
            }
            result[key] = this.texts[key];
        }
        if (!foundTier) {
            result[tier] = c;
        }
        return result;
    }

    public hash() {
        return JSON.stringify(this.texts) + ":::" + this.stateStack.map(s => s.id).join("-");
    }

    public get topNode(): RSMNode {
        return this.stateStack[this.stateStack.length-1];
    }

    public hasNonEpsilonTransitions(inputTiers: Set<string>): boolean {
        return this.topNode.hasNonEpsilonTransitions();
    }

    public transit(inputTiers: Set<string>, tier: string, c: string): RSMParseState[] {
        const results: RSMParseState[] = [];
        const stateStackCopy = [...this.stateStack];
        const state = stateStackCopy.pop();
        if (state == undefined) {
            throw new Error("Empty state stack");
        }
        for (const [resultTier, resultChar, resultState] of state.transit(inputTiers, tier, c)) {
            const resultStack = [...stateStackCopy, resultState];
            const result = new RSMParseState(this.appendCharToTexts(resultTier, resultChar), resultStack);
            results.push(result);
        }
        return results;
    }
}

// the transit method of any object with a parse state takes (potentially)
// an input, and returns a list of [output, state] proposals for where it can go next.
// These proposals mean "You can go to state S if my output O is accepted."

class RSMParseStateSet {

    protected _states: {[hash: string]: RSMParseState} = {};
    
    public get length(): number {
        return this.states.length;
    }

    public has(state: RSMParseState) {
        return state.hash() in this._states;
    }

    public add(state: RSMParseState) {
        this._states[state.hash()] = state;
    }

    public transit(inputTiers: Set<string>, tier: string, c: string): RSMParseStateSet {
        var newStates = new RSMParseStateSet();
        for (const hash in this._states) {
            const currentState = this._states[hash];
            for (const newState of currentState.transit(inputTiers, tier, c)) {
                if (newStates.has(newState)) {
                    continue;
                }
                newStates.add(newState);
            }
        }
        return newStates;
    }

    public transitEpsilon(inputTiers: Set<string>): RSMParseStateSet {
        var newStates = new RSMParseStateSet();
        var tempStates: RSMParseState[] = [];

        for (const state of this.states) {
            newStates.add(state);
            tempStates.push(state);
        }

        while (tempStates.length > 0) {
            const currentState = tempStates.pop();
            if (currentState == undefined) {
                break; // just for linting, won't happen when length > 0
            }
            for (const newState of currentState.transit(inputTiers, "", "")) {
                if (newStates.has(newState)) {
                    continue;
                }
                if (newState.hasNonEpsilonTransitions(inputTiers)) {
                    newStates.add(newState);
                }
                tempStates.push(newState);
            }
        }
        /*
        console.log("new states = ");
        for (const state of newStates.states) {
            console.log("  " + state.topNode.id);
        } */
        return newStates;
    }

    public get states(): RSMParseState[] {
        return Object.values(this._states);
    }
}


// The current state of execution consists of a stack of State objects,
// rather than a single State.  Upon moving to a new state, we check whether
// it's composite, and if it is, we immediately transit to the entry
// point.

const results = [];

var numStates = 1;

const hello = new RSMLiteral("text", "hello ", new CellPosition("X", 1, 1));
const world = new RSMLiteral("text", "world", new CellPosition("X", 1, 2));
const goodbye = new RSMLiteral("text", "goodbye ", new CellPosition("X", 1, 3));
const greeting = new RSMAlternation([hello, goodbye]);
const conc = new RSMConcatenation([hello, world]);
const altConc = new RSMConcatenation([greeting, world]);

function query([entryState, finalState]: [RSMNode, RSMNode], 
                tier: string, query: string): string[] {

    finalState.final = true;
    const inputTiers: Set<string> = new Set([tier]);

    var currentStates = new RSMParseStateSet();
    currentStates.add(new RSMParseState({}, [entryState]));
    currentStates = currentStates.transitEpsilon(inputTiers);
    
    for (const c of query) {
        currentStates = currentStates.transit(inputTiers, tier, c);
        currentStates = currentStates.transitEpsilon(inputTiers);
        console.log(currentStates.length);
    }

    return currentStates.states
            .filter(r => r.stateStack.length == 1 && r.stateStack[0].final)
            .map(s => JSON.stringify(s.texts));
}

const [m1entry, m1exit] = new RSMLiteral("text", "hello ", new CellPosition("X")).asRSM()
m1exit.final = true;

const [m2entry, m2exit] = new RSMLiteral("text", "hello ", new CellPosition("X")).asRSM()
m2exit.final = true;

var statePairs: [string, RSMNode, RSMNode][] = [["", m1entry, m2entry]];

while (statePairs.length > 0) {
    const statePair = statePairs.pop();
    if (statePair == undefined) break; // just for linting, shouldn't happen
    const [text, s1, s2] = statePair;
    for (const t1 of s1.transitions) {

    }

}


/*

console.log("hello ", query(hello.asRSM(), "text", "hello "));
console.log("hello ", query(greeting.asRSM(), "text", "hello "));
console.log("hello world", query(conc.asRSM(), "text", "hello world"));
console.log("hello ", query(altConc.asRSM(), "text", "hello "));
console.log("world", query(altConc.asRSM(), "text", "world"));
console.log("hello world", query(altConc.asRSM(), "text", "hello world"));
console.log("hello worlds", query(altConc.asRSM(), "text", "hello worlds"));
console.log("heeeeello world", query(altConc.asRSM(), "text", "heeeeello world"));
console.log("hlo world", query(altConc.asRSM(), "text", "hlo world"));
console.log("goodbye world", query(altConc.asRSM(), "text", "goodbye world"));
console.log("", query(altConc.asRSM(), "__NONE__", ""));

*/