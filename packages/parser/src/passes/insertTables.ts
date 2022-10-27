import { 
    TableOp, 
} from "../ops";
import { resultList } from "../msgs";
import { PassEnv } from "../passes";
import { 
    TstOp, 
    TstEmpty,
    TstGrid,
    TstCollection
} from "../tsts";
import { Component, CPass, CResult } from "../components";

/**
 * This pass goes through and make sure that TstOps have 
 * the structural parameters (i.e. .sibling and .child) that they
 * need to be interpreted, and also ensures that these are the
 * right types (e.g., that they're grids when they need to be 
 * grids, types when they need to be types, that they're not
 * assignments, etc.)
 */

export class InsertTables extends CPass {

    public get desc(): string {
        return "Inserting tables";
    }

    public transform(t: Component, env: PassEnv): CResult {
        return t.mapChildren(this, env).bind(t => {
            switch (t.constructor) {
                case TstOp: 
                    return this.handleOp(t as TstOp);
                case TstCollection: 
                    return this.handleCollection(t as TstCollection);
                default: return t;
            }
        });
    }

    public handleCollection(t: TstCollection): CResult {
        return resultList(t.children).map(c => {
            if (c instanceof TstGrid) {
                return new TstOp(c.cell, new TableOp(), 
                                new TstEmpty(), c);
            }
            return c;
        }).bind(cs => new TstCollection(t.cell, cs));
    }

    public handleOp(t: TstOp): TstOp {

        // TstGrid siblings are always interpreted as tables
        if (t.sibling instanceof TstGrid) {
            t.sibling = new TstOp(t.sibling.cell, new TableOp(),
                                new TstEmpty(), t.sibling);
        }

        // if the op forbids a grid to the right (e.g. it needs another
        // operator), but there's a grid, that's fine, just insert an implicit
        // table op between the op and its child.
        if (t.op.childGridReq == "forbidden" && t.child instanceof TstGrid) {
            t.child = new TstOp(t.child.cell, new TableOp(), 
                                new TstEmpty(), t.child);
        }

        return t;
    }
}