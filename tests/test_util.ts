import { expect } from 'chai';
import {get_tier} from "../transducers"


export function test_num_results(result, expected_num) {
    it("should have " + expected_num + "result(s)", function() {
        expect(result.length).to.equal(expected_num);
    });
}

export function test_output(result, result_num, tier, target) {
    it("should have " + target + " as " + tier + " output " + result_num, function() {
        expect(get_tier(result[result_num], tier)).to.equal(target);
    });
}
