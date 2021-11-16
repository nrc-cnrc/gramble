import { 
    Grammar, 
    Epsilon, 
    Seq, 
    Uni, 
    Join, 
    Any, 
    Rep, 
    MatchFrom,
    Vocab
} from "../src/grammars";

import { 
    t1, t2, t3, t4,
    testHasTapes, 
    //testHasVocab, 
    //testHasNoVocab,  
    testGrammar,
} from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";

const DUMMY_SYMBOL_NAME: string = "";
const DEFAULT_MAX_RECURSION: number = 4;

describe(`${path.basename(module.filename)}`, function() {

    // MatchFrom tests with two tapes.

    // 1. MatchFrom t1, t2, t1:hello
    describe('1. MatchFrom t1, t2, t1:hello', function() {
        const grammar1: Grammar = t1("hello");
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    // 2. MatchFrom t1, t2, ε
    describe('2. MatchFrom t1, t2, ε', function() {
        const grammar1: Grammar = Epsilon();
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {},
        ];
        // Even though we are matching on t1, t2, grammar has no tapes.
        // testHasTapes(grammar, ['t1', 't2']);
        testHasTapes(grammar, []);
        // testHasNoVocab(grammar, 't1');
        // testHasNoVocab(grammar, 't2');
        testGrammar(grammar, expectedResults);
    });

    // 3. MatchFrom t1, t2, t1:hello+t1:world
    describe('3. MatchFrom t1, t2, t1:hello+t1:world', function() {
        const grammar1: Grammar = Seq(t1("hello"), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'helloworld', t2: 'helloworld'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 7, t2: 7});
        testGrammar(grammar, expectedResults);
    });

    // 4. MatchFrom t1, t2, t1:hello+t4:goodbye
    describe('4. MatchFrom t1, t2, t1:hello+t4:goodbye', function() {
        const grammar1: Grammar = Seq(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'goodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 5. MatchFrom t1, t2, t4:goodbye+t1:hello
    describe('5. MatchFrom t1, t2, t4:goodbye+t1:hello', function() {
        const grammar1: Grammar = Seq(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'goodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 6. MatchFrom t1, t2, Nested sequence (t1:hello+t1:,)+t1:world
    describe('6. MatchFrom t1, t2, Nested sequence (t1:hello+t1:,)+t1:world', function() {
        const grammar1: Grammar = Seq(Seq(t1("hello"), t1(", ")), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello, world', t2: 'hello, world'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 9, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 7. MatchFrom t1, t2, t1:hello|t1:goodbye
    describe('7. MatchFrom t1, t2, t1:hello|t1:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t1("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
            {t1: 'goodbye', t2: 'goodbye'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 8, t2: 8});
        testGrammar(grammar, expectedResults);
    });

    // 8. MatchFrom t1, t2, t1:hello|t4:goodbye
    describe('8. MatchFrom t1, t2, t1:hello|t4:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
            {t4: 'goodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 9. MatchFrom t1, t2, t4:goodbye|t1:hello
    describe('9. MatchFrom t1, t2, t4:goodbye|t1:hello', function() {
        const grammar1: Grammar = Uni(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
            {t4: 'goodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 10. MatchFrom t1, t2, (t1:hello|t1:goodbye)+(t1:world|t1:kitty)
    describe('10. MatchFrom t1, t2, (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
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
        // testHasVocab(grammar, {t1: 13, t2: 13});
        testGrammar(grammar, expectedResults);
    });

    // 11. MatchFrom t1, t2, (t1:hello+t1:kitty)|(t1:goodbye+t1:world)
    describe('11. MatchFrom t1, t2, (t1:hello+t1:kitty)|(t1:goodbye+t1:world)', function() {
        const grammar1: Grammar = Uni(Seq(t1("hello"), t1("kitty")),
                                    Seq(t1("goodbye"), t1("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'hellokitty'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 13, t2: 13});
        testGrammar(grammar, expectedResults);
    });

    // 12. MatchFrom t1, t2, t1:hi+t1:.
    describe('12. MatchFrom t1, t2, t1:hi+t1:.', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'hih'},
            {t1: 'hii', t2: 'hii'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    // 13. MatchFrom t1, t2, Join t1:hello & t1:.ello
    describe('13. MatchFrom t1, t2, Join t1:hello & t1:.ello', function() {
        const grammar1: Grammar = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    // 14. MatchFrom t1, t2, Join t1:hello & t4:world
    describe('14. MatchFrom t1, t2, Join t1:hello & t4:world', function() {
        const grammar1: Grammar = Join(t1("hello"), t4('world'));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'worldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    // 15. MatchFrom t1, t2, Join t4:world & t1:hello
    describe('15. MatchFrom t1, t2, Join t4:world & t1:hello', function() {
        const grammar1: Grammar = Join(t4('world'), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'worldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    // 16. MatchFrom t2, t3 Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world
    describe('16. MatchFrom t2, t3, t4, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokittyhellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t2: 9, t3: 9});
        testGrammar(grammar, expectedResults);
    });

    // 17. MatchFrom t2, t3 Join (t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty
    describe('17. MatchFrom t2, t3, t4, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokittyhellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t2: 9, t3: 9});
        testGrammar(grammar, expectedResults);
    });

    // 18. MatchFrom t1, t3, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world
    describe('18. MatchFrom t1, t3, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 19. MatchFrom t1, t3, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty
    describe('19. MatchFrom t1, t3, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 20. MatchFrom t1, t3, Join t1:hello+t1:kitty & (t2:goodbye+t1:hello+t2:world)+t1:kitty
    describe('20. MatchFrom t1, t3, Join t1:hello+t1:kitty & (t2:goodbye+t1:hello+t2:world)+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 21. MatchFrom t1, t3, Join (t2:goodbye+t1:hello+t2:world)+t1:kitty & t1:hello+t1:kitty
    describe('21. MatchFrom t1, t3, Join t1:hello+t1:kitty & (t2:goodbye+t1:hello+t2:world)+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t2: 'goodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 22. MatchFrom t1, t2, t1:o{0,1}
    describe('22. MatchFrom t1, t2, t1:o{0,1}', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {},
            {t1: 'o', t2: 'o'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 1, t2: 1});
        testGrammar(grammar, expectedResults);
    });

    // 23. MatchFrom t1, t2, Join t1:h{1,4}+t4:world+t1:ello & the same
    describe('23. MatchFrom t1, t2, Join t1:h{1,4}+t4:world+t1:ello & the same', function() {
        const grammar1: Grammar = Join(Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")),
                                     Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'worldworld'},
            {t1: 'hhello', t2: 'hhello', t4: 'worldworld'},
            {t1: 'hhhello', t2: 'hhhello', t4: 'worldworld'},
            {t1: 'hhhhello', t2: 'hhhhello', t4: 'worldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    // 24. MatchFrom t1, t2, Join t4:world+t1:h{1,4}+t1:ello & the same
    describe('24. MatchFrom t1, t2, Join t4:world+t1:h{1,4}+t1:ello & the same', function() {
        const grammar1: Grammar = Join(Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")),
                                     Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t4: 'worldworld'},
            {t1: 'hhello', t2: 'hhello', t4: 'worldworld'},
            {t1: 'hhhello', t2: 'hhhello', t4: 'worldworld'},
            {t1: 'hhhhello', t2: 'hhhhello', t4: 'worldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    // 25. MatchFrom t1, t2, t1:na{1,4}
    describe('25. MatchFrom t1, t2, t1:na{1,4}', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 4);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2");
        const expectedResults: StringDict[] = [
            {t1: 'na', t2: 'na'},
            {t1: 'nana', t2: 'nana'},
            {t1: 'nanana', t2: 'nanana'},
            {t1: 'nananana', t2: 'nananana'},
        ];
        testHasTapes(grammar, ['t1', 't2']);
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    // 26. MatchFrom t1, t2, t1:.{0,2}+t1:hi
    describe('26. MatchFrom t1, t2, t1:.{0,2}+t1:hi', function() {
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
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    // 27. MatchFrom t1, t2, t1:.{0,1}+t1:hi+t1:.{0,1}
    describe('27. MatchFrom t1, t2, t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
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
        // testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, expectedResults);
    });

    // 28. MatchFrom t1, t2, t1:.* with vocab "hi"
    describe('28. MatchFrom t1, t2, t1:.* with vocab "hi"', function() {
        const grammar1: Grammar = Rep(Any("t1"));
        const grammar: Grammar = Seq(Vocab("t1", "hi"), Vocab("t2", "XhiZ"), MatchFrom(grammar1, "t1", "t2"));
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
        // testHasVocab(grammar, {t1: 2, t2: 4});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL_NAME, DEFAULT_MAX_RECURSION, 8);
    });

    // MatchFrom tests with three tapes.

    // 1. MatchFrom t1, t2, t3, t1:hello
    describe('1. MatchFrom t1, t2, t3, t1:hello', function() {
        const grammar1: Grammar = t1("hello");
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4});
        testGrammar(grammar, expectedResults);
    });

    // 2. MatchFrom t1, t2, t3, ε
    describe('2. MatchFrom t1, t2, t3, ε', function() {
        const grammar1: Grammar = Epsilon();
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {},
        ];
        // Even though we are matching on t1, t2, grammar has no tapes.
        // testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasTapes(grammar, []);
        // testHasNoVocab(grammar, 't1');
        // testHasNoVocab(grammar, 't2');
        // testHasNoVocab(grammar, 't3');
        testGrammar(grammar, expectedResults);
    });

    // 3. MatchFrom t1, t2, t3, t1:hello+t1:world
    describe('3. MatchFrom t1, t2, t3, t1:hello+t1:world', function() {
        const grammar1: Grammar = Seq(t1("hello"), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'helloworld', t2: 'helloworld', t3: 'helloworld'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 7, t2: 7, t3: 7});
        testGrammar(grammar, expectedResults);
    });

    // 4. MatchFrom t1, t2, t3, t1:hello+t4:goodbye
    describe('4. MatchFrom t1, t2, t3, t1:hello+t4:goodbye', function() {
        const grammar1: Grammar = Seq(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'goodbyegoodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 5. MatchFrom t1, t2, t3, t4:goodbye+t1:hello
    describe('5. MatchFrom t1, t2, t3, t4:goodbye+t1:hello', function() {
        const grammar1: Grammar = Seq(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'goodbyegoodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 6. MatchFrom t1, t2, t3, Nested sequence (t1:hello+t1:,)+t1:world
    describe('6. MatchFrom t1, t2, t3, Nested sequence (t1:hello+t1:,)+t1:world', function() {
        const grammar1: Grammar = Seq(Seq(t1("hello"), t1(", ")), t1("world"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello, world', t2: 'hello, world', t3: 'hello, world'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 9, t2: 9, t3: 9});
        testGrammar(grammar, expectedResults);
    });

    // 7. MatchFrom t1, t2, t3, t1:hello|t1:goodbye
    describe('7. MatchFrom t1, t2, t3, t1:hello|t1:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t1("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t1: 'goodbye', t2: 'goodbye', t3: 'goodbye'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 8, t2: 8, t3: 8});
        testGrammar(grammar, expectedResults);
    });

    // 8. MatchFrom t1, t2, t3, t1:hello|t4:goodbye
    describe('8. MatchFrom t1, t2, t3, t1:hello|t4:goodbye', function() {
        const grammar1: Grammar = Uni(t1("hello"), t4("goodbye"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t4: 'goodbyegoodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 9. MatchFrom t1, t2, t3, t4:goodbye|t1:hello
    describe('9. MatchFrom t1, t2, t3, t4:goodbye|t1:hello', function() {
        const grammar1: Grammar = Uni(t4("goodbye"), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
            {t4: 'goodbyegoodbyegoodbye'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 6});
        testGrammar(grammar, expectedResults);
    });

    // 10. MatchFrom t1, t2, t3, (t1:hello|t1:goodbye)+(t1:world|t1:kitty)
    describe('10. MatchFrom t1, t2, t3, (t1:hello|t1:goodbye)+(t1:world|t1:kitty)', function() {
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
        // testHasVocab(grammar, {t1: 13, t2: 13, t3: 13});
        testGrammar(grammar, expectedResults);
    });

    // 11. MatchFrom t1, t2, t3, (t1:hello+t1:kitty)|(t1:goodbye+t1:world)
    describe('11. MatchFrom t1, t2, t3, (t1:hello+t1:kitty)|(t1:goodbye+t1:world)', function() {
        const grammar1: Grammar = Uni(Seq(t1("hello"), t1("kitty")),
                                    Seq(t1("goodbye"), t1("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t2: 'hellokitty', t3: 'hellokitty'},
            {t1: 'goodbyeworld', t2: 'goodbyeworld', t3: 'goodbyeworld'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 13, t2: 13, t3: 13});
        testGrammar(grammar, expectedResults);
    });

    // 12. MatchFrom t1, t2, t3, t1:hi+t1:.
    describe('12. MatchFrom t1, t2, t3, t1:hi+t1:.', function() {
        const grammar1: Grammar = Seq(t1("hi"), Any("t1"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hih', t2: 'hih', t3: 'hih'},
            {t1: 'hii', t2: 'hii', t3: 'hii'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    // 13. MatchFrom t1, t2, t3, Join t1:hello & t1:.ello
    describe('13. MatchFrom t1, t2, t3, t1:hello & t1:.ello', function() {
        const grammar1: Grammar = Join(t1("hello"), Seq(Any("t1"), t1('ello')));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4});
        testGrammar(grammar, expectedResults);
    });

    // 14. MatchFrom t1, t2, t3 Join t1:hello & t4:world
    describe('14. MatchFrom t1, t2, t3 Join t1:hello & t4:world', function() {
        const grammar1: Grammar = Join(t1("hello"), t4('world'));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'worldworldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    // 15. MatchFrom t1, t2, t3 Join t4:world & t1:hello
    describe('15. MatchFrom t1, t2, t3 Join t4:world & t1:hello', function() {
        const grammar1: Grammar = Join(t4('world'), t1("hello"));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'worldworldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4});
        testGrammar(grammar, expectedResults);
    });

    // 16. MatchFrom t2, t3, t4, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world
    describe('16. MatchFrom t2, t3, t4, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokittyhellokittyhellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld', t4: 'goodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 8, t2: 9, t3: 9, t4: 9});
        testGrammar(grammar, expectedResults);
    });

    // 17. MatchFrom t2, t3, t4, Join t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty
    describe('17. MatchFrom t2, t3, t4, Join t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t2", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokittyhellokittyhellokitty', t2: 'goodbyeworld', t3: 'goodbyeworld', t4: 'goodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 8, t2: 9, t3: 9, t4: 9});
        testGrammar(grammar, expectedResults);
    });

    // 18. MatchFrom t1, t3, t4, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world
    describe('18. MatchFrom t1, t3, t4, Join t1:hello+t1:kitty & (t1:hello+t2:goodbye+t1:kitty)+t2:world', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworldgoodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 19. MatchFrom t1, t3, t4, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty
    describe('19. MatchFrom t1, t3, t4, Join (t1:hello+t2:goodbye+t1:kitty)+t2:world & t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                                                    t2("world")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworldgoodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 20. MatchFrom t1, t3, t4, Join t1:hello+t1:kitty & (t2:goodbye+t1:hello+t2:world)+t1:kitty
    describe('20. MatchFrom t1, t3, t4, Join t1:hello+t1:kitty & (t2:goodbye+t1:hello+t2:world)+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(t1("hello"), t1("kitty")),
                                                Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworldgoodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 21. MatchFrom t1, t3, t4, Join (t2:goodbye+t1:hello+t2:world)+t1:kitty & t1:hello+t1:kitty
    describe('21. MatchFrom t1, t3, t4, Join (t2:goodbye+t1:hello+t2:world)+t1:kitty & t1:hello+t1:kitty', function() {
        const grammar1: Grammar = Join(Seq(Seq(t2("goodbye"), t1("hello"), t2("world")),
                                                    t1("kitty")),
                                                Seq(t1("hello"), t1("kitty")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t3", "t4");
        const expectedResults: StringDict[] = [
            {t1: 'hellokitty', t3: 'hellokitty', t4: 'hellokitty', t2: 'goodbyeworldgoodbyeworldgoodbyeworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 8, t3: 8, t4: 8, t2: 9});
        testGrammar(grammar, expectedResults);
    });

    // 22. MatchFrom t1, t2, t3, t1:o{0,1}
    describe('22. MatchFrom t1, t2, t3, t1:o{0,1}', function() {
        const grammar1: Grammar = Rep(t1("o"), 0, 1);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {},
            {t1: 'o', t2: 'o', t3: 'o'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 1, t2: 1, t3: 1});
        testGrammar(grammar, expectedResults);
    });

    // 23. MatchFrom t1, t2, t3, Join t1:h{1,4}+t4:world+t1:ello & the same
    describe('23. MatchFrom t1, t2, t3, Join t1:h{1,4}+t4:world+t1:ello & the same', function() {
        const grammar1: Grammar = Join(Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")),
                                     Seq(Rep(t1("h"), 1, 4), t4("world"), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'worldworldworld'},
            {t1: 'hhello', t2: 'hhello', t3: 'hhello', t4: 'worldworldworld'},
            {t1: 'hhhello', t2: 'hhhello', t3: 'hhhello', t4: 'worldworldworld'},
            {t1: 'hhhhello', t2: 'hhhhello', t3: 'hhhhello', t4: 'worldworldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    // 24. MatchFrom t1, t2, t3, Join t4:world+t1:h{1,4}+t1:ello & the same
    describe('24. MatchFrom t1, t2, t3, Join t4:world+t1:h{1,4}+t1:ello & the same', function() {
        const grammar1: Grammar = Join(Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")),
                                     Seq(t4("world"), Rep(t1("h"), 1, 4), t1("ello")));
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello', t3: 'hello', t4: 'worldworldworld'},
            {t1: 'hhello', t2: 'hhello', t3: 'hhello', t4: 'worldworldworld'},
            {t1: 'hhhello', t2: 'hhhello', t3: 'hhhello', t4: 'worldworldworld'},
            {t1: 'hhhhello', t2: 'hhhhello', t3: 'hhhhello', t4: 'worldworldworld'},
        ];
        // We care about all tapes, even those not participating in the match.
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        // testHasVocab(grammar, {t1: 4, t2: 4, t3: 4, t4: 5});
        testGrammar(grammar, expectedResults);
    });

    // 25. MatchFrom t1, t2, t3, t1:na{1,4}
    describe('25. MatchFrom t1, t2, t3, t1:na{1,4}', function() {
        const grammar1: Grammar = Rep(t1("na"), 1, 4);
        const grammar: Grammar = MatchFrom(grammar1, "t1", "t2", "t3");
        const expectedResults: StringDict[] = [
            {t1: 'na', t2: 'na', t3: 'na'},
            {t1: 'nana', t2: 'nana', t3: 'nana'},
            {t1: 'nanana', t2: 'nanana', t3: 'nanana'},
            {t1: 'nananana', t2: 'nananana', t3: 'nananana'},
        ];
        testHasTapes(grammar, ['t1', 't2', 't3']);
        // testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    // 26. MatchFrom t1, t2, t3, t1:.{0,2}+t1:hi
    describe('26. MatchFrom t1, t2, t3, t1:.{0,2}+t1:hi', function() {
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
        // testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    // 27. MatchFrom t1, t2, t3, t1:.{0,1}+t1:hi+t1:.{0,1}
    describe('27. MatchFrom t1, t2, t3, t1:.{0,1}+t1:hi+t1:.{0,1}', function() {
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
        // testHasVocab(grammar, {t1: 2, t2: 2, t3: 2});
        testGrammar(grammar, expectedResults);
    });

    // 28. MatchFrom t1, t2, t3, t1:.* with vocab "hi"
    describe('28. MatchFrom t1, t2, t3, t1:.* with vocab "hi"', function() {
        const grammar1: Grammar = Rep(Any("t1"));
        const grammar: Grammar = Seq(Vocab("t1", "hi"), Vocab("t2", "XhiZ"), Vocab("t3", "ZXhi"),
                                   MatchFrom(grammar1, "t1", "t2", "t3"));
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
        // testHasVocab(grammar, {t1: 2, t2: 4, t3: 4});
        testGrammar(grammar, expectedResults, DUMMY_SYMBOL_NAME, DEFAULT_MAX_RECURSION, 8);
    });
    
});