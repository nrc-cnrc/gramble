
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees, for later compilation into formulas of a programming language.
 * It's agnostic as to exactly what that programming language is; to adapt
 * it to a particular language, implement Compiler<T> where T is the base class
 * of formulas in that language.
 */

import { assert } from "chai";
import { CPAlternation, CPUnreserved, CPNegation, CPResult, parseBooleanCell } from "./cellParser";
import { miniParse, MPAlternation, MPComment, MPDelay, MPParser, MPSequence, MPUnreserved } from "./miniParser";
import { CounterStack, Uni, State, Lit, Emb, Seq, Epsilon, Namespace, Maybe, Not, Join, Filter, BrzEpsilon, LiteralState, Rename, RenameState, Hide, Rep, Any, Reveal, BrzConcat } from "./stateMachine";
import { CellPosition, DevEnvironment, DUMMY_POSITION, HSVtoRGB, RGBtoString, TabularComponent } from "./util";

const DEFAULT_SATURATION = 0.1;
const DEFAULT_VALUE = 1.0;

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
 * * compiling the cells beneath them into States, and merging them (usually by
 *   concatenation) with cells to their right.
 * 
 * * knowing what colors the foreground and background of the header cell should be 
 */
export abstract class Header extends TabularComponent {

    constructor(
        text: string,
    ) { 
        super(text, DUMMY_POSITION);
    }

    public abstract get hue(): number;
    
    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string { 
        return RGBtoString(...HSVtoRGB(this.hue, saturation, value));
    }

    public mark(devEnv: DevEnvironment): void {
        const color = this.getColor(0.1);
        devEnv.markHeader(this.position.sheet, this.position.row, this.position.col, color);
    }
    
    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        throw new Error('Not implemented');
    }

    public merge(leftNeighbor: State | undefined, state: State): State {
        if (leftNeighbor == undefined) {
            return state;
        }
        return Seq(leftNeighbor, state);
    }

    public compileAndMerge(cell: CellComponent,
                            namespace: Namespace,
                            devEnv: DevEnvironment,
                            leftNeighbor: State | undefined): SingleCellComponent {
        
        const compiledCell = this.compile(cell, namespace, devEnv);
        compiledCell.state = this.merge(leftNeighbor, compiledCell.state);
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
}

/**
 * EmbedHeaders lead to the complilation of EmbedStates.
 */
export class EmbedHeader extends AtomicHeader {

    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        const compiledCell = new EmbedComponent(this, cell);
        compiledCell.state = Emb(cell.text, namespace);
        return compiledCell;
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

    public compileAndMerge(cell: CellComponent,
            namespace: Namespace,
            devEnv: DevEnvironment,
            leftNeighbor: State | undefined): SingleCellComponent {

        const compiledCell = new HeadedCellComponent(this, cell);
        
        if (leftNeighbor == undefined) {
            compiledCell.markError(devEnv, "Wayward hide",
                '"hide" has to have something to the left of it.');
            return compiledCell;
        }
        compiledCell.state = leftNeighbor;
        for (const tape of cell.text.split("/")) {
            compiledCell.state = Hide(compiledCell.state, tape.trim());
        }
        return compiledCell;
    }
}


/**
 * RevealHeader is the opposite of HideHeader: any tape T named in "reveal:T"
 * is left alone, and all other tapes are hidden.  
 */
 export class RevealHeader extends AtomicHeader {

    public compileAndMerge(cell: CellComponent,
            namespace: Namespace,
            devEnv: DevEnvironment,
            leftNeighbor: State | undefined): SingleCellComponent {

        const compiledCell = new HeadedCellComponent(this, cell);
        
        if (leftNeighbor == undefined) {
            compiledCell.markError(devEnv, "Wayward reveal",
                '"reveal" has to have something to the left of it.');
            return compiledCell;
        }
        const tapes = cell.text.split("/").map(t => t.trim());
        compiledCell.state = Reveal(leftNeighbor, tapes);
        return compiledCell;
    }
}

/**
 * LiteralHeaders are references to a particular tape name (e.g. "text")
 */
export class LiteralHeader extends AtomicHeader {
    
    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        const compiledCell = new HeadedCellComponent(this, cell);
        compiledCell.state = Lit(this.text, cell.text);
        return compiledCell;
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

    public mark(devEnv: DevEnvironment): void {
        devEnv.markComment(this.position.sheet, this.position.row, this.position.col);
    }

    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        return new CommentComponent(cell);
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

    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = childCell.state;
        return compiledCell;
    }
}

/**
 * Header that constructs optional parsers, e.g. "maybe text"
 */
export class MaybeHeader extends UnaryHeader {

    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = Maybe(childCell.state);
        return compiledCell;
    }
}


/**
 * Header that constructs negations, e.g. "not text"
 */
class NotHeader extends UnaryHeader {

    public compile(cell: CellComponent, 
        namespace: Namespace, 
        devEnv: DevEnvironment): SingleCellComponent {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
        compiledCell.state = Not(childCell.state);
        return compiledCell;
    }
}


/**
 * Header that constructs negations, e.g. "not text"
 */
class RenameHeader extends UnaryHeader {

    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        const childCell = this.child.compile(cell, namespace, devEnv);
        const compiledCell = new RenameComponent(this, cell, childCell);
        compiledCell.state = childCell.state;
        return compiledCell;
    }

    public merge(leftNeighbor: State | undefined, state: State): State {
        if (leftNeighbor == undefined) {
            return state;
        }
        if (!(state instanceof LiteralState)) {
            throw new Error("Rename (>) of a non-literal");
        }
        return Rename(leftNeighbor, state.text, state.tapeName);
    }
}

/**
 * A JoinHeader handles headers like "@x"; it joins x:X with whatever
 * follows rather than concatenating it.
 * 
 * Note that JoinHeader binds more tightly than other unary operators,
 * e.g. while "maybe" in "maybe text/gloss" has "text/gloss" as its child,
 * "@" in "@text/gloss" only has "@" as its child.
 * 
 * JoinHeader are also the ancestor of all Headers that
 * allow and parse boolean-algebra expressions in their fields (e.g. "~(A|B)").
 */
export class JoinHeader extends UnaryHeader {

    public merge(leftNeighbor: State | undefined, state: State): State {
        if (leftNeighbor == undefined) {
            return state;
        }
        return Join(leftNeighbor, state);
    }

    public compileLiteral(
        parsedText: CPUnreserved,
        cell: CellComponent,
        namespace: Namespace,
        devEnv: DevEnvironment
    ): SingleCellComponent {
        const newCell = new CellComponent(parsedText.text, cell.position);
        const childCell = this.child.compile(newCell, namespace, devEnv);
        return childCell;
    }

    public compilePiece(
        parsedText: CPResult,
        cell: CellComponent, 
        namespace: Namespace, 
        devEnv: DevEnvironment
    ): SingleCellComponent {

        if (parsedText instanceof CPUnreserved) {
            const newCell = new CellComponent(parsedText.text, cell.position);
            const childCell = this.child.compile(newCell, namespace, devEnv);
            return this.compileLiteral(parsedText, cell, namespace, devEnv);
        }

        if (parsedText instanceof CPNegation) {
            const childCell = this.compilePiece(parsedText.child, cell, namespace, devEnv);
            const compiledCell = new UnaryHeadedCellComponent(this, cell, childCell);
            compiledCell.state = Not(childCell.state);
            return compiledCell;
        }

        if (parsedText instanceof CPAlternation) {
            const child1Cell = this.compilePiece(parsedText.child1, cell, namespace, devEnv);
            const child2Cell = this.compilePiece(parsedText.child2, cell, namespace, devEnv);
            const compiledCell = new NAryHeadedCellComponent(this, cell, [child1Cell, child2Cell]);
            compiledCell.state = Uni(child1Cell.state, child2Cell.state);
            return compiledCell;
        }

        throw new Error(`Error constructing boolean expression in cell ${cell.position}`);
    }
    
    public compile(cell: CellComponent, 
        namespace: Namespace, 
        devEnv: DevEnvironment): SingleCellComponent {

        if (cell.text.length == 0) {
            return super.compile(cell, namespace, devEnv);
        }

        const parsedText = parseBooleanCell(cell.text);
        const compiledCell = this.compilePiece(parsedText, cell, namespace, devEnv);
        return compiledCell;
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
export class EqualsHeader extends JoinHeader {
    
    public merge(
        leftNeighbor: State | undefined, 
        state: State
    ): State {
        if (leftNeighbor == undefined) {
            throw new Error("'equals/startswith/endswith/contains' requires content to its left.");
        }

        if (leftNeighbor instanceof BrzConcat) {
            // if your left neighbor is a concat state we have to do something a little special,
            // because startswith only scopes over the cell immediately to the left.  (if you let
            // it be a join with EVERYTHING to the left, you end up catching prefixes that you're
            // specifying in the same row, rather than the embedded thing you're trying to catch.)
            return Seq(leftNeighbor.child1, Filter(leftNeighbor.child2, state));
        }

        return Filter(leftNeighbor, state);
    }
}

abstract class PartialEqualsHeader extends EqualsHeader {

    public abstract formSequence(state: State, tapeName: string): State;

    public compileLiteral(
        parsedText: CPUnreserved,
        cell: CellComponent,
        namespace: Namespace,
        devEnv: DevEnvironment
    ): SingleCellComponent {
        const newCell = new CellComponent(parsedText.text, cell.position);
        const result = this.child.compile(newCell, namespace, devEnv);

        const symbolStack = new CounterStack(4);
        const relevantTapes = result.state.getRelevantTapes(symbolStack);
        for (const tape of relevantTapes) {
            result.state = this.formSequence(result.state, tape);
        }
        return result;
    }
}

/**
 * StartsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * start with X (that is, Filter(N, X.*))
 */
export class StartsWithHeader extends PartialEqualsHeader {

    public formSequence(state: State, tapeName: string): State {
        const anychars = Rep(Any(tapeName));
        return Seq(state, anychars);
    }
}

/**
 * EndsWithHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * end with X (that is, Filter(N, .*X))
 */
export class EndsWithHeader extends PartialEqualsHeader {
    
    public formSequence(state: State, tapeName: string): State {
        const anychars = Rep(Any(tapeName));
        return Seq(anychars, state);
    }
}

/**
 * ContainsHeader is a special kind of EqualsHeader that only requires its predecessor (call it N) to 
 * contain X (that is, Filter(N, .*X.*))
 */
export class ContainsHeader extends PartialEqualsHeader {
    
    public formSequence(state: State, tapeName: string): State {
        const anychars = Rep(Any(tapeName));
        return Seq(anychars, state, anychars);
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

    /**
     * This isn't ordinarily called, usually compileAndMerge handles compilation
     * of SlashHeader.  But
     * when another header has a SlashHeader child, like "@(x/y)", this would
     * be called.
     */
    
    public compile(cell: CellComponent, 
                    namespace: Namespace, 
                    devEnv: DevEnvironment): SingleCellComponent {
        const childCell1 = this.child1.compile(cell, namespace, devEnv);
        const childCell2 = this.child2.compile(cell, namespace, devEnv);
        const compiledCell = new BinaryHeadedCellComponent(this, cell, childCell1, childCell2);
        compiledCell.state = Seq(childCell1.state, childCell2.state);
        return compiledCell;
    }

    public compileAndMerge(cell: CellComponent,
                            namespace: Namespace,
                            devEnv: DevEnvironment,
                            leftNeighbor: State | undefined): SingleCellComponent {
        
        const childCell1 = this.child1.compileAndMerge(cell, namespace, devEnv, leftNeighbor);
        const childCell2 = this.child2.compileAndMerge(cell, namespace, devEnv, childCell1.state);
        const compiledCell = new BinaryHeadedCellComponent(this, cell, childCell1, childCell2);
        compiledCell.state = childCell2.state;
        return compiledCell;
    }
}

/**
 * What follows is a grammar and parser for the mini-language inside headers, e.g.
 * "text", "text/gloss", "startswith text", etc.
 * 
 * It uses the mini-parser library in miniParser.ts to construct a recursive-descent
 * parser for the grammar.
 */

const SYMBOL = [ "(", ")", "%", "/", '@', ">", ":" ];
const RESERVED_HEADERS = ["embed", "maybe", "not", "hide", "reveal", "equals", "startswith", "endswith", "contains" ];

type BinaryOp = (...children: State[]) => State;
const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": Uni,
    "concat": Seq,
    "join": Join,
}

const RESERVED_OPS: string[] = [ ...Object.keys(BINARY_OPS), "table", "test", "testnot" ];

const RESERVED_WORDS = new Set([...SYMBOL, ...RESERVED_HEADERS, ...RESERVED_OPS]);

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
    MPAlternation(HP_UNRESERVED, HP_EMBED, HP_HIDE, HP_REVEAL, HP_JOIN, HP_PARENS)
);

const HP_COMMENT = MPComment<Header>(
    '%',
    (s) => new CommentHeader(s)
);

const HP_UNRESERVED = MPUnreserved<Header>(
    RESERVED_WORDS, 
    (s) => new LiteralHeader(s)
);

const HP_EMBED = MPSequence<Header>(
    ["embed"],
    () => new EmbedHeader("embed")
);

const HP_HIDE = MPSequence<Header>(
    ["hide"],
    () => new HideHeader("hide")
);

const HP_REVEAL = MPSequence<Header>(
    ["reveal"],
    () => new RevealHeader("reveal")
);

const HP_JOIN = MPSequence<Header>(
    ["@", HP_SUBEXPR],
    (child) => new JoinHeader("@", child)
);

const HP_MAYBE = MPSequence<Header>(
    ["maybe", HP_NON_COMMENT_EXPR],
    (child) => new MaybeHeader("maybe", child)
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

export function parseHeaderCell(text: string, pos: CellPosition = DUMMY_POSITION): Header {
    const result = miniParse(tokenize, HP_EXPR, text);
    result.position = pos;
    return result;
}



class CellComponent extends TabularComponent {

    constructor(
        text: string,
        position: CellPosition
    ) {
        super(text, position);
    }

    public toString(): string {
        return `${this.text}:${this.position}`;
    }

}

/**
 * A GrammarComponent is a component of our tabular syntax tree
 * that is associated with a grammar -- that is, a [State] of the
 * state machine.  
 * 
 * At construction, GrammarComponents do not have any specific state
 * yet, they're all associated with [TrivialState]s until they compile()
 * is called on them, at which point their state is calculated.  (This is
 * because GrammarComponents are constructed as soon as their first cell is,
 * but the grammar they represent typically depends on cells to the right
 * and below them.)
 */
export abstract class GrammarComponent extends TabularComponent {

    public state: State = Epsilon();

    /**
     * The previous sibling of the component (i.e. the component that shares
     * the same parent, but appeared before this component, usually directly
     * above this one).
     * 
     * Only EnclosureComponents have siblings, but it's more convenient
     * to define it here so that certain clients (like unit tests) don't have
     * to deal with the templating aspects.  
     */
    public sibling: GrammarComponent | undefined = undefined;

    /**
     * The last-defined child of the component (i.e. of all the components
     * enclosed by this component, the last one.)  As [SheetParser] builds the
     * tree, this value will change; when a new child is added, it's set to the
     * parent's child and the previous child (if any) becomes the new child's
     * sibling.
     */
    public child: GrammarComponent | undefined = undefined;

    public compile(namespace: Namespace, devEnv: DevEnvironment): void { }

    public runChecks(namespace: Namespace, devEnv: DevEnvironment): void {
        if (this.sibling != undefined) {
            this.sibling.runChecks(namespace, devEnv);
        }
        if (this.child != undefined) {
            this.child.runChecks(namespace, devEnv);
        }
    }
}



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
class EnclosureComponent extends GrammarComponent {

    public specRow: number = -1;

    public parent: EnclosureComponent | undefined = undefined;

    constructor(
        public startCell: CellComponent,
    ) {
        super(startCell.text, startCell.position);
        this.specRow = startCell.position.row;
    }

    /** 
     * Every enclosure has a "break" column number.  When cell text occurs in this
     * column, or to the left of it, the enclosure is considered complete, we can 
     * no longer add to it, and we pop it off the stack.  For most types of enclosures, 
     * this is the column in which the operator (e.g. "table:") occurs.
     */
    public get breakColumn(): number {
        return this.position.col;
    }

    /**
     * Is this enclosure broken (i.e., considered complete and popped off the stack?)
     * by the given cell?
     */
    public isBrokenBy(cell: CellComponent): boolean {
        if (cell.text == "") {
            return false;  // empty cells never break you
        }
        if (cell.position.row <= this.position.row) {
            return false; // only cells below you can break you
        }
        if (cell.position.col > this.breakColumn) {
            return false; // this cell is within your enclosure
        }
        return true;
    }

    public mark(devEnv: DevEnvironment): void {
        devEnv.markCommand(this.position.sheet, this.position.row, this.position.col);
    }
    
    public compile(namespace: Namespace, 
        devEnv: DevEnvironment): void {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.

        if (this.child != undefined) {
            this.child.compile(namespace, devEnv);
            this.state = this.child.state;
        }

        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
            this.state = this.sibling.state;
        }
    }

    public addChild(child: EnclosureComponent, 
                    devEnv: DevEnvironment): EnclosureComponent {

        if (this.child instanceof ContentsComponent) {
            throw new Error("Can't add an operator to a line that already has headers." +
                    "I'm not sure how you even did this.");
        }

        if (this.child != undefined && this.child.position.col != child.position.col) {
            child.markWarning(devEnv, "Unexpected operator",
                "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.position.col}, ` + 
                `so that it's under the operator in cell ${this.child.position}?`);
        }

        child.parent = this;
        child.sibling = this.child;
        this.child = child;
        return child;
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

    public compile(namespace: Namespace, devEnv: DevEnvironment): void {

        // first compile the previous sibling.
        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
        }

        // determine what symbol you're assigning to
        const trimmedText = this.text.slice(0, this.text.length-1).trim();
        const trimmedTextLower = trimmedText.toLowerCase();

        if (RESERVED_WORDS.has(trimmedTextLower)) {
            // oops, assigning to a reserved word
            this.markError(devEnv, "Assignment to reserved word", 
                "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`);
            if (this.child != undefined) {
                // compile the child just in case there are useful errors to display
                this.child.compile(namespace, devEnv);
            }
            return;
        }

        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            this.markWarning(devEnv, "Empty assignment", 
                `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it.");
            return;
        }

        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
        
        if (namespace.hasSymbol(trimmedText)) {
            // oops, trying to assign to a symbol that already is assigned to!
            this.markError(devEnv, "Redefining existing symbol", 
                `You've already assigned something to the symbol ${trimmedText}`);
            return;
        }

        namespace.addSymbol(trimmedText, this.state);
    }

}

class BinaryOpComponent extends EnclosureComponent {

    public compile(namespace: Namespace, 
                            devEnv: DevEnvironment): void {

        const trimmedText = this.text.slice(0, this.text.length-1).trim();

        const op = BINARY_OPS[trimmedText];
                                    
        if (this.child == undefined) {
            this.markError(devEnv,  `Missing argument to '${trimmedText}'`, 
                `'${this.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
            return;
        }

        if (this.sibling == undefined) {
            this.markError(devEnv, `Missing argument to '${trimmedText}'`,
                `'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this.");
            return;
        }

        this.sibling.compile(namespace, devEnv);
        this.child.compile(namespace, devEnv);
        this.state = op(this.sibling.state, this.child.state);
    }
}

class ApplyComponent extends EnclosureComponent {



}

class TableComponent extends EnclosureComponent {


    public compile(namespace: Namespace, devEnv: DevEnvironment): void {

        if (this.child == undefined) {
            this.markWarning(devEnv, "Empty table",
                "'table' seems to be missing a table; " + 
                "something should be in the cell to the right.")
            return;
        }

        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
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
     * has an output when filtering the table above.
     * 
     * Test doesn't make any change to the State it returns; adding a "test" below
     * a grammar returns the exact same grammar as otherwise.  
     */
    public compile(namespace: Namespace, devEnv: DevEnvironment): void {
        
        if (this.sibling == undefined) {
            this.markError(devEnv, "Wayward test",
                "There should be something above this 'test' command for us to test");
            return;
        }

        const sibling = this.sibling.compile(namespace, devEnv);

        if (this.child == undefined) {
            this.markWarning(devEnv, 
                "Empty test",
                "'test' seems to be missing something to test; " +
                "something should be in the cell to the right.");
            this.state = this.sibling.state;
            return; // whereas usually we result in the empty grammar upon erroring, in this case
                        // we don't want to let a flubbed "test" command obliterate the grammar
                        // it was meant to test!
        }
        
        if (!(this.child instanceof ContentsComponent)) {
            this.markError(devEnv, "Cannot execute tests",
                "You can't nest another operator to the right of a test block, " + 
                "it has to be a content table.");
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
            // the appropriate operation here is the filter of my state
            // by the test's state
            if (!this.state.runUnitTest(test.state)) {
                test.markError(devEnv, `Test failed: ${test.text}`,
                    "Test failed: This row cannot be generated by the grammar above.");
            }
            
            test.markInfo(devEnv, `Test succeeded: ${test.text}`,
                    "Test succeeded: This row can be generated by the grammar above.");
        }
    }
}

class TestNotSuiteComponent extends AbstractTestSuiteComponent {

    protected tests: RowComponent[] = [];
    
    public runChecks(namespace: Namespace, devEnv: DevEnvironment): void {
        super.runChecks(namespace, devEnv);

        for (const test of this.tests) {
            // the appropriate operation here is the filter of my state
            // by the test's state
            if (this.state.runUnitTest(test.state)) {
                // opposite of TestSuiteComponent: mark an error if the test succeeds
                test.markError(devEnv, `Test failed: ${test.text}`,
                    "Test failed: This row can be generated by the grammar above.");
                continue;
            } 

            test.markInfo(devEnv, `Test succeeded: ${test.text}`,
                    "Test succeeded: This row cannot be generated by the grammar above.");
        }
    }
}

/**
 * A [SheetComponent] is basically an EnclosureComponent without 
 * a parent component; a sheet is always the outermost component of
 * any component tree.
 */
export class SheetComponent extends EnclosureComponent {

    constructor(
        public name: string
    ) { 
        super(new CellComponent(name, new CellPosition(name, 0, -1)));
    }
    
    /*
    public addHeader(header: CellComponent): void {
        throw new Error("This appears to be a header, but what is it a header for?");
    } */

    public compile(namespace: Namespace, devEnv: DevEnvironment): void {

        if (this.child == undefined) {
            return;
        }

        this.child.compile(namespace, devEnv);
        this.state = this.child.state;
        
        // We automatically assign the last child enclosure to the symbol
        // __MAIN__, which will serve as the default State when this sheet
        // is referred to without an overt symbol name.  (That is to say, if
        // you have a sheet named "MySheet", you could refer to symbols on it like
        // "MySheet.VERB", but you can also refer to "MySheet", which will give you
        // the last defined symbol whatever it is.)  This lets us have "no boilerplace"
        // sheets, letting us incorporate many non-Gramble CSVs as
        // databases without having to add Gramble-style assignment syntax.

        if (namespace.hasSymbol("__MAIN__")) {
            // It's not forbidden for programmers to assign to __MAIN__.  If they 
            // already have defined __MAIN__, respect that and don't
            // reassign it.
            return;
        }

        namespace.addSymbol("__MAIN__", this.state);
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

class ContentsComponent extends EnclosureComponent {

    public headersByCol: {[col: number]: Header} = {};
    public rows: RowComponent[] = [];

    public get breakColumn(): number {
        return this.position.col - 1;
    }
    
    public canAddContent(cell: CellComponent): boolean {
        return cell.position.col >= this.position.col && 
               cell.position.row > this.specRow;
    }    

    public addHeader(header: Header, devEnv: DevEnvironment): void {        
        // remember it by its column number, because that's how content
        // cells will be asking for it.
        this.headersByCol[header.position.col] = header;
    }

    public addContent(cell: CellComponent, devEnv: DevEnvironment): void {
        
        // make sure we have a header
        const header = this.headersByCol[cell.position.col];
        if (header == undefined) {
            if (cell.text.length != 0) {
                cell.markWarning(devEnv, `Ignoring cell: ${cell.text}`,
                    "Cannot associate this cell with any valid header above; ignoring.");
            }
            return;
        }

        // make a table row if we need one
        if (this.rows.length == 0 || 
            cell.position.row != this.rows[this.rows.length-1].position.row) {
            const newRow = new RowComponent(cell.text, cell.position);
            this.rows.push(newRow);
        }

        // add the content
        const lastRow = this.rows[this.rows.length-1];
        lastRow.addContent(header, cell);

    }

    public addChild(child: EnclosureComponent, 
                    devEnv: DevEnvironment): EnclosureComponent {
        
        child.markError(devEnv, "Wayward operator",
                        "Cannot add an operator here; I'm not even sure how you did this.");
        // still add it as your child, so you can run checks on it and such
        child.parent = this;
        child.sibling = this.child;
        this.child = child;
        return child;
    }

    public compile(namespace: Namespace, 
                        devEnv: DevEnvironment): void {

        if (this.sibling != undefined) {
            this.sibling.compile(namespace, devEnv);
        }

        this.rows.map(row => row.compile(namespace, devEnv));
        var rowStates = this.rows.map(row => row.state);
        rowStates = rowStates.filter(state => !(state instanceof BrzEpsilon));
        this.state = Uni(...rowStates);
    }

    
    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        this.rows.map(row => row.runChecks(ns, devEnv));
    }

    public toString(): string {
        return `Table(${this.position})`;
    }

}


class RowComponent extends GrammarComponent {

    protected uncompiledCells: [Header, CellComponent][] = [];
    protected compiledCells: SingleCellComponent[] = [];
    
    public compile(namespace: Namespace, devEnv: DevEnvironment): void {
        var resultState: State | undefined = undefined;
        //for (var i = this.uncompiledCells.length-1; i >= 0; i--) {
        for (const [header, cell] of this.uncompiledCells) {
            //const [header, cell] = this.uncompiledCells[i];
            try {
                const compiledCell = header.compileAndMerge(cell, namespace, devEnv, resultState);
                compiledCell.mark(devEnv);
                // if it was zero, ignore the result of the merge   
                if (cell.text.length > 0 && !(compiledCell.state instanceof BrzEpsilon)) {
                    resultState = compiledCell.state;
                } 
                this.compiledCells = [ compiledCell, ...this.compiledCells];
            } catch (e) {
                cell.markError(devEnv, "Cell error", `${e}`);
            }
        }

        if (resultState == undefined) {
            // everything was comments or empty
            resultState = Epsilon();
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

abstract class SingleCellComponent extends GrammarComponent {

    constructor(
        public cell: CellComponent
    ) {
        super(cell.text, cell.position);
    }
}

class HeadedCellComponent extends SingleCellComponent {

    constructor(
        public header: Header,
        cell: CellComponent
    ) {
        super(cell);
    }

    public mark(devEnv: DevEnvironment): void {
        const color = this.header.getColor(0.1);
        devEnv.markContent(this.position.sheet, this.position.row, this.position.col, color);
    }

    public compile(namespace: Namespace, devEnv: DevEnvironment): void {
        throw new Error("Not implemented; shouldn't be calling this.");
    }
}

class CommentComponent extends SingleCellComponent {

    public mark(devEnv: DevEnvironment): void {
        devEnv.markComment(this.position.sheet, this.position.row, this.position.col);
    }

    public compile(namespace: Namespace, devEnv: DevEnvironment): void {}
}

class UnaryHeadedCellComponent extends HeadedCellComponent {

    constructor(
        header: Header,
        cell: CellComponent,
        public child: SingleCellComponent
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
        public child1: SingleCellComponent,
        public child2: SingleCellComponent,
    ) {
        super(header, cell);
    }

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        this.child1.runChecks(ns, devEnv);
        this.child2.runChecks(ns, devEnv);

        if (this.child1 instanceof EmbedComponent || this.child2 instanceof EmbedComponent) {
            this.cell.markWarning(devEnv, "Embed inside slash header",
                "Why are you putting an 'embed' inside a slash header? That's weird.");
        }
    }
}

class NAryHeadedCellComponent extends HeadedCellComponent {

    constructor(
        header: Header,
        cell: CellComponent,
        public children: SingleCellComponent[]
    ) {
        super(header, cell);
    }

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        for (const child of this.children) {
            child.runChecks(ns, devEnv);
        }
    }

}

class EmbedComponent extends HeadedCellComponent {

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        if (this.text.length == 0) {
            return;
        }
        const symbol = ns.getSymbol(this.cell.text);
        if (symbol == undefined) {
            this.cell.markError(devEnv, `Cannot find symbol ${this.cell.text}`,
                `Cannot find symbol ${this.cell.text}.`);
        }
    }
}

class RenameComponent extends HeadedCellComponent {

    constructor(
        header: RenameHeader,
        cell: CellComponent,
        public child: SingleCellComponent
    ) {
        super(header, cell);
    }

    public runChecks(ns: Namespace, devEnv: DevEnvironment): void {
        if (!(this.state instanceof RenameState)) {
            return;
        }

        if (this.state.fromTape == "") {
            return;
        }

        const symbolStack = new CounterStack(2);
        const childTapes = this.state.child.getRelevantTapes(symbolStack);
        if (!(childTapes.has(this.state.fromTape))) {
            this.markError(devEnv, `Inaccessible tape: ${this.state.fromTape}`,
                `This cell refers to a tape ${this.state.fromTape},` +
                ` but the content to its left only defines tape(s) ${[...childTapes].join(", ")}.`);
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


function constructOp(cell: CellComponent, 
                     devEnv: DevEnvironment): EnclosureComponent {
    
    var newEnclosure;
    assert(cell.text.endsWith(":"), "Tried to construct an op that didn't end with ':'");
    
    const trimmedText = cell.text.slice(0, cell.text.length-1).trim();
    const trimmedTextLower = trimmedText.toLowerCase();
    if (trimmedTextLower in BINARY_OPS) {
        newEnclosure = new BinaryOpComponent(cell);
    } else if (trimmedTextLower == "table") {
        newEnclosure = new TableComponent(cell);
    } else if (trimmedTextLower == "test") {
        newEnclosure = new TestSuiteComponent(cell);
    } else if (trimmedTextLower == "testnot") {
        newEnclosure = new TestNotSuiteComponent(cell);
    } else if (cell.position.col == 0) {
        // if it's none of these special operators, it's an assignment,
        // but note that assignments can only occur in column 0.  if an 
        // unknown word appears elsewhere in the tree, it's an error.
        newEnclosure = new AssignmentComponent(cell);
    } else {
        // this is an error, flag it for the programmer.  EnclosureComponent
        // defines some useful default behavior in case of this kind of error,
        // like making sure that the child and/or sibling are compiled and 
        // checked for errors.
        newEnclosure = new EnclosureComponent(cell);
        cell.markError(devEnv, "Unknown operator", `Operator ${trimmedText} not recognized.`);
    }
    newEnclosure.mark(devEnv);
    return newEnclosure;
}


export function parseCells(
    sheetName: string, 
    cells: string[][],
    devEnv: DevEnvironment,
): SheetComponent {

    // topEnclosure refers to whatever enclosure is currently on top 
    // of the stack.  Since each enclosure knows what its parent is, we 
    // don't explicitly have to maintain a stack structure, we can just
    // use the .parent property of the current topEnclosure when we need
    // to pop.  We start with the one big enclosure that encompasses the 
    // whole sheet, with startCell (-1,-1)
    var topEnclosure: EnclosureComponent = new SheetComponent(sheetName);

    // Now iterate through the cells, left-to-right top-to-bottom
    for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {

        const row = cells[rowIndex];
        if (isLineEmpty(row)) {
            continue;
        }

        const rowIsComment = row[0].trim().startsWith('%%');
        
        for (var colIndex = 0; colIndex < row.length; colIndex++) {

            const cellText = row[colIndex].trim();
            const position = new CellPosition(sheetName, rowIndex, colIndex);
            const cell = new CellComponent(cellText, position);
            
            if (rowIsComment) {
                const comment = new CommentComponent(cell);
                comment.mark(devEnv);
                continue;
            }

            while (topEnclosure.isBrokenBy(cell)) {
                // it breaks the previous enclosure; pop that off
                if (topEnclosure.parent == undefined) {
                    throw new Error("The enclosure stack is empty somehow; " +
                                    "something has gone very wrong.");
                } 
                topEnclosure = topEnclosure.parent;
                topEnclosure.specRow = rowIndex;
            }
        
            if (topEnclosure instanceof ContentsComponent && topEnclosure.canAddContent(cell)) {
                // we're inside an enclosure, after the header row
                topEnclosure.addContent(cell, devEnv);
                continue;
            }

            if (cellText.length == 0) {
                // all of the following steps require there to be some explicit content
                continue;
            }

            // either we're still in the spec row, or there's no spec row yet
            if (cellText.endsWith(":")) {
                // it's an operation, which starts a new enclosure
                const newEnclosure = constructOp(cell, devEnv);
                try {
                    topEnclosure = topEnclosure.addChild(newEnclosure, devEnv);
                } catch (e) {
                    cell.markError(devEnv, `Unexpected operator: ${cell.text}`, 
                        "This looks like an operator, but only a header can follow a header.");
                }
                continue;
            } 

            // it's a header
            try {
                // parse the header into a Header object
                const header = parseHeaderCell(cell.text, cell.position);
                // color it properly in the interface
                header.mark(devEnv); 
                
                if (!(topEnclosure instanceof ContentsComponent)) {
                    const newEnclosure = new ContentsComponent(header);
                    topEnclosure = topEnclosure.addChild(newEnclosure, devEnv);
                }
                (topEnclosure as ContentsComponent).addHeader(header, devEnv);
            } catch(e) {
                cell.markError(devEnv, `Invalid header: ${cell.text}`,
                    `Attempted to parse "${cell.text}" as a header, but could not.`);
            }
        }
    }

    return topEnclosure.sheet;
}