import {
    Seq, Uni, Intersect, 
    Epsilon, Rep
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

interface Test extends GrammarTestAux {
    desc: string
}

const TESTS: Partial<Test>[] = [
    {
        desc:    "1. Intersect t1:hello & t1:hello",
        grammar: Intersect(t1("hello"), t1("hello")),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '2. Intersect t1:hello & t2:foo',
        grammar: Intersect(t1("hello"), t2("foo")),
        results: []
    },
    {
        desc:    '3. Intersect ε & ε',
        grammar: Intersect(Epsilon(), Epsilon()),
        results: [
            {},
        ]
    },
    {
        desc:    '4. Intersect t1:hello & ε',
        grammar: Intersect(t1("hello"), Epsilon()),
        results: []
    },
    {
        desc:    '5. Intersect ε & t1:hello',
        grammar: Intersect(Epsilon(), t1("hello")),
        results: []
    },
    {
        desc:    '6. Intersect ε & (t1:hello)*',
        grammar: Intersect(Epsilon(), Rep(t1("hello"))),
        results: [
            {},
        ]
    },
    {
        desc:    '7. Intersect t1:hello & t1:hello+t1:""',
        grammar: Intersect(t1("hello"), Seq(t1("hello"), t1(""))),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '8. Intersect t1:hello & t1:""+t1:hello',
        grammar: Intersect(t1("hello"), Seq(t1(""), t1("hello"))),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '9. Intersect t1:""+t1:hello & t1:hello',
        grammar: Intersect(Seq(t1(""), t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '10. Intersect t1:hello+t1:"" & t1:hello',
        grammar: Intersect(Seq(t1("hello"), t1("")), t1("hello")),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '11. Intersect t1:hello & t1:hello+ε',
        grammar: Intersect(t1("hello"), Seq(t1("hello"), Epsilon())),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '12. Intersect t1:hello & ε+t1:hello',
        grammar: Intersect(t1("hello"), Seq(Epsilon(), t1("hello"))),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '13. Intersect ε+t1:hello & t1:hello',
        grammar: Intersect(Seq(Epsilon(), t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '14. Intersect t1:hello+ε & t1:hello',
        grammar: Intersect(Seq(t1("hello"), Epsilon()), t1("hello")),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '15. Intersect Seq(t1:hello) & t1:hello',
        grammar: Intersect(Seq(t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '16. Intersect t1:hello & Seq(t1:hello)',
        grammar: Intersect(t1("hello"), Seq(t1("hello"))),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '17. Intersect Uni(t1:hello) & t1:hello',
        grammar: Intersect(Uni(t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    },
    {
        desc:    '18. Intersect t1:hello & Uni(t1:hello)',
        grammar: Intersect(t1("hello"), Uni(t1("hello"))),
        results: [
            {t1: 'hello'},
        ]
    },
    {
        desc:    '19. Intersect t1:hi & t1:hi+t2:bye',
        grammar: Intersect(t1("hi"), Seq(t1("hi"), t2("bye"))),
        results: []
    },
    {
        desc:    '20. Intersect t1:hi+t2:bye & t1:hi',
        grammar: Intersect(Seq(t1("hi"), t2("bye")), t1("hi")),
        results: []
    },
    {
        desc:    '21. Intersect t1:helloworld & t1:hello+t1:world',
        grammar: Intersect(t1("helloworld"),
                           Seq(t1("hello"), t1("world"))),
        results: [
            {t1: 'helloworld'},
        ]
    },
    {
        desc:    '22. Intersect t1:hello+t1:world & t1:helloworld',
        grammar: Intersect(Seq(t1("hello"), t1("world")),
                           t1("helloworld")),
        results: [
            {t1: 'helloworld'},
        ]
    },
    {
        desc:    '23. Intersect t1:hello+t1:world & t1:hello+t1:world',
        grammar: Intersect(Seq(t1("hello"), t1("world")),
                           Seq(t1("hello"), t1("world"))),
        results: [
            {t1: 'helloworld'},
        ]
    },
    {
        desc:    '24. Intersect (t1:hi|t1:bye) & (t1:hi|t1:yo)',
        grammar: Intersect(Uni(t1("hi"), t1("bye")), Uni(t1("hi"), t1("yo"))),
        results: [
            {t1: 'hi'},
        ]
    },
    {
        desc:    '25. Intersect (t1:hi|t1:bye|t1:yo) & (t1:hi|t1:yo|t1:foo)',
        grammar: Intersect(Uni(t1("hi"), t1("bye"), t1("yo")),
                           Uni(t1("hi"), t1("yo"), t1("foo"))),
        results: [
            {t1: 'hi'},
            {t1: 'yo'},
        ]
    },
    {
        desc:    '26. Intersect (t1:hi|t2:bye) & (t1:hi|t2:yo)',
        grammar: Intersect(Uni(t1("hi"), t1("bye")), Uni(t1("hi"), t1("yo"))),
        results: [
            {t1: 'hi'},
        ]
    },
    {
        desc:    '27. Intersect t1:hello & t1:helloworld',
        grammar: Intersect(t1("hello"), t1("helloworld")),
        results: []
    },
    {
        desc:    '28. Intersect t1:helloworld & t1:hello',
        grammar: Intersect(t1("helloworld"), t1("hello")),
        results: []
    },
    {
        desc:    '29. Intersect t1:hello & t1:hello+t1:world',
        grammar: Intersect(t1("hello"), Seq(t1("hello"), t1("world"))),
        results: []
    },
    {
        desc:    '30. Intersect t1:hello+t1:world & t1:hello',
        grammar: Intersect(Seq(t1("hello"), t1("world")), t1("hello")),
        results: []
    },
    {
        desc:    '31. Intersect t1:hi+t2:fo & t1:hi+t2:fo',
        grammar: Intersect(Seq(t1("hi"), t2("fo")), Seq(t1("hi"), t2("fo"))),
        results: [
            {t1: 'hi', t2: 'fo'},
        ]
    },
    {
        desc:   '32. Intersect t2:fo+t1:hi & t1:hi+t2:fo',
        grammar: Intersect(Seq(t2("fo"), t1("hi")), Seq(t1("hi"), t2("fo"))),
        results: [
            {t1: 'hi', t2: 'fo'},
        ]
    },
    {
        desc:    '33. Intersect t1:hello & t1:hello+t2:foo',
        grammar: Intersect(t1("hello"), Seq(t1("hello"), t2("foo"))),
        results: []
    },
    {
        desc:    '34. Intersect t1:hello+t2:foo & t1:hello',
        grammar: Intersect(Seq(t1("hello"), t2("foo")), t1("hello")),
        results: []
    },
    {
        desc:    '35. Intersect t1:hello & t2:foo+t1:hello',
        grammar: Intersect(t1("hello"), Seq(t2("foo"), t1("hello"))),
        results: []
    },
    {
        desc:    '36. Intersect t2:foo+t1:hello & t1:hello',
        grammar: Intersect(Seq(t2("foo"), t1("hello")), t1("hello")),
        results: []
    },
    {
        desc:    '37. Intersect t1:hello+t2:foo & t1:hello+t2:bar',
        grammar: Intersect(Seq(t1("hello"), t2("foo")),
                           Seq(t1("hello"), t2("bar"))),
        results: []
    },
    {
        desc:    '38. Nested intersection, right-branching: ' +
                 't1:hi & (t1:hi & t1:hi)',
        grammar: Intersect(t1("hi"), Intersect(t1("hi"), t1("hi"))),
        results: [
            {t1: 'hi'},
        ]
    },
    {
        desc:    '39. Nested intersection, left-branching: ' +
                 '(t1:hi & t1:hi) & t1:hi',
        grammar: Intersect(Intersect(t1("hi"), t1("hi")), t1("hi")),
        results: [
            {t1: 'hi'},
        ]
    },
    {
        desc:    '40. Failed nested intersection, right-branching, v1: ' +
                 't1:bye & (t1:hi & t1:hi)',
        grammar: Intersect(t1("bye"), Intersect(t1("hi"), t1("hi"))),
        results: []
    },
    {
        desc:    '41. Failed nested intersection, right-branching, v2: ' +
                 't1:hi & (t1:bye & t1:hi)',
        grammar: Intersect(t1("hi"), Intersect(t1("bye"), t1("hi"))),
        results: []
    },
    {
        desc:    '42. Failed nested intersection, right-branching, v3: ' +
                 '(t1:hi+t2:bye) & (t1:hi & t1:hi)',
        grammar: Intersect(Seq(t1("hi"), t2("bye")),
                           Intersect(t1("hi"), t1("hi"))),
        results: []
    },
    {
        desc:    '43. Failed nested intersection, right-branching, v4: ' +
                 't1:hi & ((t1:hi+t2:bye) & t1:hi)',
        grammar: Intersect(t1("hi"),
                           Intersect(Seq(t1("hi"), t2("bye")), t1("hi"))),
        results: []
    },
    {
        desc:    '44. Failed nested intersection, left-branching, v1: ' +
                 '(t1:hi & t1:hi) & t1:bye',
        grammar: Intersect(Intersect(t1("hi"), t1("hi")), t1("bye")),
        results: []
    },
    {
        desc:    '45. Failed nested intersection, left-branching, v2: ' +
                 '(t1:bye & t1:hi) & t1:hi',
        grammar: Intersect(Intersect(t1("bye"), t1("hi")), t1("hi")),
        results: []
    },
    {
        desc:    '46. Failed nested intersection, left-branching, v3: ' +
                 '(t1:hi & t1:hi) & (t1:hi+t2:bye)',
        grammar: Intersect(Intersect(t1("hi"), t1("hi")),
                           Seq(t1("hi"), t2("bye"))),
        results: []
    },
    {
        desc:    '47. Failed nested intersection, left-branching, v4: ' +
                 '((t1:hi+t2:bye) & t1:hi) & t1:hi',
        grammar: Intersect(Intersect(Seq(t1("hi"), t2("bye")), t1("hi")),
                           t1("hi")),
        results: []
    },
    {
        desc:    '48. Intersect with an alt of different tapes: ' +
                 't1:hello & (t1:hello | t2:foo)',
        grammar: Intersect(t1("hello"), Uni(t1("hello"), t2("foo"))),
        results: [
            {t1:'hello'},
        ]
    },
    {
        desc:    '49. Intersect different-tape alts in same direction: ' +
                 '(t1:hello|t2:foo) & (t1:hello|t2:foo)',
        grammar: Intersect(Uni(t1("hello"), t2("foo")),
                           Uni(t1("hello"), t2("foo"))),
        results: [
            {t1: 'hello'},
            {t2: 'foo'},
        ]
    },
    {
        desc:    '50. Intersect different-tape alts in different directions: ' +
                 '(t2:foo|t1:hello) & (t1:hello|t2:foo)',
        grammar: Intersect(Uni(t2("foo"), t1("hello")),
                           Uni(t1("hello"), t2("foo"))),
        results: [
            {t1: 'hello'},
            {t2: "foo"},
        ]
    },
    {
        desc:    '51. Unfinished intersection: t1:h & t1:hello',
        grammar: Intersect(t1("h"), t1("hello")),
        results: []
    },
    {
        desc:    '52. Unfinished intersection, opposite direction: ' +
                 't1:hello & t1:h',
        grammar: Intersect(t1("hello"), t1("h")),
        results: []
    },
    {
        desc:    '53. Unfinished intersection with t2: ' +
                 '(t1:h+t2:foo) & (t1:hello+t2:foo)',
        grammar: Intersect(Seq(t1("h"), t2("foo")),
                           Seq(t1("hello"), t2("foo"))),
        results: []
    },
    {
        desc:    '54. Unfinished intersection with t2, other direction: ' +
                 '(t2:foo+t1:hello) & (t1:h+t2:foo)',
        grammar: Intersect(Seq(t2("foo"), t1("hello")),
                           Seq(t1("h"), t2("foo"))),
        results: []
    },
    {
        desc:    '55. Identical intersection of t1:hello interrupted ' +
                 'by t2 content: (t1:h+t2:foo+t1:ello) & (t1:hello+t2:foo)',
        grammar: Intersect(Seq(t1("h"), t2("foo"), t1("ello")),
                           Seq(t1("hello"), t2("foo"))),
        results: [
            {t1: 'hello', t2: 'foo'},
        ]
    },
];

describe(`${grammarTestSuiteName(module)}`, function() {
    logTestSuite(this.title);

    for (const tst of TESTS) {
        if (tst["desc"] === undefined || tst["desc"].trim().length == 0) {
            continue;
        }
        describe(tst["desc"], test(tst));
    }
});
