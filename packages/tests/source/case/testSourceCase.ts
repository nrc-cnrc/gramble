import { 
    testProject, ProjectTest
} from "../testSourceUtil";

const DIR = "case";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Source ${DIR}`, function() {

    describe('1a. Uppercase table ops', test({
        id: "1a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('1b. Uppercase join op', test({
        id: "1b",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]
    }));
    
    describe('2a. Uppercase embed header', test({
        id: "2a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
    
    describe('2b. Uppercase optional header', test({
        id: "2b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" },
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    
    describe('3a. Lowercase reference to uppercase symbol', test({
        id: "3a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('3b. Uppercase reference to lowercase symbol', test({
        id: "3b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('4. Generating from uppercase ref to lowercase symbol ', test({
        id: "4",
        symbol: "WORD",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
});