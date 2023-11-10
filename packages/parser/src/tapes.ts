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

export type TapeRef = { tag: "tapeRef", text: string };
export function TapeRef(s: string): TapeID {
    return { tag: "tapeRef", text: s }
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
        const children = setMap(child.children, 
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

export function resolveTapes(
    t: TapeID, 
    key:string, 
    val:TapeID,
    visited: Set<string>
): TapeID {
    switch (t.tag) {
        case "tapeUnknown": return TapeSet();
        case "tapeLit": return t;
        case "tapeRef": return resolveTapeRefs(t, key, val, visited);
        case "tapeRename": 
            return TapeRename(resolveTapes(t.child, key, val, visited), 
                                t.fromTape, t.toTape);
        case "tapeSet": 
            return TapeSet(...setMap(t.children, c => 
                resolveTapes(c, key, val, visited)));
    }
}

function resolveTapeRefs(    
    t: TapeRef, 
    key:string, 
    val:TapeID,
    visited: Set<string>
): TapeID {
    if (key !== t.text) return t;
    if (visited.has(key)) return TapeSet();
    const newVisited = new Set([...visited, key]);
    return resolveTapes(val, key, val, newVisited);
}

export function tapeToStr(t: TapeID): string {
    switch (t.tag) {
        case "tapeUnknown": return "?";
        case "tapeLit": return t.text;
        case "tapeRef": return "${" + t.text + "}";
        case "tapeRename": return `${t.fromTape}>${t.toTape}(${tapeToStr(t.child)})`;
        case "tapeSet": return "[" + [...setMap(t.children, c => tapeToStr(c))].join(",") + "]";
        default: exhaustive(t);
    }
}

export function tapeToLits(t: TapeID): string[] {
    switch (t.tag) {
        case "tapeLit": return [t.text];
        case "tapeSet": return flatten(setMap(t.children, c => tapeToLits(c)));
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