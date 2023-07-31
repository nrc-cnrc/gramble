
import {
    Grammar, Starts, Ends, Contains,
    Epsilon, Seq, Uni, Not, Intersect, Null,
} from "../src/grammars";

import {
    Any, Count, MatchFrom, Rep, Short, Vocab,
} from "../src/grammars";

import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2, t3,
    testGenerate,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_GRAMMAR
} from "../src/util";


describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    // STARTS WITH

    describe('S.1 t1:hello starts with ε', function() {
        const grammar = Starts(t1("hello"), Epsilon());
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.2 t1:hello starts with t1:ε', function() {
        const grammar = Starts(t1("hello"), t1(""));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('S.3 t1:hello starts with 0', function() {
        const grammar = Starts(t1("hello"), Null());
        testGenerate(grammar, []);
    });

    describe('S.4 t1:hello starts with t1:h', function() {
        const grammar = Starts(t1("hello"), t1("h"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('S.5 t1:hello starts with ε+t1:h', function() {
        const grammar = Starts(t1("hello"), Seq(Epsilon(), t1("h")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.6 t1:hello starts with t1:h+ε', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Epsilon()));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.7 t1:hello+t2:world starts with (t1:h+t2:w)', function() {
        const grammar = Starts(Seq(t1("hello"), t2("world")),
                               Seq(t1("h"), t2("w")));
        testGenerate(grammar, [{t1: 'hello', t2: 'world'}]);
    });

    describe('S.8 t1:hello starts with t1:he', function() {
        const grammar = Starts(t1("hello"), t1("he"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.9 t1:hello starts with t1:hello', function() {
        const grammar = Starts(t1("hello"), t1("hello"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.10 t1:hello starts with ~(ε+t1:h)', function() {
        const grammar = Starts(t1("hello"), Not(Seq(Epsilon(), t1("h"))));
        testGenerate(grammar, []);
    });

    describe('S.11 t1:hello starts with ~(t1:h+ε)', function() {
        const grammar = Starts(t1("hello"), Not(Seq(t1("h"), Epsilon())));
        testGenerate(grammar, []);
    });
    
    describe('S.12 t1:hello starts with ~(t1:h)', function() {
        const grammar = Starts(t1("hello"), Not(t1("h")));
        testGenerate(grammar, []);
    });
    
    
    describe('S.13 t1:hello starts with ~t1:he', function() {
        const grammar = Starts(t1("hello"), Not(t1("he")));
        testGenerate(grammar, []);
    });

    describe('S.14 t1:world starts with ~t1:h', function() {
        const grammar = Starts(t1("world"), Not(t1("h")));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('S.15 (t1:hello|t1:world) starts with t1:h', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world")), t1("h"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.16 (t1:hello|t1:world) starts with ~t1:h', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world")), Not(t1("h")));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('S.17 (t1:hello|t1:world|t1:kitty) ' +
             'starts with (t1:h|t1:k)', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                               Uni(t1("h"), t1("k")));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'kitty'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('S.18 (t1:hello|t1:world|t1:kitty) ' +
             'starts with ~t1:w', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                               Not(t1("w")));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'kitty'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('S.19 (t1:hello|t1:world|t1:kitty) ' +
             'starts with ~(t1:h|t1:k)', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                               Not(Uni(t1("h"), t1("k"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('S.20 (t1:hello|t1:world|t1:kitty) ' +
             'starts with ~t1:h & ~t1:k', function() {
        const grammar = Starts(Uni(t1("hello"), t1("world"), t1("kitty")), 
                               Intersect(Not(t1("h")), Not(t1("k"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('S.21 t1:hello starts with t1:h+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), t1("e")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.22 t1:hello starts with (~t1:w)+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(Not(t1("w")), t1("e")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.23 t1:hello starts with t1:h+(~t1:o)', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Not(t1("o"))));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('S.24 t1:hello starts with (~t1:h)+t1:e', function() {
        const grammar = Starts(t1("hello"), Seq(Not(t1("h")), t1("e")));
        testGenerate(grammar, []);
    });

    describe('S.25 t1:hello starts with t1:h+(~t1:e)', function() {
        const grammar = Starts(t1("hello"), Seq(t1("h"), Not(t1("e"))));
        testGenerate(grammar, []);
    });

    describe('S.26 t1:hello starts with t1:wo|(~t1:k)', function() {
        const grammar = Starts(t1("hello"), Uni(t1("wo"), Not(t1("k"))));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('S.27 t1:hello starts with t1:wo|(~t1:h)', function() {
        const grammar = Starts(t1("hello"), Uni(t1("wo"), Not(t1("h"))));
        testGenerate(grammar, []);
    });

    // ENDS WITH

    describe('E.1 t1:hello ends with ε', function() {
        const grammar = Ends(t1("hello"), Epsilon());
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.2 t1:hello ends with t1:""', function() {
        const grammar = Ends(t1("hello"), t1(""));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('E.3 t1:hello ends with 0', function() {
        const grammar = Ends(t1("hello"), Null());
        testGenerate(grammar, []);
    });

    describe('E.4 t1:hello ends with t1:o', function() {
        const grammar = Ends(t1("hello"), t1("o"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.5 t1:hello ends with ε+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Epsilon(), t1("o")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.6 t1:hello ends with t1:o+ε', function() {
        const grammar = Ends(t1("hello"), Seq(t1("o"), Epsilon()));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.7 t1:hello+t2:world ends with (t1:o+t2:d)', function() {
        const grammar = Ends(Seq(t1("hello"), t2("world")),
                             Seq(t1("o"), t2("d")));
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'world'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('E.8 t1:hello ends with t1:lo', function() {
        const grammar = Ends(t1("hello"), t1("lo"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.9 t1:hello ends with t1:hello', function() {
        const grammar = Ends(t1("hello"), t1("hello"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('E.10 t1:hello ends with ~t1:o', function() {
        const grammar = Ends(t1("hello"), Not(t1("o")));
        testGenerate(grammar, []);
    });
    
    describe('E.11 t1:hello ends with ~t1:lo', function() {
        const grammar = Ends(t1("hello"), Not(t1("lo")));
        testGenerate(grammar, []);
    });

    describe('E.12 t1:world ends with ~t1:o', function() {
        const grammar = Ends(t1("world"), Not(t1("o")));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('E.13 (t1:hello|t1:world) ends with t1:o', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world")), t1("o"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.14 (t1:hello|t1:world) ends with ~t1:o', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world")), Not(t1("o")));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('E.15 (t1:hello|t1:world|t1:kitty) ' +
             'ends with (t1:o|t1:y)', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                             Uni(t1("o"), t1("y")));
        const expectedResults: StringDict[] = [
            {t1: "hello"},
            {t1: "kitty"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('E.16 (t1:hello|t1:world|t1:kitty) ends with ~t1:d', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                             Not(t1("d")));
        const expectedResults: StringDict[] = [
            {t1: "hello"},
            {t1: "kitty"}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('E.17 (t1:hello|t1:world|t1:kitty) ' +
             'ends with ~(t1:o|t1:y)', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                             Not(Uni(t1("o"), t1("y"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('E.18 (t1:hello|t1:world|t1:kitty) ' +
             'ends with ~t1:o & ~t1:y', function() {
        const grammar = Ends(Uni(t1("hello"), t1("world"), t1("kitty")), 
                             Intersect(Not(t1("o")), Not(t1("y"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('E.19 t1:hello ends with t1:l+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(t1("l"), t1("o")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.20 t1:hello ends with (~t1:t)+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Not(t1("t")), t1("o")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.21 t1:hello ends with t1:h+(~t1:o)', function() {
        const grammar = Ends(t1("hello"), Seq(t1("h"), Not(t1("o"))));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('E.22 t1:hello ends with (~t1:l)+t1:o', function() {
        const grammar = Ends(t1("hello"), Seq(Not(t1("l")), t1("o")));
        testGenerate(grammar, []);
    });
    
    describe('E.23 t1:world ends with t1:l+(~t1:d)', function() {
        // "hello" isn't a good example for it because hello really does 
        // end with l(~o), because "lo" is a member of (~o).
        const grammar = Ends(t1("world"), Seq(t1("l"), Not(t1("d"))));
        testGenerate(grammar, []);
    });

    describe('E.24 t1:hello ends with t1:ld|(~t1:y)', function() {
        const grammar = Ends(t1("hello"), Uni(t1("ld"), Not(t1("y"))));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('E.25 t1:hello ends with t1:ld|(~t1:o)', function() {
        const grammar = Ends(t1("hello"), Uni(t1("ld"), Not(t1("o"))));
        testGenerate(grammar, []);
    });

    // CONTAINS

    describe('C.1 t1:hello contains ε', function() {
        const grammar = Contains(t1("hello"), Epsilon());
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.2 t1:hello contains t1:ε', function() {
        const grammar = Contains(t1("hello"), t1(""));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.3 t1:hello contains 0', function() {
        const grammar = Contains(t1("hello"), Null());
        testGenerate(grammar, []);
    });

    describe('C.4 t1:hello contains t1:e', function() {
        const grammar = Contains(t1("hello"), t1("e"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.5 t1:hello contains ε+t1:e', function() {
        const grammar = Contains(t1("hello"), Seq(Epsilon(), t1("e")));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.6 t1:hello contains t1:e+ε', function() {
        const grammar = Contains(t1("hello"), Seq(t1("e"), Epsilon()));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.7 t1:hello+t2:world contains (t1:e+t2:r)', function() {
        const grammar = Contains(Seq(t1("hello"), t2("world")),
                                 Seq(t1("e"), t2("r")));
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'world'}
        ];
        testGenerate(grammar, expectedResults);
    });
    
    describe('C.8 t1:hello contains t1:el', function() {
        const grammar = Contains(t1("hello"), t1("el"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.9 t1:hello contains t1:hello', function() {
        const grammar = Contains(t1("hello"), t1("hello"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });

    describe('C.10 t1:hello contains t1:h', function() {
        const grammar = Contains(t1("hello"), t1("h"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('C.11 t1:hello contains t1:o', function() {
        const grammar = Contains(t1("hello"), t1("o"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('C.12 t1:hello contains ~t1:e', function() {
        const grammar = Contains(t1("hello"), Not(t1("e")));
        testGenerate(grammar, []);
    });
    
    describe('C.13 t1:hello contains ~t1:el', function() {
        const grammar = Contains(t1("hello"), Not(t1("el")));
        testGenerate(grammar, []);
    });

    describe('C.14 t1:hello contains ~t1:h', function() {
        const grammar = Contains(t1("hello"), Not(t1("h")));
        testGenerate(grammar, []);
    });
    
    describe('C.15 t1:hello contains ~t1:o', function() {
        const grammar = Contains(t1("hello"), Not(t1("o")));
        testGenerate(grammar, []);
    });

    describe('C.16 t1:world contains ~t1:e', function() {
        const grammar = Contains(t1("world"), Not(t1("e")));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('C.17 (t1:hello|t1:kitty) contains t1:e', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("e"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('C.18 (t1:hello|t1:kitty) contains t1:h', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("h"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('C.19 (t1:hello|t1:kitty) contains t1:o', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), t1("o"));
        testGenerate(grammar, [{t1: 'hello'}]);
    });
    
    describe('C.20 (t1:hello|t1:kitty) contains ~t1:e', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("e")));
        testGenerate(grammar, [{t1: 'kitty'}]);
    });
    
    describe('C.22 (t1:hello|t1:kitty) contains ~t1:h', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("h")));
        testGenerate(grammar, [{t1: 'kitty'}]);
    });
    
    describe('C.23 (t1:hello|t1:kitty) contains ~t1:o', function() {
        const grammar = Contains(Uni(t1("hello"), t1("kitty")), Not(t1("o")));
        testGenerate(grammar, [{t1: 'kitty'}]);
    });

    describe('C.24 (t1:hello|t1:world|t1:kitty) ' +
             'contains (t1:e|t1:i)', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                 Uni(t1("e"), t1("i")));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'kitty'}
        ];
        testGenerate(grammar, expectedResults);
    });
    
    describe('C.25 (t1:hello|t1:world|t1:kitty) contains ~t1:t', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                 Not(t1("t")));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
            {t1: 'world'}
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('C.26 (t1:hello|t1:world|t1:kitty) ' +
             'contains ~(t1:e|t1:i)', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                 Not(Uni(t1("e"), t1("i"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('C.27 (t1:hello|t1:world|t1:kitty) ' +
             'contains ~t1:e & ~t1:i', function() {
        const grammar = Contains(Uni(t1("hello"), t1("world"), t1("kitty")), 
                                 Intersect(Not(t1("e")), Not(t1("i"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('C.28 t1:world contains t1:r+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), t1("l")));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('C.29 t1:world contains t1:o+t1:r+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(t1("o"), t1("r"), t1("l")));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('C.30 t1:world contains (~t1:t)+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(Not(t1("t")), t1("l")));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('C.31 t1:world contains t1:r+(~t1:t)', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), Not(t1("t"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });
    
    describe('C.32 t1:world contains (~t1:r)+t1:l', function() {
        const grammar = Contains(t1("world"), Seq(Not(t1("r")), t1("l")));
        testGenerate(grammar, []);
    });

    describe('C.33 t1:world contains t1:r+(~t1:l)', function() {
        const grammar = Contains(t1("world"), Seq(t1("r"), Not(t1("l"))));
        testGenerate(grammar, []);
    });

    describe('C.34 t1:world contains t1:he|(~t1:k)', function() {
        const grammar = Contains(t1("world"), Uni(t1("he"), Not(t1("k"))));
        testGenerate(grammar, [{t1: 'world'}]);
    });

    describe('C.35 t1:world contains t1:he|(~t1:r)', function() {
        const grammar = Contains(t1("world"), Uni(t1("he"), Not(t1("r"))));
        testGenerate(grammar, []);
    });

});
