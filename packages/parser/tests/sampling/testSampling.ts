import { 
    CharSet, Count, 
    Cursor, Dot, 
    Not, Rep, 
    Seq, Uni 
} from "../../src/grammarConvenience";

import { VERBOSE_DEBUG } from "../../src/util";
import { t1, t2 } from "../testUtil";
import { testSample, withVocab } from "./testSamplingUtil";

function splitUni(tapeName: string, text: string) {
    return CharSet(tapeName, text.split(""))
}

describe(`Sampling tests`, function() {

    testSample({
        desc: "1. Alternation",
        grammar: Uni(t1("hello"), t1("hell"), t1("world"), t1(""))
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
        grammar: Seq(Uni(t1("blue"), t1("boysen")),
                    Uni(t1("berry"), t1("bird")))
    });

    testSample({
        desc: "4b. Concatenation with nullable first child",
        grammar: Seq(Uni(t1("blue"), t1("boysen"), t1("")),
                    Uni(t1("berry"), t1("bird")))
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

});