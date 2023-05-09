import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "op";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1. or: operation', test({
        id: "1",
        results: [
            { text: "umfoo", gloss: "[1SG]run" },
            { text: "ummoo", gloss: "[1SG]jump" },
            { text: "foobar", gloss: "run[2SG]" },
            { text: "moobar", gloss: "jump[2SG]" }
        ]
    }));

    describe('2a. Grammar with embeds and a relevant join', test({
        id: "2a",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]
    }));

    describe('2b. Table op within a join', test({
        id: "2b",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]
    }));
    
    
    describe('2c. Grammar with embeds and a relevant join, under assignment', test({
        id: "2c",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]
    }));

    describe('2d. Grammar with embeds and a relevant join, under assignment 2', test({
        id: "2d",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "1SG" },
            { text: "moobar", gloss: "jump[1SG]", subj: "1SG" },
        ]
    }));

    describe('3. Grammar with embeds and an irrelevant join', test({
        id: "3",
        results: [
            { text: "foobar", gloss: "run[1SG]", lang: "foobese" },
            { text: "moobar", gloss: "jump[1SG]", lang: "foobese" },
            { text: "foobaz", gloss: "run[2SG]", lang: "foobese" },
            { text: "moobaz", gloss: "jump[2SG]", lang: "foobese" }
        ]
    }));
});
