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

    describe('Correct grammar', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/simpleGrammar.csv");

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

        errors.logErrors();
        testNumErrors(errors, 0, "any");
        testHasSymbol(project, 'headerWithParens.word');
        const results = [...project.generate('headerWithParens.word')];
        testNumOutputs(results, 2);
        testHasOutput(results, "text", "foo");
        testHasOutput(results, "text", "moo");
    });

    describe('Correct grammar with unparseable header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/unparseableHeader.csv");

        testNumErrors(errors, 1, "error");

        testErrorInCell(errors, "unparseableHeader", 8, 3);
    });

    describe('Grammar with two children on the same line', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/childOnSameLine.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 0, "warning");
        testErrorInCell(errors, "childOnSameLine", 4, 4);
    });


    describe('Grammar with reserved word as header', function() {

        const [sheet, project, errors] = sheetFromFile("./tests/csvs/headerUsingReservedWord.csv");

        testNumErrors(errors, 2, "error");
        testNumErrors(errors, 0, "warning");
        testErrorInCell(errors, "headerUsingReservedWord", 4, 4);
        testErrorInCell(errors, "headerUsingReservedWord", 5, 4);
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
        testErrorInCell(errors, "tableObliteration", 6, 1);
    });
    
    describe('Grammar but with weird indentation', function() {
        
        const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/weirdIndentation.csv");

        testNumErrors(errors, 1, "error");
        testNumErrors(errors, 0, "warning");
        
        it("should have 'word' as its child", function() {
            expect(sheet.child).to.not.be.undefined;
            if (sheet.child == undefined) return;
            expect(sheet.child.text).to.equal("word");
        });
    });

    describe('Multi-sheet project', function() {

        const paths: [string, string][] = [
            [ "Source1", "./tests/csvs/simpleGrammar.csv"],
            [ "Source2", "./tests/csvs/externalRef.csv"]
        ];

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

});
