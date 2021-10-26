import { MPDelay, MPAlternation, MPSequence, MPUnreserved, MPParser, miniParse, MPEmpty } from "./miniParser";

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

export class CPEmpty implements CPResult {}

var EXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(ALTERNATION, SUBEXPR)
);

var TOPLEVEL_EXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(EXPR, EMPTY)
);

var SUBEXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(UNRESERVED, PARENS, NEGATION)
);

const RESERVED = new Set(["(", ")", "~", "|"]);
const UNRESERVED = MPUnreserved<CPResult>(RESERVED, (s) => new CPUnreserved(s));
const EMPTY = MPEmpty<CPResult>(new CPEmpty());

const PARENS = MPSequence(
    ["(", TOPLEVEL_EXPR, ")"],
    (child) => child 
)

const NEGATION = MPSequence(
    ["~", SUBEXPR],
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
    console.log(`text was ${text}`);
    let results: string[] = [ "" ];
    for (var i = 0; i < text.length; i++) {
        const c1 = text[i];
        const c2 = text[i+1];
        if (c1 == '\\') {
            results[results.length-1] = results[results.length-1] +
                                    ((c2 != undefined) ? c2 : "");
            ++i;
            continue;
        } 

        if (RESERVED.has(c1)) {
            results.push(c1);
            results.push("");
            continue;
        }

        results[results.length-1] = results[results.length-1] + c1;

    }
    results = results.filter(s => s.length > 0);
    console.log(`results were [${results.join(",")}]`);
    return results;

}

export function parseBooleanCell(text: string): CPResult {
    return miniParse(tokenize, TOPLEVEL_EXPR, text);
}


