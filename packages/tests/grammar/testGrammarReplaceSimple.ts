import {
    CharSet, Count, Epsilon, Join, Lit,
    OptionalReplace, Rep, Replace, Seq,
} from "../../interpreter/src/grammarConvenience.js";

import {
    grammarTestSuiteName,
    testGrammarIO,
} from "./testGrammarUtil.js";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil.js";

import { INPUT_TAPE, OUTPUT_TAPE } from "../../interpreter/src/utils/constants.js";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging.js";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const I = (s: string) => Lit(INPUT_TAPE, s);
const InputChars = (ss: string) => Rep(CharSet(INPUT_TAPE, [...ss]));
const O = (s: string) => Lit(OUTPUT_TAPE, s);

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammarIO({
		desc: '0a. Generation from a replace a->X with vocab a,b',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"),
                        Replace("a", "X"))),
        io: [
            ["", ""],
            ["a", "X"],     ["b", "b"],
            ["aa", "XX"],   ["ab", "Xb"],
            ["ba", "bX"],   ["bb", "bb"],
            ["aaa", "XXX"], ["aab", "XXb"],
            ["aba", "XbX"], ["abb", "Xbb"],
            ["baa", "bXX"], ["bab", "bXb"],
            ["bba", "bbX"], ["bbb", "bbb"]
        ]
    });
    
    testGrammarIO({
		desc: '0b. Generation from a replace a->X with vocab a,b, beginsWith',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"),
                        Replace("a", "X", Epsilon(), Epsilon(), true))),
        io: [
            ["", ""],
            ["a", "X"],     ["b", "b"],
            ["aa", "Xa"],   ["ab", "Xb"],
            ["ba", "ba"],   ["bb", "bb"],
            ["aaa", "Xaa"], ["aab", "Xab"],
            ["aba", "Xba"], ["abb", "Xbb"],
            ["baa", "baa"], ["bab", "bab"],
            ["bba", "bba"], ["bbb", "bbb"]
        ]
    });

    testGrammarIO({
		desc: '0c. Generation from a replace a->X with vocab a,b, endsWith',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"),
                        Replace("a", "X",  Epsilon(), Epsilon(), false, true))),
        io: [
            ["", ""],
            ["a", "X"],     ["b", "b"],
            ["aa", "aX"],   ["ab", "ab"],
            ["ba", "bX"],   ["bb", "bb"],
            ["aaa", "aaX"], ["aab", "aab"],
            ["aba", "abX"], ["abb", "abb"],
            ["baa", "baX"], ["bab", "bab"],
            ["bba", "bbX"], ["bbb", "bbb"]
        ]
    });

    testGrammarIO({
		desc: '0d. Generation from a replace a->X with vocab a,b, beginsWith endsWith',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"),
                        Replace("a", "X",  Epsilon(), Epsilon(), true, true))),
        io: [
            ["", ""],
            ["a", "X"],     ["b", "b"],
            ["aa", "aa"],   ["ab", "ab"],
            ["ba", "ba"],   ["bb", "bb"],
            ["aaa", "aaa"], ["aab", "aab"],
            ["aba", "aba"], ["abb", "abb"],
            ["baa", "baa"], ["bab", "bab"],
            ["bba", "bba"], ["bbb", "bbb"]
        ]
    });


    testGrammarIO({
		desc: '1a. Replace one character',
        grammar: Join(I("a"), Replace("a", "X")),
        io: [
            ["a", "X"]
        ],
    });

    testGrammarIO({
		desc: '1b. Replace a character at the beginning',
        grammar: Join(I("abc"), Replace("a", "X")),
        io: [
            ["abc", "Xbc"]
        ],
    });

    testGrammarIO({
		desc: '1c. Replace a character in the middle',
        grammar: Join(I("abc"), Replace("b", "X")),
        io: [
            ["abc", "aXc"]
        ],
    });
    
    testGrammarIO({
		desc: '1d. Replace a character at the end',
        grammar: Join(I("abc"), Replace("c", "X")),
        io: [
            ["abc", "abX"]
        ],
    });

    testGrammarIO({
		desc: '1e. Replace a character several times',
        grammar: Join(I("abaca"), Replace("a", "X")),
        io: [
            ["abaca", "XbXcX"]
        ],
    });
    
    testGrammarIO({
		desc: '1e. Replace rule not applying',
        grammar: Join(I("bcd"), Replace("a", "X")),
        io: [
            ["bcd", "bcd"]
        ],
    });

    testGrammarIO({
		desc: '2a. Replace a multiple-character pattern with a single',
        grammar: Join(I("azbc"), Replace("az", "X")),
        io: [
            ["azbc", "Xbc"]
        ],
    });
    
    testGrammarIO({
		desc: '2b. Replace a multiple-character pattern with a single, several times',
        grammar: Join(I("azbazcaz"), Replace("az", "X")),
        io: [
            ["azbazcaz", "XbXcX"]
        ],
    });
    
    testGrammarIO({
		desc: '2c. Replace a multiple-character pattern with a single, ' +
              'several times, with distractors',
        grammar: Join(I("azabzaazcaaz"), Replace("az", "X")),
        io: [
            ["azabzaazcaaz", "XabzaXcaX"]
        ],
    });
    
    testGrammarIO({
		desc: '2d. Replace a single-character pattern with multiple, at the beginning',
        grammar: Join(I("abc"), Replace("a", "XY")),
        io: [
            ["abc", "XYbc"]
        ],
    });
    
    testGrammarIO({
		desc: '2e. Replace a single-character pattern with multiple, at the end',
        grammar: Join(I("abc"), Replace("c", "XY")),
        io: [
            ["abc", "abXY"]
        ],
    });
    
    testGrammarIO({
		desc: '2f. Replace a single-character pattern with multiple, several times',
        grammar: Join(I("abaca"), Replace("a", "XY")),
        io: [
            ["abaca", "XYbXYcXY"]
        ],
        // verbose: VERBOSE_DEBUG
    });

    testGrammarIO({
		desc: '3a. Replace with a pre-condition',
        grammar: Join(I("azbc"), Replace("z", "X", "a")),
        io: [
            ["azbc", "aXbc"]
        ],
    });

    testGrammarIO({
		desc: '3b. Replace with a pre-condition, several times',
        grammar: Join(I("azbazcaz"), Replace("z", "X", "a")),
        io: [
            ["azbazcaz", "aXbaXcaX"]
        ],
   });
    
    testGrammarIO({
		desc: '3c. Replace with a pre-condition, several times, with distractors',
        grammar: Join(I("azabzaazcaaz"), Replace("z", "X", "a")),
        io: [
            ["azabzaazcaaz", "aXabzaaXcaaX"]
        ],
    });
    
    testGrammarIO({
		desc: '3d. Replace with a pre-condition, not applying',
        grammar: Join(I("zbc"), Replace("z", "X", "a")),
        io: [
            ["zbc", "zbc"]
        ],
    });
   
    testGrammarIO({
		desc: '4a. Replace with a post-condition',
        grammar: Join(I("azbc"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["azbc", "Xzbc"]
        ],
    });

    testGrammarIO({
		desc: '4b. Replace with a post-condition, several times',
        grammar: Join(I("azbazcaz"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["azbazcaz", "XzbXzcXz"]
        ],
    });

    testGrammarIO({
		desc: '4c. Replace with a post-condition, several times, with distractors',
        grammar: Join(I("azabzaazcaaz"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["azabzaazcaaz", "XzabzaXzcaXz"]
        ],
    });
    
    testGrammarIO({
		desc: '4d. Replace with a post-condition, not applying',
        grammar: Join(I("abc"), Replace("a", "X", Epsilon(), "z")),
        io: [
            ["abc", "abc"]
        ],
    });
    
    testGrammarIO({
		desc: '5a. Replace with pre and post',
        grammar: Join(I("mazbc"), Replace("a", "X", "m", "z")),
        io: [
            ["mazbc", "mXzbc"]
        ],
    });

    testGrammarIO({
		desc: '5b. Replace with pre and post, several times',
        grammar: Join(I("mazbmazcmaz"), Replace("a", "X", "m", "z")),
        io: [
            ["mazbmazcmaz", "mXzbmXzcmXz"]
        ],
    });

    testGrammarIO({
		desc: '5c. Replace with pre and post, several times, with distractors',
        grammar: Join(I("mazmbzmmazcmmaz"), Replace("a", "X", "m", "z")),
        io: [
            ["mazmbzmmazcmmaz", "mXzmbzmmXzcmmXz"]
        ],
    });
    
    testGrammarIO({
		desc: '6a. Replace one character, beginsWith',
        grammar: Join(I("a"),
                      Replace("a", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["a", "X"]
        ],
    });

    testGrammarIO({
		desc: '6b. Replace a character at the beginning, beginsWith',
        grammar: Join(I("abc"),
                      Replace("a", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["abc", "Xbc"]
        ],
    });

    testGrammarIO({
		desc: '6c. Replace a character in the middle, beginsWith',
        grammar: Join(I("abc"),
                      Replace("b", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["abc", "abc"]
        ],
    });
    
    testGrammarIO({
		desc: '6d. Replace a character at the end, beginsWith',
        grammar: Join(I("abc"),
                      Replace("c", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["abc", "abc"]
        ],
    });

    testGrammarIO({
		desc: '6e. Replace rule not applying, beginsWith',
        grammar: Join(I("bcd"),
                      Replace("a", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["bcd", "bcd"]
        ],
    });

    testGrammarIO({
		desc: '7a. Replace a multiple-character pattern with a single, beginsWith',
        grammar: Join(I("azbc"),
                      Replace("az", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["azbc", "Xbc"]
        ],
    });
    
    testGrammarIO({
		desc: '7b. Replace a multiple-character pattern with a single, ' +
              'beginsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("az", "X", Epsilon(), Epsilon(), true)),
        io: [
            ["azbazcaz", "Xbazcaz"]
        ],
    });

    testGrammarIO({
		desc: '8a. Replace with a pre-condition, beginsWith',
        grammar: Join(I("azbc"),
                      Replace("z", "X", "a", Epsilon(), true)),
        io: [
            ["azbc", "aXbc"]
        ],
    });

    testGrammarIO({
		desc: '8b. Replace with a pre-condition, beginsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("z", "X", "a", Epsilon(), true)),
        io: [
            ["azbazcaz", "aXbazcaz"]
        ],
   });
   
   testGrammarIO({
		desc: '8c. Replace with a pre-condition not applying, beginsWith',
        grammar: Join(I("czbazcaz"),
                      Replace("z", "X", "a", Epsilon(), true)),
        io: [
            ["czbazcaz", "czbazcaz"]
        ],
    });
    
    testGrammarIO({
		desc: '9a. Replace with a post-condition, beginsWith',
        grammar: Join(I("azbc"),
                      Replace("a", "X", Epsilon(), "z", true)),
        io: [
            ["azbc", "Xzbc"]
        ],
    });

    testGrammarIO({
		desc: '9b. Replace with a post-condition, beginsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("a", "X", Epsilon(), "z", true)),
        io: [
            ["azbazcaz", "Xzbazcaz"]
        ],
    });

    testGrammarIO({
		desc: '9c. Replace with a post-condition not applying, beginsWith',
        grammar: Join(I("abazcaz"),
                      Replace("a", "X", Epsilon(), "z", true)),
        io: [
            ["abazcaz", "abazcaz"]
        ],
    });
    
    testGrammarIO({
		desc: '10a. Replace with pre and post, beginsWith',
        grammar: Join(I("mazbc"),
                      Replace("a", "X", "m", "z", true)),
        io: [
            ["mazbc", "mXzbc"]
        ],
    });

    testGrammarIO({
		desc: '10b. Replace with pre and post, beginsWith, with distractors',
        grammar: Join(I("mazbmazcmaz"),
                      Replace("a", "X", "m", "z", true)),
        io: [
            ["mazbmazcmaz", "mXzbmazcmaz"]
        ],
    });

    testGrammarIO({
		desc: '10c. Replace with pre and post not applying, beginsWith',
        grammar: Join(I("mabmazcmaz"),
                      Replace("a", "X", "m", "z", true)),
        io: [
            ["mabmazcmaz", "mabmazcmaz"]
        ],
    });

    // ENDSWITH

    
    testGrammarIO({
		desc: '11a. Replace one character, endsWith',
        grammar: Join(I("a"),
                      Replace("a", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["a", "X"]
        ],
    });

    testGrammarIO({
		desc: '11b. Replace a character at the beginning, endsWith',
        grammar: Join(I("abc"),
                      Replace("a", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["abc", "abc"]
        ],
    });

    testGrammarIO({
		desc: '11c. Replace a character in the middle, endsWith',
        grammar: Join(I("abc"),
                      Replace("b", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["abc", "abc"]
        ],
    });
    
    testGrammarIO({
		desc: '11d. Replace a character at the end, endsWith',
        grammar: Join(I("abc"),
                      Replace("c", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["abc", "abX"]
        ],
    });

    testGrammarIO({
		desc: '11e. Replace rule not applying, endsWith',
        grammar: Join(I("bcd"),
                      Replace("a", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["bcd", "bcd"]
        ],
    });

    testGrammarIO({
		desc: '12a. Replace a multiple-character pattern with a single, endsWith',
        grammar: Join(I("bcaz"),
                      Replace("az", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["bcaz", "bcX"]
        ],
    });
    
    testGrammarIO({
		desc: '12b. Replace a multiple-character pattern with a single, ' +
              'endsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("az", "X", Epsilon(), Epsilon(), false, true)),
        io: [
            ["azbazcaz", "azbazcX"]
        ],
    });

    testGrammarIO({
		desc: '13a. Replace with a pre-condition, endsWith',
        grammar: Join(I("bcaz"),
                      Replace("z", "X", "a", Epsilon(), false, true)),
        io: [
            ["bcaz", "bcaX"]
        ],
    });

    testGrammarIO({
		desc: '13b. Replace with a pre-condition, endsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("z", "X", "a", Epsilon(), false, true)),
        io: [
            ["azbazcaz", "azbazcaX"]
        ],
   });
   
   testGrammarIO({
		desc: '13c. Replace with a pre-condition not applying, endsWith',
        grammar: Join(I("azbazacz"),
                      Replace("z", "X", "a", Epsilon(), false, true)),
        io: [
            ["azbazacz", "azbazacz"]
        ],
    });
    
    testGrammarIO({
		desc: '14a. Replace with a post-condition, endsWith',
        grammar: Join(I("bcaz"),
                      Replace("a", "X", Epsilon(), "z", false, true)),
        io: [
            ["bcaz", "bcXz"]
        ],
    });

    testGrammarIO({
		desc: '14b. Replace with a post-condition, endsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("a", "X", Epsilon(), "z", false, true)),
        io: [
            ["azbazcaz", "azbazcXz"]
        ],
    });

    testGrammarIO({
		desc: '14c. Replace with a post-condition not applying, endsWith',
        grammar: Join(I("abazcabz"),
                      Replace("a", "X", Epsilon(), "z", false, true)),
        io: [
            ["abazcabz", "abazcabz"]
        ],
    });
    
    testGrammarIO({
		desc: '15a. Replace with pre and post, endsWith',
        grammar: Join(I("bcmaz"),
                      Replace("a", "X", "m", "z", false, true)),
        io: [
            ["bcmaz", "bcmXz"]
        ],
    });

    testGrammarIO({
		desc: '15b. Replace with pre and post, endsWith, with distractors',
        grammar: Join(I("mazbmazcmaz"),
                      Replace("a", "X", "m", "z", false, true)),
        io: [
            ["mazbmazcmaz", "mazbmazcmXz"]
        ],
    });

    testGrammarIO({
		desc: '15c. Replace with pre and post not applying, endsWith',
        grammar: Join(I("mazmazcmabz"),
                      Replace("a", "X", "m", "z", false, true)),
        io: [
            ["mazmazcmabz", "mazmazcmabz"]
        ],
    });

    // BEGIN AND ENDS

    testGrammarIO({
		desc: '16a. Replace one character, beginsWith endsWith',
        grammar: Join(I("a"),
                      Replace("a", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["a", "X"]
        ],
    });

    testGrammarIO({
		desc: '16b. Replace a character at the beginning, beginsWith endsWith',
        grammar: Join(I("abc"),
                      Replace("a", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["abc", "abc"]
        ],
    });

    testGrammarIO({
		desc: '16c. Replace a character in the middle, beginsWith endsWith',
        grammar: Join(I("abc"),
                      Replace("b", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["abc", "abc"]
        ],
    });
    
    testGrammarIO({
		desc: '16d. Replace a character at the end, beginsWith endsWith',
        grammar: Join(I("abc"),
                      Replace("c", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["abc", "abc"]
        ],
    });

    testGrammarIO({
		desc: '16e. Replace rule not applying, beginsWith endsWith',
        grammar: Join(I("bcd"),
                      Replace("a", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["bcd", "bcd"]
        ],
    });

    testGrammarIO({
		desc: '17a. Replace a multiple-character pattern with a single, ' +
              'beginsWith endsWith',
        grammar: Join(I("az"),
                      Replace("az", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["az", "X"]
        ],
    });
    
    testGrammarIO({
		desc: '17b. Replace a multiple-character pattern with a single, ' +
              'beginsWith endsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("az", "X", Epsilon(), Epsilon(), true, true)),
        io: [
            ["azbazcaz", "azbazcaz"]
        ],
    });

    testGrammarIO({
		desc: '17a. Replace with a pre-condition, beginsWith endsWith',
        grammar: Join(I("az"),
                      Replace("z", "X", "a", Epsilon(), true, true)),
        io: [
            ["az", "aX"]
        ],
    });

    testGrammarIO({
		desc: '17b. Replace with a pre-condition, beginsWith endsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("z", "X", "a", Epsilon(), true, true)),
        io: [
            ["azbazcaz", "azbazcaz"]
        ],
   });
    
    testGrammarIO({
		desc: '18a. Replace with a post-condition, beginsWith endsWith',
        grammar: Join(I("az"),
                      Replace("a", "X", Epsilon(), "z", true, true)),
        io: [
            ["az", "Xz"]
        ],
    });

    testGrammarIO({
		desc: '18b. Replace with a post-condition, beginsWith endsWith, with distractors',
        grammar: Join(I("azbazcaz"),
                      Replace("a", "X", Epsilon(), "z", true, true)),
        io: [
            ["azbazcaz", "azbazcaz"]
        ],
    });
    
    testGrammarIO({
		desc: '19a. Replace with pre and post, beginsWith endsWith',
        grammar: Join(I("maz"),
                      Replace("a", "X", "m", "z", true, true)),
        io: [
            ["maz", "mXz"]
        ],
    });

    testGrammarIO({
		desc: '19b. Replace with pre and post, endsWith, with distractors',
        grammar: Join(I("mazbmazcmaz"),
                      Replace("a", "X", "m", "z", true, true)),
        io: [
            ["mazbmazcmaz", "mazbmazcmaz"]
        ],
    });

    // Optional replace
    
    testGrammarIO({
		desc: '20a. Generation from a replace a->X with vocab a,b',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"),
                        OptionalReplace("a", "X"))),
        io: [
            ["", ""],       ["a", "a"],
            ["a", "X"],     ["b", "b"],
            ["aa", "aa"],   ["aa", "aX"],
            ["aa", "Xa"],   ["aa", "XX"],
            ["ab", "ab"],   ["ab", "Xb"],
            ["ba", "ba"],   ["ba", "bX"],
            ["bb", "bb"],   ["aaa", "aaa"],
            ["aaa", "aaX"], ["aaa", "aXa"],
            ["aaa", "aXX"], ["aaa", "Xaa"],
            ["aaa", "XaX"], ["aaa", "XXa"],
            ["aaa", "XXX"], ["aab", "aab"],
            ["aab", "aXb"], ["aab", "Xab"],
            ["aab", "XXb"], ["aba", "aba"],
            ["aba", "abX"], ["aba", "Xba"],
            ["aba", "XbX"], ["abb", "abb"],
            ["abb", "Xbb"], ["baa", "baa"],
            ["baa", "baX"], ["baa", "bXa"],
            ["baa", "bXX"], ["bab", "bab"],
            ["bab", "bXb"], ["bba", "bba"],
            ["bba", "bbX"], ["bbb", "bbb"]
        ]
    });
    
    testGrammarIO({
		desc: '20b. Generation from a replace a->X with vocab a,b, beginsWith',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"), 
                        OptionalReplace("a", "X", Epsilon(), Epsilon(), true))),
        io: [
            ["", ""],       ["a", "a"],
            ["a", "X"],     ["b", "b"],
            ["aa", "aa"],   ["aa", "Xa"],
            ["ab", "ab"],   ["ab", "Xb"],
            ["ba", "ba"],   ["bb", "bb"],
            ["aaa", "aaa"], ["aaa", "Xaa"],
            ["aab", "aab"], ["aab", "Xab"],
            ["aba", "aba"], ["aba", "Xba"],
            ["abb", "abb"], ["abb", "Xbb"],
            ["baa", "baa"], ["bab", "bab"],
            ["bba", "bba"], ["bbb", "bbb"]
        ]
    });

    testGrammarIO({
		desc: '20c. Generation from a replace a->X with vocab a,b, endsWith',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"), 
                        OptionalReplace("a", "X", Epsilon(), Epsilon(), false, true))),
        io: [
            ["", ""],       ["a", "a"],
            ["a", "X"],     ["b", "b"],
            ["aa", "aa"],   ["aa", "aX"],
            ["ab", "ab"],   ["ba", "ba"],
            ["ba", "bX"],   ["bb", "bb"],
            ["aaa", "aaa"], ["aaa", "aaX"],
            ["aab", "aab"], ["aba", "aba"],
            ["aba", "abX"], ["abb", "abb"],
            ["baa", "baa"], ["baa", "baX"],
            ["bab", "bab"], ["bba", "bba"],
            ["bba", "bbX"], ["bbb", "bbb"]
        ]
    });

    testGrammarIO({
		desc: '20d. Generation from a replace a->X with vocab a,b, beginsWith endsWith',
        grammar: Count({"$i":3},
                    Join(InputChars("ab"), 
                        OptionalReplace("a", "X", Epsilon(), Epsilon(), true, true))),
        io: [
            ["", ""],       ["a", "a"],
            ["a", "X"],     ["b", "b"],
            ["aa", "aa"],   ["ab", "ab"],
            ["ba", "ba"],   ["bb", "bb"],
            ["aaa", "aaa"], ["aab", "aab"],
            ["aba", "aba"], ["abb", "abb"],
            ["baa", "baa"], ["bab", "bab"],
            ["bba", "bba"], ["bbb", "bbb"]
        ]
    });

    testGrammarIO({
		desc: '21a. Replacement, beginning of word, with output join',
        grammar: Join(Seq(I("abc"), O("Xbc")), 
                      Replace("a", "X")),
        io: [
            ["abc", "Xbc"]
        ],
        priority: ["$i", "$o"]
    });
    
    testGrammarIO({
		desc: '21b. Replacement, middle of word, with output join',
        grammar: Join(Seq(I("abc"), O("aXc")), 
                      Replace("b", "X")),
        io: [
            ["abc", "aXc"]
        ],
        priority: ["$i", "$o"]
    });

    testGrammarIO({
		desc: '21c. Replacement, end of word, with output join',
        grammar: Join(Seq(I("abc"), O("abX")), 
                      Replace("c", "X")),
        io: [
            ["abc", "abX"]
        ],
        priority: ["$i", "$o"]
    });

    testGrammarIO({
		desc: '22a. Replace a multiple-character pattern with a single, ' +
              'beginning of word, with output join',
        grammar: Join(Seq(I("azbc"), O("Xbc")), 
                      Replace("az", "X")),
        io: [
            ["azbc", "Xbc"]
        ],
        priority: ["$i", "$o"]
    });

    testGrammarIO({
		desc: '22b. Replace a multiple-character pattern with a single, ' +
              'end of word, with output join',
        grammar: Join(Seq(I("abcz"), O("abX")), 
                      Replace("cz", "X")),
        io: [
            ["abcz", "abX"]
        ],
        priority: ["$i", "$o"],
    });

    testGrammarIO({
		desc: '22c. Replace a multiple-character pattern with a single, several times',
        grammar: Join(Seq(I("azbazcaz"), O("XbXcX")),
                      Replace("az", "X")),
        io: [
            ["azbazcaz", "XbXcX"]
        ],
        priority: ["$i", "$o"]
    });
    
    testGrammarIO({
		desc: '22d. Replace a multiple-character pattern with a single, ' +
              'several times, with distractors',
        grammar: Join(Seq(I("azabzaazcaaz"), O("XabzaXcaX")),
                      Replace("az", "X")),
        io: [
            ["azabzaazcaaz", "XabzaXcaX"]
        ],
        priority: ["$i", "$o"]
    });
    
    testGrammarIO({
		desc: '23a. Replace a single-character pattern with multiple, at the beginning',
        grammar: Join(Seq(I("abc"), O("XYbc")),
                      Replace("a", "XY")),
        io: [
            ["abc", "XYbc"]
        ],
        priority: ["$i", "$o"]
    });
    
    testGrammarIO({
		desc: '23b. Replace a single-character pattern with multiple, at the end',
        grammar: Join(Seq(I("abc"), O("abXY")),
                      Replace("c", "XY")),
        io: [
            ["abc", "abXY"]
        ],
        priority: ["$i", "$o"]
    });
    
    testGrammarIO({
		desc: '23c. Replace a single-character pattern with multiple, several times',
        grammar: Join(Seq(I("abaca"), O("XYbXYcXY")),
                      Replace("a", "XY")),
        io: [
            ["abaca", "XYbXYcXY"]
        ],
        priority: ["$i", "$o"]
    });
});
