import { testOpID } from "./testParseUtils";

describe(`Parse op`, function() {

    testOpID("1a", "verb=", "verb");
    testOpID("1b", "verb =", "verb");
    testOpID("1c", " verb =", "verb");
    testOpID("1d", "\\verb=", "verb");
    testOpID("1e", "ve\\rb=", "verb");
    testOpID("1f", "table:", "table");
    testOpID("1g", "or:", "or");
    testOpID("1h", "join:", "join");
    testOpID("1i", "test:", "test");
    testOpID("1j", "testnot:", "testnot");
    testOpID("1k", "replace:", "ERR");
    testOpID("1l", "replace text:", "replace[text]");
    
    // empty ops
    testOpID("2a", ":", "ERR");
    testOpID("2b", "=", "ERR");

    // not having a colon, or having an equals is invalid for ops
    testOpID("3a", "table", "ERR");
    testOpID("3b", "or", "ERR");
    testOpID("3c", "join", "ERR");
    testOpID("3d", "test", "ERR");
    testOpID("3e", "testnot", "ERR");
    testOpID("3f", "replace", "ERR");
    testOpID("3g", "replace text", "ERR");
    testOpID("3h", "table=", "ERR");
    testOpID("3i", "or=", "ERR");
    testOpID("3j", "join=", "ERR");
    testOpID("3k", "test=", "ERR");
    testOpID("3l", "testnot=", "ERR");
    testOpID("3m", "replace=", "ERR");
    testOpID("3n", "replace text=", "ERR");

    // replace with invalid tape name is invalid
    testOpID("4a", "replace 9text:", "replace[ERR]");

    // empty op is invalid
    testOpID("5a", "", "ERR");
    testOpID("5b", ":", "ERR");
    testOpID("5c", "=", "ERR");

    // invalid because they contain symbols not used in headers nor in valid identifiers
    testOpID("5d", "verb,verb=", "ERR");
    testOpID("5e", "verb, verb=", "ERR");
    testOpID("5f", "verb,:", "ERR");
    testOpID("5g", ",verb=", "ERR");
    testOpID("5h", ".verb=", "ERR");
    testOpID("5i", "verb.verb=", "ERR");
    testOpID("5j", "verb;verb=", "ERR");
    testOpID("5k", "verb=verb=", "ERR");     
    testOpID("5l", "verb%verb=", "ERR");
    testOpID("5m", "verb verb=", "ERR");
    testOpID("5n", "verb\\ verb=", "ERR");
    testOpID("5o", "[verb]:", "ERR");
    testOpID("5p", "<verb=", "ERR");

    // double colon or equals at end is invalid
    testOpID("6a", "verb==", "ERR");
    testOpID("6b", "test::", "ERR");
    testOpID("6c", "test=:", "ERR");
    testOpID("6d", "test:=", "ERR");

    // valid symbol names start with letters or underscore
    testOpID("7a", "_verb=", "_verb");
    testOpID("7b", "verb_verb=", "verb_verb");
    testOpID("7c", "123:", "ERR");
    testOpID("7d", "123verb=", "ERR");

    // symbol names are allowed to contain - $ @ # & ' ", but not at the beginning

    testOpID("8a", "verb-=", "verb-");
    testOpID("8b", "ve-rb=", "ve-rb");
    testOpID("8c", "-verb=", "ERR");
    testOpID("8d", "verb$=", "verb$");
    testOpID("8e", "$verb=", "ERR");
    testOpID("8f", "verb@=", "verb@");
    testOpID("8g", "@verb=", "ERR");
    testOpID("8h", "verb#=", "verb#");
    testOpID("8i", "#verb=", "ERR");
    testOpID("8j", "verb&=", "verb&");
    testOpID("8k", "&verb=", "ERR");
    testOpID("8l", "verb'=", "verb'");
    testOpID("8m", "'verb=", "ERR");  
    testOpID("8n", 'verb"=', 'verb"');
    testOpID("8o", '"verb=', "ERR"); 

    // symbol names cannot contain = ? + * :
    testOpID("9a", "=verb=", "ERR"); 
    testOpID("9b", "verb?=", "ERR");
    testOpID("9c", "?verb=", "ERR");
    testOpID("9d", "verb+=", "ERR");
    testOpID("9e", "+verb=", "ERR"); 
    testOpID("9f", "verb*=", "ERR");
    testOpID("9g", "*verb=", "ERR");
    testOpID("9h", ":verb=", "ERR");

    // symbol names may contain Unicode letters anywhere
    testOpID("10a", "verbε=", "verbε");
    testOpID("10b", "εverb=", "εverb");
    testOpID("10c", "नमस्ते=", "नमस्ते");
    testOpID("10d", "Привет=", "Привет");
    testOpID("10e", "ᓄᓇᕕᒃ=", "ᓄᓇᕕᒃ");
    testOpID("10f", "οἶκος=", "οἶκος");
    testOpID("10g", "あの人=", "あの人");
    testOpID("10h", "恭喜发财=", "恭喜发财");
    testOpID("10i", "ﺷﻜﺮﺍﹰ=", "ﺷﻜﺮﺍﹰ");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testOpID("10j", "کتاب‌ها=", "ERR"); // contains a zero-width non-joiner
});
