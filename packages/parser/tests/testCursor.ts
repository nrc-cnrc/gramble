
import {
    Epsilon, Grammar, Cursor, Seq, Collection, Embed, Uni,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, testGrammar,
} from "./testUtil";

import {
    SILENT,
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

    describe('7a. Cursor inside an embed', function() {
        let grammar: Grammar = Collection({
            "a": Cursor("t1", t1("hello")),
            "b": Embed("a")
        });
        testHasTapes(grammar, ["t1"], "b");
        testGrammar(grammar, [{t1: 'hello'}], SILENT, "b");
    });

    describe('7b. Cursor inside an embed, used in multi-tape context', function() {
        let grammar: Grammar = Collection({
            "a": Cursor("t1", t1("hello")),
            "b": Cursor("t2", Seq(Embed("a"), t2("world")))
        });
        testHasTapes(grammar, ["t1", "t2"], "b");
        testGrammar(grammar, [{t1: 'hello', t2: 'world'}], SILENT, "b");
    });

    describe('8. Cursors around alternations', function() {
        let grammar: Grammar = Seq(Uni(t1("hello"), t1("goodbye")), 
                                   Uni(t2("world"), t2("kitty")));
        grammar = Cursor("t1", grammar);
        grammar = Cursor("t2", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'hello', t2: 'world'},
            {t1: 'goodbye', t2: 'world'},
            {t1: 'hello', t2: 'kitty'},
            {t1: 'goodbye', t2: 'kitty'}
        ]);
    });

    describe('9a. Cursors inside alternations', function() {
        let grammar: Grammar = Uni(Cursor("t1", t1("hello")), 
                                   Cursor("t2", t2("world")));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'hello'}, 
            {t2: 'world'},
        ]);
    });

    describe('9b. Cursors inside alternations', function() {
        let grammar: Grammar = Uni(Cursor("t1", t1("hello")), 
                                   Cursor("t2", t2("world")));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'hello'}, 
            {t2: 'world'},
        ]);
    });

    describe('10. Irrelevant cursor', function() {
        let grammar: Grammar = Cursor("t2", (Cursor("t1", t1("hello"))));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [
            {t1: 'hello'}, 
        ]);
    });

    describe('11a. Repeated cursor', function() {
        let grammar: Grammar = Cursor("t1", (Cursor("t1", t1("hello"))));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [
            {t1: 'hello'}, 
        ]);
    });
    
    describe('11b. Repeated cursor, complex', function() {
        // there's a potential bug about nested cursors operating on 
        // sequences, but drawing it out is tricky because of how 
        // optimizations turn simple sequences into literals where 
        // possible and then treat them atomically.  here i'm stymieing 
        // those optimizations by interleaving two tapes, but that's 
        // all t2 is doing here, the test is really just for t1.  if both
        // Cursors attempt to operate on the sequence, the result will be 
        // t1:elhlo rather than t1:hello.
        let grammar: Grammar = Seq(t1("h"), t2("w"), t1("e"), t2("o"), t1("l"), 
                                    t2("r"), t1("l"), t2("l"), t1("o"), t2("d"));
        grammar = Cursor("t1", grammar);
        grammar = Cursor("t1", grammar);
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'hello', t2: 'world'}, 
        ], VERBOSE_DEBUG);
    });
});