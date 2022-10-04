
/**
 * TSTS -- "tabular syntax trees" -- represent the structure of the program
 * in terms of the high-level tabular syntax: the structures, operators, headers,
 * content, etc. that the programmer is laying out on the grid.  (As opposed to the
 * more abstract grammar that they're representing thereby.)
 */

import { 
    Grammar, NsGrammar, AlternationGrammar, 
    EpsilonGrammar, UnitTestGrammar, 
    NegativeUnitTestGrammar, SequenceGrammar, 
    ReplaceGrammar, JoinReplaceGrammar, 
    LiteralGrammar, JoinRuleGrammar, 
    LocatorGrammar, RenameGrammar,
    EqualsGrammar, HideGrammar,
    GrammarResult,
} from "./grammars";
import { Cell, CellPos, Dict, TreeNode } from "./util";
import {
    DEFAULT_SATURATION,
    DEFAULT_VALUE,
    Header,
    TapeNameHeader
} from "./headers";
import { ContentMsg, Err, Msg, Msgs, Result, resultList, Warn, resultDict, ResultVoid, unit, result } from "./msgs";
import { Pass, PassEnv } from "./passes";
import { BLANK_PARAM, Op } from "./ops";


export type ParamDict = Dict<Grammar>;
export class TstResult extends Result<TstComponent> { }
export abstract class TstPass extends Pass<TstComponent,TstComponent> {}

type BinaryOp = (c1: Grammar, c2: Grammar) => Grammar;

export abstract class TstComponent {

    public get pos(): CellPos | undefined {
        return undefined;
    }   

    public abstract toGrammar(env: PassEnv): GrammarResult;
    public abstract mapChildren(f: TstPass, env: PassEnv): TstResult;

    public msg(m: Msg | Msgs = []): TstResult {
        return result(this).msg(m);
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

    public toGrammar(env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
    }

}

export class TstHeader extends TstCellComponent {

    constructor(
        cell: Cell,
        public header: Header
    ) {
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
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

export class TstContent extends TstCellComponent {

    constructor(
        cell: Cell,
    ) {
        super(cell);
    }
    
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return new TstContent(this.cell).msg();
    }

}

export abstract class TstEnclosure extends TstCellComponent {

    constructor(
        cell: Cell, 
        public sibling: TstComponent = new TstEmpty()
    ) {
        super(cell)
    }

    public setSibling(sibling: TstEnclosure): void {
        this.sibling = sibling;
    }

    public abstract setChild(child: TstEnclosure): ResultVoid;

}

/**
 * A pre-grid is a rectangular region of the grid with no semantics
 * yet (cells in the first row aren't yet headers, cells in 
 * subsequent rows aren't yet associated with headers, etc.)
 */
 export class TstGrid extends TstEnclosure {

    constructor(
        cell: Cell, 
        public sibling: TstComponent = new TstEmpty(),
        public rows: TstRow[] = []
    ) {
        super(cell, sibling)
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        const [sib, sibMsgs] = f.transform(this.sibling, env).destructure();
        const [rows, rowMsgs] = resultList(this.rows)
                                    .map(c => f.transform(c, env))
                                    .destructure() as [TstRow[], Msgs];
        return new TstGrid(this.cell, sib, rows).msg(sibMsgs).msg(rowMsgs);
    }
    
    public setChild(newChild: TstEnclosure): ResultVoid {
        throw new Error("TstTables cannot have children");
    }

    public addContent(cell: Cell): ResultVoid {
        const msgs = unit;

        if (this.rows.length == 0 || cell.pos.row != this.rows[this.rows.length-1].pos.row) {
            // we need to start an new row
            this.rows.push(new TstRow(cell));
        }

        const lastRow = this.rows[this.rows.length-1];
        return lastRow.addContent(cell).msg(msgs);
    }
}

export class TstRow extends TstCellComponent {

    constructor(
        cell: Cell, 
        public content: TstContent[] = []
    ) {
        super(cell)
    }
    
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList(this.content)
                .map(c => f.transform(c, env))
                .bind(cs => new TstRow(this.cell, cs as TstContent[]));
    }
    
    public addContent(cell: Cell): ResultVoid {
        const content = new TstContent(cell);
        this.content.push(content);
        return unit;
    }
}

export class TstHeadedGrid extends TstGrid {

    constructor(
        cell: Cell, 
        sibling: TstComponent = new TstEmpty(),
        rows: TstRow[] = [],
        public headers: TstHeader[] = []
        
    ) {
        super(cell, sibling, rows)
    }
    
    public providesParam(param: string): boolean {
        return this.headers.some(h => 
                    param == h.header.getParamName());
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        const [sib, sibMsgs] = f.transform(this.sibling, env).destructure();
        const [rows, rowMsgs] = resultList(this.rows)
                            .map(c => f.transform(c, env))
                            .destructure() as [TstRow[], Msgs];
        const [headers, headerMsgs] = resultList(this.headers)
                            .map(c => f.transform(c, env))
                            .destructure() as [TstHeader[], Msgs];
        return new TstHeadedGrid(this.cell, sib, rows, headers)
                        .msg(sibMsgs).msg(rowMsgs).msg(headerMsgs);

    }
}

export class TstHeaderContentPair extends TstCellComponent {

    constructor(
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return this.msg();
    }

    public toGrammar(env: PassEnv): GrammarResult {
        return this.header.headerToGrammar(this.cell)
                    .bind(c => new LocatorGrammar(this.cell.pos, c));
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
    
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return this.msg();
    }
    
    public toGrammar(env: PassEnv): GrammarResult {
        if (!(this.header.header instanceof TapeNameHeader)) {
            return new EpsilonGrammar().msg()
                .err("Renaming error",
                    "Rename (>) needs to have a tape name after it");
        }
        const fromTape = this.cell.text;
        const toTape = this.header.header.text;
        return this.prev.toGrammar(env)
                    .bind(c => new RenameGrammar(c, fromTape, toTape))
                    .bind(c => new LocatorGrammar(this.cell.pos, c));
    }
}

export class TstHide extends TstCellComponent {

    constructor(
        public prev: TstComponent,
        content: Cell
    ) { 
        super(content);
    }
    
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return this.msg();
    }
    
    public toGrammar(env: PassEnv): GrammarResult {
        let result = this.prev.toGrammar(env);
        for (const tape of this.cell.text.split("/")) {
            result = result.bind(c => new HideGrammar(c, tape.trim()));
        }
        return result.bind(c => new LocatorGrammar(this.cell.pos, c));
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

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return this.msg();
    }
    
    public toGrammar(env: PassEnv): GrammarResult {
        const [prevGrammar, prevMsgs] = this.prev.toGrammar(env).destructure();
        const [grammar, msgs] = this.header.headerToGrammar(this.cell)
                                           .destructure();
        const result = new EqualsGrammar(prevGrammar, grammar);
        const locatedResult = new LocatorGrammar(this.cell.pos, result);
        return locatedResult.msg(prevMsgs).msg(msgs);
    }
}

export class TstEmpty extends TstComponent {

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return this.msg();
    }

    public toGrammar(env: PassEnv): GrammarResult {
        return new EpsilonGrammar().msg();
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
export class TstBinary extends TstEnclosure {

    constructor(
        cell: Cell,    
        sibling: TstComponent = new TstEmpty(),
        public child: TstComponent = new TstEmpty()
    ) {
        super(cell, sibling);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstBinary(this.cell, s, c));
    }

    public toGrammar(env: PassEnv): GrammarResult {

        // we only ever end up in this base EncloseComponent compile if it wasn't
        // a known operator.  this is an error, but we flag it for the programmer
        // elsewhere.

        return resultList([this.sibling, this.child])
                    .map(c => c.toGrammar(env))
                    .bind(([s,c]) => new LocatorGrammar(this.cell.pos, s));
    }

    public setChild(child: TstEnclosure): ResultVoid {

        const msgs: Msgs = [];

        if (this.child instanceof TstEnclosure &&
                this.child.pos.col != child.pos.col) {
            Warn("This operator is in an unexpected column.  Did you " +
                `mean for it to be in column ${this.child.pos.col}, ` + 
                `so that it's under the operator in cell ${this.child.pos}?`,
                child.pos).msgTo(msgs);
        }

        if (child instanceof TstBinary || child instanceof TstGrid) {
            child.sibling = this.child;
        }
        this.child = child;
        return unit.msg(msgs);
    }

}

export class TstOp extends TstBinary {

    constructor(
        cell: Cell,
        public op: Op,
        sibling: TstComponent = new TstEmpty(),
        child: TstComponent = new TstEmpty()
    ) { 
        super(cell, sibling, child);
    }
        
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstOp(this.cell, this.op, s, c));
    }

}

export class TstTable extends TstCellComponent {

    constructor(
        cell: Cell,
        public child: TstParamList
    ) {
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return f.transform(this.child, env)
                .bind(c => new TstTable(this.cell, c as TstParamList));
    }
    
    public toGrammar(env: PassEnv): GrammarResult {
        return resultList(this.child.rows)
                  .map(r => r.getParam(BLANK_PARAM).toGrammar(env))
                  .bind(cs => new AlternationGrammar(cs))
                  .bind(c => new LocatorGrammar(this.cell.pos, c))
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

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstBinaryOp(this.cell, this.op, s, c));
    }
    
    public toGrammar(env: PassEnv): GrammarResult {
        return resultList([this.sibling, this.child])
                    .map(c => c.toGrammar(env))
                    .bind(([s,c]) => this.op(s,c));
    }
}

export class TstReplaceTape extends TstCellComponent {

    constructor(
        cell: Cell,
        public tape: string,
        public sibling: TstComponent,
        public child: TstParamList
    ) { 
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstReplaceTape(this.cell, this.tape, 
                s, c as TstParamList));
    }

    public toGrammar(env: PassEnv): GrammarResult {

        let [sibling, sibMsgs] = this.sibling.toGrammar(env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

        for (const params of this.child.rows) {
            const fromArg = params.getParam("from").toGrammar(env).msgTo(newMsgs);
            const toArg = params.getParam("to").toGrammar(env).msgTo(newMsgs);
            const preArg = params.getParam("pre").toGrammar(env).msgTo(newMsgs);
            const postArg = params.getParam("post").toGrammar(env).msgTo(newMsgs);
            const replaceRule = new ReplaceGrammar(fromArg, toArg, preArg, postArg);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return sibling.msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinRuleGrammar(this.tape, sibling, replaceRules);
        result = new LocatorGrammar(this.cell.pos, result);
        return result.msg(sibMsgs).msg(newMsgs);
    }
}

export class TstReplace extends TstCellComponent {

    constructor(
        cell: Cell,
        public sibling: TstComponent,
        public child: TstParamList
    ) { 
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstReplace(this.cell, 
                        s, c as TstParamList));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        let [sibling, sibMsgs] = this.sibling.toGrammar(env).destructure();
        const replaceRules: ReplaceGrammar[] = [];
        const newMsgs: Msgs = [];

        for (const params of this.child.rows) {
            const fromArg = params.getParam("from").toGrammar(env).msgTo(newMsgs);
            const toArg = params.getParam("to").toGrammar(env).msgTo(newMsgs);
            const preArg = params.getParam("pre").toGrammar(env).msgTo(newMsgs);
            const postArg = params.getParam("post").toGrammar(env).msgTo(newMsgs);
            const replaceRule = new ReplaceGrammar(fromArg, toArg, preArg, postArg);
            replaceRules.push(replaceRule);
        }

        if (replaceRules.length == 0) {
            return sibling.msg(sibMsgs).msg(newMsgs);  // in case every rule fails, at least generate something
        }

        let result: Grammar = new JoinReplaceGrammar(sibling, replaceRules);
        result = new LocatorGrammar(this.cell.pos, result);
        return result.msg(sibMsgs).msg(newMsgs);
    }
}

/**
 * "test" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has an output when filtering the table above.
 */
export class TstUnitTest extends TstCellComponent {

    constructor(
        cell: Cell,
        public sibling: TstComponent,
        public child: TstParamList
    ) { 
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstUnitTest(this.cell, s, c as TstParamList));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        let result = this.sibling.toGrammar(env);

        const msgs: Msgs = [];
        for (const params of this.child.rows) {
            const testInputs = params.getParam(BLANK_PARAM).toGrammar(env).msgTo(msgs);
            const unique = params.getParam("unique").toGrammar(env).msgTo(msgs);
            const uniqueLiterals = unique.getLiterals();
            result = result.bind(c => new UnitTestGrammar(c, testInputs, uniqueLiterals))
                           .bind(c => new LocatorGrammar(params.pos, c));
        }

        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(this.cell.pos, c));
    }

}

/**
 * "testnot" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has no output when filtering the table above.
 */
export class TstNegativeUnitTest extends TstUnitTest {

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstNegativeUnitTest(this.cell, s, c as TstParamList));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        let result = this.sibling.toGrammar(env);

        const msgs: Msgs = [];
        for (const params of this.child.rows) {
            const testInputs = params.getParam(BLANK_PARAM).toGrammar(env).msgTo(msgs);
            result = result.bind(c => new NegativeUnitTestGrammar(c, testInputs))
                           .bind(c => new LocatorGrammar(params.pos, c));
        }
        
        return result.msg(msgs)
                     .bind(c => new LocatorGrammar(this.cell.pos, c));
    }
}

/**
 * TstParamList is what TstGrids eventually turn into, just a list of TstParam objects to be interpreted by the operator that encloses them.
 */
export class TstParamList extends TstCellComponent {

    constructor(
        cell: Cell, 
        public rows: TstParams[] = []
    ) {
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList(this.rows)
                    .map(r => f.transform(r, env))
                    .bind(rs => new TstParamList(this.cell, rs as TstParams[]));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        // param lists have no inherent semantics
        throw new Error("not implemented");
    }
}

export class TstSequence extends TstCellComponent {

    constructor(
        cell: Cell,
        public children: TstComponent[] = []
    ) { 
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList(this.children)
                   .map(c => f.transform(c, env))
                   .bind((cs) => new TstSequence(this.cell, cs));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        return resultList(this.children)
                  .map(c => c.toGrammar(env))
                  .bind(cs => new SequenceGrammar(cs));
    }

}

/**
 * TstParams are the result of parsing, validating, and associating headers
 * with content cells, and then segregating them by tag, so that content
 * with the same tag (e.g. "from", "unique") are in same-tag TstSequences.
 */
export class TstParams extends TstCellComponent {

    constructor(
        cell: Cell,
        public params: {[s: string]: TstSequence} = {}
    ) {
        super(cell);
    }
    
    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultDict(this.params)
                .map(c => f.transform(c, env) as Result<TstSequence>)
                .bind(cs => new TstParams(this.cell, cs));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        // params have no inherent semantics
        throw new Error("not implemented");
    } 

    public getParam(name: string): TstComponent {
        if (name in this.params) {
            return this.params[name];
        }
        return new TstEmpty();
    }
}

export class TstAssignment extends TstCellComponent {

    constructor(
        cell: Cell,
        public name: string,
        public child: TstComponent = new TstEmpty()
    ) {
        super(cell);
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return f.transform(this.child, env)
            .bind(c => new TstAssignment(this.cell, this.name, c));
    }

    public toGrammar(env: PassEnv): GrammarResult {
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
    
    public addChild(child: TstComponent): ResultVoid {
        this.children.push(child);
        return unit;
    }

    public mapChildren(f: TstPass, env: PassEnv): TstResult {
        return resultList(this.children)
                .map(c => f.transform(c, env) as Result<TstEnclosure>)
                .bind(cs => new TstNamespace(this.cell, cs));
    }

    public toGrammar(env: PassEnv): GrammarResult {
        const ns = new NsGrammar();
        const msgs: Msgs = [];
        for (let i = 0; i < this.children.length; i++) {
            const child = this.children[i];
            const isLastChild = i == this.children.length - 1;
            const grammar = this.children[i].toGrammar(env)
                                            .msgTo(msgs);
            if (!(child instanceof TstAssignment) && !isLastChild) {
                // warn that the child isn't going to be assigned to anything
                Warn(
                    "This content doesn't end up being assigned to anything and will be ignored.", 
                    child.pos).msgTo(msgs);
                continue;
            }

            if (isLastChild) {
                ns.addSymbol("__DEFAULT__", grammar);
            }

            if (child instanceof TstAssignment) {
                const referent = ns.getSymbol(child.name);
                if (referent != undefined) {
                    // we're reassigning an existing symbol!
                    Err('Reassigning existing symbol', 
                        `The symbol ${child.name} already refers to another grammar above.`,
                        child.pos).msgTo(msgs);
                    continue;
                }     
                ns.addSymbol(child.name, grammar);
            }
            
        }
        return ns.msg(msgs);
    }

}