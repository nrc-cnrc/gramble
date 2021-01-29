
import { Empty, Seq, Uni } from "../src/stateMachine";
import { text, t1, t2, unrelated, testHasTapes, testHasVocab, testGrammar } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    
    describe('Literal text:hello', function() {
        const grammar = text("hello");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Sequence text:hello+test:world', function() {
        const grammar = Seq(text("hello"), text("world"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 7});
        testGrammar(grammar, [{text: "helloworld"}]);
    });

    describe('Sequence text:hello+test:""', function() {
        const grammar = Seq(text("hello"), text(""));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Sequence test:""+text:hello', function() {
        const grammar = Seq(text(""), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    
    describe('Sequence text:hello+0', function() {
        const grammar = Seq(text("hello"), Empty());
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Sequence 0+text:hello', function() {
        const grammar = Seq(Empty(), text("hello"));
        testGrammar(grammar, [{text: "hello"}]);
    });

    describe('Sequence text:hello+text:,+test:world', function() {
        const grammar = Seq(text("hello"), text(", "), text("world"));
        testGrammar(grammar, [{text: "hello, world"}]);
    });

    describe('Nested sequence (text:hello+text:,)+test:world', function() {
        const grammar = Seq(Seq(text("hello"), text(", ")), text("world"));
        testGrammar(grammar, [{text: "hello, world"}]);
    });

    describe('Nested sequence text:hello+(text:,+test:world)', function() {
        const grammar = Seq(text("hello"), Seq(text(", "), text("world")));
        testGrammar(grammar, [{text: "hello, world"}]);
    });

    describe('Nested sequence text:hello+(text:,)+text:world', function() {
        const grammar = Seq(text("hello"), Seq(text(", ")), text("world"));
        testGrammar(grammar, [{text: "hello, world"}]);
    });

    describe('text:hello+unrelated:foo', function() {
        const grammar = Seq(text("hello"), unrelated("foo"));
        testHasTapes(grammar, ["text", "unrelated"]);
        testHasVocab(grammar, {text: 4, unrelated: 2});
        testGrammar(grammar, [{text: "hello", unrelated: "foo"}]);
    });

    describe('Alt text:hello|text:goodbye', function() {
        const grammar = Uni(text("hello"), text("goodbye"));
        testGrammar(grammar, [{text: "hello"},
                              {text: "goodbye"}]);
    });

    describe('Alt text:hello|0', function() {
        const grammar = Uni(text("hello"), Empty());
        testGrammar(grammar, [{text: "hello"},
                              {}]);
    });

    describe('Alt of different tiers: t1:hello|t2:goodbye', function() {
        const grammar = Uni(t1("hello"), t2("goodbye"));
        testHasTapes(grammar, ["t1", "t2"]);
        testHasVocab(grammar, {t1: 4, t2: 6});
        testGrammar(grammar, [{t1: "hello"},
                              {t2: "goodbye"}]);
    });

    describe('Sequence with alt: (text:hello|text:goodbye)+text:world', function() {
        const grammar = Seq(Uni(text("hello"), text("goodbye")), text("world"));
        testGrammar(grammar, [{text: "helloworld"},
                              {text: "goodbyeworld"}]);
    });

    describe('Sequence with alt: text:say+(text:hello|text:goodbye)', function() {
        const grammar = Seq(text("say"), Uni(text("hello"), text("goodbye")));
        testGrammar(grammar, [{text: "sayhello"},
                              {text: "saygoodbye"}]);
    });

    describe('Sequence with alt: (text:hello|text:goodbye)+(text:world|text:kitty)', function() {
        const grammar = Seq(Uni(text("hello"), text("goodbye")), Uni(text("world"), text("kitty")));
        testGrammar(grammar, [{text: "helloworld"},
                              {text: "goodbyeworld"},
                              {text: "hellokitty"},
                              {text: "goodbyekitty"}]);
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
    });
    */

});
