
import { assert, expect } from "chai";
import { AstComponent, Lit, Root } from "../../src/ast";
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
    const root = component.compile();
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
    const root = component.compile();
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
    const root = component.compile();
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
    const root = component.compile();
    let symbolNames = new Set(root.allSymbols());
    const bSet = new Set(expectedSymbols);
    it(`should have symbols [${expectedSymbols}]`, function() {
        for (const s of expectedSymbols) {
            expect(symbolNames).to.not.contain(s);
        }
    });
}