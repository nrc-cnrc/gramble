import { 
    Seq, Join, Hide, 
    Rename, Filter, 
    Collection, Embed, Lit 
} from "../src/grammars";
import { t1, t2, t3, testHasTapes, 
    testGrammar, DEFAULT_MAX_RECURSION } from './testUtil';
import { SILENT, StringDict, VERBOSE_DEBUG } from "../src/util";
import * as path from 'path';

const DUMMY_SYMBOL: string = "";

describe(`${path.basename(module.filename)}`, function() {

    describe('1a. hide(t2) of t1:hello', function() {
        const grammar = Hide(t1("hello"), "t2");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('1b. hide(t2) of t1:hello', function() {
        const grammar = Hide(t1("hello"), "t2", "HIDDEN");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('2a. hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Hide(Seq(t1("hello"), t2("foo")), "t2");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('2b. hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN");
        const expectedResults: StringDict[] = [
            {t1: "hello", '.HIDDEN': "foo"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t1: 4, '.HIDDEN': 2});
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('3a. hide(t2, t1:hello+t2:foo)+t2:bar', function() {
        const grammar = Seq(Hide(Seq(t1("hello"), t2("fooo")), "t2"),
                            t2("bar"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. hide(t2, t1:hello+t2:foo)+t2:bar', function() {
        const grammar = Seq(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                            t2("bar"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar", '.HIDDEN': "foo"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('4a. t2:bar + hide(t2, t1:hello+t2:foo)', function() {
        const grammar = Seq(t2("bar"),
                            Hide(Seq(t1("hello"), t2("foo")), "t2"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4b. t2:bar + hide(t2, t1:hello+t2:foo)', function() {
        const grammar = Seq(t2("bar"),
                            Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar", '.HIDDEN': "foo"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('5a. hide(t2, t1:hello+t2:foo) & t2:bar', function() {
        const grammar = Join(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                             t2("bar"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5b. hide(t2, t1:hello+t2:foo) & t2:bar', function() {
        const grammar = Join(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                             t2("bar"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar", '.HIDDEN': "foo"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('6a. t2:bar ⨝ hide(t2, t1:hello+t2:foo) ', function() {
        const grammar = Join(t2("bar"),
                             Hide(Seq(t1("hello"), t2("foo")), "t2"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('6b. t2:bar ⨝ hide(t2, t1:hello+t2:foo) ', function() {
        const grammar = Join(t2("bar"),
                             Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"));
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "bar", '.HIDDEN': "foo"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('7a. hide(t2) of t1:hello+t2:foo ⨝ t1:hello+t2:foo', function() {
        const grammar = Hide(Join(Seq(t1("hello"), t2("foo")),
                                  Seq(t1("hello"), t2("foo"))), "t2");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('7b. hide(t2) of t1:hello+t2:foo ⨝ t1:hello+t2:foo', function() {
        const grammar = Hide(Join(Seq(t1("hello"), t2("foo")),
                                  Seq(t1("hello"), t2("foo"))), "t2", "HIDDEN");
        const expectedResults: StringDict[] = [
            {t1: "hello", '.HIDDEN': "foo"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('8a. hide(t2) of t1:hello+t2:foo ⨝ t1:hello+t2:bar', function() {
        const grammar = Hide(Join(Seq(t1("hello"), t2("foo")),
                                  Seq(t1("hello"), t2("bar"))), "t2");
        testGrammar(grammar, []);
    });
    
    describe('8b. hide(t2) of t1:hello+t2:foo ⨝ t1:hello+t2:bar', function() {
        const grammar = Hide(Join(Seq(t1("hello"), t2("foo")),
                                  Seq(t1("hello"), t2("bar"))), "t2", "HIDDEN");
        testGrammar(grammar, [], SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('9a. Nested hide', function() {
        const grammar = Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")), "t1"), "t3");
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('9b. Nested hide', function() {
        const grammar = Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")),
                                  "t1", "HIDDEN_t1"),
                                "t3", "HIDDEN_t3");
        const expectedResults: StringDict[] = [
            {t2: "hello", '.HIDDEN_t1': "foo", '.HIDDEN_t3': "bar"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('10a. Rename t1>t2 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t2")
        testHasTapes(grammar, ["t2"]);
        //testHasVocab(grammar, {t2: 4});
        const expectedResults: StringDict[] = [
            {t2: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('10b. Rename t1>t2 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                               "t1", "t2")
        testHasTapes(grammar, ["t2", ".HIDDEN"], DUMMY_SYMBOL, false);
        // testHasVocab(grammar, {t1: 4, '.HIDDEN': 2});
        const expectedResults: StringDict[] = [
            {t2: "hello", '.HIDDEN': "foo"}
        ];
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('11a. Rename t1>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t1", "t3")
        const expectedResults: StringDict[] = [
            {t3: "hello"}
        ];
        testHasTapes(grammar, ["t3"]);
        //testHasVocab(grammar, {t3: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('11b. Rename t1>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                               "t1", "t3")
        const expectedResults: StringDict[] = [
            {t3: "hello", '.HIDDEN': "foo"}
        ];
        testHasTapes(grammar, ["t3", ".HIDDEN"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t3: 4, '.HIDDEN': 2});
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('12a. Rename t2>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"), "t2", "t3")
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults);
    });

    describe('12b. Rename t2>t3 of hide(t2) of t1:hello+t2:foo', function() {
        const grammar = Rename(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                               "t2", "t3")
        const expectedResults: StringDict[] = [
            {t1: "hello", ".HIDDEN": "foo"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t1: 4, '.HIDDEN': 2});
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('13a. Filter using a field and then hide it', function() {
        const grammar = Hide(Filter(Seq(t1("hello"), t2("foo")), t2("foo")), "t2");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, expectedResults);
    });

    describe('13b. Filter using a field and then hide it', function() {
        const grammar = Hide(Filter(Seq(t1("hello"), t2("foo")), t2("foo")), "t2", "HIDDEN");
        const expectedResults: StringDict[] = [
            {t1: "hello", ".HIDDEN": "foo"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });
    
    describe('13c. Filter using a field, embed it, and then hide it', function() {
        const grammar = Collection({
            "a": Filter(Seq(t1("hello"), t2("foo")), t2("foo")),
            "default": Hide(Embed("a"), "t2", "HIDDEN")
        });
        const expectedResults: StringDict[] = [
            {t1: "hello", ".HIDDEN": "foo"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('14a. Hide-filter-hide', function() {
        const grammar = Hide(Filter(Hide(Seq(t1("hello"), t2("foo"), t3("goo")), "t3"),
                                    t2("foo")), "t2");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"]);
        testGrammar(grammar, expectedResults);
    });
    
    describe('14b. Hide-filter-hide', function() {
        const grammar = Hide(Filter(Hide(Seq(t1("hello"), t2("foo"), t3("goo")), "t3", "HIDDEN_t3"),
                                    t2("foo")), "t2", "HIDDEN_t2");
        const expectedResults: StringDict[] = [
            {t1: "hello", '.HIDDEN_t2': "foo", '.HIDDEN_t3': "goo"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN_t2", ".HIDDEN_t3"], DUMMY_SYMBOL, false);
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('15a. Hide t2 of symbol t1:hi+t2:world', function() {
        const grammar = Collection({ 
            "a": Seq(t1("hi"), t2("world")),
            "default": Hide(Embed("a"), "t2") 
        });
        const expectedResults: StringDict[] = [
            {t1: "hi"}
        ];
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('15b. Hide t2 of symbol t1:hi+t2:world', function() {
        const grammar = Collection({ 
            "a": Seq(t1("hi"), t2("world")),
            "default": Hide(Embed("a"), "t2", "HIDDEN") 
        });
        const expectedResults: StringDict[] = [
            {t1: "hi", '.HIDDEN': "world"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t1: 2, '.HIDDEN': 2});
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('16a. Embed of hide(t2) of t1:hi+t2:foo', function() {
        const grammar = Collection({
            "b": Hide(Seq(t1("hi"), t2("foo")), "t2"),
            "default": Embed("b")
        });
        const expectedResults: StringDict[] = [
            {t1: "hi"}
        ];
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('16b. Embed of hide(t2) of t1:hi+t2:foo', function() {
        const grammar = Collection({
            "b": Hide(Seq(t1("hi"), t2("foo")), "t2", "HIDDEN"),
            "default": Embed("b")
        });
        const expectedResults: StringDict[] = [
            {t1: "hi", '.HIDDEN': "foo"}
        ];
        testHasTapes(grammar, ["t1", ".HIDDEN"], DUMMY_SYMBOL, false);
        //testHasVocab(grammar, {t1: 2, '.HIDDEN': 2});
        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('17. Hiding a hidden tape', function() {
        const grammar = Hide(Seq(t1("hello"), Lit(".t2", "foo")), ".t2");
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults);

    });
});
