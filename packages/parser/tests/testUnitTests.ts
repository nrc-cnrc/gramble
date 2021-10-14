import { testGramble, testErrors, sheetFromFile } from "./testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    
    describe('Simple grammar with unit tests', function() {

        const interpreter = sheetFromFile("./tests/csvs/simpleGrammarWithTests.csv");
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        //testSymbols(interpreter, ["word", "verb", "suffix"]);
        testGramble(interpreter, [
            { text: "foobar", gloss: "run-1SG" }
        ]);
    });

    describe('Embeds and unit tests', function() {

        const interpreter = sheetFromFile("./tests/csvs/embedGrammarWithTests.csv");
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

        const interpreter = sheetFromFile("./tests/csvs/negativeTests.csv");
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

        const interpreter = sheetFromFile("./tests/csvs/embedGrammarWithFailedTests.csv");
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

        const interpreter = sheetFromFile("./tests/csvs/failingNegativeTests.csv");
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
    
});


