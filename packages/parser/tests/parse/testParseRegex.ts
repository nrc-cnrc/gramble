import {
    testSuiteName, 
    logTestSuite,
    testRegexID
} from "../testUtil";

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testRegexID("1a", "", "");
    testRegexID("1b", " ", "");
    testRegexID("1c", "()", "");
    testRegexID("1d", "( )", "");
    testRegexID("1e", "1SG", "1SG");
    testRegexID("1f", " 1SG", "1SG");
    testRegexID("1g", "1SG ", "1SG");
    testRegexID("1h", "1 SG", "1SG");
    testRegexID("1i", "1\\ SG", "1 SG");
    testRegexID("1j", "(1SG)", "1SG");
    testRegexID("1k", "(1SG", "ε", 1);
    testRegexID("1l", "1SG)", "ε", 1);
    testRegexID("1m", ".", "DOT");
    testRegexID("1n", ".*", "STAR[DOT]");
    testRegexID("1o", "(.)", "DOT");
    testRegexID("1p", ".SG", "[DOT,SG]");
    testRegexID("1q", ".SG*", "[DOT,S,STAR[G]]");
    testRegexID("1r", "(.SG)*", "STAR[[DOT,SG]]");
    testRegexID("1s", "\\\\1SG", "\\1SG");
    testRegexID("1t", "\\(1SG", "(1SG");
    testRegexID("1u", "1SG\\)", "1SG)");
    testRegexID("1v", "((1SG))", "1SG");
    testRegexID("1w", "(1)(SG)", "1SG");

    testRegexID("2a", "~1SG", "NOT[1SG]");
    testRegexID("2b", "\\~1SG", "~1SG");
    testRegexID("2c", "~ 1SG", "NOT[1SG]");
    testRegexID("2d", "~", "ε", 1);    
    testRegexID("2e", "~()", "NOT[]");    
    testRegexID("2f", '1SG~', "ε", 1);
    testRegexID("2g", "~(1SG)", "NOT[1SG]");
    testRegexID("2h", "(~1SG)", "NOT[1SG]");

    testRegexID("3a", "1SG|2SG", "OR[1SG,2SG]");
    testRegexID("3b", "1SG\\|2SG", "1SG|2SG");
    testRegexID("3c", "|1SG", "ε", 1);
    testRegexID("3d", "1SG|", "ε", 1);
    testRegexID("3e", "1SG|()", "OR[1SG,]");
    testRegexID("3f", "()|2SG", "OR[,2SG]");
    testRegexID("3g", "(1SG)|(2SG)", "OR[1SG,2SG]");
    testRegexID("3h", "(1SG|2SG)", "OR[1SG,2SG]");
    testRegexID("3i", "~(1SG|2SG)", "NOT[OR[1SG,2SG]]");
    testRegexID("3i2", "(~1SG|~2SG)", "OR[NOT[1SG],NOT[2SG]]");
    testRegexID("3j", "(1SG|)2SG", "ε", 1);
    testRegexID("3k", "|", "ε", 1);
    testRegexID("3l", "~|1SG", "ε", 1);
    testRegexID("3m", "~1SG|", "ε", 1);
    testRegexID("3n", "1SG|2SG|3SG", "OR[1SG,OR[2SG,3SG]]");
    testRegexID("3o", "(1SG|2SG)|3SG", "OR[OR[1SG,2SG],3SG]");
    testRegexID("3p", "(1|2)SG", "[OR[1,2],SG]");
    testRegexID("3q", "1|2SG", "OR[1,2SG]");
    testRegexID("3r", "1~2SG", "ε", 1);
    testRegexID("3r2", "1(~2SG)", "[1,NOT[2SG]]");
    testRegexID("3s", "1SG*", "[1S,STAR[G]]");   
    testRegexID("3t", "1SG*1SG", "[1S,STAR[G],1SG]");
    testRegexID("3u", "1SG\\*", "1SG*");   
    testRegexID("3v", "1S(G)*", "[1S,STAR[G]]");   
    testRegexID("3w", "~1SG*", "NOT[[1S,STAR[G]]]");
    testRegexID("3x", "(~1SG)*", "STAR[NOT[1SG]]");
    testRegexID("3y", "1SG|2SG*", "OR[1SG,[2S,STAR[G]]]");
    testRegexID("3z", "(1SG|2SG)*", "STAR[OR[1SG,2SG]]");
    testRegexID("3aa", "(1SG)(2SG)*", "[1SG,STAR[2SG]]"); 
    testRegexID("3bb", "(1SG)+", "PLUS[1SG]");   
    testRegexID("3cc", "1SG\\+", "1SG+");   
    testRegexID("3dd", "1S(G)+", "[1S,PLUS[G]]");   
    testRegexID("3ee", "~(1SG)+", "NOT[PLUS[1SG]]");
    testRegexID("3ff", "(~1SG)+", "PLUS[NOT[1SG]]");
    testRegexID("3gg", "1SG|(2SG)+", "OR[1SG,PLUS[2SG]]");
    testRegexID("3hh", "(1SG|2SG)+", "PLUS[OR[1SG,2SG]]");
    testRegexID("3ii", "(1SG)(2SG)+", "[1SG,PLUS[2SG]]"); 
    testRegexID("3jj", "((1SG)(2SG))+", "PLUS[1SG2SG]");
    testRegexID("3kk", "(1SG)?", "QUES[1SG]");   
    testRegexID("3kk2", "1SG?", "[1S,QUES[G]]"); 
    testRegexID("3ll", "1SG\\?", "1SG?");   
    testRegexID("3mm", "1S(G)?", "[1S,QUES[G]]");   
    testRegexID("3nn", "~(1SG)?", "NOT[QUES[1SG]]");
    testRegexID("3oo", "(~1SG)?", "QUES[NOT[1SG]]");
    testRegexID("3pp", "1SG|(2SG)?", "OR[1SG,QUES[2SG]]");
    testRegexID("3qq", "(1SG|2SG)?", "QUES[OR[1SG,2SG]]");
    testRegexID("3rr", "(1SG)(2SG)?", "[1SG,QUES[2SG]]");
    testRegexID("3ss", "1SG 2SG|3SG", "OR[1SG2SG,3SG]");
    testRegexID("3tt", "1SG|2SG 3SG", "OR[1SG,2SG3SG]");

    testRegexID("3uu", "\\|", "|");
    testRegexID("3vv", "\\*", "*");

    // regex can contain Unicode characters anywhere
    testRegexID("4a", "textε", "textε");
    testRegexID("4b", "εtext", "εtext");
    testRegexID("4c", "नमस्ते", "नमस्ते");
    testRegexID("4d", "Привет", "Привет");
    testRegexID("4e", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
    testRegexID("4f", "οἶκος", "οἶκος");
    testRegexID("4g", "あの人", "あの人");
    testRegexID("4h", "恭喜发财", "恭喜发财");
    testRegexID("4i", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

    // regex can even contain zero-width non-joiners
    testRegexID("5", "کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

    // testing symbols inside regexes
    testRegexID("6a", "{}", "ε", 1);
    testRegexID("6b", "{ }", "ε", 1);
    testRegexID("6c", "{verb}", "verb");
    testRegexID("6d", "{_verb}", "_verb");
    testRegexID("6e", "{9verb}", "ε", 1);
    testRegexID("6f", "{verb intrans}", "ε", 1);
    testRegexID("6g", "{verb-intrans}", "verb-intrans");
    testRegexID("6h", "{verb*intrans}", "ε", 1);
    testRegexID("6i", "{verb.intrans}", "verb.intrans");
    testRegexID("6j", "{verb._intrans}", "verb._intrans");
    testRegexID("6k", "{verb.9intrans}", "ε", 1);
    testRegexID("6l", "{9verb.intrans}", "ε", 1);
    testRegexID("6m", "{verb.intrans.classB}", "verb.intrans.classB");
    testRegexID("6n", "{verb|noun}", "OR[verb,noun]");
    testRegexID("6o", "{verb.intrans|noun}", "OR[verb.intrans,noun]");
    testRegexID("6p", "{verb|noun.classB}", "OR[verb,noun.classB]");
    testRegexID("6q", "{verb|noun,classB}", "OR[verb,ε]", 1);
    testRegexID("6r", "{verb|noun classB}", "ε", 1);
    testRegexID("6s", "{|verb}", "ε", 1);
    testRegexID("6t", "{verb|}", "ε", 1);
    testRegexID("6u", "{|}", "ε", 1);
    testRegexID("6v", "{verb|noun|prep}", "OR[verb,OR[noun,prep]]");
    
    // valid symbol names start with letters or underscore
    testRegexID("7a", "{_verb}", "_verb");
    testRegexID("7b", "{verb_verb}", "verb_verb");
    testRegexID("7c", "{23}", "ε", 1);
    testRegexID("7d", "{23verb}", "ε", 1);

    // symbol names are allowed to contain $ @ # & ? ' " =,
    // but not at the beginning
    testRegexID("8a", "{verb$}", "verb$");
    testRegexID("8b", "{$verb}", "ε", 1);
    testRegexID("8c", "{verb@}", "verb@");
    testRegexID("8d", "{@verb}", "ε", 1);
    testRegexID("8e", "{verb#}", "verb#");
    testRegexID("8f", "{#verb}", "ε", 1);
    testRegexID("8g", "{verb&}", "verb&");
    testRegexID("8h", "{&verb}", "ε", 1);
    testRegexID("8i", "{verb?}", "ε", 1);
    testRegexID("8j", "{?verb}", "ε", 1);
    testRegexID("8k", "{verb'}", "verb'");
    testRegexID("8l", "{'verb}", "ε", 1);  
    testRegexID("8m", '{verb"}', 'verb"');
    testRegexID("8n", '{"verb}', "ε", 1); 
    testRegexID("8o", "{verb=}", "ε", 1);
    testRegexID("8p", "{=verb}", "ε", 1); 

    // symbol names may contain Unicode letters anywhere
    testRegexID("9a", "{verbε}", "verbε");
    testRegexID("9b", "{εverb}", "εverb");
    testRegexID("9c", "{नमस्ते}", "नमस्ते");
    testRegexID("9d", "{Привет}", "Привет");
    testRegexID("9e", "{ᓄᓇᕕᒃ}", "ᓄᓇᕕᒃ");
    testRegexID("9f", "{οἶκος}", "οἶκος");
    testRegexID("9g", "{あの人}", "あの人");
    testRegexID("9h", "{恭喜发财}", "恭喜发财");
    testRegexID("9i", "{ﺷﻜﺮﺍﹰ}", "ﺷﻜﺮﺍﹰ");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testRegexID("9j", "{کتاب‌ها}", "ε", 1); // contains a zero-width non-joiner

    // nesting curly brackets parses, although it causes a warning message
    testRegexID("10a", "{{verb}}", "verb", 1);
    testRegexID("10b", "{{{verb}}}", "verb", 2);

});
