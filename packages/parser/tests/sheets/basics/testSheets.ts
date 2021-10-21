import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Minimal grammar', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/minimalGrammar.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Minimal grammar with no table: op', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/minimalGrammarNoTable.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Embeds', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/embedGrammar.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Table with empty cell', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/emptyCell.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run.3SG" },
            { text: "moo", gloss: "jump.3SG" }
        ]);
    });

    describe('Reference to a missing symbol', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/missingSymbol.csv");
        testErrors(project, [
            ["missingSymbol", 6, 3, "error"]
        ]);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });  

    describe('"maybe text" header', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/maybeHeader.csv");
        
        testErrors(project, []);
        testGramble(project, [
            { text: "foo" },
            { text: "moo" },
            { text: "foobar" },
            { text: "moobar" },
        ]);
    });

    describe('"maybe embed" header', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/maybeEmbed.csv");
        
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

        const project = sheetFromFile("./tests/sheets/basics/csvs/slashHeader.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "foo-1SG" },
            { text: "moobar", gloss: "moo-1SG" },
            { text: "foobaz", gloss: "foo-2SG" },
            { text: "moobaz", gloss: "moo-2SG" }
        ]);
    });

    describe('Header commented out', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/commentHeader.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Headers with lots of parens', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/headerWithParens.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "foo" },
            { text: "moo", gloss: "moo" }
        ]);
    });

    describe('Unparseable header', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/unparseableHeader.csv");
        testErrors(project, [
            ["unparseableHeader", 8, 3, "error"],
            ["unparseableHeader", 9, 3, "warning"]
        ]);
    });

    describe('Two children on the same line', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/childOnSameLine.csv");
        testErrors(project, [
            ["childOnSameLine", 4, 4, "error"]
        ]);
    });
    

    describe('Reserved word as header', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/headerUsingReservedWord.csv");
        testErrors(project, [
            ["headerUsingReservedWord", 4, 4, "error"],
            ["headerUsingReservedWord", 5, 4, "warning"]
        ]);
    });

    describe('Reassigning a symbol', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/reassigningSymbol.csv");
        testErrors(project, [
            ["reassigningSymbol", 4, 0, "error"]
        ]);
    });

    describe('Empty assignment', function() {
        const project = sheetFromFile("./tests/sheets/basics/csvs/emptyAssignment.csv");
        testErrors(project, [
            ["emptyAssignment", 0, 0, "error"]
        ]);
    });

    describe('Inappropriate assignment', function() {
        const project = sheetFromFile("./tests/sheets/basics/csvs/inappropriateAssignment.csv");
        testErrors(project, [
            ["inappropriateAssignment", 9, 1, "error"]
        ]);
    });
    
    describe('Content obliteration by table', function() {
        const project = sheetFromFile("./tests/sheets/basics/csvs/obliterationByTable.csv");
        testErrors(project, [
            ["obliterationByTable",0,0,"error"],
            ["obliterationByTable",0,0,"warning"]
        ]);
    });

    describe('Content obliteration by assignment', function() {
        const project = sheetFromFile("./tests/sheets/basics/csvs/obliterationByAssignment.csv");
        testErrors(project, [
            ["obliterationByAssignment",0,0,"error"]
        ]);
    });


    describe('Nested tables', function() {

        const project = sheetFromFile("./tests/sheets/basics/csvs/nestedTables.csv");
        testErrors(project, []);
    });

    describe('Grammar with weird indentation', function() {
        
        const project = sheetFromFile("./tests/sheets/basics/csvs/weirdIndentation.csv");
        testErrors(project, [
            ["weirdIndentation", 10, 1, "warning"]
        ]);
    });

});


