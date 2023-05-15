import { 
    Count,
    Grammar,
    Join,
    JoinRule,
    Lit,
    OptionalReplace,
    Rep,
    Replace,
    ReplaceGrammar,
    Seq,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2, verbose,
    t1,
    testGrammar,
} from './testUtil';

import {
    REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE, 
    StringDict, SILENT, VERBOSE_DEBUG, VERBOSE_STATES
} from "../src/util";

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
    return Replace(fromGrammar, toGrammar, preGrammar, postGrammar);
}

function IOReplaceOptional(
    fromStr: string, 
    toStr: string, 
    preStr: string = "",
    postStr: string = "",
): ReplaceGrammar {
    const fromGrammar = Lit(REPLACE_INPUT_TAPE, fromStr);
    const toGrammar = Lit(REPLACE_OUTPUT_TAPE, toStr);
    const preGrammar = Lit(REPLACE_INPUT_TAPE, preStr);
    const postGrammar = Lit(REPLACE_INPUT_TAPE, postStr);
    return OptionalReplace(fromGrammar, toGrammar, preGrammar, postGrammar);
}

function IOJoin(
    inputStr: string,
    ...rules: ReplaceGrammar[]
): Grammar {
    const inputGrammar = Lit("t1", inputStr);
    return JoinRule("t1", inputGrammar, rules);
}

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

    describe('1. hello ⨝ e -> a', function() {
        const grammar = IOJoin("hello", IOReplace("e","a"));
        const expectedResults: StringDict[] = [
            {t1: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2. hello ⨝ e -> a, a -> u', function() {
        const grammar = IOJoin("hello", IOReplace("e", "a"),
                                        IOReplace("a", "u"));
        const expectedResults: StringDict[] = [
            {t1: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3a. Replace e -> a, then l -> w, in hello', function() {
        const grammar = IOJoin("hello", IOReplace("e", "a"),
                                        IOReplace("l", "w"));
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. Replace l -> w, then e -> a, in hello', function() {
        const grammar = IOJoin("hello", IOReplace("l", "w"),
                                        IOReplace("e", "a"))
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4. Replace e -> e, in hello ', function() {
        const grammar = IOJoin("hello", IOReplace("e", "e"));
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5a. 1-char deletion: abc ⨝ a -> "" (vocab abcx)', function() {
        const r1Grammar = IOJoin("abc", IOReplace("a", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'bc'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5b. 2-char deletion: abc ⨝ ab -> "" (vocab abcx)', function() {
        const r1Grammar = IOJoin("abc", IOReplace("ab", ""));
        const voc: string = "abcx"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'c'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('5c. 2-char deletion, later in string: ' +
             'abc ⨝ bc -> "" (vocab abcx)', function() {
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

    // 12 states visited
    describe('6a. 2-rule cascade: ' +
             'abcd ⨝ a -> A, b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"),
                                         IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABcd'}
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 9 states visited
    describe('6b. 2-rule cascade starting with 1-char deletion: ' +
             'abcd ⨝ a -> "", b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abc", IOReplace("a", ""),
                                        IOReplace("b", "B"))
        const voc: string = "abcABC"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bc'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 16 states visited
    describe('6c. 3-rule cascade: ' +
             'abcd ⨝ a -> A, b -> B, c -> C (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABCd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 16 states visited
    describe('6d. 3-rule cascade starting with 1-char deletion: ' +
             'abcd ⨝ a -> "", b -> B, c -> C (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", ""),
                                         IOReplace("b", "B"),
                                         IOReplace("c", "C"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BCd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited
    describe('6e. 4-rule cascade: ' +
             'abcd ⨝ a -> A, b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited
    describe('6f. 4-rule cascade starting with 1-char deletion: ' +
             'abcd ⨝ a -> "", b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades varying the input length

    // 42 states visited
    describe('7a. 14-char input, 2-rule cascade: ' +
             'CCCCCabcdCCCCC ⨝ a -> A, b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("CCCCCabcdCCCCC", IOReplace("a", "A"),
                                                   IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'CCCCCABcdCCCCC'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 72 states visited
    describe('7b. 24-char input, 2-rule cascade: ' +
             'BBBBBCCCCCabcdCCCCCBBBBB ⨝ a -> A, b -> B ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("BBBBBCCCCCabcdCCCCCBBBBB",
                                 IOReplace("a", "A"),
                                 IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCABcdCCCCCBBBBB'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });
    
    // 70 states visited
    describe('7c. 14-char input, 4-rule cascade: ' +
             'CCCCCabcdCCCCC ⨝ a -> A, b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 70 states visited
    describe('7d. 14-char input, 4-rule cascade starting with 1-char deletion: ' +
             'CCCCCabcdCCCCC ⨝ a -> "", b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 120 states visited
    describe('7e. 24-char input, 4-rule cascade starting with 1-char deletion: ' +
             'BBBBBCCCCCabcdCCCCCBBBBB ⨝ a -> "", b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("BBBBBCCCCCabcdCCCCCBBBBB",
                                 IOReplace("a", ""),
                                 IOReplace("b", "B"),
                                 IOReplace("c", "C"),
                                 IOReplace("d", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'BBBBBCCCCCBCDCCCCCBBBBB'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades with 'from' being longer than 'to' - garden path

    // 8 states visited
    describe('8a-1. Single rule with 1>1-char substitution: ' +
             'abcd ⨝ a -> A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'}
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 13 states visited
    describe('8a-2. Single rule with 2>1-char substitution: ' +
             'aabcd ⨝ aa -> A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited
    describe('8a-3. Single rule with 3>1-char substitution: ' +
             'aaabcd ⨝ aaa -> A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 29 states visited
    describe('8a-4. Single rule with 4>1-char substitution: ' +
             'aaaabcd ⨝ aaaa -> A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aaaabcd", IOReplace("aaaa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });
    
    // 40 states visited
    describe('8a-5. Single rule with 5>1-char substitution: ' +
             'aaaaabcd ⨝ aaaaa -> A (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aaaaabcd", IOReplace("aaaaa", "A"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Abcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited
    describe('8b-1. 2-rule cascade starting with 2>1-char substitution: ' +
             'aabcd ⨝ aa -> A, b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", "A"),
                                          IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 31 states visited
    describe('8b-3. 2-rule cascade starting with 3>1-char substitution: ' +
             'aaabcd ⨝ aaa -> A, b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", "A"),
                                           IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'ABcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited
    describe('8c-1. 4-rule cascade starting with 1>1-char substitution: ' +
             'abcd ⨝ a -> A, b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 34 states visited
    describe('8c-2. 4-rule cascade starting with 2>1-char substitution: ' +
             'aabcd ⨝ aa -> A, b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 53 states visited
    describe('8c-3. 4-rule cascade starting with 3>1-char substitution: ' +
             'aaabcd ⨝ aaa -> A, b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 77 states visited
    describe('8c-4. 4-rule cascade starting with 4>1-char substitution: ' +
             'aaaabcd ⨝ aaaa -> A, b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited
    describe('10a. 2-rule cascade starting with 1-char deletion: ' +
             'abcd ⨝ a -> "", b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", ""),
                                         IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 20 states visited
    describe('10b. 2-rule cascade starting with 2-char deletion: ' +
             'aabcd ⨝ aa -> "", b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aabcd", IOReplace("aa", ""),
                                          IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 31 states visited
    describe('10c. 2-rule cascade starting with 3-char deletion: ' +
             'aaabcd ⨝ aaa -> "", b -> B (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("aaabcd", IOReplace("aaa", ""),
                                           IOReplace("b", "B"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'Bcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });
   
    // 20 states visited
    describe('11a. 4-rule cascade starting with 1-char deletion: ' +
             'abcd ⨝ a -> "", b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 34 states visited
    describe('11b. 4-rule cascade starting with 2-char deletion: ' +
             'aabcd ⨝ aa -> "", b -> B, c -> C, d -> D ' +
             '(vocab abcdABCD)', function() {
        log(`------${this.title}`);
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
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // Exploring rule cascades with 'from' being shorter than 'to' - NO garden path

    // 9 states visited
    describe('12a. Single rule with 1>2-char substitution: ' +
             'abcd ⨝ a -> AA (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", "AA"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'AAbcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited
    describe('12b. Single rule with 1>5-char substitution: ' +
             'abcd ⨝ a -> AAAAA (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("a", "AAAAA"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'AAAAAbcd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited
    describe('12c. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ c -> CCCCC (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("c", "CCCCC"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'abCCCCCd'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    // 12 states visited
    describe('12d. Single rule with 1>5-char substitution: ' +
             'abcd ⨝ d -> DDDDD (vocab abcdABCD)', function() {
        log(`------${this.title}`);
        const r1Grammar = IOJoin("abcd", IOReplace("d", "DDDDD"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'abcDDDDD'},
        ];
        testGrammar(grammar, expectedResults, vb(VERBOSE_STATES));
    });

    describe('13. Deleting twice in one word: ' +
             'abcdabcd ⨝ a -> "" (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abcdabcd", IOReplace("a", ""));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        const grammar: Grammar = Seq(vocGrammar, r1Grammar);
        const expectedResults: StringDict[] = [
            {t1: 'bcdbcd'},
        ];
        testGrammar(grammar, expectedResults);

    });

    describe('14a. Unconditional generation: ' +
             '(abc ⨝ "" -> D) ⨝ abc|aDbc|abcDDD (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abc", IOReplaceOptional("", "D"));
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

    describe('14b. Unconditional generation: ' +
             'abc ⨝ "" -> D (vocab abcdABCD)', function() {
        const r1Grammar = IOJoin("abc", IOReplaceOptional("", "D"));
        const voc: string = "abcdABCD"
        const vocGrammar = Vocab({t1:voc});
        let grammar: Grammar = Seq(vocGrammar, r1Grammar);
        grammar = Count({t1:6}, grammar);
        // Note: the only place multiple insertions will be made in the
        // same place (i.e. beside each other) is at the end of the string.
        // Otherwise, only one insertion is done per insertion point.
        const expectedResults: StringDict[] = [
            {t1: 'abc'},    {t1: 'abcD'},
            {t1: 'abDc'},   {t1: 'aDbc'},
            {t1: 'Dabc'},   {t1: 'abcDD'},
            {t1: 'abDcD'},  {t1: 'aDbcD'},
            {t1: 'aDbDc'},  {t1: 'DabDc'},
            {t1: 'DabcD'},  {t1: 'DaDbc'},
            {t1: 'abcDDD'}, {t1: 'abDcDD'},
            {t1: 'aDbcDD'}, {t1: 'aDbDcD'},
            {t1: 'DabcDD'}, {t1: 'DabDcD'},
            {t1: 'DaDbcD'}, {t1: 'DaDbDc'},
        ];
        testGrammar(grammar, expectedResults);
    });

});
