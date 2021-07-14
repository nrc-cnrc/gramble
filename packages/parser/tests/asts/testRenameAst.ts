import { 
    Rename, 
    Seq, 
    Join, 
    Uni, 
    Filter 
} from "../../src/ast";

import { 
    t1, t2, t3, t4, t5,
    testAstHasTapes,
    testAst
} from "./testUtilsAst";

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Rename(t2/t1) of t1:hello', function() {
        const grammar = Rename(t1("hello"), "t1", "t2");
        testAstHasTapes(grammar, ["t2"]);
        //testHasNoVocab(grammar, "t1");
        //testHasVocab(grammar, {t2: 4});
        testAst(grammar, [{t2: "hello"}]);
    });

    describe('Rename(t2/t1) of t1:hi+t2:wo', function() {
        const grammar = Rename(Seq(t1("hi"), t2("wo")), "t1", "t2");
        testAstHasTapes(grammar, ["t2"]);
        //testHasVocab(grammar, {t2: 4});
        testAst(grammar, [{t2: "hiwo"}]);
    }); 

    describe('Rename(t5/t1) of t1:hello+t2:foo', function() {
        const grammar = Rename(Seq(t1("hello"), t2("foo")), "t3", "t4");
        testAstHasTapes(grammar, ["t1", "t2"]);
        testAst(grammar, [{t1: "hello", t2: "foo"}]);
    });
        
    describe('rename(t1:hello+t5:foo) from t1 to t2', function() {
        const grammar = Rename(Seq(t1("hello"), t5("foo")), "t1", "t2");
        testAstHasTapes(grammar, ["t2", "t5"]);
        //testHasVocab(grammar, {"t2": 4, "t5": 2});
        //testHasNoVocab(grammar, "t1");
        testAst(grammar, [{t2: "hello", t5: "foo"}]);
    });

    describe('Alt(rename(t1:hello+t5:foo) t1 -> t2|rename(t1:hello+t5:foo) t1->t3)', function() {
        const grammar = Uni(Rename(Seq(t1("hello"), t5("foo")), "t1", "t2"),
                        Rename(Seq(t1("hello"), t5("foo")), "t1", "t3"));
        testAstHasTapes(grammar, ["t2", "t3", "t5"]);
        //testHasVocab(grammar, {"t2": 4, "t3": 4, "t5": 2});
        //testHasNoVocab(grammar, "t1");
        testAst(grammar, [{t2: "hello", t5: "foo"}, {t3: "hello", t5: "foo"}]);
    });

    /*
    describe('Rename + embed bug encountered in implementing templates', function() {
        const symbolTable = makeTestNamespace({ "s": Seq(t2("hi"), t3("hello"), t4("goodbye")) });
        const grammar = Uni(Rename(Seq(Emb("s", symbolTable), t5("foo")), "t2", "t1"),
                        Rename(Seq(Emb("s", symbolTable), t5("foo")), "t3", "t1"),
                        Rename(Seq(Emb("s", symbolTable), t5("foo")), "t4", "t1"));
        testAstHasTapes(grammar, ["t1", "t2", "t3", "t4", "t5"]);
        //testHasVocab(grammar, {"t1": 9, "t2": 2, "t3": 4, "t4": 6, "t5": 2});
        testAst(grammar, [{"t1":"hi","t3":"hello","t4":"goodbye","t5":"foo"}, 
                              {"t2":"hi","t1":"hello","t4":"goodbye","t5":"foo"},
                              {"t2":"hi","t3":"hello","t1":"goodbye","t5":"foo"}]);
    }); */

    describe('Joining t2:hello & rename(t2/t1, t1:hello))', function() {
        const grammar = Join(t2("hello"),
                             Rename(t1("hello"), "t1", "t2"));
        testAst(grammar, [{t2: "hello"}]);
    });

    describe('Joining rename(t2/t1, t1:hello)) & t2:hello', function() {
        const grammar = Join(Rename(t1("hello"), "t1", "t2"),
                             t2("hello"));
        testAst(grammar, [{t2: "hello"}]);
    });

    describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t2:hello', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                             t2("hello"));
        testAst(grammar, [{t2: "hello", t3: "foo"}]);
    });

    describe('Joining t2:hello & rename(t2/t1, t1:hello+t3:foo)) & ', function() {
        const grammar = Join(t2("hello"), Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        testAst(grammar, [{t2: "hello", t3: "foo"}]);
    });

    describe('Joining t3:foo & rename(t2/t1, t1:hello+t3:foo)) & ', function() {
        const grammar = Join(t3("foo"), Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        testAst(grammar, [{t2: "hello", t3: "foo"}]);
    });

    describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t2:hello+t3:bar', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                             Seq(t2("hello"), t3("bar")));
        testAst(grammar, []);
    });

    describe('Joining t2:hello+t3:bar & rename(t2/t1, t1:hello+t3:foo))', function() {
        const grammar = Join(Seq(t2("hello"), t3("bar")),
                             Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        testAst(grammar, []);
    });
    
    describe('Filtering of t2:hiwo & rename(t2/t1) of t1:hi+t2:wo', function() {
        const grammar = Filter(t2("hiwo"), Rename(Seq(t1("hi"), t2("wo")), "t1", "t2"));
        testAstHasTapes(grammar, ["t2"]);
        //testHasVocab(grammar, {t2: 4});
        testAst(grammar, [{t2: "hiwo"}]);
    }); 
});
