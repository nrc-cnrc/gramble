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
        id: "1a",
        results: [
            { text: "moofoo", gloss: "run" }
        ]
    }));

    describe('1b. Content with escaped space', test({
        id: "1b",
        results: [
            { text: "moo foo", gloss: "run" }
        ]
    }));

    describe('2a. Content including alternation', test({
        id: "2a",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]
    }));
    
    describe('2b. Content including escaped |', test({
        id: "2b",
        results: [
            { text: "moo|foo", gloss: "run" },
        ]
    }));
    
    describe('3a. Content including alternation and spaces', test({
        id: "3a",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "run" },
        ]
    }));

    describe('3b. Content including alternation and spaces 2', test({
        id: "3b",
        results: [
            {text: "foogoo", gloss: "run"},
            {text: "moo", gloss: "run"}
        ]
    }));

    describe('3c. Content including alternation and spaces 3', test({
        id: "3c",
        results: [
            {text: "foo", gloss: "run"},
            {text: "goomoo", gloss: "run"}
        ]
    }));

    describe('3d. Content including alternation and spaces 4', test({
        id: "3d",
        results: [
            { text: "foo", gloss: "run" },
            { text: "goo moo", gloss: "run" },
        ]
    }));

    describe('4a. Content including one backslash', test({
        id: "4a",
        results: [
            { text: "foo", gloss: "run" },
        ]
    }));

    describe('4b. Content including two backslashes', test({
        id: "4b",
        results: [
            { text: "\\foo", gloss: "run" },
        ]
    }));

    describe('4c. Content including escaped backslash', test({
        id: "4c",
        results: [
            { text: "\\foo", gloss: "run" },
        ]
    }));
    
    describe('5a. Content including parens', test({
        id: "5a",
        results: [
            { text: "(foo)", gloss: "run" },
        ]
    }));

    describe('5b. Content including escaped parens', test({
        id: "5b",
        results: [
            { text: "(foo)", gloss: "run" },
        ]
    }));

    describe('6a. Embed with alternation', test({
        id: "6a",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]
    }));
    
    describe('6b. Embed with three-way alternation', test({
        id: "6b",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"},
            {"text":"noobar"},
            {"text":"soobar"}
        ]
    }));
    
    describe('7a. Embed with curly braces', test({
        id: "7a",
        results: [
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [ Warning(5,2) ]
    }));
    
    describe('7b. Embed with alt and curly braces', test({
        id: "7b",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [ Warning(9,2) ]
    }));
    
    describe('7c. Embed with alt and curly braces 2', test({
        id: "7c",
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [ Warning(9,2) ]
    }));

    describe('8a. Embed with sequence', test({
        id: "8a",
        results: [
            {"text":"bar"},
        ],
        errors: [ Error(9,2) ]
    }));
    
    describe('8b. Embed with alternation and space', test({
        id: "8b",
        results: [
            {"text":"bar"},
        ],
        errors: [ Error(13,2) ]
    }));
});