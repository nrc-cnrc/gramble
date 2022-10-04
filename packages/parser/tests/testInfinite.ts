import { expect } from 'chai';
import * as path from 'path';
import { CounterStack } from '../src/exprs';
import { Count, CountTape, Epsilon, 
    Join, Null, Rep, Seq, Uni, Ns, Embed } from '../src/grammars';
import { PassEnv } from '../src/passes';
import { NameQualifierPass } from '../src/passes/nameQualifier';
import { t1 } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe("t1:hello", function() {
        const grammar = t1("hello");
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("Epsilon", function() {
        const grammar = Epsilon();
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("Null", function() {
        const grammar = Null();
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("(t1:hello){2:4}", function() {
        const grammar = Rep(t1("hello"), 2, 4);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("(t1:hello)*", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });

    describe("(t1:hello){2:Infinity}", function() {
        const grammar = Rep(t1("hello"), 2, Infinity);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("t1:hello & (t1:hello)*", function() {
        const grammar = Join(t1("hello"), Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });

    describe("t1:hello | (t1:hello)*", function() {
        const grammar = Uni(t1("hello"), Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("t1:hello + (t1:hello)*", function() {
        const grammar = Seq(t1("hello"), Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    });
    
    describe("Count(100, (t1:hello)*)", function() {
        const grammar = Count(100, Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    });
    
    describe("CountTape(100, (t1:hello)*)", function() {
        const grammar = CountTape(100, Rep(t1("hello"), 2, Infinity));
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

    describe("Recursive grammar ", function() {
        let ns = Ns();
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        ns.addSymbol("hiWorld", hiWorld);
        const env = new PassEnv();
        const [result, _] = new NameQualifierPass(ns).transform(env).destructure();
        const grammar = result.getSymbol("hiWorld");
        if (grammar == undefined) {
            return;
        }
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be infinite", function() {
            expect(isInfinite).to.be.true;
        });
    }); 

    describe("Recursive grammar inside a count ", function() {
        let ns = Ns();
        const world = Uni(t1("world"), Embed("hiWorld"))
        const hiWorld = Seq(t1("hi"), world);
        ns.addSymbol("hiWorld", hiWorld);
        const env = new PassEnv();
        const [result, _] = new NameQualifierPass(ns).transform(env).destructure();
        let grammar = result.getSymbol("hiWorld");
        if (grammar == undefined) {
            return;
        }
        grammar = Count(100, grammar);
        const isInfinite = grammar.potentiallyInfinite(new CounterStack(2));
        it("should be finite", function() {
            expect(isInfinite).to.be.false;
        });
    }); 

});