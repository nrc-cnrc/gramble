
/**
 * This file describes the parser that turns spreadsheets into abstract
 * syntax trees -- [AstComponent]s from ast.ts -- which are in turn transformed
 * into the expressions that the parse/generation engine actually operates on.
 */

import { Uni, AstComponent, Epsilon, Ns, AstNamespace } from "./ast";
import { CellPos, DevEnvironment, TstError } from "./util";
import { BINARY_OPS, DEFAULT_SATURATION, DEFAULT_VALUE, ErrorHeader, Header, parseHeaderCell, RESERVED_WORDS } from "./headers";


export abstract class TstComponent {

    constructor(
        public pos: CellPos
    ) { }

    public mark(devEnv: DevEnvironment): void { }

    public markError(devEnv: DevEnvironment, shortMsg: string, msg: string): void {
        devEnv.markError(this.pos.sheet, this.pos.row, this.pos.col,
            shortMsg, msg, "error");
    }

    public markWarning(devEnv: DevEnvironment, shortMsg: string, msg: string): void {
        devEnv.markError(this.pos.sheet, this.pos.row, this.pos.col,
        shortMsg, msg, "warning");
    }

    public markInfo(devEnv: DevEnvironment, shortMsg: string, msg: string): void {
        devEnv.markError(this.pos.sheet, this.pos.row, this.pos.col,
        shortMsg, msg, "info");
    }
}

class TstCell extends TstComponent {

    constructor(
        public text: string,
        pos: CellPos
    ) {
        super(pos);
    }
    
}

class TstHeader extends TstCell {

    protected header: Header;

    constructor(
        text: string,
        pos: CellPos
    ) {
        super(text, pos);
        this.header = parseHeaderCell(text);
    }
    
    public mark(devEnv: DevEnvironment): void {
        const color = this.header.getColor(0.1);
        devEnv.markHeader(this.pos.sheet, this.pos.row, this.pos.col, color);
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return this.header.getColor(saturation, value);
    }

    public sanityCheck(devEnv: DevEnvironment): void { 
        for (const e of this.header.sanityCheck()) {
            if (e.severity == "error") {
                this.markError(devEnv, e.shortMsg, e.longMsg);
            } else {
                this.markWarning(devEnv, e.shortMsg, e.longMsg);
            }
        }
    }

    public headerToAST(left: AstComponent, text: string, pos: CellPos, devEnv: DevEnvironment): AstComponent {

        if (this.header instanceof ErrorHeader) {
            devEnv.markError(pos.sheet, pos.row, pos.col, 
                `Missing/invalid header`, 
                `Cannot associate this cell with a valid header above`, "warning"); 
        }

        return this.header.toAST(left, text, pos, devEnv);
    }

}


/**
 * A TstGrammar is a component of our tabular syntax tree
 * that is associated with a grammar -- that is, an [AstComponent]
 * of our abstract syntax tree, which in turn is associated with an
 * [Expr] of our semantics.
 */
export abstract class TstGrammar extends TstComponent {

    public abstract get text(): string;

    /**
     * The previous sibling of the component (i.e. the component that shares
     * the same parent, but appeared before this component, usually directly
     * above this one).
     * 
     * Only EnclosureComponents have siblings, but it's more convenient
     * to define it here so that certain clients (like unit tests) don't have
     * to deal with the templating aspects.  
     */
    public sibling: TstGrammar | undefined = undefined;

    /**
     * The last-defined child of the component (i.e. of all the components
     * enclosed by this component, the last one.)  As [SheetParser] builds the
     * tree, this value will change; when a new child is added, it's set to the
     * parent's child and the previous child (if any) becomes the new child's
     * sibling.
     */
    public child: TstGrammar | undefined = undefined;

    public toAST(devEnv: DevEnvironment): AstComponent { 
        return Epsilon();
    }

    public sanityCheck(devEnv: DevEnvironment): void {
        if (this.sibling != undefined) {
            this.sibling.sanityCheck(devEnv);
        }
        if (this.child != undefined) {
            this.child.sanityCheck(devEnv);
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
 */
class TstEnclosure extends TstGrammar {

    public specRow: number = -1;

    public parent: TstEnclosure | undefined = undefined;

    constructor(
        public startCell: TstCell,
    ) {
        super(startCell.pos);
        this.specRow = startCell.pos.row;
    }

    public get text(): string {
        return this.startCell.text;
    }

    /** 
     * Every enclosure has a "break" column number.  When cell text occurs in this
     * column, or to the left of it, the enclosure is considered complete, we can 
     * no longer add to it, and we pop it off the stack.  For most types of enclosures, 
     * this is the column in which the operator (e.g. "table:") occurs.
     */
    public get breakColumn(): number {
        return this.pos.col;
    }

    /**
     * Is this enclosure broken (i.e., considered complete and popped off the stack?)
     * by the given cell?
     */
    public isBrokenBy(cell: TstCell): boolean {
        if (cell.text == "") {
            return false;  // empty cells never break you
        }
        if (cell.pos.row <= this.pos.row) {
            return false; // only cells below you can break you
        }
        if (cell.pos.col > this.breakColumn) {
            return false; // this cell is within your enclosure
        }
        return true;
    }

    public mark(devEnv: DevEnvironment): void {
        devEnv.markCommand(this.pos.sheet, this.pos.row, this.pos.col);
    }
    
    public toAST(devEnv: DevEnvironment): AstComponent {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.

        let result: AstComponent = Epsilon();

        if (this.child != undefined) {
            result = this.child.toAST(devEnv);
        }

        if (this.sibling != undefined) {
            result = this.sibling.toAST(devEnv);
        }

        return result;
    }

    public addChild(child: TstEnclosure, 
                    devEnv: DevEnvironment): TstEnclosure {

        if (this.child instanceof TstTable) {
            throw new Error("Can't add an operator to a line that already has headers." +
                    "I'm not sure how you even did this.");
        }

        if (this.child != undefined && this.child.pos.col != child.pos.col) {
            child.markWarning(devEnv, "Unexpected operator",
                "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.pos.col}, ` + 
                `so that it's under the operator in cell ${this.child.pos}?`);
        }

        child.parent = this;
        child.sibling = this.child;
        this.child = child;
        return child;
    }

    public get sheet(): TstSheet {
        if (this.parent == undefined) {
            throw new Error("Stack empty; something has gone very wrong");
        }
        return this.parent.sheet;
    }
}


class TstBinaryOp extends TstEnclosure {

    public toAST(devEnv: DevEnvironment): AstComponent {

        const trimmedText = this.text.slice(0, 
                        this.text.length-1).trim();

        const op = BINARY_OPS[trimmedText];
                            
        let childAst: AstComponent = Epsilon();
        let siblingAst: AstComponent = Epsilon();

        if (this.child == undefined) {
            this.markError(devEnv,  `Missing argument to '${trimmedText}'`, 
                `'${trimmedText}' is missing a second argument; ` +
                "something should be in the cell to the right.");
        } else {
            childAst = this.child.toAST(devEnv);
        }

        if (this.sibling == undefined) {
            this.markError(devEnv, `Missing argument to '${trimmedText}'`,
                `'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this.");
        } else {
            siblingAst = this.sibling.toAST(devEnv);
        }

        return op(siblingAst, childAst);
    }
}

class TstApply extends TstEnclosure {

    

}

class TstTableOp extends TstEnclosure {

    public toAST(devEnv: DevEnvironment): AstComponent {

        if (this.sibling != undefined) {
            // TODO: Content obliteration warning
            this.sibling.toAST(devEnv);
        }

        if (this.child == undefined) {
            this.markWarning(devEnv, "Empty table",
                "'table' seems to be missing a table; " + 
                "something should be in the cell to the right.")
            return Epsilon();
        }

        return this.child.toAST(devEnv);
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
    public toAST(devEnv: DevEnvironment): AstComponent {
        
        if (this.sibling == undefined) {
            this.markError(devEnv, "Wayward test",
                "There should be something above this 'test' command for us to test");
            return Epsilon();
        }

        const siblingAst = this.sibling.toAST(devEnv);

        if (this.child == undefined) {
            this.markWarning(devEnv, 
                "Empty test",
                "'test' seems to be missing something to test; " +
                "something should be in the cell to the right.");
            return siblingAst; // whereas usually we result in the 
                            // empty grammar upon erroring, in this case
                            // we don't want to let a flubbed "test" command 
                            // obliterate the grammar it was meant to test!
        }
        
        if (!(this.child instanceof TstTable)) {
            this.markError(devEnv, "Cannot execute tests",
                "You can't nest another operator to the right of a test block, " + 
                "it has to be a content table.");
            return siblingAst;
        }

        //const childAst = this.child.toAST(devEnv);
        this.tests = this.child.rows;
        return siblingAst;
    }

}

class TstTestSuite extends TstAbstractTestSuite {

    public sanityCheck(devEnv: DevEnvironment): void {
        super.sanityCheck(devEnv);

        /*
        for (const test of this.tests) {
            // the appropriate operation here is the filter of my state
            // by the test's state
            if (!this.ast.runUnitTest(test.ast)) {
                test.markError(devEnv, `Test failed: ${test.text}`,
                    "Test failed: This row cannot be generated by the grammar above.");
            }
            
            test.markInfo(devEnv, `Test succeeded: ${test.text}`,
                    "Test succeeded: This row can be generated by the grammar above.");
        }
        */
    }
}

class TstTestNotSuite extends TstAbstractTestSuite {
    
    public sanityCheck(devEnv: DevEnvironment): void {
        super.sanityCheck(devEnv);

        /*
        for (const test of this.tests) {
            // the appropriate operation here is the filter of my state
            // by the test's state
            if (this.ast.runUnitTest(test.ast)) {
                // opposite of TestSuiteComponent: mark an error if the test succeeds
                test.markError(devEnv, `Test failed: ${test.text}`,
                    "Test failed: This row can be generated by the grammar above.");
                continue;
            } 

            test.markInfo(devEnv, `Test succeeded: ${test.text}`,
                    "Test succeeded: This row cannot be generated by the grammar above.");
        }
        */
    }
}


class TstAssignment extends TstEnclosure {

    public assign(ns: AstNamespace, ast: AstComponent, devEnv: DevEnvironment): void {
        
        // determine what symbol you're assigning to
        const trimmedText = this.text.slice(0, this.text.length-1).trim();
        const trimmedTextLower = trimmedText.toLowerCase();

        if (RESERVED_WORDS.has(trimmedTextLower)) {
            // oops, assigning to a reserved word
            this.markError(devEnv, "Assignment to reserved word", 
                "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`);            
        }

        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            this.markWarning(devEnv, "Empty assignment", 
                `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it.");
            return;
        }

        try {
            ns.addSymbol(trimmedText, ast);
        } catch (e) {
            this.markError(devEnv, 'Invalid assignment', (e as Error).message);
        }
    }

    public toAST(devEnv: DevEnvironment): AstComponent {

        if (this.child != undefined) {
            return this.child.toAST(devEnv);
        }

        return Epsilon();
    }
}

/**
 * A [TstSheet] is basically a [TstEnclosure] without 
 * a parent component; a sheet is always the outermost component of
 * any component tree.
 */
export class TstSheet extends TstEnclosure {

    constructor(
        public name: string
    ) { 
        super(new TstCell(name, new CellPos(name, 0, -1)));
    }

    public getChildren(): TstGrammar[] {
        let children: TstGrammar[] = [];
        let c: TstGrammar | undefined = this.child;
        while (c != undefined) {
            children = [c, ...children];
            c = c.sibling;
        }
        return children;
    }

    public toAST(devEnv: DevEnvironment): AstComponent {

        const ns = Ns(this.name);

        if (this.child == undefined) {
            return ns;
        }

        let ast: AstComponent | undefined = undefined;
        for (const c of this.getChildren()) {
            ast = c.toAST(devEnv);
            if (c instanceof TstAssignment) {
                c.assign(ns, ast, devEnv);
            }
        }
        
        // We automatically assign the last child enclosure to the symbol
        // __MAIN__.  (Unless __MAIN__ has already been defined; programmers
        // are allowed to define what __MAIN__ is for any particular file.)
        if (ns.getSymbol("__MAIN__") == undefined && ast != undefined) {
            ns.addSymbol("__MAIN__", ast);
        }
        return ns;
    }

    public get sheet(): TstSheet {
        return this;
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
 * should be interpret as "text", whatever that happens to mean in the programming
 * language in question.  Note that these are not necessarily well-formed database
 * tables; it's noy uncommon to get tables where the same
 * header appears multiple times.
 */

class TstTable extends TstEnclosure {

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

    public get breakColumn(): number {
        return this.pos.col - 1;
    }
    
    public canAddContent(cell: TstCell): boolean {
        return cell.pos.col >= this.pos.col && 
               cell.pos.row > this.specRow;
    }    

    public addHeader(headerCell: TstHeader): void {        
        this.headersByCol[headerCell.pos.col] = headerCell;
    }

    public addContent(cell: TstCell, devEnv: DevEnvironment): void {
        
        // make sure we have a header
        const headerCell = this.headersByCol[cell.pos.col];
        if (headerCell == undefined) {
            if (cell.text.length != 0) {
                cell.markWarning(devEnv, `Ignoring cell: ${cell.text}`,
                    "Cannot associate this cell with any valid header above; ignoring.");
            }
            return;
        }

        if (this.rows.length == 0 || cell.pos.row != this.rows[this.rows.length-1].pos.row) {
            // we need to start an new row, make a new cell with no prev sibling
            const newRow = new TstHeadedCell(undefined, headerCell, cell);
            newRow.mark(devEnv);
            this.rows.push(newRow);
            return;
        }

        // we're continuing an old row, use the last one as the previous sibling
        const lastRow = this.rows[this.rows.length-1];
        const newRow = new TstHeadedCell(lastRow, headerCell, cell);
        newRow.mark(devEnv);
        this.rows[this.rows.length-1] = newRow;

    }

    public addChild(newChild: TstEnclosure, 
                    devEnv: DevEnvironment): TstEnclosure {
        
        newChild.markError(devEnv, "Wayward operator",
                        "Cannot add an operator here; I'm not even sure how you did this.");
        // still add it as your child, so you can run checks on it and such
        newChild.parent = this;
        newChild.sibling = this.child;
        this.child = newChild;
        return newChild;
    }

    public toAST(devEnv: DevEnvironment): AstComponent {

        if (this.sibling != undefined) {
            this.sibling.toAST(devEnv);
        }

        var rowStates = this.rows.map(row => row.toAST(devEnv))
                                 .filter(state => !(state instanceof Epsilon));
        return Uni(...rowStates);
    }

    public sanityCheck(devEnv: DevEnvironment): void {
        Object.values(this.headersByCol).map(header => header.sanityCheck(devEnv));
        this.rows.map(row => row.sanityCheck(devEnv));
    }
}


class TstHeadedCell extends TstGrammar {

    constructor(
        public prev: TstHeadedCell | undefined,
        public header: TstHeader,
        public content: TstCell
    ) { 
        super(content.pos);
    }

    public get text(): string {
        return this.content.text;
    }

    public mark(devEnv: DevEnvironment): void {
        const color = this.header.getColor(0.1);
        devEnv.markContent(this.pos.sheet, this.pos.row, this.pos.col, color);
    }

    public toAST(devEnv: DevEnvironment): AstComponent {

        let prevAst: AstComponent = Epsilon();

        if (this.prev != undefined) {
            prevAst = this.prev.toAST(devEnv);
        }
        
        if (this.content.text.length == 0) {
            return prevAst;
        }

        return this.header.headerToAST(prevAst, this.text, this.pos, devEnv);
    }

}

class TstComment extends TstGrammar {

    constructor(
        public cell: TstCell
    ) {
        super(cell.pos);
    }

    public get text(): string {
        return this.cell.text;
    }

    public mark(devEnv: DevEnvironment): void {
        devEnv.markComment(this.pos.sheet, this.pos.row, this.pos.col);
    }

    public toAST(devEnv: DevEnvironment): AstComponent {
        return Epsilon();
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


function constructOp(cell: TstCell, 
                     devEnv: DevEnvironment): TstEnclosure {
    
    var newEnclosure;

    if (!cell.text.endsWith(":")) {
        throw new Error("Tried to construct an op that didn't end with ':'");
    }
    
    const trimmedText = cell.text.slice(0, cell.text.length-1).trim();
    const trimmedTextLower = trimmedText.toLowerCase();
    if (trimmedTextLower in BINARY_OPS) {
        newEnclosure = new TstBinaryOp(cell);
    } else if (trimmedTextLower == "table") {
        newEnclosure = new TstTableOp(cell);
    } else if (trimmedTextLower == "test") {
        newEnclosure = new TstTestSuite(cell);
    } else if (trimmedTextLower == "testnot") {
        newEnclosure = new TstTestNotSuite(cell);
    } else if (cell.pos.col == 0) {
        // if it's none of these special operators, it's an assignment,
        // but note that assignments can only occur in column 0.  if an 
        // unknown word appears elsewhere in the tree, it's an error.
        newEnclosure = new TstAssignment(cell);
    } else {
        // this is an error, flag it for the programmer.  EnclosureComponent
        // defines some useful default behavior in case of this kind of error,
        // like making sure that the child and/or sibling are compiled and 
        // checked for errors.
        newEnclosure = new TstEnclosure(cell);
        cell.markError(devEnv, "Unknown operator", `Operator ${trimmedText} not recognized.`);
    }
    newEnclosure.mark(devEnv);
    return newEnclosure;
}

export function parseCells(
    sheetName: string, 
    cells: string[][],
    devEnv: DevEnvironment,
): TstSheet {

    // topEnclosure refers to whatever enclosure is currently on top 
    // of the stack.  Since each enclosure knows what its parent is, we 
    // don't explicitly have to maintain a stack structure, we can just
    // use the .parent property of the current topEnclosure when we need
    // to pop.  We start with the one big enclosure that encompasses the 
    // whole sheet, with startCell (-1,-1)
    var topEnclosure: TstEnclosure = new TstSheet(sheetName);

    // Now iterate through the cells, left-to-right top-to-bottom
    for (var rowIndex = 0; rowIndex < cells.length; rowIndex++) {

        const row = cells[rowIndex];
        if (isLineEmpty(row)) {
            continue;
        }

        const rowIsComment = row[0].trim().startsWith('%%');
        
        for (var colIndex = 0; colIndex < row.length; colIndex++) {

            const cellText = row[colIndex].trim();
            const position = new CellPos(sheetName, rowIndex, colIndex);
            const cell = new TstCell(cellText, position);
            
            if (rowIsComment) {
                const comment = new TstComment(cell);
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
        
            if (topEnclosure instanceof TstTable && topEnclosure.canAddContent(cell)) {
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
                //const header = parseHeaderCell(cell.text);
                // create a cell for it
                const headerCell = new TstHeader(cell.text, cell.pos);
                // color it properly in the interface
                headerCell.mark(devEnv); 
                
                if (!(topEnclosure instanceof TstTable)) {
                    const newEnclosure = new TstTable(headerCell);
                    topEnclosure = topEnclosure.addChild(newEnclosure, devEnv);
                }
                (topEnclosure as TstTable).addHeader(headerCell);
            } catch(e) {
                cell.markError(devEnv, `Invalid header: ${cell.text}`,
                    (e as Error).message);
            }
        }
    }

    return topEnclosure.sheet;
}