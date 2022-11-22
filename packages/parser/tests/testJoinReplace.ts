import { 
    Epsilon,
    Grammar,
    Join,
    JoinReplace,
    Replace,
    ReplaceGrammar,
    Seq,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    t1, t2, t3, t4, t5,
    testHasTapes,
    testHasVocab,
    testGrammar,
} from './testUtil';

import * as path from 'path';
import { StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_STATES, VERBOSE_TIME, logDebug } from "../src/util";

const DEFAULT = undefined;

const EMPTY_CONTEXT = Epsilon();

// File level control over verbose output
const VERBOSE = true;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

function verbose(...msgs: string[]) {
    logDebug(vb(VERBOSE_DEBUG), ...msgs);
}

function ReplaceBypass(
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = Infinity,
    maxCopyChars: number = Infinity,
    vocabBypass: boolean = true
): ReplaceGrammar {
    return Replace(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, maxCopyChars, vocabBypass);
}

describe(`${path.basename(module.filename)}`, function() {

    verbose("", `--- ${path.basename(module.filename)} ---`);
    
    describe('0a1. Replace i by o in i: i -> o, only using Join', function() {
        const grammar = Seq(Join(Uni(t1("i")),
                             ReplaceBypass(t1("i"), t2("o"))), Vocab("t1", "io"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0a2. Replace i by o in i: i -> o, only using Join', function() {
        const grammar = Seq(Join(Uni(t1("i")),
                             ReplaceBypass(t1("i"), t2("o"))), Vocab("t1", "io"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0a2. Replace i by o in i: i -> o, only using Join', function() {
        const grammar = Join(Uni(t1("i"), t1("o"), t1("a")),
                             ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
            {t1: 'o', t2: 'o'},
            {t1: 'a', t2: 'a'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0b. Replace i by o in hi: i -> o, only using Join', function() {
        const grammar = Join(t1("hi"),
                             ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ho'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0c. Replace i by o in ip: i -> o, only using Join', function() {
        const grammar = Join(t1("ip"),
                             ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'ip', t2: 'op'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0d. Replace i by o in hip: i -> o, only using Join', function() {
        const grammar = Join(t1("hip"),
                             ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1. Replace e by a in hello: e -> a
    describe('1. Replace e by a in hello: e -> a', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1b. Replace e by a in hello: e -> a, same tape
    describe('1b. Replace e by a in hello: e -> a, same tape', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2a. Replace e by a, then a by u, in hello: e -> a, a -> u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("a"), t3("u"))]);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2a2. Replace e by a, then a by u, in hello: e -> a, a -> u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("a"), t3("u"))]);              
        const grammar2 = JoinReplace(grammar, 
            [ ReplaceBypass(t3("u"), t4("i"))]);
        testHasTapes(grammar2, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar2, {t1: 4, t2:5, t3:6, t4: 7});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hullo", t4: "hillo"},
        ];
        testGrammar(grammar2, expectedResults);
    });

    describe('2b. Replace e by a, then a by u, in hello: e -> a, a -> u, same tape', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("a"), t1("u"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2c. Replace e by a (same tape), then a by u (diff tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("a"), t2("u"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 5, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hallo", t2: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2d. Replace e by a (diff tape), then a by u (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("a"), t2("u"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('3a. Replace e by a, then l by w, in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("l"), t3("w"))]);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. Replace e by a (diff tape), then l by w (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("l"), t2("w"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3c. Replace e by a (same tape), then l by w (diff tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("l"), t2("w"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 5, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hallo", t2: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3d. Replace e by a (same tape), then l by w (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("l"), t1("w"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('3e. Replace l by w (same tape), then e by a (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("l"), t1("w"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3f. Replace b by v (same tape), then a by e (same tape), in ab', function() {
        const innerReplace = JoinReplace(t1("ab"),
                                    [ReplaceBypass(t1("b"), t1("v"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("a"), t1("e"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: "ev"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4a. Replace e -> e in hello', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("e"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4b. Replace e -> e in hello, same tape', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("e"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5a. Replace i by o in i: i -> o, only using Join, other join direction', function() {
        const grammar = Join(ReplaceBypass(t1("i"), t2("o")), 
                    Uni(t1("i"), t1("o"), t1("a")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
            {t1: 'o', t2: 'o'},
            {t1: 'a', t2: 'a'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5b. Replace i by o in hi: i -> o, only using Join, other join direction', function() {
        const grammar = Join(ReplaceBypass(t1("i"), t2("o")), 
                            t1("hi"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ho'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5c. Replace e by a, then l by w, in hello, only using Join', function() {
        const innerReplace = Join(t1("hello"), ReplaceBypass(t1("e"), t2("a")));
        const grammar = Join(innerReplace, ReplaceBypass(t2("l"), t3("w")));
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('5d. Replace e by a, then l by w, in hello, only using Join', function() {
        const innerReplace = Join(ReplaceBypass(t1("e"), t2("a")), t1("hello"));
        const grammar = Join(ReplaceBypass(t2("l"), t3("w")), innerReplace);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    // Exploring rule cascades with first 'to' empty - garden path

    // 21 states visited
    describe('6a. 2-rule cascade (vocab abcdABCD)', function() {
        verbose("------6a. 2-rule cascade (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 134 states visited
    describe('6b. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------6b. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 31 states visited
    describe('6c. 3-rule cascade (vocab abcdABCD)', function() {
        verbose("------6c. 3-rule cascade (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc});
        const grammar: Grammar = Seq(vocGrammar, r3Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 226 states visited
    describe('6d. 3-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------6d. 3-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc});
        const grammar: Grammar = Seq(vocGrammar, r3Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 43 states visited
    describe('6e. 4-rule cascade (vocab abcdABCD)', function() {
        verbose("------6e. 4-rule cascade (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 344 states visited
    describe('6f. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------6f. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 43 states visited
    describe('6g. 4-rule cascade (vocab abcdefghijklABCD)', function() {
        verbose("------6g. 4-rule cascade (vocab abcdefghijklABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdefghijklABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 616 states visited
    describe('6h. 4-rule cascade starting with 1-char deletion (vocab abcdefghijklABCD)', function() {
        verbose("------6h. 4-rule cascade starting with 1-char deletion (vocab abcdefghijklABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdefghijklABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades varying the input length

    // 50 states visited
    describe('7a. 14-char input, 2-rule cascade (vocab abcdABCD)', function() {
        verbose("------7a. 14-char input, 2-rule cascade (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("CCCCCabcdCCCCC"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCabcdCCCCC', t2: 'CCCCCAbcdCCCCC', t3: 'CCCCCABcdCCCCC'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 80 states visited
    describe('7b. 24-char input, 2-rule cascade (vocab abcdABCD)', function() {
        verbose("------7b. 24-char input, 2-rule cascade (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("BBBBBCCCCCabcdCCCCCBBBBB"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCabcdCCCCCBBBBB', t2: 'BBBBBCCCCCAbcdCCCCCBBBBB', t3: 'BBBBBCCCCCABcdCCCCCBBBBB'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 92 states visited
    describe('7c. 14-char input, 4-rule cascade (vocab abcdABCD)', function() {
        verbose("------7c. 14-char input, 4-rule cascade (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("CCCCCabcdCCCCC"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCabcdCCCCC', t2: 'CCCCCAbcdCCCCC', t3: 'CCCCCABcdCCCCC', t4: 'CCCCCABCdCCCCC', t5: 'CCCCCABCDCCCCC'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 698 states visited
    describe('7d. 14-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------7d. 14-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("CCCCCabcdCCCCC"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCabcdCCCCC', t2: 'CCCCCbcdCCCCC', t3: 'CCCCCBcdCCCCC', t4: 'CCCCCBCdCCCCC', t5: 'CCCCCBCDCCCCC'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 1073 states visited
    describe('7e. 24-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------7e. 24-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("BBBBBCCCCCabcdCCCCCBBBBB"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCabcdCCCCCBBBBB', t2: 'BBBBBCCCCCbcdCCCCCBBBBB', t3: 'BBBBBCCCCCBcdCCCCCBBBBB', t4: 'BBBBBCCCCCBCdCCCCCBBBBB', t5: 'BBBBBCCCCCBCDCCCCCBBBBB'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades with 'from' being longer than 'to' - garden path

    // 13 states visited
    describe('8a-1. single rule with 1>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8a-1. single rule with 1>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 49 states visited
    describe('8a-2. single rule with 2>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8a-2. single rule with 2>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 356 states visited
    describe('8a-3. single rule with 3>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8a-3. single rule with 3>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 2803 states visited
    describe('8a-4. single rule with 4>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8a-4. single rule with 4>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 22371 states visited
    describe('8a-5. single rule with 5>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8a-5. single rule with 5>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 21 states visited
    describe('8b-1. 2-rule cascade starting with 1>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8b-1. 2-rule cascade starting with 1>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 93 states visited
    describe('8b-2. 2-rule cascade starting with 2>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8b-1. 2-rule cascade starting with 2>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 706 states visited
    describe('8b-3. 2-rule cascade starting with 3>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8b-3. 2-rule cascade starting with 3>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 5595 states visited
    describe('8b-4. 2-rule cascade starting with 4>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8b-4. 2-rule cascade starting with 4>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // // 44696 states visited
    // describe('8b-5. 2-rule cascade starting with 5>1-char substitution (vocab abcdABCD)', function() {
    //     verbose("------8b-5. 2-rule cascade starting with 5>1-char substitution (vocab abcdABCD)");
    //     const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), t2("A"))]);
    //     const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
    //     const voc: string = "abcdABCD"
    //     const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
    //     const grammar: Grammar = Seq(vocGrammar, r2Grammar);
    //     testHasTapes(grammar, ['t1', 't2', 't3']);
    //     testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'aaaaabcd', t2: 'Abcd', t3: 'ABcd'},
    //     ];
    //     testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    // });

    // 43 states visited
    describe('8c-1. 4-rule cascade starting with 1>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8c-1. 4-rule cascade starting with 1>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 223 states visited
    describe('8c-2. 4-rule cascade starting with 2>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8c-2. 4-rule cascade starting with 2>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 1620 states visited
    describe('8c-3. 4-rule cascade starting with 3>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8c-3. 4-rule cascade starting with 3>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12956 states visited
    describe('8c-4. 4-rule cascade starting with 4>1-char substitution (vocab abcdABCD)', function() {
        verbose("------8c-4. 4-rule cascade starting with 4>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2("A"))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd', t3: 'ABcd', t4: 'ABCd', t5: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 51 states visited
    describe('9a. single rule with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------9a. single rule with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 381 states visited
    describe('9b. single rule with 2-char deletion (vocab abcdABCD)', function() {
        verbose("------9b. single rule with 2-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 3351 states visited
    describe('9c. single rule with 3-char deletion (vocab abcdABCD)', function() {
        verbose("------9c. single rule with 3-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 30081 states visited
    describe('9d. single rule with 4-char deletion (vocab abcdABCD)', function() {
        verbose("------9d. single rule with 4-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 134 states visited
    describe('10a. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("------10a. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 1600 states visited
    describe('10b. 2-rule cascade starting with 2-char deletion (vocab abcdABCD)', function() {
        verbose("------10b. 2-rule cascade starting with 2-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 22616 states visited
    describe('10c. 2-rule cascade starting with 3-char deletion (vocab abcdABCD)', function() {
        verbose("------10c. 2-rule cascade starting with 3-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'bcd', t3: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // // 330273 states visited
    // describe('10d. 2-rule cascade starting with 4-char deletion (vocab abcdABCD)', function() {
    //     verbose("------10d. 2-rule cascade starting with 4-char deletion (vocab abcdABCD)");
    //     const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2(""))]);
    //     const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
    //     const voc: string = "abcdABCD"
    //     const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
    //     const grammar: Grammar = Seq(vocGrammar, r2Grammar);
    //     testHasTapes(grammar, ['t1', 't2', 't3']);
    //     testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'aaaabcd', t2: 'bcd', t3: 'Bcd'},
    //     ];
    //     testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    // });

    // 344 states visited
    describe('11a. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        verbose("-----11a. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 4498 states visited
    describe('11b. 4-rule cascade starting with 2-char deletion (vocab abcdABCD)', function() {
        verbose("-----11b. 4-rule cascade starting with 2-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
        const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
        const grammar: Grammar = Seq(vocGrammar, r4Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // // 66575 states visited
    // describe('11c. 4-rule cascade starting with 3-char deletion (vocab abcdABCD)', function() {
    //     verbose("------11c. 4-rule cascade starting with 3-char deletion (vocab abcdABCD)");
    //     const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2(""))]);
    //     const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
    //     const r3Grammar = JoinReplace(r2Grammar, [ReplaceBypass(t3("c"), t4("C"))]);
    //     const r4Grammar = JoinReplace(r3Grammar, [ReplaceBypass(t4("d"), t5("D"))]);
    //     const voc: string = "abcdABCD"
    //     const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc, t4:voc, t5:voc});
    //     const grammar: Grammar = Seq(vocGrammar, r4Grammar);
    //     testHasTapes(grammar, ['t1', 't2', 't3', 't4', 't5']);
    //     testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length, t4:voc.length, t5:voc.length});
    //     const expectedResults: StringDict[] = [
    //         {t1: 'aaabcd', t2: 'bcd', t3: 'Bcd', t4: 'BCd', t5: 'BCD'},
    //     ];
    //     testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    // });

    // Exploring rule cascades with 'from' being shorter than 'to' - NO garden path

    // 17 states visited
    describe('12a. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        verbose("------12a. single rule with 1>5-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("AAAAA"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'AAAAAbcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 16 states visited
    describe('12b. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        verbose("------12b. single rule with 1>5-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("c"), t2("CCCCC"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'abCCCCCd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 16 states visited
    describe('12c. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        verbose("------12c. single rule with 1>5-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("d"), t2("DDDDD"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'abcDDDDD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

});
