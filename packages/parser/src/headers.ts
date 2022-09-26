import { 
    AlternationGrammar, 
    EpsilonGrammar, 
    LiteralGrammar, 
    NegationGrammar, 
    SequenceGrammar,
    RepeatGrammar,
    StartsGrammar,
    EndsGrammar,
    ContainsGrammar,
    EmbedGrammar,
    GrammarResult
} from "./grammars";

import { 
    AlternationRegex, 
    ErrorRegex, 
    NegationRegex, 
    PlusRegex, 
    QuestionRegex, 
    Regex, 
    SequenceRegex, 
    StarRegex, 
    LiteralRegex, 
    parseRegex 
} from "./regex";

import { 
    miniParse, MPAlternation, MPComment, 
    MPDelay, MPParser, MPReserved, 
    MPSequence, MPUnreserved 
} from "./miniParserMonadic";

import { 
    HSVtoRGB, RGBtoString,
    REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE 
} from "./util";
import { Msgs, Err, resultList, Result } from "./msgs";

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
 export abstract class Header {
    
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

    public abstract get isRegex(): boolean;

    public msg(msgs: Msgs = []): Result<Header> {
        return new Result(this, msgs);
    }
}

/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and 
 * literals (e.g. "text").
 */
abstract class AtomicHeader extends Header { 

    public abstract get text(): string;
    
    public get isRegex(): boolean {
        return false;
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

/**
 * EmbedHeaders lead to the complilation of EmbedStates.
 */
export class EmbedHeader extends AtomicHeader {

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

    public toGrammar(text: string): GrammarResult {
        return new LiteralGrammar(this.text, text).msg();
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
    
    public get isRegex(): boolean {
        return false;
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
    
    public get isRegex(): boolean {
        return this.child.isRegex;
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

    public get id(): string {
        return `${this.tag}:${this.child.id}`;
    }

    public getParamName(): string {
        return this.tag;
    }
}

/**
 * Header that constructs optional parsers, e.g. "optional text"
 */
export class OptionalHeader extends UnaryHeader {

    public get id(): string {
        return `OPT[${this.child.id}]`;
    }

    public toGrammar(
        text: string
    ): GrammarResult {
        return this.child.toGrammar(text)
                .bind(c => new AlternationGrammar(
                    [c, new EpsilonGrammar()]));
    }
}

/**
 * Header that constructs renames
 */
export class RenameHeader extends UnaryHeader {

    public get id(): string {
        return `RENAME[${this.child.id}]`;
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
export class RegexHeader extends UnaryHeader {

    public get id(): string {
        return `RE[${this.child.id}]`;
    }

    public getFontColor() {
        return "#bd1128";
    }

    public get isRegex(): boolean {
        return true;
    }

    public toGrammarPiece(
        parsedText: Regex
    ): GrammarResult {

        if (parsedText instanceof ErrorRegex) {
            return new EpsilonGrammar().msg()
                .err("Cannot parse regex",
                "Cannot parse the regex in this cell");
        }

        if (parsedText instanceof SequenceRegex) {
            return resultList(parsedText.children)
                        .map(c => this.toGrammarPiece(c))
                        .bind(cs => new SequenceGrammar(cs));
        }

        if (parsedText instanceof StarRegex) {
            return this.toGrammarPiece(parsedText.child)
                       .bind(c => new RepeatGrammar(c));
        }
        
        if (parsedText instanceof QuestionRegex) {
            return this.toGrammarPiece(parsedText.child)
                       .bind(c => new RepeatGrammar(c, 0, 1));
        }
        
        if (parsedText instanceof PlusRegex) {
            return this.toGrammarPiece(parsedText.child)
                       .bind(c => new RepeatGrammar(c, 1));
        }

        if (parsedText instanceof LiteralRegex) {
            return this.child.toGrammar(parsedText.text);
        }

        if (parsedText instanceof NegationRegex) {
            return this.toGrammarPiece(parsedText.child)
                       .bind(c => new NegationGrammar(c));
        }

        if (parsedText instanceof AlternationRegex) {
            return resultList([parsedText.child1, parsedText.child2])
                    .map(c => this.toGrammarPiece(c))
                    .bind(cs => new AlternationGrammar(cs));
        }

        throw new Error(`Error constructing boolean expression: ${parsedText}`);
    }

    public toGrammar(text: string): GrammarResult {
        const parsedText = parseRegex(text);
        return this.toGrammarPiece(parsedText);
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
export class EqualsHeader extends UnaryHeader {
    
    public get id(): string {
        return `EQUALS[${this.child.id}]`;
    }
}

/**
 * StartsHeader is a special kind of [EqualsHeader] that only requires its predecessor (call it N) to 
 * start with X (that is, Equals(N, X.*))
 */
export class StartsHeader extends EqualsHeader {

    public get id(): string {
        return `STARTS[${this.child.id}]`;
    }

    public toGrammar(text: string): GrammarResult {
        return this.child.toGrammar(text)
                   .bind(c => new StartsGrammar(c));
    }
}

/**
 * EndsHeader is a special kind of [EqualsHeader] that only requires its predecessor (call it N) to 
 * end with X (that is, Equals(N, .*X))
 */
export class EndsHeader extends EqualsHeader {

    public get id(): string {
        return `ENDS[${this.child.id}]`;
    }

    public toGrammar(text: string): GrammarResult {
        return this.child.toGrammar(text)
                   .bind(c => new EndsGrammar(c));
    }
}

/**
 * ContainsHeader is a special kind of [EqualsHeader] that only requires its predecessor (call it N) to 
 * contain X (that is, Equals(N, .*X.*))
 */
export class ContainsHeader extends EqualsHeader {
    
    public get id(): string {
        return `CONTAINS[${this.child.id}]`;
    }

    public toGrammar(text: string): GrammarResult {
        return this.child.toGrammar(text)
                   .bind(c => new ContainsGrammar(c));
    }
}

abstract class BinaryHeader extends Header {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super();
    }
    
    public get isRegex(): boolean {
        return this.child1.isRegex || this.child2.isRegex;
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child1.getBackgroundColor(saturation, value);
    }
}

export class SlashHeader extends BinaryHeader {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super(child1, child2);
    }
    
    public get id(): string {
        return `SLASH[${this.child1.id},${this.child2.id}]`;
    }

    public getFontColor() {
        return this.child1.getFontColor();
    }
    
    public toGrammar(text: string): GrammarResult {
        return resultList([this.child1, this.child2])
                 .map(c => c.toGrammar(text))
                 .bind(cs => new SequenceGrammar(cs));
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

const SYMBOL = [ "(", ")", "%", "/",  ">", ":" ];

export const REPLACE_PARAMS = [
    "from",
    "to",
    "pre",
    "post"
]

export const TEST_PARAMS = [
    "unique"
]

export const RESERVED_HEADERS = [
    "embed", 
    "optional", 
    //"not", 
    "hide", 
    //"reveal", 
    "equals", 
    "starts", 
    "ends", 
    "contains",
    "re",
    ...REPLACE_PARAMS,
    ...TEST_PARAMS
];

export const RESERVED_OPS: Set<string> = new Set([
    "table", 
    "test", 
    "testnot", 
    "or", 
    "concat", 
    "join", 
    "replace",
    "namespace"
]);

export const RESERVED_WORDS = new Set([...SYMBOL, ...RESERVED_HEADERS, ...RESERVED_OPS]);

const tokenizer = new RegExp("\\s+|(" + 
                            SYMBOL.map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

const HP_NON_COMMENT_EXPR: MPParser<Header> = MPDelay(() =>
    MPAlternation(
        HP_OPTIONAL, HP_FROM, HP_SLASH,
        HP_TO, HP_PRE, HP_POST,
        HP_FROM_ATOMIC, HP_TO_ATOMIC, 
        HP_PRE_ATOMIC, HP_POST_ATOMIC,  
        HP_FROM_RE_ATOMIC, HP_TO_RE_ATOMIC, 
        HP_PRE_RE_ATOMIC, HP_POST_RE_ATOMIC,
        HP_UNIQUE, HP_REGEX,
        HP_RENAME, HP_EQUALS, HP_STARTS, 
        HP_ENDS, HP_CONTAINS, HP_SUBEXPR)
);

const HP_SUBEXPR: MPParser<Header> = MPDelay(() =>
    MPAlternation(
        HP_UNRESERVED, HP_EMBED, HP_HIDE, 
        HP_PARENS, HP_RESERVED_OP)
);

const HP_COMMENT = MPComment<Header>(
    '%',
    (s) => new CommentHeader().msg()
);

const HP_UNRESERVED = MPUnreserved<Header>(
    RESERVED_WORDS, 
    (s) => new TapeNameHeader(s).msg()
);

const HP_RESERVED_OP = MPReserved<Header>(
    RESERVED_OPS, 
    (s) => new ErrorHeader(s).msg().err(
            `Reserved word in header`, 
            `This looks like a header, but contains the reserved word "${s}". ` + 
            "If you didn't mean this to be a header, put a colon after it.")
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
    (child) => child.bind(c => new TagHeader("from", c))
);

const HP_TO = MPSequence<Header>(
    ["to", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new TagHeader("to", c))
);

const HP_PRE = MPSequence<Header>(
    ["pre", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new TagHeader("pre", c))
);

const HP_POST = MPSequence<Header>(
    ["post", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new TagHeader("post", c))
);

const HP_FROM_ATOMIC = MPSequence<Header>(
    ["from"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                .bind(c => new TagHeader("from", c))
);

const HP_TO_ATOMIC = MPSequence<Header>(
    ["to"],
    () => new TapeNameHeader(REPLACE_OUTPUT_TAPE).msg()
                    .bind(c => new TagHeader("to", c))
);

const HP_PRE_ATOMIC = MPSequence<Header>(
    ["pre"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                    .bind(c => new TagHeader("pre", c))
);

const HP_POST_ATOMIC = MPSequence<Header>(
    ["post"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                 .bind(c => new TagHeader("post", c))
);

const HP_FROM_RE_ATOMIC = MPSequence<Header>(
    ["from", "re"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                .bind(c => new RegexHeader(c))
                .bind(c => new TagHeader("from", c))
);

const HP_TO_RE_ATOMIC = MPSequence<Header>(
    ["to", "re"],
    () => new TapeNameHeader(REPLACE_OUTPUT_TAPE).msg()
                .bind(c => new RegexHeader(c))
                .bind(c => new TagHeader("to", c))
);

const HP_PRE_RE_ATOMIC = MPSequence<Header>(
    ["pre", "re"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                .bind(c => new RegexHeader(c))
                .bind(c => new TagHeader("pre", c))
);

const HP_POST_RE_ATOMIC = MPSequence<Header>(
    ["post", "re"],
    () => new TapeNameHeader(REPLACE_INPUT_TAPE).msg()
                .bind(c => new RegexHeader(c))
                .bind(c => new TagHeader("post", c))
);

const HP_UNIQUE = MPSequence<Header>(
    ["unique", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new TagHeader("unique", c))
);

const HP_REGEX = MPSequence<Header>(
    ["re", HP_NON_COMMENT_EXPR],
    (child) => {
        const [c,msgs] = child.destructure();
        if (c instanceof SlashHeader) {
            return new ErrorHeader("").msg()
                .err("Invalid header",
                    "You can't have both 're' and a slash in the same header");
        }
        return c.msg(msgs).bind(c => new RegexHeader(c));
    }
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
    (child) => child.bind(c => new EqualsHeader(c))
);

const HP_STARTS = MPSequence<Header>(
    ["starts", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new StartsHeader(c))
);

const HP_ENDS = MPSequence<Header>(
    ["ends", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new EndsHeader(c))
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    (child) => child.bind(c => new ContainsHeader(c))
);

const HP_EXPR: MPParser<Header> = MPAlternation(HP_COMMENT, HP_NON_COMMENT_EXPR);

export function parseHeaderCell(text: string): Result<Header> {

    const results = miniParse(tokenize, HP_EXPR, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorHeader(text).msg().err(
            "Invalid header",
            "Cannot parse this header"
        );
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}