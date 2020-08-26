import { expect } from 'chai';
import {Literalizer, Seq, Uni, Join, Emb, Proj, StringDict, SymbolTable} from "../src/parserInterface";

const text = Literalizer("text");
const unrelated = Literalizer("unrelated");
const t1 = Literalizer("t1");
const t2 = Literalizer("t2");
const t3 = Literalizer("t3");

export function testNumOutputs(outputs: StringDict[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(outputs.length).to.equal(expected_num);
    });
}

export function testHasOutput(outputs: StringDict[], tier: string, target: string) {
    it("should have " + target + " on tier " + tier, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}


export function testDoesntHaveOutput(outputs: StringDict[], tier: string, target: string) {
    it("should not have " + target + " on tier " + tier, function() {
        var results = outputs.filter(o => tier in o)
                             .map(o => o[tier]);
        expect(results).to.not.contain(target);
    });
}


describe('Joining "helloworld" with right-recursive "hello+ world"', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;

    const grammar = Join(text("helloworld"), helloWorld);
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});


describe('Joining right-recursive "hello+ world" with "helloworld"', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;

    const grammar = Join(helloWorld, text("helloworld"));
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});

describe('Joining "hellohelloworld" with right-recursive "hello+ world"', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;

    const grammar = Join(text("hellohelloworld"), helloWorld);
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});

describe('Joining right-recursive "hello+ world" with "hellohelloworld"', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;

    const grammar = Join(helloWorld, text("hellohelloworld"));
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});


describe('Joining "helloworld" with left-recursive "hello+ world"', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const grammar = Join(text("helloworld"), helloWorld);
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});


describe('Joining "hellohelloworld" with left-recursive "hello+ world"', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const grammar = Join(text("hellohelloworld"), helloWorld);
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});


describe('Joining left-recursive "hello+ world" with "helloworld"', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const grammar = Join(helloWorld, text("helloworld"));
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});


describe('Joining left-recursive "hello+ world" with "hellohelloworld"', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const grammar = Join(helloWorld, text("hellohelloworld"));
    const outputs = [... grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hellohelloworld");
});

describe('Emitting from right-recursive "hello+ world" with default max recursion (4)', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;
    const outputs = [... helloWorld.run()];
    testNumOutputs(outputs, 5);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohellohelloworld");
});

describe('Emitting from right-recursive "hello+ world" with max recursion 2', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;
    const outputs = [... helloWorld.run(2)];
    testNumOutputs(outputs, 3);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
});

describe('Emitting from right-recursive "hello+ world" with max recursion 0', function() {
    const symbolTable: SymbolTable = {};
    const world = Uni(text("world"), Emb("helloWorld", symbolTable))
    const helloWorld = Seq(text("hello"), world);
    symbolTable["helloWorld"] = helloWorld;
    const outputs = [... helloWorld.run(0)];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});

describe('Emitting from left-recursive "hello+ world" with default max recursion (4)', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const outputs = [... helloWorld.run()];
    testNumOutputs(outputs, 5);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohelloworld");
    testHasOutput(outputs, "text", "hellohellohellohellohelloworld");
});


describe('Emitting from left-recursive "hello+ world" with max recursion 2', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const outputs = [... helloWorld.run(2)];
    testNumOutputs(outputs, 3);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "hellohelloworld");
    testHasOutput(outputs, "text", "hellohellohelloworld");
});

describe('Emitting from left-recursive "hello+ world" with max recursion 0', function() {
    const symbolTable: SymbolTable = {};
    const helloHello = Uni(text("hello"), Seq(Emb("hellohello", symbolTable), text("hello")));
    const helloWorld = Seq(helloHello, text("world"));
    symbolTable["hellohello"] = helloHello;
    const outputs = [... helloWorld.run(0)];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
});