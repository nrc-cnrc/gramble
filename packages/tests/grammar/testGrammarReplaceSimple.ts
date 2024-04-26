import {
    CharSet, Count, Cursor, Epsilon, Join, Lit, Null, OptionalReplace, PriUni, Query, Rep, Replace, Seq, Uni, WithVocab,
} from "@gramble/interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2, t3,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";
import { VERBOSE_DEBUG } from "@gramble/interpreter/src/utils/logging";
import { INPUT_TAPE, OUTPUT_TAPE } from "@gramble/interpreter/src/utils/constants";
import { StringDict } from "@gramble/interpreter/src/utils/func";
// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

type ReplaceTest = Partial<GrammarTestAux> & { io?: [string, string][] };

function test(params: ReplaceTest): () => void {
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

const I = (s: string) => Lit(INPUT_TAPE, s);
const InputChars = (ss: string[]) => Rep(CharSet(INPUT_TAPE, ss));
const O = (s: string) => Lit(OUTPUT_TAPE, s);

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    /*
    describe("0a. Generation from a replace a->X with vocab a,b", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), Replace("a", "X"))),
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
    
    describe("0b. Generation from a replace a->X with vocab a,b, beginsWith", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), Replace("a", "X", Epsilon(), Epsilon(), true))),
        io: [
            ["", ""],
            ["a", "X"],
            ["aa", "Xa"],
            ["aaa", "Xaa"],
            ["aab", "Xab"],
            ["ab", "Xb"],
            ["aba", "Xba"],
            ["abb", "Xbb"],
            ["b", "b"],
            ["ba", "ba"],
            ["baa", "baa"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bba"],
            ["bbb", "bbb"]
        ]
    }));

    describe("0c. Generation from a replace a->X with vocab a,b, endsWith", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), Replace("a", "X",  Epsilon(), Epsilon(), false, true))),
        io: [
            ["", ""],
            ["a", "X"],
            ["aa", "aX"],
            ["aaa", "aaX"],
            ["aab", "aab"],
            ["ab", "ab"],
            ["aba", "abX"],
            ["abb", "abb"],
            ["b", "b"],
            ["ba", "bX"],
            ["baa", "baX"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bbX"],
            ["bbb", "bbb"]
        ]
    }));

    describe("0d. Generation from a replace a->X with vocab a,b, beginsWith endsWith", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), Replace("a", "X",  Epsilon(), Epsilon(), true, true))),
        io: [
            ["", ""],
            ["a", "X"],
            ["aa", "aa"],
            ["aaa", "aaa"],
            ["aab", "aab"],
            ["ab", "ab"],
            ["aba", "aba"],
            ["abb", "abb"],
            ["b", "b"],
            ["ba", "ba"],
            ["baa", "baa"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bba"],
            ["bbb", "bbb"]
        ]
    }));

    describe("1a. Replace one character", test({
        grammar: Join(I("a"), Replace("a", "X")),
        io: [
            ["a", "X"]
        ],
    }));

    describe("1b. Replace a character at the beginning", test({
        grammar: Join(I("abc"), Replace("a", "X")),
        io: [
            ["abc", "Xbc"]
        ],
    }));

    describe("1c. Replace a character in the middle", test({
        grammar: Join(I("abc"), Replace("b", "X")),
        io: [
            ["abc", "aXc"]
        ],
    }));
    
    describe("1d. Replace a character at the end", test({
        grammar: Join(I("abc"), Replace("c", "X")),
        io: [
            ["abc", "abX"]
        ],
    }));

    describe("1e. Replace a character several times", test({
        grammar: Join(I("abaca"), Replace("a", "X")),
        io: [
            ["abaca", "XbXcX"]
        ],
    }));
    
    describe("1e. Replace rule not applying", test({
        grammar: Join(I("bcd"), Replace("a", "X")),
        io: [
            ["bcd", "bcd"]
        ],
    }));

    describe("2a. Replace a multiple-character pattern with a single", test({
        grammar: Join(I("azbc"), Replace("az", "X")),
        io: [
            ["azbc", "Xbc"]
        ],
    }));
    
    describe("2b. Replace a multiple-character pattern with a single, several times", test({
        grammar: Join(I("azbazcaz"), Replace("az", "X")),
        io: [
            ["azbazcaz", "XbXcX"]
        ],
    }));
    
    describe("2c. Replace a multiple-character pattern with a single, several times, with distractors", test({
        grammar: Join(I("azabzaazcaaz"), Replace("az", "X")),
        io: [
            ["azabzaazcaaz", "XabzaXcaX"]
        ],
    }));

    describe("2d. Replace a single-character pattern with multiple, at the beginning", test({
        grammar: Join(I("abc"), Replace("a", "XY")),
        io: [
            ["abc", "XYbc"]
        ],
    }));
    
    describe("2e. Replace a single-character pattern with multiple, at the end", test({
        grammar: Join(I("abc"), Replace("c", "XY")),
        io: [
            ["abc", "abXY"]
        ],
    }));
    
    describe("2f. Replace a single-character pattern with multiple, several times", test({
        grammar: Join(I("abaca"), Replace("a", "XY")),
        io: [
            ["abaca", "XYbXYcXY"]
        ],
    }));

    describe("3a. Replace with a pre-condition", test({
        grammar: Join(I("azbc"), Replace("z", "X", "a")),
        io: [
            ["azbc", "aXbc"]
        ],
    }));

    describe("3b. Replace with a pre-condition, several times", test({
        grammar: Join(I("azbazcaz"), Replace("z", "X", "a")),
        io: [
            ["azbazcaz", "aXbaXcaX"]
        ],
   }));
    
    describe("3c. Replace with a pre-condition, several times, with distractors", test({
        grammar: Join(I("azabzaazcaaz"), Replace("z", "X", "a")),
        io: [
            ["azabzaazcaaz", "aXabzaaXcaaX"]
        ],
    }));
    
    describe("3d. Replace with a pre-condition, not applying", test({
        grammar: Join(I("zbc"), Replace("z", "X", "a")),
        io: [
            ["zbc", "zbc"]
        ],
    }));
   
    describe("4a. Replace with a post-condition", test({
        grammar: Join(I("azbc"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["azbc", "Xzbc"]
        ],
    }));

    describe("4b. Replace with a post-condition, several times", test({
        grammar: Join(I("azbazcaz"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["azbazcaz", "XzbXzcXz"]
        ],
    }));

    describe("4c. Replace with a post-condition, several times, with distractors", test({
        grammar: Join(I("azabzaazcaaz"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["azabzaazcaaz", "XzabzaXzcaXz"]
        ],
    }));
    
    describe("4d. Replace with a post-condition, not applying", test({
        grammar: Join(I("abc"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["abc", "abc"]
        ],
    }));
    
    describe("5a. Replace with pre and post", test({
        grammar: Join(I("mazbc"), Replace("a", "X", "m", "z")),
        io: [
            ["mazbc", "mXzbc"]
        ],
    }));

    describe("5b. Replace with pre and post, several times", test({
        grammar: Join(I("mazbmazcmaz"), Replace("a", "X", "m", "z")),
        io: [
            ["mazbmazcmaz", "mXzbmXzcmXz"]
        ],
    }));

    describe("5c. Replace with pre and post, several times, with distractors", test({
        grammar: Join(I("mazmbzmmazcmmaz"), Replace("a", "X", "m", "z")),
        io: [
            ["mazmbzmmazcmmaz", "mXzmbzmmXzcmmXz"]
        ],
    }));
    
    */
    describe("6a. Replace one character, beginsWith", test({
        grammar: Join(I("a"), Replace("a", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["a", "X"]
        ],
        verbose: VERBOSE_DEBUG
    }));

    /*
    describe("6b. Replace a character at the beginning, beginsWith", test({
        grammar: Join(I("abc"), Replace("a", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["abc", "Xbc"]
        ],
    }));

    describe("6c. Replace a character in the middle, beginsWith", test({
        grammar: Join(I("abc"), Replace("b", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["abc", "abc"]
        ],
    }));
    
    describe("6d. Replace a character at the end, beginsWith", test({
        grammar: Join(I("abc"), Replace("c", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["abc", "abc"]
        ],
    }));

    describe("6e. Replace rule not applying, beginsWith", test({
        grammar: Join(I("bcd"), Replace("a", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["bcd", "bcd"]
        ],
    }));

    describe("7a. Replace a multiple-character pattern with a single, beginsWith", test({
        grammar: Join(I("azbc"), Replace("az", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["azbc", "Xbc"]
        ],
    }));
    
    describe("7b. Replace a multiple-character pattern with a single, beginsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("az", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["azbazcaz", "Xbazcaz"]
        ],
    }));

    describe("8a. Replace with a pre-condition, beginsWith", test({
        grammar: Join(I("azbc"), Replace("z", "X", "a", Epsilon(), true)),
        io: [
            ["azbc", "aXbc"]
        ],
    }));

    describe("8b. Replace with a pre-condition, beginsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("z", "X", "a", Epsilon(), true)),
        io: [
            ["azbazcaz", "aXbazcaz"]
        ],
   }));
   
   describe("8c. Replace with a pre-condition not applying, beginsWith", test({
        grammar: Join(I("czbazcaz"), Replace("z", "X", "a", Epsilon(), true)),
        io: [
            ["czbazcaz", "czbazcaz"]
        ],
    }));
    
    describe("9a. Replace with a post-condition, beginsWith", test({
        grammar: Join(I("azbc"), Replace("a", "X", Epsilon(), "z", true)),
        io: [
            ["azbc", "Xzbc"]
        ],
    }));

    describe("9b. Replace with a post-condition, beginsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("a", "X", Epsilon(), "z", true)),
        io: [
            ["azbazcaz", "Xzbazcaz"]
        ],
    }));

    describe("9c. Replace with a post-condition not applying, beginsWith", test({
        grammar: Join(I("abazcaz"), Replace("a", "X", Epsilon(), "z", true)),
        io: [
            ["abazcaz", "abazcaz"]
        ],
    }));
    
    describe("10a. Replace with pre and post, beginsWith", test({
        grammar: Join(I("mazbc"), Replace("a", "X", "m", "z", true)),
        io: [
            ["mazbc", "mXzbc"]
        ],
    }));

    describe("10b. Replace with pre and post, beginsWith, with distractors", test({
        grammar: Join(I("mazbmazcmaz"), Replace("a", "X", "m", "z", true)),
        io: [
            ["mazbmazcmaz", "mXzbmazcmaz"]
        ],
    }));

    describe("10c. Replace with pre and post not applying, beginsWith", test({
        grammar: Join(I("mabmazcmaz"), Replace("a", "X", "m", "z", true)),
        io: [
            ["mabmazcmaz", "mabmazcmaz"]
        ],
    }));

    // ENDSWITH

    
    describe("11a. Replace one character, endsWith", test({
        grammar: Join(I("a"), Replace("a", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["a", "X"]
        ],
    }));

    describe("11b. Replace a character at the beginning, endsWith", test({
        grammar: Join(I("abc"), Replace("a", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["abc", "abc"]
        ],
    }));

    describe("11c. Replace a character in the middle, endsWith", test({
        grammar: Join(I("abc"), Replace("b", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["abc", "abc"]
        ],
    }));
    
    describe("11d. Replace a character at the end, endsWith", test({
        grammar: Join(I("abc"), Replace("c", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["abc", "abX"]
        ],
    }));

    describe("11e. Replace rule not applying, endsWith", test({
        grammar: Join(I("bcd"), Replace("a", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["bcd", "bcd"]
        ],
    }));

    describe("12a. Replace a multiple-character pattern with a single, endsWith", test({
        grammar: Join(I("bcaz"), Replace("az", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["bcaz", "bcX"]
        ],
    }));
    
    describe("12b. Replace a multiple-character pattern with a single, endsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("az", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["azbazcaz", "azbazcX"]
        ],
    }));

    describe("13a. Replace with a pre-condition, endsWith", test({
        grammar: Join(I("bcaz"), Replace("z", "X", "a", Epsilon(), false, true)),
        io: [
            ["bcaz", "bcaX"]
        ],
    }));

    describe("13b. Replace with a pre-condition, endsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("z", "X", "a", Epsilon(), false, true)),
        io: [
            ["azbazcaz", "azbazcaX"]
        ],
   }));
   
   describe("13c. Replace with a pre-condition not applying, endsWith", test({
        grammar: Join(I("azbazacz"), Replace("z", "X", "a", Epsilon(), false, true)),
        io: [
            ["azbazacz", "azbazacz"]
        ],
    }));
    
    describe("14a. Replace with a post-condition, endsWith", test({
        grammar: Join(I("bcaz"), Replace("a", "X", Epsilon(), "z", false, true)),
        io: [
            ["bcaz", "bcXz"]
        ],
    }));

    describe("14b. Replace with a post-condition, endsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("a", "X", Epsilon(), "z", false, true)),
        io: [
            ["azbazcaz", "azbazcXz"]
        ],
    }));

    describe("14c. Replace with a post-condition not applying, endsWith", test({
        grammar: Join(I("abazcabz"), Replace("a", "X", Epsilon(), "z", false, true)),
        io: [
            ["abazcabz", "abazcabz"]
        ],
    }));
    
    describe("15a. Replace with pre and post, endsWith", test({
        grammar: Join(I("bcmaz"), Replace("a", "X", "m", "z", false, true)),
        io: [
            ["bcmaz", "bcmXz"]
        ],
    }));

    describe("15b. Replace with pre and post, endsWith, with distractors", test({
        grammar: Join(I("mazbmazcmaz"), Replace("a", "X", "m", "z", false, true)),
        io: [
            ["mazbmazcmaz", "mazbmazcmXz"]
        ],
    }));

    describe("15c. Replace with pre and post not applying, endsWith", test({
        grammar: Join(I("mazmazcmabz"), Replace("a", "X", "m", "z", false, true)),
        io: [
            ["mazmazcmabz", "mazmazcmabz"]
        ],
    }));

    // BEGIN AND ENDS

    describe("16a. Replace one character, beginsWith endsWith", test({
        grammar: Join(I("a"), Replace("a", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["a", "X"]
        ],
    }));

    describe("16b. Replace a character at the beginning, beginsWith endsWith", test({
        grammar: Join(I("abc"), Replace("a", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["abc", "abc"]
        ],
    }));

    describe("16c. Replace a character in the middle, beginsWith endsWith", test({
        grammar: Join(I("abc"), Replace("b", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["abc", "abc"]
        ],
    }));
    
    describe("16d. Replace a character at the end, beginsWith endsWith", test({
        grammar: Join(I("abc"), Replace("c", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["abc", "abc"]
        ],
    }));

    describe("16e. Replace rule not applying, beginsWith endsWith", test({
        grammar: Join(I("bcd"), Replace("a", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["bcd", "bcd"]
        ],
    }));

    describe("17a. Replace a multiple-character pattern with a single, beginsWith endsWith", test({
        grammar: Join(I("az"), Replace("az", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["az", "X"]
        ],
    }));
    
    describe("17b. Replace a multiple-character pattern with a single, beginsWith endsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("az", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["azbazcaz", "azbazcaz"]
        ],
    }));

    describe("17a. Replace with a pre-condition, beginsWith endsWith", test({
        grammar: Join(I("az"), Replace("z", "X", "a", Epsilon(), true, true)),
        io: [
            ["az", "aX"]
        ],
    }));

    describe("17b. Replace with a pre-condition, beginsWith endsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("z", "X", "a", Epsilon(), true, true)),
        io: [
            ["azbazcaz", "azbazcaz"]
        ],
   }));
    
    describe("18a. Replace with a post-condition, beginsWith endsWith", test({
        grammar: Join(I("az"), Replace("a", "X", Epsilon(), "z", true, true)),
        io: [
            ["az", "Xz"]
        ],
    }));

    describe("18b. Replace with a post-condition, beginsWith endsWith, with distractors", test({
        grammar: Join(I("azbazcaz"), Replace("a", "X", Epsilon(), "z", true, true)),
        io: [
            ["azbazcaz", "azbazcaz"]
        ],
    }));
    
    describe("19a. Replace with pre and post, beginsWith endsWith", test({
        grammar: Join(I("maz"), Replace("a", "X", "m", "z", true, true)),
        io: [
            ["maz", "mXz"]
        ],
    }));

    describe("19b. Replace with pre and post, endsWith, with distractors", test({
        grammar: Join(I("mazbmazcmaz"), Replace("a", "X", "m", "z", true, true)),
        io: [
            ["mazbmazcmaz", "mazbmazcmaz"]
        ],
    }));

    // Optional replace
    
    describe("20a. Generation from a replace a->X with vocab a,b", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), 
                                OptionalReplace("a", "X"))),
        io: [
            ["", ""],
            ["a", "X"],
            ["a", "a"],
            ["aa", "XX"],
            ["aa", "aX"],
            ["aa", "Xa"],
            ["aa", "aa"],
            ["aaa", "XXX"],
            ["aaa", "XXa"],
            ["aaa", "XaX"],
            ["aaa", "Xaa"],
            ["aaa", "aXX"],
            ["aaa", "aXa"],
            ["aaa", "aaX"],
            ["aaa", "aaa"],
            ["aab", "XXb"],
            ["aab", "Xab"],
            ["aab", "aXb"],
            ["aab", "aab"],
            ["ab", "Xb"],
            ["ab", "ab"],
            ["aba", "XbX"],
            ["aba", "Xba"],
            ["aba", "abX"],
            ["aba", "aba"],
            ["abb", "Xbb"],
            ["abb", "abb"],
            ["b", "b"],
            ["ba", "bX"],
            ["ba", "ba"],
            ["baa", "bXX"],
            ["baa", "bXa"],
            ["baa", "baX"],
            ["baa", "baa"],
            ["bab", "bXb"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bbX"],
            ["bba", "bba"],
            ["bbb", "bbb"]
        ]
    }));
    
    describe("20b. Generation from a replace a->X with vocab a,b, beginsWith", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), 
                            OptionalReplace("a", "X", Epsilon(), Epsilon(), true))),
        io: [
            ["", ""],
            ["a", "X"],
            ["a", "a"],
            ["aa", "Xa"],
            ["aa", "aa"],
            ["aaa", "Xaa"],
            ["aaa", "aaa"],
            ["aab", "Xab"],
            ["aab", "aab"],
            ["ab", "Xb"],
            ["ab", "ab"],
            ["aba", "Xba"],
            ["aba", "aba"],
            ["abb", "Xbb"],
            ["abb", "abb"],
            ["b", "b"],
            ["ba", "ba"],
            ["baa", "baa"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bba"],
            ["bbb", "bbb"]
        ]
    }));

    describe("20c. Generation from a replace a->X with vocab a,b, endsWith", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), 
                            OptionalReplace("a", "X",  Epsilon(), Epsilon(), false, true))),
        io: [
            ["", ""],
            ["a", "X"],
            ["a", "a"],
            ["aa", "aX"],
            ["aa", "aa"],
            ["aaa", "aaX"],
            ["aaa", "aaa"],
            ["aab", "aab"],
            ["ab", "ab"],
            ["aba", "abX"],
            ["aba", "aba"],
            ["abb", "abb"],
            ["b", "b"],
            ["ba", "bX"],
            ["ba", "ba"],
            ["baa", "baX"],
            ["baa", "baa"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bbX"],
            ["bba", "bba"],
            ["bbb", "bbb"]
        ]
    }));

    describe("20d. Generation from a replace a->X with vocab a,b, beginsWith endsWith", test({
        grammar: Count({"$i":3}, Join(InputChars(["a","b"]), 
                                OptionalReplace("a", "X",  Epsilon(), Epsilon(), true, true))),
        io: [
            ["", ""],
            ["a", "X"],
            ["a", "a"],
            ["aa", "aa"],
            ["aaa", "aaa"],
            ["aab", "aab"],
            ["ab", "ab"],
            ["aba", "aba"],
            ["abb", "abb"],
            ["b", "b"],
            ["ba", "ba"],
            ["baa", "baa"],
            ["bab", "bab"],
            ["bb", "bb"],
            ["bba", "bba"],
            ["bbb", "bbb"]
        ]
    }));

    describe("21a. Replacement, beginning of word, with output join", test({
        grammar: Join(Seq(I("abc"), O("Xbc")), 
                    Replace("a", "X")),
        io: [
            ["abc", "Xbc"]
        ],
        priority: ["$i", "$o"]
    }));
    
    describe("21b. Replacement, middle of word, with output join", test({
        grammar: Join(Seq(I("abc"), O("aXc")), 
                    Replace("b", "X")),
        io: [
            ["abc", "aXc"]
        ],
        priority: ["$i", "$o"]
    }));

    describe("21c. Replacement, end of word, with output join", test({
        grammar: Join(Seq(I("abc"), O("abX")), 
                    Replace("c", "X")),
        io: [
            ["abc", "abX"]
        ],
        priority: ["$i", "$o"]
    }));

    describe("22a. Replace a multiple-character pattern with a single, beginning of word, with output join", test({
        grammar: Join(Seq(I("azbc"), O("Xbc")), 
                    Replace("az", "X")),
        io: [
            ["azbc", "Xbc"]
        ],
        priority: ["$i", "$o"]
    }));

    describe("22b. Replace a multiple-character pattern with a single, end of word, with output join", test({
        grammar: Join(Seq(I("abcz"), O("abX")), 
                    Replace("cz", "X")),
        io: [
            ["abcz", "abX"]
        ],
        priority: ["$i", "$o"],
    }));

    describe("22c. Replace a multiple-character pattern with a single, several times", test({
        grammar: Join(Seq(I("azbazcaz"), O("XbXcX")),
                    Replace("az", "X")),
        io: [
            ["azbazcaz", "XbXcX"]
        ],
        priority: ["$i", "$o"]
    }));
    
    describe("22d. Replace a multiple-character pattern with a single, several times, with distractors", test({
        grammar: Join(Seq(I("azabzaazcaaz"), O("XabzaXcaX")),
                    Replace("az", "X")),
        io: [
            ["azabzaazcaaz", "XabzaXcaX"]
        ],
        priority: ["$i", "$o"]
    }));
    
    describe("23a. Replace a single-character pattern with multiple, at the beginning", test({
        grammar: Join(Seq(I("abc"), O("XYbc")),
                    Replace("a", "XY")),
        io: [
            ["abc", "XYbc"]
        ],
        priority: ["$i", "$o"]
    }));
    
    describe("23b. Replace a single-character pattern with multiple, at the end", test({
        grammar: Join(Seq(I("abc"), O("abXY")),
                    Replace("c", "XY")),
        io: [
            ["abc", "abXY"]
        ],
        priority: ["$i", "$o"]
    }));
    
    describe("23c. Replace a single-character pattern with multiple, several times", test({
        grammar: Join(Seq(I("abaca"), O("XYbXYcXY")),
                    Replace("a", "XY")),
        io: [
            ["abaca", "XYbXYcXY"]
        ],
        priority: ["$i", "$o"]
    }));

    */
});
