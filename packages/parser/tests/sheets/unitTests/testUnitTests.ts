import { testGrammar, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple grammar with unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/simpleGrammarWithTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" }
        ]);
    });

    describe('Embeds and unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/embedGrammarWithTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Test with an empty string', function() {
        const interpreter = sheetFromFile(`${DIR}/testWithEmptyString.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foobat", gloss: "run" },
            { text: "moobat", gloss: "jump" }
        ]);
    });

    describe('Testing a default grammar', function() {
        const interpreter = sheetFromFile(`${DIR}/testingDefaultGrammar.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Testing a grammar directly underneath (without "table:" op)', function() {
        const interpreter = sheetFromFile(`${DIR}/testingWithoutTableOp.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Negative tests', function() {
        const interpreter = sheetFromFile(`${DIR}/negativeTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Negative test with an empty string', function() {
        const interpreter = sheetFromFile(`${DIR}/negativeTestWithEmptyString.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foobat", gloss: "run" },
            { text: "moobat", gloss: "jump" }
        ]);
    });

    describe('Failing unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/embedGrammarWithFailedTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["embedGrammarWithFailedTests", 14, 2, "error"],
            ["embedGrammarWithFailedTests", 15, 2, "error"],
            ["embedGrammarWithFailedTests", 16, 2, "error"],
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Failed test with an empty string', function() {
        const interpreter = sheetFromFile(`${DIR}/failedTestWithEmptyString.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["failedTestWithEmptyString", 15, 2, "error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foobat", gloss: "run" },
            { text: "moobat", gloss: "jump" }
        ]);
    });

    describe('Failing negative tests', function() {
        const interpreter = sheetFromFile(`${DIR}/failingNegativeTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["failingNegativeTests", 13, 2, "error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Testing nothing', function() {
        const interpreter = sheetFromFile(`${DIR}/testingNothing.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["testingNothing", 9, 1, "error"],
            ["testingNothing", 9, 0, "warning"]
        ]);
        testGrammar(interpreter, [{}]);
    });
    
    describe('Negative testing nothing', function() {
        const interpreter = sheetFromFile(`${DIR}/negativeTestingNothing.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["negativeTestingNothing", 9, 1, "error"],
            ["negativeTestingNothing", 9, 0, "error"]
        ]);
        testGrammar(interpreter, [{}]);
    });

    describe('Missing unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/missingTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["missingTests",12,1,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Missing negative unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/missingNegativeTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["missingNegativeTests",12,1,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('table: op under unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/tableUnderUnitTest.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('table: op under negative unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/tableUnderNegativeUnitTest.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('or: op under unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/opUnderUnitTest.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["opUnderUnitTest",12,1,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('or: op under negative unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/opUnderNegativeUnitTest.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["opUnderNegativeUnitTest",12,1,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Test: op with bad param', function() {
        const interpreter = sheetFromFile(`${DIR}/testWithBadParam.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["testWithBadParam",13,3,"warning"],
            ["testWithBadParam",14,3,"warning"],
            ["testWithBadParam",15,3,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Testnot: op with bad param', function() {
        const interpreter = sheetFromFile(`${DIR}/testnotWithBadParam.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["testnotWithBadParam",13,3,"warning"],
            ["testnotWithBadParam",14,3,"warning"],
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Uniqueness tests', function() {
        const interpreter = sheetFromFile(`${DIR}/uniquenessTests.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Uniqueness tests with multiple uniqueness fields', function() {
        const interpreter = sheetFromFile(`${DIR}/uniquenessTestsMulti.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]" },
            { root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]" },
            { root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]" },
            { root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]" }
        ]);
    });

    describe('Uniqueness tests failing', function() {
        const interpreter = sheetFromFile(`${DIR}/uniquenessTestsFailing.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["uniquenessTestsFailing",14,3,"error"],
            ["uniquenessTestsFailing",16,3,"error"],
            ["uniquenessTestsFailing",17,2,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "foobar", gloss: "eat-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "foobaz", gloss: "eat-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Uniqueness tests failing due to missing field', function() {
        const interpreter = sheetFromFile(`${DIR}/uniquenessTestsMissingField.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["uniquenessTestsMissingField",14,3,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "foobar", gloss: "eat-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "foobaz", gloss: "eat-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Uniqueness tests with multiple uniqueness fields, failing', function() {
        const interpreter = sheetFromFile(`${DIR}/uniquenessTestsFailingMulti.csv`);
        interpreter.runUnitTests();
        testErrors(interpreter, [
            ["uniquenessTestsFailingMulti",14,4,"error"]
        ]);
        testGrammar(interpreter, [
            { root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]" },
            { root: "run", subj: "[1SG]", text: "goobar", gloss: "run[1SG]" },
            { root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]" },
            { root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]" },
            { root: "run", subj: "[2SG]", text: "goobaz", gloss: "run[2SG]" },
            { root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]" }
        ]);
    });

});


