import {
    Count, Epsilon, Hide, Rep, Seq, Uni,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1a. Count_t1:3 (t1:hello)', test({
        grammar: Count({t1:3}, t1("hello")),
        results: [
        ],
    }));

    describe('1b. Count_t1:3 (t1:hi)', test({
        grammar: Count({t1:3}, t1("hi")),
        results: [
            {t1: "hi"},
        ],
    }));

    describe('1c. Count_t2:3 (t1:hello)', test({
        grammar: Count({t2:3}, t1("hello")),
        results: [
            {t1: "hello"},
        ],
    }));

    describe('1d. Count_t1:3 (t1:h)*', test({
        grammar: Count({t1:3}, Rep(t1("h"))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ],
    }));

    describe('2a. Count_t1:3,t2:3 (t1:h* + t2:i*)', test({
        grammar: Count({t1:3, t2:3},
                       Seq(Rep(t1("h")), Rep(t2("i")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t2: 'i'},
            {t2: 'ii'},
            {t2: 'iii'},
            {t1: 'h', t2: 'i'},
            {t1: 'h', t2: 'ii'},
            {t1: 'h', t2: 'iii'},
            {t1: 'hh', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hh', t2: 'iii'},
            {t1: 'hhh', t2: 'i'},
            {t1: 'hhh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    }));

    describe('2b. Count_t1:3,t2:3 (t1:h + t2:i)*', test({
        grammar: Count({t1:3, t2:3},
                       Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    }));

    describe('2c. Count_t1:3 (t1:h + t2:i)*', test({
        grammar: Count({t1:3},
                       Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    }));

    describe('2d. Count_t2:3 (t1:h + t2:i)*', test({
        grammar: Count({t2:3},
                       Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    }));

    describe('3a. Count_t1:3,t2:3 (t1:h + t2:ii)*', test({
        grammar: Count({t1:3, t2:3},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
        ],
    }));

    describe('3b. Count_t1:6,t2:6 (t1:h + t2:ii)*', test({
        grammar: Count({t1:6, t2:6},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    }));

    describe('4a. Count_t1:3,t2:6 (t1:h + t2:ii)*', test({
        grammar: Count({t1:3, t2:6},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    }));

    describe('4b. Count_t1:3 (t1:h + t2:ii)*', test({
        grammar: Count({t1:3},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    }));

    describe('4c. Count_t2:6 (t1:h + t2:ii)*', test({
        grammar: Count({t2:6},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    }));

    describe('5a. Count_t2:5 Count_t1:3 (t1:h + t2:ii)*', test({
        grammar: Count({t2:5},
                       Count({t1:3},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    }));

    describe('5b. Count_t1:3 Count_t2:5 (t1:h + t2:ii)*', test({
        grammar: Count({t1:3},
                       Count({t2:5},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    }));

    describe('6a. Count_t1:2 Count_t2:6 (t1:h + t2:ii)*', test({
        grammar: Count({t1:2},
                       Count({t2:6},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    }));

    describe('6b. Count_t2:6 Count_t1:2 (t1:h + t2:ii)*', test({
        grammar: Count({t2:6},
                       Count({t1:2},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    }));
    
    describe('7a. Count_t1:3 Count_t1:5 (t1:h)*', test({
        grammar: Count({t1:3},
                       Count({t1:5},
                             Rep(t1("h")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ],
    }));

    describe('7b. Count_t1:5 Count_t1:3 (t1:h)*', test({
        grammar: Count({t1:5},
                       Count({t1:3},
                             Rep(t1("h")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ],
    }));

    describe('8. Count_t1:3,t2:3 (t1:h + hide(t2:i))*', test({
        grammar: Count({t1:3, ".H":3},
                       Rep(Seq(t1("h"), Hide(t2("i"), "t2", "H")))),
        stripHidden: false,
        results: [
            {},
            {t1: 'h', ".H": 'i'},
            {t1: 'hh', ".H": 'ii'},
            {t1: 'hhh', ".H": 'iii'},
        ],
    }));

    describe('9a. Count_t1:8 (t1:hello+(t1:world|ε))', test({
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(t1("world"), Epsilon()))),
        results: [
            {t1: "hello"},
        ],
    }));

    describe('9b. Count_t1:8 (t1:hello+(t1:ε|world))', test({
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(Epsilon(), t1("world")))),
        results: [
            {t1: "hello"},
        ],
    }));

    describe('9c. Count_t1:8 (t1:hello+(t1:world|t1:!))', test({
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(t1("world"), t1("!")))),
        results: [
            {t1: "hello!"},
        ],
    }));
    
    describe('9d. Count_t1:8 (t1:hello+(t1:!|t1:world))', test({
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(t1("!"), t1("world")))),
        results: [
            {t1: "hello!"},
        ],
    }));

});
