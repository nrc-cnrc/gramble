
import { assert, expect } from "chai";
import { AstComponent, Lit, Root } from "../src/ast";
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

export function testGrammarUncompiled(
    grammar: Root,
    expectedResults: StringDict[], 
    symbolName: string = "__MAIN__",
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    var outputs: StringDict[] = [];
    try {
        outputs = [...grammar.generate(symbolName, {}, false, maxRecursion, maxChars)];
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log(e);
            assert.fail(e);
        });
    }
    testNumOutputs(outputs, expectedResults.length);
    testMatchOutputs(outputs, expectedResults);
}

export function testAst(
    component: AstComponent,
    expectedResults: StringDict[],
    symbolName: string = "__MAIN__",
    maxRecursion: number = 4,
    maxChars: number = 1000
): void {
    const root = component.getRoot();
    describe(`Generating from ${symbolName}`, function() {
        testGrammarUncompiled(root, expectedResults, symbolName, 
            maxRecursion, maxChars);
    });
}

export function testAstHasTapes(
    component: AstComponent,
    expectedTapes: string[],
    symbolName: string = "__MAIN__",
    maxRecursion: number = 4,
    maxChars: number = 1000
): void {
    const root = component.getRoot();
    let tapes = [...root.getTapes(symbolName)];
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

export function testHasVocab(
    component: AstComponent,
    expectedVocab: {[tape: string]: number}
): void {
    const tapeCollection = new TapeCollection();
    component.collectVocab(tapeCollection, []);
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


export function testAstHasSymbols(
    component: AstComponent,
    expectedSymbols: string[]
): void {
    const root = component.getRoot();
    let symbolNames = new Set(root.allSymbols());
    const bSet = new Set(expectedSymbols);
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(symbolNames).to.contain(s);
        }
    });
}


export function testAstDoesNotHaveSymbols(
    component: AstComponent,
    expectedSymbols: string[]
): void {
    const root = component.getRoot();
    let symbolNames = new Set(root.allSymbols());
    const bSet = new Set(expectedSymbols);
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(symbolNames).to.not.contain(s);
        }
    });
}


export function testErrors(project: Gramble, expectedErrors: [string, number, number, string][]) {
    const root = project.getRoot();
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
            try {
                expect(devEnv.getErrors(sheet, row, col).length).to.be.greaterThan(0);
            } catch (e) {
                console.log(`outputs: ${JSON.stringify(devEnv.getErrorMessages())}`);
                throw e;
            }
        });
    }
}

export function testSymbols(project: Gramble, expectedSymbols: string[]): void {
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

/*
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
*/

export function testProject(project: Gramble,
                            expectedResults: StringDict[], 
                            symbolName: string = "__MAIN__",
                            maxRecursion: number = 4, 
                            maxChars: number = 1000): void {
    const root = project.getRoot();
    describe(`Generating from ${symbolName}`, function() {
        testGrammarUncompiled(root, expectedResults, symbolName, 
            maxRecursion, maxChars);
    });
}

export function sheetFromFile(path: string): Gramble {
    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = new Gramble(devEnv, sheetName);
    return project;
}