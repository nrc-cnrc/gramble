import {
    CharSet, Count, Cursor, Epsilon, Join, Lit, Null, PriUni, Query, Rep, Rewrite, Seq, Uni, WithVocab,
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
import { StringDict } from "../../interpreter/src/utils/func";
// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

type RewriteTest = Partial<GrammarTestAux> & { io?: [string, string][] };

function test(params: RewriteTest): () => void {
    if (params.io !== undefined) {
        params.results = params.io.map(([i,o]) => {
            const result: StringDict = {};
            if (i.length > 0) result["$i"] = i;
            if (o.length > 0) result["$o"] = o;
            return result;
        });
    }
    return function() {
        return testGrammarAux({...params});
    };
}

const Input = (s: string) => Lit(INPUT_TAPE, s);
const InputChars = (ss: string[]) => Rep(CharSet(INPUT_TAPE, ss));

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);
 
    describe("0a. Generation from a rewrite a->X with vocab a,b", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), Rewrite("a", "X"))),
        io: [
            ["", ""],
            ["a", "X"],
            ["aa", "XX"],
            ["aaa", "XXX"],
            ["aab", "XXb"],
            ["ab", "Xb"],
            ["aba", "XbX"],
            ["abb", "Xbb"],
            ["b", "b"],
            ["ba", "bX"],
            ["baa", "bXX"],
            ["bab", "bXb"],
            ["bb", "bb"],
            ["bba", "bbX"],
            ["bbb", "bbb"]
        ]
    }));

    describe("1a. Replace one character", test({
        grammar: Join(Input("a"), Rewrite("a", "X")),
        io: [
            ["a", "X"]
        ],
    }));

    describe("1b. Replace a character at the beginning", test({
        grammar: Join(Input("abc"), Rewrite("a", "X")),
        io: [
            ["abc", "Xbc"]
        ],
    }));

    describe("1c. Replace a character in the middle", test({
        grammar: Join(Input("abc"), Rewrite("b", "X")),
        io: [
            ["abc", "aXc"]
        ],
    }));
    
    describe("1d. Replace a character at the end", test({
        grammar: Join(Input("abc"), Rewrite("c", "X")),
        io: [
            ["abc", "abX"]
        ],
    }));

    describe("1e. Replace a character several times", test({
        grammar: Join(Input("abaca"), Rewrite("a", "X")),
        io: [
            ["abaca", "XbXcX"]
        ],
    }));

    describe("2a. Replace a multiple-character pattern with a single", test({
        grammar: Join(Input("azbc"), Rewrite("az", "X")),
        io: [
            ["azbc", "Xbc"]
        ],
    }));
    
    describe("2b. Replace a multiple-character pattern with a single, several times", test({
        grammar: Join(Input("azbazcaz"), Rewrite("az", "X")),
        io: [
            ["azbazcaz", "XbXcX"]
        ],
    }));
    
    describe("2c. Replace a multiple-character pattern with a single, several times, with distractors", test({
        grammar: Join(Input("azabzaazcaaz"), Rewrite("az", "X")),
        io: [
            ["azabzaazcaaz", "XabzaXcaX"]
        ],
    }));

    describe("3a. Replace with a pre-condition", test({
        grammar: Join(Input("azbc"), Rewrite("z", "X", "a")),
        io: [
            ["azbc", "aXbc"]
        ],
    }));

    describe("3b. Replace with a pre-condition, several times", test({
        grammar: Join(Input("azbazcaz"), Rewrite("z", "X", "a")),
        io: [
            ["azbazcaz", "aXbaXcaX"]
        ],
   }));
    
    describe("3c. Replace with a pre-condition, several times, with distractors", test({
        grammar: Join(Input("azabzaazcaaz"), Rewrite("z", "X", "a")),
        io: [
            ["azabzaazcaaz", "aXabzaaXcaaX"]
        ],
        verbose: VERBOSE_DEBUG
    }));
   
    describe("4a. Replace with a post-condition", test({
        grammar: Join(Input("azbc"), Rewrite("a", "X", Epsilon(), "z")),
        io: [
            ["azbc", "Xzbc"]
        ],
    }));

    describe("4b. Replace with a post-condition, several times", test({
        grammar: Join(Input("azbazcaz"), Rewrite("a", "X", Epsilon(), "z")),
        io: [
            ["azbazcaz", "XzbXzcXz"]
        ],
    }));

    describe("4c. Replace with a post-condition, several times, with distractors", test({
        grammar: Join(Input("azabzaazcaaz"), Rewrite("a", "X", Epsilon(), "z")),
        io: [
            ["azabzaazcaaz", "XzabzaXzcaXz"]
        ],
        verbose: VERBOSE_DEBUG
    }));
    
    describe("5a. Replace with pre and post", test({
        grammar: Join(Input("mazbc"), Rewrite("a", "X", "m", "z")),
        io: [
            ["mazbc", "mXzbc"]
        ],
    }));

    describe("5b. Replace with pre and post, several times", test({
        grammar: Join(Input("mazbmazcmaz"), Rewrite("a", "X", "m", "z")),
        io: [
            ["mazbmazcmaz", "mXzbmXzcmXz"]
        ],
    }));

    describe("5c. Replace with pre and post, several times, with distractors", test({
        grammar: Join(Input("mazmbzmmazcmmaz"), Rewrite("a", "X", "m", "z")),
        io: [
            ["mazmbzmmazcmmaz", "mXzmbzmmXzcmmXz"]
        ],
        verbose: VERBOSE_DEBUG
    }));
});
