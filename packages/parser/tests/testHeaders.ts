import { parseHeader, AtomicHeader, SlashHeader, UnaryHeader, CommentHeader, FlagHeader } from "../src/headerParser";


import * as path from 'path';
import { expect } from "chai";
import { testHeaderHasText, testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Header "text"', function() {
        const header = parseHeader("text");

        testIsType(header, AtomicHeader);
        testHeaderHasText(header, "text");
    });

    describe('Header "%text"', function() {
        const header = parseHeader("%text");

        testIsType(header, CommentHeader);
        testHeaderHasText(header, "%");
    });

    describe('Header "% text"', function() {
        const header = parseHeader("% text");

        testIsType(header, CommentHeader);
        testHeaderHasText(header, "%");
    });

    describe('Header "maybe text"', function() {
        const header = parseHeader("maybe text");

        testIsType(header, UnaryHeader);
        testHeaderHasText(header, "maybe");

        if (!(header instanceof UnaryHeader)) {
            return;
        }

        testIsType(header.child, AtomicHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "not text"', function() {
        const header = parseHeader("not text");

        testIsType(header, UnaryHeader);
        testHeaderHasText(header, "not");

        if (!(header instanceof UnaryHeader)) {
            return;
        }

        testIsType(header.child, AtomicHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "blarg text"', function() {

        it ("should throw an error", function() {
            expect(parseHeader.bind('blarg text')).to.throw;
        });

    });

    
    describe('Header "@text"', function() {
        const header = parseHeader("@text");

        testIsType(header, FlagHeader);
        testHeaderHasText(header, "@");

        if (!(header instanceof FlagHeader)) {
            return;
        }

        testIsType(header.child, AtomicHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });
    
    describe('Header "text/gloss"', function() {
        const header = parseHeader("text/gloss");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, AtomicHeader, "child1");
        testHeaderHasText(header.child1, "text", "child1");
        
        testIsType(header.child2, AtomicHeader, "child2");
        testHeaderHasText(header.child2, "gloss", "child2");
    });

    
    describe('Header "text/gloss/root"', function() {
        const header = parseHeader("text/gloss/root");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, AtomicHeader, "child1");
        testHeaderHasText(header.child1, "text", "child1");
        testIsType(header.child2, SlashHeader, "child2");
        testHeaderHasText(header.child2, "/", "child2");

        if (!(header.child2 instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child2.child1, AtomicHeader, "child2.child1");
        testHeaderHasText(header.child2.child1, "gloss", "child2.child1");
        testIsType(header.child2.child2, AtomicHeader, "child2.child2");
        testHeaderHasText(header.child2.child2, "root", "child2.child2");
    });
});