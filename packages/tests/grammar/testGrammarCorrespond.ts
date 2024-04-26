import {
    Correspond, 
    Cursor, 
    Epsilon, 
    Join, 
    Lit, 
    Seq, Uni,
} from "../../interpreter/src/grammarConvenience";

import { Grammar } from "../../interpreter/src/grammars";
import { INPUT_TAPE, OUTPUT_TAPE } from "../../interpreter/src/utils/constants";

import {
    grammarTestSuiteName,
    testGrammarAux, GrammarTestAux
} from "./testGrammarUtil";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil";
import { VERBOSE_DEBUG } from "@gramble/interpreter/src/utils/logging";

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

    describe('1b. o shorter than i, priority IO', test({
        grammar: Correspond(Seq(i("hello"), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('1c. o shorter than i, priority OI', test({
        grammar: Correspond(Seq(i("hello"), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('2a. o equal length to i, priority IO', test({
        grammar: Correspond(Seq(i("hello"), o("world"))),
        results: [
            {$i: 'hello', $o: 'world'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('2b. o equal length to i, priority OI', test({
        grammar: Correspond(Seq(i("hello"), o("world"))),
        results: [
            {$i: 'hello', $o: 'world'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('3a. o longer than i, priority IO', test({
        grammar: Correspond(Seq(i("hello"), o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('3b. o longer than i, priority OI', test({
        grammar: Correspond(Seq(i("hello"), o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('4a. Cor(hello|help, bye), priority IO', test({
        grammar: Correspond(Seq(Uni(i("hello"), i("help")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'help', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('4b. Cor(hello|help, bye), priority OI', test({
        grammar: Correspond(Seq(Uni(i("hello"), i("help")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'help', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    }));

    describe('5a. Cor(hello|hi, bye), priority IO', test({
        grammar: Correspond(Seq(Uni(i("hello"), i("hi")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hi', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('5b. Cor(hello|hi, bye), priority OI', test({
        grammar: Correspond(Seq(Uni(i("hello"), i("hi")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hi', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    }));

    describe('6a. Cor(hello, bye|ta), priority IO', test({
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("ta")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'ta'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('6b. Cor(hello, bye|ta), priority OI', test({
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("ta")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'ta'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('7a. Cor(hello, bye|sayonara), priority IO', test({
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('7b. Cor(hello, bye|sayonara), priority OI', test({
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('8a. epsilon input, default priority', test({
        grammar: Correspond(Seq(Epsilon(), o("sayonara"))),
        results: [
            {$o: 'sayonara'},
        ],
    }));

    describe('8b. epsilon input, priority IO', test({
        grammar: Correspond(Seq(Epsilon(), o("sayonara"))),
        results: [
            {$o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('8c. epsilon input, priority OI', test({
        grammar: Correspond(Seq(Epsilon(), o("sayonara"))),
        results: [
            {$o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    }));

    describe('9a. optional input, default priority', test({
        grammar: Correspond(Seq(Uni(i("hello"), Epsilon()), 
                        o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
    }));

    describe('9b. optional input, priority IO', test({
        grammar: Correspond(Seq(Uni(i("hello"), Epsilon()), 
                        o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('9c. optional input, priority OI', test({
        grammar: Correspond(Seq(Uni(i("hello"), Epsilon()), 
                        o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    }));

    describe('10a. epsilon output, default priority', test({
        grammar: Correspond(Seq(i("hello"), Epsilon())),
        results: [
            {$i: 'hello'},
        ],
    }));

    describe('10b. epsilon output, priority IO', test({
        grammar: Correspond(Seq(i("hello"), Epsilon())),
        results: [
            {$i: 'hello'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('10c. epsilon output, priority OI', test({
        grammar: Correspond(Seq(i("hello"), Epsilon())),
        results: [
            {$i: 'hello'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('10a. optional output, default priority', test({
        grammar: Correspond(Seq(i("hello"), 
                            Uni(o("bye"), Epsilon()))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
    }));

    describe('10b. optional output, priority IO', test({
        grammar: Correspond(Seq(i("hello"), 
                                Uni(o("bye"), Epsilon()))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('10c. optional output, priority OI', test({
        grammar: Correspond(Seq(i("hello"), 
                                Uni(o("bye"), Epsilon()))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
        priority: ["$o", "$i"],
    }));

    describe('11a. o shorter than i, priority IO, joined on left', test({
        grammar: Join(
                    Correspond(Seq(i("hello"), o("bye"))),
                    Seq(i("hello"), o("bye")),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    }));
    
    describe('11b. o shorter than i, priority IO, joined on right', test({
        grammar: Join(
                    Seq(i("hello"), o("bye")),
                    Correspond(Seq(i("hello"), o("bye"))),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
        verbose: VERBOSE_DEBUG,
    }));

    describe('11a-OI. o shorter than i, priority OI, joined on left', test({
        grammar: Join(
                    Correspond(Seq(i("hello"), o("bye"))),
                    Seq(i("hello"), o("bye")),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    }));
    
    describe('11b-OI. o shorter than i, priority OI, joined on right', test({
        grammar: Join(
                    Seq(i("hello"), o("bye")),
                    Correspond(Seq(i("hello"), o("bye"))),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    }));
});
