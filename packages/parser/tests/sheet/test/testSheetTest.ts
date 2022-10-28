import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple grammar with unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/simpleGrammarWithTests.csv`);
        interpreter.runTests();
        testErrors(interpreter, []);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" }
        ]);
    });

    describe('Embeds and unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/embedGrammarWithTests.csv`);
        interpreter.runTests();
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
        interpreter.runTests();
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

    describe('Testing a grammar directly underneath (without "table:" op)', function() {
        const interpreter = sheetFromFile(`${DIR}/testingWithoutTableOp.csv`);
        interpreter.runTests();
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
        interpreter.runTests();
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
        interpreter.runTests();
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
        interpreter.runTests();
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
        interpreter.runTests();
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
        interpreter.runTests();
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
        interpreter.runTests();
        testErrors(interpreter, [
            ["testingNothing", 9, 1, "error"],
            ["testingNothing", 9, 0, "warning"]
        ]);
        testGrammar(interpreter, [{}]);
    });
    
    describe('Negative testing nothing', function() {
        const interpreter = sheetFromFile(`${DIR}/negativeTestingNothing.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["negativeTestingNothing", 9, 1, "error"],
            ["negativeTestingNothing", 9, 0, "error"]
        ]);
        testGrammar(interpreter, [{}]);
    });

    describe('Missing unit tests', function() {
        const interpreter = sheetFromFile(`${DIR}/missingTests.csv`);
        interpreter.runTests();
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
        interpreter.runTests();
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
        const interpreter = sheetFromFile(`${DIR}/tableUnderTest.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["tableUnderTest",12,1,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('table: op under negative unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/tableUnderTestnot.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["tableUnderTestnot",12,1,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('or: op under unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/opUnderTest.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["opUnderTest",12,1,"error"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('or: op under negative unit test', function() {
        const interpreter = sheetFromFile(`${DIR}/opUnderTestnot.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["opUnderTestnot",12,1,"error"]
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
        interpreter.runTests();
        testErrors(interpreter, [
            ["testWithBadParam",12,3,"error"],
            ["testWithBadParam",12,1,"warning"]
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
        interpreter.runTests();
        testErrors(interpreter, [
            ["testnotWithBadParam",12,3,"error"],
            ["testnotWithBadParam",12,1,"warning"]
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
        interpreter.runTests();
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
        interpreter.runTests();
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
        interpreter.runTests();
        testErrors(interpreter, [
            ["uniquenessTestsFailing",14,2,"error"],
            ["uniquenessTestsFailing",16,2,"error"],
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
        interpreter.runTests();
        testErrors(interpreter, [
            ["uniquenessTestsMissingField",14,2,"error"]
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
        interpreter.runTests();
        testErrors(interpreter, [
            ["uniquenessTestsFailingMulti",14,2,"error"]
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
    
    describe('Unit test with a regex header', function() {
        const interpreter = sheetFromFile(`${DIR}/testWithRegexHeader.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["testWithRegexHeader",3,3,"error"],
            ["testWithRegexHeader",4,3,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" }
        ]);
    });
    
    describe('Unit test with optional header', function() {
        const interpreter = sheetFromFile(`${DIR}/testWithOptionalHeader.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["testWithOptionalHeader",3,3,"error"],
            ["testWithOptionalHeader",4,3,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run" }
        ]);
    });
    
    describe('Unit test with a slash header', function() {
        const interpreter = sheetFromFile(`${DIR}/testWithSlashHeader.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["testWithSlashHeader",3,3,"error"],
            ["testWithSlashHeader",4,3,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run", eng: "run" }
        ]);
    });

    describe('Unit test with an embed header', function() {
        const interpreter = sheetFromFile(`${DIR}/testWithEmbedHeader.csv`);
        interpreter.runTests();
        testErrors(interpreter, [
            ["testWithEmbedHeader",6,3,"error"],
            ["testWithEmbedHeader",7,3,"warning"]
        ]);
        testGrammar(interpreter, [
            { text: "foobar", gloss: "run-1SG" }
        ]);
    });
});


