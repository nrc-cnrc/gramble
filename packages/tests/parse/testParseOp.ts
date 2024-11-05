import { testOpID } from "./testParseUtils.js";

describe(`Parse op`, function() {

    testOpID("1a", "verb=", "(symbol verb)");
    testOpID("1b", "verb =", "(symbol verb)");
    testOpID("1c", " verb =", "(symbol verb)");
    testOpID("1d", "\\verb=", "(symbol verb)");
    testOpID("1e", "ve\\rb=", "(symbol verb)");
    testOpID("1f", "table:", "(table)");
    testOpID("1g", "or:", "(or)");
    testOpID("1h", "join:", "(join)");
    testOpID("1i", "test:", "(test)");
    testOpID("1j", "testnot:", "(testnot)");
    testOpID("1k", "replace:", "(error)");
    testOpID("1l", "replace text:", "(replace (symbol text))");
    
    // empty ops
    testOpID("2a", ":", "(error)");
    testOpID("2b", "=", "(error)");

    // not having a colon, or having an equals is invalid for ops
    testOpID("3a", "table", "(error)");
    testOpID("3b", "or", "(error)");
    testOpID("3c", "join", "(error)");
    testOpID("3d", "test", "(error)");
    testOpID("3e", "testnot", "(error)");
    testOpID("3f", "replace", "(error)");
    testOpID("3g", "replace text", "(error)");
    testOpID("3h", "table=", "(error)");
    testOpID("3i", "or=", "(error)");
    testOpID("3j", "join=", "(error)");
    testOpID("3k", "test=", "(error)");
    testOpID("3l", "testnot=", "(error)");
    testOpID("3m", "replace=", "(error)");
    testOpID("3n", "replace text=", "(error)");

    // replace with invalid tape name is invalid
    testOpID("4a", "replace 9text:", "(replace (error))");

    // empty op is invalid
    testOpID("5a", "", "(error)");
    testOpID("5b", ":", "(error)");
    testOpID("5c", "=", "(error)");

    // invalid because they contain symbols not used in headers nor in valid identifiers
    testOpID("5d", "verb,verb=", "(error)");
    testOpID("5e", "verb, verb=", "(error)");
    testOpID("5f", "verb,:", "(error)");
    testOpID("5g", ",verb=", "(error)");
    testOpID("5h", ".verb=", "(error)");
    testOpID("5i", "verb.verb=", "(error)");
    testOpID("5j", "verb;verb=", "(error)");
    testOpID("5k", "verb=verb=", "(error)");     
    testOpID("5l", "verb%verb=", "(error)");
    testOpID("5m", "verb verb=", "(error)");
    testOpID("5n", "verb\\ verb=", "(error)");
    testOpID("5o", "[verb):", "(error)");
    testOpID("5p", "<verb=", "(error)");

    // double colon or equals at end is invalid
    testOpID("6a", "verb==", "(error)");
    testOpID("6b", "test::", "(error)");
    testOpID("6c", "test=:", "(error)");
    testOpID("6d", "test:=", "(error)");

    // valid symbol names start with letters or underscore
    testOpID("7a", "_verb=", "(symbol _verb)");
    testOpID("7b", "verb_verb=", "(symbol verb_verb)");
    testOpID("7c", "123:", "(error)");
    testOpID("7d", "123verb=", "(error)");

    // symbol names are allowed to contain - $ @ # & ' ", but not at the beginning

    testOpID("8a", "verb-=", "(symbol verb-)");
    testOpID("8b", "ve-rb=", "(symbol ve-rb)");
    testOpID("8c", "-verb=", "(error)");
    testOpID("8d", "verb$=", "(symbol verb$)");
    testOpID("8e", "$verb=", "(error)");
    testOpID("8f", "verb@=", "(symbol verb@)");
    testOpID("8g", "@verb=", "(error)");
    testOpID("8h", "verb#=", "(symbol verb#)");
    testOpID("8i", "#verb=", "(error)");
    testOpID("8j", "verb&=", "(symbol verb&)");
    testOpID("8k", "&verb=", "(error)");
    testOpID("8l", "verb'=", "(symbol verb')");
    testOpID("8m", "'verb=", "(error)");  
    testOpID("8n", 'verb"=', '(symbol verb")');
    testOpID("8o", '"verb=', "(error)"); 

    // symbol names cannot contain = ? + * :
    testOpID("9a", "=verb=", "(error)"); 
    testOpID("9b", "verb?=", "(error)");
    testOpID("9c", "?verb=", "(error)");
    testOpID("9d", "verb+=", "(error)");
    testOpID("9e", "+verb=", "(error)"); 
    testOpID("9f", "verb*=", "(error)");
    testOpID("9g", "*verb=", "(error)");
    testOpID("9h", ":verb=", "(error)");

    // symbol names may contain Unicode letters anywhere
    testOpID("10a", "verbε=", "(symbol verbε)");
    testOpID("10b", "εverb=", "(symbol εverb)");
    testOpID("10c", "नमस्ते=", "(symbol नमस्ते)");
    testOpID("10d", "Привет=", "(symbol Привет)");
    testOpID("10e", "ᓄᓇᕕᒃ=", "(symbol ᓄᓇᕕᒃ)");
    testOpID("10f", "οἶκος=", "(symbol οἶκος)");
    testOpID("10g", "あの人=", "(symbol あの人)");
    testOpID("10h", "恭喜发财=", "(symbol 恭喜发财)");
    testOpID("10i", "ﺷﻜﺮﺍﹰ=", "(symbol ﺷﻜﺮﺍﹰ)");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testOpID("10j", "کتاب‌ها=", "(error)"); // contains a zero-width non-joiner
});
