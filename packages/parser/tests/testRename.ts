import { Rename, Seq, Join } from "../src/stateMachine";
import { t1, testNumOutputs, testHasOutput, testDoesntHaveOutput, t2, t3 } from "./testUtils";

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Rename(t2/t1) of t1:hello', function() {
        const outputs = [...Rename(t1("hello"), "t1", "t2").generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t2", "hello");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    /* Actually this one's pretty iffy, not sure what the answer should be.
    describe('Rename(t2/t1) of t1:hello+t2:foo', function() {
        const outputs = [...Rename(Seq(t1("hello"),t2("foo")), "t1", "t2").run()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t2", "hellofoo");
        testDoesntHaveOutput(outputs, "t1", "hello");
        testDoesntHaveOutput(outputs, "t2", "foo");
    });
    */

    describe('Rename(t2/t1) of t1:hello+t3:foo', function() {
        const outputs = [...Rename(Seq(t1("hello"),t3("foo")), "t1", "t2").generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t2", "hello");
        testHasOutput(outputs, "t3", "foo");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Joining t2:hello & rename(t2/t1, t1:hello))', function() {
        const grammar = Join(t2("hello"), Rename(t1("hello"), "t1", "t2"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t2", "hello");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Joining rename(t2/t1, t1:hello)) & t2:hello', function() {
        const grammar = Join(Rename(t1("hello"), "t1", "t2"), t2("hello"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t2", "hello");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t21:hello', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"), t2("hello"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t2", "hello");
        testHasOutput(outputs, "t3", "foo");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Joining rename(t2/t1, t1:hello+t3:foo)) & t2:hello+t3:bar', function() {
        const grammar = Join(Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"), Seq(t2("hello"), t3("bar")));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Joining t2:hello+t3:bar & rename(t2/t1, t1:hello+t3:foo))', function() {
        const grammar = Join(Seq(t2("hello"), t3("bar")), Rename(Seq(t1("hello"), t3("foo")), "t1", "t2"));
        const outputs = [...grammar.generate()];
        testNumOutputs(outputs, 0);
    });

});
