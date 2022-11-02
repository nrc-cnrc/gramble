import { PassEnv } from "../passes";
import { Msgs, Warn } from "../msgs";
import { 
    TstCollection, 
    TstOp, TstEmpty, 
    TstEnclosure
} from "../tsts";
import { CollectionOp, SymbolOp } from "../ops";
import { Component, CPass, CResult } from "../components";
import { AUTO_SYMBOL_NAME, DEFAULT_SYMBOL_NAME } from "../util";

/**
 * Collections work somewhat differently from other operators,
 * so in this pass we take "collection:" TstOps and
 * instantiate them as actual TstCollections, before the pass where
 * we instantiate other TstOps.
 * 
 * Two important things this pass does is flatten out
 * the collection's children (they're in a binary tree after 
 * parsing, and that gets flattened out into an array here), as 
 * well as rescoping binary, non-assignment op children so that 
 * they belong to the previous assignment.
 * 
 * E.g., something like the following:
 * 
 * VERB:, text
 *      , foo
 *      ,
 * replace text:, from, to
 *              , f   , m
 * 
 * is rescoped so that it has the same semantics as:
 * 
 * VERB:, table:, text
 *      ,       , foo
 *      ,
 *      , replace text:, from, to
 *      ,              , f   , m
 * 
 * We also add a default symbol when one isn't defined, to
 * refer to the alternation of all defined symbols in the collection.
 */
export class CreateCollections extends CPass {

    public get desc(): string {
        return "Creating collections";
    }

    public transform(t: Component, env: PassEnv): CResult {

        switch(t.constructor) {
            case TstOp:
                return this.handleOp(t as TstOp, env);
            default: 
                return t.mapChildren(this, env);
        }
    }

    public handleOp(t: TstOp, env: PassEnv): CResult {

        const msgs: Msgs = [];

        if (!(t.op instanceof CollectionOp)) {
            return t.mapChildren(this, env);
        }

        const children: TstEnclosure[] = [];

        // flatten and reverse the results
        let child = t.child;
        while (child instanceof TstEnclosure) {
            children.push(child);
            const next = child.sibling;
            child.sibling = new TstEmpty();
            child = next;
        }
        children.reverse();

        // now rescope bare binary ops that immediately 
        // follow assignments
        const newChildren: TstEnclosure[] = [];
        for (const child of children) {

            if (!(child instanceof TstOp) || child.op.siblingReq != "required") {
                // not a child that participates in this 
                // scope change
                newChildren.push(child);
                continue;
            }

            const prev = newChildren.pop();
            if (prev == undefined) {
                // this is the first child, it's erroneous
                // to be here, but it will be detected later.
                newChildren.push(child);
                continue;
            }

            if (prev instanceof TstOp &&
                prev.op instanceof SymbolOp) {
                // the previous child is an assignment, 
                // so adjust the scope of the assignment so 
                // it includes this operator too
                child.sibling = prev.child;
                prev.child = child;
                newChildren.push(prev);
                continue;
            }

            // the child is a binary op, but the previous child
            // is not an assignment.  this will be fixed up later.
            child.sibling = prev;
            newChildren.push(child);

        }

        // next, we go through and make sure that everything is
        // assigned to some symbol.
        const evenMoreChildren = newChildren.map(c => {

            if (c instanceof TstOp && c.op instanceof SymbolOp) {
                // it's an assignment, we're already good
                return c;
            }

            if (newChildren.length < 2) {
                // it's not an assignment, but there aren't multiple
                // children, so go ahead and name this to the default symbol
                // name
                const op = new SymbolOp(DEFAULT_SYMBOL_NAME);
                return new TstOp(c.cell, op, new TstEmpty(), c);
            }

            // it's not an assignment and there are multiple children.
            // assign this to a dummy variable
            const newName = `${AUTO_SYMBOL_NAME}${c.pos.row+1}`;
            Warn("When there are multiple items in a " +
                "sheet/collection, each of them should be named. " +
                `We've temporarily named this ${newName}.`, 
                c.pos).msgTo(msgs);
            const op = new SymbolOp(newName);
            return new TstOp(c.cell, op, new TstEmpty(), c);
        });

        const newCollection = new TstCollection(t.cell, evenMoreChildren);
        return newCollection.mapChildren(this, env).msg(msgs);
    }

}