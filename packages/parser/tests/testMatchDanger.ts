import { 
    Dot,
    Join,
    Match,
    Rep,
    Replace, 
    Seq,
    Vocab
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2, 
    testHasTapes, 
    testHasVocab,
    testGenerate,
} from './testUtil';

import {
    StringDict, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1a. t1:hi + t2:hi + Match(t1:hi + t2:.*)', function() {
        const grammar =  Seq(t1("hi"), t2("hi"),
                             Match(Seq(t1("hi"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        const expectedResults: StringDict[] = [
            { t1: 'hihi', t2: 'hihi' },
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('1b. t2:hi + t1:hi + Match(t1:hi + t2:.*)', function() {
        const grammar =  Seq(t2("hi"), t1("hi"),
                             Match(Seq(t1("hi"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        const expectedResults: StringDict[] = [
            { t1: 'hihi', t2: 'hihi' },
        ];
        testGenerate(grammar, expectedResults);
    }); 

    // can't succeed -- "a" isn't in the t2 vocab
    describe('1c: t1:ha + t2:hi + Match(t1:ha + t2:.*)', function() {
        const grammar =  Seq(t1("ha"), t2("hi"),
                             Match(Seq(t1("ha"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testGenerate(grammar, []);
    }); 

    // can't succeed -- "a" isn't in the t2 vocab -- 
    // but can churn effectively forever
    describe('1d: t2:hi + t1:ha + Match(t1:ha + t2:.*)', function() {
        const grammar =  Seq(t2("hi"), t1("ha"),
                             Match(Seq(t1("ha"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testGenerate(grammar, []);
    }); 

    describe('2a. Join a literal to matching .* on t1 and t2: ' +
             't1:hip + (t1:hip ⨝ Match(t1:.* + t2:.*)) (vocab t2:hip)', function() {
        const grammar = Seq(t1("hip"),
                            Join(t1("hip"),
                                 Match(Seq(Rep(Dot("t1")), Rep(Dot("t2"))),
                                       "t1", "t2")), 
                            Vocab({t2: 'hip'})
        );
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hiphip', t2: 'hip'},
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('2b. Join a literal to matching .* on t1 and t2: ' +
             't2:hip + (t1:hip ⨝ Match(t1:.* + t2:.*))', function() {
        const grammar = Seq(t2("hip"),
                            Join(t1("hip"),
                                 Match(Seq(Rep(Dot("t1")), Rep(Dot("t2"))),
                                       "t1", "t2")))
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hiphip'},
        ];
        testGenerate(grammar, expectedResults);
    }); 

    describe('3. Replace i by o in hip: ' +
             't2:"" + t1:hip ⨝ t1:i -> t2:o, only using Join', function() {
        const grammar = Seq(t2(""),
                            Join(t1("hip"),
                                 Replace(t1("i"), t2("o"))));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGenerate(grammar, expectedResults);
    }); 

});
