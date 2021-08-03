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

    describe('Multi-sheet project', function() {

        const project = sheetFromFile("./tests/csvs/externalRef.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Multi-sheet project with lowercase sheet reference', function() {

        const project = sheetFromFile("./tests/csvs/lowercaseExternalRef.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    describe('Multi-sheet project with a "bare" sheet reference', function() {

        const project = sheetFromFile("./tests/csvs/externalBareRef.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Multi-sheet project with a "bare" reference to "bare" grammar', function() {

        const project = sheetFromFile("./tests/csvs/externalBareRefToBareGrammar.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    describe('Multi-sheet project with missing symbol in imported sheet', function() {

        const project = sheetFromFile("./tests/csvs/missingExternalRef.csv");
        testErrors(project, [
            ["missingExternalRef", 1, 1, "warning"]
        ]);
        testProject(project, [
            { text: "able" }
        ]);
    });

    describe('Multi-sheet project referencing non-existent sheet', function() {

        const project = sheetFromFile("./tests/csvs/missingSheet.csv");
        testErrors(project, [
            ["missingSheet", 1, 1, "warning"]
        ]);
        testProject(project, [
            { text: "able" }
        ]);
    });

});


