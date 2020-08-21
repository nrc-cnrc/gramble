import {CellPos, SMState, SymbolTable, SMComposeComponent, SMLiteralComponent, SMSequenceComponent, SMAltComponent, SMEmbedComponent} from "../src/stateMachine"; 
import { expect } from 'chai';

const hello = new SMLiteralComponent("text", "hello", new CellPos("S",1,1));
const goodbye = new SMLiteralComponent("text", "goodbye", new CellPos("S",2,1));
const world = new SMLiteralComponent("text", "world", new CellPos("S",3,1));
const comma = new SMLiteralComponent("text", ", ", new CellPos("S", 3,3));
const helloworld = new SMSequenceComponent([hello, world], new CellPos("S",4,1));
const helloCommaWorld = new SMSequenceComponent([hello, comma, world], new CellPos("S",4,2));
const helloComma = new SMSequenceComponent([hello, comma], new CellPos("X",5,1));
const helloCommaWorldLeft = new SMSequenceComponent([helloComma, world], new CellPos("X",5,2));
const commaWorld = new SMSequenceComponent([comma, world], new CellPos("X", 5,3));
const helloCommaWorldRight =new SMSequenceComponent([hello, commaWorld], new CellPos("X",5,4));

const hellogoodbye = new SMAltComponent([hello, goodbye], new CellPos("S",5,1));
const hellogoodbyeworld = new SMSequenceComponent([hellogoodbye, world], new CellPos("S",6,1));

const symbolTable: SymbolTable = {};
symbolTable["hello"] = hello;
const helloSymbol = new SMEmbedComponent("hello", symbolTable, new CellPos("S",7,1));

symbolTable["helloWorld"] = helloworld;
const helloWorldSymbol = new SMEmbedComponent("helloWorld", symbolTable, new CellPos("S",7,1));


symbolTable['hiOrBye'] = hellogoodbye;
const helloGoodbyeSymbol = new SMEmbedComponent("hiOrBye", symbolTable, new CellPos("S",7,1));
const helloGoodbyeSymbolWorld = new SMSequenceComponent([helloGoodbyeSymbol, world], new CellPos("S", 6, 1));

const helloEmitter = new SMLiteralComponent("t1", "hi", new CellPos("S",1,1));
const helloConsumer = new SMLiteralComponent("t1", "hi", new CellPos("S",2,1));
const goodbyeEmitter = new SMLiteralComponent("t2", "bye", new CellPos("S",2,2));
const goodbyeConsumer = new SMLiteralComponent("t2", "bye", new CellPos("S",3,1));
const welcomeEmitter = new SMLiteralComponent("t3", "yo", new CellPos("S",3,2));
const hello2goodbye = new SMSequenceComponent([helloConsumer, goodbyeEmitter], new CellPos("S",2,1));
const goodbye2welcome = new SMSequenceComponent([goodbyeConsumer, welcomeEmitter], new CellPos("S",3,1));
const composeTest1 = new SMComposeComponent(helloEmitter, hello2goodbye, new CellPos("S",4,1));
const composeTest2 = new SMComposeComponent(composeTest1, goodbye2welcome, new CellPos("S",4,2));

const hi2yoConverter = new SMComposeComponent(hello2goodbye, goodbye2welcome, new CellPos("S", 8, 1));
const composeTest3 = new SMComposeComponent(helloEmitter, hi2yoConverter, new CellPos("S",4,2));

const doubleHelloEmitter = new SMSequenceComponent([helloEmitter, helloEmitter], new CellPos("D",1,1));
const doubleHi2Bye = new SMSequenceComponent([hello2goodbye, hello2goodbye], new CellPos("D",1,2));
const composeTest4 = new SMComposeComponent(doubleHelloEmitter, doubleHi2Bye, new CellPos("D",1,3));



symbolTable["hi2bye"] = composeTest1;
const hi2byeSymbol = new SMEmbedComponent("hi2bye", symbolTable, new CellPos("S",7,2));
const composeSymbolTest = new SMComposeComponent(hi2byeSymbol, goodbye2welcome, new CellPos("S", 4, 2));

symbolTable["hi2yo"] = hi2yoConverter;
const hi2yoSymbol = new SMEmbedComponent("hi2yo", symbolTable, new CellPos("S",7,2));
const composeSymbolTest2 = new SMComposeComponent(helloEmitter, hi2yoSymbol, new CellPos("S", 4, 2));

const worldOnT2 = new SMLiteralComponent("t2", "world", new CellPos("S", 9, 1));
const compositionWithSuffix = new SMSequenceComponent([composeTest1, worldOnT2], new CellPos("S",10,1)); 

const symbolCompositionWithSuffix = new SMSequenceComponent([hi2byeSymbol, worldOnT2], new CellPos("S",10,1)); 

export function testNumResults(result: any[], expected_num: number) {
    it("should have " + expected_num + " result(s)", function() {
        expect(result.length).to.equal(expected_num);
    });
}

export function testHasOutput(outputs: SMState[], tier: string, target: string) {
    it("should have " + target + " on tier " + tier, function() {
        const results = outputs.map(o => o.outputAsObj)
                               .filter(o => tier in o)
                               .map(o => o[tier]);
        expect(results).to.contain(target);
    });
}


describe('Literal component text:hello, generating', function() {
    const outputs = Array.from(hello.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Sequence component text:hello+test:world, generating', function() {
    const outputs = Array.from(helloworld.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Sequence component text:hello+text:,+test:world, generating', function() {
    const outputs = Array.from(helloCommaWorld.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Nested sequence component (text:hello+text:,)+test:world, generating', function() {
    const outputs = Array.from(helloCommaWorldLeft.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Nested sequence component text:hello+(text:,+test:world), generating', function() {
    const outputs = Array.from(helloCommaWorldRight.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "hello, world");
}); 


describe('Alt component text:hello|text:goodbye, generating', function() {
    const outputs = Array.from(hellogoodbye.run());
    testNumResults(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+test:world, generating', function() {
    const outputs = Array.from(hellogoodbyeworld.run());
    testNumResults(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 

describe('Symbol containing text:hello', function() {
    const outputs = Array.from(helloSymbol.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Symbol containing text:hello+text:world', function() {
    const outputs = Array.from(helloWorldSymbol.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 


describe('Symbol containing text:hello|text:goodbye, generating', function() {
    const outputs = Array.from(helloGoodbyeSymbol.run());
    testNumResults(outputs, 2);
    testHasOutput(outputs, "text", "hello");
    testHasOutput(outputs, "text", "goodbye");
}); 


describe('Symbol containing: (text:hello|text:goodbye)+test:world, generating', function() {
    const outputs = Array.from(helloGoodbyeSymbolWorld.run());
    testNumResults(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 

describe('Composing t1:hi x t1:hi+t2:bye', function() {
    const outputs = Array.from(composeTest1.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Composing (t1:hi x t1:hi+t2:bye) x t2:bye+t3:yo', function() {
    const outputs = Array.from(composeTest2.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Composing two sequences', function() {
    const outputs = Array.from(composeTest4.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t2", "byebye");
}); 

describe('Symbol of (t1:hi x t1:hi+t2:bye)', function() {
    const outputs = Array.from(hi2byeSymbol.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t2", "bye");
}); 

describe('Composing t1:hi x (t1:hi+t2:bye x t2:bye+t3:yo)', function() {
    const outputs = Array.from(composeTest3.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 


describe('Composing sym(t1:hi x t1:hi+t2:bye) x t2:bye+t3:yo', function() {
    const outputs = Array.from(composeSymbolTest.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Composing t1:hi x sym(t1:hi+t2:bye x t2:bye+t3:yo)', function() {
    const outputs = Array.from(composeSymbolTest2.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t3", "yo");
}); 

describe('Sequence of (t1:hi x t1:hi+t2:bye)+t2:world', function() {
    const outputs = Array.from(compositionWithSuffix.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 

describe('Sequence of sym(t1:hi x t1:hi+t2:bye)+t2:world', function() {
    const outputs = Array.from(symbolCompositionWithSuffix.run());
    testNumResults(outputs, 1);
    testHasOutput(outputs, "t2", "byeworld");
}); 
