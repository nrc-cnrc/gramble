import { 
    Count, Epsilon, Null, Rep,
    Replace, ReplaceBlock, Uni, WithVocab,
    OptionalReplace,
    Join,
    Collection,
    Embed,
} from "@gramble/interpreter/src/grammarConvenience";

import { DEFAULT_TAPE } from "@gramble/interpreter/src/utils/constants";
import { SILENT, VERBOSE_STATES } from "@gramble/interpreter/src/utils/logging";

import {
    grammarTestSuiteName,
    testGrammar,
} from "./testGrammarUtil";

import { 
    logTestSuite, t1, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Embedding a replacement',
        grammar: Collection({
                    "A": ReplaceBlock("t1", "abc", 
                              Replace("a", "X")),
                    "B": Embed("A"),
        }),
        symbol: "B",
        tapes: ["t1"],
        results: [
            {t1: 'Xbc'},
        ],
    });

    testGrammar({
        desc: '2a. Join where the left side is an embedded replacement',
        grammar: Collection({
                    "A": ReplaceBlock("t1", "abc", 
                              Replace("a", "X")),
                    "B": Join(Embed("A"), t1("Xbc")),
        }),
        symbol: "B",
        tapes: ["t1"],
        results: [
            {t1: 'Xbc'},
        ],
    });

    testGrammar({
        desc: '2b. Join where the right side is an embedded replacement',
        grammar: Collection({
                    "A": ReplaceBlock("t1", "abc", 
                              Replace("a", "X")),
                    "B": Join(t1("Xbc"), Embed("A")),
        }),
        symbol: "B",
        tapes: ["t1"],
        results: [
            {t1: 'Xbc'},
        ],
    });

});