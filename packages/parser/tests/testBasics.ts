
import { Epsilon, Seq, Uni } from "../src/stateMachine";
import { text, t1, t2, unrelated, testHasTapes, testHasVocab, testGenerateAndSample } from './testUtils';

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Literal text:hello', function() {
        const grammar = text("hello");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });
    
    describe('Literal text:""', function() {
        const grammar = text("");
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 0});
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Just ε', function() {
        const grammar = Epsilon();
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Sequence text:hello+test:world', function() {
        const grammar = Seq(text("hello"), text("world"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 7});
        testGenerateAndSample(grammar, [{text: "helloworld"}]);
    });

    describe('Empty sequence', function() {
        const grammar = Seq();
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('Sequence of one ε', function() {
        const grammar = Seq(Epsilon());
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('ε+ε', function() {
        const grammar = Seq(Epsilon(), Epsilon());
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('text:hello+Seq()', function() {
        const grammar = Seq(text("hello"), Seq());
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });
    
    
    describe('Seq()+text:hello', function() {
        const grammar = Seq(Seq(), text("hello"));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('text:hello+Seq(ε)', function() {
        const grammar = Seq(text("hello"), Seq(Epsilon()));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });
    
    describe('text:hello+(ε+ε)', function() {
        const grammar = Seq(text("hello"), Seq(Epsilon(), Epsilon()));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Sequence text:hello+test:""', function() {
        const grammar = Seq(text("hello"), text(""));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Sequence test:""+text:hello', function() {
        const grammar = Seq(text(""), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Sequence text:hello+ε', function() {
        const grammar = Seq(text("hello"), Epsilon());
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Sequence ε+text:hello', function() {
        const grammar = Seq(Epsilon(), text("hello"));
        testGenerateAndSample(grammar, [{text: "hello"}]);
    });

    describe('Sequence text:hello+ε+world', function() {
        const grammar = Seq(text("hello"), Epsilon(), text("world"));
        testGenerateAndSample(grammar, [{text: "helloworld"}]);
    });

    describe('Sequence text:hello+ε+ε+world', function() {
        const grammar = Seq(text("hello"), Epsilon(), Epsilon(), text("world"));
        testGenerateAndSample(grammar, [{text: "helloworld"}]);
    });

    describe('Sequence text:ab+text:cd+test:ef', function() {
        const grammar = Seq(text("ab"), text("cd"), text("ef"));
        testGenerateAndSample(grammar, [{text: "abcdef"}]);
    });
    
    describe('Nested sequence (text:ab+text:cd)+test:ef', function() {
        const grammar = Seq(Seq(text("ab"), text("cd")), text("ef"));
        testGenerateAndSample(grammar, [{text: "abcdef"}]);
    });

    describe('Nested sequence text:ab+(text:cd+text:ef)', function() {
        const grammar = Seq(text("ab"), Seq(text("cd"), text("ef")));
        testGenerateAndSample(grammar, [{text: "abcdef"}]);
    });

    describe('Nested sequence text:ab+(text:cd)+text:ef', function() {
        const grammar = Seq(text("ab"), Seq(text("cd")), text("ef"));
        testGenerateAndSample(grammar, [{text: "abcdef"}]);
    });

    describe('text:hi+unrelated:yo', function() {
        const grammar = Seq(text("hi"), unrelated("yo"));
        testHasTapes(grammar, ["text", "unrelated"]);
        testHasVocab(grammar, {text: 2, unrelated: 2});
        testGenerateAndSample(grammar, [{text: "hi", unrelated: "yo"}]);
    });

    describe('Alt text:hello|text:goodbye', function() {
        const grammar = Uni(text("hello"), text("goodbye"));
        testGenerateAndSample(grammar, [{text: "hello"},
                              {text: "goodbye"}]);
    });

    describe('Alt text:hello|ε', function() {
        const grammar = Uni(text("hello"), Epsilon());
        testGenerateAndSample(grammar, [{text: "hello"},
                              {}]);
    });

    describe('text:hello + (text:world|ε)', function() {
        const grammar = Seq(text("hello"), Uni(text("world"), Epsilon()));
        testGenerateAndSample(grammar, [{text: "hello"},
                                        {text: "helloworld"}]);
    });

    
    describe('(text:hello|ε) + text:world', function() {
        const grammar = Seq(Uni(text("hello"), Epsilon()), text("world"));
        testGenerateAndSample(grammar, [{text: "world"},
                                        {text: "helloworld"}]);
    });

    describe('Alt of different tapes: t1:hello|t2:goodbye', function() {
        const grammar = Uni(t1("hello"), t2("goodbye"));
        testHasTapes(grammar, ["t1", "t2"]);
        testHasVocab(grammar, {t1: 4, t2: 6});
        testGenerateAndSample(grammar, [{t1: "hello"},
                              {t2: "goodbye"}]);
    });


    describe('Alt of sequences', function() {

        const grammar = Uni(Seq(t1("hello"), t2("kitty")),
                            Seq(t1("goodbye"), t2("world")));
        testGenerateAndSample(grammar, [
            { t1: "hello", t2: "kitty" },
            { t1: "goodbye", t2: "world" }
        ]);
    });


    describe('Sequence with alt: (text:hello|text:goodbye)+text:world', function() {
        const grammar = Seq(Uni(text("hello"), text("goodbye")), text("world"));
        testGenerateAndSample(grammar, [{text: "helloworld"},
                              {text: "goodbyeworld"}]);
    });

    describe('Sequence with alt: text:say+(text:hello|text:goodbye)', function() {
        const grammar = Seq(text("say"), Uni(text("hello"), text("goodbye")));
        testGenerateAndSample(grammar, [{text: "sayhello"},
                              {text: "saygoodbye"}]);
    });

    describe('Sequence with alt: (text:hello|text:goodbye)+(text:world|text:kitty)', function() {
        const grammar = Seq(Uni(text("hello"), text("goodbye")), Uni(text("world"), text("kitty")));
        testGenerateAndSample(grammar, [{text: "helloworld"},
                              {text: "goodbyeworld"},
                              {text: "hellokitty"},
                              {text: "goodbyekitty"}]);
    });

    describe('Empty union', function() {
        const grammar = Uni();
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, []);
    });

    describe('Union of one ε', function() {
        const grammar = Uni(Epsilon());
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('ε|ε', function() {
        const grammar = Uni(Epsilon(), Epsilon());
        testHasTapes(grammar, []);
        testGenerateAndSample(grammar, [{}]);
    });

    describe('text(hello)+(ε|ε)', function() {
        const grammar = Seq(text("hello"), Uni(Epsilon(), Epsilon()));
        testHasTapes(grammar, ["text"]);
        testHasVocab(grammar, {text: 4});
        testGenerateAndSample(grammar, [{text: "hello"}]);
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
});
