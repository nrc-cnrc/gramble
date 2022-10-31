import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Collection containing one assignment', function() {
        const project = sheetFromFile(`${DIR}/simpleCollection.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Collection containing two assignments', function() {
        const project = sheetFromFile(`${DIR}/multiSymbolCollection.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Sheet with auto default', function() {
        const project = sheetFromFile(`${DIR}/sheetWithAutoDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });
    
    describe('Collection with auto default', function() {
        const project = sheetFromFile(`${DIR}/collectionWithAutoDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });
    
    describe('Reference to auto default', function() {
        const project = sheetFromFile(`${DIR}/referenceToAutoDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });
    
    describe('Reference to auto default by name', function() {
        const project = sheetFromFile(`${DIR}/referenceToAutoDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });

    describe('Reference to explicit default', function() {
        const project = sheetFromFile(`${DIR}/referenceToExplicitDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });

    describe('Reference to explicit default by name', function() {
        const project = sheetFromFile(`${DIR}/referenceToDefaultByName.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });
    
    describe('Auto default in auto', function() {
        const project = sheetFromFile(`${DIR}/autoDefaultInAuto.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });

    describe('Auto default in explicit', function() {
        const project = sheetFromFile(`${DIR}/autoDefaultInExplicit.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "goo", gloss: "water" },
            { text: "boo", gloss: "fire" }
        ]);
    });
    
    describe('Explicit default in auto', function() {
        const project = sheetFromFile(`${DIR}/explicitDefaultInAuto.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
            { text: "goo", gloss: "water" }
        ]);
    });
    
    describe('Reference to nested explicit default', function() {
        const project = sheetFromFile(`${DIR}/referenceToNestedExplicitDefault.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "goo", gloss: "water" }
        ]);
    });
    
    describe('Reference to nested explicit default by name', function() {
        const project = sheetFromFile(`${DIR}/referenceToNestedExplicitDefaultByName.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "goo", gloss: "water" }
        ]);
    });
    
    describe('Reference to a non-existent collection', function() {
        const project = sheetFromFile(`${DIR}/nonexistentCollection.csv`);
        testErrors(project, [
            ["nonexistentCollection", 9, 2, "error",]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });

    describe('Reference to a non-existent symbol within a collection', function() {
        const project = sheetFromFile(`${DIR}/nonexistentSymbol.csv`);
        testErrors(project, [
            ["nonexistentSymbol", 9, 2, "error",]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Symbol reference without collection prefix', function() {
        const project = sheetFromFile(`${DIR}/symbolRefWithoutCollection.csv`);
        testErrors(project, [
            ["symbolRefWithoutCollection", 9, 2, "error",]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Collection with embeds referring outside of it', function() {
        const project = sheetFromFile(`${DIR}/collectionReferringOut.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Collection with embeds referring to symbols in a sibling collection', function() {
        const project = sheetFromFile(`${DIR}/collectionReferringSibling.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Collection with embeds referring to symbols in itself', function() {
        const project = sheetFromFile(`${DIR}/collectionReferringSelf.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Bare reference to a collection', function() {
        const project = sheetFromFile(`${DIR}/collectionBareRef.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Unnamed collection as first child', function() {
        const project = sheetFromFile(`${DIR}/unnamedCollection.csv`);
        testErrors(project, [
            ["unnamedCollection",0,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Unnamed collection as second child', function() {
        const project = sheetFromFile(`${DIR}/unnamedCollection2.csv`);
        testErrors(project, [
            ["unnamedCollection2",4,0,"warning"]
        ]);
        testGrammar(project, [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]);
    });
    
    describe('Unnamed collection as last child', function() {
        const project = sheetFromFile(`${DIR}/unnamedCollection3.csv`);
        testErrors(project, [
            ["unnamedCollection3",8,0,"warning"]
        ]);
        testGrammar(project, [
            {text: "baz", gloss: "-2SG"},
            {text: "bar", gloss: "-1SG"},
            {text: "moo", gloss: "jump"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foo", gloss: "run"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ]);
    });
    
    describe('Op with collection as a child', function() {
        const project = sheetFromFile(`${DIR}/collectionChildOfOp.csv`);
        testErrors(project, [
            ["collectionChildOfOp",11,2,"error"]
        ]);
        testGrammar(project, [
            {},
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Op with collection as a sibling', function() {
        const project = sheetFromFile(`${DIR}/collectionSiblingOfOp.csv`);
        testErrors(project, [
            ["collectionSiblingOfOp",8,1,"error"]
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