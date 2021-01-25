import { Uni, Join, Not } from "../src/stateMachine";
import { t1, t2, unrelated, testHasTapes, testHasVocab, testGrammar } from './testUtils';

import * as path from 'path';

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
        console.log("done the test")
    });

    describe('~(~t1:hello)', function() {
        const grammar = Not(Not(t1("hello")));
        testGrammar(grammar, [{t1: "hello"}], undefined, 30);
    });

    describe('~t1:hello', function() {
        const grammar = Not(t1("hello"));
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, []);
    });

    describe('Alt Join(~t1:hello & t1:helloo) | unrelated:foobar', function() {
        const grammar = Uni(Join(Not(t1("hello")), t1("helloo")), unrelated("foobar"));
        testGrammar(grammar, [{t1: "helloo"},
                              {unrelated: "foobar"}]);
    });

    describe('Alt ~t1:hello | t2:hello', function() {
        const grammar = Uni(Not(t1("hello")), t2("hello"));
        testHasTapes(grammar, ["t1", "t2"]);
        testHasVocab(grammar, {t1: 4});
        testHasVocab(grammar, {t2: 4});
        testGrammar(grammar, [{t2: "hello"}]);
    });

    describe('Join(~t1:hello & t2:hello)', function() {
        const grammar = Join(Not(t1("hello")), t2("hello"));
        testGrammar(grammar, [{t2: "hello"}], undefined, 30);
    });

});
