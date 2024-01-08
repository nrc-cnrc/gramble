import { renameTape } from "./tapes";
import { VOCAB_MAX_TOKENS } from "./utils/constants";
import { Dict, Func, flatmapSet, union, update } from "./utils/func";
import { Env } from "./utils/options";
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

export type VocabDict = Dict<Vocab>;

export const enum Tag {
    Lit = "Lit",
    Ref = "Ref",
    Sum = "Sum",
    Product = "Product",
    Intersect = "Intersect",
    Rename = "Rename"
};

export const enum Atomicity {
    Atomic = "Atomic",
    Concatenated = "Concatenated",
    Tokenized = "Tokenized",
}

export type Lit = Atomic
                | Concatenated
                | Tokenized;
                           
export type Vocab = Lit 
                  | Ref
                  | Sum
                  | Product
                  | Intersect
                  | Rename;

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

export type Ref = {
    tag: Tag.Ref,
    tape: string
}

export function Ref(tape: string): Ref {
    return { tag: Tag.Ref, tape }
}

export function Wildcard(tape: string): Vocab {
    return Sum(Tokenized(), Ref(tape));
}

export type Sum = {
    tag: Tag.Sum,
    c1: Vocab,
    c2: Vocab
}

export function Sum(c1: Vocab, c2: Vocab): Vocab {

    if (c1.tag != Tag.Lit || c2.tag != Tag.Lit) {
        return { tag: Tag.Sum, c1, c2 };
    }

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

export type Product = {
    tag: Tag.Product,
    c1: Vocab,
    c2: Vocab
}

/** 
 * multVocab returns the sum of the tokens, so we just use that function,
 * but with one difference: if the result would have been a VocabAtomic, 
 * it's now a VocabSeq
 */
export function Product(c1: Vocab, c2: Vocab): Vocab {

    if (c1.tag != Tag.Lit || c2.tag != Tag.Lit) {
        return { tag: Tag.Product, c1, c2 };
    }

    const result = Sum(c1, c2);
    if (result.tag === Tag.Lit && 
        result.atomicity === Atomicity.Atomic) 
        return Concatenated(result.tokens);
    return result;
}


export type Intersect = {
    tag: Tag.Intersect,
    c1: Vocab,
    c2: Vocab
}
export function Intersect(c1: Vocab, c2: Vocab): Vocab {

    if (c1.tag != Tag.Lit || c2.tag != Tag.Lit) {
        return { tag: Tag.Product, c1, c2 };
    }

    if (c1.atomicity === Atomicity.Atomic && c2.atomicity === Atomicity.Atomic) {
        // only when both operands are atomic is the result atomic
        return {
            tag: Tag.Lit,
            atomicity: Atomicity.Atomic,
            tokens: union(c1.tokens, c2.tokens)
        };
    }

    // otherwise it's string
    const splitV1 = tokenize(c1);
    const splitV2 = tokenize(c2);
    return {
        tag: Tag.Lit,
        atomicity: Atomicity.Tokenized,
        tokens: union(splitV1.tokens, splitV2.tokens)
    };
}

export type Rename = {
    tag: Tag.Rename,
    child: Vocab,
    fromTape: string,
    toTape: string
}

export function Rename(
    child: Vocab,
    fromTape: string,
    toTape: string
): Vocab {
    if (child.tag != Tag.Lit) {
        return { tag: Tag.Rename, child, fromTape, toTape };
    }

    return child;  // doesn't do anything to concrete vocabs
}

export function toStr(v: Vocab): string {
    switch (v.tag) {
        case Tag.Sum: 
            return toStr(v.c1) + "+" + toStr(v.c2);
        case Tag.Product: 
            return toStr(v.c1) + "+" + toStr(v.c2);
        case Tag.Intersect: 
            return toStr(v.c1) + "+" + toStr(v.c2);
        case Tag.Ref:
            return "$" + v.tape;
        case Tag.Rename:
            return `R(${v.fromTape}>${v.toTape})(${toStr(v.child)})`
        default:
            return `${v.atomicity}{` + [...v.tokens].join(",") + "}";
    }
}

/* RESOLVING 
*
* Resolving tapes is the process of replacing Refs
* inside TapeIDs into their corresponding TapeLits and in
* turn causing the collapse of the suspensions into TapeLits.
*/

export class VocabEnv extends Env<Vocab> {
    
    constructor(
        public vocabMap: Dict<Vocab>,
        public visited: Set<string>
    ) { 
        super({});
    }

    public update(v: Vocab): VocabEnv {
        if (v.tag !== Tag.Rename) return this;
        // we only care about Renames for this

        const newTapes: Dict<Vocab> = Object.create(this.vocabMap);
        Object.assign(newTapes, this.vocabMap);
        newTapes[v.fromTape] = this.vocabMap[v.toTape];
        delete newTapes[v.toTape];
        return update(this, { vocabMap: newTapes });
    }

}

export function resolveAll(vocabMap: Dict<Vocab>): Dict<Vocab> {
    let current = vocabMap;
    for (const [tapeName, vocab] of Object.entries(vocabMap)) {
        const env = new VocabEnv(current, new Set(tapeName));
        const newVocab = resolve(vocab, env);
        current[tapeName] = newVocab;
    }
    return current;
}

export function resolve(
    v: Vocab, 
    env: VocabEnv
): Vocab {
    const newV = map(v, resolve, env);
    switch (newV.tag) {
        case Tag.Ref:        return resolveRef(newV, env);
        default:             return newV;
    }
}

function simplify(v: Vocab): Vocab {
    switch (v.tag) {
        case Tag.Sum:       return Sum(v.c1, v.c2);
        case Tag.Product:   return Product(v.c1, v.c2);
        case Tag.Intersect: return Intersect(v.c1, v.c2);
        case Tag.Rename:    return Rename(v.child, v.fromTape, v.toTape);
        default:            return v;
    }
}

function resolveRef(
    v: Ref, 
    env: VocabEnv
): Vocab {
    if (env.visited.has(v.tape)) {
        return Atomic();
    }
    const referent = env.vocabMap[v.tape];
    if (referent === undefined) {
        throw new Error(`Unknown tape ${v.tape} in vocab unification, ` +
            `candidates are ${Object.keys(env.vocabMap)}`);
    }
    const newVisited = union(env.visited, [v.tape]);
    const newEnv = update(env, {visited:newVisited});
    return resolve(referent, newEnv);
}

function map(
    v: Vocab, 
    f: (v: Vocab, env: VocabEnv) => Vocab,
    env: VocabEnv
): Vocab {
    const newEnv = env.update(v);
    const clone = Object.create(Object.getPrototypeOf(v));
    for (const [k, child] of Object.entries(v)) {
        if (child.hasOwnProperty("tag")) {
            // it's a vocab
            clone[k] = f(child, newEnv);
            continue;
        }
        clone[k] = child;
    }
    return simplify(clone);
}


export class VocReplaceEnv extends Env<Vocab> {
    
    constructor(
        public refToReplace: string,
        public replacement: Vocab,
        public visited: Set<string>
    ) { 
        super({});
    }

    public update(v: Vocab): VocReplaceEnv {
        if (v.tag !== Tag.Rename) return this;

        const visited = new Set(this.visited);
        if (visited.has(v.toTape)) {
            visited.delete(v.toTape);
            visited.add(v.fromTape);
        } 
        const refToReplace = renameTape(this.refToReplace, v.toTape, v.fromTape);
        return update(this, {refToReplace,visited});
        // we only care about Renames for this

        /*
        const newTapes: Dict<Vocab> = Object.create(this.vocabMap);
        Object.assign(newTapes, this.vocabMap);
        newTapes[v.fromTape] = this.vocabMap[v.toTape];
        delete newTapes[v.toTape];
        return update(this, { vocabMap: newTapes });
        */
    }

}

export function vocReplace(
    v: Vocab, 
    env: VocReplaceEnv
): Vocab {
    const newV = vocReplaceMap(v, vocReplace, env);
    switch (newV.tag) {
        case Tag.Ref:        return vocReplaceRef(newV, env);
        default:             return newV;
    }
}

function vocReplaceRef(
    v: Ref, 
    env: VocReplaceEnv
): Vocab {
    if (env.visited.has(v.tape)) {
        return Atomic();
    }

    if (v.tape !== env.refToReplace) {
        return v;
    }

    const visited = union(env.visited, [v.tape]);
    const newEnv = update(env, {visited});
    return vocReplace(env.replacement, newEnv);
}

function vocReplaceMap(
    v: Vocab, 
    f: (v: Vocab, env: VocReplaceEnv) => Vocab,
    env: VocReplaceEnv
): Vocab {
    const newEnv = env.update(v);
    const clone = Object.create(Object.getPrototypeOf(v));
    for (const [k, child] of Object.entries(v)) {
        if (child.hasOwnProperty("tag")) {
            // it's a vocab
            clone[k] = f(child, newEnv);
            continue;
        }
        clone[k] = child;
    }
    return simplify(clone);
}
