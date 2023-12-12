import { 
    Any, Count, Cursor, Epsilon, 
    Join, Match, Rep, 
    Seq, Uni, WithVocab,
} from "../../interpreter/src/grammarConvenience";

import {
    SILENT, VERBOSE_DEBUG, VERBOSE_STATES
} from "../../interpreter/src/utils/logging";

import { Grammar } from "../../interpreter/src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

function withCountGuard1(maxChars: number, grammar: Grammar) {
    return Count({t1: maxChars}, grammar, true, true);
}
function withCountGuard2(maxChars: number, grammar: Grammar) {
    return Count({t1: maxChars, t2: maxChars}, grammar, true, true);
}

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

// Some tests can be skipped.
// Set SKIP_GENERATION to false to force running of those tests.
const SKIP_GENERATION = true;

// Note: tests involving * repeats ({0,Inf}) are denoted with * in the number.

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Repeat 0-3 Os: t1:o{0,3}',
        grammar: Rep(t1("o"), 0, 3),
        tapes: ["t1"],
        results: [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
        ],
    });

    testGrammar({
        desc: '1*. Repeat 0-3 Os: Count_t1:3 t1:o*',
        grammar: Count({t1: 3},
                       Rep(t1("o"))),
        results: [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
        ],
    });

    testGrammar({
        desc: '2. Repeat 1-4 Os: t1:o{1,4}',
        grammar: Rep(t1("o"), 1, 4),
        results: [
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
        ],
    });

    testGrammar({
        desc: '3. Repeat 1-4 empty strings: t1:{1,4}',
        grammar: Rep(t1(""), 1, 4),
        results: [
            {}
        ],
    });

    testGrammar({
        desc: '4. t1:o{1,4} + t2:foo',
        grammar: Seq(Rep(t1("o"), 1, 4), t2("foo")),
        results: [
            {t1: 'o', t2: 'foo'},
            {t1: 'oo', t2: 'foo'},
            {t1: 'ooo', t2: 'foo'},
            {t1: 'oooo', t2: 'foo'},
        ],
    });

    testGrammar({
        desc: '5. t2:foo + t1:o{1,4}',
        grammar: Seq(t2("foo"), Rep(t1("o"), 1, 4)),
        // vocab: {t1: 1, t2: 2},
        results: [
            {t1: 'o', t2: 'foo'},
            {t1: 'oo', t2: 'foo'},
            {t1: 'ooo', t2: 'foo'},
            {t1: 'oooo', t2: 'foo'},
        ],
    });

    testGrammar({
        desc: '6. Hello with 1-4 Os: t1:hell+t1:o{1,4}',
        grammar: Seq(t1("hell"), Rep(t1("o"), 1, 4)),
        results: [
            {t1: 'hello'},
            {t1: 'helloo'},
            {t1: 'hellooo'},
            {t1: 'helloooo'},
        ],
    });

    testGrammar({
        desc: '7. Hello with 0-1 Os: t1:hell+t1:o{0,1}',
        grammar: Seq(t1("hell"), Rep(t1("o"), 0, 1)),
        results: [
            {t1: 'hell'},
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '7*. Hello with 0-1 Os: Count_t1:5 t1:hell+t1:o*',
        grammar: Count({t1: 5},
                       Seq(t1("hell"), Rep(t1("o")))),
        results: [
            {t1: 'hell'},
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '8. Hello with 1-4 Hs: t1:h{1,4}+t1:ello',
        grammar: Seq(Rep(t1("h"), 1, 4), t1("ello")),
        results: [
            {t1: 'hello'},
            {t1: 'hhello'},
            {t1: 'hhhello'},
            {t1: 'hhhhello'},
        ],
    });

    testGrammar({
        desc: '9. Hello with 0-1 Hs: t1:h{0,1}+t1:ello',
        grammar: Seq(Rep(t1("h"), 0, 1), t1("ello")),
        results: [
            {t1: 'ello'},
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '9*. Hello with 0-1 Hs: Count_t1:5 t1:h*+t1:ello',
        grammar: Count({t1: 5},
                       Seq(Rep(t1("h")), t1("ello"))),
        results: [
            {t1: 'ello'},
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '10. Join t1:hhello ⨝ t1:h{1,4}+t1:ello',
        grammar: Join(t1("hhello"), Seq(Rep(t1("h"), 1, 4), t1("ello"))),
        results: [
            {t1: 'hhello'},
        ],
    });

    testGrammar({
        desc: '11. Join t1:h{1,4}+t1:ello ⨝ t1:hhello',
        grammar: Join(Seq(Rep(t1("h"), 1, 4), t1("ello")), t1("hhello")),
        results: [
            {t1: 'hhello'},
        ],
    });

    testGrammar({
        desc: '12. Join t1:h{1,4}+t1:ello ⨝ the same',
        grammar: Join(Seq(Rep(t1("h"), 1, 4), t1("ello")),
                      Seq(Rep(t1("h"), 1, 4), t1("ello"))),
        results: [
            {t1: 'hello'},
            {t1: 'hhello'},
            {t1: 'hhhello'},
            {t1: 'hhhhello'},
        ],
    });

    testGrammar({
        desc: '13. Join t1:h{1,4} + t2:world ⨝ the same',
        grammar: Join(Seq(Rep(t1("h"), 1, 4), t2("world")),
                      Seq(Rep(t1("h"), 1, 4), t2("world"))),
        results: [
            {t1: 'h', t2: 'world'},
            {t1: 'hh', t2: 'world'},
            {t1: 'hhh', t2: 'world'},
            {t1: 'hhhh', t2: 'world'},
        ],
    });

    testGrammar({
        desc: '14. Join t1:h{1,4}+t1:ello + t2:world ⨝ the same',
        grammar: Join(Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")),
                      Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world"))),
        results: [
            {t1: 'hello', t2: 'world'},
            {t1: 'hhello', t2: 'world'},
            {t1: 'hhhello', t2: 'world'},
            {t1: 'hhhhello', t2: 'world'},
        ],
    });

    testGrammar({
        desc: '15. Join t1:h{1,4} + t2:world + t1:ello ⨝ the same',
        grammar: Join(Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")),
                      Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello"))),
        results: [
            {t1: 'hello', t2: 'world'},
            {t1: 'hhello', t2: 'world'},
            {t1: 'hhhello', t2: 'world'},
            {t1: 'hhhhello', t2: 'world'},
        ],
    });

    testGrammar({
        desc: '18. Join t1:na{0,2} ⨝ ε',
        grammar: Join(Rep(t1("na"), 0, 2), Epsilon()),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '18*. Count_t1:4 Join t1:na* ⨝ ε',
        grammar: Count({t1: 4},
                 	   Join(Rep(t1("na")), Epsilon())),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '19. Join ε ⨝ t1:na{0,2}',
        grammar: Join(Epsilon(), Rep(t1("na"), 0, 2)),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '19*. Count_t1:4 Join ε ⨝ t1:na*',
        grammar: Count({t1: 4},
                 	   Join(Epsilon(), Rep(t1("na")))),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '20. t1:na{1,4}',
        grammar: Rep(t1("na"), 1, 4),
        results: [
            {t1: 'na'},
            {t1: 'nana'},
            {t1: 'nanana'},
            {t1: 'nananana'},
        ],
    });

    testGrammar({
        desc: '21. t1:na{0,2}',
        grammar: Rep(t1("na"), 0, 2),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '21*. Count_t1:4 t1:na*',
        grammar: Count({t1: 4},
                 	   Rep(t1("na"))),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '22. t1:na{0}',
        grammar: Rep(t1("na"), 0, 0),
        results: [
            {}
        ],
    });

    testGrammar({
        desc: '22*. Count_t1:0 t1:na*',
        grammar: Count({t1: 0},
                 	   Rep(t1("na"))),
        results: [
            {}
        ],
    });

    testGrammar({
        desc: '23. Repeat with min > max: t1:na{4,3}',
        grammar: Rep(t1("na"), 4, 3),
        results: [
        ],
    });

    testGrammar({
        desc: '24. Repeat with negative min: t1:na{-3,2}',
        grammar: Rep(t1("na"), -3, 2),
        results: [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ],
    });

    testGrammar({
        desc: '25. Repeat with 1-unlimited Os: Count_t1:5 t1:o+',
        grammar: Count({t1:5}, Rep(t1("o"), 1)),
        results: [
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
            {t1: 'ooooo'},
        ],
    });

    testGrammar({
        desc: '26*. Repeat with unlimited Os: Count_t1:5 t1:o*',
        grammar: Count({t1:5}, Rep(t1("o"))),
        results: [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
            {t1: 'ooooo'},
        ],
    });
    
    testGrammar({
        desc: '27*. Count_t1:6 (t1:h* + t1:i)',
        grammar: Count({t1:6}, Seq(Rep(t1("h")), t1("i"))),
        results: [
            {t1: 'i'},
            {t1: 'hi'},
            {t1: 'hhi'},
            {t1: 'hhhi'},
            {t1: 'hhhhi'},
            {t1: 'hhhhhi'},
        ],
    });
    
    testGrammar({
        desc: '28*. Count_t1:6 (t1:h + t1:i*)',
        grammar: Count({t1:6}, Seq(t1("h"), Rep(t1("i")))),
        results: [
            {t1: 'h'},
            {t1: 'hi'},
            {t1: 'hii'},
            {t1: 'hiii'},
            {t1: 'hiiii'},
            {t1: 'hiiiii'},
        ],
    });

    testGrammar({
        desc: '29*. Count_t1:6 (t1:h + t1:i)*',
        grammar: Count({t1:6}, Rep(Seq(t1("h"), t1("i")))),
        results: [
            {},
            {t1: 'hi'},
            {t1: 'hihi'},
            {t1: 'hihihi'},
        ],
    });

    testGrammar({
        desc: '30*. Count_t1:3 (t1:h + t2:i)*',
        grammar: Count({t1:3}, Rep(Seq(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ],
    });

    testGrammar({
        desc: '31a*. Count_t1:3_t2:3 (t1:h | t2:i)*',
        grammar: Count({t1:3,t2:3}, Rep(Uni(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h'},           {t1: 'hh'},           {t1: 'hhh'},
            {t1: 'h', t2:'i'},   {t1: 'h', t2:'ii'},   {t1: 'h', t2:'iii'},
            {t1: 'hh', t2:'i'},  {t1: 'hh', t2:'ii'},  {t1: 'hh', t2:'iii'},
            {t1: 'hhh', t2:'i'}, {t1: 'hhh', t2:'ii'}, {t1: 'hhh', t2:'iii'},
            {t2: 'i'},           {t2: 'ii'},           {t2: 'iii'},
        ],
    });

    testGrammar({
        desc: '31b*. Count_t1:1_t2:1 (t1:h | t2:i)*',
        grammar: Count({t1:1,t2:1}, Rep(Uni(t1("h"), t2("i")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'h', t2:'i'},
            {t2: 'i'},
        ],
    });

    testGrammar({
		desc: '31c-1. Count_t1:5 (ε|t1:h){0,5}',
        grammar: Count({t1:5},
                       Rep(Uni(Epsilon(), t1("h")), 0, 5)),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
            {t1: 'hhhhh'},
        ],
    });

    testGrammar({
		desc: '31c-2*. Count_t1:100ε Count_t1:5 (ε|t1:h)*',
        grammar: Count({t1:100},
                       Count({t1:5},
                             Rep(Uni(Epsilon(), t1("h")))),
                       true, true),    
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
            {t1: 'hhhhh'},
        ],
    });

    testGrammar({
		desc: '31c-3. Count_t1:100ε Count_t1:5 (ε|t1:h)+',
        grammar: Count({t1:100},
                       Count({t1:5},
                             Rep(Uni(Epsilon(), t1("h")), 1)),
                       true, true),    
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
            {t1: 'hhhhh'},
        ],
    });

    testGrammar({
        desc: '32*. Count_t1:2 (t1:a+t2:a | t1:b+t2:b)*',
        grammar: Count({t1:2}, 
                       Rep(Uni(Seq(t1("a"), t2("a")), 
                               Seq(t1("b"), t2("b"))))),
        results: [
            {},
            {t1: 'a', t2: 'a'},
            {t1: 'b', t2: 'b'},
            {t1: 'aa', t2: 'aa'},
            {t1: 'ab', t2: 'ab'},
            {t1: 'ba', t2: 'ba'},
            {t1: 'bb', t2: 'bb'},
        ],
    });

    testGrammar({
        desc: '35*. t1:h + ε*',
        grammar: Seq(t1("h"), Rep(Epsilon())),
        tapes: ['t1'],
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '36. (t1:h + t2:""){0,4}',
        grammar: Rep(Seq(t1("h"), t2("")), 0, 4),
        tapes: ['t1', 't2'],
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '36*. Count_t1:4 (t1:h + t2:"")*',
        grammar: Count({t1: 4},
                 	   Rep(Seq(t1("h"), t2("")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '37. (t2:"" + t1:h){0,4}',
        grammar: Rep(Seq(t2(""), t1("h")), 0, 4),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '37*. Count_t1:4 (t2:"" + t1:h)*',
        grammar: Count({t1: 4},
                 	   Rep(Seq(t2(""), t1("h")))),
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ],
    });

    testGrammar({
        desc: '38. Nested repetition: (t1:ba{1,2}){2,3}',
        grammar: Rep(Rep(t1("ba"), 1, 2), 2, 3),
        results: [
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    // The following tests explore nested, infinite and/or nullable repetition.

    testGrammar({
        desc: '38-1*. Nested repetition: Count_t1:12 (t1:ba{1,2})*',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba"), 1, 2)))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-2*. Nested repetition: Count_t1:12 (t1:ba*){2,3}',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                          Rep(Rep(t1("ba")), 2, 3))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-3. Nested repetition: (t1:ba{0,2}){0,3}',
        grammar: Rep(Rep(t1("ba"), 0, 2), 0, 3),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-4. Nested repetition: Count_t1:12 (t1:ba{0,2})+',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba"), 0, 2), 1))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-5*. Nested repetition: Count_t1:12 (t1:ba{0,2})*',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba"), 0, 2)))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-6*. Nested repetition: Count_t1:12 (t1:ba*){0,3}',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba")), 0, 3))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-7*. Nested repetition: Count_t1:12 (t1:ba*)+',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba")), 1))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-8*. Nested repetition: Count_t1:12 (t1:ba+)*',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba"), 1)))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-9*. Nested repetition: Count_t1:12 (Count_t1:2 t1:ba*)*',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Count({t1:2}, Rep(t1("ba")))))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-10*. Nested repetition: Count_t1:12 (t1:ba*)*',
        grammar: withCountGuard1(100,
                    Count({t1: 12},
                 	      Rep(Rep(t1("ba"))))),
        results: [
            {},
            {t1: 'ba'},
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ],
    });

    testGrammar({
        desc: '38-11*. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t1:a + t2:b*)*',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2:2},
                 	      Rep(Seq(t1("a"), Rep(t2("b")))))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
        ],
    });

    testGrammar({
        desc: '38-12*. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t2:b* + t1:a)*',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2:2},
                 	      Rep(Seq(Rep(t2("b")), t1("a"))))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
        ],
    });

    testGrammar({
        desc: '38-13*. Nested repetition (2 tapes): ' +
              'Count_t1:3 (t1:a + t2:""*)*',
        grammar: withCountGuard2(100,
                    Count({t1: 3},
                 	      Rep(Seq(t1("a"), Rep(t2("")))))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
        ],
    });

    testGrammar({
        desc: '38-14*. Nested repetition (2 tapes): ' +
              'Count_t1:3 (t2:""* + t1:a)*',
        grammar: withCountGuard2(100,
                    Count({t1: 3},
                 	      Rep(Seq(Rep(t2("")), t1("a"))))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
        ],
    });

    testGrammar({
        desc: '38-15*. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t1:a{0,1} + t2:b{0,1})*',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2: 2},
                 	      Rep(Seq(Rep(t1("a"), 0, 1), Rep(t2("b"), 0, 1))))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
            {t2: 'b'},
            {t2: 'bb'},
        ],
    });

    testGrammar({
        desc: '38-16*. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t1:a* + t2:b*)*',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2: 2},
                 	      Rep(Seq(Rep(t1("a")), Rep(t2("b")))))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
            {t2: 'b'},
            {t2: 'bb'},
        ],
    });

    testGrammar({
        desc: '38-17. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t1:a+ + t2:b+)+',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2: 2},
                 	      Rep(Seq(Rep(t1("a"), 1), Rep(t2("b"), 1)), 1))),
        results: [
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '38-18*. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t1:a+ + t2:b+)*',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2: 2},
                 	      Rep(Seq(Rep(t1("a"), 1), Rep(t2("b"), 1))))),
        results: [
            {},
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '38-19*. Nested repetition (2 tapes): ' +
              'Count_t1:3_t2:2 (t1:a* + t2:b*)+',
        grammar: withCountGuard2(100,
                    Count({t1: 3, t2: 2},
                 	      Rep(Seq(Rep(t1("a")), Rep(t2("b"))), 1))),
        results: [
            {},
            {t1: 'a'},
            {t1: 'aa'},
            {t1: 'aaa'},
            {t1: 'a', t2: 'b'},
            {t1: 'aa', t2: 'b'},
            {t1: 'aaa', t2: 'b'},
            {t1: 'a', t2: 'bb'},
            {t1: 'aa', t2: 'bb'},
            {t1: 'aaa', t2: 'bb'},
            {t2: 'b'},
            {t2: 'bb'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '39. (t1:h+t2:h){2}',
        grammar: Rep(Seq(t1("h"), t2("h")), 2, 2),
        results: [
            {t1: 'hh', t2: 'hh'},
        ],
    });

    testGrammar({
        desc: '44. Rep(Any): t1:hi + t1:.{0,3}',
        grammar: Seq(t1("hi"), Rep(Any("t1"), 0, 3)),
        results: [
            {t1: 'hi'},
            {t1: 'hii'},   {t1: 'hih'},
            {t1: 'hihh'},  {t1: 'hihi'},
            {t1: 'hiih'},  {t1: 'hiii'},
            {t1: 'hihhh'}, {t1: 'hihhi'},
            {t1: 'hihih'}, {t1: 'hihii'},
            {t1: 'hiihh'}, {t1: 'hiihi'},
            {t1: 'hiiih'}, {t1: 'hiiii'},
        ],
    });

    testGrammar({
        desc: '44*. Rep(Any): Count_t1:5 (t1:hi + t1:.*)',
        grammar: Count({t1: 5},
                 	   Seq(t1("hi"), Rep(Any("t1")))),
        results: [
            {t1: 'hi'},
            {t1: 'hii'},   {t1: 'hih'},
            {t1: 'hihh'},  {t1: 'hihi'},
            {t1: 'hiih'},  {t1: 'hiii'},
            {t1: 'hihhh'}, {t1: 'hihhi'},
            {t1: 'hihih'}, {t1: 'hihii'},
            {t1: 'hiihh'}, {t1: 'hiihi'},
            {t1: 'hiiih'}, {t1: 'hiiii'},
        ],
    });

    testGrammar({
        desc: '45. Rep(Any): t1:.{0,3} + t1:hi',
        grammar: Seq(Rep(Any("t1"), 0, 3), t1("hi")),
        results: [
            {t1: 'hi'},
            {t1: 'hhi'},   {t1: 'ihi'},
            {t1: 'hhhi'},  {t1: 'hihi'},
            {t1: 'ihhi'},  {t1: 'iihi'},
            {t1: 'hhhhi'}, {t1: 'hhihi'},
            {t1: 'hihhi'}, {t1: 'hiihi'},
            {t1: 'ihhhi'}, {t1: 'ihihi'},
            {t1: 'iihhi'}, {t1: 'iiihi'},
        ],
    });

    testGrammar({
        desc: '45*. Rep(Any): Count_t1:5 (t1:.* + t1:hi)',
        grammar: Count({t1: 5},
                 	   Seq(Rep(Any("t1")), t1("hi"))),
        results: [
            {t1: 'hi'},
            {t1: 'hhi'},   {t1: 'ihi'},
            {t1: 'hhhi'},  {t1: 'hihi'},
            {t1: 'ihhi'},  {t1: 'iihi'},
            {t1: 'hhhhi'}, {t1: 'hhihi'},
            {t1: 'hihhi'}, {t1: 'hiihi'},
            {t1: 'ihhhi'}, {t1: 'ihihi'},
            {t1: 'iihhi'}, {t1: 'iiihi'},
        ],
    });

    testGrammar({
        desc: '46. Rep(Any): t1:.{0,1} + t1:hi + t1:.{0,1}',
        grammar: Seq(Rep(Any("t1"), 0, 1),
                     t1("hi"),
                     Rep(Any("t1"), 0, 1)),
        results: [
            {t1: 'hi'},
            {t1: 'hih'},  {t1: 'hii'},
            {t1: 'hhi'},  {t1: 'ihi'},
            {t1: 'hhih'}, {t1: 'hhii'},
            {t1: 'ihih'}, {t1: 'ihii'},
        ],
    });

    testGrammar({
        desc: '46-1*. Rep(Any): (Count_t1:1 t1:.*) + t1:hi + (Count_t1:1 t1:.*)',
        grammar: Seq(Count({t1: 1}, Rep(Any("t1"))),
                     t1("hi"),
                     Count({t1: 1}, Rep(Any("t1")))),
        results: [
            {t1: 'hi'},
            {t1: 'hih'},  {t1: 'hii'},
            {t1: 'hhi'},  {t1: 'ihi'},
            {t1: 'hhih'}, {t1: 'hhii'},
            {t1: 'ihih'}, {t1: 'ihii'},
        ],
    });

    testGrammar({
        desc: '46-2*. Rep(Any): Count_t1:4 (t1:.* + t1:hi + t1:.*)',
        grammar: Count({t1: 4},
                 	   Seq(Rep(Any("t1")), t1("hi"), Rep(Any("t1")))),
        results: [
            {t1: 'hi'},
            {t1: 'hih'},  {t1: 'hii'},
            {t1: 'hhi'},  {t1: 'ihi'},
            {t1: 'hhih'}, {t1: 'hhii'},
            {t1: 'ihih'}, {t1: 'ihii'},
            {t1: 'hihh'}, {t1: 'hihi'},
            {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'hhhi'},
            {t1: 'ihhi'}, {t1: 'iihi'},
        ],
    });

    testGrammar({
        desc: '46-3. Rep(Any): Count_t1:2 t1:.{0,1} + t1:.{0,1} (vocab hi)',
        grammar: WithVocab({t1: "hi"},
        			Seq(Rep(Any("t1"), 0, 1),
                        Rep(Any("t1"), 0, 1))),
        results: [
            {},
            {t1: 'h'},  {t1: 'i'},
            {t1: 'hh'}, {t1: 'hi'},
            {t1: 'ih'}, {t1: 'ii'},
        ],
    });

    testGrammar({
        desc: '46-4*. Rep(Any): Count_t1:2 (t1:.* + t1:.{0,1}) (vocab hi)',
        grammar: WithVocab({t1: "hi"},
                    Count({t1: 2},
        				Seq(Rep(Any("t1")),
                            Rep(Any("t1"), 0, 1)))),
        results: [
            {},
            {t1: 'h'},  {t1: 'i'},
            {t1: 'hh'}, {t1: 'hi'},
            {t1: 'ih'}, {t1: 'ii'},
        ],
    });

    testGrammar({
        desc: '46-5*. Rep(Any): Count_t1:2 (t1:.{0,1} + t1:.*) (vocab hi)',
        grammar: WithVocab({t1: "hi"},
                    Count({t1: 2},
        				Seq(Rep(Any("t1"), 0, 1),
                            Rep(Any("t1"))))),
        results: [
            {},
            {t1: 'h'},  {t1: 'i'},
            {t1: 'hh'}, {t1: 'hi'},
            {t1: 'ih'}, {t1: 'ii'},
        ],
    });

    testGrammar({
        desc: '47. Join t1:h ⨝ t1:.{0,1}',
        grammar: Join(t1("h"), Rep(Any("t1"), 0, 1)),
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '47*. Join t1:h ⨝ t1:.*',
        grammar: Join(t1("h"), Rep(Any("t1"))),
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '50. Join t1:.{0,2} ⨝ ε',
        grammar: Join(Rep(Any("t1"), 0, 2), Epsilon()),
        results: [
            {}
        ],
    });

    testGrammar({
        desc: '50*. Join t1:.* ⨝ ε',
        grammar: Join(Rep(Any("t1")), Epsilon()),
        results: [
            {}
        ],
    });

    testGrammar({
        desc: '51. Join ε ⨝ t1:.{0,2}',
        grammar: Join(Epsilon(), Rep(Any("t1"), 0, 2)),
        results: [
            {}
        ],
    });

    testGrammar({
        desc: '51*. Join ε ⨝ t1:.*',
        grammar: Join(Epsilon(), Rep(Any("t1"))),
        results: [
            {}
        ],
    });

    // More joining of repeats

    testGrammar({
        desc: '58a. Join t1:a + t2:bbb ⨝ (t1:"" + t2:b){3} + t1:a',
        grammar: Join(Seq(t1("a"), t2("bbb")), 
                      Seq(Rep(Seq(t1(""), t2("b")), 3, 3), t1("a"))),
        results: [
            {t1: 'a', t2: 'bbb'},
        ],
    });

    testGrammar({
        desc: '58b. Join t1:a + t2:bbb ⨝ (t1:"" + t2:b){0,4} + t1:a',
        grammar: Join(Seq(t1("a"), t2("bbb")), 
                      Seq(Rep(Seq(t1(""), t2("b")), 0, 4), t1("a"))),
        results: [
            {t1: 'a', t2: 'bbb'},
        ],
    });

    testGrammar({
        desc: '58b*. Join t1:a + t2:bbb ⨝ (t1:"" + t2:b)* + t1:a',
        grammar: Join(Seq(t1("a"), t2("bbb")), 
                      Seq(Rep(Seq(t1(""), t2("b"))), t1("a"))),
        results: [
            {t1: 'a', t2: 'bbb'},
        ],
    });

    testGrammar({
        desc: '58c. Join (t1:"" + t2:b){3} + t1:a ⨝ t1:a + t2:bbb',
        grammar: Join(Seq(Rep(Seq(t1(""), t2("b")), 3, 3), t1("a")),
                      Seq(t1("a"), t2("bbb"))),
        results: [
            {t1: 'a', t2: 'bbb'},
        ],
    });

    testGrammar({
        desc: '58d. Join (t1:"" + t2:b){0,4} + t1:a ⨝ t1:a + t2:bbb',
        grammar: Join(Seq(Rep(Seq(t1(""), t2("b")), 0, 4), t1("a")),
                      Seq(t1("a"), t2("bbb"))),
        results: [
            {t1: 'a', t2: 'bbb'},
        ],
    });

    testGrammar({
        desc: '58d*. Join (t1:"" + t2:b)* + t1:a ⨝ t1:a + t2:bbb',
        grammar: Join(Seq(Rep(Seq(t1(""), t2("b"))), t1("a")),
                      Seq(t1("a"), t2("bbb"))),
        results: [
            {t1: 'a', t2: 'bbb'},
        ],
    });

    // Simple repeats involving multiple tapes, with state counting
   
    // 10 states
    testGrammar({
        desc: '59a. (t1:o+t2:hi){1,5}',
        grammar: Rep(Seq(t1("o"), t2("hi")), 1, 5),
        results: [
            {t1: "o".repeat(1), t2: "hi".repeat(1)},
            {t1: "o".repeat(2), t2: "hi".repeat(2)},
            {t1: "o".repeat(3), t2: "hi".repeat(3)},
            {t1: "o".repeat(4), t2: "hi".repeat(4)},
            {t1: "o".repeat(5), t2: "hi".repeat(5)},
        ],
        verbose: vb(VERBOSE_STATES),
   });

   // 10 states
    testGrammar({
        desc: '59a+. Count_t1:5 (t1:o+t2:hi)+',
        grammar: Count({t1: 5},
                       Rep(Seq(t1("o"), t2("hi")), 1)),
        results: [
            {t1: "o".repeat(1), t2: "hi".repeat(1)},
            {t1: "o".repeat(2), t2: "hi".repeat(2)},
            {t1: "o".repeat(3), t2: "hi".repeat(3)},
            {t1: "o".repeat(4), t2: "hi".repeat(4)},
            {t1: "o".repeat(5), t2: "hi".repeat(5)},
        ],
        verbose: vb(VERBOSE_STATES),
   });

    // 10 states
    testGrammar({
        desc: '59b. (t1:o+t2:hi){0,5}',
        grammar: Rep(Seq(t1("o"), t2("hi")), 0, 5),
        results: [
            {},
            {t1: "o".repeat(1), t2: "hi".repeat(1)},
            {t1: "o".repeat(2), t2: "hi".repeat(2)},
            {t1: "o".repeat(3), t2: "hi".repeat(3)},
            {t1: "o".repeat(4), t2: "hi".repeat(4)},
            {t1: "o".repeat(5), t2: "hi".repeat(5)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 10 states
    testGrammar({
        desc: '59b*. Count_t1:5 (t1:o+t2:hi)*',
        grammar: Count({t1: 5},
                       Rep(Seq(t1("o"), t2("hi")))),
        results: [
            {},
            {t1: "o".repeat(1), t2: "hi".repeat(1)},
            {t1: "o".repeat(2), t2: "hi".repeat(2)},
            {t1: "o".repeat(3), t2: "hi".repeat(3)},
            {t1: "o".repeat(4), t2: "hi".repeat(4)},
            {t1: "o".repeat(5), t2: "hi".repeat(5)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 10 states
    testGrammar({
        desc: '60a. (t1:no+t2:hi,){5}',
        grammar: Rep(Seq(t1("no"), t2("hi,")), 5, 5),
        results: [
            {t1: "no".repeat(5), t2: "hi,".repeat(5)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 10 states
    testGrammar({
        desc: '60b. (t1:no+t2:hello,){5}',
        grammar: Rep(Seq(t1("no"), t2("hello,")), 5, 5),
        results: [
            {t1: "no".repeat(5), t2: "hello,".repeat(5)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 20 states
    testGrammar({
        desc: '61a. (t1:no+t2:hello,){10}',
        grammar: Rep(Seq(t1("no"), t2("hello,")), 10, 10),
        results: [
            {t1: "no".repeat(10), t2: "hello,".repeat(10)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 20 states
    testGrammar({
        desc: '61b. ((t1:no+t2:hello,){5}){2}',
        grammar: Rep(Rep(Seq(t1("no"), t2("hello,")), 5, 5), 2, 2),
        results: [
            {t1: "no".repeat(10), t2: "hello,".repeat(10)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 20 states
    testGrammar({
        desc: '61c. ((t1:no+t2:hello,){2}){5}',
        grammar: Rep(Rep(Seq(t1("no"), t2("hello,")), 2, 2), 5, 5),
        results: [
            {t1: "no".repeat(10), t2: "hello,".repeat(10)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 50 states
    testGrammar({
        desc: '62a. (t1:no+t2:hello,){25}',
        grammar: Rep(Seq(t1("no"), t2("hello,")), 25, 25),
        results: [
            {t1: "no".repeat(25), t2: "hello,".repeat(25)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 50 states
    testGrammar({
        desc: '62b. ((t1:no+t2:hello,){5}){5}',
        grammar: Rep(Rep(Seq(t1("no"), t2("hello,")), 5, 5), 5, 5),
        results: [
            {t1: "no".repeat(25), t2: "hello,".repeat(25)},
        ],
        verbose: vb(VERBOSE_STATES),
   });
   
    // 50 states
    testGrammar({
        desc: '62c. ((t1:hello,+t2:no){5}){5}',
        grammar: Rep(Rep(Seq(t1("hello,"), t2("no")), 5, 5), 5, 5),
        results: [
            {t1: "hello,".repeat(25), t2: "no".repeat(25)},
        ],
        verbose: vb(VERBOSE_STATES),
   });

    // Repeats of nullable matches

    function nullableMatchGrammar(): Grammar {
        // returns M(t1>t2,ε|t1:h)
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = Match(fromGrammar, "t1", "t2");
        return matchGrammar;
    }

    function t2eNullableMatchGrammar(): Grammar {
        // returns t2:e + M(t1>t2,ε|t1:h)
        return Seq(t2("e"), nullableMatchGrammar());
    }

    function repeat2_t2eNullableMatchGrammar(): Grammar {
        // returns (t2:e + M(t1>t2,ε|t1:h)){2}
        return Rep(t2eNullableMatchGrammar(), 2, 2);
    }

    testGrammar({
        desc: '63. Count_t1:3_t2:3 (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    Count({t1: 3, t2: 3},
                        WithVocab({t1: "hx", t2: "hex"},
                              repeat2_t2eNullableMatchGrammar()))),
        tapes: ['t1', 't2'],
        vocab: {t1: 2, t2: 3},
        results: [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ],
    });

    testGrammar({
        desc: '63a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t2:ee (vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2_t2eNullableMatchGrammar(),
                             t2("ee")))),
        results: [
            {t2: 'ee'},
        ],
    });

    // skip
    testGrammar({
        desc: '63a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t1:h + t2:eeh ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2_t2eNullableMatchGrammar(),
                             Seq(t1("h"), t2("eeh"))))),
        results: [
            {t1: 'h', t2: 'eeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '63a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t1:h + t2:ehe ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2_t2eNullableMatchGrammar(),
                             Seq(t1("h"), t2("ehe"))))),
        results: [
            {t1: 'h', t2: 'ehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '63b-1. Join t2:ee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(t2("ee"),
                             repeat2_t2eNullableMatchGrammar()))),
        results: [
            {t2: 'ee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '63b-2. Join t1:h + t2:eeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("h"), t2("eeh")),
                             repeat2_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'h', t2: 'eeh'},
        ],
    });

    // skip
    testGrammar({
        desc: '63b-3. Join t1:h + t2:ehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("h"), t2("ehe")),
                             repeat2_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'h', t2: 'ehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '64. Count_t1:3_t2:3 (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)',
        grammar: Cursor(["t2", "t1"],
                    Count({t1: 3, t2: 3},
                        WithVocab({t1: "hx", t2: "hex"},
                            Seq(repeat2_t2eNullableMatchGrammar(), t1("x"))))),
        results: [
            {t1: 'x', t2: 'ee'},
            {t1: 'hx', t2: 'ehe'},
            {t1: 'hx', t2: 'eeh'},
        ],
    });

    // skip
    testGrammar({
        desc: '64a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:x + t2:ee ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(), t1("x")),
                             Seq(t1("x"), t2("ee"))))),
        results: [
            {t1: 'x', t2: 'ee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '64a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:hx + t2:eeh ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(), t1("x")),
                             Seq(t1("hx"), t2("eeh"))))),
        results: [
            {t1: 'hx', t2: 'eeh'},
        ],
    });

    // skip
    testGrammar({
        desc: '64a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:hx + t2:ehe ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(), t1("x")),
                             Seq(t1("hx"), t2("ehe"))))),
        results: [
            {t1: 'hx', t2: 'ehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '64b-1. Join t1:x + t2:ee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("x"), t2("ee")),
                             Seq(repeat2_t2eNullableMatchGrammar(), t1("x"))))),
        results: [
            {t1: 'x', t2: 'ee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '64b-2. Join t1:hx + t2:eeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("hx"), t2("eeh")),
                             Seq(repeat2_t2eNullableMatchGrammar(), t1("x"))))),
        results: [
            {t1: 'hx', t2: 'eeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '64b-3. Join t1:hx + t2:ehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("hx"), t2("ehe")),
                             Seq(repeat2_t2eNullableMatchGrammar(), t1("x"))))),
        results: [
            {t1: 'hx', t2: 'ehe'},
        ],
    });

    testGrammar({
        desc: '65. Count_t1:4_t2:4 (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)',
        grammar: Cursor(["t2", "t1"],
                    Count({t1: 4, t2: 4},
                        WithVocab({t1: "hx", t2: "hex"},
                            Seq(repeat2_t2eNullableMatchGrammar(), t2("x"))))),
        results: [
            {t2: 'eex'},
            {t1: 'h', t2: 'ehex'},
            {t1: 'h', t2: 'eehx'},
        ],
    });

    // skip
    testGrammar({
        desc: '65a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t2:eex ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(), t2("x")),
                             t2("eex")))),
        results: [
            {t2: 'eex'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '65a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t1:h + t2:eehx ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(), t2("x")),
                             Seq(t1("h"), t2("eehx"))))),
        results: [
            {t1: 'h', t2: 'eehx'},
        ],
    });

    // skip
    testGrammar({
        desc: '65a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t1:h + t2:ehex ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(), t2("x")),
                             Seq(t1("h"), t2("ehex"))))),
        results: [
            {t1: 'h', t2: 'ehex'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '65b-1. Join t2:eex ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(t2("eex"),
                             Seq(repeat2_t2eNullableMatchGrammar(), t2("x"))))),
        results: [
            {t2: 'eex'},
        ],
    });

    // skip
    testGrammar({
        desc: '65b-2. Join t1:h + t2:eehx ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("h"), t2("eehx")),
                             Seq(repeat2_t2eNullableMatchGrammar(), t2("x"))))),
        results: [
            {t1: 'h', t2: 'eehx'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '65b-3. Join t1:h + t2:ehex ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
             '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("h"), t2("ehex")),
                             Seq(repeat2_t2eNullableMatchGrammar(), t2("x"))))),
        results: [
            {t1: 'h', t2: 'ehex'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '66. Count_t1:2_t2:6 (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)',
        grammar: Cursor(["t2", "t1"],
                    Count({t1: 2, t2: 6},
                        WithVocab({t1: "hx", t2: "hex"},
                            Seq(repeat2_t2eNullableMatchGrammar(),
                                repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'}, {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'}, {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'}, {t1: 'hh', t2: 'ehehee'},
        ],
    });

    // skip
    testGrammar({
        desc: '66a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t2:eeee ' + 
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar()),
                             t2("eeee")))),
        results: [
            {t2: 'eeee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '66a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t1:hh + t2:eeheeh ' + 
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar()),
                             Seq(t1("hh"), t2("eeheeh"))))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '66a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t1:hh + t2:eheehe ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar()),
                             Seq(t1("hh"), t2("eheehe"))))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
    });

    testGrammar({
        desc: '66a-4*. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t2:ee)* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar()),
                             Rep(t2("ee"))))),
        results: [
            {t2: 'eeee'},
        ],
    });

    // skip
    testGrammar({
        desc: '66a-5*. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t1:h+t2:eeh)* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar()),
                             Rep(Seq(t1("h"), t2("eeh")))))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '66a-6*. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t1:h+t2:ehe)* ' + 
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar()),
                             Rep(Seq(t1("h"), t2("ehe")))))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '66b-1. Join t2:eeee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' + 
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(t2("eeee"),
                             Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t2: 'eeee'},
        ],
    });

    // skip
    testGrammar({
        desc: '66b-2. Join t1:hh + t2:eeheeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' + 
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("hh"), t2("eeheeh")),
                             Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '66b-3. Join t1:hh + t2:eheehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Seq(t1("hh"), t2("eheehe")),
                             Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '66b-4*. Join (t2:ee)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' + 
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(t2("ee")),
                             Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t2: 'eeee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '66b-5*. Join (t1:h+t2:eeh)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("eeh"))),
                             Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
    });

    // skip
    testGrammar({
        desc: '66b-6*. Join (t1:h+t2:ehe)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("ehe"))),
                             Seq(repeat2_t2eNullableMatchGrammar(),
                                 repeat2_t2eNullableMatchGrammar())))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    function repeat2_2_t2eNullableMatchGrammar(): Grammar {
        // returns ((t2:e+M(t1>t2,ε|t1:h)){2}){2}
        return Rep(Rep(t2eNullableMatchGrammar(), 2, 2), 2, 2);
    }

    testGrammar({
        desc: '67. Count_t1:2_t2:6 ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)',
        grammar: Cursor(["t2", "t1"],
                    Count({t1: 2, t2: 6},
                        WithVocab({t1: "hx", t2: "hex"},
                            repeat2_2_t2eNullableMatchGrammar()))),
        results: [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'}, {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'}, {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'}, {t1: 'hh', t2: 'ehehee'},
        ],
    });

    // skip
    testGrammar({
        desc: '67a-1*. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t2:ee)* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2_2_t2eNullableMatchGrammar(),
                             Rep(t2("ee"))))),
        results: [
            {t2: 'eeee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '67a-2*. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t1:h+t2:eeh)* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2_2_t2eNullableMatchGrammar(),
                             Rep(Seq(t1("h"), t2("eeh")))))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
    });

    // skip
    testGrammar({
        desc: '67a-3*. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t1:h+t2:ehe)* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2_2_t2eNullableMatchGrammar(),
                             Rep(Seq(t1("h"), t2("ehe")))))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '67b-1*. Join (t2:ee)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(t2("ee")),
                             repeat2_2_t2eNullableMatchGrammar()))),
        results: [
            {t2: 'eeee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '67b-2*. Join (t1:h+t2:eeh)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("eeh"))),
                             repeat2_2_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '67b-3*. Join (t1:h+t2:ehe)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("ehe"))),
                             repeat2_2_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
    });

    function repeat2Star_t2eNullableMatchGrammar(): Grammar {
        // returns ((t2:e + M(t1>t2,ε|t1:h)){2})*
        return Rep(Rep(t2eNullableMatchGrammar(), 2, 2));
    }

    testGrammar({
        desc: '68*. ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)',
        grammar: Cursor(["t2", "t1"],
                    Count({t1: 2, t2: 6},
                        WithVocab({t1: "hx", t2: "hex"},
                            repeat2Star_t2eNullableMatchGrammar()))),
        results: [
            {},
            {t2: 'ee'},
            {t2: 'eeee'},
            {t2: 'eeeeee'},
            {t1: 'h', t2: 'eeh'},     {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eheh'},   {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'}, {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'}, {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ],
    });

    testGrammar({
        desc: '68a-1*. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t2:ee){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2Star_t2eNullableMatchGrammar(),
                             Rep(t2("ee"), 2, 2)))),
        results: [
            {t2: 'eeee'},
        ],
    });

    // skip
    testGrammar({
        desc: '68a-2*. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:eeh){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2Star_t2eNullableMatchGrammar(),
                             Rep(Seq(t1("h"), t2("eeh")), 2, 2)))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '68a-3*. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:ehe){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeat2Star_t2eNullableMatchGrammar(),
                             Rep(Seq(t1("h"), t2("ehe")), 2, 2)))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '68b-1*. Join (t2:ee){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(t2("ee"), 2, 2),
                             repeat2Star_t2eNullableMatchGrammar()))),
        results: [
            {t2: 'eeee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '68b-2*. Join (t1:h+t2:eeh){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("eeh")), 2, 2),
                             repeat2Star_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
    });

    // skip
    testGrammar({
        desc: '68b-3*. Join (t1:h+t2:ehe){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("ehe")), 2, 2),
                             repeat2Star_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    function repeatStar2_t2eNullableMatchGrammar(): Grammar {
        // returns ((t2:e + M(t1>t2,ε|t1:h))*){2}
        return Rep(Rep(t2eNullableMatchGrammar()), 2, 2);
    }

    testGrammar({
        desc: '69*. ((t2:e+M(t1>t2,ε|t1:h))*){2} (vocab hx/hex)',
        grammar: Cursor(["t2", "t1"],
                    Count({t1: 2, t2: 6},
                        WithVocab({t1: "hx", t2: "hex"},
                              repeatStar2_t2eNullableMatchGrammar()))),
        results: [
            {},
            {t2: 'e'},     {t2: 'ee'},    {t2: 'eee'},
            {t2: 'eeee'},  {t2: 'eeeee'}, {t2: 'eeeeee'},
            {t1: 'h', t2: 'eh'},      {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehe'},     {t1: 'h', t2: 'eeeh'},
            {t1: 'h', t2: 'eehe'},    {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'h', t2: 'eeeeeh'},  {t1: 'h', t2: 'eeeehe'},
            {t1: 'h', t2: 'eeehee'},  {t1: 'h', t2: 'eeheee'},
            {t1: 'h', t2: 'eheeee'},  {t1: 'hh', t2: 'eheh'},
            {t1: 'hh', t2: 'eeheh'},  {t1: 'hh', t2: 'eheeh'},
            {t1: 'hh', t2: 'ehehe'},  {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'}, {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'}, {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ],
        allowDuplicateOutputs: true,
    });

    // skip
    testGrammar({
        desc: '69a-1*. Join ((t2:e+M(t1>t2,ε|t1:h))*){2} ⨝ (t2:ee){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeatStar2_t2eNullableMatchGrammar(),
                             Rep(t2("ee"), 2, 2)))),
        results: [
            {t2: 'eeee'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '69a-2*. Join ((t2:e+M(t1>t2,ε|t1:h))*){2} ⨝ (t1:h+t2:eeh){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeatStar2_t2eNullableMatchGrammar(),
                             Rep(Seq(t1("h"), t2("eeh")), 2, 2)))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    testGrammar({
        desc: '69a-3*. Join ((t2:e+M(t1>t2,ε|t1:h))*){2} ⨝ (t1:h+t2:ehe){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(repeatStar2_t2eNullableMatchGrammar(),
                             Rep(Seq(t1("h"), t2("ehe")), 2, 2)))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
    });

    testGrammar({
        desc: '69b-1*. Join (t2:ee){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(t2("ee"), 2, 2),
                             repeatStar2_t2eNullableMatchGrammar()))),
        results: [
            {t2: 'eeee'},
        ],
    });

    // skip
    testGrammar({
        desc: '69b-2*. Join (t1:h+t2:eeh){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("eeh")), 2, 2),
                             repeatStar2_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'hh', t2: 'eeheeh'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // skip
    testGrammar({
        desc: '69b-3*. Join (t1:h+t2:ehe){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    WithVocab({t1: "hx", t2: "hex"},
                        Join(Rep(Seq(t1("h"), t2("ehe")), 2, 2),
                             repeatStar2_t2eNullableMatchGrammar()))),
        results: [
            {t1: 'hh', t2: 'eheehe'},
        ],
        skipGeneration: SKIP_GENERATION,
    });

    // Testing sequences of simple repeats of nullable matches

    testGrammar({
        desc: '70a. (t2:e+M(t1>t2,ε|t1:h)){4} (vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    Count({t1: 10, t2: 10},
                        WithVocab({t1: "hx", t2: "hex"},
                            Rep(t2eNullableMatchGrammar(), 4, 4)))),
        results: [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},     {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},     {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'},   {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},   {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},   {t1: 'hh', t2: 'ehehee'},
            {t1: 'hhh', t2: 'eeheheh'}, {t1: 'hhh', t2: 'eheeheh'},
            {t1: 'hhh', t2: 'eheheeh'}, {t1: 'hhh', t2: 'ehehehe'},
            {t1: 'hhhh', t2: 'eheheheh'},
        ],
    });

    testGrammar({
        desc: '70b. (t2:e+M(t1>t2,ε|t1:h)){2} + (t2:e+M(t1>t2,ε|t1:h)){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    Count({t1: 10, t2: 10},
                        WithVocab({t1: "hx", t2: "hex"},
                            Seq(Rep(t2eNullableMatchGrammar(), 2, 2),
                                Rep(t2eNullableMatchGrammar(), 2, 2))))),
        results: [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},     {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},     {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'},   {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},   {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},   {t1: 'hh', t2: 'ehehee'},
            {t1: 'hhh', t2: 'eeheheh'}, {t1: 'hhh', t2: 'eheeheh'},
            {t1: 'hhh', t2: 'eheheeh'}, {t1: 'hhh', t2: 'ehehehe'},
            {t1: 'hhhh', t2: 'eheheheh'},
        ],
    });

    function t2xNullableMatchGrammar(): Grammar {
        // returns t2:x + M(t1>t2,ε|t1:h)
        return Seq(t2("x"), nullableMatchGrammar());
    }

    testGrammar({
        desc: '70c. (t2:e+M(t1>t2,ε|t1:h)){2} + (t2:x+M(t1>t2,ε|t1:h)){2} ' +
              '(vocab hx/hex)',
        grammar: Cursor(["t1", "t2"],
                    Count({t1: 10, t2: 10},
                        WithVocab({t1: "hx", t2: "hex"},
                            Seq(Rep(t2eNullableMatchGrammar(), 2, 2),
                                Rep(t2xNullableMatchGrammar(), 2, 2))))),
        results: [
            {t2: 'eexx'},
            {t1: 'h', t2: 'eexxh'},     {t1: 'h', t2: 'eexhx'},
            {t1: 'h', t2: 'eehxx'},     {t1: 'h', t2: 'ehexx'},
            {t1: 'hh', t2: 'eexhxh'},   {t1: 'hh', t2: 'eehxxh'},
            {t1: 'hh', t2: 'eehxhx'},   {t1: 'hh', t2: 'ehexxh'},
            {t1: 'hh', t2: 'ehexhx'},   {t1: 'hh', t2: 'ehehxx'},
            {t1: 'hhh', t2: 'eehxhxh'}, {t1: 'hhh', t2: 'ehexhxh'},
            {t1: 'hhh', t2: 'ehehxxh'}, {t1: 'hhh', t2: 'ehehxhx'},
            {t1: 'hhhh', t2: 'ehehxhxh'},
        ],
    });

});
