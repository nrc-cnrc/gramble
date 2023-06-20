import {
    Any, Epsilon, Filter, Join, Seq, Uni, Vocab,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    // describe('1. t1:hi + t1:.', function() {
    //     const grammar = Seq(t1("hi"), Any("t1"));
    //     testHasTapes(grammar, ["t1"]);
    //     testHasVocab(grammar, {t1: 2});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'hih'},
    //         {t1: 'hii'},
    //     ];
    //     testGenerate(grammar, expectedResults);
    // });

    describe('1. t1:hi + t1:.', test({
        grammar: Seq(t1("hi"), Any("t1")),
        tapes: ["t1"],
        vocab: {t1: 2},
        results: [
            {t1: 'hih'},
            {t1: 'hii'},
        ],
    }));

    // describe('2. t1:. + t1:hi', function() {
    //     const grammar = Seq(Any("t1"), t1("hi"));
    //     testHasTapes(grammar, ["t1"]);
    //     const expectedResults: StringDict[] = [
    //         {t1: 'hhi'},
    //         {t1: 'ihi'},
    //     ];
    //     testGenerate(grammar, expectedResults);
    // });

    describe('2. t1:. + t1:hi', test({
        grammar: Seq(Any("t1"), t1("hi")),
        tapes: ["t1"],
        results: [
            {t1: 'hhi'},
            {t1: 'ihi'},
        ],
    }));

    // describe('3. Optional .: ε|t1:. (empty vocab)', function() {
    //     const grammar = Uni(Epsilon(), Any("t1"));
    //     testHasTapes(grammar, ["t1"]);
    //     testGenerate(grammar, [{}]);
    // });

    describe('3. Optional .: ε|t1:. (empty vocab)', test({
        grammar: Uni(Epsilon(), Any("t1")),
        tapes: ["t1"],
        results: [
            {},
        ],
    }));

    // describe('4. Optional .: ε|t1:. (vocab t1:h)', function() {
    //     const grammar = Seq(Vocab({t1: 'h'}),
    //                         Uni(Epsilon(), Any("t1")));
    //     testHasTapes(grammar, ["t1"]);
    //     const expectedResults: StringDict[] = [
    //         {},
    //         {t1: 'h'},
    //     ];
    //     testGenerate(grammar, expectedResults);
    // });

    describe('4. Optional .: ε|t1:. (vocab t1:h)', test({
        grammar: Seq(Vocab({t1: 'h'}),
                     Uni(Epsilon(), Any("t1"))),
        tapes: ["t1"],
        results: [
            {},
            {t1: 'h'},
        ],
    }));

    // describe('5. Join t1:h ⨝ t1:.', function() {
    //     const grammar = Join(t1("h"), Any("t1"));
    //     testHasTapes(grammar, ["t1"]);
    //     testGenerate(grammar, [{t1: 'h'}]);
    // });

    describe('5. Join t1:h ⨝ t1:.', test({
        grammar: Join(t1("h"), Any("t1")),
        tapes: ["t1"],
        results: [
            {t1: 'h'},
        ],
    }));

    // describe('6. Join t1:hello ⨝ t1:.ello', function() {
    //     const grammar = Join(t1("hello"), Seq(Any("t1"), t1("ello")));
    //     testHasTapes(grammar, ["t1"]);
    //     testGenerate(grammar, [{t1: 'hello'}]);
    // });

    describe('6. Join t1:hello ⨝ t1:.ello', test({
        grammar: Join(t1("hello"), Seq(Any("t1"), t1("ello"))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    // describe('7. Join t1:ello ⨝ t1:.ello', function() {
    //     const grammar = Join(t1("ello"), Seq(Any("t1"), t1("ello")));
    //     testGenerate(grammar, []);
    // });

    describe('7. Join t1:ello ⨝ t1:.ello', test({
        grammar: Join(t1("ello"), Seq(Any("t1"), t1("ello"))),
        results: [
        ],
    }));

    // describe('8. Join t1:hello ⨝ t1:h.llo', function() {
    //     const grammar = Join(t1("hello"), Seq(t1("h"), Any("t1"), t1("llo")));
    //     testGenerate(grammar, [{t1: 'hello'}]);
    // });

    describe('8. Join t1:hello ⨝ t1:h.llo', test({
        grammar: Join(t1("hello"), Seq(t1("h"), Any("t1"), t1("llo"))),
        results: [
            {t1: 'hello'},
        ],
    }));

    // describe('9. Join t1:hllo ⨝ t1:h.llo', function() {
    //     const grammar = Join(t1("hllo"), Seq(t1("h"), Any("t1"), t1("llo")));
    //     testGenerate(grammar, []);
    // });

    describe('9. Join t1:hllo ⨝ t1:h.llo', test({
        grammar: Join(t1("hllo"), Seq(t1("h"), Any("t1"), t1("llo"))),
        results: [
        ],
    }));

    // describe('10. Join t1:hello ⨝ t1:hell.', function() {
    //     const grammar = Join(t1("hello"), Seq(t1("hell"), Any("t1")));
    //     testGenerate(grammar, [{t1: 'hello'}]);
    // });

    describe('10. Join t1:hello ⨝ t1:hell.', test({
        grammar: Join(t1("hello"), Seq(t1("hell"), Any("t1"))),
        results: [
            {t1: 'hello'},
        ],
    }));

    // describe('11. Join t1:hell ⨝ t1:hell.', function() {
    //     const grammar = Join(t1("hell"), Seq(t1("hell"), Any("t1")));
    //     testGenerate(grammar, []);
    // });

    describe('11. Join t1:hell ⨝ t1:hell.', test({
        grammar: Join(t1("hell"), Seq(t1("hell"), Any("t1"))),
        results: [
        ],
    }));

    // The same tests but with the dot on the left side

    // describe('12. Join t1:. ⨝ t1:h', function() {
    //     const grammar = Join(Any("t1"), t1("h"));
    //     testHasVocab(grammar, {t1: 1});
    //     testGenerate(grammar, [{t1: 'h'}]);
    // });

    describe('12. Join t1:. ⨝ t1:h', test({
        grammar: Join(Any("t1"), t1("h")),
        results: [
            {t1: 'h'},
        ],
    }));

    // describe('13. Join t1:.ello ⨝ t1:hello', function() {
    //     const grammar = Join(Seq(Any("t1"), t1("ello")), t1("hello"));
    //     testGenerate(grammar, [{t1: 'hello'}]);
    // });

    describe('13. Join t1:.ello ⨝ t1:hello', test({
        grammar: Join(Seq(Any("t1"), t1("ello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    }));

    // describe('14. Join t1:.ello ⨝ t1:ello', function() {
    //     const grammar = Join(Seq(Any("t1"), t1("ello")), t1("ello"));
    //     testGenerate(grammar, []);
    // });

    describe('14. Join t1:.ello ⨝ t1:ello', test({
        grammar: Join(Seq(Any("t1"), t1("ello")), t1("ello")),
        results: [
        ],
    }));

    // describe('15. Join t1:h.llo ⨝ t1:hello', function() {
    //     const grammar = Join(Seq(t1("h"), Any("t1"), t1("llo")), t1("hello"));
    //     testGenerate(grammar, [{t1: 'hello'}]);
    // });

    describe('15. Join t1:h.llo ⨝ t1:hello', test({
        grammar: Join(Seq(t1("h"), Any("t1"), t1("llo")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    }));

    // describe('16. Join t1:h.llo ⨝ t1:hllo', function() {
    //     const grammar = Join(Seq(t1("h"), Any("t1"), t1("llo")), t1("hllo"));
    //     testGenerate(grammar, []);
    // });

    describe('16. Join t1:h.llo ⨝ t1:hllo', test({
        grammar: Join(Seq(t1("h"), Any("t1"), t1("llo")), t1("hllo")),
        results: [
        ],
    }));

    // describe('17. Join t1:hell. ⨝ t1:hello', function() {
    //     const grammar = Join(Seq(t1("hell"), Any("t1")), t1("hello"));
    //     testGenerate(grammar, [{t1: 'hello'}]);
    // });

    describe('17. Join t1:hell. ⨝ t1:hello', test({
        grammar: Join(Seq(t1("hell"), Any("t1")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    }));

    // describe('18. Join t1:hell. ⨝ t1:hell', function() {
    //     const grammar = Join(Seq(t1("hell"), Any("t1")), t1("hell"));
    //     testGenerate(grammar, []);
    // });

    describe('18. Join t1:hell. ⨝ t1:hell', test({
        grammar: Join(Seq(t1("hell"), Any("t1")), t1("hell")),
        results: [
        ],
    }));

    // describe('19. Filter t1:hi [t1:.+t1:.]', function() {
    //     const grammar = Filter(t1("hi"), Seq(Any("t1"), Any("t1")));
    //     testGenerate(grammar, [{t1: 'hi'}]);
    // });

    describe('19. Filter t1:hi [t1:.+t1:.]', test({
        grammar: Filter(t1("hi"), Seq(Any("t1"), Any("t1"))),
        results: [
            {t1: 'hi'},
        ],
    }));

    // describe('20. Filter t1:hi+t2:hi [t1:.+t1:.+t2:.+t2.]', function() {
    //     const grammar = Filter(Seq(t1("hi"), t2("hi")),
    //                            Seq(Any("t1"), Any("t1"), Any("t2"), Any("t2")));
    //     const expectedResults: StringDict[] = [
    //         {t1: 'hi', t2: 'hi'}
    //     ];
    //     testGenerate(grammar, expectedResults);
    // });

    describe('20. Filter t1:hi+t2:hi [t1:.+t1:.+t2:.+t2.]', test({
        grammar: Filter(Seq(t1("hi"), t2("hi")),
                        Seq(Any("t1"), Any("t1"), Any("t2"), Any("t2"))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    }));

    // describe('21. Filter t1:hi+t2:hi [t1:.+t2:.+t1:.+t2.]', function() {
    //     const grammar = Filter(Seq(t1("hi"), t2("hi")),
    //                            Seq(Any("t1"), Any("t2"), Any("t1"), Any("t2")));
    //     const expectedResults: StringDict[] = [
    //         {t1: 'hi', t2: 'hi'}
    //     ];
    //     testGenerate(grammar, expectedResults);
    // });

    describe('21. Filter t1:hi+t2:hi [t1:.+t2:.+t1:.+t2.]', test({
        grammar: Filter(Seq(t1("hi"), t2("hi")),
                        Seq(Any("t1"), Any("t2"), Any("t1"), Any("t2"))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    }));

    // describe('22. Filter t1:hi+t2:hi [(t1:.+t2:.)+(t1:.+t2.)]', function() {
    //     const grammar = Filter(Seq(t1("hi"), t2("hi")),
    //                            Seq(Seq(Any("t1"), Any("t2")),
    //                                Seq(Any("t1"), Any("t2"))));
    //     const expectedResults: StringDict[] = [
    //         {t1: 'hi', t2: 'hi'}
    //     ];
    //     testGenerate(grammar, expectedResults);
    // });

    describe('22. Filter t1:hi+t2:hi [(t1:.+t2:.)+(t1:.+t2.)]', test({
        grammar: Filter(Seq(t1("hi"), t2("hi")),
                        Seq(Seq(Any("t1"), Any("t2")),
                            Seq(Any("t1"), Any("t2")))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    }));

});
