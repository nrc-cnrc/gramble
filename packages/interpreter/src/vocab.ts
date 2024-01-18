import { VOCAB_MAX_TOKENS } from "./utils/constants";
import { Dict, flatmapSet, union } from "./utils/func";
import { randomString } from "./utils/random";
import { tokenizeUnicode } from "./utils/strings";


// *******************
// VOCAB-RELATED TYPES
// *******************

export type VocabDict = Dict<Vocab>;

export const enum Tag {
    Lit = "Lit",
    Ref = "Ref",
};

export const enum Atomicity {
    Atomic = "Atomic",
    Concatenated = "Concatenated",
    Tokenized = "Tokenized",
}

export type Atomic = {
    tag: Tag.Lit,
    atomicity: Atomicity.Atomic,
    tokens: Set<string>
}

export type Concatenated = {
    tag: Tag.Lit,
    atomicity: Atomicity.Concatenated,
    tokens: Set<string>,
}

export type Tokenized = {
    tag: Tag.Lit,
    atomicity: Atomicity.Tokenized,
    tokens: Set<string>
}

export type Lit = Atomic
                | Concatenated
                | Tokenized;
                           
export type Ref = {
    tag: Tag.Ref,
    key: string 
}

export type Vocab = Lit | Ref;

// ********************************************
// CONVENIENCE CONSTRUCTORS FOR VOCAB LITERALS
// ********************************************

export function Ref(key: string): Ref {
    return { tag: Tag.Ref, key };
}

export function Atomic(
    tokens: Set<string> = new Set()
): Lit {
    const result: Atomic = { tag: Tag.Lit, 
                        atomicity: Atomicity.Atomic, tokens };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenize(result);
    return result;
}

export function Concatenated(
    tokens: Set<string> = new Set(),
): Lit {
    const result: Concatenated = { tag: Tag.Lit, atomicity: Atomicity.Concatenated, tokens };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenize(result);
    return result;
}

export function Tokenized(
    tokens: Set<string> = new Set(),
): Tokenized {
    return { tag: Tag.Lit, atomicity: Atomicity.Tokenized, tokens };
}

// ****************************
// OPERATIONS ON VOCAB LITERALS
// ****************************

export function tokenize(v: Lit): Tokenized {
    if (v.atomicity === Atomicity.Tokenized) return v;
    const newTokens = flatmapSet(v.tokens, t => tokenizeUnicode(t));
    return Tokenized(newTokens);
}

export function sum(c1: Lit, c2: Lit): Lit {

    if (c1.atomicity === Atomicity.Tokenized || c2.atomicity === Atomicity.Tokenized) {
        // If either is tokenized, the result is too
        const splitC1 = tokenize(c1);
        const splitC2 = tokenize(c2);
        return Tokenized(union(splitC1.tokens, splitC2.tokens));
    }
    
    if (c1.atomicity === Atomicity.Concatenated || c2.atomicity === Atomicity.Concatenated) {
        // If either is concatenated, the result is too
        return Concatenated(union(c1.tokens, c2.tokens));
    }

    return Atomic(union(c1.tokens, c2.tokens))
}

export function product(c1: Lit, c2: Lit): Lit {
    const result = sum(c1, c2);
    if (result.atomicity === Atomicity.Atomic) {
        return Concatenated(result.tokens);
    }
    return result;
}

export function intersect(c1: Lit, c2: Lit): Lit {

    if (c1.atomicity === Atomicity.Atomic && c2.atomicity === Atomicity.Atomic) {
        // only when both operands are atomic is the result atomic
        return Atomic(union(c1.tokens, c2.tokens));
    }

    // otherwise it's Tokenized
    const splitV1 = tokenize(c1);
    const splitV2 = tokenize(c2);
    return Tokenized(union(splitV1.tokens, splitV2.tokens));
}

// **************************
// VOCAB COMBINING OPERATIONS
// **************************

export function sumKeys(c1: VocabDict, c2: VocabDict): VocabDict {
    return mapKeys(c1, c2, sum);
}

export function multKeys(c1: VocabDict, c2: VocabDict): VocabDict {
    return mapKeys(c1, c2, product);
}

export function intersectKeys(c1: VocabDict, c2: VocabDict): VocabDict {
    return mapKeys(c1, c2, intersect);
}

function mapKeys(
    c1: VocabDict, 
    c2: VocabDict,    
    op: (v1: Lit, v2: Lit) => Lit
): VocabDict {
    let result: VocabDict = {...c1};
    for (const [k, v] of Object.entries(c2)) {
        result = mapKey(result, k, v, op);
    }
    return result;
}

/**
 * mapKey is the workhorse for the bigger sumKeys/prodKeys/intersectKeys 
 * operations.  This isn't a straightforward map, though; it's complicated
 * by the fact that the values may be references to other keys, meaning we have
 * to follow reference chains and potentially re-direct them so that the result
 * contains all the keys of both original dicts.
 */
function mapKey(
    dict: VocabDict, 
    key: string, 
    newValue: Vocab,
    op: (v1: Lit, v2: Lit) => Lit,
): VocabDict {
    
    const origValue = dict[key];

    if (origValue === undefined) {
        const result = {...dict};
        result[key] = newValue;
        return result;
    }

    if (origValue.tag === Tag.Ref) {
        // ref + anything, follow the ref
        return mapKey(dict, origValue.key, newValue, op);
    }

    if (newValue.tag === Tag.Ref) {
        // lit + ref.  at some point (past or future), the value
        // of this ref will be copied into dict1; now is not the 
        // time to do it.  what we DO have to do is make it so 
        // key1 points there.  before this, though, we have to grab
        // anything currently in dict1[key1] and get it into 
        // dict1[value2.key], so it isn't overwritten by this.
        return mergeKeys(dict, key, newValue.key);
    }

    // lit + lit, the result is just the sum
    const result = {...dict};
    result[key] = op(origValue, newValue);
    return result;
}

/**
 * mergeKeys takes a single dictionary and sums the values of two keys.  This 
 * is necessary when calculating the vocabulary of MatchGrammars, and is also 
 * necessary for some of the reference chain fix-up of sumKeys.
 * 
 * Like sumKeys, this function is complicated by the need to follow references, 
 * but it's not as difficult because there's no need to fuse two different 
 * ref chains into one.  There's only one dict here.
 */
export function mergeKeys(
    dict: VocabDict, 
    key1: string, 
    key2: string, 
): VocabDict {

    // if the keys are the same we don't have to do anything
    if (key1 === key2) return dict;

    const value1 = dict[key1] || Atomic();
    const value2 = dict[key2] || Atomic();

    // if either is a reference, follow the reference
    if (value1.tag === Tag.Ref) return mergeKeys(dict, value1.key, key2);
    if (value2.tag === Tag.Ref) return mergeKeys(dict, key1, value2.key);

    // both are literals.  make a new entry and point 
    // both keys to it
    const result = {...dict};
    const newKey = "$" + randomString();
    result[key1] = Ref(newKey);
    result[key2] = Ref(newKey);
    result[newKey] = sum(value1, value2);
    return result;
}

export function toStr(v: Vocab): string {
    switch(v.tag) {
        case Tag.Lit: return `(${v.atomicity} ` + [...v.tokens].join(" ") + ")";
        case Tag.Ref: return v.key;
    }
}

export function vocabDictToStr(v: VocabDict): string {
    return Object.entries(v)
                 .map(([k,v]) => `${k}:${toStr(v)}`)
                 .join(","); 
}

export function getFromVocabDict(v: VocabDict, key: string): Lit | undefined {
    const value = v[key];
    if (value === undefined) return undefined;
    switch (value.tag) {
        case Tag.Lit: return value;
        case Tag.Ref: return getFromVocabDict(v, value.key);
    }
}