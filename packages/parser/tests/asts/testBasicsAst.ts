
import { Epsilon, Seq, Uni } from "../../src/ast";
import { t1, t2, testAstHasTapes, testAst } from './testUtilsAst';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Literal t1:hello', function() {
        const grammar = t1("hello");
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });
    
    describe('Literal t1:""', function() {
        const grammar = t1("");
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{}]);
    });

    describe('Just ε', function() {
        const grammar = Epsilon();
        testAstHasTapes(grammar, []);
        testAst(grammar, [{}]);
    });

    describe('Sequence t1:hello+test:world', function() {
        const grammar = Seq(t1("hello"), t1("world"));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "helloworld"}]);
    });

    describe('Empty sequence', function() {
        const grammar = Seq();
        testAstHasTapes(grammar, []);
        testAst(grammar, [{}]);
    });

    describe('Sequence of one ε', function() {
        const grammar = Seq(Epsilon());
        testAstHasTapes(grammar, []);
        testAst(grammar, [{}]);
    });

    describe('ε+ε', function() {
        const grammar = Seq(Epsilon(), Epsilon());
        testAstHasTapes(grammar, []);
        testAst(grammar, [{}]);
    });

    describe('t1:hello+Seq()', function() {
        const grammar = Seq(t1("hello"), Seq());
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });
    
    
    describe('Seq()+t1:hello', function() {
        const grammar = Seq(Seq(), t1("hello"));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('t1:hello+Seq(ε)', function() {
        const grammar = Seq(t1("hello"), Seq(Epsilon()));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });
    
    describe('t1:hello+(ε+ε)', function() {
        const grammar = Seq(t1("hello"), Seq(Epsilon(), Epsilon()));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+test:""', function() {
        const grammar = Seq(t1("hello"), t1(""));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Sequence test:""+t1:hello', function() {
        const grammar = Seq(t1(""), t1("hello"));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+ε', function() {
        const grammar = Seq(t1("hello"), Epsilon());
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Sequence ε+t1:hello', function() {
        const grammar = Seq(Epsilon(), t1("hello"));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+ε+world', function() {
        const grammar = Seq(t1("hello"), Epsilon(), t1("world"));
        testAst(grammar, [{t1: "helloworld"}]);
    });

    describe('Sequence t1:hello+ε+ε+world', function() {
        const grammar = Seq(t1("hello"), Epsilon(), Epsilon(), t1("world"));
        testAst(grammar, [{t1: "helloworld"}]);
    });

    describe('Sequence t1:ab+t1:cd+test:ef', function() {
        const grammar = Seq(t1("ab"), t1("cd"), t1("ef"));
        testAst(grammar, [{t1: "abcdef"}]);
    });
    
    describe('Nested sequence (t1:ab+t1:cd)+test:ef', function() {
        const grammar = Seq(Seq(t1("ab"), t1("cd")), t1("ef"));
        testAst(grammar, [{t1: "abcdef"}]);
    });

    describe('Nested sequence t1:ab+(t1:cd+t1:ef)', function() {
        const grammar = Seq(t1("ab"), Seq(t1("cd"), t1("ef")));
        testAst(grammar, [{t1: "abcdef"}]);
    });

    describe('Nested sequence t1:ab+(t1:cd)+t1:ef', function() {
        const grammar = Seq(t1("ab"), Seq(t1("cd")), t1("ef"));
        testAst(grammar, [{t1: "abcdef"}]);
    });

    describe('t1:hi+t2:yo', function() {
        const grammar = Seq(t1("hi"), t2("yo"));
        testAstHasTapes(grammar, ["t1", "t2"]);
        testAst(grammar, [{t1: "hi", t2: "yo"}]);
    });

    describe('Alt t1:hello|t1:goodbye', function() {
        const grammar = Uni(t1("hello"), t1("goodbye"));
        testAst(grammar, [{t1: "hello"},
                              {t1: "goodbye"}]);
    });

    describe('Alt t1:hello|ε', function() {
        const grammar = Uni(t1("hello"), Epsilon());
        testAst(grammar, [{t1: "hello"},
                              {}]);
    });

    describe('t1:hello + (t1:world|ε)', function() {
        const grammar = Seq(t1("hello"), Uni(t1("world"), Epsilon()));
        testAst(grammar, [{t1: "hello"},
                                        {t1: "helloworld"}]);
    });

    
    describe('(t1:hello|ε) + t1:world', function() {
        const grammar = Seq(Uni(t1("hello"), Epsilon()), t1("world"));
        testAst(grammar, [{t1: "world"},
                                        {t1: "helloworld"}]);
    });

    describe('Alt of different tapes: t1:hello|t2:goodbye', function() {
        const grammar = Uni(t1("hello"), t2("goodbye"));
        testAstHasTapes(grammar, ["t1", "t2"]);
        testAst(grammar, [{t1: "hello"},
                              {t2: "goodbye"}]);
    });


    describe('Alt of sequences', function() {

        const grammar = Uni(Seq(t1("hello"), t2("kitty")),
                            Seq(t1("goodbye"), t2("world")));
        testAst(grammar, [
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" }
        ]);
    });


    describe('Sequence with alt: (t1:hello|t1:goodbye)+t1:world', function() {
        const grammar = Seq(Uni(t1("hello"), t1("goodbye")), t1("world"));
        testAst(grammar, [{t1: "helloworld"},
                              {t1: "goodbyeworld"}]);
    });

    describe('Sequence with alt: t1:say+(t1:hello|t1:goodbye)', function() {
        const grammar = Seq(t1("say"), Uni(t1("hello"), t1("goodbye")));
        testAst(grammar, [{t1: "sayhello"},
                              {t1: "saygoodbye"}]);
    });

    describe('Sequence with alt: (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
        const grammar = Seq(Uni(t1("hello"), t1("goodbye")), Uni(t1("world"), t1("kitty")));
        testAst(grammar, [{t1: "helloworld"},
                              {t1: "goodbyeworld"},
                              {t1: "hellokitty"},
                              {t1: "goodbyekitty"}]);
    });

    describe('Empty union', function() {
        const grammar = Uni();
        testAstHasTapes(grammar, []);
        testAst(grammar, []);
    });

    describe('Union of one ε', function() {
        const grammar = Uni(Epsilon());
        testAstHasTapes(grammar, []);
        testAst(grammar, [{}]);
    });

    describe('ε|ε', function() {
        const grammar = Uni(Epsilon(), Epsilon());
        testAstHasTapes(grammar, []);
        testAst(grammar, [{}]);
    });

    describe('t1(hello)+(ε|ε)', function() {
        const grammar = Seq(t1("hello"), Uni(Epsilon(), Epsilon()));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });
});