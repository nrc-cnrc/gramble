
import { Seq, Uni, Join, Filter, Empty } from "../src/stateMachine";
import { text, t1, t2, t3, unrelated, testHasTapes, testHasVocab, testGenerateAndSample } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Filter text:hello[text:hello]', function() {
        const grammar = Filter(text("hello"), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Filter text:hello[empty]', function() {
        const grammar = Filter(text("hello"), Empty());
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    });
    
    describe('Filter empty[empty]', function() {
        const grammar = Filter(Empty(), Empty());
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Filter empty[text:hello]', function() {
        const grammar = Filter(Empty(), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    });

    describe('Filter text:h[text:hello]', function() {
        const grammar = Filter(text("h"), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    });

    describe('Filter text:hello[text:h]', function() {
        const grammar = Filter(text("hello"), text("h"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    });
    
    describe('Filter text:hello[text:hello+unrelated:foo]', function() {
        const grammar = Filter(text("hello"), Seq(text("hello"), unrelated("foo")));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    }); 

    describe('Filter text:hello+unrelated:foo[text:hello]', function() {
        const grammar = Filter(Seq(text("hello"), unrelated("foo")), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });
    
    describe('Filter text:hello[text:hello+unrelated:foo]', function() {
        const grammar = Filter(text("hello"), Seq(text("hello"), unrelated("foo")));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    }); 
    
    describe('Filter (text:hi+unrelated:world)[text:hi+unrelated:world]', function() {
        const grammar = Filter(Seq(text("hi"), unrelated("world")),
                             Seq(text("hi"), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "hi", unrelated: "world"}]);
    });

    describe('Filter (unrelated:world+text:hello)[text:hello+unrelated:world]', function() {
        const grammar = Filter(Seq(unrelated("world"), text("hello")),
                             Seq(text("hello"), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "world"}]);
    });

    describe('Filter unrelated-tape alts in same direction', function() {
        const grammar = Filter(Uni(text("hello"), unrelated("foo")),
                             Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {unrelated: "foo"}]);
    });

    describe('Filter unrelated-tape alts in different directions', function() {
        const grammar = Filter(Uni(unrelated("foo"), text("hello")),
                             Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{unrelated: "foo"},
                              {text: "hello"}]);
    });

    describe('Filter t1:hi+t2:hi[(t1:h+t2:i)+(t1:h+t2:i)]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i"))));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "hi"}]);
    });

});