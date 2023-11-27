import { Dict, exhaustive, union } from "./utils/func";
import { 
    Namespace
} from "./utils/namespace";
import { VocabInfo, VocabString, vocabIntersection, vocabUnion } from "./vocab";

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
    | TapeJoin
    | TapeUnknown; 

export type TapeSum = { 
    tag: "TapeSum", 
    c1: TapeInfo, 
    c2: TapeInfo 
};

export function TapeSum(c1: TapeInfo, c2: TapeInfo): TapeInfo {

    if (c1.tag !== "TapeLit" || c2.tag !== "TapeLit") 
        return { tag: "TapeSum", c1, c2 };

    const resultTapes: Dict<VocabString> = {};
    Object.assign(resultTapes, c1.tapes);
    for (const [k,v] of Object.entries(c2.tapes)) {
        const other = c1.tapes[k];
        if (other === undefined) {
            resultTapes[k] = v;
            continue;
        }
        const newVocab = vocabUnion(v, other);
        resultTapes[k] = newVocab;
    }

    return TapeLit(resultTapes);
    
}

export type TapeJoin = { 
    tag: "TapeJoin", 
    c1: TapeInfo, 
    c2: TapeInfo 
};

export function TapeJoin(c1: TapeInfo, c2: TapeInfo): TapeInfo {

    if (c1.tag !== "TapeLit" || c2.tag !== "TapeLit") 
        return { tag: "TapeJoin", c1, c2 };

    const resultTapes: Dict<VocabString> = {};
    Object.assign(resultTapes, c1.tapes);
    for (const [k,v] of Object.entries(c2.tapes)) {
        const other = c1.tapes[k];
        if (other === undefined) {
            resultTapes[k] = v;
            continue;
        }
        const newVocab = vocabIntersection(v, other);
        resultTapes[k] = newVocab;
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
    tapes: Dict<VocabString> 
};

export function TapeLit(
    tapes: Dict<VocabString> = {}
): TapeLit {
    return { tag: "TapeLit", tapes }
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

/**
 * A TapeRename expresses a subspended rename operation.  If
 * we pass in a TapeLit to the `TapeRename()` smart constructor,
 * it does the operation immediately.  If we pass in anything else
 * (a ref or another suspend) it results in a TapeRename object
 * and the operation will be performed when it becomes available.
 */
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
        const renamedTapes: Dict<VocabString> = {};
        Object.assign(renamedTapes, child.tapes);
        let oldVocab = child.tapes[fromTape];
        if (oldVocab === undefined) 
            oldVocab = VocabString([], false); // dummy value
        renamedTapes[toTape] = oldVocab;
        delete renamedTapes[fromTape];
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
        case "TapeLit": return `${JSON.stringify(t.tapes)}`;
        case "TapeRef": return "$" + t.symbol;
        case "TapeRename": return `${t.fromTape}>${t.toTape}(${tapeToStr(t.child)})`;
        case "TapeSum": return tapeToStr(t.c1) + "+" + tapeToStr(t.c2);
        case "TapeJoin": return tapeToStr(t.c1) + "⋈" + tapeToStr(t.c2);
        default: exhaustive(t);
    }
}