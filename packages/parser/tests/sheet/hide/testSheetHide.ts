import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "hide";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1. Hide header', test({
        id: "1",
        results: [
            { text: "foo" }
        ]
    }));
    
    describe('2. Hiding an irrelevant tape', test({
        id: "2",
        errors: [ Error(1,4) ],
        results: [
            { text: "foo", gloss: "run" }
        ]
    }));
    
    describe('3. Hide header with embeds', test({
        id: "3",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]" }
        ]
    }));

    describe('4. Two hide headers', test({
        id: "4",
        results: [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]
    }));
    
    describe('5. Nested hide headers', test({
        id: "5",
        results: [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]
    }));

    describe('6. Hide header with a slash value', test({
        id: "6",
        results: [
            { text: "foobar", gloss: "run[1SG]" },
            { text: "moobar", gloss: "jump[1SG]" },
            { text: "foobaz", gloss: "run[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]" },
            { text: "foo", gloss: "run[3SG]" },
            { text: "moo", gloss: "jump[3SG]" }
        ]
    }));
});