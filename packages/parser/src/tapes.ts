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
