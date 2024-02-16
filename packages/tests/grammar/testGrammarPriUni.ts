import {
    CharSet, Cursor, Epsilon, Join, Lit, Null, PriUni, Query, Rewrite, Seq, Uni,
} from "../../interpreter/src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2, t3,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging";
import { INPUT_TAPE } from "../../interpreter/src/utils/constants";
// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

const lang = (s: string) => Lit("lang", s);
const text = (s: string) => Lit("text", s);

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe("1.", test({
        grammar: Join(Lit(INPUT_TAPE, "abc"), Rewrite("a", "x")),
        results: [
            { "$i": "abc", "$o": "xbc" }
        ],
        verbose: VERBOSE_DEBUG
    }));

    /*
    const en1 = Seq(lang("eng"), Uni(
        text("a"),
        text("b"), 
        text("c")))

    const fr1 = Seq(lang("fra"), Uni(
        text("a"),
        text("c"),
        text("d")))
                    
    describe('1.', test({
        grammar: Cursor(["text", "lang"], PriUni(en1, fr1)),
        results: [
        ],
        optimizeAtomicity: false,
        verbose: VERBOSE_DEBUG
    }));

    /*
    const en2 = Seq(lang("en"), Uni(
        text("hello"),
        text("journal"), 
        text("capital")))

    const fr2 = Seq(lang("fr"), Uni(
        text("bonjour"),
        text("journal"),
        text("capital")))

    describe('2.', test({
        grammar: Cursor(["text", "lang"], PriUni(en2, fr2)),
        results: [
            {"lang":"fr","text":"bonjour"},
            {"lang":"fr","text":"capital"},
            {"lang":"en","text":"capital"},
            {"lang":"fr","text":"journal"},
            {"lang":"en","text":"journal"},
            {"lang":"en","text":"hello"}
        ],
    })); */

});
