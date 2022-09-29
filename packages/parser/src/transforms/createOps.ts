import { 
    ReplaceOp, BINARY_OPS_MAP, 
    BinaryOp, ErrorOp, 
    ReplaceTapeOp, TableOp, 
    TestNotOp, TestOp, 
    SymbolOp 
} from "../ops";
import { result, Result } from "../msgs";
import { TransEnv } from "../transforms";
import { 
    TstComponent, TstResult, 
    TstTransform, TstOp, TstEmpty, TstGrid, TstUnitTest, TstTableOp, TstNegativeUnitTest, TstReplace, TstReplaceTape, TstBinaryOp, TstAssignment
} from "../tsts";

 export class CreateOps extends TstTransform {

    public get desc(): string {
        return "Creating ops";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {
        
        if (!(t instanceof TstOp)) {
            return t.mapChildren(this, env);
        }
        
        const result = t.mapChildren(this, env) as Result<TstOp>;
        return result.bind(t => {
            switch(t.op.constructor) {
                case TestOp:
                    return this.transformTest(t);
                case TestNotOp:
                    return this.transformTestNot(t);
                case TableOp:
                    return this.transformTable(t);
                case ReplaceOp:
                    return this.transformReplace(t);
                case ReplaceTapeOp:
                    return this.transformReplaceTape(t);
                case BinaryOp:
                    return this.transformBinary(t);
                case SymbolOp:
                    return this.transformAssignment(t);
                default: 
                    throw new Error(`didn't handle ${t.op.constructor.name} op`);
            }
        });
    }

    public transformTable(t: TstOp): TstResult {
        return new TstTableOp(t.cell, t.sibling, t.child).msg();
    }

    public transformTest(t: TstOp): TstResult {
        return new TstUnitTest(t.cell, t.sibling, t.child).msg();
    
    }

    public transformTestNot(t: TstOp): TstResult {
        return new TstNegativeUnitTest(t.cell, t.sibling, t.child).msg();
    }
    
    public transformReplace(t: TstOp): TstResult {
        return new TstReplace(t.cell, t.sibling, t.child).msg();
    }

    public transformReplaceTape(t: TstOp): TstResult {
        const tapeName = (t.op as ReplaceTapeOp).child.text;
        return new TstReplaceTape(t.cell, tapeName, 
                                  t.sibling, t.child).msg();
    }
    
    public transformBinary(t: TstOp): TstResult {
        const op = BINARY_OPS_MAP[(t.op as BinaryOp).text];
        return new TstBinaryOp(t.cell, op, t.sibling, t.child).msg();
    }

    public transformAssignment(t: TstOp): TstResult {
        const trimmedText = t.text.endsWith(":")
                          ? t.text.slice(0, t.text.length-1).trim()
                          : t.text;

        const assignment = new TstAssignment(t.cell, trimmedText, t.sibling, t.child);

        if (trimmedText.indexOf(".") != -1) {
            return result(assignment).warn("You can't assign to a name that contains a period.")
                                     .bind(r => r.child)
        }

        if (assignment.child instanceof TstEmpty) {
            return result(assignment).warn(
                `This symbol will not contain any content.`
            );
        }

        return result(assignment)
    }
    
}