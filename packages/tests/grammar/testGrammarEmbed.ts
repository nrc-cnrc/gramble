import {
    Embed, Collection, 
    Seq, Uni, Join, Epsilon, Null,
} from "../../interpreter/src/grammarConvenience";

import { Grammar } from "../../interpreter/src/grammars";

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

    function grammar1(): Grammar {
        return Collection({a: t1("hi"), b: Embed("a")});
    }

    describe('1a. Symbol containing t1:hi, unnamed collection', test({
        grammar: grammar1(),
        symbol: "a",
        tapes: ["t1"],
        results: [
            {t1: 'hi'},
        ],
    }));

    describe('1b. Symbol containing t1:hi, unnamed collection', test({
        grammar: grammar1(),
        symbol: "b",
        tapes: ["t1"],
        results: [
            {t1: 'hi'},
        ],
    }));

    describe('2. Symbol containing ε', test({
        grammar: Collection({a: Epsilon(), b: Embed("a")}),
        symbol: "b",
        // vocab: {t1: 2},
        results: [
            {},
        ],
    }));

    describe('3. Symbol containing ε, other order', test({
        grammar: Collection({b: Embed("a"), a: Epsilon()}),
        symbol: "b",
        // vocab: {t1: 2},
        results: [
            {},
        ],
    }));

    describe('4. Symbol containing ε+ε', test({
        grammar: Collection({
            a: Seq(Epsilon(), Epsilon()),
            b: Embed("a")
        }),
        symbol: "b",
        // vocab: {t1: 2},
        results: [
            {},
        ],
    }));

    describe('5. Symbol containing ∅', test({
        grammar: Collection({a: Null(), b: Embed("a")}),
        symbol: "b",
        // vocab: {t1: 2},
        results: [
        ],
    }));

    describe('6. Lowercase assignment, uppercase reference', test({
        grammar: Collection({a: t1("hi"), b: Embed("A")}),
        symbol: "b",
        tapes: ["t1"],
        // vocab: {t1: 2},
        results: [
            {t1: 'hi'},
        ],
    }));

    describe('7. Uppercase assignment, lowercase reference', test({
        grammar: Collection({A: t1("hi"), b: Embed("a")}),
        symbol: "b",
        // vocab: {t1: 2},
        tapes: ["t1"],
        results: [
            {t1: 'hi'},
        ],
    }));

    describe('8. Symbol containing t1:hi + t1:world', test({
        grammar: Collection({
            a: Seq(t1("hi"), t1("world")),
            b: Embed("a"),
        }),
        symbol: "b",
        results: [
            {t1: 'hiworld'},
        ],
    }));

    describe('9. Two sequences referencing symbol containing ' +
             't1:h+t1:i', test({
        grammar: Collection({
            a: Seq(t1("h"), t1("i")),
            b: Uni(Seq(Embed("a"), t1("world")),
                   Seq(Embed("a"), t1("kitty"))),
        }),
        symbol: "b",
        results: [
            {t1: 'hiworld'},
            {t1: 'hikitty'},
        ],
    }));

    describe('10. Symbol containing t1:hi + t2:world', test({
        grammar: Collection({
            a: Seq(t1("hi"), t2("world")),
            b: Embed("a"),
        }),
        symbol: "b",
        tapes: ["t1", "t2"],
        // vocab: {t1: 2},
        results: [
            {t1: 'hi', t2: 'world'},
        ],
    }));

    describe('11. Symbol containing t1:hi | t1:goodbye', test({
        grammar: Collection({
            a: Uni(t1("hi"), t1("goodbye")),
            b: Embed("a"),
        }),
        symbol: "b",
        results: [
            {t1: 'hi'},
            {t1: 'goodbye'},
        ],
    }));

    describe('12. Symbol of (t1:hi ⋈ t1:hi+t2:bye)', test({
        grammar: Collection({
            hi2bye: Join(t1("hi"), Seq(t1("hi"), t2("bye"))), 
            b: Embed("hi2bye"),
        }),
        symbol: "b",
        results: [
            {t1: 'hi', t2: 'bye'},
        ],
    }));

    describe('13. Join sym(t1:hi ⋈ t1:hi+t2:bye) ⋈ t2:bye+t3:yo', test({
        grammar: Collection({
            hi2bye: Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
            b:      Join(Embed("hi2bye"), Seq(t2("bye"), t3("yo"))),
        }),
        symbol: "b",
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'}
        ],
    }));

    describe('14. Join t1:hi ⋈ sym(t1:hi+t2:bye ⋈ t2:bye+t3:yo)', test({
        grammar: Collection({
            hi2yo: Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo"))),
            b:     Join(t1("hi"), Embed("hi2yo"))
        }),
        symbol: "b",
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'}
        ],
    }));

    describe('15. sym(t1:hi ⋈ t1:hi+t2:bye) + t2:world', test({
        grammar: Collection({
            hi2bye: Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
            b:      Seq(Embed("hi2bye"), t2("world"))
        }),
        symbol: "b",
        results: [
            {t1: 'hi', t2: 'byeworld'}
        ],
    }));

    function grammar16(): Grammar {
        const inner = Collection({
            x: t1("hello")
        });
        const outer = Collection({
            x: t2("goodbye"),
            inner: inner
        });
        return outer;
    }

    describe('16a. Nested collections with name shadowing', test({
        grammar: grammar16(),
        symbol: "inner.x",
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('16b. Nested collections with name shadowing', test({
        grammar: grammar16(),
        symbol: "x",
        tapes: ["t2"],
        results: [
            {t2: 'goodbye'},
        ],
    }));

    function grammar17(): Grammar {
        const inner = Collection({
            x: t1("hello"),
            y: Embed("ns.x")
        });
        const outer = Collection({
            x: t2("goodbye"),
            ns: inner
        });
        const global = Collection({
            ns: outer
        });
        return global;
    }

    describe('17. Nested collections with identical names, and a symbol ' +
             'in the inner referring to a symbol in the inner', test({
        grammar: grammar17(),
        symbol: "ns.ns.y",
        results: [
            {t1: 'hello'},
        ],
    }));

    function grammar18(): Grammar {
        const inner = Collection({
            x: t1("hello")
        });
        const outer = Collection({
            x: t2("goodbye"),
            y: Embed("ns.x"),
            ns: inner,
        });
        const global = Collection({
            ns: outer
        });
        return global;
    }
    
    describe('18. Nested collections with identical names, and a symbol in ' +
             'the outer referring to a symbol in the inner', test({
        grammar: grammar18(),
        symbol: "ns.y",
        results: [
            {t1: 'hello'},
        ],
    }));

    function grammar19(): Grammar {
        const inner = Collection({
            x: t1("hello")
        });
        const outer = Collection({
            inner: inner,
            x: Embed("inner.x"),
        });
        return outer;
    }

    describe('19a. Nested collections where an embed in outer ' +
             'refers to inner', test({
        grammar: grammar19(),
        symbol: "inner.x",
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('19b. Nested collections where an embed in outer ' +
             'refers to inner', test({
        grammar: grammar19(),
        symbol: "x",
        results: [
            {t1: 'hello'},
        ],
    }));

    function grammar20(): Grammar {
        const inner1 = Collection({
            x: t1("hello")
        });
        const inner2 = Collection({
            x: Embed("inner1.x")
        });
        const outer = Collection({
            inner1: inner1,
            inner2: inner2
        });
        return outer;
    }

    describe('20a. Nested collections with two inners, ' +
             'and embed in second refers to symbol in first', test({
        grammar: grammar20(),
        symbol: "inner1.x",
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('20b. Nested collections with two inners, ' +
             'and embed in second refers to symbol in first', test({
        grammar: grammar20(),
        symbol: "inner2.x",
        results: [
            {t1: 'hello'},
        ],
    }));

    function grammar21(): Grammar {
        const inner1 = Collection({
            x: Embed("inner2.x")
        });
        const inner2 = Collection({
            x: t1("hello")
        });
        const outer = Collection({
            inner1: inner1,
            inner2: inner2
        });
        return outer;
    }

    describe('21a. Nested collections with two inners, and ' +
             'embed in first refers to symbol in second', test({
        grammar: grammar21(),
        symbol: "inner1.x",
        results: [
            {t1: 'hello'},
        ],
    }));

    describe('21b. Nested collections with two inners, and ' +
             'embed in first refers to symbol in second', test({
        grammar: grammar21(),
        symbol: "inner2.x",
        results: [
            {t1: 'hello'},
        ],
    }));
    
    describe('22. Sequence of two embedded epsilons.', test({
        grammar: Collection({
            "a": Seq(Embed("b"), Embed("b")),
            "b": Epsilon()
        }),
        symbol: "a",
        results: [
            {},
        ],
    }));

    describe('E1. Missing symbol', test({
        grammar: Collection({
            a: t1("hi"), 
            b: Embed("c")
        }),
        symbol: "a",
        tapes: ["t1"],
        results: [
            {t1: 'hi'},
        ],
        numErrors: 1
    }));

});
