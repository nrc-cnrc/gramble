import { 
    Count,
    Rep, Seq
} from "../../interpreter/src/grammarConvenience";

import {
    SILENT,
    VERBOSE_DEBUG
} from "../../interpreter/src/utils/logging";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. hello',
        grammar: t1("hello"),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
        maxChars: 3,
    });

    testGrammar({
        desc: '2. t1:o*',
        grammar: Rep(t1("o")),
        tapes: ["t1"],
        results: [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
        ],
        maxChars: 3,
    });

    testGrammar({
        desc: '3. Count_t1:4 t1:o*',
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

    testGrammar({
        desc: '4. t1:o* + t2:world',
        grammar: Seq(Rep(t1("o")), t2("world")),
        tapes: ["t1", "t2"],
        results: [
            {t2: "world"},
            {t1: 'o', t2: "world"},
            {t1: 'oo', t2: "world"},
            {t1: 'ooo', t2: "world"},
        ],
        maxChars: 3
    });

    testGrammar({
        desc: '5. t1:o* + t2:o*',
        grammar: Seq(Rep(t1("o")), Rep(t2("o"))),
        tapes: ["t1", "t2"],
        results: [
            {"t2":"oo","t1":"oo"},
            {"t2":"o","t1":"oo"},
            {"t2":"oo","t1":"o"},
            {"t2":"o","t1":"o"},
            {"t1":"oo"},
            {"t1":"o"},
            {"t2":"oo"},
            {"t2":"o"},
            {}
        ],
        maxChars: 2
    });
});
