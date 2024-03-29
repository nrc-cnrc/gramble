import { testProject, ProjectTest, Error, Warning } from "../testSourceUtil";

const DIR = "basic";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Source ${DIR}`, function() {

    describe('1a. Minimal grammar', test({
        id: "1a",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ],
    }));
    
    describe('1b. Minimal grammar with no table: op', test({
        id: "1b",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));
    
    describe('1c. Minimal grammar with empty row', test({
        id: "1c",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('1d. Minimal grammar with empty column', test({
        id: "1d",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('2a. Embeds', test({
        id: "2",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('3a. Embeds with _ identifiers', test({
        id: "3a",
        symbol: "_Word",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));


    describe('3b. Headers with underscores', test({
        id: "3b",
        results: [
            { _text: "foobar", gloss_: "run-1SG" },
            { _text: "moobar", gloss_: "jump-1SG" },
            { _text: "foobaz", gloss_: "run-2SG" },
            { _text: "moobaz", gloss_: "jump-2SG" }
        ]
    }));

    describe('4a. Table with empty cell', test({
        id: "4",
        results: [
            { text: "foobar", gloss: "run-1SG", pos:"v" },
            { text: "moobar", gloss: "jump-1SG", pos:"v" },
            { text: "foobaz", gloss: "run-2SG", pos:"v" },
            { text: "moobaz", gloss: "jump-2SG", pos:"v"},
            { text: "foo", gloss: "run.3SG", pos:"v" },
            { text: "moo", gloss: "jump.3SG", pos:"v" }
        ]
    }));

    describe('5. Empty "table:" op', test({
        id: "5",
        results: [
            {text:"baz", gloss:"-2SG"},
            {text:"bar", gloss:"-1SG"}
        ],
        errors: [ Warning(1, 0), Error(1, 1) ]
    }));
    
    describe('6a. "optional text" header', test({
        id: "6a",
        results: [
            { text: "foo" },
            { text: "moo" },
            { text: "foobar" },
            { text: "moobar" },
        ]
    }));

    describe('6b. "optional embed" header', test({
        id: "6b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('7a. Slash header', test({
        id: "7a",
        results: [
            { text: "foobar", gloss: "foo-1SG" },
            { text: "moobar", gloss: "moo-1SG" },
            { text: "foobaz", gloss: "foo-2SG" },
            { text: "moobaz", gloss: "moo-2SG" }
        ]
    }));
    
    describe('7b. Double slash header', test({
        id: "7b",
        results: [
            { text: "foobar", gloss: "foo-1SG", root: "foo" },
            { text: "moobar", gloss: "moo-1SG", root: "moo" },
            { text: "foobaz", gloss: "foo-2SG", root: "foo" },
            { text: "moobaz", gloss: "moo-2SG", root: "moo" }
        ]
    }));

    describe('8. Header commented out', test({
        id: "8",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('9. Headers with lots of parens', test({
        id: "9",
        results: [
            { text: "foo", gloss: "foo" },
            { text: "moo", gloss: "moo" }
        ]
    }));

    describe('10. Empty assignment', test({
        id: "10",
        results: [{}],
        errors: [ Warning(0, 0) ]
    }));
    
    describe('11. Nested tables', test({
        id: "11",
        results: [{}],
        errors: [ Warning(0, 0), Error(0, 1) ]
    }));
});