import { 
    CharSet, Count, 
    Cursor, Dot, 
    Epsilon, 
    Not, Rep, 
    Replace, 
    ReplaceBlock, 
    Seq, Uni 
} from "../../src/grammarConvenience";

import { DUMMY_REGEX_TAPE, VERBOSE_DEBUG } from "../../src/util";
import { t1, t2 } from "../testUtil";
import { testSample, withVocab } from "./testSamplingUtil";

function splitUni(tapeName: string, text: string) {
    return CharSet(tapeName, text.split(""))
}

describe(`Sampling tests`, function() {

    testSample({
        desc: "1. Alternation",
        grammar: Uni("hello", "hell", "world", ""),
    });

    testSample({
        desc: "2b. Long alternation",
        grammar: splitUni("t1", "abcdefghijklmnopqrstuvwxyz"),
        numSamples: 1000
    });
    
    testSample({
        desc: "2b. Large product of alternations",
        grammar: Seq(splitUni("t1", "abcdef"),
                     splitUni("t2", "ABCDEF")),
        numSamples: 1000
    });

    testSample({
        desc: "3. Repetition",
        grammar: Count({t1: 10}, Rep(t1("foo")))
    });

    testSample({
        desc: "4a. Concatenation",
        grammar: Seq(Uni("blue", "boysen"),
                    Uni("berry", "bird"))
    });

    testSample({
        desc: "4b. Concatenation with nullable first child",
        grammar: Seq(Uni("blue", "boysen", "",
                    Uni("berry", "bird")))
    });

    testSample({
        desc: '5. Cursors inside alternations',
        grammar: Uni(Cursor("t1", t1("hello")), 
                        Cursor("t2", t2("world"))),
    });
    
    testSample({
        desc: '6. Dot',
        grammar: withVocab("abc", Dot("t1"))
    });

    testSample({
        desc: '6. Dot star',
        grammar: Count({t1: 3}, Seq(t1("ab"), Rep(Dot("t1")))),
    });
    
    testSample({
        desc: '7. Negation',
        grammar: Count({t1: 2}, withVocab("ab", Not(t1("bb")))),
    });

    testSample({
        desc: '8. Replacement: hello ⨝ e -> a',
        grammar: ReplaceBlock("t1", "hello", Replace("e","a")),
    });

    testSample({
        desc: '8a. Replacement: hello ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    "hello", Replace("e","a")),
    });

    testSample({
        desc: '8b. Replacement: hello|hell ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    Uni("hello","hell"), Replace("e","a")),
    });

    testSample({
        desc: '8c. Replacement: h|hi ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    Uni("h","hi"), Replace("e","a")),
    });
    
    testSample({
        desc: '9. Replacement of epsilon ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    Epsilon(), Replace("e","a"))
    });

    testSample({
        desc: '10a. Replacement of alternation: hello|hell ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    Uni("hello","hell"), Replace("e","a")),
    });
    
    testSample({
        desc: '10b. Replacement of alternation: h|hi ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    Uni("h","hi"), Replace("e","a")),
    });

    testSample({
        desc: '10c. Replacement of alternation: hello|hell|eps ⨝ e -> a',
        grammar: ReplaceBlock(DUMMY_REGEX_TAPE, 
                    Uni("hello","hell", Epsilon()), Replace("e","a")),
    });

    testSample({
        desc: '11a. Replacement of repetition: hello* ⨝ e -> a',
        grammar: Count({[DUMMY_REGEX_TAPE]:10}, 
                    ReplaceBlock(DUMMY_REGEX_TAPE, 
                        Rep("hello"), Replace("e","a"))),
    });

    testSample({
        desc: '11b. Replacement of repetition: (hello|hi)* ⨝ e -> a',
        grammar: Count({[DUMMY_REGEX_TAPE]:6}, 
                    ReplaceBlock(DUMMY_REGEX_TAPE, 
                        Rep(Uni("hello", "hi")), Replace("e","a"))),
    });
    
    testSample({
        desc: '11c. Replacement of repetition: (hello|hi|eps)* ⨝ e -> a',
        grammar: Count({[DUMMY_REGEX_TAPE]:6}, 
                    ReplaceBlock(DUMMY_REGEX_TAPE, 
                        Rep(Uni("hello", "hi", Epsilon())), Replace("e","a"))),
    });

});