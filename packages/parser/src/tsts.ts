
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

import { 
    Grammar, NsGrammar, AlternationGrammar, 
    EpsilonGrammar, UnitTestGrammar, NegativeUnitTestGrammar, 
    SequenceGrammar, JoinGrammar, ReplaceGrammar, 
    JoinReplaceGrammar, LiteralGrammar 
} from "./grammars";
import { Cell, CellPos, DummyCell } from "./util";
import {
    DEFAULT_SATURATION,
    DEFAULT_VALUE,
    ErrorHeader,
    Header,
    ParamDict,
    parseHeaderCell,
    ReservedErrorHeader,
    RESERVED_WORDS
} from "./headers";


type BinaryOp = (cell: Cell, c1: Grammar, c2: Grammar) => Grammar;
export const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": (cell, c1, c2) => new AlternationGrammar(cell, [c1, c2]),
    "concat": (cell, c1, c2) => new SequenceGrammar(cell, [c1, c2]),
    "join": (cell, c1, c2) => new JoinGrammar(cell, c1, c2),
}

export abstract class TstComponent {

    public abstract toGrammar(): Grammar;

    /**
     * Most kinds of components only represent a grammar, that will be
     * interpreted as a single parameter to an operation like "join" or "concat".
     * 
     * However, some operations (like replacement rules) take more than just one
     * parameter, meaning we need some way to specify them by name or position.  Given
     * that replacement rules can take a lot of params (because they can specify conditions
     * on any number of tapes), named params are probably better than positional ones for our
     * purposes.
     * 
     * This function is like toGrammar(), but instead of returning a single grammar,
     * returns a dictionary of grammars keyed to parameter names.  Ultimately, only [ParamHeader]
     * objects add an actual parameter name; everything else contributes an empty param name
     * "__".
     */
    public toParams(): ParamDict {
        return { "__": this.toGrammar()};
    }

    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean
    ): void {
        if (ns == undefined) {
            // there's nothing to do
            return;
        }

        if (lastChild) {
            // whatever this is, it's the default
            ns.addSymbol("__DEFAULT__", this.toGrammar());
            return;
        }
    }

    public abstract toParamsTable(): [Cell, ParamDict][];
}

/**
 * A TstCellComponent is just any TstComponent that has a
 * cell.
 */
export abstract class TstCellComponent extends TstComponent {

    constructor(
        public cell: Cell
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
    
    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean
    ): void {
        super.assignToNamespace(ns, lastChild);

        if (ns != undefined && !lastChild) {
            // We're directly under a namespace, but we're not an assignment.
            // (TstAssignment overrides this, so we can't be an assignment.)
            // We're also not the last child, so we won't be assigned to 
            // the default symbol.  Any content is going to be lost, so 
            // issue an error
            this.message({
                type: "error",
                shortMsg: `Expected assignment`,
                longMsg: 'We expect an assignment to a symbol here (e.g. "VERB:").' + 
                    "Did you forget a colon at the end?"
            });
        }
    }
    
    public toGrammar(): Grammar {
        return new EpsilonGrammar(this.cell);
    }

    public toParamsTable(): [Cell, ParamDict][] {
        this.message({
            type: "error", 
            shortMsg: `Unexpected operator`, 
            longMsg: `The operator to the left expects a table of parameters, not another operator.`
        });
        return [];
    }

}

export class TstHeader extends TstCellComponent {

    protected header: Header;

    constructor(
        cell: Cell
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

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return this.header.getBackgroundColor(saturation, value);
    }

    public getFontColor(): string {
        return this.header.getFontColor();
    }

    public headerToGrammar(left: Grammar, content: Cell): Grammar {
        return this.header.toGrammar(left, content.text, content);
    }
    
    public headerToParams(left: ParamDict, content: Cell): ParamDict {
        return this.header.toParams(left, content.text, content);
    }

}

export class TstHeadedCell extends TstCellComponent {

    constructor(
        public prev: TstComponent,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }

    public toGrammar(): Grammar {
        const prevGrammar = this.prev.toGrammar();
        return this.header.headerToGrammar(prevGrammar, this.cell);
    }
    
    public toParams(): ParamDict {
        const prevParams = this.prev.toParams();
        return this.header.headerToParams(prevParams, this.cell);
    }
}

export class TstEmpty extends TstComponent {

    public toGrammar(): Grammar {
        return new EpsilonGrammar(new DummyCell());
    }
    
    public toParamsTable(): [Cell, ParamDict][] {
        return [];
    }
}

export class TstComment extends TstCellComponent {

    public toGrammar(): Grammar {
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
export abstract class TstEnclosure extends TstCellComponent {

    public specRow: number = -1;
    
    /**
     * The previous sibling of the component (i.e. the component that shares
     * the same parent, but appeared before this component, usually directly
     * above this one).
     */
    public sibling: TstComponent = new TstEmpty();

    /**
     * The last-defined child of the component (i.e. of all the components
     * enclosed by this component, the last one.)  As [SheetParser] builds the
     * tree, this value will change; when a new child is added, it's set to the
     * parent's child and the previous child (if any) becomes the new child's
     * sibling.
     */
    public child: TstComponent = new TstEmpty();

    constructor(
        cell: Cell,
    ) {
        super(cell);
        this.specRow = cell.pos.row;
    }
    
    public toGrammar(): Grammar {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        // in order to fail gracefully, we define the State of this component as 
        // its sibling's state (if a sibling is present), and if not, as its child's 
        // state (if present), and if not, the empty grammar.

        let result = this.child.toGrammar();
        result = this.sibling.toGrammar();
        return result;
    }

    public addChild(child: TstEnclosure): TstEnclosure {

        if (this.child instanceof TstEnclosure && 
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

export class TstTableOp extends TstEnclosure {

    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean
    ): void {
        this.sibling.assignToNamespace(ns, false);
        this.child.assignToNamespace(undefined, false);
        super.assignToNamespace(ns, lastChild);
    }
    
    public toGrammar(): Grammar {
        
        if (this.child instanceof TstEmpty) {
            this.message({
                type: "warning",
                shortMsg: "Empty table",
                longMsg: "'table' seems to be missing a table; " + 
                "something should be in the cell to the right."
            });
        }


        this.sibling.toGrammar();  // it's erroneous, but this will at
                                // least run checks within it
        
        return this.child.toGrammar();
    }

    public toParamsTable(): [Cell, ParamDict][] {
        
        if (this.child instanceof TstEmpty) {
            this.message({
                type: "warning",
                shortMsg: "Empty table",
                longMsg: "'table' seems to be missing a table; " + 
                "something should be in the cell to the right."
            });
        }

        this.sibling.toGrammar(); // it's erroneous, but this will at
                                // least run checks within it
        return this.child.toParamsTable();

    }
}

export class TstBinaryOp extends TstEnclosure {

    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean
    ): void {
        this.sibling.assignToNamespace(undefined, false);
        this.child.assignToNamespace(undefined, false);
        super.assignToNamespace(ns, lastChild);
    }
    
    public toGrammar(): Grammar {

        const trimmedText = this.text.slice(0, 
                        this.text.length-1).trim();
   
        if (this.child instanceof TstEmpty) {
            this.message({
                type: "error",
                shortMsg: `Missing argument to '${trimmedText}'`, 
                longMsg: `'${trimmedText}' is missing a second argument; ` +
                "something should be in the cell to the right."
            });
        }

        if (this.sibling instanceof TstEmpty) {
            this.message({
                type: "error",
                shortMsg: `Missing argument to '${trimmedText}'`,
                longMsg:`'${trimmedText}' is missing a first argument; ` +
                "something should be in a cell above this."
            });
        } 

        const op = BINARY_OPS[trimmedText];
        let childGrammar = this.child.toGrammar();
        let siblingGrammar = this.sibling.toGrammar();
        return op(this.cell, siblingGrammar, childGrammar);
    }
}

export class TstReplace extends TstBinaryOp {

    public static VALID_PARAMS = [ "from", "to", "pre", "post" ];

    public toGrammar(): Grammar {

        if (this.child instanceof TstEmpty) {
            this.message({
                type: "error",
                shortMsg: `Replace missing parameters`, 
                longMsg: `'replace:' doesn't have any parameters; ` +
                "something should be in the cells to the right."
            });
        } 

        if (this.sibling instanceof TstEmpty) {
            this.message({
                type: "error",
                shortMsg: `Missing argument to replace'`,
                longMsg:`'replace:' needs a grammar to operate on; ` +
                "something should be in a cell above this."
            });
        }

        let params = this.child.toParamsTable();
        let siblingGrammar = this.sibling.toGrammar();
        const replaceRules: ReplaceGrammar[] = [];

        for (const [cell, paramDict] of params) {

            for (const [key, grammar] of Object.entries(paramDict)) {
                if (key == "__") {
                    grammar.message({
                        type: "warning",
                        shortMsg: "Missing parameter name",
                        longMsg: `The operator to the left doesn't allow unnamed parameters.`
                    });
                    continue;
                }
                if (TstReplace.VALID_PARAMS.indexOf(key) == -1) {
                    grammar.message({
                        type: "warning",
                        shortMsg: "Wayward parameter name",
                        longMsg: `The operator to the left doesn't allow parameters '${key}', so this cell will be ignored.`
                    });
                    continue;
                }
            }

            if (!("from" in paramDict)) {
                this.message({
                    type: "error",
                    shortMsg: `Missing 'from' argument to replace'`,
                    longMsg:"'replace:' requires a 'from' argument (e.g. 'from text')"
                });
                continue;
            }
            const fromArg = paramDict["from"];
            if (!("to" in paramDict)) {
                this.message({
                    type: "error",
                    shortMsg: `Missing 'to' argument to replace'`,
                    longMsg:"'replace:' requires a 'to' argument (e.g. 'to text')"
                });
                continue;
            }
            const toArg = paramDict["to"];
            const preArg = "pre" in paramDict
                                    ? paramDict["pre"]
                                    : new EpsilonGrammar(this.cell);
            const postArg = "post" in paramDict 
                                    ? paramDict["post"] 
                                    : new EpsilonGrammar(this.cell); 
            const replaceRule = new ReplaceGrammar(this.cell, fromArg, toArg, preArg, postArg);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return siblingGrammar;  // in case every rule fails, at least generate something
        }

        return new JoinReplaceGrammar(this.cell, siblingGrammar, replaceRules);
    }
}

export class TstUnitTest extends TstEnclosure {

    public static VALID_PARAMS = [ "__", "unique" ];

    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean
    ): void {
        this.sibling.assignToNamespace(ns, true);
        this.child.assignToNamespace(undefined, false);
        super.assignToNamespace(ns, lastChild);
    }

    /**
     * "test" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has an output when filtering the table above.
     */
    public toGrammar(): Grammar {
        
        if (this.sibling instanceof TstEmpty) {
            this.message({
                type: "error",
                shortMsg: "Wayward test",
                longMsg: "There should be something above this 'test' command to test"
            });
            return new EpsilonGrammar(this.cell);
        }

        const siblingGrammar = this.sibling.toGrammar();

        if (this.child instanceof TstEmpty) {
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
        
        if (!(this.child instanceof TstTable) && !(this.child instanceof TstTableOp)) {
            this.message({
                type: "error",
                shortMsg: "Cannot execute tests",
                longMsg: "You can't nest another operator to the right of a test block, " + 
                "it has to be a content table."
            });
            return siblingGrammar;
        }

        let result = siblingGrammar;

        for (const [cell, paramDict] of this.child.toParamsTable()) {
            for (const [key, grammar] of Object.entries(paramDict)) {
                if (TstUnitTest.VALID_PARAMS.indexOf(key) == -1) {
                    grammar.message({
                        type: "warning",
                        shortMsg: "Wayward parameter name",
                        longMsg: `The operator to the left doesn't allow paramaters '${key}', so this cell will be ignored.`
                    });
                    continue;
                }
            }
            const testInputs = paramDict["__"];
            if (testInputs == undefined) {
                cell.message({
                    type: "error",
                    shortMsg: "Missing test inputs",
                    longMsg: `This test line does not have any inputs.`
                });
                continue;
            }

            let uniques: LiteralGrammar[] = [];
            const unique = paramDict["unique"];

            if (unique != undefined) {
                try {
                    uniques = unique.getLiterals();
                } catch {
                    cell.message({
                        type: "error",
                        shortMsg: "Ill-formed unique",
                        longMsg: `Somewhere in this row there is an ill-formed uniqueness constraint.  ` +
                                `Uniqueness constrains can only be literals.`
                    });
                    continue;
                }
            }
            result = new UnitTestGrammar(cell, result, testInputs, uniques);
        }
        return result;
    }

}

export class TstNegativeUnitTest extends TstUnitTest {

    /**
     * "testnot" is an operator that takes two tables, one above (spatially speaking)
     * and one to the right, and makes sure that each line of the one to the right
     * has no output when filtering the table above.
     */
    public toGrammar(): Grammar {
        
        if (this.sibling instanceof TstEmpty) {
            this.message({
                type: "error",
                shortMsg: "Wayward test",
                longMsg: "There should be something above this 'testnot' command to test"
            });
            return new EpsilonGrammar(this.cell);
        }

        const siblingGrammar = this.sibling.toGrammar();

        if (this.child instanceof TstEmpty) {
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
        
        if (!(this.child instanceof TstTable) && !(this.child instanceof TstTableOp)) {
            this.message({
                type: "error",
                shortMsg: "Cannot execute tests",
                longMsg: "You can't nest another operator to the right of a testnot block, " + 
                "it has to be a content table."
            });
            return siblingGrammar;
        }

        let result = siblingGrammar;

        for (const [cell, paramDict] of this.child.toParamsTable()) {
            for (const [key, grammar] of Object.entries(paramDict)) {
                if (key != "__") {
                    grammar.message({
                        type: "warning",
                        shortMsg: "Wayward parameter name",
                        longMsg: `The operator to the left doesn't take named paramaters like '${key}', so this cell will be ignored.`
                    });
                    continue;
                }
                result = new NegativeUnitTestGrammar(cell, result, grammar);
            }   
        }
        return result;
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
    
    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean
    ): void {
        this.sibling.assignToNamespace(ns, false);
        this.child.assignToNamespace(undefined, false);
        super.assignToNamespace(ns, lastChild);
    }

    public addHeader(headerCell: TstHeader): void {        
        this.headersByCol[headerCell.pos.col] = headerCell;
    }

    public addContent(cell: Cell): void {
        
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

    public toGrammar(): Grammar {
        // unless it's being interpreted as a paramTable, tables
        // have the semantics of alternation
        const alternatives: Grammar[] = [];

        for (const [cell, paramDict] of this.toParamsTable()) {
            for (const [key, grammar] of Object.entries(paramDict)) {
                if (key != "__") {
                    // there's a wayward parameter name in the headers
                    grammar.message({
                        type: "warning",
                        shortMsg: "Wayward parameter name",
                        longMsg: `The operator to the left doesn't take named paramaters like '${key}', so this cell will be ignored.`
                    });
                    continue;
                }

                if (grammar instanceof EpsilonGrammar) {
                    // if a row evaluates as empty, don't consider it an
                    // alternative
                    continue;
                }

                alternatives.push(grammar);
            }
        }

        return new AlternationGrammar(this.cell, alternatives);
    }

    public toParamsTable(): [Cell, ParamDict][] {
        this.sibling.toGrammar(); // in case there's an erroneous sibling,
                                    // this will at least run some checks on it
        return this.rows.map(row => [row.cell, row.toParams()]);
    }
}

export class TstRow extends TstCellComponent {

    public lastCell: TstComponent = new TstEmpty();

    public addContent(header: TstHeader, cell: Cell): void {
        const newCell = new TstHeadedCell(this.lastCell, header, cell);
        cell.message({ 
            type: "content", 
            color: header.getBackgroundColor(),
            fontColor: header.getFontColor()
        });
        this.lastCell = newCell;
    }

    public toGrammar(): Grammar {
        return this.lastCell.toGrammar();
    }
    
    public toParams(): ParamDict {
        return this.lastCell.toParams();
    }
}

export class TstAssignment extends TstEnclosure {

    public assignToNamespace(
        ns: NsGrammar | undefined,
        lastChild: boolean  // we don't need to use last child -- regardless of
                            // whether this is the last child, it's getting added,
                            // and if it's last, well, it's last!
    ): void {

        this.sibling.assignToNamespace(ns, false);
        this.child.assignToNamespace(undefined, false);

        const trimmedText = this.text.endsWith(":")
                            ? this.text.slice(0, this.text.length-1).trim()
                            : this.text
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

        if (this.child instanceof TstEmpty) {
            // oops, empty "right side" of the assignment!
            this.message({
                type: "warning",
                shortMsg: "Empty assignment", 
                longMsg: `This looks like an assignment to a symbol ${trimmedText}, ` +
                "but there's nothing to the right of it."
            });
            return;
        }

        if (trimmedText.indexOf(".") != -1) {
            this.message({
                type: "warning",
                shortMsg: "Symbol name contains .", 
                longMsg: "You can't assign to a name that contains a period."
            });
            return;
        }

        if (ns == undefined) {
            this.message({
                type: "error",
                shortMsg: "Wayward assignment",
                longMsg: `This looks like an assignment to a symbol ${trimmedText}, ` +
                    "but an assignment can't be here."
            });
            return;
        }

        const referent = ns.getSymbol(trimmedText);
        if (referent != undefined) {
            // we're reassigning an existing symbol!
            this.message({
                type: "error",
                shortMsg: 'Reassigning existing symbol', 
                longMsg: `The symbol ${trimmedText} already refers to the grammar at ${referent.cell.id}`
            });
            return;
        }

        ns.addSymbol(trimmedText, this.toGrammar());
    }
    
    public toGrammar(): Grammar {
        return this.child.toGrammar();
    }
}

export class TstNamespace extends TstEnclosure {

    constructor(
        public name: string,
        cell: Cell
    ) { 
        super(cell);
    }

    public toGrammar(): Grammar {
        const ns = new NsGrammar(this.cell, this.name);
        this.child.assignToNamespace(ns, true);
        return ns;
    }

}

export class TstProject extends TstNamespace {

    constructor() {
        super("", new DummyCell());
    }

    /**
     * TstProject overrides addChild() because it needs to treat
     * is added children specially.  Its children are all sheets (and thus
     * namespaces) but unlike ordinary things that we assign, there's no 
     * actual "name:" cell to the left of these, their name is the name of the
     * source file or worksheet they come from.  This is represented as a 
     * "virtual" cell that we constructed earlier, but at some point we have 
     * to turn that cell into an assignment; that's what we do here.
     */
    public addChild(child: TstEnclosure): TstEnclosure {

        if (!(child instanceof TstNamespace)) {
            throw new Error("Attempting to add a non-namespace to a project");
        }

        // first wrap it in an assignment
        const newChild = new TstAssignment(child.cell);
        newChild.addChild(child);
        // then add the assign as our own child
        return super.addChild(newChild);
    }
}