import { expect } from 'chai';
import { GTable, GCell, GEntry } from '../transducers';

export function test_num_results(result: GTable, expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(result.length).to.equal(expected_num);
    });
}

export function test_output(result: GTable, result_num: number, tier: string, target: string) {
    it("should have " + target + " as " + tier + " output " + (result_num + 1), function() {
        const record = result[result_num];
        const text = record.filter(([k, v]) => k.text == tier).map(([k, v]) => v.text).join("");
        expect(text).to.equal(target);
    });
}
