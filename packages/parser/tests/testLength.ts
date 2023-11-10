import { expect } from 'chai';

import { CounterStack } from '../src/exprs';

import {
    Count, Epsilon, 
    Join, Null, Rep, 
    Seq, Uni, Not, 
    Rename, Hide, Match, ReplaceBlock, Replace
} from '../src/grammarConvenience';

import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2
} from "./testUtil";

import { Msgs } from '../src/utils/msgs';
import { PassEnv } from '../src/passes';
import { NAME_PASSES } from '../src/passes/allPasses';
import { lengthRange } from '../src/passes/infinityProtection';
import { Grammar } from '../src/grammars';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

/*
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
} */

function testLength(
    grammar: Grammar, 
    tape: string, 
    expectedLength: [number, number] | null,
): void {
    const env: PassEnv = new PassEnv();

    grammar.calculateTapes(new CounterStack(), env);
    const length = lengthRange(grammar, tape, new CounterStack(2), env);
    
    if (expectedLength === null) {
        it(`${tape} should have null length`, function() {
            expect(length.null).to.be.true;
        });
        return;
    }

    it(`${tape} should be length ${expectedLength[0]}-${expectedLength[1]}`, function() {
        expect(length.null).to.be.false;
        expect(length.min).to.equal(expectedLength[0]);
        expect(length.max).to.equal(expectedLength[1]);
    });

}

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

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
    
    describe("7a. t1:hello ⨝ (t1:hello)*", function() {
        const grammar = Join(t1("hello"), Rep(t1("hello")));
        testLength(grammar, "t1", [5, 5]);
    });

    describe("7b. (t1:hello + t2:world) ⨝ (t1:hello)*", function() {
        const grammar = Join(Seq(t1("hello"), t2("world")), t1("hello"));
        testLength(grammar, "t1", [5, 5]);
        testLength(grammar, "t2", [5, 5]);
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
        const grammar = Count({t1:100, t2:100}, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 100]);
        testLength(grammar, "t2", [0, 100]);
    });

    describe("11. Count({t1:20, t2:10}, (t1:hello + t2:hi)*)", function() {
        const grammar = Count({t1:20, t2:10}, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 20]);
        testLength(grammar, "t2", [0, 10]);
    }); 
    
    describe("12. Count({t1:20}, (t1:hello + t2:hi)*)", function() {
        const grammar = Count({t1:20}, Rep(Seq(t1("hello"), t2("hi"))));
        testLength(grammar, "t1", [0, 20]);
        testLength(grammar, "t2", [0, Infinity]);
    }); 

    describe("13. Count({t1:20}, (t1:hello + t2:hi){0,5})", function() {
        const grammar = Count({t1:20}, Rep(Seq(t1("hello"), t2("hi")), 0, 5));
        testLength(grammar, "t1", [0, 20]);
        testLength(grammar, "t2", [0, 10]);
    }); 

    describe("14a. ~(t1:hello)", function() {
        const grammar = Not(t1("hello"));
        testLength(grammar, "t1", [0, Infinity]);
    });
    
    describe("14b. ~(t1:hello)+t2:world", function() {
        const grammar = Seq(Not(t1("hello")), t2("world"));
        testLength(grammar, "t1", [0, Infinity]);
        testLength(grammar, "t2", [5, 5]);
    });

    describe("15. t1:hello ⨝ e -> a", function() {
        const grammar = ReplaceBlock("t1", "hello", Replace("e","a"));
        testLength(grammar, "t1", [0, Infinity]);
    });
    
    describe("16. Rename t1->t2 (t1:hello)", function() {
        const grammar = Rename(t1("hello"), "t1", "t2")
        testLength(grammar, "t1", [0, 0]);
        testLength(grammar, "t2", [5, 5]);
    });
    
    describe("17. Hide_t1 (t1:hello)", function() {
        const grammar = Hide(t1("hello"), "t1")
        testLength(grammar, "t1", [0, 0]);
    });
    
    describe("18. Match t1->t2 (t1:hello)", function() {
        const grammar = Match(t1("hello"), "t1", "t2");
        testLength(grammar, "t1", [5, 5]);
        testLength(grammar, "t2", [5, 5]);
    });

    /*
    describe("14. Recursive t1 grammar", function() {
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

    describe("15. Recursive t1 grammar inside Count(100)", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = Count({t1:100}, grammar);
        testLength(grammar, "t1", [4, 100], env);
    }); 

    describe("16. Recursive t1 grammar inside Count(40)", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = Count({t1:40}, grammar);
        testLength(grammar, "t1", [4, 40], env);
    }); 

    describe("17. Recursive t1 grammar inside Count({t1:40, t2:10})", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = Count({t1:40, t2:10}, grammar);
        testLength(grammar, "t1", [4, 40], env);
        testLength(grammar, "t2", [2, 10], env);
    }); 

    describe("18. Recursive t1 grammar inside Count({t1:40})", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        let [grammar, env] = selectSymbol(ns, "hiWorld");
        grammar = Count({t1:40}, grammar);
        testLength(grammar, "t1", [4, 40], env);
        testLength(grammar, "t2", [2, Infinity], env);
    }); 

    */

});
