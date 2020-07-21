import { GPos, Gen, meanAngleDeg, HSVtoRGB, RGBtoString} from "./util";


const DEFAULT_SATURATION = 0.1;
const DEFAULT_VALUE = 1.0;

export class Tier implements GPos { 
    
    public sheet: string;
    public row: number;
    public col: number;

    public constructor(
        public text: string,
        pos: GPos = { sheet: "", row: -1, col: -1 }
    ) { 
        this.sheet = pos.sheet;
        this.row = pos.row;
        this.col = pos.col;
    }

    public get hue(): number {
        const str = this.text + "extrasalt" // otherwise short strings are boring colors
        var hash = 0; 

        for (let i = 0; i < str.length; i++) { 
            hash = ((hash << 5) - hash) + str.charCodeAt(i); 
            hash = hash & hash; 
        } 
        
        return (hash & 0xFF) / 255;
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return RGBtoString(...HSVtoRGB(this.hue, saturation, value));
    }

    public getFgColor(): string {
        return "#000000";
    }
}

export class CommentTier extends Tier { 

    public get hue(): number {
        return 0;
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return "#FFFFFF";
    }

    public getFgColor(): string {
        return "#449944";
    }
}

export class UnaryTier extends Tier {

    public constructor(
        name: string,
        pos: GPos,
        public child: Tier
    ) { 
        super(name, pos);
    }

    public get hue(): number {
        return this.child.hue;
    }

}

export class BinaryTier extends Tier {
    public constructor(
        name: string,
        pos: GPos,
        public child1: Tier,
        public child2: Tier
    ) { 
        super(name, pos);
    }

    
    public get hue(): number {
        return meanAngleDeg([this.child1.hue * 360, this.child2.hue * 360]) / 360;
    }

}

type TierParser = (input: string[], pos: GPos) => Gen<[Tier, string[]]>;

const SYMBOL = [ "(", ")", "%", "/"];
const UNARY_RESERVED = [ "maybe", "require", "before", "after", "alt", "not" ];
const ONE_TIER_RESERVED = [ "join", "shift", "upward", "downward", "input", "contains", "equals" ];
const ALL_RESERVED = SYMBOL.concat(UNARY_RESERVED).concat(ONE_TIER_RESERVED);

const SUBEXPR = AltTierParser([Identifier, ParensTierParser]);
const NON_COMMENT_EXPR = AltTierParser([UnaryTierParser, OneTierParser, SlashTierParser, SUBEXPR]);
const EXPR = AltTierParser([CommentTierParser, NON_COMMENT_EXPR]);

function* Identifier(input: string[], pos: GPos): Gen<[Tier, string[]]> {
    if (input.length == 0 || ALL_RESERVED.indexOf(input[0]) != -1) {
        return;
    }
    yield [new Tier(input[0], pos), input.slice(1)];
}

function AltTierParser(children: TierParser[]): TierParser {
    
    return function*(input: string[], pos: GPos) {
        for (const child of children) {
            yield* child(input, pos);
        }
    }
}

function* OneTierParser(input: string[], pos: GPos): Gen<[Tier, string[]]> {
    if (input.length == 0 || ONE_TIER_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of Identifier(input.slice(1), pos)) {
        yield [new UnaryTier(input[0], pos, t), rem];
    }
}

function* UnaryTierParser(input: string[], pos: GPos): Gen<[Tier, string[]]> {
    if (input.length == 0 || UNARY_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1), pos)) {
        yield [new UnaryTier(input[0], pos, t), rem];
    }
}


function* ParensTierParser(input: string[], pos: GPos): Gen<[Tier, string[]]> {
    if (input.length == 0 || input[0] != "(") {
        return;
    }

    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1), pos)) {
        if (rem.length == 0 || rem[0] != ")") {
            return;
        }

        yield [t, rem.slice(1)]
    }
}

function* SlashTierParser(input: string[], pos: GPos): Gen<[Tier, string[]]> {
    if (input.length == 0) {
        return;
    }

    for (const [t1, rem1] of SUBEXPR(input, pos)) {
        if (rem1.length == 0 || rem1[0] != "/") {
            return;
        }
        for (const [t2, rem2] of NON_COMMENT_EXPR(rem1.slice(1), pos)) {
            yield [new BinaryTier("/", pos, t1, t2), rem2];
        }
    }

}

function* CommentTierParser(input: string[], pos: GPos): Gen<[Tier, string[]]> {

    if (input.length == 0 || input[0] != "%") {
        return;
    }

    yield [new CommentTier("%", pos), []];
}

export function parseTier(s: string, pos: GPos): Tier {
    var pieces = s.split(/\s+|(\(|\)|\/)/);
    pieces = pieces.filter((s) => s !== undefined && s !== '');
    var result = [... EXPR(pieces, pos)];
    result = result.filter(([t, r]) => r.length == 0);
    if (result.length == 0) {
        throw new Error(`Cannot parse tier: ${s}`);
    }
    if (result.length > 1) {
         // shouldn't happen with this grammar, but just in case
        throw new Error(`Ambiguous tier description: ${s}`);
    }
    return result[0][0];
}