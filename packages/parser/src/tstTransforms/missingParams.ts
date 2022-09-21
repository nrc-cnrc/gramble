import { 
    TstAssignment, TstBinaryOp, 
    TstComponent, TstEmpty,
    TstNegativeUnitTest, TstReplace, 
    TstReplaceTape, TstResult, TstTable, 
    TstTableOp, TstUnitTest 
} from "../tsts";
import { Err, Msgs, Result, Warn } from "../msgs";

export class MissingParamsTransform {

    public transform(t: TstComponent): TstResult {

        switch(t.constructor.name) {
            case 'TstUnitTest': 
                return this.transformTest(t as TstUnitTest);
            case 'TstNegativeUnitTest': 
                return this.transformNegativeTest(t as TstNegativeUnitTest);
            case 'TstReplace':
                return this.transformReplace(t as TstReplace);
            case 'TstReplaceTape':
                return this.transformReplaceTape(t as TstReplaceTape);
            case 'TstAssignment':
                return this.transformAssignment(t as TstAssignment);
            case 'TstBinaryOp':
                return this.transformBinaryOp(t as TstBinaryOp);
            case 'TstTableOp':
                return this.transformTableOp(t as TstTableOp);
            default: 
                return t.transform(this);
        }
    }

    public transformTest(t: TstUnitTest): TstResult {
        
        const result = t.transform(this) as Result<TstUnitTest>;
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

    public transformTableOp(t: TstTableOp): TstResult {

        const result = t.transform(this) as Result<TstTableOp>;
        const [table, _] = result.destructure();

        if (table.child instanceof TstEmpty) {
            return result.warn("This table will not contain any content.")
                         .bind(r => new TstEmpty());
        }

        return result;

    }

    public transformBinaryOp(t: TstBinaryOp): TstResult {
        
        let result = t.transform(this) as Result<TstBinaryOp>;
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

    public transformNegativeTest(t: TstNegativeUnitTest): TstResult {
        
        const result = t.transform(this) as Result<TstNegativeUnitTest>;
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

    public transformAssignment(t: TstAssignment): TstResult {
        const result = t.transform(this) as Result<TstAssignment>;
        const [assignment, _] = result.destructure();
        if (assignment.child instanceof TstEmpty) {
            return result.warn(
                `This symbol will not contain any content.`
            );
        }

        return result;
    }

    public transformReplace(t: TstReplace): TstResult {
        
        const result = t.transform(this) as Result<TstReplace>;
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

    
    public transformReplaceTape(t: TstReplaceTape): TstResult {
        
        const result = t.transform(this) as Result<TstReplaceTape>;
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
