
import { Seq, Uni, Join, Filter, Empty } from "../src/stateMachine";
import { t1, t2, t3, testGenerateAndSample } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Filter t1:hello[t1:hello]', function() {
        const grammar = Filter(t1("hello"), t1("hello"));
        testGenerateAndSample(grammar, [{t1: "hello"}]);
    });

    describe('Filter t1:hello[empty]', function() {
        const grammar = Filter(t1("hello"), Empty());
        testGenerateAndSample(grammar, [{t1:"hello"}]);
    });

    describe('Filter empty[empty]', function() {
        const grammar = Filter(Empty(), Empty());
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Filter empty[t1:hello]', function() {
        const grammar = Filter(Empty(), t1("hello"));
        testGenerateAndSample(grammar, []);
    });

    describe('Filter t1:h[t1:hello]', function() {
        const grammar = Filter(t1("h"), t1("hello"));
        testGenerateAndSample(grammar, []);
    });

    describe('Filter t1:hello[t1:h]', function() {
        const grammar = Filter(t1("hello"), t1("h"));
        testGenerateAndSample(grammar, []);
    });
    
    describe('Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, []);
    }); 

    describe('Filter (t1:hi+t2:foo)[t1:hello]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("foo")), t1("hi"));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "foo"}]);
    });
    
    describe('Filter t1:hello[t1:hello+t2:foo]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, []);
    }); 
    
    describe('Filter (t1:hi+t2:world)[t1:hi+t2:world]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("world")),
                             Seq(t1("hi"), t2("world")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "world"}]);
    });

    describe('Filter (t2:world+t1:hello)[t1:hello+t2:world]', function() {
        const grammar = Filter(Seq(t2("world"), t1("hello")),
                             Seq(t1("hello"), t2("world")));
        testGenerateAndSample(grammar, [{t1: "hello", t2: "world"}]);
    });

    describe('Filter (t1:hello+t2:world|t1:hello+t2:kitty)[t1:hello]', function() {
        const grammar = Filter(Uni(Seq(t1("hello"), t2("world")),
                                    Seq(t1("hello"), t2("kitty"))),
                                    t1("hello"));
        testGenerateAndSample(grammar, [{t1: "hello", t2: "world"},
                                        {t1: "hello", t2: "kitty"}]);
    });

    describe('Filter (t1:hello+t2:world|t1:hello+t2:kitty)[t1:hello]', function() {
        const grammar = Filter(Filter(Uni(Seq(t1("hello"), t2("world"), t3("!")),
                                    Seq(t1("hello"), t2("kitty"), t3("!"))),
                                    t1("hello")), t3("!"));
        testGenerateAndSample(grammar, [{t1: "hello", t2: "world", t3:"!"},
                                        {t1: "hello", t2: "kitty", t3:"!"}]);
    });

    describe('Filter different-tape alts in same direction', function() {
        const grammar = Filter(Uni(t1("hi"), t2("foo")),
                             Uni(t1("hi"), t2("foo")));
        testGenerateAndSample(grammar, [{t1: "hi"},
                              {t2: "foo"}]);
    });

    describe('Filter different-tape alts in different directions', function() {
        const grammar = Filter(Uni(t2("foo"), t1("hi")),
                             Uni(t1("hi"), t2("foo")));
        testGenerateAndSample(grammar, [{t2: "foo"},
                              {t1: "hi"}]);
    });

    describe('Filter t1:hi+t2:hi[(t1:h+t2:i)+(t1:h+t2:i)]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i"))));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "hi"}]);
    });
    
    describe('Nested filter t1:hi[t1:hi][t1:hi]', function() {
        const grammar = Filter(Filter(t1("hi"), t1("hi")), t1("hi"));
        testGenerateAndSample(grammar, [{t1: "hi"}]);
    });

    describe('Nested filter (t1:hi+t2:wo)[t1:hi][t2:wo]', function() {
        const grammar = Filter(Filter(Seq(t1("hi"), t2("wo")), t1("hi")), t2("wo"));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "wo"}]);
    });

    describe('Nested filter (t1:hi+t2:wo)[t2:wo][t1:hi]', function() {
        const grammar = Filter(Filter(Seq(t1("hi"), t2("wo")), t2("wo")), t1("hi"));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "wo"}]);
    });

});