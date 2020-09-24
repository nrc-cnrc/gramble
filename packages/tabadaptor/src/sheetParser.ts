
class CellPosition {

    constructor(
        public sheet: string,
        public row: number = -1,
        public col: number = -1
    ) { }

    public toString() {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
}


export abstract class TabComponent {
    public abstract get position(): CellPosition;
}

class CellComponent extends TabComponent {

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

/**
 * An enclosure represents a single-cell unit containing a command or identifier (call that the "startCell"),
 * and a rectangular region describing further details (like the parameters of the command,
 * or what is to be assigned to the identifier).  Enclosures can be nested, and often are.
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
 */
class EnclosureComponent<T> extends TabComponent {

    public prevSibling: TabComponent | undefined = undefined;
    public lastChild: TabComponent | undefined = undefined;
    public specRow: number = -1;

    constructor(
        public startCell: CellComponent,
        public parent: EnclosureComponent<T> | undefined = undefined
    ) {
        super();
        this.specRow = startCell.position.row;
    }

    public get position(): CellPosition { 
        return this.startCell.position; 
    }

    
    public addHeader(header: CellComponent): void {
        // can only add a header if there aren't any child enclosures yet.
        // well, we could, but it makes a particular kind of syntax error
        // hard to spot
        if (this.lastChild == undefined) {
            console.log(`Creating a table for ${this}`);
            this.lastChild = new TableComponent();
        }
        if (!(this.lastChild instanceof TableComponent)) {
            throw new Error("Closure already has a child; cannot add a header to it.");
        }
        this.lastChild.addHeader(header);
    }
    
    public addContent(cell: CellComponent): void {
        if (!(this.lastChild instanceof TableComponent)) {
            throw new Error("Trying to add content to a non-table");
        }
        this.lastChild.addContent(cell);
    }

    public compile(compiler: Compiler<T>): T {
        return compiler.compileEnclosure(this);
    }

    public addChildEnclosure(child: EnclosureComponent<T>): void {
        child.prevSibling = this.lastChild;
        this.lastChild = child;
    }

    public toString(): string {
        return `Enclosure(${this.position})`;
    }
    
}

class TableComponent<T> extends TabComponent {


    public headersByCol: {[col: number]: CellComponent} = {}
    public headers: CellComponent[] = [];
    public table: CellComponent[][] = [];

    public get position(): CellPosition {
        if (this.headers.length == 0) {
            return new CellPosition("?",-1,-1);
        }
        return this.headers[0].position;
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

    public compile(compiler: Compiler<T>): T {

        const compiledRows: T[] = [];
        for (const row of this.table) {
            const compiledCells: T[] = [];
            for (const cell of row) {
                const header = this.headersByCol[cell.position.col];
                compiledCells.push(compiler.compileContent(header, cell));
            }
            compiledRows.push(compiler.compileRow(compiledCells));
        }
        return compiler.compileTable(compiledRows);
    }


    public toString(): string {
        return `Table(${this.position})`;
    }

}

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
        for (const [pos, msg] of Object.values(this.errors)) {
            console.log(`${pos}: ${msg}`);
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

/**
 * A SheetParser turns a grid of cells into abstract syntax tree (AST) components, which in
 * turn are interpreted or compiled into a computer language.  This parser is agnostic as to
 * what exactly these components represent or how they'll be handled later, it's just a parser
 * for a particular class of tabular languages.
 */
export class SheetParser<T> {

    constructor(
        reservedWords: string[] = []
    ) { }

    public compile(compiler: Compiler<T>, 
                    sheetName: string, 
                    cells: string[][], 
                    errors: ErrorAccumulator): T {

        const sheetComponent = this.parseCells(sheetName, cells, errors);
        return compiler.compileSheet(sheetComponent);
    }

    public parseString(sheetName: string,
                text: string,
                errors: ErrorAccumulator): EnclosureComponent<T> {

        const cells = cellSplit(text);
        return this.parseCells(sheetName, cells, errors);
    }

    public parseCells(sheetName: string, 
                cells: string[][],
                errors: ErrorAccumulator): EnclosureComponent<T> {

        // There's one big enclosure that encompasses the whole sheet, with startCell (-1,-1)
        const startCell = new CellComponent(sheetName, new CellPosition(sheetName));
        var topEnclosure = new EnclosureComponent<T>(startCell);
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
                if (cellText.endsWith(":")) {
                    // it's the start of a new enclosure
                    const newEnclosure = new EnclosureComponent(cell, topEnclosure);
                    try {
                        topEnclosure.addChildEnclosure(newEnclosure);
                    } catch (e) {
                        errors.addError(position,
                            "This looks like an operator, but only a header can follow a header.");
                    }
                    topEnclosure = newEnclosure;
                    continue;
                } 

                // it's a header
                try {
                    topEnclosure.addHeader(cell);
                } catch (e) {
                    console.log(e);
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

export abstract class Compiler<T> {
    public abstract compileContent(h: CellComponent, c: CellComponent): T;
    public abstract compileRow(row: T[]): T;
    public abstract compileTable(col: T[]): T;
    public abstract compileEnclosure(enc: EnclosureComponent<T>): T;
    public abstract compileSheet(sheet: EnclosureComponent<T>): T;
}

export function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}
