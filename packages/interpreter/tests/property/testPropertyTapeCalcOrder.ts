import { CollectionGrammar, Grammar } from "../../src/grammars";
import { assert } from "chai";
import { CalculateTapes } from "../../src/passes/calculateTapes";
import { FlattenCollections } from "../../src/passes/flattenCollections";
import { toStr } from "../../src/passes/toStr";
import { RandOptions, randomCollection } from "./randomGrammar";
import { getAllSymbols } from "../../src/passes/getAllSymbols";
import { SelectSymbol } from "../../src/passes/selectSymbol";
import { Dict, arrayEquals } from "../../src/utils/func";
import { THROWER } from "../../src/utils/msgs";
import { PropertyTest, PropertyTestFailure, PropertyTestResult, PropertyTestSuccess, testToBreaking } from "./testPropertyUtil";
import { ReduceOptions, reduceCollection } from "./reduceGrammar";
import { fisherYates } from "../../src/utils/random";

const NUM_TESTS = 10000;
const OPT = RandOptions();
const REDUCE_OPT = ReduceOptions();

class TapeCalcOrderTest implements PropertyTest {
    
    public grammar: CollectionGrammar;
    public scrambledKeys: string[];

    constructor(
        public id: string,
        grammar?: CollectionGrammar,
        scrambledKeys?: string[]
    ) { 
        this.grammar = grammar || randomCollection(OPT);
        this.scrambledKeys = scrambledKeys || fisherYates(Object.keys(this.grammar.symbols));
    }

    public run(): PropertyTestResult {
        const newSymbols: Dict<Grammar> = {};
        for (const key of this.scrambledKeys) {
            newSymbols[key] = this.grammar.symbols[key];
        }
        const grammar2 = new CollectionGrammar(newSymbols);

        const tapes1 = this.prepareTapes(this.grammar);
        const tapes2 = this.prepareTapes(grammar2);

        let failed: Set<string> = new Set();
        let resultSubStrs: string[] = [];

        for (const symbol of this.scrambledKeys) {
            const t1 = tapes1[symbol].sort();
            const t2 = tapes2[symbol].sort();
            const result = arrayEquals(t1,t2);

            if (result) {
                resultSubStrs.push(`${symbol} succeeded: ${t1}`);
                continue;
            }

            failed.add(symbol);
            resultSubStrs.push(`${symbol} failed`);
            resultSubStrs.push(`  expected: ${t1}`);
            resultSubStrs.push(`  got: ${t2}`);
        }

        if (failed.size === 0) return PropertyTestSuccess();

        const resultStrs: string[] = [ ""];
        resultStrs.push(`Grammar = ${toStr(this.grammar)}`);
        resultStrs.push(`Scrambled order = ${this.scrambledKeys}`);
        resultStrs.push("");
        resultStrs.push(...resultSubStrs);
        return PropertyTestFailure(resultStrs.join("\n"));
    }
    
    public reduce(): TapeCalcOrderTest {
        const newGrammar = reduceCollection(this.grammar, REDUCE_OPT);
        const newKeys: string[] = [];
        for (const key of this.scrambledKeys) {
            if (!newGrammar.symbols.hasOwnProperty(key)) continue;
            newKeys.push(key);
        }
        return new TapeCalcOrderTest(this.id, newGrammar, newKeys);
    }

    prepareTapes(
        grammar: Grammar
    ): Dict<string[]> {
        const tapes: Dict<string[]> = {};
        try {
            const pass = new FlattenCollections()
                            .compose(new CalculateTapes());
            grammar = pass.getEnvAndTransform(grammar, {}).msgTo([]);
            
            for (const symbol of getAllSymbols(grammar)) {
                const selectSymbol = new SelectSymbol(symbol);
                let ref = selectSymbol.getEnvAndTransform(grammar, {}).msgTo(THROWER); 
                tapes[symbol] = ref.tapeNames;
            }

        } catch (e) {
            it(`${this.id}: ${e}`, function() {
                assert.fail(toStr(grammar));
            });
        }

        return tapes;

    }

    public toStr(): string {
        return toStr(this.grammar) + `${this.scrambledKeys}`;
    }
}

testToBreaking(
    "TapeCalcOrder", 
    (id: string) => new TapeCalcOrderTest(id), 
    NUM_TESTS
);
