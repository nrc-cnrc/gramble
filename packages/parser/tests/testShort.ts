import { 
    Grammar,
    Count,
    Join,
    Not,
    Seq,
    Rep,
    Vocab,
    Dot,
    Short,
    Uni,
} from "../src/grammars";

import { 
    t1,
    testHasTapes, 
    testHasVocab, 
    testGrammar,
} from './testUtil';

import * as path from 'path';
import { DIRECTION_LTR, StringDict, VERBOSE_DEBUG } from "../src/util";


describe(`${path.basename(module.filename)}`, function() {

    describe('1. Short(t1:h)', function() {
        const grammar = Short(t1("h"));
        const expectedResults: StringDict[] = [ {t1:"h"}];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 1});
        testGrammar(grammar, expectedResults);
    });

    describe('1b. Short(t1:h|t1:hh)', function() {
        const grammar = Short(Uni(t1("h"), t1("hh")));
        const expectedResults: StringDict[] = [ {t1:"h"}];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 1});
        testGrammar(grammar, expectedResults);
    });
    describe('3a. Short(t1:h*)', function() {
        const grammar = Short(Rep(t1("h")));
        const expectedResults: StringDict[] = [ {}];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 1});
        testGrammar(grammar, expectedResults);
    });
    
    describe('3b. Short(t1:h+)', function() {
        const grammar = Short(Rep(t1("h"), 1, Infinity));
        const expectedResults: StringDict[] = [ {t1:"h"}];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 1});
        testGrammar(grammar, expectedResults);
    });
    
    describe('4. Short(t1:h{2,})', function() {
        const grammar = Short(Rep(t1("h"), 2, Infinity));
        const expectedResults: StringDict[] = [ {t1:"hh"}];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 1});
        testGrammar(grammar, expectedResults);
    });
    
    describe('4. Short(t1:.+) with vocab [hi]', function() {
        const grammar = Seq(Short(Rep(Dot("t1"), 1, Infinity)), Vocab("t1", "hi"));
        const expectedResults: StringDict[] = [ 
            {t1:"h"}, 
            {t1:"i"}
        ];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 2});
        testGrammar(grammar, expectedResults);
    });

    if (DIRECTION_LTR) {
        
        // these are all expressed in a way only consistent with
        // LTR generation.  At some point we should go through and
        // write RTL ones too
        
        describe('2. Short(t1:h|hi|hello|goo|goodbye|golf)', function() {
            const grammar = Short(Uni(t1("h"), t1("hi"), t1("hello"),
                                t1("goo"), t1("goodbye"), t1("golf")));
            const expectedResults: StringDict[] = [ 
                {t1:"h"},
                {t1:"goo"},
                {t1:"golf"}
            ];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 10});
            testGrammar(grammar, expectedResults);
        });
        

        describe('5. Short(t1:.*i) with vocab [hi]', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("i")));
            grammar = Seq(grammar, Vocab("t1", "hi"));
            grammar = Count(4, grammar);
            const expectedResults: StringDict[] = [ 
                {t1:"i"}, 
                {t1:"hi"},
                {t1:"hhi"},
                {t1:"hhhi"}
            ];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 2});
            testGrammar(grammar, expectedResults);
        });

        describe('6. Contains at least one t1:i', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("i")));
            grammar = Seq(grammar, Rep(Dot("t1")));
            grammar = Seq(grammar, Vocab("t1", "hi"));
            grammar = Count(4, grammar);
            const expectedResults: StringDict[] = [ 
                {"t1":"hhhi"},
                {"t1":"hhih"},
                {"t1":"hhii"},
                {"t1":"hhi"},
                {"t1":"hihh"},
                {"t1":"hihi"},
                {"t1":"hih"},
                {"t1":"hiih"},
                {"t1":"hiii"},
                {"t1":"hii"},
                {"t1":"hi"},
                {"t1":"ihhh"},
                {"t1":"ihhi"},
                {"t1":"ihh"},
                {"t1":"ihih"},
                {"t1":"ihii"},
                {"t1":"ihi"},
                {"t1":"ih"},
                {"t1":"iihh"},
                {"t1":"iihi"},
                {"t1":"iih"},
                {"t1":"iiih"},
                {"t1":"iiii"},
                {"t1":"iii"},
                {"t1":"ii"},
                {"t1":"i"}
            ];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 2});
            testGrammar(grammar, expectedResults);
        });

        describe('7. Does not contain any t1:i', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("i")));
            grammar = Seq(grammar, Rep(Dot("t1")));
            grammar = Not(grammar);
            grammar = Seq(grammar, Vocab("t1", "hi"));
            grammar = Count(4, grammar);
            const expectedResults: StringDict[] = [ 
                {},
                {t1:"h"},
                {t1:"hh"},
                {t1:"hhh"},
                {t1:"hhhh"}
            ];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 2});
            testGrammar(grammar, expectedResults);
        });

        describe('8a. t1:abcdef ⨝ not-contain(t1:i)', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("i")));
            grammar = Seq(grammar, Rep(Dot("t1")));
            grammar = Not(grammar);
            grammar = Join(t1("abcdef"), grammar);
            grammar = Seq(grammar, Vocab("t1", "hi"));
            const expectedResults: StringDict[] = [ 
                {t1:"abcdef"}
            ];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 8});
            testGrammar(grammar, expectedResults);
        });
        
        describe('8b. not-contain(t1:i) ⨝ t1:abcdef', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("i")));
            grammar = Seq(grammar, Rep(Dot("t1")));
            grammar = Not(grammar);
            grammar = Join(grammar, t1("abcdef"));
            grammar = Seq(grammar, Vocab("t1", "hi"));
            const expectedResults: StringDict[] = [ 
                {t1:"abcdef"}
            ];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 8});
            testGrammar(grammar, expectedResults);
        });
        
        describe('9a. t1:abcdef ⨝ not-contain(t1:b)', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("b")));
            grammar = Seq(grammar, Rep(Dot("t1")));
            grammar = Not(grammar);
            grammar = Join(t1("abcdef"), grammar);
            const expectedResults: StringDict[] = [];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 6});
            testGrammar(grammar, expectedResults);
        });
        
        describe('9b. not-contain(t1:b) ⨝ t1:abcdef', function() {
            let grammar: Grammar = Short(Seq(Rep(Dot("t1")), t1("b")));
            grammar = Seq(grammar, Rep(Dot("t1")));
            grammar = Not(grammar);
            grammar = Join(grammar, t1("abcdef"));
            const expectedResults: StringDict[] = [];
            testHasTapes(grammar, ['t1']);
            testHasVocab(grammar, {t1: 6});
            testGrammar(grammar, expectedResults);
        });
    }

});

