import { 
    Dot,
    Epsilon,
    Filter,
    Grammar,
    Intersect,
    Join,
    Maybe,
    Not,
    Rename,
    Replace, 
    ReplaceGrammar, 
    //Empty, 
    Seq,
    Uni,
    Vocab
} from "../src/grammars";

import { 
    t1, t2, 
    testHasTapes, 
    testHasVocab,
    testGrammar, 
} from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";

const und = undefined;

function ReplaceBypass(
    fromState: Grammar, toState: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    maxCopyChars: number = Infinity,
    vocabBypass: boolean = true
): ReplaceGrammar {
    return Replace(fromState, toState, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, maxCopyChars, vocabBypass);
}

describe(`${path.basename(module.filename)}`, function() {
    
    describe('0a. Replace i by o in i: i -> o, only using Join', function() {
        const grammar = Join(t1("i"),
                         ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0b. Replace i by o in hi: i -> o, only using Join', function() {
        const grammar = Join(t1("hi"),
                         ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ho'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0c. Replace i by o in ip: i -> o, only using Join', function() {
        const grammar = Join(t1("ip"),
                         ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'ip', t2: 'op'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0d. Replace i by o in hip: i -> o, only using Join', function() {
        const grammar = Join(t1("hip"),
                         ReplaceBypass(t1("i"), t2("o")));
                        //  ReplaceBypass(t1("i"), t2("o"), und, und, und, false, false, 0, Infinity, 100, Infinity));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0d-1. Replace i by o in hip: i -> o, only using Join', function() {
        const grammar = Join(t1("hip"),
                         ReplaceBypass(t1("i"), t2("o"), und, und, und, false, false, 0, Infinity, 100, 100));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0e. Replace i by o in i: i -> o, only using Filter', function() {
        const grammar = Filter(ReplaceBypass(t1("i"), t2("o")),
                                t1("i"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0f. Replace i by o in hi: i -> o, only using Filter', function() {
        const grammar = Filter(ReplaceBypass(t1("i"), t2("o")),
                                t1("hi"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hi', t2: 'ho'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0g. Replace i by o in ip: i -> o, only using Filter', function() {
        const grammar = Filter(ReplaceBypass(t1("i"), t2("o")),
                                t1("ip"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'ip', t2: 'op'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0h. Replace i by o in hip: i -> o, only using Filter', function() {
        const grammar = Filter(ReplaceBypass(t1("i"), t2("o")),
                                t1("hip"));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0j. Replace i by o with vocab hi: i -> o {0,3}, but no join/filter', function() {
        const grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'),
                            ReplaceBypass(t1("i"), t2("o"), und, und, und, false, false, 0, 3, 3, Infinity));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: "ihh", t2: "ohh"},
            {t1: "hhh", t2: "hhh"},
            {t1: "hh", t2: "hh"},
            {t1: "hih", t2: "hoh"},
            {t1: "iih", t2: "ooh"},
            {t1: "ih", t2: "oh"},
            {t1: "h", t2: "h"},
            {t1: "hhi", t2: "hho"},
            {t1: "ihi", t2: "oho"},
            {t1: "hi", t2: "ho"},
            {t1: "hii", t2: "hoo"},
            {t1: "iii", t2: "ooo"},
            {t1: "ii", t2: "oo"},
            {t1: "i", t2: "o"},
            {},
            // should not include
            // {t1: "ihh", t2: "ihh"},
            // {t1: "iih", t2: "iih"},
            // {t1: "hih", t2: "hih"},
            // {t1: "hii", t2: "hii"},
            // {t1: "hhi", t2: "hhi"},
        ];
        testGrammar(grammar, expectedResults, '', 4, 7);
    });

    describe('0j-1. Replace i by o with vocab hi: i -> o {0,3}, but no join/filter', function() {
        const grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'),
                            ReplaceBypass(t1("i"), t2("o"), und, und, und, false, false, 0, 3, 3, 6));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: "ihh", t2: "ohh"},
            {t1: "hhh", t2: "hhh"},
            {t1: "hh", t2: "hh"},
            {t1: "hih", t2: "hoh"},
            {t1: "iih", t2: "ooh"},
            {t1: "ih", t2: "oh"},
            {t1: "h", t2: "h"},
            {t1: "hhi", t2: "hho"},
            {t1: "ihi", t2: "oho"},
            {t1: "hi", t2: "ho"},
            {t1: "hii", t2: "hoo"},
            {t1: "iii", t2: "ooo"},
            {t1: "ii", t2: "oo"},
            {t1: "i", t2: "o"},
            {},
            // should not include
            // {t1: "ihh", t2: "ihh"},
            // {t1: "iih", t2: "iih"},
            // {t1: "hih", t2: "hih"},
            // {t1: "hii", t2: "hii"},
            // {t1: "hhi", t2: "hhi"},
        ];
        testGrammar(grammar, expectedResults, '', 4, 7);
    });

    describe('0j-2. Replace i by o with vocab hi: i -> o {0,3}, but no join/filter', function() {
        const grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'),
                            ReplaceBypass(t1("i"), t2("o"), und, und, und, false, false, 0, 3, 3, 2000));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: "ihh", t2: "ohh"},
            {t1: "hhh", t2: "hhh"},
            {t1: "hh", t2: "hh"},
            {t1: "hih", t2: "hoh"},
            {t1: "iih", t2: "ooh"},
            {t1: "ih", t2: "oh"},
            {t1: "h", t2: "h"},
            {t1: "hhi", t2: "hho"},
            {t1: "ihi", t2: "oho"},
            {t1: "hi", t2: "ho"},
            {t1: "hii", t2: "hoo"},
            {t1: "iii", t2: "ooo"},
            {t1: "ii", t2: "oo"},
            {t1: "i", t2: "o"},
            {},
            // should not include
            // {t1: "ihh", t2: "ihh"},
            // {t1: "iih", t2: "iih"},
            // {t1: "hih", t2: "hih"},
            // {t1: "hii", t2: "hii"},
            // {t1: "hhi", t2: "hhi"},
        ];
        testGrammar(grammar, expectedResults, '', 4, 7);
    });

    describe('0j-3. Replace i by o with vocab hi: i -> o {0,3}, but no join/filter', function() {
        const grammar = Seq(Vocab('t1', 'hi'), Vocab('t2', 'hio'),
                            ReplaceBypass(t1("i"), t2("o"), und, und, und, false, false, 0, 3, 3, 2500));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: "ihh", t2: "ohh"},
            {t1: "hhh", t2: "hhh"},
            {t1: "hh", t2: "hh"},
            {t1: "hih", t2: "hoh"},
            {t1: "iih", t2: "ooh"},
            {t1: "ih", t2: "oh"},
            {t1: "h", t2: "h"},
            {t1: "hhi", t2: "hho"},
            {t1: "ihi", t2: "oho"},
            {t1: "hi", t2: "ho"},
            {t1: "hii", t2: "hoo"},
            {t1: "iii", t2: "ooo"},
            {t1: "ii", t2: "oo"},
            {t1: "i", t2: "o"},
            {},
            // should not include
            // {t1: "ihh", t2: "ihh"},
            // {t1: "iih", t2: "iih"},
            // {t1: "hih", t2: "hih"},
            // {t1: "hii", t2: "hii"},
            // {t1: "hhi", t2: "hhi"},
        ];
        testGrammar(grammar, expectedResults, '', 4, 7);
    });


    
    /*
    // 1. Replace e by a in hello: e -> a
    describe('1. Replace e by a in hello: e -> a', function() {
        const grammar = JoinReplace(t1("hello"),
                            [ ReplaceBypass(t1("e"), t2("a"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    // 1b. Replace e by a in hello: e -> a, same tape
    describe('1b. Replace e by a in hello: e -> a', function() {
        const grammar = JoinReplace(t1("hello"),
                            [ ReplaceBypass(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });
    */


});