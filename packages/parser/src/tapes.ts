import { 
    ANY_CHAR_STR,
    Namespace
} from "./util";

export type Token = string;
export class EpsilonToken { }
export const EPSILON_TOKEN: EpsilonToken = new EpsilonToken();

/**
 * Tape
 * 
 * This encapsulates information about a tape or set of tapes (like what its name is, what
 * its possible vocabulary is, what counts as concatenation and matching, etc.).  It doesn't,
 * however, encapsulate a tape in the sense of keeping a sequence of character outputs; that
 * would be encapsulated by the Output objects above.
 */
export class Tape {

    constructor(
        public globalName: string,
        public atomic: boolean,
        public vocab: Set<string> = new Set()
    ) { }

    public expandStrings(token: string): Set<string> {
        if (token == ANY_CHAR_STR) {
            return this.vocab;
        }

        // it's a specific string, not any char, make sure it's in the vocab
        if (!this.vocab.has(token)) {
            return new Set();
        }
        return new Set([token]);
    }

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
