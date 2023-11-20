import { CollectionGrammar } from "../../src/grammars";
import { CalculateTapes } from "../../src/passes/calculateTapes";
import { PassEnv } from "../../src/passes";
import { FlattenCollections } from "../../src/passes/flattenCollections";
import { RandOptions, randomCollection } from "./randomGrammar";
import { PropertyTest, PropertyTestFailure, PropertyTestResult, PropertyTestSuccess, padZeros, testToBreaking } from "./testPropertyUtil";
import { toStr } from "../../src/passes/toStr";
import { reduceCollection } from "./reduceGrammar";

const NUM_TESTS = 10000;
const OPT = RandOptions({
    numSymbols: 10,
    numTapes: 4
});

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
            const env = new PassEnv();
            pass.go(this.grammar, env).msgTo([]);
        } catch (e) {
            const resultStrs: string[] = [`${e}`];
            resultStrs.push(toStr(this.grammar));
            return PropertyTestFailure(resultStrs.join("\n"));
        }
        return PropertyTestSuccess();
    }

    public reduce(): TapeCalcTest {
        const simplifiedGrammar = reduceCollection(this.grammar);
        return new TapeCalcTest(this.id, simplifiedGrammar);
    }

    public toStr(): string {
        return toStr(this.grammar);
    }
}

testToBreaking("TapeCalc", TapeCalcTest, NUM_TESTS);