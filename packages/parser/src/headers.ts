import { 
    miniParse, MiniParseEnv, MPAlt, MPComment, 
    MPDelay, MPParser,
    MPSequence, MPUnreserved 
} from "./miniParser";

import { 
    HSVtoRGB, RGBtoString, CellPos
} from "./util";

import {
     Msgs, resultList, Result, 
     Err, Warn, Msg, result, ResultVoid 
} from "./msgs";

import { ALL_RESERVED, isValidSymbolName, RESERVED_SYMBOLS } from "./reserved";
import { Component, CPass, CResult } from "./components";
import { PassEnv } from "./passes";

export const DEFAULT_SATURATION = 0.05;
export const DEFAULT_VALUE = 1.0;

export type ParseClass = "plaintext" | "regex" | "symbol" | "ruleContext" | "none" | "comment";

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
 export abstract class Header extends Component {

    public msg(m: Msg | Msgs | ResultVoid = []): Result<Header> {
        return result(this).msg(m);
    }

    public err(shortMsg: string, longMsg: string, pos?: CellPos): Result<Header> {
        const e = Err(shortMsg, longMsg);
        return this.msg(e).localize(pos).localize(this.pos);
    }
    
    public warn(longMsg: string, pos?: CellPos): Result<Header> {
        const e = Warn(longMsg);
        return this.msg(e).localize(pos).localize(this.pos);
    }
}

export class EmbedHeader extends Header {

}

/**
 * HideHeader is an atomic header "hide:T" that takes the grammar
 * to the left and mangles the name of tape T outside of that grammar,
 * so that the field cannot be referenced outside of it.  This allows
 * programmers to use additional fields without necessarily overwhelming
 * the "public" interface to the grammar with fields that are only 
 * internally-relevant, and avoid unexpected behavior when joining two classes
 * that define same-named fields internally for different purposes.  
 */
export class HideHeader extends Header {

}

/**
 * TapeNameHeaders are references to a particular tape name (e.g. "text")
 */
export class TapeNameHeader extends Header {

    constructor(
        public tapeName: string
    ) {
        super();
    }

}

/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 */
export class CommentHeader extends Header { 
    
}

/**
 * The ancestor class of unary header operators like "optional", 
 * "not", and ">" (the rename operator)
 */
export abstract class UnaryHeader extends Header {

    public constructor(
        public child: Header
    ) { 
        super();
    }
}

export class FromHeader extends Header {

}

export class ToHeader extends Header {

}

export class RuleContextHeader extends Header {

}

export class UniqueHeader extends UnaryHeader {

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

}

/**
 * Header that constructs renames
 */
export class RenameHeader extends UnaryHeader {

}

/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a 
 * superset of X.
 */
export class EqualsHeader extends UnaryHeader {
    
}

/**
 * StartsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * start with X (that is, Equals(N, X.*))
 */
export class StartsHeader extends UnaryHeader {

}

/**
 * EndsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * end with X (that is, Equals(N, .*X))
 */
export class EndsHeader extends UnaryHeader {
    
}

/**
 * ContainsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * contain X (that is, Equals(N, .*X.*))
 */
export class ContainsHeader extends UnaryHeader {
    
}

export class SlashHeader extends Header {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super();
    }

}

export class ErrorHeader extends Header {

    public constructor(
        public text: string
    ) {
        super();
    }
    
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
        HP_FROM, HP_TO, 
        HP_RULE_CONTEXT,
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
    (s) => new CommentHeader().msg()
);

const HP_UNRESERVED = MPUnreserved<Header>(
    (s) => {
        if (isValidSymbolName(s)) {
            return new TapeNameHeader(s).msg()
        } else {
            return new ErrorHeader(s).msg().err(
                `Invalid tape name`, 
                `${s} looks like it should be a tape name, but tape names should start with letters or _`);
        }
    } 
);

const HP_EMBED = MPSequence<Header>(
    ["embed"],
    () => new EmbedHeader().msg()
);

const HP_HIDE = MPSequence<Header>(
    ["hide"],
    () => new HideHeader().msg()
);

const HP_OPTIONAL = MPSequence<Header>(
    ["optional", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new OptionalHeader(c))
);

const HP_FROM = MPSequence<Header>(
    ["from"],
    () => new FromHeader().msg()
);

const HP_TO = MPSequence<Header>(
    ["to"],
    () => new ToHeader().msg()
);

const HP_RULE_CONTEXT = MPSequence<Header>(
    ["context"],
    () => new RuleContextHeader().msg()
);

const HP_UNIQUE = MPSequence<Header>(
    ["unique", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new UniqueHeader(c))
);

const HP_SLASH = MPSequence<Header>(
    [HP_SUBEXPR, "/", HP_NON_COMMENT_EXPR],
    (child1,child2) => {
        const [c1,m1] = child1.destructure();
        const [c2,m2] = child2.destructure();
        return new SlashHeader(c1,c2).msg(m1).msg(m2)
    }
);

const HP_RENAME = MPSequence<Header>(
    [">", HP_UNRESERVED],
    (child) => child.bind(c => new RenameHeader(c))
);

const HP_PARENS = MPSequence<Header>(
    ["(", HP_NON_COMMENT_EXPR, ")"],
    (child) => child 
);

const HP_EQUALS = MPSequence<Header>(
    ["equals", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Equals requires tape name`, 
                    `Equals can only apply to tape names (e.g. "equals text")`);
        }
        return new EqualsHeader(c).msg();
    })
);

const HP_STARTS = MPSequence<Header>(
    ["starts", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Equals requires tape name`, 
                    `Equals can only apply to tape names (e.g. "equals text")`);
        }
        return new StartsHeader(c).msg();
    })
);

const HP_ENDS = MPSequence<Header>(
    ["ends", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                 .err(`Equals requires tape name`, 
                    `Equals can only apply to tape names (e.g. "equals text")`);
        }
        return new EndsHeader(c).msg();
    })
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
              .err(`Equals requires tape name`, 
                    `Equals can only apply to tape names (e.g. "equals text")`);
        }
        return new ContainsHeader(c).msg();
    })
);

const HP_EXPR: MPParser<Header> = MPAlt(HP_COMMENT, HP_NON_COMMENT_EXPR);

export function parseHeaderCell(text: string): Result<Header> {

    const env = new MiniParseEnv(RESERVED_SYMBOLS, ALL_RESERVED);
    const results = miniParse(env, HP_EXPR, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorHeader(text).msg().err(
            "Invalid header",
            "Cannot parse this header"
        );
    }
    if (results.length > 1) {
        console.log(results);
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}

export function getParseClass(h: Header): ParseClass {
    switch (h.constructor) {
        case EmbedHeader: return "symbol";
        case TapeNameHeader: return "plaintext";
        case CommentHeader: return "none";
        case OptionalHeader: return getParseClass((h as OptionalHeader).child);
        case EqualsHeader: return "regex";
        case StartsHeader: return "regex";
        case EndsHeader: return "regex";
        case ContainsHeader: return "regex";
        case SlashHeader: return "plaintext";
        case HideHeader: return "none";
        case RenameHeader: return "none";
        case ErrorHeader: return "none";
        case FromHeader: return "regex";
        case ToHeader: return "plaintext";
        case RuleContextHeader: return "ruleContext";
        case UniqueHeader: return "plaintext";
        default:
            throw new Error(`unhandled header: ${h.constructor.name}`);
    }
}

export function getFontColor(h: Header): string {
    const parseClass = getParseClass(h);
    switch (parseClass) {
        case "comment": return "#669944";
        case "none": return "#000000";
        case "plaintext": return "#064a3f";
        case "regex": return "#bd1128";
        case "ruleContext": return "#bd1128";
        case "symbol": return "#333333"; 
    }
}

function hueFromText(text: string): number {
    const str = text + "abcde" // otherwise short strings are boring colors
    let hash = 0; 

    for (let i = 0; i < str.length; i++) { 
        hash = ((hash << 5) - hash) + str.charCodeAt(i); 
        hash = hash & hash; 
    } 
    
    return (hash & 0xFF) / 255;
}

function colorFromText(
    text: string, 
    saturation: number = DEFAULT_SATURATION, 
    value: number = DEFAULT_VALUE
): string { 
    return RGBtoString(...HSVtoRGB(hueFromText(text), saturation, value));
}

export function getBackgroundColor(
    h: Header,
    s: number = DEFAULT_SATURATION,
    v: number = DEFAULT_VALUE    
): string {
    switch (h.constructor) {
        // fixed colors
        case CommentHeader: return "FFFFFF";
        case ErrorHeader: return "FFFFFF";
        // atomic commands get their colors from their command
        case EmbedHeader: return colorFromText("embed", s, v);
        case HideHeader: return colorFromText("hide", s, v);
        case FromHeader: return colorFromText("from", s, v);
        case ToHeader: return colorFromText("to", s, v);
        case RuleContextHeader: return colorFromText("context", s, v);
        // tapes get their colors from the tape name
        case TapeNameHeader: return colorFromText((h as TapeNameHeader).tapeName, s, v);
        // unary headers get their colors from their child
        case OptionalHeader: return getBackgroundColor((h as OptionalHeader).child, s, v);
        case EqualsHeader: return getBackgroundColor((h as EqualsHeader).child, s, v);
        case StartsHeader: return getBackgroundColor((h as StartsHeader).child, s, v);
        case EndsHeader: return getBackgroundColor((h as EndsHeader).child, s, v);
        case ContainsHeader: return getBackgroundColor((h as ContainsHeader).child, s, v);
        case RenameHeader: return getBackgroundColor((h as RenameHeader).child, s, v);
        // slashes get their colors from their first child only
        case SlashHeader: return getBackgroundColor((h as SlashHeader).child1, s, v);
        // param names it depends on the param
        case UniqueHeader: return getBackgroundColor((h as UniqueHeader).child, s, v);
        default:
            throw new Error(`unhandled header: ${h.constructor.name}`);
    }
}

export function getHeaderID(h: Header): string {
    switch (h.constructor) {
        case EmbedHeader: return "embed";
        case TapeNameHeader: return (h as TapeNameHeader).tapeName;
        case CommentHeader: return "%";
        case OptionalHeader: 
            return "optional[" + getHeaderID((h as OptionalHeader).child) + "]";
        case EqualsHeader: 
            return "equals[" + getHeaderID((h as EqualsHeader).child) + "]";
        case StartsHeader: 
            return "starts[" + getHeaderID((h as StartsHeader).child) + "]";
        case EndsHeader: 
            return "ends[" + getHeaderID((h as StartsHeader).child) + "]";
        case ContainsHeader: 
            return "contains[" + getHeaderID((h as ContainsHeader).child) + "]";
        case SlashHeader:
            const s = h as SlashHeader;
            return `slash[${getHeaderID(s.child1)},${getHeaderID(s.child2)}]`;
        case HideHeader: return "hide";
        case RenameHeader: 
            return "contains[" + getHeaderID((h as RenameHeader).child) + "]";
        case ErrorHeader: return "ERR";
        case FromHeader: return "from";
        case ToHeader: return "to";
        case RuleContextHeader: return "context";
        case UniqueHeader: return "unique";
        default:
            throw new Error(`unhandled header: ${h.constructor.name}`);
    }
}

export function getParamName(h: Header): string {
    switch (h.constructor) {
        case EmbedHeader: return "__";
        case TapeNameHeader: return "__";
        case CommentHeader: return "__";
        case OptionalHeader: return getParamName((h as OptionalHeader).child);
        case EqualsHeader: return "__";
        case StartsHeader: return "__";
        case EndsHeader: return "__";
        case ContainsHeader: return "__";
        case SlashHeader: return "__";
        case HideHeader: return "__";
        case RenameHeader: return "__";
        case ErrorHeader: return "__";
        case FromHeader: return "from";
        case ToHeader: return "to";
        case RuleContextHeader: return "context";
        case UniqueHeader: return "unique";
        default:
            throw new Error(`unhandled header: ${h.constructor.name}`);
    }
}