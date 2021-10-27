import { 
    MPDelay, 
    MPAlternation, 
    MPSequence, 
    MPUnreserved, 
    MPParser, 
    miniParse,
    MPRepetition 
} from "./miniParser";

/**
 * This module is concerned with cells that have operators in them (e.g. ~ and |),
 * which need to be parsed into more complex structures in order that (in combination
 * with Headers) we can assign them the right Grammar objects and later Expr objects.
 */

export interface CPResult { 
    
    /**
     * The IDs of CPResult are deliberately chosen to NOT look like their
     * string when expressed as a regex.  That makes it easy to see from the ID
     * when the regex has been parsed incorrectly.
     */
    readonly id: string;
}

export class CPError {

    constructor(
        public text: string
    ) { }

    public get id(): string {
        return `ERR`;
    }
}

export class CPUnreserved implements CPResult {
    
    constructor(
        public text: string
    ) { 
        this.text = text.trim();
    }

    public get id(): string {
        return this.text;
    }
}

export class CPStar implements CPResult {

    constructor(
        public child: CPResult
    ) { }

    public get id(): string {
        return `STAR[${this.child.id}]`;
    }
}

export class CPQuestionMark implements CPResult {

    constructor(
        public child: CPResult
    ) { }

    public get id(): string {
        return `QUES[${this.child.id}]`;
    }
}

export class CPPlus implements CPResult {

    constructor(
        public child: CPResult
    ) { }

    public get id(): string {
        return `PLUS[${this.child.id}]`;
    }
}

export class CPNegation implements CPResult {
    constructor(
        public child: CPResult
    ) { }

    public get id(): string {
        return `NOT[${this.child.id}]`;
    }
}

export class CPAlternation implements CPResult {
    constructor(
        public child1: CPResult,
        public child2: CPResult
    ) { }
    
    public get id(): string {
        return `OR[${this.child1.id},${this.child2.id}]`;
    }
}

export class CPSequence implements CPResult {
    constructor(
        public children: CPResult[]
    ) { }

    public get id(): string {
        return `[${this.children.map(c=>c.id).join(",")}]`;
    }
}

var EXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(ALTERNATION, SUBEXPR)
);

var SUBEXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(NEGATION, STAR, QUES, PLUS, SUBSUBEXPR)
);

var SUBSUBEXPR: MPParser<CPResult> = MPDelay(() =>
    MPAlternation(UNRESERVED, PARENS)
);

const RESERVED = new Set(["(", ")", "~", "|", "*", "?", "+"]);
const UNRESERVED = MPUnreserved<CPResult>(RESERVED, (s) => new CPUnreserved(s));

const TOPLEVEL_EXPR = MPRepetition(
    EXPR, 
    (...children) => new CPSequence(children)
);

const STAR = MPSequence(
    [ SUBSUBEXPR, "*" ],
    (child) => new CPStar(child)
)

const QUES = MPSequence(
    [ SUBSUBEXPR, "?" ],
    (child) => new CPQuestionMark(child)
)

const PLUS = MPSequence(
    [ SUBSUBEXPR, "+" ],
    (child) => new CPPlus(child)
)

const PARENS = MPSequence(
    ["(", TOPLEVEL_EXPR, ")"],
    (child) => child 
);

const NEGATION = MPSequence(
    ["~", SUBEXPR],
    (child) => new CPNegation(child)
);

const ALTERNATION = MPSequence(
    [SUBEXPR, "|", EXPR],
    (c1, c2) => new CPAlternation(c1, c2)
);

function tokenize(text: string): string[] {
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
    return results;

}

export function parseBooleanCell(text: string): CPResult {
    const results = miniParse(tokenize, TOPLEVEL_EXPR, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new CPError(text);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        console.log([...results]);
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}


