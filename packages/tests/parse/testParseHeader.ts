import { testHeaderID } from "./testParseUtils.js";

describe(`Parse header`, function() {

    // tape name headers
    testHeaderID("1a", "text", "(tape text)");
    testHeaderID("1b", "text ", "(tape text)");
    testHeaderID("1c", " text", "(tape text)");
    testHeaderID("1d", "\\text", "(tape text)");
    testHeaderID("1e", "te\\xt", "(tape text)");

    // pre and post aren't reserved anymore, they're just tape names
    testHeaderID("2a", "pre", "(tape pre)"); 
    testHeaderID("2b", "post", "(tape post)");

    // parens
    testHeaderID("3a", "(text)", "(tape text)");
    testHeaderID("3b", "(text", "(error)");
    testHeaderID("3c", "text)", "(error)");

    // atomic headers
    testHeaderID("4a", "embed", "(embed)");
    testHeaderID("4b", "EMBED", "(embed)");
    testHeaderID("4c", "hide", "(hide)");
    testHeaderID("4d", "%text", "(comment)");
    testHeaderID("4e", "% text", "(comment)");
    testHeaderID("4f", "comment", "(tape comment)");
    testHeaderID("4g", "from", "(from)");
    testHeaderID("4h", "to", "(to)");
    testHeaderID("4i", "context", "(context)");

    // using atomics as if they're unary
    testHeaderID("5a", "pre text", "(error)");
    testHeaderID("5b", "post text", "(error)");
    testHeaderID("5c", "from text", "(error)");
    testHeaderID("5d", "to text", "(error)");
    testHeaderID("5e", "pre(text)", "(error)");
    testHeaderID("5f", "(pre text)", "(error)");
    testHeaderID("5g", "blarg text", "(error)");

    // header that happens to contain a reserved word inside
    testHeaderID("6a", "optionaltext", "(tape optionaltext)");
    testHeaderID("6b", "textoptional", "(tape textoptional)");
    testHeaderID("6c", "textoptionaltext", "(tape textoptionaltext)");

    // unary headers
    testHeaderID("7a", "optional text", "(optional (tape text))");
    testHeaderID("7b", "optional", "(error)");
    testHeaderID("7c", "text optional", "(error)");
    testHeaderID("7d", "optional(text)", "(optional (tape text))");
    testHeaderID("7e", "optional text", "(optional (tape text))");
    testHeaderID("7f", "equals text", "(equals (tape text))");
    testHeaderID("7g", "equals(text)", "(equals (tape text))");
    testHeaderID("7h", "starts text", "(starts (tape text))");
    testHeaderID("7i", "ends text", "(ends (tape text))");
    testHeaderID("7j", "contains text", "(contains (tape text))");
    testHeaderID("7k", "equals text/gloss", "(error)");
    testHeaderID("7l", "equals embed", "(error)");
    testHeaderID("7m", ">text", "(rename (tape text))");
    testHeaderID("7m", "> text", "(rename (tape text))");
    testHeaderID("7n", "\\>text", "(error)");
    testHeaderID("7o", ">text/gloss", "(error)");
    testHeaderID("7p", ">(text/gloss)", "(error)");
    testHeaderID("7q", ">optional text", "(error)");
    testHeaderID("7r", ">optional text", "(error)");
    testHeaderID("7s", "unique text", "(unique (tape text))");
    testHeaderID("7t", "unique(text)", "(unique (tape text))");
    testHeaderID("7u", "unique text/gloss", "(unique (slash (tape text) (tape gloss)))");


    // slash headers
    testHeaderID("8a", "text/gloss", "(slash (tape text) (tape gloss))");
    testHeaderID("8b", "(text/gloss)", "(slash (tape text) (tape gloss))");
    testHeaderID("8c", "(text)/(gloss)", "(slash (tape text) (tape gloss))");
    testHeaderID("8d", "text/", "(error)");
    testHeaderID("8e", "/text", "(error)");
    testHeaderID("8f", "optional/text", "(error)");
    testHeaderID("8g", "text/gloss/root", "(slash (tape text) (slash (tape gloss) (tape root)))");
    testHeaderID("8h", "(text/gloss)/root", "(slash (slash (tape text) (tape gloss)) (tape root))");

    // empty header is invalid
    testHeaderID("9", "", "(error)");

    // invalid because they contain symbols not used in headers nor in valid identifiers
    testHeaderID("10a", "text,text", "(error)");
    testHeaderID("10b", "text, text", "(error)");
    testHeaderID("10c", "text,", "(error)");
    testHeaderID("10d", "text\\,", "(error)");
    testHeaderID("10e", "text\\", "(error)");
    testHeaderID("10f", "text\\\\text", "(error)");
    testHeaderID("10g", ",text", "(error)");
    testHeaderID("10h", ".text", "(error)");
    testHeaderID("10i", "text.text", "(error)");
    testHeaderID("10j", "text;text", "(error)");
    testHeaderID("10k", "text\\ text", "(error)");
    testHeaderID("10l", "text:", "(error)");
    testHeaderID("10m", "text:text", "(error)");     
    testHeaderID("10n", "text%text", "(error)");
    testHeaderID("10o", "[text]", "(error)");
    testHeaderID("10p", "<text", "(error)");

    // valid tape names start with letters or underscore
    testHeaderID("11a", "_text", "(tape _text)");
    testHeaderID("11b", "text_text", "(tape text_text)");
    testHeaderID("11c", "123", "(error)");
    testHeaderID("11d", "123text", "(error)");

    // tape names are allowed to contain $ @ # - ' ", but not at the beginning
    testHeaderID("12a", "text$", "(tape text$)");
    testHeaderID("12b", "$text", "(error)");
    testHeaderID("12c", "text@", "(tape text@)");
    testHeaderID("12d", "@text", "(error)");
    testHeaderID("12e", "text#", "(tape text#)");
    testHeaderID("12f", "#text", "(error)");
    testHeaderID("12g", "text-", "(tape text-)");
    testHeaderID("12h", "-text", "(error)");
    testHeaderID("12i", "text'", "(tape text')");
    testHeaderID("12j", "'text", "(error)");  
    testHeaderID("12k", 'text"', '(tape text")');
    testHeaderID("12l", '"text', "(error)"); 

    // tape names cannot contain ? = * + & ^ \
    testHeaderID("13a", "text?", "(error)");
    testHeaderID("13b", "?text", "(error)");
    testHeaderID("13c", "text=", "(error)");
    testHeaderID("13d", "=text", "(error)"); 
    testHeaderID("13e", "text+", "(error)");
    testHeaderID("13f", "+text", "(error)");
    testHeaderID("13g", "text*", "(error)");
    testHeaderID("13h", "*text", "(error)"); 
    testHeaderID("13i", "text&", "(error)");
    testHeaderID("13j", "&text", "(error)");
    testHeaderID("13k", "text^", "(error)");
    testHeaderID("13l", "^text", "(error)");
    testHeaderID("13k", "text\\\\", "(error)");
    testHeaderID("13l", "\\\\text", "(error)");

    // tape names may contain Unicode letters anywhere
    testHeaderID("14a", "textε", "(tape textε)");
    testHeaderID("14b", "εtext", "(tape εtext)");
    testHeaderID("14c", "नमस्ते", "(tape नमस्ते)");
    testHeaderID("14d", "Привет", "(tape Привет)");
    testHeaderID("14e", "ᓄᓇᕕᒃ", "(tape ᓄᓇᕕᒃ)");
    testHeaderID("14f", "οἶκος", "(tape οἶκος)");
    testHeaderID("14g", "あの人", "(tape あの人)");
    testHeaderID("14h", "恭喜发财", "(tape 恭喜发财)");
    testHeaderID("14i", "ﺷﻜﺮﺍﹰ", "(tape ﺷﻜﺮﺍﹰ)");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testHeaderID("15", "کتاب‌ها", "(error)"); // contains a zero-width non-joiner
});
