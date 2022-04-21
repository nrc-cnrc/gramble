import { 
    Epsilon,
    Grammar,
    Join,
    JoinReplace,
    Replace,
    ReplaceGrammar,
    Seq,
    Uni,
} from "../src/grammars";

import { 
    t1, t2, t3,
    testHasTapes,
    testHasVocab,
    testGrammar,
} from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";

function ReplaceBypass(
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    maxCopyChars: number = Infinity,
    vocabBypass: boolean = true
): ReplaceGrammar {
    return Replace(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, maxCopyChars, vocabBypass);
}

describe(`${path.basename(module.filename)}`, function() {

    describe('0a. Replace i by o in i: i -> o, only using Join', function() {
        const grammar = Join(Uni(t1("i"), t1("o"), t1("a")),
                             ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'o'},
            {t1: 'o', t2: 'o'},
            {t1: 'a', t2: 'a'},
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
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1. Replace e by a in hello: e -> a
    describe('1. Replace e by a in hello: e -> a', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    // 1b. Replace e by a in hello: e -> a, same tape
    describe('1b. Replace e by a in hello: e -> a, same tape', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2a. Replace e by a, then a by u, in hello: e -> a, a -> u', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("a"), t3("u"))]);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('2b. Replace e by a, then a by u, in hello: e -> a, a -> u, same tape', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("a"), t1("u"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2c. Replace e by a (same tape), then a by u (diff tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("a"), t2("u"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 5, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hallo", t2: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2d. Replace e by a (diff tape), then a by u (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("a"), t2("u"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "hullo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('3a. Replace e by a, then l by w, in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("l"), t3("w"))]);
        testHasTapes(grammar, ['t1', 't2', 't3']);
        testHasVocab(grammar, {t1: 4, t2:5, t3:6});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo', t3: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });


    describe('3b. Replace e by a (diff tape), then l by w (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t2("l"), t2("w"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hello", t2: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3c. Replace e by a (same tape), then l by w (diff tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("l"), t2("w"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 5, t2: 6});
        const expectedResults: StringDict[] = [
            {t1: "hallo", t2: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3d. Replace e by a (same tape), then l by w (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("a"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("l"), t1("w"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('3e. Replace l by w (same tape), then e by a (same tape), in hello', function() {
        const innerReplace = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("l"), t1("w"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("e"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 6});
        const expectedResults: StringDict[] = [
            {t1: "hawwo"},
        ];
        testGrammar(grammar, expectedResults);
    });

    
    describe('3f. Replace b by v (same tape), then a by e (same tape), in ab', function() {
        const innerReplace = JoinReplace(t1("ab"),
                                    [ReplaceBypass(t1("b"), t1("v"))]);
        const grammar = JoinReplace(innerReplace, 
                                [ ReplaceBypass(t1("a"), t1("e"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: "ev"},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4a. Replace e -> e in hello', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t2("e"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4b. Replace e -> e in hello, same tape', function() {
        const grammar = JoinReplace(t1("hello"),
                                    [ReplaceBypass(t1("e"), t1("e"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hello'},
        ];
        testGrammar(grammar, expectedResults);
    });

});