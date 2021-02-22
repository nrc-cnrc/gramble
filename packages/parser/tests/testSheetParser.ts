import { Project } from "../src/sheetParser";
import { dirname, basename } from "path";
import { testProject, testErrors, testSymbols, testStructure } from "./testUtils";
import { TextDevEnvironment } from "../src/textInterface";

import * as path from 'path';

export function sheetFromFile(path: string): Project {

    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    const project = new Project(devEnv);
    project.addSheet(sheetName);
    project.runChecks();
    return project;
}

describe(`${path.basename(module.filename)}`, function() {
    
    describe('Minimal grammar', function() {

        const project = sheetFromFile("./tests/csvs/minimalGrammar.csv");

        testErrors(project, []);
        project.devEnv.logErrors();
        testStructure(project, [
            ["word",    ["child"]],
            ["table",   ["child", "child"]]
        ]);
        testSymbols(project, ["word"]);
        testProject(project, 'word', [
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
        testSymbols(project, ["word"]);
        testProject(project, 'word', [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar', function() {

        const project = sheetFromFile("./tests/csvs/bareGrammar.csv");

        testErrors(project, []);
        testProject(project, '__MAIN__', [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Bare grammar with table', function() {

        const project = sheetFromFile("./tests/csvs/bareGrammarWithTable.csv");

        testErrors(project, []);
        testProject(project, '__MAIN__', [
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
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    
    describe('Bare grammar with embeds', function() {

        const project = sheetFromFile("./tests/csvs/bareGrammarWithEmbeds.csv");
        project.devEnv.logErrors();
        testErrors(project, []);
        testSymbols(project, ["verb", "suffix"]);
        testProject(project, '__MAIN__', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    

    describe('Embeds and unit tests', function() {

        const project = sheetFromFile("./tests/csvs/embedGrammarWithTests.csv");

        testErrors(project, []);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Negative tests', function() {

        const project = sheetFromFile("./tests/csvs/negativeTests.csv");

        testErrors(project, []);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    describe('Failing unit tests', function() {

        const project = sheetFromFile("./tests/csvs/embedGrammarWithFailedTests.csv");
        testErrors(project, [
            ["embedGrammarWithFailedTests", 14, 2, "error"],
            ["embedGrammarWithFailedTests", 15, 2, "error"],
            ["embedGrammarWithFailedTests", 16, 2, "error"],
        ]);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });
    
    
    describe('Failing negative tests', function() {

        const project = sheetFromFile("./tests/csvs/failingNegativeTests.csv");
        testErrors(project, [
            ["failingNegativeTests", 13, 2, "error"]
        ]);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Table with empty cell', function() {

        const project = sheetFromFile("./tests/csvs/emptyCell.csv");

        testErrors(project, []);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
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
        testSymbols(project, ["word", "verb"]);
        testProject(project, 'word', [
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
        testSymbols(project, ["word", "verb"]);
        testProject(project, 'word', [
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
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
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
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]);
    });

    describe('"maybe X" header', function() {

        const project = sheetFromFile("./tests/csvs/maybeGrammar.csv");
        
        testErrors(project, []);
        testSymbols(project, ["word", "verb", "suffix"]);
        testProject(project, 'word', [
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
        testProject(project, 'word', [
            { text: "foobar", gloss: "foo-1SG" },
            { text: "moobar", gloss: "moo-1SG" },
            { text: "foobaz", gloss: "foo-2SG" },
            { text: "moobaz", gloss: "moo-2SG" }
        ]);
    });

    describe('Header commented out', function() {

        const project = sheetFromFile("./tests/csvs/commentHeader.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]);
    });

    describe('Headers with lots of parens', function() {

        const project = sheetFromFile("./tests/csvs/headerWithParens.csv");

        testErrors(project, []);
        testProject(project, 'word', [
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

    describe('Multi-sheet project', function() {

        const project = sheetFromFile("./tests/csvs/externalRef.csv");

        testErrors(project, []);
        testSymbols(project, [
            "word", 
            "embedGrammar.word", 
            "embedGrammar.verb", 
            "embedGrammar.suffix"
        ]);
        testProject(project, 'word', [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]);
    });

    
    describe('Multi-sheet project with missing symbol in imported sheet', function() {

        const project = sheetFromFile("./tests/csvs/missingExternalRef.csv");
        testErrors(project, [
            ["missingExternalRef", 1, 1, "warning"]
        ]);
        testProject(project, 'word', [
            { text: "able" }
        ]);
    });

    describe('Multi-sheet project referencing non-existent sheet', function() {

        const project = sheetFromFile("./tests/csvs/missingSheet.csv");
        testErrors(project, [
            ["missingSheet", 1, 1, "warning"]
        ]);
        testProject(project, 'word', [
            { text: "able" }
        ]);
    });

    
    describe('Join header', function() {

        const project = sheetFromFile("./tests/csvs/flagHeader.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Join header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/flagHeaderWithOr.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });
    
    describe('Join header on wrong side', function() {

        // Flag headers only restrict things if they're on the left side!

        const project = sheetFromFile("./tests/csvs/flagHeaderOnLeft.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run[1SG]", subj: "[2SG][1SG]"  },
            { text: "moobar", gloss: "jump[1SG]", subj: "[2SG][1SG]"  },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG][2SG]"  },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG][2SG]"  }
        ]);
    });

    describe('Trivial Join header', function() {

        const project = sheetFromFile("./tests/csvs/trivialFlagHeader.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]", mood: "[IMP]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]", mood: "[IMP]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", mood: "[IMP]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", mood: "[IMP]" }
        ]);
    });

    describe('Complex Join header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    
    describe('Complex Join header, other direction', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader2.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    describe('Join header around a slash header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader3.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    
    describe('@X/@Y header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader4.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    
    describe('X/@Y/Z header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader5.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]", order: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]", order: "[IMP]" }
        ]);
    });

    describe('@embed header', function() {

        const project = sheetFromFile("./tests/csvs/flagEmbed.csv");
    
        testErrors(project, []);
        testProject(project, 'word', [
            {"subj":"[2SG]",    "text":"foobaz",    "gloss":"run[2SG]"},
            {"subj":"[IMP]",    "text":"foobeez",   "gloss":"run[IMP]"},
            {"subj":"[2SG]",    "text":"moobaz",    "gloss":"jump[2SG]"},
            {"subj":"[IMP]",    "text":"moobeez",   "gloss":"jump[IMP]"}
        ]);
    });

    describe('Equals header', function() {

        const project = sheetFromFile("./tests/csvs/equalsHeader.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Nested equals header', function() {

        const project = sheetFromFile("./tests/csvs/nestedEquals.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", trans: "INTR" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", trans: "INTR" }
        ]);
    });
    
    describe('Equals header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/equalsOr.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });
    
    
    describe('Equals header with not value', function() {

        const project = sheetFromFile("./tests/csvs/equalsNot.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('startswith header', function() {

        const project = sheetFromFile("./tests/csvs/startsWith.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    
    describe('startswith header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/startsWithOr.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    
    describe('startswith header with not value', function() {

        const project = sheetFromFile("./tests/csvs/startsWithNot.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith embed header', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEmbed.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith and equals modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEquals.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" }
        ]);
    });

    describe('equals and startswith modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/equalsStartsWith.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" },
        ]);
    });
    
    describe('endswith header', function() {

        const project = sheetFromFile("./tests/csvs/endsWith.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" }
        ]);
    });

    describe('endswith header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/endsWithOr.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    
    describe('endswith header with not value', function() {

        const project = sheetFromFile("./tests/csvs/endsWithNot.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith embed header', function() {

        const project = sheetFromFile("./tests/csvs/endsWithEmbed.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith and equals modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/endsWithEquals.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });

    
    describe('equals and endswith modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/equalsEndsWith.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });


    describe('startswith and endswith modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEndsWith.csv");

        testErrors(project, []);
        testProject(project, 'word', [
            { text: "umfooz", gloss: "[1SG]jump" }
        ]);
    });
    
});


