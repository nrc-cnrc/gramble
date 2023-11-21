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

export type TapeInfo 
    = TapeLit
    | TapeRef
    | TapeRename
    | TapeSum
    | TapeUnknown; 

export type TapeSum = { 
    tag: "TapeSum", 
    c1: TapeInfo, 
    c2: TapeInfo 
};

export function TapeSum(child1: TapeInfo, child2: TapeInfo): TapeInfo {
    if (child1.tag === "TapeLit" && child2.tag === "TapeLit") {
        return TapeLit(union(child1.tapes, child2.tapes));
    }
    return { tag: "TapeSum", c1: child1, c2: child2 };
}


export type TapeUnknown = { tag: "TapeUnknown" };
export function TapeUnknown(): TapeInfo {
    return { tag: "TapeUnknown" };
}

export type TapeLit = { tag: "TapeLit", tapes: Set<string> };
export function TapeLit(s: Iterable<string>): TapeInfo {
    return { tag: "TapeLit", tapes: new Set(s) }
};

export type TapeRef = { tag: "TapeRef", symbol: string };
export function TapeRef(s: string): TapeInfo {
    return { tag: "TapeRef", symbol: s }
};

export type TapeRename =  { 
    tag: "TapeRename", 
    child: TapeInfo, 
    fromTape: string, 
    toTape: string 
};

export function TapeRename(
    child: TapeInfo, 
    fromTape: string, 
    toTape: string
): TapeInfo {
    if (child.tag === "TapeLit") {
        const renamedTapes = mapSet(child.tapes, 
            t => renameTape(t, fromTape, toTape))
        return TapeLit(renamedTapes);
    }

    if (child.tag === "TapeSum") {
        // distribute the renaming to the children
        return TapeSum(TapeRename(child.c1, fromTape, toTape),
                       TapeRename(child.c2, fromTape, toTape));
    }

    return { tag: "TapeRename", child: child, 
             fromTape: fromTape, toTape: toTape }
}

// Turning a TapeID to a string

export function tapeToStr(t: TapeInfo): string {
    switch (t.tag) {
        case "TapeUnknown": return "?";
        case "TapeLit": return `{${[...t.tapes]}}`;
        case "TapeRef": return "$" + t.symbol + "";
        case "TapeRename": return `${t.fromTape}>${t.toTape}(${tapeToStr(t.child)})`;
        case "TapeSum": return tapeToStr(t.c1) + "+" + tapeToStr(t.c2);
        default: exhaustive(t);
    }
}

// Getting the literals from a tape set.  If anything in it isn't
// a literal or a set, that's an error

export function tapeToRefs(t: TapeInfo): string[] {
    switch (t.tag) {
        case "TapeLit": return [];
        case "TapeRef": return [t.symbol];
        case "TapeSum": return [...tapeToRefs(t.c1), ...tapeToRefs(t.c2)];
        case "TapeRename": return tapeToRefs(t.child);
        case "TapeUnknown": return [];
    }
}

export type VocabSet = {
    tokens: Set<string>,
    wildcard: boolean,
}