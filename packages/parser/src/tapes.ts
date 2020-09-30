import { BitSet } from "bitset";
import { Gen } from "./util";

export abstract class Tape {
    
    public abstract readonly name: string;
    public abstract readonly numTapes: number;
    public abstract matchTape(tapeName: string): Tape | undefined;
    public abstract add(tapeName: string, char: string): void;
    public abstract allChars(): Gen<[string, string]>;
    public abstract toBits(tapeName: string, char: string): BitSet;
    public abstract fromBits(tapeName: string, bits: BitSet): string[];

    public combineVocab(other: Tape): Tape {
        const result = new TapeCollection();
        for (const [tapeName, char] of this.allChars()) {
            result.add(tapeName, char);
        }
        for (const [tapeName, char] of other.allChars()) {
            result.add(tapeName, char);
        }
        return result;
    }
}

export class SingleTape extends Tape {

    public strToIndex: Map<string, number> = new Map();
    public indexToStr: Map<number, string> = new Map();

    constructor(
        public name: string
    ) { 
        super();
    }

    public get numTapes(): number {
        return 1;
    }

    public matchTape(tapeName: string): Tape | undefined {
        return (tapeName == this.name) ? this : undefined;
    }

    public add(tapeName: string, char: string): void {

        if (tapeName != this.name) {
            throw new Error(`Trying to add a character from tape ${tapeName} to tape ${this.name}`);
        }

        if (this.strToIndex.has(char)) {
            return;
        }

        const index = this.strToIndex.size;
        this.strToIndex.set(char, index);
        this.indexToStr.set(index, char);
    }

    public *allChars(): Gen<[string, string]> {
        for (const char of this.strToIndex.keys()) {
            yield [this.name, char];
        }
    }
    
    public toBits(tapeName: string, char: string): BitSet {
        if (tapeName != this.name) {
            throw new Error(`Trying to get bits on tape ${tapeName} from tape ${this.name}`);
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
        if (tapeName != this.name) {
            throw new Error(`Trying to get bits on tape ${tapeName} from tape ${this.name}`);
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

export class TapeCollection extends Tape {

    public tapes: Map<string, Tape> = new Map();

    public get numTapes(): number {
        return this.tapes.size;
    }

    public addTape(tape: Tape): void {
        this.tapes.set(tape.name, tape);
    }

    public get name(): string {
        if (this.tapes.size == 0) {
            return "__NO_TAPE__";
        }
        return "__ANY_TAPE__";
    }

    public add(tapeName: string, char: string): void {
        var tape = this.tapes.get(tapeName);
        if (tape == undefined) {
            tape = new SingleTape(tapeName);
            this.tapes.set(tapeName, tape);
        }
        tape.add(tapeName, char);
    }

    public matchTape(tapeName: string): Tape | undefined {
        return this.tapes.get(tapeName);
    }

    public *allChars(): Gen<[string, string]> {
        for (const tape of this.tapes.values()) {
            yield* tape.allChars();
        }
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

    public get name(): string {
        return this.child.name;
    }

    public get numTapes(): number {
        return this.child.numTapes;
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

    public add(tapeName: string, char: string): void {
        if (tapeName == this.toTape) {
            tapeName = this.fromTape;
        }
        return this.child.add(tapeName, char);
    }

    public *allChars(): Gen<[string, string]> {
        for (const [tape, char] of this.child.allChars()) {
            if (tape == this.fromTape) {
                yield [this.toTape, char];
                continue;
            }
            yield [tape, char];
        }
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
