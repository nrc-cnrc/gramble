import { assert } from "chai";
import {
    Grammar
} from "../../src/grammars";

import { Interpreter } from "../../src/interpreter";

import {
    testMatchOutputs,
    prepareInterpreter,
    generateOutputs,
} from "../testUtil";
import { DEFAULT_MAX_CHARS, DEFAULT_MAX_RECURSION } from "../../src/utils/constants";
import { Options } from "../../src/utils/options";
import { SILENT } from "../../src/utils/logging";
import { StringDict } from "../../src/utils/func";

export interface SampleTest extends Partial<Options> {
    // required parameters
    desc: string,
    grammar: Grammar,
    symbol?: string,
    numSamples?: number
};

export function testSample({
    desc, 
    grammar,
    symbol = "",
    numSamples = 100,
    // General options
    verbose = SILENT,
    directionLTR = true,
    optimizeAtomicity = true,
    maxRecursion = DEFAULT_MAX_RECURSION,
    maxChars = DEFAULT_MAX_CHARS,
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
        
        try {
            const outputs1 = generateOutputs(interpreter, symbol, {}, true, false);
            const outputs2 = sampleOutputs(interpreter, numSamples, symbol, true, false);
            testMatchOutputs(outputs1, outputs2, symbol);
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
    symbolName: string = "",
    stripHidden: boolean = true,
    rethrow: boolean = false, // in case a test wants to catch errors itself
): StringDict[] {
    let outputs: StringDict[] = [];
    try {
        outputs = [
            ...interpreter.sample(symbolName, numSamples, {}, stripHidden)
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