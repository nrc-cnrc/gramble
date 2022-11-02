import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';
import { SILENT, VERBOSE_DEBUG } from "../../../src/util";

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Uppercase table: ops', function() {
        const project = sheetFromFile(`${DIR}/uppercaseTable.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Uppercase embed header', function() {
        const project = sheetFromFile(`${DIR}/uppercaseEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Uppercase reference to lowercase symbol', function() {
        const project = sheetFromFile(`${DIR}/uppercaseSymbol.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Lowercase reference to uppercase symbol', function() {
        const project = sheetFromFile(`${DIR}/lowercaseSymbol.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('"OPTIONAL X" header to test header case insensitivity', function() {
        const project = sheetFromFile(`${DIR}/uppercaseOptional.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Uppercase default', function() {
        const project = sheetFromFile(`${DIR}/uppercaseDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });
    
    describe('Lowercase default', function() {
        const project = sheetFromFile(`${DIR}/uppercaseDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Generating from uppercase ref to lowercase symbol ', function() {
        const project = sheetFromFile(`${DIR}/embedGrammar.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ], SILENT, "EMBEDGRAMMAR.WORD");
    });

    describe('Grammar with uppercase join', function() {
        const project = sheetFromFile(`${DIR}/uppercaseJoin.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });


});