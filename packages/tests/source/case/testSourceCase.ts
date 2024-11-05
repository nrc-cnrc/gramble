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
		desc: '4. Generating from uppercase ref to lowercase symbol ',
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
            Error(5,0)
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
            Error(5,0)
        ]
    });
});
