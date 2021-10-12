import { Seq, Join, Hide, Rename, Filter, Ns, Embed } from "../src/grammars";
import { t1, t2, t3, testHasTapes, testGrammar } from './testUtils';
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Hide(Seq(t1("hello"), t2("foo")), "t2");
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('hide(t2) of t1:hello', function() {
        const grammar = Hide(t1("hello"), "t2");
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('hide(t2, t1:hello+t2:foo)+t2:bar', function() {
        const grammar = Seq(Hide(Seq(t1("hello"), t2("fooo")), "t2"),
                            t2("bar"));
        testGrammar(grammar, [{t1: "hello", t2: "bar"}]);
    });

    describe('t2:bar + hide(t2, t1:hello+t2:foo)', function() {
        const grammar = Seq(t2("bar"), Hide(Seq(t1("hello"), t2("foo")), "t2"));
        testGrammar(grammar, [{t1: "hello", t2: "bar"}]);
    });

    describe('hide(t2, t1:hello+t2:foo) & t2:bar', function() {
        const grammar = Join(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                             t2("bar"));
        testGrammar(grammar, [{t1: "hello", t2: "bar"}]);
    });

    describe('t2:bar & hide(t2, t1:hello+t2:foo) ', function() {
        const grammar = Join(t2("bar"), Hide(Seq(t1("hello"), t2("foo")), "t2"));
        testGrammar(grammar, [{t1: "hello", t2: "bar"}]);
    });

    describe('hide(t2) of t1:hello+t2:foo & t1:hello+t2:foo', function() {
        const grammar = Hide(Join(Seq(t1("hello"), t2("foo")),
                                  Seq(t1("hello"), t2("foo"))), "t2");
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('hide(t2) of t1:hello+t2:foo & t1:hello+t2:bar', function() {
        const grammar = Hide(Join(Seq(t1("hello"), t2("foo")),
                                  Seq(t1("hello"), t2("bar"))), "t2");
        testGrammar(grammar, []);
    });
    
    describe('Nested drop', function() {
        const grammar = Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")), "t1"), "t3");
        testGrammar(grammar, [{t2: "hello"}]);
    });

    describe('Renane t1=>t3 if hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        //testHasVocab(grammar, {t3: 4});
        testGrammar(grammar, [{t3: "hello"}]);
    });

    describe('Rename t2=>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t2", "t3")
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Rename t1=>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        //testHasVocab(grammar, {t3: 4});
        testGrammar(grammar, [{t3: "hello"}]);
    });

    describe('Filter using a field and then hide it', function() {
        const grammar = Hide(Filter(Seq(t1("hello"), t2("foo")), t2("foo")), "t2");
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Hide-filter-hide', function() {
        const grammar = Hide(Filter(Hide(Seq(t1("hello"), t2("foo"), t3("goo")), "t3"), t2("foo")), "t2");
        testGrammar(grammar, [{t1: "hello"}]);
    });

    
    describe('Hide t2 of symbol t1:hi+t2:world', function() {
        const grammar = Ns("test", 
                        { "a": Seq(t1("hi"), t2("world")),
                          "b": Hide(Embed("a"), "t2") });

        testHasTapes(grammar, ["t1"]);
        testHasTapes(grammar, ["t1"], "b");
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{t1: "hi"}], "b");
    });

});
