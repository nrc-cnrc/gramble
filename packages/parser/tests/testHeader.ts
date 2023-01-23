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
        testHeaderID("text/gloss", "SLASH[text,gloss]");
        testHeaderID("(text/gloss)", "SLASH[text,gloss]");
        testHeaderID("(text)/(gloss)", "SLASH[text,gloss]");
        testHeaderID("text/", "ERR");
        testHeaderID("/text", "ERR");
        testHeaderID("optional text", "OPT[text]");
        testHeaderID("optional", "ERR");
        testHeaderID("text optional", "ERR");
        testHeaderID("optional/text", "ERR");
        testHeaderID("optional(text)", "OPT[text]");
        testHeaderID("(optional text)", "OPT[text]");
        testHeaderID("optionaltext", "optionaltext");
        testHeaderID("pre text", "pre:text");
        testHeaderID("post text", "post:text");
        testHeaderID("from text", "from:text");
        testHeaderID("to text", "to:text");
        testHeaderID("pre(text)", "pre:text");
        testHeaderID("(pre text)", "pre:text");
        testHeaderID("blarg text", "ERR");
        testHeaderID("re text", "RE[text]");
        testHeaderID("re text/gloss", "ERR");
        testHeaderID("equals text", "EQUALS[text]");
        testHeaderID("equals re text", "EQUALS[RE[text]]");
        testHeaderID("starts text", "STARTS[text]");
        testHeaderID("ends text", "ENDS[text]");
        testHeaderID("contains text", "CONTAINS[text]");
        testHeaderID("text/gloss/root", "SLASH[text,SLASH[gloss,root]]");
        testHeaderID("(text/gloss)/root", "SLASH[SLASH[text,gloss],root]");

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