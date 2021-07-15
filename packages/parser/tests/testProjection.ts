import { Seq, Join, Reveal, Hide, Rename, Filter } from "../src/stateMachine";
import { text, unrelated, testHasTapes, testHasVocab, testGenerateAndSample, t1, t2, t3, makeTestNamespace, testGrammarUncompiled } from './testUtils';

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

    describe('Projection(t1) of t1:hello+t2:foo+t3:world', function() {
        const grammar = Reveal(Seq(t1("hello"), t2("foo"), t3("world")), ["t1"]);
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    
    describe('Projection(text, unrelated) of text:hello+unrelated:foo', function() {
        const grammar = Reveal(Seq(text("hello"), unrelated("foo")), ["text", "unrelated"]);
        testHasTapes(grammar, ["text", "unrelated"]);
        testHasVocab(grammar, {text: 4});
        testHasVocab(grammar, {unrelated: 2});
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
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

    describe('hide(unrelated) of text:hello+unrelated:foo', function() {
        const grammar = Hide(Seq(text("hello"), unrelated("foo")), "unrelated");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('hide(unrelated, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Hide(Seq(text("hello"), unrelated("fooo")), "unrelated"),
                            unrelated("bar"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar + hide(unrelated, text:hello+unrelated:foo)', function() {
        const grammar = Seq(unrelated("bar"), Hide(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('hide(unrelated, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Hide(Seq(text("hello"), unrelated("foo")), "unrelated"),
                             unrelated("bar"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('unrelated:bar & hide(unrelated, text:hello+unrelated:foo) ', function() {
        const grammar = Join(unrelated("bar"), Hide(Seq(text("hello"), unrelated("foo")), "unrelated"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('hide(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Hide(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("foo"))), "unrelated");
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('hide(unrelated) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Hide(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("bar"))), "unrelated");
        testGenerateAndSample(grammar, []);
    });
    
    describe('Nested drop', function() {
        const grammar = Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")), "t1"), "t3");
        testGenerateAndSample(grammar, [{t2: "hello"}]);
    });

    describe('Renane t1=>t3 if hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });

    describe('Rename t2=>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t2", "t3")
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    describe('Rename t1=>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        testHasTapes(grammar, ["t3"]);
        testHasVocab(grammar, {t3: 4});
        testGenerateAndSample(grammar, [{t3: "hello"}]);
    });

    
    describe('Filter using a field and then hide it', function() {
        const grammar = Hide(Filter(Seq(t1("hello"), t2("foo")), t2("foo")), "t2");
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    describe('Hide-filter-hide', function() {
        const grammar = Hide(Filter(Hide(Seq(t1("hello"), t2("foo"), t3("goo")), "t3"), t2("foo")), "t2");
        testGrammarUncompiled(grammar, [{t1: "hello"}]);
    });

});
