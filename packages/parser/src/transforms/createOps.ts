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

 export class CreateOps extends TstTransform {

    public get desc(): string {
        return "Creating ops";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {
        switch(t.constructor) {
            case TstOp:
                return this.transformOp(t as TstOp, env);
            default: 
                return t.transform(this, env);
        }
    }

    public transformOp(t: TstOp, env: TransEnv): TstResult {
        return t.transform(this, env)
                .bind(c => t.op.transform(c as TstOp));
    }
    
}
