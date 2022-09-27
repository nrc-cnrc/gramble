import { 
    TstComponent, TstEmpty, 
    TstHeader, TstNegativeUnitTest, 
    TstReplace, TstReplaceTape,
    TstResult, TstGrid, 
    TstTransform, TstUnitTest 
} from "../tsts";
import { TransEnv } from "../transforms";
import { Msgs } from "../msgs";

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
                return t.transform(this, env);
            default:  // everything else is default
                const defaultThis = new CheckNamedParams();
                return t.transform(defaultThis, env);
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
        const result = t.transform(this, env);
        const [header, _] = result.destructure() as [TstHeader, Msgs];
        const tag = header.header.getParamName();
        if (!this.permissibleParams.has(tag)) {
            const errMsg = (tag == "__") ?
                            "an unnamed parameter" :
                            `a parameter named ${tag}`;
            return result.err("Invalid parameter name",
                                "The operator to the left does not " +
                                `expect ${errMsg}`)
                         .bind(r => new TstEmpty());
        }
        return result;
    }
}
