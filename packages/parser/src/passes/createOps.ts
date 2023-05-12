import { 
    ReplaceOp, TableOp, 
    TestNotOp, TestOp, 
    SymbolOp, 
    OrOp,
    JoinOp
} from "../ops";
import { result, Result } from "../msgs";
import { PassEnv } from "../passes";
import { 
    TstOp, 
    TstEmpty, TstTest, 
    TstTable, TstTestNot, TstReplace, 
    TstOr, TstAssignment, TstParamList, TstJoin
} from "../tsts";
import { Component, exhaustive } from "../components";
import { PostComponentPass, TstError } from "./ancestorPasses";

 export class CreateOps extends PostComponentPass {

    public get desc(): string {
        return "Creating ops";
    }

    public postTransform(t: Component, env: PassEnv): Component {

        if (!(t instanceof TstOp)) return t;

        switch(t.op.tag) {
            case "test":       return this.handleTest(t);
            case "testnot":    return this.handleTestNot(t);
            case "table":      return this.handleOp(t);
            case "replace":    return this.handleReplace(t);
            case "or":         return this.handleOr(t);
            case "join":       return this.handleJoin(t);
            case "symbol":     return this.handleAssignment(t);
            case "error":      throw new Error("Erroneous op");
            case "collection": throw new Error("Cannot handle collection op here");
            default: exhaustive(t.op);
        }
    }

    public handleOp(t: TstOp): Component {
        return new TstTable(t.cell, t.child as TstParamList);
    }

    public handleTest(t: TstOp): Component {
        return new TstTest(t.cell, t.sibling, 
                    t.child as TstParamList);  
    }

    public handleTestNot(t: TstOp): Component {
        return new TstTestNot(t.cell, t.sibling, 
                    t.child as TstParamList);
    }
    
    public handleReplace(t: TstOp): Component {
        const tapeName = (t.op as ReplaceOp).child.text;
        return new TstReplace(t.cell, tapeName, 
                    t.sibling, t.child as TstParamList);
    }
    
    public handleOr(t: TstOp): Component {
        return new TstOr(t.cell, t.sibling, t.child);
    }
    
    public handleJoin(t: TstOp): Component {
        return new TstJoin(t.cell, t.sibling, t.child);
    }

    public handleAssignment(t: TstOp): Component {
        const op = t.op as SymbolOp;
        const assignment = new TstAssignment(t.cell, op.text, t.child);

        if (op.text.indexOf(".") != -1) {
            throw TstError("Warning -- You can't assign to a name that contains a period.",
                                 assignment.child);
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