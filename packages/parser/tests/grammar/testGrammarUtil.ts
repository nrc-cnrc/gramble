import { expect } from "chai";

import {
    Grammar
} from "../../src/grammars";

import {
    Lit
} from "../../src/grammarConvenience";

import {
    DEFAULT_MAX_RECURSION,
    testSuiteName, verbose,
    testHasTapes, testHasVocab, testGenerate
} from '../testUtil';

import {
    StringDict, SILENT
} from "../../src/util";

export function grammarTestSuiteName(mod: NodeModule): string {
    return `Grammar ${testSuiteName(mod)}`
}

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
    restriction: StringDict[] | StringDict,
    maxRecursion: number,
    stripHidden: boolean,
    allowDuplicateOutputs: boolean,
    skipGeneration: boolean,
    shortDesc: string,
}

export function testGrammarAux({
    grammar,
    tapes,
    vocab,
    results,
    verbose = SILENT,
    symbol = "",
    restriction = {},
    maxRecursion = DEFAULT_MAX_RECURSION,
    stripHidden = true,
    allowDuplicateOutputs = false,
    skipGeneration = false,
    shortDesc = "",
}: Partial<GrammarTestAux>): void {
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
        testGenerate(grammar, results, verbose, symbol, restriction,
            maxRecursion, stripHidden, allowDuplicateOutputs, shortDesc);
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
