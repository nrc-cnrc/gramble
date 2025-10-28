import { 
    Dict, 
    exhaustive, 
    union, 
    update 
} from "./utils/func.js";


export type TapeDict = Dict<TapeSet>;

export function renameTape(
    tapeName: string, 
    fromTape: string, 
    toTape: string
): string {
    return (tapeName == fromTape) ? toTape : tapeName;
}

export const enum Tag {
    Lit = "TapeLit",
    Ref = "TapeRef",
    Sum = "TapeSum",
    Product = "TapeProduct",
    Join = "TapeJoin",
    Rename = "TapeRename",
    Single = "TapeSingle",
    Match = "TapeMatch",
    Cursor = "TapeCursor",
    Unknown = "TapeUnknown"
}

export type TapeSet = Lit
                    | Ref
                    | Rename
                    | Single
                    | Sum
                    | Product
                    | Join
                    | Match
                    | Cursor
                    | Unknown; 

/** Lits are the actual tape information objects, containing
 * a map from tape names to vocabulary objects
 */
export type Lit = { 
    tag: Tag.Lit, 
    tapeNames: Set<string>,
};

export function Lit(
    tapes: Set<string> = new Set(), 
): Lit {
    return { tag: Tag.Lit, tapeNames: tapes }
};

/**
 * A Ref is a placeholder in the tree, corresponding
 * to an Embed.  We can't know what tapes/vocab information
 * corresponds to this node (it might only be processed in the 
 * future).  This will later be resolved to a TapeLit.
 */
export type Ref = { tag: Tag.Ref, symbol: string };
export function Ref(s: string): TapeSet {
    return { tag: Tag.Ref, symbol: s }
};

export type Sum = { 
    tag: Tag.Sum, 
    c1: TapeSet, 
    c2: TapeSet 
};

export function Sum(c1: TapeSet, c2: TapeSet): TapeSet {

    if (c1.tag !== Tag.Lit || c2.tag !== Tag.Lit) 
        return { tag: Tag.Sum, c1, c2 };

    const newTapes = union(c1.tapeNames, c2.tapeNames);
    return Lit(newTapes);
}


export type Product = { 
    tag: Tag.Product, 
    c1: TapeSet, 
    c2: TapeSet 
};

export function Product(c1: TapeSet, c2: TapeSet): TapeSet {

    if (c1.tag !== Tag.Lit || c2.tag !== Tag.Lit) 
        return { tag: Tag.Product, c1, c2 };

    const newTapes = union(c1.tapeNames, c2.tapeNames);
    return Lit(newTapes);
    
}

export type Join = { 
    tag: Tag.Join, 
    c1: TapeSet, 
    c2: TapeSet 
};

export function Join(c1: TapeSet, c2: TapeSet): TapeSet {

    if (c1.tag !== Tag.Lit || c2.tag !== Tag.Lit) 
        return { tag: Tag.Join, c1, c2 };

    const newTapes = union(c1.tapeNames, c2.tapeNames);
    return Lit(newTapes);
    
}

export type Unknown = { tag: Tag.Unknown };
export function Unknown(): TapeSet {
    return { tag: Tag.Unknown };
}

/**
 * A TapeRename expresses a subspended rename operation.  If
 * we pass in a TapeLit to the `TapeRename()` smart constructor,
 * it does the operation immediately.  If we pass in anything else
 * (a ref or another suspend) it results in a TapeRename object
 * and the operation will be performed when it becomes available.
 */
export type Rename = { 
    tag: Tag.Rename, 
    child: TapeSet, 
    fromTape: string, 
    toTape: string 
};

export function Rename(
    child: TapeSet, 
    fromTape: string, 
    toTape: string
): TapeSet {
    if (child.tag === Tag.Lit) {
        const newTapes = new Set(child.tapeNames);
        newTapes.delete(fromTape)
        newTapes.add(toTape);
        return Lit(newTapes);
    }
    return { tag: Tag.Rename, child, fromTape, toTape }
}

/**
 * A Single operation expresses what a SingleTapeGrammar does to the
 * tape structure: a rename from a single tape with an unknown name to
 * another name.  While this is, abstractly, a Rename, using the Rename
 * type/function above won't work, because it's grabbing the vocabulary
 * from a known tape name, and we don't know what that name is.
 */

export type Single = {
    tag: Tag.Single,
    child: TapeSet,
    tapeName: string
}

export function Single(
    child: TapeSet,
    tapeName: string,
): TapeSet {
    if (child.tag === Tag.Lit) {
        const newTapes = [ tapeName ];
        return Lit(new Set(newTapes));
    }

    return { tag: Tag.Single, child, tapeName }
}

export type Match =  { 
    tag: Tag.Match, 
    child: TapeSet, 
    inputTape: string, 
    outputTape: string 
};

export function Match(
    child: TapeSet, 
    inputTape: string, 
    outputTape: string
): TapeSet {
    if (child.tag === Tag.Lit) {
        const newTapes = new Set(child.tapeNames);
        newTapes.add(outputTape);
        return Lit(newTapes);
    }

    return { tag: Tag.Match, child, inputTape, outputTape }
}

export type Cursor = {
    tag: Tag.Cursor,
    child: TapeSet,
    tapeName: string
};

export function Cursor(
    child: TapeSet,
    tapeName: string
): TapeSet {
    if (child.tag !== Tag.Lit) 
        return { tag: Tag.Cursor, child, tapeName };

    const newTapes = [...child.tapeNames].filter(t => t !== tapeName);
    return Lit(new Set(newTapes));
}

/** 
 * Turning a [TapeInfo] to a string
 */ 
export function toStr(t: TapeSet): string {
    switch (t.tag) {
        case Tag.Unknown: return "?";
        case Tag.Lit: return `{${[...t.tapeNames]}}`;
        case Tag.Ref: return "$" + t.symbol;
        case Tag.Rename: return `${t.fromTape}>${t.toTape}(${toStr(t.child)})`;
        case Tag.Single: return `S_${t.tapeName}(${toStr(t.child)})`
        case Tag.Match: return `M_${t.inputTape}>${t.outputTape}(${toStr(t.child)})`;
        case Tag.Sum: return toStr(t.c1) + "+" + toStr(t.c2);
        case Tag.Product: return toStr(t.c1) + "⋅" + toStr(t.c2);
        case Tag.Join: return toStr(t.c1) + "⋈" + toStr(t.c2);
        case Tag.Cursor: return `C_${t.tapeName}(${toStr(t.child)})`;
        default: exhaustive(t);
    }
}

export function tapeDictToStr(t: TapeDict): string {
    const strs = Object.entries(t).map(([k,v]) => `${k}:${toStr(v)}`);
    return "{" + strs.join(",") + "}"

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
    t: TapeSet, 
    env: Env,
): TapeSet {
    switch (t.tag) {
        case Tag.Unknown: return Lit();
        case Tag.Ref:     return resolveRef(t, env);
        default:          return map(t, resolve, env);
    }
}

function simplify(
    t: TapeSet,
): TapeSet {
    switch (t.tag) {
        case Tag.Unknown: return t;
        case Tag.Lit:     return t;
        case Tag.Ref:     return t;
        case Tag.Rename:  return Rename(t.child, t.fromTape, t.toTape);
        case Tag.Single:  return Single(t.child, t.tapeName);
        case Tag.Sum:     return Sum(t.c1, t.c2);
        case Tag.Product: return Product(t.c1, t.c2);
        case Tag.Join:    return Join(t.c1, t.c2);
        case Tag.Match:   return Match(t.child, t.inputTape, t.outputTape);
        case Tag.Cursor:  return Cursor(t.child, t.tapeName);
        default: exhaustive(t);
    }
}

function resolveRef(
    t: Ref, 
    env: Env,
): TapeSet {
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
    v: TapeSet, 
    f: (v: TapeSet, env: Env) => TapeSet,
    env: Env
): TapeSet {
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
