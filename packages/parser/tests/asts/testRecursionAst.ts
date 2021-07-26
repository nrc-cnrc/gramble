import { Seq, Uni, Join, Embed, Ns } from "../../src/ast";
import { 
    t1, t2, t3, 
    testAstHasTapes, 
    //testHasVocab, 
    testAst, 
    //makeTestNamespace
} from './testUtilsAst';

import * as path from 'path';


describe(`${path.basename(module.filename)}`, function() {


    describe('Joining "hiworld" with right-recursive "hi+ world"', function() {
        const ns = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        ns.addSymbol("hiWorld", hiWorld);
        ns.addSymbol("b", Join(t1("hiworld"), hiWorld));
        testAst(ns, [{t1: "hiworld"}], "test.b");
    });

    
    describe('Joining right-recursive "hi+ world" with "hiworld"', function() {
        const ns = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        ns.addSymbol("hiWorld", hiWorld);

        ns.addSymbol("b", Join(hiWorld, t1("hiworld")));
        testAst(ns, [{t1: "hiworld"}]);
    });

    describe('Joining "hihiworld" with right-recursive "hi+ world"', function() {
        const symbolTable = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        symbolTable.addSymbol("b", Join(t1("hihiworld"), hiWorld));
        testAst(symbolTable, [{t1: "hihiworld"}]);
    });

    describe('Joining right-recursive "hi+ world" with "hihiworld"', function() {
        const symbolTable = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        symbolTable.addSymbol("b", Join(hiWorld, t1("hihiworld")));
        testAst(symbolTable, [{t1: "hihiworld"}]);
    });

    describe('Joining "hiworld" with left-recursive "hi+ world"', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", Join(t1("hiworld"), hiWorld));
        testAst(symbolTable, [{t1: "hiworld"}]);
    });

    describe('Joining "hihiworld" with left-recursive "hi+ world"', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", Join(t1("hihiworld"), hiWorld));
        testAst(symbolTable, [{t1: "hihiworld"}]);
    });

    describe('Joining left-recursive "hi+ world" with "hiworld"', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", Join(hiWorld, t1("hiworld")));
        testAst(symbolTable, [{t1: "hiworld"}]);
    });

    describe('Joining left-recursive "hi+ world" with "hihiworld"', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", Join(hiWorld, t1("hihiworld")));
        testAst(symbolTable, [{t1: "hihiworld"}]);
    });

    describe('Emitting from right-recursive "hi+ world" with default max recursion (4)', function() {
        const symbolTable = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"},
                              {t1: "hihihihiworld"},
                              {t1: "hihihihihiworld"}]);
    });

    describe('Emitting from right-recursive "hi+ world" with max recursion 2', function() {
        const symbolTable = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"}], 
                            "test.b", 2);
    });

    
    describe('Emitting from center-recursive "hi+ world" with max recursion 2', function() {
        const symbolTable = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world, t1("hi"));
        symbolTable.addSymbol("hiWorld", hiWorld);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworldhi"},
                              {t1: "hihiworldhihi"},
                              {t1: "hihihiworldhihihi"}], "test.b",
                    2);
    });

    describe('Emitting from right-recursive "hi+ world" with max recursion 0', function() {
        const symbolTable = Ns("test");
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworld"}], "test.b", 0);
    });

    describe('Emitting from left-recursive "hi+ world" with default max recursion (4)', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"},
                              {t1: "hihihihiworld"},
                              {t1: "hihihihihiworld"}], "test.b");
    });

    describe('Emitting from left-recursive "hi+ world" with max recursion 2', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworld"},
                              {t1: "hihiworld"},
                              {t1: "hihihiworld"}], "test.b",
                    2);
    });

    describe('Emitting from left-recursive "hi+ world" with max recursion 0', function() {
        const symbolTable = Ns("test");
        const hihi = Uni(t1("hi"), Seq(Embed("hihi"), t1("hi")));
        const hiWorld = Seq(hihi, t1("world"));
        symbolTable.addSymbol("hihi", hihi);

        symbolTable.addSymbol("b", hiWorld);
        testAst(symbolTable, [{t1: "hiworld"}], "test.b", 0);
    }); 

})