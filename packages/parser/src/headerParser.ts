import { Gen, meanAngleDeg, HSVtoRGB, RGBtoString} from "./util";
import { State, Lit, Emb, Seq, Empty, Namespace, Maybe, Not, Join } from "./stateMachine";

const DEFAULT_SATURATION = 0.2;
const DEFAULT_VALUE = 1.0;


/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with 
 * its first cell at -1, -1.
 */
export class CellPosition {

    constructor(
        public readonly sheet: string,
        public readonly row: number = -1,
        public readonly col: number = -1
    ) { }

    public toString() {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
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
 * * providing a static parse method that takes a list of input tokens and returns
 *   lists of [Header, remnant] pairs.  These are combined into a quick-n-dirty 
 *   parser-combinator engine at the bottom of this file.  (If you want to understand
 *   how this works, google for "parser combinators"; it's an old trick to quickly 
 *   write a recursive descent parser in plain code, without using a parsing library.)
 * 
 * * compiling the cells beneath them into States, and merging them (usually by
 *   concatenation) with cells to their right.
 * 
 * * knowing what colors the foreground and background of the header cell should be 
 * 
 */
export abstract class Header {

    constructor(
        public text: string
    ) { }

    public abstract get hue(): number;
    
    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return RGBtoString(...HSVtoRGB(this.hue, saturation, value));
    }

    public getFgColor(): string {
        return "#000000";
    }
    
    public compile(valueText: string, 
                            pos: CellPosition,
                            namespace: Namespace): State {
        
        throw new Error('Not implemented');
    }

    public merge(state: State, other: State): State {
        return Seq(state, other);
    }

    public compileAndMerge(valueText: string,
                            pos: CellPosition,
                            namespace: Namespace,
                            rightNeighbor: State | undefined): State {
        
        const compiledCell = this.compile(valueText, pos, namespace);
        if (rightNeighbor == undefined) {
            return compiledCell;
        }
        return this.merge(compiledCell, rightNeighbor);
    }
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

    public static *parseTarget(target: string,
                        constructor: new (t: string) => Header,
                        input: string[]): Gen<[Header, string[]]> {
        if (input.length == 0 || input[0] != target) {
            return;
        }
        yield [new constructor(input[0]), input.slice(1)];
    }
}

/**
 * EmbedHeaders lead to the complilation of EmbedStates.
 */
export class EmbedHeader extends AtomicHeader {

    
    public compile(valueText: string, 
                    pos: CellPosition,
                    namespace: Namespace): State {
        return Emb(valueText, namespace);
    }

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield* super.parseTarget("embed", EmbedHeader, input);
    }
}

/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
export class LiteralHeader extends AtomicHeader {
    
    public compile(valueText: string, 
                    pos: CellPosition,
                    namespace: Namespace): State {
        return Lit(this.text, valueText);
    }

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        if (input.length == 0 || ALL_RESERVED.indexOf(input[0]) != -1) {
            return;
        }
        yield [new LiteralHeader(input[0]), input.slice(1)];
    }
}


/**
 * Commented-out headers also comment out any cells below them; the cells just act as
 * Empty() states.
 * 
 * Note that "%" is not a unary operator the way others are; the *parse method 
 * for this doesn't bother parsing any remnant, and just effectively consumes everything.
 * If the programmer is failing to construct a header, for example, and comments it
 * out in the meantime, we don't want to keep parsing it and fail, we just want
 * to accept that whatever in this line isn't a header, it's a comment.
 */
export class CommentHeader extends Header { 

    public get hue(): number {
        return 0;
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return "#FFFFFF";
    }

    public getFgColor(): string {
        return "#449944";
    }

    
    public compile(valueText: string,
                    pos: CellPosition,
                   namespace: Namespace): State {
        return Empty();
    }
        
    public static *parse(input: string[]): Gen<[Header, string[]]> {

        if (input.length == 0 || input[0] != "%") {
            return;
        }

        yield [new CommentHeader('%'), []];
    }
}

/**
 * The ancestor class of unary header operators like "maybe", "not", and "@"
 * (the joining operator that we use to implement flags).
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

    public compile(valueText: string,
        pos: CellPosition,
        namespace: Namespace): State {

        return this.child.compile(valueText, pos, namespace);
    }

    public static *parseTarget(target: string, 
                            constructor: new(t: string, c: Header) => Header,
                            childParser: HeaderParser,
                            input: string[]): Gen<[Header, string[]]> {
        if (input.length == 0 || input[0] != target) {
            return;
        }
        for (const [child, rem] of childParser(input.slice(1))) {
            yield [new constructor(target, child), rem];
        }
    }
}

/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
export class MaybeHeader extends UnaryHeader {

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield *super.parseTarget("maybe", MaybeHeader, NON_COMMENT_EXPR, input);
    }

    public compile(valueText: string,
        pos: CellPosition,
        namespace: Namespace): State {
        
        const childState = this.child.compile(valueText, pos, namespace);
        return Maybe(childState);
    }
}


/**
 * Header that constructs negations, e.g. "not text"
 */
export class NotHeader extends UnaryHeader {

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield *super.parseTarget("not", NotHeader, NON_COMMENT_EXPR, input);
    }

    public compile(valueText: string,
        pos: CellPosition,
        namespace: Namespace): State {
        
        const childState = this.child.compile(valueText, pos, namespace);
        return Not(childState);
    }
}

/**
 * A FlagHeader handles headers like "@x"; it joins x:X with whatever
 * follows rather than concatenating it.
 * 
 * Note that FlagHeader binds more tightly than other unary operators,
 * e.g. while "maybe" in "maybe text/gloss" has "text/gloss" as its child,
 * "@" in "@text/gloss" only has "@" as its child.
 */
export class FlagHeader extends UnaryHeader {

    public merge(state: State, other: State): State {
        return Join(state, other);
    }
    
    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield *super.parseTarget("@", FlagHeader, SUBEXPR, input);
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
        return (meanAngleDeg([this.child1.hue * 360, this.child2.hue * 360]) + 360) / 360;
    }
    
    public static *parseTarget(target: string, input: string[]): Gen<[Header, string[]]> {
        if (input.length == 0) {
            return;
        }

        for (const [t1, rem1] of SUBEXPR(input)) {
            if (rem1.length == 0 || rem1[0] != target) {
                return;
            }
            for (const [t2, rem2] of NON_COMMENT_EXPR(rem1.slice(1))) {
                yield [new SlashHeader(t1, t2), rem2];
            }
        }
    }

}

export class SlashHeader extends BinaryHeader {

    public constructor(
        public child1: Header,
        public child2: Header
    ) { 
        super("/", child1, child2);
    }

    /**
     * This isn't ordinarily called, usually compileAndMerge handles compilation
     * of SlashHeader.  But
     * when another header has a SlashHeader child, like "@(x/y)", this would
     * be called.
     */
    public compile(valueText: string,
        pos: CellPosition,
        namespace: Namespace): State {

        const childState1 = this.child1.compile(valueText, pos, namespace);
        const childState2 = this.child2.compile(valueText, pos, namespace);
        return Seq(childState1, childState2);
    }

    public compileAndMerge(valueText: string,
        pos: CellPosition,
        namespace: Namespace,
        rightNeighbor: State | undefined): State {

        const childState2 = this.child2.compileAndMerge(valueText, pos, namespace, rightNeighbor);
        const childState1 = this.child1.compileAndMerge(valueText, pos, namespace, childState2);
        return childState1;
    }

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield *super.parseTarget("/", input);
    }   
}


type HeaderParser = (input: string[]) => Gen<[Header, string[]]>;

const SYMBOL = [ "(", ")", "%", "/", '@'];
const RESERVED = ["embed", "maybe", "not" ];
const ALL_RESERVED = [...SYMBOL, ...RESERVED];

const SUBEXPR = Alt([LiteralHeader.parse,
                    EmbedHeader.parse, 
                    FlagHeader.parse, 
                    Parens]);

const NON_COMMENT_EXPR = Alt([MaybeHeader.parse, 
                              NotHeader.parse,
                              SlashHeader.parse, 
                              SUBEXPR]);

const EXPR = Alt([CommentHeader.parse, 
                NON_COMMENT_EXPR]);

function Alt(children: HeaderParser[]): HeaderParser {
    return function*(input: string[]) {
        for (const child of children) {
            yield* child(input);
        }
    }
}

function* Parens(input: string[]): Gen<[Header, string[]]> {
    if (input.length == 0 || input[0] != "(") {
        return;
    }

    for (const [t, rem] of NON_COMMENT_EXPR(input.slice(1))) {
        if (rem.length == 0 || rem[0] != ")") {
            return;
        }

        yield [t, rem.slice(1)]
    }
}


const tokenizer = new RegExp("\\s+|(" + 
                            SYMBOL.map(s => "\\"+s).join("|") + 
                            ")");

function tokenize(text: string): string[] {
    return text.split(tokenizer).filter(
        (s: string) => s !== undefined && s !== ''
    );
}

/**
 * This is the main function that the rest of the libraries interact with;
 * they provide a string and (hopefully) get a parser in return.
 */
export function parseHeader(headerText: string): Header {
    const pieces = tokenize(headerText);
    var result = [... EXPR(pieces)];
    // result is a list of [header, remaining_tokens] pairs.  
    // we only want results where there are no remaining tokens.
    result = result.filter(([t, r]) => r.length == 0);

    if (result.length == 0) {
        // if there are no results, the programmer made a syntax error
        throw new Error(`Cannot parse header: ${headerText}`);
    }
    if (result.length > 1) {
         // the grammar above should be unambiguous, so we shouldn't get 
         // multiple results, but just in case...
        throw new Error(`Ambiguous header, cannot parse: ${headerText}.` +
                " This probably isn't your fault.");
    }
    return result[0][0];
}