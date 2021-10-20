import { testGramble, testErrors, sheetFromFile } from "../../testUtils";

import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Multi-sheet project', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/externalRef.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Multi-sheet project with lowercase sheet reference', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/lowercaseExternalRef.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    describe('Multi-sheet project with a "bare" sheet reference', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/externalBareRef.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Multi-sheet project with a "bare" reference to "bare" grammar', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/externalBareRefToBareGrammar.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    describe('Multi-sheet project with missing symbol in imported sheet', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/missingExternalRef.csv");
        testErrors(project, [
            ["missingExternalRef", 1, 1, "warning"]
        ]);
        testGramble(project, [
            { text: "able" }
        ]);
    });

    describe('Multi-sheet project referencing non-existent sheet', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/missingSheet.csv");
        testErrors(project, [
            ["missingSheet", 1, 1, "warning"]
        ]);
        testGramble(project, [
            { text: "able" }
        ]);
    });

    describe('Multi-sheet project where the imported sheet references the original', function() {

        const project = sheetFromFile("./tests/sheets/multi/csvs/externalRefCycle.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });
});


