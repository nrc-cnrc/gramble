import { Uni, Join, Not } from "../src/stateMachine";
import { t1, t2, unrelated, testHasTapes, testHasVocab, testGrammar } from './testUtils';

import * as path from 'path';
import { StringDict } from "../src/util";

describe(`${path.basename(module.filename)}`, function() {

    describe('Join(t1:foo & ~t1:hello)', function() {
        const grammar = Join(t1("foo"), Not(t1("hello")));
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 5});
        testGrammar(grammar, [{t1: "foo"}]);
});

    describe('Join(t1:hello & ~t1:hello)', function() {
        const grammar = Join(t1("hello"), Not(t1("hello")));
        testGrammar(grammar, []);
    });

    describe('Join(t1:hell & ~t1:hello)', function() {
        const grammar = Join(t1("hell"), Not(t1("hello")));
        testGrammar(grammar, [{t1: "hell"}]);
    });

    describe('Join(t1:helloo & ~t1:hello)', function() {
        const grammar = Join(t1("helloo"), Not(t1("hello")));
        testGrammar(grammar, [{t1: "helloo"}]);
    });

    describe('Join(~t1:hello & t1:foo)', function() {
        const grammar = Join(Not(t1("hello")), t1("foo"));
        testGrammar(grammar, [{t1: "foo"}]);
    });

    describe('Join(~t1:hello & t1:hell)', function() {
        const grammar = Join(Not(t1("hello")), t1("hell"));
        testGrammar(grammar, [{t1: "hell"}]);
    });

    describe('Join(~t1:hello & t1:helloo)', function() {
        const grammar = Join(Not(t1("hello")), t1("helloo"));
        testGrammar(grammar, [{t1: "helloo"}]);
    });

    describe('Join(t1:foo & ~(t1:hello|t1:world)', function() {
        const grammar = Join(t1("foo"), Not(Uni(t1("hello"), t1("world"))));
        testGrammar(grammar, [{t1: "foo"}]);
    });

    describe('Join(t1:hello & ~(t1:hello|t1:world)', function() {
        const grammar = Join(t1("hello"), Not(Uni(t1("hello"), t1("world"))));
        testGrammar(grammar, []);
    });

    describe('Join(t1:world & ~(t1:hello|t1:world)', function() {
        const grammar = Join(t1("world"), Not(Uni(t1("hello"), t1("world"))));
        testGrammar(grammar, []);
    });

    describe('Join(~(t1:hello|t1:world) & t1:foo)', function() {
        const grammar = Join(Not(Uni(t1("hello"), t1("world"))), t1("foo"));
        testGrammar(grammar, [{t1: "foo"}]);
    });

    describe('Join(~(t1:hello|t1:world) & t1:hello)', function() {
        const grammar = Join(Not(Uni(t1("hello"), t1("world"))), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('Join(~(t1:hello|t1:help) & t1:hello)', function() {
        const grammar = Join(Not(Uni(t1("hello"), t1("help"))), t1("hello"));
        testGrammar(grammar, []);
    });

    describe('~(~t1:hello)', function() {
        const grammar = Not(Not(t1("hello")));
        testGrammar(grammar, [{t1: "hello"}], undefined, 30);
    });

    describe('~t1:hi', function() {
        const grammar = Not(t1("hi"));
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 2});
        const expectedResults: StringDict[] = [
            {},             { t1: 'h' },    { t1: 'i' },
            { t1: 'hh' },   { t1: 'ih' },   { t1: 'ii' },
            { t1: 'hih' },  { t1: 'hii' },  { t1: 'hhh' },
            { t1: 'hhi' },  { t1: 'ihh' },  { t1: 'ihi' },
            { t1: 'iih' },  { t1: 'iii' },  { t1: 'hihh' },
            { t1: 'hihi' }, { t1: 'hiih' }, { t1: 'hiii' },
            { t1: 'hhhh' }, { t1: 'hhhi' }, { t1: 'hhih' },
            { t1: 'hhii' }, { t1: 'ihhh' }, { t1: 'ihhi' },
            { t1: 'ihih' }, { t1: 'ihii' }, { t1: 'iihh' },
            { t1: 'iihi' }, { t1: 'iiih' }, { t1: 'iiii' }];
        testGrammar(grammar, expectedResults, 4, 5);
    });
    

    describe('Alt Join(~t1:hello & t1:helloo) | unrelated:foobar', function() {
        const grammar = Uni(Join(Not(t1("hello")), t1("helloo")), unrelated("foobar"));
        testGrammar(grammar, [{t1: "helloo"},
                              {unrelated: "foobar"}]);
    });

    

    describe('Alt ~t1:hi | t2:hi', function() {
        const grammar = Uni(Not(t1("hi")), t2("hi"));
        testHasTapes(grammar, ["t1", "t2"]);
        testHasVocab(grammar, {t1: 2});
        testHasVocab(grammar, {t2: 2});
        const expectedResults: StringDict[] = [
            {},             { t1: 'h' },    { t1: 'i' },
            { t1: 'hh' },   { t1: 'ih' },   { t1: 'ii' },
            { t1: 'hih' },  { t1: 'hii' },  { t1: 'hhh' },
            { t1: 'hhi' },  { t1: 'ihh' },  { t1: 'ihi' },
            { t1: 'iih' },  { t1: 'iii' },  { t1: 'hihh' },
            { t1: 'hihi' }, { t1: 'hiih' }, { t1: 'hiii' },
            { t1: 'hhhh' }, { t1: 'hhhi' }, { t1: 'hhih' },
            { t1: 'hhii' }, { t1: 'ihhh' }, { t1: 'ihhi' },
            { t1: 'ihih' }, { t1: 'ihii' }, { t1: 'iihh' },
            { t1: 'iihi' }, { t1: 'iiih' }, { t1: 'iiii' }, 
            { t2: "hi"}];
        testGrammar(grammar, expectedResults, 4, 5);
    });
    
    describe('~t1:h', function() {
        const grammar = Not(t1("h"));
        testHasVocab(grammar, {t1: 1});
        const expectedResults: StringDict[] = [
            {},            
            { t1: 'hh' },  
            { t1: 'hhh' },
            { t1: 'hhhh' }];
        testGrammar(grammar, expectedResults, 4, 5);
    });


    describe('Join(~t1:hi & t2:hi)', function() {
        const grammar = Join(Not(t1("hi")), t2("hi"));
        testHasVocab(grammar, {t1: 2});
        testHasVocab(grammar, {t2: 2});
        const expectedResults: StringDict[] = [
            { t2: "hi" },             { t1: 'h', t2: "hi" },    { t1: 'i', t2: "hi" },
            { t1: 'hh', t2: "hi" },   { t1: 'ih', t2: "hi" },   { t1: 'ii', t2: "hi" },
            { t1: 'hih', t2: "hi" },  { t1: 'hii', t2: "hi" },  { t1: 'hhh', t2: "hi" },
            { t1: 'hhi', t2: "hi" },  { t1: 'ihh', t2: "hi" },  { t1: 'ihi', t2: "hi" },
            { t1: 'iih', t2: "hi" },  { t1: 'iii', t2: "hi" },  { t1: 'hihh', t2: "hi" },
            { t1: 'hihi', t2: "hi" }, { t1: 'hiih', t2: "hi" }, { t1: 'hiii', t2: "hi" },
            { t1: 'hhhh', t2: "hi" }, { t1: 'hhhi', t2: "hi" }, { t1: 'hhih', t2: "hi" },
            { t1: 'hhii', t2: "hi" }, { t1: 'ihhh', t2: "hi" }, { t1: 'ihhi', t2: "hi" },
            { t1: 'ihih', t2: "hi" }, { t1: 'ihii', t2: "hi" }, { t1: 'iihh', t2: "hi" },
            { t1: 'iihi', t2: "hi" }, { t1: 'iiih', t2: "hi" }, { t1: 'iiii', t2: "hi" }];
        testGrammar(grammar, expectedResults, 4, 7);
    });
    
    describe('Join(t2:hi & ~t1:hi)', function() {
        const grammar = Join(t2("hi"), Not(t1("hi")));
        testHasVocab(grammar, {t1: 2});
        testHasVocab(grammar, {t2: 2});
        const expectedResults: StringDict[] = [
            { t2: 'hi' },             { t2: 'hi', t1: 'h' },
            { t2: 'hi', t1: 'i' },    { t2: 'hi', t1: 'hh' },
            { t2: 'hi', t1: 'ih' },   { t2: 'hi', t1: 'ii' },
            { t2: 'hi', t1: 'hih' },  { t2: 'hi', t1: 'hii' },
            { t2: 'hi', t1: 'hhh' },  { t2: 'hi', t1: 'hhi' },
            { t2: 'hi', t1: 'ihh' },  { t2: 'hi', t1: 'ihi' },
            { t2: 'hi', t1: 'iih' },  { t2: 'hi', t1: 'iii' },
            { t2: 'hi', t1: 'hihh' }, { t2: 'hi', t1: 'hihi' },
            { t2: 'hi', t1: 'hiih' }, { t2: 'hi', t1: 'hiii' },
            { t2: 'hi', t1: 'hhhh' }, { t2: 'hi', t1: 'hhhi' },
            { t2: 'hi', t1: 'hhih' }, { t2: 'hi', t1: 'hhii' },
            { t2: 'hi', t1: 'ihhh' }, { t2: 'hi', t1: 'ihhi' },
            { t2: 'hi', t1: 'ihih' }, { t2: 'hi', t1: 'ihii' },
            { t2: 'hi', t1: 'iihh' }, { t2: 'hi', t1: 'iihi' },
            { t2: 'hi', t1: 'iiih' }, { t2: 'hi', t1: 'iiii' }];
        testGrammar(grammar, expectedResults, 4, 7);
    });
});
