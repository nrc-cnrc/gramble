import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Multi-sheet project', function() {
        const project = sheetFromFile(`${DIR}/externalRef.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]);
    });
    
    describe('Multi-sheet project with lowercase sheet reference', function() {
        const project = sheetFromFile(`${DIR}/lowercaseExternalRef.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]);
    });

    describe('Multi-sheet project with a "bare" sheet reference', function() {
        const project = sheetFromFile(`${DIR}/externalBareRef.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]);
    });
    
    describe('Multi-sheet project with a "bare" reference to "bare" grammar', function() {
        const project = sheetFromFile(`${DIR}/externalBareRefToBareGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]);
    });

    describe('Multi-sheet project with missing symbol in imported sheet', function() {
        const project = sheetFromFile(`${DIR}/missingExternalRef.csv`);
        testErrors(project, [
            ["missingExternalRef", 1, 1, "warning"]
        ]);
        testGrammar(project, [
            { text: "able" }
        ]);
    });
    
    describe('Multi-sheet with reserved word reference', function() {
        const project = sheetFromFile(`${DIR}/externalRefToReservedWord.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    describe('Multi-sheet project referencing non-existent sheet', function() {
        const project = sheetFromFile(`${DIR}/missingSheet.csv`);
        testErrors(project, [
            ["missingSheet", 1, 1, "warning"]
        ]);
        testGrammar(project, [
            { text: "able" }
        ]);
    });

    describe('Multi-sheet project where the imported sheet references the original', function() {
        const project = sheetFromFile(`${DIR}/externalRefCycle.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    describe('Multi-sheet project with a reference to a collection in an external document', function() {
        const project = sheetFromFile(`${DIR}/externalRefToNs.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Multi-sheet project with the external reference in a collection', function() {
        const project = sheetFromFile(`${DIR}/externalRefInNs.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]);
    });
});


