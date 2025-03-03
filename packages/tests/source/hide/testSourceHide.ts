import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "hide";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Hide header',
        results: [
            {text: "foo"}
        ]
    });
    
    testSrc({
		desc: '2. Hiding an irrelevant tape',
        results: [
            {text: "foo", gloss: "run"}
        ],
        errors: [
            Error(1,4)
        ]
    });
    
    testSrc({
		desc: '3. Hide header with embeds',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foo", gloss: "run[3SG]", subj: "[3SG]"},
            {text: "moo", gloss: "jump[3SG]", subj: "[3SG]"}
        ]
    });

    testSrc({
		desc: '4. Two hide headers',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });
    
    testSrc({
		desc: '5. Nested hide headers',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });

    testSrc({
		desc: '6a. Hide header with two headers',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });
    
    testSrc({
		desc: '6b. Hide header with three headers',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });
    
    testSrc({
		desc: '6c. Hide header with three headers and extra spacing',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });
    
    testSrc({
		desc: '7. Hide header with empty value',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "stand"},
            {text: "goo", gloss: "monkey"},
            {text: "zoo", gloss: "aquarium"},
        ]
    });

    testSrc({
		desc: '8. Hiding an ill-formed tape',
        results: [
            {text: "foo", gloss: "run"}
        ],
        errors: [
            Error(1,4)
        ]
    });
    
    testSrc({
		desc: '9a. Hiding two headers, the first of which is ill-formed',
        results: [
            {text: "foobar", subj: "[1SG]", gloss: "run[1SG]"},
            {text: "moobar", subj: "[1SG]", gloss: "jump[1SG]"},
            {text: "foobaz", subj: "[2SG]", gloss: "run[2SG]"},
            {text: "moobaz", subj: "[2SG]", gloss: "jump[2SG]"},
            {text: "foo",    subj: "[3SG]", gloss: "run[3SG]"},
            {text: "moo",    subj: "[3SG]", gloss: "jump[3SG]"}
        ],
        errors: [
            Error(14,3)
        ]
    });
    
    testSrc({
		desc: '9b. Hiding two headers, the second of which is ill-formed',
        results: [
            {text: "foobar", pos: "v", gloss: "run[1SG]"},
            {text: "moobar", pos: "v", gloss: "jump[1SG]"},
            {text: "foobaz", pos: "v", gloss: "run[2SG]"},
            {text: "moobaz", pos: "v", gloss: "jump[2SG]"},
            {text: "foo",    pos: "v",gloss: "run[3SG]"},
            {text: "moo",    pos: "v",gloss: "jump[3SG]"}
        ],
        errors: [
            Error(14,3)
        ]
    });

    testSrc({
		desc: '10a. Hiding with extraneous slash before',
        results: [
            {text: "foobar", subj: "[1SG]", pos: "v", gloss: "run[1SG]"},
            {text: "moobar", subj: "[1SG]", pos: "v", gloss: "jump[1SG]"},
            {text: "foobaz", subj: "[2SG]", pos: "v", gloss: "run[2SG]"},
            {text: "moobaz", subj: "[2SG]", pos: "v", gloss: "jump[2SG]"},
            {text: "foo",    subj: "[3SG]", pos: "v", gloss: "run[3SG]"},
            {text: "moo",    subj: "[3SG]", pos: "v", gloss: "jump[3SG]"}
        ],
        errors: [
            Error(14,3)
        ]
    });
    
    testSrc({
		desc: '10b. Hiding with extraneous slash after',
        results: [
            {text: "foobar", subj: "[1SG]", pos: "v", gloss: "run[1SG]"},
            {text: "moobar", subj: "[1SG]", pos: "v", gloss: "jump[1SG]"},
            {text: "foobaz", subj: "[2SG]", pos: "v", gloss: "run[2SG]"},
            {text: "moobaz", subj: "[2SG]", pos: "v", gloss: "jump[2SG]"},
            {text: "foo",    subj: "[3SG]", pos: "v", gloss: "run[3SG]"},
            {text: "moo",    subj: "[3SG]", pos: "v", gloss: "jump[3SG]"}
        ],
        errors: [
            Error(14,3)
        ]
    });
    
    testSrc({
		desc: '10c. Hiding with extraneous slash between',
        results: [
            {text: "foobar", subj: "[1SG]", pos: "v", gloss: "run[1SG]"},
            {text: "moobar", subj: "[1SG]", pos: "v", gloss: "jump[1SG]"},
            {text: "foobaz", subj: "[2SG]", pos: "v", gloss: "run[2SG]"},
            {text: "moobaz", subj: "[2SG]", pos: "v", gloss: "jump[2SG]"},
            {text: "foo",    subj: "[3SG]", pos: "v", gloss: "run[3SG]"},
            {text: "moo",    subj: "[3SG]", pos: "v", gloss: "jump[3SG]"}
        ],
        errors: [
            Error(14,3)
        ]
    });
});
