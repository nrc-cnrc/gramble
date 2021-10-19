import { testGramble, testErrors, sheetFromFile } from "./testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple replace', function() {
        const project = sheetFromFile("./tests/csvs/simpleReplace.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"aba","surface":"ava"}
        ]);
    });

    describe('Simple replace with pre', function() {
        const project = sheetFromFile("./tests/csvs/replaceWithPre.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"aba","surface":"ava"},
            {"text":"arba","surface":"arba"}
        ]);
    });

    describe('Simple replace with post', function() {
        const project = sheetFromFile("./tests/csvs/replaceWithPost.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"}
        ]);
    });

    describe('Simple replace with pre and post', function() {
        const project = sheetFromFile("./tests/csvs/replaceWithPrePost.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"aba","surface":"ava"},
            {"text":"abra","surface":"abra"},
            {"text":"arba","surface":"arba"}
        ]);
    });

    describe('Replacing with an embedded grammar', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithEmbed.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with a table: op nested underneath', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithTableOp.csv");

        testErrors(project, []);
        testGramble(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with same tape name in "to" and "from"', function() {
        const project = sheetFromFile("./tests/csvs/sameTapeReplace.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Replace with pre/post and same tape name', function() {
        const project = sheetFromFile("./tests/csvs/sameTapeReplace.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Replace with pre/post and same tape name', function() {
        const project = sheetFromFile("./tests/csvs/sameTapeReplaceWithPrePost.csv");
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });
    
    describe('Replace with a test: op nested underneath', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithTestOp.csv");

        testErrors(project, [["replaceWithTestOp", 12, 2, "error"]]);
        testGramble(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });
    
    describe('Replace with invalid param', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithInvalidParam.csv");

        testErrors(project, [
            ["replaceWithInvalidParam",13,4,"error"]
        ]);        
        testGramble(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with an unnamed param', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithUnnamedParam.csv");

        testErrors(project, [
            ["replaceWithUnnamedParam",13,4,"error"]
        ]);        
        testGramble(project, [
            {"text":"foo", "surface": "foo", "gloss":"run.3SG"},
            {"text":"foobaz", "surface": "foovaz", "gloss":"run-2SG"},
            {"text":"foobar", "surface": "foovar", "gloss":"run-1SG"},
            {"text":"moo", "surface": "moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "surface": "moovaz", "gloss":"jump-2SG"},
            {"text":"moobar", "surface": "moovar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace with missing "from" param', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithMissingFrom.csv");

        testErrors(project, [
            ["replaceWithMissingFrom",12,1,"error"]
        ]);        
        testGramble(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    
    describe('Replace with missing "to" param', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithMissingTo.csv");

        testErrors(project, [
            ["replaceWithMissingTo",12,1,"error"]
        ]);        
        testGramble(project, [
            {"text":"foo", "gloss":"run.3SG"},
            {"text":"foobaz", "gloss":"run-2SG"},
            {"text":"foobar", "gloss":"run-1SG"},
            {"text":"moo", "gloss":"jump.3SG"},
            {"text":"moobaz", "gloss":"jump-2SG"},
            {"text":"moobar", "gloss":"jump-1SG"}
        ]);
    });

    describe('Replace param headers in ordinary tables', function() {

        const project = sheetFromFile("./tests/csvs/waywardParam.csv");

        testErrors(project, [
            ["waywardParam", 1, 2, "warning"],
            ["waywardParam", 2, 2, "warning"],
            ["waywardParam", 5, 3, "warning"],
            ["waywardParam", 6, 3, "warning"],
            ["waywardParam", 7, 3, "warning"]]);
        testGramble(project, [
            {"gloss":"run","text":"baz"},
            {"gloss":"run","text":"bar"},
            {"gloss":"jump","text":"bar"},
            {"gloss":"jump","text":"baz"}
        ]);
    }); 
});