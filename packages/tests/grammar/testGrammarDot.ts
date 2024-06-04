import {
    Dot, Embed, Epsilon, Join,
    Rename, Seq, Uni, WithVocab,
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
		desc: '1. t1:hi + t1:.',
        grammar: Seq(t1("hi"), Dot("t1")),
        tapes: ["t1"],
        vocab: {t1: [...'hi']},
        results: [
            {t1: 'hih'},
            {t1: 'hii'},
        ],
    });

    testGrammar({
		desc: '2. t1:. + t1:hi',
        grammar: Seq(Dot("t1"), t1("hi")),
        tapes: ["t1"],
        results: [
            {t1: 'hhi'},
            {t1: 'ihi'},
        ],
    });

    testGrammar({
		desc: '3. Optional .: ε|t1:. (empty vocab)',
        grammar: Uni(Epsilon(), Dot("t1")),
        tapes: ["t1"],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '4. Optional .: ε|t1:. (vocab t1:h)',
        grammar: WithVocab({t1: 'h'},
                    Uni(Epsilon(), Dot("t1"))),
        tapes: ["t1"],
        results: [
            {},
            {t1: 'h'},
        ],
    });

    testGrammar({
		desc: '5. Join t1:h ⨝ t1:.',
        grammar: Join(t1("h"), Dot("t1")),
        tapes: ["t1"],
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
		desc: '6. Join t1:hello ⨝ t1:.ello',
        grammar: Join(t1("hello"), Seq(Dot("t1"), t1("ello"))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '7. Join t1:ello ⨝ t1:.ello',
        grammar: Join(t1("ello"), Seq(Dot("t1"), t1("ello"))),
        results: [
        ],
    });

    testGrammar({
		desc: '8. Join t1:hello ⨝ t1:h.llo',
        grammar: Join(t1("hello"), Seq(t1("h"), Dot("t1"), t1("llo"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '9. Join t1:hllo ⨝ t1:h.llo',
        grammar: Join(t1("hllo"), Seq(t1("h"), Dot("t1"), t1("llo"))),
        results: [
        ],
    });

    testGrammar({
		desc: '10. Join t1:hello ⨝ t1:hell.',
        grammar: Join(t1("hello"), Seq(t1("hell"), Dot("t1"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '11. Join t1:hell ⨝ t1:hell.',
        grammar: Join(t1("hell"), Seq(t1("hell"), Dot("t1"))),
        results: [
        ],
    });

    // The same tests but with the dot on the left side

    testGrammar({
		desc: '12. Join t1:. ⨝ t1:h',
        grammar: Join(Dot("t1"), t1("h")),
        results: [
            {t1: 'h'},
        ],
    });

    testGrammar({
		desc: '13. Join t1:.ello ⨝ t1:hello',
        grammar: Join(Seq(Dot("t1"), t1("ello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '14. Join t1:.ello ⨝ t1:ello',
        grammar: Join(Seq(Dot("t1"), t1("ello")), t1("ello")),
        results: [
        ],
    });

    testGrammar({
		desc: '15. Join t1:h.llo ⨝ t1:hello',
        grammar: Join(Seq(t1("h"), Dot("t1"), t1("llo")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '16. Join t1:h.llo ⨝ t1:hllo',
        grammar: Join(Seq(t1("h"), Dot("t1"), t1("llo")), t1("hllo")),
        results: [
        ],
    });

    testGrammar({
		desc: '17. Join t1:hell. ⨝ t1:hello',
        grammar: Join(Seq(t1("hell"), Dot("t1")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '18. Join t1:hell. ⨝ t1:hell',
        grammar: Join(Seq(t1("hell"), Dot("t1")), t1("hell")),
        results: [
        ],
    });

    testGrammar({
		desc: '19. t1:hi ⨝ [t1:.+t1:.]',
        grammar: Join(t1("hi"), Seq(Dot("t1"), Dot("t1"))),
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
		desc: '20. t1:hi+t2:hi ⨝ t1:.+t1:.+t2:.+t2.',
        grammar: Join(Seq(t1("hi"), t2("hi")),
                        Seq(Dot("t1"), Dot("t1"), Dot("t2"), Dot("t2"))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    });

    testGrammar({
		desc: '21. t1:hi+t2:hi ⨝ t1:.+t2:.+t1:.+t2.',
        grammar: Join(Seq(t1("hi"), t2("hi")),
                        Seq(Dot("t1"), Dot("t2"), Dot("t1"), Dot("t2"))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    });

    testGrammar({
		desc: '22. t1:hi+t2:hi ⨝ (t1:.+t2:.)+(t1:.+t2.)',
        grammar: Join(Seq(t1("hi"), t2("hi")),
                        Seq(Seq(Dot("t1"), Dot("t2")),
                            Seq(Dot("t1"), Dot("t2")))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    });

    testGrammar({
        desc: '23. Embedded dot',
        grammar: {
            "a": Seq(t1("hi"), Embed("b")),
            "b": Dot("t1")
        },
        symbol: "a",
        tapes: ["t1"],
        results: [
            {t1: "hih"},
            {t1: "hii"}
        ]
    });

    testGrammar({
        desc: '24a. Dot and a query',
        grammar: Seq(t1("hi"), Dot("t1")),
        tapes: ["t1"],
        query: { t1: "hip" },
        results: [
            {t1: "hip"}
        ]
    });
    
    testGrammar({
        desc: '24b. Embedded dot and a query',
        grammar: {
            "a": Seq(t1("hi"), Embed("b")),
            "b": Dot("t1")
        },
        symbol: "a",
        query: { t1: "hip" },
        tapes: ["t1"],
        results: [
            {t1: "hip"}
        ]
    });
    
    testGrammar({
		desc: '25. Rename t1>t2, t1:hi + t1:.',
        grammar: Rename(Seq(t1("hi"), Dot("t1")), "t1", "t2"),
        tapes: ["t2"],
        vocab: {t2: [...'hi']},
        results: [
            {t2: 'hih'},
            {t2: 'hii'},
        ],
    });
    
    testGrammar({
		desc: '26. t2:hi + (Rename t1>t2, t1:.)',
        grammar: Seq(t2("hi"), Rename(Dot("t1"), "t1", "t2")),
        tapes: ["t2"],
        vocab: {t2: [...'hi']},
        results: [
            {t2: 'hih'},
            {t2: 'hii'},
        ],
    });


});
