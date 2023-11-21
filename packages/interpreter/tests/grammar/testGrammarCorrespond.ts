import {
    Correspond, 
    Cursor, 
    Epsilon, 
    Lit, 
    Seq, Uni,
} from "../../src/grammarConvenience";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";
import { INPUT_TAPE, OUTPUT_TAPE } from "../../src/utils/constants";
import { Grammar } from "../../src/grammars";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function test(params: Partial<GrammarTestAux>): () => void {
    return function() {
        return testGrammarAux({...params});
    };
}

function i(s: string): Grammar {
    return Lit(INPUT_TAPE, s);
}

function o(s: string): Grammar {
    return Lit(OUTPUT_TAPE, s);
}

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe('1a. o shorter than i, default priority', test({
        grammar: Correspond(Seq(i("hello"), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
    }));

    describe('1b. o shorter than i, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), o("bye")))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
    }));
    
    describe('1c. o shorter than i, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), o("bye")))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
    }));

    describe('2a. o equal length to i, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), o("world")))),
        results: [
            {$i: 'hello', $o: 'world'},
        ],
    }));
    
    describe('2b. o equal length to i, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), o("world")))),
        results: [
            {$i: 'hello', $o: 'world'},
        ],
    }));
    
    describe('3a. o longer than i, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
        ],
    }));
    
    describe('3b. o longer than i, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
        ],
    }));
    
    describe('4a. Cor(hello|help, bye), priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(Uni(i("hello"), i("help")), o("bye")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'help', $o: 'bye'},
        ],
    }));
    
    describe('4b. Cor(hello|help, bye), priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(Uni(i("hello"), i("help")), o("bye")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'help', $o: 'bye'},
        ],
    }));

    describe('5a. Cor(hello|hi, bye), priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(Uni(i("hello"), i("hi")), o("bye")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hi', $o: 'bye'},
        ],
    }));
    
    describe('5b. Cor(hello|hi, bye), priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(Uni(i("hello"), i("hi")), o("bye")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hi', $o: 'bye'},
        ],
    }));

    describe('6a. Cor(hello, bye|ta), priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), Uni(o("bye"), o("ta"))))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'ta'},
        ],
    }));
    
    describe('6b. Cor(hello, bye|ta), priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), Uni(o("bye"), o("ta"))))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'ta'},
        ],
    }));
    
    describe('7a. Cor(hello, bye|sayonara), priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), Uni(o("bye"), o("sayonara"))))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'sayonara'},
        ],
    }));
    
    describe('7b. Cor(hello, bye|sayonara), priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), Uni(o("bye"), o("sayonara"))))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'sayonara'},
        ],
    }));
    
    describe('8a. epsilon input, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(Epsilon(), o("sayonara")))),
        results: [
            {$o: 'sayonara'},
        ],
    }));
    
    describe('8b. epsilon input, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(Epsilon(), o("sayonara")))),
        results: [
            {$o: 'sayonara'},
        ],
    }));
    
    describe('9a. optional input, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(Uni(i("hello"), Epsilon()), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
    }));
    
    describe('9b. optional input, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(Uni(i("hello"), Epsilon()), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
    }));

    describe('10a. epsilon output, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), Epsilon()))),
        results: [
            {$i: 'hello'},
        ],
    }));
    
    describe('10b. epsilon output, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), Epsilon()))),
        results: [
            {$i: 'hello'},
        ],
    }));
    
    describe('10a. optional output, priority i>o', test({
        grammar: Cursor(["$i", "$o"], 
                    Correspond(Seq(i("hello"), Uni(o("bye"), Epsilon())))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
    }));
    
    describe('10b. optional output, priority i<o', test({
        grammar: Cursor(["$o", "$i"], 
                    Correspond(Seq(i("hello"), Uni(o("bye"), Epsilon())))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
    }));
    
});