import { Seq, Uni, Join, Emb, Proj } from "../src/stateMachine";
import { text, testNumOutputs, testHasOutput, t1, t2, t3, unrelated, testDoesntHaveOutput, testHasNoVocab, testHasTapes, testHasVocab } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // Projection tests

    describe('Projection(text) of text:hello', function() {
        const grammar = text("hello");
        const outputs = [...Proj(grammar, "text").generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Projection(text) of text:hello+unrelated:foo', function() {
        const grammar = Proj(Seq(text("hello"), unrelated("foo")), "text");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {"text":4});
        // contrary to what you might expect, there's still a *vocab* for the
        // unrelated tier here; we still have to know what characters are on
        // a particular tape even if this state can't write to that tape.

        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
        testDoesntHaveOutput(outputs, "unrelated", "foo");
    });

    describe('Proj(text, text:hello+unrelated:foo)+unrelated:bar', function() {
        const grammar = Seq(Proj(Seq(text("hello"), unrelated("foo")),"text"), unrelated("bar"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
        testHasOutput(outputs, "unrelated", "bar");
        testDoesntHaveOutput(outputs, "unrelated", "foobar");
        testDoesntHaveOutput(outputs, "unrelated", "foo");
    });

    describe('Proj(text, text:hello+unrelated:foo) & unrelated:bar', function() {
        const grammar = Join(Proj(Seq(text("hello"), unrelated("foo")),"text"), unrelated("bar"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
        testHasOutput(outputs, "unrelated", "bar");
        testDoesntHaveOutput(outputs, "unrelated", "foobar");
        testDoesntHaveOutput(outputs, "unrelated", "foo");
    });

    describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
        const grammar = Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("foo")));
        const outputs = [...Proj(grammar, "text").generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
        testDoesntHaveOutput(outputs, "unrelated", "foo");
    });

    describe('Projection(text) of text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("bar")));
        const outputs = [...Proj(grammar, "text").generate()];
        testNumOutputs(outputs, 0);
    });

});
