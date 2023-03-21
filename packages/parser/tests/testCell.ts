import * as path from 'path';

import { testRegexID, testPlaintextID, testSymbolID } from "./testUtil";


describe(`${path.basename(module.filename)}`, function() {

    describe("Testing plaintext parsing", function() {
        testPlaintextID("", "");
        testPlaintextID(" ", "");
        testPlaintextID("()", "()");
        testPlaintextID("( )", "[(,)]");
        testPlaintextID("1SG", "1SG");
        testPlaintextID(" 1SG", "1SG");
        testPlaintextID("1SG ", "1SG");
        testPlaintextID("1 SG", "[1,SG]");
        testPlaintextID("1\\ SG", "1 SG");
        testPlaintextID("(1SG)", "(1SG)");
        testPlaintextID("(1SG", "(1SG");
        testPlaintextID("1SG)", "1SG)");
        testPlaintextID(".", ".");
        testPlaintextID(".*", ".*");
        testPlaintextID("(.)", "(.)");
        testPlaintextID("1SG|2SG", "OR[1SG,2SG]");
        testPlaintextID("1SG\\|2SG", "1SG|2SG");
        testPlaintextID("|1SG", "ε", 1);
        testPlaintextID("1SG|", "ε", 1);
        testPlaintextID("(1SG)|(2SG)", "OR[(1SG),(2SG)]");
        testPlaintextID("(1SG|2SG)", "OR[(1SG,2SG)]");
        testPlaintextID("|", "ε", 1);
        testPlaintextID("1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testPlaintextID("1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");
    
        // plaintext may contain Unicode letters anywhere

        testPlaintextID("textε", "textε");
        testPlaintextID("εtext", "εtext");
        testPlaintextID("नमस्ते", "नमस्ते");
        testPlaintextID("Привет", "Привет");
        testPlaintextID("ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testPlaintextID("οἶκος", "οἶκος");
        testPlaintextID("あの人", "あの人");
        testPlaintextID("恭喜发财", "恭喜发财");
        testPlaintextID("ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // plaintext can even contain zero-width non-joiners
        testPlaintextID("کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

    });

    describe("Testing symbol parsing", function() {
        testSymbolID("verb", "verb");
        testSymbolID("_verb", "_verb");
        testSymbolID("9verb", "ε", 1);
        testSymbolID("verb intrans", "ε", 1);
        testSymbolID("verb-intrans", "verb-intrans");
        testSymbolID("verb*intrans", "ε", 1);
        testSymbolID("verb.intrans", "verb.intrans");
        testSymbolID("verb._intrans", "verb._intrans");
        testSymbolID("verb.9intrans", "ε", 1);
        testSymbolID("9verb.intrans", "ε", 1);
        testSymbolID("verb.intrans.classB", "verb.intrans.classB");
        testSymbolID("verb|noun", "OR[verb,noun]");
        testSymbolID("verb.intrans|noun", "OR[verb.intrans,noun]");
        testSymbolID("verb|noun.classB", "OR[verb,noun.classB]");
        testSymbolID("verb|noun,classB", "OR[verb,ε]", 1);
        testSymbolID("verb|noun classB", "ε", 1);
        testSymbolID("|verb", "ε", 1);
        testSymbolID("verb|", "ε", 1);
        testSymbolID("|", "ε", 1);
        testSymbolID("verb|noun|prep", "OR[verb,OR[noun,prep]]");

        // valid symbol names start with letters or underscore
        testSymbolID("_verb", "_verb");
        testSymbolID("verb_verb", "verb_verb");
        testSymbolID("123", "ε", 1);
        testSymbolID("123verb", "ε", 1);

        // symbol names are allowed to contain $ @ # & ? ' " =, but not at the beginning
        testSymbolID("verb$", "verb$");
        testSymbolID("$verb", "ε", 1);
        testSymbolID("verb@", "verb@");
        testSymbolID("@verb", "ε", 1);
        testSymbolID("verb#", "verb#");
        testSymbolID("#verb", "ε", 1);
        testSymbolID("verb&", "verb&");
        testSymbolID("&verb", "ε", 1);
        testSymbolID("verb?", "ε", 1);
        testSymbolID("?verb", "ε", 1);
        testSymbolID("verb'", "verb'");
        testSymbolID("'verb", "ε", 1);  
        testSymbolID('verb"', 'verb"');
        testSymbolID('"verb', "ε", 1); 
        testSymbolID("verb=", "ε", 1);
        testSymbolID("=verb", "ε", 1); 

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
        testSymbolID("کتاب‌ها", "ε", 1); // contains a zero-width non-joiner
    
        // putting curly braces around a verb should parse, but it fires a warning message
        testSymbolID("{verb}", "verb", 1);
    });

    describe("Testing regex parsing", function() {
        testRegexID("", "");
        testRegexID(" ", "");
        testRegexID("()", "");
        testRegexID("( )", "");
        testRegexID("1SG", "1SG");
        testRegexID(" 1SG", "1SG");
        testRegexID("1SG ", "1SG");
        testRegexID("1 SG", "[1,SG]");
        testRegexID("1\\ SG", "1 SG");
        testRegexID("(1SG)", "1SG");
        testRegexID("(1SG", "ε", 1);
        testRegexID("1SG)", "ε", 1);
        testRegexID(".", "DOT");
        testRegexID(".*", "STAR[DOT]");
        testRegexID("(.)", "DOT");
        testRegexID(".SG", "[DOT,SG]");
        testRegexID(".SG*", "[DOT,STAR[SG]]");
        testRegexID("(.SG)*", "STAR[[DOT,SG]]");
        testRegexID("\\\\1SG", "\\1SG");
        testRegexID("\\(1SG", "(1SG");
        testRegexID("1SG\\)", "1SG)");
        testRegexID("((1SG))", "1SG");
        testRegexID("~1SG", "NOT[1SG]");
        testRegexID("\\~1SG", "~1SG");
        testRegexID("~ 1SG", "NOT[1SG]");
        testRegexID("~", "ε", 1);    
        testRegexID('1SG~', "ε", 1);
        testRegexID("~(1SG)", "NOT[1SG]");
        testRegexID("(~1SG)", "NOT[1SG]");
        testRegexID("1SG|2SG", "OR[1SG,2SG]");
        testRegexID("1SG\\|2SG", "1SG|2SG");
        testRegexID("|1SG", "ε", 1);
        testRegexID("1SG|", "ε", 1);
        testRegexID("1SG|()", "OR[1SG,]");
        testRegexID("()|2SG", "OR[,2SG]");
        testRegexID("(1SG)|(2SG)", "OR[1SG,2SG]");
        testRegexID("(1SG|2SG)", "OR[1SG,2SG]");
        testRegexID("~(1SG|2SG)", "NOT[OR[1SG,2SG]]");
        testRegexID("(1SG|)2SG", "ε", 1);
        testRegexID("|", "ε", 1);
        testRegexID("~|1SG", "ε", 1);
        testRegexID("~1SG|", "ε", 1);
        testRegexID("1SG|2SG|3SG", "OR[1SG,OR[2SG,3SG]]");
        testRegexID("(1SG|2SG)|3SG", "OR[OR[1SG,2SG],3SG]");
        testRegexID("(1)(SG)", "[1,SG]");
        testRegexID("(1|2)SG", "[OR[1,2],SG]");
        testRegexID("1|2SG", "OR[1,2SG]");
        testRegexID("1~2SG", "[1,NOT[2SG]]");
        testRegexID("1SG*", "STAR[1SG]");   
        testRegexID("1SG*1SG", "[STAR[1SG],1SG]");
        testRegexID("1SG\\*", "1SG*");   
        testRegexID("1S(G)*", "[1S,STAR[G]]");   
        testRegexID("~1SG*", "NOT[STAR[1SG]]");
        testRegexID("(~1SG)*", "STAR[NOT[1SG]]");
        testRegexID("1SG|2SG*", "OR[1SG,STAR[2SG]]");
        testRegexID("(1SG|2SG)*", "STAR[OR[1SG,2SG]]");
        testRegexID("(1SG)(2SG)*", "[1SG,STAR[2SG]]"); 
        testRegexID("1SG+", "PLUS[1SG]");   
        testRegexID("1SG\\+", "1SG+");   
        testRegexID("1S(G)+", "[1S,PLUS[G]]");   
        testRegexID("~1SG+", "NOT[PLUS[1SG]]");
        testRegexID("(~1SG)+", "PLUS[NOT[1SG]]");
        testRegexID("1SG|2SG+", "OR[1SG,PLUS[2SG]]");
        testRegexID("(1SG|2SG)+", "PLUS[OR[1SG,2SG]]");
        testRegexID("(1SG)(2SG)+", "[1SG,PLUS[2SG]]"); 
        testRegexID("((1SG)(2SG))+", "PLUS[[1SG,2SG]]");
        testRegexID("1SG?", "QUES[1SG]");   
        testRegexID("1SG\\?", "1SG?");   
        testRegexID("1S(G)?", "[1S,QUES[G]]");   
        testRegexID("~1SG?", "NOT[QUES[1SG]]");
        testRegexID("(~1SG)?", "QUES[NOT[1SG]]");
        testRegexID("1SG|2SG?", "OR[1SG,QUES[2SG]]");
        testRegexID("(1SG|2SG)?", "QUES[OR[1SG,2SG]]");
        testRegexID("(1SG)(2SG)?", "[1SG,QUES[2SG]]");
        testRegexID("1SG 2SG|3SG", "[1SG,OR[2SG,3SG]]");
        testRegexID("1SG|2SG 3SG", "[OR[1SG,2SG],3SG]");

        // regex can contain Unicode characters anywhere
        testRegexID("textε", "textε");
        testRegexID("εtext", "εtext");
        testRegexID("नमस्ते", "नमस्ते");
        testRegexID("Привет", "Привет");
        testRegexID("ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
        testRegexID("οἶκος", "οἶκος");
        testRegexID("あの人", "あの人");
        testRegexID("恭喜发财", "恭喜发财");
        testRegexID("ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

        // regex can even contain zero-width non-joiners
        testRegexID("کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

        // testing symbols inside regexes
        testRegexID("{}", "ε", 1);
        testRegexID("{ }", "ε", 1);
        testRegexID("{verb}", "verb");
        testRegexID("{_verb}", "_verb");
        testRegexID("{9verb}", "ε", 1);
        testRegexID("{verb intrans}", "ε", 1);
        testRegexID("{verb-intrans}", "verb-intrans");
        testRegexID("{verb*intrans}", "ε", 1);
        testRegexID("{verb.intrans}", "verb.intrans");
        testRegexID("{verb._intrans}", "verb._intrans");
        testRegexID("{verb.9intrans}", "ε", 1);
        testRegexID("{9verb.intrans}", "ε", 1);
        testRegexID("{verb.intrans.classB}", "verb.intrans.classB");
        testRegexID("{verb|noun}", "OR[verb,noun]");
        testRegexID("{verb.intrans|noun}", "OR[verb.intrans,noun]");
        testRegexID("{verb|noun.classB}", "OR[verb,noun.classB]");
        testRegexID("{verb|noun,classB}", "OR[verb,ε]", 1);
        testRegexID("{verb|noun classB}", "ε", 1);
        testRegexID("{|verb}", "ε", 1);
        testRegexID("{verb|}", "ε", 1);
        testRegexID("{|}", "ε", 1);
        testRegexID("{verb|noun|prep}", "OR[verb,OR[noun,prep]]");
        
        // valid symbol names start with letters or underscore
        testRegexID("{_verb}", "_verb");
        testRegexID("{verb_verb}", "verb_verb");
        testRegexID("{123}", "ε", 1);
        testRegexID("{123verb}", "ε", 1);

        // symbol names are allowed to contain $ @ # & ? ' " =, but not at the beginning
        testRegexID("{verb$}", "verb$");
        testRegexID("{$verb}", "ε", 1);
        testRegexID("{verb@}", "verb@");
        testRegexID("{@verb}", "ε", 1);
        testRegexID("{verb#}", "verb#");
        testRegexID("{#verb}", "ε", 1);
        testRegexID("{verb&}", "verb&");
        testRegexID("{&verb}", "ε", 1);
        testRegexID("{verb?}", "ε", 1);
        testRegexID("{?verb}", "ε", 1);
        testRegexID("{verb'}", "verb'");
        testRegexID("{'verb}", "ε", 1);  
        testRegexID('{verb"}', 'verb"');
        testRegexID('{"verb}', "ε", 1); 
        testRegexID("{verb=}", "ε", 1);
        testRegexID("{=verb}", "ε", 1); 

        // symbol names may contain Unicode letters anywhere
        testRegexID("{verbε}", "verbε");
        testRegexID("{εverb}", "εverb");
        testRegexID("{नमस्ते}", "नमस्ते");
        testRegexID("{Привет}", "Привет");
        testRegexID("{ᓄᓇᕕᒃ}", "ᓄᓇᕕᒃ");
        testRegexID("{οἶκος}", "οἶκος");
        testRegexID("{あの人}", "あの人");
        testRegexID("{恭喜发财}", "恭喜发财");
        testRegexID("{ﺷﻜﺮﺍﹰ}", "ﺷﻜﺮﺍﹰ");

        // but only in certain classes; e.g. zero-width non-joiners are invalid
        testRegexID("{کتاب‌ها}", "ε", 1); // contains a zero-width non-joiner
    
        // nesting curly brackets parses, although it causes a warning message
        testRegexID("{{verb}}", "verb", 1);
        testRegexID("{{{verb}}}", "verb", 2);
    }); 
});