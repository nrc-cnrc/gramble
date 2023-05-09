import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "multi";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1. Multi-sheet project', test({
        id: "1",
        results: [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]
    }));
    
    describe('2. Multi-sheet project with lowercase sheet reference', 
    test({
        id: "2",
        results: [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]
    }));

    describe('3. Multi-sheet project with a "bare" sheet reference', test({
        id: "3",
        errors: [ Error(1,1) ],
        results: [
            { text: "able" }
        ]
    }));
    
    describe('4. Multi-sheet project with a "bare" reference to "bare" grammar', test({
        id: "4",
        results: [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]
    }));

    describe('5. Multi-sheet project with missing symbol in imported sheet', test({
        id: "5",
        errors: [ Error(1,1) ],
        results: [
            { text: "able" }
        ]
    }));
    
    describe('6. Multi-sheet with reserved word reference', test({
        id: "6",
        errors: [ Error(1,1) ],
        results: [
            { text: "able" }
        ]
    }));

    describe('7. Multi-sheet project referencing non-existent sheet', test({
        id: "7",
        errors: [ Error(1,1) ],
        results: [
            { text: "able" }
        ]
    }));

    describe('8. Multi-sheet project where the imported sheet references the original', test({
        id: "8",
        results: [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]
    }));

    describe('9. Multi-sheet project with a reference to a collection in an external document', test({
        id: "9",
        results: [
            { text: "foobarable", gloss: "run-1SG" },
            { text: "moobarable", gloss: "jump-1SG" },
            { text: "foobazable", gloss: "run-2SG" },
            { text: "moobazable", gloss: "jump-2SG" }
        ]
    }));

    describe('10. Multi-sheet project with an all reference to a collection in an external document', test({
        id: "10",
        results: [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]
    }));
    
    describe('11. Multi-sheet project with the external reference in a collection', test({
        id: "11",
        symbol: "x.word",
        results: [
            { text: "fooable", gloss: "run" },
            { text: "mooable", gloss: "jump" },
        ]
    }));
});


