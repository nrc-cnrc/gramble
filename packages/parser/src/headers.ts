import { 
    AlternationGrammar, ContainsGrammar, EmbedGrammar, EndsWithGrammar, EpsilonGrammar, FilterGrammar, HideGrammar, JoinGrammar, LiteralGrammar, NegationGrammar, RenameGrammar, SequenceGrammar, StartsWithGrammar, Epsilon, GrammarComponent
} from "./grammars";

import { CPAlternation, CPNegation, CPResult, CPUnreserved, parseBooleanCell } from "./cells";
import { miniParse, MPAlternation, MPComment, MPDelay, MPParser, MPReserved, MPSequence, MPUnreserved } from "./miniParser";
import { Cell, HSVtoRGB, RGBtoString } from "./util";

export const DEFAULT_SATURATION = 0.1;
export const DEFAULT_VALUE = 1.0;

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
 * * compiling the text of the cells beneath them into [ExpressionComponent]s, and merging them (usually by
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
    public abstract toGrammar(left: GrammarComponent, text: string, content: Cell): GrammarComponent;
    public abstract getColor(saturation: number, value: number): string;
}

/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and 
 * literals (e.g. "text").
 */
abstract class AtomicHeader extends Header { 

    public abstract get text(): string;
    
    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
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
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        const cellGrammar = new EmbedGrammar(content, text);
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
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        var result = left;
        for (const tape of text.split("/")) {
            result = new HideGrammar(content, result, tape.trim());
        }
        return result;
    }
}

/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
export class LiteralHeader extends AtomicHeader {

    constructor(
        public text: string
    ) {
        super();
    }

    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        const grammar = new LiteralGrammar(content, this.text, text);
        return new SequenceGrammar(content, [left, grammar]);
    }
}

/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 */
export class CommentHeader extends Header { 

    public get hue(): number {
        return 0;
    }
    
    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return "#FFFFFF";
    }

    public toGrammar(
        left: GrammarComponent, 
        text: string
    ): GrammarComponent {
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

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child.getColor(saturation, value);
    }
}

/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
export class MaybeHeader extends UnaryHeader {

    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        const childGrammar = this.child.toGrammar(new EpsilonGrammar(content), text, content);
        const grammar = new AlternationGrammar(content, [childGrammar, new EpsilonGrammar(content)]);
        return new SequenceGrammar(content, [left, grammar]);
    }
}

/**
 * Header that constructs renames
 */
class RenameHeader extends UnaryHeader {

    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        if (!(this.child instanceof LiteralHeader)) {
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
 * The command "logic X:Y" allows the use of ~ and | in the cell
 * to mean "not" and "or" respectively, rather than have their literal usage.
 * 
 * e.g. "~(A|B)" is interpreted as "neither A nor B" rather than this literal string.
 * 
 * This is also the ancestor class of all other headers (e.g. "equals", 
 * startsWith", etc.) that allow and parse boolean-algebra expressions 
 * in their fields.
 */
export class LogicHeader extends UnaryHeader {

    public merge(
        left: GrammarComponent | undefined, 
        child: GrammarComponent,
        content: Cell
    ): GrammarComponent {
        if (left == undefined) {
            return child;
        }
        return new SequenceGrammar(content, [left, child]);
    }

    public toGrammarPiece(
        parsedText: CPResult,
        content: Cell
    ): GrammarComponent {

        if (parsedText instanceof CPUnreserved) {
            return this.child.toGrammar(new EpsilonGrammar(content), parsedText.text, content);
        }

        if (parsedText instanceof CPNegation) {
            const childGrammar = this.toGrammarPiece(parsedText.child, content);
            return new NegationGrammar(content, childGrammar);
        }

        if (parsedText instanceof CPAlternation) {
            const child1Grammar = this.toGrammarPiece(parsedText.child1, content);
            const child2Grammar = this.toGrammarPiece(parsedText.child2, content);
            return new AlternationGrammar(content, [child1Grammar, child2Grammar]);
        }

        throw new Error(`Error constructing boolean expression: ${parsedText}`);
    }

    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {

        if (text.length == 0) {
            return left;
        }

        const parsedText = parseBooleanCell(text);
        const c = this.toGrammarPiece(parsedText, content);
        return this.merge(left, c, content);
    }
}

/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a 
 * superset of X.
 * 
 * This is also the superclass of [StartsWithHeader], [EndsWithHeader], and [ContainsHeader].  
 * These constrain N to either start with X (that is, Filter(N, X.*)) or end with X 
 * (that is, Filter(N, .*X)), or contain X (Filter(N, .*X.*)).
 */
export class EqualsHeader extends LogicHeader {
    
    public merge(
        leftNeighbor: GrammarComponent | undefined, 
        state: GrammarComponent,
        content: Cell
    ): GrammarComponent {
        if (leftNeighbor == undefined) {
            content.message({
                type: "error",
                shortMsg: "Filtering empty grammar",
                longMsg: "'equals/startswith/endswith/contains' requires content to its left."
            });
            return new EpsilonGrammar(content);
        }

        if (leftNeighbor instanceof SequenceGrammar) {
            // if your left neighbor is a concat state we have to do something a little special,
            // because startswith only scopes over the cell immediately to the left.  (if you let
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
        leftNeighbor: GrammarComponent, 
        condition: GrammarComponent,
        content: Cell
    ): GrammarComponent {
        return new FilterGrammar(content, leftNeighbor, condition);
    }
}

/**
 * StartsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * start with X (that is, Filter(N, X.*))
 */
export class StartsWithHeader extends EqualsHeader {

    public constructFilter(
        leftNeighbor: GrammarComponent, 
        condition: GrammarComponent,
        content: Cell
    ): GrammarComponent {
        return new StartsWithGrammar(content, leftNeighbor, condition);
    }
}

/**
 * EndsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * end with X (that is, Filter(N, .*X))
 */
export class EndsWithHeader extends EqualsHeader {

    public constructFilter(
        leftNeighbor: GrammarComponent, 
        condition: GrammarComponent,
        content: Cell
    ): GrammarComponent {
        return new EndsWithGrammar(content, leftNeighbor, condition);
    }
}

/**
 * ContainsHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * contain X (that is, Filter(N, .*X.*))
 */
export class ContainsHeader extends EqualsHeader {
    
    public constructFilter(
        leftNeighbor: GrammarComponent, 
        condition: GrammarComponent,
        content: Cell
    ): GrammarComponent {
        return new ContainsGrammar(content, leftNeighbor, condition);
    }
}

abstract class BinaryHeader extends Header {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super();
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return this.child1.getColor(saturation, value);
    }
}

export class SlashHeader extends BinaryHeader {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super(child1, child2);
    }
    
    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        const child1Grammar = this.child1.toGrammar(left, text, content);
        return this.child2.toGrammar(child1Grammar, text, content);
    }
}

export class ErrorHeader extends LiteralHeader {

    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        content.message({
            type: "warning",
            shortMsg: `Invalid header: ${this.text}`,
            longMsg: `This content is associated with an invalid header above, ignoring`
        });
        return new EpsilonGrammar(content);
    }
}

export class ReservedErrorHeader extends ErrorHeader {

    public toGrammar(
        left: GrammarComponent, 
        text: string,
        content: Cell
    ): GrammarComponent {
        content.message({
            type: "warning",
            shortMsg: `Invalid header: ${this.text}`,
            longMsg: `This content is associated with an invalid header above, ignoring`
        });
        return new EpsilonGrammar(content);
    }

}


/**
 * What follows is a grammar and parser for the mini-language inside headers, e.g.
 * "text", "text/gloss", "startswith text", etc.
 * 
 * It uses the mini-parser library in miniParser.ts to construct a recursive-descent
 * parser for the grammar.
 */

const SYMBOL = [ "(", ")", "%", "/",  ">", ":" ];
export const RESERVED_HEADERS = [
    "embed", 
    "maybe", 
    //"not", 
    "hide", 
    //"reveal", 
    "equals", 
    "startswith", 
    "endswith", 
    "contains" 
];

export const RESERVED_OPS: Set<string> = new Set(["table", "test", "testnot", "or", "concat", "join", "replace"]);

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
    MPAlternation(HP_MAYBE, HP_SLASH, HP_RENAME, HP_EQUALS, 
                HP_STARTSWITH, HP_ENDSWITH, HP_CONTAINS, HP_SUBEXPR)
);

var HP_SUBEXPR: MPParser<Header> = MPDelay(() =>
    MPAlternation(HP_UNRESERVED, HP_EMBED, HP_HIDE, 
    //HP_REVEAL, 
    HP_LOGIC, 
    HP_PARENS,
    HP_RESERVED_OP)
);

const HP_COMMENT = MPComment<Header>(
    '%',
    (s) => new CommentHeader()
);

const HP_UNRESERVED = MPUnreserved<Header>(
    RESERVED_WORDS, 
    (s) => new LiteralHeader(s)
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

/*
const HP_REVEAL = MPSequence<Header>(
    ["reveal"],
    () => new RevealHeader("reveal")
);
*/

const HP_MAYBE = MPSequence<Header>(
    ["maybe", HP_NON_COMMENT_EXPR],
    (child) => new MaybeHeader(child)
);

const HP_LOGIC = MPSequence<Header>(
    ["logic", HP_NON_COMMENT_EXPR],
    (child) => new LogicHeader(child)
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

const HP_STARTSWITH = MPSequence<Header>(
    ["startswith", HP_NON_COMMENT_EXPR],
    (child) => new StartsWithHeader(child)
);

const HP_ENDSWITH = MPSequence<Header>(
    ["endswith", HP_NON_COMMENT_EXPR],
    (child) => new EndsWithHeader(child)
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    (child) => new ContainsHeader(child)
);

var HP_EXPR: MPParser<Header> = MPAlternation(HP_COMMENT, HP_NON_COMMENT_EXPR);

export function parseHeaderCell(text: string): Header {
    try {
        return miniParse(tokenize, HP_EXPR, text);
    } catch (e) {
        return new ErrorHeader(text);
    }
}