import { BitSet } from "bitset";
import { 
    ANY_CHAR_STR, DIRECTION_LTR, GenOptions, 
    shuffleArray, StringDict, 
    tokenizeUnicode 
} from "./util";

/**
 * Token
 * 
 * This encapsulates a token, so that parsers need not necessarily know how, exactly, a token is implemented.
 * Right now we only have one kind of token, strings implemented as BitSets, but eventually this should be an
 * abstract class with (e.g.) StringToken, maybe FlagToken, ProbToken and/or LogToken (for handling weights), 
 * etc.
 */
 export type Token = BitsetToken | string;

 export class BitsetToken {
 
    constructor(
        public bits: BitSet
    ) { }

    public and(other: BitsetToken): BitsetToken {
        return new BitsetToken(this.bits.and(other.bits));
    }

    public andNot(other: BitsetToken): BitsetToken {
        return new BitsetToken(this.bits.andNot(other.bits));
    }

    public or(other: BitsetToken): BitsetToken {
        return new BitsetToken(this.bits.or(other.bits));
    }

    public clone(): BitsetToken {
        return new BitsetToken(this.bits.clone());
    }

    public isEmpty(): boolean {
        return this.bits.isEmpty();
    }
}

const ANY_CHAR_BITSET: BitsetToken = new BitsetToken(new BitSet().flip());
const NO_CHAR_BITSET: BitsetToken = new BitsetToken(new BitSet());

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

        var results: StringDict[] = [{}];

        var current: OutputTrie = this;

        // step backward through the current object and its prevs, building 
        // the output strings from end to beginning.  (you might think this 
        // would be more elegant to be done recursively, but it blows
        // the stack when stringifying long outputs.)
        while (current instanceof OutputTrieLeaf) {
            const newResults: StringDict[] = [];
            const tape = tapeNS.get(current.tapeName);
            for (const result of results) {
                const oldStr = (current.tapeName in result) ? result[current.tapeName] : "";
                const strings = this.getStringsFromToken(tape, current.token);
                if (opt.random) {
                    shuffleArray(strings);
                }
                for (const s of strings) {
                    const newResult: StringDict = {};
                    Object.assign(newResult, result);
                    const newStr = (DIRECTION_LTR)
                                    ? s + oldStr
                                    : oldStr + s;
                    newResult[current.tapeName] = newStr;
                    newResults.push(newResult);
                }
            }
            results = newResults;
            current = current.prev;
        }

        return results;
    } 

    public getStringsFromToken(
        tape: Tape, 
        t: Token
    ): string[] {
        if (t instanceof BitsetToken) {
            return tape.fromToken(t);
        }
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

}

class Vocab {

    public strToIndex: Map<string, number> = new Map();
    public indexToStr: Map<number, string> = new Map();
    
    public getString(index: number): string | undefined {
        return this.indexToStr.get(index);
    }

    public getIndex(char: string): number | undefined {
        return this.strToIndex.get(char);
    }

    public get size(): number {
        return this.strToIndex.size;
    }

    public hasAll(strs: string[]): boolean {
        for (const c of strs) {
            var index = this.strToIndex.get(c);
            if (index == undefined) {
                return false;
            }
        }
        return true;
    }

    public asStrings(): string[] {
        return [...this.strToIndex.keys()];
    }

    public register(c: string): void {
        let index = this.strToIndex.get(c);
        if (index == undefined) {
            index = this.strToIndex.size;
            this.strToIndex.set(c, index);
            this.indexToStr.set(index, c);
        }
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
export interface Tape {

    readonly any: BitsetToken;
    readonly none: BitsetToken;
    readonly vocabSize: number;
    readonly vocab: string[];
    inVocab(strs: string[]): boolean;
    match(str1: BitsetToken, str2: BitsetToken): BitsetToken;
    tokenize(str: string): string[];
    toToken(char: string): BitsetToken;
    fromToken(token: BitsetToken): string[];

}

/**
 * A tape containing strings; the basic kind of tape and (right now) the only one we really use.
 * (Besides a TapeCollection, which implements Tape but is really used for a different situation.)
 */
class BitsetTape implements Tape {

    public mask: BitsetToken = NO_CHAR_BITSET.clone();

    constructor(
        public globalName: string,
        public _vocab: Vocab = new Vocab()
     ) { }

    public get vocabSize(): number {
        return this._vocab.size;
    }

    public inVocab(strs: string[]): boolean {
        return this._vocab.hasAll(strs);
    }

    public get vocab(): string[] {
        return this._vocab.asStrings();
    }

    public get any(): BitsetToken {
        return ANY_CHAR_BITSET;
    }
    
    public get none(): BitsetToken {
        return NO_CHAR_BITSET;
    }

    public match(str1: BitsetToken, str2: BitsetToken): BitsetToken {
        return new BitsetToken(str1.bits.and(str2.bits));
    }

    public tokenize(
        str: string
    ): string[] {

        if (str.length == 0) {
            return [];
        }

        const cs = tokenizeUnicode(str);
        for (const c of cs) {
            this._vocab.register(c); // just in case
            this.mask = this.mask.or(this.toToken(c));
        }
        return cs;
    }
    
    public toBits(char: string): BitSet {
        const result = new BitSet();
        const index = this._vocab.getIndex(char);
        if (index == undefined) {
            return result;
        }
        result.set(index);
        return result;
    }

    protected fromBits(bits: BitSet): string[] {
        const result: string[] = [];
        for (const index of bits.toArray()) {
            const char = this._vocab.getString(index);
            if (char == undefined) {
                break;  // this is crucial, because BitSets are infinite and if
                        // one was created by inversion, it could iterate forever here.
            }
            result.push(char);
        }
        return result;
    }

    public toToken(char: string): BitsetToken {
        if (char == ANY_CHAR_STR) {
            return this.any;
        }
        return new BitsetToken(this.toBits(char));
    }

    public fromToken(token: BitsetToken): string[] {
        return this.fromBits(token.bits);
    }
}

/**
 * TapeNamespace maintains the mappings between the tapeNames and actual Tapes,
 * which may vary within different contexts because of tape renaming.
 */
export class TapeNamespace {

    public tapes: Map<string, Tape> = new Map();

    public getTapeNames(): Set<string> {
        return new Set(this.tapes.keys());
    }

    public get(tapeName: string): Tape {
        const result = this.tapes.get(tapeName);
        if (result == undefined) {
            throw new Error(`Cannot find tape ${tapeName} in tape namespace, ` +
                `available tapes are [${[...this.tapes.keys()]}]`);
        }
        return result;
    }

    public createTape(tapeName: string): Tape {
        // don't remake it if it doesn't exist
        const oldTape = this.tapes.get(tapeName);
        if (oldTape != undefined) {
            return oldTape;
        }

        // make a new one if it doesn't exist
        const newTape = new BitsetTape(tapeName);
        this.tapes.set(tapeName, newTape);
        return newTape;
    }

    public get size(): number {
        return this.tapes.size;
    }

    public rename(fromTape: string, toTape: string): TapeNamespace {
        return new RenamedTapeNamespace(this, fromTape, toTape);
    }

}

/**
 * RenamedTapeNamespaces are necessary for RenameExpr to work properly.
 * 
 * From the point of view of any particular grammar/expr, it believes that particular
 * tapes have particular names, e.g. "text" or "gloss".  However, because renaming is
 * an operator of our relational algebra, different states may be referred to by different
 * names in different parts of the grammar.  
 * 
 * (For example, consider a composition between two FSTS, {"up":"lr", "down":"ll"} and 
 * {"up":"ll", "down":"lh"}.  In order to express their composition as a "join", we have to make it so that
 * the first "down" and the second "up" have the same name.  Renaming does that.
 * 
 * The simplest way to get renaming, so that each state doesn't have to understand the name structure
 * of the larger grammar, is to wrap TapeNamespaces in a simple adaptor class that makes it seem
 * as if an existing tape has a new name.  That way, any child of a RenameExpr can (for example) ask for the
 * vocabulary of the tape it thinks is called "down", even if outside of that RenameExpr the tape is called
 * "text".  
 */
class RenamedTapeNamespace extends TapeNamespace {

    constructor(
        public child: TapeNamespace,
        public fromTape: string,
        public toTape: string
    ) { 
        super();
    }
    
    public getTapeNames(): Set<string> {
        const result = [...this.child.getTapeNames()].map(s => 
                    renameTape(s, this.fromTape, this.toTape));
        return new Set(result);
    }

    public get(tapeName: string): Tape {
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            throw new Error(`Looking for tape ${tapeName} ` + 
            `inside a ${this.toTape}->${this.fromTape} renaming`);
        }
        tapeName = renameTape(tapeName, this.toTape, this.fromTape);
        return this.child.get(tapeName);
    }
}

export function renameTape(
    tapeName: string, 
    fromTape: string, 
    toTape: string
): string {
    return (tapeName == fromTape) ? toTape : tapeName;
}