
import { Seq, Uni } from "../src/stateMachine";
import { text, testNumOutputs, testHasOutput, t1, t2, t3, unrelated, testDoesntHaveOutput } from './testUtils';


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

describe('Sequence text:hello+test:<empty>', function() {
    const grammar = Seq(text("hello"), text(""));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 

describe('Sequence test:<empty>+text:hello', function() {
    const grammar = Seq(text(""), text("hello"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
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


describe('Alt of different tiers: t1:hello|t2:goodbye', function() {
    const grammar = Uni(t1("hello"), t2("goodbye"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "t1", "hello");
    testHasOutput(outputs, "t2", "goodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+text:world', function() {
    const grammar = Seq(Uni(text("hello"), text("goodbye")), text("world"));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
}); 

describe('Sequence with alt: text:say+(text:hello|text:goodbye)', function() {
    const grammar = Seq(text("say"), Uni(text("hello"), text("goodbye")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 2);
    testHasOutput(outputs, "text", "sayhello");
    testHasOutput(outputs, "text", "saygoodbye");
}); 


describe('Sequence with alt: (text:hello|text:goodbye)+(text:world|text:kitty)', function() {
    const grammar = Seq(Uni(text("hello"), text("goodbye")), Uni(text("world"), text("kitty")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 4);
    testHasOutput(outputs, "text", "helloworld");
    testHasOutput(outputs, "text", "goodbyeworld");
    testHasOutput(outputs, "text", "hellokitty");
    testHasOutput(outputs, "text", "goodbyekitty");
}); 

/*
describe('Sequence with priority union: (text:hello|text:goodbye) | (text:world|text:kitty)', function() {
    const grammar = Seq(Pri(text("hello"), text("goodbye")), Pri(text("world"), text("kitty")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "helloworld");
}); 

describe('Joining to a priority union: text:hello & (text:hello|text:help)', function() {
    const grammar = Join(text("hello"), Pri(text("hello"), text("help")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); 


describe('Joining to a priority union: text:hello & (text:help|text:hello)', function() {
    const grammar = Join(text("hello"), Pri(text("help"), text("hello")));
    const outputs = [...grammar.run()];
    testNumOutputs(outputs, 1);
    testHasOutput(outputs, "text", "hello");
}); */