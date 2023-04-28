import {
    testSuiteName, 
    logTestSuite,
    testOpID,
} from "../testUtil";


describe(`${testSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testOpID("1", "verb=", "verb");
    testOpID("2", "verb =", "verb");
    testOpID("3", " verb =", "verb");
    testOpID("4", "\\verb=", "verb");
    testOpID("5", "ve\\rb=", "verb");
    testOpID("6", "table:", "table");
    testOpID("7", "or:", "or");
    testOpID("8", "join:", "join");
    testOpID("9", "test:", "test");
    testOpID("10", "testnot:", "testnot");
    testOpID("11", "replace:", "ERR");
    testOpID("12", "replace text:", "replace[text]");
    
    // not having an equals, or having a colon, is invalid for assignments
    testOpID("13", "verb", "ERR");
    testOpID("14", "verb:", "ERR");

    // not having a colon, or having an equals is invalid for ops
    testOpID("15", "table", "ERR");
    testOpID("16", "or", "ERR");
    testOpID("17", "join", "ERR");
    testOpID("18", "test", "ERR");
    testOpID("19", "testnot", "ERR");
    testOpID("20", "replace", "ERR");
    testOpID("21", "replace text", "ERR");
    testOpID("22", "table=", "ERR");
    testOpID("23", "or=", "ERR");
    testOpID("24", "join=", "ERR");
    testOpID("25", "test=", "ERR");
    testOpID("26", "testnot=", "ERR");
    testOpID("27", "replace=", "ERR");
    testOpID("28", "replace text=", "ERR");

    // replace with invalid tape name is invalid
    testOpID("29", "replace 9text:", "replace[ERR]");

    // empty op is invalid
    testOpID("30", "", "ERR");
    testOpID("31", ":", "ERR");
    testOpID("32", "=", "ERR");

    // invalid because they contain symbols not used in headers nor in valid identifiers
    testOpID("33", "verb,verb=", "ERR");
    testOpID("34", "verb, verb=", "ERR");
    testOpID("35", "verb,:", "ERR");
    testOpID("36", ",verb=", "ERR");
    testOpID("37", ".verb=", "ERR");
    testOpID("38", "verb.verb=", "ERR");
    testOpID("39", "verb;verb=", "ERR");
    testOpID("40", "verb=verb=", "ERR");     
    testOpID("41", "verb%verb=", "ERR");
    testOpID("42", "verb verb=", "ERR");
    testOpID("43", "verb\\ verb=", "ERR");
    testOpID("44", "[verb]:", "ERR");
    testOpID("45", "<verb=", "ERR");

    // double colon or equals at end is invalid
    testOpID("46", "verb==", "ERR");
    testOpID("47", "test::", "ERR");
    testOpID("48", "test=:", "ERR");
    testOpID("49", "test:=", "ERR");

    // valid symbol names start with letters or underscore
    testOpID("50", "_verb=", "_verb");
    testOpID("51", "verb_verb=", "verb_verb");
    testOpID("52", "123:", "ERR");
    testOpID("53", "123verb=", "ERR");

    // symbol names are allowed to contain - $ @ # & ' ", but not at the beginning

    testOpID("54", "verb-=", "verb-");
    testOpID("55", "ve-rb=", "ve-rb");
    testOpID("56", "-verb=", "ERR");
    testOpID("57", "verb$=", "verb$");
    testOpID("58", "$verb=", "ERR");
    testOpID("59", "verb@=", "verb@");
    testOpID("60", "@verb=", "ERR");
    testOpID("61", "verb#=", "verb#");
    testOpID("62", "#verb=", "ERR");
    testOpID("63", "verb&=", "verb&");
    testOpID("64", "&verb=", "ERR");
    testOpID("65", "verb'=", "verb'");
    testOpID("66", "'verb=", "ERR");  
    testOpID("67", 'verb"=', 'verb"');
    testOpID("68", '"verb=', "ERR"); 

    // symbol names cannot contain = ? + * :
    testOpID("69", "=verb=", "ERR"); 
    testOpID("70", "verb?=", "ERR");
    testOpID("71", "?verb=", "ERR");
    testOpID("72", "verb+=", "ERR");
    testOpID("73", "+verb=", "ERR"); 
    testOpID("74", "verb*=", "ERR");
    testOpID("75", "*verb=", "ERR");
    testOpID("76", ":verb=", "ERR");

    // symbol names may contain Unicode letters anywhere
    testOpID("77", "verbε=", "verbε");
    testOpID("78", "εverb=", "εverb");
    testOpID("79", "नमस्ते=", "नमस्ते");
    testOpID("80", "Привет=", "Привет");
    testOpID("81", "ᓄᓇᕕᒃ=", "ᓄᓇᕕᒃ");
    testOpID("82", "οἶκος=", "οἶκος");
    testOpID("83", "あの人=", "あの人");
    testOpID("84", "恭喜发财=", "恭喜发财");
    testOpID("85", "ﺷﻜﺮﺍﹰ=", "ﺷﻜﺮﺍﹰ");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testOpID("86", "کتاب‌ها=", "ERR"); // contains a zero-width non-joiner
});
