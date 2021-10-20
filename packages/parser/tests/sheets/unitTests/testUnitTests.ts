import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple grammar with unit tests', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/simpleGrammarWithTests.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        //testSymbols(interpreter, ["word", "verb", "suffix"]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" }
        ]);
    });

    describe('Embeds and unit tests', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/embedGrammarWithTests.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        //testSymbols(interpreter, ["word", "verb", "suffix"]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Negative tests', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/negativeTests.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        //testSymbols(interpreter, ["word", "verb", "suffix"]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Failing unit tests', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/embedGrammarWithFailedTests.csv");
        interpreter.runUnitTests();
        
        testErrors(interpreter, [
            ["embedGrammarWithFailedTests", 14, 2, "error"],
            ["embedGrammarWithFailedTests", 15, 2, "error"],
            ["embedGrammarWithFailedTests", 16, 2, "error"],
        ]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Failing negative tests', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/failingNegativeTests.csv");
        interpreter.runUnitTests();
        
        testErrors(interpreter, [
            ["failingNegativeTests", 13, 2, "error"]
        ]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Uniqueness tests', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/uniquenessTests.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Uniqueness tests with multiple uniqueness fields', function() {
        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/uniquenessTestsMulti.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGramble(interpreter, [
            { root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]" },
            { root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]" },
            { root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]" },
            { root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]" }
        ]);
    });

    describe('Uniqueness tests failing', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/uniquenessTestsFailing.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["uniquenessTestsFailing",14,3,"error"],
            ["uniquenessTestsFailing",16,3,"error"],
            ["uniquenessTestsFailing",17,2,"error"]
        ]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "foobar", gloss: "eat-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "foobaz", gloss: "eat-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Uniqueness tests failing due to missing field', function() {

        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/uniquenessTestsMissingField.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["uniquenessTestsMissingField",14,3,"error"]
        ]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "foobar", gloss: "eat-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "foobaz", gloss: "eat-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Uniqueness tests with multiple uniqueness fields, failing', function() {
        const interpreter = sheetFromFile("./tests/sheets/unitTests/csvs/uniquenessTestsFailingMulti.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["uniquenessTestsFailingMulti",14,4,"error"]
        ]);
        testGramble(interpreter, [
            { root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]" },
            { root: "run", subj: "[1SG]", text: "goobar", gloss: "run[1SG]" },
            { root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]" },
            { root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]" },
            { root: "run", subj: "[2SG]", text: "goobaz", gloss: "run[2SG]" },
            { root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]" }
        ]);
    });

});


