import { Dict, GenOptions, StringDict } from "../util";
import { constructCollection, CounterStack, Expr, ExprNamespace } from "../exprs";
import { Msgs, Err, Success, Result, result } from "../msgs";
import { 
    CountGrammar, EqualsGrammar, 
    Grammar, GrammarPass, GrammarResult, TestNotGrammar, 
    CollectionGrammar, PriorityGrammar, 
    TestGrammar 
} from "../grammars";
import { TapeNamespace} from "../tapes";
import { generate } from "../generator";
import { PassEnv } from "../passes";

export class ExecuteTests extends GrammarPass {

    constructor(
        public tapeNS: TapeNamespace,
        public symbolTable: Dict<Expr>
    ) {
        super();
    }

    public get desc(): string {
        return "Running unit tests"
    }

    public transform(g: Grammar, env: PassEnv): GrammarResult {
        const result = g.mapChildren(this, env) as GrammarResult;
        return result.bind(g => {
            switch (g.constructor) {
                case TestGrammar:
                    return this.handleTest(g as TestGrammar, env);
                case TestNotGrammar:
                    return this.handleNegativeTest(g as TestNotGrammar, env);
                default:
                    return g;
            }
        });

    }

    public handleTest(g: TestGrammar, env: PassEnv): GrammarResult {
        const results = this.executeTest(g, env);
        const msgs: Msgs = [];
        if (results.length == 0) {
            Err("Failed unit test",
                "The grammar above has no outputs compatible with these inputs.").msgTo(msgs);
        } else {
            Success(
                "The grammar above has outputs compatible with these inputs.").msgTo(msgs);
        }

        uniqueLoop: for (const unique of g.uniques) {
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

        return g.msg(msgs);
    }

    public handleNegativeTest(g: TestNotGrammar, env: PassEnv): GrammarResult {
        const results = this.executeTest(g, env);
        if (results.length > 0) {
            return result(g).err("Failed unit test",
                "The grammar above incorrectly has outputs compatible with these inputs.");
        } else {
            return result(g).msg(Success(
                "The grammar above correctly has no outputs compatible with these inputs."));
        }
        return g.msg();
    }
    
    public executeTest(test: TestGrammar, env: PassEnv): StringDict[] {

        const opt = new GenOptions();

        // create a filter for each test
        let targetComponent: Grammar = new EqualsGrammar(test.child, test.test);

        // there won't be any new vocabulary here, but it's possible (indeed, frequent)
        // that the Equals we made above has a different join/concat tape structure
        // than the original grammar, so we have to check
        targetComponent.collectAllVocab(this.tapeNS, env);        
        const tapePriority = targetComponent.getAllTapePriority(this.tapeNS, env);
        
        const potentiallyInfinite = targetComponent.potentiallyInfinite(new CounterStack(2), env);
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

        const symbols = new ExprNamespace(this.symbolTable);
        let expr = targetComponent.constructExpr(this.tapeNS, symbols);
        expr = constructCollection(expr, this.symbolTable);
        return [...generate(expr, this.tapeNS, opt)];

    }
}