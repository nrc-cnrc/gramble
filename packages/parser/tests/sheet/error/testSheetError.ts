import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "error";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1a. Reserved word as header', test({
        id: "1a",
        errors: [ Error(4,4), Warning(5,4) ],
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ]
    }));

    describe('1b. Assignment to a reserved word', test({
        id: "1b",
        errors: [ Error(1,0), Warning(1,0) ],
        results: [
            {gloss: "-1SG",text: "bar"},
            {gloss: "-2SG",text: "baz"}
        ]
    }));

    describe('Sheet name using a reserved word', test({
        filename: "optional",
        errors: [
            { sheet: "optional", row: 0, col: 0, severity: "error" }
        ],
        results: undefined
    }));

    describe('2a. Assignment to an invalid identifier', test({
        id: "2a",
        errors: [ Error(0,0), Warning(0,0), Error(5,2) ],
        results: [{}]
    }));

    
    describe('2b. Identifier with a space', test({
        id: "2b",
        errors: [ Error(0,0), Warning(0,0), Error(5,2) ],
        results: [{}]
    }));

    describe('2c. Reassigning a symbol', test({
        id: "2c",
        errors: [ Error(4,0) ],
        results: [
            {text: "moo", gloss: "jump"},
            {text: "foo", gloss: "run"}
        ]
    }));
    
    describe('3. Reference to a missing symbol', test({
        id: "3",
        errors: [ Error(6,3) ],
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));  

    describe('4a. Op missing sibling argument', test({
        id: "4a",
        errors: [ Warning(9,0), Error(9,1) ],
        results: [{}]
    }));

    describe('4b. Bare join op, missing sibling argument', test({
        id: "4b",
        symbol: "",
        errors: [Error(0,0), Warning(0,0)],
        results: [{}]
    }));

    describe('4c. Op missing child argument', test({
        id: "4c",
        errors: [Warning(12,1)],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('5a. Assignment to the right of a binary op', test({
        id: "5a",
        errors: [ Error(12,2) ],
        results: [
            {text: "moo", gloss: "jump"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foo", gloss: "run"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ]
    }));

    describe('5b. Assignment above a binary op', test({
        id: "5b",
        errors: [ Error(9,1) ],
        results: [
            {text: "moo", gloss: "jump"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foo", gloss: "run"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ]
    }));
    
    describe('5c. Assignment inside another assignment', test({
        id: "5c",
        errors: [ Error(9,1) ],
        results: [
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ]
    }));
    
    describe('6a. Content obliteration by table', test({
        id: "6a",
        errors: [ Warning(0,0), Warning(4,0) ],
        results: undefined
    }));

    describe('6b. Content obliteration by assignment', test({
        id: "6b",
        errors: [ Error(0,0) ],
        results: [
            {text: "baz"},
            {text: "bar"}
        ]
    }));

    describe('7. Two children on the same line', test({
        id: "7",
        errors: [ Error(4,4) ],
        results: [
            {text: "foobarbaz", gloss: "run-1SG-2SG"}
        ]
    }));
    
    describe('8a. Space in a header', test({
        id: "8a",
        errors: [ Error(8,3), Warning(9,3) ],
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));
    
    describe('8b. Header with a literal space', test({
        id: "8b",
        errors: [ Error(0,1), Warning(1,1) ],
        results: [{}]
    }));

    describe('8c. Tape name beginning with number', test({
        id: "8c",
        errors: [ Error(0,1), Warning(1,1) ],
        results: [{}]
    }));

    describe('8d. Only header in a row in unparsable', test({
        id: "8d",
        errors: [ Error(0,1), Warning(1,1) ],
        results: [{}]
    }));
    
    describe('9. Grammar with weird indentation', test({
        id: "9",
        errors: [ Warning(10,1) ],
        results: [
            {text: "foobar", gloss: "run-1SG","finite":"true"}
        ]
    }));

    describe('10. Unique param header in ordinary tables', test({
        id: "10",
        errors: [ Error(0,2) ],
        results: [
            {text:"moobaz", gloss:"jump-2SG"},
            {text:"moobar", gloss:"jump-1SG"},
            {text:"foobaz", gloss:"run-2SG"},
            {text:"foobar", gloss:"run-1SG"}
        ]
    }));

});
