
import { Uni, Match, UnionState, Seq, Any, MatchDot, Dot, MatchDotRep, MatchDotStar, Join, Semijoin } from "../src/stateMachine";
import { t1, t2, unrelated, testHasTapes, testHasVocab, testGenerate, testGrammarUncompiled } from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";


describe(`${path.basename(module.filename)}`, function() {

    /*
    describe('matching t1/t2 of h', function() {
        const grammar = Match(Seq(t1("h"), t2("h")), "t1", "t2")
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    describe('matching t1/t2 of h|i', function() {
        const grammar = Match(Seq(Uni(t1("h"), t1("i")), Uni(t2("h"), t2("i"))), "t1", "t2")
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'},
                       {'t1': 'i', 't2': 'i'}])
    });

    
    describe('matching t1/t2 of h|i + t1(hi) + t2(ih)', function() {
        const grammar = Seq(Match(Seq(Uni(t1("h"), t1("i")), Uni(t2("h"), t2("i"))), "t1", "t2"),
                                t1("hi"), t2("ih"))
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hhi', 't2': 'hih'},
                            {'t1': 'ihi', 't2': 'iih'}]);
    });

    describe('Match(.,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Seq(Any("t1"), Any("t2")), "t1", "t2"),
                                t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hhi', 't2': 'hih'},
                           {'t1': 'ihi', 't2': 'iih'}]);
    });

    
    describe('Match(t1:.,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Any("t1"), "t1", "t2"),
                            t1("hi"), t2("ih"))
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, []);
    });

    

    describe('Match(t1:.|t2:.,t1,t2) + t1:hi+t2:hi', function() {
        const grammar = Seq(Match(Uni(Any("t1"), Any("t2")), "t1", "t2"),
                            t1("hi"), t2("ih"))
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, []);
    });

    describe('Match(.,t1,t2) + t1:hi+t2:ih', function() {
    
        const grammar = Seq(MatchDot("t1", "t2"), t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hhi', 't2': 'hih'},
                       {'t1': 'ihi', 't2': 'iih'}]);
    });


    describe('Match(.,t1,t2) + t1:hi+t2:hello', function() {
    
        const grammar = Seq(MatchDot("t1", "t2"), t1("hi"), t2("hello"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 4});
        testGrammarUncompiled(grammar, [{'t1': 'hhi', 't2': 'hhello'}]);
    });
    

    describe('Match(..,t1,t2) + t1:hi+t2:ih', function() {
    
        const grammar = Seq(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                            t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hhhi', 't2': 'hhih'},
                                        {'t1': 'hihi', 't2': 'hiih'},
                                        {'t1': 'ihhi', 't2': 'ihih'},
                                        {'t1': 'iihi', 't2': 'iiih'}]);
    });


    describe('Match(.{2},t1,t2) + t1:hi+t2:ih', function() {
    
        const grammar = Seq(MatchDotRep(2, 2, "t1", "t2"),
                                t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hhhi', 't2': 'hhih'},
                                        {'t1': 'hihi', 't2': 'hiih'},
                                        {'t1': 'ihhi', 't2': 'ihih'},
                                        {'t1': 'iihi', 't2': 'iiih'}]);
    });

    describe('Match(.*,t1,t2) + t1:hi+t2:ih', function() {
    
        const grammar = Seq(MatchDotStar("t1", "t2"), t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hi', 't2': 'ih'},
                            {'t1': 'hhi', 't2': 'hih'},
                            {'t1': 'ihi', 't2': 'iih'},
                            {'t1': 'hhhi', 't2': 'hhih'},
                            {'t1': 'hihi', 't2': 'hiih'},
                            {'t1': 'ihhi', 't2': 'ihih'},
                            {'t1': 'iihi', 't2': 'iiih'},
                            {'t1': 'hhhhi', 't2': 'hhhih'},
                            {'t1': 'hhihi', 't2': 'hhiih'},
                            {'t1': 'hihhi', 't2': 'hihih'},
                            {'t1': 'hiihi', 't2': 'hiiih'},
                            {'t1': 'ihhhi', 't2': 'ihhih'},
                            {'t1': 'ihihi', 't2': 'ihiih'},
                            {'t1': 'iihhi', 't2': 'iihih'},
                            {'t1': 'iiihi', 't2': 'iiiih'}], 4, 12);
    });


    describe('Match(.*,t1,t2) | t1:hi+t2:ih', function() {
    
        const grammar = Uni(MatchDotStar("t1", "t2"), Seq(t1("hi"), t2("ih")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{},
                                        {'t1': 'h', 't2': 'h'},
                                        {'t1': 'i', 't2': 'i'},
                                        {'t1': 'hh', 't2': 'hh'},
                                        {'t1': 'hi', 't2': 'hi'},
                                        {'t1': 'ih', 't2': 'ih'},
                                        {'t1': 'ii', 't2': 'ii'},
                                        {'t1': 'hhh', 't2': 'hhh'},
                                        {'t1': 'hhi', 't2': 'hhi'},
                                        {'t1': 'hih', 't2': 'hih'},
                                        {'t1': 'hii', 't2': 'hii'},
                                        {'t1': 'ihh', 't2': 'ihh'},
                                        {'t1': 'ihi', 't2': 'ihi'},
                                        {'t1': 'iih', 't2': 'iih'},
                                        {'t1': 'iii', 't2': 'iii'},
                                        {'t1': 'hi', 't2': 'ih'}], 4, 8);
    });



    describe('Match(..,t1,t2) | t1:hi+t2:ih', function() {
    
        const grammar = Uni(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                            Seq(t1("hi"), t2("ih")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hh', 't2': 'hh'},
                                        {'t1': 'hi', 't2': 'hi'},
                                        {'t1': 'ih', 't2': 'ih'},
                                        {'t1': 'ii', 't2': 'ii'},
                                        {'t1': 'hi', 't2': 'ih'}]);
    });

    describe('Join Match(.,t1,t2) & t1:h+t2:h', function() {
    
        const grammar = Join(MatchDot("t1", "t2"), Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'}]);
    });


    describe('Join t1:h+t2:h & Match(.,t1,t2)', function() {
    
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDot("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    describe('Join Match(.{0.1},t1,t2) & t1:h+t2:h', function() {
    
        const grammar = Join(MatchDotRep(0, 1, "t1", "t2"),
                                    Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    
    describe('Join t1:h+t2:h & Match(.{0.1},t1,t2)', function() {
    
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDotRep(0, 1, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'}]);
    });


    describe('Join Match(.{0.4},t1,t2) & t1:h+t2:h', function() {
    
        const grammar = Join(MatchDotRep(0, 4, "t1", "t2"),
                                    Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 1, 't2': 1});
        testGrammarUncompiled(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    describe('Join Match(..,t1,t2) & t1:hi+t2:hi', function() {
    
        const grammar =  Join(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                             Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    describe(' Join Match(.{2},t1,t2) & t1:hi+t2:hi', function() {
    
        const grammar =  Join(MatchDotRep(2, 2, "t1", "t2"),
                            Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    describe('Join Match(.{1,2},t1,t2) & t1:hi+t2:hi', function() {
    
        const grammar =  Join(MatchDotRep(1, 2, "t1", "t2"),
                            Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    */

    describe('Join Match(.{0,2},t1,t2) & t1:hi+t2:hi', function() {
    
        const grammar =  Semijoin(MatchDotRep(0, 2, "t1", "t2"),
                            Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    describe('Join t1:hi+t2:hi + Match(..,t1,t2)', function() {
        const grammar =  Semijoin(Seq(t1("hi"), t2("hi")), Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {'t1': 2, 't2': 2});
        testGrammarUncompiled(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    }); 

});