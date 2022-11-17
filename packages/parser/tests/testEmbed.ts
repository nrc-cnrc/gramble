import { Seq, Uni, Join, Embed, Collection, Epsilon, Null } from "../src/grammars";
import { 
    t1, t2, t3, 
    testHasTapes,
    testGrammar,
} from './testUtil';

import * as path from 'path';
import { SILENT } from "../src/util";


describe(`${path.basename(module.filename)}`, function() {

    describe('Symbol containing t1:hi, unnamed collection', function() {
        const grammar = Collection({ "a": t1("hi"),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1"]);
        testHasTapes(grammar, ["t1"], "a");
        testHasTapes(grammar, ["t1"], "b");
        
        testGrammar(grammar, [{t1: "hi"}], SILENT, "a");
        testGrammar(grammar, [{t1: "hi"}], SILENT, "b");
    });
    
    describe('Symbol containing ε', function() {
        const grammar = Collection({ "a": Epsilon(),
                             "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{}], SILENT, "b");
    });


    describe('Symbol containing ε, other order', function() {
        const grammar = Collection({ "b": Embed("a"),
                            "a": Epsilon() });
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{}], SILENT, "b");
    });

    describe('Symbol containing ε+ε', function() {
        const grammar = Collection({ "a": Seq(Epsilon(), Epsilon()),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{}], SILENT, "b");
    });

    describe('Symbol containing ∅', function() {
        const grammar = Collection({ "a": Null(),
                          "b": Embed("a") });
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [], SILENT, "b");
    });

    describe('Lowercase assignment, uppercase reference', function() {
        const grammar = Collection({ "a": t1("hi"),
                          "b": Embed("A") });
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{t1: "hi"}], SILENT, "b");
    });

    describe('Uppercase assignment, lowercase reference', function() {
        const grammar = Collection({ "A": t1("hi"),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{t1: "hi"}], SILENT, "b");
    });

    describe('Symbol containing t1:hi+t1:world', function() {
        const grammar = Collection({ "a": Seq(t1("hi"), t1("world")),
                          "b": Embed("a") });
        testGrammar(grammar, [{t1: "hiworld"}], SILENT, "b");
    });
    
    describe('Two sequences referencing sym t1:hi+t1:world', function() {
        const grammar = Collection({ "a": Seq(t1("h"), t1("i")),
                          "b": Uni(Seq(Embed("a"), t1("world")),
                                   Seq(Embed("a"), t1("kitty")))});
        testGrammar(grammar, [{t1: "hiworld"}, {t1:"hikitty"}], SILENT, "b");
    });

    describe('Symbol containing t1:hi+t2:world', function() {
        const grammar = Collection({ "a": Seq(t1("hi"), t2("world")),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, [{t1: "hi", t2: "world"}], SILENT, "b");
    });

    describe('Symbol containing t1:hi|t1:goodbye', function() {
        const grammar = Collection({ "a": Uni(t1("hi"), t1("goodbye")),
                          "b": Embed("a") });
        testGrammar(grammar, [{t1: "hi"},
                              {t1: "goodbye"}], SILENT, "b");
    });

    describe('Symbol of (t1:hi ⋈ t1:hi+t2:bye)', function() {
        const grammar = Collection({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))), 
                          "b": Embed("hi2bye") });
        testGrammar(grammar, [{t1: "hi", t2: "bye"}], SILENT, "b");
    });

    describe('Joining sym(t1:hi ⋈ t1:hi+t2:bye) ⋈ t2:bye+t3:yo', function() {
        const grammar = Collection({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                            "b": Join(Embed("hi2bye"), Seq(t2("bye"), t3("yo"))) });
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}], SILENT, "b");
    });

    describe('Joining t1:hi ⋈ sym(t1:hi+t2:bye ⋈ t2:bye+t3:yo)', function() {
        const grammar = Collection({ "hi2yo": Join(Seq(t1("hi"), t2("bye")), 
                                Seq(t2("bye"), t3("yo"))),
                            "b": Join(t1("hi"), Embed("hi2yo")) });
        testGrammar(grammar, [{t1: "hi", t2: "bye", t3: "yo"}], SILENT, "b");
    });

    describe('Joining of sym(t1:hi ⋈ t1:hi+t2:bye)+t2:world', function() {
        const grammar = Collection({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                          "b": Seq(Embed("hi2bye"), t2("world")) });
        
        testGrammar(grammar, [{t1: "hi", t2: "byeworld"}], SILENT, "b");
    });
    
    describe('Simple collections, generating from default symbol', function() {
        const grammar = Collection({"x": t1("hello")});
        testHasTapes(grammar, [ "t1" ]);
        testGrammar(grammar, [{t1: "hello"}]);
    });

    describe('Nested collections, generating from default symbols', function() {
        const inner = Collection(
            {"x": t1("hello")
        });
        const outer = Collection({
            "inner": inner
        });
        testGrammar(outer, [{t1: "hello"}]);
    });

    describe('Nested collections with name shadowing, generating from default symbols', function() {
        const inner = Collection(
            {"x": t1("hello")
        });
        const outer = Collection(
            {"x": t2("goodbye"),
            "inner": inner
        });

        testHasTapes(outer, [ "t1", "t2" ]);
        testHasTapes(outer, [ "t1" ], "inner.x");
        testHasTapes(outer, [ "t2" ], "x");

        testGrammar(outer, [{t1: "hello"}, {t2: "goodbye"}]);
        testGrammar(outer, [{t1: "hello"}], SILENT, "inner.x");
        testGrammar(outer, [{t2: "goodbye"}], SILENT, "x");

    });

    describe('Nested collections with identical names, and a symbol in the inner referring to a symbol in the inner', function() {
        const inner = Collection({
            "x": t1("hello"),
            "y": Embed("ns.x")
        });
        const outer = Collection({
            "x": t2("goodbye"),
            "ns": inner
        });
        const global = Collection({
            "ns": outer
        });
        testGrammar(global, [{t1: "hello"}], SILENT, "ns.ns.y");
    });

    describe('Nested collections with identical names, and a symbol in the outer referring to a symbol in the inner', function() {
        const inner = Collection(
            {"x": t1("hello")
        });
        const outer = Collection({
            "x": t2("goodbye"),
            "y": Embed("ns.x"),
            "ns": inner
        });
        const global = Collection(
            {"ns": outer
        });
        testGrammar(global, [{t1: "hello"}], SILENT, "ns.y");
    });
    
    describe('Nested collections where an embed in outer refers to inner', function() {
        const inner = Collection({
            "x": t1("hello")
        });
        const outer = Collection({
            "inner": inner,
            "x": Embed("inner.x")
        });

        testGrammar(outer, [{t1: "hello"}], SILENT, "inner.x");
        testGrammar(outer, [{t1: "hello"}], SILENT, "x");

    });

    describe('Nested collections with two inners, and embed in second refers to symbol in first', function() {
        const inner1 = Collection({
            "x": t1("hello")
        });
        const inner2 = Collection({
            "x": Embed("inner1.x")
        });
        const outer = Collection({
            "inner1": inner1,
            "inner2": inner2
        });

        testGrammar(outer, [{t1: "hello"}], SILENT, "inner1.x");
        testGrammar(outer, [{t1: "hello"}], SILENT, "inner2.x");

    }); 

    describe('Nested collections with two inners, and embed in first refers to symbol in second', function() {
        const inner1 = Collection({
            "x": Embed("inner2.x")
        });
        const inner2 = Collection({
            "x": t1("hello")
        });
        const outer = Collection({
            "inner1": inner1,
            "inner2": inner2
        });

        testGrammar(outer, [{t1: "hello"}], SILENT, "inner1.x");
        testGrammar(outer, [{t1: "hello"}], SILENT, "inner2.x");

    }); 

    describe('Nested collections with two inners, and embed in first refers to default symbol in second', function() {
        const inner1 = Collection({
            "x": Embed("inner2")
        });
        const inner2 = Collection({
            "x": t1("hello")
        });
        const outer = Collection({
            "inner1": inner1,
            "inner2": inner2
        });

        testGrammar(outer, [{t1: "hello"}], SILENT, "inner1.x");
        testGrammar(outer, [{t1: "hello"}], SILENT, "inner2.x");

    }); 
});
