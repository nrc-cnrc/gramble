import { BitSet } from "bitset";
import { Gen, StringDict } from "./util";


/**
 * Outputs
 * 
 * The outputs of this algorithm are kept as tries, since that's the natural
 * shape of a set of outputs from a non-deterministic parsing algorithm.  (E.g., if
 * we've already output "fooba", and at the next state we could either output "r" or
 * "z", then just having "r" and "z" point to that previous output is both less effort
 * and less space than copying it twice and concatenating it.  Especially if "z" ends
 * up being a false path and we end up discarding it; that would mean we had copied/
 * concatenated for nothing.)   
 * 
 * It used to be that we just kept every tape output in one trie (like an output
 * might have characters on different tapes interleaved).  That's fine when it's guaranteed
 * that every concatenation succeeds (like for string concatenation), but when it's something like
 * flag concatenation (which can fail), that means we have to search backwards through the trie
 * to find the most recent output on the relevant tape.  So now, outputs are segregated by tape.
 * A SingleTapeOutput represents the output on a given tape, and then there's a separate object that
 * represents a collection of them (by keeping a pointer to the appropriate output along each tape).
 * 
 * TODO: There's currently some conceptual duplication between these Outputs and the various Tape
 * objects, which store *information* about tapes (like their names and vocabs) without storing any
 * actual outputs onto those tapes.  Each Output is associated with a particular Tape, there are collections
 * of both corresponding to each other, etc.  We should eventually refactor these so that there's only
 * one hierarchy of objects, "tapes" to which you can write and also know their own information.
 */

class SingleTapeOutput {

    constructor(
        public tape: Tape,
        public token: Token,
        public prev: SingleTapeOutput | undefined = undefined
    ) { }

    public add(tape: Tape, token: Token) {
        if (tape.tapeName != this.tape.tapeName) {
            throw new Error(`Incompatible tapes: ${tape.tapeName}, ${this.tape.tapeName}`);
        }
        return new SingleTapeOutput(tape, token, this);
    }

    public *getStrings(random: boolean = false): Gen<string> {

        var results: string[] = [ "" ];

        var currentTape: SingleTapeOutput | undefined = this;

        // step backward through the current object and its prevs, building the output strings from
        // right to left.  (you might think this would be more elegant to be done recursively, but it blows
        // the stack when stringifying long outputs.)
        while (currentTape != undefined) {
            const newResults: string[] = [];
            let possibleChars = currentTape.tape.fromBits(currentTape.tape.tapeName, currentTape.token.bits);
            if (random) {
                // if we're randomizing, just choose one possible char
                possibleChars = [possibleChars[Math.floor(Math.random() * possibleChars.length)]];
            }
            for (const c of possibleChars) {   
                for (const existingResult of results) {
                    newResults.push(c + existingResult);
                }
            }
            results = newResults;
            currentTape = currentTape.prev;
        }

        yield* results;
    }
}

/**
 * Multi tape output
 * 
 * This stores a collection of outputs on different tapes, by storing a collection of pointers to them.
 * When you add a <tape, char> pair to it (say, <text,b>), you return a new MultiTapeOutput that now
 * points to a new SingleTapeOutput corresponding to "text" -- the new one with "b" added -- and keep 
 * all the old pointers the same.
 */
export class MultiTapeOutput {

    public singleTapeOutputs: Map<string, SingleTapeOutput> = new Map();

    public add(tape: Tape, token: Token) {
        if (tape.isTrivial) {
            return this;
        }

        const result = new MultiTapeOutput();
        result.singleTapeOutputs = new Map(this.singleTapeOutputs);
        const prev = this.singleTapeOutputs.get(tape.tapeName);
        const newTape = new SingleTapeOutput(tape, token, prev);
        result.singleTapeOutputs.set(tape.tapeName, newTape);
        return result;
    }

    public toStrings(random: boolean = false): StringDict[] {
        var results: StringDict[] = [ {} ];
        for (const [tapeName, tape] of this.singleTapeOutputs) {
            var newResults: StringDict[] = [];
            for (const str of tape.getStrings(random)) {
                for (const result of results) {
                    const newResult: StringDict = Object.assign({}, result);
                    newResult[tapeName] = str;
                    newResults.push(newResult);
                }
            }
            results = newResults;
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
 * 
 * TODO: Refactor Outputs and Tapes so that they're all one kind of object, because currently
 * we're keeping a duplicated hierarchy in which the Output and Tape class hierarchies mirror 
 * each other.
 */
export abstract class Tape {
    
    constructor(
        public parent: TapeCollection | undefined = undefined
    ) { }

    public abstract readonly tapeName: string;

    public abstract readonly isTrivial: boolean;

    public abstract getTapeNames(): Set<string>;

    
    public getTape(tapeName: string): Tape | undefined {
        if (this.parent == undefined) {
            return undefined;
        }
        return this.parent.getTape(tapeName);
    }

    public add(str1: string, str2: string): string[] {
        throw new Error(`Not implemented`);
    }
    
    public match(str1: Token, str2: Token): Token {
        throw new Error(`Not implemented`);
    }

    public any(): Token {
        throw new Error(`Not implemented`);
    }
    
    public *plus(tapeName: string, other: BitSet): Gen<Tape> {
        throw new Error(`Not implemented`);
    }

    public *times(tapeName: string, other: BitSet): Gen<Tape> {
        throw new Error(`Not implemented`);
    }

    public tokenize(tapeName: string, str: string): Token[] {
        throw new Error(`Not implemented`);
    }

    
    public get vocabSize(): number {
        return 0;
    }

    public abstract matchTape(tapeName: string): Tape | undefined;
    //public abstract registerTokens(tapeName: string, tokens: string[]): void;
    public abstract toBits(tapeName: string, char: string): BitSet;
    public abstract fromBits(tapeName: string, bits: BitSet): string[];

    
    public toToken(tapeName: string, char: string): Token {
        return new Token(this.toBits(tapeName, char));
    }

    public fromToken(tapeName: string, token: Token): string[] {
        return this.fromBits(tapeName, token.bits);
    }

}

/**
 * Token
 * 
 * This encapsulates a token, so that parsers need not necessarily know how, exactly, a token is implemented.
 * Right now we only have one kind of token, strings implemented as BitSets, but eventually this should be an
 * abstract class with (e.g.) StringToken, maybe FlagToken, ProbToken and/or LogToken (for handling weights), 
 * etc.
 * 
 */
export class Token {
 
    constructor(
        public bits: BitSet
    ) { }

    public and(other: Token): Token {
        return new Token(this.bits.and(other.bits));
    }

    public andNot(other: Token): Token {
        return new Token(this.bits.andNot(other.bits));
    }

    public isEmpty(): boolean {
        return this.bits.isEmpty();
    }

    public stringify(tape: Tape): string {
        return tape.fromBits(tape.tapeName, this.bits).join("|");
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
        parent: TapeCollection,
        public tapeName: string,
        public current: Token | undefined = undefined,
        public prev: StringTape | undefined = undefined,
        public strToIndex: Map<string, number> = new Map(),
        public indexToStr: Map<number, string> = new Map()
    ) { 
        super(parent);
    }

    public get isTrivial(): boolean {
        return false;
    }

    public get vocabSize(): number {
        return this.strToIndex.size;
    }

    public getTapeNames(): Set<string> {
        return new Set([this.tapeName]);
    }

    /*
    public *plus(tapeName: string, other: BitSet): Gen<Tape> {
        if (tapeName != this.tapeName) {
            return;
        }
        yield new StringTape(this.tapeName, other, 
                            this, this.strToIndex, this.indexToStr);
    }

    public *times(tapeName: string, other: BitSet): Gen<Tape> {
        if (tapeName != this.tapeName) {
            return;
        }
        const result = this.current.and(other);
        if (result.isEmpty()) {
            return;
        }
        yield new StringTape(this.tapeName, result, this.prev,
                            this.strToIndex, this.indexToStr);
    }
    */

    /*
    public append(token: Token) {
        return new StringTape(this.tapeName, token,
                this, this.strToIndex, this.indexToStr);
    } */

    public *getStrings(): Gen<string> {

        var prevStrings = [""];
        if (this.prev != undefined) {
            prevStrings = [... this.prev.getStrings()];
        }

        if (this.current == undefined) {
            yield* prevStrings;
            return;
        }

        for (const s of prevStrings) {
            for (const c of this.fromBits(this.tapeName, this.current.bits)) {
                yield s + c;
            }
        }
    }

    public matchTape(tapeName: string): Tape | undefined {
        return (tapeName == this.tapeName) ? this : undefined;
    }

    public any(): Token {
        return new Token( new BitSet().flip());
    }

    public add(str1: string, str2: string): string[] {
        return [str1 + str2];
    }

    public match(str1: Token, str2: Token): Token {
        return new Token(str1.bits.and(str2.bits));
    }

    public tokenize(tapeName: string, str: string): Token[] {
        
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to add a character from tape ${tapeName} to tape ${this.tapeName}`);
        }

        const results: Token[] = [];
        for (const c of str.split("")) {

            var index = this.strToIndex.get(c);

            if (index == undefined) {
                index = this.registerToken(c);
            }
            const newToken = new Token(this.toBits(tapeName, c));
            results.push(newToken);
        }
        return results;
    }

    public registerToken(token: string): number {
        const index = this.strToIndex.size;
        this.strToIndex.set(token, index);
        this.indexToStr.set(index, token);
        return index;
    }
    
    public toBits(tapeName: string, char: string): BitSet {
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to get bits on tape ${tapeName} from tape ${this.tapeName}`);
        }
        
        const result = new BitSet();
        const index = this.strToIndex.get(char);
        if (index == undefined) {
            return result;
        }
        result.set(index);
        return result;
    }

    public fromBits(tapeName: string, bits: BitSet): string[] {
        if (tapeName != this.tapeName) {
            throw new Error(`Trying to get bits on tape ${tapeName} from tape ${this.tapeName}`);
        }

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
 * A tape containing flags, roughly identical to a "U" flag in XFST/LEXC.  
 * This uses a different method for "add" than a normal string tape; you can
 * always concatenate a string to a string, but trying to add a flag to a different
 * flag will fail.
 * 
 * At the moment this isn't used anywhere.
 */
class FlagTape extends StringTape {

    public add(oldResults: string, newResult: string): string[] {
        if (oldResults == "" || oldResults == newResult) {
            return [newResult];
        }
        return [];
    }

    public tokenize(tapeName: string, str: string): Token[] {
        var index = this.strToIndex.get(str);
        if (index == undefined) {
            index = this.registerToken(str);
        } 
        return [new Token(this.toBits(tapeName, str))];
    }
}

/**
 * This contains information about all the tapes.  When we do a "free query" in the state machine,
 * what we're saying is "match anything on any tape".  Eventually, something's going to match on a particular
 * tape, so we have to have that information handy for all tapes.  (That is to say, something like a LiteralState
 * knows what tape it cares about only as a string, say, "text".  In a constrained query, we pass in a normal StringTape
 * object, and if it's the "text" tape, matchTape("text") succeeds and returns itself, and if it doesn't, 
 * matchTape("text") fails.  In a free query, we pass in one of these objects, and when we matchTape("text"), we
 * return the StringTape corresponding to "text".  That's why we need an object that collects all of them, so we
 * can return the appropriate one when it's needed.)
 */
export class TapeCollection extends Tape {

    public tapes: Map<string, Tape> = new Map();
    
    public get isTrivial(): boolean {
        return this.tapes.size == 0;
    }

    /*
    public addTape(tape: Tape): void {
        this.tapes.set(tape.tapeName, tape);
    } */
    
    public getTapeNames(): Set<string> {
        return new Set(this.tapes.keys());
    }

    public getTape(tapeName: string): Tape | undefined {
        return this.tapes.get(tapeName);
    }

    public get tapeName(): string {
        if (this.tapes.size == 0) {
            return "__NO_TAPE__";
        }
        return "__ANY_TAPE__";
    }
    
    public tokenize(tapeName: string, str: string): Token[] {
        var tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            tape = new StringTape(this, tapeName);
            this.tapes.set(tapeName, tape);
        }
        return tape.tokenize(tapeName, str);
    }

    public matchTape(tapeName: string): Tape | undefined {
        return this.tapes.get(tapeName);
    }

    public split(tapeNames: Set<string>): [TapeCollection, TapeCollection] {
        const wheat = new TapeCollection();
        const chaff = new TapeCollection();
        for (const [tapeName, tape] of this.tapes.entries()) {
            if (tapeNames.has(tapeName)) {
                wheat.tapes.set(tapeName, tape);
                continue;
            } 
            chaff.tapes.set(tapeName, tape);
        }
        return [wheat, chaff];
    }

    public get size(): number {
        return this.tapes.size;
    }

    public toBits(tapeName: string, char: string): BitSet {
        const tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            throw new Error(`Undefined tape: ${tapeName}`);
        }
        return tape.toBits(tapeName, char);
    }

    public fromBits(tapeName: string, bits: BitSet): string[] {
        const tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            throw new Error(`Undefined tape: ${tapeName}`);
        }
        return tape.fromBits(tapeName, bits);
    }

    public any(): Token {
        return ANY_CHAR;
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

    public get tapeName(): string {
        const childName = this.child.tapeName;
        if (childName == this.toTape) {
            return this.fromTape;
        }
        return childName;
    }
    
    public get isTrivial(): boolean {
        return this.child.isTrivial;
    }

    public any(): Token {
        return this.child.any();
    }

    public add(str1: string, str2: string): string[] {
        return this.child.add(str1, str2);
    }

    public match(str1: Token, str2: Token): Token {
        return this.child.match(str1, str2);
    }

    protected adjustTapeName(tapeName: string) {
        return (tapeName == this.fromTape) ? this.toTape : tapeName;
    }

    
    public getTapeNames(): Set<string> {
        const result = [...this.child.getTapeNames()]
                       .filter(s => this.adjustTapeName(s));
        return new Set(result);
    }

    public matchTape(tapeName: string): Tape | undefined {
        tapeName = this.adjustTapeName(tapeName);
        const newChild = this.child.matchTape(tapeName);
        if (newChild == undefined) {
            return undefined;
        }
        return new RenamedTape(newChild, this.fromTape, this.toTape);
    }

    public tokenize(tapeName: string, str: string): Token[] {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.tokenize(tapeName, str);
    }

    public getTape(tapeName: string): Tape | undefined {
        if (this.parent == undefined) {
            return undefined;
        }
        tapeName = this.adjustTapeName(tapeName);
        return this.parent.getTape(tapeName);
    }

    public toBits(tapeName: string, char: string): BitSet {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.toBits(tapeName, char);
    }

    public fromBits(tapeName: string, bits: BitSet): string[] {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.fromBits(tapeName, bits);
    }
}