import { Seq, Uni, Join, Semijoin, Any } from "../src/stateMachine";
import { text, unrelated, testParse } from './testUtils';

import * as path from 'path';

/*
 * These are all simple tests that roughly appear elsewhere, but since the .parse() function
 * is potentially dicey w.r.t. compilation (because it's joining an uncompiled state with
 * a compiled state) we want some extra tests of it to make sure.
 */
describe(`${path.basename(module.filename)}`, function() {

    describe('text:hello, parsing text:hello', function() {
        const grammar = text("hello");
        const inputs = {text: "hello"};
        testParse(grammar, inputs, [{text: "hello"}]);
    });

    
    describe('text:hello, parsing text:blorp', function() {
        const grammar = text("hello");
        const inputs = {text: "blorp"};
        testParse(grammar, inputs, []);
    });

    describe('text:hello, parsing unrelated:foo', function() {
        const grammar = text("hello");
        const inputs = {unrelated: "foo"};
        testParse(grammar, inputs, []);
    });

    describe('text:hello+text:.*, parsing text:hellog', function() {
        const grammar = Seq(text("hello"), Any("text"));
        const inputs = {text: "hellog"};
        testParse(grammar, inputs, [{text: "hellog"}]);
    });

    describe('text:hello, parsing unrelated:foo, text:hello ', function() {
        const grammar = text("hello");
        const inputs = {text: "hello", unrelated: "foo"};
        testParse(grammar, inputs, []);
    });

    describe('text:hello+unrelated:foo, parsing text:hello', function() {
        const grammar = Seq(text("hello"), unrelated("foo"));
        const inputs = {text: "hello"};
        testParse(grammar, inputs, [{text: "hello", unrelated: "foo"}]);
    });

});