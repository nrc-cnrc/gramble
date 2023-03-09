import * as path from 'path';
import { testHeaderID, testIsType } from "./testUtil";

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
        testHeaderID("text/gloss", "slash[text,gloss]");
        testHeaderID("(text/gloss)", "slash[text,gloss]");
        testHeaderID("(text)/(gloss)", "slash[text,gloss]");
        testHeaderID("text/", "ERR");
        testHeaderID("/text", "ERR");
        testHeaderID("optional text", "optional[text]");
        testHeaderID("optional", "ERR");
        testHeaderID("text optional", "ERR");
        testHeaderID("optional/text", "ERR");
        testHeaderID("optional(text)", "optional[text]");
        testHeaderID("(optional text)", "optional[text]");
        testHeaderID("optionaltext", "optionaltext");
        testHeaderID("pre text", "pre[text]");
        testHeaderID("post text", "post[text]");
        testHeaderID("from text", "from[text]");
        testHeaderID("to text", "to[text]");
        testHeaderID("pre", "pre[.i]");
        testHeaderID("post", "post[.i]");
        testHeaderID("from", "from[.i]");
        testHeaderID("to", "to[.o]");
        testHeaderID("pre(text)", "pre[text]");
        testHeaderID("(pre text)", "pre[text]");
        testHeaderID("pre text/gloss", "pre[slash[text,gloss]]"); // this is invalid, but it CAN be parsed
        
        testHeaderID("pre embed", "pre[embed]"); // this is invalid, but it CAN be parsed
        testHeaderID("blarg text", "ERR");
        testHeaderID("equals text", "equals[text]");
        testHeaderID("equals(text)", "equals[text]");
        testHeaderID("starts text", "starts[text]");
        testHeaderID("ends text", "ends[text]");
        testHeaderID("contains text", "contains[text]");
        testHeaderID("equals text/gloss", "equals[slash[text,gloss]]"); // this is invalid, but it CAN be parsed
        testHeaderID("equals embed", "equals[embed]"); // // this is invalid, but it CAN be parsed
        testHeaderID("text/gloss/root", "slash[text,slash[gloss,root]]");
        testHeaderID("(text/gloss)/root", "slash[slash[text,gloss],root]");

        // empty header is invalid
        testHeaderID("", "ERR");

        // invalid because they contain symbols not used in headers nor in valid identifiers
        testHeaderID("text,text", "ERR");
        testHeaderID("text, text", "ERR");
        testHeaderID("text,", "ERR");
        testHeaderID(",text", "ERR");
        testHeaderID(".text", "ERR");
        testHeaderID("text.text", "ERR");
        testHeaderID("text;text", "ERR");
        testHeaderID("\\text", "ERR");
        testHeaderID("text:", "ERR");
        testHeaderID("text:text", "ERR");     
        testHeaderID("text%text", "ERR");
        testHeaderID("[text]", "ERR");
        testHeaderID("<text", "ERR");

        // valid tape names start with letters or underscore
        testHeaderID("_text", "_text");
        testHeaderID("text_text", "text_text");
        testHeaderID("123", "ERR");
        testHeaderID("123text", "ERR");

        // tape names are allowed to contain $ @ # & ? ' " =, but not at the beginning
        testHeaderID("text$", "text$");
        testHeaderID("$text", "ERR");
        testHeaderID("text@", "text@");
        testHeaderID("@text", "ERR");
        testHeaderID("text#", "text#");
        testHeaderID("#text", "ERR");
        testHeaderID("text&", "text&");
        testHeaderID("&text", "ERR");
        testHeaderID("text?", "text?");
        testHeaderID("?text", "ERR");
        testHeaderID("text'", "text'");
        testHeaderID("'text", "ERR");  
        testHeaderID('text"', 'text"');
        testHeaderID('"text', "ERR"); 
        testHeaderID("text=", "text=");
        testHeaderID("=text", "ERR"); 

        // tape names may contain Unicode letters anywhere
        testHeaderID("textε", "textε");
        testHeaderID("εtext", "εtext");
        testHeaderID("नमस्ते", "नमस्ते");
        testHeaderID("Привет", "Привет");
        testHeaderID("ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testHeaderID("οἶκος", "οἶκος");
        testHeaderID("あの人", "あの人");
        testHeaderID("恭喜发财", "恭喜发财");
        testHeaderID("ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testHeaderID("کتاب‌ها", "ERR"); // contains a zero-width non-joiner
    });
});