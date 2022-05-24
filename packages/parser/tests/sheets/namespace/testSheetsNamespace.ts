import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Namespace containing one assignment', function() {
        const project = sheetFromFile(`${DIR}/simpleNs.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Namespace containing two assignments', function() {
        const project = sheetFromFile(`${DIR}/multiSymbolNs.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Reference to a non-existent namespace', function() {
        const project = sheetFromFile(`${DIR}/nonexistentNs.csv`);
        testErrors(project, [
            ["nonexistentNs", 9, 2, "error",]
        ]);
        testGramble(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });

    describe('Reference to a non-existent symbol within a namespace', function() {
        const project = sheetFromFile(`${DIR}/nonexistentSymbol.csv`);
        testErrors(project, [
            ["nonexistentSymbol", 9, 2, "error",]
        ]);
        testGramble(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Symbol reference without namespace prefix', function() {
        const project = sheetFromFile(`${DIR}/symbolRefWithoutNs.csv`);
        testErrors(project, [
            ["symbolRefWithoutNs", 9, 2, "error",]
        ]);
        testGramble(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Namespace with embeds referring outside of it', function() {
        const project = sheetFromFile(`${DIR}/nsReferringOut.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Namespace with embeds referring to symbols in a sibling namespace', function() {
        const project = sheetFromFile(`${DIR}/nsReferringSibling.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Namespace with embeds referring to symbols in itself', function() {
        const project = sheetFromFile(`${DIR}/nsReferringSelf.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Bare reference to a namespace', function() {
        const project = sheetFromFile(`${DIR}/nsBareRef.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
});