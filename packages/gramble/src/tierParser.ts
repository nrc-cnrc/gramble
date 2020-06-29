import { GPosition } from "./util";

export class Tier { 
    
    public constructor(
        public name: string,
        public pos: GPosition,
    ) { }

}

export class CommentTier extends Tier { }

export class UnaryTier extends Tier {

    public constructor(
        name: string,
        pos: GPosition,
        public child: Tier
    ) { 
        super(name, pos);
    }

}

export class BinaryTier extends Tier {
    public constructor(
        name: string,
        pos: GPosition,
        public child1: Tier,
        public child2: Tier
    ) { 
        super(name, pos);
    }
}

type TierParser = (input: string[], pos: GPosition) => Generator<[Tier, string[]], void, boolean | undefined>;

const SYMBOL = [ "(", ")", "%", "/"];
const UNARY_RESERVED = [ "maybe", "require", "before", "after", "final", "alt", "not" ];
const ONE_TIER_RESERVED = [ "join", "shift", "upward", "downward" ];
const ALL_RESERVED = SYMBOL.concat(UNARY_RESERVED).concat(ONE_TIER_RESERVED);

const SUBEXPR = AltTierParser([Identifier, ParensTierParser]);
const NON_COMMENT_EXPR = AltTierParser([UnaryTierParser, OneTierParser, SlashTierParser, SUBEXPR]);
const EXPR = AltTierParser([CommentTierParser, NON_COMMENT_EXPR]);

function* Identifier(input: string[], pos: GPosition): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || ALL_RESERVED.indexOf(input[0]) != -1) {
        return;
    }
    yield [new Tier(input[0], pos), input.slice(1)];
}

function AltTierParser(children: TierParser[]): TierParser {
    
    return function*(input: string[], pos: GPosition) {
        for (const child of children) {
            yield* child(input, pos);
        }
    }
}

function* OneTierParser(input: string[], pos: GPosition): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || ONE_TIER_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of Identifier(input.slice(1), pos)) {
        yield [new UnaryTier(input[0], pos, t), rem];
    }
}

function* UnaryTierParser(input: string[], pos: GPosition): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || UNARY_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1), pos)) {
        yield [new UnaryTier(input[0], pos, t), rem];
    }
}


function* ParensTierParser(input: string[], pos: GPosition): Generator<[Tier, string[]], void, boolean | undefined> {
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

function* SlashTierParser(input: string[], pos: GPosition): Generator<[Tier, string[]], void, boolean | undefined> {
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

function* CommentTierParser(input: string[], pos: GPosition): Generator<[Tier, string[]], void, boolean | undefined> {

    if (input.length == 0 || input[0] != "%") {
        return;
    }

    yield [new CommentTier("%", pos), []];
}

export function parseTier(s: string, pos: GPosition): Tier {
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