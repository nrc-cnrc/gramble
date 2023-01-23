import { 
    Grammar,
    Count,
    CountTape,
    Epsilon,
    Any,
    Join,
    MatchFrom,
    Not,
    Seq,
    Rep,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    t1, t2, t3, t4,
    testHasTapes, 
    testHasVocab, 
    //testHasNoVocab,  
    testGrammar,
    generateOutputsFromGrammar,
} from './testUtil';

import * as path from 'path';
import { StringDict } from "../src/util";

describe(`${path.basename(module.filename)}`, function() {

    // Negated MatchFrom tests with two tapes.

    describe.skip('1a. MatchFrom(t1>t2, t1:hi)', function() {
        const grammar1: Grammar = t1("hi");
        let grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        grammar = Count(4, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    // Tests 1b* and 1c* are no longer relevant since we are eliminating
    // the maxChars argument to NotGrammar.

    // describe.skip('1b. Negation of 1a results: ~(t1:hi+t2:hi)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), Infinity);
    //     grammar = Count(4, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h'  , t2: 'h'  }, {t1: 'h', t2: 'hh'},  {t1: 'h', t2: 'hhh'},
    //         {t1: 'h'  , t2: 'hhi'}, {t1: 'h', t2: 'hi'},  {t1: 'h', t2: 'hih'},
    //         {t1: 'h'  , t2: 'hii'}, {t1: 'h', t2: 'i'},   {t1: 'h', t2: 'ih'},
    //         {t1: 'h'  , t2: 'ihh'}, {t1: 'h', t2: 'ihi'}, {t1: 'h', t2: 'ii'},
    //         {t1: 'h'  , t2: 'iih'}, {t1: 'h', t2: 'iii'}, {t1: 'hh', t2: 'h'},
    //         {t1: 'hh' , t2: 'hh' }, {t1: 'hh', t2: 'hi'}, {t1: 'hh', t2: 'i'},
    //         {t1: 'hh' , t2: 'ih' }, {t1: 'hh', t2: 'ii'}, {t1: 'hhh', t2: 'h'},
    //         {t1: 'hhh', t2: 'i'  }, {t1: 'hhi', t2: 'h'}, {t1: 'hhi', t2: 'i'},
    //         {t1: 'hi' , t2: 'h'  }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
    //         {t1: 'hi' , t2: 'ih' }, {t1: 'hi', t2: 'ii'}, {t1: 'hih', t2: 'h'},
    //         {t1: 'hih', t2: 'i'  }, {t1: 'hii', t2: 'h'}, {t1: 'hii', t2: 'i'},
    //         {t1: 'i'  , t2: 'h'  }, {t1: 'i', t2: 'hh'},  {t1: 'i', t2: 'hhh'},
    //         {t1: 'i'  , t2: 'hhi'}, {t1: 'i', t2: 'hi'},  {t1: 'i', t2: 'hih'},
    //         {t1: 'i'  , t2: 'hii'}, {t1: 'i', t2: 'i'},   {t1: 'i', t2: 'ih'},
    //         {t1: 'i'  , t2: 'ihh'}, {t1: 'i', t2: 'ihi'}, {t1: 'i', t2: 'ii'},
    //         {t1: 'i'  , t2: 'iih'}, {t1: 'i', t2: 'iii'}, {t1: 'ih', t2: 'h'},
    //         {t1: 'ih' , t2: 'hh' }, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
    //         {t1: 'ih' , t2: 'ih' }, {t1: 'ih', t2: 'ii'}, {t1: 'ihh', t2: 'h'},
    //         {t1: 'ihh', t2: 'i'  }, {t1: 'ihi', t2: 'h'}, {t1: 'ihi', t2: 'i'},
    //         {t1: 'ii' , t2: 'h'  }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
    //         {t1: 'ii' , t2: 'i'  }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
    //         {t1: 'iih', t2: 'h'  }, {t1: 'iih', t2: 'i'}, {t1: 'iii', t2: 'h'},
    //         {t1: 'iii', t2: 'i'  },
    //         {t1: 'h'   }, {t1: 'hh'  }, {t1: 'hhh' }, {t1: 'hhhh'}, {t1: 'hhhi'},
    //         {t1: 'hhi' }, {t1: 'hhih'}, {t1: 'hhii'}, {t1: 'hi'  }, {t1: 'hih' },
    //         {t1: 'hihh'}, {t1: 'hihi'}, {t1: 'hii' }, {t1: 'hiih'}, {t1: 'hiii'},
    //         {t1: 'i'   }, {t1: 'ih'  }, {t1: 'ihh' }, {t1: 'ihhh'}, {t1: 'ihhi'},
    //         {t1: 'ihi' }, {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'ii'  }, {t1: 'iih' },
    //         {t1: 'iihh'}, {t1: 'iihi'}, {t1: 'iii' }, {t1: 'iiih'}, {t1: 'iiii'},
    //         {t2: 'h'   }, {t2: 'hh'  }, {t2: 'hhh' }, {t2: 'hhhh'}, {t2: 'hhhi'},
    //         {t2: 'hhi' }, {t2: 'hhih'}, {t2: 'hhii'}, {t2: 'hi'  }, {t2: 'hih' },
    //         {t2: 'hihh'}, {t2: 'hihi'}, {t2: 'hii' }, {t2: 'hiih'}, {t2: 'hiii'},
    //         {t2: 'i'   }, {t2: 'ih'  }, {t2: 'ihh' }, {t2: 'ihhh'}, {t2: 'ihhi'},
    //         {t2: 'ihi' }, {t2: 'ihih'}, {t2: 'ihii'}, {t2: 'ii'  }, {t2: 'iih' },
    //         {t2: 'iihh'}, {t2: 'iihi'}, {t2: 'iii' }, {t2: 'iiih'}, {t2: 'iiii'},
    //         {},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // // Test 1b-1 illustrates that Negation yields the same outputs when 
    // // Not.maxChars == testGrammar.maxChars as when Not.maxChars == Infinity.
    // describe.skip('1b-1. Negation of 1a results: ~(t1:hi+t2:hi, 4)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 4);
    //     grammar = Count(4, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h'  , t2: 'h'  }, {t1: 'h', t2: 'hh'},  {t1: 'h', t2: 'hhh'},
    //         {t1: 'h'  , t2: 'hhi'}, {t1: 'h', t2: 'hi'},  {t1: 'h', t2: 'hih'},
    //         {t1: 'h'  , t2: 'hii'}, {t1: 'h', t2: 'i'},   {t1: 'h', t2: 'ih'},
    //         {t1: 'h'  , t2: 'ihh'}, {t1: 'h', t2: 'ihi'}, {t1: 'h', t2: 'ii'},
    //         {t1: 'h'  , t2: 'iih'}, {t1: 'h', t2: 'iii'}, {t1: 'hh', t2: 'h'},
    //         {t1: 'hh' , t2: 'hh' }, {t1: 'hh', t2: 'hi'}, {t1: 'hh', t2: 'i'},
    //         {t1: 'hh' , t2: 'ih' }, {t1: 'hh', t2: 'ii'}, {t1: 'hhh', t2: 'h'},
    //         {t1: 'hhh', t2: 'i'  }, {t1: 'hhi', t2: 'h'}, {t1: 'hhi', t2: 'i'},
    //         {t1: 'hi' , t2: 'h'  }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
    //         {t1: 'hi' , t2: 'ih' }, {t1: 'hi', t2: 'ii'}, {t1: 'hih', t2: 'h'},
    //         {t1: 'hih', t2: 'i'  }, {t1: 'hii', t2: 'h'}, {t1: 'hii', t2: 'i'},
    //         {t1: 'i'  , t2: 'h'  }, {t1: 'i', t2: 'hh'},  {t1: 'i', t2: 'hhh'},
    //         {t1: 'i'  , t2: 'hhi'}, {t1: 'i', t2: 'hi'},  {t1: 'i', t2: 'hih'},
    //         {t1: 'i'  , t2: 'hii'}, {t1: 'i', t2: 'i'},   {t1: 'i', t2: 'ih'},
    //         {t1: 'i'  , t2: 'ihh'}, {t1: 'i', t2: 'ihi'}, {t1: 'i', t2: 'ii'},
    //         {t1: 'i'  , t2: 'iih'}, {t1: 'i', t2: 'iii'}, {t1: 'ih', t2: 'h'},
    //         {t1: 'ih' , t2: 'hh' }, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
    //         {t1: 'ih' , t2: 'ih' }, {t1: 'ih', t2: 'ii'}, {t1: 'ihh', t2: 'h'},
    //         {t1: 'ihh', t2: 'i'  }, {t1: 'ihi', t2: 'h'}, {t1: 'ihi', t2: 'i'},
    //         {t1: 'ii' , t2: 'h'  }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
    //         {t1: 'ii' , t2: 'i'  }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
    //         {t1: 'iih', t2: 'h'  }, {t1: 'iih', t2: 'i'}, {t1: 'iii', t2: 'h'},
    //         {t1: 'iii', t2: 'i'  },
    //         {t1: 'h'   }, {t1: 'hh'  }, {t1: 'hhh' }, {t1: 'hhhh'}, {t1: 'hhhi'},
    //         {t1: 'hhi' }, {t1: 'hhih'}, {t1: 'hhii'}, {t1: 'hi'  }, {t1: 'hih' },
    //         {t1: 'hihh'}, {t1: 'hihi'}, {t1: 'hii' }, {t1: 'hiih'}, {t1: 'hiii'},
    //         {t1: 'i'   }, {t1: 'ih'  }, {t1: 'ihh' }, {t1: 'ihhh'}, {t1: 'ihhi'},
    //         {t1: 'ihi' }, {t1: 'ihih'}, {t1: 'ihii'}, {t1: 'ii'  }, {t1: 'iih' },
    //         {t1: 'iihh'}, {t1: 'iihi'}, {t1: 'iii' }, {t1: 'iiih'}, {t1: 'iiii'},
    //         {t2: 'h'   }, {t2: 'hh'  }, {t2: 'hhh' }, {t2: 'hhhh'}, {t2: 'hhhi'},
    //         {t2: 'hhi' }, {t2: 'hhih'}, {t2: 'hhii'}, {t2: 'hi'  }, {t2: 'hih' },
    //         {t2: 'hihh'}, {t2: 'hihi'}, {t2: 'hii' }, {t2: 'hiih'}, {t2: 'hiii'},
    //         {t2: 'i'   }, {t2: 'ih'  }, {t2: 'ihh' }, {t2: 'ihhh'}, {t2: 'ihhi'},
    //         {t2: 'ihi' }, {t2: 'ihih'}, {t2: 'ihii'}, {t2: 'ii'  }, {t2: 'iih' },
    //         {t2: 'iihh'}, {t2: 'iihi'}, {t2: 'iii' }, {t2: 'iiih'}, {t2: 'iiii'},
    //         {},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // // Tests 1b-2 to 1b-4 illustrate how Negation works when
    // // Not.maxChars < testGrammar.maxChars
    // describe.skip('1b-2. Negation of 1a results: ~(t1:hi+t2:hi, 3)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 3);
    //     grammar = Count(4, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h' , t2: 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h', t2: 'hi'},
    //         {t1: 'h' , t2: 'i' }, {t1: 'h' , t2: 'ih'}, {t1: 'h', t2: 'ii'},
    //         {t1: 'hh', t2: 'h' }, {t1: 'hh', t2: 'i' }, {t1: 'hi', t2: 'h'},
    //         {t1: 'hi', t2: 'i' }, {t1: 'i' , t2: 'h' }, {t1: 'i', t2: 'hh'},
    //         {t1: 'i' , t2: 'hi'}, {t1: 'i' , t2: 'i' }, {t1: 'i', t2: 'ih'},
    //         {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'h' }, {t1: 'ih', t2: 'i'},
    //         {t1: 'ii', t2: 'h' }, {t1: 'ii', t2: 'i' },
    //         {t1: 'h'  }, {t1: 'hh' }, {t1: 'hhh'}, {t1: 'hhi'}, {t1: 'hi'},
    //         {t1: 'hih'}, {t1: 'hii'}, {t1: 'i'  }, {t1: 'ih' }, {t1: 'ihh'},
    //         {t1: 'ihi'}, {t1: 'ii' }, {t1: 'iih'}, {t1: 'iii'},
    //         {t2: 'h'  }, {t2: 'hh' }, {t2: 'hhh'}, {t2: 'hhi'}, {t2: 'hi'},
    //         {t2: 'hih'}, {t2: 'hii'}, {t2: 'i'  }, {t2: 'ih' }, {t2: 'ihh'},
    //         {t2: 'ihi'}, {t2: 'ii' }, {t2: 'iih'}, {t2: 'iii'},
    //         {},
    //         // The following results should not be generated, but are, because
    //         // of the way constructUniverse is done in NegationExpr.concreteDeriv
    //         // (line 1787 atm).
    //         {t1: 'hh' , t2: 'hh'}, {t1: 'hh' , t2: 'hi'}, {t1: 'hh', t2: 'ih'},
    //         {t1: 'hh' , t2: 'ii'}, {t1: 'hhh', t2: 'h' }, {t1: 'hhh', t2: 'i'},
    //         {t1: 'hi' , t2: 'hh'}, {t1: 'hi' , t2: 'ih'}, {t1: 'hih', t2: 'h'},
    //         {t1: 'hih', t2: 'i' }, {t1: 'ih' , t2: 'hh'}, {t1: 'ih', t2: 'hi'},
    //         {t1: 'ih' , t2: 'ih'}, {t1: 'ih' , t2: 'ii'}, {t1: 'ihh', t2: 'h'},
    //         {t1: 'ihh', t2: 'i' }, {t1: 'ii' , t2: 'hh'}, {t1: 'ii', t2: 'ih'},
    //         {t1: 'iih', t2: 'h' }, {t1: 'iih', t2: 'i' },
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // describe.skip('1b-3. Negation of 1a results: ~(t1:hi+t2:hi, 2)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 2);
    //     grammar = Count(4, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h', t2: 'h'}, {t1: 'h', t2: 'i'},
    //         {t1: 'i', t2: 'h'}, {t1: 'i', t2: 'i'},
    //         {t1: 'h' }, {t1: 'i' }, {t1: 'hh'},
    //         {t1: 'hi'}, {t1: 'ih'}, {t1: 'ii'},
    //         {t2: 'h' }, {t2: 'i' }, {t2: 'hh'},
    //         {t2: 'hi'}, {t2: 'ih'}, {t2: 'ii'},
    //         {},
    //         // The following results should not be generated, but are, because
    //         // of the way constructUniverse is done in NegationExpr.concreteDeriv
    //         // (line 1787 atm).
    //         {t1: 'hh', t2: 'h'}, {t1: 'hh', t2: 'i'},
    //         {t1: 'ih', t2: 'h'}, {t1: 'ih', t2: 'i'},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // describe.skip('1b-4. Negation of 1a results: ~(t1:hi+t2:hi, 1)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 1);
    //     grammar = Count(4, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h'}, {t1: 'i'}, {t2: 'i'}, {t2: 'h'},
    //         {},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // describe.skip('1c. Negation of 1a results: ~(t1:hi+t2:hi)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), Infinity);
    //     grammar = CountTape(2, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h' , t2: 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h' , t2: 'hi'},
    //         {t1: 'h' , t2: 'i' }, {t1: 'h' , t2: 'ih'}, {t1: 'h' , t2: 'ii'},
    //         {t1: 'hh', t2: 'h' }, {t1: 'hh', t2: 'hh'}, {t1: 'hh', t2: 'hi'},
    //         {t1: 'hh', t2: 'i' }, {t1: 'hh', t2: 'ih'}, {t1: 'hh', t2: 'ii'},
    //         {t1: 'hi', t2: 'h' }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
    //         {t1: 'hi', t2: 'ih'}, {t1: 'hi', t2: 'ii'}, {t1: 'i' , t2: 'h'},
    //         {t1: 'i' , t2: 'hh'}, {t1: 'i' , t2: 'hi'}, {t1: 'i' , t2: 'i'},
    //         {t1: 'i' , t2: 'ih'}, {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'h'},
    //         {t1: 'ih', t2: 'hh'}, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
    //         {t1: 'ih', t2: 'ih'}, {t1: 'ih', t2: 'ii'}, {t1: 'ii', t2: 'h'},
    //         {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'}, {t1: 'ii', t2: 'i'},
    //         {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
    //         {t1: 'h' }, {t1: 'hh'}, {t1: 'hi'}, {t1: 'i' },
    //         {t1: 'ih'}, {t1: 'ii'}, {t2: 'h' }, {t2: 'hh'},
    //         {t2: 'hi'}, {t2: 'i' }, {t2: 'ih'}, {t2: 'ii'},
    //         {},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // // Test 1c-1 illustrates that Negation yields the same outputs when 
    // // Not.maxChars == 2 * CountTape.maxChars as when Not.maxChars == Infinity.
    // describe.skip('1c-1. Negation of 1a results: ~(t1:hi+t2:hi, 4)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 4);;
    //     grammar = CountTape(2, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h' , t2: 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h' , t2: 'hi'},
    //         {t1: 'h' , t2: 'i' }, {t1: 'h' , t2: 'ih'}, {t1: 'h' , t2: 'ii'},
    //         {t1: 'hh', t2: 'h' }, {t1: 'hh', t2: 'hh'}, {t1: 'hh', t2: 'hi'},
    //         {t1: 'hh', t2: 'i' }, {t1: 'hh', t2: 'ih'}, {t1: 'hh', t2: 'ii'},
    //         {t1: 'hi', t2: 'h' }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
    //         {t1: 'hi', t2: 'ih'}, {t1: 'hi', t2: 'ii'}, {t1: 'i' , t2: 'h'},
    //         {t1: 'i' , t2: 'hh'}, {t1: 'i' , t2: 'hi'}, {t1: 'i' , t2: 'i'},
    //         {t1: 'i' , t2: 'ih'}, {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'h'},
    //         {t1: 'ih', t2: 'hh'}, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
    //         {t1: 'ih', t2: 'ih'}, {t1: 'ih', t2: 'ii'}, {t1: 'ii', t2: 'h'},
    //         {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'}, {t1: 'ii', t2: 'i'},
    //         {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
    //         {t1: 'h' }, {t1: 'hh'}, {t1: 'hi'}, {t1: 'i' },
    //         {t1: 'ih'}, {t1: 'ii'}, {t2: 'h' }, {t2: 'hh'},
    //         {t2: 'hi'}, {t2: 'i' }, {t2: 'ih'}, {t2: 'ii'},
    //         {},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // // Tests 1c-2 to 1c-4 illustrate how Negation works when
    // // Not.maxChars < 2 * CountTape.maxChars
    // describe.skip('1c-2. Negation of 1a results: ~(t1:hi+t2:hi, 3)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 3);;
    //     grammar = CountTape(2, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h' , t2: 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h' , t2: 'hi'},
    //         {t1: 'h' , t2: 'i' }, {t1: 'h' , t2: 'ih'}, {t1: 'h' , t2: 'ii'},
    //         {t1: 'hh', t2: 'h' }, {t1: 'hh', t2: 'hh'}, {t1: 'hh', t2: 'hi'},
    //         {t1: 'hh', t2: 'i' }, {t1: 'hh', t2: 'ih'}, {t1: 'hh', t2: 'ii'},
    //         {t1: 'hi', t2: 'h' }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i'},
    //         {t1: 'hi', t2: 'ih'}, {t1: 'i' , t2: 'h'},
    //         {t1: 'i' , t2: 'hh'}, {t1: 'i' , t2: 'hi'}, {t1: 'i' , t2: 'i'},
    //         {t1: 'i' , t2: 'ih'}, {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'h'},
    //         {t1: 'ih', t2: 'hh'}, {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i'},
    //         {t1: 'ih', t2: 'ih'}, {t1: 'ih', t2: 'ii'}, {t1: 'ii', t2: 'h'},
    //         {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'i'},
    //         {t1: 'ii', t2: 'ih'},
    //         {t1: 'h' }, {t1: 'hh'}, {t1: 'hi'}, {t1: 'i' },
    //         {t1: 'ih'}, {t1: 'ii'}, {t2: 'h' }, {t2: 'hh'},
    //         {t2: 'hi'}, {t2: 'i' }, {t2: 'ih'}, {t2: 'ii'},
    //         {},
    //         // missing 1c-1 results:
    //         // {t1: 'hi', t2: 'ii'}, {t1: 'ii', t2: 'hi'}, {t1: 'ii', t2: 'ii'},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // describe.skip('1c-3. Negation of 1a results: ~(t1:hi+t2:hi, 2)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 2);;
    //     grammar = CountTape(2, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h' , t2: 'h'}, {t1: 'h' , t2: 'i'}, {t1: 'hh', t2: 'h'},
    //         {t1: 'hh', t2: 'i'}, {t1: 'i' , t2: 'h'}, {t1: 'i' , t2: 'i'},
    //         {t1: 'ih', t2: 'h'}, {t1: 'ih', t2: 'i'},
    //         {t1: 'h' }, {t1: 'hh'}, {t1: 'hi'}, {t1: 'i' },
    //         {t1: 'ih'}, {t1: 'ii'}, {t2: 'h' }, {t2: 'hh'},
    //         {t2: 'hi'}, {t2: 'i' }, {t2: 'ih'}, {t2: 'ii'},
    //         {},
    //         // missing 1c-1 results:
    //         // {t1: 'h' , t2: 'hh'}, {t1: 'h' , t2: 'hi'}, {t1: 'h' , t2: 'ih'},
    //         // {t1: 'h' , t2: 'ii'}, {t1: 'hh', t2: 'hh'}, {t1: 'hh', t2: 'hi'},
    //         // {t1: 'hh', t2: 'ih'}, {t1: 'hh', t2: 'ii'}, {t1: 'hi', t2: 'h' },
    //         // {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i' }, {t1: 'hi', t2: 'ih'},
    //         // {t1: 'hi', t2: 'ii'}, {t1: 'i' , t2: 'hh'}, {t1: 'i' , t2: 'hi'},
    //         // {t1: 'i' , t2: 'ih'}, {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'hh'},
    //         // {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'ih'}, {t1: 'ih', t2: 'ii'},
    //         // {t1: 'ii', t2: 'h' }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
    //         // {t1: 'ii', t2: 'i' }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    // describe.skip('1c-4. Negation of 1a results: ~(t1:hi+t2:hi, 1)', function() {
    //     let grammar: Grammar = Not(Seq(t1("hi"), t2("hi")), 1);;
    //     grammar = CountTape(2, grammar);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'h'}, {t1: 'i'}, {t2: 'i'}, {t2: 'h'},
    //         {},
    //     ];
    //     // testHasTapes(grammar, ['t1', 't2']);
    //     // testHasVocab(grammar, {t1: 2, t2: 2});
    //     testGrammar(grammar, expectedResults);
    // });

    describe('1. ~(MatchFrom(t1>t2,t1:hi))', function() {
        const grammar1: Grammar = t1("hi");
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);

        let resultsGrammar: Grammar = Not(Seq(t1("hi"), t2("hi")));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe.skip('2a. MatchFrom(t1>t2,ε) (vocab hi)', function() {
        const grammar1: Grammar = Epsilon();
        let grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     MatchFrom(grammar1, "t1", "t2"));
        grammar = Count(2, grammar);
        const expectedResults: StringDict[] = [
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe.skip('2b. Negation of 2a results: ~() (vocab hi)', function() {
        let grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     Not(Epsilon()));
        grammar = Count(2, grammar);
        const expectedResults: StringDict[] = [
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    /*
    describe('2. ~(MatchFrom(t1>t2,ε)) (vocab hi)', function() {
        const grammar1: Grammar = Epsilon();
        let grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                     Not(MatchFrom(grammar1, "t1", "t2")));
        grammar = CountTape(2, grammar);
        const expectedResults: StringDict[] = [
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    }); */

    describe('3. ~(MatchFrom(t1>t2,t1:h+t1:i))', function() {
        const grammar1: Grammar = Seq(t1("h"), t1("i"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);

        let resultsGrammar: Grammar = Not(Seq(t1("hi"), t2("hi")));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('4. ~(MatchFrom(t1>t2,t1:hi+t4:g))', function() {
        const grammar1: Grammar = Seq(t1("hi"), t4("g"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);

        let resultsGrammar: Grammar = Not(Seq(t1("hi"), t2("hi"), t4("g")));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('5. ~(MatchFrom(t1>t2,t4:g+t1:hi))', function() {
        const grammar1: Grammar = Seq(t4("g"), t1("hi"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);
        
        let resultsGrammar: Grammar = Not(Seq(t1("hi"), t2("hi"), t4("g")));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    // Checking the results for this test takes a long time.
    describe('6. ~(MatchFrom(t1>t2,(t1:h+t1:,)+t1:w)) w/ nested seq', function() {
        const grammar1: Grammar = Seq(Seq(t1("h"), t1(",")), t1("w"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);

        let resultsGrammar: Grammar = Not(Seq(t1("h,w"), t2("h,w")));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        testGrammar(grammar, expectedResults);
    });

    describe.skip('7a. MatchFrom(t1>t2,t1:hi|t1:hh)', function() {
        const grammar1: Grammar = Uni(t1("hi"), t1("hh"));
        let grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        grammar = CountTape(2, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
            {t1: 'hh', t2: 'hh'},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe.skip('7b. Negation of 7a results: ~((t1:hi+t2:hi)|(t1:hh+t2:hh))', function() {
        let grammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                         Seq(t1("hh"), t2("hh"))));
        grammar = CountTape(2, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'h'  , t2 : 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h' , t2: 'hi'},
            {t1: 'h'  , t2 : 'i' }, {t1: 'h' , t2: 'ih'}, {t1: 'h' , t2: 'ii'},
            {t1: 'hh' , t2 : 'h' }, {t1: 'hh', t2: 'hi'}, {t1: 'hh', t2: 'i' },
            {t1: 'hh' , t2 : 'ih'}, {t1: 'hh', t2: 'ii'}, {t1: 'hi', t2: 'h' },
            {t1: 'hi' , t2 : 'hh'}, {t1: 'hi', t2: 'i' }, {t1: 'hi', t2: 'ih'},
            {t1: 'hi' , t2 : 'ii'},
            {t1: 'i'  , t2 : 'h' }, {t1: 'i' , t2: 'hh'}, {t1: 'i' , t2: 'hi'},
            {t1: 'i'  , t2 : 'i' }, {t1: 'i' , t2: 'ih'}, {t1: 'i' , t2: 'ii'},
            {t1: 'ih' , t2 : 'h' }, {t1: 'ih', t2: 'hh'}, {t1: 'ih', t2: 'hi'},
            {t1: 'ih' , t2 : 'i' }, {t1: 'ih', t2: 'ih'}, {t1: 'ih', t2: 'ii'},
            {t1: 'ii' , t2 : 'h' }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'},
            {t1: 'ii' , t2 : 'i' }, {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
            {t1: 'h'  }, {t1: 'hh'}, {t1: 'hi'}, {t1: 'i' },
            {t1: 'ih' }, {t1: 'ii'}, {t2: 'h' }, {t2: 'hh'},
            {t2: 'hi' }, {t2: 'i' }, {t2: 'ih'}, {t2: 'ii'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('7. ~(MatchFrom(t1>t2,t1:hi|t1:hh))', function() {
        const grammar1: Grammar = Uni(t1("hi"), t1("hh"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                       Seq(t1("hh"), t2("hh"))));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    // 8a. MatchFrom t1, t2, t1:hi|t4:g
    describe.skip('8a. MatchFrom(t1>t2,t1:hi|t4:g)', function() {
        const grammar1: Grammar = Uni(t1("hi"), t4("g"));
        let grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        // grammar = CountTape(2, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
            {t4: 'gg'},
        ];
        // testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe.skip('8b. Negation of 8a results: ~((t1:hi+t2:hi)|(t4:gg))', function() {
        let grammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")), t4("gg")));
        grammar = CountTape(2, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'h' , t2: 'h' , t4: 'g' }, {t1: 'h' , t2: 'h' , t4: 'gg'}, {t1: 'h' , t2: 'hh', t4: 'g' },
            {t1: 'h' , t2: 'hh', t4: 'gg'}, {t1: 'h' , t2: 'hi', t4: 'g' }, {t1: 'h' , t2: 'hi', t4: 'gg'},
            {t1: 'h' , t2: 'i' , t4: 'g' }, {t1: 'h' , t2: 'i' , t4: 'gg'}, {t1: 'h' , t2: 'ih', t4: 'g' },
            {t1: 'h' , t2: 'ih', t4: 'gg'}, {t1: 'h' , t2: 'ii', t4: 'g' }, {t1: 'h' , t2: 'ii', t4: 'gg'},
            {t1: 'hh', t2: 'h' , t4: 'g' }, {t1: 'hh', t2: 'h' , t4: 'gg'}, {t1: 'hh', t2: 'hh', t4: 'g' },
            {t1: 'hh', t2: 'hh', t4: 'gg'}, {t1: 'hh', t2: 'hi', t4: 'g' }, {t1: 'hh', t2: 'hi', t4: 'gg'},
            {t1: 'hh', t2: 'i' , t4: 'g' }, {t1: 'hh', t2: 'i' , t4: 'gg'}, {t1: 'hh', t2: 'ih', t4: 'g' },
            {t1: 'hh', t2: 'ih', t4: 'gg'}, {t1: 'hh', t2: 'ii', t4: 'g' }, {t1: 'hh', t2: 'ii', t4: 'gg'},
            {t1: 'hi', t2: 'h' , t4: 'g' }, {t1: 'hi', t2: 'h' , t4: 'gg'}, {t1: 'hi', t2: 'hh', t4: 'g' },
            {t1: 'hi', t2: 'hh', t4: 'gg'}, {t1: 'hi', t2: 'hi', t4: 'g' }, {t1: 'hi', t2: 'hi', t4: 'gg'},
            {t1: 'hi', t2: 'i' , t4: 'g' }, {t1: 'hi', t2: 'i' , t4: 'gg'}, {t1: 'hi', t2: 'ih', t4: 'g' },
            {t1: 'hi', t2: 'ih', t4: 'gg'}, {t1: 'hi', t2: 'ii', t4: 'g' }, {t1: 'hi', t2: 'ii', t4: 'gg'},
            {t1: 'i' , t2: 'h' , t4: 'g' }, {t1: 'i' , t2: 'h' , t4: 'gg'}, {t1: 'i' , t2: 'hh', t4: 'g' },
            {t1: 'i' , t2: 'hh', t4: 'gg'}, {t1: 'i' , t2: 'hi', t4: 'g' }, {t1: 'i' , t2: 'hi', t4: 'gg'},
            {t1: 'i' , t2: 'i' , t4: 'g' }, {t1: 'i' , t2: 'i' , t4: 'gg'}, {t1: 'i' , t2: 'ih', t4: 'g' },
            {t1: 'i' , t2: 'ih', t4: 'gg'}, {t1: 'i' , t2: 'ii', t4: 'g' }, {t1: 'i' , t2: 'ii', t4: 'gg'},
            {t1: 'ih', t2: 'h' , t4: 'g' }, {t1: 'ih', t2: 'h' , t4: 'gg'}, {t1: 'ih', t2: 'hh', t4: 'g' },
            {t1: 'ih', t2: 'hh', t4: 'gg'}, {t1: 'ih', t2: 'hi', t4: 'g' }, {t1: 'ih', t2: 'hi', t4: 'gg'},
            {t1: 'ih', t2: 'i' , t4: 'g' }, {t1: 'ih', t2: 'i' , t4: 'gg'}, {t1: 'ih', t2: 'ih', t4: 'g' },
            {t1: 'ih', t2: 'ih', t4: 'gg'}, {t1: 'ih', t2: 'ii', t4: 'g' }, {t1: 'ih', t2: 'ii', t4: 'gg'},
            {t1: 'ii', t2: 'h' , t4: 'g' }, {t1: 'ii', t2: 'h' , t4: 'gg'}, {t1: 'ii', t2: 'hh', t4: 'g' },
            {t1: 'ii', t2: 'hh', t4: 'gg'}, {t1: 'ii', t2: 'hi', t4: 'g' }, {t1: 'ii', t2: 'hi', t4: 'gg'},
            {t1: 'ii', t2: 'i' , t4: 'g' }, {t1: 'ii', t2: 'i' , t4: 'gg'}, {t1: 'ii', t2: 'ih', t4: 'g' },
            {t1: 'ii', t2: 'ih', t4: 'gg'}, {t1: 'ii', t2: 'ii', t4: 'g' }, {t1: 'ii', t2: 'ii', t4: 'gg'},
            {t1: 'h' , t2: 'h' }, {t1: 'h' , t2: 'hh'}, {t1: 'h' , t2: 'hi'}, {t1: 'h' , t2: 'i' },
            {t1: 'h' , t2: 'ih'}, {t1: 'h' , t2: 'ii'}, {t1: 'hh', t2: 'h' }, {t1: 'hh', t2: 'hh'},
            {t1: 'hh', t2: 'hi'}, {t1: 'hh', t2: 'i' }, {t1: 'hh', t2: 'ih'}, {t1: 'hh', t2: 'ii'},
            {t1: 'hi', t2: 'h' }, {t1: 'hi', t2: 'hh'}, {t1: 'hi', t2: 'i' }, {t1: 'hi', t2: 'ih'},
            {t1: 'hi', t2: 'ii'},
            {t1: 'i' , t2: 'h' }, {t1: 'i' , t2: 'hh'}, {t1: 'i' , t2: 'hi'}, {t1: 'i' , t2: 'i' },
            {t1: 'i' , t2: 'ih'}, {t1: 'i' , t2: 'ii'}, {t1: 'ih', t2: 'h' }, {t1: 'ih', t2: 'hh'},
            {t1: 'ih', t2: 'hi'}, {t1: 'ih', t2: 'i' }, {t1: 'ih', t2: 'ih'}, {t1: 'ih', t2: 'ii'},
            {t1: 'ii', t2: 'h' }, {t1: 'ii', t2: 'hh'}, {t1: 'ii', t2: 'hi'}, {t1: 'ii', t2: 'i' },
            {t1: 'ii', t2: 'ih'}, {t1: 'ii', t2: 'ii'},
            {t1: 'h' , t4: 'g' }, {t1: 'h' , t4: 'gg'}, {t1: 'hh', t4: 'g' }, {t1: 'hh', t4: 'gg'},
            {t1: 'hi', t4: 'g' }, {t1: 'hi', t4: 'gg'},
            {t1: 'i' , t4: 'g' }, {t1: 'i' , t4: 'gg'}, {t1: 'ih', t4: 'g' }, {t1: 'ih', t4: 'gg'},
            {t1: 'ii', t4: 'g' }, {t1: 'ii', t4: 'gg'},
            {t2: 'h' , t4: 'g' }, {t2: 'h' , t4: 'gg'}, {t2: 'hh', t4: 'g' }, {t2: 'hh', t4: 'gg'},
            {t2: 'hi', t4: 'g' }, {t2: 'hi', t4: 'gg'},
            {t2: 'i' , t4: 'g' }, {t2: 'i' , t4: 'gg'}, {t2: 'ih', t4: 'g' }, {t2: 'ih', t4: 'gg'},
            {t2: 'ii', t4: 'g' }, {t2: 'ii', t4: 'gg'},
            {t1: 'h'}, {t1: 'hh'}, {t1: 'hi'}, {t1: 'i'}, {t1: 'ih'}, {t1: 'ii'},
            {t2: 'h'}, {t2: 'hh'}, {t2: 'hi'}, {t2: 'i'}, {t2: 'ih'}, {t2: 'ii'},
            {t4: 'g'},
            {},
        ];
        // testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('8. ~(MatchFrom(t1>t2,t1:hi|t4:g))', function() {
        const grammar1: Grammar = Uni(t1("hi"), t4("g"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")), t4("g")));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('9. ~(MatchFrom(t1>t2,t4:g|t1:hi))', function() {
        const grammar1: Grammar = Uni(t4("g"), t1("hi"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")), t4("g")));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('10. ~(MatchFrom(t1>t2,(t1:h|t1:g)+(t1:k|t1:w)))', function() {
        const grammar1: Grammar = Seq(Uni(t1("h"), t1("g")), Uni(t1("k"), t1("w")));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);
        
        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hk"), t2("hk")),
                                              Seq(t1("gk"), t2("gk")),
                                              Seq(t1("hw"), t2("hw")),
                                              Seq(t1("gw"), t2("gw"))));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('11. ~(MatchFrom(t1>t2,(t1:h+t1:k)|(t1:g+t1:w)))', function() {
        const grammar1: Grammar = Uni(Seq(t1("h"), t1("k")), Seq(t1("g"), t1("w")));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(2, grammar);
        
        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hk"), t2("hk")),
                                              Seq(t1("gw"), t2("gw"))));
        resultsGrammar = CountTape(2, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('12. ~(MatchFrom(t1>t2,t1:hi+t1:.))', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hih"), t2("hih")),
                                              Seq(t1("hii"), t2("hii"))));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('13. ~(MatchFrom(t1>t2,t1:o{0,1}))', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);

        let resultsGrammar: Grammar = Not(Uni(Epsilon(),
                                              Seq(t1("o"), t2("o"))));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('14. ~(MatchFrom(t1>t2,Join(t1:h{1,2}+t4:g+t1:i,<same>))', function() {
        const grammar1: Grammar = Join(Seq(Rep(t1("h"), 1, 2), t4("g"), t1("i")),
                                       Seq(Rep(t1("h"), 1, 2), t4("g"), t1("i")));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi"), t4("g")),
                                              Seq(t1("hhi"), t2("hhi"), t4("g"))));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('15. ~(MatchFrom(t1>t2,Join(t4:g+t1:h{1,2}+t1:i,<same>))', function() {
        const grammar1: Grammar = Join(Seq(t4("g"), Rep(t1("h"), 1, 2), t1("i")),
                                       Seq(t4("g"), Rep(t1("h"), 1, 2), t1("i")));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi"), t4("g")),
                                              Seq(t1("hhi"), t2("hhi"), t4("g"))));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('16. ~(MatchFrom(t1>t2,t1:na{1,2}))', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 2);
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(4, grammar);

        let resultsGrammar: Grammar = Not(Uni(Seq(t1("na"), t2("na")),
                                              Seq(t1("nana"), t2("nana"))));
        resultsGrammar = CountTape(4, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe.skip('17a. MatchFrom(t1>t2,t1:.{0}) (vocab hi)', function() {
        const grammar1: Grammar = Rep(Any("t1"), 0, 0);
        let grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                   MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(3, grammar);
        const expectedResults: StringDict[] = [
            {},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('17. ~(MatchFrom(t1>t2,t1:.{0})) (vocab hi)', function() {
        const grammar1: Grammar = Rep(Any("t1"), 0, 0);
        let grammar: Grammar = Seq(Vocab('t1', "hi"), Vocab ('t2', "hi"),
                                   Not(MatchFrom(grammar1, "t1", "t2")));
        grammar = CountTape(3, grammar);
        
        let resultsGrammar: Grammar = Not(Seq(Vocab('t1', "hi"), Vocab ('t2', "hi")));
        resultsGrammar = CountTape(3, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('18. ~(MatchFrom(t1>t2,t1:.{0,2}+t1:hi))', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 2), t1("hi"));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(4, grammar);
        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                              Seq(t1("hhi"), t2("hhi")),
                                              Seq(t1("ihi"), t2("ihi")),
                                              Seq(t1("hhhi"), t2("hhhi")),
                                              Seq(t1("hihi"), t2("hihi")),
                                              Seq(t1("ihhi"), t2("ihhi")),
                                              Seq(t1("iihi"), t2("iihi"))));
        resultsGrammar = CountTape(4, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('19. ~(MatchFrom(t1>t2,t1:.{0,1}+t1:hi+t1:.{0,1}))', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 1), t1("hi"), Rep(Any("t1"), 0, 1));
        let grammar: Grammar = Not(MatchFrom(grammar1, "t1", "t2"));
        grammar = CountTape(4, grammar);
        let resultsGrammar: Grammar = Not(Uni(Seq(t1("hi"), t2("hi")),
                                              Seq(t1("hhi"), t2("hhi")),
                                              Seq(t1("ihi"), t2("ihi")),
                                              Seq(t1("hih"), t2("hih")),
                                              Seq(t1("hii"), t2("hii")),
                                              Seq(t1("hhih"), t2("hhih")),
                                              Seq(t1("hhii"), t2("hhii")),
                                              Seq(t1("ihih"), t2("ihih")),
                                              Seq(t1("ihii"), t2("ihii"))));
        resultsGrammar = CountTape(4, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

});