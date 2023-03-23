
import { assert, expect } from "chai";
import { Grammar, Lit } from "../src/grammars";
import { Interpreter } from "../src/interpreter";
import {
    HIDDEN_TAPE_PREFIX, StringDict, tokenizeUnicode,
    SILENT, VERBOSE_DEBUG, logDebug
} from "../src/util";
import { dirname, basename } from "path";
import { existsSync } from "fs";
import { TextDevEnvironment } from "../src/textInterface";
import { cellID, parseCell } from "../src/cell";
import { parseHeaderCell } from "../src/headers";
import { parseOp } from "../src/ops";

export const DEFAULT_MAX_RECURSION = 4;

// DEBUG_MAX_RECURSION is a forced upper bound for maxRecursion.
const DEBUG_MAX_RECURSION: number = 4;      // 4
//const DEBUG_MAX_CHARS: number = 100;        // 100

// Some tests ultimately call testNumOutputs with warnOnly set to 
// WARN_ONLY_FOR_TOO_MANY_OUTPUTS.
// Change the value here to 'false' to make those tests generate errors
// for more than the expected number of outputs.
export const WARN_ONLY_FOR_TOO_MANY_OUTPUTS: boolean = true;

// Permit global control over verbose output in tests.
// To limit verbose output to a specific test file, set VERBOSE_TEST to
// false here, then re-define VERBOSE in the test file.
export const VERBOSE_TEST: boolean = true;

export function verbose(vb: boolean, ...msgs: string[]) {
    if (!vb)
        return;
    logDebug(vb ? VERBOSE_DEBUG : SILENT, ...msgs);
}

export function testSuiteName(mod: NodeModule): string {
    return `${basename(mod.filename)}`
}

export function logTestSuite(vb: boolean, mod: NodeModule): void {
    if (!vb)
        return;
    const date_str: string = (new Date()).toUTCString();
    verbose(vb, "", `--- ${testSuiteName(mod)} [${date_str}] ---`);
}

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export function testTokenize(s: string, expectedResult: string[]): void {
    s = s.normalize('NFD');
    const result = tokenizeUnicode(s);
    expectedResult = expectedResult.map(s => s.normalize('NFD'));
    it(`${s} should tokenize to [${expectedResult.join(" ")}]`, function() {
        expect(result).to.deep.equal(expectedResult);
    });
}

export function testIsType(obj: any, type: any,  objName: string = ""): void {
    const msg = (objName != "") ? `have ${objName} ` : "be"; 
    it(`should ${msg} of type ${type.name}`, function() {
        expect(obj instanceof type).to.be.true;
    });
}

export function testHeaderID(text: string, expectedID: string): void {
    const result = parseHeaderCell(text).msgTo([]);
    it(`"${text}" should parse as ${expectedID}`, function() {
        expect(result.id).to.equal(expectedID);
    });
}

export function testPlaintextID(
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    const [result, msgs] = parseCell("plaintext", text).destructure();
    describe(`${text}`, function() {
        it(`should parse as ${expectedID}`, function() {
            expect(cellID(result)).to.equal(expectedID);
        });
        it(`should have ${numErrorsExpected} errors`, function() {
            expect(msgs.length).to.equal(numErrorsExpected);
        });
    });
}

export function testSymbolID(
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    const [result, msgs] = parseCell("symbol", text).destructure();
    describe(`${text}`, function() {
        it(`should parse as ${expectedID}`, function() {
            expect(cellID(result)).to.equal(expectedID);
        });
        it(`should have ${numErrorsExpected} errors`, function() {
            expect(msgs.length).to.equal(numErrorsExpected);
        });
    });
}

export function testRegexID(
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    const [result, msgs] = parseCell("regex", text).destructure();
    describe(`${text}`, function() {
        it(`should parse as ${expectedID}`, function() {
            expect(cellID(result)).to.equal(expectedID);
        });
        it(`should have ${numErrorsExpected} errors`, function() {
            expect(msgs.length).to.equal(numErrorsExpected);
        });
    });
}

export function testOpID(text: string, expectedID: string): void {
    const result = parseOp(text).msgTo([]);
    it(`"${text}" should parse as ${expectedID}`, function() {
        expect(result.id).to.equal(expectedID);
    });
}

export function testNumOutputs(outputs: StringDict[], expectedNum: number, warningOnly: boolean = false): void {
    const date_str: string = (new Date()).toUTCString();
    const testName: string = `should have ${expectedNum} result(s)`;
    it(`${testName}`, function() {
        try {
            expect(outputs.length).to.equal(expectedNum);
        } catch (e) {
            console.log("");
            console.log(`[${testName}] ${outputs.length} outputs: ${JSON.stringify(outputs)}`);
            if (warningOnly && outputs.length > expectedNum) {
                console.log(`Warning: should have ${expectedNum} result(s), but found ${outputs.length}.`)
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
            if (key.startsWith(HIDDEN_TAPE_PREFIX)) {
                continue;
            }
            result[key] = value;
        }
        results.push(result);
    }
    return results;
}

export function testMatchOutputs(outputs: StringDict[], expected_outputs: StringDict[]): void {
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
        const testName = `should match items ${start}-${end_expected-1}: ${expected_outputs_str}`;
        it(`${testName}`, function() {
            this.timeout(10000);
            try {
                expect(outputs).to.deep.include.members(expected_outputs.slice(start, end_expected));
                expect(expected_outputs).to.deep.include.members(outputs.slice(start, end_outputs));
            } catch (e) {
                console.log("");
                console.log(`[${testName}] ${outputs.length} outputs: ${JSON.stringify(outputs)}`);
                throw e;
            }
        });
    });
}

export function generateOutputsFromGrammar(
    grammar: Grammar,
    symbolName: string = "",
    maxRecursion: number = DEFAULT_MAX_RECURSION,
    stripHidden: boolean = true
): StringDict[] {
    let outputs: StringDict[] = [];

    const interpreter = Interpreter.fromGrammar(grammar);

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);
    //maxChars = Math.min(maxChars, DEBUG_MAX_CHARS);

    try {
        outputs = [...interpreter.generate(symbolName, {}, Infinity, maxRecursion,
                                           undefined, stripHidden)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }
    return outputs;
}

function testGrammarAux(
    interpreter: Interpreter,
    expectedResults: StringDict[], 
    symbolName: string,
    maxRecursion: number, 
    stripHidden: boolean,
    warnOnlyForTooManyOutputs: boolean
): void {
    let outputs: StringDict[] = [];

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);
    //maxChars = Math.min(maxChars, DEBUG_MAX_CHARS);

    try {
        outputs = [...interpreter.generate(symbolName, {}, Infinity, maxRecursion,
                                           undefined, stripHidden)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }
    testNumOutputs(outputs, expectedResults.length, warnOnlyForTooManyOutputs);
    testMatchOutputs(outputs, expectedResults);
}

export function testGrammar(
    grammar: Grammar | Interpreter,
    expectedResults: StringDict[],
    verbose: number = SILENT,
    symbolName: string = "",
    maxRecursion: number = DEFAULT_MAX_RECURSION,
    stripHidden: boolean = true,
    warnOnlyForTooManyOutputs: boolean = false
): void {
    
    const interpreter = (grammar instanceof Interpreter) ?
                        grammar :
                        Interpreter.fromGrammar(grammar, verbose);
                        
    if (symbolName == "") {
        testGrammarAux(interpreter, expectedResults, symbolName, maxRecursion,
                       stripHidden, warnOnlyForTooManyOutputs);
    } else {
        describe(`Generating from \${${symbolName}}`, function() {
            testGrammarAux(interpreter, expectedResults, symbolName, maxRecursion,
                           stripHidden, warnOnlyForTooManyOutputs);
        });
    }   
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
                        
    let referent = interpreter.grammar.getSymbol(symbolName);
    
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
            tapes = referent.tapes.filter(t => !t.startsWith(HIDDEN_TAPE_PREFIX));
        }
        try {
            expect(tapes.length).to.equal(bSet.size);
            for (const a of tapes) {
                expect(bSet).to.contain(a);
            }
        } catch (e) {
            console.log("");
            console.log(`[${testName}] ${tapes.length} tapes [${tapes}]`);
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
        const tape = interpreter.tapeNS.get(tapeName);
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
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(symbols).to.not.include(s);
        }
    });
}

export function testErrors(interpreter: Interpreter, expectedErrors: [string, number, number, string][]) {

    //interpreter.runChecks();
    const devEnv = interpreter.devEnv;
    it(`should have ${expectedErrors.length} errors/warnings`, function() {
        try {
            expect(devEnv.numErrors("any")).to.equal(expectedErrors.length);
        } catch (e) {
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
                console.log(`outputs: ${JSON.stringify(devEnv.getErrorMessages())}`);
                throw e;
            }
        });
    }
}

export function sheetFromFile(
    path: string,
    verbose: number = SILENT
): Interpreter {
    if (!existsSync(path)) {
        throw new Error(`Cannot find file ${path}`);
    }
    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    return Interpreter.fromSheet(devEnv, sheetName, verbose);
}


export type InputResultsPair = [StringDict, StringDict[]];

export function testParseMultiple(
    grammar: Grammar, 
    inputResultsPairs: InputResultsPair[],
    verbose: number = SILENT,
    maxRecursion: number = 4
): void {

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);
    //maxChars = Math.min(maxChars, DEBUG_MAX_CHARS);
                                    
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
                    console.log(e);
                    assert.fail(e);
                });
            }
            testNumOutputs(outputs, expectedResults.length);
            testMatchOutputs(outputs, expectedResults);    
        });
    }
}
