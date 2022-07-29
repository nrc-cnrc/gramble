import { 
    Grammar,
    Count,
    CountTape,
    Epsilon,
    Any,
    Join,
    MatchFrom,
    Not,
    Seq,
    Rep,
    Uni,
    Vocab,
    Dot,
} from "../src/grammars";

import { 
    t1, t2, t3, t4,
    testHasTapes, 
    testHasVocab, 
    //testHasNoVocab,  
    testGrammar,
    generateOutputsFromGrammar,
} from './testUtils';

import * as path from 'path';
import { BITSETS_ENABLED, StringDict, VERBOSE_DEBUG } from "../src/util";

const DUMMY_SYMBOL: string = "";
const DEF_MAX_RECURSION: number = 4;

describe(`${path.basename(module.filename)}`, function() {

    describe('1. Joining t1:hello & ~(t1:.*h.*)', function() {
        const grammar = Join(t1("hello"), Not(
            Seq(Rep(Dot("t1")), t1("h"), Rep(Dot("t1")))))
        const expectedResults: StringDict[] = [];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults);
    });

    
    describe('2. Joining t1:hello & ~(t1:(~h)*h.*)', function() {
        const grammar = Join(t1("hello"), Not(
            Seq(Rep(Join(Dot("t1"), Not(t1("h")))), t1("h"), Rep(Dot("t1")))))
        const expectedResults: StringDict[] = [];
        testHasTapes(grammar, ['t1']);
        testHasVocab(grammar, {t1: 4});
        testGrammar(grammar, expectedResults);
    });

});

