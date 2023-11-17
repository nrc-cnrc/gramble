import { union } from "./utils/func";

export type VocabInfo = {
    joinable: boolean,
    concatenable: boolean,
    vocab: VocabSet,
}

export type VocabSet = {
    tokens: Set<string>,
    wildcard: boolean,
}

export function VocabSet(tokens: Iterable<string>, wildcard: boolean = false): VocabSet {
    return {
        tokens: new Set(tokens), 
        wildcard
    }
}

export function vocabUnion(v1: VocabSet, v2: VocabSet) {
    return {
        wildcard: v1.wildcard || v2.wildcard,
        tokens: union(v1.tokens, v2.tokens)
    };
}

export function vocabIntersection(v1: VocabSet, v2: VocabSet): VocabSet {
    const wildcard = v1.wildcard && v2.wildcard;
    let tokens: Set<string> = new Set();
    if (v1.wildcard) tokens = new Set(v2.tokens);
    for (const t1 of v1.tokens) {
        if (v2.wildcard || v2.tokens.has(t1)) {
            tokens.add(t1);
        }
    }
    return { wildcard, tokens };
}
