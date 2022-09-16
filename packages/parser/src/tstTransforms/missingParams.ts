import { 
    TstAssignment, TstBinaryOp, 
    TstComponent, TstEmpty, 
    TstNegativeUnitTest, TstReplace, 
    TstReplaceTape, TstTable, 
    TstTableOp, TstUnitTest 
} from "../tsts";
import { Err, Msgs, Warn } from "../msgs";

export class MissingParamsTransform {

    public transform(t: TstComponent): [TstComponent, Msgs] {

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
            default: 
                return t.transform(this);
        }
    }

    public transformTest(t: TstUnitTest): [TstComponent, Msgs] {
        
        const [result, msgs] = t.transform(this) as [TstUnitTest, Msgs];

        if (result.child instanceof TstEmpty) {
            msgs.push(Warn(
                "'test' seems to be missing something to test; " +
                "something should be in the cell to the right."
            ).localize(result.pos));
            return [result.sibling, msgs]; 
        }

        if (!(result.child instanceof TstTable) && !(result.child instanceof TstTableOp)) {
            msgs.push(Err("Cannot execute tests",
                "You can't nest another operator to the right of a test block, " + 
                "it has to be a content table."
            ).localize(result.pos));
            return [result.sibling, msgs];
        }

        if (result.sibling instanceof TstEmpty) {
            msgs.push(Err("Wayward test",
                "There should be something above this 'test' command to test"
            ).localize(result.pos));
            return [new TstEmpty(), msgs];
        }

        return [result, msgs];
    }

    public transformBinaryOp(t: TstBinaryOp): [TstComponent, Msgs] {
        
        const [result, msgs] = t.transform(this) as [TstNegativeUnitTest, Msgs];

        if (result.child instanceof TstEmpty) {
            msgs.push(Err(`Missing argument to '${result.text}'`, 
                `'${result.text}' is missing a second argument; ` +
                "something should be in the cell to the right."
            ).localize(result.pos));
        }

        if (result.sibling instanceof TstEmpty) {
            msgs.push(Err(`Missing argument to '${result.text}'`,
                `'${result.text}' is missing a first argument; ` +
                "something should be in a cell above this."
            ).localize(result.pos));
        } 

        return [result, msgs];
    }

    public transformNegativeTest(t: TstNegativeUnitTest): [TstComponent, Msgs] {
        
        const [result, msgs] = t.transform(this) as [TstNegativeUnitTest, Msgs];

        if (result.child instanceof TstEmpty) {
            msgs.push(Warn(
                "'testnot' seems to be missing something to test; " +
                "something should be in the cell to the right."
            ).localize(result.pos));
            return [result.sibling, msgs]; 
        }

        if (!(result.child instanceof TstTable) && !(result.child instanceof TstTableOp)) {
            msgs.push(Err("Cannot execute testnot",
                "You can't nest another operator to the right of a testnot block, " + 
                "it has to be a content table."
            ).localize(result.pos));
            return [result.sibling, msgs];
        }

        if (result.sibling instanceof TstEmpty) {
            msgs.push(Err("Wayward testnot",
                "There should be something above this 'testnot' command to test"
            ).localize(result.pos));
            return [new TstEmpty(), msgs];
        }

        return [result, msgs];
    }

    public transformAssignment(t: TstAssignment): [TstComponent, Msgs] {
        const [result, msgs] = t.transform(this) as [TstAssignment, Msgs];

        if (result.child instanceof TstEmpty) {
            msgs.push(Warn(
                `This symbol will not contain any content.`
            ).localize(result.pos));
        }

        return [result, msgs];
    }

    public transformReplace(t: TstReplace): [TstComponent, Msgs] {
        
        const [result, msgs] = t.transform(this) as [TstReplace, Msgs];

        if (result.child instanceof TstEmpty) {
            msgs.push(Warn(
                "The cells to the right do not contain " + 
                "valid material, so this replacement will be ignored."
            ).localize(result.pos));
            return [result.sibling, msgs];
        } 

        if (result.sibling instanceof TstEmpty) {
            msgs.push(Err(`Missing argument to replace'`,
                `'replace:' needs a grammar to operate on; ` +
                "something should be in a cell above this."
            ).localize(result.pos));
            return [new TstEmpty(), msgs];
        }

        return [result, msgs];
    }

    
    public transformReplaceTape(t: TstReplaceTape): [TstComponent, Msgs] {
        
        const [result, msgs] = t.transform(this) as [TstReplace, Msgs];

        if (result.child instanceof TstEmpty) {
            msgs.push(Warn("The cells to the right do not contain " +
               "valid material, so this replacement will be ignored."
            ).localize(result.pos));
            return [result.sibling, msgs];
        } 

        if (result.sibling instanceof TstEmpty) {
            msgs.push(Err(`Missing argument to replace'`,
                `'${result.text}' needs a grammar to operate on; ` +
                "something should be in a cell above this."
            ).localize(result.pos));
            return [new TstEmpty(), msgs];
        }

        return [result, msgs];
    }
}
