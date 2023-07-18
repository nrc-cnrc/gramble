import { 
    Count,
    Grammar,
    Join,
    JoinRule,
    Lit,
    OptionalReplace,
    Replace,
    ReplaceGrammar,
    Seq,
    Uni,
    Vocab,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

import {
    REPLACE_INPUT_TAPE, REPLACE_OUTPUT_TAPE, 
    SILENT, VERBOSE_DEBUG, VERBOSE_STATES
} from "../../src/util";

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

function withVocab(voc: string, grammar: Grammar) {
    return Seq(Vocab({t1:voc}), grammar);
}

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. hello ⨝ e -> a',
        grammar: IOJoin("hello", IOReplace("e","a")),
        results: [
            {t1: 'hallo'},
        ],
    });

    testGrammar({
        desc: '2. hello ⨝ e -> a, a -> uT',
        grammar: IOJoin("hello", IOReplace("e", "a"),
                                 IOReplace("a", "u")),
        results: [
            {t1: "hullo"},
        ],
    });

    testGrammar({
        desc: '3a. Replace e -> a, then l -> w, in hello',
        grammar: IOJoin("hello", IOReplace("e", "a"),
                                 IOReplace("l", "w")),
        results: [
            {t1: "hawwo"},
        ],
    });

    testGrammar({
		desc: '3b. Replace l -> w, then e -> a, in hello',
        grammar: IOJoin("hello", IOReplace("l", "w"),
                                 IOReplace("e", "a")),
        results: [
            {t1: "hawwo"},
        ],
    });

    testGrammar({
		desc: '4. Replace e -> e, in hello',
        grammar: IOJoin("hello", IOReplace("e", "e")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '5a. 1-char deletion: abc ⨝ a -> "" (vocab abcx)',
        grammar: withVocab("abcx", IOJoin("abc", IOReplace("a", ""))),
        results: [
            {t1: 'bc'},
        ],
    });

    testGrammar({
		desc: '5b. 2-char deletion: abc ⨝ ab -> "" (vocab abcx)',
        grammar: withVocab("abcx", IOJoin("abc", IOReplace("ab", ""))),
        results: [
            {t1: 'c'},
        ],
    });

    testGrammar({
		desc: '5c. 2-char deletion, later in string: ' +
              'abc ⨝ bc -> "" (vocab abcx)',
        grammar: withVocab("abcx", IOJoin("abc", IOReplace("bc", ""))),
        results: [
            {t1: 'a'},
        ],
    });

    // Exploring rule cascades with first 'to' empty - garden path

    // 12 states visited
    testGrammar({
		desc: '6a. 2-rule cascade: ' +
              'abcd ⨝ a -> A, b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", "A"),
                                          IOReplace("b", "B"))),
        results: [
            {t1: 'ABcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 9 states visited
    testGrammar({
		desc: '6b. 2-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B (vocab abcdABCD)',
        grammar: withVocab("abcABC",
                           IOJoin("abc", IOReplace("a", ""),
                                         IOReplace("b", "B"))),
        results: [
            {t1: 'Bc'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 16 states visited
    testGrammar({
		desc: '6c. 3-rule cascade: ' +
              'abcd ⨝ a -> A, b -> B, c -> C (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", "A"),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"))),
        results: [
            {t1: 'ABCd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 16 states visited
    testGrammar({
		desc: '6d. 3-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B, c -> C (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", ""),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"))),
        results: [
            {t1: 'BCd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
		desc: '6e. 4-rule cascade: ' +
              'abcd ⨝ a -> A, b -> B, c -> C, d -> D ' +
              '(vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", "A"),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"),
                                          IOReplace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
		desc: '6f. 4-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B, c -> C, d -> D ' +
              '(vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", ""),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"),
                                          IOReplace("d", "D"))),
        results: [
            {t1: 'BCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // Exploring rule cascades varying the input length

    // 42 states visited
    testGrammar({
        desc: '7a. 14-char input, 2-rule cascade: ' +
              'CCCCCabcdCCCCC ⨝ a -> A, b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("CCCCCabcdCCCCC",
                                  IOReplace("a", "A"),
                                  IOReplace("b", "B"))),
        results: [
            {t1: 'CCCCCABcdCCCCC'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 72 states visited
    testGrammar({
        desc: '7b. 24-char input, 2-rule cascade: ' +
              'BBBBBCCCCCabcdCCCCCBBBBB ⨝ a -> A, b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("BBBBBCCCCCabcdCCCCCBBBBB",
                                  IOReplace("a", "A"),
                                  IOReplace("b", "B"))),
        results: [
            {t1: 'BBBBBCCCCCABcdCCCCCBBBBB'},
        ],
        verbose: vb(VERBOSE_STATES),
    });
    
    // 70 states visited
    testGrammar({
        desc: '7c. 14-char input, 4-rule cascade: ' +
              'CCCCCabcdCCCCC ⨝ a -> A, b -> B, c -> C, d -> D ' +
              '(vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("CCCCCabcdCCCCC",
                                  IOReplace("a", "A"),
                                  IOReplace("b", "B"),
                                  IOReplace("c", "C"),
                                  IOReplace("d", "D"))),
        results: [
            {t1: 'CCCCCABCDCCCCC'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 70 states visited
    testGrammar({
        desc: '7d. 14-char input, 4-rule cascade starting with 1-char deletion: ' +
              'CCCCCabcdCCCCC ⨝ a -> "", b -> B, c -> C, d -> D ' +
              '(vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("CCCCCabcdCCCCC",
                                  IOReplace("a", ""),
                                  IOReplace("b", "B"),
                                  IOReplace("c", "C"),
                                  IOReplace("d", "D"))),
        results: [
            {t1: 'CCCCCBCDCCCCC'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 120 states visited
    testGrammar({
        desc: '7e. 24-char input, 4-rule cascade starting with 1-char deletion: ' +
              'BBBBBCCCCCabcdCCCCCBBBBB ⨝ a -> "", b -> B, c -> C, d -> D ' +
              '(vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("BBBBBCCCCCabcdCCCCCBBBBB",
                                  IOReplace("a", ""),
                                  IOReplace("b", "B"),
                                  IOReplace("c", "C"),
                                  IOReplace("d", "D"))),
        results: [
            {t1: 'BBBBBCCCCCBCDCCCCCBBBBB'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // Exploring rule cascades with 'from' being longer than 'to' - garden path

    // 8 states visited
    testGrammar({
        desc: '8a-1. Single rule with 1>1-char substitution: ' +
              'abcd ⨝ a -> A (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", "A"))),
        results: [
            {t1: 'Abcd'}
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 13 states visited
    testGrammar({
        desc: '8a-2. Single rule with 2>1-char substitution: ' +
              'aabcd ⨝ aa -> A (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aabcd", IOReplace("aa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '8a-3. Single rule with 3>1-char substitution: ' +
              'aaabcd ⨝ aaa -> A (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaabcd", IOReplace("aaa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 29 states visited
    testGrammar({
        desc: '8a-4. Single rule with 4>1-char substitution: ' +
              'aaaabcd ⨝ aaaa -> A (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaaabcd", IOReplace("aaaa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 40 states visited
    testGrammar({
        desc: '8a-5. Single rule with 5>1-char substitution: ' +
              'aaaaabcd ⨝ aaaaa -> A (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaaaabcd", IOReplace("aaaaa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '8b-2. 2-rule cascade starting with 2>1-char substitution: ' +
              'aabcd ⨝ aa -> A, b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aabcd", IOReplace("aa", "A"),
                                           IOReplace("b", "B"))),
        results: [
            {t1: 'ABcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 31 states visited
    testGrammar({
        desc: '8b-3. 2-rule cascade starting with 3>1-char substitution: ' +
              'aaabcd ⨝ aaa -> A, b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaabcd", IOReplace("aaa", "A"),
                                            IOReplace("b", "B"))),
        results: [
            {t1: 'ABcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '8c-1. 4-rule cascade starting with 1>1-char substitution: ' +
              'abcd ⨝ a -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", "A"),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"),
                                          IOReplace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 34 states visited
    testGrammar({
        desc: '8c-2. 4-rule cascade starting with 2>1-char substitution: ' +
              'aabcd ⨝ aa -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                          IOJoin("aabcd", IOReplace("aa", "A"),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"),
                                          IOReplace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 53 states visited
    testGrammar({
        desc: '8c-3. 4-rule cascade starting with 3>1-char substitution: ' +
              'aaabcd ⨝ aaa -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaabcd", IOReplace("aaa", "A"),
                                            IOReplace("b", "B"),
                                            IOReplace("c", "C"),
                                            IOReplace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 77 states visited
    testGrammar({
        desc: '8c-4. 4-rule cascade starting with 4>1-char substitution: ' +
              'aaaabcd ⨝ aaaa -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaaabcd", IOReplace("aaaa", "A"),
                                             IOReplace("b", "B"),
                                             IOReplace("c", "C"),
                                             IOReplace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '10a. 2-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", ""),
                                          IOReplace("b", "B"))),
        results: [
            {t1: 'Bcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '10b. 2-rule cascade starting with 2-char deletion: ' +
              'aabcd ⨝ aa -> "", b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aabcd", IOReplace("aa", ""),
                                           IOReplace("b", "B"))),
        results: [
            {t1: 'Bcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 31 states visited
    testGrammar({
        desc: '10c. 2-rule cascade starting with 3-char deletion: ' +
              'aaabcd ⨝ aaa -> "", b -> B (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aaabcd", IOReplace("aaa", ""),
                                            IOReplace("b", "B"))),
        results: [
            {t1: 'Bcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '11a. 4-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("abcd", IOReplace("a", ""),
                                          IOReplace("b", "B"),
                                          IOReplace("c", "C"),
                                          IOReplace("d", "D"))),
        results: [
            {t1: 'BCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 34 states visited
    testGrammar({
        desc: '11b. 4-rule cascade starting with 2-char deletion: ' +
              'aabcd ⨝ aa -> "", b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           IOJoin("aabcd", IOReplace("aa", ""),
                                           IOReplace("b", "B"),
                                           IOReplace("c", "C"),
                                           IOReplace("d", "D"))),
        results: [
            {t1: 'BCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // Exploring rule cascades with 'from' being shorter than 'to' - NO garden path

    // 9 states visited
    testGrammar({
        desc: '12a. Single rule with 1>2-char substitution: ' +
              'abcd ⨝ a -> AA (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
        				   IOJoin("abcd", IOReplace("a", "AA"))),
        results: [
            {t1: 'AAbcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '12b. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ a -> AAAAA (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
        				   IOJoin("abcd", IOReplace("a", "AAAAA"))),
        results: [
            {t1: 'AAAAAbcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '12c. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ c -> CCCCC (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
        				   IOJoin("abcd", IOReplace("c", "CCCCC"))),
        results: [
            {t1: 'abCCCCCd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '12d. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ d -> DDDDD (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
        				   IOJoin("abcd", IOReplace("d", "DDDDD"))),
        results: [
            {t1: 'abcDDDDD'},
        ],
        verbose: vb(VERBOSE_STATES),
   });

    testGrammar({
        desc: '13. Deleting twice in one word: ' +
              'abcdabcd ⨝ a -> "" (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
        				   IOJoin("abcdabcd", IOReplace("a", ""))),
        results: [
            {t1: 'bcdbcd'},
        ],
    });

    testGrammar({
        desc: '14a. Unconditional generation: ' +
              '(abc ⨝ "" -> D) ⨝ abc|aDbc|abcDDD (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
                           Join(IOJoin("abc", IOReplaceOptional("", "D")),
                                Uni(t1("abc"), t1("aDbc"), t1("abcDDD")))),
        results: [
            {t1: 'abc'},
            {t1: 'aDbc'},
            {t1: 'abcDDD'},
        ],
    });

    testGrammar({
        desc: '14b. Unconditional generation: abc ⨝ "" -> D (vocab abcdABCD)',
        grammar: withVocab("abcdABCD",
        				   Count({t1:6},
                                 IOJoin("abc", IOReplaceOptional("", "D")))),
        results: [
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
        ],
    });

});
