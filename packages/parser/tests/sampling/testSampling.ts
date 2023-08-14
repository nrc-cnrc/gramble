import { Count, Rep, Uni } from "../../src/grammars";
import { t1 } from "../testUtil";
import { testSample } from "./testSamplingUtil";

describe(`Sampling tests`, function() {

    testSample({
        desc: "Alternation",
        grammar: Uni(t1("hello"), t1("hell"), t1("world"), t1(""))
    });

    const alpha = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
                    .split("").map(c => t1(c));

    testSample({
        desc: "Really long alternation",
        grammar: Uni(...alpha)
    });

    testSample({
        desc: "Repetition",
        grammar: Count({t1: 10}, Rep(t1("foo")))
    });

});