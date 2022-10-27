import { expect } from 'chai';
import * as path from 'path';
import { CounterStack } from '../src/exprs';
import { Count, CountTape, Epsilon, 
    Join, Null, Rep, Seq, Uni, Collection, Embed, CollectionGrammar } from '../src/grammars';
import { PassEnv } from '../src/passes';
import { QUALIFY_NAMES } from '../src/passes/allPasses';
import { QualifyNames } from '../src/passes/qualifyNames';
import { t1 } from "./testUtil";

describe(`${path.basename(module.filename)}`, function() {

    describe("t1:hello", function() {
        const grammar = t1("hello");
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("Epsilon", function() {
        const grammar = Epsilon();
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("Null", function() {
        const grammar = Null();
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("(t1:hello){2:4}", function() {
        const grammar = Rep(t1("hello"), 2, 4);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("(t1:hello)*", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });

    describe("(t1:hello){2:Infinity}", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("t1:hello & (t1:hello)*", function() {
        const grammar = Join(t1("hello"), Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("t1:hello | (t1:hello)*", function() {
        const grammar = Uni(t1("hello"), Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("t1:hello + (t1:hello)*", function() {
        const grammar = Seq(t1("hello"), Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("Count(100, (t1:hello)*)", function() {
        const grammar = Count(100, Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });
    
    describe("CountTape(100, (t1:hello)*)", function() {
        const grammar = CountTape(100, Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), new PassEnv());
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("Recursive grammar ", function() {
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = QUALIFY_NAMES.go(ns, env).destructure();
        env.symbolNS.entries = (result as CollectionGrammar).symbols;
        const grammar = result.getSymbol("hiWorld");
        if (grammar == undefined) {
            return;
        }
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), env);
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    }); 

    describe("Recursive grammar inside a count ", function() {
        
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        const ns = Collection({
            "hiWorld": hiWorld
        });
        const env = new PassEnv();
        const [result, _] = QUALIFY_NAMES.go(ns, env).destructure();
        env.symbolNS.entries = (result as CollectionGrammar).symbols;
        let grammar = result.getSymbol("hiWorld");
        if (grammar == undefined) {
            return;
        }
        grammar = Count(100, grammar);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2), env);
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

});