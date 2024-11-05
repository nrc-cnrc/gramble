
import {
    Contains, Ends, Epsilon,
    Join,
    Not, Null,
    Seq, Starts, Uni,
} from "../../interpreter/src/grammarConvenience.js";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2
} from "./testGrammarUtil.js";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil.js";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

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
        numErrors: 1
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
                        Join(Not(t1("h")), Not(t1("k")))),
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
        numErrors: 1
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
                      Join(Not(t1("o")), Not(t1("y")))),
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
        numErrors: 1
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
                          Join(Not(t1("e")), Not(t1("i")))),
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
