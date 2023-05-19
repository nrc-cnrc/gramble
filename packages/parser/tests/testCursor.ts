
import {
    Epsilon, Grammar, Cursor, Seq,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, testGrammar,
} from "./testUtil";

import {
    VERBOSE_DEBUG
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. T_t1(t1:hello)', function() {
        let grammar: Grammar = t1("hello");
        grammar = Cursor("t1", grammar);
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    }); 

    describe('2a. Empty string: T_t1(t1:"")', function() {
        let grammar: Grammar = t1("");
        grammar = Cursor("t1", grammar);
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{}]);
    }); 
    
    describe('2b. Epsilon alone', function() {
        let grammar: Grammar = Epsilon();
        //grammar = Priority("t1", grammar);
        //testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{}]);
    }); 
    
    describe('3a. T_t1(T_t2(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Cursor("t2", grammar);
        grammar = Cursor("t1", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 
    
    describe('3b. T_t2(T_t1(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Cursor("t1", grammar);
        grammar = Cursor("t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 

    describe('4a. T_t2(T_t1(t1:hello+t2:""))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2(""));
        grammar = Cursor("t1", grammar);
        grammar = Cursor("t2", grammar);
        console.log(grammar.id);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello"}]);
    }); 

    describe('4b. T_t1(T_t2(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Cursor("t2", grammar);
        grammar = Cursor("t1", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 

    describe('5a. T_t1(t1:hello+t2:""))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2(""));
        grammar = Cursor("t1", grammar);
        console.log(grammar.id);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello"}]);
    }); 

    describe('5b. T_t2(t1:hello+t2:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Cursor("t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "world"}]);
    }); 

    describe('6a. t1:hello+t2:world+t3:!, priority t1>t2>t3', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Cursor(["t1", "t2", "t3"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('6b. t1:hello+t2:world+t3:!, priority t1>t3>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Cursor(["t1", "t3", "t2"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('6c. t1:hello+t2:world+t3:!, priority t2>t1>t3', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Cursor(["t2", "t1", "t3"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('6d. t1:hello+t2:world+t3:!, priority t2>t3>t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Cursor(["t2", "t3", "t1"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('6e. t1:hello+t2:world+t3:!, priority t3>t1>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Cursor(["t3", "t1", "t2"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('6f. t1:hello+t2:world+t3:!, priority t3>t2>t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Cursor(["t3", "t2", "t1"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });

});