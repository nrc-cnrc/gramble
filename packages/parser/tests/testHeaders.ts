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
import { testHeaderID, testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Testing header IDs', function() {
        testHeaderID("text", "text");
        testHeaderID("embed", "embed");
        testHeaderID("EMBED", "embed");
        testHeaderID("hide", "hide");
        testHeaderID("%text", "%");
        testHeaderID("% text", "%");
        testHeaderID("%", "%");
        testHeaderID("(text)", "text");
        testHeaderID("(text", "ERR");
        testHeaderID("text)", "ERR");
        testHeaderID("text/gloss", "SLASH[text,gloss]");
        testHeaderID("(text/gloss)", "SLASH[text,gloss]");
        testHeaderID("(text)/(gloss)", "SLASH[text,gloss]");
        testHeaderID("text/", "ERR");
        testHeaderID("/text", "ERR");
        testHeaderID("maybe text", "MAYBE[text]");
        testHeaderID("maybe", "ERR");
        testHeaderID("text maybe", "ERR");
        testHeaderID("maybe/text", "ERR");
        testHeaderID("maybe(text)", "MAYBE[text]");
        testHeaderID("(maybe text)", "MAYBE[text]");
        testHeaderID("maybetext", "maybetext");
        testHeaderID("pre text", "pre:text");
        testHeaderID("post text", "post:text");
        testHeaderID("from text", "from:text");
        testHeaderID("to text", "to:text");
        testHeaderID("pre(text)", "pre:text");
        testHeaderID("(pre text)", "pre:text");
        testHeaderID("blarg text", "ERR");
        testHeaderID("re text", "RE[text]");
        testHeaderID("re text/gloss", "RE[SLASH[text,gloss]]"); // erroneous but parseable
        testHeaderID("equals text", "EQUALS[text]");
        testHeaderID("equals re text", "EQUALS[RE[text]]");
        testHeaderID("starts text", "STARTS[text]");
        testHeaderID("ends text", "ENDS[text]");
        testHeaderID("contains text", "CONTAINS[text]");
        testHeaderID("text/gloss/root", "SLASH[text,SLASH[gloss,root]]");
        testHeaderID("(text/gloss)/root", "SLASH[SLASH[text,gloss],root]");
    });
});