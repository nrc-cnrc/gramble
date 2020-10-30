import { expect } from 'chai';
import { ErrorAccumulator } from '../src/sheetParser';
import {Literalizer} from "../src/stateMachine";
import {StringDict} from "../src/util";

export const text = Literalizer("text");
export const unrelated = Literalizer("unrelated");
export const t1 = Literalizer("t1");
export const t2 = Literalizer("t2");
export const t3 = Literalizer("t3");


export function testNumOutputs(outputs: StringDict[], expectedNum: number) {
    it(`should have ${expectedNum} result(s)`, function() {
        expect(outputs.length).to.equal(expectedNum);
    });
}

export function testNumErrors(errors: ErrorAccumulator, expectedNum: number, errorType: "error"|"warning"|"any") {
    const errorText = (errorType == "any") ? 
                            "error(s)/warning(s)" :
                            errorType + "(s)";
    
    it(`should have ${expectedNum} ${errorText}`, function() {
        expect(errors.numErrors(errorType)).to.equal(expectedNum);
    });
}

export function testErrorInCell(errors: ErrorAccumulator, sheet: string, row: number, col: number) {
    it(`should have an error at ${sheet}:${row}:${col}`, function() {
        expect(errors.getErrors(sheet, row, col).length)
                                .to.be.greaterThan(0);
    })
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