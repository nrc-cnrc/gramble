
import {
    CharSet, Epsilon, Grammar, Priority, Seq, Uni,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, testHasVocab, testGrammar,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Literal t1:hello, priority t1', function() {
        let grammar: Grammar = t1("hello");
        grammar = Priority(["t1"], grammar);
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}], VERBOSE_DEBUG);
    });

    describe('2a. t1:hello+t2:world, priority t1>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Priority(["t1", "t2"], grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}]);
    });

    describe('2b. t1:hello+t2:world, priority t2>t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Priority(["t2", "t1"], grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}]);
    });

    describe('3a. t1:hello+t2:world+t3:!, priority t1>t2>t3', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Priority(["t1", "t2", "t3"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('3b. t1:hello+t2:world+t3:!, priority t1>t3>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Priority(["t1", "t3", "t2"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('3c. t1:hello+t2:world+t3:!, priority t2>t1>t3', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Priority(["t2", "t1", "t3"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('3d. t1:hello+t2:world+t3:!, priority t2>t3>t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Priority(["t2", "t3", "t1"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('3e. t1:hello+t2:world+t3:!, priority t3>t1>t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Priority(["t3", "t1", "t2"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });
    
    describe('3f. t1:hello+t2:world+t3:!, priority t3>t2>t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"), t3("!"));
        grammar = Priority(["t3", "t2", "t1"], grammar);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world', t3: "!"}]);
    });

    /*
    describe('4a. Partial priority: t1:hello+t2:world, priority t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Priority(["t1"], grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}]);
    });

    describe('4b. Partial priority: t1:hello+t2:world, priority t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Priority(["t2"], grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}]);
    });
    
    describe('5a. Nested priority: t1:hello+t2:world, priority t1, priority t2', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Priority(["t1"], grammar);
        grammar = Priority(["t2"], grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}]);
    });
    
    describe('5b. Nested priority: t1:hello+t2:world, priority t2, priority t1', function() {
        let grammar: Grammar = Seq(t1("hello"), t2("world"));
        grammar = Priority(["t2"], grammar);
        grammar = Priority(["t1"], grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}]);
    });
    */
});