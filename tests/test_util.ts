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
        const entry = record.find(([key, _value]) => key.text == tier);
        expect(entry).to.not.be.undefined;
        expect((<GEntry> entry)[1].text).to.equal(target);
    });
}
