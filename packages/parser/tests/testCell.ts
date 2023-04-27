import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    testPlaintextID, testRegexID, testSymbolID
} from "./testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe("Testing plaintext parsing", function() {
        testPlaintextID("1.", "", "");
        testPlaintextID("2.", " ", "");
        testPlaintextID("3.", "()", "()");
        testPlaintextID("4.", "( )", "[(,)]");
        testPlaintextID("5.", "1SG", "1SG");
        testPlaintextID("6.", " 1SG", "1SG");
        testPlaintextID("7.", "1SG ", "1SG");
        testPlaintextID("8.", "1 SG", "[1,SG]");
        testPlaintextID("8.", "1\\ SG", "1 SG");
        testPlaintextID("9.", "(1SG)", "(1SG)");
        testPlaintextID("10.", "(1SG", "(1SG");
        testPlaintextID("11.", "1SG)", "1SG)");
        testPlaintextID("12.", ".", ".");
        testPlaintextID("13.", ".*", ".*");
        testPlaintextID("14.", "(.)", "(.)");
        testPlaintextID("15.", "1SG|2SG", "OR[1SG,2SG]");
        testPlaintextID("16.", "1SG\\|2SG", "1SG|2SG");
        testPlaintextID("17.", "|1SG", "ε", 1);
        testPlaintextID("18.", "1SG|", "ε", 1);
        testPlaintextID("19.", "(1SG)|(2SG)", "OR[(1SG),(2SG)]");
        testPlaintextID("20.", "(1SG|2SG)", "OR[(1SG,2SG)]");
        testPlaintextID("21.", "|", "ε", 1);
        testPlaintextID("22.", "1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testPlaintextID("23.", "1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");
    
        // plaintext may contain Unicode letters anywhere

        testPlaintextID("24.", "textε", "textε");
        testPlaintextID("25.", "εtext", "εtext");
        testPlaintextID("26.", "नमस्ते", "नमस्ते");
        testPlaintextID("27.", "Привет", "Привет");
        testPlaintextID("28.", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testPlaintextID("29.", "οἶκος", "οἶκος");
        testPlaintextID("30.", "あの人", "あの人");
        testPlaintextID("31.", "恭喜发财", "恭喜发财");
        testPlaintextID("32.", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // plaintext can even contain zero-width non-joiners
        testPlaintextID("33.", "کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

    });

    describe("Testing symbol parsing", function() {
        testSymbolID("1.", "verb", "verb");
        testSymbolID("2.", "_verb", "_verb");
        testSymbolID("3.", "9verb", "ε", 1);
        testSymbolID("4.", "verb intrans", "ε", 1);
        testSymbolID("5.", "verb-intrans", "verb-intrans");
        testSymbolID("6.", "verb*intrans", "ε", 1);
        testSymbolID("7.", "verb.intrans", "verb.intrans");
        testSymbolID("8.", "verb._intrans", "verb._intrans");
        testSymbolID("9.", "verb.9intrans", "ε", 1);
        testSymbolID("10.", "9verb.intrans", "ε", 1);
        testSymbolID("11.", "verb.intrans.classB", "verb.intrans.classB");
        testSymbolID("12.", "verb|noun", "OR[verb,noun]");
        testSymbolID("13.", "verb.intrans|noun", "OR[verb.intrans,noun]");
        testSymbolID("14.", "verb|noun.classB", "OR[verb,noun.classB]");
        testSymbolID("15.", "verb|noun,classB", "OR[verb,ε]", 1);
        testSymbolID("16.", "verb|noun classB", "ε", 1);
        testSymbolID("17.", "|verb", "ε", 1);
        testSymbolID("18.", "verb|", "ε", 1);
        testSymbolID("19.", "|", "ε", 1);
        testSymbolID("20.", "verb|noun|prep", "OR[verb,OR[noun,prep]]");

        // valid symbol names start with letters or underscore
        testSymbolID("21.", "_verb", "_verb");
        testSymbolID("22.", "verb_verb", "verb_verb");
        testSymbolID("23.", "123", "ε", 1);
        testSymbolID("24.", "123verb", "ε", 1);

        // symbol names are allowed to contain $ @ # & ? ' " =,
        // but not at the beginning
        testSymbolID("25.", "verb$", "verb$");
        testSymbolID("26.", "$verb", "ε", 1);
        testSymbolID("27.", "verb@", "verb@");
        testSymbolID("28.", "@verb", "ε", 1);
        testSymbolID("29.", "verb#", "verb#");
        testSymbolID("30.", "#verb", "ε", 1);
        testSymbolID("31.", "verb&", "verb&");
        testSymbolID("32.", "&verb", "ε", 1);
        testSymbolID("33.", "verb?", "ε", 1);
        testSymbolID("34.", "?verb", "ε", 1);
        testSymbolID("35.", "verb'", "verb'");
        testSymbolID("36.", "'verb", "ε", 1);  
        testSymbolID("37.", 'verb"', 'verb"');
        testSymbolID("38.", '"verb', "ε", 1); 
        testSymbolID("39.", "verb=", "ε", 1);
        testSymbolID("40.", "=verb", "ε", 1); 

        // symbol names may contain Unicode letters anywhere
        testSymbolID("41.", "verbε", "verbε");
        testSymbolID("42.", "εverb", "εverb");
        testSymbolID("43.", "नमस्ते", "नमस्ते");
        testSymbolID("44.", "Привет", "Привет");
        testSymbolID("45.", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testSymbolID("46.", "οἶκος", "οἶκος");
        testSymbolID("47.", "あの人", "あの人");
        testSymbolID("48.", "恭喜发财", "恭喜发财");
        testSymbolID("49.", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testSymbolID("50.", "کتاب‌ها", "ε", 1); // contains a zero-width non-joiner
    
        // putting curly braces around a verb should parse, but it fires
        // a warning message
        testSymbolID("51.", "{verb}", "verb", 1);
    });

    describe("Testing regex parsing", function() {
        testRegexID("1.", "", "");
        testRegexID("2.", " ", "");
        testRegexID("3.", "()", "");
        testRegexID("4.", "( )", "");
        testRegexID("5.", "1SG", "1SG");
        testRegexID("6.", " 1SG", "1SG");
        testRegexID("7.", "1SG ", "1SG");
        testRegexID("8.", "1 SG", "[1,SG]");
        testRegexID("9.", "1\\ SG", "1 SG");
        testRegexID("10.", "(1SG)", "1SG");
        testRegexID("11.", "(1SG", "ε", 1);
        testRegexID("12.", "1SG)", "ε", 1);
        testRegexID("13.", ".", "DOT");
        testRegexID("14.", ".*", "STAR[DOT]");
        testRegexID("15.", "(.)", "DOT");
        testRegexID("16.", ".SG", "[DOT,SG]");
        testRegexID("17.", ".SG*", "[DOT,STAR[SG]]");
        testRegexID("18.", "(.SG)*", "STAR[[DOT,SG]]");
        testRegexID("19.", "\\\\1SG", "\\1SG");
        testRegexID("20.", "\\(1SG", "(1SG");
        testRegexID("21.", "1SG\\)", "1SG)");
        testRegexID("22.", "((1SG))", "1SG");
        testRegexID("23.", "~1SG", "NOT[1SG]");
        testRegexID("24.", "\\~1SG", "~1SG");
        testRegexID("25.", "~ 1SG", "NOT[1SG]");
        testRegexID("26.", "~", "ε", 1);    
        testRegexID("27.", '1SG~', "ε", 1);
        testRegexID("28.", "~(1SG)", "NOT[1SG]");
        testRegexID("29.", "(~1SG)", "NOT[1SG]");
        testRegexID("30.", "1SG|2SG", "OR[1SG,2SG]");
        testRegexID("31.", "1SG\\|2SG", "1SG|2SG");
        testRegexID("32.", "|1SG", "ε", 1);
        testRegexID("33.", "1SG|", "ε", 1);
        testRegexID("34.", "1SG|()", "OR[1SG,]");
        testRegexID("35.", "()|2SG", "OR[,2SG]");
        testRegexID("36.", "(1SG)|(2SG)", "OR[1SG,2SG]");
        testRegexID("37.", "(1SG|2SG)", "OR[1SG,2SG]");
        testRegexID("38.", "~(1SG|2SG)", "NOT[OR[1SG,2SG]]");
        testRegexID("39.", "(1SG|)2SG", "ε", 1);
        testRegexID("40.", "|", "ε", 1);
        testRegexID("41.", "~|1SG", "ε", 1);
        testRegexID("42.", "~1SG|", "ε", 1);
        testRegexID("43.", "1SG|2SG|3SG", "OR[1SG,OR[2SG,3SG]]");
        testRegexID("44.", "(1SG|2SG)|3SG", "OR[OR[1SG,2SG],3SG]");
        testRegexID("45.", "(1)(SG)", "[1,SG]");
        testRegexID("46.", "(1|2)SG", "[OR[1,2],SG]");
        testRegexID("47.", "1|2SG", "OR[1,2SG]");
        testRegexID("48.", "1~2SG", "[1,NOT[2SG]]");
        testRegexID("49.", "1SG*", "STAR[1SG]");   
        testRegexID("50.", "1SG*1SG", "[STAR[1SG],1SG]");
        testRegexID("51.", "1SG\\*", "1SG*");   
        testRegexID("52.", "1S(G)*", "[1S,STAR[G]]");   
        testRegexID("53.", "~1SG*", "NOT[STAR[1SG]]");
        testRegexID("54.", "(~1SG)*", "STAR[NOT[1SG]]");
        testRegexID("55.", "1SG|2SG*", "OR[1SG,STAR[2SG]]");
        testRegexID("56.", "(1SG|2SG)*", "STAR[OR[1SG,2SG]]");
        testRegexID("57.", "(1SG)(2SG)*", "[1SG,STAR[2SG]]"); 
        testRegexID("58.", "1SG+", "PLUS[1SG]");   
        testRegexID("59.", "1SG\\+", "1SG+");   
        testRegexID("60.", "1S(G)+", "[1S,PLUS[G]]");   
        testRegexID("61.", "~1SG+", "NOT[PLUS[1SG]]");
        testRegexID("62.", "(~1SG)+", "PLUS[NOT[1SG]]");
        testRegexID("63.", "1SG|2SG+", "OR[1SG,PLUS[2SG]]");
        testRegexID("64.", "(1SG|2SG)+", "PLUS[OR[1SG,2SG]]");
        testRegexID("65.", "(1SG)(2SG)+", "[1SG,PLUS[2SG]]"); 
        testRegexID("66.", "((1SG)(2SG))+", "PLUS[[1SG,2SG]]");
        testRegexID("67.", "1SG?", "QUES[1SG]");   
        testRegexID("68.", "1SG\\?", "1SG?");   
        testRegexID("69.", "1S(G)?", "[1S,QUES[G]]");   
        testRegexID("70.", "~1SG?", "NOT[QUES[1SG]]");
        testRegexID("71.", "(~1SG)?", "QUES[NOT[1SG]]");
        testRegexID("72.", "1SG|2SG?", "OR[1SG,QUES[2SG]]");
        testRegexID("73.", "(1SG|2SG)?", "QUES[OR[1SG,2SG]]");
        testRegexID("74.", "(1SG)(2SG)?", "[1SG,QUES[2SG]]");
        testRegexID("75.", "1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testRegexID("76.", "1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");

        // regex can contain Unicode characters anywhere
        testRegexID("77.", "textε", "textε");
        testRegexID("78.", "εtext", "εtext");
        testRegexID("79.", "नमस्ते", "नमस्ते");
        testRegexID("80.", "Привет", "Привет");
        testRegexID("81.", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testRegexID("82.", "οἶκος", "οἶκος");
        testRegexID("83.", "あの人", "あの人");
        testRegexID("84.", "恭喜发财", "恭喜发财");
        testRegexID("85.", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // regex can even contain zero-width non-joiners
        testRegexID("86.", "کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

        // testing symbols inside regexes
        testRegexID("87.", "{}", "ε", 1);
        testRegexID("88.", "{ }", "ε", 1);
        testRegexID("89.", "{verb}", "verb");
        testRegexID("90.", "{_verb}", "_verb");
        testRegexID("91.", "{9verb}", "ε", 1);
        testRegexID("92.", "{verb intrans}", "ε", 1);
        testRegexID("93.", "{verb-intrans}", "verb-intrans");
        testRegexID("94.", "{verb*intrans}", "ε", 1);
        testRegexID("95.", "{verb.intrans}", "verb.intrans");
        testRegexID("96.", "{verb._intrans}", "verb._intrans");
        testRegexID("97.", "{verb.9intrans}", "ε", 1);
        testRegexID("98.", "{9verb.intrans}", "ε", 1);
        testRegexID("99.", "{verb.intrans.classB}", "verb.intrans.classB");
        testRegexID("100.", "{verb|noun}", "OR[verb,noun]");
        testRegexID("101.", "{verb.intrans|noun}", "OR[verb.intrans,noun]");
        testRegexID("102.", "{verb|noun.classB}", "OR[verb,noun.classB]");
        testRegexID("103.", "{verb|noun,classB}", "OR[verb,ε]", 1);
        testRegexID("104.", "{verb|noun classB}", "ε", 1);
        testRegexID("105.", "{|verb}", "ε", 1);
        testRegexID("106.", "{verb|}", "ε", 1);
        testRegexID("107.", "{|}", "ε", 1);
        testRegexID("108.", "{verb|noun|prep}", "OR[verb,OR[noun,prep]]");
        
        // valid symbol names start with letters or underscore
        testRegexID("109.", "{_verb}", "_verb");
        testRegexID("110.", "{verb_verb}", "verb_verb");
        testRegexID("111.", "{123}", "ε", 1);
        testRegexID("112.", "{123verb}", "ε", 1);

        // symbol names are allowed to contain $ @ # & ? ' " =,
        // but not at the beginning
        testRegexID("113.", "{verb$}", "verb$");
        testRegexID("114.", "{$verb}", "ε", 1);
        testRegexID("115.", "{verb@}", "verb@");
        testRegexID("116.", "{@verb}", "ε", 1);
        testRegexID("117.", "{verb#}", "verb#");
        testRegexID("118.", "{#verb}", "ε", 1);
        testRegexID("119.", "{verb&}", "verb&");
        testRegexID("120.", "{&verb}", "ε", 1);
        testRegexID("121.", "{verb?}", "ε", 1);
        testRegexID("122.", "{?verb}", "ε", 1);
        testRegexID("123.", "{verb'}", "verb'");
        testRegexID("124.", "{'verb}", "ε", 1);  
        testRegexID("125.", '{verb"}', 'verb"');
        testRegexID("126.", '{"verb}', "ε", 1); 
        testRegexID("127.", "{verb=}", "ε", 1);
        testRegexID("128.", "{=verb}", "ε", 1); 

        // symbol names may contain Unicode letters anywhere
        testRegexID("129.", "{verbε}", "verbε");
        testRegexID("130.", "{εverb}", "εverb");
        testRegexID("131.", "{नमस्ते}", "नमस्ते");
        testRegexID("132.", "{Привет}", "Привет");
        testRegexID("133.", "{ᓄᓇᕕᒃ}", "ᓄᓇᕕᒃ");
        testRegexID("134.", "{οἶκος}", "οἶκος");
        testRegexID("135.", "{あの人}", "あの人");
        testRegexID("136.", "{恭喜发财}", "恭喜发财");
        testRegexID("137.", "{ﺷﻜﺮﺍﹰ}", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testRegexID("138.", "{کتاب‌ها}", "ε", 1); // contains a zero-width non-joiner
    
        // nesting curly brackets parses, although it causes a warning message
        testRegexID("139.", "{{verb}}", "verb", 1);
        testRegexID("140.", "{{{verb}}}", "verb", 2);
    }); 
});
