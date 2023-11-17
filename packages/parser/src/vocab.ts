import { union } from "./utils/func";
import { tokenizeUnicode } from "./utils/strings";

/**
 * VocabInfo objects are either sets of tokens (whether those represent atomic multichar units or 
 * individual Unicode grapheme clusters) or they're placeholders (like a reference to a symbol/tape
 * pair), or they represent un-evaluated operations on vocab objects that can't yet complete because
 * one of the operands is a placeholder.
 */

export type VocabInfo = VocabAtomic
                      | VocabTokens
                      | VocabSum
                      | VocabProduct
                      | VocabIntersection
                      | VocabRef
                      | VocabUnknown;

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
export type VocabTokens = {
    tag: "VocabTokens",
    tokens: Set<string>,
    wildcard: boolean,
}

export function VocabTokens(tokens: Iterable<string>, wildcard: boolean): VocabTokens {
    return { tag: "VocabTokens", tokens: new Set(tokens), wildcard };
}

function splitVocab(v: VocabAtomic): VocabTokens {
    const tokens: Set<string> = new Set();
    for (const t of v.atoms) {
        for (const c of tokenizeUnicode(t)) {
            tokens.add(c);
        }
    }
    return VocabTokens(tokens, v.wildcard);
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

export function vocabUnion(v1: VocabAtomic, v2: VocabAtomic) {
    return {
        wildcard: v1.wildcard || v2.wildcard,
        tokens: union(v1.atoms, v2.atoms)
    };
}

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
}
