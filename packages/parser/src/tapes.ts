import { 
    ANY_CHAR_STR, DIRECTION_LTR, GenOptions,
    shuffleArray, StringDict, 
    Namespace
} from "./util";

export type Token = string;
export class EpsilonToken { }
export const EPSILON_TOKEN: EpsilonToken = new EpsilonToken();

/**
 * OutputTrie
 * 
 * The outputs of this algorithm are kept as tries, since that's the natural
 * shape of a set of outputs from a non-deterministic parsing algorithm.  (E.g., if
 * we've already output "fooba", and at the next state we could either output "r" or
 * "z", then just having "r" and "z" point to that previous output is both less effort
 * and less space than copying it twice and concatenating it.  Especially if "z" ends
 * up being a false path and we end up discarding it; that would mean we had copied/
 * concatenated for nothing.)   
 */
export class OutputTrie {

    public add(tapeName: string, token: Token): OutputTrieLeaf {
        return new OutputTrieLeaf(tapeName, token, this);
    }

    public toDict(
        tapeNS: TapeNamespace,
        opt: GenOptions
    ): StringDict[] {
        return [{}];
    }

    public getStringsFromToken(
        tape: Tape, 
        t: Token
    ): string[] {
        return [t]; // if it's not a Token it's already a string
    }
}

export class OutputTrieLeaf extends OutputTrie {

    constructor(
        public tapeName: string,
        public token: Token,
        public prev: OutputTrie
    ) { 
        super();
    }

    public toDict(
        tapeNS: TapeNamespace,
        opt: GenOptions,
    ): StringDict[] {
        const results: StringDict[] = [];
        const tape = tapeNS.get(this.tapeName);
        const newStrs = this.getStringsFromToken(tape, this.token);
        if (opt.random) {
            shuffleArray(newStrs);
        }

        for (const newStr of newStrs) {
            let prevResults = this.prev.toDict(tapeNS, opt);
            for (const prevResult of prevResults) {
                const newResult: StringDict = {};
                Object.assign(newResult, prevResult);
                if (this.tapeName in prevResult || newStr != '') {
                    const oldStr = (this.tapeName in prevResult) ?
                                        prevResult[this.tapeName] : "";
                    newResult[this.tapeName] = DIRECTION_LTR ?
                                                oldStr + newStr :
                                                newStr + oldStr;
                }
                results.push(newResult);
            }
        }

        return results;
    }

}

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
