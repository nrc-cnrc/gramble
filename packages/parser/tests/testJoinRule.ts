import { 
    Any,
    Count,
    CountTape,
    Epsilon,
    EpsilonLit,
    Grammar,
    Join,
    JoinReplace,
    JoinRule,
    Lit,
    MatchDotRep,
    MatchFrom,
    NegationGrammar,
    Not,
    Priority,
    Rep,
    Replace,
    ReplaceGrammar,
    Seq,
    Short,
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
import { REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE, StringDict, VERBOSE_DEBUG, VERBOSE_STATES, VERBOSE_TIME } from "../src/util";

const DEFAULT = undefined;

const EMPTY_CONTEXT = Epsilon();

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

function IOReplace(
    fromStr: string, 
    toStr: string, 
    preStr: string = "",
    postStr: string = "",
): ReplaceGrammar {
    const fromGrammar = Lit(REPLACE_INPUT_TAPE, fromStr);
    let toGrammar: Grammar = Lit(REPLACE_OUTPUT_TAPE, toStr);
    
    if (toStr.length < fromStr.length) {
        const blank = EpsilonLit(REPLACE_OUTPUT_TAPE);
        const deltaLength = fromStr.length - toStr.length;
        toGrammar = Seq(toGrammar, Rep(blank, deltaLength, deltaLength));
    }
    const preGrammar = Lit(REPLACE_INPUT_TAPE, preStr);
    const postGrammar = Lit(REPLACE_INPUT_TAPE, postStr);
    return ReplaceBypass(fromGrammar, toGrammar, preGrammar, postGrammar);
}

function IOJoin(
    inputStr: string,
    ...rules: ReplaceGrammar[]
): Grammar {
    const inputGrammar = Lit("t1", inputStr);
    return JoinRule("t1", inputGrammar, rules);
}

describe(`${path.basename(module.filename)}`, function() {

    describe('1. hello & e -> a', function() {
        const grammar = IOJoin("hello", IOReplace("e","a"));
        const expectedResults: StringDict[] = [
            {t1: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2. hello & e -> a, a -> u', function() {
        const grammar = IOJoin("hello", IOReplace("e", "a"),
                                        IOReplace("a", "u"));
        const expectedResults: StringDict[] = [
            {t1: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3a. Replace e by a (same tape), then l by w (same tape), in hello', function() {
        const grammar = IOJoin("hello", IOReplace("e", "a"),
                                        IOReplace("l", "w"));
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. Replace l by w (same tape), then e by a (same tape), in hello', function() {
        const grammar = IOJoin("hello", IOReplace("l", "w"),
                                        IOReplace("e", "a"))
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4. Replace e -> e in hello, same tape', function() {
        const grammar = IOJoin("hello", IOReplace("e", "e"));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('6a. 1-char deletion', function() {
        const r1Grammar = IOJoin("abc", IOReplace("a", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'bc'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('6b. 2-char deletion', function() {
        const r1Grammar = IOJoin("abc", IOReplace("ab", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'c'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES|VERBOSE_DEBUG);
    });
    
    describe('6c. 2-char deletion, later in string', function() {
        const r1Grammar = IOJoin("abc", IOReplace("bc", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'a'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES|VERBOSE_DEBUG);
    });


    /*

    // Exploring rule cascades with first 'to' empty - garden path

    // 21 states visited
    describe('6a. 2-rule cascade (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    describe('does not contain a', function() {

        const r1Grammar = Not(Seq(Short(Seq(Rep(Any("t1")), t1("a"))), Rep(Any("t1"))));
        const vocGrammar = Vocab({t1:"ab"});
        const grammar = Count(3, Seq(r1Grammar, vocGrammar));
        const expectedResults: StringDict[] = [
            {}, {t1: 'b'}, {t1: 'bb'}, {t1: 'bbb'}
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES|VERBOSE_DEBUG);
    });

    // 134 states visited
    describe('6b. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        const r1Grammar = JoinReplace(t1("abc"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("x"))]);
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        //testHasTapes(grammar, ['t1', 't2', 't3']);
        //testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abc', t2: 'bc', t3: 'xc'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES|VERBOSE_DEBUG);
    });

    // 134 states visited
    describe('6b. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        const r1Grammar = JoinReplace(t1("abc"), [ReplaceBypass(t1("a"), t2(""))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("x"))]);
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abc', t2: 'bc', t3: 'xc'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES|VERBOSE_DEBUG);
    });

    // 31 states visited
    describe('6c. 3-rule cascade (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 226 states visited
    describe('6d. 3-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 43 states visited
    describe('6e. 4-rule cascade (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 344 states visited
    describe('6f. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 43 states visited
    describe('6g. 4-rule cascade (vocab abcdefghijklABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 616 states visited
    describe('6h. 4-rule cascade starting with 1-char deletion (vocab abcdefghijklABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // Exploring rule cascades varying the input length

    // 50 states visited
    describe('7a. 14-char input, 2-rule cascade (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 80 states visited
    describe('7b. 24-char input, 2-rule cascade (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 92 states visited
    describe('7c. 14-char input, 4-rule cascade (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 698 states visited
    describe('7d. 14-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 1073 states visited
    describe('7e. 24-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // Exploring rule cascades with 'from' being longer than 'to' - garden path

    // 13 states visited
    describe('8a-1. single rule with 1>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8a-1. single rule with 1>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 49 states visited
    describe('8a-2. single rule with 2>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8a-2. single rule with 2>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 356 states visited
    describe('8a-3. single rule with 3>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8a-3. single rule with 3>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 2803 states visited
    describe('8a-4. single rule with 4>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8a-4. single rule with 4>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 22371 states visited
    describe('8a-5. single rule with 5>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8a-5. single rule with 5>1-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), t2("A"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES|VERBOSE_DEBUG);
    });

    // 2850 states visited
    describe('8a-5-test-1. single rule with 5>1-char (ε) substitution (vocab abcdABCD)', function() {
        console.log("------8a-5-test-1. single rule with 5>1-char (ε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), Seq(t2("A"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 376 states visited
    describe('8a-5-test-2. single rule with 5>1-char (εε) substitution (vocab abcdABCD)', function() {
        console.log("------8a-5-test-2. single rule with 5>1-char (εε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), Seq(t2("A"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 76 states visited
    describe('8a-5-test-3. single rule with 5>1-char (εεε) substitution (vocab abcdABCD)', function() {
        console.log("------8a-5-test-3. single rule with 5>1-char (εεε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), Seq(t2("A"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 45 states visited
    describe('8a-5-test-4. single rule with 5>1-char (εεεε) substitution (vocab abcdABCD)', function() {
        console.log("------8a-5-test-4. single rule with 5>1-char (εεεε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaaabcd"), [ReplaceBypass(t1("aaaaa"), Seq(t2("A"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaaabcd', t2: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 21 states visited
    describe('8b-1. 2-rule cascade starting with 1>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8b-1. 2-rule cascade starting with 1>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 93 states visited
    describe('8b-2. 2-rule cascade starting with 2>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8b-2. 2-rule cascade starting with 2>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 706 states visited
    describe('8b-3. 2-rule cascade starting with 3>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8b-3. 2-rule cascade starting with 3>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 404 states visited
    describe('8b-3-test-1. 2-rule cascade starting with 3>1-char (ε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-1. 2-rule cascade starting with 3>1-char (ε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 593 states visited
    describe('8b-3-test-2. 2-rule cascade starting with 3>1-char (εε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-2. 2-rule cascade starting with 3>1-char (εε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 3552 states visited
    describe('8b-3-test-3. 2-rule cascade starting with 3>1-char (εεε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-3. 2-rule cascade starting with 3>1-char (εεε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), t3("B"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 182 states visited
    describe('8b-3-test-4. 2-rule cascade starting with 3>1-char (ε/ε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-4. 2-rule cascade starting with 3>1-char (ε/ε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 242 states visited
    describe('8b-3-test-5. 2-rule cascade starting with 3>1-char (εε/ε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-5. 2-rule cascade starting with 3>1-char (εε/ε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 1500 states visited
    describe('8b-3-test-6. 2-rule cascade starting with 3>1-char (εεε/ε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-6. 2-rule cascade starting with 3>1-char (εεε/ε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 180 states visited
    describe('8b-3-test-7. 2-rule cascade starting with 3>1-char (ε/εε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-7. 2-rule cascade starting with 3>1-char (ε/εε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 195 states visited
    describe('8b-3-test-8. 2-rule cascade starting with 3>1-char (εε/εε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-8. 2-rule cascade starting with 3>1-char (εε/εε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 1188 states visited
    describe('8b-3-test-9. 2-rule cascade starting with 3>1-char (εεε/εε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-9. 2-rule cascade starting with 3>1-char (εεε/εε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 182 states visited
    describe('8b-3-test-10. 2-rule cascade starting with 3>1-char (ε/εεε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-10. 2-rule cascade starting with 3>1-char (ε/εεε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 196 states visited
    describe('8b-3-test-11. 2-rule cascade starting with 3>1-char (εε/εεε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-11. 2-rule cascade starting with 3>1-char (εε/εεε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 1149 states visited
    describe('8b-3-test-12. 2-rule cascade starting with 3>1-char (εεε/εεε) substitution (vocab abcdABCD)', function() {
        console.log("------8b-3-test-12. 2-rule cascade starting with 3>1-char (εεε/εεε) substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), Seq(t2("A"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2"),
                                                                                EpsilonLit("t2")))]);
        const r2Grammar = JoinReplace(r1Grammar, [ReplaceBypass(t2("b"), Seq(t3("B"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3"),
                                                                                EpsilonLit("t3")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc, t3:voc});
        const grammar: Grammar = Seq(vocGrammar, r2Grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length, t3:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'Abcd', t3: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 5595 states visited
    describe('8b-4. 2-rule cascade starting with 4>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8b-4. 2-rule cascade starting with 4>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // // 44696 states visited
    // describe('8b-5. 2-rule cascade starting with 5>1-char substitution (vocab abcdABCD)', function() {
    //     console.log("------8b-5. 2-rule cascade starting with 5>1-char substitution (vocab abcdABCD)");
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
    //     testGrammar(grammar, expectedResults, VERBOSE_STATES);
    // });

    // 43 states visited
    describe('8c-1. 4-rule cascade starting with 1>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8c-1. 4-rule cascade starting with 1>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 223 states visited
    describe('8c-2. 4-rule cascade starting with 2>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8c-2. 4-rule cascade starting with 2>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 1620 states visited
    describe('8c-3. 4-rule cascade starting with 3>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8c-3. 4-rule cascade starting with 3>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 12956 states visited
    describe('8c-4. 4-rule cascade starting with 4>1-char substitution (vocab abcdABCD)', function() {
        console.log("------8c-4. 4-rule cascade starting with 4>1-char substitution (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 51 states visited
    describe('9a. single rule with 1-char deletion (vocab abcdABCD)', function() {
        console.log("------9a. single rule with 1-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 381 states visited
    describe('9b. single rule with 2-char deletion (vocab abcdABCD)', function() {
        console.log("------9b. single rule with 2-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aabcd"), [ReplaceBypass(t1("aa"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 3351 states visited
    describe('9c. single rule with 3-char deletion (vocab abcdABCD)', function() {
        console.log("------9c. single rule with 3-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaabcd"), [ReplaceBypass(t1("aaa"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 30081 states visited
    describe('9d. single rule with 4-char deletion (vocab abcdABCD)', function() {
        console.log("------9d. single rule with 4-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), t2(""))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES | VERBOSE_DEBUG);
    });

    // 3466 states visited
    describe('9d-test-1. single rule with 4-char (ε) deletion (vocab abcdABCD)', function() {
        console.log("------9d-test-1. single rule with 4-char deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), EpsilonLit("t2"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 370 states visited
    describe('9d-test-2. single rule with 4-char (εε) deletion (vocab abcdABCD)', function() {
        console.log("------9d-test-2. single rule with 4-char (εε) deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), Seq(EpsilonLit("t2"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 66 states visited
    describe('9d-test-3. single rule with 4-char (εεε) deletion (vocab abcdABCD)', function() {
        console.log("------9d-test-3. single rule with 4-char (εεε) deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), Seq(EpsilonLit("t2"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 34 states visited
    describe('9d-test-4. single rule with 4-char (εεεε) deletion (vocab abcdABCD)', function() {
        console.log("------9d-test-4. single rule with 4-char (εεεε) deletion (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("aaaabcd"), [ReplaceBypass(t1("aaaa"), Seq(EpsilonLit("t2"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2"),
                                                                                    EpsilonLit("t2")))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'aaaabcd', t2: 'bcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 134 states visited
    describe('10a. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        console.log("------10a. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 1600 states visited
    describe('10b. 2-rule cascade starting with 2-char deletion (vocab abcdABCD)', function() {
        console.log("------10b. 2-rule cascade starting with 2-char deletion (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 22616 states visited
    describe('10c. 2-rule cascade starting with 3-char deletion (vocab abcdABCD)', function() {
        console.log("------10c. 2-rule cascade starting with 3-char deletion (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // // 330273 states visited
    // describe('10d. 2-rule cascade starting with 4-char deletion (vocab abcdABCD)', function() {
    //     console.log("------10d. 2-rule cascade starting with 4-char deletion (vocab abcdABCD)");
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
    //     testGrammar(grammar, expectedResults, VERBOSE_STATES);
    // });

    // 344 states visited
    describe('11a. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        console.log("-----11a. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 4498 states visited
    describe('11b. 4-rule cascade starting with 2-char deletion (vocab abcdABCD)', function() {
        console.log("-----11b. 4-rule cascade starting with 2-char deletion (vocab abcdABCD)");
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
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // // 66575 states visited
    // describe('11c. 4-rule cascade starting with 3-char deletion (vocab abcdABCD)', function() {
    //     console.log("------11c. 4-rule cascade starting with 3-char deletion (vocab abcdABCD)");
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
    //     testGrammar(grammar, expectedResults, VERBOSE_STATES);
    // });

    // Exploring rule cascades with 'from' being shorter than 'to' - NO garden path

    // 17 states visited
    describe('12a. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        console.log("------12a. single rule with 1>5-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("a"), t2("AAAAA"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'AAAAAbcd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 16 states visited
    describe('12b. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        console.log("------12b. single rule with 1>5-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("c"), t2("CCCCC"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'abCCCCCd'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // 16 states visited
    describe('12c. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        console.log("------12c. single rule with 1>5-char substitution (vocab abcdABCD)");
        const r1Grammar = JoinReplace(t1("abcd"), [ReplaceBypass(t1("d"), t2("DDDDD"))]);
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc, t2:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1:voc.length, t2:voc.length});
        const expectedResults: StringDict[] = [
            {t1: 'abcd', t2: 'abcDDDDD'},
        ];
        testGrammar(grammar, expectedResults, VERBOSE_STATES);
    });

    // Exploring using EpsilonLit in nullable Matches

    // 16 states visited
    describe('X1. (t2:e+M(t1>t2,ε|t1:h)){2} (vocab hx/hex)', function() {
        console.log("------X1");
        const fromGrammar: Grammar = Uni(Epsilon(), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults, VERBOSE_STATES);
    });

    // 14 states visited
    describe('X2. (t2:e+M(t1>t2,t1:ε|t1:h)){2} (vocab hx/hex)', function() {
        console.log("------X2");
        const fromGrammar: Grammar = Uni(EpsilonLit("t1"), t1("h"));
        const matchGrammar: Grammar = MatchFrom(fromGrammar, "t1", "t2");
        const grammar: Grammar = Rep(Seq(t2("e"), matchGrammar), 2, 2);
        let grammarWithVocab: Grammar = Seq(grammar,
                                            Vocab('t1', "hx"), Vocab('t2', "hex"));
        grammarWithVocab = CountTape({t1: 3, t2: 3}, grammarWithVocab);
        grammarWithVocab = Priority(["t1", "t2"], grammarWithVocab);
        testHasTapes(grammarWithVocab, ['t1', 't2']);
        testHasVocab(grammarWithVocab, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
        ];
        testGrammar(grammarWithVocab, expectedResults, VERBOSE_STATES);
    });

*/
});
