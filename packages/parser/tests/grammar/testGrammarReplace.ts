import {
    Any, Count, Cursor, Epsilon,
    Intersect, Not, OptionalReplace,
    Replace, Uni, Vocab,
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2, verbose,
} from '../testUtil';

import {
    StringDict
} from "../../src/utils/func";
import { SILENT, VERBOSE_DEBUG } from "../../src/utils/logging";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

const EMPTY: string = '';

function inputs(expectedOutputs: StringDict[]): StringDict[] {
    let inputs: StringDict[] = [];
    for (const item of expectedOutputs) {
        if (item['$o'] != undefined) {
            let input: StringDict = {...item};
            delete input['$o'];
            inputs.push(input);
        } else {
            inputs.push(item);
        }
    }
    return inputs;
}

function outputs(expectedOutputs: StringDict[]): StringDict[] {
    let outputs: StringDict[] = [];
    for (const item of expectedOutputs) {
        if (item['$o'] != undefined) {
            let output: StringDict = {...item};
            if (output['t3'] == EMPTY)
                delete output['t3'];
            outputs.push(output);
        }
    }
    return outputs;
}

const EMPTY_CONTEXT = Epsilon();

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    // Note: # denotes a word boundary, i.e. starts with or ends with

    testGrammar({
        desc: '1. Replace e by a in hello: e -> a {1+} || #h_llo#',
        grammar: Replace("e", "a", "h", "llo", EMPTY_CONTEXT, true, true, 1),
        vocab: {"$i":4, "$o":5},
        results: [
            {"$i": 'hello', "$o": 'hallo'},
        ],
    });

    testGrammar({
        desc: '2a. Replace e by a in hello: Cnt_7 e -> a {1} || h_llo#',
        grammar: Count({$i:7, $o:7},
                     Replace("e", "a", "h", "llo", 
                        EMPTY_CONTEXT, false, true, 1, 1)),
        results: [
            {$i: 'hello', $o: 'hallo'},
            {$i: 'ehello', $o: 'ehallo'},   {$i: 'hhello', $o: 'hhallo'},
            {$i: 'lhello', $o: 'lhallo'},   {$i: 'ohello', $o: 'ohallo'},
            {$i: 'eehello', $o: 'eehallo'}, {$i: 'ehhello', $o: 'ehhallo'},
            {$i: 'elhello', $o: 'elhallo'}, {$i: 'eohello', $o: 'eohallo'},
            {$i: 'hehello', $o: 'hehallo'}, {$i: 'hhhello', $o: 'hhhallo'},
            {$i: 'hlhello', $o: 'hlhallo'}, {$i: 'hohello', $o: 'hohallo'},
            {$i: 'lehello', $o: 'lehallo'}, {$i: 'lhhello', $o: 'lhhallo'},
            {$i: 'llhello', $o: 'llhallo'}, {$i: 'lohello', $o: 'lohallo'},
            {$i: 'oehello', $o: 'oehallo'}, {$i: 'ohhello', $o: 'ohhallo'},
            {$i: 'olhello', $o: 'olhallo'}, {$i: 'oohello', $o: 'oohallo'},
        ],
    });

    testGrammar({
        desc: '2b. Replace e by a in hello: Cnt_7 e -> a {1+} || h_llo#',
        grammar: Count({$i:7, $o:7},
                     Replace("e", "a", "h", "llo", 
                        EMPTY_CONTEXT, false, true, 1)),
        results: [
            {$i: 'hello', $o: 'hallo'},
            {$i: 'ehello', $o: 'ehallo'},   {$i: 'hhello', $o: 'hhallo'},
            {$i: 'lhello', $o: 'lhallo'},   {$i: 'ohello', $o: 'ohallo'},
            {$i: 'eehello', $o: 'eehallo'}, {$i: 'ehhello', $o: 'ehhallo'},
            {$i: 'elhello', $o: 'elhallo'}, {$i: 'eohello', $o: 'eohallo'},
            {$i: 'hehello', $o: 'hehallo'}, {$i: 'hhhello', $o: 'hhhallo'},
            {$i: 'hlhello', $o: 'hlhallo'}, {$i: 'hohello', $o: 'hohallo'},
            {$i: 'lehello', $o: 'lehallo'}, {$i: 'lhhello', $o: 'lhhallo'},
            {$i: 'llhello', $o: 'llhallo'}, {$i: 'lohello', $o: 'lohallo'},
            {$i: 'oehello', $o: 'oehallo'}, {$i: 'ohhello', $o: 'ohhallo'},
            {$i: 'olhello', $o: 'olhallo'}, {$i: 'oohello', $o: 'oohallo'},
        ],
    });

    const io_3: StringDict[] = [
        // Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},     {$i: 'ehel', $o: 'ehal'},
        {$i: 'hhel', $o: 'hhal'},   {$i: 'lhel', $o: 'lhal'},
        {$i: 'eehel', $o: 'eehal'}, {$i: 'ehhel', $o: 'ehhal'},
        {$i: 'elhel', $o: 'elhal'}, {$i: 'hehel', $o: 'hehal'},
        {$i: 'hhhel', $o: 'hhhal'}, {$i: 'hlhel', $o: 'hlhal'},
        {$i: 'lehel', $o: 'lehal'}, {$i: 'lhhel', $o: 'lhhal'},
        {$i: 'llhel', $o: 'llhal'},
        // Valid Inputs - Copy through
        // There are 351 valid copy through outputs in all for Count(5).
        {$i: 'e', $o: 'e'},         {$i: 'h', $o: 'h'},
        {$i: 'l', $o: 'l'},         {$i: 'ee', $o: 'ee'},
        {$i: 'eh', $o: 'eh'},       {$i: 'el', $o: 'el'},
        {$i: 'he', $o: 'he'},       {$i: 'hh', $o: 'hh'},
        {$i: 'hl', $o: 'hl'},       {$i: 'le', $o: 'le'},
        {$i: 'lh', $o: 'lh'},       {$i: 'll', $o: 'll'},
        // ...
        {$i: 'hle', $o: 'hle'},     {$i: 'elh', $o: 'elh'},
        {$i: 'helh', $o: 'helh'},   {$i: 'helhe', $o: 'helhe'},
        {$i: 'helll', $o: 'helll'},
        // Invalid Inputs
        {$i: 'helhel'},
    ];

    testGrammar({
        desc: '3. Replace e by a in hel: Spotchk_5 e -> a {0+} || h_l#',
        grammar: Count({$i:5, $o:5},
                     Replace("e", "a", "h", "l", 
                        EMPTY_CONTEXT, false, true)),
        vocab: {$i:3, $o:4},
        restriction: inputs(io_3),
        results: outputs(io_3),
    });

    testGrammar({
        desc: '4. Replace e by a in hello: Cnt_7 e -> a {1+} || #h_llo',
        grammar: Count({$i:7, $o:7},
                     Replace("e", "a", "h", "llo", 
                        EMPTY_CONTEXT, true, false, 1)),
        results: [
            {$i: 'hello', $o: 'hallo'},     {$i: 'helloe', $o: 'halloe'},
            {$i: 'helloh', $o: 'halloh'},   {$i: 'hellol', $o: 'hallol'},
            {$i: 'helloo', $o: 'halloo'},   {$i: 'helloee', $o: 'halloee'},
            {$i: 'helloeh', $o: 'halloeh'}, {$i: 'helloel', $o: 'halloel'},
            {$i: 'helloeo', $o: 'halloeo'}, {$i: 'hellohe', $o: 'hallohe'},
            {$i: 'hellohh', $o: 'hallohh'}, {$i: 'hellohl', $o: 'hallohl'},
            {$i: 'helloho', $o: 'halloho'}, {$i: 'hellole', $o: 'hallole'},
            {$i: 'hellolh', $o: 'hallolh'}, {$i: 'helloll', $o: 'halloll'},
            {$i: 'hellolo', $o: 'hallolo'}, {$i: 'hellooe', $o: 'hallooe'},
            {$i: 'hellooh', $o: 'hallooh'}, {$i: 'hellool', $o: 'hallool'},
            {$i: 'hellooo', $o: 'hallooo'},
        ],
    });

    const io_5: StringDict[] = [
        // Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},     {$i: 'hele', $o: 'hale'},
        {$i: 'helh', $o: 'halh'},   {$i: 'hell', $o: 'hall'},
        {$i: 'helee', $o: 'halee'}, {$i: 'heleh', $o: 'haleh'},
        {$i: 'helel', $o: 'halel'}, {$i: 'helhe', $o: 'halhe'},
        {$i: 'helhh', $o: 'halhh'}, {$i: 'helhl', $o: 'halhl'},
        {$i: 'helle', $o: 'halle'}, {$i: 'hellh', $o: 'hallh'},
        {$i: 'helll', $o: 'halll'},
        // Valid Inputs - Copy through
        // There are 351 valid copy through outputs in all for Count(5).
        {$i: 'e', $o: 'e'},         {$i: 'h', $o: 'h'},
        {$i: 'l', $o: 'l'},         {$i: 'ee', $o: 'ee'},
        {$i: 'eh', $o: 'eh'},       {$i: 'el', $o: 'el'},
        {$i: 'he', $o: 'he'},       {$i: 'hh', $o: 'hh'},
        {$i: 'hl', $o: 'hl'},       {$i: 'le', $o: 'le'},
        {$i: 'lh', $o: 'lh'},       {$i: 'll', $o: 'll'},
        // ...
        {$i: 'hle', $o: 'hle'},     {$i: 'elh', $o: 'elh'},
        {$i: 'hhel', $o: 'hhel'},   {$i: 'hehel', $o: 'hehel'},
        {$i: 'hhhel', $o: 'hhhel'},
        // Invalid Inputs
        {$i: 'helhel'},
    ];

    testGrammar({
        desc: '5. Replace e by a in hel: Spotchk_5 e -> a {0+} || #h_l',
        grammar: Count({$i:5, $o:5},
                     Replace("e", "a", "h", "l", 
                        EMPTY_CONTEXT, true, false)),
        restriction: inputs(io_5),
        results: outputs(io_5),
    });

    // skip generation - this test takes ~4 seconds to run.
    testGrammar({
        desc: '6a. Replace e by a in hello: Cnt_6 e -> a {1} || h_llo',
        grammar: Count({$i:6, $o:6},
                     Replace("e", "a", "h", "llo", 
                        EMPTY_CONTEXT, false, false, 1, 1)),
        results: [
            {$i: 'hello', $o: 'hallo'},     {$i: 'helloe', $o: 'halloe'},
            {$i: 'helloh', $o: 'halloh'},   {$i: 'hellol', $o: 'hallol'},
            {$i: 'helloo', $o: 'halloo'},   {$i: 'ehello', $o: 'ehallo'},
            {$i: 'hhello', $o: 'hhallo'},   {$i: 'lhello', $o: 'lhallo'},
            {$i: 'ohello', $o: 'ohallo'},
        ],
        skipGeneration: true,
    });

    // skip generation - this test takes ~5 seconds to run.
    testGrammar({
        desc: '6b. Replace e by a in hello: Cnt_6 e -> a {1+} || h_llo',
        grammar: Count({$i:6, $o:6},
                     Replace("e", "a", "h", "llo", 
                        EMPTY_CONTEXT, false, false, 1)),
        results: [
            {$i: 'hello', $o: 'hallo'},     {$i: 'helloe', $o: 'halloe'},
            {$i: 'helloh', $o: 'halloh'},   {$i: 'hellol', $o: 'hallol'},
            {$i: 'helloo', $o: 'halloo'},   {$i: 'ehello', $o: 'ehallo'},
            {$i: 'hhello', $o: 'hhallo'},   {$i: 'lhello', $o: 'lhallo'},
            {$i: 'ohello', $o: 'ohallo'},
        ],
        skipGeneration: true,
    });

    // skip generation - this test takes more than 20 seconds to run.
    testGrammar({
        desc: '6c. Replace e by a in hello: Cnt_7 e -> a {1+} || h_llo',
        grammar: Count({$i:7, $o:7},
                     Replace(
                         "e", "a",
                         "h", "llo", EMPTY_CONTEXT,
                         false, false, 1
                     )),
        results: [
            {$i: 'hello', $o: 'hallo'},     {$i: 'helloe', $o: 'halloe'},
            {$i: 'helloh', $o: 'halloh'},   {$i: 'hellol', $o: 'hallol'},
            {$i: 'helloo', $o: 'halloo'},   {$i: 'ehello', $o: 'ehallo'},
            {$i: 'hhello', $o: 'hhallo'},   {$i: 'lhello', $o: 'lhallo'},
            {$i: 'ohello', $o: 'ohallo'},   {$i: 'helloee', $o: 'halloee'},
            {$i: 'helloeh', $o: 'halloeh'}, {$i: 'helloel', $o: 'halloel'},
            {$i: 'helloeo', $o: 'halloeo'}, {$i: 'hellohe', $o: 'hallohe'},
            {$i: 'hellohh', $o: 'hallohh'}, {$i: 'hellohl', $o: 'hallohl'},
            {$i: 'helloho', $o: 'halloho'}, {$i: 'hellole', $o: 'hallole'},
            {$i: 'hellolh', $o: 'hallolh'}, {$i: 'helloll', $o: 'halloll'},
            {$i: 'hellolo', $o: 'hallolo'}, {$i: 'hellooe', $o: 'hallooe'},
            {$i: 'hellooh', $o: 'hallooh'}, {$i: 'hellool', $o: 'hallool'},
            {$i: 'hellooo', $o: 'hallooo'}, {$i: 'ehelloe', $o: 'ehalloe'},
            {$i: 'ehelloh', $o: 'ehalloh'}, {$i: 'ehellol', $o: 'ehallol'},
            {$i: 'ehelloo', $o: 'ehalloo'}, {$i: 'hhelloe', $o: 'hhalloe'},
            {$i: 'hhelloh', $o: 'hhalloh'}, {$i: 'hhellol', $o: 'hhallol'},
            {$i: 'hhelloo', $o: 'hhalloo'}, {$i: 'lhelloe', $o: 'lhalloe'},
            {$i: 'lhelloh', $o: 'lhalloh'}, {$i: 'lhellol', $o: 'lhallol'},
            {$i: 'lhelloo', $o: 'lhalloo'}, {$i: 'ohelloe', $o: 'ohalloe'},
            {$i: 'ohelloh', $o: 'ohalloh'}, {$i: 'ohellol', $o: 'ohallol'},
            {$i: 'ohelloo', $o: 'ohalloo'}, {$i: 'eehello', $o: 'eehallo'},
            {$i: 'ehhello', $o: 'ehhallo'}, {$i: 'elhello', $o: 'elhallo'},
            {$i: 'eohello', $o: 'eohallo'}, {$i: 'hehello', $o: 'hehallo'},
            {$i: 'hhhello', $o: 'hhhallo'}, {$i: 'hlhello', $o: 'hlhallo'},
            {$i: 'hohello', $o: 'hohallo'}, {$i: 'lehello', $o: 'lehallo'},
            {$i: 'lhhello', $o: 'lhhallo'}, {$i: 'llhello', $o: 'llhallo'},
            {$i: 'lohello', $o: 'lohallo'}, {$i: 'oehello', $o: 'oehallo'},
            {$i: 'ohhello', $o: 'ohhallo'}, {$i: 'olhello', $o: 'olhallo'},
            {$i: 'oohello', $o: 'oohallo'},
        ],
        skipGeneration: true,
    });

    testGrammar({
        desc: '7a. Replace e by a in hel: Cnt_5 e -> a {1} || h_l',
        grammar: Count({$i:5, $o:5},
                     Replace("e", "a", "h", "l", 
                        EMPTY_CONTEXT, false, false, 1, 1)),
        results: [
            {$i: 'hel', $o: 'hal'},     {$i: 'hele', $o: 'hale'},
            {$i: 'helh', $o: 'halh'},   {$i: 'hell', $o: 'hall'},
            {$i: 'ehel', $o: 'ehal'},   {$i: 'hhel', $o: 'hhal'},
            {$i: 'lhel', $o: 'lhal'},   {$i: 'ehele', $o: 'ehale'},
            {$i: 'ehelh', $o: 'ehalh'}, {$i: 'ehell', $o: 'ehall'},
            {$i: 'hhele', $o: 'hhale'}, {$i: 'hhelh', $o: 'hhalh'},
            {$i: 'hhell', $o: 'hhall'}, {$i: 'lhele', $o: 'lhale'},
            {$i: 'lhelh', $o: 'lhalh'}, {$i: 'lhell', $o: 'lhall'},
            {$i: 'helee', $o: 'halee'}, {$i: 'heleh', $o: 'haleh'},
            {$i: 'helel', $o: 'halel'}, {$i: 'helhe', $o: 'halhe'},
            {$i: 'helhh', $o: 'halhh'}, {$i: 'helhl', $o: 'halhl'},
            {$i: 'helle', $o: 'halle'}, {$i: 'hellh', $o: 'hallh'},
            {$i: 'helll', $o: 'halll'}, {$i: 'eehel', $o: 'eehal'},
            {$i: 'ehhel', $o: 'ehhal'}, {$i: 'elhel', $o: 'elhal'},
            {$i: 'hehel', $o: 'hehal'}, {$i: 'hhhel', $o: 'hhhal'},
            {$i: 'hlhel', $o: 'hlhal'}, {$i: 'lehel', $o: 'lehal'},
            {$i: 'lhhel', $o: 'lhhal'}, {$i: 'llhel', $o: 'llhal'},
        ],
    });

    // Full Generation:
    //  Count=7: 527 results
    //  Count=8: 1877 results
    //  Count=9: 6443 results
    //  Count=10: 21545 results
    // Here we spot check some of the possible 6443 results for
    // 9 characters or less,
    const io_7b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},         {$i: 'hhel', $o: 'hhal'},
        {$i: 'hell', $o: 'hall'},       {$i: 'hhell', $o: 'hhall'},
        {$i: 'hehell', $o: 'hehall'},   {$i: 'elhelel', $o: 'elhalel'},
        {$i: 'hehelhe', $o: 'hehalhe'}, {$i: 'lehhelleh', $o: 'lehhalleh'},
        {$i: 'hlehellll', $o: 'hlehallll'},
        // Some Invalid Inputs
        {$i: 'helhel'},         {$i: 'hle'},
        {$i: 'hlehelllll'},     {$i: 'hellehlehleh'},
        {$i: 'lehlehlehhel'},
    ];

    testGrammar({
        desc: '7b. Replace e by a in hel: Spotchk_9 e -> a {1} || h_l',
        grammar: Count({$i:9, $o:9},
                     Replace("e", "a", "h", "l", 
                        EMPTY_CONTEXT, false, false, 1, 1)),
        restriction: inputs(io_7b),
        results: outputs(io_7b),
    });

    testGrammar({
        desc: '8a. Replace e by a in hel: Cnt_5 e -> a {1+} || h_l',
        grammar: Count({$i:5, $o:5},
                     Replace(
                         "e", "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 1
                     )),
        vocab: {$i:3, $o:4},
        results: [
            {$i: 'hel', $o: 'hal'},     {$i: 'hele', $o: 'hale'},
            {$i: 'helh', $o: 'halh'},   {$i: 'hell', $o: 'hall'},
            {$i: 'ehel', $o: 'ehal'},   {$i: 'hhel', $o: 'hhal'},
            {$i: 'lhel', $o: 'lhal'},   {$i: 'ehele', $o: 'ehale'},
            {$i: 'ehelh', $o: 'ehalh'}, {$i: 'ehell', $o: 'ehall'},
            {$i: 'hhele', $o: 'hhale'}, {$i: 'hhelh', $o: 'hhalh'},
            {$i: 'hhell', $o: 'hhall'}, {$i: 'lhele', $o: 'lhale'},
            {$i: 'lhelh', $o: 'lhalh'}, {$i: 'lhell', $o: 'lhall'},
            {$i: 'helee', $o: 'halee'}, {$i: 'heleh', $o: 'haleh'},
            {$i: 'helel', $o: 'halel'}, {$i: 'helhe', $o: 'halhe'},
            {$i: 'helhh', $o: 'halhh'}, {$i: 'helhl', $o: 'halhl'},
            {$i: 'helle', $o: 'halle'}, {$i: 'hellh', $o: 'hallh'},
            {$i: 'helll', $o: 'halll'}, {$i: 'eehel', $o: 'eehal'},
            {$i: 'ehhel', $o: 'ehhal'}, {$i: 'elhel', $o: 'elhal'},
            {$i: 'hehel', $o: 'hehal'}, {$i: 'hhhel', $o: 'hhhal'},
            {$i: 'hlhel', $o: 'hlhal'}, {$i: 'lehel', $o: 'lehal'},
            {$i: 'lhhel', $o: 'lhhal'}, {$i: 'llhel', $o: 'llhal'},
        ],
    });

    // Full Generation:
    //  Count=7: 537 results (Count=7)
    //  Count=8: 1941 results (Count=8)
    //  Count=9: 6775 results (Count=9)
    //  Count=10: 23068 results (Count=10)
    // Here we spot check some of the possible 6775 results for
    // 9 characters or less.
    const io_8b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},             {$i: 'hele', $o: 'hale'},
        {$i: 'ehel', $o: 'ehal'},           {$i: 'ehele', $o: 'ehale'},
        {$i: 'hehel', $o: 'hehal'},         {$i: 'helhe', $o: 'halhe'},
        {$i: 'helll', $o: 'halll'},         {$i: 'helhel', $o: 'halhal'},
        {$i: 'elhelel', $o: 'elhalel'},     {$i: 'hehelhe', $o: 'hehalhe'},
        {$i: 'helhelh', $o: 'halhalh'},     {$i: 'helehel', $o: 'halehal'},
        {$i: 'heelhel', $o: 'heelhal'},     {$i: 'helheel', $o: 'halheel'},
        {$i: 'helhhell', $o: 'halhhall'},   {$i: 'hhelhell', $o: 'hhalhall'},
        {$i: 'hhelehel', $o: 'hhalehal'},   {$i: 'hehelhel', $o: 'hehalhal'},
        {$i: 'helhelhe', $o: 'halhalhe'},   {$i: 'helhehel', $o: 'halhehal'},
        {$i: 'helhelhel', $o: 'halhalhal'}, {$i: 'hhelhhelh', $o: 'hhalhhalh'},
        {$i: 'ehelehele', $o: 'ehalehale'}, {$i: 'hehelhell', $o: 'hehalhall'},
        {$i: 'hhelhelhe', $o: 'hhalhalhe'}, {$i: 'hehelhhel', $o: 'hehalhhal'},
        {$i: 'hhelhehel', $o: 'hhalhehal'}, {$i: 'hellehelh', $o: 'hallehalh'},
        {$i: 'hellhelhe', $o: 'hallhalhe'},
        // Invalid Inputs
        {$i: 'e'},           {$i: 'he'},
        {$i: 'el'},          {$i: 'hheell'},
        {$i: 'lehlehleh'},   {$i: 'helhelhelh'},
        {$i: 'helhelhheell'},
    ];

    testGrammar({
        desc: '8b. Replace e by a in hel: Spotchk_9 e -> a {1+} || h_l',
        grammar: Count({$i:9, $o:9},
                     Replace(
                         "e", "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 1
                     )),
        vocab: {$i:3, $o:4},
        restriction: inputs(io_8b),
        results: outputs(io_8b),
    });

    // Full Generation:
    //  Count=7: 3280 results
    //  Count=8: 9841 results
    //  Count=9: 29523 results
    //  Count=10: 88560 results
    // Here we spot check some of the possible 29523 results for
    // 9 characters or less.
    const io_9: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},             {$i: 'helh', $o: 'halh'},
        {$i: 'hell', $o: 'hall'},           {$i: 'hhel', $o: 'hhal'},
        {$i: 'lhel', $o: 'lhal'},           {$i: 'hhelh', $o: 'hhalh'},
        {$i: 'hhell', $o: 'hhall'},         {$i: 'lhelh', $o: 'lhalh'},
        {$i: 'lhell', $o: 'lhall'},         {$i: 'helhel', $o: 'halhal'},
        {$i: 'elhelel', $o: 'elhalel'},     {$i: 'hehelhe', $o: 'hehalhe'},
        {$i: 'helhelh', $o: 'halhalh'},     {$i: 'helhell', $o: 'halhall'},
        {$i: 'helhhel', $o: 'halhhal'},     {$i: 'hellhel', $o: 'hallhal'},
        {$i: 'hhelhel', $o: 'hhalhal'},     {$i: 'lhelhel', $o: 'lhalhal'},
        {$i: 'helhhelh', $o: 'halhhalh'},   {$i: 'helhhell', $o: 'halhhall'},
        {$i: 'hellhelh', $o: 'hallhalh'},   {$i: 'hellhell', $o: 'hallhall'},
        {$i: 'hhelhelh', $o: 'hhalhalh'},   {$i: 'hhelhell', $o: 'hhalhall'},
        {$i: 'hhelhhel', $o: 'hhalhhal'},   {$i: 'hhellhel', $o: 'hhallhal'},
        {$i: 'lhelhelh', $o: 'lhalhalh'},   {$i: 'lhelhell', $o: 'lhalhall'},
        {$i: 'lhelhhel', $o: 'lhalhhal'},   {$i: 'lhellhel', $o: 'lhallhal'},
        {$i: 'hhelhhelh', $o: 'hhalhhalh'}, {$i: 'hhelhhell', $o: 'hhalhhall'},
        {$i: 'hhellhelh', $o: 'hhallhalh'}, {$i: 'hhellhell', $o: 'hhallhall'},
        {$i: 'lhelhhelh', $o: 'lhalhhalh'}, {$i: 'lhelhhell', $o: 'lhalhhall'},
        {$i: 'lhellhelh', $o: 'lhallhalh'}, {$i: 'lhellhell', $o: 'lhallhall'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},           {$i: 'he', $o: 'he'},
        {$i: 'leh', $o: 'leh'},       {$i: 'lehle', $o: 'lehle'},
        {$i: 'eehhll', $o: 'eehhll'}, {$i: 'eeehhhlll', $o: 'eeehhhlll'},
        // Invalid Inputs
        {$i: 'helhelhel'},            {$i: 'hhhelhelhh'},
        {$i: 'hehehelelel'},
    ];

    testGrammar({
        desc: '9. Replace e by a in hel: Spotchk_9 e -> a {0,2} || h_l',
        grammar: Count({$i:9, $o:9},
                     Replace(
                         "e", "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:3, $o:4},
        restriction: inputs(io_9),
        results: outputs(io_9),
    });

    // Full Generation:
    //  Count=11: 265720 results
    //  Count=12: 797160 results
    //  Count=13: 2391468 results
    //  Count=14: 7174302 results
    //  Count=17: >180M results
    // Here we spot check some of the possible 7174302 results for
    // 14 characters or less,
    const io_10: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},             {$i: 'hhel', $o: 'hhal'},
        {$i: 'hhell', $o: 'hhall'},         {$i: 'elhelel', $o: 'elhalel'},
        {$i: 'hehelhe', $o: 'hehalhe'},     {$i: 'lhhelhl', $o: 'lhhalhl'},
        {$i: 'helhelhel', $o: 'halhalhal'}, {$i: 'lhellhhel', $o: 'lhallhhal'},
        {$i: 'hlhhelllll', $o: 'hlhhalllll'},
        {$i: 'lhelhhllhel', $o: 'lhalhhllhal'},
        {$i: 'ehelehelehele', $o: 'ehalehalehale'},
        {$i: 'lhelhelhlhell', $o: 'lhalhalhlhall'},
        {$i: 'lhelhelhhlhel', $o: 'lhalhalhhlhal'},
        {$i: 'lhelhelhhlhell', $o: 'lhalhalhhlhall'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},           {$i: 'he', $o: 'he'},
        {$i: 'leh', $o: 'leh'},       {$i: 'lehle', $o: 'lehle'},
        {$i: 'eehhll', $o: 'eehhll'}, {$i: 'eeehhhlll', $o: 'eeehhhlll'},
        {$i: 'lllleeeehhhh', $o: 'lllleeeehhhh'},
        {$i: 'heheheelelel', $o: 'heheheelelel'},
        // Some Invalid Inputs
        {$i: 'helhelhelhel'},         {$i: 'hlhellhhelhlhellh'},
    ];

    testGrammar({
        desc: '10. Replace e by a in hel: Spotchk_14 e -> a {0,3} || h_l',
        grammar: Count({$i:14, $o:14},
                     Replace(
                         "e", "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 3
                     )),
        vocab: {$i:3, $o:4},
        restriction: inputs(io_10),
        results: outputs(io_10),
    });

    testGrammar({
        desc: '11a. Replace e by a in he: Cnt_4 e -> a {0,2} || h_',
        grammar: Count({$i:4, $o:4},
                     Replace(
                         "e", "a",
                         "h", "", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'he', $o: 'ha'},     {$i: 'ehe', $o: 'eha'},
            {$i: 'hee', $o: 'hae'},   {$i: 'heh', $o: 'hah'},
            {$i: 'hhe', $o: 'hha'},   {$i: 'eehe', $o: 'eeha'},
            {$i: 'ehee', $o: 'ehae'}, {$i: 'eheh', $o: 'ehah'},
            {$i: 'ehhe', $o: 'ehha'}, {$i: 'heee', $o: 'haee'},
            {$i: 'heeh', $o: 'haeh'}, {$i: 'hehe', $o: 'haha'},
            {$i: 'hehh', $o: 'hahh'}, {$i: 'hhee', $o: 'hhae'},
            {$i: 'hheh', $o: 'hhah'}, {$i: 'hhhe', $o: 'hhha'},
            // Copy through only
            {$i: 'e', $o: 'e'},       {$i: 'h', $o: 'h'},
            {$i: 'ee', $o: 'ee'},     {$i: 'eh', $o: 'eh'},
            {$i: 'hh', $o: 'hh'},     {$i: 'eee', $o: 'eee'},
            {$i: 'eeh', $o: 'eeh'},   {$i: 'ehh', $o: 'ehh'},
            {$i: 'hhh', $o: 'hhh'},   {$i: 'eeee', $o: 'eeee'},
            {$i: 'eeeh', $o: 'eeeh'}, {$i: 'eehh', $o: 'eehh'},
            {$i: 'ehhh', $o: 'ehhh'}, {$i: 'hhhh', $o: 'hhhh'},
        ],
    });

    // Full Generation:
    //  Count=7: 246 results
    //  Count=8: 465 results
    //  Count=9: 847 results
    //  Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // 10 characters or less,
    const io_11b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'he', $o: 'ha'},               {$i: 'heh', $o: 'hah'},
        {$i: 'eheh', $o: 'ehah'},           {$i: 'heheee', $o: 'hahaee'},
        {$i: 'hehheh', $o: 'hahhah'},       {$i: 'hehhhe', $o: 'hahhha'},
        {$i: 'hheheh', $o: 'hhahah'},       {$i: 'hhehhe', $o: 'hhahha'},
        {$i: 'hhhehe', $o: 'hhhaha'},       {$i: 'hhhehh', $o: 'hhhahh'},
        {$i: 'hehhehh', $o: 'hahhahh'},     {$i: 'hehhheh', $o: 'hahhhah'},
        {$i: 'eheheee', $o: 'ehahaee'},     {$i: 'eheehee', $o: 'ehaehae'},
        {$i: 'hhehhhehh', $o: 'hhahhhahh'}, {$i: 'hhhehhehh', $o: 'hhhahhahh'},
        {$i: 'hhhehhheh', $o: 'hhhahhhah'},
        {$i: 'hhhehhhehh', $o: 'hhhahhhahh'},
        {$i: 'eeheeeheee', $o: 'eehaeehaee'},
        {$i: 'ehheeeheeh', $o: 'ehhaeehaeh'},
        {$i: 'eeehehehhh', $o: 'eeehahahhh'},
        {$i: 'eeehehhhhe', $o: 'eeehahhhha'},
        {$i: 'heeeeeeehe', $o: 'haeeeeeeha'},
        {$i: 'hehehhhhhh', $o: 'hahahhhhhh'},
        {$i: 'heheeeeeee', $o: 'hahaeeeeee'},
        {$i: 'hhhhhhhehe', $o: 'hhhhhhhaha'},
        {$i: 'eeeeeehehe', $o: 'eeeeeehaha'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},               {$i: 'hh', $o: 'hh'},
        {$i: 'eee', $o: 'eee'},           {$i: 'eeehhh', $o: 'eeehhh'},
        {$i: 'eeeehhhh', $o: 'eeeehhhh'}, {$i: 'eeeeehhhhh', $o: 'eeeeehhhhh'},
        // Some Invalid Inputs
        {$i: 'hehehe'},                   {$i: 'hehehehe'},
        {$i: 'hehehehhhhh'},              {$i: 'eeeeehehehe'},
    ];

    testGrammar({
        desc: '11b. Replace e by a in he: Spotchk_10 e -> a {0,2} || h_',
        grammar: Count({$i:10, $o:10},
                     Replace(
                         "e", "a",
                         "h", "", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        restriction: inputs(io_11b),
        results: outputs(io_11b),
    });

    // Full Generation:
    //  Count=7: 246 results
    //  Count=8: 465 results
    //  Count=9: 847 results
    //  Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // 10 characters or less,
    const io_12: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'he', $o: 'ha'},               {$i: 'heh', $o: 'hah'},
        {$i: 'eheh', $o: 'ehah'},           {$i: 'heheee', $o: 'hahaee'},
        {$i: 'hehheh', $o: 'hahhah'},       {$i: 'hehhhe', $o: 'hahhha'},
        {$i: 'hheheh', $o: 'hhahah'},       {$i: 'hhehhe', $o: 'hhahha'},
        {$i: 'hhhehe', $o: 'hhhaha'},       {$i: 'hhhehh', $o: 'hhhahh'},
        {$i: 'hehhehh', $o: 'hahhahh'},     {$i: 'hehhheh', $o: 'hahhhah'},
        {$i: 'eheheee', $o: 'ehahaee'},     {$i: 'eheehee', $o: 'ehaehae'},
        {$i: 'hhehhhehh', $o: 'hhahhhahh'}, {$i: 'hhhehhehh', $o: 'hhhahhahh'},
        {$i: 'hhhehhheh', $o: 'hhhahhhah'},
        {$i: 'hhhehhhehh', $o: 'hhhahhhahh'},
        {$i: 'eeheeeheee', $o: 'eehaeehaee'},
        {$i: 'ehheeeheeh', $o: 'ehhaeehaeh'},
        {$i: 'eeehehehhh', $o: 'eeehahahhh'},
        {$i: 'eeehehhhhe', $o: 'eeehahhhha'},
        {$i: 'heeeeeeehe', $o: 'haeeeeeeha'},
        {$i: 'hehehhhhhh', $o: 'hahahhhhhh'},
        {$i: 'heheeeeeee', $o: 'hahaeeeeee'},
        {$i: 'hhhhhhhehe', $o: 'hhhhhhhaha'},
        {$i: 'eeeeeehehe', $o: 'eeeeeehaha'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},               {$i: 'hh', $o: 'hh'},
        {$i: 'eee', $o: 'eee'},           {$i: 'eeehhh', $o: 'eeehhh'},
        {$i: 'eeeehhhh', $o: 'eeeehhhh'}, {$i: 'eeeeehhhhh', $o: 'eeeeehhhhh'},
        // Some Invalid Inputs
        {$i: 'hehehe'},                   {$i: 'hehehehe'},
        {$i: 'hehehhhhhhh'},              {$i: 'eeeeeeehehe'},
    ];

    testGrammar({
        desc: '12. Replace e by a in he: Spotchk_10 e -> a {0,2} || h_ε',
        grammar: Count({$i:10, $o:10},
                     Replace(
                         "e", "a",
                         "h", EMPTY_CONTEXT, EMPTY_CONTEXT, 
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        restriction: inputs(io_12),
        results: outputs(io_12),
    });

    testGrammar({
        desc: '13a. Replace e by a in el: Cnt_4 e -> a {0,2} || ε_l',
        grammar: Count({$i:4, $o:4},
                     Replace(
                         "e", "a",
                         EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'el', $o: 'al'},     {$i: 'eel', $o: 'eal'},
            {$i: 'ele', $o: 'ale'},   {$i: 'ell', $o: 'all'},
            {$i: 'lel', $o: 'lal'},   {$i: 'eeel', $o: 'eeal'},
            {$i: 'eele', $o: 'eale'}, {$i: 'eell', $o: 'eall'},
            {$i: 'elee', $o: 'alee'}, {$i: 'elel', $o: 'alal'},
            {$i: 'elle', $o: 'alle'}, {$i: 'elll', $o: 'alll'},
            {$i: 'leel', $o: 'leal'}, {$i: 'lele', $o: 'lale'},
            {$i: 'lell', $o: 'lall'}, {$i: 'llee', $o: 'llee'},
            {$i: 'llel', $o: 'llal'},
            // Copy through only
            {$i: 'e', $o: 'e'},       {$i: 'l', $o: 'l'},
            {$i: 'ee', $o: 'ee'},     {$i: 'le', $o: 'le'},
            {$i: 'll', $o: 'll'},     {$i: 'eee', $o: 'eee'},
            {$i: 'lee', $o: 'lee'},   {$i: 'lle', $o: 'lle'},
            {$i: 'lll', $o: 'lll'},   {$i: 'eeee', $o: 'eeee'},
            {$i: 'leee', $o: 'leee'}, {$i: 'llle', $o: 'llle'},
            {$i: 'llll', $o: 'llll'},
        ],
    });

    // Full Generation:
    //  Count=7: 246 results
    //  Count=8: 465 results
    //  Count=9: 847 results
    //  Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // 10 characters or less,
    const io_13b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'el', $o: 'al'},               {$i: 'lel', $o: 'lal'},
        {$i: 'elel', $o: 'alal'},           {$i: 'eeelel', $o: 'eealal'},
        {$i: 'lellel', $o: 'lallal'},       {$i: 'elllel', $o: 'alllal'},
        {$i: 'lelell', $o: 'lalall'},       {$i: 'ellell', $o: 'allall'},
        {$i: 'llelel', $o: 'llalal'},       {$i: 'llelll', $o: 'llalll'},
        {$i: 'ellelll', $o: 'allalll'},     {$i: 'elllell', $o: 'alllall'},
        {$i: 'eelelee', $o: 'ealalee'},     {$i: 'eeleele', $o: 'ealeale'},
        {$i: 'lelllelll', $o: 'lalllalll'}, {$i: 'llellelll', $o: 'llallalll'},
        {$i: 'llelllell', $o: 'llalllall'},
        {$i: 'llelllelll', $o: 'llalllalll'},
        {$i: 'eeeleeelee', $o: 'eealeealee'},
        {$i: 'leeleeelle', $o: 'lealeealle'},
        {$i: 'eeeelellll', $o: 'eeealallll'},
        {$i: 'eeeellllel', $o: 'eeeallllal'},
        {$i: 'eleeeeeeel', $o: 'aleeeeeeal'},
        {$i: 'elelllllll', $o: 'alalllllll'},
        {$i: 'eleleeeeee', $o: 'alaleeeeee'},
        {$i: 'llllllelel', $o: 'llllllalal'},
        {$i: 'eeeeeeelel', $o: 'eeeeeealal'},
        // Some Valid Inputs - Copy through only
        {$i: 'l', $o: 'l'},               {$i: 'll', $o: 'll'},
        {$i: 'eee', $o: 'eee'},           {$i: 'llleee', $o: 'llleee'},
        {$i: 'lllleeee', $o: 'lllleeee'}, {$i: 'llllleeeee', $o: 'llllleeeee'},
        // Some Invalid Inputs
        {$i: 'elelel'},                   {$i: 'elellllllll'},
        {$i: 'eeeeeeeelel'},
    ];

    testGrammar({
        desc: '13b. Replace e by a in el: Spotchk_10 e -> a {0,2} || ε_l',
        grammar: Count({$i:10, $o:10},
                     Replace(
                         "e", "a",
                         EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        restriction: inputs(io_13b),
        results: outputs(io_13b),
    });

    testGrammar({
        desc: '14. Replace e by a: Cnt_3 e -> a {0,2} (vocab $i:ehl)',
        grammar: Count({$i:3, $o:3},
                     Vocab({$i:'ehl'},
                         Replace(
                             "e", "a",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                         ))),
        vocab: {$i:3, $o:4},
        results: [
            {},
            // Replacement
            {$i: 'e', $o: 'a'},     {$i: 'ee', $o: 'aa'},
            {$i: 'eh', $o: 'ah'},   {$i: 'el', $o: 'al'},
            {$i: 'he', $o: 'ha'},   {$i: 'le', $o: 'la'},
            {$i: 'eeh', $o: 'aah'}, {$i: 'eel', $o: 'aal'},
            {$i: 'ehe', $o: 'aha'}, {$i: 'ehh', $o: 'ahh'},
            {$i: 'ehl', $o: 'ahl'}, {$i: 'ele', $o: 'ala'},
            {$i: 'elh', $o: 'alh'}, {$i: 'ell', $o: 'all'},
            {$i: 'hee', $o: 'haa'}, {$i: 'heh', $o: 'hah'},
            {$i: 'hel', $o: 'hal'}, {$i: 'hhe', $o: 'hha'},
            {$i: 'hle', $o: 'hla'}, {$i: 'lee', $o: 'laa'},
            {$i: 'leh', $o: 'lah'}, {$i: 'lel', $o: 'lal'},
            {$i: 'lhe', $o: 'lha'}, {$i: 'lle', $o: 'lla'},
            // Copy through only
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'hh', $o: 'hh'},   {$i: 'hl', $o: 'hl'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hlh', $o: 'hlh'}, {$i: 'hll', $o: 'hll'},
            {$i: 'lhh', $o: 'lhh'}, {$i: 'lhl', $o: 'lhl'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  Count=8: 7680 results
    //  Count=9: 20480 results
    //  Count=10: 53504 results
    //  Count=11: 137216 results
    // Here we spot check some of the possible 137216 results for
    // 11 characters or less,
    const io_15: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'e', $o: 'a'},             {$i: 'ee', $o: 'aa'},
        {$i: 'he', $o: 'ha'},           {$i: 'ell', $o: 'all'},
        {$i: 'eee', $o: 'aaa'},         {$i: 'ehhe', $o: 'ahha'},
        {$i: 'eehh', $o: 'aahh'},       {$i: 'lehel', $o: 'lahal'},
        {$i: 'ehehe', $o: 'ahaha'},     {$i: 'ellee', $o: 'allaa'},
        {$i: 'heeeh', $o: 'haaah'},     {$i: 'lehhe', $o: 'lahha'},
        {$i: 'eheehl', $o: 'ahaahl'},   {$i: 'ehhell', $o: 'ahhall'},
        {$i: 'hehhee', $o: 'hahhaa'},   {$i: 'ehehehl', $o: 'ahahahl'},
        {$i: 'ehheehh', $o: 'ahhaahh'}, {$i: 'ellelle', $o: 'allalla'},
        {$i: 'elleehh', $o: 'allaahh'}, {$i: 'heheheh', $o: 'hahahah'},
        {$i: 'hheeehh', $o: 'hhaaahh'}, {$i: 'hehlehle', $o: 'hahlahla'},
        {$i: 'hhehhehh', $o: 'hhahhahh'},
        {$i: 'hhehleheh', $o: 'hhahlahah'},
        {$i: 'hleellell', $o: 'hlaallall'},
        {$i: 'llelhelehh', $o: 'llalhalahh'},
        {$i: 'llehlehlehh', $o: 'llahlahlahh'},
        {$i: 'llellellell', $o: 'llallallall'},
        {$i: 'ehlhlhlhlhl', $o: 'ahlhlhlhlhl'},
        {$i: 'lllllllllle', $o: 'lllllllllla'},
        {$i: 'ehlhlhlhlhe', $o: 'ahlhlhlhlha'},
        // Some Valid Inputs - Copy through
        {$i: 'l', $o: 'l'},
        {$i: 'hh', $o: 'hh'},
        {$i: 'hhll', $o: 'hhll'},
        {$i: 'hlhlhlhl', $o: 'hlhlhlhl'},
        {$i: 'lhlhlhlhlh', $o: 'lhlhlhlhlh'},
        {$i: 'hhhhhllllll', $o: 'hhhhhllllll'},
        // Some Invalid Inputs
        {$i: 'eeee'},
        {$i: 'helhhhhellllhel'},
    ];

    testGrammar({
        desc: '15. Replace e by a: Spotchk_11 e -> a {0,3} (vocab $i:ehl)',
        grammar: Count({$i:11, $o:11},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "a",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 3
                     	 ))),
        vocab: {$i:3, $o:4},
        restriction: inputs(io_15),
        results: outputs(io_15),
    });

    // Full Generation:
    //  Count=8: 8428 results
    //  Count=9: 24636 results
    //  Count=10: 72012 results
    //  Count=11: 210492 results
    //  Count=12: 615268 results
    // Here we spot check some of the possible 615268 results for
    // 12 characters or less,
    const io_16: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'e', $o: 'e'},                 {$i: 'ee', $o: 'ee'},
        {$i: 'hel', $o: 'heel'},            {$i: 'helh', $o: 'heelh'},
        {$i: 'hele', $o: 'heele'},          {$i: 'lhel', $o: 'lheel'},
        {$i: 'hhele', $o: 'hheele'},        {$i: 'ehele', $o: 'eheele'},
        {$i: 'lhell', $o: 'lheell'},        {$i: 'helhel', $o: 'heelheel'},
        {$i: 'elhelel', $o: 'elheelel'},    {$i: 'hehelhe', $o: 'heheelhe'},
        {$i: 'helhele', $o: 'heelheele'},   {$i: 'helhhel', $o: 'heelhheel'},
        {$i: 'lhelhel', $o: 'lheelheel'},   {$i: 'helhhele', $o: 'heelhheele'},
        {$i: 'helehell', $o: 'heeleheell'}, {$i: 'hhelhell', $o: 'hheelheell'},
        {$i: 'hhellhel', $o: 'hheellheel'}, {$i: 'ehelhele', $o: 'eheelheele'},
        {$i: 'ehelhhel', $o: 'eheelhheel'}, {$i: 'lhelhele', $o: 'lheelheele'},
        {$i: 'lhellhel', $o: 'lheellheel'},
        {$i: 'hhelehele', $o: 'hheeleheele'},
        {$i: 'ehelehele', $o: 'eheeleheele'},
        {$i: 'lhelehell', $o: 'lheeleheell'},
        {$i: 'heleeeehel', $o: 'heeleeeeheel'},
        {$i: 'hhhelhelhh', $o: 'hhheelheelhh'},
        {$i: 'lllhelehel', $o: 'lllheeleheel'},
        {$i: 'eeeeheleeee', $o: 'eeeeheeleeee'},
        {$i: 'hhhheeeellll', $o: 'hhhheeeellll'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},           {$i: 'he', $o: 'he'},
        {$i: 'leh', $o: 'leh'},       {$i: 'lehle', $o: 'lehle'},
        {$i: 'eehhll', $o: 'eehhll'}, {$i: 'eeehhhlll', $o: 'eeehhhlll'},
        {$i: 'lllleeeehhhh', $o: 'lllleeeehhhh'},
        {$i: 'heheheelelel', $o: 'heheheelelel'},
        // Some Invalid Inputs
        {$i: 'helhelhel'},  {$i: 'hhhhhhellllll'},
    ];

    testGrammar({
        desc: '16. Replace e by ee in hel: Spotchk_12 e -> ee {0,2} || h_l',
        grammar: Count({$i:12},
                     Replace(
                         "e", "ee",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:3, $o:3},
        restriction: inputs(io_16),
        results: outputs(io_16),
    });

    testGrammar({
        desc: '17. Replace e by ee in hel: Cnt_i:6 e -> ee {1+} || #h_l',
        grammar: Count({$i:6},
                     Replace(
                         "e", "ee",
                         "h", "l", EMPTY_CONTEXT, 
                         true, false, 1
                     )),
        vocab: {$i:3, $o:3},
        results: [
            {$i: 'hel', $o: 'heel'},       {$i: 'helh', $o: 'heelh'},
            {$i: 'hele', $o: 'heele'},     {$i: 'hell', $o: 'heell'},
            {$i: 'helhh', $o: 'heelhh'},   {$i: 'helhe', $o: 'heelhe'},
            {$i: 'helhl', $o: 'heelhl'},   {$i: 'heleh', $o: 'heeleh'},
            {$i: 'helee', $o: 'heelee'},   {$i: 'helel', $o: 'heelel'},
            {$i: 'hellh', $o: 'heellh'},   {$i: 'helle', $o: 'heelle'},
            {$i: 'helll', $o: 'heelll'},   {$i: 'helhhh', $o: 'heelhhh'},
            {$i: 'helhhe', $o: 'heelhhe'}, {$i: 'helhhl', $o: 'heelhhl'},
            {$i: 'helheh', $o: 'heelheh'}, {$i: 'helhee', $o: 'heelhee'},
            {$i: 'helhel', $o: 'heelhel'}, {$i: 'helhlh', $o: 'heelhlh'},
            {$i: 'helhle', $o: 'heelhle'}, {$i: 'helhll', $o: 'heelhll'},
            {$i: 'helehh', $o: 'heelehh'}, {$i: 'helehe', $o: 'heelehe'},
            {$i: 'helehl', $o: 'heelehl'}, {$i: 'heleeh', $o: 'heeleeh'},
            {$i: 'heleee', $o: 'heeleee'}, {$i: 'heleel', $o: 'heeleel'},
            {$i: 'helelh', $o: 'heelelh'}, {$i: 'helele', $o: 'heelele'},
            {$i: 'helell', $o: 'heelell'}, {$i: 'hellhh', $o: 'heellhh'},
            {$i: 'hellhe', $o: 'heellhe'}, {$i: 'hellhl', $o: 'heellhl'},
            {$i: 'helleh', $o: 'heelleh'}, {$i: 'hellee', $o: 'heellee'},
            {$i: 'hellel', $o: 'heellel'}, {$i: 'helllh', $o: 'heelllh'},
            {$i: 'hellle', $o: 'heellle'}, {$i: 'hellll', $o: 'heellll'},                
        ],
    });

    const io_18: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},              {$i: 'e', $o: 'e'},
        {$i: 'l', $o: 'l'},              {$i: 'hl', $o: 'hl'},
        {$i: 'eh', $o: 'eh'},            {$i: 'll', $o: 'll'},
        {$i: 'heh', $o: 'heh'},          {$i: 'hee', $o: 'hee'},
        {$i: 'elh', $o: 'elh'},          {$i: 'ell', $o: 'ell'},
        {$i: 'lel', $o: 'lel'},          {$i: 'lll', $o: 'lll'},
        {$i: 'hhhh', $o: 'hhhh'},        {$i: 'hhee', $o: 'hhee'},
        {$i: 'hhel', $o: 'hhel'},        {$i: 'heel', $o: 'heel'},
        {$i: 'eheh', $o: 'eheh'},        {$i: 'ehee', $o: 'ehee'},
        {$i: 'ehel', $o: 'ehel'},        {$i: 'ellh', $o: 'ellh'},
        {$i: 'lheh', $o: 'lheh'},        {$i: 'lhel', $o: 'lhel'},
        {$i: 'lhle', $o: 'lhle'},        {$i: 'llll', $o: 'llll'},
        {$i: 'hhelh', $o: 'hhelh'},      {$i: 'elhelel', $o: 'elhelel'},
        {$i: 'hehelhe', $o: 'hehelhe'},  {$i: 'lhhelhl', $o: 'lhhelhl'},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'heel'},         {$i: 'helh', $o: 'heelh'},
        {$i: 'hele', $o: 'heele'},       {$i: 'hell', $o: 'heell'},
        {$i: 'helhel', $o: 'heelhel'},   {$i: 'helhelh', $o: 'heelhelh'},
        {$i: 'helhele', $o: 'heelhele'}, {$i: 'helhell', $o: 'heelhell'},
        {$i: 'helhhel', $o: 'heelhhel'}, {$i: 'helehel', $o: 'heelehel'},
        {$i: 'hellhel', $o: 'heellhel'},
        // Some Invalid Inputs
        {$i: 'helhelhel'},
    ];

    testGrammar({
        desc: '18. Replace e by ee in hel: Spotchk_7 e -> ee {0+} || #h_l',
        grammar: Count({$i:7},
                     Replace(
                         "e", "ee",
                         "h", "l", EMPTY_CONTEXT, 
                         true, false, 0
                     )),
        vocab: {$i:3, $o:3},
        restriction: inputs(io_18),
        results: outputs(io_18),
    });

    testGrammar({
        desc: '19. Replace e by ee in hel: Cnt_i:6 e -> ee {1+} || h_l#',
        grammar: Count({$i:6},
                     Replace(
                         "e", "ee",
                         "h", "l", EMPTY_CONTEXT,
                         false, true, 1
                     )),
        vocab: {$i:3, $o:3},
        results: [
            {$i: 'hel', $o: 'heel'},       {$i: 'hhel', $o: 'hheel'},
            {$i: 'ehel', $o: 'eheel'},     {$i: 'lhel', $o: 'lheel'},
            {$i: 'hhhel', $o: 'hhheel'},   {$i: 'hehel', $o: 'heheel'},
            {$i: 'hlhel', $o: 'hlheel'},   {$i: 'ehhel', $o: 'ehheel'},
            {$i: 'eehel', $o: 'eeheel'},   {$i: 'elhel', $o: 'elheel'},
            {$i: 'lhhel', $o: 'lhheel'},   {$i: 'lehel', $o: 'leheel'},
            {$i: 'llhel', $o: 'llheel'},   {$i: 'hhhhel', $o: 'hhhheel'},
            {$i: 'hhehel', $o: 'hheheel'}, {$i: 'hhlhel', $o: 'hhlheel'},
            {$i: 'hehhel', $o: 'hehheel'}, {$i: 'heehel', $o: 'heeheel'},
            {$i: 'helhel', $o: 'helheel'}, {$i: 'hlhhel', $o: 'hlhheel'},
            {$i: 'hlehel', $o: 'hleheel'}, {$i: 'hllhel', $o: 'hllheel'},
            {$i: 'ehhhel', $o: 'ehhheel'}, {$i: 'ehehel', $o: 'eheheel'},
            {$i: 'ehlhel', $o: 'ehlheel'}, {$i: 'eehhel', $o: 'eehheel'},
            {$i: 'eeehel', $o: 'eeeheel'}, {$i: 'eelhel', $o: 'eelheel'},
            {$i: 'elhhel', $o: 'elhheel'}, {$i: 'elehel', $o: 'eleheel'},
            {$i: 'ellhel', $o: 'ellheel'}, {$i: 'lhhhel', $o: 'lhhheel'},
            {$i: 'lhehel', $o: 'lheheel'}, {$i: 'lhlhel', $o: 'lhlheel'},
            {$i: 'lehhel', $o: 'lehheel'}, {$i: 'leehel', $o: 'leeheel'},
            {$i: 'lelhel', $o: 'lelheel'}, {$i: 'llhhel', $o: 'llhheel'},
            {$i: 'llehel', $o: 'lleheel'}, {$i: 'lllhel', $o: 'lllheel'},
        ],
    });

    const io_20: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},         {$i: 'e', $o: 'e'},
        {$i: 'l', $o: 'l'},         {$i: 'hl', $o: 'hl'},
        {$i: 'eh', $o: 'eh'},       {$i: 'll', $o: 'll'},
        {$i: 'heh', $o: 'heh'},     {$i: 'hee', $o: 'hee'},
        {$i: 'elh', $o: 'elh'},     {$i: 'ell', $o: 'ell'},
        {$i: 'lel', $o: 'lel'},     {$i: 'lll', $o: 'lll'},
        {$i: 'hhhh', $o: 'hhhh'},   {$i: 'hhee', $o: 'hhee'},
        {$i: 'helh', $o: 'helh'},   {$i: 'hele', $o: 'hele'},
        {$i: 'hell', $o: 'hell'},   {$i: 'heel', $o: 'heel'},
        {$i: 'eheh', $o: 'eheh'},   {$i: 'ehee', $o: 'ehee'},
        {$i: 'ehll', $o: 'ehll'},   {$i: 'ellh', $o: 'ellh'},
        {$i: 'lhee', $o: 'lhee'},   {$i: 'lheh', $o: 'lheh'},
        {$i: 'lhle', $o: 'lhle'},   {$i: 'llll', $o: 'llll'},
        {$i: 'hhelh', $o: 'hhelh'}, {$i: 'elhelel', $o: 'elhelel'},
        {$i: 'hehelhe', $o: 'hehelhe'},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'heel'},         {$i: 'hhel', $o: 'hheel'},
        {$i: 'ehel', $o: 'eheel'},       {$i: 'lhel', $o: 'lheel'},
        {$i: 'helhel', $o: 'helheel'},   {$i: 'hhelhel', $o: 'hhelheel'},
        {$i: 'ehelhel', $o: 'ehelheel'}, {$i: 'lhelhel', $o: 'lhelheel'},
        {$i: 'helhhel', $o: 'helhheel'}, {$i: 'helehel', $o: 'heleheel'},
        {$i: 'hellhel', $o: 'hellheel'},
        // Some Invalid Inputs
        {$i: 'helhelhel'},
    ];

    testGrammar({
        desc: '20. Replace e by ee in hel: Spotchk_7 e -> ee {0+} || h_l#',
        grammar: Count({$i:7},
                     Replace(
                         "e", "ee",
                         "h", "l", EMPTY_CONTEXT,
                         false, true, 0
                     )),
        vocab: {$i:3, $o:3},
        restriction: inputs(io_20),
        results: outputs(io_20),
    });

    testGrammar({
        desc: '21a. Replace e by ee in he: Cnt_i:4 e -> ee {0,2} || h_',
        grammar: Count({$i:4},
                     Replace(
                         "e", "ee",
                         "h", EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'he', $o: 'hee'},     {$i: 'ehe', $o: 'ehee'},
            {$i: 'hee', $o: 'heee'},   {$i: 'heh', $o: 'heeh'},
            {$i: 'hhe', $o: 'hhee'},   {$i: 'eehe', $o: 'eehee'},
            {$i: 'ehee', $o: 'eheee'}, {$i: 'eheh', $o: 'eheeh'},
            {$i: 'ehhe', $o: 'ehhee'}, {$i: 'heee', $o: 'heeee'},
            {$i: 'heeh', $o: 'heeeh'}, {$i: 'hehe', $o: 'heehee'},
            {$i: 'hehh', $o: 'heehh'}, {$i: 'hhee', $o: 'hheee'},
            {$i: 'hheh', $o: 'hheeh'}, {$i: 'hhhe', $o: 'hhhee'},
            // Copy through only
            {$i: 'e', $o: 'e'},       {$i: 'h', $o: 'h'},
            {$i: 'ee', $o: 'ee'},     {$i: 'eh', $o: 'eh'},
            {$i: 'hh', $o: 'hh'},     {$i: 'eee', $o: 'eee'},
            {$i: 'eeh', $o: 'eeh'},   {$i: 'ehh', $o: 'ehh'},
            {$i: 'hhh', $o: 'hhh'},   {$i: 'eeee', $o: 'eeee'},
            {$i: 'eeeh', $o: 'eeeh'}, {$i: 'eehh', $o: 'eehh'},
            {$i: 'ehhh', $o: 'ehhh'}, {$i: 'hhhh', $o: 'hhhh'},
        ],
    });

    // Full Generation:
    //  $i Count=7: 246 results
    //  $i Count=8: 465 results
    //  $i Count=9: 847 results
    //  $i Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // 10 characters or less on $i.
    const io_21b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},             {$i: 'e', $o: 'e'},
        {$i: 'eeehhh', $o: 'eeehhh'},   {$i: 'eeeeeeee', $o: 'eeeeeeee'},
        {$i: 'eeeeehhhhh', $o: 'eeeeehhhhh'},
        // Some Valid Inputs - Replacement
        {$i: 'he', $o: 'hee'},          {$i: 'hee', $o: 'heee'},
        {$i: 'hhe', $o: 'hhee'},        {$i: 'hehe', $o: 'heehee'},
        {$i: 'hheh', $o: 'hheeh'},      {$i: 'ehehe', $o: 'eheehee'},
        {$i: 'heheh', $o: 'heeheeh'},   {$i: 'hehee', $o: 'heeheee'},
        {$i: 'hehhe', $o: 'heehhee'},   {$i: 'hhehe', $o: 'hheehee'},
        {$i: 'eeheee', $o: 'eeheeee'},  {$i: 'ehehee', $o: 'eheeheee'},
        {$i: 'eheehe', $o: 'eheeehee'}, {$i: 'hehheh', $o: 'heehheeh'},
        {$i: 'hehhhe', $o: 'heehhhee'}, {$i: 'heehee', $o: 'heeeheee'},
        {$i: 'hhhehh', $o: 'hhheehh'},  {$i: 'hehehhh', $o: 'heeheehhh'},
        {$i: 'hhehheh', $o: 'hheehheeh'},
        {$i: 'eeeeeehehe', $o: 'eeeeeeheehee'},
        {$i: 'eehehhheee', $o: 'eeheehhheeee'},
        {$i: 'heeeeeeehe', $o: 'heeeeeeeehee'},
        {$i: 'hehehhhhhh', $o: 'heeheehhhhhh'},
        {$i: 'hehhhhhhhe', $o: 'heehhhhhhhee'},
        {$i: 'hehhhhhhhh', $o: 'heehhhhhhhh'},
        {$i: 'hhheeeheee', $o: 'hhheeeeheeee'},
        {$i: 'hhhehhhehh', $o: 'hhheehhheehh'},
        {$i: 'hhhhehehhh', $o: 'hhhheeheehhh'},
        {$i: 'hhhhheeeee', $o: 'hhhhheeeeee'},
        // Some Invalid Inputs
        {$i: 'hehehe'},         {$i: 'hheheheh'},
        {$i: 'hhhhhhheeeeeee'},
    ];

    testGrammar({
        desc: '21b. Replace e by ee in he: Spotchk_10 e -> ee {0,2} || h_',
        grammar: Count({$i:10},
                     Replace(
                         "e", "ee", "h", EMPTY_CONTEXT, 
                         EMPTY_CONTEXT, false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        restriction: inputs(io_21b),
        results: outputs(io_21b),
    });

    testGrammar({
        desc: '22a. Replace e by ee in el: Cnt_i:4 e -> ee {0,2} || _l',
        grammar: Count({$i:4},
                     Replace(
                         "e", "ee",
                         EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'el', $o: 'eel'},     {$i: 'eel', $o: 'eeel'},
            {$i: 'ele', $o: 'eele'},   {$i: 'ell', $o: 'eell'},
            {$i: 'lel', $o: 'leel'},   {$i: 'eeel', $o: 'eeeel'},
            {$i: 'eele', $o: 'eeele'}, {$i: 'eell', $o: 'eeell'},
            {$i: 'elee', $o: 'eelee'}, {$i: 'elel', $o: 'eeleel'},
            {$i: 'elle', $o: 'eelle'}, {$i: 'elll', $o: 'eelll'},
            {$i: 'leel', $o: 'leeel'}, {$i: 'lele', $o: 'leele'},
            {$i: 'lell', $o: 'leell'}, {$i: 'llel', $o: 'lleel'},
            // Copy through only
            {$i: 'e', $o: 'e'},       {$i: 'l', $o: 'l'},
            {$i: 'ee', $o: 'ee'},     {$i: 'le', $o: 'le'},
            {$i: 'll', $o: 'll'},     {$i: 'eee', $o: 'eee'},
            {$i: 'lee', $o: 'lee'},   {$i: 'lle', $o: 'lle'},
            {$i: 'lll', $o: 'lll'},   {$i: 'eeee', $o: 'eeee'},
            {$i: 'leee', $o: 'leee'}, {$i: 'llee', $o: 'llee'},
            {$i: 'llle', $o: 'llle'}, {$i: 'llll', $o: 'llll'},
        ],
    });

    const io_22b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'e', $o: 'e'},             {$i: 'l', $o: 'l'},
        {$i: 'llleee', $o: 'llleee'},   {$i: 'eeeeeeee', $o: 'eeeeeeee'},
        {$i: 'llllleeeee', $o: 'llllleeeee'},
        // Some Valid Inputs - Replacement
        {$i: 'el', $o: 'eel'},          {$i: 'ele', $o: 'eele'},
        {$i: 'eel', $o: 'eeel'},        {$i: 'elel', $o: 'eeleel'},
        {$i: 'lell', $o: 'leell'},      {$i: 'eelel', $o: 'eeeleel'},
        {$i: 'elele', $o: 'eeleele'},   {$i: 'elell', $o: 'eeleell'},
        {$i: 'ellel', $o: 'eelleel'},   {$i: 'lelel', $o: 'leeleel'},
        {$i: 'eeelee', $o: 'eeeelee'},  {$i: 'eeleel', $o: 'eeeleeel'},
        {$i: 'eelele', $o: 'eeeleele'}, {$i: 'eleele', $o: 'eeleeele'},
        {$i: 'ellell', $o: 'eelleell'}, {$i: 'elllel', $o: 'eellleel'},
        {$i: 'llelll', $o: 'lleelll'},  {$i: 'elellll', $o: 'eeleellll'},
        {$i: 'lellell', $o: 'leelleell'},
        {$i: 'eeeeeeelel', $o: 'eeeeeeeeleel'},
        {$i: 'eeelllelee', $o: 'eeeellleelee'},
        {$i: 'eleeeeeeel', $o: 'eeleeeeeeeel'},
        {$i: 'elelllllll', $o: 'eeleelllllll'},
        {$i: 'elllllllel', $o: 'eellllllleel'},
        {$i: 'elllllllll', $o: 'eelllllllll'},
        {$i: 'lleleeelee', $o: 'lleeleeeelee'},
        {$i: 'llelllelll', $o: 'lleellleelll'},
        {$i: 'lllelellll', $o: 'llleeleellll'},
        {$i: 'lllleleeee', $o: 'lllleeleeee'},
        // Some Invalid Inputs
        {$i: 'elelel'},         {$i: 'hhehehehlelelell'},
        {$i: 'lllllleleeeeee'},
    ];

    testGrammar({
        desc: '22b. Replace e by ee in el: Spotchk_10 e -> ee {0,2} || _l',
        grammar: Count({$i:10},
                     Replace(
                         "e", "ee",
                         EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        restriction: inputs(io_22b),
        results: outputs(io_22b),
    });

    testGrammar({
        desc: '23. Replace e by ee: Cnt_i:3 e -> ee {0,2} (vocab $i:ehl)',
        grammar: Count({$i:3},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "ee",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'e', $o: 'ee'},      {$i: 'ee', $o: 'eeee'},
            {$i: 'eh', $o: 'eeh'},    {$i: 'el', $o: 'eel'},
            {$i: 'he', $o: 'hee'},    {$i: 'le', $o: 'lee'},
            {$i: 'eeh', $o: 'eeeeh'}, {$i: 'eel', $o: 'eeeel'},
            {$i: 'ehe', $o: 'eehee'}, {$i: 'ehh', $o: 'eehh'},
            {$i: 'ehl', $o: 'eehl'},  {$i: 'ele', $o: 'eelee'},
            {$i: 'elh', $o: 'eelh'},  {$i: 'ell', $o: 'eell'},
            {$i: 'hee', $o: 'heeee'}, {$i: 'heh', $o: 'heeh'},
            {$i: 'hel', $o: 'heel'},  {$i: 'hhe', $o: 'hhee'},
            {$i: 'hle', $o: 'hlee'},  {$i: 'lee', $o: 'leeee'},
            {$i: 'leh', $o: 'leeh'},  {$i: 'lel', $o: 'leel'},
            {$i: 'lhe', $o: 'lhee'},  {$i: 'lle', $o: 'llee'},
            // Copy through only
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'hh', $o: 'hh'},   {$i: 'hl', $o: 'hl'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hlh', $o: 'hlh'}, {$i: 'hll', $o: 'hll'},
            {$i: 'lhh', $o: 'lhh'}, {$i: 'lhl', $o: 'lhl'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  Count=8: 9841 results
    //  Count=9: 29524 results
    //  Count=10: 88573 results
    //  Count=11: 265720 results
    //  Count=12: 797160 results
    // Here we spot check some of the possible 797160 results for
    // 12 characters or less,
    const io_24: StringDict[] = [
        // Some Valid Inputs
        {$i: 'heel', $o: 'hel'},            {$i: 'heelh', $o: 'helh'},
        {$i: 'heele', $o: 'hele'},          {$i: 'lheel', $o: 'lhel'},
        {$i: 'hheele', $o: 'hhele'},        {$i: 'eheele', $o: 'ehele'},
        {$i: 'lheell', $o: 'lhell'},        {$i: 'heelheel', $o: 'helhel'},
        {$i: 'elheelel', $o: 'elhelel'},    {$i: 'heheelhe', $o: 'hehelhe'},
        {$i: 'heelheele', $o: 'helhele'},   {$i: 'heelhheel', $o: 'helhhel'},
        {$i: 'lheelheel', $o: 'lhelhel'},   {$i: 'heelhheele', $o: 'helhhele'},
        {$i: 'heeleheell', $o: 'helehell'}, {$i: 'hheelheell', $o: 'hhelhell'},
        {$i: 'hheellheel', $o: 'hhellhel'}, {$i: 'eheelheele', $o: 'ehelhele'},
        {$i: 'eheelhheel', $o: 'ehelhhel'}, {$i: 'lheelheele', $o: 'lhelhele'},
        {$i: 'lheellheel', $o: 'lhellhel'},
        {$i: 'hheeleheele', $o: 'hhelehele'},
        {$i: 'eheeleheele', $o: 'ehelehele'},
        {$i: 'lheeleheell', $o: 'lhelehell'},
        {$i: 'heeleeeeheel', $o: 'heleeeehel'},
        {$i: 'hhheelheelhh', $o: 'hhhelhelhh'},
        {$i: 'lllheeleheel', $o: 'lllhelehel'},
        {$i: 'eeeeheeleeee', $o: 'eeeeheleeee'},
        // Some Valid Inputs - Copy through
        {$i: 'e', $o: 'e'},           {$i: 'h', $o: 'h'},
        {$i: 'ee', $o: 'ee'},         {$i: 'he', $o: 'he'},
        {$i: 'leh', $o: 'leh'},       {$i: 'lehle', $o: 'lehle'},
        {$i: 'eehhll', $o: 'eehhll'}, {$i: 'eeehhhlll', $o: 'eeehhhlll'},
        {$i: 'hhhheeeellll', $o: 'hhhheeeellll'},
        {$i: 'lllleeeehhhh', $o: 'lllleeeehhhh'},
        {$i: 'heheleleelel', $o: 'heheleleelel'},
        // Some Invalid Inputs
        {$i: 'heelheelheel'},   {$i: 'hhhhhheellllll'},
    ];

    testGrammar({
        desc: '24. Replace ee by e in heel: Spotchk_12 ee -> e {0,2} || h_l',
        grammar: Count({$i:12, $o:12},
                     Replace(
                         "ee", "e",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:3, $o:3},
        restriction: inputs(io_24),
        results: outputs(io_24),
    });

    testGrammar({
        desc: '25a. Replace ee by e in hee: Cnt_o:4 ee -> e {0,2} || h_',
        grammar: Count({$o:4},
                     Replace(
                         "ee", "e",
                         "h", EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'hee', $o: 'he'},     {$i: 'ehee', $o: 'ehe'},
            {$i: 'heee', $o: 'hee'},   {$i: 'heeh', $o: 'heh'},
            {$i: 'hhee', $o: 'hhe'},   {$i: 'eehee', $o: 'eehe'},
            {$i: 'eheee', $o: 'ehee'}, {$i: 'eheeh', $o: 'eheh'},
            {$i: 'ehhee', $o: 'ehhe'}, {$i: 'heeee', $o: 'heee'},
            {$i: 'heeeh', $o: 'heeh'}, {$i: 'heehe', $o: 'hehe'},
            {$i: 'heehh', $o: 'hehh'}, {$i: 'hehee', $o: 'hehe'},
            {$i: 'hheee', $o: 'hhee'}, {$i: 'hheeh', $o: 'hheh'},
            {$i: 'hhhee', $o: 'hhhe'}, {$i: 'heehee', $o: 'hehe'},
            // Copy through only
            {$i: 'e', $o: 'e'},       {$i: 'h', $o: 'h'},
            {$i: 'ee', $o: 'ee'},     {$i: 'eh', $o: 'eh'},
            {$i: 'he', $o: 'he'},     {$i: 'hh', $o: 'hh'},
            {$i: 'eee', $o: 'eee'},   {$i: 'eeh', $o: 'eeh'},
            {$i: 'ehe', $o: 'ehe'},   {$i: 'ehh', $o: 'ehh'},
            {$i: 'heh', $o: 'heh'},   {$i: 'hhe', $o: 'hhe'},
            {$i: 'hhh', $o: 'hhh'},   {$i: 'eeee', $o: 'eeee'},
            {$i: 'eeeh', $o: 'eeeh'}, {$i: 'eehe', $o: 'eehe'},
            {$i: 'eehh', $o: 'eehh'}, {$i: 'eheh', $o: 'eheh'},
            {$i: 'ehhe', $o: 'ehhe'}, {$i: 'ehhh', $o: 'ehhh'},
            {$i: 'hehe', $o: 'hehe'}, {$i: 'hehh', $o: 'hehh'},
            {$i: 'hheh', $o: 'hheh'}, {$i: 'hhhe', $o: 'hhhe'},
            {$i: 'hhhh', $o: 'hhhh'},
        ],
    });

    // Full Generation:
    //  Count=10: 2038 results
    //  Count=11: 4046 results
    //  Count=12: 7985 results
    // Here we spot check some of the possible 7985 results for
    // 12 characters or less.
    const io_25b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},             {$i: 'e', $o: 'e'},
        {$i: 'eeehhh', $o: 'eeehhh'},   {$i: 'eeeeeeee', $o: 'eeeeeeee'},
        {$i: 'eeeeehhhhh', $o: 'eeeeehhhhh'},
        // Some Valid Inputs - Replacement
        {$i: 'hee', $o: 'he'},          {$i: 'heee', $o: 'hee'},
        {$i: 'hhee', $o: 'hhe'},        {$i: 'heehee', $o: 'hehe'},
        {$i: 'hheeh', $o: 'hheh'},      {$i: 'eheehee', $o: 'ehehe'},
        {$i: 'heeheeh', $o: 'heheh'},   {$i: 'heeheee', $o: 'hehee'},
        {$i: 'heehhee', $o: 'hehhe'},   {$i: 'hheehee', $o: 'hhehe'},
        {$i: 'eeheeee', $o: 'eeheee'},  {$i: 'eheeheee', $o: 'ehehee'},
        {$i: 'eheeehee', $o: 'eheehe'}, {$i: 'heehheeh', $o: 'hehheh'},
        {$i: 'heehhhee', $o: 'hehhhe'}, {$i: 'heeeheee', $o: 'heehee'},
        {$i: 'hhheehh', $o: 'hhhehh'},  {$i: 'heeheehhh', $o: 'hehehhh'},
        {$i: 'hheehheeh', $o: 'hhehheh'},
        {$i: 'eeeeeeheehee', $o: 'eeeeeehehe'},
        {$i: 'eeheehhheeee', $o: 'eehehhheee'},
        {$i: 'heeeeeeeehee', $o: 'heeeeeeehe'},
        {$i: 'heeheehhhhhh', $o: 'hehehhhhhh'},
        {$i: 'heehhhhhhhee', $o: 'hehhhhhhhe'},
        {$i: 'heehhhhhhhh', $o: 'hehhhhhhhh'},
        {$i: 'hhheeeeheeee', $o: 'hhheeeheee'},
        {$i: 'hhheehhheehh', $o: 'hhhehhhehh'},
        {$i: 'hhhheeheehhh', $o: 'hhhhehehhh'},
        {$i: 'hhhhheeeeee', $o: 'hhhhheeeee'},
        // Some Invalid Inputs
        {$i: 'heeheehee'},      {$i: 'hheeheeheeh'},
        {$i: 'hhhhhhheeeeeee'},
    ];

    testGrammar({
        desc: '25b. Replace ee by e in hee: Spotchk_12 ee -> e {0,2} || h_',
        grammar: Count({$i:12, $o:12},
                     Replace(
                         "ee", "e",
                         "h", EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        restriction: inputs(io_25b),
        results: outputs(io_25b),
    });

    testGrammar({
        desc: '26a. Replace ee by e in eel: Cnt_o:4 ee -> e {0,2} || _l',
        grammar: Count({$o:4},
                     Replace(
                         "ee", "e",
                         EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'eel', $o: 'el'},     {$i: 'eeel', $o: 'eel'},
            {$i: 'eele', $o: 'ele'},   {$i: 'eell', $o: 'ell'},
            {$i: 'leel', $o: 'lel'},   {$i: 'eeeel', $o: 'eeel'},
            {$i: 'eeele', $o: 'eele'}, {$i: 'eeell', $o: 'eell'},
            {$i: 'eelee', $o: 'elee'}, {$i: 'eelel', $o: 'elel'},
            {$i: 'eelle', $o: 'elle'}, {$i: 'eelll', $o: 'elll'},
            {$i: 'eleel', $o: 'elel'}, {$i: 'leeel', $o: 'leel'},
            {$i: 'leele', $o: 'lele'}, {$i: 'leell', $o: 'lell'},
            {$i: 'lleel', $o: 'llel'}, {$i: 'eeleel', $o: 'elel'},
            // Copy through only
            {$i: 'e', $o: 'e'},       {$i: 'l', $o: 'l'},
            {$i: 'ee', $o: 'ee'},     {$i: 'el', $o: 'el'},
            {$i: 'le', $o: 'le'},     {$i: 'll', $o: 'll'},
            {$i: 'eee', $o: 'eee'},   {$i: 'ele', $o: 'ele'},
            {$i: 'ell', $o: 'ell'},   {$i: 'lee', $o: 'lee'},
            {$i: 'lel', $o: 'lel'},   {$i: 'lle', $o: 'lle'},
            {$i: 'lll', $o: 'lll'},   {$i: 'eeee', $o: 'eeee'},
            {$i: 'elee', $o: 'elee'}, {$i: 'elel', $o: 'elel'},
            {$i: 'elle', $o: 'elle'}, {$i: 'elll', $o: 'elll'},
            {$i: 'leee', $o: 'leee'}, {$i: 'lele', $o: 'lele'},
            {$i: 'lell', $o: 'lell'}, {$i: 'llee', $o: 'llee'},
            {$i: 'llel', $o: 'llel'}, {$i: 'llle', $o: 'llle'},
            {$i: 'llll', $o: 'llll'},
        ],
    });

    // Full Generation:
    //  Count=10: 2038 results
    //  Count=11: 4046 results
    //  Count=12: 7985 results
    // Here we spot check some of the possible 7985 results for
    // 12 characters or less.
    const io_26b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'e', $o: 'e'},             {$i: 'l', $o: 'l'},
        {$i: 'llleee', $o: 'llleee'},   {$i: 'eeeeeeee', $o: 'eeeeeeee'},
        {$i: 'llllleeeee', $o: 'llllleeeee'},
        // Some Valid Inputs - Replacement
        {$i: 'eel', $o: 'el'},          {$i: 'eele', $o: 'ele'},
        {$i: 'eeel', $o: 'eel'},        {$i: 'eeleel', $o: 'elel'},
        {$i: 'leell', $o: 'lell'},      {$i: 'eeeleel', $o: 'eelel'},
        {$i: 'eeleele', $o: 'elele'},   {$i: 'eeleell', $o: 'elell'},
        {$i: 'eelleel', $o: 'ellel'},   {$i: 'leeleel', $o: 'lelel'},
        {$i: 'eeeelee', $o: 'eeelee'},  {$i: 'eeeleeel', $o: 'eeleel'},
        {$i: 'eeeleele', $o: 'eelele'}, {$i: 'eeleeele', $o: 'eleele'},
        {$i: 'eelleell', $o: 'ellell'}, {$i: 'eellleel', $o: 'elllel'},
        {$i: 'lleelll', $o: 'llelll'},  {$i: 'eeleellll', $o: 'elellll'},
        {$i: 'leelleell', $o: 'lellell'},
        {$i: 'eeeeeeeeleel', $o: 'eeeeeeelel'},
        {$i: 'eeeellleelee', $o: 'eeelllelee'},
        {$i: 'eeleeeeeeeel', $o: 'eleeeeeeel'},
        {$i: 'eeleelllllll', $o: 'elelllllll'},
        {$i: 'eellllllleel', $o: 'elllllllel'},
        {$i: 'eelllllllll', $o: 'elllllllll'},
        {$i: 'lleeleeeelee', $o: 'lleleeelee'},
        {$i: 'lleellleelll', $o: 'llelllelll'},
        {$i: 'llleeleellll', $o: 'lllelellll'},
        {$i: 'lllleeleeee', $o: 'lllleleeee'},
        // Some Invalid Inputs
        {$i: 'eeleeleel'},     {$i: 'leeleeleell'},
        {$i: 'llllleeleeeee'},
    ];

    testGrammar({
        desc: '26b. Replace ee by e in eel: Spotchk_12 ee -> e {0,2} || _l',
        grammar: Count({$i:12, $o:12},
                     Replace(
                         "ee", "e",
                         EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:2},
        restriction: inputs(io_26b),
        results: outputs(io_26b),
    });

    testGrammar({
        desc: '27. Replace ee by e: Cnt_o:3 ee -> e {0,2} (vocab $i:ehl)',
        grammar: Count({$o:3},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "ee", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'ee', $o: 'e'},   {$i: 'eee', $o: 'ee'},
            {$i: 'eeh', $o: 'eh'}, {$i: 'eel', $o: 'el'},
            {$i: 'hee', $o: 'he'}, {$i: 'lee', $o: 'le'},
            // See test 36a for a discussion of the following 2 results.
            {$i: 'eeee', $o: 'ee'},  // (ee)(ee) -> (e)(e)
            {$i: 'eeee', $o: 'eee'}, // e(ee)e -> e(e)e which is valid
            {$i: 'eeeh', $o: 'eeh'},  {$i: 'eeel', $o: 'eel'},
            {$i: 'eehe', $o: 'ehe'},  {$i: 'eehh', $o: 'ehh'},
            {$i: 'eehl', $o: 'ehl'},  {$i: 'eele', $o: 'ele'},
            {$i: 'eelh', $o: 'elh'},  {$i: 'eell', $o: 'ell'},
            {$i: 'ehee', $o: 'ehe'},  {$i: 'elee', $o: 'ele'},
            {$i: 'heee', $o: 'hee'},  {$i: 'heeh', $o: 'heh'},
            {$i: 'heel', $o: 'hel'},  {$i: 'hhee', $o: 'hhe'},
            {$i: 'hlee', $o: 'hle'},  {$i: 'leee', $o: 'lee'},
            {$i: 'leeh', $o: 'leh'},  {$i: 'leel', $o: 'lel'},
            {$i: 'lhee', $o: 'lhe'},  {$i: 'llee', $o: 'lle'},
            {$i: 'eeeee', $o: 'eee'}, {$i: 'eeeeh', $o: 'eeh'},
            {$i: 'eeeel', $o: 'eel'}, {$i: 'eehee', $o: 'ehe'},
            {$i: 'eelee', $o: 'ele'}, {$i: 'heeee', $o: 'hee'},
            {$i: 'leeee', $o: 'lee'},
            // Copy through only
            {$i: 'e', $o: 'e'},     {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},     {$i: 'eh', $o: 'eh'},
            {$i: 'el', $o: 'el'},   {$i: 'he', $o: 'he'},
            {$i: 'hh', $o: 'hh'},   {$i: 'hl', $o: 'hl'},
            {$i: 'le', $o: 'le'},   {$i: 'lh', $o: 'lh'},
            {$i: 'll', $o: 'll'},   {$i: 'ehe', $o: 'ehe'},
            {$i: 'ehh', $o: 'ehh'}, {$i: 'ehl', $o: 'ehl'},
            {$i: 'ele', $o: 'ele'}, {$i: 'elh', $o: 'elh'},
            {$i: 'ell', $o: 'ell'}, {$i: 'heh', $o: 'heh'},
            {$i: 'hel', $o: 'hel'}, {$i: 'hhe', $o: 'hhe'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hle', $o: 'hle'}, {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'}, {$i: 'leh', $o: 'leh'},
            {$i: 'lel', $o: 'lel'}, {$i: 'lhe', $o: 'lhe'},
            {$i: 'lhh', $o: 'lhh'}, {$i: 'lhl', $o: 'lhl'},
            {$i: 'lle', $o: 'lle'}, {$i: 'llh', $o: 'llh'},
            {$i: 'lll', $o: 'lll'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '28a. Insert a in h_l: Cnt_i:4 0 -> a {0,2} || h_l',
        grammar: Count({$i:4},
                     Replace(
                         "", "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        results: [
            {},
            // Insertion
            {$i: 'hl', $o: 'hal'},     {$i: 'hhl', $o: 'hhal'},
            {$i: 'hlh', $o: 'halh'},   {$i: 'hll', $o: 'hall'},
            {$i: 'lhl', $o: 'lhal'},   {$i: 'hhhl', $o: 'hhhal'},
            {$i: 'hhlh', $o: 'hhalh'}, {$i: 'hhll', $o: 'hhall'},
            {$i: 'hlhh', $o: 'halhh'}, {$i: 'hlhl', $o: 'halhal'},
            {$i: 'hllh', $o: 'hallh'}, {$i: 'hlll', $o: 'halll'},
            {$i: 'lhhl', $o: 'lhhal'}, {$i: 'lhlh', $o: 'lhalh'},
            {$i: 'lhll', $o: 'lhall'}, {$i: 'llhl', $o: 'llhal'},
            // Copy through only
            {$i: 'h', $o: 'h'},       {$i: 'l', $o: 'l'},
            {$i: 'hh', $o: 'hh'},     {$i: 'lh', $o: 'lh'},
            {$i: 'll', $o: 'll'},     {$i: 'hhh', $o: 'hhh'},
            {$i: 'lhh', $o: 'lhh'},   {$i: 'llh', $o: 'llh'},
            {$i: 'lll', $o: 'lll'},   {$i: 'hhhh', $o: 'hhhh'},
            {$i: 'lhhh', $o: 'lhhh'}, {$i: 'llhh', $o: 'llhh'},
            {$i: 'lllh', $o: 'lllh'}, {$i: 'llll', $o: 'llll'},
        ],
    });

    // Full Generation:
    //  $i Count=8: 465 results
    //  $i Count=9: 847 results
    //  $i Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // $i with 10 characters or less.
    const io_28b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},             {$i: 'lllllhhhhh', $o: 'lllllhhhhh'},
        // Some Valid Inputs - Insertion
        {$i: 'hl', $o: 'hal'},          {$i: 'lhlh', $o: 'lhalh'},
        {$i: 'lhll', $o: 'lhall'},      {$i: 'hlhl', $o: 'halhal'},
        {$i: 'hlhhlh', $o: 'halhhalh'}, {$i: 'hhlhhll', $o: 'hhalhhall'},
        {$i: 'hhhhhlllll', $o: 'hhhhhalllll'},
        {$i: 'hlhhhhhhhl', $o: 'halhhhhhhhal'},
        // Some Invalid Inputs
        {$i: 'hlhlhl'},                 {$i: 'hhhhhhhhhhh'},
        {$i: 'hhhhllllhlhhh'},
    ];

    testGrammar({
        desc: '28b. Insert a in h_l: Spotchk_10 0 -> a {0,2} || h_l',
        grammar: Count({$i:10},
                     Replace(
                         "", "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:2, $o:3},
        restriction: inputs(io_28b),
        results: outputs(io_28b),
    });

    testGrammar({
        desc: '29a. Delete e in hel:Cnt_o:3 e -> 0 {0,2} || h_l',
        grammar: Count({$o:3},
                     Replace(
                         "e", "",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:3, $o:3},
        results: [
            {},
            // Deletion
            {$i: 'hel', $o: 'hl'},   {$i: 'ehel', $o: 'ehl'},
            {$i: 'hhel', $o: 'hhl'}, {$i: 'hele', $o: 'hle'},
            {$i: 'helh', $o: 'hlh'}, {$i: 'hell', $o: 'hll'},
            {$i: 'lhel', $o: 'lhl'},
            // Copy through only
            {$i: 'e', $o: 'e'},     {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},     {$i: 'ee', $o: 'ee'},
            {$i: 'eh', $o: 'eh'},   {$i: 'el', $o: 'el'},
            {$i: 'he', $o: 'he'},   {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'le', $o: 'le'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'eee', $o: 'eee'}, {$i: 'eeh', $o: 'eeh'},
            {$i: 'eel', $o: 'eel'}, {$i: 'ehe', $o: 'ehe'},
            {$i: 'ehh', $o: 'ehh'}, {$i: 'ehl', $o: 'ehl'},
            {$i: 'ele', $o: 'ele'}, {$i: 'elh', $o: 'elh'},
            {$i: 'ell', $o: 'ell'}, {$i: 'hee', $o: 'hee'},
            {$i: 'heh', $o: 'heh'}, {$i: 'hhe', $o: 'hhe'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hle', $o: 'hle'}, {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'}, {$i: 'lee', $o: 'lee'},
            {$i: 'leh', $o: 'leh'}, {$i: 'lel', $o: 'lel'},
            {$i: 'lhe', $o: 'lhe'}, {$i: 'lhh', $o: 'lhh'},
            {$i: 'lhl', $o: 'lhl'}, {$i: 'lle', $o: 'lle'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  $o Count=8: 15853 results
    //  $o Count=9: 50637 results
    //  $o Count=10: 161304 results
    // Here we spot check some of the possible 161304 results for
    // $o with 10 characters or less.
    const io_29b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},             {$i: 'hlhl', $o: 'hlhl'},
        {$i: 'lllllhhhhh', $o: 'lllllhhhhh'},
        // Some Valid Inputs - Deletion
        {$i: 'hel', $o: 'hl'},          {$i: 'lhelh', $o: 'lhlh'},
        {$i: 'lhell', $o: 'lhll'},      {$i: 'helhel', $o: 'hlhl'},
        {$i: 'helhhelh', $o: 'hlhhlh'}, {$i: 'hhelhhell', $o: 'hhlhhll'},
        {$i: 'hhhhhelllll', $o: 'hhhhhlllll'},
        {$i: 'helhhhhhhhel', $o: 'hlhhhhhhhl'},
        // Some Invalid Inputs
        {$i: 'helhelhel'},              {$i: 'hhhhhhhhhhhhhhhh'},
        {$i: 'hhhhelllllhelhhh'},
    ];

    testGrammar({
        desc: '29b. Delete e in hel: Spotchk_10 e -> 0 {0,2} || h_l',
        grammar: Count({$o:10},
                     Replace(
                         "e", "",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:3, $o:3},
        restriction: inputs(io_29b),
        results: outputs(io_29b),
    });

    const io_30a: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},         {$i: 'heh', $o: 'heh'},
        {$i: 'lel', $o: 'lel'},       {$i: 'hheeell', $o: 'hheeell'},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},       {$i: 'hhel', $o: 'hhal'},
        {$i: 'hele', $o: 'hale'},     {$i: 'ehey', $o: 'ehay'},
        {$i: 'hhell', $o: 'hhall'},   {$i: 'hlhhelllll', $o: 'hlhhalllll'},
        {$i: 'hey', $o: 'hay'},       {$i: 'hhey', $o: 'hhay'},
        {$i: 'hheyy', $o: 'hhayy'},   {$i: 'hlhheyyyyy', $o: 'hlhhayyyyy'},
        {$i: 'helhel', $o: 'halhal'}, {$i: 'heyhey', $o: 'hayhay'},
        {$i: 'helhey', $o: 'halhay'}, {$i: 'eheyehele', $o: 'ehayehale'},
        // Some Invalid Inputs
        {$i: 'helheyhel'},            {$i: 'hhheeelllyyy'},
        {$i: 'eeheyeehelee'},
    ];

    testGrammar({
        desc: '30a. Replace e by a in hel and hey: Spotchk_10 ' +
              'e -> a {0,2} || h_l|y',
        grammar: Count({$i:10, $o:10},
                     Replace(
                         "e", "a",
                         "h", Uni("l", "y"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:4, $o:5},
        restriction: inputs(io_30a),
        results: outputs(io_30a),
    });

    const io_30b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},         {$i: 'heh', $o: 'heh'},
        {$i: 'lel', $o: 'lel'},       {$i: 'hheeell', $o: 'hheeell'},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},       {$i: 'hhel', $o: 'hhal'},
        {$i: 'hele', $o: 'hale'},     {$i: 'eyel', $o: 'eyal'},
        {$i: 'hhell', $o: 'hhall'},   {$i: 'hlhhelllll', $o: 'hlhhalllll'},
        {$i: 'yel', $o: 'yal'},       {$i: 'yyel', $o: 'yyal'},
        {$i: 'yyell', $o: 'yyall'},   {$i: 'ylyyelllll', $o: 'ylyyalllll'},
        {$i: 'helhel', $o: 'halhal'}, {$i: 'yelyel', $o: 'yalyal'},
        {$i: 'helyel', $o: 'halyal'}, {$i: 'eyelehele', $o: 'eyalehale'},
        // Some Invalid Inputs
        {$i: 'yelhelyel'},            {$i: 'hhheeelllyyy'},
        {$i: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '30b. Replace e by a in hel and yel: Spotchk_10 ' +
              'e -> a {0,2} || h|y_l',
        grammar: Count({$i:10, $o:10},
                     Replace(
                         "e", "a",
                         Uni("h", "y"), "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:4, $o:5},
        restriction: inputs(io_30b),
        results: outputs(io_30b),
    });

    const io_30c: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},           {$i: 'heh', $o: 'heh'},
        {$i: 'lel', $o: 'lel'},
        // Some Valid Inputs - Replacement
        {$i: 'hheeell', $o: 'hhaeell'}, {$i: 'hel', $o: 'hal'},
        {$i: 'hele', $o: 'hale'},       {$i: 'ehey', $o: 'ehay'},
        {$i: 'hhel', $o: 'hhal'},       {$i: 'hhell', $o: 'hhall'},
        {$i: 'hlhhelllll', $o: 'hlhhalllll'},
        {$i: 'hey', $o: 'hay'},         {$i: 'hhey', $o: 'hhay'},
        {$i: 'hheyy', $o: 'hhayy'},     {$i: 'hlhheyyyyy', $o: 'hlhhayyyyy'},
        {$i: 'hlhheeyyyy', $o: 'hlhhaeyyyy'},
        {$i: 'helhel', $o: 'halhal'},   {$i: 'heyhey', $o: 'hayhay'},
        {$i: 'helhee', $o: 'halhae'},   {$i: 'eheyehele', $o: 'ehayehale'},
        // Some Invalid Inputs
        {$i: 'helheyhee'},              {$i: 'hhheeelllyyy'},
        {$i: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '30c. Replace e by a in hel, hey, hee: Spotchk_10 ' +
              'e -> a {0,2} || h_(.&~h) (vocab $i:ehly)',
        grammar: Count({$i:10, $o:10},
        			 Vocab({$i:'ehly'},
                     	 Replace(
                         	 "e", "a",
                             "h",
                             Intersect(Any(), Not("h")),
                             EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:4, $o:5},
        restriction: inputs(io_30c),
        results: outputs(io_30c),
    });

    const io_30d: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},           {$i: 'heh', $o: 'heh'},
        {$i: 'lel', $o: 'lel'},
        // Some Valid Inputs - Replacement
        {$i: 'hheeell', $o: 'hheeall'}, {$i: 'hel', $o: 'hal'},
        {$i: 'hele', $o: 'hale'},       {$i: 'eyel', $o: 'eyal'},
        {$i: 'hhel', $o: 'hhal'},       {$i: 'hhell', $o: 'hhall'},
        {$i: 'hlhhelllll', $o: 'hlhhalllll'},
        {$i: 'yel', $o: 'yal'},         {$i: 'yyel', $o: 'yyal'},
        {$i: 'yyell', $o: 'yyall'},     {$i: 'ylyyelllll', $o: 'ylyyalllll'},
        {$i: 'eeyeelllll', $o: 'eeyealllll'},
        {$i: 'helhel', $o: 'halhal'},   {$i: 'yelyel', $o: 'yalyal'},
        {$i: 'yeleel', $o: 'yaleal'},
        // Some Invalid Inputs
        {$i: 'helyeleel'},              {$i: 'eeehhhlllyyy'},
        {$i: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '30d. Replace e by a in hel, yel, eel: Spotchk_10 ' +
              'e -> a {0,2} || (.&~l)_l (vocab $i:ehly)',
        grammar: Count({$i:10, $o:10},
        			 Vocab({$i:'ehly'},
                     	 Replace(
                             "e", "a",
                             Intersect(Any(), Not("l")),
                             "l",
                             EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:4, $o:5},
        restriction: inputs(io_30d),
        results: outputs(io_30d),
    });

    const io_31a: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},         {$i: 'heh', $o: 'heh'},
        {$i: 'lel', $o: 'lel'},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},       {$i: 'helo', $o: 'halo'},
        {$i: 'hole', $o: 'hale'},     {$i: 'hhel', $o: 'hhal'},
        {$i: 'hhell', $o: 'hhall'},   {$i: 'hlhhelllll', $o: 'hlhhalllll'},
        {$i: 'hol', $o: 'hal'},       {$i: 'hhol', $o: 'hhal'},
        {$i: 'hholl', $o: 'hhall'},   {$i: 'hlhholllll', $o: 'hlhhalllll'},
        {$i: 'helhel', $o: 'halhal'}, {$i: 'helhol', $o: 'halhal'},
        {$i: 'holhol', $o: 'halhal'},
        // Some Invalid Inputs
        {$i: 'helholhel'},            {$i: 'eeeooohhhlll'},
        {$i: 'eeheleeholee'},
    ];

    testGrammar({
        desc: '31a. Replace e or o by a in hel: Spotchk_10 ' +
              'e|$i:o -> a {0,2} || h_l',
        grammar: Count({$i:10, $o:10},
                     Replace(
                         Uni("e", "o"), "a",
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        vocab: {$i:4, $o:5},
        restriction: inputs(io_31a),
        results: outputs(io_31a),
    });

    testGrammar({
        desc: '31b. Replace e by a or o in hel: Cnt_3' +
              'e -> a|$o:o {0,1} || h_l',
        grammar: Count({$i:3, $o:3},
                     Replace(
                         "e", Uni("a", "o"),
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 1
                     )),
        vocab: {$i:3, $o:5},
        results: [
            {},
            // Replacement
            {$i: 'hel', $o: 'hal'}, {$i: 'hel', $o: 'hol'},
            // Copy through only
            {$i: 'e', $o: 'e'},     {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},     {$i: 'ee', $o: 'ee'},
            {$i: 'eh', $o: 'eh'},   {$i: 'el', $o: 'el'},
            {$i: 'he', $o: 'he'},   {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'le', $o: 'le'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'eee', $o: 'eee'}, {$i: 'eeh', $o: 'eeh'},
            {$i: 'eel', $o: 'eel'}, {$i: 'ehe', $o: 'ehe'},
            {$i: 'ehh', $o: 'ehh'}, {$i: 'ehl', $o: 'ehl'},
            {$i: 'ele', $o: 'ele'}, {$i: 'elh', $o: 'elh'},
            {$i: 'ell', $o: 'ell'}, {$i: 'hee', $o: 'hee'},
            {$i: 'heh', $o: 'heh'}, {$i: 'hhe', $o: 'hhe'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hle', $o: 'hle'}, {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'}, {$i: 'lee', $o: 'lee'},
            {$i: 'leh', $o: 'leh'}, {$i: 'lel', $o: 'lel'},
            {$i: 'lhe', $o: 'lhe'}, {$i: 'lhh', $o: 'lhh'},
            {$i: 'lhl', $o: 'lhl'}, {$i: 'lle', $o: 'lle'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    const io_31c: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'eee', $o: 'eee'},
        {$i: 'lelee', $o: 'lelee'},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal'},     {$i: 'hel', $o: 'hol'},
        {$i: 'hell', $o: 'hall'},   {$i: 'hell', $o: 'holl'},
        {$i: 'helh', $o: 'halh'},   {$i: 'helh', $o: 'holh'},
        {$i: 'hhel', $o: 'hhal'},   {$i: 'hhel', $o: 'hhol'},
        {$i: 'hhell', $o: 'hhall'}, {$i: 'hhell', $o: 'hholl'},
        {$i: 'hhelh', $o: 'hhalh'}, {$i: 'hhelh', $o: 'hholh'},
        {$i: 'lhel', $o: 'lhal'},   {$i: 'lhel', $o: 'lhol'},
        {$i: 'lhell', $o: 'lhall'}, {$i: 'lhell', $o: 'lholl'},
        {$i: 'lhelh', $o: 'lhalh'}, {$i: 'lhelh', $o: 'lholh'},
        // Some Invalid Inputs
        {$i: 'helhel'},
        {$i: 'hhheeelllyyy'},
        {$i: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '31c. Replace e by a or o in hel: Spotchk_5 ' +
              'e -> a|$o:o {0,1} || h_l',
        grammar: Count({$i:5, $o:5},
                     Replace(
                         "e", Uni("a", "o"),
                         "h", "l", EMPTY_CONTEXT,
                         false, false, 0, 1
                     )),
        vocab: {$i:3, $o:5},
        restriction: inputs(io_31c),
        results: outputs(io_31c),
    });

    const io_32: StringDict[] = [
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl', t3: '[1SG]'},
        {$i: 'heh', $o: 'heh', t3: '[1SG]'},
        {$i: 'lel', $o: 'lel', t3: '[1SG]'},
        {$i: 'hhhhhlllleeeee', $o: 'hhhhhlllleeeee', t3: '[1SG]'},
        {$i: 'hel', $o: 'hel', t3: '[1]'},
        {$i: 'hhell', $o: 'hhell', t3: '[1]'},
        {$i: 'lhhelhl', $o: 'lhhelhl', t3: '[1]'},
        {$i: 'hlhhelllll', $o: 'hlhhelllll', t3: '[1]'},
        {$i: 'lhellhhel', $o: 'lhellhhel', t3: '[1]'},
        {$i: 'lhelhhllhel', $o: 'lhelhhllhel', t3: '[1]'},
        {$i: 'helhelhel', $o: 'helhelhel', t3: '[1]'},
        {$i: 'lhelhelhhlhell', $o: 'lhelhelhhlhell', t3: '[1]'},
        {$i: 'eeheleeeehelee', $o: 'eeheleeeehelee', t3: '[1]'},
        {$i: 'helhhhhllllhel', $o: 'helhhhhllllhel', t3: '[1]'},
        {$i: 'helhelhelhel', $o: 'helhelhelhel', t3: '[1]'},
        {$i: 'hel', $o: 'hel', t3: EMPTY},
        {$i: 'hhell', $o: 'hhell', t3: EMPTY},
        {$i: 'lhhelhl', $o: 'lhhelhl', t3: EMPTY},
        {$i: 'hlhhelllll', $o: 'hlhhelllll', t3: EMPTY},
        {$i: 'lhellhhel', $o: 'lhellhhel', t3: EMPTY},
        {$i: 'lhelhhllhel', $o: 'lhelhhllhel', t3: EMPTY},
        {$i: 'helhelhel', $o: 'helhelhel', t3: EMPTY},
        {$i: 'lhelhelhhlhell', $o: 'lhelhelhhlhell', t3: EMPTY},
        {$i: 'eeheleeeehelee', $o: 'eeheleeeehelee', t3: EMPTY},
        {$i: 'helhhhhllllhel', $o: 'helhhhhllllhel', t3: EMPTY},
        {$i: 'helhelhelhel', $o: 'helhelhelhel', t3: EMPTY},
        // Some Valid Inputs - Replacement
        {$i: 'hel', $o: 'hal', t3: '[1SG]'},
        {$i: 'hhell', $o: 'hhall', t3: '[1SG]'},
        {$i: 'lhhelhl', $o: 'lhhalhl', t3: '[1SG]'},
        {$i: 'hlhhelllll', $o: 'hlhhalllll', t3: '[1SG]'},
        {$i: 'lhellhhel', $o: 'lhallhhal', t3: '[1SG]'},
        {$i: 'lhelhhllhel', $o: 'lhalhhllhal', t3: '[1SG]'},
        {$i: 'helhelhel', $o: 'halhalhal', t3: '[1SG]'},
        {$i: 'lhelhelhhlhell', $o: 'lhalhalhhlhall', t3: '[1SG]'},
        {$i: 'eeheleeeehelee', $o: 'eehaleeeehalee', t3: '[1SG]'},
        {$i: 'helhhhhllllhel', $o: 'halhhhhllllhal', t3: '[1SG]'},
        // Some Invalid Inputs
        {$i: 'helhelhelhel', t3: '[1SG]'},
        {$i: 'heleeehhhlllhel', t3: '[1SG]'},
        {$i: 'heleeehhhlllhel', t3: '[1]'},
        {$i: 'heleeehhhlllhel', t3: EMPTY},
    ];

    testGrammar({
        desc: '32. Replace e by a in hel: Spotchk_14 ' +
              'e -> a {0,3} || $i:h_l + t3:[1SG]',
        grammar: Count({$i:14, $o:14},
                     Replace(
                         "e", "a",
                         "h", "l", t3("[1SG]"),
                         false, false, 0, 3
                     )),
        vocab: {$i:3, $o:4, t3:5},
        restriction: inputs(io_32),
        results: outputs(io_32),
    });

    testGrammar({
        desc: '33a. Replace ε by e: Cnt_4 ε -> e {1} || #_ ($o:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$o:'ehl'},
                     	 Replace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false, 1, 1
                     	 ))),
        vocab: {$i:0, $o:3},
        results: [
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33b. Replace ε by e: Cnt_4 ε -> e {1} || _# (vocab $o:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$o:'ehl'},
                     	 Replace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true, 1, 1
                     	 ))),
        vocab: {$i:0, $o:3},
        results: [
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33c. Replace ε by e: Cnt_4 ε -> e {1} || #_# (vocab $o:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$o:'ehl'},
                     	 Replace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true, 1, 1
                     	 ))),
        vocab: {$i:0, $o:3},
        results: [
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33d. Replace ε by e: Cnt_4 ε -> e {1} (vocab $o:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$o:'ehl'},
                     	 OptionalReplace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        vocab: {$i:0, $o:3},
        results: [
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33e. Replace ε by e: Cnt_4 ε -> e {1} || #_ (vocab $i:hl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'hl'},
                     	 Replace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false, 1, 1
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {$i: "h", $o: "eh"},     {$i: "l", $o: "el"},
            {$i: "hh", $o: "ehh"},   {$i: "hl", $o: "ehl"},
            {$i: "lh", $o: "elh"},   {$i: "ll", $o: "ell"},
            {$i: "hhh", $o: "ehhh"}, {$i: "hhl", $o: "ehhl"},
            {$i: "hlh", $o: "ehlh"}, {$i: "hll", $o: "ehll"},
            {$i: "lhh", $o: "elhh"}, {$i: "lhl", $o: "elhl"},
            {$i: "llh", $o: "ellh"}, {$i: "lll", $o: "elll"},
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33f. Replace ε by e: Cnt_4 ε -> e {1} || _# (vocab $i:hl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'hl'},
                     	 Replace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true, 1, 1
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {$i: 'h', $o: 'he'},     {$i: 'l', $o: 'le'},
            {$i: 'hh', $o: 'hhe'},   {$i: 'hl', $o: 'hle'},
            {$i: 'lh', $o: 'lhe'},   {$i: 'll', $o: 'lle'},
            {$i: "hhh", $o: "hhhe"}, {$i: "hhl", $o: "hhle"},
            {$i: "hlh", $o: "hlhe"}, {$i: "hll", $o: "hlle"},
            {$i: "lhh", $o: "lhhe"}, {$i: "lhl", $o: "lhle"},
            {$i: "llh", $o: "llhe"}, {$i: "lll", $o: "llle"},
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33g. Replace ε by e: Cnt_4 ε -> e {1} || #_# (vocab $i:hl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'hl'},
                     	 Replace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true, 1, 1
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33h. Replace ε by e: Cnt_4 ε -> e {1} (vocab $i:hl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'hl'},
                     	 OptionalReplace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {$i: "h", $o: "eh"},     {$i: "h", $o: "he"},
            {$i: "l", $o: "el"},     {$i: "l", $o: "le"},
            {$i: "hh", $o: "ehh"},   {$i: "hh", $o: "heh"},
            {$i: "hh", $o: "hhe"},   {$i: "hl", $o: "ehl"},
            {$i: "hl", $o: "hel"},   {$i: "hl", $o: "hle"},
            {$i: "lh", $o: "elh"},   {$i: "lh", $o: "leh"},
            {$i: "lh", $o: "lhe"},   {$i: "ll", $o: "ell"},
            {$i: "ll", $o: "lel"},   {$i: "ll", $o: "lle"},
            {$i: "hhh", $o: "ehhh"}, {$i: "hhh", $o: "hehh"},
            {$i: "hhh", $o: "hheh"}, {$i: "hhh", $o: "hhhe"},
            {$i: "hhl", $o: "ehhl"}, {$i: "hhl", $o: "hehl"},
            {$i: "hhl", $o: "hhel"}, {$i: "hhl", $o: "hhle"},
            {$i: "hlh", $o: "ehlh"}, {$i: "hlh", $o: "helh"},
            {$i: "hlh", $o: "hleh"}, {$i: "hlh", $o: "hlhe"},
            {$i: "hll", $o: "ehll"}, {$i: "hll", $o: "hell"},
            {$i: "hll", $o: "hlel"}, {$i: "hll", $o: "hlle"},
            {$i: "lhh", $o: "elhh"}, {$i: "lhh", $o: "lehh"},
            {$i: "lhh", $o: "lheh"}, {$i: "lhh", $o: "lhhe"},
            {$i: "lhl", $o: "elhl"}, {$i: "lhl", $o: "lehl"},
            {$i: "lhl", $o: "lhel"}, {$i: "lhl", $o: "lhle"},
            {$i: "llh", $o: "ellh"}, {$i: "llh", $o: "lelh"},
            {$i: "llh", $o: "lleh"}, {$i: "llh", $o: "llhe"},
            {$i: "lll", $o: "elll"}, {$i: "lll", $o: "lell"},
            {$i: "lll", $o: "llel"}, {$i: "lll", $o: "llle"},
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
        ],
    });

    testGrammar({
        desc: '33i. Replace ε by e: Cnt_4 ε -> e {0,2} (vocab $o:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$o:'ehl'},
                     	 OptionalReplace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:0, $o:3},
        results: [
            {},         // equivalent to {$i: '', $o: ''}
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
            {$o: 'ee'}, // equivalent to {$i: '', $o: 'ee'}
        ],
    });

    testGrammar({
        desc: '33j. Replace ε by e: Cnt_4 ε -> e {0,2} (vocab $i:hl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'hl'},
                     	 OptionalReplace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            // 1 Insertion
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
            {$i: 'h', $o: 'eh'},     {$i: 'l', $o: 'el'},
            {$i: 'h', $o: 'he'},     {$i: 'l', $o: 'le'},
            {$i: 'hh', $o: 'ehh'},   {$i: 'hl', $o: 'ehl'},
            {$i: 'lh', $o: 'elh'},   {$i: 'll', $o: 'ell'},
            {$i: 'hh', $o: 'heh'},   {$i: 'hl', $o: 'hel'},
            {$i: 'hh', $o: 'hhe'},   {$i: 'hl', $o: 'hle'},
            {$i: 'lh', $o: 'leh'},   {$i: 'll', $o: 'lel'},
            {$i: 'lh', $o: 'lhe'},   {$i: 'll', $o: 'lle'},
            {$i: 'hhh', $o: 'ehhh'}, {$i: 'hhl', $o: 'ehhl'},
            {$i: 'hlh', $o: 'ehlh'}, {$i: 'hll', $o: 'ehll'},
            {$i: 'lhh', $o: 'elhh'}, {$i: 'lhl', $o: 'elhl'},
            {$i: 'llh', $o: 'ellh'}, {$i: 'lll', $o: 'elll'},
            {$i: 'hhh', $o: 'hehh'}, {$i: 'hhl', $o: 'hehl'},
            {$i: 'hlh', $o: 'helh'}, {$i: 'hll', $o: 'hell'},
            {$i: 'hhh', $o: 'hheh'}, {$i: 'hhl', $o: 'hhel'},
            {$i: 'hhh', $o: 'hhhe'}, {$i: 'hhl', $o: 'hhle'},
            {$i: 'hlh', $o: 'hleh'}, {$i: 'hll', $o: 'hlel'},
            {$i: 'hlh', $o: 'hlhe'}, {$i: 'hll', $o: 'hlle'},
            {$i: 'lhh', $o: 'lehh'}, {$i: 'lhl', $o: 'lehl'},
            {$i: 'llh', $o: 'lelh'}, {$i: 'lll', $o: 'lell'},
            {$i: 'lhh', $o: 'lheh'}, {$i: 'lhl', $o: 'lhel'},
            {$i: 'lhh', $o: 'lhhe'}, {$i: 'lhl', $o: 'lhle'},
            {$i: 'llh', $o: 'lleh'}, {$i: 'lll', $o: 'llel'},
            {$i: 'llh', $o: 'llhe'}, {$i: 'lll', $o: 'llle'},

            // 2 Insertions
            {$o: 'ee'},  // equivalent to {$i: '', $o: 'ee'}
            {$i: 'h', $o: 'ehe'},   {$i: 'l', $o: 'ele'},
            {$i: 'h', $o: 'eeh'},   {$i: 'l', $o: 'eel'},
            {$i: 'h', $o: 'hee'},   {$i: 'l', $o: 'lee'},
            {$i: 'hh', $o: 'eehh'}, {$i: 'hl', $o: 'eehl'},
            {$i: 'lh', $o: 'eelh'}, {$i: 'll', $o: 'eell'},
            {$i: 'hh', $o: 'eheh'}, {$i: 'hl', $o: 'ehel'},
            {$i: 'hh', $o: 'ehhe'}, {$i: 'hl', $o: 'ehle'},
            {$i: 'lh', $o: 'eleh'}, {$i: 'll', $o: 'elel'},
            {$i: 'lh', $o: 'elhe'}, {$i: 'll', $o: 'elle'},
            {$i: 'hh', $o: 'heeh'}, {$i: 'hl', $o: 'heel'},
            {$i: 'hh', $o: 'hehe'}, {$i: 'hl', $o: 'hele'},
            {$i: 'hh', $o: 'hhee'}, {$i: 'hl', $o: 'hlee'},
            {$i: 'lh', $o: 'leeh'}, {$i: 'll', $o: 'leel'},
            {$i: 'lh', $o: 'lehe'}, {$i: 'll', $o: 'lele'},
            {$i: 'lh', $o: 'lhee'}, {$i: 'll', $o: 'llee'},

            // Copy-through: 0 Insertions
            {},  // equivalent to {$i: '', $o: ''}
            {$i: 'h', $o: 'h'},       {$i: 'l', $o: 'l'},
            {$i: 'hh', $o: 'hh'},     {$i: 'hl', $o: 'hl'},
            {$i: 'lh', $o: 'lh'},     {$i: 'll', $o: 'll'},
            {$i: 'hhh', $o: 'hhh'},   {$i: 'hhl', $o: 'hhl'},
            {$i: 'hlh', $o: 'hlh'},   {$i: 'hll', $o: 'hll'},
            {$i: 'lhh', $o: 'lhh'},   {$i: 'lhl', $o: 'lhl'},
            {$i: 'llh', $o: 'llh'},   {$i: 'lll', $o: 'lll'},
            {$i: 'hhhh', $o: 'hhhh'}, {$i: 'hhhl', $o: 'hhhl'},
            {$i: 'hhlh', $o: 'hhlh'}, {$i: 'hhll', $o: 'hhll'},
            {$i: 'hlhh', $o: 'hlhh'}, {$i: 'hlhl', $o: 'hlhl'},
            {$i: 'hllh', $o: 'hllh'}, {$i: 'hlll', $o: 'hlll'},
            {$i: 'lhhh', $o: 'lhhh'}, {$i: 'lhhl', $o: 'lhhl'},
            {$i: 'lhlh', $o: 'lhlh'}, {$i: 'lhll', $o: 'lhll'},
            {$i: 'llhh', $o: 'llhh'}, {$i: 'llhl', $o: 'llhl'},
            {$i: 'lllh', $o: 'lllh'}, {$i: 'llll', $o: 'llll'},
        ],
    });

    testGrammar({
        desc: '33k-1. Replace ε by e: Cnt_i:1 ε -> e {2} (vocab $i:h)',
        grammar: Count({$i:1},
        			 Vocab({$i:'h'},
                     	 OptionalReplace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 2, 2
                     	 ))),
        vocab: {$i:1, $o:2},
        results: [
            {$o: 'ee'},  // equivalent to {$i: '', $o: 'ee'}
            {$i: 'h', $o: 'ehe'},
            {$i: 'h', $o: 'eeh'},
            {$i: 'h', $o: 'hee'},
        ],
    });

    testGrammar({
        desc: '33k-2. Replace ε by e: Cnt_i:2 ε -> e {2} (vocab $i:h)',
        grammar: Count({$i:2},
        			 Vocab({$i:'h'},
                     	 OptionalReplace(
                             "", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 2, 2
                     	 ))),
        vocab: {$i:1, $o:2},
        results: [
            {$o: 'ee'},  // equivalent to {$i: '', $o: 'ee'}
            {$i: 'h', $o: 'ehe'},
            {$i: 'h', $o: 'eeh'},
            {$i: 'h', $o: 'hee'},
            {$i: 'hh', $o: 'eehh'},
            {$i: 'hh', $o: 'eheh'},
            {$i: 'hh', $o: 'ehhe'},
            {$i: 'hh', $o: 'heeh'},
            {$i: 'hh', $o: 'hehe'},
            {$i: 'hh', $o: 'hhee'},
        ],
    });

    testGrammar({
        desc: '33l. Replace ε|h by e: Cnt_4 ε|$i:h -> e {1} (vocab $i:hl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'hl'},
                     	 OptionalReplace(
                             Uni("", "h"), "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            // Insertions
            {$i: "h", $o: "eh"},      {$i: "h", $o: "he"},
            {$i: "l", $o: "el"},      {$i: "l", $o: "le"},
            {$i: "hh", $o: "ehh"},    {$i: "hh", $o: "heh"},
            {$i: "hh", $o: "hhe"},    {$i: "hl", $o: "ehl"},
            {$i: "hl", $o: "hel"},    {$i: "hl", $o: "hle"},
            {$i: "lh", $o: "elh"},    {$i: "lh", $o: "leh"},
            {$i: "lh", $o: "lhe"},    {$i: "ll", $o: "ell"},
            {$i: "ll", $o: "lel"},    {$i: "ll", $o: "lle"},
            {$i: "hhh", $o: "ehhh"},  {$i: "hhh", $o: "hehh"},
            {$i: "hhh", $o: "hheh"},  {$i: "hhh", $o: "hhhe"},
            {$i: "hhl", $o: "ehhl"},  {$i: "hhl", $o: "hehl"},
            {$i: "hhl", $o: "hhel"},  {$i: "hhl", $o: "hhle"},
            {$i: "hlh", $o: "ehlh"},  {$i: "hlh", $o: "helh"},
            {$i: "hlh", $o: "hleh"},  {$i: "hlh", $o: "hlhe"},
            {$i: "hll", $o: "ehll"},  {$i: "hll", $o: "hell"},
            {$i: "hll", $o: "hlel"},  {$i: "hll", $o: "hlle"},
            {$i: "lhh", $o: "elhh"},  {$i: "lhh", $o: "lehh"},
            {$i: "lhh", $o: "lheh"},  {$i: "lhh", $o: "lhhe"},
            {$i: "lhl", $o: "elhl"},  {$i: "lhl", $o: "lehl"},
            {$i: "lhl", $o: "lhel"},  {$i: "lhl", $o: "lhle"},
            {$i: "llh", $o: "ellh"},  {$i: "llh", $o: "lelh"},
            {$i: "llh", $o: "lleh"},  {$i: "llh", $o: "llhe"},
            {$i: "lll", $o: "elll"},  {$i: "lll", $o: "lell"},
            {$i: "lll", $o: "llel"},  {$i: "lll", $o: "llle"},
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
            // Replacements
            {$i: "h", $o: "e"},
            {$i: "hh", $o: "eh"},     {$i: "hh", $o: "he"},
            {$i: "hl", $o: "el"},     {$i: "lh", $o: "le"},
            {$i: "hhh", $o: "ehh"},   {$i: "hhh", $o: "heh"},
            {$i: "hhh", $o: "hhe"},   {$i: "hhl", $o: "ehl"},
            {$i: "hhl", $o: "hel"},   {$i: "hlh", $o: "elh"},
            {$i: "hlh", $o: "hle"},   {$i: "hll", $o: "ell"},
            {$i: "lhh", $o: "leh"},   {$i: "lhh", $o: "lhe"},
            {$i: "lhl", $o: "lel"},   {$i: "llh", $o: "lle"},
            {$i: "hhhh", $o: "ehhh"}, {$i: "hhhh", $o: "hehh"},
            {$i: "hhhh", $o: "hheh"}, {$i: "hhhh", $o: "hhhe"},
            {$i: "hhhl", $o: "ehhl"}, {$i: "hhhl", $o: "hehl"},
            {$i: "hhhl", $o: "hhel"}, {$i: "hhlh", $o: "ehlh"},
            {$i: "hhlh", $o: "helh"}, {$i: "hhlh", $o: "hhle"},
            {$i: "hhll", $o: "ehll"}, {$i: "hhll", $o: "hell"},
            {$i: "hlhh", $o: "elhh"}, {$i: "hlhh", $o: "hleh"},
            {$i: "hlhh", $o: "hlhe"}, {$i: "hlhl", $o: "elhl"},
            {$i: "hlhl", $o: "hlel"}, {$i: "hllh", $o: "ellh"},
            {$i: "hllh", $o: "hlle"}, {$i: "hlll", $o: "elll"},
            {$i: "lhhh", $o: "lehh"}, {$i: "lhhh", $o: "lheh"},
            {$i: "lhhh", $o: "lhhe"}, {$i: "lhhl", $o: "lehl"},
            {$i: "lhhl", $o: "lhel"}, {$i: "lhlh", $o: "lelh"},
            {$i: "lhlh", $o: "lhle"}, {$i: "lhll", $o: "lell"},
            {$i: "llhh", $o: "lleh"}, {$i: "llhh", $o: "llhe"},
            {$i: "llhl", $o: "llel"}, {$i: "lllh", $o: "llle"},
        ],
    });

    testGrammar({
        desc: '33m. Replace ε|h by e: Cnt_4 ε|$i:h -> e {1} (vocab $i:eh)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'eh'},
                     	 OptionalReplace(
                             Uni("", "h"), "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        vocab: {$i:2, $o:2},
        results: [
            // Insertions
            {$i: "h", $o: "eh"},      {$i: "h", $o: "he"},
            {$i: "e", $o: "ee"},
            {$i: "hh", $o: "ehh"},    {$i: "hh", $o: "heh"},
            {$i: "hh", $o: "hhe"},    {$i: "he", $o: "ehe"},
            {$i: "he", $o: "hee"},
            {$i: "eh", $o: "eeh"},
            {$i: "eh", $o: "ehe"},    {$i: "ee", $o: "eee"},
            {$i: "hhh", $o: "ehhh"},  {$i: "hhh", $o: "hehh"},
            {$i: "hhh", $o: "hheh"},  {$i: "hhh", $o: "hhhe"},
            {$i: "hhe", $o: "ehhe"},  {$i: "hhe", $o: "hehe"},
            {$i: "hhe", $o: "hhee"},
            {$i: "heh", $o: "eheh"},
            {$i: "heh", $o: "heeh"},  {$i: "heh", $o: "hehe"},
            {$i: "hee", $o: "ehee"},  {$i: "hee", $o: "heee"},
            {$i: "ehh", $o: "eehh"},
            {$i: "ehh", $o: "eheh"},  {$i: "ehh", $o: "ehhe"},
            {$i: "ehe", $o: "eehe"},
            {$i: "ehe", $o: "ehee"},
            {$i: "eeh", $o: "eeeh"},  {$i: "eeh", $o: "eehe"},
            {$i: "eee", $o: "eeee"},
            {$o: 'e'},  // equivalent to {$i: '', $o: 'e'}
            // Replacements
            {$i: "h", $o: "e"},
            {$i: "hh", $o: "eh"},     {$i: "hh", $o: "he"},
            {$i: "he", $o: "ee"},     {$i: "eh", $o: "ee"},
            {$i: "hhh", $o: "ehh"},   {$i: "hhh", $o: "heh"},
            {$i: "hhh", $o: "hhe"},   {$i: "hhe", $o: "ehe"},
            {$i: "hhe", $o: "hee"},   {$i: "heh", $o: "eeh"},
            {$i: "heh", $o: "hee"},   {$i: "hee", $o: "eee"},
            {$i: "ehh", $o: "eeh"},   {$i: "ehh", $o: "ehe"},
            {$i: "ehe", $o: "eee"},   {$i: "eeh", $o: "eee"},
            {$i: "hhhh", $o: "ehhh"}, {$i: "hhhh", $o: "hehh"},
            {$i: "hhhh", $o: "hheh"}, {$i: "hhhh", $o: "hhhe"},
            {$i: "hhhe", $o: "ehhe"}, {$i: "hhhe", $o: "hehe"},
            {$i: "hhhe", $o: "hhee"}, {$i: "hheh", $o: "eheh"},
            {$i: "hheh", $o: "heeh"}, {$i: "hheh", $o: "hhee"},
            {$i: "hhee", $o: "ehee"}, {$i: "hhee", $o: "heee"},
            {$i: "hehh", $o: "eehh"}, {$i: "hehh", $o: "heeh"},
            {$i: "hehh", $o: "hehe"}, {$i: "hehe", $o: "eehe"},
            {$i: "hehe", $o: "heee"}, {$i: "heeh", $o: "eeeh"},
            {$i: "heeh", $o: "heee"}, {$i: "heee", $o: "eeee"},
            {$i: "ehhh", $o: "eehh"}, {$i: "ehhh", $o: "eheh"},
            {$i: "ehhh", $o: "ehhe"}, {$i: "ehhe", $o: "eehe"},
            {$i: "ehhe", $o: "ehee"}, {$i: "eheh", $o: "eeeh"},
            {$i: "eheh", $o: "ehee"}, {$i: "ehee", $o: "eeee"},
            {$i: "eehh", $o: "eeeh"}, {$i: "eehh", $o: "eehe"},
            {$i: "eehe", $o: "eeee"}, {$i: "eeeh", $o: "eeee"},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '34a. Replace e by ε: Cnt_4 e -> ε {1} || #_ (vocab $i:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false, 1, 1
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {$i: 'e'},  // equivalent to {$i: 'e', $o: ''}
            {$i: 'ee', $o: 'e'}, {$i: 'eh', $o: 'h'},
            {$i: 'el', $o: 'l'},
            {$i: 'eee', $o: 'ee'}, {$i: 'eeh', $o: 'eh'},
            {$i: 'eel', $o: 'el'}, {$i: 'ehe', $o: 'he'},
            {$i: 'ehh', $o: 'hh'}, {$i: 'ehl', $o: 'hl'},
            {$i: 'ele', $o: 'le'}, {$i: 'elh', $o: 'lh'},
            {$i: 'ell', $o: 'll'},
            {$i: 'eeee', $o: 'eee'}, {$i: 'eeeh', $o: 'eeh'},
            {$i: 'eeel', $o: 'eel'}, {$i: 'eehe', $o: 'ehe'},
            {$i: 'eehh', $o: 'ehh'}, {$i: 'eehl', $o: 'ehl'},
            {$i: 'eele', $o: 'ele'}, {$i: 'eelh', $o: 'elh'},
            {$i: 'eell', $o: 'ell'}, {$i: 'ehee', $o: 'hee'},
            {$i: 'eheh', $o: 'heh'}, {$i: 'ehel', $o: 'hel'},
            {$i: 'ehhe', $o: 'hhe'}, {$i: 'ehhh', $o: 'hhh'},
            {$i: 'ehhl', $o: 'hhl'}, {$i: 'ehle', $o: 'hle'},
            {$i: 'ehlh', $o: 'hlh'}, {$i: 'ehll', $o: 'hll'},
            {$i: 'elee', $o: 'lee'}, {$i: 'eleh', $o: 'leh'},
            {$i: 'elel', $o: 'lel'}, {$i: 'elhe', $o: 'lhe'},
            {$i: 'elhh', $o: 'lhh'}, {$i: 'elhl', $o: 'lhl'},
            {$i: 'elle', $o: 'lle'}, {$i: 'ellh', $o: 'llh'},
            {$i: 'elll', $o: 'lll'},
        ],
    });

    testGrammar({
        desc: '34b. Replace e by ε: Cnt_4 e -> ε {1} || _# (vocab $i:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true, 1, 1
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {$i: 'e'},  // equivalent to {$i: 'e', $o: ''}
            {$i: 'ee', $o: 'e'}, {$i: 'he', $o: 'h'},
            {$i: 'le', $o: 'l'},
            {$i: 'eee', $o: 'ee'}, {$i: 'ehe', $o: 'eh'},
            {$i: 'ele', $o: 'el'}, {$i: 'hee', $o: 'he'},
            {$i: 'hhe', $o: 'hh'}, {$i: 'hle', $o: 'hl'},
            {$i: 'lee', $o: 'le'}, {$i: 'lhe', $o: 'lh'},
            {$i: 'lle', $o: 'll'},
            {$i: 'eeee', $o: 'eee'}, {$i: 'eehe', $o: 'eeh'},
            {$i: 'eele', $o: 'eel'}, {$i: 'ehee', $o: 'ehe'},
            {$i: 'ehhe', $o: 'ehh'}, {$i: 'ehle', $o: 'ehl'},
            {$i: 'elee', $o: 'ele'}, {$i: 'elhe', $o: 'elh'},
            {$i: 'elle', $o: 'ell'}, {$i: 'heee', $o: 'hee'},
            {$i: 'hehe', $o: 'heh'}, {$i: 'hele', $o: 'hel'},
            {$i: 'hhee', $o: 'hhe'}, {$i: 'hhhe', $o: 'hhh'},
            {$i: 'hhle', $o: 'hhl'}, {$i: 'hlee', $o: 'hle'},
            {$i: 'hlhe', $o: 'hlh'}, {$i: 'hlle', $o: 'hll'},
            {$i: 'leee', $o: 'lee'}, {$i: 'lehe', $o: 'leh'},
            {$i: 'lele', $o: 'lel'}, {$i: 'lhee', $o: 'lhe'},
            {$i: 'lhhe', $o: 'lhh'}, {$i: 'lhle', $o: 'lhl'},
            {$i: 'llee', $o: 'lle'}, {$i: 'llhe', $o: 'llh'},
            {$i: 'llle', $o: 'lll'},
        ],
    });

    testGrammar({
        desc: '34c. Replace e by ε: Cnt_4 e -> ε {1} || #_# (vocab $i:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true, 1, 1
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {$i: 'e'},  // equivalent to {$i: 'e', $o: ''}
        ],
    });

    testGrammar({
        desc: '34d. Replace e by ε: Cnt_4 e -> ε {1} (vocab $i:ehl)',
        grammar: Count({$i:4, $o:4},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {$i: 'e'},  // equivalent to {$i: 'e', $o: ''}
            {$i: 'eh', $o: 'h'},     {$i: 'el', $o: 'l'},
            {$i: 'he', $o: 'h'},     {$i: 'le', $o: 'l'},
            {$i: 'ehh', $o: 'hh'},   {$i: 'ehl', $o: 'hl'},
            {$i: 'elh', $o: 'lh'},   {$i: 'ell', $o: 'll'},
            {$i: 'heh', $o: 'hh'},   {$i: 'hel', $o: 'hl'},
            {$i: 'hhe', $o: 'hh'},   {$i: 'hle', $o: 'hl'},
            {$i: 'leh', $o: 'lh'},   {$i: 'lel', $o: 'll'},
            {$i: 'lhe', $o: 'lh'},   {$i: 'lle', $o: 'll'},
            {$i: 'ehhh', $o: 'hhh'}, {$i: 'ehhl', $o: 'hhl'},
            {$i: 'ehlh', $o: 'hlh'}, {$i: 'ehll', $o: 'hll'},
            {$i: 'elhh', $o: 'lhh'}, {$i: 'elhl', $o: 'lhl'},
            {$i: 'ellh', $o: 'llh'}, {$i: 'elll', $o: 'lll'},
            {$i: 'hehh', $o: 'hhh'}, {$i: 'hehl', $o: 'hhl'},
            {$i: 'helh', $o: 'hlh'}, {$i: 'hell', $o: 'hll'},
            {$i: 'hheh', $o: 'hhh'}, {$i: 'hhel', $o: 'hhl'},
            {$i: 'hhhe', $o: 'hhh'}, {$i: 'hhle', $o: 'hhl'},
            {$i: 'hleh', $o: 'hlh'}, {$i: 'hlel', $o: 'hll'},
            {$i: 'hlhe', $o: 'hlh'}, {$i: 'hlle', $o: 'hll'},
            {$i: 'lehh', $o: 'lhh'}, {$i: 'lehl', $o: 'lhl'},
            {$i: 'lelh', $o: 'llh'}, {$i: 'lell', $o: 'lll'},
            {$i: 'lheh', $o: 'lhh'}, {$i: 'lhel', $o: 'lhl'},
            {$i: 'lhhe', $o: 'lhh'}, {$i: 'lhle', $o: 'lhl'},
            {$i: 'lleh', $o: 'llh'}, {$i: 'llel', $o: 'lll'},
            {$i: 'llhe', $o: 'llh'}, {$i: 'llle', $o: 'lll'},
        ],
    });

    testGrammar({
        desc: '34e. Replace e by ε: Cnt_3 e -> ε {0,2} (vocab $i:ehl)',
        grammar: Count({$i:3, $o:3},
        			 Vocab({$i:'ehl'},
                     	 Replace(
                             "e", "",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        vocab: {$i:3, $o:3},
        results: [
            {},
            {$i: 'e'},  // equivalent to {$i: 'e', $o: ''}
            {$i: 'ee'}, // equivalent to {$i: 'ee', $o: ''}
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'eh', $o: 'h'},    {$i: 'el', $o: 'l'},
            {$i: 'he', $o: 'h'},    {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'le', $o: 'l'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'eeh', $o: 'h'},   {$i: 'eel', $o: 'l'},
            {$i: 'ehe', $o: 'h'},   {$i: 'ehh', $o: 'hh'},
            {$i: 'ehl', $o: 'hl'},  {$i: 'ele', $o: 'l'},
            {$i: 'elh', $o: 'lh'},  {$i: 'ell', $o: 'll'},
            {$i: 'hee', $o: 'h'},   {$i: 'heh', $o: 'hh'},
            {$i: 'hel', $o: 'hl'},  {$i: 'hhe', $o: 'hh'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hle', $o: 'hl'},  {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'}, {$i: 'lee', $o: 'l'},
            {$i: 'leh', $o: 'lh'},  {$i: 'lel', $o: 'll'},
            {$i: 'lhe', $o: 'lh'},  {$i: 'lhh', $o: 'lhh'},
            {$i: 'lhl', $o: 'lhl'}, {$i: 'lle', $o: 'll'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    testGrammar({
        desc: '34f. Replace e by ε: Cnt_i:3 e -> ε {2} (vocab $i:eh)',
        grammar: Count({$i:3},
        			 Vocab({$i:'eh'},
                     	 Replace(
                             "e", "",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 2, 2
                     	 ))),
        vocab: {$i:2, $o:2},
        results: [
            {$i: 'ee'},  // equivalent to {$i: 'ee', $o: ''}
            {$i: 'ehe', $o: 'h'},
            {$i: 'eeh', $o: 'h'},
            {$i: 'hee', $o: 'h'},
        ],
    });

    // Tests to isolate an expression simplification issue in CorrespondExpr.

    testGrammar({
        desc: '35a. Replace aba by X: Cnt_i:3 aba -> X {1}',
        grammar: Count({$i:3},
                     Replace(
                         "aba", "X",
                         EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 1, 1
                     )),
        vocab: {$i:2, $o:3},
        results: [
            {$i: 'aba', $o: 'X'},
        ],
        verbose: vb(VERBOSE_DEBUG),
    });

    testGrammar({
        desc: '35b. Replace aba by X: Cnt_i:3 aba -> X {1} ' +
              '(priority: $i,$o)',
        grammar: Cursor(["$i", "$o"],
                     Count({$i:3},
                         Replace(
                             "aba", "X",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                         ))),
        vocab: {$i:2, $o:3},
        results: [
            {$i: 'aba', $o: 'X'},
        ],
    });

    testGrammar({
        desc: '35c. Replace aba by X: Cnt_i:3 aba -> X {1} ' +
              '(priority: $o,$i)',
        grammar: Cursor(["$o", "$i"],
                     Count({$i:3},
                         Replace(
                             "aba", "X",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                         ))),
        vocab: {$i:2, $o:3},
        results: [
            {$i: 'aba', $o: 'X'},
        ],
    });

    // 36a-b: Tests exploring the ways for replacements to yield multiple
    // outputs for an input.
    // This is a phenomenon that occurs with repeated overlapping patterns
    // in a string. For example, the pattern ABA in the string ABABABA can
    // be found as (ABA)B(ABA) or AB(ABA)BA.
    // Test 36a is based on test 27.

    testGrammar({
        desc: '36a. Replace ee by e: Cnt_6 ee -> e {1,3}',
        grammar: Count({$i:6, $o:6},
                     Replace(
                         "ee", "e",
                         EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 1, 3
                     )),
        vocab: {$i:1, $o:1},
        results: [
            {$i: 'ee', $o: 'e'},
            {$i: 'eee', $o: 'ee'},      // 2 ways: (ee)e, e(ee)
            {$i: 'eeee', $o: 'ee'},     // (ee)(ee) -> (e)(e)
            {$i: 'eeee', $o: 'eee'},    // e(ee)e -> e(e)e which is valid
            {$i: 'eeeee', $o: 'eee'},   // 3 ways: e(ee)(ee), (ee)e(ee), (ee)(ee)e
            {$i: 'eeeeee', $o: 'eee'},  // (ee)(ee)(ee) -> (e)(e)(e)
            {$i: 'eeeeee', $o: 'eeee'}, // e(ee)e(ee) -> e(e)e(e)
                                        // (ee)e(ee)e -> (e)e(e)e
                                        // e(ee)(ee)e -> e(e)(e)e
        ],
        allowDuplicateOutputs: true,
    });

    // Note: test 36b is affected by the issue explored in tests 35a-c.
    const io_36b: StringDict[] = [
        {$i: 'abababa', $o: 'abXba'},
        {$i: 'abababa', $o: 'XbX'},
    ];

    testGrammar({
        desc: '36b. Replace aba by X: Spotchk_8 aba -> X {1,3}',
        grammar: Count({$i:8, $o:8},
                     Replace(
                         "aba", "X",
                         EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 1, 3
                     )),
        vocab: {$i:2, $o:3},
        restriction: inputs(io_36b),
        results: outputs(io_36b),
    });

    testGrammar({
        desc: '37a. Replace i by e: Cnt_2 i -> e || #_ (vocab $i:hi)',
        grammar: Count({$i:2, $o:2},
        			 Vocab({$i:'hi'},
                     	 Replace(
                             "i", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {},
            {$i: 'h', $o: 'h'},
            {$i: 'i', $o: 'e'},
            {$i: 'hh', $o: 'hh'},
            {$i: 'hi', $o: 'hi'},
            {$i: 'ih', $o: 'eh'},
            {$i: 'ii', $o: 'ei'},
        ],
    });

    testGrammar({
        desc: '37b. Replace i by e: Cnt_2 i -> e || _# (vocab $i:hi)',
        grammar: Count({$i:2, $o:2},
        			 Vocab({$i:'hi'},
                     	 Replace(
                             "i", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {},
            {$i: 'h', $o: 'h'},
            {$i: 'i', $o: 'e'},
            {$i: 'hh', $o: 'hh'},
            {$i: 'hi', $o: 'he'},
            {$i: 'ih', $o: 'ih'},
            {$i: 'ii', $o: 'ie'},
        ],
    });

    testGrammar({
        desc: '37c. Replace i by e: Cnt_2 i -> e || #_# (vocab $i:hi)',
        grammar: Count({$i:2, $o:2},
        			 Vocab({$i:'hi'},
                     	 Replace(
                             "i", "e",
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true
                     	 ))),
        vocab: {$i:2, $o:3},
        results: [
            {},
            {$i: 'h', $o: 'h'},
            {$i: 'i', $o: 'e'},
            {$i: 'hh', $o: 'hh'},
            {$i: 'hi', $o: 'hi'},
            {$i: 'ih', $o: 'ih'},
            {$i: 'ii', $o: 'ii'},
        ],
    });

});
