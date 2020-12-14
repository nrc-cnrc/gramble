import { Seq, Uni, Join, Emb, Proj, Rep, Not } from "../src/stateMachine";
import { text, testNumOutputs, testHasOutput, t1, t2, t3, unrelated, testDoesntHaveOutput } from './testUtils';
import { NegationState } from "../src/stateMachine";

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Join(t1:foo & ~t1:hello)', function() {
        const outputs = [...Join(t1("foo"), Not(t1("hello"))).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "foo");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Join(t1:hello & ~t1:hello)', function() {
        const outputs = [...Join(t1("hello"), Not(t1("hello"))).generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Join(t1:hell & ~t1:hello)', function() {
        const outputs = [...Join(t1("hell"), Not(t1("hello"))).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "hell");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Join(t1:helloo & ~t1:hello)', function() {
        const outputs = [...Join(t1("helloo"), Not(t1("hello"))).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "helloo");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Join(~t1:hello & t1:foo)', function() {
        const outputs = [...Join(Not(t1("hello")), t1("foo")).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "foo");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Join(~t1:hello & t1:hell)', function() {
        const outputs = [...Join(Not(t1("hello")), t1("hell")).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "hell");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Join(~t1:hello & t1:helloo)', function() {
        const outputs = [...Join(Not(t1("hello")), t1("helloo")).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "helloo");
        testDoesntHaveOutput(outputs, "t1", "hello");
    });

    describe('Join(t1:foo & ~(t1:hello|t1:world)', function() {
        const outputs = [...Join(t1("foo"), Not(Uni(t1("hello"), t1("world")))).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "foo");
        testDoesntHaveOutput(outputs, "t1", "hello");
        testDoesntHaveOutput(outputs, "t1", "world");
    });

    describe('Join(t1:hello & ~(t1:hello|t1:world)', function() {
        const outputs = [...Join(t1("hello"), Not(Uni(t1("hello"), t1("world")))).generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Join(t1:world & ~(t1:hello|t1:world)', function() {
        const outputs = [...Join(t1("world"), Not(Uni(t1("hello"), t1("world")))).generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Join(~(t1:hello|t1:world) & t1:foo)', function() {
        const outputs = [...Join(Not(Uni(t1("hello"), t1("world"))), t1("foo")).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "foo");
        testDoesntHaveOutput(outputs, "t1", "hello");
        testDoesntHaveOutput(outputs, "t1", "world");
    });

    describe('Join(~(t1:hello|t1:world) & t1:hello)', function() {
        const outputs = [...Join(Not(Uni(t1("hello"), t1("world"))), t1("hello")).generate()];
        testNumOutputs(outputs, 0);
    });

    describe('Join(~(t1:hello|t1:help) & t1:hello)', function() {
        const outputs = [...Join(Not(Uni(t1("hello"), t1("help"))), t1("hello")).generate()];
        testNumOutputs(outputs, 0);
    });

    describe('~(~t1:hello)', function() {
        const outputs = [...Not(Not(t1("hello"))).generate()];
        testNumOutputs(outputs, 1);
        testHasOutput(outputs, "t1", "hello");
    });

});
