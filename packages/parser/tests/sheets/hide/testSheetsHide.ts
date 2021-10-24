import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {


    describe('Hide header', function() {

        const project = sheetFromFile("./tests/sheets/hide/csvs/hideGrammar.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foo" }
        ]);
    });
    
    describe('Hiding an irrelevant tape', function() {

        const project = sheetFromFile("./tests/sheets/hide/csvs/hideIrrelevant.csv");

        testErrors(project, 
            [["hideIrrelevant", 1, 4, "error"]]
        );
        
        testGramble(project, [
            { text: "foo", gloss: "run" }
        ]);
    });

    describe('Hide header with embeds', function() {

        const project = sheetFromFile("./tests/sheets/hide/csvs/hideEmbed.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Two hide headers', function() {

        const project = sheetFromFile("./tests/sheets/hide/csvs/doubleHide.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]);
    });
    
    describe('Hide header with a slash value', function() {

        const project = sheetFromFile("./tests/sheets/hide/csvs/doubleHideSlash.csv");

        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]);
    });


});