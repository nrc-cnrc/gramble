import { BitSet } from "bitset";
import { GenOptions } from "./exprs";
import { ANY_CHAR_STR, Gen, shuffleArray, StringDict, tokenizeUnicode } from "./util";


export type AbstractToken = Token | string;

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
export class OutputTrie<T extends AbstractToken> {

    public add(tape: Tape, token: T): OutputTrieLeaf<T> {
        return new OutputTrieLeaf<T>(tape, token, this);
    }

    public toDict(
        opt: GenOptions
    ): StringDict[] {

        var results: StringDict[] = [{}];

        var currentOutput: OutputTrie<T> = this;

        // step backward through the current object and its prevs, building 
        // the output strings from end to beginning.  (you might think this 
        // would be more elegant to be done recursively, but it blows
        // the stack when stringifying long outputs.)
        while (currentOutput instanceof OutputTrieLeaf) {
            const newResults: StringDict[] = [];
            const tape = (currentOutput as OutputTrieLeaf<T>).tape;
            const token = (currentOutput as OutputTrieLeaf<T>).token;
            const prev = (currentOutput as OutputTrieLeaf<T>).prev;
            for (const result of results) {
                const oldStr = (tape.name in result) ? result[tape.name] : "";
                for (const s of this.getStringsFromToken(tape, token, opt.random)) {
                    const newResult: StringDict = {};
                    Object.assign(newResult, result);
                    const newStr = (opt.direction == "LTR")
                                    ? s + oldStr
                                    : oldStr + s;
                    newResult[tape.name] = newStr;
                    newResults.push(newResult);
                }
            }
            results = newResults;
            currentOutput = prev;
        }

        return results;
    } 

    public getStringsFromToken(
        tape: Tape, 
        s: AbstractToken,
        random: boolean
    ): string[] {
        if (s instanceof Token) {
            const candidates = s.toStrings(tape);
            if (random) {
                shuffleArray(candidates);
            }
            return candidates;
        }
        return [s]; // if it's not a Token it's already a string
    }
}

export class OutputTrieLeaf<T extends AbstractToken> extends OutputTrie<T> {

    constructor(
        public tape: Tape,
        public token: T,
        public prev: OutputTrie<T>
    ) { 
        super();
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
export abstract class Tape {

    public abstract readonly name: string;

    public abstract getTapeNames(): Set<string>;

    public abstract inVocab(strs: string[]): boolean;
    
    public abstract getTape(name: string): Tape | undefined;
    
    public match(str1: Token, str2: Token): Token {
        throw new Error(`Not implemented`);
    }

    public any(): Token {
        throw new Error(`Not implemented`);
    }
    
    public none(): Token {
        throw new Error(`Not implemented`);
    }
    
    public tokenize(
        str: string, 
        atomic: boolean = false
    ): [string, Token][] {
        throw new Error(`Not implemented`);
    }

    public get vocabSize(): number {
        return 0;
    }

    public abstract toBits(char: string): BitSet;
    public abstract fromBits(bits: BitSet): string[];
    
    public toToken(char: string): Token {
        if (char == ANY_CHAR_STR) {
            return this.any();
        }
        return new Token(this.toBits(char));
    }

    public fromToken(token: Token): string[] {
        return this.fromBits(token.bits);
    }

}

/**
 * Token
 * 
 * This encapsulates a token, so that parsers need not necessarily know how, exactly, a token is implemented.
 * Right now we only have one kind of token, strings implemented as BitSets, but eventually this should be an
 * abstract class with (e.g.) StringToken, maybe FlagToken, ProbToken and/or LogToken (for handling weights), 
 * etc.
 */
export class Token {
 
    constructor(
        public bits: BitSet
    ) { }

    public andNot(other: Token): Token {
        return new Token(this.bits.andNot(other.bits));
    }

    public or(other: Token): Token {
        return new Token(this.bits.or(other.bits));
    }

    public clone(): Token {
        return new Token(this.bits.clone());
    }

    public isEmpty(): boolean {
        return this.bits.isEmpty();
    }

    public toStrings(tape: Tape): string[] {
        return tape.fromBits(this.bits);
    }
}

export const ANY_CHAR: Token = new Token(new BitSet().flip());
export const NO_CHAR: Token = new Token(new BitSet());

/**
 * A tape containing strings; the basic kind of tape and (right now) the only one we really use.
 * (Besides a TapeCollection, which implements Tape but is really used for a different situation.)
 */
export class StringTape extends Tape {

    constructor(
        public parent: TapeCollection,
        public name: string,
        public strToIndex: Map<string, number> = new Map(),
        public indexToStr: Map<number, string> = new Map()
    ) { 
        super();
    }

    public get vocabSize(): number {
        return this.strToIndex.size;
    }

    public getTapeNames(): Set<string> {
        return new Set([this.name]);
    }

    public getTape(name: string): Tape | undefined {
        if (this.parent == undefined) {
            throw new Error(`Orphaned tape: ${this.name}`);
        }
        return this.parent.getTape(name);
    }

    public inVocab(strs: string[]): boolean {
        for (const c of strs) {
            var index = this.strToIndex.get(c);
            if (index == undefined) {
                return false;
            }
        }
        return true;
    }

    public any(): Token {
        return ANY_CHAR;
    }
    
    public none(): Token {
        return NO_CHAR;
    }

    public match(str1: Token, str2: Token): Token {
        return new Token(str1.bits.and(str2.bits));
    }

    public tokenize(
        str: string, 
        atomic: boolean = false
    ): [string, Token][] {

        if (str.length == 0) {
            return [];
        }

        if (atomic) {
            return [[str, this.toBitsAndRegister(str)]];
        }

        const tokens = tokenizeUnicode(str);
        return tokens.map(c => [c, this.toBitsAndRegister(c)]);
    }

    public toBitsAndRegister(c: string): Token {
        let index = this.strToIndex.get(c);
        if (index == undefined) {
            index = this.registerToken(c);
        }
        return new Token(this.toBits(c));
    }

    public registerToken(token: string): number {
        const index = this.strToIndex.size;
        this.strToIndex.set(token, index);
        this.indexToStr.set(index, token);
        return index;
    }
    
    public toBits(char: string): BitSet {
        const result = new BitSet();
        const index = this.strToIndex.get(char);
        if (index == undefined) {
            return result;
        }
        result.set(index);
        return result;
    }

    public fromBits(bits: BitSet): string[] {
        const result: string[] = [];
        for (const index of bits.toArray()) {
            const char = this.indexToStr.get(index);
            if (char == undefined) {
                break;  // this is crucial, because BitSets are infinite and if
                        // one was created by inversion, it could iterate forever here.
            }
            result.push(char);
        }
        return result;
    }
}

/**
 * This contains information about all the tapes.
 */
export class TapeCollection extends Tape {

    public tapes: Map<string, Tape> = new Map();

    public inVocab(strs: string[]): boolean {
        throw new Error("not implemented");
    } 

    public getTapeNames(): Set<string> {
        return new Set(this.tapes.keys());
    }

    public getTape(name: string): Tape | undefined {
        return this.tapes.get(name);
    }

    public get name(): string {
        if (this.tapes.size == 0) {
            return "__NO_TAPE__";
        }
        return "__ANY_TAPE__";
    }

    public createTape(name: string): Tape {
        // don't remake it if it doesn't exist
        const oldTape = this.getTape(name);
        if (oldTape != undefined) {
            return oldTape;
        }

        // make a new one if it doesn't exist
        const newTape = new StringTape(this, name);
        this.tapes.set(name, newTape);
        return newTape;
    }

    public get size(): number {
        return this.tapes.size;
    }

    public toBits(char: string): BitSet {
        throw new Error("Not implemented");
    }

    public fromBits(bits: BitSet): string[] {
        throw new Error("Not implemented");
    } 

    public any(): Token {
        return ANY_CHAR;
    }

    public none(): Token {
        return NO_CHAR;
    }
}

/**
 * RenamedTapes are necessary for RenameStates to work properly.
 * 
 * From the point of view of any particular state, it believes that particular
 * tapes have particular names, e.g. "text" or "gloss".  However, because renaming is
 * an operator of our relational algebra, different states may be referred to by different
 * names in different parts of the grammar.  
 * 
 * (For example, consider a composition between two FSTS, {"up":"lr", "down":"ll"} and 
 * {"up":"ll", "down":"lh"}.  In order to express their composition as a "join", we have to make it so that
 * the first "down" and the second "up" have the same name.  Renaming does that.
 * 
 * The simplest way to get renaming, so that each state doesn't have to understand the name structure
 * of the larger grammar, is for RenameStates to wrap tapes in a simple adaptor class that makes it seem
 * as if an existing tape has a new name.  That way, any child of a RenameState can (for example) ask for the
 * vocabulary of the tape it thinks is called "down", even if outside of that RenameState the tape is called
 * "text".  
 */
export class RenamedTape extends Tape {

    constructor(
        public child: Tape,
        public fromTape: string,
        public toTape: string
    ) { 
        super();
    }

    public get name(): string {
        const childName = this.child.name;
        if (childName == this.toTape) {
            return this.fromTape;
        }
        return childName;
    }
    
    public inVocab(strs: string[]): boolean {
        return this.child.inVocab(strs);
    }

    public any(): Token {
        return this.child.any();
    }

    public none(): Token {
        return this.child.none();
    }

    public match(str1: Token, str2: Token): Token {
        return this.child.match(str1, str2);
    }

    protected adjustTapeName(name: string) {
        return (name == this.fromTape) ? this.toTape : name;
    }

    public getTapeNames(): Set<string> {
        const result = [...this.child.getTapeNames()]
                       .filter(s => this.adjustTapeName(s));
        return new Set(result);
    }

    public tokenize(
        str: string, 
        atomic: boolean = false
    ): [string, Token][] {
        return this.child.tokenize(str);
    }

    public getTape(name: string): Tape | undefined {
        if (name != this.fromTape && name == this.toTape) {
            return undefined;
        }
        name = this.adjustTapeName(name);
        const newChild = this.child.getTape(name);
        if (newChild == undefined) {
            return undefined;
        }
        return new RenamedTape(newChild, this.fromTape, this.toTape);
    }

    public toBits(char: string): BitSet {
        return this.child.toBits(char);
    }

    public fromBits(bits: BitSet): string[] {
        return this.child.fromBits(bits);
    }
}