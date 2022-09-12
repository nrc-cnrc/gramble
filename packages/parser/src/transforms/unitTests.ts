import { Err, GenOptions, StringDict } from "../util";
import { CounterStack, SymbolTable } from "../exprs";
import { CountGrammar, EqualsGrammar, Grammar, LiteralGrammar, NegativeUnitTestGrammar, NsGrammar, PriorityGrammar, UnitTestGrammar } from "../grammars";
import { VocabMap, TapeNamespace} from "../tapes";
import { generate } from "../generator";
import { IdentityTransform } from "./transforms";


type TestEnv = {
    vocab: VocabMap,
    tapeNS: TapeNamespace,
    symbolTable: SymbolTable
}


export class UnitTestTransform extends IdentityTransform {

    constructor(
        ns: NsGrammar,
        public vocab: VocabMap,
        public tapeNS: TapeNamespace,
        public symbolTable: SymbolTable
    ) {
        super(ns);
    }

    public transformUnitTest(g: UnitTestGrammar): [Grammar, Err[]] {
        const [newThis, errs] = super.transformUnitTest(g) as [UnitTestGrammar, Err[]];
        const results = this.executeTest(newThis);
        if (results.length == 0) {
            newThis.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above has no outputs compatible with these inputs."
            });
        } else {
            newThis.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above has outputs compatible with these inputs."
            });
        }

        uniqueLoop: for (const unique of newThis.uniques) {
            resultLoop: for (const result of results) {
                if (result[unique.tapeName] != unique.text) {
                    unique.message({
                        type: "error",
                        shortMsg: "Failed unit test",
                        longMsg: `An output on this line has a conflicting result for this field: ${result[unique.tapeName]}`
                    });
                    break resultLoop;
                }
                if (!(unique.tapeName in result)) {
                    unique.message({
                        type: "error",
                        shortMsg: "Failed unit test",
                        longMsg: `An output on this line does not contain a ${unique.tapeName} field: ${Object.entries(result)}`
                    });
                    break uniqueLoop;
                }
            }
        }
        return [newThis, errs];
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar): [Grammar, Err[]] {
        const [newThis, errs] = super.transformNegativeUnitTest(g) as [NegativeUnitTestGrammar, Err[]];
        const results = this.executeTest(newThis);
        if (results.length > 0) {
            newThis.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above incorrectly has outputs compatible with these inputs."
            });
        } else {
            newThis.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above correctly has no outputs compatible with these inputs."
            });
        }
        return [newThis, errs];
    }
    
    public executeTest(test: UnitTestGrammar): StringDict[] {

        const opt = new GenOptions();

        // create a filter for each test
        let targetComponent: Grammar = new EqualsGrammar(test.cell, test.child, test.test);

        const tapePriority = targetComponent.calculateTapes(new CounterStack(2));
        
        // we have to collect any new vocab, but only from the new material
        targetComponent.collectAllVocab(this.vocab, this.tapeNS);
        // we still have to copy though, in case the query added new vocab
        // to something that's eventually a "from" tape of a replace
        //targetComponent.copyVocab(this.tapeNS, new Set());
            
        const potentiallyInfinite = targetComponent.potentiallyInfinite(new CounterStack(2));
        if (potentiallyInfinite && opt.maxChars != Infinity) {
            if (targetComponent instanceof PriorityGrammar) {
                targetComponent.child = new CountGrammar(targetComponent.child.cell, targetComponent.child, opt.maxChars-1);
            } else {
                targetComponent = new CountGrammar(targetComponent.cell, targetComponent, opt.maxChars-1);
            }
        }

        if (!(targetComponent instanceof PriorityGrammar)) {
            targetComponent = new PriorityGrammar(targetComponent.cell, targetComponent, tapePriority);
        }

        const expr = targetComponent.constructExpr(this.symbolTable);

        return [...generate(expr, this.tapeNS, opt)];

    }
}