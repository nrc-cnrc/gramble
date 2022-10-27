import { testGrammar, testErrors, sheetFromFile } from "../../testUtil";
import * as path from 'path';

const DIR = `${path.dirname(module.filename)}/csvs`;

describe(`${path.basename(module.filename)}`, function() {

    describe('or: operation', function() {
        const project = sheetFromFile(`${DIR}/orOp.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "foobar", gloss: "run[2SG]" },
            { text: "moobar", gloss: "jump[2SG]" },
        ]);
    });

    describe('Grammar with embeds and a relevant join', function() {
        const project = sheetFromFile(`${DIR}/relevantJoin.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });

    describe('Table op within a join', function() {
        const project = sheetFromFile(`${DIR}/joinUnderTable.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });
    
    
    describe('Grammar with embeds and a relevant join, under assignment', function() {
        const project = sheetFromFile(`${DIR}/relevantJoinUnderAssignment.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });

    describe('Grammar with embeds and a relevant join, under assignment', function() {
        const project = sheetFromFile(`${DIR}/joinUnderAssignmentEmbedded.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });

    describe('Grammar with embeds and an irrelevant join', function() {
        const project = sheetFromFile(`${DIR}/irrelevantJoin.csv`);
        testErrors(project, []);
        testGrammar(project, [
            { text: "foobar", gloss: "run[1SG]", lang: "foobese" },
            { text: "moobar", gloss: "jump[1SG]", lang: "foobese" },
            { text: "foobaz", gloss: "run[2SG]", lang: "foobese" },
            { text: "moobaz", gloss: "jump[2SG]", lang: "foobese" }
        ]);
    });


});
