import * as path from 'path';
import { testOpID } from "./testUtil";

describe(`${path.basename(module.filename)}`, function() {
    testOpID("verb=", "verb");
    testOpID("verb =", "verb");
    testOpID(" verb =", "verb");
    testOpID("\\verb=", "verb");
    testOpID("ve\\rb=", "verb");
    testOpID("table:", "table");
    testOpID("or:", "or");
    testOpID("join:", "join");
    testOpID("test:", "test");
    testOpID("testnot:", "testnot");
    testOpID("replace:", "replace");
    testOpID("replace text:", "replace[text]");
    
    // not having an equals, or having a colon, is invalid for assignments
    testOpID("verb", "ERR");
    testOpID("verb:", "ERR");
    testOpID("verb=", "ERR");

    // not having a colon, or having an equals is invalid for ops
    testOpID("table", "ERR");
    testOpID("or", "ERR");
    testOpID("join", "ERR");
    testOpID("test", "ERR");
    testOpID("testnot", "ERR");
    testOpID("replace", "ERR");
    testOpID("replace text", "ERR");
    testOpID("table=", "ERR");
    testOpID("or=", "ERR");
    testOpID("join=", "ERR");
    testOpID("test=", "ERR");
    testOpID("testnot=", "ERR");
    testOpID("replace=", "ERR");
    testOpID("replace text=", "ERR");

    // replace with invalid tape name is invalid
    testOpID("replace 9text:", "replace[ERR]");

    // empty op is invalid
    testOpID("", "ERR");
    testOpID(":", "ERR");
    testOpID("=", "ERR");

    // invalid because they contain symbols not used in headers nor in valid identifiers
    testOpID("verb,verb=", "ERR");
    testOpID("verb, verb=", "ERR");
    testOpID("verb,:", "ERR");
    testOpID(",verb=", "ERR");
    testOpID(".verb=", "ERR");
    testOpID("verb.verb=", "ERR");
    testOpID("verb;verb=", "ERR");
    testOpID("verb=verb=", "ERR");     
    testOpID("verb%verb=", "ERR");
    testOpID("verb verb=", "ERR");
    testOpID("verb\\ verb=", "ERR");
    testOpID("[verb]:", "ERR");
    testOpID("<verb=", "ERR");

    // double colon or equals at end is invalid
    testOpID("verb==", "ERR");
    testOpID("test::", "ERR");
    testOpID("test=:", "ERR");
    testOpID("test:=", "ERR");

    // valid symbol names start with letters or underscore
    testOpID("_verb=", "_verb");
    testOpID("verb_verb=", "verb_verb");
    testOpID("123:", "ERR");
    testOpID("123verb=", "ERR");

    // symbol names are allowed to contain - $ @ # & ' ", but not at the beginning

    testOpID("verb-=", "verb-");
    testOpID("ve-rb=", "ve-rb");
    testOpID("-verb=", "ERR");
    testOpID("verb$=", "verb$");
    testOpID("$verb=", "ERR");
    testOpID("verb@=", "verb@");
    testOpID("@verb=", "ERR");
    testOpID("verb#=", "verb#");
    testOpID("#verb=", "ERR");
    testOpID("verb&=", "verb&");
    testOpID("&verb=", "ERR");
    testOpID("verb'=", "verb'");
    testOpID("'verb=", "ERR");  
    testOpID('verb"=', 'verb"');
    testOpID('"verb=', "ERR"); 

    // symbol names cannot contain = ? + * :
    testOpID("=verb=", "ERR"); 
    testOpID("verb?=", "ERR");
    testOpID("?verb=", "ERR");
    testOpID("verb+=", "ERR");
    testOpID("+verb=", "ERR"); 
    testOpID("verb*=", "ERR");
    testOpID("*verb=", "ERR");
    testOpID(":verb=", "ERR");

    // symbol names may contain Unicode letters anywhere
    testOpID("verbε=", "verbε");
    testOpID("εverb=", "εverb");
    testOpID("नमस्ते=", "नमस्ते");
    testOpID("Привет=", "Привет");
    testOpID("ᓄᓇᕕᒃ=", "ᓄᓇᕕᒃ");
    testOpID("οἶκος=", "οἶκος");
    testOpID("あの人=", "あの人");
    testOpID("恭喜发财=", "恭喜发财");
    testOpID("ﺷﻜﺮﺍﹰ=", "ﺷﻜﺮﺍﹰ");

    // but only in certain classes; e.g. zero-width non-joiners are invalid
    testOpID("کتاب‌ها=", "ERR"); // contains a zero-width non-joiner
});