import { MPDelay, MPAlternation, MPSequence, MPUnreserved, MPParser, miniParse } from "./miniParser";

/**
 * This module is concerned with cells that have operators in them (e.g. ~ and |),
 * which need to be parsed into more complex structures in order that (in combination
 * with Headers) we can assign them the right Grammar objects and later Expr objects.
 */

export interface CPResult { }

export class CPUnreserved implements CPResult {
    constructor(
        public text: string
    ) { 
        this.text = text.trim();
    }
}

export class CPNegation implements CPResult {
    constructor(
        public child: CPResult
    ) { }
}

export class CPAlternation implements CPResult {
    constructor(
        public child1: CPResult,
        public child2: CPResult
    ) { }
}

var EXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(NEGATION, ALTERNATION, SUBEXPR)
);

var SUBEXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(UNRESERVED, PARENS)
);

const RESERVED = new Set(["(", ")", "~", "|"]);
const UNRESERVED = MPUnreserved<CPResult>(RESERVED, (s) => new CPUnreserved(s));

const PARENS = MPSequence(
    ["(", EXPR, ")"],
    (child) => child 
)

const NEGATION = MPSequence(
    ["~", EXPR],
    (child) => new CPNegation(child)
);

const ALTERNATION = MPSequence(
    [SUBEXPR, "|", EXPR],
    (c1, c2) => new CPAlternation(c1, c2)
)

const tokenizer = new RegExp("(" + 
                            [...RESERVED].map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

export function parseBooleanCell(text: string): CPResult {
    return miniParse(tokenize, EXPR, text);
}


