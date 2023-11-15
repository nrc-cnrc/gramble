import { 
    Any, Count, Cursor, Epsilon, 
    Intersect, Join, Match, Rep, 
    Seq, Uni, Vocab,
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

import {
    SILENT, VERBOSE_DEBUG, VERBOSE_STATES
} from "../../src/utils/logging";
import { Grammar } from "../../src/grammars";

function withCountGuard1(maxChars: number, grammar: Grammar) {
    return Count({t1: maxChars}, grammar, true, true);
}
function withCountGuard2(maxChars: number, grammar: Grammar) {
    return Count({t1: maxChars, t2: maxChars}, grammar, true, true);
}

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

// Note: tests involving * repeats ({0,Inf}) are denoted with * in the number.

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    
    testGrammar({
        desc: '1. hello',
        grammar: t1("hello"),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
        maxChars: 3
    });

    testGrammar({
        desc: '2. Repeat 0-3 Os: t1:o{0,3}',
        grammar: Rep(t1("o")),
        tapes: ["t1"],
        results: [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
        ],
        maxChars: 3
    });

    testGrammar({
        desc: '3. Repeat 0-3 Os: Count_t1:3 t1:o*',
        grammar: Count({t1: 4},
                       Rep(t1("o"))),
        results: [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
        ],
        maxChars: 3
    });
});