import { Atomic, Lit, Tag, VocabDict } from "../../interpreter/src/vocab";

export function getFromVocabDict(v: VocabDict, key: string): Lit {
    const value = v[key];
    if (value === undefined) return Atomic(new Set());
    switch (value.tag) {
        case Tag.Lit: return value;
        case Tag.Ref: return getFromVocabDict(v, value.key);
    }
}
