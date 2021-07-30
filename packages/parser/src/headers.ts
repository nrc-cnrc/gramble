import { 
    AstComponent, AstSequence, Contains, Embed,
    EndsWith, Epsilon, Filter, Hide, 
    Join, Lit, Maybe, Not, 
    Rename, Seq, StartsWith, Uni 
} from "./ast";

import { CPAlternation, CPNegation, CPResult, CPUnreserved, parseBooleanCell } from "./cellParser";
import { miniParse, MPAlternation, MPComment, MPDelay, MPParser, MPReserved, MPSequence, MPUnreserved } from "./miniParser";
import { Cell, HSVtoRGB, RGBtoString } from "./util";

export const DEFAULT_SATURATION = 0.1;
export const DEFAULT_VALUE = 1.0;

export class HeaderError {

    constructor(
        public severity: "error" | "warning",
        public shortMsg: string,
        public longMsg: string
    ) { }

}

/**
 * A Header is a cell in the top row of a table, consisting of one of
 * 
 * * the name of a tape, like "text" or "gloss"
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
 * * compiling the text of the cells beneath them into [AstComponent]s, and merging them (usually by
 *   concatenation) with cells to their right.
 * 
 * * knowing what colors the foreground and background of the header cell should be 
 */
 export abstract class Header {

    constructor(
        public text: string,
    ) { }

    public abstract get hue(): number;
    
    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return RGBtoString(...HSVtoRGB(this.hue, saturation, value));
    }

    /**
     * One of the primary responsibilities of the header tree is to construct the appropriate AST
     * for a cell, from the AST to its left and a string.  This string is usually the text of the 
     * cell in question, but (in the case of cells that we parse like "~(A|B)" it could be a substring
     * of this.  (That's why we need a separate text param and don't just grab it from content.text.)
     * 
     * @param left The already-constructed AST corresponding to the cell to the left of the content cell
     * @param text A string expressing the content to be compiled, in light of this header
     * @param content The cell that ultimately provided the text string
     * @returns The AST corresponding to this header/content pair
     */
    public abstract toAST(left: AstComponent, text: string, content: Cell): AstComponent;
}

/**
 * AtomicHeader is the ancestor class of all single-token headers, like "embed" and 
 * literals (e.g. "text").
 */
abstract class AtomicHeader extends Header { 

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

    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {
        const cellAST = Embed(text);
        cellAST.cell = content;
        return Seq(left, cellAST);
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

    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {
        var result = left;
        for (const tape of text.split("/")) {
            result = Hide(result, tape.trim());
            result.cell = content;
        }
        return result;
    }
}

/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
export class LiteralHeader extends AtomicHeader {

    public toAST(
        left: AstComponent, 
        text: string
    ): AstComponent {
        const ast = Lit(this.text, text);
        return Seq(left, ast);
    }
}

/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 */
export class CommentHeader extends AtomicHeader { 

    public get hue(): number {
        return 0;
    }

    public toAST(
        left: AstComponent, 
        text: string
    ): AstComponent {
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
        text: string,
        public child: Header
    ) { 
        super(text);
    }

    public get hue(): number {
        return this.child.hue;
    }
}

/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
export class MaybeHeader extends UnaryHeader {

    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {
        const childAST = this.child.toAST(Epsilon(), text, content);
        const ast = Maybe(childAST);
        return Seq(left, ast);
    }
}

/**
 * Header that constructs renames
 */
class RenameHeader extends UnaryHeader {

    public toAST(
        left: AstComponent, 
        text: string
    ): AstComponent {
        if (!(this.child instanceof LiteralHeader)) {
            throw new Error("Rename (>) of a non-literal");
        }
        const ast = Rename(left, text, this.child.text);
        return ast;
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

    public merge(leftNeighbor: AstComponent | undefined, state: AstComponent): AstComponent {
        if (leftNeighbor == undefined) {
            return state;
        }
        return Seq(leftNeighbor, state);
    }

    public toAstPiece(
        parsedText: CPResult,
        content: Cell
    ): AstComponent {

        if (parsedText instanceof CPUnreserved) {
            return this.child.toAST(Epsilon(), parsedText.text, content);
        }

        if (parsedText instanceof CPNegation) {
            const childAst = this.toAstPiece(parsedText.child, content);
            return Not(childAst);
        }

        if (parsedText instanceof CPAlternation) {
            const child1Ast = this.toAstPiece(parsedText.child1, content);
            const child2Ast = this.toAstPiece(parsedText.child2, content);
            return Uni(child1Ast, child2Ast);
        }

        throw new Error(`Error constructing boolean expression: ${parsedText}`);
    }

    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {

        if (text.length == 0) {
            return left;
        }

        const parsedText = parseBooleanCell(text);
        const c = this.toAstPiece(parsedText, content);
        return this.merge(left, c);
    }
}

/**
 * EqualsHeader puts a constraint on the state of the immediately preceding cell (call this state N)
 * that Filter(N, X) -- that is, it filters the results of N such that every surviving record is a 
 * superset of X.
 * 
 * This is also the superclass of [StartsWithHeader] and [EndsWithHeader].  These constrain N to either
 * start with X (that is, Filter(N, X.*)) or end with X (that is, Filter(N, .*X)).
 */
export class EqualsHeader extends LogicHeader {
    
    public merge(
        leftNeighbor: AstComponent | undefined, 
        state: AstComponent
    ): AstComponent {
        if (leftNeighbor == undefined) {
            throw new Error("'equals/startswith/endswith/contains' requires content to its left.");
        }

        if (leftNeighbor instanceof AstSequence) {
            // if your left neighbor is a concat state we have to do something a little special,
            // because startswith only scopes over the cell immediately to the left.  (if you let
            // it be a join with EVERYTHING to the left, you end up catching prefixes that you're
            // specifying in the same row, rather than the embedded thing you're trying to catch.)
            const lastChild = leftNeighbor.finalChild();
            const filter = this.constructFilter(lastChild, state);
            const remainingChildren = leftNeighbor.nonFinalChildren();
            return Seq(...remainingChildren, filter);
        }

        return this.constructFilter(leftNeighbor, state);
    }

    public constructFilter(leftNeighbor: AstComponent, condition: AstComponent): AstComponent {
        return Filter(leftNeighbor, condition);
    }
}

/**
 * StartsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * start with X (that is, Filter(N, X.*))
 */
export class StartsWithHeader extends EqualsHeader {

    public constructFilter(leftNeighbor: AstComponent, condition: AstComponent): AstComponent {
        return StartsWith(leftNeighbor, condition);
    }
}

/**
 * EndsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * end with X (that is, Filter(N, .*X))
 */
export class EndsWithHeader extends EqualsHeader {
    
    public constructFilter(leftNeighbor: AstComponent, condition: AstComponent): AstComponent {
        return EndsWith(leftNeighbor, condition);
    }
}

/**
 * ContainsHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * contain X (that is, Filter(N, .*X.*))
 */
export class ContainsHeader extends EqualsHeader {
    
    public constructFilter(leftNeighbor: AstComponent, condition: AstComponent): AstComponent {
        return Contains(leftNeighbor, condition);
    }
}

abstract class BinaryHeader extends Header {

    public constructor(
        text: string,
        public child1: Header,
        public child2: Header
    ) { 
        super(text);
    }

    public get hue(): number {
        return this.child1.hue;
    }
}

export class SlashHeader extends BinaryHeader {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super("/", child1, child2);
    }
    
    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {
        const childAst1 = this.child1.toAST(left, text, content);
        return this.child2.toAST(childAst1, text, content);
    }
}

export class ErrorHeader extends AtomicHeader {

    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {
        content.markError("error", `Invalid header: ${this.text}`,
            `Cannot parse the header ${this.text}`)
        return Epsilon();
    }
}

export class ReservedErrorHeader extends ErrorHeader {

    public toAST(
        left: AstComponent, 
        text: string,
        content: Cell
    ): AstComponent {
        content.markError("error", `Reserved in header: ${this.text}`,
            `Headers cannot contain reserved words, in this case "${this.text}"`)
        return Epsilon();
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

type BinaryOp = (...children: AstComponent[]) => AstComponent;
export const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": Uni,
    "concat": Seq,
    "join": Join,
}

export const RESERVED_OPS: Set<string> = new Set([ ...Object.keys(BINARY_OPS), "table", "test", "testnot" ]);

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
    (s) => new CommentHeader(s)
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
    () => new EmbedHeader("embed")
);

const HP_HIDE = MPSequence<Header>(
    ["hide"],
    () => new HideHeader("hide")
);

/*
const HP_REVEAL = MPSequence<Header>(
    ["reveal"],
    () => new RevealHeader("reveal")
);
*/

const HP_MAYBE = MPSequence<Header>(
    ["maybe", HP_NON_COMMENT_EXPR],
    (child) => new MaybeHeader("maybe", child)
);

const HP_LOGIC = MPSequence<Header>(
    ["logic", HP_NON_COMMENT_EXPR],
    (child) => new LogicHeader("maybe", child)
);

const HP_SLASH = MPSequence<Header>(
    [HP_SUBEXPR, "/", HP_NON_COMMENT_EXPR],
    (child1, child2) => new SlashHeader(child1, child2)
);

const HP_RENAME = MPSequence<Header>(
    [">", HP_UNRESERVED],
    (child) => new RenameHeader(">", child)
);

const HP_PARENS = MPSequence<Header>(
    ["(", HP_NON_COMMENT_EXPR, ")"],
    (child) => child 
);

const HP_EQUALS = MPSequence<Header>(
    ["equals", HP_NON_COMMENT_EXPR],
    (child) => new EqualsHeader("equals", child)
);

const HP_STARTSWITH = MPSequence<Header>(
    ["startswith", HP_NON_COMMENT_EXPR],
    (child) => new StartsWithHeader("startswith", child)
);

const HP_ENDSWITH = MPSequence<Header>(
    ["endswith", HP_NON_COMMENT_EXPR],
    (child) => new EndsWithHeader("endswith", child)
);

const HP_CONTAINS = MPSequence<Header>(
    ["contains", HP_NON_COMMENT_EXPR],
    (child) => new ContainsHeader("contains", child)
);

var HP_EXPR: MPParser<Header> = MPAlternation(HP_COMMENT, HP_NON_COMMENT_EXPR);

export function parseHeaderCell(text: string): Header {
    try {
        return miniParse(tokenize, HP_EXPR, text);
    } catch (e) {
        return new ErrorHeader("error");
    }
}