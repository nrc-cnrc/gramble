import { 
    Any, 
    CharSet,
    Count,
    CountTape,
    Epsilon,
    Grammar,
    Join, 
    MatchFrom,
    Null,
    Priority,
    Rep, 
    Seq, 
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    t1, t2, t3, t4,
    testHasTapes,
    testGrammar,
    testHasVocab,
    DEFAULT_MAX_RECURSION,
} from './testUtils';

import * as path from 'path';
import { StringDict, VERBOSE_DEBUG } from "../src/util";
import { NULL } from "../src/exprs";


describe(`${path.basename(module.filename)}`, function() {

    // MatchFrom tests with two tapes.

    describe('1. MatchFrom t1>t2, t1:hello', function() {
        const grammar1: Grammar = t1("hello");
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('2. MatchFrom t1>t2, ε', function() {
        const grammar1: Grammar = Epsilon();
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {},
        ];
        
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 0})
        testGrammar(grammar, expectedResults);
    });

    describe('2. MatchFrom t1>t2, 0', function() {
        const grammar1: Grammar = Null();
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [];
        
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 0})
        testGrammar(grammar, expectedResults);
    });

    describe('3. MatchFrom t1>t2, t1:hello+t1:world', function() {
        const grammar1: Grammar = Seq(t1("hello"), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'helloworld', t2: 'helloworld'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 7, t2: 7});
        testGrammar(grammar, expectedResults);
    });

    describe('4. MatchFrom t1>t2, t1:hello+t4:goodbye', function() {
        const grammar1: Grammar = Seq(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('5. MatchFrom t1>t2, t4:goodbye+t1:hello', function() {
        const grammar1: Grammar = Seq(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('6. MatchFrom t1>t2, Nested sequence (t1:hello+t1:,)+t1:world', function() {
        const grammar1: Grammar = Seq(Seq(t1("hello"), t1(", ")), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello, world', t2: 'hello, world'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 9, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('7. MatchFrom t1>t2, t1:hello|t1:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t1("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
            {t1: 'goodbye', t2: 'goodbye'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 8, t2: 8});
        testGrammar(grammar, expectedResults);
    });

    describe('8. MatchFrom t1>t2, t1:hello|t4:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
            {t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('9. MatchFrom t1>t2, t4:goodbye|t1:hello', function() {
        const grammar1: Grammar = Uni(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
            {t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('10. MatchFrom t1>t2, (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
        const grammar1: Grammar = Seq(Uni(t1("hello"), t1("goodbye")),
                                    Uni(t1("world"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'helloworld', t2: 'helloworld'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld'},
            {t1: 'hellokitty', t2: 'hellokitty'},
            {t1: 'goodbyekitty', t2: 'goodbyekitty'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 13, t2: 13});
        testGrammar(grammar, expectedResults);
    });

   
    describe('11. MatchFrom t1>t2, (t1:hello+t1:kitty)|(t1:goodbye+t1:world)', function() {
        const grammar1: Grammar = Uni(Seq(t1("hello"), t1("kitty")),
                                    Seq(t1("goodbye"), t1("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'hellokitty'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 13, t2: 13});
        testGrammar(grammar, expectedResults);
    });

    describe('12. MatchFrom t1>t2, t1:hi+t1:.', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'hih'},
            {t1: 'hii', t2: 'hii'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('13. MatchFrom t1>t2, Join t1:hello ⨝ t1:.ello', function() {
        const grammar1: Grammar = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('14. MatchFrom t1>t2, Join t1:hello ⨝ t4:world', function() {
        const grammar1: Grammar = Join(t1("hello"), t4('world'));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('15. MatchFrom t1>t2, Join t4:world ⨝ t1:hello', function() {
        const grammar1: Grammar = Join(t4('world'), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('16. MatchFrom t2>t3, Join t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 8, t2: 9, t3: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('17. MatchFrom t2>t3, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 8, t2: 9, t3: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('18. MatchFrom t1>t3, Join t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('19. MatchFrom t1>t3, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('20. MatchFrom t1>t3, Join t1:hello+t1:kitty ⨝ (t2:goodbye+t1:hello+t2:world)+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('21. MatchFrom t1>t3, Join t1:hello+t1:kitty ⨝ (t2:goodbye+t1:hello+t2:world)+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('22. MatchFrom t1>t2, t1:o{0,1}', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {},
            {t1: 'o', t2: 'o'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('23. MatchFrom t1>t2, Join t1:h{1,4}+t4:world+t1:ello ⨝ the same', function() {
        const grammar1: Grammar = Join(Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")),
                                     Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    describe('24. MatchFrom t1>t2, Join t4:world+t1:h{1,4}+t1:ello ⨝ the same', function() {
        const grammar1: Grammar = Join(Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")),
                                     Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    describe('25. MatchFrom t1>t2, t1:na{1,4}', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 4);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'na', t2: 'na'},
            {t1: 'nana', t2: 'nana'},
            {t1: 'nanana', t2: 'nanana'},
            {t1: 'nananana', t2: 'nananana'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('26. MatchFrom t1>t2, t1:.{0,2}+t1:hi', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 2), t1("hi"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
            {t1: 'ihi', t2: 'ihi'},
            {t1: 'hhi', t2: 'hhi'},
            {t1: 'iihi', t2: 'iihi'},
            {t1: 'hihi', t2: 'hihi'},
            {t1: 'hhhi', t2: 'hhhi'},
            {t1: 'ihhi', t2: 'ihhi'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('27. MatchFrom t1>t2, t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 1), t1("hi"), Rep(Any("t1"), 0, 1));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
            {t1: 'hhi', t2: 'hhi'},
            {t1: 'ihi', t2: 'ihi'},
            {t1: 'hih', t2: 'hih'},
            {t1: 'hii', t2: 'hii'},
            {t1: 'hhih', t2: 'hhih'},
            {t1: 'hhii', t2: 'hhii'},
            {t1: 'ihih', t2: 'ihih'},
            {t1: 'ihii', t2: 'ihii'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('28. MatchFrom t1>t2, t1:.* with vocab "hi"', function() {
        const subgrammar: Grammar = Rep(Any("t1"));
        let grammar: Grammar = Seq(Vocab("t1", "hi"), Vocab("t2", "XhiZ"), 
                                    MatchFrom(subgrammar, "t1", "t2"));
        grammar = Count(7, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'i', t2: 'i'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'ih'},
            {t1: 'ii', t2: 'ii'},
            {t1: 'hhh', t2: 'hhh'},
            {t1: 'hhi', t2: 'hhi'},
            {t1: 'hih', t2: 'hih'},
            {t1: 'hii', t2: 'hii'},
            {t1: 'ihh', t2: 'ihh'},
            {t1: 'ihi', t2: 'ihi'},
            {t1: 'iih', t2: 'iih'},
            {t1: 'iii', t2: 'iii'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('30a. Effectively insert e twice: (t2:e+M(t1>t2,.*)){2} (vocab h/he)', function() {
        const dotStar: Grammar = Rep(Any("t1"));
        const matchGrammar: Grammar = MatchFrom(dotStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30a-alt. Effectively insert e twice: (t2:e+M(t1>t2,.*)){2} (vocab h/he)', function() {
        const dotStar: Grammar = Rep(Any("t1"));
        const matchGrammar: Grammar = MatchFrom(dotStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30b. Effectively insert e twice: (t2:e+M(t1>t2,h*)){2} (vocab h/he)', function() {
        const hStar: Grammar = Rep(t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30b-alt. Effectively insert e twice: (t2:e+M(t1>t2,h*)){2} (vocab h/he)', function() {
        const hStar: Grammar = Rep(t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30c. Effectively insert e twice: (t2:e+M(t1>t2,h{0,1})){2} (vocab h/he)', function() {
        const hStar: Grammar = Rep(t1("h"), 0, 1);
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30c-alt. Effectively insert e twice: (t2:e+M(t1>t2,h{0,1})){2} (vocab h/he)', function() {
        const hStar: Grammar = Rep(t1("h"), 0, 1);
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30d. Effectively insert e twice: (t2:e+M(t1>t2,ε|t1:h)){2} (vocab h/he)', function() {
        const hStar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t2", "t1"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30d-alt. Effectively insert e twice: (t2:e+M(t1>t2,ε|t1:h)){2} (vocab h/he)', function() {
        const hStar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},     // missing for DIRECTION_LTR = false
            {t1: 'h', t2: 'eeh'},     // missing for DIRECTION_LTR = true
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30e-alt. Effectively insert e 2 or more times: (t2:e+M(t1>t2,ε|t1:h)){2,100} (vocab h/he)', function() {
        const hStar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 10);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 4}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},  // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'},  // equivalent to {t1: '', t2: 'eeee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30e-alt-2. Effectively insert e 2 or more times: (t2:e+M(t1>t2,ε|t1:h)){2,Inf} (vocab h/he)', function() {
        const hStar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, Infinity);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 4}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},  // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'},  // equivalent to {t1: '', t2: 'eeee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},    // missing
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30f-alt. Effectively insert e 2 or more times: (t2:e+M(t1>t2,ε|t1:h)){2,6} (vocab h/he)', function() {
        const hStar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 20);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 6}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},  // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'},  // equivalent to {t1: '', t2: 'eeee'}
            {t2: 'eeeee'},  // equivalent to {t1: '', t2: 'eeeee'}
            {t2: 'eeeeee'},  // equivalent to {t1: '', t2: 'eeeeee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},
            {t1: 'h', t2: 'eheee'},
            {t1: 'h', t2: 'eehee'},
            {t1: 'h', t2: 'eeehe'},
            {t1: 'h', t2: 'eeeeh'},
            {t1: 'h', t2: 'eheeee'},
            {t1: 'h', t2: 'eeheee'},
            {t1: 'h', t2: 'eeehee'},
            {t1: 'h', t2: 'eeeehe'},
            {t1: 'h', t2: 'eeeeeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('30f-alt-2. Effectively insert e 2 or more times: (t2:e+M(t1>t2,ε|t1:h)){2,Inf} (vocab h/he)', function() {
        const hStar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(hStar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, Infinity);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "h"), Vocab('t2', "he"));
        grammarWithVocab = CountTape({t1: 1, t2: 6}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t2: 'eee'},  // equivalent to {t1: '', t2: 'eee'}
            {t2: 'eeee'},  // equivalent to {t1: '', t2: 'eeee'}
            {t2: 'eeeee'},  // equivalent to {t1: '', t2: 'eeeee'}
            {t2: 'eeeeee'},  // equivalent to {t1: '', t2: 'eeeeee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'ehee'},
            {t1: 'h', t2: 'eehe'},
            {t1: 'h', t2: 'eeeh'},    // missing
            {t1: 'h', t2: 'eheee'},
            {t1: 'h', t2: 'eehee'},
            {t1: 'h', t2: 'eeehe'},   // missing
            {t1: 'h', t2: 'eeeeh'},   // missing
            {t1: 'h', t2: 'eheeee'},
            {t1: 'h', t2: 'eeheee'},
            {t1: 'h', t2: 'eeehee'},  // missing
            {t1: 'h', t2: 'eeeehe'},  // missing
            {t1: 'h', t2: 'eeeeeh'},  // missing
        ];
        testGrammar(grammarWithVocab, expectedResults);
    });


    // MatchFrom tests with three tapes.

    describe('3-1. MatchFrom t1>t2,t3, t1:hello', function() {
        const grammar1: Grammar = t1("hello");
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2: 4, t3: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('3-2. MatchFrom t1>t2,t3, ε', function() {
        const grammar1: Grammar = Epsilon();
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {},
        ];
        // Even though we are matching on t1, t2, grammar has no tapes.
        // testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        testHasVocab(grammar, {t1: 0, t2: 0, t3: 0});
        testGrammar(grammar, expectedResults);
    });
    
    describe('3-3. MatchFrom t1>t2,t3, t1:hello+t1:world', function() {
        const grammar1: Grammar = Seq(t1("hello"), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'helloworld', t2: 'helloworld', t3: 'helloworld'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 7, t2: 7, t3: 7});
        testGrammar(grammar, expectedResults);
    });

    describe('3-4. MatchFrom t1>t2,t3, t1:hello+t4:goodbye', function() {
        const grammar1: Grammar = Seq(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('3-5. MatchFrom t1>t2,t3, t4:goodbye+t1:hello', function() {
        const grammar1: Grammar = Seq(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('3-6. MatchFrom t1>t2,t3, Nested sequence (t1:hello+t1:,)+t1:world', function() {
        const grammar1: Grammar = Seq(Seq(t1("hello"), t1(", ")), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello, world', t2: 'hello, world', t3: 'hello, world'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 9, t2: 9, t3: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-7. MatchFrom t1>t2,t3, t1:hello|t1:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t1("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t1: 'goodbye', t2: 'goodbye', t3: 'goodbye'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 8, t2: 8, t3: 8});
        testGrammar(grammar, expectedResults);
    });

    describe('3-8. MatchFrom t1>t2,t3, t1:hello|t4:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('3-9. MatchFrom t1>t2,t3, t4:goodbye|t1:hello', function() {
        const grammar1: Grammar = Uni(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t4: 'goodbye'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    describe('3-10. MatchFrom t1>t2,t3, (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
        const grammar1: Grammar = Seq(Uni(t1("hello"), t1("goodbye")),
                                    Uni(t1("world"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'helloworld', t2: 'helloworld', t3: 'helloworld'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld', t3: 'goodbyeworld'},
            {t1: 'hellokitty', t2: 'hellokitty', t3: 'hellokitty'},
            {t1: 'goodbyekitty', t2: 'goodbyekitty', t3: 'goodbyekitty'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 13, t2: 13, t3: 13});
        testGrammar(grammar, expectedResults);
    });

    describe('3-11. MatchFrom t1>t2,t3, (t1:hello+t1:kitty)|(t1:goodbye+t1:world)', function() {
        const grammar1: Grammar = Uni(Seq(t1("hello"), t1("kitty")),
                                    Seq(t1("goodbye"), t1("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'hellokitty', t3: 'hellokitty'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 13, t2: 13, t3: 13});
        testGrammar(grammar, expectedResults);
    });

    describe('3-12a. MatchFrom t1>t2,t3, t1:.', function() {
        const grammar1: Grammar = Seq(Vocab("t1", "hi"), Any("t1"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h', t3: 'h'},
            {t1: 'i', t2: 'i', t3: 'i'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('3-12b. MatchFrom t1>t2,t3, t1:hi+t1:.', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'hih', t3: 'hih'},
            {t1: 'hii', t2: 'hii', t3: 'hii'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('3-13. MatchFrom t1>t2,t3, t1:hello ⨝ t1:.ello', function() {
        const grammar1: Grammar = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2: 4, t3: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('3-14. MatchFrom t1>t2,t3 Join t1:hello ⨝ t4:world', function() {
        const grammar1: Grammar = Join(t1("hello"), t4('world'));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('3-15. MatchFrom t1>t2,t3 Join t4:world ⨝ t1:hello', function() {
        const grammar1: Grammar = Join(t4('world'), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('3-16. MatchFrom t2>t3,t4, Join t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld', t4: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1: 8, t2: 9, t3: 9, t4: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-17. MatchFrom t2>t3,t4, Join t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld', t4: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1: 8, t2: 9, t3: 9, t4: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-18. MatchFrom t1>t3,t4, Join t1:hello+t1:kitty ⨝ (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-19. MatchFrom t1>t3,t4, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world ⨝ t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-20. MatchFrom t1>t3,t4, Join t1:hello+t1:kitty ⨝ (t2:goodbye+t1:hello+t2:world)+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-21. MatchFrom t1>t3,t4, Join (t2:goodbye+t1:hello+t2:world)+t1:kitty ⨝ t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworld'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    describe('3-22. MatchFrom t1>t2,t3, t1:o{0,1}', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {},
            {t1: 'o', t2: 'o', t3: 'o'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 1, t2: 1, t3: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('3-23. MatchFrom t1>t2,t3, Join t1:h{1,4}+t4:world+t1:ello ⨝ the same', function() {
        const grammar1: Grammar = Join(Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")),
                                     Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t3: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t3: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t3: 'hhhhello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    describe('3-24. MatchFrom t1>t2,t3, Join t4:world+t1:h{1,4}+t1:ello ⨝ the same', function() {
        const grammar1: Grammar = Join(Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")),
                                     Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'world'},
            {t1: 'hhello', t2: 'hhello', t3: 'hhello', t4: 'world'},
            {t1: 'hhhello', t2: 'hhhello', t3: 'hhhello', t4: 'world'},
            {t1: 'hhhhello', t2: 'hhhhello', t3: 'hhhhello', t4: 'world'},
        ];
        
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        //testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    describe('3-25. MatchFrom t1>t2,t3, t1:na{1,4}', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 4);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'na', t2: 'na', t3: 'na'},
            {t1: 'nana', t2: 'nana', t3: 'nana'},
            {t1: 'nanana', t2: 'nanana', t3: 'nanana'},
            {t1: 'nananana', t2: 'nananana', t3: 'nananana'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('3-26. MatchFrom t1>t2,t3, t1:.{0,2}+t1:hi', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 2), t1("hi"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi', t3: 'hi'},
            {t1: 'ihi', t2: 'ihi', t3: 'ihi'},
            {t1: 'hhi', t2: 'hhi', t3: 'hhi'},
            {t1: 'iihi', t2: 'iihi', t3: 'iihi'},
            {t1: 'hihi', t2: 'hihi', t3: 'hihi'},
            {t1: 'hhhi', t2: 'hhhi', t3: 'hhhi'},
            {t1: 'ihhi', t2: 'ihhi', t3: 'ihhi'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('3-27. MatchFrom t1>t2,t3, t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
        const grammar1: Grammar = Seq(Rep(Any("t1"), 0, 1), t1("hi"), Rep(Any("t1"), 0, 1));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi', t3: 'hi'},
            {t1: 'hhi', t2: 'hhi', t3: 'hhi'},
            {t1: 'ihi', t2: 'ihi', t3: 'ihi'},
            {t1: 'hih', t2: 'hih', t3: 'hih'},
            {t1: 'hii', t2: 'hii', t3: 'hii'},
            {t1: 'hhih', t2: 'hhih', t3: 'hhih'},
            {t1: 'hhii', t2: 'hhii', t3: 'hhii'},
            {t1: 'ihih', t2: 'ihih', t3: 'ihih'},
            {t1: 'ihii', t2: 'ihii', t3: 'ihii'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('3-28. MatchFrom t1>t2,t3, t1:.* with vocab "hi"', function() {
        const subgrammar: Grammar = Rep(Any("t1"));
        let grammar: Grammar = Seq(Vocab("t1", "hi"), Vocab("t2", "XhiZ"), Vocab("t3", "ZXhi"),
                                   MatchFrom(subgrammar, "t1", "t2", "t3"));
        grammar = Count(7, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t3: 'h'},
            {t1: 'i', t2: 'i', t3: 'i'},
            {t1: 'hh', t2: 'hh', t3: 'hh'},
            {t1: 'hi', t2: 'hi', t3: 'hi'},
            {t1: 'ih', t2: 'ih', t3: 'ih'},
            {t1: 'ii', t2: 'ii', t3: 'ii'},
            // {t1: 'hhh', t2: 'hhh', t3: 'hhh'},
            // {t1: 'hhi', t2: 'hhi', t3: 'hhi'},
            // {t1: 'hih', t2: 'hih', t3: 'hih'},
            // {t1: 'hii', t2: 'hii', t3: 'hii'},
            // {t1: 'ihh', t2: 'ihh', t3: 'ihh'},
            // {t1: 'ihi', t2: 'ihi', t3: 'ihi'},
            // {t1: 'iih', t2: 'iih', t3: 'iih'},
            // {t1: 'iii', t2: 'iii', t3: 'iii'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 2, t2: 4, t3: 4});
        testGrammar(grammar, expectedResults);
    });


    // Joins of Matches

    describe('J-1. t1:h ⨝ MatchFrom(t1:.*, t1>t2)', function() {
        const grammar2: Grammar = MatchFrom(Any("t1"), "t1", "t2");
        const grammar3: Grammar = Join(t1("h"), grammar2)
        const grammarWithVocab: Grammar = Seq(grammar3, Vocab("t1", "hi"), Vocab("t2", "hi"));
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'},
        ];
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 2});
        testGrammar(grammarWithVocab, expectedResults);
    });
    
    describe('J-2. MatchFrom(t1:.*, t1>t2) ⨝ t1:h', function() {
        const grammar2: Grammar = MatchFrom(Any("t1"), "t1", "t2");
        const grammar3: Grammar = Join(grammar2, t1("h"))
        const grammarWithVocab: Grammar = Seq(grammar3, Vocab("t1", "hi"), Vocab("t2", "hi"));
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'h'},
        ];
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 2});
        testGrammar(grammarWithVocab, expectedResults);
    });

    describe('J-3. t1:hi ⨝ MatchFrom(t1:.*, t1>t2)', function() {
        const grammar2: Grammar = MatchFrom(Rep(Any("t1")), "t1", "t2");
        const grammar3: Grammar = Join(t1("hi"), grammar2)
        const grammarWithVocab: Grammar = Seq(grammar3, Vocab("t2", "hi"));
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'},
        ];
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 2});
        testGrammar(grammarWithVocab, expectedResults);
    });
    
    describe('J-4. t2:hello ⨝ MatchFrom(t1:.*, t1>t2)', function() {
        const grammar2: Grammar = MatchFrom(Rep(Any("t1")), "t1", "t2");
        const grammar3: Grammar = Seq(Join(t2("hello"), grammar2), Vocab("t1", "hello"))
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testHasTapes(grammar3, ['t1', 't2']);
        testHasVocab(grammar3, {t1: 4, t2: 4});
        testGrammar(grammar3, expectedResults);
    });
    
    describe('J-5. t1:hello+t2:hello ⨝ MatchFrom(t1:.*, t1>t2)', function() {
        const grammar2: Grammar = MatchFrom(Rep(Any("t1")), "t1", "t2");
        const grammar3: Grammar = Join(Seq(t1("hello"), t2("hello")), grammar2)
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testHasTapes(grammar3, ['t1', 't2']);
        testHasVocab(grammar3, {t1: 4, t2: 4});
        testGrammar(grammar3, expectedResults);
    });
    
    describe('J-6. Joining output of two matchFroms', function() {
        const g1 = MatchFrom(CharSet("t1", ["h","i"]), "t1", "t2");
        const g2 = MatchFrom(CharSet("t3", ["i","j"]), "t3", "t2");
        const g3 = Join(g1, g2);
        const g4 = Seq(g3, Vocab("t2", "hij"))
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'i', t3: 'i'},
        ];
        testHasTapes(g4, ['t1', 't2', 't3']);
        testHasVocab(g4, {t1: 2, t2: 3, t3: 2});
        testGrammar(g4, expectedResults);
    });
    
    describe('J-7. Joining output of one matchFroms with input of another', function() {
        const g1 = MatchFrom(CharSet("t1", ["h","i"]), "t1", "t2");
        const g2 = MatchFrom(CharSet("t2", ["i","j"]), "t2", "t3");
        const g3 = Join(g1, g2);
        const g4 = Seq(g3, Vocab("t2", "hij"), Vocab("t3", "hij"));
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'i', t3: 'i'},
        ];
        testHasTapes(g4, ['t1', 't2', 't3']);
        testHasVocab(g4, {t1: 2, t2: 3, t3: 3});
        testGrammar(g4, expectedResults);
    });
    
    describe('J-8. Joining output of one matchFroms with input of another, other direction', function() {
        const g1 = MatchFrom(CharSet("t1", ["h","i"]), "t1", "t2");
        const g2 = MatchFrom(CharSet("t2", ["i","j"]), "t2", "t3");
        const g3 = Join(g2, g1);
        const g4 = Seq(g3, Vocab("t2", "hij"), Vocab("t3", "hij"));
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'i', t3: 'i'},
        ];
        testHasTapes(g4, ['t1', 't2', 't3']);
        testHasVocab(g4, {t1: 2, t2: 3, t3: 3});
        testGrammar(g4, expectedResults);
    });

});
