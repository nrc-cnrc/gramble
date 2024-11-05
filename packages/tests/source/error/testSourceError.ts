import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "error";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Reserved word as header',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(4,4),
            Warning(5,4)
        ]
    });

    testSrc({
		desc: '1b. Assignment to a reserved word',
        results: [
            {gloss: "-1SG",text: "bar"},
            {gloss: "-2SG",text: "baz"}
        ],
        errors: [
            Error(1,0),
            Warning(1,0)
        ]
    });

    testSrc({
		desc: '1c. Sheet name using a reserved word',
        filename: "optional",
        results: undefined,
        errors: [
            Error(0, 0, "optional")
        ]
    });

    testSrc({
		desc: '2a. Assignment to an invalid identifier',
        results: [
            {}
        ],
        errors: [
            Error(0,0),
            Warning(0,0),
            Error(5,2)
        ]
    });

    
    testSrc({
		desc: '2b. Identifier with a space',
        results: [
            {}
        ],
        errors: [
            Error(0,0),
            Warning(0,0),
            Error(5,2)
        ]
    });

    testSrc({
		desc: '2c. Reassigning a symbol',
        results: [
            {text: "moo", gloss: "jump"},
            {text: "foo", gloss: "run"}
        ],
        errors: [
            Error(4,0)
        ]
    });
    
    testSrc({
		desc: '3. Reference to a missing symbol',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        errors: [
            Error(6,3)
        ]
    });  

    testSrc({
		desc: '4a. Op missing sibling argument',
        results: [
            {}
        ],
        errors: [
            Warning(9,0),
            Error(9,1)
        ]
    });

    testSrc({
		desc: '4b. Bare join op, missing sibling argument',
        symbol: "",
        results: [
            {}
        ],
        errors: [
            Error(0,0),
            Warning(0,0)
        ]
    });

    testSrc({
		desc: '4c. Op missing child argument',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Warning(12,1)
        ]
    });

    testSrc({
		desc: '5a. Assignment to the right of a binary op',
        results: [
            {text: "moo", gloss: "jump"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foo", gloss: "run"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(12,2)
        ]
    });

    testSrc({
		desc: '5b. Assignment above a binary op',
        results: [
            {text: "moo", gloss: "jump"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foo", gloss: "run"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(9,1)
        ]
    });
    
    testSrc({
		desc: '5c. Assignment inside another assignment',
        results: [
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(9,1)
        ]
    });
    
    testSrc({
		desc: '6a. Content obliteration by table',
        results: undefined,
        errors: [
            Warning(0,0),
            Warning(4,0)
        ]
    });

    testSrc({
		desc: '6b. Content obliteration by assignment',
        results: [
            {text: "baz"},
            {text: "bar"}
        ],
        errors: [
            Warning(0,0)
        ]
    });

    testSrc({
		desc: '7. Two children on the same line',
        results: [
            {text: "foobarbaz", gloss: "run-1SG-2SG"}
        ],
        errors: [
            Error(4,4)
        ]
    });
    
    testSrc({
		desc: '8a. Space in a header',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        errors: [
            Error(8,3),
            Warning(9,3)
        ]
    });
    
    testSrc({
		desc: '8b. Header with a literal space',
        results: [
            {}
        ],
        errors: [
            Error(0,1),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c. Tape name beginning with number',
        results: [
            {}
        ],
        errors: [
            Error(0,1),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8d. Only header in a row in unparsable',
        results: [
            {}
        ],
        errors: [
            Error(0,1),
            Warning(1,1)
        ]
    });
    
    testSrc({
		desc: '9. Grammar with weird indentation',
        results: [
            {text: "foobar", gloss: "run-1SG", finite: "true"}
        ],
        errors: [
            Warning(10,1)
        ]
    });

    testSrc({
		desc: '10. Unique param header in ordinary tables',
        results: [
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(0,2)
        ]
    });

});
