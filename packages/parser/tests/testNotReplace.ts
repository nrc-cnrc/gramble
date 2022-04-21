import { 
    Count,
    Epsilon,
    Grammar,
    JoinReplace,
    Not,
    Replace, 
    ReplaceGrammar, 
    Seq,
    Uni,
    Vocab,
} from "../src/grammars";

import { 
    t1, t2, 
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

    describe('1a. JoinReplace i by a in i: i -> a, different tape', function() {
        const grammar = JoinReplace(t1("i"),
                                    [ReplaceBypass(t1("i"), t2("a"))]);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'a'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1b. Negation of results of 1a', function() {
        let grammar: Grammar = Not(Seq(t1("i"), t2("a"), Vocab("t2", "i")));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {"t2":"i","t1":"i"},
            {"t1":"ii"},
            {"t1":"i"},
            {"t2":"ii"},
            {"t2":"ai"},
            {"t2":"i"},
            {"t2":"ia"},
            {"t2":"aa"},
            {"t2":"a"},
            {}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('1c. Negation of grammar of 1a', function() {
        let grammar: Grammar = Not(JoinReplace(t1("i"),
                                    [ReplaceBypass(t1("i"), t2("a"))]));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {"t2":"i","t1":"i"},
            {"t1":"ii"},
            {"t1":"i"},
            {"t2":"ii"},
            {"t2":"ai"},
            {"t2":"i"},
            {"t2":"ia"},
            {"t2":"aa"},
            {"t2":"a"},
            {}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('2a. JoinReplace i by a in i: i -> a, same tape', function() {
        const grammar = JoinReplace(t1("i"),
                                    [ReplaceBypass(t1("i"), t1("a"))]);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {t1: 'a'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2b. Negation of results of 2a', function() {
        let grammar: Grammar = Not(Seq(t1("a"), Vocab("t1", "i")));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {"t1":"ii"},
            {"t1":"ai"},
            {"t1":"i"},
            {"t1":"ia"},
            {"t1":"aa"},
            {}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });
    
    /*

    // This result isn't correct for the kind of negation we've implemented (
    //   negation relativized to a set of tapes that includes a hidden tape).  
    //    However, we are eventually also going to need another kind of negation,
    //    negation relativized only to visible tapes.  So let's keep this test 
    //    around, to be restored once that operation is available.

    describe('2c. Negation of grammar of 2a', function() {
        let grammar: Grammar = Not(JoinReplace(t1("i"),
                                    [ReplaceBypass(t1("i"), t1("a"))]));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {"t1":"ii"},
            {"t1":"ai"},
            {"t1":"i"},
            {"t1":"ia"},
            {"t1":"aa"},
            {}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    */

    describe('3a. Replace i by a', function() {
        let grammar: Grammar = ReplaceBypass(t1("i"), t2("a"));
        grammar = Count(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {"t2":"aa","t1":"ii"},
            {"t2":"a","t1":"i"},
            {}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });
    
    describe('3b. Negation of outputs of 3a', function() {
        let grammar: Grammar = Not(Uni(Epsilon(),
                                Seq(t1("i"), t2("a"), Vocab("t2", "i")),
                                Seq(t1("ii"), t2("aa"))));
        grammar = Count(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {"t2":"ii","t1":"ii"}, {"t2":"ai","t1":"ii"},
            {"t1":"iii","t2":"i"}, {"t1":"ii","t2":"i"},
            {"t2":"iii","t1":"i"}, {"t2":"aii","t1":"i"},
            {"t2":"ii","t1":"i"}, {"t2":"iai","t1":"i"},
            {"t2":"aai","t1":"i"}, {"t2":"ai","t1":"i"},
            {"t2":"i","t1":"i"}, {"t2":"ia","t1":"ii"},
            {"t1":"iii","t2":"a"}, {"t1":"ii","t2":"a"},
            {"t2":"iia","t1":"i"}, {"t2":"aia","t1":"i"},
            {"t2":"ia","t1":"i"}, {"t2":"iaa","t1":"i"},
            {"t2":"aaa","t1":"i"}, {"t2":"aa","t1":"i"},
            {"t1":"iiii"}, {"t1":"iii"}, {"t1":"ii"}, {"t1":"i"},
            {"t2":"iiii"}, {"t2":"aiii"}, {"t2":"iii"}, {"t2":"iaii"},
            {"t2":"aaii"}, {"t2":"aii"}, {"t2":"ii"}, {"t2":"iiai"},
            {"t2":"aiai"}, {"t2":"iai"}, {"t2":"iaai"}, {"t2":"aaai"},
            {"t2":"aai"}, {"t2":"ai"}, {"t2":"i"}, {"t2":"iiia"},
            {"t2":"aiia"}, {"t2":"iia"}, {"t2":"iaia"}, {"t2":"aaia"},
            {"t2":"aia"}, {"t2":"ia"}, {"t2":"iiaa"}, {"t2":"aiaa"},
            {"t2":"iaa"}, {"t2":"iaaa"}, {"t2":"aaaa"}, {"t2":"aaa"},
            {"t2":"aa"}, {"t2":"a"}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('3c. Negation of grammar of 3a', function() {
        let grammar: Grammar = Not(ReplaceBypass(t1("i"), t2("a")));
        grammar = Count(4, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {"t2":"ii","t1":"ii"}, {"t2":"ai","t1":"ii"},
            {"t1":"iii","t2":"i"}, {"t1":"ii","t2":"i"},
            {"t2":"iii","t1":"i"}, {"t2":"aii","t1":"i"},
            {"t2":"ii","t1":"i"}, {"t2":"iai","t1":"i"},
            {"t2":"aai","t1":"i"}, {"t2":"ai","t1":"i"},
            {"t2":"i","t1":"i"}, {"t2":"ia","t1":"ii"},
            {"t1":"iii","t2":"a"}, {"t1":"ii","t2":"a"},
            {"t2":"iia","t1":"i"}, {"t2":"aia","t1":"i"},
            {"t2":"ia","t1":"i"}, {"t2":"iaa","t1":"i"},
            {"t2":"aaa","t1":"i"}, {"t2":"aa","t1":"i"},
            {"t1":"iiii"}, {"t1":"iii"}, {"t1":"ii"}, {"t1":"i"},
            {"t2":"iiii"}, {"t2":"aiii"}, {"t2":"iii"}, {"t2":"iaii"},
            {"t2":"aaii"}, {"t2":"aii"}, {"t2":"ii"}, {"t2":"iiai"},
            {"t2":"aiai"}, {"t2":"iai"}, {"t2":"iaai"}, {"t2":"aaai"},
            {"t2":"aai"}, {"t2":"ai"}, {"t2":"i"}, {"t2":"iiia"},
            {"t2":"aiia"}, {"t2":"iia"}, {"t2":"iaia"}, {"t2":"aaia"},
            {"t2":"aia"}, {"t2":"ia"}, {"t2":"iiaa"}, {"t2":"aiaa"},
            {"t2":"iaa"}, {"t2":"iaaa"}, {"t2":"aaaa"}, {"t2":"aaa"},
            {"t2":"aa"}, {"t2":"a"}
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('4a. Replace i by a: i -> a', function() {
        let grammar: Grammar = ReplaceBypass(t1("i"), t2("a"));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {t1: 'i', t2: 'a'},
            {},
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('4b. Negation of results of 4a', function() {
        let grammar: Grammar = Seq(Vocab("t2", "ai"),
                            Not(Uni(Epsilon(), Seq(t1("i"), t2("a")))));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            {"t2":"i","t1":"i"},
            {"t1":"ii"},
            {"t1":"i"},
            {"t2":"ii"},
            {"t2":"ai"},
            {"t2":"i"},
            {"t2":"ia"},
            {"t2":"aa"},
            {"t2":"a"},
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('4c. Negation of grammar of 4a', function() {
        let grammar: Grammar = Not(ReplaceBypass(t1("i"), t2("a")));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 1, t2: 2});
        const expectedResults: StringDict[] = [
            // Should include:
            {"t2":"i","t1":"i"},
            // Does include:
            {"t1":"ii"},
            {"t1":"i"},
            {"t2":"ii"},
            {"t2":"ai"},
            {"t2":"i"},
            {"t2":"ia"},
            {"t2":"aa"},
            {"t2":"a"},
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('5a. Replace i by a: i -> a, same tape', function() {
        let grammar: Grammar = ReplaceBypass(t1("i"), t1("a"));
        grammar = Count(4, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {t1: 'a'},
            {t1: 'aa'},
            {},
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    describe('5b. Negation of results of 5a', function() {
        let grammar: Grammar = Seq(Vocab("t1", "ai"),
                            Not(Uni(Epsilon(), t1("a"), t1("aa"))));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {t1: 'ii'},
            {t1: 'ai'},
            {t1: 'i'},
            {t1: 'ia'},
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });
    
    /*
    // See note to 2c.

    describe('5c. Negation of grammar of 5a', function() {
        let grammar: Grammar = Not(ReplaceBypass(t1("i"), t1("a")));
        grammar = Count(2, grammar);
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {t1: 'ii'},
            {t1: 'ai'},
            {t1: 'i'},
            {t1: 'ia'},
            // Should not include
            // {},
            // {},
            // {t1: "a"},
            // {t1: "aa"},
        ];
        testGrammar(grammar, expectedResults, undefined, 4);
    });

    */

});