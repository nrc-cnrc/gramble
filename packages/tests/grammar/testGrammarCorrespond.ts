import {
    Correspond, Epsilon, Join, 
    Lit, Seq, Uni,
} from "../../interpreter/src/grammarConvenience.js";

import { Grammar } from "../../interpreter/src/grammars.js";
import { INPUT_TAPE, OUTPUT_TAPE } from "../../interpreter/src/utils/constants.js";
import { VERBOSE_DEBUG } from "../../interpreter/src/utils/logging.js";

import {
    grammarTestSuiteName,
    testGrammar,
} from "./testGrammarUtil.js";

import {
    logTestSuite, VERBOSE_TEST_L2,
} from "../testUtil.js";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function i(s: string): Grammar {
    return Lit(INPUT_TAPE, s);
}

function o(s: string): Grammar {
    return Lit(OUTPUT_TAPE, s);
}

const module = import.meta;

describe(`${grammarTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    /*
    testGrammar({
        desc: '1a. o shorter than i, default priority',
        grammar: Correspond(Seq(i("hello"), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
    });

    testGrammar({
        desc: '1b. o shorter than i, priority IO',
        grammar: Correspond(Seq(i("hello"), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '1c. o shorter than i, priority OI',
        grammar: Correspond(Seq(i("hello"), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
        verbose: VERBOSE_DEBUG
    });
    
    testGrammar({
        desc: '2a. o equal length to i, priority IO',
        grammar: Correspond(Seq(i("hello"), o("world"))),
        results: [
            {$i: 'hello', $o: 'world'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '2b. o equal length to i, priority OI',
        grammar: Correspond(Seq(i("hello"), o("world"))),
        results: [
            {$i: 'hello', $o: 'world'},
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammar({
        desc: '3a. o longer than i, priority IO',
        grammar: Correspond(Seq(i("hello"), o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '3b. o longer than i, priority OI',
        grammar: Correspond(Seq(i("hello"), o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammar({
        desc: '4a. Cor(hello|help, bye), priority IO',
        grammar: Correspond(Seq(Uni(i("hello"), i("help")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'help', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '4b. Cor(hello|help, bye), priority OI',
        grammar: Correspond(Seq(Uni(i("hello"), i("help")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'help', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    });

    testGrammar({
        desc: '5a. Cor(hello|hi, bye), priority IO',
        grammar: Correspond(Seq(Uni(i("hello"), i("hi")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hi', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '5b. Cor(hello|hi, bye), priority OI',
        grammar: Correspond(Seq(Uni(i("hello"), i("hi")), o("bye"))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hi', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    });

    testGrammar({
        desc: '6a. Cor(hello, bye|ta), priority IO',
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("ta")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'ta'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '6b. Cor(hello, bye|ta), priority OI',
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("ta")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'ta'},
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammar({
        desc: '7a. Cor(hello, bye|sayonara), priority IO',
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '7b. Cor(hello, bye|sayonara), priority OI',
        grammar: Correspond(Seq(i("hello"), Uni(o("bye"), o("sayonara")))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello', $o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammar({
        desc: '8a. epsilon input, default priority',
        grammar: Correspond(Seq(Epsilon(), o("sayonara"))),
        results: [
            {$o: 'sayonara'},
        ],
    });

    testGrammar({
        desc: '8b. epsilon input, priority IO',
        grammar: Correspond(Seq(Epsilon(), o("sayonara"))),
        results: [
            {$o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '8c. epsilon input, priority OI',
        grammar: Correspond(Seq(Epsilon(), o("sayonara"))),
        results: [
            {$o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    });

    testGrammar({
        desc: '9a. optional input, default priority',
        grammar: Correspond(Seq(Uni(i("hello"), Epsilon()), 
                        o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
    });

    testGrammar({
        desc: '9b. optional input, priority IO',
        grammar: Correspond(Seq(Uni(i("hello"), Epsilon()), 
                        o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '9c. optional input, priority OI',
        grammar: Correspond(Seq(Uni(i("hello"), Epsilon()), 
                        o("sayonara"))),
        results: [
            {$i: 'hello', $o: 'sayonara'},
            {$o: 'sayonara'},
        ],
        priority: ["$o", "$i"],
    });

    testGrammar({
        desc: '10a. epsilon output, default priority',
        grammar: Correspond(Seq(i("hello"), Epsilon())),
        results: [
            {$i: 'hello'},
        ],
    });

    testGrammar({
        desc: '10b. epsilon output, priority IO',
        grammar: Correspond(Seq(i("hello"), Epsilon())),
        results: [
            {$i: 'hello'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '10c. epsilon output, priority OI',
        grammar: Correspond(Seq(i("hello"), Epsilon())),
        results: [
            {$i: 'hello'},
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammar({
        desc: '10a. optional output, default priority',
        grammar: Correspond(Seq(i("hello"), 
                            Uni(o("bye"), Epsilon()))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
    });

    testGrammar({
        desc: '10b. optional output, priority IO',
        grammar: Correspond(Seq(i("hello"), 
                                Uni(o("bye"), Epsilon()))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '10c. optional output, priority OI',
        grammar: Correspond(Seq(i("hello"), 
                                Uni(o("bye"), Epsilon()))),
        results: [
            {$i: 'hello', $o: 'bye'},
            {$i: 'hello'},
        ],
        priority: ["$o", "$i"],
    });

    testGrammar({
        desc: '11a. o shorter than i, priority IO, joined on left',
        grammar: Join(
                    Correspond(Seq(i("hello"), o("bye"))),
                    Seq(i("hello"), o("bye")),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
    });
    
    testGrammar({
        desc: '11b. o shorter than i, priority IO, joined on right',
        grammar: Join(
                    Seq(i("hello"), o("bye")),
                    Correspond(Seq(i("hello"), o("bye"))),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$i", "$o"],
        // verbose: VERBOSE_DEBUG,
    });

    testGrammar({
        desc: '11a-OI. o shorter than i, priority OI, joined on left',
        grammar: Join(
                    Correspond(Seq(i("hello"), o("bye"))),
                    Seq(i("hello"), o("bye")),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    });
    
    testGrammar({
        desc: '11b-OI. o shorter than i, priority OI, joined on right',
        grammar: Join(
                    Seq(i("hello"), o("bye")),
                    Correspond(Seq(i("hello"), o("bye"))),
                 ),
        results: [
            {$i: 'hello', $o: 'bye'},
        ],
        priority: ["$o", "$i"],
    });
    */
});
