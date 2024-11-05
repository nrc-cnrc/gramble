import { 
    Cursor, Dot, Embed,
    Epsilon, Join, Match,
    Rename, Seq, Uni,
} from "../../interpreter/src/grammarConvenience.js";

import {
    SILENT
} from "../../interpreter/src/utils/logging.js";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3, 
} from "./testGrammarUtil.js";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil.js';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. T_t1(t1:hello)',
        grammar: Cursor("t1", t1("hello")),
        //tapes: [],
        results: [
            {t1: "hello"},
        ],
    }); 
    
    testGrammar({
        desc: '2a. Empty string: T_t1(t1:"")',
        grammar: Cursor("t1", t1("")),
        //tapes: [],
        results: [
            {},
        ],
    });

    testGrammar({
        desc: '2b. Epsilon alone',
        grammar: Cursor("t1", Epsilon()),
        results: [
            {},
        ],
        numErrors: 1,
    });

    testGrammar({
        desc: '3a. C_t1(C_t2(t1:hello+t2:world))',
        grammar: Cursor("t1",
                    Cursor("t2",
                        Seq(t1("hello"), t2("world")))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });

    testGrammar({
        desc: '3b. C_t2(C_t1(t1:hello+t2:world))',
        grammar: Cursor("t2",
                    Cursor("t1",
                        Seq(t1("hello"), t2("world")))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });

    testGrammar({
        desc: '3c. C_t1,t2(t1:hello+t2:world)',
        grammar: Cursor(["t1", "t2"],
                    Seq(t1("hello"), t2("world"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });

    testGrammar({
        desc: '3d. C_t2,t1(t1:hello+t2:world)',
        grammar: Cursor(["t2", "t1"],
                    Seq(t1("hello"), t2("world"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });
    
    testGrammar({
        desc: '4a. T_t2(T_t1(t1:hello+t2:""))',
        grammar: Cursor("t2",
                    Cursor("t1",
                        Seq(t1("hello"), t2("")))),
        //tapes: [],
        results: [
            {t1: "hello"},
        ],
    });

    testGrammar({
        desc: '4b. T_t2(T_t1(t1:""+t2:"world"))',
        grammar: Cursor("t2",
                    Cursor("t1",
                        Seq(t1(""), t2("world")))),
        //tapes: [],
        results: [
            {t2: "world"},
        ],
    });

    testGrammar({
        desc: '5a. Partial cursoring: T_t1(t1:hello+t2:world))',
        grammar: Cursor("t1", Seq(t1("hello"), t2("world"))),
        //tapes: ["t2"],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });

    testGrammar({
        desc: '5b. Partial cursoring: T_t2(t1:hello+t2:world))',
        grammar: Cursor("t2", Seq(t1("hello"), t2("world"))),
        //tapes: ["t1"],
        results: [
            {t1: "hello", t2: "world"},
        ],
    });

    testGrammar({
        desc: '6a. T_t1,t2,t3(t1:hello+t2:world))',
        grammar: Cursor(["t1", "t2", "t3"],
                    Seq(t1("hello"), t2("world"), t3("!"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world", t3:"!"},
        ],
    });
    
    testGrammar({
        desc: '6b. T_t1,t3,t2(t1:hello+t2:world))',
        grammar: Cursor(["t1", "t3", "t2"],
                    Seq(t1("hello"), t2("world"), t3("!"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world", t3:"!"},
        ],
    });

    testGrammar({
        desc: '6c. T_t2,t1,t3(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t2", "t1", "t3"],
                    Seq(t1("hello"), t2("world"), t3("!"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world", t3:"!"},
        ],
    });

    testGrammar({
        desc: '6d. T_t2,t3,t1(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t2", "t3", "t1"],
                    Seq(t1("hello"), t2("world"), t3("!"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world", t3:"!"},
        ],
    });

    testGrammar({
        desc: '6e. T_t3,t1,t2(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t3", "t1", "t2"],
                    Seq(t1("hello"), t2("world"), t3("!"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world", t3:"!"},
        ],
    });

    testGrammar({
        desc: '6f. T_t3,t2,t1(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t3", "t2", "t1"],
                    Seq(t1("hello"), t2("world"), t3("!"))),
        //tapes: [],
        results: [
            {t1: "hello", t2: "world", t3:"!"},
        ],
    });

    testGrammar({
        desc: '7a. Cursor inside an embed',
        grammar: {
            "a": Cursor("t1", t1("hello")),
            "b": Embed("a")
        },
        symbol: "b",
        //tapes: [],
        results: [
            {t1: "hello"},
        ],
    });    

    testGrammar({
        desc: '7b. Cursor inside an embed, used in multi-tape context',
        grammar: {
            "a": Cursor("t1", t1("hello")),
            "b": Cursor("t2", Seq(Embed("a"), t2("world")))
        },
        symbol: "b",
        //tapes: [],
        results: [
            {t1: 'hello', t2: 'world'},
        ],
    });

    testGrammar({
        desc: '8. Cursors around alternations',
        grammar: Cursor(["t2","t1"], 
                    Seq(Uni(t1("hello"), t1("goodbye")), 
                        Uni(t2("world"), t2("kitty")))),
        //tapes: [],
        results: [
            {t1: 'hello', t2: 'world'},
            {t1: 'goodbye', t2: 'world'},
            {t1: 'hello', t2: 'kitty'},
            {t1: 'goodbye', t2: 'kitty'},
        ],
    });

    testGrammar({
        desc: '9. Cursors inside alternations',
        grammar: Uni(Cursor("t1", t1("hello")), 
                     Cursor("t2", t2("world"))),
        //tapes: [],
        results: [
            {t1: 'hello'}, 
            {t2: 'world'},
        ],
    });

    testGrammar({
        desc: '10. Irrelevant cursor',
        grammar: Cursor("t2", (Cursor("t1", t1("hello")))),
        //tapes: [],
        results: [
            {t1: 'hello'}, 
        ],
        numErrors: 1,
    });

    testGrammar({
        desc: '11a. Repeated cursor',
        grammar: Cursor("t1", (Cursor("t1", t1("hello")))),
        //tapes: [],
        results: [
            {t1: 'hello'}, 
        ],
        numErrors: 1,
    });    
    
    testGrammar({
        // if both Cursors attempt to operate on the sequence, the 
        // result will be t1:elhlo rather than t1:hello.
        desc: '11b. Repeated cursor, complex',
        grammar: Cursor(["t1", "t1"],
                    Seq(t1("h"), t1("e"), t1("l"), t1("l"), t1("o"))),
        //tapes: [],
        results: [
            {t1: 'hello'},
        ],
        numErrors: 1,
    });

    testGrammar({
        desc: '12a. Cursor inside a rename',
        grammar: Rename(Cursor("t1", t1("hello")), "t1", "t2"),
        //tapes: [],
        results: [
            {t1: 'hello'}, 
        ],
        numErrors: 1,
    });        
    
    testGrammar({
        desc: '12b. Cursor inside an irrelevant rename',
        grammar: Rename(Cursor("t1", t1("hello")), "t2", "t3"),
        //tapes: [],
        results: [
            {t1: 'hello'}, 
        ],
        numErrors: 1,
    });    

    testGrammar({
        desc: '12c. Cursor inside a rename with another tape inside',
        grammar: Rename(Cursor("t1", Seq(t1("hello"), t3("world"))), "t1", "t2"),
        //tapes: ["t3"],
        results: [
            {t1: 'hello', t3: "world"},
        ],
        numErrors: 1,
    });  

    testGrammar({
        desc: '12d. Two cursors inside a rename',
        grammar: Rename(
                    Cursor(["t1", "t3"],
                        Seq(t1("hello"), t3("world"))),
                    "t1", "t2"),
        //tapes: [],
        results: [
            {t1: 'hello', t3: "world"},
        ],
        numErrors: 1,
    });    
    
    testGrammar({
        desc: '13a. Cursor inside a join, tape unshared',
        grammar: Join(Cursor(["t2"], Seq(t1("hello"), t2("world"))),
                      t1("hello")),
        //tapes: ["t1"],
        results: [
            {t1: 'hello', t2: "world"},
        ],
    });

    testGrammar({
        desc: '13b. Cursor inside a join, tape unshared',
        grammar: Join(t1("hello"),
                      Cursor(["t2"], Seq(t1("hello"), t2("world")))),
        //tapes: ["t1"],
        results: [
            {t1: 'hello', t2: "world"},
        ],
    });    

    testGrammar({
        desc: '14. Cursor inside a join, tape shared',
        grammar: Join(Seq(t1("hello"), t2("world")), 
                      Cursor(["t2"], Seq(t1("hello"), t2("kitty")))),
        //tapes: ["t1", "t2"],
        results: [
            // this is is a bad way to express the outputs but
            // i'm not sure how better to express it that works
            // in the general case
            {t1: 'hello', t2: "kittyworld"},
        ],
    });    
    
    testGrammar({
        desc: '14b. Cursor inside a join, tape shared, with safety Cursor',
        grammar: Cursor("t2",
                    Join(Seq(t1("hello"), t2("world")), 
                         Cursor(["t2"], Seq(t1("hello"), t2("kitty"))))),
        //tapes: ["t1"],
        results: [
            // this is is a bad way to express the outputs but
            // i'm not sure how better to express it that works
            // in the general case
            {t1: 'hello', t2: "kittyworld"},
        ],
    });   

    testGrammar({
        desc: '15a. Cursor with a dot',
        grammar: Cursor("t1", Seq(t1("hi"), Dot("t1"))),
        //tapes: [],
        results: [
            {t1: "hih"},
            {t1: "hii"},
        ],
    });
    
    testGrammar({
        desc: '15b. Cursor with an embedded dot',
        grammar: {
            "a": Cursor("t1", Seq(t1("hi"), Embed("b"))),
            "b": Dot("t1")
        },
        symbol: "a",
        //tapes: [],
        results: [
            {t1: "hih"},
            {t1: "hii"},
        ],
    });

    testGrammar({
        desc: '16a. Dot and a query',
        grammar: Seq(t1("hi"), Dot("t1")),
        //tapes: ["t1"],
        query: { t1: "hip" },
        results: [
            {t1: "hip"},
        ],
    });
    
    testGrammar({
        desc: '16b. Embedded dot and a query',
        grammar: {
            "a": Seq(t1("hi"), Embed("b")),
            "b": Dot("t1")
        },
        symbol: "a",
        query: { t1: "hip" },
        //tapes: ["t1"],
        results: [
            {t1: "hip"},
        ],
    });

    testGrammar({
        desc: '18a. Cursor around a join-match',
        grammar: Cursor(["t2", "t1"],
        		 	 Join(t1("h"),
        		 	 	  Match(Dot("t1"), "t1", "t2"))),
        ////tapes: [],
        results: [
            {t1: 'h', t2: 'h'},
        ],
    });

    testGrammar({
        desc: '18b. Cursor around a join-match, opposite direction',
        grammar: Cursor(["t1", "t2"],
        		 	 Join(t1("h"),
        		 	 	  Match(Dot("t1"), "t1", "t2"))),
        //tapes: [],
        results: [
            {t1: 'h', t2: 'h'},
        ],
    }); 

    testGrammar({
        desc: '19a. Cursor around a join-match embedded',
        grammar: {
            "a": Cursor(["t2", "t1"],
                    Join(t1("h"),
                        Match(Embed("b"), "t1", "t2"))),
            "b": Dot("t1")
        },
        symbol: "a",
        results: [
            {t1: 'h', t2: 'h'},
        ],
    });

    testGrammar({
        desc: '19b. Cursor around a join-match embedded, opposite direction',
        grammar: {
            "a": Cursor(["t1", "t2"],
        		 	Join(t1("h"),
        		 	 	Match(Embed("b"), "t1", "t2"))),
            "b": Dot("t1")
        },
        symbol: "a",
        results: [
            {t1: 'h', t2: 'h'},
        ],
    }); 

    
    testGrammar({
        desc: '18a. Cursor around a join-match, renamed',
        grammar: Cursor(["t2", "t1"],
        		 	 Join(t1("h"),
        		 	 	  Match(Rename(Dot("t3"), "t3", "t1"), "t1", "t2"))),
        //tapes: [],
        results: [
            {t1: 'h', t2: 'h'},
        ],
    });

    testGrammar({
        desc: '18b. Cursor around a join-match, renamed, opposite direction',
        grammar: Cursor(["t1", "t2"],
        		 	 Join(t1("h"),
        		 	 	  Match(Rename(Dot("t3"), "t3", "t1"), "t1", "t2"))),
        //tapes: [],
        results: [
            {t1: 'h', t2: 'h'},
        ],
    }); 

    testGrammar({
        desc: '19a. Cursor around a join-match embedded, renamed',
        grammar: {
            "a": Cursor(["t2", "t1"],
                    Join(t1("h"),
                        Match(Embed("b"), "t1", "t2"))),
            "b": Rename(Dot("t3"), "t3", "t1")
        },
        symbol: "a",
        results: [
            {t1: 'h', t2: 'h'},
        ],
    });

    testGrammar({
        desc: '19b. Cursor around a join-match embedded, renamed, opposite direction',
        grammar: {
            "a": Cursor(["t1", "t2"],
        		 	Join(t1("h"),
        		 	 	Match(Embed("b"), "t1", "t2"))),
            "b": Rename(Dot("t3"), "t3", "t1")
        },
        symbol: "a",
        results: [
            {t1: 'h', t2: 'h'},
        ],
    }); 

    testGrammar({
        desc: '20a. Cursor around a join-match embedded, renamed, plus a o-tape dot',
        grammar: {
            "a": Cursor(["t2", "t1"],
                    Seq(Join(t1("h"),
        		 	 	Match(Embed("b"), "t1", "t2")), t2("i"), Dot("t2"))),
            "b": Rename(Dot("t3"), "t3", "t1")
        },
        symbol: "a",
        results: [
             {t1: 'h', t2: 'hii'},
             {t1: 'h', t2: 'hih'},
        ],
    });

    testGrammar({
        desc: '20b. Cursor around a join-match embedded, renamed, plus a o-tape dot,' +
              'opposite direction',
        grammar: {
            "a": Cursor(["t1", "t2"],
                    Seq(Join(t1("h"),
                        Match(Embed("b"), "t1", "t2")), t2("i"), Dot("t2"))),
            "b": Rename(Dot("t3"), "t3", "t1")
        },
        symbol: "a",
        results: [
            {t1: 'h', t2: 'hii'},
            {t1: 'h', t2: 'hih'},
        ],
    }); 
});
