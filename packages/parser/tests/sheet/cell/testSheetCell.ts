import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Content with space', function() {
        const project = sheetFromFile(`${DIR}/contentWithSpace.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "moofoo", gloss: "run" }
        ]);
    });

    describe('Content with escaped space', function() {
        const project = sheetFromFile(`${DIR}/contentWithEscapedSpace.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "moo foo", gloss: "run" }
        ]);
    });

    describe('Content including alternation', function() {
        const project = sheetFromFile(`${DIR}/contentAlternation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]);
    });
    
    describe('Content including alternation and spaces', function() {
        const project = sheetFromFile(`${DIR}/contentAlternationSpace.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]);
    });

    describe('Content including alternation and spaces 2', function() {
        const project = sheetFromFile(`${DIR}/contentAlternationSpace2.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "foogoo", gloss: "run"},
            {text: "moo", gloss: "run"}
        ]);
    });

    
    describe('Content including alternation and spaces 3', function() {
        const project = sheetFromFile(`${DIR}/contentAlternationSpace3.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {text: "foo", gloss: "run"},
            {text: "goomoo", gloss: "run"}
        ]);
    });

    describe('Content including alternation and spaces 4', function() {
        const project = sheetFromFile(`${DIR}/contentAlternationSpace4.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "goo moo", gloss: "run" },
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

    describe('Embed with alternation', function() {
        const project = sheetFromFile(`${DIR}/embedAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]);
    });
    
    describe('Embed with curly braces', function() {
        const project = sheetFromFile(`${DIR}/embedBraces.csv`);
        testErrors(project, [
            ["embedBraces", 5, 2, "warning"]
        ]);
        testGrammar(project, [
            {"text":"foobar"},
            {"text":"moobar"}
        ]);
    });
    
    describe('Embed with alt and curly braces', function() {
        const project = sheetFromFile(`${DIR}/embedAltBraces.csv`);
        testErrors(project, [
            ["embedAltBraces", 9, 2, "warning"]
        ]);
        testGrammar(project, [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]);
    });
    
    describe('Embed with alt and curly braces 2', function() {
        const project = sheetFromFile(`${DIR}/embedAltBraces2.csv`);
        testErrors(project, [
            ["embedAltBraces2", 9, 2, "warning"]
        ]);
        testGrammar(project, [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]);
    });
    
    describe('Embed with three-way alternation', function() {
        const project = sheetFromFile(`${DIR}/embedThreeAlt.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"},
            {"text":"noobar"},
            {"text":"soobar"}
        ]);
    });

    describe('Embed with sequence', function() {
        const project = sheetFromFile(`${DIR}/embedSeq.csv`);
        testErrors(project, [
            ["embedSeq", 9, 2, "error"]
        ]);
        testGrammar(project, [
            {"text":"bar"},
        ]);
    }); 

    describe('Embed with alternation and space', function() {
        const project = sheetFromFile(`${DIR}/embedAltSpace.csv`);
        testErrors(project, [
            ["embedAltSpace", 13, 2, "error"]
        ]);
        testGrammar(project, [
            {"text":"bar"}
        ]);
    });
    

});