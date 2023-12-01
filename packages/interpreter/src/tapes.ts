import { Dict, exhaustive, mapDict, union, update } from "./utils/func";
import { 
    Namespace
} from "./utils/namespace";
import * as Vocabs from "./vocab";
import { VocabDict } from "./vocab";

export type TapeDict = Dict<Tape>;

/**
 * Tape
 * 
 * This encapsulates information about a tape (like what its name is, what
 * its possible vocabulary is, what counts as concatenation and matching, 
 * etc.).  It doesn't, however, encapsulate a tape in the sense of keeping 
 * a sequence of character outputs; those are represented by linked lists made
 * of ConcatExprs.
 */
export class OldTape {

    constructor(
        public globalName: string,
        public atomic: boolean,
        public vocab: Set<string> = new Set()
    ) { }

    public registerTokens(chars: string[]): void {
        for (const char of chars) {
            if (char.length == 0) {
                continue;
            }
            this.vocab.add(char);
        }
    }
}

export class TapeNamespace extends Namespace<OldTape> { }

export function renameTape(
    tapeName: string, 
    fromTape: string, 
    toTape: string
): string {
    return (tapeName == fromTape) ? toTape : tapeName;
}

// New tape structures

export const enum Tag {
    Lit = "TapeLit",
    Ref = "TapeRef",
    Sum = "TapeSum",
    Product = "TapeProduct",
    Join = "TapeJoin",
    Rename = "TapeRename",
    Match = "TapeMatch",
    Unknown = "TapeUnknown"
}

export type Tape 
    = Lit
    | Ref
    | Rename
    | Sum
    | Product
    | Join
    | Match
    | Unknown; 


/** Lits are the actual tape information objects, containing
 * a map from tape names to vocabulary objects
 */
export type Lit = { 
    tag: Tag.Lit, 
    vocabMap: VocabDict 
};

export function Lit(tapes: VocabDict = {}): Lit {
    return { tag: Tag.Lit, vocabMap: tapes }
};

/**
 * A Ref is a placeholder in the tree, corresponding
 * to an Embed.  We can't know what tapes/vocab information
 * corresponds to this node (it might only be processed in the 
 * future).  This will later be resolved to a TapeLit.
 */
export type Ref = { tag: Tag.Ref, symbol: string };
export function Ref(s: string): Tape {
    return { tag: Tag.Ref, symbol: s }
};

export type Sum = { 
    tag: Tag.Sum, 
    c1: Tape, 
    c2: Tape 
};

export function Sum(c1: Tape, c2: Tape): Tape {

    if (c1.tag !== Tag.Lit || c2.tag !== Tag.Lit) 
        return { tag: Tag.Sum, c1, c2 };

    const resultTapes: VocabDict = {};
    Object.assign(resultTapes, c1.vocabMap);
    for (const [k,v] of Object.entries(c2.vocabMap)) {
        const other = c1.vocabMap[k];
        if (other === undefined) {
            resultTapes[k] = v;
            continue;
        }
        const newVocab = Vocabs.Sum(v, other);
        resultTapes[k] = newVocab;
    }

    return Lit(resultTapes);
    
}


export type Product = { 
    tag: Tag.Product, 
    c1: Tape, 
    c2: Tape 
};

export function Product(c1: Tape, c2: Tape): Tape {

    if (c1.tag !== Tag.Lit || c2.tag !== Tag.Lit) 
        return { tag: Tag.Product, c1, c2 };

    const resultTapes: VocabDict = {};
    Object.assign(resultTapes, c1.vocabMap);
    for (const [k,v] of Object.entries(c2.vocabMap)) {
        const other = c1.vocabMap[k];
        if (other === undefined) {
            resultTapes[k] = v;
            continue;
        }
        const newVocab = Vocabs.Product(v, other);
        resultTapes[k] = newVocab;
    }

    return Lit(resultTapes);
    
}

export type Join = { 
    tag: Tag.Join, 
    c1: Tape, 
    c2: Tape 
};

export function Join(c1: Tape, c2: Tape): Tape {

    if (c1.tag !== Tag.Lit || c2.tag !== Tag.Lit) 
        return { tag: Tag.Join, c1, c2 };

    const resultTapes: VocabDict = {};
    Object.assign(resultTapes, c1.vocabMap);
    for (const [k,v] of Object.entries(c2.vocabMap)) {
        const other = c1.vocabMap[k];
        if (other === undefined) {
            resultTapes[k] = v;
            continue;
        }
        const newVocab = Vocabs.Intersect(v, other);
        resultTapes[k] = newVocab;
    }

    return Lit(resultTapes);
    
}

export type Unknown = { tag: Tag.Unknown };
export function Unknown(): Tape {
    return { tag: Tag.Unknown };
}

/**
 * A TapeRename expresses a subspended rename operation.  If
 * we pass in a TapeLit to the `TapeRename()` smart constructor,
 * it does the operation immediately.  If we pass in anything else
 * (a ref or another suspend) it results in a TapeRename object
 * and the operation will be performed when it becomes available.
 */
export type Rename =  { 
    tag: Tag.Rename, 
    child: Tape, 
    fromTape: string, 
    toTape: string 
};

export function Rename(
    child: Tape, 
    fromTape: string, 
    toTape: string
): Tape {
    if (child.tag === Tag.Lit) {
        const renamedTapes: VocabDict = mapDict(child.vocabMap,
                        (_,v) => Vocabs.Rename(v, fromTape, toTape));
        let oldVocab = renamedTapes[fromTape];
        if (oldVocab === undefined) oldVocab = Vocabs.Atomic();
        delete renamedTapes[fromTape];
        renamedTapes[toTape] = oldVocab;
        return Lit(renamedTapes);
    }

    return { tag: Tag.Rename, child: child, 
             fromTape: fromTape, toTape: toTape }
}

export type Match =  { 
    tag: Tag.Match, 
    child: Tape, 
    fromTape: string, 
    toTape: string 
};

export function Match(
    child: Tape, 
    fromTape: string, 
    toTape: string
): Tape {
    if (child.tag === Tag.Lit) {
        const newTapes = Object.assign({}, child.vocabMap);
        const fromVocab = newTapes[fromTape] || Vocabs.Atomic();
        const oldToVocab = newTapes[toTape] || Vocabs.Atomic();
        newTapes[toTape] = Vocabs.Sum(fromVocab, oldToVocab);
        return Lit(newTapes);
    }

    return { tag: Tag.Match, child: child, 
             fromTape: fromTape, toTape: toTape }
}

/** 
 * Turning a [TapeInfo] to a string
 */ 
export function toStr(t: Tape): string {
    switch (t.tag) {
        case Tag.Unknown: return "?";
        case Tag.Lit: return litToStr(t);
        case Tag.Ref: return "$" + t.symbol;
        case Tag.Rename: return `${t.fromTape}>${t.toTape}(${toStr(t.child)})`;
        case Tag.Match: return `M${t.fromTape}>${t.toTape}(${toStr(t.child)})`;
        case Tag.Sum: return toStr(t.c1) + "+" + toStr(t.c2);
        case Tag.Product: return toStr(t.c1) + "⋅" + toStr(t.c2);
        case Tag.Join: return toStr(t.c1) + "⋈" + toStr(t.c2);
        default: exhaustive(t);
    }
}

function litToStr(t: Lit): string {
    const entries = Object.entries(t.vocabMap).map(([k,v]) => 
        `${k}:${Vocabs.toStr(v)}`);
    return "{" + entries.join(",") + "}"
}

/* RESOLVING 
*
* Resolving tapes is the process of replacing Refs
* inside TapeIDs into their corresponding TapeLits and in
* turn causing the collapse of the suspensions into TapeLits.
*/

type Env = {
    symbols: TapeDict,
    visited: Set<string>
}

export function resolveAll(symbols: TapeDict): TapeDict {
    let current = symbols;
    for (const [symbol, ref] of Object.entries(symbols)) {
        const env = {
            symbols: current,
            visited: new Set(symbol)
        }
        const newRef = resolve(ref, env);
        current[symbol] = newRef;
    }
    return current;
}

function resolve(
    t: Tape, 
    env: Env,
): Tape {
    switch (t.tag) {
        case Tag.Unknown: return Lit();
        case Tag.Lit:     return t;
        case Tag.Ref:     return resolveRef(t, env);
        default:          return map(t, resolve, env);
    }
}

function simplify(
    t: Tape,
): Tape {
    switch (t.tag) {
        case Tag.Rename:  return Rename(t.child, t.fromTape, t.toTape);
        case Tag.Sum:     return Sum(t.c1, t.c2);
        case Tag.Product: return Product(t.c1, t.c2);
        case Tag.Join:    return Join(t.c1, t.c2);
        case Tag.Match:   return Match(t.child, t.fromTape, t.toTape);
        default:          return t;
    }
}

function resolveRef(
    t: Ref, 
    env: Env,
): Tape {
    if (env.visited.has(t.symbol)) {
        return Lit();
    }
    const referent = env.symbols[t.symbol];
    if (referent === undefined) {
        // should never happen so long as FlattenCollections has been run
        throw new Error(`Unknown symbol ${t.symbol} in tape unification`);
    }
    const newEnv = update(env, {
        visited: union(env.visited, [t.symbol]),
    });
    return resolve(referent, newEnv);
}

function map(
    v: Tape, 
    f: (v: Tape, env: Env) => Tape,
    env: Env
): Tape {
    const clone = Object.create(Object.getPrototypeOf(v));
    for (const [k, child] of Object.entries(v)) {
        if (child.hasOwnProperty("tag")) {
            // it's a tape
            clone[k] = f(child, env);
            continue;
        }
        clone[k] = child;
    }
    return simplify(clone);
}