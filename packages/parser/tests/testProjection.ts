import { Seq, Join, Proj } from "../src/stateMachine";
import { text, unrelated, testHasTapes, testHasVocab, testGrammar } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // Projection tests

    describe('Projection(text) of text:hello', function() {
        const grammar = Proj(text("hello"), "text");
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Projection(text) of text:hello+unrelated:foo', function() {
        const grammar = Proj(Seq(text("hello"), unrelated("foo")), "text");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        // Contrary to what you might expect, there's still a *vocab* for the
        // unrelated tier here; we still have to know what characters are on
        // a particular tape even if this state can't write to that tape.
        testHasVocab(grammar, {unrelated: 2});
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Proj(text, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Proj(Seq(text("hello"), unrelated("foo")), "text"),
                            unrelated("bar"));
        testGrammar(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Proj(text, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Proj(Seq(text("hello"), unrelated("foo")),"text"),
                             unrelated("bar"));
        testGrammar(grammar, [{text: "hello", unrelated: "bar"}]);
    });

    describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Proj(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("foo"))), "text");
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Proj(Join(Seq(text("hello"), unrelated("foo")),
                                  Seq(text("hello"), unrelated("bar"))), "text");
        testGrammar(grammar, []);
    });

});
