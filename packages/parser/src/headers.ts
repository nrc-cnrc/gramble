import { 
    miniParse, MiniParseEnv, MPAlt, MPComment, 
    MPDelay, MPParser,
    MPSequence, MPUnreserved 
} from "./miniParser";

import { 
    HSVtoRGB, RGBtoString,
    REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE, CellPos
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
    
    public abstract get name(): string;
    public abstract getBackgroundColor(saturation: number, value: number): string;
    public abstract get id(): string;

    public getParamName(): string {
        return "__";
    }

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

/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and 
 * literals (e.g. "text").
 */
abstract class AtomicHeader extends Header { 

    public abstract get text(): string;

    public get name(): string {
        return this.text;
    }

    public get id(): string {
        return this.text;
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return RGBtoString(...HSVtoRGB(this.hue, saturation, value));
    }

    public get hue(): number {
        const str = this.text + "abcde" // otherwise short strings are boring colors
        let hash = 0; 

        for (let i = 0; i < str.length; i++) { 
            hash = ((hash << 5) - hash) + str.charCodeAt(i); 
            hash = hash & hash; 
        } 
        
        return (hash & 0xFF) / 255;
    }
}

export class EmbedHeader extends AtomicHeader {

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new EmbedHeader().msg();
    }

    public get text(): string {
        return "embed";
    }

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
export class HideHeader extends AtomicHeader {

    public get text(): string {
        return "hide";
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new HideHeader().msg();
    }
}

/**
 * TapeNameHeaders are references to a particular tape name (e.g. "text")
 */
export class TapeNameHeader extends AtomicHeader {

    constructor(
        public text: string
    ) {
        super();
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new TapeNameHeader(this.text).msg();
    }

}

/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 */
export class CommentHeader extends Header { 

    public get id(): string {
        return "%";
    }

    public get name(): string {
        return "%"
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new CommentHeader().msg();
    }

    public get hue(): number {
        return 0;
    }
    
    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return "#FFFFFF";
    }
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
    
    public get id(): string {
        return `${this.name}[${this.child.id}]`
    }

    public getParamName(): string {
        return this.child.getParamName();
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child.getBackgroundColor(saturation, value);
    }
}

export class FromHeader extends AtomicHeader {

    public get text(): string {
        return "from";
    }

    public getParamName(): string {
        return this.text;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }
}

export class ToHeader extends AtomicHeader {

    public get text(): string {
        return "to";
    }

    public getParamName(): string {
        return this.text;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }
}

export class RuleContextHeader extends AtomicHeader {

    public get text(): string {
        return "context";
    }

    public getParamName(): string {
        return this.text;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }
}

export class ParamNameHeader extends UnaryHeader {

    constructor(
        public tag: string,
        child: Header
    ) {
        super(child);
    }
    
    public get name(): string {
        return this.tag;
    }

    public getParamName(): string {
        return this.tag;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new ParamNameHeader(this.tag, c as Header));
    }
}

/**
 * Header that constructs optional parsers, e.g. "optional text"
 */
export class OptionalHeader extends UnaryHeader {

    public get name(): string {
        return "optional";
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new OptionalHeader(c as Header));
    }
}

/**
 * Header that constructs renames
 */
export class RenameHeader extends UnaryHeader {

    public get name(): string {
        return "rename";
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new RenameHeader(c as Header));
    }
}

/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a 
 * superset of X.
 */
export class EqualsHeader extends UnaryHeader {
    
    public get name(): string {
        return "equals";
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new EqualsHeader(c as Header));
    }
}

/**
 * StartsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * start with X (that is, Equals(N, X.*))
 */
export class StartsHeader extends UnaryHeader {

    public get name(): string {
        return "starts";
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new StartsHeader(c as Header));
    }
}

/**
 * EndsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * end with X (that is, Equals(N, .*X))
 */
export class EndsHeader extends UnaryHeader {

    public get name(): string {
        return "ends";
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new EndsHeader(c as Header));
    }
}

/**
 * ContainsHeader is a variant of [EqualsHeader] that only requires its predecessor (call it N) to 
 * contain X (that is, Equals(N, .*X.*))
 */
export class ContainsHeader extends UnaryHeader {
    
    public get name(): string {
        return "contains";
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new ContainsHeader(c as Header));
    }
}

export class SlashHeader extends Header {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super();
    }
    
    public get name(): string {
        return "slash";
    }

    public get id(): string {
        return `${this.name}[${this.child1.id},${this.child2.id}]`;
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child1.getBackgroundColor(saturation, value);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.child1, this.child2])
                .map(c => f.transform(c, env))
                .bind(([c1,c2]) => new SlashHeader(c1 as Header,c2 as Header));
    }
}

export class ErrorHeader extends TapeNameHeader {

    public get id(): string {
        return "ERR";
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
        HP_PRE, HP_POST,  
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

const HP_PRE = MPSequence<Header>(
    ["pre"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                    .bind(c => new ParamNameHeader("pre", c))
);

const HP_POST = MPSequence<Header>(
    ["post"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                 .bind(c => new ParamNameHeader("post", c))
);

const HP_RULE_CONTEXT = MPSequence<Header>(
    ["context"],
    () => new RuleContextHeader().msg()
);

const HP_UNIQUE = MPSequence<Header>(
    ["unique", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new ParamNameHeader("unique", c))
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
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a from header.`);
        }
        return new EqualsHeader(c).msg();
    })
);

const HP_STARTS = MPSequence<Header>(
    ["starts", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "starts" header.`);
        }
        return new StartsHeader(c).msg();
    })
);

const HP_ENDS = MPSequence<Header>(
    ["ends", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "ends" header.`);
        }
        return new EndsHeader(c).msg();
    })
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "contains" header.`);
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
        case ParamNameHeader:
            const paramName = (h as ParamNameHeader).name;
            switch (paramName) {
                case "unique": return "plaintext";
                case "pre": return "regex";
                case "post": return "regex";
                default:
                    throw new Error(`unhandled header: ${h.constructor.name}`);
            }
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
