import { 
    ReplaceOp, BINARY_OPS_MAP, 
    BinaryOp, ErrorOp, 
    ReplaceTapeOp, TableOp, 
    TestNotOp, TestOp, 
    SymbolOp 
} from "../ops";
import { result, Result } from "../msgs";
import { PassEnv } from "../passes";
import { 
    TstOp, 
    TstEmpty, TstTest, 
    TstTable, TstTestNot, 
    TstReplace, TstReplaceTape, 
    TstBinaryOp, TstAssignment, TstParamList
} from "../tsts";
import { Component, CPass, CResult } from "../components";

 export class CreateOps extends CPass {

    public get desc(): string {
        return "Creating ops";
    }

    public transform(t: Component, env: PassEnv): CResult {
        
        if (!(t instanceof TstOp)) {
            return t.mapChildren(this, env);
        }
        
        const result = t.mapChildren(this, env) as Result<TstOp>;
        return result.bind(t => {
            switch(t.op.constructor) {
                case TestOp:
                    return this.handleTest(t);
                case TestNotOp:
                    return this.handleTestNot(t);
                case TableOp:
                    return this.handleOp(t);
                case ReplaceOp:
                    return this.handleReplace(t);
                case ReplaceTapeOp:
                    return this.handleReplaceTape(t);
                case BinaryOp:
                    return this.handleBinary(t);
                case SymbolOp:
                    return this.handleAssignment(t);
                default: 
                    throw new Error(`didn't handle ${t.op.constructor.name} op`);
            }
        });
    }

    public handleOp(t: TstOp): CResult {
        return new TstTable(t.cell, t.child as TstParamList).msg();
    }

    public handleTest(t: TstOp): CResult {
        return new TstTest(t.cell, t.sibling, 
                    t.child as TstParamList).msg();  
    }

    public handleTestNot(t: TstOp): CResult {
        return new TstTestNot(t.cell, t.sibling, 
                    t.child as TstParamList).msg();
    }
    
    public handleReplace(t: TstOp): CResult {
        return new TstReplace(t.cell, t.sibling, 
                    t.child as TstParamList).msg();
    }

    public handleReplaceTape(t: TstOp): CResult {
        const tapeName = (t.op as ReplaceTapeOp).child.text;
        return new TstReplaceTape(t.cell, tapeName, 
                    t.sibling, t.child as TstParamList).msg();
    }
    
    public handleBinary(t: TstOp): CResult {
        const opName = (t.op as BinaryOp).text;
        return new TstBinaryOp(t.cell, opName, 
                        t.sibling, t.child).msg();
    }

    public handleAssignment(t: TstOp): CResult {
        const op = t.op as SymbolOp;
        const assignment = new TstAssignment(t.cell, op.text, t.child);

        if (op.text.indexOf(".") != -1) {
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