import { AlternationGrammar, DotGrammar, EmbedGrammar, EpsilonGrammar, Grammar, LiteralGrammar, NegationGrammar, RepeatGrammar, SequenceGrammar } from "./grammars";
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
} from "./miniParser";
import { Err, Msgs, Result, resultList } from "./msgs";
import { DUMMY_REGEX_TAPE, HIDDEN_TAPE_PREFIX } from "./util";

export type RegexParser = MPParser<Regex>;

/**
 * This module is concerned with cells that have operators in them (e.g. ~ and |),
 * which need to be parsed into more complex structures in order that (in combination
 * with Headers) we can assign them the right Grammar objects and later Expr objects.
 */

export abstract class Regex { 
    
    /**
     * The IDs of Regex objects are deliberately chosen to NOT look like their
     * string when expressed as a regex.  That makes it easy to see from the ID
     * when the regex has been parsed incorrectly.
     */
    public abstract get id(): string;

    public abstract toGrammar(): Grammar;

    public msg(msgs: Msgs = []): Result<Regex> {
        return new Result(this, msgs);
    }

}

export class ErrorRegex extends Regex {

    constructor(
        public text: string
    ) { 
        super();
    }

    public get id(): string {
        return `ERR`;
    }

    public toGrammar(): Grammar {
        return new EpsilonGrammar();
    }
}

export class LiteralRegex extends Regex {
    
    constructor(
        public text: string
    ) { 
        super();
        this.text = text.trim();
    }

    public get id(): string {
        return this.text;
    }

    public toGrammar(): Grammar {
        return new LiteralGrammar(DUMMY_REGEX_TAPE, this.text);
    }
}

export class DotRegex extends Regex {

    public get id(): string {
        return "DOT";
    }

    public toGrammar(): Grammar {
        return new DotGrammar(DUMMY_REGEX_TAPE);
    }
}

export class SymbolRegex extends Regex {

    constructor(
        public child: LiteralRegex
    ) { 
        super();
    }

    public get id(): string {
        return `EMB[${this.child.id}]`;
    }

    public toGrammar(): Grammar {
        return new EmbedGrammar(this.child.text);
    }
}

export class StarRegex extends Regex {

    constructor(
        public child: Regex
    ) { 
        super();
    }

    public get id(): string {
        return `STAR[${this.child.id}]`;
    }

    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new RepeatGrammar(childGrammar);
    }
}

export class QuestionRegex extends Regex {

    constructor(
        public child: Regex
    ) { 
        super();
    }

    public get id(): string {
        return `QUES[${this.child.id}]`;
    }
    
    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new RepeatGrammar(childGrammar, 0, 1);
    }
}

export class PlusRegex extends Regex {

    constructor(
        public child: Regex
    ) { 
        super();
    }

    public get id(): string {
        return `PLUS[${this.child.id}]`;
    }
    
    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new RepeatGrammar(childGrammar, 1);
    }
}

export class NegationRegex extends Regex {

    constructor(
        public child: Regex
    ) { 
        super();
    }

    public get id(): string {
        return `NOT[${this.child.id}]`;
    }

    public toGrammar(): Grammar {
        const childGrammar = this.child.toGrammar();
        return new NegationGrammar(childGrammar);
    }
}

export class AlternationRegex extends Regex {

    constructor(
        public child1: Regex,
        public child2: Regex
    ) { 
        super();
    }
    
    public get id(): string {
        return `OR[${this.child1.id},${this.child2.id}]`;
    }

    public toGrammar(): Grammar {
        const child1Grammar = this.child1.toGrammar();
        const child2Grammar = this.child2.toGrammar();
        return new AlternationGrammar([child1Grammar, child2Grammar]);
    }
}

export class SequenceRegex extends Regex {

    constructor(
        public children: Regex[]
    ) { 
        super();
    }

    public get id(): string {
        return `[${this.children.map(c=>c.id).join(",")}]`;
    }

    public toGrammar(): Grammar {
        if (this.children.length == 0) {
            return new LiteralGrammar(DUMMY_REGEX_TAPE, "");
        }

        const childGrammars = this.children.map(c => 
                                c.toGrammar());
        return new SequenceGrammar(childGrammars);
    }
}

/* RESERVED SYMBOLS */
const RESERVED_FOR_PLAINTEXT = new Set(["|"]);
const RESERVED_FOR_REGEX = new Set([...RESERVED_FOR_PLAINTEXT, "(", ")", "~", "*", "?", "+", "{", "}", "."]);
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
    REGEX_SYMBOL,
    REGEX_DOT
));

const REGEX_UNRESERVED = MPUnreserved<Regex>(
    s => new LiteralRegex(s).msg()
);

const REGEX_TOPLEVEL = MPRepetition(
    REGEX_EXPR, 
    (...children) => resultList(children)
                        .bind(cs => new SequenceRegex(cs))
);

const REGEX_DOT = MPSequence<Regex>(
    [ "." ],
    () => new DotRegex().msg()
)

const REGEX_STAR = MPSequence(
    [ REGEX_SUBSUBEXPR, "*" ],
    (child) => child.bind(c => new StarRegex(c))
)

const REGEX_QUES = MPSequence(
    [ REGEX_SUBSUBEXPR, "?" ],
    (child) => child.bind(c => new QuestionRegex(c))
)

const REGEX_PLUS = MPSequence(
    [ REGEX_SUBSUBEXPR, "+" ],
    (child) => child.bind(c => new PlusRegex(c))
)

const REGEX_PARENS = MPSequence(
    ["(", REGEX_TOPLEVEL, ")"],
    (child) => child 
);

const REGEX_SYMBOL = MPSequence(
    ["{", REGEX_UNRESERVED, "}"],
    (child) => child.bind(c => new SymbolRegex(c as LiteralRegex))
);

const REGEX_NEGATION = MPSequence(
    ["~", REGEX_SUBEXPR],
    (child) => child.bind(c => new NegationRegex(c))
);

const REGEX_ALTERNATION = MPSequence(
    [REGEX_SUBEXPR, "|", REGEX_EXPR],
    (c1, c2) => resultList([c1, c2])
                    .bind(([x, y]) => new AlternationRegex(x, y))
);

/* PLAINTEXT GRAMMAR */
const PLAINTEXT_EXPR: RegexParser = MPDelay(() => MPAlt(
    PLAINTEXT_UNRESERVED, 
    PLAINTEXT_ALTERNATION)
);

const PLAINTEXT_UNRESERVED = MPUnreserved<Regex>(
    s => new LiteralRegex(s).msg()
);

const PLAINTEXT_ALTERNATION = MPSequence(
    [ PLAINTEXT_UNRESERVED, "|", PLAINTEXT_EXPR ],
    (c1, c2) => resultList([c1, c2])
                    .bind(([x, y]) => new AlternationRegex(x, y))
);

export function parse(
    text: string, 
    splitters: Set<string>,
    reserved: Set<string>,
    topLevelExpr: RegexParser
): Result<Regex> {
    const env = new MiniParseEnv(splitters, reserved);
    const results = miniParse(env, topLevelExpr, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorRegex(text).msg([Err("Cannot parse this cell", 
                    `Cannot parse ${text} as a content cell`)])
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}

export function parseRegex(text: string): Result<Regex> {
    return parse(text, RESERVED_FOR_REGEX, new Set(), REGEX_TOPLEVEL);
}

export function parsePlaintext(text: string): Result<Regex> {
    return parse(text, RESERVED_FOR_PLAINTEXT, new Set(), PLAINTEXT_EXPR);
}

export function parseContext(text: string): Result<Regex> {
    return parse(text, RESERVED_FOR_CONTEXT, new Set(), REGEX_TOPLEVEL);
}