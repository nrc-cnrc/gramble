import { 
    CharSet, Count, Cursor,
    Dot, Epsilon, Not, Rep, 
    Replace, ReplaceBlock,  
    Seq, Uni, WithVocab,
} from "../../interpreter/src/grammarConvenience.js";

import { DEFAULT_TAPE } from "../../interpreter/src/utils/constants.js";

import { testSample } from "./testSamplingUtil.js";

import {
    t1, t2,
} from "../testUtil.js";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging.js";

function splitUni(tapeName: string, text: string) {
    return CharSet(tapeName, text.split(""))
}

describe(`Sampling tests`, function() {

    testSample({
        desc: "1a. Alternation (n=100) - with the default seed.",
        grammar: Uni("hello", "hell", "world", ""),
    });

    testSample({
        desc: "1b. Alternation (n=10) - with the default seed.",
        grammar: Uni("hello", "hell", "world", ""),
        numSamples: 10,
        results: [
            {},
            {$T: "hell"},
            {$T: "hello"},
            {$T: "world"},
        ],
    });

    testSample({
        desc: "1c. Alternation (n=3) - with the default seed.",
        grammar: Uni("hello", "hell", "world", ""),
        numSamples: 3,
        results: [
            {},
            {$T: "hell"},
        ],
    });

    testSample({
        desc: "1d. Alternation (n=3) - a second time with the default seed.",
        grammar: Uni("hello", "hell", "world", ""),
        numSamples: 3,
        results: [
            {},
            {$T: "hell"},
        ],
    });

    testSample({
        desc: "1e. Alternation (n=3) - with a different seed",
        grammar: Uni("hello", "hell", "world", ""),
        numSamples: 3,
        seed: "Trying a different seed",
        results: [
            {},
            {$T: "hello"},
        ],
    });

    testSample({
        desc: "1f. Alternation (n=3) - with yet another different seed",
        grammar: Uni("hello", "hell", "world", ""),
        numSamples: 3,
        seed: "Yet another seed",
        results: [
            {$T: "hello"},
            {$T: "world"},
        ],
    });

    testSample({
        desc: "2a. Long alternation (n=1000)",
        grammar: splitUni("t1", "abcdefghijklmnopqrstuvwxyz"),
        numSamples: 1000
    });
    
    testSample({
        desc: "2b. Large product of alternations (n=1000)",
        grammar: Seq(splitUni("t1", "abcdef"),
                     splitUni("t2", "ABCDEF")),
        numSamples: 1000
    });
    
    testSample({
        desc: "2c. Large product of alternations (n=20)",
        grammar: Seq(splitUni("t1", "abcdef"),
                     splitUni("t2", "ABCDEF")),
        numSamples: 20,
        results: [
            {t1: 'a', t2: 'A'},
            {t1: 'a', t2: 'B'},
            {t1: 'b', t2: 'A'},
            {t1: 'b', t2: 'F'},
            {t1: 'c', t2: 'A'},
            {t1: 'c', t2: 'B'},
            {t1: 'c', t2: 'E'},
            {t1: 'd', t2: 'A'},
            {t1: 'd', t2: 'D'},
            {t1: 'd', t2: 'E'},
            {t1: 'e', t2: 'A'},
            {t1: 'e', t2: 'C'},
            {t1: 'e', t2: 'F'},
            {t1: 'f', t2: 'A'},
            {t1: 'f', t2: 'D'},
            {t1: 'f', t2: 'E'},
        ],
    });

    testSample({
        desc: "3. Repetition",
        grammar: Count({t1: 10}, Rep(t1("foo"))),
    });

    testSample({
        desc: "4a. Concatenation",
        grammar: Seq(Uni("blue", "boysen"),
                     Uni("berry", "bird")),
    });

    testSample({
        desc: "4b. Concatenation with nullable first child",
        grammar: Seq(Uni("blue", "boysen", "",
                         Uni("berry", "bird"))),
    });

    testSample({
        desc: '5. Cursors inside alternations',
        grammar: Uni(Cursor("t1", t1("hello")), 
                     Cursor("t2", t2("world"))),
    });
    
    testSample({
        desc: '6. Dot',
        grammar: WithVocab({t1: "abc"}, Dot("t1")),
    });

    testSample({
        desc: '6. Dot star',
        grammar: Count({t1: 3},
                       Seq(t1("ab"), Rep(Dot("t1")))),
    });
    
    testSample({
        desc: '7. Negation',
        grammar: Count({t1: 2},
                     WithVocab({t1: "ab"}, Not(t1("bb")))),
    });

    testSample({
        desc: '8. Replacement: hello ⨝ e -> a',
        grammar: ReplaceBlock("t1", "hello",
                              Replace("e", "a")),
    });

    testSample({
        desc: '8a. Replacement: hello ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, "hello",
                              Replace("e", "a")),
    });

    testSample({
        desc: '8b. Replacement: hello|hell ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("hello", "hell"),
                              Replace("e", "a")),
    });

    testSample({
        desc: '8c. Replacement: h|hi ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("h", "hi"),
                              Replace("e", "a")),
    });
    
    testSample({
        desc: '9. Replacement of ε ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Epsilon(),
                              Replace("e", "a"))
    });

    testSample({
        desc: '10a. Replacement of alternation: hello|hell ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("hello", "hell"),
                              Replace("e", "a")),
    });
    
    testSample({
        desc: '10b. Replacement of alternation: h|hi ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("h", "hi"),
                              Replace("e", "a")),
    });

    testSample({
        desc: '10c. Replacement of alternation: hello|hell|ε ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("hello", "hell", Epsilon()),
                              Replace("e", "a")),
    });

    testSample({
        desc: '11a. Replacement of repetition: hello* ⨝ e -> a',
        grammar: Count({[DEFAULT_TAPE]:10}, 
                     ReplaceBlock(DEFAULT_TAPE, 
                                  Rep("hello"),
                                  Replace("e", "a"))),
    });

    testSample({
        desc: '11b. Replacement of repetition: (hello|hi)* ⨝ e -> a',
        grammar: Count({[DEFAULT_TAPE]:6}, 
                     ReplaceBlock(DEFAULT_TAPE, 
                                  Rep(Uni("hello", "hi")),
                                  Replace("e", "a"))),
    });
    
    testSample({
        desc: '11c. Replacement of repetition: (hello|hi|eps)* ⨝ e -> a',
        grammar: Count({[DEFAULT_TAPE]:6}, 
                     ReplaceBlock(DEFAULT_TAPE, 
                                  Rep(Uni("hello", "hi", Epsilon())),
                                  Replace("e", "a"))),
    });

});
