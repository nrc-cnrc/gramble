import { CollectionGrammar } from "../../interpreter/src/grammars.js";
import { CalculateTapes } from "../../interpreter/src/passes/calculateTapes.js";
import { FlattenCollections } from "../../interpreter/src/passes/flattenCollections.js";
import { toStr } from "../../interpreter/src/passes/toStr.js";

import { RandOptions, randomCollection } from "./randomGrammar.js";
import { ReduceOptions, reduceCollection } from "./reduceGrammar.js";

import {
    PropertyTest,
    PropertyTestFailure,
    PropertyTestResult,
    PropertyTestSuccess,
    testToBreaking
} from "./testPropertyUtil.js";

const NUM_TESTS = 10000;
const OPT = RandOptions();
const REDUCE_OPT = ReduceOptions();

class TapeCalcTest implements PropertyTest {
    
    public grammar: CollectionGrammar;

    constructor(
        public id: string,
        grammar?: CollectionGrammar 
    ) { 
        this.grammar = grammar || randomCollection(OPT);
    }

    public run(): PropertyTestResult {
        try {
            const pass = new FlattenCollections()
                            .compose(new CalculateTapes());
            pass.getEnvAndTransform(this.grammar, {}).msgTo([]);
        } catch (e) {
            const resultStrs: string[] = [`${e}`];
            resultStrs.push(toStr(this.grammar));
            return PropertyTestFailure(resultStrs.join("\n"));
        }
        return PropertyTestSuccess();
    }

    public reduce(): TapeCalcTest {
        const simplifiedGrammar = reduceCollection(this.grammar, REDUCE_OPT);
        return new TapeCalcTest(this.id, simplifiedGrammar);
    }

    public toStr(): string {
        return toStr(this.grammar);
    }
}

testToBreaking(
    "TapeCalc", 
    (id: string) => new TapeCalcTest(id), 
    NUM_TESTS
);
