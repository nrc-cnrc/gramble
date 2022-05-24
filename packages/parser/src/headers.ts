import { 
    AlternationGrammar, 
    UnresolvedEmbedGrammar, 
    EpsilonGrammar, 
    EqualsGrammar, 
    HideGrammar, 
    LiteralGrammar, 
    NegationGrammar, 
    RenameGrammar, 
    SequenceGrammar, 
    Grammar, 
    RepeatGrammar,
    StartsGrammar,
    EndsGrammar,
    ContainsGrammar
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
} from "./miniParser";

import { Cell, HSVtoRGB, RGBtoString } from "./util";

export const DEFAULT_SATURATION = 0.05;
export const DEFAULT_VALUE = 1.0;


export type ParamDict = {[key: string]: Grammar};

/**
 * A Header is a cell in the top row of a table, consisting of one of
 * 
 * * the name of a tape, like "text" or "gloss"
 * * an atomic operator like "embed" or "hide"
 * * a unary operator like "maybe" followed by a valid Header (e.g. "maybe text") 
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
     * @param left The already-constructed grammar corresponding to the cell to the left of the content cell
     * @param text A string expressing the content to be compiled, in light of this header
     * @param content The cell that ultimately provided the text string
     * @returns The grammar corresponding to this header/content pair
     */
    public abstract toGrammar(left: Grammar, text: string, content: Cell): Grammar;
    public abstract getFontColor(): string;
    public abstract getBackgroundColor(saturation: number, value: number): string;
    public abstract get id(): string;

    public getParamName(): string {
        return "__";
    }

    public toParams(left: ParamDict, text: string, content: Cell): ParamDict {
        const paramName = this.getParamName();
        const result: ParamDict = {};
        Object.assign(result, left);
        if (paramName in left) {
            result[paramName] = this.toGrammar(left[paramName], text, content);
        } else {
            const eps = new EpsilonGrammar(content);
            result[paramName] = this.toGrammar(eps, text, content);
        }
        return result;
    }
}

/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and 
 * literals (e.g. "text").
 */
abstract class AtomicHeader extends Header { 

    public abstract get text(): string;
    
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
        var hash = 0; 

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

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const cellGrammar = new UnresolvedEmbedGrammar(content, text);
        return new SequenceGrammar(content, [left, cellGrammar]);
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
    
    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        var result = left;
        for (const tape of text.split("/")) {
            result = new HideGrammar(content, result, tape.trim());
        }
        return result;
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

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const grammar = new LiteralGrammar(content, this.text, text);
        return new SequenceGrammar(content, [left, grammar]);
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
    
    public getFontColor() {
        return "#669944";
    }

    public get hue(): number {
        return 0;
    }
    
    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return "#FFFFFF";
    }

    public toGrammar(
        left: Grammar, 
        text: string
    ): Grammar {
        return left;
    }    
}

/**
 * The ancestor class of unary header operators like "maybe", "not", "@"
 * (the joining operator that we use to implement flags), and ">" (the rename
 * operator)
 */
abstract class UnaryHeader extends Header {

    public constructor(
        public child: Header
    ) { 
        super();
    }

    public getFontColor() {
        return this.child.getFontColor();
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child.getBackgroundColor(saturation, value);
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        return this.child.toGrammar(left, text, content);
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

export class AtomicPreHeader extends AtomicHeader {

    public get text(): string {
        return "pre";
    }

    public get id(): string {
        return "pre";
    }
    
    public getParamName(): string {
        return "pre";
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const grammar = new LiteralGrammar(content, "input", text);
        return new SequenceGrammar(content, [left, grammar]);
    }

}

export class AtomicFromHeader extends AtomicHeader {

    public get text(): string {
        return "from";
    }

    public get id(): string {
        return "from";
    }
    
    public getParamName(): string {
        return "from";
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const grammar = new LiteralGrammar(content, "input", text);
        return new SequenceGrammar(content, [left, grammar]);
    }
}

export class AtomicToHeader extends AtomicHeader {

    public get text(): string {
        return "to";
    }

    public get id(): string {
        return "to";
    }
    
    public getParamName(): string {
        return "to";
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const grammar = new LiteralGrammar(content, "output", text);
        return new SequenceGrammar(content, [left, grammar]);
    }
}

export class AtomicPostHeader extends AtomicHeader {

    public get text(): string {
        return "post";
    }

    public get id(): string {
        return "post";
    }
    
    public getParamName(): string {
        return "post";
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const grammar = new LiteralGrammar(content, "input", text);
        return new SequenceGrammar(content, [left, grammar]);
    }
}

/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
export class MaybeHeader extends UnaryHeader {

    public get id(): string {
        return `MAYBE[${this.child.id}]`;
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const childGrammar = this.child.toGrammar(new EpsilonGrammar(content), text, content);
        const grammar = new AlternationGrammar(content, [childGrammar, new EpsilonGrammar(content)]);
        return new SequenceGrammar(content, [left, grammar]);
    }
}

/**
 * Header that constructs renames
 */
class RenameHeader extends UnaryHeader {

    public get id(): string {
        return `RENAME[${this.child.id}]`;
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        if (!(this.child instanceof TapeNameHeader)) {
            content.message({
                type: "error",
                shortMsg: "Renaming error",
                longMsg: "Rename (>) needs to have a tape name after it"
            })
            return new EpsilonGrammar(content);
        }
        return new RenameGrammar(content, left, text, this.child.text);
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

    public toGrammarPiece(
        parsedText: Regex,
        content: Cell
    ): Grammar {

        if (parsedText instanceof ErrorRegex) {
            content.message({
                type: "error",
                shortMsg: "Cannot parse regex",
                longMsg: "Cannot parse the regex in this cell"
            })
            return new EpsilonGrammar(content);
        }

        if (parsedText instanceof SequenceRegex) {
            if (parsedText.children.length == 0) {
                return this.child.toGrammar(new EpsilonGrammar(content), "", content);
            }

            const childGrammars = parsedText.children.map(c => 
                                    this.toGrammarPiece(c, content));
            return new SequenceGrammar(content, childGrammars);
        }

        if (parsedText instanceof StarRegex) {
            const childGrammar = this.toGrammarPiece(parsedText.child, content);
            return new RepeatGrammar(content, childGrammar);
        }
        
        if (parsedText instanceof QuestionRegex) {
            const childGrammar = this.toGrammarPiece(parsedText.child, content);
            return new RepeatGrammar(content, childGrammar, 0, 1);
        }
        
        if (parsedText instanceof PlusRegex) {
            const childGrammar = this.toGrammarPiece(parsedText.child, content);
            return new RepeatGrammar(content, childGrammar, 1);
        }

        if (parsedText instanceof LiteralRegex) {
            return this.child.toGrammar(new EpsilonGrammar(content), parsedText.text, content);
        }

        if (parsedText instanceof NegationRegex) {
            const childGrammar = this.toGrammarPiece(parsedText.child, content);
            return new NegationGrammar(content, childGrammar);
        }

        if (parsedText instanceof AlternationRegex) {
            const child1Grammar = this.toGrammarPiece(parsedText.child1, content);
            const child2Grammar = this.toGrammarPiece(parsedText.child2, content);
            return new AlternationGrammar(content, [child1Grammar, child2Grammar]);
        }

        throw new Error(`Error constructing boolean expression: ${parsedText}`);
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {

        if (!(this.child instanceof TapeNameHeader 
                    || this.child instanceof EmbedHeader)) {
            content.message({
                type: "error",
                shortMsg: "Renaming error",
                longMsg: `"re" can only be followed by a tape name or "embed"`
            })
            return new EpsilonGrammar(content);
        }

        const parsedText = parseRegex(text);
        const c = this.toGrammarPiece(parsedText, content);
        return new SequenceGrammar(content, [left, c]);
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

    public merge(
        leftNeighbor: Grammar, 
        state: Grammar,
        content: Cell
    ): Grammar {

        if (leftNeighbor instanceof SequenceGrammar) {
            // if your left neighbor is a concat state we have to do something a little special,
            // because starts/ends/contains only scope over the cell immediately to the left.  (if you let
            // it be a join with EVERYTHING to the left, you end up catching prefixes that you're
            // specifying in the same row, rather than the embedded thing you're trying to catch.)
            const lastChild = leftNeighbor.finalChild();
            const filter = this.constructFilter(lastChild, state, content);
            const remainingChildren = leftNeighbor.nonFinalChildren();
            return new SequenceGrammar(content, [...remainingChildren, filter]);
        }

        return this.constructFilter(leftNeighbor, state, content);
    }

    public constructFilter(
        leftNeighbor: Grammar, 
        condition: Grammar,
        content: Cell
    ): Grammar {
        return new EqualsGrammar(content, leftNeighbor, condition);
    }
    
    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const childGrammar = this.child.toGrammar(new EpsilonGrammar(content), text, content)
        return this.merge(left, childGrammar, content);
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

    public constructFilter(
        leftNeighbor: Grammar, 
        condition: Grammar,
        content: Cell
    ): Grammar {
        const filter = new StartsGrammar(content, condition);
        return new EqualsGrammar(content, leftNeighbor, filter);
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

    public constructFilter(
        leftNeighbor: Grammar, 
        condition: Grammar,
        content: Cell
    ): Grammar {
        const filter = new EndsGrammar(content, condition);
        return new EqualsGrammar(content, leftNeighbor, filter);
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

    public constructFilter(
        leftNeighbor: Grammar, 
        condition: Grammar,
        content: Cell
    ): Grammar {
        const filter = new ContainsGrammar(content, condition);
        return new EqualsGrammar(content, leftNeighbor, filter);
    }
}

abstract class BinaryHeader extends Header {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super();
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
    
    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        const child1Grammar = this.child1.toGrammar(left, text, content);
        return this.child2.toGrammar(child1Grammar, text, content);
    }
}

export class ErrorHeader extends TapeNameHeader {

    public get id(): string {
        return "ERR";
    }

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        content.message({
            type: "warning",
            shortMsg: `Invalid header: ${this.text}`,
            longMsg: `This content is associated with an invalid header above, ignoring`
        });
        return left;
    }
}

export class ReservedErrorHeader extends ErrorHeader {

    public toGrammar(
        left: Grammar, 
        text: string,
        content: Cell
    ): Grammar {
        content.message({
            type: "warning",
            shortMsg: `Invalid header: ${this.text}`,
            longMsg: `This content is associated with an invalid header above, ignoring`
        });
        return left;
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
    "maybe", 
    //"not", 
    "hide", 
    //"reveal", 
    "equals", 
    "starts", 
    "ends", 
    "contains",
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

var HP_NON_COMMENT_EXPR: MPParser<Header> = MPDelay(() =>
    MPAlternation(
        HP_MAYBE, HP_FROM, HP_SLASH,
        HP_TO, HP_PRE, HP_POST,
        HP_FROM_ATOMIC, HP_TO_ATOMIC,
        HP_PRE_ATOMIC, HP_POST_ATOMIC,
        HP_UNIQUE, HP_REGEX,
        HP_RENAME, HP_EQUALS, HP_STARTS, 
        HP_ENDS, HP_CONTAINS, HP_SUBEXPR)
);

var HP_SUBEXPR: MPParser<Header> = MPDelay(() =>
    MPAlternation(
        HP_UNRESERVED, HP_EMBED, HP_HIDE, 
        HP_PARENS, HP_RESERVED_OP)
);

const HP_COMMENT = MPComment<Header>(
    '%',
    (s) => new CommentHeader()
);

const HP_UNRESERVED = MPUnreserved<Header>(
    RESERVED_WORDS, 
    (s) => new TapeNameHeader(s)
);

const HP_RESERVED_OP = MPReserved<Header>(
    RESERVED_OPS, 
    (s) => new ReservedErrorHeader(s)
);

const HP_EMBED = MPSequence<Header>(
    ["embed"],
    () => new EmbedHeader()
);

const HP_HIDE = MPSequence<Header>(
    ["hide"],
    () => new HideHeader()
);

const HP_MAYBE = MPSequence<Header>(
    ["maybe", HP_NON_COMMENT_EXPR],
    (child) => new MaybeHeader(child)
);

const HP_FROM = MPSequence<Header>(
    ["from", HP_NON_COMMENT_EXPR],
    (child) => new TagHeader("from", child)
);

const HP_TO = MPSequence<Header>(
    ["to", HP_NON_COMMENT_EXPR],
    (child) => new TagHeader("to", child)
);

const HP_PRE = MPSequence<Header>(
    ["pre", HP_NON_COMMENT_EXPR],
    (child) => new TagHeader("pre", child)
);


const HP_POST = MPSequence<Header>(
    ["post", HP_NON_COMMENT_EXPR],
    (child) => new TagHeader("post", child)
);

const HP_FROM_ATOMIC = MPSequence<Header>(
    ["from"],
    () => new AtomicFromHeader()
);

const HP_TO_ATOMIC = MPSequence<Header>(
    ["to"],
    () => new AtomicToHeader()
);

const HP_PRE_ATOMIC = MPSequence<Header>(
    ["pre"],
    () => new AtomicPreHeader()
);

const HP_POST_ATOMIC = MPSequence<Header>(
    ["post"],
    () => new AtomicPostHeader()
);

const HP_UNIQUE = MPSequence<Header>(
    ["unique", HP_NON_COMMENT_EXPR],
    (child) => new TagHeader("unique", child)
);

const HP_REGEX = MPSequence<Header>(
    ["re", HP_NON_COMMENT_EXPR],
    (child) => new RegexHeader(child)
);

const HP_SLASH = MPSequence<Header>(
    [HP_SUBEXPR, "/", HP_NON_COMMENT_EXPR],
    (child1, child2) => new SlashHeader(child1, child2)
);

const HP_RENAME = MPSequence<Header>(
    [">", HP_UNRESERVED],
    (child) => new RenameHeader(child)
);

const HP_PARENS = MPSequence<Header>(
    ["(", HP_NON_COMMENT_EXPR, ")"],
    (child) => child 
);

const HP_EQUALS = MPSequence<Header>(
    ["equals", HP_NON_COMMENT_EXPR],
    (child) => new EqualsHeader(child)
);

const HP_STARTS = MPSequence<Header>(
    ["starts", HP_NON_COMMENT_EXPR],
    (child) => new StartsHeader(child)
);

const HP_ENDS = MPSequence<Header>(
    ["ends", HP_NON_COMMENT_EXPR],
    (child) => new EndsHeader(child)
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    (child) => new ContainsHeader(child)
);

var HP_EXPR: MPParser<Header> = MPAlternation(HP_COMMENT, HP_NON_COMMENT_EXPR);

export function parseHeaderCell(text: string): Header {

    const results = miniParse(tokenize, HP_EXPR, text);
    if (results.length == 0) {
        // if there are no results, the programmer made a syntax error
        return new ErrorHeader(text);
    }
    if (results.length > 1) {
        // if this happens, it's an error on our part
        throw new Error(`Ambiguous, cannot uniquely parse ${text}`);
    }
    return results[0];
}