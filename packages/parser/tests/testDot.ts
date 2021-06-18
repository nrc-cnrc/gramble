import { Seq, Join, Any, Filter } from "../src/stateMachine";
import { text, testHasTapes, testHasVocab, t1, t2, testGenerateAndSample } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // Tests with the dot on the right side

    describe('text:hi + text:.', function() {
        const grammar = Seq(text("hi"), Any("text"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 2});
        testGenerateAndSample(grammar, [{text: "hih"}, {text: "hii"}]);
    });

    describe('text:. + text:hi', function() {
        const grammar = Seq(Any("text"), text("hi"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 2});
        testGenerateAndSample(grammar, [{text: "hhi"}, {text: "ihi"}]);
    });

    describe('Joining text:h & text:.', function() {
        const grammar = Join(text("h"), Any("text"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 1});
        testGenerateAndSample(grammar, [{text: "h"}]);
    });

    describe('Joining text:hello & text:.ello', function() {
        const grammar = Join(text("hello"), Seq(Any("text"), text('ello')));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:ello & text:.ello', function() {
        const grammar = Join(text("ello"), Seq(Any("text"), text('ello')));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:hello & text:h.llo', function() {
        const grammar = Join(text("hello"), Seq(text("h"), Any("text"), text('llo')));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hllo & text:h.llo', function() {
        const grammar = Join(text("hllo"), Seq(text("h"), Any("text"), text('llo')));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:hello & text:hell.', function() {
        const grammar = Join(text("hello"), Seq(text("hell"), Any("text")));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hell & text:hell.', function() {
        const grammar = Join(text("hell"), Seq(text("hell"), Any("text")));
        testGenerateAndSample(grammar, []);
    });


    // The same tests but with the dot on the left side

    describe('Joining text:. & text:h', function() {
        const grammar = Join(Any("text"), text("h"));
        testGenerateAndSample(grammar, [{text: "h"}]);
    });

    describe('Joining text:.ello & text:hello', function() {
        const grammar = Join(Seq(Any("text"), text('ello')), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:.ello & text:ello', function() {
        const grammar = Join(Seq(Any("text"), text('ello')), text("ello"));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:h.llo & text:hello', function() {
        const grammar = Join(Seq(text("h"), Any("text"), text('llo')), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:h.llo & text:hllo', function() {
        const grammar = Join(Seq(text("h"), Any("text"), text('llo')), text("hllo"));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:hell. & text:hello', function() {
        const grammar = Join(Seq(text("hell"), Any("text")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hell. & text:hell', function() {
        const grammar = Join(Seq(text("hell"), Any("text")), text("hell"));
        testGenerateAndSample(grammar, []);
    });

    describe('Filtering t1:hi & t1:.+t1:.', function() {
        const grammar = Filter(t1("hi"), Seq(Any("t1"), Any("t1")));
        testGenerateAndSample(grammar, [{t1: "hi"}]);
    });

    describe('Filtering t1:hi+t2:hi & t1:.+t1:.+t2:.+t2.', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Any("t1"), Any("t1"), Any("t2"), Any("t2")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "hi"}]);
    });

    describe('Filtering t1:hi+t2:hi & t1:.+t2:.+t1:.+t2.', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Any("t1"), Any("t2"), Any("t1"), Any("t2")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "hi"}]);
    });

    
    describe('Filtering t1:hi+t2:hi & (t1:.+t2:.)+(t1:.+t2.)', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(Any("t1"), Any("t2")), Seq(Any("t1"), Any("t2"))));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "hi"}]);
    });

});
