import { flatmapSet, mapSet, union, update } from "./utils/func";
import { tokenizeUnicode } from "./utils/strings";

/**
 * VocabInfo objects are either sets of tokens (whether those represent atomic multichar units or 
 * individual Unicode grapheme clusters) or they're placeholders (like a reference to a symbol/tape
 * pair), or they represent un-evaluated operations on vocab objects that can't yet complete because
 * one of the operands is a placeholder.
 */

export type VocabInfo = VocabAtomic
                      | VocabString;

export class WildcardSet {

    constructor(
        public items: Set<string> = new Set(),
        public wildcard: boolean = false
    ) { 
        this.items = items;
    }

    public get size(): number {
        return this.items.size;
    }

    public tokenize(): WildcardSet {
        const newItems = flatmapSet(this.items, t => tokenizeUnicode(t));
        return new WildcardSet(newItems, this.wildcard);
    }

    public union(other: WildcardSet): WildcardSet {
        return new WildcardSet(union(this.items, other.items), 
                            this.wildcard || other.wildcard)
    }

    public intersect(other: WildcardSet): WildcardSet {
        const wildcard = this.wildcard && other.wildcard;
        //const concatenable = v1.concatenable && v2.concatenable;
        let tokens: Set<string> = new Set();
        if (this.wildcard) tokens = new Set(other.items);
        for (const t1 of this.items) {
            if (other.wildcard || other.items.has(t1)) {
                tokens.add(t1);
            }
        }
        return new WildcardSet(tokens, wildcard);
    }

}

/**
 * Every vocab starts out with the assumption that it's VocabAtomic.
 * If it's both joined and concatenated, or if it grows too large,
 * it'll be split into a VocabString.
 */
export type VocabAtomic = {
    tag: "VocabAtomic",
    tokens: WildcardSet,
    joinable: boolean,
    concatenable: boolean,
}

const MAX_TOKENS = 1000;

export function VocabAtomic(
    tokens: WildcardSet = new WildcardSet(),
    joinable: boolean = false,
    concatenable: boolean = false
): VocabInfo {
    const result: VocabAtomic = { tag: "VocabAtomic", 
                            tokens, joinable, concatenable };
    // now check if it has to be broken up
    if (tokens.size > MAX_TOKENS) return splitVocab(result);
    if (joinable && concatenable) return splitVocab(result);
    return result;
}

/**
 * If a VocabAtomic gets too large or is both joinable & concatenable, we need
 * to split it apart into tokens instead.
 */
export type VocabString = {
    tag: "VocabString",
    tokens: WildcardSet
}

export function VocabString(
    tokens: WildcardSet = new WildcardSet(),
): VocabString {
    return { tag: "VocabString", tokens };
}

export const WILDCARD = VocabString(new WildcardSet(new Set(), true));

function splitVocab(v: VocabInfo): VocabString {
    if (v.tag === "VocabString") return v;
    const newTokens = v.tokens.tokenize();
    return VocabString(newTokens);
}

export function sumVocab(v1: VocabInfo, v2: VocabInfo): VocabInfo {
    
    // If either is a string, both must be
    if (v1.tag === "VocabString" || v2.tag === "VocabString") {
        const splitV1 = splitVocab(v1);
        const splitV2 = splitVocab(v2);
        const newTokens = splitV1.tokens.union(splitV2.tokens);
        return VocabString(newTokens);
    }

    const newTokens = v1.tokens.union(v2.tokens);
    return VocabAtomic(newTokens,
                       v1.joinable || v2.joinable,  
                       v1.concatenable || v2.concatenable);
}

export function multVocab(v1: VocabInfo, v2: VocabInfo): VocabInfo {
    
    const result = sumVocab(v1, v2);
    if (result.tag === "VocabString") return result;

    return VocabAtomic(result.tokens, result.joinable, true);
}

export function intersectVocab(v1: VocabInfo, v2: VocabInfo): VocabInfo {

    if (v1.tag === "VocabString" || v2.tag === "VocabString") {
        const splitV1 = splitVocab(v1);
        const splitV2 = splitVocab(v2);
        const newTokens = splitV1.tokens.intersect(splitV2.tokens);
        return VocabString(newTokens);
    }

    const newTokens = v1.tokens.intersect(v2.tokens);
    return VocabAtomic(newTokens, true, v1.concatenable || v2.concatenable);
}