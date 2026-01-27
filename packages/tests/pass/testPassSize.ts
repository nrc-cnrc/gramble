import { expect } from 'chai';

import {
    Count, Epsilon, Hide, Join,
    Match, Not, Null, Rename,
    Rep, Replace, ReplaceBlock,
    Seq, Uni,
} from '@gramble/interpreter/src/grammarConvenience.js';

import { Grammar } from '@gramble/interpreter/src/grammars.js';
import { SymbolEnv } from '@gramble/interpreter/src/passes.js';
import { CounterStack } from '@gramble/interpreter/src/utils/counter.js';

import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    t1, t2
} from "../testUtil.js";
import { getTapeSize } from '@gramble/interpreter/src/passes/tapeSize.js';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

function testSize(
    grammar: Grammar, 
    tape: string, 
    expectedSize: [number, number, number],
): void {
    const env = new SymbolEnv();
    grammar = grammar.tapify(env);
    const size = getTapeSize(grammar, tape, new CounterStack(2), env);
    
    if (expectedSize[0] === 0) {
        it(`${tape} should have no results`, function() {
            expect(size.cardinality).to.equal(0);
        });
        return;
    }

    it(`${tape} should have ${expectedSize[0]} results of length ${expectedSize[1]}-${expectedSize[2]}`, function() {
        expect(size.cardinality).to.equal(expectedSize[0]);
        expect(size.minLength).to.equal(expectedSize[1]);
        expect(size.maxLength).to.equal(expectedSize[2]);
    });

}

const module = import.meta;

describe(`Pass ${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe("1. t1:hello", function() {
        const grammar = t1("hello");
        testSize(grammar, "t1", [1, 5, 5]);
        testSize(grammar, "t2", [1, 0, 0]);
    });

    describe("2. Epsilon", function() {
        const grammar = Epsilon();
        testSize(grammar, "t1", [1, 0, 0]);
    });

    describe("3. ∅", function() {
        const grammar = Null();
        testSize(grammar, "t1", [0,0,0]);
    });

    describe("4. (t1:hello){2:4}", function() {
        const grammar = Rep(t1("hello"), 2, 4);
        testSize(grammar, "t1", [Infinity, 10, 20]);
    });

    describe("5. (t1:hello)*", function() {
        const grammar = Rep(t1("hello"), 0, Infinity);
        testSize(grammar, "t1", [Infinity, 0, Infinity]);
    });

    describe("6. (t1:hello){2:Infinity}", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        testSize(grammar, "t1", [Infinity, 10, Infinity]);
    });
    
    describe("7a. t1:hello ⨝ (t1:hello)*", function() {
        const grammar = Join(t1("hello"), Rep(t1("hello")));
        testSize(grammar, "t1", [1, 5, 5]);
    });

    describe("7b. (t1:hello + t2:world) ⨝ (t1:hello)*", function() {
        const grammar = Join(Seq(t1("hello"), t2("world")), t1("hello"));
        testSize(grammar, "t1", [1, 5, 5]);
        testSize(grammar, "t2", [1, 5, 5]);
    });

    describe("8. t1:hello | (t1:hello)*", function() {
        const grammar = Uni(t1("hello"), Rep(t1("hello")));
        testSize(grammar, "t1", [Infinity, 0, Infinity]);
    });
    
    describe("8b. t1:hello | ∅", function() {
        const grammar = Uni(t1("hello"), Null());
        testSize(grammar, "t1", [1, 0, 5]);
    });
    
    describe("8c. ∅ | ∅", function() {
        const grammar = Uni(Null(), Null());
        testSize(grammar, "t1", [0,0,0]);
    });
    
    describe("9. t1:hello + (t1:hello)*", function() {
        const grammar = Seq(t1("hello"), Rep(t1("hello")));
        testSize(grammar, "t1", [Infinity, 5, Infinity]);
    });
    
    describe("10. Count(100, (t1:hello + t2:hi)*)", function() {
        const grammar = Count({t1:100, t2:100}, Rep(Seq(t1("hello"), t2("hi"))));
        testSize(grammar, "t1", [Infinity, 0, 100]);
        testSize(grammar, "t2", [Infinity, 0, 100]);
    });

    describe("11. Count({t1:20, t2:10}, (t1:hello + t2:hi)*)", function() {
        const grammar = Count({t1:20, t2:10}, Rep(Seq(t1("hello"), t2("hi"))));
        testSize(grammar, "t1", [Infinity, 0, 20]);
        testSize(grammar, "t2", [Infinity, 0, 10]);
    }); 
    
    describe("12. Count({t1:20}, (t1:hello + t2:hi)*)", function() {
        const grammar = Count({t1:20}, Rep(Seq(t1("hello"), t2("hi"))));
        testSize(grammar, "t1", [Infinity, 0, 20]);
        testSize(grammar, "t2", [Infinity, 0, Infinity]);
    }); 

    describe("13. Count({t1:20}, (t1:hello + t2:hi){0,5})", function() {
        const grammar = Count({t1:20}, Rep(Seq(t1("hello"), t2("hi")), 0, 5));
        testSize(grammar, "t1", [Infinity, 0, 20]);
        testSize(grammar, "t2", [Infinity, 0, 10]);
    }); 

    describe("14a. ~(t1:hello)", function() {
        const grammar = Not(t1("hello"));
        testSize(grammar, "t1", [Infinity, 0, Infinity]);
    });
    
    describe("14b. ~(t1:hello)+t2:world", function() {
        const grammar = Seq(Not(t1("hello")), t2("world"));
        testSize(grammar, "t1", [Infinity, 0, Infinity]);
        testSize(grammar, "t2", [1, 5, 5]);
    });

    describe("15. t1:hello ⨝ e -> a", function() {
        const grammar = ReplaceBlock("t1", "hello", Replace("e","a"));
        testSize(grammar, "t1", [Infinity, 0, Infinity]);
    });
    
    describe("16. Rename t1->t2 (t1:hello)", function() {
        const grammar = Rename(t1("hello"), "t1", "t2")
        testSize(grammar, "t1", [1, 0, 0]);
        testSize(grammar, "t2", [1, 5, 5]);
    });
    
    describe("17. Hide_t1 (t1:hello)", function() {
        const grammar = Hide(t1("hello"), "t1")
        testSize(grammar, "t1", [1, 0, 0]);
    });
    
    describe("18. Match t1->t2 (t1:hello)", function() {
        const grammar = Match(t1("hello"), "t1", "t2");
        testSize(grammar, "t1", [1, 5, 5]);
        testSize(grammar, "t2", [1, 5, 5]);
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
