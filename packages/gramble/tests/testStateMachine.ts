import {CellPos, SMState, SymbolTable, SMComposeComponent, SMLiteralComponent, SMSequenceComponent, SMUnionComponent, SMEmbedComponent, SMIntersectionComponent} from "../src/stateMachine"; 
import { expect } from 'chai';


const hello = new SMLiteralComponent("text", "hello", new CellPos("S",1,1));
const goodbye = new SMLiteralComponent("text", "goodbye", new CellPos("S",2,1));
const welcome = new SMLiteralComponent("text", "welcome", new CellPos("S", 2,2));
const yo = new SMLiteralComponent("text", "yo", new CellPos("S", 2, 3));
const unrelatedFoo = new SMLiteralComponent("unrelated", "foo", new CellPos("U",1,1));
const unrelatedBar = new SMLiteralComponent("unrelated", "bar", new CellPos("U",1,2));
const world = new SMLiteralComponent("text", "world", new CellPos("S",3,1));
const comma = new SMLiteralComponent("text", ", ", new CellPos("S", 3,3));
const helloworldAllOneWord = new SMLiteralComponent("text", "helloworld", new CellPos("S",1,1));
const helloWorld = new SMSequenceComponent([hello, world], new CellPos("S",4,1));
const helloCommaWorld = new SMSequenceComponent([hello, comma, world], new CellPos("S",4,2));
const helloComma = new SMSequenceComponent([hello, comma], new CellPos("X",5,1));
const helloCommaWorldLeft = new SMSequenceComponent([helloComma, world], new CellPos("X",5,2));
const commaWorld = new SMSequenceComponent([comma, world], new CellPos("X", 5,3));
const helloCommaWorldRight =new SMSequenceComponent([hello, commaWorld], new CellPos("X",5,4));

const helloOrGoodbye = new SMUnionComponent([hello, goodbye], new CellPos("S",5,1));
const goodbyeOrWelcome = new SMUnionComponent([goodbye, welcome], new CellPos("S", 5,2));
const goodbyeOrYo = new SMUnionComponent([yo, goodbye], new CellPos("S", 5, 3));

const helloOrGoodbyeWorld = new SMSequenceComponent([helloOrGoodbye, world], new CellPos("S",6,1));


const symbolTable: SymbolTable = {};
symbolTable["hello"] = hello;
const helloSymbol = new SMEmbedComponent("hello", symbolTable, new CellPos("S",7,1));

symbolTable["helloWorld"] = helloWorld;
const helloWorldSymbol = new SMEmbedComponent("helloWorld", symbolTable, new CellPos("S",7,1));


symbolTable['helloOrGoodbye'] = helloOrGoodbye;
const helloGoodbyeSymbol = new SMEmbedComponent("helloOrGoodbye", symbolTable, new CellPos("S",7,1));
const helloGoodbyeSymbolWorld = new SMSequenceComponent([helloGoodbyeSymbol, world], new CellPos("S", 6, 1));

const hiEmitter = new SMLiteralComponent("t1", "hi", new CellPos("S",1,1));


const hiConsumer = new SMLiteralComponent("t1", "hi", new CellPos("S",2,1));
const hiMirror = new SMComposeComponent(hiEmitter, hiConsumer, new CellPos("S",1,2));

const byeEmitter = new SMLiteralComponent("t2", "bye", new CellPos("S",2,2));
const byeConsumer = new SMLiteralComponent("t2", "bye", new CellPos("S",3,1));
const yoEmitter = new SMLiteralComponent("t3", "yo", new CellPos("S",3,2));
const hi2bye = new SMSequenceComponent([hiConsumer, byeEmitter], new CellPos("S",2,1));
const bye2welcome = new SMSequenceComponent([byeConsumer, yoEmitter], new CellPos("S",3,1));
const composeTest1 = new SMComposeComponent(hiEmitter, hi2bye, new CellPos("S",4,1));
const composeTest2 = new SMComposeComponent(composeTest1, bye2welcome, new CellPos("S",4,2));

const hi2yoConverter = new SMComposeComponent(hi2bye, bye2welcome, new CellPos("S", 8, 1));
const composeTest3 = new SMComposeComponent(hiEmitter, hi2yoConverter, new CellPos("S",4,2));

const doubleHiEmitter = new SMSequenceComponent([hiEmitter, hiEmitter], new CellPos("D",1,1));
const doubleHi2Bye = new SMSequenceComponent([hi2bye, hi2bye], new CellPos("D",1,2));
const composeTest4 = new SMComposeComponent(doubleHiEmitter, doubleHi2Bye, new CellPos("D",1,3));

const yoOnT1Emitter = new SMLiteralComponent("t1", "yo", new CellPos("S", 1, 2));
const hiOrYoEmitter = new SMUnionComponent([hiEmitter, yoOnT1Emitter], new CellPos("S", 1, 3));
const composeTest5 = new SMComposeComponent(hiOrYoEmitter, hi2bye, new CellPos("Q",1,1));

symbolTable["hi2bye"] = composeTest1;
const hi2byeSymbol = new SMEmbedComponent("hi2bye", symbolTable, new CellPos("S",7,2));
const composeSymbolTest = new SMComposeComponent(hi2byeSymbol, bye2welcome, new CellPos("S", 4, 2));

symbolTable["hi2yo"] = hi2yoConverter;
const hi2yoSymbol = new SMEmbedComponent("hi2yo", symbolTable, new CellPos("S",7,2));
const composeSymbolTest2 = new SMComposeComponent(hiEmitter, hi2yoSymbol, new CellPos("S", 4, 2));

const worldOnT2 = new SMLiteralComponent("t2", "world", new CellPos("S", 9, 1));
const compositionWithSuffix = new SMSequenceComponent([composeTest1, worldOnT2], new CellPos("S",10,1)); 

const symbolCompositionWithSuffix = new SMSequenceComponent([hi2byeSymbol, worldOnT2], new CellPos("S",10,1)); 

const helloHelloIntersection = new SMIntersectionComponent(hello, hello, new CellPos("I",1,1));
const helloHelloWorldIntersection = new SMIntersectionComponent(hello, helloWorld, new CellPos("I",1,1));
const helloWorldHelloIntersection = new SMIntersectionComponent(helloWorld, hello, new CellPos("I",1,1));


const helloHelloworldIntersection2 = new SMIntersectionComponent(hello, helloworldAllOneWord, new CellPos("I",1,1));
const helloworldHelloIntersection2 = new SMIntersectionComponent(helloworldAllOneWord, hello, new CellPos("I",1,1));

const nontrivialIntersection = new SMIntersectionComponent(helloOrGoodbye, goodbyeOrWelcome, new CellPos("I",1,1));
const nontrivialIntersection2 = new SMIntersectionComponent(goodbyeOrWelcome, helloOrGoodbye, new CellPos("I",1,1));
const nestedIntersectionLeft = new SMIntersectionComponent(nontrivialIntersection, goodbyeOrYo, new CellPos("I",1,1));
const nestedIntersectionRight = new SMIntersectionComponent(goodbyeOrYo, nontrivialIntersection, new CellPos("I",1,1));

const compHelloHelloIntersection = new SMComposeComponent(hello, helloHelloIntersection, new CellPos("I", 3, 1));
const compNontrivialIntersection = new SMComposeComponent(goodbye, nontrivialIntersection, new CellPos("I", 3, 1));
const compNontrivialIntersection2 = new SMComposeComponent(goodbye, nontrivialIntersection2, new CellPos("I", 3, 1));
const compNontrivialIntersection3 = new SMComposeComponent(goodbye, nestedIntersectionLeft, new CellPos("I", 3, 1));
const compNontrivialIntersection4 = new SMComposeComponent(goodbye, nestedIntersectionRight, new CellPos("I", 3, 1));

const helloFoo = new SMSequenceComponent([hello, unrelatedFoo], new CellPos("U",2,1));
const helloBar = new SMSequenceComponent([hello, unrelatedBar], new CellPos("U",2,1));
const twoTierIntersection = new SMIntersectionComponent(helloFoo, helloFoo, new CellPos("U",3,1));
const twoTierIntersectionFail = new SMIntersectionComponent(helloFoo, helloBar, new CellPos("U",3,1));
const twoTierPartialIntersection = new SMIntersectionComponent(hello, helloFoo, new CellPos("U",4,1));
const twoTierPartialIntersection2 = new SMIntersectionComponent(helloFoo, hello, new CellPos("U",4,1));

export function testNumOutputs(states: SMState[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(states.length).to.equal(expected_num);
    });
}

export function testHasOutput(states: SMState[], tier: string, target: string) {
    it("should have " + target + " on tier " + tier, function() {
        var results = states.map(s => s.outputAsObj())
                            .filter(o => tier in o)
                            .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}

describe('Literal component text:hello', function() {
    const outputs = Array.from(hello.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Sequence component text:hello+test:world', function() {
    const outputs = Array.from(helloWorld.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Sequence component text:hello+text:,+test:world', function() {
    const outputs = Array.from(helloCommaWorld.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Nested sequence component (text:hello+text:,)+test:world', function() {
    const outputs = Array.from(helloCommaWorldLeft.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Nested sequence component text:hello+(text:,+test:world)', function() {
    const outputs = Array.from(helloCommaWorldRight.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Alt component text:hello|text:goodbye', function() {
    const outputs = Array.from(helloOrGoodbye.run());
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+test:world', function() {
    const outputs = Array.from(helloOrGoodbyeWorld.run());
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 

describe('Symbol containing text:hello', function() {
    const outputs = Array.from(helloSymbol.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Symbol containing text:hello+text:world', function() {
    const outputs = Array.from(helloWorldSymbol.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Symbol containing text:hello|text:goodbye', function() {
    const outputs = Array.from(helloGoodbyeSymbol.run());
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Symbol containing: (text:hello|text:goodbye)+test:world', function() {
    const outputs = Array.from(helloGoodbyeSymbolWorld.run());
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 


describe('Composing t1:hi x t1:hi', function() {
    const outputs = Array.from(hiMirror.run());
    testNumOutputs(outputs, 1);
});

describe('Composing t1:hi x t1:hi+t2:bye', function() {
    const outputs = Array.from(composeTest1.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Composing t1:hi x t1:hi+t2:bye', function() {
    const outputs = Array.from(composeTest1.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Composing (t1:hi x t1:hi+t2:bye) x t2:bye+t3:yo', function() {
    const outputs = Array.from(composeTest2.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Composing two sequences', function() {
    const outputs = Array.from(composeTest4.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byebye");
}); 


describe('Composing an alternation x literal', function() {
    const outputs = Array.from(composeTest5.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Symbol of (t1:hi x t1:hi+t2:bye)', function() {
    const outputs = Array.from(hi2byeSymbol.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Composing sym(t1:hi x t1:hi+t2:bye) x t2:bye+t3:yo', function() {
    const outputs = Array.from(composeSymbolTest.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Composing t1:hi x (t1:hi+t2:bye x t2:bye+t3:yo)', function() {
    const outputs = Array.from(composeTest3.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Composing t1:hi x sym(t1:hi+t2:bye x t2:bye+t3:yo)', function() {
    const outputs = Array.from(composeSymbolTest2.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Sequence of (t1:hi x t1:hi+t2:bye)+t2:world', function() {
    const outputs = Array.from(compositionWithSuffix.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 

describe('Sequence of sym(t1:hi x t1:hi+t2:bye)+t2:world', function() {
    const outputs = Array.from(symbolCompositionWithSuffix.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 



describe('Intersection text:hello & text:hello', function() {
    const outputs = Array.from(helloHelloIntersection.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Intersection text:hello & text:hello+text:world', function() {
    const outputs = Array.from(helloHelloWorldIntersection.run());
    testNumOutputs(outputs, 0);
}); 


describe('Intersection text:hello & text:helloworld', function() {
    const outputs = Array.from(helloHelloworldIntersection2.run());
    testNumOutputs(outputs, 0);
}); 

describe('Intersection text:hello & text:hello+text:world', function() {
    const outputs = Array.from(helloHelloWorldIntersection.run());
    testNumOutputs(outputs, 0);
}); 

describe('Intersection text:helloworld & text:hello', function() {
    const outputs = Array.from(helloworldHelloIntersection2.run());
    testNumOutputs(outputs, 0);
}); 

describe('Intersection text:hello+text:world & text:hello', function() {
    const outputs = Array.from(helloWorldHelloIntersection.run());
    testNumOutputs(outputs, 0);
}); 



describe('Intersection text:hello+unrelated:foo & text:hello+unrelated:foo', function() {
    const outputs = Array.from(twoTierIntersection.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Intersection text:hello & text:hello', function() {
    const outputs = Array.from(helloHelloIntersection.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Intersection text:hello & text:hello+unrelated:foo', function() {
    const outputs = Array.from(twoTierPartialIntersection.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 

describe('Intersection text:hello+unrelated:foo & text:hello', function() {
    const outputs = Array.from(twoTierPartialIntersection2.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "unrelated", "foo");
}); 


describe('Intersection text:hello+unrelated:foo & text:hello+unrelated:bar', function() {
    const outputs = Array.from(twoTierIntersectionFail.run());
    testNumOutputs(outputs, 0);
}); 

describe('Intersection (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
    const outputs = Array.from(nontrivialIntersection.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Intersection (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
    const outputs = Array.from(nontrivialIntersection2.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Nested intersection, leftward', function() {
    const outputs = Array.from(nestedIntersectionLeft.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Nested intersection, rightward', function() {
    const outputs = Array.from(nestedIntersectionRight.run());
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "goodbye");
}); 

describe('Composing to intersection text:hello & text:hello', function() {
    const outputs = Array.from(compHelloHelloIntersection.run());
    testNumOutputs(outputs, 1);
}); 

describe('Composing to intersection of (text:hello|text:goodbye) & (text:goodbye|text:welcome)', function() {
    const outputs = Array.from(compNontrivialIntersection.run());
    testNumOutputs(outputs, 1);
}); 

describe('Composing to intersection of (text:goodbye|text:welcome) & (text:hello|text:goodbye)', function() {
    const outputs = Array.from(compNontrivialIntersection2.run());
    testNumOutputs(outputs, 1);
}); 

describe('Composing to nested intersection, leftward', function() {
    const outputs = Array.from(compNontrivialIntersection3.run());
    testNumOutputs(outputs, 1);
}); 

describe('Composing to nested intersection, rightward', function() {
    const outputs = Array.from(compNontrivialIntersection4.run());
    testNumOutputs(outputs, 1);
}); 
