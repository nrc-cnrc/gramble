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
    name: string 
}

export function Ref(name: string): Ref {
    return { tag: Tag.Ref, name };
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

/*
function sumDict(c1: VocabDict, c2: VocabDict): VocabDict {
    let result: VocabDict = {...c1};
    for (const [key, value] of Object.entries(c2)) {
        result = sumVocabToDict(result, key, value);
    }

    return result;
}
*/

function sumVocabToDict(
    dict1: VocabDict, 
    key: string, 
    dict2: VocabDict, 
): VocabDict {
    let result = {...dict1};

    const orig = dict1[key];
    const newValue = dict2[key];
    if (newValue === undefined) return result;
    if (orig === undefined) {
        result[key] = dict2[key];
        return result;
    }

    if (orig.tag === Tag.Ref) {
        return sumVocabToDict(dict1, orig.name, dict2);
    }

    if (newValue.tag === Tag.Ref) {
        result = mergeKeys(dict1, key, newValue.name);

        return result;
    }
    
    result[key] = sum(orig, newValue);
    return result;
}

export function mergeKeys(dict: VocabDict, key1: string, key2: string): VocabDict {

    // if the keys are the same they're already merged
    if (key1 === key2) return dict;

    const value1 = dict[key1];
    const value2 = dict[key2];
    
    // in practice neither should be undefined, but just in case
    if (value2 === undefined) return dict;

    if (value1 === undefined) {    
        const result = {...dict};
        result[key1] = Ref(key2);
        return result;
    }

    // if either is a reference, follow the reference
    if (value1.tag === Tag.Ref) {
        return mergeKeys(dict, value1.name, key2);
    }

    if (value2.tag === Tag.Ref) {
        return mergeKeys(dict, key1, value2.name);
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
        case Tag.Ref: return v.name;
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