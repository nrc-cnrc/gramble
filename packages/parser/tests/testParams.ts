import { testGramble, testErrors, sheetFromFile, testHasTapes, testHasVocab } from "./testUtils";
import * as path from 'path';

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple replace', function() {

        const project = sheetFromFile("./tests/csvs/simpleReplace.csv");
        const grammar = project.getGrammar();
        testErrors(project, []);

        testHasTapes(grammar, ['text', 'surface']);
        testHasVocab(grammar, {text: 2, surface: 3});

        testGramble(project, [
            {"text":"aba","surface":"ava"}
        ]);
    });

    /*
    describe('Replace with a table: op nested underneath', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithTableOp.csv");

        testErrors(project, []);
        testGramble(project, [
            {"text":"foo","gloss":"run.3SG"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"},
            {"text":"moo","gloss":"jump.3SG"},
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"}
        ]);
    });

    
    describe('Replace with a test: op nested underneath', function() {

        const project = sheetFromFile("./tests/csvs/replaceWithTestOp.csv");

        testErrors(project, [["replaceWithTestOp", 12, 2, "error"]]);
        testGramble(project, [
            {"text":"foo","gloss":"run.3SG"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"},
            {"text":"moo","gloss":"jump.3SG"},
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"}
        ]);
    });
    
    describe('Param headers in ordinary tables', function() {

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
    */
});