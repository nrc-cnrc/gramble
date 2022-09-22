import { Msgs } from "../msgs";
import { 
    TstAssignment, TstBinaryOp, 
    TstComponent, TstEnclosure, 
    TstNamespace, TstNegativeUnitTest, 
    TstReplace, TstReplaceTape,
    TstResult, TstUnitTest 
} from "../tsts";

/**
 * When we're directly under a namespace, you can use a binary
 * operation like join, replace, test, etc. to modify the previous
 * assignment, and the results will be assigned to that same name.
 */
 export class AdjustAssignmentScope {

    public get desc(): string {
        return "Re-scoping assignments";
    }

    public transform(t: TstComponent): TstResult {

        switch(t.constructor) {
            case TstNamespace:
                return this.transformNamespace(t as TstNamespace);
            default: 
                return t.transform(this);
        }
    }

    public transformNamespace(t: TstNamespace): TstResult {
        const [result, msgs] = t.transform(this).destructure() as [TstNamespace, Msgs];
        const newChildren: TstEnclosure[] = [];
        for (const child of result.children) {

            if (child instanceof TstBinaryOp ||
                    child instanceof TstReplace ||
                    child instanceof TstReplaceTape ||
                    child instanceof TstUnitTest ||
                    child instanceof TstNegativeUnitTest) {
                
                const prev = newChildren.pop();
                if (prev == undefined) {
                    // this is the first child, it's erroneous
                    // to be here, but it will be detected later.
                    newChildren.push(child);
                    continue;
                }

                if (prev instanceof TstAssignment) {
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