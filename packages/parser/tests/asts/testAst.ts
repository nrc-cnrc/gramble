
import { Embed, Epsilon, Lit, Ns, Seq, Uni } from "../../src/ast";
import { testAst, testAstHasTapes, testAstHasSymbols, testAstDoesNotHaveSymbols } from './testUtilsAst';

import * as path from 'path';

const t1 = (s: string) => Lit("t1", s);
const t2 = (s: string) => Lit("t2", s);

describe(`${path.basename(module.filename)}`, function() {

    describe('Literal t1:hello', function() {
        const grammar = t1("hello");
        testAstHasTapes(grammar, [ "t1" ]);
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Sequence t1:hello+t1:world', function() {
        const grammar = Seq(t1("hello"), t1("world"));
        testAstHasTapes(grammar, [ "t1" ]);
        testAst(grammar, [{t1: "helloworld"}]);
    });

    describe('Sequence of one ε', function() {
        const grammar = Seq(Epsilon());
        testAstHasTapes(grammar, [ ]);
        testAst(grammar, [{}]);
    });

    describe('Alt t1:hello|t1:goodbye', function() {
        const grammar = Uni(t1("hello"), t1("goodbye"));
        
        testAstHasTapes(grammar, [ "t1" ]);
        testAst(grammar, [{t1: "hello"},
                            {t1: "goodbye"}]);
    });


    describe('Simple namespace, generating from default symbol', function() {
        const grammar = Ns("myNamespace");
        grammar.addSymbol("x", t1("hello"));
        grammar.qualifyNames();  

        testAstHasSymbols(grammar, [ "myNamespace.x" ]);
        testAstDoesNotHaveSymbols(grammar, [ "x" ]);

        
        testAstHasTapes(grammar, [ "t1" ]);
        testAst(grammar, [{t1: "hello"}]);
    });


    describe('Nested namespaces, generating from default symbols', function() {
        const inner = Ns("innerNamespace");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("outerNamespace");
        outer.addSymbol("innerNamespace", inner);

        testAstHasSymbols(outer, [ "outerNamespace.innerNamespace.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "outerNamespace.x", "innerNamespace.x", "x" ]);

        testAst(outer, [{t1: "hello"}]);
    });


    describe('Nested namespaces with name shadowing, generating from default symbols', function() {
        const inner = Ns("innerNamespace");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("outerNamespace");
        outer.addSymbol("x", t2("goodbye"));
        outer.addSymbol("innerNamespace", inner);

        testAstHasSymbols(outer, [ "outerNamespace.innerNamespace.x",
                                    "outerNamespace.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "innerNamespace.x", "x" ]);

        testAstHasTapes(outer, [ "t1" ]);
        testAstHasTapes(outer, [ "t1" ], "outerNamespace.innerNamespace.x");
        testAstHasTapes(outer, [ "t2" ], "outerNamespace.x");

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "outerNamespace.innerNamespace.x");
        testAst(outer, [{t2: "goodbye"}], "outerNamespace.x");

    });

    
    describe('Nested namespaces where an embed in outer refers to inner', function() {
        const inner = Ns("inner");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("outer");
        outer.addSymbol("inner", inner);
        outer.addSymbol("x", Embed("inner.x"));

        testAstHasSymbols(outer, [ "outer.inner.x",
                                    "outer.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "inner.x", "x" ]);

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "outer.inner.x");
        testAst(outer, [{t1: "hello"}], "outer.x");

    });
    
    describe('Nested namespaces with two inners, and embed in second refers to symbol in first', function() {
        const inner1 = Ns("inner1");
        inner1.addSymbol("x", t1("hello"));
        const inner2 = Ns("inner2");
        inner2.addSymbol("x", Embed("inner1.x"));
        const outer = Ns("outer");
        outer.addSymbol("inner1", inner1);
        outer.addSymbol("inner2", inner2);

        testAstHasSymbols(outer, [ "outer.inner1.x",
                                    "outer.inner2.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "outer.x", "x" ]);

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "outer.inner1.x");
        testAst(outer, [{t1: "hello"}], "outer.inner2.x");

    });
    
    describe('Nested namespaces with two inners, and embed in second refers to symbol in first', function() {
        const inner1 = Ns("inner1");
        inner1.addSymbol("x", Embed("inner2.x"));
        const inner2 = Ns("inner2");
        inner2.addSymbol("x", t1("hello"));
        const outer = Ns("outer");
        outer.addSymbol("inner1", inner1);
        outer.addSymbol("inner2", inner2);

        testAstHasSymbols(outer, [ "outer.inner1.x",
                                    "outer.inner2.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "outer.x", "x" ]);

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "outer.inner1.x");
        testAst(outer, [{t1: "hello"}], "outer.inner2.x");

    });





});