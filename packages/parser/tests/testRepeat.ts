import { 
    Count, Grammar,
    Seq, Join, Rep, Epsilon, Filter, Uni, Any, Intersect,
    MatchFrom, Cursor, Vocab,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2, verbose,
    t1, t2,
    testHasTapes, testGrammar, testHasVocab,
    WARN_ONLY_FOR_TOO_MANY_OUTPUTS
} from './testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_STATES
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

function log(...msgs: string[]) {
    verbose(VERBOSE, ...msgs);
}

const DEFAULT = undefined

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Repeat 0-1 Os: t1:o{0,1}', function() {
        const grammar = Rep(t1("o"), 0, 1);
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'o'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2. Repeat 1-4 Os: t1:o{1,4}', function() {
        const grammar = Rep(t1("o"), 1, 4);
        const expectedResults: StringDict[] = [
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3. Repeat 1-4 empty strings: t1:{1,4}', function() {
        const grammar = Rep(t1(""), 1, 4);
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4. t1:o{1,4} + t2:foo', function() {
        const grammar = Seq(Rep(t1("o"), 1, 4), t2("foo"));
        const expectedResults: StringDict[] = [
            {t1: 'o', t2: 'foo'},
            {t1: 'oo', t2: 'foo'},
            {t1: 'ooo', t2: 'foo'},
            {t1: 'oooo', t2: 'foo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5. t2:foo + t1:o{1,4}', function() {
        const grammar = Seq(t2("foo"), Rep(t1("o"), 1, 4));
        //testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'o', t2: 'foo'},
            {t1: 'oo', t2: 'foo'},
            {t1: 'ooo', t2: 'foo'},
            {t1: 'oooo', t2: 'foo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('6. Hello with 1-4 Os: t1:hell+t1:o{1,4}', function() {
        const grammar = Seq(t1("hell"), Rep(t1("o"), 1, 4));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'helloo'},
            {t1: 'hellooo'},
            {t1: 'helloooo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('7. Hello with 0-1 Os: t1:hell+t1:o{0,1}', function() {
        const grammar = Seq(t1("hell"), Rep(t1("o"), 0, 1));
        const expectedResults: StringDict[] = [
            {t1: 'hell'},
            {t1: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('8. Hello with 1-4 Hs: t1:h{1,4}+t1:ello', function() {
        const grammar = Seq(Rep(t1("h"), 1, 4), t1("ello"));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'hhello'},
            {t1: 'hhhello'},
            {t1: 'hhhhello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('9. Hello with 0-1 Hs: t1:h{0,1}+t1:ello', function() {
        const grammar = Seq(Rep(t1("h"), 0, 1), t1("ello"));
        const expectedResults: StringDict[] = [
            {t1: 'ello'},
            {t1: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('10. Join t1:hhello ⨝ t1:h{1,4}+t1:ello', function() {
        const grammar = Join(t1("hhello"), Seq(Rep(t1("h"), 1, 4), t1("ello")));
        const expectedResults: StringDict[] = [
            {t1: 'hhello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('11. Join t1:h{1,4}+t1:ello ⨝ hhello', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello")), t1("hhello"));
        const expectedResults: StringDict[] = [
            {t1: 'hhello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('12. Join t1:h{1,4}+t1:ello ⨝ the same', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello")),
                             Seq(Rep(t1("h"), 1, 4), t1("ello")));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'hhello'},
            {t1: 'hhhello'},
            {t1: 'hhhhello'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('13. Join t1:h{1,4} + t2:world ⨝ the same', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t2("world")),
                             Seq(Rep(t1("h"), 1, 4), t2("world")));
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'world'},
            {t1: 'hh', t2: 'world'},
            {t1: 'hhh', t2: 'world'},
            {t1: 'hhhh', t2: 'world'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('14. Join t1:h{1,4}+t1:ello + t2:world ⨝ the same', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")),
                             Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")));
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'world'},
            {t1: 'hhello', t2: 'world'},
            {t1: 'hhhello', t2: 'world'},
            {t1: 'hhhhello', t2: 'world'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('15. Join t1:h{1,4} + t2:world + t1:ello ⨝ the same', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")),
                             Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")));
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'world'},
            {t1: 'hhello', t2: 'world'},
            {t1: 'hhhello', t2: 'world'},
            {t1: 'hhhhello', t2: 'world'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('16. Filter t1:na{0,2} [ε]', function() {
        const grammar = Filter(Rep(t1("na"), 0, 2), Epsilon());
        const expectedResults: StringDict[] = [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('17. Filter ε [t1:na{0,2}]', function() {
        const grammar = Filter(Epsilon(), Rep(t1("na"), 0, 2));
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('18. Join t1:na{0,2} ⨝ ε', function() {
        const grammar = Join(Rep(t1("na"), 0, 2), Epsilon());
        const expectedResults: StringDict[] = [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('19. Join ε ⨝ t1:na{0,2}', function() {
        const grammar = Join(Epsilon(), Rep(t1("na"), 0, 2));
        const expectedResults: StringDict[] = [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('20. t1:na{1,4}', function() {
        const grammar = Rep(t1("na"), 1, 4);
        const expectedResults: StringDict[] = [
            {t1: 'na'},
            {t1: 'nana'},
            {t1: 'nanana'},
            {t1: 'nananana'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('21. t1:na{0,2}', function() {
        const grammar = Rep(t1("na"), 0, 2);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('22. t1:na{0}', function() {
        const grammar = Rep(t1("na"), 0, 0);
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('23. Repeat with min > max: t1:na{4,3}', function() {
        const grammar = Rep(t1("na"), 4, 3);
        const expectedResults: StringDict[] = [
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('24. Repeat with negative min: t1:na{-3,2}', function() {
        const grammar = Rep(t1("na"), -3, 2);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'na'},
            {t1: 'nana'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('25. Repeat with 1-unlimited Os: t1:o+', function() {
        let grammar: Grammar = Rep(t1("o"), 1);
        grammar = Count({t1:5}, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
            {t1: 'ooooo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('26. Repeat with unlimited Os: t1:o*', function() {
        let grammar: Grammar = Rep(t1("o"));
        grammar = Count({t1:5}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'o'},
            {t1: 'oo'},
            {t1: 'ooo'},
            {t1: 'oooo'},
            {t1: 'ooooo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('27. t1:h* + t1:i', function() {
        let grammar: Grammar = Seq(Rep(t1("h")), t1("i"));
        grammar = Count({t1:6}, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'i'},
            {t1: 'hi'},
            {t1: 'hhi'},
            {t1: 'hhhi'},
            {t1: 'hhhhi'},
            {t1: 'hhhhhi'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('28. t1:h + t1:i*', function() {
        let grammar: Grammar = Seq(t1("h"), Rep(t1("i")));
        grammar = Count({t1:6}, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'h'},
            {t1: 'hi'},
            {t1: 'hii'},
            {t1: 'hiii'},
            {t1: 'hiiii'},
            {t1: 'hiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('29. (t1:h + t1:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t1("i")));
        grammar = Count({t1:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'hi'},
            {t1: 'hihi'},
            {t1: 'hihihi'},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('30. (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = Count({t1:3,t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('31a. (t1:h | t2:i)*', function() {
        let grammar: Grammar = Rep(Uni(t1("h"), t2("i")));
        grammar = Count({t1:1,t2:1}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
            {t1: 'h', t2:'i'},
            {t2: 'i'},
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('31b. (t1:h | t2:i)* (count 2)', function() {
        let grammar: Grammar = Rep(Uni(t1("h"), t2("i")));
        grammar = Count({t1:2,t2:2}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},           {t1: 'hh'},           
            {t1: 'h', t2:'i'},   {t1: 'h', t2:'ii'},   
            {t1: 'hh', t2:'i'},  {t1: 'hh', t2:'ii'},  
            {t2: 'i'},           {t2: 'ii'},         
        ];
        testGrammar(grammar, expectedResults,
                    VERBOSE_DEBUG, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });
    
    describe('31c. (t1:h | t2:i)* (count 3)', function() {
        let grammar: Grammar = Rep(Uni(t1("h"), t2("i")));
        grammar = Count({t1:3,t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},           {t1: 'hh'},           {t1: 'hhh'},
            {t1: 'h', t2:'i'},   {t1: 'h', t2:'ii'},   {t1: 'h', t2:'iii'},
            {t1: 'hh', t2:'i'},  {t1: 'hh', t2:'ii'},  {t1: 'hh', t2:'iii'},
            {t1: 'hhh', t2:'i'}, {t1: 'hhh', t2:'ii'}, {t1: 'hhh', t2:'iii'},
            {t2: 'i'},           {t2: 'ii'},           {t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults,
                    SILENT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('32. (t1:a+t2:a | t1:b+t2:b)*', function() {
        let grammar: Grammar = Rep(Uni(Seq(t1("a"), t2("a")), 
                                       Seq(t1("b"), t2("b"))));
        grammar = Count({t1:2,t2:2}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'a', t2: 'a'},
            {t1: 'b', t2: 'b'},
            {t1: 'aa', t2: 'aa'},
            {t1: 'ab', t2: 'ab'},
            {t1: 'ba', t2: 'ba'},
            {t1: 'bb', t2: 'bb'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33. Filter t1:h [t2:h*]', function() {
        const grammar = Filter(t1("h"), Rep(t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        const expectedResults: StringDict[] = [
            {t1: 'h'}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('34. Filter t1:h [(t1:h|t2:h)*]', function() {
        const grammar = Filter(t1("h"),
                               Rep(Uni(t1("h"), t2("h"))));
        testHasTapes(grammar, ['t1', 't2']);
        const expectedResults: StringDict[] = [
            {t1: 'h'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('35. t1:h + ε*', function() {
        const grammar = Seq(t1("h"), Rep(Epsilon()));
        testHasTapes(grammar, ['t1']);
        const expectedResults: StringDict[] = [
            {t1: 'h'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('36. (t1:h + t2:""){0,4}', function() {
        const grammar = Rep(Seq(t1("h"), t2("")), 0, 4);
        testHasTapes(grammar, ['t1', 't2']);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('37. (t2:"" + t1:h){0,4}', function() {
        const grammar = Rep(Seq(t2(""), t1("h")), 0, 4);
        testHasTapes(grammar, ['t1', 't2']);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
            {t1: 'hhhh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('38. Nested repetition: (t1:ba{1,2}){2,3}', function() {
        const grammar = Rep(Rep(t1("ba"), 1, 2), 2, 3);
        const expectedResults: StringDict[] = [
            {t1: 'baba'},
            {t1: 'bababa'},
            {t1: 'babababa'},
            {t1: 'bababababa'},
            {t1: 'babababababa'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_DEBUG);
    });

    describe('39. (t1:h+t2:h){2}', function() {
        const grammar = Rep(Seq(t1("h"), t2("h")), 2, 2);
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'hh'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('40. Filter (t1:h+t2:h){2} [t1:hh+t2:hh]', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h")), 2, 2),
                               Seq(t1("hh"), t2("hh")));
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'hh'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('41. Filter t1:hh+t2:hh [(t1:h+t2:h){2}]', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")),
                               Rep(Seq(t1("h"), t2("h")), 2, 2));
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'hh'}
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('42. Filter (t1:h+t2:h)* [t1:hh+t2:hh] ', function() {
        const grammar = Filter(Rep(Seq(t1("h"), t2("h"))),
                               Seq(t1("hh"), t2("hh")));
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'hh'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('43. Filter t1:hh+t2:hh [(t1:h+t2:h)*]', function() {
        const grammar = Filter(Seq(t1("hh"), t2("hh")),
                               Rep(Seq(t1("h"), t2("h"))));
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'hh'}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('44. Rep(Any): t1:hi + t1:.{0,3}', function() {
        const grammar = Seq(t1("hi"), Rep(Any("t1"), 0, 3));
        const expectedResults: StringDict[] = [
            {t1: 'hi'},
            {t1: 'hii'},   {t1: 'hih'},
            {t1: 'hihh'},  {t1: 'hihi'},
            {t1: 'hiih'},  {t1: 'hiii'},
            {t1: 'hihhh'}, {t1: 'hihhi'},
            {t1: 'hihih'}, {t1: 'hihii'},
            {t1: 'hiihh'}, {t1: 'hiihi'},
            {t1: 'hiiih'}, {t1: 'hiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('45. Rep(Any): t1:.{0,3} + t1:hi', function() {
        const grammar = Seq(Rep(Any("t1"), 0, 3), t1("hi"));
        const expectedResults: StringDict[] = [
            {t1: 'hi'},
            {t1: 'hhi'},   {t1: 'ihi'},
            {t1: 'hhhi'},  {t1: 'hihi'},
            {t1: 'ihhi'},  {t1: 'iihi'},
            {t1: 'hhhhi'}, {t1: 'hhihi'},
            {t1: 'hihhi'}, {t1: 'hiihi'},
            {t1: 'ihhhi'}, {t1: 'ihihi'},
            {t1: 'iihhi'}, {t1: 'iiihi'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('46. Rep(Any): t1:.{0,1} + t1:hi + t1:.{0,1}', function() {
        const grammar = Seq(Rep(Any("t1"), 0, 1),
                            t1("hi"),
                            Rep(Any("t1"), 0, 1));
        const expectedResults: StringDict[] = [
            {t1: 'hi'},
            {t1: 'hih'},  {t1: 'hii'},
            {t1: 'hhi'},  {t1: 'ihi'},
            {t1: 'hhih'}, {t1: 'hhii'},
            {t1: 'ihih'}, {t1: 'ihii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('47. Join t1:hi ⨝ t1:.{0,1}', function() {
        const grammar = Join(t1("h"), Rep(Any("t1"), 0, 1));
        const expectedResults: StringDict[] = [
            {t1: 'h'}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('48. Filter t1:.{0,2} [ε]', function() {
        const grammar = Filter(Rep(Any("t1"), 0, 2), Epsilon());
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('49. Filter ε [t1:.{0,2}]', function() {
        const grammar = Filter(Epsilon(), Rep(Any("t1"), 0, 2));
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('50. Join t1:.{0,2} ⨝ ε', function() {
        const grammar = Join(Rep(Any("t1"), 0, 2), Epsilon());
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('51. Join ε ⨝ t1:.{0,2}', function() {
        const grammar = Join(Epsilon(), Rep(Any("t1"), 0, 2));
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('52. Filter t1:hello [t1:he+t1:.*]', function() {
        const grammar = Filter(t1("hello"), Seq(t1("he"), Rep(Any("t1"))));
        const expectedResults: StringDict[] = [
            {t1: 'hello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('53. Filter t1:hello [t1:.*+t1:lo]', function() {
        const grammar = Filter(t1("hello"), Seq(Rep(Any("t1")), t1("lo")));
        const expectedResults: StringDict[] = [
            {t1: 'hello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('54. Filter t1:hello [t1:.*+t1:e+t1:.*]', function() {
        const grammar = Filter(t1("hello"),
                               Seq(Rep(Any("t1")), t1("e"), Rep(Any("t1"))));
        const expectedResults: StringDict[] = [
            {t1: 'hello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('55. Filter t1:hello [t1:.*+t1:l+t1:.*]', function() {
        const grammar = Filter(t1("hello"),
                               Seq(Rep(Any("t1")), t1("l"), Rep(Any("t1"))));
        const expectedResults: StringDict[] = [
            {t1: 'hello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('56. Filter t1:hello with [t1:.*+t1:h+t1:.*]', function() {
        const grammar = Filter(t1("hello"),
                               Seq(Rep(Any("t1")), t1("h"), Rep(Any("t1"))));
        const expectedResults: StringDict[] = [
            {t1: 'hello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('57. Filter t1:hello with [t1:.*+t1:o+t1:.*]', function() {
        const grammar = Filter(t1("hello"),
                               Seq(Rep(Any("t1")), t1("h"), Rep(Any("t1"))));
        const expectedResults: StringDict[] = [
            {t1: 'hello'}
        ];
        testGrammar(grammar, expectedResults);
    });

    // More joining of repeats

    describe('58a. Join t1:a + t2:bbb ⨝ (t1:"" + t2:b){3} + t1:a', function() {
        const grammar = Join(Seq(t1("a"), t2("bbb")), 
                             Seq(Rep(Seq(t1(""), t2("b")), 3, 3), t1("a")));
        testHasTapes(grammar, ["t1", "t2"]);
        const expectedResults: StringDict[] = [
            {t1: 'a', t2: 'bbb'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('58b. Join t1:a + t2:bbb ⨝ (t1:"" + t2:b){0,4} + t1:a', function() {
        const grammar = Join(Seq(t1("a"), t2("bbb")), 
                             Seq(Rep(Seq(t1(""), t2("b")), 0, 4), t1("a")));
        testHasTapes(grammar, ["t1", "t2"]);
        const expectedResults: StringDict[] = [
            {t1: 'a', t2: 'bbb'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('58c. Join (t1:"" + t2:b){3} + t1:a ⨝ t1:a + t2:bbb', function() {
        const grammar = Join(Seq(Rep(Seq(t1(""), t2("b")), 3, 3), t1("a")),
                             Seq(t1("a"), t2("bbb")));
        testHasTapes(grammar, ["t1", "t2"]);
        const expectedResults: StringDict[] = [
            {t1: 'a', t2: 'bbb'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('58d. Join (t1:"" + t2:b){0,4} + t1:a ⨝ t1:a + t2:bbb', function() {
        const grammar = Join(Seq(Rep(Seq(t1(""), t2("b")), 0, 4), t1("a")),
                             Seq(t1("a"), t2("bbb")));
        testHasTapes(grammar, ["t1", "t2"]);
        const expectedResults: StringDict[] = [
            {t1: 'a', t2: 'bbb'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

    // Repeats of Nullable Matches

    describe('59. (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t2:ee ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(grammar, t2("ee"));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t1:h + t2:eeh ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t1:h + t2:ehe ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59b-1. Join t2:ee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(t2("ee"), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59b-2. Join t1:h + t2:eeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59b-3. Join t1:h + t2:ehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} [t2:ee] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const filterGrammar: Grammar = Filter(grammar, t2("ee"));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} [t1:h + t2:eeh] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("h"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} [t1:h + t2:ehe] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("h"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} & t2:ee ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const interGrammar: Grammar = Intersect(grammar, t2("ee"));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} & t1:h + t2:eeh ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} & t1:h + t2:ehe ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59e-1. Intersect t2:ee & (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const interGrammar: Grammar = Intersect(t2("ee"), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59e-2. Intersect t1:h + t2:eeh & (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const interGrammar: Grammar = Intersect(Seq(t1("h"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59e-3. Intersect t1:h + t2:ehe & (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const interGrammar: Grammar = Intersect(Seq(t1("h"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60. (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        let grammarWithVocab: Grammar = Seq(grammar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Cursor(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
            {t1: 'hx', t2: 'ehe'},
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults, VERBOSE_DEBUG);
    });

    describe('60a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:x + t2:ee ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("x"), t2("ee")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('60a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:hx + t2:eeh ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("hx"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:hx + t2:ehe ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("hx"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60b-1. Join t1:x + t2:ee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const joinGrammar: Grammar = Join(Seq(t1("x"), t2("ee")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60b-2. Join t1:hx + t2:eeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const joinGrammar: Grammar = Join(Seq(t1("hx"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60b-3. Join t1:hx + t2:ehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const joinGrammar: Grammar = Join(Seq(t1("hx"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x [t1:x + t2:ee] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("x"), t2("ee")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x [t1:hx + t2:eeh] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("hx"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x [t1:hx + t2:ehe] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("hx"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x & t1:x + t2:ee ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("x"), t2("ee")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('60d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x & t1:hx + t2:eeh ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("hx"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x & t1:hx + t2:ehe ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("hx"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60e-1. Intersect t1:x + t2:ee & (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const interGrammar: Grammar = Intersect(Seq(t1("x"), t2("ee")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60e-2. Intersect t1:hx + t2:eeh & (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const interGrammar: Grammar = Intersect(Seq(t1("hx"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60e-3. Intersect t1:hx + t2:ehe & (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t1("x"));
        const interGrammar: Grammar = Intersect(Seq(t1("hx"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61. (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        let grammarWithVocab: Grammar = Seq(grammar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 4, t2: 4}, grammarWithVocab);
        grammarWithVocab = Cursor(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
            {t1: 'h', t2: 'ehex'},
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t2:eex ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const joinGrammar: Grammar = Join(grammar, t2("eex"))
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t1:h + t2:eehx ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("eehx")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t1:h + t2:ehex ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("ehex")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61b-1. Join t2:eex ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const joinGrammar: Grammar = Join(t2("eex"), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61b-2. Join t1:h + t2:eehx ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("eehx")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61b-3. Join t1:h + t2:ehex ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
            '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("ehex")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x [t2:eex] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const filterGrammar: Grammar = Filter(grammar, t2("eex"));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x [t1:h + t2:eehx] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("h"), t2("eehx")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x [t1:h + t2:ehex] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const filterGrammar: Grammar = Filter(grammar, Seq(t1("h"), t2("ehex")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x & t2:eex ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const interGrammar: Grammar = Intersect(grammar, t2("eex"));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x & t1:h + t2:eehx ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("eehx")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x & t1:h + t2:ehex ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const interGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("ehex")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61e-1. Intersect t2:eex & (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const interGrammar: Grammar = Intersect(t2("eex"), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61e-2. Intersect t1:h + t2:eehx & (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const interGrammar: Grammar = Intersect(Seq(t1("h"), t2("eehx")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61e-3. Intersect t1:h + t2:ehex & (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2),
                                     t2("x"));
        const interGrammar: Grammar = Intersect(Seq(t1("h"), t2("ehex")), grammar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62. (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        let grammarWithVocab: Grammar = Seq(grammar2, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Cursor(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'}, {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'}, {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'}, {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('62a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t2:eeee ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, t2("eeee"));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t1:hh + t2:eeheeh ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Seq(t1("hh"), t2("eeheeh")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t1:hh + t2:eheehe ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Seq(t1("hh"), t2("eheehe")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-4. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t2:ee)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-5. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t1:h+t2:eeh)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-6. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t1:h+t2:ehe)* ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar, 
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-1. Join t2:eeee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(t2("eeee"), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-2. Join t1:hh + t2:eeheeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Seq(t1("hh"), t2("eeheeh")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-3. Join t1:hh + t2:eheehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Seq(t1("hh"), t2("eheehe")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-4. Join (t2:ee)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' + 
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-5. Join (t1:h+t2:eeh)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh"))), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-6. Join (t1:h+t2:ehe)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe"))), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [t2:eeee] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Filter(grammar2, t2("eeee"));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [t1:hh + t2:eeheeh] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Seq(t1("hh"), t2("eeheeh")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [t1:hh + t2:eheehe] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Seq(t1("hh"), t2("eheehe")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-4. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [(t2:ee)*] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Filter(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-5. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [(t1:h+t2:eeh)*] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-6. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [(t1:h+t2:ehe)*] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & t2:eeee ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(grammar2, t2("eeee"));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & t1:hh + t2:eeheeh ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Seq(t1("hh"), t2("eeheeh")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & t1:hh + t2:eheehe ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Seq(t1("hh"), t2("eheehe")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-4. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & (t2:ee)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-5. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & (t1:h+t2:eeh)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-6. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & (t1:h+t2:ehe)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-1. Intersect t2:eeee & (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(t2("eeee"), grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-2. Intersect t1:hh + t2:eeheeh & (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(Seq(t1("hh"), t2("eeheeh")),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-3. Intersect t1:hh + t2:eheehe & (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(Seq(t1("hh"), t2("eheehe")),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-4. Intersect (t2:ee)* & (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-5. Intersect (t1:h+t2:eeh)* & (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh"))),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-6. Intersect (t1:h+t2:ehe)* & (t2:e+M(t1>t2,ε|t1:h)){2} + same ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe"))),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63. ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar2, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Cursor(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'}, {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'}, {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'}, {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('63a-1. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t2:ee)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63a-2. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t1:h+t2:eeh)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63a-3. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t1:h+t2:ehe)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63b-1. Join (t2:ee)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63b-2. Join (t1:h+t2:eeh)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh"))),
                                          grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar, 
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63b-3. Join (t1:h+t2:ehe)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe"))),
                                          grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63c-1. Filter ((t2:e+M(t1>t2,ε|t1:h)){2}){2} [(t2:ee)*] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Filter(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63c-2. Filter ((t2:e+M(t1>t2,ε|t1:h)){2}){2} [(t1:h+t2:eeh)*] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63c-3. Filter ((t2:e+M(t1>t2,ε|t1:h)){2}){2} [(t1:h+t2:ehe)*] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63d-1. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2}){2} & (t2:ee)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63d-2. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2}){2} & (t1:h+t2:eeh)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63d-3. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2}){2} & (t1:h+t2:ehe)* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63e-1. Intersect (t2:ee)* & ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63e-2. Intersect (t1:h+t2:eeh)* & ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
            '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh"))),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63e-3. Intersect (t1:h+t2:ehe)* & ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe"))),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64. ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        let grammarWithVocab: Grammar = Seq(grammarStar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Cursor(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t2: 'ee'},
            {t2: 'eeee'},
            {t2: 'eeeeee'},
            {t1: 'h', t2: 'eeh'},     {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eheh'},   {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'}, {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'}, {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('64a-1. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t2:ee){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(grammarStar, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64a-2. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:eeh){2} ' +
            '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(grammarStar,
                                          Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64a-3. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:ehe){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(grammarStar,
                                          Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64b-1. Join (t2:ee){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(Rep(t2("ee"), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64b-2. Join (t1:h+t2:eeh){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh")), 2, 2),
                                          grammarStar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64b-3. Join (t1:h+t2:ehe){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe")), 2, 2),
                                          grammarStar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64c-1. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t2:ee){2}] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const filterGrammar: Grammar = Filter(grammarStar, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64c-2. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t1:h+t2:eeh){2}] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const filterGrammar: Grammar = Filter(grammarStar,
                                              Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64c-3. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t1:h+t2:ehe){2}] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const filterGrammar: Grammar = Filter(grammarStar,
                                              Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64d-1. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t2:ee){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const interGrammar: Grammar = Intersect(grammarStar, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64d-2. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t1:h+t2:eeh){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const interGrammar: Grammar = Intersect(grammarStar,
                                                Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64d-3. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t1:h+t2:ehe){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const interGrammar: Grammar = Intersect(grammarStar,
                                                Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64e-1. Intersect (t2:ee){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const interGrammar: Grammar = Intersect(Rep(t2("ee"), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64e-2. Intersect (t1:h+t2:eeh){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh")), 2, 2),
                                                grammarStar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64e-3. Intersect (t1:h+t2:ehe){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe")), 2, 2),
                                                grammarStar);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('65. ((t2:e+M(t1>t2,ε|t1:h))*){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar2, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Cursor(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t2: 'e'},     {t2: 'ee'},    {t2: 'eee'},
            {t2: 'eeee'},  {t2: 'eeeee'}, {t2: 'eeeeee'},
            {t1: 'h', t2: 'eh'},      {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehe'},     {t1: 'h', t2: 'eeeh'},
            {t1: 'h', t2: 'eehe'},    {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},   {t1: 'h', t2: 'eheee'},
            {t1: 'h', t2: 'eeeeeh'},  {t1: 'h', t2: 'eeeehe'},
            {t1: 'h', t2: 'eeehee'},  {t1: 'h', t2: 'eeheee'},
            {t1: 'h', t2: 'eheeee'},  {t1: 'hh', t2: 'eheh'},
            {t1: 'hh', t2: 'eeheh'},  {t1: 'hh', t2: 'eheeh'},
            {t1: 'hh', t2: 'ehehe'},  {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'}, {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'}, {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65a-1. Join ((t2:e+M(t1>t2,ε|t1:h))*){2} ⨝ (t2:ee){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65a-2. Join ((t2:e+M(t1>t2,ε|t1:h))*){2} ⨝ (t1:h+t2:eeh){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2,
                                          Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65a-3. Join ((t2:e+M(t1>t2,ε|t1:h))*){2} ⨝ (t1:h+t2:ehe){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2,
                                          Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65b-1. Join (t2:ee){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(t2("ee"), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65b-2. Join (t1:h+t2:eeh){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh")), 2, 2),
                                          grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65b-3. Join (t1:h+t2:ehe){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe")), 2, 2),
                                          grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65c-1. Filter ((t2:e+M(t1>t2,ε|t1:h))*){2} [(t2:ee){2}] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Filter(grammar2, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65c-2. Filter ((t2:e+M(t1>t2,ε|t1:h))*){2} [(t1:h+t2:eeh){2}] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65c-3. Filter ((t2:e+M(t1>t2,ε|t1:h))*){2} [(t1:h+t2:ehe){2}] ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Filter(grammar2,
                                              Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65d-1. Intersect ((t2:e+M(t1>t2,ε|t1:h))*){2} & (t2:ee){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(grammar2, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65d-2. Intersect ((t2:e+M(t1>t2,ε|t1:h))*){2} & (t1:h+t2:eeh){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65d-3. Intersect ((t2:e+M(t1>t2,ε|t1:h))*){2} & (t1:h+t2:ehe){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(grammar2,
                                                Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65e-1. Intersect (t2:ee){2} & ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(Rep(t2("ee"), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65e-2. Intersect (t1:h+t2:eeh){2} & ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh")), 2, 2),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65e-3. Intersect (t1:h+t2:ehe){2} & ((t2:e+M(t1>t2,ε|t1:h))*){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const interGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe")), 2, 2),
                                                grammar2);
        let grammarWithVocab: Grammar = Seq(interGrammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    // Testing Sequences of Repeats of Nullable Matches

    describe('66a. (t2:e+M(t1>t2,ε|t1:h)){4} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 4, 4);
        let grammarWithVocab: Grammar = Seq(grammar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1:10,t2:10}, grammarWithVocab);
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},     {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},     {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'},   {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},   {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},   {t1: 'hh', t2: 'ehehee'},
            {t1: 'hhh', t2: 'eeheheh'}, {t1: 'hhh', t2: 'eheeheh'},
            {t1: 'hhh', t2: 'eheheeh'}, {t1: 'hhh', t2: 'ehehehe'},
            {t1: 'hhhh', t2: 'eheheheh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('66b. (t2:e+M(t1>t2,ε|t1:h)){2} + (t2:e+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const repGrammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar: Grammar = Seq(repGrammar, repGrammar);
        let grammarWithVocab: Grammar = Seq(grammar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1:10,t2:10}, grammarWithVocab);
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},     {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},     {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'},   {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},   {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},   {t1: 'hh', t2: 'ehehee'},
            {t1: 'hhh', t2: 'eeheheh'}, {t1: 'hhh', t2: 'eheeheh'},
            {t1: 'hhh', t2: 'eheheeh'}, {t1: 'hhh', t2: 'ehehehe'},
            {t1: 'hhhh', t2: 'eheheheh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('66c. (t2:e+M(t1>t2,ε|t1:h)){2} + (t2:x+M(t1>t2,ε|t1:h)){2} ' +
             '(vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const rep1Grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const rep2Grammar: Grammar = Rep(Seq(t2("x"), matchGrammar), 2, 2);
        const grammar: Grammar = Seq(rep1Grammar, rep2Grammar);
        let grammarWithVocab: Grammar = Seq(grammar, Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1:10,t2:10}, grammarWithVocab);
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eexx'},
            {t1: 'h', t2: 'eexxh'},     {t1: 'h', t2: 'eexhx'},
            {t1: 'h', t2: 'eehxx'},     {t1: 'h', t2: 'ehexx'},
            {t1: 'hh', t2: 'eexhxh'},   {t1: 'hh', t2: 'eehxxh'},
            {t1: 'hh', t2: 'eehxhx'},   {t1: 'hh', t2: 'ehexxh'},
            {t1: 'hh', t2: 'ehexhx'},   {t1: 'hh', t2: 'ehehxx'},
            {t1: 'hhh', t2: 'eehxhxh'}, {t1: 'hhh', t2: 'ehexhxh'},
            {t1: 'hhh', t2: 'ehehxxh'}, {t1: 'hhh', t2: 'ehehxhx'},
            {t1: 'hhhh', t2: 'ehehxhxh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT,
                    WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    // Repeats involving Multiple Tapes

    // 8 states
    describe('67. (t1:o+t2:hi){1,4}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Seq(t1("o"), t2("hi")), 1, 4);
        const expectedResults: StringDict[] = [
            {t1: "o".repeat(1), t2: "hi".repeat(1)},
            {t1: "o".repeat(2), t2: "hi".repeat(2)},
            {t1: "o".repeat(3), t2: "hi".repeat(3)},
            {t1: "o".repeat(4), t2: "hi".repeat(4)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 10 states
    describe('68. (t1:no+t2:hi,){5}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Seq(t1("no"), t2("hi,")), 5, 5);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(5), t2: "hi,".repeat(5)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 10 states
    describe('69. (t1:no+t2:hello,){5}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Seq(t1("no"), t2("hello,")), 5, 5);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(5), t2: "hello,".repeat(5)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states
    describe('70. (t1:no+t2:hello,){10}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Seq(t1("no"), t2("hello,")), 10, 10);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(10), t2: "hello,".repeat(10)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states
    describe('71. ((t1:no+t2:hello,){5}){2}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Rep(Seq(t1("no"), t2("hello,")), 5, 5), 2, 2);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(10), t2: "hello,".repeat(10)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states
    describe('72. ((t1:no+t2:hello,){2}){5}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Rep(Seq(t1("no"), t2("hello,")), 2, 2), 5, 5);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(10), t2: "hello,".repeat(10)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 50 states
    describe('73. (t1:no+t2:hello,){25}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Seq(t1("no"), t2("hello,")), 25, 25);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(25), t2: "hello,".repeat(25)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 50 states
    describe('74. ((t1:no+t2:hello,){5}){5}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Rep(Seq(t1("no"), t2("hello,")), 5, 5), 5, 5);
        const expectedResults: StringDict[] = [
            {t1: "no".repeat(25), t2: "hello,".repeat(25)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 50 states
    describe('75. ((t1:hello,+t2:no){5}){5}', function() {
        log(`------${this.title}`);
        const grammar = Rep(Rep(Seq(t1("hello,"), t2("no")), 5, 5), 5, 5);
        const expectedResults: StringDict[] = [
            {t1: "hello,".repeat(25), t2: "no".repeat(25)},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });
});
