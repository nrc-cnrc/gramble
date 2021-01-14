import {Seq, Uni, Join, Emb, SymbolTable, Any} from "../src/stateMachine";
import { text, testNumOutputs, testHasOutput, testHasTapes, testHasVocab } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // Tests with the dot on the right side

    describe('Joining text:h & text:.', function() {
        const grammar = Join(text("h"), Any("text"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {"text":1});
        
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "h");
    });

    describe('Joining text:hello & text:.ello', function() {
        const grammar = Join(text("hello"), Seq(Any("text"), text('ello')));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {"text":4});
        
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Joining text:ello & text:.ello', function() {
        const grammar = Join(text("ello"), Seq(Any("text"), text('ello')));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Joining text:hello & text:h.llo', function() {
        const grammar = Join(text("hello"), Seq(text("h"), Any("text"), text('llo')));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Joining text:hllo & text:h.llo', function() {
        const grammar = Join(text("hllo"), Seq(text("h"), Any("text"), text('llo')));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Joining text:hello & text:hell.', function() {
        const grammar = Join(text("hello"), Seq(text("hell"), Any("text")));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Joining text:hell & text:hell.', function() {
        const grammar = Join(text("hell"), Seq(text("hell"), Any("text")));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });


    // The same tests but with the dot on the left side

    describe('Joining text:. & text:h', function() {
        const grammar = Join(Any("text"), text("h"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "h");
    });

    describe('Joining text:.ello & text:hello', function() {
        const grammar = Join(Seq(Any("text"), text('ello')), text("hello"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Joining text:.ello & text:ello', function() {
        const grammar = Join(Seq(Any("text"), text('ello')), text("ello"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Joining text:h.llo & text:hello', function() {
        const grammar = Join(Seq(text("h"), Any("text"), text('llo')), text("hello"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Joining text:h.llo & text:hllo', function() {
        const grammar = Join(Seq(text("h"), Any("text"), text('llo')), text("hllo"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Joining text:hell. & text:hello', function() {
        const grammar = Join(Seq(text("hell"), Any("text")), text("hello"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "text", "hello");
    });

    describe('Joining text:hell. & text:hell', function() {
        const grammar = Join(Seq(text("hell"), Any("text")), text("hell"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

});
