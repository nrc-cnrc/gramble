import { 
    Count, Dot, Join, Not, 
    Rep, Seq, Short, Uni, 
    WithVocab,
} from "../../interpreter/src/grammarConvenience.js";

import {
    grammarTestSuiteName,
    testGrammar,
    t1,
} from "./testGrammarUtil.js";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil.js';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Short(t1:h)',
        grammar: Short(t1("h")),
        tapes: ['t1'],
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '2. Short(t1:h|t1:hh)',
        grammar: Short(Uni(t1("h"), t1("hh"))),
        tapes: ['t1'],
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '3. Short(t1:h*)',
        grammar: Short(Rep(t1("h"))),
        tapes: ['t1'],
        vocab: {t1: [..."h"]},
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '4. Short(t1:h+)',
        grammar: Short(Rep(t1("h"), 1, Infinity)),
        tapes: ['t1'],
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
        desc: '5. Short(t1:h{2,})',
        grammar: Short(Rep(t1("h"), 2, Infinity)),
        tapes: ['t1'],
        vocab: {t1: [..."h"]},
        results: [
            {t1: 'hh'},
        ],
    });

    testGrammar({
        desc: '6. Short(t1:.+) (vocab t1:hi)',
        grammar: WithVocab({t1:'hi'},
                     Short(Rep(Dot("t1"), 1, Infinity))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'h'}, 
            {t1: 'i'},
        ],
    });

    // these are all expressed in a way only consistent with
    // LTR generation.  At some point we should go through and
    // write RTL ones too

    testGrammar({
        desc: '7-ltr. Short(t1:h|hi|hello|goo|goodbye|golf)',
        grammar: Short(Uni(t1("h"), t1("hi"), t1("hello"),
                           t1("goo"), t1("goodbye"), t1("golf"))),
        tapes: ['t1'],
        vocab: {t1: [..."hielogdbyf"]},
        results: [
            {t1: 'h'},
            {t1: 'goo'},
            {t1: 'golf'},
        ],
        directionLTR: true
    });

    testGrammar({
        desc: '8-ltr. Short(t1:.*i) (vocab t1:hi)',
        grammar: Count({t1:4},
                    WithVocab({t1:'hi'},
                        Short(Seq(Rep(Dot("t1")), t1("i"))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'i'}, 
            {t1: 'hi'},
            {t1: 'hhi'},
            {t1: 'hhhi'},
        ],
        directionLTR: true
    });

    testGrammar({
        desc: '9-ltr. Contains at least one i: ' +
                'Short(t1:.*i) + t1.* (vocab t1:hi)',
        grammar: Count({t1:4},
                    WithVocab({t1:'hi'},
                        Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                            Rep(Dot("t1"))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
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
        directionLTR: true
    });

    testGrammar({
        desc: '10-ltr. Does not contain any i: ' +
                '~(Short(t1:.*i) + t1:.*) (vocab t1:hi)',
        grammar: Count({t1:4},
                    WithVocab({t1:'hi'},
                        Not(Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                Rep(Dot("t1")))))),
        tapes: ['t1'],
        vocab: {t1: [..."hi"]},
        results: [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ],
        directionLTR: true
    });

    testGrammar({
        desc: '11a-ltr. t1:abcdef ⨝ not-contain(t1:i): ' +
                't1:abcdef ⨝ ~(Short(t1:.*i) + t1:.*) (vocab t1:hi)',
        grammar: WithVocab({t1:'hi'},
                    Join(t1("abcdef"),
                        Not(Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                Rep(Dot("t1")))))),
        tapes: ['t1'],
        vocab: {t1: [..."abcdefhi"]},
        results: [
            {t1: 'abcdef'},
        ],
        directionLTR: true
    });

    testGrammar({
        desc: '11b-ltr. not-contain(t1:i) ⨝ t1:abcdef: ' +
                '~(Short(t1:.*i) + t1:.*) ⨝ t1:abcdef (vocab t1:hi)',
        grammar: WithVocab({t1:'hi'},
                    Join(Not(Seq(Short(Seq(Rep(Dot("t1")), t1("i"))),
                                Rep(Dot("t1")))),
                        t1("abcdef"))),
        tapes: ['t1'],
        vocab: {t1: [..."abcdefhi"]},
        results: [
            {t1: 'abcdef'},
        ],
        directionLTR: true
    });

    testGrammar({
        desc: '12a-ltr. t1:abcdef ⨝ not-contain(t1:b): ' +
                't1:abcdef ⨝ ~(Short(t1:.*b) + t1:.*)',
        grammar: Join(t1("abcdef"),
                    Not(Seq(Short(Seq(Rep(Dot("t1")), t1("b"))),
                            Rep(Dot("t1"))))),
        tapes: ['t1'],
        vocab: {t1: [..."abcdef"]},
        results: [],
        directionLTR: true
    });

    testGrammar({
        desc: '12b-ltr. not-contain(t1:b) ⨝ t1:abcdef: ' +
                '~(Short(t1:.*b) + t1:.*) ⨝ t1:abcdef',
        grammar: Join(Not(Seq(Short(Seq(Rep(Dot("t1")), t1("b"))),
                              Rep(Dot("t1")))),
                      t1("abcdef")),
        tapes: ['t1'],
        vocab: {t1: [..."abcdef"]},
        results: [],
        directionLTR: true
    });

});
