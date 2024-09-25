import {
    Count, Epsilon, Join, Lit,
    OptionalReplace, Replace, 
    Seq, Uni, WithVocab
} from "../../interpreter/src/grammarConvenience";

import {INPUT_TAPE, OUTPUT_TAPE } from "../../interpreter/src/utils/constants";
import {SILENT, VERBOSE_DEBUG, VERBOSE_TIME } from "../../interpreter/src/utils/logging";

import {
    grammarTestSuiteName,
    testGrammar, testGrammarIO,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

const EMPTY_CONTEXT = Epsilon();

const I = (s: string) => Lit(INPUT_TAPE, s);
const O = (s: string) => Lit(OUTPUT_TAPE, s);

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testGrammarIO({
		desc: '1a. Replace ε -> X in "abc"',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['abc', 'XaXbXcX']
        ],
    });

    testGrammarIO({
		desc: '1b. Replace ε -> X in "abc", beginsWith',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['abc', 'Xabc']
        ],
    });

    testGrammarIO({
		desc: '1c. Replace ε -> X in "abc", endsWith',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['abc', 'abcX']
        ],
    });
    
    testGrammarIO({
		desc: '1d. Replace ε -> X in "abc", beginsWith endsWith',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['abc', 'abc']
        ],
    });
    
    /*
    testGrammarIO({
		desc: '1a-OI. Replace ε -> X in "abc"',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['abc', 'XaXbXcX']
        ],
        priority: ["$o", "$i"],
    });

    testGrammarIO({
		desc: '1b-OI. Replace ε -> X in "abc", beginsWith',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['abc', 'Xabc']
        ],
        priority: ["$o", "$i"]
    });

    testGrammarIO({
		desc: '1c-OI. Replace ε -> X in "abc", endsWith',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['abc', 'abcX']
        ],
        priority: ["$o", "$i"]
    });
    
    testGrammarIO({
		desc: '1d-OI. Replace ε -> X in "abc", beginsWith endsWith',
        grammar: Join(I("abc"),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['abc', 'abc']
        ],
        priority: ["$o", "$i"]
    });
    */

    testGrammarIO({
		desc: '2a. Replace ε -> X in ""',
        grammar: Join(I(""),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['', 'X']
        ],
    });

    testGrammarIO({
		desc: '2b. Replace ε -> X in "", beginsWith',
        grammar: Join(I(""),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['', 'X']
        ],
    });
    
    testGrammarIO({
		desc: '2c. Replace ε -> X in "", endsWith',
        grammar: Join(I(""),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['', 'X']
        ],
    });

    testGrammarIO({
		desc: '2d. Replace ε -> X in "", beginsWith endsWith',
        grammar: Join(I(""),
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['', 'X']
        ],
    });

    
    testGrammarIO({
		desc: '3a. Replace ε -> X in "ab", optional',
        grammar: Join(I("ab"),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['ab', 'ab'],   ['ab', 'abX'],
            ['ab', 'aXb'],  ['ab', 'aXbX'],
            ['ab', 'Xab'],  ['ab', 'XabX'],
            ['ab', 'XaXb'], ['ab', 'XaXbX'],
        ],
    });

    testGrammarIO({
		desc: '3b. Replace ε -> X in "ab", beginsWith optional',
        grammar: Join(I("ab"),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['ab', 'ab'],
            ['ab', 'Xab'],
        ],
    });

    testGrammarIO({
		desc: '3c. Replace ε -> X in "ab", endsWith optional',
        grammar: Join(I("ab"),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['ab', 'ab'],
            ['ab', 'abX']
        ],
    });
    
    testGrammarIO({
		desc: '3d. Replace ε -> X in "ab", beginsWith endsWith optional',
        grammar: Join(I("ab"),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['ab', 'ab']
        ],
    });

    testGrammarIO({
		desc: '4a. Replace ε -> X in "", optional',
        grammar: Join(I(""),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['', ''],
            ['', 'X']
        ],
    });

    testGrammarIO({
		desc: '4b. Replace ε -> X in "", beginsWith optional',
        grammar: Join(I(""),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['', ''],
            ['', 'X']
        ],
    });
    
    testGrammarIO({
		desc: '4c. Replace ε -> X in "", endsWith optional',
        grammar: Join(I(""),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['', ''],
            ['', 'X']
        ],
    });

    testGrammarIO({
		desc: '4d. Replace ε -> X in "", beginsWith endsWith optional',
        grammar: Join(I(""),
                      OptionalReplace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['', ''],
            ['', 'X']
        ],
    });

    testGrammar({
        desc: '5a. Replace ε by a: Cnt_o:3 ε -> a || #_ ($o:ahl)',
        grammar: Count({$o:3},
        			 WithVocab({$o:'ahl'},
                        Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            {$o: 'a'},  // equivalent to {$i: '', $o: 'a'}
            {$i: 'a', $o: 'aa'},   {$i: 'h', $o: 'ah'},
            {$i: 'l', $o: 'al'},   {$i: 'aa', $o: 'aaa'},
            {$i: 'ah', $o: 'aah'}, {$i: 'al', $o: 'aal'},
            {$i: 'ha', $o: 'aha'}, {$i: 'hh', $o: 'ahh'},
            {$i: 'hl', $o: 'ahl'}, {$i: 'la', $o: 'ala'},
            {$i: 'lh', $o: 'alh'}, {$i: 'll', $o: 'all'},
            // No copy-through because insertions can always occur at the start.
        ],
    });

    testGrammar({
        desc: '5b. Replace ε by a: Cnt_o:3 ε -> a || _# (vocab $o:ahl)',
        grammar: Count({$o:3},
        			 WithVocab({$o:'ahl'},
                        Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            {$o: 'a'},  // equivalent to {$i: '', $o: 'a'}
            {$i: 'a', $o: 'aa'},   {$i: 'h', $o: 'ha'},
            {$i: 'l', $o: 'la'},   {$i: 'aa', $o: 'aaa'},
            {$i: 'ah', $o: 'aha'}, {$i: 'al', $o: 'ala'},
            {$i: 'ha', $o: 'haa'}, {$i: 'hh', $o: 'hha'},
            {$i: 'hl', $o: 'hla'}, {$i: 'la', $o: 'laa'},
            {$i: 'lh', $o: 'lha'}, {$i: 'll', $o: 'lla'},
            // No copy-through because insertions can always occur at the end.
        ],
    });

    testGrammar({
        desc: '5c. Replace ε by a: Cnt_i:2_o:3 ε -> a || #_# (vocab $o:ahl)',
        grammar: Count({$i:2, $o:3},
        			 WithVocab({$o:'ahl'},
                        Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            // Insertions
            {$o: 'a'},  // equivalent to {$i: '', $o: 'a'}
            // Copy-through (begins & ends with can only be statisfied if there
            // is no content on $i)
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},     {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'},   {$i: 'al', $o: 'al'},
            {$i: 'ha', $o: 'ha'},   {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'la', $o: 'la'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '5d. Replace ε by a: Cnt_3 ε -> a (vocab $o:ahl)',
        grammar: Count({$i:3},
        			 WithVocab({$o:'ahl'},
                         Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        results: [
            {$o: 'a'},
            {$i: 'a', $o: 'aaa'},       {$i: 'h', $o: 'aha'},
            {$i: 'l', $o: 'ala'},       {$i: 'aa', $o: 'aaaaa'},
            {$i: 'ah', $o: 'aaaha'},    {$i: 'al', $o: 'aaala'},
            {$i: 'ha', $o: 'ahaaa'},    {$i: 'hh', $o: 'ahaha'},
            {$i: 'hl', $o: 'ahala'},    {$i: 'la', $o: 'alaaa'},
            {$i: 'lh', $o: 'alaha'},    {$i: 'll', $o: 'alala'},
            {$i: 'aaa', $o: 'aaaaaaa'}, {$i: 'aah', $o: 'aaaaaha'},
            {$i: 'aal', $o: 'aaaaala'}, {$i: 'aha', $o: 'aaahaaa'},
            {$i: 'ahh', $o: 'aaahaha'}, {$i: 'ahl', $o: 'aaahala'},
            {$i: 'ala', $o: 'aaalaaa'}, {$i: 'alh', $o: 'aaalaha'},
            {$i: 'all', $o: 'aaalala'}, {$i: 'haa', $o: 'ahaaaaa'},
            {$i: 'hah', $o: 'ahaaaha'}, {$i: 'hal', $o: 'ahaaala'},
            {$i: 'hha', $o: 'ahahaaa'}, {$i: 'hhh', $o: 'ahahaha'},
            {$i: 'hhl', $o: 'ahahala'}, {$i: 'hla', $o: 'ahalaaa'},
            {$i: 'hlh', $o: 'ahalaha'}, {$i: 'hll', $o: 'ahalala'},
            {$i: 'laa', $o: 'alaaaaa'}, {$i: 'lah', $o: 'alaaaha'},
            {$i: 'lal', $o: 'alaaala'}, {$i: 'lha', $o: 'alahaaa'},
            {$i: 'lhh', $o: 'alahaha'}, {$i: 'lhl', $o: 'alahala'},
            {$i: 'lla', $o: 'alalaaa'}, {$i: 'llh', $o: 'alalaha'},
            {$i: 'lll', $o: 'alalala'},
        ],
    });

    testGrammar({
        desc: '6a. Replace ε by a, optional: Cnt_3 ε -> a (vocab $o:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        results: [
            // Insertions
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}\
            {$i: 'a', $o: 'aa'},    {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},    {$i: 'l', $o: 'al'},
            {$i: 'l', $o: 'la'},    {$i: 'a', $o: 'aaa'},
            {$i: 'h', $o: 'aha'},
            {$i: 'l', $o: 'ala'},   
            {$i: 'aa', $o: 'aaa'},  {$i: 'ah', $o: 'aah'},
            {$i: 'ah', $o: 'aha'},  {$i: 'al', $o: 'aal'},
            {$i: 'al', $o: 'ala'},  {$i: 'ha', $o: 'aha'},
            {$i: 'ha', $o: 'haa'},  {$i: 'hh', $o: 'ahh'},
            {$i: 'hh', $o: 'hah'},  {$i: 'hh', $o: 'hha'},
            {$i: 'hl', $o: 'ahl'},  {$i: 'hl', $o: 'hal'},
            {$i: 'hl', $o: 'hla'},  {$i: 'la', $o: 'ala'},
            {$i: 'la', $o: 'laa'},  {$i: 'lh', $o: 'alh'},
            {$i: 'lh', $o: 'lah'},  {$i: 'lh', $o: 'lha'},
            {$i: 'll', $o: 'all'},  {$i: 'll', $o: 'lal'},
            {$i: 'll', $o: 'lla'},
            // Copy-through: 0 insertions (because optional is set)
            {},         // equivalent to {$i: '', $o: ''}
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},     {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'},   {$i: 'al', $o: 'al'},
            {$i: 'ha', $o: 'ha'},   {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'la', $o: 'la'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'aaa', $o: 'aaa'}, {$i: 'aah', $o: 'aah'},
            {$i: 'aal', $o: 'aal'}, {$i: 'aha', $o: 'aha'},
            {$i: 'ahh', $o: 'ahh'}, {$i: 'ahl', $o: 'ahl'},
            {$i: 'ala', $o: 'ala'}, {$i: 'alh', $o: 'alh'},
            {$i: 'all', $o: 'all'}, {$i: 'haa', $o: 'haa'},
            {$i: 'hah', $o: 'hah'}, {$i: 'hal', $o: 'hal'},
            {$i: 'hha', $o: 'hha'}, {$i: 'hhh', $o: 'hhh'},
            {$i: 'hhl', $o: 'hhl'}, {$i: 'hla', $o: 'hla'},
            {$i: 'hlh', $o: 'hlh'}, {$i: 'hll', $o: 'hll'},
            {$i: 'laa', $o: 'laa'}, {$i: 'lah', $o: 'lah'},
            {$i: 'lal', $o: 'lal'}, {$i: 'lha', $o: 'lha'},
            {$i: 'lhh', $o: 'lhh'}, {$i: 'lhl', $o: 'lhl'},
            {$i: 'lla', $o: 'lla'}, {$i: 'llh', $o: 'llh'},
            {$i: 'lll', $o: 'lll'},
        ],
    });

    testGrammar({
        desc: '6b. Replace ε by a, optional: Cnt_i:1_2:5 ε -> a (vocab $i:ah)',
        grammar: Count({$i:1, $o:5},
        			 WithVocab({$i:'ah'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        results: [
            // Insertions
            {$o: 'a'},
            {$i: 'a', $o: 'aa'},    
            {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},    
            {$i: 'a', $o: 'aaa'},
            {$i: 'h', $o: 'aha'},
            // Copy-through: 0 insertions (because optional is set)
            {},             // equivalent to {$i: '', $o: ''}
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
        ],
    });

    testGrammar({
        desc: '6c. Replace ε by a, optional: Cnt_i:2_o:4 ε -> a (vocab $i:ah)',
        grammar: Count({$i:2, $o:4},
        			 WithVocab({$i:'ah'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        results: [
            // Insertions
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            //{$o: 'aa'},     // equivalent to {$i: '', $o: 'aa'}
            //{$o: 'aaa'},    // equivalent to {$i: '', $o: 'aaa'}
            //{$o: 'aaaa'},   // equivalent to {$i: '', $o: 'aaaa'}
            {$i: 'a', $o: 'aa'},    {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},    {$i: 'a', $o: 'aaa'},
            //{$i: 'h', $o: 'aah'},   
            {$i: 'h', $o: 'aha'},
            //{$i: 'h', $o: 'haa'},   {$i: 'a', $o: 'aaaa'},
            //{$i: 'h', $o: 'aaah'},  {$i: 'h', $o: 'aaha'},
            //{$i: 'h', $o: 'ahaa'},  {$i: 'h', $o: 'haaa'},
            {$i: 'aa', $o: 'aaa'},  {$i: 'ah', $o: 'aah'},
            {$i: 'ah', $o: 'aha'},  {$i: 'ha', $o: 'aha'},
            {$i: 'ha', $o: 'haa'},  {$i: 'hh', $o: 'ahh'},
            {$i: 'hh', $o: 'hah'},  {$i: 'hh', $o: 'hha'},
            {$i: 'aa', $o: 'aaaa'}, {$i: 'ah', $o: 'aaah'},
            {$i: 'ah', $o: 'aaha'}, //{$i: 'ah', $o: 'ahaa'},
            //{$i: 'ha', $o: 'aaha'}, 
            {$i: 'ha', $o: 'ahaa'},
            {$i: 'ha', $o: 'haaa'}, //{$i: 'hh', $o: 'aahh'},
            {$i: 'hh', $o: 'ahah'}, {$i: 'hh', $o: 'ahha'},
            //$i: 'hh', $o: 'haah'}, 
            {$i: 'hh', $o: 'haha'},
            //{$i: 'hh', $o: 'hhaa'},
            // Copy-through: 0 insertions
            {},              // equivalent to {$i: '', $o: ''}
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
            {$i: 'aa', $o: 'aa'},   {$i: 'ah', $o: 'ah'},
            {$i: 'ha', $o: 'ha'},   {$i: 'hh', $o: 'hh'},
        ],
    });

    testGrammar({
        desc: '7a. Replace ε|h by a, optional: Cnt_i:2_o:3 ε|h -> a (vocab $i:ahl)',
        grammar: Count({$i:2, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 OptionalReplace(Uni("", "h"), "a",
                                         EMPTY_CONTEXT, EMPTY_CONTEXT))),
        results: [
            // 1-2 Insertions, 0 Replacements
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$i: "a", $o: "aa"},   {$i: "h", $o: "ah"},
            {$i: "h", $o: "ha"},   {$i: "l", $o: "al"},
            {$i: "l", $o: "la"},   {$i: "a", $o: "aaa"},
            {$i: "h", $o: "aha"},
            {$i: "l", $o: "ala"}, 
            {$i: "aa", $o: "aaa"}, {$i: "ah", $o: "aah"},
            {$i: "ah", $o: "aha"}, {$i: "al", $o: "aal"},
            {$i: "al", $o: "ala"}, {$i: "ha", $o: "aha"},
            {$i: "ha", $o: "haa"}, {$i: "hh", $o: "ahh"},
            {$i: "hh", $o: "hah"}, {$i: "hh", $o: "hha"},
            {$i: "hl", $o: "ahl"}, {$i: "hl", $o: "hal"},
            {$i: "hl", $o: "hla"}, {$i: "la", $o: "ala"},
            {$i: "la", $o: "laa"}, {$i: "lh", $o: "alh"},
            {$i: "lh", $o: "lah"}, {$i: "lh", $o: "lha"},
            {$i: "ll", $o: "all"}, {$i: "ll", $o: "lal"},
            {$i: "ll", $o: "lla"},
            // 1-2 Replacements, 0 Insertions
            {$i: "h", $o: "a"},    {$i: "ah", $o: "aa"},
            {$i: "ha", $o: "aa"},  {$i: "hh", $o: "ah"},
            {$i: "hh", $o: "ha"},  {$i: "hh", $o: "aa"},
            {$i: "hl", $o: "al"},  {$i: "lh", $o: "la"},
            // Copy-through: 0 insertions, 0 replacements
            {},             // equivalent to {$i: '', $o: ''}
            {$i: "a", $o: "a"},    {$i: "h", $o: "h"},
            {$i: "l", $o: "l"},    {$i: "aa", $o: "aa"},
            {$i: "ah", $o: "ah"},  {$i: "al", $o: "al"},
            {$i: "ha", $o: "ha"},  {$i: "hh", $o: "hh"},
            {$i: "hl", $o: "hl"},  {$i: "la", $o: "la"},
            {$i: "lh", $o: "lh"},  {$i: "ll", $o: "ll"},
            // 1-2 Insertions, 1-2 Replacements
            {$i: "h", $o: "aa"}, {$i: "h", $o: "aaa"},
            {$i: "ah", $o: "aaa"}, {$i: "ha", $o: "aaa"},
            {$i: "hh", $o: "aaa"}, {$i: "hh", $o: "aah"},
            {$i: "hh", $o: "aha"}, {$i: "hh", $o: "haa"},
            {$i: "hl", $o: "aal"}, {$i: "hl", $o: "ala"},
            {$i: "lh", $o: "ala"}, {$i: "lh", $o: "laa"},
        ],
        allowDuplicateOutputs: false,
    });

    testGrammar({
        desc: '7b. Replace ε|h by a, optional: Cnt_i:3_o:4 ε|h -> a (vocab $i:ah)',
        grammar: Count({$i:3, $o:4},
        			 WithVocab({$i:'ah'},
                         OptionalReplace(Uni("", "h"), "a",
                                         EMPTY_CONTEXT, EMPTY_CONTEXT))),
        vocab: {$i: [..."ah"], $o: [..."ah"]},
        results: [
            // 1-2 Insertions, 0 Replacements
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$i: "a", $o: "aa"},     {$i: "h", $o: "ah"},
            {$i: "h", $o: "ha"},     {$i: "a", $o: "aaa"},
            {$i: "h", $o: "aha"},
            {$i: "aa", $o: "aaa"},   {$i: "ah", $o: "aah"},
            {$i: "ah", $o: "aha"},   {$i: "ha", $o: "aha"},
            {$i: "ha", $o: "haa"},   {$i: "hh", $o: "ahh"},
            {$i: "hh", $o: "hah"},   {$i: "hh", $o: "hha"},
            {$i: "aa", $o: "aaaa"},  {$i: "ah", $o: "aaah"},
            {$i: "ah", $o: "aaha"}, 
            {$i: "ha", $o: "ahaa"},
            {$i: "ha", $o: "haaa"},  
            {$i: "hh", $o: "ahah"},  {$i: "hh", $o: "ahha"},
            {$i: "hh", $o: "haha"},
            {$i: "aaa", $o: "aaaa"},
            {$i: "aah", $o: "aaah"}, {$i: "aah", $o: "aaha"},
            {$i: "aha", $o: "aaha"}, {$i: "aha", $o: "ahaa"},
            {$i: "ahh", $o: "aahh"}, {$i: "ahh", $o: "ahah"},
            {$i: "ahh", $o: "ahha"}, {$i: "haa", $o: "ahaa"},
            {$i: "haa", $o: "haaa"}, {$i: "hah", $o: "ahah"},
            {$i: "hah", $o: "haah"}, {$i: "hah", $o: "haha"},
            {$i: "hha", $o: "ahha"}, {$i: "hha", $o: "haha"},
            {$i: "hha", $o: "hhaa"}, {$i: "hhh", $o: "ahhh"},
            {$i: "hhh", $o: "hahh"}, {$i: "hhh", $o: "hhah"},
            {$i: "hhh", $o: "hhha"},
            // 1-3 Replacements, 0 Insertions
            {$i: "h", $o: "a"},      {$i: "ah", $o: "aa"},
            {$i: "ha", $o: "aa"},    {$i: "hh", $o: "aa"},
            {$i: "hh", $o: "ah"},    {$i: "hh", $o: "ha"},
            {$i: "aah", $o: "aaa"},  {$i: "aha", $o: "aaa"},
            {$i: "ahh", $o: "aaa"},  {$i: "ahh", $o: "aah"},
            {$i: "ahh", $o: "aha"},  {$i: "haa", $o: "aaa"},
            {$i: "hah", $o: "aaa"},  {$i: "hah", $o: "aah"},
            {$i: "hah", $o: "haa"},  {$i: "hha", $o: "aaa"},
            {$i: "hha", $o: "aha"},  {$i: "hha", $o: "haa"},
            {$i: "hhh", $o: "aaa"},  {$i: "hhh", $o: "aah"},
            {$i: "hhh", $o: "aha"},  {$i: "hhh", $o: "ahh"},
            {$i: "hhh", $o: "haa"},  {$i: "hhh", $o: "hah"},
            {$i: "hhh", $o: "hha"},
            // Copy-through: 0 insertions, 0 replacements
            {},             // equivalent to {$i: '', $o: ''}
            {$i: "a", $o: "a"},      {$i: "h", $o: "h"},
            {$i: "aa", $o: "aa"},    {$i: "ah", $o: "ah"},
            {$i: "ha", $o: "ha"},    {$i: "hh", $o: "hh"},
            {$i: "aaa", $o: "aaa"},  {$i: "aah", $o: "aah"},
            {$i: "aha", $o: "aha"},  {$i: "ahh", $o: "ahh"},
            {$i: "haa", $o: "haa"},  {$i: "hah", $o: "hah"},
            {$i: "hha", $o: "hha"},  {$i: "hhh", $o: "hhh"},
            // 1-3 Insertions, 1-3 Replacements
            {$i: "h", $o: "aa"},     {$i: "h", $o: "aaa"},
            {$i: "ah", $o: "aaa"},
            {$i: "ha", $o: "aaa"},   {$i: "hh", $o: "aaa"},
            {$i: "hh", $o: "aah"},   {$i: "hh", $o: "aha"},
            {$i: "hh", $o: "haa"},   {$i: "ah", $o: "aaaa"},
            {$i: "ha", $o: "aaaa"},  {$i: "hh", $o: "aaaa"},
            {$i: "hh", $o: "aaah"},  
            {$i: "hh", $o: "aaha"},
            {$i: "hh", $o: "ahaa"},  {$i: "hh", $o: "haaa"},
            {$i: "aah", $o: "aaaa"}, {$i: "aha", $o: "aaaa"},
            {$i: "ahh", $o: "aaaa"}, {$i: "ahh", $o: "aaah"},
            {$i: "ahh", $o: "aaha"}, {$i: "ahh", $o: "ahaa"},
            {$i: "haa", $o: "aaaa"}, {$i: "hah", $o: "aaaa"},
            {$i: "hah", $o: "aaah"}, {$i: "hah", $o: "aaha"},
            {$i: "hah", $o: "ahaa"}, {$i: "hah", $o: "haaa"},
            {$i: "hha", $o: "aaaa"}, {$i: "hha", $o: "aaha"},
            {$i: "hha", $o: "ahaa"}, {$i: "hha", $o: "haaa"},
            {$i: "hhh", $o: "aaaa"}, {$i: "hhh", $o: "aaah"},
            {$i: "hhh", $o: "aaha"}, {$i: "hhh", $o: "aahh"},
            {$i: "hhh", $o: "ahaa"}, {$i: "hhh", $o: "ahah"},
            {$i: "hhh", $o: "ahha"}, {$i: "hhh", $o: "haaa"},
            {$i: "hhh", $o: "haah"}, {$i: "hhh", $o: "haha"},
            {$i: "hhh", $o: "hhaa"},
        ],
    });

    testGrammar({
        desc: '8a. Replace a by ε: Cnt_o:2 a -> ε || #_ (vocab $i:ahl)',
        grammar: Count({$o:2},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            // Deletions
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            {$i: 'aa', $o: 'a'},    {$i: 'ah', $o: 'h'},
            {$i: 'al', $o: 'l'},    {$i: 'aaa', $o: 'aa'},
            {$i: 'aah', $o: 'ah'},  {$i: 'aal', $o: 'al'},
            {$i: 'aha', $o: 'ha'},  {$i: 'ahh', $o: 'hh'},
            {$i: 'ahl', $o: 'hl'},  {$i: 'ala', $o: 'la'},
            {$i: 'alh', $o: 'lh'},  {$i: 'all', $o: 'll'},
            // Copy-through
            {},         // equivalent to {$i: '', $o: ''}
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'ha', $o: 'ha'},   {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'la', $o: 'la'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '8b. Replace a by ε: Cnt_o:2 a -> ε || _# (vocab $i:ahl)',
        grammar: Count({$o:2},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            // Deletions
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            {$i: 'aa', $o: 'a'},    {$i: 'ha', $o: 'h'},
            {$i: 'la', $o: 'l'},    {$i: 'aaa', $o: 'aa'},
            {$i: 'aha', $o: 'ah'},  {$i: 'ala', $o: 'al'},
            {$i: 'haa', $o: 'ha'},  {$i: 'hha', $o: 'hh'},
            {$i: 'hla', $o: 'hl'},  {$i: 'laa', $o: 'la'},
            {$i: 'lha', $o: 'lh'},  {$i: 'lla', $o: 'll'},
            // Copy-through
            {},         // equivalent to {$i: '', $o: ''}
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'ah', $o: 'ah'},   {$i: 'al', $o: 'al'},
            {$i: 'hh', $o: 'hh'},   {$i: 'hl', $o: 'hl'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '8c. Replace a by ε: Cnt_o:2 a -> ε || #_# (vocab $i:ahl)',
        grammar: Count({$o:2},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            // Deletions
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            // Copy-through
            {},         // equivalent to {$i: '', $o: ''}
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'aa', $o: 'aa'},   {$i: 'ah', $o: 'ah'},
            {$i: 'al', $o: 'al'},   {$i: 'ha', $o: 'ha'},
            {$i: 'hh', $o: 'hh'},   {$i: 'hl', $o: 'hl'},
            {$i: 'la', $o: 'la'},   {$i: 'lh', $o: 'lh'},
            {$i: 'll', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '8d. Replace a by ε: Cnt_3 a -> ε (vocab $i:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        vocab: {$i: [..."ahl"], $o: [..."ahl"]},
        results: [
            // Deletions
            {$i: 'a'},      // equivalent to {$i: 'a', $o: ''}
            {$i: 'aa'},     // equivalent to {$i: 'aa', $o: ''}
            {$i: 'aaa'},    // equivalent to {$i: 'aaa', $o: ''}
            {$i: 'ah', $o: 'h'},    {$i: 'al', $o: 'l'},
            {$i: 'ha', $o: 'h'},    {$i: 'la', $o: 'l'},
            {$i: 'aah', $o: 'h'},   {$i: 'aal', $o: 'l'},
            {$i: 'aha', $o: 'h'},   {$i: 'ala', $o: 'l'},
            {$i: 'haa', $o: 'h'},   {$i: 'laa', $o: 'l'},
            {$i: 'ahh', $o: 'hh'},  {$i: 'ahl', $o: 'hl'},
            {$i: 'alh', $o: 'lh'},  {$i: 'all', $o: 'll'},
            {$i: 'hah', $o: 'hh'},  {$i: 'hal', $o: 'hl'},
            {$i: 'hha', $o: 'hh'},  {$i: 'hla', $o: 'hl'},
            {$i: 'lah', $o: 'lh'},  {$i: 'lal', $o: 'll'},
            {$i: 'lha', $o: 'lh'},  {$i: 'lla', $o: 'll'},
            // Copy-through
            {},         // equivalent to {$i: '', $o: ''}
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'hh', $o: 'hh'},   {$i: 'hl', $o: 'hl'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hlh', $o: 'hlh'}, {$i: 'hll', $o: 'hll'},
            {$i: 'lhh', $o: 'lhh'}, {$i: 'lhl', $o: 'lhl'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    // These are versions of the 1x tests, except that instead of joining with
    // the input strings, we're joining with BOTH input and output strings.
    // (Otherwise possible bugs related to fumbling epsilon-token returns won't
    // show up.)
    
    testGrammarIO({
		desc: '9a. Replace ε -> X in "abc"', 
        grammar: Join(Seq(I("abc"), O("XaXbXcX")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['abc', 'XaXbXcX']
        ],
        priority: ["$i", "$o"],
    });

    testGrammarIO({
		desc: '9b. Replace ε -> X in "abc", beginsWith',
        grammar: Join(Seq(I("abc"), O("Xabc")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['abc', 'Xabc']
        ],
        priority: ["$i", "$o"],
    });

    testGrammarIO({
		desc: '9c. Replace ε -> X in "abc", endsWith',
        grammar: Join(Seq(I("abc"), O("abcX")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['abc', 'abcX']
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammarIO({
		desc: '9d. Replace ε -> X in "abc", beginsWith endsWith',
        grammar: Join(Seq(I("abc"), O("abc")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['abc', 'abc']
        ],
        priority: ["$i", "$o"],
    });

    /*
    testGrammarIO({
		desc: '9a-OI. Replace ε -> X in "abc"',
        grammar: Join(Seq(I("abc"), O("XaXbXcX")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, false)),
        io: [
            ['abc', 'XaXbXcX']
        ],
        priority: ["$o", "$i"],
    });

    testGrammarIO({
		desc: '9b-OI. Replace ε -> X in "abc", beginsWith',
        grammar: Join(Seq(I("abc"), O("Xabc")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, false)),
        io: [
            ['abc', 'Xabc']
        ],
        priority: ["$o", "$i"],
    });

    testGrammarIO({
		desc: '9c-OI. Replace ε -> X in "abc", endsWith',
        grammar: Join(Seq(I("abc"), O("abcX")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, false, true)),
        io: [
            ['abc', 'abcX']
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammarIO({
		desc: '9d-OI. Replace ε -> X in "abc", beginsWith endsWith',
        grammar: Join(Seq(I("abc"), O("abc")), 
                      Replace("", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, true, true)),
        io: [
            ['abc', 'abc']
        ],
        priority: ["$o", "$i"],
    });
    */

});
