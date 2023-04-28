import {
    testSuiteName, 
    logTestSuite,
    testSymbolID
} from "../testUtil";

describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    //basics
    testSymbolID("1a", "verb", "verb");
    testSymbolID("1b", "_verb", "_verb");
    testSymbolID("1c", "6verb", "ε", 1);
    testSymbolID("1d", "verb intrans", "ε", 1);
    testSymbolID("1e", "verb-intrans", "verb-intrans");
    testSymbolID("1f", "verb*intrans", "ε", 1);

    // testing dots
    testSymbolID("2a", "verb.intrans", "verb.intrans");
    testSymbolID("2b", "verb._intrans", "verb._intrans");
    testSymbolID("2c", "verb.6intrans", "ε", 1);
    testSymbolID("2d", "6verb.intrans", "ε", 1);
    testSymbolID("2e", "verb.intrans.classB", "verb.intrans.classB");
    testSymbolID("2a", "verb\\.intrans", "ε", 1);
    
    // testing alternation
    testSymbolID("3a", "verb|noun", "OR[verb,noun]");
    testSymbolID("3b", "verb.intrans|noun", "OR[verb.intrans,noun]");
    testSymbolID("3c", "verb|noun.classB", "OR[verb,noun.classB]");
    testSymbolID("3d", "verb|noun,classB", "OR[verb,ε]", 1);
    testSymbolID("3e", "verb|noun classB", "ε", 1);
    testSymbolID("3f", "|verb", "ε", 1);
    testSymbolID("3g", "verb|", "ε", 1);
    testSymbolID("3h", "|", "ε", 1);
    testSymbolID("3i", "verb|noun|prep", "OR[verb,OR[noun,prep]]");

    // valid symbol names start with letters or underscore
    testSymbolID("4a", "_verb", "_verb");
    testSymbolID("4b", "verb_verb", "verb_verb");
    testSymbolID("4c", "123", "ε", 1);
    testSymbolID("4d", "123verb", "ε", 1);

    // symbol names are allowed to contain $ @ # & ? ' " =,
    // but not at the beginning
    testSymbolID("5a", "verb$", "verb$");
    testSymbolID("5b", "$verb", "ε", 1);
    testSymbolID("5c", "verb@", "verb@");
    testSymbolID("5d", "@verb", "ε", 1);
    testSymbolID("5e", "verb#", "verb#");
    testSymbolID("5f", "#verb", "ε", 1);
    testSymbolID("5g", "verb&", "verb&");
    testSymbolID("5h", "&verb", "ε", 1);
    testSymbolID("5i", "verb?", "ε", 1);
    testSymbolID("5j", "?verb", "ε", 1);
    testSymbolID("5k", "verb'", "verb'");
    testSymbolID("5l", "'verb", "ε", 1);  
    testSymbolID("5m", 'verb"', 'verb"');
    testSymbolID("5n", '"verb', "ε", 1); 
    testSymbolID("5o", "verb=", "ε", 1);
    testSymbolID("5p", "=verb", "ε", 1); 

    // even if they're escaped
    testSymbolID("5q", "\\$verb", "ε", 1);

    // symbol names may contain Unicode letters anywhere
    testSymbolID("6a", "verbε", "verbε");
    testSymbolID("6b", "εverb", "εverb");
    testSymbolID("6c", "नमस्ते", "नमस्ते");
    testSymbolID("6d", "Привет", "Привет");
    testSymbolID("6e", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
    testSymbolID("6f", "οἶκος", "οἶκος");
    testSymbolID("6g", "あの人", "あの人");
    testSymbolID("6h", "恭喜发财", "恭喜发财");
    testSymbolID("6i", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testSymbolID("6j", "کتاب‌ها", "ε", 1); // contains a zero-width non-joiner

    // putting curly braces around a verb should parse, but it fires
    // a warning message
    testSymbolID("7", "{verb}", "verb", 1);

});