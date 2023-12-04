import { 
    TstEmpty, TstHeader, 
    TstOp, TstHeadedGrid, TST 
} from "../tsts";
import { Pass, PassEnv } from "../passes";
import { Err, Message, MsgFunc, Msg, Warn } from "../utils/msgs";
import { UniqueHeader, paramName } from "../headers";
import {
    allowedParams, 
    paramsMustBePerfect, 
    requiredParams 
} from "../ops";
import { DEFAULT_PARAM } from "../utils/constants";

/**
 * This pass checks whether named parameters in headers
 * (e.g. `from text`) are appropriately licensed by the operator that
 * encloses them.
 * 
 * If the named parameter is invalid, it creates an error message, and
 * tries to fix the header.  If the header is a TagHeader and the operator
 * allows unnamed params, then the fix is to remove that TagHeader in favor 
 * of its child.  Otherwise, the fix is to remove the header entirely.
 */
export class CheckNamedParams extends Pass<TST,TST> {

    constructor(
        public permissibleParams: Set<string> = new Set([DEFAULT_PARAM])
    ) { 
        super();
    }

    public transformAux(t: TST, env: PassEnv): TST|Msg<TST> {

        switch(t.tag) {
            case "op":          return this.handleOp(t, env);
            case "header":      return this.handleHeader(t, env);
            case "headedgrid":  return this.handleHeadedGrid(t, env);
            default: 
                const defaultThis = new CheckNamedParams();
                return t.mapChildren(defaultThis, env);
        }
    }

    public handleHeadedGrid(t: TstHeadedGrid, env: PassEnv): Msg<TST> {
        const result = t.mapChildren(this, env) as Msg<TstHeadedGrid>;
        return result.bind(t => {
            t.headers = t.headers.filter(h => h instanceof TstHeader);
            return t;
        });
    }

    public handleOp(t: TstOp, env: PassEnv): Msg<TST> {
        const [sib, sibMsgs] = this.transform(t.sibling, env).destructure();
        const newPass = new CheckNamedParams(allowedParams(t.op));
        const [child, childMsgs] = newPass.transform(t.child, env)
                                          .localize(t.pos)
                                          .destructure();
        
        // if there are any problems with params and we require
        // perfection, warn and return the sibling
        if (paramsMustBePerfect(t.op) && childMsgs.length > 0) {
            Warn("This op has erroneous parameters and will not execute.")
                .localize(t.cell.pos).msgTo(childMsgs);
            return sib.msg(sibMsgs).msg(childMsgs);
        }

        // otherwise check whether all required params are present
        const result = new TstOp(t.cell, t.op, sib, child);
        return this.checkRequiredParams(result)
                   .msg(sibMsgs).msg(childMsgs);
    }

    public checkRequiredParams(t: TstOp): Msg<TST> {

        const msgs: Message[] = [];
        
        // now check that the required params are present.  if the
        // child is a TstGrid, we have to check more closely.  if the
        // child isn't a TstGrid, then  
        if (t.child instanceof TstHeadedGrid) {
            for (const param of requiredParams(t.op)) {
                if (t.child.headers.length > 0 && !t.child.providesParam(param)) {
                    const paramDesc = param == DEFAULT_PARAM 
                                    ? "a plain header (e.g. not 'from', not 'to', not 'unique')"
                                    : `a ${param} header`;
                    Err("Missing named param",
                        `This operator requires ${paramDesc}, but ` +
                        "the content to the right doesn't have one.")
                        .localize(t.cell.pos).msgTo(msgs);
                }
            }
        } else {
            // if the child isn't a TstGrid, it can only provide
            // the unnamed parameter `__`, so loop through the required
            // params and complain if they're not `__`.
            for (const param of requiredParams(t.op)) {
                if (param != DEFAULT_PARAM) {
                    Err("Missing named param",
                        `This operator requires a ${param} header, but ` +
                        "the content to the right doesn't have one.")
                        .localize(t.cell.pos).msgTo(msgs);
                }
            }
        }

        // if the op requires perfect params and we've encountered
        // any problem, then give up and return the sibling.
        if (paramsMustBePerfect(t.op) && msgs.length > 0) {
            return t.sibling.msg(msgs);   
        }

        return t.msg(msgs);
    }
    
    public handleHeader(t: TstHeader, env: PassEnv): TST|Msg<TST> {
        const mapped = t.mapChildren(this, env) as Msg<TstHeader>;
        return mapped.bind((h => {
            const tag = paramName(h.header);
            if (this.permissibleParams.has(tag)) {
                return h; // we're good
            }
            // it's an unexpected header
            const param = (tag == DEFAULT_PARAM) ?
                              "an unnamed parameter" :
                              `a parameter named ${tag}`;

            if (h.header instanceof UniqueHeader && this.permissibleParams.has(DEFAULT_PARAM)) {
                // if we can easily remove the tag, try that
                const newHeader = new TstHeader(h.cell, h.header.child);
                return newHeader.err("Invalid parameter",
                        `The operator to the left does not expect ${param}`)
                        .localize(h.pos);
            }

            // otherwise return empty
            return new TstEmpty().err("Invalid parameter",
                `The operator to the left does not expect ${param}`)
                .localize(h.pos);
        }) as MsgFunc<TstHeader,TST>);
    }
}
