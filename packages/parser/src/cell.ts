import { Component, CPass, CResult } from "./components";
import { EpsilonGrammar } from "./grammars";
import { 
    MPDelay, 
    MPAlt, 
    MPSequence, 
    MPUnreserved, 
    MPParser, 
    miniParse,
    MPRepetition, 
    MiniParseEnv,
    MPEmpty
} from "./miniParser";
import { Err, Msgs, Result, resultList } from "./msgs";
import { PassEnv } from "./passes";
import { ParseClass } from "./passes/headerToGrammar";
import { 
    isValidSymbolName,
    RESERVED_FOR_CONTEXT, 
    RESERVED_FOR_PLAINTEXT, 
    RESERVED_FOR_REGEX, 
    RESERVED_FOR_SYMBOL, 
    RESERVED_WORDS 
} from "./reserved";

export type RegexParser = MPParser<Regex>;

/**
 * This module is concerned with cells that have operators in them (e.g. ~ and |),
 * which need to be parsed into more complex structures in order that (in combination
 * with Headers) we can assign them the right Grammar objects and later Expr objects.
 */

export abstract class Regex extends Component { 
    
    /**
     * The IDs of Regex objects are deliberately chosen to NOT look like their
     * string when expressed as a regex.  That makes it easy to see from the ID
     * when the regex has been parsed incorrectly.
     */
    public abstract get id(): string;

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

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new ErrorRegex(this.text).msg();
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

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new LiteralRegex(this.text).msg();
    }
}

export class DotRegex extends Regex {

    public get id(): string {
        return "DOT";
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new DotRegex().msg();
    }
}

/**
 * A SymbolRegex represents a single symbol identifier (e.g. "Verb"),
 * in a potential chain of identifiers (e.g. "Verb.Intrans.ClassB").
 */
export class SymbolRegex extends Regex {

    constructor(
        public text: string
    ) { 
        super();
    }

    public get id(): string {
        return `${this.text}`;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new SymbolRegex(this.text).msg();
    }
}

export class SymbolChainRegex extends Regex {

    constructor(
        public child1: Regex,
        public child2: Regex
    ) {
        super();
    }

    public get id(): string {
        return `CHAIN[${this.child1.id},${this.child2.id}]`;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.child1, this.child2])
                    .map(c => f.transform(c, env))
                    .bind(([c1,c2]) => new SymbolChainRegex(
                            c1 as Regex, c2 as Regex))
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
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new StarRegex(c as Regex));
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

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new QuestionRegex(c as Regex));
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
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new PlusRegex(c as Regex));
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
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new NegationRegex(c as Regex));
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
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.child1, this.child2])
                .map(c => f.transform(c, env))
                .bind(([c1,c2]) => new AlternationRegex(c1 as Regex, c2 as Regex));
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

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList(this.children)
                .map(c => f.transform(c, env))
                .bind(cs => new SequenceRegex(cs as Regex[]));
    }
}

/***********************/
/* SYMBOL NAME GRAMMAR */
/***********************/

const SYMBOL_SUBEXPR: RegexParser = MPDelay(() => MPAlt(
    SYMBOL_ALTERNATION,
    SYMBOL_UNIT
));

const SYMBOL_BRACKETED = MPSequence(
    [ "{", SYMBOL_SUBEXPR, "}" ],
    (child) => child.warn("Curly braces are not valid under " + 
                "an 'embed' header or inside other curly braces.")
);

const SYMBOL_EMPTY = MPEmpty(
    () => new LiteralRegex("").msg()
);

const SYMBOL_UNRESERVED = MPUnreserved<Regex>(
    (s) => {
        if (isValidSymbolName(s)) {
            return new SymbolRegex(s).msg()
        } else {
            return new ErrorRegex(s).msg([Err( 
                `Invalid symbol name`, 
                `${s} looks like it should be an identifier, ` +
                `but identifiers should start with letters or _`
            )]);
        }
    } 
);

const SYMBOL_CHAIN: RegexParser = MPDelay(() => MPSequence(
    [ SYMBOL_UNRESERVED, ".", MPAlt(SYMBOL_CHAIN, SYMBOL_UNRESERVED) ],
    (c1, c2) => resultList([c1,c2])
                    .bind(([c1,c2]) => new SymbolChainRegex(c1, c2))
));

const SYMBOL_UNIT = MPAlt(
    SYMBOL_UNRESERVED,
    SYMBOL_BRACKETED,
    SYMBOL_CHAIN,
)

const SYMBOL_ALTERNATION = MPSequence(
    [ SYMBOL_UNIT, "|", SYMBOL_SUBEXPR ],
    (c1, c2) => resultList([c1, c2])
                    .bind(([x, y]) => new AlternationRegex(x, y))
);

const SYMBOL_EXPR = MPAlt(
    SYMBOL_EMPTY, 
    SYMBOL_SUBEXPR
);

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
    (...children) => resultList(children).bind(cs => {
        if (cs.length == 0) return new LiteralRegex("");
        if (cs.length == 1) return cs[0];
        return new SequenceRegex(cs);
    })
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
    ["{", SYMBOL_SUBEXPR, "}"],
    (child) => child
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

/*********************/
/* PLAINTEXT GRAMMAR */
/*********************/

const PLAINTEXT_SUBEXPR: MPParser<Regex> = MPDelay(() => MPAlt(
    PLAINTEXT_UNRESERVED,
    PLAINTEXT_ALTERNATION
));

const PLAINTEXT_UNRESERVED = MPUnreserved<Regex>(
    s => new LiteralRegex(s).msg()
);

const PLAINTEXT_ALTERNATION = MPSequence(
    [ PLAINTEXT_UNRESERVED, "|", PLAINTEXT_SUBEXPR ],
    (c1, c2) => resultList([c1, c2])
                    .bind(([x, y]) => new AlternationRegex(x, y))
);

const PLAINTEXT_EXPR = MPRepetition<Regex>(
    PLAINTEXT_SUBEXPR, 
    (...children) => resultList(children)
                        .bind(cs => new SequenceRegex(cs))
);

const parseParams = {

    "plaintext": {
        splitters: RESERVED_FOR_PLAINTEXT,
        reserved: RESERVED_FOR_PLAINTEXT,
        expr: PLAINTEXT_EXPR
    },

    "regex": {
        splitters: RESERVED_FOR_REGEX,
        reserved: RESERVED_FOR_REGEX,
        expr: REGEX_TOPLEVEL
    },

    "context": {
        splitters: RESERVED_FOR_CONTEXT,
        reserved: RESERVED_FOR_CONTEXT,
        expr: REGEX_TOPLEVEL  // TODO: this eventually won't be regex
    },

    "symbol": {
        splitters: RESERVED_FOR_SYMBOL, 
        reserved: RESERVED_WORDS, 
        expr: SYMBOL_EXPR
    }
}

export function parseCell(
    parseClass: ParseClass,
    text: string
): Result<Regex> {
    if (parseClass == "none") {
        return new ErrorRegex(text).msg();
    }
    const params = parseParams[parseClass];
    const env = new MiniParseEnv(params.splitters, params.reserved);
    const results = miniParse(env, params.expr, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorRegex(text).msg([Err("Cell parsing error", 
                    `Cannot parse ${text} as a ${parseClass}`)])
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}