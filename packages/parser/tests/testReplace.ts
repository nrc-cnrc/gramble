import {
    Any,
    CountTape,
    Epsilon,
    Grammar,
    Intersect,
    Not,
    OptionalReplace,
    Priority,
    Replace,
    Seq,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite, VERBOSE_TEST, verbose,
    InputResultsPair, 
    t1, t2, t3, t4,
    testHasTapes, 
    testHasVocab,
    testGrammar,
    testParseMultiple,
    WARN_ONLY_FOR_TOO_MANY_OUTPUTS,
} from './testUtil';

import {StringDict, SILENT, VERBOSE_DEBUG } from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST;

const EMPTY: string = '';

function inputResultsPairs(expectedOutputs: StringDict[]): InputResultsPair[] {
    let pairs: InputResultsPair[] = [];
    for (const item of expectedOutputs) {
        if (item['t2'] != undefined) {
            let input: StringDict = {...item};
            delete input['t2'];
            if (input['t4'] != undefined)
                delete input['t4'];
            let output: StringDict = {...item};
            if (output['t3'] == EMPTY)
                delete output['t3'];
            pairs.push([input, [output]]);
        } else {
            pairs.push([item, []]);
        }
    }
    return pairs;
}

const DEFAULT = undefined;

const EMPTY_CONTEXT = Epsilon();

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(VERBOSE, module);

    describe('1. Replace e by a in hello: t1:e -> t2:a {1+} || ^h_llo$', function() {
        const grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"), 
                                         EMPTY_CONTEXT, true, true, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2. Replace e by a in hello: e -> t2:a {1+} || h_llo$', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       EMPTY_CONTEXT, false, true, 1);
        grammar = CountTape(7, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
            {t1: 'ehello', t2: 'ehallo'}, {t1: 'hhello', t2: 'hhallo'},
            {t1: 'lhello', t2: 'lhallo'}, {t1: 'ohello', t2: 'ohallo'},
            {t1: 'eehello', t2: 'eehallo'}, {t1: 'ehhello', t2: 'ehhallo'},
            {t1: 'elhello', t2: 'elhallo'}, {t1: 'eohello', t2: 'eohallo'},
            {t1: 'hehello', t2: 'hehallo'}, {t1: 'hhhello', t2: 'hhhallo'},
            {t1: 'hlhello', t2: 'hlhallo'}, {t1: 'hohello', t2: 'hohallo'},
            {t1: 'lehello', t2: 'lehallo'}, {t1: 'lhhello', t2: 'lhhallo'},
            {t1: 'llhello', t2: 'llhallo'}, {t1: 'lohello', t2: 'lohallo'},
            {t1: 'oehello', t2: 'oehallo'}, {t1: 'ohhello', t2: 'ohhallo'},
            {t1: 'olhello', t2: 'olhallo'}, {t1: 'oohello', t2: 'oohallo'},
        ];
        testGrammar(grammar, expectedResults); 
    });

    describe('3. Replace e by a in hel: t1:e -> t2:a {0+} || h_l$', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, true);
        grammar = CountTape(5, grammar)
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},   {t1: 'ehel', t2: 'ehal'},
            {t1: 'hhel', t2: 'hhal'}, {t1: 'lhel', t2: 'lhal'},
            {t1: 'eehel', t2: 'eehal'}, {t1: 'ehhel', t2: 'ehhal'},
            {t1: 'elhel', t2: 'elhal'}, {t1: 'hehel', t2: 'hehal'},
            {t1: 'hhhel', t2: 'hhhal'}, {t1: 'hlhel', t2: 'hlhal'},
            {t1: 'lehel', t2: 'lehal'}, {t1: 'lhhel', t2: 'lhhal'},
            {t1: 'llhel', t2: 'llhal'},
            // Valid Inputs - Copy through
            // There are 351 valid copy through outputs in all for CountTape(5).
            {t1: 'e', t2: 'e'}, {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'ee'}, {t1: 'eh', t2: 'eh'},
            {t1: 'el', t2: 'el'}, {t1: 'he', t2: 'he'},
            {t1: 'hh', t2: 'hh'}, {t1: 'hl', t2: 'hl'},
            {t1: 'le', t2: 'le'}, {t1: 'lh', t2: 'lh'},
            {t1: 'll', t2: 'll'},
            // ...
            {t1: 'hle', t2: 'hle'},   {t1: 'elh', t2: 'elh'},
            {t1: 'helh', t2: 'helh'}, {t1: 'helhe', t2: 'helhe'},
            {t1: 'helll', t2: 'helll'},
            // Invalid Inputs
            {t1: 'helhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('4. Replace e by a in hello: t1:e -> t2:a {1+} || ^h_llo', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       EMPTY_CONTEXT, true, false, 1);
        grammar = CountTape(7, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5. Replace e by a in hel: t1:e -> t2:a {0+} || ^h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, true, false);
        grammar = CountTape(5, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'}, {t1: 'hele', t2: 'hale'},
            {t1: 'helh', t2: 'halh'}, {t1: 'hell', t2: 'hall'},
            {t1: 'helee', t2: 'halee'}, {t1: 'heleh', t2: 'haleh'},
            {t1: 'helel', t2: 'halel'}, {t1: 'helhe', t2: 'halhe'},
            {t1: 'helhh', t2: 'halhh'}, {t1: 'helhl', t2: 'halhl'},
            {t1: 'helle', t2: 'halle'}, {t1: 'hellh', t2: 'hallh'},
            {t1: 'helll', t2: 'halll'},
            // Valid Inputs - Copy through
            // There are 351 valid copy through outputs in all for CountTape(5).
            {t1: 'e', t2: 'e'}, {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'ee'}, {t1: 'eh', t2: 'eh'},
            {t1: 'el', t2: 'el'}, {t1: 'he', t2: 'he'},
            {t1: 'hh', t2: 'hh'}, {t1: 'hl', t2: 'hl'},
            {t1: 'le', t2: 'le'}, {t1: 'lh', t2: 'lh'},
            {t1: 'll', t2: 'll'},
            // ...
            {t1: 'hle', t2: 'hle'},   {t1: 'elh', t2: 'elh'},
            {t1: 'hhel', t2: 'hhel'}, {t1: 'hehel', t2: 'hehel'},
            {t1: 'hhhel', t2: 'hhhel'},
            // Invalid Inputs
            {t1: 'helhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('6. Replace e by a in hello: t1:e -> t2:a {1,5} || h_llo', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"), 
                                       EMPTY_CONTEXT, false, false, 1, 5);
        grammar = CountTape(7, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('7a. Replace e by a in hel: t1:e -> t2:a {1+} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 1);
        grammar = CountTape(5, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('7. Replace e by a in hel: t1:e -> t2:a {1+} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 1);
        grammar = CountTape(9, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        // Full Generation:
        //  CountTape=7: 537 results (CountTape=7)
        //  CountTape=8: 1941 results (CountTape=8)
        //  CountTape=9: 6775 results (CountTape=9)
        //  CountTape=10: 23068 results (CountTape=10)
        // Here we spot check some of the possible 6775 results for
        // 9 characters or less.
        const from_to: StringDict[] = [
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
            {t1: 'e'},
            {t1: 'he'},
            {t1: 'el'},
            {t1: 'hheell'},
            {t1: 'lehlehleh'},
            {t1: 'helhelhelh'},
            {t1: 'helhelhheell'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('8. Replace e by a in hel: t1:e -> t2:a {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(9, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        // Full Generation:
        //  CountTape=7: 3280 results
        //  CountTape=8: 9841 results
        //  CountTape=9: 29523 results
        //  CountTape=10: 88560 results
        // Here we spot check some of the possible 29523 results for
        // 9 characters or less.
        const from_to: StringDict[] = [
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
            {t1: 'helhelhel'},
            {t1: 'hhhelhelhh'},
            {t1: 'hehehelelel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('9a. Replace e by a in hel: t1:e -> t2:a {1} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 1, 1);
        grammar = CountTape(5, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('9. Replace e by a in hel: t1:e -> t2:a {1} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 1, 1);
        grammar = CountTape(9, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        // Full Generation:
        //  CountTape=7: 527 results
        //  CountTape=8: 1877 results
        //  CountTape=9: 6443 results
        //  CountTape=10: 21545 results
        // Here we spot check some of the possible 6443 results for
        // 9 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hell', t2: 'hall'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hehell', t2: 'hehall'},
            {t1: 'elhelel', t2: 'elhalel'},
            {t1: 'hehelhe', t2: 'hehalhe'},
            {t1: 'lehhelleh', t2: 'lehhalleh'},
            {t1: 'hlehellll', t2: 'hlehallll'},
            // Some Invalid Inputs
            {t1: 'helhel'},
            {t1: 'hle'},
            {t1: 'hlehelllll'},
            {t1: 'hellehlehleh'},
            {t1: 'lehlehlehhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
        const expectedResults: StringDict[] = [
        ];
    });

    describe('10. Replace e by a in hel: t1:e -> t2:a {0,3} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 3,);
        grammar = CountTape(14, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        // Full Generation:
        //  CountTape=11: 265720 results
        //  CountTape=12: 797160 results
        //  CountTape=13: 2391468 results
        //  CountTape=14: 7174302 results
        //  CountTape=17: >180M results
        // Here we spot check some of the possible 7174302 results for
        // 14 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'elhelel', t2: 'elhalel'},
            {t1: 'hehelhe', t2: 'hehalhe'},
            {t1: 'lhhelhl', t2: 'lhhalhl'},
            {t1: 'helhelhel', t2: 'halhalhal'},
            {t1: 'lhellhhel', t2: 'lhallhhal'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal'},
            {t1: 'ehelehelehele', t2: 'ehalehalehale'},
            {t1: 'lhelhelhlhell', t2: 'lhalhalhlhall'},
            {t1: 'lhelhelhhlhel', t2: 'lhalhalhhlhal'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall'},
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'he', t2: 'he'},
            {t1: 'leh', t2: 'leh'},
            {t1: 'lehle', t2: 'lehle'},
            {t1: 'eehhll', t2: 'eehhll'},
            {t1: 'eeehhhlll', t2: 'eeehhhlll'},
            {t1: 'lllleeeehhhh', t2: 'lllleeeehhhh'},
            {t1: 'heheheelelel', t2: 'heheheelelel'},
            // Some Invalid Inputs
            {t1: 'helhelhelhel'},
            {t1: 'hlhellhhelhlhellh'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('11a. Replace e by a in he: t1:e -> t2:a {0,2} || h_', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1(""), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('11. Replace e by a in he: t1:e -> t2:a {0,2} || h_', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1(""), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        // Full Generation:
        //  CountTape=7: 246 results
        //  CountTape=8: 465 results
        //  CountTape=9: 847 results
        //  CountTape=10: 1485 results
        // Here we spot check some of the possible 1485 results for
        // 10 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'he', t2: 'ha'},
            {t1: 'heh', t2: 'hah'},
            {t1: 'eheh', t2: 'ehah'},
            {t1: 'heheee', t2: 'hahaee'},   {t1: 'hehheh', t2: 'hahhah'},
            {t1: 'hehhhe', t2: 'hahhha'},   {t1: 'hheheh', t2: 'hhahah'},
            {t1: 'hhehhe', t2: 'hhahha'},   {t1: 'hhhehe', t2: 'hhhaha'},
            {t1: 'hhhehh', t2: 'hhhahh'},   {t1: 'hehhehh', t2: 'hahhahh'},
            {t1: 'hehhheh', t2: 'hahhhah'}, {t1: 'eheheee', t2: 'ehahaee'},
            {t1: 'eheehee', t2: 'ehaehae'},
            {t1: 'hhehhhehh', t2: 'hhahhhahh'},   {t1: 'hhhehhehh', t2: 'hhhahhahh'},
            {t1: 'hhhehhheh', t2: 'hhhahhhah'},   {t1: 'hhhehhhehh', t2: 'hhhahhhahh'},
            {t1: 'eeheeeheee', t2: 'eehaeehaee'}, {t1: 'ehheeeheeh', t2: 'ehhaeehaeh'},
            {t1: 'eeehehehhh', t2: 'eeehahahhh'}, {t1: 'eeehehhhhe', t2: 'eeehahhhha'},
            {t1: 'heeeeeeehe', t2: 'haeeeeeeha'}, {t1: 'hehehhhhhh', t2: 'hahahhhhhh'},
            {t1: 'heheeeeeee', t2: 'hahaeeeeee'}, {t1: 'hhhhhhhehe', t2: 'hhhhhhhaha'},
            {t1: 'eeeeeehehe', t2: 'eeeeeehaha'},
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'eee', t2: 'eee'},
            {t1: 'eeehhh', t2: 'eeehhh'},
            {t1: 'eeeehhhh', t2: 'eeeehhhh'},
            {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
            // Some Invalid Inputs
            {t1: 'hehehe'},
            {t1: 'hehehehe'},
            {t1: 'hehehehhhhh'},
            {t1: 'eeeeehehehe'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('12. Replace e by a in he: t1:e -> t2:a {0,2} || h_ε', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), EMPTY_CONTEXT,
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        // Full Generation:
        //  CountTape=7: 246 results
        //  CountTape=8: 465 results
        //  CountTape=9: 847 results
        //  CountTape=10: 1485 results
        // Here we spot check some of the possible 1485 results for
        // 10 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'he', t2: 'ha'},
            {t1: 'heh', t2: 'hah'},
            {t1: 'eheh', t2: 'ehah'},
            {t1: 'heheee', t2: 'hahaee'}, {t1: 'hehheh', t2: 'hahhah'},
            {t1: 'hehhhe', t2: 'hahhha'}, {t1: 'hheheh', t2: 'hhahah'},
            {t1: 'hhehhe', t2: 'hhahha'}, {t1: 'hhhehe', t2: 'hhhaha'},
            {t1: 'hhhehh', t2: 'hhhahh'}, {t1: 'hehhehh', t2: 'hahhahh'},
            {t1: 'hehhheh', t2: 'hahhhah'},       {t1: 'eheheee', t2: 'ehahaee'},
            {t1: 'eheehee', t2: 'ehaehae'},       {t1: 'hhehhhehh', t2: 'hhahhhahh'},
            {t1: 'hhhehhehh', t2: 'hhhahhahh'},   {t1: 'hhhehhheh', t2: 'hhhahhhah'},
            {t1: 'hhhehhhehh', t2: 'hhhahhhahh'}, {t1: 'eeheeeheee', t2: 'eehaeehaee'},
            {t1: 'ehheeeheeh', t2: 'ehhaeehaeh'}, {t1: 'eeehehehhh', t2: 'eeehahahhh'},
            {t1: 'eeehehhhhe', t2: 'eeehahhhha'}, {t1: 'heeeeeeehe', t2: 'haeeeeeeha'},
            {t1: 'hehehhhhhh', t2: 'hahahhhhhh'}, {t1: 'heheeeeeee', t2: 'hahaeeeeee'},
            {t1: 'hhhhhhhehe', t2: 'hhhhhhhaha'}, {t1: 'eeeeeehehe', t2: 'eeeeeehaha'},
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'eee', t2: 'eee'},
            {t1: 'eeehhh', t2: 'eeehhh'},
            {t1: 'eeeehhhh', t2: 'eeeehhhh'},
            {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
            // Some Invalid Inputs
            {t1: 'hehehe'},
            {t1: 'hehehehe'},
            {t1: 'hehehhhhhhh'},
            {t1: 'eeeeeeehehe'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('13a. Replace e by a in el: t1:e -> t2:a {0,2} || ε_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), EMPTY_CONTEXT, t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('13. Replace e by a in el: t1:e -> t2:a {0,2} || ε_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), EMPTY_CONTEXT, t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        // Full Generation:
        //  CountTape=7: 246 results
        //  CountTape=8: 465 results
        //  CountTape=9: 847 results
        //  CountTape=10: 1485 results
        // Here we spot check some of the possible 1485 results for
        // 10 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'el', t2: 'al'},
            {t1: 'lel', t2: 'lal'},
            {t1: 'elel', t2: 'alal'},
            {t1: 'eeelel', t2: 'eealal'}, {t1: 'lellel', t2: 'lallal'},
            {t1: 'elllel', t2: 'alllal'}, {t1: 'lelell', t2: 'lalall'},
            {t1: 'ellell', t2: 'allall'}, {t1: 'llelel', t2: 'llalal'},
            {t1: 'llelll', t2: 'llalll'}, {t1: 'ellelll', t2: 'allalll'},
            {t1: 'elllell', t2: 'alllall'},       {t1: 'eelelee', t2: 'ealalee'},
            {t1: 'eeleele', t2: 'ealeale'},       {t1: 'lelllelll', t2: 'lalllalll'},
            {t1: 'llellelll', t2: 'llallalll'},   {t1: 'llelllell', t2: 'llalllall'},
            {t1: 'llelllelll', t2: 'llalllalll'}, {t1: 'eeeleeelee', t2: 'eealeealee'},
            {t1: 'leeleeelle', t2: 'lealeealle'}, {t1: 'eeeelellll', t2: 'eeealallll'},
            {t1: 'eeeellllel', t2: 'eeeallllal'}, {t1: 'eleeeeeeel', t2: 'aleeeeeeal'},
            {t1: 'elelllllll', t2: 'alalllllll'}, {t1: 'eleleeeeee', t2: 'alaleeeeee'},
            {t1: 'llllllelel', t2: 'llllllalal'}, {t1: 'eeeeeeelel', t2: 'eeeeeealal'},
            // Some Valid Inputs - Copy through only
            {t1: 'l', t2: 'l'},
            {t1: 'll', t2: 'll'},
            {t1: 'eee', t2: 'eee'},
            {t1: 'llleee', t2: 'llleee'},
            {t1: 'lllleeee', t2: 'lllleeee'},
            {t1: 'llllleeeee', t2: 'llllleeeee'},
            // Some Invalid Inputs
            {t1: 'elelel'},
            {t1: 'elellllllll'},
            {t1: 'eeeeeeeelel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('14. Replace e by a: t1:e -> t2:a {0,2} (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1:'ehl'}),
                                   Replace(t1("e"), t2("a"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape(3, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('15. Replace e by a: t1:e -> t2:a {0,3} (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1:'ehl'}),
                                   Replace(t1("e"), t2("a"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 3));
        grammar = CountTape(11, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        // Full Generation:
        //  CountTape=8: 7680 results
        //  CountTape=9: 20480 results
        //  CountTape=10: 53504 results
        //  CountTape=11: 137216 results
        // Here we spot check some of the possible 137216 results for
        // 11 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'e', t2: 'a'},     {t1: 'ee', t2: 'aa'},
            {t1: 'he', t2: 'ha'},   {t1: 'ell', t2: 'all'},
            {t1: 'eee', t2: 'aaa'}, {t1: 'ehhe', t2: 'ahha'},
            {t1: 'eehh', t2: 'aahh'},   {t1: 'lehel', t2: 'lahal'},
            {t1: 'ehehe', t2: 'ahaha'}, {t1: 'ellee', t2: 'allaa'},
            {t1: 'heeeh', t2: 'haaah'}, {t1: 'lehhe', t2: 'lahha'},
            {t1: 'eheehl', t2: 'ahaahl'},     {t1: 'ehhell', t2: 'ahhall'},
            {t1: 'hehhee', t2: 'hahhaa'},     {t1: 'ehehehl', t2: 'ahahahl'},
            {t1: 'ehheehh', t2: 'ahhaahh'},   {t1: 'ellelle', t2: 'allalla'},
            {t1: 'elleehh', t2: 'allaahh'},   {t1: 'heheheh', t2: 'hahahah'},
            {t1: 'hheeehh', t2: 'hhaaahh'},   {t1: 'hehlehle', t2: 'hahlahla'},
            {t1: 'hhehhehh', t2: 'hhahhahh'}, {t1: 'hhehleheh', t2: 'hhahlahah'},
            {t1: 'hleellell', t2: 'hlaallall'},     {t1: 'llelhelehh', t2: 'llalhalahh'},
            {t1: 'llehlehlehh', t2: 'llahlahlahh'}, {t1: 'llellellell', t2: 'llallallall'},
            {t1: 'ehlhlhlhlhl', t2: 'ahlhlhlhlhl'}, {t1: 'lllllllllle', t2: 'lllllllllla'},
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
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('16. Replace e by ee in hel: t1:e -> t2:ee {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(12, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        // Full Generation:
        //  CountTape=8: 8428 results
        //  CountTape=9: 24636 results
        //  CountTape=10: 72012 results
        //  CountTape=11: 210492 results
        //  CountTape=12: 615268 results
        // Here we spot check some of the possible 615268 results for
        // 12 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs - Replacement
            {t1: 'e', t2: 'e'},        {t1: 'ee', t2: 'ee'},
            {t1: 'hel', t2: 'heel'},   {t1: 'helh', t2: 'heelh'},
            {t1: 'hele', t2: 'heele'}, {t1: 'lhel', t2: 'lheel'},
            {t1: 'hhele', t2: 'hheele'},     {t1: 'ehele', t2: 'eheele'},
            {t1: 'lhell', t2: 'lheell'},     {t1: 'helhel', t2: 'heelheel'},
            {t1: 'elhelel', t2: 'elheelel'}, {t1: 'hehelhe', t2: 'heheelhe'},
            {t1: 'helhele', t2: 'heelheele'},   {t1: 'helhhel', t2: 'heelhheel'},
            {t1: 'lhelhel', t2: 'lheelheel'},   {t1: 'helhhele', t2: 'heelhheele'},
            {t1: 'helehell', t2: 'heeleheell'}, {t1: 'hhelhell', t2: 'hheelheell'},
            {t1: 'hhellhel', t2: 'hheellheel'}, {t1: 'ehelhele', t2: 'eheelheele'},
            {t1: 'ehelhhel', t2: 'eheelhheel'}, {t1: 'lhelhele', t2: 'lheelheele'},
            {t1: 'lhellhel', t2: 'lheellheel'}, {t1: 'hhelehele', t2: 'hheeleheele'},
            {t1: 'ehelehele', t2: 'eheeleheele'},   {t1: 'lhelehell', t2: 'lheeleheell'},
            {t1: 'heleeeehel', t2: 'heeleeeeheel'}, {t1: 'hhhelhelhh', t2: 'hhheelheelhh'},
            {t1: 'lllhelehel', t2: 'lllheeleheel'}, {t1: 'eeeeheleeee', t2: 'eeeeheeleeee'},
            {t1: 'hhhheeeellll', t2: 'hhhheeeellll'},
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'he', t2: 'he'},
            {t1: 'leh', t2: 'leh'},
            {t1: 'lehle', t2: 'lehle'},
            {t1: 'eehhll', t2: 'eehhll'},
            {t1: 'eeehhhlll', t2: 'eeehhhlll'},
            {t1: 'lllleeeehhhh', t2: 'lllleeeehhhh'},
            {t1: 'heheheelelel', t2: 'heheheelelel'},
            // Some Invalid Inputs
            {t1: 'helhelhel'},
            {t1: 'hhhhhhellllll'},
    ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    }); 
    
    describe('17. Replace e by ee in hel: t1:e -> t2:ee {1+} || ^h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, true, false, 1);
        grammar = CountTape({t1: 6}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('18. Replace e by ee in hel: t1:e -> t2:ee {0+} || ^h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, true, false, 0);
        grammar = CountTape({t1: 7}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},   {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},   {t1: 'hl', t2: 'hl'},
            {t1: 'eh', t2: 'eh'}, {t1: 'll', t2: 'll'},
            {t1: 'heh', t2: 'heh'}, {t1: 'hee', t2: 'hee'},
            {t1: 'elh', t2: 'elh'}, {t1: 'ell', t2: 'ell'},
            {t1: 'lel', t2: 'lel'}, {t1: 'lll', t2: 'lll'},
            {t1: 'hhhh', t2: 'hhhh'}, {t1: 'hhee', t2: 'hhee'},
            {t1: 'hhel', t2: 'hhel'}, {t1: 'heel', t2: 'heel'},
            {t1: 'eheh', t2: 'eheh'}, {t1: 'ehee', t2: 'ehee'},
            {t1: 'ehel', t2: 'ehel'}, {t1: 'ellh', t2: 'ellh'},
            {t1: 'lheh', t2: 'lheh'}, {t1: 'lhel', t2: 'lhel'},
            {t1: 'lhle', t2: 'lhle'}, {t1: 'llll', t2: 'llll'},
            {t1: 'hhelh', t2: 'hhelh'},     {t1: 'elhelel', t2: 'elhelel'},
            {t1: 'hehelhe', t2: 'hehelhe'}, {t1: 'lhhelhl', t2: 'lhhelhl'},
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'heel'},   {t1: 'helh', t2: 'heelh'},
            {t1: 'hele', t2: 'heele'}, {t1: 'hell', t2: 'heell'},
            {t1: 'helhel', t2: 'heelhel'},   {t1: 'helhelh', t2: 'heelhelh'},
            {t1: 'helhele', t2: 'heelhele'}, {t1: 'helhell', t2: 'heelhell'},
            {t1: 'helhhel', t2: 'heelhhel'}, {t1: 'helehel', t2: 'heelehel'},
            {t1: 'hellhel', t2: 'heellhel'},
            // Some Invalid Inputs
            {t1: 'helhelhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('19. Replace e by ee in hel: t1:e -> t2:ee {1+} || h_l$', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, true, 1);
        grammar = CountTape({t1: 6}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'heel'},   {t1: 'hhel', t2: 'hheel'},
            {t1: 'ehel', t2: 'eheel'}, {t1: 'lhel', t2: 'lheel'},
            {t1: 'hhhel', t2: 'hhheel'}, {t1: 'hehel', t2: 'heheel'},
            {t1: 'hlhel', t2: 'hlheel'}, {t1: 'ehhel', t2: 'ehheel'},
            {t1: 'eehel', t2: 'eeheel'}, {t1: 'elhel', t2: 'elheel'},
            {t1: 'lhhel', t2: 'lhheel'}, {t1: 'lehel', t2: 'leheel'},
            {t1: 'llhel', t2: 'llheel'}, {t1: 'hhhhel', t2: 'hhhheel'},
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('20. Replace e by ee in hel: t1:e -> t2:ee {0+} || h_l$', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, true, 0);
        grammar = CountTape({t1: 7}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},   {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},   {t1: 'hl', t2: 'hl'},
            {t1: 'eh', t2: 'eh'}, {t1: 'll', t2: 'll'},
            {t1: 'heh', t2: 'heh'}, {t1: 'hee', t2: 'hee'},
            {t1: 'elh', t2: 'elh'}, {t1: 'ell', t2: 'ell'},
            {t1: 'lel', t2: 'lel'}, {t1: 'lll', t2: 'lll'},
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
            {t1: 'hel', t2: 'heel'},   {t1: 'hhel', t2: 'hheel'},
            {t1: 'ehel', t2: 'eheel'}, {t1: 'lhel', t2: 'lheel'},
            {t1: 'helhel', t2: 'helheel'},   {t1: 'hhelhel', t2: 'hhelheel'},
            {t1: 'ehelhel', t2: 'ehelheel'}, {t1: 'lhelhel', t2: 'lhelheel'},
            {t1: 'helhhel', t2: 'helhheel'}, {t1: 'helehel', t2: 'heleheel'},
            {t1: 'hellhel', t2: 'hellheel'},
            // Some Invalid Inputs
            {t1: 'helhelhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('21a. Replace e by ee in he: t1:e -> t2:ee {0,2} || h_', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), EMPTY_CONTEXT, 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t1: 4}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('21. Replace e by ee in he: t1:e -> t2:ee {0,2} || h_', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), t1("h"), EMPTY_CONTEXT, 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t1: 10}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        // Full Generation:
        //  t1 CountTape=7: 246 results
        //  t1 CountTape=8: 465 results
        //  t1 CountTape=9: 847 results
        //  t1 CountTape=10: 1485 results
        // Here we spot check some of the possible 1485 results for
        // 10 characters or less on t1.
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'eeehhh', t2: 'eeehhh'},
            {t1: 'eeeeeeee', t2: 'eeeeeeee'},
            {t1: 'eeeeehhhhh', t2: 'eeeeehhhhh'},
            // Some Valid Inputs - Replacement
            {t1: 'he', t2: 'hee'},        {t1: 'hee', t2: 'heee'},
            {t1: 'hhe', t2: 'hhee'},      {t1: 'hehe', t2: 'heehee'},
            {t1: 'hheh', t2: 'hheeh'},    {t1: 'ehehe', t2: 'eheehee'},
            {t1: 'heheh', t2: 'heeheeh'}, {t1: 'hehee', t2: 'heeheee'},
            {t1: 'hehhe', t2: 'heehhee'}, {t1: 'hhehe', t2: 'hheehee'},
            {t1: 'eeheee', t2: 'eeheeee'},  {t1: 'ehehee', t2: 'eheeheee'},
            {t1: 'eheehe', t2: 'eheeehee'}, {t1: 'hehheh', t2: 'heehheeh'},
            {t1: 'hehhhe', t2: 'heehhhee'}, {t1: 'heehee', t2: 'heeeheee'},
            {t1: 'hhhehh', t2: 'hhheehh'},  {t1: 'hehehhh', t2: 'heeheehhh'},
            {t1: 'hhehheh', t2: 'hheehheeh'},       {t1: 'eeeeeehehe', t2: 'eeeeeeheehee'},
            {t1: 'eehehhheee', t2: 'eeheehhheeee'}, {t1: 'heeeeeeehe', t2: 'heeeeeeeehee'},
            {t1: 'hehehhhhhh', t2: 'heeheehhhhhh'}, {t1: 'hehhhhhhhe', t2: 'heehhhhhhhee'},
            {t1: 'hehhhhhhhh', t2: 'heehhhhhhhh'},  {t1: 'hhheeeheee', t2: 'hhheeeeheeee'},
            {t1: 'hhhehhhehh', t2: 'hhheehhheehh'}, {t1: 'hhhhehehhh', t2: 'hhhheeheehhh'},
            {t1: 'hhhhheeeee', t2: 'hhhhheeeeee'},
            // Some Invalid Inputs
            {t1: 'hehehe'},
            {t1: 'hheheheh'},
            {t1: 'hhhhhhheeeeeee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('22a. Replace e by ee in el: t1:e -> t2:ee {0,2} || _l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), EMPTY_CONTEXT, t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t1: 4}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('22. Replace e by ee in el: t1:e -> t2:ee {0,2} || _l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("ee"), EMPTY_CONTEXT, t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t1: 10}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'llleee', t2: 'llleee'},
            {t1: 'eeeeeeee', t2: 'eeeeeeee'},
            {t1: 'llllleeeee', t2: 'llllleeeee'},
            // Some Valid Inputs - Replacement
            {t1: 'el', t2: 'eel'},        {t1: 'ele', t2: 'eele'},
            {t1: 'eel', t2: 'eeel'},      {t1: 'elel', t2: 'eeleel'},
            {t1: 'lell', t2: 'leell'},    {t1: 'eelel', t2: 'eeeleel'},
            {t1: 'elele', t2: 'eeleele'}, {t1: 'elell', t2: 'eeleell'},
            {t1: 'ellel', t2: 'eelleel'}, {t1: 'lelel', t2: 'leeleel'},
            {t1: 'eeelee', t2: 'eeeelee'},    {t1: 'eeleel', t2: 'eeeleeel'},
            {t1: 'eelele', t2: 'eeeleele'},   {t1: 'eleele', t2: 'eeleeele'},
            {t1: 'ellell', t2: 'eelleell'},   {t1: 'elllel', t2: 'eellleel'},
            {t1: 'llelll', t2: 'lleelll'},    {t1: 'elellll', t2: 'eeleellll'},
            {t1: 'lellell', t2: 'leelleell'}, {t1: 'eeeeeeelel', t2: 'eeeeeeeeleel'},
            {t1: 'eeelllelee', t2: 'eeeellleelee'}, {t1: 'eleeeeeeel', t2: 'eeleeeeeeeel'},
            {t1: 'elelllllll', t2: 'eeleelllllll'}, {t1: 'elllllllel', t2: 'eellllllleel'},
            {t1: 'elllllllll', t2: 'eelllllllll'},  {t1: 'lleleeelee', t2: 'lleeleeeelee'},
            {t1: 'llelllelll', t2: 'lleellleelll'}, {t1: 'lllelellll', t2: 'llleeleellll'},
            {t1: 'lllleleeee', t2: 'lllleeleeee'},
            // Some Invalid Inputs
            {t1: 'elelel'},
            {t1: 'hhehehehlelelell'},
            {t1: 'lllllleleeeeee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('23. Replace e by ee: t1:e -> t2:ee {0,2} (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1:'ehl'}),
                                   Replace(t1("e"), t2("ee"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape({t1: 3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            // Replacement
            {t1: 'e', t2: 'ee'},   {t1: 'ee', t2: 'eeee'},
            {t1: 'eh', t2: 'eeh'}, {t1: 'el', t2: 'eel'},
            {t1: 'he', t2: 'hee'}, {t1: 'le', t2: 'lee'},
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('24. Replace ee by e in heel: t1:ee -> t2:e {0,2} || h_l', function() {
        let grammar:Grammar = Replace(t1("ee"), t2("e"), t1("h"), t1("l"),
                                EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(12, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        // Full Generation:
        //  CountTape=8: 9841 results
        //  CountTape=9: 29524 results
        //  CountTape=10: 88573 results
        //  CountTape=11: 265720 results
        //  CountTape=12: 797160 results
        // Here we spot check some of the possible 797160 results for
        // 12 characters or less,
        const from_to: StringDict[] = [
            // Some Valid Inputs
            {t1: 'heel', t2: 'hel'},     {t1: 'heelh', t2: 'helh'},
            {t1: 'heele', t2: 'hele'},   {t1: 'lheel', t2: 'lhel'},
            {t1: 'hheele', t2: 'hhele'}, {t1: 'eheele', t2: 'ehele'},
            {t1: 'lheell', t2: 'lhell'}, {t1: 'heelheel', t2: 'helhel'},
            {t1: 'elheelel', t2: 'elhelel'},    {t1: 'heheelhe', t2: 'hehelhe'},
            {t1: 'heelheele', t2: 'helhele'},   {t1: 'heelhheel', t2: 'helhhel'},
            {t1: 'lheelheel', t2: 'lhelhel'},   {t1: 'heelhheele', t2: 'helhhele'},
            {t1: 'heeleheell', t2: 'helehell'}, {t1: 'hheelheell', t2: 'hhelhell'},
            {t1: 'hheellheel', t2: 'hhellhel'}, {t1: 'eheelheele', t2: 'ehelhele'},
            {t1: 'eheelhheel', t2: 'ehelhhel'}, {t1: 'lheelheele', t2: 'lhelhele'},
            {t1: 'lheellheel', t2: 'lhellhel'}, {t1: 'hheeleheele', t2: 'hhelehele'},
            {t1: 'eheeleheele', t2: 'ehelehele'},   {t1: 'lheeleheell', t2: 'lhelehell'},
            {t1: 'heeleeeeheel', t2: 'heleeeehel'}, {t1: 'hhheelheelhh', t2: 'hhhelhelhh'},
            {t1: 'lllheeleheel', t2: 'lllhelehel'}, {t1: 'eeeeheeleeee', t2: 'eeeeheleeee'},
            {t1: 'hhhheeeellll', t2: 'hhhheeeellll'},
            // Some Valid Inputs - Copy through
            {t1: 'e', t2: 'e'},     {t1: 'h', t2: 'h'},
            {t1: 'ee', t2: 'ee'},   {t1: 'he', t2: 'he'},
            {t1: 'leh', t2: 'leh'}, {t1: 'lehle', t2: 'lehle'},
            {t1: 'eehhll', t2: 'eehhll'},
            {t1: 'eeehhhlll', t2: 'eeehhhlll'},
            {t1: 'lllleeeehhhh', t2: 'lllleeeehhhh'},
            {t1: 'heheleleelel', t2: 'heheleleelel'},
            // Some Invalid Inputs
            {t1: 'heelheelheel'},
            {t1: 'hhhhhheellllll'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('25a. Replace ee by e in hee: t1:ee -> t2:e {0,2} || h_', function() {
        let grammar: Grammar = Replace(t1("ee"), t2("e"), t1("h"), EMPTY_CONTEXT,
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t2: 4}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('25. Replace ee by e in hee: t1:ee -> t2:e {0,2} || h_', function() {
        let grammar: Grammar = Replace(t1("ee"), t2("e"), t1("h"), EMPTY_CONTEXT,
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(12, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        // Full Generation:
        //  CountTape=10: 2038 results
        //  CountTape=11: 4046 results
        //  CountTape=12: 7985 results
        // Here we spot check some of the possible 7985 results for
        // 12 characters or less.
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'eeehhh', t2: 'eeehhh'},
            {t1: 'eeeeeeee', t2: 'eeeeeeee'},
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
            {t1: 'hheehheeh', t2: 'hhehheh'},       {t1: 'eeeeeeheehee', t2: 'eeeeeehehe'},
            {t1: 'eeheehhheeee', t2: 'eehehhheee'}, {t1: 'heeeeeeeehee', t2: 'heeeeeeehe'},
            {t1: 'heeheehhhhhh', t2: 'hehehhhhhh'}, {t1: 'heehhhhhhhee', t2: 'hehhhhhhhe'},
            {t1: 'heehhhhhhhh', t2: 'hehhhhhhhh'},  {t1: 'hhheeeeheeee', t2: 'hhheeeheee'},
            {t1: 'hhheehhheehh', t2: 'hhhehhhehh'}, {t1: 'hhhheeheehhh', t2: 'hhhhehehhh'},
            {t1: 'hhhhheeeeee', t2: 'hhhhheeeee'},
            // Some Invalid Inputs
            {t1: 'heeheehee'},
            {t1: 'hheeheeheeh'},
            {t1: 'hhhhhhheeeeeee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('26a. Replace ee by e in eel: t1:ee -> t2:e {0,2} || _l', function() {
        let grammar: Grammar = Replace(t1("ee"), t2("e"), EMPTY_CONTEXT, t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t2: 4}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('26. Replace ee by e in eel: t1:ee -> t2:e {0,2} || _l', function() {
        let grammar: Grammar = Replace(t1("ee"), t2("e"), EMPTY_CONTEXT, t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(12, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        // Full Generation:
        //  CountTape=10: 2038 results
        //  CountTape=11: 4046 results
        //  CountTape=12: 7985 results
        // Here we spot check some of the possible 7985 results for
        // 12 characters or less.
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'llleee', t2: 'llleee'},
            {t1: 'eeeeeeee', t2: 'eeeeeeee'},
            {t1: 'llllleeeee', t2: 'llllleeeee'},
            // Some Valid Inputs - Replacement
            {t1: 'eel', t2: 'el'},     {t1: 'eele', t2: 'ele'},
            {t1: 'eeel', t2: 'eel'},   {t1: 'eeleel', t2: 'elel'},
            {t1: 'leell', t2: 'lell'}, {t1: 'eeeleel', t2: 'eelel'},
            {t1: 'eeleele', t2: 'elele'},   {t1: 'eeleell', t2: 'elell'},
            {t1: 'eelleel', t2: 'ellel'},   {t1: 'leeleel', t2: 'lelel'},
            {t1: 'eeeelee', t2: 'eeelee'},  {t1: 'eeeleeel', t2: 'eeleel'},
            {t1: 'eeeleele', t2: 'eelele'}, {t1: 'eeleeele', t2: 'eleele'},
            {t1: 'eelleell', t2: 'ellell'}, {t1: 'eellleel', t2: 'elllel'},
            {t1: 'lleelll', t2: 'llelll'},  {t1: 'eeleellll', t2: 'elellll'},
            {t1: 'leelleell', t2: 'lellell'},       {t1: 'eeeeeeeeleel', t2: 'eeeeeeelel'},
            {t1: 'eeeellleelee', t2: 'eeelllelee'}, {t1: 'eeleeeeeeeel', t2: 'eleeeeeeel'},
            {t1: 'eeleelllllll', t2: 'elelllllll'}, {t1: 'eellllllleel', t2: 'elllllllel'},
            {t1: 'eelllllllll', t2: 'elllllllll'},  {t1: 'lleeleeeelee', t2: 'lleleeelee'},
            {t1: 'lleellleelll', t2: 'llelllelll'}, {t1: 'llleeleellll', t2: 'lllelellll'},
            {t1: 'lllleeleeee', t2: 'lllleleeee'},
            // Some Invalid Inputs
            {t1: 'eeleeleel'},
            {t1: 'leeleeleell'},
            {t1: 'llllleeleeeee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('27. Replace ee by e: t1:ee -> t2:e {0,2} (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1:'ehl'}),
                                   Replace(t1("ee"), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape({t2: 3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        // Getting 7 duplicates, expected 69 results but got 76.
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('28a. Insert a in h_l: t1:0 -> t2:a {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1(""), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t1: 4}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
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
    ];
        testGrammar(grammar, expectedResults);
    });

    describe('28. Insert a in h_l: t1:0 -> t2:a {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1(""), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t1: 10}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        // Full Generation:
        //  t1 CountTape=8: 465 results
        //  t1 CountTape=9: 847 results
        //  t1 CountTape=10: 1485 results
        // Here we spot check some of the possible 1485 results for
        // t1 with 10 characters or less.
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'lllllhhhhh', t2: 'lllllhhhhh'},
            // Some Valid Inputs - Insertion
            {t1: 'hl', t2: 'hal'},
            {t1: 'lhlh', t2: 'lhalh'},
            {t1: 'lhll', t2: 'lhall'},
            {t1: 'hlhl', t2: 'halhal'},
            {t1: 'hlhhlh', t2: 'halhhalh'},
            {t1: 'hhlhhll', t2: 'hhalhhall'},
            {t1: 'hhhhhlllll', t2: 'hhhhhalllll'},
            {t1: 'hlhhhhhhhl', t2: 'halhhhhhhhal'},
            // Some Invalid Inputs
            {t1: 'hlhlhl'},
            {t1: 'hhhhhhhhhhh'},
            {t1: 'hhhhllllhlhhh'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('29a. Delete e in hel: t1:e -> t2:0 {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2(""), t1("h"), t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t2: 3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('29. Delete e in hel: t1:e -> t2:0 {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2(""), t1("h"), t1("l"), 
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape({t2: 10}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        // Full Generation:
        //  t2 CountTape=8: 15853 results
        //  t2 CountTape=9: 50637 results
        //  t2 CountTape=10: 161304 results
        // Here we spot check some of the possible 161304 results for
        // t2 with 10 characters or less.
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'hlhl', t2: 'hlhl'},
            {t1: 'lllllhhhhh', t2: 'lllllhhhhh'},
            // Some Valid Inputs - Deletion
            {t1: 'hel', t2: 'hl'},
            {t1: 'lhelh', t2: 'lhlh'},
            {t1: 'lhell', t2: 'lhll'},
            {t1: 'helhel', t2: 'hlhl'},
            {t1: 'helhhelh', t2: 'hlhhlh'},
            {t1: 'hhelhhell', t2: 'hhlhhll'},
            {t1: 'hhhhhelllll', t2: 'hhhhhlllll'},
            {t1: 'helhhhhhhhel', t2: 'hlhhhhhhhl'},
            // Some Invalid Inputs
            {t1: 'helhelhel'},
            {t1: 'hhhhhhhhhhhhhhhh'},
            {t1: 'hhhhelllllhelhhh'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('30a. Replace e by a in hel and hey: t1:e -> t2:a {0,2} || h_l|y', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"),
                                       t1("h"), Uni(t1("l"), t1("y")),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'hl', t2: 'hl'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'lel', t2: 'lel'},
            {t1: 'hheeell', t2: 'hheeell'},
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hele', t2: 'hale'},
            {t1: 'ehey', t2: 'ehay'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'hey', t2: 'hay'},
            {t1: 'hhey', t2: 'hhay'},
            {t1: 'hheyy', t2: 'hhayy'},
            {t1: 'hlhheyyyyy', t2: 'hlhhayyyyy'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'heyhey', t2: 'hayhay'},
            {t1: 'helhey', t2: 'halhay'},
            {t1: 'eheyehele', t2: 'ehayehale'},
            // Some Invalid Inputs
            {t1: 'helheyhel'},
            {t1: 'hhheeelllyyy'},
            {t1: 'eeheyeehelee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('30b. Replace e by a in hel and yel: t1:e -> t2:a {0,2} || h|y_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"),
                                       Uni(t1("h"), t1("y")), t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 2);
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'hl', t2: 'hl'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'lel', t2: 'lel'},
            {t1: 'hheeell', t2: 'hheeell'},
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hele', t2: 'hale'},
            {t1: 'eyel', t2: 'eyal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'yel', t2: 'yal'},
            {t1: 'yyel', t2: 'yyal'},
            {t1: 'yyell', t2: 'yyall'},
            {t1: 'ylyyelllll', t2: 'ylyyalllll'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'yelyel', t2: 'yalyal'},
            {t1: 'helyel', t2: 'halyal'},
            {t1: 'eyelehele', t2: 'eyalehale'},
            // Some Invalid Inputs
            {t1: 'yelhelyel'},
            {t1: 'hhheeelllyyy'},
            {t1: 'eeyeleehelee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('30c. Replace e by a in hel, hey, hee: t1:e -> t2:a {0,2} || h_(.&~h) (vocab t1:ehly)', function() {
        let grammar: Grammar = Seq(Vocab({t1:'ehly'}),
                                   Replace(t1("e"), t2("a"),
                                           t1("h"),
                                           Intersect(Any("t1"), Not(t1("h"))),
                                           EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'hl', t2: 'hl'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'lel', t2: 'lel'},
            // Some Valid Inputs - Replacement
            {t1: 'hheeell', t2: 'hhaeell'},
            {t1: 'hel', t2: 'hal'},
            {t1: 'hele', t2: 'hale'},
            {t1: 'ehey', t2: 'ehay'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'hey', t2: 'hay'},
            {t1: 'hhey', t2: 'hhay'},
            {t1: 'hheyy', t2: 'hhayy'},
            {t1: 'hlhheyyyyy', t2: 'hlhhayyyyy'},
            {t1: 'hlhheeyyyy', t2: 'hlhhaeyyyy'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'heyhey', t2: 'hayhay'},
            {t1: 'helhee', t2: 'halhae'},
            {t1: 'eheyehele', t2: 'ehayehale'},
            // Some Invalid Inputs
            {t1: 'helheyhee'},
            {t1: 'hhheeelllyyy'},
            {t1: 'eeyeleehelee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('30d. Replace e by a in hel, yel, eel: t1:e -> t2:a {0,2} || (.&~l)_l (vocab t1:ehly)', function() {
        let grammar: Grammar = Seq(Vocab({t1:'ehly'}),
                                   Replace(t1("e"), t2("a"),
                                           Intersect(Any("t1"), Not(t1("l"))),
                                           t1("l"),
                                           EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'hl', t2: 'hl'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'lel', t2: 'lel'},
            // Some Valid Inputs - Replacement
            {t1: 'hheeell', t2: 'hheeall'},
            {t1: 'hel', t2: 'hal'},
            {t1: 'hele', t2: 'hale'},
            {t1: 'eyel', t2: 'eyal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'yel', t2: 'yal'},
            {t1: 'yyel', t2: 'yyal'},
            {t1: 'yyell', t2: 'yyall'},
            {t1: 'ylyyelllll', t2: 'ylyyalllll'},
            {t1: 'eeyeelllll', t2: 'eeyealllll'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'yelyel', t2: 'yalyal'},
            {t1: 'yeleel', t2: 'yaleal'},
            // Some Invalid Inputs
            {t1: 'helyeleel'},
            {t1: 'eeehhhlllyyy'},
            {t1: 'eeyeleehelee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('30e. Replace e or o by a in hel: t1:e|t1:o -> t2:a {0,2} || h_l', function() {
        let grammar: Grammar = Replace(Uni(t1("e"), t1("o")), t2("a"),
                                       t1("h"), t1("l"), EMPTY_CONTEXT,
                                       false, false, 0, 2);
        grammar = CountTape(10, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'hl', t2: 'hl'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'lel', t2: 'lel'},
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'helo', t2: 'halo'},
            {t1: 'hole', t2: 'hale'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'hol', t2: 'hal'},
            {t1: 'hhol', t2: 'hhal'},
            {t1: 'hholl', t2: 'hhall'},
            {t1: 'hlhholllll', t2: 'hlhhalllll'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'helhol', t2: 'halhal'},
            {t1: 'holhol', t2: 'halhal'},
            // Some Invalid Inputs
            {t1: 'helholhel'},
            {t1: 'eeeooohhhlll'},
            {t1: 'eeheleeholee'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });
    
    describe('30f-a. Replace e by a or o in hel: t1:e -> t2:a|t2:o {0,1} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), Uni(t2("a"), t2("o")),
                                       t1("h"), t1("l"), EMPTY_CONTEXT,
                                       false, false, 0, 1);
        grammar = CountTape(3, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 5});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('30f. Replace e by a or o in hel: t1:e -> t2:a|t2:o {0,1} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), Uni(t2("a"), t2("o")),
                                       t1("h"), t1("l"), EMPTY_CONTEXT,
                                       false, false, 0, 1);
        grammar = CountTape(5, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 5});
        const from_to: InputResultsPair[] = [
            // Some Valid Inputs - Copy through
            [{t1: 'eee'},   [{t1: 'eee', t2: 'eee'}]],
            [{t1: 'lelee'}, [{t1: 'lelee', t2: 'lelee'}]],
            // Some Valid Inputs - Replacement
            [{t1: 'hel'},   [{t1: 'hel', t2: 'hal'},     {t1: 'hel', t2: 'hol'}]],
            [{t1: 'hell'},  [{t1: 'hell', t2: 'hall'},   {t1: 'hell', t2: 'holl'}]],
            [{t1: 'helh'},  [{t1: 'helh', t2: 'halh'},   {t1: 'helh', t2: 'holh'}]],
            [{t1: 'hhel'},  [{t1: 'hhel', t2: 'hhal'},   {t1: 'hhel', t2: 'hhol'}]],
            [{t1: 'hhell'}, [{t1: 'hhell', t2: 'hhall'}, {t1: 'hhell', t2: 'hholl'}]],
            [{t1: 'hhelh'}, [{t1: 'hhelh', t2: 'hhalh'}, {t1: 'hhelh', t2: 'hholh'}]],
            [{t1: 'lhel'},  [{t1: 'lhel', t2: 'lhal'},   {t1: 'lhel', t2: 'lhol'}]],
            [{t1: 'lhell'}, [{t1: 'lhell', t2: 'lhall'}, {t1: 'lhell', t2: 'lholl'}]],
            [{t1: 'lhelh'}, [{t1: 'lhelh', t2: 'lhalh'}, {t1: 'lhelh', t2: 'lholh'}]],
            // Some Invalid Inputs
            [{t1: 'helhel'}, []],
            [{t1: 'hhheeelllyyy'}, []],
            [{t1: 'eeyeleehelee'}, []],
        ];
        testParseMultiple(grammar, from_to);
    });

    describe('31. Replace e by a in hel: t1:e -> t2:a {0,3} || t1:h_l', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       EMPTY_CONTEXT, false, false, 0, 3);
        grammar = CountTape(14, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const from_to: StringDict[] = [
            // Some Valid Inputs - Copy through
            {t1: 'hl', t2: 'hl'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'lel', t2: 'lel'},
            {t1: 'hhhhhlllleeeee', t2: 'hhhhhlllleeeee'},
            // Some Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'ehel', t2: 'ehal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'lhhelhl', t2: 'lhhalhl'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'lhellhhel', t2: 'lhallhhal'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal'},
            {t1: 'helhelhel', t2: 'halhalhal'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall'},
            // Some Invalid Inputs
            {t1: 'hhhhhllllleeeee'},
            {t1: 'helehlehlehlhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('32. Replace e by a in hel: t1:e -> t2:a {0,3} || t1:h_l & t3:[1SG]', function() {
        let grammar: Grammar = Replace(t1("e"), t2("a"),
                                       t1("h"), t1("l"), t3("[1SG]"),
                                       false, false, 0, 3);
        grammar = CountTape(14, grammar);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 3, t2: 4, t3: 5});
        const from_to: StringDict[] = [
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
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('33a. Replace ∅ by e: t1:∅ -> t2:e {1} || ^_ (t2:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t2: 'ehl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           true, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33b. Replace ∅ by e: t1:∅ -> t2:e {1} || _$ (vocab t2:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t2: 'ehl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, true, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33c. Replace ∅ by e: t1:∅ -> t2:e {1} || ^_$ (vocab t2:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t2: 'ehl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           true, true, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33d. Replace ∅ by e: t1:∅ -> t2:e {1} (vocab t2:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t2: 'ehl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33e. Replace ∅ by e: t1:∅ -> t2:e {1} || ^_ (vocab t1:hl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'hl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           true, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: "h", t2: "eh"},     {t1: "l", t2: "el"},
            {t1: "hh", t2: "ehh"},   {t1: "hl", t2: "ehl"},
            {t1: "lh", t2: "elh"},   {t1: "ll", t2: "ell"},
            {t1: "hhh", t2: "ehhh"}, {t1: "hhl", t2: "ehhl"},
            {t1: "hlh", t2: "ehlh"}, {t1: "hll", t2: "ehll"},
            {t1: "lhh", t2: "elhh"}, {t1: "lhl", t2: "elhl"},
            {t1: "llh", t2: "ellh"}, {t1: "lll", t2: "elll"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33f. Replace ∅ by e: t1:∅ -> t2:e {1} || _$ (vocab t1:hl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'hl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, true, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'h', t2: 'he'},     {t1: 'l', t2: 'le'},
            {t1: 'hh', t2: 'hhe'},   {t1: 'hl', t2: 'hle'},
            {t1: 'lh', t2: 'lhe'},   {t1: 'll', t2: 'lle'},
            {t1: "hhh", t2: "hhhe"}, {t1: "hhl", t2: "hhle"},
            {t1: "hlh", t2: "hlhe"}, {t1: "hll", t2: "hlle"},
            {t1: "lhh", t2: "lhhe"}, {t1: "lhl", t2: "lhle"},
            {t1: "llh", t2: "llhe"}, {t1: "lll", t2: "llle"},
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33g. Replace ∅ by e: t1:∅ -> t2:e {1} || ^_$ (vocab t1:hl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'hl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           true, true, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33h. Replace ∅ by e: t1:∅ -> t2:e {1} (vocab t1:hl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'hl'}),
                                   OptionalReplace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33i. Replace ∅ by e: t1:∅ -> t2:e {0,2} (vocab t2:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t2: 'ehl'}),
                                   Replace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 0, t2: 3});
        const expectedResults: StringDict[] = [
            {},         // equivalent to {t1: '', t2: ''}
            {t2: 'e'},  // equivalent to {t1: '', t2: 'e'}
            {t2: 'ee'}, // equivalent to {t1: '', t2: 'ee'}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33j. Replace ∅ by e: t1:∅ -> t2:e {0,2} (vocab t1:hl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'hl'}),
                                   OptionalReplace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('33k. Replace ∅ by e: t1:∅ -> t2:e {2} (vocab t1:h)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'h'}),
                                    OptionalReplace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 2, 2));
        grammar = CountTape({t1: 1}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t2: 'ee'},  // equivalent to {t1: '', t2: 'ee'}
            {t1: 'h', t2: 'ehe'},
            {t1: 'h', t2: 'eeh'},
            {t1: 'h', t2: 'hee'},
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('33k-2. Replace ∅ by e: t1:∅ -> t2:e {2} (vocab t1:h)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'h'}),
                                    OptionalReplace(t1(""), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 2, 2));
        grammar = CountTape({t1: 2}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('33l. Replace ∅|h by e: t1:∅|t1:h -> t2:e {1} (vocab t1:hl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'hl'}),
                                   OptionalReplace(Uni(t1(""), t1("h")), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('33m. Replace ∅|h by e: t1:∅|t1:h -> t2:e {1} (vocab t1:eh)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'eh'}),
                                   OptionalReplace(Uni(t1(""), t1("h")), t2("e"),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('34a. Replace e by ∅: t1:e -> t2:∅ {1} || ^_ (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'ehl'}),
                                   Replace(t1("e"), t2(""),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           true, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('34b. Replace e by ∅: t1:e -> t2:∅ {1} || _$ (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'ehl'}),
                                   Replace(t1("e"), t2(""),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, true, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('34c. Replace e by ∅: t1:e -> t2:∅ {1} || ^_$ (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'ehl'}),
                                   Replace(t1("e"), t2(""),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           true, true, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('34d. Replace e by ∅: t1:e -> t2:∅ {1} (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'ehl'}),
                                   Replace(t1("e"), t2(""),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 1, 1));
        grammar = CountTape(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'eh', t2: 'h'}, {t1: 'el', t2: 'l'},
            {t1: 'he', t2: 'h'}, {t1: 'le', t2: 'l'},
            {t1: 'ehh', t2: 'hh'}, {t1: 'ehl', t2: 'hl'},
            {t1: 'elh', t2: 'lh'}, {t1: 'ell', t2: 'll'},
            {t1: 'heh', t2: 'hh'}, {t1: 'hel', t2: 'hl'},
            {t1: 'hhe', t2: 'hh'}, {t1: 'hle', t2: 'hl'},
            {t1: 'leh', t2: 'lh'}, {t1: 'lel', t2: 'll'},
            {t1: 'lhe', t2: 'lh'}, {t1: 'lle', t2: 'll'},
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('34e. Replace e by ∅: t1:e -> t2:∅ {0,2} (vocab t1:ehl)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'ehl'}),
                                   Replace(t1("e"), t2(""),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 2));
        grammar = CountTape(3, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'ee'}, // equivalent to {t1: 'ee', t2: ''}
            {t1: 'h', t2: 'h'}, {t1: 'l', t2: 'l'},
            {t1: 'eh', t2: 'h'},  {t1: 'el', t2: 'l'},
            {t1: 'he', t2: 'h'},  {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'}, {t1: 'le', t2: 'l'},
            {t1: 'lh', t2: 'lh'}, {t1: 'll', t2: 'll'},
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
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('34e-alt. Replace e by ∅: t1:e -> t2:∅ {0,2} (vocab t1:ehl)', function() {
        let grammar: Grammar = Replace(Seq(Vocab({t1: 'ehl'}), t1("e")), t2(""),
                                       EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                       false, false, 0, 2);
        grammar = CountTape(3, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e'},  // equivalent to {t1: 'e', t2: ''}
            {t1: 'ee'}, // equivalent to {t1: 'ee', t2: ''}
            {t1: 'h', t2: 'h'}, {t1: 'l', t2: 'l'},
            {t1: 'eh', t2: 'h'},  {t1: 'el', t2: 'l'},
            {t1: 'he', t2: 'h'},  {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'}, {t1: 'le', t2: 'l'},
            {t1: 'lh', t2: 'lh'}, {t1: 'll', t2: 'll'},
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
    ];
        testGrammar(grammar, expectedResults);
    });

    describe('34f. Replace e by ∅: t1:e -> t2:∅ {2} (vocab t1:eh/e)', function() {
        let grammar: Grammar = Seq(Vocab({t1: 'eh'}),
                                   Replace(t1("e"), t2(""),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 2, 2));
        grammar = CountTape({t1: 3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'ee'},  // equivalent to {t1: 'ee', t2: ''}
            {t1: 'ehe', t2: 'h'},     // missing
            {t1: 'eeh', t2: 'h'},
            {t1: 'hee', t2: 'h'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // Tests to isolate an expression simplification issue in CorrespondExpr.
    describe('35. Replace aba by X: t1:aba -> t2:X {1}', function() {
        let grammar: Grammar = Replace(t1("aba"), t2("X"),
                                       EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                       false, false, 1, 1);
        grammar = CountTape({t1:3}, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'aba', t2: 'X'},
        ];
         testGrammar(grammar, expectedResults, VERBOSE_DEBUG);
    });

    describe('35a. Replace aba by X: t1:aba -> t2:X {1} (priority: t1,t2)', function() {
        verbose(VERBOSE, '', '--- 35a. Replace aba by X: t1:aba -> t2:X {1} (priority: t1,t2) ---');
        let grammar: Grammar = Replace(t1("aba"), t2("X"),
                                       EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                       false, false, 1, 1);
        grammar = CountTape({t1:3}, grammar);
        grammar = Priority(["t1", "t2", ".END"], grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'aba', t2: 'X'},
        ];
         testGrammar(grammar, expectedResults, VERBOSE_DEBUG);
    });

    describe('35b. Replace aba by X: t1:aba -> t2:X {1} (priority: t2,t1)', function() {
        let grammar: Grammar = Replace(t1("aba"), t2("X"),
                                       EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                       false, false, 1, 1);
        grammar = CountTape({t1:3}, grammar);
        grammar = Priority(["t2", "t1", ".END"], grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'aba', t2: 'X'},
        ];
         testGrammar(grammar, expectedResults, VERBOSE_DEBUG);
    });

    // Tests exploring the ways for replacements to yield multiple
    // outputs for an input.
    // This is a phenomenon that occurs with repeated overlapping patterns
    // in a string. For example, the pattern ABA in the string ABABABA can
    // be found as (ABA)B(ABA) or AB(ABA)BA.
    // Test 35a is based on test 27.
    describe('36a. Replace ee by e: t1:ee -> t2:e {1,3}', function() {
        let grammar: Grammar = Replace(t1("ee"), t2("e"),
                                       EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                       false, false, 1, 3);
        grammar = CountTape(6, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 1});
        // Getting 5 duplicates, expected 7 results but got 12.
        const expectedResults: StringDict[] = [
            {t1: 'ee', t2: 'e'},
            {t1: 'eee', t2: 'ee'},      // 2 ways: (ee)e, e(ee)
            {t1: 'eeee', t2: 'ee'},     // (ee)(ee) -> (e)(e)
            {t1: 'eeee', t2: 'eee'},    // e(ee)e -> e(e)e which is valid
            {t1: 'eeeee', t2: 'eee'},   // 3 ways: e(ee)(ee), (ee)e(ee), (ee)(ee)e
            {t1: 'eeeeee', t2: 'eee'},  // (ee)(ee)(ee) -> (e)(e)(e)
            {t1: 'eeeeee', t2: 'eeee'}, // e(ee)e(ee) -> e(e)e(e)
                                        // (ee)e(ee)e -> (e)e(e)e
                                        // e(ee)(ee)e -> e(e)(e)e
        ];
        testGrammar(grammar, expectedResults, SILENT,
                    DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    // Note: test 36b is affected by the issue explored in tests 35, 35a-b.
    describe('36b. Replace aba by X: t1:aba -> t2:X {1,3}', function() {
        let grammar: Grammar = Replace(t1("aba"), t2("X"),
                                       EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                       false, false, 1, 3);
        grammar = CountTape(8, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const from_to: InputResultsPair[] = [
            [{t1: 'abababa'},   [{t1: 'abababa', t2: 'abXba'},
                                 {t1: 'abababa', t2: 'XbX'}]],
        ];
        testParseMultiple(grammar, from_to);
    });

    /*
    // Same tests with 2 'to'-tapes.

    // Note: the tests with 2 output tapes stopped passing because
    // CorrespondExpr, which is now used by ReplaceGrammar, is inherently
    // a two-tape-only thing.

    // These tests also have not been updated for the removal of the
    // maxExtraChars, maxCopyChars and vocabBypass parameters from
    // Replace and ReplaceGrammar.

    describe('2-1. Replace e by a/aa in hello: t1:e -> t2:a t4:aa {1+} || ^h_llo$', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("llo"), EMPTY_CONTEXT,
                                true, true, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t4: 'haallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-2. Replace e by a/aa in hello: t1:e -> t2:a t4:aa {1+} || h_llo', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("llo"), EMPTY_CONTEXT,
                                false, true, 1, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t4: 'haallo'},
            {t1: 'hhello', t2: 'hhallo', t4: 'hhaallo'},
            {t1: 'lhello', t2: 'lhallo', t4: 'lhaallo'},
            {t1: 'ohello', t2: 'ohallo', t4: 'ohaallo'},
            {t1: 'hhhello', t2: 'hhhallo', t4: 'hhhaallo'},
            {t1: 'hlhello', t2: 'hlhallo', t4: 'hlhaallo'},
            {t1: 'hohello', t2: 'hohallo', t4: 'hohaallo'},
            {t1: 'lhhello', t2: 'lhhallo', t4: 'lhhaallo'},
            {t1: 'llhello', t2: 'llhallo', t4: 'llhaallo'},
            {t1: 'lohello', t2: 'lohallo', t4: 'lohaallo'},
            {t1: 'ohhello', t2: 'ohhallo', t4: 'ohhaallo'},
            {t1: 'olhello', t2: 'olhallo', t4: 'olhaallo'},
            {t1: 'oohello', t2: 'oohallo', t4: 'oohaallo'},
        ];
        testGrammar(grammar, expectedResults); 
    });
    
    describe('2-3. Replace e by a/aa in hello: t1:e -> t2:a t4:aa {0+} || h_llo$', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("llo"), EMPTY_CONTEXT,
                                false, true, 0, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'o', t2: 'o', t4: 'o'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'ho', t2: 'ho', t4: 'ho'},
            {t1: 'lh', t2: 'lh', t4: 'lh'},
            {t1: 'll', t2: 'll', t4: 'll'},
            {t1: 'lo', t2: 'lo', t4: 'lo'},
            {t1: 'oh', t2: 'oh', t4: 'oh'},
            {t1: 'ol', t2: 'ol', t4: 'ol'},
            {t1: 'oo', t2: 'oo', t4: 'oo'},
            {t1: 'hello', t2: 'hallo', t4: 'haallo'},
            {t1: 'hhello', t2: 'hhallo', t4: 'hhaallo'},
            {t1: 'lhello', t2: 'lhallo', t4: 'lhaallo'},
            {t1: 'ohello', t2: 'ohallo', t4: 'ohaallo'},
            {t1: 'hhhello', t2: 'hhhallo', t4: 'hhhaallo'},
            {t1: 'hlhello', t2: 'hlhallo', t4: 'hlhaallo'},
            {t1: 'hohello', t2: 'hohallo', t4: 'hohaallo'},
            {t1: 'lhhello', t2: 'lhhallo', t4: 'lhhaallo'},
            {t1: 'llhello', t2: 'llhallo', t4: 'llhaallo'},
            {t1: 'lohello', t2: 'lohallo', t4: 'lohaallo'},
            {t1: 'ohhello', t2: 'ohhallo', t4: 'ohhaallo'},
            {t1: 'olhello', t2: 'olhallo', t4: 'olhaallo'},
            {t1: 'oohello', t2: 'oohallo', t4: 'oohaallo'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('2-4. Replace e by a/aa in hello: t1:e -> t2:a t4:aa {1+} || ^h_llo', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("llo"), EMPTY_CONTEXT,
                                true, false, 1, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t4: 'haallo'},
            {t1: 'helloh', t2: 'halloh', t4: 'haalloh'},
            {t1: 'hellol', t2: 'hallol', t4: 'haallol'},
            {t1: 'helloo', t2: 'halloo', t4: 'haalloo'},
            {t1: 'hellohh', t2: 'hallohh', t4: 'haallohh'},
            {t1: 'hellohl', t2: 'hallohl', t4: 'haallohl'},
            {t1: 'helloho', t2: 'halloho', t4: 'haalloho'},
            {t1: 'hellolh', t2: 'hallolh', t4: 'haallolh'},
            {t1: 'helloll', t2: 'halloll', t4: 'haalloll'},
            {t1: 'hellolo', t2: 'hallolo', t4: 'haallolo'},
            {t1: 'hellooh', t2: 'hallooh', t4: 'haallooh'},
            {t1: 'hellool', t2: 'hallool', t4: 'haallool'},
            {t1: 'hellooo', t2: 'hallooo', t4: 'haallooo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-5. Replace e by a/aa in hello: t1:e -> t2:a t4:aa {0+} || ^h_llo', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("llo"), EMPTY_CONTEXT,
                                true, false, 0, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'o', t2: 'o', t4: 'o'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'ho', t2: 'ho', t4: 'ho'},
            {t1: 'lh', t2: 'lh', t4: 'lh'},
            {t1: 'll', t2: 'll', t4: 'll'},
            {t1: 'lo', t2: 'lo', t4: 'lo'},
            {t1: 'oh', t2: 'oh', t4: 'oh'},
            {t1: 'ol', t2: 'ol', t4: 'ol'},
            {t1: 'oo', t2: 'oo', t4: 'oo'},
            {t1: 'hello', t2: 'hallo', t4: 'haallo'},
            {t1: 'helloh', t2: 'halloh', t4: 'haalloh'},
            {t1: 'hellol', t2: 'hallol', t4: 'haallol'},
            {t1: 'helloo', t2: 'halloo', t4: 'haalloo'},
            {t1: 'hellohh', t2: 'hallohh', t4: 'haallohh'},
            {t1: 'hellohl', t2: 'hallohl', t4: 'haallohl'},
            {t1: 'helloho', t2: 'halloho', t4: 'haalloho'},
            {t1: 'hellolh', t2: 'hallolh', t4: 'haallolh'},
            {t1: 'helloll', t2: 'halloll', t4: 'haalloll'},
            {t1: 'hellolo', t2: 'hallolo', t4: 'haallolo'},
            {t1: 'hellooh', t2: 'hallooh', t4: 'haallooh'},
            {t1: 'hellool', t2: 'hallool', t4: 'haallool'},
            {t1: 'hellooo', t2: 'hallooo', t4: 'haallooo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-6. Replace e by a/aa in hello: t1:e -> t2:a t4:aa {1,5} || h_llo', function() {
        let grammar: Grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                       t1("h"), t1("llo"), EMPTY_CONTEXT,
                                       false, false, 1, 5, 3);
        grammar = CountTape({t1:7}, grammar);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t4: 'haallo'},
            {t1: 'helloh', t2: 'halloh', t4: 'haalloh'},
            {t1: 'hellol', t2: 'hallol', t4: 'haallol'},
            {t1: 'helloo', t2: 'halloo', t4: 'haalloo'},
            {t1: 'hhello', t2: 'hhallo', t4: 'hhaallo'},
            {t1: 'lhello', t2: 'lhallo', t4: 'lhaallo'},
            {t1: 'ohello', t2: 'ohallo', t4: 'ohaallo'},
            {t1: 'hellohh', t2: 'hallohh', t4: 'haallohh'},
            {t1: 'hellohl', t2: 'hallohl', t4: 'haallohl'},
            {t1: 'helloho', t2: 'halloho', t4: 'haalloho'},
            {t1: 'hellolh', t2: 'hallolh', t4: 'haallolh'},
            {t1: 'helloll', t2: 'halloll', t4: 'haalloll'},
            {t1: 'hellolo', t2: 'hallolo', t4: 'haallolo'},
            {t1: 'hellooh', t2: 'hallooh', t4: 'haallooh'},
            {t1: 'hellool', t2: 'hallool', t4: 'haallool'},
            {t1: 'hellooo', t2: 'hallooo', t4: 'haallooo'},
            {t1: 'hhelloh', t2: 'hhalloh', t4: 'hhaalloh'},
            {t1: 'hhellol', t2: 'hhallol', t4: 'hhaallol'},
            {t1: 'hhelloo', t2: 'hhalloo', t4: 'hhaalloo'},
            {t1: 'hhhello', t2: 'hhhallo', t4: 'hhhaallo'},
            {t1: 'hlhello', t2: 'hlhallo', t4: 'hlhaallo'},
            {t1: 'hohello', t2: 'hohallo', t4: 'hohaallo'},
            {t1: 'lhelloh', t2: 'lhalloh', t4: 'lhaalloh'},
            {t1: 'lhellol', t2: 'lhallol', t4: 'lhaallol'},
            {t1: 'lhelloo', t2: 'lhalloo', t4: 'lhaalloo'},
            {t1: 'lhhello', t2: 'lhhallo', t4: 'lhhaallo'},
            {t1: 'llhello', t2: 'llhallo', t4: 'llhaallo'},
            {t1: 'lohello', t2: 'lohallo', t4: 'lohaallo'},
            {t1: 'ohelloh', t2: 'ohalloh', t4: 'ohaalloh'},
            {t1: 'ohellol', t2: 'ohallol', t4: 'ohaallol'},
            {t1: 'ohelloo', t2: 'ohalloo', t4: 'ohaalloo'},
            {t1: 'ohhello', t2: 'ohhallo', t4: 'ohhaallo'},
            {t1: 'olhello', t2: 'olhallo', t4: 'olhaallo'},
            {t1: 'oohello', t2: 'oohallo', t4: 'oohaallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-7. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {1+} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                       t1("h"), t1("l"), EMPTY_CONTEXT,
                                       false, false, 1, Infinity, 1);
        grammar = CountTape({t1:9}, grammar);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'helh', t2: 'halh', t4: 'haalh'},
            {t1: 'hell', t2: 'hall', t4: 'haall'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'lhel', t2: 'lhal', t4: 'lhaal'},
            {t1: 'hhelh', t2: 'hhalh', t4: 'hhaalh'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'lhelh', t2: 'lhalh', t4: 'lhaalh'},
            {t1: 'lhell', t2: 'lhall', t4: 'lhaall'},
            {t1: 'helhel', t2: 'halhal', t4: 'haalhaal'},
            {t1: 'helhelh', t2: 'halhalh', t4: 'haalhaalh'},
            {t1: 'helhell', t2: 'halhall', t4: 'haalhaall'},
            {t1: 'helhhel', t2: 'halhhal', t4: 'haalhhaal'},
            {t1: 'hellhel', t2: 'hallhal', t4: 'haallhaal'},
            {t1: 'hhelhel', t2: 'hhalhal', t4: 'hhaalhaal'},
            {t1: 'lhelhel', t2: 'lhalhal', t4: 'lhaalhaal'},
            {t1: 'helhhelh', t2: 'halhhalh', t4: 'haalhhaalh'},
            {t1: 'helhhell', t2: 'halhhall', t4: 'haalhhaall'},
            {t1: 'hellhelh', t2: 'hallhalh', t4: 'haallhaalh'},
            {t1: 'hellhell', t2: 'hallhall', t4: 'haallhaall'},
            {t1: 'hhelhelh', t2: 'hhalhalh', t4: 'hhaalhaalh'},
            {t1: 'hhelhell', t2: 'hhalhall', t4: 'hhaalhaall'},
            {t1: 'hhelhhel', t2: 'hhalhhal', t4: 'hhaalhhaal'},
            {t1: 'hhellhel', t2: 'hhallhal', t4: 'hhaallhaal'},
            {t1: 'lhelhelh', t2: 'lhalhalh', t4: 'lhaalhaalh'},
            {t1: 'lhelhell', t2: 'lhalhall', t4: 'lhaalhaall'},
            {t1: 'lhelhhel', t2: 'lhalhhal', t4: 'lhaalhhaal'},
            {t1: 'lhellhel', t2: 'lhallhal', t4: 'lhaallhaal'},
            {t1: 'helhelhel', t2: 'halhalhal', t4: 'haalhaalhaal'},
            {t1: 'hhelhhelh', t2: 'hhalhhalh', t4: 'hhaalhhaalh'},
            {t1: 'hhelhhell', t2: 'hhalhhall', t4: 'hhaalhhaall'},
            {t1: 'hhellhelh', t2: 'hhallhalh', t4: 'hhaallhaalh'},
            {t1: 'hhellhell', t2: 'hhallhall', t4: 'hhaallhaall'},
            {t1: 'lhelhhelh', t2: 'lhalhhalh', t4: 'lhaalhhaalh'},
            {t1: 'lhelhhell', t2: 'lhalhhall', t4: 'lhaalhhaall'},
            {t1: 'lhellhelh', t2: 'lhallhalh', t4: 'lhaallhaalh'},
            {t1: 'lhellhell', t2: 'lhallhall', t4: 'lhaallhaall'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-8. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {0,2} || h_l', function() {
        let grammar: Grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                       t1("h"), t1("l"), EMPTY_CONTEXT,
                                       false, false, 0, 2, 1);
        grammar = CountTape({t1:9}, grammar);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'helh', t2: 'halh', t4: 'haalh'},
            {t1: 'hell', t2: 'hall', t4: 'haall'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'lhel', t2: 'lhal', t4: 'lhaal'},
            {t1: 'hhelh', t2: 'hhalh', t4: 'hhaalh'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'lhelh', t2: 'lhalh', t4: 'lhaalh'},
            {t1: 'lhell', t2: 'lhall', t4: 'lhaall'},
            {t1: 'helhel', t2: 'halhal', t4: 'haalhaal'},
            {t1: 'helhelh', t2: 'halhalh', t4: 'haalhaalh'},
            {t1: 'helhell', t2: 'halhall', t4: 'haalhaall'},
            {t1: 'helhhel', t2: 'halhhal', t4: 'haalhhaal'},
            {t1: 'hellhel', t2: 'hallhal', t4: 'haallhaal'},
            {t1: 'hhelhel', t2: 'hhalhal', t4: 'hhaalhaal'},
            {t1: 'lhelhel', t2: 'lhalhal', t4: 'lhaalhaal'},
            {t1: 'helhhelh', t2: 'halhhalh', t4: 'haalhhaalh'},
            {t1: 'helhhell', t2: 'halhhall', t4: 'haalhhaall'},
            {t1: 'hellhelh', t2: 'hallhalh', t4: 'haallhaalh'},
            {t1: 'hellhell', t2: 'hallhall', t4: 'haallhaall'},
            {t1: 'hhelhelh', t2: 'hhalhalh', t4: 'hhaalhaalh'},
            {t1: 'hhelhell', t2: 'hhalhall', t4: 'hhaalhaall'},
            {t1: 'hhelhhel', t2: 'hhalhhal', t4: 'hhaalhhaal'},
            {t1: 'hhellhel', t2: 'hhallhal', t4: 'hhaallhaal'},
            {t1: 'lhelhelh', t2: 'lhalhalh', t4: 'lhaalhaalh'},
            {t1: 'lhelhell', t2: 'lhalhall', t4: 'lhaalhaall'},
            {t1: 'lhelhhel', t2: 'lhalhhal', t4: 'lhaalhhaal'},
            {t1: 'lhellhel', t2: 'lhallhal', t4: 'lhaallhaal'},
            {t1: 'hhelhhelh', t2: 'hhalhhalh', t4: 'hhaalhhaalh'},
            {t1: 'hhelhhell', t2: 'hhalhhall', t4: 'hhaalhhaall'},
            {t1: 'hhellhelh', t2: 'hhallhalh', t4: 'hhaallhaalh'},
            {t1: 'hhellhell', t2: 'hhallhall', t4: 'hhaallhaall'},
            {t1: 'lhelhhelh', t2: 'lhalhhalh', t4: 'lhaalhhaalh'},
            {t1: 'lhelhhell', t2: 'lhalhhall', t4: 'lhaalhhaall'},
            {t1: 'lhellhelh', t2: 'lhallhalh', t4: 'lhaallhaalh'},
            {t1: 'lhellhell', t2: 'lhallhall', t4: 'lhaallhaall'},
        ];
        testGrammar(grammar, expectedResults);
    });


    describe('2-9. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {1} || h_l', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 1, 1, 5);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll'},
            // Invalid Inputs
            {t1: 'helhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-10. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {0,3} || h_l', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 3, 4);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'lhhelhl', t2: 'lhhalhl', t4: 'lhhaalhl'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll'},
            {t1: 'lhellhhel', t2: 'lhallhhal', t4: 'lhaallhhaal'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal', t4: 'lhaalhhllhaal'},
            {t1: 'helhelhel', t2: 'halhalhal', t4: 'haalhaalhaal'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall', t4: 'lhaalhaalhhlhaall'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhallhhalhlhallh', t4: 'hlhaallhhaalhlhaallh'},
            // Invalid Inputs
            {t1: 'helhhhhllllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });


    describe('2-11. Replace e by a/aa in he: t1:e -> t2:a t4:aa {0,2} || h_0', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1(""), EMPTY_CONTEXT,
                                false, false, 0, 2, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'he', t2: 'ha', t4: 'haa'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'heh', t2: 'hah', t4: 'haah'},
            {t1: 'hhe', t2: 'hha', t4: 'hhaa'},
            {t1: 'hehe', t2: 'haha', t4: 'haahaa'},
            {t1: 'hehh', t2: 'hahh', t4: 'haahh'},
            {t1: 'hheh', t2: 'hhah', t4: 'hhaah'},
            {t1: 'hhhe', t2: 'hhha', t4: 'hhhaa'},
            {t1: 'heheh', t2: 'hahah', t4: 'haahaah'},
            {t1: 'hehhe', t2: 'hahha', t4: 'haahhaa'},
            {t1: 'hhehe', t2: 'hhaha', t4: 'hhaahaa'},
            {t1: 'hhehh', t2: 'hhahh', t4: 'hhaahh'},
            {t1: 'hhheh', t2: 'hhhah', t4: 'hhhaah'},
            {t1: 'hehehh', t2: 'hahahh', t4: 'haahaahh'},
            {t1: 'hehheh', t2: 'hahhah', t4: 'haahhaah'},
            {t1: 'hehhhe', t2: 'hahhha', t4: 'haahhhaa'},
            {t1: 'hheheh', t2: 'hhahah', t4: 'hhaahaah'},
            {t1: 'hhehhe', t2: 'hhahha', t4: 'hhaahhaa'},
            {t1: 'hhhehe', t2: 'hhhaha', t4: 'hhhaahaa'},
            {t1: 'hhhehh', t2: 'hhhahh', t4: 'hhhaahh'},
            {t1: 'hehhehh', t2: 'hahhahh', t4: 'haahhaahh'},
            {t1: 'hehhheh', t2: 'hahhhah', t4: 'haahhhaah'},
            {t1: 'hhehehh', t2: 'hhahahh', t4: 'hhaahaahh'},
            {t1: 'hhehheh', t2: 'hhahhah', t4: 'hhaahhaah'},
            {t1: 'hhehhhe', t2: 'hhahhha', t4: 'hhaahhhaa'},
            {t1: 'hhheheh', t2: 'hhhahah', t4: 'hhhaahaah'},
            {t1: 'hhhehhe', t2: 'hhhahha', t4: 'hhhaahhaa'},
            {t1: 'hehhhehh', t2: 'hahhhahh', t4: 'haahhhaahh'},
            {t1: 'hhehhehh', t2: 'hhahhahh', t4: 'hhaahhaahh'},
            {t1: 'hhehhheh', t2: 'hhahhhah', t4: 'hhaahhhaah'},
            {t1: 'hhhehehh', t2: 'hhhahahh', t4: 'hhhaahaahh'},
            {t1: 'hhhehheh', t2: 'hhhahhah', t4: 'hhhaahhaah'},
            {t1: 'hhhehhhe', t2: 'hhhahhha', t4: 'hhhaahhhaa'},
            {t1: 'hhehhhehh', t2: 'hhahhhahh', t4: 'hhaahhhaahh'},
            {t1: 'hhhehhehh', t2: 'hhhahhahh', t4: 'hhhaahhaahh'},
            {t1: 'hhhehhheh', t2: 'hhhahhhah', t4: 'hhhaahhhaah'},
            {t1: 'hhhehhhehh', t2: 'hhhahhhahh', t4: 'hhhaahhhaahh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-12. Replace e by a/aa in he: t1:e -> t2:a t4:aa {0,2} || h_', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT,
                                false, false, 0, 2, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'he', t2: 'ha', t4: 'haa'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'heh', t2: 'hah', t4: 'haah'},
            {t1: 'hhe', t2: 'hha', t4: 'hhaa'},
            {t1: 'hehe', t2: 'haha', t4: 'haahaa'},
            {t1: 'hehh', t2: 'hahh', t4: 'haahh'},
            {t1: 'hheh', t2: 'hhah', t4: 'hhaah'},
            {t1: 'hhhe', t2: 'hhha', t4: 'hhhaa'},
            {t1: 'heheh', t2: 'hahah', t4: 'haahaah'},
            {t1: 'hehhe', t2: 'hahha', t4: 'haahhaa'},
            {t1: 'hhehe', t2: 'hhaha', t4: 'hhaahaa'},
            {t1: 'hhehh', t2: 'hhahh', t4: 'hhaahh'},
            {t1: 'hhheh', t2: 'hhhah', t4: 'hhhaah'},
            {t1: 'hehehh', t2: 'hahahh', t4: 'haahaahh'},
            {t1: 'hehheh', t2: 'hahhah', t4: 'haahhaah'},
            {t1: 'hehhhe', t2: 'hahhha', t4: 'haahhhaa'},
            {t1: 'hheheh', t2: 'hhahah', t4: 'hhaahaah'},
            {t1: 'hhehhe', t2: 'hhahha', t4: 'hhaahhaa'},
            {t1: 'hhhehe', t2: 'hhhaha', t4: 'hhhaahaa'},
            {t1: 'hhhehh', t2: 'hhhahh', t4: 'hhhaahh'},
            {t1: 'hehhehh', t2: 'hahhahh', t4: 'haahhaahh'},
            {t1: 'hehhheh', t2: 'hahhhah', t4: 'haahhhaah'},
            {t1: 'hhehehh', t2: 'hhahahh', t4: 'hhaahaahh'},
            {t1: 'hhehheh', t2: 'hhahhah', t4: 'hhaahhaah'},
            {t1: 'hhehhhe', t2: 'hhahhha', t4: 'hhaahhhaa'},
            {t1: 'hhheheh', t2: 'hhhahah', t4: 'hhhaahaah'},
            {t1: 'hhhehhe', t2: 'hhhahha', t4: 'hhhaahhaa'},
            {t1: 'hehhhehh', t2: 'hahhhahh', t4: 'haahhhaahh'},
            {t1: 'hhehhehh', t2: 'hhahhahh', t4: 'hhaahhaahh'},
            {t1: 'hhehhheh', t2: 'hhahhhah', t4: 'hhaahhhaah'},
            {t1: 'hhhehehh', t2: 'hhhahahh', t4: 'hhhaahaahh'},
            {t1: 'hhhehheh', t2: 'hhhahhah', t4: 'hhhaahhaah'},
            {t1: 'hhhehhhe', t2: 'hhhahhha', t4: 'hhhaahhhaa'},
            {t1: 'hhehhhehh', t2: 'hhahhhahh', t4: 'hhaahhhaahh'},
            {t1: 'hhhehhehh', t2: 'hhhahhahh', t4: 'hhhaahhaahh'},
            {t1: 'hhhehhheh', t2: 'hhhahhhah', t4: 'hhhaahhhaah'},
            {t1: 'hhhehhhehh', t2: 'hhhahhhahh', t4: 'hhhaahhhaahh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-13. Replace e by a/aa in he: t1:e -> t2:a t4:aa {0,2} || _l', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 2);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'el', t2: 'al', t4: 'aal'},
            {t1: 'll', t2: 'll', t4: 'll'},
            {t1: 'ell', t2: 'all', t4: 'aall'},
            {t1: 'lel', t2: 'lal', t4: 'laal'},
            {t1: 'elel', t2: 'alal', t4: 'aalaal'},
            {t1: 'elll', t2: 'alll', t4: 'aalll'},
            {t1: 'lell', t2: 'lall', t4: 'laall'},
            {t1: 'llel', t2: 'llal', t4: 'llaal'},
            {t1: 'elell', t2: 'alall', t4: 'aalaall'},
            {t1: 'ellel', t2: 'allal', t4: 'aallaal'},
            {t1: 'lelel', t2: 'lalal', t4: 'laalaal'},
            {t1: 'lelll', t2: 'lalll', t4: 'laalll'},
            {t1: 'llell', t2: 'llall', t4: 'llaall'},
            {t1: 'elelll', t2: 'alalll', t4: 'aalaalll'},
            {t1: 'ellell', t2: 'allall', t4: 'aallaall'},
            {t1: 'elllel', t2: 'alllal', t4: 'aalllaal'},
            {t1: 'lelell', t2: 'lalall', t4: 'laalaall'},
            {t1: 'lellel', t2: 'lallal', t4: 'laallaal'},
            {t1: 'llelel', t2: 'llalal', t4: 'llaalaal'},
            {t1: 'llelll', t2: 'llalll', t4: 'llaalll'},
            {t1: 'ellelll', t2: 'allalll', t4: 'aallaalll'},
            {t1: 'elllell', t2: 'alllall', t4: 'aalllaall'},
            {t1: 'lelelll', t2: 'lalalll', t4: 'laalaalll'},
            {t1: 'lellell', t2: 'lallall', t4: 'laallaall'},
            {t1: 'lelllel', t2: 'lalllal', t4: 'laalllaal'},
            {t1: 'llelell', t2: 'llalall', t4: 'llaalaall'},
            {t1: 'llellel', t2: 'llallal', t4: 'llaallaal'},
            {t1: 'elllelll', t2: 'alllalll', t4: 'aalllaalll'},
            {t1: 'lellelll', t2: 'lallalll', t4: 'laallaalll'},
            {t1: 'lelllell', t2: 'lalllall', t4: 'laalllaall'},
            {t1: 'llelelll', t2: 'llalalll', t4: 'llaalaalll'},
            {t1: 'llellell', t2: 'llallall', t4: 'llaallaall'},
            {t1: 'llelllel', t2: 'llalllal', t4: 'llaalllaal'},
            {t1: 'lelllelll', t2: 'lalllalll', t4: 'laalllaalll'},
            {t1: 'llellelll', t2: 'llallalll', t4: 'llaallaalll'},
            {t1: 'llelllell', t2: 'llalllall', t4: 'llaalllaall'},
            {t1: 'llelllelll', t2: 'llalllalll', t4: 'llaalllaalll'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-14. Replace e by a/aa: t1:e -> t2:a t4:aa {0,2} (vocab hel/hal)', function() {
        const grammar = Seq(Vocab('t1', "hle"), Vocab('t2', "hla"), Vocab('t4', "hla"),
                            Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                    EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                    false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'a', t4: 'aa'},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'eh', t2: 'ah', t4: 'aah'},
            {t1: 'el', t2: 'al', t4: 'aal'},
            {t1: 'ee', t2: 'aa', t4: 'aaaa'},
            {t1: 'he', t2: 'ha', t4: 'haa'},
            {t1: 'le', t2: 'la', t4: 'laa'},
            {t1: 'ehe', t2: 'aha', t4: 'aahaa'},
            {t1: 'ele', t2: 'ala', t4: 'aalaa'},
            {t1: 'eeh', t2: 'aah', t4: 'aaaah'},
            {t1: 'eel', t2: 'aal', t4: 'aaaal'},
            {t1: 'heh', t2: 'hah', t4: 'haah'},
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'hee', t2: 'haa', t4: 'haaaa'},
            {t1: 'leh', t2: 'lah', t4: 'laah'},
            {t1: 'lel', t2: 'lal', t4: 'laal'},
            {t1: 'lee', t2: 'laa', t4: 'laaaa'},
            {t1: 'eheh', t2: 'ahah', t4: 'aahaah'},
            {t1: 'ehel', t2: 'ahal', t4: 'aahaal'},
            {t1: 'eleh', t2: 'alah', t4: 'aalaah'},
            {t1: 'elel', t2: 'alal', t4: 'aalaal'},
            {t1: 'hehe', t2: 'haha', t4: 'haahaa'},
            {t1: 'hele', t2: 'hala', t4: 'haalaa'},
            {t1: 'heeh', t2: 'haah', t4: 'haaaah'},
            {t1: 'heel', t2: 'haal', t4: 'haaaal'},
            {t1: 'lehe', t2: 'laha', t4: 'laahaa'},
            {t1: 'lele', t2: 'lala', t4: 'laalaa'},
            {t1: 'leeh', t2: 'laah', t4: 'laaaah'},
            {t1: 'leel', t2: 'laal', t4: 'laaaal'},
            {t1: 'heheh', t2: 'hahah', t4: 'haahaah'},
            {t1: 'hehel', t2: 'hahal', t4: 'haahaal'},
            {t1: 'heleh', t2: 'halah', t4: 'haalaah'},
            {t1: 'helel', t2: 'halal', t4: 'haalaal'},
            {t1: 'leheh', t2: 'lahah', t4: 'laahaah'},
            {t1: 'lehel', t2: 'lahal', t4: 'laahaal'},
            {t1: 'leleh', t2: 'lalah', t4: 'laalaah'},
            {t1: 'lelel', t2: 'lalal', t4: 'laalaal'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-15. Replace e by a/aa: t1:e -> t2:a t4:aa {0,3} (vocab hel/hal)', function() {
        const grammar = Seq(Vocab('t1', "hle"), Vocab('t2', "hla"), Vocab('t4', "hla"),
                            Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                    EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                    false, false, 0, 3, 2));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'e', t2: 'a', t4: 'aa'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'ee', t2: 'aa', t4: 'aaaa'},
            {t1: 'he', t2: 'ha', t4: 'haa'},
            {t1: 'll', t2: 'll', t4: 'll'},
            {t1: 'ell', t2: 'all', t4: 'aall'},
            {t1: 'eee', t2: 'aaa', t4: 'aaaaaa'},
            {t1: 'ehhe', t2: 'ahha', t4: 'aahhaa'},
            {t1: 'eehh', t2: 'aahh', t4: 'aaaahh'},
            {t1: 'lehel', t2: 'lahal', t4: 'laahaal'},
            {t1: 'ehehe', t2: 'ahaha', t4: 'aahaahaa'},
            {t1: 'ellee', t2: 'allaa', t4: 'aallaaaa'},
            {t1: 'heeeh', t2: 'haaah', t4: 'haaaaaah'},
            {t1: 'lehhe', t2: 'lahha', t4: 'laahhaa'},
            {t1: 'eheehl', t2: 'ahaahl', t4: 'aahaaaahl'},
            {t1: 'ehhell', t2: 'ahhall', t4: 'aahhaall'},
            {t1: 'hehhee', t2: 'hahhaa', t4: 'haahhaaaa'},
            {t1: 'ehehehl', t2: 'ahahahl', t4: 'aahaahaahl'},
            {t1: 'ehheehh', t2: 'ahhaahh', t4: 'aahhaaaahh'},
            {t1: 'ellelle', t2: 'allalla', t4: 'aallaallaa'},
            {t1: 'elleehh', t2: 'allaahh', t4: 'aallaaaahh'},
            {t1: 'heheheh', t2: 'hahahah', t4: 'haahaahaah'},
            {t1: 'hheeehh', t2: 'hhaaahh', t4: 'hhaaaaaahh'},
            {t1: 'hehlehle', t2: 'hahlahla', t4: 'haahlaahlaa'},
            {t1: 'hhehhehh', t2: 'hhahhahh', t4: 'hhaahhaahh'},
            {t1: 'hhehleheh', t2: 'hhahlahah', t4: 'hhaahlaahaah'},
            {t1: 'hleellell', t2: 'hlaallall', t4: 'hlaaaallaall'},
            {t1: 'llelhelehh', t2: 'llalhalahh', t4: 'llaalhaalaahh'},
            {t1: 'llehlehlehh', t2: 'llahlahlahh', t4: 'llaahlaahlaahh'},
            {t1: 'llellellell', t2: 'llallallall', t4: 'llaallaallaall'},
            // Invalid Inputs
            {t1: 'helhhhhellllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-16. Replace e by ee/eee in hel: t1:e -> t2:ee t4:eee {0,2} || h_l', function() {
        const grammar = Seq(Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                    t1("h"), t1("l"), EMPTY_CONTEXT,
                                    false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hel', t2: 'heel', t4: 'heeel'},
            {t1: 'helh', t2: 'heelh', t4: 'heeelh'},
            {t1: 'hele', t2: 'heele', t4: 'heeele'},
            {t1: 'hell', t2: 'heell', t4: 'heeell'},
            {t1: 'hhel', t2: 'hheel', t4: 'hheeel'},
            {t1: 'ehel', t2: 'eheel', t4: 'eheeel'},
            {t1: 'lhel', t2: 'lheel', t4: 'lheeel'},
            {t1: 'hhelh', t2: 'hheelh', t4: 'hheeelh'},
            {t1: 'hhele', t2: 'hheele', t4: 'hheeele'},
            {t1: 'hhell', t2: 'hheell', t4: 'hheeell'},
            {t1: 'ehelh', t2: 'eheelh', t4: 'eheeelh'},
            {t1: 'ehele', t2: 'eheele', t4: 'eheeele'},
            {t1: 'ehell', t2: 'eheell', t4: 'eheeell'},
            {t1: 'lhelh', t2: 'lheelh', t4: 'lheeelh'},
            {t1: 'lhele', t2: 'lheele', t4: 'lheeele'},
            {t1: 'lhell', t2: 'lheell', t4: 'lheeell'},
            {t1: 'helhel', t2: 'heelheel', t4: 'heeelheeel'},
            {t1: 'helhelh', t2: 'heelheelh', t4: 'heeelheeelh'},
            {t1: 'helhele', t2: 'heelheele', t4: 'heeelheeele'},
            {t1: 'helhell', t2: 'heelheell', t4: 'heeelheeell'},
            {t1: 'helhhel', t2: 'heelhheel', t4: 'heeelhheeel'},
            {t1: 'helehel', t2: 'heeleheel', t4: 'heeeleheeel'},
            {t1: 'hellhel', t2: 'heellheel', t4: 'heeellheeel'},
            {t1: 'hhelhel', t2: 'hheelheel', t4: 'hheeelheeel'},
            {t1: 'ehelhel', t2: 'eheelheel', t4: 'eheeelheeel'},
            {t1: 'lhelhel', t2: 'lheelheel', t4: 'lheeelheeel'},
            {t1: 'helhhelh', t2: 'heelhheelh', t4: 'heeelhheeelh'},
            {t1: 'helhhele', t2: 'heelhheele', t4: 'heeelhheeele'},
            {t1: 'helhhell', t2: 'heelhheell', t4: 'heeelhheeell'},
            {t1: 'helehelh', t2: 'heeleheelh', t4: 'heeeleheeelh'},
            {t1: 'helehele', t2: 'heeleheele', t4: 'heeeleheeele'},
            {t1: 'helehell', t2: 'heeleheell', t4: 'heeeleheeell'},
            {t1: 'hellhelh', t2: 'heellheelh', t4: 'heeellheeelh'},
            {t1: 'hellhele', t2: 'heellheele', t4: 'heeellheeele'},
            {t1: 'hellhell', t2: 'heellheell', t4: 'heeellheeell'},
            {t1: 'hhelhelh', t2: 'hheelheelh', t4: 'hheeelheeelh'},
            {t1: 'hhelhele', t2: 'hheelheele', t4: 'hheeelheeele'},
            {t1: 'hhelhell', t2: 'hheelheell', t4: 'hheeelheeell'},
            {t1: 'hhelhhel', t2: 'hheelhheel', t4: 'hheeelhheeel'},
            {t1: 'hhelehel', t2: 'hheeleheel', t4: 'hheeeleheeel'},
            {t1: 'hhellhel', t2: 'hheellheel', t4: 'hheeellheeel'},
            {t1: 'ehelhelh', t2: 'eheelheelh', t4: 'eheeelheeelh'},
            {t1: 'ehelhele', t2: 'eheelheele', t4: 'eheeelheeele'},
            {t1: 'ehelhell', t2: 'eheelheell', t4: 'eheeelheeell'},
            {t1: 'ehelhhel', t2: 'eheelhheel', t4: 'eheeelhheeel'},
            {t1: 'ehelehel', t2: 'eheeleheel', t4: 'eheeeleheeel'},
            {t1: 'ehellhel', t2: 'eheellheel', t4: 'eheeellheeel'},
            {t1: 'lhelhelh', t2: 'lheelheelh', t4: 'lheeelheeelh'},
            {t1: 'lhelhele', t2: 'lheelheele', t4: 'lheeelheeele'},
            {t1: 'lhelhell', t2: 'lheelheell', t4: 'lheeelheeell'},
            {t1: 'lhelhhel', t2: 'lheelhheel', t4: 'lheeelhheeel'},
            {t1: 'lhelehel', t2: 'lheeleheel', t4: 'lheeeleheeel'},
            {t1: 'lhellhel', t2: 'lheellheel', t4: 'lheeellheeel'},
            {t1: 'hhelhhelh', t2: 'hheelhheelh', t4: 'hheeelhheeelh'},
            {t1: 'hhelhhele', t2: 'hheelhheele', t4: 'hheeelhheeele'},
            {t1: 'hhelhhell', t2: 'hheelhheell', t4: 'hheeelhheeell'},
            {t1: 'hhelehelh', t2: 'hheeleheelh', t4: 'hheeeleheeelh'},
            {t1: 'hhelehele', t2: 'hheeleheele', t4: 'hheeeleheeele'},
            {t1: 'hhelehell', t2: 'hheeleheell', t4: 'hheeeleheeell'},
            {t1: 'hhellhelh', t2: 'hheellheelh', t4: 'hheeellheeelh'},
            {t1: 'hhellhele', t2: 'hheellheele', t4: 'hheeellheeele'},
            {t1: 'hhellhell', t2: 'hheellheell', t4: 'hheeellheeell'},
            {t1: 'ehelhhelh', t2: 'eheelhheelh', t4: 'eheeelhheeelh'},
            {t1: 'ehelhhele', t2: 'eheelhheele', t4: 'eheeelhheeele'},
            {t1: 'ehelhhell', t2: 'eheelhheell', t4: 'eheeelhheeell'},
            {t1: 'ehelehelh', t2: 'eheeleheelh', t4: 'eheeeleheeelh'},
            {t1: 'ehelehele', t2: 'eheeleheele', t4: 'eheeeleheeele'},
            {t1: 'ehelehell', t2: 'eheeleheell', t4: 'eheeeleheeell'},
            {t1: 'ehellhelh', t2: 'eheellheelh', t4: 'eheeellheeelh'},
            {t1: 'ehellhele', t2: 'eheellheele', t4: 'eheeellheeele'},
            {t1: 'ehellhell', t2: 'eheellheell', t4: 'eheeellheeell'},
            {t1: 'lhelhhelh', t2: 'lheelhheelh', t4: 'lheeelhheeelh'},
            {t1: 'lhelhhele', t2: 'lheelhheele', t4: 'lheeelhheeele'},
            {t1: 'lhelhhell', t2: 'lheelhheell', t4: 'lheeelhheeell'},
            {t1: 'lhelehelh', t2: 'lheeleheelh', t4: 'lheeeleheeelh'},
            {t1: 'lhelehele', t2: 'lheeleheele', t4: 'lheeeleheeele'},
            {t1: 'lhelehell', t2: 'lheeleheell', t4: 'lheeeleheeell'},
            {t1: 'lhellhelh', t2: 'lheellheelh', t4: 'lheeellheeelh'},
            {t1: 'lhellhele', t2: 'lheellheele', t4: 'lheeellheeele'},
            {t1: 'lhellhell', t2: 'lheellheell', t4: 'lheeellheeell'},
        ];
        testGrammar(grammar, expectedResults);
    }); 
    
    describe('2-17. Replace e by ee/eee in hel: t1:e -> t2:ee t4:eee {1+} || ^h_l', function() {
        const grammar = Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                true, false, 1, Infinity, 3);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'heel', t4: 'heeel'},
            {t1: 'helh', t2: 'heelh', t4: 'heeelh'},
            {t1: 'hele', t2: 'heele', t4: 'heeele'},
            {t1: 'hell', t2: 'heell', t4: 'heeell'},
            {t1: 'helhh', t2: 'heelhh', t4: 'heeelhh'},
            {t1: 'helhe', t2: 'heelhe', t4: 'heeelhe'},
            {t1: 'helhl', t2: 'heelhl', t4: 'heeelhl'},
            {t1: 'heleh', t2: 'heeleh', t4: 'heeeleh'},
            {t1: 'helee', t2: 'heelee', t4: 'heeelee'},
            {t1: 'helel', t2: 'heelel', t4: 'heeelel'},
            {t1: 'hellh', t2: 'heellh', t4: 'heeellh'},
            {t1: 'helle', t2: 'heelle', t4: 'heeelle'},
            {t1: 'helll', t2: 'heelll', t4: 'heeelll'},
            {t1: 'helhhh', t2: 'heelhhh', t4: 'heeelhhh'},
            {t1: 'helhhe', t2: 'heelhhe', t4: 'heeelhhe'},
            {t1: 'helhhl', t2: 'heelhhl', t4: 'heeelhhl'},
            {t1: 'helheh', t2: 'heelheh', t4: 'heeelheh'},
            {t1: 'helhee', t2: 'heelhee', t4: 'heeelhee'},
            {t1: 'helhel', t2: 'heelhel', t4: 'heeelhel'},
            {t1: 'helhlh', t2: 'heelhlh', t4: 'heeelhlh'},
            {t1: 'helhle', t2: 'heelhle', t4: 'heeelhle'},
            {t1: 'helhll', t2: 'heelhll', t4: 'heeelhll'},
            {t1: 'helehh', t2: 'heelehh', t4: 'heeelehh'},
            {t1: 'helehe', t2: 'heelehe', t4: 'heeelehe'},
            {t1: 'helehl', t2: 'heelehl', t4: 'heeelehl'},
            {t1: 'heleeh', t2: 'heeleeh', t4: 'heeeleeh'},
            {t1: 'heleee', t2: 'heeleee', t4: 'heeeleee'},
            {t1: 'heleel', t2: 'heeleel', t4: 'heeeleel'},
            {t1: 'helelh', t2: 'heelelh', t4: 'heeelelh'},
            {t1: 'helele', t2: 'heelele', t4: 'heeelele'},
            {t1: 'helell', t2: 'heelell', t4: 'heeelell'},
            {t1: 'hellhh', t2: 'heellhh', t4: 'heeellhh'},
            {t1: 'hellhe', t2: 'heellhe', t4: 'heeellhe'},
            {t1: 'hellhl', t2: 'heellhl', t4: 'heeellhl'},
            {t1: 'helleh', t2: 'heelleh', t4: 'heeelleh'},
            {t1: 'hellee', t2: 'heellee', t4: 'heeellee'},
            {t1: 'hellel', t2: 'heellel', t4: 'heeellel'},
            {t1: 'helllh', t2: 'heelllh', t4: 'heeelllh'},
            {t1: 'hellle', t2: 'heellle', t4: 'heeellle'},
            {t1: 'hellll', t2: 'heellll', t4: 'heeellll'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-18. Replace e by ee/eee in hel: t1:e -> t2:ee t4:eee {0+} || ^h_l', function() {
        const grammar = Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                true, false, 0, Infinity, 4);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Copy through
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'eh', t2: 'eh', t4: 'eh'},
            {t1: 'll', t2: 'll', t4: 'll'},
            {t1: 'heh', t2: 'heh', t4: 'heh'},
            {t1: 'hee', t2: 'hee', t4: 'hee'},
            {t1: 'elh', t2: 'elh', t4: 'elh'},
            {t1: 'ell', t2: 'ell', t4: 'ell'},
            {t1: 'lel', t2: 'lel', t4: 'lel'},
            {t1: 'lll', t2: 'lll', t4: 'lll'},
            {t1: 'hhhh', t2: 'hhhh', t4: 'hhhh'},
            {t1: 'hhee', t2: 'hhee', t4: 'hhee'},
            {t1: 'hhel', t2: 'hhel', t4: 'hhel'},
            {t1: 'heel', t2: 'heel', t4: 'heel'},
            {t1: 'eheh', t2: 'eheh', t4: 'eheh'},
            {t1: 'ehee', t2: 'ehee', t4: 'ehee'},
            {t1: 'ehel', t2: 'ehel', t4: 'ehel'},
            {t1: 'ellh', t2: 'ellh', t4: 'ellh'},
            {t1: 'lheh', t2: 'lheh', t4: 'lheh'},
            {t1: 'lhel', t2: 'lhel', t4: 'lhel'},
            {t1: 'lhle', t2: 'lhle', t4: 'lhle'},
            {t1: 'llll', t2: 'llll', t4: 'llll'},
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'heel', t4: 'heeel'},
            {t1: 'helh', t2: 'heelh', t4: 'heeelh'},
            {t1: 'hele', t2: 'heele', t4: 'heeele'},
            {t1: 'hell', t2: 'heell', t4: 'heeell'},
            {t1: 'helhel', t2: 'heelhel', t4: 'heeelhel'},
            {t1: 'helhelh', t2: 'heelhelh', t4: 'heeelhelh'},
            {t1: 'helhele', t2: 'heelhele', t4: 'heeelhele'},
            {t1: 'helhell', t2: 'heelhell', t4: 'heeelhell'},
            {t1: 'helhhel', t2: 'heelhhel', t4: 'heeelhhel'},
            {t1: 'helehel', t2: 'heelehel', t4: 'heeelehel'},
            {t1: 'hellhel', t2: 'heellhel', t4: 'heeellhel'},
            // Invalid Inputs
            {t1: 'hhelh'},
            {t1: 'helhhhhellllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-19. Replace e by ee/eee in hel: t1:e -> t2:ee t4:eee {1+} || h_l$', function() {
        const grammar = Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, true, 1, Infinity, 3);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'heel', t4: 'heeel'},
            {t1: 'hhel', t2: 'hheel', t4: 'hheeel'},
            {t1: 'ehel', t2: 'eheel', t4: 'eheeel'},
            {t1: 'lhel', t2: 'lheel', t4: 'lheeel'},
            {t1: 'hhhel', t2: 'hhheel', t4: 'hhheeel'},
            {t1: 'hehel', t2: 'heheel', t4: 'heheeel'},
            {t1: 'hlhel', t2: 'hlheel', t4: 'hlheeel'},
            {t1: 'ehhel', t2: 'ehheel', t4: 'ehheeel'},
            {t1: 'eehel', t2: 'eeheel', t4: 'eeheeel'},
            {t1: 'elhel', t2: 'elheel', t4: 'elheeel'},
            {t1: 'lhhel', t2: 'lhheel', t4: 'lhheeel'},
            {t1: 'lehel', t2: 'leheel', t4: 'leheeel'},
            {t1: 'llhel', t2: 'llheel', t4: 'llheeel'},
            {t1: 'hhhhel', t2: 'hhhheel', t4: 'hhhheeel'},
            {t1: 'hhehel', t2: 'hheheel', t4: 'hheheeel'},
            {t1: 'hhlhel', t2: 'hhlheel', t4: 'hhlheeel'},
            {t1: 'hehhel', t2: 'hehheel', t4: 'hehheeel'},
            {t1: 'heehel', t2: 'heeheel', t4: 'heeheeel'},
            {t1: 'helhel', t2: 'helheel', t4: 'helheeel'},
            {t1: 'hlhhel', t2: 'hlhheel', t4: 'hlhheeel'},
            {t1: 'hlehel', t2: 'hleheel', t4: 'hleheeel'},
            {t1: 'hllhel', t2: 'hllheel', t4: 'hllheeel'},
            {t1: 'ehhhel', t2: 'ehhheel', t4: 'ehhheeel'},
            {t1: 'ehehel', t2: 'eheheel', t4: 'eheheeel'},
            {t1: 'ehlhel', t2: 'ehlheel', t4: 'ehlheeel'},
            {t1: 'eehhel', t2: 'eehheel', t4: 'eehheeel'},
            {t1: 'eeehel', t2: 'eeeheel', t4: 'eeeheeel'},
            {t1: 'eelhel', t2: 'eelheel', t4: 'eelheeel'},
            {t1: 'elhhel', t2: 'elhheel', t4: 'elhheeel'},
            {t1: 'elehel', t2: 'eleheel', t4: 'eleheeel'},
            {t1: 'ellhel', t2: 'ellheel', t4: 'ellheeel'},
            {t1: 'lhhhel', t2: 'lhhheel', t4: 'lhhheeel'},
            {t1: 'lhehel', t2: 'lheheel', t4: 'lheheeel'},
            {t1: 'lhlhel', t2: 'lhlheel', t4: 'lhlheeel'},
            {t1: 'lehhel', t2: 'lehheel', t4: 'lehheeel'},
            {t1: 'leehel', t2: 'leeheel', t4: 'leeheeel'},
            {t1: 'lelhel', t2: 'lelheel', t4: 'lelheeel'},
            {t1: 'llhhel', t2: 'llhheel', t4: 'llhheeel'},
            {t1: 'llehel', t2: 'lleheel', t4: 'lleheeel'},
            {t1: 'lllhel', t2: 'lllheel', t4: 'lllheeel'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-20. Replace e by ee/eee in hel: t1:e -> t2:ee t4:eee {0+} || h_l$', function() {
        const grammar = Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, true, 0, Infinity, 4);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Copy through
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'eh', t2: 'eh', t4: 'eh'},
            {t1: 'll', t2: 'll', t4: 'll'},
            {t1: 'heh', t2: 'heh', t4: 'heh'},
            {t1: 'hee', t2: 'hee', t4: 'hee'},
            {t1: 'elh', t2: 'elh', t4: 'elh'},
            {t1: 'ell', t2: 'ell', t4: 'ell'},
            {t1: 'lel', t2: 'lel', t4: 'lel'},
            {t1: 'lll', t2: 'lll', t4: 'lll'},
            {t1: 'hhhh', t2: 'hhhh', t4: 'hhhh'},
            {t1: 'hhee', t2: 'hhee', t4: 'hhee'},
            {t1: 'helh', t2: 'helh', t4: 'helh'},
            {t1: 'hele', t2: 'hele', t4: 'hele'},
            {t1: 'hell', t2: 'hell', t4: 'hell'},
            {t1: 'heel', t2: 'heel', t4: 'heel'},
            {t1: 'eheh', t2: 'eheh', t4: 'eheh'},
            {t1: 'ehee', t2: 'ehee', t4: 'ehee'},
            {t1: 'ehll', t2: 'ehll', t4: 'ehll'},
            {t1: 'ellh', t2: 'ellh', t4: 'ellh'},
            {t1: 'lhee', t2: 'lhee', t4: 'lhee'},
            {t1: 'lheh', t2: 'lheh', t4: 'lheh'},
            {t1: 'lhle', t2: 'lhle', t4: 'lhle'},
            {t1: 'llll', t2: 'llll', t4: 'llll'},
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'heel', t4: 'heeel'},
            {t1: 'hhel', t2: 'hheel', t4: 'hheeel'},
            {t1: 'ehel', t2: 'eheel', t4: 'eheeel'},
            {t1: 'lhel', t2: 'lheel', t4: 'lheeel'},
            {t1: 'helhel', t2: 'helheel', t4: 'helheeel'},
            {t1: 'hhelhel', t2: 'hhelheel', t4: 'hhelheeel'},
            {t1: 'ehelhel', t2: 'ehelheel', t4: 'ehelheeel'},
            {t1: 'lhelhel', t2: 'lhelheel', t4: 'lhelheeel'},
            {t1: 'helhhel', t2: 'helhheel', t4: 'helhheeel'},
            {t1: 'helehel', t2: 'heleheel', t4: 'heleheeel'},
            {t1: 'hellhel', t2: 'hellheel', t4: 'hellheeel'},
            // Invalid Inputs
            {t1: 'hhelh'},
            {t1: 'helhhhhellllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to),);
    });

    describe('2-21. Replace e by ee/eee in he: t1:e -> t2:ee t4:eee {0,2} || h_', function() {
        const grammar = Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'he', t2: 'hee', t4: 'heee'},
            {t1: 'heh', t2: 'heeh', t4: 'heeeh'},
            {t1: 'hee', t2: 'heee', t4: 'heeee'},
            {t1: 'hhe', t2: 'hhee', t4: 'hheee'},
            {t1: 'ehe', t2: 'ehee', t4: 'eheee'},
            {t1: 'hheh', t2: 'hheeh', t4: 'hheeeh'},
            {t1: 'hhee', t2: 'hheee', t4: 'hheeee'},
            {t1: 'eheh', t2: 'eheeh', t4: 'eheeeh'},
            {t1: 'ehee', t2: 'eheee', t4: 'eheeee'},
            {t1: 'hehe', t2: 'heehee', t4: 'heeeheee'},
            {t1: 'heheh', t2: 'heeheeh', t4: 'heeeheeeh'},
            {t1: 'hehee', t2: 'heeheee', t4: 'heeeheeee'},
            {t1: 'hehhe', t2: 'heehhee', t4: 'heeehheee'},
            {t1: 'heehe', t2: 'heeehee', t4: 'heeeeheee'},
            {t1: 'hhehe', t2: 'hheehee', t4: 'hheeeheee'},
            {t1: 'ehehe', t2: 'eheehee', t4: 'eheeeheee'},
            {t1: 'hehheh', t2: 'heehheeh', t4: 'heeehheeeh'},
            {t1: 'hehhee', t2: 'heehheee', t4: 'heeehheeee'},
            {t1: 'heeheh', t2: 'heeeheeh', t4: 'heeeeheeeh'},
            {t1: 'heehee', t2: 'heeeheee', t4: 'heeeeheeee'},
            {t1: 'hheheh', t2: 'hheeheeh', t4: 'hheeeheeeh'},
            {t1: 'hhehee', t2: 'hheeheee', t4: 'hheeeheeee'},
            {t1: 'hhehhe', t2: 'hheehhee', t4: 'hheeehheee'},
            {t1: 'hheehe', t2: 'hheeehee', t4: 'hheeeeheee'},
            {t1: 'eheheh', t2: 'eheeheeh', t4: 'eheeeheeeh'},
            {t1: 'ehehee', t2: 'eheeheee', t4: 'eheeeheeee'},
            {t1: 'ehehhe', t2: 'eheehhee', t4: 'eheeehheee'},
            {t1: 'eheehe', t2: 'eheeehee', t4: 'eheeeeheee'},
            {t1: 'hhehheh', t2: 'hheehheeh', t4: 'hheeehheeeh'},
            {t1: 'hhehhee', t2: 'hheehheee', t4: 'hheeehheeee'},
            {t1: 'hheeheh', t2: 'hheeeheeh', t4: 'hheeeeheeeh'},
            {t1: 'hheehee', t2: 'hheeeheee', t4: 'hheeeeheeee'},
            {t1: 'ehehheh', t2: 'eheehheeh', t4: 'eheeehheeeh'},
            {t1: 'ehehhee', t2: 'eheehheee', t4: 'eheeehheeee'},
            {t1: 'eheeheh', t2: 'eheeeheeh', t4: 'eheeeeheeeh'},
            {t1: 'eheehee', t2: 'eheeeheee', t4: 'eheeeeheeee'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-22. Replace e by ee/eee in el: t1:e -> t2:ee t4:eee {0,2} || _l', function() {
        const grammar = Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'el', t2: 'eel', t4: 'eeel'},
            {t1: 'ele', t2: 'eele', t4: 'eeele'},
            {t1: 'ell', t2: 'eell', t4: 'eeell'},
            {t1: 'eel', t2: 'eeel', t4: 'eeeel'},
            {t1: 'lel', t2: 'leel', t4: 'leeel'},
            {t1: 'eele', t2: 'eeele', t4: 'eeeele'},
            {t1: 'eell', t2: 'eeell', t4: 'eeeell'},
            {t1: 'lele', t2: 'leele', t4: 'leeele'},
            {t1: 'lell', t2: 'leell', t4: 'leeell'},
            {t1: 'elel', t2: 'eeleel', t4: 'eeeleeel'},
            {t1: 'elele', t2: 'eeleele', t4: 'eeeleeele'},
            {t1: 'elell', t2: 'eeleell', t4: 'eeeleeell'},
            {t1: 'eleel', t2: 'eeleeel', t4: 'eeeleeeel'},
            {t1: 'ellel', t2: 'eelleel', t4: 'eeelleeel'},
            {t1: 'eelel', t2: 'eeeleel', t4: 'eeeeleeel'},
            {t1: 'lelel', t2: 'leeleel', t4: 'leeeleeel'},
            {t1: 'eleele', t2: 'eeleeele', t4: 'eeeleeeele'},
            {t1: 'eleell', t2: 'eeleeell', t4: 'eeeleeeell'},
            {t1: 'ellele', t2: 'eelleele', t4: 'eeelleeele'},
            {t1: 'ellell', t2: 'eelleell', t4: 'eeelleeell'},
            {t1: 'eelele', t2: 'eeeleele', t4: 'eeeeleeele'},
            {t1: 'eelell', t2: 'eeeleell', t4: 'eeeeleeell'},
            {t1: 'eeleel', t2: 'eeeleeel', t4: 'eeeeleeeel'},
            {t1: 'eellel', t2: 'eeelleel', t4: 'eeeelleeel'},
            {t1: 'lelele', t2: 'leeleele', t4: 'leeeleeele'},
            {t1: 'lelell', t2: 'leeleell', t4: 'leeeleeell'},
            {t1: 'leleel', t2: 'leeleeel', t4: 'leeeleeeel'},
            {t1: 'lellel', t2: 'leelleel', t4: 'leeelleeel'},
            {t1: 'eeleele', t2: 'eeeleeele', t4: 'eeeeleeeele'},
            {t1: 'eeleell', t2: 'eeeleeell', t4: 'eeeeleeeell'},
            {t1: 'eellele', t2: 'eeelleele', t4: 'eeeelleeele'},
            {t1: 'eellell', t2: 'eeelleell', t4: 'eeeelleeell'},
            {t1: 'leleele', t2: 'leeleeele', t4: 'leeeleeeele'},
            {t1: 'leleell', t2: 'leeleeell', t4: 'leeeleeeell'},
            {t1: 'lellele', t2: 'leelleele', t4: 'leeelleeele'},
            {t1: 'lellell', t2: 'leelleell', t4: 'leeelleeell'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-23. Replace e by ee/eee: t1:e -> t2:ee t4:eee {0,2} (vocab hel/hel)', function() {
        const grammar = Seq(Vocab('t1', "hle"), Vocab('t2', "hle"), Vocab('t4', "hle"),
                            Replace(t1("e"), Seq(t2("ee"), t4("eee")),
                                    EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                    false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'e', t2: 'ee', t4: 'eee'},
            {t1: 'eh', t2: 'eeh', t4: 'eeeh'},
            {t1: 'el', t2: 'eel', t4: 'eeel'},
            {t1: 'he', t2: 'hee', t4: 'heee'},
            {t1: 'le', t2: 'lee', t4: 'leee'},
            {t1: 'ee', t2: 'eeee', t4: 'eeeeee'},
            {t1: 'heh', t2: 'heeh', t4: 'heeeh'},
            {t1: 'hel', t2: 'heel', t4: 'heeel'},
            {t1: 'leh', t2: 'leeh', t4: 'leeeh'},
            {t1: 'lel', t2: 'leel', t4: 'leeel'},
            {t1: 'eeh', t2: 'eeeeh', t4: 'eeeeeeh'},
            {t1: 'eel', t2: 'eeeel', t4: 'eeeeeel'},
            {t1: 'ehe', t2: 'eehee', t4: 'eeeheee'},
            {t1: 'ele', t2: 'eelee', t4: 'eeeleee'},
            {t1: 'hee', t2: 'heeee', t4: 'heeeeee'},
            {t1: 'lee', t2: 'leeee', t4: 'leeeeee'},
            {t1: 'eheh', t2: 'eeheeh', t4: 'eeeheeeh'},
            {t1: 'ehel', t2: 'eeheel', t4: 'eeeheeel'},
            {t1: 'eleh', t2: 'eeleeh', t4: 'eeeleeeh'},
            {t1: 'elel', t2: 'eeleel', t4: 'eeeleeel'},
            {t1: 'heeh', t2: 'heeeeh', t4: 'heeeeeeh'},
            {t1: 'heel', t2: 'heeeel', t4: 'heeeeeel'},
            {t1: 'hehe', t2: 'heehee', t4: 'heeeheee'},
            {t1: 'hele', t2: 'heelee', t4: 'heeeleee'},
            {t1: 'leeh', t2: 'leeeeh', t4: 'leeeeeeh'},
            {t1: 'leel', t2: 'leeeel', t4: 'leeeeeel'},
            {t1: 'lehe', t2: 'leehee', t4: 'leeeheee'},
            {t1: 'lele', t2: 'leelee', t4: 'leeeleee'},
            {t1: 'heheh', t2: 'heeheeh', t4: 'heeeheeeh'},
            {t1: 'hehel', t2: 'heeheel', t4: 'heeeheeel'},
            {t1: 'heleh', t2: 'heeleeh', t4: 'heeeleeeh'},
            {t1: 'helel', t2: 'heeleel', t4: 'heeeleeel'},
            {t1: 'leheh', t2: 'leeheeh', t4: 'leeeheeeh'},
            {t1: 'lehel', t2: 'leeheel', t4: 'leeeheeel'},
            {t1: 'leleh', t2: 'leeleeh', t4: 'leeeleeeh'},
            {t1: 'lelel', t2: 'leeleel', t4: 'leeeleeel'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-24. Replace ee by e/e in heel: t1:ee -> t2:e t4:e {0,2} || h_l', function() {
        const grammar = Replace(t1("ee"), Seq(t2("e"), t4("e")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'heel', t2: 'hel', t4: 'hel'},
            {t1: 'heelh', t2: 'helh', t4: 'helh'},
            {t1: 'heele', t2: 'hele', t4: 'hele'},
            {t1: 'heell', t2: 'hell', t4: 'hell'},
            {t1: 'hheel', t2: 'hhel', t4: 'hhel'},
            {t1: 'eheel', t2: 'ehel', t4: 'ehel'},
            {t1: 'lheel', t2: 'lhel', t4: 'lhel'},
            {t1: 'hheelh', t2: 'hhelh', t4: 'hhelh'},
            {t1: 'hheele', t2: 'hhele', t4: 'hhele'},
            {t1: 'hheell', t2: 'hhell', t4: 'hhell'},
            {t1: 'eheelh', t2: 'ehelh', t4: 'ehelh'},
            {t1: 'eheele', t2: 'ehele', t4: 'ehele'},
            {t1: 'eheell', t2: 'ehell', t4: 'ehell'},
            {t1: 'lheelh', t2: 'lhelh', t4: 'lhelh'},
            {t1: 'lheele', t2: 'lhele', t4: 'lhele'},
            {t1: 'lheell', t2: 'lhell', t4: 'lhell'},
            {t1: 'heelheel', t2: 'helhel', t4: 'helhel'},
            {t1: 'heelheelh', t2: 'helhelh', t4: 'helhelh'},
            {t1: 'heelheele', t2: 'helhele', t4: 'helhele'},
            {t1: 'heelheell', t2: 'helhell', t4: 'helhell'},
            {t1: 'heelhheel', t2: 'helhhel', t4: 'helhhel'},
            {t1: 'heeleheel', t2: 'helehel', t4: 'helehel'},
            {t1: 'heellheel', t2: 'hellhel', t4: 'hellhel'},
            {t1: 'hheelheel', t2: 'hhelhel', t4: 'hhelhel'},
            {t1: 'eheelheel', t2: 'ehelhel', t4: 'ehelhel'},
            {t1: 'lheelheel', t2: 'lhelhel', t4: 'lhelhel'},
            {t1: 'heelhheelh', t2: 'helhhelh', t4: 'helhhelh'},
            {t1: 'heelhheele', t2: 'helhhele', t4: 'helhhele'},
            {t1: 'heelhheell', t2: 'helhhell', t4: 'helhhell'},
            {t1: 'heeleheelh', t2: 'helehelh', t4: 'helehelh'},
            {t1: 'heeleheele', t2: 'helehele', t4: 'helehele'},
            {t1: 'heeleheell', t2: 'helehell', t4: 'helehell'},
            {t1: 'heellheelh', t2: 'hellhelh', t4: 'hellhelh'},
            {t1: 'heellheele', t2: 'hellhele', t4: 'hellhele'},
            {t1: 'heellheell', t2: 'hellhell', t4: 'hellhell'},
            {t1: 'hheelheelh', t2: 'hhelhelh', t4: 'hhelhelh'},
            {t1: 'hheelheele', t2: 'hhelhele', t4: 'hhelhele'},
            {t1: 'hheelheell', t2: 'hhelhell', t4: 'hhelhell'},
            {t1: 'hheelhheel', t2: 'hhelhhel', t4: 'hhelhhel'},
            {t1: 'hheeleheel', t2: 'hhelehel', t4: 'hhelehel'},
            {t1: 'hheellheel', t2: 'hhellhel', t4: 'hhellhel'},
            {t1: 'eheelheelh', t2: 'ehelhelh', t4: 'ehelhelh'},
            {t1: 'eheelheele', t2: 'ehelhele', t4: 'ehelhele'},
            {t1: 'eheelheell', t2: 'ehelhell', t4: 'ehelhell'},
            {t1: 'eheelhheel', t2: 'ehelhhel', t4: 'ehelhhel'},
            {t1: 'eheeleheel', t2: 'ehelehel', t4: 'ehelehel'},
            {t1: 'eheellheel', t2: 'ehellhel', t4: 'ehellhel'},
            {t1: 'lheelheelh', t2: 'lhelhelh', t4: 'lhelhelh'},
            {t1: 'lheelheele', t2: 'lhelhele', t4: 'lhelhele'},
            {t1: 'lheelheell', t2: 'lhelhell', t4: 'lhelhell'},
            {t1: 'lheelhheel', t2: 'lhelhhel', t4: 'lhelhhel'},
            {t1: 'lheeleheel', t2: 'lhelehel', t4: 'lhelehel'},
            {t1: 'lheellheel', t2: 'lhellhel', t4: 'lhellhel'},
            {t1: 'hheelhheelh', t2: 'hhelhhelh', t4: 'hhelhhelh'},
            {t1: 'hheelhheele', t2: 'hhelhhele', t4: 'hhelhhele'},
            {t1: 'hheelhheell', t2: 'hhelhhell', t4: 'hhelhhell'},
            {t1: 'hheeleheelh', t2: 'hhelehelh', t4: 'hhelehelh'},
            {t1: 'hheeleheele', t2: 'hhelehele', t4: 'hhelehele'},
            {t1: 'hheeleheell', t2: 'hhelehell', t4: 'hhelehell'},
            {t1: 'hheellheelh', t2: 'hhellhelh', t4: 'hhellhelh'},
            {t1: 'hheellheele', t2: 'hhellhele', t4: 'hhellhele'},
            {t1: 'hheellheell', t2: 'hhellhell', t4: 'hhellhell'},
            {t1: 'eheelhheelh', t2: 'ehelhhelh', t4: 'ehelhhelh'},
            {t1: 'eheelhheele', t2: 'ehelhhele', t4: 'ehelhhele'},
            {t1: 'eheelhheell', t2: 'ehelhhell', t4: 'ehelhhell'},
            {t1: 'eheeleheelh', t2: 'ehelehelh', t4: 'ehelehelh'},
            {t1: 'eheeleheele', t2: 'ehelehele', t4: 'ehelehele'},
            {t1: 'eheeleheell', t2: 'ehelehell', t4: 'ehelehell'},
            {t1: 'eheellheelh', t2: 'ehellhelh', t4: 'ehellhelh'},
            {t1: 'eheellheele', t2: 'ehellhele', t4: 'ehellhele'},
            {t1: 'eheellheell', t2: 'ehellhell', t4: 'ehellhell'},
            {t1: 'lheelhheelh', t2: 'lhelhhelh', t4: 'lhelhhelh'},
            {t1: 'lheelhheele', t2: 'lhelhhele', t4: 'lhelhhele'},
            {t1: 'lheelhheell', t2: 'lhelhhell', t4: 'lhelhhell'},
            {t1: 'lheeleheelh', t2: 'lhelehelh', t4: 'lhelehelh'},
            {t1: 'lheeleheele', t2: 'lhelehele', t4: 'lhelehele'},
            {t1: 'lheeleheell', t2: 'lhelehell', t4: 'lhelehell'},
            {t1: 'lheellheelh', t2: 'lhellhelh', t4: 'lhellhelh'},
            {t1: 'lheellheele', t2: 'lhellhele', t4: 'lhellhele'},
            {t1: 'lheellheell', t2: 'lhellhell', t4: 'lhellhell'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-25. Replace ee by e/e in hee: t1:ee -> t2:e t4:e {0,2} || h_', function() {
        const grammar = Replace(t1("ee"), Seq(t2("e"), t4("e")),
                                t1("h"), EMPTY_CONTEXT, EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'hee', t2: 'he', t4: 'he'},
            {t1: 'heeh', t2: 'heh', t4: 'heh'},
            {t1: 'heee', t2: 'hee', t4: 'hee'},
            {t1: 'hhee', t2: 'hhe', t4: 'hhe'},
            {t1: 'ehee', t2: 'ehe', t4: 'ehe'},
            {t1: 'hheeh', t2: 'hheh', t4: 'hheh'},
            {t1: 'hheee', t2: 'hhee', t4: 'hhee'},
            {t1: 'eheeh', t2: 'eheh', t4: 'eheh'},
            {t1: 'eheee', t2: 'ehee', t4: 'ehee'},
            {t1: 'heehee', t2: 'hehe', t4: 'hehe'},
            {t1: 'heeheeh', t2: 'heheh', t4: 'heheh'},
            {t1: 'heeheee', t2: 'hehee', t4: 'hehee'},
            {t1: 'heehhee', t2: 'hehhe', t4: 'hehhe'},
            {t1: 'heeehee', t2: 'heehe', t4: 'heehe'},
            {t1: 'hheehee', t2: 'hhehe', t4: 'hhehe'},
            {t1: 'eheehee', t2: 'ehehe', t4: 'ehehe'},
            {t1: 'heehheeh', t2: 'hehheh', t4: 'hehheh'},
            {t1: 'heehheee', t2: 'hehhee', t4: 'hehhee'},
            {t1: 'heeeheeh', t2: 'heeheh', t4: 'heeheh'},
            {t1: 'heeeheee', t2: 'heehee', t4: 'heehee'},
            {t1: 'hheeheeh', t2: 'hheheh', t4: 'hheheh'},
            {t1: 'hheeheee', t2: 'hhehee', t4: 'hhehee'},
            {t1: 'hheehhee', t2: 'hhehhe', t4: 'hhehhe'},
            {t1: 'hheeehee', t2: 'hheehe', t4: 'hheehe'},
            {t1: 'eheeheeh', t2: 'eheheh', t4: 'eheheh'},
            {t1: 'eheeheee', t2: 'ehehee', t4: 'ehehee'},
            {t1: 'eheehhee', t2: 'ehehhe', t4: 'ehehhe'},
            {t1: 'eheeehee', t2: 'eheehe', t4: 'eheehe'},
            {t1: 'hheehheeh', t2: 'hhehheh', t4: 'hhehheh'},
            {t1: 'hheehheee', t2: 'hhehhee', t4: 'hhehhee'},
            {t1: 'hheeeheeh', t2: 'hheeheh', t4: 'hheeheh'},
            {t1: 'hheeeheee', t2: 'hheehee', t4: 'hheehee'},
            {t1: 'eheehheeh', t2: 'ehehheh', t4: 'ehehheh'},
            {t1: 'eheehheee', t2: 'ehehhee', t4: 'ehehhee'},
            {t1: 'eheeeheeh', t2: 'eheeheh', t4: 'eheeheh'},
            {t1: 'eheeeheee', t2: 'eheehee', t4: 'eheehee'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-26. Replace ee by e in eel: t1:ee -> t2:e t4:e {0,2} || _l', function() {
        const grammar = Replace(t1("ee"), Seq(t2("e"), t4("e")),
                                EMPTY_CONTEXT, t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'eel', t2: 'el', t4: 'el'},
            {t1: 'eeel', t2: 'eel', t4: 'eel'},
            {t1: 'eele', t2: 'ele', t4: 'ele'},
            {t1: 'eell', t2: 'ell', t4: 'ell'},
            {t1: 'leel', t2: 'lel', t4: 'lel'},
            {t1: 'eeele', t2: 'eele', t4: 'eele'},
            {t1: 'eeell', t2: 'eell', t4: 'eell'},
            {t1: 'leele', t2: 'lele', t4: 'lele'},
            {t1: 'leell', t2: 'lell', t4: 'lell'},
            {t1: 'eeleel', t2: 'elel', t4: 'elel'},
            {t1: 'eeeleel', t2: 'eelel', t4: 'eelel'},
            {t1: 'eeleeel', t2: 'eleel', t4: 'eleel'},
            {t1: 'eeleele', t2: 'elele', t4: 'elele'},
            {t1: 'eeleell', t2: 'elell', t4: 'elell'},
            {t1: 'eelleel', t2: 'ellel', t4: 'ellel'},
            {t1: 'leeleel', t2: 'lelel', t4: 'lelel'},
            {t1: 'eeeleeel', t2: 'eeleel', t4: 'eeleel'},
            {t1: 'eeeleele', t2: 'eelele', t4: 'eelele'},
            {t1: 'eeeleell', t2: 'eelell', t4: 'eelell'},
            {t1: 'eeelleel', t2: 'eellel', t4: 'eellel'},
            {t1: 'eeleeele', t2: 'eleele', t4: 'eleele'},
            {t1: 'eeleeell', t2: 'eleell', t4: 'eleell'},
            {t1: 'eelleele', t2: 'ellele', t4: 'ellele'},
            {t1: 'eelleell', t2: 'ellell', t4: 'ellell'},
            {t1: 'leeleeel', t2: 'leleel', t4: 'leleel'},
            {t1: 'leeleele', t2: 'lelele', t4: 'lelele'},
            {t1: 'leeleell', t2: 'lelell', t4: 'lelell'},
            {t1: 'leelleel', t2: 'lellel', t4: 'lellel'},
            {t1: 'eeeleeele', t2: 'eeleele', t4: 'eeleele'},
            {t1: 'eeeleeell', t2: 'eeleell', t4: 'eeleell'},
            {t1: 'eeelleele', t2: 'eellele', t4: 'eellele'},
            {t1: 'eeelleell', t2: 'eellell', t4: 'eellell'},
            {t1: 'leeleeele', t2: 'leleele', t4: 'leleele'},
            {t1: 'leeleeell', t2: 'leleell', t4: 'leleell'},
            {t1: 'leelleele', t2: 'lellele', t4: 'lellele'},
            {t1: 'leelleell', t2: 'lellell', t4: 'lellell'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-27. Replace ee by e/e: t1:ee -> t2:e t4:e {0,2} (vocab hel/hel)', function() {
        const grammar = Seq(Vocab('t1', "hle"), Vocab('t2', "hle"), Vocab('t4', "hle"),
                            Replace(t1("ee"), Seq(t2("e"), t4("e")),
                                    EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                    false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'e', t4: 'e'},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'ee', t2: 'e', t4: 'e'},
            {t1: 'eee', t2: 'ee', t4: 'ee'},
            {t1: 'eeh', t2: 'eh', t4: 'eh'},
            {t1: 'eel', t2: 'el', t4: 'el'},
            {t1: 'hee', t2: 'he', t4: 'he'},
            {t1: 'lee', t2: 'le', t4: 'le'},
            {t1: 'eeee', t2: 'ee', t4: 'ee'},
            {t1: 'eeee', t2: 'eee', t4: 'eee'},
            {t1: 'eeeh', t2: 'eeh', t4: 'eeh'},
            {t1: 'eeel', t2: 'eel', t4: 'eel'},
            {t1: 'heee', t2: 'hee', t4: 'hee'},
            {t1: 'heeh', t2: 'heh', t4: 'heh'},
            {t1: 'heel', t2: 'hel', t4: 'hel'},
            {t1: 'leee', t2: 'lee', t4: 'lee'},
            {t1: 'leeh', t2: 'leh', t4: 'leh'},
            {t1: 'leel', t2: 'lel', t4: 'lel'},
            {t1: 'eeeee', t2: 'eee', t4: 'eee'},
            {t1: 'eeeeh', t2: 'eeh', t4: 'eeh'},
            {t1: 'eeeel', t2: 'eel', t4: 'eel'},
            {t1: 'eehee', t2: 'ehe', t4: 'ehe'},
            {t1: 'eelee', t2: 'ele', t4: 'ele'},
            {t1: 'heeee', t2: 'hee', t4: 'hee'},
            {t1: 'leeee', t2: 'lee', t4: 'lee'},
            {t1: 'eeeeee', t2: 'eeee', t4: 'eeee'},
            {t1: 'eeeeeh', t2: 'eeeh', t4: 'eeeh'},
            {t1: 'eeeeel', t2: 'eeel', t4: 'eeel'},
            {t1: 'eeehee', t2: 'eehe', t4: 'eehe'},
            {t1: 'eeelee', t2: 'eele', t4: 'eele'},
            {t1: 'eeheee', t2: 'ehee', t4: 'ehee'},
            {t1: 'eeheeh', t2: 'eheh', t4: 'eheh'},
            {t1: 'eeheel', t2: 'ehel', t4: 'ehel'},
            {t1: 'eeleee', t2: 'elee', t4: 'elee'},
            {t1: 'eeleeh', t2: 'eleh', t4: 'eleh'},
            {t1: 'eeleel', t2: 'elel', t4: 'elel'},
            {t1: 'heeeee', t2: 'heee', t4: 'heee'},
            {t1: 'heeeeh', t2: 'heeh', t4: 'heeh'},
            {t1: 'heeeel', t2: 'heel', t4: 'heel'},
            {t1: 'heehee', t2: 'hehe', t4: 'hehe'},
            {t1: 'heelee', t2: 'hele', t4: 'hele'},
            {t1: 'leeeee', t2: 'leee', t4: 'leee'},
            {t1: 'leeeeh', t2: 'leeh', t4: 'leeh'},
            {t1: 'leeeel', t2: 'leel', t4: 'leel'},
            {t1: 'leehee', t2: 'lehe', t4: 'lehe'},
            {t1: 'leelee', t2: 'lele', t4: 'lele'},
            {t1: 'eeeeeee', t2: 'eeeee', t4: 'eeeee'},
            {t1: 'eeeeeeh', t2: 'eeeeh', t4: 'eeeeh'},
            {t1: 'eeeeeel', t2: 'eeeel', t4: 'eeeel'},
            {t1: 'eeeheee', t2: 'eehee', t4: 'eehee'},
            {t1: 'eeeheeh', t2: 'eeheh', t4: 'eeheh'},
            {t1: 'eeeheel', t2: 'eehel', t4: 'eehel'},
            {t1: 'eeeleee', t2: 'eelee', t4: 'eelee'},
            {t1: 'eeeleeh', t2: 'eeleh', t4: 'eeleh'},
            {t1: 'eeeleel', t2: 'eelel', t4: 'eelel'},
            {t1: 'heeeeee', t2: 'heeee', t4: 'heeee'},
            {t1: 'heeeeeh', t2: 'heeeh', t4: 'heeeh'},
            {t1: 'heeeeel', t2: 'heeel', t4: 'heeel'},
            {t1: 'heeheee', t2: 'hehee', t4: 'hehee'},
            {t1: 'heeheeh', t2: 'heheh', t4: 'heheh'},
            {t1: 'heeheel', t2: 'hehel', t4: 'hehel'},
            {t1: 'heeleee', t2: 'helee', t4: 'helee'},
            {t1: 'heeleeh', t2: 'heleh', t4: 'heleh'},
            {t1: 'heeleel', t2: 'helel', t4: 'helel'},
            {t1: 'leeeeee', t2: 'leeee', t4: 'leeee'},
            {t1: 'leeeeeh', t2: 'leeeh', t4: 'leeeh'},
            {t1: 'leeeeel', t2: 'leeel', t4: 'leeel'},
            {t1: 'leeheee', t2: 'lehee', t4: 'lehee'},
            {t1: 'leeheeh', t2: 'leheh', t4: 'leheh'},
            {t1: 'leeheel', t2: 'lehel', t4: 'lehel'},
            {t1: 'leeleee', t2: 'lelee', t4: 'lelee'},
            {t1: 'leeleeh', t2: 'leleh', t4: 'leleh'},
            {t1: 'leeleel', t2: 'lelel', t4: 'lelel'},
        ];
        testGrammar(grammar, expectedResults,
                    DEFAULT, DEFAULT, DEFAULT, DEFAULT, WARN_ONLY_FOR_TOO_MANY_OUTPUTS);
    });

    describe('2-28. Insert a/e in h_l: t1:0 -> t2:a t4:e {0,2} || h_l', function() {
        const grammar = Replace(t1(""), Seq(t2("a"), t4("e")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 3, t4: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hl', t2: 'hal', t4: 'hel'},
            {t1: 'hlh', t2: 'halh', t4: 'helh'},
            {t1: 'hll', t2: 'hall', t4: 'hell'},
            {t1: 'hhl', t2: 'hhal', t4: 'hhel'},
            {t1: 'lhl', t2: 'lhal', t4: 'lhel'},
            {t1: 'hhlh', t2: 'hhalh', t4: 'hhelh'},
            {t1: 'hhll', t2: 'hhall', t4: 'hhell'},
            {t1: 'lhlh', t2: 'lhalh', t4: 'lhelh'},
            {t1: 'lhll', t2: 'lhall', t4: 'lhell'},
            {t1: 'hlhl', t2: 'halhal', t4: 'helhel'},
            {t1: 'hlhlh', t2: 'halhalh', t4: 'helhelh'},
            {t1: 'hlhll', t2: 'halhall', t4: 'helhell'},
            {t1: 'hlhhl', t2: 'halhhal', t4: 'helhhel'},
            {t1: 'hllhl', t2: 'hallhal', t4: 'hellhel'},
            {t1: 'hhlhl', t2: 'hhalhal', t4: 'hhelhel'},
            {t1: 'lhlhl', t2: 'lhalhal', t4: 'lhelhel'},
            {t1: 'hlhhlh', t2: 'halhhalh', t4: 'helhhelh'},
            {t1: 'hlhhll', t2: 'halhhall', t4: 'helhhell'},
            {t1: 'hllhlh', t2: 'hallhalh', t4: 'hellhelh'},
            {t1: 'hllhll', t2: 'hallhall', t4: 'hellhell'},
            {t1: 'hhlhlh', t2: 'hhalhalh', t4: 'hhelhelh'},
            {t1: 'hhlhll', t2: 'hhalhall', t4: 'hhelhell'},
            {t1: 'hhlhhl', t2: 'hhalhhal', t4: 'hhelhhel'},
            {t1: 'hhllhl', t2: 'hhallhal', t4: 'hhellhel'},
            {t1: 'lhlhlh', t2: 'lhalhalh', t4: 'lhelhelh'},
            {t1: 'lhlhll', t2: 'lhalhall', t4: 'lhelhell'},
            {t1: 'lhlhhl', t2: 'lhalhhal', t4: 'lhelhhel'},
            {t1: 'lhllhl', t2: 'lhallhal', t4: 'lhellhel'},
            {t1: 'hhlhhlh', t2: 'hhalhhalh', t4: 'hhelhhelh'},
            {t1: 'hhlhhll', t2: 'hhalhhall', t4: 'hhelhhell'},
            {t1: 'hhllhlh', t2: 'hhallhalh', t4: 'hhellhelh'},
            {t1: 'hhllhll', t2: 'hhallhall', t4: 'hhellhell'},
            {t1: 'lhlhhlh', t2: 'lhalhhalh', t4: 'lhelhhelh'},
            {t1: 'lhlhhll', t2: 'lhalhhall', t4: 'lhelhhell'},
            {t1: 'lhllhlh', t2: 'lhallhalh', t4: 'lhellhelh'},
            {t1: 'lhllhll', t2: 'lhallhall', t4: 'lhellhell'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-29. Delete e in hel: t1:e -> t2:0 t4:0 {0,2} || h_l', function() {
        const grammar = Replace(t1("e"), Seq(t2(""), t4("")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 2, t4: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hel', t2: 'hl', t4: 'hl'},
            {t1: 'helh', t2: 'hlh', t4: 'hlh'},
            {t1: 'hell', t2: 'hll', t4: 'hll'},
            {t1: 'hhel', t2: 'hhl', t4: 'hhl'},
            {t1: 'lhel', t2: 'lhl', t4: 'lhl'},
            {t1: 'hhelh', t2: 'hhlh', t4: 'hhlh'},
            {t1: 'hhell', t2: 'hhll', t4: 'hhll'},
            {t1: 'lhelh', t2: 'lhlh', t4: 'lhlh'},
            {t1: 'lhell', t2: 'lhll', t4: 'lhll'},
            {t1: 'helhel', t2: 'hlhl', t4: 'hlhl'},
            {t1: 'helhelh', t2: 'hlhlh', t4: 'hlhlh'},
            {t1: 'helhell', t2: 'hlhll', t4: 'hlhll'},
            {t1: 'helhhel', t2: 'hlhhl', t4: 'hlhhl'},
            {t1: 'hellhel', t2: 'hllhl', t4: 'hllhl'},
            {t1: 'hhelhel', t2: 'hhlhl', t4: 'hhlhl'},
            {t1: 'lhelhel', t2: 'lhlhl', t4: 'lhlhl'},
            {t1: 'helhhelh', t2: 'hlhhlh', t4: 'hlhhlh'},
            {t1: 'helhhell', t2: 'hlhhll', t4: 'hlhhll'},
            {t1: 'hellhelh', t2: 'hllhlh', t4: 'hllhlh'},
            {t1: 'hellhell', t2: 'hllhll', t4: 'hllhll'},
            {t1: 'hhelhelh', t2: 'hhlhlh', t4: 'hhlhlh'},
            {t1: 'hhelhell', t2: 'hhlhll', t4: 'hhlhll'},
            {t1: 'hhelhhel', t2: 'hhlhhl', t4: 'hhlhhl'},
            {t1: 'hhellhel', t2: 'hhllhl', t4: 'hhllhl'},
            {t1: 'lhelhelh', t2: 'lhlhlh', t4: 'lhlhlh'},
            {t1: 'lhelhell', t2: 'lhlhll', t4: 'lhlhll'},
            {t1: 'lhelhhel', t2: 'lhlhhl', t4: 'lhlhhl'},
            {t1: 'lhellhel', t2: 'lhllhl', t4: 'lhllhl'},
            {t1: 'hhelhhelh', t2: 'hhlhhlh', t4: 'hhlhhlh'},
            {t1: 'hhelhhell', t2: 'hhlhhll', t4: 'hhlhhll'},
            {t1: 'hhellhelh', t2: 'hhllhlh', t4: 'hhllhlh'},
            {t1: 'hhellhell', t2: 'hhllhll', t4: 'hhllhll'},
            {t1: 'lhelhhelh', t2: 'lhlhhlh', t4: 'lhlhhlh'},
            {t1: 'lhelhhell', t2: 'lhlhhll', t4: 'lhlhhll'},
            {t1: 'lhellhelh', t2: 'lhllhlh', t4: 'lhllhlh'},
            {t1: 'lhellhell', t2: 'lhllhll', t4: 'lhllhll'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-30a. Replace e by a/aa in hel and hey: t1:e -> t2:a t4:aa {0,2} || h_l|y', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), Uni(t1("l"), t1("y")), EMPTY_CONTEXT,
                                false, false, 0, 2, 5);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const from_to: StringDict[] = [
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll'},
            {t1: 'hey', t2: 'hay', t4: 'haay'},
            {t1: 'hhey', t2: 'hhay', t4: 'hhaay'},
            {t1: 'hheyy', t2: 'hhayy', t4: 'hhaayy'},
            {t1: 'hlhheyyyyy', t2: 'hlhhayyyyy', t4: 'hlhhaayyyyy'},
            {t1: 'helhel', t2: 'halhal', t4: 'haalhaal'},
            {t1: 'heyhey', t2: 'hayhay', t4: 'haayhaay'},
            {t1: 'helhey', t2: 'halhay', t4: 'haalhaay'},
            {t1: 'heh'},
            {t1: 'lel'},
            {t1: 'hele'},
            {t1: 'ehey'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-30b. Replace e by a/i in hel and yel: t1:e -> t2:a t4:i {0,2} || h|y_l', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("i")), Uni(t1("h"),
                                t1("y")), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 5);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const from_to: StringDict[] = [
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hel', t2: 'hal', t4: 'hil'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhil'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhill'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhilllll'},
            {t1: 'yel', t2: 'yal', t4: 'yil'},
            {t1: 'yyel', t2: 'yyal', t4: 'yyil'},
            {t1: 'yyell', t2: 'yyall', t4: 'yyill'},
            {t1: 'ylyyelllll', t2: 'ylyyalllll', t4: 'ylyyilllll'},
            {t1: 'helhel', t2: 'halhal', t4: 'hilhil'},
            {t1: 'yelyel', t2: 'yalyal', t4: 'yilyil'},
            {t1: 'helyel', t2: 'halyal', t4: 'hilyil'},
            {t1: 'heh'},
            {t1: 'lel'},
            {t1: 'hele'},
            {t1: 'eyel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-30c. Replace e by a/i in hel and hey: t1:e -> t2:a t4:i {0,2} || h_(.&~h)', function() {
        const grammar = Seq(Vocab('t1','hlye'), Vocab('t2','hlya'), Vocab('t4','hlyi'),
                            Replace(t1("e"), Seq(t2("a"), t4("i")),
                                    t1("h"),
                                    Intersect(Any("t1"), Not(t1("h"))),
                                    EMPTY_CONTEXT,
                                    false, false, 0, 2, 5));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const from_to: StringDict[] = [
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hel', t2: 'hal', t4: 'hil'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhil'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhill'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhilllll'},
            {t1: 'hey', t2: 'hay', t4: 'hiy'},
            {t1: 'hhey', t2: 'hhay', t4: 'hhiy'},
            {t1: 'hheyy', t2: 'hhayy', t4: 'hhiyy'},
            {t1: 'hlhheyyyyy', t2: 'hlhhayyyyy', t4: 'hlhhiyyyyy'},
            {t1: 'helhel', t2: 'halhal', t4: 'hilhil'},
            {t1: 'heyhey', t2: 'hayhay', t4: 'hiyhiy'},
            {t1: 'helhey', t2: 'halhay', t4: 'hilhiy'},
            {t1: 'heh'},
            {t1: 'lel'},
            {t1: 'hele'},
            {t1: 'ehey'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-30d. Replace e by a/i in hel and yel: t1:e -> t2:a t4:i {0,2} || (.&~l)_l', function() {
        const grammar = Seq(Vocab('t1','hlye'), Vocab('t2','hlya'), Vocab('t4','hlyi'),
                            Replace(t1("e"), Seq(t2("a"), t4("i")),
                                    Intersect(Any("t1"), Not(t1("l"))),
                                    t1("l"),
                                    EMPTY_CONTEXT,
                                    false, false, 0, 2, 5));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 4, t4: 4});
        const from_to: StringDict[] = [
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hel', t2: 'hal', t4: 'hil'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhil'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhill'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhilllll'},
            {t1: 'yel', t2: 'yal', t4: 'yil'},
            {t1: 'yyel', t2: 'yyal', t4: 'yyil'},
            {t1: 'yyell', t2: 'yyall', t4: 'yyill'},
            {t1: 'ylyyelllll', t2: 'ylyyalllll', t4: 'ylyyilllll'},
            {t1: 'helhel', t2: 'halhal', t4: 'hilhil'},
            {t1: 'yelyel', t2: 'yalyal', t4: 'yilyil'},
            {t1: 'helyel', t2: 'halyal', t4: 'hilyil'},
            {t1: 'heh'},
            {t1: 'lel'},
            {t1: 'hele'},
            {t1: 'eyel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-30e. Replace e or o by a/i in hel and hol: t1:e|t1:o -> t2:a t4:i {0,2} || h_l', function() {
        const grammar = Replace(Uni(t1("e"), t1("o")), Seq(t2("a"), t4("i")),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 2, 5);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 4, t2: 3, t4: 3});
        const from_to: StringDict[] = [
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hel', t2: 'hal', t4: 'hil'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhil'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhill'},
            {t1: 'hol', t2: 'hal', t4: 'hil'},
            {t1: 'hhol', t2: 'hhal', t4: 'hhil'},
            {t1: 'hholl', t2: 'hhall', t4: 'hhill'},
            {t1: 'helhel', t2: 'halhal', t4: 'hilhil'},
            {t1: 'helhol', t2: 'halhal', t4: 'hilhil'},
            {t1: 'holhol', t2: 'halhal', t4: 'hilhil'},
            {t1: 'heh'},
            {t1: 'lel'},
            {t1: 'helo'},
            {t1: 'hole'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });
    
    describe('2-30f. Replace e by a/i or o/o in hel: t1:e -> t2:a t4:i | t2:o t4:o {0,1} || h_l', function() {
        const grammar = Replace(t1("e"), Uni(Seq(t2("a"), t4("i")), Seq(t2("o"), t4("o"))),
                                t1("h"), t1("l"), EMPTY_CONTEXT,
                                false, false, 0, 1, 1);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 4, t4: 4});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'l', t2: 'l', t4: 'l'},
            {t1: 'hel', t2: 'hol', t4: 'hol'},
            {t1: 'hel', t2: 'hal', t4: 'hil'},
            {t1: 'hell', t2: 'holl', t4: 'holl'},
            {t1: 'hell', t2: 'hall', t4: 'hill'},
            {t1: 'helh', t2: 'holh', t4: 'holh'},
            {t1: 'helh', t2: 'halh', t4: 'hilh'},
            {t1: 'hhel', t2: 'hhol', t4: 'hhol'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhil'},
            {t1: 'hhell', t2: 'hholl', t4: 'hholl'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhill'},
            {t1: 'hhelh', t2: 'hholh', t4: 'hholh'},
            {t1: 'hhelh', t2: 'hhalh', t4: 'hhilh'},
            {t1: 'lhel', t2: 'lhol', t4: 'lhol'},
            {t1: 'lhel', t2: 'lhal', t4: 'lhil'},
            {t1: 'lhell', t2: 'lholl', t4: 'lholl'},
            {t1: 'lhell', t2: 'lhall', t4: 'lhill'},
            {t1: 'lhelh', t2: 'lholh', t4: 'lholh'},
            {t1: 'lhelh', t2: 'lhalh', t4: 'lhilh'}
        ];
        testGrammar(grammar, expectedResults);
    });

    // Here, we tell Replace to treat the vocabs as if the fromTape vocab is a
    // subset of the toTape vocab.
    describe('2-31. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {0,3} || t1:h_l (vocab hel/ehal)', function() {
        const grammar = Seq(Vocab("t2", "hlae"), Vocab("t4", "hlae"),
                            Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                    t1("h"), t1("l"), EMPTY_CONTEXT,
                                    false, false, 0, 3, 4, 4, true));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 4, t4: 4});
        const from_to: StringDict[] = [
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'lhhelhl', t2: 'lhhalhl', t4: 'lhhaalhl'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll'},
            {t1: 'lhellhhel', t2: 'lhallhhal', t4: 'lhaallhhaal'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal', t4: 'lhaalhhllhaal'},
            {t1: 'helhelhel', t2: 'halhalhal', t4: 'haalhaalhaal'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall', t4: 'lhaalhaalhhlhaall'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhallhhalhlhallh', t4: 'hlhaallhhaalhlhaallh'},
            // Invalid Inputs
            {t1: 'helhhhhllllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    // Here, we let Replace figure out that the fromTape vocab is a subset of the
    // toTape vocab, but we have ensured that Replace sees it as such.
    describe('2-32. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {0,3} || t1:h_l (vocab hel/ehal)', function() {
        const grammar = Seq(Vocab("t2", "hlae"), Vocab("t4", "hlae"),
                            Replace(t1("e"),
                                    Seq(t2("a"), t4("aa"),
                                        Vocab("t2", "hlae"), Vocab("t4", "hlae")), 
                                    t1("h"), t1("l"), EMPTY_CONTEXT,
                                    false, false, 0, 3, 4, 4, false));
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 4, t4: 4});
        const from_to: StringDict[] = [
            {t1: 'hel', t2: 'hal', t4: 'haal'},
            {t1: 'hl', t2: 'hl', t4: 'hl'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall'},
            {t1: 'lhhelhl', t2: 'lhhalhl', t4: 'lhhaalhl'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll'},
            {t1: 'lhellhhel', t2: 'lhallhhal', t4: 'lhaallhhaal'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal', t4: 'lhaalhhllhaal'},
            {t1: 'helhelhel', t2: 'halhalhal', t4: 'haalhaalhaal'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall', t4: 'lhaalhaalhhlhaall'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhallhhalhlhallh', t4: 'hlhaallhhaalhlhaallh'},
            // Invalid Inputs
            {t1: 'helhhhhllllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    describe('2-33. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {0,3} || t1:h_l & t3:[1SG]', function() {
        const grammar = Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                t1("h"), t1("l"), t3("[1SG]"),
                                false, false, 0, 3, 4);
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 3, t3: 5, t4: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal', t4: 'haal', t3: '[1SG]'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal', t3: '[1SG]'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall', t3: '[1SG]'},
            {t1: 'lhhelhl', t2: 'lhhalhl', t4: 'lhhaalhl', t3: '[1SG]'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll', t3: '[1SG]'},
            {t1: 'lhellhhel', t2: 'lhallhhal', t4: 'lhaallhhaal', t3: '[1SG]'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal', t4: 'lhaalhhllhaal', t3: '[1SG]'},
            {t1: 'helhelhel', t2: 'halhalhal', t4: 'haalhaalhaal', t3: '[1SG]'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall', t4: 'lhaalhaalhhlhaall', t3: '[1SG]'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhallhhalhlhallh', t4: 'hlhaallhhaalhlhaallh', t3: '[1SG]'},
            {t1: 'hlhellhhelhlhel', t2: 'hlhallhhalhlhal', t4: 'hlhaallhhaalhlhaal', t3: '[1SG]'},
            // Invalid Inputs
            {t1: 'helhhhhllllhel', t3: EMPTY},
            {t1: 'helhhhhllllhel', t3: '[1SG]'},
            {t1: 'lhhelhl', t3: EMPTY},
            {t1: 'lhhelhl', t3: '[1]'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    // Here, we tell Replace to treat the vocabs as if the fromTape vocab is a
    // subset of the toTape vocab.
    describe('2-34. Replace e by a/aa in hel: t1:e -> t2:a t4:aa {0,3} || t1:h_l & t3:[1SG] (vocab hel/ehal)', function() {
        const grammar = Seq(Vocab("t2", "hlae"), Vocab("t4", "hlae"),
                            Replace(t1("e"), Seq(t2("a"), t4("aa")),
                                    t1("h"), t1("l"), t3("[1SG]"),
                                    false, false, 0, 3, 4, 17, true));
        testHasTapes(grammar, ['t1', 't2', 't3', 't4']);
        testHasVocab(grammar, {t1: 3, t2: 4, t3: 5, t4: 4});
        const from_to: StringDict[] = [
            // Valid Inputs - Copy through
            {t1: 'hel', t2: 'hel', t4: 'hel', t3: 'G'},
            {t1: 'lhhelhl', t2: 'lhhelhl', t4: 'lhhelhl', t3: '[1]'},
            {t1: 'hlhhelllll', t2: 'hlhhelllll', t4: 'hlhhelllll', t3: '[1]'},
            {t1: 'lhellhhel', t2: 'lhellhhel', t4: 'lhellhhel', t3: '[1]'},
            {t1: 'lhelhhllhel', t2: 'lhelhhllhel', t4: 'lhelhhllhel', t3: '[1]'},
            {t1: 'hel', t2: 'hel', t4: 'hel', t3: EMPTY},
            {t1: 'lhhelhl', t2: 'lhhelhl', t4: 'lhhelhl', t3: EMPTY},
            {t1: 'hlhhelllll', t2: 'hlhhelllll', t4: 'hlhhelllll', t3: EMPTY},
            {t1: 'lhellhhel', t2: 'lhellhhel', t4: 'lhellhhel', t3: EMPTY},
            {t1: 'lhelhhllhel', t2: 'lhelhhllhel', t4: 'lhelhhllhel', t3: EMPTY},
            {t1: 'helhelhel', t2: 'helhelhel', t4: 'helhelhel', t3: EMPTY},
            {t1: 'lhelhelhhlhell', t2: 'lhelhelhhlhell', t4: 'lhelhelhhlhell', t3: EMPTY},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhellhhelhlhellh', t4: 'hlhellhhelhlhellh', t3: EMPTY},
            {t1: 'helhelhel', t2: 'helhelhel', t4: 'helhelhel', t3: '[1]'},
            {t1: 'lhelhelhhlhell', t2: 'lhelhelhhlhell', t4: 'lhelhelhhlhell', t3: '[1]'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhellhhelhlhellh', t4: 'hlhellhhelhlhellh', t3: '[1]'},
            {t1: 'helhhhhllllhel', t2: 'helhhhhllllhel', t4: 'helhhhhllllhel', t3: EMPTY},
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal', t4: 'haal', t3: '[1SG]'},
            {t1: 'hhel', t2: 'hhal', t4: 'hhaal', t3: '[1SG]'},
            {t1: 'hhell', t2: 'hhall', t4: 'hhaall', t3: '[1SG]'},
            {t1: 'lhhelhl', t2: 'lhhalhl', t4: 'lhhaalhl', t3: '[1SG]'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll', t4: 'hlhhaalllll', t3: '[1SG]'},
            {t1: 'lhellhhel', t2: 'lhallhhal', t4: 'lhaallhhaal', t3: '[1SG]'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal', t4: 'lhaalhhllhaal', t3: '[1SG]'},
            {t1: 'helhelhel', t2: 'halhalhal', t4: 'haalhaalhaal', t3: '[1SG]'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall', t4: 'lhaalhaalhhlhaall', t3: '[1SG]'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhallhhalhlhallh', t4: 'hlhaallhhaalhlhaallh', t3: '[1SG]'},
            // Invalid Inputs
            {t1: 'helhhhhllllhel', t3: '[1SG]'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to));
    });

    // The following tests check that copy-through is working for any size (i.e.
    // any value of maxCopyChars), and were moved here from testJoinReplace
    // where they were used to track down issues with ReplaceGrammar and
    // DotStarExpr. Until recently, only ReplaceGrammar was using DotStarExpr
    // (via constructDotRep), but now StartsWithGrammar, EndsWithGrammar, and
    // ContainsGrammar do too, so other unit tests may test DotStarExpr as well. 
    describe('2-35a. Replace i by o/oo with vocab hi: t1:i -> t2:o t4:oo {0,3} with maxCopyChars=Infinity', function() {
        let grammar: Grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'), Vocab('t4', 'hio'),
                                   Replace(t1("i"), Seq(t2("o"), t4("oo")),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 3, 3, Infinity, true));
        grammar = CountTape({t1:3}, grammar);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 3, t4:3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'i', t2: 'o', t4: 'oo'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'hi', t2: 'ho', t4: 'hoo'},
            {t1: 'ih', t2: 'oh', t4: 'ooh'},
            {t1: 'ii', t2: 'oo', t4: 'oooo'},
            {t1: 'hhh', t2: 'hhh', t4: 'hhh'},
            {t1: 'hhi', t2: 'hho', t4: 'hhoo'},
            {t1: 'hih', t2: 'hoh', t4: 'hooh'},
            {t1: 'hii', t2: 'hoo', t4: 'hoooo'},
            {t1: 'ihh', t2: 'ohh', t4: 'oohh'},
            {t1: 'ihi', t2: 'oho', t4: 'oohoo'},
            {t1: 'iih', t2: 'ooh', t4: 'ooooh'},
            {t1: 'iii', t2: 'ooo', t4: 'oooooo'},
            {t1: 'hhhh', t2: 'hhhh', t4: 'hhhh'},
            // should not include
            // {t1: 'ihh', t2: 'ihh', t4: 'ihh'},
            // {t1: 'iih', t2: 'iih', t4: 'iih'},
            // {t1: 'hih', t2: 'hih', t4: 'hih'},
            // {t1: 'hii', t2: 'hii', t4: 'hii'},
            // {t1: 'hhi', t2: 'hhi', t4: 'hhi'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-35b. Replace i by o/oo with vocab hi: t1:i -> t2:o t4:oo {0,3} with maxCopyChars=6', function() {
        let grammar: Grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'), Vocab('t4', 'hio'),
                                   Replace(t1("i"), Seq(t2("o"), t4("oo")),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 3, 3, 6, true));
        grammar = CountTape({t1:4}, grammar);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 3, t4:3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'i', t2: 'o', t4: 'oo'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'hi', t2: 'ho', t4: 'hoo'},
            {t1: 'ih', t2: 'oh', t4: 'ooh'},
            {t1: 'ii', t2: 'oo', t4: 'oooo'},
            {t1: 'hhh', t2: 'hhh', t4: 'hhh'},
            {t1: 'hhi', t2: 'hho', t4: 'hhoo'},
            {t1: 'hih', t2: 'hoh', t4: 'hooh'},
            {t1: 'hii', t2: 'hoo', t4: 'hoooo'},
            {t1: 'ihh', t2: 'ohh', t4: 'oohh'},
            {t1: 'ihi', t2: 'oho', t4: 'oohoo'},
            {t1: 'iih', t2: 'ooh', t4: 'ooooh'},
            {t1: 'iii', t2: 'ooo', t4: 'oooooo'},
            {t1: 'hhhh', t2: 'hhhh', t4: 'hhhh'},
            // should not include
            // {t1: 'ihh', t2: 'ihh', t4: 'ihh'},
            // {t1: 'iih', t2: 'iih', t4: 'iih'},
            // {t1: 'hih', t2: 'hih', t4: 'hih'},
            // {t1: 'hii', t2: 'hii', t4: 'hii'},
            // {t1: 'hhi', t2: 'hhi', t4: 'hhi'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2-35c. Replace i by o/oo with vocab hi: t1:i -> t2:o t4:oo {0,3}, with maxCopyChars=2500', function() {
        let grammar: Grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'), Vocab('t4', 'hio'),
                                   Replace(t1("i"), Seq(t2("o"), t4("oo")),
                                           EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                           false, false, 0, 3, 3, 2500, true));
        grammar = CountTape({t1:4}, grammar);
        testHasTapes(grammar, ['t1', 't2', 't4']);
        testHasVocab(grammar, {t1: 2, t2: 3, t4:3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h', t4: 'h'},
            {t1: 'i', t2: 'o', t4: 'oo'},
            {t1: 'hh', t2: 'hh', t4: 'hh'},
            {t1: 'hi', t2: 'ho', t4: 'hoo'},
            {t1: 'ih', t2: 'oh', t4: 'ooh'},
            {t1: 'ii', t2: 'oo', t4: 'oooo'},
            {t1: 'hhh', t2: 'hhh', t4: 'hhh'},
            {t1: 'hhi', t2: 'hho', t4: 'hhoo'},
            {t1: 'hih', t2: 'hoh', t4: 'hooh'},
            {t1: 'hii', t2: 'hoo', t4: 'hoooo'},
            {t1: 'ihh', t2: 'ohh', t4: 'oohh'},
            {t1: 'ihi', t2: 'oho', t4: 'oohoo'},
            {t1: 'iih', t2: 'ooh', t4: 'ooooh'},
            {t1: 'iii', t2: 'ooo', t4: 'oooooo'},
            {t1: 'hhhh', t2: 'hhhh', t4: 'hhhh'},
            // should not include
            // {t1: 'ihh', t2: 'ihh', t4: 'ihh'},
            // {t1: 'iih', t2: 'iih', t4: 'iih'},
            // {t1: 'hih', t2: 'hih', t4: 'hih'},
            // {t1: 'hii', t2: 'hii', t4: 'hii'},
            // {t1: 'hhi', t2: 'hhi', t4: 'hhi'},
        ];
        testGrammar(grammar, expectedResults);
    });
    */
});
