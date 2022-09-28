import { GenOptions, StringDict } from "../util";
import { CounterStack, SymbolTable } from "../exprs";
import { Msgs, Err, Success } from "../msgs";
import { 
    CountGrammar, EqualsGrammar, 
    Grammar, GrammarResult, NegativeUnitTestGrammar, 
    NsGrammar, PriorityGrammar, 
    UnitTestGrammar 
} from "../grammars";
import { VocabMap, TapeNamespace} from "../tapes";
import { generate } from "../generator";
import { IdentityTransform } from "./transforms";
import { TransEnv } from "../transforms";


export class UnitTestTransform extends IdentityTransform {

    constructor(
        ns: NsGrammar,
        public vocab: VocabMap,
        public tapeNS: TapeNamespace,
        public symbolTable: SymbolTable
    ) {
        super(ns);
    }

    public get desc(): string {
        return "Running unit tests"
    }

    public transformUnitTest(g: UnitTestGrammar, env: TransEnv): GrammarResult {
        const [test, msgs] = super.transformUnitTest(g, env).destructure() as [UnitTestGrammar, Msgs];
        const results = this.executeTest(test);

        if (results.length == 0) {
            Err("Failed unit test",
                "The grammar above has no outputs compatible with these inputs.").msgTo(msgs);
        } else {
            Success(
                "The grammar above has outputs compatible with these inputs.").msgTo(msgs);
        }

        uniqueLoop: for (const unique of test.uniques) {
            resultLoop: for (const result of results) {
                if (!(unique.tapeName in result)) {
                    Err("Failed unit test",
                        `An output on this line does not contain a ${unique.tapeName} field: ` +
                        `${Object.entries(result).map(([k,v]) => `${k}:${v}`)}`).msgTo(msgs);
                    break uniqueLoop;
                }
                if (result[unique.tapeName] != unique.text) {
                    Err("Failed unit test",
                        `An output on this line has a conflicting result for this field: ` +
                        `${result[unique.tapeName]}`).msgTo(msgs);
                    break resultLoop;
                }
            }
        }

        return test.msg(msgs);
    }

    public transformNegativeUnitTest(g: NegativeUnitTestGrammar, env: TransEnv): GrammarResult {
        const [test, msgs] = super.transformNegativeUnitTest(g, env).destructure() as [NegativeUnitTestGrammar, Msgs];
        const results = this.executeTest(test);
        
        if (results.length > 0) {
            Err("Failed unit test",
                "The grammar above incorrectly has outputs compatible with these inputs.").msgTo(msgs);
        } else {
            Success(
                "The grammar above correctly has no outputs compatible with these inputs.").msgTo(msgs);
        }
        return test.msg(msgs);
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