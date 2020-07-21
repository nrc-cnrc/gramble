import { expect } from 'chai';
import { GTable, GParse, GCell, GEntry } from '../src/transducers';
import { Project } from '../src/spreadsheet';

export function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}

export function testNumResults(result: any[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(result.length).to.equal(expected_num);
    });
}

export function testOutput(result: GTable, result_num: number, tier: string, target: string) {
    it("should have " + target + " as " + tier + " output " + (result_num + 1), function() {
        const record = result[result_num];
        const text = record.filter(entry => entry.tier.text == tier).map(entry => entry.value.text).join("");
        expect(text).to.equal(target);
    });
}

export function testNoErrors(project: Project): void {
    it("should have no errors", function() {
        expect(project.getErrorMessages().length).to.equal(0);
    });
}


export function testParseOutput(result: GParse[], result_num: number, tier: string, target: string) {
    it("should have " + target + " as " + tier + " output " + (result_num + 1), function() {
        const [remnant, logprob, output]: GParse = result[result_num];
        const text = output.filter(entry => entry.tier.text == tier).map(entry => entry.value.text).join("");
        expect(text).to.equal(target);
    });
}


export function testParseRemnant(result: GParse[], result_num: number, tier: string, target: string) {
    it("should have " + target + " as " + tier + " remnant " + (result_num + 1), function() {
        const [remnant, logprob, output]: GParse = result[result_num];
        const text = remnant.filter(entry => entry.tier.text == tier).map(entry => entry.value.text).join("");
        expect(text).to.equal(target);
    });
}


export function testFlattenedOutput(result: {[key: string]: string}[], result_num: number, tier: string, target: string) {
    it("should have " + target + " as " + tier + " output " + (result_num + 1), function() {
        expect(result.length).to.be.greaterThan(result_num);
        const record = result[result_num];
        expect(record).to.haveOwnProperty(tier);
        expect(record[tier]).to.equal(target);
    });
}
