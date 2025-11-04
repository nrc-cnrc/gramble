import { PassEnv } from "../components.js";
import { 
    AutoTableOp, childMustBeGrid, 
} from "../ops.js";
import { AutoPass } from "../passes.js";
import { 
    TstOp, 
    TstEmpty,
    TstGrid,
    TstCollection,
    TST
} from "../tsts.js";

/**
 * This pass goes through and make sure that TstOps have 
 * the structural parameters (i.e. .sibling and .child) that they
 * need to be interpreted, and also ensures that these are the
 * right types (e.g., that they're grids when they need to be 
 * grids, types when they need to be types, that they're not
 * assignments, etc.)
 */

export class InsertTables extends AutoPass<TST> {

    public postTransform(t: TST, env: PassEnv): TST {
        switch (t.tag) {
            case "op":         return this.handleOp(t);
            case "collection": return this.handleCollection(t);
            default:           return t;
        }
    }

    public handleCollection(t: TstCollection): TST {
        const newChildren = t.children.map(c => {
            if (c instanceof TstGrid) {
                return new TstOp(c.cell, new AutoTableOp(), 
                                new TstEmpty(), c);
            }
            return c;
        })
        return new TstCollection(t.cell, newChildren);
    }

    public handleOp(t: TstOp): TST {

        // TstGrid siblings are always interpreted as tables
        if (t.sibling instanceof TstGrid) {
            t.sibling = new TstOp(t.sibling.cell, new AutoTableOp(),
                                new TstEmpty(), t.sibling);
        }

        // if the op forbids a grid to the right (e.g. it needs another
        // operator), but there's a grid, that's fine, just insert an implicit
        // table op between the op and its child.
        if (childMustBeGrid(t.op) == "forbidden" && t.child instanceof TstGrid) {
            t.child = new TstOp(t.child.cell, new AutoTableOp(), 
                                new TstEmpty(), t.child);
        }

        return t;
    }
}
