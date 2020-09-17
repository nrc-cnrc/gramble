
import { Seq, Uni, Join, Emb, Proj, Rep } from "../src/stateMachine";
import { text, testNumOutputs, testHasOutput, t1, t2, t3, unrelated, testDoesntHaveOutput } from './testUtils';

describe('Text with between 1 and 4 Os: text:o{1,4}', function() {
    const grammar = Rep(text("o"), 1, 4);
    const outputs = [...grammar.generate()];
    
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "o");
    testHasOutput(outputs, "text", "oo");
    testHasOutput(outputs, "text", "ooo");
    testHasOutput(outputs, "text", "oooo");
});

describe('Hello with between 1 and 4 Os: text:hell+text:o{1,4}', function() {
    const grammar = Seq(text("hell"), Rep(text("o"), 1, 4));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "helloo");
    testHasOutput(outputs, "text", "hellooo");
    testHasOutput(outputs, "text", "helloooo");
});


describe('Hello with between 0 and 1 Os: text:hell+text:o{0,1}', function() {
    const grammar = Seq(text("hell"), Rep(text("o"), 0, 1));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hell");
    testHasOutput(outputs, "text", "hello");
});


describe('Hello with between 1 and 4 Hs: text:h{1,4}+text(ello)', function() {
    const grammar = Seq(Rep(text("h"), 1, 4), text("ello"));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "hhello");
    testHasOutput(outputs, "text", "hhhello");
    testHasOutput(outputs, "text", "hhhhello");
});


describe('Hello with between 0 and 1 Hs: text:h{0,1}+text(ello)', function() {
    const grammar = Seq(Rep(text("h"), 0, 1), text("ello"));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "ello");
    testHasOutput(outputs, "text", "hello");
});


describe('Joining "hhello" & Hello with between 1 and 4 Hs', function() {
    const grammar = Join(text("hhello"), Seq(Rep(text("h"), 1, 4), text("ello")));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hhello");
});

describe('Joining hello with between 1 and 4 Hs and "hhello"', function() {
    const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello")), text("hhello"));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hhello");
});


describe('Joining hello with between 1 and 4 Hs and the same', function() {
    const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello")), Seq(Rep(text("h"), 1, 4), text("ello")));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "hhello");
    testHasOutput(outputs, "text", "hhhello");
    testHasOutput(outputs, "text", "hhhhello");
});


describe('Joining hello with between 1 and 4 Hs and the same, with unrelated "world"', function() {
    const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello"), unrelated("world")), Seq(Rep(text("h"), 1, 4), text("ello"), unrelated("world")));
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "hhello");
    testHasOutput(outputs, "text", "hhhello");
    testHasOutput(outputs, "text", "hhhhello");
    testHasOutput(outputs, "unrelated", "world");
});


describe('Text with between 1 and 4 NAs: text:na{1,4}', function() {
    const grammar = Rep(text("na"), 1, 4);
    const outputs = [...grammar.generate()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "na");
    testHasOutput(outputs, "text", "nana");
    testHasOutput(outputs, "text", "nanana");
    testHasOutput(outputs, "text", "nananana");
    testDoesntHaveOutput(outputs, "text", "n");
    testDoesntHaveOutput(outputs, "text", "nan");
});