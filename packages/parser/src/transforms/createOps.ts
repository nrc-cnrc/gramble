import { 
    AtomicReplaceOp, BINARY_OPS_MAP, 
    BuiltInBinaryOp, ErrorOp, 
    ReplaceOp, TableOp, 
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
                case AtomicReplaceOp:
                    return this.transformReplace(t);
                case ReplaceOp:
                    return this.transformReplaceTape(t);
                case BuiltInBinaryOp:
                    return this.transformBinary(t);
                case SymbolOp:
                    return this.transformAssignment(t);
                case ErrorOp:
                    return this.transformError(t);
                default: 
                    throw new Error(`didn't handle ${t.op.constructor.name} op`);
            }
        });
    }

    public transformTable(t: TstOp): TstResult {

        if (t.child instanceof TstEmpty) {
            return result(t).warn("This table will not contain any content.")
                            .bind(r => new TstEmpty());
        }

        return new TstTableOp(t.cell, t.sibling, t.child).msg();
    }

    public transformTest(t: TstOp): TstResult {
        
        if (t.child instanceof TstEmpty) {
            return result(t).warn("'test' seems to be missing something to test; " +
                            "something should be in the cell to the right.")
                        .bind(r => r.sibling);
        }

        if (!(t.child instanceof TstGrid)) {
            return result(t).err("Cannot execute tests",
                        "You can't nest another operator to the right of " + 
                        " a test block, it has to be a content table.")
                        .bind(r => r.sibling);
        }

        if (t.sibling instanceof TstEmpty) {
            return result(t).err("Wayward test",
                            "Grammar above this (if any) is empty")
                        .bind(r => new TstEmpty());
        }
        
        return new TstUnitTest(t.cell, t.sibling, t.child).msg();
    
    }

    public transformTestNot(t: TstOp): TstResult {

        if (t.child instanceof TstEmpty) {
            return result(t).warn("'testnot' seems to be missing something to test; " +
                                "something should be in the cell to the right.")
                            .bind(r => r.sibling);
        }

        if (!(t.child instanceof TstGrid)) {
            return result(t).err("Cannot execute testnot",
                              "You can't nest another operator to the right of a testnot block, " + 
                              "it has to be a content table.")
                            .bind(r => r.sibling);
        }

        if (t.sibling instanceof TstEmpty) {
            return result(t).err("Wayward testnot",
                                "There should be something above this 'testnot' command to test")
                             .bind(r => new TstEmpty())
        }

        return new TstNegativeUnitTest(t.cell, t.sibling, t.child).msg();
    }
    
    public transformReplace(t: TstOp): TstResult {
        
        if (t.child instanceof TstEmpty) {
            return result(t).warn("The cells to the right do not contain " +
                            "valid material, so this replacement will be ignored.")
                         .bind(r => r.sibling);
        } 

        if (t.sibling instanceof TstEmpty) {
            return result(t).err(`Missing argument to replace'`,
                            `Replace needs a grammar to operate on; ` +
                            "something should be in a cell above this.")
                          .bind(r => new TstEmpty());
        }

        return new TstReplace(t.cell, t.sibling, t.child).msg();
    }

    public transformReplaceTape(t: TstOp): TstResult {
        
        if (t.child instanceof TstEmpty) {
            return result(t).err("Missing argument to replace",
                            "The cells to the right do not contain " + 
                            "valid material, so this replacement will be ignored.")
                        .bind(r => r.sibling);
        } 

        if (t.sibling instanceof TstEmpty) {
            return result(t).err(`Missing argument to replace'`,
                            `'replace:' needs a grammar to operate on; ` +
                            "something should be in a cell above this.")
                         .bind(_ => new TstEmpty());
        }

        const tapeName = (t.op as ReplaceOp).child.text;
        return new TstReplaceTape(t.cell, tapeName, 
                                  t.sibling, t.child).msg();
    }
    
    public transformBinary(t: TstOp): TstResult {
        
        if (t.sibling instanceof TstEmpty && t.child instanceof TstEmpty) {
            return result(t).err('Missing arguments',
                `'${t.text}' is missing both an argument above ` +
                "and to the right.")
                .bind(_ => new TstEmpty());
        } 

        if (t.child instanceof TstEmpty) {
            return result(t).err('Missing argument', 
                                `'${t.text}' is missing a second argument; ` +
                                "something should be in the cell to the right.")
                           .bind(t => t.sibling);
        }

        if (t.sibling instanceof TstEmpty) {
            return result(t).err('Missing argument',
                             `'${t.text}' is missing a first argument; ` +
                            "something should be in a cell above this.")
                            .bind(t => t.child);
        } 

        const op = BINARY_OPS_MAP[(t.op as BuiltInBinaryOp).text];
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

    public transformError(t: TstOp): TstResult {
        const op = t.op as ErrorOp;
        const replacement = !(t.sibling instanceof TstEmpty) ?
                            t.sibling :
                            t.child
        return result(t).err(op.shortMsg, op.longMsg)
                        .bind(_ => replacement);      
    }
    
}