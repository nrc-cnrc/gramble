
import { Seq, Join, Rep, Filter, Uni, Rename, Embed, Ns, Intersect } from "../src/grammars";
import { t1, t2, testHasTapes, testGrammar, testHasConcatTapes, t3, testHasVocab } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Vocab for t1:hello', function() {
        const grammar = t1("hello");
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 1 });
    });

    describe('Vocab for t1:hello+t1:world', function() {
        const grammar = Seq(t1("hello"), t1("world"));
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, ["t1"]);
        testHasVocab(grammar, { t1: 7 });
    });
    
    describe('Vocab for t1:hello&1:world', function() {
        const grammar = Intersect(t1("hello"), t1("world"));
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 2 });
    });

    describe('Vocab for join t1:hello&1:world', function() {
        const grammar = Join(t1("hello"), t1("world"));
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 2 });
    });

    describe('Vocab for filter t1:hello&1:world', function() {
        const grammar = Filter(t1("hello"), t1("world"));
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 2 });
    });

    describe('Vocab for t1:hello+t1:world+t2:unrelated', function() {
        const grammar = Seq(t1("hello"), t1("world"), t2("unrelated"));
        testHasTapes(grammar, ["t1", "t2"]);
        testHasConcatTapes(grammar, ["t1"]);
        testHasVocab(grammar, { t1: 7, t2: 1 });
    });

    describe('Vocab for t1:hello|(t1:world+t2:unrelated)', function() {
        const grammar = Uni(t1("hello"), Seq(t1("world"), t2("unrelated")));
        testHasTapes(grammar, ["t1", "t2"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 2, t2: 1 });
    });

    describe('Vocab for (t1:hello)*', function() {
        const grammar = Rep(t1("hello"));
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, ["t1"]);
        testHasVocab(grammar, { t1: 4 });
    });

    describe('Vocab for (t1:hello){1}', function() {
        const grammar = Rep(t1("hello"), 1, 1);
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 1 });
    });

    describe('Vocab for (t1:hello){2}', function() {
        const grammar = Rep(t1("hello"), 2, 2);
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, ["t1"]);
        testHasVocab(grammar, { t1: 4 });
    });
    
    describe('Vocab for t1->t2(t1:hello+t1:world)', function() {
        const grammar = Rename(Seq(t1("hello"), t1("world")), "t1", "t2");
        testHasTapes(grammar, ["t2"]);
        testHasConcatTapes(grammar, ["t2"]);
        testHasVocab(grammar, { t2: 7 });
    });
    
    describe('Vocab for sym(t1:hi)', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 1 });
    });

    describe('Vocab for sym(t1:hello+t2:world)', function() {
        const grammar = Ns("test", 
                        { "a": Seq(t1("hello"), t1("world")),
                          "b": Embed("a") });
        testHasTapes(grammar, ["t1"]);
        testHasConcatTapes(grammar, ["t1"]);
        testHasVocab(grammar, { t1: 7 });
    });

    describe('Rename of same tape, neither rename concats', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Uni(Rename(Embed("a"), "t1", "t2"),
                                    Rename(Embed("a"), "t1", "t3")) });
        testHasTapes(grammar, ["t2", "t3"]);
        testHasConcatTapes(grammar, []);
        testHasVocab(grammar, { t1: 1, t2: 1, t3: 1 });
    });

    
    describe('Rename of same tape, but the 1st rename concats', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Uni(Seq(Rename(Embed("a"), "t1", "t2"), t2("world")),
                                    Rename(Embed("a"), "t1", "t3")) });
        testHasTapes(grammar, ["t2", "t3"]);
        testHasConcatTapes(grammar, ["t1", "t2", "t3"]);
        testHasVocab(grammar, { t1: 2, t2: 7, t3: 2 });
    });

    
    describe('Rename of same tape, but the 2nd rename concats', function() {
        const grammar = Ns("test", 
                        { "a": t1("hi"),
                          "b": Uni(Rename(Embed("a"), "t1", "t2"),
                                    Seq(Rename(Embed("a"), "t1", "t3"), t3("world"))) });
        testHasTapes(grammar, ["t2", "t3"]);
        testHasConcatTapes(grammar, ["t1", "t2", "t3"]);
        testHasVocab(grammar, { t1: 2, t2: 2, t3: 7 });
    });
});
