import { PassEnv } from "../passes";
import { Msgs } from "../msgs";
import { 
    TstNamespace, 
    TstOp, TstEmpty, 
    TstEnclosure
} from "../tsts";
import { NamespaceOp, SymbolOp } from "../ops";
import { Component, CPass, CResult } from "../components";

/**
 * Namespace works somewhat differently from other operators,
 * so in this pass we take "namespace:" TstOps and
 * instantiate them as actual namespaces, before the pass where
 * we instantiate other TstOps.
 * 
 * Two important things this pass does is flatten out
 * the namespace's children (they're in a binary tree after 
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
 */
export class CreateNamespaces extends CPass {

    public get desc(): string {
        return "Creating namespaces";
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

        if (!(t.op instanceof NamespaceOp)) {
            return t.mapChildren(this, env);
        }

        const children: Component[] = [];

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
        const newChildren: Component[] = [];
        for (const child of children) {

            if (!(child instanceof TstOp) || child.op.siblingReq != "required") {
                // not one of the ops we're interested in
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
                // it's an assignment, so adjust the scope 
                // of the assignment so it includes the operator
                // too
                child.sibling = prev.child;
                prev.child = child;
                newChildren.push(prev);
                continue;
            }

            // the previous child is not an assignment, so
            // it's just the first arg to this, but don't assign 
            // it to anything.  it'll be assigned to the namespace name if 
            // it's last, otherwise the unassigned-content pass will
            // deal with it
            child.sibling = prev;
            newChildren.push(child);

        }

        const newNamespace = new TstNamespace(t.cell, newChildren);
        return newNamespace.mapChildren(this, env);
    }

}