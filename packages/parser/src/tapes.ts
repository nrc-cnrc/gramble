import { BitSet } from "bitset";
import { 
    ANY_CHAR_STR, DIRECTION_LTR, GenOptions, 
    logDebug, 
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

 
export abstract class BitsetToken {

    public abstract and(other: BitsetToken): BitsetToken;
    public abstract rightAnd(other: UnentangledToken): BitsetToken;
    public abstract or(other: BitsetToken): BitsetToken;
    public abstract rightOr(other: UnentangledToken): BitsetToken;
    public abstract not(): BitsetToken;
    public abstract get bits(): BitSet;
    public abstract clone(): BitsetToken;
    public abstract cardinality(): number;

    public isEmpty(): boolean {
        return this.cardinality() == 0;
    }

    public reEntangle(entanglements: number[]): BitsetToken {
        if (entanglements.length == 0) {
            return this;
        }
        const child = this.reEntangle(entanglements.slice(1));
        return new EntangledToken(child, entanglements[0]);
    }

    public abstract disentangle(): [UnentangledToken, number[]];
    public abstract get entanglements(): number[];

    //andNot(other: IToken): IToken;
}

export class UnentangledToken extends BitsetToken {
 
    constructor(
        public bits: BitSet
    ) { 
        super();
    }

    public and(other: BitsetToken): BitsetToken {
        return other.rightAnd(this);
    }
    
    public rightAnd(other: UnentangledToken): BitsetToken {
        return new UnentangledToken(this.bits.and(other.bits));
    }
    
    public or(other: BitsetToken): BitsetToken {
        return other.rightOr(this);
    }
    
    public rightOr(other: UnentangledToken): BitsetToken {
        return new UnentangledToken(this.bits.or(other.bits));
    }

    public not(): BitsetToken {
        return new UnentangledToken(this.bits.not());
    }

    public clone(): BitsetToken {
        return new UnentangledToken(this.bits.clone());
    }

    public cardinality(): number {
        return this.bits.cardinality();
    }

    public disentangle(): [UnentangledToken, number[]] {
        return [this, []];
    }

    public get entanglements(): number[] {
        return [];
    }

}

export class EntangledToken extends BitsetToken {

    protected entanglement: number;

    constructor(
        public child: BitsetToken,
        entanglement: number | undefined = undefined
    ) { 
        super();
        this.entanglement = (entanglement != undefined) ? 
                            entanglement : ENTANGLE_INDEX++
    }

    public and(other: BitsetToken): EntangledToken {
        const newChild = this.child.and(other);
        return new EntangledToken(newChild, this.entanglement);
    }

    public rightAnd(other: UnentangledToken): EntangledToken {
        const newChild = this.child.rightAnd(other);
        return new EntangledToken(newChild, this.entanglement);
    }
    
    public or(other: BitsetToken): EntangledToken {
        const newChild = this.child.or(other);
        return new EntangledToken(newChild, this.entanglement);
    }

    public rightOr(other: UnentangledToken): EntangledToken {
        const newChild = this.child.rightOr(other);
        return new EntangledToken(newChild, this.entanglement);
    }
    
    public not(): BitsetToken {
        return new EntangledToken(this.child.not(), this.entanglement);
    }

    public get bits(): BitSet {
        return this.child.bits;
    }

    public cardinality(): number {
        return this.child.cardinality();
    }

    public clone(): EntangledToken {
        return new EntangledToken(this.child.clone(), this.entanglement);
    }

    public entangle(other: BitsetToken): EntangledToken {
        return new EntangledToken(other, this.entanglement);
    }

    public disentangle(): [UnentangledToken, number[]] {
        const [c, e] = this.child.disentangle();
        return [c, [this.entanglement, ...e]];
    }
    
    public get entanglements(): number[] {
        return [this.entanglement, ...this.child.entanglements];
    }

}

let ENTANGLE_INDEX: number = 0;


const ANY_CHAR_BITSET: BitsetToken = new UnentangledToken(new BitSet().flip());
const NO_CHAR_BITSET: BitsetToken = new UnentangledToken(new BitSet());

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
        opt: GenOptions,
        bitNS: EntanglementRegistry = {}
    ): StringDict[] {
        return [{}];
    }

    /*
    public toDict(
        tapeNS: TapeNamespace,
        opt: GenOptions
    ): StringDict[] {

        let results: StringDict[] = [{}];
        let entanglementRegistry: {[key: number]: BitSet} = {};
        let current: OutputTrie = this;

        // step backward through the current object and its prevs, building 
        // the output strings from end to beginning.  (you might think this 
        // would be more elegant to be done recursively, but it blows
        // the stack when stringifying long outputs.)
        while (current instanceof OutputTrieLeaf) {
            const newResults: StringDict[] = [];
            const tape = tapeNS.get(current.tapeName);
            for (const result of results) {
                const oldStr = (current.tapeName in result) ? result[current.tapeName] : "";
                
                if (current.token instanceof EntangledToken) {
                    const e: number = current.token.entanglement;
                    if (e in entanglementRegistry) {
                        entanglementRegistry[e] = entanglementRegistry[e].and(current.token.bits);
                    } else {
                        entanglementRegistry[e] = current.token.bits;
                    }
                }
                
                const strings = this.getStringsFromToken(tape, current.token, entanglementRegistry);
                if (current.token instanceof EntangledToken) {
                    console.log(`entangledToken value=${strings}, entanglement=${current.token.entanglement}`)
                }
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
    }  */

    public getStringsFromToken(
        tape: Tape, 
        t: Token,
        entangleValues: EntanglementRegistry
    ): string[] {
        if (t instanceof EntangledToken) { 
            let result = t.clone();
            for (const entanglement of t.entanglements) {
                if (entanglement in entangleValues) {
                    const c = entangleValues[entanglement];
                    const resolution = tape.toToken([c]);
                    result = result.and(resolution);
                }
            }
            return tape.fromToken(result);
        }
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

    public toDict(
        tapeNS: TapeNamespace,
        opt: GenOptions,
        entangleValues: EntanglementRegistry = {}
    ): StringDict[] {
        const results: StringDict[] = [];
        const tape = tapeNS.get(this.tapeName);
        const newStrs = this.getStringsFromToken(tape, this.token, entangleValues);
        if (opt.random) {
            shuffleArray(newStrs);
        }

        for (const newStr of newStrs) {
            let prevResults: StringDict[] = [];
            if (this.token instanceof EntangledToken) { 
                const newEntanglements: EntanglementRegistry = {};
                Object.assign(newEntanglements, entangleValues);
                for (const entanglement of this.token.entanglements) {
                    newEntanglements[entanglement] = newStr;
                }
                prevResults = this.prev.toDict(tapeNS, opt, newEntanglements);
            } else {
                prevResults = this.prev.toDict(tapeNS, opt, entangleValues);
            }

            for (const prevResult of prevResults) {
                const oldStr = (this.tapeName in prevResult) ?
                                    prevResult[this.tapeName] : "";
                const newResult: StringDict = {};
                Object.assign(newResult, prevResult);
                newResult[this.tapeName] = DIRECTION_LTR ?
                                            oldStr + newStr :
                                            newStr + oldStr;
                results.push(newResult);
            }
        }
        return results;
    }

}

type EntanglementRegistry = {[key: number]: string};

export class VocabMap {

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
            let index = this.strToIndex.get(c);
            if (index == undefined) {
                return false;
            }
        }
        return true;
    }

    public asStrings(): string[] {
        return [...this.strToIndex.keys()];
    }

    public register(c: string): number {
        let index = this.strToIndex.get(c);
        if (index == undefined) {
            index = this.strToIndex.size;
            this.strToIndex.set(c, index);
            this.indexToStr.set(index, c);
        }
        return index;
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
    readonly globalName: string;
    atomic: boolean;
    registerTokens(tokens: string[]): void;
    expandStrings(token: string, other?: Tape | undefined): string[];
    restrictToVocab(token: BitsetToken): BitsetToken;
    vocabIsSubsetOf(other: Tape): boolean;
    inVocab(strs: string[]): boolean;
    match(str1: BitsetToken, str2: BitsetToken): BitsetToken;
    toToken(chars: string[]): BitsetToken;
    fromBits(bits: BitSet): string[];
    fromToken(token: BitsetToken): string[];

}

/**
 * A tape containing strings; the basic kind of tape and (right now) the only one we really use.
 */
export class BitsetTape implements Tape {

    public mask: BitsetToken = NO_CHAR_BITSET.clone();

    constructor(
        public globalName: string,
        protected _vocab: VocabMap = new VocabMap(),
        public atomic: boolean
     ) { }

    public get vocabSize(): number {
        return this.mask.cardinality();
    }

    public expandStrings(
        token: string, 
        other: Tape | undefined = undefined
    ): string[] {
        const commonVocab = (other != undefined) ?
                            this.mask.and((other as BitsetTape).mask) :
                            this.mask;
        if (token == ANY_CHAR_STR) {
            return this.fromToken(commonVocab);
        }

        // it's a specific string, not any char, make sure it's in the vocab
        
        const index = this._vocab.getIndex(token);
        if (index == undefined || commonVocab.bits.get(index) == 0) {
            return [];
        }
        return [token];
    }

    public restrictToVocab(token: BitsetToken): BitsetToken {
        return token.and(this.mask);
    }

    public inVocab(chars: string[]): boolean {
        for (const char of chars) {
            const index = this._vocab.getIndex(char);
            if (index == undefined) {
                return false;
            }
            if (this.mask.bits.get(index) == 0) {
                return false;
            }
        }
        return true;

    }

    vocabIsSubsetOf(other: Tape): boolean {
        return other.inVocab(this.vocab);
    }

    public get vocab(): string[] {
        return this.fromToken(this.mask);
    }

    public get any(): BitsetToken {
        return ANY_CHAR_BITSET.and(this.mask);
    }
    
    public get none(): BitsetToken {
        return NO_CHAR_BITSET;
    }

    public match(str1: BitsetToken, str2: BitsetToken): BitsetToken {
        return str1.and(str2);
    }

    public registerTokens(chars: string[]): void {
        for (const char of chars) {
            if (char.length == 0) {
                continue;
            }
            const index = this._vocab.register(char); // in case it hasn't been registered before
            this.mask.bits.set(index);  // add them to the mask
        }
    }
    
    protected toBits(char: string): BitSet {
        const result = new BitSet();
        const index = this._vocab.getIndex(char);
        if (index == undefined) {
            return result;
        }
        result.set(index);
        return result;
    }

    public fromBits(bits: BitSet): string[] {
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

    protected setFromBits(bits: BitSet): Set<string> {
        const result: Set<string> = new Set();
        for (const index of bits.toArray()) {
            const char = this._vocab.getString(index);
            if (char == undefined) {
                break;  // this is crucial, because BitSets are infinite and if
                        // one was created by inversion, it could iterate forever here.
            }
            result.add(char);
        }
        return result;
    }

    public toToken(
        chars: string[]
    ): BitsetToken {
        let result = this.none;
        for (const char of chars) {
            if (char == ANY_CHAR_STR) {
                return this.any;
            }
            result = result.or(new UnentangledToken(this.toBits(char)));
        }
        return result.and(this.mask);
    }

    public fromToken(token: BitsetToken): string[] {
        return this.fromBits(token.bits);
    }
}

/**
 * Namespace<T> is a convenience wrapper around Map<string, T> that
 * allows us to rename a given item statelessly.  This is used for Tapes
 * in particular.
 */
export class Namespace<T> {

    protected entries: Map<string, T> = new Map();

    public getKeys(): Set<string> {
        return new Set(this.entries.keys());
    }

    public get(key: string): T {
        const result = this.entries.get(key);
        if (result == undefined) {
            throw new Error(`Cannot find ${key} in namespace, ` +
                `available: [${[...this.entries.keys()]}]`);
        }
        return result;
    }

    public attemptGet(key: string): T | undefined {
        return this.entries.get(key);
    }

    public set(key: string, value: T): void {
        this.entries.set(key, value);
    }

    public rename(fromKey: string, toKey: string): Namespace<T> {
        if (fromKey == toKey) {
            return this;
        }
        const result = new Namespace<T>();
        for (const [key, value] of this.entries.entries()) {
            if (key == toKey) {
                continue;
            }
            const newKey = (key == fromKey) ? toKey : key;
            result.entries.set(newKey, value);
        }
        return result;
    }

}

export class TapeNamespace extends Namespace<Tape> { }

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
/*
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
*/

export function renameTape(
    tapeName: string, 
    fromTape: string, 
    toTape: string
): string {
    return (tapeName == fromTape) ? toTape : tapeName;
}