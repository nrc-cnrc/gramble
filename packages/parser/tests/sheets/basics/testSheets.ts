import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Minimal grammar', function() {
        const project = sheetFromFile(`${DIR}/minimalGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Minimal grammar with no table: op', function() {
        const project = sheetFromFile(`${DIR}/minimalGrammarNoTable.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Embeds', function() {
        const project = sheetFromFile(`${DIR}/embedGrammar.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Table with empty cell', function() {
        const project = sheetFromFile(`${DIR}/emptyCell.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG", pos:"v" },
            { text: "moobar", gloss: "jump-1SG", pos:"v" },
            { text: "foobaz", gloss: "run-2SG", pos:"v" },
            { text: "moobaz", gloss: "jump-2SG", pos:"v"},
            { text: "foo", gloss: "run.3SG", pos:"v" },
            { text: "moo", gloss: "jump.3SG", pos:"v" }
        ]);
    });

    describe('Empty "table:" op', function() {
        const project = sheetFromFile(`${DIR}/emptyTable.csv`);
        testErrors(project, [
            ["emptyTable", 1, 1, "warning"]
        ]);
        testGramble(project, [
            {"text":"baz","gloss":"-2SG"},
            {"text":"bar","gloss":"-1SG"}
        ]);
    });

    describe('"maybe text" header', function() {
        const project = sheetFromFile(`${DIR}/maybeHeader.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo" },
            { text: "moo" },
            { text: "foobar" },
            { text: "moobar" },
        ]);
    });

    describe('"maybe embed" header', function() {
        const project = sheetFromFile(`${DIR}/maybeEmbed.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('"text/gloss" header', function() {
        const project = sheetFromFile(`${DIR}/slashHeader.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "foo-1SG" },
            { text: "moobar", gloss: "moo-1SG" },
            { text: "foobaz", gloss: "foo-2SG" },
            { text: "moobaz", gloss: "moo-2SG" }
        ]);
    });

    describe('Header commented out', function() {
        const project = sheetFromFile(`${DIR}/commentHeader.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Headers with lots of parens', function() {
        const project = sheetFromFile(`${DIR}/headerWithParens.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "foo" },
            { text: "moo", gloss: "moo" }
        ]);
    });

    describe('Empty assignment', function() {
        const project = sheetFromFile(`${DIR}/emptyAssignment.csv`);
        testErrors(project, [
            ["emptyAssignment", 0, 0, "error"]
        ]);
        testGramble(project, [{}]);
    });
    
    describe('Nested tables', function() {
        const project = sheetFromFile(`${DIR}/nestedTables.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"moo","gloss":"jump","finite":"false"},
            {"text":"moobaz","gloss":"jump-2SG","finite":"true"},
            {"text":"moobar","gloss":"jump-1SG","finite":"true"},
            {"text":"foo","gloss":"run","finite":"false"},
            {"text":"foobaz","gloss":"run-2SG","finite":"true"},
            {"text":"foobar","gloss":"run-1SG","finite":"true"}
        ]);
    });
});

