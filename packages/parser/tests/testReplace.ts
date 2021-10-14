import { 
    Dot,
    Epsilon,
    Intersect,
    Maybe,
    Not,
    Rename,
    Replace, 
    //Empty, 
    Seq,
    Vocab, 
    //Vocab 
} from "../src/grammars";

import { 
    InputResultsPair, 
    t1, t2, 
    testHasTapes, 
    testHasVocab,
    testGrammar, 
    testParseMultiple
} from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";


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


describe(`${path.basename(module.filename)}`, function() {

    // 1. Replace e by a in hello: e -> a {1+} || ^h_llo$
    describe('1. Replace e by a in hello: e -> a {1+} || ^h_llo$', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       true, true, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 2. Replace e by a in hello: e -> a {1+} || h_llo$
    describe('2. Replace e by a in hello: e -> a {1+} || h_llo$', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       false, true, 1, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2']);
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
        testGrammar(grammar, expectedResults, undefined, undefined, 100); 
    });

    
    // 3. Replace e by a in hello: e -> a {0+} || h_llo$
    describe('3. Replace e by a in hello: e -> a {0+} || h_llo$', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       false, true, 0, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'o', t2: 'o'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'},
            {t1: 'ho', t2: 'ho'},
            {t1: 'lh', t2: 'lh'},
            {t1: 'll', t2: 'll'},
            {t1: 'lo', t2: 'lo'},
            {t1: 'oh', t2: 'oh'},
            {t1: 'ol', t2: 'ol'},
            {t1: 'oo', t2: 'oo'},
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
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    
    // 4. Replace e by a in hello: e -> a {1+} || ^h_llo
    describe('4. Replace e by a in hello: e -> a {1+} || ^h_llo', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       true, false, 1, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
            {t1: 'helloh', t2: 'halloh'},
            {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},
            {t1: 'hellohh', t2: 'hallohh'},
            {t1: 'hellohl', t2: 'hallohl'},
            {t1: 'helloho', t2: 'halloho'},
            {t1: 'hellolh', t2: 'hallolh'},
            {t1: 'helloll', t2: 'halloll'},
            {t1: 'hellolo', t2: 'hallolo'},
            {t1: 'hellooh', t2: 'hallooh'},
            {t1: 'hellool', t2: 'hallool'},
            {t1: 'hellooo', t2: 'hallooo'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 5. Replace e by a in hello: e -> a {0+} || ^h_llo
    describe('5. Replace e by a in hello: e -> a {0+} || ^h_llo', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       true, false, 0, Infinity, 2);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'o', t2: 'o'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'hl', t2: 'hl'},
            {t1: 'ho', t2: 'ho'},
            {t1: 'lh', t2: 'lh'},
            {t1: 'll', t2: 'll'},
            {t1: 'lo', t2: 'lo'},
            {t1: 'oh', t2: 'oh'},
            {t1: 'ol', t2: 'ol'},
            {t1: 'oo', t2: 'oo'},
            {t1: 'hello', t2: 'hallo'},
            {t1: 'helloh', t2: 'halloh'},
            {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},
            {t1: 'hellohh', t2: 'hallohh'},
            {t1: 'hellohl', t2: 'hallohl'},
            {t1: 'helloho', t2: 'halloho'},
            {t1: 'hellolh', t2: 'hallolh'},
            {t1: 'helloll', t2: 'halloll'},
            {t1: 'hellolo', t2: 'hallolo'},
            {t1: 'hellooh', t2: 'hallooh'},
            {t1: 'hellool', t2: 'hallool'},
            {t1: 'hellooo', t2: 'hallooo'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 6. Replace e by a in hello: e -> a {1,5} || h_llo
    describe('6. Replace e by a in hello: e -> a {1,5} || h_llo', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("llo"),
                                       false, false, 1, 5, 3);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
            {t1: 'helloh', t2: 'halloh'},
            {t1: 'hellol', t2: 'hallol'},
            {t1: 'helloo', t2: 'halloo'},
            {t1: 'hhello', t2: 'hhallo'},
            {t1: 'lhello', t2: 'lhallo'},
            {t1: 'ohello', t2: 'ohallo'},
            {t1: 'hellohh', t2: 'hallohh'},
            {t1: 'hellohl', t2: 'hallohl'},
            {t1: 'helloho', t2: 'halloho'},
            {t1: 'hellolh', t2: 'hallolh'},
            {t1: 'helloll', t2: 'halloll'},
            {t1: 'hellolo', t2: 'hallolo'},
            {t1: 'hellooh', t2: 'hallooh'},
            {t1: 'hellool', t2: 'hallool'},
            {t1: 'hellooo', t2: 'hallooo'},
            {t1: 'hhelloh', t2: 'hhalloh'},
            {t1: 'hhellol', t2: 'hhallol'},
            {t1: 'hhelloo', t2: 'hhalloo'},
            {t1: 'hhhello', t2: 'hhhallo'},
            {t1: 'hlhello', t2: 'hlhallo'},
            {t1: 'hohello', t2: 'hohallo'},
            {t1: 'lhelloh', t2: 'lhalloh'},
            {t1: 'lhellol', t2: 'lhallol'},
            {t1: 'lhelloo', t2: 'lhalloo'},
            {t1: 'lhhello', t2: 'lhhallo'},
            {t1: 'llhello', t2: 'llhallo'},
            {t1: 'lohello', t2: 'lohallo'},
            {t1: 'ohelloh', t2: 'ohalloh'},
            {t1: 'ohellol', t2: 'ohallol'},
            {t1: 'ohelloo', t2: 'ohalloo'},
            {t1: 'ohhello', t2: 'ohhallo'},
            {t1: 'olhello', t2: 'olhallo'},
            {t1: 'oohello', t2: 'oohallo'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 15);
    });

    
    // 7. Replace e by a in hel: e -> a {1+} || h_l
    describe('7. Replace e by a in hel: e -> a {1+} || h_l', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       false, false, 1, Infinity, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'hal'},
            {t1: 'helh', t2: 'halh'},
            {t1: 'hell', t2: 'hall'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'lhel', t2: 'lhal'},
            {t1: 'hhelh', t2: 'hhalh'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'lhelh', t2: 'lhalh'},
            {t1: 'lhell', t2: 'lhall'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'helhelh', t2: 'halhalh'},
            {t1: 'helhell', t2: 'halhall'},
            {t1: 'helhhel', t2: 'halhhal'},
            {t1: 'hellhel', t2: 'hallhal'},
            {t1: 'hhelhel', t2: 'hhalhal'},
            {t1: 'lhelhel', t2: 'lhalhal'},
            {t1: 'helhhelh', t2: 'halhhalh'},
            {t1: 'helhhell', t2: 'halhhall'},
            {t1: 'hellhelh', t2: 'hallhalh'},
            {t1: 'hellhell', t2: 'hallhall'},
            {t1: 'hhelhelh', t2: 'hhalhalh'},
            {t1: 'hhelhell', t2: 'hhalhall'},
            {t1: 'hhelhhel', t2: 'hhalhhal'},
            {t1: 'hhellhel', t2: 'hhallhal'},
            {t1: 'lhelhelh', t2: 'lhalhalh'},
            {t1: 'lhelhell', t2: 'lhalhall'},
            {t1: 'lhelhhel', t2: 'lhalhhal'},
            {t1: 'lhellhel', t2: 'lhallhal'},
            {t1: 'helhelhel', t2: 'halhalhal'},
            {t1: 'hhelhhelh', t2: 'hhalhhalh'},
            {t1: 'hhelhhell', t2: 'hhalhhall'},
            {t1: 'hhellhelh', t2: 'hhallhalh'},
            {t1: 'hhellhell', t2: 'hhallhall'},
            {t1: 'lhelhhelh', t2: 'lhalhhalh'},
            {t1: 'lhelhhell', t2: 'lhalhhall'},
            {t1: 'lhellhelh', t2: 'lhallhalh'},
            {t1: 'lhellhell', t2: 'lhallhall'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 19);
    });

    
    // 8. Replace e by a in hel: e -> a {0,2} || h_l
    describe('8. Replace e by a in hel: e -> a {0,2} || h_l', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'hel', t2: 'hal'},
            {t1: 'helh', t2: 'halh'},
            {t1: 'hell', t2: 'hall'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'lhel', t2: 'lhal'},
            {t1: 'hhelh', t2: 'hhalh'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'lhelh', t2: 'lhalh'},
            {t1: 'lhell', t2: 'lhall'},
            {t1: 'helhel', t2: 'halhal'},
            {t1: 'helhelh', t2: 'halhalh'},
            {t1: 'helhell', t2: 'halhall'},
            {t1: 'helhhel', t2: 'halhhal'},
            {t1: 'hellhel', t2: 'hallhal'},
            {t1: 'hhelhel', t2: 'hhalhal'},
            {t1: 'lhelhel', t2: 'lhalhal'},
            {t1: 'helhhelh', t2: 'halhhalh'},
            {t1: 'helhhell', t2: 'halhhall'},
            {t1: 'hellhelh', t2: 'hallhalh'},
            {t1: 'hellhell', t2: 'hallhall'},
            {t1: 'hhelhelh', t2: 'hhalhalh'},
            {t1: 'hhelhell', t2: 'hhalhall'},
            {t1: 'hhelhhel', t2: 'hhalhhal'},
            {t1: 'hhellhel', t2: 'hhallhal'},
            {t1: 'lhelhelh', t2: 'lhalhalh'},
            {t1: 'lhelhell', t2: 'lhalhall'},
            {t1: 'lhelhhel', t2: 'lhalhhal'},
            {t1: 'lhellhel', t2: 'lhallhal'},
            {t1: 'hhelhhelh', t2: 'hhalhhalh'},
            {t1: 'hhelhhell', t2: 'hhalhhall'},
            {t1: 'hhellhelh', t2: 'hhallhalh'},
            {t1: 'hhellhell', t2: 'hhallhall'},
            {t1: 'lhelhhelh', t2: 'lhalhhalh'},
            {t1: 'lhelhhell', t2: 'lhalhhall'},
            {t1: 'lhellhelh', t2: 'lhallhalh'},
            {t1: 'lhellhell', t2: 'lhallhall'},
        ];
        testGrammar(grammar, expectedResults, undefined, 19);
    });

    
    // 9. Replace e by a in hel: e -> a {1} || h_l
    describe('9. Replace e by a in hel: e -> a {1} || h_l', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       false, false, 1, 1, 5);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            // Invalid Inputs
            {t1: 'helhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to), undefined, 100);
    });

    // 10. Replace e by a in hel: e -> a {0,3} || h_l
    describe('10. Replace e by a in hel: e -> a {0,3} || h_l', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), t1("l"),
                                       false, false, 0, 3, 4);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'hal'},
            {t1: 'hhel', t2: 'hhal'},
            {t1: 'hhell', t2: 'hhall'},
            {t1: 'lhhelhl', t2: 'lhhalhl'},
            {t1: 'hlhhelllll', t2: 'hlhhalllll'},
            {t1: 'lhellhhel', t2: 'lhallhhal'},
            {t1: 'lhelhhllhel', t2: 'lhalhhllhal'},
            {t1: 'helhelhel', t2: 'halhalhal'},
            {t1: 'lhelhelhhlhell', t2: 'lhalhalhhlhall'},
            {t1: 'hlhellhhelhlhellh', t2: 'hlhallhhalhlhallh'},
            // Invalid Inputs
            {t1: 'helhhhhllllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to), undefined, 100);
    });

    
    // 11. Replace e by a in he: e -> a {0,2} || h_0
    describe('11. Replace e by a in he: e -> a {0,2} || h_0', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), Epsilon(),
                                       false, false, 0, 2, 2);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'he', t2: 'ha'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'heh', t2: 'hah'},
            {t1: 'hhe', t2: 'hha'},
            {t1: 'hehe', t2: 'haha'},
            {t1: 'hehh', t2: 'hahh'},
            {t1: 'hheh', t2: 'hhah'},
            {t1: 'hhhe', t2: 'hhha'},
            {t1: 'heheh', t2: 'hahah'},
            {t1: 'hehhe', t2: 'hahha'},
            {t1: 'hhehe', t2: 'hhaha'},
            {t1: 'hhehh', t2: 'hhahh'},
            {t1: 'hhheh', t2: 'hhhah'},
            {t1: 'hehehh', t2: 'hahahh'},
            {t1: 'hehheh', t2: 'hahhah'},
            {t1: 'hehhhe', t2: 'hahhha'},
            {t1: 'hheheh', t2: 'hhahah'},
            {t1: 'hhehhe', t2: 'hhahha'},
            {t1: 'hhhehe', t2: 'hhhaha'},
            {t1: 'hhhehh', t2: 'hhhahh'},
            {t1: 'hehhehh', t2: 'hahhahh'},
            {t1: 'hehhheh', t2: 'hahhhah'},
            {t1: 'hhehehh', t2: 'hhahahh'},
            {t1: 'hhehheh', t2: 'hhahhah'},
            {t1: 'hhehhhe', t2: 'hhahhha'},
            {t1: 'hhheheh', t2: 'hhhahah'},
            {t1: 'hhhehhe', t2: 'hhhahha'},
            {t1: 'hehhhehh', t2: 'hahhhahh'},
            {t1: 'hhehhehh', t2: 'hhahhahh'},
            {t1: 'hhehhheh', t2: 'hhahhhah'},
            {t1: 'hhhehehh', t2: 'hhhahahh'},
            {t1: 'hhhehheh', t2: 'hhhahhah'},
            {t1: 'hhhehhhe', t2: 'hhhahhha'},
            {t1: 'hhehhhehh', t2: 'hhahhhahh'},
            {t1: 'hhhehhehh', t2: 'hhhahhahh'},
            {t1: 'hhhehhheh', t2: 'hhhahhhah'},
            {t1: 'hhhehhhehh', t2: 'hhhahhhahh'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    

    // 12. Replace e by a in he: e -> a {0,2} || h_
    describe('12. Replace e by a in he: e -> a {0,2} || h_', function() {
        const grammar = Replace(t1("e"), t2("a"), t1("h"), undefined,
                                       false, false, 0, 2, 2);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'he', t2: 'ha'},
            {t1: 'hh', t2: 'hh'},
            {t1: 'heh', t2: 'hah'},
            {t1: 'hhe', t2: 'hha'},
            {t1: 'hehe', t2: 'haha'},
            {t1: 'hehh', t2: 'hahh'},
            {t1: 'hheh', t2: 'hhah'},
            {t1: 'hhhe', t2: 'hhha'},
            {t1: 'heheh', t2: 'hahah'},
            {t1: 'hehhe', t2: 'hahha'},
            {t1: 'hhehe', t2: 'hhaha'},
            {t1: 'hhehh', t2: 'hhahh'},
            {t1: 'hhheh', t2: 'hhhah'},
            {t1: 'hehehh', t2: 'hahahh'},
            {t1: 'hehheh', t2: 'hahhah'},
            {t1: 'hehhhe', t2: 'hahhha'},
            {t1: 'hheheh', t2: 'hhahah'},
            {t1: 'hhehhe', t2: 'hhahha'},
            {t1: 'hhhehe', t2: 'hhhaha'},
            {t1: 'hhhehh', t2: 'hhhahh'},
            {t1: 'hehhehh', t2: 'hahhahh'},
            {t1: 'hehhheh', t2: 'hahhhah'},
            {t1: 'hhehehh', t2: 'hhahahh'},
            {t1: 'hhehheh', t2: 'hhahhah'},
            {t1: 'hhehhhe', t2: 'hhahhha'},
            {t1: 'hhheheh', t2: 'hhhahah'},
            {t1: 'hhhehhe', t2: 'hhhahha'},
            {t1: 'hehhhehh', t2: 'hahhhahh'},
            {t1: 'hhehhehh', t2: 'hhahhahh'},
            {t1: 'hhehhheh', t2: 'hhahhhah'},
            {t1: 'hhhehehh', t2: 'hhhahahh'},
            {t1: 'hhhehheh', t2: 'hhhahhah'},
            {t1: 'hhhehhhe', t2: 'hhhahhha'},
            {t1: 'hhehhhehh', t2: 'hhahhhahh'},
            {t1: 'hhhehhehh', t2: 'hhhahhahh'},
            {t1: 'hhhehhheh', t2: 'hhhahhhah'},
            {t1: 'hhhehhhehh', t2: 'hhhahhhahh'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 13. Replace e by a in he: e -> a {0,2} || _l
    describe('13. Replace e by a in he: e -> a {0,2} || _l', function() {
        const grammar = Replace(t1("e"), t2("a"), undefined, t1("l"),
                                       false, false, 0, 2, 2);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'l', t2: 'l'},
            {t1: 'el', t2: 'al'},
            {t1: 'll', t2: 'll'},
            {t1: 'ell', t2: 'all'},
            {t1: 'lel', t2: 'lal'},
            {t1: 'elel', t2: 'alal'},
            {t1: 'elll', t2: 'alll'},
            {t1: 'lell', t2: 'lall'},
            {t1: 'llel', t2: 'llal'},
            {t1: 'elell', t2: 'alall'},
            {t1: 'ellel', t2: 'allal'},
            {t1: 'lelel', t2: 'lalal'},
            {t1: 'lelll', t2: 'lalll'},
            {t1: 'llell', t2: 'llall'},
            {t1: 'elelll', t2: 'alalll'},
            {t1: 'ellell', t2: 'allall'},
            {t1: 'elllel', t2: 'alllal'},
            {t1: 'lelell', t2: 'lalall'},
            {t1: 'lellel', t2: 'lallal'},
            {t1: 'llelel', t2: 'llalal'},
            {t1: 'llelll', t2: 'llalll'},
            {t1: 'ellelll', t2: 'allalll'},
            {t1: 'elllell', t2: 'alllall'},
            {t1: 'lelelll', t2: 'lalalll'},
            {t1: 'lellell', t2: 'lallall'},
            {t1: 'lelllel', t2: 'lalllal'},
            {t1: 'llelell', t2: 'llalall'},
            {t1: 'llellel', t2: 'llallal'},
            {t1: 'elllelll', t2: 'alllalll'},
            {t1: 'lellelll', t2: 'lallalll'},
            {t1: 'lelllell', t2: 'lalllall'},
            {t1: 'llelelll', t2: 'llalalll'},
            {t1: 'llellell', t2: 'llallall'},
            {t1: 'llelllel', t2: 'llalllal'},
            {t1: 'lelllelll', t2: 'lalllalll'},
            {t1: 'llellelll', t2: 'llallalll'},
            {t1: 'llelllell', t2: 'llalllall'},
            {t1: 'llelllelll', t2: 'llalllalll'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    
    // 14. Replace e by a: e -> a {0,2} (vocab hel/hal)
    describe('14. Replace e by a: e -> a {0,2} (vocab hel/hal)', function() {
        const grammar = Seq(Vocab('t1', "hl"), Vocab('t2', "hl"),
                                   Replace(t1("e"), t2("a"), undefined, undefined,
                                           false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'a'},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'eh', t2: 'ah'},
            {t1: 'el', t2: 'al'},
            {t1: 'ee', t2: 'aa'},
            {t1: 'he', t2: 'ha'},
            {t1: 'le', t2: 'la'},
            {t1: 'ehe', t2: 'aha'},
            {t1: 'ele', t2: 'ala'},
            {t1: 'eeh', t2: 'aah'},
            {t1: 'eel', t2: 'aal'},
            {t1: 'heh', t2: 'hah'},
            {t1: 'hel', t2: 'hal'},
            {t1: 'hee', t2: 'haa'},
            {t1: 'leh', t2: 'lah'},
            {t1: 'lel', t2: 'lal'},
            {t1: 'lee', t2: 'laa'},
            {t1: 'eheh', t2: 'ahah'},
            {t1: 'ehel', t2: 'ahal'},
            {t1: 'eleh', t2: 'alah'},
            {t1: 'elel', t2: 'alal'},
            {t1: 'hehe', t2: 'haha'},
            {t1: 'hele', t2: 'hala'},
            {t1: 'heeh', t2: 'haah'},
            {t1: 'heel', t2: 'haal'},
            {t1: 'lehe', t2: 'laha'},
            {t1: 'lele', t2: 'lala'},
            {t1: 'leeh', t2: 'laah'},
            {t1: 'leel', t2: 'laal'},
            {t1: 'heheh', t2: 'hahah'},
            {t1: 'hehel', t2: 'hahal'},
            {t1: 'heleh', t2: 'halah'},
            {t1: 'helel', t2: 'halal'},
            {t1: 'leheh', t2: 'lahah'},
            {t1: 'lehel', t2: 'lahal'},
            {t1: 'leleh', t2: 'lalah'},
            {t1: 'lelel', t2: 'lalal'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 15. Replace e by a: e -> a {0,3} (vocab hel/hal)
    describe('15. Replace e by a: e -> a {0,3} (vocab hel/hal)', function() {
        const grammar = Seq(Vocab('t1', "hl"), Vocab('t2', "hl"),
                                   Replace(t1("e"), t2("a"), undefined, undefined,
                                           false, false, 0, 3, 2));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Replacement
            {t1: 'e', t2: 'a'},
            {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'aa'},
            {t1: 'he', t2: 'ha'},
            {t1: 'll', t2: 'll'},
            {t1: 'ell', t2: 'all'},
            {t1: 'eee', t2: 'aaa'},
            {t1: 'ehhe', t2: 'ahha'},
            {t1: 'eehh', t2: 'aahh'},
            {t1: 'lehel', t2: 'lahal'},
            {t1: 'ehehe', t2: 'ahaha'},
            {t1: 'ellee', t2: 'allaa'},
            {t1: 'heeeh', t2: 'haaah'},
            {t1: 'lehhe', t2: 'lahha'},
            {t1: 'eheehl', t2: 'ahaahl'},
            {t1: 'ehhell', t2: 'ahhall'},
            {t1: 'hehhee', t2: 'hahhaa'},
            {t1: 'ehehehl', t2: 'ahahahl'},
            {t1: 'ehheehh', t2: 'ahhaahh'},
            {t1: 'ellelle', t2: 'allalla'},
            {t1: 'elleehh', t2: 'allaahh'},
            {t1: 'heheheh', t2: 'hahahah'},
            {t1: 'hheeehh', t2: 'hhaaahh'},
            {t1: 'hehlehle', t2: 'hahlahla'},
            {t1: 'hhehhehh', t2: 'hhahhahh'},
            {t1: 'hhehleheh', t2: 'hhahlahah'},
            {t1: 'hleellell', t2: 'hlaallall'},
            {t1: 'llelhelehh', t2: 'llalhalahh'},
            {t1: 'llehlehlehh', t2: 'llahlahlahh'},
            {t1: 'llellellell', t2: 'llallallall'},
            // Invalid Inputs
            {t1: 'helhhhhellllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to), undefined, 100);
    });

    // 16. Replace e by ee in hel: e -> ee {0,2} || h_l
    describe('16. Replace e by ee in hel: e -> ee {0,2} || h_l', function() {
        const grammar = Seq(Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'hel', t2: 'heel'},
            {t1: 'helh', t2: 'heelh'},
            {t1: 'hele', t2: 'heele'},
            {t1: 'hell', t2: 'heell'},
            {t1: 'hhel', t2: 'hheel'},
            {t1: 'ehel', t2: 'eheel'},
            {t1: 'lhel', t2: 'lheel'},
            {t1: 'hhelh', t2: 'hheelh'},
            {t1: 'hhele', t2: 'hheele'},
            {t1: 'hhell', t2: 'hheell'},
            {t1: 'ehelh', t2: 'eheelh'},
            {t1: 'ehele', t2: 'eheele'},
            {t1: 'ehell', t2: 'eheell'},
            {t1: 'lhelh', t2: 'lheelh'},
            {t1: 'lhele', t2: 'lheele'},
            {t1: 'lhell', t2: 'lheell'},
            {t1: 'helhel', t2: 'heelheel'},
            {t1: 'helhelh', t2: 'heelheelh'},
            {t1: 'helhele', t2: 'heelheele'},
            {t1: 'helhell', t2: 'heelheell'},
            {t1: 'helhhel', t2: 'heelhheel'},
            {t1: 'helehel', t2: 'heeleheel'},
            {t1: 'hellhel', t2: 'heellheel'},
            {t1: 'hhelhel', t2: 'hheelheel'},
            {t1: 'ehelhel', t2: 'eheelheel'},
            {t1: 'lhelhel', t2: 'lheelheel'},
            {t1: 'helhhelh', t2: 'heelhheelh'},
            {t1: 'helhhele', t2: 'heelhheele'},
            {t1: 'helhhell', t2: 'heelhheell'},
            {t1: 'helehelh', t2: 'heeleheelh'},
            {t1: 'helehele', t2: 'heeleheele'},
            {t1: 'helehell', t2: 'heeleheell'},
            {t1: 'hellhelh', t2: 'heellheelh'},
            {t1: 'hellhele', t2: 'heellheele'},
            {t1: 'hellhell', t2: 'heellheell'},
            {t1: 'hhelhelh', t2: 'hheelheelh'},
            {t1: 'hhelhele', t2: 'hheelheele'},
            {t1: 'hhelhell', t2: 'hheelheell'},
            {t1: 'hhelhhel', t2: 'hheelhheel'},
            {t1: 'hhelehel', t2: 'hheeleheel'},
            {t1: 'hhellhel', t2: 'hheellheel'},
            {t1: 'ehelhelh', t2: 'eheelheelh'},
            {t1: 'ehelhele', t2: 'eheelheele'},
            {t1: 'ehelhell', t2: 'eheelheell'},
            {t1: 'ehelhhel', t2: 'eheelhheel'},
            {t1: 'ehelehel', t2: 'eheeleheel'},
            {t1: 'ehellhel', t2: 'eheellheel'},
            {t1: 'lhelhelh', t2: 'lheelheelh'},
            {t1: 'lhelhele', t2: 'lheelheele'},
            {t1: 'lhelhell', t2: 'lheelheell'},
            {t1: 'lhelhhel', t2: 'lheelhheel'},
            {t1: 'lhelehel', t2: 'lheeleheel'},
            {t1: 'lhellhel', t2: 'lheellheel'},
            {t1: 'hhelhhelh', t2: 'hheelhheelh'},
            {t1: 'hhelhhele', t2: 'hheelhheele'},
            {t1: 'hhelhhell', t2: 'hheelhheell'},
            {t1: 'hhelehelh', t2: 'hheeleheelh'},
            {t1: 'hhelehele', t2: 'hheeleheele'},
            {t1: 'hhelehell', t2: 'hheeleheell'},
            {t1: 'hhellhelh', t2: 'hheellheelh'},
            {t1: 'hhellhele', t2: 'hheellheele'},
            {t1: 'hhellhell', t2: 'hheellheell'},
            {t1: 'ehelhhelh', t2: 'eheelhheelh'},
            {t1: 'ehelhhele', t2: 'eheelhheele'},
            {t1: 'ehelhhell', t2: 'eheelhheell'},
            {t1: 'ehelehelh', t2: 'eheeleheelh'},
            {t1: 'ehelehele', t2: 'eheeleheele'},
            {t1: 'ehelehell', t2: 'eheeleheell'},
            {t1: 'ehellhelh', t2: 'eheellheelh'},
            {t1: 'ehellhele', t2: 'eheellheele'},
            {t1: 'ehellhell', t2: 'eheellheell'},
            {t1: 'lhelhhelh', t2: 'lheelhheelh'},
            {t1: 'lhelhhele', t2: 'lheelhheele'},
            {t1: 'lhelhhell', t2: 'lheelhheell'},
            {t1: 'lhelehelh', t2: 'lheeleheelh'},
            {t1: 'lhelehele', t2: 'lheeleheele'},
            {t1: 'lhelehell', t2: 'lheeleheell'},
            {t1: 'lhellhelh', t2: 'lheellheelh'},
            {t1: 'lhellhele', t2: 'lheellheele'},
            {t1: 'lhellhell', t2: 'lheellheell'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    }); 
    

    // 17. Replace e by ee in hel: e -> ee {1+} || ^h_l
    describe('17. Replace e by ee in hel: e -> ee {1+} || ^h_l', function() {
        const grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       true, false, 1, Infinity, 3);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'heel'},
            {t1: 'helh', t2: 'heelh'},
            {t1: 'hele', t2: 'heele'},
            {t1: 'hell', t2: 'heell'},
            {t1: 'helhh', t2: 'heelhh'},
            {t1: 'helhe', t2: 'heelhe'},
            {t1: 'helhl', t2: 'heelhl'},
            {t1: 'heleh', t2: 'heeleh'},
            {t1: 'helee', t2: 'heelee'},
            {t1: 'helel', t2: 'heelel'},
            {t1: 'hellh', t2: 'heellh'},
            {t1: 'helle', t2: 'heelle'},
            {t1: 'helll', t2: 'heelll'},
            {t1: 'helhhh', t2: 'heelhhh'},
            {t1: 'helhhe', t2: 'heelhhe'},
            {t1: 'helhhl', t2: 'heelhhl'},
            {t1: 'helheh', t2: 'heelheh'},
            {t1: 'helhee', t2: 'heelhee'},
            {t1: 'helhel', t2: 'heelhel'},
            {t1: 'helhlh', t2: 'heelhlh'},
            {t1: 'helhle', t2: 'heelhle'},
            {t1: 'helhll', t2: 'heelhll'},
            {t1: 'helehh', t2: 'heelehh'},
            {t1: 'helehe', t2: 'heelehe'},
            {t1: 'helehl', t2: 'heelehl'},
            {t1: 'heleeh', t2: 'heeleeh'},
            {t1: 'heleee', t2: 'heeleee'},
            {t1: 'heleel', t2: 'heeleel'},
            {t1: 'helelh', t2: 'heelelh'},
            {t1: 'helele', t2: 'heelele'},
            {t1: 'helell', t2: 'heelell'},
            {t1: 'hellhh', t2: 'heellhh'},
            {t1: 'hellhe', t2: 'heellhe'},
            {t1: 'hellhl', t2: 'heellhl'},
            {t1: 'helleh', t2: 'heelleh'},
            {t1: 'hellee', t2: 'heellee'},
            {t1: 'hellel', t2: 'heellel'},
            {t1: 'helllh', t2: 'heelllh'},
            {t1: 'hellle', t2: 'heellle'},
            {t1: 'hellll', t2: 'heellll'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 18. Replace e by ee in hel: e -> ee {0+} || ^h_l
    describe('18. Replace e by ee in hel: e -> ee {0+} || ^h_l', function() {
        const grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       true, false, 0, Infinity, 4);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'hl', t2: 'hl'},
            {t1: 'eh', t2: 'eh'},
            {t1: 'll', t2: 'll'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'hee', t2: 'hee'},
            {t1: 'elh', t2: 'elh'},
            {t1: 'ell', t2: 'ell'},
            {t1: 'lel', t2: 'lel'},
            {t1: 'lll', t2: 'lll'},
            {t1: 'hhhh', t2: 'hhhh'},
            {t1: 'hhee', t2: 'hhee'},
            {t1: 'hhel', t2: 'hhel'},
            {t1: 'heel', t2: 'heel'},
            {t1: 'eheh', t2: 'eheh'},
            {t1: 'ehee', t2: 'ehee'},
            {t1: 'ehel', t2: 'ehel'},
            {t1: 'ellh', t2: 'ellh'},
            {t1: 'lheh', t2: 'lheh'},
            {t1: 'lhel', t2: 'lhel'},
            {t1: 'lhle', t2: 'lhle'},
            {t1: 'llll', t2: 'llll'},
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'heel'},
            {t1: 'helh', t2: 'heelh'},
            {t1: 'hele', t2: 'heele'},
            {t1: 'hell', t2: 'heell'},
            {t1: 'helhel', t2: 'heelhel'},
            {t1: 'helhelh', t2: 'heelhelh'},
            {t1: 'helhele', t2: 'heelhele'},
            {t1: 'helhell', t2: 'heelhell'},
            {t1: 'helhhel', t2: 'heelhhel'},
            {t1: 'helehel', t2: 'heelehel'},
            {t1: 'hellhel', t2: 'heellhel'},
            // Invalid Inputs
            {t1: 'hhelh'},
            {t1: 'helhhhhellllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to), undefined, 100);
    });


    // 19. Replace e by ee in hel: e -> ee {1+} || h_l$
    describe('19. Replace e by ee in hel: e -> ee {1+} || h_l$', function() {
        const grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       false, true, 1, Infinity, 3);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hel', t2: 'heel'},
            {t1: 'hhel', t2: 'hheel'},
            {t1: 'ehel', t2: 'eheel'},
            {t1: 'lhel', t2: 'lheel'},
            {t1: 'hhhel', t2: 'hhheel'},
            {t1: 'hehel', t2: 'heheel'},
            {t1: 'hlhel', t2: 'hlheel'},
            {t1: 'ehhel', t2: 'ehheel'},
            {t1: 'eehel', t2: 'eeheel'},
            {t1: 'elhel', t2: 'elheel'},
            {t1: 'lhhel', t2: 'lhheel'},
            {t1: 'lehel', t2: 'leheel'},
            {t1: 'llhel', t2: 'llheel'},
            {t1: 'hhhhel', t2: 'hhhheel'},
            {t1: 'hhehel', t2: 'hheheel'},
            {t1: 'hhlhel', t2: 'hhlheel'},
            {t1: 'hehhel', t2: 'hehheel'},
            {t1: 'heehel', t2: 'heeheel'},
            {t1: 'helhel', t2: 'helheel'},
            {t1: 'hlhhel', t2: 'hlhheel'},
            {t1: 'hlehel', t2: 'hleheel'},
            {t1: 'hllhel', t2: 'hllheel'},
            {t1: 'ehhhel', t2: 'ehhheel'},
            {t1: 'ehehel', t2: 'eheheel'},
            {t1: 'ehlhel', t2: 'ehlheel'},
            {t1: 'eehhel', t2: 'eehheel'},
            {t1: 'eeehel', t2: 'eeeheel'},
            {t1: 'eelhel', t2: 'eelheel'},
            {t1: 'elhhel', t2: 'elhheel'},
            {t1: 'elehel', t2: 'eleheel'},
            {t1: 'ellhel', t2: 'ellheel'},
            {t1: 'lhhhel', t2: 'lhhheel'},
            {t1: 'lhehel', t2: 'lheheel'},
            {t1: 'lhlhel', t2: 'lhlheel'},
            {t1: 'lehhel', t2: 'lehheel'},
            {t1: 'leehel', t2: 'leeheel'},
            {t1: 'lelhel', t2: 'lelheel'},
            {t1: 'llhhel', t2: 'llhheel'},
            {t1: 'llehel', t2: 'lleheel'},
            {t1: 'lllhel', t2: 'lllheel'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    
    // 20. Replace e by ee in hel: e -> ee {0+} || h_l$
    describe('20. Replace e by ee in hel: e -> ee {0+} || h_l$', function() {
        const grammar = Replace(t1("e"), t2("ee"), t1("h"), t1("l"),
                                       false, true, 0, Infinity, 4);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const from_to: StringDict[] = [
            // Valid Inputs - Copy through
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'hl', t2: 'hl'},
            {t1: 'eh', t2: 'eh'},
            {t1: 'll', t2: 'll'},
            {t1: 'heh', t2: 'heh'},
            {t1: 'hee', t2: 'hee'},
            {t1: 'elh', t2: 'elh'},
            {t1: 'ell', t2: 'ell'},
            {t1: 'lel', t2: 'lel'},
            {t1: 'lll', t2: 'lll'},
            {t1: 'hhhh', t2: 'hhhh'},
            {t1: 'hhee', t2: 'hhee'},
            {t1: 'helh', t2: 'helh'},
            {t1: 'hele', t2: 'hele'},
            {t1: 'hell', t2: 'hell'},
            {t1: 'heel', t2: 'heel'},
            {t1: 'eheh', t2: 'eheh'},
            {t1: 'ehee', t2: 'ehee'},
            {t1: 'ehll', t2: 'ehll'},
            {t1: 'ellh', t2: 'ellh'},
            {t1: 'lhee', t2: 'lhee'},
            {t1: 'lheh', t2: 'lheh'},
            {t1: 'lhle', t2: 'lhle'},
            {t1: 'llll', t2: 'llll'},
            // Valid Inputs - Replacement
            {t1: 'hel', t2: 'heel'},
            {t1: 'hhel', t2: 'hheel'},
            {t1: 'ehel', t2: 'eheel'},
            {t1: 'lhel', t2: 'lheel'},
            {t1: 'helhel', t2: 'helheel'},
            {t1: 'hhelhel', t2: 'hhelheel'},
            {t1: 'ehelhel', t2: 'ehelheel'},
            {t1: 'lhelhel', t2: 'lhelheel'},
            {t1: 'helhhel', t2: 'helhheel'},
            {t1: 'helehel', t2: 'heleheel'},
            {t1: 'hellhel', t2: 'hellheel'},
            // Invalid Inputs
            {t1: 'hhelh'},
            {t1: 'helhhhhellllhel'},
        ];
        testParseMultiple(grammar, inputResultsPairs(from_to), undefined, 100);
    });

    // 21. Replace e by ee in he: e -> ee {0,2} || h_
    describe('21. Replace e by ee in he: e -> ee {0,2} || h_', function() {
        const grammar = Replace(t1("e"), t2("ee"), t1("h"), undefined,
                                       false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'he', t2: 'hee'},
            {t1: 'heh', t2: 'heeh'},
            {t1: 'hee', t2: 'heee'},
            {t1: 'hhe', t2: 'hhee'},
            {t1: 'ehe', t2: 'ehee'},
            {t1: 'hheh', t2: 'hheeh'},
            {t1: 'hhee', t2: 'hheee'},
            {t1: 'eheh', t2: 'eheeh'},
            {t1: 'ehee', t2: 'eheee'},
            {t1: 'hehe', t2: 'heehee'},
            {t1: 'heheh', t2: 'heeheeh'},
            {t1: 'hehee', t2: 'heeheee'},
            {t1: 'hehhe', t2: 'heehhee'},
            {t1: 'heehe', t2: 'heeehee'},
            {t1: 'hhehe', t2: 'hheehee'},
            {t1: 'ehehe', t2: 'eheehee'},
            {t1: 'hehheh', t2: 'heehheeh'},
            {t1: 'hehhee', t2: 'heehheee'},
            {t1: 'heeheh', t2: 'heeeheeh'},
            {t1: 'heehee', t2: 'heeeheee'},
            {t1: 'hheheh', t2: 'hheeheeh'},
            {t1: 'hhehee', t2: 'hheeheee'},
            {t1: 'hhehhe', t2: 'hheehhee'},
            {t1: 'hheehe', t2: 'hheeehee'},
            {t1: 'eheheh', t2: 'eheeheeh'},
            {t1: 'ehehee', t2: 'eheeheee'},
            {t1: 'ehehhe', t2: 'eheehhee'},
            {t1: 'eheehe', t2: 'eheeehee'},
            {t1: 'hhehheh', t2: 'hheehheeh'},
            {t1: 'hhehhee', t2: 'hheehheee'},
            {t1: 'hheeheh', t2: 'hheeeheeh'},
            {t1: 'hheehee', t2: 'hheeeheee'},
            {t1: 'ehehheh', t2: 'eheehheeh'},
            {t1: 'ehehhee', t2: 'eheehheee'},
            {t1: 'eheeheh', t2: 'eheeeheeh'},
            {t1: 'eheehee', t2: 'eheeeheee'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 22. Replace e by ee in el: e -> ee {0,2} || _l
    describe('22. Replace e by ee in el: e -> ee {0,2} || _l', function() {
        const grammar = Replace(t1("e"), t2("ee"), undefined, t1("l"),
                                       false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'el', t2: 'eel'},
            {t1: 'ele', t2: 'eele'},
            {t1: 'ell', t2: 'eell'},
            {t1: 'eel', t2: 'eeel'},
            {t1: 'lel', t2: 'leel'},
            {t1: 'eele', t2: 'eeele'},
            {t1: 'eell', t2: 'eeell'},
            {t1: 'lele', t2: 'leele'},
            {t1: 'lell', t2: 'leell'},
            {t1: 'elel', t2: 'eeleel'},
            {t1: 'elele', t2: 'eeleele'},
            {t1: 'elell', t2: 'eeleell'},
            {t1: 'eleel', t2: 'eeleeel'},
            {t1: 'ellel', t2: 'eelleel'},
            {t1: 'eelel', t2: 'eeeleel'},
            {t1: 'lelel', t2: 'leeleel'},
            {t1: 'eleele', t2: 'eeleeele'},
            {t1: 'eleell', t2: 'eeleeell'},
            {t1: 'ellele', t2: 'eelleele'},
            {t1: 'ellell', t2: 'eelleell'},
            {t1: 'eelele', t2: 'eeeleele'},
            {t1: 'eelell', t2: 'eeeleell'},
            {t1: 'eeleel', t2: 'eeeleeel'},
            {t1: 'eellel', t2: 'eeelleel'},
            {t1: 'lelele', t2: 'leeleele'},
            {t1: 'lelell', t2: 'leeleell'},
            {t1: 'leleel', t2: 'leeleeel'},
            {t1: 'lellel', t2: 'leelleel'},
            {t1: 'eeleele', t2: 'eeeleeele'},
            {t1: 'eeleell', t2: 'eeeleeell'},
            {t1: 'eellele', t2: 'eeelleele'},
            {t1: 'eellell', t2: 'eeelleell'},
            {t1: 'leleele', t2: 'leeleeele'},
            {t1: 'leleell', t2: 'leeleeell'},
            {t1: 'lellele', t2: 'leelleele'},
            {t1: 'lellell', t2: 'leelleell'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    

    // 23. Replace e by ee: e -> ee {0,2} (vocab hel/hel)
    describe('23. Replace e by ee: e -> ee {0,2} (vocab hel/hel)', function() {
        const grammar = Seq(Vocab('t1', "hl"), Vocab('t2', "hl"),
                                   Replace(t1("e"), t2("ee"), undefined, undefined,
                                           false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'e', t2: 'ee'},
            {t1: 'eh', t2: 'eeh'},
            {t1: 'el', t2: 'eel'},
            {t1: 'he', t2: 'hee'},
            {t1: 'le', t2: 'lee'},
            {t1: 'ee', t2: 'eeee'},
            {t1: 'heh', t2: 'heeh'},
            {t1: 'hel', t2: 'heel'},
            {t1: 'leh', t2: 'leeh'},
            {t1: 'lel', t2: 'leel'},
            {t1: 'eeh', t2: 'eeeeh'},
            {t1: 'eel', t2: 'eeeel'},
            {t1: 'ehe', t2: 'eehee'},
            {t1: 'ele', t2: 'eelee'},
            {t1: 'hee', t2: 'heeee'},
            {t1: 'lee', t2: 'leeee'},
            {t1: 'eheh', t2: 'eeheeh'},
            {t1: 'ehel', t2: 'eeheel'},
            {t1: 'eleh', t2: 'eeleeh'},
            {t1: 'elel', t2: 'eeleel'},
            {t1: 'heeh', t2: 'heeeeh'},
            {t1: 'heel', t2: 'heeeel'},
            {t1: 'hehe', t2: 'heehee'},
            {t1: 'hele', t2: 'heelee'},
            {t1: 'leeh', t2: 'leeeeh'},
            {t1: 'leel', t2: 'leeeel'},
            {t1: 'lehe', t2: 'leehee'},
            {t1: 'lele', t2: 'leelee'},
            {t1: 'heheh', t2: 'heeheeh'},
            {t1: 'hehel', t2: 'heeheel'},
            {t1: 'heleh', t2: 'heeleeh'},
            {t1: 'helel', t2: 'heeleel'},
            {t1: 'leheh', t2: 'leeheeh'},
            {t1: 'lehel', t2: 'leeheel'},
            {t1: 'leleh', t2: 'leeleeh'},
            {t1: 'lelel', t2: 'leeleel'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    
    // 24. Replace ee by e in heel: ee -> e {0,2} || h_l
    describe('24. Replace ee by e in heel: ee -> e {0,2} || h_l', function() {
        const grammar = Replace(t1("ee"), t2("e"), t1("h"), t1("l"),
                                           false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'heel', t2: 'hel'},
            {t1: 'heelh', t2: 'helh'},
            {t1: 'heele', t2: 'hele'},
            {t1: 'heell', t2: 'hell'},
            {t1: 'hheel', t2: 'hhel'},
            {t1: 'eheel', t2: 'ehel'},
            {t1: 'lheel', t2: 'lhel'},
            {t1: 'hheelh', t2: 'hhelh'},
            {t1: 'hheele', t2: 'hhele'},
            {t1: 'hheell', t2: 'hhell'},
            {t1: 'eheelh', t2: 'ehelh'},
            {t1: 'eheele', t2: 'ehele'},
            {t1: 'eheell', t2: 'ehell'},
            {t1: 'lheelh', t2: 'lhelh'},
            {t1: 'lheele', t2: 'lhele'},
            {t1: 'lheell', t2: 'lhell'},
            {t1: 'heelheel', t2: 'helhel'},
            {t1: 'heelheelh', t2: 'helhelh'},
            {t1: 'heelheele', t2: 'helhele'},
            {t1: 'heelheell', t2: 'helhell'},
            {t1: 'heelhheel', t2: 'helhhel'},
            {t1: 'heeleheel', t2: 'helehel'},
            {t1: 'heellheel', t2: 'hellhel'},
            {t1: 'hheelheel', t2: 'hhelhel'},
            {t1: 'eheelheel', t2: 'ehelhel'},
            {t1: 'lheelheel', t2: 'lhelhel'},
            {t1: 'heelhheelh', t2: 'helhhelh'},
            {t1: 'heelhheele', t2: 'helhhele'},
            {t1: 'heelhheell', t2: 'helhhell'},
            {t1: 'heeleheelh', t2: 'helehelh'},
            {t1: 'heeleheele', t2: 'helehele'},
            {t1: 'heeleheell', t2: 'helehell'},
            {t1: 'heellheelh', t2: 'hellhelh'},
            {t1: 'heellheele', t2: 'hellhele'},
            {t1: 'heellheell', t2: 'hellhell'},
            {t1: 'hheelheelh', t2: 'hhelhelh'},
            {t1: 'hheelheele', t2: 'hhelhele'},
            {t1: 'hheelheell', t2: 'hhelhell'},
            {t1: 'hheelhheel', t2: 'hhelhhel'},
            {t1: 'hheeleheel', t2: 'hhelehel'},
            {t1: 'hheellheel', t2: 'hhellhel'},
            {t1: 'eheelheelh', t2: 'ehelhelh'},
            {t1: 'eheelheele', t2: 'ehelhele'},
            {t1: 'eheelheell', t2: 'ehelhell'},
            {t1: 'eheelhheel', t2: 'ehelhhel'},
            {t1: 'eheeleheel', t2: 'ehelehel'},
            {t1: 'eheellheel', t2: 'ehellhel'},
            {t1: 'lheelheelh', t2: 'lhelhelh'},
            {t1: 'lheelheele', t2: 'lhelhele'},
            {t1: 'lheelheell', t2: 'lhelhell'},
            {t1: 'lheelhheel', t2: 'lhelhhel'},
            {t1: 'lheeleheel', t2: 'lhelehel'},
            {t1: 'lheellheel', t2: 'lhellhel'},
            {t1: 'hheelhheelh', t2: 'hhelhhelh'},
            {t1: 'hheelhheele', t2: 'hhelhhele'},
            {t1: 'hheelhheell', t2: 'hhelhhell'},
            {t1: 'hheeleheelh', t2: 'hhelehelh'},
            {t1: 'hheeleheele', t2: 'hhelehele'},
            {t1: 'hheeleheell', t2: 'hhelehell'},
            {t1: 'hheellheelh', t2: 'hhellhelh'},
            {t1: 'hheellheele', t2: 'hhellhele'},
            {t1: 'hheellheell', t2: 'hhellhell'},
            {t1: 'eheelhheelh', t2: 'ehelhhelh'},
            {t1: 'eheelhheele', t2: 'ehelhhele'},
            {t1: 'eheelhheell', t2: 'ehelhhell'},
            {t1: 'eheeleheelh', t2: 'ehelehelh'},
            {t1: 'eheeleheele', t2: 'ehelehele'},
            {t1: 'eheeleheell', t2: 'ehelehell'},
            {t1: 'eheellheelh', t2: 'ehellhelh'},
            {t1: 'eheellheele', t2: 'ehellhele'},
            {t1: 'eheellheell', t2: 'ehellhell'},
            {t1: 'lheelhheelh', t2: 'lhelhhelh'},
            {t1: 'lheelhheele', t2: 'lhelhhele'},
            {t1: 'lheelhheell', t2: 'lhelhhell'},
            {t1: 'lheeleheelh', t2: 'lhelehelh'},
            {t1: 'lheeleheele', t2: 'lhelehele'},
            {t1: 'lheeleheell', t2: 'lhelehell'},
            {t1: 'lheellheelh', t2: 'lhellhelh'},
            {t1: 'lheellheele', t2: 'lhellhele'},
            {t1: 'lheellheell', t2: 'lhellhell'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 25. Replace ee by e in hee: ee -> e {0,2} || h_
    describe('25. Replace ee by e in hee: ee -> e {0,2} || h_', function() {
        const grammar = Replace(t1("ee"), t2("e"), t1("h"), undefined,
                                           false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'e', t2: 'e'},
            {t1: 'hee', t2: 'he'},
            {t1: 'heeh', t2: 'heh'},
            {t1: 'heee', t2: 'hee'},
            {t1: 'hhee', t2: 'hhe'},
            {t1: 'ehee', t2: 'ehe'},
            {t1: 'hheeh', t2: 'hheh'},
            {t1: 'hheee', t2: 'hhee'},
            {t1: 'eheeh', t2: 'eheh'},
            {t1: 'eheee', t2: 'ehee'},
            {t1: 'heehee', t2: 'hehe'},
            {t1: 'heeheeh', t2: 'heheh'},
            {t1: 'heeheee', t2: 'hehee'},
            {t1: 'heehhee', t2: 'hehhe'},
            {t1: 'heeehee', t2: 'heehe'},
            {t1: 'hheehee', t2: 'hhehe'},
            {t1: 'eheehee', t2: 'ehehe'},
            {t1: 'heehheeh', t2: 'hehheh'},
            {t1: 'heehheee', t2: 'hehhee'},
            {t1: 'heeeheeh', t2: 'heeheh'},
            {t1: 'heeeheee', t2: 'heehee'},
            {t1: 'hheeheeh', t2: 'hheheh'},
            {t1: 'hheeheee', t2: 'hhehee'},
            {t1: 'hheehhee', t2: 'hhehhe'},
            {t1: 'hheeehee', t2: 'hheehe'},
            {t1: 'eheeheeh', t2: 'eheheh'},
            {t1: 'eheeheee', t2: 'ehehee'},
            {t1: 'eheehhee', t2: 'ehehhe'},
            {t1: 'eheeehee', t2: 'eheehe'},
            {t1: 'hheehheeh', t2: 'hhehheh'},
            {t1: 'hheehheee', t2: 'hhehhee'},
            {t1: 'hheeeheeh', t2: 'hheeheh'},
            {t1: 'hheeeheee', t2: 'hheehee'},
            {t1: 'eheehheeh', t2: 'ehehheh'},
            {t1: 'eheehheee', t2: 'ehehhee'},
            {t1: 'eheeeheeh', t2: 'eheeheh'},
            {t1: 'eheeeheee', t2: 'eheehee'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 26. Replace ee by e in eel: ee -> e {0,2} || _l
    describe('26. Replace e by ee in eel: ee -> e {0,2} || _l', function() {
        const grammar = Replace(t1("ee"), t2("e"), undefined, t1("l"),
                                           false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'e'},
            {t1: 'l', t2: 'l'},
            {t1: 'eel', t2: 'el'},
            {t1: 'eeel', t2: 'eel'},
            {t1: 'eele', t2: 'ele'},
            {t1: 'eell', t2: 'ell'},
            {t1: 'leel', t2: 'lel'},
            {t1: 'eeele', t2: 'eele'},
            {t1: 'eeell', t2: 'eell'},
            {t1: 'leele', t2: 'lele'},
            {t1: 'leell', t2: 'lell'},
            {t1: 'eeleel', t2: 'elel'},
            {t1: 'eeeleel', t2: 'eelel'},
            {t1: 'eeleeel', t2: 'eleel'},
            {t1: 'eeleele', t2: 'elele'},
            {t1: 'eeleell', t2: 'elell'},
            {t1: 'eelleel', t2: 'ellel'},
            {t1: 'leeleel', t2: 'lelel'},
            {t1: 'eeeleeel', t2: 'eeleel'},
            {t1: 'eeeleele', t2: 'eelele'},
            {t1: 'eeeleell', t2: 'eelell'},
            {t1: 'eeelleel', t2: 'eellel'},
            {t1: 'eeleeele', t2: 'eleele'},
            {t1: 'eeleeell', t2: 'eleell'},
            {t1: 'eelleele', t2: 'ellele'},
            {t1: 'eelleell', t2: 'ellell'},
            {t1: 'leeleeel', t2: 'leleel'},
            {t1: 'leeleele', t2: 'lelele'},
            {t1: 'leeleell', t2: 'lelell'},
            {t1: 'leelleel', t2: 'lellel'},
            {t1: 'eeeleeele', t2: 'eeleele'},
            {t1: 'eeeleeell', t2: 'eeleell'},
            {t1: 'eeelleele', t2: 'eellele'},
            {t1: 'eeelleell', t2: 'eellell'},
            {t1: 'leeleeele', t2: 'leleele'},
            {t1: 'leeleeell', t2: 'leleell'},
            {t1: 'leelleele', t2: 'lellele'},
            {t1: 'leelleell', t2: 'lellell'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });


    // 27. Replace ee by e: ee -> e {0,2} (vocab hel/hel)
    describe('27. Replace ee by e: ee -> e {0,2} (vocab hel/hel)', function() {
        const grammar = Seq(Vocab('t1', "hl"), Vocab('t2', "hl"),
                                   Replace(t1("ee"), t2("e"), undefined, undefined,
                                           false, false, 0, 2, 1));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'e', t2: 'e'},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'ee', t2: 'e'},
            {t1: 'eee', t2: 'ee'},
            //{t1: 'eee', t2: 'ee'},
            {t1: 'eeh', t2: 'eh'},
            {t1: 'eel', t2: 'el'},
            {t1: 'hee', t2: 'he'},
            {t1: 'lee', t2: 'le'},
            {t1: 'eeee', t2: 'ee'},
            {t1: 'eeee', t2: 'eee'},
            {t1: 'eeeh', t2: 'eeh'},
            {t1: 'eeel', t2: 'eel'},
            {t1: 'heee', t2: 'hee'},
            {t1: 'heeh', t2: 'heh'},
            {t1: 'heel', t2: 'hel'},
            {t1: 'leee', t2: 'lee'},
            {t1: 'leeh', t2: 'leh'},
            {t1: 'leel', t2: 'lel'},
            {t1: 'eeeee', t2: 'eee'},
            //{t1: 'eeeee', t2: 'eee'},
            //{t1: 'eeeee', t2: 'eee'},
            {t1: 'eeeeh', t2: 'eeh'},
            {t1: 'eeeel', t2: 'eel'},
            {t1: 'eehee', t2: 'ehe'},
            {t1: 'eelee', t2: 'ele'},
            {t1: 'heeee', t2: 'hee'},
            {t1: 'leeee', t2: 'lee'},
            {t1: 'eeeeee', t2: 'eeee'},
            //{t1: 'eeeeee', t2: 'eeee'},
            {t1: 'eeeeeh', t2: 'eeeh'},
            {t1: 'eeeeel', t2: 'eeel'},
            {t1: 'eeehee', t2: 'eehe'},
            {t1: 'eeelee', t2: 'eele'},
            //{t1: 'eeeeee', t2: 'eeee'},
            //{t1: 'eeeeeh', t2: 'eeeh'},
            //{t1: 'eeeeel', t2: 'eeel'},
            {t1: 'eeheee', t2: 'ehee'},
            {t1: 'eeheeh', t2: 'eheh'},
            {t1: 'eeheel', t2: 'ehel'},
            {t1: 'eeleee', t2: 'elee'},
            {t1: 'eeleeh', t2: 'eleh'},
            {t1: 'eeleel', t2: 'elel'},
            {t1: 'heeeee', t2: 'heee'},
            //{t1: 'heeeee', t2: 'heee'},
            {t1: 'heeeeh', t2: 'heeh'},
            {t1: 'heeeel', t2: 'heel'},
            {t1: 'heehee', t2: 'hehe'},
            {t1: 'heelee', t2: 'hele'},
            {t1: 'leeeee', t2: 'leee'},
            //{t1: 'leeeee', t2: 'leee'},
            {t1: 'leeeeh', t2: 'leeh'},
            {t1: 'leeeel', t2: 'leel'},
            {t1: 'leehee', t2: 'lehe'},
            {t1: 'leelee', t2: 'lele'},
            {t1: 'eeeeeee', t2: 'eeeee'},
            {t1: 'eeeeeeh', t2: 'eeeeh'},
            {t1: 'eeeeeel', t2: 'eeeel'},
            {t1: 'eeeheee', t2: 'eehee'},
            {t1: 'eeeheeh', t2: 'eeheh'},
            {t1: 'eeeheel', t2: 'eehel'},
            {t1: 'eeeleee', t2: 'eelee'},
            {t1: 'eeeleeh', t2: 'eeleh'},
            {t1: 'eeeleel', t2: 'eelel'},
            {t1: 'heeeeee', t2: 'heeee'},
            {t1: 'heeeeeh', t2: 'heeeh'},
            {t1: 'heeeeel', t2: 'heeel'},
            {t1: 'heeheee', t2: 'hehee'},
            {t1: 'heeheeh', t2: 'heheh'},
            {t1: 'heeheel', t2: 'hehel'},
            {t1: 'heeleee', t2: 'helee'},
            {t1: 'heeleeh', t2: 'heleh'},
            {t1: 'heeleel', t2: 'helel'},
            {t1: 'leeeeee', t2: 'leeee'},
            {t1: 'leeeeeh', t2: 'leeeh'},
            {t1: 'leeeeel', t2: 'leeel'},
            {t1: 'leeheee', t2: 'lehee'},
            {t1: 'leeheeh', t2: 'leheh'},
            {t1: 'leeheel', t2: 'lehel'},
            {t1: 'leeleee', t2: 'lelee'},
            {t1: 'leeleeh', t2: 'leleh'},
            {t1: 'leeleel', t2: 'lelel'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    // 28. Insert a in h_l: 0 -> a {0,2} || h_l
    describe('28. Insert a in h_l: 0 -> a {0,2} || h_l', function() {
        const grammar = Replace(t1(""), t2("a"), t1("h"), t1("l"),
                                           false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'hl', t2: 'hal'},
            {t1: 'hlh', t2: 'halh'},
            {t1: 'hll', t2: 'hall'},
            {t1: 'hhl', t2: 'hhal'},
            {t1: 'lhl', t2: 'lhal'},
            {t1: 'hhlh', t2: 'hhalh'},
            {t1: 'hhll', t2: 'hhall'},
            {t1: 'lhlh', t2: 'lhalh'},
            {t1: 'lhll', t2: 'lhall'},
            {t1: 'hlhl', t2: 'halhal'},
            {t1: 'hlhlh', t2: 'halhalh'},
            {t1: 'hlhll', t2: 'halhall'},
            {t1: 'hlhhl', t2: 'halhhal'},
            {t1: 'hllhl', t2: 'hallhal'},
            {t1: 'hhlhl', t2: 'hhalhal'},
            {t1: 'lhlhl', t2: 'lhalhal'},
            {t1: 'hlhhlh', t2: 'halhhalh'},
            {t1: 'hlhhll', t2: 'halhhall'},
            {t1: 'hllhlh', t2: 'hallhalh'},
            {t1: 'hllhll', t2: 'hallhall'},
            {t1: 'hhlhlh', t2: 'hhalhalh'},
            {t1: 'hhlhll', t2: 'hhalhall'},
            {t1: 'hhlhhl', t2: 'hhalhhal'},
            {t1: 'hhllhl', t2: 'hhallhal'},
            {t1: 'lhlhlh', t2: 'lhalhalh'},
            {t1: 'lhlhll', t2: 'lhalhall'},
            {t1: 'lhlhhl', t2: 'lhalhhal'},
            {t1: 'lhllhl', t2: 'lhallhal'},
            {t1: 'hhlhhlh', t2: 'hhalhhalh'},
            {t1: 'hhlhhll', t2: 'hhalhhall'},
            {t1: 'hhllhlh', t2: 'hhallhalh'},
            {t1: 'hhllhll', t2: 'hhallhall'},
            {t1: 'lhlhhlh', t2: 'lhalhhalh'},
            {t1: 'lhlhhll', t2: 'lhalhhall'},
            {t1: 'lhllhlh', t2: 'lhallhalh'},
            {t1: 'lhllhll', t2: 'lhallhall'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

    
    // 29. Delete e in hel: e -> 0 {0,2} || h_l
    describe('29. Delete e in hel: e -> 0 {0,2} || h_l', function() {
        const grammar = Replace(t1("e"), t2(""), t1("h"), t1("l"),
                                           false, false, 0, 2, 1);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 2});
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'h'},
            {t1: 'l', t2: 'l'},
            {t1: 'hel', t2: 'hl'},
            {t1: 'helh', t2: 'hlh'},
            {t1: 'hell', t2: 'hll'},
            {t1: 'hhel', t2: 'hhl'},
            {t1: 'lhel', t2: 'lhl'},
            {t1: 'hhelh', t2: 'hhlh'},
            {t1: 'hhell', t2: 'hhll'},
            {t1: 'lhelh', t2: 'lhlh'},
            {t1: 'lhell', t2: 'lhll'},
            {t1: 'helhel', t2: 'hlhl'},
            {t1: 'helhelh', t2: 'hlhlh'},
            {t1: 'helhell', t2: 'hlhll'},
            {t1: 'helhhel', t2: 'hlhhl'},
            {t1: 'hellhel', t2: 'hllhl'},
            {t1: 'hhelhel', t2: 'hhlhl'},
            {t1: 'lhelhel', t2: 'lhlhl'},
            {t1: 'helhhelh', t2: 'hlhhlh'},
            {t1: 'helhhell', t2: 'hlhhll'},
            {t1: 'hellhelh', t2: 'hllhlh'},
            {t1: 'hellhell', t2: 'hllhll'},
            {t1: 'hhelhelh', t2: 'hhlhlh'},
            {t1: 'hhelhell', t2: 'hhlhll'},
            {t1: 'hhelhhel', t2: 'hhlhhl'},
            {t1: 'hhellhel', t2: 'hhllhl'},
            {t1: 'lhelhelh', t2: 'lhlhlh'},
            {t1: 'lhelhell', t2: 'lhlhll'},
            {t1: 'lhelhhel', t2: 'lhlhhl'},
            {t1: 'lhellhel', t2: 'lhllhl'},
            {t1: 'hhelhhelh', t2: 'hhlhhlh'},
            {t1: 'hhelhhell', t2: 'hhlhhll'},
            {t1: 'hhellhelh', t2: 'hhllhlh'},
            {t1: 'hhellhell', t2: 'hhllhll'},
            {t1: 'lhelhhelh', t2: 'lhlhhlh'},
            {t1: 'lhelhhell', t2: 'lhlhhll'},
            {t1: 'lhellhelh', t2: 'lhllhlh'},
            {t1: 'lhellhell', t2: 'lhllhll'},
        ];
        testGrammar(grammar, expectedResults, undefined, undefined, 100);
    });

});