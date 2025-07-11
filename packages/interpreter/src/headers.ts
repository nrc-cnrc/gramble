import { 
    miniParse, MiniParseEnv, MPAlt, MPComment, 
    MPDelay, MPParser,
    MPSequence, MPUnreserved 
} from "./miniParser.js";

import { Msg } from "./utils/msgs.js";

import { ALL_RESERVED, isValidSymbol, RESERVED_SYMBOLS } from "./utils/reserved.js";
import { Component } from "./components.js";
import { DEFAULT_PARAM } from "./utils/constants.js";
import { colorFromText } from "./utils/colors.js";
import { exhaustive } from "./utils/func.js";

export const DEFAULT_SATURATION = 0.05;
export const DEFAULT_VALUE = 1.0;


/** Each header is associated with a ParseClass, which is the answer to the question
 * "According to what grammar should the content under me be parsed?"  E.g., an ordinary
 * tapename header causes the content under it to be parsed as plaintext -- where most 
 * special symbols are parsed as literals with very few exceptions -- whereas a filter
 * header like "equals text" causes the content under it to be parsed as a regex.
 */
export type ParseClass = "plaintext" 
                       | "regex" 
                       | "symbol" 
                       | "ruleContext" 
                       | "tapename" 
                       | "none" 
                       | "comment";

/**
 * A Header is a cell in the top row of a table, consisting of one of
 * 
 * * the name of a tape, like "text" or "gloss"
 * * an atomic operator like "embed" or "hide"
 * * a unary operator like "optional" followed by a valid Header (e.g. "optional text") 
 * * two valid Headers joined by a slash (e.g. "text/gloss")
 * * a valid Header in parentheses (e.g. "(text)")
 * * a comment (e.g. "% text")
 * 
 * (We treat commented-out headers specially, because they turn everything
 * in their column into no-ops.)
 * 
 * Header objects are responsible for:
 * 
 * * compiling the text of the cells beneath them into [Grammars]s, and merging them (usually by
 *   concatenation) with cells to their left.
 * 
 * * calculating the appropriate background color for their cells and the cells in their column. 
 * 
 * Headers are parsed using the "miniParser" engine, a simple parser/combinator engine.
 */

export type Header = EmbedHeader
            | HideHeader 
            | TapeHeader 
            | CommentHeader
            | FromHeader
            | ToHeader
            | RuleContextHeader
            | UniqueHeader
            | FromHeader
            | ToHeader
            | RuleContextHeader
            | UniqueHeader
            | OptionalHeader
            | RenameHeader
            | EqualsHeader
            | StartsHeader
            | EndsHeader
            | ContainsHeader
            | SlashHeader
            | ErrorHeader;

export class EmbedHeader extends Component { 
    public readonly tag = "embed";
}

/**
 * HideHeader is an atomic header "hide:T" that takes the grammar
 * to the left and mangles its name (or otherwise hides it, depending
 * on implementation)
 */
export class HideHeader extends Component { 
    public readonly tag = "hide";
}

/**
 * TapeNameHeaders are references to a particular tape name (e.g. "text")
 */
export class TapeHeader extends Component {
    public readonly tag = "tape";

    constructor(
        public text: string
    ) {
        super();
    }

}

/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 */
export class CommentHeader extends Component { 
    public readonly tag = "comment";
}

/**
 * The ancestor class of unary header operators like "optional", 
 * "not", and ">" (the rename operator)
 */
export abstract class UnaryHeader extends Component {

    public constructor(
        public child: Header
    ) { 
        super();
    }
}

export class FromHeader extends Component {
    public readonly tag = "from";
}

export class ToHeader extends Component {
    public readonly tag = "to";
}

export class RuleContextHeader extends Component {
    public readonly tag = "context";
}

export class UniqueHeader extends UnaryHeader {
    public readonly tag = "unique";
    constructor(
        child: Header
    ) {
        super(child);
    }
}

/**
 * Header that constructs optional parsers, e.g. "optional text"
 */
export class OptionalHeader extends UnaryHeader {
    public readonly tag = "optional";
}

/**
 * Header that constructs renames
 */
export class RenameHeader extends UnaryHeader {
    public readonly tag = "rename";
}

/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a 
 * superset of X.
 */
export class EqualsHeader extends UnaryHeader {
    public readonly tag = "equals";
}

export abstract class ConditionHeader extends UnaryHeader {
    constructor(
        child: Header,
        public tapeName: string
    ) {
        super(child)
    }
}

/**
 * StartsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * start with X (that is, Equals(N, X.*))
 */
export class StartsHeader extends ConditionHeader {
    public readonly tag = "starts";
}

/**
 * EndsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * end with X (that is, Equals(N, .*X))
 */
export class EndsHeader extends ConditionHeader {
    public readonly tag = "ends";
}

/**
 * ContainsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * contain X (that is, Equals(N, .*X.*))
 */
export class ContainsHeader extends ConditionHeader {
    public readonly tag = "contains";
}

export class SlashHeader extends Component {
    public readonly tag = "slash";
    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super();
    }

}

export class ErrorHeader extends Component {
    public readonly tag = "error";
}

/**
 * What follows is a grammar and parser for the mini-language inside headers, e.g.
 * "text", "text/gloss", "starts text", etc.
 * 
 * It uses the mini-parser library in miniParser.ts to construct a recursive-descent
 * parser for the grammar.
 */

const HP_NON_COMMENT_EXPR: MPParser<Header> = MPDelay(() =>
    MPAlt(
        HP_OPTIONAL, HP_SLASH,
        //HP_FROM, HP_TO, 
        //HP_RULE_CONTEXT,
        HP_UNIQUE,
        HP_RENAME, HP_EQUALS, HP_STARTS, 
        HP_ENDS, HP_CONTAINS, HP_SUBEXPR)
);

const HP_SUBEXPR: MPParser<Header> = MPDelay(() =>
    MPAlt(
        HP_UNRESERVED, HP_EMBED, HP_HIDE, 
        HP_PARENS)
);

const HP_COMMENT = MPComment<Header>(
    '%',
    () => new CommentHeader()
);

const HP_UNRESERVED = MPUnreserved<Header>(
    (s) => {
        if (isValidSymbol(s)) {
            return new TapeHeader(s)
        } else {
            throw new ErrorHeader().err(
                `Invalid header: '${s}'`, 
                `'${s}' looks like it should be a header, ` +
                "but headers should start with letters or _");
        }
    } 
);

const HP_EMBED = MPSequence<Header>(
    ["embed"],
    () => new EmbedHeader()
);

const HP_HIDE = MPSequence<Header>(
    ["hide"],
    () => new HideHeader()
);

const HP_OPTIONAL = MPSequence<Header>(
    ["optional", HP_NON_COMMENT_EXPR],
    ([c]) => new OptionalHeader(c)
);

/*
const HP_FROM = MPSequence<Header>(
    ["from"],
    () => new FromHeader()
);

const HP_TO = MPSequence<Header>(
    ["to"],
    () => new ToHeader()
);

const HP_RULE_CONTEXT = MPSequence<Header>(
    ["context"],
    () => new RuleContextHeader()
); */

const HP_UNIQUE = MPSequence<Header>(
    ["unique", HP_NON_COMMENT_EXPR],
    ([c]) => new UniqueHeader(c)
);

const HP_SLASH = MPSequence<Header>(
    [HP_SUBEXPR, "/", HP_NON_COMMENT_EXPR],
    ([c1,c2]) => new SlashHeader(c1,c2)
);

const HP_RENAME = MPSequence<Header>(
    [">", HP_UNRESERVED],
    ([c]) => new RenameHeader(c)
);

const HP_PARENS = MPSequence<Header>(
    ["(", HP_NON_COMMENT_EXPR, ")"],
    ([c]) => c 
);

const HP_EQUALS = MPSequence<Header>(
    ["equals", HP_NON_COMMENT_EXPR],
    ([c]) => {
        if (!(c instanceof TapeHeader)) {
            throw new ErrorHeader().err( 
                    `Equals requires an ordinary header`, 
                    `Equals can only apply to ordinary headers (e.g. "equals text").`);
        }
        return new EqualsHeader(c);
    }
);

const HP_STARTS = MPSequence<Header>(
    ["starts", HP_NON_COMMENT_EXPR],
    ([c]) => {
        if (!(c instanceof TapeHeader)) {
            throw new ErrorHeader().err(
                    `Starts requires an ordinary header`, 
                    `Starts can only apply to ordinary headers (e.g. "starts text").`);
        }
        return new StartsHeader(c, c.text)
    }
);

const HP_ENDS = MPSequence<Header>(
    ["ends", HP_NON_COMMENT_EXPR],
    ([c]) => {
        if (!(c instanceof TapeHeader)) {
            throw new ErrorHeader().err(
                    `Ends requires an ordinary header`, 
                    `Ends can only apply to ordinary headers (e.g. "ends text").`);
        }
        return new EndsHeader(c, c.text);
    }
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    ([c]) => {
        if (!(c instanceof TapeHeader)) {
            throw new ErrorHeader().err(
                    `Contains an ordinary header`, 
                    `Contains can only apply to ordinary headers (e.g. "contains text").`);
        }
        return new ContainsHeader(c, c.text);
    }
);

const HP_EXPR: MPParser<Header> = MPAlt(HP_COMMENT, HP_NON_COMMENT_EXPR);

export function parseHeaderCell(text: string): Msg<Header> {

    const env = new MiniParseEnv(RESERVED_SYMBOLS, ALL_RESERVED);
    const results = miniParse(env, HP_EXPR, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        const trimmedText = text.trim();
        return new ErrorHeader().err(`Invalid header: '${trimmedText}'`,
                                    `Cannot parse '${trimmedText}' as a header.`);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse '${text}'.`);
    }
    return results[0];
}

export function parseClass(h: Header): ParseClass {
    switch (h.tag) {
        case "embed":    return "symbol";
        case "tape":     return "plaintext";
        case "comment":  return "none";
        case "optional": return parseClass(h.child);
        case "equals":   return "regex";
        case "starts":   return "regex";
        case "ends":     return "regex";
        case "contains": return "regex";
        case "slash":    return "plaintext";
        case "hide":     return "tapename";
        case "rename":   return "tapename";
        case "error":    return "none";
        case "from":     return "regex";
        case "to":       return "plaintext";
        case "context":  return "ruleContext";
        case "unique":   return "plaintext";
        default: exhaustive(h)
    }
}

export function fontColor(h: Header): string {
    const pc = parseClass(h);
    switch (pc) {
        case "comment":     return "#669944";
        case "none":        return "#000000";
        case "tapename":    return "#000000";
        case "plaintext":   return "#064a3f";
        case "regex":       return "#bd1128";
        case "ruleContext": return "#bd1128";
        case "symbol":      return "#333333"; 
    }
}

export function backgroundColor(
    h: Header,
    s: number = DEFAULT_SATURATION,
    v: number = DEFAULT_VALUE    
): string {
    const color = (text: string) => colorFromText(text, s, v);
    const getColor = (h: Header) => backgroundColor(h, s, v);
    switch (h.tag) {
        // fixed colors
        case "comment":  return "FFFFFF";
        case "error":    return "FFFFFF";
        // atomic commands get their colors from their command
        case "embed":    return color("embed");
        case "hide":     return color("hide");
        case "from":     return color("from");
        case "to":       return color("to");
        case "context":  return color("context");
        // tapes get their colors from the tape name
        case "tape":     return color(h.text);
        // unary headers get their colors from their child
        case "optional": return getColor(h.child);
        case "equals":   return getColor(h.child);
        case "starts":   return getColor(h.child);
        case "ends":     return getColor(h.child);
        case "contains": return getColor(h.child);
        case "rename":   return getColor(h.child);
        case "unique":   return getColor(h.child);
        // slashes get their colors from their first child only
        case "slash":    return getColor(h.child1);
    }
}

export function paramName(h: Header): string {
    switch (h.tag) {
        // most params just contribute normal content
        case "tape":
        case "comment":
        case "equals":
        case "starts":
        case "ends":
        case "contains":
        case "slash":  
        case "hide":  
        case "rename":  
        case "error":   
        case "embed":    return DEFAULT_PARAM;
        // optional depends on its child
        case "optional": return paramName(h.child);
        // from/to/context/unique contribute their tag
        case "from":
        case "to":   
        case "context":
        case "unique":   return h.tag;
        default: exhaustive(h);
    }
}
