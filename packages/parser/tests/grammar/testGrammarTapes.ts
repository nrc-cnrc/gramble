import { CollectionGrammar, CounterStack, Grammar } from "../../src/grammars";
import { toStr } from "../../src/passes/toStr";
import { assert, expect } from "chai";
import { t1, t2, t3 } from "../testUtil";
import { Any, Collection, Embed, Epsilon, Hide, Join, Match, Null, Rename, Seq, Uni } from "../../src/grammarConvenience";
import { CalculateTapes } from "../../src/passes/calculateTapes";
import { PassEnv } from "../../src/passes";

type GrammarIDTest = {
    testnum: string,
    grammar: Grammar,
    tapes: Iterable<string>,
    symbol?: string
};

export function testGrammarTapes({
    testnum,
    grammar,
    tapes,
    symbol = ""
}: GrammarIDTest): void {
    const pass = new CalculateTapes();
    const env = new PassEnv();
    let [newGrammar, _] = pass.go(grammar, env).destructure();
    
    if (symbol && newGrammar instanceof CollectionGrammar) {
        newGrammar = newGrammar.selectSymbol(symbol).tapify(env);
    }

    let resultTapes: Set<string> = new Set();

    try {
        const ts = newGrammar.calculateTapes(new CounterStack(2), env);
        resultTapes = new Set(ts);
    } catch (e) {
        it(`${testnum} has unresolved tape structure`, function() {
            assert.fail(`${e}`);
        });
        return;
    }

    const expectedTapes = new Set([...tapes]);
    it(`${testnum} should have tapes [${[...tapes]}]`, function() {
        expect(resultTapes).to.deep.equal(expectedTapes);
    });
}

describe(`GrammarIDs`, function() {

    testGrammarTapes({
        testnum: "1",
        grammar: t1("hello"),
        tapes: ["t1"]
    });

    testGrammarTapes({
        testnum: "2a",
        grammar: Seq(t1("hello"), t2("world")),
        tapes: ["t1", "t2"]
    });

    testGrammarTapes({
        testnum: "2b",
        grammar: Seq(t1("hello"), Seq(t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"]
    });

    testGrammarTapes({
        testnum: "3a",
        grammar: Rename(t1("hello"), "t1", "t2"),
        tapes: ["t2"]
    });

    testGrammarTapes({
        testnum: "3b",
        grammar: Rename(Seq(t1("hello"), t2("world")), "t1", "t3"),
        tapes: ["t2", "t3"]
    });

    testGrammarTapes({
        testnum: "3c",
        grammar: Hide(Seq(t1("hello"), t2("world")), "t1", "HIDDEN"),
        tapes: ["t2", ".HIDDEN"]
    });

    testGrammarTapes({
        testnum: "4a",
        grammar: Collection({a: t1("hi"), b: Embed("a")}),
        tapes: ["t1"],
        symbol: "b"
    });

    testGrammarTapes({
        testnum: "4b",
        grammar: Collection({
            b: Embed("a"),
            a: t1("hi")
        }),
        tapes: ["t1"],
        symbol: "b"
    });

    
    testGrammarTapes({
        testnum: "5",
        grammar: Collection({
            a: Seq(t1("hi"), t2("world")),
            b: Embed("a")
        }),
        tapes: ["t1", "t2"],
        symbol: "b"
    });

    testGrammarTapes({
        testnum: "6a",
        grammar: Collection({
            a: Rename(Seq(t1("hi"), t2("world")), "t2", "t3"),
            b: Embed("a")
        }),
        tapes: ["t1", "t3"],
        symbol: "b"
    });
    
    /*
    // These are correct, but I'm briefly going to ignore them
    // because I want to replicate the old semantics
    /*
    testGrammarTapes({
        testnum: "6b",
        grammar: Collection({
            a: Seq(t1("hi"), t2("world")),
            b: Rename(Embed("a"), "t2", "t3")
        }),
        tapes: ["t1", "t3"],
        symbol: "b"
    });

    testGrammarTapes({
        testnum: "6c",
        grammar: Collection({
            b: Rename(Embed("a"), "t2", "t3"),
            a: Seq(t1("hi"), t2("world"))
        }),
        tapes: ["t1", "t3"],
        symbol: "b"
    });
    
    testGrammarTapes({
        testnum: "6d",
        grammar: Collection({
            a: Rename(Seq(t1("hi"), t2("world")), "t1", "t4"),
            b: Rename(Embed("a"), "t2", "t3")
        }),
        tapes: ["t3", "t4"],
        symbol: "b"
    });
    */

    testGrammarTapes({
        testnum: "7",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("a"))
        }),
        tapes: ["t1"],
        symbol: "a"
    });
    
    testGrammarTapes({
        testnum: "8a",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("b")),
            b: Seq(t2("world"), Embed("b"))
        }),
        tapes: ["t1", "t2"],
        symbol: "a"
    });
    
    testGrammarTapes({
        testnum: "8b",
        grammar: Collection({
            b: Seq(t2("world"), Embed("b")),
            a: Seq(t1("hi"), Embed("b")),
        }),
        tapes: ["t1", "t2"],
        symbol: "a"
    });
    
    testGrammarTapes({
        testnum: "8c",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("b")),
            b: Seq(t2("world"), Embed("b")),
        }),
        tapes: ["t1", "t2"],
        symbol: "a"
    });

    /*
    // Likewise correct, but I'm replicating the old tape semantics for now
    testGrammarTapes({
        testnum: "9a",
        grammar: Collection({
            a: Seq(t1("hi"), Rename(Embed("b"), "t2", "t3")),
            b: Seq(t2("world"), Embed("b")),
        }),
        tapes: ["t1", "t3"],
        symbol: "a"
    });

    
    testGrammarTapes({
        testnum: "9b",
        grammar: Collection({
            b: Seq(t2("world"), Embed("b")),
            a: Seq(t1("hi"), Rename(Embed("b"), "t2", "t3")),
        }),
        tapes: ["t1", "t3"],
        symbol: "a"
    });

    */

    testGrammarTapes({
        testnum: "10a",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            a: Seq(t1("hi"), Embed("b")),
        }),
        tapes: ["t1", "t2"],
        symbol: "a"
    });

    testGrammarTapes({
        testnum: "10b",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: ["t1", "t2"],
        symbol: "a"
    });

    testGrammarTapes({
        testnum: "11a",
        grammar: Match(t1("hello"), "t1", "t2"),
        tapes: ["t1", "t2"]
    });

    testGrammarTapes({
        testnum: "11b",
        grammar: Match(t1("hello"), "t2", "t3"),
        tapes: ["t1", "t2", "t3"]
    });

    testGrammarTapes({
        testnum: "12a",
        grammar: Join(t1("hello"), t2("world")),
        tapes: ["t1", "t2"]
    });

    testGrammarTapes({
        testnum: "12a",
        grammar: Join(t1("hello"), Seq(t1("hello"), t2("world"))),
        tapes: ["t1", "t2"]
    });

    testGrammarTapes({
        testnum: "13a",
        grammar: Collection({
            a: t1("hi"),
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "13b",
        grammar: Collection({
            a: t1("hi"),
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "13c",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            a: t1("hi"),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "13d",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
            a: t1("hi"),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });

    testGrammarTapes({
        testnum: "13e",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            a: t1("hi"),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "13f",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
            a: t1("hi"),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "14a",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("c")),
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "14b",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("c")),
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "14c",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            a: Seq(t1("hi"), Embed("c")),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "14d",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
            a: Seq(t1("hi"), Embed("c")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });

    testGrammarTapes({
        testnum: "14e",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            a: Seq(t1("hi"), Embed("c")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });
    
    testGrammarTapes({
        testnum: "14f",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
            a: Seq(t1("hi"), Embed("c")),
        }),
        tapes: ["t1", "t2", "t3"],
        symbol: "c"
    });

    testGrammarTapes({
        testnum: "15",
        grammar: Collection({
            a: t1("hello"),
            b: t2("world"),
            c: Seq(Embed("a"), Embed("b"))
        }),
        tapes: ["t1", "t2"],
        symbol: "c"
    });
});