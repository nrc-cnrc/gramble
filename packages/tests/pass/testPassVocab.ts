import { expect } from "chai";
import { testSuiteName, logTestSuite } from "../testUtil";
import { Ref, Tag, Tokenized, VocabDict, mergeKeys, vocabDictToStr } from "../../interpreter/src/alphabet";
import { Dict } from "../../interpreter/src/utils/func";


function getFromVocabDict(v: VocabDict, key: string): Set<string> {
    const value = v[key];
    if (value === undefined) return new Set();
    switch (value.tag) {
        case Tag.Lit: return value.tokens;
        case Tag.Ref: return getFromVocabDict(v, value.name);
    }
}

type VocabTest = {
    desc: string,
    vocab: VocabDict,
    results: Dict<string[]>
};

type MergeTest = VocabTest & { 
    key1: string,
    key2: string,
}

function test({
    desc,
    vocab,
    results
}: VocabTest): void {
    console.log(desc + ":", vocabDictToStr(vocab));
    describe(desc, function() {
        for (const [k,v] of Object.entries(results)) {
            it(`tape ${k} should have vocab ${v}`, function() {
                const resultSet = getFromVocabDict(vocab, k);
                const expectedSet = new Set(v);
                expect(resultSet).to.deep.equal(new Set(expectedSet));
            });
        }
    });
}

function mergeTest({
    desc,
    vocab,
    key1,
    key2,
    results
}: MergeTest): void {
    const mergedVocab = mergeKeys(vocab, key1, key2);
    test({desc, vocab: mergedVocab, results});
}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    mergeTest({
        desc: "1. Two literal sets",
        vocab: {
            "t1": Tokenized(new Set(["a","b"])),
            "t2": Tokenized(new Set(["a","c"]))
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });
    
    mergeTest({
        desc: "2a. Literal and ref",
        vocab: {
            "t1": Tokenized(new Set(["a","b"])),
            "t2": Ref("t3"),
            "t3": Tokenized(new Set(["a","c"]))
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "2b. Ref and literal",
        vocab: {
            "t1": Ref("t3"),
            "t2": Tokenized(new Set(["a","c"])),
            "t3": Tokenized(new Set(["a","b"])),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "3. Two refs",
        vocab: {
            "t1": Ref("t3"),
            "t2": Ref("t4"),
            "t3": Tokenized(new Set(["a","b"])),
            "t4": Tokenized(new Set(["a","c"])),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "4a. Chain of refs on the left side",
        vocab: {
            "t1": Ref("t3"),
            "t2": Tokenized(new Set(["a","b"])),
            "t3": Ref("t4"),
            "t4": Tokenized(new Set(["a","c"])),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "4b. Chain of refs on the right side",
        vocab: {
            "t1": Tokenized(new Set(["a","b"])),
            "t2": Ref("t3"),
            "t3": Ref("t4"),
            "t4": Tokenized(new Set(["a","c"])),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b","c"],
            t2: ["a","b","c"]
        }
    });

    mergeTest({
        desc: "5a. Left side refers to right",
        vocab: {
            "t1": Ref("t2"),
            "t2": Tokenized(new Set(["a","b"])),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b"],
            t2: ["a","b"]
        }
    });

    mergeTest({
        desc: "5b. Right side refers to left",
        vocab: {
            "t1": Tokenized(new Set(["a","b"])),
            "t2": Ref("t1"),
        },
        key1: "t1",
        key2: "t2",
        results: {
            t1: ["a","b"],
            t2: ["a","b"]
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