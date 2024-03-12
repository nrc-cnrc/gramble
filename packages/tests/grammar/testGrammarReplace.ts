import {
    BoundingSet, Count, Cursor, Epsilon,
    OptionalReplace, Query, Replace, 
    Uni, WithVocab
} from "../../interpreter/src/grammarConvenience";

import { StringDict } from "../../interpreter/src/utils/func";
import { SILENT, VERBOSE_DEBUG, VERBOSE_TIME } from "../../interpreter/src/utils/logging";

import {
    grammarTestSuiteName,
    testGrammar,
    t3,
} from "./testGrammarUtil";

import { 
    logTestSuite, VERBOSE_TEST_L2, verbose,
} from '../testUtil';
import { allowedParams } from "@gramble/interpreter/src/ops";

// File level control over verbose output
// const VERBOSE = VERBOSE_TEST_L2;
const VERBOSE = false;

function vb(verbosity: number): number {
    return VERBOSE ? verbosity : SILENT;
}

const EMPTY: string = '';

// Some tests can be skipped.
// Set SKIP_GENERATION to false to force running of those tests.
const SKIP_GENERATION = true;

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

    // Notes:
    //  # denotes a word boundary, i.e. starts with or ends with
    //  Replace requires input and output vocabs to be identical.

    testGrammar({
        desc: '1. Replace e by a in hello: e -> a {0+BS} || #h_llo#',
        grammar: Replace("e", "a", "h", "llo", EMPTY_CONTEXT, true, true),
        //vocab: {"$i":5, "$o":5},
        query: BoundingSet('hello', '', '', true, true),
        results: [
            {"$i": 'hello', "$o": 'hallo'},
        ],
    });

    /*
    testGrammar({
        desc: '2a. Replace i by a in hill: Cnt_6 i -> a {1} || h_ll#',
        grammar: Count({$i:6, $o:6},
                     Replace("i", "a", "h", "ll", EMPTY_CONTEXT, false, true, 1, 1)),
        results: [
            {$i: 'hill', $o: 'hall'},
            {$i: 'ahill', $o: 'ahall'},   {$i: 'ihill', $o: 'ihall'},
            {$i: 'hhill', $o: 'hhall'},   {$i: 'lhill', $o: 'lhall'},
            {$i: 'aahill', $o: 'aahall'}, {$i: 'aihill', $o: 'aihall'},
            {$i: 'ahhill', $o: 'ahhall'}, {$i: 'alhill', $o: 'alhall'},
            {$i: 'iahill', $o: 'iahall'}, {$i: 'iihill', $o: 'iihall'},
            {$i: 'ihhill', $o: 'ihhall'}, {$i: 'ilhill', $o: 'ilhall'},
            {$i: 'hahill', $o: 'hahall'}, {$i: 'hihill', $o: 'hihall'},
            {$i: 'hhhill', $o: 'hhhall'}, {$i: 'hlhill', $o: 'hlhall'},
            {$i: 'lahill', $o: 'lahall'}, {$i: 'lihill', $o: 'lihall'},
            {$i: 'lhhill', $o: 'lhhall'}, {$i: 'llhill', $o: 'llhall'},
        ],
    });
    */

    testGrammar({
        desc: '2. Replace i by a in hill: Cnt_6 i -> a {0+BS} || h_ll#',
        grammar: Count({$i:6},
                     Replace("i", "a", "h", "ll", EMPTY_CONTEXT, false, true)),
        query: BoundingSet('hill', '', '', false, true),
        results: [
            {$i: 'hill', $o: 'hall'},
            {$i: 'ahill', $o: 'ahall'},   {$i: 'ihill', $o: 'ihall'},
            {$i: 'hhill', $o: 'hhall'},   {$i: 'lhill', $o: 'lhall'},
            {$i: 'aahill', $o: 'aahall'}, {$i: 'aihill', $o: 'aihall'},
            {$i: 'ahhill', $o: 'ahhall'}, {$i: 'alhill', $o: 'alhall'},
            {$i: 'iahill', $o: 'iahall'}, {$i: 'iihill', $o: 'iihall'},
            {$i: 'ihhill', $o: 'ihhall'}, {$i: 'ilhill', $o: 'ilhall'},
            {$i: 'hahill', $o: 'hahall'}, {$i: 'hihill', $o: 'hihall'},
            {$i: 'hhhill', $o: 'hhhall'}, {$i: 'hlhill', $o: 'hlhall'},
            {$i: 'lahill', $o: 'lahall'}, {$i: 'lihill', $o: 'lihall'},
            {$i: 'lhhill', $o: 'lhhall'}, {$i: 'llhill', $o: 'llhall'},
        ],
    });

    const io_3: StringDict[] = [
        // Valid Inputs - Replacement
        // We'll spot some of the 21 valid replacements for Count(5).
        {$i: 'hil', $o: 'hal'},
        {$i: 'ahil', $o: 'ahal'},   {$i: 'ihil', $o: 'ihal'},
        {$i: 'aahil', $o: 'aahal'}, {$i: 'ahhil', $o: 'ahhal'},
        {$i: 'hhhil', $o: 'hhhal'}, {$i: 'hihil', $o: 'hihal'},
        {$i: 'iihil', $o: 'iihal'}, {$i: 'ilhil', $o: 'ilhal'},
        {$i: 'lahil', $o: 'lahal'}, {$i: 'llhil', $o: 'llhal'},
        // Valid Inputs - Copy through
        // We'll spot check a few of the 1347 valid copy through outputs for Count(5).
        {$i: 'a', $o: 'a'},         {$i: 'h', $o: 'h'},
        {$i: 'i', $o: 'i'},         {$i: 'l', $o: 'l'},
        {$i: 'aa', $o: 'aa'},       {$i: 'ah', $o: 'ah'},
        {$i: 'hh', $o: 'hh'},       {$i: 'hi', $o: 'hi'},
        {$i: 'ii', $o: 'ii'},       {$i: 'il', $o: 'il'},
        {$i: 'la', $o: 'la'},       {$i: 'll', $o: 'll'},
        // ...
        {$i: 'hli', $o: 'hli'},     {$i: 'ilh', $o: 'ilh'},
        {$i: 'hila', $o: 'hila'},   {$i: 'hilhi', $o: 'hilhi'},
        {$i: 'hilll', $o: 'hilll'},
        // Invalid Inputs
        {$i: 'hilhil'},
    ];

    testGrammar({
        desc: '3. Replace i by a in hil: Spotchk_5 i -> a {0+} || h_l#',
        grammar: Count({$i:5},
                     Replace("i", "a", "h", "l", EMPTY_CONTEXT, false, true)),
        //vocab: {$i:4, $o:4},
        query: inputs(io_3),
        results: outputs(io_3),
    });

    testGrammar({
        desc: '4. Replace i by a in hill: Cnt_6 i -> a {0+BS} || #h_ll',
        grammar: Count({$i:6},
                     Replace("i", "a", "h", "ll", EMPTY_CONTEXT, true, false, 1)),
        query: BoundingSet('hill', '', '', true, false),
        results: [
            {$i: 'hill', $o: 'hall'},
            {$i: 'hilla', $o: 'halla'},   {$i: 'hillh', $o: 'hallh'},
            {$i: 'hilli', $o: 'halli'},   {$i: 'hilll', $o: 'halll'},
            {$i: 'hillaa', $o: 'hallaa'}, {$i: 'hillah', $o: 'hallah'},
            {$i: 'hillai', $o: 'hallai'}, {$i: 'hillal', $o: 'hallal'},
            {$i: 'hillia', $o: 'hallia'}, {$i: 'hillih', $o: 'hallih'},
            {$i: 'hillii', $o: 'hallii'}, {$i: 'hillil', $o: 'hallil'},
            {$i: 'hillha', $o: 'hallha'}, {$i: 'hillhh', $o: 'hallhh'},
            {$i: 'hillhi', $o: 'hallhi'}, {$i: 'hillhl', $o: 'hallhl'},
            {$i: 'hillla', $o: 'hallla'}, {$i: 'hilllh', $o: 'halllh'},
            {$i: 'hillli', $o: 'hallli'}, {$i: 'hillll', $o: 'hallll'},
        ],
    });

    const io_5: StringDict[] = [
        // Valid Inputs - Replacement
        // We'll spot some of the 21 valid replacements for Count(5).
        {$i: 'hil', $o: 'hal'},
        {$i: 'hila', $o: 'hala'},   {$i: 'hili', $o: 'hali'},
        {$i: 'hilaa', $o: 'halaa'}, {$i: 'hilah', $o: 'halah'},
        {$i: 'hilhh', $o: 'halhh'}, {$i: 'hilhi', $o: 'halhi'},
        {$i: 'hilii', $o: 'halii'}, {$i: 'hilil', $o: 'halil'},
        {$i: 'hilla', $o: 'halla'}, {$i: 'hilll', $o: 'halll'},
        // Valid Inputs - Copy through
        // We'll spot check a few of the 1344 valid copy through outputs for Count(5).
        {$i: 'a', $o: 'a'},         {$i: 'h', $o: 'h'},
        {$i: 'i', $o: 'i'},         {$i: 'l', $o: 'l'},
        {$i: 'aa', $o: 'aa'},       {$i: 'ah', $o: 'ah'},
        {$i: 'hh', $o: 'hh'},       {$i: 'hi', $o: 'hi'},
        {$i: 'ii', $o: 'ii'},       {$i: 'il', $o: 'il'},
        {$i: 'la', $o: 'la'},       {$i: 'll', $o: 'll'},
        // ...
        {$i: 'hli', $o: 'hli'},     {$i: 'ilh', $o: 'ilh'},
        {$i: 'ahil', $o: 'ahil'},   {$i: 'hihil', $o: 'hihil'},
        {$i: 'hhhil', $o: 'hhhil'},
        // Invalid Inputs
        {$i: 'hilhil'},
    ];

    testGrammar({
        desc: '5. Replace i by a in hil: Spotchk_5 i -> a {0+} || #h_l',
        grammar: Count({$i:5},
                     Replace("i", "a", "h", "l", EMPTY_CONTEXT, true, false)),
        query: inputs(io_5),
        results: outputs(io_5),
    });

    /*
    testGrammar({
        desc: '6a. Replace i by a in hill: Cnt_5 i -> a {1} || h_ll',
        grammar: Count({$i:5, $o:5},
                     Replace("i", "a", "h", "ll", EMPTY_CONTEXT, false, false, 1, 1)),
        results: [
            {$i: 'hill', $o: 'hall'},
            {$i: 'hilla', $o: 'halla'}, {$i: 'hillh', $o: 'hallh'},
            {$i: 'hilli', $o: 'halli'}, {$i: 'hilll', $o: 'halll'},
            {$i: 'ahill', $o: 'ahall'}, {$i: 'hhill', $o: 'hhall'},
            {$i: 'ihill', $o: 'ihall'}, {$i: 'lhill', $o: 'lhall'},
        ],
    });

    testGrammar({
        desc: '6b. Replace i by a in hill: Cnt_5 i -> a {1+} || h_ll',
        grammar: Count({$i:5, $o:5},
                     Replace("i", "a", "h", "ll", EMPTY_CONTEXT, false, false, 1)),
        results: [
            {$i: 'hill', $o: 'hall'},
            {$i: 'hilla', $o: 'halla'}, {$i: 'hillh', $o: 'hallh'},
            {$i: 'hilli', $o: 'halli'}, {$i: 'hilll', $o: 'halll'},
            {$i: 'ahill', $o: 'ahall'}, {$i: 'hhill', $o: 'hhall'},
            {$i: 'ihill', $o: 'ihall'}, {$i: 'lhill', $o: 'lhall'},
        ],
    });
    */

    /*
    testGrammar({
        desc: '6. Replace i by a in hill: Cnt_6 i -> a {0+BS} || h_ll',
        grammar: Count({$i:6},
                     Replace("i", "a", "h", "ll")),
        query: BoundingSet('hill'),
        results: [
            {$i: 'hill', $o: 'hall'},
            {$i: 'hilla', $o: 'halla'},   {$i: 'hillh', $o: 'hallh'},
            {$i: 'hilli', $o: 'halli'},   {$i: 'hilll', $o: 'halll'},
            {$i: 'ahill', $o: 'ahall'},   {$i: 'hhill', $o: 'hhall'},
            {$i: 'ihill', $o: 'ihall'},   {$i: 'lhill', $o: 'lhall'},
            {$i: 'hillaa', $o: 'hallaa'}, {$i: 'hillah', $o: 'hallah'},
            {$i: 'hillai', $o: 'hallai'}, {$i: 'hillal', $o: 'hallal'},
            {$i: 'hillha', $o: 'hallha'}, {$i: 'hillhh', $o: 'hallhh'},
            {$i: 'hillhi', $o: 'hallhi'}, {$i: 'hillhl', $o: 'hallhl'},
            {$i: 'hillia', $o: 'hallia'}, {$i: 'hillih', $o: 'hallih'},
            {$i: 'hillii', $o: 'hallii'}, {$i: 'hillil', $o: 'hallil'},
            {$i: 'hillla', $o: 'hallla'}, {$i: 'hilllh', $o: 'halllh'},
            {$i: 'hillli', $o: 'hallli'}, {$i: 'hillll', $o: 'hallll'},
            {$i: 'ahilla', $o: 'ahalla'}, {$i: 'ahillh', $o: 'ahallh'},
            {$i: 'ahilli', $o: 'ahalli'}, {$i: 'ahilll', $o: 'ahalll'},
            {$i: 'hhilla', $o: 'hhalla'}, {$i: 'hhillh', $o: 'hhallh'},
            {$i: 'hhilli', $o: 'hhalli'}, {$i: 'hhilll', $o: 'hhalll'},
            {$i: 'ihilla', $o: 'ihalla'}, {$i: 'ihillh', $o: 'ihallh'},
            {$i: 'ihilli', $o: 'ihalli'}, {$i: 'ihilll', $o: 'ihalll'},
            {$i: 'lhilla', $o: 'lhalla'}, {$i: 'lhillh', $o: 'lhallh'},
            {$i: 'lhilli', $o: 'lhalli'}, {$i: 'lhilll', $o: 'lhalll'},
            {$i: 'aahill', $o: 'aahall'}, {$i: 'ahhill', $o: 'ahhall'},
            {$i: 'aihill', $o: 'aihall'}, {$i: 'alhill', $o: 'alhall'},
            {$i: 'hahill', $o: 'hahall'}, {$i: 'hhhill', $o: 'hhhall'},
            {$i: 'hihill', $o: 'hihall'}, {$i: 'hlhill', $o: 'hlhall'},
            {$i: 'iahill', $o: 'iahall'}, {$i: 'ihhill', $o: 'ihhall'},
            {$i: 'iihill', $o: 'iihall'}, {$i: 'ilhill', $o: 'ilhall'},
            {$i: 'lahill', $o: 'lahall'}, {$i: 'lhhill', $o: 'lhhall'},
            {$i: 'lihill', $o: 'lihall'}, {$i: 'llhill', $o: 'llhall'},
        ],
    });
    */

    /*
    testGrammar({
        desc: '7a. Replace i by a in hil: Cnt_5 i -> a {0+BS} || h_l',
        grammar: Count({$i:5},
                     Replace("i", "a", "h", "l")),
        query: BoundingSet('hil'),
        results: [
            {$i: 'hil', $o: 'hal'},
            {$i: 'hila', $o: 'hala'},   {$i: 'hilh', $o: 'halh'},
            {$i: 'hili', $o: 'hali'},   {$i: 'hill', $o: 'hall'},
            {$i: 'ahil', $o: 'ahal'},   {$i: 'hhil', $o: 'hhal'},
            {$i: 'ihil', $o: 'ihal'},   {$i: 'lhil', $o: 'lhal'},
            {$i: 'ahila', $o: 'ahala'}, {$i: 'ahilh', $o: 'ahalh'},
            {$i: 'ahili', $o: 'ahali'}, {$i: 'ahill', $o: 'ahall'},
            {$i: 'hhila', $o: 'hhala'}, {$i: 'hhilh', $o: 'hhalh'},
            {$i: 'hhili', $o: 'hhali'}, {$i: 'hhill', $o: 'hhall'},
            {$i: 'ihila', $o: 'ihala'}, {$i: 'ihilh', $o: 'ihalh'},
            {$i: 'ihili', $o: 'ihali'}, {$i: 'ihill', $o: 'ihall'},
            {$i: 'lhila', $o: 'lhala'}, {$i: 'lhilh', $o: 'lhalh'},
            {$i: 'lhili', $o: 'lhali'}, {$i: 'lhill', $o: 'lhall'},
            {$i: 'hilaa', $o: 'halaa'}, {$i: 'hilah', $o: 'halah'},
            {$i: 'hilai', $o: 'halai'}, {$i: 'hilal', $o: 'halal'},
            {$i: 'hilha', $o: 'halha'}, {$i: 'hilhh', $o: 'halhh'},
            {$i: 'hilhi', $o: 'halhi'}, {$i: 'hilhl', $o: 'halhl'},
            {$i: 'hilia', $o: 'halia'}, {$i: 'hilih', $o: 'halih'},
            {$i: 'hilii', $o: 'halii'}, {$i: 'hilil', $o: 'halil'},
            {$i: 'hilla', $o: 'halla'}, {$i: 'hillh', $o: 'hallh'},
            {$i: 'hilli', $o: 'halli'}, {$i: 'hilll', $o: 'halll'},
            {$i: 'aahil', $o: 'aahal'}, {$i: 'ahhil', $o: 'ahhal'},
            {$i: 'aihil', $o: 'aihal'}, {$i: 'alhil', $o: 'alhal'},
            {$i: 'hahil', $o: 'hahal'}, {$i: 'hhhil', $o: 'hhhal'},
            {$i: 'hihil', $o: 'hihal'}, {$i: 'hlhil', $o: 'hlhal'},
            {$i: 'iahil', $o: 'iahal'}, {$i: 'ihhil', $o: 'ihhal'},
            {$i: 'iihil', $o: 'iihal'}, {$i: 'ilhil', $o: 'ilhal'},
            {$i: 'lahil', $o: 'lahal'}, {$i: 'lhhil', $o: 'lhhal'},
            {$i: 'lihil', $o: 'lihal'}, {$i: 'llhil', $o: 'llhal'},
        ],
    });
    */

    /*
    // Full Generation:
    //  Count=7: 21845 results
    //  Count=8: 87381 results
    //  Count=9: 349525 results
    //  Count=10: 1398101 results
    // Here we spot check some of the possible 349525 results for
    // 9 characters or less,
    const io_7b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},
        {$i: 'hhil', $o: 'hhal'},
        {$i: 'hill', $o: 'hall'},
        {$i: 'hhill', $o: 'hhall'},
        {$i: 'hihill', $o: 'hihall'},
        {$i: 'hilhil', $o: 'halhal'},
        {$i: 'ahalhil', $o: 'ahalhal'},
        {$i: 'ahilhal', $o: 'ahalhal'},
        {$i: 'alhilal', $o: 'alhalal'},
        {$i: 'halhila', $o: 'halhala'},
        {$i: 'hihilhi', $o: 'hihalhi'},
        {$i: 'ilhilil', $o: 'ilhalil'},
        {$i: 'hilhilhil', $o: 'halhalhal'},
        {$i: 'hlihillll', $o: 'hlihallll'},
        {$i: 'lihhillih', $o: 'lihhallih'},
        // Valid Inputs - Copy through
        {$i: 'hli', $o: 'hli'},             {$i: 'hahahaha', $o: 'hahahaha'},
        {$i: 'hihihihi', $o: 'hihihihi'},   {$i: 'halhalhal', $o: 'halhalhal'},
        // Some Invalid Inputs
        // {$i: 'hli'},        {$i: 'hilhil'},
        {$i: 'hlihilllll'},
        {$i: 'hillihlihlih'},
        {$i: 'lihlihlihhil'},
    ];

    testGrammar({
        desc: '7b. Replace i by a in hil: Spotchk_9 i -> a {0+} || h_l',
        grammar: Count({$i:9},
                     Replace("i", "a", "h", "l")),
        query: Query(inputs(io_7b)),
        results: outputs(io_7b),
    })
    */

    testGrammar({
        desc: '8a. Replace i by a in hil: Cnt_5 i -> a {0+BS} || h_l',
        grammar: Count({$i:5},
                     Replace("i", "a", "h", "l")),
        //vocab: {$i:4, $o:4},
        query: BoundingSet('hil'),
        results: [
            {$i: 'hil', $o: 'hal'},
            {$i: 'hila', $o: 'hala'},   {$i: 'hilh', $o: 'halh'},
            {$i: 'hili', $o: 'hali'},   {$i: 'hill', $o: 'hall'},
            {$i: 'ahil', $o: 'ahal'},   {$i: 'hhil', $o: 'hhal'},
            {$i: 'ihil', $o: 'ihal'},   {$i: 'lhil', $o: 'lhal'},
            {$i: 'ahila', $o: 'ahala'}, {$i: 'ahilh', $o: 'ahalh'},
            {$i: 'ahili', $o: 'ahali'}, {$i: 'ahill', $o: 'ahall'},
            {$i: 'hhila', $o: 'hhala'}, {$i: 'hhilh', $o: 'hhalh'},
            {$i: 'hhili', $o: 'hhali'}, {$i: 'hhill', $o: 'hhall'},
            {$i: 'ihila', $o: 'ihala'}, {$i: 'ihilh', $o: 'ihalh'},
            {$i: 'ihili', $o: 'ihali'}, {$i: 'ihill', $o: 'ihall'},
            {$i: 'lhila', $o: 'lhala'}, {$i: 'lhilh', $o: 'lhalh'},
            {$i: 'lhili', $o: 'lhali'}, {$i: 'lhill', $o: 'lhall'},
            {$i: 'hilaa', $o: 'halaa'}, {$i: 'hilah', $o: 'halah'},
            {$i: 'hilai', $o: 'halai'}, {$i: 'hilal', $o: 'halal'},
            {$i: 'hilha', $o: 'halha'}, {$i: 'hilhh', $o: 'halhh'},
            {$i: 'hilhi', $o: 'halhi'}, {$i: 'hilhl', $o: 'halhl'},
            {$i: 'hilia', $o: 'halia'}, {$i: 'hilih', $o: 'halih'},
            {$i: 'hilii', $o: 'halii'}, {$i: 'hilil', $o: 'halil'},
            {$i: 'hilla', $o: 'halla'}, {$i: 'hillh', $o: 'hallh'},
            {$i: 'hilli', $o: 'halli'}, {$i: 'hilll', $o: 'halll'},
            {$i: 'aahil', $o: 'aahal'}, {$i: 'ahhil', $o: 'ahhal'},
            {$i: 'aihil', $o: 'aihal'}, {$i: 'alhil', $o: 'alhal'},
            {$i: 'hahil', $o: 'hahal'}, {$i: 'hhhil', $o: 'hhhal'},
            {$i: 'hihil', $o: 'hihal'}, {$i: 'hlhil', $o: 'hlhal'},
            {$i: 'iahil', $o: 'iahal'}, {$i: 'ihhil', $o: 'ihhal'},
            {$i: 'iihil', $o: 'iihal'}, {$i: 'ilhil', $o: 'ilhal'},
            {$i: 'lahil', $o: 'lahal'}, {$i: 'lhhil', $o: 'lhhal'},
            {$i: 'lihil', $o: 'lihal'}, {$i: 'llhil', $o: 'llhal'},
        ],
    });

    // Full Generation:
    //  Count=7: 21845 results
    //  Count=8: 87381 results
    //  Count=9: 349525 results
    //  Count=11: 5592405 results
    //  Count=13: 89478485 results
    //  Count=14: 357913941 results
    // Here we spot check some of the possible 357913941 results for
    // 14 characters or less.
    const io_8b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},               {$i: 'ahil', $o: 'ahal'},
        {$i: 'hhil', $o: 'hhal'},             {$i: 'hilh', $o: 'halh'},
        {$i: 'hili', $o: 'hali'},             {$i: 'hill', $o: 'hall'},
        {$i: 'lhil', $o: 'lhal'},             {$i: 'aahil', $o: 'aahal'},
        {$i: 'hhilh', $o: 'hhalh'},           {$i: 'hhill', $o: 'hhall'},
        {$i: 'hihil', $o: 'hihal'},           {$i: 'hilha', $o: 'halha'},
        {$i: 'hilll', $o: 'halll'},           {$i: 'ihili', $o: 'ihali'},
        {$i: 'lhilh', $o: 'lhalh'},           {$i: 'lhill', $o: 'lhall'},
        {$i: 'hihill', $o: 'hihall'},         {$i: 'hilhil', $o: 'halhal'},
        {$i: 'aahilaa', $o: 'aahalaa'},       {$i: 'ahalhil', $o: 'ahalhal'},
        {$i: 'ahilhal', $o: 'ahalhal'},       {$i: 'alhilal', $o: 'alhalal'},
        {$i: 'halhila', $o: 'halhala'},       {$i: 'hhilhil', $o: 'hhalhal'},
        {$i: 'hihilhi', $o: 'hihalhi'},       {$i: 'hiilhil', $o: 'hiilhal'},
        {$i: 'hilahil', $o: 'halahal'},       {$i: 'hilhiil', $o: 'halhiil'},
        {$i: 'hilhilh', $o: 'halhalh'},       {$i: 'hilhill', $o: 'halhall'},
        {$i: 'hilihil', $o: 'halihal'},       {$i: 'hillhil', $o: 'hallhal'},
        {$i: 'ilhilil', $o: 'ilhalil'},       {$i: 'lhilhil', $o: 'lhalhal'},
        {$i: 'hhilhhil', $o: 'hhalhhal'},     {$i: 'hhilhilh', $o: 'hhalhalh'},
        {$i: 'hhilhill', $o: 'hhalhall'},     {$i: 'hhilihil', $o: 'hhalihal'},
        {$i: 'hhillhil', $o: 'hhallhal'},     {$i: 'hihilhil', $o: 'hihalhal'},
        {$i: 'hilhhilh', $o: 'halhhalh'},     {$i: 'hilhhill', $o: 'halhhall'},
        {$i: 'hilhihil', $o: 'halhihal'},     {$i: 'hilhilhi', $o: 'halhalhi'},
        {$i: 'hillhilh', $o: 'hallhalh'},     {$i: 'hillhill', $o: 'hallhall'},
        {$i: 'lhilhhil', $o: 'lhalhhal'},     {$i: 'lhilhilh', $o: 'lhalhalh'},
        {$i: 'lhilhill', $o: 'lhalhall'},     {$i: 'lhillhil', $o: 'lhallhal'},
        {$i: 'hhilhhilh', $o: 'hhalhhalh'},   {$i: 'hhilhhill', $o: 'hhalhhall'},
        {$i: 'hhilhihil', $o: 'hhalhihal'},   {$i: 'hhilhilhi', $o: 'hhalhalhi'},
        {$i: 'hhillhilh', $o: 'hhallhalh'},   {$i: 'hhillhill', $o: 'hhallhall'},
        {$i: 'hihilhhil', $o: 'hihalhhal'},   {$i: 'hihilhill', $o: 'hihalhall'},
        {$i: 'hilhilhil', $o: 'halhalhal'},   {$i: 'hillhilhi', $o: 'hallhalhi'},
        {$i: 'hillihilh', $o: 'hallihalh'},   {$i: 'hlihillll', $o: 'hlihallll'},
        {$i: 'ihilihili', $o: 'ihalihali'},   {$i: 'lhilhhilh', $o: 'lhalhhalh'},
        {$i: 'lhilhhill', $o: 'lhalhhall'},   {$i: 'lhillhilh', $o: 'lhallhalh'},
        {$i: 'lhillhill', $o: 'lhallhall'},   {$i: 'lihhillih', $o: 'lihhallih'},
        {$i: 'hilhilhilh', $o: 'halhalhalh'}, {$i: 'hlihilllll', $o: 'hlihalllll'},
        {$i: 'lahhilllll', $o: 'lahhalllll'}, {$i: 'lhilhallhil', $o: 'lhalhallhal'},
        {$i: 'hilhilhhiill', $o: 'halhalhhiill'},
        {$i: 'hillihlihlih', $o: 'hallihlihlih'},
        {$i: 'lihlihlihhil', $o: 'lihlihlihhal'},
        {$i: 'ihilihilihili', $o: 'ihalihalihali'},
        {$i: 'lhilhilhhlhil', $o: 'lhalhalhhlhal'},
        {$i: 'lhilhilhlhill', $o: 'lhalhalhlhall'},
        {$i: 'lhilhilhhlhill', $o: 'lhalhalhhlhall'},
        // Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                   {$i: 'hi', $o: 'hi'},
        {$i: 'hal', $o: 'hal'},               {$i: 'lih', $o: 'lih'},
        {$i: 'hli', $o: 'hli'},               {$i: 'lhal', $o: 'lhal'},
        {$i: 'lihli', $o: 'lihli'},           {$i: 'iihhll', $o: 'iihhll'},
        {$i: 'aahhiill', $o: 'aahhiill'},     {$i: 'hahahaha', $o: 'hahahaha'},
        {$i: 'hihihihi', $o: 'hihihihi'},     {$i: 'halhalhal', $o: 'halhalhal'},
        {$i: 'iiihhhlll', $o: 'iiihhhlll'},   {$i: 'lihlihlih', $o: 'lihlihlih'},
        {$i: 'aaaiiihhhlll', $o: 'aaaiiihhhlll'},
        {$i: 'hahahiililil', $o: 'hahahiililil'},
        {$i: 'hilhilhilhil', $o: 'halhalhalhal'}, 
        {$i: 'lllliiiihhhh', $o: 'lllliiiihhhh'},
        {$i: 'ahilhilhilhila', $o: 'ahalhalhalhala'},
        // Invalid Inputs
        {$i: 'hilhilhilhilhil'},  {$i: 'ahilhilhilhilhila'},
        {$i: 'hlhillhhilhlhillh'},
    ];

    testGrammar({
        desc: '8b. Replace i by a in hil: Spotchk_14 i -> a {0+} || h_l',
        grammar: Count({$i:14},
                     Replace( "i", "a", "h", "l")),
        //vocab: {$i:4, $o:4},
        query: inputs(io_8b),
        results: outputs(io_8b),
    });

    /*
    // Full Generation:
    //  Count=7: 21845 results
    //  Count=8: 87381 results
    //  Count=9: 349524 results
    //  Count=10: 1398084 results
    // Here we spot check some of the possible 349524 results for
    // 9 characters or less.
    const io_9: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},             {$i: 'hhil', $o: 'hhal'},
        {$i: 'hilh', $o: 'halh'},           {$i: 'hill', $o: 'hall'},
        {$i: 'lhil', $o: 'lhal'},           {$i: 'hhilh', $o: 'hhalh'},
        {$i: 'hhill', $o: 'hhall'},         {$i: 'lhilh', $o: 'lhalh'},
        {$i: 'lhill', $o: 'lhall'},         {$i: 'hilhil', $o: 'halhal'},
        {$i: 'aahilaa', $o: 'aahalaa'},     {$i: 'hhilhil', $o: 'hhalhal'},
        {$i: 'hihilhi', $o: 'hihalhi'},     {$i: 'hilahil', $o: 'halahal'},
        {$i: 'hilhilh', $o: 'halhalh'},     {$i: 'hilhill', $o: 'halhall'},
        {$i: 'hillhil', $o: 'hallhal'},     {$i: 'ilhilil', $o: 'ilhalil'},
        {$i: 'lhilhil', $o: 'lhalhal'},     {$i: 'hhilhhil', $o: 'hhalhhal'},
        {$i: 'hhilhilh', $o: 'hhalhalh'},   {$i: 'hhilhill', $o: 'hhalhall'},
        {$i: 'hhillhil', $o: 'hhallhal'},   {$i: 'hilhhilh', $o: 'halhhalh'},
        {$i: 'hilhhill', $o: 'halhhall'},   {$i: 'hillhilh', $o: 'hallhalh'},
        {$i: 'hillhill', $o: 'hallhall'},   {$i: 'lhilhhil', $o: 'lhalhhal'},
        {$i: 'lhilhilh', $o: 'lhalhalh'},   {$i: 'lhilhill', $o: 'lhalhall'},
        {$i: 'lhillhil', $o: 'lhallhal'},   {$i: 'hhilhhilh', $o: 'hhalhhalh'},
        {$i: 'hhilhhill', $o: 'hhalhhall'}, {$i: 'hhillhilh', $o: 'hhallhalh'},
        {$i: 'hhillhill', $o: 'hhallhall'}, {$i: 'lhilhhilh', $o: 'lhalhhalh'},
        {$i: 'lhilhhill', $o: 'lhalhhall'}, {$i: 'lhillhilh', $o: 'lhallhalh'},
        {$i: 'lhillhill', $o: 'lhallhall'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                 {$i: 'hi', $o: 'hi'},
        {$i: 'hal', $o: 'hal'},             {$i: 'lih', $o: 'lih'},
        {$i: 'lhal', $o: 'lhal'},           {$i: 'lihli', $o: 'lihli'},
        {$i: 'aahhiill', $o: 'aahhiill'},   {$i: 'iiihhhlll', $o: 'iiihhhlll'},
        // Invalid Inputs
        {$i: 'hhhilhilhh'}, {$i: 'hihihililil'},
    ];

    testGrammar({
        desc: '9. Replace i by a in hil: Spotchk_9 i -> a {0+} || h_l',
        grammar: Count({$i:9, $o:9},
                     Replace("i", "a", "h", "l")),
        //vocab: {$i:4, $o:4},
        query: inputs(io_9),
        results: outputs(io_9),
    });
    */

    /*
    // Full Generation:
    //  Count=7: 21845 results
    //  Count=9: 349525 results
    //  Count=11: 5592405 results
    //  Count=13: 89478485 results
    //  Count=14: 357913941 results
    // Here we spot check some of the possible >357M results for
    // 14 characters or less,
    const io_10: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},             {$i: 'hhil', $o: 'hhal'},
        {$i: 'hhill', $o: 'hhall'},         {$i: 'alhilil', $o: 'alhalil'},
        {$i: 'hihilhi', $o: 'hihalhi'},     {$i: 'ilhilil', $o: 'ilhalil'},
        {$i: 'lhhilhl', $o: 'lhhalhl'},     {$i: 'hilhilhil', $o: 'halhalhal'},
        {$i: 'lhillhhil', $o: 'lhallhhal'}, {$i: 'lahhilllll', $o: 'lahhalllll'},
        {$i: 'lhilhallhil', $o: 'lhalhallhal'},
        {$i: 'ihilihilihili', $o: 'ihalihalihali'},
        {$i: 'lhilhilhlhill', $o: 'lhalhalhlhall'},
        {$i: 'lhilhilhhlhil', $o: 'lhalhalhhlhal'},
        {$i: 'lhilhilhhlhill', $o: 'lhalhalhhlhall'},
        {$i: 'hilhilhilhil', $o: 'halhalhalhal'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                 {$i: 'hi', $o: 'hi'},
        {$i: 'hal', $o: 'hal'},             {$i: 'lih', $o: 'lih'},
        {$i: 'lihli', $o: 'lihli'},         {$i: 'iihhll', $o: 'iihhll'},
        {$i: 'iiihhhlll', $o: 'iiihhhlll'}, {$i: 'lllliiiihhhh', $o: 'lllliiiihhhh'},
        {$i: 'hihihiililil', $o: 'hihihiililil'},
        // Some Invalid Inputs
        {$i: 'hilhilhilhilhil'}, {$i: 'hlhillhhilhlhillh'},
    ];

    testGrammar({
        desc: '10. Replace i by a in hil: Spotchk_14 i -> a {0+} || h_l',
        grammar: Count({$i:14, $o:14},
                     Replace("i", "a", "h", "l")),
        //vocab: {$i:4, $o:4},
        query: inputs(io_10),
        results: outputs(io_10),
    });
    */

    testGrammar({
        desc: '11a. Replace i by a in hi: Cnt_3 i -> a {0+} || h_',
        grammar: Count({$i:3},
                     Replace("i", "a", "h", "")),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'hi', $o: 'ha'},
            {$i: 'ahi', $o: 'aha'}, {$i: 'ihi', $o: 'iha'},
            {$i: 'hia', $o: 'haa'}, {$i: 'hii', $o: 'hai'},
            {$i: 'hih', $o: 'hah'}, {$i: 'hhi', $o: 'hha'},
            // Copy through only
            {$i: 'a', $o: 'a'},     {$i: 'i', $o: 'i'},
            {$i: 'h', $o: 'h'},     {$i: 'aa', $o: 'aa'},
            {$i: 'ai', $o: 'ai'},   {$i: 'ah', $o: 'ah'},
            {$i: 'ia', $o: 'ia'},   {$i: 'ii', $o: 'ii'},
            {$i: 'ih', $o: 'ih'},   {$i: 'ha', $o: 'ha'},
            {$i: 'hh', $o: 'hh'},   {$i: 'aaa', $o: 'aaa'},
            {$i: 'aai', $o: 'aai'}, {$i: 'aah', $o: 'aah'},
            {$i: 'aia', $o: 'aia'}, {$i: 'aii', $o: 'aii'},
            {$i: 'aih', $o: 'aih'}, {$i: 'aha', $o: 'aha'},
            {$i: 'ahh', $o: 'ahh'}, {$i: 'iaa', $o: 'iaa'},
            {$i: 'iai', $o: 'iai'}, {$i: 'iah', $o: 'iah'},
            {$i: 'iia', $o: 'iia'}, {$i: 'iii', $o: 'iii'},
            {$i: 'iih', $o: 'iih'}, {$i: 'iha', $o: 'iha'},
            {$i: 'ihh', $o: 'ihh'}, {$i: 'haa', $o: 'haa'},
            {$i: 'hai', $o: 'hai'}, {$i: 'hah', $o: 'hah'},
            {$i: 'hha', $o: 'hha'}, {$i: 'hhh', $o: 'hhh'},
        ],
    });

    // Full Generation:
    //  Count=4: 121 results
    //  Count=6: 1093 results
    //  Count=8: 9841 results
    //  Count=9: 29524 results
    //  Count=10: 88573 results
    // Here we spot check some of the possible 88573 results for
    // 10 characters or less.
    const io_11b_12: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hi', $o: 'ha'},                 {$i: 'hih', $o: 'hah'},
        {$i: 'ahia', $o: 'ahaa'},             {$i: 'ihih', $o: 'ihah'},
        {$i: 'hhhihh', $o: 'hhhahh'},         {$i: 'hhhihi', $o: 'hhhaha'},
        {$i: 'hhihhi', $o: 'hhahha'},         {$i: 'hhihih', $o: 'hhahah'},
        {$i: 'hihahi', $o: 'hahaha'},         {$i: 'hihhhi', $o: 'hahhha'},
        {$i: 'hihhih', $o: 'hahhah'},         {$i: 'hihihi', $o: 'hahaha'},
        {$i: 'hihiii', $o: 'hahaii'},         {$i: 'hihhhih', $o: 'hahhhah'},
        {$i: 'hihhihh', $o: 'hahhahh'},       {$i: 'ihihiii', $o: 'ihahaii'},
        {$i: 'ihiihii', $o: 'ihaihai'},       {$i: 'ahihihihi', $o: 'ahahahaha'},
        {$i: 'hhhihhhih', $o: 'hhhahhhah'},   {$i: 'hhhihhihh', $o: 'hhhahhahh'},
        {$i: 'hhihhhiha', $o: 'hhahhhaha'},   {$i: 'hhihhhihh', $o: 'hhahhhahh'},
        {$i: 'aaaaaahihi', $o: 'aaaaaahaha'}, {$i: 'aahiaahiaa', $o: 'aahaaahaaa'},
        {$i: 'hhhhhhhihi', $o: 'hhhhhhhaha'}, {$i: 'hhhihhhihh', $o: 'hhhahhhahh'},
        {$i: 'hihihhhhhh', $o: 'hahahhhhhh'}, {$i: 'hihihihihi', $o: 'hahahahaha'},
        {$i: 'hihiiiiiii', $o: 'hahaiiiiii'}, {$i: 'hiiiiiiihi', $o: 'haiiiiiiha'},
        {$i: 'ihhiiihiih', $o: 'ihhaiihaih'}, {$i: 'iihiiihiii', $o: 'iihaiihaii'},
        {$i: 'iiihihhhhi', $o: 'iiihahhhha'}, {$i: 'iiihihihhh', $o: 'iiihahahhh'},
        {$i: 'iiiiiihihi', $o: 'iiiiiihaha'},
        // Some Valid Inputs - Copy through
        {$i: 'a', $o: 'a'},                   {$i: 'ha', $o: 'ha'},
        {$i: 'hh', $o: 'hh'},                 {$i: 'iii', $o: 'iii'},
        {$i: 'hhhaaa', $o: 'hhhaaa'},         {$i: 'iiihhh', $o: 'iiihhh'},
        {$i: 'iiiihhhh', $o: 'iiiihhhh'},     {$i: 'hahahahaha', $o: 'hahahahaha'},
        {$i: 'iiiiihhhhh', $o: 'iiiiihhhhh'},
        // Some Invalid Inputs
        {$i: 'hihihihhhhh'},  {$i: 'iiiiihihihi'},
    ];

    testGrammar({
        desc: '11b. Replace i by a in hi: Spotchk_10 i -> a {0+} || h_',
        grammar: Count({$i:10},
                     Replace("i", "a", "h", "")),
        //vocab: {$i:3, $o:3},
        query: inputs(io_11b_12),
        results: outputs(io_11b_12),
    });

    testGrammar({
        desc: '12. Replace i by a in hi: Spotchk_10 i -> a {0+} || h_ε',
        grammar: Count({$i:10},
                     Replace("i", "a", "h", EMPTY_CONTEXT)),
        //vocab: {$i:3, $o:3},
        query: inputs(io_11b_12),
        results: outputs(io_11b_12),
    });

    testGrammar({
        desc: '13a. Replace i by a in il: Cnt_3 i -> a {0+} || ε_l',
        grammar: Count({$i:3},
                     Replace("i", "a", EMPTY_CONTEXT, "l")),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'il', $o: 'al'},
            {$i: 'ail', $o: 'aal'}, {$i: 'iil', $o: 'ial'},
            {$i: 'ila', $o: 'ala'}, {$i: 'ili', $o: 'ali'},
            {$i: 'ill', $o: 'all'}, {$i: 'lil', $o: 'lal'},
            // Copy through only
            {$i: 'a', $o: 'a'},     {$i: 'i', $o: 'i'},
            {$i: 'l', $o: 'l'},     {$i: 'aa', $o: 'aa'},
            {$i: 'ai', $o: 'ai'},   {$i: 'al', $o: 'al'},
            {$i: 'ia', $o: 'ia'},   {$i: 'ii', $o: 'ii'},
            {$i: 'la', $o: 'la'},   {$i: 'li', $o: 'li'},
            {$i: 'll', $o: 'll'},   {$i: 'aaa', $o: 'aaa'},
            {$i: 'aai', $o: 'aai'}, {$i: 'aal', $o: 'aal'},
            {$i: 'aia', $o: 'aia'}, {$i: 'aii', $o: 'aii'},
            {$i: 'ala', $o: 'ala'}, {$i: 'ali', $o: 'ali'},
            {$i: 'all', $o: 'all'}, {$i: 'iaa', $o: 'iaa'},
            {$i: 'iai', $o: 'iai'}, {$i: 'ial', $o: 'ial'},
            {$i: 'iia', $o: 'iia'}, {$i: 'iii', $o: 'iii'},
            {$i: 'laa', $o: 'laa'}, {$i: 'lai', $o: 'lai'},
            {$i: 'lal', $o: 'lal'}, {$i: 'lia', $o: 'lia'},
            {$i: 'lii', $o: 'lii'}, {$i: 'lla', $o: 'lla'},
            {$i: 'lli', $o: 'lli'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  Count=4: 121 results
    //  Count=6: 1093 results
    //  Count=8: 9841 results
    //  Count=9: 29524 results
    //  Count=10: 88573 results
    // Here we spot check some of the possible 88573 results for
    // 10 characters or less.
    const io_13b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'il', $o: 'al'},                 {$i: 'lil', $o: 'lal'},
        {$i: 'ilal', $o: 'alal'},             {$i: 'ilil', $o: 'alal'},
        {$i: 'aillil', $o: 'aallal'},         {$i: 'iiilil', $o: 'iialal'},
        {$i: 'ilalil', $o: 'alalal'},         {$i: 'ililil', $o: 'alalal'},
        {$i: 'illill', $o: 'allall'},         {$i: 'illlil', $o: 'alllal'},
        {$i: 'lilill', $o: 'lalall'},         {$i: 'llilil', $o: 'llalal'},
        {$i: 'llilll', $o: 'llalll'},         {$i: 'aililil', $o: 'aalalal'},
        {$i: 'iiliili', $o: 'ialiali'},       {$i: 'iililii', $o: 'ialalii'},
        {$i: 'illilll', $o: 'allalll'},       {$i: 'illlill', $o: 'alllall'},
        {$i: 'ilililill', $o: 'alalalall'},   {$i: 'lilllilal', $o: 'lalllalal'},
        {$i: 'lilllilll', $o: 'lalllalll'},   {$i: 'llilaaill', $o: 'llalaaall'},
        {$i: 'llillilll', $o: 'llallalll'},   {$i: 'llilllill', $o: 'llalllall'},
        {$i: 'aaaililaaa', $o: 'aaaalalaaa'}, {$i: 'iiiiiiilil', $o: 'iiiiiialal'},
        {$i: 'iiiilillll', $o: 'iiialallll'}, {$i: 'iiiillllil', $o: 'iiiallllal'},
        {$i: 'iiiliiilii', $o: 'iialiialii'}, {$i: 'iliiiiiiil', $o: 'aliiiiiial'},
        {$i: 'ililiiiiii', $o: 'alaliiiiii'}, {$i: 'ililililil', $o: 'alalalalal'},
        {$i: 'ililllllll', $o: 'alalllllll'}, {$i: 'liiliiilli', $o: 'lialiialli'},
        {$i: 'llilllilll', $o: 'llalllalll'}, {$i: 'llllllilil', $o: 'llllllalal'},
        // Some Valid Inputs - Copy through
        {$i: 'l', $o: 'l'},                   {$i: 'al', $o: 'al'},
        {$i: 'll', $o: 'll'},                 {$i: 'iii', $o: 'iii'},
        {$i: 'lllaaa', $o: 'lllaaa'},         {$i: 'llliii', $o: 'llliii'},
        {$i: 'lllliiii', $o: 'lllliiii'},     {$i: 'alalalalal', $o: 'alalalalal'},
        {$i: 'llllliiiii', $o: 'llllliiiii'},
        // Some Invalid Inputs
        {$i: 'iiiiiiiilil'},  {$i: 'ilillllllll'},
    ];

    testGrammar({
        desc: '13b. Replace i by a in il: Spotchk_10 i -> a {0+} || ε_l',
        grammar: Count({$i:10},
                     Replace("i", "a", EMPTY_CONTEXT, "l")),
        //vocab: {$i:3, $o:3},
        query: inputs(io_13b),
        results: outputs(io_13b),
    });

    testGrammar({
        desc: '14. Replace i by a: Cnt_3 i -> a {0+} (vocab $i:ahi)',
        grammar: Count({$i:3},
                     WithVocab({$i:'ahi'},
                         Replace("i", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'i', $o: 'a'},     {$i: 'ai', $o: 'aa'},
            {$i: 'hi', $o: 'ha'},   {$i: 'ia', $o: 'aa'},
            {$i: 'ih', $o: 'ah'},   {$i: 'ii', $o: 'aa'},
            {$i: 'aai', $o: 'aaa'}, {$i: 'ahi', $o: 'aha'},
            {$i: 'aia', $o: 'aaa'}, {$i: 'aih', $o: 'aah'},
            {$i: 'aii', $o: 'aaa'}, {$i: 'hai', $o: 'haa'},
            {$i: 'hhi', $o: 'hha'}, {$i: 'hia', $o: 'haa'},
            {$i: 'hih', $o: 'hah'}, {$i: 'hii', $o: 'haa'},
            {$i: 'iaa', $o: 'aaa'}, {$i: 'iah', $o: 'aah'},
            {$i: 'iai', $o: 'aaa'}, {$i: 'iha', $o: 'aha'},
            {$i: 'ihh', $o: 'ahh'}, {$i: 'ihi', $o: 'aha'},
            {$i: 'iia', $o: 'aaa'}, {$i: 'iih', $o: 'aah'},
            {$i: 'iii', $o: 'aaa'},
            // Copy through only
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
            {$i: 'aa', $o: 'aa'},   {$i: 'ah', $o: 'ah'},
            {$i: 'ha', $o: 'ha'},   {$i: 'hh', $o: 'hh'},
            {$i: 'aaa', $o: 'aaa'}, {$i: 'aah', $o: 'aah'},
            {$i: 'aha', $o: 'aha'}, {$i: 'ahh', $o: 'ahh'},
            {$i: 'haa', $o: 'haa'}, {$i: 'hah', $o: 'hah'},
            {$i: 'hha', $o: 'hha'}, {$i: 'hhh', $o: 'hhh'},
        ],
    });

    // Full Generation:
    //  Count=8: 9841 results
    //  Count=9: 29524 results
    //  Count=10: 88573 results
    // Here we spot check some of the possible 88573 results for
    // 10 characters or less,
    const io_15: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'i', $o: 'a'},                   {$i: 'hi', $o: 'ha'},
        {$i: 'ii', $o: 'aa'},                 {$i: 'iaa', $o: 'aaa'},
        {$i: 'iii', $o: 'aaa'},               {$i: 'ihhi', $o: 'ahha'},
        {$i: 'iihh', $o: 'aahh'},             {$i: 'iiii', $o: 'aaaa'},
        {$i: 'aihhi', $o: 'aahha'},           {$i: 'aihia', $o: 'aahaa'},
        {$i: 'hiiih', $o: 'haaah'},           {$i: 'iaaii', $o: 'aaaaa'},
        {$i: 'ihihi', $o: 'ahaha'},           {$i: 'hihhii', $o: 'hahhaa'},
        {$i: 'ihhiaa', $o: 'ahhaaa'},         {$i: 'ihiiha', $o: 'ahaaha'},
        {$i: 'hhiiihh', $o: 'hhaaahh'},       {$i: 'hihihih', $o: 'hahahah'},
        {$i: 'iaaiaai', $o: 'aaaaaaa'},       {$i: 'iaaiihh', $o: 'aaaaahh'},
        {$i: 'ihhiihh', $o: 'ahhaahh'},       {$i: 'ihihiha', $o: 'ahahaha'},
        {$i: 'iiiiiii', $o: 'aaaaaaa'},       {$i: 'hhihhihh', $o: 'hhahhahh'},
        {$i: 'hihaihai', $o: 'hahaahaa'},     {$i: 'haiiaaiaa', $o: 'haaaaaaaa'},
        {$i: 'hhihaihih', $o: 'hhahaahah'},   {$i: 'aaaaaaaaai', $o: 'aaaaaaaaaa'},
        {$i: 'aaiaaiaaia', $o: 'aaaaaaaaaa'}, {$i: 'aaiahiaihh', $o: 'aaaahaaahh'},
        {$i: 'aaihaihaih', $o: 'aaahaahaah'}, {$i: 'hahihahiha', $o: 'hahahahaha'},
        {$i: 'hihihihihi', $o: 'hahahahaha'}, {$i: 'ihahahahai', $o: 'ahahahahaa'},
        {$i: 'iihahahaha', $o: 'aahahahaha'},
        // Some Valid Inputs - Copy through
        {$i: 'a', $o: 'a'},                   {$i: 'hh', $o: 'hh'},
        {$i: 'aaaa', $o: 'aaaa'},             {$i: 'hhaa', $o: 'hhaa'},
        {$i: 'hahahaha', $o: 'hahahaha'},     {$i: 'ahahahahah', $o: 'ahahahahah'},
        {$i: 'hahahahaha', $o: 'hahahahaha'}, {$i: 'hhhhhaaaaa', $o: 'hhhhhaaaaa'},
        // Some Invalid Inputs
        {$i: 'aaaaaahhhhh'},  {$i: 'hiahiahiahi'},

    ];

    testGrammar({
        desc: '15. Replace i by a: Spotchk_10 i -> a {0+} (vocab $i:ahi)',
        grammar: Count({$i:10},
        			 WithVocab({$i:'ahi'},
                     	 Replace("i", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        //vocab: {$i:3, $o:3},
        query: inputs(io_15),
        results: outputs(io_15),
    });

    // Full Generation:
    //  $i Count=8: 9841 results
    //  $i Count=9: 29524 results
    //  $i Count=10: 88573 results
    //  $i Count=11: 265720 results
    //  $i Count=12: 797161 results
    // Here we spot check some of the possible 797161 results for
    // $i with 12 characters or less.
    const io_16: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hal', $o: 'haal'},                {$i: 'hala', $o: 'haala'},
        {$i: 'halh', $o: 'haalh'},              {$i: 'lhal', $o: 'lhaal'},
        {$i: 'ahala', $o: 'ahaala'},            {$i: 'hhala', $o: 'hhaala'},
        {$i: 'lhall', $o: 'lhaall'},            {$i: 'halhal', $o: 'haalhaal'},
        {$i: 'alhalal', $o: 'alhaalal'},        {$i: 'hahalha', $o: 'hahaalha'},
        {$i: 'halhala', $o: 'haalhaala'},       {$i: 'halhhal', $o: 'haalhhaal'},
        {$i: 'lhalhal', $o: 'lhaalhaal'},       {$i: 'ahalhala', $o: 'ahaalhaala'},
        {$i: 'ahalhhal', $o: 'ahaalhhaal'},     {$i: 'halahall', $o: 'haalahaall'},
        {$i: 'halhhala', $o: 'haalhhaala'},     {$i: 'hhalhall', $o: 'hhaalhaall'},
        {$i: 'hhallhal', $o: 'hhaallhaal'},     {$i: 'lhalhala', $o: 'lhaalhaala'},
        {$i: 'lhallhal', $o: 'lhaallhaal'},     {$i: 'ahalahala', $o: 'ahaalahaala'},
        {$i: 'halhalhal', $o: 'haalhaalhaal'},  {$i: 'hhalahala', $o: 'hhaalahaala'},
        {$i: 'lhalahall', $o: 'lhaalahaall'},   {$i: 'halaaaahal', $o: 'haalaaaahaal'},
        {$i: 'hhhalhalhh', $o: 'hhhaalhaalhh'}, {$i: 'lllhalahal', $o: 'lllhaalahaal'},
        {$i: 'aaaahalaaaa', $o: 'aaaahaalaaaa'},
        {$i: 'aaaaahalaaaa', $o: 'aaaaahaalaaaa'},
        {$i: 'halhalhalhal', $o: 'haalhaalhaalhaal'},
        {$i: 'halhhhlllhal', $o: 'haalhhhlllhaal'},
        // Some Valid Inputs - Copy through
        {$i: 'a', $o: 'a'},                     {$i: 'h', $o: 'h'},
        {$i: 'aa', $o: 'aa'},                   {$i: 'ha', $o: 'ha'},
        {$i: 'lah', $o: 'lah'},                 {$i: 'haal', $o: 'haal'},
        {$i: 'lahla', $o: 'lahla'},             {$i: 'aahhll', $o: 'aahhll'},
        {$i: 'aaahhhlll', $o: 'aaahhhlll'},
        {$i: 'hahahaalalal', $o: 'hahahaalalal'},
        {$i: 'hhhhaaaallll', $o: 'hhhhaaaallll'},
        {$i: 'llllaaaahhhh', $o: 'llllaaaahhhh'},
        // Some Invalid Inputs
        {$i: 'aaaaaahllllll'}, {$i: 'hhhhhhallllll'},
    ];

    testGrammar({
        desc: '16. Replace a by aa in hal: Spotchk_12 a -> aa {0+} || h_l',
        grammar: Count({$i:12},
                     Replace("a", "aa", "h", "l")),
        //vocab: {$i:3, $o:3},
        query: inputs(io_16),
        results: outputs(io_16),
    });

    testGrammar({
        desc: '17. Replace a by aa in hal: Cnt_i:6 a -> aa {0+BS} || #h_l',
        grammar: Count({$i:6},
                     Replace("a", "aa", "h", "l", EMPTY_CONTEXT, true, false)),
        //vocab: {$i:3, $o:3},
        query: BoundingSet('hal', '', '', true, false),
        results: [
            {$i: 'hal', $o: 'haal'},       {$i: 'halh', $o: 'haalh'},
            {$i: 'hala', $o: 'haala'},     {$i: 'hall', $o: 'haall'},
            {$i: 'halhh', $o: 'haalhh'},   {$i: 'halha', $o: 'haalha'},
            {$i: 'halhl', $o: 'haalhl'},   {$i: 'halah', $o: 'haalah'},
            {$i: 'halaa', $o: 'haalaa'},   {$i: 'halal', $o: 'haalal'},
            {$i: 'hallh', $o: 'haallh'},   {$i: 'halla', $o: 'haalla'},
            {$i: 'halll', $o: 'haalll'},   {$i: 'halhhh', $o: 'haalhhh'},
            {$i: 'halhha', $o: 'haalhha'}, {$i: 'halhhl', $o: 'haalhhl'},
            {$i: 'halhah', $o: 'haalhah'}, {$i: 'halhaa', $o: 'haalhaa'},
            {$i: 'halhal', $o: 'haalhal'}, {$i: 'halhlh', $o: 'haalhlh'},
            {$i: 'halhla', $o: 'haalhla'}, {$i: 'halhll', $o: 'haalhll'},
            {$i: 'halahh', $o: 'haalahh'}, {$i: 'halaha', $o: 'haalaha'},
            {$i: 'halahl', $o: 'haalahl'}, {$i: 'halaah', $o: 'haalaah'},
            {$i: 'halaaa', $o: 'haalaaa'}, {$i: 'halaal', $o: 'haalaal'},
            {$i: 'halalh', $o: 'haalalh'}, {$i: 'halala', $o: 'haalala'},
            {$i: 'halall', $o: 'haalall'}, {$i: 'hallhh', $o: 'haallhh'},
            {$i: 'hallha', $o: 'haallha'}, {$i: 'hallhl', $o: 'haallhl'},
            {$i: 'hallah', $o: 'haallah'}, {$i: 'hallaa', $o: 'haallaa'},
            {$i: 'hallal', $o: 'haallal'}, {$i: 'halllh', $o: 'haalllh'},
            {$i: 'hallla', $o: 'haallla'}, {$i: 'hallll', $o: 'haallll'},
        ],
    });

    const io_18: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hal', $o: 'haal'},         {$i: 'halh', $o: 'haalh'},
        {$i: 'hala', $o: 'haala'},       {$i: 'hall', $o: 'haall'},
        {$i: 'halhal', $o: 'haalhal'},   {$i: 'halhalh', $o: 'haalhalh'},
        {$i: 'halhala', $o: 'haalhala'}, {$i: 'halhall', $o: 'haalhall'},
        {$i: 'halhhal', $o: 'haalhhal'}, {$i: 'halahal', $o: 'haalahal'},
        {$i: 'hallhal', $o: 'haallhal'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},             {$i: 'a', $o: 'a'},
        {$i: 'l', $o: 'l'},             {$i: 'hl', $o: 'hl'},
        {$i: 'ah', $o: 'ah'},           {$i: 'll', $o: 'll'},
        {$i: 'hah', $o: 'hah'},         {$i: 'haa', $o: 'haa'},
        {$i: 'alh', $o: 'alh'},         {$i: 'all', $o: 'all'},
        {$i: 'lal', $o: 'lal'},         {$i: 'lll', $o: 'lll'},
        {$i: 'hhhh', $o: 'hhhh'},       {$i: 'hhaa', $o: 'hhaa'},
        {$i: 'hhal', $o: 'hhal'},       {$i: 'haal', $o: 'haal'},
        {$i: 'ahah', $o: 'ahah'},       {$i: 'ahaa', $o: 'ahaa'},
        {$i: 'ahal', $o: 'ahal'},       {$i: 'allh', $o: 'allh'},
        {$i: 'lhah', $o: 'lhah'},       {$i: 'lhal', $o: 'lhal'},
        {$i: 'lhla', $o: 'lhla'},       {$i: 'llll', $o: 'llll'},
        {$i: 'hhalh', $o: 'hhalh'},     {$i: 'alhalal', $o: 'alhalal'},
        {$i: 'hahalha', $o: 'hahalha'}, {$i: 'lhhalhl', $o: 'lhhalhl'},
        // Some Invalid Inputs
        {$i: 'halhalhal'},
    ];

    testGrammar({
        desc: '18. Replace a by aa in hal: Spotchk_7 a -> aa {0+} || #h_l',
        grammar: Count({$i:7},
                     Replace("a", "aa", "h", "l", EMPTY_CONTEXT, true, false)),
        //vocab: {$i:3, $o:3},
        query: inputs(io_18),
        results: outputs(io_18),
    });

    testGrammar({
        desc: '19. Replace a by aa in hal: Cnt_i:6 a -> aa {0+BS} || h_l#',
        grammar: Count({$i:6},
                     Replace("a", "aa", "h", "l", EMPTY_CONTEXT, false, true)),
        //vocab: {$i:3, $o:3},
        query: BoundingSet('hal', '', '', false, true),
        results: [
            {$i: 'hal', $o: 'haal'},       {$i: 'hhal', $o: 'hhaal'},
            {$i: 'ahal', $o: 'ahaal'},     {$i: 'lhal', $o: 'lhaal'},
            {$i: 'hhhal', $o: 'hhhaal'},   {$i: 'hahal', $o: 'hahaal'},
            {$i: 'hlhal', $o: 'hlhaal'},   {$i: 'ahhal', $o: 'ahhaal'},
            {$i: 'aahal', $o: 'aahaal'},   {$i: 'alhal', $o: 'alhaal'},
            {$i: 'lhhal', $o: 'lhhaal'},   {$i: 'lahal', $o: 'lahaal'},
            {$i: 'llhal', $o: 'llhaal'},   {$i: 'hhhhal', $o: 'hhhhaal'},
            {$i: 'hhahal', $o: 'hhahaal'}, {$i: 'hhlhal', $o: 'hhlhaal'},
            {$i: 'hahhal', $o: 'hahhaal'}, {$i: 'haahal', $o: 'haahaal'},
            {$i: 'halhal', $o: 'halhaal'}, {$i: 'hlhhal', $o: 'hlhhaal'},
            {$i: 'hlahal', $o: 'hlahaal'}, {$i: 'hllhal', $o: 'hllhaal'},
            {$i: 'ahhhal', $o: 'ahhhaal'}, {$i: 'ahahal', $o: 'ahahaal'},
            {$i: 'ahlhal', $o: 'ahlhaal'}, {$i: 'aahhal', $o: 'aahhaal'},
            {$i: 'aaahal', $o: 'aaahaal'}, {$i: 'aalhal', $o: 'aalhaal'},
            {$i: 'alhhal', $o: 'alhhaal'}, {$i: 'alahal', $o: 'alahaal'},
            {$i: 'allhal', $o: 'allhaal'}, {$i: 'lhhhal', $o: 'lhhhaal'},
            {$i: 'lhahal', $o: 'lhahaal'}, {$i: 'lhlhal', $o: 'lhlhaal'},
            {$i: 'lahhal', $o: 'lahhaal'}, {$i: 'laahal', $o: 'laahaal'},
            {$i: 'lalhal', $o: 'lalhaal'}, {$i: 'llhhal', $o: 'llhhaal'},
            {$i: 'llahal', $o: 'llahaal'}, {$i: 'lllhal', $o: 'lllhaal'},
        ],
    });

    const io_20: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hal', $o: 'haal'},         {$i: 'hhal', $o: 'hhaal'},
        {$i: 'ahal', $o: 'ahaal'},       {$i: 'lhal', $o: 'lhaal'},
        {$i: 'halhal', $o: 'halhaal'},   {$i: 'hhalhal', $o: 'hhalhaal'},
        {$i: 'ahalhal', $o: 'ahalhaal'}, {$i: 'lhalhal', $o: 'lhalhaal'},
        {$i: 'halhhal', $o: 'halhhaal'}, {$i: 'halahal', $o: 'halahaal'},
        {$i: 'hallhal', $o: 'hallhaal'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},            {$i: 'a', $o: 'a'},
        {$i: 'l', $o: 'l'},            {$i: 'hl', $o: 'hl'},
        {$i: 'ah', $o: 'ah'},          {$i: 'll', $o: 'll'},
        {$i: 'hah', $o: 'hah'},        {$i: 'haa', $o: 'haa'},
        {$i: 'alh', $o: 'alh'},        {$i: 'all', $o: 'all'},
        {$i: 'lal', $o: 'lal'},        {$i: 'lll', $o: 'lll'},
        {$i: 'hhhh', $o: 'hhhh'},      {$i: 'hhaa', $o: 'hhaa'},
        {$i: 'halh', $o: 'halh'},      {$i: 'hala', $o: 'hala'},
        {$i: 'hall', $o: 'hall'},      {$i: 'haal', $o: 'haal'},
        {$i: 'ahah', $o: 'ahah'},      {$i: 'ahaa', $o: 'ahaa'},
        {$i: 'ahll', $o: 'ahll'},      {$i: 'allh', $o: 'allh'},
        {$i: 'lhaa', $o: 'lhaa'},      {$i: 'lhah', $o: 'lhah'},
        {$i: 'lhla', $o: 'lhla'},      {$i: 'llll', $o: 'llll'},
        {$i: 'hhalh', $o: 'hhalh'},    {$i: 'alhalal', $o: 'alhalal'},
        {$i: 'hahalha', $o: 'hahalha'},
        // Some Invalid Inputs
        {$i: 'halhalhal'},
    ];

    testGrammar({
        desc: '20. Replace a by aa in hal: Spotchk_7 a -> aa {0+} || h_l#',
        grammar: Count({$i:7},
                     Replace("a", "aa", "h", "l", EMPTY_CONTEXT, false, true)),
        //vocab: {$i:3, $o:3},
        query: inputs(io_20),
        results: outputs(io_20),
    });

    testGrammar({
        desc: '21a. Replace a by aa in ha: Cnt_i:4 a -> aa {0+} || h_',
        grammar: Count({$i:4},
                     Replace("a", "aa", "h", EMPTY_CONTEXT)),
        //vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'ha', $o: 'haa'},     {$i: 'aha', $o: 'ahaa'},
            {$i: 'haa', $o: 'haaa'},   {$i: 'hah', $o: 'haah'},
            {$i: 'hha', $o: 'hhaa'},   {$i: 'aaha', $o: 'aahaa'},
            {$i: 'ahaa', $o: 'ahaaa'}, {$i: 'ahah', $o: 'ahaah'},
            {$i: 'ahha', $o: 'ahhaa'}, {$i: 'haaa', $o: 'haaaa'},
            {$i: 'haah', $o: 'haaah'}, {$i: 'haha', $o: 'haahaa'},
            {$i: 'hahh', $o: 'haahh'}, {$i: 'hhaa', $o: 'hhaaa'},
            {$i: 'hhah', $o: 'hhaah'}, {$i: 'hhha', $o: 'hhhaa'},
            // Copy through only
            {$i: 'a', $o: 'a'},        {$i: 'h', $o: 'h'},
            {$i: 'aa', $o: 'aa'},      {$i: 'ah', $o: 'ah'},
            {$i: 'hh', $o: 'hh'},      {$i: 'aaa', $o: 'aaa'},
            {$i: 'aah', $o: 'aah'},    {$i: 'ahh', $o: 'ahh'},
            {$i: 'hhh', $o: 'hhh'},    {$i: 'aaaa', $o: 'aaaa'},
            {$i: 'aaah', $o: 'aaah'},  {$i: 'aahh', $o: 'aahh'},
            {$i: 'ahhh', $o: 'ahhh'},  {$i: 'hhhh', $o: 'hhhh'},
        ],
    });

    // Full Generation:
    //  $i Count=7: 255 results
    //  $i Count=8: 511 results
    //  $i Count=9: 1023 results
    //  $i Count=10: 2047 results
    // Here we spot check some of the possible 2047 results for
    // $i with 10 characters or less.
    const io_21b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'ha', $o: 'haa'},                  {$i: 'haa', $o: 'haaa'},
        {$i: 'hha', $o: 'hhaa'},                {$i: 'haha', $o: 'haahaa'},
        {$i: 'hhah', $o: 'hhaah'},              {$i: 'ahaha', $o: 'ahaahaa'},
        {$i: 'hahaa', $o: 'haahaaa'},           {$i: 'hahah', $o: 'haahaah'},
        {$i: 'hahha', $o: 'haahhaa'},           {$i: 'hhaha', $o: 'hhaahaa'},
        {$i: 'aahaaa', $o: 'aahaaaa'},          {$i: 'ahaaha', $o: 'ahaaahaa'},
        {$i: 'ahahaa', $o: 'ahaahaaa'},         {$i: 'haahaa', $o: 'haaahaaa'},
        {$i: 'hahaha', $o: 'haahaahaa'},        {$i: 'hahhah', $o: 'haahhaah'},
        {$i: 'hahhha', $o: 'haahhhaa'},         {$i: 'hhhahh', $o: 'hhhaahh'},
        {$i: 'hahahhh', $o: 'haahaahhh'},       {$i: 'hhahhah', $o: 'hhaahhaah'},
        {$i: 'ahahahah', $o: 'ahaahaahaah'},    {$i: 'hahahaha', $o: 'haahaahaahaa'},
        {$i: 'aaaaaahaha', $o: 'aaaaaahaahaa'}, {$i: 'aahahhhaaa', $o: 'aahaahhhaaaa'},
        {$i: 'haaaaaaaha', $o: 'haaaaaaaahaa'}, {$i: 'hahahahaha', $o: 'haahaahaahaahaa'},
        {$i: 'hahahhhhhh', $o: 'haahaahhhhhh'}, {$i: 'hahhhhhhha', $o: 'haahhhhhhhaa'},
        {$i: 'hahhhhhhhh', $o: 'haahhhhhhhh'},  {$i: 'hhhaaahaaa', $o: 'hhhaaaahaaaa'},
        {$i: 'hhhahhhahh', $o: 'hhhaahhhaahh'}, {$i: 'hhhhahahhh', $o: 'hhhhaahaahhh'},
        {$i: 'hhhhhaaaaa', $o: 'hhhhhaaaaaa'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                     {$i: 'a', $o: 'a'},
        {$i: 'aaahhh', $o: 'aaahhh'},           {$i: 'aaaaaaaa', $o: 'aaaaaaaa'},
        {$i: 'aaaaahhhhh', $o: 'aaaaahhhhh'},   {$i: 'hhhhhhhhhh', $o: 'hhhhhhhhhh'},
        // Some Invalid Inputs
        {$i: 'aaaaaahhhhh'},  {$i: 'hhhhhahhhhh'},
        {$i: 'hhhhhhaaaaa'},
    ];

    testGrammar({
        desc: '21b. Replace a by aa in ha: Spotchk_10 a -> aa {0+} || h_',
        grammar: Count({$i:10},
                     Replace("a", "aa", "h", EMPTY_CONTEXT)),
        //vocab: {$i:2, $o:2},
        query: inputs(io_21b),
        results: outputs(io_21b),
    });

    testGrammar({
        desc: '22a. Replace a by aa in al: Cnt_i:4 a -> aa {0+} || _l',
        grammar: Count({$i:4},
                     Replace("a", "aa", EMPTY_CONTEXT, "l")),
        //vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'al', $o: 'aal'},     {$i: 'aal', $o: 'aaal'},
            {$i: 'ala', $o: 'aala'},   {$i: 'all', $o: 'aall'},
            {$i: 'lal', $o: 'laal'},   {$i: 'aaal', $o: 'aaaal'},
            {$i: 'aala', $o: 'aaala'}, {$i: 'aall', $o: 'aaall'},
            {$i: 'alaa', $o: 'aalaa'}, {$i: 'alal', $o: 'aalaal'},
            {$i: 'alla', $o: 'aalla'}, {$i: 'alll', $o: 'aalll'},
            {$i: 'laal', $o: 'laaal'}, {$i: 'lala', $o: 'laala'},
            {$i: 'lall', $o: 'laall'}, {$i: 'llal', $o: 'llaal'},
            // Copy through only
            {$i: 'a', $o: 'a'},        {$i: 'l', $o: 'l'},
            {$i: 'aa', $o: 'aa'},      {$i: 'la', $o: 'la'},
            {$i: 'll', $o: 'll'},      {$i: 'aaa', $o: 'aaa'},
            {$i: 'laa', $o: 'laa'},    {$i: 'lla', $o: 'lla'},
            {$i: 'lll', $o: 'lll'},    {$i: 'aaaa', $o: 'aaaa'},
            {$i: 'laaa', $o: 'laaa'},  {$i: 'llaa', $o: 'llaa'},
            {$i: 'llla', $o: 'llla'},  {$i: 'llll', $o: 'llll'},
        ],
    });

    const io_22b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'al', $o: 'aal'},                  {$i: 'aal', $o: 'aaal'},
        {$i: 'ala', $o: 'aala'},                {$i: 'alal', $o: 'aalaal'},
        {$i: 'lall', $o: 'laall'},              {$i: 'aalal', $o: 'aaalaal'},
        {$i: 'alala', $o: 'aalaala'},           {$i: 'alall', $o: 'aalaall'},
        {$i: 'allal', $o: 'aallaal'},           {$i: 'lalal', $o: 'laalaal'},
        {$i: 'aaalaa', $o: 'aaaalaa'},          {$i: 'aalaal', $o: 'aaalaaal'},
        {$i: 'aalala', $o: 'aaalaala'},         {$i: 'alaala', $o: 'aalaaala'},
        {$i: 'alalal', $o: 'aalaalaal'},        {$i: 'allall', $o: 'aallaall'},
        {$i: 'alllal', $o: 'aalllaal'},         {$i: 'llalll', $o: 'llaalll'},
        {$i: 'alallll', $o: 'aalaallll'},       {$i: 'lallall', $o: 'laallaall'},
        {$i: 'aaaaaaalal', $o: 'aaaaaaaalaal'}, {$i: 'aaalllalaa', $o: 'aaaalllaalaa'},
        {$i: 'alaaaaaaal', $o: 'aalaaaaaaaal'}, {$i: 'alalalalal', $o: 'aalaalaalaalaal'},
        {$i: 'alalllllll', $o: 'aalaalllllll'}, {$i: 'alllllllal', $o: 'aalllllllaal'},
        {$i: 'alllllllll', $o: 'aalllllllll'},  {$i: 'lalalalala', $o: 'laalaalaalaala'},
        {$i: 'llalaaalaa', $o: 'llaalaaaalaa'}, {$i: 'llalllalll', $o: 'llaalllaalll'},
        {$i: 'lllalallll', $o: 'lllaalaallll'}, {$i: 'llllalaaaa', $o: 'llllaalaaaa'},
        // Some Valid Inputs - Copy through
        {$i: 'a', $o: 'a'},                     {$i: 'l', $o: 'l'},
        {$i: 'lllaaa', $o: 'lllaaa'},           {$i: 'aaaaaaaa', $o: 'aaaaaaaa'},
        {$i: 'lllllaaaaa', $o: 'lllllaaaaa'},   {$i: 'llllllllll', $o: 'llllllllll'},
        // Some Invalid Inputs
        {$i: 'lllllaaaaaa'},  {$i: 'lllllalllll'},
        {$i: 'lllllllllll'},
    ];

    testGrammar({
        desc: '22b. Replace a by aa in al: Spotchk_10 a -> aa {0+} || _l',
        grammar: Count({$i:10},
                     Replace("a", "aa", EMPTY_CONTEXT, "l")),
        //vocab: {$i:2, $o:2},
        query: inputs(io_22b),
        results: outputs(io_22b),
    });

    testGrammar({
        desc: '23. Replace a by aa: Cnt_i:3 a -> aa {0+} (vocab $i:ahl)',
        grammar: Count({$i:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "aa", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'a', $o: 'aa'},       {$i: 'aa', $o: 'aaaa'},
            {$i: 'ah', $o: 'aah'},     {$i: 'al', $o: 'aal'},
            {$i: 'ha', $o: 'haa'},     {$i: 'la', $o: 'laa'},
            {$i: 'aaa', $o: 'aaaaaa'}, {$i: 'aah', $o: 'aaaah'},
            {$i: 'aal', $o: 'aaaal'},  {$i: 'aha', $o: 'aahaa'},
            {$i: 'ahh', $o: 'aahh'},   {$i: 'ahl', $o: 'aahl'},
            {$i: 'ala', $o: 'aalaa'},  {$i: 'alh', $o: 'aalh'},
            {$i: 'all', $o: 'aall'},   {$i: 'haa', $o: 'haaaa'},
            {$i: 'hah', $o: 'haah'},   {$i: 'hal', $o: 'haal'},
            {$i: 'hha', $o: 'hhaa'},   {$i: 'hla', $o: 'hlaa'},
            {$i: 'laa', $o: 'laaaa'},  {$i: 'lah', $o: 'laah'},
            {$i: 'lal', $o: 'laal'},   {$i: 'lha', $o: 'lhaa'},
            {$i: 'lla', $o: 'llaa'},
            // Copy through only
            {$i: 'h', $o: 'h'},        {$i: 'l', $o: 'l'},
            {$i: 'hh', $o: 'hh'},      {$i: 'hl', $o: 'hl'},
            {$i: 'lh', $o: 'lh'},      {$i: 'll', $o: 'll'},
            {$i: 'hhh', $o: 'hhh'},    {$i: 'hhl', $o: 'hhl'},
            {$i: 'hlh', $o: 'hlh'},    {$i: 'hll', $o: 'hll'},
            {$i: 'lhh', $o: 'lhh'},    {$i: 'lhl', $o: 'lhl'},
            {$i: 'llh', $o: 'llh'},    {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  $o Count=8: 9841 results
    //  $o Count=9: 29524 results
    //  $o Count=10: 88573 results
    //  $o Count=11: 265720 results
    //  $o Count=12: 797161 results
    // Here we spot check some of the possible 797160 results for
    // $o with 12 characters or less.
    const io_24: StringDict[] = [
        // Some Valid Inputs
        {$i: 'haal', $o: 'hal'},                  {$i: 'haala', $o: 'hala'},
        {$i: 'haalh', $o: 'halh'},                {$i: 'lhaal', $o: 'lhal'},
        {$i: 'ahaala', $o: 'ahala'},              {$i: 'hhaala', $o: 'hhala'},
        {$i: 'lhaall', $o: 'lhall'},              {$i: 'alhaalal', $o: 'alhalal'},
        {$i: 'haalhaal', $o: 'halhal'},           {$i: 'hahaalha', $o: 'hahalha'},
        {$i: 'haalhaala', $o: 'halhala'},         {$i: 'haalhhaal', $o: 'halhhal'},
        {$i: 'lhaalhaal', $o: 'lhalhal'},         {$i: 'ahaalhaala', $o: 'ahalhala'},
        {$i: 'ahaalhhaal', $o: 'ahalhhal'},       {$i: 'haalahaall', $o: 'halahall'},
        {$i: 'haalhhaala', $o: 'halhhala'},       {$i: 'hhaalhaall', $o: 'hhalhall'},
        {$i: 'hhaallhaal', $o: 'hhallhal'},       {$i: 'lhaalhaala', $o: 'lhalhala'},
        {$i: 'lhaallhaal', $o: 'lhallhal'},       {$i: 'ahaalahaala', $o: 'ahalahala'},
        {$i: 'hhaalahaala', $o: 'hhalahala'},     {$i: 'lhaalahaall', $o: 'lhalahall'},
        {$i: 'aaaahaalaaaa', $o: 'aaaahalaaaa'},  {$i: 'haalaaaahaal', $o: 'halaaaahal'},
        {$i: 'haalhaalhaal', $o: 'halhalhal'},    {$i: 'hhhaalhaalhh', $o: 'hhhalhalhh'},
        {$i: 'lllhaalahaal', $o: 'lllhalahal'},   {$i: 'hhhhhhaalllll', $o: 'hhhhhhalllll'},
        // Some Valid Inputs - Copy through
        {$i: 'a', $o: 'a'},                       {$i: 'h', $o: 'h'},
        {$i: 'aa', $o: 'aa'},                     {$i: 'ha', $o: 'ha'},
        {$i: 'lah', $o: 'lah'},                   {$i: 'lahla', $o: 'lahla'},
        {$i: 'aahhll', $o: 'aahhll'},             {$i: 'aaahhhlll', $o: 'aaahhhlll'},
        {$i: 'hahalalaalal', $o: 'hahalalaalal'}, {$i: 'hhhhaaaallll', $o: 'hhhhaaaallll'},
        {$i: 'llllaaaahhhh', $o: 'llllaaaahhhh'},
        // Some Invalid Inputs
        {$i: 'hhhhhhaallllll'},  {$i: 'hhhhhhallllll'},
    ];

    testGrammar({
        desc: '24. Replace aa by a in haal: Spotchk_12 aa -> a {0+} || h_l',
        grammar: Count({$o:12},
                     Replace("aa", "a", "h", "l")),
        //vocab: {$i:3, $o:3},
        query: inputs(io_24),
        results: outputs(io_24),
    });

    testGrammar({
        desc: '25a. Replace aa by a in haa: Cnt_o:4 aa -> a {0+} || h_',
        grammar: Count({$o:4},
                     Replace("aa", "a", "h", EMPTY_CONTEXT)),
        //vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'haa', $o: 'ha'},     {$i: 'ahaa', $o: 'aha'},
            {$i: 'haaa', $o: 'haa'},   {$i: 'haah', $o: 'hah'},
            {$i: 'hhaa', $o: 'hha'},   {$i: 'aahaa', $o: 'aaha'},
            {$i: 'ahaaa', $o: 'ahaa'}, {$i: 'ahaah', $o: 'ahah'},
            {$i: 'ahhaa', $o: 'ahha'}, {$i: 'haaaa', $o: 'haaa'},
            {$i: 'haaah', $o: 'haah'}, {$i: 'haaha', $o: 'haha'},
            {$i: 'haahh', $o: 'hahh'}, {$i: 'hahaa', $o: 'haha'},
            {$i: 'hhaaa', $o: 'hhaa'}, {$i: 'hhaah', $o: 'hhah'},
            {$i: 'hhhaa', $o: 'hhha'}, {$i: 'haahaa', $o: 'haha'},
            // Copy through only
            {$i: 'a', $o: 'a'},        {$i: 'h', $o: 'h'},
            {$i: 'aa', $o: 'aa'},      {$i: 'ah', $o: 'ah'},
            {$i: 'ha', $o: 'ha'},      {$i: 'hh', $o: 'hh'},
            {$i: 'aaa', $o: 'aaa'},    {$i: 'aah', $o: 'aah'},
            {$i: 'aha', $o: 'aha'},    {$i: 'ahh', $o: 'ahh'},
            {$i: 'hah', $o: 'hah'},    {$i: 'hha', $o: 'hha'},
            {$i: 'hhh', $o: 'hhh'},    {$i: 'aaaa', $o: 'aaaa'},
            {$i: 'aaah', $o: 'aaah'},  {$i: 'aaha', $o: 'aaha'},
            {$i: 'aahh', $o: 'aahh'},  {$i: 'ahah', $o: 'ahah'},
            {$i: 'ahha', $o: 'ahha'},  {$i: 'ahhh', $o: 'ahhh'},
            {$i: 'haha', $o: 'haha'},  {$i: 'hahh', $o: 'hahh'},
            {$i: 'hhah', $o: 'hhah'},  {$i: 'hhha', $o: 'hhha'},
            {$i: 'hhhh', $o: 'hhhh'},
        ],
    });

    // Full Generation:
    //  $o Count=10: 2048 results
    //  $o Count=11: 4096 results
    //  $o Count=12: 8192 results
    // Here we spot check some of the possible 8192 results for
    // $o with 12 characters or less.
    const io_25b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'haa', $o: 'ha'},                  {$i: 'haaa', $o: 'haa'},
        {$i: 'hhaa', $o: 'hha'},                {$i: 'hhaah', $o: 'hhah'},
        {$i: 'haahaa', $o: 'haha'},             {$i: 'aahaaaa', $o: 'aahaaa'},
        {$i: 'ahaahaa', $o: 'ahaha'},           {$i: 'haahaaa', $o: 'hahaa'},
        {$i: 'haahaah', $o: 'hahah'},           {$i: 'haahhaa', $o: 'hahha'},
        {$i: 'hhaahaa', $o: 'hhaha'},           {$i: 'hhhaahh', $o: 'hhhahh'},
        {$i: 'ahaaahaa', $o: 'ahaaha'},         {$i: 'ahaahaaa', $o: 'ahahaa'},
        {$i: 'haaahaaa', $o: 'haahaa'},         {$i: 'haahhaah', $o: 'hahhah'},
        {$i: 'haahhhaa', $o: 'hahhha'},         {$i: 'haahaahaa', $o: 'hahaha'},
        {$i: 'haahaahhh', $o: 'hahahhh'},       {$i: 'hhaahhaah', $o: 'hhahhah'},
        {$i: 'haahhhhhhhh', $o: 'hahhhhhhhh'},  {$i: 'hhaahaahaah', $o: 'hhahahah'},
        {$i: 'hhhhhaaaaaa', $o: 'hhhhhaaaaa'},  {$i: 'aaaaaahaahaa', $o: 'aaaaaahaha'},
        {$i: 'aahaahhhaaaa', $o: 'aahahhhaaa'}, {$i: 'haaaaaaaahaa', $o: 'haaaaaaaha'},
        {$i: 'haahaahhhhhh', $o: 'hahahhhhhh'}, {$i: 'haahhhhhhhaa', $o: 'hahhhhhhha'},
        {$i: 'hhhaaaahaaaa', $o: 'hhhaaahaaa'}, {$i: 'hhhaahhhaahh', $o: 'hhhahhhahh'},
        {$i: 'hhhhaahaahhh', $o: 'hhhhahahhh'},
        {$i: 'aahaahaahaahaahh', $o: 'aahahahahahh'},
        {$i: 'haahaahahahaahaa', $o: 'hahahahahaha'},
        {$i: 'haahaahhhhhaahaa', $o: 'hahahhhhhaha'},
        {$i: 'haahaahaahaahaahaa', $o: 'hahahahahaha'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                     {$i: 'a', $o: 'a'},
        {$i: 'aaahhh', $o: 'aaahhh'},           {$i: 'aaaaaaaa', $o: 'aaaaaaaa'},
        {$i: 'aaaaahhhhh', $o: 'aaaaahhhhh'},   {$i: 'hahahahahaha', $o: 'hahahahahaha'},
        // Some Invalid Inputs
        {$i: 'hhhhhhhaaaaaaa'}, {$i: 'aaaaaaahhhhhh'},
    ];

    testGrammar({
        desc: '25b. Replace aa by a in haa: Spotchk_12 aa -> a {0+} || h_',
        grammar: Count({$o:12},
                     Replace("aa", "a", "h", EMPTY_CONTEXT)),
        //vocab: {$i:2, $o:2},
        query: inputs(io_25b),
        results: outputs(io_25b),
    });

    testGrammar({
        desc: '26a. Replace aa by a in aal: Cnt_o:4 aa -> a {0,2} || _l',
        grammar: Count({$o:4},
                     Replace("aa", "a", EMPTY_CONTEXT, "l", EMPTY_CONTEXT,
                             false, false, 0, 2)),
        //vocab: {$i:2, $o:2},
        results: [
            {},
            // Replacement 
            {$i: 'aal', $o: 'al'},     {$i: 'aaal', $o: 'aal'},
            {$i: 'aala', $o: 'ala'},   {$i: 'aall', $o: 'all'},
            {$i: 'laal', $o: 'lal'},   {$i: 'aaaal', $o: 'aaal'},
            {$i: 'aaala', $o: 'aala'}, {$i: 'aaall', $o: 'aall'},
            {$i: 'aalaa', $o: 'alaa'}, {$i: 'aalal', $o: 'alal'},
            {$i: 'aalla', $o: 'alla'}, {$i: 'aalll', $o: 'alll'},
            {$i: 'alaal', $o: 'alal'}, {$i: 'laaal', $o: 'laal'},
            {$i: 'laala', $o: 'lala'}, {$i: 'laall', $o: 'lall'},
            {$i: 'llaal', $o: 'llal'}, {$i: 'aalaal', $o: 'alal'},
            // Copy through only
            {$i: 'a', $o: 'a'},        {$i: 'l', $o: 'l'},
            {$i: 'aa', $o: 'aa'},      {$i: 'al', $o: 'al'},
            {$i: 'la', $o: 'la'},      {$i: 'll', $o: 'll'},
            {$i: 'aaa', $o: 'aaa'},    {$i: 'ala', $o: 'ala'},
            {$i: 'all', $o: 'all'},    {$i: 'laa', $o: 'laa'},
            {$i: 'lal', $o: 'lal'},    {$i: 'lla', $o: 'lla'},
            {$i: 'lll', $o: 'lll'},    {$i: 'aaaa', $o: 'aaaa'},
            {$i: 'alaa', $o: 'alaa'},  {$i: 'alal', $o: 'alal'},
            {$i: 'alla', $o: 'alla'},  {$i: 'alll', $o: 'alll'},
            {$i: 'laaa', $o: 'laaa'},  {$i: 'lala', $o: 'lala'},
            {$i: 'lall', $o: 'lall'},  {$i: 'llaa', $o: 'llaa'},
            {$i: 'llal', $o: 'llal'},  {$i: 'llla', $o: 'llla'},
            {$i: 'llll', $o: 'llll'},
        ],
    });

    // Full Generation:
    //  $o Count=10: 2048 results
    //  $o Count=11: 4096 results
    //  $o Count=12: 8192 results
    // Here we spot check some of the possible 8192 results for
    // $o with 12 characters or less.
    const io_26b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'aal', $o: 'al'},                  {$i: 'aaal', $o: 'aal'},
        {$i: 'aala', $o: 'ala'},                {$i: 'laall', $o: 'lall'},
        {$i: 'aalaal', $o: 'alal'},             {$i: 'aaaalaa', $o: 'aaalaa'},
        {$i: 'aaalaal', $o: 'aalal'},           {$i: 'aalaala', $o: 'alala'},
        {$i: 'aalaall', $o: 'alall'},           {$i: 'aallaal', $o: 'allal'},
        {$i: 'laalaal', $o: 'lalal'},           {$i: 'llaalll', $o: 'llalll'},
        {$i: 'aaalaaal', $o: 'aalaal'},         {$i: 'aaalaala', $o: 'aalala'},
        {$i: 'aalaaala', $o: 'alaala'},         {$i: 'aallaall', $o: 'allall'},
        {$i: 'aalllaal', $o: 'alllal'},         {$i: 'aalaalaal', $o: 'alalal'},
        {$i: 'aalaallll', $o: 'alallll'},       {$i: 'laallaall', $o: 'lallall'},
        {$i: 'aalllllllll', $o: 'alllllllll'},  {$i: 'laalaalaall', $o: 'lalalall'},
        {$i: 'llllaalaaaa', $o: 'llllalaaaa'},  {$i: 'aaaaaaaalaal', $o: 'aaaaaaalal'},
        {$i: 'aaaalllaalaa', $o: 'aaalllalaa'}, {$i: 'aalaaaaaaaal', $o: 'alaaaaaaal'},
        {$i: 'aalaalllllll', $o: 'alalllllll'}, {$i: 'aalllllllaal', $o: 'alllllllal'},
        {$i: 'llaalaaaalaa', $o: 'llalaaalaa'}, {$i: 'llaalllaalll', $o: 'llalllalll'},
        {$i: 'lllaalaallll', $o: 'lllalallll'},
        {$i: 'aaaaaaaaaaaal', $o: 'aaaaaaaaaaal'},
        {$i: 'aalaaaaaaaaaa', $o: 'alaaaaaaaaaa'},
        {$i: 'lllllaalaaaaa', $o: 'lllllalaaaaa'},
        {$i: 'llaallaallaalll', $o: 'llallallalll'},
        {$i: 'aalaalaalaalaalaal', $o: 'alalalalalal'},
        // Some Valid Inputs - Copy through
        {$i: 'a', $o: 'a'},                     {$i: 'l', $o: 'l'},
        {$i: 'lllaaa', $o: 'lllaaa'},           {$i: 'aaaaaaaa', $o: 'aaaaaaaa'},
        {$i: 'lllllaaaaa', $o: 'lllllaaaaa'},   {$i: 'alalalalalal', $o: 'alalalalalal'},
        {$i: 'llllllaaaaaa', $o: 'llllllaaaaaa'},
        // Some Invalid Inputs
        {$i: 'lllllllaaaaaa'},  {$i: 'llllllaalaaaaa'},
    ];

    testGrammar({
        desc: '26b. Replace aa by a in aal: Spotchk_12 aa -> a {0+} || _l',
        grammar: Count({$o:12},
                     Replace("aa", "a", EMPTY_CONTEXT, "l")),
        //vocab: {$i:2, $o:2},
        query: inputs(io_26b),
        results: outputs(io_26b),
    });

    testGrammar({
        desc: '27. Replace aa by a: Cnt_o:3 aa -> a {0+} (vocab $i:ahl)',
        grammar: Count({$o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("aa", "a", EMPTY_CONTEXT, EMPTY_CONTEXT))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'aa', $o: 'a'},      {$i: 'aaa', $o: 'aa'},
            {$i: 'aah', $o: 'ah'},    {$i: 'aal', $o: 'al'},
            {$i: 'haa', $o: 'ha'}, {$i: 'laa', $o: 'la'},
            // See test 36a for a discussion of the following 2 results.
            {$i: 'aaaa', $o: 'aa'},  // (aa)(aa) -> (a)(a)
            {$i: 'aaaa', $o: 'aaa'}, // a(aa)a -> a(a)a which is valid
            {$i: 'aaah', $o: 'aah'},  {$i: 'aaal', $o: 'aal'},
            {$i: 'aaha', $o: 'aha'},  {$i: 'aahh', $o: 'ahh'},
            {$i: 'aahl', $o: 'ahl'},  {$i: 'aala', $o: 'ala'},
            {$i: 'aalh', $o: 'alh'},  {$i: 'aall', $o: 'all'},
            {$i: 'ahaa', $o: 'aha'},  {$i: 'alaa', $o: 'ala'},
            {$i: 'haaa', $o: 'haa'},  {$i: 'haah', $o: 'hah'},
            {$i: 'haal', $o: 'hal'},  {$i: 'hhaa', $o: 'hha'},
            {$i: 'hlaa', $o: 'hla'},  {$i: 'laaa', $o: 'laa'},
            {$i: 'laah', $o: 'lah'},  {$i: 'laal', $o: 'lal'},
            {$i: 'lhaa', $o: 'lha'},  {$i: 'llaa', $o: 'lla'},
            {$i: 'aaaaa', $o: 'aaa'}, {$i: 'aaaah', $o: 'aah'},
            {$i: 'aaaal', $o: 'aal'}, {$i: 'aahaa', $o: 'aha'},
            {$i: 'aalaa', $o: 'ala'}, {$i: 'haaaa', $o: 'haa'},
            {$i: 'laaaa', $o: 'laa'}, {$i: 'aaaaaa', $o: 'aaa'},
            // Copy through only
            {$i: 'a', $o: 'a'},       {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},       {$i: 'ah', $o: 'ah'},
            {$i: 'al', $o: 'al'},     {$i: 'ha', $o: 'ha'},
            {$i: 'hh', $o: 'hh'},     {$i: 'hl', $o: 'hl'},
            {$i: 'la', $o: 'la'},     {$i: 'lh', $o: 'lh'},
            {$i: 'll', $o: 'll'},     {$i: 'aha', $o: 'aha'},
            {$i: 'ahh', $o: 'ahh'},   {$i: 'ahl', $o: 'ahl'},
            {$i: 'ala', $o: 'ala'},   {$i: 'alh', $o: 'alh'},
            {$i: 'all', $o: 'all'},   {$i: 'hah', $o: 'hah'},
            {$i: 'hal', $o: 'hal'},   {$i: 'hha', $o: 'hha'},
            {$i: 'hhh', $o: 'hhh'},   {$i: 'hhl', $o: 'hhl'},
            {$i: 'hla', $o: 'hla'},   {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'},   {$i: 'lah', $o: 'lah'},
            {$i: 'lal', $o: 'lal'},   {$i: 'lha', $o: 'lha'},
            {$i: 'lhh', $o: 'lhh'},   {$i: 'lhl', $o: 'lhl'},
            {$i: 'lla', $o: 'lla'},   {$i: 'llh', $o: 'llh'},
            {$i: 'lll', $o: 'lll'},
        ],
        allowDuplicateOutputs: true,
    });

    testGrammar({
        desc: '28a. Insert a in h_l: Cnt_i:3 0 -> a {0+} || h_l',
        grammar: Count({$i:3},
                     Replace("", "a", "h", "l")),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Insertion
            {$i: 'hl', $o: 'hal'},
            {$i: 'ahl', $o: 'ahal'}, {$i: 'hhl', $o: 'hhal'},
            {$i: 'hla', $o: 'hala'}, {$i: 'hlh', $o: 'halh'},
            {$i: 'hll', $o: 'hall'}, {$i: 'lhl', $o: 'lhal'},
            // Copy through only
            {$i: 'a', $o: 'a'},      {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},      {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'},    {$i: 'al', $o: 'al'},
            {$i: 'ha', $o: 'ha'},    {$i: 'hh', $o: 'hh'},
            {$i: 'la', $o: 'la'},    {$i: 'lh', $o: 'lh'},
            {$i: 'll', $o: 'll'},    {$i: 'aaa', $o: 'aaa'},
            {$i: 'aah', $o: 'aah'},  {$i: 'aal', $o: 'aal'},
            {$i: 'aha', $o: 'aha'},  {$i: 'ahh', $o: 'ahh'},
            {$i: 'ala', $o: 'ala'},  {$i: 'alh', $o: 'alh'},
            {$i: 'all', $o: 'all'},  {$i: 'haa', $o: 'haa'},
            {$i: 'hah', $o: 'hah'},  {$i: 'hal', $o: 'hal'},
            {$i: 'hha', $o: 'hha'},  {$i: 'hhh', $o: 'hhh'},
            {$i: 'laa', $o: 'laa'},  {$i: 'lah', $o: 'lah'},
            {$i: 'lal', $o: 'lal'},  {$i: 'lha', $o: 'lha'},
            {$i: 'lhh', $o: 'lhh'},  {$i: 'lla', $o: 'lla'},
            {$i: 'llh', $o: 'llh'},  {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  $i Count=8: 9841 results
    //  $i Count=9: 29524 results
    //  $i Count=10: 88573 results
    // Here we spot check some of the possible 88573 results for
    // $i with 10 characters or less.
    const io_28b: StringDict[] = [
        // Some Valid Inputs - Insertion
        {$i: 'hl', $o: 'hal'},                  {$i: 'ahl', $o: 'ahal'},
        {$i: 'hla', $o: 'hala'},                {$i: 'ahla', $o: 'ahala'},
        {$i: 'lhlh', $o: 'lhalh'},              {$i: 'lhll', $o: 'lhall'},
        {$i: 'hlhl', $o: 'halhal'},             {$i: 'hlahl', $o: 'halahal'},
        {$i: 'hlhhlh', $o: 'halhhalh'},         {$i: 'hlhlhl', $o: 'halhalhal'},
        {$i: 'hhlhhll', $o: 'hhalhhall'},       {$i: 'hhhhhlllll', $o: 'hhhhhalllll'},
        {$i: 'hlhhhhhhhl', $o: 'halhhhhhhhal'}, {$i: 'hlhlhlhlhl', $o: 'halhalhalhalhal'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                     {$i: 'hahaha', $o: 'hahaha'},
        {$i: 'lllllhhhhh', $o: 'lllllhhhhh'},   {$i: 'halhalhalh', $o: 'halhalhalh'},
        // Some Invalid Inputs
        {$i: 'hhhhhhhhhhh'},  {$i: 'hlaaaaaaaaa'},
    ];

    testGrammar({
        desc: '28b. Insert a in h_l: Spotchk_10 0 -> a {0+} || h_l',
        grammar: Count({$i:10},
                     Replace("", "a", "h", "l")),
        //vocab: {$i:3, $o:3},
        query: inputs(io_28b),
        results: outputs(io_28b),
    });

    testGrammar({
        desc: '29a. Delete a in hal: Cnt_o:3 a -> 0 {0+} || h_l',
        grammar: Count({$o:3},
                     Replace("a", "", "h", "l")),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Deletion
            {$i: 'hal', $o: 'hl'},
            {$i: 'ahal', $o: 'ahl'}, {$i: 'hhal', $o: 'hhl'},
            {$i: 'hala', $o: 'hla'}, {$i: 'halh', $o: 'hlh'},
            {$i: 'hall', $o: 'hll'}, {$i: 'lhal', $o: 'lhl'},
            // Copy through only
            {$i: 'a', $o: 'a'},      {$i: 'h', $o: 'h'},
            {$i: 'l', $o: 'l'},      {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'},    {$i: 'al', $o: 'al'},
            {$i: 'ha', $o: 'ha'},    {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},    {$i: 'la', $o: 'la'},
            {$i: 'lh', $o: 'lh'},    {$i: 'll', $o: 'll'},
            {$i: 'aaa', $o: 'aaa'},  {$i: 'aah', $o: 'aah'},
            {$i: 'aal', $o: 'aal'},  {$i: 'aha', $o: 'aha'},
            {$i: 'ahh', $o: 'ahh'},  {$i: 'ahl', $o: 'ahl'},
            {$i: 'ala', $o: 'ala'},  {$i: 'alh', $o: 'alh'},
            {$i: 'all', $o: 'all'},  {$i: 'haa', $o: 'haa'},
            {$i: 'hah', $o: 'hah'},  {$i: 'hha', $o: 'hha'},
            {$i: 'hhh', $o: 'hhh'},  {$i: 'hhl', $o: 'hhl'},
            {$i: 'hla', $o: 'hla'},  {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'},  {$i: 'laa', $o: 'laa'},
            {$i: 'lah', $o: 'lah'},  {$i: 'lal', $o: 'lal'},
            {$i: 'lha', $o: 'lha'},  {$i: 'lhh', $o: 'lhh'},
            {$i: 'lhl', $o: 'lhl'},  {$i: 'lla', $o: 'lla'},
            {$i: 'llh', $o: 'llh'},  {$i: 'lll', $o: 'lll'},
        ],
    });

    // Full Generation:
    //  $o Count=8: 15853 results
    //  $o Count=9: 50637 results
    //  $o Count=10: 161304 results
    // Here we spot check some of the possible 161304 results for
    // $o with 10 characters or less.
    const io_29b: StringDict[] = [
        // Some Valid Inputs - Deletion
        {$i: 'hal', $o: 'hl'},                  {$i: 'lhalh', $o: 'lhlh'},
        {$i: 'lhall', $o: 'lhll'},              {$i: 'halhal', $o: 'hlhl'},
        {$i: 'halhhalh', $o: 'hlhhlh'},         {$i: 'halhalhal', $o: 'hlhlhl'},
        {$i: 'hhalhhall', $o: 'hhlhhll'},       {$i: 'halhlhlhlhl', $o: 'hlhlhlhlhl'},
        {$i: 'hhhhhalllll', $o: 'hhhhhlllll'},  {$i: 'hlhlhalhlhl', $o: 'hlhlhlhlhl'},
        {$i: 'hlhlhlhlhal', $o: 'hlhlhlhlhl'},  {$i: 'halhhhhhhhal', $o: 'hlhhhhhhhl'},
        {$i: 'halhlhlhlhal', $o: 'hlhlhlhlhl'}, {$i: 'halhalhalhalhal', $o: 'hlhlhlhlhl'},
        // Some Valid Inputs - Copy through
        {$i: 'h', $o: 'h'},                     {$i: 'hlhl', $o: 'hlhl'},
        {$i: 'lllllhhhhh', $o: 'lllllhhhhh'},
        // Some Invalid Inputs
        {$i: 'hlhlhlhlhla'},  {$i: 'halhlhlhlhlh'},
    ];

    testGrammar({
        desc: '29b. Delete a in hal: Spotchk_10 a -> 0 {0+} || h_l',
        grammar: Count({$o:10},
                     Replace("a", "", "h", "l")),
        //vocab: {$i:3, $o:3},
        query: inputs(io_29b),
        results: outputs(io_29b),
    });

    const io_30a: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},             {$i: 'hiy', $o: 'hay'},
        {$i: 'ahil', $o: 'ahal'},           {$i: 'ahiy', $o: 'ahay'},
        {$i: 'hhil', $o: 'hhal'},           {$i: 'hhiy', $o: 'hhay'},
        {$i: 'hila', $o: 'hala'},           {$i: 'hiya', $o: 'haya'},
        {$i: 'hhill', $o: 'hhall'},         {$i: 'hhiyy', $o: 'hhayy'},
        {$i: 'hilhil', $o: 'halhal'},       {$i: 'hilhiy', $o: 'halhay'},
        {$i: 'hiyhiy', $o: 'hayhay'},       {$i: 'hilhilhil', $o: 'halhalhal'},
        {$i: 'hilhiyhil', $o: 'halhayhal'}, {$i: 'hiyhiyhiy', $o: 'hayhayhay'},
        {$i: 'ihiyihili', $o: 'ihayihali'}, {$i: 'hlhhilllll', $o: 'hlhhalllll'},
        {$i: 'hlhhiyyyyy', $o: 'hlhhayyyyy'},
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},               {$i: 'hah', $o: 'hah'},
        {$i: 'hih', $o: 'hih'},             {$i: 'lil', $o: 'lil'},
        {$i: 'hhiiill', $o: 'hhiiill'},     {$i: 'hhhiiillla', $o: 'hhhiiillla'},
        {$i: 'hihhihhiha', $o: 'hihhihhiha'},
        // Some Invalid Inputs
        {$i: 'hhhiiilllyy'},  {$i: 'iihiyihilii'},
        {$i: 'hilhiyhilhiy'},
    ];

    testGrammar({
        desc: '30a. Replace i by a in hil and hiy: Spotchk_10 ' +
              'i -> a {0+} || h_l|y',
        grammar: Count({$i:10},
                     Replace("i", "a", "h", Uni("l", "y"))),
        //vocab: {$i:5, $o:5},
        query: inputs(io_30a),
        results: outputs(io_30a),
    });

    const io_30b: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},             {$i: 'yil', $o: 'yal'},
        {$i: 'ahil', $o: 'ahal'},           {$i: 'ayil', $o: 'ayal'},
        {$i: 'ihil', $o: 'ihal'},           {$i: 'iyil', $o: 'iyal'},
        {$i: 'hili', $o: 'hali'},           {$i: 'yili', $o: 'yali'},
        {$i: 'hhill', $o: 'hhall'},         {$i: 'yyill', $o: 'yyall'},
        {$i: 'hilhil', $o: 'halhal'},       {$i: 'hilyil', $o: 'halyal'},
        {$i: 'yilyil', $o: 'yalyal'},       {$i: 'hilhilhil', $o: 'halhalhal'},
        {$i: 'hilyilhil', $o: 'halyalhal'}, {$i: 'iyilihili', $o: 'iyalihali'},
        {$i: 'yilyilyil', $o: 'yalyalyal'}, {$i: 'hlhhilllll', $o: 'hlhhalllll'},
        {$i: 'ylyyilllll', $o: 'ylyyalllll'},
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},               {$i: 'hah', $o: 'hah'},
        {$i: 'hih', $o: 'hih'},             {$i: 'lil', $o: 'lil'},
        {$i: 'hhiiill', $o: 'hhiiill'},     {$i: 'hhhiiillla', $o: 'hhhiiillla'},
        {$i: 'lillillila', $o: 'lillillila'},
        // Some Invalid Inputs
        {$i: 'hhhiiilllyy'},  {$i: 'iiyilihilii'},
        {$i: 'hilyilhilyil'},
    ];

    testGrammar({
        desc: '30b. Replace i by a in hil and yil: Spotchk_10 ' +
              'i -> a {0+} || h|y_l',
        grammar: Count({$i:10},
                     Replace("i", "a", Uni("h", "y"), "l")),
        //vocab: {$i:5, $o:5},
        query: inputs(io_30b),
        results: outputs(io_30b),
    });

    const io_31a: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},               {$i: 'hol', $o: 'hal'},
        {$i: 'hhil', $o: 'hhal'},             {$i: 'hhol', $o: 'hhal'},
        {$i: 'hilo', $o: 'halo'},             {$i: 'holi', $o: 'hali'},
        {$i: 'hhill', $o: 'hhall'},           {$i: 'hholl', $o: 'hhall'},
        {$i: 'hilhil', $o: 'halhal'},         {$i: 'hilhol', $o: 'halhal'},
        {$i: 'holhol', $o: 'halhal'},         {$i: 'hilhilhil', $o: 'halhalhal'},
        {$i: 'hilholhil', $o: 'halhalhal'},   {$i: 'holhilhol', $o: 'halhalhal'},
        {$i: 'holholhol', $o: 'halhalhal'},   {$i: 'hlhhilllll', $o: 'hlhhalllll'},
        {$i: 'hlhholllll', $o: 'hlhhalllll'}, {$i: 'ihilhilhil', $o: 'ihalhalhal'},
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl'},                 {$i: 'hih', $o: 'hih'},
        {$i: 'lil', $o: 'lil'},               {$i: 'hhhiioolll', $o: 'hhhiioolll'},
        {$i: 'ihalhalhal', $o: 'ihalhalhal'},
        // Some Invalid Inputs
        {$i: 'ahilholhila'},  {$i: 'hhhiiooolll'},
    ];

    testGrammar({
        desc: '31a. Replace i or o by a in hil and hol: Spotchk_10 ' +
              'i|o -> a {0+} || h_l',
        grammar: Count({$i:10},
                     Replace(Uni("i", "o"), "a","h", "l")),
        //vocab: {$i:5, $o:5},
        query: inputs(io_31a),
        results: outputs(io_31a),
    });

    testGrammar({
        desc: '31b. Replace i by a or o in aio: Cnt_3 ' +
              'i -> a|o {0+} || a_o',
        grammar: Count({$i:3},
                     Replace("i", Uni("a", "o"), "a", "o")),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            // Replacement
            {$i: 'aio', $o: 'aao'}, {$i: 'aio', $o: 'aoo'},
            // Copy through only
            {$i: 'i', $o: 'i'},     {$i: 'a', $o: 'a'},
            {$i: 'o', $o: 'o'},     {$i: 'ii', $o: 'ii'},
            {$i: 'ia', $o: 'ia'},   {$i: 'io', $o: 'io'},
            {$i: 'ai', $o: 'ai'},   {$i: 'aa', $o: 'aa'},
            {$i: 'ao', $o: 'ao'},   {$i: 'oi', $o: 'oi'},
            {$i: 'oa', $o: 'oa'},   {$i: 'oo', $o: 'oo'},
            {$i: 'iii', $o: 'iii'}, {$i: 'iia', $o: 'iia'},
            {$i: 'iio', $o: 'iio'}, {$i: 'iai', $o: 'iai'},
            {$i: 'iaa', $o: 'iaa'}, {$i: 'iao', $o: 'iao'},
            {$i: 'ioi', $o: 'ioi'}, {$i: 'ioa', $o: 'ioa'},
            {$i: 'ioo', $o: 'ioo'}, {$i: 'aii', $o: 'aii'},
            {$i: 'aia', $o: 'aia'}, {$i: 'aai', $o: 'aai'},
            {$i: 'aaa', $o: 'aaa'}, {$i: 'aao', $o: 'aao'},
            {$i: 'aoi', $o: 'aoi'}, {$i: 'aoa', $o: 'aoa'},
            {$i: 'aoo', $o: 'aoo'}, {$i: 'oii', $o: 'oii'},
            {$i: 'oia', $o: 'oia'}, {$i: 'oio', $o: 'oio'},
            {$i: 'oai', $o: 'oai'}, {$i: 'oaa', $o: 'oaa'},
            {$i: 'oao', $o: 'oao'}, {$i: 'ooi', $o: 'ooi'},
            {$i: 'ooa', $o: 'ooa'}, {$i: 'ooo', $o: 'ooo'},
        ],
    });

    const io_31c: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal'},     {$i: 'hil', $o: 'hol'},
        {$i: 'hhil', $o: 'hhal'},   {$i: 'hhil', $o: 'hhol'},
        {$i: 'hila', $o: 'hala'},   {$i: 'hila', $o: 'hola'},
        {$i: 'hilo', $o: 'halo'},   {$i: 'hilo', $o: 'holo'},
        {$i: 'lhil', $o: 'lhal'},   {$i: 'lhil', $o: 'lhol'},
        {$i: 'hhilh', $o: 'hhalh'}, {$i: 'hhilh', $o: 'hholh'},
        {$i: 'hhill', $o: 'hhall'}, {$i: 'hhill', $o: 'hholl'},
        {$i: 'lhilh', $o: 'lhalh'}, {$i: 'lhilh', $o: 'lholh'},
        {$i: 'lhill', $o: 'lhall'}, {$i: 'lhill', $o: 'lholl'},
        {$i: 'ohilo', $o: 'ohalo'}, {$i: 'ohilo', $o: 'oholo'},
        // Some Valid Inputs - Copy through
        {$i: 'iii', $o: 'iii'},     {$i: 'aiohl', $o: 'aiohl'},
        {$i: 'lilii', $o: 'lilii'}, {$i: 'ohalo', $o: 'ohalo'},
        {$i: 'oholo', $o: 'oholo'},
        // Some Invalid Inputs
        {$i: 'halhal'},  {$i: 'hilhil'},
        {$i: 'holhol'},  {$i: 'oahilo'},
    ];

    testGrammar({
        desc: '31c. Replace i by a or o in hil: Spotchk_5 ' +
              'i -> a|o {0+} || h_l',
        grammar: Count({$i:5, $o:5},
                     Replace("i", Uni("a", "o"), "h", "l")),
        //vocab: {$i:5, $o:5},
        query: inputs(io_31c),
        results: outputs(io_31c),
    });

    const io_32: StringDict[] = [
        // Some Valid Inputs - Replacement
        {$i: 'hil', $o: 'hal', t3: '[1SG]'},
        {$i: 'ahila', $o: 'ahala', t3: '[1SG]'},
        {$i: 'lhhilhl', $o: 'lhhalhl', t3: '[1SG]'},
        {$i: 'hilhilhil', $o: 'halhalhal', t3: '[1SG]'},
        {$i: 'lhillhhil', $o: 'lhallhhal', t3: '[1SG]'},
        {$i: 'hlhhilllll', $o: 'hlhhalllll', t3: '[1SG]'},
        {$i: 'lhilhhllhil', $o: 'lhalhhllhal', t3: '[1SG]'},
        {$i: 'hilhilhilhil', $o: 'halhalhalhal', t3: '[1SG]'},
        {$i: 'ahilhilhilhila', $o: 'ahalhalhalhala', t3: '[1SG]'},
        {$i: 'hilahilhilahil', $o: 'halahalhalahal', t3: '[1SG]'},
        {$i: 'hilhhhhllllhil', $o: 'halhhhhllllhal', t3: '[1SG]'},
        {$i: 'iihilaaaahilii', $o: 'iihalaaaahalii', t3: '[1SG]'},
        {$i: 'iihiliiiihilii', $o: 'iihaliiiihalii', t3: '[1SG]'},
        {$i: 'lhilhilhhlhill', $o: 'lhalhalhhlhall', t3: '[1SG]'},
        // Some Valid Inputs - Copy through
        {$i: 'hl', $o: 'hl', t3: '[1SG]'},
        {$i: 'hal', $o: 'hal', t3: '[1SG]'},
        {$i: 'hih', $o: 'hih', t3: '[1SG]'},
        {$i: 'lil', $o: 'lil', t3: '[1SG]'},
        {$i: 'halhalhalhal', $o: 'halhalhalhal', t3: '[1SG]'},
        {$i: 'hhhhhlllliiiii', $o: 'hhhhhlllliiiii', t3: '[1SG]'},
        {$i: 'hil', $o: 'hil', t3: '[1]'},
        {$i: 'hhill', $o: 'hhill', t3: '[1]'},
        {$i: 'lhhilhl', $o: 'lhhilhl', t3: '[1]'},
        {$i: 'hilhilhil', $o: 'hilhilhil', t3: '[1]'},
        {$i: 'lhillhhil', $o: 'lhillhhil', t3: '[1]'},
        {$i: 'hlhhilllll', $o: 'hlhhilllll', t3: '[1]'},
        {$i: 'lhilhhllhil', $o: 'lhilhhllhil', t3: '[1]'},
        {$i: 'hilhilhilhil', $o: 'hilhilhilhil', t3: '[1]'},
        {$i: 'ahilhilhilhila', $o: 'ahilhilhilhila', t3: '[1]'},
        {$i: 'hilahilhilahil', $o: 'hilahilhilahil', t3: '[1]'},
        {$i: 'hilhhhhllllhil', $o: 'hilhhhhllllhil', t3: '[1]'},
        {$i: 'iihilaaaahilii', $o: 'iihilaaaahilii', t3: '[1]'},
        {$i: 'iihiliiiihilii', $o: 'iihiliiiihilii', t3: '[1]'},
        {$i: 'lhilhilhhlhill', $o: 'lhilhilhhlhill', t3: '[1]'},
        {$i: 'hil', $o: 'hil', t3: EMPTY},
        {$i: 'hhill', $o: 'hhill', t3: EMPTY},
        {$i: 'lhhilhl', $o: 'lhhilhl', t3: EMPTY},
        {$i: 'hilhilhil', $o: 'hilhilhil', t3: EMPTY},
        {$i: 'lhillhhil', $o: 'lhillhhil', t3: EMPTY},
        {$i: 'hlhhilllll', $o: 'hlhhilllll', t3: EMPTY},
        {$i: 'lhilhhllhil', $o: 'lhilhhllhil', t3: EMPTY},
        {$i: 'hilhilhilhil', $o: 'hilhilhilhil', t3: EMPTY},
        {$i: 'ahilhilhilhila', $o: 'ahilhilhilhila', t3: EMPTY},
        {$i: 'hilahilhilahil', $o: 'hilahilhilahil', t3: EMPTY},
        {$i: 'hilhhhhllllhil', $o: 'hilhhhhllllhil', t3: EMPTY},
        {$i: 'iihilaaaahilii', $o: 'iihilaaaahilii', t3: EMPTY},
        {$i: 'iihiliiiihilii', $o: 'iihiliiiihilii', t3: EMPTY},
        {$i: 'lhilhilhhlhill', $o: 'lhilhilhhlhill', t3: EMPTY},
        // Some Invalid Inputs
        {$i: 'halhalhalhalhal', t3: '[1SG]'},
        {$i: 'hilhilhilhilhil', t3: '[1SG]'},
        {$i: 'hiliiihhhlllhil', t3: '[1SG]'},
        {$i: 'hiliiihhhlllhil', t3: '[1]'},
        {$i: 'hiliiihhhlllhil', t3: EMPTY},
    ];

    testGrammar({
        desc: '32. Replace i by a in hil: Spotchk_14 ' +
              'i -> a {0+} || h_l + t3:[1SG]',
        grammar: Count({$i:14, $o:14},
                     Replace("i", "a", "h", "l", t3("[1SG]"))),
        //vocab: {
        //    $i:["a","h","i","l"], 
        //    $o:["a","h","i","l"], 
        //    t3:["[","1","S","G","]"]
        //},
        query: inputs(io_32),
        results: outputs(io_32),
    });

    testGrammar({
        desc: '33a. Replace ε by a: Cnt_3 ε -> a {0+} || #_ ($o:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 EMPTY_CONTEXT, true, false))),
        //vocab: {$i:3, $o:3},
        results: [
            {$o: 'a'},  // equivalent to {$i: '', $o: 'a'}
            {$i: 'a', $o: 'aa'},   {$i: 'h', $o: 'ah'},
            {$i: 'l', $o: 'al'},   {$i: 'aa', $o: 'aaa'},
            {$i: 'ah', $o: 'aah'}, {$i: 'al', $o: 'aal'},
            {$i: 'ha', $o: 'aha'}, {$i: 'hh', $o: 'ahh'},
            {$i: 'hl', $o: 'ahl'}, {$i: 'la', $o: 'ala'},
            {$i: 'lh', $o: 'alh'}, {$i: 'll', $o: 'all'},
        ],
    });

    testGrammar({
        desc: '33b. Replace ε by a: Cnt_3 ε -> a {0+} || _# (vocab $o:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 EMPTY_CONTEXT, false, true))),
        //vocab: {$i:3, $o:3},
        results: [
            {$o: 'a'},  // equivalent to {$i: '', $o: 'a'}
            {$i: 'a', $o: 'aa'},   {$i: 'h', $o: 'ha'},
            {$i: 'l', $o: 'la'},   {$i: 'aa', $o: 'aaa'},
            {$i: 'ah', $o: 'aha'}, {$i: 'al', $o: 'ala'},
            {$i: 'ha', $o: 'haa'}, {$i: 'hh', $o: 'hha'},
            {$i: 'hl', $o: 'hla'}, {$i: 'la', $o: 'laa'},
            {$i: 'lh', $o: 'lha'}, {$i: 'll', $o: 'lla'},
        ],
    });

    testGrammar({
        desc: '33c. Replace ε by a: Cnt_3 ε -> a {0+} || #_# (vocab $o:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 EMPTY_CONTEXT, true, true))),
        //vocab: {$i:3, $o:3},
        results: [
            {$o: 'a'},  // equivalent to {$i: '', $o: 'a'}
        ],
    });

    testGrammar({
        desc: '33d. Replace ε by a: Cnt_3 ε -> a {0+} (vocab $o:ahl)',
        // This replacement is not allowed for Replace with optional=flase.
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 Replace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 EMPTY_CONTEXT, false, false))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
        ],
        numErrors: 1,
    });

    /*
    testGrammar({
        desc: '33e. Replace ε by a, optional: Cnt_3 ε -> a {1} (vocab $o:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                         EMPTY_CONTEXT, false, false, 1, 1))),
        //vocab: {$i:3, $o:3},
        results: [
            {$o: 'a'},   // equivalent to {$i: '', $o: 'a'}
            {$i: 'a', $o: 'aa'},   {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},   {$i: 'l', $o: 'al'},
            {$i: 'l', $o: 'la'},   {$i: 'aa', $o: 'aaa'},
            {$i: 'ah', $o: 'aah'}, {$i: 'ah', $o: 'aha'},
            {$i: 'al', $o: 'aal'}, {$i: 'al', $o: 'ala'},
            {$i: 'ha', $o: 'aha'}, {$i: 'ha', $o: 'haa'},
            {$i: 'hh', $o: 'ahh'}, {$i: 'hh', $o: 'hah'},
            {$i: 'hh', $o: 'hha'}, {$i: 'hl', $o: 'ahl'},
            {$i: 'hl', $o: 'hal'}, {$i: 'hl', $o: 'hla'},
            {$i: 'la', $o: 'ala'}, {$i: 'la', $o: 'laa'},
            {$i: 'lh', $o: 'alh'}, {$i: 'lh', $o: 'lah'},
            {$i: 'lh', $o: 'lha'}, {$i: 'll', $o: 'all'},
            {$i: 'll', $o: 'lal'}, {$i: 'll', $o: 'lla'},
        ],
        allowDuplicateOutputs: true,
    });
    */

    testGrammar({
        desc: '33f. Replace ε by a, optional: Cnt_3 ε -> a {0+} (vocab $o:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$o:'ahl'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                         EMPTY_CONTEXT, false, false))),
        //vocab: {$i:3, $o:3},
        results: [
            // 1, 2 or 3 insertions
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$o: 'aa'},     // equivalent to {$i: '', $o: 'aa'}
            {$o: 'aaa'},    // equivalent to {$i: '', $o: 'aaa'}
            {$i: 'a', $o: 'aa'},    {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},    {$i: 'l', $o: 'al'},
            {$i: 'l', $o: 'la'},    {$i: 'a', $o: 'aaa'},
            {$i: 'h', $o: 'aah'},   {$i: 'h', $o: 'aha'},
            {$i: 'h', $o: 'haa'},   {$i: 'l', $o: 'aal'},
            {$i: 'l', $o: 'ala'},   {$i: 'l', $o: 'laa'},
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
            // Copy-through: 0 insertions
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
        desc: '33g. Replace ε by a, optional: Cnt_i:1_2:5 ε -> a {0+} (vocab $i:ah)',
        grammar: Count({$i:1, $o:5},
        			 WithVocab({$i:'ah'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                         EMPTY_CONTEXT, false, false))),
        //vocab: {$i:2, $o:2},
        results: [
            // 1-5 Insertions
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$o: 'aa'},     // equivalent to {$i: '', $o: 'aa'}
            {$o: 'aaa'},    // equivalent to {$i: '', $o: 'aaa'}
            {$o: 'aaaa'},   // equivalent to {$i: '', $o: 'aaaa'}
            {$o: 'aaaaa'},  // equivalent to {$i: '', $o: 'aaaaa'}
            {$i: 'a', $o: 'aa'},    {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},    {$i: 'a', $o: 'aaa'},
            {$i: 'h', $o: 'aah'},   {$i: 'h', $o: 'aha'},
            {$i: 'h', $o: 'haa'},   {$i: 'a', $o: 'aaaa'},
            {$i: 'h', $o: 'aaah'},  {$i: 'h', $o: 'aaha'},
            {$i: 'h', $o: 'ahaa'},  {$i: 'h', $o: 'haaa'},
            {$i: 'a', $o: 'aaaaa'}, {$i: 'h', $o: 'aaaah'},
            {$i: 'h', $o: 'aaaha'}, {$i: 'h', $o: 'aahaa'},
            {$i: 'h', $o: 'ahaaa'}, {$i: 'h', $o: 'haaaa'},
            // Copy-through: 0 insertions
            {},             // equivalent to {$i: '', $o: ''}
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
        ],
    });

    testGrammar({
        desc: '33h. Replace ε by a, optional: Cnt_i:2_o:4 ε -> a {0+} (vocab $i:ah)',
        grammar: Count({$i:2, $o:4},
        			 WithVocab({$i:'ah'},
                     	 OptionalReplace("", "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                         EMPTY_CONTEXT, false, false))),
        //vocab: {$i:2, $o:2},
        results: [
            // 1-4 Insertions
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$o: 'aa'},    // equivalent to {$i: '', $o: 'aa'}
            {$o: 'aaa'},    // equivalent to {$i: '', $o: 'aaa'}
            {$o: 'aaaa'},   // equivalent to {$i: '', $o: 'aaaa'}
            {$i: 'a', $o: 'aa'},    {$i: 'h', $o: 'ah'},
            {$i: 'h', $o: 'ha'},    {$i: 'a', $o: 'aaa'},
            {$i: 'h', $o: 'aah'},   {$i: 'h', $o: 'aha'},
            {$i: 'h', $o: 'haa'},   {$i: 'a', $o: 'aaaa'},
            {$i: 'h', $o: 'aaah'},  {$i: 'h', $o: 'aaha'},
            {$i: 'h', $o: 'ahaa'},  {$i: 'h', $o: 'haaa'},
            {$i: 'aa', $o: 'aaa'},  {$i: 'ah', $o: 'aah'},
            {$i: 'ah', $o: 'aha'},  {$i: 'ha', $o: 'aha'},
            {$i: 'ha', $o: 'haa'},  {$i: 'hh', $o: 'ahh'},
            {$i: 'hh', $o: 'hah'},  {$i: 'hh', $o: 'hha'},
            {$i: 'aa', $o: 'aaaa'}, {$i: 'ah', $o: 'aaah'},
            {$i: 'ah', $o: 'aaha'}, {$i: 'ah', $o: 'ahaa'},
            {$i: 'ha', $o: 'aaha'}, {$i: 'ha', $o: 'ahaa'},
            {$i: 'ha', $o: 'haaa'}, {$i: 'hh', $o: 'aahh'},
            {$i: 'hh', $o: 'ahah'}, {$i: 'hh', $o: 'ahha'},
            {$i: 'hh', $o: 'haah'}, {$i: 'hh', $o: 'haha'},
            {$i: 'hh', $o: 'hhaa'},
            // Copy-through: 0 insertions
            {},              // equivalent to {$i: '', $o: ''}
            {$i: 'a', $o: 'a'},     {$i: 'h', $o: 'h'},
            {$i: 'aa', $o: 'aa'},   {$i: 'ah', $o: 'ah'},
            {$i: 'ha', $o: 'ha'},   {$i: 'hh', $o: 'hh'},
        ],
    });

    testGrammar({
        desc: '33i. Replace ε|h by e, optional: Cnt_i:2_o:3 ε|$i:h -> a {0+} (vocab $i:ahl)',
        grammar: Count({$i:2, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 OptionalReplace(Uni("", "h"), "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                         EMPTY_CONTEXT, false, false))),
        //vocab: {$i:3, $o:3},
        results: [
            // 1-3 Insertions, 0 Replacements
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$o: 'aa'},     // equivalent to {$i: '', $o: 'aa'}
            {$o: 'aaa'},    // equivalent to {$i: '', $o: 'aaa'}
            {$i: "a", $o: "aa"},   {$i: "h", $o: "ah"},
            {$i: "h", $o: "ha"},   {$i: "l", $o: "al"},
            {$i: "l", $o: "la"},   {$i: "a", $o: "aaa"},
            {$i: "h", $o: "aah"},  {$i: "h", $o: "aha"},
            {$i: "h", $o: "haa"},  {$i: "l", $o: "aal"},
            {$i: "l", $o: "ala"},  {$i: "l", $o: "laa"},
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
            {$i: "h", $o: "aa"},   {$i: "h", $o: "aaa"},
            {$i: "ah", $o: "aaa"}, {$i: "ha", $o: "aaa"},
            {$i: "hh", $o: "aaa"}, {$i: "hh", $o: "aah"},
            {$i: "hh", $o: "aha"}, {$i: "hh", $o: "haa"},
            {$i: "hl", $o: "aal"}, {$i: "hl", $o: "ala"},
            {$i: "lh", $o: "ala"}, {$i: "lh", $o: "laa"},
        ],
        allowDuplicateOutputs: false,
    });

    testGrammar({
        desc: '33j. Replace ε|h by a, optional: Cnt_i:3_o:4 ε|$i:h -> a {0+} (vocab $i:ah)',
        grammar: Count({$i:3, $o:4},
        			 WithVocab({$i:'ah'},
                     	 OptionalReplace(Uni("", "h"), "a", EMPTY_CONTEXT, EMPTY_CONTEXT,
                                         EMPTY_CONTEXT,false, false))),
        //vocab: {$i:2, $o:2},
        results: [
            // 1-4 Insertions, 0 Replacements
            {$o: 'a'},      // equivalent to {$i: '', $o: 'a'}
            {$o: 'aa'},     // equivalent to {$i: '', $o: 'aa'}
            {$o: 'aaa'},    // equivalent to {$i: '', $o: 'aaa'}
            {$o: 'aaaa'},   // equivalent to {$i: '', $o: 'aaaa'}
            {$i: "a", $o: "aa"},     {$i: "h", $o: "ah"},
            {$i: "h", $o: "ha"},     {$i: "a", $o: "aaa"},
            {$i: "h", $o: "aah"},    {$i: "h", $o: "aha"},
            {$i: "h", $o: "haa"},    {$i: "a", $o: "aaaa"},
            {$i: "h", $o: "aaah"},   {$i: "h", $o: "aaha"},
            {$i: "h", $o: "ahaa"},   {$i: "h", $o: "haaa"},
            {$i: "aa", $o: "aaa"},   {$i: "ah", $o: "aah"},
            {$i: "ah", $o: "aha"},   {$i: "ha", $o: "aha"},
            {$i: "ha", $o: "haa"},   {$i: "hh", $o: "ahh"},
            {$i: "hh", $o: "hah"},   {$i: "hh", $o: "hha"},
            {$i: "aa", $o: "aaaa"},  {$i: "ah", $o: "aaah"},
            {$i: "ah", $o: "aaha"},  {$i: "ah", $o: "ahaa"},
            {$i: "ha", $o: "aaha"},  {$i: "ha", $o: "ahaa"},
            {$i: "ha", $o: "haaa"},  {$i: "hh", $o: "aahh"},
            {$i: "hh", $o: "ahah"},  {$i: "hh", $o: "ahha"},
            {$i: "hh", $o: "haah"},  {$i: "hh", $o: "haha"},
            {$i: "hh", $o: "hhaa"},  {$i: "aaa", $o: "aaaa"},
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
            {$i: "h", $o: "aaaa"},   {$i: "ah", $o: "aaa"},
            {$i: "ha", $o: "aaa"},   {$i: "hh", $o: "aaa"},
            {$i: "hh", $o: "aah"},   {$i: "hh", $o: "aha"},
            {$i: "hh", $o: "haa"},   {$i: "ah", $o: "aaaa"},
            {$i: "ha", $o: "aaaa"},  {$i: "hh", $o: "aaaa"},
            {$i: "hh", $o: "aaah"},  {$i: "hh", $o: "aaha"},
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
        desc: '34a. Replace a by ε: Cnt_3 a -> ε {1} || #_ (vocab $i:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 true, false, 1, 1))),
        //vocab: {$i:3, $o:3},
        results: [
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            {$i: 'aa', $o: 'a'},   {$i: 'ah', $o: 'h'},
            {$i: 'al', $o: 'l'},   {$i: 'aaa', $o: 'aa'},
            {$i: 'aah', $o: 'ah'}, {$i: 'aal', $o: 'al'},
            {$i: 'aha', $o: 'ha'}, {$i: 'ahh', $o: 'hh'},
            {$i: 'ahl', $o: 'hl'}, {$i: 'ala', $o: 'la'},
            {$i: 'alh', $o: 'lh'}, {$i: 'all', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '34b. Replace a by ε: Cnt_3 a -> ε {1} || _# (vocab $i:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 false, true, 1, 1))),
        //vocab: {$i:3, $o:3},
        results: [
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            {$i: 'aa', $o: 'a'},   {$i: 'ha', $o: 'h'},
            {$i: 'la', $o: 'l'},   {$i: 'aaa', $o: 'aa'},
            {$i: 'aha', $o: 'ah'}, {$i: 'ala', $o: 'al'},
            {$i: 'haa', $o: 'ha'}, {$i: 'hha', $o: 'hh'},
            {$i: 'hla', $o: 'hl'}, {$i: 'laa', $o: 'la'},
            {$i: 'lha', $o: 'lh'}, {$i: 'lla', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '34c. Replace a by ε: Cnt_3 a -> a {1} || #_# (vocab $i:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 true, true, 1, 1 ))),
        //vocab: {$i:3, $o:3},
        results: [
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
        ],
    });

    testGrammar({
        desc: '34d. Replace a by ε: Cnt_3 a -> ε {1} (vocab $i:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 false, false, 1, 1))),
        //vocab: {$i:3, $o:3},
        results: [
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            {$i: 'ah', $o: 'h'},   {$i: 'al', $o: 'l'},
            {$i: 'ha', $o: 'h'},   {$i: 'la', $o: 'l'},
            {$i: 'ahh', $o: 'hh'}, {$i: 'ahl', $o: 'hl'},
            {$i: 'alh', $o: 'lh'}, {$i: 'all', $o: 'll'},
            {$i: 'hah', $o: 'hh'}, {$i: 'hal', $o: 'hl'},
            {$i: 'hha', $o: 'hh'}, {$i: 'hla', $o: 'hl'},
            {$i: 'lah', $o: 'lh'}, {$i: 'lal', $o: 'll'},
            {$i: 'lha', $o: 'lh'}, {$i: 'lla', $o: 'll'},
        ],
    });

    testGrammar({
        desc: '34e. Replace a by ε: Cnt_3 a -> ε {0,2} (vocab $i:ahl)',
        grammar: Count({$i:3, $o:3},
        			 WithVocab({$i:'ahl'},
                     	 Replace("a", "", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 false, false, 0, 2))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            {$i: 'a'},  // equivalent to {$i: 'a', $o: ''}
            {$i: 'aa'}, // equivalent to {$i: 'aa', $o: ''}
            {$i: 'h', $o: 'h'},     {$i: 'l', $o: 'l'},
            {$i: 'ah', $o: 'h'},    {$i: 'al', $o: 'l'},
            {$i: 'ha', $o: 'h'},    {$i: 'hh', $o: 'hh'},
            {$i: 'hl', $o: 'hl'},   {$i: 'la', $o: 'l'},
            {$i: 'lh', $o: 'lh'},   {$i: 'll', $o: 'll'},
            {$i: 'aah', $o: 'h'},   {$i: 'aal', $o: 'l'},
            {$i: 'aha', $o: 'h'},   {$i: 'ahh', $o: 'hh'},
            {$i: 'ahl', $o: 'hl'},  {$i: 'ala', $o: 'l'},
            {$i: 'alh', $o: 'lh'},  {$i: 'all', $o: 'll'},
            {$i: 'haa', $o: 'h'},   {$i: 'hah', $o: 'hh'},
            {$i: 'hal', $o: 'hl'},  {$i: 'hha', $o: 'hh'},
            {$i: 'hhh', $o: 'hhh'}, {$i: 'hhl', $o: 'hhl'},
            {$i: 'hla', $o: 'hl'},  {$i: 'hlh', $o: 'hlh'},
            {$i: 'hll', $o: 'hll'}, {$i: 'laa', $o: 'l'},
            {$i: 'lah', $o: 'lh'},  {$i: 'lal', $o: 'll'},
            {$i: 'lha', $o: 'lh'},  {$i: 'lhh', $o: 'lhh'},
            {$i: 'lhl', $o: 'lhl'}, {$i: 'lla', $o: 'll'},
            {$i: 'llh', $o: 'llh'}, {$i: 'lll', $o: 'lll'},
        ],
    });

    // Tests to isolate an expression simplification issue in CorrespondExpr.

    testGrammar({
        desc: '35a. Replace aba by X: Cnt_i:3 aba -> X {1}',
        grammar: Count({$i:3},
                     Replace("aba", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 1)),
        //vocab: {$i:3, $o:3},
        results: [
            {$i: 'aba', $o: 'X'},
        ],
        verbose: vb(VERBOSE_DEBUG),
    });

    testGrammar({
        desc: '35b. Replace aba by X: Cnt_i:3 aba -> X {1} (cursor: $i,$o)',
        grammar: Cursor(["$i", "$o"],
                     Count({$i:3},
                         Replace("aba", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 false, false, 1, 1))),
        //vocab: {$i:3, $o:3},
        results: [
            {$i: 'aba', $o: 'X'},
        ],
    });

    testGrammar({
        desc: '35c. Replace aba by X: Cnt_i:3 aba -> X {1} (cursor: $o,$i)',
        grammar: Cursor(["$o", "$i"],
                     Count({$i:3},
                         Replace("aba", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 false, false, 1, 1))),
        //vocab: {$i:3, $o:3},
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
        desc: '36a. Replace aa by a: Cnt_6 aa -> a {1,3}',
        grammar: Count({$i:6, $o:6},
                     Replace("aa", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 3)),
        //vocab: {$i:1, $o:1},
        results: [
            {$i: 'aa', $o: 'a'},
            {$i: 'aaa', $o: 'aa'},      // 2 ways: (aa)a, a(aa)
            {$i: 'aaaa', $o: 'aa'},     // (aa)(aa) -> (a)(a)
            {$i: 'aaaa', $o: 'aaa'},    // a(aa)a -> a(a)a which is valid
            {$i: 'aaaaa', $o: 'aaa'},   // 3 ways: a(aa)(aa), (aa)a(aa), (aa)(aa)a
            {$i: 'aaaaaa', $o: 'aaa'},  // (aa)(aa)(aa) -> (a)(a)(a)
            {$i: 'aaaaaa', $o: 'aaaa'}, // a(aa)a(aa) -> a(a)a(a)
                                        // (aa)a(aa)a -> (a)a(a)a
                                        // a(aa)(aa)a -> a(a)(a)a
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
                     Replace("aba", "X", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                             false, false, 1, 3)),
        //vocab: {$i:3, $o:3},
        query: inputs(io_36b),
        results: outputs(io_36b),
    });

    testGrammar({
        desc: '37a. Replace i by a: Cnt_2 i -> a || #_ (vocab $i:hi)',
        grammar: Count({$i:2, $o:2},
        			 WithVocab({$i:'hi'},
                     	 Replace("i", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 true, false))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            {$i: 'a', $o: 'a'},   {$i: 'h', $o: 'h'},
            {$i: 'i', $o: 'a'},   {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'}, {$i: 'ai', $o: 'ai'},
            {$i: 'ha', $o: 'ha'}, {$i: 'hh', $o: 'hh'},
            {$i: 'hi', $o: 'hi'}, {$i: 'ia', $o: 'aa'},
            {$i: 'ih', $o: 'ah'}, {$i: 'ii', $o: 'ai'},
        ],
    });

    testGrammar({
        desc: '37b. Replace i by a: Cnt_2 i -> a || _# (vocab $i:hi)',
        grammar: Count({$i:2, $o:2},
        			 WithVocab({$i:'hi'},
                     	 Replace("i", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 false, true))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            {$i: 'a', $o: 'a'},   {$i: 'h', $o: 'h'},
            {$i: 'i', $o: 'a'},   {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'}, {$i: 'ai', $o: 'aa'},
            {$i: 'ha', $o: 'ha'}, {$i: 'hh', $o: 'hh'},
            {$i: 'hi', $o: 'ha'}, {$i: 'ia', $o: 'ia'},
            {$i: 'ih', $o: 'ih'}, {$i: 'ii', $o: 'ia'},
        ],
    });

    testGrammar({
        desc: '37c. Replace i by a: Cnt_2 i -> a || #_# (vocab $i:hi)',
        grammar: Count({$i:2, $o:2},
        			 WithVocab({$i:'hi'},
                     	 Replace("i", "a", EMPTY_CONTEXT, EMPTY_CONTEXT, EMPTY_CONTEXT,
                                 true, true))),
        //vocab: {$i:3, $o:3},
        results: [
            {},
            {$i: 'a', $o: 'a'},   {$i: 'h', $o: 'h'},
            {$i: 'i', $o: 'a'},   {$i: 'aa', $o: 'aa'},
            {$i: 'ah', $o: 'ah'}, {$i: 'ai', $o: 'ai'},
            {$i: 'ha', $o: 'ha'}, {$i: 'hh', $o: 'hh'},
            {$i: 'hi', $o: 'hi'}, {$i: 'ia', $o: 'ia'},
            {$i: 'ih', $o: 'ih'}, {$i: 'ii', $o: 'ii'},
        ],
    });
});
