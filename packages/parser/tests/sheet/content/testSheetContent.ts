import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Content including alternation', function() {
        const project = sheetFromFile(`${DIR}/contentAlternation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]);
    });

    describe('Content including escaped |', function() {
        const project = sheetFromFile(`${DIR}/escapedAlternation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "moo|foo", gloss: "run" },
        ]);
    });

    describe('Content including escaped backslash', function() {
        const project = sheetFromFile(`${DIR}/escapedBackslash.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "\\foo", gloss: "run" },
        ]);
    });
    
    describe('Content including parens', function() {
        const project = sheetFromFile(`${DIR}/parens.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "(foo)", gloss: "run" },
        ]);
    });

    describe('Content including escaped parens', function() {
        const project = sheetFromFile(`${DIR}/escapedParens.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "(foo)", gloss: "run" },
        ]);
    });

    describe('Content including one backslash', function() {
        const project = sheetFromFile(`${DIR}/backslash.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
        ]);
    });

    describe('Content including two backslashes', function() {
        const project = sheetFromFile(`${DIR}/doubleBackslash.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "\\foo", gloss: "run" },
        ]);
    });

    /*
    describe('Re embed', function() {
        const project = sheetFromFile(`${DIR}/reEmbed.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"foobar"},
            {"text":"moobar"}
        ]);
    });

    describe('Re embed with alternation', function() {
        const project = sheetFromFile(`${DIR}/reEmbedAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]);
    });

    describe('Re embed with sequence', function() {
        const project = sheetFromFile(`${DIR}/reEmbedSeq.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"fooboobar"},
            {"text":"foogoobar"},
            {"text":"mooboobar"},
            {"text":"moogoobar"}
        ]);
    }); */


});