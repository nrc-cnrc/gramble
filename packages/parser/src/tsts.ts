
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees -- [AstComponent]s from ast.ts -- which are in turn transformed
 * into the expressions that the parse/generation engine actually operates on.
 */

import { AstComponent, AstNamespace, AstAlternation, AstEpsilon } from "./ast";
import { CellPos, DummyCell } from "./util";
import { BINARY_OPS, DEFAULT_SATURATION, DEFAULT_VALUE, ErrorHeader, Header, parseHeaderCell, ReservedErrorHeader, RESERVED_WORDS } from "./headers";
import { SheetCell } from "./sheets";


export abstract class TstComponent {

    constructor(
        public cell: SheetCell
    ) { }

    public get text(): string {
        return this.cell.text;
    }

    public get pos(): CellPos {
        return this.cell.pos;
    }

    public mark(): void { }

    public markError(shortMsg: string, msg: string): void {
        this.cell.markError("error", shortMsg, msg);
    }

    public markWarning(shortMsg: string, msg: string): void {
        this.cell.markError("warning", shortMsg, msg);
    }
}

export class TstHeader extends TstComponent {

    protected header: Header;

    constructor(
        cell: SheetCell
    ) {
        super(cell);
        this.header = parseHeaderCell(cell.text);

        if (this.header instanceof ReservedErrorHeader) { 
            this.cell.markError("error", `Reserved word in header`, 
                 `This header contains a reserved word in an invalid position`); 
        } else if (this.header instanceof ErrorHeader) {
            this.cell.markError("error", `Invalid header`, 
                `This header cannot be parsed.`); 
        }

    }

    public mark(): void {
        const color = this.getColor(0.1);
        this.cell.markHeader(color);
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return this.header.getColor(saturation, value);
    }

    public headerToAST(left: AstComponent, content: SheetCell): AstComponent {

        const ast = this.header.toAST(left, content.text, content);
        ast.cell = content;
        return ast;
    }

}

export class TstHeadedCell extends TstComponent {

    constructor(
        public prev: TstHeadedCell | undefined,
        public header: TstHeader,
        content: SheetCell
    ) { 
        super(content);
    }

    public mark(): void {
        const color = this.header.getColor(0.1);
        this.cell.markContent(color);
    }

    public toAST(): AstComponent {

        let prevAst: AstComponent = new AstEpsilon(this.cell);

        if (this.prev != undefined) {
            prevAst = this.prev.toAST();
        }
        
        if (this.cell.text.length == 0) {
            return prevAst;
        }

        return this.header.headerToAST(prevAst, this.cell);
    }

}


export class TstComment extends TstComponent {

    public mark(): void {
        this.cell.markComment();
    }

    public toAST(): AstComponent {
        return new AstEpsilon(this.cell);
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
 */
export class TstEnclosure extends TstComponent {

    public specRow: number = -1;
    
    /**
     * The previous sibling of the component (i.e. the component that shares
     * the same parent, but appeared before this component, usually directly
     * above this one).
     */
    public sibling: TstEnclosure | undefined = undefined;

    /**
     * The last-defined child of the component (i.e. of all the components
     * enclosed by this component, the last one.)  As [SheetParser] builds the
     * tree, this value will change; when a new child is added, it's set to the
     * parent's child and the previous child (if any) becomes the new child's
     * sibling.
     */
    public child: TstEnclosure | undefined = undefined;

    constructor(
        cell: SheetCell,
    ) {
        super(cell);
        this.specRow = cell.pos.row;
    }

    public mark(): void {
        this.cell.markCommand();
    }
    
    public toAST(): AstComponent {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.

        let result: AstComponent = new AstEpsilon(this.cell);

        if (this.child != undefined) {
            result = this.child.toAST();
        }

        if (this.sibling != undefined) {
            result = this.sibling.toAST();
        }

        return result;
    }

    public addChild(child: TstEnclosure): TstEnclosure {

        if (this.child != undefined && 
            this.child.pos.col != child.pos.col) {
            child.markWarning("Unexpected operator",
                "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.pos.col}, ` + 
                `so that it's under the operator in cell ${this.child.pos}?`);
        }

        child.sibling = this.child;
        this.child = child;
        return child;
    }

}


export class TstBinaryOp extends TstEnclosure {

    public toAST(): AstComponent {

        const trimmedText = this.text.slice(0, 
                        this.text.length-1).trim();

        const op = BINARY_OPS[trimmedText];
                            
        let childAst: AstComponent = new AstEpsilon(this.cell);
        let siblingAst: AstComponent = new AstEpsilon(this.cell);

        if (this.child == undefined) {
            this.markError(`Missing argument to '${trimmedText}'`, 
                `'${trimmedText}' is missing a second argument; ` +
                "something should be in the cell to the right.");
        } else {
            childAst = this.child.toAST();
        }

        if (this.sibling == undefined) {
            this.markError(`Missing argument to '${trimmedText}'`,
                `'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this.");
        } else {
            siblingAst = this.sibling.toAST();
        }

        return op(this.cell, siblingAst, childAst);
    }
}

export class TstApply extends TstEnclosure {

    

}

export class TstTableOp extends TstEnclosure {

    public toAST(): AstComponent {

        if (this.sibling != undefined) {
            // TODO: Content obliteration warning
            this.sibling.toAST();
        }

        if (this.child == undefined) {
            this.markWarning("Empty table",
                "'table' seems to be missing a table; " + 
                "something should be in the cell to the right.")
            return new AstEpsilon(this.cell);
        }

        return this.child.toAST();
    }
}

abstract class TstAbstractTestSuite extends TstEnclosure {

    protected tests: TstHeadedCell[] = [];

    /**
     * "test" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has an output when filtering the table above.
     * 
     * Test doesn't make any change to the State it returns; adding a "test" below
     * a grammar returns the exact same grammar as otherwise.  
     */
    public toAST(): AstComponent {
        
        if (this.sibling == undefined) {
            this.markError("Wayward test",
                "There should be something above this 'test' command for us to test");
            return new AstEpsilon(this.cell);
        }

        const siblingAst = this.sibling.toAST();

        if (this.child == undefined) {
            this.markWarning("Empty test",
                "'test' seems to be missing something to test; " +
                "something should be in the cell to the right.");
            return siblingAst; // whereas usually we result in the 
                            // empty grammar upon erroring, in this case
                            // we don't want to let a flubbed "test" command 
                            // obliterate the grammar it was meant to test!
        }
        
        if (!(this.child instanceof TstTable)) {
            this.markError("Cannot execute tests",
                "You can't nest another operator to the right of a test block, " + 
                "it has to be a content table.");
            return siblingAst;
        }

        this.tests = this.child.rows;
        return siblingAst;
    }

}

export class TstTestSuite extends TstAbstractTestSuite {

}

export class TstTestNotSuite extends TstAbstractTestSuite {

}


export class TstAssignment extends TstEnclosure {

    public assign(ns: AstNamespace, ast: AstComponent): void {
        
        // determine what symbol you're assigning to
        const trimmedText = this.text.slice(0, this.text.length-1).trim();
        const trimmedTextLower = trimmedText.toLowerCase();

        if (RESERVED_WORDS.has(trimmedTextLower)) {
            // oops, assigning to a reserved word
            this.markError("Assignment to reserved word", 
                "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`);            
        }

        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            this.markWarning("Empty assignment", 
                `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it.");
            return;
        }

        try {
            ns.addSymbol(trimmedText, ast);
        } catch (e) {
            this.markError('Invalid assignment', (e as Error).message);
        }
    }

    public toAST(): AstComponent {

        if (this.child != undefined) {
            return this.child.toAST();
        }

        return new AstEpsilon(this.cell);
    }
}

export class TstSheet extends TstEnclosure {

    constructor(
        public name: string,
        cell: SheetCell
    ) { 
        super(cell);
    }

    public getChildren(): TstEnclosure[] {
        let children: TstEnclosure[] = [];
        let c: TstEnclosure | undefined = this.child;
        while (c != undefined) {
            children = [c, ...children];
            c = c.sibling;
        }
        return children;
    }

    public toAST(): AstComponent {

        const ns = new AstNamespace(this.cell, this.name);

        if (this.child == undefined) {
            return ns;
        }

        let child: TstEnclosure | undefined = undefined;
        let ast: AstComponent | undefined = undefined;
        for (child of this.getChildren()) {
            ast = child.toAST();
            if (child instanceof TstAssignment) {
                child.assign(ns, ast);
            }
        }
        
        // The last child of a sheet is its "default" value; if you refer to 
        // a sheet without naming any particular symbol defined in that sheet, 
        // its value is the value of the last expression on the sheet.  This
        // last expression does not necessarily have to be an assignment, but it 
        // still has to be called *something* in order to be stored in the namespace;
        // we call it "__DEFAULT__".  We never actually call it by that name anywhere, 
        // although you could.
        if (child != undefined && ast != undefined && !(child instanceof TstAssignment)) {
            ns.addSymbol("__DEFAULT__", ast);
        }

        return ns;
    }

}

export class TstProject {

    protected sheets: {[name: string]: TstSheet} = {};

    public addSheet(sheet: TstSheet): void {
        this.sheets[sheet.name] = sheet;
    }

    
    public toAST(): AstComponent {

        const ns = new AstNamespace(new DummyCell(), "");

        for (const [name, sheet] of Object.entries(this.sheets)) {
            const ast = sheet.toAST();
            ns.addSymbol(name, ast);
        }

        return ns;
    }

}

/**
 * A TstTable is a rectangular region of the grid consisting of a header row
 * and cells beneath each header.  For example,
 * 
 *      text, gloss
 *      foo, run
 *      moo, jump
 *      goo, climb
 * 
 * Each header indicates how each cell beneath it should be interpreted; "foo"
 * should be interpret as "text".  Note that these are not necessarily 
 * well-formed database tables; it's not uncommon to get tables where the same
 * header appears multiple times.
 */

export class TstTable extends TstEnclosure {

    /**
     * We need to remember headers by column number,
     * because that's how we know which cells are associated
     * with which headers
     */
    public headersByCol: {[col: number]: TstHeader} = {};

    /**
     * Each row is represented by the last cell in that row
     */
    public rows: TstHeadedCell[] = [];
    
    public addHeader(headerCell: TstHeader): void {        
        this.headersByCol[headerCell.pos.col] = headerCell;
    }

    public addContent(cell: SheetCell): void {
        
        // make sure we have a header
        const headerCell = this.headersByCol[cell.pos.col];
        if (headerCell == undefined) {
            if (cell.text.length != 0) {
                cell.markError("warning", `Ignoring cell: ${cell.text}`,
                    "Cannot associate this cell with any valid header above; ignoring.");
            }
            return;
        }

        if (this.rows.length == 0 || cell.pos.row != this.rows[this.rows.length-1].pos.row) {
            // we need to start an new row, make a new cell with no prev sibling
            const newRow = new TstHeadedCell(undefined, headerCell, cell);
            newRow.mark();
            this.rows.push(newRow);
            return;
        }

        // we're continuing an old row, use the last one as the previous sibling
        const lastRow = this.rows[this.rows.length-1];
        const newRow = new TstHeadedCell(lastRow, headerCell, cell);
        newRow.mark();
        this.rows[this.rows.length-1] = newRow;

    }

    public addChild(newChild: TstEnclosure): TstEnclosure {
        throw new Error("TstTables cannot have children");
    }

    public toAST(): AstComponent {

        if (this.sibling != undefined) {
            this.sibling.toAST();
        }

        var rowStates = this.rows.map(row => row.toAST())
                                 .filter(ast => !(ast instanceof AstEpsilon));
        return new AstAlternation(this.cell, rowStates);
    }

}

