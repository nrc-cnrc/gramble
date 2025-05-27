import {
    CharSet, Epsilon, Null, Seq, Uni,
} from "../../interpreter/src/grammarConvenience.js";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
} from "./testGrammarUtil.js";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil.js";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging.js";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
		desc: '1. Literal t1:hello',
        grammar: t1("hello"),
        tapes: ["t1"],
        vocab: {t1: ["h","e","l","o"]},
        results: [
            {t1: 'hello'},
        ],
    });

    /*
    testGrammar({
		desc: '2. Literal t1:""',
        grammar: t1(""),
        tapes: ["t1"],
        vocab: {t1: 0},
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '3. Just ε',
        grammar: Epsilon(),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '4. Sequence t1:hello + t1:world',
        grammar: Seq(t1("hello"), t1("world")),
        tapes: ["t1"],
        vocab: {t1: [..."helowrld"]},
        results: [
            {t1: 'helloworld'},
        ]
    });

    testGrammar({
		desc: '5. Empty sequence',
        grammar: Seq(),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '6 Null',
        grammar: Null(),
        tapes: [],
        results: [],     
    });

    testGrammar({
		desc: '7a. Sequence of one ε',
        grammar: Seq(Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '7b. ε+ε',
        grammar: Seq(Epsilon(), Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '8. t1:hello + Seq()',
        grammar: Seq(t1("hello"), Seq()),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '9. Seq() + t1:hello',
        grammar: Seq(Seq(), t1("hello")),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '10. t1:hello + Seq(ε)',
        grammar: Seq(t1("hello"), Seq(Epsilon())),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });
    
    testGrammar({
		desc: '11. t1:hello + (ε+ε)',
        grammar: Seq(t1("hello"), Seq(Epsilon(), Epsilon())),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '12. Sequence t1:hello + t1:""',
        grammar: Seq(t1("hello"), t1("")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '13. Sequence t1:"" + t1:hello',
        grammar: Seq(t1(""), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '14. Sequence t1:hello + ε',
        grammar: Seq(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '15. Sequence ε + t1:hello',
        grammar: Seq(Epsilon(), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '16. Sequence t1:hello + ε + world',
        grammar: Seq(t1("hello"), Epsilon(), t1("world")),
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '17. Sequence t1:hello + ε + ε + world',
        grammar: Seq(t1("hello"), Epsilon(), Epsilon(), t1("world")),
        results: [
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '18. Sequence t1:ab + t1:cd + t1:ef',
        grammar: Seq(t1("ab"), t1("cd"), t1("ef")),
        results: [
            {t1: 'abcdef'},
        ],
    });

    testGrammar({
		desc: '19. Nested sequence (t1:ab + t1:cd) + t1:ef',
        grammar: Seq(Seq(t1("ab"), t1("cd")), t1("ef")),
        results: [
            {t1: 'abcdef'},
        ],
    });

    testGrammar({
		desc: '20. Nested sequence t1:ab + (t1:cd + t1:ef)',
        grammar: Seq(t1("ab"), Seq(t1("cd"), t1("ef"))),
        results: [
            {t1: 'abcdef'},
        ],
    });

    testGrammar({
		desc: '21. Nested sequence t1:ab + (t1:cd) + t1:ef',
        grammar: Seq(t1("ab"), Seq(t1("cd")), t1("ef")),
        results: [
            {t1: 'abcdef'},
        ],
    });

    testGrammar({
		desc: '22. t1:hi + t2:yo',
        grammar: Seq(t1("hi"), t2("yo")),
        tapes: ["t1", "t2"],
        vocab: {t1: [..."hi"], t2: [..."yo"]},
        results: [
            {t1: 'hi', t2: 'yo'},
        ],
    });

    testGrammar({
		desc: '23. t1:hi + t2:yo + t3:hey',
        grammar: Seq(t1("hi"), t2("yo"), t3("hey")),
        tapes: ["t1", "t2", "t3"],
        vocab: {t1: [..."hi"], t2: [..."yo"], t3: [..."hey"]},
        results: [
            {t1: 'hi', t2: 'yo', t3: 'hey'},
        ],
    });

    testGrammar({
		desc: '24. t1:hi + (t2:yo + t3:hey)',
        grammar: Seq(t1("hi"), Seq(t2("yo"), t3("hey"))),
        tapes: ["t1", "t2", "t3"],
        vocab: {t1: [..."hi"], t2: [..."yo"], t3: [..."hey"]},
        results: [
            {t1: 'hi', t2: 'yo', t3: 'hey'},
        ],
    });

    testGrammar({
		desc: '25. (t1:hi + t2:yo) + t3:hey',
        grammar: Seq(Seq(t1("hi"), t2("yo")), t3("hey")),
        tapes: ["t1", "t2", "t3"],
        vocab: {t1: [..."hi"], t2: [..."yo"], t3: [..."hey"]},
        results: [
            {t1: 'hi', t2: 'yo', t3: 'hey'},
        ],
    });

    testGrammar({
		desc: '26. Alt t1:hello | t1:goodbye',
        grammar: Uni(t1("hello"), t1("goodbye")),
        results: [
            {t1: 'hello'},
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '27. Alt t1:hello | ε',
        grammar: Uni(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
            {},
        ],
    });

    testGrammar({
		desc: '28. t1:hello + (t1:world | ε)',
        grammar: Seq(t1("hello"), Uni(t1("world"), Epsilon())),
        results: [
            {t1: 'hello'},
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '29. (t1:hello | ε) + t1:world',
        grammar: Seq(Uni(t1("hello"), Epsilon()), t1("world")),
        results: [
            {t1: 'world'},
            {t1: 'helloworld'},
        ],
    });

    testGrammar({
		desc: '30. Alt of different tapes: t1:hello | t2:goodbye',
        grammar: Uni(t1("hello"), t2("goodbye")),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello'},
            {t2: 'goodbye'},
        ],
    });

    testGrammar({
		desc: '31. Alt of sequences: (t1:hello+t2:kitty) | (t1:goodbye+t2:world)',
        grammar: Uni(Seq(t1("hello"), t2("kitty")),
                     Seq(t1("goodbye"), t2("world"))),
        results: [
            { t1: 'hello', t2: 'kitty' },
            { t1: 'goodbye', t2: 'world' },
        ],
    });

    testGrammar({
		desc: '32. Sequence with alt: (t1:hello | t1:goodbye) + t1:world',
        grammar: Seq(Uni(t1("hello"), t1("goodbye")), t1("world")),
        results: [
            {t1: 'helloworld'},
            {t1: 'goodbyeworld'},
        ],
    });

    testGrammar({
		desc: '33. Sequence with alt: t1:say + (t1:hello | t1:goodbye)',
        grammar: Seq(t1("say"), Uni(t1("hello"), t1("goodbye"))),
        results: [
            {t1: 'sayhello'},
            {t1: 'saygoodbye'},
        ],
    });

    testGrammar({
		desc: '34. Sequence with alt: (t1:hello | t1:goodbye) + (t1:world | t1:kitty)',
        grammar: Seq(Uni(t1("hello"), t1("goodbye")),
                     Uni(t1("world"), t1("kitty"))),
        results: [
            {t1: 'helloworld'},
            {t1: 'goodbyeworld'},
            {t1: 'hellokitty'},
            {t1: 'goodbyekitty'},
        ],
    });

    testGrammar({
		desc: '35. Empty union',
        grammar: Uni(),
        tapes: [],
        results: [
        ],
    });

    testGrammar({
		desc: '36. Union of one ε',
        grammar: Uni(Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '37. ε|ε',
        grammar: Uni(Epsilon(), Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '38. t1:hello + (ε|ε)',
        grammar: Seq(t1("hello"), Uni(Epsilon(), Epsilon())),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '39. t1:[hi]',
        grammar: CharSet("t1", ["h", "i"]),
        tapes: ["t1"],
        results: [
            {t1: 'h'},
            {t1: 'i'},
        ],
    });

    testGrammar({
		desc: '40. t1:[hi] + t1:[hi]',
        grammar: Seq(CharSet("t1", ["h", "i"]), 
                     CharSet("t1", ["h", "i"])),
        tapes: ["t1"],
        results: [
            {t1: 'hh'}, 
            {t1: 'hi'}, 
            {t1: 'ih'}, 
            {t1: 'ii'}
        ],
    });
    */
});
