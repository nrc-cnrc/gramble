import { expect } from "chai";
import { testSuiteName, logTestSuite } from "./testUtil";

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