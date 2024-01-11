import { expect } from "chai";
import { testSuiteName, logTestSuite } from "../testUtil";
import { Ref, Tag, Tokenized, Vocab, VocabDict, mergeKeys, sumKeys, vocabDictToStr } from "../../interpreter/src/alphabet";
import { Dict, mapDict } from "../../interpreter/src/utils/func";


function getFromVocabDict(v: VocabDict, key: string): Set<string> {
    const value = v[key];
    if (value === undefined) return new Set();
    switch (value.tag) {
        case Tag.Lit: return value.tokens;
        case Tag.Ref: return getFromVocabDict(v, value.key);
    }
}

/** A simplified VocabDict for easy entry */
type Voc = Dict<Vocab|string[]>;

function vocToVocabDict(voc: Voc): VocabDict {
    return mapDict(voc, (k,v) => {
        if (Array.isArray(v)) return Tokenized(new Set(v));
        return v;
    });
}

type VocabTest = {
    desc: string,
    vocab: Voc,
    results: Dict<string[]>
};

function test({
    desc,
    vocab,
    results
}: VocabTest): void {
    const vocabDict = vocToVocabDict(vocab);
    //console.log(desc + ":", vocabDictToStr(vocabDict));
    for (const [k,v] of Object.entries(results)) {
        it(`tape ${k} should have vocab ${v}`, function() {
            const resultSet = getFromVocabDict(vocabDict, k);
            const expectedSet = new Set(v);
            expect(resultSet).to.deep.equal(new Set(expectedSet));
        });
    }
}

type MergeTest = VocabTest & { 
    key1: string,
    key2: string,
}

function mergeTest({
    desc,
    vocab,
    key1,
    key2,
    results
}: MergeTest): void {
    const vocabDict = vocToVocabDict(vocab);
    const mergedVocab = mergeKeys(vocabDict, key1, key2);
    describe(desc, function() {
        it(`should contain all input keys`, function() {
            const originalKeys = Object.keys(vocabDict);
            const resultKeys = Object.keys(mergedVocab);
            expect(resultKeys).to.include.members(originalKeys);
        });
        test({desc, vocab: mergedVocab, results});
    });
}

type SumTest = VocabTest & {
    vocab2: Voc,
}

function sumTest({
    desc,
    vocab,
    vocab2,
    results
}: SumTest): void {
    const vocabDict = vocToVocabDict(vocab);
    const vocabDict2 = vocToVocabDict(vocab2);
    const mergedVocab = sumKeys(vocabDict, vocabDict2);
    describe(desc, function() {
        it(`should contain all input keys`, function() {
            const originalKeys = Object.keys(vocabDict)
                                    .concat(Object.keys(vocabDict2));
            const resultKeys = Object.keys(mergedVocab);
            expect(resultKeys).to.include.members(originalKeys);
        });
        test({desc, vocab: mergedVocab, results});
    });
}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    mergeTest({
        desc: "M1. Two literal sets",
        vocab: {
            "t1": ["a","b"],
            "t2": ["a","c"]
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });
    
    mergeTest({
        desc: "M2a. Literal and ref",
        vocab: {
            "t1": ["a","b"],
            "t2": Ref("t3"),
            "t3": ["a","c"]
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "M2b. Ref and literal",
        vocab: {
            "t1": Ref("t3"),
            "t2": ["a","c"],
            "t3": ["a","b"],
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "M3. Two refs",
        vocab: {
            "t1": Ref("t3"),
            "t2": Ref("t4"),
            "t3": ["a","b"],
            "t4": ["a","c"],
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "M4a. Chain of refs on the left side",
        vocab: {
            "t1": Ref("t3"),
            "t2": ["a","b"],
            "t3": Ref("t4"),
            "t4": ["a","c"],
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "M4b. Chain of refs on the right side",
        vocab: {
            "t1": ["a","b"],
            "t2": Ref("t3"),
            "t3": Ref("t4"),
            "t4": ["a","c"],
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "M5a. Left side refers to right",
        vocab: {
            "t1": Ref("t2"),
            "t2": ["a","b"],
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b"],
            t2: ["a","b"]
        }
    });

    mergeTest({
        desc: "M5b. Right side refers to left",
        vocab: {
            "t1": ["a","b"],
            "t2": Ref("t1"),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b"],
            t2: ["a","b"]
        }
    });

    sumTest({
        desc: "S1: Two literals",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "t1": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S2: Different tapes altogether",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "t2": ["a","c"],
        },
        results: {
            "t1": ["a","b"],
            "t2": ["a","c"]
        }
    });

    sumTest({
        desc: "S3a: Ref on the left",
        vocab: {
            "t1": Ref("X"),
            "X": ["a","b"],
        },
        vocab2: {
            "t1": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S3b: Ref chain on the left",
        vocab: {
            "t1": Ref("X"),
            "X": Ref("Y"),
            "Y": ["a","b"],
        },
        vocab2: {
            "t1": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });
    
    sumTest({
        desc: "S3c: Ref on the right",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "t1": Ref("X"),
            "X": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });
    
    sumTest({
        desc: "S3c: Ref on the right, different ordering",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "X": ["a","c"],
            "t1": Ref("X"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S4a: Ref chain on the right",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "t1": Ref("X"),
            "X": Ref("Y"),
            "Y": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });
    
    sumTest({
        desc: "S4b: Ref chain on the right, ordering 2",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "t1": Ref("X"),
            "Y": ["a","c"],
            "X": Ref("Y"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });
    
    sumTest({
        desc: "S4c: Ref chain on the right, ordering 3",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "X": Ref("Y"),
            "t1": Ref("X"),
            "Y": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S4d: Ref chain on the right, ordering 4",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "X": Ref("Y"),
            "Y": ["a","c"],
            "t1": Ref("X"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S4e: Ref chain on the right, ordering 5",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "Y": ["a","c"],
            "t1": Ref("X"),
            "X": Ref("Y"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S4f: Ref chain on the right, ordering 6",
        vocab: {
            "t1": ["a","b"],
        },
        vocab2: {
            "Y": ["a","c"],
            "X": Ref("Y"),
            "t1": Ref("X"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S5a: Ref on both sides",
        vocab: {
            "t1": Ref("X"),
            "X": ["a","b"],
        },
        vocab2: {
            "t1": Ref("Y"),
            "Y": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S5b: Ref on both sides, different ordering",
        vocab: {
            "t1": Ref("X"),
            "X": ["a","b"],
        },
        vocab2: {
            "Y": ["a","c"],
            "t1": Ref("Y"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });
    
    sumTest({
        desc: "S6a: Ref on both sides, same label",
        vocab: {
            "t1": Ref("X"),
            "X": ["a","b"],
        },
        vocab2: {
            "t1": Ref("X"),
            "X": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S6b: Ref on both sides, same label, different ordering",
        vocab: {
            "t1": Ref("X"),
            "X": ["a","b"],
        },
        vocab2: {
            "X": ["a","c"],
            "t1": Ref("X"),
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S7a: Ref chain on both sides, all different labels",
        vocab: {
            "t1": Ref("W"),
            "W": Ref("X"),
            "X": ["a","b"],
        },
        vocab2: {
            "t1": Ref("Y"),
            "Y": Ref("Z"),
            "Z": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S7b: Ref chain on both sides, all same labels",
        vocab: {
            "t1": Ref("X"),
            "X": Ref("Y"),
            "Y": ["a","b"],
        },
        vocab2: {
            "t1": Ref("X"),
            "X": Ref("Y"),
            "Y": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

    sumTest({
        desc: "S7c: Ref chain on both sides, backwards labels",
        vocab: {
            "t1": Ref("X"),
            "X": Ref("Y"),
            "Y": ["a","b"],
        },
        vocab2: {
            "t1": Ref("Y"),
            "Y": Ref("X"),
            "X": ["a","c"],
        },
        results: {
            "t1": ["a","b","c"]
        }
    });

});  