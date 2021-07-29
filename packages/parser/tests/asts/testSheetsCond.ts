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

    /*
    describe('Join header', function() {

        const project = sheetFromFile("./tests/csvs/flagHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Join header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/flagHeaderWithOr.csv");

        testErrors(project, []);
        testProject(project, [
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
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "[2SG][1SG]"  },
            { text: "moobar", gloss: "jump[1SG]", subj: "[2SG][1SG]"  },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG][2SG]"  },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG][2SG]"  }
        ]);
    });

    describe('Trivial Join header', function() {

        const project = sheetFromFile("./tests/csvs/trivialFlagHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]", mood: "[IMP]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]", mood: "[IMP]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", mood: "[IMP]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", mood: "[IMP]" }
        ]);
    });

    describe('Complex Join header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    
    describe('Complex Join header, other direction', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader2.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    describe('Join header around a slash header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader3.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    describe('@X/@Y header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader4.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]" }
        ]);
    });

    
    describe('X/@Y/Z header', function() {

        const project = sheetFromFile("./tests/csvs/complexFlagHeader5.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobeez", gloss: "run[IMP]", subj: "[IMP]", mood: "[IMP]", order: "[IMP]" },
            { text: "moobeez", gloss: "jump[IMP]", subj: "[IMP]", mood: "[IMP]", order: "[IMP]" }
        ]);
    });

    describe('@embed header', function() {

        const project = sheetFromFile("./tests/csvs/flagEmbed.csv");
    
        testErrors(project, []);
        testProject(project, [
            {"subj":"[2SG]",    "text":"foobaz",    "gloss":"run[2SG]"},
            {"subj":"[IMP]",    "text":"foobeez",   "gloss":"run[IMP]"},
            {"subj":"[2SG]",    "text":"moobaz",    "gloss":"jump[2SG]"},
            {"subj":"[IMP]",    "text":"moobeez",   "gloss":"jump[IMP]"}
        ]);
    });
    */

    describe('Simple equals', function() {

        const project = sheetFromFile("./tests/csvs/simpleEquals.csv");

        testErrors(project, []);
        testProject(project, [
            {"pos":"v","text":"goo"},
            {"pos":"v","text":"foo"}
        ]);
    });

    
    describe('Equals to the left of a sequence', function() {

        const project = sheetFromFile("./tests/csvs/equalsHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" }
        ]);
    });

    describe('Nested equals header', function() {

        const project = sheetFromFile("./tests/csvs/nestedEquals.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", trans: "INTR" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", trans: "INTR" }
        ]);
    });
    
    describe('Equals header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/equalsOr.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    describe('Equals embed', function() {

        const project = sheetFromFile("./tests/csvs/equalsEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });
    
    describe('Equals embed where the symbol is defined later', function() {

        const project = sheetFromFile("./tests/csvs/equalsEmbedAfter.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
            ], 
            "__GLOBAL__.equalsEmbedAfter.word"
        );
    });
    
    describe('Equals header with not value', function() {

        const project = sheetFromFile("./tests/csvs/equalsNot.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]);
    });

    
    describe('Equals header with not embed', function() {

        const project = sheetFromFile("./tests/csvs/equalsNegatedEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            {gloss: "run[1SG]", subj: "[1SG]", text: "foobar"},
            {gloss: "jump[1SG]", subj: "[1SG]", text: "moobar"}
        ]);
    });

    describe('startswith header', function() {

        const project = sheetFromFile("./tests/csvs/startsWith.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    describe('startswith header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/startsWithOr.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });
    
    describe('startswith header with not value', function() {

        const project = sheetFromFile("./tests/csvs/startsWithNot.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith embed', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith embed where the symbol is defined later', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEmbedAfter.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ], 
        "__GLOBAL__.startsWithEmbedAfter.word");
    });

    describe('startswith negated embed', function() {

        const project = sheetFromFile("./tests/csvs/startsWithNegatedEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "ungoo", gloss: "[1SG]climb" }
        ]);
    });

    describe('startswith and equals modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEquals.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" }
        ]);
    });

    describe('equals and startswith modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/equalsStartsWith.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfoo", gloss: "[1SG]run", trans: "[INTR]" },
            { text: "ungoo", gloss: "[1SG]climb", trans: "[INTR]" },
            { text: "moo", gloss: "[1SG]see", trans: "[TR]" },
        ]);
    });
    
    describe('endswith header', function() {

        const project = sheetFromFile("./tests/csvs/endsWith.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" }
        ]);
    });

    describe('endswith header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/endsWithOr.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith header with not value', function() {

        const project = sheetFromFile("./tests/csvs/endsWithNot.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith embed', function() {

        const project = sheetFromFile("./tests/csvs/endsWithEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ]);
    });

    describe('endswith embed where the symbol is defined later', function() {

        const project = sheetFromFile("./tests/csvs/endsWithEmbedAfter.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]" },
            { text: "foobazk", gloss: "jump[1SG]" },
            { text: "foobask", gloss: "climb[1SG]" }
        ], 
        "__GLOBAL__.endsWithEmbedAfter.word");
    });

    describe('endswith negated embed', function() {

        const project = sheetFromFile("./tests/csvs/endsWithEmbedNot.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobaru", gloss: "climb[1SG]" }
        ]);
    });
    
    describe('endswith complex embed', function() {

        const project = sheetFromFile("./tests/csvs/endsWithComplexEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "foobor", gloss: "jump[1SG]" },
            { text: "foobart", gloss: "climb[1SG]" },
            { text: "foobatu", gloss: "eat[1SG]" }
        ]);
    });

    describe('endswith and equals modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/endsWithEquals.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });
    
    describe('equals and endswith modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/equalsEndsWith.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobarq", gloss: "run[1SG]", trans: "INTR" },
            { text: "foobazk", gloss: "jump[1SG]", trans: "INTR" },
            { text: "foobas", gloss: "see[1SG]", trans: "TR" }
        ]);
    });

    describe('startswith and endswith modifying same embed', function() {

        const project = sheetFromFile("./tests/csvs/startsWithEndsWith.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "umfooz", gloss: "[1SG]jump" }
        ]);
    });

    
    describe('Contains header', function() {

        const project = sheetFromFile("./tests/csvs/containsHeader.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" }
        ]);
    });

    describe('Contains header with alt value', function() {

        const project = sheetFromFile("./tests/csvs/containsOr.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    });

    describe('Contains header with not value', function() {

        const project = sheetFromFile("./tests/csvs/containsNot.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    }); 

    
    describe('Contains header with embed', function() {

        const project = sheetFromFile("./tests/csvs/containsEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ]);
    });

    describe('Contains header where the condition is defined after', function() {

        const project = sheetFromFile("./tests/csvs/containsEmbedAfter.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobaz", gloss: "run[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "moobaz", gloss: "jump[2SG.SUBJ]", subj: "[2SG.SUBJ]" },
            { text: "foo", gloss: "run[3SG.SUBJ]", subj: "[3SG.SUBJ]" },
            { text: "moo", gloss: "jump[3SG.SUBJ]", subj: "[3SG.SUBJ]" }
        ],
        "__GLOBAL__.containsEmbedAfter.word");
    });

    describe('Contains header with negated embed', function() {

        const project = sheetFromFile("./tests/csvs/containsNegatedEmbed.csv");

        testErrors(project, []);
        testProject(project, [
            { text: "foobar", gloss: "run[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
            { text: "moobar", gloss: "jump[1SG.SUBJ]", subj: "[1SG.SUBJ]" },
        ]);
    });
    
});


