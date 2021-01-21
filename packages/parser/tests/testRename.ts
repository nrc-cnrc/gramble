import { Rename, Seq, Join } from "../src/stateMachine";
import { t1, t2, t3, testHasTapes, testHasVocab, testHasNoVocab, testGrammar } from "./testUtils";

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Rename(t2/t1) of t1:hello', function() {
        const grammar = Rename(t1("hello"), "t1", "t2");
        testHasTapes(grammar, ["t2"]);
        testHasNoVocab(grammar, "t1");
        testHasVocab(grammar, {t2: 4});
        testGrammar(grammar, [{t2: "hello"}]);
    });

    // Actually this one's pretty iffy, not sure what the answer should be.
    describe('Rename(t2/t1) of t1:hello+t2:foo', function() {
        const grammar = Rename(Seq(t1("hello"), t2("foo")), "t1", "t2");
        testGrammar(grammar, [{t2: "hellofoo"}]);
    });
        
    describe('rename(t1:hello+unrelated:foo) from t1 to t2', function() {
        const grammar = Rename(Seq(t1("hello"), t3("foo")), "t1", "t2");
        testHasTapes(grammar, ["t2", "t3"]);
        testHasVocab(grammar, {"t2": 4, "t3": 2});
        testHasNoVocab(grammar, "t1");
        testGrammar(grammar, [{t2: "hello", t3: "foo"}]);
    });

    describe('Joining t2:hello & rename(t2/t1, t1:hello))', function() {
        const grammar = Join(t2("hello"),
                             Rename(t1("hello"), "t1", "t2"));
        testGrammar(grammar, [{t2: "hello"}]);
    });

    describe('Joining rename(t2/t1, t1:hello)) & t2:hello', function() {
        const grammar = Join(Rename(t1("hello"), "t1", "t2"),
                             t2("hello"));
        testGrammar(grammar, [{t2: "hello"}]);
    });

    describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t2:hello', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                             t2("hello"));
        testGrammar(grammar, [{t2: "hello", t3: "foo"}]);
    });

    describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t2:hello+t3:bar', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"),
                             Seq(t2("hello"), t3("bar")));
        testGrammar(grammar, []);
    });

    describe('Joining t2:hello+t3:bar & rename(t2/t1, t1:hello+t3:foo))', function() {
        const grammar = Join(Seq(t2("hello"), t3("bar")),
                             Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        testGrammar(grammar, []);
    });

});
