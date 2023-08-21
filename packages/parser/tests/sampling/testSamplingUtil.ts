import { assert } from "chai";
import {
    Grammar, Seq, Vocab
} from "../../src/grammars";
import { Interpreter } from "../../src/interpreter";
import { SILENT, StringDict } from "../../src/util";

import {
    DEFAULT_MAX_RECURSION,
    testMatchOutputs,
    generateOutputsFromGrammar,
    prepareInterpreter,
    DEBUG_MAX_RECURSION,
} from "../testUtil";


export function withVocab(voc: StringDict | string, grammar: Grammar) {
    if (typeof voc == "string") voc = {t1: voc};
    return Seq(Vocab(voc), grammar);
}

export type SampleTest = {
    // required parameters
    desc: string,
    grammar: Grammar | Interpreter,
} & Partial<{
    // optional parameters
    verbose: number,
    numSamples: number,
    symbolName: string,
    maxRecursion: number,
    stripHidden: boolean
}>;

export function testSample({
    desc,
    grammar,
    verbose = SILENT,
    numSamples = 100,
    symbolName = "",
    maxRecursion = DEFAULT_MAX_RECURSION,
    stripHidden = true
}: SampleTest): void {
    describe(desc, function() {
        const generatedOutputs: StringDict[] =
            generateOutputsFromGrammar(grammar, verbose, symbolName, {},
                                    maxRecursion, stripHidden);
        const samples: StringDict[] =
            sampleOutputsFromGrammar(grammar, verbose, numSamples, 
                            symbolName, maxRecursion, stripHidden);
        testMatchOutputs(samples, generatedOutputs, symbolName);
    });
}

export function sampleOutputsFromGrammar(
    grammar: Grammar | Interpreter,
    verbose: number = SILENT,
    numSamples: number = 100,
    symbolName: string = "",
    maxRecursion: number = DEFAULT_MAX_RECURSION,
    stripHidden: boolean = true,
    throwError: boolean = false // in case a test wants to catch errors itself
): StringDict[] {
    const interpreter = prepareInterpreter(grammar, verbose, symbolName, throwError);
                          
    let outputs: StringDict[] = [];

    maxRecursion = Math.min(maxRecursion, DEBUG_MAX_RECURSION);

    try {
        outputs = [
            ...interpreter.sample(symbolName, numSamples, {},
                        maxRecursion, undefined, stripHidden)
        ];
    } catch (e) {
        if (throwError) throw e;
        it("Unexpected Exception", function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(e);
        });
    }
    return outputs;
}