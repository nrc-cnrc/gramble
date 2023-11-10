/**
 * TSTS -- "tabular syntax trees" -- represent the structure of the program
 * in terms of the high-level tabular syntax: the structures, operators, headers,
 * content, etc. that the programmer is laying out on the grid.  (As opposed to the
 * more abstract grammar that they're representing thereby.)
 */

import { Cell, Pos } from "./utils/cell";
import {
    Header,
    paramName,
} from "./headers";
import { 
    Msgs, Warn, 
    ResultVoid, unit, Result
} from "./utils/msgs";
import { Op } from "./ops";
import { Component } from "./components";
import { Pass, PassEnv } from "./passes";

export type TST = TstHeader
         | TstContent
         | TstGrid
         | TstRow
         | TstHeadedGrid
         | TstHeaderPair
         | TstRename
         | TstHide
         | TstFilter
         | TstEmpty
         | TstOp
         | TstTable
         | TstOr
         | TstJoin
         | TstReplace
         | TstTest
         | TstTestNot
         | TstParamList
         | TstSequence
         | TstAssignment
         | TstCollection;


export abstract class AbstractTST extends Component {

    public mapChildren(f: Pass<TST,TST>, env: PassEnv): Result<TST> {
        return super.mapChildren(f, env) as Result<TST>;
    }

}


/**
 * A TstCellComponent is just any TstComponent that has a
 * cell.
 */
export abstract class TstCellComponent extends AbstractTST {

    constructor(
        public cell: Cell
    ) { 
        super();
    }

    public get text(): string {
        return this.cell.text;
    }

    public get pos(): Pos {
        return this.cell.pos;
    }

}

export class TstHeader extends TstCellComponent {
    public readonly tag = "header";

    constructor(
        cell: Cell,
        public header: Header
    ) {
        super(cell);
    }

}

export class TstContent extends TstCellComponent {
    public readonly tag = "content";

    constructor(
        cell: Cell,
    ) {
        super(cell);
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

export type Enclosure = TstGrid 
                      | TstHeadedGrid
                      | TstOp
                      | TstOr
                      | TstJoin

export abstract class TstEnclosure extends TstCellComponent {

    constructor(
        cell: Cell, 
        public sibling: TST = new TstEmpty()
    ) {
        super(cell)
    }

    public setSibling(sibling: TST): void {
        this.sibling = sibling;
    }

    public abstract setChild(child: TST): ResultVoid;

}

/**
 * A grid is a rectangular region of the grid with no semantics
 * yet (cells in the first row aren't yet headers, cells in 
 * subsequent rows aren't yet associated with headers, etc.)
 */
 export class TstGrid extends TstEnclosure {
    public readonly tag = "grid";

    constructor(
        cell: Cell, 
        public sibling: TST = new TstEmpty(),
        public rows: TstRow[] = []
    ) {
        super(cell, sibling)
    }
    
    public setChild(newChild: TST): ResultVoid {
        throw new Error("TstGrids cannot have children");
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
    public readonly tag = "row";

    constructor(
        cell: Cell, 
        public content: TstContent[] = []
    ) {
        super(cell)
    }
    
    public addContent(cell: Cell): ResultVoid {
        const content = new TstContent(cell);
        this.content.push(content);
        return unit;
    }
}

export class TstHeadedGrid extends TstEnclosure {
    public readonly tag = "headedgrid";

    constructor(
        cell: Cell, 
        sibling: TST = new TstEmpty(),
        public rows: TstRow[] = [],
        public headers: TstHeader[] = []
    ) {
        super(cell, sibling);
    }
    
    public setChild(newChild: TST): ResultVoid {
        throw new Error("TstHEadedGrids cannot have children");
    }
    
    public providesParam(param: string): boolean {
        return this.headers.some(h => 
                    param == paramName(h.header));
    }
}

export class TstHeaderPair extends TstCellComponent {
    public readonly tag = "headerpair";
    constructor(
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }

}

export class TstRename extends TstCellComponent {
    public readonly tag ="rename";

    constructor(
        public prev: TST,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
}

export class TstHide extends TstCellComponent {
    public readonly tag ="hide";

    constructor(
        public prev: TST,
        content: Cell
    ) { 
        super(content);
    }
    
}

export class TstFilter extends TstCellComponent {
    public readonly tag = "filter";

    constructor(
        public prev: TST,
        public header: TstHeader,
        content: Cell
    ) { 
        super(content);
    }
    
}

export class TstEmpty extends AbstractTST {
    public readonly tag = "empty";
}

export abstract class TstBinary extends TstEnclosure {

    constructor(
        cell: Cell,    
        sibling: TST = new TstEmpty(),
        public child: TST = new TstEmpty()
    ) {
        super(cell, sibling);
    }

    public setChild(child: TST): ResultVoid {

        const msgs: Msgs = [];

        if (this.child instanceof TstEnclosure && 
                child.pos !== undefined &&
                this.child.pos.col != child.pos.col) {
            Warn("This operator is in an unexpected column.  Did you " +
                `mean for it to be in column ${this.child.pos.col}, ` + 
                `so that it's under the operator in cell ${this.child.pos}?`)
                .localize(child.pos).msgTo(msgs);
        }

        if (child instanceof TstBinary || child instanceof TstGrid) {
            child.sibling = this.child;
        }
        this.child = child;
        return unit.msg(msgs);
    }

}

/**
 * TstOps are a placeholder for operators (e.g. "join:", 
 * "replace text:") before we're determined exactly which
 * operator they represent.
 */
export class TstOp extends TstBinary {
    public readonly tag = "op";

    constructor(
        cell: Cell,
        public op: Op,
        sibling: TST = new TstEmpty(),
        child: TST = new TstEmpty()
    ) { 
        super(cell, sibling, child);
    }

}

/**
 * A TstTable represents the explicit "table:" operator.  The 
 * Tst object representing the actual grid of cells is a TstGrid.
 */ 
export class TstTable extends TstCellComponent {
    public readonly tag = "table";

    constructor(
        cell: Cell,
        public child: TstParamList
    ) {
        super(cell);
    }

}

export class TstOr extends TstBinary {
    public readonly tag = "or";
}


export class TstJoin extends TstBinary {
    public readonly tag = "join";
}

export class TstReplace extends TstCellComponent {
    public readonly tag = "replace";

    constructor(
        cell: Cell,
        public tape: string,
        public sibling: TST,
        public child: TstParamList
    ) { 
        super(cell);
    }

}

/**
 * "test" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has an output when filtering the table above.
 */
export class TstTest extends TstCellComponent {
    public readonly tag = "test";

    constructor(
        cell: Cell,
        public sibling: TST,
        public child: TstParamList
    ) { 
        super(cell);
    }

}

/**
 * "testnot" is an operator that takes two tables, one above (spatially speaking)
 * and one to the right, and makes sure that each line of the one to the right
 * has no output when filtering the table above.
 */
export class TstTestNot extends TstCellComponent {
    public readonly tag = "testnot";
    
    constructor(
        cell: Cell,
        public sibling: TST,
        public child: TstParamList
    ) { 
        super(cell);
    }
}

/**
 * TstParamList is what TstGrids eventually turn into, 
 * just a list of TstParam objects to be interpreted by 
 * the operator that encloses them.
 */
export class TstParamList extends TstCellComponent {
    public readonly tag = "paramlist";
    constructor(
        cell: Cell, 
        public rows: TstParams[] = []
    ) {
        super(cell);
    }
}

export class TstSequence extends TstCellComponent {
    public readonly tag = "seq";
    constructor(
        cell: Cell,
        public children: TST[] = []
    ) { 
        super(cell);
    }
}

/**
 * TstParams are the result of parsing, validating, and associating headers
 * with content cells, and then segregating them by tag, so that content
 * with the same tag (e.g. "from", "unique") are in same-tag TstSequences.
 * 
 * The correspond to rows in the table, after param parsing.
 */
export class TstParams extends TstCellComponent {
    public readonly tag = "params";

    constructor(
        cell: Cell,
        public params: {[s: string]: TST} = {}
    ) {
        super(cell);
    }

    public getParam(name: string): TST {
        if (name in this.params) {
            return this.params[name];
        }
        return new TstEmpty();
    }
}

export class TstAssignment extends TstCellComponent {
    public readonly tag = "assign";
    
    constructor(
        cell: Cell,
        public name: string,
        public child: TST = new TstEmpty()
    ) {
        super(cell);
    }

}

export class TstCollection extends TstCellComponent {
    public readonly tag = "collection";

    constructor(
        cell: Cell,
        public children: TST[] = []
    ) {
        super(cell);
    }
    
    public addChild(child: TST): ResultVoid {
        this.children.push(child);
        return unit;
    }

}