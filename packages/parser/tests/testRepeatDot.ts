import { Seq, Rep, Any, Filter, Join, Empty } from "../src/stateMachine";
import { text, testGenerateAndSample } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {
    
    describe('Rep(Any): text:hi+text:.{0,3}', function() {
        const grammar = Seq(text("hi"), Rep(Any("text"), 0, 3));
        testGenerateAndSample(grammar, [ 
                            {text: "hi"},
                            {text: "hii"},
                            {text: "hih"},
                            {text: "hiii"},
                            {text: "hihi"},
                            {text: "hihh"},
                            {text: "hiih"},
                            {text: "hiiih"},
                            {text: "hihih"},
                            {text: "hihhh"},
                            {text: "hiihh"},
                            {text: "hiiii"},
                            {text: "hihii"},
                            {text: "hihhi"},
                            {text: "hiihi"}]);
    });

    describe('Rep(Any): text:.{0,3}+text:hi', function() {
        const grammar = Seq(Rep(Any("text"), 0, 3), text("hi"));
        testGenerateAndSample(grammar, [ 
                            {text: "hi"},
                            {text: "ihi"},
                            {text: "hhi"},
                            {text: "iihi"},
                            {text: "hihi"},
                            {text: "hhhi"},
                            {text: "ihhi"},
                            {text: "iihhi"},
                            {text: "hihhi"},
                            {text: "hhhhi"},
                            {text: "ihhhi"},
                            {text: "iiihi"},
                            {text: "hiihi"},
                            {text: "hhihi"},
                            {text: "ihihi"}]);
    });
    
    describe('Rep(Any): text:.{0,1}+text:hi+text:.{0,1}', function() {
        const grammar = Seq( Rep(Any("text"), 0, 1), text("hi"), Rep(Any("text"), 0, 1));
        testGenerateAndSample(grammar, [ 
                            {text: "hi"},
                            {text: "hhi"},
                            {text: "ihi"},
                            {text: "hih"},
                            {text: "hii"},
                            {text: "hhih"},
                            {text: "hhii"},
                            {text: "ihih"},
                            {text: "ihii"}]);
    });

    describe('Joining text:hi & text:.{0,1}', function() {
        const grammar = Join(text("h"), Rep(Any("text"), 0, 1));
        testGenerateAndSample(grammar, [{text: "h"}]);
    });
    
    describe('Filtering text:.{0,1} & empty()', function() {
        const grammar = Filter(Rep(Any("text"), 0, 2), Empty());
        testGenerateAndSample(grammar, [{}]);
    });
    
    describe('Filtering 0 & text:.{0,1}', function() {
        const grammar = Filter(Empty(), Rep(Any("text"), 0, 2));
        testGenerateAndSample(grammar, [{}]);
    });
    
    describe('Joining text:.{0,1} & empty()', function() {
        const grammar = Join(Rep(Any("text"), 0, 2), Empty());
        testGenerateAndSample(grammar, [{}]);
    });
    
    describe('Joining 0 & text:.{0,1}', function() {
        const grammar = Join(Empty(), Rep(Any("text"), 0, 2));
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Filtering "hello" with he.*', function() {
        const grammar = Filter(text("hello"), Seq(text("he"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Filtering "hello" with .*lo', function() {
        const grammar = Filter(text("hello"), Seq(Rep(Any("text")), text("lo")));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Filtering "hello" with .*e.*', function() {
        const grammar = Filter(text("hello"), Seq(Rep(Any("text")), text("e"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Filtering "hello" with .*l.*', function() {
        const grammar = Filter(text("hello"), Seq(Rep(Any("text")), text("l"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Filtering "hello" with .*h.*', function() {
        const grammar = Filter(text("hello"), Seq(Rep(Any("text")), text("h"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Filtering "hello" with .*o.*', function() {
        const grammar = Filter(text("hello"), Seq(Rep(Any("text")), text("h"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });
});
