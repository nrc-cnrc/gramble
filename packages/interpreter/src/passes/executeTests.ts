import { Dict, StringDict, mapDict } from "../utils/func";
import { constructCollection, Expr } from "../exprs";
import { Message, Err, Success, THROWER, Msg } from "../utils/msgs";
import { 
    Grammar, TestNotGrammar, 
    TestGrammar, 
    AbstractTestGrammar,
    JoinGrammar
} from "../grammars";

import { TapeNamespace} from "../tapes";
import { generate } from "../generator";
import { Pass, SymbolEnv } from "../passes";
import { constructExpr } from "./constructExpr";
import { CreateCursors } from "./createCursors";
import { InfinityProtection } from "./infinityProtection";
import { ResolveVocab } from "./resolveVocab";
import { Options, Env } from "../utils/options";

export class ExecuteTests extends Pass<Grammar,Grammar> {

    constructor(
        public tapeNS: TapeNamespace,
        public symbolTable: Dict<Expr>
    ) {
        super();
    }
    
    public getEnv(opt: Partial<Options>): Env<Grammar> {
        return new SymbolEnv(opt);
    }

    public transformAux(g: Grammar, env: SymbolEnv): Msg<Grammar> {
        const result = g.mapChildren(this, env);
        return result.bind(g => {
            switch (g.tag) {
                case "test":    return this.handleTest(g, env);
                case "testnot": return this.handleNegativeTest(g, env);
                default:        return g;
            }
        }).localize(g.pos);
    }

    public handleTest(g: TestGrammar, env: SymbolEnv): Msg<Grammar> {
        const msgs: Message[] = [];

        const childTapes = new Set(g.child.tapeNames);
        for (const testTape of g.test.tapeNames) {
            if (childTapes.has(testTape)) continue;
            Err("Ill-formed unit test", 
                `This expects a tape called ${testTape} but none exists in the grammar being tested.` + 
                "Some tests may not execute.").msgTo(msgs);
        }

        if (msgs.length > 0) return g.msg(msgs);

        const results = this.executeTest(g, env);
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
                    const resultStr = mapDict(result, (k,v) => `${k}:${v}`);
                    Err("Failed unit test",
                        `An output on this line does not contain a ${unique.tapeName} field: ` +
                        `${resultStr}`).msgTo(msgs);
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

    public handleNegativeTest(g: TestNotGrammar, env: SymbolEnv): Msg<Grammar> {
        const msgs: Message[] = [];

        const childTapes = new Set(g.child.tapeNames);
        for (const testTape of g.test.tapeNames) {
            if (childTapes.has(testTape)) continue;
            Err("Ill-formed unit test", 
                `This expects a tape called ${testTape} but none exists in the grammar being tested.` + 
                "Some tests may not execute.").msgTo(msgs);
        }

        if (msgs.length > 0) return g.msg(msgs);

        const results = this.executeTest(g, env);
        if (results.length > 0) {
            return g.err("Failed unit test",
                "The grammar above incorrectly has outputs compatible with these inputs.");
        } 

        return g.msg(Success(
            "The grammar above correctly has no outputs compatible with these inputs."));
    }
    
    public executeTest(
        test: AbstractTestGrammar, 
        env: SymbolEnv
    ): StringDict[] {

        // create a filter for each test
        let targetGrammar: Grammar = new JoinGrammar(test.child, test.test)
                                        .tapify(env);

        // there won't be any new vocabulary here, but it's possible (indeed, frequent)
        // that the Equals we made above has a different join/concat tape structure
        // than the original grammar, so we have to check
        targetGrammar.collectAllVocab(this.tapeNS, env);        
        
        const createCursors = new CreateCursors();
        targetGrammar = createCursors.transform(targetGrammar, env).msgTo(THROWER);

        const resolveVocab = new ResolveVocab();
        targetGrammar = resolveVocab.transform(targetGrammar, env).msgTo(THROWER);

        const infinityProtection = new InfinityProtection();
        targetGrammar = infinityProtection.transform(targetGrammar, env).msgTo(THROWER);
        
        let expr = constructExpr(env, targetGrammar);
        expr = constructCollection(env, expr, this.symbolTable);
        return [...generate(expr, this.tapeNS, false, env.opt)];

    }
}