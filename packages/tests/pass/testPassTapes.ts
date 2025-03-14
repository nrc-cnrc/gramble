import { assert, expect } from "chai";

import { 
    Collection, Contains, Dot,
    Embed, Ends, Epsilon,
    Hide, Join, Match, Not,
    Null, Rename, Rep,
    ReplaceBlock, Replace, Seq, 
    Short, SingleTape, Starts, Uni
} from "../../interpreter/src/grammarConvenience.js";

import { Grammar, ReplaceGrammar } from "../../interpreter/src/grammars.js";
import { CalculateTapes } from "../../interpreter/src/passes/calculateTapes.js";
import { FlattenCollections } from "../../interpreter/src/passes/flattenCollections.js";
import { SelectSymbol } from "../../interpreter/src/passes/selectSymbol.js";
import { Dict } from "../../interpreter/src/utils/func.js";
import { THROWER } from "../../interpreter/src/utils/msgs.js";
import { Options } from "../../interpreter/src/utils/options.js";
import { getFromVocabDict } from "../../interpreter/src/vocab.js";
import * as Tapes from "../../interpreter/src/tapes.js";
import * as Vocabs from "../../interpreter/src/vocab.js";

import {
    testSuiteName, logTestSuite,
    t1, t2, t3, 
} from "../testUtil.js";

type GrammarIDTest = {
    desc: string,
    grammar: Grammar,
    tapes: Dict<string[]>
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

    describe(`${desc}`, function() {
        try {
            const opt = Options({optimizeAtomicity: atomicity});
            const pass = new FlattenCollections().compose(new CalculateTapes());
            grammar = pass.getEnvAndTransform(grammar, opt).msgTo(THROWER);
            
            if (symbol) {
                const selectSymbol = new SelectSymbol(symbol);
                grammar = selectSymbol.getEnvAndTransform(grammar, opt).msgTo(THROWER); 
            }

            it(`Tapes are resolved`, function() {
                expect(grammar.tapes.tag).to.equal(Tapes.Tag.Lit);
            });

            if (grammar.tapes.tag !== Tapes.Tag.Lit) return;

            const expectedTapes = new Set(Object.keys(tapes));
            const foundTapes = grammar.tapes.tapeNames;

            it(`Tapes should equal [${[...expectedTapes]}]`, function() {
                expect(foundTapes).to.deep.equal(expectedTapes);
            });

            for (const [tapeName, vocabs] of Object.entries(tapes)) {
                const expectedVocab = Vocabs.Atomic(new Set(vocabs));
                const vocabMap = grammar.tapes.vocabMap;

                const vocab = vocabMap[tapeName];
                if (vocab === undefined) {
                    it(`${tapeName} should exist`, function() {
                        assert.fail();
                    });
                    continue;
                }

                const vocabLit = getFromVocabDict(grammar.tapes.vocabMap, tapeName);
                if (vocabLit === undefined) {
                    it(`cannot find referent for ${tapeName}`, function() {
                        assert.fail();
                    });
                    continue;
                }
                it(`${tapeName} should have vocab [${[...expectedVocab.tokens]}]`, function() {
                    expect(vocabLit.tokens).to.deep.equal(expectedVocab.tokens);
                });
            }
        } catch (e) {
            it("Unexpected Exception", function() {
                console.log("");
                console.log(`[${this.test?.fullTitle()}]`);
                console.log(e);
                assert.fail(JSON.stringify(e));
            });
        }
    });
}

function NamedReplace(
    name: string, 
    i: string, 
    o: string,
    pre: string = "",
    post: string = ""
): ReplaceGrammar {
    return Replace(i, o, pre, post, false, false, name)
}

const module = import.meta;

describe(`Pass ${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

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
            "t1": ["hello"]
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
            "t1": []
        }
    });

    testGrammarTapes({
        desc: "1c-atom",
        atomicity: true,
        grammar: Dot("t1"),
        tapes: {
            "t1": []
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
            "t1": ["hello"],
            "t2": ["world"]
        }
    });
    
    testGrammarTapes({
        desc: "2a-atom2",
        atomicity: true,
        grammar: Seq(t1("hello"), t1("world")),
        tapes: {
            "t1": ["hello", "world"],
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
            "t1": ["hello"],
            "t2": ["world"],
            "t3": ["!"],
        }
    });

    testGrammarTapes({
        desc: "2c",
        grammar: Seq(t1("hello"), Dot("t1")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "2c-alt",
        grammar: Uni(t1("hello"), Dot("t1")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "2c-atom",
        atomicity: true,
        grammar: Seq(t1("hello"), Dot("t1")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });
    
    testGrammarTapes({
        desc: "2d",
        grammar: Seq(Dot("t1"), t1("hello")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "2d-atom",
        atomicity: true,
        grammar: Seq(Dot("t1"), t1("hello")),
        tapes: {
            "t1": ["h","e","l","o"]
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
            "t2": ["hello"],
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
        desc: "3e",
        grammar: Rename(Seq(t1("hello"), Dot("t1")), "t1", "t2"),
        tapes: {
            "t2": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "3f",
        grammar: Rename(Rename(t1("hello"), "t1", "t2"), "t2", "t3"),
        tapes: {
            "t3": ["h","e","l","o"],
        }
    });

    testGrammarTapes({
        desc: "3g",
        grammar: Rename(Rename(Seq(t1("hello"), Dot("t1")), "t1", "t2"), "t2", "t3"),
        tapes: {
            "t3": ["h","e","l","o"],
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
            "t1": ["hi"],
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
            "t1": ["hi"],
            "t3": ["world"]
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
            "t1": ["hello"],
            "t2": ["hello"],
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
            "t1": ["hello"],
            "t2": ["hello"],
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
            "t1": ["hello"],
            "t2": ["world"]
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
            "t1": ["h","e","l","o","g","d","b","y"],
            "t2": ["w","o","r","l","d"],
            "t3": ["k","i","t","y"],
        }
    });

    testGrammarTapes({
        desc: "12e",
        grammar: Join(Seq(t1("hello"), Dot("t1"), t3("kitty")), 
                      Seq(t1("goodbye"), t2("world"))),
        tapes: {
            "t1":  ["h","e","l","o","g","d","b","y"],
            "t2": ["w","o","r","l","d"],
            "t3": ["k","i","t","y"],
        }
    });

    testGrammarTapes({
        desc: "12f",
        grammar: Join(Seq(t1("hello"), Dot("t1"), t3("kitty")), 
                      Seq(t1("goodbye"), Dot("t1"), t2("world"))),
        tapes: {
            "t1": ['h','e','l','o','g','d','b','y'], 
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
            "$i": ["h","e","l","o","a"],
            "$o": ["h","e","l","o","a"],
        },
    });
    
    testGrammarTapes({
        desc: "21b",
        grammar: Replace("e", "", "h", "llo"),
        tapes: {
            "$i": ["h","e","l","o"],
            "$o": ["h","e","l","o"],
        },
    });

    testGrammarTapes({
        desc: "22a",
        grammar: Starts("t1", t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "22a-atom",
        atomicity: true,
        grammar: Starts("t1", t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "22b",
        grammar: Ends("t1", t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "22c",
        grammar: Contains("t1", t1("hello"), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });
    
    testGrammarTapes({
        desc: "23a",
        grammar: Collection({
            "a": Starts("t1", Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "23a-atom",
        atomicity: true,
        grammar: Collection({
            "a": Starts("t1", Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "23b",
        grammar: Collection({
            "a": Ends("t1", Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "23c",
        grammar: Collection({
            "a": Contains("t1", Embed("b"), t1("w")),
            "b": t1("hello")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });
    
    testGrammarTapes({
        desc: "23a2",
        grammar: Collection({
            "a": Starts("t1", t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "23a2-atom",
        atomicity: true,
        grammar: Collection({
            "a": Starts("t1", t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "23b2",
        grammar: Collection({
            "a": Ends("t1", t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "23c2",
        grammar: Collection({
            "a": Contains("t1", t1("hello"), Embed("b")),
            "b": t1("w")
        }),
        symbol: "a",
        tapes: {
            "t1": ["h","e","l","o","w"],
        },
    });

    testGrammarTapes({
        desc: "24a",
        grammar: Starts("t1", Seq(t1("hello"), Dot("t1")), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"]
        },
    });

    testGrammarTapes({
        desc: "24b",
        grammar: Ends("t1", Seq(t1("hello"), Dot("t1")), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"]
        },
    });

    testGrammarTapes({
        desc: "24c",
        grammar: Contains("t1", Seq(t1("hello"), Dot("t1")), t1("w")),
        tapes: {
            "t1": ["h","e","l","o","w"]
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
            ".R1": ["h","e","l","o","a"],
        },
    });
    
    testGrammarTapes({
        desc: "25c",
        grammar: ReplaceBlock("t1", t1("hello"), 
                    NamedReplace("R1", "e", "a"),
                    NamedReplace("R2", "a", "u")),
        tapes: {
            "t1": ["h","e","l","o","a","u"],
            ".R2": ["h","e","l","o","a","u"],
            ".R1": ["h","e","l","o","a","u"],
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
            ".R1": ["h","e","l","o","a"],
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
            ".R2": ["h","e","l","o","a","u"],
            ".R1": ["h","e","l","o","a","u"],
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
            "t1": ["hello","world"]
        }
    });

    testGrammarTapes({
        desc: "28",
        grammar: Uni(t1("hi"), Join(t1("helloworld"), 
                Seq(t1("hello"), t1("world")))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d","i"]
        }
    });

    testGrammarTapes({
        desc: "28-atom",
        atomicity: true,
        grammar: Uni(t1("hi"), Join(t1("helloworld"), 
                Seq(t1("hello"), t1("world")))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d","i"]
        }
    });

    testGrammarTapes({
        desc: "29",
        grammar: Uni(t1("hi"), Seq(t1("hello"), 
                Join(t1("world"), t1("world")))),
        tapes: {
            "t1": ["h","e","l","o","w","r","d","i"]
        }
    });

    testGrammarTapes({
        desc: "29-atom",
        atomicity: true,
        grammar: Uni(t1("hi"), Seq(t1("hello"), 
                Join(t1("world"), t1("world")))),
        tapes: {
            "t1": ["hello","world","hi"]
        }
    });
    
    testGrammarTapes({
        desc: "30",
        grammar: Seq(t1("hello"), Dot("t1")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "30-atom",
        atomicity: true,
        grammar: Seq(t1("hello"), Dot("t1")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "31",
        grammar: Join(t1("hellohello"), 
                    Rep(t1("hello"))),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "31-atom",
        atomicity: true,
        grammar: Join(t1("hellohello"), 
                    Rep(t1("hello"))),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "32",
        grammar: Rep(Join(t1("hello"), t1("hello"))),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "32-atom",
        atomicity: true,
        grammar: Rep(Join(t1("hello"), t1("hello"))),
        tapes: {
            "t1": ["hello"]
        }
    });

    testGrammarTapes({
        desc: "33. Short vocabs are always strings",
        grammar: Short(Uni(t1("h"), t1("hh"))),
        tapes: {
            "t1": ["h"]
        }
    });

    testGrammarTapes({
        desc: "33-atom. Short vocabs are always strings",
        atomicity: true,
        grammar: Short(Uni(t1("h"), t1("hh"))),
        tapes: {
            "t1": ["h"]
        }
    });

    testGrammarTapes({
        desc: "34. Negations are always strings and wildcard",
        grammar: Not(t1("hello")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "34-atom. Negations are always strings and wildcard",
        atomicity: true,
        grammar: Not(t1("hello")),
        tapes: {
            "t1": ["h","e","l","o"]
        }
    });

    testGrammarTapes({
        desc: "35. Not",
        grammar: Not(t1("hello")),
        tapes: {
            "t1": ["h","e","l","l","o"],
        }
    });

    testGrammarTapes({
        desc: "36a. Match with a dot",
        grammar: Match(
            Seq(t1("hi"), Dot("t1")), "t1", "t2"),
        tapes: {
            "t1": ["h","i"],
            "t2": ["h","i"]
        }
    });

    testGrammarTapes({
        desc: "36b. Not match",
        grammar: Not(Match(
            Seq(t1("hi")), "t1", "t2")),
        tapes: {
            "t1": ["h","i"],
            "t2": ["h","i"]
        }
    });

    testGrammarTapes({
        desc: "36c. Not match with a dot",
        grammar: Not(Match(
            Seq(t1("hi"), Dot("t1")), "t1", "t2")),
        tapes: {
            "t1": ["h","i"],
            "t2": ["h","i"]
        }
    });

    testGrammarTapes({
        desc: "37. Joining to a wildcard match",
        grammar: Join(t1("hi"), (Match(Dot("t1"), "t1", "t2"))),
        tapes: {
            "t1": ["h","i"],
            "t2": ["h","i"]
        }
    });
});
