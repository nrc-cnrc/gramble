import { Epsilon, Lit, Rep, Filter, Seq, State, Uni, Join, Null } from "../../src/stateMachine";

const TRIALS = 1000;
const MAX_RECURSION = 4;
const MAX_CHARS = 25;

const MAX_OUTPUTS = 1000; // don't bother with results that have more than MAX_OUTPUTS,
                          // it takes too long to compare them

const MAX_GRAMMAR_DEPTH = 3;
const LIT_POISSON_MEAN = 3;
const SEQ_POISSON_MEAN = 2;
const UNI_POISSON_MEAN = 2;
const TAPES_POISSON_MEAN = 2;
const REPS_POISSON_MEAN = 1;

const MAX_PARAMS_PER_TEST = 3; // The maximum number of State params any test function can have
                            // It's no trouble if this is larger, it just has to be some number.
                            // But currently the most is 3, and I can't picture needing more.

function poisson(mean: number): number {
    const L = Math.exp(-mean);
    let p = 1.0;
    let k = 0;
    
    do {
        k++;
        p *= Math.random();
    } while (p > L);
    
    return k - 1;
}

function randomChoice<T>(choices: T[]) {
    const index = Math.floor(Math.random() * choices.length);
    return choices[index];
}

function range(length: number): number[] {
    return [...Array(length).keys()];
}

function poissonRange(mean: number): number[] {
    return range(poisson(mean));
}

const LETTERS = "abcdefghijklmnopqrstuvwxyz".split("");

function randomString(): string {
    const letters = poissonRange(LIT_POISSON_MEAN).map(_ => randomChoice(LETTERS));
    return letters.join("");
}

type randomConstr = (tapes: string[], depth: number) => State;
const RANDOM_CONSTRUCTORS: [randomConstr, number][] = [
    [ randomLit, 0.4 ],
    [ randomSeq, 0.25 ],
    [ randomUnion, 0.2 ],
    [ randomRepeat, 0.05 ],
    [ randomEpsilon, 0.1 ],
]

function randomGrammar(): State {
    const length = poisson(TAPES_POISSON_MEAN)+1;  // always has to be at least one tape
    const tapes = range(length).map(n => `T${n+1}`);
    return randomState(tapes, MAX_GRAMMAR_DEPTH);
}


function randomEpsilon(possibleTapes: string[], allowedDepth: number = 5): State {
    return Epsilon();
}

function randomState(possibleTapes: string[], allowedDepth: number = 5): State {
    if (allowedDepth <= 1) {
        return randomLit(possibleTapes, 1);
    } 
    const rand = Math.random();
    let totalP = 0.0;
    for (const [constr, p] of RANDOM_CONSTRUCTORS) {
        totalP += p;
        if (rand <= totalP) {
            return constr(possibleTapes, allowedDepth-1);
        }
    }
    return Epsilon();
}

function randomLit(possibleTapes: string[], allowedDepth: number = 5): State {
    const tape = randomChoice(possibleTapes);
    const text = randomString();
    return Lit(tape, text);
}

function randomSeq(possibleTapes: string[], allowedDepth: number = 5): State {
    const children = poissonRange(SEQ_POISSON_MEAN).map(_ => randomState(possibleTapes, allowedDepth));
    return Seq(...children);
}

function randomUnion(possibleTapes: string[], allowedDepth: number = 5): State {
    const children = poissonRange(UNI_POISSON_MEAN).map(_ => randomState(possibleTapes, allowedDepth));
    return Uni(...children);
}

function randomRepeat(possibleTapes: string[], allowedDepth: number = 5): State {
    const child = randomState(possibleTapes, allowedDepth);
    const n1 = poisson(REPS_POISSON_MEAN);
    const n2 = poisson(REPS_POISSON_MEAN);
    return Rep(child, n1, n2);
}

import * as path from 'path';
import { StringDict } from "../../src/util";
import { removeHiddenFields, t1, t2, t3 } from "../testUtils";
import { expect } from "chai";



function getOutputs(grammar: State, includeHidden: boolean = false): StringDict[] {
    const outputs = [...grammar.generate(false, MAX_RECURSION, MAX_CHARS)];
    if (!includeHidden) {
        return removeHiddenFields(outputs);
    }
    return outputs;
}

export function testEquals(grammar1: State, grammar2: State): void {
    // Check that the output dictionaries of State.generate() match the expected
    // outputs.
    //
    // Outputs can be in any order.
    
    //console.log(`evaluating leftside`);
    const outputs1 = getOutputs(grammar1);

    //console.log(`evaluating rightside`);
    const outputs2 = getOutputs(grammar2);

    if (outputs1.length > MAX_OUTPUTS || outputs2.length > MAX_OUTPUTS) {
        return;
    }

    for (const o1 of outputs1) {
        try {
            expect(outputs2).to.deep.include(o1);
        } catch (e) {
            console.log(`An output from ${grammar1.id} was not generated by ${grammar2.id}:\n${JSON.stringify(o1)}`);
            throw e;
        }
    }
    for (const o2 of outputs2) {
        try {
            expect(outputs1).to.deep.include(o2);
        } catch (e) {
            console.log(`An output from ${grammar2.id} was not generated by ${grammar1.id}:\n${JSON.stringify(o2)}`);
            throw e;
        }
    }
}

export function testSubset(grammar1: State, grammar2: State): void {
    // Check that the output dictionaries of State.generate() match the expected
    // outputs.
    //
    // Outputs can be in any order.
    
    //console.log(`evaluating leftside`);
    const outputs1 = getOutputs(grammar1);

    //console.log(`evaluating rightside`);
    const outputs2 = getOutputs(grammar2);

    if (outputs1.length > MAX_OUTPUTS || outputs2.length > MAX_OUTPUTS) {
        return;
    }

    for (const o2 of outputs2) {
        try {
            expect(outputs1).to.deep.include(o2);
        } catch (e) {
            console.log(`An output from ${grammar2.id} was not generated by ${grammar1.id}:\n${JSON.stringify(o2)}`);
            throw e;
        }
    }
}

type StateOp = (...states: State[]) => void;


const FUNCTIONS: {[desc: string]: [string, StateOp][]} = {

    "Identity functions": [
        [ 
            "X = X",                      
            (x) => testEquals(
                        x, 
                        x)
        ],
        [ 
            'X[X] = X', 
            (x) => testEquals(
                        Filter(x, x), 
                        x)
        ],
        [
            'X⨝X = X',
            (x) => testEquals(
                        Join(x, x), 
                        x)
        ],
        [ 
            "X+ε = X",                    
            (x) => testEquals(
                        Seq(x, Epsilon()), 
                        x)
        ],
        [ 
            "ε+X = X",                    
            (x) => testEquals(
                        Seq(Epsilon(), x), 
                        x)
        ],
        
        [ 
            "X|∅ = X",                    
            (x) => testEquals(
                        Uni(x, Null()), 
                        x)
        ],
        [ 
            "∅|X = X",                    
            (x) => testEquals(
                        Uni(Null(), x), 
                        x)
        ],
        [ 
            "X|X = X",                    
            (x) => testEquals(
                        Uni(x, x), 
                        x)
        ],
        [
            "X{1} = X",
            (x) => testEquals(
                        Rep(x, 1, 1), 
                        x)
        ]
    ], 
    
    "Null functions": [
        [ 
            "X+∅ = ∅",                    
            (x) => testEquals(
                        Seq(x, Null()), 
                        Null())
        ],
        [ 
            "∅+X = X",                    
            (x) => testEquals(
                        Seq(Null(), x), 
                        Null())
        ],
        [ 
            "X[∅] = X",                    
            (x) => testEquals(
                        Filter(x, Null()), 
                        Null())
        ],
        [ 
            "X⨝∅ = X",                    
            (x) => testEquals(
                        Join(x, Null()), 
                        Null())
        ],
    ],

    "Subset functions": [

        [
            "X >= X[Y]",
            (x, y) => testSubset(
                        x,
                        Filter(x, y))
        ],

        [
            "X|Y >= X",
            (x, y) => testSubset(
                        Uni(x, y),
                        x)
        ],

        [
            "X|Y >= Y",
            (x, y) => testSubset(
                        Uni(x, y),
                        y)
        ],
        [
            "X{2,3} >= X{2}",
            (x) => testSubset(
                        Rep(x, 2, 3),
                        Rep(x, 2, 2))
        ]

    ],

    "Commutative functions": [

        [ 
            "X|Y = Y|X",              
            (x, y) => testEquals(
                            Uni(x, y), 
                            Uni(y, x))
        ],
        [ 
            "X⨝Y = Y⨝X",              
            (x, y) => testEquals(
                            Join(x, y), 
                            Join(y, x))
        ],
        //[ "X & Y = Y & X",            (x: State, y:State, z:State) => Join(x, y) ],
    
    ],

    "Associative functions": [

        [ 
            "X+(Y+Z) = (X+Y)+Z",          
            (x, y, z) => testEquals(    
                            Seq(x, Seq(y, z)), 
                            Seq(Seq(x, y), z))
        ],
        [ 
            "X|(Y|Z) = (X|Y)|Z",          
            (x, y, z) => testEquals(
                            Uni(x, Uni(y, z)),  
                            Uni(Uni(x, y), z))
        ],
        [ 
            "X⨝(Y⨝Z) = (X⨝Y)⨝Z",          
            (x, y, z) => testEquals(
                            Join(x, Join(y, z)),  
                            Join(Join(x, y), z))
        ]
    ],

    "Idempotent functions": [

        [ 
            "X|Y = (X|Y)|Y",              
            (x, y) => testEquals(
                        Uni(x, y),
                        Uni(Uni(x, y), y))
        ],
        [ 
            "X[Y] = X[Y][Y]",             
            (x, y) => testEquals(
                        Filter(x, y),
                        Filter(Filter(x, y), y))
        ],
        [ 
            "X⨝Y = (X⨝Y)⨝Y",             
            (x, y) => testEquals(
                        Join(x, y),
                        Join(Join(x, y), y))
        ]
    ],

    "Other" : [

        [
            "X+X = X{2}",
            (x) => testEquals(
                        Seq(x, x),
                         Rep(x, 2, 2))
        ],
        [
            "X|ε = X{0,1}",
            (x) => testEquals(
                        Uni(x, Epsilon()),
                        Rep(x, 0, 1))
        ], 
        [
            "X|(X+X) = X{1,2}",
            (x) => testEquals(
                        Uni(x, Seq(x, x)),
                        Rep(x, 1, 2))
        ],
        [
            "X{0} = ε",
            (x) => testEquals(
                        Rep(x, 0, 0),
                        Epsilon())
        ],        
        [ 
            "X[Y][Z] = X[Z][Y]",          
            (x, y, z) => testEquals(
                            Filter(Filter(x, y), z),
                            Filter(Filter(x, z), y))
        ],
    ]

}

describe(`${path.basename(module.filename)}`, function() {

    const grammars: State[] = [];
    
    describe('All grammars', function() {
        it ('should generate without errors', function() {
            this.timeout(0); // turn off timeout
            while (grammars.length < TRIALS + MAX_PARAMS_PER_TEST) {
                const grammar = randomGrammar();
                const outputs = getOutputs(grammar, true);
                // grammars with more than MAX_OUTPUTS are still checked that they
                // execute, but we don't include them in the next step because it can
                // take too long to compare the outputs for equality.
                if (outputs.length < MAX_OUTPUTS) {
                    grammars.push(grammar);
                }
            }
        });
    
    });

    for (const [categoryDesc, f] of Object.entries(FUNCTIONS)) {
        describe(categoryDesc, function() {
            for (const [funcDesc, evalFunc] of f) {
                it (funcDesc, function() {
                    this.timeout(0); // turn off timeout
                    for (let i = 0; i < TRIALS; i++) {
                        const gSlice = grammars.slice(i, i+MAX_PARAMS_PER_TEST);
                        evalFunc(...gSlice);
                    }
                });
            }
        });
    }
});
