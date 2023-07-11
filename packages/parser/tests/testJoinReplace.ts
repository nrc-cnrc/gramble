import { 
    Count,
    Epsilon,
    Grammar,
    Join,
    JoinReplace,
    MatchFrom,
    Cursor,
    Rep,
    Replace,
    Seq,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2, verbose,
    t1, t2, t3, t4, t5,
    testHasTapes,
    testHasVocab,
    testGenerate,
} from './testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_STATES
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

function log(...msgs: string[]) {
    verbose(VERBOSE, ...msgs);
}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);
    
    describe('0a1. Replace i by o in i: ' +
             't1:i ⨝ t1:i -> t2:o (vocab t1:io), only using Join', function() {
        const grammar = Seq(Join(Uni(t1("i")),
                                 Replace(t1("i"), t2("o"))),
                            Vocab({t1: "io"}));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('0a2. Replace i by o in i|o|a: ' +
             't1:i|t1:o|t1:a ⨝ t1:i -> t2:o, only using Join', function() {
        const grammar = Join(Uni(t1("i"), t1("o"), t1("a")),
                             Replace(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
            {t1: 'o', t2: 'o'},
            {t1: 'a', t2: 'a'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('0b. Replace i by o in hi: ' +
             't1:hi ⨝ t1:i -> t1:o, only using Join', function() {
        const grammar = Join(t1("hi"),
                             Replace(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ho'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('0c. Replace i by o in ip: ' +
             't1:ip ⨝ t1:i -> t1:o, only using Join', function() {
        const grammar = Join(t1("ip"),
                             Replace(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'ip', t2: 'op'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('0d. Replace i by o in hip: ' +
             't1:hip ⨝ t1:i -> t2:o, only using Join', function() {
        const grammar = Join(t1("hip"),
                             Replace(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('1a. Replace e by a in hello: t1:hello ⨝ t1:e -> t2:a', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [Replace(t1("e"), t2("a"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('1b. Replace e by a (same tape) in hello: ' +
             't1:hello ⨝ t1:e -> t1:a', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [Replace(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hallo'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('2a. Replace e by a, then a by u, in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:a -> t3:u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t2("a"), t3("u"))]);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hullo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('2a2. Replace e by a, then a by u, then u by i, in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:a -> t3:u, t3:u -> t4:i', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t2("a"))]);
        const grammar1 = JoinReplace(innerReplace, 
                                     [Replace(t2("a"), t3("u"))]);              
        const grammar2 = JoinReplace(grammar1, 
                                     [Replace(t3("u"), t4("i"))]);
        testHasTapes(grammar2, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar2, {t1: 4, t2:5, t3:6, t4: 7});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hullo", t4: "hillo"},
        ];
        testGenerate(grammar2, expectedResults);
    });

    describe('2b. Replace e by a (same tape), then a by u (same tape), in hello: ' +
             't1:hello ⨝ t1:e -> t1:a, t1:a -> t1:u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t1("a"), t1("u"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hullo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('2c. Replace e by a (same tape), then a by u (diff tape), in hello: ' +
             't1:hello ⨝ t1:e -> t1:a, t1:a -> t2:u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t1("a"), t2("u"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 5, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hallo", t2: "hullo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('2d. Replace e by a (diff tape), then a by u (same tape), in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:a -> t2:u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t2("a"), t2("u"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "hullo"},
        ];
        testGenerate(grammar, expectedResults);
    });
    
    describe('3a. Replace e by a, then l by w, in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:l -> t3:w', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t2("l"), t3("w"))]);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('3b. Replace e by a (diff tape), then l by w (same tape), in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:l -> t2:w', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t2("l"), t2("w"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('3c. Replace e by a (same tape), then l by w (diff tape), in hello: ' +
             't1:hello ⨝ t1:e -> t1:a, t1:l -> t2:w', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t1("l"), t2("w"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 5, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hallo", t2: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('3d. Replace e by a (same tape), then l by w (same tape), in hello: ' +
             't1:hello ⨝ t1:e -> t1:a, t1:l -> t1:w', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t1("l"), t1("w"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('3e. Replace l by w (same tape), then e by a (same tape), in hello: ' +
             't1:hello ⨝ t1:l -> t1:w, t1:e -> t1:a', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                         [Replace(t1("l"), t1("w"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('3f. Replace b by v (same tape), then a by e (same tape), in ab: ' +
             't1:ab ⨝ t1:b -> t1:v, t1:a -> t1:e', function() {
        const innerReplace = JoinReplace(t1("ab"),
                                         [Replace(t1("b"), t1("v"))]);
        const grammar = JoinReplace(innerReplace, 
                                    [Replace(t1("a"), t1("e"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: "ev"},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('4a. Replace e by e in hello: t1:hello ⨝ t1:e -> t2:e', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [Replace(t1("e"), t2("e"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('4b. Replace e by e (same tape) in hello: ' +
             't1:hello ⨝ t1:e -> t1:e', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [Replace(t1("e"), t1("e"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('5a. Replace i by o in i|o|a: t1:i|t1:o|t1:a ⨝ t1:i -> t2:o, ' +
             'only using Join, other join direction', function() {
        const grammar = Join(Replace(t1("i"), t2("o")), 
                             Uni(t1("i"), t1("o"), t1("a")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
            {t1: 'o', t2: 'o'},
            {t1: 'a', t2: 'a'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('5b. Replace i by o in hi: t1:hi ⨝ t1:i -> t2:o, ' +
             'only using Join, other join direction', function() {
        const grammar = Join(Replace(t1("i"), t2("o")), 
                             t1("hi"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ho'},
        ];
        testGenerate(grammar, expectedResults);
    });

    describe('5c. Replace e by a, then l by w, in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:l -> t3:w, only using Join', function() {
        const innerReplace = Join(t1("hello"), Replace(t1("e"), t2("a")));
        const grammar = Join(innerReplace, Replace(t2("l"), t3("w")));
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });
    
    describe('5d. Replace e by a, then l by w, in hello: ' +
             't1:hello ⨝ t1:e -> t2:a, t2:l -> t3:w, ' +
             'only using Join, other join direction', function() {
        const innerReplace = Join(Replace(t1("e"), t2("a")), t1("hello"));
        const grammar = Join(Replace(t2("l"), t3("w")), innerReplace);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGenerate(grammar, expectedResults);
    });

    // Exploring rule cascades with first 'to' empty - garden path

    //  12 states visited (was 21)
    describe('6a. 2-rule cascade: ' +
             't1:abcd ⨝ t1:a -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 57 states visited (was 134)
    describe('6b. 2-rule cascade starting with 1-char deletion: ' +
             't1:abcd ⨝ t1:a -> t2:, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 16 states visited (was 31)
    describe('6c. 3-rule cascade: t1:abcd ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc});
        const grammar: Grammar = Seq(vocGrammar, r3Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 85 states visited (was 226)
    describe('6d. 3-rule cascade starting with 1-char deletion: t1:abcd ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc});
        const grammar: Grammar = Seq(vocGrammar, r3Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited (was 43)
    describe('6e. 4-rule cascade: t1:abcd ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 113 states visited (was 344)
    describe('6f. 4-rule cascade starting with 1-char deletion: t1:abcd ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited (was 43)
    describe('6g. 4-rule cascade: t1:abcd ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdefghijklABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdefghijklABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 233 states visited (was 616)
    describe('6h. 4-rule cascade starting with 1-char deletion: t1:abcd ⨝ ' +
             't1:a -> t2:, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdefghijklABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdefghijklABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades varying the input length

    // 42 states visited (was 50)
    describe('7a. 14-char input, 2-rule cascade: t1:CCCCCabcdCCCCC ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("CCCCCabcdCCCCC"),
                                      [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCabcdCCCCC', t2: 'CCCCCAbcdCCCCC', t3: 'CCCCCABcdCCCCC'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 72 states visited (was 80)
    describe('7b. 24-char input, 2-rule cascade: t1:BBBBBCCCCCabcdCCCCCBBBBB ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("BBBBBCCCCCabcdCCCCCBBBBB"),
                                      [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar,[Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCabcdCCCCCBBBBB', t2: 'BBBBBCCCCCAbcdCCCCCBBBBB',
             t3: 'BBBBBCCCCCABcdCCCCCBBBBB'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 70 states visited (was 92)
    describe('7c. 14-char input, 4-rule cascade: t1:CCCCCabcdCCCCC ⨝ ' +
             't1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("CCCCCabcdCCCCC"),
                                      [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCabcdCCCCC', t2: 'CCCCCAbcdCCCCC', t3: 'CCCCCABcdCCCCC',
             t4: 'CCCCCABCdCCCCC', t5: 'CCCCCABCDCCCCC'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 288 states visited (was 698)
    describe('7d. 14-char input, 4-rule cascade starting with 1-char deletion: ' +
             't1:CCCCCabcdCCCCC ⨝ t1:a -> t2:, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("CCCCCabcdCCCCC"),
                                      [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCabcdCCCCC', t2: 'CCCCCbcdCCCCC', t3: 'CCCCCBcdCCCCC',
             t4: 'CCCCCBCdCCCCC', t5: 'CCCCCBCDCCCCC'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 463 states visited (was 1073)
    describe('7e. 24-char input, 4-rule cascade starting with 1-char deletion: ' +
             't1:BBBBBCCCCCabcdCCCCCBBBBB ⨝ ' +
             't1:a -> t2:, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("BBBBBCCCCCabcdCCCCCBBBBB"), 
                                      [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCabcdCCCCCBBBBB', t2: 'BBBBBCCCCCbcdCCCCCBBBBB',
             t3: 'BBBBBCCCCCBcdCCCCCBBBBB', t4: 'BBBBBCCCCCBCdCCCCCBBBBB',
             t5: 'BBBBBCCCCCBCDCCCCCBBBBB'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades with 'from' being longer than 'to' - garden path

    // 8 states visited (was 13)
    describe('8a-1. Single rule with 1>1-char substitution: ' +
             't1:abcd ⨝ t1:a -> t2:A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"),
                                      [Replace(t1("a"), t2("A"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 13 states visited (was 49)
    describe('8a-2. Single rule with 2>1-char substitution: ' +
             't1:aabcd ⨝ t1:aa -> t2:A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aabcd"),
                                      [Replace(t1("aa"), t2("A"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited (was 356)
    describe('8a-3. Single rule with 3>1-char substitution: ' +
             't1:aaabcd ⨝ t1:aaa -> t2:A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaabcd"),
                                      [Replace(t1("aaa"), t2("A"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 29 states visited (was 2803)
    describe('8a-4. Single rule with 4>1-char substitution: ' +
             't1:aaaabcd ⨝ t1:aaaa -> t2:A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaaabcd"),
                                      [Replace(t1("aaaa"), t2("A"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 40 states visited (was 22371)
    describe('8a-5. Single rule with 5>1-char substitution ' +
             't1:aaaaabcd ⨝ t1:aaaaa -> t2:A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaaaabcd"),
                                      [Replace(t1("aaaaa"), t2("A"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited (was 21)
    describe('8b-1. 2-rule cascade starting with 1>1-char substitution: ' +
             't1:abcd ⨝ t1:a -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 65 states visited (was 93)
    describe('8b-2. 2-rule cascade starting with 2>1-char substitution: ' +
             't1:aabcd ⨝ t1:aa -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aabcd"), [Replace(t1("aa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 438 states visited (was 706)
    describe('8b-3. 2-rule cascade starting with 3>1-char substitution: ' +
             't1:aaabcd ⨝ t1:aaa -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaabcd"), [Replace(t1("aaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 3032 states visited (was 5595)
    describe('8b-4. 2-rule cascade starting with 4>1-char substitution: ' +
             't1:aaaabcd ⨝ t1:aaaa -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaaabcd"), [Replace(t1("aaaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // // 21175 states visited (was 44696)
    // describe('8b-5. 2-rule cascade starting with 5>1-char substitution: ' +
    //          't1:aaaaabcd ⨝ t1:aaaaa -> t2:A, t2:b -> t3:B (vocab abcdABCD)', function() {
    //     log(`------${this.title}`);
    //     const r1Grammar = JoinReplace(t1("aaaaabcd"), [Replace(t1("aaaaa"), t2("A"))]);
    //     const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
    //     const voc: string = "abcdABCD";
    //     const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
    //     const grammar: Grammar = Seq(vocGrammar, r2Grammar);
    //     testHasTapes(grammar, ['t1', 't2', 't3']);
    //     testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'aaaaabcd', t2: 'Abcd', t3: 'ABcd'},
    //     ];
    //     testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    // });

    // 20 states visited (was 43)
    describe('8c-1. 4-rule cascade starting with 1>1-char substitution: ' +
             't1:abcd ⨝ t1:a -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 127 states visited (was 223)
    describe('8c-2. 4-rule cascade starting with 2>1-char substitution: ' +
             't1:aabcd ⨝ t1:aa -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aabcd"), [Replace(t1("aa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 868 states visited (was 1620)
    describe('8c-3. 4-rule cascade starting with 3>1-char substitution: ' +
             't1:aaabcd ⨝ t1:aaa -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaabcd"), [Replace(t1("aaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 6028 states visited (was 12956)
    describe('8c-4. 4-rule cascade starting with 4>1-char substitution: ' +
             't1:aaaabcd ⨝ t1:aaaa -> t2:A, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaaabcd"), [Replace(t1("aaaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 8 states visited (was 51)
    describe('9a. Single rule with 1-char deletion: ' +
             't1:abcd ⨝ t1:a -> t2: (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 13 states visited (was 381)
    describe('9b. Single rule with 2-char deletion: ' +
             't1:aabcd ⨝ t1:aa -> t2: (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aabcd"), [Replace(t1("aa"), t2(""))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited (was 3351)
    describe('9c. Single rule with 3-char deletion: ' +
             't1:aaabcd ⨝ t1:aaa -> t2: (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaabcd"), [Replace(t1("aaa"), t2(""))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 29 states visited (was 30081)
    describe('9d. Single rule with 4-char deletion: ' +
             't1:aaaabcd ⨝ t1:aaaa -> t2: (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaaabcd"), [Replace(t1("aaaa"), t2(""))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    /*
    // 29 states visited (was 370)
    describe('9d2. Single rule with 4-char (εε) deletion: ' +
             't1:aaaabcd ⨝ t1:aaaa -> t2: (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaaabcd"),
                                      [Replace(t1("aaaa"), Seq(EpsilonLit("t2"),
                                                               EpsilonLit("t2")))]);
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });
    */

    // 57 states visited (was 134)
    describe('10a. 2-rule cascade starting with 1-char deletion: ' +
             't1:abcd ⨝ t1:a -> t2:, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 427 states visited (was 1600)
    describe('10b. 2-rule cascade starting with 2-char deletion: ' +
             't1:aabcd ⨝ t1:aa -> t2:, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aabcd"), [Replace(t1("aa"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 3018 states visited (was 22616)
    describe('10c. 2-rule cascade starting with 3-char deletion: ' +
             't1:aaabcd ⨝ t1:aaa -> t2:, t2:b -> t3:B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aaabcd"), [Replace(t1("aaa"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // // 21158 states visited (was 330273)
    // describe('10d. 2-rule cascade starting with 4-char deletion: ' +
    //          't1:aaaabcd ⨝ t1:aaaa -> t2:, t2:b -> t3:B (vocab abcdABCD)', function() {
    //     log(`------${this.title}`);
    //     const r1Grammar = JoinReplace(t1("aaaabcd"), [Replace(t1("aaaa"), t2(""))]);
    //     const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
    //     const voc: string = "abcdABCD"
    //     const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
    //     const grammar: Grammar = Seq(vocGrammar, r2Grammar);
    //     testHasTapes(grammar, ['t1', 't2', 't3']);
    //     testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'aaaabcd', t2: 'bcd', t3: 'Bcd'},
    //     ];
    //     testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    // });

    // 113 states visited (was 344)
    describe('11a. 4-rule cascade starting with 1-char deletion: ' +
             't1:abcd ⨝ t1:a -> t2:, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 849 states visited (was 4498)
    describe('11b. 4-rule cascade starting with 2-char deletion: ' +
             't1:aabcd ⨝ t1:aa -> t2:, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("aabcd"), [Replace(t1("aa"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
                               t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // // 6004 states visited (was 66575)
    // describe('11c. 4-rule cascade starting with 3-char deletion: ' +
    //          't1:aaabcd ⨝ t1:aaa -> t2:, t2:b -> t3:B, t3:c -> t4:C, t4:d -> t5:D ' +
    //          '(vocab abcdABCD)', function() {
    //     log(`------${this.title}`);
    //     const r1Grammar = JoinReplace(t1("aaabcd"), [Replace(t1("aaa"), t2(""))]);
    //     const r2Grammar = JoinReplace(r1Grammar, [Replace(t2("b"), t3("B"))]);
    //     const r3Grammar = JoinReplace(r2Grammar, [Replace(t3("c"), t4("C"))]);
    //     const r4Grammar = JoinReplace(r3Grammar, [Replace(t4("d"), t5("D"))]);
    //     const voc: string = "abcdABCD"
    //     const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
    //     const grammar: Grammar = Seq(vocGrammar, r4Grammar);
    //     testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
    //     testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length,
    //                            t4:voc.length, t5:voc.length});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'aaabcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
    //     ];
    //     testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    // });

    // Exploring rule cascades with 'from' being shorter than 'to' - NO garden path

    // 12 states visited (was 17)
    describe('12a. Single rule with 1>5-char substitution: ' +
             't1:abcd ⨝ t1:a -> t2:AAAAA (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("a"), t2("AAAAA"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'AAAAAbcd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited (was 16)
    describe('12b. Single rule with 1>5-char substitution: ' +
             't1:abcd ⨝ t1:c -> t2:CCCCC (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("c"), t2("CCCCC"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'abCCCCCd'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited (was 16)
    describe('12c. Single rule with 1>5-char substitution: ' +
             't1:abcd ⨝ t1:d -> t2:DDDDD (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = JoinReplace(t1("abcd"), [Replace(t1("d"), t2("DDDDD"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'abcDDDDD'},
        ];
        testGenerate(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring using EpsilonLit in nullable Matches

    // 13 states visited (was 16)
    describe('13a. (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        log(`------${this.title}`);
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Cursor(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ];
        testGenerate(grammarWithVocab, expectedResults, vb(VERBOSE_STATES));
    });

    /*
    // 15 states visited (was 14)
    describe('13b. (t2:e+M(t1>t2,t1:ε|t1:h)){2} (vocab hx/hex)', function() {
        log(`------${this.title}`);
        const fromGrammar: Grammar = Uni(EpsilonLit("t1"), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab({t1: "hx", t2: "hex"}));
        grammarWithVocab = Count({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ];
        testGenerate(grammarWithVocab, expectedResults, vb(VERBOSE_STATES));
    });
    */
});
