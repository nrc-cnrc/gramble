import { testGramble, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Regex including alternation', function() {
        const project = sheetFromFile(`${DIR}/regexAlternation.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]);
    });

    describe('Regex including escaped |', function() {
        const project = sheetFromFile(`${DIR}/escapedAlternation.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "moo|foo", gloss: "run" },
        ]);
    });
    
    describe('Regex including negation', function() {
        const project = sheetFromFile(`${DIR}/regexNegation.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "eat" },
        ]);
    });

    describe('Regex including escaped ~', function() {
        const project = sheetFromFile(`${DIR}/escapedNegation.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "~foo", gloss: "run" },
        ]);
    });

    describe('Regex including negated alternation', function() {
        const project = sheetFromFile(`${DIR}/regexNegatedAlternation.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "goo", gloss: "jump" },
        ]);
    });

    describe('Regex including parens', function() {
        const project = sheetFromFile(`${DIR}/regexParens.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "run" },
        ]);
    });

    describe('Regex including escaped parens', function() {
        const project = sheetFromFile(`${DIR}/escapedParens.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "(foo)", gloss: "run" },
        ]);
    });

    describe('Regex including sequence', function() {
        const project = sheetFromFile(`${DIR}/regexSequence.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "1SG" },
        ]);
    });

    describe('Regex including sequence and alternation', function() {
        const project = sheetFromFile(`${DIR}/regexSequenceOr.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "1SG" },
            { text: "foo", gloss: "2SG" },
        ]);
    });

    describe('Regex including sequence and negation', function() {
        const project = sheetFromFile(`${DIR}/regexSequenceNot.csv`);
        testErrors(project, []);
        testGramble(project, [
            { text: "foo", gloss: "1SG" },
            { text: "goo", gloss: "2SG" },
        ]);
    });

});