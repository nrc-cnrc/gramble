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

    
    // 1. Replace e by a in hello: e -> a {1+} || ^h_llo$
    describe('0. Replace e by a in hello: e -> a, not using JoinReplace', function() {
        const grammar = Join(t1("hello"),
                         ReplaceBypass(t1("e"), t2("a")));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 4, t2: 5});
        const expectedResults: StringDict[] = [
            {t1: 'hello', t2: 'hallo'},
        ];
        testGrammar(grammar, expectedResults);
    });

    // 1. Replace e by a in hello: e -> a {1+} || ^h_llo$
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
    
    // 1b. Replace e by a in hello: e -> a, same tape|| ^h_llo$
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



});