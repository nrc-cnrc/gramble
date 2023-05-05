import { testProject, ProjectTest, Error, Warning } from "../testSheetUtil";

const defaults = { dir: "bare" }

function test(params: ProjectTest): () => void {
    return function() {
        return testProject({ ...defaults, ...params });
    };
}

describe(`Sheets ${defaults.dir}`, function() {

    describe('1. Empty grammar', test({
        file: "1",
        results: undefined
    }));

    describe('2a. Bare grammar', test({
        file: "2a",
        symbol: "",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('2b. Bare grammar with table op', test({
        file: "2b",
        symbol: "",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('Bare grammar with embeds', test({
        file: "3a",
        errors: [ Warning(8,0) ]
    }))
    
    describe('Bare grammar with embeds and table op', test({
        file: "3b",
        errors: [ Warning(8,0) ]
    }))
    
    describe('Generating from symbol before bare grammar', test({
        file: "4",
        errors: [ Warning(4,0) ],
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" },
        ]
    }));

    describe('Content obliteration by bare table', test({
        file: "5",
        errors: [ Warning(0,0), Warning(4,0) ]
    }));
});