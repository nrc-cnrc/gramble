import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Empty grammar', function() {
        const project = sheetFromFile(`${DIR}/emptyGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [{}]);
    });

    describe('Bare grammar', function() {
        const project = sheetFromFile(`${DIR}/bareGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with table', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarWithTable.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with embeds', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarWithEmbeds.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Bare grammar with embeds and table', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarWithEmbedsAndTable.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Content obliteration by bare table', function() {
        const project = sheetFromFile(`${DIR}/obliterationByBareTable.csv`);
        testErrors(project, [
            ["obliterationByBareTable",0,0,"error"]
        ]);
        testGramble(project, [
            {"text":"baz"},
            {"text":"bar"}
        ]);
    });
});