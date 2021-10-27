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

export interface Regex { 
    
    /**
     * The IDs of CPResult are deliberately chosen to NOT look like their
     * string when expressed as a regex.  That makes it easy to see from the ID
     * when the regex has been parsed incorrectly.
     */
    readonly id: string;
}

export class ErrorRegex {

    constructor(
        public text: string
    ) { }

    public get id(): string {
        return `ERR`;
    }
}

export class LiteralRegex implements Regex {
    
    constructor(
        public text: string
    ) { 
        this.text = text.trim();
    }

    public get id(): string {
        return this.text;
    }
}

export class StarRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `STAR[${this.child.id}]`;
    }
}

export class QuestionRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `QUES[${this.child.id}]`;
    }
}

export class PlusRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `PLUS[${this.child.id}]`;
    }
}

export class NegationRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `NOT[${this.child.id}]`;
    }
}

export class AlternationRegex implements Regex {

    constructor(
        public child1: Regex,
        public child2: Regex
    ) { }
    
    public get id(): string {
        return `OR[${this.child1.id},${this.child2.id}]`;
    }
}

export class SequenceRegex implements Regex {
    
    constructor(
        public children: Regex[]
    ) { }

    public get id(): string {
        return `[${this.children.map(c=>c.id).join(",")}]`;
    }
}

var EXPR: MPParser<Regex> = MPDelay(() =>
    MPAlternation(ALTERNATION, SUBEXPR)
);

var SUBEXPR: MPParser<Regex> = MPDelay(() =>
    MPAlternation(NEGATION, STAR, QUES, PLUS, SUBSUBEXPR)
);

var SUBSUBEXPR: MPParser<Regex> = MPDelay(() =>
    MPAlternation(UNRESERVED, PARENS)
);

const RESERVED = new Set(["(", ")", "~", "|", "*", "?", "+"]);
const UNRESERVED = MPUnreserved<Regex>(RESERVED, (s) => new LiteralRegex(s));

const TOPLEVEL_EXPR = MPRepetition(
    EXPR, 
    (...children) => new SequenceRegex(children)
);

const STAR = MPSequence(
    [ SUBSUBEXPR, "*" ],
    (child) => new StarRegex(child)
)

const QUES = MPSequence(
    [ SUBSUBEXPR, "?" ],
    (child) => new QuestionRegex(child)
)

const PLUS = MPSequence(
    [ SUBSUBEXPR, "+" ],
    (child) => new PlusRegex(child)
)

const PARENS = MPSequence(
    ["(", TOPLEVEL_EXPR, ")"],
    (child) => child 
);

const NEGATION = MPSequence(
    ["~", SUBEXPR],
    (child) => new NegationRegex(child)
);

const ALTERNATION = MPSequence(
    [SUBEXPR, "|", EXPR],
    (c1, c2) => new AlternationRegex(c1, c2)
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

export function parseRegex(text: string): Regex {
    const results = miniParse(tokenize, TOPLEVEL_EXPR, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorRegex(text);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        console.log([...results]);
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}


