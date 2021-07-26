import { Seq, Uni, Join, Embed, Ns, Epsilon, Null } from "../../src/ast";
import { 
    t1, t2, t3, 
    testAstHasTapes, 
    //testHasVocab, 
    testAst,
    testAstHasSymbols,
    testAstDoesNotHaveSymbols, 
    //makeTestNamespace
} from './testUtilsAst';

import * as path from 'path';


describe(`${path.basename(module.filename)}`, function() {

    describe('Symbol containing t1:hi', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Embed("a") });
        testAstHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi"}], "test.b");
    });
    

    describe('Symbol containing ε', function() {
        const grammar = Ns("test", 
                        { "a": Epsilon(),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{}], "test.b");
    });

    describe('Symbol containing ε+ε', function() {
        const grammar = Ns("test", 
                        { "a": Seq(Epsilon(), Epsilon()),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{}], "test.b");
    });

    describe('Symbol containing ∅', function() {
        const grammar = Ns("test", 
                        { "a": Null(),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [], "test.b");
    });

    describe('Lowercase assignment, uppercase reference', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Embed("A") });
        testAstHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi"}], "test.b");
    });

    describe('Uppercase assignment, lowercase reference', function() {
        const grammar = Ns("test", 
                        { "A": t1("hi"),
                          "b": Embed("a") });
        testAstHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi"}], "test.b");
    });

    describe('Symbol containing t1:hi+t1:world', function() {
        const grammar = Ns("test",
                        { "a": Seq(t1("hi"), t1("world")),
                          "b": Embed("a") });
        testAst(grammar, [{t1: "hiworld"}], "test.b");
    });

    describe('Symbol containing t1:hi+t2:world', function() {
        const grammar = Ns("test", 
                        { "a": Seq(t1("hi"), t2("world")),
                          "b": Embed("a") });
        testAstHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi", t2: "world"}], "test.b");
    });

    describe('Symbol containing t1:hi|t1:goodbye', function() {
        const grammar = Ns("test",
                        { "a": Uni(t1("hi"), t1("goodbye")),
                          "b": Embed("a") });
        testAst(grammar, [{t1: "hi"},
                              {t1: "goodbye"}], "test.b");
    });

    describe('Symbol of (t1:hi ⋈ t1:hi+t2:bye)', function() {
        const grammar = Ns("test",
                        { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))), 
                          "b": Embed("hi2bye") });
        testAst(grammar, [{t1: "hi", t2: "bye"}], "test.b");
    });

    describe('Joining sym(t1:hi ⋈ t1:hi+t2:bye) ⋈ t2:bye+t3:yo', function() {
        const grammar = Ns("test",
                    { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                            "b": Join(Embed("hi2bye"), Seq(t2("bye"), t3("yo"))) });
        testAst(grammar, [{t1: "hi", t2: "bye", t3: "yo"}], "test.b");
    });

    describe('Joining t1:hi ⋈ sym(t1:hi+t2:bye ⋈ t2:bye+t3:yo)', function() {
        const grammar = Ns("test",
                    { "hi2yo": Join(Seq(t1("hi"), t2("bye")), 
                                Seq(t2("bye"), t3("yo"))),
                            "b": Join(t1("hi"), Embed("hi2yo")) });
        testAst(grammar, [{t1: "hi", t2: "bye", t3: "yo"}], "test.b");
    });

    describe('Joining of sym(t1:hi ⋈ t1:hi+t2:bye)+t2:world', function() {
        const grammar = Ns("test",
                        { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                          "b": Seq(Embed("hi2bye"), t2("world")) });
        
        testAst(grammar, [{t1: "hi", t2: "byeworld"}], "test.b");
    });

    describe('Simple namespace, generating from default symbol', function() {
        const grammar = Ns("myNamespace");
        grammar.addSymbol("x", t1("hello"));

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

    describe('Nested namespaces with identical names', function() {
        const inner = Ns("ns");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("ns");
        outer.addSymbol("x", t2("goodbye"));
        outer.addSymbol("ns", inner);

        testAstHasSymbols(outer, [ "ns.ns.x",
                                    "ns.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "x" ]);

        testAstHasTapes(outer, [ "t1" ]);
        testAstHasTapes(outer, [ "t1" ], "ns.ns.x");
        testAstHasTapes(outer, [ "t2" ], "ns.x");

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "ns.ns.x");
        testAst(outer, [{t2: "goodbye"}], "ns.x");

    });

    
    describe('Nested namespaces with identical names, and a symbol in the inner referring to a symbol in the inner', function() {
        const inner = Ns("ns");
        inner.addSymbol("x", t1("hello"));
        inner.addSymbol("y", Embed("ns.x"));
        const outer = Ns("ns");
        outer.addSymbol("x", t2("goodbye"));
        outer.addSymbol("ns", inner);
        const global = Ns("test");
        global.addSymbol("ns", outer);
        testAst(global, [{t1: "hello"}], "test.ns.ns.y");
    });

    describe('Nested namespaces with identical names, and a symbol in the outer referring to a symbol in the inner', function() {
        const inner = Ns("ns");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("ns");
        outer.addSymbol("x", t2("goodbye"));
        outer.addSymbol("y", Embed("ns.x"));
        outer.addSymbol("ns", inner);
        const global = Ns("test");
        global.addSymbol("ns", outer);
        testAst(global, [{t1: "hello"}], "test.ns.y");
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
