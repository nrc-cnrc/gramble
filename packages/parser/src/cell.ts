import { 
    AlternationGrammar, DotGrammar, EmbedGrammar, EpsilonGrammar, Grammar, GrammarResult, Lit, LiteralGrammar, NegationGrammar, RepeatGrammar, RuleContextGrammar, SequenceGrammar } from "./grammars";
import { ParseClass } from "./headers";
import { 
    MPDelay, 
    MPAlt, 
    MPSequence, 
    MPUnreserved, 
    MPParser, 
    miniParse,
    MPRepetition, 
    MiniParseEnv,
    MPEmpty,
    MPUnreservedChar
} from "./miniParser";
import { Err, Result, resultList } from "./msgs";
import { 
    isValidSymbolName,
    RESERVED_FOR_CONTEXT, 
    RESERVED_FOR_PLAINTEXT, 
    RESERVED_FOR_REGEX, 
    RESERVED_FOR_SYMBOL, 
    RESERVED_WORDS 
} from "./reserved";
import { DUMMY_REGEX_TAPE } from "./util";

export type RegexParser = MPParser<Grammar>;

/**
 * This module is concerned with cells that have operators in them (e.g. ~ and |),
 * which need to be parsed into more complex structures in order that (in combination
 * with Headers) we can assign them the right Grammar objects and later Expr objects.
 */

const CELL_EMPTY = MPEmpty(
    () => new LiteralGrammar(DUMMY_REGEX_TAPE, "").msg()
);

/***********************/
/* SYMBOL NAME GRAMMAR */
/***********************/

const SYMBOL_NONEMPTY: RegexParser = MPDelay(() => MPAlt(
    SYMBOL_ALTERNATION,
    SYMBOL_UNIT
));

const SYMBOL_BRACKETED = MPSequence(
    [ "{", SYMBOL_NONEMPTY, "}" ],
    (child) => child.warn("Curly braces are not valid under " + 
                "an 'embed' header or inside other curly braces.")
);

const SYMBOL_UNRESERVED = MPUnreserved<Grammar>(
    (s) => {
        if (isValidSymbolName(s)) {
            return new EmbedGrammar(s).msg()
        } else {
            return new EpsilonGrammar().err(
                `Invalid symbol name`, 
                `${s} looks like it should be an identifier, ` +
                `but it doesn't follow the rules for one.`
            );
        }
    } 
);

const SYMBOL_CHAIN: RegexParser = MPDelay(() => MPSequence(
    [ SYMBOL_UNRESERVED, ".", MPAlt(SYMBOL_CHAIN, SYMBOL_UNRESERVED) ],
    (c1, c2) => resultList([c1,c2]).bind(([c1,c2]) => {
        if (!(c1 instanceof EmbedGrammar) || !(c2 instanceof EmbedGrammar)) {
            return new EpsilonGrammar();
        }
        return new EmbedGrammar(c1.name + "." + c2.name);
    })
));

const SYMBOL_UNIT = MPAlt(
    SYMBOL_UNRESERVED,
    SYMBOL_BRACKETED,
    SYMBOL_CHAIN,
)

const SYMBOL_ALTERNATION = MPSequence(
    [ SYMBOL_UNIT, "|", SYMBOL_NONEMPTY ],
    (c1, c2) => resultList([c1, c2])
                    .bind(cs => new AlternationGrammar(cs))
);

const SYMBOL_EXPR = MPAlt(
    CELL_EMPTY, 
    SYMBOL_NONEMPTY
);

/* REGEX GRAMMAR */

const REGEX_EXPR: RegexParser = MPDelay(() => MPAlt(
    REGEX_ALTERNATION, 
    REGEX_SUBEXPR
));

const REGEX_SUBEXPR: RegexParser = MPDelay(() => MPAlt(
    REGEX_NEGATION, 
    REGEX_SUBSEQ
));

const REGEX_SUBSEQ: RegexParser = MPDelay(() => MPRepetition(
    MPAlt(
        REGEX_STAR, 
        REGEX_QUES, 
        REGEX_PLUS, 
        REGEX_UNIT
    ),
    (...children) => resultList(children).bind(cs => {
        if (cs.length == 0) return new LiteralGrammar(DUMMY_REGEX_TAPE, "");
        if (cs.length == 1) return cs[0];
        return new SequenceGrammar(cs);
    }),
    1, Infinity
));

const REGEX_UNIT: RegexParser = MPDelay(() => MPAlt(
    REGEX_UNRESERVED, 
    REGEX_PARENS, 
    REGEX_SYMBOL,
    REGEX_DOT
));

const REGEX_UNRESERVED = MPUnreservedChar<Grammar>(
    s => new LiteralGrammar(DUMMY_REGEX_TAPE, s).msg()
);

const REGEX_TOPLEVEL = MPAlt(
    CELL_EMPTY,
    REGEX_EXPR
);

const REGEX_DOT = MPSequence<Grammar>(
    [ "." ],
    () => new DotGrammar(DUMMY_REGEX_TAPE).msg()
)

const REGEX_STAR = MPSequence(
    [ REGEX_UNIT, "*" ],
    (child) => child.bind(c => new RepeatGrammar(c))
)

const REGEX_QUES = MPSequence(
    [ REGEX_UNIT, "?" ],
    (child) => child.bind(c => new RepeatGrammar(c, 0, 1))
)

const REGEX_PLUS = MPSequence(
    [ REGEX_UNIT, "+" ],
    (child) => child.bind(c => new RepeatGrammar(c, 1))
)

const REGEX_PARENS = MPSequence(
    ["(", REGEX_TOPLEVEL, ")"],
    (child) => child 
);

const REGEX_SYMBOL = MPSequence(
    ["{", SYMBOL_NONEMPTY, "}"],
    (child) => child
);

const REGEX_NEGATION = MPSequence(
    ["~", REGEX_SUBSEQ],
    (child) => child.bind(c => new NegationGrammar(c))
);

const REGEX_ALTERNATION = MPSequence(
    [REGEX_SUBEXPR, "|", REGEX_EXPR],
    (c1, c2) => resultList([c1, c2])
                    .bind(cs => new AlternationGrammar(cs))
);

/*********************/
/* PLAINTEXT GRAMMAR */
/*********************/


const PLAINTEXT_EXPR: MPParser<Grammar> = MPDelay(() => MPAlt(
    PLAINTEXT_SUBSEQ,
    PLAINTEXT_ALTERNATION
));

const PLAINTEXT_UNRESERVED = MPUnreserved<Grammar>(
    s => new LiteralGrammar(DUMMY_REGEX_TAPE, s).msg()
);

const PLAINTEXT_SUBSEQ = MPRepetition(
    PLAINTEXT_UNRESERVED,
    (...children) => resultList(children).bind(cs => {
        if (cs.length == 0) return new LiteralGrammar(DUMMY_REGEX_TAPE, "");
        if (cs.length == 1) return cs[0];
        return new SequenceGrammar(cs);
    }),
    1, Infinity
);


const PLAINTEXT_ALTERNATION = MPSequence(
    [ PLAINTEXT_SUBSEQ, "|", PLAINTEXT_EXPR ],
    (c1, c2) => resultList([c1, c2])
                    .bind(cs => new AlternationGrammar(cs))
);

const PLAINTEXT_TOPLEVEL = MPAlt(
    CELL_EMPTY,
    PLAINTEXT_EXPR
);

/************************/
/* RULE CONTEXT GRAMMAR */
/************************/

const RULE_CONTEXT = MPSequence(
    [REGEX_TOPLEVEL, '_', REGEX_TOPLEVEL],
    (c1, c2) => resultList([c1, c2])
                .bind(([c1,c2]) => new RuleContextGrammar(
                                     c1, c2, false, false))
);

const RULE_CONTEXT_BEGINS = MPSequence(
    ['#', REGEX_TOPLEVEL, '_', REGEX_TOPLEVEL],
    (c1, c2) => resultList([c1, c2])
                .bind(([c1,c2]) => new RuleContextGrammar(
                                     c1, c2, true, false))
);

const RULE_CONTEXT_ENDS = MPSequence(
    [REGEX_TOPLEVEL, '_', REGEX_TOPLEVEL, '#'],
    (c1, c2) => resultList([c1, c2])
                .bind(([c1,c2]) => new RuleContextGrammar(
                                     c1, c2, false, true))
);

const RULE_CONTEXT_BEGINS_ENDS = MPSequence(
    ['#', REGEX_TOPLEVEL, '_', REGEX_TOPLEVEL, '#'],
    (c1, c2) => resultList([c1, c2])
                .bind(([c1,c2]) => new RuleContextGrammar(
                                     c1, c2, true, true))
);

const RULE_CONTEXT_TOPLEVEL = MPAlt(
    CELL_EMPTY,
    RULE_CONTEXT_BEGINS_ENDS,
    RULE_CONTEXT,
    RULE_CONTEXT_BEGINS,
    RULE_CONTEXT_ENDS,
);

const parseParams = {

    "plaintext": {
        splitters: RESERVED_FOR_PLAINTEXT,
        reserved: RESERVED_FOR_PLAINTEXT,
        expr: PLAINTEXT_TOPLEVEL
    },

    "regex": {
        splitters: RESERVED_FOR_REGEX,
        reserved: RESERVED_FOR_REGEX,
        expr: REGEX_TOPLEVEL
    },

    "ruleContext": {
        splitters: RESERVED_FOR_CONTEXT,
        reserved: RESERVED_FOR_CONTEXT,
        expr: RULE_CONTEXT_TOPLEVEL
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
): GrammarResult {
    if (parseClass == "none" || parseClass == "comment") {
        return new EpsilonGrammar().msg();
    }
    const params = parseParams[parseClass];
    const env = new MiniParseEnv(params.splitters, params.reserved);
    const results = miniParse(env, params.expr, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new EpsilonGrammar().err("Cell parsing error", 
                    `Cannot parse ${text} as a ${parseClass}`);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}

export function cellID(g: Grammar): string {

    switch (g.constructor) {
        case LiteralGrammar: 
            return (g as LiteralGrammar).text;
        case EmbedGrammar: 
            return (g as EmbedGrammar).name;
        case DotGrammar:
            return "DOT";
        case SequenceGrammar: 
            return "[" + (g as SequenceGrammar).children.map(c => cellID(c)).join(",") + "]";
        case AlternationGrammar: 
            return "OR[" + (g as AlternationGrammar).children.map(c => cellID(c)).join(",") + "]";
        case RepeatGrammar: 
            const rep = g as RepeatGrammar;
            if (rep.minReps == 0 && rep.maxReps == 1) return `QUES[${cellID(rep.child)}]`;
            if (rep.minReps == 1 && rep.maxReps == Infinity) return `PLUS[${cellID(rep.child)}]`;
            if (rep.minReps == 0 && rep.maxReps == Infinity) return `STAR[${cellID((g as RepeatGrammar).child)}]`;
            return "???"; // other options don't correspond to any possible cell
        case NegationGrammar:
            return "NOT[" + cellID((g as NegationGrammar).child) + "]";
        case EpsilonGrammar:
            return "ε";
        case RuleContextGrammar:
            const rule = g as RuleContextGrammar;
            const begins = rule.begins ? '#,' : '';
            const ends = rule.ends ? ',#': '';
            return `CONTEXT[${begins}${cellID(rule.preContext)},${cellID(rule.postContext)}${ends}]`
        default: 
            return "???";
    }
}
