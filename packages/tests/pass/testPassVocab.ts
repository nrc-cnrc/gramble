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
    console.log(desc + ":", vocabDictToStr(vocabDict));
    describe(desc, function() {
        for (const [k,v] of Object.entries(results)) {
            it(`tape ${k} should have vocab ${v}`, function() {
                const resultSet = getFromVocabDict(vocabDict, k);
                const expectedSet = new Set(v);
                expect(resultSet).to.deep.equal(new Set(expectedSet));
            });
        }
    });
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
    test({desc, vocab: mergedVocab, results});
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
    test({desc, vocab: mergedVocab, results});
}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    /*
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

    */
    sumTest({
        desc: "S3: Ref on the left",
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

});

/*
type VocabTest = {
    desc: string,
    vocab: VocabSet,
    tokens: Iterable<string>,
    wildcard: boolean
};

function test({
    desc,
    vocab,
    tokens,
    wildcard
}: VocabTest): void {

    describe(desc, function() {
        it(`should have tokens ${tokens}`, function() {
            expect(vocab.tokens).to.deep.equal(new Set(tokens));
        });
        it(`should${wildcard?"":" not"} be a wildcard`, function() {
            expect(vocab.wildcard).to.deep.equal(wildcard);
        });
    });
}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    test({
        desc: "1. {}",
        vocab: VocabSet([]),
        tokens: [],
        wildcard: false
    }); 

    test({
        desc: "2. {*}",
        vocab: VocabSet([], true),
        tokens: [],
        wildcard: true
    }); 
    
    test({
        desc: "3. {a}",
        vocab: VocabSet(["a"]),
        tokens: ["a"],
        wildcard: false
    }); 
    
    test({
        desc: "4. {a,*}",
        vocab: VocabSet(["a"], true),
        tokens: ["a"],
        wildcard: true
    }); 

    test({
        desc: "5a. {a,b} + {}",
        vocab: vocabUnion(VocabSet(["a","b"]),
                          VocabSet([])),
        tokens: ["a","b"],
        wildcard: false
    }); 
    
    test({
        desc: "5b. {} + {a,c}",
        vocab: vocabUnion(VocabSet([]),
                          VocabSet(["a","c"])),
        tokens: ["a","c"],
        wildcard: false
    }); 
    
    test({
        desc: "6. {a,b} + {a,c}",
        vocab: vocabUnion(VocabSet(["a","b"]),
                          VocabSet(["a","c"])),
        tokens: ["a","b","c"],
        wildcard: false
    }); 
    
    test({
        desc: "6b. {a,b} + {a,c,*}",
        vocab: vocabUnion(VocabSet(["a","b"]),
                          VocabSet(["a","c"], true)),
        tokens: ["a","b","c"],
        wildcard: true
    }); 
    
    
    test({
        desc: "6c. {a,b,*} + {a,c}",
        vocab: vocabUnion(VocabSet(["a","b"], true),
                          VocabSet(["a","c"])),
        tokens: ["a","b","c"],
        wildcard: true
    }); 
    
    
    test({
        desc: "7. {a,b} & {a,c}",
        vocab: vocabIntersection(VocabSet(["a","b"]),
                          VocabSet(["a","c"])),
        tokens: ["a"],
        wildcard: false
    }); 
    
    test({
        desc: "8a. {a,b} & {}",
        vocab: vocabIntersection(VocabSet(["a","b"]),
                                VocabSet([])),
        tokens: [],
        wildcard: false
    }); 

    test({
        desc: "8b. {} & {a,c}",
        vocab: vocabIntersection(VocabSet([]),
                          VocabSet(["a","c"])),
        tokens: [],
        wildcard: false
    }); 

    test({
        desc: "9a. {a,b} & {*}",
        vocab: vocabIntersection(VocabSet(["a","b"]),
                                VocabSet([], true)),
        tokens: ["a","b"],
        wildcard: false
    }); 

    test({
        desc: "9b. {*} & {a,c}",
        vocab: vocabIntersection(VocabSet([], true),
                          VocabSet(["a","c"])),
        tokens: ["a","c"],
        wildcard: false
    }); 
    
    test({
        desc: "10a. {a,b} & {a,c,*}",
        vocab: vocabIntersection(VocabSet(["a","b"]),
                                VocabSet(["a","c"], true)),
        tokens: ["a","b"],
        wildcard: false
    }); 

    test({
        desc: "10b. {a,b,*} & {a,c}",
        vocab: vocabIntersection(VocabSet(["a","b"], true),
                                VocabSet(["a","c"])),
        tokens: ["a","c"],
        wildcard: false
    }); 

    test({
        desc: "11. {a,b,*} & {a,c,*}",
        vocab: vocabIntersection(VocabSet(["a","b"], true),
                                VocabSet(["a","c"], true)),
        tokens: ["a", "b", "c"],
        wildcard: true
    }); 

    test({
        desc: "12a. {a,b,*} & {}",
        vocab: vocabIntersection(VocabSet(["a","b"], true),
                                VocabSet([])),
        tokens: [],
        wildcard: false
    }); 

    test({
        desc: "8b. {} & {a,c,*}",
        vocab: vocabIntersection(VocabSet([]),
                          VocabSet(["a","c"], true)),
        tokens: [],
        wildcard: false
    }); 

}); */