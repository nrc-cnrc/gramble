import * as path from 'path';
import { testRegexID, testPlaintextID, testSymbolID } from "./testUtil";

describe(`${path.basename(module.filename)}`, function() {

    describe("Testing plaintext parsing", function() {
        testPlaintextID("", "[]");
        testPlaintextID(" ", "[]");
        testPlaintextID("()", "[()]");
        testPlaintextID("( )", "[(,)]");
        testPlaintextID("1SG", "[1SG]");
        testPlaintextID(" 1SG", "[1SG]");
        testPlaintextID("1SG ", "[1SG]");
        testPlaintextID("1 SG", "[1,SG]");
        testPlaintextID("1\\ SG", "[1 SG]");
        testPlaintextID("(1SG)", "[(1SG)]");
        testPlaintextID("(1SG", "[(1SG]");
        testPlaintextID("1SG)", "[1SG)]");
        testPlaintextID(".", "[.]");
        testPlaintextID(".*", "[.*]");
        testPlaintextID("(.)", "[(.)]");
        testPlaintextID("1SG|2SG", "[OR[1SG,2SG]]");
        testPlaintextID("1SG\\|2SG", "[1SG|2SG]");
        testPlaintextID("|1SG", "ERR");
        testPlaintextID("1SG|", "ERR");
        testPlaintextID("(1SG)|(2SG)", "[OR[(1SG),(2SG)]]");
        testPlaintextID("(1SG|2SG)", "[OR[(1SG,2SG)]]");
        testPlaintextID("|", "ERR");
        testPlaintextID("1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testPlaintextID("1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");
    
        // plaintext may contain Unicode letters anywhere

        testPlaintextID("textε", "[textε]");
        testPlaintextID("εtext", "[εtext]");
        testPlaintextID("नमस्ते", "[नमस्ते]");
        testPlaintextID("Привет", "[Привет]");
        testPlaintextID("ᓄᓇᕕᒃ", "[ᓄᓇᕕᒃ]");
        testPlaintextID("οἶκος", "[οἶκος]");
        testPlaintextID("あの人", "[あの人]");
        testPlaintextID("恭喜发财", "[恭喜发财]");
        testPlaintextID("ﺷﻜﺮﺍﹰ", "[ﺷﻜﺮﺍﹰ]");

        // plaintext can even contain zero-width non-joiners
        testPlaintextID("کتاب‌ها", "[کتاب‌ها]"); // contains a zero-width non-joiner

    });

    describe("Testing symbol parsing", function() {
        testSymbolID("verb", "verb");
        testSymbolID("_verb", "_verb");
        testSymbolID("9verb", "ERR");
        testSymbolID("verb verb", "ERR");
        testSymbolID("verb.intrans", "[verb,intrans]");
        testSymbolID("verb._intrans", "[verb,_intrans]");
        testSymbolID("verb.9intrans", "[verb,ERR]");
        testSymbolID("9verb.intrans", "[ERR,intrans]");
        testSymbolID("verb.intrans.classB", "[verb,[intrans,classB]]");
        testSymbolID("verb|noun", "OR[verb,noun]");
        testSymbolID("verb.intrans|noun", "OR[[verb,intrans],noun]");
        testSymbolID("verb|noun.classB", "OR[verb,[noun,classB]]");
        testSymbolID("verb|noun,classB", "OR[verb,ERR]");
        testSymbolID("verb|noun classB", "ERR");
        testSymbolID("|verb", "ERR");
        testSymbolID("verb|", "ERR");
        testSymbolID("|", "ERR");
        testSymbolID("verb|noun|prep", "OR[verb,OR[noun,prep]]");

        // valid symbol names start with letters or underscore
        testSymbolID("_verb", "_verb");
        testSymbolID("verb_verb", "verb_verb");
        testSymbolID("123", "ERR");
        testSymbolID("123verb", "ERR");

        // symbol names are allowed to contain $ @ # & ? ' " =, but not at the beginning
        testSymbolID("verb$", "verb$");
        testSymbolID("$verb", "ERR");
        testSymbolID("verb@", "verb@");
        testSymbolID("@verb", "ERR");
        testSymbolID("verb#", "verb#");
        testSymbolID("#verb", "ERR");
        testSymbolID("verb&", "verb&");
        testSymbolID("&verb", "ERR");
        testSymbolID("verb?", "verb?");
        testSymbolID("?verb", "ERR");
        testSymbolID("verb'", "verb'");
        testSymbolID("'verb", "ERR");  
        testSymbolID('verb"', 'verb"');
        testSymbolID('"verb', "ERR"); 
        testSymbolID("verb=", "verb=");
        testSymbolID("=verb", "ERR"); 

        // symbol names may contain Unicode letters anywhere
        testSymbolID("verbε", "verbε");
        testSymbolID("εverb", "εverb");
        testSymbolID("नमस्ते", "नमस्ते");
        testSymbolID("Привет", "Привет");
        testSymbolID("ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testSymbolID("οἶκος", "οἶκος");
        testSymbolID("あの人", "あの人");
        testSymbolID("恭喜发财", "恭喜发财");
        testSymbolID("ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testSymbolID("کتاب‌ها", "ERR"); // contains a zero-width non-joiner
    });

    describe("Testing regex parsing", function() {
        testRegexID("", "[]");
        testRegexID(" ", "[]");
        testRegexID("()", "[[]]");
        testRegexID("( )", "[[]]");
        testRegexID("1SG", "[1SG]");
        testRegexID(" 1SG", "[1SG]");
        testRegexID("1SG ", "[1SG]");
        testRegexID("1 SG", "[1,SG]");
        testRegexID("1\\ SG", "[1 SG]");
        testRegexID("(1SG)", "[[1SG]]");
        testRegexID("(1SG", "ERR");
        testRegexID("1SG)", "ERR");
        testRegexID(".", "[DOT]");
        testRegexID(".*", "[STAR[DOT]]");
        testRegexID("(.)", "[[DOT]]");
        testRegexID(".SG", "[DOT,SG]");
        testRegexID(".SG*", "[DOT,STAR[SG]]");
        testRegexID("(.SG)*", "[STAR[[DOT,SG]]]");
        testRegexID("\\\\1SG", "[\\1SG]");
        testRegexID("\\(1SG", "[(1SG]");
        testRegexID("1SG\\)", "[1SG)]");
        testRegexID("((1SG))", "[[[1SG]]]");
        testRegexID("~1SG", "[NOT[1SG]]");
        testRegexID("\\~1SG", "[~1SG]");
        testRegexID("~ 1SG", "[NOT[1SG]]");
        testRegexID("~", "ERR");    
        testRegexID('1SG~', "ERR");
        testRegexID("~(1SG)", "[NOT[[1SG]]]");
        testRegexID("(~1SG)", "[[NOT[1SG]]]");
        testRegexID("1SG|2SG", "[OR[1SG,2SG]]");
        testRegexID("1SG\\|2SG", "[1SG|2SG]");
        testRegexID("|1SG", "ERR");
        testRegexID("1SG|", "ERR");
        testRegexID("1SG|()", "[OR[1SG,[]]]");
        testRegexID("()|2SG", "[OR[[],2SG]]");
        testRegexID("(1SG)|(2SG)", "[OR[[1SG],[2SG]]]");
        testRegexID("(1SG|2SG)", "[[OR[1SG,2SG]]]");
        testRegexID("~(1SG|2SG)", "[NOT[[OR[1SG,2SG]]]]");
        testRegexID("(1SG|)2SG", "ERR");
        testRegexID("|", "ERR");
        testRegexID("~|1SG", "ERR");
        testRegexID("~1SG|", "ERR");
        testRegexID("1SG|2SG|3SG", "[OR[1SG,OR[2SG,3SG]]]");
        testRegexID("(1SG|2SG)|3SG", "[OR[[OR[1SG,2SG]],3SG]]");
        testRegexID("(1)(SG)", "[[1],[SG]]");
        testRegexID("(1|2)SG", "[[OR[1,2]],SG]");
        testRegexID("1|2SG", "[OR[1,2SG]]");
        testRegexID("1~2SG", "[1,NOT[2SG]]");
        testRegexID("1SG*", "[STAR[1SG]]");   
        testRegexID("1SG*1SG", "[STAR[1SG],1SG]");
        testRegexID("1SG\\*", "[1SG*]");   
        testRegexID("1S(G)*", "[1S,STAR[[G]]]");   
        testRegexID("~1SG*", "[NOT[STAR[1SG]]]");
        testRegexID("(~1SG)*", "[STAR[[NOT[1SG]]]]");
        testRegexID("1SG|2SG*", "[OR[1SG,STAR[2SG]]]");
        testRegexID("(1SG|2SG)*", "[STAR[[OR[1SG,2SG]]]]");
        testRegexID("(1SG)(2SG)*", "[[1SG],STAR[[2SG]]]"); 
        testRegexID("1SG+", "[PLUS[1SG]]");   
        testRegexID("1SG\\+", "[1SG+]");   
        testRegexID("1S(G)+", "[1S,PLUS[[G]]]");   
        testRegexID("~1SG+", "[NOT[PLUS[1SG]]]");
        testRegexID("(~1SG)+", "[PLUS[[NOT[1SG]]]]");
        testRegexID("1SG|2SG+", "[OR[1SG,PLUS[2SG]]]");
        testRegexID("(1SG|2SG)+", "[PLUS[[OR[1SG,2SG]]]]");
        testRegexID("(1SG)(2SG)+", "[[1SG],PLUS[[2SG]]]"); 
        testRegexID("((1SG)(2SG))+", "[PLUS[[[1SG],[2SG]]]]");
        testRegexID("1SG?", "[QUES[1SG]]");   
        testRegexID("1SG\\?", "[1SG?]");   
        testRegexID("1S(G)?", "[1S,QUES[[G]]]");   
        testRegexID("~1SG?", "[NOT[QUES[1SG]]]");
        testRegexID("(~1SG)?", "[QUES[[NOT[1SG]]]]");
        testRegexID("1SG|2SG?", "[OR[1SG,QUES[2SG]]]");
        testRegexID("(1SG|2SG)?", "[QUES[[OR[1SG,2SG]]]]");
        testRegexID("(1SG)(2SG)?", "[[1SG],QUES[[2SG]]]");
        testRegexID("1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testRegexID("1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");

        // regex can contain Unicode characters anywhere
        testRegexID("textε", "[textε]");
        testRegexID("εtext", "[εtext]");
        testRegexID("नमस्ते", "[नमस्ते]");
        testRegexID("Привет", "[Привет]");
        testRegexID("ᓄᓇᕕᒃ", "[ᓄᓇᕕᒃ]");
        testRegexID("οἶκος", "[οἶκος]");
        testRegexID("あの人", "[あの人]");
        testRegexID("恭喜发财", "[恭喜发财]");
        testRegexID("ﺷﻜﺮﺍﹰ", "[ﺷﻜﺮﺍﹰ]");

        // regex can even contain zero-width non-joiners
        testRegexID("کتاب‌ها", "[کتاب‌ها]"); // contains a zero-width non-joiner

    }); 
});