import { 
    Count, Dot, Join, Not, 
    Rep, Seq, Short, Uni, 
    Vocab,
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';
import { Options } from "../../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const OPT = new Options(); // default options

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Short(t1:h)',
        grammar: Short(t1("h")),
        tapes: ['t1'],
        vocab: {t1:1},
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '2. Short(t1:h|t1:hh)',
        grammar: Short(Uni(t1("h"), t1("hh"))),
        tapes: ['t1'],
        vocab: {t1:1},
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '3. Short(t1:h*)',
        grammar: Short(Rep(t1("h"))),
        tapes: ['t1'],
        vocab: {t1:1},
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '4. Short(t1:h+)',
        grammar: Short(Rep(t1("h"), 1, Infinity)),
        tapes: ['t1'],
        vocab: {t1:1},
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '5. Short(t1:h{2,})',
        grammar: Short(Rep(t1("h"), 2, Infinity)),
        tapes: ['t1'],
        vocab: {t1:1},
        results: [
            {t1: 'hh'},
        ],
    });

    testGrammar({
        desc: '6. Short(t1:.+) (vocab t1:hi)',
        grammar: Vocab({t1:'hi'},
                     Short(Rep(Dot("t1"), 1, Infinity))),
        tapes: ['t1'],
        vocab: {t1:2},
        results: [
            {t1: 'h'}, 
            {t1: 'i'},
        ],
    });

    if (OPT.directionLTR) {

        // these are all expressed in a way only consistent with
        // LTR generation.  At some point we should go through and
        // write RTL ones too

        testGrammar({
            desc: '7. Short(t1:h|hi|hello|goo|goodbye|golf)',
            grammar: Short(Uni(t1("h"), t1("hi"), t1("hello"),
                               t1("goo"), t1("goodbye"), t1("golf"))),
            tapes: ['t1'],
            vocab: {t1:10},
            results: [
                {t1: 'h'},
                {t1: 'goo'},
                {t1: 'golf'},
            ],
        });

        testGrammar({
            desc: '8. Short(t1:.*i) (vocab t1:hi)',
            grammar: Count({t1:4},
        		         Vocab({t1:'hi'},
                 	         Short(Seq(Rep(Dot("t1")), t1("i"))))),
            tapes: ['t1'],
            vocab: {t1:2},
            results: [
                {t1: 'i'}, 
                {t1: 'hi'},
                {t1: 'hhi'},
                {t1: 'hhhi'},
            ],
        });

        testGrammar({
            desc: '9. Contains at least one i: ' +
                  'Short(t1:.*i) + t1.* (vocab t1:hi)',
            grammar: Count({t1:4},
        		         Vocab({t1:'hi'},
                 	         Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                 Rep(Dot("t1"))))),
            tapes: ['t1'],
            vocab: {t1:2},
            results: [
                {t1: 'hi'},   {t1: 'hhi'},
                {t1: 'hih'},  {t1: 'hii'},
                {t1: 'hhhi'}, {t1: 'hhih'},
                {t1: 'hhii'}, {t1: 'hihh'},
                {t1: 'hihi'}, {t1: 'hiih'},
                {t1: 'hiii'},
                {t1: 'i'},    {t1: 'ih'},
                {t1: 'ii'},   {t1: 'ihh'},
                {t1: 'ihi'},  {t1: 'iih'},
                {t1: 'iii'},  {t1: 'ihhh'},
                {t1: 'ihhi'}, {t1: 'ihih'},
                {t1: 'ihii'}, {t1: 'iihh'},
                {t1: 'iihi'}, {t1: 'iiih'},
                {t1: 'iiii'},
            ],
        });

        testGrammar({
            desc: '10. Does not contain any i: ' +
                  '~(Short(t1:.*i) + t1:.*) (vocab t1:hi)',
            grammar: Count({t1:4},
        		         Vocab({t1:'hi'},
                 	         Not(Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                     Rep(Dot("t1")))))),
            tapes: ['t1'],
            vocab: {t1:2},
            results: [
                {},
                {t1: 'h'},
                {t1: 'hh'},
                {t1: 'hhh'},
                {t1: 'hhhh'},
            ],
        });

        testGrammar({
            desc: '11a. t1:abcdef ⨝ not-contain(t1:i): ' +
                  't1:abcdef ⨝ ~(Short(t1:.*i) + t1:.*) (vocab t1:hi)',
            grammar: Vocab({t1:'hi'},
                         Join(t1("abcdef"),
                              Not(Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                      Rep(Dot("t1")))))),
            tapes: ['t1'],
            vocab: {t1:8},
            results: [
                {t1: 'abcdef'},
            ],
        });

        testGrammar({
            desc: '11b. not-contain(t1:i) ⨝ t1:abcdef: ' +
                  '~(Short(t1:.*i) + t1:.*) ⨝ t1:abcdef (vocab t1:hi)',
            grammar: Vocab({t1:'hi'},
                         Join(Not(Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                      Rep(Dot("t1")))),
                              t1("abcdef"))),
            tapes: ['t1'],
            vocab: {t1:8},
            results: [
                {t1: 'abcdef'},
            ],
        });

        testGrammar({
            desc: '12a. t1:abcdef ⨝ not-contain(t1:b): ' +
                  't1:abcdef ⨝ ~(Short(t1:.*b) + t1:.*)',
            grammar: Join(t1("abcdef"),
                          Not(Seq(Short(Seq(Rep(Dot("t1")), t1("b"))),
                                  Rep(Dot("t1"))))),
            tapes: ['t1'],
            vocab: {t1:6},
            results: [],
        });

        testGrammar({
            desc: '12b. not-contain(t1:b) ⨝ t1:abcdef: ' +
                  '~(Short(t1:.*b) + t1:.*) ⨝ t1:abcdef',
            grammar: Join(Not(Seq(Short(Seq(Rep(Dot("t1")), t1("b"))),
                                  Rep(Dot("t1")))),
                          t1("abcdef")),
            tapes: ['t1'],
            vocab: {t1:6},
            results: [],
        });
    }

});
