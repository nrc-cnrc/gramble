
import { Seq, Join, Rep, Epsilon, Filter, Uni, Any } from "../../src/ast";
import { t1, t2, testAstHasTapes, testAst } from './testUtilsAst';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Between 0 and 1 Os: t1:o{0,1}', function() {
        const grammar = Rep(t1("o"), 0, 1);
        testAstHasTapes(grammar, ["t1"]);
        testAst(grammar, [{},
                              {t1: "o"}]);
    });

    describe('Between 1 and 4 Os: t1:o{1,4}', function() {
        const grammar = Rep(t1("o"), 1, 4);
        testAst(grammar, [{t1: "o"},
                              {t1: "oo"},
                              {t1: "ooo"},
                              {t1: "oooo"}]);
    });

    describe('Between 1 and 4 Os: t1:o{1,4}, plus an t2 foo', function() {
        const grammar = Seq(Rep(t1("o"), 1, 4), t2("foo"));
        testAst(grammar, [{t1: "o", t2: "foo"},
                              {t1: "oo", t2: "foo"},
                              {t1: "ooo", t2: "foo"},
                              {t1: "oooo", t2: "foo"}]);
    });

    describe('t2 foo + Between 1 and 4 Os: t1:o{1,4}', function() {
        const grammar = Seq(t2("foo"), Rep(t1("o"), 1, 4));
        testAst(grammar, [{t1: "o", t2: "foo"},
                              {t1: "oo", t2: "foo"},
                              {t1: "ooo", t2: "foo"},
                              {t1: "oooo", t2: "foo"}]);
    });

    describe('Hello with between 1 and 4 Os: t1:hell+t1:o{1,4}', function() {
        const grammar = Seq(t1("hell"), Rep(t1("o"), 1, 4));
        testAst(grammar, [{t1: "hello"},
                              {t1: "helloo"},
                              {t1: "hellooo"},
                              {t1: "helloooo"}]);
    });

    describe('Hello with between 0 and 1 Os: t1:hell+t1:o{0,1}', function() {
        const grammar = Seq(t1("hell"), Rep(t1("o"), 0, 1));
        testAst(grammar, [{t1: "hell"},
                              {t1: "hello"}]);
    });

    describe('Hello with between 1 and 4 Hs: t1:h{1,4}+t1(ello)', function() {
        const grammar = Seq(Rep(t1("h"), 1, 4), t1("ello"));
        testAst(grammar, [{t1: "hello"},
                              {t1: "hhello"},
                              {t1: "hhhello"},
                              {t1: "hhhhello"}]);
    });

    describe('Hello with between 0 and 1 Hs: t1:h{0,1}+t1(ello)', function() {
        const grammar = Seq(Rep(t1("h"), 0, 1), t1("ello"));
        testAst(grammar, [{t1: "ello"},
                              {t1: "hello"}]);
    });

    describe('Joining "hhello" & hello with between 1 and 4 Hs', function() {
        const grammar = Join(t1("hhello"), Seq(Rep(t1("h"), 1, 4), t1("ello")));
        testAst(grammar, [{t1: "hhello"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and "hhello"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello")), t1("hhello"));
        testAst(grammar, [{t1: "hhello"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and the same', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello")),
                             Seq(Rep(t1("h"), 1, 4), t1("ello")));
        testAst(grammar, [{t1: "hello"},
                              {t1: "hhello"},
                              {t1: "hhhello"},
                              {t1: "hhhhello"}]);
    });
    
    describe('Joining between 1 and 4 Hs and the same, with t2 "world"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t2("world")),
                             Seq(Rep(t1("h"), 1, 4), t2("world")));
        testAst(grammar, [{t1: "h", t2: "world"},
                              {t1: "hh", t2: "world"},
                              {t1: "hhh", t2: "world"},
                              {t1: "hhhh", t2: "world"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and the same, with t2 "world"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")),
                             Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")));
        testAst(grammar, [{t1: "hello", t2: "world"},
                              {t1: "hhello", t2: "world"},
                              {t1: "hhhello", t2: "world"},
                              {t1: "hhhhello", t2: "world"}]);
    });
    
    describe('Joining h{1,4} and ello (with t2 in between) and the same, with t2 "world"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")),
                             Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")));
        testAst(grammar, [{t1: "hello", t2: "world"},
                              {t1: "hhello", t2: "world"},
                              {t1: "hhhello", t2: "world"},
                              {t1: "hhhhello", t2: "world"}]);
    });

    
    describe('Filtering t1:na{0,2} & ε', function() {
        const grammar = Filter(Rep(t1("na"), 0, 2), Epsilon());
        testAst(grammar, [{},
            {t1: "na"},
            {t1: "nana"}]);
    });

    
    describe('Filtering ε & t1:na{0,2}', function() {
        const grammar = Filter(Epsilon(), Rep(t1("na"), 0, 2));
        testAst(grammar, [{}]);
    });

    
    describe('Joining t1:na{0,2} & ε', function() {
        const grammar = Join(Rep(t1("na"), 0, 2), Epsilon());
        testAst(grammar, [{},
            {t1: "na"},
            {t1: "nana"}]);
    });

    describe('Joining ε & t1:na{0,2}', function() {
        const grammar = Join(Epsilon(), Rep(t1("na"), 0, 2));
        testAst(grammar, [{},
            {t1: "na"},
            {t1: "nana"}]);
    });

    describe('t1 with between 1 and 4 NAs: t1:na{1,4}', function() {
        const grammar = Rep(t1("na"), 1, 4);
        testAst(grammar, [{t1: "na"},
                              {t1: "nana"},
                              {t1: "nanana"},
                              {t1: "nananana"}]);
    });

    describe('t1 with between 0 and 2 NAs: t1:na{0,2}', function() {
        const grammar = Rep(t1("na"), 0, 2);
        testAst(grammar, [{},
                              {t1: "na"},
                              {t1: "nana"}]);
    });

    describe('t1 with 0 NAs: t1:na{0,0}', function() {
        const grammar = Rep(t1("na"), 0, 0);
        testAst(grammar, [{}]);
    });

    describe('t1 with no NAs (min > max): t1:na{4,3}', function() {
        const grammar = Rep(t1("na"), 4, 3);
        testAst(grammar, []);
    });

    describe('t1 with between 0 and 2 NAs (negative min): t1:na{-3,2}', function() {
        const grammar = Rep(t1("na"), -3, 2);
        testAst(grammar, [{},
                              {t1: "na"},
                              {t1: "nana"}]);
    });

    describe('t1 with between 1 and unlimited Os: t1:o+', function() {
        const grammar = Rep(t1("o"), 1);
        testAst(grammar, [{t1: "o"},
                              {t1: "oo"},
                              {t1: "ooo"},
                              {t1: "oooo"},
                              {t1: "ooooo"}],
                    "__MAIN__", undefined, 6);
    });

    describe('t1:o*', function() {
        const grammar = Rep(t1("o"));
        testAst(grammar, [{},
                              {t1: "o"},
                              {t1: "oo"},
                              {t1: "ooo"},
                              {t1: "oooo"},
                              {t1: "ooooo"}],
                    "__MAIN__", undefined, 6);
    });

    describe('t1:h*+t1:i', function() {
        const grammar = Seq(Rep(t1("h")), t1("i"));
        testAst(grammar, [{t1: "i"},
                              {t1: "hi"},
                              {t1: "hhi"},
                              {t1: "hhhi"},
                              {t1: "hhhhi"},
                              {t1: "hhhhhi"}],
                    "__MAIN__", undefined, 7);
    });
    
    describe('t1:h+t1:i*', function() {
        const grammar = Seq(t1("h"), Rep(t1("i")));
        testAst(grammar, [{t1: "h"},
                              {t1: "hi"},
                              {t1: "hii"},
                              {t1: "hiii"},
                              {t1: "hiiii"},
                              {t1: "hiiiii"}],
                    "__MAIN__", undefined, 7);
    });
    
    describe('(t1:h+t1:i)*', function() {
        const grammar = Rep(Seq(t1("h"), t1("i")));
        testAst(grammar, [{},
                              {t1: "hi"},
                              {t1: "hihi"},
                              {t1: "hihihi"}],
                    "__MAIN__", undefined, 7);
    });

    
    describe('(t1:h+t2:i)*', function() {
        const grammar = Rep(Seq(t1("h"), t2("i")));
        testAst(grammar, [{},
                            {"t1":"h","t2":"i"},
                            {"t1":"hh","t2":"ii"},
                            {"t1":"hhh","t2":"iii"}],
                    "__MAIN__", undefined, 7);
    });

    describe('(t1:h|t2:i)*', function() {
        const grammar = Rep(Uni(t1("h"), t2("i")));
        testAst(grammar, [{},
                                {"t1":"h"},
                                {"t2":"i"},
                                {"t1":"hh"},
                                {"t1":"h","t2":"i"},
                                {"t2":"ii"},
                                {"t1":"hhh"},
                                {"t1":"hh","t2":"i"},
                                {"t1":"h","t2":"ii"},
                                {"t2":"iii"}],
                    "__MAIN__", undefined, 4);
    });

    describe('(t1:a+t2:a|t1:b+t2:b)*', function() {
        const grammar = Rep(Uni(Seq(t1("a"), t2("a")), 
                                Seq(t1("b"), t2("b"))));
        testAst(grammar, [{},
                                {"t1":"a","t2":"a"},
                                {"t1":"b","t2":"b"},
                                {"t1":"aa","t2":"aa"},
                                {"t1":"ab","t2":"ab"},
                                {"t1":"ba","t2":"ba"},
                                {"t1":"bb","t2":"bb"}],
                    "__MAIN__", undefined, 5);
    });

    describe('Filtering t1:h[ t2:h* ]', function() {
        const grammar = Filter(t1("h"),
                                 Rep(t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        testAst(grammar, [{t1:"h"}]);
    });
    
    describe('Filtering t1:h[ (t1:h|t2:h)* ]', function() {
        const grammar = Filter(t1("h"),
                                 Rep(Uni(t1("h"), t2("h"))));
        testAstHasTapes(grammar, ['t1', 't2']);
        testAst(grammar, [{'t1': 'h'}]);
    });

    describe('Seq t1:h+ε*', function() {
        const grammar = Seq(t1("h"), Rep(Epsilon()));
        testAstHasTapes(grammar, ['t1']);
        testAst(grammar, [{'t1': 'h'}]);
    });

    describe('Nested repetition: (t1(ba){1,2}){2,3}', function() {
        const grammar = Rep(Rep(t1("ba"), 1, 2), 2, 3);
        testAst(grammar, [
                              {t1: "baba"},
                              {t1: "bababa"},
                              {t1: "babababa"},
                              {t1: "bababababa"},
                              {t1: "babababababa"}]);
    });

    describe('(t1:h+t2:h){2}', function() {
        const grammar = Rep(Seq(t1("h"), t2("h")), 2, 2);
        testAst(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering (t1:h+t2:h){2} with t1:hh+t2:hh ', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h")), 2, 2), Seq(t1("hh"), t2("hh")));
        testAst(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering t1:hh+t2:hh with (t1:h+t2:h){2}', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h")), 2, 2));
        testAst(grammar, [{t1: "hh", t2: "hh"}]);
    });

    
    describe('Filtering (t1:h+t2:h)* with t1:hh+t2:hh ', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h"))), Seq(t1("hh"), t2("hh")));
        testAst(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering t1:hh+t2:hh with (t1:h+t2:h)*', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h"))));
        testAst(grammar, [{t1: "hh", t2: "hh"}]);
    });
    
    describe('Rep(Any): t1:hi+t1:.{0,3}', function() {
        const grammar = Seq(t1("hi"), Rep(Any("t1"), 0, 3));
        testAst(grammar, [ 
                            {t1: "hi"},
                            {t1: "hii"},
                            {t1: "hih"},
                            {t1: "hiii"},
                            {t1: "hihi"},
                            {t1: "hihh"},
                            {t1: "hiih"},
                            {t1: "hiiih"},
                            {t1: "hihih"},
                            {t1: "hihhh"},
                            {t1: "hiihh"},
                            {t1: "hiiii"},
                            {t1: "hihii"},
                            {t1: "hihhi"},
                            {t1: "hiihi"}]);
    });

    describe('Rep(Any): t1:.{0,3}+t1:hi', function() {
        const grammar = Seq(Rep(Any("t1"), 0, 3), t1("hi"));
        testAst(grammar, [{t1: "hi"},
                            {t1: "ihi"},
                            {t1: "hhi"},
                            {t1: "iihi"},
                            {t1: "hihi"},
                            {t1: "hhhi"},
                            {t1: "ihhi"},
                            {t1: "iihhi"},
                            {t1: "hihhi"},
                            {t1: "hhhhi"},
                            {t1: "ihhhi"},
                            {t1: "iiihi"},
                            {t1: "hiihi"},
                            {t1: "hhihi"},
                            {t1: "ihihi"}]);
    });
    
    describe('Rep(Any): t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
        const grammar = Seq( Rep(Any("t1"), 0, 1), t1("hi"), Rep(Any("t1"), 0, 1));
        testAst(grammar, [ 
                            {t1: "hi"},
                            {t1: "hhi"},
                            {t1: "ihi"},
                            {t1: "hih"},
                            {t1: "hii"},
                            {t1: "hhih"},
                            {t1: "hhii"},
                            {t1: "ihih"},
                            {t1: "ihii"}]);
    });

    describe('Joining t1:hi & t1:.{0,1}', function() {
        const grammar = Join(t1("h"), Rep(Any("t1"), 0, 1));
        testAst(grammar, [{t1: "h"}]);
    });
    
    describe('Filtering t1:.{0,1} & ε', function() {
        const grammar = Filter(Rep(Any("t1"), 0, 2), Epsilon());
        testAst(grammar, [{}]);
    });
    
    describe('Filtering ε & t1:.{0,1}', function() {
        const grammar = Filter(Epsilon(), Rep(Any("t1"), 0, 2));
        testAst(grammar, [{}]);
    });
    
    describe('Joining t1:.{0,1} & ε', function() {
        const grammar = Join(Rep(Any("t1"), 0, 2), Epsilon());
        testAst(grammar, [{}]);
    });
    
    describe('Joining ε & t1:.{0,1}', function() {
        const grammar = Join(Epsilon(), Rep(Any("t1"), 0, 2));
        testAst(grammar, [{}]);
    });

    describe('Filtering "hello" with he.*', function() {
        const grammar = Filter(t1("hello"), Seq(t1("he"), Rep(Any("t1"))));
        testAst(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('Filtering "hello" with .*lo', function() {
        const grammar = Filter(t1("hello"), Seq(Rep(Any("t1")), t1("lo")));
        testAst(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('Filtering "hello" with .*e.*', function() {
        const grammar = Filter(t1("hello"), Seq(Rep(Any("t1")), t1("e"), Rep(Any("t1"))));
        testAst(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('Filtering "hello" with .*l.*', function() {
        const grammar = Filter(t1("hello"), Seq(Rep(Any("t1")), t1("l"), Rep(Any("t1"))));
        testAst(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('Filtering "hello" with .*h.*', function() {
        const grammar = Filter(t1("hello"), Seq(Rep(Any("t1")), t1("h"), Rep(Any("t1"))));
        testAst(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('Filtering "hello" with .*o.*', function() {
        const grammar = Filter(t1("hello"), Seq(Rep(Any("t1")), t1("h"), Rep(Any("t1"))));
        testAst(grammar, [ 
                            {t1: "hello"}]);
    });
});