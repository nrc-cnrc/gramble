
import { Seq, Uni, Join, Semijoin } from "../src/stateMachine";
import { text, t1, t2, t3, unrelated, testHasTapes, testHasVocab, testGrammar } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Joining text:hello & text:hello', function() {
        const grammar = Join(text("hello"), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    
    describe('Joining text:hello & unrelated:foo', function() {
        const grammar = Join(text("hello"), unrelated("foo"));
        testHasTapes(grammar, ["text", "unrelated"]);
        testHasVocab(grammar, {text: 4, unrelated: 2});
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });


    describe('Joining text:hello & text:hello+text:<emtpy>', function() {
        const grammar = Join(text("hello"), Seq(text("hello"), text("")));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello & text:<emtpy>+text:hello', function() {
        const grammar = Join(text("hello"), Seq(text(""), text("hello")));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining text:<emtpy>+text:hello & text:hello', function() {
        const grammar = Join(Seq(text(""), text("hello")), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello+text:<emtpy> & text:hello', function() {
        const grammar = Join(Seq(text("hello"), text("")), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining Seq(text:hello) & text:hello', function() {
        const grammar = Join(Seq(text("hello")), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello & Seq(text:hello)', function() {
        const grammar = Join(text("hello"), Seq(text("hello")));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining Uni(text:hello) & text:hello', function() {
        const grammar = Join(Uni(text("hello")), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello & Uni(text:hello)', function() {
        const grammar = Join(text("hello"), Uni(text("hello")));
        testGrammar(grammar, [{text: "hello"}]);
    });


    describe('Joining t1:hi & t1:hi+t2:bye', function() {
        const grammar = Join(t1("hi"), Seq(t1("hi"), t2("bye")));
        testGrammar(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining (t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
        const grammar = Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                             Seq(t2("bye"), t3("yo")));
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });


    describe('Joining text:hello+text:world & text:hello+text:world', function() {
        const grammar = Join(Seq(text("hello"), text("world")),
                             Seq(text("hello"), text("world")));
        testGrammar(grammar, [{text: "helloworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & t1:hello+t2:goodbye+t1:kitty+t2:world', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(t1("hello"), t2("goodbye"), t1("kitty"), t2("world")));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
});

    describe('Joining t1:hello+t1:kitty & (t1:hello+t1:kitty)+(t2:goodbye+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t1("kitty")),
                                 Seq(t2("goodbye"), t2("world"))));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye)+(t1:kitty+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t1("kitty"), t2("world"))));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye)+(t2:world+t1:kitty)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t2("world"), t1("kitty"))));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                 t2("world")));
        testGrammar(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });


    describe('Joining an alternation & literal', function() {
        const grammar = Join(Uni(t1("hi"), t1("yo")), Seq(t1("hi"), t2("bye")));
        testGrammar(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining t1:hi & (t1:hi+t2:bye & t2:bye+t3:yo)', function() {
        const grammar = Join(t1("hi"),
                             Join(Seq(t1("hi"), t2("bye")),
                                  Seq(t2("bye"), t3("yo"))));
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining of (t1:hi & t1:hi+t2:bye)+t2:world', function() {
        const grammar = Seq(Join(t1("hi"),
                                 Seq(t1("hi"), t2("bye"))),
                            t2("world"));
        testGrammar(grammar, [{t1: "hi", t2: "byeworld"}]);
    });


    describe('Joining text:hello & text:hello+text:world', function() {
        const grammar = Join(text("hello"), Seq(text("hello"), text("world")));
        testGrammar(grammar, []);
    });

    describe('Joining text:hello & text:helloworld', function() {
        const grammar = Join(text("hello"), text("helloworld"));
        testGrammar(grammar, []);
    });

    describe('Joining text:helloworld & text:hello', function() {
        const grammar = Join(text("helloworld"), text("hello"));
        testGrammar(grammar, []);
    });

    describe('Joining text:hello+text:world & text:hello', function() {
        const grammar = Join(Seq(text("hello"), text("world")), text("hello"));
        testGrammar(grammar, []);
    });


    describe('Joining text:hi+unrelated:world & text:hi+unrelated:world', function() {
        const grammar = Join(Seq(text("hi"), unrelated("world")),
                             Seq(text("hi"), unrelated("world")));
        testGrammar(grammar, [{text: "hi", unrelated: "world"}]);
    });

    describe('Joining unrelated:world+text:hello & text:hello+unrelated:world', function() {
        const grammar = Join(Seq(unrelated("world"), text("hello")),
                             Seq(text("hello"), unrelated("world")));
        testGrammar(grammar, [{text: "hello", unrelated: "world"}]);
    });


    describe('Joining text:hello & text:hello+unrelated:foo', function() {
        const grammar = Join(text("hello"), Seq(text("hello"), unrelated("foo")));
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining text:hello & unrelated:foo+text:hello', function() {
        const grammar = Join(text("hello"), Seq(unrelated("foo"),text("hello")));
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining text:hello+unrelated:foo & text:hello', function() {
        const grammar = Join(Seq(text("hello"), unrelated("foo")), text("hello"));
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining +unrelated:foo+text:hello & text:hello', function() {
        const grammar = Join(Seq(unrelated("foo"), text("hello")), text("hello"));
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });


    describe('Joining text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Join(Seq(text("hello"), unrelated("foo")),
                             Seq(text("hello"), unrelated("bar")));
        testGrammar(grammar, []);
    });

    describe('Joining (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
        const grammar = Join(Uni(text("hello"), text("goodbye")),
                             Uni(text("goodbye"), text("welcome")));
        testGrammar(grammar, [{text: "goodbye"}]);
    });

    describe('Joining (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
        const grammar = Join(Uni(text("goodbye"), text("welcome")),
                             Uni(text("hello"), text("goodbye")));
        testGrammar(grammar, [{text: "goodbye"}]);
    });

    describe('Nested joining, leftward', function() {
        const grammar = Join(Join(Uni(text("hello"), text("goodbye")),
                                  Uni(text("goodbye"),  text("welcome"))),
                             Uni(text("yo"), text("goodbye")));
        testGrammar(grammar, [{text: "goodbye"}]);
    });

    describe('Nested joining, rightward', function() {
        const grammar = Join(Uni(text("yo"), text("goodbye")),
                             Join(Uni(text("hello"), text("goodbye")),
                                  Uni(text("goodbye"),  text("welcome"))));
        testGrammar(grammar, [{text: "goodbye"}]);
    });


    describe('Joining to joining text:hello & text:hello', function() {
        const grammar = Join(text("hello"),
                             Join(text("hello"), text("hello")));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Joining to joining of (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
        const grammar = Join(text("goodbye"),
                             Join(Uni(text("hello"), text("goodbye")),
                                  Uni(text("goodbye"), text("welcome"))));
        testGrammar(grammar, [{text: "goodbye"}]);
    });

    describe('Joining to joining of (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
        const grammar = Join(text("goodbye"),
                             Join(Uni(text("goodbye"), text("welcome")),
                                  Uni(text("hello"), text("goodbye"))));
        testGrammar(grammar, [{text: "goodbye"}]);
    });

    describe('Joining to nested joining, leftward', function() {
        const grammar = Join(text("goodbye"),
                             Join(Join(Uni(text("hello"), text("goodbye")),
                                       Uni(text("goodbye"), text("welcome"))),
                                  Uni(text("yo"), text("goodbye"))));
        testGrammar(grammar, [{text: "goodbye"}]);
    });

    describe('Joining to nested joining, rightward', function() {
        const grammar = Join(text("goodbye"),
                             Join(Uni(text("yo"), text("goodbye")),
                                  Join(Uni(text("hello"), text("goodbye")),
                                       Uni(text("goodbye"), text("welcome")))));
        testGrammar(grammar, [{text: "goodbye"}]);
    });


    describe('Joining to a sequence of alternating sequences ', function() {
        const grammar = Join(text("hello"),
                             Seq(Uni(Seq(text("hello"), unrelated("hola")),
                                     Seq(text("goodbye"), unrelated("adios")))));
        testGrammar(grammar, [{text: "hello", unrelated: "hola"}]);
    });

    describe('Joining to a sequence of alternating sequences ', function() {
        const grammar = Join(Seq(text("hello"), unrelated("adios")),
                             Seq(Uni(Seq(text("hello"),unrelated("hola")),
                                     Seq(text("goodbye"), unrelated("adios")))));
        testGrammar(grammar, []);
    });

    describe('Joining to an alt of different tiers', function() {
        const grammar = Join(text("hello"), Uni(text("hello"), unrelated("foo")));
        testGrammar(grammar, [{text: "hello"},
                              {text: "hello", unrelated: "foo"}]);
    });


    describe('Joining unrelated-tier alts in same direction', function() {
        const grammar = Join(Uni(text("hello"), unrelated("foo")),
                             Uni(text("hello"), unrelated("foo")));
        testGrammar(grammar, [{text: "hello"},
                              {unrelated: "foo"},
                              {text: "hello", unrelated: "foo"},
                              {text: "hello", unrelated: "foo"}]);
    });

    describe('Joining unrelated-tier alts in different directions', function() {
        const grammar = Join(Uni(unrelated("foo"), text("hello")),
                             Uni(text("hello"), unrelated("foo")));
        testGrammar(grammar, [{unrelated: "foo"},
                              {text: "hello"},
                              {text: "hello", unrelated: "foo"},
                              {text: "hello", unrelated: "foo"}]);
    });
    /*
    describe('Repetition bug with unrelated text', function() {
        const grammar = Join(Seq(Uni(text("h"), text("hh")), unrelated("world")), Seq(Uni(text("h"), text("hh")), unrelated("world")));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 2);
    });
    */

    describe('Unfinished join', function() {
        const grammar = Join(text("h"), text("hello"));
        testGrammar(grammar, []);
    });

    describe('Unfinished join, opposite direction', function() {
        const grammar = Join(text("hello"), text("h"));
        testGrammar(grammar, []);
    });

    describe('Unfinished join with unrelated', function() {
        const grammar = Join(Seq(text("h"), unrelated("foo")), text("hello"));
        testGrammar(grammar, []);
    });

    describe('Unfinished join with unrelated, other direction', function() {
        const grammar = Join(text("hello"), Seq(text("h"), unrelated("foo")));
        testGrammar(grammar, []);
    });

    describe('Identical join of text:hello interrupted by unrelated content', function() {
        const grammar = Join(Seq(text("h"), unrelated("foo"), text("ello")),
                             text("hello"));
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });
    
    describe('Left semijoin of text:hello & text:hello', function() {
        const grammar = Semijoin(text("hello"), text("hello"));
        const outputs = [...grammar.generate()];
        testGrammar(grammar, [{text: "hello"}]);
    });

    
    describe('Left semijoin of text:h & text:hello', function() {
        const grammar = Semijoin(text("h"), text("hello"));
        const outputs = [...grammar.generate()];
        testGrammar(grammar, []);
    });

    
    describe('Left semijoin of text:hello+unrelated:foo & text:hello', function() {
        const grammar = Semijoin(Seq(text("hello"), unrelated("foo")), text("hello"));
        const outputs = [...grammar.generate()];
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });
    
    describe('Left semijoin of text:hello & text:hello+unrelated:foo', function() {
        const grammar = Semijoin(text("hello"), Seq(text("hello"), unrelated("foo")));
        const outputs = [...grammar.generate()];
        testGrammar(grammar, []);
    });
});
