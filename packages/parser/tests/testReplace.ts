import { 
    Replace, 
    //Empty, 
    Seq, 
    //Vocab 
} from "../src/ast";

import { 
    //InputResultsPair, 
    t1, t2, 
    testAstHasTapes, 
    testHasVocab,
    testAst, 
    //testParseMultiple
} from './testUtilsAst';

import * as path from 'path';
import { StringDict } from "../src/util";

/*
function inputResultsPairs(expectedOutputs: StringDict[]): InputResultsPair[] {
    var pairs: InputResultsPair[] = []
    for (const output of expectedOutputs) {
        if (output['t2'] != undefined) {
            pairs.push([{t1: output['t1']}, [output]])
        } else {
            pairs.push([{t1: output['t1']}, []])
        }
    }
    return pairs
}
*/

describe(`${path.basename(module.filename)}`, function() {

    // 1. Replace e by a in hello: e -> a {1+} || ^h_llo$
    describe('1. Replace e by a in hello: e -> a {1+} || ^h_llo$', function() {
        const grammar = Replace("t1", "t2", t1("e"), t2("a"), t1("h"), t1("llo"),
                                       true, true, 1);
        testAstHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testAst(grammar, expectedResults, undefined, 100);
    });

    /*
    // 2. Replace e by a in hello: e -> a {1+} || h_llo$
    describe('2. Replace e by a in hello: e -> a {1+} || h_llo$', function() {
        const grammar = Replace("t1", "t2", t1("e"), t2("a"), t1("h"), t1("llo"),
                                       false, true, 1, Infinity, 2);
        testAstHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
            {t1: 'hhello', t2: 'hhallo'},
            {t1: 'lhello', t2: 'lhallo'},
            {t1: 'ohello', t2: 'ohallo'},
            {t1: 'hhhello', t2: 'hhhallo'},
            {t1: 'hlhello', t2: 'hlhallo'},
            {t1: 'hohello', t2: 'hohallo'},
            {t1: 'lhhello', t2: 'lhhallo'},
            {t1: 'llhello', t2: 'llhallo'},
            {t1: 'lohello', t2: 'lohallo'},
            {t1: 'ohhello', t2: 'ohhallo'},
            {t1: 'olhello', t2: 'olhallo'},
            {t1: 'oohello', t2: 'oohallo'},
        ];
        testAst(grammar, expectedResults, undefined, 100); 
    });*/
});