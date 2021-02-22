import { Seq, Join, Drop, Rename } from "../src/stateMachine";
import { text, unrelated, testHasTapes, testHasVocab, testGrammar, t1, t2, t3 } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // Projection tests


    describe('Drop(unrelated) of text:hello+unrelated:foo', function() {
        const grammar = Drop(Seq(text("hello"), unrelated("foo")), "unrelated");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        // Contrary to what you might expect, there's still a *vocab* for the
        // unrelated tier here; we still have to know what characters are on
        // a particular tape even if this state can't write to that tape.
        testHasVocab(grammar, {unrelated: 2});
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Drop(unrelated, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Drop(Seq(text("hello"), unrelated("foo")), "unrelated"),
                            unrelated("bar"));
        testGrammar(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    
    describe('unrelated:bar + drop(unrelated, text:hello+unrelated:foo)', function() {
        const grammar = Seq(unrelated("bar"), Drop(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGrammar(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('drop(unrelated, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Drop(Seq(text("hello"), unrelated("foo")), "unrelated"),
                             unrelated("bar"));
        testGrammar(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar & drop(unrelated, text:hello+unrelated:foo) ', function() {
        const grammar = Join(unrelated("bar"), Drop(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGrammar(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Drop(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("foo"))), "unrelated");
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Drop(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("bar"))), "unrelated");
        testGrammar(grammar, []);
    });
    
    describe('Nested drop', function() {
        const grammar = Drop(Drop(Seq(t1("foo"), t2("hello"), t3("bar")), "t1"), "t3");
        testGrammar(grammar, [{t2: "hello"}]);
    });

    describe('Renane t1=>t3 if drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Drop(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testHasVocab(grammar, {t2: 2});
        testGrammar(grammar, [{t3: "hello"}]);
    });

    
    describe('Rename t2=>t3 of drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Drop(Seq(t1("hello"), t2("foo")), "t2"), "t2", "t3")
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testHasVocab(grammar, {t3: 2});
        testGrammar(grammar, [{t1: "hello"}]);
    });

});
