import { AlternationGrammar, EmbedGrammar, EpsilonGrammar, Grammar, LiteralGrammar, NegationGrammar, RepeatGrammar, SequenceGrammar } from "./grammars";
import { 
    MPDelay, 
    MPAlt, 
    MPSequence, 
    MPUnreserved, 
    MPParser, 
    miniParse,
    MPRepetition, 
    MiniParseEnv,
    MPEnv
} from "./miniParserEnv";
import { HIDDEN_TAPE_PREFIX } from "./util";

export type RegexParser = MPParser<Regex>;

/**
 * This module is concerned with cells that have operators in them (e.g. ~ and |),
 * which need to be parsed into more complex structures in order that (in combination
 * with Headers) we can assign them the right Grammar objects and later Expr objects.
 */

export interface Regex { 
    
    /**
     * The IDs of Regex objects are deliberately chosen to NOT look like their
     * string when expressed as a regex.  That makes it easy to see from the ID
     * when the regex has been parsed incorrectly.
     */
    readonly id: string;

    toGrammar(): Grammar;
}

export class ErrorRegex {

    constructor(
        public text: string
    ) { }

    public get id(): string {
        return `ERR`;
    }

    public toGrammar(): Grammar {
        return new EpsilonGrammar();
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

    public toGrammar(): Grammar {
        return new LiteralGrammar(`${HIDDEN_TAPE_PREFIX}`, this.text);
    }
}

export class SymbolRegex implements Regex {

    constructor(
        public child: LiteralRegex
    ) { }

    public get id(): string {
        return `EMB[${this.child.id}]`;
    }

    public toGrammar(): Grammar {
        return new EmbedGrammar(this.child.text);
    }
}

export class StarRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `STAR[${this.child.id}]`;
    }

    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new RepeatGrammar(childGrammar);
    }
}

export class QuestionRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `QUES[${this.child.id}]`;
    }
    
    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new RepeatGrammar(childGrammar, 0, 1);
    }
}

export class PlusRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `PLUS[${this.child.id}]`;
    }
    
    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new RepeatGrammar(childGrammar, 1);
    }
}

export class NegationRegex implements Regex {

    constructor(
        public child: Regex
    ) { }

    public get id(): string {
        return `NOT[${this.child.id}]`;
    }

    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new NegationGrammar(childGrammar);
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

    public toGrammar(): Grammar {
        const child1Grammar = this.child1.toGrammar();
        const child2Grammar = this.child2.toGrammar();
        return new AlternationGrammar([child1Grammar, child2Grammar]);
    }
}

export class SequenceRegex implements Regex {

    constructor(
        public children: Regex[]
    ) { }

    public get id(): string {
        return `[${this.children.map(c=>c.id).join(",")}]`;
    }

    public toGrammar(): Grammar {
        if (this.children.length == 0) {
            return new EpsilonGrammar();
        }

        const childGrammars = this.children.map(c => 
                                c.toGrammar());
        return new SequenceGrammar(childGrammars);
    }
}

/* RESERVED SYMBOLS */
const RESERVED_FOR_PLAINTEXT = new Set(["|"]);
const RESERVED_FOR_REGEX = new Set([...RESERVED_FOR_PLAINTEXT, "(", ")", "~", "*", "?", "+", "{", "}"]);
const RESERVED_FOR_CONTEXT = new Set([...RESERVED_FOR_REGEX, "#", "_"]);

/* REGEX GRAMMAR */

const REGEX_EXPR: RegexParser = MPDelay(() => MPAlt(
    REGEX_ALTERNATION, 
    REGEX_SUBEXPR
));

const REGEX_SUBEXPR: RegexParser = MPDelay(() => MPAlt(
    REGEX_NEGATION, 
    REGEX_STAR, 
    REGEX_QUES, 
    REGEX_PLUS, 
    REGEX_SUBSUBEXPR
));

const REGEX_SUBSUBEXPR: RegexParser = MPDelay(() => MPAlt(
    REGEX_UNRESERVED, 
    REGEX_PARENS, 
    REGEX_SYMBOL
));

const REGEX_UNRESERVED = MPUnreserved<Regex>(s => new LiteralRegex(s));

const REGEX_TOPLEVEL = MPRepetition(
    REGEX_EXPR, 
    (...children) => new SequenceRegex(children)
);

const REGEX_STAR = MPSequence(
    [ REGEX_SUBSUBEXPR, "*" ],
    (child) => new StarRegex(child)
)

const REGEX_QUES = MPSequence(
    [ REGEX_SUBSUBEXPR, "?" ],
    (child) => new QuestionRegex(child)
)

const REGEX_PLUS = MPSequence(
    [ REGEX_SUBSUBEXPR, "+" ],
    (child) => new PlusRegex(child)
)

const REGEX_PARENS = MPSequence(
    ["(", REGEX_TOPLEVEL, ")"],
    (child) => child 
);

const REGEX_SYMBOL = MPSequence(
    ["{", REGEX_UNRESERVED, "}"],
    (child) => new SymbolRegex(child as LiteralRegex) 
);

const REGEX_NEGATION = MPSequence(
    ["~", REGEX_SUBEXPR],
    (child) => new NegationRegex(child)
);

const REGEX_ALTERNATION = MPSequence(
    [REGEX_SUBEXPR, "|", REGEX_EXPR],
    (c1, c2) => new AlternationRegex(c1, c2)
);

/* PLAINTEXT GRAMMAR */
const PLAINTEXT_EXPR: RegexParser = MPDelay(() => MPAlt(
    PLAINTEXT_UNRESERVED, 
    PLAINTEXT_ALTERNATION)
);

const PLAINTEXT_UNRESERVED = MPUnreserved<Regex>(s => new LiteralRegex(s));

const PLAINTEXT_ALTERNATION = MPSequence(
    [ PLAINTEXT_UNRESERVED, "|", PLAINTEXT_EXPR ],
    (c1, c2) => new AlternationRegex(c1, c2)
);

export function parse(
    text: string, 
    reserved: Set<string>,
    topLevelExpr: RegexParser
): Regex {
    const env = new MiniParseEnv(reserved);
    const results = miniParse(env, topLevelExpr, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorRegex(text);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}

export function parseRegex(text: string): Regex {
    return parse(text, RESERVED_FOR_REGEX, REGEX_TOPLEVEL);
}

export function parsePlaintext(text: string): Regex {
    return parse(text, RESERVED_FOR_PLAINTEXT, PLAINTEXT_EXPR);
}

export function parseContext(text: string): Regex {
    return parse(text, RESERVED_FOR_CONTEXT, REGEX_TOPLEVEL);
}