
import { Seq, Uni, Intersect, Epsilon, GrammarComponent, Rep } from "../src/grammars";
import { t1, t2, testGrammar } from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";

type Test = { "desc": string, "grammar": GrammarComponent, "results": StringDict[] };

const TESTS: Test[] = [

    {
        "desc":    "Intersecting t1:hello & t1:hello",
        "grammar": Intersect(t1("hello"), t1("hello")),
        "results": [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello & t2:foo',
        "grammar":  Intersect(t1("hello"), t2("foo")),
        "results":  []
    },

    {
        "desc":     'Intersecting ε & ε',
        "grammar":  Intersect(Epsilon(), Epsilon()),
        "results":  [{}]
    },

    {
        "desc":     'Intersecting t1:hello & ε',
        "grammar":  Intersect(t1("hello"), Epsilon()),
        "results":  []
    },

    {
        "desc":     'Intersecting ε & t1:hello',
        "grammar":  Intersect(Epsilon(), t1("hello")),
        "results":  []
    },
    
    {
        "desc":     'Intersecting ε & (t1:hello)*',
        "grammar":  Intersect(Epsilon(), Rep(t1("hello"))),
        "results":  [{}]
    },

    {
        "desc":     'Intersecting t1:hello & t1:hello+t1:""',
        "grammar":  Intersect(t1("hello"), Seq(t1("hello"), t1(""))),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello & t1:""+t1:hello',
        "grammar":  Intersect(t1("hello"), Seq(t1(""), t1("hello"))),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:""+t1:hello & t1:hello',
        "grammar":  Intersect(Seq(t1(""), t1("hello")), t1("hello")),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello+t1:"" & t1:hello',
        "grammar":  Intersect(Seq(t1("hello"), t1("")), t1("hello")),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello & t1:hello+ε',
        "grammar":  Intersect(t1("hello"), Seq(t1("hello"), Epsilon())),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello & ε+t1:hello',
        "grammar":  Intersect(t1("hello"), Seq(Epsilon(), t1("hello"))),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting ε+t1:hello & t1:hello',
        "grammar":  Intersect(Seq(Epsilon(), t1("hello")), t1("hello")),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello+ε & t1:hello',
        "grammar":  Intersect(Seq(t1("hello"), Epsilon()), t1("hello")),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting Seq(t1:hello) & t1:hello',
        "grammar":  Intersect(Seq(t1("hello")), t1("hello")),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hello & Seq(t1:hello)',
        "grammar":  Intersect(t1("hello"), Seq(t1("hello"))),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting Uni(t1:hello) & t1:hello',
        "grammar":  Intersect(Uni(t1("hello")), t1("hello")),
        "results":  [{t1: "hello"}],
    },

    {
        "desc":     'Intersecting t1:hello & Uni(t1:hello)',
        "grammar":  Intersect(t1("hello"), Uni(t1("hello"))),
        "results":  [{t1: "hello"}]
    },

    {
        "desc":     'Intersecting t1:hi & t1:hi+t2:bye',
        "grammar":  Intersect(t1("hi"), Seq(t1("hi"), t2("bye"))),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hi+t2:bye & t1:hi',
        "grammar":  Intersect(Seq(t1("hi"), t2("bye")), t1("hi")),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:helloworld & t1:hello+t1:world',
        "grammar":  Intersect(t1("helloworld"),
                                 Seq(t1("hello"), t1("world"))),
        "results":   [{t1: "helloworld"}]
    },
    
    {
        "desc":     'Intersecting t1:hello+t1:world & t1:helloworld',
        "grammar":  Intersect(Seq(t1("hello"), t1("world")),
                                 t1("helloworld")),
        "results":   [{t1: "helloworld"}]
    },

    {
        "desc":     'Intersecting t1:hello+t1:world & t1:hello+t1:world',
        "grammar":  Intersect(Seq(t1("hello"), t1("world")),
                                 Seq(t1("hello"), t1("world"))),
        "results":   [{t1: "helloworld"}]
    },

    {
        "desc":     'Intersecting (t1:hi|t1:bye) & (t1:hi|t1:yo)',
        "grammar":  Intersect(Uni(t1("hi"), t1("bye")), Uni(t1("hi"), t1("yo"))),
        "results":  [{t1: "hi"}]
    },

    {
        "desc":     'Intersecting (t1:hi|t1:bye|t1:yo) & (t1:hi|t1:yo|t1:foo)',
        "grammar":  Intersect(Uni(t1("hi"), t1("bye"), t1("yo")), Uni(t1("hi"), t1("yo"), t1("foo"))),
        "results":  [{t1: "hi"}, {t1: "yo"}]
    },

    {
        "desc":     'Intersecting (t1:hi|t2:bye) & (t1:hi|t2:yo)',
        "grammar":  Intersect(Uni(t1("hi"), t1("bye")), Uni(t1("hi"), t1("yo"))),
        "results":  [{t1: "hi"}]
    },

    {
        "desc":     'Intersecting t1:hello & t1:hello+t1:world',
        "grammar":  Intersect(t1("hello"), Seq(t1("hello"), t1("world"))),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hello & t1:helloworld',
        "grammar":  Intersect(t1("hello"), t1("helloworld")),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:helloworld & t1:hello',
        "grammar":  Intersect(t1("helloworld"), t1("hello")),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hello+t1:world & t1:hello',
        "grammar":  Intersect(Seq(t1("hello"), t1("world")), t1("hello")),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hi+t2:world & t1:hi+t2:world',
        "grammar":  Intersect(Seq(t1("hi"), t2("fo")), Seq(t1("hi"), t2("fo"))),
        "results":  [{t1: "hi", t2: "fo"}]
    },

    {
        "desc":    'Intersecting t2:fo+t1:hi & t1:hi+t2:fo',
        "grammar":  Intersect(Seq(t2("fo"), t1("hi")), Seq(t1("hi"), t2("fo"))),
        "results":  [{t1: "hi", t2: "fo"}]
    },

    {
        "desc":     'Intersecting t1:hello & t1:hello+t2:foo',
        "grammar":  Intersect(t1("hello"), Seq(t1("hello"), t2("foo"))),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hello & t2:foo+t1:hello',
        "grammar":  Intersect(t1("hello"), Seq(t2("foo"), t1("hello"))),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hello+t2:foo & t1:hello',
        "grammar":  Intersect(Seq(t1("hello"), t2("foo")), t1("hello")),
        "results":  []
    },

    {
        "desc":     'Intersecting t2:foo+t1:hello & t1:hello',
        "grammar":  Intersect(Seq(t2("foo"), t1("hello")), t1("hello")),
        "results":  []
    },

    {
        "desc":     'Intersecting t1:hello+t2:foo & t1:hello+t2:bar',
        "grammar":  Intersect(Seq(t1("hello"), t2("foo")),
                                 Seq(t1("hello"), t2("bar"))),
        "results":  []
    },
    
    {
        "desc":     'Nested intersection, right-branching',
        "grammar":  Intersect(t1("hi"), Intersect(t1("hi"), t1("hi"))),
        "results":  [{t1: "hi"}]
    },

    {
        "desc":     'Nested intersection, left-branching',
        "grammar":  Intersect(Intersect(t1("hi"), t1("hi")), t1("hi")),
        "results":  [{t1: "hi"}]
    },

    {
        "desc":     'Failed nested intersection, right-branching, v1',
        "grammar":  Intersect(t1("bye"), Intersect(t1("hi"), t1("hi"))),
        "results":  []
    },

    {
        "desc":     'Failed nested intersection, right-branching, v2',
        "grammar":  Intersect(t1("hi"), Intersect(t1("bye"), t1("hi"))),
        "results":  []
    },

    {
        "desc":     'Failed nested intersection, right-branching, v3',
        "grammar":  Intersect(Seq(t1("hi"), t2("bye")), Intersect(t1("hi"), t1("hi"))),
        "results":  []
    },

    {
        "desc":     'Failed nested intersection, right-branching, v4',
        "grammar":  Intersect(t1("hi"), Intersect(Seq(t1("hi"), t2("bye")), t1("hi"))),
        "results":  []
    },

    {
        "desc":     'Failed nested intersection, left-branching, v1',
        "grammar":  Intersect(Intersect(t1("bye"), t1("hi")), t1("hi")),
        "results":  []
    },
    
    {
        "desc":     'Failed nested intersection, left-branching, v2',
        "grammar":  Intersect(Intersect(t1("hi"), t1("hi")), t1("bye")),
        "results":  []
    },
    
    {
        "desc":     'Failed nested intersection, left-branching, v3',
        "grammar":  Intersect(Intersect(Seq(t1("hi"), t2("bye")), t1("hi")), t1("hi")),
        "results":  []
    },
    
    {
        "desc":     'Failed nested intersection, left-branching, v4',
        "grammar":  Intersect(Intersect(t1("hi"), t1("hi")), Seq(t1("hi"), t2("bye"))),
        "results":  []
    },

    {
        "desc":     'Intersecting to an alt of different tapes',
        "grammar":  Intersect(t1("hello"), Uni(t1("hello"), t2("foo"))),
        "results":  [{t1:"hello"}]
    },

    {
        "desc":     'Intersecting different-tape alts in same direction',
        "grammar":  Intersect(Uni(t1("hello"), t2("foo")),
                                 Uni(t1("hello"), t2("foo"))),
        "results":  [{t1: "hello"}, {t2: "foo"}]
    },
    
    {
        "desc":     'Intersecting different-tape alts in different directions',
        "grammar":  Intersect(Uni(t2("foo"), t1("hello")),
                            Uni(t1("hello"), t2("foo"))),
        "results":  [{t1: "hello"}, {t2: "foo"}]
    },

    {
        "desc":     'Unfinished intersection',
        "grammar":  Intersect(t1("h"), t1("hello")),
        "results":  []
    },
    {
        "desc":     'Unfinished intersection, opposite direction',
        "grammar":  Intersect(t1("hello"), t1("h")),
        "results":  []
    },
    {
        "desc":     'Unfinished intersection with t2',
        "grammar":  Intersect(Seq(t1("h"), t2("foo")), Seq(t1("hello"), t2("foo"))),
        "results":  []
    },
    {
        "desc":     'Unfinished intersection with t2, other direction',
        "grammar":  Intersect(Seq(t1("hello"), t2("foo"), t1("hello")), Seq(t1("h"), t2("foo"))),
        "results":  []
    },
    {
        "desc":     'Identical intersection of t1:hello interrupted by t2 content',
        "grammar":  Intersect(Seq(t1("h"), t2("foo"), t1("ello")), Seq(t1("hello"), t2("foo"))),
        "results":  [{t1: "hello", t2: "foo"}]
    },
];

describe(`${path.basename(module.filename)}`, function() {

    for (const test of TESTS) {

        if (!("desc" in test) || test["desc"].trim().length == 0) {
            continue;
        }
        
        describe(test["desc"], function() {

            if (!("grammar" in test)) {
                throw new Error(`Test ${test["desc"]} has no associated grammar`);
            }

            const grammar = test["grammar"];
            
            if (!("results" in test)) {
                throw new Error(`Test ${test["desc"]} has no associated results`);
            }

            testGrammar(grammar, test["results"]);

        });

    }

    /*
    */
});
