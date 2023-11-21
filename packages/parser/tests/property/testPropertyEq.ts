import { CollectionGrammar, Grammar } from "../../src/grammars";
import { CalculateTapes } from "../../src/passes/calculateTapes";
import { PassEnv } from "../../src/passes";
import { FlattenCollections } from "../../src/passes/flattenCollections";
import { RandOptions, randomChoice, randomCollection, randomGrammar, range } from "./randomGrammar";
import { PropertyTest, PropertyTestFailure, PropertyTestResult, PropertyTestSuccess, padZeros, testToBreaking } from "./testPropertyUtil";
import { toStr } from "../../src/passes/toStr";
import { ReduceOptions, reduceCollection, reduceGrammar } from "./reduceGrammar";
import { generateOutputs, prepareInterpreter } from "../testUtil";
import { Dict, StringDict, update } from "../../src/utils/func";
import { Options } from "../../src/utils/options";
import { Embed, Join, Uni } from "../../src/grammarConvenience";

const NUM_TESTS = 1000;
const REDUCE_OPT = ReduceOptions({ symbolDrop: false });

const EQUATIONS = [
    { 
        desc: "Join is commutative: X ⨝ Y == Y ⨝ X",
        argNames: ["X","Y"],
        leftSide: Join(Embed("X"), Embed("Y")),
        rightSide: Join(Embed("Y"), Embed("X"))
    },
    { 
        desc: "Join is associative: X ⨝ (Y ⨝ Z) == (X ⨝ Y) ⨝ Z",
        argNames: ["X","Y","Z"],
        leftSide: Join(Embed("X"), Join(Embed("Y"), Embed("Z"))),
        rightSide: Join(Join(Embed("X"), Embed("Y")), Embed("Z")),
    }
]

class EquationTest implements PropertyTest {
    
    public grammar: CollectionGrammar;

    constructor(
        public id: string,
        public argNames: string[],
        public leftSide: Grammar,
        public rightSide: Grammar,
        grammar?: CollectionGrammar
    ) { 
        if (grammar !== undefined) {
            this.grammar = grammar;
            return;
        }

        const OPT = RandOptions({symbols: argNames});
            this.grammar = randomCollection(OPT);
    }

    public run(): PropertyTestResult {
        try {
            const opt = Options();

            const symbols: Dict<Grammar> = {
                "left": this.leftSide,
                "right": this.rightSide
            }
            Object.assign(symbols, this.grammar.symbols);
            const collection = new CollectionGrammar(symbols);

            const interpreter = prepareInterpreter(collection, opt);
            const leftOutputs = generateOutputs(interpreter, "left", {}, true, true);
            const rightOutputs = generateOutputs(interpreter, "right", {}, true, true);

            const leftOutputStr = outputsToStr(leftOutputs);
            const rightOutputStr = outputsToStr(rightOutputs);

            if (leftOutputStr === rightOutputStr) return PropertyTestSuccess();

            const resultStrs: string[] = [];
            resultStrs.push(`Results of ${this.id} not equal for grammars:`);
            for (let i = 0; i < this.argNames.length; i++) {
                resultStrs.push(`${this.argNames[i]}: ${toStr(this.grammar.symbols[this.argNames[i]])}`);
            }

            resultStrs.push(`Left side generated: ${leftOutputStr}`);
            resultStrs.push(`Right side generated: ${rightOutputStr}`);

            return PropertyTestFailure(resultStrs.join("\n"));
        } catch (e) {
            const resultStrs: string[] = [`${e}`];
            resultStrs.push(toStr(this.grammar));
            return PropertyTestFailure(resultStrs.join("\n"));
        }
    }

    public reduce(): EquationTest {
        const newGrammar = reduceCollection(this.grammar, REDUCE_OPT);
        return update(this, { grammar: newGrammar });
    }

    public toStr(): string {
        return toStr(this.grammar);
    }
}

function stringDictToStr(d: StringDict): string {
    const keys = Object.keys(d).sort();
    const strs = keys.map(k => `${k}:${d[k]}`);
    return "{" + strs.join(", ") + "}";
}

function outputsToStr(ds: StringDict[]): string {
    const strs = ds.map(d => stringDictToStr(d));
    strs.sort();
    return "[" + strs.join(", ") + "]";
}

for (const eq of EQUATIONS) {
    testToBreaking(
        eq.desc, 
        (id: string) => new EquationTest(id, eq.argNames, eq.leftSide, eq.rightSide), 
        NUM_TESTS
    )
};