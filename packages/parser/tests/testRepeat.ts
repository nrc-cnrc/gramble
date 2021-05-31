
import { Seq, Join, Rep, Empty, Filter, Uni } from "../src/stateMachine";
import { text, t1, t2, unrelated, testHasTapes, testHasVocab, 
         testGenerateAndSample, testGrammarUncompiled } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Between 0 and 1 Os: text:o{0,1}', function() {
        const grammar = Rep(text("o"), 0, 1);
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 1});
        testGenerateAndSample(grammar, [{},
                              {text: "o"}]);
    });

    describe('Between 1 and 4 Os: text:o{1,4}', function() {
        const grammar = Rep(text("o"), 1, 4);
        testGenerateAndSample(grammar, [{text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"}]);
    });

    describe('Between 1 and 4 Os: text:o{1,4}, plus an unrelated foo', function() {
        const grammar = Seq(Rep(text("o"), 1, 4), unrelated("foo"));
        testGenerateAndSample(grammar, [{text: "o", unrelated: "foo"},
                              {text: "oo", unrelated: "foo"},
                              {text: "ooo", unrelated: "foo"},
                              {text: "oooo", unrelated: "foo"}]);
    });

    describe('Unrelated foo + Between 1 and 4 Os: text:o{1,4}', function() {
        const grammar = Seq(unrelated("foo"), Rep(text("o"), 1, 4));
        testGenerateAndSample(grammar, [{text: "o", unrelated: "foo"},
                              {text: "oo", unrelated: "foo"},
                              {text: "ooo", unrelated: "foo"},
                              {text: "oooo", unrelated: "foo"}]);
    });

    describe('Hello with between 1 and 4 Os: text:hell+text:o{1,4}', function() {
        const grammar = Seq(text("hell"), Rep(text("o"), 1, 4));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {text: "helloo"},
                              {text: "hellooo"},
                              {text: "helloooo"}]);
    });

    describe('Hello with between 0 and 1 Os: text:hell+text:o{0,1}', function() {
        const grammar = Seq(text("hell"), Rep(text("o"), 0, 1));
        testGenerateAndSample(grammar, [{text: "hell"},
                              {text: "hello"}]);
    });

    describe('Hello with between 1 and 4 Hs: text:h{1,4}+text(ello)', function() {
        const grammar = Seq(Rep(text("h"), 1, 4), text("ello"));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {text: "hhello"},
                              {text: "hhhello"},
                              {text: "hhhhello"}]);
    });

    describe('Hello with between 0 and 1 Hs: text:h{0,1}+text(ello)', function() {
        const grammar = Seq(Rep(text("h"), 0, 1), text("ello"));
        testGenerateAndSample(grammar, [{text: "ello"},
                              {text: "hello"}]);
    });

    describe('Joining "hhello" & Hello with between 1 and 4 Hs', function() {
        const grammar = Join(text("hhello"), Seq(Rep(text("h"), 1, 4), text("ello")));
        testGenerateAndSample(grammar, [{text: "hhello"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and "hhello"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello")), text("hhello"));
        testGenerateAndSample(grammar, [{text: "hhello"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and the same', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello")),
                             Seq(Rep(text("h"), 1, 4), text("ello")));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {text: "hhello"},
                              {text: "hhhello"},
                              {text: "hhhhello"}]);
    });
    
    describe('Joining between 1 and 4 Hs and the same, with unrelated "world"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), unrelated("world")),
                             Seq(Rep(text("h"), 1, 4), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "h", unrelated: "world"},
                              {text: "hh", unrelated: "world"},
                              {text: "hhh", unrelated: "world"},
                              {text: "hhhh", unrelated: "world"}]);
    });

    describe('Joining hello with between 1 and 4 Hs and the same, with unrelated "world"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), text("ello"), unrelated("world")),
                             Seq(Rep(text("h"), 1, 4), text("ello"), unrelated("world")));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "world"},
                              {text: "hhello", unrelated: "world"},
                              {text: "hhhello", unrelated: "world"},
                              {text: "hhhhello", unrelated: "world"}]);
    });
    
    describe('Joining h{1,4} and ello (with unrelated in between) and the same, with unrelated "world"', function() {
        const grammar = Join(Seq(Rep(text("h"), 1, 4), unrelated("world"), text("ello")),
                             Seq(Rep(text("h"), 1, 4), unrelated("world"), text("ello")));
        testGenerateAndSample(grammar, [{text: "hello", unrelated: "world"},
                              {text: "hhello", unrelated: "world"},
                              {text: "hhhello", unrelated: "world"},
                              {text: "hhhhello", unrelated: "world"}]);
    });

    
    describe('Filtering text:na{0,2} & empty()', function() {
        const grammar = Filter(Rep(text("na"), 0, 2), Empty());
        testGenerateAndSample(grammar, [{}]);
    });

    
    describe('Filtering empty() & text:na{0,2}', function() {
        const grammar = Filter(Empty(), Rep(text("na"), 0, 2));
        testGenerateAndSample(grammar, [{}]);
    });

    
    describe('Joining text:na{0,2} & empty()', function() {
        const grammar = Join(Rep(text("na"), 0, 2), Empty());
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Joining empty() & text:na{0,2}', function() {
        const grammar = Join(Empty(), Rep(text("na"), 0, 2));
        testGenerateAndSample(grammar, [{}]);
    });


    describe('Text with between 1 and 4 NAs: text:na{1,4}', function() {
        const grammar = Rep(text("na"), 1, 4);
        testGenerateAndSample(grammar, [{text: "na"},
                              {text: "nana"},
                              {text: "nanana"},
                              {text: "nananana"}]);
    });

    describe('Text with between 0 and 2 NAs: text:na{0,2}', function() {
        const grammar = Rep(text("na"), 0, 2);
        testGenerateAndSample(grammar, [{},
                              {text: "na"},
                              {text: "nana"}]);
    });

    describe('Text with 0 NAs: text:na{0,0}', function() {
        const grammar = Rep(text("na"), 0, 0);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Text with no NAs (min > max): text:na{4,3}', function() {
        const grammar = Rep(text("na"), 4, 3);
        testGenerateAndSample(grammar, []);
    });

    describe('Text with between 0 and 2 NAs (negative min): text:na{-3,2}', function() {
        const grammar = Rep(text("na"), -3, 2);
        testGenerateAndSample(grammar, [{},
                              {text: "na"},
                              {text: "nana"}]);
    });

    describe('Text with between 1 and unlimited Os: text:o+', function() {
        const grammar = Rep(text("o"), 1);
        testGenerateAndSample(grammar, [{text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"},
                              {text: "ooooo"}],
                    undefined, 6);
    });

    describe('Text with between 0 and unlimited Os: text:o*', function() {
        const grammar = Rep(text("o"), 0);
        testGenerateAndSample(grammar, [{},
                              {text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"},
                              {text: "ooooo"}],
                    undefined, 6);
    });

    describe('text:o*', function() {
        const grammar = Rep(text("o"));
        testGenerateAndSample(grammar, [{},
                              {text: "o"},
                              {text: "oo"},
                              {text: "ooo"},
                              {text: "oooo"},
                              {text: "ooooo"}],
                    undefined, 6);
    });


    describe('Filtering t1:h & t2:h*', function() {
        const grammar = Filter(t1("h"),
                                 Rep(t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGenerateAndSample(grammar, [{'t1': 'h'}]);
    });
    
    describe('Filtering t1:h & (t1:h|t2:h)*', function() {
        const grammar = Filter(t1("h"),
                                 Rep(Uni(t1("h"), t2("h"))));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});

        testGenerateAndSample(grammar, [{'t1': 'h'}]);
    });

    describe('Seq t1:h+0*', function() {
        const grammar = Seq(t1("h"), Rep(Empty()));
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {'t1': 1});
        testGenerateAndSample(grammar, [{'t1': 'h'}]);
    });

    describe('Nested repetition: (text(ba){1,2}){2,3}', function() {
        const grammar = Rep(Rep(text("ba"), 1, 2), 2, 3);
        testGenerateAndSample(grammar, [
                              {text: "baba"},
                              {text: "bababa"},
                              {text: "babababa"},
                              {text: "bababababa"},
                              {text: "babababababa"}]);
    });

    describe('(t1:h+t2:h){2}', function() {
        const grammar = Rep(Seq(t1("h"), t2("h")), 2, 2);
        testGenerateAndSample(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering (t1:h+t2:h){2} with t1:hh+t2:hh ', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h")), 2, 2), Seq(t1("hh"), t2("hh")));
        testGenerateAndSample(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('Filtering t1:hh+t2:hh with (t1:h+t2:h){2}', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h")), 2, 2));
        testGenerateAndSample(grammar, [{t1: "hh", t2: "hh"}]);
    });

});
