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
        grammar: Join(Input("a"), Rewrite("a", "X")),
        results: [
            { "$i": "a", "$o": "X" }
        ],
    }));

    describe("1b. Replace a character at the beginning", test({
        grammar: Join(Input("abc"), Rewrite("a", "X")),
        results: [
            { "$i": "abc", "$o": "Xbc" }
        ],
    }));

    describe("1c. Replace a character in the middle", test({
        grammar: Join(Input("abc"), Rewrite("b", "X")),
        results: [
            { "$i": "abc", "$o": "aXc" }
        ],
    }));
    
    describe("1d. Replace a character at the end", test({
        grammar: Join(Input("abc"), Rewrite("c", "X")),
        results: [
            { "$i": "abc", "$o": "abX" }
        ],
    }));

    describe("1e. Replace a character several times", test({
        grammar: Join(Input("abaca"), Rewrite("a", "X")),
        results: [
            { "$i": "abaca", "$o": "XbXcX" }
        ],
    }));

    describe("2a. Replace a multiple-character pattern with a single", test({
        grammar: Join(Input("azbc"), Rewrite("az", "X")),
        results: [
            { "$i": "azbc", "$o": "Xbc" }
        ],
    }));
    
    describe("2b. Replace a multiple-character pattern with a single, several times", test({
        grammar: Join(Input("azbazcaz"), Rewrite("az", "X")),
        results: [
            { "$i": "azbazcaz", "$o": "XbXcX" }
        ],
    }));
    
    describe("2c. Replace a multiple-character pattern with a single, several times, with distractors", test({
        grammar: Join(Input("azabzaazcaaz"), Rewrite("az", "X")),
        results: [
            { "$i": "azabzaazcaaz", "$o": "XabzaXcaX" }
        ],
    }));
});
