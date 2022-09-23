
/**
 * TSTS -- "tabular syntax trees" -- represent the structure of the program
 * in terms of the high-level tabular syntax: the structures, operators, headers,
 * content, etc. that the programmer is laying out on the grid.  (As opposed to the
 * more abstract grammar that they're representing thereby.)
 */

import { 
    Grammar, NsGrammar, AlternationGrammar, 
    EpsilonGrammar, UnitTestGrammar, NegativeUnitTestGrammar, 
    SequenceGrammar, JoinGrammar, ReplaceGrammar, 
    JoinReplaceGrammar, LiteralGrammar, JoinRuleGrammar, 
    LocatorGrammar 
} from "./grammars";
import { Cell, CellPos, Positioned } from "./util";
import {
    DEFAULT_SATURATION,
    DEFAULT_VALUE,
    Header,
    parseHeaderCell
} from "./headers";
import { ContentMsg, Err, Msg, Msgs, Result, resultList, Warn } from "./msgs";
import { Transform, TransEnv } from "./transforms";


export type ParamDict = {[key: string]: Grammar};
export class TstResult extends Result<TstComponent> { }
export abstract class TstTransform extends Transform<TstComponent,TstComponent> {}

type BinaryOp = (c1: Grammar, c2: Grammar) => Grammar;
export const BINARY_OPS: {[opName: string]: BinaryOp} = {
    "or": (c1, c2) => new AlternationGrammar([c1, c2]),
    "concat": (c1, c2) => new SequenceGrammar([c1, c2]),
    "join": (c1, c2) => new JoinGrammar(c1, c2),
}

export abstract class TstComponent implements Positioned {

    public get pos(): CellPos | undefined {
        return undefined;
    }   

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

    public abstract transform(f: TstTransform, env: TransEnv): TstResult;

    public abstract toParamsTable(): [Cell, ParamDict][];

    public msg(msgs: Msgs = []): TstResult {
        return new TstResult(this, msgs);
    }

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

    public message(msg: Msg): void {
        this.cell.message(msg);
    }
    
    public toGrammar(): Grammar {
        return new EpsilonGrammar();
    }

    public toParamsTable(): [Cell, ParamDict][] {
        this.message(Err(`Unexpected operator`, 
            `The operator to the left expects a table of parameters, but found a ${this.constructor.name}.`));
        return [];
    }

}

export class TstHeader extends TstCellComponent {

    public header: Header;

    constructor(
        cell: Cell,
        header: Header | undefined = undefined
    ) {
        super(cell);
        this.header = parseHeaderCell(cell.text);

        for (const err of this.header.getErrors()) {
            this.cell.message(err);
        }
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return new TstHeader(this.cell, this.header).msg();
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

}

export class TstHeadedCell extends TstCellComponent {

    constructor(
        public prev: TstHeadedCell | TstEmpty,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        return f.transform(this.prev, env)
                .bind(c => new TstHeadedCell(c, this.header, this.cell));
    }

    public toGrammar(): Grammar {
        const prevGrammar = this.prev.toGrammar();
        return this.header.headerToGrammar(prevGrammar, this.cell);
    }
}

export class TstEmpty extends TstComponent {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }

    public toGrammar(): Grammar {
        return new EpsilonGrammar();
    }
    
    public toParamsTable(): [Cell, ParamDict][] {
        return [];
    }
}


export class TstComment extends TstCellComponent {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }

    public toGrammar(): Grammar {
        return new EpsilonGrammar();
    }

}

export abstract class TstEnclosure extends TstCellComponent {

    public abstract toGrammar(): Grammar;
    public abstract addChild(child: TstEnclosure): TstEnclosure;

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
export class TstBinary extends TstEnclosure {

    constructor(
        cell: Cell,    
        public sibling: TstComponent = new TstEmpty(),
        public child: TstComponent = new TstEmpty()
    ) {
        super(cell);
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstBinary(this.cell, s, c));
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
        result = new LocatorGrammar(this.cell, result);
        return result;
    }

    public addChild(child: TstEnclosure): TstEnclosure {

        if (this.child instanceof TstBinary && 
            this.child.pos.col != child.pos.col) {
            child.message(Warn(
                "This operator is in an unexpected column.  Did you mean for it " +
                `to be in column ${this.child.pos.col}, ` + 
                `so that it's under the operator in cell ${this.child.pos}?`
            ));
        }

        if (child instanceof TstBinary) {
            child.sibling = this.child;
        }
        this.child = child;
        return child;
    }

}

export class TstTableOp extends TstBinary {


    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstTableOp(this.cell, s, c));
    }
    
    public toGrammar(): Grammar {
        
        this.sibling.toGrammar();  // it's erroneous, but this will at
                                // least run checks within it
        
        let result = this.child.toGrammar();
        result = new LocatorGrammar(this.cell, result);
        return result;
    }

    public toParamsTable(): [Cell, ParamDict][] {
        
        if (this.child instanceof TstEmpty) {
            this.message(Warn(
                "'table' seems to be missing a table; " + 
                "something should be in the cell to the right."
            ));
        }

        this.sibling.toGrammar(); // it's erroneous, but this will at
                                // least run checks within it
        return this.child.toParamsTable();

    }
}

export class TstBinaryOp extends TstBinary {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstBinaryOp(this.cell, s, c));
    }
    
    public toGrammar(): Grammar {

        const trimmedText = this.text.slice(0, 
                        this.text.length-1).trim().toLowerCase();

        const op = BINARY_OPS[trimmedText];
        const childGrammar = this.child.toGrammar();
        const siblingGrammar = this.sibling.toGrammar();
        let result = op(siblingGrammar, childGrammar);
        result = new LocatorGrammar(this.cell, result);
        return result;
    }
}

export class TstReplaceTape extends TstBinaryOp {


    public static VALID_PARAMS = [ "from", "to", "pre", "post" ];

    constructor(
        cell: Cell,
        public tape: string,
        sibling: TstComponent = new TstEmpty(),
        child: TstComponent = new TstEmpty()
    ) { 
        super(cell, sibling, child);
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstReplaceTape(this.cell, this.tape, s, c));
    }

    public toGrammar(): Grammar {

        let params = this.child.toParamsTable();
        let siblingGrammar = this.sibling.toGrammar();
        const replaceRules: ReplaceGrammar[] = [];

        for (const [cell, paramDict] of params) {

            if (!("from" in paramDict)) {
                this.message(Err(`Missing 'from' argument to replace'`,
                    "'replace:' requires a 'from' argument (e.g. 'from text')"));
                continue;
            }
            const fromArg = paramDict["from"];
            if (!("to" in paramDict)) {
                this.message(Err(`Missing 'to' argument to replace'`,
                    "'replace:' requires a 'to' argument (e.g. 'to text')"));
                continue;
            }
            const toArg = paramDict["to"];
            const preArg = "pre" in paramDict
                                    ? paramDict["pre"]
                                    : new EpsilonGrammar();
            const postArg = "post" in paramDict 
                                    ? paramDict["post"] 
                                    : new EpsilonGrammar(); 
            const replaceRule = new ReplaceGrammar(fromArg, toArg, preArg, postArg);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return siblingGrammar;  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinRuleGrammar(this.tape, siblingGrammar, replaceRules);
        result = new LocatorGrammar(this.cell, result);
        return result;
    }
}

export class TstReplace extends TstBinaryOp {

    public static VALID_PARAMS = [ "from", "to", "pre", "post" ];

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstReplace(this.cell, s, c));
    }

    public toGrammar(): Grammar {

        let params = this.child.toParamsTable();
        let siblingGrammar = this.sibling.toGrammar();
        const replaceRules: ReplaceGrammar[] = [];

        for (const [cell, paramDict] of params) {

            if (!("from" in paramDict)) {
                this.message(Err(`Missing 'from' argument to replace'`,
                    "'replace:' requires a 'from' argument (e.g. 'from text')"));
                continue;
            }
            const fromArg = paramDict["from"];
            if (!("to" in paramDict)) {
                this.message(Err(`Missing 'to' argument to replace'`,
                    "'replace:' requires a 'to' argument (e.g. 'to text')"));
                continue;
            }
            const toArg = paramDict["to"];
            const preArg = "pre" in paramDict
                                    ? paramDict["pre"]
                                    : new EpsilonGrammar();
            const postArg = "post" in paramDict 
                                    ? paramDict["post"] 
                                    : new EpsilonGrammar(); 
            const replaceRule = new ReplaceGrammar(fromArg, toArg, preArg, postArg);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return siblingGrammar;  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinReplaceGrammar(siblingGrammar, replaceRules);
        result = new LocatorGrammar(this.cell, result);
        return result;
    }
}

/**
 * "test" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has an output when filtering the table above.
 */
export class TstUnitTest extends TstBinary {

    public static VALID_PARAMS = [ "__", "unique" ];

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstUnitTest(this.cell, s, c));
    }

    public toGrammar(): Grammar {
        
        let result = this.sibling.toGrammar();

        for (const [cell, paramDict] of this.child.toParamsTable()) {
            
            const testInputs = paramDict["__"];
            if (testInputs == undefined) {
                cell.message(Err("Missing test inputs",
                    `This test line does not have any inputs.`));
                continue;
            }

            let uniques: LiteralGrammar[] = [];
            const unique = paramDict["unique"];

            if (unique != undefined) {
                try {
                    uniques = unique.getLiterals();
                } catch (e) {
                    const errLoc = [...unique.locations, cell][0];
                    errLoc.message(Err("Ill-formed unique",
                        `Somewhere in this row there is an ill-formed uniqueness constraint.  ` +
                        `Uniqueness constrains can only be literals.`));
                    continue;
                }
            }
            result = new UnitTestGrammar(result, testInputs, uniques);
            result = new LocatorGrammar(cell, result);
        }

        result = new LocatorGrammar(this.cell, result);
        return result;
    }

}

/**
 * "testnot" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has no output when filtering the table above.
 */
export class TstNegativeUnitTest extends TstUnitTest {

    public static VALID_PARAMS = [ "__" ];

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstNegativeUnitTest(this.cell, s, c));
    }

    public toGrammar(): Grammar {

        let result = this.sibling.toGrammar();

        for (const [cell, paramDict] of this.child.toParamsTable()) {
            for (const [key, grammar] of Object.entries(paramDict)) {
                result = new NegativeUnitTestGrammar(result, grammar);
                result = new LocatorGrammar(cell, result);
            }   
        }
        
        result = new LocatorGrammar(this.cell, result);
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
export class TstTable extends TstBinary {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        const [sib, sMsgs] = f.transform(this.sibling, env).destructure();
        const [child, cMsgs] = f.transform(this.child, env).destructure();

        const newHeaders: {[col: number]: TstHeader} = {};
        const headerMsgs: Msgs = [];
        for (const header of Object.values(this.headersByCol)) {
            const [newH, hMsgs] = f.transform(header, env).destructure();
            headerMsgs.push(...hMsgs);
            if (!(newH instanceof TstHeader)) {
                continue; // remove invalid headers
            }
            newHeaders[header.pos.col] = newH;     
        }
        const newRows: ParamRow[] = [];
        const rowMsgs: Msgs = [];
        for (const row of this.rows) {
            const [newR, rMsgs] = f.transform(row, env).destructure() as [ParamRow, Msgs];
            newRows.push(newR);
            rowMsgs.push(...rMsgs);
        }
        return new TstTable(this.cell, sib, child, newHeaders, newRows)
                     .msg(sMsgs).msg(cMsgs)
                     .msg(headerMsgs).msg(rowMsgs);
    }

    constructor(
        cell: Cell,    
        public sibling: TstComponent = new TstEmpty(),
        public child: TstComponent = new TstEmpty(),    
        public headersByCol: {[col: number]: TstHeader} = {},
        public rows: ParamRow[] = []
    ) {
        super(cell, sibling, child);
    }

    public addHeader(headerCell: TstHeader): void {        
        this.headersByCol[headerCell.pos.col] = headerCell;
    }

    public addContent(cell: Cell): void {
        
        // make sure we have a header
        const headerCell = this.headersByCol[cell.pos.col];
        if (headerCell == undefined) {
            if (cell.text.length != 0) {
                cell.message(Warn(
                    "Cannot associate this cell with any valid header above; ignoring."
                ));
            }
            return;
        }

        if (this.rows.length == 0 || cell.pos.row != this.rows[this.rows.length-1].pos.row) {
            // we need to start an new row
            this.rows.push(new ParamRow(cell));
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

                if (grammar instanceof EpsilonGrammar) {
                    // if a row evaluates as empty, don't consider it an
                    // alternative
                    continue;
                }

                alternatives.push(grammar);
            }
        }

        return new AlternationGrammar(alternatives);
    }

    public toParamsTable(): [Cell, ParamDict][] {
        this.sibling.toGrammar(); // in case there's an erroneous sibling,
                                    // this will at least run some checks on it
        return this.rows.map(row => [row.cell, row.toParams()]);
    }
}

/**
 * Expresses a row as a map of named parameters
 */
export class ParamRow extends TstCellComponent {

    constructor(
        cell: Cell,
        public params: {[s: string]: TstHeadedCell|TstEmpty} = {}
    ) {
        super(cell);
    }
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        const newParams: {[s: string]: TstHeadedCell|TstEmpty} = {}
        const newMsgs: Msgs = []
        for (const [k, v] of Object.entries(this.params)) {
            const [p, m] = f.transform(v, env).destructure();
            newParams[k] = p;
            newMsgs.push(...m);
        }
        return new ParamRow(this.cell, newParams).msg(newMsgs);
    }

    public addContent(header: TstHeader, cell: Cell): void {

        // get the param name and make sure it's in .params
        const tag = header.header.getParamName();
        if (!(tag in this.params)) {
            this.params[tag] = new TstEmpty();
        }

        const newCell = new TstHeadedCell(this.params[tag], header, cell);
        cell.message(new ContentMsg(
            header.getBackgroundColor(),
            header.getFontColor()
        ));
        this.params[tag] = newCell;
    }

    public toGrammar(): Grammar {
        this.cell.message(Err("Unexpected parameters",
                "The operator to the left does not expect named parameters."));
        return new EpsilonGrammar();
    } 

    public toParams(): ParamDict {
        const results: ParamDict = {}
        for (const [k, v] of Object.entries(this.params)) {
            results[k] = v.toGrammar();
        }
        return results;
    }
}

export class TstAssignment extends TstBinary {

    public trimmedText: string;
    constructor(
        cell: Cell,
        sibling: TstComponent = new TstEmpty(),
        child: TstComponent = new TstEmpty()
    ) {
        super(cell, sibling, child);
        this.trimmedText = cell.text.endsWith(":")
                            ? cell.text.slice(0, cell.text.length-1).trim()
                            : cell.text;    
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstAssignment(this.cell, s, c));
    }

    public toGrammar(): Grammar {
        return this.child.toGrammar();
    }

}

export class TstNamespace extends TstEnclosure {

    constructor(
        cell: Cell,
        public children: TstEnclosure[] = []
    ) {
        super(cell);
    }
    
    public addChild(child: TstEnclosure): TstEnclosure {
        this.children.push(child);
        return child;
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        const newChildren: TstEnclosure[] = [];
        const msgs: Msgs = [];
        for (const child of this.children) {
            const [newC, cMsgs] = f.transform(child, env).destructure() as [TstEnclosure, Msgs];
            newChildren.push(newC);
            msgs.push(...cMsgs);
        }
        return new TstNamespace(this.cell, newChildren)
                    .msg(msgs);
    }

    public toGrammar(): Grammar {
        const ns = new NsGrammar();
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const isLastChild = i == this.children.length - 1;
            const grammar = this.children[i].toGrammar();

            if (!(child instanceof TstAssignment) && !isLastChild) {
                // warn that the child isn't going to be assigned to anything
                child.message(Warn(
                    "This content doesn't end up being assigned to anything and will be ignored."
                ));
                continue;
            }

            if (isLastChild) {
                ns.addSymbol("__DEFAULT__", grammar);
            }

            if (child instanceof TstAssignment) {
                const referent = ns.getSymbol(child.trimmedText);
                if (referent != undefined) {
                    // we're reassigning an existing symbol!
                    child.message(Err('Reassigning existing symbol', 
                        `The symbol ${child.trimmedText} already refers to another grammar above.`));
                    continue;
                }     
                ns.addSymbol(child.trimmedText, grammar);
            }
            
        }
        return ns;
    }

}

export class TstProject extends TstNamespace {
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        const newChildren: TstEnclosure[] = [];
        const msgs: Msgs = [];
        for (const child of this.children) {
            const [newC, cMsgs] = f.transform(child, env).destructure() as [TstEnclosure, Msgs];
            newChildren.push(newC);
            msgs.push(...cMsgs);
        }
        return new TstProject(this.cell, newChildren)
                    .msg(msgs);
    }

    /**
     * TstProject overrides addChild() because it needs to treat
     * its added children specially.  Its children are all sheets (and thus
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