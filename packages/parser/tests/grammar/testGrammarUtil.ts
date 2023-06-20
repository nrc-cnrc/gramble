import { expect } from "chai";
import { basename } from "path";

import {
    Grammar, Lit
} from "../../src/grammars";
import {
    // VERBOSE_TEST_L1,
    testSuiteName, verbose,
    testHasTapes, testHasVocab, testGenerate
} from '../testUtil';
import {
    StringDict, SILENT, VERBOSE_DEBUG, logDebug
} from "../../src/util";

export const DEFAULT_MAX_RECURSION = 4;

// Some tests ultimately call testNumOutputs with warnOnly set to 
// ALLOW_DUPLICATE_OUTPUTS.
// Change the value here to 'false' to make those tests generate errors
// for more than the expected number of outputs.
export const ALLOW_DUPLICATE_OUTPUTS: boolean = true;

// // Permit global control over verbose output in tests.
// // To limit verbose output to a specific test file, set VERBOSE_TEST_L2
// // to false here, then re-define VERBOSE in the test file.
// // VERBOSE_TEST_L1 is used for verbose output of test filenames.
// // VERBOSE_TEST_L2 is used for other verbose output in tests.
// export const VERBOSE_TEST_L1: boolean = true;
// export const VERBOSE_TEST_L2: boolean = false;

// export function verbose(vb: boolean, ...msgs: string[]) {
//     if (!vb)
//         return;
//     logDebug(vb ? VERBOSE_DEBUG : SILENT, ...msgs);
// }

export function grammarTestSuiteName(mod: NodeModule): string {
    return `Grammar ${testSuiteName(mod)}`
}

// export function logTestSuite(suiteName: string, vb: boolean = VERBOSE_TEST_L1): void {
//     if (!vb)
//         return;
//     const date_str: string = (new Date()).toUTCString();
//     verbose(vb, "", `--- ${suiteName} [${date_str}] ---`);
// }

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export interface GrammarTestAux {
    grammar: Grammar,
    tapes: string[],
    vocab: {[tape: string]: number},
    results: StringDict[],
    verbose: number,
    symbol: string,
    maxRecursion: number,
    stripHidden: boolean,
    allowDuplicateOutputs: boolean,
}

export function testGrammarAux({
    grammar,
    tapes,
    vocab,
    results,
    verbose = SILENT,
    symbol = "",
    maxRecursion = DEFAULT_MAX_RECURSION,
    stripHidden = true,
    allowDuplicateOutputs = false,
}: Partial<GrammarTestAux>): void {
    if (grammar === undefined){
        it(`grammar must be defined`, function() {
            expect(grammar).to.not.be.undefined;
        });
        return;
    }
    if (tapes !== undefined) {
        testHasTapes(grammar, tapes, symbol, stripHidden);
    }
    if (vocab !== undefined) {
        testHasVocab(grammar, vocab);
    }
    if (results !== undefined) {
        testGenerate(grammar, results, verbose, symbol, maxRecursion,
                     stripHidden, allowDuplicateOutputs);
    }
}

export interface GrammarTest extends GrammarTestAux{
    desc: string,
    test: testFunctionType,
    msg: string,
}

type testFunctionType = (params: Partial<GrammarTest>) => () => void;

function testDefault(params: Partial<GrammarTest>): () => void {
    let msg = params["msg"];
    if (msg === undefined) {
        // output the test description be default for verbose testing.
        if (params["desc"] !== undefined)
            msg = `-- ${params["desc"]}`;
    }
    if (msg !== undefined && params["verbose"] !== undefined)
        verbose(params["verbose"], msg);
    return function() {
        return testGrammarAux({...params});
    };
}

export function testGrammar({
    desc,
    test = testDefault,
    msg,
    grammar,
    tapes,
    vocab,
    results,
    verbose,
    symbol,
    maxRecursion,
    stripHidden,
    allowDuplicateOutputs,
}: Partial<GrammarTest>): void {
    if (desc === undefined){
        it(`desc must be defined`, function() {
            expect(desc).to.not.be.undefined;
        });
        return;
    }

    describe(desc, test({
        desc: desc,
        grammar: grammar,
        tapes: tapes,
        vocab: vocab,
        results: results,
        msg: msg,
        verbose: verbose,
        symbol: symbol,
        maxRecursion: maxRecursion,
        stripHidden: stripHidden,
        allowDuplicateOutputs: allowDuplicateOutputs,
    }));
}
