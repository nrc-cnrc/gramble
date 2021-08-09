import { 
    Uni, 
    Match, 
    Seq, Any, Join, Filter, Rep, MatchDot, Dot, MatchDotRep, MatchDotRep2, MatchDotStar, MatchDotStar2,
    //Dot, MatchDot, MatchDotRep, MatchDotStar, MatchDotRep2, MatchDotStar2
} from "../src/ast";

import { 
    t1, t2, testAstHasTapes, 
    //testHasVocab, 
    testAst 
} from './testUtilsAst';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    // 1. Match(t1:h,t2:h)
    describe('1: matching t1/t2 of h', function() {
        const grammar = Match(Seq(t1("h"), t2("h")), "t1", "t2");
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 2. Match(t1:h|i,t2:h|i)
    describe('2: matching t1/t2 of h|i', function() {
        const grammar = Match(Seq(Uni(t1("h"), t1("i")), 
                                Uni(t2("h"), t2("i"))), "t1", "t2");
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'h', 't2': 'h'},
                          {'t1': 'i', 't2': 'i'}])
    });

    // Seq with Match tests

    describe('3: matching t1/t2 of h|i + t1(hi) + t2(ih)', function() {
        const grammar = Seq(Match(Seq(Uni(t1("h"), t1("i")),
                                    Uni(t2("h"), t2("i"))), "t1", "t2"),
                                t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hhi', 't2': 'hih'},
                          {'t1': 'ihi', 't2': 'iih'}]);
    });

    // 4. t1:hi+t2:ih + Match(t1:h|i,t2:h|i)
    describe('4: t1(hi) + t2(ih) + matching t1/t2 of h|i', function() {
        const grammar = Seq(t1("hi"), t2("ih"),
                        Match(Seq(Uni(t1("h"), t1("i")),
                                    Uni(t2("h"), t2("i"))), "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hih', 't2': 'ihh'},
                          {'t1': 'hii', 't2': 'ihi'}]);
    });


    // 5. Match(.,t1,t2) + t1:hi+t2:ih
    describe('5: Match(.,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Seq(Any("t1"), Any("t2")), "t1", "t2"),
                        t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hhi', 't2': 'hih'},
                          {'t1': 'ihi', 't2': 'iih'}]);
    });


    // 6. t1:hi+t2:ih + Match(.,t1,t2)
    describe('6: t1:hi+t2:ih + Match(.,t1,t2)', function() {
        const grammar = Seq(t1("hi"), t2("ih"),
                        Match(Seq(Any("t1"), Any("t2")), "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hih', 't2': 'ihh'},
                         {'t1': 'hii', 't2': 'ihi'}]);
    });

    // 7. Match(t1:.,t1,t2) + t1:hi+t2:ih
    describe('7: Match(t1:.,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Any("t1"), "t1", "t2"),
                        t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, []);
    }); 

    // 8. Match(t1:.|t2:.,t1,t2) + t1:hi+t2:hi
    describe('8: Match(t1:.|t2:.,t1,t2) + t1:hi+t2:hi', function() {
        const grammar = Seq(Match(Uni(Any("t1"), Any("t2")), "t1", "t2"),
                        t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, []);
    });

    // 9. Match(.,t1,t2) + t1:hi+t2:ih
    describe('9: Match(.,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDot("t1", "t2"), t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hhi', 't2': 'hih'},
                                    {'t1': 'ihi', 't2': 'iih'}]);
    });
    
    
    // 10. t1:hi+t2:ih + Match(.,t1,t2)
    describe('10: t1:hi+t2:ih + Match(.,t1,t2)', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDot("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hih', 't2': 'ihh'},
                          {'t1': 'hii', 't2': 'ihi'}]);
    });

    // 11. Match(.,t1,t2) + t1:hi+t2:hello
    describe('11: Match(.,t1,t2) + t1:hi+t2:hello', function() {
        const grammar = Seq(MatchDot("t1", "t2"), t1("hi"), t2("hello"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, [{'t1': 'hhi', 't2': 'hhello'}]);
    });

    // 12. Match(..,t1,t2) + t1:hi+t2:ih
    describe('12: Match(..,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                        t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hhhi', 't2': 'hhih'},
                          {'t1': 'hihi', 't2': 'hiih'},
                          {'t1': 'ihhi', 't2': 'ihih'},
                          {'t1': 'iihi', 't2': 'iiih'}]);
    });

    // 13a. Match(.{2},t1,t2) + t1:hi+t2:ih
    describe('13a: Match(.{2},t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDotRep(2, 2, "t1", "t2"), t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hhhi', 't2': 'hhih'},
                          {'t1': 'hihi', 't2': 'hiih'},
                          {'t1': 'ihhi', 't2': 'ihih'},
                          {'t1': 'iihi', 't2': 'iiih'}]);
    });

    // 13b. Match(.{2},t1,t2) + t1:hi+t2:ih
    describe('13b: Match(.{2},t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDotRep2(2, 2, "t1", "t2"), t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hhhi', 't2': 'hhih'},
                                    {'t1': 'hihi', 't2': 'hiih'},
                                    {'t1': 'ihhi', 't2': 'ihih'},
                                    {'t1': 'iihi', 't2': 'iiih'}]);
    });

    // 14a. t1:hi+t2:ih + Match(.{2},t1,t2)
    describe('14a: t1:hi+t2:ih + Match(.{2},t1,t2)', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDotRep(2, 2, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hihh', 't2': 'ihhh'},
                                    {'t1': 'hihi', 't2': 'ihhi'},
                                    {'t1': 'hiih', 't2': 'ihih'},
                                    {'t1': 'hiii', 't2': 'ihii'}]);
    });

    // 14b. t1:hi+t2:ih + Match(.{2},t1,t2)
    describe('14b: t1:hi+t2:ih + Match(.{2},t1,t2)', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDotRep2(2, 2, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hihh', 't2': 'ihhh'},
                                    {'t1': 'hihi', 't2': 'ihhi'},
                                    {'t1': 'hiih', 't2': 'ihih'},
                                    {'t1': 'hiii', 't2': 'ihii'}]);
    });

    
    // 15a. Match(.*,t1,t2) + t1:hi+t2:ih
    describe('15a: Match(.*,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDotStar("t1", "t2"), t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
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
                                    {'t1': 'iiihi', 't2': 'iiiih'}],
                            undefined, 4, 12);
    });

    
    // 15b. Match(.*,t1,t2) + t1:hi+t2:ih
    describe('15b: Match(.*,t1,t2) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDotStar2("t1", "t2"), t1("hi"), t2("ih"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
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
                                    {'t1': 'iiihi', 't2': 'iiiih'}],
                            undefined, 4, 12);
    });

    // 16a. t1:hi+t2:ih + Match(.*,t1,t2)
    describe('16a: t1:hi+t2:ih + Match(.*,t1,t2)', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
                                    {'t1': 'hih', 't2': 'ihh'},
                                    {'t1': 'hii', 't2': 'ihi'},
                                    {'t1': 'hihh', 't2': 'ihhh'},
                                    {'t1': 'hihi', 't2': 'ihhi'},
                                    {'t1': 'hiih', 't2': 'ihih'},
                                    {'t1': 'hiii', 't2': 'ihii'},
                                    {'t1': 'hihhh', 't2': 'ihhhh'},
                                    {'t1': 'hihhi', 't2': 'ihhhi'},
                                    {'t1': 'hihih', 't2': 'ihhih'},
                                    {'t1': 'hihii', 't2': 'ihhii'},
                                    {'t1': 'hiihh', 't2': 'ihihh'},
                                    {'t1': 'hiihi', 't2': 'ihihi'},
                                    {'t1': 'hiiih', 't2': 'ihiih'},
                                    {'t1': 'hiiii', 't2': 'ihiii'}],
                            undefined, 4, 12);
    });

    // 16b. t1:hi+t2:ih + Match(.*,t1,t2)
    describe('16b: t1:hi+t2:ih + Match(.*,t1,t2)', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
                                    {'t1': 'hih', 't2': 'ihh'},
                                    {'t1': 'hii', 't2': 'ihi'},
                                    {'t1': 'hihh', 't2': 'ihhh'},
                                    {'t1': 'hihi', 't2': 'ihhi'},
                                    {'t1': 'hiih', 't2': 'ihih'},
                                    {'t1': 'hiii', 't2': 'ihii'},
                                    {'t1': 'hihhh', 't2': 'ihhhh'},
                                    {'t1': 'hihhi', 't2': 'ihhhi'},
                                    {'t1': 'hihih', 't2': 'ihhih'},
                                    {'t1': 'hihii', 't2': 'ihhii'},
                                    {'t1': 'hiihh', 't2': 'ihihh'},
                                    {'t1': 'hiihi', 't2': 'ihihi'},
                                    {'t1': 'hiiih', 't2': 'ihiih'},
                                    {'t1': 'hiiii', 't2': 'ihiii'}],
                            undefined, 4, 12);
    });

    // Uni with Match tests

    // 17. Match(..,t1,t2) | t1:hi+t2:ih
    describe('17: Match(..,t1,t2) | t1:hi+t2:ih', function() {
    const grammar = Uni(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                        Seq(t1("hi"), t2("ih")));
    testAstHasTapes(grammar, ['t1', 't2']);
    //testHasVocab(grammar, {'t1': 2, 't2': 2});
    testAst(grammar, [{'t1': 'hh', 't2': 'hh'},
                                    {'t1': 'hi', 't2': 'hi'},
                                    {'t1': 'ih', 't2': 'ih'},
                                    {'t1': 'ii', 't2': 'ii'},
                                    {'t1': 'hi', 't2': 'ih'}]);
    });

    // 18. t1:hi+t2:ih | Match(..,t1,t2)
    describe('18: t1:hi+t2:ih | Match(..,t1,t2)', function() {
        const grammar = Uni(Seq(t1("hi"), t2("ih")),
                        Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
         //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
                                    {'t1': 'hh', 't2': 'hh'},
                                    {'t1': 'hi', 't2': 'hi'},
                                    {'t1': 'ih', 't2': 'ih'},
                                    {'t1': 'ii', 't2': 'ii'}]);
    });

    // 19a. Match(.*,t1,t2) | t1:hi+t2:ih
    describe('19a: Match(.*,t1,t2) | t1:hi+t2:ih', function() {
    const grammar = Uni(MatchDotStar("t1", "t2"), Seq(t1("hi"), t2("ih")));
    testAstHasTapes(grammar, ['t1', 't2']);
    //testHasVocab(grammar, {'t1': 2, 't2': 2});
    testAst(grammar, [{},
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
                                    {'t1': 'hi', 't2': 'ih'}],
                                undefined, 4, 8);
    });

    
    // 19b. Match(.*,t1,t2) | t1:hi+t2:ih
    describe('19b: Match(.*,t1,t2) | t1:hi+t2:ih', function() {
        const grammar = Uni(MatchDotStar2("t1", "t2"), Seq(t1("hi"), t2("ih")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{},
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
                                    {'t1': 'hi', 't2': 'ih'}],
                                undefined, 4, 8);
    });

    // 20a. t1:hi+t2:ih | Match(.*,t1,t2)
    describe('20a: t1:hi+t2:ih | Match(.*,t1,t2)', function() {
    const grammar = Uni(Seq(t1("hi"), t2("ih")), MatchDotStar("t1", "t2"));
    testAstHasTapes(grammar, ['t1', 't2']);
    //testHasVocab(grammar, {'t1': 2, 't2': 2});
    testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
                                    {},
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
                                    {'t1': 'iii', 't2': 'iii'}],
                                undefined, 4, 8);
    });

    // 20b. t1:hi+t2:ih | Match(.*,t1,t2)
    describe('20b: t1:hi+t2:ih | Match(.*,t1,t2)', function() {
        const grammar = Uni(Seq(t1("hi"), t2("ih")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'ih'},
                                    {},
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
                                    {'t1': 'iii', 't2': 'iii'}],
                                undefined, 4, 8);
    });

    // Filter/Join with Match tests

    // 21. Filter t1:h+t2:h & Match(.,t1,t2)
    describe('21: Filter t1:h+t2:h & Match(.,t1,t2)', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")), MatchDot("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 22. Filter Match(.,t1,t2) & t1:h+t2:h
    describe('22: Filter Match(.,t1,t2) & t1:h+t2:h', function() {
        const grammar = Filter(MatchDot("t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 23. Join t1:h+t2:h & Match(.,t1,t2)
    describe('23: Join t1:h+t2:h & Match(.,t1,t2)', function() {
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDot("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 24. Join Match(.,t1,t2) & t1:h+t2:h
    describe('24: Join Match(.,t1,t2) & t1:h+t2:h', function() {
        const grammar = Join(MatchDot("t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 25a. Filter t1:h+t2:h & Match(.{0,3},t1,t2)
    describe('25a: Filter t1:h+t2:h & Match(.{0,3},t1,t2)', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")), MatchDotRep(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 25b. Filter t1:h+t2:h & Match(.{0,3},t1,t2)
    describe('25b: Filter t1:h+t2:h & Match(.{0,3},t1,t2)', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")), MatchDotRep2(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 26a. Filter Match(.{0,3},t1,t2) & t1:h+t2:h
    describe('26a: Filter Match(.{0,3},t1,t2) & t1:h+t2:h', function() {
        const grammar = Filter(MatchDotRep(0, 3, "t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 26b. Filter Match(.{0,3},t1,t2) & t1:h+t2:h
    describe('26b: Filter Match(.{0,3},t1,t2) & t1:h+t2:h', function() {
        const grammar = Filter(MatchDotRep2(0, 3, "t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 27a. Join t1:h+t2:h & Match(.{0,3},t1,t2)
    describe('27a: Join t1:h+t2:h & Match(.{0,3},t1,t2)', function() {
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDotRep(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 27b. Join t1:h+t2:h & Match(.{0,3},t1,t2)
    describe('27b: Join t1:h+t2:h & Match(.{0,3},t1,t2)', function() {
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDotRep2(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 28a. Join Match(.{0,3},t1,t2) & t1:h+t2:h
    describe('28a: Join Match(.{0,3},t1,t2) & t1:h+t2:h', function() {
        const grammar = Join(MatchDotRep(0, 3, "t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 28b. Join Match(.{0,3},t1,t2) & t1:h+t2:h
    describe('28b: Join Match(.{0,3},t1,t2) & t1:h+t2:h', function() {
        const grammar = Join(MatchDotRep2(0, 3, "t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 29a. Filter t1:h+t2:h & Match(.*,t1,t2)
    describe('29a: Filter t1:h+t2:h & Match(.*,t1,t2)', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 29b. Filter t1:h+t2:h & Match(.*,t1,t2)
    describe('29b: Filter t1:h+t2:h & Match(.*,t1,t2)', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 30a. Filter Match(.*,t1,t2) & t1:h+t2:h
    describe('30a: Filter Match(.*,t1,t2) & t1:h+t2:h', function() {
        const grammar = Filter(MatchDotStar("t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 30b. Filter Match(.*,t1,t2) & t1:h+t2:h
    describe('30b: Filter Match(.*,t1,t2) & t1:h+t2:h', function() {
        const grammar = Filter(MatchDotStar2("t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 31a. Join t1:h+t2:h & Match(.*,t1,t2)
    describe('31a: Join t1:h+t2:h & Match(.*,t1,t2)', function() {
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 31b. Join t1:h+t2:h & Match(.*,t1,t2)
    describe('31b: Join t1:h+t2:h & Match(.*,t1,t2)', function() {
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 32a. Join Match(.*,t1,t2) & t1:h+t2:h
    describe('32a: Join Match(.*,t1,t2) & t1:h+t2:h', function() {
        const grammar = Join(MatchDotStar("t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });

    // 32b. Join Match(.*,t1,t2) & t1:h+t2:h
    describe('32b: Join Match(.*,t1,t2) & t1:h+t2:h', function() {
        const grammar = Join(MatchDotStar2("t1", "t2"), Seq(t1("h"), t2("h")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 1, 't2': 1});
        testAst(grammar, [{'t1': 'h', 't2': 'h'}]);
    });


    // 33. Filter t1:hi+t2:hi & Match(..,t1,t2)
    describe('33: Filter t1:hi+t2:hi & Match(..,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hi"), t2("hi")),
                                    Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 34. Filter Match(..,t1,t2) & t1:hi+t2:hi
    describe('34: Filter Match(..,t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Filter(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                                    Seq(t1("hi"), t2("hi")),);
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 35. Join t1:hi+t2:hi & Match(..,t1,t2)
    describe('35: Join t1:hi+t2:hi & Match(..,t1,t2)', function() {
        const grammar =  Join(Seq(t1("hi"), t2("hi")),
                                Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 36. Join Match(..,t1,t2) & t1:hi+t2:hi
    describe('36: Join Match(..,t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Join(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                                Seq(t1("hi"), t2("hi")),);
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });


    // 37a. Filter t1:hi+t2:hi & Match(.{2},t1,t2)
    describe('37a: Filter t1:hi+t2:hi & Match(.{2},t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hi"), t2("hi")), MatchDotRep(2, 2, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 37b. Filter t1:hi+t2:hi & Match(.{2},t1,t2)
    describe('37b: Filter t1:hi+t2:hi & Match(.{2},t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hi"), t2("hi")), MatchDotRep2(2, 2, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 38a. Filter Match(.{2},t1,t2) & t1:hi+t2:hi
    describe('38a: Filter Match(.{2},t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Filter(MatchDotRep(2, 2, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 38b. Filter Match(.{2},t1,t2) & t1:hi+t2:hi
    describe('38b: Filter Match(.{2},t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Filter(MatchDotRep2(2, 2, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 39a. Join t1:hi+t2:hi & Match(.{2},t1,t2)
    describe('39a: Join t1:hi+t2:hi & Match(.{2},t1,t2)', function() {
        const grammar =  Join(Seq(t1("hi"), t2("hi")), MatchDotRep(2, 2, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 39b. Join t1:hi+t2:hi & Match(.{2},t1,t2)
    describe('39b: Join t1:hi+t2:hi & Match(.{2},t1,t2)', function() {
        const grammar =  Join(Seq(t1("hi"), t2("hi")), MatchDotRep2(2, 2, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 40a. Join Match(.{2},t1,t2) & t1:hi+t2:hi
    describe('40a: Join Match(.{2},t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Join(MatchDotRep(2, 2, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 40b. Join Match(.{2},t1,t2) & t1:hi+t2:hi
    describe('40b: Join Match(.{2},t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Join(MatchDotRep2(2, 2, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });


    // 41a. Filter t1:hi+t2:hi & Match(.{0.3),t1,t2)
    describe('41a: Filter t1:hi+t2:hi & Match(.{0.3),t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hi"), t2("hi")), MatchDotRep(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 41b. Filter t1:hi+t2:hi & Match(.{0.3),t1,t2)
    describe('41b: Filter t1:hi+t2:hi & Match(.{0.3),t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hi"), t2("hi")), MatchDotRep2(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 42a. Filter Match(.{0.3),t1,t2) & t1:hi+t2:hi
    describe('42a: Filter Match(.{0.3),t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Filter(MatchDotRep(0, 3, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 42b. Filter Match(.{0.3),t1,t2) & t1:hi+t2:hi
    describe('42b: Filter Match(.{0.3),t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Filter(MatchDotRep2(0, 3, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 43a. Join t1:hi+t2:hi & Match(.{0.3),t1,t2)
    describe('43a: Join t1:hi+t2:hi & Match(.{0.3),t1,t2)', function() {
        const grammar =  Join(Seq(t1("hi"), t2("hi")), MatchDotRep(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 43b. Join t1:hi+t2:hi & Match(.{0.3),t1,t2)
    describe('43b: Join t1:hi+t2:hi & Match(.{0.3),t1,t2)', function() {
        const grammar =  Join(Seq(t1("hi"), t2("hi")), MatchDotRep2(0, 3, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 44a. Join Match(.{0.3),t1,t2) & t1:hi+t2:hi
    describe('44a: Join Match(.{0.3),t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Join(MatchDotRep(0, 3, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });

    // 44b. Join Match(.{0.3),t1,t2) & t1:hi+t2:hi
    describe('44b: Join Match(.{0.3),t1,t2) & t1:hi+t2:hi', function() {
        const grammar =  Join(MatchDotRep2(0, 3, "t1", "t2"), Seq(t1("hi"), t2("hi")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 2});
        testAst(grammar, [{'t1': 'hi', 't2': 'hi'}]);
    });


    // 45a. Filter t1:hello+t2:hello & Match(.{3,7},t1,t2)
    describe('45a: Filter t1:hello+t2:hello & Match(.{3,7},t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hello"), t2("hello")),
                                    MatchDotRep(3, 7, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 45b. Filter t1:hello+t2:hello & Match(.{3,7},t1,t2)
    describe('45b: Filter t1:hello+t2:hello & Match(.{3,7},t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hello"), t2("hello")),
                                    MatchDotRep2(3, 7, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 46a. Filter Match(.{3,7},t1,t2) & t1:hello+t2:hello
    describe('46a: Filter Match(.{3,7},t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Filter(MatchDotRep(3, 7, "t1", "t2"),
                                    Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 46b. Filter Match(.{3,7},t1,t2) & t1:hello+t2:hello
    describe('46b: Filter Match(.{3,7},t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Filter(MatchDotRep2(3, 7, "t1", "t2"),
                                    Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 47a. Join t1:hello+t2:hello & Match(.{3,7},t1,t2)
    describe('47a: Join t1:hello+t2:hello & Match(.{3,7},t1,t2)', function() {
        const grammar =  Join(Seq(t1("hello"), t2("hello")),
                                MatchDotRep(3, 7, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 47b. Join t1:hello+t2:hello & Match(.{3,7},t1,t2)
    describe('47b: Join t1:hello+t2:hello & Match(.{3,7},t1,t2)', function() {
        const grammar =  Join(Seq(t1("hello"), t2("hello")),
                                MatchDotRep2(3, 7, "t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 48a. Join Match(.{3,7},t1,t2) & t1:hello+t2:hello
    describe('48a: Join Match(.{3,7},t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Join(MatchDotRep(3, 7, "t1", "t2"),
                                Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 48b. Join Match(.{3,7},t1,t2) & t1:hello+t2:hello
    describe('48b: Join Match(.{3,7},t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Join(MatchDotRep2(3, 7, "t1", "t2"),
                                Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });


    // 49a. Filter t1:hello+t2:hello & Match(.*,t1,t2)
    describe('49a: Filter t1:hello+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hello"), t2("hello")),
                                    MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 49b. Filter t1:hello+t2:hello & Match(.*,t1,t2)
    describe('49b: Filter t1:hello+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hello"), t2("hello")),
                                    MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 50a. Filter Match(.*,t1,t2) & t1:hello+t2:hello
    describe('50a: Filter Match(.*,t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Filter(MatchDotStar("t1", "t2"),
                                    Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 50b. Filter Match(.*,t1,t2) & t1:hello+t2:hello
    describe('50b: Filter Match(.*,t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Filter(MatchDotStar2("t1", "t2"),
                                    Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 51a. Join t1:hello+t2:hello & Match(.*,t1,t2)
    describe('51a: Join t1:hello+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Join(Seq(t1("hello"), t2("hello")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 51b. Join t1:hello+t2:hello & Match(.*,t1,t2)
    describe('51b: Join t1:hello+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Join(Seq(t1("hello"), t2("hello")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 52a. Join Match(.*,t1,t2) & t1:hello+t2:hello
    describe('52a: Join Match(.*,t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Join(MatchDotStar("t1", "t2"), Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });

    // 52b. Join Match(.*,t1,t2) & t1:hello+t2:hello
    describe('52b: Join Match(.*,t1,t2) & t1:hello+t2:hello', function() {
        const grammar =  Join(MatchDotStar2("t1", "t2"), Seq(t1("hello"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 4});
        testAst(grammar, [{'t1': 'hello', 't2': 'hello'}]);
    });


    // 53a. Filter t1:he+t2:hello & Match(.*,t1,t2)
    describe('53a: Filter t1:he+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("he"), t2("hello")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 53b. Filter t1:he+t2:hello & Match(.*,t1,t2)
    describe('53b: Filter t1:he+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("he"), t2("hello")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 54a. Filter Match(.*,t1,t2) & t1:he+t2:hello
    describe('54a: Filter Match(.*,t1,t2) & t1:he+t2:hello', function() {
        const grammar =  Filter(MatchDotStar("t1", "t2"), Seq(t1("he"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 54b. Filter Match(.*,t1,t2) & t1:he+t2:hello
    describe('54b: Filter Match(.*,t1,t2) & t1:he+t2:hello', function() {
        const grammar =  Filter(MatchDotStar2("t1", "t2"), Seq(t1("he"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 55a. Join t1:he+t2:hello & Match(.*,t1,t2)
    describe('55a: Join t1:he+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Join(Seq(t1("he"), t2("hello")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 55b. Join t1:he+t2:hello & Match(.*,t1,t2)
    describe('55b: Join t1:he+t2:hello & Match(.*,t1,t2)', function() {
        const grammar =  Join(Seq(t1("he"), t2("hello")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 56a. Join Match(.*,t1,t2) & t1:he+t2:hello
    describe('56a: Join Match(.*,t1,t2) & t1:he+t2:hello', function() {
        const grammar =  Join(MatchDotStar("t1", "t2"), Seq(t1("he"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });

    // 56b. Join Match(.*,t1,t2) & t1:he+t2:hello
    describe('56b: Join Match(.*,t1,t2) & t1:he+t2:hello', function() {
        const grammar =  Join(MatchDotStar2("t1", "t2"), Seq(t1("he"), t2("hello")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 2, 't2': 4});
        testAst(grammar, []);
    });


    // 57a. Filter t1:hello+t2:hell & Match(.*,t1,t2)
    describe('57a: Filter t1:hello+t2:hell & Match(.*,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hello"), t2("hell")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 57b. Filter t1:hello+t2:hell & Match(.*,t1,t2)
    describe('57b: Filter t1:hello+t2:hell & Match(.*,t1,t2)', function() {
        const grammar =  Filter(Seq(t1("hello"), t2("hell")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 58a. Filter Match(.*,t1,t2) & t1:hello+t2:hell
    describe('58a: Filter Match(.*,t1,t2) & t1:hello+t2:hell', function() {
        const grammar =  Filter(MatchDotStar("t1", "t2"), Seq(t1("hello"), t2("hell")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 58b. Filter Match(.*,t1,t2) & t1:hello+t2:hell
    describe('58b: Filter Match(.*,t1,t2) & t1:hello+t2:hell', function() {
        const grammar =  Filter(MatchDotStar2("t1", "t2"), Seq(t1("hello"), t2("hell")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 59a. Join t1:hello+t2:hell & Match(.*,t1,t2)
    describe('59a: Join t1:hello+t2:hell & Match(.*,t1,t2)', function() {
        const grammar =  Join(Seq(t1("hello"), t2("hell")), MatchDotStar("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 59b. Join t1:hello+t2:hell & Match(.*,t1,t2)
    describe('59b: Join t1:hello+t2:hell & Match(.*,t1,t2)', function() {
        const grammar =  Join(Seq(t1("hello"), t2("hell")), MatchDotStar2("t1", "t2"));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 60a. Join Match(.*,t1,t2) & t1:hello+t2:hell
    describe('60a: Join Match(.*,t1,t2) & t1:hello+t2:hell', function() {
        const grammar =  Join(MatchDotStar("t1", "t2"), Seq(t1("hello"), t2("hell")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });

    // 60b. Join Match(.*,t1,t2) & t1:hello+t2:hell
    describe('60b: Join Match(.*,t1,t2) & t1:hello+t2:hell', function() {
        const grammar =  Join(MatchDotStar2("t1", "t2"), Seq(t1("hello"), t2("hell")));
        testAstHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {'t1': 4, 't2': 3});
        testAst(grammar, []);
    });
    
});