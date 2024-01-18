import { expect } from "chai";

import { 
    Dot, Epsilon, Null, 
    Rename, Seq, Uni 
} from "../../interpreter/src/grammarConvenience";

import { Grammar } from "../../interpreter/src/grammars";
import { toStr } from "../../interpreter/src/passes/toStr";

import { t1, t2, testSuiteName } from "../testUtil";

type GrammarIDTest = {
    testnum: string,
    grammar: Grammar,
    id: string
};

export function testGrammarID({
    testnum,
    grammar,
    id
}: GrammarIDTest): void {
    const result = toStr(grammar);
    it(`${testnum} should have id "${id}"`, function() {
        expect(result).to.equal(id);
    });
}

describe(`${testSuiteName(module)}`, function() {

    testGrammarID({
        testnum: "1",
        grammar: t1("hello"),
        id: "t1:hello"
    });

    testGrammarID({
        testnum: "2",
        grammar: Dot("t1"),
        id: "t1:."
    });

    testGrammarID({
        testnum: "3",
        grammar: Epsilon(),
        id: "ε"
    });
    
    testGrammarID({
        testnum: "4",
        grammar: Null(),
        id: "∅"
    });

    testGrammarID({
        testnum: "5",
        grammar: Seq(t1("hello"), t2("world")),
        id: "(seq t1:hello t2:world)"
    });

    testGrammarID({
        testnum: "6",
        grammar: Seq(t1("hello"), Epsilon()),
        id: "(seq t1:hello ε)"
    });

    testGrammarID({
        testnum: "7",
        grammar: Seq(t1("hello"), Uni(t2("world"), t2("kitty"))),
        id: "(seq t1:hello (alt t2:world t2:kitty))"
    });

    testGrammarID({
        testnum: "8",
        grammar: Rename(t1("hello"), "t1", "t2"),
        id: "(rename t1:hello t1 t2)"
    });

    /* 
    // this just changes too much to be reliable
    testGrammarID({
        testnum: "9",
        grammar: Collection({a: t1("hi"), b: Embed("a")}),
        id: "(collection {\n  a:t1:hi\n  b:(embed a)\n} Default)"
    });
    */
});

