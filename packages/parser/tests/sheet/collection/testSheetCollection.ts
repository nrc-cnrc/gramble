import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "collection";

function test(params: ProjectTest): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1a. Collection containing one assignment', test({
        id: "1a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
    
    describe('1b. Collection containing one assignment, referencing all', test({
        id: "1b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('2a. Collection containing one assignment, generating from symbol inside', test({
        id: "2a",
        symbol: "word.verb",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));
    
    describe('2b. Collection containing one assignment, generating from all', test({
        id: "2b",
        symbol: "word.all",
        results: [
            { text: "foo", gloss: "run" },
            { text: "moo", gloss: "jump" }
        ]
    }));

    describe('3. Collection containing two assignments', test({
        id: "3",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('4. Two-assignment sheet, generating from all', test({
        id: "4",
        symbol: "all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    }));
    
    describe('5. Collection with auto default', test({
        id: "5",
        symbol: "x.all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    }));
    
    describe('6a. Nested all', test({
        id: "6a",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    }));
    
    describe('6b. Reference to .all.all', test({
        id: "6b",
        errors: [ Error(11,1) ],
        results: [{}]
    }));

    describe('7a. Explicit all', test({
        id: "7a",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"}
        ]
    }));

    describe('7b. Explicit all, generating from all', test({
        id: "7b",
        symbol: "x.all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"}
        ]
    }));

    describe('8a. All referencing an explicit all', test({
        id: "8a",
        results: [
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    }));

    describe('8b. Reference to a symbol next to explicit all', test({
        id: "8b",
        results: [
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    }));
    
    describe('9a. Reference to a non-existent collection', test({
        id: "9a",
        errors: [ Error(9,2) ],
        results: [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]
    }));

    describe('9b. Reference to a non-existent symbol within a collection', test({
        id: "9b",
        errors: [ Error(9,2) ],
        results: [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]
    }));
    
    describe('9c. Symbol reference without collection prefix', test({
        id: "9c",
        errors: [ Error(9,2) ],
        results: [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]
    }));

    
    describe('10a. Collection with embeds referring outside of it', test({
        id: "10a",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('10b. Collection with embeds referring into a sibling collection', test({
        id: "10b",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('10c. Collection with embeds referring to symbols in itself', test({
        id: "10c",
        symbol: "word.x",
        results: [
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));

    describe('11a. Unnamed collection as first child', test({
        id: "11a",
        errors: [ Warning(0,0) ],
        results: [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]
    }));
    
    describe('11b. Unnamed collection as second child', test({
        id: "11b",
        errors: [ Warning(4,0) ],
        results: [
            { text: "bar", gloss: "-1SG" },
            { text: "baz", gloss: "-2SG" }
        ]
    }));
    
    describe('11c. Unnamed collection as last child', test({
        id: "11c",
        errors: [ Warning(8,0) ],
        results: undefined
    }));
    
    describe('12a. Op with collection as a child', test({
        id: "12a",
        errors: [ Error(11,2) ],
        results: [
            {},
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
    
    describe('12b. Op with collection as a sibling', test({
        id: "12b",
        errors: [ Error(8,1) ],
        results: [
            {},
            { text: "foobar", gloss: "run-1SG" },
            { text: "moobar", gloss: "jump-1SG" },
            { text: "foobaz", gloss: "run-2SG" },
            { text: "moobaz", gloss: "jump-2SG" }
        ]
    }));
});