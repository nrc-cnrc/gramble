import { testProject, ProjectTest, Error, Warning } from "../testSheetUtil";

const defaults = { dir: "case" }

function test(params: ProjectTest): () => void {
    return function() {
        return testProject({ ...defaults, ...params });
    };
}

describe(`Sheets ${defaults.dir}`, function() {

    describe('Uppercase table ops', test({
        file: "1a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('Uppercase join op', test({
        file: "1b",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]
    }));
    
    describe('Uppercase embed header', test({
        file: "2a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
    
    describe('"OPTIONAL X" header to test header case insensitivity', test({
        file: "2b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    
    describe('Lowercase reference to uppercase symbol', test({
        file: "3a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('Uppercase reference to lowercase symbol', test({
        file: "3b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('Generating from uppercase ref to lowercase symbol ', test({
        file: "4",
        symbol: "WORD",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
});