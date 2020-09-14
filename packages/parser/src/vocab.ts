import { BitSet } from "bitset";
import { Gen } from "./util";

export abstract class Vocab {

    public abstract add(tape: string, char: string): void;
    public abstract allChars(): Gen<[string, string]>;
    public abstract toBits(tape: string, char: string): BitSet;
    public abstract fromBits(tape: string, bits: BitSet): string[];

    
    public combine(other: Vocab): Vocab {
        for (const [tape, char] of other.allChars()) {
            this.add(tape, char);
        }
        return this;
    }
}

export class BasicVocab extends Vocab {

    public charToIndex: Map<string, Map<string, number>> = new Map();
    public indexToChar: Map<string, Map<number, string>> = new Map();

    public add(tape: string, char: string): void {

        var charToIndex = this.charToIndex.get(tape);
        if (charToIndex == undefined) {
            charToIndex = new Map();
            this.charToIndex.set(tape, charToIndex);
        }

        var indexToChar = this.indexToChar.get(tape);
        if (indexToChar == undefined) {
            indexToChar = new Map();
            this.indexToChar.set(tape, indexToChar);
        }

        if (charToIndex.has(char)) {
            return;
        }

        const index = charToIndex.size;
        charToIndex.set(char, index);
        indexToChar.set(index, char);
    }

    public *allChars(): Gen<[string, string]> {
        for (const [tape, charToIndex] of this.charToIndex.entries()) {
            for (const char of charToIndex.keys()) {
                yield [tape, char];
            }
        }
    }


    public toBits(tape: string, char: string): BitSet {
        const result = new BitSet();
        const charToIndex = this.charToIndex.get(tape);
        if (charToIndex == undefined) {
            return result;
        }
        const index = charToIndex.get(char);
        if (index == undefined) {
            return result;
        }
        result.set(index);
        return result;
    }

    public fromBits(tape: string, bits: BitSet): string[] {
        const result: string[] = [];
        const indexToChar = this.indexToChar.get(tape);
        if (indexToChar == undefined) {
            return result;
        }
        for (const index of bits.toArray()) {
            const char = indexToChar.get(index);
            if (char == undefined) {
                break;  // this is crucial, btw, because BitSets are infinite and if
                        // one was created by inversion, it could iterate forever here.
            }
            result.push(char);
        }
        return result;
    }

    public rename(fromTape: string, toTape: string): Vocab {
        const result = new BasicVocab();
        
        for (var [tape, charToIndex] of this.charToIndex.entries()) {
            if (tape == toTape) {
                tape = fromTape;
            }
            for (const char of charToIndex.keys()) {   
                result.add(tape, char);
            }
        }
        return this;
    }
}

export class RenamedVocab extends Vocab {

    public constructor(
        public fromTape: string,
        public toTape: string,
        public childVocab: Vocab
    ) { 
        super();
    }

    public add(tape: string, char: string): void {
        if (tape == this.toTape) {
            tape = this.fromTape;
        }
        this.childVocab.add(tape, char);
    }

    public *allChars(): Gen<[string, string]> {
        for (const [tape, char] of this.childVocab.allChars()) {
            if (tape == this.fromTape) {
                yield [this.toTape, char];
                continue;
            }
            yield [tape, char];
        }
    }

    
    public toBits(tape: string, char: string): BitSet {
        if (tape == this.fromTape) {
            tape = this.toTape;
        }
        return this.childVocab.toBits(tape, char);
    }

    public fromBits(tape: string, bits: BitSet): string[] {
        if (tape == this.toTape) {
            tape = this.fromTape;
        }
        return this.childVocab.fromBits(tape, bits);
    }
}
