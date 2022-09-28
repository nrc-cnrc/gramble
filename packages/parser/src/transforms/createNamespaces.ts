import { TransEnv } from "../transforms";
import { Msgs } from "../msgs";
import { 
    TstAssignment, TstBinaryOp, 
    TstComponent,  
    TstNamespace, TstNegativeUnitTest, 
    TstReplace, TstReplaceTape,
    TstResult, TstUnitTest, TstTransform, TstOp, TstEmpty, TstGrid, TstTableOp, TstEnclosure, TstBinary
} from "../tsts";
import { NamespaceOp, UnreservedOp } from "../ops";
import { TableOp } from "../ops";

/**
 * Namespace works somewhat differently from other operators,
 * so in this transformation we take "namespace:" TstOps and
 * instantiate them as actual namespaces.
 */
export class CreateNamespaces extends TstTransform {

    public get desc(): string {
        return "Creating namespaces";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstOp:
                return this.transformOp(t as TstOp, env);
            default: 
                return t.mapChildren(this, env);
        }
    }

    public transformOp(t: TstOp, env: TransEnv): TstResult {
        const [result, msgs] = t.mapChildren(this, env)
                                .destructure() as [TstOp, Msgs];

        if (!(result.op instanceof NamespaceOp)) {
            return result.msg(msgs);
        }

        const children: TstComponent[] = [];

        // flatten and reverse the results
        let child = result.child;
        while (child instanceof TstBinary) {
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
                child.op.isBinary) {
                
                const prev = newChildren.pop();
                if (prev == undefined) {
                    // this is the first child, it's erroneous
                    // to be here, but it will be detected later.
                    newChildren.push(child);
                    continue;
                }

                if (prev instanceof TstOp &&
                    prev.op instanceof UnreservedOp) {
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