import {
    CharSet, Epsilon, Null, Seq, Uni,
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2, t3,
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

    describe('1. Literal t1:hello', test({
        grammar: t1("hello"),
        tapes: ["t1"],
        vocab: {t1: ["h","e","l","o"]},
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('2. Literal t1:""', test({
        grammar: t1(""),
        tapes: ["t1"],
        //vocab: {t1: 0},
        results: [
            {},
        ],
    }));

    describe('3. Just ε', test({
        grammar: Epsilon(),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('4. Sequence t1:hello + t1:world', test({
        grammar: Seq(t1("hello"), t1("world")),
        tapes: ["t1"],
        // vocab: {t1: 7},
        results: [
            {t1: 'helloworld'},
        ]
    }));

    describe('5. Empty sequence', test({
        grammar: Seq(),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('6 Null', test({
        grammar: Null(),
        tapes: [],
        results: [],     
    }));

    describe('7a. Sequence of one ε', test({
        grammar: Seq(Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('7b. ε+ε', test({
        grammar: Seq(Epsilon(), Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('8. t1:hello + Seq()', test({
        grammar: Seq(t1("hello"), Seq()),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('9. Seq() + t1:hello', test({
        grammar: Seq(Seq(), t1("hello")),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('10. t1:hello + Seq(ε)', test({
        grammar: Seq(t1("hello"), Seq(Epsilon())),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));
    
    describe('11. t1:hello + (ε+ε)', test({
        grammar: Seq(t1("hello"), Seq(Epsilon(), Epsilon())),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('12. Sequence t1:hello + t1:""', test({
        grammar: Seq(t1("hello"), t1("")),
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('13. Sequence t1:"" + t1:hello', test({
        grammar: Seq(t1(""), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('14. Sequence t1:hello + ε', test({
        grammar: Seq(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('15. Sequence ε + t1:hello', test({
        grammar: Seq(Epsilon(), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('16. Sequence t1:hello + ε + world', test({
        grammar: Seq(t1("hello"), Epsilon(), t1("world")),
        results: [
            {t1: 'helloworld'},
        ],
    }));

    describe('17. Sequence t1:hello + ε + ε + world', test({
        grammar: Seq(t1("hello"), Epsilon(), Epsilon(), t1("world")),
        results: [
            {t1: 'helloworld'},
        ],
    }));

    describe('18. Sequence t1:ab + t1:cd + t1:ef', test({
        grammar: Seq(t1("ab"), t1("cd"), t1("ef")),
        results: [
            {t1: 'abcdef'},
        ],
    }));

    describe('19. Nested sequence (t1:ab + t1:cd) + t1:ef', test({
        grammar: Seq(Seq(t1("ab"), t1("cd")), t1("ef")),
        results: [
            {t1: 'abcdef'},
        ],
    }));

    describe('20. Nested sequence t1:ab + (t1:cd + t1:ef)', test({
        grammar: Seq(t1("ab"), Seq(t1("cd"), t1("ef"))),
        results: [
            {t1: 'abcdef'},
        ],
    }));

    describe('21. Nested sequence t1:ab + (t1:cd) + t1:ef', test({
        grammar: Seq(t1("ab"), Seq(t1("cd")), t1("ef")),
        results: [
            {t1: 'abcdef'},
        ],
    }));

    describe('22. t1:hi + t2:yo', test({
        grammar: Seq(t1("hi"), t2("yo")),
        tapes: ["t1", "t2"],
        // vocab: {t1: 2, t2: 2},
        results: [
            {t1: 'hi', t2: 'yo'},
        ],
    }));

    describe('23. t1:hi + t2:yo + t3:hey', test({
        grammar: Seq(t1("hi"), t2("yo"), t3("hey")),
        tapes: ["t1", "t2", "t3"],
        // vocab: {t1: 2, t2: 2, t3: 3},
        results: [
            {t1: 'hi', t2: 'yo', t3: 'hey'},
        ],
    }));

    describe('24. t1:hi + (t2:yo + t3:hey)', test({
        grammar: Seq(t1("hi"), Seq(t2("yo"), t3("hey"))),
        tapes: ["t1", "t2", "t3"],
        // vocab: {t1: 2, t2: 2, t3: 3},
        results: [
            {t1: 'hi', t2: 'yo', t3: 'hey'},
        ],
    }));

    describe('25. (t1:hi + t2:yo) + t3:hey', test({
        grammar: Seq(Seq(t1("hi"), t2("yo")), t3("hey")),
        tapes: ["t1", "t2", "t3"],
        // vocab: {t1: 2, t2: 2, t3: 3},
        results: [
            {t1: 'hi', t2: 'yo', t3: 'hey'},
        ],
    }));

    describe('26. Alt t1:hello | t1:goodbye', test({
        grammar: Uni(t1("hello"), t1("goodbye")),
        results: [
            {t1: 'hello'},
            {t1: 'goodbye'},
        ],
    }));

    describe('27. Alt t1:hello | ε', test({
        grammar: Uni(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
            {},
        ],
    }));

    describe('28. t1:hello + (t1:world | ε)', test({
        grammar: Seq(t1("hello"), Uni(t1("world"), Epsilon())),
        results: [
            {t1: 'hello'},
            {t1: 'helloworld'},
        ],
    }));

    describe('29. (t1:hello | ε) + t1:world', test({
        grammar: Seq(Uni(t1("hello"), Epsilon()), t1("world")),
        results: [
            {t1: 'world'},
            {t1: 'helloworld'},
        ],
    }));

    describe('30. Alt of different tapes: t1:hello | t2:goodbye', test({
        grammar: Uni(t1("hello"), t2("goodbye")),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello'},
            {t2: 'goodbye'},
        ],
    }));

    describe('31. Alt of sequences: ' +
             '(t1:hello+t2:kitty) | (t1:goodbye+t2:world)', test({
        grammar: Uni(Seq(t1("hello"), t2("kitty")),
                     Seq(t1("goodbye"), t2("world"))),
        results: [
            { t1: 'hello', t2: 'kitty' },
            { t1: 'goodbye', t2: 'world' },
        ],
    }));

    describe('32. Sequence with alt: ' +
             '(t1:hello | t1:goodbye) + t1:world', test({
        grammar: Seq(Uni(t1("hello"), t1("goodbye")), t1("world")),
        results: [
            {t1: 'helloworld'},
            {t1: 'goodbyeworld'},
        ],
    }));

    describe('33. Sequence with alt: ' +
             't1:say + (t1:hello | t1:goodbye)', test({
        grammar: Seq(t1("say"), Uni(t1("hello"), t1("goodbye"))),
        results: [
            {t1: 'sayhello'},
            {t1: 'saygoodbye'},
        ],
    }));

    describe('34. Sequence with alt: ' +
             '(t1:hello | t1:goodbye) + (t1:world | t1:kitty)', test({
        grammar: Seq(Uni(t1("hello"), t1("goodbye")),
                     Uni(t1("world"), t1("kitty"))),
        results: [
            {t1: 'helloworld'},
            {t1: 'goodbyeworld'},
            {t1: 'hellokitty'},
            {t1: 'goodbyekitty'},
        ],
    }));

    describe('35. Empty union', test({
        grammar: Uni(),
        tapes: [],
        results: [
        ],
    }));

    describe('36. Union of one ε', test({
        grammar: Uni(Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('37. ε|ε', test({
        grammar: Uni(Epsilon(), Epsilon()),
        tapes: [],
        results: [
            {},
        ],
    }));

    describe('38. t1:hello + (ε|ε)', test({
        grammar: Seq(t1("hello"), Uni(Epsilon(), Epsilon())),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('39. t1:[hi]', test({
        grammar: CharSet("t1", ["h", "i"]),
        tapes: ["t1"],
        results: [
            {t1: 'h'},
            {t1: 'i'},
        ],
    }));

    describe('40. t1:[hi] + t1:[hi]', test({
        grammar: Seq(CharSet("t1", ["h", "i"]), 
                     CharSet("t1", ["h", "i"])),
        tapes: ["t1"],
        results: [
            {t1: 'hh'}, 
            {t1: 'hi'}, 
            {t1: 'ih'}, 
            {t1: 'ii'}
        ],
    }));
});
