import { assert, expect } from "chai";

import { 
    Atomic, Concatenated, Lit, Ref, 
    VocabDict, getFromVocabDict, 
    intersectKeys, mergeKeys, multKeys, sumKeys,
    tokenize, 
} from "../../interpreter/src/vocab";

import { testSuiteName, logTestSuite } from "../testUtil";

// *************************************************
// CONVENIENCE FUNCTIONS FOR EASY TEST SPECIFICATION
// *************************************************

function Atom(...ss: string[]): Lit {
    return Atomic(new Set(ss));
}

function Conc(...ss: string[]): Lit {
    return Concatenated(new Set(ss));
}

function Tok(...ss: string[]): Lit { 
    return tokenize(Atom(...ss));
}

// ******************************
// PARAM TYPES AND TEST FUNCTIONS
// ******************************

type VocabParams = {
    desc: string,
    vocab: VocabDict,
    expected: VocabDict,
    origKeys: string[]
};

function testVocab({
    desc,
    vocab,
    expected,
    origKeys
}: VocabParams): void {
    //console.log(desc + ":", vocabDictToStr(vocabDict));
    describe(desc, function() {
        const resultKeys = Object.keys(vocab);
        it(`should contain all input keys`, function() {
            expect(resultKeys).to.include.members(origKeys);
        });
        for (const k of resultKeys) {
            const systemValue = getFromVocabDict(vocab, k);
            const expectedValue = getFromVocabDict(expected, k);
            if (expectedValue === undefined) {
                continue; 
            }
            if (systemValue === undefined) {
                it(`cannot find referent for ${k}`, function() {
                    assert.fail();
                });
                continue;
            }

            it(`tape ${k} should have atomicity ${expectedValue.atomicity}`, function() {
                expect(systemValue.atomicity).to.equal(expectedValue.atomicity);
            });
            it(`tape ${k} should have tokens ${[...expectedValue.tokens]}`, function() {
                expect(systemValue.tokens).to.deep.equal(new Set(expectedValue.tokens));
            });
        }
    });
}

type MergeParams = {
    desc: string,
    vocab: VocabDict,
    expected: VocabDict,
    key1: string,
    key2: string,
}

function mergeTest({
    desc,
    vocab,
    key1,
    key2,
    expected
}: MergeParams): void {
    const mergedVocab = mergeKeys(vocab, key1, key2);
    const origKeys = Object.keys(vocab);
    testVocab({desc, vocab: mergedVocab, expected, origKeys});
}

type OpParams = {
    desc: string,
    vocab: VocabDict,
    expected: VocabDict,
    vocab2: VocabDict,
}

function opTest({
    desc,
    vocab,
    vocab2,
    expected
}: OpParams, 
    op: (v1: VocabDict, v2: VocabDict) => VocabDict
): void {
    const mergedVocab = op(vocab, vocab2);
    const origKeys = Object.keys(vocab)
                            .concat(Object.keys(vocab2));
    testVocab({desc, vocab: mergedVocab, expected, origKeys});
}

function sumTest(params: OpParams): void {
    opTest(params, sumKeys);
}

function multTest(params: OpParams): void {
    opTest(params, multKeys);
}

function intersectTest(params: OpParams): void {
    opTest(params, intersectKeys);
}

describe(`Pass ${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    mergeTest({
        desc: "M1. Two literal sets",
        vocab: {
            t1: Atom("a","b"),
            t2: Atom("a","c")
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b","c"),
            t2: Atom("a","b","c")
        }
    });
    
    mergeTest({
        desc: "M2a. Literal and ref",
        vocab: {
            t1: Atom("a","b"),
            t2: Ref("t3"),
            t3: Atom("a","c")
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b","c"),
            t2: Atom("a","b","c")
        }
    });

    mergeTest({
        desc: "M2b. Ref and literal",
        vocab: {
            t1: Ref("t3"),
            t2: Atom("a","c"),
            t3: Atom("a","b"),
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b","c"),
            t2: Atom("a","b","c")
        }
    });

    mergeTest({
        desc: "M3. Two refs",
        vocab: {
            t1: Ref("t3"),
            t2: Ref("t4"),
            t3: Atom("a","b"),
            t4: Atom("a","c"),
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b","c"),
            t2: Atom("a","b","c")
        }
    });

    mergeTest({
        desc: "M4a. Chain of refs on the left side",
        vocab: {
            t1: Ref("t3"),
            t2: Atom("a","b"),
            t3: Ref("t4"),
            t4: Atom("a","c"),
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b","c"),
            t2: Atom("a","b","c")
        }
    });

    mergeTest({
        desc: "M4b. Chain of refs on the right side",
        vocab: {
            t1: Atom("a","b"),
            t2: Ref("t3"),
            t3: Ref("t4"),
            t4: Atom("a","c"),
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b","c"),
            t2: Atom("a","b","c")
        }
    });

    mergeTest({
        desc: "M5a. Left side refers to right",
        vocab: {
            t1: Ref("t2"),
            t2: Atom("a","b"),
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b"),
            t2: Atom("a","b")
        }
    });

    mergeTest({
        desc: "M5b. Right side refers to left",
        vocab: {
            t1: Atom("a","b"),
            t2: Ref("t1"),
        },
        key1: "t1",
        key2: "t2",
        expected: {
            t1: Atom("a","b"),
            t2: Atom("a","b")
        }
    });

    sumTest({
        desc: "S1. Two literals",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            t1: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S2. Different tapes altogether",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            t2: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b"),
            t2: Atom("a","c")
        }
    });

    sumTest({
        desc: "S3a. Ref on the left",
        vocab: {
            t1: Ref("X"),
            X: Atom("a","b"),
        },
        vocab2: {
            t1: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S3b. Ref chain on the left",
        vocab: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("a","b"),
        },
        vocab2: {
            t1: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });
    
    sumTest({
        desc: "S3c. Ref on the right",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("X"),
            X: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });
    
    sumTest({
        desc: "S3c. Ref on the right, different ordering",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            X: Atom("a","c"),
            t1: Ref("X"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S4a. Ref chain on the right",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });
    
    sumTest({
        desc: "S4b. Ref chain on the right, ordering 2",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("X"),
            Y: Atom("a","c"),
            X: Ref("Y"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });
    
    sumTest({
        desc: "S4c. Ref chain on the right, ordering 3",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            X: Ref("Y"),
            t1: Ref("X"),
            Y: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S4d. Ref chain on the right, ordering 4",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            X: Ref("Y"),
            Y: Atom("a","c"),
            t1: Ref("X"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S4e. Ref chain on the right, ordering 5",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            Y: Atom("a","c"),
            t1: Ref("X"),
            X: Ref("Y"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S4f. Ref chain on the right, ordering 6",
        vocab: {
            t1: Atom("a","b"),
        },
        vocab2: {
            Y: Atom("a","c"),
            X: Ref("Y"),
            t1: Ref("X"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S5a. Ref on both sides",
        vocab: {
            t1: Ref("X"),
            X: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("Y"),
            Y: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S5b. Ref on both sides, different ordering",
        vocab: {
            t1: Ref("X"),
            X: Atom("a","b"),
        },
        vocab2: {
            Y: Atom("a","c"),
            t1: Ref("Y"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });
    
    sumTest({
        desc: "S6a. Ref on both sides, same label",
        vocab: {
            t1: Ref("X"),
            X: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("X"),
            X: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S6b. Ref on both sides, same label, different ordering",
        vocab: {
            t1: Ref("X"),
            X: Atom("a","b"),
        },
        vocab2: {
            X: Atom("a","c"),
            t1: Ref("X"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S7a. Ref chain on both sides, all different labels",
        vocab: {
            t1: Ref("W"),
            W: Ref("X"),
            X: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("Y"),
            Y: Ref("Z"),
            Z: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S7b. Ref chain on both sides, all same labels",
        vocab: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    sumTest({
        desc: "S7c. Ref chain on both sides, backwards labels",
        vocab: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("a","b"),
        },
        vocab2: {
            t1: Ref("Y"),
            Y: Ref("X"),
            X: Atom("a","c"),
        },
        expected: {
            t1: Atom("a","b","c")
        }
    });

    // testing sum atomicity

    sumTest({
        desc: "S8a. Atomic | Atomic",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Atom("ab", "ac")
        }
    });

    sumTest({
        desc: "S8b. Atomic | Concatenated",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });


    sumTest({
        desc: "S8c. Atomic | Tokenized",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Tok("ac")
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    sumTest({
        desc: "S8d. Concatenated | Atomic",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });

    sumTest({
        desc: "S8e. Concatenated | Concatenated",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });

    sumTest({
        desc: "S8f. Concatenated | Tokenized",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Tok("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    sumTest({
        desc: "S8g. Tokenized | Atomic",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });
    sumTest({
        desc: "S8h. Tokenized | Concatenated",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    sumTest({
        desc: "S8i. Tokenized | Tokenized",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Tok("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    // testing product atomicity
    
    multTest({
        desc: "M1a. Atomic * Atomic",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });

    multTest({
        desc: "M1b. Atomic * Concatenated",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });

    multTest({
        desc: "M1c. Atomic * Tokenized",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Tok("ac")
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    multTest({
        desc: "M1d. Concatenated * Atomic",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });

    multTest({
        desc: "M1e. Concatenated * Concatenated",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Conc("ab", "ac")
        }
    });

    multTest({
        desc: "M1f. Concatenated * Tokenized",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Tok("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    multTest({
        desc: "M1g. Tokenized * Atomic",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    multTest({
        desc: "M1h. Tokenized * Concatenated",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    multTest({
        desc: "M1i. Tokenized * Tokenized",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Tok("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    // spot-checking some complex multiplications

    multTest({
        desc: "M2. Atom * Atom, ref chain on both sides, all different labels",
        vocab: {
            t1: Ref("W"),
            W: Ref("X"),
            X: Atom("ab"),
        },
        vocab2: {
            t1: Ref("Y"),
            Y: Ref("Z"),
            Z: Atom("ac"),
        },
        expected: {
            t1: Conc("ab","ac")
        }
    });
    
    multTest({
        desc: "M3. Atom * Atom, ref on both sides, same label, different ordering",
        vocab: {
            t1: Ref("X"),
            X: Atom("ab"),
        },
        vocab2: {
            X: Atom("ac"),
            t1: Ref("X"),
        },
        expected: {
            t1: Conc("ab","ac")
        }
    });

    
    // intersection with non-intersected tapes
    multTest({
        desc: "M4. Atomic & Atomic",
        vocab: {
            t1: Atom("ab"),
            t2: Atom("xy"),
        },
        vocab2: {
            t1: Atom("ac"),
            t3: Atom("xz"),
        },
        expected: {
            t1: Conc("ab","ac"),
            t2: Atom("xy"),
            t3: Atom("xz")
        }
    });

    multTest({
        desc: "M4. Atom * Conc, ref chain on both sides, backwards labels",
        vocab: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("ab"),
        },
        vocab2: {
            t1: Ref("Y"),
            Y: Ref("X"),
            X: Conc("ac"),
        },
        expected: {
            t1: Conc("ab","ac")
        }
    });

    // testing intersection atomicity

    intersectTest({
        desc: "I1a. Atomic & Atomic",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Atom("ab", "ac")
        }
    });

    intersectTest({
        desc: "I1b. Atomic & Concatenated",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    intersectTest({
        desc: "I1c. Atomic & Tokenized",
        vocab: {
            t1: Atom("ab"),
        },
        vocab2: {
            t1: Tok("ac")
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    intersectTest({
        desc: "I1d. Concatenated & Atomic",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    intersectTest({
        desc: "I1e. Concatenated & Concatenated",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    intersectTest({
        desc: "I1f. Concatenated & Tokenized",
        vocab: {
            t1: Conc("ab"),
        },
        vocab2: {
            t1: Tok("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    intersectTest({
        desc: "I1g. Tokenized & Atomic",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Atom("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    intersectTest({
        desc: "I1h. Tokenized & Concatenated",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Conc("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    intersectTest({
        desc: "I1i. Tokenized & Tokenized",
        vocab: {
            t1: Tok("ab"),
        },
        vocab2: {
            t1: Tok("ac"),
        },
        expected: {
            t1: Tok("ab", "ac")
        }
    });

    // spot-checking some complex intersections

    intersectTest({
        desc: "I2. Atom & Conc, ref chain on both sides, all same labels",
        vocab: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Atom("ab"),
        },
        vocab2: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Conc("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    intersectTest({
        desc: "I3. Conc & Atom, ref chain on both sides, backwards labels",
        vocab: {
            t1: Ref("X"),
            X: Ref("Y"),
            Y: Conc("ab"),
        },
        vocab2: {
            t1: Ref("Y"),
            Y: Ref("X"),
            X: Atom("ac"),
        },
        expected: {
            t1: Tok("a","b","c")
        }
    });

    // intersection with non-intersected tapes
    intersectTest({
        desc: "I4. Atomic & Concatenated",
        vocab: {
            t1: Atom("ab"),
            t2: Atom("xy"),
        },
        vocab2: {
            t1: Conc("ac"),
            t3: Atom("xz"),
        },
        expected: {
            t1: Tok("a","b","c"),
            t2: Atom("xy"),
            t3: Atom("xz")
        }
    });

});  
