import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Rename header', function() {
        const project = sheetFromFile(`${DIR}/renameGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" }
        ]);
    });

    describe('Renaming an irrelevant tape', function() {
        const project = sheetFromFile(`${DIR}/renameIrrelevant.csv`);
        testErrors(project, 
            [["renameIrrelevant", 1, 4, "error"]]
        );
        testGrammar(project, [
            { text: "foo", gloss: "run" }
        ]);
    });


    describe('Rename header with embeds', function() {
        const project = sheetFromFile(`${DIR}/renameEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]", class: "v" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]", class: "v" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", class: "v" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", class: "v" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]", class: "v" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]", class: "v" }
        ]);
    });

    describe('Renaming to a name that already exists', function() {
        const project = sheetFromFile(`${DIR}/renameConflict.csv`);
        testErrors(project, 
            [["renameConflict", 10, 3, "error"]]
        );
        testGrammar(project, [
            {"text":"moo","gloss":"v[3SG]","subj":"[3SG]"},
            {"text":"foo","gloss":"v[3SG]","subj":"[3SG]"},
            {"text":"moobaz","gloss":"v[2SG]","subj":"[2SG]"},
            {"text":"foobaz","gloss":"v[2SG]","subj":"[2SG]"},
            {"text":"moobar","gloss":"v[1SG]","subj":"[1SG]"},
            {"text":"foobar","gloss":"v[1SG]","subj":"[1SG]"}
        ]);
    });

});