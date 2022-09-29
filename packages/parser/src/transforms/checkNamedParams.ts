import { 
    TstComponent, TstEmpty, 
    TstHeader, 
    TstResult, TstGrid, 
    TstTransform, TstOp 
} from "../tsts";
import { TransEnv } from "../transforms";
import { Err, Msgs, Result, result, Warn } from "../msgs";
import { Header, TagHeader, TapeNameHeader } from "../headers";
import { BLANK_PARAM } from "../ops";

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
        
        // if there are any problems with params and we require
        // perfection, warn and return the sibling
        if (t.op.requirePerfectParams && childMsgs.length > 0) {
            Warn("This op has erroneous parameters and will not execute.",
                t.cell.pos).msgTo(childMsgs);
            return sib.msg(sibMsgs).msg(childMsgs);
        }

        // otherwise check whether all required params are present
        const result = new TstOp(t.cell, t.op, sib, child);
        return this.checkRequiredParams(result)
                   .msg(sibMsgs).msg(childMsgs);
    }

    public checkRequiredParams(t: TstOp): TstResult {

        const msgs: Msgs = [];
        
        // now check that the required params are present.  if the
        // child is a TstGrid, we have to check more closely.  if the
        // child isn't a TstGrid, then  
        if (t.child instanceof TstGrid) {
            for (const param of t.op.requiredNamedParams) {
                if (!t.child.providesParam(param)) {
                    const paramDesc = param == BLANK_PARAM 
                                    ? "a plain header (e.g. not 'from', not 'to', not 'unique')"
                                    : `a ${param} header`;
                    Err("Missing named param",
                        `This operator requires ${paramDesc}, but ` +
                        "the content to the right doesn't have one.",
                        t.cell.pos).msgTo(msgs);
                }
            }
        } else {
            // if the child isn't a TstGrid, it can only provide
            // the unnamed parameter `__`, so loop through the required
            // params and complain if they're not `__`.
            for (const param of t.op.requiredNamedParams) {
                if (param != BLANK_PARAM) {
                    Err("Missing named param",
                        `This operator requires a ${param} header, but ` +
                        "the content to the right doesn't have one.",
                        t.cell.pos).msgTo(msgs);
                }
            }
        }

        // if the op requires perfect params and we've encountered
        // any problem, then give up and return the sibling.
        if (t.op.requirePerfectParams && msgs.length > 0) {
            return t.sibling.msg(msgs);   
        }

        return t.msg(msgs);
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
