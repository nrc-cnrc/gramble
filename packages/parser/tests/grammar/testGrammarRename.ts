import { 
    Rename, 
    Seq, 
    Join, 
    Uni, 
    Collection,
    Embed,
    Intersect,
    Rep,
    Any,
    Epsilon,
    Null
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3, t4, t5,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. Rename t1>t2, t1:hello',
        grammar: Rename(t1("hello"), "t1", "t2"),
        tapes: ['t2'],
        // vocab: {t2: 4}},
        results: [
            {t2: "hello"},
        ],
    });

    testGrammar({
        desc: '2. t1:hello + (Rename t1>t2, t1:world)',
        grammar: Seq(t1("hello"), Rename(t1("world"), "t1", "t2")),
        tapes: ['t1', 't2'],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });

    testGrammar({
        desc: '3. Rename t1>t1, t1:hello',
        grammar: Rename(t1("hello"), "t1", "t1"),
        tapes: ['t1'],
        results: [
            {t1: "hello"},
        ],
    });

    testGrammar({
        desc: '4. Rename t1>t2, ε',
        grammar: Rename(Epsilon(), "t1", "t2"),
        tapes: [],
        results: [
            {},
        ],
        numErrors: 1
    });

    testGrammar({
        desc: '5. Rename t1>t2, ∅',
        grammar: Rename(Null(), "t1", "t2"),
        tapes: [],
        results: [],
        numErrors: 1
    });

    testGrammar({
        desc: '6. Rename t1>t2, t1:""',
        grammar: Rename(t1(""), "t1", "t2"),
        tapes: ['t2'],
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '7. Rename t1>t2, t1:hi + t2:wo',
        grammar: Rename(Seq(t1("hi"), t2("wo")), "t1", "t2"),
        tapes: ['t2'],
        results: [
            {t2: "hi"},
        ],
        numErrors: 1
    });

    testGrammar({
        desc: '8. Rename t3>t4, t1:hello + t2:foo',
        grammar: Rename(Seq(t1("hello"), t2("foo")), "t3", "t4"),
        tapes: ['t1', 't2'],
        results: [
            {t1: "hello", t2: "foo"},
        ],
        numErrors: 1
    });

    testGrammar({
        desc: '9. Rename t1>t2, t1:hello + t5:foo',
        grammar: Rename(Seq(t1("hello"), t5("foo")), "t1", "t2"),
        tapes: ['t2', 't5'],
        // vocab: {t2:4, t5:2},
        results: [
            {t2: "hello", t5: "foo"},
        ],
    });

    testGrammar({
        desc: '10. (Rename t1>t2, t1:hello + t5:foo) | ' +
              '(Rename t1>t3, t1:hello + t5:foo)',
        grammar: Uni(Rename(Seq(t1("hello"), t5("foo")), "t1", "t2"),
                     Rename(Seq(t1("hello"), t5("foo")), "t1", "t3")),
        tapes: ['t2', 't3', 't5'],
        // vocab: {t2:4, t3:4, t5:2},
        results: [
            {t2: "hello", t5: "foo"},
            {t3: "hello", t5: "foo"},
        ],
    });

    testGrammar({
        desc: '11. Intersect t2:hello & Rename t1>t2, t1:hello',
        grammar: Intersect(t2("hello"),
                           Rename(t1("hello"), "t1", "t2")),
        results: [
            {t2: "hello"},
        ],
    });

    testGrammar({
        desc: '12. Intersect t2:hello & Rename t2>t1, t2:hello',
        grammar: Intersect(t2("hello"),
                           Rename(t2("hello"), "t2", "t1")),
        results: [],
    });

    testGrammar({
        desc: '13. Intersect (Rename t1>t2, t1:hello) & t2:hello',
        grammar: Intersect(Rename(t1("hello"), "t1", "t2"),
                           t2("hello")),
        results: [
            {t2: "hello"},
        ],
    });

    testGrammar({
        desc: '14. Intersect (Rename t2>t1, t2:hello) & t2:hello',
        grammar: Intersect(Rename(t2("hello"), "t2", "t1"),
                           t2("hello")),
        results: [],
    });

    testGrammar({
        desc: '15. Intersect (t2:hello + t1:.*) & Rename t2>t1, t2:hello',
        grammar: Intersect(Seq(t2("hello"), Rep(Any("t1"))),
                           Rename(t2("hello"), "t2", "t1")),
        results: [],
    });

    testGrammar({
        desc: '16. Join t2:hello ⨝ Rename t1>t2, t1:hello',
        grammar: Join(t2("hello"),
                      Rename(t1("hello"), "t1", "t2")),
        results: [
            {t2: "hello"},
        ],
    });

    testGrammar({
        desc: '17. Join (Rename t1>t2, t1:hello) ⨝ t2:hello',
        grammar: Join(Rename(t1("hello"), "t1", "t2"),
                      t2("hello")),
        results: [
            {t2: "hello"},
        ],
    });

    testGrammar({
        desc: '18. Join (Rename t1>t2, t1:hello + t3:foo) ⨝ t2:hello',
        grammar: Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                      t2("hello")),
        results: [
            {t2: "hello", t3: "foo"},
        ],
    });

    testGrammar({
        desc: '19. Join t2:hello ⨝ (Rename t1>t2, t1:hello + t3:foo)',
        grammar: Join(t2("hello"),
                      Rename(Seq(t1("hello"), t3("foo")), "t1", "t2")),
        results: [
            {t2: "hello", t3: "foo"},
        ],
    });

    testGrammar({
        desc: '20. Join t3:foo ⨝ (Rename t1>t2 of t1:hello + t3:foo)',
        grammar: Join(t3("foo"),
                      Rename(Seq(t1("hello"), t3("foo")), "t1", "t2")),
        results: [
            {t2: "hello", t3: "foo"},
        ],
    });

    testGrammar({
        desc: '21. Join (Rename t1>t2, t1:hello + t3:foo) ⨝ (t2:hello + t3:bar)',
        grammar: Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                      Seq(t2("hello"), t3("bar"))),
        results: [],
    });

    testGrammar({
        desc: '22. Join (t2:hello + t3:bar) ⨝ (Rename t1>t2, t1:hello + t3:foo)',
        grammar: Join(Seq(t2("hello"), t3("bar")),
                      Rename(Seq(t1("hello"), t3("foo")), "t1", "t2")),
        results: [],
    });


    testGrammar({
        desc: '23. Rename t2>t3 of symbol t1:hi+t2:world)',
        grammar: Collection({ 
                     a: Seq(t1("hi"), t2("world")),
                     default: Rename(Embed("a"), "t2", "t3") 
                 }),
        tapes: ['t1', 't3'],
        results: [
            {t1: "hi", t3: "world"},
        ],
    });

    testGrammar({
        desc: 'E1. Rename t3>t4 of symbol t1:hi+t2:world)',
        grammar: Collection({ 
                     a: Seq(t1("hi"), t2("world")),
                     default: Rename(Embed("a"), "t3", "t4") 
                 }),
        tapes: ['t1', 't2'],
        results: [
            {t1: "hi", t2: "world"},
        ],
        numErrors: 1
    });


    testGrammar({
        desc: 'E2a. Union with an erroneous rename and an embed of epsilon',
        grammar: Collection({
            "X": Rename(Seq(Embed("Y"), t1("a"), t2("b")), "t1", "t2"),
            "Y": Epsilon(),
            "Z": Uni(Embed("X"), Embed("Y"))
        }),
        symbol: "Z",
        numErrors: 1,
        tapes: ["t2", ".ERRt2"],
        stripHidden: false,
        results: [
            { t2: 'a', '.ERRt2': 'b' } 
        ],
    });
    
    testGrammar({
        desc: 'E2b. Union with an erroneous rename and a nontrivial embed',
        grammar: Collection({
            "X": Rename(Seq(Embed("Y"), t1("a"), t2("b")), "t1", "t2"),
            "Y": t3("c"),
            "Z": Uni(Embed("X"), Embed("Y"))
        }),
        symbol: "Z",
        numErrors: 1,
        tapes: ["t2", "t3", ".ERRt2"],
        stripHidden: false,
        results: [
            { t2: 'a', '.ERRt2': 'b', t3: 'c' } 
        ],
    });

    
    testGrammar({
        desc: 'E3a. Join to an erroneous rename and an embed of epsilon',
        grammar: Collection({
            "X": Rename(Seq(Embed("Y"), t1("a"), t2("b")), "t1", "t2"),
            "Y": Epsilon(),
            "Z": Join(Embed("X"), Embed("Y"))
        }),
        symbol: "Z",
        numErrors: 1,
        tapes: ["t2", ".ERRt2"],
        stripHidden: false,
        results: [
            { t2: 'a', '.ERRt2': 'b' } 
        ],
    });
    
    testGrammar({
        desc: 'E3b. Join to an erroneous rename and a nontrivial embed',
        grammar: Collection({
            "X": Rename(Seq(Embed("Y"), t1("a"), t2("b")), "t1", "t2"),
            "Y": t3("c"),
            "Z": Join(Embed("X"), Embed("Y"))
        }),
        symbol: "Z",
        numErrors: 1,
        tapes: ["t2", "t3", ".ERRt2"],
        stripHidden: false,
        results: [
            { t2: 'a', '.ERRt2': 'b', t3: 'c' } 
        ],
    });
    
    /*
    describe('Rename + embed bug encountered in implementing templates', function() {
        const symbolTable = makeTestNamespace({ "s": Seq(t2("hi"), t3("hello"), t4("goodbye")) });
        const grammar = Uni(Rename(Seq(Emb("s", symbolTable), t5("foo")), "t2", "t1"),
                            Rename(Seq(Emb("s", symbolTable), t5("foo")), "t3", "t1"),
                            Rename(Seq(Emb("s", symbolTable), t5("foo")), "t4", "t1"));
        testAstHasTapes(grammar, ["t1", "t2", "t3", "t4", "t5"]);
        //testHasVocab(grammar, {"t1": 9, "t2": 2, "t3": 4, "t4": 6, "t5": 2});
        const expectedResults: StringDict[] = [
            {t1: "hi", t3: "hello", t4: "goodbye", t5: "foo"}, 
            {t2: "hi", t1: "hello", t4: "goodbye", t5: "foo"},
            {t2: "hi", t3: "hello", t1: "goodbye", t5 :"foo"}
        ];
        testAst(grammar, expectedResults);
    });
    */

});
