import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSourceUtil";

const DIR = "rename";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Source ${DIR}`, function() {

    describe('1. Rename header', test({
        id: "1",
        results: [
            { text: "foo", gloss: "run" }
        ]
    }));

    describe('2. Renaming an irrelevant tape', test({
        id: "2",
        errors: [ Error(1,4) ],
        results: [
            { text: "foo", gloss: "run" }
        ]
    }));

    describe('3. Rename header with embeds', test({
        id: "3",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]", class: "v" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]", class: "v" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", class: "v" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", class: "v" },
            { text: "foo", gloss: "run[3SG]", subj: "[3SG]", class: "v" },
            { text: "moo", gloss: "jump[3SG]", subj: "[3SG]", class: "v" }
        ]
    }));

    describe('4. Renaming to a name that already exists', test({
        id: "4",
        errors: [ Error(10,3) ],
        results: [
            {"pos":"v","text":"moo","gloss":"jump[3SG]","subj":"[3SG]"},
            {"pos":"v","text":"foo","gloss":"run[3SG]","subj":"[3SG]"},
            {"pos":"v","text":"moobaz","gloss":"jump[2SG]","subj":"[2SG]"},
            {"pos":"v","text":"foobaz","gloss":"run[2SG]","subj":"[2SG]"},
            {"pos":"v","text":"moobar","gloss":"jump[1SG]","subj":"[1SG]"},
            {"pos":"v","text":"foobar","gloss":"run[1SG]","subj":"[1SG]"}
        ]
    }));
});