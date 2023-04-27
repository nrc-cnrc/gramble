
import {
     Par,
     Uni 
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2, t3,
    testHasTapes, 
    testHasVocab, 
    testGrammar, 
} from './testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1. Par t1:hello', function() {
        const grammar = Par(t1("hello"));
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('2. Par t1:""', function() {
        const grammar = Par(t1(""));
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 0});
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3. Empty par', function() {
        const grammar = Par();
        testHasTapes(grammar, []);
        const expectedResults: StringDict[] = [
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4. Par t1:hi, t2:yo', function() {
        const grammar = Par(t1("hi"), t2("yo"));
        testHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: "hi", t2: "yo"}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('5. Par t1:hi, t2:yo, t3:hey', function() {
        const grammar = Par(t1("hi"), t2("yo"), t3("hey"));
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        //testHasVocab(grammar, {t1: 2, t2: 2, t3:3});
        const expectedResults: StringDict[] = [
            {t1: "hi", t2: "yo", t3: "hey"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('6. Alt of pars: ' +
             '(Par t1:hello, t2:kitty) | (Par t1:goodbye, t2:world)', function() {
        const grammar = Uni(Par(t1("hello"), t2("kitty")),
                            Par(t1("goodbye"), t2("world")));
        const expectedResults: StringDict[] = [
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" },
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('7. Par of alts: ' +
             'Par (t1:hello | t1:goodbye), (t2:world | t2:kitty)', function() {
        const grammar = Par(Uni(t1("hello"), t1("goodbye")),
                            Uni(t2("world"), t2("kitty")));
        const expectedResults: StringDict[] = [
            { t1: "hello", t2: "world" },
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" },
            { t1: "goodbye", t2: "kitty" },
        ];
        testGrammar(grammar, expectedResults);
    });

});
