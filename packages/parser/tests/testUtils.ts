import { assert, expect } from 'chai';
import { Header } from '../src/headers';
import { Project } from "../src/project";
import { TstEnclosure } from '../src/tsts';
import { CounterStack, Literalizer, Namespace, State } from "../src/stateMachine";
import { TapeCollection } from '../src/tapes';
import { StringDict } from "../src/util";

export const text = Literalizer("text");
export const unrelated = Literalizer("unrelated");
export const t1 = Literalizer("t1");
export const t2 = Literalizer("t2");
export const t3 = Literalizer("t3");
export const t4 = Literalizer("t4");

export function makeTestNamespace(symbols: {[key: string]: State} = {}) {
    const symbolTable = new Namespace("__TEST__");
    for (const symbolName in symbols) {
        symbolTable.addSymbol(symbolName, symbols[symbolName]);
    }
    return symbolTable;
}

export function testIsType(obj: any, type: any,  objName: string = ""): void {
    const msg = (objName != "") ? `have ${objName} ` : ""; 
    it(`should ${msg}be of type ${type.name}`, function() {
        expect(obj instanceof type).to.be.true;
    });
}

export function testHasTapes(state: State, expectedTapes: string[]): void {
    const stack = new CounterStack(2);
    var tapes = [...state.getRelevantTapes(stack)];
    tapes = tapes.filter(t => !t.startsWith("__")); // for the purpose of this comparison,
                                // leave out any internal-only tapes, like those created 
                                // by a Drop().
    const bSet = new Set(expectedTapes);
    it(`should have tapes [${[...bSet]}]`, function() {
        expect(tapes.length).to.equal(bSet.size);
        for (const a of tapes) {
            expect(bSet).to.contain(a);
        }
    });
}

export function testHasVocab(state: State, expectedVocab: {[tape: string]: number}) {
    const tapeCollection = new TapeCollection();
    state.collectVocab(tapeCollection, []);
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

export function testHasNoVocab(state: State, forbiddenVocab: string) {
    const tapeCollection = new TapeCollection();
    state.collectVocab(tapeCollection, []);
    const tape = tapeCollection.matchTape(forbiddenVocab);
    it(`should have no ${forbiddenVocab} vocab`, function() {
        expect(tape).to.be.undefined;
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

export function testHasOutput(outputs: StringDict[], tape: string, target: string) {
    it(`should have ${target} on tape ${tape}`, function() {
        var results = outputs.filter(o => tape in o)
                             .map(o => o[tape]);
        expect(results).to.contain(target);
    });
}

export function testDoesntHaveOutput(outputs: StringDict[], tape: string, target: string) {
    it(`should not have ${target} on tape ${tape}`, function() {
        var results = outputs.filter(o => tape in o)
                             .map(o => o[tape]);
        expect(results).to.not.contain(target);
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

export function testGenerate(
    grammar: State, 
    expectedResults: StringDict[], 
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    describe("Uncompiled grammar", function() {
        testGrammarUncompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
    describe("Compiled grammar", function() {
        testGrammarCompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
}

export function testGenerateAndSample(
    grammar: State, 
    expectedResults: StringDict[], 
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    describe("Uncompiled grammar", function() {
        testGrammarUncompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
    describe("Sampling from uncompiled grammar", function() {
        testSample(grammar, 500, 10000, maxRecursion, maxChars);
    });
    describe("Compiled grammar", function() {
        testGrammarCompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
}

export function testGrammarCompiled(
    grammar: State,
    expectedResults: StringDict[], 
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    try {
        grammar = grammar.compile(2, maxRecursion);
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }
    testGrammarUncompiled(grammar, expectedResults, maxRecursion, maxChars);
}

export function testGrammarUncompiled(
    grammar: State,
    expectedResults: StringDict[], 
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    var outputs: StringDict[] = [];
    try {
        outputs = [...grammar.generate(false, maxRecursion, maxChars)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }
    testNumOutputs(outputs, expectedResults.length);
    testMatchOutputs(outputs, expectedResults);
}

export function testParse(grammar: State, 
                            inputs: StringDict,
                            expectedResults: StringDict[], 
                            maxRecursion: number = 4, 
                            maxChars: number = 1000): void {
    var outputs: StringDict[] = [];
    try {    
        grammar = grammar.compile(2, maxRecursion);
        outputs = [...grammar.parse(inputs, false, maxRecursion, maxChars)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }
    testNumOutputs(outputs, expectedResults.length);
    testMatchOutputs(outputs, expectedResults);
}


function stringDictEquals(a: StringDict, b: StringDict): boolean {
    var aProps = Object.getOwnPropertyNames(a);
    var bProps = Object.getOwnPropertyNames(b);
    if (aProps.length != bProps.length) {
        return false;
    }

    for (var i = 0; i < aProps.length; i++) {
        var propName = aProps[i];
        if (a[propName] !== b[propName]) {
            return false;
        }
    }
    return true;
}

function stringDictUnique(records: StringDict[]): StringDict[] {
    const uniqueDicts: StringDict[] = [];
    for (const record of records) {
        var found = false;
        for (const other of uniqueDicts) {
            if (stringDictEquals(record, other)) {
                found = true;
                continue;
            }
        }
        if (!found) {
            uniqueDicts.push(record);
        }
    }
    return uniqueDicts;
}

export function testSample(
    grammar: State,
    numSamples: number = 500,
    maxTries: number = 1000,
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    var generatedOutputs: StringDict[] = [];
    try {
        generatedOutputs = [...grammar.generate(false, maxRecursion, maxChars)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }

    // sample numSamples times and make sure that every sample is in the generated outputs, 
    // and every output is sampled at least once
    var sampledOutputs = grammar.sample({}, numSamples, maxTries, maxRecursion, maxChars);
    sampledOutputs = stringDictUnique(sampledOutputs);
    it("every generable output should be sampled", function() {
        for (var generatedOutput of generatedOutputs) {
            expect(sampledOutputs).to.deep.include(generatedOutput);
        }
    });

    it("every sampled output should be generable", function() {
        for (var sampledOutput of sampledOutputs) {
            expect(generatedOutputs).to.deep.include(sampledOutput);
        }
    });
}


export function testProject(project: Project,
                            symbolName: string,
                            expectedResults: StringDict[], 
                            maxRecursion: number = 4, 
                            maxChars: number = 1000): void {

    const grammar = project.getSymbol(symbolName);
    if (grammar == undefined) {
        return;
    }    
    /*
    describe("Uncompiled grammar", function() {
        testGrammarUncompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
    describe("Sampling from uncompiled grammar", function() {
        testSample(grammar, 100, 10000, maxRecursion, maxChars);
    });
    describe("Compiled grammar", function() {
        testGrammarCompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
    */
}

export function testHeaderHasText(header: Header, text: string, objName: string = ""): void {
    const msg = (objName == "") ? "" : ` ${objName} with`;
    it(`should have${msg} text "${text}"`, function() {
        expect(header.text).to.equal(text);
    });
}

/**
 * devEnv: the DevEnvironment that collected the errors
 * errors: list of [sheetName, row, column, level], where level is "error"|"warning"
 */
export function testErrors(project: Project, expectedErrors: [string, number, number, string][]) {
    const devEnv = project.devEnv;
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
            expect(devEnv.getErrors(sheet, row, col).length).to.be.greaterThan(0);
        });
    }
}

export function testSymbols(project: Project, expectedSymbols: string[]): void {
    for (const symbolName of expectedSymbols) {
        it (`should have a symbol named "${symbolName}"`, function() {
            try {
                expect(project.getSymbol(symbolName)).to.not.be.undefined;
            } catch (e) {
                console.log(`available symbols: [${project.allSymbols()}]`);
                throw e;
            }
        });
    }
}

export function testStructure(project: Project, expectedOps: [string, string[]][]) {
    const sheet = project.getDefaultSheet();
    for (const [text, relationship] of expectedOps) {
        const relationshipMsg = relationship.join("'s ");
        it(`should have "${text}" as its ${relationshipMsg}`, function() {
            var relative: TstEnclosure | undefined = sheet;
            for (const rel of relationship) {
                if (rel == "child" && relative != undefined) {
                    relative = relative.child;
                } else if (rel == "sibling"  && relative != undefined) {
                    relative = relative.sibling;
                } else {
                    assert.fail("There is no relationship of that name");
                }
                expect(relative).to.not.be.undefined;
                if (relative == undefined) return;
            }
            if (relative == undefined) return;
            var relativeText = relative.text;
            if (relativeText.endsWith(":")) {
                relativeText = relativeText.slice(0, relativeText.length-1).trim();
            }
            expect(relativeText).to.equal(text);
        });
    }

}