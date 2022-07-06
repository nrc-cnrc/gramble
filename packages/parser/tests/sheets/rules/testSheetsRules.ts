import { testGramble, testErrors, sheetFromFile, testHasTapes, testHasVocab } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Replace with same tape name in "to" and "from"', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplace.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"}
        ]);
    });

    describe('Nested replace', function() {
        const project = sheetFromFile(`${DIR}/nestedSame.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGramble(project, [
            {text: "w"}
        ], undefined, 4);
    });
    
    describe('Nested replace with some unchanged letters', function() {
        const project = sheetFromFile(`${DIR}/nestedSameWithUnchanged.csv`);
        testHasVocab(project, {text: 5})
        testErrors(project, []);
        testGramble(project, [
            {text: "awc"}
        ], undefined, 4);
    });

    describe('Nested replace 2', function() {
        const project = sheetFromFile(`${DIR}/nestedSame2.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGramble(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Rule cascade', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade.csv`);
        testErrors(project, []);
        testGramble(project, [
            {text: "w"}
        ], undefined, 4);
    });

    
    describe('Rule cascade 2', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade2.csv`);
        testErrors(project, []);
        testGramble(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Simple replace with pre', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPre.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"arba"}
        ]);
    });

    describe('Simple replace with post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPost.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"abra"}
        ]);
    });

    describe('Simple replace with pre and post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPrePost.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });

    
    describe('Replace with a regex in from', function() {
        const project = sheetFromFile(`${DIR}/ruleFromRegex.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"ava"}
        ]);
    });

    describe('Replace with a regex in to', function() {
        const project = sheetFromFile(`${DIR}/ruleToRegex.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"apa"},
            {"text":"ava"}
        ]);
    });

    describe('Replace with a regex in pre', function() {
        const project = sheetFromFile(`${DIR}/rulePreRegex.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });

    describe('Replace with a regex in post', function() {
        const project = sheetFromFile(`${DIR}/rulePostRegex.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });

});