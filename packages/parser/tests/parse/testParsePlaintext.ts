import { testPlaintextID } from "./testParseUtils";

describe(`Parse plaintext`, function() {

    testPlaintextID("1a", "", "");
    testPlaintextID("1b", " ", "");
    testPlaintextID("1c", "()", "()");
    testPlaintextID("1d", "( )", "()");
    testPlaintextID("1e", "1SG", "1SG");
    testPlaintextID("1f", " 1SG", "1SG");
    testPlaintextID("1g", "1SG ", "1SG");
    testPlaintextID("1h", "1 SG", "1SG");
    testPlaintextID("1i", "1\\ SG", "1 SG");
    testPlaintextID("1j", "(1SG)", "(1SG)");
    testPlaintextID("1k", "(1SG", "(1SG");
    testPlaintextID("1l", "1SG)", "1SG)");
    testPlaintextID("1m", ".", ".");
    testPlaintextID("1n", ".*", ".*");
    testPlaintextID("1o", "(.)", "(.)");
    testPlaintextID("1p", "\\.", ".");
    testPlaintextID("1q", "\\)", ")");

    // testing alternation
    testPlaintextID("2a", "1SG|2SG", "OR[1SG,2SG]");
    testPlaintextID("2b", "1SG\\|2SG", "1SG|2SG");
    testPlaintextID("2c", "|1SG", "ε", 1);
    testPlaintextID("2d", "1SG|", "ε", 1);
    testPlaintextID("2e", "(1SG)|(2SG)", "OR[(1SG),(2SG)]");
    testPlaintextID("2f", "(1SG|2SG)", "OR[(1SG,2SG)]");
    testPlaintextID("2g", "|", "ε", 1);
    testPlaintextID("2h", "1SG 2SG|3SG", "OR[1SG2SG,3SG]");
    testPlaintextID("2i", "1SG|2SG 3SG", "OR[1SG,2SG3SG]");
    testPlaintextID("2j", "\\|", "|");

    // plaintext may contain Unicode letters anywhere
    testPlaintextID("3a", "textε", "textε");
    testPlaintextID("3b", "εtext", "εtext");
    testPlaintextID("3c", "नमस्ते", "नमस्ते");
    testPlaintextID("3d", "Привет", "Привет");
    testPlaintextID("3e", "ᓄᓇᕕᒃ", "ᓄᓇᕕᒃ");
    testPlaintextID("3f", "οἶκος", "οἶκος");
    testPlaintextID("3g", "あの人", "あの人");
    testPlaintextID("3h", "恭喜发财", "恭喜发财");
    testPlaintextID("3i", "ﺷﻜﺮﺍﹰ", "ﺷﻜﺮﺍﹰ");

    // plaintext can even contain zero-width non-joiners
    testPlaintextID("3j", "کتاب‌ها", "کتاب‌ها"); // contains a zero-width non-joiner

});