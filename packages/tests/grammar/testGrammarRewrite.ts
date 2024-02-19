import {
    CharSet, Cursor, Epsilon, Join, Lit, Null, PriUni, Query, Rewrite, Seq, Uni,
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2, t3,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging";
import { INPUT_TAPE } from "../../interpreter/src/utils/constants";
// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

const Input = (s: string) => Lit(INPUT_TAPE, s);

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);
 
    describe("1a. Replace one character", test({
        grammar: Join(Input("a"), Rewrite("a", "x")),
        results: [
            { "$i": "a", "$o": "x" }
        ],
    }));

    describe("1b. Replace a character at the beginning", test({
        grammar: Join(Input("abc"), Rewrite("a", "x")),
        results: [
            { "$i": "abc", "$o": "xbc" }
        ],
    }));

    describe("1c. Replace a character in the middle", test({
        grammar: Join(Input("abc"), Rewrite("b", "x")),
        results: [
            { "$i": "abc", "$o": "axc" }
        ],
    }));
    
    describe("1d. Replace a character at the end", test({
        grammar: Join(Input("abc"), Rewrite("c", "x")),
        results: [
            { "$i": "abc", "$o": "abx" }
        ],
    }));

    describe("1e. Replace a character several times", test({
        grammar: Join(Input("abaca"), Rewrite("a", "x")),
        results: [
            { "$i": "abaca", "$o": "xbxcx" }
        ],
    }));

    describe("2a. Replace a multiple-character pattern with a single", test({
        grammar: Join(Input("azbc"), Rewrite("az", "x")),
        results: [
            { "$i": "azbc", "$o": "xbc" }
        ],
    }));
    
    describe("2b. Replace a multiple-character pattern with a single, several times", test({
        grammar: Join(Input("azbazcaz"), Rewrite("az", "x")),
        results: [
            { "$i": "azbazcaz", "$o": "xbxcx" }
        ],
        verbose: VERBOSE_DEBUG
    }));
    
    describe("2c. Replace a multiple-character pattern with a single, several times, with distractors", test({
        grammar: Join(Input("azabzaazcaaz"), Rewrite("az", "x")),
        results: [
            { "$i": "azabzaazcaaz", "$o": "xabzaxcax" }
        ],
        verbose: VERBOSE_DEBUG
    }));
});
