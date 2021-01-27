import { Project, EnclosureComponent } from "../src/sheetParser";
import { dirname, basename } from "path";
import { expect } from "chai";
import { testHasOutput, testNumOutputs, testNumErrors, testErrorInCell, testNumSymbols, testHasSymbol } from "./testUtils";
import { TextDevEnvironment } from "../src/textInterface";

import * as path from 'path';

export function sheetFromFile(path: string):
            [EnclosureComponent, Project, TextDevEnvironment ] {

    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = new Project(devEnv);

    project.addSheet(sheetName);
    const sheet = project.getSheet(sheetName);
    return [sheet, project, devEnv];
}

describe(`${path.basename(module.filename)}`, function() {

    
    describe('Minimal grammar', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/minimalGrammar.csv");

        testNumErrors(errors, 0, "any");

        it("should have 'word' as its child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.text).to.equal("word");
        });

        
        testNumSymbols(project, 1);
        testHasSymbol(project, 'minimalGrammar.word');
        const results = [...project.generate('minimalGrammar.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    });

    describe('Grammar with embeds', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/embedGrammar.csv");

        testNumErrors(errors, 0, "any");

        it("should have 'word' as its child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.text).to.equal("word");
        });

        it("should have 'suffix' as its child's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.sibling).to.not.be.undefined;
            if (sheet.child.sibling == undefined) return;
            expect(sheet.child.sibling.text).to.equal("suffix");
        });

        it("should have 'table' as its child's sibling's child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.sibling).to.not.be.undefined;
            if (sheet.child.sibling == undefined) return;
            expect(sheet.child.sibling.child).to.not.be.undefined;
            if (sheet.child.sibling.child == undefined) return;
            expect(sheet.child.sibling.child.text).to.equal("table");
        });

        it("should have 'verb' as its child's sibling's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.sibling).to.not.be.undefined;
            if (sheet.child.sibling == undefined) return;
            expect(sheet.child.sibling.sibling).to.not.be.undefined;
            if (sheet.child.sibling.sibling == undefined) return;
            expect(sheet.child.sibling.sibling.text).to.equal("verb");
        });


        it("should have no child's sibling's sibling's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.sibling).to.not.be.undefined;
            if (sheet.child.sibling == undefined) return;
            expect(sheet.child.sibling.sibling).to.not.be.undefined;
            if (sheet.child.sibling.sibling == undefined) return;
            expect(sheet.child.sibling.sibling.sibling).to.be.undefined;
        });

        it("should have 'table' as its child's child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.text).to.equal("table");
        });

        testNumSymbols(project, 3);
        testHasSymbol(project, 'embedGrammar.word');
        const results = [...project.generate('embedGrammar.word')];

        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
    });

    
    describe('Grammar with embeds and unit tests', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/embedGrammarWithTests.csv");

        testNumErrors(errors, 0, "any");

        testNumSymbols(project, 3);
        testHasSymbol(project, 'embedGrammarWithTests.word');
        const results = [...project.generate('embedGrammarWithTests.word')];

        testNumOutputs(results, 4);
    });

    
    describe('Negative tests', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/negativeTests.csv");

        testNumErrors(errors, 0, "any");
        errors.logErrors();
        testNumSymbols(project, 3);
        testHasSymbol(project, 'negativeTests.word');
        const results = [...project.generate('negativeTests.word')];
        testNumOutputs(results, 4);
    });

    describe('Failing unit tests', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/embedGrammarWithFailedTests.csv");

        testNumErrors(errors, 3, "error");
        testNumErrors(errors, 0, "warning");
        testErrorInCell(errors, "embedGrammarWithFailedTests", 14, 2);
        testErrorInCell(errors, "embedGrammarWithFailedTests", 15, 2);
        testErrorInCell(errors, "embedGrammarWithFailedTests", 16, 2);

        testNumSymbols(project, 3);
        testHasSymbol(project, 'embedGrammarWithFailedTests.word');
        const results = [...project.generate('embedGrammarWithFailedTests.word')];

        testNumOutputs(results, 4);
    });
    
    
    describe('Failing negative tests', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/failingNegativeTests.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 0, "warning");
        testErrorInCell(errors, "failingNegativeTests", 13, 2);

        testNumSymbols(project, 3);
        testHasSymbol(project, 'failingNegativeTests.word');
        const results = [...project.generate('failingNegativeTests.word')];
        testNumOutputs(results, 4);
    });

    
    describe('Grammar with empty cell', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/emptyCell.csv");

        testNumErrors(errors, 0, "any");

        testNumSymbols(project, 3);
        testHasSymbol(project, 'emptyCell.word');
        const results = [...project.generate('emptyCell.word')];

        testNumOutputs(results, 6);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    });

    
    describe('Grammar with a missing symbol', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/missingSymbol.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 0, "warning");
        testErrorInCell(errors, "missingSymbol", 6, 3);

        testNumSymbols(project, 2);
        testHasSymbol(project, 'missingSymbol.word');
        const results = [...project.generate('missingSymbol.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    }); 

    describe('Grammar with symbols and joins', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/simpleGrammar.csv");

        testNumErrors(errors, 0, "any");

        it("should have 'join' as its child's child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.text).to.equal("join");
        });

        it("should have 'table' as its child's child's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling == undefined) return;
            expect(sheet.child.child.sibling.text).to.equal("table");
        });

        testNumSymbols(project, 3);
        testHasSymbol(project, 'simpleGrammar.word');
        const results = [...project.generate('simpleGrammar.word')];

        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
    });

    describe('Grammar with "maybe" header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/maybeGrammar.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'maybeGrammar.word');
        const results = [...project.generate('maybeGrammar.word')];

        testNumOutputs(results, 6);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    });

    describe('Grammar with "text/gloss" header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/slashHeader.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'slashHeader.word');
        const results = [...project.generate('slashHeader.word')];

        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
        testHasOutput(results, "gloss", "foo-1SG");
        testHasOutput(results, "gloss", "foo-2SG");
        testHasOutput(results, "gloss", "moo-1SG");
        testHasOutput(results, "gloss", "moo-2SG");
    });

    describe('Grammar with suffix commented out', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/commentHeader.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'commentHeader.word');
        const results = [...project.generate('commentHeader.word')];
        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    });

    describe('Grammar with lots of parens in the headers', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/headerWithParens.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'headerWithParens.word');
        const results = [...project.generate('headerWithParens.word')];
        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    });

    describe('Grammar with unparseable header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/unparseableHeader.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 1, "warning");
        testErrorInCell(errors, "unparseableHeader", 8, 3);
        testErrorInCell(errors, "unparseableHeader", 9, 3);
    });

    
    describe('Non-assignments in first column', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/firstLevelNonAssignments.csv");

        testNumErrors(errors, 2, "error");
        testErrorInCell(errors, "firstLevelNonAssignments", 1, 0);
        testErrorInCell(errors, "firstLevelNonAssignments", 12, 0);
    });

    describe('Wayward operator not assigned to anything', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/waywardOperator.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 1, "warning");
        testErrorInCell(errors, "waywardOperator", 1, 1);
        testErrorInCell(errors, "waywardOperator", 5, 0);
    });


    describe('Grammar with two children on the same line', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/childOnSameLine.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 0, "warning");
        testErrorInCell(errors, "childOnSameLine", 4, 4);
    });


    describe('Grammar with reserved word as header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/headerUsingReservedWord.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 1, "warning");
        testErrorInCell(errors, "headerUsingReservedWord", 4, 4);
        testErrorInCell(errors, "headerUsingReservedWord", 5, 4);
    });

    
    describe('Reassigning a symbol', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/reassigningSymbol.csv");

        testNumErrors(errors, 1, "error");
        testErrorInCell(errors, "reassigningSymbol", 4, 0);
    });


    describe('Grammar with nested tables', function() {

        const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/nestedTables.csv");

        testNumErrors(errors, 0, "any");

        it("should have 'word' as its child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.text).to.equal("word");
        });

        it("should have 'join' as its child's child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.text).to.equal("join");
        });

        it("should have 'or' as its child's child's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling == undefined) return;
            expect(sheet.child.child.sibling.text).to.equal("or");
        });

        it("should have 'table' as its child's child's sibling's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling == undefined) return;
            expect(sheet.child.child.sibling.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling.sibling == undefined) return;
            expect(sheet.child.child.sibling.sibling.text).to.equal("table");
        });

        it("should have 'join' as its child's child's sibling's child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling == undefined) return;
            expect(sheet.child.child.sibling.child).to.not.be.undefined;
            if (sheet.child.child.sibling.child == undefined) return;
            expect(sheet.child.child.sibling.child.text).to.equal("join");
        });

        it("should have 'table' as its child's child's sibling's child's sibling", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.child).to.not.be.undefined;
            if (sheet.child.child == undefined) return;
            expect(sheet.child.child.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling == undefined) return;
            expect(sheet.child.child.sibling.child).to.not.be.undefined;
            if (sheet.child.child.sibling.child == undefined) return;
            expect(sheet.child.child.sibling.child.sibling).to.not.be.undefined;
            if (sheet.child.child.sibling.child.sibling == undefined) return;
            expect(sheet.child.child.sibling.child.sibling.text).to.equal("table");
        });

    });

    describe('Grammar with table obliteration', function() {

        const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/tableObliteration.csv");

        testNumErrors(errors, 0, "error");
        testNumErrors(errors, 1, "warning");
        testErrorInCell(errors, "tableObliteration", 14, 1);
    });
    
    describe('Grammar but with weird indentation', function() {
        
        const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/weirdIndentation.csv");

        testNumErrors(errors, 0, "error");
        testNumErrors(errors, 1, "warning");
        
        it("should have 'word' as its child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.text).to.equal("word");
        });
    });

    describe('Multi-sheet project', function() {

        const [sheet, project, devEnv] = sheetFromFile("./tests/csvs/externalRef.csv");

        testNumErrors(devEnv, 0, "any");

        testNumSymbols(project, 4);
        testHasSymbol(project, "simpleGrammar.word");
        testHasSymbol(project, "externalRef.word");

        const results = [...project.generate("externalRef.word")]

        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobarable");
        testHasOutput(results, "text", "foobazable");
        testHasOutput(results, "text", "moobarable");
        testHasOutput(results, "text", "moobazable");
    });

    
    describe('Multi-sheet project with missing symbol in imported sheet', function() {

        const [sheet, project, devEnv] = sheetFromFile("./tests/csvs/missingExternalRef.csv");

        testNumErrors(devEnv, 1, "error");
        testNumErrors(devEnv, 0, "warning");

        testNumSymbols(project, 4);
        testHasSymbol(project, "simpleGrammar.word");
        testHasSymbol(project, "missingExternalRef.word");

        const results = [...project.generate("missingExternalRef.word")]

        testNumOutputs(results, 1);
        testHasOutput(results, "text", "able");
    });

    describe('Multi-sheet project referencing non-existent sheet', function() {

        const [sheet, project, devEnv] = sheetFromFile("./tests/csvs/missingSheet.csv");

        testNumErrors(devEnv, 1, "error");
        testNumErrors(devEnv, 0, "warning");

        testNumSymbols(project, 1);
        testHasSymbol(project, "missingSheet.word");

        const results = [...project.generate("missingSheet.word")]

        testNumOutputs(results, 1);
        testHasOutput(results, "text", "able");
    });

    
    describe('Project with flag header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/flagHeader.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'flagHeader.word');
        const results = [...project.generate('flagHeader.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobaz");
    });

    
    describe('Project with flag header on right side', function() {

        // Flag headers only restrict things if they're on the left side!

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/flagHeaderOnRight.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'flagHeaderOnRight.word');
        const results = [...project.generate('flagHeaderOnRight.word')];

        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
    });

    describe('Project with trivial flag header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/trivialFlagHeader.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'trivialFlagHeader.word');
        const results = [...project.generate('trivialFlagHeader.word')];

        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobar");
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobar");
        testHasOutput(results, "text", "moobaz");
    });

    describe('Project with complex flag header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/complexFlagHeader.csv");

        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'complexFlagHeader.word');
        const results = [...project.generate('complexFlagHeader.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foobeez");
        testHasOutput(results, "text", "moobeez");
    });

    
    describe('Project with complex flag header, other direction', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/complexFlagHeader2.csv");

        testNumErrors(errors, 0, "any");

        testHasSymbol(project, 'complexFlagHeader2.word');
        const results = [...project.generate('complexFlagHeader2.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foobeez");
        testHasOutput(results, "text", "moobeez");
    });

    describe('Project with flag header around a slash header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/complexFlagHeader3.csv");

        testNumErrors(errors, 0, "any");

        testHasSymbol(project, 'complexFlagHeader3.word');
        const results = [...project.generate('complexFlagHeader3.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foobeez");
        testHasOutput(results, "text", "moobeez");
    });

    
    describe('Project with @X/@Y header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/complexFlagHeader4.csv");

        testNumErrors(errors, 0, "any");
        
        testHasSymbol(project, 'complexFlagHeader4.word');
        const results = [...project.generate('complexFlagHeader4.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foobeez");
        testHasOutput(results, "text", "moobeez");
    });

    
    describe('Project with X/@Y/Z header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/complexFlagHeader5.csv");

        testNumErrors(errors, 0, "any");

        testHasSymbol(project, 'complexFlagHeader5.word');
        const results = [...project.generate('complexFlagHeader5.word')];

        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foobeez");
        testHasOutput(results, "text", "moobeez");
    });

    describe('Project with @embed header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/flagEmbed.csv");
    
        testNumErrors(errors, 0, "any");
    
        testHasSymbol(project, 'flagEmbed.word');
        const results = [...project.generate('flagEmbed.word')];
    
        testNumOutputs(results, 4);
        testHasOutput(results, "text", "foobaz");
        testHasOutput(results, "text", "moobaz");
        testHasOutput(results, "text", "foobeez");
        testHasOutput(results, "text", "moobeez");
    });
    
});


