import { Seq, Uni, Join, Embed, Ns, Epsilon, Null } from "../src/ast";
import { 
    t1, t2, t3, 
    testHasTapes, 
    testAstHasSymbols,
    testAstDoesNotHaveSymbols,
    //testHasVocab, 
    testAst,
    //makeTestNamespace
} from './testUtils';

import * as path from 'path';


describe(`${path.basename(module.filename)}`, function() {

    describe('Symbol containing t1:hi', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi"}], "b");
    });
    
    describe('Symbol containing ε', function() {
        const grammar = Ns("test", 
                        { "a": Epsilon(),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{}], "b");
    });

    describe('Symbol containing ε+ε', function() {
        const grammar = Ns("test", 
                        { "a": Seq(Epsilon(), Epsilon()),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{}], "b");
    });

    describe('Symbol containing ∅', function() {
        const grammar = Ns("test", 
                        { "a": Null(),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [], "b");
    });

    describe('Lowercase assignment, uppercase reference', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Embed("A") });
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi"}], "b");
    });

    describe('Uppercase assignment, lowercase reference', function() {
        const grammar = Ns("test", 
                        { "A": t1("hi"),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi"}], "b");
    });

    describe('Symbol containing t1:hi+t1:world', function() {
        const grammar = Ns("test",
                        { "a": Seq(t1("hi"), t1("world")),
                          "b": Embed("a") });
        testAst(grammar, [{t1: "hiworld"}], "b");
    });
    
    describe('Two sequences referencing sym t1:hi+t1:world', function() {
        const grammar = Ns("test",
                        { "a": Seq(t1("h"), t1("i")),
                          "b": Uni(Seq(Embed("a"), t1("world")),
                                   Seq(Embed("a"), t1("kitty")))});
        testAst(grammar, [{t1: "hiworld"}, {t1:"hikitty"}], "b");
    });

    describe('Symbol containing t1:hi+t2:world', function() {
        const grammar = Ns("test", 
                        { "a": Seq(t1("hi"), t2("world")),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2});
        testAst(grammar, [{t1: "hi", t2: "world"}], "b");
    });

    describe('Symbol containing t1:hi|t1:goodbye', function() {
        const grammar = Ns("test",
                        { "a": Uni(t1("hi"), t1("goodbye")),
                          "b": Embed("a") });
        testAst(grammar, [{t1: "hi"},
                              {t1: "goodbye"}], "b");
    });

    describe('Symbol of (t1:hi ⋈ t1:hi+t2:bye)', function() {
        const grammar = Ns("test",
                        { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))), 
                          "b": Embed("hi2bye") });
        testAst(grammar, [{t1: "hi", t2: "bye"}], "b");
    });

    describe('Joining sym(t1:hi ⋈ t1:hi+t2:bye) ⋈ t2:bye+t3:yo', function() {
        const grammar = Ns("test",
                    { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                            "b": Join(Embed("hi2bye"), Seq(t2("bye"), t3("yo"))) });
        testAst(grammar, [{t1: "hi", t2: "bye", t3: "yo"}], "b");
    });

    describe('Joining t1:hi ⋈ sym(t1:hi+t2:bye ⋈ t2:bye+t3:yo)', function() {
        const grammar = Ns("test",
                    { "hi2yo": Join(Seq(t1("hi"), t2("bye")), 
                                Seq(t2("bye"), t3("yo"))),
                            "b": Join(t1("hi"), Embed("hi2yo")) });
        testAst(grammar, [{t1: "hi", t2: "bye", t3: "yo"}], "b");
    });

    describe('Joining of sym(t1:hi ⋈ t1:hi+t2:bye)+t2:world', function() {
        const grammar = Ns("test",
                        { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                          "b": Seq(Embed("hi2bye"), t2("world")) });
        
        testAst(grammar, [{t1: "hi", t2: "byeworld"}], "b");
    });

    describe('Simple namespace, generating from default symbol', function() {
        const grammar = Ns("myNamespace");
        grammar.addSymbol("x", t1("hello"));

        testAstHasSymbols(grammar, [ "x" ]);

        testHasTapes(grammar, [ "t1" ]);
        testAst(grammar, [{t1: "hello"}]);
    });


    describe('Nested namespaces, generating from default symbols', function() {
        const inner = Ns("innerNamespace");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("outerNamespace");
        outer.addSymbol("innerNamespace", inner);

        testAstHasSymbols(outer, [ "innerNamespace.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "x" ]);

        testAst(outer, [{t1: "hello"}]);
    });

    describe('Nested namespaces with name shadowing, generating from default symbols', function() {
        const inner = Ns("innerNamespace");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("outerNamespace");
        outer.addSymbol("x", t2("goodbye"));
        outer.addSymbol("innerNamespace", inner);

        testAstHasSymbols(outer, [ "innerNamespace.x",
                                    "x" ]);

        testHasTapes(outer, [ "t1" ]);
        testHasTapes(outer, [ "t1" ], "innerNamespace.x");
        testHasTapes(outer, [ "t2" ], "x");

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "innerNamespace.x");
        testAst(outer, [{t2: "goodbye"}], "x");

    });

    describe('Nested namespaces with identical names', function() {
        const inner = Ns("ns");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("ns");
        outer.addSymbol("x", t2("goodbye"));
        outer.addSymbol("ns", inner);

        testAstHasSymbols(outer, [ "ns.x",
                                    "x" ]);

        testHasTapes(outer, [ "t1" ]);
        testHasTapes(outer, [ "t1" ], "ns.x");
        testHasTapes(outer, [ "t2" ], "x");

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "ns.x");
        testAst(outer, [{t2: "goodbye"}], "x");

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
        testAst(global, [{t1: "hello"}], "ns.ns.y");
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
        testAst(global, [{t1: "hello"}], "ns.y");
    });
    
    describe('Nested namespaces where an embed in outer refers to inner', function() {
        const inner = Ns("inner");
        inner.addSymbol("x", t1("hello"));
        const outer = Ns("outer");
        outer.addSymbol("inner", inner);
        outer.addSymbol("x", Embed("inner.x"));

        testAstHasSymbols(outer, [ "inner.x",
                                    "x" ]);

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "inner.x");
        testAst(outer, [{t1: "hello"}], "x");

    });

    describe('Nested namespaces with two inners, and embed in second refers to symbol in first', function() {
        const inner1 = Ns("inner1");
        inner1.addSymbol("x", t1("hello"));
        const inner2 = Ns("inner2");
        inner2.addSymbol("x", Embed("inner1.x"));
        const outer = Ns("outer");
        outer.addSymbol("inner1", inner1);
        outer.addSymbol("inner2", inner2);

        testAstHasSymbols(outer, [ "inner1.x",
                                    "inner2.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "x" ]);

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "inner1.x");
        testAst(outer, [{t1: "hello"}], "inner2.x");

    }); 

    describe('Nested namespaces with two inners, and embed in second refers to symbol in first', function() {
        const inner1 = Ns("inner1");
        inner1.addSymbol("x", Embed("inner2.x"));
        const inner2 = Ns("inner2");
        inner2.addSymbol("x", t1("hello"));
        const outer = Ns("outer");
        outer.addSymbol("inner1", inner1);
        outer.addSymbol("inner2", inner2);

        testAstHasSymbols(outer, [ "inner1.x",
                                    "inner2.x" ]);
        testAstDoesNotHaveSymbols(outer, [ "x" ]);

        testAst(outer, [{t1: "hello"}]);
        testAst(outer, [{t1: "hello"}], "inner1.x");
        testAst(outer, [{t1: "hello"}], "inner2.x");

    }); 
});
