import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Empty grammar', function() {
        const project = sheetFromFile("./tests/sheets/bare/csvs/emptyGrammar.csv");
        testErrors(project, []);
        testGramble(project, [{}]);
    });

    describe('Bare grammar', function() {
        const project = sheetFromFile("./tests/sheets/bare/csvs/bareGrammar.csv");
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with table', function() {
        const project = sheetFromFile("./tests/sheets/bare/csvs/bareGrammarWithTable.csv");
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with embeds', function() {
        const project = sheetFromFile("./tests/sheets/bare/csvs/bareGrammarWithEmbeds.csv");
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

});