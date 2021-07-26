import { Uni, Join, Not, Rep, Seq, Null, Epsilon } from "../../src/ast";
import { t1, t2, 
    testAstHasTapes, testAst } from './testUtilsAst';

import * as path from 'path';
import { StringDict } from "../../src/util";

describe(`${path.basename(module.filename)}`, function() {

    describe('Negation of empty set: ~0', function() {
        const grammar = Not(Null());
        testAst(grammar, [{}]);
    });

    describe('Negation of epsilon: ~e', function() {
        const grammar = Not(Epsilon());
        testAst(grammar, []);
    });

    describe('Join(t1:foo & ~t1:hello)', function() {
        const grammar = Join(t1("foo"), Not(t1("hello")));
        testAstHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 5});
        testAst(grammar, [{t1: "foo"}]);
    });


    describe('Join(t1:hello & ~t1:hello)', function() {
        const grammar = Join(t1("hello"), Not(t1("hello")));
        testAst(grammar, []);
    });

    describe('Join(t1:hell & ~t1:hello)', function() {
        const grammar = Join(t1("hell"), Not(t1("hello")));
        testAst(grammar, [{t1: "hell"}]);
    });

    describe('Join(t1:helloo & ~t1:hello)', function() {
        const grammar = Join(t1("helloo"), Not(t1("hello")));
        testAst(grammar, [{t1: "helloo"}]);
    });

    describe('Join(~t1:hello & t1:foo)', function() {
        const grammar = Join(Not(t1("hello")), t1("foo"));
        testAst(grammar, [{t1: "foo"}]);
    });

    describe('Join(~t1:hello & t1:hell)', function() {
        const grammar = Join(Not(t1("hello")), t1("hell"));
        testAst(grammar, [{t1: "hell"}]);
    });

    describe('Join(~t1:hello & t1:helloo)', function() {
        const grammar = Join(Not(t1("hello")), t1("helloo"));
        testAst(grammar, [{t1: "helloo"}]);
    });

    describe('Join(t1:foo & ~(t1:hello|t1:world)', function() {
        const grammar = Join(t1("foo"), Not(Uni(t1("hello"), t1("world"))));
        testAst(grammar, [{t1: "foo"}]);
    });

    describe('Join(t1:hello & ~(t1:hello|t1:world)', function() {
        const grammar = Join(t1("hello"), Not(Uni(t1("hello"), t1("world"))));
        testAst(grammar, []);
    });

    describe('Join(t1:world & ~(t1:hello|t1:world)', function() {
        const grammar = Join(t1("world"), Not(Uni(t1("hello"), t1("world"))));
        testAst(grammar, []);
    });

    describe('Join(~(t1:hello|t1:world) & t1:foo)', function() {
        const grammar = Join(Not(Uni(t1("hello"), t1("world"))), t1("foo"));
        testAst(grammar, [{t1: "foo"}]);
    });

    describe('Join(~(t1:hello|t1:world) & t1:hello)', function() {
        const grammar = Join(Not(Uni(t1("hello"), t1("world"))), t1("hello"));
        testAst(grammar, []);
    });

    
    // This and the following three tests are crucial tests for Negation, because they
    // fail when the results of the enclosed grammar (here, t1:hello|t1:help) are
    // not properly determinized (if the same result appears in multiple yields). Consider, 
    // here, "h" transitioning to t1:ello and also "h" transition to t1:elp.
    // If these are separate yields, then the negation that wraps them can be going down the second
    // path through "elp", eventually fail to join it with "ello" on the other side, and say 
    // "Yay, that failed, so I succeed."  But that ends up succeeding on "hello", which should
    // be forbidden by this grammar.  On the other hand, if "h" led to a UnionState(t1:ello, t1:elp),
    // this works correctly.
    describe('Join(~(t1:hello|t1:help) & t1:hello)', function() {
        const grammar = Join(Not(Uni(t1("hello"), t1("help"))), t1("hello"));
        testAst(grammar, []);
    });

    describe('Join(t1:hello & ~(t1:hello|t1:help))', function() {
        const grammar = Join(t1("hello"), Not(Uni(t1("hello"), t1("help"))));
        testAst(grammar, []);
    });

    // This one is testing the same thing, but the problem is more subtle.  Improperly
    // determinized, this could have an "h" leading into the first child of the concat, 
    // the repetition, or (because this repetition can be zero) finishing the repetition
    // right away and leading to the second child, t1:hello.  So similarly to the above,
    // the negation that wraps them can say "Okay, going to the first child, matched an 'h',
    // now can't match an 'e', okay yay that failed, so I succeed," and incorrectly succeed
    // on "hello" just like before.
    describe('Join(~(t1:h*hello) & t1:hello)', function() {
        const grammar = Join(Not(Seq(Rep(t1("h"),0,2), t1("hello"))), t1("hhello"));
        testAst(grammar, []);
    });

    describe('Join( & t1:hello & ~(t1:h*hello))', function() {
        const grammar = Join(t1("hhello"), Not(Seq(Rep(t1("h"),0,2), t1("hello"))));
        testAst(grammar, []);
    });

    describe('~(~t1:hello)', function() {
        const grammar = Not(Not(t1("hello")));
        testAst(grammar, [{t1: "hello"}], "__MAIN__", 4, 30);
    });

    describe('~t1:hi', function() {
        const grammar = Not(t1("hi"));
        testAstHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
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
        testAst(grammar, expectedResults, "__MAIN__", 4, 5);
    });

    
    describe('~(t1:h+t1:i)', function() {
        const grammar = Not(Seq(t1("h"), t1("i")));
        testAstHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 2});
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
        testAst(grammar, expectedResults, "__MAIN__", 4, 5);
    });
    
    

    describe('Alt Join(~t1:hello & t1:helloo) | t2:foobar', function() {
        const grammar = Uni(Join(Not(t1("hello")), t1("helloo")), t2("foobar"));
        testAst(grammar, [{t1: "helloo"},
                              {t2: "foobar"}]);
    });

    describe('Alt ~t1:hi | t2:hi', function() {
        const grammar = Uni(Not(t1("hi")), t2("hi"));
        testAstHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2});
        //testHasVocab(grammar, {t2: 2});
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
        testAst(grammar, expectedResults, "__MAIN__", 4, 5);
    });
    
    describe('~t1:h', function() {
        const grammar = Not(t1("h"));
        //testHasVocab(grammar, {t1: 1});
        const expectedResults: StringDict[] = [
            {},            
            { t1: 'hh' },  
            { t1: 'hhh' },
            { t1: 'hhhh' }];
        testAst(grammar, expectedResults, "__MAIN__", 4, 5);
    });

    
    describe('t1:h+(~t1:h)', function() {
        const grammar = Seq(t1("h"), Not(t1("h")));
        //testHasVocab(grammar, {t1: 1});
        const expectedResults: StringDict[] = [
            { t1: 'h'},            
            { t1: 'hhh' },  
            { t1: 'hhhh' },
            { t1: 'hhhhh' }];
        testAst(grammar, expectedResults, "__MAIN__", 4, 6);
    });

    describe('(~t1:h)+t1:h', function() {
        const grammar = Seq(Not(t1("h")), t1("h"));
        //testHasVocab(grammar, {t1: 1});
        const expectedResults: StringDict[] = [
            { t1: 'h'},            
            { t1: 'hhh' },  
            { t1: 'hhhh' },
            { t1: 'hhhhh' }];
        testAst(grammar, expectedResults, "__MAIN__", 4, 6);
    });
    
    describe('~t1:h{0,1}', function() {
        const grammar = Not(Rep(t1("h"), 0, 1));
        //testHasVocab(grammar, {t1: 1});
        const expectedResults: StringDict[] = [
            { t1: 'hh' },         
            { t1: 'hhh' },
            { t1: 'hhhh' }];
        testAst(grammar, expectedResults, "__MAIN__", 4, 5);
    });


    describe('~t1:h{1,2}', function() {
        const grammar = Not(Rep(t1("h"), 1, 3));
        //testHasVocab(grammar, {t1: 1});
        const expectedResults: StringDict[] = [
            {},            
            { t1: 'hhhh' }];
        testAst(grammar, expectedResults, "__MAIN__", 4, 5);
    });

    describe('Join(~t1:hi & t2:hi)', function() {
        const grammar = Join(Not(t1("hi")), t2("hi"));
        //testHasVocab(grammar, {t1: 2});
        //testHasVocab(grammar, {t2: 2});
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
        testAst(grammar, expectedResults, "__MAIN__", 4, 7);
    });
    
    describe('Join(t2:hi & ~t1:hi)', function() {
        const grammar = Join(t2("hi"), Not(t1("hi")));
        //testHasVocab(grammar, {t1: 2});
        //testHasVocab(grammar, {t2: 2});
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
        testAst(grammar, expectedResults, "__MAIN__", 4, 7);
    }); 

    describe('~(t1:h+t2:h)', function() {
        const grammar = Not(Seq(t1("h"), t2("i")));
        const expectedResults: StringDict[] = [
            {},         
            {"t2":"i"},
            {"t1":"h"}, 
            {"t2":"ii"},
            {"t1":"hh"},
            {"t2":"ii","t1":"h"},
            {"t2":"i","t1":"hh"},
            {"t2":"iii"},
            {"t1":"hhh"}];
            testAst(grammar, expectedResults, "__MAIN__", 4, 4);
    }); 

    describe('~(t1:h|t2:h)', function() {
        const grammar = Not(Uni(t1("h"), t2("i")));
        const expectedResults: StringDict[] = [
            {},                     {"t2":"i","t1":"h"},
            {"t2":"ii"},            {"t1":"hh"},
            {"t2":"ii","t1":"h"},   {"t2":"i","t1":"hh"},
            {"t2":"iii"},           {"t1":"hhh"}];
            testAst(grammar, expectedResults, "__MAIN__", 4, 4);
    }); 

});