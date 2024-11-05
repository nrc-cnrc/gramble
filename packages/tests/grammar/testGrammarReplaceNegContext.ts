import {
    BoundingSet, Dot, Epsilon, Join, Lit,
    Not, Replace, Seq, Uni,
} from "../../interpreter/src/grammarConvenience.js";

import { Grammar } from "../../interpreter/src/grammars.js";

import { INPUT_TAPE, OUTPUT_TAPE } from "../../interpreter/src/utils/constants.js";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging.js";

import {
    grammarTestSuiteName,
    testGrammarIO,
} from "./testGrammarUtil.js";

import { 
    logTestSuite, VERBOSE_TEST_L2,
} from '../testUtil.js';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const EMPTY_CONTEXT = Epsilon();

const I = (s: string) => Lit(INPUT_TAPE, s);
const O = (s: string) => Lit(OUTPUT_TAPE, s);
// I(.s|s)
const OPTDOTI = (s: string) => Uni(I(s), Seq(Dot(INPUT_TAPE),I(s)));

// ^(c1|c2|...) === . & ~(c1|c2|...)
function NotChar(tape: string, ...text: string[]): Grammar {
    if (text.length == 1) {
        return Join(Dot(tape), Not(Lit(tape, text[0])));
    } else {
        return Join(Dot(tape), Not(Uni(...text.map(c => Lit(tape, c))))); 
    }
}

const NOTCHARI = (...text: string[]) => NotChar(INPUT_TAPE, ...text);

// maxChars defined on INPUT_TAPE
const MAXCH = (n: number) => ({[INPUT_TAPE]: n});

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    // Notes:
    //  # denotes a word boundary, i.e. starts with or ends with
    //  Replace requires input and output vocabs to be identical.

    // For "i -> a || (~h)_", ~h matches a|i|ε.
    testGrammarIO({
        desc: '1a. Replace i by a in #(~h)i#: maxC_i:2(BS) i -> a || #(~h)_#',
        grammar: Replace("i", "a", Not(I("h")), EMPTY_CONTEXT, true, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(2),
        io: [
            // Replacement
            ['i', 'a'],   ['ai', 'aa'], ['ii', 'ia'],
            // Copy through only
            ['hi', 'hi'], ['ia', 'ia'], ['ih', 'ih'],
        ],
    });

    testGrammarIO({
        desc: '1b. Replace i by a in #(~h)i: maxC_i:2(BS) i -> a || #(~h)_',
        grammar: Replace("i", "a", Not(I("h")), EMPTY_CONTEXT, true, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(2),
        io: [
            // Replacement
            ['i', 'a'],   ['ai', 'aa'], ['ia', 'aa'], ['ih', 'ah'],
            ['ii', 'ai'], ['ii', 'ia'],
            // Copy through only
            ['hi', 'hi'],
        ],
    });

    testGrammarIO({
        desc: '1c. Replace i by a in (~h)i#: maxC_i:2(BS) i -> a || (~h)_#',
        grammar: Replace("i", "a", Not(I("h")), EMPTY_CONTEXT, false, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(2),
        io: [
            // Replacement
            ['i', 'a'],   ['ai', 'aa'], ['hi', 'ha'], ['ii', 'ia'],
            // Copy through only
            ['ia', 'ia'], ['ih', 'ih'],
        ],
    });

    // Since ~h matches ε, "i -> a || (~h)_" behaves like "i -> a || _".
    testGrammarIO({
        desc: '1d. Replace i by a in (~h)i: maxC_i:2(BS) i -> a || (~h)_',
        grammar: Replace("i", "a", Not(I("h")), EMPTY_CONTEXT, false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(2),
        io: [
            // Replacement
            ['i', 'a'],   ['ai', 'aa'], ['hi', 'ha'], ['ia', 'aa'],
            ['ih', 'ah'], ['ii', 'aa'], ['ii', 'ia'],
        ],
    });

    // For "i -> a || (~h)_ll", ~h matches a|i|l|ε
    testGrammarIO({
        desc: '2a. Replace i by a in #(~h)ill#: maxC_i:4(BS) i -> a || #(~h)_ll#',
        grammar: Replace("i", "a", Not(I("h")), "ll", true, true),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['ill', 'all'],
            ['aill', 'aall'], ['iill', 'iall'], ['lill', 'lall'],
            // Copy through only
            ['hill', 'hill'], ['illa', 'illa'], ['illh', 'illh'], ['illi', 'illi'],
            ['illl', 'illl'],
        ],
    });

    testGrammarIO({
        desc: '2b. Replace i by a in #(~h)ill: maxC_i:4(BS) i -> a || #(~h)_ll',
        grammar: Replace("i", "a", Not(I("h")), "ll", true, false),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['ill', 'all'],
            ['aill', 'aall'], ['hill', 'hill'], ['iill', 'iall'], ['illa', 'alla'],
            ['illh', 'allh'], ['illi', 'alli'], ['illl', 'alll'], ['lill', 'lall'],
        ],
    });

    testGrammarIO({
        desc: '2c. Replace i by a in (~h)ill#: maxC_i:4(BS) i -> a || (~h)_ll#',
        grammar: Replace("i", "a", Not(I("h")), "ll", false, true),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['ill', 'all'],
            ['aill', 'aall'], ['hill', 'hall'], ['iill', 'iall'], ['lill', 'lall'],
            // Copy through only
            ['illa', 'illa'], ['illh', 'illh'], ['illi', 'illi'], ['illl', 'illl'],
        ],
    });

    // Since ~h matches ε, "i -> a || (~h)_ll" behaves like "i -> a || _ll".
    testGrammarIO({
        desc: '2d. Replace i by a in (~h)ill: maxC_i:4(BS) i -> a || (~h)_ll',
        grammar: Replace("i", "a", Not(I("h")), "ll", false, false),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['ill', 'all'],
            ['aill', 'aall'], ['hill', 'hall'], ['iill', 'iall'], ['illa', 'alla'],
            ['illh', 'allh'], ['illi', 'alli'], ['illl', 'alll'], ['lill', 'lall'],
        ],
    });

    // For "i -> a || h_(~l)", ~l matches a|h|i|ε.
    testGrammarIO({
        desc: '3a. Replace i by a in #hi(~l)#: maxC_i:3(BS) i -> a || #h_(~l)#',
        grammar: Replace("i", "a", "h", Not(I("l")), true, true),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['hi', 'ha'],
            ['hia', 'haa'], ['hih', 'hah'], ['hii', 'hai'],
            // Copy through only
            ['ahi', 'ahi'], ['hhi', 'hhi'], ['hil', 'hil'], ['ihi', 'ihi'],
            ['lhi', 'lhi'],
        ],
    });

    testGrammarIO({
        desc: '3b. Replace i by a in #hi(~l): maxC_i:3(BS) i -> a || #h_(~l)',
        grammar: Replace("i", "a", "h", Not(I("l")), true, false),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['hi', 'ha'],
            ['hia', 'haa'], ['hih', 'hah'], ['hii', 'hai'], ['hil', 'hal'],
            // Copy through only
            ['ahi', 'ahi'], ['hhi', 'hhi'], ['ihi', 'ihi'], ['lhi', 'lhi'],
        ],
        allowDuplicateOutputs: true,
    });

    testGrammarIO({
        desc: '3c. Replace i by a in hi(~l)#: maxC_i:3(BS) i -> a || h_(~l)#',
        grammar: Replace("i", "a", "h", Not(I("l")), false, true),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['hi', 'ha'],
            ['ahi', 'aha'], ['hhi', 'hha'], ['hia', 'haa'], ['hih', 'hah'],
            ['hii', 'hai'], ['ihi', 'iha'], ['lhi', 'lha'],
            // Copy through only
            ['hil', 'hil'],
        ],
    });

    testGrammarIO({
        desc: '3d. Replace i by a in hi(~l): maxC_i:3(BS) i -> a || h_(~l)',
        grammar: Replace("i", "a", "h", Not(I("l")), false, false),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['hi', 'ha'],
            ['ahi', 'aha'], ['hhi', 'hha'], ['hia', 'haa'], ['hih', 'hah'],
            ['hii', 'hai'], ['hil', 'hal'], ['ihi', 'iha'], ['lhi', 'lha'],
        ],
        allowDuplicateOutputs: true,
    });

    // For "i -> a || h_(~l)l", ~l matches a|h|i|ε
    testGrammarIO({
        desc: '4a. Replace i by a in #hi(~l)l#: maxC_i:3(BS) i -> a || #h_(~l)l#',
        grammar: Replace("i", "a", "h", Seq(Not(I("l")), I("l")), true, true),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hil', 'hal'],
            ['hial', 'haal'], ['hihl', 'hahl'], ['hiil', 'hail'],
            // Copy through only
            ['hila', 'hila'], ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'],
            ['ahil', 'ahil'], ['hhil', 'hhil'], ['ihil', 'ihil'], ['lhil', 'lhil'],
        ],
    });

    testGrammarIO({
        desc: '4b. Replace i by a in #hi(~l)l: maxC_i:4(BS) i -> a || #h_(~l)l',
        grammar: Replace("i", "a", "h", Seq(Not(I("l")), I("l")), true, false),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hil', 'hal'],
            ['hial', 'haal'], ['hihl', 'hahl'], ['hiil', 'hail'], ['hila', 'hala'],
            ['hilh', 'halh'], ['hili', 'hali'], ['hill', 'hall'],
            // Copy through only
            ['ahil', 'ahil'], ['hhil', 'hhil'], ['ihil', 'ihil'], ['lhil', 'lhil'],
        ],
    });

    testGrammarIO({
        desc: '4c. Replace i by a in hi(~l)l#: maxC_i:4(BS) i -> a || h_(~l)l#',
        grammar: Replace("i", "a", "h", Seq(Not(I("l")), I("l")), false, true),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hil', 'hal'],
            ['ahil', 'ahal'], ['hhil', 'hhal'], ['hial', 'haal'], ['hihl', 'hahl'],
            ['hiil', 'hail'], ['ihil', 'ihal'], ['lhil', 'lhal'],
            // Copy through only
            ['hila', 'hila'], ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'],
        ],
    });

    testGrammarIO({
        desc: '4d. Replace i by a in hi(~l)l: maxC_i:4(BS) i -> a || h_(~l)l',
        grammar: Replace("i", "a", "h", Seq(Not(I("l")), I("l")), false, false),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hil', 'hal'],
            ['ahil', 'ahal'], ['hhil', 'hhal'], ['hial', 'haal'], ['hihl', 'hahl'],
            ['hiil', 'hail'], ['hila', 'hala'], ['hilh', 'halh'], ['hili', 'hali'],
            ['hill', 'hall'], ['ihil', 'ihal'], ['lhil', 'lhal'],
        ],
    });

    // ~h matches ε|a.*|i.*|l.*\h.+ and ~l matches ε|a.*|h.*|i.*|l.+
    // For "i -> a || #(~h)_(~l)#", #(~h)_(~l)# means doesn't start with "hi"
    // or end with "il" (and have only one i)
    testGrammarIO({
        desc: '5a. Replace i by a in #(~h)i(~l)#: maxC_i:3(BS) i -> a || #(~h)_(~l)#',
        grammar: Replace("i", "a", Not(I("h")), Not(I("l")), true, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['i', 'a'],     ['ai', 'aa'],   ['ia', 'aa'],   ['ih', 'ah'],
            ['ii', 'ai'],   ['ii', 'ia'],   ['li', 'la'],
            ['aai', 'aaa'], ['ahi', 'aha'], ['aia', 'aaa'], ['aih', 'aah'],
            ['aii', 'aai'], ['aii', 'aia'], ['ali', 'ala'], ['hai', 'haa'],
            ['hhi', 'hha'], ['hii', 'hia'], ['hli', 'hla'], ['iaa', 'aaa'],
            ['iah', 'aah'], ['iai', 'aai'], ['iai', 'iaa'], ['ial', 'aal'],
            ['iha', 'aha'], ['ihh', 'ahh'], ['ihi', 'ahi'], ['ihi', 'iha'],
            ['ihl', 'ahl'], ['iia', 'aia'], ['iia', 'iaa'], ['iih', 'aih'],
            ['iih', 'iah'], ['iii', 'aii'], ['iii', 'iai'], ['iii', 'iia'],
            ['iil', 'ail'], ['ila', 'ala'], ['ilh', 'alh'], ['ili', 'ali'],
            ['ili', 'ila'], ['ill', 'all'], ['lai', 'laa'], ['lhi', 'lha'],
            ['lia', 'laa'], ['lih', 'lah'], ['lii', 'lai'], ['lii', 'lia'],
            ['lli', 'lla'],
            // Copy through only
            ['hi', 'hi'],   ['il', 'il'],
            ['ail', 'ail'], ['hia', 'hia'], ['hih', 'hih'], ['hil', 'hil'],
            ['lil', 'lil'],
        ],
    });

    // For "i -> a || #(~h)_(~l)", #(~h)_(~l) means doesn't start with "hi"
    // (and have only one i). Here only one substitution can be done because
    // startsWith is true, but it can be any of the "i"s with the others becoming
    // part of the negative context match which can be multiple characters.
    testGrammarIO({
        desc: '5b. Replace i by a in #(~h)i(~l): maxC_i:3(BS) i -> a || #(~h)_(~l)',
        grammar: Replace("i", "a", Not(I("h")), Not(I("l")), true, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['i', 'a'],     ['ai', 'aa'],   ['ia', 'aa'],   ['ih', 'ah'],
            ['ii', 'ai'],   ['ii', 'ia'],   ['il', 'al'],   ['li', 'la'],
            ['aai', 'aaa'], ['ahi', 'aha'], ['aia', 'aaa'], ['aih', 'aah'],
            ['aii', 'aai'], ['aii', 'aia'], ['ail', 'aal'], ['ali', 'ala'],
            ['hai', 'haa'], ['hhi', 'hha'], ['hii', 'hia'], ['hli', 'hla'],
            ['iaa', 'aaa'], ['iah', 'aah'], ['iai', 'aai'], ['iai', 'iaa'],
            ['ial', 'aal'], ['iha', 'aha'], ['ihh', 'ahh'], ['ihi', 'ahi'],
            ['ihi', 'iha'], ['ihl', 'ahl'], ['iia', 'aia'], ['iia', 'iaa'],
            ['iih', 'aih'], ['iih', 'iah'], ['iii', 'aii'], ['iii', 'iai'],
            ['iii', 'iia'], ['iil', 'ail'], ['iil', 'ial'], ['ila', 'ala'],
            ['ilh', 'alh'], ['ili', 'ali'], ['ili', 'ila'], ['ill', 'all'],
            ['lai', 'laa'], ['lhi', 'lha'], ['lia', 'laa'], ['lih', 'lah'],
            ['lii', 'lai'], ['lii', 'lia'], ['lil', 'lal'], ['lli', 'lla'],
            // Copy through only
            ['hi', 'hi'],
            ['hia', 'hia'], ['hih', 'hih'], ['hil', 'hil'],
        ],
        allowDuplicateOutputs: true,
    });

    // For "i -> a || (~h)_(~l)#", (~h)_(~l)# means doesn't end with "il"
    // (and have only one i). Again only one substitution can be done because
    // endsWith is true, but it can be any of the "i"s with the others becoming
    // part of the negative context match which can be multiple characters.
    testGrammarIO({
        desc: '5c. Replace i by a in (~h)i(~l)#: maxC_i:3(BS) i -> a || (~h)_(~l)#',
        grammar: Replace("i", "a", Not(I("h")), Not(I("l")), false, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['i', 'a'],     ['ai', 'aa'],   ['hi', 'ha'],   ['ia', 'aa'],
            ['ih', 'ah'],   ['ii', 'ai'],   ['ii', 'ia'],   ['li', 'la'],
            ['aai', 'aaa'], ['ahi', 'aha'], ['aia', 'aaa'], ['aih', 'aah'],
            ['aii', 'aai'], ['aii', 'aia'], ['ali', 'ala'], ['hai', 'haa'],
            ['hhi', 'hha'], ['hia', 'haa'], ['hih', 'hah'], ['hii', 'hia'],
            ['hli', 'hla'], ['iaa', 'aaa'], ['iah', 'aah'], ['iai', 'aai'],
            ['iai', 'iaa'], ['ial', 'aal'], ['iha', 'aha'], ['ihh', 'ahh'],
            ['ihi', 'ahi'], ['ihi', 'iha'], ['ihl', 'ahl'], ['iia', 'aia'],
            ['iia', 'iaa'], ['iih', 'aih'], ['iih', 'iah'], ['iii', 'aii'],
            ['iii', 'iai'], ['iii', 'iia'], ['iil', 'ail'], ['ila', 'ala'],
            ['ilh', 'alh'], ['ili', 'ali'], ['ili', 'ila'], ['ill', 'all'],
            ['lai', 'laa'], ['lhi', 'lha'], ['lia', 'laa'], ['lih', 'lah'],
            ['lii', 'lai'], ['lii', 'lia'], ['lli', 'lla'],
            // Copy through only
            ['il', 'il'],
            ['ail', 'ail'], ['hil', 'hil'], ['lil', 'lil'],
        ],
    });

    // For "i -> a || (~h)_(~l)", it is like an empty context but contains results
    // with 1, 2, ... #i substitutions done, not just #i (i.e. all) substitutions.
    testGrammarIO({
        desc: '5d. Replace i by a in (~h)i(~l): maxC_i:3(BS) i -> a || (~h)_(~l)',
        grammar: Replace("i", "a", Not(I("h")), Not(I("l")), false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['i', 'a'],     ['ai', 'aa'],   ['hi', 'ha'],   ['ia', 'aa'],
            ['ih', 'ah'],   ['ii', 'aa'],   ['ii', 'ai'],   ['ii', 'ia'],
            ['il', 'al'],   ['li', 'la'],
            ['aai', 'aaa'], ['ahi', 'aha'], ['aia', 'aaa'], ['aih', 'aah'],
            ['aii', 'aaa'], ['aii', 'aai'], ['aii', 'aia'], ['ail', 'aal'],
            ['ali', 'ala'], ['hai', 'haa'], ['hhi', 'hha'], ['hia', 'haa'],
            ['hih', 'hah'], ['hii', 'hia'], ['hil', 'hal'], ['hli', 'hla'],
            ['iaa', 'aaa'], ['iah', 'aah'], ['iai', 'aaa'], ['iai', 'aai'],
            ['iai', 'iaa'], ['ial', 'aal'], ['iha', 'aha'], ['ihh', 'ahh'],
            ['ihi', 'aha'], ['ihi', 'ahi'], ['ihi', 'iha'], ['ihl', 'ahl'],
            ['iia', 'aaa'], ['iia', 'aia'], ['iia', 'iaa'], ['iih', 'aah'],
            ['iih', 'aih'], ['iih', 'iah'], ['iii', 'aaa'], ['iii', 'aai'],
            ['iii', 'aia'], ['iii', 'aii'], ['iii', 'iaa'], ['iii', 'iai'],
            ['iii', 'iia'], ['iil', 'aal'], ['iil', 'ail'], ['iil', 'ial'],
            ['ila', 'ala'], ['ilh', 'alh'], ['ili', 'ala'], ['ili', 'ali'],
            ['ili', 'ila'], ['ill', 'all'], ['lai', 'laa'], ['lhi', 'lha'],
            ['lia', 'laa'], ['lih', 'lah'], ['lii', 'laa'], ['lii', 'lai'],
            ['lii', 'lia'], ['lil', 'lal'], ['lli', 'lla'],
        ],
        allowDuplicateOutputs: true,
    });

    // Single character negation tests
    // Here, we us "^c" to denote ". & ~c" in the decription

    testGrammarIO({
        desc: '6a. Replace i by a in #(^h)i#: maxC_i:3(BS) i -> a || #(^h)_#',
        grammar: Replace("i", "a", NOTCHARI("h"), EMPTY_CONTEXT, true, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ai', 'aa'],   ['ii', 'ia'],
            // Copy through only
            ['i', 'i'],     ['hi', 'hi'],   ['ia', 'ia'],   ['ih', 'ih'],
            ['aai', 'aai'], ['ahi', 'ahi'], ['aia', 'aia'], ['aih', 'aih'],
            ['aii', 'aii'], ['hai', 'hai'], ['hhi', 'hhi'], ['hia', 'hia'],
            ['hih', 'hih'], ['hii', 'hii'], ['iaa', 'iaa'], ['iah', 'iah'],
            ['iai', 'iai'], ['iha', 'iha'], ['ihh', 'ihh'], ['ihi', 'ihi'],
            ['iia', 'iia'], ['iih', 'iih'], ['iii', 'iii'],
        ],
    });

    testGrammarIO({
        desc: '6b. Replace i by a in #(^h)i: maxC_i:3(BS) i -> a || #(^h)_',
        grammar: Replace("i", "a", NOTCHARI("h"), EMPTY_CONTEXT, true, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ai', 'aa'],   ['ii', 'ia'],
            ['aia', 'aaa'], ['aih', 'aah'], ['aii', 'aai'], ['iia', 'iaa'],
            ['iih', 'iah'], ['iii', 'iai'],
            // Copy through only
            ['i', 'i'],     ['hi', 'hi'],   ['ia', 'ia'],   ['ih', 'ih'],
            ['aai', 'aai'], ['ahi', 'ahi'], ['hai', 'hai'], ['hhi', 'hhi'],
            ['hia', 'hia'], ['hih', 'hih'], ['hii', 'hii'], ['iaa', 'iaa'],
            ['iah', 'iah'], ['iai', 'iai'], ['iha', 'iha'], ['ihh', 'ihh'],
            ['ihi', 'ihi'],
        ],
    });

    testGrammarIO({
        desc: '6c. Replace i by a in (^h)i#: maxC_i:3(BS) i -> a || (^h)_#',
        grammar: Replace("i", "a", NOTCHARI("h"), EMPTY_CONTEXT, false, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ai', 'aa'],   ['ii', 'ia'],
            ['aai', 'aaa'], ['aii', 'aia'], ['hai', 'haa'], ['hii', 'hia'],
            ['iai', 'iaa'], ['iii', 'iia'],
            // Copy through only
            ['i', 'i'],     ['ia', 'ia'],   ['hi', 'hi'],   ['ih', 'ih'],
            ['ahi', 'ahi'], ['aia', 'aia'], ['aih', 'aih'], ['hhi', 'hhi'],
            ['hia', 'hia'], ['hih', 'hih'], ['iaa', 'iaa'], ['iah', 'iah'],
            ['iha', 'iha'], ['ihh', 'ihh'], ['ihi', 'ihi'], ['iia', 'iia'],
            ['iih', 'iih'],
        ],
    });

    testGrammarIO({
        desc: '6d. Replace i by a in (^h)i: maxC_i:3(BS) i -> a || (^h)_',
        grammar: Replace("i", "a", NOTCHARI("h"), EMPTY_CONTEXT, false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ai', 'aa'],   ['ii', 'ia'],
            ['aai', 'aaa'], ['aia', 'aaa'], ['aih', 'aah'], ['aii', 'aai'],
            ['hai', 'haa'], ['hii', 'hia'], ['iai', 'iaa'], ['iia', 'iaa'],
            ['iih', 'iah'], ['iii', 'iai'],
            // Copy through only
            ['i', 'i'],     ['ia', 'ia'],   ['hi', 'hi'],   ['ih', 'ih'],
            ['ahi', 'ahi'], ['hhi', 'hhi'], ['hia', 'hia'], ['hih', 'hih'],
            ['iaa', 'iaa'], ['iah', 'iah'], ['iha', 'iha'], ['ihh', 'ihh'],
            ['ihi', 'ihi'],
        ],
    });

    testGrammarIO({
        desc: '7a. Replace i by a in #(^h)ill#: maxC_i:5(BS) i -> a || #(^h)_ll#',
        grammar: Replace("i", "a", NOTCHARI("h"), "ll", true, true),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['aill', 'aall'],   ['iill', 'iall'],   ['lill', 'lall'],
            // Copy through only
            ['ill', 'ill'],     ['hill', 'hill'],   ['illa', 'illa'],   ['illh', 'illh'],
            ['illi', 'illi'],   ['illl', 'illl'],
            ['aaill', 'aaill'], ['ahill', 'ahill'], ['aiill', 'aiill'], ['ailla', 'ailla'],
            ['aillh', 'aillh'], ['ailli', 'ailli'], ['ailll', 'ailll'], ['alill', 'alill'],
            ['haill', 'haill'], ['hhill', 'hhill'], ['hiill', 'hiill'], ['hilla', 'hilla'],
            ['hillh', 'hillh'], ['hilli', 'hilli'], ['hilll', 'hilll'], ['hlill', 'hlill'],
            ['iaill', 'iaill'], ['ihill', 'ihill'], ['iiill', 'iiill'], ['iilla', 'iilla'],
            ['iillh', 'iillh'], ['iilli', 'iilli'], ['iilll', 'iilll'], ['ilill', 'ilill'],
            ['illaa', 'illaa'], ['illah', 'illah'], ['illai', 'illai'], ['illal', 'illal'],
            ['illha', 'illha'], ['illhh', 'illhh'], ['illhi', 'illhi'], ['illhl', 'illhl'],
            ['illia', 'illia'], ['illih', 'illih'], ['illii', 'illii'], ['illil', 'illil'],
            ['illla', 'illla'], ['illlh', 'illlh'], ['illli', 'illli'], ['illll', 'illll'],
            ['laill', 'laill'], ['lhill', 'lhill'], ['liill', 'liill'], ['lilla', 'lilla'],
            ['lillh', 'lillh'], ['lilli', 'lilli'], ['lilll', 'lilll'], ['llill', 'llill'],
        ],
    });

    testGrammarIO({
        desc: '7b. Replace i by a in #(^h)ill: maxC_i:5(BS) i -> a || #(^h)_ll',
        grammar: Replace("i", "a", NOTCHARI("h"), "ll", true, false),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['aill', 'aall'],   ['iill', 'iall'], ['lill', 'lall'],
            ['ailla', 'aalla'], ['aillh', 'aallh'], ['ailli', 'aalli'], ['ailll', 'aalll'],
            ['iilla', 'ialla'], ['iillh', 'iallh'], ['iilli', 'ialli'], ['iilll', 'ialll'],
            ['lilla', 'lalla'], ['lillh', 'lallh'], ['lilli', 'lalli'], ['lilll', 'lalll'],
            // Copy through only
            ['ill', 'ill'],     ['hill', 'hill'],   ['illa', 'illa'],   ['illh', 'illh'],
            ['illi', 'illi'],   ['illl', 'illl'],
            ['aaill', 'aaill'], ['ahill', 'ahill'], ['aiill', 'aiill'], ['alill', 'alill'],
            ['haill', 'haill'], ['hhill', 'hhill'], ['hiill', 'hiill'], ['hilla', 'hilla'],
            ['hillh', 'hillh'], ['hilli', 'hilli'], ['hilll', 'hilll'], ['hlill', 'hlill'],
            ['iaill', 'iaill'], ['ihill', 'ihill'], ['iiill', 'iiill'], ['ilill', 'ilill'],
            ['illaa', 'illaa'], ['illah', 'illah'], ['illai', 'illai'], ['illal', 'illal'],
            ['illha', 'illha'], ['illhh', 'illhh'], ['illhi', 'illhi'], ['illhl', 'illhl'],
            ['illia', 'illia'], ['illih', 'illih'], ['illii', 'illii'], ['illil', 'illil'],
            ['illla', 'illla'], ['illlh', 'illlh'], ['illli', 'illli'], ['illll', 'illll'],
            ['laill', 'laill'], ['lhill', 'lhill'], ['liill', 'liill'], ['llill', 'llill'],
        ],
    });

    testGrammarIO({
        desc: '7c. Replace i by a in (^h)ill#: maxC_i:5(BS) i -> a || (^h)_ll#',
        grammar: Replace("i", "a", NOTCHARI("h"), "ll", false, true),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['aill', 'aall'],   ['iill', 'iall'],   ['lill', 'lall'],
            ['aaill', 'aaall'], ['aiill', 'aiall'], ['alill', 'alall'], ['haill', 'haall'],
            ['hiill', 'hiall'], ['hlill', 'hlall'], ['iaill', 'iaall'], ['iiill', 'iiall'],
            ['ilill', 'ilall'], ['laill', 'laall'], ['liill', 'liall'], ['llill', 'llall'],
            // Copy through only
            ['ill', 'ill'],     ['hill', 'hill'],   ['illa', 'illa'],   ['illh', 'illh'],
            ['illi', 'illi'],   ['illl', 'illl'],
            ['ahill', 'ahill'], ['ailla', 'ailla'], ['aillh', 'aillh'], ['ailli', 'ailli'],
            ['ailll', 'ailll'], ['hhill', 'hhill'], ['hilla', 'hilla'], ['hillh', 'hillh'],
            ['hilli', 'hilli'], ['hilll', 'hilll'], ['ihill', 'ihill'], ['iilla', 'iilla'],
            ['iillh', 'iillh'], ['iilli', 'iilli'], ['iilll', 'iilll'], ['illaa', 'illaa'],
            ['illah', 'illah'], ['illai', 'illai'], ['illal', 'illal'], ['illha', 'illha'],
            ['illhh', 'illhh'], ['illhi', 'illhi'], ['illhl', 'illhl'], ['illia', 'illia'],
            ['illih', 'illih'], ['illii', 'illii'], ['illil', 'illil'], ['illla', 'illla'],
            ['illlh', 'illlh'], ['illli', 'illli'], ['illll', 'illll'], ['lhill', 'lhill'],
            ['lilla', 'lilla'], ['lillh', 'lillh'], ['lilli', 'lilli'], ['lilll', 'lilll'],
        ],
    });

    testGrammarIO({
        desc: '7d. Replace i by a in (^h)ill: maxC_i:5(BS) i -> a || (^h)_ll',
        grammar: Replace("i", "a", NOTCHARI("h"), "ll", false, false),
        query: BoundingSet('ill', '', '', false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['aill', 'aall'],   ['iill', 'iall'],   ['lill', 'lall'],
            ['aaill', 'aaall'], ['aiill', 'aiall'], ['ailla', 'aalla'], ['aillh', 'aallh'],
            ['ailli', 'aalli'], ['ailll', 'aalll'], ['alill', 'alall'], ['haill', 'haall'],
            ['hiill', 'hiall'], ['hlill', 'hlall'], ['iaill', 'iaall'], ['iiill', 'iiall'],
            ['iilla', 'ialla'], ['iillh', 'iallh'], ['iilli', 'ialli'], ['iilll', 'ialll'],
            ['ilill', 'ilall'], ['laill', 'laall'], ['liill', 'liall'], ['lilla', 'lalla'],
            ['lillh', 'lallh'], ['lilli', 'lalli'], ['lilll', 'lalll'], ['llill', 'llall'],
            // Copy through only
            ['ill', 'ill'],     ['hill', 'hill'],   ['illa', 'illa'],   ['illh', 'illh'],
            ['illi', 'illi'],   ['illl', 'illl'],
            ['ahill', 'ahill'], ['hhill', 'hhill'], ['hilla', 'hilla'], ['hillh', 'hillh'],
            ['hilli', 'hilli'], ['hilll', 'hilll'], ['ihill', 'ihill'], ['illaa', 'illaa'],
            ['illah', 'illah'], ['illai', 'illai'], ['illal', 'illal'], ['illha', 'illha'],
            ['illhh', 'illhh'], ['illhi', 'illhi'], ['illhl', 'illhl'], ['illia', 'illia'],
            ['illih', 'illih'], ['illii', 'illii'], ['illil', 'illil'], ['illla', 'illla'],
            ['illlh', 'illlh'], ['illli', 'illli'], ['illll', 'illll'], ['lhill', 'lhill'],
    ],
    });

    testGrammarIO({
        desc: '8a. Replace i by a in #hi(^l)#: maxC_i:4(BS) i -> a || #h_(^l)#',
        grammar: Replace("i", "a", "h", NOTCHARI("l"), true, true),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hia', 'haa'],   ['hih', 'hah'],   ['hii', 'hai'],
            // Copy through only
            ['hi', 'hi'],     ['ahi', 'ahi'],   ['hhi', 'hhi'],   ['hil', 'hil'],
            ['ihi', 'ihi'],   ['lhi', 'lhi'],
            ['aahi', 'aahi'], ['ahhi', 'ahhi'], ['ahia', 'ahia'], ['ahih', 'ahih'],
            ['ahii', 'ahii'], ['ahil', 'ahil'], ['aihi', 'aihi'], ['alhi', 'alhi'],
            ['hahi', 'hahi'], ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'],
            ['hhii', 'hhii'], ['hhil', 'hhil'], ['hiaa', 'hiaa'], ['hiah', 'hiah'],
            ['hiai', 'hiai'], ['hial', 'hial'], ['hiha', 'hiha'], ['hihh', 'hihh'],
            ['hihi', 'hihi'], ['hihl', 'hihl'], ['hiia', 'hiia'], ['hiih', 'hiih'],
            ['hiii', 'hiii'], ['hiil', 'hiil'], ['hila', 'hila'], ['hilh', 'hilh'],
            ['hili', 'hili'], ['hill', 'hill'], ['hlhi', 'hlhi'], ['iahi', 'iahi'],
            ['ihhi', 'ihhi'], ['ihia', 'ihia'], ['ihih', 'ihih'], ['ihii', 'ihii'],
            ['ihil', 'ihil'], ['iihi', 'iihi'], ['ilhi', 'ilhi'], ['lahi', 'lahi'],
            ['lhhi', 'lhhi'], ['lhia', 'lhia'], ['lhih', 'lhih'], ['lhii', 'lhii'],
            ['lhil', 'lhil'], ['lihi', 'lihi'], ['llhi', 'llhi'],
        ],
    });

    testGrammarIO({
        desc: '8b. Replace i by a in #hi(^l): maxC_i:4(BS) i -> a || #h_(^l)',
        grammar: Replace("i", "a", "h", NOTCHARI("l"), true, false),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hia', 'haa'],   ['hih', 'hah'],   ['hii', 'hai'],
            ['hiaa', 'haaa'], ['hiah', 'haah'], ['hiai', 'haai'], ['hial', 'haal'],
            ['hiha', 'haha'], ['hihh', 'hahh'], ['hihi', 'hahi'], ['hihl', 'hahl'],
            ['hiia', 'haia'], ['hiih', 'haih'], ['hiii', 'haii'], ['hiil', 'hail'],
            // Copy through only
            ['hi', 'hi'],     ['ahi', 'ahi'],   ['hhi', 'hhi'],   ['hil', 'hil'],
            ['ihi', 'ihi'],   ['lhi', 'lhi'],
            ['aahi', 'aahi'], ['ahhi', 'ahhi'], ['ahia', 'ahia'], ['ahih', 'ahih'],
            ['ahii', 'ahii'], ['ahil', 'ahil'], ['aihi', 'aihi'], ['alhi', 'alhi'],
            ['hahi', 'hahi'], ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'],
            ['hhii', 'hhii'], ['hhil', 'hhil'], ['hila', 'hila'], ['hilh', 'hilh'],
            ['hili', 'hili'], ['hill', 'hill'], ['hlhi', 'hlhi'], ['iahi', 'iahi'],
            ['ihhi', 'ihhi'], ['ihia', 'ihia'], ['ihih', 'ihih'], ['ihii', 'ihii'],
            ['ihil', 'ihil'], ['iihi', 'iihi'], ['ilhi', 'ilhi'], ['lahi', 'lahi'],
            ['lhhi', 'lhhi'], ['lhia', 'lhia'], ['lhih', 'lhih'], ['lhii', 'lhii'],
            ['lhil', 'lhil'], ['lihi', 'lihi'], ['llhi', 'llhi'],
        ],
        allowDuplicateOutputs: true,
    });

    testGrammarIO({
        desc: '8c. Replace i by a in hi(^l)#: maxC_i:4(BS) i -> a || h_(^l)#',
        grammar: Replace("i", "a", "h", NOTCHARI("l"), false, true),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hia', 'haa'],   ['hih', 'hah'],   ['hii', 'hai'],
            ['ahia', 'ahaa'], ['ahih', 'ahah'], ['ahii', 'ahai'], ['hhia', 'hhaa'],
            ['hhih', 'hhah'], ['hhii', 'hhai'], ['ihia', 'ihaa'], ['ihih', 'ihah'],
            ['ihii', 'ihai'], ['lhia', 'lhaa'], ['lhih', 'lhah'], ['lhii', 'lhai'],
            // Copy through only
            ['hi', 'hi'],     ['ahi', 'ahi'],   ['hhi', 'hhi'],   ['hil', 'hil'],
            ['ihi', 'ihi'],   ['lhi', 'lhi'],
            ['aahi', 'aahi'], ['ahhi', 'ahhi'], ['ahil', 'ahil'], ['aihi', 'aihi'],
            ['alhi', 'alhi'], ['hahi', 'hahi'], ['hhhi', 'hhhi'], ['hhil', 'hhil'],
            ['hiaa', 'hiaa'], ['hiah', 'hiah'], ['hiai', 'hiai'], ['hial', 'hial'],
            ['hiha', 'hiha'], ['hihh', 'hihh'], ['hihi', 'hihi'], ['hihl', 'hihl'],
            ['hiia', 'hiia'], ['hiih', 'hiih'], ['hiii', 'hiii'], ['hiil', 'hiil'],
            ['hila', 'hila'], ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'],
            ['hlhi', 'hlhi'], ['iahi', 'iahi'], ['ihhi', 'ihhi'], ['ihil', 'ihil'],
            ['iihi', 'iihi'], ['ilhi', 'ilhi'], ['lahi', 'lahi'], ['lhhi', 'lhhi'],
            ['lhil', 'lhil'], ['lihi', 'lihi'], ['llhi', 'llhi'],
        ],
    });

    testGrammarIO({
        desc: '8d. Replace i by a in hi(^l): maxC_i:4(BS) i -> a || h_(^l)',
        grammar: Replace("i", "a", "h", NOTCHARI("l"), false, false),
        query: BoundingSet('hi', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['hia', 'haa'],   ['hih', 'hah'],   ['hii', 'hai'],
            ['ahia', 'ahaa'], ['ahih', 'ahah'], ['ahii', 'ahai'], ['hhia', 'hhaa'],
            ['hhih', 'hhah'], ['hhii', 'hhai'], ['hiaa', 'haaa'], ['hiah', 'haah'],
            ['hiai', 'haai'], ['hial', 'haal'], ['hiha', 'haha'], ['hihh', 'hahh'],
            ['hihi', 'hahi'], ['hihl', 'hahl'], ['hiia', 'haia'], ['hiih', 'haih'],
            ['hiii', 'haii'], ['hiil', 'hail'], ['ihia', 'ihaa'], ['ihih', 'ihah'],
            ['ihii', 'ihai'], ['lhia', 'lhaa'], ['lhih', 'lhah'], ['lhii', 'lhai'],
            // Copy through only
            ['hi', 'hi'],     ['ahi', 'ahi'],   ['hhi', 'hhi'],   ['hil', 'hil'],
            ['ihi', 'ihi'],   ['lhi', 'lhi'],
            ['aahi', 'aahi'], ['ahhi', 'ahhi'], ['ahil', 'ahil'], ['aihi', 'aihi'],
            ['alhi', 'alhi'], ['hahi', 'hahi'], ['hhhi', 'hhhi'], ['hhil', 'hhil'],
            ['hila', 'hila'], ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'],
            ['hlhi', 'hlhi'], ['iahi', 'iahi'], ['ihhi', 'ihhi'], ['ihil', 'ihil'],
            ['iihi', 'iihi'], ['ilhi', 'ilhi'], ['lahi', 'lahi'], ['lhhi', 'lhhi'],
            ['lhil', 'lhil'], ['lihi', 'lihi'], ['llhi', 'llhi'],
        ],
        allowDuplicateOutputs: true,
    });

    testGrammarIO({
        desc: '9a. Replace i by a in #hi(^l)l#: maxC_i:5(BS) i -> a || #h_(^l)l#',
        grammar: Replace("i", "a", "h", Seq(NOTCHARI("l"), I("l")), true, true),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['hial', 'haal'],   ['hihl', 'hahl'],   ['hiil', 'hail'],
            // Copy through only
            ['hil', 'hil'],
            ['ahil', 'ahil'],   ['hhil', 'hhil'],   ['hila', 'hila'],   ['hilh', 'hilh'],
            ['hili', 'hili'],   ['hill', 'hill'],   ['ihil', 'ihil'],   ['lhil', 'lhil'],
            ['aahil', 'aahil'], ['ahhil', 'ahhil'], ['ahial', 'ahial'], ['ahihl', 'ahihl'],
            ['ahiil', 'ahiil'], ['ahila', 'ahila'], ['ahilh', 'ahilh'], ['ahili', 'ahili'],
            ['ahill', 'ahill'], ['aihil', 'aihil'], ['alhil', 'alhil'], ['hahil', 'hahil'],
            ['hhhil', 'hhhil'], ['hhial', 'hhial'], ['hhihl', 'hhihl'], ['hhiil', 'hhiil'],
            ['hhila', 'hhila'], ['hhilh', 'hhilh'], ['hhili', 'hhili'], ['hhill', 'hhill'],
            ['hiala', 'hiala'], ['hialh', 'hialh'], ['hiali', 'hiali'], ['hiall', 'hiall'],
            ['hihil', 'hihil'], ['hihla', 'hihla'], ['hihlh', 'hihlh'], ['hihli', 'hihli'],
            ['hihll', 'hihll'], ['hiila', 'hiila'], ['hiilh', 'hiilh'], ['hiili', 'hiili'],
            ['hiill', 'hiill'], ['hilaa', 'hilaa'], ['hilah', 'hilah'], ['hilai', 'hilai'],
            ['hilal', 'hilal'], ['hilha', 'hilha'], ['hilhh', 'hilhh'], ['hilhi', 'hilhi'],
            ['hilhl', 'hilhl'], ['hilia', 'hilia'], ['hilih', 'hilih'], ['hilii', 'hilii'],
            ['hilil', 'hilil'], ['hilla', 'hilla'], ['hillh', 'hillh'], ['hilli', 'hilli'],
            ['hilll', 'hilll'], ['hlhil', 'hlhil'], ['iahil', 'iahil'], ['ihhil', 'ihhil'],
            ['ihial', 'ihial'], ['ihihl', 'ihihl'], ['ihiil', 'ihiil'], ['ihila', 'ihila'],
            ['ihilh', 'ihilh'], ['ihili', 'ihili'], ['ihill', 'ihill'], ['iihil', 'iihil'],
            ['ilhil', 'ilhil'], ['lahil', 'lahil'], ['lhhil', 'lhhil'], ['lhial', 'lhial'],
            ['lhihl', 'lhihl'], ['lhiil', 'lhiil'], ['lhila', 'lhila'], ['lhilh', 'lhilh'],
            ['lhili', 'lhili'], ['lhill', 'lhill'], ['lihil', 'lihil'], ['llhil', 'llhil'],
        ],
    });

    testGrammarIO({
        desc: '9b. Replace i by a in #hi(^l)l: maxC_i:5(BS) i -> a || #h_(^l)l',
        grammar: Replace("i", "a", "h", Seq(NOTCHARI("l"), I("l")), true, false),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['hial', 'haal'],   ['hihl', 'hahl'],   ['hiil', 'hail'],
            ['hiala', 'haala'], ['hialh', 'haalh'], ['hiali', 'haali'], ['hiall', 'haall'],
            ['hihla', 'hahla'], ['hihlh', 'hahlh'], ['hihli', 'hahli'], ['hihll', 'hahll'],
            ['hiila', 'haila'], ['hiilh', 'hailh'], ['hiili', 'haili'], ['hiill', 'haill'],
            // Copy through only
            ['hil', 'hil'],
            ['ahil', 'ahil'],   ['hhil', 'hhil'],   ['hila', 'hila'],   ['hilh', 'hilh'],
            ['hili', 'hili'],   ['hill', 'hill'],   ['ihil', 'ihil'],   ['lhil', 'lhil'],
            ['aahil', 'aahil'], ['ahhil', 'ahhil'], ['ahial', 'ahial'], ['ahihl', 'ahihl'],
            ['ahiil', 'ahiil'], ['ahila', 'ahila'], ['ahilh', 'ahilh'], ['ahili', 'ahili'],
            ['ahill', 'ahill'], ['aihil', 'aihil'], ['alhil', 'alhil'], ['hahil', 'hahil'],
            ['hhhil', 'hhhil'], ['hhial', 'hhial'], ['hhihl', 'hhihl'], ['hhiil', 'hhiil'],
            ['hhila', 'hhila'], ['hhilh', 'hhilh'], ['hhili', 'hhili'], ['hhill', 'hhill'],
            ['hihil', 'hihil'], ['hilaa', 'hilaa'], ['hilah', 'hilah'], ['hilai', 'hilai'],
            ['hilal', 'hilal'], ['hilha', 'hilha'], ['hilhh', 'hilhh'], ['hilhi', 'hilhi'],
            ['hilhl', 'hilhl'], ['hilia', 'hilia'], ['hilih', 'hilih'], ['hilii', 'hilii'],
            ['hilil', 'hilil'], ['hilla', 'hilla'], ['hillh', 'hillh'], ['hilli', 'hilli'],
            ['hilll', 'hilll'], ['hlhil', 'hlhil'], ['iahil', 'iahil'], ['ihhil', 'ihhil'],
            ['ihial', 'ihial'], ['ihihl', 'ihihl'], ['ihiil', 'ihiil'], ['ihila', 'ihila'],
            ['ihilh', 'ihilh'], ['ihili', 'ihili'], ['ihill', 'ihill'], ['iihil', 'iihil'],
            ['ilhil', 'ilhil'], ['lahil', 'lahil'], ['lhhil', 'lhhil'], ['lhial', 'lhial'],
            ['lhihl', 'lhihl'], ['lhiil', 'lhiil'], ['lhila', 'lhila'], ['lhilh', 'lhilh'],
            ['lhili', 'lhili'], ['lhill', 'lhill'], ['lihil', 'lihil'], ['llhil', 'llhil'],
        ],
    });

    testGrammarIO({
        desc: '9c. Replace i by a in hi(^l)l#: maxC_i:5(BS) i -> a || h_(^l)l#',
        grammar: Replace("i", "a", "h", Seq(NOTCHARI("l"), I("l")), false, true),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['hial', 'haal'],   ['hihl', 'hahl'],   ['hiil', 'hail'],
            ['ahial', 'ahaal'], ['ahihl', 'ahahl'], ['ahiil', 'ahail'], ['hhial', 'hhaal'],
            ['hhihl', 'hhahl'], ['hhiil', 'hhail'], ['ihial', 'ihaal'], ['ihihl', 'ihahl'],
            ['ihiil', 'ihail'], ['lhial', 'lhaal'], ['lhihl', 'lhahl'], ['lhiil', 'lhail'],
            // Copy through only
            ['hil', 'hil'],
            ['ahil', 'ahil'],   ['hhil', 'hhil'],   ['hila', 'hila'],   ['hilh', 'hilh'],
            ['hili', 'hili'],   ['hill', 'hill'],   ['ihil', 'ihil'],   ['lhil', 'lhil'],
            ['aahil', 'aahil'], ['ahhil', 'ahhil'], ['ahila', 'ahila'], ['ahilh', 'ahilh'],
            ['ahili', 'ahili'], ['ahill', 'ahill'], ['aihil', 'aihil'], ['alhil', 'alhil'],
            ['hahil', 'hahil'], ['hhhil', 'hhhil'], ['hhila', 'hhila'], ['hhilh', 'hhilh'],
            ['hhili', 'hhili'], ['hhill', 'hhill'], ['hiala', 'hiala'], ['hialh', 'hialh'],
            ['hiali', 'hiali'], ['hiall', 'hiall'], ['hihil', 'hihil'], ['hihla', 'hihla'],
            ['hihlh', 'hihlh'], ['hihli', 'hihli'], ['hihll', 'hihll'], ['hiila', 'hiila'],
            ['hiilh', 'hiilh'], ['hiili', 'hiili'], ['hiill', 'hiill'], ['hilaa', 'hilaa'],
            ['hilah', 'hilah'], ['hilai', 'hilai'], ['hilal', 'hilal'], ['hilha', 'hilha'],
            ['hilhh', 'hilhh'], ['hilhi', 'hilhi'], ['hilhl', 'hilhl'], ['hilia', 'hilia'],
            ['hilih', 'hilih'], ['hilii', 'hilii'], ['hilil', 'hilil'], ['hilla', 'hilla'],
            ['hillh', 'hillh'], ['hilli', 'hilli'], ['hilll', 'hilll'], ['hlhil', 'hlhil'],
            ['iahil', 'iahil'], ['ihhil', 'ihhil'], ['ihila', 'ihila'], ['ihilh', 'ihilh'],
            ['ihili', 'ihili'], ['ihill', 'ihill'], ['iihil', 'iihil'], ['ilhil', 'ilhil'],
            ['lahil', 'lahil'], ['lhhil', 'lhhil'], ['lhila', 'lhila'], ['lhilh', 'lhilh'],
            ['lhili', 'lhili'], ['lhill', 'lhill'], ['lihil', 'lihil'], ['llhil', 'llhil'],
        ],
    });

    testGrammarIO({
        desc: '9d. Replace i by a in hi(^l)l: maxC_i:5(BS) i -> a || h_(^l)l',
        grammar: Replace("i", "a", "h", Seq(NOTCHARI("l"), I("l")), false, false),
        query: BoundingSet('hi', '', OPTDOTI("l"), false, false),
        maxChars: MAXCH(5),
        io: [
            // Replacement
            ['hial', 'haal'],   ['hihl', 'hahl'],   ['hiil', 'hail'],
            ['ahial', 'ahaal'], ['ahihl', 'ahahl'], ['ahiil', 'ahail'], ['hhial', 'hhaal'],
            ['hhihl', 'hhahl'], ['hhiil', 'hhail'], ['hiala', 'haala'], ['hialh', 'haalh'],
            ['hiali', 'haali'], ['hiall', 'haall'], ['hihla', 'hahla'], ['hihlh', 'hahlh'],
            ['hihli', 'hahli'], ['hihll', 'hahll'], ['hiila', 'haila'], ['hiilh', 'hailh'],
            ['hiili', 'haili'], ['hiill', 'haill'], ['ihial', 'ihaal'], ['ihihl', 'ihahl'],
            ['ihiil', 'ihail'], ['lhial', 'lhaal'], ['lhihl', 'lhahl'], ['lhiil', 'lhail'],
            // Copy through only
            ['hil', 'hil'],
            ['ahil', 'ahil'],   ['hhil', 'hhil'],   ['hila', 'hila'],   ['hilh', 'hilh'],
            ['hili', 'hili'],   ['hill', 'hill'],   ['ihil', 'ihil'],   ['lhil', 'lhil'],
            ['aahil', 'aahil'], ['ahhil', 'ahhil'], ['ahila', 'ahila'], ['ahilh', 'ahilh'],
            ['ahili', 'ahili'], ['ahill', 'ahill'], ['aihil', 'aihil'], ['alhil', 'alhil'],
            ['hahil', 'hahil'], ['hhhil', 'hhhil'], ['hhila', 'hhila'], ['hhilh', 'hhilh'],
            ['hhili', 'hhili'], ['hhill', 'hhill'], ['hihil', 'hihil'], ['hilaa', 'hilaa'],
            ['hilah', 'hilah'], ['hilai', 'hilai'], ['hilal', 'hilal'], ['hilha', 'hilha'],
            ['hilhh', 'hilhh'], ['hilhi', 'hilhi'], ['hilhl', 'hilhl'], ['hilia', 'hilia'],
            ['hilih', 'hilih'], ['hilii', 'hilii'], ['hilil', 'hilil'], ['hilla', 'hilla'],
            ['hillh', 'hillh'], ['hilli', 'hilli'], ['hilll', 'hilll'], ['hlhil', 'hlhil'],
            ['iahil', 'iahil'], ['ihhil', 'ihhil'], ['ihila', 'ihila'], ['ihilh', 'ihilh'],
            ['ihili', 'ihili'], ['ihill', 'ihill'], ['iihil', 'iihil'], ['ilhil', 'ilhil'],
            ['lahil', 'lahil'], ['lhhil', 'lhhil'], ['lhila', 'lhila'], ['lhilh', 'lhilh'],
            ['lhili', 'lhili'], ['lhill', 'lhill'], ['lihil', 'lihil'], ['llhil', 'llhil'],
        ],
    });

    testGrammarIO({
        desc: '10a. Replace i by a in #(^h)i(^l)#: maxC_i:4(BS) i -> a || #(^h)_(^l)#',
        grammar: Replace("i", "a", NOTCHARI("h"), NOTCHARI("l"), true, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['aia', 'aaa'],   ['aih', 'aah'],   ['aii', 'aai'],   ['iia', 'iaa'],
            ['iih', 'iah'],   ['iii', 'iai'],   ['lia', 'laa'],   ['lih', 'lah'],
            ['lii', 'lai'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['hi', 'hi'],     ['ia', 'ia'],
            ['ih', 'ih'],     ['ii', 'ii'],     ['il', 'il'],     ['li', 'li'],
            ['aai', 'aai'],   ['ahi', 'ahi'],   ['ail', 'ail'],   ['ali', 'ali'],
            ['hai', 'hai'],   ['hhi', 'hhi'],   ['hia', 'hia'],   ['hih', 'hih'],
            ['hii', 'hii'],   ['hil', 'hil'],   ['hli', 'hli'],   ['iaa', 'iaa'],
            ['iah', 'iah'],   ['iai', 'iai'],   ['ial', 'ial'],   ['iha', 'iha'],
            ['ihh', 'ihh'],   ['ihi', 'ihi'],   ['ihl', 'ihl'],   ['iil', 'iil'],
            ['ila', 'ila'],   ['ilh', 'ilh'],   ['ili', 'ili'],   ['ill', 'ill'],
            ['lai', 'lai'],   ['lhi', 'lhi'],   ['lil', 'lil'],   ['lli', 'lli'],
            ['aaai', 'aaai'], ['aahi', 'aahi'], ['aaia', 'aaia'], ['aaih', 'aaih'],
            ['aaii', 'aaii'], ['aail', 'aail'], ['aali', 'aali'], ['ahai', 'ahai'],
            ['ahhi', 'ahhi'], ['ahia', 'ahia'], ['ahih', 'ahih'], ['ahii', 'ahii'],
            ['ahil', 'ahil'], ['ahli', 'ahli'], ['aiaa', 'aiaa'], ['aiah', 'aiah'],
            ['aiai', 'aiai'], ['aial', 'aial'], ['aiha', 'aiha'], ['aihh', 'aihh'],
            ['aihi', 'aihi'], ['aihl', 'aihl'], ['aiia', 'aiia'], ['aiih', 'aiih'],
            ['aiii', 'aiii'], ['aiil', 'aiil'], ['aila', 'aila'], ['ailh', 'ailh'],
            ['aili', 'aili'], ['aill', 'aill'], ['alai', 'alai'], ['alhi', 'alhi'],
            ['alia', 'alia'], ['alih', 'alih'], ['alii', 'alii'], ['alil', 'alil'],
            ['alli', 'alli'], ['haai', 'haai'], ['hahi', 'hahi'], ['haia', 'haia'],
            ['haih', 'haih'], ['haii', 'haii'], ['hail', 'hail'], ['hali', 'hali'],
            ['hhai', 'hhai'], ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'],
            ['hhii', 'hhii'], ['hhil', 'hhil'], ['hhli', 'hhli'], ['hiaa', 'hiaa'],
            ['hiah', 'hiah'], ['hiai', 'hiai'], ['hial', 'hial'], ['hiha', 'hiha'],
            ['hihh', 'hihh'], ['hihi', 'hihi'], ['hihl', 'hihl'], ['hiia', 'hiia'],
            ['hiih', 'hiih'], ['hiii', 'hiii'], ['hiil', 'hiil'], ['hila', 'hila'],
            ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'], ['hlai', 'hlai'],
            ['hlhi', 'hlhi'], ['hlia', 'hlia'], ['hlih', 'hlih'], ['hlii', 'hlii'],
            ['hlil', 'hlil'], ['hlli', 'hlli'], ['iaaa', 'iaaa'], ['iaah', 'iaah'],
            ['iaai', 'iaai'], ['iaal', 'iaal'], ['iaha', 'iaha'], ['iahh', 'iahh'],
            ['iahi', 'iahi'], ['iahl', 'iahl'], ['iaia', 'iaia'], ['iaih', 'iaih'],
            ['iaii', 'iaii'], ['iail', 'iail'], ['iala', 'iala'], ['ialh', 'ialh'],
            ['iali', 'iali'], ['iall', 'iall'], ['ihaa', 'ihaa'], ['ihah', 'ihah'],
            ['ihai', 'ihai'], ['ihal', 'ihal'], ['ihha', 'ihha'], ['ihhh', 'ihhh'],
            ['ihhi', 'ihhi'], ['ihhl', 'ihhl'], ['ihia', 'ihia'], ['ihih', 'ihih'],
            ['ihii', 'ihii'], ['ihil', 'ihil'], ['ihla', 'ihla'], ['ihlh', 'ihlh'],
            ['ihli', 'ihli'], ['ihll', 'ihll'], ['iiaa', 'iiaa'], ['iiah', 'iiah'],
            ['iiai', 'iiai'], ['iial', 'iial'], ['iiha', 'iiha'], ['iihh', 'iihh'],
            ['iihi', 'iihi'], ['iihl', 'iihl'], ['iiia', 'iiia'], ['iiih', 'iiih'],
            ['iiii', 'iiii'], ['iiil', 'iiil'], ['iila', 'iila'], ['iilh', 'iilh'],
            ['iili', 'iili'], ['iill', 'iill'], ['ilaa', 'ilaa'], ['ilah', 'ilah'],
            ['ilai', 'ilai'], ['ilal', 'ilal'], ['ilha', 'ilha'], ['ilhh', 'ilhh'],
            ['ilhi', 'ilhi'], ['ilhl', 'ilhl'], ['ilia', 'ilia'], ['ilih', 'ilih'],
            ['ilii', 'ilii'], ['ilil', 'ilil'], ['illa', 'illa'], ['illh', 'illh'],
            ['illi', 'illi'], ['illl', 'illl'], ['laai', 'laai'], ['lahi', 'lahi'],
            ['laia', 'laia'], ['laih', 'laih'], ['laii', 'laii'], ['lail', 'lail'],
            ['lali', 'lali'], ['lhai', 'lhai'], ['lhhi', 'lhhi'], ['lhia', 'lhia'],
            ['lhih', 'lhih'], ['lhii', 'lhii'], ['lhil', 'lhil'], ['lhli', 'lhli'],
            ['liaa', 'liaa'], ['liah', 'liah'], ['liai', 'liai'], ['lial', 'lial'],
            ['liha', 'liha'], ['lihh', 'lihh'], ['lihi', 'lihi'], ['lihl', 'lihl'],
            ['liia', 'liia'], ['liih', 'liih'], ['liii', 'liii'], ['liil', 'liil'],
            ['lila', 'lila'], ['lilh', 'lilh'], ['lili', 'lili'], ['lill', 'lill'],
            ['llai', 'llai'], ['llhi', 'llhi'], ['llia', 'llia'], ['llih', 'llih'],
            ['llii', 'llii'], ['llil', 'llil'], ['llli', 'llli'],
        ],
    });

    testGrammarIO({
        desc: '10b. Replace i by a in #(^h)i(^l): maxC_i:4(BS) i -> a || #(^h)_(^l)',
        grammar: Replace("i", "a", NOTCHARI("h"), NOTCHARI("l"), true, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['aia', 'aaa'],   ['aih', 'aah'],   ['aii', 'aai'],   ['iia', 'iaa'],
            ['iih', 'iah'],   ['iii', 'iai'],   ['lia', 'laa'],   ['lih', 'lah'],
            ['lii', 'lai'],
            ['aiaa', 'aaaa'], ['aiah', 'aaah'], ['aiai', 'aaai'], ['aial', 'aaal'],
            ['aiha', 'aaha'], ['aihh', 'aahh'], ['aihi', 'aahi'], ['aihl', 'aahl'],
            ['aiia', 'aaia'], ['aiih', 'aaih'], ['aiii', 'aaii'], ['aiil', 'aail'],
            ['iiaa', 'iaaa'], ['iiah', 'iaah'], ['iiai', 'iaai'], ['iial', 'iaal'],
            ['iiha', 'iaha'], ['iihh', 'iahh'], ['iihi', 'iahi'], ['iihl', 'iahl'],
            ['iiia', 'iaia'], ['iiih', 'iaih'], ['iiii', 'iaii'], ['iiil', 'iail'],
            ['liaa', 'laaa'], ['liah', 'laah'], ['liai', 'laai'], ['lial', 'laal'],
            ['liha', 'laha'], ['lihh', 'lahh'], ['lihi', 'lahi'], ['lihl', 'lahl'],
            ['liia', 'laia'], ['liih', 'laih'], ['liii', 'laii'], ['liil', 'lail'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['hi', 'hi'],     ['ia', 'ia'],
            ['ih', 'ih'],     ['ii', 'ii'],     ['il', 'il'],     ['li', 'li'],
            ['aai', 'aai'],   ['ahi', 'ahi'],   ['ail', 'ail'],   ['ali', 'ali'],
            ['hai', 'hai'],   ['hhi', 'hhi'],   ['hia', 'hia'],   ['hih', 'hih'],
            ['hii', 'hii'],   ['hil', 'hil'],   ['hli', 'hli'],   ['iaa', 'iaa'],
            ['iah', 'iah'],   ['iai', 'iai'],   ['ial', 'ial'],   ['iha', 'iha'],
            ['ihh', 'ihh'],   ['ihi', 'ihi'],   ['ihl', 'ihl'],   ['iil', 'iil'],
            ['ila', 'ila'],   ['ilh', 'ilh'],   ['ili', 'ili'],   ['ill', 'ill'],
            ['lai', 'lai'],   ['lhi', 'lhi'],   ['lil', 'lil'],   ['lli', 'lli'],
            ['aaai', 'aaai'], ['aahi', 'aahi'], ['aaia', 'aaia'], ['aaih', 'aaih'],
            ['aaii', 'aaii'], ['aail', 'aail'], ['aali', 'aali'], ['ahai', 'ahai'],
            ['ahhi', 'ahhi'], ['ahia', 'ahia'], ['ahih', 'ahih'], ['ahii', 'ahii'],
            ['ahil', 'ahil'], ['ahli', 'ahli'], ['aila', 'aila'], ['ailh', 'ailh'],
            ['aili', 'aili'], ['aill', 'aill'], ['alai', 'alai'], ['alhi', 'alhi'],
            ['alia', 'alia'], ['alih', 'alih'], ['alii', 'alii'], ['alil', 'alil'],
            ['alli', 'alli'], ['haai', 'haai'], ['hahi', 'hahi'], ['haia', 'haia'],
            ['haih', 'haih'], ['haii', 'haii'], ['hail', 'hail'], ['hali', 'hali'],
            ['hhai', 'hhai'], ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'],
            ['hhii', 'hhii'], ['hhil', 'hhil'], ['hhli', 'hhli'], ['hiaa', 'hiaa'],
            ['hiah', 'hiah'], ['hiai', 'hiai'], ['hial', 'hial'], ['hiha', 'hiha'],
            ['hihh', 'hihh'], ['hihi', 'hihi'], ['hihl', 'hihl'], ['hiia', 'hiia'],
            ['hiih', 'hiih'], ['hiii', 'hiii'], ['hiil', 'hiil'], ['hila', 'hila'],
            ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'], ['hlai', 'hlai'],
            ['hlhi', 'hlhi'], ['hlia', 'hlia'], ['hlih', 'hlih'], ['hlii', 'hlii'],
            ['hlil', 'hlil'], ['hlli', 'hlli'], ['iaaa', 'iaaa'], ['iaah', 'iaah'],
            ['iaai', 'iaai'], ['iaal', 'iaal'], ['iaha', 'iaha'], ['iahh', 'iahh'],
            ['iahi', 'iahi'], ['iahl', 'iahl'], ['iaia', 'iaia'], ['iaih', 'iaih'],
            ['iaii', 'iaii'], ['iail', 'iail'], ['iala', 'iala'], ['ialh', 'ialh'],
            ['iali', 'iali'], ['iall', 'iall'], ['ihaa', 'ihaa'], ['ihah', 'ihah'],
            ['ihai', 'ihai'], ['ihal', 'ihal'], ['ihha', 'ihha'], ['ihhh', 'ihhh'],
            ['ihhi', 'ihhi'], ['ihhl', 'ihhl'], ['ihia', 'ihia'], ['ihih', 'ihih'],
            ['ihii', 'ihii'], ['ihil', 'ihil'], ['ihla', 'ihla'], ['ihlh', 'ihlh'],
            ['ihli', 'ihli'], ['ihll', 'ihll'], ['iila', 'iila'], ['iilh', 'iilh'],
            ['iili', 'iili'], ['iill', 'iill'], ['ilaa', 'ilaa'], ['ilah', 'ilah'],
            ['ilai', 'ilai'], ['ilal', 'ilal'], ['ilha', 'ilha'], ['ilhh', 'ilhh'],
            ['ilhi', 'ilhi'], ['ilhl', 'ilhl'], ['ilia', 'ilia'], ['ilih', 'ilih'],
            ['ilii', 'ilii'], ['ilil', 'ilil'], ['illa', 'illa'], ['illh', 'illh'],
            ['illi', 'illi'], ['illl', 'illl'], ['laai', 'laai'], ['lahi', 'lahi'],
            ['laia', 'laia'], ['laih', 'laih'], ['laii', 'laii'], ['lail', 'lail'],
            ['lali', 'lali'], ['lhai', 'lhai'], ['lhhi', 'lhhi'], ['lhia', 'lhia'],
            ['lhih', 'lhih'], ['lhii', 'lhii'], ['lhil', 'lhil'], ['lhli', 'lhli'],
            ['lila', 'lila'], ['lilh', 'lilh'], ['lili', 'lili'], ['lill', 'lill'],
            ['llai', 'llai'], ['llhi', 'llhi'], ['llia', 'llia'], ['llih', 'llih'],
            ['llii', 'llii'], ['llil', 'llil'], ['llli', 'llli'],
        ],
    });

    testGrammarIO({
        desc: '10c. Replace i by a in (^h)i(^l)#: maxC_i:4(BS) i -> a || (^h)_(^l)#',
        grammar: Replace("i", "a", NOTCHARI("h"), NOTCHARI("l"), false, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['aia', 'aaa'],   ['aih', 'aah'],   ['aii', 'aai'],   ['iia', 'iaa'],
            ['iih', 'iah'],   ['iii', 'iai'],   ['lia', 'laa'],   ['lih', 'lah'],
            ['lii', 'lai'],
            ['aaia', 'aaaa'], ['aaih', 'aaah'], ['aaii', 'aaai'], ['aiia', 'aiaa'],
            ['aiih', 'aiah'], ['aiii', 'aiai'], ['alia', 'alaa'], ['alih', 'alah'],
            ['alii', 'alai'], ['haia', 'haaa'], ['haih', 'haah'], ['haii', 'haai'],
            ['hiia', 'hiaa'], ['hiih', 'hiah'], ['hiii', 'hiai'], ['hlia', 'hlaa'],
            ['hlih', 'hlah'], ['hlii', 'hlai'], ['iaia', 'iaaa'], ['iaih', 'iaah'],
            ['iaii', 'iaai'], ['iiia', 'iiaa'], ['iiih', 'iiah'], ['iiii', 'iiai'],
            ['ilia', 'ilaa'], ['ilih', 'ilah'], ['ilii', 'ilai'], ['laia', 'laaa'],
            ['laih', 'laah'], ['laii', 'laai'], ['liia', 'liaa'], ['liih', 'liah'],
            ['liii', 'liai'], ['llia', 'llaa'], ['llih', 'llah'], ['llii', 'llai'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['hi', 'hi'],     ['ia', 'ia'],
            ['ih', 'ih'],     ['ii', 'ii'],     ['il', 'il'],     ['li', 'li'],
            ['aai', 'aai'],   ['ahi', 'ahi'],   ['ail', 'ail'],   ['ali', 'ali'],
            ['hai', 'hai'],   ['hhi', 'hhi'],   ['hia', 'hia'],   ['hih', 'hih'],
            ['hii', 'hii'],   ['hil', 'hil'],   ['hli', 'hli'],   ['iaa', 'iaa'],
            ['iah', 'iah'],   ['iai', 'iai'],   ['ial', 'ial'],   ['iha', 'iha'],
            ['ihh', 'ihh'],   ['ihi', 'ihi'],   ['ihl', 'ihl'],   ['iil', 'iil'],
            ['ila', 'ila'],   ['ilh', 'ilh'],   ['ili', 'ili'],   ['ill', 'ill'],
            ['lai', 'lai'],   ['lhi', 'lhi'],   ['lil', 'lil'],   ['lli', 'lli'],
            ['aaai', 'aaai'], ['aahi', 'aahi'], ['aail', 'aail'], ['aali', 'aali'],
            ['ahai', 'ahai'], ['ahhi', 'ahhi'], ['ahia', 'ahia'], ['ahih', 'ahih'],
            ['ahii', 'ahii'], ['ahil', 'ahil'], ['ahli', 'ahli'], ['aiaa', 'aiaa'],
            ['aiah', 'aiah'], ['aiai', 'aiai'], ['aial', 'aial'], ['aiha', 'aiha'],
            ['aihh', 'aihh'], ['aihi', 'aihi'], ['aihl', 'aihl'], ['aiil', 'aiil'],
            ['aila', 'aila'], ['ailh', 'ailh'], ['aili', 'aili'], ['aill', 'aill'],
            ['alai', 'alai'], ['alhi', 'alhi'], ['alil', 'alil'], ['alli', 'alli'],
            ['haai', 'haai'], ['hahi', 'hahi'], ['hail', 'hail'], ['hali', 'hali'],
            ['hhai', 'hhai'], ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'],
            ['hhii', 'hhii'], ['hhil', 'hhil'], ['hhli', 'hhli'], ['hiaa', 'hiaa'],
            ['hiah', 'hiah'], ['hiai', 'hiai'], ['hial', 'hial'], ['hiha', 'hiha'],
            ['hihh', 'hihh'], ['hihi', 'hihi'], ['hihl', 'hihl'], ['hiil', 'hiil'],
            ['hila', 'hila'], ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'],
            ['hlai', 'hlai'], ['hlhi', 'hlhi'], ['hlil', 'hlil'], ['hlli', 'hlli'],
            ['iaaa', 'iaaa'], ['iaah', 'iaah'], ['iaai', 'iaai'], ['iaal', 'iaal'],
            ['iaha', 'iaha'], ['iahh', 'iahh'], ['iahi', 'iahi'], ['iahl', 'iahl'],
            ['iail', 'iail'], ['iala', 'iala'], ['ialh', 'ialh'], ['iali', 'iali'],
            ['iall', 'iall'], ['ihaa', 'ihaa'], ['ihah', 'ihah'], ['ihai', 'ihai'],
            ['ihal', 'ihal'], ['ihha', 'ihha'], ['ihhh', 'ihhh'], ['ihhi', 'ihhi'],
            ['ihhl', 'ihhl'], ['ihia', 'ihia'], ['ihih', 'ihih'], ['ihii', 'ihii'],
            ['ihil', 'ihil'], ['ihla', 'ihla'], ['ihlh', 'ihlh'], ['ihli', 'ihli'],
            ['ihll', 'ihll'], ['iiaa', 'iiaa'], ['iiah', 'iiah'], ['iiai', 'iiai'],
            ['iial', 'iial'], ['iiha', 'iiha'], ['iihh', 'iihh'], ['iihi', 'iihi'],
            ['iihl', 'iihl'], ['iiil', 'iiil'], ['iila', 'iila'], ['iilh', 'iilh'],
            ['iili', 'iili'], ['iill', 'iill'], ['ilaa', 'ilaa'], ['ilah', 'ilah'],
            ['ilai', 'ilai'], ['ilal', 'ilal'], ['ilha', 'ilha'], ['ilhh', 'ilhh'],
            ['ilhi', 'ilhi'], ['ilhl', 'ilhl'], ['ilil', 'ilil'], ['illa', 'illa'],
            ['illh', 'illh'], ['illi', 'illi'], ['illl', 'illl'], ['laai', 'laai'],
            ['lahi', 'lahi'], ['lail', 'lail'], ['lali', 'lali'], ['lhai', 'lhai'],
            ['lhhi', 'lhhi'], ['lhia', 'lhia'], ['lhih', 'lhih'], ['lhii', 'lhii'],
            ['lhil', 'lhil'], ['lhli', 'lhli'], ['liaa', 'liaa'], ['liah', 'liah'],
            ['liai', 'liai'], ['lial', 'lial'], ['liha', 'liha'], ['lihh', 'lihh'],
            ['lihi', 'lihi'], ['lihl', 'lihl'], ['liil', 'liil'], ['lila', 'lila'],
            ['lilh', 'lilh'], ['lili', 'lili'], ['lill', 'lill'], ['llai', 'llai'],
            ['llhi', 'llhi'], ['llil', 'llil'], ['llli', 'llli'],
        ],
    });

    testGrammarIO({
        desc: '10d. Replace i by a in (^h)i(^l): maxC_i:4(BS) i -> a || (^h)_(^l)',
        grammar: Replace("i", "a", NOTCHARI("h"), NOTCHARI("l"), false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['aia', 'aaa'],   ['aih', 'aah'],   ['aii', 'aai'],   ['iia', 'iaa'],
            ['iih', 'iah'],   ['iii', 'iai'],   ['lia', 'laa'],   ['lih', 'lah'],
            ['lii', 'lai'],
            ['aaia', 'aaaa'], ['aaih', 'aaah'], ['aaii', 'aaai'], ['aiaa', 'aaaa'],
            ['aiah', 'aaah'], ['aiai', 'aaai'], ['aial', 'aaal'], ['aiha', 'aaha'],
            ['aihh', 'aahh'], ['aihi', 'aahi'], ['aihl', 'aahl'], ['aiia', 'aaia'],
            ['aiih', 'aaih'], ['aiii', 'aaii'], ['aiil', 'aail'], ['alia', 'alaa'],
            ['alih', 'alah'], ['alii', 'alai'], ['haia', 'haaa'], ['haih', 'haah'],
            ['haii', 'haai'], ['hiia', 'hiaa'], ['hiih', 'hiah'], ['hiii', 'hiai'],
            ['hlia', 'hlaa'], ['hlih', 'hlah'], ['hlii', 'hlai'], ['iaia', 'iaaa'],
            ['iaih', 'iaah'], ['iaii', 'iaai'], ['iiaa', 'iaaa'], ['iiah', 'iaah'],
            ['iiai', 'iaai'], ['iial', 'iaal'], ['iiha', 'iaha'], ['iihh', 'iahh'],
            ['iihi', 'iahi'], ['iihl', 'iahl'], ['iiia', 'iaia'], ['iiih', 'iaih'],
            ['iiii', 'iaii'], ['iiil', 'iail'], ['ilia', 'ilaa'], ['ilih', 'ilah'],
            ['ilii', 'ilai'], ['laia', 'laaa'], ['laih', 'laah'], ['laii', 'laai'],
            ['liaa', 'laaa'], ['liah', 'laah'], ['liai', 'laai'], ['lial', 'laal'],
            ['liha', 'laha'], ['lihh', 'lahh'], ['lihi', 'lahi'], ['lihl', 'lahl'],
            ['liia', 'laia'], ['liih', 'laih'], ['liii', 'laii'], ['liil', 'lail'],
            ['llia', 'llaa'], ['llih', 'llah'], ['llii', 'llai'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['hi', 'hi'],     ['ia', 'ia'],
            ['ih', 'ih'],     ['ii', 'ii'],     ['il', 'il'],     ['li', 'li'],
            ['aai', 'aai'],   ['ahi', 'ahi'],   ['ail', 'ail'],   ['ali', 'ali'],
            ['hai', 'hai'],   ['hhi', 'hhi'],   ['hia', 'hia'],   ['hih', 'hih'],
            ['hii', 'hii'],   ['hil', 'hil'],   ['hli', 'hli'],   ['iaa', 'iaa'],
            ['iah', 'iah'],   ['iai', 'iai'],   ['ial', 'ial'],   ['iha', 'iha'],
            ['ihh', 'ihh'],   ['ihi', 'ihi'],   ['ihl', 'ihl'],   ['iil', 'iil'],
            ['ila', 'ila'],   ['ilh', 'ilh'],   ['ili', 'ili'],   ['ill', 'ill'],
            ['lai', 'lai'],   ['lhi', 'lhi'],   ['lil', 'lil'],   ['lli', 'lli'],
            ['aaai', 'aaai'], ['aahi', 'aahi'], ['aail', 'aail'], ['aali', 'aali'],
            ['ahai', 'ahai'], ['ahhi', 'ahhi'], ['ahia', 'ahia'], ['ahih', 'ahih'],
            ['ahii', 'ahii'], ['ahil', 'ahil'], ['ahli', 'ahli'], ['aila', 'aila'],
            ['ailh', 'ailh'], ['aili', 'aili'], ['aill', 'aill'], ['alai', 'alai'],
            ['alhi', 'alhi'], ['alil', 'alil'], ['alli', 'alli'], ['haai', 'haai'],
            ['hahi', 'hahi'], ['hail', 'hail'], ['hali', 'hali'], ['hhai', 'hhai'],
            ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'], ['hhii', 'hhii'],
            ['hhil', 'hhil'], ['hhli', 'hhli'], ['hiaa', 'hiaa'], ['hiah', 'hiah'],
            ['hiai', 'hiai'], ['hial', 'hial'], ['hiha', 'hiha'], ['hihh', 'hihh'],
            ['hihi', 'hihi'], ['hihl', 'hihl'], ['hiil', 'hiil'], ['hila', 'hila'],
            ['hilh', 'hilh'], ['hili', 'hili'], ['hill', 'hill'], ['hlai', 'hlai'],
            ['hlhi', 'hlhi'], ['hlil', 'hlil'], ['hlli', 'hlli'], ['iaaa', 'iaaa'],
            ['iaah', 'iaah'], ['iaai', 'iaai'], ['iaal', 'iaal'], ['iaha', 'iaha'],
            ['iahh', 'iahh'], ['iahi', 'iahi'], ['iahl', 'iahl'], ['iail', 'iail'],
            ['iala', 'iala'], ['ialh', 'ialh'], ['iali', 'iali'], ['iall', 'iall'],
            ['ihaa', 'ihaa'], ['ihah', 'ihah'], ['ihai', 'ihai'], ['ihal', 'ihal'],
            ['ihha', 'ihha'], ['ihhh', 'ihhh'], ['ihhi', 'ihhi'], ['ihhl', 'ihhl'],
            ['ihia', 'ihia'], ['ihih', 'ihih'], ['ihii', 'ihii'], ['ihil', 'ihil'],
            ['ihla', 'ihla'], ['ihlh', 'ihlh'], ['ihli', 'ihli'], ['ihll', 'ihll'],
            ['iila', 'iila'], ['iilh', 'iilh'], ['iili', 'iili'], ['iill', 'iill'],
            ['ilaa', 'ilaa'], ['ilah', 'ilah'], ['ilai', 'ilai'], ['ilal', 'ilal'],
            ['ilha', 'ilha'], ['ilhh', 'ilhh'], ['ilhi', 'ilhi'], ['ilhl', 'ilhl'],
            ['ilil', 'ilil'], ['illa', 'illa'], ['illh', 'illh'], ['illi', 'illi'],
            ['illl', 'illl'], ['laai', 'laai'], ['lahi', 'lahi'], ['lail', 'lail'],
            ['lali', 'lali'], ['lhai', 'lhai'], ['lhhi', 'lhhi'], ['lhia', 'lhia'],
            ['lhih', 'lhih'], ['lhii', 'lhii'], ['lhil', 'lhil'], ['lhli', 'lhli'],
            ['lila', 'lila'], ['lilh', 'lilh'], ['lili', 'lili'], ['lill', 'lill'],
            ['llai', 'llai'], ['llhi', 'llhi'], ['llil', 'llil'], ['llli', 'llli'],
        ],
    });

    testGrammarIO({
        desc: '11a. Replace i by a in #(^h)(^i)i: maxC_i:4(BS) i -> a || #(^h)(^i)_',
        grammar: Replace("i", "a", Seq(NOTCHARI("h"), NOTCHARI("i")), EMPTY_CONTEXT,
                         true, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['aai', 'aaa'],   ['ahi', 'aha'],   ['iai', 'iaa'],   ['ihi', 'iha'],
            ['aaia', 'aaaa'], ['aaih', 'aaah'], ['aaii', 'aaai'], ['ahia', 'ahaa'],
            ['ahih', 'ahah'], ['ahii', 'ahai'], ['iaia', 'iaaa'], ['iaih', 'iaah'],
            ['iaii', 'iaai'], ['ihia', 'ihaa'], ['ihih', 'ihah'], ['ihii', 'ihai'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['hi', 'hi'],     ['ia', 'ia'],
            ['ih', 'ih'],     ['ii', 'ii'],
            ['aia', 'aia'],   ['aih', 'aih'],   ['aii', 'aii'],   ['hai', 'hai'],
            ['hhi', 'hhi'],   ['hia', 'hia'],   ['hih', 'hih'],   ['hii', 'hii'],
            ['iaa', 'iaa'],   ['iah', 'iah'],   ['iha', 'iha'],   ['ihh', 'ihh'],
            ['iia', 'iia'],   ['iih', 'iih'],   ['iii', 'iii'],
            ['aaai', 'aaai'], ['aahi', 'aahi'], ['ahai', 'ahai'], ['ahhi', 'ahhi'],
            ['aiaa', 'aiaa'], ['aiah', 'aiah'], ['aiai', 'aiai'], ['aiha', 'aiha'],
            ['aihh', 'aihh'], ['aihi', 'aihi'], ['aiia', 'aiia'], ['aiih', 'aiih'],
            ['aiii', 'aiii'], ['haai', 'haai'], ['hahi', 'hahi'], ['haia', 'haia'],
            ['haih', 'haih'], ['haii', 'haii'], ['hhai', 'hhai'], ['hhhi', 'hhhi'],
            ['hhia', 'hhia'], ['hhih', 'hhih'], ['hhii', 'hhii'], ['hiaa', 'hiaa'],
            ['hiah', 'hiah'], ['hiai', 'hiai'], ['hiha', 'hiha'], ['hihh', 'hihh'],
            ['hihi', 'hihi'], ['hiia', 'hiia'], ['hiih', 'hiih'], ['hiii', 'hiii'],
            ['iaaa', 'iaaa'], ['iaah', 'iaah'], ['iaai', 'iaai'], ['iaha', 'iaha'],
            ['iahh', 'iahh'], ['iahi', 'iahi'], ['ihaa', 'ihaa'], ['ihah', 'ihah'],
            ['ihai', 'ihai'], ['ihha', 'ihha'], ['ihhh', 'ihhh'], ['ihhi', 'ihhi'],
            ['iiaa', 'iiaa'], ['iiah', 'iiah'], ['iiai', 'iiai'], ['iiha', 'iiha'],
            ['iihh', 'iihh'], ['iihi', 'iihi'], ['iiia', 'iiia'], ['iiih', 'iiih'],
            ['iiii', 'iiii'],
        ],
    });

    testGrammarIO({
        desc: '11b. Replace i by a in (^h)(^i)i: maxC_i:4(BS) i -> a || (^h)(^i)_',
        grammar: Replace("i", "a", Seq(NOTCHARI("h"), NOTCHARI("i")), EMPTY_CONTEXT,
                         false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['aai', 'aaa'],   ['ahi', 'aha'],   ['iai', 'iaa'],   ['ihi', 'iha'],
            ['aaia', 'aaaa'], ['aaih', 'aaah'], ['aaii', 'aaai'], ['ahia', 'ahaa'],
            ['ahih', 'ahah'], ['ahii', 'ahai'], ['iaia', 'iaaa'], ['iaih', 'iaah'],
            ['iaii', 'iaai'], ['ihia', 'ihaa'], ['ihih', 'ihah'], ['ihii', 'ihai'],
            ['aaai', 'aaaa'], ['aahi', 'aaha'], ['aiai', 'aiaa'], ['aihi', 'aiha'],
            ['haai', 'haaa'], ['hahi', 'haha'], ['hiai', 'hiaa'], ['hihi', 'hiha'],
            ['iaai', 'iaaa'], ['iahi', 'iaha'], ['iiai', 'iiaa'], ['iihi', 'iiha'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['hi', 'hi'],     ['ia', 'ia'],
            ['ih', 'ih'],     ['ii', 'ii'],
            ['aia', 'aia'],   ['aih', 'aih'],   ['aii', 'aii'],   ['hai', 'hai'],
            ['hhi', 'hhi'],   ['hia', 'hia'],   ['hih', 'hih'],   ['hii', 'hii'],
            ['iaa', 'iaa'],   ['iah', 'iah'],   ['iha', 'iha'],   ['ihh', 'ihh'],
            ['iia', 'iia'],   ['iih', 'iih'],   ['iii', 'iii'],
            ['ahai', 'ahai'], ['ahhi', 'ahhi'], ['aiaa', 'aiaa'], ['aiah', 'aiah'],
            ['aiha', 'aiha'], ['aihh', 'aihh'], ['aiia', 'aiia'], ['aiih', 'aiih'],
            ['aiii', 'aiii'], ['haia', 'haia'], ['haih', 'haih'], ['haii', 'haii'],
            ['hhai', 'hhai'], ['hhhi', 'hhhi'], ['hhia', 'hhia'], ['hhih', 'hhih'],
            ['hhii', 'hhii'], ['hiaa', 'hiaa'], ['hiah', 'hiah'], ['hiha', 'hiha'],
            ['hihh', 'hihh'], ['hiia', 'hiia'], ['hiih', 'hiih'], ['hiii', 'hiii'],
            ['iaaa', 'iaaa'], ['iaah', 'iaah'], ['iaha', 'iaha'], ['iahh', 'iahh'],
            ['ihaa', 'ihaa'], ['ihah', 'ihah'], ['ihai', 'ihai'], ['ihha', 'ihha'],
            ['ihhh', 'ihhh'], ['ihhi', 'ihhi'], ['iiaa', 'iiaa'], ['iiah', 'iiah'],
            ['iiha', 'iiha'], ['iihh', 'iihh'], ['iiia', 'iiia'], ['iiih', 'iiih'],
            ['iiii', 'iiii'],
        ],
    });

    testGrammarIO({
        desc: '12a. Replace i by a in i(^l)(^l)#: maxC_i:4(BS) i -> a || _(^l)(^l)#',
        grammar: Replace("i", "a", EMPTY_CONTEXT, Seq(NOTCHARI("l"), NOTCHARI("l")),
                         false, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['iaa', 'aaa'],   ['iai', 'aai'],   ['iia', 'aia'],   ['iii', 'aii'],
            ['aiaa', 'aaaa'], ['aiai', 'aaai'], ['aiia', 'aaia'], ['aiii', 'aaii'],
            ['iiaa', 'iaaa'], ['iiai', 'iaai'], ['iiia', 'iaia'], ['iiii', 'iaii'],
            ['liaa', 'laaa'], ['liai', 'laai'], ['liia', 'laia'], ['liii', 'laii'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['ia', 'ia'],     ['ii', 'ii'],
            ['il', 'il'],     ['li', 'li'],
            ['aai', 'aai'],   ['aia', 'aia'],   ['aii', 'aii'],   ['ail', 'ail'],
            ['ali', 'ali'],   ['ial', 'ial'],   ['iil', 'iil'],   ['ila', 'ila'],
            ['ili', 'ili'],   ['ill', 'ill'],   ['lai', 'lai'],   ['lia', 'lia'],
            ['lii', 'lii'],   ['lil', 'lil'],   ['lli', 'lli'],
            ['aaai', 'aaai'], ['aaia', 'aaia'], ['aaii', 'aaii'], ['aail', 'aail'],
            ['aali', 'aali'], ['aial', 'aial'], ['aiil', 'aiil'], ['aila', 'aila'],
            ['aili', 'aili'], ['aill', 'aill'], ['alai', 'alai'], ['alia', 'alia'],
            ['alii', 'alii'], ['alil', 'alil'], ['alli', 'alli'], ['iaaa', 'iaaa'],
            ['iaai', 'iaai'], ['iaal', 'iaal'], ['iaia', 'iaia'], ['iaii', 'iaii'],
            ['iail', 'iail'], ['iala', 'iala'], ['iali', 'iali'], ['iall', 'iall'],
            ['iial', 'iial'], ['iiil', 'iiil'], ['iila', 'iila'], ['iili', 'iili'],
            ['iill', 'iill'], ['ilaa', 'ilaa'], ['ilai', 'ilai'], ['ilal', 'ilal'],
            ['ilia', 'ilia'], ['ilii', 'ilii'], ['ilil', 'ilil'], ['illa', 'illa'],
            ['illi', 'illi'], ['illl', 'illl'], ['laai', 'laai'], ['laia', 'laia'],
            ['laii', 'laii'], ['lail', 'lail'], ['lali', 'lali'], ['lial', 'lial'],
            ['liil', 'liil'], ['lila', 'lila'], ['lili', 'lili'], ['lill', 'lill'],
            ['llai', 'llai'], ['llia', 'llia'], ['llii', 'llii'], ['llil', 'llil'],
            ['llli', 'llli'],
        ],
    });

    testGrammarIO({
        desc: '12b. Replace i by a in i(^l)(^l): maxC_i:4(BS) i -> a || _(^l)(^l)',
        grammar: Replace("i", "a", EMPTY_CONTEXT, Seq(NOTCHARI("l"), NOTCHARI("l")),
                         false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(4),
        io: [
            // Replacement
            ['iaa', 'aaa'],   ['iai', 'aai'],   ['iia', 'aia'],   ['iii', 'aii'],
            ['aiaa', 'aaaa'], ['aiai', 'aaai'], ['aiia', 'aaia'], ['aiii', 'aaii'],
            ['iaaa', 'aaaa'], ['iaai', 'aaai'], ['iaal', 'aaal'], ['iaia', 'aaia'],
            ['iaii', 'aaii'], ['iail', 'aail'], ['iiaa', 'aiaa'], ['iiai', 'aiai'],
            ['iial', 'aial'], ['iiia', 'aiia'], ['iiii', 'aiii'], ['iiil', 'aiil'],
            ['liaa', 'laaa'], ['liai', 'laai'], ['liia', 'laia'], ['liii', 'laii'],
            // Copy through only
            ['i', 'i'],       ['ai', 'ai'],     ['ia', 'ia'],     ['ii', 'ii'],
            ['il', 'il'],     ['li', 'li'],
            ['aai', 'aai'],   ['aia', 'aia'],   ['aii', 'aii'],   ['ail', 'ail'],
            ['ali', 'ali'],   ['ial', 'ial'],   ['iil', 'iil'],   ['ila', 'ila'],
            ['ili', 'ili'],   ['ill', 'ill'],   ['lai', 'lai'],   ['lia', 'lia'],
            ['lii', 'lii'],   ['lil', 'lil'],   ['lli', 'lli'],
            ['aaai', 'aaai'], ['aaia', 'aaia'], ['aaii', 'aaii'], ['aail', 'aail'],
            ['aali', 'aali'], ['aial', 'aial'], ['aiil', 'aiil'], ['aila', 'aila'],
            ['aili', 'aili'], ['aill', 'aill'], ['alai', 'alai'], ['alia', 'alia'],
            ['alii', 'alii'], ['alil', 'alil'], ['alli', 'alli'], ['iala', 'iala'],
            ['iali', 'iali'], ['iall', 'iall'], ['iila', 'iila'], ['iili', 'iili'],
            ['iill', 'iill'], ['ilaa', 'ilaa'], ['ilai', 'ilai'], ['ilal', 'ilal'],
            ['ilia', 'ilia'], ['ilii', 'ilii'], ['ilil', 'ilil'], ['illa', 'illa'],
            ['illi', 'illi'], ['illl', 'illl'], ['laai', 'laai'], ['laia', 'laia'],
            ['laii', 'laii'], ['lail', 'lail'], ['lali', 'lali'], ['lial', 'lial'],
            ['liil', 'liil'], ['lila', 'lila'], ['lili', 'lili'], ['lill', 'lill'],
            ['llai', 'llai'], ['llia', 'llia'], ['llii', 'llii'], ['llil', 'llil'],
            ['llli', 'llli'],
        ],
    });

    testGrammarIO({
        desc: '13a. Replace i by a in #^(h|l)i: maxC_i:3(BS) i -> a || #^(h|l)_',
        grammar: Replace("i", "a", NOTCHARI("h", "l"), EMPTY_CONTEXT, true, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ai', 'aa'],   ['ii', 'ia'],
            ['aia', 'aaa'], ['aih', 'aah'], ['aii', 'aai'], ['ail', 'aal'],
            ['iia', 'iaa'], ['iih', 'iah'], ['iii', 'iai'], ['iil', 'ial'],
            // Copy through only
            ['i', 'i'],     ['hi', 'hi'],   ['ia', 'ia'],   ['ih', 'ih'],
            ['il', 'il'],   ['li', 'li'],
            ['aai', 'aai'], ['ahi', 'ahi'], ['ali', 'ali'], ['hai', 'hai'],
            ['hhi', 'hhi'], ['hia', 'hia'], ['hih', 'hih'], ['hii', 'hii'],
            ['hil', 'hil'], ['hli', 'hli'], ['iaa', 'iaa'], ['iah', 'iah'],
            ['iai', 'iai'], ['ial', 'ial'], ['iha', 'iha'], ['ihh', 'ihh'],
            ['ihi', 'ihi'], ['ihl', 'ihl'], ['ila', 'ila'], ['ilh', 'ilh'],
            ['ili', 'ili'], ['ill', 'ill'], ['lai', 'lai'], ['lhi', 'lhi'],
            ['lia', 'lia'], ['lih', 'lih'], ['lii', 'lii'], ['lil', 'lil'],
            ['lli', 'lli'],
        ],
    });

    testGrammarIO({
        desc: '13b. Replace i by a in ^(h|l)i: maxC_i:3(BS) i -> a || ^(h|l)_',
        grammar: Replace("i", "a", NOTCHARI("h", "l"), EMPTY_CONTEXT, false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ai', 'aa'],   ['ii', 'ia'],
            ['aia', 'aaa'], ['aih', 'aah'], ['aii', 'aai'], ['ail', 'aal'],
            ['iia', 'iaa'], ['iih', 'iah'], ['iii', 'iai'], ['iil', 'ial'],
            ['aai', 'aaa'], ['hai', 'haa'], ['hii', 'hia'], ['iai', 'iaa'],
            ['lai', 'laa'], ['lii', 'lia'],
            // Copy through only
            ['i', 'i'],     ['hi', 'hi'],   ['ia', 'ia'],   ['ih', 'ih'],
            ['il', 'il'],   ['li', 'li'],
            ['ahi', 'ahi'], ['ali', 'ali'], ['hhi', 'hhi'], ['hia', 'hia'],
            ['hih', 'hih'], ['hil', 'hil'], ['hli', 'hli'], ['iaa', 'iaa'],
            ['iah', 'iah'], ['ial', 'ial'], ['iha', 'iha'], ['ihh', 'ihh'],
            ['ihi', 'ihi'], ['ihl', 'ihl'], ['ila', 'ila'], ['ilh', 'ilh'],
            ['ili', 'ili'], ['ill', 'ill'], ['lhi', 'lhi'], ['lia', 'lia'],
            ['lih', 'lih'], ['lil', 'lil'], ['lli', 'lli'],
        ],
    });

    testGrammarIO({
        desc: '14a. Replace i by a in i^(h|l)#: maxC_i:3(BS) i -> a || _^(h|l)#',
        grammar: Replace("i", "a", EMPTY_CONTEXT, NOTCHARI("h", "l"), false, true),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ia', 'aa'],   ['ii', 'ai'],
            ['aia', 'aaa'], ['aii', 'aai'], ['hia', 'haa'], ['hii', 'hai'],
            ['iia', 'iaa'], ['iii', 'iai'], ['lia', 'laa'], ['lii', 'lai'],
            // Copy through only
            ['i', 'i'],     ['ai', 'ai'],   ['hi', 'hi'],   ['ih', 'ih'],
            ['il', 'il'],   ['li', 'li'],
            ['aai', 'aai'], ['ahi', 'ahi'], ['aih', 'aih'], ['ail', 'ail'],
            ['ali', 'ali'], ['hai', 'hai'], ['hhi', 'hhi'], ['hih', 'hih'],
            ['hil', 'hil'], ['hli', 'hli'], ['iaa', 'iaa'], ['iah', 'iah'],
            ['iai', 'iai'], ['ial', 'ial'], ['iha', 'iha'], ['ihh', 'ihh'],
            ['ihi', 'ihi'], ['ihl', 'ihl'], ['iih', 'iih'], ['iil', 'iil'],
            ['ila', 'ila'], ['ilh', 'ilh'], ['ili', 'ili'], ['ill', 'ill'],
            ['lai', 'lai'], ['lhi', 'lhi'], ['lih', 'lih'], ['lil', 'lil'],
            ['lli', 'lli'],
        ],
    });

    testGrammarIO({
        desc: '14b. Replace i by a in i^(h|l): maxC_i:3(BS) i -> a || _^(h|l)',
        grammar: Replace("i", "a", EMPTY_CONTEXT, NOTCHARI("h", "l"), false, false),
        query: BoundingSet('i', '', '', false, false),
        maxChars: MAXCH(3),
        io: [
            // Replacement
            ['ia', 'aa'],   ['ii', 'ai'],
            ['aia', 'aaa'], ['aii', 'aai'], ['hia', 'haa'], ['hii', 'hai'],
            ['iaa', 'aaa'], ['iah', 'aah'], ['iai', 'aai'], ['ial', 'aal'],
            ['iia', 'aia'], ['iih', 'aih'], ['iii', 'aii'], ['iil', 'ail'],
            ['lia', 'laa'], ['lii', 'lai'],
            // Copy through only
            ['i', 'i'],     ['ai', 'ai'],   ['hi', 'hi'],   ['ih', 'ih'],
            ['il', 'il'],   ['li', 'li'],
            ['aai', 'aai'], ['ahi', 'ahi'], ['aih', 'aih'], ['ail', 'ail'],
            ['ali', 'ali'], ['hai', 'hai'], ['hhi', 'hhi'], ['hih', 'hih'],
            ['hil', 'hil'], ['hli', 'hli'], ['iha', 'iha'], ['ihh', 'ihh'],
            ['ihi', 'ihi'], ['ihl', 'ihl'], ['ila', 'ila'], ['ilh', 'ilh'],
            ['ili', 'ili'], ['ill', 'ill'], ['lai', 'lai'], ['lhi', 'lhi'],
            ['lih', 'lih'], ['lil', 'lil'], ['lli', 'lli'],
        ],
    });

});
