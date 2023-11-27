import { union } from "./utils/func";
import { tokenizeUnicode } from "./utils/strings";

/**
 * VocabInfo objects are either sets of tokens (whether those represent atomic multichar units or 
 * individual Unicode grapheme clusters) or they're placeholders (like a reference to a symbol/tape
 * pair), or they represent un-evaluated operations on vocab objects that can't yet complete because
 * one of the operands is a placeholder.
 */

export type VocabInfo = VocabAtomic
                      | VocabString
//                      | VocabSum
//                      | VocabProduct
//                      | VocabIntersection
//                      | VocabRef
//                      | VocabUnknown;

/**
 * Every vocab starts out with the assumption that it's VocabAtomic.
 * If it's both joined and concatenated, or if it grows too large,
 * it'll be split into a VocabString.
 */
export type VocabAtomic = {
    tag: "VocabAtomic",
    atoms: Set<string>,
    wildcard: boolean,
    joinable: boolean,
    concatenable: boolean,
}

const MAX_TOKENS = 1000;

export function VocabAtomic(
    atoms: Iterable<string>, 
    wildcard: boolean = false,
    joinable: boolean = false,
    concatenable: boolean = false
): VocabInfo {
    const result = { tag: "VocabAtomic", atoms: new Set(atoms), 
                     wildcard, joinable, concatenable } as VocabAtomic;
    // now check if it has to be broken up
    if (result.atoms.size > MAX_TOKENS) return splitVocab(result);
    if (result.joinable && result.concatenable) return splitVocab(result);
    return result;
}

/**
 * If a VocabAtomic gets too large or is both joinable & concatenable, we need
 * to split it apart into tokens instead.
 */
export type VocabString = {
    tag: "VocabTokens",
    tokens: Set<string>,
    wildcard: boolean,
}

export function VocabString(
    tokens: Iterable<string> = [],
    wildcard: boolean = false
): VocabString {
    return { tag: "VocabTokens", tokens: new Set(tokens), wildcard };
}

function splitVocab(v: VocabAtomic): VocabString {
    const tokens: Set<string> = new Set();
    for (const t of v.atoms) {
        for (const c of tokenizeUnicode(t)) {
            tokens.add(c);
        }
    }
    return VocabString(tokens, v.wildcard);
}

export type VocabRef = {
    tag: "VocabRef",
    symbol: string
}

export type VocabUnknown = {
    tag: "VocabUnknown"
}

/**
 * VocabSum, VocabProduct, and VocabIntersection represent suspended calculations
 * on Vocabs.
 */
export type VocabSum = {
    tag: "VocabSum",
    v1: VocabInfo,
    v2: VocabInfo
}

export type VocabProduct = {
    tag: "VocabProduct",
    v1: VocabInfo,
    v2: VocabInfo
}

export type VocabIntersection = {
    tag: "VocabIntersection",
    v1: VocabInfo,
    v2: VocabInfo
}

export function vocabUnion(v1: VocabString, v2: VocabString): VocabString {
    return {
        tag: "VocabTokens",
        wildcard: v1.wildcard || v2.wildcard,
        tokens: union(v1.tokens, v2.tokens)
    };
}

export function vocabIntersection(v1: VocabString, v2: VocabString): VocabString {
    const wildcard = v1.wildcard && v2.wildcard;
    //const concatenable = v1.concatenable && v2.concatenable;
    let tokens: Set<string> = new Set();
    if (v1.wildcard) tokens = new Set(v2.tokens);
    for (const t1 of v1.tokens) {
        if (v2.wildcard || v2.tokens.has(t1)) {
            tokens.add(t1);
        }
    }
    return VocabString(tokens, wildcard);
}

/*
export function vocabIntersection(v1: VocabAtomic, v2: VocabAtomic): VocabInfo {
    const wildcard = v1.wildcard && v2.wildcard;
    const concatenable = v1.concatenable && v2.concatenable;
    let tokens: Set<string> = new Set();
    if (v1.wildcard) tokens = new Set(v2.atoms);
    for (const t1 of v1.atoms) {
        if (v2.wildcard || v2.atoms.has(t1)) {
            tokens.add(t1);
        }
    }
    return VocabAtomic(tokens, wildcard, true, concatenable);
} */
