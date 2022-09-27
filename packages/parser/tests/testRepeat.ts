
import { 
    Count, CountTape, Grammar,
    Seq, Join, Rep, Epsilon, Equals, Uni, Any, Intersect,
    MatchFrom, Priority, Vocab,
} from "../src/grammars";
import {
    t1, t2,
    testHasTapes, testGrammar, testHasVocab,
    WARN_ONLY_FOR_TOO_MANY_OUTPUTS
} from './testUtils';
import { VERBOSE_DEBUG, StringDict } from "../src/util";

import * as path from 'path';

const DEFAULT = undefined

describe(`${path.basename(module.filename)}`, function() {

    describe('1. Between 0 and 1 Os: t1:o{0,1}', function() {
        const grammar = Rep(t1("o"), 0, 1);
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{},
                              {t1: "o"}]);
    });

    describe('2. Between 1 and 4 Os: t1:o{1,4}', function() {
        const grammar = Rep(t1("o"), 1, 4);
        testGrammar(grammar, [{t1: "o"},
                              {t1: "oo"},
                              {t1: "ooo"},
                              {t1: "oooo"}]);
    });

    describe('3. Between 1 and 4 empty strings: t1:o{1,4}', function() {
        const grammar = Rep(t1(""), 1, 4);
        testGrammar(grammar, [{}]);
    });

    describe('4. Between 1 and 4 Os: t1:o{1,4}, plus a t2:foo', function() {
        const grammar = Seq(Rep(t1("o"), 1, 4), t2("foo"));
        testGrammar(grammar, [{t1: "o", t2: "foo"},
                              {t1: "oo", t2: "foo"},
                              {t1: "ooo", t2: "foo"},
                              {t1: "oooo", t2: "foo"}]);
    });

    describe('5. t2:foo + Between 1 and 4 Os: t1:o{1,4}', function() {
        const grammar = Seq(t2("foo"), Rep(t1("o"), 1, 4));
        //testHasVocab(grammar, {t1: 1, t2: 2});
        testGrammar(grammar, [{t1: "o", t2: "foo"},
                              {t1: "oo", t2: "foo"},
                              {t1: "ooo", t2: "foo"},
                              {t1: "oooo", t2: "foo"}]);
    });

    describe('6. Hello with between 1 and 4 Os: t1:hell+t1:o{1,4}', function() {
        const grammar = Seq(t1("hell"), Rep(t1("o"), 1, 4));
        testGrammar(grammar, [{t1: "hello"},
                              {t1: "helloo"},
                              {t1: "hellooo"},
                              {t1: "helloooo"}]);
    });

    describe('7. Hello with between 0 and 1 Os: t1:hell+t1:o{0,1}', function() {
        const grammar = Seq(t1("hell"), Rep(t1("o"), 0, 1));
        testGrammar(grammar, [{t1: "hell"},
                              {t1: "hello"}]);
    });

    describe('8. Hello with between 1 and 4 Hs: t1:h{1,4}+t1(ello)', function() {
        const grammar = Seq(Rep(t1("h"), 1, 4), t1("ello"));
        testGrammar(grammar, [{t1: "hello"},
                              {t1: "hhello"},
                              {t1: "hhhello"},
                              {t1: "hhhhello"}]);
    });

    describe('9. Hello with between 0 and 1 Hs: t1:h{0,1}+t1(ello)', function() {
        const grammar = Seq(Rep(t1("h"), 0, 1), t1("ello"));
        testGrammar(grammar, [{t1: "ello"},
                              {t1: "hello"}]);
    });

    describe('10. Joining "hhello" & hello with between 1 and 4 Hs', function() {
        const grammar = Join(t1("hhello"), Seq(Rep(t1("h"), 1, 4), t1("ello")));
        testGrammar(grammar, [{t1: "hhello"}]);
    });

    describe('11. Joining hello with between 1 and 4 Hs and "hhello"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello")), t1("hhello"));
        testGrammar(grammar, [{t1: "hhello"}]);
    });

    describe('12. Joining hello with between 1 and 4 Hs and the same', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello")),
                             Seq(Rep(t1("h"), 1, 4), t1("ello")));
        testGrammar(grammar, [{t1: "hello"},
                              {t1: "hhello"},
                              {t1: "hhhello"},
                              {t1: "hhhhello"}]);
    });
    
    describe('13. Joining between 1 and 4 Hs and the same, with t2 "world"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t2("world")),
                             Seq(Rep(t1("h"), 1, 4), t2("world")));
        testGrammar(grammar, [{t1: "h", t2: "world"},
                              {t1: "hh", t2: "world"},
                              {t1: "hhh", t2: "world"},
                              {t1: "hhhh", t2: "world"}]);
    });

    describe('14. Joining hello with between 1 and 4 Hs and the same, with t2 "world"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")),
                             Seq(Rep(t1("h"), 1, 4), t1("ello"), t2("world")));
        testGrammar(grammar, [{t1: "hello", t2: "world"},
                              {t1: "hhello", t2: "world"},
                              {t1: "hhhello", t2: "world"},
                              {t1: "hhhhello", t2: "world"}]);
    });
    
    describe('15. Joining h{1,4} and ello (with t2 in between) and the same, with t2 "world"', function() {
        const grammar = Join(Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")),
                             Seq(Rep(t1("h"), 1, 4), t2("world"), t1("ello")));
        testGrammar(grammar, [{t1: "hello", t2: "world"},
                              {t1: "hhello", t2: "world"},
                              {t1: "hhhello", t2: "world"},
                              {t1: "hhhhello", t2: "world"}]);
    });
    
    describe('16. Filtering t1:na{0,2} & ε', function() {
        const grammar = Equals(Rep(t1("na"), 0, 2), Epsilon());
        testGrammar(grammar, [{},
            {t1: "na"},
            {t1: "nana"}]);
    });

    
    describe('17. Filtering ε & t1:na{0,2}', function() {
        const grammar = Equals(Epsilon(), Rep(t1("na"), 0, 2));
        testGrammar(grammar, [{}]);
    });

    
    describe('18. Joining t1:na{0,2} & ε', function() {
        const grammar = Join(Rep(t1("na"), 0, 2), Epsilon());
        testGrammar(grammar, [{},
            {t1: "na"},
            {t1: "nana"}]);
    });

    describe('19. Joining ε & t1:na{0,2}', function() {
        const grammar = Join(Epsilon(), Rep(t1("na"), 0, 2));
        testGrammar(grammar, [{},
            {t1: "na"},
            {t1: "nana"}]);
    });

    describe('20. t1 with between 1 and 4 NAs: t1:na{1,4}', function() {
        const grammar = Rep(t1("na"), 1, 4);
        testGrammar(grammar, [{t1: "na"},
                              {t1: "nana"},
                              {t1: "nanana"},
                              {t1: "nananana"}]);
    });

    describe('21. t1 with between 0 and 2 NAs: t1:na{0,2}', function() {
        const grammar = Rep(t1("na"), 0, 2);
        testGrammar(grammar, [{},
                              {t1: "na"},
                              {t1: "nana"}]);
    });

    describe('22. t1 with 0 NAs: t1:na{0,0}', function() {
        const grammar = Rep(t1("na"), 0, 0);
        testGrammar(grammar, [{}]);
    });

    describe('23. t1 with no NAs (min > max): t1:na{4,3}', function() {
        const grammar = Rep(t1("na"), 4, 3);
        testGrammar(grammar, []);
    });

    describe('24. t1 with between 0 and 2 NAs (negative min): t1:na{-3,2}', function() {
        const grammar = Rep(t1("na"), -3, 2);
        testGrammar(grammar, [{},
                              {t1: "na"},
                              {t1: "nana"}]);
    });

    describe('25. t1 with between 1 and unlimited Os: t1:o+', function() {
        let grammar: Grammar = Rep(t1("o"), 1);
        grammar = Count(5, grammar);
        testGrammar(grammar, [{t1: "o"},
                              {t1: "oo"},
                              {t1: "ooo"},
                              {t1: "oooo"},
                              {t1: "ooooo"}]);
    });

    describe('26. t1:o*', function() {
        let grammar: Grammar = Rep(t1("o"));
        grammar = Count(5, grammar);
        testGrammar(grammar, [{},
                              {t1: "o"},
                              {t1: "oo"},
                              {t1: "ooo"},
                              {t1: "oooo"},
                              {t1: "ooooo"}]);
    });

    describe('27. t1:h*+t1:i', function() {
        let grammar: Grammar = Seq(Rep(t1("h")), t1("i"));
        grammar = Count(6, grammar);
        testGrammar(grammar, [{t1: "i"},
                              {t1: "hi"},
                              {t1: "hhi"},
                              {t1: "hhhi"},
                              {t1: "hhhhi"},
                              {t1: "hhhhhi"}]);
    });
    
    describe('28. t1:h+t1:i*', function() {
        let grammar: Grammar = Seq(t1("h"), Rep(t1("i")));
        grammar = Count(6, grammar);
        testGrammar(grammar, [{t1: "h"},
                              {t1: "hi"},
                              {t1: "hii"},
                              {t1: "hiii"},
                              {t1: "hiiii"},
                              {t1: "hiiiii"}]);
    });
    
    describe('29. (t1:h+t1:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t1("i")));
        grammar = Count(6, grammar);
        testGrammar(grammar, [{},
                              {t1: "hi"},
                              {t1: "hihi"},
                              {t1: "hihihi"}]);
    });

    
    describe('30. (t1:h+t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = Count(6, grammar);
        testGrammar(grammar, [{},
                            {"t1":"h","t2":"i"},
                            {"t1":"hh","t2":"ii"},
                            {"t1":"hhh","t2":"iii"}]);
    });

    describe('31. (t1:h|t2:i)*', function() {
        let grammar: Grammar = Rep(Uni(t1("h"), t2("i")));
        grammar = Count(3, grammar);
        testGrammar(grammar, [{},
                              {t1: 'h'},
                              {t1: 'hh'},
                              {t1: 'hhh'},
                              {t1: 'h', t2:'i'},
                              {t1: 'h', t2:'ii'},
                              {t1: 'hh', t2:'i'},
                              {t2: 'i'},
                              {t2: 'ii'},
                              {t2: 'iii'}],
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('31a. (t1:h|t2:i)*', function() {
        let grammar: Grammar = Rep(Uni(t1("h"), t2("i")));
        grammar = CountTape(1, grammar);
        testGrammar(grammar, [{},
                              {t1: 'h'},
                              {t1: 'h', t2:'i'},
                              {t2: 'i'},
                            ],
                    VERBOSE_DEBUG, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('32. (t1:a+t2:a|t1:b+t2:b)*', function() {
        let grammar: Grammar = Rep(Uni(Seq(t1("a"), t2("a")), 
                                Seq(t1("b"), t2("b"))));
        grammar = Count(4, grammar);
        testGrammar(grammar, [{},
                                {"t1":"a","t2":"a"},
                                {"t1":"b","t2":"b"},
                                {"t1":"aa","t2":"aa"},
                                {"t1":"ab","t2":"ab"},
                                {"t1":"ba","t2":"ba"},
                                {"t1":"bb","t2":"bb"}]);
    });

    describe('33. Filtering t1:h[ t2:h* ]', function() {
        const grammar = Equals(t1("h"),
                                 Rep(t2("h")));
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, [{t1:"h"}]);
    });
    
    describe('34. Filtering t1:h[ (t1:h|t2:h)* ]', function() {
        const grammar = Equals(t1("h"),
                                 Rep(Uni(t1("h"), t2("h"))));
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, [{'t1': 'h'}]);
    });

    describe('35. Seq t1:h+ε*', function() {
        const grammar = Seq(t1("h"), Rep(Epsilon()));
        testHasTapes(grammar, ['t1']);
        testGrammar(grammar, [{'t1': 'h'}]);
    });

    describe('36. (t1:"h"+t2:"")*', function() {
        const grammar = Rep(Seq(t1("h"), t2("")), 0, 4);
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, [{},
                              {t1: "h"},
                              {t1: "hh"},
                              {t1: "hhh"},
                              {t1: "hhhh"}]);
    });

    describe('37. (t2:""+t1:"h")*', function() {
        const grammar = Rep(Seq(t2(""), t1("h")), 0, 4);
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, [{},
                              {t1: "h"},
                              {t1: "hh"},
                              {t1: "hhh"},
                              {t1: "hhhh"}]);
    });

    describe('38. Nested repetition: (t1(ba){1,2}){2,3}', function() {
        const grammar = Rep(Rep(t1("ba"), 1, 2), 2, 3);
        testGrammar(grammar, [
                              {t1: "baba"},
                              {t1: "bababa"},
                              {t1: "babababa"},
                              {t1: "bababababa"},
                              {t1: "babababababa"}]);
    });

    describe('39. (t1:h+t2:h){2}', function() {
        const grammar = Rep(Seq(t1("h"), t2("h")), 2, 2);
        testGrammar(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('40. Filtering (t1:h+t2:h){2} with t1:hh+t2:hh ', function() {
        const grammar = Equals(Rep(Seq(t1("h"), t2("h")), 2, 2), Seq(t1("hh"), t2("hh")));
        testGrammar(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('41. Filtering t1:hh+t2:hh with (t1:h+t2:h){2}', function() {
        const grammar = Equals(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h")), 2, 2));
        testGrammar(grammar, [{t1: "hh", t2: "hh"}]);
    });

    
    describe('42. Filtering (t1:h+t2:h)* with t1:hh+t2:hh ', function() {
        const grammar = Equals(Rep(Seq(t1("h"), t2("h"))), Seq(t1("hh"), t2("hh")));
        testGrammar(grammar, [{t1: "hh", t2: "hh"}]);
    });

    describe('43. Filtering t1:hh+t2:hh with (t1:h+t2:h)*', function() {
        const grammar = Equals(Seq(t1("hh"), t2("hh")), Rep(Seq(t1("h"), t2("h"))));
        testGrammar(grammar, [{t1: "hh", t2: "hh"}]);
    });
    
    describe('44. Rep(Any): t1:hi+t1:.{0,3}', function() {
        const grammar = Seq(t1("hi"), Rep(Any("t1"), 0, 3));
        testGrammar(grammar, [ 
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

    describe('45. Rep(Any): t1:.{0,3}+t1:hi', function() {
        const grammar = Seq(Rep(Any("t1"), 0, 3), t1("hi"));
        testGrammar(grammar, [{t1: "hi"},
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
    
    describe('46. Rep(Any): t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
        const grammar = Seq( Rep(Any("t1"), 0, 1), t1("hi"), Rep(Any("t1"), 0, 1));
        testGrammar(grammar, [ 
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

    describe('47. Joining t1:hi & t1:.{0,1}', function() {
        const grammar = Join(t1("h"), Rep(Any("t1"), 0, 1));
        testGrammar(grammar, [{t1: "h"}]);
    });
    
    describe('48. Filtering t1:.{0,1} & ε', function() {
        const grammar = Equals(Rep(Any("t1"), 0, 2), Epsilon());
        testGrammar(grammar, [{}]);
    });
    
    describe('49. Filtering ε & t1:.{0,1}', function() {
        const grammar = Equals(Epsilon(), Rep(Any("t1"), 0, 2));
        testGrammar(grammar, [{}]);
    });
    
    describe('50. Joining t1:.{0,1} & ε', function() {
        const grammar = Join(Rep(Any("t1"), 0, 2), Epsilon());
        testGrammar(grammar, [{}]);
    });
    
    describe('51. Joining ε & t1:.{0,1}', function() {
        const grammar = Join(Epsilon(), Rep(Any("t1"), 0, 2));
        testGrammar(grammar, [{}]);
    });

    describe('52. Filtering "hello" with he.*', function() {
        const grammar = Equals(t1("hello"), Seq(t1("he"), Rep(Any("t1"))));
        testGrammar(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('53. Filtering "hello" with .*lo', function() {
        const grammar = Equals(t1("hello"), Seq(Rep(Any("t1")), t1("lo")));
        testGrammar(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('54. Filtering "hello" with .*e.*', function() {
        const grammar = Equals(t1("hello"), Seq(Rep(Any("t1")), t1("e"), Rep(Any("t1"))));
        testGrammar(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('55. Filtering "hello" with .*l.*', function() {
        const grammar = Equals(t1("hello"), Seq(Rep(Any("t1")), t1("l"), Rep(Any("t1"))));
        testGrammar(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('56. Filtering "hello" with .*h.*', function() {
        const grammar = Equals(t1("hello"), Seq(Rep(Any("t1")), t1("h"), Rep(Any("t1"))));
        testGrammar(grammar, [ 
                            {t1: "hello"}]);
    });

    describe('57. Filtering "hello" with .*o.*', function() {
        const grammar = Equals(t1("hello"), Seq(Rep(Any("t1")), t1("h"), Rep(Any("t1"))));
        testGrammar(grammar, [ 
                            {t1: "hello"}]);
    });

    // More joining of repeats

    describe('58a. t1:a + t2:bbb ⨝ (t1:"" + t2:b){3} + t1:a', function() {
        const grammar = Join(Seq(t1("a"), t2("bbb")), 
                             Seq(Rep(Seq(t1(""), t2("b")), 3, 3), t1("a")));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'a', t2: 'bbb'},
        ]);
    }); 

    describe('58b. t1:a + t2:bbb ⨝ (t1:"" + t2:b){0,4} + t1:a', function() {
        const grammar = Join(Seq(t1("a"), t2("bbb")), 
                             Seq(Rep(Seq(t1(""), t2("b")), 0, 4), t1("a")));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'a', t2: 'bbb'},
        ]);
    }); 

    describe('58c. (t1:"" + t2:b){3} + t1:a ⨝ t1:a + t2:bbb', function() {
        const grammar = Join(Seq(Rep(Seq(t1(""), t2("b")), 3, 3), t1("a")),
                             Seq(t1("a"), t2("bbb")));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'a', t2: 'bbb'},
        ]);
    }); 

    describe('58d. (t1:"" + t2:b){0,4} + t1:a ⨝ t1:a + t2:bbb', function() {
        const grammar = Join(Seq(Rep(Seq(t1(""), t2("b")), 0, 4), t1("a")),
                             Seq(t1("a"), t2("bbb")));
        testHasTapes(grammar, ["t1", "t2"]);
        testGrammar(grammar, [
            {t1: 'a', t2: 'bbb'},
        ]);
    }); 

    // Repeats of Nullable Matches

    describe('59. (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t2:ee (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(grammar, t2("ee"));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t1:h + t2:eeh (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} ⨝ t1:h + t2:ehe (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59b-1. Join t2:ee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(t2("ee"), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59b-2. Join t1:h + t2:eeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59b-3. Join t1:h + t2:ehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} [t2:ee] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const filterGrammar: Grammar = Equals(grammar, t2("ee"));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} [t1:h + t2:eeh] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("h"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} [t1:h + t2:ehe] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("h"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} & t2:ee (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar, t2("ee"));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} & t1:h + t2:eeh (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} & t1:h + t2:ehe (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59e-1. Intersect t2:ee & (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const intersectGrammar: Grammar = Intersect(t2("ee"), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59e-2. Intersect t1:h + t2:eeh & (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const intersectGrammar: Grammar = Intersect(Seq(t1("h"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('59e-3. Intersect t1:h + t2:ehe & (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const intersectGrammar: Grammar = Intersect(Seq(t1("h"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
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
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
            {t1: 'hx', t2: 'ehe'},
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:x + t2:ee (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("x"), t2("ee")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:hx + t2:eeh (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("hx"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x ⨝ t1:hx + t2:ehe (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("hx"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60b-1. Join t1:x + t2:ee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const joinGrammar: Grammar = Join(Seq(t1("x"), t2("ee")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60b-2. Join t1:hx + t2:eeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const joinGrammar: Grammar = Join(Seq(t1("hx"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60b-3. Join t1:hx + t2:ehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const joinGrammar: Grammar = Join(Seq(t1("hx"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x [t1:x + t2:ee] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("x"), t2("ee")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x [t1:hx + t2:eeh] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("hx"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x [t1:hx + t2:ehe] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("hx"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x & t1:x + t2:ee (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("x"), t2("ee")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x & t1:hx + t2:eeh (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("hx"), t2("eeh")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x & t1:hx + t2:ehe (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("hx"), t2("ehe")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'ehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60e-1. Intersect t1:x + t2:ee & (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const intersectGrammar: Grammar = Intersect(Seq(t1("x"), t2("ee")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'x', t2: 'ee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60e-2. Intersect t1:hx + t2:eeh & (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const intersectGrammar: Grammar = Intersect(Seq(t1("hx"), t2("eeh")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hx', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('60e-3. Intersect t1:hx + t2:ehe & (t2:e+M(t1>t2,ε|t1:h)){2} + t1:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t1("x"));
        const intersectGrammar: Grammar = Intersect(Seq(t1("hx"), t2("ehe")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
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
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 4, t2: 4}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
            {t1: 'h', t2: 'ehex'},
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t2:eex (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const joinGrammar: Grammar = Join(grammar, t2("eex"));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t1:h + t2:eehx (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("eehx")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x ⨝ t1:h + t2:ehex (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const joinGrammar: Grammar = Join(grammar, Seq(t1("h"), t2("ehex")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61b-1. Join t2:eex ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const joinGrammar: Grammar = Join(t2("eex"), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61b-2. Join t1:h + t2:eehx ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("eehx")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61b-3. Join t1:h + t2:ehex ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const joinGrammar: Grammar = Join(Seq(t1("h"), t2("ehex")), grammar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x [t2:eex] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const filterGrammar: Grammar = Equals(grammar, t2("eex"));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x [t1:h + t2:eehx] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("h"), t2("eehx")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x [t1:h + t2:ehex] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const filterGrammar: Grammar = Equals(grammar, Seq(t1("h"), t2("ehex")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x &t2:eex (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const intersectGrammar: Grammar = Intersect(grammar, t2("eex"));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x & t1:h + t2:eehx (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("eehx")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x & t1:h + t2:ehex (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const intersectGrammar: Grammar = Intersect(grammar, Seq(t1("h"), t2("ehex")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'ehex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61e-1. Intersect t2:eex & (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const intersectGrammar: Grammar = Intersect(t2("eex"), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eex'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61e-2. Intersect t1:h + t2:eehx & (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const intersectGrammar: Grammar = Intersect(Seq(t1("h"), t2("eehx")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'eehx'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('61e-3. Intersect t1:h + t2:ehex & (t2:e+M(t1>t2,ε|t1:h)){2} + t2:x (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Seq(Rep(Seq(t2("e"), matchGrammar), 2, 2), t2("x"));
        const intersectGrammar: Grammar = Intersect(Seq(t1("h"), t2("ehex")), grammar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
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
        let grammarWithVocab: Grammar = Seq(grammar2,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},
            {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},
            {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-1. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t2:eeee (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, t2("eeee"));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-2. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t1:hh + t2:eeheeh (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Seq(t1("hh"), t2("eeheeh")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-3. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ t1:hh + t2:eheehe (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Seq(t1("hh"), t2("eheehe")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-4. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t2:ee)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-5. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t1:h+t2:eeh)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62a-6. Join (t2:e+M(t1>t2,ε|t1:h)){2} + same ⨝ (t1:h+t2:ehe)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-1. Join t2:eeee ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(t2("eeee"), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-2. Join t1:hh + t2:eeheeh ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Seq(t1("hh"), t2("eeheeh")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-3. Join t1:hh + t2:eheehe ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Seq(t1("hh"), t2("eheehe")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-4. Join (t2:ee)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-5. Join (t1:h+t2:eeh)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh"))), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62b-6. Join (t1:h+t2:ehe)* ⨝ (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe"))), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-1. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [t2:eeee] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Equals(grammar2, t2("eeee"));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-2. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [t1:hh + t2:eeheeh] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Equals(grammar2, Seq(t1("hh"), t2("eeheeh")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-3. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [t1:hh + t2:eheehe] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Equals(grammar2, Seq(t1("hh"), t2("eheehe")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-4. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [(t2:ee)*] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Equals(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-5. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [(t1:h+t2:eeh)*] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Equals(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62c-6. Filter (t2:e+M(t1>t2,ε|t1:h)){2} + same [(t1:h+t2:ehe)*] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const filterGrammar: Grammar = Equals(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-1. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & t2:eeee (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(grammar2, t2("eeee"));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-2. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & t1:hh + t2:eeheeh (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(grammar2, Seq(t1("hh"), t2("eeheeh")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-3. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & t1:hh + t2:eheehe (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(grammar2, Seq(t1("hh"), t2("eheehe")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-4. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & (t2:ee)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-5. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & (t1:h+t2:eeh)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62d-6. Intersect (t2:e+M(t1>t2,ε|t1:h)){2} + same & (t1:h+t2:ehe)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-1. Intersect t2:eeee & (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(t2("eeee"), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-2. Intersect t1:hh + t2:eeheeh & (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(Seq(t1("hh"), t2("eeheeh")), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-3. Intersect t1:hh + t2:eheehe & (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(Seq(t1("hh"), t2("eheehe")), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-4. Intersect (t2:ee)* & (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-5. Intersect (t1:h+t2:eeh)* & (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh"))), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('62e-6. Intersect (t1:h+t2:ehe)* & (t2:e+M(t1>t2,ε|t1:h)){2} + same (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Seq(grammar, grammar);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe"))), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
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
        let grammarWithVocab: Grammar = Seq(grammar2,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
            {t1: 'h', t2: 'eeeeh'},
            {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},
            {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63a-1. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t2:ee)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63a-2. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t1:h+t2:eeh)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63a-3. Join ((t2:e+M(t1>t2,ε|t1:h)){2}){2} ⨝ (t1:h+t2:ehe)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63b-1. Join (t2:ee)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63b-2. Join (t1:h+t2:eeh)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh"))), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63b-3. Join (t1:h+t2:ehe)* ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe"))), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63c-1. Filter ((t2:e+M(t1>t2,ε|t1:h)){2}){2} [(t2:ee)*] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Equals(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63c-2. Filter ((t2:e+M(t1>t2,ε|t1:h)){2}){2} [(t1:h+t2:eeh)*] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Equals(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63c-3. Filter ((t2:e+M(t1>t2,ε|t1:h)){2}){2} [(t1:h+t2:ehe)*] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Equals(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63d-1. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2}){2} & (t2:ee)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(t2("ee")));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63d-2. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2}){2} & (t1:h+t2:eeh)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(Seq(t1("h"), t2("eeh"))));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63d-3. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2}){2} & (t1:h+t2:ehe)* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(Seq(t1("h"), t2("ehe"))));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63e-1. Intersect (t2:ee)* & ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(Rep(t2("ee")), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63e-2. Intersect (t1:h+t2:eeh)* & ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh"))), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('63e-3. Intersect (t1:h+t2:ehe)* & ((t2:e+M(t1>t2,ε|t1:h)){2}){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe"))), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
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
        let grammarWithVocab: Grammar = Seq(grammarStar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t2: 'ee'},
            {t2: 'eeee'},
            {t2: 'eeeeee'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeeeh'},
            {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eehee'},
            {t1: 'h', t2: 'eheee'},
            {t1: 'hh', t2: 'eheh'},
            {t1: 'hh', t2: 'eeeheh'},
            {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'},
            {t1: 'hh', t2: 'eheeeh'},
            {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64a-1. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t2:ee){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(grammarStar, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64a-2. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:eeh){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(grammarStar, Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64a-3. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:ehe){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(grammarStar, Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64b-1. Join (t2:ee){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(Rep(t2("ee"), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64b-2. Join (t1:h+t2:eeh){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh")), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64b-3. Join (t1:h+t2:ehe){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe")), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64c-1. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t2:ee){2}] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const filterGrammar: Grammar = Equals(grammarStar, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64c-2. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t1:h+t2:eeh){2}] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const filterGrammar: Grammar = Equals(grammarStar, Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64c-3. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t1:h+t2:ehe){2}] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const filterGrammar: Grammar = Equals(grammarStar, Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64d-1. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t2:ee){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const intersectGrammar: Grammar = Intersect(grammarStar, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64d-2. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t1:h+t2:eeh){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const intersectGrammar: Grammar = Intersect(grammarStar, Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64d-3. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t1:h+t2:ehe){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const intersectGrammar: Grammar = Intersect(grammarStar, Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64e-1. Intersect (t2:ee){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const intersectGrammar: Grammar = Intersect(Rep(t2("ee"), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64e-2. Intersect (t1:h+t2:eeh){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh")), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('64e-3. Intersect (t1:h+t2:ehe){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        const grammarStar: Grammar = Rep(grammar);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe")), 2, 2), grammarStar);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
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
        let grammarWithVocab: Grammar = Seq(grammar2,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 2, t2: 6}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t2: 'e'},    {t2: 'ee'},    {t2: 'eee'},
            {t2: 'eeee'}, {t2: 'eeeee'}, {t2: 'eeeeee'},
            {t1: 'h', t2: 'eh'},      {t1: 'h', t2: 'eeh'},     {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeeh'},    {t1: 'h', t2: 'eehe'},    {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eeeeh'},   {t1: 'h', t2: 'eeehe'},   {t1: 'h', t2: 'eehee'},
            {t1: 'h', t2: 'eheee'},   {t1: 'h', t2: 'eeeeeh'},  {t1: 'h', t2: 'eeeehe'},
            {t1: 'h', t2: 'eeehee'},  {t1: 'h', t2: 'eeheee'},  {t1: 'h', t2: 'eheeee'},
            {t1: 'hh', t2: 'eheh'},   {t1: 'hh', t2: 'eeheh'},  {t1: 'hh', t2: 'eheeh'},
            {t1: 'hh', t2: 'ehehe'},  {t1: 'hh', t2: 'eeeheh'}, {t1: 'hh', t2: 'eeheeh'},
            {t1: 'hh', t2: 'eehehe'}, {t1: 'hh', t2: 'eheeeh'}, {t1: 'hh', t2: 'eheehe'},
            {t1: 'hh', t2: 'ehehee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65a-1. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t2:ee){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65a-2. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:eeh){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65a-3. Join ((t2:e+M(t1>t2,ε|t1:h)){2})* ⨝ (t1:h+t2:ehe){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(grammar2, Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65b-1. Join (t2:ee){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(t2("ee"), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65b-2. Join (t1:h+t2:eeh){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("eeh")), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65b-3. Join (t1:h+t2:ehe){2} ⨝ ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const joinGrammar: Grammar = Join(Rep(Seq(t1("h"), t2("ehe")), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(joinGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65c-1. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t2:ee){2}] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Equals(grammar2, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65c-2. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t1:h+t2:eeh){2}] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Equals(grammar2, Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65c-3. Filter ((t2:e+M(t1>t2,ε|t1:h)){2})* [(t1:h+t2:ehe){2}] (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const filterGrammar: Grammar = Equals(grammar2, Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(filterGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65d-1. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t2:ee){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(t2("ee"), 2, 2));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65d-2. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t1:h+t2:eeh){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(Seq(t1("h"), t2("eeh")), 2, 2));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65d-3. Intersect ((t2:e+M(t1>t2,ε|t1:h)){2})* & (t1:h+t2:ehe){2} (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(grammar2, Rep(Seq(t1("h"), t2("ehe")), 2, 2));
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65e-1. Intersect (t2:ee){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(Rep(t2("ee"), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'eeee'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65e-2. Intersect (t1:h+t2:eeh){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("eeh")), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eeheeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('65e-3. Intersect (t1:h+t2:ehe){2} & ((t2:e+M(t1>t2,ε|t1:h)){2})* (vocab hx/hex)', function() {
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar));
        const grammar2: Grammar = Rep(grammar, 2, 2);
        const intersectGrammar: Grammar = Intersect(Rep(Seq(t1("h"), t2("ehe")), 2, 2), grammar2);
        let grammarWithVocab: Grammar = Seq(intersectGrammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hh', t2: 'eheehe'},
        ];
        testGrammar(grammarWithVocab, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });
    
});
