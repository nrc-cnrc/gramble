import { assert } from "chai";
import seedrandom from "seedrandom";

import { Grammar } from "../../interpreter/src/grammars.js";
import { Interpreter } from "../../interpreter/src/interpreter.js";

import { StringDict } from "../../interpreter/src/utils/func.js";
import { logDebug } from "../../interpreter/src/utils/logging.js";
import { Options } from "../../interpreter/src/utils/options.js";

import {
    generateOutputs,
    prepareInterpreter,
    testMatchOutputs,
} from "../testUtil.js";

export interface SampleTest extends Partial<Options> {
    // required parameters
    desc: string,
    grammar: Grammar,
    results?: StringDict[],
    symbol?: string,
    numSamples?: number
    seed?: string,
};

export function testSample({
    desc, 
    grammar,
    results = undefined,
    symbol = "",
    numSamples = 100,
    seed = 'Seed-2024',
    // General options
    verbose,
    directionLTR,
    optimizeAtomicity,
    maxRecursion,
    maxChars,
}: SampleTest): void {

    const opt = Options({
        verbose: verbose,
        directionLTR: directionLTR,
        optimizeAtomicity: optimizeAtomicity,
        maxRecursion: maxRecursion,
        maxChars: maxChars
    });
    
    describe(desc, function() {

        const interpreter = prepareInterpreter(grammar, opt);

        // Monkey patch Math.random with a seeded PRNG, making Math.random calls
        // deterministic.
        seedrandom(seed, { global: true });
        
        try {
            if (results === undefined) {
                results = generateOutputs(interpreter, symbol, {}, true, false);
            }
            const sOutputs = sampleOutputs(interpreter, numSamples, symbol, true, false);
            logDebug(opt.verbose, `-- ${desc}`);
            logDebug(opt.verbose, "Expected/Generated Outputs: ", results);
            logDebug(opt.verbose, "Sampled Outputs: ", sOutputs);
            // const gOutputStrs = gOutputs.map(o => stringDictToStr(o)).sort();
            // const sOutputStrs = sOutputs.map(o => stringDictToStr(o)).sort();
            // logDebug(opt.verbose, "Generated Outputs (sorted): ", gOutputStrs);
            // logDebug(opt.verbose, "Sampled Outputs (sorted): ", sOutputStrs);
            testMatchOutputs(sOutputs, results, symbol, verbose);
        } catch (e) {
            it("Unexpected Exception", function() {
                console.log("");
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(e);
                assert.fail(JSON.stringify(e));
            });
        }
    });
}

export function sampleOutputs(
    interpreter: Interpreter,
    numSamples: number = 100,
    symbol: string = "",
    stripHidden: boolean = true,
    rethrow: boolean = false, // in case a test wants to catch errors itself
): StringDict[] {
    let outputs: StringDict[] = [];
    try {
        outputs = [
            ...interpreter.sample(symbol, numSamples, {}, stripHidden)
        ];
    } catch (e) {
        if (rethrow) throw e;
        it("Unexpected Exception", function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(JSON.stringify(e));
        });
    }
    return outputs;
}
