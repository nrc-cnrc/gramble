import { 
    parseHeaderCell, 
    SlashHeader, 
    CommentHeader, 
    //JoinHeader, 
    MaybeHeader, 
    HideHeader, 
    LiteralHeader, 
    EmbedHeader, 
    EqualsHeader, 
    EndsWithHeader, 
    StartsWithHeader, 
    ContainsHeader
} from "../src/headers";

import * as path from 'path';
import { expect } from "chai";
import { testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Header "text"', function() {
        const header = parseHeaderCell("text");
        testIsType(header, LiteralHeader);
    });
    
    describe('Header "embed"', function() {
        const header = parseHeaderCell("embed");
        testIsType(header, EmbedHeader);
    });

    
    describe('Header "EMBED"', function() {
        const header = parseHeaderCell("EMBED");
        testIsType(header, EmbedHeader);
    });

    describe('Header "drop"', function() {
        const header = parseHeaderCell("hide");
        testIsType(header, HideHeader);
    });

    describe('Header "%text"', function() {
        const header = parseHeaderCell("%text");
        testIsType(header, CommentHeader);
    });

    describe('Header "% text"', function() {
        const header = parseHeaderCell("% text");
        testIsType(header, CommentHeader);
    });

    
    describe('Header "%"', function() {
        const header = parseHeaderCell("%");
        testIsType(header, CommentHeader);
    });

    
    describe('Header "(text)"', function() {
        const header = parseHeaderCell("(text)");
        testIsType(header, LiteralHeader);
    });

    
    describe('Header "(text"', function() {
        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('(text')).to.throw;
        });
    });

    describe('Header "text)"', function() {
        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('text)')).to.throw;
        });
    });


    describe('Header "maybe text"', function() {
        const header = parseHeaderCell("maybe text");
        testIsType(header, MaybeHeader);

        if (!(header instanceof MaybeHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "maybe(text)"', function() {
        const header = parseHeaderCell("maybe(text)");
        testIsType(header, MaybeHeader);

        if (!(header instanceof MaybeHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "(maybe text)"', function() {
        const header = parseHeaderCell("(maybe text)");
        testIsType(header, MaybeHeader);

        if (!(header instanceof MaybeHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });

    
    describe('Header "blarg text"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('blarg text')).to.throw;
        });

    });

    /*
    describe('Header "@text"', function() {
        const header = parseHeaderCell("@text");

        testIsType(header, JoinHeader);

        if (!(header instanceof JoinHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "@(text)"', function() {
        const header = parseHeaderCell("@(text)");

        testIsType(header, JoinHeader);

        if (!(header instanceof JoinHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    
    describe('Header "(@text)"', function() {
        const header = parseHeaderCell("(@text)");

        testIsType(header, JoinHeader);

        if (!(header instanceof JoinHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
        testHeaderHasText(header.child, "text", "child");
    });

    */
    
    
    describe('Header "equals text"', function() {
        const header = parseHeaderCell("equals text");

        testIsType(header, EqualsHeader);

        if (!(header instanceof EqualsHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });

    /*
    describe('Header "equals @text"', function() {
        const header = parseHeaderCell("equals @text");

        testIsType(header, EqualsHeader);

        if (!(header instanceof EqualsHeader)) {
            return;
        }

        testIsType(header.child, JoinHeader, "child");
        testHeaderHasText(header.child, "@", "child");
    }); */

    
    describe('Header "startswith text"', function() {
        const header = parseHeaderCell("startswith text");

        testIsType(header, StartsWithHeader);

        if (!(header instanceof StartsWithHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });
    
    
    describe('Header "endswith text"', function() {
        const header = parseHeaderCell("endswith text");

        testIsType(header, EndsWithHeader);

        if (!(header instanceof EndsWithHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "contains text"', function() {
        const header = parseHeaderCell("contains text");

        testIsType(header, ContainsHeader);

        if (!(header instanceof ContainsHeader)) {
            return;
        }

        testIsType(header.child, LiteralHeader, "child");
    });

    describe('Header "text/gloss"', function() {
        const header = parseHeaderCell("text/gloss");

        testIsType(header, SlashHeader);

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        
        testIsType(header.child2, LiteralHeader, "child2");
    });

    
    describe('Header "(text)/(gloss)"', function() {
        const header = parseHeaderCell("(text)/(gloss)");

        testIsType(header, SlashHeader);

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        
        testIsType(header.child2, LiteralHeader, "child2");
    });

    describe('Header "(text/gloss)"', function() {
        const header = parseHeaderCell("(text/gloss)");

        testIsType(header, SlashHeader);

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        
        testIsType(header.child2, LiteralHeader, "child2");
    });
    
    describe('Header "/text"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('/text')).to.throw;
        });

    });

    
    describe('Header "text/"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('/text')).to.throw;
        });

    });

    
    describe('Header "maybe"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('maybe')).to.throw;
        });

    });

    
    describe('Header "@"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('@')).to.throw;
        });

    });

    
    describe('Header "maybe/text"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('maybe/text')).to.throw;
        });

    });

    describe('Header "text maybe"', function() {

        it ("should fail to parse", function() {
            expect(parseHeaderCell.bind('text maybe')).to.throw;
        });

    });


    
    describe('Header "text/gloss/root"', function() {
        const header = parseHeaderCell("text/gloss/root");

        testIsType(header, SlashHeader);

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, LiteralHeader, "child1");
        testIsType(header.child2, SlashHeader, "child2");

        if (!(header.child2 instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child2.child1, LiteralHeader, "child2.child1");
        testIsType(header.child2.child2, LiteralHeader, "child2.child2");
    });

    
    
    describe('Header "(text/gloss)/root"', function() {
        const header = parseHeaderCell("(text/gloss)/root");

        testIsType(header, SlashHeader);

        if (!(header instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1, SlashHeader, "child1");
        testIsType(header.child2, LiteralHeader, "child2");

        if (!(header.child1 instanceof SlashHeader)) {
            return;
        }

        testIsType(header.child1.child1, LiteralHeader, "child2.child1");
        testIsType(header.child1.child2, LiteralHeader, "child2.child2");
    });
});