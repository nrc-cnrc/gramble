import { Grammar } from "../../src/grammars";
import { assert } from "chai";
import { CalculateTapes } from "../../src/passes/calculateTapes";
import { PassEnv } from "../../src/passes";
import { THROWER } from "../../src/utils/msgs";
import { FlattenCollections } from "../../src/passes/flattenCollections";
import { toStr } from "../../src/passes/toStr";
import { randomCollection } from "./testPropertyUtil";



type TapesPropertyTest = {
    testnum: string,
    grammar: Grammar,
};

export function testPropertyTapes({
    testnum,
    grammar,
}: TapesPropertyTest): void {
    try {
        const pass = new FlattenCollections().compose(new CalculateTapes());
        const env = new PassEnv();
        let newGrammar = pass.go(grammar, env).msgTo([]);
        const resultTapes = newGrammar.tapes;
    } catch (e) {
        it(`${testnum}: ${e}`, function() {
            assert.fail(toStr(grammar));
        });
        return;
    }

    it(`${testnum} resolved tapes successfully`, function() {
        assert.isTrue(true);
    });
}

const NUM_TESTS = 100;

function padZeros(i: number, max: number) {
    return `${i}`.padStart(Math.log10(max), "0");
};

describe(`GrammarIDs`, function() {

    for (let i = 0; i < NUM_TESTS; i++) {
        const desc = "randomTapes" + padZeros(i, NUM_TESTS);
        const g = randomCollection(4);
        testPropertyTapes({
            testnum: desc,
            grammar: g
        });
    }
});