import { 
    testErrors, sheetFromFile, 
    testHasVocab, testGrammar 
} from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Simple replace', function() {
        const project = sheetFromFile(
            `${DIR}/sameTapeReplace.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    }); 
    
    describe('Simple replace with embed', function() {
        const project = sheetFromFile(
            `${DIR}/replaceEmbed.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });
    
    describe('Simple replace with two embed', function() {
        const project = sheetFromFile(
            `${DIR}/replaceTwoEmbed.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Simple replace with two embed 2', function() {
        const project = sheetFromFile(
            `${DIR}/replaceTwoEmbed2.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"}
        ]);
    });

    describe('Nested replace', function() {
        const project = sheetFromFile(`${DIR}/nestedSame.csv`);
        testHasVocab(project, {text: 3})
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });
    
    describe('Nested replace with some unchanged letters', function() {
        const project = sheetFromFile(`${DIR}/nestedSameWithUnchanged.csv`);
        testHasVocab(project, {text: 5})
        testErrors(project, []);
        testGrammar(project, [
            {text: "awc"}
        ]);
    });

    describe('Nested replace 2', function() {
        const project = sheetFromFile(`${DIR}/nestedSame2.csv`);
        testHasVocab(project, {text: 4})
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Rule cascade', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "w"}
        ]);
    });

    
    describe('Rule cascade 2', function() {
        const project = sheetFromFile(`${DIR}/ruleCascade2.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "ev"}
        ]);
    });
    
    describe('Simple replace with pre', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPre.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"}
        ]);
    });

    describe('Simple replace with post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"}
        ]);
    });

    describe('Simple replace with pre and post', function() {
        const project = sheetFromFile(`${DIR}/ruleWithPrePost.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"arba"}
        ]);
    });

    
    describe('Replace with a regex in from', function() {
        const project = sheetFromFile(`${DIR}/ruleFromRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"ava"}
        ]);
    });

    describe('Replace with a regex in to', function() {
        const project = sheetFromFile(`${DIR}/ruleToRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"apa"},
            {"text":"ava"}
        ]);
    });

    describe('Replace with a regex in pre', function() {
        const project = sheetFromFile(`${DIR}/rulePreRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"arba"},
            {"text":"iva"}
        ]);
    });

    describe('Replace with a regex in post', function() {
        const project = sheetFromFile(`${DIR}/rulePostRegex.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"ava"},
            {"text":"abra"},
            {"text":"avi"}
        ]);
    });
});