import { 
    TstEmpty, TstHeader, 
    TstOp, TstHeadedGrid, TST 
} from "../tsts.js";
import { Pass } from "../passes.js";
import {
    Err,
    Message,
    Msg,
    MsgFunc,
    Warn
} from "../utils/msgs.js";
import {
    FromHeader,
    RuleContextHeader,
    ToHeader,
    UniqueHeader,
    paramName
} from "../headers.js";
import {
    allowedParams, 
    paramsMustBePerfect, 
    requiredParams 
} from "../ops.js";
import { DEFAULT_PARAM } from "../utils/constants.js";
import { PassEnv } from "../components.js";

/**
 * This pass checks whether named parameters in headers
 * (e.g. `from`) are appropriately licensed by the operator that
 * encloses them.
 * 
 * One named parameter -- the "unique" param of testnot -- is a reserved
 * word, and can't otherwise be used, so that already has a built-in param
 * name.  
 * 
 * The rest, however, are not reserved words (the programmer is allowed to 
 * name a tape "context", for example, even though this is a parameter name
 * to the replace opration).  So at this stage their headers
 * are still TapeHeaders.  If we find to/from/context in the right syntactic
 * environment we replace them with FromHeader etc.
 * 
 * If the named parameter is invalid, we create an error message, and
 * try to fix the header.  If the header is a TagHeader and the operator
 * allows unnamed params, then the fix is to remove that TagHeader in favor 
 * of its child.  Otherwise, the fix is to remove the header entirely.
 */
export class CheckNamedParams extends Pass<TST,TST> {

    constructor(
        public allowedParams: Set<string> = new Set([DEFAULT_PARAM])
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
        
        // check whether all required params are present
        const result = new TstOp(t.cell, t.op, sib, child);
        const [op, opMsgs] = this.checkRequiredParams(result).destructure();

        // if there are any problems with params and we require
        // perfection, warn and return the sibling
        if (paramsMustBePerfect(t.op) && childMsgs.length > 0) {
            Warn(`This '${t.op.tag}' operator has erroneous operands and will not execute.`)
                .localize(t.cell.pos).msgTo(opMsgs);
            return sib.msg(sibMsgs).msg(childMsgs).msg(opMsgs);
        }

        return op.msg(sibMsgs).msg(childMsgs).msg(opMsgs);
    }

    public checkRequiredParams(t: TstOp): Msg<TST> {

        const msgs: Message[] = [];
        
        // now check that the required params are present.  if the
        // child is a TstGrid, we have to check more closely.
        if (t.child instanceof TstHeadedGrid) {
            for (const param of requiredParams(t.op)) {
                if (!t.child.providesParam(param)) {
                    const paramDesc = param == DEFAULT_PARAM 
                                    ? "an ordinary header (e.g. 'text', not 'unique')"
                                    : `a '${param}' header`;
                    const paramName = param == DEFAULT_PARAM ? "ordinary" : `'${param}'`;
                    Err(`Missing ${paramName} header for '${t.op.tag}'`,
                        `This '${t.op.tag}' operator requires ${paramDesc}, but ` +
                        "the content to the right doesn't have one.")
                        .localize(t.cell.pos).msgTo(msgs);
                }
            }
        } else {
            // if the child isn't a TstGrid, it can only provide
            // the unnamed parameter DEFAULT_PARAM, so loop through the required
            // params and complain if they're not DEFAULT_PARAM.
            for (const param of requiredParams(t.op)) {
                if (param != DEFAULT_PARAM) {
                    Err(`Missing '${param}' header for '${t.op.tag}'`,
                        `This '${t.op.tag}' operator requires a '${param}' header, but ` +
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
            // first, from/to/context headers are still TapeHeaders
            // at this stage.  if we're in Replace context, we need to 
            // turn those into FromHeader/ToHeader/ContextHeader.
            if (h.header.tag === "tape" 
                    && h.header.text.toLowerCase() === "from" 
                    && this.allowedParams.has("from")) {
                return new TstHeader(t.cell, new FromHeader());
            }
            if (h.header.tag === "tape" 
                && h.header.text.toLowerCase() === "to" 
                && this.allowedParams.has("to")) {
                return new TstHeader(t.cell, new ToHeader());
            }
            if (h.header.tag === "tape" 
                && h.header.text.toLowerCase() === "context" 
                && this.allowedParams.has("context")) {
                return new TstHeader(t.cell, new RuleContextHeader());
            }

            // it's not any of those.  other than the above three, every
            // header has a fixed param name.  "unique" has the param name
            // "unique", everything else has the default name "__".
            const tag = paramName(h.header);
            if (this.allowedParams.has(tag)) {
                return h; // we're good
            }

            // it's an unexpected header

            // if we can easily remove the tag, try that as the fix
            // otherwise return empty
            const newHeader = (h.header instanceof UniqueHeader
                                    && this.allowedParams.has(DEFAULT_PARAM)) ?
                                new TstHeader(h.cell, h.header.child) :
                                new TstEmpty();
            const headerType = (tag == DEFAULT_PARAM) ? "ordinary " : `'${tag}' `;
            const trimmedText = h.cell.text.trim();
            return newHeader.err(`Invalid ${headerType}header: '${trimmedText}'`,
                                `The '${t.cell.toString()}' operator to the left does ` +
                                `not expect this ${headerType}header: '${trimmedText}'`)
                            .localize(h.pos);
        }) as MsgFunc<TstHeader,TST>);
    }
}
