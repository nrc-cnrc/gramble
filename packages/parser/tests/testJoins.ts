
import { Seq, Uni, Join, Epsilon, CharSet } from "../src/grammars";
import { 
    t1, t2, t3, 
    testHasTapes,
    testGrammar 
} from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Joining t1:hello ⨝ t1:hello', function() {
        const grammar = Join(t1("hello"), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('Joining t1:hello ⨝ t2:foo', function() {
        const grammar = Join(t1("hello"), t2("foo"));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello", t2: "foo"}]);
    });

    describe('Joining ε ⨝ ε', function() {
        const grammar = Join(Epsilon(), Epsilon());
        testGrammar(grammar, [{}]);
    });

    describe('Joining t1:hello ⨝ ε', function() {
        const grammar = Join(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining ε ⨝ t1:hello', function() {
        const grammar = Join(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hello ⨝ t1:hello+t1:""', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello"), t1("")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hello ⨝ t1:""+t1:hello', function() {
        const grammar = Join(t1("hello"), Seq(t1(""), t1("hello")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:""+t1:hello ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1(""), t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hello+t1:"" ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello"), t1("")), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining Seq(t1:hello) ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hello ⨝ Seq(t1:hello)', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining Uni(t1:hello) ⨝ t1:hello', function() {
        const grammar = Join(Uni(t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hello ⨝ Uni(t1:hello)', function() {
        const grammar = Join(t1("hello"), Uni(t1("hello")));
        testGrammar(grammar, [{t1: "hello"}]);
    });


    describe('Joining t1:hi ⨝ t1:hi+t2:bye', function() {
        const grammar = Join(t1("hi"), Seq(t1("hi"), t2("bye")));
        testGrammar(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining (t1:hi ⨝ t1:hi+t2:bye) ⨝ t2:bye+t3:yo', function() {
        const grammar = Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                             Seq(t2("bye"), t3("yo")));
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });


    describe('Joining t1:hello+t1:world ⨝ t1:hello+t1:world', function() {
        const grammar = Join(Seq(t1("hello"), t1("world")),
                             Seq(t1("hello"), t1("world")));
        testGrammar(grammar, [{t1: "helloworld"}]);
    });

    describe('Joining t1:hi+t1:ki ⨝ t1:hi+t2:bi+t1:ki+t2:wo', function() {
        const grammar = Join(Seq(t1("hi"), t1("ki")),
                             Seq(t1("hi"), t2("bi"), t1("ki"), t2("wo")));
        testGrammar(grammar, [{t1: "hiki", t2: "biwo"}]);
    });

    describe('Joining t1:hello+t1:kitty ⨝ (t1:hello+t1:kitty)+(t2:goodbye+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t1("kitty")),
                                 Seq(t2("goodbye"), t2("world"))));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye)+(t1:kitty+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t1("kitty"), t2("world"))));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye)+(t2:world+t1:kitty)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t2("world"), t1("kitty"))));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                 t2("world")));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });


    describe('Joining an alternation ⨝ literal', function() {
        const grammar = Join(Uni(t1("hi"), t1("yo")), Seq(t1("hi"), t2("bye")));
        testGrammar(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining t1:hi+t2:bye ⨝ t2:bye+t3:yo', function() {
        const grammar = Join(Seq(t1("hi"), t2("bye")),
                             Seq(t2("bye"), t3("yo")));
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining t1:hi ⨝ (t1:hi+t2:bye ⨝ t2:bye+t3:yo)', function() {
        const grammar = Join(t1("hi"),
                             Join(Seq(t1("hi"), t2("bye")),
                                  Seq(t2("bye"), t3("yo"))));
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining of (t1:hi ⨝ t1:hi+t2:bye)+t2:world', function() {
        const grammar = Seq(Join(t1("hi"),
                                 Seq(t1("hi"), t2("bye"))),
                            t2("world"));
        testGrammar(grammar, [{t1: "hi", t2: "byeworld"}]);
    });


    describe('Joining t1:hello ⨝ t1:hello+t1:world', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello"), t1("world")));
        testGrammar(grammar, []);
    });

    describe('Joining t1:hello ⨝ t1:helloworld', function() {
        const grammar = Join(t1("hello"), t1("helloworld"));
        testGrammar(grammar, []);
    });

    describe('Joining t1:helloworld ⨝ t1:hello', function() {
        const grammar = Join(t1("helloworld"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Joining t1:hello+t1:world ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello"), t1("world")), t1("hello"));
        testGrammar(grammar, []);
    });


    describe('Joining t1:hi+t2:world ⨝ t1:hi+t2:world', function() {
        const grammar = Join(Seq(t1("hi"), t2("world")),
                             Seq(t1("hi"), t2("world")));
        testGrammar(grammar, [{t1: "hi", t2: "world"}]);
    });

    describe('Joining t2:fo+t1:hi ⨝ t1:hi+t2:fo', function() {
        const grammar = Join(Seq(t2("fo"), t1("hi")),
                             Seq(t1("hi"), t2("fo")));
        testGrammar(grammar, [{t1: "hi", t2: "fo"}]);
    });

    describe('Joining t1:hello ⨝ t1:hello+t2:foo', function() {
        const grammar = Join(t1("hello"), Seq(t1("hello"), t2("foo")));
        testGrammar(grammar, [{t1: "hello", t2: "foo"}]);
    });

    describe('Joining t1:hello ⨝ t2:foo+t1:hello', function() {
        const grammar = Join(t1("hello"), Seq(t2("foo"),t1("hello")));
        testGrammar(grammar, [{t1: "hello", t2: "foo"}]);
    });

    describe('Joining t1:hello+t2:foo ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hello"), t2("foo")), t1("hello"));
        testGrammar(grammar, [{t1: "hello", t2: "foo"}]);
    });

    describe('Joining t2:foo+t1:hello ⨝ t1:hello', function() {
        const grammar = Join(Seq(t2("foo"), t1("hello")), t1("hello"));
        testGrammar(grammar, [{t1: "hello", t2: "foo"}]);
    });

    describe('Joining t1:hello+t2:foo ⨝ t1:hello+t2:bar', function() {
        const grammar = Join(Seq(t1("hello"), t2("foo")),
                             Seq(t1("hello"), t2("bar")));
        testGrammar(grammar, []);
    });

    describe('Joining (t1:hello|t1:goodbye) ⨝ (t1:goodbye|t1:welcome)', function() {
        const grammar = Join(Uni(t1("hello"), t1("goodbye")),
                             Uni(t1("goodbye"), t1("welcome")));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });

    describe('Joining (t1:goodbye|t1:welcome) ⨝ (t1:hello|t1:goodbye)', function() {
        const grammar = Join(Uni(t1("goodbye"), t1("welcome")),
                             Uni(t1("hello"), t1("goodbye")));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });

    describe('Nested joining, leftward', function() {
        const grammar = Join(Join(Uni(t1("hello"), t1("goodbye")),
                                  Uni(t1("goodbye"),  t1("welcome"))),
                             Uni(t1("yo"), t1("goodbye")));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });

    describe('Nested joining, rightward', function() {
        const grammar = Join(Uni(t1("yo"), t1("goodbye")),
                             Join(Uni(t1("hello"), t1("goodbye")),
                                  Uni(t1("goodbye"),  t1("welcome"))));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });


    describe('Joining to joining t1:hello ⨝ t1:hello', function() {
        const grammar = Join(t1("hello"),
                             Join(t1("hello"), t1("hello")));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Joining to joining of (t1:hello|t1:goodbye) ⨝ (t1:goodbye|t1:welcome)', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Uni(t1("hello"), t1("goodbye")),
                                  Uni(t1("goodbye"), t1("welcome"))));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });

    describe('Joining to joining of (t1:goodbye|t1:welcome) ⨝ (t1:hello|t1:goodbye)', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Uni(t1("goodbye"), t1("welcome")),
                                  Uni(t1("hello"), t1("goodbye"))));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });

    describe('Joining to nested joining, leftward', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Join(Uni(t1("hello"), t1("goodbye")),
                                       Uni(t1("goodbye"), t1("welcome"))),
                                  Uni(t1("yo"), t1("goodbye"))));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });

    describe('Joining to nested joining, rightward', function() {
        const grammar = Join(t1("goodbye"),
                             Join(Uni(t1("yo"), t1("goodbye")),
                                  Join(Uni(t1("hello"), t1("goodbye")),
                                       Uni(t1("goodbye"), t1("welcome")))));
        testGrammar(grammar, [{t1: "goodbye"}]);
    });


    describe('Joining to a sequence of alternating sequences ', function() {
        const grammar = Join(t1("hello"),
                             Seq(Uni(Seq(t1("hello"), t2("hola")),
                                     Seq(t1("goodbye"), t2("adios")))));
        testGrammar(grammar, [{t1: "hello", t2: "hola"}]);
    });

    describe('Joining to a sequence of alternating sequences ', function() {
        const grammar = Join(Seq(t1("hello"), t2("adios")),
                             Seq(Uni(Seq(t1("hello"),t2("hola")),
                                     Seq(t1("goodbye"), t2("adios")))));
        testGrammar(grammar, []);
    });

    /*
    TODO: not sure what these should be anymore, reconsider and redo
    
    describe('Joining to an alt of different tapes', function() {
        const grammar = Join(t1("hello"), Uni(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, [{t1: "hello"},
                              {t1: "hello", t2: "foo"}]);
    }); 

    describe('Joining t2-tape alts in same direction', function() {
        const grammar = Join(Uni(t1("hello"), t2("foo")),
                             Uni(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, [{t1: "hello"},
                              {t2: "foo"}]);
    });

    describe('Joining t2-tape alts in different directions', function() {
        const grammar = Join(Uni(t2("foo"), t1("hello")),
                             Uni(t1("hello"), t2("foo")));
        testGenerateAndSample(grammar, [{t2: "foo"},
                              {t1: "hello"}]);
    }); */

    describe('Unfinished join', function() {
        const grammar = Join(t1("h"), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Unfinished join, opposite direction', function() {
        const grammar = Join(t1("hello"), t1("h"));
        testGrammar(grammar, []);
    });

    describe('Unfinished join with t2', function() {
        const grammar = Join(Seq(t1("h"), t2("foo")), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Unfinished join with t2, other direction', function() {
        const grammar = Join(t1("hello"), Seq(t1("h"), t2("foo")));
        testGrammar(grammar, []);
    });

    describe('Identical join of t1:hello interrupted by t2 content', function() {
        const grammar = Join(Seq(t1("h"), t2("foo"), t1("ello")),
                             t1("hello"));
        testGrammar(grammar, [{t1: "hello", t2: "foo"}]);
    });

    describe('t1:[hi] ⨝ t1:[hi]', function() {
        const grammar = Join(CharSet("t1", ["h", "i"]), 
                        CharSet("t1", ["h", "i"]));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [
            {t1: "h"}, 
            {t1: "i"}, 
        ]);
    }); 

    describe('t1:[hi] ⨝ t1:[ij]', function() {
        const grammar = Join(CharSet("t1", ["h", "i"]), 
                        CharSet("t1", ["i", "j"]));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [
            {t1: "i"}, 
        ]);
    }); 

    describe('t1:[chi] ⨝ t1:[hij]', function() {
        const grammar = Join(CharSet("t1", ["c", "h", "i"]), 
                        CharSet("t1", ["h", "i", "j"]));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [
            {t1: "h"},
            {t1: "i"}, 
        ]);
    }); 
    
});
