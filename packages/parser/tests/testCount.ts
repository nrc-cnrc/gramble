import {
    Count,
    Epsilon,
    Grammar,
    Hide,
    Rep,
    Seq,
    Uni
} from "../src/grammars";

import { 
    DEFAULT_MAX_RECURSION,
    t1, t2,
    testGrammar,
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

    describe('0a. Count_t1:3 (t1:hello)', function() {
        let grammar: Grammar = t1("hello");
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [];
        testGrammar(grammar, expectedResults);
    });

    describe('0b. Count_t1:3 (t1:hi)', function() {
        let grammar: Grammar = t1("hi");
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {t1: "hi"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0c. Count_t2:3 (t1:hello)', function() {
        let grammar: Grammar = t1("hello");
        grammar = Count({t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('0d. Count_t1:3 (t1:h)*', function() {
        let grammar: Grammar = Rep(t1("h"));
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1a. Count_t1:3,t2:3 (t1:h* + t2:i*)', function() {
        let grammar: Grammar = Seq(Rep(t1("h")), Rep(t2("i")));
        grammar = Count({t1:3, t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t2:"i"},
            {t2:"ii"},
            {t2:"iii"},
            {t1:"h"},
            {t1:"hh"},
            {t1:"hhh"},
            {t1:"h",t2:"i"},
            {t1:"h",t2:"ii"},
            {t1:"h",t2:"iii"},
            {t1:"hh",t2:"i"},
            {t1:"hhh",t2:"i"},
            {t1:"hh",t2:"ii"},
            {t1:"hh",t2:"iii"},
            {t1:"hhh",t2:"ii"},
            {t1:"hhh",t2:"iii"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('1b. Count_t1:3,t2:3 (t1:h + t2:i)*', function() {
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

    describe('1c. Count_t1:3 (t1:h + t2:i)*', function() {
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

    describe('1d. Count_t2:3 (t1:h + t2:i)*', function() {
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

    describe('2a. Count_t1:3,t2:3 (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t1:3, t2:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('2b. Count_t1:6,t2:6 (t1:h + t2:ii)*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), t2("ii")));
        grammar = Count({t1:6, t2:6}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', t2: 'ii'},
            {t1: 'hh', t2: 'iiii'},
            {t1: 'hhh', t2: 'iiiiii'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('3b. Count_t1:3,t2:6 (t1:h + t2:ii)*', function() {
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

    describe('3c. Count_t1:3 (t1:h + t2:ii)*', function() {
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

    describe('3d. Count_t2:6 (t1:h + t2:ii)*', function() {
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

    describe('4a. Count({t2:5 Count_t1:3 (t1:h + t2:ii)*', function() {
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

    describe('4b. Count({t1:3 Count_t2:5 (t1:h + t2:ii)*', function() {
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

    describe('5a. Count({t1:2 Count_t2:6 (t1:h + t2:ii)*', function() {
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

    describe('5b. Count_t2:6 Count_t1:2 (t1:h + t2:ii)*', function() {
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
    
    describe('6a. Count_t1:3 Count_t1:5 (t1:h)*', function() {
        let grammar: Grammar = Rep(t1("h")); 
        grammar = Count({t1:5}, grammar);
        grammar = Count({t1:3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('6b. Count_t1:5 Count_t1:3 (t1:h)*', function() {
        let grammar: Grammar = Rep(t1("h")); 
        grammar = Count({t1:3}, grammar);
        grammar = Count({t1:5}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h'},
            {t1: 'hh'},
            {t1: 'hhh'},
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('7a. Count_t1:3,t2:3 (t1:h + hide(t2:i))*', function() {
        let grammar: Grammar = Rep(Seq(t1("h"), Hide(t2("i"), "t2", "H")));
        grammar = Count({t1:3, ".H":3}, grammar);
        const expectedResults: StringDict[] = [
            {},
            {t1: 'h', ".H": 'i'},
            {t1: 'hh', ".H": 'ii'},
            {t1: 'hhh', ".H": 'iii'},
        ];
        testGrammar(grammar, expectedResults, SILENT, 
                        "", DEFAULT_MAX_RECURSION, false);
    });

    describe('8a. Count_t1:3 (t1:hello+(t1:world|eps))', function() {
        let grammar: Grammar = Seq(t1("hello"), Uni(t1("world"), Epsilon()));
        grammar = Count({t1:8}, grammar);
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('8b. Count_t1:3 (t1:hello+(t1:eps|world))', function() {
        let grammar: Grammar = Seq(t1("hello"), Uni(Epsilon(), t1("world")));
        grammar = Count({t1:8}, grammar);
        const expectedResults: StringDict[] = [
            {t1: "hello"}
        ];
        testGrammar(grammar, expectedResults);
    });

    describe('8c. Count_t1:3 (t1:hello+(t1:world|t1:!))', function() {
        let grammar: Grammar = Seq(t1("hello"), Uni(t1("world"), t1("!")));
        grammar = Count({t1:8}, grammar);
        const expectedResults: StringDict[] = [
            {t1: "hello!"}
        ];
        testGrammar(grammar, expectedResults);
    });
    
    describe('8d. Count_t1:3 (t1:hello+(t1:!|t1:world))', function() {
        let grammar: Grammar = Seq(t1("hello"), Uni(t1("!"), t1("world")));
        grammar = Count({t1:8}, grammar);
        const expectedResults: StringDict[] = [
            {t1: "hello!"}
        ];
        testGrammar(grammar, expectedResults);
    });

});
