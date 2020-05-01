import { expect } from 'chai';

export function test_num_results(result, expected_num) {
    it("should have " + expected_num + " result(s)", function() {
        expect(result.length).to.equal(expected_num);
    });
}

export function test_output(result, result_num, tier, target) {
    it("should have " + target + " as " + tier + " output " + (result_num + 1), function() {
        const record = result[result_num];
        const entry = record.find(([key, value]) => key.text == tier);
        expect(entry[1].text).to.equal(target);
    });
}
