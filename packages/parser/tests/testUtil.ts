import { basename } from "path";
import { assert, expect } from "chai";

import { Grammar, Lit } from "../src/grammars";
import { Interpreter } from "../src/interpreter";
import { Tape } from "../src/tapes";
import {
    HIDDEN_PREFIX, StringDict,
    SILENT, VERBOSE_DEBUG, logDebug
} from "../src/util";

export const DEFAULT_MAX_RECURSION = 4;

// DEBUG_MAX_RECURSION is a forced upper bound for maxRecursion.
const DEBUG_MAX_RECURSION: number = 4;      // 4

// Some tests ultimately call testNumOutputs with warnOnly set to 
// WARN_ONLY_FOR_TOO_MANY_OUTPUTS.
// Change the value here to 'false' to make those tests generate errors
// for more than the expected number of outputs.
export const WARN_ONLY_FOR_TOO_MANY_OUTPUTS: boolean = true;

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
    symbolName: string = "",
): void {
    const date_str: string = (new Date()).toUTCString();
    if (symbolName !== "") symbolName = symbolName + " ";
    const testName: string = `${symbolName}should have ${expectedNum} result(s)`;
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
    symbolName: string = ""
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

    let incr: number = Math.max(expected_outputs.length, outputs.length, 1);
    if (incr > 2500) {
        // incr = Math.ceil(62500 / incr) * 100;
        incr = 2500;
    }

    // For running the "it" tests, we cannot use a simple loop incrementing start
    // because start would get incremented before the test started. 
    let starts: number[] = new Array(Math.ceil(expected_outputs.length / incr));
    for (let i=0, start=0; i < starts.length; ++i, start+=incr)
        starts[i] = start;

    starts.forEach(function(start) {
        const end_expected: number = Math.min(expected_outputs.length, start+incr);
        let end_outputs: number = end_expected;
        if (end_expected == expected_outputs.length)
            end_outputs = Math.min(outputs.length, start + incr);
        let expected_outputs_str: string;
        if (end_expected - start < 20)
            expected_outputs_str = JSON.stringify(expected_outputs.slice(start, end_expected));
        else
            expected_outputs_str = JSON.stringify(expected_outputs.slice(start, start+20)) + "...";
        if (symbolName !== "") symbolName = symbolName + " ";
        const testName = `${symbolName}should match items ${start}-${end_expected-1}: ` +
                         `${expected_outputs_str}`;
        it(`${testName}`, function() {
            this.timeout(10000);
            try {
                expect(outputs).to.deep.include.members(expected_outputs.slice(start, end_expected));
                expect(expected_outputs).to.deep.include.members(outputs.slice(start, end_outputs));
            } catch (e) {
                console.log("");
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(`${outputs.length} outputs: ${JSON.stringify(outputs)}`);
                throw e;
            }
        });
    });
}

export function generateOutputsFromGrammar(
    grammar: Grammar | Interpreter,
    verbose: number = SILENT,
    symbolName: string = "",
    maxRecursion: number = DEFAULT_MAX_RECURSION,
    stripHidden: boolean = true,
    throwError: boolean = false // in case a test wants to catch errors itself
): StringDict[] {
    const interpreter = (grammar instanceof Interpreter) ?
                        grammar :
                        Interpreter.fromGrammar(grammar, verbose);
    
    // In case there are any tests, we want to run them so their errors accumulate
    interpreter.runTests();
                          
    let outputs: StringDict[] = [];

    try {
        interpreter.resolveName(symbolName);
    } catch(e) {
        if (throwError) throw e;
        it(`symbol "${symbolName} should exist`, function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(e);
        });
    }

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);

    try {
        outputs = [
            ...interpreter.generate(symbolName, {}, Infinity,
                                    maxRecursion, undefined, stripHidden)
        ];
    } catch (e) {
        if (throwError) throw e;
        it("Unexpected Exception", function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(e);
        });
    }
    return outputs;
}

export function testGenerate(
    grammar: Grammar | Interpreter,
    expectedResults: StringDict[],
    verbose: number = SILENT,
    symbolName: string = "",
    maxRecursion: number = DEFAULT_MAX_RECURSION,
    stripHidden: boolean = true,
    allowDuplicateOutputs: boolean = false
): void {
    const outputs: StringDict[] =
        generateOutputsFromGrammar(grammar, verbose, symbolName,
                                   maxRecursion, stripHidden);
    testNumOutputs(outputs, expectedResults.length,
                   allowDuplicateOutputs, symbolName);
    testMatchOutputs(outputs, expectedResults, symbolName);
}

export function testHasTapes(
    grammar: Grammar | Interpreter,
    expectedTapes: string[],
    symbolName: string = "",
    stripHidden: boolean = true
): void {
    
    const interpreter = (grammar instanceof Interpreter) ?
                        grammar :
                        Interpreter.fromGrammar(grammar);
    
    try {
        interpreter.resolveName(symbolName);
    } catch(e) {
        it(`symbol "${symbolName} should have tapes`, function() {
            assert.fail(e);
        });
        return;
    }

    let referent = interpreter.getSymbol(symbolName);
    
    const bSet = new Set(expectedTapes);
    const testName: string = `${symbolName} should have tapes [${[...bSet]}]`;
    it(`${testName}`, function() {
        expect(referent).to.not.be.undefined;
        if (referent == undefined) {
            return;
        }
        let tapes = referent.tapes;
        if (stripHidden) {
            // for the purpose of this comparison, leave out any internal-only
            // tapes, like those created by a Hide().
            tapes = referent.tapes.filter(t => !t.startsWith(HIDDEN_PREFIX));
        }
        try {
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
    expectedVocab: {[tape: string]: number}
): void {

    const interpreter = (grammar instanceof Interpreter) ?
                        grammar :
                        Interpreter.fromGrammar(grammar);

    for (const tapeName in expectedVocab) {
        let tape: Tape;
        try {
            tape = interpreter.tapeNS.get(tapeName);
        } catch (e) {
            it(`should have tape ${tapeName}`, function() {
                assert.fail(e);
            });
            continue;
        }
        const expectedNum = expectedVocab[tapeName];
        it(`should have ${expectedNum} tokens in the ${tapeName} vocab`, function() {
            expect(tape).to.not.be.undefined;
            if (tape == undefined) {
                return;
            }
            expect(tape.vocab.size).to.equal(expectedNum);
        });
    }
}

export function testHasSymbols(
    grammar: Grammar,
    expectedSymbols: string[]
): void {
    const interpreter = Interpreter.fromGrammar(grammar);
    const symbols = interpreter.allSymbols();
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(symbols).to.include(s);
        }
    });
} 

export function testDoesNotHaveSymbols(
    grammar: Grammar,
    expectedSymbols: string[]
): void {
    const interpreter = Interpreter.fromGrammar(grammar);
    const symbols = interpreter.allSymbols();
    it(`should not have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(symbols).to.not.include(s);
        }
    });
}

export function testErrors(
    interpreter: Interpreter,
    expectedErrors: [string, number, number, string][]
) {

    //interpreter.runChecks();
    const devEnv = interpreter.devEnv;
    it(`should have ${expectedErrors.length} errors/warnings`, function() {
        try {
            expect(devEnv.numErrors("any")).to.equal(expectedErrors.length);
        } catch (e) {
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(`outputs: ${JSON.stringify(devEnv.getErrorMessages())}`);
            throw e;
        }
    });

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

export type InputResultsPair = [StringDict, StringDict[]];

export function testParseMultiple(
    grammar: Grammar, 
    inputResultsPairs: InputResultsPair[],
    verbose: number = SILENT,
    maxRecursion: number = 4
): void {

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);
                                    
    for (const [inputs, expectedResults] of inputResultsPairs) {
        describe(`testing parse ${JSON.stringify(inputs)} ` + 
                 `against ${JSON.stringify(expectedResults)}.`, function() {
            let outputs: StringDict[] = [];
            try {    
                //grammar = grammar.compile(2, maxRecursion);
                const interpreter = Interpreter.fromGrammar(grammar, verbose);
                if (Object.keys(inputs).length == 0) {
                    throw new Error(`no input in pair ${JSON.stringify(inputs)}, ${JSON.stringify(expectedResults)}`);
                }
                outputs = [...interpreter.generate("", inputs, Infinity, maxRecursion)];
            } catch (e) {
                it("Unexpected Exception", function() {
                    console.log("");
                    console.log(`[${this.test?.fullTitle()}]`);
                    console.log(e);
                    assert.fail(e);
                });
            }
            testNumOutputs(outputs, expectedResults.length);
            testMatchOutputs(outputs, expectedResults);    
        });
    }
}
