
import { CharSet, Epsilon, Par, Seq, Uni } from "../src/grammars";
import { t1, t2, testHasTapes, testGrammar, testHasVocab, t3 } from './testUtils';

import * as path from 'path';
import { VERBOSE_DEBUG } from "../src/util";

describe(`${path.basename(module.filename)}`, function() {

    describe('Par(t1:hello)', function() {
        const grammar = Par(t1("hello"));
        testHasTapes(grammar, ["t1"]);
        //testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, [{t1: "hello"}]);
    });
    
    describe('Par(t1:"")', function() {
        const grammar = Par(t1(""));
        testHasTapes(grammar, ["t1"]);
        testHasVocab(grammar, {t1: 0});
        testGrammar(grammar, [{}]);
    });

    describe('Empty par', function() {
        const grammar = Par();
        testHasTapes(grammar, []);
        testGrammar(grammar, [{}]);
    });

    describe('Par t1:hi, t2:yo', function() {
        const grammar = Par(t1("hi"), t2("yo"));
        testHasTapes(grammar, ["t1", "t2"]);
        //testHasVocab(grammar, {t1: 2, t2: 2});
        testGrammar(grammar, [{t1: "hi", t2: "yo"}]);
    });
    
    describe('Par t1:hi, t2:yo, t3:hey', function() {
        const grammar = Par(t1("hi"), t2("yo"), t3("hey"));
        testHasTapes(grammar, ["t1", "t2", "t3"]);
        //testHasVocab(grammar, {t1: 2, t2: 2, t3:3});
        testGrammar(grammar, [{t1: "hi", t2: "yo", t3: "hey"}]);
    });

    describe('Alt of pars', function() {
        const grammar = Uni(Par(t1("hello"), t2("kitty")),
                            Par(t1("goodbye"), t2("world")));
        testGrammar(grammar, [
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" }
        ]);
    });
    
    describe('Par of alts', function() {
        const grammar = Par(Uni(t1("hello"), t1("goodbye")),
                            Uni(t2("world"), t2("kitty")));
        testGrammar(grammar, [
            { t1: "hello", t2: "world" },
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" },
            { t1: "goodbye", t2: "kitty" }
        ]);
    });

});
