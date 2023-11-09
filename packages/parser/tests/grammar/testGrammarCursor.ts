import { 
    Collection,
    Cursor,
    Embed,
    Epsilon,
    Join,
    Rename,
    Seq,
    Uni,
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3, 
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

import {
    SILENT
} from "../../src/utils/logging";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. T_t1(t1:hello)',
        grammar: Cursor("t1", t1("hello")),
        tapes: ["t1"],
        results: [{t1: "hello"}]
    });
            
    testGrammar({
        desc: '2a. Empty string: T_t1(t1:"")',
        grammar: Cursor("t1", t1("")),
        tapes: ["t1"],
        results: [{}]
    });

    testGrammar({
        desc: '2b. Epsilon alone',
        grammar: Cursor("t1", Epsilon()),
        results: [{}]
    });

    testGrammar({
        desc: '3a. C_t1(C_t2(t1:hello+t2:world))',
        grammar: Cursor("t1", Cursor("t2", Seq(t1("hello"), t2("world")))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello", t2: "world"}]
    });

    testGrammar({
        desc: '3b. C_t2(C_t1(t1:hello+t2:world))',
        grammar: Cursor("t2", Cursor("t1", Seq(t1("hello"), t2("world")))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello", t2: "world"}]
    });

    testGrammar({
        desc: '3c. C_t1,t2(t1:hello+t2:world)',
        grammar: Cursor(["t1", "t2"], Seq(t1("hello"), t2("world"))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello", t2: "world"}]
    });

    testGrammar({
        desc: '3d. C_t2,t1(t1:hello+t2:world)',
        grammar: Cursor(["t2", "t1"], Seq(t1("hello"), t2("world"))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello", t2: "world"}]
    });
    
    testGrammar({
        desc: '4a. T_t2(T_t1(t1:hello+t2:""))',
        grammar: Cursor("t2", Cursor("t1", Seq(t1("hello"), t2("")))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello"}]
    });

    testGrammar({
        desc: '4b. T_t2(T_t1(t1:""+t2:"world"))',
        grammar: Cursor("t2", Cursor("t1", Seq(t1(""), t2("world")))),
        tapes: ["t1", "t2"],
        results: [{t2: "world"}]
    });

    testGrammar({
        desc: '5a. T_t1(t1:hello+t2:world))',
        grammar: Cursor("t1", Seq(t1("hello"), t2("world"))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello", t2: "world"}]
    });

    testGrammar({
        desc: '5b. T_t2(t1:hello+t2:world))',
        grammar: Cursor("t2", Seq(t1("hello"), t2("world"))),
        tapes: ["t1", "t2"],
        results: [{t1: "hello", t2: "world"}]
    });

    testGrammar({
        desc: '6a. T_t1,t2,t3(t1:hello+t2:world))',
        grammar: Cursor(["t1","t2","t3"], Seq(t1("hello"), t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"],
        results: [{t1: "hello", t2: "world", t3:"!"}]
    });
    
    testGrammar({
        desc: '6b. T_t1,t3,t2(t1:hello+t2:world))',
        grammar: Cursor(["t1","t3","t2"], Seq(t1("hello"), t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"],
        results: [{t1: "hello", t2: "world", t3:"!"}]
    });

    testGrammar({
        desc: '6c. T_t2,t1,t3(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t2","t1","t3"], Seq(t1("hello"), t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"],
        results: [{t1: "hello", t2: "world", t3:"!"}]
    });

    testGrammar({
        desc: '6d. T_t2,t3,t1(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t2","t3","t1"], Seq(t1("hello"), t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"],
        results: [{t1: "hello", t2: "world", t3:"!"}]
    });

    testGrammar({
        desc: '6e. T_t3,t1,t2(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t3","t1","t2"], Seq(t1("hello"), t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"],
        results: [{t1: "hello", t2: "world", t3:"!"}]
    });

    testGrammar({
        desc: '6f. T_t3,t2,t1(t1:hello+t2:world+t3:!))',
        grammar: Cursor(["t3","t2","t1"], Seq(t1("hello"), t2("world"), t3("!"))),
        tapes: ["t1", "t2", "t3"],
        results: [{t1: "hello", t2: "world", t3:"!"}]
    });

    testGrammar({
        desc: '7a. Cursor inside an embed',
        symbol: "b",
        grammar: Collection({
            "a": Cursor("t1", t1("hello")),
            "b": Embed("a")
        }),
        tapes: ["t1"],
        results: [{t1: "hello"}]
    });    
    
    testGrammar({
        desc: '7b. Cursor inside an embed, used in multi-tape context',
        symbol: "b",
        grammar: Collection({
            "a": Cursor("t1", t1("hello")),
            "b": Cursor("t2", Seq(Embed("a"), t2("world")))
        }),
        tapes: ["t1", "t2"],
        results: [{t1: 'hello', t2: 'world'}]
    });


    testGrammar({
        desc: '8. Cursors around alternations',
        grammar: Cursor(["t2","t1"], 
                    Seq(Uni(t1("hello"), t1("goodbye")), 
                        Uni(t2("world"), t2("kitty")))),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: 'world'},
            {t1: 'goodbye', t2: 'world'},
            {t1: 'hello', t2: 'kitty'},
            {t1: 'goodbye', t2: 'kitty'}
        ]
    });

    testGrammar({
        desc: '9. Cursors inside alternations',
        grammar: Uni(Cursor("t1", t1("hello")), 
                     Cursor("t2", t2("world"))),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello'}, 
            {t2: 'world'},
        ]
    });

    testGrammar({
        desc: '10. Irrelevant cursor',
        grammar: Cursor("t2", (Cursor("t1", t1("hello")))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'}, 
        ]
    });

    testGrammar({
        desc: '11a. Repeated cursor',
        grammar: Cursor("t1", (Cursor("t1", t1("hello")))),
        tapes: ["t1"],
        results: [
            {t1: 'hello'}, 
        ]
    });    
    
    testGrammar({
        // there's a potential bug about nested cursors operating on 
        // sequences, but drawing it out is tricky because of how 
        // optimizations turn simple sequences into literals where 
        // possible and then treat them atomically.  here i'm stymieing 
        // those optimizations by interleaving two tapes, but that's 
        // all t2 is doing here, the test is really just for t1.  if both
        // Cursors attempt to operate on the sequence, the result will be 
        // t1:elhlo rather than t1:hello.
        desc: '11b. Repeated cursor, complex',
        grammar: Cursor(["t1", "t1"], Seq(t1("h"), t2("w"), t1("e"), t2("o"), t1("l"), 
                                        t2("r"), t1("l"), t2("l"), t1("o"), t2("d"))),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: 'world'} 
        ]
    });

    testGrammar({
        desc: '12a. Cursor inside a rename',
        grammar: Rename(Cursor("t1", t1("hello")), "t1", "t2"),
        tapes: ["t2"],
        results: [
            {t2: 'hello'}, 
        ]
    });        
    
    testGrammar({
        desc: '12b. Cursor inside an irrelevant rename',
        grammar: Rename(Cursor("t1", t1("hello")), "t2", "t3"),
        tapes: ["t1"],
        results: [
            {t1: 'hello'}, 
        ]
    });    

    testGrammar({
        desc: '12c. Cursor inside a rename with another tape inside',
        grammar: Rename(Cursor("t1", Seq(t1("hello"), t3("world"))), "t1", "t2"),
        tapes: ["t2", "t3"],
        results: [
            {t2: 'hello', t3: "world"},
        ]
    });  

    testGrammar({
        desc: '12d. Two cursors inside a rename',
        grammar: Rename(Cursor(["t1", "t3"], Seq(t1("hello"), t3("world"))), "t1", "t2"),
        tapes: ["t2", "t3"],
        results: [
            {t2: 'hello', t3: "world"},
        ]
    });    
    
    testGrammar({
        desc: '13a. Cursor inside a join, tape unshared',
        grammar: Join(Cursor(["t2"], Seq(t1("hello"), t2("world"))), t1("hello")),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: "world"},
        ],
    });

    testGrammar({
        desc: '13b. Cursor inside a join, tape unshared',
        grammar: Join(t1("hello"), Cursor(["t2"], Seq(t1("hello"), t2("world")))),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: "world"},
        ]
    });    

    testGrammar({
        desc: '14. Cursor inside a join, tape shared',
        grammar: Join(Seq(t1("hello"), t2("world")), 
                        Cursor(["t2"], Seq(t1("hello"), t2("kitty")))),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: "world"},
        ]
    });    
    
    testGrammar({
        desc: '14b. Cursor inside a join, tape shared, with safety Cursor',
        grammar: Cursor("t2", Join(Seq(t1("hello"), t2("world")), 
                        Cursor(["t2"], Seq(t1("hello"), t2("kitty"))))),
        tapes: ["t1", "t2"],
        results: [
            {t1: 'hello', t2: "world"},
        ]
    });   

});