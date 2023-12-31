import { basename } from "path";
import { assert, expect } from "chai";

import { Epsilon, Lit } from "../interpreter/src/grammarConvenience";
import { Grammar } from "../interpreter/src/grammars";
import { Interpreter } from "../interpreter/src/interpreter";
import { StringDict, stringDictToStr } from "../interpreter/src/utils/func";
import { HIDDEN_PREFIX } from "../interpreter/src/utils/constants";
import { Options } from "../interpreter/src/utils/options";

import {
    logDebug,
    timeIt,
    SILENT,
    VERBOSE_DEBUG,
} from "../interpreter/src/utils/logging";
import { OldTape } from "../interpreter/src/tapes";

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
    grammar: Grammar | Interpreter,
    opt: Partial<Options> = {},
): Interpreter {
    try {
        opt = Options(opt);
        const interpreter = (grammar instanceof Interpreter) ?
                            grammar :
                            Interpreter.fromGrammar(grammar, opt);

        return interpreter;
    } catch (e) {
        it("Unexpected Exception", function() {
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
    query: StringDict[] | StringDict = {},
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
        it("Unexpected Exception", function() {
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
    query: StringDict[] | StringDict = {},
    stripHidden: boolean = true,
    allowDuplicateOutputs: boolean = false,
    shortDesc: string = "",
): void {
    timeIt(() => {
        const outputs: StringDict[] =
            generateOutputs(interpreter, symbol,
                                query, stripHidden, false);
        testNumOutputs(outputs, expectedResults.length,
                       allowDuplicateOutputs, symbol);
        testMatchOutputs(outputs, expectedResults, symbol);
    }, VERBOSE_TEST_L2, `${shortDesc} testGenerate`);
}

export function testHasTapes(
    grammar: Grammar | Interpreter,
    expectedTapes: string[],
    symbol: string = "",
    stripHidden: boolean = true
): void {
    const interpreter = prepareInterpreter(grammar, {});

    let referent = interpreter.getSymbol(symbol);
    
    const bSet = new Set(expectedTapes);
    const testName: string = `${symbol} should have tapes [${[...bSet]}]`;
    it(`${testName}`, function() {
        expect(referent).to.not.be.undefined;
        if (referent == undefined) {
            return;
        }
        let tapes: string[] = [];
        try {
            tapes = referent.tapeNames;
            if (stripHidden) {
                // for the purpose of this comparison, leave out any internal-only
                // tapes, like those created by a Hide().
                tapes = referent.tapeNames.filter(t => !t.startsWith(HIDDEN_PREFIX));
            }
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

export function testHasVocab(
    grammar: Grammar | Interpreter,
    expectedVocab: {[tape: string]: number|string[]}
): void {
    const interpreter = prepareInterpreter(grammar, {optimizeAtomicity: false});

    for (const tapeName in expectedVocab) {
        let tape: OldTape;
        try {
            tape = interpreter.tapeNS.get(tapeName);
        } catch (e) {
            it(`should have tape ${tapeName}`, function() {
                assert.fail(JSON.stringify(e));
            });
            continue;
        }
        const vocab = expectedVocab[tapeName];
        if (Array.isArray(vocab)) {
            // it's a string[]
            it(`vocab of ${tapeName} should be ${vocab}`, function() {
                expect(tape).to.not.be.undefined;
                if (tape == undefined) {
                    return;
                }
                const expectedSet = new Set(vocab);
                expect(tape.vocab).to.deep.equal(expectedSet);
            });
        } else {
            // it's a number
            it(`should have ${vocab} tokens in the ${tapeName} vocab`, function() {
                expect(tape).to.not.be.undefined;
                if (tape == undefined) {
                    return;
                }
                expect(tape.vocab.size).to.equal(vocab);
            });
        }
    }
}

export function testErrors(
    interpreter: Interpreter,
    expectedErrors: [string, number, number, string][]
): void {
    testNumErrors(interpreter, expectedErrors.length);
    const devEnv = interpreter.devEnv;
    for (const [sheet, row, col, level] of expectedErrors) {
        const levelMsg = (level == "warning") ? `a ${level}` : `an ${level}`;
        it(`should have ${levelMsg} at ${sheet}:${row}:${col}`, function() {
            try {
                expect(devEnv.getErrors(sheet, row, col).length).to.be.greaterThan(0);
            } catch (e) {
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(`outputs: ${JSON.stringify(devEnv.getErrorMessages())}`);
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
            expect(interpreter.devEnv.numErrors("any")).to.equal(numErrors);
        } catch (e) {
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`outputs: ${JSON.stringify(interpreter.devEnv.getErrorMessages())}`);
            throw e;
        }
    });
}
