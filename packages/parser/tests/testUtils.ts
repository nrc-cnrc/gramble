
import { assert, expect } from "chai";
import { Grammar, Lit } from "../src/grammars";
import { Interpreter } from "../src/interpreter";
import { HIDDEN_TAPE_PREFIX, StringDict, tokenizeUnicode } from "../src/util";
import { dirname, basename } from "path";
import { existsSync } from "fs";
import { TextDevEnvironment } from "../src/textInterface";
import { parseRegex } from "../src/regex";
import { parseHeaderCell } from "../src/headers";

const DEBUG_MAX_RECURSION: number = 4;      // 4
//const DEBUG_MAX_CHARS: number = 100;        // 100

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
    const msg = (objName != "") ? `have ${objName} ` : ""; 
    it(`should ${msg}be of type ${type.name}`, function() {
        expect(obj instanceof type).to.be.true;
    });
}

export function testHeaderID(header: string, expectedID: string) {
    const result = parseHeaderCell(header);
    it(`"${header}" should have an id of ${expectedID}`, function() {
        expect(result.id).to.equal(expectedID);
    });
}

export function testCellID(cell: string, expectedID: string) {
    const result = parseRegex(cell);
    it(`"${cell}" should have an id of ${expectedID}`, function() {
        expect(result.id).to.equal(expectedID);
    });
}

export function testNumOutputs(outputs: StringDict[], expectedNum: number) {
    const date_str: string = (new Date()).toUTCString();
    const testName: string = `should have ${expectedNum} result(s)`;
    it(`${testName}`, function() {
        try {
            expect(outputs.length).to.equal(expectedNum);
        } catch (e) {
            console.log("");
            console.log(`[${date_str}] [${testName}] ${outputs.length} outputs: ${JSON.stringify(outputs)}`);
            throw e;
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
    // Check that the output dictionaries of State.generate() match the expected
    // outputs.
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

    const date_str: string = (new Date()).toUTCString();

    let incr: number = Math.max(expected_outputs.length, outputs.length, 1);
    if (incr > 2500) {
        incr = Math.ceil(70000 / incr) * 100;
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
            end_outputs = outputs.length;
        let expected_outputs_str: string;
        if (end_expected - start < 20)
            expected_outputs_str = JSON.stringify(expected_outputs.slice(start, end_expected));
        else
            expected_outputs_str = JSON.stringify(expected_outputs.slice(start, start+20)) + "...";
        const testName = `should match items ${start}-${end_expected-1}: ${expected_outputs_str}`;
        it(`${testName}`, function() {
            this.timeout(10000);
            for (let expected_output of expected_outputs.slice(start, end_expected)) {
                try {
                    expect(outputs).to.deep.include(expected_output);
                } catch (e) {
                    console.log("");
                    console.log(`[${date_str}] [${testName}] ${outputs.length} outputs: ${JSON.stringify(outputs)}`);
                    throw e;
                }
            }
            for (let output of outputs.slice(start, end_outputs)) {
                try {
                    expect(expected_outputs).to.deep.include(output);
                } catch (e) {
                    console.log("");
                    console.log(`[${date_str}] [${testName}] ${outputs.length} outputs: ${JSON.stringify(outputs)}`);
                    throw e;
                }
            }
        });
    });
}

export function generateOutputsFromGrammar(
    grammar: Grammar,
    symbolName: string = "",
    maxRecursion: number = 4,
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
    symbolName: string = "",
    maxRecursion: number = 4, 
    //maxChars: number = 1000,
    stripHidden: boolean = true
): void {
    var outputs: StringDict[] = [];

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
    testNumOutputs(outputs, expectedResults.length);
    testMatchOutputs(outputs, expectedResults);
}

export function testGrammar(
    grammar: Grammar,
    expectedResults: StringDict[],
    symbolName: string = "",
    maxRecursion: number = 4,
    stripHidden: boolean = true
): void {
    const interpreter = Interpreter.fromGrammar(grammar);
    if (symbolName == "") {
        testGrammarAux(interpreter, expectedResults, symbolName, maxRecursion, stripHidden);
    } else {
        describe(`Generating from \${${symbolName}}`, function() {
            testGrammarAux(interpreter, expectedResults, symbolName, maxRecursion, stripHidden);
        });
    }   
}

export function testHasTapes(
    grammar: Grammar,
    expectedTapes: string[],
    symbolName: string = "",
    stripHidden: boolean = true
): void {
    const interpreter = Interpreter.fromGrammar(grammar);
    let target = interpreter.grammar.getSymbol(symbolName);
    
    const bSet = new Set(expectedTapes);
    const date_str: string = (new Date()).toUTCString();
    const testName: string = `${symbolName} should have tapes [${[...bSet]}]`;
    it(`${testName}`, function() {
        expect(target).to.not.be.undefined;
        if (target == undefined || target.tapes == undefined) {
            return;
        }
        let tapes = target.tapes;
        if (stripHidden) {
            // for the purpose of this comparison, leave out any internal-only
            // tapes, like those created by a Hide().
            tapes = target.tapes.filter(t => !t.startsWith(HIDDEN_TAPE_PREFIX));
        }
        try {
            expect(tapes.length).to.equal(bSet.size);
            for (const a of tapes) {
                expect(bSet).to.contain(a);
            }
        } catch (e) {
            console.log("");
            console.log(`[${date_str}] [${testName}] ${tapes.length} tapes [${tapes}]`);
            throw e;
        }
    });
}

export function testHasVocab(
    grammar: Grammar,
    expectedVocab: {[tape: string]: number}
): void {

    const interpreter = Interpreter.fromGrammar(grammar);

    for (const tapeName in expectedVocab) {
        const tape = interpreter.tapeObjs.getTape(tapeName);
        const expectedNum = expectedVocab[tapeName];
        it(`should have ${expectedNum} tokens in the ${tapeName} vocab`, function() {
            expect(tape).to.not.be.undefined;
            if (tape == undefined) {
                return;
            }
            expect(tape.vocabSize).to.equal(expectedNum);
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

    interpreter.runChecks();
    const devEnv = interpreter.devEnv;
    it(`should have ${expectedErrors.length} errors/warnings`, function() {
        try {
            expect(devEnv.numErrors("any")).to.equal(expectedErrors.length);
        } catch (e) {
            console.log(`outputs: ${JSON.stringify(devEnv.getErrorMessages())}`);
            throw e;
        }
    });

    for (var [sheet, row, col, level] of expectedErrors) {
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

export function testGramble(
    interpreter: Interpreter,
    expectedResults: StringDict[], 
    symbolName: string = "",
    maxRecursion: number = 4
): void {
    if (symbolName == "") {
        testGrammarAux(interpreter, expectedResults, symbolName,
            maxRecursion);
    } else {
        describe(`Generating from ${symbolName}`, function() {
            testGrammarAux(interpreter, expectedResults, symbolName, 
                maxRecursion);
        });
    }
}

export function sheetFromFile(path: string): Interpreter {
    if (!existsSync(path)) {
        throw new Error(`Cannot find file ${path}`);
    }
    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    return Interpreter.fromSheet(devEnv, sheetName);
}


export type InputResultsPair = [StringDict, StringDict[]];

export function testParseMultiple(
    grammar: Grammar, 
    inputResultsPairs: InputResultsPair[],
    maxRecursion: number = 4
): void {

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);
    //maxChars = Math.min(maxChars, DEBUG_MAX_CHARS);
                                    
    for (const [inputs, expectedResults] of inputResultsPairs) {
        describe(`testing parse ${JSON.stringify(inputs)} ` + 
                 `against ${JSON.stringify(expectedResults)}.`, function() {
            var outputs: StringDict[] = [];
            try {    
                //grammar = grammar.compile(2, maxRecursion);
                const interpreter = Interpreter.fromGrammar(grammar);
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