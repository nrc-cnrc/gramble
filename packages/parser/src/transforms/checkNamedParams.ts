import { 
    TstComponent, TstEmpty, 
    TstHeader, TstNegativeUnitTest, 
    TstReplace, TstReplaceTape,
    TstResult, TstGrid, 
    TstTransform, TstUnitTest, TstOp 
} from "../tsts";
import { TransEnv } from "../transforms";
import { Result, result, Warn } from "../msgs";
import { TagHeader } from "../headers";
import { ReplaceOp } from "../ops";

/**
 * This transformation checks whether named parameters in headers
 * (e.g. `from text`) are appropriately licensed by the operator that
 * encloses them.
 * 
 * If the named parameter is invalid, it creates an error message, and
 * tries to fix the header.  If the header is a TagHeader and the operator
 * allows unnamed params, then the fix is to remove that TagHeader in favor 
 * of its child.  Otherwise, the fix is to remove the header entirely.
 */
export class CheckNamedParams extends TstTransform {

    constructor(
        public permissibleParams: Set<string> = new Set(["__"])
    ) { 
        super();
    }

    public get desc(): string {
        return "Checking named params";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstOp:
                return this.transformOp(t as TstOp, env);
            case TstHeader:
                return this.transformHeader(t as TstHeader, env);
            case TstGrid: // tables as transparent
                return t.mapChildren(this, env);
            default:  // everything else is default
                const defaultThis = new CheckNamedParams();
                return t.mapChildren(defaultThis, env);
        }
    }

    public transformOp(t: TstOp, env: TransEnv): TstResult {
        const [sib, sibMsgs] = this.transform(t.sibling, env).destructure();
        const newTransform = new CheckNamedParams(t.op.allowedNamedParams);
        const [child, childMsgs] = newTransform.transform(t.child, env).destructure();
        if (t.op.requirePerfectParams && childMsgs.length > 0) {
            Warn("This op has erroneous parameters and will not execute.",
                t.cell.pos).msgTo(childMsgs);
            return sib.msg(sibMsgs).msg(childMsgs);
        }
        return new TstOp(t.cell, t.op, sib, child)
                    .msg(sibMsgs).msg(childMsgs);
    }
    
    public transformHeader(t: TstHeader, env: TransEnv): TstResult {
        const mapped = t.mapChildren(this, env) as Result<TstHeader>;
        return mapped.bind(h => {
            const tag = h.header.getParamName();
            if (this.permissibleParams.has(tag)) {
                return h; // we're good
            }
            // it's an unexpected header
            const paramName = (tag == "__") ?
                              "an unnamed parameter" :
                              `a parameter named ${tag}`;

            if (h.header instanceof TagHeader && this.permissibleParams.has("__")) {
                // if we can easily remove the tag, try that
                const newHeader = new TstHeader(h.cell, h.header.child);
                return result(h).err("Invalid parameter",
                        `The operator to the left does not expect ${paramName}`)
                        .bind(_ => newHeader);
            }

            // otherwise return empty
            return result(h).err("Invalid parameter",
                `The operator to the left does not expect ${paramName}`)
                .bind(_ => new TstEmpty());
        });
    }
}
