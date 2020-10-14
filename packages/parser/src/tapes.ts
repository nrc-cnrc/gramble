import { BitSet } from "bitset";
import { Gen, StringDict } from "./util";


/**
 * Output
 * 
 * The outputs of this algorithm are kept as tries, since that's the natural
 * shape of a set of outputs from a non-deterministic parsing algorithm.  (E.g., if
 * we've already output "fooba", and at the next state we could either output "r" or
 * "z", then just having "r" and "z" point to that previous output is both less effort
 * and less space than copying it twice and concatenating it.  Especially if "z" ends
 * up being a false path and we end up discarding it; that would mean we had copied/
 * concatenated for nothing.)   
 */

/*
class Output {

    public add(tape: Tape, text: Token) {
        return new SuccessiveOutput(tape, text, this);
    }

    public *toObj(): Gen<StringDict> { 
        yield {};
    }
}

class SuccessiveOutput extends Output {

    constructor(
        public tape: Tape,
        public text: Token,
        public prev: Output
    ) { 
        super();
    }

    public *toObj(): Gen<StringDict> {
        for (const result of this.prev.toObj()) {
            if (this.tape.numTapes == 0) {
                yield result;
                return;
            }
            if (!(this.tape.tapeName in result)) {
                result[this.tape.tapeName] = "";
            }
            for (const c of this.tape.fromBits(this.tape.tapeName, this.text.bits)) {
                result[this.tape.tapeName] += c;
                yield result;
            }
        }
    }
} */

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

    public *getStrings(): Gen<string> {
        var prevStrings = [""];
        if (this.prev != undefined) {
            prevStrings = [... this.prev.getStrings()];
        }

        for (const s of prevStrings) {
            for (const c of this.tape.fromBits(this.tape.tapeName, this.token.bits)) {
                yield s + c;
            }
        }
    }
}

export class MultiTapeOutput {

    public singleTapeOutputs: Map<string, SingleTapeOutput> = new Map();

    public add(tape: Tape, token: Token) {
        if (tape.numTapes == 0) {
            return this;
        }

        const result = new MultiTapeOutput();
        result.singleTapeOutputs = new Map(this.singleTapeOutputs);
        const prev = this.singleTapeOutputs.get(tape.tapeName);
        const newTape = new SingleTapeOutput(tape, token, prev);
        result.singleTapeOutputs.set(tape.tapeName, newTape);
        return result;
    }

    public toStrings(): StringDict[] {
        var results: StringDict[] = [ {} ];
        for (const [tapeName, tape] of this.singleTapeOutputs) {
            var newResults: StringDict[] = [];
            for (const str of tape.getStrings()) {
                for (const result of results) {
                    const newResult: StringDict = Object.assign(result);
                    newResult[tapeName] = str;
                    newResults.push(newResult);
                }
            }
            results = newResults;
        }
        return results;
    }
} 





export abstract class Tape {
    
    public abstract readonly tapeName: string;
    public abstract readonly numTapes: number;

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

    public abstract matchTape(tapeName: string): Tape | undefined;
    //public abstract registerTokens(tapeName: string, tokens: string[]): void;
    public abstract toBits(tapeName: string, char: string): BitSet;
    public abstract fromBits(tapeName: string, bits: BitSet): string[];
}

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
}

export const ANY_CHAR: Token = new Token(new BitSet().flip());
export const NO_CHAR: Token = new Token(new BitSet());

export class StringTape extends Tape {

    constructor(
        public tapeName: string,
        public current: Token | undefined = undefined,
        public prev: StringTape | undefined = undefined,
        public strToIndex: Map<string, number> = new Map(),
        public indexToStr: Map<number, string> = new Map()
    ) { 
        super();
    }

    public get numTapes(): number {
        return 1;
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

    
    public append(token: Token) {
        return new StringTape(this.tapeName, token,
                this, this.strToIndex, this.indexToStr);
    }

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

export class TapeCollection extends Tape {

    public tapes: Map<string, Tape> = new Map();

    public get numTapes(): number {
        return this.tapes.size;
    }

    public addTape(tape: Tape): void {
        this.tapes.set(tape.tapeName, tape);
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
            tape = new StringTape(tapeName);
            this.tapes.set(tapeName, tape);
        }
        return tape.tokenize(tapeName, str);
    }

    public matchTape(tapeName: string): Tape | undefined {
        return this.tapes.get(tapeName);
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
}

export class RenamedTape extends Tape {

    constructor(
        public child: Tape,
        public fromTape: string,
        public toTape: string
    ) { 
        super();
    }

    public get tapeName(): string {
        return this.child.tapeName;
    }

    public get numTapes(): number {
        return this.child.numTapes;
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

    public toBits(tapeName: string, char: string): BitSet {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.toBits(tapeName, char);
    }

    public fromBits(tapeName: string, bits: BitSet): string[] {
        tapeName = this.adjustTapeName(tapeName);
        return this.child.fromBits(tapeName, bits);
    }
}
