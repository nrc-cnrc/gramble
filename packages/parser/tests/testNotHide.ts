import {
    Grammar, CountTape, Vocab,
    Uni, Join, Not, Rep, Seq,
    Dot, Any, Short, Hide
} from "../src/grammars";
import { 
    testSuiteName, logTestSuite, VERBOSE_TEST, verbose,
    t1, t2, 
    testHasTapes, 
    testHasVocab, 
    testGrammar, 
    DEFAULT_MAX_RECURSION
} from './testUtil';

import { SILENT, StringDict, VERBOSE_DEBUG } from "../src/util";

const DUMMY_SYMBOL: string = "";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(VERBOSE, module);

    /* I think negation relativized to no tapes can be semantically well-defined
       but I'm iffy about letting grammars actually do that, because I think the 
       results are counter-intuitive.
    describe('Negation of empty set: ~0', function() {
        const grammar = Not(Null());
        testGrammar(grammar, [{}]);
    });

    describe('Negation of epsilon: ~e', function() {
        const grammar = Not(Epsilon());
        testGrammar(grammar, []);
    });
    
    */

    /*
    describe('1. Join t1:foo ⨝ ~t1:hello', function() {
        const g1 = Seq(t1("hello"), Hide(t2("bar"), "t2", "HIDDEN"));
        const grammar = Join(t1("foo"), Not(g1));
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t1: 5});
        testGrammar(grammar, [{t1: 'foo', ".HIDDEN": 'bar'}], VERBOSE_DEBUG, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });
    */
});
