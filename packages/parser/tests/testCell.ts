import {
    testSuiteName, logTestSuite,
    VERBOSE_TEST_L2,
    testPlaintextID, testRegexID, testSymbolID, testRuleContextID
} from "./testUtil";

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    describe("Testing plaintext parsing", function() {
        testPlaintextID("1a", "", "");
        testPlaintextID("1b", " ", "");
        testPlaintextID("1c", "()", "()");
        testPlaintextID("1d", "( )", "[(,)]");
        testPlaintextID("1e", "1SG", "1SG");
        testPlaintextID("1f", " 1SG", "1SG");
        testPlaintextID("1g", "1SG ", "1SG");
        testPlaintextID("1h", "1 SG", "[1,SG]");
        testPlaintextID("1i", "1\\ SG", "1 SG");
        testPlaintextID("1j", "(1SG)", "(1SG)");
        testPlaintextID("1k", "(1SG", "(1SG");
        testPlaintextID("1l", "1SG)", "1SG)");
        testPlaintextID("1m", ".", ".");
        testPlaintextID("1n", ".*", ".*");
        testPlaintextID("1o", "(.)", "(.)");
        testPlaintextID("1p", "\\.", ".");
        testPlaintextID("1q", "\\)", ")");

        // testing alternation
        testPlaintextID("2a", "1SG|2SG", "OR[1SG,2SG]");
        testPlaintextID("2b", "1SG\\|2SG", "1SG|2SG");
        testPlaintextID("2c", "|1SG", "ε", 1);
        testPlaintextID("2d", "1SG|", "ε", 1);
        testPlaintextID("2e", "(1SG)|(2SG)", "OR[(1SG),(2SG)]");
        testPlaintextID("2f", "(1SG|2SG)", "OR[(1SG,2SG)]");
        testPlaintextID("2g", "|", "ε", 1);
        testPlaintextID("2h", "1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testPlaintextID("2i", "1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");
        testPlaintextID("2j", "\\|", "|");
    
        // plaintext may contain Unicode letters anywhere
        testPlaintextID("3a", "textε", "textε");
        testPlaintextID("3b", "εtext", "εtext");
        testPlaintextID("3c", "नमस्ते", "नमस्ते");
        testPlaintextID("3d", "Привет", "Привет");
        testPlaintextID("3e", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testPlaintextID("3f", "οἶκος", "οἶκος");
        testPlaintextID("3g", "あの人", "あの人");
        testPlaintextID("3h", "恭喜发财", "恭喜发财");
        testPlaintextID("3i", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // plaintext can even contain zero-width non-joiners
        testPlaintextID("3j", "کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

    });

    describe("Testing symbol parsing", function() {
        //basics
        testSymbolID("4a", "verb", "verb");
        testSymbolID("4b", "_verb", "_verb");
        testSymbolID("4c", "9verb", "ε", 1);
        testSymbolID("4d", "verb intrans", "ε", 1);
        testSymbolID("4e", "verb-intrans", "verb-intrans");
        testSymbolID("4f", "verb*intrans", "ε", 1);

        // testing dots
        testSymbolID("5a", "verb.intrans", "verb.intrans");
        testSymbolID("5b", "verb._intrans", "verb._intrans");
        testSymbolID("5c", "verb.9intrans", "ε", 1);
        testSymbolID("5d", "9verb.intrans", "ε", 1);
        testSymbolID("5e", "verb.intrans.classB", "verb.intrans.classB");
        testSymbolID("5a", "verb\\.intrans", "ε", 1);
        
        // testing alternation
        testSymbolID("6a", "verb|noun", "OR[verb,noun]");
        testSymbolID("6b", "verb.intrans|noun", "OR[verb.intrans,noun]");
        testSymbolID("6c", "verb|noun.classB", "OR[verb,noun.classB]");
        testSymbolID("6d", "verb|noun,classB", "OR[verb,ε]", 1);
        testSymbolID("6e", "verb|noun classB", "ε", 1);
        testSymbolID("6f", "|verb", "ε", 1);
        testSymbolID("6g", "verb|", "ε", 1);
        testSymbolID("6h", "|", "ε", 1);
        testSymbolID("6i", "verb|noun|prep", "OR[verb,OR[noun,prep]]");

        // valid symbol names start with letters or underscore
        testSymbolID("7a", "_verb", "_verb");
        testSymbolID("7b", "verb_verb", "verb_verb");
        testSymbolID("7c", "123", "ε", 1);
        testSymbolID("7d", "123verb", "ε", 1);

        // symbol names are allowed to contain $ @ # & ? ' " =,
        // but not at the beginning
        testSymbolID("8a", "verb$", "verb$");
        testSymbolID("8b", "$verb", "ε", 1);
        testSymbolID("8c", "verb@", "verb@");
        testSymbolID("8d", "@verb", "ε", 1);
        testSymbolID("8e", "verb#", "verb#");
        testSymbolID("8f", "#verb", "ε", 1);
        testSymbolID("8g", "verb&", "verb&");
        testSymbolID("8h", "&verb", "ε", 1);
        testSymbolID("8i", "verb?", "ε", 1);
        testSymbolID("8j", "?verb", "ε", 1);
        testSymbolID("8k", "verb'", "verb'");
        testSymbolID("8l", "'verb", "ε", 1);  
        testSymbolID("8m", 'verb"', 'verb"');
        testSymbolID("8n", '"verb', "ε", 1); 
        testSymbolID("8o", "verb=", "ε", 1);
        testSymbolID("8p", "=verb", "ε", 1); 

        // even if they're escaped
        testSymbolID("8q", "\\$verb", "ε", 1);

        // symbol names may contain Unicode letters anywhere
        testSymbolID("9a", "verbε", "verbε");
        testSymbolID("9b", "εverb", "εverb");
        testSymbolID("9c", "नमस्ते", "नमस्ते");
        testSymbolID("9d", "Привет", "Привет");
        testSymbolID("9e", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testSymbolID("9f", "οἶκος", "οἶκος");
        testSymbolID("9g", "あの人", "あの人");
        testSymbolID("9h", "恭喜发财", "恭喜发财");
        testSymbolID("9i", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testSymbolID("9j", "کتاب‌ها", "ε", 1); // contains a zero-width non-joiner
    
        // putting curly braces around a verb should parse, but it fires
        // a warning message
        testSymbolID("10", "{verb}", "verb", 1);
    });

    describe("Testing regex parsing", function() {
        testRegexID("11a", "", "");
        testRegexID("11b", " ", "");
        testRegexID("11c", "()", "");
        testRegexID("11d", "( )", "");
        testRegexID("11e", "1SG", "1SG");
        testRegexID("11f", " 1SG", "1SG");
        testRegexID("11g", "1SG ", "1SG");
        testRegexID("11h", "1 SG", "[1,SG]");
        testRegexID("11i", "1\\ SG", "1 SG");
        testRegexID("11j", "(1SG)", "1SG");
        testRegexID("11k", "(1SG", "ε", 1);
        testRegexID("11l", "1SG)", "ε", 1);
        testRegexID("11m", ".", "DOT");
        testRegexID("11n", ".*", "STAR[DOT]");
        testRegexID("11o", "(.)", "DOT");
        testRegexID("11p", ".SG", "[DOT,SG]");
        testRegexID("11q", ".SG*", "[DOT,STAR[SG]]");
        testRegexID("11r", "(.SG)*", "STAR[[DOT,SG]]");
        testRegexID("11s", "\\\\1SG", "\\1SG");
        testRegexID("11t", "\\(1SG", "(1SG");
        testRegexID("11u", "1SG\\)", "1SG)");
        testRegexID("11v", "((1SG))", "1SG");

        testRegexID("12a", "~1SG", "NOT[1SG]");
        testRegexID("12b", "\\~1SG", "~1SG");
        testRegexID("12c", "~ 1SG", "NOT[1SG]");
        testRegexID("12d", "~", "ε", 1);    
        testRegexID("12e", '1SG~', "ε", 1);
        testRegexID("12f", "~(1SG)", "NOT[1SG]");
        testRegexID("12g", "(~1SG)", "NOT[1SG]");

        testRegexID("13a", "1SG|2SG", "OR[1SG,2SG]");
        testRegexID("13b", "1SG\\|2SG", "1SG|2SG");
        testRegexID("13c", "|1SG", "ε", 1);
        testRegexID("13d", "1SG|", "ε", 1);
        testRegexID("13e", "1SG|()", "OR[1SG,]");
        testRegexID("13f", "()|2SG", "OR[,2SG]");
        testRegexID("13g", "(1SG)|(2SG)", "OR[1SG,2SG]");
        testRegexID("13h", "(1SG|2SG)", "OR[1SG,2SG]");
        testRegexID("13i", "~(1SG|2SG)", "NOT[OR[1SG,2SG]]");
        testRegexID("13j", "(1SG|)2SG", "ε", 1);
        testRegexID("13k", "|", "ε", 1);
        testRegexID("13l", "~|1SG", "ε", 1);
        testRegexID("13m", "~1SG|", "ε", 1);
        testRegexID("13n", "1SG|2SG|3SG", "OR[1SG,OR[2SG,3SG]]");
        testRegexID("13o", "(1SG|2SG)|3SG", "OR[OR[1SG,2SG],3SG]");
        testRegexID("13o", "(1)(SG)", "[1,SG]");
        testRegexID("13p", "(1|2)SG", "[OR[1,2],SG]");
        testRegexID("13q", "1|2SG", "OR[1,2SG]");
        testRegexID("13r", "1~2SG", "[1,NOT[2SG]]");
        testRegexID("13s", "1SG*", "STAR[1SG]");   
        testRegexID("13t", "1SG*1SG", "[STAR[1SG],1SG]");
        testRegexID("13u", "1SG\\*", "1SG*");   
        testRegexID("13v", "1S(G)*", "[1S,STAR[G]]");   
        testRegexID("13w", "~1SG*", "NOT[STAR[1SG]]");
        testRegexID("13x", "(~1SG)*", "STAR[NOT[1SG]]");
        testRegexID("13y", "1SG|2SG*", "OR[1SG,STAR[2SG]]");
        testRegexID("13z", "(1SG|2SG)*", "STAR[OR[1SG,2SG]]");
        testRegexID("13aa", "(1SG)(2SG)*", "[1SG,STAR[2SG]]"); 
        testRegexID("13bb", "1SG+", "PLUS[1SG]");   
        testRegexID("13cc", "1SG\\+", "1SG+");   
        testRegexID("13dd", "1S(G)+", "[1S,PLUS[G]]");   
        testRegexID("13ee", "~1SG+", "NOT[PLUS[1SG]]");
        testRegexID("13ff", "(~1SG)+", "PLUS[NOT[1SG]]");
        testRegexID("13gg", "1SG|2SG+", "OR[1SG,PLUS[2SG]]");
        testRegexID("13hh", "(1SG|2SG)+", "PLUS[OR[1SG,2SG]]");
        testRegexID("13ii", "(1SG)(2SG)+", "[1SG,PLUS[2SG]]"); 
        testRegexID("13jj", "((1SG)(2SG))+", "PLUS[[1SG,2SG]]");
        testRegexID("13kk", "1SG?", "QUES[1SG]");   
        testRegexID("13ll", "1SG\\?", "1SG?");   
        testRegexID("13mm", "1S(G)?", "[1S,QUES[G]]");   
        testRegexID("13nn", "~1SG?", "NOT[QUES[1SG]]");
        testRegexID("13oo", "(~1SG)?", "QUES[NOT[1SG]]");
        testRegexID("13pp", "1SG|2SG?", "OR[1SG,QUES[2SG]]");
        testRegexID("13qq", "(1SG|2SG)?", "QUES[OR[1SG,2SG]]");
        testRegexID("13rr", "(1SG)(2SG)?", "[1SG,QUES[2SG]]");
        testRegexID("13ss", "1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testRegexID("13tt", "1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");

        testRegexID("13uu", "\\|", "|");
        testRegexID("13vv", "\\*", "*");

        // regex can contain Unicode characters anywhere
        testRegexID("14a", "textε", "textε");
        testRegexID("14b", "εtext", "εtext");
        testRegexID("14c", "नमस्ते", "नमस्ते");
        testRegexID("14d", "Привет", "Привет");
        testRegexID("14e", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testRegexID("14f", "οἶκος", "οἶκος");
        testRegexID("14g", "あの人", "あの人");
        testRegexID("14h", "恭喜发财", "恭喜发财");
        testRegexID("14i", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // regex can even contain zero-width non-joiners
        testRegexID("15", "کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

        // testing symbols inside regexes
        testRegexID("16a", "{}", "ε", 1);
        testRegexID("16b", "{ }", "ε", 1);
        testRegexID("16c", "{verb}", "verb");
        testRegexID("16d", "{_verb}", "_verb");
        testRegexID("16e", "{9verb}", "ε", 1);
        testRegexID("16f", "{verb intrans}", "ε", 1);
        testRegexID("16g", "{verb-intrans}", "verb-intrans");
        testRegexID("16h", "{verb*intrans}", "ε", 1);
        testRegexID("16i", "{verb.intrans}", "verb.intrans");
        testRegexID("16j", "{verb._intrans}", "verb._intrans");
        testRegexID("16k", "{verb.9intrans}", "ε", 1);
        testRegexID("16l", "{9verb.intrans}", "ε", 1);
        testRegexID("16m", "{verb.intrans.classB}", "verb.intrans.classB");
        testRegexID("16n", "{verb|noun}", "OR[verb,noun]");
        testRegexID("16o", "{verb.intrans|noun}", "OR[verb.intrans,noun]");
        testRegexID("16p", "{verb|noun.classB}", "OR[verb,noun.classB]");
        testRegexID("16q", "{verb|noun,classB}", "OR[verb,ε]", 1);
        testRegexID("16r", "{verb|noun classB}", "ε", 1);
        testRegexID("16s", "{|verb}", "ε", 1);
        testRegexID("16t", "{verb|}", "ε", 1);
        testRegexID("16u", "{|}", "ε", 1);
        testRegexID("16v", "{verb|noun|prep}", "OR[verb,OR[noun,prep]]");
        
        // valid symbol names start with letters or underscore
        testRegexID("17a", "{_verb}", "_verb");
        testRegexID("17b", "{verb_verb}", "verb_verb");
        testRegexID("17c", "{123}", "ε", 1);
        testRegexID("17d", "{123verb}", "ε", 1);

        // symbol names are allowed to contain $ @ # & ? ' " =,
        // but not at the beginning
        testRegexID("18a", "{verb$}", "verb$");
        testRegexID("18b", "{$verb}", "ε", 1);
        testRegexID("18c", "{verb@}", "verb@");
        testRegexID("18d", "{@verb}", "ε", 1);
        testRegexID("18e", "{verb#}", "verb#");
        testRegexID("18f", "{#verb}", "ε", 1);
        testRegexID("18g", "{verb&}", "verb&");
        testRegexID("18h", "{&verb}", "ε", 1);
        testRegexID("18i", "{verb?}", "ε", 1);
        testRegexID("18j", "{?verb}", "ε", 1);
        testRegexID("18k", "{verb'}", "verb'");
        testRegexID("18l", "{'verb}", "ε", 1);  
        testRegexID("18m", '{verb"}', 'verb"');
        testRegexID("18n", '{"verb}', "ε", 1); 
        testRegexID("18o", "{verb=}", "ε", 1);
        testRegexID("18p", "{=verb}", "ε", 1); 

        // symbol names may contain Unicode letters anywhere
        testRegexID("19a", "{verbε}", "verbε");
        testRegexID("19b", "{εverb}", "εverb");
        testRegexID("19c", "{नमस्ते}", "नमस्ते");
        testRegexID("19d", "{Привет}", "Привет");
        testRegexID("19e", "{ᓄᓇᕕᒃ}", "ᓄᓇᕕᒃ");
        testRegexID("19f", "{οἶκος}", "οἶκος");
        testRegexID("19g", "{あの人}", "あの人");
        testRegexID("19h", "{恭喜发财}", "恭喜发财");
        testRegexID("19i", "{ﺷﻜﺮﺍﹰ}", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testRegexID("19j", "{کتاب‌ها}", "ε", 1); // contains a zero-width non-joiner
    
        // nesting curly brackets parses, although it causes a warning message
        testRegexID("20a", "{{verb}}", "verb", 1);
        testRegexID("20b", "{{{verb}}}", "verb", 2);
    }); 
    
    describe("Testing rule context parsing", function() {

        // simple contexts
        testRuleContextID("21a", "a_b", "CONTEXT[a,b]");
        testRuleContextID("21b", "#a_b", "CONTEXT[#,a,b]");
        testRuleContextID("21c", "a_b#", "CONTEXT[a,b,#]");
        testRuleContextID("21d", "#a_b#", "CONTEXT[#,a,b,#]");

        // contexts with empty elements
        testRuleContextID("22a", "_b", "CONTEXT[,b]");
        testRuleContextID("22b", "#_b", "CONTEXT[#,,b]");
        testRuleContextID("22c", "_b#", "CONTEXT[,b,#]");
        testRuleContextID("22d", "#_b#", "CONTEXT[#,,b,#]");
        testRuleContextID("22e", "a_", "CONTEXT[a,]");
        testRuleContextID("22f", "#a_", "CONTEXT[#,a,]");
        testRuleContextID("22g", "a_#", "CONTEXT[a,,#]");
        testRuleContextID("22h", "#a_#", "CONTEXT[#,a,,#]");
        testRuleContextID("22i", "_", "CONTEXT[,]");
        testRuleContextID("22j", "#_", "CONTEXT[#,,]");
        testRuleContextID("22k", "_#", "CONTEXT[,,#]");
        testRuleContextID("22l", "#_#", "CONTEXT[#,,,#]");

        // regexes in the elements
        testRuleContextID("23a", "a*_b|c", "CONTEXT[STAR[a],OR[b,c]]");
        testRuleContextID("23b", "a|b_c*", "CONTEXT[OR[a,b],STAR[c]]");

        // escaped octothorpe or underscore in the regexes
        testRuleContextID("24a", "\\__b", "CONTEXT[_,b]");
        testRuleContextID("24b", "a_\\_", "CONTEXT[a,_]");
        testRuleContextID("24c", "\\__\\_", "CONTEXT[_,_]");
        testRuleContextID("24d", "\\#_b", "CONTEXT[#,b]");
        testRuleContextID("24e", "a_\\#", "CONTEXT[a,#]");
        testRuleContextID("24f", "\\#_\\#", "CONTEXT[#,#]");

        // unescaped octothorpe or underscore in the regexes
        testRuleContextID("25a", "__b", "ε", 1);
        testRuleContextID("25b", "a__", "ε", 1);
        testRuleContextID("25c", "___", "ε", 1);
        testRuleContextID("25d", "##_b", "ε", 1);
        testRuleContextID("25e", "a_##", "ε", 1);
        testRuleContextID("25f", "##_##", "ε", 1);

        // these are currently unparseable but may become parseable 
        // in the future
        testRuleContextID("26a", "(_)_b", "ε", 1);
        testRuleContextID("26b", "a_(_)", "ε", 1);
        testRuleContextID("26c", "(_)_(_)", "ε", 1);
        testRuleContextID("26d", "(#)_b", "ε", 1);
        testRuleContextID("26e", "a_(#)", "ε", 1);
        testRuleContextID("26f", "(#)_(#)", "ε", 1);

    });
});
