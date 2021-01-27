
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees, for later compilation into formulas of a programming language.
 * It's agnostic as to exactly what that programming language is; to adapt
 * it to a particular language, implement Compiler<T> where T is the base class
 * of formulas in that language.
 */

import { DevEnvironment } from "./devEnv";
import { CounterStack, Uni, State, Lit, Emb, Seq, Empty, Namespace, Maybe, Not, Join, Semijoin } from "./stateMachine";
import { Gen, HSVtoRGB, iterTake, meanAngleDeg, RGBtoString, StringDict } from "./util";

/*
class SyntaxError {

    constructor(
        public position: CellPosition,
        public level: "error" | "warning",
        public msg: string
    ) { }

    public toString() {
        return `${this.level.toUpperCase()}: ${this.msg}`;
    }
}
export class ErrorAccumulator {

    protected errors: {[key: string]: SyntaxError[]} = {};

    public addError(pos: CellPosition, level: "error" | "warning", msg: string) {
        const key = pos.toString();
        if (!(key in this.errors)) {
            this.errors[key] = [];
        }
        const error = new SyntaxError(pos, level, msg);
        this.errors[key].push(error);
    }

    public logErrors(): void {
        for (const error of Object.values(this.errors)) {
            for (const errorMsg of error) {
                console.log(`${errorMsg.position}: ${errorMsg.toString()}`);
            }
        }
    }

    public getErrors(sheet: string, row: number, col: number): string[] {
        const key = new CellPosition(sheet, row, col).toString();
        const results: string[] = [];
        if (!(key in this.errors)) {
            return [];
        }
        return this.errors[key].map(e => e.toString());
    }

    public numErrors(level: "error" | "warning"|"any"): number {
        var result = 0;
        for (const error of Object.values(this.errors)) {
            for (const errorMsg of error) {
                if (level == "any" || errorMsg.level == level) {
                    result++;
                }
            }
        }
        return result;
    }
}
*/


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
    
    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        throw new Error('Not implemented');
    }

    public merge(state: State, other: State): State {
        return Seq(state, other);
    }

    public compileAndMerge(cell: CellComponent,
                            namespace: Namespace,
                            rightNeighbor: State | undefined): HeadedCellComponent {
        
        const compiledCell = this.compile(cell, namespace);
        if (rightNeighbor == undefined) {
            return compiledCell;
        }
        compiledCell.state = this.merge(compiledCell.state, rightNeighbor);
        return compiledCell;
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

    
    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        const compiledCell = new EmbedComponent(this, cell);
        compiledCell.state = Emb(cell.text, namespace);
        return compiledCell;
    }

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield* super.parseTarget("embed", EmbedHeader, input);
    }
}

/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
export class LiteralHeader extends AtomicHeader {
    
    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        const compiledCell = new HeadedCellComponent(this, cell);
        compiledCell.state = Lit(this.text, cell.text);
        return compiledCell;
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

    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        return new HeadedCellComponent(this, cell);
        // don't have to do any assignment to state because it's already Empty() on construction
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

    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        const childCell = this.child.compile(cell, namespace);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = childCell.state;
        return compiledCell;
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

    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        const childCell = this.child.compile(cell, namespace);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = Maybe(childCell.state);
        return compiledCell;
    }
}


/**
 * Header that constructs negations, e.g. "not text"
 */
export class NotHeader extends UnaryHeader {

    public static *parse(input: string[]): Gen<[Header, string[]]> {
        yield *super.parseTarget("not", NotHeader, NON_COMMENT_EXPR, input);
    }

    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        const childCell = this.child.compile(cell, namespace);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = Maybe(childCell.state);
        return compiledCell;
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
        return this.child1.hue;
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
    
    public compile(cell: CellComponent, namespace: Namespace): HeadedCellComponent {
        const childCell1 = this.child1.compile(cell, namespace);
        const childCell2 = this.child2.compile(cell, namespace);
        const compiledCell = new BinaryHeadedCellComponent(this, cell, childCell1, childCell2);
        compiledCell.state = Seq(childCell1.state, childCell2.state);
        return compiledCell;
    }

    public compileAndMerge(cell: CellComponent,
                            namespace: Namespace,
                            rightNeighbor: State | undefined): HeadedCellComponent {
        
        const childCell2 = this.child2.compileAndMerge(cell, namespace, rightNeighbor);
        const childCell1 = this.child1.compileAndMerge(cell, namespace, childCell2.state);
        const compiledCell = new BinaryHeadedCellComponent(this, cell, childCell1, childCell2);
        compiledCell.state = childCell1.state;
        return compiledCell;
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

export abstract class TabularComponent {

    /**
     * In the case of cells, text() is the text of the cell; otherwise
     * it's the text of the first cell in the component. 
     */
    public abstract get text(): string;

    /**
     * For cells, their position; otherwise the position of the first cell
     * in the component
     */
    public abstract get position(): CellPosition;

}

export class CellComponent extends TabularComponent {

    constructor(
        public text: string,
        public position: CellPosition
    ) {
        super();
    }

    public toString(): string {
        return `${this.text}:${this.position}`;
    }

}

export abstract class CompileableComponent extends TabularComponent {

    public state: State = Empty();

    /**
     * The previous sibling of the component (i.e. the component that shares
     * the same parent, but appeared before this component, usually directly
     * above this one).
     * 
     * Only EnclosureComponents have siblings, but it's more convenient
     * to define it here so that certain clients (like unit tests) don't have
     * to deal with the templating aspects.  
     */
    public sibling: CompileableComponent | undefined = undefined;

    /**
     * The last-defined child of the component (i.e. of all the components
     * enclosed by this component, the last one.)  As [SheetParser] builds the
     * tree, this value will change; when a new child is added, it's set to the
     * parent's child and the previous child (if any) becomes the new child's
     * sibling.
     */
    public child: CompileableComponent | undefined = undefined;

    public getHeader(col: number): Header | undefined {
        return undefined;
    }

    public abstract compile(namespace: Namespace, 
                            devEnv: DevEnvironment): void;


    public runChecks(namespace: Namespace, devEnv: DevEnvironment): void {
        if (this.sibling != undefined) {
            this.sibling.runChecks(namespace, devEnv);
        }
        if (this.child != undefined) {
            this.child.runChecks(namespace, devEnv);
        }
    }
}


type BinaryOp = (...children: State[]) => State;
const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": Uni,
    "concat": Seq,
    "join": Join,
}

const BUILT_IN_OPS: Set<string> = new Set([...Object.keys(BINARY_OPS),
                                            "table",
                                            "test",
                                            "testnot"]);

/* There are some reserved words like "maybe" that aren't built in ops, but
 * for sanity's sake you still can't use them as symbols */
const RESERVED_WORDS = new Set([...BUILT_IN_OPS,
                                "maybe",
                                "not",
                                "embed"]);

/**
 * An enclosure represents a single-cell unit containing a command or identifier (call that the "startCell"),
 * and a rectangular region describing further details (like the parameters of the command,
 * or what is to be assigned to the identifier). 
 * 
 * An enclosure contains all cells to the right of it, and the cells below the cells to the right
 * (more precisely, a enclosure with its startCell in (r,c) contains all cells (x,y) where x >= r 
 * and y > c), until a non-empty cell is encountered that is below the startCell or in a column before
 * the startCell.
 * 
 * For example, if I is the ID cell, E are cells contained in the enclosure, X is the cell that "breaks"
 * the enclosure, and O are cells not contained in the enclosure:
 * 
 * 0 0 0 0
 * 0 I E E E E 
 *     E E E E
 *     E E E E
 *   X 0 0 0 0
 *     0 0 0 0 
 * 
 * Enclosures can be nested, and often are.  E.g., below, 2 contains all the A's, 3 
 * contains all the B's, and 1 contains 2 and 3.
 * 
 * 1 2 A A A A A
 *     A A A A A
 * 
 *   3 B B B B
 *     B B B B
 * 
 * Each enclosure keeps reference only to its last child.  Previous children are kept
 * as "sibling" references within that child.  Above, 3 is 1's child, and 2 is 3's
 * sibling.  Tables are also children; the table consisting of A's is 2's child.
 * For the most part, and operator like 3 will be a binary operation where
 * 2 and the B table are its params.  (For example, 3 might represent "or", and thus
 * the union of the grammar represented by 2 and the grammar represented by the B table.
 * 
 */
export class EnclosureComponent extends CompileableComponent {

    public specRow: number = -1;

    constructor(
        public startCell: CellComponent,
        public parent: EnclosureComponent | undefined = undefined
    ) {
        super();
        this.specRow = startCell.position.row;
    }

    public get position(): CellPosition { 
        return this.startCell.position; 
    }

    public get text(): string {
        return this.startCell.text;
    }

    public getHeader(col: number): Header | undefined {
        if (this.child == undefined) {
            return undefined;
        }
        return this.child.getHeader(col);
    }
    
    public addHeader(header: CellComponent, devEnv: DevEnvironment): void {
        // can only add a header if there aren't any child enclosures yet.
        // well, we could, but it makes a particular kind of syntax error
        // hard to spot
        if (this.child == undefined) {
            this.child = new ContentsComponent();
        }
        if (!(this.child instanceof ContentsComponent)) {
            throw new Error("Closure already has a child; cannot add a header to it.");
        }
        this.child.addHeader(header, devEnv);
    }
    
    public addContent(cell: CellComponent, devEnv: DevEnvironment): void {
        if (!(this.child instanceof ContentsComponent)) {
            throw new Error("Trying to add content to a non-table");
        }
        this.child.addContent(cell, devEnv);
    }
    
    public compile(namespace: Namespace, 
        devEnv: DevEnvironment): void {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.
        devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                        "Unknown operator", `Operator ${this.text} not recognized.`);
    }


    public addChildEnclosure(child: EnclosureComponent, 
                            devEnv: DevEnvironment): void {
        if (this.child instanceof ContentsComponent) {
            throw new Error("Can't add an operator to a line that already has headers.");
        }

        if (this.child != undefined && this.child.position.col != child.position.col) {
            devEnv.markError(child.position.sheet, child.position.row, child.position.col,
                "Unexpected operator",
                "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.position.col}, ` + 
                `so that it's under the operator in cell ${this.child.position}?`,
                "warning");
        }

        child.sibling = this.child;
        this.child = child;
    }

    public toString(): string {
        return `Enclosure(${this.position})`;
    }

    public get sheet(): SheetComponent {
        if (this.parent == undefined) {
            throw new Error("Stack empty; something has gone very wrong");
        }
        return this.parent.sheet;
    }
    
}

class AssignmentComponent extends EnclosureComponent {

    public compile(namespace: Namespace, devEnv: DevEnvironment): CompileableComponent {

        // first compile the previous sibling.  note that all siblings
        // of an assignment statement should be an assignment statement, since
        // being an assignment statement is, by definition, having a sheet component
        // as your immediate parent.
        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
        }

        if (RESERVED_WORDS.has(this.text)) {
            // oops, assigning to a reserved word
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Assignment to reserved word", 
                "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${this.text}.  Choose a different symbol name.`);
            if (this.child != undefined) {
                // compile the child just in case there are useful errors to display
                this.child.compile(namespace, devEnv);
            }
            return this;
        }

        if (this.sibling != undefined && !(this.sibling instanceof AssignmentComponent)) {
            devEnv.markError(this.sibling.position.sheet, this.sibling.position.row, this.sibling.position.col,
                "Wayward operator",
                "The result of this operator does not get assigned to anything.");
        }

        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Missing content", `This looks like an assignment to a symbol ${this.text}, ` +
                "but there's nothing to the right of it.", "warning");
            return this;
        }

        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
        
        if (namespace.hasSymbol(this.text)) {
            // oops, trying to assign to a symbol that already is assigned to!
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Redefining existing symbol", 
                `You've already assigned something to the symbol ${this.text}`);
            return this;
        }

        namespace.addSymbol(this.text, this.child.state);
        return this;
    }

}

class BinaryOpComponent extends EnclosureComponent {

    public compile(namespace: Namespace, 
                            devEnv: DevEnvironment): void {

        const op = BINARY_OPS[this.text];
                                    
        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                `Missing argument to '${this.text}'`, 
                `'${this.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
            return;
        }

        if (this.sibling == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                `Missing argument to '${this.text}'`,
                `'${this.text}' is missing a first argument; ` +
                "something should be in a cell above this.");
            return;
        }

        this.sibling.compile(namespace, devEnv);
        this.child.compile(namespace, devEnv);
        this.state = op(this.sibling.state, this.child.state);
    }
}

class TableComponent extends EnclosureComponent {


    public compile(namespace: Namespace, devEnv: DevEnvironment): void {

        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Missing content",
                "'table' seems to be missing a table; something should be in the cell to the right.", "warning")
            return;
        }

        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
            // we don't do anything with the sibling, but we
            // compile it anyway in case there are errors in it the
            // programmer may want to know about
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Table overwrite warning",
                `'table' here will obliterate the preceding content at ${this.sibling.position}.`,
                "warning");
        
        }

        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
    }


}

abstract class AbstractTestSuiteComponent extends EnclosureComponent {

    protected tests: RowComponent[] = [];

    /**
     * "test" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has an output when semijoined to the table above.
     * 
     * Test doesn't make any change to the State it returns; adding a "test" below
     * a grammar returns the exact same grammar as otherwise.  
     */
    public compile(namespace: Namespace, devEnv: DevEnvironment): void {
        
        if (this.sibling == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Wayward test",
                "There should be something above this 'test' command for us to test");
            return;
        }

        const sibling = this.sibling.compile(namespace, devEnv);

        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Missing content",
                "'test' seems to be missing something to test; something should be in the cell to the right.", "warning")
            this.state = this.sibling.state;
            return; // whereas usually we result in the empty grammar upon erroring, in this case
                        // we don't want to let a flubbed "test" command obliterate the grammar
                        // it was meant to test!
        }
        
        if (!(this.child instanceof ContentsComponent)) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Cannot execute tests",
                "You can't nest another operator under a test block, it has to be a content table.");
            this.state = this.sibling.state;
            return;
        }

        this.child.compile(namespace, devEnv);

        this.tests = this.child.rows;
        this.state = this.sibling.state;
    }

}

class TestSuiteComponent extends AbstractTestSuiteComponent {

    
    public runChecks(namespace: Namespace, devEnv: DevEnvironment): void {
        super.runChecks(namespace, devEnv);

        for (const test of this.tests) {
            // the appropriate operation here is the left semijoin between my state
            // and the test's state
            const testingState = Semijoin(this.state, test.state);
            const results = [...testingState.generate()];
            if (results.length == 0) {
                devEnv.markError(test.position.sheet, test.position.row, test.position.col,
                    `Test failed: ${test.text}`,
                    "This row cannot be generated by the grammar above.");
            }
        }
    }
}

class TestNotSuiteComponent extends AbstractTestSuiteComponent {

    protected tests: RowComponent[] = [];
    
    public runChecks(namespace: Namespace, devEnv: DevEnvironment): void {
        super.runChecks(namespace, devEnv);

        for (const test of this.tests) {
            // the appropriate operation here is the left semijoin between my state
            // and the test's state
            const testingState = Semijoin(this.state, test.state);
            const results = [...testingState.generate()];
            if (results.length != 0) {
                devEnv.markError(test.position.sheet, test.position.row, test.position.col,
                    `Test failed: ${test.text}`,
                    "This row can be generated by the grammar above.");
            }
        }
    }
}

/**
 * A [SheetComponent] is basically an EnclosureComponent without 
 * a parent component; a sheet is always the outermost component of
 * any component tree.
 */
class SheetComponent extends EnclosureComponent {

    constructor(
        public name: string
    ) { 
        super(new CellComponent(name, new CellPosition(name)));
    }
    
    public addHeader(header: CellComponent): void {
        throw new Error("This appears to be a header, but what is it a header for?");
    }

    public compile(namespace: Namespace, devEnv: DevEnvironment): void {

        if (this.child == undefined) {
            return;
        }

        this.child.compile(namespace, devEnv);

        if (!(this.child instanceof AssignmentComponent)) {
            devEnv.markError(this.child.position.sheet, this.child.position.row, this.child.position.col,
                "Wayward operator",
                "The result of this operator does not get assigned to anything.",
                "warning");
        }
    }

    public get sheet(): SheetComponent {
        return this;
    }

}

/**
 * A ContentsComponent is a rectangular region of the grid consisting of a header row
 * and cells beneath each header.  For example,
 * 
 *      text, gloss
 *      foo, run
 *      moo, jump
 *      goo, climb
 * 
 * Each header indicates how each cell beneath it should be interpreted; "foo"
 * should be interpret as "text", whatever that happens to mean in the programming
 * language in question.  Note that these are not necessarily well-formed database
 * tables; it's entirely possible to get tables where the same
 * header appears multiple times.
 */

class ContentsComponent extends CompileableComponent {

    public headersByCol: {[col: number]: Header} = {};
    public rows: RowComponent[] = [];
    private startCell: CellComponent | undefined = undefined;

    public get position(): CellPosition {
        if (this.startCell == undefined) {
            throw new Error("Trying to get position of an empty ContentsComponent");
        }
        return this.startCell.position;
    }

    public get text(): string {
        if (this.startCell == undefined) {
            throw new Error("Trying to get text of an empty ContentsComponent");
        }
        return this.startCell.text;
    } 

    public addHeader(headerCell: CellComponent, devEnv: DevEnvironment): void {
        if (this.startCell == undefined) {
            this.startCell = headerCell;
        }
        try {
            // parse the header into a Header object
            const compiledHeader = parseHeader(headerCell.text);
            // color it properly in the interface
            const contentColor = compiledHeader.getColor(0.1);
            devEnv.markHeader(headerCell.position.sheet, headerCell.position.row, 
                headerCell.position.col, contentColor);
            // remember it by its column number, because that's how content
            // cells will be asking for it.
            this.headersByCol[headerCell.position.col] = compiledHeader;
        } catch(e) {
            devEnv.markError(headerCell.position.sheet, headerCell.position.row, 
                headerCell.position.col, `Invalid header: ${headerCell.text}`,
                "Attempted to parse this cell as a header, but could not.",
                "error");
        }
    }

    public getHeader(col: number): Header | undefined {
        return this.headersByCol[col];
    }

    public addContent(cell: CellComponent, devEnv: DevEnvironment): void {
        
        // make sure we have a header
        const header = this.getHeader(cell.position.col);
        if (header == undefined) {
            if (cell.text.length != 0) {
                devEnv.markError(cell.position.sheet, cell.position.row, 
                    cell.position.col, `Ignoring cell: ${cell.text}`,
                    "Cannot associate this cell with any valid header above; ignoring.",
                    "warning");
                }
            return;
        }
        
        // mark it as such
        const contentColor = header.getColor(0.1);
        devEnv.markTier(cell.position.sheet, cell.position.row, 
            cell.position.col, contentColor);

        // the following only applies if there's text in the cell
        if (cell.text.length == 0) {
            return;
        }

    
        // make a table row if we need one
        if (this.rows.length == 0 || 
            cell.position.row != this.rows[this.rows.length-1].position.row) {
            const newRow = new RowComponent();
            this.rows.push(newRow);
        }

        // add the content
        const lastRow = this.rows[this.rows.length-1];
        lastRow.addContent(header, cell);

    }

    public compile(namespace: Namespace, 
                        devEnv: DevEnvironment): void {
        this.rows.map(row => row.compile(namespace, devEnv));
        const rowStates = this.rows.map(row => row.state);
        this.state = Uni(...rowStates);
    }

    
    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        this.rows.map(row => row.runChecks(ns, devEnv));
    }

    public toString(): string {
        return `Table(${this.position})`;
    }

}


class RowComponent extends CompileableComponent {

    protected uncompiledCells: [Header, CellComponent][] = [];
    protected compiledCells: HeadedCellComponent[] = [];

    public get position(): CellPosition {
        if (this.uncompiledCells.length == 0) {
            throw new Error("Trying to get position of an empty RowComponent");
        }
        return this.uncompiledCells[0][1].position;
    }
    
    public get text(): string {
        if (this.uncompiledCells.length == 0) {
            throw new Error("Trying to get text of an empty RowComponent");
        }
        return this.uncompiledCells[0][1].text;
    }
    
    public compile(namespace: Namespace, devEnv: DevEnvironment): void {
        var resultState: State | undefined = undefined;
        for (var i = this.uncompiledCells.length-1; i >= 0; i--) {
            const [header, cell] = this.uncompiledCells[i];
            const compiledCell = header.compileAndMerge(cell, namespace,
                                                 resultState) as HeadedCellComponent;
            resultState = compiledCell.state;
            this.compiledCells = [ compiledCell, ...this.compiledCells];
        }

        if (resultState == undefined) {
            throw new Error("Something went wrong in row compilation; maybe there was nothing in this row?");
        }

        this.state = resultState;
    }

    public addContent(header: Header, cell: CellComponent): void {
        this.uncompiledCells.push([header, cell]);
    }

    
    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        this.compiledCells.map(cell => cell.runChecks(ns, devEnv));
    }
}


class HeadedCellComponent extends CompileableComponent {

    constructor(
        public header: Header,
        public cell: CellComponent
    ) {
        super();
    }

    public get position(): CellPosition {
        return this.cell.position;
    }
    
    public get text(): string {
        return this.cell.text;
    }

    public compile(namespace: Namespace, devEnv: DevEnvironment): CompileableComponent {
        throw new Error("Not implemented; shouldn't be calling this.");
    }

}


class UnaryHeadedCellComponent extends HeadedCellComponent {

    constructor(
        header: Header,
        cell: CellComponent,
        public child: HeadedCellComponent
    ) {
        super(header, cell);
    }

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        this.child.runChecks(ns, devEnv);
    }
}


class BinaryHeadedCellComponent extends HeadedCellComponent {

    constructor(
        header: Header,
        cell: CellComponent,
        public child1: HeadedCellComponent,
        public child2: HeadedCellComponent,
    ) {
        super(header, cell);
    }

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        this.child1.runChecks(ns, devEnv);
        this.child2.runChecks(ns, devEnv);

        if (this.child1 instanceof EmbedComponent || this.child2 instanceof EmbedComponent) {
            devEnv.markError(this.cell.position.sheet, this.cell.position.row, this.cell.position.col,
                "Embed inside slash header",
                "Why are you putting an 'embed' inside a slash header? That's really weird.",
                "warning");
        }
    }
}

class EmbedComponent extends HeadedCellComponent {

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        const symbol = ns.get(this.cell.text);
        if (symbol == undefined) {
            devEnv.markError(this.cell.position.sheet, this.cell.position.row, this.cell.position.col,
                `Cannot find symbol ${this.cell.text}`,
                `Cannot find symbol ${this.cell.text}.`,
                "error");
        }
    }
}

/**
 * Determines whether a line is empty
 * @param row A list of strings, representing the cell text along that row
 * @returns True if the line is empty
 */

function isLineEmpty(row: string[]): boolean {
    if (row.length == 0) {
        return true;
    }

    for (let cellText of row) {
        if (cellText.trim().length != 0) {
            return false;
        }
    }

    return true;
}


/**
 * A SheetParser turns a grid of cells into abstract syntax tree (AST) components, which in
 * turn are interpreted or compiled into a computer language.  This parser is agnostic as to
 * what exactly these components represent or how they'll be handled later, it's just a parser
 * for a particular class of tabular languages.
 */
export class Project {

    public globalNamespace: Namespace = new Namespace();
    public sheets: {[key: string]: SheetComponent} = {};

    constructor(
        public devEnv: DevEnvironment
    ) { }

    public allSymbols(): string[] {
        return this.globalNamespace.allSymbols();
    }

    public getSymbol(symbolName: string): State | undefined {
        return this.globalNamespace.get(symbolName);
    }
    
    public getTapeNames(symbolName: string): [string, string][] {
        const startState = this.globalNamespace.get(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        const results: [string, string][] = [];
        const stack = new CounterStack(2);
        for (const tapeName of startState.getRelevantTapes(stack)) {
            const header = parseHeader(tapeName);
            results.push([tapeName, header.getColor(0.2)]);
        }
        return results;
    }

    public parse(symbolName: string,
            inputs: StringDict,
            maxResults: number = Infinity,
            randomize: boolean = false,
            maxRecursion: number = 4, 
            maxChars: number = 1000): StringDict[] {

        var startState = this.globalNamespace.get(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }

        const inputLiterals: State[] = [];
        for (const tapeName in inputs) {
            const value = inputs[tapeName];
            const inputLiteral = Lit(tapeName, value);
            inputLiterals.push(inputLiteral);
        }

        if (inputLiterals.length > 0) {
            const inputSeq = Seq(...inputLiterals);
            startState = Join(inputSeq, startState); 
        }

        const gen = startState.generate(randomize, maxRecursion, maxChars);
        return iterTake(gen, maxResults);
    }

    public generate(symbolName: string,
            maxResults: number = Infinity,
            randomize: boolean = false,
            maxRecursion: number = 4, 
            maxChars: number = 1000): StringDict[] {
        const startState = this.globalNamespace.get(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
    
        const gen = startState.generate(randomize, maxRecursion, maxChars);
        return iterTake(gen, maxResults);
    }

    
    public addSheetAux(sheetName: string): void {

        if (sheetName in this.sheets) {
            // already loaded it, don't have to do anything
            return;
        }

        if (!this.devEnv.hasSource(sheetName)) {
            // this is an error, but we don't freak out about it here.
            // later on, we'll put errors on any cells for which we can't
            // resolve the reference.
            return;
        }

        const cells = this.devEnv.loadSource(sheetName);

        // parse the cells into an abstract syntax tree
        const sheetComponent = this.parseCells(sheetName, cells);

        // put the raw cells into the sheetComponent, for interfaces
        // that need them (like the sidebar of the GSuite add-on)
        //const 

        // Create a new namespace for this sheet and add it to the 
        // global namespace
        const sheetNamespace = new Namespace();
        this.globalNamespace.addNamespace(sheetName, sheetNamespace);

        // Compile it
        sheetComponent.compile(sheetNamespace, this.devEnv);
        
        // Store it in .sheets
        this.sheets[sheetName] = sheetComponent;

        for (const requiredSheet of this.globalNamespace.requiredNamespaces) {
            this.addSheetAux(requiredSheet);
        }
    }

    public addSheet(sheetName: string): void {
        // add this sheet and any sheets that it refers to
        this.addSheetAux(sheetName);

        // now run checks over the whole project
        for (const sheetName of Object.keys(this.sheets)) {
            const localNamespace = this.globalNamespace.getNamespace(sheetName);
            this.sheets[sheetName].runChecks(localNamespace, this.devEnv);
        }
    }

    public getSheet(sheetName: string): SheetComponent {
        if (!(sheetName in this.sheets)) {
            throw new Error(`Sheet ${sheetName} not found in project`);
        }

        return this.sheets[sheetName];
    }

    public getEnclosureOperators(cells: string[][]): Set<string> {
        const results = new Set(BUILT_IN_OPS);

        /* here is where we might also scan the files for definitions
        of new enclosure operators.  but we don't have the capability for
        custom operators yet. */
        return results;
    }

    public parseCells(sheetName: string, 
                cells: string[][]): SheetComponent {

        const enclosureOps = this.getEnclosureOperators(cells);

        // topEnclosure refers to whatever enclosure is currently on top 
        // of the stack.  Since each enclosure knows what its parent is, we 
        // don't explicitly have to maintain a stack structure, we can just
        // use the .parent property of the current topEnclosure when we need
        // to pop.  We start with the one big enclosure that encompasses the 
        // whole sheet, with startCell (-1,-1)
        var topEnclosure: EnclosureComponent = new SheetComponent(sheetName);

        // Now iterate through the cells, left-to-right top-to-bottom
        for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {

            const cellsInRow = cells[rowIndex];
            if (isLineEmpty(cellsInRow)) {
                continue;
            }

            for (var colIndex = 0; colIndex < cells[rowIndex].length; colIndex++) {
                const cellText = cells[rowIndex][colIndex].trim();
                const position = new CellPosition(sheetName, rowIndex, colIndex);
                const cell = new CellComponent(cellText, position);
                
                while (cellText.length > 0 
                        && colIndex <= topEnclosure.position.col) {
                    // it breaks the previous enclosure; pop that off
                    if (topEnclosure.parent == undefined) {
                        throw new Error("The enclosure stack is empty somehow; " +
                                        "something has gone very wrong.");
                    } 
                    topEnclosure = topEnclosure.parent;
                    topEnclosure.specRow = rowIndex;
                }
            
                if (topEnclosure.specRow > -1 && rowIndex > topEnclosure.specRow) {
                    // we're inside an enclosure, after the header row
                    topEnclosure.addContent(cell, this.devEnv);
                    continue;
                }

                if (cellText.length == 0) {
                    // all of the following steps require there to be some explicit content
                    continue;
                }

                // either we're still in the spec row, or there's no spec row yet
                if (enclosureOps.has(cellText) || position.col == 0) {
                    // it's an operation, which starts a new enclosure
                    this.devEnv.markCommand(sheetName, rowIndex, colIndex,);
                    var newEnclosure;
                    
                    if (position.col == 0) {
                        newEnclosure = new AssignmentComponent(cell, topEnclosure);
                    } else if (cell.text in BINARY_OPS) {
                        newEnclosure = new BinaryOpComponent(cell, topEnclosure);
                    } else if (cell.text == "table") {
                        newEnclosure = new TableComponent(cell, topEnclosure);
                    } else if (cell.text == "test") {
                        newEnclosure = new TestSuiteComponent(cell, topEnclosure);
                    } else if (cell.text == "testnot") {
                        newEnclosure = new TestNotSuiteComponent(cell, topEnclosure);
                    } else {
                        newEnclosure = new EnclosureComponent(cell, topEnclosure);
                    }
                    try {
                        topEnclosure.addChildEnclosure(newEnclosure, this.devEnv);     
                        topEnclosure = newEnclosure;
                    } catch (e) {
                        this.devEnv.markError(sheetName, rowIndex, colIndex,
                            `Unexpected operator: ${cell.text}`, "This looks like an operator, but only a header can follow a header.");
                    }
                    continue;
                } 

                // it's a header
                topEnclosure.addHeader(cell, this.devEnv);
            }
        }

        return topEnclosure.sheet;

    }
}
