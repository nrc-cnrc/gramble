import { Grammar, ReplaceGrammar } from "../../src/grammars";
import { assert, expect } from "chai";
import { t1, t2, t3, testSuiteName } from "../testUtil";
import { 
    Collection, Contains, Dot, Embed, 
    Ends, 
    Epsilon, 
    Hide, 
    Join, 
    Match, 
    Null, 
    Rename, Replace, ReplaceBlock, Seq, SingleTape, Starts
} from "../../src/grammarConvenience";
import { CalculateTapes } from "../../src/passes/calculateTapes";
import { PassEnv } from "../../src/passes";
import { THROWER } from "../../src/utils/msgs";
import { SelectSymbol } from "../../src/passes/selectSymbol";
import { FlattenCollections } from "../../src/passes/flattenCollections";
import { VocabAtomic, VocabInfo, VocabString, WildcardSet } from "../../src/vocab";
import { Dict } from "../../src/utils/func";
import { tapeToStr } from "../../src/tapes";
import { toStr } from "../../src/passes/toStr";
import { Options } from "../../src/utils/options";

type Voc = string[] | VocabInfo;

type GrammarIDTest = {
    desc: string,
    grammar: Grammar,
    tapes: Dict<Voc>
    symbol?: string,
    atomicity?: boolean
};

export function testGrammarTapes({
    desc,
    grammar,
    tapes,
    symbol = "",
    atomicity = false
}: GrammarIDTest): void {

    const opt = Options({optimizeAtomicity: atomicity});
    const env = new PassEnv(opt);
    const pass = new FlattenCollections().compose(new CalculateTapes());
    grammar = pass.go(grammar, env).msgTo(THROWER);
    
    if (symbol) {
        const selectSymbol = new SelectSymbol(symbol);
        grammar = selectSymbol.go(grammar, env).msgTo(THROWER); 
    }

    describe(`${desc}`, function() {

        it(`Tapes are resolved`, function() {
            expect(grammar.tapeSet.tag).to.equal("TapeLit");
        });

        if (grammar.tapeSet.tag !== "TapeLit") return;

        const expectedTapes = new Set(Object.keys(tapes));
        const foundTapes = new Set(Object.keys(grammar.tapeSet.tapes))
        it(`Tapes should equal [${[...expectedTapes]}]`, function() {
            expect(foundTapes).to.deep.equal(expectedTapes);
        });

        for (const [tapeName, vocab] of Object.entries(tapes)) {
            const v = Array.isArray(vocab) 
                                ? voc(vocab)
                                : vocab;

            const tape = grammar.tapeSet.tapes[tapeName];
            if (tape === undefined) {
                it(`${tapeName} should exist`, function() {
                    assert.fail();
                });
                continue;
            }

            it(`${tapeName} should have vocab [${[...v.tokens.items]}]`, function() {
                expect(tape.tokens.items).to.deep.equal(v.tokens.items);
            });

            if (v.tokens.size !== 0) {
                // don't bother checking for atomicity when there aren't supposed
                // to be any actual tokens.
                const atomicMsg = v.tag === "VocabAtomic" ? "should" : "should not";
                it(`${tapeName} ${atomicMsg} be atomic`, function() {
                    expect(tape.tag).to.equal(v.tag);
                });
            }
            
            const msg = v.tokens.wildcard ? "should" : "should not";
            it(`${tapeName} ${msg} have a wildcard`, function() {
                expect(tape.tokens.wildcard).to.equal(v.tokens.wildcard);
            });
        }
    });


}

function voc(ss: string[], wildcard: boolean = false): VocabInfo {
    return VocabString(new WildcardSet(new Set(ss), wildcard))
}

function vocAtomic(ss: string[], wildcard: boolean = false): VocabInfo {
    return VocabAtomic(new WildcardSet(new Set(ss), wildcard))
}

function NamedReplace(
    name: string, 
    i: string, 
    o: string,
    pre: string = "",
    post: string = "",
): ReplaceGrammar {
    return Replace(i, o, pre, post, undefined, undefined,
            undefined, undefined, undefined, name, false)
}

describe(`${testSuiteName(module)}`, function() {

    testGrammarTapes({
        desc: "1a",
        grammar: t1("hello"),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "1a-atom",
        atomicity: true,
        grammar: t1("hello"),
        tapes: {
            "t1": vocAtomic(["hello"])
        }
    });

    testGrammarTapes({
        desc: "1b",
        grammar: t1(""),
        tapes: {
            "t1": []
        }
    });

    testGrammarTapes({
        desc: "1c",
        grammar: Dot("t1"),
        tapes: {
            "t1": voc([], true)
        }
    });

    testGrammarTapes({
        desc: "1c-atom",
        atomicity: true,
        grammar: Dot("t1"),
        tapes: {
            "t1": voc([], true)
        }
    });

    testGrammarTapes({
        desc: "1d",
        grammar: Epsilon(),
        tapes: {}
    });
    
    testGrammarTapes({
        desc: "1e",
        grammar: Null(),
        tapes: {}
    });

    testGrammarTapes({
        desc: "2a",
        grammar: Seq(t1("hello"), t2("world")),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"]
        }
    });
    
    testGrammarTapes({
        desc: "2a-atom",
        atomicity: true,
        grammar: Seq(t1("hello"), t2("world")),
        tapes: {
            "t1": vocAtomic(["hello"]),
            "t2": vocAtomic(["world"])
        }
    });
    
    testGrammarTapes({
        desc: "2a-atom2",
        atomicity: true,
        grammar: Seq(t1("hello"), t1("world")),
        tapes: {
            "t1": vocAtomic(["hello", "world"]),
        }
    });

    testGrammarTapes({
        desc: "2b",
        grammar: Seq(t1("hello"), Seq(t2("world"), t3("!"))),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        }
    });

    testGrammarTapes({
        desc: "2b-atom",
        atomicity: true,
        grammar: Seq(t1("hello"), Seq(t2("world"), t3("!"))),
        tapes: {
            "t1": vocAtomic(["hello"]),
            "t2": vocAtomic(["world"]),
            "t3": vocAtomic(["!"]),
        }
    });

    testGrammarTapes({
        desc: "2c",
        grammar: Seq(t1("hello"), Dot("t1")),
        tapes: {
            "t1": voc(["h","e","l","o"], true)
        }
    });

    testGrammarTapes({
        desc: "2c-atom",
        atomicity: true,
        grammar: Seq(t1("hello"), Dot("t1")),
        tapes: {
            "t1": voc(["h","e","l","o"], true)
        }
    });
    
    testGrammarTapes({
        desc: "2d",
        grammar: Seq(Dot("t1"), t1("hello")),
        tapes: {
            "t1": voc(["h","e","l","o"], true)
        }
    });

    testGrammarTapes({
        desc: "2d-atom",
        atomicity: true,
        grammar: Seq(Dot("t1"), t1("hello")),
        tapes: {
            "t1": voc(["h","e","l","o"], true)
        }
    });

    testGrammarTapes({
        desc: "3a",
        grammar: Rename(t1("hello"), "t1", "t2"),
        tapes: {
            "t2": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "3a-atom",
        atomicity: true,
        grammar: Rename(t1("hello"), "t1", "t2"),
        tapes: {
            "t2": vocAtomic(["hello"]),
        }
    });

    testGrammarTapes({
        desc: "3b",
        grammar: Rename(Seq(t1("hello"), t2("world")), "t1", "t3"),
        tapes: {
            "t3": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"]
        }
    });

    testGrammarTapes({
        desc: "3c",
        grammar: Hide(Seq(t1("hello"), t2("world")), "t1", "HIDDEN"),
        tapes: {
            ".HIDDEN": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"]
        }
    });

    testGrammarTapes({
        desc: "3d",
        grammar: Rename(t1("hello"), "t1", "t1"),
        tapes: {
            "t1": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "4a",
        grammar: Collection({a: t1("hi"), b: Embed("a")}),
        tapes: {
            "t1": ["h", "i"],
        },
        symbol: "b"
    });

    testGrammarTapes({
        desc: "4a-atom",
        atomicity: true,
        grammar: Collection({a: t1("hi"), b: Embed("a")}),
        tapes: {
            "t1": vocAtomic(["hi"]),
        },
        symbol: "b"
    });

    testGrammarTapes({
        desc: "4b",
        grammar: Collection({
            b: Embed("a"),
            a: t1("hi")
        }),
        tapes: {
            "t1": ["h", "i"],
        },
        symbol: "b"
    });
    
    testGrammarTapes({
        desc: "5",
        grammar: Collection({
            a: Seq(t1("hi"), t2("world")),
            b: Embed("a")
        }),
        tapes: {
            "t1": ["h","i"],
            "t2": ["w","o","r","l","d"]
        },
        symbol: "b"
    });

    testGrammarTapes({
        desc: "6a",
        grammar: Collection({
            a: Rename(Seq(t1("hi"), t2("world")), "t2", "t3"),
            b: Embed("a")
        }),
        tapes: {
            "t1": ["h","i"],
            "t3": ["w","o","r","l","d"]
        },
        symbol: "b"
    });

    testGrammarTapes({
        desc: "6a-atom",
        atomicity: true,
        grammar: Collection({
            a: Rename(Seq(t1("hi"), t2("world")), "t2", "t3"),
            b: Embed("a")
        }),
        tapes: {
            "t1": vocAtomic(["hi"]),
            "t3": vocAtomic(["world"])
        },
        symbol: "b"
    });
    
    testGrammarTapes({
        desc: "6b",
        grammar: Collection({
            a: Seq(t1("hi"), t2("world")),
            b: Rename(Embed("a"), "t2", "t3")
        }),
        tapes: {
            "t1": ["h","i"],
            "t3": ["w","o","r","l","d"]
        },
        symbol: "b"
    });

    testGrammarTapes({
        desc: "6c",
        grammar: Collection({
            b: Rename(Embed("a"), "t2", "t3"),
            a: Seq(t1("hi"), t2("world"))
        }),
        tapes: {
            "t1": ["h","i"],
            "t3": ["w","o","r","l","d"]
        },
        symbol: "b"
    });
    
    testGrammarTapes({
        desc: "6d",
        grammar: Collection({
            a: Rename(Seq(t1("hi"), t2("world")), "t1", "t4"),
            b: Rename(Embed("a"), "t2", "t3")
        }),
        tapes: {
            "t4": ["h","i"],
            "t3": ["w","o","r","l","d"]
        },
        symbol: "b"
    });

    testGrammarTapes({
        desc: "7",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("a"))
        }),
        tapes: {
            "t1": ["h","i"],
        },
        symbol: "a"
    });
    
    testGrammarTapes({
        desc: "8a",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("b")),
            b: Seq(t2("world"), Embed("b"))
        }),
        tapes: {
            "t1": ["h","i"],
            "t2": ["w","o","r","l","d"]
        },
        symbol: "a"
    });
    
    testGrammarTapes({
        desc: "8b",
        grammar: Collection({
            b: Seq(t2("world"), Embed("b")),
            a: Seq(t1("hi"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","i"],
            "t2": ["w","o","r","l","d"]
        },
        symbol: "a"
    });
    
    testGrammarTapes({
        desc: "8c",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("b")),
            b: Seq(t2("world"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","i"],
            "t2": ["w","o","r","l","d"]
        },
        symbol: "a"
    });

    testGrammarTapes({
        desc: "9a",
        grammar: Collection({
            a: Seq(t1("hi"), Rename(Embed("b"), "t2", "t3")),
            b: Seq(t2("world"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","i"],
            "t3": ["w","o","r","l","d"]
        },
        symbol: "a"
    });

    testGrammarTapes({
        desc: "9b",
        grammar: Collection({
            b: Seq(t2("world"), Embed("b")),
            a: Seq(t1("hi"), Rename(Embed("b"), "t2", "t3")),
        }),
        tapes: {
            "t1": ["h","i"],
            "t3": ["w","o","r","l","d"]
        },
        symbol: "a"
    });

    testGrammarTapes({
        desc: "10a",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            a: Seq(t1("hi"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","i"],
            "t2": ["w","o","r","l","d"]
        },
        symbol: "a"
    });

    testGrammarTapes({
        desc: "10b",
        grammar: Collection({
            a: Seq(t1("hi"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: {
            "t1": ["h","i"],
            "t2": ["w","o","r","l","d"]
        },
        symbol: "a"
    });

    testGrammarTapes({
        desc: "11a",
        grammar: Match(t1("hello"), "t1", "t2"),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "11a-atom",
        atomicity: true,
        grammar: Match(t1("hello"), "t1", "t2"),
        tapes: {
            "t1": vocAtomic(["hello"]),
            "t2": vocAtomic(["hello"]),
        }
    });

    testGrammarTapes({
        desc: "11b",
        grammar: Match(t1("hello"), "t2", "t3"),
        tapes: {
            "t1": ["h","e","l","o"],
            "t3": [],
        }
    });
    
    testGrammarTapes({
        desc: "11c",
        grammar: Match(t1("hello"), "t1", "t2", "t3"),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["h","e","l","o"],
            "t3": ["h","e","l","o"],
        }
    });
    
    testGrammarTapes({
        desc: "11a-embed",
        grammar: Collection({
            "a": Match(Embed("b"), "t1", "t2"),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "11a-embed-atom",
        atomicity: true,
        grammar: Collection({
            "a": Match(Embed("b"), "t1", "t2"),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": vocAtomic(["hello"]),
            "t2": vocAtomic(["hello"]),
        }
    });

    testGrammarTapes({
        desc: "11b-embed",
        grammar: Collection({
            "a": Match(Embed("b"), "t2", "t3"),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
            "t3": [],
        }
    });
    
    testGrammarTapes({
        desc: "11c-embed",
        grammar: Collection({
            "a": Match(Embed("b"), "t1", "t2", "t3"),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["h","e","l","o"],
            "t3": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "12a",
        grammar: Join(t1("hello"), t2("world")),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"]
        }
    });

    testGrammarTapes({
        desc: "12b",
        grammar: Join(t1("hello"), Seq(t1("hello"), t2("world"))),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"]
        }
    });

    testGrammarTapes({
        desc: "12b-atom",
        atomicity: true,
        grammar: Join(t1("hello"), Seq(t1("hello"), t2("world"))),
        tapes: {
            "t1": vocAtomic(["hello"]),
            "t2": vocAtomic(["world"])
        }
    });
    
    testGrammarTapes({
        desc: "12c",
        grammar: Join(Seq(t1("hello"), t3("kitty")), 
                      Seq(t1("hello"), t2("world"))),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["k","i","t","y"],
        }
    });
    
    testGrammarTapes({
        desc: "12d",
        grammar: Join(Seq(t1("hello"), t3("kitty")), 
                      Seq(t1("goodbye"), t2("world"))),
        tapes: {
            "t1": ["e","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["k","i","t","y"],
        }
    });

    testGrammarTapes({
        desc: "12e",
        grammar: Join(Seq(t1("hello"), Dot("t1"), t3("kitty")), 
                      Seq(t1("goodbye"), t2("world"))),
        tapes: {
            "t1": ['g','o','d','b','y','e'],
            "t2": ["w","o","r","l","d"],
            "t3": ["k","i","t","y"],
        }
    });

    testGrammarTapes({
        desc: "12e",
        grammar: Join(Seq(t1("hello"), Dot("t1"), t3("kitty")), 
                      Seq(t1("goodbye"), Dot("t1"), t2("world"))),
        tapes: {
            "t1": voc(['h','e','l','o','g','d','b','y'], true),
            "t2": ["w","o","r","l","d"],
            "t3": ["k","i","t","y"],
        }
    });

    testGrammarTapes({
        desc: "13a",
        grammar: Collection({
            a: t1("hello"),
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "13b",
        grammar: Collection({
            a: t1("hello"),
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "13c",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            a: t1("hello"),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "13d",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
            a: t1("hello"),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });

    testGrammarTapes({
        desc: "13e",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            a: t1("hello"),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "13f",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
            a: t1("hello"),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "14a",
        grammar: Collection({
            a: Seq(t1("hello"), Embed("c")),
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "14b",
        grammar: Collection({
            a: Seq(t1("hello"), Embed("c")),
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "14c",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            a: Seq(t1("hello"), Embed("c")),
            c: Seq(t3("!"), Embed("b")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "14d",
        grammar: Collection({
            b: Seq(t2("world"), Embed("a")),
            c: Seq(t3("!"), Embed("b")),
            a: Seq(t1("hello"), Embed("c")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });

    testGrammarTapes({
        desc: "14e",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            a: Seq(t1("hello"), Embed("c")),
            b: Seq(t2("world"), Embed("a")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });
    
    testGrammarTapes({
        desc: "14f",
        grammar: Collection({
            c: Seq(t3("!"), Embed("b")),
            b: Seq(t2("world"), Embed("a")),
            a: Seq(t1("hello"), Embed("c")),
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
            "t3": ["!"],
        },
        symbol: "c"
    });

    testGrammarTapes({
        desc: "15",
        grammar: Collection({
            a: t1("hello"),
            b: t2("world"),
            c: Seq(Embed("a"), Embed("b"))
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
        },
        symbol: "c"
    });

    testGrammarTapes({
        desc: "16. Collection without symbol selected",
        grammar: Collection({
            a: t1("hello"),
            b: t2("world")
        }),
        tapes: {
            "t1": ["h","e","l","o"],
            "t2": ["w","o","r","l","d"],
        },
    });

    testGrammarTapes({
        desc: "17a",
        grammar: Collection({
            "S0": Seq(Embed("S2"), Embed("S0"), Embed("S1"), Embed("S3")),
            "S1": Embed("S0"),
            "S2": t1("a"),
            "S3": Embed("S1")
        }),
        symbol: "S3",
        tapes: { 
            t1: ["a"],
        }
    });

    testGrammarTapes({
        desc: "17b",
        grammar: Collection({
            "S1": Embed("S0"),
            "S2": t1("a"),
            "S0": Seq(Embed("S2"), Embed("S0"), Embed("S1"), Embed("S3")),
            "S3": Embed("S1")
        }),
        symbol: "S3",
        tapes: { 
            t1: ["a"],
        }
    });

    testGrammarTapes({
        desc: "18a",
        grammar: Collection({
            "S1": Embed("S1")
        }),
        symbol: "S1",
        tapes: { }
    });

    testGrammarTapes({
        desc: "18b",
        grammar: Collection({
            "S1": Seq(Embed("S1"), t1("a"))
        }),
        symbol: "S1",
        tapes: { 
            t1: ["a"],
        }
    });
   
    testGrammarTapes({
        desc: "19a",
        grammar: SingleTape("t1", "hello"),
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "19b",
        grammar: SingleTape("t1", t2("hello")),
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "19c",
        grammar: SingleTape("t1", Epsilon()),
        tapes: {},
    });


    
    testGrammarTapes({
        desc: "20a",
        grammar: Collection({
            "a": SingleTape("t1", Embed("b")),
            "b": t2("hello"),
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "20b",
        grammar: Collection({
            "b": t2("hello"),
            "a": SingleTape("t1", Embed("b")),
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "21a",
        grammar: Replace("e", "a", "h", "llo"),
        tapes: {
            "$i": voc(["h","e","l","o"], true),
            "$o": voc(["a"], true)
        },
    });
    
    testGrammarTapes({
        desc: "21b",
        grammar: Replace("e", "", "h", "llo"),
        tapes: {
            "$i": voc(["h","e","l","o"], true),
            "$o": voc([], true)
        },
    });

    testGrammarTapes({
        desc: "22a",
        grammar: Starts(t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "22a-atom",
        atomicity: true,
        grammar: Starts(t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "22b",
        grammar: Ends(t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "22c",
        grammar: Contains(t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "23a",
        grammar: Collection({
            "a": Starts(Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "23a-atom",
        atomicity: true,
        grammar: Collection({
            "a": Starts(Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "23b",
        grammar: Collection({
            "a": Ends(Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "23c",
        grammar: Collection({
            "a": Contains(Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "23a2",
        grammar: Collection({
            "a": Starts(t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "23a2-atom",
        atomicity: true,
        grammar: Collection({
            "a": Starts(t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "23b2",
        grammar: Collection({
            "a": Ends(t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "23c2",
        grammar: Collection({
            "a": Contains(t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "24a",
        grammar: Starts(Seq(t1("hello"), Dot("t1")), t1("w")),
        tapes: {
            "t1": voc(["h","e","l","o","w"], true)
        },
    });

    testGrammarTapes({
        desc: "24b",
        grammar: Ends(Seq(t1("hello"), Dot("t1")), t1("w")),
        tapes: {
            "t1": voc(["h","e","l","o","w"], true)
        },
    });

    testGrammarTapes({
        desc: "24c",
        grammar: Contains(Seq(t1("hello"), Dot("t1")), t1("w")),
        tapes: {
            "t1": voc(["h","e","l","o","w"], true)
        },
    });

    testGrammarTapes({
        desc: "25a",
        grammar: ReplaceBlock("t1", t1("hello"), 
                NamedReplace("R1", "e", "")),
        tapes: {
            "t1": ["h","e","l","o"],
            ".R1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "25a-atom",
        atomicity: true,
        grammar: ReplaceBlock("t1", t1("hello"), 
                NamedReplace("R1", "e", "")),
        tapes: {
            "t1": ["h","e","l","o"],
            ".R1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "25b",
        grammar: ReplaceBlock("t1", t1("hello"), 
                    NamedReplace("R1", "e", "a")),
        tapes: {
            "t1": ["h","e","l","o","a"],
            ".R1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "25c",
        grammar: ReplaceBlock("t1", t1("hello"), 
                    NamedReplace("R1", "e", "a"),
                    NamedReplace("R2", "a", "u")),
        tapes: {
            "t1": ["h","e","l","o","a","u"],
            ".R2": ["h","e","l","o","a"],
            ".R1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "25a-embed",
        grammar: Collection({ 
            "a": ReplaceBlock("t1", Embed("b"), 
                NamedReplace("R1", "e", "")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
            ".R1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "25a-atom=embed",
        atomicity: true,
        grammar: Collection({ 
            "a": ReplaceBlock("t1", Embed("b"), 
                NamedReplace("R1", "e", "")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o"],
            ".R1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "25b-embed",
        grammar: Collection({ 
            "a": ReplaceBlock("t1", Embed("b"), 
                    NamedReplace("R1", "e", "a")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","a"],
            ".R1": ["h","e","l","o"],
        },
    });
    
    testGrammarTapes({
        desc: "25c-embed",
        grammar: Collection({ 
            "a": ReplaceBlock("t1", Embed("b"), 
                    NamedReplace("R1", "e", "a"),
                    NamedReplace("R2", "a", "u")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","a","u"],
            ".R2": ["h","e","l","o","a"],
            ".R1": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "26",
        grammar: Join(t1("helloworld"), 
                Seq(t1("hello"), t1("world"))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d"]
        }
    });

    testGrammarTapes({
        desc: "26-atom",
        atomicity: true,
        grammar: Join(t1("helloworld"), 
                Seq(t1("hello"), t1("world"))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d"]
        }
    });

    // the following aren't really correct, but match our old
    // semantics. TODO: get these right
    testGrammarTapes({
        desc: "27",
        grammar: Seq(t1("hello"), 
                Join(t1("world"), t1("world"))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d"]
        }
    });

    testGrammarTapes({
        desc: "27-atom",
        atomicity: true,
        grammar: Seq(t1("hello"), 
                Join(t1("world"), t1("world"))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d"]
        }
    });
});
