import { testGrammar, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Namespace containing one assignment', function() {
        const project = sheetFromFile(`${DIR}/simpleNs.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Namespace containing two assignments', function() {
        const project = sheetFromFile(`${DIR}/multiSymbolNs.csv`);
        testErrors(project, []);
        testGrammar(project, [
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
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });

    describe('Reference to a non-existent symbol within a namespace', function() {
        const project = sheetFromFile(`${DIR}/nonexistentSymbol.csv`);
        testErrors(project, [
            ["nonexistentSymbol", 9, 2, "error",]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Symbol reference without namespace prefix', function() {
        const project = sheetFromFile(`${DIR}/symbolRefWithoutNs.csv`);
        testErrors(project, [
            ["symbolRefWithoutNs", 9, 2, "error",]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Namespace with embeds referring outside of it', function() {
        const project = sheetFromFile(`${DIR}/nsReferringOut.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Namespace with embeds referring to symbols in a sibling namespace', function() {
        const project = sheetFromFile(`${DIR}/nsReferringSibling.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Namespace with embeds referring to symbols in itself', function() {
        const project = sheetFromFile(`${DIR}/nsReferringSelf.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Bare reference to a namespace', function() {
        const project = sheetFromFile(`${DIR}/nsBareRef.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Unnamed namespace as first child', function() {
        const project = sheetFromFile(`${DIR}/unnamedNamespace.csv`);
        testErrors(project, [
            ["unnamedNamespace",0,0,"error"],
            ["unnamedNamespace",0,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Unnamed namespace as second child', function() {
        const project = sheetFromFile(`${DIR}/unnamedNamespace2.csv`);
        testErrors(project, [
            ["unnamedNamespace2",4,0,"error"],
            ["unnamedNamespace2",4,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Unnamed namespace as last child', function() {
        const project = sheetFromFile(`${DIR}/unnamedNamespace3.csv`);
        testErrors(project, [
            ["unnamedNamespace3",8,0,"error"]
        ]);
        testGrammar(project, [
            {}
        ]);
    });
    
    describe('Op with namespace as a child', function() {
        const project = sheetFromFile(`${DIR}/namespaceChildOfOp.csv`);
        testErrors(project, [
            ["namespaceChildOfOp",11,2,"error"]
        ]);
        testGrammar(project, [
            {},
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Op with namespace as a sibling', function() {
        const project = sheetFromFile(`${DIR}/namespaceSiblingOfOp.csv`);
        testErrors(project, [
            ["namespaceSiblingOfOp",8,1,"error"]
        ]);
        testGrammar(project, [
            {},
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
});