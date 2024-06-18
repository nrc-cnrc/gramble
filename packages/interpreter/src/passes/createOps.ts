import { exhaustive } from "../utils/func";
import { 
    ReplaceOp,
    ReplaceParOp,
    SymbolOp, 
} from "../ops";
import { AutoPass } from "../passes";
import { 
    TstOp, 
    TstTest, 
    TstTable, TstTestNot, TstReplace, 
    TstOr, TstAssignment, TstParamList, TstJoin, TST,
    TstReplacePar
} from "../tsts";
import { PassEnv } from "../components";

 export class CreateOps extends AutoPass<TST> {

    public postTransform(t: TST, env: PassEnv): TST {

        if (!(t instanceof TstOp)) return t;

        switch(t.op.tag) {
            case "test":       return this.handleTest(t);
            case "testnot":    return this.handleTestNot(t);
            case "table":      return this.handleOp(t);
            case "replace":    return this.handleReplace(t);
            case "replacePar": return this.handleReplacePar(t);
            case "or":         return this.handleOr(t);
            case "join":       return this.handleJoin(t);
            case "symbol":     return this.handleAssignment(t);
            case "error":      throw new Error("Erroneous op");
            case "collection": throw new Error("Cannot handle collection op here");
            default: exhaustive(t.op);
        }
    }

    public handleOp(t: TstOp): TST {
        return new TstTable(t.cell, t.child as TstParamList);
    }

    public handleTest(t: TstOp): TST {
        return new TstTest(t.cell, t.sibling, 
                    t.child as TstParamList);  
    }

    public handleTestNot(t: TstOp): TST {
        return new TstTestNot(t.cell, t.sibling, 
                    t.child as TstParamList);
    }
    
    public handleReplace(t: TstOp): TST {
        const tapeName = (t.op as ReplaceOp).child.text;
        return new TstReplace(t.cell, tapeName, 
                    t.sibling, t.child as TstParamList);
    }

    public handleReplacePar(t: TstOp): TST {
        const tapeName = (t.op as ReplaceParOp).child.text;
        return new TstReplacePar(t.cell, tapeName, 
                    t.sibling, t.child as TstParamList);
    }
    
    public handleOr(t: TstOp): TST {
        return new TstOr(t.cell, t.sibling, t.child);
    }
    
    public handleJoin(t: TstOp): TST {
        return new TstJoin(t.cell, t.sibling, t.child);
    }

    public handleAssignment(t: TstOp): TST {
        const op = t.op as SymbolOp;
        const assignment = new TstAssignment(t.cell, op.text, t.child);

        if (op.text.indexOf(".") != -1) {
            throw assignment.child.warn(
                    "You can't assign to a name that contains a period.");
        }

        /*
        if (assignment.child instanceof TstEmpty) {
            console.log(`throwing a content warning`);
            throw TstError("Warning -- This symbol won't contain any content.",
                                assignment);
        } */

        return assignment;
    }
    
}