import { 
    Uni, 
    Match, 
    Seq, Any, Join, Filter, MatchDot, Dot, 
    MatchDotRep, MatchDotRep2, MatchDotStar, 
    MatchDotStar2, CharSet, Grammar, Count
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2, testHasTapes, 
    //testHasVocab, 
    testGenerate 
} from './testUtil';

import {
    StringDict, VERBOSE_DEBUG
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Match t1:h + t2:h', function() {
        const grammar = Match(Seq(t1("h"), t2("h")), "t1", "t2");
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('2. Match t1:hi + t2:h+i', function() {
        const grammar = Match(Seq(t1("hi"), t2("h"), t2("i")), "t1", "t2");
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('3. Match t1:h|i + t2:h|i', function() {
        const grammar = Match(Seq(Uni(t1("h"), t1("i")), 
                                  Uni(t2("h"), t2("i"))), "t1", "t2");
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'}, {t1: 'i', t2: 'i'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('4. Match t1:[hi] + t2:[hi]', function() {
        const grammar = Match(Seq(CharSet("t1", ["h", "i"]), 
                                  CharSet("t2", ["h", "i"])), "t1", "t2");
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'}, {t1: 'i', t2: 'i'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('5. Match t1:[hi] + t2:h|i', function() {
        const grammar = Match(Seq(CharSet("t1", ["h", "i"]), 
                                  Uni(t2("h"), t2("i"))), "t1", "t2");
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'}, {t1: 'i', t2: 'i'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('6. Match t1:h|i + t2:[hi]', function() {
        const grammar = Match(Seq(Uni(t1("h"), t1("i")), 
                                  CharSet("t2", ["h", "i"])), "t1", "t2");
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'}, {t1: 'i', t2: 'i'}
        ];
        testGenerate(grammar, expectedResults);
    });

    // Seq with Match tests

    describe('7. (Match t1:h|i + t2:h|i) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Seq(Uni(t1("h"), t1("i")),
                                      Uni(t2("h"), t2("i"))), "t1", "t2"),
                            t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hhi', t2: 'hih'}, {t1: 'ihi', t2: 'iih'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('8. t1:hi+t2:ih + (Match t1:h|i + t2:h|i)', function() {
        const grammar = Seq(t1("hi"), t2("ih"),
                            Match(Seq(Uni(t1("h"), t1("i")),
                                      Uni(t2("h"), t2("i"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'ihh'}, {t1: 'hii', t2: 'ihi'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('9. (Match t1:a + t2:.) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Seq(Any("t1"), Any("t2")), "t1", "t2"),
                            t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hhi', t2: 'hih'}, {t1: 'ihi', t2: 'iih'} 
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('10. t1:hi+t2:ih + (Match t1:. + t2:.)', function() {
        const grammar = Seq(t1("hi"), t2("ih"),
                            Match(Seq(Any("t1"), Any("t2")), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'ihh'}, {t1: 'hii', t2: 'ihi'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('11. (Match t1/t2 t1:.) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Any("t1"), "t1", "t2"),
                            t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, []);
    }); 

    describe('12. (Match t1:. | t2:.) + t1:hi+t2:hi', function() {
        const grammar = Seq(Match(Uni(Any("t1"), Any("t2")), "t1", "t2"),
                            t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, []);
    });

    describe('13. (Match t1:.+t2:.) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDot("t1", "t2"), t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hhi', t2: 'hih'}, {t1: 'ihi', t2: 'iih'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('14. t1:hi+t2:ih + (Match t1:.+t2:.)', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDot("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'ihh'}, {t1: 'hii', t2: 'ihi'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('15. (Match t1:.+t2:.) + t1:hi+t2:hello', function() {
        const grammar = Seq(MatchDot("t1", "t2"), t1("hi"), t2("hello"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, [{t1: 'hhi', t2: 'hhello'}]);
    });

    describe('16. (Match t1:.+t2:. + t1:.+t2:.) + t1:hi+t2:ih', function() {
        const grammar = Seq(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")),
                                  "t1", "t2"),
                            t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hhhi', t2: 'hhih'}, {t1: 'hihi', t2: 'hiih'},
            {t1: 'ihhi', t2: 'ihih'}, {t1: 'iihi', t2: 'iiih'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('17a. (Match (t1:.+t2:.){2}) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDotRep(2, 2, "t1", "t2"), t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hhhi', t2: 'hhih'}, {t1: 'hihi', t2: 'hiih'},
            {t1: 'ihhi', t2: 'ihih'}, {t1: 'iihi', t2: 'iiih'}
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('17b. (Match t1:.{2}+t2:.{2}) + t1:hi+t2:ih', function() {
        const grammar = Seq(MatchDotRep2(2, 2, "t1", "t2"), t1("hi"), t2("ih"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hhhi', t2: 'hhih'}, {t1: 'hihi', t2: 'hiih'},
            {t1: 'ihhi', t2: 'ihih'}, {t1: 'iihi', t2: 'iiih'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('18a. t1:hi+t2:ih + (Match (t1:.+t2:.){2})', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDotRep(2, 2, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hihh', t2: 'ihhh'}, {t1: 'hihi', t2: 'ihhi'},
            {t1: 'hiih', t2: 'ihih'}, {t1: 'hiii', t2: 'ihii'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('18b. t1:hi+t2:ih + (Match t1:.{2}+t2:.{2})', function() {
        const grammar = Seq(t1("hi"), t2("ih"), MatchDotRep2(2, 2, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hihh', t2: 'ihhh'}, {t1: 'hihi', t2: 'ihhi'},
            {t1: 'hiih', t2: 'ihih'}, {t1: 'hiii', t2: 'ihii'}
        ];
        testGenerate(grammar, expectedResults);
    });
    
    describe('19a. (Match (t1:.+t2:.)*) + t1:hi+t2:ih', function() {
        let grammar: Grammar = Seq(MatchDotStar("t1", "t2"), t1("hi"), t2("ih"));
        grammar = Count({t1:5,t2:5}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'},       {t1: 'hhi', t2: 'hih'},
            {t1: 'ihi', t2: 'iih'},     {t1: 'hhhi', t2: 'hhih'},
            {t1: 'hihi', t2: 'hiih'},   {t1: 'ihhi', t2: 'ihih'},
            {t1: 'iihi', t2: 'iiih'},   {t1: 'hhhhi', t2: 'hhhih'},
            {t1: 'hhihi', t2: 'hhiih'}, {t1: 'hihhi', t2: 'hihih'},
            {t1: 'hiihi', t2: 'hiiih'}, {t1: 'ihhhi', t2: 'ihhih'},
            {t1: 'ihihi', t2: 'ihiih'}, {t1: 'iihhi', t2: 'iihih'},
            {t1: 'iiihi', t2: 'iiiih'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('19b. (Match t1:.*+t2:.*) + t1:hi+t2:ih', function() {
        let grammar: Grammar = Seq(MatchDotStar2("t1", "t2"), t1("hi"), t2("ih"));
        grammar = Count({t1:5,t2:5}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'},       {t1: 'hhi', t2: 'hih'},
            {t1: 'ihi', t2: 'iih'},     {t1: 'hhhi', t2: 'hhih'},
            {t1: 'hihi', t2: 'hiih'},   {t1: 'ihhi', t2: 'ihih'},
            {t1: 'iihi', t2: 'iiih'},   {t1: 'hhhhi', t2: 'hhhih'},
            {t1: 'hhihi', t2: 'hhiih'}, {t1: 'hihhi', t2: 'hihih'},
            {t1: 'hiihi', t2: 'hiiih'}, {t1: 'ihhhi', t2: 'ihhih'},
            {t1: 'ihihi', t2: 'ihiih'}, {t1: 'iihhi', t2: 'iihih'},
            {t1: 'iiihi', t2: 'iiiih'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('20a. t1:hi+t2:ih + (Match (t1:.+t2:.)*)', function() {
        let grammar: Grammar = Seq(t1("hi"), t2("ih"), MatchDotStar("t1", "t2"));
        grammar = Count({t1:5,t2:5}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'},       {t1: 'hih', t2: 'ihh'},
            {t1: 'hii', t2: 'ihi'},     {t1: 'hihh', t2: 'ihhh'},
            {t1: 'hihi', t2: 'ihhi'},   {t1: 'hiih', t2: 'ihih'},
            {t1: 'hiii', t2: 'ihii'},   {t1: 'hihhh', t2: 'ihhhh'},
            {t1: 'hihhi', t2: 'ihhhi'}, {t1: 'hihih', t2: 'ihhih'},
            {t1: 'hihii', t2: 'ihhii'}, {t1: 'hiihh', t2: 'ihihh'},
            {t1: 'hiihi', t2: 'ihihi'}, {t1: 'hiiih', t2: 'ihiih'},
            {t1: 'hiiii', t2: 'ihiii'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('20b. t1:hi+t2:ih + (Match t1:.*+t2:.*)', function() {
        let grammar: Grammar = Seq(t1("hi"), t2("ih"), MatchDotStar2("t1", "t2"));
        grammar = Count({t1:5,t2:5}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'},       {t1: 'hih', t2: 'ihh'},
            {t1: 'hii', t2: 'ihi'},     {t1: 'hihh', t2: 'ihhh'},
            {t1: 'hihi', t2: 'ihhi'},   {t1: 'hiih', t2: 'ihih'},
            {t1: 'hiii', t2: 'ihii'},   {t1: 'hihhh', t2: 'ihhhh'},
            {t1: 'hihhi', t2: 'ihhhi'}, {t1: 'hihih', t2: 'ihhih'},
            {t1: 'hihii', t2: 'ihhii'}, {t1: 'hiihh', t2: 'ihihh'},
            {t1: 'hiihi', t2: 'ihihi'}, {t1: 'hiiih', t2: 'ihiih'},
            {t1: 'hiiii', t2: 'ihiii'},
        ];
        testGenerate(grammar, expectedResults);
    });

    // Uni with Match tests

    describe('21. (Match t1:.+t2:. + t1:.+t2:.) | t1:hi+t2:ih', function() {
        const grammar = Uni(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")), "t1", "t2"),
                            Seq(t1("hi"), t2("ih")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'hh'}, {t1: 'ii', t2: 'ii'},
            {t1: 'hi', t2: 'hi'}, {t1: 'ih', t2: 'ih'},
            {t1: 'hi', t2: 'ih'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('22. t1:hi+t2:ih | (Match t1:.+t2:. + t1:.+t2:.)', function() {
        let grammar: Grammar = Uni(Seq(t1("hi"), t2("ih")),
                                   Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")),
                                         "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
         //testHasVocab(grammar, {t1: 2, t2: 2});
         const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'}, {t1: 'hh', t2: 'hh'},
            {t1: 'hi', t2: 'hi'}, {t1: 'ih', t2: 'ih'},
            {t1: 'ii', t2: 'ii'}
        ];
        testGenerate(grammar, expectedResults);
});  

    describe('23a. (Match (t1:.+t2:.)*) | t1:hi+t2:ih', function() {
        let grammar: Grammar = Uni(MatchDotStar("t1", "t2"),
                                   Seq(t1("hi"), t2("ih")));
        grammar = Count({t1:3,t2:3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},     {t1: 'i', t2: 'i'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'ih'},   {t1: 'ii', t2: 'ii'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhi', t2: 'hhi'},
            {t1: 'hih', t2: 'hih'}, {t1: 'hii', t2: 'hii'},
            {t1: 'ihh', t2: 'ihh'}, {t1: 'ihi', t2: 'ihi'},
            {t1: 'iih', t2: 'iih'}, {t1: 'iii', t2: 'iii'},
            {t1: 'hi', t2: 'ih'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('23b. (Match t1:.*+t2:.*) | t1:hi+t2:ih', function() {
        let grammar: Grammar = Uni(MatchDotStar2("t1", "t2"),
                                   Seq(t1("hi"), t2("ih")));
        grammar = Count({t1:3,t2:3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},     {t1: 'i', t2: 'i'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'ih'},   {t1: 'ii', t2: 'ii'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhi', t2: 'hhi'},
            {t1: 'hih', t2: 'hih'}, {t1: 'hii', t2: 'hii'},
            {t1: 'ihh', t2: 'ihh'}, {t1: 'ihi', t2: 'ihi'},
            {t1: 'iih', t2: 'iih'}, {t1: 'iii', t2: 'iii'},
            {t1: 'hi', t2: 'ih'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('24a. t1:hi+t2:ih | (Match (t1:.+t2:.)*)', function() {
        let grammar: Grammar = Uni(Seq(t1("hi"), t2("ih")),
                                   MatchDotStar("t1", "t2"));
        grammar = Count({t1:3,t2:3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'},
            {},
            {t1: 'h', t2: 'h'},     {t1: 'i', t2: 'i'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'ih'},   {t1: 'ii', t2: 'ii'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhi', t2: 'hhi'},
            {t1: 'hih', t2: 'hih'}, {t1: 'hii', t2: 'hii'},
            {t1: 'ihh', t2: 'ihh'}, {t1: 'ihi', t2: 'ihi'},
            {t1: 'iih', t2: 'iih'}, {t1: 'iii', t2: 'iii'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('24b. t1:hi+t2:ih | (Match t1:.*+t2:.*)', function() {
        let grammar: Grammar = Uni(Seq(t1("hi"), t2("ih")),
                                   MatchDotStar2("t1", "t2"));
        grammar = Count({t1:3,t2:3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ih'},
            {},
            {t1: 'h', t2: 'h'},     {t1: 'i', t2: 'i'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'ih'},   {t1: 'ii', t2: 'ii'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhi', t2: 'hhi'},
            {t1: 'hih', t2: 'hih'}, {t1: 'hii', t2: 'hii'},
            {t1: 'ihh', t2: 'ihh'}, {t1: 'ihi', t2: 'ihi'},
            {t1: 'iih', t2: 'iih'}, {t1: 'iii', t2: 'iii'},
        ];
        testGenerate(grammar, expectedResults);
    });

    // Filter/Join with Match tests

    describe('25. Filter t1:h+t2:h [Match t1:.+t2:.]', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")), MatchDot("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('26. Filter Match t1:.+t2:. [t1:h+t2:h]', function() {
        const grammar = Filter(MatchDot("t1", "t2"), Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('27. Join t1:h+t2:h ⨝ Match t1:.+t2:.', function() {
        const grammar = Join(Seq(t1("h"), t2("h")), MatchDot("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('28. Join Match t1:.+t2:. ⨝ t1:h+t2:h', function() {
        const grammar = Join(MatchDot("t1", "t2"), Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('29a. Filter t1:h+t2:h [Match (t1:.+t2:.){0,3}]', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")),
                               MatchDotRep(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('29b. Filter t1:h+t2:h [Match t1:.{0,3}+t2:.{0,3}]', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")),
                               MatchDotRep2(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('30a. Filter Match (t1:.+t2:.){0,3} [t1:h+t2:h]', function() {
        const grammar = Filter(MatchDotRep(0, 3, "t1", "t2"),
                               Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('30b. Filter Match t1:.{0,3}+t2:.{0,3} [t1:h+t2:h]', function() {
        const grammar = Filter(MatchDotRep2(0, 3, "t1", "t2"),
                               Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('31a. Join t1:h+t2:h ⨝ Match (t1:.+t2:.){0,3} ', function() {
        const grammar = Join(Seq(t1("h"), t2("h")),
                             MatchDotRep(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('31b. Join t1:h+t2:h ⨝ Match t1:.{0,3}+t2:.{0,3}', function() {
        const grammar = Join(Seq(t1("h"), t2("h")),
                             MatchDotRep2(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('32a. Join Match (t1:.+t2:.){0,3} ⨝ t1:h+t2:h', function() {
        const grammar = Join(MatchDotRep(0, 3, "t1", "t2"),
                             Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('32b. Join Match t1:.{0,3}+t2:.{0,3} ⨝ t1:h+t2:h', function() {
        const grammar = Join(MatchDotRep2(0, 3, "t1", "t2"),
                             Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('33a. Filter t1:h+t2:h [Match (t1:.+t2:.)*]', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")),
                               MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('33b. Filter t1:h+t2:h [Match t1:.*+t2:.*]', function() {
        const grammar = Filter(Seq(t1("h"), t2("h")),
                               MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('34a. Filter Match (t1:.+t2:.)* [t1:h+t2:h]', function() {
        const grammar = Filter(MatchDotStar("t1", "t2"),
                               Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('34b. Filter Match t1:.*+t2:.* [t1:h+t2:h]', function() {
        const grammar = Filter(MatchDotStar2("t1", "t2"),
                               Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('35a. Join t1:h+t2:h ⨝ Match (t1:.+t2:.)*', function() {
        const grammar = Join(Seq(t1("h"), t2("h")),
                             MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('35b. Join t1:h+t2:h ⨝ Match t1:.*+t2:.*', function() {
        const grammar = Join(Seq(t1("h"), t2("h")),
                             MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('36a. Join Match (t1:.+t2:.)* ⨝ t1:h+t2:h', function() {
        const grammar = Join(MatchDotStar("t1", "t2"),
                             Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('36b. Join Match t1:.*+t2:.* ⨝ t1:h+t2:h', function() {
        const grammar = Join(MatchDotStar2("t1", "t2"),
                             Seq(t1("h"), t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 1, t2: 1});
        testGenerate(grammar, [{t1: 'h', t2: 'h'}]);
    });

    describe('37. Filter t1:hi+t2:hi [Match (t1:.+t2:. + t1:.+t2:.)]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")),
                                     "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('38. Filter (Match t1:.+t2:. + t1:.+t2:.) [t1:hi+t2:hi]', function() {
        const grammar = Filter(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")),
                                     "t1", "t2"),
                               Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('39, Join t1:hi+t2:hi ⨝ Match (t1:.+t2:. + t1:.+t2:.)', function() {
        const grammar = Join(Seq(t1("hi"), t2("hi")),
                             Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")),
                                   "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('40. Join Match (t1:.+t2:. + t1:.+t2:.) ⨝ t1:hi+t2:hi', function() {
        const grammar = Join(Match(Seq(Dot("t1", "t2"), Dot("t1", "t2")),
                                   "t1", "t2"),
                             Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('41a. Filter t1:hi+t2:hi [Match (t1:.+t2:.){2}]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               MatchDotRep(2, 2, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('41b. Filter t1:hi+t2:hi [Match t1:.{2}+t2:.{2}]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               MatchDotRep2(2, 2, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('42a. Filter Match (t1:.+t2:.){2} [t1:hi+t2:hi]', function() {
        const grammar = Filter(MatchDotRep(2, 2, "t1", "t2"),
                               Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('42b. Filter Match t1:.{2}+t2:.{2} [t1:hi+t2:hi]', function() {
        const grammar = Filter(MatchDotRep2(2, 2, "t1", "t2"),
                               Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('43a. Join t1:hi+t2:hi ⨝ Match (t1:.+t2:.){2}', function() {
        const grammar = Join(Seq(t1("hi"), t2("hi")),
                             MatchDotRep(2, 2, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('43b. Join t1:hi+t2:hi ⨝ Match t1:.{2}+t2:.{2}', function() {
        const grammar = Join(Seq(t1("hi"), t2("hi")),
                             MatchDotRep2(2, 2, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('44a. Join Match (t1:.+t2:.){2} ⨝ t1:hi+t2:hi', function() {
        const grammar = Join(MatchDotRep(2, 2, "t1", "t2"),
                             Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('44b. Join Match t1:.{2}+t2:.{2} ⨝ t1:hi+t2:hi', function() {
        const grammar = Join(MatchDotRep2(2, 2, "t1", "t2"),
                             Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('45a. Filter t1:hi+t2:hi [Match (t1:.+t2:.){0,3}]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               MatchDotRep(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('45b. Filter t1:hi+t2:hi [Match t1:.{0,3}+t2:.{0,3}]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               MatchDotRep2(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('46a. Filter Match (t1:.+t2:.){0,3} [t1:hi+t2:hi]', function() {
        const grammar = Filter(MatchDotRep(0, 3, "t1", "t2"),
                               Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('46b. Filter Match t1:.{0,3}+t2:.{0,3} [t1:hi+t2:hi]', function() {
        const grammar = Filter(MatchDotRep2(0, 3, "t1", "t2"),
                               Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('47a. Join t1:hi+t2:hi ⨝ Match (t1:.+t2:.){0,3}', function() {
        const grammar = Join(Seq(t1("hi"), t2("hi")),
                             MatchDotRep(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('47b. Join t1:hi+t2:hi ⨝ Match t1:.{0,3}+t2:.{0,3}', function() {
        const grammar = Join(Seq(t1("hi"), t2("hi")),
                             MatchDotRep2(0, 3, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('48a. Join Match (t1:.+t2:.){0,3} ⨝ t1:hi+t2:hi', function() {
        const grammar = Join(MatchDotRep(0, 3, "t1", "t2"),
                             Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('48b. Join Match t1:.{0,3}+t2:.{0,3} ⨝ t1:hi+t2:hi', function() {
        const grammar = Join(MatchDotRep2(0, 3, "t1", "t2"),
                             Seq(t1("hi"), t2("hi")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGenerate(grammar, [{t1: 'hi', t2: 'hi'}]);
    });

    describe('49a. Filter t1:hello+t2:hello [Match (t1:.+t2:.){3,7}]', function() {
        const grammar = Filter(Seq(t1("hello"), t2("hello")),
                               MatchDotRep(3, 7, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('49b. Filter t1:hello+t2:hello [Match t1:.{3,7}+t2:.{3,7}]', function() {
        const grammar = Filter(Seq(t1("hello"), t2("hello")),
                               MatchDotRep2(3, 7, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('50a. Filter Match (t1:.+t2:.){3,7} [t1:hello+t2:hello]', function() {
        const grammar = Filter(MatchDotRep(3, 7, "t1", "t2"),
                               Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('50b. Filter Match t1:.{3,7}+t2:.{3,7} [t1:hello+t2:hello]', function() {
        const grammar = Filter(MatchDotRep2(3, 7, "t1", "t2"),
                               Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('51a. Join t1:hello+t2:hello ⨝ Match (t1:.+t2:.){3,7}', function() {
        const grammar = Join(Seq(t1("hello"), t2("hello")),
                             MatchDotRep(3, 7, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('51b. Join t1:hello+t2:hello ⨝ Match t1:.{3,7}+t2:.{3,7}', function() {
        const grammar = Join(Seq(t1("hello"), t2("hello")),
                             MatchDotRep2(3, 7, "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('52a. Join Match (t1:.+t2:.){3,7} ⨝ t1:hello+t2:hello', function() {
        const grammar = Join(MatchDotRep(3, 7, "t1", "t2"),
                             Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('52b. Join Match t1:.{3,7}+t2:.{3,7} ⨝ t1:hello+t2:hello', function() {
        const grammar = Join(MatchDotRep2(3, 7, "t1", "t2"),
                             Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('53a. Filter t1:hello+t2:hello [Match (t1:.+t2:.)*]', function() {
        const grammar = Filter(Seq(t1("hello"), t2("hello")),
                               MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('53b. Filter t1:hello+t2:hello [Match t1:.*+t2:.*]', function() {
        const grammar = Filter(Seq(t1("hello"), t2("hello")),
                               MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('54a. Filter Match (t1:.+t2:.)* [t1:hello+t2:hello]', function() {
        const grammar = Filter(MatchDotStar("t1", "t2"),
                               Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('54b. Filter Match t1:.*+t2:.* [t1:hello+t2:hello]', function() {
        const grammar = Filter(MatchDotStar2("t1", "t2"),
                               Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('55a. Join t1:hello+t2:hello ⨝ Match (t1:.+t2:.)*', function() {
        const grammar = Join(Seq(t1("hello"), t2("hello")),
                             MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('55b. Join t1:hello+t2:hello ⨝ Match t1:.*+t2:.*', function() {
        const grammar = Join(Seq(t1("hello"), t2("hello")),
                             MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('56a. Join Match (t1:.+t2:.)* ⨝ t1:hello+t2:hello', function() {
        const grammar = Join(MatchDotStar("t1", "t2"),
                             Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('56b. Join Match t1:.*+t2:.* ⨝ t1:hello+t2:hello', function() {
        const grammar = Join(MatchDotStar2("t1", "t2"),
                             Seq(t1("hello"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 4});
        testGenerate(grammar, [{t1: 'hello', t2: 'hello'}]);
    });

    describe('57a. Filter t1:he+t2:hello [Match (t1:.+t2:.)*]', function() {
        const grammar = Filter(Seq(t1("he"), t2("hello")),
                               MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('57b. Filter t1:he+t2:hello [Match t1:.*+t2:.*]', function() {
        const grammar = Filter(Seq(t1("he"), t2("hello")),
                               MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('58a. Filter Match (t1:.+t2:.)* [t1:he+t2:hello]', function() {
        const grammar = Filter(MatchDotStar("t1", "t2"),
                               Seq(t1("he"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('58b. Filter Match t1:.*+t2:.* [t1:he+t2:hello]', function() {
        const grammar = Filter(MatchDotStar2("t1", "t2"),
                               Seq(t1("he"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('59a. Join t1:he+t2:hello ⨝ Match (t1:.+t2:.)*', function() {
        const grammar = Join(Seq(t1("he"), t2("hello")),
                             MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('59b. Join t1:he+t2:hello ⨝ Match t1:.*+t2:.*', function() {
        const grammar = Join(Seq(t1("he"), t2("hello")),
                             MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('60a. Join Match (t1:.+t2:.)* ⨝ t1:he+t2:hello', function() {
        const grammar = Join(MatchDotStar("t1", "t2"),
                             Seq(t1("he"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('60b. Join Match t1:.*+t2:.* ⨝ t1:he+t2:hello', function() {
        const grammar = Join(MatchDotStar2("t1", "t2"),
                             Seq(t1("he"), t2("hello")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 2, t2: 4});
        testGenerate(grammar, []);
    });

    describe('61a. Filter t1:hello+t2:hell [Match (t1:.+t2:.)*]', function() {
        const grammar = Filter(Seq(t1("hello"), t2("hell")),
                               MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('61b. Filter t1:hello+t2:hell [Match t1:.*+t2:.*]', function() {
        const grammar = Filter(Seq(t1("hello"), t2("hell")),
                               MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('62a. Filter Match (t1:.+t2:.)* [t1:hello+t2:hell]', function() {
        const grammar = Filter(MatchDotStar("t1", "t2"),
                               Seq(t1("hello"), t2("hell")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('62b. Filter Match t1:.*+t2:.* [t1:hello+t2:hell]', function() {
        const grammar = Filter(MatchDotStar2("t1", "t2"),
                               Seq(t1("hello"), t2("hell")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('63a. Join t1:hello+t2:hell ⨝ Match (t1:.+t2:.)*', function() {
        const grammar = Join(Seq(t1("hello"), t2("hell")),
                             MatchDotStar("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('63b. Join t1:hello+t2:hell ⨝ Match t1:.*+t2:.*', function() {
        const grammar = Join(Seq(t1("hello"), t2("hell")),
                             MatchDotStar2("t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('64a. Join Match (t1:.+t2:.)* ⨝ t1:hello+t2:hell', function() {
        const grammar = Join(MatchDotStar("t1", "t2"),
                             Seq(t1("hello"), t2("hell")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

    describe('64b. Join Match t1:.*+t2:.* ⨝ t1:hello+t2:hell', function() {
        const grammar = Join(MatchDotStar2("t1", "t2"),
                             Seq(t1("hello"), t2("hell")));
        testHasTapes(grammar, ['t1', 't2']);
        //testHasVocab(grammar, {t1: 4, t2: 3});
        testGenerate(grammar, []);
    });

});
