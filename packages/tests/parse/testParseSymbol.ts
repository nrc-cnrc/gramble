import { testSymbolID } from "./testParseUtils.js";

describe(`Parse symbol`, function() {

    //basics
    testSymbolID("1a", "verb", "(embed verb)");
    testSymbolID("1b", "_verb", "(embed _verb)");
    testSymbolID("1c", "6verb", "ε", 1);
    testSymbolID("1d", "verb intrans", "ε", 1);
    testSymbolID("1e", "verb-intrans", "(embed verb-intrans)");
    testSymbolID("1f", "verb*intrans", "ε", 1);

    // testing dots
    testSymbolID("2a", "verb.intrans", "(embed verb.intrans)");
    testSymbolID("2b", "verb._intrans", "(embed verb._intrans)");
    testSymbolID("2c", "verb.6intrans", "ε", 1);
    testSymbolID("2d", "6verb.intrans", "ε", 1);
    testSymbolID("2e", "verb.intrans.classB", "(embed verb.intrans.classB)");
    testSymbolID("2a", "verb\\.intrans", "ε", 1);
    
    // testing alternation
    testSymbolID("3a", "verb|noun", "(alt (embed verb) (embed noun))");
    testSymbolID("3b", "verb.intrans|noun", "(alt (embed verb.intrans) (embed noun))");
    testSymbolID("3c", "verb|noun.classB", "(alt (embed verb) (embed noun.classB))");
    testSymbolID("3d", "verb|noun,classB", "(alt (embed verb) ε)", 1);
    testSymbolID("3e", "verb|noun classB", "ε", 1);
    testSymbolID("3f", "|verb", "ε", 1);
    testSymbolID("3g", "verb|", "ε", 1);
    testSymbolID("3h", "|", "ε", 1);
    testSymbolID("3i", "verb|noun|prep", "(alt (embed verb) (alt (embed noun) (embed prep)))");

    // valid symbol names start with letters or underscore
    testSymbolID("4a", "_verb", "(embed _verb)");
    testSymbolID("4b", "verb_verb", "(embed verb_verb)");
    testSymbolID("4c", "123", "ε", 1);
    testSymbolID("4d", "123verb", "ε", 1);

    // symbol names are allowed to contain $ @ # - ' ", but not at the beginning
    testSymbolID("5a", "verb$", "(embed verb$)");
    testSymbolID("5b", "$verb", "ε", 1);
    testSymbolID("5c", "verb@", "(embed verb@)");
    testSymbolID("5d", "@verb", "ε", 1);
    testSymbolID("5e", "verb#", "(embed verb#)");
    testSymbolID("5f", "#verb", "ε", 1);
    testSymbolID("5g", "verb-", "(embed verb-)");
    testSymbolID("5h", "-verb", "ε", 1);
    testSymbolID("5i", "verb'", "(embed verb')");
    testSymbolID("5j", "'verb", "ε", 1);  
    testSymbolID("5k", 'verb"', '(embed verb")');
    testSymbolID("5l", '"verb', "ε", 1); 

    // even if they're escaped
    testSymbolID("5q", "\\$verb", "ε", 1);

    // symbol names cannot contain ? = * + & ! \
    testSymbolID("6a", "verb?", "ε", 1);
    testSymbolID("6b", "?verb", "ε", 1);
    testSymbolID("6c", "verb=", "ε", 1);
    testSymbolID("6d", "=verb", "ε", 1);
    testSymbolID("6e", "verb*", "ε", 1);
    testSymbolID("6f", "*verb", "ε", 1);
    testSymbolID("6g", "verb+", "ε", 1);
    testSymbolID("6h", "+verb", "ε", 1);
    testSymbolID("6i", "verb&", "ε", 1);
    testSymbolID("6j", "&verb", "ε", 1);
    testSymbolID("6k", "verb!", "ε", 1);
    testSymbolID("6l", "!verb", "ε", 1);
    testSymbolID("6m", "verb\\\\", "ε", 1);
    testSymbolID("6n", "\\\\verb", "ε", 1);

    // symbol names may contain Unicode letters anywhere
    testSymbolID("7a", "verbε", "(embed verbε)");
    testSymbolID("7b", "εverb", "(embed εverb)");
    testSymbolID("7c", "नमस्ते", "(embed नमस्ते)");
    testSymbolID("7d", "Привет", "(embed Привет)");
    testSymbolID("7e", "ᓄᓇᕕᒃ", "(embed ᓄᓇᕕᒃ)");
    testSymbolID("7f", "οἶκος", "(embed οἶκος)");
    testSymbolID("7g", "あの人", "(embed あの人)");
    testSymbolID("7h", "恭喜发财", "(embed 恭喜发财)");
    testSymbolID("7i", "ﺷﻜﺮﺍﹰ", "(embed ﺷﻜﺮﺍﹰ)");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testSymbolID("7j", "کتاب‌ها", "ε", 1); // contains a zero-width non-joiner

    // putting curly braces around a verb should parse, but it fires
    // a warning message
    testSymbolID("8", "{verb}", "(embed verb)", 1);

});
