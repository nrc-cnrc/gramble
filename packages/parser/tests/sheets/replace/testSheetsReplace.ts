import { testGrammar, testErrors, sheetFromFile, testHasTapes } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple replace', function() {
        const project = sheetFromFile(`${DIR}/simpleReplace.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"}
        ]);
    });

    describe('Simple replace under assignment', function() {
        const project = sheetFromFile(`${DIR}/replaceUnderAssignment.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"}
        ]);
    });
    
    describe('Simple replace multiple', function() {
        const project = sheetFromFile(`${DIR}/replaceMulti.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"abba","surface":"avva"}
        ]);
    });

    describe('Simple replace with pre', function() {
        const project = sheetFromFile(`${DIR}/replaceWithPre.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"arba","surface":"arba"}
        ]);
    });

    describe('Simple replace with post', function() {
        const project = sheetFromFile(`${DIR}/replaceWithPost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"}
        ]);
    });

    describe('Simple replace with pre and post', function() {
        const project = sheetFromFile(`${DIR}/replaceWithPrePost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"},
            {"text":"arba","surface":"arba"}
        ]);
    });

    describe('Replacing with an embedded grammar', function() {
        const project = sheetFromFile(`${DIR}/replaceWithEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with a table: op nested underneath', function() {
        const project = sheetFromFile(`${DIR}/replaceWithTableOp.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with same tape name in "to" and "from"', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplace.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Replace multiple with same tape name in "to" and "from"', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplaceMulti.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"avva"}
        ]);
    });

    describe('Replace with pre/post and same tape name', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplace.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Replace with pre/post and same tape name', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplaceWithPrePost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });
    
    describe('Replacing wrong tape', function() {
        const project = sheetFromFile(`${DIR}/replaceWrongTape.csv`);
        testErrors(project, [["replaceWrongTape",3,1,"error"]]);
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });

    describe('Replace with a test: op nested underneath', function() {
        const project = sheetFromFile(`${DIR}/replaceWithTestOp.csv`);
        testErrors(project, [
            ["replaceWithTestOp", 12, 2, "error"],
            ["replaceWithTestOp",12,1,"warning"]
        ]);
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });
    
    describe('Replace with invalid param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithInvalidParam.csv`);
        testErrors(project, [
            ["replaceWithInvalidParam",13,4,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with an unnamed param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithUnnamedParam.csv`);
        testErrors(project, [
            ["replaceWithUnnamedParam",13,4,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });
    
    describe('Replace with no sibling', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoSibling.csv`);
        testErrors(project, [
            ["replaceWithNoSibling",0,1,"error"],
            ["replaceWithNoSibling",0,0,"warning"]
        ]); 
        testGrammar(project, [{}]);
    });
    
    describe('Replace with no sibling bare', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoSiblingBare.csv`);
        testErrors(project, [
            ["replaceWithNoSiblingBare",0,0,"error"]
        ]);        
        testGrammar(project, [{}]);
    });

    describe('Replace with no child', function() {
        const project = sheetFromFile(`${DIR}/replaceWithNoChild.csv`);
        testErrors(project, [
            ["replaceWithNoChild",3,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"aba"}
        ]);
    });

    describe('Replace with missing "from" param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithMissingFrom.csv`);
        testErrors(project, [
            ["replaceWithMissingFrom",12,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with missing "to" param', function() {
        const project = sheetFromFile(`${DIR}/replaceWithMissingTo.csv`);
        testErrors(project, [
            ["replaceWithMissingTo",12,1,"error"]
        ]);        
        testGrammar(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replacement of a grammar containing an embed', function() {
        const project = sheetFromFile(`${DIR}/replaceEmbed.csv`);
        testErrors(project, []);        
        testGrammar(project, [
            { text: "goo"}
        ]);
    });

    describe('Nested replace, different tapes', function() {
        const project = sheetFromFile(`${DIR}/nestedDifferent.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "b", text2: "v", text3: "w"}
        ]);
    });

    describe('Nested replace, different tapes, under assignment', function() {
        const project = sheetFromFile(`${DIR}/nestedDifferentUnderAssignment.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "b", text2: "v", text3: "w"}
        ]);
    });
    
    describe('Nested replace, different tapes 2', function() {
        const project = sheetFromFile(`${DIR}/nestedDifferent2.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "ab", text2: "av", text3: "ev"}
        ]);
    });
    

    describe('Nested replace, different tapes 3', function() {
        const project = sheetFromFile(`${DIR}/nestedDifferent3.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "aba", text2: "ava", text3: "awa"}
        ]);
    });

    describe('Nested replace same tape', function() {
        const project = sheetFromFile(`${DIR}/nestedSame.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });
    
    describe('Nested replace same tape, under assignment', function() {
        const project = sheetFromFile(`${DIR}/nestedSameUnderAssignment.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });

    describe('Nested replace same tape 2', function() {
        const project = sheetFromFile(`${DIR}/nestedSame2.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });

    describe('Different-tape replace nested inside a same-tape replace', function() {
        const project = sheetFromFile(`${DIR}/nestedDifferentInsideSame.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "b", text2: "w"}
        ]);
    });
    
    describe('Same-tape replace nested inside a different-tape replace', function() {
        const project = sheetFromFile(`${DIR}/nestedSameInsideDifferent.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "v", text2: "w"}
        ]);
    }); 

    describe('Replace with a regex in from', function() {
        const project = sheetFromFile(`${DIR}/replaceFromRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"apa","surface":"ava"}
        ]);
    });

    describe('Replace with a regex in to', function() {
        const project = sheetFromFile(`${DIR}/replaceToRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"apa"},
            {"text":"aba","surface":"ava"}
        ]);
    });

    describe('Replace with a regex in pre', function() {
        const project = sheetFromFile(`${DIR}/replacePreRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"arba","surface":"arba"},
            {"text":"iba","surface":"iva"}
        ]);
    });

    describe('Replace with a regex in post', function() {
        const project = sheetFromFile(`${DIR}/replacePostRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"},
            {"text":"abi","surface":"avi"}
        ]);
    });
});