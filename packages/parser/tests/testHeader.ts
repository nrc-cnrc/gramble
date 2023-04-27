import {
    testSuiteName, logTestSuite, VERBOSE_TEST_L2,
    testHeaderID, testIsType
} from "./testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testHeaderID("1.", "text", "text");
    testHeaderID("2.", "text ", "text");
    testHeaderID("3.", " text", "text");
    testHeaderID("4.", "\\text", "text");
    testHeaderID("5.", "te\\xt", "text");
    testHeaderID("6.", "embed", "embed");
    testHeaderID("7.", "EMBED", "embed");
    testHeaderID("8.", "hide", "hide");
    testHeaderID("9.", "%text", "%");
    testHeaderID("10.", "% text", "%");
    testHeaderID("11.", "%", "%");
    testHeaderID("12.", "(text)", "text");
    testHeaderID("13.", "(text", "ERR");
    testHeaderID("14.", "text)", "ERR");
    testHeaderID("15.", "text/gloss", "slash[text,gloss]");
    testHeaderID("16.", "(text/gloss)", "slash[text,gloss]");
    testHeaderID("17.", "(text)/(gloss)", "slash[text,gloss]");
    testHeaderID("18.", "text/", "ERR");
    testHeaderID("19.", "/text", "ERR");
    testHeaderID("20.", "optional text", "optional[text]");
    testHeaderID("21.", "optional", "ERR");
    testHeaderID("22.", "text optional", "ERR");
    testHeaderID("23.", "optional/text", "ERR");
    testHeaderID("24.", "optional(text)", "optional[text]");
    testHeaderID("25.", "(optional text)", "optional[text]");
    testHeaderID("26.", "optionaltext", "optionaltext");
    testHeaderID("27.", "pre text", "ERR");
    testHeaderID("28.", "post text", "ERR");
    testHeaderID("29.", "from text", "ERR");
    testHeaderID("30.", "to text", "ERR");
    testHeaderID("31.", "pre", "pre[$i]");
    testHeaderID("32.", "post", "post[$i]");
    testHeaderID("33.", "from", "from[$i]");
    testHeaderID("34.", "to", "to[$o]");
    testHeaderID("35.", "pre(text)", "ERR");
    testHeaderID("36.", "(pre text)", "ERR");
    testHeaderID("37.", "pre text/gloss", "ERR");
    testHeaderID("38.", "pre embed", "ERR");
    testHeaderID("39.", "blarg text", "ERR");
    testHeaderID("40.", "equals text", "equals[text]");
    testHeaderID("41.", "equals(text)", "equals[text]");
    testHeaderID("42.", "starts text", "starts[text]");
    testHeaderID("43.", "ends text", "ends[text]");
    testHeaderID("44.", "contains text", "contains[text]");
    testHeaderID("45.", "equals text/gloss", "ERR");
    testHeaderID("46.", "equals embed", "ERR");
    testHeaderID("47.", "text/gloss/root", "slash[text,slash[gloss,root]]");
    testHeaderID("48.", "(text/gloss)/root", "slash[slash[text,gloss],root]");

    // empty header is invalid
    testHeaderID("49.", "", "ERR");

    // invalid because they contain symbols not used in headers nor in valid identifiers
    testHeaderID("50.", "text,text", "ERR");
    testHeaderID("51.", "text, text", "ERR");
    testHeaderID("52.", "text,", "ERR");
    testHeaderID("53.", "text\\,", "ERR");
    testHeaderID("54.", "text\\", "ERR");
    testHeaderID("55.", "text\\\\text", "ERR");
    testHeaderID("56.", ",text", "ERR");
    testHeaderID("57.", ".text", "ERR");
    testHeaderID("58.", "text.text", "ERR");
    testHeaderID("59.", "text;text", "ERR");
    testHeaderID("60.", "text\\ text", "ERR");
    testHeaderID("61.", "text:", "ERR");
    testHeaderID("62.", "text:text", "ERR");     
    testHeaderID("63.", "text%text", "ERR");
    testHeaderID("64.", "[text]", "ERR");
    testHeaderID("65.", "<text", "ERR");

    // valid tape names start with letters or underscore
    testHeaderID("66.", "_text", "_text");
    testHeaderID("67.", "text_text", "text_text");
    testHeaderID("68.", "123", "ERR");
    testHeaderID("69.", "123text", "ERR");

    // tape names are allowed to contain $ @ # & ' " , but not at the beginning
    testHeaderID("70.", "text$", "text$");
    testHeaderID("71.", "$text", "ERR");
    testHeaderID("72.", "text@", "text@");
    testHeaderID("73.", "@text", "ERR");
    testHeaderID("74.", "text#", "text#");
    testHeaderID("75.", "#text", "ERR");
    testHeaderID("76.", "text&", "text&");
    testHeaderID("77.", "&text", "ERR");
    testHeaderID("78.", "text'", "text'");
    testHeaderID("79.", "'text", "ERR");  
    testHeaderID("80.", 'text"', 'text"');
    testHeaderID("81.", '"text', "ERR"); 

    // tape names cannot contain ? = * +
    testHeaderID("82.", "text?", "ERR");
    testHeaderID("83.", "?text", "ERR");
    testHeaderID("84.", "text=", "ERR");
    testHeaderID("85.", "=text", "ERR"); 
    testHeaderID("86.", "text+", "ERR");
    testHeaderID("87.", "+text", "ERR");
    testHeaderID("88.", "text*", "ERR");
    testHeaderID("89.", "*text", "ERR"); 

    // tape names may contain Unicode letters anywhere
    testHeaderID("90.", "textε", "textε");
    testHeaderID("91.", "εtext", "εtext");
    testHeaderID("92.", "नमस्ते", "नमस्ते");
    testHeaderID("93.", "Привет", "Привет");
    testHeaderID("94.", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
    testHeaderID("95.", "οἶκος", "οἶκος");
    testHeaderID("96.", "あの人", "あの人");
    testHeaderID("97.", "恭喜发财", "恭喜发财");
    testHeaderID("98.", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testHeaderID("99.", "کتاب‌ها", "ERR"); // contains a zero-width non-joiner
});
