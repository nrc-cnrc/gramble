import {
    SingleTape,
    Lit,
    Dot,
    Join,
    Collection,
    Embed,
    Epsilon,
    Seq,
    Uni, 
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux
} from "./testGrammarUtil";

import {
    logTestSuite, t1, t2, VERBOSE_TEST_L2,
} from "../testUtil";
import { DEFAULT_TAPE, INPUT_TAPE, OUTPUT_TAPE } from "../../src/utils/constants";
import { EpsilonGrammar, Grammar } from "../../src/grammars";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

function T(s: string): Grammar {
    return Lit(DEFAULT_TAPE, s);
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Single_t1($T:hello)', test({
        grammar: SingleTape("t1", T("hello")),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('1. Single_t1(ε)', test({
        grammar: SingleTape("t1", Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('2. Single_t1($T:.)', test({
        grammar: Join(t1("h"), 
                      SingleTape("t1", Dot(DEFAULT_TAPE))),
        tapes: ["t1"],
        results: [
            {t1: 'h'},
        ],
    }));

    describe('3a. Single_t1(embed(t1:hello))', test({
        grammar: Collection({
                    "a": t1("hello"),
                    "b": SingleTape("t1", Embed("a"))
        }),
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('3b. Single_t1(embed(t2:hello))', test({
        grammar: Collection({
                    "a": t2("hello"),
                    "b": SingleTape("t1", Embed("a"))
        }),
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('3c. Single_t1(embed(T:hello))', test({
        grammar: Collection({
                    "a": T("hello"),
                    "b": SingleTape("t1", Embed("a"))
        }),
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));
    
    describe('4a. Single_t1(T:hello+T:world))', test({
        grammar: SingleTape("t1", Seq(T("hello"), T("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'helloworld'},
        ],
    }));

    describe('4b. Single_t1(T:hello|T:world))', test({
        grammar: SingleTape("t1", Uni(T("hello"), T("world"))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
            {t1: 'world'},
        ],
    }));
    
    describe('E1. Single_t1(t1(hello)+t2(world))', test({
        grammar: SingleTape("t1", Seq(t1("hello"), t2("world"))),
        tapes: [],
        results: [
            {},
        ],
        numErrors: 1
    }));

    describe('E2. Single_t1(embed(eps))', test({
        grammar: Collection({
                    "a": Epsilon(),
                    "b": SingleTape("t1", Embed("a"))
        }),
        symbol: "b",
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('E3. Single_t1(embed(t1:hello,t2:world))', test({
        grammar: Collection({
                    "a": Seq(t1("hello"), t2("world")),
                    "b": SingleTape("t1", Embed("a"))
        }),
        symbol: "b",
        tapes: [],
        results: [
            {},
        ],
        numErrors: 1
    }));

});