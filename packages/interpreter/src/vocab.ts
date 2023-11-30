import { VOCAB_MAX_TOKENS } from "./utils/constants";
import { Dict, flatmapSet, mapSet, union, update } from "./utils/func";
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

export const enum VTag {
    Atomic,
    Seq,
    String,
    Ref,
    Sum,
    Product,
    Intersect,
    Rename
};

export type ConcreteVocab = VocabAtomic
                          | VocabSeq
                          | VocabString;

export type SuspendedVocab = VocabRef
                           | VocabSum
                           | VocabProduct
                           | VocabIntersect
                           | VocabRename;
                           
export type VocabInfo = ConcreteVocab | SuspendedVocab;

export type VocabAtomic = {
    tag: VTag.Atomic,
    tokens: Set<string>
}

export function VocabAtomic(
    tokens: Set<string> = new Set()
): VocabInfo {
    const result: VocabAtomic = { tag: VTag.Atomic, tokens };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenizeVocab(result);
    return result;
}

export type VocabSeq = {
    tag: VTag.Seq,
    tokens: Set<string>,
}

export function VocabSeq(
    tokens: Set<string> = new Set(),
): VocabInfo {
    const result: VocabSeq = { tag: VTag.Seq, tokens };
    if (tokens.size > VOCAB_MAX_TOKENS) return tokenizeVocab(result);
    return result;
}

export type VocabString = {
    tag: VTag.String,
    tokens: Set<string>
}

export function VocabString(
    tokens: Set<string> = new Set(),
): VocabString {
    return { tag: VTag.String, tokens };
}

function tokenizeVocab(v: ConcreteVocab): VocabString {
    if (v.tag === VTag.String) return v;
    const newTokens = flatmapSet(v.tokens, t => tokenizeUnicode(t));
    return VocabString(newTokens);
}

export type VocabRef = {
    tag: VTag.Ref,
    tape: string
}

export function VocabRef(tape: string): VocabRef {
    return { tag: VTag.Ref, tape }
}

export function VocabWildcard(tape: string): VocabInfo {
    return VocabSum(VocabString(), VocabRef(tape));
}

export type VocabSum = {
    tag: VTag.Sum,
    c1: VocabInfo,
    c2: VocabInfo
}

export function VocabSum(c1: VocabInfo, c2: VocabInfo): VocabInfo {

    if (vocabIsSuspended(c1) || vocabIsSuspended(c2)) {
        return { tag: VTag.Sum, c1, c2 };
    }

    // If either is a string, both must be.  tokenize them both,
    // if either is already tokenized it won't matter
    if (c1.tag === VTag.String || c2.tag === VTag.String) {
        const splitC1 = tokenizeVocab(c1);
        const splitC2 = tokenizeVocab(c2);
        return {
            tag: VTag.String,
            tokens: union(splitC1.tokens, splitC2.tokens)
        };
    }
    
    // If either is a string, both become seq
    if (c1.tag === VTag.Seq || c2.tag === VTag.Seq) {
        return {
            tag: VTag.Seq,
            tokens: union(c1.tokens, c2.tokens)
        };
    }

    return {
        tag: VTag.Atomic,
        tokens: union(c1.tokens, c2.tokens)
    };
}

export type VocabProduct = {
    tag: VTag.Product,
    c1: VocabInfo,
    c2: VocabInfo
}

/** 
 * multVocab returns the sum of the tokens, so we just use that function,
 * but with one difference: if the result would have been a VocabAtomic, 
 * it's now a VocabSeq
 */
export function VocabProduct(c1: VocabInfo, c2: VocabInfo): VocabInfo {

    if (vocabIsSuspended(c1) || vocabIsSuspended(c2)) {
        return { tag: VTag.Product, c1, c2 };
    }

    const result = VocabSum(c1, c2);
    if (result.tag === VTag.Atomic) return VocabSeq(result.tokens);
    return result;
}


export type VocabIntersect = {
    tag: VTag.Intersect,
    c1: VocabInfo,
    c2: VocabInfo
}
export function VocabIntersect(c1: VocabInfo, c2: VocabInfo): VocabInfo {

    if (vocabIsSuspended(c1) || vocabIsSuspended(c2)) {
        return { tag: VTag.Product, c1, c2 };
    }

    if (c1.tag === VTag.Atomic && c2.tag === VTag.Atomic) {
        // only when both operands are atomic is the result atomic
        return {
            tag: VTag.Atomic,
            tokens: union(c1.tokens, c2.tokens)
        };
    }

    // otherwise it's string
    const splitV1 = tokenizeVocab(c1);
    const splitV2 = tokenizeVocab(c2);
    return {
        tag: VTag.String,
        tokens: union(splitV1.tokens, splitV2.tokens)
    };
}

export type VocabRename = {
    tag: VTag.Rename,
    child: VocabInfo,
    fromTape: string,
    toTape: string
}

export function VocabRename(
    child: VocabInfo,
    fromTape: string,
    toTape: string
): VocabInfo {
    if (vocabIsSuspended(child)) {
        return { tag: VTag.Rename, child, fromTape, toTape };
    }

    return child;  // doesn't do anything to concrete vocabs
}

export function vocabToStr(v: VocabInfo): string {
    switch (v.tag) {
        case VTag.Sum: 
            return vocabToStr(v.c1) + "+" + vocabToStr(v.c2);
        case VTag.Product: 
            return vocabToStr(v.c1) + "+" + vocabToStr(v.c2);
        case VTag.Intersect: 
            return vocabToStr(v.c1) + "+" + vocabToStr(v.c2);
        case VTag.Ref:
            return "$" + v.tape;
        case VTag.Rename:
            return `${v.fromTape}>${v.toTape}(${vocabToStr(v.child)})`
        default:
            return "{" + [...v.tokens].join(",") + "}";
    }
}

export function vocabIsSuspended(v: VocabInfo): v is SuspendedVocab {
    switch (v.tag) {
        case VTag.Atomic:
        case VTag.Seq:
        case VTag.String:   return false;
        default:            return true;
    }
}

export function unifyVocabSymbols(symbols: Dict<VocabInfo>): Dict<VocabInfo> {
    let currentSymbols = symbols;
    for (const [symbol, ref] of Object.entries(symbols)) {
        const visited = new Set(symbol);
        const newRef = unify(ref, currentSymbols, visited);
        currentSymbols[symbol] = newRef;
    }
    return currentSymbols;
}

function unify(
    v: VocabInfo, 
    tapes: Dict<VocabInfo>,
    visited: Set<string>
): VocabInfo {
    switch (v.tag) {
        case VTag.Ref:        return unifyRef(v, tapes, visited);
        case VTag.Sum:        return unifySum(v, tapes, visited);
        case VTag.Product:    return unifyProduct(v, tapes, visited);
        case VTag.Intersect:  return unifyIntersect(v, tapes, visited);
        case VTag.Rename:     return unifyRename(v, tapes, visited);
        default:              return v;
    }
}

function unifyRef(
    v: VocabRef, 
    tapes: Dict<VocabInfo>,
    visited: Set<string>
): VocabInfo {
    if (visited.has(v.tape)) {
        return VocabAtomic();
    }
    const referent = tapes[v.tape];
    if (referent === undefined) {
        // should never happen so long as FlattenCollections has been run
        throw new Error(`Unknown tape ${v.tape} in vocab unification`);
    }
    const newVisited = union(visited, [v.tape]);
    return unify(referent, tapes, newVisited);
}

function unifySum(
    v: VocabSum, 
    tapes: Dict<VocabInfo>,
    visited: Set<string>
): VocabInfo {
    const newC1 = unify(v.c1, tapes, visited);
    const newC2 = unify(v.c2, tapes, visited);
    return VocabSum(newC1, newC2);
}

function unifyProduct(
    v: VocabProduct, 
    tapes: Dict<VocabInfo>,
    visited: Set<string>
): VocabInfo {
    const newC1 = unify(v.c1, tapes, visited);
    const newC2 = unify(v.c2, tapes, visited);
    return VocabProduct(newC1, newC2);
}

function unifyIntersect(
    v: VocabIntersect, 
    tapes: Dict<VocabInfo>,
    visited: Set<string>
): VocabInfo {
    const newC1 = unify(v.c1, tapes, visited);
    const newC2 = unify(v.c2, tapes, visited);
    return VocabIntersect(newC1, newC2);
}

function unifyRename(
    v: VocabRename, 
    tapes: Dict<VocabInfo>, 
    visited: Set<string>
): VocabInfo {
    const newTapes = Object.create(Object.getPrototypeOf(tapes));
    Object.assign(newTapes, tapes);
    newTapes[v.fromTape] = tapes[v.toTape];
    delete newTapes[v.toTape];
    const newChild = unify(v.child, newTapes, visited);
    return VocabRename(newChild, v.fromTape, v.toTape);
}
