import { Msg, Msgs, GenOptions, StringDict, unlocalizedError, unlocalizedSuccess } from "../util";
import { CounterStack, SymbolTable } from "../exprs";
import { 
    CountGrammar, EqualsGrammar, 
    Grammar, NegativeUnitTestGrammar, 
    NsGrammar, PriorityGrammar, 
    UnitTestGrammar 
} from "../grammars";
import { VocabMap, TapeNamespace} from "../tapes";
import { generate } from "../generator";
import { IdentityTransform } from "./transforms";


export class UnitTestTransform extends IdentityTransform {

    constructor(
        ns: NsGrammar,
        public vocab: VocabMap,
        public tapeNS: TapeNamespace,
        public symbolTable: SymbolTable
    ) {
        super(ns);
    }

    public transformUnitTest(g: UnitTestGrammar): [Grammar, Msgs] {
        const [newThis, errs] = super.transformUnitTest(g) as [UnitTestGrammar, Msgs];
        const results = this.executeTest(newThis);
        if (results.length == 0) {
            errs.push(unlocalizedError(
                "Failed unit test",
                "The grammar above has no outputs compatible with these inputs."
            ));
        } else {
            errs.push(unlocalizedSuccess(
                "The grammar above has outputs compatible with these inputs."
            ));
        }

        uniqueLoop: for (const unique of newThis.uniques) {
            resultLoop: for (const result of results) {
                if (!(unique.tapeName in result)) {
                    errs.push(unlocalizedError(
                        "Failed unit test",
                        `An output on this line does not contain a ${unique.tapeName} field: ` +
                                    `${Object.entries(result).map(([k,v]) => `${k}:${v}`)}`
                    ));
                    break uniqueLoop;
                }
                if (result[unique.tapeName] != unique.text) {
                    errs.push(unlocalizedError(
                        "Failed unit test",
                        `An output on this line has a conflicting result for this field: ` +
                                `${result[unique.tapeName]}`
                    ));
                    break resultLoop;
                }
            }
        }
        return [newThis, errs];
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar): [Grammar, Msgs] {
        const [newThis, errs] = super.transformNegativeUnitTest(g) as [NegativeUnitTestGrammar, Msgs];
        const results = this.executeTest(newThis);
        if (results.length > 0) {
            errs.push(unlocalizedError(
                "Failed unit test",
                "The grammar above incorrectly has outputs compatible with these inputs."
            ));
        } else {
            errs.push(unlocalizedSuccess(
                "The grammar above correctly has no outputs compatible with these inputs."
            ));
        }
        return [newThis, errs];
    }
    
    public executeTest(test: UnitTestGrammar): StringDict[] {

        const opt = new GenOptions();

        // create a filter for each test
        let targetComponent: Grammar = new EqualsGrammar(test.child, test.test);

        const tapePriority = targetComponent.calculateTapes(new CounterStack(2));
        
        // there won't be any new vocabulary here, but it's possible (indeed, frequent)
        // that the Equals we made above has a different join/concat tape structure
        // than the original grammar, so we have to check
        targetComponent.collectAllVocab(this.vocab, this.tapeNS);
            
        const potentiallyInfinite = targetComponent.potentiallyInfinite(new CounterStack(2));
        if (potentiallyInfinite && opt.maxChars != Infinity) {
            if (targetComponent instanceof PriorityGrammar) {
                targetComponent.child = new CountGrammar(targetComponent.child, opt.maxChars-1);
            } else {
                targetComponent = new CountGrammar(targetComponent, opt.maxChars-1);
            }
        }

        if (!(targetComponent instanceof PriorityGrammar)) {
            targetComponent = new PriorityGrammar(targetComponent, tapePriority);
        }

        const expr = targetComponent.constructExpr(this.symbolTable);

        return [...generate(expr, this.tapeNS, opt)];

    }
}