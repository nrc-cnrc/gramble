
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees, for later compilation into formulas of a programming language.
 * It's agnostic as to exactly what that programming language is; to adapt
 * it to a particular language, implement Compiler<T> where T is the base class
 * of formulas in that language.
 */

import { Emb, Empty, Join, Lit, Namespace, Not, Seq, State, SymbolTable, Uni } from "./stateMachine";


/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with 
 * its first cell at -1, -1.
 */
class CellPosition {

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
 * An ErrorAccumulator associates [CellPositions]s with error messages, for
 * later display to the user.
 */
export class ErrorAccumulator {

    protected errors: {[key: string]: [CellPosition, string][]} = {};

    public addError(pos: CellPosition, msg: string) {
        const key = pos.toString();
        if (!(key in this.errors)) {
            this.errors[key] = [];
        }
        this.errors[key].push([pos, msg]);
    }

    public logErrors(): void {
        for (const error of Object.values(this.errors)) {
            for (const [pos, msg] of error) {
                console.log(`${pos}: ${msg}`);
            }
        }
    }

    public getErrors(sheet: string, row: number, col: number): string[] {
        const key = new CellPosition(sheet, row, col).toString();
        const results: string[] = [];
        for (const [pos, msg] of this.errors[key]) {
            results.push(msg);
        }
        return results;
    }

    public get length(): number {
        return Object.keys(this.errors).length;
    }
}


export abstract class TabComponent {

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

export class CellComponent extends TabComponent {

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

export abstract class CompileableComponent extends TabComponent {

    
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
     * 
     * Only EnclosureComponents have children, but it's more convenient
     * to define it here so that certain clients (like unit tests) don't have
     * to deal with the templating aspects.  
     */
    public child: CompileableComponent | undefined = undefined;

    public abstract compile(namespace: Namespace, errors: ErrorAccumulator): State;
}


type BinaryOp = (...children: State[]) => State;
const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": Uni,
    "concat": Seq,
    "join": Join,
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
    
    public addContent(cell: CellComponent): void {
        if (!(this.child instanceof TableComponent)) {
            throw new Error("Trying to add content to a non-table");
        }
        this.child.addContent(cell);
    }
    
    public compile(namespace: Namespace, 
        errors: ErrorAccumulator): State {

        if (this.text == "table") {
            if (this.child == undefined) {
                errors.addError(this.position,
                    "'table' seems to be missing a table; something should be in the cell to the right.")
                return Empty();
            }
            if (this.sibling != undefined) {
                const throwaway = this.sibling.compile(namespace, errors);
                // we don't do anything with the compiled sibling, but we
                // compile it anyway in case there are errors in it the
                // programmer may want to know about
                errors.addError(this.position,
                    `Warning: 'table' here will obliterate the preceding content at ${this.sibling.position}.`);
            
            }
            return this.child.compile(namespace, errors);
        }

        return this.compileBinaryOp(namespace, errors);
    }

    public compileBinaryOp(namespace: Namespace, 
                            errors: ErrorAccumulator): State {

        if (!(this.text in BINARY_OPS)) {
            errors.addError(this.position,
                    `Operator '{opName}' not recognized.`);
            return Empty();
        }
    
        const op = BINARY_OPS[this.text];
                                    
        if (this.child == undefined) {
            errors.addError(this.position, 
                `'${this.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
            return Empty();
        }
        if (this.sibling == undefined) {
            errors.addError(this.position,
                `'${this.text}' is missing a first argument; ` +
                "something should be in a cell above this.");
            return Empty();
        }
        const arg1 = this.sibling.compile(namespace, errors);
        const arg2 = this.child.compile(namespace, errors);
        return op(arg1, arg2);
    }


    public addChildEnclosure(child: EnclosureComponent): void {
        if (this.child instanceof TableComponent) {
            throw new Error("Can't add a new child if the parent already has headers");
        }
        child.sibling = this.child;
        this.child = child;
    }

    public toString(): string {
        return `Enclosure(${this.position})`;
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

    public addContent(cell: CellComponent): void {
        const header = this.headersByCol[cell.position.col];
        if (header == undefined) {
            throw new Error(`Table at ${this.position} cannot add ` +
                `content in column ${cell.position.col}`);
        }

        if (this.table.length == 0 || 
            cell.position.row != this.table[this.table.length-1][0].position.row) {
            this.table.push([]);
        }

        this.table[this.table.length-1].push(cell);
    }

    
    public compileCell(h: CellComponent, 
                        c: CellComponent, 
                        namespace: Namespace, 
                        errors: ErrorAccumulator): State {
        if (h.text == "embed") {
            return Emb(c.text, namespace);
        }
        return Lit(h.text, c.text);
    }

    public compile(namespace: Namespace, 
                        errors: ErrorAccumulator): State {
        const compiledRows: State[] = [];
        for (const row of this.table) {
            const compiledRow: State[] = [];
            for (const cell of row) {
                const header = this.headersByCol[cell.position.col];
                const compiledCell = this.compileCell(header, cell, namespace, errors);
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
 * A SheetParser turns a grid of cells into abstract syntax tree (AST) components, which in
 * turn are interpreted or compiled into a computer language.  This parser is agnostic as to
 * what exactly these components represent or how they'll be handled later, it's just a parser
 * for a particular class of tabular languages.
 */
export class SheetParser {

    constructor(
        public builtInOperators: string[] = []
    ) { }

    public compile(sheetName: string, 
                    cells: string[][], 
                    errors: ErrorAccumulator): State {

        const sheetComponent = this.parseCells(sheetName, cells, errors);
        //return compiler.compileSheet(sheetComponent, errors);
        return Empty();
    }


    public parseString(sheetName: string,
                text: string,
                errors: ErrorAccumulator): EnclosureComponent {

        const cells = cellSplit(text);
        return this.parseCells(sheetName, cells, errors);
    }

    public getEnclosureOperators(cells: string[][]): Set<string> {
        const results = new Set(this.builtInOperators);
        for (const row of cells) {
            if (row.length == 0) {
                continue;
            }
            results.add(row[0]);
        }
        return results;
    }

    public parseCells(sheetName: string, 
                cells: string[][],
                errors: ErrorAccumulator): EnclosureComponent {

        const enclosureOps = this.getEnclosureOperators(cells);

        // There's one big enclosure that encompasses the whole sheet, with startCell (-1,-1)
        const startCell = new CellComponent(sheetName, new CellPosition(sheetName));
        var topEnclosure = new EnclosureComponent(startCell);
        //const resultStack: EnclosureComponent[] = [sheetEnclosure];

        // Now iterate through the cells, left-to-right top-to-bottom
        for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {
            for (var colIndex = 0; colIndex < cells[rowIndex].length; colIndex++) {
                const cellText = cells[rowIndex][colIndex].trim();

                if (cellText.length == 0) {
                    continue;
                }

                const position = new CellPosition(sheetName, rowIndex, colIndex);
                //var topEnclosure = resultStack[resultStack.length-1];

                const cell = new CellComponent(cellText, position);

                while (colIndex <= topEnclosure.position.col) {
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
                    try {
                        topEnclosure.addContent(cell);
                    } catch (e) {
                        errors.addError(position, 
                            "This cell does not have a header above it, so we're unable to interpret it.");
                    }
                    continue;
                }

                // either we're still in the spec row, or there's no spec row yet
                if (enclosureOps.has(cellText)) {
                    // it's the start of a new enclosure
                    const newEnclosure = new EnclosureComponent(cell, topEnclosure);
                    try {
                        topEnclosure.addChildEnclosure(newEnclosure);     
                        topEnclosure = newEnclosure;
                    } catch (e) {
                        errors.addError(position,
                            "This looks like an operator, but only a header can follow a header.");
                    }
                    continue;
                } 

                // it's a header
                try {
                    topEnclosure.addHeader(cell);
                } catch (e) {
                    //console.log(e);
                    errors.addError(position, 
                        `Cannot add a header to ${topEnclosure}; ` + 
                        "you need an operator like 'or', 'apply', etc.");
                }
            }
        }

        while (topEnclosure.parent != undefined) {
            topEnclosure = topEnclosure.parent;
        }
        return topEnclosure;

    }
}


export function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}
