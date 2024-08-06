import {
    Dot, Embed, Epsilon,
    Join, Lit, Rep, Seq,
    SingleTape, Uni, 
} from "../../interpreter/src/grammarConvenience";

import { DEFAULT_TAPE } from "../../interpreter/src/utils/constants";
import { Grammar } from "../../interpreter/src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3
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
		desc: '1b. Single_t1(ε)',
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
		desc: '4b. Single_t1(t2:hello+t3:world))',
        grammar: SingleTape("t1", Seq(t2("hello"), t3("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '5a. Single_t1(T:hello|T:world))',
        grammar: SingleTape("t1", Uni(T("hello"), T("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
            {t1: 'world'},
        ],
    });

    testGrammar({
		desc: '5b. Single_t1(t2:hello|t3:world))',
        grammar: SingleTape("t1", Uni(t2("hello"), t3("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
            {t1: 'world'},
        ],
    });

    testGrammar({
		desc: '6. Single_t1((T:hello)*)',
        grammar: SingleTape("t1", Rep(T("hello"))),
        maxChars: 15,
        tapes: ["t1"],
        results: [
            {},
            {t1: 'hello'},
            {t1: 'hellohello'},
            {t1: 'hellohellohello'},
        ],
    });

    testGrammar({
		desc: '7a. Alternating an embed and a literal in a singletape',
        grammar: {
            "a": t2("world"),
            "b": SingleTape("t1", Uni(Embed("a"), T("hello")))
        },
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: "hello"},
            {t1: "world"}
        ],
    });

    testGrammar({
		desc: '7b. Alternating two embeds with different tapes in a singletape',
        grammar: {
            "a": t1("hello"),
            "b": t2("world"),
            "c": SingleTape("t3", Uni(Embed("a"), Embed("b")))
        },
        symbol: "c",
        tapes: ["t3"],
        results: [
            {t3: "hello"}, 
            {t3: "world"}
        ],
    });
    
    testGrammar({
		desc: '8a. Concatenating an embed and a literal in a singletape',
        grammar: {
            "a": t2("hello"),
            "b": SingleTape("t1", Seq(Embed("a"), T("world")))
        },
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: "helloworld"}
        ],
    });

    testGrammar({
		desc: '8b. Concatenating two embeds with different tapes in a singletape',
        grammar: {
            "a": t1("hello"),
            "b": t2("world"),
            "c": SingleTape("t3", Seq(Embed("a"), Embed("b")))
        },
        symbol: "c",
        tapes: ["t3"],
        results: [
            {t3: "helloworld"}
        ],
    });

    testGrammar({
		desc: '9. Repeating an embed in a singletape',
        grammar: {
            "a": t2("hello"),
            "b": SingleTape("t1", Rep(Embed("a")))
        },
        symbol: "b",
        tapes: ["t1"],        
        maxChars: 15,
        results: [
            {},
            {t1: 'hello'},
            {t1: 'hellohello'},
            {t1: 'hellohellohello'},
        ],
    });

    testGrammar({
		desc: '10a. Joining an embed and a literal in a singletape',
        grammar: {
            "a": t2("hello"),
            "b": SingleTape("t1", Join(Embed("a"), T("hello")))
        },
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: "hello"}
        ],
    });

    testGrammar({
		desc: '10b. Joining two embeds with different tapes in a singletape',
        grammar: {
            "a": t1("hello"),
            "b": t2("hello"),
            "c": SingleTape("t3", Join(Embed("a"), Embed("b")))
        },
        symbol: "c",
        tapes: ["t3"],
        results: [
            {t3: "hello"}
        ],
    });

    testGrammar({
		desc: 'E1. Single_t1(embed(eps))',
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
		desc: 'E2. Single_t1(embed(t1:hello,t2:world))',
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
