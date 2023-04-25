import { 
    Count,
    Epsilon,
    Grammar,
    JoinReplace,
    Lit,
    Not,
    Replace, 
    ReplaceGrammar, 
    Seq,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite, VERBOSE_TEST, verbose,
    generateOutputsFromGrammar,
    t1, t2, 
    testHasTapes, 
    testHasVocab,
    testGrammar,
    DEFAULT_MAX_RECURSION,
} from './testUtil';

import { StringDict, SILENT, VERBOSE_DEBUG } from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST;

const EMPTY_CONTEXT = Epsilon();

const DUMMY_SYMBOL: string = "";

function HiddenTapeNameReplace(
    hiddenTapeName: string = "",
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
): ReplaceGrammar {
    return Replace(fromGrammar, toGrammar, 
                   preContext, postContext, otherContext, 
                   beginsWith, endsWith, minReps, maxReps,
                   hiddenTapeName);
}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(VERBOSE, module);

    describe('1a. JoinReplace i by a in i: i -> a, different tape', function() {
        const grammar = JoinReplace(t1("i"),
                                    [Replace(t1("i"), t2("a"))]);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
                            
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'a'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1b. Negation of results of 1a', function() {
        let grammar: Grammar = Not(Seq(t1("i"), t2("a"), Vocab("t2", "i")));
        grammar = Count({t1:2,t2:2}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'aa'}, {t1: 'i', t2: 'ai'}, {t1: 'i', t2: 'i'},
            {t1: 'i', t2: 'ia'}, {t1: 'i', t2: 'ii'},
            {t1: 'ii', t2: 'a'}, {t1: 'ii', t2: 'aa'}, {t1: 'ii', t2: 'ai'},
            {t1: 'ii', t2: 'i'}, {t1: 'ii', t2: 'ia'}, {t1: 'ii', t2: 'ii'},
            {t1: 'i'}, {t1: 'ii'},
            {t2: 'a'}, {t2: 'aa'}, {t2: 'ai'},
            {t2: 'i'}, {t2: 'ia'}, {t2: 'ii'},
            {},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1c. Negation of grammar of 1a', function() {
        let grammar: Grammar = Not(JoinReplace(t1("i"),
                                    [Replace(t1("i"), t2("a"))]));
        grammar = Count({t1:2,t2:2}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        let resultsGrammar: Grammar = Not(Seq(t1("i"), t2("a"), Vocab("t2", "i")));
        resultsGrammar = Count({t1:2,t2:2}, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testGrammar(grammar, expectedResults);
    });

    /*

    describe('2a. JoinReplace i by a in i: i -> a, same tape', function() {
        const grammar = JoinReplace(t1("i"),
                                    [Replace(t1("i"), t1("a"))]);
        const expectedResults: StringDict[] = [
            {t1: 'a'},
        ];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('2b. Negation of results of 2a', function() {
        let grammar: Grammar = Not(Seq(t1("a"), Vocab("t1", "i")));
        grammar = Count(2, grammar);
        const expectedResults: StringDict[] = [
            {"t1":"ii"},
            {"t1":"ai"},
            {"t1":"i"},
            {"t1":"ia"},
            {"t1":"aa"},
            {}
        ];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });
    

    // This result isn't correct for the kind of negation we've implemented (
    //   negation relativized to a set of tapes that includes a hidden tape).  
    //    However, we are eventually also going to need another kind of negation,
    //    negation relativized only to visible tapes.  So let's keep this test 
    //    around, to be restored once that operation is available.

    describe('2c. Negation of grammar of 2a', function() {
        let grammar: Grammar = Not(JoinReplace(t1("i"),
                                    [Replace(t1("i"), t1("a"))]));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {"t1":"ii"},
            {"t1":"ai"},
            {"t1":"i"},
            {"t1":"ia"},
            {"t1":"aa"},
            {}
        ];
        testGrammar(grammar, expectedResults);
    });

    */

    describe('2a-show-hidden. JoinReplace i by a in i: i -> a, same tape', function() {
        let grammar = JoinReplace(t1("i"),
                                  [HiddenTapeNameReplace("R_HIDDEN", t1("i"), t1("a"))]);

        testHasTapes(grammar, ['.R_HIDDEN', 't1', '.END'], DUMMY_SYMBOL, false);
        testHasVocab(grammar, {'.R_HIDDEN': 1, t1: 2});

        const expectedResults: StringDict[] = [
            {'.R_HIDDEN': 'i', t1: 'a'},
        ];

        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('2b-show-hidden. Negation of results of 2a-hidden', function() {
        let grammar: Grammar = Seq(Vocab("t1", "ai"),
                                   Not(Seq(Lit(".R_HIDDEN", "i"), t1("a"))));
        grammar = Count({t1:2,".R_HIDDEN":2}, grammar);

        testHasTapes(grammar, ['.R_HIDDEN', 't1'], DUMMY_SYMBOL, false);
        testHasVocab(grammar, {'.R_HIDDEN': 1, t1: 2});

        const expectedResults: StringDict[] = [
            {'.R_HIDDEN': 'i', t1: 'i'},
            {'.R_HIDDEN': 'i' , t1: 'aa'}, {'.R_HIDDEN': 'i' , t1: 'ai'},
            {'.R_HIDDEN': 'i' , t1: 'ia'}, {'.R_HIDDEN': 'i' , t1: 'ii'},
            {'.R_HIDDEN': 'ii', t1: 'a' }, {'.R_HIDDEN': 'ii', t1: 'i' },
            {'.R_HIDDEN': 'ii', t1: 'aa'}, {'.R_HIDDEN': 'ii', t1: 'ai'},
            {'.R_HIDDEN': 'ii', t1: 'ia'}, {'.R_HIDDEN': 'ii', t1: 'ii'},
            {'.R_HIDDEN': 'i'}, {'.R_HIDDEN': 'ii'},
            {t1: 'a' }, {t1: 'i' }, {t1: 'aa'},
            {t1: 'ai'}, {t1: 'ia'}, {t1: 'ii'},
            {},
        ];

        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('2c-hidden. Negation of grammar of 2a-hidden', function() {
        let grammar: Grammar = Not(JoinReplace(t1("i"),
                                   [HiddenTapeNameReplace("R_HIDDEN", t1("i"), t1("a"))]));
        grammar = Count({t1:2,".R_HIDDEN":2}, grammar);

        testHasTapes(grammar, ['.R_HIDDEN', 't1', '.END'], DUMMY_SYMBOL, false);
        testHasVocab(grammar, {'.R_HIDDEN': 1, t1: 2});

        let resultsGrammar: Grammar = Seq(Vocab("t1", "ai"),
                                          Not(Seq(Lit(".R_HIDDEN", "i"), t1("a"))));
        resultsGrammar = Count({t1:2,".R_HIDDEN":2}, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);

        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('3a. Replace i by a: i -> a', function() {
        let grammar: Grammar = Replace(t1("i"), t2("a"));
        grammar = Count({t1:2,t2:2}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'a'},
            {t1: 'ii', t2: 'aa'},
            {},
        ];

        testGrammar(grammar, expectedResults);
    });
    
    describe('3b. Negation of outputs of 3a', function() {
        let grammar: Grammar =  Seq(Vocab("t2", "ai"),
                                    Not(Uni(Epsilon(),
                                            Seq(t1("i"), t2("a")),
                                            Seq(t1("ii"), t2("aa")))));
        grammar = Count({t1:2,t2:2}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'aa'}, {t1: 'i', t2: 'ai'}, {t1: 'i', t2: 'i'},
            {t1: 'i', t2: 'ia'}, {t1: 'i', t2: 'ii'},
            {t1: 'ii', t2: 'a'}, {t1: 'ii', t2: 'ai'}, {t1: 'ii', t2: 'i'},
            {t1: 'ii', t2: 'ia'}, {t1: 'ii', t2: 'ii'},
            {t1: 'i'}, {t1: 'ii'},
            {t2: 'a'}, {t2: 'aa'}, {t2: 'ai'},
            {t2: 'i'}, {t2: 'ia'}, {t2: 'ii'},
        ];

        testGrammar(grammar, expectedResults);
    });

    describe('3c. Negation of grammar of 3a', function() {
        let grammar: Grammar = Not(Replace(t1("i"), t2("a")));
        grammar = Count({t1:2,t2:2}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        let resultsGrammar: Grammar = Seq(Vocab("t2", "ai"),
                                          Not(Uni(Epsilon(),
                                                  Seq(t1("i"), t2("a")),
                                                  Seq(t1("ii"), t2("aa")))));
        resultsGrammar = Count({t1:2,t2:2}, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testGrammar(grammar, expectedResults);
    });

    describe('4a. Replace i by a: i -> a', function() {
        let grammar: Grammar = Replace(t1("i"), t2("a"));
        grammar = Count({t1:1,t2:1}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'a'},
            {},
        ];

        testGrammar(grammar, expectedResults);
    });

    describe('4b. Negation of results of 4a', function() {
        let grammar: Grammar = Seq(Vocab("t2", "ai"),
                                    Not(Uni(Epsilon(), 
                                            Seq(t1("i"), t2("a")))));
        grammar = Count({t1:1,t2:1}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        const expectedResults: StringDict[] = [
            {t1: "i", t2: "i"},
            {t1: "i"},
            {t2: "a"},
            {t2: "i"},
        ];

        testGrammar(grammar, expectedResults);
    });

    describe('4c. Negation of grammar of 4a', function() {
        let grammar: Grammar = Not(Replace(t1("i"), t2("a")));
        grammar = Count({t1:1,t2:1}, grammar);

        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});

        let resultsGrammar: Grammar = Seq(Vocab("t2", "ai"),
                                          Not(Uni(Epsilon(), 
                                                  Seq(t1("i"), t2("a")))));
        resultsGrammar = Count({t1:1,t2:1}, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar);

        testGrammar(grammar, expectedResults);
    });

    /*

    describe('5a. Replace i by a: i -> a, same tape', function() {
        let grammar: Grammar = Replace(t1("i"), t1("a"));
        grammar = Count(2, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'a'},
            {t1: 'aa'},
            {},
        ];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });

    describe('5b. Negation of results of 5a', function() {
        let grammar: Grammar = Seq(Vocab("t1", "ai"),
                                   Not(Uni(Epsilon(), t1("a"), t1("aa"))));
        grammar = Count(2, grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ii'},
            {t1: 'ai'},
            {t1: 'i'},
            {t1: 'ia'},
        ];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });

    // See note to 2c.

    describe('5c. Negation of grammar of 5a', function() {
        let grammar: Grammar = Not(Replace(t1("i"), t1("a")));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {t1: 'ii'},
            {t1: 'ai'},
            {t1: 'i'},
            {t1: 'ia'},
            // Should not include
            // {},
            // {},
            // {t1: "a"},
            // {t1: "aa"},
        ];
        testGrammar(grammar, expectedResults);
    });

    */

    describe('5a-show-hidden. Replace i by a: i -> a, same tape', function() {
        let grammar: Grammar = HiddenTapeNameReplace("R_HIDDEN", t1("i"), t1("a"));
        grammar = Count({t1:2,".R_HIDDEN":2}, grammar);

        testHasTapes(grammar, ['.R_HIDDEN', 't1', '.END'], DUMMY_SYMBOL, false);
        testHasVocab(grammar, {'.R_HIDDEN': 1, t1: 2});

        const expectedResults: StringDict[] = [
            {'.R_HIDDEN': 'i', t1: 'a'},
            {'.R_HIDDEN': 'ii', t1: 'aa'},
            {},
        ];

        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('5b-show-hidden. Negation of results of 5a-show-hidden', function() {
        let grammar: Grammar = Seq(Vocab("t1", "ai"),
                                   Not(Uni(Epsilon(),
                                           Seq(Lit(".R_HIDDEN", "i"), t1("a")),
                                           Seq(Lit(".R_HIDDEN", "ii"), t1("aa")))));
        grammar = Count({t1:2,".R_HIDDEN":2}, grammar);

        testHasTapes(grammar, ['.R_HIDDEN', 't1', '.END'], DUMMY_SYMBOL, false);
        testHasVocab(grammar, {'.R_HIDDEN': 1, t1: 2});

        const expectedResults: StringDict[] = [
            {'.R_HIDDEN': 'i', t1: 'aa'}, {'.R_HIDDEN': 'i', t1: 'ai'},
            {'.R_HIDDEN': 'i', t1: 'i'},  {'.R_HIDDEN': 'i', t1: 'ia'},
            {'.R_HIDDEN': 'i', t1: 'ii'},
            {'.R_HIDDEN': 'ii', t1: 'a'}, {'.R_HIDDEN': 'ii', t1: 'ai'},
            {'.R_HIDDEN': 'ii', t1: 'i'}, {'.R_HIDDEN': 'ii', t1: 'ia'},
            {'.R_HIDDEN': 'ii', t1: 'ii'},
            {'.R_HIDDEN': 'i'}, {'.R_HIDDEN': 'ii'},
            {t1: 'a'},  {t1: 'i'},  {t1: 'aa'},
            {t1: 'ai'}, {t1: 'ia'}, {t1: 'ii'},
        ];

        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

    describe('5c-show-hidden. Negation of grammar of 5a', function() {
        let grammar: Grammar = Not(HiddenTapeNameReplace("R_HIDDEN", t1("i"), t1("a")));
        grammar = Count({t1:2,".R_HIDDEN":2}, grammar);

        testHasTapes(grammar, ['.R_HIDDEN', 't1', '.END'], DUMMY_SYMBOL, false);
        testHasVocab(grammar, {'.R_HIDDEN': 1, t1: 2});

        let resultsGrammar: Grammar = Seq(Vocab("t1", "ai"),
                                          Not(Uni(Epsilon(),
                                              Seq(Lit(".R_HIDDEN", "i"), t1("a")),
                                              Seq(Lit(".R_HIDDEN", "ii"), t1("aa")))));
        resultsGrammar = Count({t1:2,".R_HIDDEN":2}, resultsGrammar);
        const expectedResults: StringDict[] =
            generateOutputsFromGrammar(resultsGrammar, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);

        testGrammar(grammar, expectedResults, SILENT, DUMMY_SYMBOL, DEFAULT_MAX_RECURSION, false);
    });

});
