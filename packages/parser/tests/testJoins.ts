
import { Seq, Uni, Join, Filter, Empty } from "../src/stateMachine";
import { text, t1, t2, t3, unrelated, testHasTapes, testHasVocab, testGenerateAndSample } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Joining text:hello & text:hello', function() {
        const grammar = Join(text("hello"), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });
    
    describe('Joining text:hello & unrelated:foo', function() {
        const grammar = Join(text("hello"), unrelated("foo"));
        testHasTapes(grammar, ["text", "unrelated"]);
        testHasVocab(grammar, {text: 4, unrelated: 2});
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining empty() & empty()', function() {
        const grammar = Join(Empty(), Empty());
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Joining text:hello & empty()', function() {
        const grammar = Join(text("hello"), Empty());
        testGenerateAndSample(grammar, []);
    });

    describe('Joining empty() & text:hello', function() {
        const grammar = Join(text("hello"), Empty());
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:hello & text:hello+text:""', function() {
        const grammar = Join(text("hello"), Seq(text("hello"), text("")));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello & text:""+text:hello', function() {
        const grammar = Join(text("hello"), Seq(text(""), text("hello")));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:""+text:hello & text:hello', function() {
        const grammar = Join(Seq(text(""), text("hello")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello+text:"" & text:hello', function() {
        const grammar = Join(Seq(text("hello"), text("")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining Seq(text:hello) & text:hello', function() {
        const grammar = Join(Seq(text("hello")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello & Seq(text:hello)', function() {
        const grammar = Join(text("hello"), Seq(text("hello")));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining Uni(text:hello) & text:hello', function() {
        const grammar = Join(Uni(text("hello")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining text:hello & Uni(text:hello)', function() {
        const grammar = Join(text("hello"), Uni(text("hello")));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });


    describe('Joining t1:hi & t1:hi+t2:bye', function() {
        const grammar = Join(t1("hi"), Seq(t1("hi"), t2("bye")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining (t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
        const grammar = Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                             Seq(t2("bye"), t3("yo")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });


    describe('Joining text:hello+text:world & text:hello+text:world', function() {
        const grammar = Join(Seq(text("hello"), text("world")),
                             Seq(text("hello"), text("world")));
        testGenerateAndSample(grammar, [{text: "helloworld"}]);
    });

    describe('Joining t1:hi+t1:ki & t1:hi+t2:bi+t1:ki+t2:wo', function() {
        const grammar = Join(Seq(t1("hi"), t1("ki")),
                             Seq(t1("hi"), t2("bi"), t1("ki"), t2("wo")));
        testGenerateAndSample(grammar, [{t1: "hiki", t2: "biwo"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t1:kitty)+(t2:goodbye+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t1("kitty")),
                                 Seq(t2("goodbye"), t2("world"))));
        testGenerateAndSample(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye)+(t1:kitty+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t1("kitty"), t2("world"))));
        testGenerateAndSample(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye)+(t2:world+t1:kitty)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye")),
                                 Seq(t2("world"), t1("kitty"))));
        testGenerateAndSample(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });

    describe('Joining t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world)', function() {
        const grammar = Join(Seq(t1("hello"), t1("kitty")),
                             Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                 t2("world")));
        testGenerateAndSample(grammar, [{t1: "hellokitty", t2: "goodbyeworld"}]);
    });


    describe('Joining an alternation & literal', function() {
        const grammar = Join(Uni(t1("hi"), t1("yo")), Seq(t1("hi"), t2("bye")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining t1:hi+t2:bye & t2:bye+t3:yo', function() {
        const grammar = Join(Seq(t1("hi"), t2("bye")),
                             Seq(t2("bye"), t3("yo")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining t1:hi & (t1:hi+t2:bye & t2:bye+t3:yo)', function() {
        const grammar = Join(t1("hi"),
                             Join(Seq(t1("hi"), t2("bye")),
                                  Seq(t2("bye"), t3("yo"))));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining of (t1:hi & t1:hi+t2:bye)+t2:world', function() {
        const grammar = Seq(Join(t1("hi"),
                                 Seq(t1("hi"), t2("bye"))),
                            t2("world"));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "byeworld"}]);
    });


    describe('Joining text:hello & text:hello+text:world', function() {
        const grammar = Join(text("hello"), Seq(text("hello"), text("world")));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:hello & text:helloworld', function() {
        const grammar = Join(text("hello"), text("helloworld"));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:helloworld & text:hello', function() {
        const grammar = Join(text("helloworld"), text("hello"));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining text:hello+text:world & text:hello', function() {
        const grammar = Join(Seq(text("hello"), text("world")), text("hello"));
        testGenerateAndSample(grammar, []);
    });


    describe('Joining text:hi+unrelated:world & text:hi+unrelated:world', function() {
        const grammar = Join(Seq(text("hi"), unrelated("world")),
                             Seq(text("hi"), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "hi", unrelated: "world"}]);
    });

    describe('Joining unrelated:fo+text:hi & text:hi+unrelated:fo', function() {
        const grammar = Join(Seq(unrelated("fo"), text("hi")),
                             Seq(text("hi"), unrelated("fo")));
        testGenerateAndSample(grammar, [{text: "hi", unrelated: "fo"}]);
    });

    describe('Joining text:hello & text:hello+unrelated:foo', function() {
        const grammar = Join(text("hello"), Seq(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining text:hello & unrelated:foo+text:hello', function() {
        const grammar = Join(text("hello"), Seq(unrelated("foo"),text("hello")));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining text:hello+unrelated:foo & text:hello', function() {
        const grammar = Join(Seq(text("hello"), unrelated("foo")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining unrelated:foo+text:hello & text:hello', function() {
        const grammar = Join(Seq(unrelated("foo"), text("hello")), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Joining text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
        const grammar = Join(Seq(text("hello"), unrelated("foo")),
                             Seq(text("hello"), unrelated("bar")));
        testGenerateAndSample(grammar, []);
    });

    describe('Joining (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
        const grammar = Join(Uni(text("hello"), text("goodbye")),
                             Uni(text("goodbye"), text("welcome")));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });

    describe('Joining (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
        const grammar = Join(Uni(text("goodbye"), text("welcome")),
                             Uni(text("hello"), text("goodbye")));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });

    describe('Nested joining, leftward', function() {
        const grammar = Join(Join(Uni(text("hello"), text("goodbye")),
                                  Uni(text("goodbye"),  text("welcome"))),
                             Uni(text("yo"), text("goodbye")));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });

    describe('Nested joining, rightward', function() {
        const grammar = Join(Uni(text("yo"), text("goodbye")),
                             Join(Uni(text("hello"), text("goodbye")),
                                  Uni(text("goodbye"),  text("welcome"))));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });


    describe('Joining to joining text:hello & text:hello', function() {
        const grammar = Join(text("hello"),
                             Join(text("hello"), text("hello")));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Joining to joining of (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
        const grammar = Join(text("goodbye"),
                             Join(Uni(text("hello"), text("goodbye")),
                                  Uni(text("goodbye"), text("welcome"))));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });

    describe('Joining to joining of (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
        const grammar = Join(text("goodbye"),
                             Join(Uni(text("goodbye"), text("welcome")),
                                  Uni(text("hello"), text("goodbye"))));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });

    describe('Joining to nested joining, leftward', function() {
        const grammar = Join(text("goodbye"),
                             Join(Join(Uni(text("hello"), text("goodbye")),
                                       Uni(text("goodbye"), text("welcome"))),
                                  Uni(text("yo"), text("goodbye"))));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });

    describe('Joining to nested joining, rightward', function() {
        const grammar = Join(text("goodbye"),
                             Join(Uni(text("yo"), text("goodbye")),
                                  Join(Uni(text("hello"), text("goodbye")),
                                       Uni(text("goodbye"), text("welcome")))));
        testGenerateAndSample(grammar, [{text: "goodbye"}]);
    });


    describe('Joining to a sequence of alternating sequences ', function() {
        const grammar = Join(text("hello"),
                             Seq(Uni(Seq(text("hello"), unrelated("hola")),
                                     Seq(text("goodbye"), unrelated("adios")))));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "hola"}]);
    });

    describe('Joining to a sequence of alternating sequences ', function() {
        const grammar = Join(Seq(text("hello"), unrelated("adios")),
                             Seq(Uni(Seq(text("hello"),unrelated("hola")),
                                     Seq(text("goodbye"), unrelated("adios")))));
        testGenerateAndSample(grammar, []);
    });

    /*
    TODO: not sure what these should be anymore, reconsider and redo
    
    describe('Joining to an alt of different tapes', function() {
        const grammar = Join(text("hello"), Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {text: "hello", unrelated: "foo"}]);
    }); 

    describe('Joining unrelated-tape alts in same direction', function() {
        const grammar = Join(Uni(text("hello"), unrelated("foo")),
                             Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {unrelated: "foo"}]);
    });

    describe('Joining unrelated-tape alts in different directions', function() {
        const grammar = Join(Uni(unrelated("foo"), text("hello")),
                             Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{unrelated: "foo"},
                              {text: "hello"}]);
    }); */

    describe('Unfinished join', function() {
        const grammar = Join(text("h"), text("hello"));
        testGenerateAndSample(grammar, []);
    });

    describe('Unfinished join, opposite direction', function() {
        const grammar = Join(text("hello"), text("h"));
        testGenerateAndSample(grammar, []);
    });

    describe('Unfinished join with unrelated', function() {
        const grammar = Join(Seq(text("h"), unrelated("foo")), text("hello"));
        testGenerateAndSample(grammar, []);
    });

    describe('Unfinished join with unrelated, other direction', function() {
        const grammar = Join(text("hello"), Seq(text("h"), unrelated("foo")));
        testGenerateAndSample(grammar, []);
    });

    describe('Identical join of text:hello interrupted by unrelated content', function() {
        const grammar = Join(Seq(text("h"), unrelated("foo"), text("ello")),
                             text("hello"));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });
    
    describe('Filter of text:hello & text:hello', function() {
        const grammar = Filter(text("hello"), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    
    describe('Filter of text:h & text:hello', function() {
        const grammar = Filter(text("h"), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    });

    describe('Filter of text:hello & text:h', function() {
        const grammar = Filter(text("hello"), text("h"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    });
    
    describe('Filter of text:hello+unrelated:foo & text:hello', function() {
        const grammar = Filter(Seq(text("hello"), unrelated("foo")), text("hello"));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "foo"}]);
    });
    
    describe('Filter of text:hello & text:hello+unrelated:foo', function() {
        const grammar = Filter(text("hello"), Seq(text("hello"), unrelated("foo")));
        const outputs = [...grammar.generate()];
        testGenerateAndSample(grammar, []);
    }); 
    
    describe('Filter of text:hi+unrelated:world & text:hi+unrelated:world', function() {
        const grammar = Filter(Seq(text("hi"), unrelated("world")),
                             Seq(text("hi"), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "hi", unrelated: "world"}]);
    });

    describe('Filter of unrelated:world+text:hello & text:hello+unrelated:world', function() {
        const grammar = Filter(Seq(unrelated("world"), text("hello")),
                             Seq(text("hello"), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "world"}]);
    });

    describe('Filtering unrelated-tape alts in same direction', function() {
        const grammar = Filter(Uni(text("hello"), unrelated("foo")),
                             Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {unrelated: "foo"}]);
    });

    describe('Filtering unrelated-tape alts in different directions', function() {
        const grammar = Filter(Uni(unrelated("foo"), text("hello")),
                             Uni(text("hello"), unrelated("foo")));
        testGenerateAndSample(grammar, [{unrelated: "foo"},
                              {text: "hello"}]);
    });

    describe('Filtering t1:hi+t2:hi & (t1:h+t2:i)+(t1:h+t2:i)', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i"))));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "hi"}]);
    });

});
