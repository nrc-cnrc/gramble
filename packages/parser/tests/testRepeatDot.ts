import { Seq, Rep, Any, Semijoin } from "../src/stateMachine";
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
        const grammar = Seq( Rep(Any("text"), 0, 3), text("hi"));
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

    describe('Rep(Any): text:.{0,3}+text:hi', function() {
        const grammar = Seq( Rep(Any("text"), 0, 3), text("hi"));
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

    describe('Semijoining "hello" with he.*', function() {
        const grammar = Semijoin(text("hello"), Seq(text("he"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Semijoining "hello" with .*lo', function() {
        const grammar = Semijoin(text("hello"), Seq(Rep(Any("text")), text("lo")));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Semijoining "hello" with .*e.*', function() {
        const grammar = Semijoin(text("hello"), Seq(Rep(Any("text")), text("e"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Semijoining "hello" with .*l.*', function() {
        const grammar = Semijoin(text("hello"), Seq(Rep(Any("text")), text("l"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Semijoining "hello" with .*h.*', function() {
        const grammar = Semijoin(text("hello"), Seq(Rep(Any("text")), text("h"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });

    describe('Semijoining "hello" with .*o.*', function() {
        const grammar = Semijoin(text("hello"), Seq(Rep(Any("text")), text("h"), Rep(Any("text"))));
        testGenerateAndSample(grammar, [ 
                            {text: "hello"}]);
    });
    
});
