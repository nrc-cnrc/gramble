import { 
    TstComponent, TstEmpty, 
    TstHeader, TstNegativeUnitTest, 
    TstReplace, TstReplaceTape,
    TstResult, TstGrid, 
    TstTransform, TstUnitTest 
} from "../tsts";
import { TransEnv } from "../transforms";
import { Result, result } from "../msgs";
import { TagHeader } from "../headers";

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
            case TstReplace: 
                return this.transformReplace(t as TstReplace, env);
            case TstReplaceTape: 
                return this.transformReplaceTape(t as TstReplaceTape, env);
            case TstUnitTest: 
                return this.transformUnitTest(t as TstUnitTest, env);
            case TstNegativeUnitTest:
                return this.transformNegativeUnitTest(t as TstNegativeUnitTest, env);
            case TstHeader:
                return this.transformHeader(t as TstHeader, env);
            case TstGrid: // tables as transparent
                return t.mapChildren(this, env);
            default:  // everything else is default
                const defaultThis = new CheckNamedParams();
                return t.mapChildren(defaultThis, env);
        }
    }
    
    public transformReplace(t: TstReplace, env: TransEnv): TstResult {
        const [sib, sibMsgs] = this.transform(t.sibling, env).destructure();
        const newTransform = new CheckNamedParams(new Set(TstReplace.VALID_PARAMS));
        const [child, childMsgs] = newTransform.transform(t.child, env).destructure();
        return new TstReplace(t.cell, sib, child)
                    .msg(sibMsgs).msg(childMsgs);
    }

    public transformReplaceTape(t: TstReplaceTape, env: TransEnv): TstResult {
        const [sib, sibMsgs] = this.transform(t.sibling, env).destructure();
        const newTransform = new CheckNamedParams(new Set(TstReplaceTape.VALID_PARAMS));
        const [child, childMsgs] = newTransform.transform(t.child, env).destructure();
        return new TstReplaceTape(t.cell, t.tape, sib, child)
                    .msg(sibMsgs).msg(childMsgs);
    }

    public transformUnitTest(t: TstUnitTest, env: TransEnv): TstResult {
        const [sib, sibMsgs] = this.transform(t.sibling, env).destructure();
        const newTransform = new CheckNamedParams(new Set(TstUnitTest.VALID_PARAMS));
        const [child, childMsgs] = newTransform.transform(t.child, env).destructure();
        if (childMsgs.length > 0) { // the tests are invalid already, don't execute them
            return sib.msg(sibMsgs).msg(childMsgs);
        }
        return new TstUnitTest(t.cell, sib, child)
                    .msg(sibMsgs).msg(childMsgs);
    }
    
    public transformNegativeUnitTest(t: TstNegativeUnitTest, env: TransEnv): TstResult {
        const [sib, sibMsgs] = this.transform(t.sibling, env).destructure();
        const newTransform = new CheckNamedParams(new Set(TstNegativeUnitTest.VALID_PARAMS));
        const [child, childMsgs] = newTransform.transform(t.child, env).destructure();
        if (childMsgs.length > 0) { // the tests are invalid already, don't execute them
            return sib.msg(sibMsgs).msg(childMsgs);
        }
        return new TstNegativeUnitTest(t.cell, sib, child)
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
