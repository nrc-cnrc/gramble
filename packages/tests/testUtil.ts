import { basename } from "path";
import { assert, expect } from "chai";

import {
    Dot, Epsilon,
    Lit, Rep, Seq,
 } from "../interpreter/src/grammarConvenience";
import { Grammar, CollectionGrammar } from "../interpreter/src/grammars";
import { Component } from "../interpreter/src/components";
import { Interpreter } from "../interpreter/src/interpreter";
import { HIDDEN_PREFIX } from "../interpreter/src/utils/constants";
import { Dict, StringDict, stringDictToStr } from "../interpreter/src/utils/func";
import { Options } from "../interpreter/src/utils/options";
import { Message } from "../interpreter/src/utils/msgs";
import * as Messages from "../interpreter/src/utils/msgs";

import {
    logDebug,
    timeIt,
    SILENT,
    VERBOSE_DEBUG,
    VERBOSE_GRAMMAR,
} from "../interpreter/src/utils/logging";

import * as Tapes from "../interpreter/src/tapes";
import * as Vocab from "../interpreter/src/vocab";


// Permit global control over verbose output in tests.
// To limit verbose output to a specific test file, set VERBOSE_TEST_L2
// to false here, then re-define VERBOSE in the test file.
// VERBOSE_TEST_L1 is used for verbose output of test filenames.
// VERBOSE_TEST_L2 is used for other verbose output in tests.
export const VERBOSE_TEST_L1: boolean = true;
export const VERBOSE_TEST_L2: boolean = false;

export function verbose(vb: boolean | number, ...msgs: string[]) {
    if (!vb)
        return;
    logDebug(vb ? VERBOSE_DEBUG : SILENT, ...msgs);
}

export function testSuiteName(mod: NodeModule): string {
    return `${basename(mod.filename)}`
}

export function logTestSuite(suiteName: string, vb: boolean = VERBOSE_TEST_L1): void {
    if (!vb)
        return;
    const date_str: string = (new Date()).toUTCString();
    verbose(vb, "", `--- ${suiteName} [${date_str}] ---`);
}

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export function testIsType(obj: any, type: any,  objName: string = ""): void {
    const msg = (objName != "") ? `have ${objName} ` : "be"; 
    it(`should ${msg} of type ${type.name}`, function() {
        expect(obj instanceof type).to.be.true;
    });
}

export function testNumOutputs(
    outputs: StringDict[],
    expectedNum: number,
    warningOnly: boolean = false,
    symbol: string = "",
): void {
    if (symbol !== "") symbol = symbol + " ";
    const testName: string = `${symbol}should have ${expectedNum} result(s)`;
    it(`${testName}`, function() {
        try {
            expect(outputs.length).to.equal(expectedNum);
        } catch (e) {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`${outputs.length} outputs: ${JSON.stringify(outputs)}`);
            if (warningOnly && outputs.length > expectedNum) {
                console.log(`Warning: should have ${expectedNum} result(s), ` +
                            `but found ${outputs.length}.`)
            } else {
                throw e;
            }
        }
    });
}

export function removeHiddenFields(outputs: StringDict[]): StringDict[] {
    const results: StringDict[] = [];
    for (const output of outputs) {
        const result: StringDict = {};
        for (const [key, value] of Object.entries(output)) {
            if (key.startsWith(HIDDEN_PREFIX)) {
                continue;
            }
            result[key] = value;
        }
        results.push(result);
    }
    return results;
}

export function testMatchOutputs(
    outputs: StringDict[],
    expected_outputs: StringDict[],
    symbol: string = ""
): void {
    // Check that the output dictionaries of Interpreter.generate() match
    // the expected outputs.
    //
    // Outputs can be in any order.
    //
    // Most tests have quite a small number of expected outputs, but some
    // negation tests, such as those in testNotMatch can have a large number of
    // outputs, even for a small test. In order to handle this smoothly, we now
    // split the output comparison into blocks, the size of which depends on
    // the number of expected/actual outputs. We also increase timeout from 2
    // seconds (2000ms) to 10 seconds (10000ms) in order to allow us to keep the
    // comparison blocks quite large. 

    const outputStrs = outputs.map(o => stringDictToStr(o)).sort();
    const expectedStrs = expected_outputs.map(o => stringDictToStr(o)).sort();

    let incr: number = Math.max(expectedStrs.length, outputStrs.length, 1);
    if (incr > 2500) {
        incr = 2500;
    }

    // For running the "it" tests, we cannot use a simple loop incrementing start
    // because start would get incremented before the test started. 
    let starts: number[] = new Array(Math.ceil(expectedStrs.length / incr));
    for (let i=0, start=0; i < starts.length; ++i, start+=incr)
        starts[i] = start;

    starts.forEach(function(start) {
        const end_expected: number = Math.min(expectedStrs.length, start+incr);
        let end_outputs: number = end_expected;
        if (end_expected == expectedStrs.length)
            end_outputs = Math.min(outputStrs.length, start + incr);
        const expected_outputs_str = 
                    JSON.stringify(expectedStrs.slice(start, Math.min(end_expected, start+20))) + 
                    (end_expected > start+20 ? "..." : "");
        if (symbol !== "") symbol = symbol + " ";
        const testName = `${symbol}should match items ${start}-${end_expected-1}: ` +
                         `${expected_outputs_str}`;
        it(`${testName}`, function() {
            this.timeout(10000);
            try {
                expect(outputStrs).to.deep.include.members(expectedStrs.slice(start, end_expected));
                expect(expectedStrs).to.deep.include.members(outputStrs.slice(start, end_outputs));
            } catch (e) {
                console.log("");
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(`${outputStrs.length} outputs: ${JSON.stringify(outputStrs)}`);
                throw e;
            }
        });
    });
}

export function prepareInterpreter(
    grammar: Grammar | Dict<Grammar> | Interpreter,
    opt: Partial<Options> = {},
): Interpreter {
    try {
        const interpreter = (grammar instanceof Interpreter) ?
                            grammar :
                            Interpreter.fromGrammar(grammar, opt);

        return interpreter;
    } catch (e) {
        it("Unexpected Exception from prepareInterpreter", function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(JSON.stringify(e));
        });
    }
    return Interpreter.fromGrammar(Epsilon(), opt);
}

export function generateOutputs(
    interpreter: Interpreter,
    symbol: string = "",
    query: Grammar | StringDict[] | StringDict | string = {},
    stripHidden: boolean = true,
    rethrow: boolean = false, // in case a test wants to catch errors itself
): StringDict[] {
    let outputs: StringDict[] = [];
    try {
        outputs = [
            ...interpreter.generate(symbol, query, Infinity, stripHidden)
        ];
    } catch (e) {
        if (rethrow) throw e;
        it("Unexpected Exception from generateOutputs", function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(JSON.stringify(e));
        });
    }
    return outputs;
}

export function testGenerate(
    interpreter: Interpreter,
    expectedResults: StringDict[],
    symbol: string = "",
    query: Grammar | StringDict[] | StringDict | string = {},
    stripHidden: boolean = true,
    allowDuplicateOutputs: boolean = false,
    shortDesc: string = "",
    skipMatchOutputs: boolean = false,
): void {
    timeIt(() => {
        const outputs: StringDict[] =
            generateOutputs(interpreter, symbol, query, stripHidden, false);
        testNumOutputs(outputs, expectedResults.length, allowDuplicateOutputs, symbol);
        if (!skipMatchOutputs && expectedResults !== undefined) {
            testMatchOutputs(outputs, expectedResults, symbol);
        } else {
            it("skipping match outputs", function() {
                expect(skipMatchOutputs).to.be.true;
                expect(expectedResults).to.not.be.undefined;
            });
        }
    }, VERBOSE_TEST_L2, `${shortDesc} testGenerate`);
}

export function testHasTapes(
    grammar: Grammar | Dict<Grammar> | Interpreter,
    expectedTapes: string[],
    symbol: string = "",
    stripHidden: boolean = true
): void {
    const interpreter = prepareInterpreter(grammar, {});
    const bSet = new Set(expectedTapes);
    const testName: string = `${symbol} should have tapes [${[...bSet]}]`;
    let tapes: string[] = [];
    it(`${testName}`, function() {
        try {
            tapes = interpreter.getTapeNames(symbol, stripHidden);
            expect(tapes.length).to.equal(bSet.size);
            for (const a of tapes) {
                expect(bSet).to.contain(a);
            }
        } catch (e) {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`${tapes.length} tapes: ${tapes}`);
            throw e;
        }
    });
}

function CharVocabOf(
    tapeName: string,
    grammar: Grammar
) {
    return Seq(Dot(tapeName), Rep(grammar, 0, 0));
}

export function testHasVocab(
    grammar: Grammar | Dict<Grammar>,
    expectedVocab: {[tape: string]: number | string[]},
    symbol: string = "",
    stripHidden: boolean = true
): void {
    for (const tapeName in expectedVocab) {
        let vocabGrammar: Grammar | Dict<Grammar>;
        if ((grammar instanceof CollectionGrammar)) {
            vocabGrammar = {...grammar.symbols};
            if (!(symbol in vocabGrammar)) {
                it(`symbol '${symbol}' not found in CollectionGrammar (${tapeName} vocab)`, function() {
                    assert.fail();
                }); 
                continue;   
            }
            vocabGrammar[symbol] = CharVocabOf(tapeName, vocabGrammar[symbol]);
        } else if ((grammar instanceof Component)) {
            vocabGrammar = CharVocabOf(tapeName, grammar);
        } else {
            vocabGrammar = {...(grammar as Dict<Grammar>)};
            if (!(symbol in vocabGrammar)) {
                it(`symbol '${symbol}' not found in grammar dictionary (${tapeName} vocab)`, function() {
                    assert.fail();
                });
                continue;
            }
            vocabGrammar[symbol] = CharVocabOf(tapeName, grammar[symbol]);
        }
        const interpreter = prepareInterpreter(vocabGrammar, {optimizeAtomicity: false});

        const expected = expectedVocab[tapeName];
        const outputs: StringDict[] = generateOutputs(interpreter, symbol, "", stripHidden);
        if (typeof expected == 'number') {
            // it's a number
            it(`${symbol} ${tapeName} vocab should have ${expected} tokens`, function() {
                expect(outputs.length).to.equal(expected);
            });
        } else {
            // it's a string[]
            const expectedSet = new Set(expected);
            const vocabSet = new Set(outputs.map(k => k[tapeName]));
            it(`${symbol} ${tapeName} vocab should be ${expected}`, function() {
                expect(vocabSet).to.deep.equal(expectedSet);
            });
        }
    }
}

export function testErrors(
    interpreter: Interpreter,
    expectedErrors: Partial<Message>[]
): void {
    testNumErrors(interpreter, expectedErrors.length);
    for (const err of expectedErrors) {
        const levelMsg = (err.tag === "error") ? `an ${err.tag}` : `an ${err.tag}`;
        it(`should have ${levelMsg} at ${err.sheet}:${err.row}:${err.col}`, function() {
            try {
                const msgs = interpreter.devEnv.getErrors(err);
                expect(msgs.length).to.be.greaterThan(0);
            } catch (e) {
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(`outputs: ${JSON.stringify(interpreter.devEnv.getErrors())}`);
                throw e;
            }
        });
    }
}

export function testNumErrors(
    interpreter: Interpreter,
    numErrors: number
): void {
    it(`should have ${numErrors} errors/warnings`, function() {
        try {
            interpreter.runTests();
            const msgs = interpreter.devEnv.getErrors();
            expect(msgs.length).to.equal(numErrors);
        } catch (e) {
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`outputs: ${JSON.stringify(interpreter.devEnv.getErrors())}`);
            throw e;
        }
    });
}
