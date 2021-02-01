import { Seq, Join, Drop } from "../src/stateMachine";
import { text, unrelated, testHasTapes, testHasVocab, testGrammar } from './testUtils';

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

    describe('Drop(unrelated, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Drop(Seq(text("hello"), unrelated("foo")), "unrelated"),
                             unrelated("bar"));
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

});
