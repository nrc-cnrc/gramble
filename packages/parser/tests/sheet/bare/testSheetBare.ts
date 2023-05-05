import { testProject, ProjectTest, Error, Warning } from "../testSheetUtil";

const DIR = "bare";

function test(params: ProjectTest): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1. Empty grammar', test({
        id: "1",
        results: undefined
    }));

    describe('2a. Bare grammar', test({
        id: "2a",
        symbol: "",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('2b. Bare grammar with table op', test({
        id: "2b",
        symbol: "",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('3a. Bare grammar with embeds', test({
        id: "3a",
        errors: [ Warning(8,0) ]
    }))
    
    describe('3b. Bare grammar with embeds and table op', test({
        id: "3b",
        errors: [ Warning(8,0) ]
    }))
    
    describe('4a. Generating from symbol before bare grammar', test({
        id: "4",
        errors: [ Warning(4,0) ],
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
        ]
    }));

    describe('5a. Content obliteration by bare table', test({
        id: "5",
        errors: [ Warning(0,0), Warning(4,0) ]
    }));
});