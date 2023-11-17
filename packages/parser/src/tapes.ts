import { ValueSet, exhaustive, flatten, mapSet, union } from "./utils/func";
import { 
    Namespace
} from "./utils/namespace";

/**
 * Tape
 * 
 * This encapsulates information about a tape (like what its name is, what
 * its possible vocabulary is, what counts as concatenation and matching, 
 * etc.).  It doesn't, however, encapsulate a tape in the sense of keeping 
 * a sequence of character outputs; those are represented by linked lists made
 * of ConcatExprs.
 */
export class Tape {

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

export class TapeNamespace extends Namespace<Tape> { }

export function renameTape(
    tapeName: string, 
    fromTape: string, 
    toTape: string
): string {
    return (tapeName == fromTape) ? toTape : tapeName;
}

// New tape structures

export type TapeID 
    = TapeLit
    | TapeRef
    | TapeRename
    | TapeSet
    | TapeUnknown; 

export type TapeUnknown = { tag: "tapeUnknown" };
export function TapeUnknown(): TapeID {
    return { tag: "tapeUnknown" };
}

export type TapeLit = { tag: "tapeLit", text: string };
export function TapeLit(s: string): TapeID {
    return { tag: "tapeLit", text: s }
};

export type TapeRef = { tag: "tapeRef", symbol: string };
export function TapeRef(s: string): TapeID {
    return { tag: "tapeRef", symbol: s }
};

export type TapeRename =  { 
    tag: "tapeRename", 
    child: TapeID, 
    fromTape: string, 
    toTape: string 
};

export function TapeRename(
    child: TapeID, 
    fromTape: string, 
    toTape: string
): TapeID {
    if (child.tag === "tapeLit") {
        if (child.text === fromTape) return TapeLit(toTape);
        return child;
    }

    if (child.tag === "tapeSet") {
        const children = mapSet(child.children, 
                c => TapeRename(c, fromTape, toTape));
        return TapeSet(...children);
    }

    return { tag: "tapeRename", child: child, 
             fromTape: fromTape, toTape: toTape }
}

export type TapeSet = { tag: "tapeSet", children: ValueSet<TapeID> };

export function TapeSet(
    ...children: TapeID[]
): TapeID {
    let newChildren: ValueSet<TapeID> = new ValueSet([], tapeToStr);
    for (const c of children) {
        if (c.tag !== "tapeSet") {
            newChildren.add(c);
            continue;
        }
        newChildren.add(...c.children);
    }
    return { tag: "tapeSet", children: newChildren }
};

// Turning a TapeID to a string

export function tapeToStr(t: TapeID): string {
    switch (t.tag) {
        case "tapeUnknown": return "?";
        case "tapeLit": return t.text;
        case "tapeRef": return "$" + t.symbol + "";
        case "tapeRename": return `${t.fromTape}>${t.toTape}(${tapeToStr(t.child)})`;
        case "tapeSet": return "[" + [...mapSet(t.children, c => tapeToStr(c))].join(",") + "]";
        default: exhaustive(t);
    }
}

// Getting the literals from a tape set.  If anything in it isn't
// a literal or a set, that's an error

export function tapeToRefs(t: TapeID): string[] {
    switch (t.tag) {
        case "tapeLit": return [];
        case "tapeRef": return [t.symbol];
        case "tapeSet": return flatten(mapSet(t.children, c => tapeToRefs(c)));
        case "tapeRename": return tapeToRefs(t.child);
        case "tapeUnknown": return [];
    }
}

// Getting the literals from a tape set.  If anything in it isn't
// a literal or a set, that's an error

export function tapeToLits(t: TapeID): string[] {
    switch (t.tag) {
        case "tapeLit": return [t.text];
        case "tapeSet": return flatten(mapSet(t.children, c => tapeToLits(c)));
        default: throw new Error(`unresolved tape structure: ${tapeToStr(t)}`)
    }
}

// Testing whether a tape is in a set

export type Trivalent = true | false | "unknown"
export function hasTape(t: TapeID, query: string): Trivalent  {
    switch (t.tag) {
        case "tapeUnknown": return "unknown";
        case "tapeRef":     return "unknown";
        case "tapeLit":     return t.text === query;
        case "tapeRename":  return t.toTape === query 
                                     ? hasTape(t.child, t.fromTape)
                                     : hasTape(t.child, query);
        case "tapeSet":     return tapeInSet(t, query);
    }
}

function tapeInSet(t: TapeSet, query: string): Trivalent {
    let found: Trivalent = false;
    for (const c of t.children) {
        const result = hasTape(c, query);
        if (result === true) return true;
        if (result === "unknown") found = "unknown";
    }
    return found;
}

export type TapeLength = number | "unknown";
export function tapeLength(t: TapeID): TapeLength {
    switch (t.tag) {
        case "tapeUnknown": return "unknown";
        case "tapeRef":     return "unknown";
        case "tapeLit":     return 1;
        case "tapeRename":  return tapeLength(t.child);
        case "tapeSet":     return tapeLengthSet(t);
    }
}

function tapeLengthSet(t: TapeSet): TapeLength {
    let result: number = 0;
    for (const c of t.children) {
        const len = tapeLength(c);
        if (len === "unknown") return "unknown";
        result += len;
    }
    return result;
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
