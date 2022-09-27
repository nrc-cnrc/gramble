
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
    LocatorGrammar, 
    RenameGrammar,
    EqualsGrammar,
    HideGrammar,
    GrammarResult,
} from "./grammars";
import { Cell, CellPos, Positioned } from "./util";
import {
    DEFAULT_SATURATION,
    DEFAULT_VALUE,
    Header,
    parseHeaderCell,
    TapeNameHeader
} from "./headers";
import { ContentMsg, Err, Msg, Msgs, Result, resultList, Warn, resultDict } from "./msgs";
import { Transform, TransEnv } from "./transforms";


export type ParamDict = {[key: string]: Grammar};
export class TstResult extends Result<TstComponent> { }
export abstract class TstTransform extends Transform<TstComponent,TstComponent> {}

type BinaryOp = (c1: Grammar, c2: Grammar) => Grammar;

export abstract class TstComponent implements Positioned {

    public get pos(): CellPos | undefined {
        return undefined;
    }   

    public abstract toGrammar(env: TransEnv): GrammarResult;
    public abstract transform(f: TstTransform, env: TransEnv): TstResult;

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
     public toParamsTable(env: TransEnv): Result<[Cell, ParamDict][]> {
        return resultList([]).err(
            `Unexpected operator`, 
            "The operator to the left expects a table " +
            `of parameters, but found a ${this.constructor.name}.`);
    }

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
    
    public toGrammar(env: TransEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

}

export class TstHeader extends TstCellComponent {

    public header: Header;

    constructor(
        cell: Cell,
        header: Header | undefined = undefined
    ) {
        super(cell);
        if (header != undefined) {
            this.header = header;
            return;
        }
        
        const [parsedHeader, msgs] = parseHeaderCell(cell.text).destructure();
        this.header = parsedHeader;
        for (const msg of msgs) {
            this.cell.message(msg);
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

    public headerToGrammar(content: Cell): GrammarResult {
        return this.header.toGrammar(content.text)
                          .localize(content.pos);
    }

}

export class TstHeadedCell extends TstCellComponent {

    constructor(
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }

    public toGrammar(env: TransEnv): GrammarResult {
        return this.header.headerToGrammar(this.cell)
                    .bind(c => new LocatorGrammar(this.cell, c));
    }
}

export class TstRename extends TstCellComponent {

    constructor(
        public prev: TstComponent,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }
    
    public toGrammar(env: TransEnv): GrammarResult {
        if (!(this.header.header instanceof TapeNameHeader)) {
            return new EpsilonGrammar().msg()
                .err("Renaming error",
                    "Rename (>) needs to have a tape name after it");
        }
        const fromTape = this.cell.text;
        const toTape = this.header.header.text;
        return this.prev.toGrammar(env)
                    .bind(c => new RenameGrammar(c, fromTape, toTape))
                    .bind(c => new LocatorGrammar(this.cell, c));
    }
}

export class TstHide extends TstCellComponent {

    constructor(
        public prev: TstComponent,
        content: Cell
    ) { 
        super(content);
    }
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }
    
    public toGrammar(env: TransEnv): GrammarResult {
        let result = this.prev.toGrammar(env);
        for (const tape of this.cell.text.split("/")) {
            result = result.bind(c => new HideGrammar(c, tape.trim()));
        }
        return result.bind(c => new LocatorGrammar(this.cell, c));
    }
}

export class TstFilter extends TstCellComponent {

    constructor(
        public prev: TstComponent,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }
    
    public toGrammar(env: TransEnv): GrammarResult {
        const [prevGrammar, prevMsgs] = this.prev.toGrammar(env).destructure();
        const [grammar, msgs] = this.header.headerToGrammar(this.cell)
                                           .destructure();
        const result = new EqualsGrammar(prevGrammar, grammar);
        const locatedResult = new LocatorGrammar(this.cell, result);
        return locatedResult.msg(prevMsgs).msg(msgs);
    }
}

export class TstEmpty extends TstComponent {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }

    public toGrammar(env: TransEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }
    
    public toParamsTable(env: TransEnv): Result<[Cell, ParamDict][]> {
        return resultList([]);
    }
}


export class TstComment extends TstCellComponent {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return this.msg();
    }

    public toGrammar(env: TransEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

}

export abstract class TstEnclosure extends TstCellComponent {

    public abstract addChild(child: TstComponent): TstComponent;

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

    public toGrammar(env: TransEnv): GrammarResult {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        return resultList([this.sibling, this.child])
                    .map(c => c.toGrammar(env))
                    .bind(([s,c]) => new LocatorGrammar(this.cell, s));
    }

    public addChild(child: TstComponent): TstComponent {

        if (this.child instanceof TstBinary && 
            child instanceof TstCellComponent &&
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
    
    public toGrammar(env: TransEnv): GrammarResult {
        return resultList([this.sibling, this.child])
                .map(c => c.toGrammar(env))
                .bind(([s,c]) => new LocatorGrammar(this.cell, c));
    }

    public toParamsTable(env: TransEnv): Result<[Cell, ParamDict][]> {
        
        const [_, sibMsgs] = this.sibling.toGrammar(env).destructure();  // erroneous but we want to collect errors on it
        
        if (this.child instanceof TstEmpty) {
            return this.child.toParamsTable(env).msg(sibMsgs).warn(
                "'table' seems to be missing a table; " + 
                "something should be in the cell to the right.")
        }

        return this.child.toParamsTable(env).msg(sibMsgs);
    }
}

export class TstAnonymousOp extends TstBinary {

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstAnonymousOp(this.cell, s, c));
    }

}

export class TstBinaryOp extends TstBinary {

    constructor(
        cell: Cell,    
        public op: BinaryOp,
        sibling: TstComponent = new TstEmpty(),
        child: TstComponent = new TstEmpty()
    ) {
        super(cell, sibling, child);
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstBinaryOp(this.cell, this.op, s, c));
    }
    
    public toGrammar(env: TransEnv): GrammarResult {

        const trimmedText = this.text.slice(0, 
                        this.text.length-1).trim().toLowerCase();

        return resultList([this.sibling, this.child])
                    .map(c => c.toGrammar(env))
                    .bind(([s,c]) => this.op(s,c));
    }
}

export class TstReplaceTape extends TstBinary {


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

    public toGrammar(env: TransEnv): GrammarResult {

        let [params, paramMsgs] = this.child.toParamsTable(env).destructure();
        let [sibling, sibMsgs] = this.sibling.toGrammar(env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

        for (const [cell, paramDict] of params) {

            if (!("from" in paramDict)) {
                newMsgs.push(Err(`Missing 'from' argument to replace'`,
                    "'replace:' requires a 'from' argument (e.g. 'from text')", 
                    this.cell.pos));
                continue;
            }
            const fromArg = paramDict["from"];
            if (!("to" in paramDict)) {
                newMsgs.push(Err(`Missing 'to' argument to replace'`,
                    "'replace:' requires a 'to' argument (e.g. 'to text')", 
                    this.cell.pos));
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
            return sibling.msg(paramMsgs).msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinRuleGrammar(this.tape, sibling, replaceRules);
        result = new LocatorGrammar(this.cell, result);
        return result.msg(paramMsgs).msg(sibMsgs).msg(newMsgs);
    }
}

export class TstReplace extends TstBinary {

    public static VALID_PARAMS = [ "from", "to", "pre", "post" ];

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstReplace(this.cell, s, c));
    }

    public toGrammar(env: TransEnv): GrammarResult {

        let [params, paramMsgs] = this.child.toParamsTable(env).destructure();
        let [sibling, sibMsgs] = this.sibling.toGrammar(env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

        for (const [cell, paramDict] of params) {

            if (!("from" in paramDict)) {
                newMsgs.push(Err(`Missing 'from' argument to replace'`,
                    "'replace:' requires a 'from' argument (e.g. 'from text')",
                    this.cell.pos));
                continue;
            }

            const fromArg = paramDict["from"];
            if (!("to" in paramDict)) {
                newMsgs.push(Err(`Missing 'to' argument to replace'`,
                    "'replace:' requires a 'to' argument (e.g. 'to text')",
                    this.cell.pos));
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
            return sibling.msg(paramMsgs).msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinReplaceGrammar(sibling, replaceRules);
        result = new LocatorGrammar(this.cell, result);
        return result.msg(paramMsgs).msg(sibMsgs).msg(newMsgs);
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

    public toGrammar(env: TransEnv): GrammarResult {
        
        let result = this.sibling.toGrammar(env);

        const [params, msgs] = this.child.toParamsTable(env).destructure();
        for (const [cell, paramDict] of params) {
            const testInputs = paramDict["__"];
            if (testInputs == undefined) {
                msgs.push(Err("Missing test inputs",
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
                    msgs.push(Err("Ill-formed unique",
                        `Somewhere in this row there is an ill-formed uniqueness constraint.  ` +
                        `Uniqueness constrains can only be literals.`, errLoc.pos));
                    continue;
                }
            }
            result = result.bind(c => new UnitTestGrammar(c, testInputs, uniques))
                           .bind(c => new LocatorGrammar(cell, c));
        }

        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(this.cell, c));
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

    public toGrammar(env: TransEnv): GrammarResult {

        let result = this.sibling.toGrammar(env);

        const [params, msgs] = this.child.toParamsTable(env).destructure();
        for (const [cell, paramDict] of params) {
            for (const [key, grammar] of Object.entries(paramDict)) {
                result = result.bind(c => new NegativeUnitTestGrammar(c, grammar))
                               .bind(c => new LocatorGrammar(cell, c));
            }   
        }
        
        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(this.cell, c));
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

    constructor(
        cell: Cell,    
        public sibling: TstComponent = new TstEmpty(),
        public child: TstComponent = new TstEmpty(),    
        public headers: TstHeader[] = [],
        public rows: TstRow[] = []
    ) {
        super(cell, sibling, child);
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        const [sib, sMsgs] = f.transform(this.sibling, env).destructure();
        const [child, cMsgs] = f.transform(this.child, env).destructure();
        const [headers, hMsgs] = resultList(this.headers)
                        .map(c => f.transform(c, env))
                        .destructure() as [TstHeader[], Msgs];
        const [rows, rMsgs] = resultList(this.rows)
                        .map(c => f.transform(c, env))
                        .destructure() as [TstRow[], Msgs];
        return new TstTable(this.cell, sib, child, headers, rows)
                     .msg(sMsgs).msg(cMsgs).msg(hMsgs).msg(rMsgs);
    }

    public addHeader(header: TstHeader): void {        
        this.headers.push(header);
    }

    public findHeader(col: number): TstHeader | undefined {
        /* yeah, it's more efficient to put 'em in map
           but we do this rarely and there aren't that many */
        for (const header of this.headers) {
            if (header.pos.col == col) {
                return header;
            }
        }
        return undefined;
    }

    public addContent(cell: Cell): void {
        // make sure we have a header
        const headerCell = this.findHeader(cell.pos.col);
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
            this.rows.push(new TstRow(cell));
        }

        const lastRow = this.rows[this.rows.length-1];
        lastRow.addContent(headerCell, cell);

    }

    public addChild(newChild: TstComponent): TstComponent {
        throw new Error("TstTables cannot have children");
    }

    public toGrammar(env: TransEnv): GrammarResult {
        // unless it's being interpreted as a paramTable, tables
        // have the semantics of alternation
        const alternatives: Grammar[] = [];

        const [params, msgs] = this.toParamsTable(env).destructure();
        for (const [cell, paramDict] of params) {
            for (const [key, grammar] of Object.entries(paramDict)) {

                if (grammar instanceof EpsilonGrammar) {
                    // if a row evaluates as empty, don't consider it an
                    // alternative
                    continue;
                }

                alternatives.push(grammar);
            }
        }

        return new AlternationGrammar(alternatives).msg(msgs);
    }

    public toParamsTable(env: TransEnv): Result<[Cell, ParamDict][]> {
        const results: [Cell, ParamDict][] = [];
        const msgs: Msgs = [];
        for (const row of this.rows) {
            const [rowParams, rowMsgs] = row.toParams(env).destructure();
            results.push([row.cell, rowParams]);
            msgs.push(...rowMsgs);
        }
        return resultList(results).msg(msgs);
    }
}

export class TstSequence extends TstCellComponent {

    constructor(
        cell: Cell,
        public children: TstComponent[] = []
    ) { 
        super(cell);
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList(this.children)
                   .map(c => f.transform(c, env))
                   .bind((cs) => new TstSequence(this.cell, cs));
    }

    public addContent(header: TstHeader, cell: Cell): void {
        const newCell = new TstHeadedCell(header, cell);
        cell.message(new ContentMsg(
            header.getBackgroundColor(),
            header.getFontColor()
        ));
        this.children.push(newCell);
    }
    
    public toGrammar(env: TransEnv): GrammarResult {
        return resultList(this.children)
                  .map(c => c.toGrammar(env))
                  .bind(cs => new SequenceGrammar(cs));
    }

}

/**
 * Expresses a row as a map of named parameters
 */
export class TstRow extends TstCellComponent {

    constructor(
        cell: Cell,
        public params: {[s: string]: TstSequence} = {}
    ) {
        super(cell);
    }
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultDict(this.params)
                .map(c => f.transform(c, env) as Result<TstSequence>)
                .bind(cs => new TstRow(this.cell, cs));
    }

    public addContent(header: TstHeader, cell: Cell): void {
        // get the param name and make sure it's in .params
        const tag = header.header.getParamName();
        if (!(tag in this.params)) {
            this.params[tag] = new TstSequence(cell);
        }
        this.params[tag].addContent(header, cell);
    }

    public toGrammar(env: TransEnv): GrammarResult {
        return new EpsilonGrammar().msg()
            .err("Unexpected parameters",
                "The operator to the left does not expect named parameters.");
    } 

    public toParams(env: TransEnv): Result<ParamDict> {
        return resultDict(this.params).map(c => c.toGrammar(env));
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

    public toGrammar(env: TransEnv): GrammarResult {
        return this.child.toGrammar(env);
    }

}

export class TstNamespace extends TstCellComponent {

    constructor(
        cell: Cell,
        public children: TstComponent[] = []
    ) {
        super(cell);
    }
    
    public addChild(child: TstComponent): TstComponent {
        this.children.push(child);
        return child;
    }

    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList(this.children)
                .map(c => f.transform(c, env) as Result<TstEnclosure>)
                .bind(cs => new TstNamespace(this.cell, cs));
    }

    public toGrammar(env: TransEnv): GrammarResult {
        const ns = new NsGrammar();
        const msgs: Msgs = [];
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const isLastChild = i == this.children.length - 1;
            const [grammar, childMsgs] = this.children[i].toGrammar(env).destructure();
            msgs.push(...childMsgs);
            if (!(child instanceof TstAssignment) && !isLastChild) {
                // warn that the child isn't going to be assigned to anything
                msgs.push(Warn(
                    "This content doesn't end up being assigned to anything and will be ignored.", 
                    child.pos));
                continue;
            }

            if (isLastChild) {
                ns.addSymbol("__DEFAULT__", grammar);
            }

            if (child instanceof TstAssignment) {
                const referent = ns.getSymbol(child.trimmedText);
                if (referent != undefined) {
                    // we're reassigning an existing symbol!
                    msgs.push(Err('Reassigning existing symbol', 
                        `The symbol ${child.trimmedText} already refers to another grammar above.`,
                        child.pos));
                    continue;
                }     
                ns.addSymbol(child.trimmedText, grammar);
            }
            
        }
        return ns.msg(msgs);
    }

}

export class TstProject extends TstNamespace {
    
    public transform(f: TstTransform, env: TransEnv): TstResult {
        return resultList(this.children)
                .map(c => f.transform(c, env) as Result<TstEnclosure>)
                .bind(cs => new TstNamespace(this.cell, cs));
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
    public addChild(child: TstComponent): TstComponent {
        if (!(child instanceof TstNamespace)) {
            throw new Error("Attempting to add a non-namespace to a project");
        }

        // first wrap it in an assignment
        const newChild = new TstAssignment(child.cell);
        newChild.addChild(child);
        // then add the assign as our own child
        return super.addChild(newChild);
        return child;
    }
}