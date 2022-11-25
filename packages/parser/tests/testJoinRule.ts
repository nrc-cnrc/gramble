import { 
    CountTape,
    Epsilon,
    EpsilonLit,
    Grammar,
    Join,
    JoinRule,
    Lit,
    Rep,
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
import { REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE, StringDict, VERBOSE_DEBUG } from "../src/util";

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
    const toGrammar = Lit(REPLACE_OUTPUT_TAPE, toStr);
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

    describe('5a. 1-char deletion', function() {
        const r1Grammar = IOJoin("abc", IOReplace("a", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'bc'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5b. 2-char deletion', function() {
        const r1Grammar = IOJoin("abc", IOReplace("ab", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'c'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('5c. 2-char deletion, later in string', function() {
        const r1Grammar = IOJoin("abc", IOReplace("bc", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'a'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // Exploring rule cascades with first 'to' empty - garden path

    // 21 states visited
    describe('6a. 2-rule cascade (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"),
                                        IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABcd'}
        ];
        testGrammar(grammar, expectedResults);
    });

    // 134 states visited
    describe('6b. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abc", IOReplace("a", ""),
                                        IOReplace("b", "B"))
        const voc: string = "abcABC"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bc'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 31 states visited
    describe('6c. 3-rule cascade (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"),
                                         IOReplace("b","B"),
                                         IOReplace("c", "C"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 226 states visited
    describe('6d. 3-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcd", IOReplace("a", ""),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BCd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 43 states visited
    describe('6e. 4-rule cascade (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"),
                                        IOReplace("b", "B"),
                                        IOReplace("c", "C"),
                                        IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 344 states visited
    describe('6f. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcd", IOReplace("a", ""),
                                        IOReplace("b", "B"),
                                        IOReplace("c", "C"),
                                        IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // Exploring rule cascades varying the input length

    // 50 states visited
    describe('7a. 14-char input, 2-rule cascade (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("CCCCCabcdCCCCC", IOReplace("a", "A"),
                                                   IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCABcdCCCCC'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 80 states visited
    describe('7b. 24-char input, 2-rule cascade (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("BBBBBCCCCCabcdCCCCCBBBBB", IOReplace("a", "A"),
                                                   IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCABcdCCCCCBBBBB'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    // 92 states visited
    describe('7c. 14-char input, 4-rule cascade (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("CCCCCabcdCCCCC", IOReplace("a", "A"),
                                                   IOReplace("b", "B"),
                                                   IOReplace("c", "C"),
                                                   IOReplace("d", "D"));
        
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCABCDCCCCC'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 698 states visited
    describe('7d. 14-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("CCCCCabcdCCCCC", IOReplace("a", ""),
                                                   IOReplace("b", "B"),
                                                   IOReplace("c", "C"),
                                                   IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCBCDCCCCC'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1073 states visited
    describe('7e. 24-char input, 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("BBBBBCCCCCabcdCCCCCBBBBB", IOReplace("a", ""),
                                                   IOReplace("b", "B"),
                                                   IOReplace("c", "C"),
                                                   IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCBCDCCCCCBBBBB'},
        ];
        testGrammar(grammar, expectedResults);
    });


    // Exploring rule cascades with 'from' being longer than 'to' - garden path

    // 13 states visited
    describe('8a-1. single rule with 1>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'}
        ];
        testGrammar(grammar, expectedResults);
    });

    // 49 states visited
    describe('8a-2. single rule with 2>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 356 states visited
    describe('8a-3. single rule with 3>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 2803 states visited
    describe('8a-4. single rule with 4>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaaabcd", IOReplace("aaaa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    // 22371 states visited
    describe('8a-5. single rule with 5>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaaaabcd", IOReplace("aaaaa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 93 states visited
    describe('8b-1. 2-rule cascade starting with 2>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", "A"),
                                          IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 706 states visited
    describe('8b-3. 2-rule cascade starting with 3>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", "A"),
                                            IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults);
    });


    // 43 states visited
    describe('8c-1. 4-rule cascade starting with 1>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"),
                                         IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 223 states visited
    describe('8c-2. 4-rule cascade starting with 2>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", "A"),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"),
                                         IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1620 states visited
    describe('8c-3. 4-rule cascade starting with 3>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", "A"),
                                           IOReplace("b", "B"),
                                           IOReplace("c", "C"),
                                           IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 12956 states visited
    describe('8c-4. 4-rule cascade starting with 4>1-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaaabcd", IOReplace("aaaa", "A"),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"),
                                         IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 134 states visited
    describe('10a. 2-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("a", ""),
                                         IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1600 states visited
    describe('10b. 2-rule cascade starting with 2-char deletion (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", ""),
                                         IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 22616 states visited
    describe('10c. 2-rule cascade starting with 3-char deletion (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", ""),
                                         IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults);
    });
   
    // 344 states visited
    describe('11a. 4-rule cascade starting with 1-char deletion (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("a", ""),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"),
                                         IOReplace("d", "D"));
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 4498 states visited
    describe('11b. 4-rule cascade starting with 2-char deletion (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", ""),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"),
                                         IOReplace("d", "D"));
        const voc: string = "abcdABCD";
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BCD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // Exploring rule cascades with 'from' being shorter than 'to' - NO garden path

    // 17 states visited
    describe('12a. single rule with 1>2-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("a", "AA"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'AAbcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('12b. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("a", "AAAAA"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'AAAAAbcd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 16 states visited
    describe('12c. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        
        const r1Grammar = IOJoin("abcd", IOReplace("c", "CCCCC"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'abCCCCCd'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 16 states visited
    describe('12c. single rule with 1>5-char substitution (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcd", IOReplace("d", "DDDDD"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'abcDDDDD'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('13a. Deleting twice in one word', function() {
        const r1Grammar = IOJoin("abcdabcd", IOReplace("a", ""));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'bcdbcd'},
        ];
        testGrammar(grammar, expectedResults);

    });

    describe('14a. Unconditional generation', function() {
        const r1Grammar = IOJoin("abc", IOReplace("", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        let grammar: Grammar = Seq(vocGrammar, r1Grammar);
        grammar = Join(grammar, Uni(t1("abc"), t1("aDbc"), t1("abcDDD")));
        const expectedResults: StringDict[] = [
            {t1: 'abc'},
            {t1: 'aDbc'},
            {t1: 'abcDDD'},
        ];
        testGrammar(grammar, expectedResults);
    });

});
