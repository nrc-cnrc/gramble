import { testProject, testErrors, sheetFromFile } from "./testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Embeds and unit tests', function() {

        const project = sheetFromFile("./tests/csvs/embedGrammarWithTests.csv");
        project.runUnitTests();
        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Negative tests', function() {

        const project = sheetFromFile("./tests/csvs/negativeTests.csv");
        project.runUnitTests();
        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Failing unit tests', function() {

        const project = sheetFromFile("./tests/csvs/embedGrammarWithFailedTests.csv");
        project.runUnitTests();
        
        testErrors(project, [
            ["embedGrammarWithFailedTests", 14, 2, "error"],
            ["embedGrammarWithFailedTests", 15, 2, "error"],
            ["embedGrammarWithFailedTests", 16, 2, "error"],
        ]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Failing negative tests', function() {

        const project = sheetFromFile("./tests/csvs/failingNegativeTests.csv");
        project.runUnitTests();
        
        testErrors(project, [
            ["failingNegativeTests", 13, 2, "error"]
        ]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
});


