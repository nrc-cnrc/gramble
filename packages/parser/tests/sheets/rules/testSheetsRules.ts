import { testGramble, testErrors, sheetFromFile, testHasTapes } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Replace with same tape name in "to" and "from"', function() {
        const project = sheetFromFile(`${DIR}/sameTapeReplace.csv`);
        testErrors(project, []);
        testGramble(project, [
            {"text":"ava"}
        ]);
    });

    describe('Nested replace', function() {
        const project = sheetFromFile(`${DIR}/nestedSame.csv`);
        testErrors(project, []);
        testGramble(project, [
            {text: "w"}
        ], undefined, 4);
    });
    
    describe('Nested replace 2', function() {
        const project = sheetFromFile(`${DIR}/nestedSame2.csv`);
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

});