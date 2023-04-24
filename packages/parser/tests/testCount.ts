import {
    Count,
    Grammar,
    Rep,
    Seq
} from "../src/grammars";

import { 
    t1, t2, t3, t4,
    testHasTapes, 
    testHasVocab,
    testGrammar,
    WARN_ONLY_FOR_TOO_MANY_OUTPUTS,
} from './testUtil';

import * as path from 'path';
import {StringDict, logDebug, SILENT, VERBOSE_DEBUG } from "../src/util";

// File level control over verbose output
const VERBOSE = true;

function verbose(...msgs: string[]) {
    logDebug(VERBOSE ? VERBOSE_DEBUG : SILENT, ...msgs);
}

const DEFAULT = undefined;

describe(`${path.basename(module.filename)}`, function() {

    verbose("", `--- ${path.basename(module.filename)} ---`);

    describe('1a. CT(3) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = Count(3, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1b. CT({t1:3, t2:3}) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = Count({t1:3, t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1c. CT({t1:3}) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1d. CT({t2:3}) (t1:h + t2:i)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("i")));
        grammar = Count({t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'i'},
            {t1: 'hh', t2: 'ii'},
            {t1: 'hhh', t2: 'iii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2a. CT(3) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count(3, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2b. CT(6) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count(6, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. CT({t1:3, t2:6}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t1:3, t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3c. CT({t1:3}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3d. CT({t2:6}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4a. CT({t2:5}) CT({t1:3}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t1:3}, grammar);
        grammar = Count({t2:5}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('4b. CT({t1:3}) CT({t2:5}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t2:5}, grammar);
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5a. CT({t1:2}) CT({t2:6}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t2:6}, grammar);
        grammar = Count({t1:2}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('5b. CT({t2:6}) CT({t1:2}) (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t1:2}, grammar);
        grammar = Count({t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

});
