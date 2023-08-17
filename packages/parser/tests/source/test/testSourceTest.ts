import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSourceUtil";

const DIR = "test";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Source ${DIR}`, function() {

    describe('1. Simple grammar with unit tests', test({
        id: "1",
        results: [
            { text: "foobar", gloss: "run-1SG" }
        ]
    }));

    describe('2. Embeds and unit tests', test({
        id: "2",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('3. Test with an empty string', test({
        id: "3",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foobat", gloss: "run" },
            { text: "moobat", gloss: "jump" }
        ]
    }));

    describe('4. Testing a grammar directly underneath (without "table:" op)', test({
        id: "4",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('5. Negative tests', test({
        id: "5",
        errors: [
            Error(13,2)
        ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('6. Negative test with an empty string', test({
        id: "6",
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foobat", gloss: "run" },
            { text: "moobat", gloss: "jump" }
        ]
    }));

    describe('7. Failing unit tests', test({
        id: "7",
        errors: [
            Error(13,2),
            Error(14,2),
            Error(15,2),
            Error(16,2)
        ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('9. Failed test with an empty string', test({
        id: "8",
        errors: [
            Error(15,2),
        ],
        results: [
            { text: "foobar", gloss: "run[1SG]", subj: "[1SG]" },
            { text: "moobar", gloss: "jump[1SG]", subj: "[1SG]" },
            { text: "foobaz", gloss: "run[2SG]", subj: "[2SG]" },
            { text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]" },
            { text: "foobat", gloss: "run" },
            { text: "moobat", gloss: "jump" }
        ]
    }));

    describe('9. Failing negative tests', test({
        id: "9",
        errors: [
            Error(13,2)
        ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
    
    describe('10a. Testing nothing', test({
        id: "10a",
        errors: [
            Error(9,1),
            Error(9,0)
        ],
        results: [{}]
    }));
    
    describe('10b. Negative testing nothing', test({
        id: "10b",
        errors: [
            Error(9,1),
            Error(9,0)
        ],
        results: [{}]
    }));

    describe('11a. Missing unit tests', test({
        id: "11a",
        errors: [ Error(12,1) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('11b. Missing negative unit tests', test({
        id: "11b",
        errors: [ Error(12,1) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('12a. table: op under unit test', test({
        id: "12a",
        errors: [ Error(12,1) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('12b. table: op under negative unit test', test({
        id: "12b",
        errors: [ Error(12,1) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('13a. or: op under unit test', test({
        id: "13a",
        errors: [ Error(12,1) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('13b. or: op under negative unit test', test({
        id: "13b",
        errors: [ Error(12,1) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('14. Uniqueness tests', test({
        id: "14",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('15. Uniqueness tests with multiple uniqueness fields', test({
        id: "15",
        results: [
            { root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]" },
            { root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]" },
            { root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]" },
            { root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]" } 
        ]
    }));

    describe('16. Uniqueness tests failing', test({
        id: "16",
        errors: [
            Error(14,2),
            Error(16,2),
            Error(17,2)
        ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "foobar", gloss: "eat-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "foobaz", gloss: "eat-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    
    describe('17. Uniqueness tests failing due to missing field', test({
        id: "17",
        errors: [ Error(14,2) ],
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "foobar", gloss: "eat-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "foobaz", gloss: "eat-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('18. Uniqueness tests with multiple uniqueness fields, failing', test({
        id: "18",
        errors: [ Error(14,2) ],
        results: [
            { root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]" },
            { root: "run", subj: "[1SG]", text: "goobar", gloss: "run[1SG]" },
            { root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]" },
            { root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]" },
            { root: "run", subj: "[2SG]", text: "goobaz", gloss: "run[2SG]" },
            { root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]" }
        ]
    }));
    
    describe('19. Unit test with optional header', test({
        id: "19",
        errors: [
            Error(3,3),
            Warning(4,3)
        ],
        results: [
            { text: "foobar", gloss: "run" }
        ]
    }));
    
    describe('20. Unit test with a slash header', test({
        id: "20",
        errors: [
            Error(3,3),
            Warning(4,3)
        ],
        results: [
            { text: "foobar", gloss: "run", eng: "run" }
        ]
    }));

    describe('21. Unit test with an embed header', test({
        id: "21",
        errors: [
            Error(6,3),
            Warning(7,3)
        ],
        results: [
            { text: "foobar", gloss: "run-1SG" }
        ]
    }));
    
});


