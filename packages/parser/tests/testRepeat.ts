
import { Seq, Join, Rep, Epsilon, Filter, Uni } from "../src/stateMachine";
import { text, t1, t2, unrelated, testHasTapes, testHasVocab, testGrammarUncompiled } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Between 0 and 1 Os: text:o{0,1}', function() {
        const grammar = Rep(text("o"), 0, 1);
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 1});
        testGrammarUncompiled(grammar, [{},
                              {text: "o"}]);
    });

    describe('Between 1 and 4 Os: text:o{1,4}', function() {
        const grammar = Rep(text("o"), 1, 4);
        testGrammarUncompiled(grammar, [{text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"}]);
    });

    describe('Between 1 and 4 Os: text:o{1,4}, plus an unrelated foo', function() {
        const grammar = Seq(Rep(text("o"), 1, 4), unrelated("foo"));
        testGrammarUncompiled(grammar, [{text: "o", unrelated: "foo"},
                              {text: "oo", unrelated: "foo"},
                              {text: "ooo", unrelated: "foo"},
                              {text: "oooo", unrelated: "foo"}]);
    });

    describe('Unrelated foo + Between 1 and 4 Os: text:o{1,4}', function() {
        const grammar = Seq(unrelated("foo"), Rep(text("o"), 1, 4));
        testGrammarUncompiled(grammar, [{text: "o", unrelated: "foo"},
                              {text: "oo", unrelated: "foo"},
                              {text: "ooo", unrelated: "foo"},
                              {text: "oooo", unrelated: "foo"}]);
    });

    describe('Hello with between 1 and 4 Os: text:hell+text:o{1,4}', function() {
        const grammar = Seq(text("hell"), Rep(text("o"), 1, 4));
        testGrammarUncompiled(grammar, [{text: "hello"},
                              {text: "helloo"},
                              {text: "hellooo"},
                              {text: "helloooo"}]);
    });

    describe('Hello with between 0 and 1 Os: text:hell+text:o{0,1}', function() {
        const grammar = Seq(text("hell"), Rep(text("o"), 0, 1));
        testGrammarUncompiled(grammar, [{text: "hell"},
                              {text: "hello"}]);
    });

    describe('Hello with between 1 and 4 Hs: text:h{1,4}+text(ello)', function() {
        const grammar = Seq(Rep(text("h"), 1, 4), text("ello"));
        testGrammarUncompiled(grammar, [{text: "hello"},
                              {text: "hhello"},
                              {text: "hhhello"},
                              {text: "hhhhello"}]);
    });

    describe('Hello with between 0 and 1 Hs: text:h{0,1}+text(ello)', function() {
        const grammar = Seq(Rep(text("h"), 0, 1), text("ello"));
        testGrammarUncompiled(grammar, [{text: "ello"},
                              {text: "hello"}]);
    });

    describe('Joining "hhello" & hello with between 1 and 4 Hs', function() {
        const grammar = Join(text("hhello"), Seq(Rep(text("h"), 1, 4), text("ello")));
        testGrammarUncompiled(grammar, [{text: "hhello"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and "hhello"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello")), text("hhello"));
        testGrammarUncompiled(grammar, [{text: "hhello"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and the same', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello")),
                             Seq(Rep(text("h"), 1, 4), text("ello")));
        testGrammarUncompiled(grammar, [{text: "hello"},
                              {text: "hhello"},
                              {text: "hhhello"},
                              {text: "hhhhello"}]);
    });
    
    describe('Joining between 1 and 4 Hs and the same, with unrelated "world"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), unrelated("world")),
                             Seq(Rep(text("h"), 1, 4), unrelated("world")));
        testGrammarUncompiled(grammar, [{text: "h", unrelated: "world"},
                              {text: "hh", unrelated: "world"},
                              {text: "hhh", unrelated: "world"},
                              {text: "hhhh", unrelated: "world"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and the same, with unrelated "world"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello"), unrelated("world")),
                             Seq(Rep(text("h"), 1, 4), text("ello"), unrelated("world")));
        testGrammarUncompiled(grammar, [{text: "hello", unrelated: "world"},
                              {text: "hhello", unrelated: "world"},
                              {text: "hhhello", unrelated: "world"},
                              {text: "hhhhello", unrelated: "world"}]);
    });
    
    describe('Joining h{1,4} and ello (with unrelated in between) and the same, with unrelated "world"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), unrelated("world"), text("ello")),
                             Seq(Rep(text("h"), 1, 4), unrelated("world"), text("ello")));
        testGrammarUncompiled(grammar, [{text: "hello", unrelated: "world"},
                              {text: "hhello", unrelated: "world"},
                              {text: "hhhello", unrelated: "world"},
                              {text: "hhhhello", unrelated: "world"}]);
    });

    
    describe('Filtering text:na{0,2} & ε', function() {
        const grammar = Filter(Rep(text("na"), 0, 2), Epsilon());
        testGrammarUncompiled(grammar, [{},
            {text: "na"},
            {text: "nana"}]);
    });

    
    describe('Filtering ε & text:na{0,2}', function() {
        const grammar = Filter(Epsilon(), Rep(text("na"), 0, 2));
        testGrammarUncompiled(grammar, [{}]);
    });

    
    describe('Joining text:na{0,2} & ε', function() {
        const grammar = Join(Rep(text("na"), 0, 2), Epsilon());
        testGrammarUncompiled(grammar, [{},
            {text: "na"},
            {text: "nana"}]);
    });

    describe('Joining ε & text:na{0,2}', function() {
        const grammar = Join(Epsilon(), Rep(text("na"), 0, 2));
        testGrammarUncompiled(grammar, [{},
            {text: "na"},
            {text: "nana"}]);
    });

    describe('Text with between 1 and 4 NAs: text:na{1,4}', function() {
        const grammar = Rep(text("na"), 1, 4);
        testGrammarUncompiled(grammar, [{text: "na"},
                              {text: "nana"},
                              {text: "nanana"},
                              {text: "nananana"}]);
    });

    describe('Text with between 0 and 2 NAs: text:na{0,2}', function() {
        const grammar = Rep(text("na"), 0, 2);
        testGrammarUncompiled(grammar, [{},
                              {text: "na"},
                              {text: "nana"}]);
    });

    describe('Text with 0 NAs: text:na{0,0}', function() {
        const grammar = Rep(text("na"), 0, 0);
        testGrammarUncompiled(grammar, [{}]);
    });

    describe('Text with no NAs (min > max): text:na{4,3}', function() {
        const grammar = Rep(text("na"), 4, 3);
        testGrammarUncompiled(grammar, []);
    });

    describe('Text with between 0 and 2 NAs (negative min): text:na{-3,2}', function() {
        const grammar = Rep(text("na"), -3, 2);
        testGrammarUncompiled(grammar, [{},
                              {text: "na"},
                              {text: "nana"}]);
    });

    describe('Text with between 1 and unlimited Os: text:o+', function() {
        const grammar = Rep(text("o"), 1);
        testGrammarUncompiled(grammar, [{text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"},
                              {text: "ooooo"}],
                    undefined, 6);
    });

    describe('text:o*', function() {
        const grammar = Rep(text("o"));
        testGrammarUncompiled(grammar, [{},
                              {text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"},
                              {text: "ooooo"}],
                    undefined, 6);
    });

    describe('text:h*+text:i', function() {
        const grammar = Seq(Rep(text("h")), text("i"));
        testGrammarUncompiled(grammar, [{text: "i"},
                              {text: "hi"},
                              {text: "hhi"},
                              {text: "hhhi"},
                              {text: "hhhhi"},
                              {text: "hhhhhi"}],
                    undefined, 7);
    });

    
    describe('text:h+text:i*', function() {
        const grammar = Seq(text("h"), Rep(text("i")));
        testGrammarUncompiled(grammar, [{text: "h"},
                              {text: "hi"},
                              {text: "hii"},
                              {text: "hiii"},
                              {text: "hiiii"},
                              {text: "hiiiii"}],
                    undefined, 7);
    });
    
    describe('(text:h+text:i)*', function() {
        const grammar = Rep(Seq(text("h"), text("i")));
        testGrammarUncompiled(grammar, [{},
                              {text: "hi"},
                              {text: "hihi"},
                              {text: "hihihi"}],
                    undefined, 7);
    });

    
    describe('(t1:h+t2:i)*', function() {
        const grammar = Rep(Seq(t1("h"), t2("i")));
        testGrammarUncompiled(grammar, [{},
                            {"t1":"h","t2":"i"},
                            {"t1":"hh","t2":"ii"},
                            {"t1":"hhh","t2":"iii"}],
                    undefined, 7);
    });

    // it's iffy here whether we want to count all of these results as
    // valid.  they DO come from different execution histories, so I'm inclined
    // to say they're all valid even though they're string-identical.
    describe('(t1:h|t2:i)*', function() {
        const grammar = Rep(Uni(t1("h"), t2("i")));
        testGrammarUncompiled(grammar, [{},
                                {"t1":"h"},
                                {"t2":"i"},
                                {"t1":"hh"},
                                {"t1":"h","t2":"i"},
                                {"t2":"i","t1":"h"},
                                {"t2":"ii"},
                                {"t1":"hhh"},
                                {"t1":"hh","t2":"i"},
                                {"t1":"hh","t2":"i"},
                                {"t1":"h","t2":"ii"},
                                {"t2":"i","t1":"hh"},
                                {"t2":"ii","t1":"h"},
                                {"t2":"ii","t1":"h"},
                                {"t2":"iii"}],
                    undefined, 4);
    });

    describe('(t1:a+t2:a|t1:b+t2:b)*', function() {
        const grammar = Rep(Uni(Seq(t1("a"), t2("a")), 
                                Seq(t1("b"), t2("b"))));
        testGrammarUncompiled(grammar, [{},
                                {"t1":"a","t2":"a"},
                                {"t1":"b","t2":"b"},
                                {"t1":"aa","t2":"aa"},
                                {"t1":"ab","t2":"ab"},
                                {"t1":"ba","t2":"ba"},
                                {"t1":"bb","t2":"bb"}],
                    undefined, 5);
    });

    describe('Filtering t1:h[ t2:h* ]', function() {
        const grammar = Filter(t1("h"),
                                 Rep(t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{t1:"h"}]);
    });
    
    describe('Filtering t1:h[ (t1:h|t2:h)* ]', function() {
        const grammar = Filter(t1("h"),
                                 Rep(Uni(t1("h"), t2("h"))));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});

        testGrammarUncompiled(grammar, [{'t1': 'h'}]);
    });

    describe('Seq t1:h+ε*', function() {
        const grammar = Seq(t1("h"), Rep(Epsilon()));
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {'t1': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h'}]);
    });

    describe('Nested repetition: (text(ba){1,2}){2,3}', function() {
        const grammar = Rep(Rep(text("ba"), 1, 2), 2, 3);
        testGrammarUncompiled(grammar, [
                              {text: "baba"},
                              {text: "bababa"},
                              {text: "babababa"},
                              {text: "bababababa"},
                              {text: "babababababa"}]);
    });

    describe('(t1:h+t2:h){2}', function() {
        const grammar = Rep(Seq(t1("h"), t2("h")), 2, 2);
        testGrammarUncompiled(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering (t1:h+t2:h){2} with t1:hh+t2:hh ', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h")), 2, 2), Seq(t1("hh"), t2("hh")));
        testGrammarUncompiled(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering t1:hh+t2:hh with (t1:h+t2:h){2}', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h")), 2, 2));
        testGrammarUncompiled(grammar, [{t1: "hh", t2: "hh"}]);
    });

    
    describe('Filtering (t1:h+t2:h)* with t1:hh+t2:hh ', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h"))), Seq(t1("hh"), t2("hh")));
        testGrammarUncompiled(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering t1:hh+t2:hh with (t1:h+t2:h)*', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h"))));
        testGrammarUncompiled(grammar, [{t1: "hh", t2: "hh"}]);
    });
    
});