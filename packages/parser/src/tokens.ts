import { BitSet } from "bitset";
import { BitsetTape } from "./tapes";


interface IToken {

    and(other: IToken): IToken;
    rightAnd(other: UnentangledToken): IToken;
    readonly entanglements: number[];
    //andNot(other: IToken): IToken;
    //or(other: IToken): IToken;
}

export class UnentangledToken implements IToken {
 
    constructor(
        public bits: BitSet
    ) { }

    public and(other: IToken): IToken {
        return other.rightAnd(this);
    }
    
    public rightAnd(other: UnentangledToken): IToken {
        return new UnentangledToken(this.bits.and(other.bits));
    }

    public get entanglements(): number[] {
        return [];
    }

}

let ENTANGLE_INDEX: number = 0;

export class EntangledToken implements IToken {

    constructor(
        public child: IToken,
        public entanglement: number
    ) { }

    public and(other: IToken): EntangledToken {
        const newChild = this.child.and(other);
        return new EntangledToken(newChild, this.entanglement);
    }

    public rightAnd(other: UnentangledToken): EntangledToken {
        const newChild = this.child.rightAnd(other);
        return new EntangledToken(newChild, this.entanglement);
    }
    
    public get entanglements(): number[] {
        return [this.entanglement, ...this.child.entanglements];
    }

}

const x = new UnentangledToken(new BitSet());
const y = new UnentangledToken(new BitSet());
const z = x.and(y);
console.log(z.entanglements);

const y1 = new EntangledToken(y, 1);
const z1 = x.and(y1);
console.log(z1.entanglements);

const x2 = new EntangledToken(x, 2);
const z2 = x.and(x2);
console.log(z2.entanglements);

const z12 = y1.and(x2);
console.log(z12.entanglements);

const y13 = new EntangledToken(y1, 3);
const z123 = y13.and(x2);
console.log(z123.entanglements);

const x24 = new EntangledToken(x2, 4);
const z124 = y1.and(x24);
console.log(z124.entanglements);

const z1245 = new EntangledToken(z124, 5);
console.log(z1245.entanglements);