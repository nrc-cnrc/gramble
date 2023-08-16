import { 
    Any,
    Count,
    Epsilon,
    Join,
    MatchFrom,
    Not,
    Query,
    Rep,
    Seq,
    Uni,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t4,
    withVocab,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
    generateOutputsFromGrammar,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    // Negated MatchFrom tests with one to-tape.

    testGrammar({
        desc: '1. ~(MatchFrom t1>t2, t1:hi)',
        grammar: Count({t1:2, t2:2},
                     Not(
                         MatchFrom(
        		 	 	     t1("hi"),
        		 	 	     "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2},
                        Not(Query([
                            {t1: 'hi', t2: 'hi'},
                        ])))),
    });

    testGrammar({
        desc: '2. ~(MatchFrom t1>t2, ε) (vocab hi)',
        grammar: Count({t1:2, t2:2},
                     withVocab({t1:'hi', t2:'hi'},
                         Not(
                             MatchFrom(
                                 Epsilon(),
        		 	 	         "t1", "t2"
        )                ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2},
                         withVocab({t1:'hi', t2:'hi'},
                             Not(Query([
                                 {t1: '', t2: ''},
                             ]))))),
    });

    testGrammar({
        desc: '3. ~(MatchFrom t1>t2, t1:h + t1:i)',
        grammar: Count({t1:2, t2:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(t1("h"), t1("i")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2},
                         Not(Query([
                             {t1: 'hi', t2: 'hi'},
                         ])))),
    });

    testGrammar({
        desc: '4. ~(MatchFrom t1>t2, t1:hi + t4:g)',
        grammar: Count({t1:2, t2:2, t4:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(t1("hi"), t4("g")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1:2, t2:2, t4:1},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2, t4:2},
                        Not(Query([
                            {t1: 'hi', t2: 'hi', t4: 'g'},
                        ])))),
   });

    testGrammar({
        desc: '5. ~(MatchFrom t1>t2, t4:g + t1:hi)',
        grammar: Count({t1:2, t2:2, t4:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(t4("g"), t1("hi")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1:2, t2:2, t4:1},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2, t4:2},
                         Not(Query([
                             {t1: 'hi', t2: 'hi', t4: 'g'},
                         ])))),
    });

    testGrammar({
        desc: '6. ~(MatchFrom t1>t2, (t1:h+t1:,) + t1:w) w/ nested seq',
        grammar: Count({t1:2, t2:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(Seq(t1("h"), t1(",")), t1("w")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2},
                        Not(Query([
                            {t1: 'h,w', t2: 'h,w'},
                        ])))),
    });

    testGrammar({
        desc: '7. ~(MatchFrom t1>t2, t1:hi | t1:hh)',
        grammar: Count({t1:3, t2:3},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Uni(t1("hi"), t1("hh")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:3, t2:3},
                         Not(Query([
                             {t1: 'hi', t2: 'hi'},
                             {t1: 'hh', t2: 'hh'},
                         ])))),
    });

    testGrammar({
        desc: '8. ~(MatchFrom t1>t2, t1:hi | t4:g)',
        grammar: Count({t1:2, t2:2, t4:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Uni(t1("hi"), t4("g")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1:2, t2:2, t4:1},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2, t4:2},
                         Not(Query([
                             {t1: 'hi', t2: 'hi'},
                             {t4: 'g'},
                         ])))),
   });

    testGrammar({
        desc: '9. ~(MatchFrom t1>t2 t4:g | t1:hi)',
        grammar: Count({t1:2, t2:2, t4:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Uni(t4("g"), t1("hi")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1:2, t2:2, t4:1},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2, t4:2},
                         Not(Query([
                             {t1: 'hi', t2: 'hi'},
                             {t4: 'g'},
                         ])))),
    });

    testGrammar({
        desc: '10. ~(MatchFrom t1>t2, (t1:h|t1:g) + (t1:k|t1:w))',
        grammar: Count({t1:2, t2:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(Uni(t1("h"), t1("g")),
                                 Uni(t1("k"), t1("w"))),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:4, t2:4},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2},
                         Not(Query([
                             {t1: 'hk', t2: 'hk'},
                             {t1: 'gk', t2: 'gk'},
                             {t1: 'hw', t2: 'hw'},
                             {t1: 'gw', t2: 'gw'},
                         ])))),
    });

    testGrammar({
        desc: '11. ~(MatchFrom t1>t2, (t1:h+t1:k) | (t1:g+t1:w))',
        grammar: Count({t1:2, t2:2},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Uni(Seq(t1("h"), t1("k")),
                                 Seq(t1("g"), t1("w"))),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:4, t2:4},
        results: generateOutputsFromGrammar(
                     Count({t1:2, t2:2},
                         Not(Query([
                            {t1: 'hk', t2: 'hk'},
                            {t1: 'gw', t2: 'gw'},
                         ])))),
    });

    testGrammar({
        desc: '12. ~(MatchFrom t1>t2, t1:hi + t1:.)',
        grammar: Count({t1:3, t2:3},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(t1("hi"), Any("t1")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:3, t2:3},
                         Not(Query([
                             {t1: 'hih', t2: 'hih'},
                             {t1: 'hii', t2: 'hii'},
                         ])))),
    });

    testGrammar({
        desc: '13. ~(MatchFrom t1>t2, t1:o{0,1})',
        grammar: Count({t1:3, t2:3},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Rep(t1("o"), 0, 1),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:1, t2:1},
        results: generateOutputsFromGrammar(
                     Count({t1:3, t2:3},
                         Not(Query([
                             {t1: '',  t2: ''},
                             {t1: 'o', t2: 'o'},
                         ])))),
    });

    // Checking the results for this test takes a long time. (>500ms)
    testGrammar({
        desc: '14. ~(MatchFrom t1>t2, (t1:h{1,2} + t4:g + t1:i) ⨝ <same>)',
        grammar: Count({t1:3, t2:3, t4:3},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Join(Seq(Rep(t1("h"), 1, 2), t4("g"), t1("i")),
                                  Seq(Rep(t1("h"), 1, 2), t4("g"), t1("i"))),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1:2, t2:2, t4:1},
        results: generateOutputsFromGrammar(
                     Count({t1:3, t2:3, t4:3},
                         Not(Query([
                             {t1: 'hi',  t2: 'hi',  t4: 'g'},
                             {t1: 'hhi', t2: 'hhi', t4: 'g'},
                        ])))),
    });

    // Checking the results for this test takes a long time. (>500ms)
    testGrammar({
        desc: '15. ~(MatchFrom t1>t2 (t4:g + t1:h{1,2} + t1:i) ⨝ <same>)',
        grammar: Count({t1:3, t2:3, t4:3},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Join(Seq(t4("g"), Rep(t1("h"), 1, 2), t1("i")),
                                  Seq(t4("g"), Rep(t1("h"), 1, 2), t1("i"))),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2', 't4'],
        vocab: {t1:2, t2:2, t4:1},
        results: generateOutputsFromGrammar(
                     Count({t1:3, t2:3, t4:3},
                         Not(Query([
                             {t1: 'hi',  t2: 'hi',  t4: 'g'},
                             {t1: 'hhi', t2: 'hhi', t4: 'g'},
                         ])))),
    });

    // Checking the results for this test takes a long time. (>500ms)
    testGrammar({
        desc: '16. ~(MatchFrom t1>t2, t1:na{1,2})',
        grammar: Count({t1:4, t2:4},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Rep(t1("na"), 1, 2),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:4, t2:4},
                         Not(Query([
                            {t1: 'na',   t2: 'na'},
                            {t1: 'nana', t2: 'nana'},
                        ])))),
    });

    testGrammar({
        desc: '17. ~(MatchFrom t1>t2, t1:.{0}) (vocab hi)',
        grammar: Count({t1:3, t2:3},
                     withVocab({t1:'hi', t2:'hi'},
                         Not(
                         	 MatchFrom(
        		 	     	 	 Rep(Any("t1"), 0, 0),
        		 	     	 	 "t1", "t2"
                         )))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:3, t2:3},
                        withVocab({t1:'hi', t2:'hi'},
                             Not(Query([
                                 {t1:'', t2:''},
                             ]))))),
    });

    // Checking the results for this test takes a long time. (>500ms)
    testGrammar({
        desc: '18. ~(MatchFrom t1>t2, t1:.{0,2} + t1:hi)',
        grammar: Count({t1:4, t2:4},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(Rep(Any("t1"), 0, 2), t1("hi")),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:4, t2:4},
                         Not(Query([
                             {t1: 'hi',   t2: 'hi'},
                             {t1: 'hhi',  t2: 'hhi'},
                             {t1: 'ihi',  t2: 'ihi'},
                             {t1: 'hhhi', t2: 'hhhi'},
                             {t1: 'hihi', t2: 'hihi'},
                             {t1: 'ihhi', t2: 'ihhi'},
                             {t1: 'iihi', t2: 'iihi'},
                         ])))),
    });

    // Checking the results for this test takes a long time. (>500ms)
    testGrammar({
        desc: '19. ~(MatchFrom t1>t2, t1:.{0,1} + t1:hi + t1:.{0,1})',
        grammar: Count({t1:4, t2:4},
                     Not(
                     	 MatchFrom(
        		 	 	 	 Seq(Rep(Any("t1"), 0, 1),
                                 t1("hi"),
                                 Rep(Any("t1"), 0, 1)),
        		 	 	 	 "t1", "t2"
                     ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: generateOutputsFromGrammar(
                     Count({t1:4, t2:4},
                         Not(Query([
                            {t1: 'hi',   t2: 'hi'},
                            {t1: 'hhi',  t2: 'hhi'},
                            {t1: 'ihi',  t2: 'ihi'},
                            {t1: 'hih',  t2: 'hih'},
                            {t1: 'hii',  t2: 'hii'},
                            {t1: 'hhih', t2: 'hhih'},
                            {t1: 'hhii', t2: 'hhii'},
                            {t1: 'ihih', t2: 'ihih'},
                            {t1: 'ihii', t2: 'ihii'},
                        ])))),
    });

});
