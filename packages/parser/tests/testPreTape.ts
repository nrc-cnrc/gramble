
import {
    CharSet, Epsilon, Grammar, PreTape, Priority, Seq, Taper, Uni,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, testHasVocab, testGrammar,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_GRAMMAR,
} from "../src/util";
import { EPSILON } from "../src/exprs";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. T_t1(t1:hello)', function() {
        let grammar: Grammar = t1("hello");
        grammar = Taper("t1", grammar);
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    }); 

    describe('2a. Empty string: T_t1(t1:"")', function() {
        let grammar: Grammar = t1("");
        grammar = Taper("t1", grammar);
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{}]);
    }); 
    
    describe('2b. Epsilon alone', function() {
        let grammar: Grammar = Epsilon();
        //grammar = Taper("t1", grammar);
        //testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{}]);
    }); 
    
    describe('3a. T_t1(T_t2(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Taper("t2", grammar);
        grammar = Taper("t1", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 
    
    describe('3b. T_t2(T_t1(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Taper("t1", grammar);
        grammar = Taper("t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 

    describe('4a. T_t2(T_t1(t1:hello+t2:""))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2(""));
        grammar = Taper("t1", grammar);
        grammar = Taper("t2", grammar);
        console.log(grammar.id);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello"}], VERBOSE_DEBUG);
    }); 

    describe('4b. T_t2(T_t1(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Taper("t1", grammar);
        grammar = Taper("t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 
});