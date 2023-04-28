
/**
 * TSTS -- "tabular syntax trees" -- represent the structure of the program
 * in terms of the high-level tabular syntax: the structures, operators, headers,
 * content, etc. that the programmer is laying out on the grid.  (As opposed to the
 * more abstract grammar that they're representing thereby.)
 */

import { Cell, CellPos } from "./util";
import {
    DEFAULT_SATURATION,
    DEFAULT_VALUE,
    Header,
} from "./headers";
import { 
    Msgs, 
    Result, resultList, 
    Warn, resultDict, 
    ResultVoid, unit
} from "./msgs";
import { PassEnv } from "./passes";
import { Op } from "./ops";
import { Component, CPass, CResult } from "./components";

/**
 * A TstCellComponent is just any TstComponent that has a
 * cell.
 */
export abstract class TstCellComponent extends Component {

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

}

export class TstHeader extends TstCellComponent {

    constructor(
        cell: Cell,
        public header: Header
    ) {
        super(cell);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new TstHeader(this.cell, this.header).msg();
    }

    public getBackgroundColor(saturation: number = DEFAULT_SATURATION, value: number = DEFAULT_VALUE): string {
        return this.header.getBackgroundColor(saturation, value);
    }

}

export class TstContent extends TstCellComponent {

    constructor(
        cell: Cell,
    ) {
        super(cell);
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return new TstContent(this.cell).msg();
    }

}

export abstract class TstEnclosure extends TstCellComponent {

    constructor(
        cell: Cell, 
        public sibling: Component = new TstEmpty()
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
        public sibling: Component = new TstEmpty(),
        public rows: TstRow[] = []
    ) {
        super(cell, sibling)
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
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
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
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
        sibling: Component = new TstEmpty(),
        rows: TstRow[] = [],
        public headers: TstHeader[] = []
        
    ) {
        super(cell, sibling, rows)
    }
    
    public providesParam(param: string): boolean {
        return this.headers.some(h => 
                    param == h.header.getParamName());
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
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
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }

}

export class TstRename extends TstCellComponent {

    constructor(
        public prev: Component,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }
    
}

export class TstHide extends TstCellComponent {

    constructor(
        public prev: Component,
        content: Cell
    ) { 
        super(content);
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }
    
}

export class TstFilter extends TstCellComponent {

    constructor(
        public prev: Component,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
    }
    
}

export class TstEmpty extends Component {

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return this.msg();
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
export abstract class TstBinary extends TstEnclosure {

    constructor(
        cell: Cell,    
        sibling: Component = new TstEmpty(),
        public child: Component = new TstEmpty()
    ) {
        super(cell, sibling);
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
        sibling: Component = new TstEmpty(),
        child: Component = new TstEmpty()
    ) { 
        super(cell, sibling, child);
    }
        
    public mapChildren(f: CPass, env: PassEnv): CResult {
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

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
                .bind(c => new TstTable(this.cell, c as TstParamList));
    }

}

export class TstOr extends TstBinary {

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstOr(this.cell, s, c));
    }
}


export class TstJoin extends TstBinary {

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstJoin(this.cell, s, c));
    }
}

export class TstReplaceTape extends TstCellComponent {

    constructor(
        cell: Cell,
        public tape: string,
        public sibling: Component,
        public child: TstParamList
    ) { 
        super(cell);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstReplaceTape(this.cell, this.tape, 
                s, c as TstParamList));
    }

}

export class TstReplace extends TstCellComponent {

    constructor(
        cell: Cell,
        public sibling: Component,
        public child: TstParamList
    ) { 
        super(cell);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstReplace(this.cell, 
                        s, c as TstParamList));
    }
}

/**
 * "test" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has an output when filtering the table above.
 */
export class TstTest extends TstCellComponent {

    constructor(
        cell: Cell,
        public sibling: Component,
        public child: TstParamList
    ) { 
        super(cell);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.sibling, this.child])
                .map(c => f.transform(c, env))
                .bind(([s,c]) => new TstTest(this.cell, s, c as TstParamList));
    }


}

/**
 * "testnot" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has no output when filtering the table above.
 */
export class TstTestNot extends TstTest {

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList([this.sibling, this.child])
            .map(c => f.transform(c, env))
            .bind(([s,c]) => new TstTestNot(this.cell, s, c as TstParamList));
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

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList(this.rows)
                    .map(r => f.transform(r, env))
                    .bind(rs => new TstParamList(this.cell, rs as TstParams[]));
    }
}

export class TstSequence extends TstCellComponent {

    constructor(
        cell: Cell,
        public children: Component[] = []
    ) { 
        super(cell);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList(this.children)
                   .map(c => f.transform(c, env))
                   .bind((cs) => new TstSequence(this.cell, cs));
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
        public params: {[s: string]: Component} = {}
    ) {
        super(cell);
    }
    
    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultDict(this.params)
                .map(c => f.transform(c, env))
                .bind(cs => new TstParams(this.cell, cs));
    }

    public getParam(name: string): Component {
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
        public child: Component = new TstEmpty()
    ) {
        super(cell);
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return f.transform(this.child, env)
            .bind(c => new TstAssignment(this.cell, this.name, c));
    }

}

export class TstCollection extends TstCellComponent {

    constructor(
        cell: Cell,
        public children: Component[] = []
    ) {
        super(cell);
    }
    
    public addChild(child: Component): ResultVoid {
        this.children.push(child);
        return unit;
    }

    public mapChildren(f: CPass, env: PassEnv): CResult {
        return resultList(this.children)
                .map(c => f.transform(c, env) as Result<TstEnclosure>)
                .bind(cs => new TstCollection(this.cell, cs));
    }

}