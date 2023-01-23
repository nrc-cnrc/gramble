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
    t1, t2, 
    testHasTapes, 
    testHasVocab,
    testGrammar,
} from './testUtil';

import * as path from 'path';
import { StringDict } from "../src/util";

describe(`${path.basename(module.filename)}`, function() {

    // 61. t1/t2:hi+Match(t1:hi, t2:.*)
    describe('1a: t1/t2:hi+Match(t1:hi, t2:.*)', function() {
        const grammar =  Seq(t1("hi"), t2("hi"),
                             Match(Seq(t1("hi"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, [
            { t1: "hihi", t2: "hihi" }
        ]);
    }); 

    // 61b. t1/t2:hi+Match(t1:hi, t2:.*)
    describe('1b: t2/t1:hi+Match(t1:hi, t2:.*)', function() {
        const grammar =  Seq(t2("hi"), t1("hi"),
                             Match(Seq(t1("hi"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, [
            { t1: "hihi", t2: "hihi" }
        ]);
    }); 

    // 61b. t1/t2:hi+Match(t1:hi, t2:.*)
    // can't succeed -- "a" isn't in the t2 vocab
    describe('1c: t1:ha+t2:hi+Match(t1:ha, t2:.*)', function() {
        const grammar =  Seq(t1("ha"), t2("hi"),
                             Match(Seq(t1("ha"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, []);
    }); 

    // 61b. t1/t2:hi+Match(t1:hi, t2:.*)
    // can't succeed -- "a" isn't in the t2 vocab -- but can churn effectively forever
    describe('1d: t2:hi+t2:ha+Match(t1:ha, t2:.*)', function() {
        const grammar =  Seq(t2("hi"), t1("ha"),
                             Match(Seq(t1("ha"), Rep(Dot("t2"))), "t1", "t2"));
        testHasTapes(grammar, ['t1', 't2']);
        testGrammar(grammar, []);
    }); 

    describe('2a. Joining a literal to matching .* on t1 and t2', function() {
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
        testGrammar(grammar, expectedResults);
    }); 

    describe('2b. Joining a literal to matching .* on t1 and t2', function() {
        const grammar = Seq(t2("hip"),
                            Join(t1("hip"),
                                 Match(Seq(Rep(Dot("t1")), Rep(Dot("t2"))),
                                       "t1", "t2")))
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 3});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hiphip'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

    describe('3. Replace i by o in hip: i -> o, only using Join', function() {
        const grammar = Seq(t2(""),
                            Join(t1("hip"),
                                 Replace(t1("i"), t2("o"))));
        testHasTapes(grammar, ['t1', 't2']);
        testHasVocab(grammar, {t1: 3, t2: 4});
        const expectedResults: StringDict[] = [
            {t1: 'hip', t2: 'hop'},
        ];
        testGrammar(grammar, expectedResults);
    }); 

});
