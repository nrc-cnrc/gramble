import {
    Any,
    Count,
    Epsilon,
    Intersect,
    Not,
    OptionalReplace,
    Cursor,
    Replace,
    Seq,
    Uni,
    Vocab,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammar,
    t1, t2, t3,
    withVocab,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2, verbose,
} from '../testUtil';

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

const EMPTY: string = '';

function inputs(expectedOutputs: StringDict[]): StringDict[] {
    let inputs: StringDict[] = [];
    for (const item of expectedOutputs) {
        if (item['t2'] != undefined) {
            let input: StringDict = {...item};
            delete input['t2'];
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
        if (item['t2'] != undefined) {
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
        desc: '1. Replace e by a in hello: t1:e -> t2:a {1+} || #h_llo#',
        grammar: Replace(
                     t1("e"), t2("a"),
                     t1("h"), t1("llo"), EMPTY_CONTEXT,
                     true, true, 1
                 ),
        tapes: ['t1', 't2'],
        vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},
        ],
    });

    testGrammar({
        desc: '2a. Replace e by a in hello: Cnt_7 t1:e -> t2:a {1} || h_llo#',
        grammar: Count({t1:7, t2:7},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("llo"), EMPTY_CONTEXT,
                         false, true, 1, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},
            {t1: 'ehello', t2: 'ehallo'},   {t1: 'hhello', t2: 'hhallo'},
            {t1: 'lhello', t2: 'lhallo'},   {t1: 'ohello', t2: 'ohallo'},
            {t1: 'eehello', t2: 'eehallo'}, {t1: 'ehhello', t2: 'ehhallo'},
            {t1: 'elhello', t2: 'elhallo'}, {t1: 'eohello', t2: 'eohallo'},
            {t1: 'hehello', t2: 'hehallo'}, {t1: 'hhhello', t2: 'hhhallo'},
            {t1: 'hlhello', t2: 'hlhallo'}, {t1: 'hohello', t2: 'hohallo'},
            {t1: 'lehello', t2: 'lehallo'}, {t1: 'lhhello', t2: 'lhhallo'},
            {t1: 'llhello', t2: 'llhallo'}, {t1: 'lohello', t2: 'lohallo'},
            {t1: 'oehello', t2: 'oehallo'}, {t1: 'ohhello', t2: 'ohhallo'},
            {t1: 'olhello', t2: 'olhallo'}, {t1: 'oohello', t2: 'oohallo'},
        ],
    });

    testGrammar({
        desc: '2b. Replace e by a in hello: Cnt_7 t1:e -> t2:a {1+} || h_llo#',
        grammar: Count({t1:7, t2:7},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("llo"), EMPTY_CONTEXT,
                         false, true, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},
            {t1: 'ehello', t2: 'ehallo'},   {t1: 'hhello', t2: 'hhallo'},
            {t1: 'lhello', t2: 'lhallo'},   {t1: 'ohello', t2: 'ohallo'},
            {t1: 'eehello', t2: 'eehallo'}, {t1: 'ehhello', t2: 'ehhallo'},
            {t1: 'elhello', t2: 'elhallo'}, {t1: 'eohello', t2: 'eohallo'},
            {t1: 'hehello', t2: 'hehallo'}, {t1: 'hhhello', t2: 'hhhallo'},
            {t1: 'hlhello', t2: 'hlhallo'}, {t1: 'hohello', t2: 'hohallo'},
            {t1: 'lehello', t2: 'lehallo'}, {t1: 'lhhello', t2: 'lhhallo'},
            {t1: 'llhello', t2: 'llhallo'}, {t1: 'lohello', t2: 'lohallo'},
            {t1: 'oehello', t2: 'oehallo'}, {t1: 'ohhello', t2: 'ohhallo'},
            {t1: 'olhello', t2: 'olhallo'}, {t1: 'oohello', t2: 'oohallo'},
        ],
    });

    const io_3: StringDict[] = [
        // Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal'},     {t1: 'ehel', t2: 'ehal'},
        {t1: 'hhel', t2: 'hhal'},   {t1: 'lhel', t2: 'lhal'},
        {t1: 'eehel', t2: 'eehal'}, {t1: 'ehhel', t2: 'ehhal'},
        {t1: 'elhel', t2: 'elhal'}, {t1: 'hehel', t2: 'hehal'},
        {t1: 'hhhel', t2: 'hhhal'}, {t1: 'hlhel', t2: 'hlhal'},
        {t1: 'lehel', t2: 'lehal'}, {t1: 'lhhel', t2: 'lhhal'},
        {t1: 'llhel', t2: 'llhal'},
        // Valid Inputs - Copy through
        // There are 351 valid copy through outputs in all for Count(5).
        {t1: 'e', t2: 'e'},         {t1: 'h', t2: 'h'},
        {t1: 'l', t2: 'l'},         {t1: 'ee', t2: 'ee'},
        {t1: 'eh', t2: 'eh'},       {t1: 'el', t2: 'el'},
        {t1: 'he', t2: 'he'},       {t1: 'hh', t2: 'hh'},
        {t1: 'hl', t2: 'hl'},       {t1: 'le', t2: 'le'},
        {t1: 'lh', t2: 'lh'},       {t1: 'll', t2: 'll'},
        // ...
        {t1: 'hle', t2: 'hle'},     {t1: 'elh', t2: 'elh'},
        {t1: 'helh', t2: 'helh'},   {t1: 'helhe', t2: 'helhe'},
        {t1: 'helll', t2: 'helll'},
        // Invalid Inputs
        {t1: 'helhel'},
    ];

    testGrammar({
        desc: '3. Replace e by a in hel: Spotchk_5 t1:e -> t2:a {0+} || h_l#',
        grammar: Count({t1:5, t2:5},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, true
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:4},
        restriction: inputs(io_3),
        results: outputs(io_3),
    });

    testGrammar({
        desc: '4. Replace e by a in hello: Cnt_7 t1:e -> t2:a {1+} || #h_llo',
        grammar: Count({t1:7, t2:7},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("llo"), EMPTY_CONTEXT,
                         true, false, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},     {t1: 'helloe', t2: 'halloe'},
            {t1: 'helloh', t2: 'halloh'},   {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},   {t1: 'helloee', t2: 'halloee'},
            {t1: 'helloeh', t2: 'halloeh'}, {t1: 'helloel', t2: 'halloel'},
            {t1: 'helloeo', t2: 'halloeo'}, {t1: 'hellohe', t2: 'hallohe'},
            {t1: 'hellohh', t2: 'hallohh'}, {t1: 'hellohl', t2: 'hallohl'},
            {t1: 'helloho', t2: 'halloho'}, {t1: 'hellole', t2: 'hallole'},
            {t1: 'hellolh', t2: 'hallolh'}, {t1: 'helloll', t2: 'halloll'},
            {t1: 'hellolo', t2: 'hallolo'}, {t1: 'hellooe', t2: 'hallooe'},
            {t1: 'hellooh', t2: 'hallooh'}, {t1: 'hellool', t2: 'hallool'},
            {t1: 'hellooo', t2: 'hallooo'},
        ],
    });

    const io_5: StringDict[] = [
        // Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal'},     {t1: 'hele', t2: 'hale'},
        {t1: 'helh', t2: 'halh'},   {t1: 'hell', t2: 'hall'},
        {t1: 'helee', t2: 'halee'}, {t1: 'heleh', t2: 'haleh'},
        {t1: 'helel', t2: 'halel'}, {t1: 'helhe', t2: 'halhe'},
        {t1: 'helhh', t2: 'halhh'}, {t1: 'helhl', t2: 'halhl'},
        {t1: 'helle', t2: 'halle'}, {t1: 'hellh', t2: 'hallh'},
        {t1: 'helll', t2: 'halll'},
        // Valid Inputs - Copy through
        // There are 351 valid copy through outputs in all for Count(5).
        {t1: 'e', t2: 'e'},         {t1: 'h', t2: 'h'},
        {t1: 'l', t2: 'l'},         {t1: 'ee', t2: 'ee'},
        {t1: 'eh', t2: 'eh'},       {t1: 'el', t2: 'el'},
        {t1: 'he', t2: 'he'},       {t1: 'hh', t2: 'hh'},
        {t1: 'hl', t2: 'hl'},       {t1: 'le', t2: 'le'},
        {t1: 'lh', t2: 'lh'},       {t1: 'll', t2: 'll'},
        // ...
        {t1: 'hle', t2: 'hle'},     {t1: 'elh', t2: 'elh'},
        {t1: 'hhel', t2: 'hhel'},   {t1: 'hehel', t2: 'hehel'},
        {t1: 'hhhel', t2: 'hhhel'},
        // Invalid Inputs
        {t1: 'helhel'},
    ];

    testGrammar({
        desc: '5. Replace e by a in hel: Spotchk_5 t1:e -> t2:a {0+} || #h_l',
        grammar: Count({t1:5, t2:5},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         true, false
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
        restriction: inputs(io_5),
        results: outputs(io_5),
    });

    // skip generation - this test takes ~4 seconds to run.
    testGrammar({
        desc: '6a. Replace e by a in hello: Cnt_6 t1:e -> t2:a {1} || h_llo',
        grammar: Count({t1:6, t2:6},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("llo"), EMPTY_CONTEXT,
                         false, false, 1, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},     {t1: 'helloe', t2: 'halloe'},
            {t1: 'helloh', t2: 'halloh'},   {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},   {t1: 'ehello', t2: 'ehallo'},
            {t1: 'hhello', t2: 'hhallo'},   {t1: 'lhello', t2: 'lhallo'},
            {t1: 'ohello', t2: 'ohallo'},
        ],
        skipGeneration: true,
    });

    // skip generation - this test takes ~5 seconds to run.
    testGrammar({
        desc: '6b. Replace e by a in hello: Cnt_6 t1:e -> t2:a {1+} || h_llo',
        grammar: Count({t1:6, t2:6},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("llo"), EMPTY_CONTEXT,
                         false, false, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},     {t1: 'helloe', t2: 'halloe'},
            {t1: 'helloh', t2: 'halloh'},   {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},   {t1: 'ehello', t2: 'ehallo'},
            {t1: 'hhello', t2: 'hhallo'},   {t1: 'lhello', t2: 'lhallo'},
            {t1: 'ohello', t2: 'ohallo'},
        ],
        skipGeneration: true,
    });

    // skip generation - this test takes more than 20 seconds to run.
    testGrammar({
        desc: '6c. Replace e by a in hello: Cnt_7 t1:e -> t2:a {1+} || h_llo',
        grammar: Count({t1:7, t2:7},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("llo"), EMPTY_CONTEXT,
                         false, false, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        results: [
            {t1: 'hello', t2: 'hallo'},     {t1: 'helloe', t2: 'halloe'},
            {t1: 'helloh', t2: 'halloh'},   {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},   {t1: 'ehello', t2: 'ehallo'},
            {t1: 'hhello', t2: 'hhallo'},   {t1: 'lhello', t2: 'lhallo'},
            {t1: 'ohello', t2: 'ohallo'},   {t1: 'helloee', t2: 'halloee'},
            {t1: 'helloeh', t2: 'halloeh'}, {t1: 'helloel', t2: 'halloel'},
            {t1: 'helloeo', t2: 'halloeo'}, {t1: 'hellohe', t2: 'hallohe'},
            {t1: 'hellohh', t2: 'hallohh'}, {t1: 'hellohl', t2: 'hallohl'},
            {t1: 'helloho', t2: 'halloho'}, {t1: 'hellole', t2: 'hallole'},
            {t1: 'hellolh', t2: 'hallolh'}, {t1: 'helloll', t2: 'halloll'},
            {t1: 'hellolo', t2: 'hallolo'}, {t1: 'hellooe', t2: 'hallooe'},
            {t1: 'hellooh', t2: 'hallooh'}, {t1: 'hellool', t2: 'hallool'},
            {t1: 'hellooo', t2: 'hallooo'}, {t1: 'ehelloe', t2: 'ehalloe'},
            {t1: 'ehelloh', t2: 'ehalloh'}, {t1: 'ehellol', t2: 'ehallol'},
            {t1: 'ehelloo', t2: 'ehalloo'}, {t1: 'hhelloe', t2: 'hhalloe'},
            {t1: 'hhelloh', t2: 'hhalloh'}, {t1: 'hhellol', t2: 'hhallol'},
            {t1: 'hhelloo', t2: 'hhalloo'}, {t1: 'lhelloe', t2: 'lhalloe'},
            {t1: 'lhelloh', t2: 'lhalloh'}, {t1: 'lhellol', t2: 'lhallol'},
            {t1: 'lhelloo', t2: 'lhalloo'}, {t1: 'ohelloe', t2: 'ohalloe'},
            {t1: 'ohelloh', t2: 'ohalloh'}, {t1: 'ohellol', t2: 'ohallol'},
            {t1: 'ohelloo', t2: 'ohalloo'}, {t1: 'eehello', t2: 'eehallo'},
            {t1: 'ehhello', t2: 'ehhallo'}, {t1: 'elhello', t2: 'elhallo'},
            {t1: 'eohello', t2: 'eohallo'}, {t1: 'hehello', t2: 'hehallo'},
            {t1: 'hhhello', t2: 'hhhallo'}, {t1: 'hlhello', t2: 'hlhallo'},
            {t1: 'hohello', t2: 'hohallo'}, {t1: 'lehello', t2: 'lehallo'},
            {t1: 'lhhello', t2: 'lhhallo'}, {t1: 'llhello', t2: 'llhallo'},
            {t1: 'lohello', t2: 'lohallo'}, {t1: 'oehello', t2: 'oehallo'},
            {t1: 'ohhello', t2: 'ohhallo'}, {t1: 'olhello', t2: 'olhallo'},
            {t1: 'oohello', t2: 'oohallo'},
        ],
        skipGeneration: true,
    });

    testGrammar({
        desc: '7a. Replace e by a in hel: Cnt_5 t1:e -> t2:a {1} || h_l',
        grammar: Count({t1:5, t2:5},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 1, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
        results: [
            {t1: 'hel', t2: 'hal'},     {t1: 'hele', t2: 'hale'},
            {t1: 'helh', t2: 'halh'},   {t1: 'hell', t2: 'hall'},
            {t1: 'ehel', t2: 'ehal'},   {t1: 'hhel', t2: 'hhal'},
            {t1: 'lhel', t2: 'lhal'},   {t1: 'ehele', t2: 'ehale'},
            {t1: 'ehelh', t2: 'ehalh'}, {t1: 'ehell', t2: 'ehall'},
            {t1: 'hhele', t2: 'hhale'}, {t1: 'hhelh', t2: 'hhalh'},
            {t1: 'hhell', t2: 'hhall'}, {t1: 'lhele', t2: 'lhale'},
            {t1: 'lhelh', t2: 'lhalh'}, {t1: 'lhell', t2: 'lhall'},
            {t1: 'helee', t2: 'halee'}, {t1: 'heleh', t2: 'haleh'},
            {t1: 'helel', t2: 'halel'}, {t1: 'helhe', t2: 'halhe'},
            {t1: 'helhh', t2: 'halhh'}, {t1: 'helhl', t2: 'halhl'},
            {t1: 'helle', t2: 'halle'}, {t1: 'hellh', t2: 'hallh'},
            {t1: 'helll', t2: 'halll'}, {t1: 'eehel', t2: 'eehal'},
            {t1: 'ehhel', t2: 'ehhal'}, {t1: 'elhel', t2: 'elhal'},
            {t1: 'hehel', t2: 'hehal'}, {t1: 'hhhel', t2: 'hhhal'},
            {t1: 'hlhel', t2: 'hlhal'}, {t1: 'lehel', t2: 'lehal'},
            {t1: 'lhhel', t2: 'lhhal'}, {t1: 'llhel', t2: 'llhal'},
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
        {t1: 'hel', t2: 'hal'},         {t1: 'hhel', t2: 'hhal'},
        {t1: 'hell', t2: 'hall'},       {t1: 'hhell', t2: 'hhall'},
        {t1: 'hehell', t2: 'hehall'},   {t1: 'elhelel', t2: 'elhalel'},
        {t1: 'hehelhe', t2: 'hehalhe'}, {t1: 'lehhelleh', t2: 'lehhalleh'},
        {t1: 'hlehellll', t2: 'hlehallll'},
        // Some Invalid Inputs
        {t1: 'helhel'},         {t1: 'hle'},
        {t1: 'hlehelllll'},     {t1: 'hellehlehleh'},
        {t1: 'lehlehlehhel'},
    ];

    testGrammar({
        desc: '7b. Replace e by a in hel: Spotchk_9 t1:e -> t2:a {1} || h_l',
        grammar: Count({t1:9, t2:9},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 1, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
        restriction: inputs(io_7b),
        results: outputs(io_7b),
    });

    testGrammar({
        desc: '8a. Replace e by a in hel: Cnt_5 t1:e -> t2:a {1+} || h_l',
        grammar: Count({t1:5, t2:5},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
        results: [
            {t1: 'hel', t2: 'hal'},     {t1: 'hele', t2: 'hale'},
            {t1: 'helh', t2: 'halh'},   {t1: 'hell', t2: 'hall'},
            {t1: 'ehel', t2: 'ehal'},   {t1: 'hhel', t2: 'hhal'},
            {t1: 'lhel', t2: 'lhal'},   {t1: 'ehele', t2: 'ehale'},
            {t1: 'ehelh', t2: 'ehalh'}, {t1: 'ehell', t2: 'ehall'},
            {t1: 'hhele', t2: 'hhale'}, {t1: 'hhelh', t2: 'hhalh'},
            {t1: 'hhell', t2: 'hhall'}, {t1: 'lhele', t2: 'lhale'},
            {t1: 'lhelh', t2: 'lhalh'}, {t1: 'lhell', t2: 'lhall'},
            {t1: 'helee', t2: 'halee'}, {t1: 'heleh', t2: 'haleh'},
            {t1: 'helel', t2: 'halel'}, {t1: 'helhe', t2: 'halhe'},
            {t1: 'helhh', t2: 'halhh'}, {t1: 'helhl', t2: 'halhl'},
            {t1: 'helle', t2: 'halle'}, {t1: 'hellh', t2: 'hallh'},
            {t1: 'helll', t2: 'halll'}, {t1: 'eehel', t2: 'eehal'},
            {t1: 'ehhel', t2: 'ehhal'}, {t1: 'elhel', t2: 'elhal'},
            {t1: 'hehel', t2: 'hehal'}, {t1: 'hhhel', t2: 'hhhal'},
            {t1: 'hlhel', t2: 'hlhal'}, {t1: 'lehel', t2: 'lehal'},
            {t1: 'lhhel', t2: 'lhhal'}, {t1: 'llhel', t2: 'llhal'},
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
        {t1: 'hel', t2: 'hal'},             {t1: 'hele', t2: 'hale'},
        {t1: 'ehel', t2: 'ehal'},           {t1: 'ehele', t2: 'ehale'},
        {t1: 'hehel', t2: 'hehal'},         {t1: 'helhe', t2: 'halhe'},
        {t1: 'helll', t2: 'halll'},         {t1: 'helhel', t2: 'halhal'},
        {t1: 'elhelel', t2: 'elhalel'},     {t1: 'hehelhe', t2: 'hehalhe'},
        {t1: 'helhelh', t2: 'halhalh'},     {t1: 'helehel', t2: 'halehal'},
        {t1: 'heelhel', t2: 'heelhal'},     {t1: 'helheel', t2: 'halheel'},
        {t1: 'helhhell', t2: 'halhhall'},   {t1: 'hhelhell', t2: 'hhalhall'},
        {t1: 'hhelehel', t2: 'hhalehal'},   {t1: 'hehelhel', t2: 'hehalhal'},
        {t1: 'helhelhe', t2: 'halhalhe'},   {t1: 'helhehel', t2: 'halhehal'},
        {t1: 'helhelhel', t2: 'halhalhal'}, {t1: 'hhelhhelh', t2: 'hhalhhalh'},
        {t1: 'ehelehele', t2: 'ehalehale'}, {t1: 'hehelhell', t2: 'hehalhall'},
        {t1: 'hhelhelhe', t2: 'hhalhalhe'}, {t1: 'hehelhhel', t2: 'hehalhhal'},
        {t1: 'hhelhehel', t2: 'hhalhehal'}, {t1: 'hellehelh', t2: 'hallehalh'},
        {t1: 'hellhelhe', t2: 'hallhalhe'},
        // Invalid Inputs
        {t1: 'e'},           {t1: 'he'},
        {t1: 'el'},          {t1: 'hheell'},
        {t1: 'lehlehleh'},   {t1: 'helhelhelh'},
        {t1: 'helhelhheell'},
    ];

    testGrammar({
        desc: '8b. Replace e by a in hel: Spotchk_9 t1:e -> t2:a {1+} || h_l',
        grammar: Count({t1:9, t2:9},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
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
        {t1: 'hel', t2: 'hal'},             {t1: 'helh', t2: 'halh'},
        {t1: 'hell', t2: 'hall'},           {t1: 'hhel', t2: 'hhal'},
        {t1: 'lhel', t2: 'lhal'},           {t1: 'hhelh', t2: 'hhalh'},
        {t1: 'hhell', t2: 'hhall'},         {t1: 'lhelh', t2: 'lhalh'},
        {t1: 'lhell', t2: 'lhall'},         {t1: 'helhel', t2: 'halhal'},
        {t1: 'elhelel', t2: 'elhalel'},     {t1: 'hehelhe', t2: 'hehalhe'},
        {t1: 'helhelh', t2: 'halhalh'},     {t1: 'helhell', t2: 'halhall'},
        {t1: 'helhhel', t2: 'halhhal'},     {t1: 'hellhel', t2: 'hallhal'},
        {t1: 'hhelhel', t2: 'hhalhal'},     {t1: 'lhelhel', t2: 'lhalhal'},
        {t1: 'helhhelh', t2: 'halhhalh'},   {t1: 'helhhell', t2: 'halhhall'},
        {t1: 'hellhelh', t2: 'hallhalh'},   {t1: 'hellhell', t2: 'hallhall'},
        {t1: 'hhelhelh', t2: 'hhalhalh'},   {t1: 'hhelhell', t2: 'hhalhall'},
        {t1: 'hhelhhel', t2: 'hhalhhal'},   {t1: 'hhellhel', t2: 'hhallhal'},
        {t1: 'lhelhelh', t2: 'lhalhalh'},   {t1: 'lhelhell', t2: 'lhalhall'},
        {t1: 'lhelhhel', t2: 'lhalhhal'},   {t1: 'lhellhel', t2: 'lhallhal'},
        {t1: 'hhelhhelh', t2: 'hhalhhalh'}, {t1: 'hhelhhell', t2: 'hhalhhall'},
        {t1: 'hhellhelh', t2: 'hhallhalh'}, {t1: 'hhellhell', t2: 'hhallhall'},
        {t1: 'lhelhhelh', t2: 'lhalhhalh'}, {t1: 'lhelhhell', t2: 'lhalhhall'},
        {t1: 'lhellhelh', t2: 'lhallhalh'}, {t1: 'lhellhell', t2: 'lhallhall'},
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},           {t1: 'he', t2: 'he'},
        {t1: 'leh', t2: 'leh'},       {t1: 'lehle', t2: 'lehle'},
        {t1: 'eehhll', t2: 'eehhll'}, {t1: 'eeehhhlll', t2: 'eeehhhlll'},
        // Invalid Inputs
        {t1: 'helhelhel'},            {t1: 'hhhelhelhh'},
        {t1: 'hehehelelel'},
    ];

    testGrammar({
        desc: '9. Replace e by a in hel: Spotchk_9 t1:e -> t2:a {0,2} || h_l',
        grammar: Count({t1:9, t2:9},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
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
        {t1: 'hel', t2: 'hal'},             {t1: 'hhel', t2: 'hhal'},
        {t1: 'hhell', t2: 'hhall'},         {t1: 'elhelel', t2: 'elhalel'},
        {t1: 'hehelhe', t2: 'hehalhe'},     {t1: 'lhhelhl', t2: 'lhhalhl'},
        {t1: 'helhelhel', t2: 'halhalhal'}, {t1: 'lhellhhel', t2: 'lhallhhal'},
        {t1: 'hlhhelllll', t2: 'hlhhalllll'},
        {t1: 'lhelhhllhel', t2: 'lhalhhllhal'},
        {t1: 'ehelehelehele', t2: 'ehalehalehale'},
        {t1: 'lhelhelhlhell', t2: 'lhalhalhlhall'},
        {t1: 'lhelhelhhlhel', t2: 'lhalhalhhlhal'},
        {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall'},
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},           {t1: 'he', t2: 'he'},
        {t1: 'leh', t2: 'leh'},       {t1: 'lehle', t2: 'lehle'},
        {t1: 'eehhll', t2: 'eehhll'}, {t1: 'eeehhhlll', t2: 'eeehhhlll'},
        {t1: 'lllleeeehhhh', t2: 'lllleeeehhhh'},
        {t1: 'heheheelelel', t2: 'heheheelelel'},
        // Some Invalid Inputs
        {t1: 'helhelhelhel'},         {t1: 'hlhellhhelhlhellh'},
    ];

    testGrammar({
        desc: '10. Replace e by a in hel: Spotchk_14 t1:e -> t2:a {0,3} || h_l',
        grammar: Count({t1:14, t2:14},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 3
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
        restriction: inputs(io_10),
        results: outputs(io_10),
    });

    testGrammar({
        desc: '11a. Replace e by a in he: Cnt_4 t1:e -> t2:a {0,2} || h_',
        grammar: Count({t1:4, t2:4},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1(""), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            {},
            // Replacement
            {t1: 'he', t2: 'ha'},     {t1: 'ehe', t2: 'eha'},
            {t1: 'hee', t2: 'hae'},   {t1: 'heh', t2: 'hah'},
            {t1: 'hhe', t2: 'hha'},   {t1: 'eehe', t2: 'eeha'},
            {t1: 'ehee', t2: 'ehae'}, {t1: 'eheh', t2: 'ehah'},
            {t1: 'ehhe', t2: 'ehha'}, {t1: 'heee', t2: 'haee'},
            {t1: 'heeh', t2: 'haeh'}, {t1: 'hehe', t2: 'haha'},
            {t1: 'hehh', t2: 'hahh'}, {t1: 'hhee', t2: 'hhae'},
            {t1: 'hheh', t2: 'hhah'}, {t1: 'hhhe', t2: 'hhha'},
            // Copy through only
            {t1: 'e', t2: 'e'},       {t1: 'h', t2: 'h'},
            {t1: 'ee', t2: 'ee'},     {t1: 'eh', t2: 'eh'},
            {t1: 'hh', t2: 'hh'},     {t1: 'eee', t2: 'eee'},
            {t1: 'eeh', t2: 'eeh'},   {t1: 'ehh', t2: 'ehh'},
            {t1: 'hhh', t2: 'hhh'},   {t1: 'eeee', t2: 'eeee'},
            {t1: 'eeeh', t2: 'eeeh'}, {t1: 'eehh', t2: 'eehh'},
            {t1: 'ehhh', t2: 'ehhh'}, {t1: 'hhhh', t2: 'hhhh'},
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
        {t1: 'he', t2: 'ha'},               {t1: 'heh', t2: 'hah'},
        {t1: 'eheh', t2: 'ehah'},           {t1: 'heheee', t2: 'hahaee'},
        {t1: 'hehheh', t2: 'hahhah'},       {t1: 'hehhhe', t2: 'hahhha'},
        {t1: 'hheheh', t2: 'hhahah'},       {t1: 'hhehhe', t2: 'hhahha'},
        {t1: 'hhhehe', t2: 'hhhaha'},       {t1: 'hhhehh', t2: 'hhhahh'},
        {t1: 'hehhehh', t2: 'hahhahh'},     {t1: 'hehhheh', t2: 'hahhhah'},
        {t1: 'eheheee', t2: 'ehahaee'},     {t1: 'eheehee', t2: 'ehaehae'},
        {t1: 'hhehhhehh', t2: 'hhahhhahh'}, {t1: 'hhhehhehh', t2: 'hhhahhahh'},
        {t1: 'hhhehhheh', t2: 'hhhahhhah'},
        {t1: 'hhhehhhehh', t2: 'hhhahhhahh'},
        {t1: 'eeheeeheee', t2: 'eehaeehaee'},
        {t1: 'ehheeeheeh', t2: 'ehhaeehaeh'},
        {t1: 'eeehehehhh', t2: 'eeehahahhh'},
        {t1: 'eeehehhhhe', t2: 'eeehahhhha'},
        {t1: 'heeeeeeehe', t2: 'haeeeeeeha'},
        {t1: 'hehehhhhhh', t2: 'hahahhhhhh'},
        {t1: 'heheeeeeee', t2: 'hahaeeeeee'},
        {t1: 'hhhhhhhehe', t2: 'hhhhhhhaha'},
        {t1: 'eeeeeehehe', t2: 'eeeeeehaha'},
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},               {t1: 'hh', t2: 'hh'},
        {t1: 'eee', t2: 'eee'},           {t1: 'eeehhh', t2: 'eeehhh'},
        {t1: 'eeeehhhh', t2: 'eeeehhhh'}, {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
        // Some Invalid Inputs
        {t1: 'hehehe'},                   {t1: 'hehehehe'},
        {t1: 'hehehehhhhh'},              {t1: 'eeeeehehehe'},
    ];

    testGrammar({
        desc: '11b. Replace e by a in he: Spotchk_10 t1:e -> t2:a {0,2} || h_',
        grammar: Count({t1:10, t2:10},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1(""), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
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
        {t1: 'he', t2: 'ha'},               {t1: 'heh', t2: 'hah'},
        {t1: 'eheh', t2: 'ehah'},           {t1: 'heheee', t2: 'hahaee'},
        {t1: 'hehheh', t2: 'hahhah'},       {t1: 'hehhhe', t2: 'hahhha'},
        {t1: 'hheheh', t2: 'hhahah'},       {t1: 'hhehhe', t2: 'hhahha'},
        {t1: 'hhhehe', t2: 'hhhaha'},       {t1: 'hhhehh', t2: 'hhhahh'},
        {t1: 'hehhehh', t2: 'hahhahh'},     {t1: 'hehhheh', t2: 'hahhhah'},
        {t1: 'eheheee', t2: 'ehahaee'},     {t1: 'eheehee', t2: 'ehaehae'},
        {t1: 'hhehhhehh', t2: 'hhahhhahh'}, {t1: 'hhhehhehh', t2: 'hhhahhahh'},
        {t1: 'hhhehhheh', t2: 'hhhahhhah'},
        {t1: 'hhhehhhehh', t2: 'hhhahhhahh'},
        {t1: 'eeheeeheee', t2: 'eehaeehaee'},
        {t1: 'ehheeeheeh', t2: 'ehhaeehaeh'},
        {t1: 'eeehehehhh', t2: 'eeehahahhh'},
        {t1: 'eeehehhhhe', t2: 'eeehahhhha'},
        {t1: 'heeeeeeehe', t2: 'haeeeeeeha'},
        {t1: 'hehehhhhhh', t2: 'hahahhhhhh'},
        {t1: 'heheeeeeee', t2: 'hahaeeeeee'},
        {t1: 'hhhhhhhehe', t2: 'hhhhhhhaha'},
        {t1: 'eeeeeehehe', t2: 'eeeeeehaha'},
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},               {t1: 'hh', t2: 'hh'},
        {t1: 'eee', t2: 'eee'},           {t1: 'eeehhh', t2: 'eeehhh'},
        {t1: 'eeeehhhh', t2: 'eeeehhhh'}, {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
        // Some Invalid Inputs
        {t1: 'hehehe'},                   {t1: 'hehehehe'},
        {t1: 'hehehhhhhhh'},              {t1: 'eeeeeeehehe'},
    ];

    testGrammar({
        desc: '12. Replace e by a in he: Spotchk_10 t1:e -> t2:a {0,2} || h_ε',
        grammar: Count({t1:10, t2:10},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT, 
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        restriction: inputs(io_12),
        results: outputs(io_12),
    });

    testGrammar({
        desc: '13a. Replace e by a in el: Cnt_4 t1:e -> t2:a {0,2} || ε_l',
        grammar: Count({t1:4, t2:4},
                     Replace(
                         t1("e"), t2("a"),
                         EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            {},
            // Replacement
            {t1: 'el', t2: 'al'},     {t1: 'eel', t2: 'eal'},
            {t1: 'ele', t2: 'ale'},   {t1: 'ell', t2: 'all'},
            {t1: 'lel', t2: 'lal'},   {t1: 'eeel', t2: 'eeal'},
            {t1: 'eele', t2: 'eale'}, {t1: 'eell', t2: 'eall'},
            {t1: 'elee', t2: 'alee'}, {t1: 'elel', t2: 'alal'},
            {t1: 'elle', t2: 'alle'}, {t1: 'elll', t2: 'alll'},
            {t1: 'leel', t2: 'leal'}, {t1: 'lele', t2: 'lale'},
            {t1: 'lell', t2: 'lall'}, {t1: 'llee', t2: 'llee'},
            {t1: 'llel', t2: 'llal'},
            // Copy through only
            {t1: 'e', t2: 'e'},       {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'ee'},     {t1: 'le', t2: 'le'},
            {t1: 'll', t2: 'll'},     {t1: 'eee', t2: 'eee'},
            {t1: 'lee', t2: 'lee'},   {t1: 'lle', t2: 'lle'},
            {t1: 'lll', t2: 'lll'},   {t1: 'eeee', t2: 'eeee'},
            {t1: 'leee', t2: 'leee'}, {t1: 'llle', t2: 'llle'},
            {t1: 'llll', t2: 'llll'},
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
        {t1: 'el', t2: 'al'},               {t1: 'lel', t2: 'lal'},
        {t1: 'elel', t2: 'alal'},           {t1: 'eeelel', t2: 'eealal'},
        {t1: 'lellel', t2: 'lallal'},       {t1: 'elllel', t2: 'alllal'},
        {t1: 'lelell', t2: 'lalall'},       {t1: 'ellell', t2: 'allall'},
        {t1: 'llelel', t2: 'llalal'},       {t1: 'llelll', t2: 'llalll'},
        {t1: 'ellelll', t2: 'allalll'},     {t1: 'elllell', t2: 'alllall'},
        {t1: 'eelelee', t2: 'ealalee'},     {t1: 'eeleele', t2: 'ealeale'},
        {t1: 'lelllelll', t2: 'lalllalll'}, {t1: 'llellelll', t2: 'llallalll'},
        {t1: 'llelllell', t2: 'llalllall'},
        {t1: 'llelllelll', t2: 'llalllalll'},
        {t1: 'eeeleeelee', t2: 'eealeealee'},
        {t1: 'leeleeelle', t2: 'lealeealle'},
        {t1: 'eeeelellll', t2: 'eeealallll'},
        {t1: 'eeeellllel', t2: 'eeeallllal'},
        {t1: 'eleeeeeeel', t2: 'aleeeeeeal'},
        {t1: 'elelllllll', t2: 'alalllllll'},
        {t1: 'eleleeeeee', t2: 'alaleeeeee'},
        {t1: 'llllllelel', t2: 'llllllalal'},
        {t1: 'eeeeeeelel', t2: 'eeeeeealal'},
        // Some Valid Inputs - Copy through only
        {t1: 'l', t2: 'l'},               {t1: 'll', t2: 'll'},
        {t1: 'eee', t2: 'eee'},           {t1: 'llleee', t2: 'llleee'},
        {t1: 'lllleeee', t2: 'lllleeee'}, {t1: 'llllleeeee', t2: 'llllleeeee'},
        // Some Invalid Inputs
        {t1: 'elelel'},                   {t1: 'elellllllll'},
        {t1: 'eeeeeeeelel'},
    ];

    testGrammar({
        desc: '13b. Replace e by a in el: Spotchk_10 t1:e -> t2:a {0,2} || ε_l',
        grammar: Count({t1:10, t2:10},
                     Replace(
                         t1("e"), t2("a"),
                         EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        restriction: inputs(io_13b),
        results: outputs(io_13b),
    });

    testGrammar({
        desc: '14. Replace e by a: Cnt_3 t1:e -> t2:a {0,2} (vocab t1:ehl)',
        grammar: Count({t1:3, t2:3},
                     withVocab({t1:'ehl'},
                         Replace(
                             t1("e"), t2("a"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                         ))),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:4},
        results: [
            {},
            // Replacement
            {t1: 'e', t2: 'a'},     {t1: 'ee', t2: 'aa'},
            {t1: 'eh', t2: 'ah'},   {t1: 'el', t2: 'al'},
            {t1: 'he', t2: 'ha'},   {t1: 'le', t2: 'la'},
            {t1: 'eeh', t2: 'aah'}, {t1: 'eel', t2: 'aal'},
            {t1: 'ehe', t2: 'aha'}, {t1: 'ehh', t2: 'ahh'},
            {t1: 'ehl', t2: 'ahl'}, {t1: 'ele', t2: 'ala'},
            {t1: 'elh', t2: 'alh'}, {t1: 'ell', t2: 'all'},
            {t1: 'hee', t2: 'haa'}, {t1: 'heh', t2: 'hah'},
            {t1: 'hel', t2: 'hal'}, {t1: 'hhe', t2: 'hha'},
            {t1: 'hle', t2: 'hla'}, {t1: 'lee', t2: 'laa'},
            {t1: 'leh', t2: 'lah'}, {t1: 'lel', t2: 'lal'},
            {t1: 'lhe', t2: 'lha'}, {t1: 'lle', t2: 'lla'},
            // Copy through only
            {t1: 'h', t2: 'h'},     {t1: 'l', t2: 'l'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hl', t2: 'hl'},
            {t1: 'lh', t2: 'lh'},   {t1: 'll', t2: 'll'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hlh', t2: 'hlh'}, {t1: 'hll', t2: 'hll'},
            {t1: 'lhh', t2: 'lhh'}, {t1: 'lhl', t2: 'lhl'},
            {t1: 'llh', t2: 'llh'}, {t1: 'lll', t2: 'lll'},
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
        {t1: 'e', t2: 'a'},             {t1: 'ee', t2: 'aa'},
        {t1: 'he', t2: 'ha'},           {t1: 'ell', t2: 'all'},
        {t1: 'eee', t2: 'aaa'},         {t1: 'ehhe', t2: 'ahha'},
        {t1: 'eehh', t2: 'aahh'},       {t1: 'lehel', t2: 'lahal'},
        {t1: 'ehehe', t2: 'ahaha'},     {t1: 'ellee', t2: 'allaa'},
        {t1: 'heeeh', t2: 'haaah'},     {t1: 'lehhe', t2: 'lahha'},
        {t1: 'eheehl', t2: 'ahaahl'},   {t1: 'ehhell', t2: 'ahhall'},
        {t1: 'hehhee', t2: 'hahhaa'},   {t1: 'ehehehl', t2: 'ahahahl'},
        {t1: 'ehheehh', t2: 'ahhaahh'}, {t1: 'ellelle', t2: 'allalla'},
        {t1: 'elleehh', t2: 'allaahh'}, {t1: 'heheheh', t2: 'hahahah'},
        {t1: 'hheeehh', t2: 'hhaaahh'}, {t1: 'hehlehle', t2: 'hahlahla'},
        {t1: 'hhehhehh', t2: 'hhahhahh'},
        {t1: 'hhehleheh', t2: 'hhahlahah'},
        {t1: 'hleellell', t2: 'hlaallall'},
        {t1: 'llelhelehh', t2: 'llalhalahh'},
        {t1: 'llehlehlehh', t2: 'llahlahlahh'},
        {t1: 'llellellell', t2: 'llallallall'},
        {t1: 'ehlhlhlhlhl', t2: 'ahlhlhlhlhl'},
        {t1: 'lllllllllle', t2: 'lllllllllla'},
        {t1: 'ehlhlhlhlhe', t2: 'ahlhlhlhlha'},
        // Some Valid Inputs - Copy through
        {t1: 'l', t2: 'l'},
        {t1: 'hh', t2: 'hh'},
        {t1: 'hhll', t2: 'hhll'},
        {t1: 'hlhlhlhl', t2: 'hlhlhlhl'},
        {t1: 'lhlhlhlhlh', t2: 'lhlhlhlhlh'},
        {t1: 'hhhhhllllll', t2: 'hhhhhllllll'},
        // Some Invalid Inputs
        {t1: 'eeee'},
        {t1: 'helhhhhellllhel'},
    ];

    testGrammar({
        desc: '15. Replace e by a: Spotchk_11 t1:e -> t2:a {0,3} (vocab t1:ehl)',
        grammar: Count({t1:11, t2:11},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2("a"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 3
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:4},
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
        {t1: 'e', t2: 'e'},                 {t1: 'ee', t2: 'ee'},
        {t1: 'hel', t2: 'heel'},            {t1: 'helh', t2: 'heelh'},
        {t1: 'hele', t2: 'heele'},          {t1: 'lhel', t2: 'lheel'},
        {t1: 'hhele', t2: 'hheele'},        {t1: 'ehele', t2: 'eheele'},
        {t1: 'lhell', t2: 'lheell'},        {t1: 'helhel', t2: 'heelheel'},
        {t1: 'elhelel', t2: 'elheelel'},    {t1: 'hehelhe', t2: 'heheelhe'},
        {t1: 'helhele', t2: 'heelheele'},   {t1: 'helhhel', t2: 'heelhheel'},
        {t1: 'lhelhel', t2: 'lheelheel'},   {t1: 'helhhele', t2: 'heelhheele'},
        {t1: 'helehell', t2: 'heeleheell'}, {t1: 'hhelhell', t2: 'hheelheell'},
        {t1: 'hhellhel', t2: 'hheellheel'}, {t1: 'ehelhele', t2: 'eheelheele'},
        {t1: 'ehelhhel', t2: 'eheelhheel'}, {t1: 'lhelhele', t2: 'lheelheele'},
        {t1: 'lhellhel', t2: 'lheellheel'},
        {t1: 'hhelehele', t2: 'hheeleheele'},
        {t1: 'ehelehele', t2: 'eheeleheele'},
        {t1: 'lhelehell', t2: 'lheeleheell'},
        {t1: 'heleeeehel', t2: 'heeleeeeheel'},
        {t1: 'hhhelhelhh', t2: 'hhheelheelhh'},
        {t1: 'lllhelehel', t2: 'lllheeleheel'},
        {t1: 'eeeeheleeee', t2: 'eeeeheeleeee'},
        {t1: 'hhhheeeellll', t2: 'hhhheeeellll'},
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},           {t1: 'he', t2: 'he'},
        {t1: 'leh', t2: 'leh'},       {t1: 'lehle', t2: 'lehle'},
        {t1: 'eehhll', t2: 'eehhll'}, {t1: 'eeehhhlll', t2: 'eeehhhlll'},
        {t1: 'lllleeeehhhh', t2: 'lllleeeehhhh'},
        {t1: 'heheheelelel', t2: 'heheheelelel'},
        // Some Invalid Inputs
        {t1: 'helhelhel'},  {t1: 'hhhhhhellllll'},
    ];

    testGrammar({
        desc: '16. Replace e by ee in hel: Spotchk_12 t1:e -> t2:ee {0,2} || h_l',
        grammar: Count({t1:12},
                     Replace(
                         t1("e"), t2("ee"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        restriction: inputs(io_16),
        results: outputs(io_16),
    });

    testGrammar({
        desc: '17. Replace e by ee in hel: Cnt_t1:6 t1:e -> t2:ee {1+} || #h_l',
        grammar: Count({t1:6},
                     Replace(
                         t1("e"), t2("ee"),
                         t1("h"), t1("l"), EMPTY_CONTEXT, 
                         true, false, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        results: [
            {t1: 'hel', t2: 'heel'},       {t1: 'helh', t2: 'heelh'},
            {t1: 'hele', t2: 'heele'},     {t1: 'hell', t2: 'heell'},
            {t1: 'helhh', t2: 'heelhh'},   {t1: 'helhe', t2: 'heelhe'},
            {t1: 'helhl', t2: 'heelhl'},   {t1: 'heleh', t2: 'heeleh'},
            {t1: 'helee', t2: 'heelee'},   {t1: 'helel', t2: 'heelel'},
            {t1: 'hellh', t2: 'heellh'},   {t1: 'helle', t2: 'heelle'},
            {t1: 'helll', t2: 'heelll'},   {t1: 'helhhh', t2: 'heelhhh'},
            {t1: 'helhhe', t2: 'heelhhe'}, {t1: 'helhhl', t2: 'heelhhl'},
            {t1: 'helheh', t2: 'heelheh'}, {t1: 'helhee', t2: 'heelhee'},
            {t1: 'helhel', t2: 'heelhel'}, {t1: 'helhlh', t2: 'heelhlh'},
            {t1: 'helhle', t2: 'heelhle'}, {t1: 'helhll', t2: 'heelhll'},
            {t1: 'helehh', t2: 'heelehh'}, {t1: 'helehe', t2: 'heelehe'},
            {t1: 'helehl', t2: 'heelehl'}, {t1: 'heleeh', t2: 'heeleeh'},
            {t1: 'heleee', t2: 'heeleee'}, {t1: 'heleel', t2: 'heeleel'},
            {t1: 'helelh', t2: 'heelelh'}, {t1: 'helele', t2: 'heelele'},
            {t1: 'helell', t2: 'heelell'}, {t1: 'hellhh', t2: 'heellhh'},
            {t1: 'hellhe', t2: 'heellhe'}, {t1: 'hellhl', t2: 'heellhl'},
            {t1: 'helleh', t2: 'heelleh'}, {t1: 'hellee', t2: 'heellee'},
            {t1: 'hellel', t2: 'heellel'}, {t1: 'helllh', t2: 'heelllh'},
            {t1: 'hellle', t2: 'heellle'}, {t1: 'hellll', t2: 'heellll'},                
        ],
    });

    const io_18: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},              {t1: 'e', t2: 'e'},
        {t1: 'l', t2: 'l'},              {t1: 'hl', t2: 'hl'},
        {t1: 'eh', t2: 'eh'},            {t1: 'll', t2: 'll'},
        {t1: 'heh', t2: 'heh'},          {t1: 'hee', t2: 'hee'},
        {t1: 'elh', t2: 'elh'},          {t1: 'ell', t2: 'ell'},
        {t1: 'lel', t2: 'lel'},          {t1: 'lll', t2: 'lll'},
        {t1: 'hhhh', t2: 'hhhh'},        {t1: 'hhee', t2: 'hhee'},
        {t1: 'hhel', t2: 'hhel'},        {t1: 'heel', t2: 'heel'},
        {t1: 'eheh', t2: 'eheh'},        {t1: 'ehee', t2: 'ehee'},
        {t1: 'ehel', t2: 'ehel'},        {t1: 'ellh', t2: 'ellh'},
        {t1: 'lheh', t2: 'lheh'},        {t1: 'lhel', t2: 'lhel'},
        {t1: 'lhle', t2: 'lhle'},        {t1: 'llll', t2: 'llll'},
        {t1: 'hhelh', t2: 'hhelh'},      {t1: 'elhelel', t2: 'elhelel'},
        {t1: 'hehelhe', t2: 'hehelhe'},  {t1: 'lhhelhl', t2: 'lhhelhl'},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'heel'},         {t1: 'helh', t2: 'heelh'},
        {t1: 'hele', t2: 'heele'},       {t1: 'hell', t2: 'heell'},
        {t1: 'helhel', t2: 'heelhel'},   {t1: 'helhelh', t2: 'heelhelh'},
        {t1: 'helhele', t2: 'heelhele'}, {t1: 'helhell', t2: 'heelhell'},
        {t1: 'helhhel', t2: 'heelhhel'}, {t1: 'helehel', t2: 'heelehel'},
        {t1: 'hellhel', t2: 'heellhel'},
        // Some Invalid Inputs
        {t1: 'helhelhel'},
    ];

    testGrammar({
        desc: '18. Replace e by ee in hel: Spotchk_7 t1:e -> t2:ee {0+} || #h_l',
        grammar: Count({t1:7},
                     Replace(
                         t1("e"), t2("ee"),
                         t1("h"), t1("l"), EMPTY_CONTEXT, 
                         true, false, 0
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        restriction: inputs(io_18),
        results: outputs(io_18),
    });

    testGrammar({
        desc: '19. Replace e by ee in hel: Cnt_t1:6 t1:e -> t2:ee {1+} || h_l#',
        grammar: Count({t1:6},
                     Replace(
                         t1("e"), t2("ee"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, true, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        results: [
            {t1: 'hel', t2: 'heel'},       {t1: 'hhel', t2: 'hheel'},
            {t1: 'ehel', t2: 'eheel'},     {t1: 'lhel', t2: 'lheel'},
            {t1: 'hhhel', t2: 'hhheel'},   {t1: 'hehel', t2: 'heheel'},
            {t1: 'hlhel', t2: 'hlheel'},   {t1: 'ehhel', t2: 'ehheel'},
            {t1: 'eehel', t2: 'eeheel'},   {t1: 'elhel', t2: 'elheel'},
            {t1: 'lhhel', t2: 'lhheel'},   {t1: 'lehel', t2: 'leheel'},
            {t1: 'llhel', t2: 'llheel'},   {t1: 'hhhhel', t2: 'hhhheel'},
            {t1: 'hhehel', t2: 'hheheel'}, {t1: 'hhlhel', t2: 'hhlheel'},
            {t1: 'hehhel', t2: 'hehheel'}, {t1: 'heehel', t2: 'heeheel'},
            {t1: 'helhel', t2: 'helheel'}, {t1: 'hlhhel', t2: 'hlhheel'},
            {t1: 'hlehel', t2: 'hleheel'}, {t1: 'hllhel', t2: 'hllheel'},
            {t1: 'ehhhel', t2: 'ehhheel'}, {t1: 'ehehel', t2: 'eheheel'},
            {t1: 'ehlhel', t2: 'ehlheel'}, {t1: 'eehhel', t2: 'eehheel'},
            {t1: 'eeehel', t2: 'eeeheel'}, {t1: 'eelhel', t2: 'eelheel'},
            {t1: 'elhhel', t2: 'elhheel'}, {t1: 'elehel', t2: 'eleheel'},
            {t1: 'ellhel', t2: 'ellheel'}, {t1: 'lhhhel', t2: 'lhhheel'},
            {t1: 'lhehel', t2: 'lheheel'}, {t1: 'lhlhel', t2: 'lhlheel'},
            {t1: 'lehhel', t2: 'lehheel'}, {t1: 'leehel', t2: 'leeheel'},
            {t1: 'lelhel', t2: 'lelheel'}, {t1: 'llhhel', t2: 'llhheel'},
            {t1: 'llehel', t2: 'lleheel'}, {t1: 'lllhel', t2: 'lllheel'},
        ],
    });

    const io_20: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},         {t1: 'e', t2: 'e'},
        {t1: 'l', t2: 'l'},         {t1: 'hl', t2: 'hl'},
        {t1: 'eh', t2: 'eh'},       {t1: 'll', t2: 'll'},
        {t1: 'heh', t2: 'heh'},     {t1: 'hee', t2: 'hee'},
        {t1: 'elh', t2: 'elh'},     {t1: 'ell', t2: 'ell'},
        {t1: 'lel', t2: 'lel'},     {t1: 'lll', t2: 'lll'},
        {t1: 'hhhh', t2: 'hhhh'},   {t1: 'hhee', t2: 'hhee'},
        {t1: 'helh', t2: 'helh'},   {t1: 'hele', t2: 'hele'},
        {t1: 'hell', t2: 'hell'},   {t1: 'heel', t2: 'heel'},
        {t1: 'eheh', t2: 'eheh'},   {t1: 'ehee', t2: 'ehee'},
        {t1: 'ehll', t2: 'ehll'},   {t1: 'ellh', t2: 'ellh'},
        {t1: 'lhee', t2: 'lhee'},   {t1: 'lheh', t2: 'lheh'},
        {t1: 'lhle', t2: 'lhle'},   {t1: 'llll', t2: 'llll'},
        {t1: 'hhelh', t2: 'hhelh'}, {t1: 'elhelel', t2: 'elhelel'},
        {t1: 'hehelhe', t2: 'hehelhe'},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'heel'},         {t1: 'hhel', t2: 'hheel'},
        {t1: 'ehel', t2: 'eheel'},       {t1: 'lhel', t2: 'lheel'},
        {t1: 'helhel', t2: 'helheel'},   {t1: 'hhelhel', t2: 'hhelheel'},
        {t1: 'ehelhel', t2: 'ehelheel'}, {t1: 'lhelhel', t2: 'lhelheel'},
        {t1: 'helhhel', t2: 'helhheel'}, {t1: 'helehel', t2: 'heleheel'},
        {t1: 'hellhel', t2: 'hellheel'},
        // Some Invalid Inputs
        {t1: 'helhelhel'},
    ];

    testGrammar({
        desc: '20. Replace e by ee in hel: Spotchk_7 t1:e -> t2:ee {0+} || h_l#',
        grammar: Count({t1:7},
                     Replace(
                         t1("e"), t2("ee"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, true, 0
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        restriction: inputs(io_20),
        results: outputs(io_20),
    });

    testGrammar({
        desc: '21a. Replace e by ee in he: Cnt_t1:4 t1:e -> t2:ee {0,2} || h_',
        grammar: Count({t1:4},
                     Replace(
                         t1("e"), t2("ee"),
                         t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: [
            {},
            // Replacement 
            {t1: 'he', t2: 'hee'},     {t1: 'ehe', t2: 'ehee'},
            {t1: 'hee', t2: 'heee'},   {t1: 'heh', t2: 'heeh'},
            {t1: 'hhe', t2: 'hhee'},   {t1: 'eehe', t2: 'eehee'},
            {t1: 'ehee', t2: 'eheee'}, {t1: 'eheh', t2: 'eheeh'},
            {t1: 'ehhe', t2: 'ehhee'}, {t1: 'heee', t2: 'heeee'},
            {t1: 'heeh', t2: 'heeeh'}, {t1: 'hehe', t2: 'heehee'},
            {t1: 'hehh', t2: 'heehh'}, {t1: 'hhee', t2: 'hheee'},
            {t1: 'hheh', t2: 'hheeh'}, {t1: 'hhhe', t2: 'hhhee'},
            // Copy through only
            {t1: 'e', t2: 'e'},       {t1: 'h', t2: 'h'},
            {t1: 'ee', t2: 'ee'},     {t1: 'eh', t2: 'eh'},
            {t1: 'hh', t2: 'hh'},     {t1: 'eee', t2: 'eee'},
            {t1: 'eeh', t2: 'eeh'},   {t1: 'ehh', t2: 'ehh'},
            {t1: 'hhh', t2: 'hhh'},   {t1: 'eeee', t2: 'eeee'},
            {t1: 'eeeh', t2: 'eeeh'}, {t1: 'eehh', t2: 'eehh'},
            {t1: 'ehhh', t2: 'ehhh'}, {t1: 'hhhh', t2: 'hhhh'},
        ],
    });

    // Full Generation:
    //  t1 Count=7: 246 results
    //  t1 Count=8: 465 results
    //  t1 Count=9: 847 results
    //  t1 Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // 10 characters or less on t1.
    const io_21b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},             {t1: 'e', t2: 'e'},
        {t1: 'eeehhh', t2: 'eeehhh'},   {t1: 'eeeeeeee', t2: 'eeeeeeee'},
        {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
        // Some Valid Inputs - Replacement
        {t1: 'he', t2: 'hee'},          {t1: 'hee', t2: 'heee'},
        {t1: 'hhe', t2: 'hhee'},        {t1: 'hehe', t2: 'heehee'},
        {t1: 'hheh', t2: 'hheeh'},      {t1: 'ehehe', t2: 'eheehee'},
        {t1: 'heheh', t2: 'heeheeh'},   {t1: 'hehee', t2: 'heeheee'},
        {t1: 'hehhe', t2: 'heehhee'},   {t1: 'hhehe', t2: 'hheehee'},
        {t1: 'eeheee', t2: 'eeheeee'},  {t1: 'ehehee', t2: 'eheeheee'},
        {t1: 'eheehe', t2: 'eheeehee'}, {t1: 'hehheh', t2: 'heehheeh'},
        {t1: 'hehhhe', t2: 'heehhhee'}, {t1: 'heehee', t2: 'heeeheee'},
        {t1: 'hhhehh', t2: 'hhheehh'},  {t1: 'hehehhh', t2: 'heeheehhh'},
        {t1: 'hhehheh', t2: 'hheehheeh'},
        {t1: 'eeeeeehehe', t2: 'eeeeeeheehee'},
        {t1: 'eehehhheee', t2: 'eeheehhheeee'},
        {t1: 'heeeeeeehe', t2: 'heeeeeeeehee'},
        {t1: 'hehehhhhhh', t2: 'heeheehhhhhh'},
        {t1: 'hehhhhhhhe', t2: 'heehhhhhhhee'},
        {t1: 'hehhhhhhhh', t2: 'heehhhhhhhh'},
        {t1: 'hhheeeheee', t2: 'hhheeeeheeee'},
        {t1: 'hhhehhhehh', t2: 'hhheehhheehh'},
        {t1: 'hhhhehehhh', t2: 'hhhheeheehhh'},
        {t1: 'hhhhheeeee', t2: 'hhhhheeeeee'},
        // Some Invalid Inputs
        {t1: 'hehehe'},         {t1: 'hheheheh'},
        {t1: 'hhhhhhheeeeeee'},
    ];

    testGrammar({
        desc: '21b. Replace e by ee in he: Spotchk_10 t1:e -> t2:ee {0,2} || h_',
        grammar: Count({t1:10},
                     Replace(
                         t1("e"), t2("ee"), t1("h"), EMPTY_CONTEXT, 
                         EMPTY_CONTEXT, false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:2},
        restriction: inputs(io_21b),
        results: outputs(io_21b),
    });

    testGrammar({
        desc: '22a. Replace e by ee in el: Cnt_t1:4 t1:e -> t2:ee {0,2} || _l',
        grammar: Count({t1:4},
                     Replace(
                         t1("e"), t2("ee"),
                         EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: [
            {},
            // Replacement 
            {t1: 'el', t2: 'eel'},     {t1: 'eel', t2: 'eeel'},
            {t1: 'ele', t2: 'eele'},   {t1: 'ell', t2: 'eell'},
            {t1: 'lel', t2: 'leel'},   {t1: 'eeel', t2: 'eeeel'},
            {t1: 'eele', t2: 'eeele'}, {t1: 'eell', t2: 'eeell'},
            {t1: 'elee', t2: 'eelee'}, {t1: 'elel', t2: 'eeleel'},
            {t1: 'elle', t2: 'eelle'}, {t1: 'elll', t2: 'eelll'},
            {t1: 'leel', t2: 'leeel'}, {t1: 'lele', t2: 'leele'},
            {t1: 'lell', t2: 'leell'}, {t1: 'llel', t2: 'lleel'},
            // Copy through only
            {t1: 'e', t2: 'e'},       {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'ee'},     {t1: 'le', t2: 'le'},
            {t1: 'll', t2: 'll'},     {t1: 'eee', t2: 'eee'},
            {t1: 'lee', t2: 'lee'},   {t1: 'lle', t2: 'lle'},
            {t1: 'lll', t2: 'lll'},   {t1: 'eeee', t2: 'eeee'},
            {t1: 'leee', t2: 'leee'}, {t1: 'llee', t2: 'llee'},
            {t1: 'llle', t2: 'llle'}, {t1: 'llll', t2: 'llll'},
        ],
    });

    const io_22b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'e', t2: 'e'},             {t1: 'l', t2: 'l'},
        {t1: 'llleee', t2: 'llleee'},   {t1: 'eeeeeeee', t2: 'eeeeeeee'},
        {t1: 'llllleeeee', t2: 'llllleeeee'},
        // Some Valid Inputs - Replacement
        {t1: 'el', t2: 'eel'},          {t1: 'ele', t2: 'eele'},
        {t1: 'eel', t2: 'eeel'},        {t1: 'elel', t2: 'eeleel'},
        {t1: 'lell', t2: 'leell'},      {t1: 'eelel', t2: 'eeeleel'},
        {t1: 'elele', t2: 'eeleele'},   {t1: 'elell', t2: 'eeleell'},
        {t1: 'ellel', t2: 'eelleel'},   {t1: 'lelel', t2: 'leeleel'},
        {t1: 'eeelee', t2: 'eeeelee'},  {t1: 'eeleel', t2: 'eeeleeel'},
        {t1: 'eelele', t2: 'eeeleele'}, {t1: 'eleele', t2: 'eeleeele'},
        {t1: 'ellell', t2: 'eelleell'}, {t1: 'elllel', t2: 'eellleel'},
        {t1: 'llelll', t2: 'lleelll'},  {t1: 'elellll', t2: 'eeleellll'},
        {t1: 'lellell', t2: 'leelleell'},
        {t1: 'eeeeeeelel', t2: 'eeeeeeeeleel'},
        {t1: 'eeelllelee', t2: 'eeeellleelee'},
        {t1: 'eleeeeeeel', t2: 'eeleeeeeeeel'},
        {t1: 'elelllllll', t2: 'eeleelllllll'},
        {t1: 'elllllllel', t2: 'eellllllleel'},
        {t1: 'elllllllll', t2: 'eelllllllll'},
        {t1: 'lleleeelee', t2: 'lleeleeeelee'},
        {t1: 'llelllelll', t2: 'lleellleelll'},
        {t1: 'lllelellll', t2: 'llleeleellll'},
        {t1: 'lllleleeee', t2: 'lllleeleeee'},
        // Some Invalid Inputs
        {t1: 'elelel'},         {t1: 'hhehehehlelelell'},
        {t1: 'lllllleleeeeee'},
    ];

    testGrammar({
        desc: '22b. Replace e by ee in el: Spotchk_10 t1:e -> t2:ee {0,2} || _l',
        grammar: Count({t1:10},
                     Replace(
                         t1("e"), t2("ee"),
                         EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:2},
        restriction: inputs(io_22b),
        results: outputs(io_22b),
    });

    testGrammar({
        desc: '23. Replace e by ee: Cnt_t1:3 t1:e -> t2:ee {0,2} (vocab t1:ehl)',
        grammar: Count({t1:3},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2("ee"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        results: [
            {},
            // Replacement
            {t1: 'e', t2: 'ee'},      {t1: 'ee', t2: 'eeee'},
            {t1: 'eh', t2: 'eeh'},    {t1: 'el', t2: 'eel'},
            {t1: 'he', t2: 'hee'},    {t1: 'le', t2: 'lee'},
            {t1: 'eeh', t2: 'eeeeh'}, {t1: 'eel', t2: 'eeeel'},
            {t1: 'ehe', t2: 'eehee'}, {t1: 'ehh', t2: 'eehh'},
            {t1: 'ehl', t2: 'eehl'},  {t1: 'ele', t2: 'eelee'},
            {t1: 'elh', t2: 'eelh'},  {t1: 'ell', t2: 'eell'},
            {t1: 'hee', t2: 'heeee'}, {t1: 'heh', t2: 'heeh'},
            {t1: 'hel', t2: 'heel'},  {t1: 'hhe', t2: 'hhee'},
            {t1: 'hle', t2: 'hlee'},  {t1: 'lee', t2: 'leeee'},
            {t1: 'leh', t2: 'leeh'},  {t1: 'lel', t2: 'leel'},
            {t1: 'lhe', t2: 'lhee'},  {t1: 'lle', t2: 'llee'},
            // Copy through only
            {t1: 'h', t2: 'h'},     {t1: 'l', t2: 'l'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hl', t2: 'hl'},
            {t1: 'lh', t2: 'lh'},   {t1: 'll', t2: 'll'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hlh', t2: 'hlh'}, {t1: 'hll', t2: 'hll'},
            {t1: 'lhh', t2: 'lhh'}, {t1: 'lhl', t2: 'lhl'},
            {t1: 'llh', t2: 'llh'}, {t1: 'lll', t2: 'lll'},
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
        {t1: 'heel', t2: 'hel'},            {t1: 'heelh', t2: 'helh'},
        {t1: 'heele', t2: 'hele'},          {t1: 'lheel', t2: 'lhel'},
        {t1: 'hheele', t2: 'hhele'},        {t1: 'eheele', t2: 'ehele'},
        {t1: 'lheell', t2: 'lhell'},        {t1: 'heelheel', t2: 'helhel'},
        {t1: 'elheelel', t2: 'elhelel'},    {t1: 'heheelhe', t2: 'hehelhe'},
        {t1: 'heelheele', t2: 'helhele'},   {t1: 'heelhheel', t2: 'helhhel'},
        {t1: 'lheelheel', t2: 'lhelhel'},   {t1: 'heelhheele', t2: 'helhhele'},
        {t1: 'heeleheell', t2: 'helehell'}, {t1: 'hheelheell', t2: 'hhelhell'},
        {t1: 'hheellheel', t2: 'hhellhel'}, {t1: 'eheelheele', t2: 'ehelhele'},
        {t1: 'eheelhheel', t2: 'ehelhhel'}, {t1: 'lheelheele', t2: 'lhelhele'},
        {t1: 'lheellheel', t2: 'lhellhel'},
        {t1: 'hheeleheele', t2: 'hhelehele'},
        {t1: 'eheeleheele', t2: 'ehelehele'},
        {t1: 'lheeleheell', t2: 'lhelehell'},
        {t1: 'heeleeeeheel', t2: 'heleeeehel'},
        {t1: 'hhheelheelhh', t2: 'hhhelhelhh'},
        {t1: 'lllheeleheel', t2: 'lllhelehel'},
        {t1: 'eeeeheeleeee', t2: 'eeeeheleeee'},
        // Some Valid Inputs - Copy through
        {t1: 'e', t2: 'e'},           {t1: 'h', t2: 'h'},
        {t1: 'ee', t2: 'ee'},         {t1: 'he', t2: 'he'},
        {t1: 'leh', t2: 'leh'},       {t1: 'lehle', t2: 'lehle'},
        {t1: 'eehhll', t2: 'eehhll'}, {t1: 'eeehhhlll', t2: 'eeehhhlll'},
        {t1: 'hhhheeeellll', t2: 'hhhheeeellll'},
        {t1: 'lllleeeehhhh', t2: 'lllleeeehhhh'},
        {t1: 'heheleleelel', t2: 'heheleleelel'},
        // Some Invalid Inputs
        {t1: 'heelheelheel'},   {t1: 'hhhhhheellllll'},
    ];

    testGrammar({
        desc: '24. Replace ee by e in heel: Spotchk_12 t1:ee -> t2:e {0,2} || h_l',
        grammar: Count({t1:12, t2:12},
                     Replace(
                         t1("ee"), t2("e"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        restriction: inputs(io_24),
        results: outputs(io_24),
    });

    testGrammar({
        desc: '25a. Replace ee by e in hee: Cnt_t2:4 t1:ee -> t2:e {0,2} || h_',
        grammar: Count({t2:4},
                     Replace(
                         t1("ee"), t2("e"),
                         t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: [
            {},
            // Replacement 
            {t1: 'hee', t2: 'he'},     {t1: 'ehee', t2: 'ehe'},
            {t1: 'heee', t2: 'hee'},   {t1: 'heeh', t2: 'heh'},
            {t1: 'hhee', t2: 'hhe'},   {t1: 'eehee', t2: 'eehe'},
            {t1: 'eheee', t2: 'ehee'}, {t1: 'eheeh', t2: 'eheh'},
            {t1: 'ehhee', t2: 'ehhe'}, {t1: 'heeee', t2: 'heee'},
            {t1: 'heeeh', t2: 'heeh'}, {t1: 'heehe', t2: 'hehe'},
            {t1: 'heehh', t2: 'hehh'}, {t1: 'hehee', t2: 'hehe'},
            {t1: 'hheee', t2: 'hhee'}, {t1: 'hheeh', t2: 'hheh'},
            {t1: 'hhhee', t2: 'hhhe'}, {t1: 'heehee', t2: 'hehe'},
            // Copy through only
            {t1: 'e', t2: 'e'},       {t1: 'h', t2: 'h'},
            {t1: 'ee', t2: 'ee'},     {t1: 'eh', t2: 'eh'},
            {t1: 'he', t2: 'he'},     {t1: 'hh', t2: 'hh'},
            {t1: 'eee', t2: 'eee'},   {t1: 'eeh', t2: 'eeh'},
            {t1: 'ehe', t2: 'ehe'},   {t1: 'ehh', t2: 'ehh'},
            {t1: 'heh', t2: 'heh'},   {t1: 'hhe', t2: 'hhe'},
            {t1: 'hhh', t2: 'hhh'},   {t1: 'eeee', t2: 'eeee'},
            {t1: 'eeeh', t2: 'eeeh'}, {t1: 'eehe', t2: 'eehe'},
            {t1: 'eehh', t2: 'eehh'}, {t1: 'eheh', t2: 'eheh'},
            {t1: 'ehhe', t2: 'ehhe'}, {t1: 'ehhh', t2: 'ehhh'},
            {t1: 'hehe', t2: 'hehe'}, {t1: 'hehh', t2: 'hehh'},
            {t1: 'hheh', t2: 'hheh'}, {t1: 'hhhe', t2: 'hhhe'},
            {t1: 'hhhh', t2: 'hhhh'},
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
        {t1: 'h', t2: 'h'},             {t1: 'e', t2: 'e'},
        {t1: 'eeehhh', t2: 'eeehhh'},   {t1: 'eeeeeeee', t2: 'eeeeeeee'},
        {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
        // Some Valid Inputs - Replacement
        {t1: 'hee', t2: 'he'},          {t1: 'heee', t2: 'hee'},
        {t1: 'hhee', t2: 'hhe'},        {t1: 'heehee', t2: 'hehe'},
        {t1: 'hheeh', t2: 'hheh'},      {t1: 'eheehee', t2: 'ehehe'},
        {t1: 'heeheeh', t2: 'heheh'},   {t1: 'heeheee', t2: 'hehee'},
        {t1: 'heehhee', t2: 'hehhe'},   {t1: 'hheehee', t2: 'hhehe'},
        {t1: 'eeheeee', t2: 'eeheee'},  {t1: 'eheeheee', t2: 'ehehee'},
        {t1: 'eheeehee', t2: 'eheehe'}, {t1: 'heehheeh', t2: 'hehheh'},
        {t1: 'heehhhee', t2: 'hehhhe'}, {t1: 'heeeheee', t2: 'heehee'},
        {t1: 'hhheehh', t2: 'hhhehh'},  {t1: 'heeheehhh', t2: 'hehehhh'},
        {t1: 'hheehheeh', t2: 'hhehheh'},
        {t1: 'eeeeeeheehee', t2: 'eeeeeehehe'},
        {t1: 'eeheehhheeee', t2: 'eehehhheee'},
        {t1: 'heeeeeeeehee', t2: 'heeeeeeehe'},
        {t1: 'heeheehhhhhh', t2: 'hehehhhhhh'},
        {t1: 'heehhhhhhhee', t2: 'hehhhhhhhe'},
        {t1: 'heehhhhhhhh', t2: 'hehhhhhhhh'},
        {t1: 'hhheeeeheeee', t2: 'hhheeeheee'},
        {t1: 'hhheehhheehh', t2: 'hhhehhhehh'},
        {t1: 'hhhheeheehhh', t2: 'hhhhehehhh'},
        {t1: 'hhhhheeeeee', t2: 'hhhhheeeee'},
        // Some Invalid Inputs
        {t1: 'heeheehee'},      {t1: 'hheeheeheeh'},
        {t1: 'hhhhhhheeeeeee'},
    ];

    testGrammar({
        desc: '25b. Replace ee by e in hee: Spotchk_12 t1:ee -> t2:e {0,2} || h_',
        grammar: Count({t1:12, t2:12},
                     Replace(
                         t1("ee"), t2("e"),
                         t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:2},
        restriction: inputs(io_25b),
        results: outputs(io_25b),
    });

    testGrammar({
        desc: '26a. Replace ee by e in eel: Cnt_t2:4 t1:ee -> t2:e {0,2} || _l',
        grammar: Count({t2:4},
                     Replace(
                         t1("ee"), t2("e"),
                         EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: [
            {},
            // Replacement 
            {t1: 'eel', t2: 'el'},     {t1: 'eeel', t2: 'eel'},
            {t1: 'eele', t2: 'ele'},   {t1: 'eell', t2: 'ell'},
            {t1: 'leel', t2: 'lel'},   {t1: 'eeeel', t2: 'eeel'},
            {t1: 'eeele', t2: 'eele'}, {t1: 'eeell', t2: 'eell'},
            {t1: 'eelee', t2: 'elee'}, {t1: 'eelel', t2: 'elel'},
            {t1: 'eelle', t2: 'elle'}, {t1: 'eelll', t2: 'elll'},
            {t1: 'eleel', t2: 'elel'}, {t1: 'leeel', t2: 'leel'},
            {t1: 'leele', t2: 'lele'}, {t1: 'leell', t2: 'lell'},
            {t1: 'lleel', t2: 'llel'}, {t1: 'eeleel', t2: 'elel'},
            // Copy through only
            {t1: 'e', t2: 'e'},       {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'ee'},     {t1: 'el', t2: 'el'},
            {t1: 'le', t2: 'le'},     {t1: 'll', t2: 'll'},
            {t1: 'eee', t2: 'eee'},   {t1: 'ele', t2: 'ele'},
            {t1: 'ell', t2: 'ell'},   {t1: 'lee', t2: 'lee'},
            {t1: 'lel', t2: 'lel'},   {t1: 'lle', t2: 'lle'},
            {t1: 'lll', t2: 'lll'},   {t1: 'eeee', t2: 'eeee'},
            {t1: 'elee', t2: 'elee'}, {t1: 'elel', t2: 'elel'},
            {t1: 'elle', t2: 'elle'}, {t1: 'elll', t2: 'elll'},
            {t1: 'leee', t2: 'leee'}, {t1: 'lele', t2: 'lele'},
            {t1: 'lell', t2: 'lell'}, {t1: 'llee', t2: 'llee'},
            {t1: 'llel', t2: 'llel'}, {t1: 'llle', t2: 'llle'},
            {t1: 'llll', t2: 'llll'},
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
        {t1: 'e', t2: 'e'},             {t1: 'l', t2: 'l'},
        {t1: 'llleee', t2: 'llleee'},   {t1: 'eeeeeeee', t2: 'eeeeeeee'},
        {t1: 'llllleeeee', t2: 'llllleeeee'},
        // Some Valid Inputs - Replacement
        {t1: 'eel', t2: 'el'},          {t1: 'eele', t2: 'ele'},
        {t1: 'eeel', t2: 'eel'},        {t1: 'eeleel', t2: 'elel'},
        {t1: 'leell', t2: 'lell'},      {t1: 'eeeleel', t2: 'eelel'},
        {t1: 'eeleele', t2: 'elele'},   {t1: 'eeleell', t2: 'elell'},
        {t1: 'eelleel', t2: 'ellel'},   {t1: 'leeleel', t2: 'lelel'},
        {t1: 'eeeelee', t2: 'eeelee'},  {t1: 'eeeleeel', t2: 'eeleel'},
        {t1: 'eeeleele', t2: 'eelele'}, {t1: 'eeleeele', t2: 'eleele'},
        {t1: 'eelleell', t2: 'ellell'}, {t1: 'eellleel', t2: 'elllel'},
        {t1: 'lleelll', t2: 'llelll'},  {t1: 'eeleellll', t2: 'elellll'},
        {t1: 'leelleell', t2: 'lellell'},
        {t1: 'eeeeeeeeleel', t2: 'eeeeeeelel'},
        {t1: 'eeeellleelee', t2: 'eeelllelee'},
        {t1: 'eeleeeeeeeel', t2: 'eleeeeeeel'},
        {t1: 'eeleelllllll', t2: 'elelllllll'},
        {t1: 'eellllllleel', t2: 'elllllllel'},
        {t1: 'eelllllllll', t2: 'elllllllll'},
        {t1: 'lleeleeeelee', t2: 'lleleeelee'},
        {t1: 'lleellleelll', t2: 'llelllelll'},
        {t1: 'llleeleellll', t2: 'lllelellll'},
        {t1: 'lllleeleeee', t2: 'lllleleeee'},
        // Some Invalid Inputs
        {t1: 'eeleeleel'},     {t1: 'leeleeleell'},
        {t1: 'llllleeleeeee'},
    ];

    testGrammar({
        desc: '26b. Replace ee by e in eel: Spotchk_12 t1:ee -> t2:e {0,2} || _l',
        grammar: Count({t1:12, t2:12},
                     Replace(
                         t1("ee"), t2("e"),
                         EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:2},
        restriction: inputs(io_26b),
        results: outputs(io_26b),
    });

    testGrammar({
        desc: '27. Replace ee by e: Cnt_t2:3 t1:ee -> t2:e {0,2} (vocab t1:ehl)',
        grammar: Count({t2:3},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("ee"), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        results: [
            {},
            // Replacement
            {t1: 'ee', t2: 'e'},   {t1: 'eee', t2: 'ee'},
            {t1: 'eeh', t2: 'eh'}, {t1: 'eel', t2: 'el'},
            {t1: 'hee', t2: 'he'}, {t1: 'lee', t2: 'le'},
            // See test 36a for a discussion of the following 2 results.
            {t1: 'eeee', t2: 'ee'},  // (ee)(ee) -> (e)(e)
            {t1: 'eeee', t2: 'eee'}, // e(ee)e -> e(e)e which is valid
            {t1: 'eeeh', t2: 'eeh'},  {t1: 'eeel', t2: 'eel'},
            {t1: 'eehe', t2: 'ehe'},  {t1: 'eehh', t2: 'ehh'},
            {t1: 'eehl', t2: 'ehl'},  {t1: 'eele', t2: 'ele'},
            {t1: 'eelh', t2: 'elh'},  {t1: 'eell', t2: 'ell'},
            {t1: 'ehee', t2: 'ehe'},  {t1: 'elee', t2: 'ele'},
            {t1: 'heee', t2: 'hee'},  {t1: 'heeh', t2: 'heh'},
            {t1: 'heel', t2: 'hel'},  {t1: 'hhee', t2: 'hhe'},
            {t1: 'hlee', t2: 'hle'},  {t1: 'leee', t2: 'lee'},
            {t1: 'leeh', t2: 'leh'},  {t1: 'leel', t2: 'lel'},
            {t1: 'lhee', t2: 'lhe'},  {t1: 'llee', t2: 'lle'},
            {t1: 'eeeee', t2: 'eee'}, {t1: 'eeeeh', t2: 'eeh'},
            {t1: 'eeeel', t2: 'eel'}, {t1: 'eehee', t2: 'ehe'},
            {t1: 'eelee', t2: 'ele'}, {t1: 'heeee', t2: 'hee'},
            {t1: 'leeee', t2: 'lee'},
            // Copy through only
            {t1: 'e', t2: 'e'},     {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},     {t1: 'eh', t2: 'eh'},
            {t1: 'el', t2: 'el'},   {t1: 'he', t2: 'he'},
            {t1: 'hh', t2: 'hh'},   {t1: 'hl', t2: 'hl'},
            {t1: 'le', t2: 'le'},   {t1: 'lh', t2: 'lh'},
            {t1: 'll', t2: 'll'},   {t1: 'ehe', t2: 'ehe'},
            {t1: 'ehh', t2: 'ehh'}, {t1: 'ehl', t2: 'ehl'},
            {t1: 'ele', t2: 'ele'}, {t1: 'elh', t2: 'elh'},
            {t1: 'ell', t2: 'ell'}, {t1: 'heh', t2: 'heh'},
            {t1: 'hel', t2: 'hel'}, {t1: 'hhe', t2: 'hhe'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hle', t2: 'hle'}, {t1: 'hlh', t2: 'hlh'},
            {t1: 'hll', t2: 'hll'}, {t1: 'leh', t2: 'leh'},
            {t1: 'lel', t2: 'lel'}, {t1: 'lhe', t2: 'lhe'},
            {t1: 'lhh', t2: 'lhh'}, {t1: 'lhl', t2: 'lhl'},
            {t1: 'lle', t2: 'lle'}, {t1: 'llh', t2: 'llh'},
            {t1: 'lll', t2: 'lll'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '28a. Insert a in h_l: Cnt_t1:4 t1:0 -> t2:a {0,2} || h_l',
        grammar: Count({t1:4},
                     Replace(
                         t1(""), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            {},
            // Insertion
            {t1: 'hl', t2: 'hal'},     {t1: 'hhl', t2: 'hhal'},
            {t1: 'hlh', t2: 'halh'},   {t1: 'hll', t2: 'hall'},
            {t1: 'lhl', t2: 'lhal'},   {t1: 'hhhl', t2: 'hhhal'},
            {t1: 'hhlh', t2: 'hhalh'}, {t1: 'hhll', t2: 'hhall'},
            {t1: 'hlhh', t2: 'halhh'}, {t1: 'hlhl', t2: 'halhal'},
            {t1: 'hllh', t2: 'hallh'}, {t1: 'hlll', t2: 'halll'},
            {t1: 'lhhl', t2: 'lhhal'}, {t1: 'lhlh', t2: 'lhalh'},
            {t1: 'lhll', t2: 'lhall'}, {t1: 'llhl', t2: 'llhal'},
            // Copy through only
            {t1: 'h', t2: 'h'},       {t1: 'l', t2: 'l'},
            {t1: 'hh', t2: 'hh'},     {t1: 'lh', t2: 'lh'},
            {t1: 'll', t2: 'll'},     {t1: 'hhh', t2: 'hhh'},
            {t1: 'lhh', t2: 'lhh'},   {t1: 'llh', t2: 'llh'},
            {t1: 'lll', t2: 'lll'},   {t1: 'hhhh', t2: 'hhhh'},
            {t1: 'lhhh', t2: 'lhhh'}, {t1: 'llhh', t2: 'llhh'},
            {t1: 'lllh', t2: 'lllh'}, {t1: 'llll', t2: 'llll'},
        ],
    });

    // Full Generation:
    //  t1 Count=8: 465 results
    //  t1 Count=9: 847 results
    //  t1 Count=10: 1485 results
    // Here we spot check some of the possible 1485 results for
    // t1 with 10 characters or less.
    const io_28b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},             {t1: 'lllllhhhhh', t2: 'lllllhhhhh'},
        // Some Valid Inputs - Insertion
        {t1: 'hl', t2: 'hal'},          {t1: 'lhlh', t2: 'lhalh'},
        {t1: 'lhll', t2: 'lhall'},      {t1: 'hlhl', t2: 'halhal'},
        {t1: 'hlhhlh', t2: 'halhhalh'}, {t1: 'hhlhhll', t2: 'hhalhhall'},
        {t1: 'hhhhhlllll', t2: 'hhhhhalllll'},
        {t1: 'hlhhhhhhhl', t2: 'halhhhhhhhal'},
        // Some Invalid Inputs
        {t1: 'hlhlhl'},                 {t1: 'hhhhhhhhhhh'},
        {t1: 'hhhhllllhlhhh'},
    ];

    testGrammar({
        desc: '28b. Insert a in h_l: Spotchk_10 t1:0 -> t2:a {0,2} || h_l',
        grammar: Count({t1:10},
                     Replace(
                         t1(""), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        restriction: inputs(io_28b),
        results: outputs(io_28b),
    });

    testGrammar({
        desc: '29a. Delete e in hel:Cnt_t2:3 t1:e -> t2:0 {0,2} || h_l',
        grammar: Count({t2:3},
                     Replace(
                         t1("e"), t2(""),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        results: [
            {},
            // Deletion
            {t1: 'hel', t2: 'hl'},   {t1: 'ehel', t2: 'ehl'},
            {t1: 'hhel', t2: 'hhl'}, {t1: 'hele', t2: 'hle'},
            {t1: 'helh', t2: 'hlh'}, {t1: 'hell', t2: 'hll'},
            {t1: 'lhel', t2: 'lhl'},
            // Copy through only
            {t1: 'e', t2: 'e'},     {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},     {t1: 'ee', t2: 'ee'},
            {t1: 'eh', t2: 'eh'},   {t1: 'el', t2: 'el'},
            {t1: 'he', t2: 'he'},   {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'},   {t1: 'le', t2: 'le'},
            {t1: 'lh', t2: 'lh'},   {t1: 'll', t2: 'll'},
            {t1: 'eee', t2: 'eee'}, {t1: 'eeh', t2: 'eeh'},
            {t1: 'eel', t2: 'eel'}, {t1: 'ehe', t2: 'ehe'},
            {t1: 'ehh', t2: 'ehh'}, {t1: 'ehl', t2: 'ehl'},
            {t1: 'ele', t2: 'ele'}, {t1: 'elh', t2: 'elh'},
            {t1: 'ell', t2: 'ell'}, {t1: 'hee', t2: 'hee'},
            {t1: 'heh', t2: 'heh'}, {t1: 'hhe', t2: 'hhe'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hle', t2: 'hle'}, {t1: 'hlh', t2: 'hlh'},
            {t1: 'hll', t2: 'hll'}, {t1: 'lee', t2: 'lee'},
            {t1: 'leh', t2: 'leh'}, {t1: 'lel', t2: 'lel'},
            {t1: 'lhe', t2: 'lhe'}, {t1: 'lhh', t2: 'lhh'},
            {t1: 'lhl', t2: 'lhl'}, {t1: 'lle', t2: 'lle'},
            {t1: 'llh', t2: 'llh'}, {t1: 'lll', t2: 'lll'},
        ],
    });

    // Full Generation:
    //  t2 Count=8: 15853 results
    //  t2 Count=9: 50637 results
    //  t2 Count=10: 161304 results
    // Here we spot check some of the possible 161304 results for
    // t2 with 10 characters or less.
    const io_29b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'h', t2: 'h'},             {t1: 'hlhl', t2: 'hlhl'},
        {t1: 'lllllhhhhh', t2: 'lllllhhhhh'},
        // Some Valid Inputs - Deletion
        {t1: 'hel', t2: 'hl'},          {t1: 'lhelh', t2: 'lhlh'},
        {t1: 'lhell', t2: 'lhll'},      {t1: 'helhel', t2: 'hlhl'},
        {t1: 'helhhelh', t2: 'hlhhlh'}, {t1: 'hhelhhell', t2: 'hhlhhll'},
        {t1: 'hhhhhelllll', t2: 'hhhhhlllll'},
        {t1: 'helhhhhhhhel', t2: 'hlhhhhhhhl'},
        // Some Invalid Inputs
        {t1: 'helhelhel'},              {t1: 'hhhhhhhhhhhhhhhh'},
        {t1: 'hhhhelllllhelhhh'},
    ];

    testGrammar({
        desc: '29b. Delete e in hel: Spotchk_10 t1:e -> t2:0 {0,2} || h_l',
        grammar: Count({t2:10},
                     Replace(
                         t1("e"), t2(""),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        restriction: inputs(io_29b),
        results: outputs(io_29b),
    });

    const io_30a: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'hl', t2: 'hl'},         {t1: 'heh', t2: 'heh'},
        {t1: 'lel', t2: 'lel'},       {t1: 'hheeell', t2: 'hheeell'},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal'},       {t1: 'hhel', t2: 'hhal'},
        {t1: 'hele', t2: 'hale'},     {t1: 'ehey', t2: 'ehay'},
        {t1: 'hhell', t2: 'hhall'},   {t1: 'hlhhelllll', t2: 'hlhhalllll'},
        {t1: 'hey', t2: 'hay'},       {t1: 'hhey', t2: 'hhay'},
        {t1: 'hheyy', t2: 'hhayy'},   {t1: 'hlhheyyyyy', t2: 'hlhhayyyyy'},
        {t1: 'helhel', t2: 'halhal'}, {t1: 'heyhey', t2: 'hayhay'},
        {t1: 'helhey', t2: 'halhay'}, {t1: 'eheyehele', t2: 'ehayehale'},
        // Some Invalid Inputs
        {t1: 'helheyhel'},            {t1: 'hhheeelllyyy'},
        {t1: 'eeheyeehelee'},
    ];

    testGrammar({
        desc: '30a. Replace e by a in hel and hey: Spotchk_10 ' +
              't1:e -> t2:a {0,2} || h_l|y',
        grammar: Count({t1:10, t2:10},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), Uni(t1("l"), t1("y")), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:4, t2:5},
        restriction: inputs(io_30a),
        results: outputs(io_30a),
    });

    const io_30b: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'hl', t2: 'hl'},         {t1: 'heh', t2: 'heh'},
        {t1: 'lel', t2: 'lel'},       {t1: 'hheeell', t2: 'hheeell'},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal'},       {t1: 'hhel', t2: 'hhal'},
        {t1: 'hele', t2: 'hale'},     {t1: 'eyel', t2: 'eyal'},
        {t1: 'hhell', t2: 'hhall'},   {t1: 'hlhhelllll', t2: 'hlhhalllll'},
        {t1: 'yel', t2: 'yal'},       {t1: 'yyel', t2: 'yyal'},
        {t1: 'yyell', t2: 'yyall'},   {t1: 'ylyyelllll', t2: 'ylyyalllll'},
        {t1: 'helhel', t2: 'halhal'}, {t1: 'yelyel', t2: 'yalyal'},
        {t1: 'helyel', t2: 'halyal'}, {t1: 'eyelehele', t2: 'eyalehale'},
        // Some Invalid Inputs
        {t1: 'yelhelyel'},            {t1: 'hhheeelllyyy'},
        {t1: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '30b. Replace e by a in hel and yel: Spotchk_10 ' +
              't1:e -> t2:a {0,2} || h|y_l',
        grammar: Count({t1:10, t2:10},
                     Replace(
                         t1("e"), t2("a"),
                         Uni(t1("h"), t1("y")), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        restriction: inputs(io_30b),
        results: outputs(io_30b),
    });

    const io_30c: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'hl', t2: 'hl'},           {t1: 'heh', t2: 'heh'},
        {t1: 'lel', t2: 'lel'},
        // Some Valid Inputs - Replacement
        {t1: 'hheeell', t2: 'hhaeell'}, {t1: 'hel', t2: 'hal'},
        {t1: 'hele', t2: 'hale'},       {t1: 'ehey', t2: 'ehay'},
        {t1: 'hhel', t2: 'hhal'},       {t1: 'hhell', t2: 'hhall'},
        {t1: 'hlhhelllll', t2: 'hlhhalllll'},
        {t1: 'hey', t2: 'hay'},         {t1: 'hhey', t2: 'hhay'},
        {t1: 'hheyy', t2: 'hhayy'},     {t1: 'hlhheyyyyy', t2: 'hlhhayyyyy'},
        {t1: 'hlhheeyyyy', t2: 'hlhhaeyyyy'},
        {t1: 'helhel', t2: 'halhal'},   {t1: 'heyhey', t2: 'hayhay'},
        {t1: 'helhee', t2: 'halhae'},   {t1: 'eheyehele', t2: 'ehayehale'},
        // Some Invalid Inputs
        {t1: 'helheyhee'},              {t1: 'hhheeelllyyy'},
        {t1: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '30c. Replace e by a in hel, hey, hee: Spotchk_10 ' +
              't1:e -> t2:a {0,2} || h_(.&~h) (vocab t1:ehly)',
        grammar: Count({t1:10, t2:10},
        			 withVocab({t1:'ehly'},
                     	 Replace(
                         	 t1("e"), t2("a"),
                             t1("h"),
                             Intersect(Any("t1"), Not(t1("h"))),
                             EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:4, t2:5},
        restriction: inputs(io_30c),
        results: outputs(io_30c),
    });

    const io_30d: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'hl', t2: 'hl'},           {t1: 'heh', t2: 'heh'},
        {t1: 'lel', t2: 'lel'},
        // Some Valid Inputs - Replacement
        {t1: 'hheeell', t2: 'hheeall'}, {t1: 'hel', t2: 'hal'},
        {t1: 'hele', t2: 'hale'},       {t1: 'eyel', t2: 'eyal'},
        {t1: 'hhel', t2: 'hhal'},       {t1: 'hhell', t2: 'hhall'},
        {t1: 'hlhhelllll', t2: 'hlhhalllll'},
        {t1: 'yel', t2: 'yal'},         {t1: 'yyel', t2: 'yyal'},
        {t1: 'yyell', t2: 'yyall'},     {t1: 'ylyyelllll', t2: 'ylyyalllll'},
        {t1: 'eeyeelllll', t2: 'eeyealllll'},
        {t1: 'helhel', t2: 'halhal'},   {t1: 'yelyel', t2: 'yalyal'},
        {t1: 'yeleel', t2: 'yaleal'},
        // Some Invalid Inputs
        {t1: 'helyeleel'},              {t1: 'eeehhhlllyyy'},
        {t1: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '30d. Replace e by a in hel, yel, eel: Spotchk_10 ' +
              't1:e -> t2:a {0,2} || (.&~l)_l (vocab t1:ehly)',
        grammar: Count({t1:10, t2:10},
        			 withVocab({t1:'ehly'},
                     	 Replace(
                             t1("e"), t2("a"),
                             Intersect(Any("t1"), Not(t1("l"))),
                             t1("l"),
                             EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:4, t2:5},
        restriction: inputs(io_30d),
        results: outputs(io_30d),
    });

    const io_31a: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'hl', t2: 'hl'},         {t1: 'heh', t2: 'heh'},
        {t1: 'lel', t2: 'lel'},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal'},       {t1: 'helo', t2: 'halo'},
        {t1: 'hole', t2: 'hale'},     {t1: 'hhel', t2: 'hhal'},
        {t1: 'hhell', t2: 'hhall'},   {t1: 'hlhhelllll', t2: 'hlhhalllll'},
        {t1: 'hol', t2: 'hal'},       {t1: 'hhol', t2: 'hhal'},
        {t1: 'hholl', t2: 'hhall'},   {t1: 'hlhholllll', t2: 'hlhhalllll'},
        {t1: 'helhel', t2: 'halhal'}, {t1: 'helhol', t2: 'halhal'},
        {t1: 'holhol', t2: 'halhal'},
        // Some Invalid Inputs
        {t1: 'helholhel'},            {t1: 'eeeooohhhlll'},
        {t1: 'eeheleeholee'},
    ];

    testGrammar({
        desc: '31a. Replace e or o by a in hel: Spotchk_10 ' +
              't1:e|t1:o -> t2:a {0,2} || h_l',
        grammar: Count({t1:10, t2:10},
                     Replace(
                         Uni(t1("e"), t1("o")), t2("a"),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:4, t2:5},
        restriction: inputs(io_31a),
        results: outputs(io_31a),
    });

    testGrammar({
        desc: '31b. Replace e by a or o in hel: Cnt_3' +
              't1:e -> t2:a|t2:o {0,1} || h_l',
        grammar: Count({t1:3, t2:3},
                     Replace(
                         t1("e"), Uni(t2("a"), t2("o")),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 1
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:5},
        results: [
            {},
            // Replacement
            {t1: 'hel', t2: 'hal'}, {t1: 'hel', t2: 'hol'},
            // Copy through only
            {t1: 'e', t2: 'e'},     {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},     {t1: 'ee', t2: 'ee'},
            {t1: 'eh', t2: 'eh'},   {t1: 'el', t2: 'el'},
            {t1: 'he', t2: 'he'},   {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'},   {t1: 'le', t2: 'le'},
            {t1: 'lh', t2: 'lh'},   {t1: 'll', t2: 'll'},
            {t1: 'eee', t2: 'eee'}, {t1: 'eeh', t2: 'eeh'},
            {t1: 'eel', t2: 'eel'}, {t1: 'ehe', t2: 'ehe'},
            {t1: 'ehh', t2: 'ehh'}, {t1: 'ehl', t2: 'ehl'},
            {t1: 'ele', t2: 'ele'}, {t1: 'elh', t2: 'elh'},
            {t1: 'ell', t2: 'ell'}, {t1: 'hee', t2: 'hee'},
            {t1: 'heh', t2: 'heh'}, {t1: 'hhe', t2: 'hhe'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hle', t2: 'hle'}, {t1: 'hlh', t2: 'hlh'},
            {t1: 'hll', t2: 'hll'}, {t1: 'lee', t2: 'lee'},
            {t1: 'leh', t2: 'leh'}, {t1: 'lel', t2: 'lel'},
            {t1: 'lhe', t2: 'lhe'}, {t1: 'lhh', t2: 'lhh'},
            {t1: 'lhl', t2: 'lhl'}, {t1: 'lle', t2: 'lle'},
            {t1: 'llh', t2: 'llh'}, {t1: 'lll', t2: 'lll'},
        ],
    });

    const io_31c: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'eee', t2: 'eee'},
        {t1: 'lelee', t2: 'lelee'},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal'},     {t1: 'hel', t2: 'hol'},
        {t1: 'hell', t2: 'hall'},   {t1: 'hell', t2: 'holl'},
        {t1: 'helh', t2: 'halh'},   {t1: 'helh', t2: 'holh'},
        {t1: 'hhel', t2: 'hhal'},   {t1: 'hhel', t2: 'hhol'},
        {t1: 'hhell', t2: 'hhall'}, {t1: 'hhell', t2: 'hholl'},
        {t1: 'hhelh', t2: 'hhalh'}, {t1: 'hhelh', t2: 'hholh'},
        {t1: 'lhel', t2: 'lhal'},   {t1: 'lhel', t2: 'lhol'},
        {t1: 'lhell', t2: 'lhall'}, {t1: 'lhell', t2: 'lholl'},
        {t1: 'lhelh', t2: 'lhalh'}, {t1: 'lhelh', t2: 'lholh'},
        // Some Invalid Inputs
        {t1: 'helhel'},
        {t1: 'hhheeelllyyy'},
        {t1: 'eeyeleehelee'},
    ];

    testGrammar({
        desc: '31c. Replace e by a or o in hel: Spotchk_5 ' +
              't1:e -> t2:a|t2:o {0,1} || h_l',
        grammar: Count({t1:5, t2:5},
                     Replace(
                         t1("e"), Uni(t2("a"), t2("o")),
                         t1("h"), t1("l"), EMPTY_CONTEXT,
                         false, false, 0, 1
                     )),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:5},
        restriction: inputs(io_31c),
        results: outputs(io_31c),
    });

    const io_32: StringDict[] = [
        // Some Valid Inputs - Copy through
        {t1: 'hl', t2: 'hl', t3: '[1SG]'},
        {t1: 'heh', t2: 'heh', t3: '[1SG]'},
        {t1: 'lel', t2: 'lel', t3: '[1SG]'},
        {t1: 'hhhhhlllleeeee', t2: 'hhhhhlllleeeee', t3: '[1SG]'},
        {t1: 'hel', t2: 'hel', t3: '[1]'},
        {t1: 'hhell', t2: 'hhell', t3: '[1]'},
        {t1: 'lhhelhl', t2: 'lhhelhl', t3: '[1]'},
        {t1: 'hlhhelllll', t2: 'hlhhelllll', t3: '[1]'},
        {t1: 'lhellhhel', t2: 'lhellhhel', t3: '[1]'},
        {t1: 'lhelhhllhel', t2: 'lhelhhllhel', t3: '[1]'},
        {t1: 'helhelhel', t2: 'helhelhel', t3: '[1]'},
        {t1: 'lhelhelhhlhell', t2: 'lhelhelhhlhell', t3: '[1]'},
        {t1: 'eeheleeeehelee', t2: 'eeheleeeehelee', t3: '[1]'},
        {t1: 'helhhhhllllhel', t2: 'helhhhhllllhel', t3: '[1]'},
        {t1: 'helhelhelhel', t2: 'helhelhelhel', t3: '[1]'},
        {t1: 'hel', t2: 'hel', t3: EMPTY},
        {t1: 'hhell', t2: 'hhell', t3: EMPTY},
        {t1: 'lhhelhl', t2: 'lhhelhl', t3: EMPTY},
        {t1: 'hlhhelllll', t2: 'hlhhelllll', t3: EMPTY},
        {t1: 'lhellhhel', t2: 'lhellhhel', t3: EMPTY},
        {t1: 'lhelhhllhel', t2: 'lhelhhllhel', t3: EMPTY},
        {t1: 'helhelhel', t2: 'helhelhel', t3: EMPTY},
        {t1: 'lhelhelhhlhell', t2: 'lhelhelhhlhell', t3: EMPTY},
        {t1: 'eeheleeeehelee', t2: 'eeheleeeehelee', t3: EMPTY},
        {t1: 'helhhhhllllhel', t2: 'helhhhhllllhel', t3: EMPTY},
        {t1: 'helhelhelhel', t2: 'helhelhelhel', t3: EMPTY},
        // Some Valid Inputs - Replacement
        {t1: 'hel', t2: 'hal', t3: '[1SG]'},
        {t1: 'hhell', t2: 'hhall', t3: '[1SG]'},
        {t1: 'lhhelhl', t2: 'lhhalhl', t3: '[1SG]'},
        {t1: 'hlhhelllll', t2: 'hlhhalllll', t3: '[1SG]'},
        {t1: 'lhellhhel', t2: 'lhallhhal', t3: '[1SG]'},
        {t1: 'lhelhhllhel', t2: 'lhalhhllhal', t3: '[1SG]'},
        {t1: 'helhelhel', t2: 'halhalhal', t3: '[1SG]'},
        {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall', t3: '[1SG]'},
        {t1: 'eeheleeeehelee', t2: 'eehaleeeehalee', t3: '[1SG]'},
        {t1: 'helhhhhllllhel', t2: 'halhhhhllllhal', t3: '[1SG]'},
        // Some Invalid Inputs
        {t1: 'helhelhelhel', t3: '[1SG]'},
        {t1: 'heleeehhhlllhel', t3: '[1SG]'},
        {t1: 'heleeehhhlllhel', t3: '[1]'},
        {t1: 'heleeehhhlllhel', t3: EMPTY},
    ];

    testGrammar({
        desc: '32. Replace e by a in hel: Spotchk_14 ' +
              't1:e -> t2:a {0,3} || t1:h_l + t3:[1SG]',
        grammar: Count({t1:14, t2:14},
                     Replace(
                         t1("e"), t2("a"),
                         t1("h"), t1("l"), t3("[1SG]"),
                         false, false, 0, 3
                     )),
        tapes: ['t1', 't2', 't3'],
        vocab: {t1:3, t2:4, t3:5},
        restriction: inputs(io_32),
        results: outputs(io_32),
    });

    testGrammar({
        desc: '33a. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} || #_ (t2:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t2:'ehl'},
                     	 Replace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false, 1, 1
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:0, t2:3},
        results: [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33b. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} || _# (vocab t2:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t2:'ehl'},
                     	 Replace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:0, t2:3},
        results: [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33c. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} || #_# (vocab t2:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t2:'ehl'},
                     	 Replace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:0, t2:3},
        results: [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33d. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} (vocab t2:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t2:'ehl'},
                     	 OptionalReplace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:0, t2:3},
        results: [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33e. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} || #_ (vocab t1:hl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'hl'},
                     	 Replace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false, 1, 1
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            {t1: "h", t2: "eh"},     {t1: "l", t2: "el"},
            {t1: "hh", t2: "ehh"},   {t1: "hl", t2: "ehl"},
            {t1: "lh", t2: "elh"},   {t1: "ll", t2: "ell"},
            {t1: "hhh", t2: "ehhh"}, {t1: "hhl", t2: "ehhl"},
            {t1: "hlh", t2: "ehlh"}, {t1: "hll", t2: "ehll"},
            {t1: "lhh", t2: "elhh"}, {t1: "lhl", t2: "elhl"},
            {t1: "llh", t2: "ellh"}, {t1: "lll", t2: "elll"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33f. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} || _# (vocab t1:hl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'hl'},
                     	 Replace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {t1: 'h', t2: 'he'},     {t1: 'l', t2: 'le'},
            {t1: 'hh', t2: 'hhe'},   {t1: 'hl', t2: 'hle'},
            {t1: 'lh', t2: 'lhe'},   {t1: 'll', t2: 'lle'},
            {t1: "hhh", t2: "hhhe"}, {t1: "hhl", t2: "hhle"},
            {t1: "hlh", t2: "hlhe"}, {t1: "hll", t2: "hlle"},
            {t1: "lhh", t2: "lhhe"}, {t1: "lhl", t2: "lhle"},
            {t1: "llh", t2: "llhe"}, {t1: "lll", t2: "llle"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33g. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} || #_# (vocab t1:hl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'hl'},
                     	 Replace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33h. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {1} (vocab t1:hl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'hl'},
                     	 OptionalReplace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {t1: "h", t2: "eh"},     {t1: "h", t2: "he"},
            {t1: "l", t2: "el"},     {t1: "l", t2: "le"},
            {t1: "hh", t2: "ehh"},   {t1: "hh", t2: "heh"},
            {t1: "hh", t2: "hhe"},   {t1: "hl", t2: "ehl"},
            {t1: "hl", t2: "hel"},   {t1: "hl", t2: "hle"},
            {t1: "lh", t2: "elh"},   {t1: "lh", t2: "leh"},
            {t1: "lh", t2: "lhe"},   {t1: "ll", t2: "ell"},
            {t1: "ll", t2: "lel"},   {t1: "ll", t2: "lle"},
            {t1: "hhh", t2: "ehhh"}, {t1: "hhh", t2: "hehh"},
            {t1: "hhh", t2: "hheh"}, {t1: "hhh", t2: "hhhe"},
            {t1: "hhl", t2: "ehhl"}, {t1: "hhl", t2: "hehl"},
            {t1: "hhl", t2: "hhel"}, {t1: "hhl", t2: "hhle"},
            {t1: "hlh", t2: "ehlh"}, {t1: "hlh", t2: "helh"},
            {t1: "hlh", t2: "hleh"}, {t1: "hlh", t2: "hlhe"},
            {t1: "hll", t2: "ehll"}, {t1: "hll", t2: "hell"},
            {t1: "hll", t2: "hlel"}, {t1: "hll", t2: "hlle"},
            {t1: "lhh", t2: "elhh"}, {t1: "lhh", t2: "lehh"},
            {t1: "lhh", t2: "lheh"}, {t1: "lhh", t2: "lhhe"},
            {t1: "lhl", t2: "elhl"}, {t1: "lhl", t2: "lehl"},
            {t1: "lhl", t2: "lhel"}, {t1: "lhl", t2: "lhle"},
            {t1: "llh", t2: "ellh"}, {t1: "llh", t2: "lelh"},
            {t1: "llh", t2: "lleh"}, {t1: "llh", t2: "llhe"},
            {t1: "lll", t2: "elll"}, {t1: "lll", t2: "lell"},
            {t1: "lll", t2: "llel"}, {t1: "lll", t2: "llle"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ],
    });

    testGrammar({
        desc: '33i. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {0,2} (vocab t2:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t2:'ehl'},
                     	 OptionalReplace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:0, t2:3},
        results: [
            {},         // equivalent to {t1: '', t2: ''}
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
            {t2: 'ee'}, // equivalent to {t1: '', t2: 'ee'}
        ],
    });

    testGrammar({
        desc: '33j. Replace ∅ by e: Cnt_4 t1:∅ -> t2:e {0,2} (vocab t1:hl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'hl'},
                     	 OptionalReplace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            // 1 Insertion
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
            {t1: 'h', t2: 'eh'},     {t1: 'l', t2: 'el'},
            {t1: 'h', t2: 'he'},     {t1: 'l', t2: 'le'},
            {t1: 'hh', t2: 'ehh'},   {t1: 'hl', t2: 'ehl'},
            {t1: 'lh', t2: 'elh'},   {t1: 'll', t2: 'ell'},
            {t1: 'hh', t2: 'heh'},   {t1: 'hl', t2: 'hel'},
            {t1: 'hh', t2: 'hhe'},   {t1: 'hl', t2: 'hle'},
            {t1: 'lh', t2: 'leh'},   {t1: 'll', t2: 'lel'},
            {t1: 'lh', t2: 'lhe'},   {t1: 'll', t2: 'lle'},
            {t1: 'hhh', t2: 'ehhh'}, {t1: 'hhl', t2: 'ehhl'},
            {t1: 'hlh', t2: 'ehlh'}, {t1: 'hll', t2: 'ehll'},
            {t1: 'lhh', t2: 'elhh'}, {t1: 'lhl', t2: 'elhl'},
            {t1: 'llh', t2: 'ellh'}, {t1: 'lll', t2: 'elll'},
            {t1: 'hhh', t2: 'hehh'}, {t1: 'hhl', t2: 'hehl'},
            {t1: 'hlh', t2: 'helh'}, {t1: 'hll', t2: 'hell'},
            {t1: 'hhh', t2: 'hheh'}, {t1: 'hhl', t2: 'hhel'},
            {t1: 'hhh', t2: 'hhhe'}, {t1: 'hhl', t2: 'hhle'},
            {t1: 'hlh', t2: 'hleh'}, {t1: 'hll', t2: 'hlel'},
            {t1: 'hlh', t2: 'hlhe'}, {t1: 'hll', t2: 'hlle'},
            {t1: 'lhh', t2: 'lehh'}, {t1: 'lhl', t2: 'lehl'},
            {t1: 'llh', t2: 'lelh'}, {t1: 'lll', t2: 'lell'},
            {t1: 'lhh', t2: 'lheh'}, {t1: 'lhl', t2: 'lhel'},
            {t1: 'lhh', t2: 'lhhe'}, {t1: 'lhl', t2: 'lhle'},
            {t1: 'llh', t2: 'lleh'}, {t1: 'lll', t2: 'llel'},
            {t1: 'llh', t2: 'llhe'}, {t1: 'lll', t2: 'llle'},

            // 2 Insertions
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},   {t1: 'l', t2: 'ele'},
            {t1: 'h', t2: 'eeh'},   {t1: 'l', t2: 'eel'},
            {t1: 'h', t2: 'hee'},   {t1: 'l', t2: 'lee'},
            {t1: 'hh', t2: 'eehh'}, {t1: 'hl', t2: 'eehl'},
            {t1: 'lh', t2: 'eelh'}, {t1: 'll', t2: 'eell'},
            {t1: 'hh', t2: 'eheh'}, {t1: 'hl', t2: 'ehel'},
            {t1: 'hh', t2: 'ehhe'}, {t1: 'hl', t2: 'ehle'},
            {t1: 'lh', t2: 'eleh'}, {t1: 'll', t2: 'elel'},
            {t1: 'lh', t2: 'elhe'}, {t1: 'll', t2: 'elle'},
            {t1: 'hh', t2: 'heeh'}, {t1: 'hl', t2: 'heel'},
            {t1: 'hh', t2: 'hehe'}, {t1: 'hl', t2: 'hele'},
            {t1: 'hh', t2: 'hhee'}, {t1: 'hl', t2: 'hlee'},
            {t1: 'lh', t2: 'leeh'}, {t1: 'll', t2: 'leel'},
            {t1: 'lh', t2: 'lehe'}, {t1: 'll', t2: 'lele'},
            {t1: 'lh', t2: 'lhee'}, {t1: 'll', t2: 'llee'},

            // Copy-through: 0 Insertions
            {},  // equivalent to {t1: '', t2: ''}
            {t1: 'h', t2: 'h'},       {t1: 'l', t2: 'l'},
            {t1: 'hh', t2: 'hh'},     {t1: 'hl', t2: 'hl'},
            {t1: 'lh', t2: 'lh'},     {t1: 'll', t2: 'll'},
            {t1: 'hhh', t2: 'hhh'},   {t1: 'hhl', t2: 'hhl'},
            {t1: 'hlh', t2: 'hlh'},   {t1: 'hll', t2: 'hll'},
            {t1: 'lhh', t2: 'lhh'},   {t1: 'lhl', t2: 'lhl'},
            {t1: 'llh', t2: 'llh'},   {t1: 'lll', t2: 'lll'},
            {t1: 'hhhh', t2: 'hhhh'}, {t1: 'hhhl', t2: 'hhhl'},
            {t1: 'hhlh', t2: 'hhlh'}, {t1: 'hhll', t2: 'hhll'},
            {t1: 'hlhh', t2: 'hlhh'}, {t1: 'hlhl', t2: 'hlhl'},
            {t1: 'hllh', t2: 'hllh'}, {t1: 'hlll', t2: 'hlll'},
            {t1: 'lhhh', t2: 'lhhh'}, {t1: 'lhhl', t2: 'lhhl'},
            {t1: 'lhlh', t2: 'lhlh'}, {t1: 'lhll', t2: 'lhll'},
            {t1: 'llhh', t2: 'llhh'}, {t1: 'llhl', t2: 'llhl'},
            {t1: 'lllh', t2: 'lllh'}, {t1: 'llll', t2: 'llll'},
        ],
    });

    testGrammar({
        desc: '33k-1. Replace ∅ by e: Cnt_t1:1 t1:∅ -> t2:e {2} (vocab t1:h)',
        grammar: Count({t1:1},
        			 withVocab({t1:'h'},
                     	 OptionalReplace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 2, 2
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:1, t2:2},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'hee'},
        ],
    });

    testGrammar({
        desc: '33k-2. Replace ∅ by e: Cnt_t1:2 t1:∅ -> t2:e {2} (vocab t1:h)',
        grammar: Count({t1:2},
        			 withVocab({t1:'h'},
                     	 OptionalReplace(
                             t1(""), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 2, 2
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:1, t2:2},
        results: [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'hee'},
            {t1: 'hh', t2: 'eehh'},
            {t1: 'hh', t2: 'eheh'},
            {t1: 'hh', t2: 'ehhe'},
            {t1: 'hh', t2: 'heeh'},
            {t1: 'hh', t2: 'hehe'},
            {t1: 'hh', t2: 'hhee'},
        ],
    });

    testGrammar({
        desc: '33l. Replace ∅|h by e: Cnt_4 t1:∅|t1:h -> t2:e {1} (vocab t1:hl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'hl'},
                     	 OptionalReplace(
                             Uni(t1(""), t1("h")), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            // Insertions
            {t1: "h", t2: "eh"},      {t1: "h", t2: "he"},
            {t1: "l", t2: "el"},      {t1: "l", t2: "le"},
            {t1: "hh", t2: "ehh"},    {t1: "hh", t2: "heh"},
            {t1: "hh", t2: "hhe"},    {t1: "hl", t2: "ehl"},
            {t1: "hl", t2: "hel"},    {t1: "hl", t2: "hle"},
            {t1: "lh", t2: "elh"},    {t1: "lh", t2: "leh"},
            {t1: "lh", t2: "lhe"},    {t1: "ll", t2: "ell"},
            {t1: "ll", t2: "lel"},    {t1: "ll", t2: "lle"},
            {t1: "hhh", t2: "ehhh"},  {t1: "hhh", t2: "hehh"},
            {t1: "hhh", t2: "hheh"},  {t1: "hhh", t2: "hhhe"},
            {t1: "hhl", t2: "ehhl"},  {t1: "hhl", t2: "hehl"},
            {t1: "hhl", t2: "hhel"},  {t1: "hhl", t2: "hhle"},
            {t1: "hlh", t2: "ehlh"},  {t1: "hlh", t2: "helh"},
            {t1: "hlh", t2: "hleh"},  {t1: "hlh", t2: "hlhe"},
            {t1: "hll", t2: "ehll"},  {t1: "hll", t2: "hell"},
            {t1: "hll", t2: "hlel"},  {t1: "hll", t2: "hlle"},
            {t1: "lhh", t2: "elhh"},  {t1: "lhh", t2: "lehh"},
            {t1: "lhh", t2: "lheh"},  {t1: "lhh", t2: "lhhe"},
            {t1: "lhl", t2: "elhl"},  {t1: "lhl", t2: "lehl"},
            {t1: "lhl", t2: "lhel"},  {t1: "lhl", t2: "lhle"},
            {t1: "llh", t2: "ellh"},  {t1: "llh", t2: "lelh"},
            {t1: "llh", t2: "lleh"},  {t1: "llh", t2: "llhe"},
            {t1: "lll", t2: "elll"},  {t1: "lll", t2: "lell"},
            {t1: "lll", t2: "llel"},  {t1: "lll", t2: "llle"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
            // Replacements
            {t1: "h", t2: "e"},
            {t1: "hh", t2: "eh"},     {t1: "hh", t2: "he"},
            {t1: "hl", t2: "el"},     {t1: "lh", t2: "le"},
            {t1: "hhh", t2: "ehh"},   {t1: "hhh", t2: "heh"},
            {t1: "hhh", t2: "hhe"},   {t1: "hhl", t2: "ehl"},
            {t1: "hhl", t2: "hel"},   {t1: "hlh", t2: "elh"},
            {t1: "hlh", t2: "hle"},   {t1: "hll", t2: "ell"},
            {t1: "lhh", t2: "leh"},   {t1: "lhh", t2: "lhe"},
            {t1: "lhl", t2: "lel"},   {t1: "llh", t2: "lle"},
            {t1: "hhhh", t2: "ehhh"}, {t1: "hhhh", t2: "hehh"},
            {t1: "hhhh", t2: "hheh"}, {t1: "hhhh", t2: "hhhe"},
            {t1: "hhhl", t2: "ehhl"}, {t1: "hhhl", t2: "hehl"},
            {t1: "hhhl", t2: "hhel"}, {t1: "hhlh", t2: "ehlh"},
            {t1: "hhlh", t2: "helh"}, {t1: "hhlh", t2: "hhle"},
            {t1: "hhll", t2: "ehll"}, {t1: "hhll", t2: "hell"},
            {t1: "hlhh", t2: "elhh"}, {t1: "hlhh", t2: "hleh"},
            {t1: "hlhh", t2: "hlhe"}, {t1: "hlhl", t2: "elhl"},
            {t1: "hlhl", t2: "hlel"}, {t1: "hllh", t2: "ellh"},
            {t1: "hllh", t2: "hlle"}, {t1: "hlll", t2: "elll"},
            {t1: "lhhh", t2: "lehh"}, {t1: "lhhh", t2: "lheh"},
            {t1: "lhhh", t2: "lhhe"}, {t1: "lhhl", t2: "lehl"},
            {t1: "lhhl", t2: "lhel"}, {t1: "lhlh", t2: "lelh"},
            {t1: "lhlh", t2: "lhle"}, {t1: "lhll", t2: "lell"},
            {t1: "llhh", t2: "lleh"}, {t1: "llhh", t2: "llhe"},
            {t1: "llhl", t2: "llel"}, {t1: "lllh", t2: "llle"},
        ],
    });

    testGrammar({
        desc: '33m. Replace ∅|h by e: Cnt_4 t1:∅|t1:h -> t2:e {1} (vocab t1:eh)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'eh'},
                     	 OptionalReplace(
                             Uni(t1(""), t1("h")), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:2},
        results: [
            // Insertions
            {t1: "h", t2: "eh"},      {t1: "h", t2: "he"},
            {t1: "e", t2: "ee"},
            {t1: "hh", t2: "ehh"},    {t1: "hh", t2: "heh"},
            {t1: "hh", t2: "hhe"},    {t1: "he", t2: "ehe"},
            {t1: "he", t2: "hee"},
            {t1: "eh", t2: "eeh"},
            {t1: "eh", t2: "ehe"},    {t1: "ee", t2: "eee"},
            {t1: "hhh", t2: "ehhh"},  {t1: "hhh", t2: "hehh"},
            {t1: "hhh", t2: "hheh"},  {t1: "hhh", t2: "hhhe"},
            {t1: "hhe", t2: "ehhe"},  {t1: "hhe", t2: "hehe"},
            {t1: "hhe", t2: "hhee"},
            {t1: "heh", t2: "eheh"},
            {t1: "heh", t2: "heeh"},  {t1: "heh", t2: "hehe"},
            {t1: "hee", t2: "ehee"},  {t1: "hee", t2: "heee"},
            {t1: "ehh", t2: "eehh"},
            {t1: "ehh", t2: "eheh"},  {t1: "ehh", t2: "ehhe"},
            {t1: "ehe", t2: "eehe"},
            {t1: "ehe", t2: "ehee"},
            {t1: "eeh", t2: "eeeh"},  {t1: "eeh", t2: "eehe"},
            {t1: "eee", t2: "eeee"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
            // Replacements
            {t1: "h", t2: "e"},
            {t1: "hh", t2: "eh"},     {t1: "hh", t2: "he"},
            {t1: "he", t2: "ee"},     {t1: "eh", t2: "ee"},
            {t1: "hhh", t2: "ehh"},   {t1: "hhh", t2: "heh"},
            {t1: "hhh", t2: "hhe"},   {t1: "hhe", t2: "ehe"},
            {t1: "hhe", t2: "hee"},   {t1: "heh", t2: "eeh"},
            {t1: "heh", t2: "hee"},   {t1: "hee", t2: "eee"},
            {t1: "ehh", t2: "eeh"},   {t1: "ehh", t2: "ehe"},
            {t1: "ehe", t2: "eee"},   {t1: "eeh", t2: "eee"},
            {t1: "hhhh", t2: "ehhh"}, {t1: "hhhh", t2: "hehh"},
            {t1: "hhhh", t2: "hheh"}, {t1: "hhhh", t2: "hhhe"},
            {t1: "hhhe", t2: "ehhe"}, {t1: "hhhe", t2: "hehe"},
            {t1: "hhhe", t2: "hhee"}, {t1: "hheh", t2: "eheh"},
            {t1: "hheh", t2: "heeh"}, {t1: "hheh", t2: "hhee"},
            {t1: "hhee", t2: "ehee"}, {t1: "hhee", t2: "heee"},
            {t1: "hehh", t2: "eehh"}, {t1: "hehh", t2: "heeh"},
            {t1: "hehh", t2: "hehe"}, {t1: "hehe", t2: "eehe"},
            {t1: "hehe", t2: "heee"}, {t1: "heeh", t2: "eeeh"},
            {t1: "heeh", t2: "heee"}, {t1: "heee", t2: "eeee"},
            {t1: "ehhh", t2: "eehh"}, {t1: "ehhh", t2: "eheh"},
            {t1: "ehhh", t2: "ehhe"}, {t1: "ehhe", t2: "eehe"},
            {t1: "ehhe", t2: "ehee"}, {t1: "eheh", t2: "eeeh"},
            {t1: "eheh", t2: "ehee"}, {t1: "ehee", t2: "eeee"},
            {t1: "eehh", t2: "eeeh"}, {t1: "eehh", t2: "eehe"},
            {t1: "eehe", t2: "eeee"}, {t1: "eeeh", t2: "eeee"},
        ],
        allowDuplicateOutputs: true
    });

    testGrammar({
        desc: '34a. Replace e by ∅: Cnt_4 t1:e -> t2:∅ {1} || #_ (vocab t1:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2(""),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false, 1, 1
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        results: [
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'ee', t2: 'e'}, {t1: 'eh', t2: 'h'},
            {t1: 'el', t2: 'l'},
            {t1: 'eee', t2: 'ee'}, {t1: 'eeh', t2: 'eh'},
            {t1: 'eel', t2: 'el'}, {t1: 'ehe', t2: 'he'},
            {t1: 'ehh', t2: 'hh'}, {t1: 'ehl', t2: 'hl'},
            {t1: 'ele', t2: 'le'}, {t1: 'elh', t2: 'lh'},
            {t1: 'ell', t2: 'll'},
            {t1: 'eeee', t2: 'eee'}, {t1: 'eeeh', t2: 'eeh'},
            {t1: 'eeel', t2: 'eel'}, {t1: 'eehe', t2: 'ehe'},
            {t1: 'eehh', t2: 'ehh'}, {t1: 'eehl', t2: 'ehl'},
            {t1: 'eele', t2: 'ele'}, {t1: 'eelh', t2: 'elh'},
            {t1: 'eell', t2: 'ell'}, {t1: 'ehee', t2: 'hee'},
            {t1: 'eheh', t2: 'heh'}, {t1: 'ehel', t2: 'hel'},
            {t1: 'ehhe', t2: 'hhe'}, {t1: 'ehhh', t2: 'hhh'},
            {t1: 'ehhl', t2: 'hhl'}, {t1: 'ehle', t2: 'hle'},
            {t1: 'ehlh', t2: 'hlh'}, {t1: 'ehll', t2: 'hll'},
            {t1: 'elee', t2: 'lee'}, {t1: 'eleh', t2: 'leh'},
            {t1: 'elel', t2: 'lel'}, {t1: 'elhe', t2: 'lhe'},
            {t1: 'elhh', t2: 'lhh'}, {t1: 'elhl', t2: 'lhl'},
            {t1: 'elle', t2: 'lle'}, {t1: 'ellh', t2: 'llh'},
            {t1: 'elll', t2: 'lll'},
        ],
    });

    testGrammar({
        desc: '34b. Replace e by ∅: Cnt_4 t1:e -> t2:∅ {1} || _# (vocab t1:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2(""),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        results: [
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'ee', t2: 'e'}, {t1: 'he', t2: 'h'},
            {t1: 'le', t2: 'l'},
            {t1: 'eee', t2: 'ee'}, {t1: 'ehe', t2: 'eh'},
            {t1: 'ele', t2: 'el'}, {t1: 'hee', t2: 'he'},
            {t1: 'hhe', t2: 'hh'}, {t1: 'hle', t2: 'hl'},
            {t1: 'lee', t2: 'le'}, {t1: 'lhe', t2: 'lh'},
            {t1: 'lle', t2: 'll'},
            {t1: 'eeee', t2: 'eee'}, {t1: 'eehe', t2: 'eeh'},
            {t1: 'eele', t2: 'eel'}, {t1: 'ehee', t2: 'ehe'},
            {t1: 'ehhe', t2: 'ehh'}, {t1: 'ehle', t2: 'ehl'},
            {t1: 'elee', t2: 'ele'}, {t1: 'elhe', t2: 'elh'},
            {t1: 'elle', t2: 'ell'}, {t1: 'heee', t2: 'hee'},
            {t1: 'hehe', t2: 'heh'}, {t1: 'hele', t2: 'hel'},
            {t1: 'hhee', t2: 'hhe'}, {t1: 'hhhe', t2: 'hhh'},
            {t1: 'hhle', t2: 'hhl'}, {t1: 'hlee', t2: 'hle'},
            {t1: 'hlhe', t2: 'hlh'}, {t1: 'hlle', t2: 'hll'},
            {t1: 'leee', t2: 'lee'}, {t1: 'lehe', t2: 'leh'},
            {t1: 'lele', t2: 'lel'}, {t1: 'lhee', t2: 'lhe'},
            {t1: 'lhhe', t2: 'lhh'}, {t1: 'lhle', t2: 'lhl'},
            {t1: 'llee', t2: 'lle'}, {t1: 'llhe', t2: 'llh'},
            {t1: 'llle', t2: 'lll'},
        ],
    });

    testGrammar({
        desc: '34c. Replace e by ∅: Cnt_4 t1:e -> t2:∅ {1} || #_# (vocab t1:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2(""),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        results: [
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
        ],
    });

    testGrammar({
        desc: '34d. Replace e by ∅: Cnt_4 t1:e -> t2:∅ {1} (vocab t1:ehl)',
        grammar: Count({t1:4, t2:4},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2(""),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        results: [
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'eh', t2: 'h'},     {t1: 'el', t2: 'l'},
            {t1: 'he', t2: 'h'},     {t1: 'le', t2: 'l'},
            {t1: 'ehh', t2: 'hh'},   {t1: 'ehl', t2: 'hl'},
            {t1: 'elh', t2: 'lh'},   {t1: 'ell', t2: 'll'},
            {t1: 'heh', t2: 'hh'},   {t1: 'hel', t2: 'hl'},
            {t1: 'hhe', t2: 'hh'},   {t1: 'hle', t2: 'hl'},
            {t1: 'leh', t2: 'lh'},   {t1: 'lel', t2: 'll'},
            {t1: 'lhe', t2: 'lh'},   {t1: 'lle', t2: 'll'},
            {t1: 'ehhh', t2: 'hhh'}, {t1: 'ehhl', t2: 'hhl'},
            {t1: 'ehlh', t2: 'hlh'}, {t1: 'ehll', t2: 'hll'},
            {t1: 'elhh', t2: 'lhh'}, {t1: 'elhl', t2: 'lhl'},
            {t1: 'ellh', t2: 'llh'}, {t1: 'elll', t2: 'lll'},
            {t1: 'hehh', t2: 'hhh'}, {t1: 'hehl', t2: 'hhl'},
            {t1: 'helh', t2: 'hlh'}, {t1: 'hell', t2: 'hll'},
            {t1: 'hheh', t2: 'hhh'}, {t1: 'hhel', t2: 'hhl'},
            {t1: 'hhhe', t2: 'hhh'}, {t1: 'hhle', t2: 'hhl'},
            {t1: 'hleh', t2: 'hlh'}, {t1: 'hlel', t2: 'hll'},
            {t1: 'hlhe', t2: 'hlh'}, {t1: 'hlle', t2: 'hll'},
            {t1: 'lehh', t2: 'lhh'}, {t1: 'lehl', t2: 'lhl'},
            {t1: 'lelh', t2: 'llh'}, {t1: 'lell', t2: 'lll'},
            {t1: 'lheh', t2: 'lhh'}, {t1: 'lhel', t2: 'lhl'},
            {t1: 'lhhe', t2: 'lhh'}, {t1: 'lhle', t2: 'lhl'},
            {t1: 'lleh', t2: 'llh'}, {t1: 'llel', t2: 'lll'},
            {t1: 'llhe', t2: 'llh'}, {t1: 'llle', t2: 'lll'},
        ],
    });

    testGrammar({
        desc: '34e. Replace e by ∅: Cnt_3 t1:e -> t2:∅ {0,2} (vocab t1:ehl)',
        grammar: Count({t1:3, t2:3},
        			 withVocab({t1:'ehl'},
                     	 Replace(
                             t1("e"), t2(""),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 0, 2
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:3, t2:3},
        results: [
            {},
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'ee'}, // equivalent to {t1: 'ee', t2: ''}
            {t1: 'h', t2: 'h'},     {t1: 'l', t2: 'l'},
            {t1: 'eh', t2: 'h'},    {t1: 'el', t2: 'l'},
            {t1: 'he', t2: 'h'},    {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'},   {t1: 'le', t2: 'l'},
            {t1: 'lh', t2: 'lh'},   {t1: 'll', t2: 'll'},
            {t1: 'eeh', t2: 'h'},   {t1: 'eel', t2: 'l'},
            {t1: 'ehe', t2: 'h'},   {t1: 'ehh', t2: 'hh'},
            {t1: 'ehl', t2: 'hl'},  {t1: 'ele', t2: 'l'},
            {t1: 'elh', t2: 'lh'},  {t1: 'ell', t2: 'll'},
            {t1: 'hee', t2: 'h'},   {t1: 'heh', t2: 'hh'},
            {t1: 'hel', t2: 'hl'},  {t1: 'hhe', t2: 'hh'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hle', t2: 'hl'},  {t1: 'hlh', t2: 'hlh'},
            {t1: 'hll', t2: 'hll'}, {t1: 'lee', t2: 'l'},
            {t1: 'leh', t2: 'lh'},  {t1: 'lel', t2: 'll'},
            {t1: 'lhe', t2: 'lh'},  {t1: 'lhh', t2: 'lhh'},
            {t1: 'lhl', t2: 'lhl'}, {t1: 'lle', t2: 'll'},
            {t1: 'llh', t2: 'llh'}, {t1: 'lll', t2: 'lll'},
        ],
    });

    testGrammar({
        desc: '34e-alt. Replace e by ∅: Cnt_3 t1:e -> t2:∅ {0,2} (vocab t1:ehl)',
        grammar: Count({t1:3, t2:3},
                     Replace(
                        Seq(Vocab({t1: 'ehl'}), t1("e")), t2(""),
                        EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                        false, false, 0, 2
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:3, t2:3},
        results: [
            {},
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'ee'}, // equivalent to {t1: 'ee', t2: ''}
            {t1: 'h', t2: 'h'},     {t1: 'l', t2: 'l'},
            {t1: 'eh', t2: 'h'},    {t1: 'el', t2: 'l'},
            {t1: 'he', t2: 'h'},    {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'},   {t1: 'le', t2: 'l'},
            {t1: 'lh', t2: 'lh'},   {t1: 'll', t2: 'll'},
            {t1: 'eeh', t2: 'h'},   {t1: 'eel', t2: 'l'},
            {t1: 'ehe', t2: 'h'},   {t1: 'ehh', t2: 'hh'},
            {t1: 'ehl', t2: 'hl'},  {t1: 'ele', t2: 'l'},
            {t1: 'elh', t2: 'lh'},  {t1: 'ell', t2: 'll'},
            {t1: 'hee', t2: 'h'},   {t1: 'heh', t2: 'hh'},
            {t1: 'hel', t2: 'hl'},  {t1: 'hhe', t2: 'hh'},
            {t1: 'hhh', t2: 'hhh'}, {t1: 'hhl', t2: 'hhl'},
            {t1: 'hle', t2: 'hl'},  {t1: 'hlh', t2: 'hlh'},
            {t1: 'hll', t2: 'hll'}, {t1: 'lee', t2: 'l'},
            {t1: 'leh', t2: 'lh'},  {t1: 'lel', t2: 'll'},
            {t1: 'lhe', t2: 'lh'},  {t1: 'lhh', t2: 'lhh'},
            {t1: 'lhl', t2: 'lhl'}, {t1: 'lle', t2: 'll'},
            {t1: 'llh', t2: 'llh'}, {t1: 'lll', t2: 'lll'},
        ],
    });

    testGrammar({
        desc: '34f. Replace e by ∅: Cnt_t1:3 t1:e -> t2:∅ {2} (vocab t1:eh)',
        grammar: Count({t1:3},
        			 withVocab({t1:'eh'},
                     	 Replace(
                             t1("e"), t2(""),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 2, 2
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:2},
        results: [
            {t1: 'ee'},  // equivalent to {t1: 'ee', t2: ''}
            {t1: 'ehe', t2: 'h'},
            {t1: 'eeh', t2: 'h'},
            {t1: 'hee', t2: 'h'},
        ],
    });

    // Tests to isolate an expression simplification issue in CorrespondExpr.

    testGrammar({
        desc: '35a. Replace aba by X: Cnt_t1:3 t1:aba -> t2:X {1}',
        grammar: Count({t1:3},
                     Replace(
                         t1("aba"), t2("X"),
                         EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 1, 1
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            {t1: 'aba', t2: 'X'},
        ],
        verbose: vb(VERBOSE_DEBUG),
    });

    testGrammar({
        desc: '35b. Replace aba by X: Cnt_t1:3 t1:aba -> t2:X {1} ' +
              '(priority: t1,t2)',
        grammar: Cursor(["t1", "t2", ".END"],
                     Count({t1:3},
                         Replace(
                             t1("aba"), t2("X"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                         ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {t1: 'aba', t2: 'X'},
        ],
    });

    testGrammar({
        desc: '35c. Replace aba by X: Cnt_t1:3 t1:aba -> t2:X {1} ' +
              '(priority: t2,t1)',
        grammar: Cursor(["t2", "t1", ".END"],
                     Count({t1:3},
                         Replace(
                             t1("aba"), t2("X"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1
                         ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {t1: 'aba', t2: 'X'},
        ],
    });

    // 36a-b: Tests exploring the ways for replacements to yield multiple
    // outputs for an input.
    // This is a phenomenon that occurs with repeated overlapping patterns
    // in a string. For example, the pattern ABA in the string ABABABA can
    // be found as (ABA)B(ABA) or AB(ABA)BA.
    // Test 36a is based on test 27.

    testGrammar({
        desc: '36a. Replace ee by e: Cnt_6 t1:ee -> t2:e {1,3}',
        grammar: Count({t1:6, t2:6},
                     Replace(
                         t1("ee"), t2("e"),
                         EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 1, 3
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:1, t2:1},
        results: [
            {t1: 'ee', t2: 'e'},
            {t1: 'eee', t2: 'ee'},      // 2 ways: (ee)e, e(ee)
            {t1: 'eeee', t2: 'ee'},     // (ee)(ee) -> (e)(e)
            {t1: 'eeee', t2: 'eee'},    // e(ee)e -> e(e)e which is valid
            {t1: 'eeeee', t2: 'eee'},   // 3 ways: e(ee)(ee), (ee)e(ee), (ee)(ee)e
            {t1: 'eeeeee', t2: 'eee'},  // (ee)(ee)(ee) -> (e)(e)(e)
            {t1: 'eeeeee', t2: 'eeee'}, // e(ee)e(ee) -> e(e)e(e)
                                        // (ee)e(ee)e -> (e)e(e)e
                                        // e(ee)(ee)e -> e(e)(e)e
        ],
        allowDuplicateOutputs: true,
    });

    // Note: test 36b is affected by the issue explored in tests 35a-c.
    const io_36b: StringDict[] = [
        {t1: 'abababa', t2: 'abXba'},
        {t1: 'abababa', t2: 'XbX'},
    ];

    testGrammar({
        desc: '36b. Replace aba by X: Spotchk_8 t1:aba -> t2:X {1,3}',
        grammar: Count({t1:8, t2:8},
                     Replace(
                         t1("aba"), t2("X"),
                         EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                         false, false, 1, 3
                     )),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        restriction: inputs(io_36b),
        results: outputs(io_36b),
    });

    testGrammar({
        desc: '37a. Replace i by e: Cnt_2 t1:i -> t2:e || #_ (vocab t1:hi)',
        grammar: Count({t1:2, t2:2},
        			 withVocab({t1:'hi'},
                     	 Replace(
                             t1("i"), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, false
                     	 ))),
        tapes: ['t1', 't2'],
        vocab: {t1:2, t2:3},
        results: [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'i', t2: 'e'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'eh'},
            {t1: 'ii', t2: 'ei'},
        ],
    });

    testGrammar({
        desc: '37b. Replace i by e: Cnt_2 t1:i -> t2:e || _# (vocab t1:hi)',
        grammar: Count({t1:2, t2:2},
        			 withVocab({t1:'hi'},
                     	 Replace(
                             t1("i"), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, true
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'i', t2: 'e'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'hi', t2: 'he'},
            {t1: 'ih', t2: 'ih'},
            {t1: 'ii', t2: 'ie'},
        ],
    });

    testGrammar({
        desc: '37c. Replace i by e: Cnt_2 t1:i -> t2:e || #_# (vocab t1:hi)',
        grammar: Count({t1:2, t2:2},
        			 withVocab({t1:'hi'},
                     	 Replace(
                             t1("i"), t2("e"),
                             EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             true, true
                     	 ))),
        // tapes: ['t1', 't2'],
        // vocab: {t1:2, t2:3},
        results: [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'i', t2: 'e'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'hi', t2: 'hi'},
            {t1: 'ih', t2: 'ih'},
            {t1: 'ii', t2: 'ii'},
        ],
    });

});
