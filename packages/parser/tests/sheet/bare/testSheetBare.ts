import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Empty grammar', function() {
        const project = sheetFromFile(`${DIR}/emptyGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, []);
    });

    describe('Bare grammar', function() {
        const project = sheetFromFile(`${DIR}/bareGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with table', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarWithTable.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with embeds', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarWithEmbeds.csv`);
        testErrors(project, [
            ["bareGrammarWithEmbeds",8,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" },
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Bare grammar after default', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarAfterDefault.csv`);
        testErrors(project, [
            ["bareGrammarAfterDefault",4,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
        ]);
    });

    describe('Bare grammar with embeds and table', function() {
        const project = sheetFromFile(`${DIR}/bareGrammarWithEmbedsAndTable.csv`);
        testErrors(project, [
            ["bareGrammarWithEmbedsAndTable",8,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" },
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Content obliteration by bare table', function() {
        const project = sheetFromFile(`${DIR}/obliterationByBareTable.csv`);
        testErrors(project, [
            ["obliterationByBareTable",0,0,"warning"],
            ["obliterationByBareTable",4,0,"warning"],
        ]);
        testGrammar(project, [
            {text: "baz"},
            {text: "bar"},
            {text: "foo"},
            {text: "goo"}
        ]);
    });
});