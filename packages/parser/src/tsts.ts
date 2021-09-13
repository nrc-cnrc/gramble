
/**
 * TSTS -- "tabular syntax trees" -- represent the structure of the program
 * in terms of the high-level tabular syntax: the structures, operators, headers,
 * content, etc. that the programmer is laying out on the grid.  (As opposed to the
 * more abstract grammar that they're representing thereby.)  
 * 
 * 
 * - which are in turn transformed
 * into the expressions that the parse/generation engine actually operates on.
 */

import { GrammarComponent, NamespaceGrammar, AlternationGrammar, EpsilonGrammar, UnitTestGrammar, NegativeUnitTestGrammar, UnaryGrammar, NullGrammar, GenOptions } from "./grammars";
import { CellPos, DummyCell, Gen, StringDict } from "./util";
import { BINARY_OPS, DEFAULT_SATURATION, DEFAULT_VALUE, ErrorHeader, Header, parseHeaderCell, ReservedErrorHeader, RESERVED_WORDS } from "./headers";
import { SheetCell } from "./sheets";

export abstract class TstComponent {

    public *generate(
        symbolName: string = "",
        query: StringDict = {},
        random: boolean = false,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {
        
        const opt: GenOptions = {
            multichar: true,
            random: false,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }
        yield* this.toGrammar().generate(symbolName, query, opt);

    }

    public abstract toGrammar(): GrammarComponent;

}

export abstract class TstCellComponent extends TstComponent {

    constructor(
        public cell: SheetCell
    ) { 
        super();
    }

    public get text(): string {
        return this.cell.text;
    }

    public get pos(): CellPos {
        return this.cell.pos;
    }

    public message(msg: any): void {
        this.cell.message(msg);
    }
    
    public toGrammar(): GrammarComponent {
        return new EpsilonGrammar(this.cell);
    }

}

export class TstHeader extends TstCellComponent {

    protected header: Header;

    constructor(
        cell: SheetCell
    ) {
        super(cell);
        this.header = parseHeaderCell(cell.text);

        if (this.header instanceof ReservedErrorHeader) { 
            this.cell.message({
                type: "error", 
                shortMsg: `Reserved word in header`, 
                longMsg: `This header contains a reserved word in an invalid position`
            });
        } else if (this.header instanceof ErrorHeader) {
            this.cell.message({
                type: "error",
                shortMsg: "Invalid header",
                longMsg: `This header cannot be parsed.`
            });
        }
    }

    public getColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return this.header.getColor(saturation, value);
    }

    public headerToGrammar(left: GrammarComponent, content: SheetCell): GrammarComponent {
        const grammar = this.header.toGrammar(left, content.text, content);
        grammar.cell = content;
        return grammar;
    }

}

export class TstHeadedCell extends TstCellComponent {

    constructor(
        public prev: TstHeadedCell | undefined,
        public header: TstHeader,
        content: SheetCell
    ) { 
        super(content);
    }

    public toGrammar(): GrammarComponent {

        let prevGrammar: GrammarComponent = new EpsilonGrammar(this.cell);

        if (this.prev != undefined) {
            prevGrammar = this.prev.toGrammar();
        }
        
        if (this.cell.text.length == 0) {
            return prevGrammar;
        }

        return this.header.headerToGrammar(prevGrammar, this.cell);
    }

}


export class TstComment extends TstCellComponent {

    public toGrammar(): GrammarComponent {
        return new EpsilonGrammar(this.cell);
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
export class TstEnclosure extends TstCellComponent {

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
    
    public toGrammar(): GrammarComponent {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.

        let result: GrammarComponent = new EpsilonGrammar(this.cell);

        if (this.child != undefined) {
            result = this.child.toGrammar();
        }

        if (this.sibling != undefined) {
            result = this.sibling.toGrammar();
        }

        return result;
    }

    public addChild(child: TstEnclosure): TstEnclosure {

        if (this.child != undefined && 
            this.child.pos.col != child.pos.col) {
            child.message({
                type: "warning",
                shortMsg: "Unexpected operator",
                longMsg: "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.pos.col}, ` + 
                `so that it's under the operator in cell ${this.child.pos}?`
            });
        }

        child.sibling = this.child;
        this.child = child;
        return child;
    }

}


export class TstBinaryOp extends TstEnclosure {

    public toGrammar(): GrammarComponent {

        const trimmedText = this.text.slice(0, 
                        this.text.length-1).trim();

        const op = BINARY_OPS[trimmedText];
                            
        let childGrammar: GrammarComponent = new EpsilonGrammar(this.cell);
        let siblingGrammar: GrammarComponent = new EpsilonGrammar(this.cell);

        if (this.child == undefined) {
            this.message({
                type: "error",
                shortMsg: `Missing argument to '${trimmedText}'`, 
                longMsg: `'${trimmedText}' is missing a second argument; ` +
                "something should be in the cell to the right."
            });
        } else {
            childGrammar = this.child.toGrammar();
        }

        if (this.sibling == undefined) {
            this.message({
                type: "error",
                shortMsg: `Missing argument to '${trimmedText}'`,
                longMsg:`'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this."
            });
        } else {
            siblingGrammar = this.sibling.toGrammar();
        }

        return op(this.cell, siblingGrammar, childGrammar);
    }
}

export class TstApply extends TstEnclosure {

    

}

export class TstTableOp extends TstEnclosure {

    public toGrammar(): GrammarComponent {

        if (this.sibling != undefined) {
            // TODO: Content obliteration warning
            this.sibling.toGrammar();
        }

        if (this.child == undefined) {
            this.message({
                type: "warning",
                shortMsg: "Empty table",
                longMsg: "'table' seems to be missing a table; " + 
                "something should be in the cell to the right."
            });
            return new EpsilonGrammar(this.cell);
        }

        return this.child.toGrammar();
    }
}

export class TstUnitTest extends TstEnclosure {

    /**
     * "test" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has an output when filtering the table above.
     */
    public toGrammar(): GrammarComponent {
        
        if (this.sibling == undefined) {
            this.message({
                type: "warning",
                shortMsg: "Wayward test",
                longMsg: "There should be something above this 'test' command to test"
            });
            return new EpsilonGrammar(this.cell);
        }

        const siblingGrammar = this.sibling.toGrammar();

        if (this.child == undefined) {
            this.message({
                type: "warning",
                shortMsg: "Empty test",
                longMsg: "'test' seems to be missing something to test; " +
                "something should be in the cell to the right."
            });
            return siblingGrammar; // whereas usually we result in the 
                            // empty grammar upon erroring, in this case
                            // we don't want to let a flubbed "test" command 
                            // obliterate the grammar it was meant to test!
        }
        
        if (!(this.child instanceof TstTable)) {
            this.message({
                type: "error",
                shortMsg: "Cannot execute tests",
                longMsg: "You can't nest another operator to the right of a test block, " + 
                "it has to be a content table."
            });
            return siblingGrammar;
        }

        const testGrammar = this.child.toGrammar();
        const testGrammars = testGrammar.getChildren();
        return new UnitTestGrammar(this.cell, siblingGrammar, testGrammars);
    }

}

export class TstNegativeUnitTest extends TstEnclosure {

    /**
     * "testnot" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has no output when filtering the table above.
     */
    public toGrammar(): GrammarComponent {
        
        if (this.sibling == undefined) {
            this.message({
                type: "error",
                shortMsg: "Wayward test",
                longMsg: "There should be something above this 'testnot' command to test"
            });
            return new EpsilonGrammar(this.cell);
        }

        const siblingGrammar = this.sibling.toGrammar();

        if (this.child == undefined) {
            this.message({
                type: "warning",
                shortMsg: "Empty test",
                longMsg: "'testnot' seems to be missing something to test; " +
                "something should be in the cell to the right."
            });
            return siblingGrammar; // whereas usually we result in the 
                            // empty grammar upon erroring, in this case
                            // we don't want to let a flubbed "test" command 
                            // obliterate the grammar it was meant to test!
        }
        
        if (!(this.child instanceof TstTable)) {
            this.message({
                type: "error",
                shortMsg: "Cannot execute tests",
                longMsg: "You can't nest another operator to the right of a testnot block, " + 
                "it has to be a content table."
            });
            return siblingGrammar;
        }

        const testGrammar = this.child.toGrammar();
        const testGrammars = testGrammar.getChildren();
        return new NegativeUnitTestGrammar(this.cell, siblingGrammar, testGrammars);
    }

}


export class TstAssignment extends TstEnclosure {

    public assign(ns: NamespaceGrammar, grammar: GrammarComponent): void {
        
        // determine what symbol you're assigning to
        const trimmedText = this.text.slice(0, this.text.length-1).trim();
        const trimmedTextLower = trimmedText.toLowerCase();

        if (RESERVED_WORDS.has(trimmedTextLower)) {
            // oops, assigning to a reserved word
            this.message({
                type: "error",
                shortMsg: "Assignment to reserved word", 
                longMsg: "This cell has to be a symbol name for an assignment statement, but you're assigning to the " +
                `reserved word ${trimmedText}.  Choose a different symbol name.`
            });            
        }

        if (this.child == undefined) {
            // oops, empty "right side" of the assignment!
            this.message({
                type: "warning",
                shortMsg: "Empty assignment", 
                longMsg: `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it."
            });
            return;
        }

        try {
            ns.addSymbol(trimmedText, grammar);
        } catch (e) {
            this.message({
                type: "error",
                shortMsg: 'Invalid assignment', 
                longMsg: (e as Error).message
            });
        }
    }

    public toGrammar(): GrammarComponent {

        if (this.child != undefined) {
            return this.child.toGrammar();
        }

        return new EpsilonGrammar(this.cell);
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

    public toGrammar(): GrammarComponent {

        const ns = new NamespaceGrammar(this.cell, this.name);

        if (this.child == undefined) {
            return ns;
        }

        let child: TstEnclosure | undefined = undefined;
        let grammar: GrammarComponent | undefined = undefined;
        for (child of this.getChildren()) {
            grammar = child.toGrammar();
            if (child instanceof TstAssignment) {
                child.assign(ns, grammar);
            }
        }
        
        // The last child of a sheet is its "default" value; if you refer to 
        // a sheet without naming any particular symbol defined in that sheet, 
        // its value is the value of the last expression on the sheet.  This
        // last expression does not necessarily have to be an assignment, but it 
        // still has to be called *something* in order to be stored in the namespace;
        // we call it "__DEFAULT__".  We never actually call it by that name anywhere, 
        // although you could.
        if (child != undefined && grammar != undefined && !(child instanceof TstAssignment)) {
            ns.addSymbol("__DEFAULT__", grammar);
        }

        return ns;
    }

}

export class TstProject extends TstComponent {

    protected sheets: {[name: string]: TstSheet} = {};

    public addSheet(sheet: TstSheet): void {
        this.sheets[sheet.name] = sheet;
    }
    
    public toGrammar(): GrammarComponent {

        const ns = new NamespaceGrammar(new DummyCell(), "");

        for (const [name, sheet] of Object.entries(this.sheets)) {
            const grammar = sheet.toGrammar();
            ns.addSymbol(name, grammar);
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
    public rows: TstRow[] = [];
    
    public addHeader(headerCell: TstHeader): void {        
        this.headersByCol[headerCell.pos.col] = headerCell;
    }

    public addContent(cell: SheetCell): void {
        
        // make sure we have a header
        const headerCell = this.headersByCol[cell.pos.col];
        if (headerCell == undefined) {
            if (cell.text.length != 0) {
                cell.message({
                    type: "warning",
                    shortMsg: `Ignoring cell: ${cell.text}`,
                    longMsg: "Cannot associate this cell with any valid header above; ignoring."
                });
            }
            return;
        }

        if (this.rows.length == 0 || cell.pos.row != this.rows[this.rows.length-1].pos.row) {
            // we need to start an new row
            this.rows.push(new TstRow(cell));
        }

        const lastRow = this.rows[this.rows.length-1];
        lastRow.addContent(headerCell, cell);

    }

    public addChild(newChild: TstEnclosure): TstEnclosure {
        throw new Error("TstTables cannot have children");
    }

    public toGrammar(): GrammarComponent {

        if (this.sibling != undefined) {
            this.sibling.toGrammar();
        }

        var rowStates = this.rows.map(row => row.toGrammar())
                                 .filter(g => !(g instanceof EpsilonGrammar));
        return new AlternationGrammar(this.cell, rowStates);
    }
}

export class TstRow extends TstCellComponent {

    public lastCell: TstHeadedCell | undefined = undefined;

    public addContent(header: TstHeader, cell: SheetCell): void {
        const newCell = new TstHeadedCell(this.lastCell, header, cell);
        cell.message({ 
            type: "content", 
            color: header.getColor(0.1) 
        });
        this.lastCell = newCell;
    }

    public toGrammar(): GrammarComponent {
        if (this.lastCell == undefined) {
            return new NullGrammar(this.cell);  // shouldn't happen
        }
        const child = this.lastCell.toGrammar();
        return new UnaryGrammar(this.cell, child);
    }
}
