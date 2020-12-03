
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees, for later compilation into formulas of a programming language.
 * It's agnostic as to exactly what that programming language is; to adapt
 * it to a particular language, implement Compiler<T> where T is the base class
 * of formulas in that language.
 */

import { DevEnvironment } from "./devEnv";
import { Emb, Empty, Join, Lit, Namespace, Not, Seq, State, SymbolTable, Uni } from "./stateMachine";
import { iterTake, StringDict } from "./util";
import { parseHeader, CellPosition } from "./headerParser";


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

    public getHeader(col: number): CellComponent | undefined {
        return undefined;
    }

    public abstract compile(namespace: Namespace, 
                            devEnv: DevEnvironment): State;

    public abstract compileAssignment(namespace: Namespace, 
                            devEnv: DevEnvironment): State;

}


type BinaryOp = (...children: State[]) => State;
const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": Uni,
    "concat": Seq,
    "join": Join,
}

const BUILT_IN_OPS: Set<string> = new Set(Object.keys(BINARY_OPS))
BUILT_IN_OPS.add("table");

/* There are some reserved words like "maybe" that aren't built in ops, 
but none implemented at the moment */
const RESERVED_WORDS = new Set(BUILT_IN_OPS);


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

    public getHeader(col: number): CellComponent | undefined {
        if (this.child == undefined) {
            return undefined;
        }
        return this.child.getHeader(col);
    }
    
    public addHeader(header: CellComponent): void {
        // can only add a header if there aren't any child enclosures yet.
        // well, we could, but it makes a particular kind of syntax error
        // hard to spot
        if (this.child == undefined) {
            this.child = new TableComponent();
        }
        if (!(this.child instanceof TableComponent)) {
            throw new Error("Closure already has a child; cannot add a header to it.");
        }
        this.child.addHeader(header);
    }
    
    public addContent(cell: CellComponent, devEnv: DevEnvironment): void {
        if (!(this.child instanceof TableComponent)) {
            throw new Error("Trying to add content to a non-table");
        }
        this.child.addContent(cell, devEnv);
    }
    
    public compile(namespace: Namespace, 
        devEnv: DevEnvironment): State {

        if (this.text == "table") { 
            // it's a "table", which is technically a no-op,
            // but this .compileTable() function does some useful
            // error checking.
            return this.compileTable(namespace, devEnv);
        }

        if (this.text in BINARY_OPS) {
            // it's a binary operator like "or" or "join"
            return this.compileBinaryOp(namespace, devEnv);
        }

        /*
        if (this.parent == this.sheet) {
            // it's not any other kind of operator, but it's "top-level"
            // within its sheet, so it's an assignment to a new symbol
            return this.compileAssignment(namespace, errors);
        } */

        devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                        "Unknown operator", `Operator ${this.text} not recognized.`);
        return Empty();
    }

    public compileAssignment(namespace: Namespace, devEnv: DevEnvironment): State {

        // first compile the previous sibling.  note that all siblings
        // of an assignment statement should be an assignment statement, since
        // being an assignment statement is, by definition, having a sheet component
        // as your immediate parent.
        if (this.sibling != undefined) {
            this.sibling.compileAssignment(namespace, devEnv);
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
            return Empty();
        }

        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Missing content", `This looks like an assignment to a symbol ${this.text}, ` +
                "but there's nothing to the right of it.", "warning");
            return Empty();
        }

        const state = this.child.compile(namespace, devEnv);

        if (namespace.hasSymbol(this.text)) {
            // oops, trying to assign to a symbol that already is assigned to!
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Redefining existing symbol", 
                `You've already assigned something to the symbol ${this.text}`);
            // TODO: The error message should say where it's assigned
        }

        namespace.addSymbol(this.text, state);
        return state;
    }

    public compileTable(namespace: Namespace, devEnv: DevEnvironment): State {

        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Missing content",
                "'table' seems to be missing a table; something should be in the cell to the right.", "warning")
            return Empty();
        }
        if (this.sibling != undefined) {
            const throwaway = this.sibling.compile(namespace, devEnv);
            // we don't do anything with the sibling, but we
            // compile it anyway in case there are errors in it the
            // programmer may want to know about
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                "Table overwrite warning",
                `'table' here will obliterate the preceding content at ${this.sibling.position}.`,
                "warning");
        
        }
        return this.child.compile(namespace, devEnv);
    }

    public compileBinaryOp(namespace: Namespace, 
                            devEnv: DevEnvironment): State {

        const op = BINARY_OPS[this.text];
                                    
        if (this.child == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                `Missing argument to '${this.text}'`, 
                `'${this.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
            return Empty();
        }
        if (this.sibling == undefined) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
                `Missing argument to '${this.text}'`,
                `'${this.text}' is missing a first argument; ` +
                "something should be in a cell above this.");
            return Empty();
        }
        const arg1 = this.sibling.compile(namespace, devEnv);
        const arg2 = this.child.compile(namespace, devEnv);
        return op(arg1, arg2);
    }


    public addChildEnclosure(child: EnclosureComponent, 
                            devEnv: DevEnvironment): void {
        if (this.child instanceof TableComponent) {
            throw new Error("Can't add an operator to a line that already has headers.");
        }

        if (this.child != undefined && this.child.position.col != child.position.col) {
            devEnv.markError(this.position.sheet, this.position.row, this.position.col,
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

    public compile(namespace: Namespace, 
        devEnv: DevEnvironment): State {

        if (this.child == undefined) {
            return Empty();
        }

        return this.child.compileAssignment(namespace, devEnv);
    }

    public get sheet(): SheetComponent {
        return this;
    }

}

/**
 * A Table is a rectangular region of the grid consisting of a header row
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

export class TableComponent extends CompileableComponent {

    public compileAssignment(namespace: Namespace, devEnv: DevEnvironment): State {
        // I don't think this error is possible, but just in case
        devEnv.markError(this.position.sheet, this.position.row, this.position.col,
            "Unexpected operator", "This cell needs to be an assignment, " +
            "but it looks like you're trying to start a table.");
        return Empty();
    }

    public headersByCol: {[col: number]: CellComponent} = {}
    public headers: CellComponent[] = [];
    public table: CellComponent[][] = [];

    public get position(): CellPosition {
        if (this.headers.length == 0) {
            return new CellPosition("?",-1,-1);
        }
        return this.headers[0].position;
    }

    public get text(): string {
        if (this.headers.length == 0) {
            return "?";
        }
        return this.headers[0].text;
    }

    public addHeader(header: CellComponent): void {
        this.headersByCol[header.position.col] = header;
    }

    public getHeader(col: number): CellComponent | undefined {
        return this.headersByCol[col];
    }

    public addContent(cell: CellComponent, devEnv: DevEnvironment): void {
        
        // make sure we have a header
        const header = this.getHeader(cell.position.col);
        if (header == undefined) {
            throw new Error(`Table at ${this.position} cannot add ` +
                `content in column ${cell.position.col}`);
        }

        // color the cell appropriately (even if there's no text)
        try {
            const parsedHeader = parseHeader(header.text);
            const contentColor = parsedHeader.getColor(0.1);
            devEnv.markTier(cell.position.sheet, cell.position.row, 
                cell.position.col, contentColor);
        } catch (e) {
            devEnv.markError(cell.position.sheet, cell.position.row, 
                cell.position.col, `Invalid header ${header.text}`,
                "Cannot interpret this cell due to an invalid header above.",
                "warning");
            return;
        }
            
        // the following only applies if there's text in the cell
        if (cell.text.length == 0) {
            return;
        }
    
        // make a table row if we need one
        if (this.table.length == 0 || 
            cell.position.row != this.table[this.table.length-1][0].position.row) {
            this.table.push([]);
        }

        // add the content
        this.table[this.table.length-1].push(cell);
    }
    
    public compileCell(h: CellComponent, 
                        c: CellComponent, 
                        namespace: Namespace, 
                        devEnv: DevEnvironment): State {
        try {
            const header = parseHeader(h.text);
            return header.compile(c.text, h.position, namespace, devEnv);
        } catch (e) {
            devEnv.markError(c.position.sheet, c.position.row, c.position.col,
                "Ignoring cell",
                `Because of an error in the header at ${h.position}, ` +
                "this cell will be ignored.", "warning");
            return Empty();
        }
    }

    public compile(namespace: Namespace, 
                        devEnv: DevEnvironment): State {
        const compiledRows: State[] = [];
        for (const row of this.table) {
            const compiledRow: State[] = [];
            for (const cell of row) {
                const header = this.headersByCol[cell.position.col];
                const compiledCell = this.compileCell(header, cell, namespace, devEnv);
                compiledRow.push(compiledCell);
            }
            compiledRows.push(Seq(...compiledRow));
        }
        return Uni(...compiledRows);
    }

    public toString(): string {
        return `Table(${this.position})`;
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
        for (const tapeName of startState.getTapeNames()) {
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

    
    public addSheet(sheetName: string): void {

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
            this.addSheet(requiredSheet);
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

        // There's one big enclosure that encompasses the whole sheet, with startCell (-1,-1)
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
                    // we're inside an enclosure
                    const header = topEnclosure.getHeader(colIndex);
                    if (header == undefined) {
                        // there's nothing above this cell
                        if (cellText.length == 0) {
                            // if there's also nothing in the cell, we're fine
                            continue;
                        }
                        this.devEnv.markError(sheetName, rowIndex, colIndex,
                            `Wayward cell: ${cell.text}`, `This cell does not have a header above it in column ${colIndex}, ` + 
                            "so we're unable to interpret it.");
                        continue;
                    }
                    topEnclosure.addContent(cell, this.devEnv);
                    continue;
                }

                if (cellText.length == 0) {
                    // all of the following steps require there to be some explicit content
                    continue;
                }

                // either we're still in the spec row, or there's no spec row yet
                if (enclosureOps.has(cellText) || position.col == 0) {
                    // it's the start of a new enclosure
                    this.devEnv.markCommand(sheetName, rowIndex, colIndex,);
                    const newEnclosure = new EnclosureComponent(cell, topEnclosure);
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
                try {
                    topEnclosure.addHeader(cell);
                    const header = parseHeader(cell.text);
                    const color = header.getColor(0.2);
                    this.devEnv.markHeader(sheetName, rowIndex, colIndex, color);
                } catch (e) {
                    //console.log(e);
                    this.devEnv.markError(sheetName, rowIndex, colIndex,
                        `Invalid header: ${cell.text}`, e.toString());
                }
            }
        }

        return topEnclosure.sheet;

    }
}
