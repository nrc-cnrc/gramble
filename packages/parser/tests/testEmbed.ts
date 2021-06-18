import { Seq, Uni, Join, Emb } from "../src/stateMachine";
import { 
    text, t1, t2, t3, 
    testHasTapes, 
    testHasVocab, 
    testGenerateAndSample, 
    makeTestNamespace
} from './testUtils';

import * as path from 'path';


describe(`${path.basename(module.filename)}`, function() {

    // Embedding tests

    describe('Symbol containing text:hi', function() {
        const symbolTable = makeTestNamespace({ "s": text("hi") });
        const grammar = Emb("s", symbolTable);
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 2});
        testGenerateAndSample(grammar, [{text: "hi"}]);
    });
    
    describe('Lowercase assignment, uppercase reference', function() {
        const symbolTable = makeTestNamespace({ "s": text("hi") });
        const grammar = Emb("S", symbolTable);
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 2});
        testGenerateAndSample(grammar, [{text: "hi"}]);
    });

    describe('Uppercase assignment, lowercase reference', function() {
        const symbolTable = makeTestNamespace({ "S": text("hi") });
        const grammar = Emb("s", symbolTable);
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 2});
        testGenerateAndSample(grammar, [{text: "hi"}]);
    });

    describe('Symbol containing text:hi+text:world', function() {
        const symbolTable = makeTestNamespace({ "s": Seq(text("hi"), text("world")) });
        const grammar = Emb("s", symbolTable);
        testGenerateAndSample(grammar, [{text: "hiworld"}]);
    });

    describe('Symbol containing text:hi|text:goodbye', function() {
        const symbolTable = makeTestNamespace({ "s": Uni(text("hi"), text("goodbye")) });
        const grammar = Emb("s", symbolTable);
        testGenerateAndSample(grammar, [{text: "hi"},
                              {text: "goodbye"}]);
    });

    describe('Symbol of (t1:hi & t1:hi+t2:bye)', function() {
        const symbolTable = makeTestNamespace({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) });
        const grammar = Emb("hi2bye", symbolTable)
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye"}]);
    });

    describe('Joining sym(t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
        const symbolTable = makeTestNamespace({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) });
        const grammar = Join(Emb("hi2bye", symbolTable),
                             Seq(t2("bye"), t3("yo")));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining t1:hi & sym(t1:hi+t2:bye & t2:bye+t3:yo)', function() {
        const symbolTable = makeTestNamespace({ "hi2yo": Join(Seq(t1("hi"), t2("bye")),
                                                          Seq(t2("bye"), t3("yo")))});
        const grammar = Join(t1("hi"), Emb("hi2yo", symbolTable));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "bye", t3: "yo"}]);
    });

    describe('Joining of sym(t1:hi & t1:hi+t2:bye)+t2:world', function() {
        const symbolTable = makeTestNamespace({ "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) });
        const grammar = Seq(Emb("hi2bye", symbolTable), t2("world"));
        testGenerateAndSample(grammar, [{t1: "hi", t2: "byeworld"}]);
    });

    describe('Joining "hiworld" with right-recursive "hi+ world"', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = Join(text("hiworld"), hiWorld);
        testGenerateAndSample(grammar, [{text: "hiworld"}]);
    });

    describe('Joining right-recursive "hi+ world" with "hiworld"', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = Join(hiWorld, text("hiworld"));
        testGenerateAndSample(grammar, [{text: "hiworld"}]);
    });

    describe('Joining "hihiworld" with right-recursive "hi+ world"', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = Join(text("hihiworld"), hiWorld);
        testGenerateAndSample(grammar, [{text: "hihiworld"}]);
    });

    describe('Joining right-recursive "hi+ world" with "hihiworld"', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = Join(hiWorld, text("hihiworld"));
        testGenerateAndSample(grammar, [{text: "hihiworld"}]);
    });

    describe('Joining "hiworld" with left-recursive "hi+ world"', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = Join(text("hiworld"), hiWorld);
        testGenerateAndSample(grammar, [{text: "hiworld"}]);
    });

    describe('Joining "hihiworld" with left-recursive "hi+ world"', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = Join(text("hihiworld"), hiWorld);
        testGenerateAndSample(grammar, [{text: "hihiworld"}]);
    });

    describe('Joining left-recursive "hi+ world" with "hiworld"', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = Join(hiWorld, text("hiworld"));
        testGenerateAndSample(grammar, [{text: "hiworld"}]);
    });

    describe('Joining left-recursive "hi+ world" with "hihiworld"', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = Join(hiWorld, text("hihiworld"));
        testGenerateAndSample(grammar, [{text: "hihiworld"}]);
    });

    describe('Emitting from right-recursive "hi+ world" with default max recursion (4)', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworld"},
                              {text: "hihiworld"},
                              {text: "hihihiworld"},
                              {text: "hihihihiworld"},
                              {text: "hihihihihiworld"}]);
    });

    describe('Emitting from right-recursive "hi+ world" with max recursion 2', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworld"},
                              {text: "hihiworld"},
                              {text: "hihihiworld"}],
                    2);
    });

    
    describe('Emitting from center-recursive "hi+ world" with max recursion 2', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world, text("hi"));
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworldhi"},
                              {text: "hihiworldhihi"},
                              {text: "hihihiworldhihihi"}],
                    2);
    });

    describe('Emitting from right-recursive "hi+ world" with max recursion 0', function() {
        const symbolTable = makeTestNamespace();
        const world = Uni(text("world"), Emb("hiWorld", symbolTable))
        const hiWorld = Seq(text("hi"), world);
        symbolTable.addSymbol("hiWorld", hiWorld);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworld"}], 0);
    });

    describe('Emitting from left-recursive "hi+ world" with default max recursion (4)', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworld"},
                              {text: "hihiworld"},
                              {text: "hihihiworld"},
                              {text: "hihihihiworld"},
                              {text: "hihihihihiworld"}]);
    });

    describe('Emitting from left-recursive "hi+ world" with max recursion 2', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworld"},
                              {text: "hihiworld"},
                              {text: "hihihiworld"}],
                    2);
    });

    describe('Emitting from left-recursive "hi+ world" with max recursion 0', function() {
        const symbolTable = makeTestNamespace();
        const hihi = Uni(text("hi"), Seq(Emb("hihi", symbolTable), text("hi")));
        const hiWorld = Seq(hihi, text("world"));
        symbolTable.addSymbol("hihi", hihi);

        const grammar = hiWorld;
        testGenerateAndSample(grammar, [{text: "hiworld"}], 0);
    });
});
