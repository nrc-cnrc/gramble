import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = "./tests/sheets/syntaxErrors/csvs";

describe(`${path.basename(module.filename)}`, function() {

    describe('Reserved word as header', function() {
        const project = sheetFromFile(`${DIR}/headerUsingReservedWord.csv`);
        testErrors(project, [
            ["headerUsingReservedWord", 4, 4, "error"],
            ["headerUsingReservedWord", 5, 4, "warning"]
        ]);
        testGramble(project, [
            {"text":"foobar","gloss":"run-1SG"}
        ]);
    });

    describe('Assignment to a reserved word', function() {
        const project = sheetFromFile(`${DIR}/assignmentToReservedWord.csv`);
        testErrors(project, [
            ["assignmentToReservedWord", 1, 0, "error"]
        ]);
        testGramble(project, [
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"}
        ]);
    });

    describe('Sheet name using a reserved word', function() {
        const project = sheetFromFile(`${DIR}/maybe.csv`);
        testErrors(project, [
            ["maybe", 0, -1, "error"]
        ]);
        testGramble(project, [
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"}
        ]);
    });

    describe('Reassigning a symbol', function() {
        const project = sheetFromFile(`${DIR}/reassigningSymbol.csv`);
        testErrors(project, [
            ["reassigningSymbol", 4, 0, "error"]
        ]);
        testGramble(project, [
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]);
    });
    
    describe('Reference to a missing symbol', function() {
        const project = sheetFromFile(`${DIR}/missingSymbol.csv`);
        testErrors(project, [
            ["missingSymbol", 6, 3, "error"]
        ]);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });  

    describe('Op missing sibling argument', function() {
        const project = sheetFromFile(`${DIR}/opMissingSibling.csv`);
        testErrors(project, [
            ["opMissingSibling", 9, 1, "warning"]
        ]);
        testGramble(project, [
            {},
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Op missing child argument', function() {
        const project = sheetFromFile(`${DIR}/opMissingChild.csv`);
        testErrors(project, [
            ["opMissingChild", 12, 1, "warning"]
        ]);
        testGramble(project, [
            {},
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Assignment to the right of a binary op', function() {
        const project = sheetFromFile(`${DIR}/assignmentSiblingOp.csv`);
        testErrors(project, [
            ["assignmentSiblingOp", 12, 2, "error"]
        ]);
        testGramble(project, [
            {"text":"moo","gloss":"jump"},
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"},
            {"text":"foo","gloss":"run"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"}
        ]);
    });

    describe('Assignment above a binary op', function() {
        const project = sheetFromFile(`${DIR}/assignmentChildOp.csv`);
        testErrors(project, [
            ["assignmentChildOp", 9, 1, "error"]
        ]);
        testGramble(project, [
            {"text":"moo","gloss":"jump"},
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"},
            {"text":"foo","gloss":"run"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"}
        ]);
    });
    
    describe('Inappropriate assignment', function() {
        const project = sheetFromFile(`${DIR}/inappropriateAssignment.csv`);
        testErrors(project, [
            ["inappropriateAssignment", 9, 1, "error"]
        ]);
        testGramble(project, [
            {"text":"moobaz","gloss":"jump-2SG"},
            {"text":"moobar","gloss":"jump-1SG"},
            {"text":"foobaz","gloss":"run-2SG"},
            {"text":"foobar","gloss":"run-1SG"}
        ]);
    });

    
    describe('Content obliteration by table', function() {
        const project = sheetFromFile(`${DIR}/obliterationByTable.csv`);
        testErrors(project, [
            ["obliterationByTable",0,0,"error"]
        ]);
        testGramble(project, [
            {"text":"baz"},
            {"text":"bar"}
        ]);
    });

    describe('Content obliteration by assignment', function() {
        const project = sheetFromFile(`${DIR}/obliterationByAssignment.csv`);
        testErrors(project, [
            ["obliterationByAssignment",0,0,"error"]
        ]);
        testGramble(project, [
            {"text":"baz"},
            {"text":"bar"}
        ]);
    });

    describe('Two children on the same line', function() {
        const project = sheetFromFile(`${DIR}/childOnSameLine.csv`);
        testErrors(project, [
            ["childOnSameLine", 4, 4, "error"]
        ]);
        testGramble(project, [
            {"text":"foobarbaz","gloss":"run-1SG-2SG"}
        ]);
    });

    describe('Unparseable header', function() {
        const project = sheetFromFile(`${DIR}/unparseableHeader.csv`);
        testErrors(project, [
            ["unparseableHeader", 8, 3, "error"],
            ["unparseableHeader", 9, 3, "warning"]
        ]);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Grammar with weird indentation', function() {
        const project = sheetFromFile(`${DIR}/weirdIndentation.csv`);
        testErrors(project, [
            ["weirdIndentation", 10, 1, "warning"]
        ]);
        testGramble(project, [
            {"text":"foobar","gloss":"run-1SG","finite":"true"}
        ]);
    });

    describe('Replace param headers in ordinary tables', function() {
        const project = sheetFromFile(`${DIR}/waywardParam.csv`);
        testErrors(project, [
            ["waywardParam", 1, 2, "warning"],
            ["waywardParam", 2, 2, "warning"],
            ["waywardParam", 5, 3, "warning"],
            ["waywardParam", 6, 3, "warning"]
        ]);
        testGramble(project, [
            {"gloss":"run","text":"baz"},
            {"gloss":"run","text":"bar"},
            {"gloss":"jump","text":"bar"},
            {"gloss":"jump","text":"baz"}
        ]);
    });

});