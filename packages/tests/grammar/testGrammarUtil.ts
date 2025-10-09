import { assert, expect } from "chai";

import {
    Lit,
} from "../../interpreter/src/grammarConvenience.js";

import {
    Grammar
} from "../../interpreter/src/grammars.js";

import { Dict, StringDict } from "../../interpreter/src/utils/func.js";
import {
    logDebug,
    timeIt,
} from "../../interpreter/src/utils/logging.js";
import { Options } from "../../interpreter/src/utils/options.js";

import {
    testSuiteName,
    testHasTapes, testHasVocab,
    testGenerate, generateOutputs,
    testNumErrors, testNumOutputs, testMatchOutputs,
    prepareInterpreter,
    VERBOSE_TEST_L2    
} from '../testUtil.js';

export function grammarTestSuiteName(mod: NodeModule | ImportMeta): string {
    return `Grammar ${testSuiteName(mod)}`
}

export const t1 = (s: string) => Lit("t1", s);
export const t2 = (s: string) => Lit("t2", s);
export const t3 = (s: string) => Lit("t3", s);
export const t4 = (s: string) => Lit("t4", s);
export const t5 = (s: string) => Lit("t5", s);

export interface GrammarTestAux extends Options {
    grammar: Grammar | Dict<Grammar>,
    tapes: string[],
    vocab: {[tape: string]: number|string[]},
    results: StringDict[],
    symbol: string,
    query: Grammar | StringDict[] | StringDict | string,
    stripHidden: boolean,
    allowDuplicateOutputs: boolean,
    skipGeneration: boolean,
    skipMatchOutputs: boolean,
    shortDesc: string,
    numErrors: number,   // in plain grammar tests, errors aren't
                         // located anywhere, so it really only makes
                         // sense to count them
};

export function testGrammarAux({
    // Specific to testing a grammar
    grammar,
    tapes,
    vocab,
    results,
    symbol = "",
    query = {},
    stripHidden = true,
    allowDuplicateOutputs = false,
    skipGeneration = false,
    skipMatchOutputs = false,
    shortDesc = "",
    numErrors = 0,

    // General options
    verbose,
    directionLTR,
    optimizeAtomicity,
    maxRecursion,
    maxChars,
    priority,
}: Partial<GrammarTestAux>): void {

    const opt = Options({
        verbose: verbose,
        directionLTR: directionLTR,
        optimizeAtomicity: optimizeAtomicity,
        maxRecursion: maxRecursion,
        maxChars: maxChars,
        priority: priority,
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
        //testHasVocab(grammar, vocab, symbol, stripHidden);
    }

    const interpreter = prepareInterpreter(grammar, opt);
    interpreter.runTests();
    testNumErrors(interpreter, numErrors);

    if (!skipGeneration && results !== undefined) {
        testGenerate(interpreter, results, symbol, query,
            stripHidden, allowDuplicateOutputs, shortDesc, skipMatchOutputs);
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
        logDebug(params["verbose"], msg);
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
    if (params['desc'] === undefined) {
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

type GrammarIOTest = Partial<GrammarTest> & { io?: [string, string][] };

export function testGrammarIO(params: Partial<GrammarIOTest>): void {
    if (params.io !== undefined) {
        params.results = params.io.map(([i,o]) => {
            const result: StringDict = {};
            if (i.length > 0) result["$i"] = i;
            if (o.length > 0) result["$o"] = o;
            return result;
        });
    }
    testGrammar(params);
}

interface GrammarEqualTest {
    desc: string,
    grammar: Grammar,
    grammar2?: Grammar,
    opt?: Partial<Options>,
    opt2?: Partial<Options>
    symbol?: string,
    query?: StringDict,
    stripHidden?: boolean,
    allowDuplicateOutputs?: boolean,
};

export function testGrammarEqual({
    desc, 
    grammar,
    grammar2 = grammar,
    opt = {},
    opt2 = opt,
    symbol = "",
    query = {},
    stripHidden = true,
    allowDuplicateOutputs = false,
}: GrammarEqualTest): void {
    const shortDesc = (desc !== undefined) ? desc.split(" ")[0] : "";

    describe(desc, function() {
        const interpreter1 = prepareInterpreter(grammar, opt);
        const interpreter2 = prepareInterpreter(grammar2, opt2);
        timeIt(() => {
            const outputs1 = generateOutputs(interpreter1, symbol, 
                                             query, stripHidden, false);
            const outputs2 = generateOutputs(interpreter2, symbol, 
                                             query, stripHidden, false);
            testNumOutputs(outputs1, outputs2.length,
                           allowDuplicateOutputs, symbol);
            testMatchOutputs(outputs1, outputs2, symbol);
        }, VERBOSE_TEST_L2, `${shortDesc} testGrammarEqual`);
    });
}
