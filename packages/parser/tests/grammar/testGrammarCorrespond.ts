

import {
    CharSet, Correspond, Cursor, Epsilon, Seq, Uni,
} from "../../src/grammars";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux,
    t1, t2, t3,
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";
import { VERBOSE_DEBUG } from "../../src/util";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1a. t2 shorter than t1: Cor(t1:hello, t2:bye), default priority', test({
        grammar: Correspond("t1", "t2", Seq(t1("hello"), t2("bye"))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
        ],
    }));

    describe('1b. t2 shorter than t1: Cor(t1:hello, t2:bye), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(t1("hello"), t2("bye")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
        ],
    }));
    
    describe('1c. t2 shorter than t1: Cor(t1:hello, t2:bye), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(t1("hello"), t2("bye")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
        ],
    }));

    describe('2a. t2 equal length to t1: Cor(t1:hello, t2:world), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(t1("hello"), t2("world")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'world'},
        ],
    }));
    
    describe('2b. t2 equal length to t1: Cor(t1:hello, t2:bye), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(t1("hello"), t2("world")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'world'},
        ],
    }));
    
    describe('3a. t2 longer than t1: Cor(t1:hello, t2:sayonara), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(t1("hello"), t2("sayonara")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'sayonara'},
        ],
    }));
    
    describe('3b. t2 longer than t1: Cor(t1:hello, t2:sayonara), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(t1("hello"), t2("sayonara")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'sayonara'},
        ],
    }));
    
    describe('4a. Cor(t1:hello|t1:help, t2:bye), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(Uni(t1("hello"), t1("help")), t2("bye")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'help', t2: 'bye'},
        ],
    }));
    
    describe('4b. Cor(t1:hello|t1:help, t2:bye), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(Uni(t1("hello"), t1("help")), t2("bye")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'help', t2: 'bye'},
        ],
    }));

    describe('5a. Cor(t1:hello|t1:hi, t2:bye), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(Uni(t1("hello"), t1("hi")), t2("bye")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'hi', t2: 'bye'},
        ],
    }));
    
    describe('5b. Cor(t1:hello|t1:hi, t2:bye), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(Uni(t1("hello"), t1("hi")), t2("bye")))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'hi', t2: 'bye'},
        ],
    }));

    describe('6a. Cor(t1:hello, t2:bye|t2:ta), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(t1("hello"), Uni(t2("bye"), t2("ta"))))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'hello', t2: 'ta'},
        ],
    }));
    
    describe('6b. Cor(t1:hello, t2:bye|t2:ta), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(t1("hello"), Uni(t2("bye"), t2("ta"))))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'hello', t2: 'ta'},
        ],
    }));

    
    describe('7a. Cor(t1:hello, t2:bye|t2:sayonara), priority t1<t2', test({
        grammar: Cursor(["t1", "t2"], Correspond("t1", "t2", Seq(t1("hello"), Uni(t2("bye"), t2("sayonara"))))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'hello', t2: 'sayonara'},
        ],
    }));
    
    describe('7b. Cor(t1:hello, t2:bye|t2:sayonara), priority t1>t2', test({
        grammar: Cursor(["t2", "t1"], Correspond("t1", "t2", Seq(t1("hello"), Uni(t2("bye"), t2("sayonara"))))),
        tapes: ["t1", "t2"],
        // vocab: {t1: 4},
        results: [
            {t1: 'hello', t2: 'bye'},
            {t1: 'hello', t2: 'sayonara'},
        ],
    }));
    
});