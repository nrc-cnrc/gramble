import { 
    parseHeaderCell, 
    SlashHeader, 
    CommentHeader, 
    MaybeHeader, 
    HideHeader, 
    LiteralHeader, 
    EmbedHeader, 
    EqualsHeader, 
    EndsWithHeader, 
    StartsWithHeader, 
    ContainsHeader,
    TagHeader,
    ErrorHeader,
    RegexHeader
} from "../src/headers";

import * as path from 'path';
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
        const header = parseHeaderCell("(text");
        testIsType(header, ErrorHeader);
    });

    describe('Header "text)"', function() {
        const header = parseHeaderCell("text)");
        testIsType(header, ErrorHeader);
    });

    describe('Header "text/gloss"', function() {
        const header = parseHeaderCell("text/gloss");
        testIsType(header, SlashHeader);
        if (!(header instanceof SlashHeader)) { return; }
        testIsType(header.child1, LiteralHeader, "child1");
        testIsType(header.child2, LiteralHeader, "child2");
    });
    
    describe('Header "(text)/(gloss)"', function() {
        const header = parseHeaderCell("(text)/(gloss)");
        testIsType(header, SlashHeader);
        if (!(header instanceof SlashHeader)) { return; }
        testIsType(header.child1, LiteralHeader, "child1");
        testIsType(header.child2, LiteralHeader, "child2");
    });

    describe('Header "(text/gloss)"', function() {
        const header = parseHeaderCell("(text/gloss)");
        testIsType(header, SlashHeader);
        if (!(header instanceof SlashHeader)) { return; }
        testIsType(header.child1, LiteralHeader, "child1");
        testIsType(header.child2, LiteralHeader, "child2");
    });
    
    describe('Header "/text"', function() {
        const header = parseHeaderCell("/text");
        testIsType(header, ErrorHeader);
    });
    
    describe('Header "text/"', function() {
        const header = parseHeaderCell("text/");
        testIsType(header, ErrorHeader);
    });

    describe('Header "maybe text"', function() {
        const header = parseHeaderCell("maybe text");
        testIsType(header, MaybeHeader);
        if (!(header instanceof MaybeHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "maybe(text)"', function() {
        const header = parseHeaderCell("maybe(text)");
        testIsType(header, MaybeHeader);
        if (!(header instanceof MaybeHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "(maybe text)"', function() {
        const header = parseHeaderCell("(maybe text)");
        testIsType(header, MaybeHeader);
        if (!(header instanceof MaybeHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });

    describe('Header "pre text"', function() {
        const header = parseHeaderCell("pre text");
        testIsType(header, TagHeader);
        if (!(header instanceof TagHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "post text"', function() {
        const header = parseHeaderCell("pre text");
        testIsType(header, TagHeader);
        if (!(header instanceof TagHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "from text"', function() {
        const header = parseHeaderCell("pre text");
        testIsType(header, TagHeader);
        if (!(header instanceof TagHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "to text"', function() {
        const header = parseHeaderCell("pre text");
        testIsType(header, TagHeader);
        if (!(header instanceof TagHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "pre(text)"', function() {
        const header = parseHeaderCell("pre(text)");
        testIsType(header, TagHeader);
        if (!(header instanceof TagHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "(pre text)"', function() {
        const header = parseHeaderCell("(pre text)");
        testIsType(header, TagHeader);
        if (!(header instanceof TagHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "blarg text"', function() {
        const header = parseHeaderCell("blarg text");
        testIsType(header, ErrorHeader);
    });
    
    describe('Header "re text"', function() {
        const header = parseHeaderCell("re text");
        testIsType(header, RegexHeader);
        if (!(header instanceof RegexHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });

    describe('Header "re text/gloss"', function() {
        const header = parseHeaderCell("re text/gloss");
        testIsType(header, RegexHeader);
        if (!(header instanceof RegexHeader)) { return; }
        testIsType(header.child, SlashHeader, "child");
    });
    
    describe('Header "equals text"', function() {
        const header = parseHeaderCell("equals text");
        testIsType(header, EqualsHeader);
        if (!(header instanceof EqualsHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });

    describe('Header "equals re text"', function() {
        const header = parseHeaderCell("equals re text");
        testIsType(header, EqualsHeader);
        if (!(header instanceof EqualsHeader)) { return; }
        testIsType(header.child, RegexHeader, "child");
        if (!(header.child instanceof RegexHeader)) { return; }
        testIsType(header.child.child, LiteralHeader, "child's child");
    });    
    
    describe('Header "starts text"', function() {
        const header = parseHeaderCell("starts text");
        testIsType(header, StartsWithHeader);
        if (!(header instanceof StartsWithHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "ends text"', function() {
        const header = parseHeaderCell("ends text");
        testIsType(header, EndsWithHeader);
        if (!(header instanceof EndsWithHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "contains text"', function() {
        const header = parseHeaderCell("contains text");
        testIsType(header, ContainsHeader);
        if (!(header instanceof ContainsHeader)) { return; }
        testIsType(header.child, LiteralHeader, "child");
    });
    
    describe('Header "maybe"', function() {
        const header = parseHeaderCell("maybe");
        testIsType(header, ErrorHeader);
    });
    
    describe('Header "maybe/text"', function() {
        const header = parseHeaderCell("maybe/text");
        testIsType(header, ErrorHeader);
    });

    describe('Header "text maybe"', function() {
        const header = parseHeaderCell("text maybe");
        testIsType(header, ErrorHeader);
    });
    
    describe('Header "text/gloss/root"', function() {
        const header = parseHeaderCell("text/gloss/root");
        testIsType(header, SlashHeader);
        if (!(header instanceof SlashHeader)) { return; }
        testIsType(header.child1, LiteralHeader, "child1");
        testIsType(header.child2, SlashHeader, "child2");
        if (!(header.child2 instanceof SlashHeader)) { return; }
        testIsType(header.child2.child1, LiteralHeader, "child2.child1");
        testIsType(header.child2.child2, LiteralHeader, "child2.child2");
    });
    
    describe('Header "(text/gloss)/root"', function() {
        const header = parseHeaderCell("(text/gloss)/root");
        testIsType(header, SlashHeader);
        if (!(header instanceof SlashHeader)) { return; }
        testIsType(header.child1, SlashHeader, "child1");
        testIsType(header.child2, LiteralHeader, "child2");
        if (!(header.child1 instanceof SlashHeader)) { return; }
        testIsType(header.child1.child1, LiteralHeader, "child2.child1");
        testIsType(header.child1.child2, LiteralHeader, "child2.child2");
    });
});