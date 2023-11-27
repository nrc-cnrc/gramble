import { exhaustive, union } from "./utils/func";
import { 
    Namespace
} from "./utils/namespace";
import { VocabInfo, VocabString, vocabUnion } from "./vocab";

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

    if (child1.tag !== "TapeLit" || child2.tag !== "TapeLit") 
        return { tag: "TapeSum", c1: child1, c2: child2 };

    const resultTapes: Map<string,VocabString> = new Map(child1.tapes);
    for (const [k,v] of child2.tapes) {
        const other = child1.tapes.get(k);
        if (other === undefined) {
            resultTapes.set(k,v);
            continue;
        }
        const newVocab = vocabUnion(v, other);
        resultTapes.set(k, newVocab);
    }

    return TapeLit(resultTapes);
    
}

export type TapeUnknown = { tag: "TapeUnknown" };
export function TapeUnknown(): TapeInfo {
    return { tag: "TapeUnknown" };
}

/** TapeLit are the actual tape information objects, containing
 * a map from tape names to vocabulary objects
 */
export type TapeLit = { 
    tag: "TapeLit", 
    tapes: Map<string, VocabString> 
};

export function TapeLit(
    tapes: Map<string, VocabString> = new Map()
): TapeLit {
    return { tag: "TapeLit", tapes: tapes }
};

/**
 * A TapeRef is a placeholder in the tree, corresponding
 * to an Embed.  We can't know what tapes/vocab information
 * corresponds to this node (it might only be processed in the 
 * future).  This will later be resolved to a TapeLit.
 */
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
        const renamedTapes = new Map(child.tapes);
        let oldVocab = child.tapes.get(fromTape);
        if (oldVocab === undefined) 
            oldVocab = VocabString([], false); // dummy value
        renamedTapes.set(toTape, oldVocab);
        renamedTapes.delete(fromTape);
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

/** 
 * Turning a [TapeInfo] to a string
 */ 
export function tapeToStr(t: TapeInfo): string {
    switch (t.tag) {
        case "TapeUnknown": return "?";
        case "TapeLit": return `{${[...t.tapes.keys()]}}`;
        case "TapeRef": return "$" + t.symbol;
        case "TapeRename": return `${t.fromTape}>${t.toTape}(${tapeToStr(t.child)})`;
        case "TapeSum": return tapeToStr(t.c1) + "+" + tapeToStr(t.c2);
        default: exhaustive(t);
    }
}