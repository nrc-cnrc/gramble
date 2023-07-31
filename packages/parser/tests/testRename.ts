import { 
    Rename, 
    Seq, 
    Join, 
    Uni, 
    Collection,
    Embed,
    Intersect,
    Rep,
    Any,
    Epsilon,
    Null
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2, t3, t4, t5,
    testHasTapes,
    testGenerate
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Rename t1>t2, t1:hello', function() {
        const grammar = Rename(t1("hello"), "t1", "t2");
        testHasTapes(grammar, ["t2"]);
        //testHasNoVocab(grammar, "t1");
        //testHasVocab(grammar, {t2: 4});
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('2. t1:hello + (Rename t1>t2, t1:world)', function() {
        const grammar = Seq(t1("hello"), Rename(t1("world"), "t1", "t2"));
        testHasTapes(grammar, ["t1", "t2"]);
        //testHasNoVocab(grammar, "t1");
        //testHasVocab(grammar, {t2: 4});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "world"}
        ];
        testGenerate(grammar, expectedResults);
    });


    describe('3. Rename t1>t1, t1:hello', function() {
        const grammar = Rename(t1("hello"), "t1", "t1");
        testHasTapes(grammar, ["t1"]);
        //testHasNoVocab(grammar, "t1");
        //testHasVocab(grammar, {t2: 4});
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('4. Rename t1>t2, ε', function() {
        const grammar = Rename(Epsilon(), "t1", "t2");
        testHasTapes(grammar, []);
        const expectedResults: StringDict[] = [
            {}
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('5. Rename t1>t2, ∅', function() {
        const grammar = Rename(Null(), "t1", "t2");
        testHasTapes(grammar, []);
        const expectedResults: StringDict[] = [
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('6. Rename t1>t2, t1:', function() {
        const grammar = Rename(t1(""), "t1", "t2");
        testHasTapes(grammar, ["t2"]);
        const expectedResults: StringDict[] = [
            {}
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('7. Rename t1>t2, t1:hi + t2:wo', function() {
        const grammar = Rename(Seq(t1("hi"), t2("wo")), "t1", "t2");
        testHasTapes(grammar, ["t2"]);
        const expectedResults: StringDict[] = [
            {t2: "hi"},
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('8. Rename t3>t4, t1:hello + t2:foo', function() {
        const grammar = Rename(Seq(t1("hello"), t2("foo")), "t3", "t4");
        testHasTapes(grammar, ["t1", "t2"]);
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "foo"}
        ];
        testGenerate(grammar, expectedResults);
    });
        
    describe('9. Rename t1>t2, t1:hello + t5:foo', function() {
        const grammar = Rename(Seq(t1("hello"), t5("foo")), "t1", "t2");
        testHasTapes(grammar, ["t2", "t5"]);
        //testHasVocab(grammar, {"t2": 4, "t5": 2});
        //testHasNoVocab(grammar, "t1");
        const expectedResults: StringDict[] = [
            {t2: "hello", t5: "foo"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('10. (Rename t1>t2, t1:hello + t5:foo) | ' +
             '(Rename t1>t3, t1:hello + t5:foo)', function() {
        const grammar = Uni(Rename(Seq(t1("hello"), t5("foo")), "t1", "t2"),
                            Rename(Seq(t1("hello"), t5("foo")), "t1", "t3"));
        testHasTapes(grammar, ["t2", "t3", "t5"]);
        //testHasVocab(grammar, {"t2": 4, "t3": 4, "t5": 2});
        //testHasNoVocab(grammar, "t1");
        const expectedResults: StringDict[] = [
            {t2: "hello", t5: "foo"},
            {t3: "hello", t5: "foo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('11. Intersect t2:hello & Rename t1>t2, t1:hello', function() {
        const grammar = Intersect(t2("hello"),
                                  Rename(t1("hello"), "t1", "t2"));
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('12. Intersect t2:hello & Rename t2>t1, t2:hello', function() {
        const grammar = Intersect(t2("hello"),
                                  Rename(t2("hello"), "t2", "t1"));
        const expectedResults: StringDict[] = [
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('13. Intersect (Rename t1>t2, t1:hello) & t2:hello', function() {
        const grammar = Intersect(Rename(t1("hello"), "t1", "t2"),
                                  t2("hello"));
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];  
        testGenerate(grammar, expectedResults);
    });

    describe('14. Intersect (Rename t2>t1, t2:hello) & t2:hello', function() {
        const grammar = Intersect(Rename(t2("hello"), "t2", "t1"),
                                  t2("hello"));
        const expectedResults: StringDict[] = [
        ];
        testGenerate(grammar, expectedResults);
    });
    
    describe('15. Intersect (t2:hello + t1:.*) & Rename t2>t1, t2:hello', function() {
        const grammar = Intersect(Seq(t2("hello"), Rep(Any("t1"))),
                                  Rename(t2("hello"), "t2", "t1"));
        const expectedResults: StringDict[] = [
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('16. Join t2:hello ⨝ Rename t1>t2, t1:hello', function() {
        const grammar = Join(t2("hello"),
                             Rename(t1("hello"), "t1", "t2"));
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('17. Join (Rename t1>t2, t1:hello) ⨝ t2:hello', function() {
        const grammar = Join(Rename(t1("hello"), "t1", "t2"),
                             t2("hello"));
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('18. Join (Rename t1>t2, t1:hello + t3:foo) ⨝ t2:hello', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                             t2("hello"));
        const expectedResults: StringDict[] = [
            {t2: "hello", t3: "foo"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('19. Join t2:hello ⨝ (Rename t1>t2, t1:hello + t3:foo)', function() {
        const grammar = Join(t2("hello"),
                             Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        const expectedResults: StringDict[] = [
            {t2: "hello", t3: "foo"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('20. Join t3:foo ⨝ (Rename t1>t2 of t1:hello + t3:foo)', function() {
        const grammar = Join(t3("foo"),
                             Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        const expectedResults: StringDict[] = [
            {t2: "hello", t3: "foo"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('21. Join (Rename t1>t2, t1:hello + t3:foo) ⨝ ' +
             '(t2:hello + t3:bar)', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                             Seq(t2("hello"), t3("bar")));
        const expectedResults: StringDict[] = [
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('22. Join (t2:hello + t3:bar) ⨝ ' +
             '(Rename t1>t2, t1:hello + t3:foo)', function() {
        const grammar = Join(Seq(t2("hello"), t3("bar")),
                             Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        const expectedResults: StringDict[] = [
        ];
        testGenerate(grammar, expectedResults);
    });
   
    describe('23. Rename t2>t3 of symbol t1:hi+t2:world)', function() {
        const grammar = Collection({ 
            a: Seq(t1("hi"), t2("world")),
            default: Rename(Embed("a"), "t2", "t3") 
        });
        testHasTapes(grammar, ["t1", "t3"]);
        const expectedResults: StringDict[] = [
            {t1: "hi", t3: "world"}
        ];
        testGenerate(grammar, expectedResults);
    });
    
    /*
    describe('Rename + embed bug encountered in implementing templates', function() {
        const symbolTable = makeTestNamespace({ "s": Seq(t2("hi"), t3("hello"), t4("goodbye")) });
        const grammar = Uni(Rename(Seq(Emb("s", symbolTable), t5("foo")), "t2", "t1"),
                            Rename(Seq(Emb("s", symbolTable), t5("foo")), "t3", "t1"),
                            Rename(Seq(Emb("s", symbolTable), t5("foo")), "t4", "t1"));
        testAstHasTapes(grammar, ["t1", "t2", "t3", "t4", "t5"]);
        //testHasVocab(grammar, {"t1": 9, "t2": 2, "t3": 4, "t4": 6, "t5": 2});
        const expectedResults: StringDict[] = [
            {t1: "hi", t3: "hello", t4: "goodbye", t5: "foo"}, 
            {t2: "hi", t1: "hello", t4: "goodbye", t5: "foo"},
            {t2: "hi", t3: "hello", t1: "goodbye", t5 :"foo"}
        ];
        testAst(grammar, expectedResults);
    });
    */

});
