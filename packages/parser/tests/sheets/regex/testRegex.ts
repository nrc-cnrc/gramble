import { testGrammar, testErrors, sheetFromFile } from "../../testUtils";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('Trivial regex', function() {
        const project = sheetFromFile(`${DIR}/regexTrivial.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "1SG" },
        ]);
    });

    describe('Re header with slash value', function() {
        const project = sheetFromFile(`${DIR}/regexSlash.csv`);
        testErrors(project, [
            ["regexSlash", 1, 3, "error"]
        ]);
        testGrammar(project, []);
    });

    describe('Regex including alternation', function() {
        const project = sheetFromFile(`${DIR}/regexAlternation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]);
    });

    describe('Regex including escaped |', function() {
        const project = sheetFromFile(`${DIR}/escapedAlternation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "moo|foo", gloss: "run" },
        ]);
    });
    
    describe('Regex including negation', function() {
        const project = sheetFromFile(`${DIR}/regexNegation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "eat" },
        ]);
    });

    describe('Regex including escaped ~', function() {
        const project = sheetFromFile(`${DIR}/escapedNegation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "~foo", gloss: "run" },
        ]);
    });

    describe('Regex including repetition', function() {
        const project = sheetFromFile(`${DIR}/regexRepetition.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { gloss:"be"},
            { text:"goo", gloss:"jump"},
            { text:"googoo", gloss:"jump.impf"}
        ]);
    });

    describe('Regex including plus', function() {
        const project = sheetFromFile(`${DIR}/regexPlus.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"goo", gloss:"jump"},
            { text:"googoo", gloss:"jump.impf"}
        ]);
    });

    describe('Regex including question mark', function() {
        const project = sheetFromFile(`${DIR}/regexQuestion.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { gloss: "run" },
            { text: "foo", gloss: "run" }
        ]);
    });

    describe('Regex including negated alternation', function() {
        const project = sheetFromFile(`${DIR}/regexNegatedAlternation.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "goo", gloss: "jump" },
        ]);
    });

    describe('Regex including parens', function() {
        const project = sheetFromFile(`${DIR}/regexParens.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "run" },
        ]);
    });

    describe('Regex including escaped parens', function() {
        const project = sheetFromFile(`${DIR}/escapedParens.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "(foo)", gloss: "run" },
        ]);
    });

    describe('Regex including escaped backslash', function() {
        const project = sheetFromFile(`${DIR}/escapedBackslash.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "\\foo", gloss: "run" },
        ]);
    });
    
    describe('Non-regex including one backslash', function() {
        const project = sheetFromFile(`${DIR}/nonRegexBackslash.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "\\foo", gloss: "run" },
        ]);
    });

    describe('Non-regex including two backslashes', function() {
        const project = sheetFromFile(`${DIR}/nonRegexTwoBackslash.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "\\\\foo", gloss: "run" },
        ]);
    });

    describe('Regex including sequence', function() {
        const project = sheetFromFile(`${DIR}/regexSequence.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "1SG" },
        ]);
    });

    describe('Regex including sequence and alternation', function() {
        const project = sheetFromFile(`${DIR}/regexSequenceOr.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foo", gloss: "1SG" },
            { text: "foo", gloss: "2SG" },
        ]);
    });

    describe('Regex including sequence and negation', function() {
        const project = sheetFromFile(`${DIR}/regexSequenceNot.csv`);
        testErrors(project, []);
        testGrammar(project, [
            {gloss:"2SG", text:"goo"},
            {gloss:"1SG", text:"foo"}
        ]);
    });

    describe('Regex including sequence and repetition', function() {
        const project = sheetFromFile(`${DIR}/regexSequenceRep.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text:"bar", gloss:"be"},
            { text:"goobar", gloss:"jump"},
            { text:"googoobar", gloss:"jump.impf"}
        ]);
    });

    
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
    });


});