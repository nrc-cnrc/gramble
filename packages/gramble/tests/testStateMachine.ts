import {CellPos, SMState, SMOutput, SMComponent, SymbolTable, SMLiteralComponent, SMSequenceComponent, SMUnionComponent, SMEmbedComponent, SMNaturalJoinComponent} from "../src/stateMachine"; 
import { expect } from 'chai';
import { Gen } from "../src/util";

var POS_COUNTER = 0;
function newPos(): CellPos {
    return new CellPos("A", 0, POS_COUNTER++)
}

function Lit(tier: string, text: string): SMComponent {
    return new SMLiteralComponent(tier, text,  newPos());
}

const Literalizer = (tier: string) => (text: string) => Lit(tier, text);
const text = Literalizer("text");
const unrelated = Literalizer("unrelated");
const t1 = Literalizer("t1");
const t2 = Literalizer("t2");
const t3 = Literalizer("t3");


function Seq(...children: SMComponent[]): SMComponent {
    return new SMSequenceComponent(children,  newPos());
}

function Uni(...children: SMComponent[]): SMComponent {
    return new SMUnionComponent(children,  newPos());
}

function Emb(symbolName: string, symbolTable: SymbolTable): SMComponent {
    return new SMEmbedComponent(symbolName, symbolTable,  newPos());
}

function Join(child1: SMComponent, child2: SMComponent): SMComponent {
    return new SMNaturalJoinComponent(child1, child2,  newPos());
}

export function testNumOutputs(states: SMOutput[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(states.length).to.equal(expected_num);
    });
}

export function testHasOutput(states: SMOutput[], tier: string, target: string) {
    it("should have " + target + " on tier " + tier, function() {
        var results = states.map(s => s.toObj())
                            .filter(o => tier in o)
                            .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}

describe('Literal text:hello', function() {
    const grammar = text("hello");
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
});


describe('Sequence text:hello+test:world', function() {
    const grammar = Seq(text("hello"), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Sequence text:hello+text:,+test:world', function() {
    const grammar = Seq(text("hello"), text(", "), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 

describe('Nested sequence (text:hello+text:,)+test:world', function() {
    const grammar = Seq(Seq(text("hello"), text(", ")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Nested sequence text:hello+(text:,+test:world)', function() {
    const grammar = Seq(text("hello"), Seq(text(", ")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Alt text:hello|text:goodbye', function() {
    const grammar = Uni(text("hello"), text("goodbye"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+test:world', function() {
    const grammar = Seq(Uni(text("hello"), text("goodbye")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 

describe('Symbol containing text:hello', function() {
    const symbolTable = { "s": text("hello") };
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Symbol containing text:hello+text:world', function() {
    const symbolTable = { "s": Seq(text("hello"), text("world")) };
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Symbol containing text:hello|text:goodbye', function() {
    const symbolTable = { "s": Uni(text("hello"), text("goodbye")) };
    const grammar = Emb("s", symbolTable);
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Joining t1:hi & t1:hi', function() {
    const grammar = Join(text("hello"), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
});


describe('Joining t1:hi & t1:hi+t2:bye', function() {
    const outputs = [...Join(t1("hi"), Seq(t1("hi"), t2("bye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 


describe('Joining (t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
    const outputs = [...Join(Join(t1("hi"), Seq(t1("hi"), t2("bye"))), Seq(t2("bye"), t3("yo"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Joining two sequences', function() {
    const outputs = [...Join(Seq(t1("hi"), t1("hi")), Seq(Seq(t1("hi"), t2("bye")), Seq(t1("hi"), t2("bye")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byebye");
}); 


describe('Joining an alternation & literal', function() {
    const outputs = [...Join(Uni(t1("hi"), t1("yo")), Seq(t1("hi"), t2("bye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Symbol of (t1:hi & t1:hi+t2:bye)', function() {
    const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const outputs = [...Emb("hi2bye", symbolTable).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Joining sym(t1:hi & t1:hi+t2:bye) & t2:bye+t3:yo', function() {
    const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const grammar = Join(Emb("hi2bye", symbolTable), Seq(t2("bye"), t3("yo")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Joining t1:hi & (t1:hi+t2:bye & t2:bye+t3:yo)', function() {
    const outputs = [...Join(t1("hi"), Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Joining t1:hi & sym(t1:hi+t2:bye & t2:bye+t3:yo)', function() {
    const symbolTable = { "hi2yo": Join(Seq(t1("hi"), t2("bye")), Seq(t2("bye"), t3("yo")))};
    const grammar = Join(t1("hi"), Emb("hi2yo", symbolTable));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Joining of (t1:hi & t1:hi+t2:bye)+t2:world', function() {
    const outputs = [...Seq(Join(t1("hi"), Seq(t1("hi"), t2("bye"))), t2("world")).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 

describe('Joining of sym(t1:hi & t1:hi+t2:bye)+t2:world', function() {
    const symbolTable = { "hi2bye" : Join(t1("hi"), Seq(t1("hi"), t2("bye"))) };
    const grammar = Seq(Emb("hi2bye", symbolTable), t2("world")); 
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 


describe('Joining text:hello & text:hello+text:world', function() {
    const outputs = [...Join(text("hello"), Seq(text("hello"), text("world"))).run()];
    testNumOutputs(outputs, 0);
}); 


describe('Joining text:hello & text:helloworld', function() {
    const outputs = [...Join(text("hello"), text("helloworld")).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:hello & text:hello+text:world', function() {
    const outputs = [...Join(text("hello"), Seq(text("hello"), text("world"))).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:helloworld & text:hello', function() {
    const outputs = [...Join(text("helloworld"), text("hello")).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:hello+text:world & text:hello', function() {
    const outputs = [...Join(Seq(text("hello"), text("world")), text("hello")).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("foo"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Joining text:hello & text:hello', function() {
    const outputs = [...Join(text("hello"), text("hello")).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Joining text:hello & text:hello+unrelated:foo', function() {
    const outputs = [...Join(text("hello"), Seq(text("hello"), unrelated("foo"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Joining text:hello+unrelated:foo & text:hello', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("foo")), text("hello")).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 


describe('Joining text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
    const outputs = [...Join(Seq(text("hello"), unrelated("foo")), Seq(text("hello"), unrelated("bar"))).run()];
    testNumOutputs(outputs, 0);
}); 

describe('Joining (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
    const outputs = [...Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Joining (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
    const outputs = [...Join(Uni(text("goodbye"),  text("welcome")), Uni(text("hello"), text("goodbye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Nested joining, leftward', function() {
    const outputs = [...Join(Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))), Uni(text("yo"), text("goodbye"))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Nested joining, rightward', function() {
    const outputs = [...Join(Uni(text("yo"), text("goodbye")), Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome")))).run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Joining to joining text:hello & text:hello', function() {
    const outputs = [...Join(text("hello"), Join(text("hello"), text("hello"))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to joining of (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
    const outputs = [...Join(text("goodbye"), Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome")))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to joining of (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
    const outputs = [...Join(text("goodbye"), Join(Uni(text("goodbye"),  text("welcome")), Uni(text("hello"), text("goodbye")))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to nested joining, leftward', function() {
    const outputs = [...Join(text("goodbye"), Join(Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))), Uni(text("yo"), text("goodbye")))).run()];
    testNumOutputs(outputs, 1);
}); 

describe('Joining to nested joining, rightward', function() {
    const outputs = [...Join(text("goodbye"), Join(Uni(text("yo"), text("goodbye")), Join(Uni(text("hello"), text("goodbye")), Uni(text("goodbye"),  text("welcome"))))).run()];
    testNumOutputs(outputs, 1);
}); 
