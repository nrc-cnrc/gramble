import {
    Dot, Embed, Epsilon,
    Join, Lit, Seq,
    SingleTape, Uni, 
} from "../../interpreter/src/grammarConvenience";

import { DEFAULT_TAPE } from "../../interpreter/src/utils/constants";
import { Grammar } from "../../interpreter/src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function T(s: string): Grammar {
    return Lit(DEFAULT_TAPE, s);
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
		desc: '1. Single_t1($T:hello)',
        grammar: SingleTape("t1", T("hello")),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '1. Single_t1(ε)',
        grammar: SingleTape("t1", Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '2. Single_t1($T:.)',
        grammar: Join(t1("h"), 
                      SingleTape("t1", Dot(DEFAULT_TAPE))),
        tapes: ["t1"],
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
		desc: '3a. Single_t1(embed(t1:hello))',
        grammar: {
            "a": t1("hello"),
            "b": SingleTape("t1", Embed("a"))
        },
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '3b. Single_t1(embed(t2:hello))',
        grammar: {
            "a": t2("hello"),
            "b": SingleTape("t1", Embed("a"))
        },
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '3c. Single_t1(embed(T:hello))',
        grammar: {
            "a": T("hello"),
            "b": SingleTape("t1", Embed("a"))
        },
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });
    
    testGrammar({
		desc: '4a. Single_t1(T:hello+T:world))',
        grammar: SingleTape("t1", Seq(T("hello"), T("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '4b. Single_t1(T:hello|T:world))',
        grammar: SingleTape("t1", Uni(T("hello"), T("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
            {t1: 'world'},
        ],
    });

    testGrammar({
		desc: '5a. Alternating an embed and a literal in a singletape',
        grammar: {
            "a": t2("world"),
            "b": SingleTape("t1", Uni(Embed("a"), T("hello")))
        },
        symbol: "b",
        tapes: [],
        results: [
            {t1: "hello"},
            {t2: "world"}
        ],
    });

    testGrammar({
		desc: '5b. Alternating two embeds with different tapes in a singletape',
        grammar: {
            "a": t1("hello"),
            "b": t2("world"),
            "c": SingleTape("t3", Uni(Embed("a"), Embed("b")))
        },
        symbol: "c",
        tapes: [],
        results: [
            {t1: "hello"},
            {t2: "world"}
        ],
    });
    
    testGrammar({
		desc: 'E1. Single_t1(t1(hello)+t2(world))',
        grammar: SingleTape("t1", Seq(t1("hello"), t2("world"))),
        tapes: [],
        results: [
            {},
        ],
        numErrors: 1
    });

    testGrammar({
		desc: 'E2. Single_t1(embed(eps))',
        grammar: {
            "a": Epsilon(),
            "b": SingleTape("t1", Embed("a"))
        },
        symbol: "b",
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: 'E3. Single_t1(embed(t1:hello,t2:world))',
        grammar: {
            "a": Seq(t1("hello"), t2("world")),
            "b": SingleTape("t1", Embed("a"))
        },
        symbol: "b",
        tapes: [],
        results: [
            {},
        ],
        numErrors: 1
    });

});
