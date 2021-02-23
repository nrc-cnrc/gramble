import { assert, expect } from 'chai';
import { Project, Header, GrammarComponent } from '../src/sheetParser';
import { CounterStack, Literalizer, State } from "../src/stateMachine";
import { TapeCollection } from '../src/tapes';
import { StringDict } from "../src/util";

export const text = Literalizer("text");
export const unrelated = Literalizer("unrelated");
export const t1 = Literalizer("t1");
export const t2 = Literalizer("t2");
export const t3 = Literalizer("t3");
export const t4 = Literalizer("t4");

export function testIsType(obj: any, type: any,  objName: string = ""): void {
    const msg = (objName != "") ? `have ${objName} ` : ""; 
    it(`should ${msg}be of type ${type.name}`, function() {
        expect(obj instanceof type).to.be.true;
    });
}

export function testHasTapes(state: State, expectedTapes: string[]): void {
    const stack = new CounterStack(2);
    const tapes = state.getRelevantTapes(stack);
    const bSet = new Set(expectedTapes);
    it(`should have tapes [${[...bSet]}]`, function() {
        expect(tapes.size).to.equal(bSet.size);
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

export function testHasOutput(outputs: StringDict[], tier: string, target: string) {
    it(`should have ${target} on tier ${tier}`, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}

export function testDoesntHaveOutput(outputs: StringDict[], tier: string, target: string) {
    it(`should not have ${target} on tier ${tier}`, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.not.contain(target);
    });
}

export function testMatchOutputs(outputs: StringDict[], expected_outputs: StringDict[]): void {
    // Check that the output dictionaries of State.generate() match the expected
    // outputs.
    //
    // Outputs can be in any order.
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

export function testGrammar(
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
    project: Project,
    symbolName: string,
    numSamples: number = 100,
    numTries: number = 10000,
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    const grammar = project.getSymbol(symbolName);
    if (grammar == undefined) {
        return;
    }
    var generatedOutputs: StringDict[] = [];
    try {
        generatedOutputs = [...grammar.generate(false, maxRecursion, maxChars)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }

    // sample 1000 times and make sure that every sample is in the generated outputs, 
    // and every output is sampled at least once
    var sampledOutputs = project.sample(symbolName, numSamples, {}, numTries, maxRecursion, maxChars);
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
    describe("Uncompiled grammar", function() {
        testGrammarUncompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
    describe("Random sampling", function() {
        testSample(project, symbolName, 100, 10000, maxRecursion, maxChars);
    });
    describe("Compiled grammar", function() {
        testGrammarCompiled(grammar, expectedResults, maxRecursion, maxChars);
    });
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
        expect(devEnv.numErrors("any")).to.equal(expectedErrors.length);
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
            expect(project.getSymbol(symbolName)).to.not.be.undefined;
        });
    }
}

export function testStructure(project: Project, expectedOps: [string, string[]][]) {
    const sheet = project.getDefaultSheet();
    for (const [text, relationship] of expectedOps) {
        const relationshipMsg = relationship.join("'s ");
        it(`should have "${text}" as its ${relationshipMsg}`, function() {
            var relative: GrammarComponent | undefined = sheet;
            for (const rel of relationship) {
                if (rel == "child") {
                    relative = relative.child;
                } else if (rel == "sibling") {
                    relative = relative.sibling;
                } else {
                    assert.fail("There is no relationship of that name");
                }
                expect(relative).to.not.be.undefined;
                if (relative == undefined) return;
            }
            var relativeText = relative.text;
            if (relativeText.endsWith(":")) {
                relativeText = relativeText.slice(0, relativeText.length-1).trim();
            }
            expect(relativeText).to.equal(text);
        });
    }

}