import { expect } from 'chai';

import { CounterStack } from '../src/exprs';
import {
    Count, CountTape, Epsilon, 
    Join, Null, Rep, Seq, Uni, Collection,
    Embed, CollectionGrammar
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

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(VERBOSE, module);

    describe("1. t1:hello", function() {
        const grammar = t1("hello");
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("2. Epsilon", function() {
        const grammar = Epsilon();
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("3. Null", function() {
        const grammar = Null();
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("4. (t1:hello){2:4}", function() {
        const grammar = Rep(t1("hello"), 2, 4);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("5. (t1:hello)*", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });

    describe("6. (t1:hello){2:Infinity}", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("7. t1:hello ⨝ (t1:hello)*", function() {
        const grammar = Join(t1("hello"), Rep(t1("hello")));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("8. t1:hello | (t1:hello)*", function() {
        const grammar = Uni(t1("hello"), Rep(t1("hello")));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("9. t1:hello + (t1:hello)*", function() {
        const grammar = Seq(t1("hello"), Rep(t1("hello")));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("10. Count(100, (t1:hello + t2:hi)*)", function() {
        const grammar = Count(100, Rep(Seq(t1("hello"), t2("hi"))));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    // CountTapeGrammar.potentiallyInfinite() may need to know its tapes.

    describe("11. CountTape(100, (t1:hello + t2:hi)*))", function() {
        const grammar = CountTape(100, Rep(Seq(t1("hello"), t2("hi"))));
        let counterStack: CounterStack = new CounterStack(2);
        let env: PassEnv = new PassEnv;
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("12. CountTape({t1:20, t2:10}, (t1:hello + t2:hi)*)", function() {
        const grammar = CountTape({t1:20, t2:10}, Rep(Seq(t1("hello"), t2("hi"))));
        let counterStack: CounterStack = new CounterStack(2);
        let env: PassEnv = new PassEnv;
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("13. CountTape({t1:20}, (t1:hello + t2:hi)*)", function() {
        const grammar = CountTape({t1:20}, Rep(Seq(t1("hello"), t2("hi"))));
        let counterStack: CounterStack = new CounterStack(2);
        let env: PassEnv = new PassEnv;
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        // Even though the CountTape limits t1, and thus t2 is limited
        // as well because it has the same number of repetitions as t1,
        // CountTape.potentiallyInfinite() is unable to determine that
        // this grammar is finite because t2 is not explicitly limited
        // by the CountTape and the child grammar is potentially infinite.
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    }); 

    describe("14. CountTape({t1:20}, (t1:hello + t2:hi){0,5})", function() {
        const grammar = CountTape({t1:20}, Rep(Seq(t1("hello"), t2("hi")), 0, 5));
        let counterStack: CounterStack = new CounterStack(2);
        let env: PassEnv = new PassEnv;
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        // Even though the CountTape only limits t1, CountTape.potentiallyInfinite()
        // is able to determinte that the grammar is finitie because the
        // child grammar is finite.
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("15. Recursive t1 grammar", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = NAME_PASSES.go(ns, env) 
                            .destructure() as [CollectionGrammar, Msgs];
        env.symbolNS.entries = result.symbols;
        const grammar = result.symbols["hiWorld"]
        if (grammar == undefined) {
            return;
        }
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), env);
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    }); 

    describe("16. Recursive t1 grammar inside Count(100)", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = NAME_PASSES.go(ns, env) 
                            .destructure() as [CollectionGrammar, Msgs];
        env.symbolNS.entries = result.symbols;
        let grammar = result.symbols["hiWorld"]
        if (grammar == undefined) {
            return;
        }
        grammar = Count(100, grammar);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), env);
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("17. Recursive t1 grammar inside CountTape(40)", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = NAME_PASSES.go(ns, env) 
                            .destructure() as [CollectionGrammar, Msgs];
        env.symbolNS.entries = result.symbols;
        let grammar = result.symbols["hiWorld"]
        if (grammar == undefined) {
            return;
        }
        grammar = CountTape(40, grammar);
        let counterStack: CounterStack = new CounterStack(2);
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("18. Recursive t1 grammar inside CountTape({t1:40, t2:10})", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = NAME_PASSES.go(ns, env) 
                            .destructure() as [CollectionGrammar, Msgs];
        env.symbolNS.entries = result.symbols;
        let grammar = result.symbols["hiWorld"]
        if (grammar == undefined) {
            return;
        }
        grammar = CountTape({t1:40, t2:10}, grammar);
        let counterStack: CounterStack = new CounterStack(2);
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("19. Recursive t1 grammar inside CountTape({t1:40})", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), t2("HI"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = NAME_PASSES.go(ns, env) 
                            .destructure() as [CollectionGrammar, Msgs];
        env.symbolNS.entries = result.symbols;
        let grammar = result.symbols["hiWorld"]
        if (grammar == undefined) {
            return;
        }
        grammar = CountTape({t1:40}, grammar);
        let counterStack: CounterStack = new CounterStack(2);
        grammar.calculateTapes(counterStack, env);
        const isInfinite = grammar.potentiallyInfinite(counterStack, env);
        // Even though the CountTape limits t1, and t2 is finite,
        // CountTape.potentiallyInfinite() is unable to determine that
        // this grammar is finite because t2 is not limited by the
        // CountTape and the child grammar is potentially infinite
        // (albeit on t1, not t2).
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    }); 

});
