import { VOCAB_MAX_TOKENS } from "./utils/constants";
import { Dict, flatmapSet, union } from "./utils/func";
import { randomString } from "./utils/random";
import { tokenizeUnicode } from "./utils/strings";

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
export type Lit = Atomic
                | Concatenated
                | Tokenized;
                           
export type Vocab = Lit | Ref;

export type Ref = {
    tag: Tag.Ref,
    key: string 
}

export function Ref(key: string): Ref {
    return { tag: Tag.Ref, key };
}

export type Atomic = {
    tag: Tag.Lit,
    atomicity: Atomicity.Atomic,
    tokens: Set<string>
}

export function Atomic(
    tokens: Set<string> = new Set()
): Lit {
    const result: Atomic = { tag: Tag.Lit, 
                        atomicity: Atomicity.Atomic, tokens };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenize(result);
    return result;
}

export type Concatenated = {
    tag: Tag.Lit,
    atomicity: Atomicity.Concatenated,
    tokens: Set<string>,
}

export function Concatenated(
    tokens: Set<string> = new Set(),
): Lit {
    const result: Concatenated = { tag: Tag.Lit, atomicity: Atomicity.Concatenated, tokens };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenize(result);
    return result;
}

export type Tokenized = {
    tag: Tag.Lit,
    atomicity: Atomicity.Tokenized,
    tokens: Set<string>
}

export function Tokenized(
    tokens: Set<string> = new Set(),
): Tokenized {
    return { tag: Tag.Lit, atomicity: Atomicity.Tokenized, tokens };
}

function tokenize(v: Lit): Tokenized {
    if (v.atomicity === Atomicity.Tokenized) return v;
    const newTokens = flatmapSet(v.tokens, t => tokenizeUnicode(t));
    return Tokenized(newTokens);
}

/**
 * sumKeys takes two VocabDicts and returns their sum.  
 */
export function sumKeys(c1: VocabDict, c2: VocabDict): VocabDict {
    let result: VocabDict = {...c1};
    for (const [k, v] of Object.entries(c2)) {
        result = sumKey(result, k, v);
    }
    return result;
}

/**
 * sumKey is the workhorse for the bigger sumKeys operation.  It's complicated
 * by the fact that the values may be references to other keys, meaning we have
 * to follow reference chains and potentially re-direct them so that the result
 * contains all the keys of both original dicts.
 */
function sumKey(
    dict: VocabDict, 
    key: string, 
    newValue: Vocab
): VocabDict {
    
    const origValue = dict[key] || Atomic();

    if (origValue.tag === Tag.Ref) {
        // ref + anything, follow the ref
        return sumKey(dict, origValue.key, newValue);
    }

    if (newValue.tag === Tag.Ref) {
        // lit + ref.  at some point (past or future), the value
        // of this ref will be copied into dict1; now is not the 
        // time to do it.  what we DO have to do is make it so 
        // key1 points there.  before this, though, we have to grab
        // anything currently in dict1[key1] and get it into 
        // dict1[value2.key], so it isn't overwritten by this.
        const result = mergeKeys(dict, key, newValue.key);
        return result;
    }

    // lit + lit, the result is just the sum
    const result = {...dict};
    result[key] = sum(origValue, newValue);
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
        case Tag.Lit: return "{" + [...v.tokens].join(",") + "}";
        case Tag.Ref: return v.key;
    }
}

export function vocabDictToStr(v: VocabDict): string {
    return Object.entries(v)
                 .map(([k,v]) => `${k}:${toStr(v)}`)
                 .join(","); 
}


export function sum(c1: Lit, c2: Lit): Lit {

    // If either is a string, both must be.  tokenize them both,
    // if either is already tokenized it won't matter
    if (c1.atomicity === Atomicity.Tokenized || 
        c2.atomicity === Atomicity.Tokenized) {
        const splitC1 = tokenize(c1);
        const splitC2 = tokenize(c2);
        return {
            tag: Tag.Lit,
            atomicity: Atomicity.Tokenized,
            tokens: union(splitC1.tokens, splitC2.tokens)
        };
    }
    
    // If either is a string, both become seq
    if (c1.atomicity === Atomicity.Concatenated || 
        c2.atomicity === Atomicity.Concatenated) {
        return {
            tag: Tag.Lit,
            atomicity: Atomicity.Concatenated,
            tokens: union(c1.tokens, c2.tokens)
        };
    }

    return {
        tag: Tag.Lit,
        atomicity: Atomicity.Atomic,
        tokens: union(c1.tokens, c2.tokens)
    };
}