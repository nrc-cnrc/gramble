import { expect } from "chai";

import {
    Grammar
} from "../../src/grammars";

import {
    Lit,
} from "../../src/grammarConvenience";

import {
    testSuiteName, verbose,
    testHasTapes, testHasVocab, testGenerate
} from '../testUtil';

import {
    StringDict
} from "../../src/utils/func";
import { DEFAULT_MAX_CHARS, DEFAULT_MAX_RECURSION } from "../../src/utils/constants";
import { SILENT } from "../../src/utils/logging";
import { Options } from "../../src/utils/options";

export function grammarTestSuiteName(mod: NodeModule): string {
    return `Grammar ${testSuiteName(mod)}`
}

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export interface GrammarTestAux extends Options {
    grammar: Grammar,
    tapes: string[],
    vocab: {[tape: string]: number},
    results: StringDict[],
    symbol: string,
    restriction: StringDict[] | StringDict,
    stripHidden: boolean,
    allowDuplicateOutputs: boolean,
    skipGeneration: boolean,
    shortDesc: string,
    numErrors: number,   // in plain grammar tests, errors aren't
                         // located anywhere, so it really only makes
                         // sense to count them
};

export function testGrammarAux({
    grammar,
    tapes,
    vocab,
    results,
    verbose = SILENT,
    directionLTR = true,
    optimizeAtomicity = true,
    maxRecursion = DEFAULT_MAX_RECURSION,
    maxChars = DEFAULT_MAX_CHARS,
    symbol = "",
    restriction = {},
    stripHidden = true,
    allowDuplicateOutputs = false,
    skipGeneration = false,
    shortDesc = "",
    numErrors = 0
}: Partial<GrammarTestAux>): void {

    const opt = Options({
        verbose: verbose,
        directionLTR: directionLTR,
        optimizeAtomicity: optimizeAtomicity,
        maxRecursion: maxRecursion,
        maxChars: maxChars
    });

    if (grammar === undefined){
        it("grammar must be defined", function() {
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
    if (!skipGeneration && results !== undefined) {
        testGenerate(grammar, results, opt, symbol, restriction,
            stripHidden, allowDuplicateOutputs, shortDesc, numErrors);
    } else {
        it("skipping generation", function() {
            expect(skipGeneration).to.be.true;
            expect(results).to.not.be.undefined;
        });
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
    const shortDesc = (params["desc"] !== undefined) ?
                      params["desc"].split(" ")[0] : "";

    return function() {
        if (params["shortDesc"] !== undefined)
            return testGrammarAux({...params});
        else
            return testGrammarAux({...params, shortDesc: shortDesc});
    };
}

export function testGrammar(params: Partial<GrammarTest>): void {
    if (params['desc'] === undefined){
        it(`desc must be defined`, function() {
            expect(params['desc']).to.not.be.undefined;
        });
        return;
    }

    const test = params['test'] === undefined ?
                 testDefault : params['test'];
    params['test'] = undefined;

    describe(params['desc'], test(params));
}
