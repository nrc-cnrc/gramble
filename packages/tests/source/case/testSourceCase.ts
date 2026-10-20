import {
    testSource, SourceTest, Error
} from "../testSourceUtil.js";

const DIR = "case";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Uppercase table ops',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '1b. Uppercase join op',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "1SG"},
            {text: "moobar", gloss: "jump[1SG]", subj: "1SG"},
        ]
    });
    
    testSrc({
		desc: '2a. Uppercase embed header',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });
    
    testSrc({
		desc: '2b. Uppercase optional header',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    
    testSrc({
		desc: '3a. Lowercase reference to uppercase symbol',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '3b. Uppercase reference to lowercase symbol',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '4. Generating from uppercase ref to lowercase symbol',
        symbol: "WORD",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '5a. Overwriting a lowercase symbol with uppercase',
        symbol: "word",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ], 
        errors: [
            Error(5, 0, "Reassigning existing symbol: 'VERB'")
        ]
    });
    
    testSrc({
		desc: '5b. Overwriting a lowercase symbol with uppercase',
        symbol: "WORD",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(5, 0, "Reassigning existing symbol: 'verb'")
        ]
    });

    testSrc({
		desc: '6. Checking case sensitivity of headers',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ]
    });

    // test case7 is the same as test replace11c except for casing.
    testSrc({
		desc: '7. Checking case sensitivity of replace to/from/context',
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "arba"},
        ]
    });

    // test case8a is the same as test test1a except for casing.
    testSrc({
		desc: '8a. Checking case sensitivity of unit tests',
        tapes: ["text", "gloss"],
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobaz", gloss: "see-2SG"},
        ]
    });

    // test case8b is the same as test test1b except for casing.
    testSrc({
		desc: '8b. Checking case sensitivity of negative unit tests',
        tapes: ["text", "gloss"],
        results: [
            {text: "foobar", gloss: "run-1SG"},
        ]
    });

    // test case9 is the same as test filter1a except for casing.
    testSrc({
		desc: '9. Checking case sensitivity of equals',
        results: [
            {text: "goo", pos: "v"},
            {text: "foo", pos: "v"},
        ],
    });

    // test case10 is the same as test hide1 except for casing.
    testSrc({
		desc: '10. Checking case sensitivity of hide header',
        results: [
            {text: "foo"}
        ]
    });

    // test case11 is the same as test rename1 except for casing.
    testSrc({
		desc: '11. Checking case sensitivity of rename header',
        results: [
            {text: "foo", gloss: "run" }
        ]
    });

    // test case12 is the same as test basic7a except for casing.
    testSrc({
		desc: '12. Checking case sensitivity of slash header',
        results: [
            {text: "foobar", gloss: "foo-1SG"},
            {text: "moobar", gloss: "moo-1SG"},
            {text: "foobaz", gloss: "foo-2SG"},
            {text: "moobaz", gloss: "moo-2SG"}
        ],
    });

});
