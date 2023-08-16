
import {
    Any, Contains, Count, Ends, Epsilon,
    Filter, Intersect, MatchFrom, Not, Null,
    Rep, Seq, Short, Starts, Uni,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
    withVocab,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: 'F.1 Filter t1:hello [t1:hello]',
        grammar: Filter(t1("hello"), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'F.2 Filter t1:hello [ε]',
        grammar: Filter(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'F.3 Filter ε [ε]',
        grammar: Filter(Epsilon(), Epsilon()),
        results: [
            {},
        ],
    });

    testGrammar({
        desc: 'F.4 Filter ε [t1:hello]',
        grammar: Filter(Epsilon(), t1("hello")),
        results: [],
    });

    testGrammar({
        desc: 'F.5 Filter t1:hello [∅]',
        grammar: Filter(t1("hello"), Null()),
        results: [],
    });

    testGrammar({
        desc: 'F.6 Filter ∅ [ε]',
        grammar: Filter(Null(), Epsilon()),
        results: [],
    });

    testGrammar({
        desc: 'F.7 Filter ε [∅]',
        grammar: Filter(Epsilon(), Null()),
        results: [],
    });

    testGrammar({
        desc: 'F.8 Filter ∅ [t1:hello]',
        grammar: Filter(Null(), t1("hello")),
        results: [],
    });
    
    testGrammar({
        desc: 'F.9 Filter t1:hello [t1:""]',
        grammar: Filter(t1("hello"), t1("")),
        results: [],
    });

    testGrammar({
        desc: 'F.10 Filter t1:"" [t1:""]',
        grammar: Filter(t1(""), t1("")),
        results: [
            {},
        ],
    });

    testGrammar({
        desc: 'F.11 Filter (t1:hello|t1:"") [t1:""]',
        grammar: Filter(Uni(t1("hello"), t1("")), t1("")),
        results: [
            {},
        ],
    });

    testGrammar({
        desc: 'F.12 Filter t1:h [t1:hello]',
        grammar: Filter(t1("h"), t1("hello")),
        results: [],
    });

    testGrammar({
        desc: 'F.13 Filter t1:hello [t1:h]',
        grammar: Filter(t1("hello"), t1("h")),
        results: [],
    });
    
    testGrammar({
        desc: 'F.14 Filter t1:hello [t1:hello+t2:foo]',
        grammar: Filter(t1("hello"), Seq(t1("hello"), t2("foo"))),
        results: [],
    });

    testGrammar({
        desc: 'F.15 Filter (t1:hi+t2:foo) [t1:hi]',
        grammar: Filter(Seq(t1("hi"), t2("foo")), t1("hi")),
        results: [
            {t1: 'hi', t2: 'foo'},
        ],
    });

    testGrammar({
        desc: 'F.16 Filter t1:hello [t1:hello+t2:foo]',
        grammar: Filter(t1("hello"), Seq(t1("hello"), t2("foo"))),
        results: [],
    });

    testGrammar({
        desc: 'F.17 Filter (t1:hi+t2:world) [t1:hi+t2:world]',
        grammar: Filter(Seq(t1("hi"), t2("world")),
                        Seq(t1("hi"), t2("world"))),
        results: [
            {t1: 'hi', t2: 'world'},
        ],
    });

    testGrammar({
        desc: 'F.18 Filter (t2:b+t1:a) [t1:a+t2:b]',
        grammar: Filter(Seq(t2("b"), t1("a")),
                        Seq(t1("a"), t2("b"))),
        results: [
            {t1: 'a', t2: 'b'},
        ],
    });

    testGrammar({
        desc: 'F.19 Filter (t1:hello+t2:world|t1:hello+t2:kitty) [t1:hello]',
        grammar: Filter(Uni(Seq(t1("hello"), t2("world")),
                            Seq(t1("hello"), t2("kitty"))),
                        t1("hello")),
        results: [
            {t1: 'hello', t2: 'world'},
            {t1: 'hello', t2: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'F.20 Filter (t1:hello+t2:world+t3:!|t1:hello+t2:kitty+t3:!) ' +
             '[t1:hello][t3:!]',
        grammar: Filter(Filter(Uni(Seq(t1("hello"), t2("world"), t3("!")),
                                   Seq(t1("hello"), t2("kitty"), t3("!"))),
                               t1("hello")), t3("!")),
        results: [
            {t1: 'hello', t2: 'world', t3:'!'},
            {t1: 'hello', t2: 'kitty', t3:'!'},
        ],
    });

    testGrammar({
        desc: 'F.21 Filter different-tape alts in same direction: ' +
              '(t1:hi|t2:foo) [t1:hi|t2:foo]',
        grammar: Filter(Uni(t1("hi"), t2("foo")),
                        Uni(t1("hi"), t2("foo"))),
        results: [
            {t1: 'hi'},
            {t2: 'foo'},
        ],
    });

    testGrammar({
        desc: 'F.22 Filter different-tape alts in different directions: ' +
              '(t2:foo|t1:hi) [t1:hi+t2:foo]',
        grammar: Filter(Uni(t2("foo"), t1("hi")),
                        Uni(t1("hi"), t2("foo"))),
        results: [
            {t2: 'foo'},
            {t1: 'hi'},
        ],
    });

    testGrammar({
        desc: 'F.23 Filter t1:hi+t2:hi [(t1:h+t2:h)+(t1:i+t2:i)]',
        grammar: Filter(Seq(t1("hi"), t2("hi")),
                        Seq(Seq(t1("h"), t2("h")), Seq(t1("i"), t2("i")))),
        results: [
            {t1: 'hi', t2: 'hi'},
        ],
    });

    testGrammar({
        desc: 'F.24 Nested filter t1:hi [t1:hi][t1:hi]',
        grammar: Filter(Filter(t1("hi"), t1("hi")), t1("hi")),
        results: [
            {t1: 'hi'},
        ],
    });

    testGrammar({
        desc: 'F.25 Nested filter (t1:hi+t2:wo) [t1:hi][t2:wo]',
        grammar: Filter(Filter(Seq(t1("hi"), t2("wo")),
                               t1("hi")), t2("wo")),
        results: [
            {t1: 'hi', t2: 'wo'},
        ],
    });

    testGrammar({
        desc: 'F.26 Nested filter (t1:hi+t2:wo) [t2:wo][t1:hi]',
        grammar: Filter(Filter(Seq(t1("hi"), t2("wo")),
                               t2("wo")), t1("hi")),
        results: [
            {t1: 'hi', t2: 'wo'},
        ],
    });

    testGrammar({
        desc: 'RB.1 Filter (M(t1>t2,~((t1:.){0,17} + ' +
              'Short(t1:hel+(t1:.){0,17})))+t3:[1SG]) ' +
              '[t1:hel+t3:G] (vocab hel/hela/[1SG])',
        grammar: Count({t1:3, t2:3, t3:3},
        		     withVocab({t1:'hel', t2:'hela', t3:'[1SG]'},
                 	     Filter(
                 	         Seq(MatchFrom(
                                    Not(Seq(Rep(Any("t1"), 0, 17),
                                            Short(Seq(t1("hel"),
                                                      Rep(Any("t1"), 0, 17))))),
                                    "t1", "t2"),
                                 t3("[1SG]")),
                             Seq(t1("hel"), t3("G"))
                 	     ))),
        results: [],
    });

    testGrammar({
        desc: 'RB.2 Filter (M(t1>t2,(t1:.){0,17})+~(t3:[1SG]))) ' +
              '[t1:hel+t3:G] (vocab hel/hela/[1SG])',
        grammar: Count({t1:3, t2:3, t3:3},
        		     withVocab({t1:'hel', t2:'hela', t3:'[1SG]'},
                 	     Filter(
                 	         Seq(MatchFrom(Rep(Any("t1"), 0, 17),
                                           "t1", "t2"),
                                 Not(t3("[1SG]"))),
                 	         Seq(t1("hel"), t3("G"))
                 	     ))),
        results: [
            {t1: 'hel', t2: 'hel', t3: 'G'},
        ],
    });

    testGrammar({
        desc: 'RB.3a Filter (M(t1>t2,t1:a{0,3})+~(t3:[1SG]))) ' +
              '[t1:hel+t3:G] (vocab a/a/[1SG])',
        grammar: Count({t1:3, t2:3, t3:3},
        		     withVocab({t1:'a', t2:'a', t3:'[1SG]'},
                 	     Filter(
                 	         Seq(MatchFrom(Rep(t1("a"), 0, 3),
                                           "t1", "t2"),
                                 Not(t3("[1SG]"))),
                 	         Seq(t1("aa"), t3("G"))
                 	     ))),
        results: [
            {t1: 'aa', t2: 'aa', t3: 'G'},
        ],
    });

    testGrammar({
        desc: 'RB.3b Filter (t1:aa+t2:aa+~(t3:[1SG])) [t1:aa+t3:G] ' +
              '(vocab a/a/[1SG])',
        grammar: Count({t1:3, t2:3, t3:3},
        		     withVocab({t1:'a', t2:'a', t3:'[1SG]'},
                 	     Filter(
                 	         Seq(t1("aa"), t2("aa"), Not(t3("[1SG]"))),
                 	         Seq(t1("aa"), t3("G"))
                 	     ))),
        results: [
            {t1:'aa', t2:'aa', t3: 'G'},
        ],
    });

    testGrammar({
        desc: 'RB.3c Filter (t1:a{0,3}+~(t3:[1SG])) [t1:aa+t3:G] ' +
              '(vocab a/[1SG])',
        grammar: Count({t1:3, t3:3},
        		     withVocab({t1:'a', t3:'[1SG]'},
                 	     Filter(
                            Seq(Rep(t1("a"), 0, 3), Not(t3("[1SG]"))),
                 	        Seq(t1("aa"), t3("G"))
                 	     ))),
        results: [
            {t1:'aa', t3: 'G'},
        ],
    });

    testGrammar({
        desc: 'RB.3d Filter (t1:a{0,2}+~(t3:[1SG])) [t1:aa+t3:G] ' +
              '(vocab a/[1SG])',
        grammar: Count({t1:3, t3:3},
        		     withVocab({t1:'a', t3:'[1SG]'},
                 	     Filter(
                            Seq(Rep(t1("a"), 0, 2), Not(t3("[1SG]"))),
                 	        Seq(t1("aa"), t3("G"))
                 	     ))),
        results: [
            {t1:'aa', t3: 'G'},
        ],
    });

    // STARTS WITH

    testGrammar({
        desc: 'S.1 t1:hello starts with ε',
        grammar: Starts(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.2 t1:hello starts with t1:ε',
        grammar: Starts(t1("hello"), t1("")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.3 t1:hello starts with ∅',
        grammar: Starts(t1("hello"), Null()),
        results: [],
    });

    testGrammar({
        desc: 'S.4 t1:hello starts with t1:h',
        grammar: Starts(t1("hello"), t1("h")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.5 t1:hello starts with ε+t1:h',
        grammar: Starts(t1("hello"), Seq(Epsilon(), t1("h"))),
        results: [
            {t1: 'hello'}
        ],
    });

    testGrammar({
        desc: 'S.6 t1:hello starts with t1:h+ε',
        grammar: Starts(t1("hello"), Seq(t1("h"), Epsilon())),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.7 t1:hello+t2:world starts with (t1:h+t2:w)',
        grammar: Starts(Seq(t1("hello"), t2("world")),
                        Seq(t1("h"), t2("w"))),
        results: [
            {t1: 'hello', t2: 'world'},
        ],
    });

    testGrammar({
        desc: 'S.8 t1:hello starts with t1:he',
        grammar: Starts(t1("hello"), t1("he")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.9 t1:hello starts with t1:hello',
        grammar: Starts(t1("hello"), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.10 t1:hello starts with ~(ε+t1:h)',
        grammar: Starts(t1("hello"), Not(Seq(Epsilon(), t1("h")))),
        results: [],
    });

    testGrammar({
        desc: 'S.11 t1:hello starts with ~(t1:h+ε)',
        grammar: Starts(t1("hello"), Not(Seq(t1("h"), Epsilon()))),
        results: [],
    });

    testGrammar({
        desc: 'S.12 t1:hello starts with ~(t1:h)',
        grammar: Starts(t1("hello"), Not(t1("h"))),
        results: [],
    });

    testGrammar({
        desc: 'S.13 t1:hello starts with ~t1:he',
        grammar: Starts(t1("hello"), Not(t1("he"))),
        results: [],
    });

    testGrammar({
        desc: 'S.14 t1:world starts with ~t1:h',
        grammar: Starts(t1("world"), Not(t1("h"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'S.15 (t1:hello|t1:world) starts with t1:h',
        grammar: Starts(Uni(t1("hello"), t1("world")), t1("h")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.16 (t1:hello|t1:world) starts with ~t1:h',
        grammar: Starts(Uni(t1("hello"), t1("world")), Not(t1("h"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'S.17 (t1:hello|t1:world|t1:kitty) starts with (t1:h|t1:k)',
        grammar: Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                        Uni(t1("h"), t1("k"))),
        results: [
            {t1: 'hello'},
            {t1: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'S.18 (t1:hello|t1:world|t1:kitty) starts with ~t1:w',
        grammar: Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                        Not(t1("w"))),
        results: [
            {t1: 'hello'},
            {t1: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'S.19 (t1:hello|t1:world|t1:kitty) starts with ~(t1:h|t1:k)',
        grammar: Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                        Not(Uni(t1("h"), t1("k")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'S.20 (t1:hello|t1:world|t1:kitty) starts with ~t1:h & ~t1:k',
        grammar: Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                        Intersect(Not(t1("h")), Not(t1("k")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'S.21 t1:hello starts with t1:h+t1:e',
        grammar: Starts(t1("hello"), Seq(t1("h"), t1("e"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.22 t1:hello starts with (~t1:w)+t1:e',
        grammar: Starts(t1("hello"), Seq(Not(t1("w")), t1("e"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.23 t1:hello starts with t1:h+(~t1:o)',
        grammar: Starts(t1("hello"), Seq(t1("h"), Not(t1("o")))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.24 t1:hello starts with (~t1:h)+t1:e',
        grammar: Starts(t1("hello"), Seq(Not(t1("h")), t1("e"))),
        results: [],
    });

    testGrammar({
        desc: 'S.25 t1:hello starts with t1:h+(~t1:e)',
        grammar: Starts(t1("hello"), Seq(t1("h"), Not(t1("e")))),
        results: [],
    });

    testGrammar({
        desc: 'S.26 t1:hello starts with t1:wo|(~t1:k)',
        grammar: Starts(t1("hello"), Uni(t1("wo"), Not(t1("k")))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'S.27 t1:hello starts with t1:wo|(~t1:h)',
        grammar: Starts(t1("hello"), Uni(t1("wo"), Not(t1("h")))),
        results: [],
    });

    // ENDS WITH

    testGrammar({
        desc: 'E.1 t1:hello ends with ε',
        grammar: Ends(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.2 t1:hello ends with t1:""',
        grammar: Ends(t1("hello"), t1("")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.3 t1:hello ends with ∅',
        grammar: Ends(t1("hello"), Null()),
        results: [],
    });

    testGrammar({
        desc: 'E.4 t1:hello ends with t1:o',
        grammar: Ends(t1("hello"), t1("o")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.5 t1:hello ends with ε+t1:o',
        grammar: Ends(t1("hello"), Seq(Epsilon(), t1("o"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.6 t1:hello ends with t1:o+ε',
        grammar: Ends(t1("hello"), Seq(t1("o"), Epsilon())),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.7 t1:hello+t2:world ends with (t1:o+t2:d)',
        grammar: Ends(Seq(t1("hello"), t2("world")),
                      Seq(t1("o"), t2("d"))),
        results: [
            {t1: 'hello', t2: 'world'},
        ],
    });

    testGrammar({
        desc: 'E.8 t1:hello ends with t1:lo',
        grammar: Ends(t1("hello"), t1("lo")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.9 t1:hello ends with t1:hello',
        grammar: Ends(t1("hello"), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.10 t1:hello ends with ~t1:o',
        grammar: Ends(t1("hello"), Not(t1("o"))),
        results: [],
    });

    testGrammar({
        desc: 'E.11 t1:hello ends with ~t1:lo',
        grammar: Ends(t1("hello"), Not(t1("lo"))),
        results: [],
    });

    testGrammar({
        desc: 'E.12 t1:world ends with ~t1:o',
        grammar: Ends(t1("world"), Not(t1("o"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'E.13 (t1:hello|t1:world) ends with t1:o',
        grammar: Ends(Uni(t1("hello"), t1("world")), t1("o")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.14 (t1:hello|t1:world) ends with ~t1:o',
        grammar: Ends(Uni(t1("hello"), t1("world")), Not(t1("o"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'E.15 (t1:hello|t1:world|t1:kitty) ends with (t1:o|t1:y)',
        grammar: Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                      Uni(t1("o"), t1("y"))),
        results: [
            {t1: "hello"},
            {t1: "kitty"},
        ],
    });

    testGrammar({
        desc: 'E.16 (t1:hello|t1:world|t1:kitty) ends with ~t1:d',
        grammar: Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                      Not(t1("d"))),
        results: [
            {t1: "hello"},
            {t1: "kitty"},
        ],
    });

    testGrammar({
        desc: 'E.17 (t1:hello|t1:world|t1:kitty) ends with ~(t1:o|t1:y)',
        grammar: Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                      Not(Uni(t1("o"), t1("y")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'E.18 (t1:hello|t1:world|t1:kitty) ends with ~t1:o & ~t1:y',
        grammar: Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                      Intersect(Not(t1("o")), Not(t1("y")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'E.19 t1:hello ends with t1:l+t1:o',
        grammar: Ends(t1("hello"), Seq(t1("l"), t1("o"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.20 t1:hello ends with (~t1:t)+t1:o',
        grammar: Ends(t1("hello"), Seq(Not(t1("t")), t1("o"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.21 t1:hello ends with t1:h+(~t1:o)',
        grammar: Ends(t1("hello"), Seq(t1("h"), Not(t1("o")))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.22 t1:hello ends with (~t1:l)+t1:o',
        grammar: Ends(t1("hello"), Seq(Not(t1("l")), t1("o"))),
        results: [],
    });

    testGrammar({
        desc: 'E.23 t1:world ends with t1:l+(~t1:d)',
        // "hello" isn't a good example for it because hello really does 
        // end with l(~o), because "lo" is a member of (~o).
        grammar: Ends(t1("world"), Seq(t1("l"), Not(t1("d")))),
        results: [],
    });

    testGrammar({
        desc: 'E.24 t1:hello ends with t1:ld|(~t1:y)',
        grammar: Ends(t1("hello"), Uni(t1("ld"), Not(t1("y")))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'E.25 t1:hello ends with t1:ld|(~t1:o)',
        grammar: Ends(t1("hello"), Uni(t1("ld"), Not(t1("o")))),
        results: [],
    });

    // CONTAINS

    testGrammar({
        desc: 'C.1 t1:hello contains ε',
        grammar: Contains(t1("hello"), Epsilon()),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.2 t1:hello contains t1:""',
        grammar: Contains(t1("hello"), t1("")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.3 t1:hello contains ∅',
        grammar: Contains(t1("hello"), Null()),
        results: [],
    });

    testGrammar({
        desc: 'C.4 t1:hello contains t1:e',
        grammar: Contains(t1("hello"), t1("e")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.5 t1:hello contains ε+t1:e',
        grammar: Contains(t1("hello"), Seq(Epsilon(), t1("e"))),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.6 t1:hello contains t1:e+ε',
        grammar: Contains(t1("hello"), Seq(t1("e"), Epsilon())),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.7 t1:hello+t2:world contains (t1:e+t2:r)',
        grammar: Contains(Seq(t1("hello"), t2("world")),
                          Seq(t1("e"), t2("r"))),
        results: [
            {t1: 'hello', t2: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.8 t1:hello contains t1:el',
        grammar: Contains(t1("hello"), t1("el")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.9 t1:hello contains t1:hello',
        grammar: Contains(t1("hello"), t1("hello")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.10 t1:hello contains t1:h',
        grammar: Contains(t1("hello"), t1("h")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.11 t1:hello contains t1:o',
        grammar: Contains(t1("hello"), t1("o")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.12 t1:hello contains ~t1:e',
        grammar: Contains(t1("hello"), Not(t1("e"))),
        results: [],
    });

    testGrammar({
        desc: 'C.13 t1:hello contains ~t1:el',
        grammar: Contains(t1("hello"), Not(t1("el"))),
        results: [],
    });

    testGrammar({
        desc: 'C.14 t1:hello contains ~t1:h',
        grammar: Contains(t1("hello"), Not(t1("h"))),
        results: [],
    });

    testGrammar({
        desc: 'C.15 t1:hello contains ~t1:o',
        grammar: Contains(t1("hello"), Not(t1("o"))),
        results: [],
    });

    testGrammar({
        desc: 'C.16 t1:world contains ~t1:e',
        grammar: Contains(t1("world"), Not(t1("e"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.17 (t1:hello|t1:kitty) contains t1:e',
        grammar: Contains(Uni(t1("hello"), t1("kitty")), t1("e")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.18 (t1:hello|t1:kitty) contains t1:h',
        grammar: Contains(Uni(t1("hello"), t1("kitty")), t1("h")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.19 (t1:hello|t1:kitty) contains t1:o',
        grammar: Contains(Uni(t1("hello"), t1("kitty")), t1("o")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
        desc: 'C.20 (t1:hello|t1:kitty) contains ~t1:e',
        grammar: Contains(Uni(t1("hello"), t1("kitty")), Not(t1("e"))),
        results: [
            {t1: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'C.21 (t1:hello|t1:kitty) contains ~t1:h',
        grammar: Contains(Uni(t1("hello"), t1("kitty")), Not(t1("h"))),
        results: [
            {t1: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'C.22 (t1:hello|t1:kitty) contains ~t1:o',
        grammar: Contains(Uni(t1("hello"), t1("kitty")), Not(t1("o"))),
        results: [
            {t1: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'C.23 (t1:hello|t1:world|t1:kitty) contains (t1:e|t1:i)',
        grammar: Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                          Uni(t1("e"), t1("i"))),
        results: [
            {t1: 'hello'},
            {t1: 'kitty'},
        ],
    });

    testGrammar({
        desc: 'C.24 (t1:hello|t1:world|t1:kitty) contains ~t1:t',
        grammar: Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                          Not(t1("t"))),
        results: [
            {t1: 'hello'},
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.25 (t1:hello|t1:world|t1:kitty) contains ~(t1:e|t1:i)',
        grammar: Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                          Not(Uni(t1("e"), t1("i")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.26 (t1:hello|t1:world|t1:kitty) contains ~t1:e & ~t1:i',
        grammar: Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                          Intersect(Not(t1("e")), Not(t1("i")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.27 t1:world contains t1:r+t1:l',
        grammar: Contains(t1("world"), Seq(t1("r"), t1("l"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.28 t1:world contains t1:o+t1:r+t1:l',
        grammar: Contains(t1("world"), Seq(t1("o"), t1("r"), t1("l"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.29 t1:world contains (~t1:t)+t1:l',
        grammar: Contains(t1("world"), Seq(Not(t1("t")), t1("l"))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.30 t1:world contains t1:r+(~t1:t)',
        grammar: Contains(t1("world"), Seq(t1("r"), Not(t1("t")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.31 t1:world contains (~t1:r)+t1:l',
        grammar: Contains(t1("world"), Seq(Not(t1("r")), t1("l"))),
        results: [],
    });

    testGrammar({
        desc: 'C.32 t1:world contains t1:r+(~t1:l)',
        grammar: Contains(t1("world"), Seq(t1("r"), Not(t1("l")))),
        results: [],
    });

    testGrammar({
        desc: 'C.33 t1:world contains t1:he|(~t1:k)',
        grammar: Contains(t1("world"), Uni(t1("he"), Not(t1("k")))),
        results: [
            {t1: 'world'},
        ],
    });

    testGrammar({
        desc: 'C.34 t1:world contains t1:he|(~t1:r)',
        grammar: Contains(t1("world"), Uni(t1("he"), Not(t1("r")))),
        results: [],
    });

});
