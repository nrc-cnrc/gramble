import { expect } from 'chai';
import {Literalizer} from "../src/stateMachine";
import {StringDict} from "../src/util";

export const text = Literalizer("text");
export const unrelated = Literalizer("unrelated");
export const t1 = Literalizer("t1");
export const t2 = Literalizer("t2");
export const t3 = Literalizer("t3");


export function testNumOutputs(outputs: StringDict[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(outputs.length).to.equal(expected_num);
    });
}

export function testHasOutput(outputs: StringDict[], tier: string, target: string) {
    it("should have " + target + " on tier " + tier, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}

export function testDoesntHaveOutput(outputs: StringDict[], tier: string, target: string) {
    it("should not have " + target + " on tier " + tier, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.not.contain(target);
    });
}