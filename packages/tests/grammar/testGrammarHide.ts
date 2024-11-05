import { 
    Embed, Hide, Join,
    Lit, Rename, Seq,
} from "../../interpreter/src/grammarConvenience.js";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
} from "./testGrammarUtil.js";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil.js";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
		desc: '1a. hide(t1, t1:hello)',
        grammar: Hide(t1("hello"), "t1"),
        tapes: [],
        vocab: {t1: []},
        results: [
            {},
        ],
    });

    testGrammar({
		desc: '1b. hide(t1, t1:hello)',
        grammar: Hide(t1("hello"), "t1", "HIDDEN"),
        stripHidden: false,
        tapes: [".HIDDEN"],
        results: [
            {'.HIDDEN': 'hello'},
        ],
    });

    testGrammar({
		desc: '2a. hide(t2, t1:hello+t2:foo)',
        grammar: Hide(Seq(t1("hello"), t2("foo")), "t2"),
        tapes: ["t1"],
        vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '2b. hide(t2, t1:hello+t2:fo)',
        grammar: Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
        stripHidden: false,
        tapes: ["t1", ".HIDDEN"],
        vocab: {t1: [..."helo"], '.HIDDEN': [..."fo"]},
        results: [
            {t1: 'hello', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '3a. hide(t2, t1:hello+t2:foo) + t2:bar',
        grammar: Seq(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                     t2("bar")),
        results: [
            {t1: 'hello', t2: 'bar'},
        ],
    });

    testGrammar({
		desc: '3b. hide(t2, t1:hello+t2:foo) + t2:bar',
        grammar: Seq(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                     t2("bar")),
        stripHidden: false,
        results: [
            {t1: 'hello', t2: 'bar', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '4a. t2:bar + hide(t2, t1:hello+t2:foo)',
        grammar: Seq(t2("bar"),
                     Hide(Seq(t1("hello"), t2("foo")), "t2")),
        results: [
            {t1: 'hello', t2: 'bar'},
        ],
    });

    testGrammar({
		desc: '4b. t2:bar + hide(t2, t1:hello+t2:foo)',
        grammar: Seq(t2("bar"),
                     Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN")),
        stripHidden: false,
        results: [
            {t1: 'hello', t2: 'bar', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '5a. hide(t2, t1:hello+t2:foo) ⨝ t2:bar',
        grammar: Join(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                      t2("bar")),
        results: [
            {t1: 'hello', t2: 'bar'},
        ],
    });

    testGrammar({
		desc: '5b. hide(t2, t1:hello+t2:foo) ⨝ t2:bar',
        grammar: Join(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                      t2("bar")),
        stripHidden: false,
        results: [
            {t1: 'hello', t2: 'bar', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '6a. t2:bar ⨝ hide(t2, t1:hello+t2:foo)',
        grammar: Join(t2("bar"),
                      Hide(Seq(t1("hello"), t2("foo")), "t2")),
        results: [
            {t1: 'hello', t2: 'bar'},
        ],
    });

    testGrammar({
		desc: '6b. t2:bar ⨝ hide(t2, t1:hello+t2:foo)',
        grammar: Join(t2("bar"),
                      Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN")),
        stripHidden: false,
        results: [
            {t1: 'hello', t2: 'bar', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '7a. hide(t2, t1:hello+t2:foo ⨝ t1:hello+t2:foo)',
        grammar: Hide(Join(Seq(t1("hello"), t2("foo")),
                           Seq(t1("hello"), t2("foo"))), "t2"),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '7b. hide(t2, t1:hello+t2:foo ⨝ t1:hello+t2:foo)',
        grammar: Hide(Join(Seq(t1("hello"), t2("foo")),
                           Seq(t1("hello"), t2("foo"))), "t2", "HIDDEN"),
        stripHidden: false,
        results: [
            {t1: 'hello', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '8a. hide(t2, t1:hello+t2:foo ⨝ t1:hello+t2:bar)',
        grammar: Hide(Join(Seq(t1("hello"), t2("foo")),
                           Seq(t1("hello"), t2("bar"))), "t2"),
        results: [
        ],
    });
    
    testGrammar({
		desc: '8b. hide(t2, t1:hello+t2:foo ⨝ t1:hello+t2:bar)',
        grammar: Hide(Join(Seq(t1("hello"), t2("foo")),
                           Seq(t1("hello"), t2("bar"))), "t2", "HIDDEN"),
        stripHidden: false,
        results: [
        ],
    });

    testGrammar({
		desc: '9a. Nested hide: ' +
             'hide(t3, hide(t1, t1:foo+t2:hello+t3:bar))',
        grammar: Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")),
                           "t1"), "t3"),
        results: [
            {t2: 'hello'},
        ],
    });

    testGrammar({
		desc: '9b. Nested hide: ' +
             'hide(t3, hide(t1, t1:foo+t2:hello+t3:bar))',
        grammar: Hide(Hide(Seq(t1("foo"), t2("hello"), t3("bar")),
                           "t1", "HIDDEN_t1"),
                      "t3", "HIDDEN_t3"),
        stripHidden: false,
        results: [
            {t2: 'hello', '.HIDDEN_t1': 'foo', '.HIDDEN_t3': 'bar'},
        ],
    });

    testGrammar({
		desc: '10a. Rename t1>t2, hide(t2, t1:hello+t2:foo)',
        grammar: Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                        "t1", "t2"),
        tapes: ["t2"],
        vocab: {t2: [..."helo"]},
        results: [
            {t2: 'hello'},
        ],
    });

    testGrammar({
		desc: '10b. Rename t1>t2, hide(t2, t1:hello+t2:foo)',
        grammar: Rename(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                        "t1", "t2"),
        stripHidden: false,
        tapes: ["t2", ".HIDDEN"],
        vocab: {t2: [..."helo"], '.HIDDEN': [..."fo"]},
        results: [
            {t2: 'hello', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '11a. Rename t1>t3, hide(t2, t1:hello+t2:foo)',
        grammar: Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                        "t1", "t3"),
        tapes: ["t3"],
        vocab: {t3: [..."helo"]},
        results: [
            {t3: 'hello'},
        ],
    });

    testGrammar({
		desc: '11b. Rename t1>t3, hide(t2, t1:hello+t2:foo)',
        grammar: Rename(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                        "t1", "t3"),
        stripHidden: false,
        tapes: ["t3", ".HIDDEN"],
        vocab: {t3: [..."helo"], '.HIDDEN': [..."fo"]},
        results: [
            {t3: 'hello', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '13a. Join using a field and then hide it: ' +
             'hide(t2, t1:hello+t2:foo ⨝ t2:foo)',
        grammar: Hide(Join(Seq(t1("hello"), t2("foo")),
                             t2("foo")), "t2"),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '13b. Join using a field and then hide it: ' +
             'hide(t2, t1:hello+t2:foo ⨝ t2:foo)',
        grammar: Hide(Join(Seq(t1("hello"), t2("foo")),
                             t2("foo")), "t2", "HIDDEN"),
        stripHidden: false,
        tapes: ["t1", ".HIDDEN"],
        results: [
            {t1: "hello", ".HIDDEN": "foo"},
        ],
    });
    
    testGrammar({
		desc: '13c. Join using a field, embed it, and then hide it: ' +
             'hide(t2, symbol (t1:hello+t2:foo) ⨝ t2:foo)',
        grammar: {
            a: Join(Seq(t1("hello"), t2("foo")), t2("foo")),
            default: Hide(Embed("a"), "t2", "HIDDEN")
        },
        stripHidden: false,
        tapes: ["t1", ".HIDDEN"],
        results: [
            {t1: 'hello', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '14a. Hide-filter-hide: ' +
             'hide(t2, hide(t3, t1:hello+t2:foo+t3:goo) ⨝ t2:foo)',
        grammar: Hide(Join(Hide(Seq(t1("hello"), t2("foo"), t3("goo")),
                                  "t3"), t2("foo")), "t2"),
        tapes: ["t1"],
        results: [
            {t1: 'hello'},
        ],
    });
    
    testGrammar({
		desc: '14b. Hide-filter-hide: ' +
             'hide(t2, hide(t3, t1:hello+t2:foo+t3:goo) ⨝ t2:foo)',
        grammar: Hide(Join(Hide(Seq(t1("hello"), t2("foo"), t3("goo")),
                                  "t3", "HIDDEN_t3"), t2("foo")),
                      "t2", "HIDDEN_t2"),
        stripHidden: false,
        tapes: ["t1", ".HIDDEN_t2", ".HIDDEN_t3"],
        results: [
            {t1: 'hello', '.HIDDEN_t2': 'foo', '.HIDDEN_t3': 'goo'},
        ],
    });

    testGrammar({
		desc: '15a. hide(t2, symbol t1:hi+t2:world)',
        grammar: { 
            a: Seq(t1("hi"), t2("world")),
            default: Hide(Embed("a"), "t2") 
        },
        symbol: "default",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
		desc: '15b. hide(t2, symbol t1:hi+t2:world)',
        grammar: { 
            a: Seq(t1("hi"), t2("world")),
            default: Hide(Embed("a"), "t2", "HIDDEN") 
        },
        symbol: "default",
        stripHidden: false,
        tapes: ["t1", ".HIDDEN"],
        vocab: {t1: [..."hi"], '.HIDDEN': [..."world"]},
        results: [
            {t1: 'hi', '.HIDDEN': 'world'},
        ],
    });

    testGrammar({
		desc: '16a. Embed hide(t2, t1:hi+t2:foo)',
        grammar: {
            b: Hide(Seq(t1("hi"), t2("foo")), "t2"),
            default: Embed("b")
        },
        symbol: "default",
        tapes: ["t1"],
        vocab: {t1: [..."hi"]},
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
		desc: '16b. Embed hide(t2, t1:hi+t2:foo)',
        grammar: {
            b: Hide(Seq(t1("hi"), t2("foo")), "t2", "HIDDEN"),
            default: Embed("b")
        },
        symbol: "default",
        stripHidden: false,
        tapes: ["t1", ".HIDDEN"],
        vocab: {t1: [..."hi"], '.HIDDEN': [..."fo"]},
        results: [
            {t1: 'hi', '.HIDDEN': 'foo'},
        ],
    });

    testGrammar({
		desc: '17. Hide a hidden tape: hide(t2, t1(hello) + .t2:foo)',
        grammar: Hide(Seq(t1("hello"), Lit(".t2", "foo")), ".t2"),
        tapes: ["t1"],
        vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
    });

    
    testGrammar({
		desc: 'E1a. hide(t2, t1:hello)',
        grammar: Hide(t1("hello"), "t2"),
        tapes: ["t1"],
        vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
        numErrors: 1,
    });

    testGrammar({
		desc: 'E1b. hide(t2, t1:hello)',
        grammar: Hide(t1("hello"), "t2", "HIDDEN"),
        stripHidden: false,
        tapes: ["t1"],
        vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
        numErrors: 1,
    });

    
    testGrammar({
		desc: 'E2a. Rename t2>t3, hide(t2, t1:hello+t2:foo)',
        grammar: Rename(Hide(Seq(t1("hello"), t2("foo")), "t2"),
                        "t2", "t3"),
        tapes: ["t1"],
        vocab: {t1: [..."helo"]},
        results: [
            {t1: 'hello'},
        ],
        numErrors: 1,
    });

    testGrammar({
		desc: 'E2b. Rename t2>t3, hide(t2, t1:hello+t2:foo)',
        grammar: Rename(Hide(Seq(t1("hello"), t2("foo")), "t2", "HIDDEN"),
                        "t2", "t3"),
        stripHidden: false,
        tapes: ["t1", ".HIDDEN"],
        vocab: {t1: [..."helo"], '.HIDDEN': [..."fo"]},
        results: [
            {t1: 'hello', '.HIDDEN': 'foo'},
        ],
        numErrors: 1,
    });

});
