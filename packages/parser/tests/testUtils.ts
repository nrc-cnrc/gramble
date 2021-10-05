
import { assert, expect } from "chai";
import { GrammarComponent, CounterStack, Lit, GenOptions } from "../src/grammars";
import { Gramble } from "../src/gramble";
import { StringDict } from "../src/util";
import { dirname, basename } from "path";
import { TextDevEnvironment } from "../src/textInterface";
import { TapeCollection } from "../src/tapes";

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export function testIsType(obj: any, type: any,  objName: string = ""): void {
    const msg = (objName != "") ? `have ${objName} ` : ""; 
    it(`should ${msg}be of type ${type.name}`, function() {
        expect(obj instanceof type).to.be.true;
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
    grammar: GrammarComponent,
    expectedResults: StringDict[], 
    symbolName: string = "",
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    var outputs: StringDict[] = [];
    
    const opt: GenOptions = {
        random: false,
        maxRecursion: maxRecursion,
        maxChars: maxChars
    }

    try {
        outputs = [...grammar.generate(symbolName, undefined, opt)];
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
    grammar: GrammarComponent,
    expectedResults: StringDict[],
    symbolName: string = "",
    maxRecursion: number = 4,
    maxChars: number = 1000,
): void {
    if (symbolName == "") {
        testGrammarAux(grammar, expectedResults, symbolName,
            maxRecursion, maxChars);
    } else {
        describe(`Generating from \${${symbolName}}`, function() {
            testGrammarAux(grammar, expectedResults, symbolName, 
                maxRecursion, maxChars);
        });
    }   
}

export function testHasTapes(
    grammar: GrammarComponent,
    expectedTapes: string[],
    symbolName: string = ""
): void {
    grammar.qualifyNames();

    const stack = new CounterStack(2);
    let target = grammar.getSymbol(symbolName);
    
    const bSet = new Set(expectedTapes);
    it(`should have tapes [${[...bSet]}]`, function() {
        expect(target).to.not.be.undefined;
        if (target == undefined) {
            return;
        }
        let tapes = [...target.calculateTapes(stack)];
        tapes = tapes.filter(t => !t.startsWith("__")); // for the purpose of this comparison,
                                    // leave out any internal-only tapes, like those created 
                                    // by a Drop().
        expect(tapes.length).to.equal(bSet.size);
        for (const a of tapes) {
            expect(bSet).to.contain(a);
        }
    });
}

export function testHasVocab(
    grammar: GrammarComponent,
    expectedVocab: {[tape: string]: number}
): void {

    const opt: GenOptions = {
        random: true,
        maxRecursion: 2,
        maxChars: 1000
    }

    grammar.calculateTapes(new CounterStack(2));
    const tapeCollection = new TapeCollection();
    grammar.collectVocab(tapeCollection);
    grammar.copyVocab(tapeCollection);
    for (const tapeName in expectedVocab) {
        const tape = tapeCollection.matchTape(tapeName);
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
    grammar: GrammarComponent,
    expectedSymbols: string[]
): void {
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(grammar.getSymbol(s)).to.not.be.undefined;
        }
    });
} 

export function testDoesNotHaveSymbols(
    grammar: GrammarComponent,
    expectedSymbols: string[]
): void {
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(grammar.getSymbol(s)).to.be.undefined;
        }
    });
}

export function testErrors(gramble: Gramble, expectedErrors: [string, number, number, string][]) {

    const devEnv = gramble.devEnv;
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
    gramble: Gramble,
    expectedResults: StringDict[], 
    symbolName: string = "",
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    const grammar = gramble.getGrammar();
    describe(`Generating from ${symbolName}`, function() {
        testGrammarAux(grammar, expectedResults, symbolName, 
            maxRecursion, maxChars);
    });
}

export function sheetFromFile(path: string): Gramble {
    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const gramble = new Gramble(devEnv, sheetName);
    return gramble;
}


export type InputResultsPair = [StringDict, StringDict[]];

export function testParseMultiple(grammar: GrammarComponent, 
                                    inputResultsPairs: InputResultsPair[],
                                    maxRecursion: number = 4, 
                                    maxChars: number = 1000): void {

                                        
    const opt: GenOptions = {
        random: false,
        maxRecursion: maxRecursion,
        maxChars: maxChars
    }

    for (const [inputs, expectedResults] of inputResultsPairs) {
        describe(`testing parse ${JSON.stringify(inputs)} ` + 
                 `against ${JSON.stringify(expectedResults)}.`, function() {
            var outputs: StringDict[] = [];
            try {    
                //grammar = grammar.compile(2, maxRecursion);
                outputs = [...grammar.generate("", inputs, opt)];
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