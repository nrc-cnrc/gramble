

export class Tier { 
    
    public constructor(
        public name: string
    ) { }

}

export class CommentTier extends Tier { }

export class UnaryTier extends Tier {

    public constructor(
        name: string,
        public child: Tier
    ) { 
        super(name);
    }

}

export class BinaryTier extends Tier {
    public constructor(
        name: string,
        public child1: Tier,
        public child2: Tier
    ) { 
        super(name);
    }
}

type TierParser = (input: string[]) => Generator<[Tier, string[]], void, boolean | undefined>;

const SYMBOL = [ "(", ")", "%", "/"];
export const UNARY_RESERVED = [ "maybe", "require", "before", "after", "final", "alt" ];
export const ONE_TIER_RESERVED = [ "join", "shift", "upward", "downward" ];
const ALL_RESERVED = SYMBOL.concat(UNARY_RESERVED);


const SUBEXPR = AltTierParser([Identifier, ParensTierParser]);
const NON_COMMENT_EXPR = AltTierParser([UnaryTierParser, OneTierParser, SlashTierParser, SUBEXPR]);
const EXPR = AltTierParser([CommentTierParser, NON_COMMENT_EXPR]);

function* Identifier(input: string[]): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || ALL_RESERVED.indexOf(input[0]) != -1) {
        return;
    }
    yield [new Tier(input[0]), input.slice(1)];
}

function AltTierParser(children: TierParser[]): TierParser {
    
    return function*(input: string[]) {
        for (const child of children) {
            yield* child(input);
        }
    }
}

function* OneTierParser(input: string[]): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || ONE_TIER_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of Identifier(input.slice(1))) {
        yield [new UnaryTier(input[0], t), rem];
    }
}

function* UnaryTierParser(input: string[]): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || UNARY_RESERVED.indexOf(input[0]) == -1) {
        return;
    }
    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        yield [new UnaryTier(input[0], t), rem];
    }
}


function* ParensTierParser(input: string[]): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0 || input[0] != "(") {
        return;
    }

    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        if (rem.length == 0 || rem[0] != ")") {
            return;
        }

        yield [t, rem.slice(1)]
    }
}

function* SlashTierParser(input: string[]): Generator<[Tier, string[]], void, boolean | undefined> {
    if (input.length == 0) {
        return;
    }

    for (const [t1, rem1] of SUBEXPR(input)) {
        if (rem1.length == 0 || rem1[0] != "/") {
            return;
        }
        for (const [t2, rem2] of NON_COMMENT_EXPR(rem1.slice(1))) {
            yield [new BinaryTier("/", t1, t2), rem2];
        }
    }

}

function* CommentTierParser(input: string[]): Generator<[Tier, string[]], void, boolean | undefined> {

    if (input.length == 0 || input[0] != "%") {
        return;
    }

    yield [new CommentTier("%"), []];
}

export function parseTier(s: string): Tier {
    var pieces = s.split(/\s+|(\(|\)|\/)/);
    pieces = pieces.filter((s) => s !== undefined && s !== '');
    var result = [... EXPR(pieces)];
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