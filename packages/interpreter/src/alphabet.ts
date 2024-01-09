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

export function sumKeys(c1: VocabDict, c2: VocabDict): VocabDict {
    let result: VocabDict = {...c1};
    let visited: Set<string> = new Set();
    for (const key of Object.keys(c2)) {
        result = sumKey(result, c2, key, visited);
        visited.add(key);
    }
    return result;
}

function sumKey(
    dict1: VocabDict, 
    dict2: VocabDict, 
    key: string, 
    visited: Set<string>
): VocabDict {
    if (visited.has(key)) return dict1;

    console.log();
    console.log(`dict1 is ${vocabDictToStr(dict1)}`);
    console.log(`dict2 is ${vocabDictToStr(dict2)}`);
    console.log(`summing on key ${key}`);
    
    const value1 = dict1[key];
    const value2 = dict2[key];
    const newVisited = new Set([...visited, key]);

    if (value2 === undefined) return dict1;

    if (value1 === undefined) {
        const result = {...dict1};
        result[key] = dict2[key];
        return result;
    }

    if (value1.tag === Tag.Ref) {
        // anything + ref, follow the ref
        const newDict2 = mergeKeys(dict2, value1.key, key);
        return sumKey(dict1, newDict2, value1.key, newVisited);
    }

    if (value2.tag === Tag.Ref) {
        // lit + ref, move the lit to the ref's key, 
        // and then sum on that key
        //const newDict2 = mergeKeys(dict1, key, value2.key);
        const result = sumKey(dict1, dict2, value2.key, newVisited);
        return result;
    }

    // lit + lit, the result is just the sum
    const result = {...dict1};
    result[key] = sum(value1, value2);
    return result;
}

export function mergeKeys(dict: VocabDict, key1: string, key2: string): VocabDict {

    // if the keys are the same we don't have to do anything
    if (key1 === key2) return dict;

    const value1 = dict[key1];
    const value2 = dict[key2];
    
    if (value1 === undefined && value2 === undefined) return dict;

    if (value1 === undefined) {    
        const result = {...dict};
        result[key1] = Ref(key2);
        return result;
    }

    if (value2 === undefined) {
        const result = {...dict};
        result[key2] = Ref(key1);
        return result;
    }

    // if either is a reference, follow the reference
    if (value1.tag === Tag.Ref) {
        return mergeKeys(dict, value1.key, key2);
    }

    if (value2.tag === Tag.Ref) {
        return mergeKeys(dict, key1, value2.key);
    }

    // both are literals.  make a new entry and point 
    // both keys to it
    const newKey = "$" + randomString(3);
    const newValue = sum(value1, value2);
    const result = {...dict};
    result[key1] = Ref(newKey);
    result[key2] = Ref(newKey);
    result[newKey] = newValue;
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