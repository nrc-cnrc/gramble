import {
    CountTape,
    Grammar,
    Rep,
    Seq,
} from "../src/grammars";

import { 
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2,
    testGrammar,
} from "./testUtil";

import {
    StringDict, SILENT, VERBOSE_DEBUG,
} from "../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1a. CountTape(3) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = CountTape(3, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1b. CountTape({t1:3, t2:3}) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = CountTape({t1:3, t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1c. CountTape({t1:3}) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = CountTape({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1d. CountTape({t2:3}) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = CountTape({t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2a. CountTape(3) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape(3, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2b. CountTape(6) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape(6, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. CountTape({t1:3, t2:6}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t1:3, t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3c. CountTape({t1:3}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3d. CountTape({t2:6}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4a. CountTape({t2:5}) CountTape({t1:3}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t1:3}, grammar);
        grammar = CountTape({t2:5}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4b. CountTape({t1:3}) CountTape({t2:5}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t2:5}, grammar);
        grammar = CountTape({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5a. CountTape({t1:2}) CountTape({t2:6}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t2:6}, grammar);
        grammar = CountTape({t1:2}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5b. CountTape({t2:6}) CountTape({t1:2}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = CountTape({t1:2}, grammar);
        grammar = CountTape({t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

});
