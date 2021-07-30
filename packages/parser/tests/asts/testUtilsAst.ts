
import { assert, expect } from "chai";
import { AstComponent, Lit, Root } from "../../src/ast";
import { Project } from "../../src/project";
import { TstEnclosure } from "../../src/tsts";
import { StringDict } from "../../src/util";
import { testMatchOutputs, testNumOutputs } from "../testUtils";


export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export function testGrammarUncompiled(
    grammar: Root,
    expectedResults: StringDict[], 
    symbolName: string = "__MAIN__",
    maxRecursion: number = 4, 
    maxChars: number = 1000
): void {
    var outputs: StringDict[] = [];
    try {
        outputs = [...grammar.generate(symbolName, false, maxRecursion, maxChars)];
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


export function testErrors(project: Project, expectedErrors: [string, number, number, string][]) {
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


export function testProject(project: Project,
                            expectedResults: StringDict[], 
                            symbolName: string = "__MAIN__",
                            maxRecursion: number = 4, 
                            maxChars: number = 1000): void {
    const grammar = project.globalNamespace;
    testAst(grammar, expectedResults, symbolName, maxRecursion, maxChars);
}