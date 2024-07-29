import { 
    Count, Epsilon, Null, Rep,
    Replace, ReplaceBlock, Uni, WithVocab,
    OptionalReplace,
    Join,
    Lit,
} from "../../interpreter/src/grammarConvenience";

import { DEFAULT_TAPE, INPUT_TAPE, OUTPUT_TAPE } from "../../interpreter/src/utils/constants";
import { SILENT, VERBOSE_DEBUG, VERBOSE_STATES } from "../../interpreter/src/utils/logging";

import {
    grammarTestSuiteName,
    testGrammar,
    t1,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

const I = (s: string) => Lit(INPUT_TAPE, s);
const O = (s: string) => Lit(OUTPUT_TAPE, s);

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammar({
        desc: '1. hello ⨝ e -> a',
        grammar: ReplaceBlock("t1", "hello", 
                              Replace("e", "a")),
        tapes: ["t1"],
        results: [
            {t1: 'hallo'},
        ],
        verbose: VERBOSE_DEBUG
    });

    /*
    testGrammar({
        desc: '2. hello ⨝ e -> a, a -> uT',
        grammar: ReplaceBlock("t1", "hello",
                              Replace("e", "a"),
                              Replace("a", "u")),
        results: [
            {t1: 'hullo'},
        ],
    });

    testGrammar({
        desc: '3a. Replace e -> a, then l -> w, in hello',
        grammar: ReplaceBlock("t1", "hello",
                              Replace("e", "a"),
                              Replace("l", "w")),
        results: [
            {t1: 'hawwo'},
        ],
    });

    testGrammar({
		desc: '3b. Replace l -> w, then e -> a, in hello',
        grammar: ReplaceBlock("t1", "hello",
                              Replace("l", "w"),
                              Replace("e", "a")),
        results: [
            {t1: 'hawwo'},
        ],
    });

    testGrammar({
		desc: '4. Replace e -> e, in hello',
        grammar: ReplaceBlock("t1", "hello",
                              Replace("e", "e")),
        results: [
            {t1: 'hello'},
        ],
    });

    testGrammar({
		desc: '5a. 1-char deletion: abc ⨝ a -> "" (vocab abcx)',
        grammar: WithVocab({t1: "abcx"},
                     ReplaceBlock("t1", "abc",
                                  Replace("a", ""))),
        results: [
            {t1: 'bc'},
        ],
    });

    testGrammar({
		desc: '5b. 2-char deletion: abc ⨝ ab -> "" (vocab abcx)',
        grammar: WithVocab({t1: "abcx"},
                     ReplaceBlock("t1", "abc",
                                  Replace("ab", ""))),
        results: [
            {t1: 'c'},
        ],
    });

    testGrammar({
		desc: '5c. 2-char deletion, later in string: ' +
              'abc ⨝ bc -> "" (vocab abcx)',
        grammar: WithVocab({t1: "abcx"},
                     ReplaceBlock("t1", "abc",
                                  Replace("bc", ""))),
        results: [
            {t1: 'a'},
        ],
    });

    // Exploring rule cascades with first 'to' empty - garden path

    // 12 states visited
    testGrammar({
		desc: '6a. 2-rule cascade: ' +
              'abcd ⨝ a -> A, b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", "A"),
                                  Replace("b", "B"))),
        results: [
            {t1: 'ABcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 9 states visited
    testGrammar({
		desc: '6b. 2-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcABC"},
                     ReplaceBlock("t1", "abc",
                                  Replace("a", ""),
                                  Replace("b", "B"))),
        results: [
            {t1: 'Bc'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 16 states visited
    testGrammar({
		desc: '6c. 3-rule cascade: ' +
              'abcd ⨝ a -> A, b -> B, c -> C (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", "A"),
                                  Replace("b", "B"),
                                  Replace("c", "C"))),
        results: [
            {t1: 'ABCd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 16 states visited
    testGrammar({
		desc: '6d. 3-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B, c -> C (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", ""),
                                  Replace("b", "B"),
                                  Replace("c", "C"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", "A"),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", ""),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "CCCCCabcdCCCCC",
                                  Replace("a", "A"),
                                  Replace("b", "B"))),
        results: [
            {t1: 'CCCCCABcdCCCCC'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 72 states visited
    testGrammar({
        desc: '7b. 24-char input, 2-rule cascade: ' +
              'BBBBBCCCCCabcdCCCCCBBBBB ⨝ a -> A, b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "BBBBBCCCCCabcdCCCCCBBBBB",
                                  Replace("a", "A"),
                                  Replace("b", "B"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "CCCCCabcdCCCCC",
                                  Replace("a", "A"),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "CCCCCabcdCCCCC",
                                  Replace("a", ""),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "BBBBBCCCCCabcdCCCCCBBBBB",
                                  Replace("a", ""),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", "A"))),
        results: [
            {t1: 'Abcd'}
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 13 states visited
    testGrammar({
        desc: '8a-2. Single rule with 2>1-char substitution: ' +
              'aabcd ⨝ aa -> A (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aabcd",
                                  Replace("aa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '8a-3. Single rule with 3>1-char substitution: ' +
              'aaabcd ⨝ aaa -> A (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaabcd",
                                  Replace("aaa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 29 states visited
    testGrammar({
        desc: '8a-4. Single rule with 4>1-char substitution: ' +
              'aaaabcd ⨝ aaaa -> A (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaaabcd",
                                  Replace("aaaa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 40 states visited
    testGrammar({
        desc: '8a-5. Single rule with 5>1-char substitution: ' +
              'aaaaabcd ⨝ aaaaa -> A (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaaaabcd",
                                  Replace("aaaaa", "A"))),
        results: [
            {t1: 'Abcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '8b-2. 2-rule cascade starting with 2>1-char substitution: ' +
              'aabcd ⨝ aa -> A, b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aabcd",
                                  Replace("aa", "A"),
                                  Replace("b", "B"))),
        results: [
            {t1: 'ABcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 31 states visited
    testGrammar({
        desc: '8b-3. 2-rule cascade starting with 3>1-char substitution: ' +
              'aaabcd ⨝ aaa -> A, b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaabcd",
                                  Replace("aaa", "A"),
                                  Replace("b", "B"))),
        results: [
            {t1: 'ABcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '8c-1. 4-rule cascade starting with 1>1-char substitution: ' +
              'abcd ⨝ a -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", "A"),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 34 states visited
    testGrammar({
        desc: '8c-2. 4-rule cascade starting with 2>1-char substitution: ' +
              'aabcd ⨝ aa -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aabcd",
                                  Replace("aa", "A"),
                                  Replace("b", "B"),
                                          Replace("c", "C"),
                                          Replace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 53 states visited
    testGrammar({
        desc: '8c-3. 4-rule cascade starting with 3>1-char substitution: ' +
              'aaabcd ⨝ aaa -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaabcd",
                                  Replace("aaa", "A"),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 77 states visited
    testGrammar({
        desc: '8c-4. 4-rule cascade starting with 4>1-char substitution: ' +
              'aaaabcd ⨝ aaaa -> A, b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaaabcd",
                                  Replace("aaaa", "A"),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
        results: [
            {t1: 'ABCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '10a. 2-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", ""),
                                  Replace("b", "B"))),
        results: [
            {t1: 'Bcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '10b. 2-rule cascade starting with 2-char deletion: ' +
              'aabcd ⨝ aa -> "", b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aabcd",
                                  Replace("aa", ""),
                                  Replace("b", "B"))),
        results: [
            {t1: 'Bcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 31 states visited
    testGrammar({
        desc: '10c. 2-rule cascade starting with 3-char deletion: ' +
              'aaabcd ⨝ aaa -> "", b -> B (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aaabcd",
                                  Replace("aaa", ""),
                                  Replace("b", "B"))),
        results: [
            {t1: 'Bcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 20 states visited
    testGrammar({
        desc: '11a. 4-rule cascade starting with 1-char deletion: ' +
              'abcd ⨝ a -> "", b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "abcd",
                                  Replace("a", ""),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
        results: [
            {t1: 'BCD'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 34 states visited
    testGrammar({
        desc: '11b. 4-rule cascade starting with 2-char deletion: ' +
              'aabcd ⨝ aa -> "", b -> B, c -> C, d -> D (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
                     ReplaceBlock("t1", "aabcd",
                                  Replace("aa", ""),
                                  Replace("b", "B"),
                                  Replace("c", "C"),
                                  Replace("d", "D"))),
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
        grammar: WithVocab({t1: "abcdABCD"},
        			 ReplaceBlock("t1", "abcd",
                                  Replace("a", "AA"))),
        results: [
            {t1: 'AAbcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '12b. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ a -> AAAAA (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
        			 ReplaceBlock("t1", "abcd",
                                  Replace("a", "AAAAA"))),
        results: [
            {t1: 'AAAAAbcd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '12c. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ c -> CCCCC (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
        			 ReplaceBlock("t1", "abcd",
                                  Replace("c", "CCCCC"))),
        results: [
            {t1: 'abCCCCCd'},
        ],
        verbose: vb(VERBOSE_STATES),
    });

    // 12 states visited
    testGrammar({
        desc: '12d. Single rule with 1>5-char substitution: ' +
              'abcd ⨝ d -> DDDDD (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
        			 ReplaceBlock("t1", "abcd",
                                  Replace("d", "DDDDD"))),
        results: [
            {t1: 'abcDDDDD'},
        ],
        verbose: vb(VERBOSE_STATES),
   });

    testGrammar({
        desc: '13. Deleting twice in one word: ' +
              'abcdabcd ⨝ a -> "" (vocab abcdABCD)',
        grammar: WithVocab({t1: "abcdABCD"},
        			 ReplaceBlock("t1", "abcdabcd",
                                  Replace("a", ""))),
        results: [
            {t1: 'bcdbcd'},
        ],
    });

    testGrammar({
        desc: '14a. Unconditional generation: ab ⨝ "" -> C',
        grammar: ReplaceBlock("t1", "ab",
                    Replace("", "C")),
        results: [
            {t1: 'CaCbC'},
        ],
    });

    testGrammar({
        desc: '14b. Unconditional generation, cascading: ab ⨝ "" -> C, "" -> D',
        grammar: ReplaceBlock("t1", "ab",
                            Replace("", "C"),
                            Replace("", "D")),
        results: [
            {t1: 'DCDaDCDbDCD'},
        ],
    });

    testGrammar({
        desc: '14c. Unconditional generation, optional: ab ⨝ "" -> C',
        grammar: ReplaceBlock("t1", "ab",
                        OptionalReplace("", "C")),
        results: [
            {t1: 'CaCbC'},
            {t1: 'CaCb'}, 
            {t1: 'CabC'},
            {t1: 'Cab'},  
            {t1: 'aCbC'},
            {t1: 'aCb'},  
            {t1: 'abC'},
            {t1: 'ab'},
        ],
    });

    testGrammar({
        desc: '14d. Unconditional generation, cascading, first optional',
        grammar: ReplaceBlock("t1", "ab",
                    OptionalReplace("", "C"),
                    Replace("C", "D")),
        results: [
            {t1: 'DaDbD'},
            {t1: 'DaDb'}, 
            {t1: 'DabD'},
            {t1: 'Dab'},  
            {t1: 'aDbD'},
            {t1: 'aDb'},  
            {t1: 'abD'},
            {t1: 'ab'},
        ],
    });

    testGrammar({
        desc: '15. Replacement of ε ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE,
                              Epsilon(),
                              Replace("e", "a")),
        results: [
            {},
        ],
        numErrors: 1
    });

    testGrammar({
        desc: '16a. Replacement of alternation: hello|hell ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("hello", "hell"),
                              Replace("e", "a")),
        results: [
            {"$T": 'hall'},
            {"$T": 'hallo'},
        ]
    });
    
    testGrammar({
        desc: '16b. Replacement of alternation: h|hi ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("h", "hi"),
                              Replace("e", "a")),
        results: [
            {"$T": 'h'},
            {"$T": 'hi'},
        ]
    });

    testGrammar({
        desc: '16c. Replacement of alternation: hello|hell|ε ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                              Uni("hello", "hell", Epsilon()),
                              Replace("e", "a")),
        results: [
            {"$T": 'hall'},
            {"$T": 'hallo'},
            {},
        ]
    });

    testGrammar({
        desc: '17a. Replacement of repetition: hello* ⨝ e -> a',
        grammar: Count({[DEFAULT_TAPE]:10}, 
                    ReplaceBlock(DEFAULT_TAPE, 
                                 Rep("hello"),
                                 Replace("e", "a"))),
        results: [
            {},
            {"$T": 'hallo'},
            {"$T": 'hallohallo'},
        ]
    });

    testGrammar({
        desc: '17b. Replacement of repetition: (hello|hi)* ⨝ e -> a',
        grammar: Count({[DEFAULT_TAPE]:6}, 
                    ReplaceBlock(DEFAULT_TAPE, 
                                 Rep(Uni("hello", "hi")),
                                 Replace("e", "a"))),
        results: [
            {},
            {"$T": 'hi'},
            {"$T": 'hihihi'},
            {"$T": 'hihi'},
            {"$T": 'hallo'},
        ]
    });
    
    testGrammar({
        desc: '17c. Replacement of repetition: (hello|hi|ε)* ⨝ e -> a',
        grammar: Count({[DEFAULT_TAPE]:6}, 
                    ReplaceBlock(DEFAULT_TAPE, 
                                 Rep(Uni("hello", "hi", Epsilon())),
                                 Replace("e", "a"))),
        results: [
            {},
            {"$T": 'hi'},
            {"$T": 'hihihi'},
            {"$T": 'hihi'},
            {"$T": 'hallo'},
        ]
    });

    testGrammar({
        desc: '18. Replacement of null ⨝ e -> a',
        grammar: ReplaceBlock(DEFAULT_TAPE, 
                    Null(), Replace("e","a")),
        results: [],
        numErrors: 1
    });

    testGrammar({
		desc: '19. 2-rule cascade starting with 1-char deletion at the end: ' +
              'abc ⨝ c -> "", b -> B',
        grammar: ReplaceBlock("t1", "abc",
                                  Replace("c", ""),
                                  Replace("b", "B")),
        results: [
            {t1: 'aB'},
        ],
    });

    testGrammar({
        desc: '20a. Replacement at the beginning, on the left side of a join',
        grammar: Join(ReplaceBlock("t1", "abc",
                        Replace("a", "X")), t1('Xbc')),
        results: [
            {t1: 'Xbc'},
        ],
    });

    testGrammar({
        desc: '20b. Replacement at the beginning, on the right side of a join',
        grammar: Join(t1("Xbc"), ReplaceBlock("t1", "abc",
                        Replace("a", "X"))),
        results: [
            {t1: 'Xbc'},
        ],
    });
  
    testGrammar({
        desc: '20c. Replacement at the end, on the left side of a join',
        grammar: Join(ReplaceBlock("t1", "abc",
                        Replace("c", "X")), t1('abX')),
        results: [
            {t1: 'abX'},
        ],
    });
    
    testGrammar({
        desc: '20d. Replacement at the end, on the right side of a join',
        grammar: Join(t1("abX"), ReplaceBlock("t1", "abc",
                        Replace("c", "X"))),
        results: [
            {t1: 'abX'},
        ],
    });

    testGrammar({
        desc: '21a. Shortening at the end, on the left side of a join',
        grammar: Join(ReplaceBlock("t1", "abc",
                        Replace("c", "")), t1('ab')),
        results: [
            {t1: 'ab'},
        ],
    });
    
    testGrammar({
        desc: '21b. Shortening at the end, on the right side of a join',
        grammar: Join(t1("ab"), ReplaceBlock("t1", "abc",
                        Replace("c", ""))),
        results: [
            {t1: 'ab'},
        ],
    });

    testGrammar({
        desc: '22. Replacing before an epsilon',
        grammar: ReplaceBlock("t1", "abc",
                        Replace("b", "B", "", Uni(I("c"), I("")), false, true)),
        results: [
            {t1: 'aBc'},
        ],
    });
    */
});
