import { Dict, StringDict, exhaustive, mapDict } from "../utils/func.js";
import { constructSelection, Expr } from "../exprs.js";
import { Message, Err, Succeed, THROWER, Msg, Warn } from "../utils/msgs.js";
import { 
    Grammar, TestNotGrammar, 
    TestGrammar, 
    AbstractTestGrammar,
    JoinGrammar,
    TestBlockGrammar
} from "../grammars.js";

import { generate } from "../generator.js";
import { Pass, SymbolEnv } from "../passes.js";
import { constructExpr } from "./constructExpr.js";
import { CreateCursors } from "./createCursors.js";
import { InfinityProtection } from "./infinityProtection.js";
import { Options, Env } from "../utils/options.js";
import { ResolveVocab } from "./resolveVocab.js";
import { toStr } from "./toStr.js";


export class ExecuteTests extends Pass<Grammar,Grammar> {

    constructor(
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
                case "testblock":    return this.handleTestBlock(g, env);
                default:        return g;
            }
        }).localize(g.pos);
    }


    public handleTestBlock(g: TestBlockGrammar, env: SymbolEnv): Msg<Grammar> {
        const msgs: Message[] = [];

        const childTapes = new Set(g.child.tapeNames);

        for (const test of g.tests) {
            const tapeMsgs: Message[] = [];
            for (const testTape of test.tapeNames) {
                if (childTapes.has(testTape)) continue;
                Err(`Ill-formed unit test - no '${testTape}' header`, 
                    `This test expects a header called '${testTape}', but none exists ` +
                    "in the grammar being tested. Some tests may not execute.")
                    .msgTo(tapeMsgs);
            }

            if (tapeMsgs.length > 0) {
                msgs.push(...tapeMsgs);
                Warn(`This test line was not executed due to a missing header error above.`)
                    .localize(test.pos)
                    .msgTo(msgs);
                continue;
            }

            const results = this.executeTest(g.child, test, env);
            const resultMsgs = gradeResults(test, results);
            msgs.push(...resultMsgs);
        }

        return g.msg(msgs);
    }
    
    public executeTest(
        g: Grammar,
        test: AbstractTestGrammar, 
        env: SymbolEnv
    ): StringDict[] {
        // create a filter for each test
        let targetGrammar: Grammar = new JoinGrammar(g, test.test)
                                        .tapify(env);    
        
        targetGrammar = new CreateCursors()
                                .transform(targetGrammar, env)
                                .msgTo(THROWER);

        targetGrammar = new InfinityProtection()
                                .transform(targetGrammar, env)
                                .msgTo(THROWER);

        targetGrammar = new ResolveVocab()
                                .transform(targetGrammar, env)
                                .msgTo(THROWER);

        let expr = constructExpr(env, targetGrammar);
        expr = constructSelection(env, expr, this.symbolTable);
        return [...generate(expr, false, env.opt)];

    }
}

function gradeResults(
    test: AbstractTestGrammar,
    results: StringDict[]
): Message[] {

    switch (test.tag) {
        case "test": 
            return gradeTestResults(test as TestGrammar, results);
        case "testnot": 
            return gradeTestNotResults(test as TestNotGrammar, results);
        default: 
            return []; // won't happen, just for typechecking
    }
}


function gradeTestResults(
    test: TestGrammar, 
    results: StringDict[]
): Message[] {
    const msgs: Message[] = [];

    let match = false;
    resultLoop: for (const result of results) {
        match = true;
        uniqueLoop: for (const unique of test.uniques) {
            if (unique.text == "" && !(unique.tapeName in result)) {
                continue;
            }
            if(!(unique.tapeName in result)
                    || result[unique.tapeName] != unique.text) {
                match = false;
                break uniqueLoop;
            }
        }
        if (match) break resultLoop;
    }

    if (!match) {
        Err("Failed unit test - no matching outputs",
            "The grammar above has no outputs compatible with this specification.")
            .localize(test.pos)
            .msgTo(msgs);
    }

    uniqueLoop2: for (const unique of test.uniques) {
        resultLoop2: for (const result of results) {
            if (unique.text == "" && !(unique.tapeName in result)) {
                continue;
            }
            if (!(unique.tapeName in result)) {
                const resultStr = Object.entries(result).map(([k,v]) => `${k}:${v}`);
                Err(`Failed unit test - output missing '${unique.tapeName}'`,
                    "An output for this line's inputs does not contain a " +
                    `'${unique.tapeName}' field: [${resultStr}]`)
                    .localize(test.pos)
                    .msgTo(msgs);
                break uniqueLoop2;
            }
            if (result[unique.tapeName] != unique.text) {
                Err(`Failed unit test - unexpected '${unique.tapeName}' result`,
                    "An output for this line's inputs has an unexpected result for the " +
                    `'${unique.tapeName}' field: ${result[unique.tapeName]}`)
                    .localize(test.pos)
                    .msgTo(msgs);
                break resultLoop2;
            }
        }
    }

    if (msgs.length == 0) {
        Succeed("The grammar above correctly has outputs compatible with this specification.")
            .localize(test.pos)
            .msgTo(msgs);
    }

    return msgs;
}

function gradeTestNotResults(
    test: TestNotGrammar, 
    results: StringDict[]
): Message[] {
    if (results.length > 0) {
        return [
            Err("Failed unit testnot - has matching outputs",
            "The grammar above incorrectly has outputs compatible with this specification.")
                .localize(test.pos)
        ];
    } 
    
    return [
        Succeed(
            "The grammar above correctly has no outputs compatible with this specification.")
                .localize(test.pos)
    ];
}