import {
    Any, Seq, Uni, Epsilon, Vocab, Join, Filter,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2,
    testHasTapes, testHasVocab, testGrammar,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. t1:hi + t1:.', function() {
        const grammar = Seq(t1("hi"), Any("t1"));
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {t1: 'hih'},
            {t1: 'hii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2. t1:. + t1:hi', function() {
        const grammar = Seq(Any("t1"), t1("hi"));
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {t1: 'hhi'},
            {t1: 'ihi'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3. Optional t1:. (empty vocab)', function() {
        const grammar = Uni(Epsilon(), Any("t1"));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{}]);
    });

    describe('4. Optional t1:. (vocab h)', function() {
        const grammar = Seq(Vocab({t1: 'h'}),
                            Uni(Epsilon(), Any("t1")));
        testHasTapes(grammar, ["t1"]);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5. Join t1:h ⨝ t1:.', function() {
        const grammar = Join(t1("h"), Any("t1"));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'h'}]);
    });

    describe('6. Join t1:hello ⨝ t1:.ello', function() {
        const grammar = Join(t1("hello"), Seq(Any("t1"), t1("ello")));
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('7. Join t1:ello ⨝ t1:.ello', function() {
        const grammar = Join(t1("ello"), Seq(Any("t1"), t1("ello")));
        testGrammar(grammar, []);
    });

    describe('8. Join t1:hello ⨝ t1:h.llo', function() {
        const grammar = Join(t1("hello"), Seq(t1("h"), Any("t1"), t1("llo")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('9. Join t1:hllo ⨝ t1:h.llo', function() {
        const grammar = Join(t1("hllo"), Seq(t1("h"), Any("t1"), t1("llo")));
        testGrammar(grammar, []);
    });

    describe('10. Join t1:hello ⨝ t1:hell.', function() {
        const grammar = Join(t1("hello"), Seq(t1("hell"), Any("t1")));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('11. Join t1:hell ⨝ t1:hell.', function() {
        const grammar = Join(t1("hell"), Seq(t1("hell"), Any("t1")));
        testGrammar(grammar, []);
    });

    // The same tests but with the dot on the left side

    describe('12. Join t1:. ⨝ t1:h', function() {
        const grammar = Join(Any("t1"), t1("h"));
        testHasVocab(grammar, {t1: 1});
        testGrammar(grammar, [{t1: 'h'}]);
    });

    describe('13. Join t1:.ello ⨝ t1:hello', function() {
        const grammar = Join(Seq(Any("t1"), t1("ello")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('14. Join t1:.ello ⨝ t1:ello', function() {
        const grammar = Join(Seq(Any("t1"), t1("ello")), t1("ello"));
        testGrammar(grammar, []);
    });

    describe('15. Join t1:h.llo ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("h"), Any("t1"), t1("llo")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('16. Join t1:h.llo ⨝ t1:hllo', function() {
        const grammar = Join(Seq(t1("h"), Any("t1"), t1("llo")), t1("hllo"));
        testGrammar(grammar, []);
    });

    describe('17. Join t1:hell. ⨝ t1:hello', function() {
        const grammar = Join(Seq(t1("hell"), Any("t1")), t1("hello"));
        testGrammar(grammar, [{t1: 'hello'}]);
    });

    describe('18. Join t1:hell. ⨝ t1:hell', function() {
        const grammar = Join(Seq(t1("hell"), Any("t1")), t1("hell"));
        testGrammar(grammar, []);
    });

    describe('19. Filter t1:hi [t1:.+t1:.]', function() {
        const grammar = Filter(t1("hi"), Seq(Any("t1"), Any("t1")));
        testGrammar(grammar, [{t1: 'hi'}]);
    });

    describe('20. Filter t1:hi+t2:hi [t1:.+t1:.+t2:.+t2.]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               Seq(Any("t1"), Any("t1"), Any("t2"), Any("t2")));
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('21. Filter t1:hi+t2:hi [t1:.+t2:.+t1:.+t2.]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               Seq(Any("t1"), Any("t2"), Any("t1"), Any("t2")));
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('22. Filter t1:hi+t2:hi [(t1:.+t2:.)+(t1:.+t2.)]', function() {
        const grammar = Filter(Seq(t1("hi"), t2("hi")),
                               Seq(Seq(Any("t1"), Any("t2")),
                                   Seq(Any("t1"), Any("t2"))));
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'hi'}
        ];
        testGrammar(grammar, expectedResults);
    });

});
