import { Project } from "../../src/project";
import { dirname, basename } from "path";
import { testProject, testErrors, testStructure } from "./testUtilsAst";
import { TextDevEnvironment } from "../../src/textInterface";

import * as path from 'path';

export function sheetFromFile(path: string): Project {

    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = new Project(devEnv);
    project.addSheet(sheetName);
    //project.runChecks();
    return project;
}

describe(`${path.basename(module.filename)}`, function() {

    describe('Minimal grammar', function() {

        const project = sheetFromFile("./tests/csvs/minimalGrammar.csv");

        testErrors(project, []);
        testStructure(project, [
            ["word",    ["child"]],
            ["table",   ["child", "child"]]
        ]);
        //testSymbols(project, ["word"]);
        testProject(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Minimal grammar with no table: op', function() {

        const project = sheetFromFile("./tests/csvs/minimalGrammarNoTable.csv");

        testErrors(project, []);
        testStructure(project, [
            ["word",    ["child"]]
        ]);
        //testSymbols(project, ["word"]);
        testProject(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });
    
    describe('Bare grammar', function() {

        const project = sheetFromFile("./tests/csvs/bareGrammar.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with table', function() {

        const project = sheetFromFile("./tests/csvs/bareGrammarWithTable.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Embeds', function() {

        const project = sheetFromFile("./tests/csvs/embedGrammar.csv");

        testErrors(project, []);
        testStructure(project, [
            ["word",    ["child"]],
            ["suffix",  ["child", "sibling"]],
            ["table",   ["child", "sibling", "child"]],
            ["verb",    ["child", "sibling", "sibling"]],
            ["table",   ["child", "child"]]
        ]);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Uppercase table: ops', function() {

        const project = sheetFromFile("./tests/csvs/uppercaseTable.csv");

        testErrors(project, []);
        testStructure(project, [
            ["word",    ["child"]],
            ["suffix",  ["child", "sibling"]],
            ["Table",   ["child", "sibling", "child"]],
            ["verb",    ["child", "sibling", "sibling"]],
            ["table",   ["child", "child"]]
        ]);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    
    describe('Uppercase embed header', function() {

        const project = sheetFromFile("./tests/csvs/uppercaseEmbed.csv");

        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Uppercase reference to lowercase symbol', function() {

        const project = sheetFromFile("./tests/csvs/uppercaseSymbol.csv");

        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Lowercase reference to uppercase symbol', function() {

        const project = sheetFromFile("./tests/csvs/lowercaseSymbol.csv");

        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    describe('Bare grammar with embeds', function() {

        const project = sheetFromFile("./tests/csvs/bareGrammarWithEmbeds.csv");
        testErrors(project, []);
        //testSymbols(project, ["verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Table with empty cell', function() {

        const project = sheetFromFile("./tests/csvs/emptyCell.csv");

        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run.3SG" },
            { text: "moo", gloss: "jump.3SG" }
        ]);
    });

    describe('or: operation', function() {

        const project = sheetFromFile("./tests/csvs/orOp.csv");

        testErrors(project, []);
        testStructure(project, [
            ["word",    ["child"]],
            ["verb",  ["child", "sibling"]],
            ["or",   ["child", "child"]],
            ["table",    ["child", "child", "sibling"]]
        ]);
        //testSymbols(project, ["word", "verb"]);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "foobar", gloss: "run[2SG]" },
            { text: "moobar", gloss: "jump[2SG]" },
        ]);
    });

    describe('Reference to a missing symbol', function() {

        const project = sheetFromFile("./tests/csvs/missingSymbol.csv");
        testErrors(project, [
            ["missingSymbol", 6, 3, "error"]
        ]);
        //testSymbols(project, ["word", "verb"]);
        testProject(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });  

    describe('Grammar with embeds and an irrelevant join', function() {

        const project = sheetFromFile("./tests/csvs/irrelevantJoin.csv");

        testErrors(project, []);
        testStructure(project, [
            ["join",    ["child", "child"]],
            ["table",      ["child", "child", "sibling"]],
        ]);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]", lang: "foobese" },
            { text: "moobar", gloss: "jump[1SG]", lang: "foobese" },
            { text: "foobaz", gloss: "run[2SG]", lang: "foobese" },
            { text: "moobaz", gloss: "jump[2SG]", lang: "foobese" }
        ]);
    });

    describe('Grammar with embeds and a relevant join', function() {

        const project = sheetFromFile("./tests/csvs/relevantJoin.csv");

        testErrors(project, []);
        testStructure(project, [
            ["join",    ["child", "child"]],
            ["table",      ["child", "child", "sibling"]],
        ]);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });

    describe('"maybe text" header', function() {

        const project = sheetFromFile("./tests/csvs/maybeHeader.csv");
        
        testErrors(project, []);
        testProject(project, [
            { text: "foo" },
            { text: "moo" },
            { text: "foobar" },
            { text: "moobar" },
        ]);
    });

    describe('"maybe embed" header', function() {

        const project = sheetFromFile("./tests/csvs/maybeEmbed.csv");
        
        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    
    describe('"MAYBE X" header to test case insensitivity', function() {

        const project = sheetFromFile("./tests/csvs/uppercaseMaybe.csv");
        
        testErrors(project, []);
        //testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('"text/gloss" header', function() {

        const project = sheetFromFile("./tests/csvs/slashHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "foo-1SG" },
            { text: "moobar", gloss: "moo-1SG" },
            { text: "foobaz", gloss: "foo-2SG" },
            { text: "moobaz", gloss: "moo-2SG" }
        ]);
    });

    describe('Header commented out', function() {

        const project = sheetFromFile("./tests/csvs/commentHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Headers with lots of parens', function() {

        const project = sheetFromFile("./tests/csvs/headerWithParens.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foo", gloss: "foo" },
            { text: "moo", gloss: "moo" }
        ]);
    });

    describe('Unparseable header', function() {

        const project = sheetFromFile("./tests/csvs/unparseableHeader.csv");
        testErrors(project, [
            ["unparseableHeader", 8, 3, "error"],
            ["unparseableHeader", 9, 3, "warning"]
        ]);
    });

    describe('Two children on the same line', function() {

        const project = sheetFromFile("./tests/csvs/childOnSameLine.csv");
        testErrors(project, [
            ["childOnSameLine", 4, 4, "error"]
        ]);
    });
    

    describe('Reserved word as header', function() {

        const project = sheetFromFile("./tests/csvs/headerUsingReservedWord.csv");
        testErrors(project, [
            ["headerUsingReservedWord", 4, 4, "error"],
            ["headerUsingReservedWord", 5, 4, "warning"]
        ]);
    });

    describe('Reassigning a symbol', function() {

        const project = sheetFromFile("./tests/csvs/reassigningSymbol.csv");
        testErrors(project, [
            ["reassigningSymbol", 4, 0, "error"]
        ]);
    });

    describe('Nested tables', function() {

        const project = sheetFromFile("./tests/csvs/nestedTables.csv");
        testErrors(project, []);
        testStructure(project, [
            ["word",    ["child"]],
            ["join",    ["child", "child"]],
            ["or",      ["child", "child", "sibling"]],
            ["verb",    ["child", "sibling", "sibling"]],
            ["table",   ["child", "child", "sibling", "sibling"]],
            ["join",    ["child", "child", "sibling", "child"]],
            ["table",   ["child", "child", "sibling", "child", "sibling"]],
        ]);
    });

    describe('Grammar with weird indentation', function() {
        
        const project = sheetFromFile("./tests/csvs/weirdIndentation.csv");
        testErrors(project, [
            ["weirdIndentation", 10, 1, "warning"]
        ]);
        testStructure(project, [
            ["word",    ["child"]],
            ["join",    ["child", "child"]],
            ["table",    ["child", "child", "sibling"]],
        ]);
    });

    describe('Hide header', function() {

        const project = sheetFromFile("./tests/csvs/hide.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foo" }
        ]);
    });
    
    describe('Hiding an irrelevant tape', function() {

        const project = sheetFromFile("./tests/csvs/hideIrrelevant.csv");

        testErrors(project, 
            [["hideIrrelevant", 1, 4, "error"]]
        );
        
        testProject(project, [
            { text: "foo", gloss: "run" }
        ]);
    });

    describe('Hide header with embeds', function() {

        const project = sheetFromFile("./tests/csvs/hideEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Two hide headers', function() {

        const project = sheetFromFile("./tests/csvs/doubleHide.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]);
    });
    
    describe('Hide header with a slash value', function() {

        const project = sheetFromFile("./tests/csvs/doubleHideSlash.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]);
    });
    
    /*
    describe('Reveal header', function() {

        const project = sheetFromFile("./tests/csvs/reveal.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobar" },
            { text: "moobar" },
            { text: "foobaz" },
            { text: "moobaz" },
            { text: "foo" },
            { text: "moo" }
        ]);
    });

    describe('Reveal header with a slash value', function() {

        const project = sheetFromFile("./tests/csvs/revealWithSlash.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]);
    });
*/
});


