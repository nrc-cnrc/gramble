import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "cell";

function test(params: ProjectTest): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1a. Content with space', test({
        file: "1a",
        results: [
            { text: "moofoo", gloss: "run" }
        ]
    }));

    describe('1b. Content with escaped space', test({
        file: "1b",
        results: [
            { text: "moo foo", gloss: "run" }
        ]
    }));

    describe('2a. Content including alternation', test({
        file: "2a",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]
    }));
    
    describe('2b. Content including escaped |', test({
        file: "2b",
        results: [
            { text: "moo|foo", gloss: "run" },
        ]
    }));
    
    describe('3a. Content including alternation and spaces', test({
        file: "3a",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]
    }));

    describe('3b. Content including alternation and spaces 2', test({
        file: "3b",
        results: [
            {text: "foogoo", gloss: "run"},
            {text: "moo", gloss: "run"}
        ]
    }));

    describe('3c. Content including alternation and spaces 3', test({
        file: "3c",
        results: [
            {text: "foo", gloss: "run"},
            {text: "goomoo", gloss: "run"}
        ]
    }));

    describe('3d. Content including alternation and spaces 4', test({
        file: "3d",
        results: [
            { text: "foo", gloss: "run" },
            { text: "goo moo", gloss: "run" },
        ]
    }));

    describe('Content including one backslash', test({
        file: "4a",
        results: [
            { text: "foo", gloss: "run" },
        ]
    }));

    describe('Content including two backslashes', test({
        file: "4b",
        results: [
            { text: "\\foo", gloss: "run" },
        ]
    }));

    describe('Content including escaped backslash', test({
        file: "4c",
        results: [
            { text: "\\foo", gloss: "run" },
        ]
    }));
    
    describe('Content including parens', test({
        file: "5a",
        results: [
            { text: "(foo)", gloss: "run" },
        ]
    }));

    describe('Content including escaped parens', test({
        file: "5b",
        results: [
            { text: "(foo)", gloss: "run" },
        ]
    }));

    describe('Embed with alternation', test({
        file: "6a",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]
    }));
    
    describe('Embed with three-way alternation', test({
        file: "6b",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"},
            {"text":"noobar"},
            {"text":"soobar"}
        ]
    }));
    
    describe('Embed with curly braces', test({
        file: "7a",
        results: [
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [ Warning(5,2) ]
    }));
    
    describe('Embed with alt and curly braces', test({
        file: "7b",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [ Warning(9,2) ]
    }));
    
    describe('Embed with alt and curly braces 2', test({
        file: "7c",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [ Warning(9,2) ]
    }));

    describe('Embed with sequence', test({
        file: "8a",
        results: [
            {"text":"bar"},
        ],
        errors: [ Error(9,2) ]
    }));
    
    describe('Embed with alternation and space', test({
        file: "8b",
        results: [
            {"text":"bar"},
        ],
        errors: [ Error(13,2) ]
    }));
});