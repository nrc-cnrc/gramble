
import {
    CharSet, Epsilon, Grammar, PreTape, Priority, Seq, Uni,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, testHasVocab, testGrammar,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_GRAMMAR,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. t1:hello, t1>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2(""));
        grammar = PreTape("t1", "t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [], VERBOSE_DEBUG);
    });
    
    /*
    describe('2. t1:hello+t2:world, t1>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = PreTape("t1", "t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2:"world"}]);
    }); 
    */

});