import { PassEnv } from "../passes";
import { Msgs } from "../msgs";
import { 
    TstComponent, TstNamespace, 
    TstResult, TstPass, 
    TstOp, TstEmpty, 
    TstEnclosure
} from "../tsts";
import { NamespaceOp, SymbolOp } from "../ops";

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
export class CreateNamespaces extends TstPass {

    public get desc(): string {
        return "Creating namespaces";
    }

    public transform(t: TstComponent, env: PassEnv): TstResult {

        return t.mapChildren(this, env).bind(t => {
            switch(t.constructor) {
                case TstOp:
                    return this.handleOp(t as TstOp);
                default: 
                    return t;
            }
        });
    }

    public handleOp(t: TstOp): TstResult {

        const msgs: Msgs = [];

        if (!(t.op instanceof NamespaceOp)) {
            return t.msg(msgs);
        }

        const children: TstComponent[] = [];

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
        const newChildren: TstComponent[] = [];
        for (const child of children) {

            if (child instanceof TstOp &&
                child.op.siblingRequirement == "required") {
                
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
                // it to anything.  it'll be assigned to __DEFAULT__ if 
                // it's last, otherwise the unassigned-content pass will
                // deal with it
                child.sibling = prev;
                newChildren.push(child);

            } else {
                newChildren.push(child);
            }
        }

        return new TstNamespace(t.cell, newChildren).msg(msgs);
    }

}