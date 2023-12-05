import { expect } from "chai";

import {
    Count, Epsilon, Hide, Rep, Seq, Uni,
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
    generateOutputs,
    prepareInterpreter,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
		desc: '1a. Count_t1:3 (t1:hello)',
        grammar: Count({t1:3}, t1("hello")),
        results: [
        ],
    });

    testGrammar({
		desc: '1b. Count_t1:3 (t1:hi)',
        grammar: Count({t1:3}, t1("hi")),
        results: [
            {t1: "hi"},
        ],
    });

    testGrammar({
		desc: '1c. Count_t2:3 (t1:hello)',
        grammar: Count({t2:3}, t1("hello")),
        results: [
            {t1: "hello"},
        ],
    });

    testGrammar({
		desc: '1d. Count_t1:3 (t1:h)*',
        grammar: Count({t1:3}, Rep(t1("h"))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ],
    });

    testGrammar({
		desc: '2a. Count_t1:3,t2:3 (t1:h* + t2:i*)',
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
    });

    testGrammar({
		desc: '2b. Count_t1:3,t2:3 (t1:h + t2:i)*',
        grammar: Count({t1:3, t2:3},
                       Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    });

    testGrammar({
		desc: '2c. Count_t1:3 (t1:h + t2:i)*',
        grammar: Count({t1:3},
                       Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    });

    testGrammar({
		desc: '2d. Count_t2:3 (t1:h + t2:i)*',
        grammar: Count({t2:3},
                       Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    });

    testGrammar({
		desc: '3a. Count_t1:3,t2:3 (t1:h + t2:ii)*',
        grammar: Count({t1:3, t2:3},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
        ],
    });

    testGrammar({
		desc: '3b. Count_t1:6,t2:6 (t1:h + t2:ii)*',
        grammar: Count({t1:6, t2:6},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    });

    testGrammar({
		desc: '4a. Count_t1:3,t2:6 (t1:h + t2:ii)*',
        grammar: Count({t1:3, t2:6},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    });

    testGrammar({
		desc: '4b. Count_t1:3 (t1:h + t2:ii)*',
        grammar: Count({t1:3},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    });

    testGrammar({
		desc: '4c. Count_t2:6 (t1:h + t2:ii)*',
        grammar: Count({t2:6},
                       Rep(Seq(t1("h"), t2("ii")))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ],
    });

    testGrammar({
		desc: '5a. Count_t2:5 Count_t1:3 (t1:h + t2:ii)*',
        grammar: Count({t2:5},
                       Count({t1:3},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    });

    testGrammar({
		desc: '5b. Count_t1:3 Count_t2:5 (t1:h + t2:ii)*',
        grammar: Count({t1:3},
                       Count({t2:5},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    });

    testGrammar({
		desc: '6a. Count_t1:2 Count_t2:6 (t1:h + t2:ii)*',
        grammar: Count({t1:2},
                       Count({t2:6},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    });

    testGrammar({
		desc: '6b. Count_t2:6 Count_t1:2 (t1:h + t2:ii)*',
        grammar: Count({t2:6},
                       Count({t1:2},
                             Rep(Seq(t1("h"), t2("ii"))))),
        results: [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ],
    });
    
    testGrammar({
		desc: '7a. Count_t1:3 Count_t1:5 (t1:h)*',
        grammar: Count({t1:3},
                       Count({t1:5},
                             Rep(t1("h")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ],
    });

    testGrammar({
		desc: '7b. Count_t1:5 Count_t1:3 (t1:h)*',
        grammar: Count({t1:5},
                       Count({t1:3},
                             Rep(t1("h")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ],
    });

    testGrammar({
		desc: '8. Count_t1:3,t2:3 (t1:h + hide(t2:i))*',
        grammar: Count({t1:3, ".H":3},
                       Rep(Seq(t1("h"), Hide(t2("i"), "t2", "H")))),
        stripHidden: false,
        results: [
            {},
            {t1: 'h', ".H": 'i'},
            {t1: 'hh', ".H": 'ii'},
            {t1: 'hhh', ".H": 'iii'},
        ],
    });

    testGrammar({
		desc: '9a. Count_t1:8 (t1:hello+(t1:world|ε))',
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(t1("world"), Epsilon()))),
        results: [
            {t1: "hello"},
        ],
    });

    testGrammar({
		desc: '9b. Count_t1:8 (t1:hello+(t1:ε|world))',
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(Epsilon(), t1("world")))),
        results: [
            {t1: "hello"},
        ],
    });

    testGrammar({
		desc: '9c. Count_t1:8 (t1:hello+(t1:world|t1:!))',
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(t1("world"), t1("!")))),
        results: [
            {t1: "hello!"},
        ],
    });
    
    testGrammar({
		desc: '9d. Count_t1:8 (t1:hello+(t1:!|t1:world))',
        grammar: Count({t1:8},
                       Seq(t1("hello"), Uni(t1("!"), t1("world")))),
        results: [
            {t1: "hello!"},
        ],
    });

    // Test errorOnCountExceeded option
 
    testGrammar({
		desc: '10a. Count_t1:5Err (ε|t1:h){0,5}',
        grammar: Count({t1:5},
                       Rep(Uni(Epsilon(), t1("h")), 0, 5),
                       false, true),            
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
            {t1: 'hhhhh'},
        ],
    });

    describe('10b. Count_t1:3Err (ε|t1:h){0,5}', function() {
        const grammar = Count({t1:3},
                              Rep(Uni(Epsilon(), t1("h")), 0, 5),
                              false, true);
        const int = prepareInterpreter(grammar);
        it('Caught "Count exceeded" Error', function() {
            expect(
                () => generateOutputs(int, "", {}, false, true)
            ).to.throw(Error, "Count exceeded on t1");
        });
    });

});
