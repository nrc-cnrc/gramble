
import { assert, expect } from "chai";
import { Grammar, Lit } from "../src/grammars";
import { Interpreter } from "../src/interpreter";
import { StringDict, tokenizeUnicode } from "../src/util";
import { dirname, basename } from "path";
import { existsSync } from "fs";
import { TextDevEnvironment } from "../src/textInterface";
import { CPResult, parseBooleanCell } from "../src/cells";

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

export function testCellID(cell: string, expectedID: string) {
    const result = parseBooleanCell(cell);
    it(`"${cell}" should have an id of ${expectedID}`, function() {
        expect(result.id).to.equal(expectedID);
    });
}

export function testNumOutputs(outputs: StringDict[], expectedNum: number) {
    it(`should have ${expectedNum} result(s)`, function() {
        try {
            expect(outputs.length).to.equal(expectedNum);
        } catch (e) {
            console.log(`outputs: ${JSON.stringify(outputs)}`);
            throw e;
        }
    });
}

export function removeHiddenFields(outputs: StringDict[]): StringDict[] {
    const results: StringDict[] = [];
    for (const output of outputs) {
        const result: StringDict = {};
        for (const [key, value] of Object.entries(output)) {
            if (key.startsWith("__")) {
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
    outputs = removeHiddenFields(outputs);
    it(`should match ${JSON.stringify(expected_outputs)}`, function() {
        for (var expected_output of expected_outputs) {
            try {
                expect(outputs).to.deep.include(expected_output);
            } catch (e) {
                console.log(`outputs: ${JSON.stringify(outputs)}`);
                throw e;
            }
        }
        for (var output of outputs) {
            try {
                expect(expected_outputs).to.deep.include(output);
            } catch (e) {
                console.log(`outputs: ${JSON.stringify(outputs)}`);
                throw e;
            }
        }
    });
}

function testGrammarAux(
    interpreter: Interpreter,
    expectedResults: StringDict[], 
    symbolName: string = "",
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    var outputs: StringDict[] = [];

    try {
        outputs = [...interpreter.generate(symbolName, {}, Infinity, maxRecursion, maxChars)];
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
    maxChars: number = 1000,
): void {
    const interpreter = Interpreter.fromGrammar(grammar);
    if (symbolName == "") {
        testGrammarAux(interpreter, expectedResults, symbolName,
            maxRecursion, maxChars);
    } else {
        describe(`Generating from \${${symbolName}}`, function() {
            testGrammarAux(interpreter, expectedResults, symbolName, 
                maxRecursion, maxChars);
        });
    }   
}

export function testHasTapes(
    grammar: Grammar,
    expectedTapes: string[],
    symbolName: string = ""
): void {
    const interpreter = Interpreter.fromGrammar(grammar);
    let target = interpreter.grammar.getSymbol(symbolName);
    
    const bSet = new Set(expectedTapes);
    it(`should have tapes [${[...bSet]}]`, function() {
        expect(target).to.not.be.undefined;
        if (target == undefined || target.tapes == undefined) {
            return;
        }
        const tapes = target.tapes.filter(t => !t.startsWith("__")); // for the purpose of this comparison,
                                    // leave out any internal-only tapes, like those created 
                                    // by a Drop().
        expect(tapes.length).to.equal(bSet.size);
        for (const a of tapes) {
            expect(bSet).to.contain(a);
        }
    });
}

export function testHasVocab(
    grammar: Grammar,
    expectedVocab: {[tape: string]: number}
): void {

    const interpreter = Interpreter.fromGrammar(grammar);

    for (const tapeName in expectedVocab) {
        const tape = interpreter.tapeObjs.matchTape(tapeName);
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
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    describe(`Generating from ${symbolName}`, function() {
        testGrammarAux(interpreter, expectedResults, symbolName, 
            maxRecursion, maxChars);
    });
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

export function testParseMultiple(grammar: Grammar, 
                                    inputResultsPairs: InputResultsPair[],
                                    maxRecursion: number = 4, 
                                    maxChars: number = 1000): void {

    for (const [inputs, expectedResults] of inputResultsPairs) {
        describe(`testing parse ${JSON.stringify(inputs)} ` + 
                 `against ${JSON.stringify(expectedResults)}.`, function() {
            var outputs: StringDict[] = [];
            try {    
                //grammar = grammar.compile(2, maxRecursion);
                const interpreter = Interpreter.fromGrammar(grammar);
                outputs = [...interpreter.generate("", inputs, Infinity, maxRecursion, maxChars)];
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