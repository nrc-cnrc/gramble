import { Seq, Join, Any, Filter, Uni, Epsilon } from "../../src/ast";
import { testAstHasTapes, t1, t2, testAst } from './testUtilsAst';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('t1:hi + t1:.', function() {
        const grammar = Seq(t1("hi"), Any("t1"));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hih"}, {t1: "hii"}]);
    });

    describe('t1:. + t1:hi', function() {
        const grammar = Seq(Any("t1"), t1("hi"));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hhi"}, {t1: "ihi"}]);
    });

    describe('Maybe t1:.', function() {
        const grammar = Uni(Epsilon(), Any("t1"));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{}]);
    });

    describe('Joining t1:h & t1:.', function() {
        const grammar = Join(t1("h"), Any("t1"));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "h"}]);
    });

    describe('Joining t1:hello & t1:.ello', function() {
        const grammar = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:ello & t1:.ello', function() {
        const grammar = Join(t1("ello"), Seq(Any("t1"), t1('ello')));
        testAst(grammar, []);
    });

    describe('Joining t1:hello & t1:h.llo', function() {
        const grammar = Join(t1("hello"), Seq(t1("h"), Any("t1"), t1('llo')));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hllo & t1:h.llo', function() {
        const grammar = Join(t1("hllo"), Seq(t1("h"), Any("t1"), t1('llo')));
        testAst(grammar, []);
    });

    describe('Joining t1:hello & t1:hell.', function() {
        const grammar = Join(t1("hello"), Seq(t1("hell"), Any("t1")));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hell & t1:hell.', function() {
        const grammar = Join(t1("hell"), Seq(t1("hell"), Any("t1")));
        testAst(grammar, []);
    });


    // The same tests but with the dot on the left side

    describe('Joining t1:. & t1:h', function() {
        const grammar = Join(Any("t1"), t1("h"));
        testAst(grammar, [{t1: "h"}]);
    });

    describe('Joining t1:.ello & t1:hello', function() {
        const grammar = Join(Seq(Any("t1"), t1('ello')), t1("hello"));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:.ello & t1:ello', function() {
        const grammar = Join(Seq(Any("t1"), t1('ello')), t1("ello"));
        testAst(grammar, []);
    });

    describe('Joining t1:h.llo & t1:hello', function() {
        const grammar = Join(Seq(t1("h"), Any("t1"), t1('llo')), t1("hello"));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:h.llo & t1:hllo', function() {
        const grammar = Join(Seq(t1("h"), Any("t1"), t1('llo')), t1("hllo"));
        testAst(grammar, []);
    });

    describe('Joining t1:hell. & t1:hello', function() {
        const grammar = Join(Seq(t1("hell"), Any("t1")), t1("hello"));
        testAst(grammar, [{t1: "hello"}]);
    });

    describe('Joining t1:hell. & t1:hell', function() {
        const grammar = Join(Seq(t1("hell"), Any("t1")), t1("hell"));
        testAst(grammar, []);
    });

    describe('Filtering t1:hi & t1:.+t1:.', function() {
        const grammar = Filter(t1("hi"), Seq(Any("t1"), Any("t1")));
        testAst(grammar, [{t1: "hi"}]);
    });

    describe('Filtering t1:hi+t2:hi & t1:.+t1:.+t2:.+t2.', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Any("t1"), Any("t1"), Any("t2"), Any("t2")));
        testAst(grammar, [{t1: "hi", t2: "hi"}]);
    });

    describe('Filtering t1:hi+t2:hi & t1:.+t2:.+t1:.+t2.', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Any("t1"), Any("t2"), Any("t1"), Any("t2")));
        testAst(grammar, [{t1: "hi", t2: "hi"}]);
    });

    
    describe('Filtering t1:hi+t2:hi & (t1:.+t2:.)+(t1:.+t2.)', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")), Seq(Seq(Any("t1"), Any("t2")), Seq(Any("t1"), Any("t2"))));
        testAst(grammar, [{t1: "hi", t2: "hi"}]);
    });

});
