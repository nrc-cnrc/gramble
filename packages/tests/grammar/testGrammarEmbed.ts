import {
    Collection, Epsilon, Embed,
    Join, Null, Seq, Uni,
} from "../../interpreter/src/grammarConvenience";

import { Grammar } from "../../interpreter/src/grammars";

import { Dict } from "../../interpreter/src/utils/func";
import { VERBOSE_GRAMMAR, } from "../../interpreter/src/utils/logging";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    function grammar1(): Dict<Grammar> {
        return {
            a: t1("hi"),
            b: Embed("a")
        };
    }

    testGrammar({
        desc: '1a. Symbol containing t1:hi; symbol a',
        grammar: grammar1(),
        symbol: "a",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
        desc: '1b. Symbol containing t1:hi; symbol b',
        grammar: grammar1(),
        symbol: "b",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
        desc: '2. Symbol containing ε',
        grammar: {
            a: Epsilon(),
            b: Embed("a")
        },
        symbol: "b",
        vocab: {t1: 0},
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '3. Symbol containing ε, other order',
        grammar: {
            b: Embed("a"),
            a: Epsilon()
        },
        symbol: "b",
        vocab: {t1: 0},
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '4. Symbol containing ε+ε',
        grammar: {
            a: Seq(Epsilon(), Epsilon()),
            b: Embed("a")
        },
        symbol: "b",
        vocab: {t1: 0},
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '5. Symbol containing ∅',
        grammar: {
            a: Null(),
            b: Embed("a")
        },
        symbol: "b",
        vocab: {t1: 0},
        results: [
        ],
    });

    testGrammar({
        desc: '6. Lowercase assignment, uppercase reference',
        grammar: {
            a: t1("hi"),
            b: Embed("A")
        },
        symbol: "b",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
        desc: '7. Uppercase assignment, lowercase reference',
        grammar: {
            A: t1("hi"),
            b: Embed("a")
        },
        symbol: "b",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
        desc: '8. Symbol containing t1:hi + t1:world',
        grammar: {
            a: Seq(t1("hi"), t1("world")),
            b: Embed("a"),
        },
        symbol: "b",
        vocab: {t1: [..."hiworld"]},
        results: [
            {t1: 'hiworld'},
        ],
    });

    testGrammar({
        desc: '9. Two sequences referencing symbol containing t1:h+t1:i',
        grammar: {
            a: Seq(t1("h"), t1("i")),
            b: Uni(Seq(Embed("a"), t1("world")),
                   Seq(Embed("a"), t1("kitty"))),
        },
        symbol: "b",
        vocab: {t1: [..."hiworldkty"]},
        results: [
            {t1: 'hiworld'},
            {t1: 'hikitty'},
        ],
    });

    testGrammar({
        desc: '10. Symbol containing t1:hi + t2:world',
        grammar: {
            a: Seq(t1("hi"), t2("world")),
            b: Embed("a"),
        },
        symbol: "b",
        tapes: ["t1", "t2"],
        vocab: {t1: [..."hi"], t2:[..."world"]},
        results: [
            {t1: 'hi', t2: 'world'},
        ],
    });

    testGrammar({
        desc: '11. Symbol containing t1:hi | t1:goodbye',
        grammar: {
            a: Uni(t1("hi"), t1("goodbye")),
            b: Embed("a"),
        },
        symbol: "b",
        vocab: {t1: [..."bdeghioy"]},
        results: [
            {t1: 'hi'},
            {t1: 'goodbye'},
        ],
    });

    testGrammar({
        desc: '12. Symbol of (t1:hi ⋈ t1:hi+t2:bye)',
        grammar: {
            hi2bye: Join(t1("hi"), Seq(t1("hi"), t2("bye"))), 
            b: Embed("hi2bye"),
        },
        symbol: "b",
        vocab: {t1: [..."hi"], t2:[..."bye"]},
        results: [
            {t1: 'hi', t2: 'bye'},
        ],
    });

    testGrammar({
        desc: '13. Join sym(t1:hi ⋈ t1:hi+t2:bye) ⋈ t2:bye+t3:yo',
        grammar: {
            hi2bye: Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
            b:      Join(Embed("hi2bye"), Seq(t2("bye"), t3("yo"))),
        },
        symbol: "b",
        vocab: {t1: [..."hi"], t2:[..."bye"], t3:[..."yo"]},
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'}
        ],
    });

    testGrammar({
        desc: '14. Join t1:hi ⋈ sym(t1:hi+t2:bye ⋈ t2:bye+t3:yo)',
        grammar: {
            hi2yo: Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo"))),
            b:     Join(t1("hi"), Embed("hi2yo"))
        },
        symbol: "b",
        vocab: {t1: [..."hi"], t2:[..."bye"], t3:[..."yo"]},
        results: [
            {t1: 'hi', t2: 'bye', t3: 'yo'}
        ],
    });

    testGrammar({
        desc: '15. sym(t1:hi ⋈ t1:hi+t2:bye) + t2:world',
        grammar: {
            hi2bye: Join(t1("hi"), Seq(t1("hi"), t2("bye"))),
            b:      Seq(Embed("hi2bye"), t2("world"))
        },
        symbol: "b",
        vocab: {t1: [..."hi"], t2:[..."byeworld"]},
        results: [
            {t1: 'hi', t2: 'byeworld'}
        ],
    });

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

    // Note: vocab testing doesn't work for multi-level symbols such as "inner.x"
    testGrammar({
        desc: '16a. Nested collections with name shadowing; symbol inner.x',
        grammar: grammar16(),
        symbol: "inner.x",
        tapes: ["t1"],
        // vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '16b. Nested collections with name shadowing; symbol x',
        grammar: grammar16(),
        symbol: "x",
        tapes: ["t2"],
        vocab: {t2: [..."godbye"]},
        results: [
            {t2: 'goodbye'},
        ],
    });

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

    testGrammar({
        desc: '17. Nested collections with identical names, and a symbol ' +
              'in the inner referring to a symbol in the inner',
        grammar: grammar17(),
        symbol: "ns.ns.y",
        results: [
            {t1: 'hello'},
        ],
    });

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
    
    testGrammar({
        desc: '18. Nested collections with identical names, and a symbol in ' +
             'the outer referring to a symbol in the inner',
        grammar: grammar18(),
        symbol: "ns.y",
        results: [
            {t1: 'hello'},
        ],
    });

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

    testGrammar({
        desc: '19a. Nested collections where an embed in outer refers to inner; ' +
              'symbol inner.x',
        grammar: grammar19(),
        symbol: "inner.x",
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '19b. Nested collections where an embed in outer refers to inner; ' +
              'symbol x',
        grammar: grammar19(),
        symbol: "x",
        vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
    });

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

    testGrammar({
        desc: '20a. Nested collections with two inners, ' +
             'and embed in second refers to symbol in first; symbol inner1.x',
        grammar: grammar20(),
        symbol: "inner1.x",
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '20b. Nested collections with two inners, ' +
             'and embed in second refers to symbol in first; symbol inner2.x',
        grammar: grammar20(),
        symbol: "inner2.x",
        results: [
            {t1: 'hello'},
        ],
    });

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

    testGrammar({
        desc: '21a. Nested collections with two inners, and ' +
             'embed in first refers to symbol in second; symbol inner1.x',
        grammar: grammar21(),
        symbol: "inner1.x",
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: '21b. Nested collections with two inners, and ' +
             'embed in first refers to symbol in second; symbol inner2.x',
        grammar: grammar21(),
        symbol: "inner2.x",
        results: [
            {t1: 'hello'},
        ],
    });
    
    testGrammar({
        desc: '22. Sequence of two embedded epsilons', 
        grammar: {
            "a": Seq(Embed("b"), Embed("b")),
            "b": Epsilon()
        },
        symbol: "a",
        results: [
            {},
        ],
    });

    testGrammar({
        desc: 'E1. Missing symbol',
        grammar: {
            a: t1("hi"), 
            b: Embed("c")
        },
        symbol: "a",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
        numErrors: 1
    });

});
