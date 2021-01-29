import { constructHeader, SlashHeader, CommentHeader, FlagHeader, MaybeHeader, NotHeader, LiteralHeader, EmbedHeader } from "../src/sheetParser";

import * as path from 'path';
import { expect } from "chai";
import { testHeaderHasText, testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Header "text"', function() {
        const header = constructHeader("text");

        testIsType(header, LiteralHeader);
        testHeaderHasText(header, "text");
    });
    
    describe('Header "embed"', function() {
        const header = constructHeader("embed");

        testIsType(header, EmbedHeader);
        testHeaderHasText(header, "embed");
    });

    describe('Header "%text"', function() {
        const header = constructHeader("%text");

        testIsType(header, CommentHeader);
        testHeaderHasText(header, "%");
    });

    describe('Header "% text"', function() {
        const header = constructHeader("% text");

        testIsType(header, CommentHeader);
        testHeaderHasText(header, "%");
    });

    
    describe('Header "%"', function() {
        const header = constructHeader("%");

        testIsType(header, CommentHeader);
        testHeaderHasText(header, "%");
    });

    
    describe('Header "(text)"', function() {
        const header = constructHeader("(text)");
        testIsType(header, LiteralHeader);
        testHeaderHasText(header, "text");
    });

    
    describe('Header "(text"', function() {
        it ("should fail to parse", function() {
            expect(constructHeader.bind('(text')).to.throw;
        });
    });

    describe('Header "text)"', function() {
        it ("should fail to parse", function() {
            expect(constructHeader.bind('text)')).to.throw;
        });
    });


    describe('Header "maybe text"', function() {
        const header = constructHeader("maybe text");

        testIsType(header, MaybeHeader);
        testHeaderHasText(header, "maybe");

        if (!(header instanceof MaybeHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "not text"', function() {
        const header = constructHeader("not text");

        testIsType(header, NotHeader);
        testHeaderHasText(header, "not");

        if (!(header instanceof NotHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "not(text)"', function() {
        const header = constructHeader("not(text)");

        testIsType(header, NotHeader);
        testHeaderHasText(header, "not");

        if (!(header instanceof NotHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });
    
    describe('Header "(not text)"', function() {
        const header = constructHeader("(not text)");

        testIsType(header, NotHeader);
        testHeaderHasText(header, "not");

        if (!(header instanceof NotHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "blarg text"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('blarg text')).to.throw;
        });

    });

    
    describe('Header "@text"', function() {
        const header = constructHeader("@text");

        testIsType(header, FlagHeader);
        testHeaderHasText(header, "@");

        if (!(header instanceof FlagHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "@(text)"', function() {
        const header = constructHeader("@(text)");

        testIsType(header, FlagHeader);
        testHeaderHasText(header, "@");

        if (!(header instanceof FlagHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "(@text)"', function() {
        const header = constructHeader("(@text)");

        testIsType(header, FlagHeader);
        testHeaderHasText(header, "@");

        if (!(header instanceof FlagHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });
    
    describe('Header "text/gloss"', function() {
        const header = constructHeader("text/gloss");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        testHeaderHasText(header.child1, "text", "child1");
        
        testIsType(header.child2, LiteralHeader, "child2");
        testHeaderHasText(header.child2, "gloss", "child2");
    });

    
    describe('Header "(text)/(gloss)"', function() {
        const header = constructHeader("(text)/(gloss)");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        testHeaderHasText(header.child1, "text", "child1");
        
        testIsType(header.child2, LiteralHeader, "child2");
        testHeaderHasText(header.child2, "gloss", "child2");
    });

    
    describe('Header "(text/gloss)"', function() {
        const header = constructHeader("(text/gloss)");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        testHeaderHasText(header.child1, "text", "child1");
        
        testIsType(header.child2, LiteralHeader, "child2");
        testHeaderHasText(header.child2, "gloss", "child2");
    });
    
    describe('Header "/text"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('/text')).to.throw;
        });

    });

    
    describe('Header "text/"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('/text')).to.throw;
        });

    });

    
    describe('Header "maybe"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('maybe')).to.throw;
        });

    });

    
    describe('Header "@"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('@')).to.throw;
        });

    });

    
    describe('Header "maybe/text"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('maybe/text')).to.throw;
        });

    });

    describe('Header "text maybe"', function() {

        it ("should fail to parse", function() {
            expect(constructHeader.bind('text maybe')).to.throw;
        });

    });


    
    describe('Header "text/gloss/root"', function() {
        const header = constructHeader("text/gloss/root");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        testHeaderHasText(header.child1, "text", "child1");
        testIsType(header.child2, SlashHeader, "child2");
        testHeaderHasText(header.child2, "/", "child2");

        if (!(header.child2 instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child2.child1, LiteralHeader, "child2.child1");
        testHeaderHasText(header.child2.child1, "gloss", "child2.child1");
        testIsType(header.child2.child2, LiteralHeader, "child2.child2");
        testHeaderHasText(header.child2.child2, "root", "child2.child2");
    });

    
    
    describe('Header "(text/gloss)/root"', function() {
        const header = constructHeader("(text/gloss)/root");

        testIsType(header, SlashHeader);
        testHeaderHasText(header, "/");

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, SlashHeader, "child1");
        testHeaderHasText(header.child1, "/", "child1");
        testIsType(header.child2, LiteralHeader, "child2");
        testHeaderHasText(header.child2, "root", "child2");

        if (!(header.child1 instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1.child1, LiteralHeader, "child2.child1");
        testHeaderHasText(header.child1.child1, "text", "child2.child1");
        testIsType(header.child1.child2, LiteralHeader, "child2.child2");
        testHeaderHasText(header.child1.child2, "gloss", "child2.child2");
    });
});