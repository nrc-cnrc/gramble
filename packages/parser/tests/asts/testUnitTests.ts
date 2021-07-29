import { Project } from "../../src/project";
import { dirname, basename } from "path";
import { testProject, testErrors, testStructure } from "./testUtilsAst";
import { TextDevEnvironment } from "../../src/textInterface";

import * as path from 'path';

export function sheetFromFile(path: string): Project {

    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = new Project(devEnv);
    project.addSheet(sheetName);
    //project.runChecks();
    return project;
}

describe(`${path.basename(module.filename)}`, function() {

    /*
    describe('Embeds and unit tests', function() {

        const project = sheetFromFile("./tests/csvs/embedGrammarWithTests.csv");

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
        testErrors(project, [
            ["embedGrammarWithFailedTests", 14, 2, "error"],
            ["embedGrammarWithFailedTests", 15, 2, "error"],
            ["embedGrammarWithFailedTests", 16, 2, "error"],
        ]);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    
    describe('Failing negative tests', function() {

        const project = sheetFromFile("./tests/csvs/failingNegativeTests.csv");
        testErrors(project, [
            ["failingNegativeTests", 13, 2, "error"]
        ]);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
*/

});


