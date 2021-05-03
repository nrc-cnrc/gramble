import { Seq, Join, Drop, Rename } from "../src/stateMachine";
import { text, unrelated, testHasTapes, testHasVocab, testGenerateAndSample, t1, t2, t3, testGrammarUncompiled } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    
    describe('Drop(unrelated) of text:hello+unrelated:foo', function() {
        const grammar = Drop(Seq(text("hello"), unrelated("foo")), "unrelated");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGrammarUncompiled(grammar, [{text: "hello"}]);
    });

    describe('Drop(unrelated, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Drop(Seq(text("hello"), unrelated("fooo")), "unrelated"),
                            unrelated("bar"));
        testGrammarUncompiled(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar + drop(unrelated, text:hello+unrelated:foo)', function() {
        const grammar = Seq(unrelated("bar"), Drop(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('drop(unrelated, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Drop(Seq(text("hello"), unrelated("foo")), "unrelated"),
                             unrelated("bar"));
        testGrammarUncompiled(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar & drop(unrelated, text:hello+unrelated:foo) ', function() {
        const grammar = Join(unrelated("bar"), Drop(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Drop(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("foo"))), "unrelated");
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Drop(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("bar"))), "unrelated");
        testGenerateAndSample(grammar, []);
    });
    
    describe('Nested drop', function() {
        const grammar = Drop(Drop(Seq(t1("foo"), t2("hello"), t3("bar")), "t1"), "t3");
        testGenerateAndSample(grammar, [{t2: "hello"}]);
    });

    describe('Renane t1=>t3 if drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Drop(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });

    
    describe('Rename t2=>t3 of drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Drop(Seq(t1("hello"), t2("foo")), "t2"), "t2", "t3")
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    describe('Rename t1=>t3 if drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Drop(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });
    
});
