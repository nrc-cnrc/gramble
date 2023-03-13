import { 
    AlternationGrammar, 
    EpsilonGrammar, 
    SequenceGrammar,
    StartsGrammar,
    EndsGrammar,
    ContainsGrammar,
    EmbedGrammar,
    GrammarResult,
    RenameGrammar
} from "./grammars";

import { 
    parseRegex,
    parsePlaintext
} from "./regex";

import { 
    miniParse, MiniParseEnv, MPAlt, MPComment, 
    MPDelay, MPParser,
    MPSequence, MPUnreserved 
} from "./miniParser";

import { 
    HSVtoRGB, RGBtoString,
    REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE, 
    isValidSymbolName, DUMMY_REGEX_TAPE 
} from "./util";

import {
     Msgs, resultList, Result, 
     Err, Warn, Msg, result 
} from "./msgs";

import { RESERVED, RESERVED_SYMBOLS } from "./reserved";
import { Component, CPass, CResult } from "./components";
import { Pass, PassEnv } from "./passes";
import { REGEX_PASSES } from "./passes/allPasses";

export const DEFAULT_SATURATION = 0.05;
export const DEFAULT_VALUE = 1.0;

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

    /**
     * One of the primary responsibilities of the header tree is to construct the appropriate grammar object
     * for a cell, from the grammar to its left and a string.  This string is usually the text of the 
     * cell in question, but (in the case of cells that we parse like "~(A|B)" it could be a substring
     * of this.  (That's why we need a separate text param and don't just grab it from content.text.)
     * 
     * @param text A string expressing the content to be compiled, in light of this header
     * @returns The grammar corresponding to this header/content pair
     */
    public toGrammar(text: string): GrammarResult {
        throw new Error("not implemented");
    }

    public abstract getFontColor(): string;
    public abstract getBackgroundColor(saturation: number, value: number): string;
    public abstract get id(): string;

    public getParamName(): string {
        return "__";
    }

    public msg(m: Msg | Msgs = []): Result<Header> {
        return result(this).msg(m);
    }

    public err(shortMsg: string, longMsg: string): Result<Header> {
        const e = Err(shortMsg, longMsg);
        return this.msg(e);
    }
    
    public warn(longMsg: string): Result<Header> {
        const e = Warn(longMsg);
        return this.msg(e);
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

    public getFontColor(): string {
        return "#000000";
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

    public toGrammar(text: string): GrammarResult {
        return new EmbedGrammar(text).msg();
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

    public getFontColor() {
        return "#064a3f";
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new TapeNameHeader(this.text).msg();
    }

    public toGrammar(text: string): GrammarResult {
        const tapeName = this.text;
        const env = new PassEnv();
        return parsePlaintext(text)
                    .bind(r => REGEX_PASSES.transform(r, env))
                    .bind(g => new RenameGrammar(g, 
                                DUMMY_REGEX_TAPE, tapeName))
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

    public getFontColor() {
        return "#669944";
    }

    public get hue(): number {
        return 0;
    }
    
    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return "#FFFFFF";
    }

    public toGrammar(text: string): GrammarResult {
        return new EpsilonGrammar().msg();
    }    
}

/**
 * The ancestor class of unary header operators like "optional", 
 * "not", and ">" (the rename operator)
 */
abstract class UnaryHeader extends Header {

    public constructor(
        public child: Header
    ) { 
        super();
    }
    
    public get id(): string {
        return `${this.name}[${this.child.id}]`
    }

    public getFontColor() {
        return this.child.getFontColor();
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child.getBackgroundColor(saturation, value);
    }

    public toGrammar(text: string): GrammarResult {
        return this.child.toGrammar(text);
    }
}

export class TagHeader extends UnaryHeader {

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
                .bind(c => new TagHeader(this.tag, c as Header));
    }
}

/**
 * Header that constructs optional parsers, e.g. "optional text"
 */
export class OptionalHeader extends UnaryHeader {

    public get name(): string {
        return "optional";
    }

    public toGrammar(
        text: string
    ): GrammarResult {
        return this.child.toGrammar(text)
                .bind(c => new AlternationGrammar(
                    [c, new EpsilonGrammar()]));
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
 * The command "re X:Y" allows the use of regex operators and negation
 *  in the cells beneath.
 * 
 * e.g. "~(A|B)" is interpreted as "neither A nor B" rather than this literal string.
 * 
 * This is also the ancestor class of all other headers (e.g. "equals", 
 * starts", etc.) that allow and parse regular expressions 
 * in their fields.
 */
abstract class RegexHeader extends UnaryHeader {

    public getFontColor() {
        return "#bd1128";
    }

    public toGrammar(text: string): GrammarResult {
        if (!(this.child instanceof TapeNameHeader)) {
            // shouldn't happen, should already be taken care of, more for linting
            return new EpsilonGrammar().err("Invalid header",
                `A header "${this.name} X" can only have a plain tape name as its X, like "${this.name} text".`);
        }
        const tapeName = this.child.text;
        const env = new PassEnv();
        return parseRegex(text)
                    .bind(r => REGEX_PASSES.transform(r, env))
                    .bind(g => new RenameGrammar(g, 
                            DUMMY_REGEX_TAPE, tapeName))
    }
}

export class RegexTagHeader extends RegexHeader {

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
                .bind(c => new RegexTagHeader(this.tag, c as Header));
    }
}

/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a 
 * superset of X.
 * 
 * This is also the superclass of [StartsHeader], [EndsHeader], and [ContainsHeader].  
 * These constrain N to either start with X (that is, Filter(N, X.*)) or end with X 
 * (that is, Filter(N, .*X)), or contain X (Filter(N, .*X.*)).
 */
export class EqualsHeader extends RegexHeader {
    
    public get name(): string {
        return "equals";
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new EqualsHeader(c as Header));
    }
}

/**
 * StartsHeader is a special kind of [EqualsHeader] that only requires its predecessor (call it N) to 
 * start with X (that is, Equals(N, X.*))
 */
export class StartsHeader extends RegexHeader {

    public get name(): string {
        return "starts";
    }

    public toGrammar(text: string): GrammarResult {
        return super.toGrammar(text)
                    .bind(c => new StartsGrammar(c));
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new StartsHeader(c as Header));
    }
}

/**
 * EndsHeader is a special kind of [EqualsHeader] that only requires its predecessor (call it N) to 
 * end with X (that is, Equals(N, .*X))
 */
export class EndsHeader extends RegexHeader {

    public get name(): string {
        return "ends";
    }

    public toGrammar(text: string): GrammarResult {
        return super.toGrammar(text)
                    .bind(c => new EndsGrammar(c));
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new EndsHeader(c as Header));
    }
}

/**
 * ContainsHeader is a special kind of [EqualsHeader] that only requires its predecessor (call it N) to 
 * contain X (that is, Equals(N, .*X.*))
 */
export class ContainsHeader extends RegexHeader {
    
    public get name(): string {
        return "contains";
    }

    public toGrammar(text: string): GrammarResult {
        return super.toGrammar(text)
                    .bind(c => new ContainsGrammar(c));
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

    public getFontColor() {
        return this.child1.getFontColor();
    }
    
    public toGrammar(text: string): GrammarResult {
        return resultList([this.child1, this.child2])
                 .map(c => c.toGrammar(text))
                 .bind(cs => new SequenceGrammar(cs));
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

    public toGrammar(text: string): GrammarResult {
        if (text.length != 0) {
            return new EpsilonGrammar().msg()
                .warn("This content is associated with an invalid header above, ignoring");
        }
        return new EpsilonGrammar().msg();
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
        HP_OPTIONAL, HP_FROM, HP_SLASH,
        HP_TO, HP_PRE, HP_POST,
        HP_FROM_ATOMIC, HP_TO_ATOMIC, 
        HP_PRE_ATOMIC, HP_POST_ATOMIC,  
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
    ["from", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "from" header.`);
        }
        return new RegexTagHeader("from", c).msg();
    })
);

const HP_TO = MPSequence<Header>(
    ["to", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "to" header.`);
        }
        return new RegexTagHeader("to", c).msg();
    })
);

const HP_PRE = MPSequence<Header>(
    ["pre", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "pre" header.`);
        }
        return new RegexTagHeader("pre", c).msg();
    })
);

const HP_POST = MPSequence<Header>(
    ["post", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => {
        if (!(c instanceof TapeNameHeader)) {
            return new ErrorHeader("Invalid header")
                .err(`Invalid ${c.name} in header`, 
                    `You can't have a ${c.name} inside a "post" header.`);
        }
        return new RegexTagHeader("post", c).msg();
    })
);

const HP_FROM_ATOMIC = MPSequence<Header>(
    ["from"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                .bind(c => new RegexTagHeader("from", c))
);

const HP_TO_ATOMIC = MPSequence<Header>(
    ["to"],
    () => new TapeNameHeader(REPLACE_OUTPUT_TAPE).msg()
                    .bind(c => new RegexTagHeader("to", c))
);

const HP_PRE_ATOMIC = MPSequence<Header>(
    ["pre"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                    .bind(c => new RegexTagHeader("pre", c))
);

const HP_POST_ATOMIC = MPSequence<Header>(
    ["post"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                 .bind(c => new RegexTagHeader("post", c))
);

const HP_UNIQUE = MPSequence<Header>(
    ["unique", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new TagHeader("unique", c))
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

    const env = new MiniParseEnv(new Set(RESERVED_SYMBOLS), RESERVED);
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