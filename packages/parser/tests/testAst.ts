
import { Embed, Epsilon, Lit, Ns, Seq, Uni } from "../src/ast";
import { testAst, testAstHasTapes, testAstHasSymbols, testAstDoesNotHaveSymbols } from './testUtils';

import * as path from 'path';


const text = (s: string) => Lit("text", s);

const t1 = (s: string) => Lit("t1", s);
const t2 = (s: string) => Lit("t2", s);

describe(`${path.basename(module.filename)}`, function() {

    describe('Literal text:hello', function() {
        const grammar = text("hello");
        testAstHasTapes(grammar, [ "text" ]);
        testAst(grammar, [{text: "hello"}]);
    });

    describe('Sequence text:hello+test:world', function() {
        const grammar = Seq(text("hello"), text("world"));
        testAstHasTapes(grammar, [ "text" ]);
        testAst(grammar, [{text: "helloworld"}]);
    });

    describe('Sequence of one ε', function() {
        const grammar = Seq(Epsilon());
        testAstHasTapes(grammar, [ ]);
        testAst(grammar, [{}]);
    });

    describe('Alt text:hello|text:goodbye', function() {
        const grammar = Uni(text("hello"), text("goodbye"));
        
        testAstHasTapes(grammar, [ "text" ]);
        testAst(grammar, [{text: "hello"},
                            {text: "goodbye"}]);
    });


    describe('Simple namespace, generating from default symbol', function() {
        const grammar = Ns("myNamespace");
        grammar.addSymbol("x", text("hello"));
        grammar.qualifyNames();  

        testAstHasSymbols(grammar, [ "myNamespace.x" ]);
        testAstDoesNotHaveSymbols(grammar, [ "x" ]);

        
        testAstHasTapes(grammar, [ "text" ]);
        testAst(grammar, [{text: "hello"}]);
    });


    describe('Nested namespaces, generating from default symbols', function() {
        const inner = Ns("innerNamespace");
        inner.addSymbol("x", text("hello"));
        const outer = Ns("outerNamespace");
        outer.addSymbol("innerNamespace", inner);

        testAstHasSymbols(outer, [ "outerNamespace.innerNamespace.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "outerNamespace.x", "innerNamespace.x", "x" ]);

        testAst(outer, [{text: "hello"}]);
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