
import { expect } from "chai";
import { AstComponent, Lit } from "../../src/ast";
import { StringDict } from "../../src/util";
import { testGrammarUncompiled } from "../testUtils";


export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);

export function testAst(
    component: AstComponent,
    expectedResults: StringDict[],
    symbolName: string = "__MAIN__",
    maxRecursion: number = 4,
    maxChars: number = 1000
): void {
    const root = component.compile();
    const expr = root.getSymbol(symbolName);
    if (expr == undefined) {
        throw new Error(`Undefined symbol ${symbolName}`);
    }
    describe(`Generating from ${symbolName}`, function() {
        testGrammarUncompiled(expr, expectedResults, maxRecursion, maxChars);
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
    expectedSymbols: string[],
    maxRecursion: number = 4,
    maxChars: number = 1000
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
    expectedSymbols: string[],
    maxRecursion: number = 4,
    maxChars: number = 1000
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