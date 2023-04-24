import { expect } from 'chai';

import { CounterStack } from '../src/exprs';
import {
    Count, CountTape, Epsilon, 
    Join, Null, Rep, Seq, Uni, Collection,
    Embed, CollectionGrammar, Grammar
} from '../src/grammars';
import {
    testSuiteName, logTestSuite, VERBOSE_TEST, verbose,
    t1, t2
} from "./testUtil";

import { Msgs } from '../src/msgs';
import { PassEnv } from '../src/passes';
import { NAME_PASSES } from '../src/passes/allPasses';
import { QualifyNames } from '../src/passes/qualifyNames';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST;

function selectSymbol(
    ns: CollectionGrammar,
    symbolName: string
): [Grammar, PassEnv] {
    const env = new PassEnv();
    const selection = NAME_PASSES.go(ns, env) 
            .msgTo([]) as CollectionGrammar;
    env.symbolNS.entries = selection.symbols;
    const resultGrammar = selection.symbols[symbolName]
    if (resultGrammar == undefined) {
        throw new Error(`Cannot find symbol ${symbolName}`);
    }
    return [resultGrammar, env];
}

function testLength(
    grammar: Grammar, 
    tape: string, 
    length: [number, number] | null,
    env: PassEnv = new PassEnv()
): void {

    const lengthRange = grammar.estimateLength(tape, new CounterStack(2), env);
    
    if (length === null) {
        it(`${tape} should have null length`, function() {
            expect(lengthRange.null).to.be.true;
        });
        return;
    }

    it(`${tape} should be length ${length[0]}-${length[1]}`, function() {
        expect(lengthRange.null).to.be.false;
        expect(lengthRange.min).to.equal(length[0]);
        expect(lengthRange.max).to.equal(length[1]);
    });

}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(VERBOSE, module);

    describe("1. t1:hello", function() {
        const grammar = t1("hello");
        testLength(grammar, "t1", [5, 5]);
        testLength(grammar, "t2", [0, 0]);
    });

    describe("2. Epsilon", function() {
        const grammar = Epsilon();
        testLength(grammar, "t1", [0, 0]);
    });

    describe("3. Null", function() {
        const grammar = Null();
        testLength(grammar, "t1", null);
    });

    describe("4. (t1:hello){2:4}", function() {
        const grammar = Rep(t1("hello"), 2, 4);
        testLength(grammar, "t1", [10, 20]);
    });

    describe("5. (t1:hello)*", function() {
        const grammar = Rep(t1("hello"), 0, Infinity);
        testLength(grammar, "t1", [0, Infinity]);
    });

    describe("6. (t1:hello){2:Infinity}", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        testLength(grammar, "t1", [10, Infinity]);
    });
    
    describe("7. t1:hello ⨝ (t1:hello)*", function() {
        const grammar = Join(t1("hello"), Rep(t1("hello")));
        testLength(grammar, "t1", [5, 5]);
    });

    describe("8. t1:hello | (t1:hello)*", function() {
        const grammar = Uni(t1("hello"), Rep(t1("hello")));
        testLength(grammar, "t1", [0, Infinity]);
    });
    
    describe("9. t1:hello + (t1:hello)*", function() {
        const grammar = Seq(t1("hello"), Rep(t1("hello")));
        testLength(grammar, "t1", [5, Infinity]);
    });
    
    describe("10. Count(100, (t1:hello + t2:hi)*)", function() {
        const grammar = Count(100, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 100]);
        testLength(grammar, "t2", [0, 100]);
    });

    // CountTapeGrammar.potentiallyInfinite() may need to know its tapes.

    describe("11. CountTape(100, (t1:hello + t2:hi)*))", function() {
        const grammar = CountTape(100, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 100]);
        testLength(grammar, "t2", [0, 100]);
    }); 

    describe("12. CountTape({t1:20, t2:10}, (t1:hello + t2:hi)*)", function() {
        const grammar = CountTape({t1:20, t2:10}, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 20]);
        testLength(grammar, "t2", [0, 10]);
    }); 
    
    describe("13. CountTape({t1:20}, (t1:hello + t2:hi)*)", function() {
        const grammar = CountTape({t1:20}, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 20]);
        testLength(grammar, "t2", [0, Infinity]);
    }); 

    describe("14. CountTape({t1:20}, (t1:hello + t2:hi){0,5})", function() {
        const grammar = CountTape({t1:20}, Rep(Seq(t1("hello"), t2("hi")), 0, 5));
        testLength(grammar, "t1", [0, 20]);
        testLength(grammar, "t2", [0, 10]);
    }); 

    describe("15. Recursive t1 grammar", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const [grammar, env] = selectSymbol(ns, "hiWorld");
        testLength(grammar, "t1", [4, Infinity], env); 
        // the minimum here is weird due to the way 
        // we count recursively, but ultimately the answer just
        // has to be finite.  There are only three values that 
        // matter in the end, zero, finite, and infinite
    }); 

    describe("16. Recursive t1 grammar inside Count(100)", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = Count(100, grammar);
        testLength(grammar, "t1", [4, 100], env);
    }); 

    describe("17. Recursive t1 grammar inside CountTape(40)", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = CountTape(40, grammar);
        testLength(grammar, "t1", [4, 40], env);
    }); 

    describe("18. Recursive t1 grammar inside CountTape({t1:40, t2:10})", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = CountTape({t1:40, t2:10}, grammar);
        testLength(grammar, "t1", [4, 40], env);
        testLength(grammar, "t2", [2, 10], env);
    }); 

    describe("19. Recursive t1 grammar inside CountTape({t1:40})", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = CountTape({t1:40}, grammar);
        testLength(grammar, "t1", [4, 40], env);
        testLength(grammar, "t2", [2, Infinity], env);
    }); 

});
