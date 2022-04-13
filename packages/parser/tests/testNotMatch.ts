import { 
    Grammar, 
    Epsilon, 
    Any,
    Join,
    MatchFrom,
    Not,
    Seq, 
    Rep, 
    Uni, 
    Vocab
} from "../src/grammars";

import { 
    t1, t2, t3, t4,
    testHasTapes, 
    testHasVocab, 
    //testHasNoVocab,  
    testGrammar,
    generateOutputsFromGrammar,
} from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";

const DUMMY_SYMBOL: string = "";
const DEF_MAX_RECURSION: number = 4;

describe(`${path.basename(module.filename)}`, function() {

    // Negated MatchFrom tests with two tapes.

    // Note: for two tapes, (e.g. t1 & t2), each with a vocab size of 2 (e.g. hi),
    // the total number of possible results (including {}) is as follows:
    //  maxchars=5: 129
    //  maxchars=7: 769
    //  maxchars=9: 4097

    describe.skip('1a. MatchFrom(t1>t2, t1:hi)', function() {
        const grammar1: Grammar = t1("hi");
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe.skip('1b. Negation of 1a results: ~(t1:hi+t2:hi)', function() {
        const grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), Infinity);
        const expectedResults: StringDict[] = [
            {t1: 'h'  , t2: 'h'  }, {t1: 'h', t2: 'hh'},  {t1: 'h', t2: 'hhh'},
            {t1: 'h'  , t2: 'hhi'}, {t1: 'h', t2: 'hi'},  {t1: 'h', t2: 'hih'},
            {t1: 'h'  , t2: 'hii'}, {t1: 'h', t2: 'i'},   {t1: 'h', t2: 'ih'},
            {t1: 'h'  , t2: 'ihh'}, {t1: 'h', t2: 'ihi'}, {t1: 'h', t2: 'ii'},
            {t1: 'h'  , t2: 'iih'}, {t1: 'h', t2: 'iii'}, {t1: 'hh', t2: 'h'},
            {t1: 'hh' , t2: 'hh' }, {t1: 'hh', t2: 'hi'}, {t1: 'hh', t2: 'i'},
            {t1: 'hh' , t2: 'ih' }, {t1: 'hh', t2: 'ii'}, {t1: 'hhh', t2: 'h'},
            {t1: 'hhh', t2: 'i'  }, {t1: 'hhi', t2: 'h'}, {t1: 'hhi', t2: 'i'},
            {t1: 'hi' , t2: 'h'  }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
            {t1: 'hi' , t2: 'ih' }, {t1: 'hi', t2: 'ii'}, {t1: 'hih', t2: 'h'},
            {t1: 'hih', t2: 'i'  }, {t1: 'hii', t2: 'h'}, {t1: 'hii', t2: 'i'},
            {t1: 'i'  , t2: 'h'  }, {t1: 'i', t2: 'hh'},  {t1: 'i', t2: 'hhh'},
            {t1: 'i'  , t2: 'hhi'}, {t1: 'i', t2: 'hi'},  {t1: 'i', t2: 'hih'},
            {t1: 'i'  , t2: 'hii'}, {t1: 'i', t2: 'i'},   {t1: 'i', t2: 'ih'},
            {t1: 'i'  , t2: 'ihh'}, {t1: 'i', t2: 'ihi'}, {t1: 'i', t2: 'ii'},
            {t1: 'i'  , t2: 'iih'}, {t1: 'i', t2: 'iii'}, {t1: 'ih', t2: 'h'},
            {t1: 'ih' , t2: 'hh' }, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
            {t1: 'ih' , t2: 'ih' }, {t1: 'ih', t2: 'ii'}, {t1: 'ihh', t2: 'h'},
            {t1: 'ihh', t2: 'i'  }, {t1: 'ihi', t2: 'h'}, {t1: 'ihi', t2: 'i'},
            {t1: 'ii' , t2: 'h'  }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
            {t1: 'ii' , t2: 'i'  }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
            {t1: 'iih', t2: 'h'  }, {t1: 'iih', t2: 'i'}, {t1: 'iii', t2: 'h'},
            {t1: 'iii', t2: 'i'  },
            {t1: 'h'   }, {t1: 'hh'  }, {t1: 'hhh' }, {t1: 'hhhh'}, {t1: 'hhhi'},
            {t1: 'hhi' }, {t1: 'hhih'}, {t1: 'hhii'}, {t1: 'hi'  }, {t1: 'hih' },
            {t1: 'hihh'}, {t1: 'hihi'}, {t1: 'hii' }, {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'i'   }, {t1: 'ih'  }, {t1: 'ihh' }, {t1: 'ihhh'}, {t1: 'ihhi'},
            {t1: 'ihi' }, {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'ii'  }, {t1: 'iih' },
            {t1: 'iihh'}, {t1: 'iihi'}, {t1: 'iii' }, {t1: 'iiih'}, {t1: 'iiii'},
            {t2: 'h'   }, {t2: 'hh'  }, {t2: 'hhh' }, {t2: 'hhhh'}, {t2: 'hhhi'},
            {t2: 'hhi' }, {t2: 'hhih'}, {t2: 'hhii'}, {t2: 'hi'  }, {t2: 'hih' },
            {t2: 'hihh'}, {t2: 'hihi'}, {t2: 'hii' }, {t2: 'hiih'}, {t2: 'hiii'},
            {t2: 'i'   }, {t2: 'ih'  }, {t2: 'ihh' }, {t2: 'ihhh'}, {t2: 'ihhi'},
            {t2: 'ihi' }, {t2: 'ihih'}, {t2: 'ihii'}, {t2: 'ii'  }, {t2: 'iih' },
            {t2: 'iihh'}, {t2: 'iihi'}, {t2: 'iii' }, {t2: 'iiih'}, {t2: 'iiii'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    // Test 1b-1 illustrates that Negation yields the same outputs when 
    // Not.maxChars == testGrammar.maxChars-1 as when Not.maxChars == Infinity.
    describe.skip('1b-1. Negation of 1a results: ~(t1:hi+t2:hi, 4)', function() {
        const grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 4);
        const expectedResults: StringDict[] = [
            {t1: 'h'  , t2: 'h'  }, {t1: 'h', t2: 'hh'},  {t1: 'h', t2: 'hhh'},
            {t1: 'h'  , t2: 'hhi'}, {t1: 'h', t2: 'hi'},  {t1: 'h', t2: 'hih'},
            {t1: 'h'  , t2: 'hii'}, {t1: 'h', t2: 'i'},   {t1: 'h', t2: 'ih'},
            {t1: 'h'  , t2: 'ihh'}, {t1: 'h', t2: 'ihi'}, {t1: 'h', t2: 'ii'},
            {t1: 'h'  , t2: 'iih'}, {t1: 'h', t2: 'iii'}, {t1: 'hh', t2: 'h'},
            {t1: 'hh' , t2: 'hh' }, {t1: 'hh', t2: 'hi'}, {t1: 'hh', t2: 'i'},
            {t1: 'hh' , t2: 'ih' }, {t1: 'hh', t2: 'ii'}, {t1: 'hhh', t2: 'h'},
            {t1: 'hhh', t2: 'i'  }, {t1: 'hhi', t2: 'h'}, {t1: 'hhi', t2: 'i'},
            {t1: 'hi' , t2: 'h'  }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
            {t1: 'hi' , t2: 'ih' }, {t1: 'hi', t2: 'ii'}, {t1: 'hih', t2: 'h'},
            {t1: 'hih', t2: 'i'  }, {t1: 'hii', t2: 'h'}, {t1: 'hii', t2: 'i'},
            {t1: 'i'  , t2: 'h'  }, {t1: 'i', t2: 'hh'},  {t1: 'i', t2: 'hhh'},
            {t1: 'i'  , t2: 'hhi'}, {t1: 'i', t2: 'hi'},  {t1: 'i', t2: 'hih'},
            {t1: 'i'  , t2: 'hii'}, {t1: 'i', t2: 'i'},   {t1: 'i', t2: 'ih'},
            {t1: 'i'  , t2: 'ihh'}, {t1: 'i', t2: 'ihi'}, {t1: 'i', t2: 'ii'},
            {t1: 'i'  , t2: 'iih'}, {t1: 'i', t2: 'iii'}, {t1: 'ih', t2: 'h'},
            {t1: 'ih' , t2: 'hh' }, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
            {t1: 'ih' , t2: 'ih' }, {t1: 'ih', t2: 'ii'}, {t1: 'ihh', t2: 'h'},
            {t1: 'ihh', t2: 'i'  }, {t1: 'ihi', t2: 'h'}, {t1: 'ihi', t2: 'i'},
            {t1: 'ii' , t2: 'h'  }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
            {t1: 'ii' , t2: 'i'  }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
            {t1: 'iih', t2: 'h'  }, {t1: 'iih', t2: 'i'}, {t1: 'iii', t2: 'h'},
            {t1: 'iii', t2: 'i'  },
            {t1: 'h'   }, {t1: 'hh'  }, {t1: 'hhh' }, {t1: 'hhhh'}, {t1: 'hhhi'},
            {t1: 'hhi' }, {t1: 'hhih'}, {t1: 'hhii'}, {t1: 'hi'  }, {t1: 'hih' },
            {t1: 'hihh'}, {t1: 'hihi'}, {t1: 'hii' }, {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'i'   }, {t1: 'ih'  }, {t1: 'ihh' }, {t1: 'ihhh'}, {t1: 'ihhi'},
            {t1: 'ihi' }, {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'ii'  }, {t1: 'iih' },
            {t1: 'iihh'}, {t1: 'iihi'}, {t1: 'iii' }, {t1: 'iiih'}, {t1: 'iiii'},
            {t2: 'h'   }, {t2: 'hh'  }, {t2: 'hhh' }, {t2: 'hhhh'}, {t2: 'hhhi'},
            {t2: 'hhi' }, {t2: 'hhih'}, {t2: 'hhii'}, {t2: 'hi'  }, {t2: 'hih' },
            {t2: 'hihh'}, {t2: 'hihi'}, {t2: 'hii' }, {t2: 'hiih'}, {t2: 'hiii'},
            {t2: 'i'   }, {t2: 'ih'  }, {t2: 'ihh' }, {t2: 'ihhh'}, {t2: 'ihhi'},
            {t2: 'ihi' }, {t2: 'ihih'}, {t2: 'ihii'}, {t2: 'ii'  }, {t2: 'iih' },
            {t2: 'iihh'}, {t2: 'iihi'}, {t2: 'iii' }, {t2: 'iiih'}, {t2: 'iiii'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    // Tests 1b-2 to 1b-4 illustrate how Negation works when
    // Not.maxChars < testGrammar.maxChars-1
    describe.skip('1b-2. Negation of 1a results: ~(t1:hi+t2:hi, 3)', function() {
        const grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 3);
        const expectedResults: StringDict[] = [
            {t1: 'h' , t2: 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h', t2: 'hi'},
            {t1: 'h' , t2: 'i' }, {t1: 'h' , t2: 'ih'}, {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'h' }, {t1: 'hh', t2: 'i' }, {t1: 'hi', t2: 'h'},
            {t1: 'hi', t2: 'i' }, {t1: 'i' , t2: 'h' }, {t1: 'i', t2: 'hh'},
            {t1: 'i' , t2: 'hi'}, {t1: 'i' , t2: 'i' }, {t1: 'i', t2: 'ih'},
            {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'h' }, {t1: 'ih', t2: 'i'},
            {t1: 'ii', t2: 'h' }, {t1: 'ii', t2: 'i' },
            {t1: 'h'  }, {t1: 'hh' }, {t1: 'hhh'}, {t1: 'hhi'}, {t1: 'hi'},
            {t1: 'hih'}, {t1: 'hii'}, {t1: 'i'  }, {t1: 'ih' }, {t1: 'ihh'},
            {t1: 'ihi'}, {t1: 'ii' }, {t1: 'iih'}, {t1: 'iii'},
            {t2: 'h'  }, {t2: 'hh' }, {t2: 'hhh'}, {t2: 'hhi'}, {t2: 'hi'},
            {t2: 'hih'}, {t2: 'hii'}, {t2: 'i'  }, {t2: 'ih' }, {t2: 'ihh'},
            {t2: 'ihi'}, {t2: 'ii' }, {t2: 'iih'}, {t2: 'iii'},
            {},
            // The following results should not be generated, but are, because
            // of the way constructUniverse is done in NegationExpr.concreteDeriv
            // (line 1787 atm).
            {t1: 'hh' , t2: 'hh'}, {t1: 'hh' , t2: 'hi'}, {t1: 'hh', t2: 'ih'},
            {t1: 'hh' , t2: 'ii'}, {t1: 'hhh', t2: 'h' }, {t1: 'hhh', t2: 'i'},
            {t1: 'hi' , t2: 'hh'}, {t1: 'hi' , t2: 'ih'}, {t1: 'hih', t2: 'h'},
            {t1: 'hih', t2: 'i' }, {t1: 'ih' , t2: 'hh'}, {t1: 'ih', t2: 'hi'},
            {t1: 'ih' , t2: 'ih'}, {t1: 'ih' , t2: 'ii'}, {t1: 'ihh', t2: 'h'},
            {t1: 'ihh', t2: 'i' }, {t1: 'ii' , t2: 'hh'}, {t1: 'ii', t2: 'ih'},
            {t1: 'iih', t2: 'h' }, {t1: 'iih', t2: 'i' },
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe.skip('1b-3. Negation of 1a results: ~(t1:hi+t2:hi, 2)', function() {
        const grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 2);
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'}, {t1: 'h', t2: 'i'},
            {t1: 'i', t2: 'h'}, {t1: 'i', t2: 'i'},
            {t1: 'h' }, {t1: 'i' }, {t1: 'hh'},
            {t1: 'hi'}, {t1: 'ih'}, {t1: 'ii'},
            {t2: 'h' }, {t2: 'i' }, {t2: 'hh'},
            {t2: 'hi'}, {t2: 'ih'}, {t2: 'ii'},
            {},
            // The following results should not be generated, but are, because
            // of the way constructUniverse is done in NegationExpr.concreteDeriv
            // (line 1787 atm).
            {t1: 'hh', t2: 'h'}, {t1: 'hh', t2: 'i'},
            {t1: 'ih', t2: 'h'}, {t1: 'ih', t2: 'i'},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe.skip('1b-4. Negation of 1a results: ~(t1:hi+t2:hi, 1)', function() {
        const grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 1);
        const expectedResults: StringDict[] = [
            {t1: 'h'}, {t1: 'i'}, {t2: 'i'}, {t2: 'h'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('1. ~(MatchFrom(t1>t2,t1:hi))', function() {
        const grammar1: Grammar = t1("hi");
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"), Infinity);
        const resultsGrammar = Not(Seq(t1("hi"), t2("hi")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe.skip('2a. MatchFrom(t1>t2,ε) (vocab hi)', function() {
        const grammar1: Grammar = Epsilon();
        const grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     MatchFrom(grammar1, "t1", "t2"));
        const expectedResults: StringDict[] = [
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 3);
    });

    describe.skip('2b. Negation of 2a results: ~() (vocab hi)', function() {
        const grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     Not(Epsilon()));
        const expectedResults: StringDict[] = [
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 3);
    });

    describe('2. ~(MatchFrom(t1>t2,ε)) (vocab hi)', function() {
        const grammar1: Grammar = Epsilon();
        const grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     Not(MatchFrom(grammar1, "t1", "t2")));
        const expectedResults: StringDict[] = [
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 3);
    });

    describe('3. ~(MatchFrom(t1>t2,t1:h+t1:i))', function() {
        const grammar1: Grammar = Seq(t1("h"), t1("i"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Seq(t1("hi"), t2("hi")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('4. ~(MatchFrom(t1>t2,t1:hi+t4:g))', function() {
        const grammar1: Grammar = Seq(t1("h"), t4("g"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Seq(t1("h"), t2("h"), t4("gg")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 1, t2: 1, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('5. ~(MatchFrom(t1>t2,t4:g+t1:hi))', function() {
        const grammar1: Grammar = Seq(t4("g"), t1("h"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Seq(t1("h"), t2("h"), t4("gg")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 1, t2: 1, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    // Checking the results for this test takes a long time.
    describe.skip('6. ~(MatchFrom(t1>t2,(t1:h+t1:,)+t1:w)) w/ nested seq', function() {
        const grammar1: Grammar = Seq(Seq(t1("h"), t1(",")), t1("w"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Seq(t1("h,w"), t2("h,w")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    describe.skip('7a. MatchFrom(t1>t2,t1:hi|t1:hh)', function() {
        const grammar1: Grammar = Uni(t1("hi"), t1("hh"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
            {t1: 'hh', t2: 'hh'},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe.skip('7b. Negation of 7a results: ~((t1:hi+t2:hi)|(t1:hh+t2:hh))', function() {
        const grammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                         Seq(t1("hh"), t2("hh"))));
        const expectedResults: StringDict[] = [
            {t1: 'h'  , t2: 'h'  }, {t1: 'h', t2: 'hh'}, {t1: 'h', t2: 'hhh'},
            {t1: 'h'  , t2: 'hhi'}, {t1: 'h', t2: 'hi'}, {t1: 'h', t2: 'hih'},
            {t1: 'h'  , t2: 'hii'}, {t1: 'h', t2: 'i'}, {t1: 'h', t2: 'ih'},
            {t1: 'h'  , t2: 'ihh'}, {t1: 'h', t2: 'ihi'}, {t1: 'h', t2: 'ii'},
            {t1: 'h'  , t2: 'iih'}, {t1: 'h', t2: 'iii'}, {t1: 'hh', t2: 'h'},
            {t1: 'hh' , t2: 'hi' }, {t1: 'hh', t2: 'i'}, {t1: 'hh', t2: 'ih'},
            {t1: 'hh' , t2: 'ii' }, {t1: 'hhh', t2: 'h'}, {t1: 'hhh', t2: 'i'},
            {t1: 'hhi', t2: 'h'  }, {t1: 'hhi', t2: 'i'}, {t1: 'hi', t2: 'h'},
            {t1: 'hi' , t2: 'hh' }, {t1: 'hi', t2: 'i'}, {t1: 'hi', t2: 'ih'},
            {t1: 'hi' , t2: 'ii' }, {t1: 'hih', t2: 'h'}, {t1: 'hih', t2: 'i'},
            {t1: 'hii', t2: 'h'  }, {t1: 'hii', t2: 'i'},
            {t1: 'i'  , t2: 'h'  }, {t1: 'i', t2: 'hh'}, {t1: 'i', t2: 'hhh'},
            {t1: 'i'  , t2: 'hhi'}, {t1: 'i', t2: 'hi'}, {t1: 'i', t2: 'hih'},
            {t1: 'i'  , t2: 'hii'}, {t1: 'i', t2: 'i'}, {t1: 'i', t2: 'ih'},
            {t1: 'i'  , t2: 'ihh'}, {t1: 'i', t2: 'ihi'}, {t1: 'i', t2: 'ii'},
            {t1: 'i'  , t2: 'iih'}, {t1: 'i', t2: 'iii'}, {t1: 'ih', t2: 'h'},
            {t1: 'ih' , t2: 'hh' }, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
            {t1: 'ih' , t2: 'ih' }, {t1: 'ih', t2: 'ii'}, {t1: 'ihh', t2: 'h'},
            {t1: 'ihh', t2: 'i'  }, {t1: 'ihi', t2: 'h'}, {t1: 'ihi', t2: 'i'},
            {t1: 'ii' , t2: 'h'  }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
            {t1: 'ii' , t2: 'i'  }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
            {t1: 'iih', t2: 'h'  }, {t1: 'iih', t2: 'i'}, {t1: 'iii', t2: 'h'},
            {t1: 'iii', t2: 'i'  },
            {t1: 'h'   }, {t1: 'hh'  }, {t1: 'hhh' }, {t1: 'hhhh'}, {t1: 'hhhi'},
            {t1: 'hhi' }, {t1: 'hhih'}, {t1: 'hhii'}, {t1: 'hi'  }, {t1: 'hih' },
            {t1: 'hihh'}, {t1: 'hihi'}, {t1: 'hii' }, {t1: 'hiih'}, {t1: 'hiii'},
            {t1: 'i'   }, {t1: 'ih'  }, {t1: 'ihh' }, {t1: 'ihhh'}, {t1: 'ihhi'},
            {t1: 'ihi' }, {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'ii'  }, {t1: 'iih' },
            {t1: 'iihh'}, {t1: 'iihi'}, {t1: 'iii' }, {t1: 'iiih'}, {t1: 'iiii'},
            {t2: 'h'   }, {t2: 'hh'  }, {t2: 'hhh' }, {t2: 'hhhh'}, {t2: 'hhhi'},
            {t2: 'hhi' }, {t2: 'hhih'}, {t2: 'hhii'}, {t2: 'hi'  }, {t2: 'hih' },
            {t2: 'hihh'}, {t2: 'hihi'}, {t2: 'hii' }, {t2: 'hiih'}, {t2: 'hiii'},
            {t2: 'i'   }, {t2: 'ih'  }, {t2: 'ihh' }, {t2: 'ihhh'}, {t2: 'ihhi'},
            {t2: 'ihi' }, {t2: 'ihih'}, {t2: 'ihii'}, {t2: 'ii'  }, {t2: 'iih' },
            {t2: 'iihh'}, {t2: 'iihi'}, {t2: 'iii' }, {t2: 'iiih'}, {t2: 'iiii'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('7. ~(MatchFrom(t1>t2,t1:hi|t1:hh))', function() {
        const grammar1: Grammar = Uni(t1("hi"), t1("hh"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                       Seq(t1("hh"), t2("hh"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    // 8a. MatchFrom t1, t2, t1:hi|t4:g
    describe.skip('8a. MatchFrom(t1>t2,t1:hi|t4:g)', function() {
        const grammar1: Grammar = Uni(t1("hi"), t4("g"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
            {t4: 'gg'},
        ];
        // testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe.skip('8b. Negation of 8a results: ~((t1:hi+t2:hi)|(t4:gg))', function() {
        const grammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")), t4("gg")));
        const expectedResults: StringDict[] = [
            {t1: 'h' , t2: 'h' , t4: 'g'}, {t1: 'h' , t2: 'h' , t4: 'gg'}, {t1: 'h' , t2: 'hh', t4: 'g' },
            {t1: 'h' , t2: 'hi', t4: 'g'}, {t1: 'h' , t2: 'i' , t4: 'g' }, {t1: 'h' , t2: 'i' , t4: 'gg'},
            {t1: 'h' , t2: 'ih', t4: 'g'}, {t1: 'h' , t2: 'ii', t4: 'g' }, {t1: 'hh', t2: 'h' , t4: 'g' },
            {t1: 'hh', t2: 'i' , t4: 'g'}, {t1: 'hi', t2: 'h' , t4: 'g' }, {t1: 'hi', t2: 'i' , t4: 'g' },
            {t1: 'i' , t2: 'h' , t4: 'g'}, {t1: 'i' , t2: 'h' , t4: 'gg'}, {t1: 'i' , t2: 'hh', t4: 'g' },
            {t1: 'i' , t2: 'hi', t4: 'g'}, {t1: 'i' , t2: 'i' , t4: 'g' }, {t1: 'i' , t2: 'i' , t4: 'gg'},
            {t1: 'i' , t2: 'ih', t4: 'g'}, {t1: 'i' , t2: 'ii', t4: 'g' }, {t1: 'ih', t2: 'h' , t4: 'g' },
            {t1: 'ih', t2: 'i' , t4: 'g'}, {t1: 'ii', t2: 'h' , t4: 'g' }, {t1: 'ii', t2: 'i' , t4: 'g' },
            {t1: 'h'   , t2: 'h'   }, {t1: 'h'   , t2: 'hh'  }, {t1: 'h'   , t2: 'hhh' }, {t1: 'h', t2: 'hhi'},
            {t1: 'h'   , t2: 'hi'  }, {t1: 'h'   , t2: 'hih' }, {t1: 'h'   , t2: 'hii' }, {t1: 'h', t2: 'i'},
            {t1: 'h'   , t2: 'ih'  }, {t1: 'h'   , t2: 'ihh' }, {t1: 'h'   , t2: 'ihi' }, {t1: 'h', t2: 'ii'},
            {t1: 'h'   , t2: 'iih' }, {t1: 'h'   , t2: 'iii' }, {t1: 'hh'  , t2: 'h'   }, {t1: 'hh', t2: 'hh'},
            {t1: 'hh'  , t2: 'hi'  }, {t1: 'hh'  , t2: 'i'   }, {t1: 'hh'  , t2: 'ih'  }, {t1: 'hh', t2: 'ii'},
            {t1: 'hhh' , t2: 'h'   }, {t1: 'hhh' , t2: 'i'   }, {t1: 'hhi' , t2: 'h'   }, {t1: 'hhi', t2: 'i'},
            {t1: 'hi'  , t2: 'h'   }, {t1: 'hi'  , t2: 'hh'  }, {t1: 'hi'  , t2: 'i'   }, {t1: 'hi', t2: 'ih'},
            {t1: 'hi'  , t2: 'ii'  }, {t1: 'hih' , t2: 'h'   }, {t1: 'hih' , t2: 'i'   }, {t1: 'hii', t2: 'h'},
            {t1: 'hii' , t2: 'i'   }, {t1: 'i'   , t2: 'h'   }, {t1: 'i'   , t2: 'hh'  }, {t1: 'i', t2: 'hhh'},
            {t1: 'i'   , t2: 'hhi' }, {t1: 'i'   , t2: 'hi'  }, {t1: 'i'   , t2: 'hih' }, {t1: 'i', t2: 'hii'},
            {t1: 'i'   , t2: 'i'   }, {t1: 'i'   , t2: 'ih'  }, {t1: 'i'   , t2: 'ihh' }, {t1: 'i', t2: 'ihi'},
            {t1: 'i'   , t2: 'ii'  }, {t1: 'i'   , t2: 'iih' }, {t1: 'i'   , t2: 'iii' }, {t1: 'ih', t2: 'h'},
            {t1: 'ih'  , t2: 'hh'  }, {t1: 'ih'  , t2: 'hi'  }, {t1: 'ih'  , t2: 'i'   }, {t1: 'ih', t2: 'ih'},
            {t1: 'ih'  , t2: 'ii'  }, {t1: 'ihh' , t2: 'h'   }, {t1: 'ihh' , t2: 'i'   }, {t1: 'ihi', t2: 'h'},
            {t1: 'ihi' , t2: 'i'   }, {t1: 'ii'  , t2: 'h'   }, {t1: 'ii'  , t2: 'hh'  }, {t1: 'ii', t2: 'hi'},
            {t1: 'ii'  , t2: 'i'   }, {t1: 'ii'  , t2: 'ih'  }, {t1: 'ii'  , t2: 'ii'  }, {t1: 'iih', t2: 'h'},
            {t1: 'iih' , t2: 'i'   }, {t1: 'iii' , t2: 'h'   }, {t1: 'iii' , t2: 'i'   },
            {t1: 'h'   , t4: 'g'  }, {t1: 'h'   , t4: 'gg'  }, {t1: 'h'  , t4: 'ggg'}, {t1: 'hh', t4: 'g' },
            {t1: 'hh'  , t4: 'gg' }, {t1: 'hhh' , t4: 'g'   }, {t1: 'hhi', t4: 'g'  }, {t1: 'hi', t4: 'g' },
            {t1: 'hi'  , t4: 'gg' }, {t1: 'hih' , t4: 'g'   }, {t1: 'hii', t4: 'g'  }, {t1: 'i' , t4: 'g' },
            {t1: 'i'   , t4: 'gg' }, {t1: 'i'   , t4: 'ggg' }, {t1: 'ih' , t4: 'g'  }, {t1: 'ih', t4: 'gg'},
            {t1: 'ihh' , t4: 'g'  }, {t1: 'ihi' , t4: 'g'   }, {t1: 'ii' , t4: 'g'  }, {t1: 'ii', t4: 'gg'},
            {t1: 'iih' , t4: 'g'  }, {t1: 'iii' , t4: 'g'   },
            {t2: 'h'   , t4: 'g'  }, {t2: 'h'   , t4: 'gg'  }, {t2: 'h' , t4: 'ggg'}, {t2: 'hh', t4: 'g' },
            {t2: 'hh'  , t4: 'gg' }, {t2: 'hhh' , t4: 'g'   }, {t2: 'hhi', t4: 'g' }, {t2: 'hi', t4: 'g' },
            {t2: 'hi'  , t4: 'gg' }, {t2: 'hih' , t4: 'g'   }, {t2: 'hii', t4: 'g' }, {t2: 'i' , t4: 'g' },
            {t2: 'i'   , t4: 'gg' }, {t2: 'i'   , t4: 'ggg' }, {t2: 'ih' , t4: 'g' }, {t2: 'ih', t4: 'gg'},
            {t2: 'ihh' , t4: 'g'  }, {t2: 'ihi' , t4: 'g'   }, {t2: 'ii' , t4: 'g' }, {t2: 'ii', t4: 'gg'},
            {t2: 'iih' , t4: 'g'  }, {t2: 'iii' , t4: 'g'   },
            {t1: 'h'    }, {t1: 'hh'   }, {t1: 'hhh' }, {t1: 'hhhh'}, {t1: 'hhhi'}, {t1: 'hhi' },
            {t1: 'hhih' }, {t1: 'hhii' }, {t1: 'hi'  }, {t1: 'hih' }, {t1: 'hihh'}, {t1: 'hihi'},
            {t1: 'hii'  }, {t1: 'hiih' }, {t1: 'hiii'}, {t1: 'i'   }, {t1: 'ih'  }, {t1: 'ihh' },
            {t1: 'ihhh' }, {t1: 'ihhi' }, {t1: 'ihi' }, {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'ii'  },
            {t1: 'iih'  }, {t1: 'iihh' }, {t1: 'iihi'}, {t1: 'iii' }, {t1: 'iiih'}, {t1: 'iiii'},
            {t2: 'h'    }, {t2: 'hh'   }, {t2: 'hhh' }, {t2: 'hhhh'}, {t2: 'hhhi'}, {t2: 'hhi' },
            {t2: 'hhih' }, {t2: 'hhii' }, {t2: 'hi'  }, {t2: 'hih' }, {t2: 'hihh'}, {t2: 'hihi'},
            {t2: 'hii'  }, {t2: 'hiih' }, {t2: 'hiii'}, {t2: 'i'   }, {t2: 'ih'  }, {t2: 'ihh' },
            {t2: 'ihhh' }, {t2: 'ihhi' }, {t2: 'ihi' }, {t2: 'ihih'}, {t2: 'ihii'}, {t2: 'ii'  },
            {t2: 'iih'  }, {t2: 'iihh' }, {t2: 'iihi'}, {t2: 'iii' }, {t2: 'iiih'}, {t2: 'iiii'},
            {t4: 'g'    }, {t4: 'ggg'  }, {t4: 'gggg'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('8. ~(MatchFrom(t1>t2,t1:hi|t4:g))', function() {
        const grammar1: Grammar = Uni(t1("hi"), t4("g"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hi"), t2("hi")), t4("gg")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('9. ~(MatchFrom(t1>t2,t4:g|t1:hi))', function() {
        const grammar1: Grammar = Uni(t4("g"), t1("hi"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hi"), t2("hi")), t4("gg")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('10. ~(MatchFrom(t1>t2,(t1:h|t1:i)+(t1:i|t1:h)))', function() {
        const grammar1: Grammar = Seq(Uni(t1("h"), t1("i")), Uni(t1("i"), t1("h")));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                       Seq(t1("hh"), t2("hh")),
                                       Seq(t1("ii"), t2("ii")),
                                       Seq(t1("ih"), t2("ih"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('11. ~(MatchFrom(t1>t2,(t1:h+t1:i)|(t1:i+t1:h)))', function() {
        const grammar1: Grammar = Uni(Seq(t1("h"), t1("i")), Seq(t1("i"), t1("h")));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                       Seq(t1("ih"), t2("ih"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('12. ~(MatchFrom(t1>t2,t1:hi+t1:.))', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hih"), t2("hih")),
                                       Seq(t1("hii"), t2("hii"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    describe('13. ~(MatchFrom(t1>t2,t1:o{0,1}))', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Epsilon(),
                                       Seq(t1("o"), t2("o"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 5);
    });

    describe('14. ~(MatchFrom(t1>t2,Join(t1:h{0,1}+t4:g+t1:i,<same>))', function() {
        const grammar1: Grammar = Join(Seq(Rep(t1("h"), 0, 1), t4("g"), t1("i")),
                                       Seq(Rep(t1("h"), 0, 1), t4("g"), t1("i")));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("i"), t2("i"), t4("gg")),
                                       Seq(t1("hi"), t2("hi"), t4("gg"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    describe('15. ~(MatchFrom(t1>t2,Join(t4:g+t1:h{0,1}+t1:i,<same>))', function() {
        const grammar1: Grammar = Join(Seq(t4("g"), Rep(t1("h"), 0, 1), t1("i")),
                                       Seq(t4("g"), Rep(t1("h"), 0, 1), t1("i")));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("i"), t2("i"), t4("gg")),
                                       Seq(t1("hi"), t2("hi"), t4("gg"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    // Checking the results for this test takes a long time.
    describe.skip('16. ~(MatchFrom(t1>t2,t1:na{1,2}))', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 2);
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("na"), t2("na")),
                                       Seq(t1("nana"), t2("nana"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 9);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 9);
    });

    describe('17a. MatchFrom(t1>t2,t1:.{0}) (vocab hi)', function() {
        const grammar1: Grammar = Rep(Any("t1"), 0, 0);
        const grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     MatchFrom(grammar1, "t1", "t2"));
        const expectedResults: StringDict[] = [
            {},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    describe('17. ~(MatchFrom(t1>t2,t1:.{0})) (vocab hi)', function() {
        const grammar1: Grammar = Rep(Any("t1"), 0, 0);
        const grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     Not(MatchFrom(grammar1, "t1", "t2")));
        // expectedResults contains all possible combinations except {}.
        // Thus, for maxChars=7, there are 769 - 1 = 768 results.
        const resultsGrammar = Not(Seq(Vocab('t1', "hi"), Vocab ('t2', "hi")));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    describe('18. ~(MatchFrom(t1>t2,t1:.{0,1}+t1:hi))', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 1), t1("hi"));
        const grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        const resultsGrammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                       Seq(t1("hhi"), t2("hhi")),
                                       Seq(t1("ihi"), t2("ihi"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

    describe('19. ~(MatchFrom(t1>t2,t1:.{0,1}+t1:h+t1:.{0,1})) (vocab hi)', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 1), t1("h"), Rep(Any("t1"), 0, 1));
        const grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     Not(MatchFrom(grammar1, "t1", "t2")));
        const resultsGrammar = Not(Uni(Seq(t1("h"), t2("h")),
                                       Seq(t1("hh"), t2("hh")),
                                       Seq(t1("hi"), t2("hi")),
                                       Seq(t1("ih"), t2("ih")),
                                       Seq(t1("hhh"), t2("hhh")),
                                       Seq(t1("hhi"), t2("hhi")),
                                       Seq(t1("ihh"), t2("ihh")),
                                       Seq(t1("ihi"), t2("ihi"))));
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL, DEF_MAX_RECURSION, 7);
    });

});