
import { Epsilon, Seq, Uni } from "../src/grammars";
import { t1, t2, testHasTapes, testGrammar, testHasVocab } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Literal t1:hello', function() {
        const grammar = t1("hello");
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('Literal t1:""', function() {
        const grammar = t1("");
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{}]);
    });

    describe('Just ε', function() {
        const grammar = Epsilon();
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('Sequence t1:hello+t1:world', function() {
        const grammar = Seq(t1("hello"), t1("world"));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "helloworld"}]);
    });

    describe('Empty sequence', function() {
        const grammar = Seq();
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('Sequence of one ε', function() {
        const grammar = Seq(Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('ε+ε', function() {
        const grammar = Seq(Epsilon(), Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('t1:hello+Seq()', function() {
        const grammar = Seq(t1("hello"), Seq());
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    
    describe('Seq()+t1:hello', function() {
        const grammar = Seq(Seq(), t1("hello"));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello+Seq(ε)', function() {
        const grammar = Seq(t1("hello"), Seq(Epsilon()));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello+(ε+ε)', function() {
        const grammar = Seq(t1("hello"), Seq(Epsilon(), Epsilon()));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+test:""', function() {
        const grammar = Seq(t1("hello"), t1(""));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Sequence test:""+t1:hello', function() {
        const grammar = Seq(t1(""), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+ε', function() {
        const grammar = Seq(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Sequence ε+t1:hello', function() {
        const grammar = Seq(Epsilon(), t1("hello"));
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+ε+world', function() {
        const grammar = Seq(t1("hello"), Epsilon(), t1("world"));
        testGrammar(grammar, [{t1: "helloworld"}]);
    });

    describe('Sequence t1:hello+ε+ε+world', function() {
        const grammar = Seq(t1("hello"), Epsilon(), Epsilon(), t1("world"));
        testGrammar(grammar, [{t1: "helloworld"}]);
    });

    describe('Sequence t1:ab+t1:cd+test:ef', function() {
        const grammar = Seq(t1("ab"), t1("cd"), t1("ef"));
        testGrammar(grammar, [{t1: "abcdef"}]);
    });
    
    describe('Nested sequence (t1:ab+t1:cd)+test:ef', function() {
        const grammar = Seq(Seq(t1("ab"), t1("cd")), t1("ef"));
        testGrammar(grammar, [{t1: "abcdef"}]);
    });

    describe('Nested sequence t1:ab+(t1:cd+t1:ef)', function() {
        const grammar = Seq(t1("ab"), Seq(t1("cd"), t1("ef")));
        testGrammar(grammar, [{t1: "abcdef"}]);
    });

    describe('Nested sequence t1:ab+(t1:cd)+t1:ef', function() {
        const grammar = Seq(t1("ab"), Seq(t1("cd")), t1("ef"));
        testGrammar(grammar, [{t1: "abcdef"}]);
    });

    describe('t1:hi+t2:yo', function() {
        const grammar = Seq(t1("hi"), t2("yo"));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hi", t2: "yo"}]);
    });

    describe('Alt t1:hello|t1:goodbye', function() {
        const grammar = Uni(t1("hello"), t1("goodbye"));
        testGrammar(grammar, [{t1: "hello"},
                              {t1: "goodbye"}]);
    });

    describe('Alt t1:hello|ε', function() {
        const grammar = Uni(t1("hello"), Epsilon());
        testGrammar(grammar, [{t1: "hello"},
                              {}]);
    });

    describe('t1:hello + (t1:world|ε)', function() {
        const grammar = Seq(t1("hello"), Uni(t1("world"), Epsilon()));
        testGrammar(grammar, [{t1: "hello"},
                                        {t1: "helloworld"}]);
    });

    
    describe('(t1:hello|ε) + t1:world', function() {
        const grammar = Seq(Uni(t1("hello"), Epsilon()), t1("world"));
        testGrammar(grammar, [{t1: "world"},
                                        {t1: "helloworld"}]);
    });

    describe('Alt of different tapes: t1:hello|t2:goodbye', function() {
        const grammar = Uni(t1("hello"), t2("goodbye"));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [{t1: "hello"},
                              {t2: "goodbye"}]);
    });


    describe('Alt of sequences', function() {

        const grammar = Uni(Seq(t1("hello"), t2("kitty")),
                            Seq(t1("goodbye"), t2("world")));
        testGrammar(grammar, [
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" }
        ]);
    });


    describe('Sequence with alt: (t1:hello|t1:goodbye)+t1:world', function() {
        const grammar = Seq(Uni(t1("hello"), t1("goodbye")), t1("world"));
        testGrammar(grammar, [{t1: "helloworld"},
                              {t1: "goodbyeworld"}]);
    });

    describe('Sequence with alt: t1:say+(t1:hello|t1:goodbye)', function() {
        const grammar = Seq(t1("say"), Uni(t1("hello"), t1("goodbye")));
        testGrammar(grammar, [{t1: "sayhello"},
                              {t1: "saygoodbye"}]);
    });

    describe('Sequence with alt: (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
        const grammar = Seq(Uni(t1("hello"), t1("goodbye")), Uni(t1("world"), t1("kitty")));
        testGrammar(grammar, [{t1: "helloworld"},
                              {t1: "goodbyeworld"},
                              {t1: "hellokitty"},
                              {t1: "goodbyekitty"}]);
    });

    describe('Empty union', function() {
        const grammar = Uni();
        testHasTapes(grammar, []);
        testGrammar(grammar, []);
    });

    describe('Union of one ε', function() {
        const grammar = Uni(Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('ε|ε', function() {
        const grammar = Uni(Epsilon(), Epsilon());
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('t1(hello)+(ε|ε)', function() {
        const grammar = Seq(t1("hello"), Uni(Epsilon(), Epsilon()));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: "hello"}]);
    }); 
});
