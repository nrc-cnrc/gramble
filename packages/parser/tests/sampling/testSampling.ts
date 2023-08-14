import { CharSet, Count, Rep, Seq, Uni } from "../../src/grammars";
import { t1 } from "../testUtil";
import { testSample } from "./testSamplingUtil";

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

});