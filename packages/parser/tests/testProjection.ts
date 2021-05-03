import { Seq, Join, Reveal, Hide, Rename } from "../src/stateMachine";
import { text, unrelated, testHasTapes, testHasVocab, testGenerateAndSample, t1, t2, t3 } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // Projection tests
 
    describe('Projection(text) of text:hello', function() {
        const grammar = Reveal(text("hello"), ["text"]);
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Projection(text) of text:hello+unrelated:foo', function() {
        const grammar = Reveal(Seq(text("hello"), unrelated("foo")), ["text"]);
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Proj(text, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Reveal(Seq(text("hello"), unrelated("foo")), ["text"]),
                            unrelated("bar"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar + proj(text, text:hello+unrelated:foo)', function() {
        const grammar = Seq(unrelated("bar"), Reveal(Seq(text("hello"), unrelated("foo")), ["text"]));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Proj(text, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Reveal(Seq(text("hello"), unrelated("foo")),["text"]),
                             unrelated("bar"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar & proj(text, text:hello+unrelated:foo)', function() {
        const grammar = Join(unrelated("bar"), Reveal(Seq(text("hello"), unrelated("foo")), ["text"]));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Reveal(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("foo"))), ["text"]);
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Reveal(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("bar"))), ["text"]);
        testGenerateAndSample(grammar, []);
    });

    describe('Nested projection(text) of text:hello', function() {
        const grammar = Reveal(Reveal(text("hello"), ["text"]), ["text"]);
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    
    describe('Nested projection(text) of text:hello+unrelated:foo', function() {
        const grammar = Reveal(Reveal(Seq(text("hello"), unrelated("foo")), ["text"]), ["text"]);
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Rename t2=>t3 of projection(t1) of t1:hello+t2:foo', function() {
        const grammar = Rename(Reveal(Seq(t1("hello"), t2("foo")), ["t1"]), "t2", "t3");
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    
    describe('Rename t1=>t3 of projection(t1) of t1:hello+t2:foo', function() {
        const grammar = Rename(Reveal(Seq(t1("hello"), t2("foo")), ["t1"]), "t1", "t3");
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo', function() {
        const grammar = Hide(Seq(text("hello"), unrelated("foo")), "unrelated");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Drop(unrelated, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Hide(Seq(text("hello"), unrelated("fooo")), "unrelated"),
                            unrelated("bar"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar + drop(unrelated, text:hello+unrelated:foo)', function() {
        const grammar = Seq(unrelated("bar"), Hide(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('drop(unrelated, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Hide(Seq(text("hello"), unrelated("foo")), "unrelated"),
                             unrelated("bar"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar & drop(unrelated, text:hello+unrelated:foo) ', function() {
        const grammar = Join(unrelated("bar"), Hide(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Hide(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("foo"))), "unrelated");
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Drop(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Hide(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("bar"))), "unrelated");
        testGenerateAndSample(grammar, []);
    });
    
    describe('Nested drop', function() {
        const grammar = Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")), "t1"), "t3");
        testGenerateAndSample(grammar, [{t2: "hello"}]);
    });

    describe('Renane t1=>t3 if drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });

    describe('Rename t2=>t3 of drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t2", "t3")
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    describe('Rename t1=>t3 if drop(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });
});
