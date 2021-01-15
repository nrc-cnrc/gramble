import { expect } from 'chai';
import { DevEnvironment } from '../src/devEnv';
import { Header } from '../src/headerParser';
import { Project } from '../src/sheetParser';
import {CounterStack, Literalizer, State} from "../src/stateMachine";
import { TapeCollection } from '../src/tapes';
import {StringDict} from "../src/util";

export const text = Literalizer("text");
export const unrelated = Literalizer("unrelated");
export const t1 = Literalizer("t1");
export const t2 = Literalizer("t2");
export const t3 = Literalizer("t3");

export function testIsType(obj: any, type: any,  objName: string = "itself"): void {
    it(`should have ${objName} be of ${type}`, function() {
        expect(obj instanceof type).to.be.true;
    });
}

export function testHeaderHasText(header: Header, text: string, objName: string = "itself"): void {
    it(`should have ${objName} have text "${text}"`, function() {
        expect(header.text).to.equal(text);
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
        expect(outputs.length).to.equal(expectedNum);
    });
}

export function testNumErrors(devEnv: DevEnvironment, expectedNum: number, errorType: "error"|"warning"|"any") {
    const errorText = (errorType == "any") ? 
                            "error(s)/warning(s)" :
                            errorType + "(s)";
    
    it(`should have ${expectedNum} ${errorText}`, function() {
        expect(devEnv.numErrors(errorType)).to.equal(expectedNum);
    });
}


export function testErrorInCell(devEnv: DevEnvironment, sheet: string, row: number, col: number) {
    it(`should have an error at ${sheet}:${row}:${col}`, function() {
        expect(devEnv.getErrors(sheet, row, col).length)
                                .to.be.greaterThan(0);
    })
}

export function testNumSymbols(project: Project, expectedNum: number): void {
    it (`should have ${expectedNum} symbols defined`, function() {
        expect(project.globalNamespace.allSymbols().length).to.equal(expectedNum);
    });
}


export function testHasSymbol(project: Project, symbolName: string): void {
    it (`should have a symbol named ${symbolName}`, function() {
        expect(project.globalNamespace.get(symbolName)).to.not.be.undefined;
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

