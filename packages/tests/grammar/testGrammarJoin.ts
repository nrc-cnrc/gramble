
import {
    Seq, Uni, Join, Epsilon, CharSet
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
		desc: '1. Join t1:hello ⨝ t1:hello',
        grammar: Join(t1("hello"), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '2. Join t1:hello+t1:world ⨝ t1:helloworld',
        grammar: Join(Seq(t1("hello"), t1("world")), t1("helloworld")),
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '3. Join t1:helloworld ⨝ t1:hello+t1:world',
        grammar: Join(t1("helloworld"), Seq(t1("hello"), t1("world"))),
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '4. Join t1:hello ⨝ t2:foo',
        grammar: Join(t1("hello"), t2("foo")),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: 'foo'},
        ],
    });

    testGrammar({
		desc: '5. Join ε ⨝ ε',
        grammar: Join(Epsilon(), Epsilon()),
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '6. Join t1:hello ⨝ ε',
        grammar: Join(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '7. Join ε ⨝ t1:hello',
        grammar: Join(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '8. Join t1:hello ⨝ t1:hello+t1:""',
        grammar: Join(t1("hello"), Seq(t1("hello"), t1(""))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '9. Join t1:hello ⨝ t1:""+t1:hello',
        grammar: Join(t1("hello"), Seq(t1(""), t1("hello"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '10. Join t1:""+t1:hello ⨝ t1:hello',
        grammar: Join(Seq(t1(""), t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '11. Join t1:hello+t1:"" ⨝ t1:hello',
        grammar: Join(Seq(t1("hello"), t1("")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '12. Join Seq(t1:hello) ⨝ t1:hello',
        grammar: Join(Seq(t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '13. Join t1:hello ⨝ Seq(t1:hello)',
        grammar: Join(t1("hello"), Seq(t1("hello"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '14. Join Uni(t1:hello) ⨝ t1:hello',
        grammar: Join(Uni(t1("hello")), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '15. Join t1:hello ⨝ Uni(t1:hello)',
        grammar: Join(t1("hello"), Uni(t1("hello"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '16. Join t1:hi ⨝ t1:hi+t2:bye',
        grammar: Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
        results: [
            {t1: 'hi', t2: 'bye'},
        ],
    });

    testGrammar({
		desc: '17. Join (t1:hi ⨝ t1:hi+t2:bye) ⨝ t2:bye+t3:yo',
        grammar: Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
                      Seq(t2("bye"), t3("yo"))),
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'},
        ],
    });

    testGrammar({
		desc: '18. Join t1:hello+t1:world ⨝ t1:hello+t1:world',
        grammar: Join(Seq(t1("hello"), t1("world")),
                      Seq(t1("hello"), t1("world"))),
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '19. Join t1:hi+t1:ki ⨝ t1:hi+t2:bi+t1:ki+t2:wo',
        grammar: Join(Seq(t1("hi"), t1("ki")),
                      Seq(t1("hi"), t2("bi"), t1("ki"), t2("wo"))),
        results: [
            {t1: "hiki", t2: "biwo"},
        ],
    });

    testGrammar({
		desc: '20. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t1:kitty)+(t2:goodbye+t2:world)',
        grammar: Join(Seq(t1("hello"), t1("kitty")),
                      Seq(Seq(t1("hello"), t1("kitty")),
                          Seq(t2("goodbye"), t2("world")))),
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld'},
        ],
    });

    testGrammar({
		desc: '21. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t2:goodbye)+(t1:kitty+t2:world)',
        grammar: Join(Seq(t1("hello"), t1("kitty")),
                      Seq(Seq(t1("hello"), t2("goodbye")),
                          Seq(t1("kitty"), t2("world")))),
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld'},
        ],
    });

    testGrammar({
		desc: '22. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t2:goodbye)+(t2:world+t1:kitty)',
        grammar: Join(Seq(t1("hello"), t1("kitty")),
                      Seq(Seq(t1("hello"), t2("goodbye")),
                          Seq(t2("world"), t1("kitty")))),
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld'},
        ],
    });

    testGrammar({
		desc: '23. Join t1:hello+t1:kitty ⨝ ' +
             '(t1:hello+t2:goodbye+t1:kitty)+t2:world)',
        grammar: Join(Seq(t1("hello"), t1("kitty")),
                      Seq(Seq(t1("hello"), t2("goodbye"), t1("kitty")),
                          t2("world"))),
        results: [
            {t1: 'hellokitty', t2: 'goodbyeworld'},
        ],
    });

    testGrammar({
		desc: '24. Join t1:hi|t1:yo ⨝ t1:hi+t2:bye',
        grammar: Join(Uni(t1("hi"), t1("yo")),
                      Seq(t1("hi"), t2("bye"))),
        results: [
            {t1: 'hi', t2: 'bye'},
        ],
    });

    testGrammar({
		desc: '25. Join t1:hi+t2:bye ⨝ t2:bye+t3:yo',
        grammar: Join(Seq(t1("hi"), t2("bye")),
                      Seq(t2("bye"), t3("yo"))),
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'},
        ],
    });

    testGrammar({
		desc: '26. Join t1:hi ⨝ (t1:hi+t2:bye ⨝ t2:bye+t3:yo)',
        grammar: Join(t1("hi"),
                      Join(Seq(t1("hi"), t2("bye")),
                           Seq(t2("bye"), t3("yo")))),
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'},
        ],
    });

    testGrammar({
		desc: '27. Seq (t1:hi ⨝ t1:hi+t2:bye) + t2:world',
        grammar: Seq(Join(t1("hi"),
                          Seq(t1("hi"), t2("bye"))),
                     t2("world")),
        results: [
            {t1: 'hi', t2: "byeworld"},
        ],
    });

    testGrammar({
		desc: '28. Join t1:hello ⨝ t1:hello+t1:world',
        grammar: Join(t1("hello"), Seq(t1("hello"), t1("world"))),
        results: [],
    });

    testGrammar({
		desc: '29. Join t1:hello ⨝ t1:helloworld',
        grammar: Join(t1("hello"), t1("helloworld")),
        results: [],
    });

    testGrammar({
		desc: '30. Join t1:helloworld ⨝ t1:hello',
        grammar: Join(t1("helloworld"), t1("hello")),
        results: [],
    });

    testGrammar({
		desc: '31. Join t1:hello+t1:world ⨝ t1:hello',
        grammar: Join(Seq(t1("hello"), t1("world")), t1("hello")),
        results: [],
    });

    testGrammar({
		desc: '32. Join t1:hi+t2:world ⨝ t1:hi+t2:world',
        grammar: Join(Seq(t1("hi"), t2("world")),
                      Seq(t1("hi"), t2("world"))),
        results: [
            {t1: 'hi', t2: 'world'},
        ],
    });

    testGrammar({
		desc: '33. Join t2:fo+t1:hi ⨝ t1:hi+t2:fo',
        grammar: Join(Seq(t2("fo"), t1("hi")),
                      Seq(t1("hi"), t2("fo"))),
        results: [
            {t1: 'hi', t2: 'fo'},
        ],
    });

    testGrammar({
		desc: '34. Join t1:hello ⨝ t1:hello+t2:foo',
        grammar: Join(t1("hello"), Seq(t1("hello"), t2("foo"))),
        results: [
            {t1: 'hello', t2: 'foo'},
        ],
    });

    testGrammar({
		desc: '35. Join t1:hello ⨝ t2:foo+t1:hello',
        grammar: Join(t1("hello"), Seq(t2("foo"),t1("hello"))),
        results: [
            {t1: 'hello', t2: 'foo'},
        ],
    });

    testGrammar({
		desc: '36. Join t1:hello+t2:foo ⨝ t1:hello',
        grammar: Join(Seq(t1("hello"), t2("foo")), t1("hello")),
        results: [
            {t1: 'hello', t2: 'foo'},
        ],
    });

    testGrammar({
		desc: '37. Join t2:foo+t1:hello ⨝ t1:hello',
        grammar: Join(Seq(t2("foo"), t1("hello")), t1("hello")),
        results: [
            {t1: 'hello', t2: 'foo'},
        ],
    });

    testGrammar({
		desc: '38. Join t1:hello+t2:foo ⨝ t1:hello+t2:bar',
        grammar: Join(Seq(t1("hello"), t2("foo")),
                      Seq(t1("hello"), t2("bar"))),
        results: [],
    });

    testGrammar({
		desc: '39. Join (t1:hello|t1:goodbye) ⨝ ' +
             '(t1:goodbye|t1:welcome)',
        grammar: Join(Uni(t1("hello"), t1("goodbye")),
                      Uni(t1("goodbye"), t1("welcome"))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '40. Join (t1:goodbye|t1:welcome) ⨝ ' +
             '(t1:hello|t1:goodbye)',
        grammar: Join(Uni(t1("goodbye"), t1("welcome")),
                      Uni(t1("hello"), t1("goodbye"))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '41. Nested joining, leftward: ' +
             '(t1:hello|t1:goodbye ⨝ t1:goodbye|t1:welcome) ⨝ ' +
             '(t1:yo|t1:goodbye)',
        grammar: Join(Join(Uni(t1("hello"), t1("goodbye")),
                           Uni(t1("goodbye"), t1("welcome"))),
                      Uni(t1("yo"), t1("goodbye"))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '42. Nested joining, rightward: (t1:yo|t1:goodbye) ⨝ ' +
             '(t1:hello|t1:goodbye ⨝ t1:goodbye|t1:welcome)',
        grammar: Join(Uni(t1("yo"), t1("goodbye")),
                      Join(Uni(t1("hello"), t1("goodbye")),
                           Uni(t1("goodbye"), t1("welcome")))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '43. Join t1:hello ⨝ (t1:hello ⨝ t1:hello)',
        grammar: Join(t1("hello"),
                      Join(t1("hello"), t1("hello"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '44. Join t1:goodbye ⨝ ' +
             '((t1:hello|t1:goodbye) ⨝ (t1:goodbye|t1:welcome))',
        grammar: Join(t1("goodbye"),
                      Join(Uni(t1("hello"), t1("goodbye")),
                           Uni(t1("goodbye"), t1("welcome")))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '45. Join t1:goodbye ⨝ ' +
             '((t1:goodbye|t1:welcome) ⨝ (t1:hello|t1:goodbye))',
        grammar: Join(t1("goodbye"),
                      Join(Uni(t1("goodbye"), t1("welcome")),
                           Uni(t1("hello"), t1("goodbye")))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '46. Join to nested join, leftward: t1:goodbye ⨝ ' +
             '((t1:hello|t1:goodbye ⨝ t1:goodbye|t1:welcome) ⨝ ' +
             't1:yo|t1:goodbye)',
        grammar: Join(t1("goodbye"),
                      Join(Join(Uni(t1("hello"), t1("goodbye")),
                                Uni(t1("goodbye"), t1("welcome"))),
                           Uni(t1("yo"), t1("goodbye")))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '47. Join to nested joining, rightward: ' +
             't1:goodbye ⨝ (t1:yo|t1:goodbye ⨝ ' +
             '(t1:hello|t1:goodbye ⨝ t1:goodbye|t1:welcome))',
        grammar: Join(t1("goodbye"),
                      Join(Uni(t1("yo"), t1("goodbye")),
                           Join(Uni(t1("hello"), t1("goodbye")),
                                Uni(t1("goodbye"), t1("welcome"))))),
        results: [
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '48. Join to a sequence of alternating sequences: ' +
             't1:hello ⨝ ' +
             'Seq((t1:hello+t2:hola)|(t1:goodbye+t2:adios))',
        grammar: Join(t1("hello"),
                      Seq(Uni(Seq(t1("hello"), t2("hola")),
                              Seq(t1("goodbye"), t2("adios"))))),
        results: [
            {t1: 'hello', t2: "hola"},
        ],
    });

    testGrammar({
		desc: '49. Join to a sequence of alternating sequences: ' +
             '(t1:hello+t2:adios) ⨝ ' +
             'seq((t1:hello+t2:hola)|(t1:goodbye+t2:adios))',
        grammar: Join(Seq(t1("hello"), t2("adios")),
                      Seq(Uni(Seq(t1("hello"),t2("hola")),
                              Seq(t1("goodbye"), t2("adios"))))),
        results: [],
    });

    testGrammar({
		desc: '50. Unfinished join: t1:h ⨝ t1:hello',
        grammar: Join(t1("h"), t1("hello")),
        results: [],
    });

    testGrammar({
		desc: '51. Unfinished join, opposite direction: ' +
             't1:hello ⨝ t1:h',
        grammar: Join(t1("hello"), t1("h")),
        results: [],
    });

    testGrammar({
		desc: '52. Unfinished join with t2: t1:h+t2:foo ⨝ t1:hello',
        grammar: Join(Seq(t1("h"), t2("foo")), t1("hello")),
        results: [],
    });

    testGrammar({
		desc: '53. Unfinished join with t2, other direction: ' +
             't1:hello ⨝ t1:h+t2:foo',
        grammar: Join(t1("hello"), Seq(t1("h"), t2("foo"))),
        results: [],
    });

    testGrammar({
		desc: '54. Identical join of t1:hello interrupted by t2 content: ' +
             't1:h+t2:foo+t1:ello ⨝ t1:hello',
        grammar: Join(Seq(t1("h"), t2("foo"), t1("ello")),
                      t1("hello")),
        results: [
            {t1: 'hello', t2: 'foo'},
        ]
    });

    testGrammar({
		desc: '55. t1:[hi] ⨝ t1:[hi]',
        grammar: Join(CharSet("t1", ["h", "i"]), 
                      CharSet("t1", ["h", "i"])),
        tapes: ["t1"],
        results: [
            {t1: "h"}, 
            {t1: "i"}, 
        ],
    });

    testGrammar({
		desc: '56. t1:[hi] ⨝ t1:[ij]',
        grammar: Join(CharSet("t1", ["h", "i"]), 
                      CharSet("t1", ["i", "j"])),
        tapes: ["t1"],
        results: [
            {t1: "i"}, 
        ],
    });

    testGrammar({
		desc: '57. t1:[chi] ⨝ t1:[hij]',
        grammar: Join(CharSet("t1", ["c", "h", "i"]), 
                      CharSet("t1", ["h", "i", "j"])),
        tapes: ["t1"],
        results: [
            {t1: "h"}, 
            {t1: "i"}, 
        ],
    });
    
});
