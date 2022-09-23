import { 
    TstAssignment, TstBinaryOp, 
    TstComponent, TstEmpty,
    TstNegativeUnitTest, TstReplace, 
    TstReplaceTape, TstResult, TstTable, 
    TstTableOp, TstTransform, TstUnitTest 
} from "../tsts";
import { Result } from "../msgs";
import { TransEnv } from "../transforms";

export class MissingParamsTransform extends TstTransform {

    public get desc(): string {
        return "Handling missing structural parameters";
    }

    public transform(t: TstComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case TstUnitTest: 
                return this.transformTest(t as TstUnitTest, env);
            case TstNegativeUnitTest: 
                return this.transformNegativeTest(t as TstNegativeUnitTest, env);
            case TstReplace:
                return this.transformReplace(t as TstReplace, env);
            case TstReplaceTape:
                return this.transformReplaceTape(t as TstReplaceTape, env);
            case TstAssignment:
                return this.transformAssignment(t as TstAssignment, env);
            case TstBinaryOp:
                return this.transformBinaryOp(t as TstBinaryOp, env);
            case TstTableOp:
                return this.transformTableOp(t as TstTableOp, env);
            default: 
                return t.transform(this, env);
        }
    }

    public transformTest(t: TstUnitTest, env: TransEnv): TstResult {
        
        const result = t.transform(this, env) as Result<TstUnitTest>;
        const [test, _] = result.destructure();

        if (test.child instanceof TstEmpty) {
            return result.warn("'test' seems to be missing something to test; " +
                        "something should be in the cell to the right.")
                        .bind(r => r.sibling);
        }

        if (!(test.child instanceof TstTable) && !(test.child instanceof TstTableOp)) {
            return result.err("Cannot execute tests",
                        "You can't nest another operator to the right of " + 
                        " a test block, it has to be a content table.")
                        .bind(r => r.sibling);
        }

        if (test.sibling instanceof TstEmpty) {
            return result.err("Wayward test",
                            "Grammar above this (if any) is empty")
                        .bind(r => new TstEmpty());
        }

        return result;
    }

    public transformTableOp(t: TstTableOp, env: TransEnv): TstResult {

        const result = t.transform(this, env) as Result<TstTableOp>;
        const [table, _] = result.destructure();

        if (table.child instanceof TstEmpty) {
            return result.warn("This table will not contain any content.")
                         .bind(r => new TstEmpty());
        }

        return result;
    }

    public transformBinaryOp(t: TstBinaryOp, env: TransEnv): TstResult {
        
        let result = t.transform(this, env) as Result<TstBinaryOp>;
        const [op, _] = result.destructure();

        if (op.child instanceof TstEmpty) {
            result = result.err('Missing argument', 
                `'${op.text}' is missing a second argument; ` +
                "something should be in the cell to the right.");
        }

        if (op.sibling instanceof TstEmpty) {
            result = result.err('Missing argument',
                `'${op.text}' is missing a first argument; ` +
                "something should be in a cell above this.");
        } 

        return result;
    }

    public transformNegativeTest(
        t: TstNegativeUnitTest,
        env: TransEnv
    ): TstResult {
        
        const result = t.transform(this, env) as Result<TstNegativeUnitTest>;
        const [test, _] = result.destructure();

        if (test.child instanceof TstEmpty) {
            return result.warn("'testnot' seems to be missing something to test; " +
                            "something should be in the cell to the right.")
                         .bind(r => r.sibling);
        }

        if (!(test.child instanceof TstTable) && !(test.child instanceof TstTableOp)) {
            return result.err("Cannot execute testnot",
                              "You can't nest another operator to the right of a testnot block, " + 
                              "it has to be a content table.")
                         .bind(r => r.sibling);
        }

        if (test.sibling instanceof TstEmpty) {
            return result.err("Wayward testnot",
                            "There should be something above this 'testnot' command to test")
                         .bind(r => new TstEmpty())
        }

        return result;
    }

    public transformAssignment(t: TstAssignment, env: TransEnv): TstResult {
        const result = t.transform(this, env) as Result<TstAssignment>;
        const [assignment, _] = result.destructure();
        if (assignment.child instanceof TstEmpty) {
            return result.warn(
                `This symbol will not contain any content.`
            );
        }

        return result;
    }

    public transformReplace(t: TstReplace, env: TransEnv): TstResult {
        
        const result = t.transform(this, env) as Result<TstReplace>;
        const [replace, _] = result.destructure();

        if (replace.child instanceof TstEmpty) {
            return result.err("Missing argument to replace",
                            "The cells to the right do not contain " + 
                            "valid material, so this replacement will be ignored.")
                        .bind(r => r.sibling);
        } 

        if (replace.sibling instanceof TstEmpty) {
            return result.err(`Missing argument to replace'`,
                            `'replace:' needs a grammar to operate on; ` +
                            "something should be in a cell above this.")
                         .bind(r => new TstEmpty());
        }

        return result;
    }

    
    public transformReplaceTape(t: TstReplaceTape, env: TransEnv): TstResult {
        
        const result = t.transform(this, env) as Result<TstReplaceTape>;
        const [replace, _] = result.destructure();

        if (replace.child instanceof TstEmpty) {
            return result.warn("The cells to the right do not contain " +
                            "valid material, so this replacement will be ignored.")
                         .bind(r => r.sibling);
        } 

        if (replace.sibling instanceof TstEmpty) {
            return result.err(`Missing argument to replace'`,
                            `Replace needs a grammar to operate on; ` +
                            "something should be in a cell above this.")
                          .bind(r => new TstEmpty());
        }

        return result;
    }
}
