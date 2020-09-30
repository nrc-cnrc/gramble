import { BitSet } from "bitset";
import { Gen } from "./util";

export abstract class Tape {
    
    public abstract readonly tapeName: string;
    public abstract readonly numTapes: number;

    public plus(str1: string, str2: string): string[] {
        throw new Error(`Not implemented`);
    }
    
    public times(str1: BitSet, str2: BitSet): BitSet {
        throw new Error(`Not implemented`);
    }

    public one(): BitSet {
        throw new Error(`Not implemented`);
    }

    public abstract matchTape(tapeName: string): Tape | undefined;
    public abstract registerToken(tapeName: string, char: string): void;
    public abstract toBits(tapeName: string, char: string): BitSet;
    public abstract fromBits(tapeName: string, bits: BitSet): string[];
}

export class StringTape extends Tape {

    constructor(
        public tapeName: string,
        public value: BitSet[] = [],
        public strToIndex: Map<string, number> = new Map(),
        public indexToStr: Map<number, string> = new Map()
    ) { 
        super();
    }

    public get numTapes(): number {
        return 1;
    }

    public matchTape(tapeName: string): Tape | undefined {
        return (tapeName == this.tapeName) ? this : undefined;
    }

    public one(): BitSet {
        return new BitSet().flip();
    }

    public plus(str1: string, str2: string): string[] {
        return [str1 + str2];
    }
    
    public times(str1: BitSet, str2: BitSet): BitSet {
        return str1.and(str2);
    }

    public tokenize(str: string): string[] {
        return str.split("");
    }

    public registerToken(tapeName: string, str: string): void {

        if (tapeName != this.tapeName) {
            throw new Error(`Trying to add a character from tape ${tapeName} to tape ${this.tapeName}`);
        }

        for (const token of this.tokenize(str)) {
            if (this.strToIndex.has(token)) {
                continue;
            }

            const index = this.strToIndex.size;
            this.strToIndex.set(token, index);
            this.indexToStr.set(index, token);
        }
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

    public plus(oldResults: string, newResult: string): string[] {
        if (oldResults == "" || oldResults == newResult) {
            return [newResult];
        }
        return [];
    }

    public tokenize(str: string): string[] {
        return [str];
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

    public registerToken(tapeName: string, char: string): void {
        var tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            tape = new StringTape(tapeName);
            this.tapes.set(tapeName, tape);
        }
        tape.registerToken(tapeName, char);
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

    public one(): BitSet {
        return this.child.one();
    }

    public plus(str1: string, str2: string): string[] {
        return this.child.plus(str1, str2);
    }

    public times(str1: BitSet, str2: BitSet): BitSet {
        return this.child.times(str1, str2);
    }


    matchTape(tapeName: string): Tape | undefined {
        if (tapeName == this.fromTape) {
            tapeName = this.toTape;
        }
        const newChild = this.child.matchTape(tapeName);
        if (newChild == undefined) {
            return undefined;
        }
        return new RenamedTape(newChild, this.fromTape, this.toTape);
    }

    public registerToken(tapeName: string, char: string): void {
        if (tapeName == this.fromTape) {
            tapeName = this.toTape;
        }
        return this.child.registerToken(tapeName, char);
    }

    toBits(tapeName: string, char: string): BitSet {
        if (tapeName == this.fromTape) {
            tapeName = this.toTape;
        }
        return this.child.toBits(tapeName, char);
    }

    fromBits(tapeName: string, bits: BitSet): string[] {
        if (tapeName == this.fromTape) {
            tapeName = this.toTape;
        }
        return this.child.fromBits(tapeName, bits);
    }
}
