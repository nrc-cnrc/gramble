import { VOCAB_MAX_TOKENS } from "./utils/constants";
import { flatmapSet, mapSet, union, update } from "./utils/func";
import { tokenizeUnicode } from "./utils/strings";


/**
 * For efficiency's sake, if long tokens like "abracadabra"
 * CAN be treated as single units for the purposes of calculating
 * derivatives, they should.  However, sometimes doing that will
 * cause us to get the wrong answer.  Consider intersecting two units 
 * with what should be their product:
 * 
 *    L = helloworld & (hello ⋅ world)
 * 
 * If we treat this as a string, everything goes fine:
 * 
 *    D_{h}(L) = elloworld & (ello ⋅ world)
 * 
 * If we treat "helloworld", "hello", and "world" as atomic units,
 * however, this goes very wrong.  The derivative of "hello" 
 * w.r.t. "helloworld" is null!
 * 
 *    D_{helloworld}(L) = 0
 * 
 * To calculate this, we assume every literal contributes a VocabAtomic
 * until proven otherwise.  Atomics can be alternated and joined, but
 * if they're put into sequence (e.g. by a Seq or Repeat)
 * they become a VocabSeq.  
 * 
 * The elements of a VocabSeq can be put in a sequence; in many
 * case Glosses will be VocabSeqs.  Each piece of `1SG-love-V` is
 * a unit but there's no reason yet to treat the units as being made
 * up of characters.
 * 
 * However, if a VocabSeq undergoes a join, it becomes a VocabString and
 * the elements of the vocab are tokenized into indivdual characters
 * according to Gramble's character rules.
 */

export type VocabInfo = VocabAtomic
                      | VocabSeq
                      | VocabString;

type VocabTag = VocabInfo["tag"];

export type VocabAtomic = {
    tag: "VocabAtomic",
    tokens: Set<string>,
    wildcard: boolean,
}

export function VocabAtomic(
    tokens: Set<string> = new Set(),
    wildcard: boolean = false,
): VocabInfo {
    const result: VocabAtomic = { tag: "VocabAtomic", tokens, wildcard };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenizeVocab(result);
    return result;
}

export type VocabSeq = {
    tag: "VocabSeq",
    tokens: Set<string>,
    wildcard: boolean,
}

export function VocabSeq(
    tokens: Set<string> = new Set(),
    wildcard: boolean = false,
): VocabInfo {
    const result: VocabSeq = { tag: "VocabSeq", tokens, wildcard };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenizeVocab(result);
    return result;
}

export type VocabString = {
    tag: "VocabString",
    tokens: Set<string>,
    wildcard: boolean,
}

export function VocabString(
    tokens: Set<string> = new Set(),
    wildcard: boolean = false,
): VocabString {
    return { tag: "VocabString", tokens, wildcard };
}

export const WILDCARD = VocabString(new Set(), true);

function tokenizeVocab(v: VocabInfo): VocabString {
    if (v.tag === "VocabString") return v;
    const newTokens = flatmapSet(v.tokens, t => tokenizeUnicode(t));
    return VocabString(newTokens, v.wildcard);
}

export function sumVocab(v1: VocabInfo, v2: VocabInfo): VocabInfo {

    // If either is a string, both must be.  tokenize them both,
    // if either is already tokenized it won't matter
    if (v1.tag === "VocabString" || v2.tag === "VocabString") {
        const splitV1 = tokenizeVocab(v1);
        const splitV2 = tokenizeVocab(v2);
        return sumVocabAux("VocabString", splitV1, splitV2);
    }
    
    // If either is a string, both become seq
    if (v1.tag === "VocabSeq" || v2.tag === "VocabSeq") {
        return sumVocabAux("VocabSeq", v1, v2);
    }

    return sumVocabAux("VocabAtomic", v1, v2);
}

function sumVocabAux(
    resultTag: VocabTag,
    s1: VocabInfo, 
    s2: VocabInfo
): VocabInfo {
    return {
        tag: resultTag,
        tokens: union(s1.tokens, s2.tokens),
        wildcard: s1.wildcard || s2.wildcard
    };
}

/** 
 * multVocab returns the sum of the tokens, so we just use that function,
 * but with one difference: if the result would have been a VocabAtomic, 
 * it's now a VocabSeq
 */
export function multVocab(v1: VocabInfo, v2: VocabInfo): VocabInfo {
    const result = sumVocab(v1, v2);
    if (result.tag === "VocabAtomic") 
        return VocabSeq(result.tokens, result.wildcard);
    return result;
}

export function intersectVocab(v1: VocabInfo, v2: VocabInfo): VocabInfo {
    if (v1.tag === "VocabAtomic" && v2.tag === "VocabAtomic") {
        // only when both operands are atomic is the result atomic
        return intersectVocabAux("VocabAtomic", v1, v2);
    }

    // otherwise it's string
    const splitV1 = tokenizeVocab(v1);
    const splitV2 = tokenizeVocab(v2);
    return intersectVocabAux("VocabString", splitV1, splitV2);
}

function intersectVocabAux(
    resultTag: VocabTag,
    s1: VocabInfo, 
    s2: VocabInfo
): VocabInfo {
    const wildcard = s1.wildcard && s2.wildcard;
    let tokens: Set<string> = new Set();
    if (s1.wildcard) tokens = new Set(s2.tokens);
    for (const t1 of s1.tokens) {
        if (s2.wildcard || s2.tokens.has(t1)) {
            tokens.add(t1);
        }
    }
    return {tag: resultTag, tokens, wildcard };
}

export function vocabToStr(s: VocabInfo): string {
    const tokens = [...s.tokens];
    if (s.wildcard) tokens.push("*");
    return "{" + tokens.join(",") + "}";
}