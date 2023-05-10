import { 
    testProject, ProjectTest, 
    Error, Warning 
} from "../testSheetUtil";

const DIR = "rule";

function test(params: Partial<ProjectTest>): () => void {
    return function() {
        return testProject({ dir: DIR, ...params });
    };
}

describe(`Sheets ${DIR}`, function() {

    describe('1. Simple replace', test({
        id: "1",
        results: [
            {text: "ava"}
        ]
    }));

    describe('2. Trivial replace', test({
        id: "2",
        results: [
            {text: "aba"}
        ]
    }));

    describe('3. Simple replace multiple times', test({
        id: "3",
        results: [
            {text: "avva"}
        ]
    }));

    describe('4. Simple replace under assignment', test({
        id: "4",
        results: [
            {text: "ava"}
        ]
    }));
    
    describe('5. Replacing wrong tape', test({
        id: "5",
        errors: [ Error(3,1) ],
        results: [
            {text: "aba"}
        ]
    }));

    describe('6. Replace but the tape is a reserved word', test({
        id: "6",
        errors: [ Error(3,1) ],
        results: [
            {text: "aba"}
        ]
    }));

    describe('7a. Simple replace with embed', test({
        id: "7a",
        results: [
            {text: "ava"}
        ]
    }));
    
    describe('7b. Simple replace with two embed', test({
        id: "7b",
        results: [
            {text: "ava"}
        ]
    }));

    describe('7c. Simple replace with two embed 2', test({
        id: "7c",
        results: [
            {text: "ava"}
        ]
    }));


    describe('8a. Replacing, embedded', test({
        id: "8a",
        results: [
            {text: "ava"}
        ]
    }));

    
    describe('8b. Rule cascade, embedded', test({
        id: "8b",
        results: [
            {text: "awa"}
        ]
    }));

    describe('8c. Replacing an embedded replace', test({
        id: "8c",
        results: [
            {text: "awa"}
        ]
    }));
    
    describe('8d. Cascading an embedded casecade', test({
        id: "8d",
        results: [
            {text: "ABCD"}
        ]
    }));

    describe('9a. Nested replace', test({
        id: "9a",
        results: [
            {text: "w"}
        ]
    }));
    
    describe('9b. Nested replace under assignment', test({
        id: "9b",
        results: [
            {text: "w"}
        ]
    }));
    
    describe('9c. Nested replace with some unchanged letters', test({
        id: "9c",
        results: [
            {text: "awc"}
        ]
    }));

    describe('9d. Nested replace 2', test({
        id: "9d",
        results: [
            {text: "ev"}
        ]
    }));
    
    describe('10a. Rule cascade', test({
        id: "10a",
        results: [
            {text: "w"}
        ]
    }));
    
    describe('10b. Rule cascade 2', test({
        id: "10b",
        results: [
            {text: "ev"}
        ]
    }));

    describe('11a. Replace with pre context', test({
        id: "11a",
        results: [
            {text: "ava"},
            {text: "arba"}
        ]
    }));

    describe('11b. Replace with post context', test({
        id: "11b",
        results: [
            {text: "ava"},
            {text: "abra"}
        ]
    }));
    
    describe('11c. Replace with pre and post context', test({
        id: "11c",
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "arba"}
        ]
    }));

    describe('12a. Replace with an empty-string context', test({
        id: "12a",
        results: [
            {text: "ava"},
            {text: "arva"}
        ]
    }));
    
    describe('12b. Replace with an empty context', test({
        id: "12b",
        results: [
            {text: "ava"},
            {text: "arva"}
        ]
    }));

    describe('13a. Replace with an alternation in pre context', test({
        id: "13a",
        results: [
            {text: "ava"},
            {text: "arba"},
            {text: "iva"}
        ]
    }));

    describe('13b. Replace with an alternation in post context', test({
        id: "13b",
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "avi"}
        ]
    }));

    
    describe('13c. Replace with an alternation in from', test({
        id: "13c",
        results: [
            {text: "ava"}
        ]
    }));

    describe('13d. Replace with an alternation in to', test({
        id: "13d",
        results: [
            {text: "apa"},
            {text: "ava"}
        ]
    }));
    
    describe('14. Replace with a repetition in to', test({
        id: "14",
        results: [
            {text: "av*a"},
        ]
    }));

    describe('15a. Replace with a repetition in pre context', test({
        id: "15a",
        results: [
            {text: "aba"},
            {text: "dava"},
            {text: "daava"},
        ]
    }));

    describe('15b. Replace with a repetition in post context', test({
        id: "15b",
        results: [
            {text: "aba"},
            {text: "avad"},
            {text: "avaad"},
        ]
    }));

    describe('15c. Replace with a repetition in from', test({
        id: "15c",
        results: [
            {"text":"ava"}, 
            {"text":"avva"},
            {"text":"ava"}, // ava occurs twice because there
                            // are two ways to generate it, from
                            // aba or from abba
            {"text":"aa"}
        ]
    }));

    // word boundary-sensitive rule tests
    describe('16a. Replace at beginning', test({
        id: "16a",
        results: [
            {text: "a"},
            {text: "v"},
            {text: "ab"},
            {text: "va"},
            {text: "aba"}
        ]
    }));

    describe('16b. Replace at end', test({
        id: "16b",
        results: [
            {text: "a"},
            {text: "v"},
            {text: "av"},
            {text: "ba"},
            {text: "aba"}
        ]
    }));

    describe('16c. Replace at beginning and end', test({
        id: "16c",
        results: [
            {text: "a"},
            {text: "v"},
            {text: "ab"},
            {text: "ba"},
            {text: "aba"}
        ]
    }));
    
    describe('17a. Replace with unnamed param', test({
        id: "17a",
        errors: [ Error(12,4), Warning(12,1) ],
        results: [
            {text: "foo", "gloss":"run.3SG"},
            {text: "foobaz", "gloss":"run-2SG"},
            {text: "foobar", "gloss":"run-1SG"},
            {text: "moo", "gloss":"jump.3SG"},
            {text: "moobaz", "gloss":"jump-2SG"},
            {text: "moobar", "gloss":"jump-1SG"}
        ]
    }));

    describe('17b. Replace with invalid param', test({
        id: "17b",
        errors: [ Error(12,4), Warning(12,1) ],
        results: [
            {text: "foo", "gloss":"run.3SG"},
            {text: "foobaz", "gloss":"run-2SG"},
            {text: "foobar", "gloss":"run-1SG"},
            {text: "moo", "gloss":"jump.3SG"},
            {text: "moobaz", "gloss":"jump-2SG"},
            {text: "moobar", "gloss":"jump-1SG"}
        ]
    }));

    describe('18a. Replace with no sibling', test({
        id: "18a",
        errors: [ Error(0,1), Warning(0,0) ],
        results: [{}]
    }));
    
    describe('18b. Replace with no sibling bare', test({
        id: "18b",
        symbol: "",
        errors: [ Error(0,0), Warning(0,0) ],
        results: [{}]
    }));

    describe('18c. Replace with no child', test({
        id: "18c",
        errors: [ Error(3,1) ],
        results: [
            {text: "aba"}
        ]
    }));

    describe('19a. Replace with missing "from" param', test({
        id: "19a",
        errors: [ Error(12,1) ],
        results: [
            {text: "foo", "gloss":"run.3SG"},
            {text: "foobaz", "gloss":"run-2SG"},
            {text: "foobar", "gloss":"run-1SG"},
            {text: "moo", "gloss":"jump.3SG"},
            {text: "moobaz", "gloss":"jump-2SG"},
            {text: "moobar", "gloss":"jump-1SG"}
        ]
    }));

    describe('19b. Replace with missing "to" param', test({
        id: "19b",
        errors: [ Error(12,1) ],
        results: [
            {text: "foo", "gloss":"run.3SG"},
            {text: "foobaz", "gloss":"run-2SG"},
            {text: "foobar", "gloss":"run-1SG"},
            {text: "moo", "gloss":"jump.3SG"},
            {text: "moobaz", "gloss":"jump-2SG"},
            {text: "moobar", "gloss":"jump-1SG"}
        ]
    }));

    describe('20a. Rule with an empty to', test({
        id: "20a",
        results: [
            {text: "aa"}
        ]
    }));

    describe('20b. Shortening rule', test({
        id: "20b",
        results: [
            {text: "aba"}
        ]
    }));

    describe('20c. Shortening rule long', test({
        id: "20c",
        results: [
            {text: "aba"}
        ]
    }));

    describe('20d. Shortening rule empty to', test({
        id: "20d",
        results: [
            {text: "aa"}
        ]
    }));

    describe('21a. Rule with an empty from', test({
        id: "21a",
        errors: [ Error(3,1), Warning(3,1) ],
        results: [{text: "aba"}]
    }));

    describe('21b. Rule with an empty from, with pre and post', test({
        id: "21b",
        results: [
            {text: "abca"},
        ]
    }));

    describe('21c. Rule with an empty from, with pre', test({
        id: "21c",
        results: [
            {text: "abca"},
        ]
    }));

    describe('21d. Rule with an empty from, with post', test({
        id: "21d",
        results: [
            {text: "cabca"}
        ]
    }));
    
    describe('21e. Rule with an empty from, begins', test({
        id: "21e",
        results: [
            {text: "caba"}
        ]
    }));
    
    describe('21f. Rule with an empty from, ends', test({
        id: "21f",
        results: [
            {text: "abac"}
        ]
    }));

    describe('22. Rule cascade with an empty to', test({
        id: "22",
        results: [
            {text: "BC"}
        ]
    }));

    describe('23a. Replace with a symbol in regex in from', test({
        id: "23a",
        results: [
            {text: "ava"}
        ]
    }));

    describe('23b. Replace with a symbol in regex in from, but the symbol is defined after', test({
        id: "23b",
        results: [
            {text: "ava"}
        ]
    }));
    
    describe('23c. Replace with a symbol in regex in pre', test({
        id: "23c",
        results: [
            {text: "ava"},
            {text: "arba"},
            {text: "iva"}
        ]
    }));

    describe('23d. Replace with a symbol in regex in pre, but the symbol is defined after', test({
        id: "23d",
        results: [
            {text: "ava"},
            {text: "arba"},
            {text: "iva"}
        ]
    }));
    
    describe('23e. Replace with a symbol in regex in post', test({
        id: "23e",
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "avi"}
        ]
    }));

    describe('23f. Replace with a symbol in regex in post, but the symbol is defined after', test({
        id: "23f",
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "avi"}
        ]
    }));
    
    describe('24a. Replace with a multi-tape symbol in regex in from', test({
        id: "24a",
        errors: [ Error(10,2), Error(9,1), Warning(9,1) ],
        results: [
            {text: "abi"},
            {text: "abra"},
            {text: "aba"}
        ]
    }));

    describe('24b. Replace with a multi-tape symbol in regex in post', test({
        id: "24b",
        errors: [ Error(10,4) ],
        results: [
            {text: "ava"},
            {text: "avra"},
            {text: "avi"}
        ]
    }));

    describe('25a. Replace with a table: op nested underneath', test({
        id: "25a",
        errors: [ Error(12,1) ],
        results: [
            {text: "foo", "gloss":"run.3SG"},
            {text: "foobaz", "gloss":"run-2SG"},
            {text: "foobar", "gloss":"run-1SG"},
            {text: "moo", "gloss":"jump.3SG"},
            {text: "moobaz", "gloss":"jump-2SG"},
            {text: "moobar", "gloss":"jump-1SG"}
        ]
    }));
    
    describe('25b. Replace with a test: op nested underneath', test({
        id: "25b",
        errors: [ Error(12,2), Error(12,1) ],
        results: [
            {text: "foo", "gloss":"run.3SG"},
            {text: "foobaz", "gloss":"run-2SG"},
            {text: "foobar", "gloss":"run-1SG"},
            {text: "moo", "gloss":"jump.3SG"},
            {text: "moobaz", "gloss":"jump-2SG"},
            {text: "moobar", "gloss":"jump-1SG"}
        ]
    }));
});