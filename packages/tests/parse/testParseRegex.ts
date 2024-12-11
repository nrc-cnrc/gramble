import { testRegexID } from "./testParseUtils.js";

describe(`Parse regex`, function() {

    testRegexID("1a", "", "ε");
    testRegexID("1b", " ", "ε");
    testRegexID("1c", "()", "ε");
    testRegexID("1d", "( )", "ε");
    testRegexID("1e", "1SG", "1SG");
    testRegexID("1f", " 1SG", "1SG");
    testRegexID("1g", "1SG ", "1SG");
    testRegexID("1h", "1 SG", "1SG");
    testRegexID("1i", "1\\ SG", "1 SG");
    testRegexID("1j", "(1SG)", "1SG");
    testRegexID("1k", "(1SG", "ε", 1);
    testRegexID("1l", "1SG)", "ε", 1);
    testRegexID("1m", ".", ".");
    testRegexID("1n", ".*", "(star .)");
    testRegexID("1o", "(.)", ".");
    testRegexID("1p", ".SG", "(seq . SG)");
    testRegexID("1q", ".SG*", "(seq . S (star G))");
    testRegexID("1r", "(.SG)*", "(star (seq . SG))");
    testRegexID("1s", "\\\\1SG", "\\1SG");
    testRegexID("1t", "\\(1SG", "(1SG");
    testRegexID("1u", "1SG\\)", "1SG)");
    testRegexID("1v", "((1SG))", "1SG");
    testRegexID("1w", "(1)(SG)", "1SG");

    testRegexID("2a", "~1SG", "(not 1SG)");
    testRegexID("2b", "\\~1SG", "~1SG");
    testRegexID("2c", "~ 1SG", "(not 1SG)");
    testRegexID("2d", "~", "ε", 1);    
    testRegexID("2e", "~()", "(not ε)");    
    testRegexID("2f", '1SG~', "ε", 1);
    testRegexID("2g", "~(1SG)", "(not 1SG)");
    testRegexID("2h", "(~1SG)", "(not 1SG)");

    testRegexID("3a", "1SG|2SG", "(alt 1SG 2SG)");
    testRegexID("3b", "1SG\\|2SG", "1SG|2SG");
    testRegexID("3c", "|1SG", "ε", 1);
    testRegexID("3d", "1SG|", "ε", 1);
    testRegexID("3e", "1SG|()", "(alt 1SG ε)");
    testRegexID("3f", "()|2SG", "(alt ε 2SG)");
    testRegexID("3g", "(1SG)|(2SG)", "(alt 1SG 2SG)");
    testRegexID("3h", "(1SG|2SG)", "(alt 1SG 2SG)");
    testRegexID("3i", "~(1SG|2SG)", "(not (alt 1SG 2SG))");
    testRegexID("3i2", "(~1SG|~2SG)", "(alt (not 1SG) (not 2SG))");
    testRegexID("3j", "(1SG|)2SG", "ε", 1);
    testRegexID("3k", "|", "ε", 1);
    testRegexID("3l", "~|1SG", "ε", 1);
    testRegexID("3m", "~1SG|", "ε", 1);
    testRegexID("3n", "1SG|2SG|3SG", "(alt 1SG (alt 2SG 3SG))");
    testRegexID("3o", "(1SG|2SG)|3SG", "(alt (alt 1SG 2SG) 3SG)");
    testRegexID("3p", "(1|2)SG", "(seq (alt 1 2) SG)");
    testRegexID("3q", "1|2SG", "(alt 1 2SG)");
    testRegexID("3r", "1~2SG", "ε", 1);
    testRegexID("3r2", "1(~2SG)", "(seq 1 (not 2SG))");
    testRegexID("3s", "1SG*", "(seq 1S (star G))");   
    testRegexID("3t", "1SG*1SG", "(seq 1S (star G) 1SG)");
    testRegexID("3u", "1SG\\*", "1SG*");   
    testRegexID("3v", "1S(G)*", "(seq 1S (star G))");   
    testRegexID("3w", "~1SG*", "(not (seq 1S (star G)))");
    testRegexID("3x", "(~1SG)*", "(star (not 1SG))");
    testRegexID("3y", "1SG|2SG*", "(alt 1SG (seq 2S (star G)))");
    testRegexID("3z", "(1SG|2SG)*", "(star (alt 1SG 2SG))");
    testRegexID("3aa", "(1SG)(2SG)*", "(seq 1SG (star 2SG))"); 
    testRegexID("3bb", "(1SG)+", "(plus 1SG)");   
    testRegexID("3cc", "1SG\\+", "1SG+");   
    testRegexID("3dd", "1S(G)+", "(seq 1S (plus G))");   
    testRegexID("3ee", "~(1SG)+", "(not (plus 1SG))");
    testRegexID("3ff", "(~1SG)+", "(plus (not 1SG))");
    testRegexID("3gg", "1SG|(2SG)+", "(alt 1SG (plus 2SG))");
    testRegexID("3hh", "(1SG|2SG)+", "(plus (alt 1SG 2SG))");
    testRegexID("3ii", "(1SG)(2SG)+", "(seq 1SG (plus 2SG))"); 
    testRegexID("3jj", "((1SG)(2SG))+", "(plus 1SG2SG)");
    testRegexID("3kk", "(1SG)?", "(ques 1SG)");   
    testRegexID("3kk2", "1SG?", "(seq 1S (ques G))"); 
    testRegexID("3ll", "1SG\\?", "1SG?");   
    testRegexID("3mm", "1S(G)?", "(seq 1S (ques G))");   
    testRegexID("3nn", "~(1SG)?", "(not (ques 1SG))");
    testRegexID("3oo", "(~1SG)?", "(ques (not 1SG))");
    testRegexID("3pp", "1SG|(2SG)?", "(alt 1SG (ques 2SG))");
    testRegexID("3qq", "(1SG|2SG)?", "(ques (alt 1SG 2SG))");
    testRegexID("3rr", "(1SG)(2SG)?", "(seq 1SG (ques 2SG))");
    testRegexID("3ss", "1SG 2SG|3SG", "(alt 1SG2SG 3SG)");
    testRegexID("3tt", "1SG|2SG 3SG", "(alt 1SG 2SG3SG)");

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
    testRegexID("6c", "{verb}", "(embed verb)");
    testRegexID("6d", "{_verb}", "(embed _verb)");
    testRegexID("6e", "{9verb}", "ε", 1);
    testRegexID("6f", "{verb intrans}", "ε", 1);
    testRegexID("6g", "{verb-intrans}", "(embed verb-intrans)");
    testRegexID("6h", "{verb*intrans}", "ε", 1);
    testRegexID("6i", "{verb.intrans}", "(embed verb.intrans)");
    testRegexID("6j", "{verb._intrans}", "(embed verb._intrans)");
    testRegexID("6k", "{verb.9intrans}", "ε", 1);
    testRegexID("6l", "{9verb.intrans}", "ε", 1);
    testRegexID("6m", "{verb.intrans.classB}", "(embed verb.intrans.classB)");
    testRegexID("6n", "{verb|noun}", "(alt (embed verb) (embed noun))");
    testRegexID("6o", "{verb.intrans|noun}", "(alt (embed verb.intrans) (embed noun))");
    testRegexID("6p", "{verb|noun.classB}", "(alt (embed verb) (embed noun.classB))");
    testRegexID("6q", "{verb|noun,classB}", "(alt (embed verb) ε)", 1);
    testRegexID("6r", "{verb|noun classB}", "ε", 1);
    testRegexID("6s", "{|verb}", "ε", 1);
    testRegexID("6t", "{verb|}", "ε", 1);
    testRegexID("6u", "{|}", "ε", 1);
    testRegexID("6v", "{verb|noun|prep}", "(alt (embed verb) (alt (embed noun) (embed prep)))");
    
    // valid symbol names start with letters or underscore
    testRegexID("7a", "{_verb}", "(embed _verb)");
    testRegexID("7b", "{verb_verb}", "(embed verb_verb)");
    testRegexID("7c", "{23}", "ε", 1);
    testRegexID("7d", "{23verb}", "ε", 1);

    // symbol names are allowed to contain $ @ # - ' ", but not at the beginning
    testRegexID("8a", "{verb$}", "(embed verb$)");
    testRegexID("8b", "{$verb}", "ε", 1);
    testRegexID("8c", "{verb@}", "(embed verb@)");
    testRegexID("8d", "{@verb}", "ε", 1);
    testRegexID("8e", "{verb#}", "(embed verb#)");
    testRegexID("8f", "{#verb}", "ε", 1);
    testRegexID("8g", "{verb-}", "(embed verb-)");
    testRegexID("8h", "{-verb}", "ε", 1);
    testRegexID("8i", "{verb'}", "(embed verb')");
    testRegexID("8j", "{'verb}", "ε", 1);
    testRegexID("8k", '{verb"}', '(embed verb")');
    testRegexID("8l", '{"verb}', "ε", 1); 

    // symbol names cannot contain ? = * + & ^ \
    testRegexID("9a", "{verb?}", "ε", 1);
    testRegexID("9b", "{?verb}", "ε", 1);
    testRegexID("9c", "{verb=}", "ε", 1);
    testRegexID("9d", "{=verb}", "ε", 1);
    testRegexID("9e", "{verb*}", "ε", 1);
    testRegexID("9f", "{*verb}", "ε", 1);
    testRegexID("9g", "{verb+}", "ε", 1);
    testRegexID("9h", "{+verb}", "ε", 1);
    testRegexID("9i", "{verb&}", "ε", 1);
    testRegexID("9j", "{&verb}", "ε", 1);
    testRegexID("9k", "{verb^}", "ε", 1);
    testRegexID("9l", "{^verb}", "ε", 1);
    testRegexID("9m", "{verb\\\\}", "ε", 1);
    testRegexID("9n", "{\\\\verb}", "ε", 1);

    // symbol names may contain Unicode letters anywhere
    testRegexID("10a", "{verbε}", "(embed verbε)");
    testRegexID("10b", "{εverb}", "(embed εverb)");
    testRegexID("10c", "{नमस्ते}", "(embed नमस्ते)");
    testRegexID("10d", "{Привет}", "(embed Привет)");
    testRegexID("10e", "{ᓄᓇᕕᒃ}", "(embed ᓄᓇᕕᒃ)");
    testRegexID("10f", "{οἶκος}", "(embed οἶκος)");
    testRegexID("10g", "{あの人}", "(embed あの人)");
    testRegexID("10h", "{恭喜发财}", "(embed 恭喜发财)");
    testRegexID("10i", "{ﺷﻜﺮﺍﹰ}", "(embed ﺷﻜﺮﺍﹰ)");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testRegexID("10j", "{کتاب‌ها}", "ε", 1); // contains a zero-width non-joiner

    // nesting curly brackets parses, although it causes a warning message
    testRegexID("11a", "{{verb}}", "(embed verb)", 1);
    testRegexID("11b", "{{{verb}}}", "(embed verb)", 2);

});
