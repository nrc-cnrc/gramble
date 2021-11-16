import { 
    Dot,
    Epsilon,
    Grammar,
    Intersect,
    Join,
    JoinReplace,
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
    InputResultsPair, 
    t1, t2, 
    testHasTapes, 
    testHasVocab,
    testGrammar, 
    testParseMultiple
} from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";
import { EPSILON } from "../src/exprs";


export function ReplaceBypass(
    fromState: Grammar, toState: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    beginsWith: Boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    vocabBypass: boolean = true
): ReplaceGrammar {
    return Replace(fromState, toState, 
        preContext, postContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, vocabBypass);
}

describe(`${path.basename(module.filename)}`, function() {

    
    describe('0a. Replace i by o in i: i -> a, only using Join', function() {
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

    describe('0c. Replace i by o in ip: i -> a, only using Join', function() {
        const grammar = Join(t1("ip"),
                         ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 2, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'ip', t2: 'op'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0d. Replace i by o in hip: i -> a, only using Join', function() {
        const grammar = Join(t1("hip"),
                         ReplaceBypass(t1("i"), t2("o")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
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