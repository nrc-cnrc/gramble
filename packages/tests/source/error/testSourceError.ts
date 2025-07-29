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
            Error(4, 4, "Invalid header: 'table'"),
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
            Error(1, 0, "Invalid operator: 'optional='"),
            Warning(1,0)
        ]
    });

    testSrc({
		desc: '1c. Sheet name using a reserved word',
        filename: "optional",
        results: undefined,
        errors: [
            Error(0, 0, "Reserved sheet name: 'optional'", "optional")
        ]
    });

    testSrc({
		desc: '2a. Assignment to an invalid symbol name',
        results: [
            {}
        ],
        errors: [
            Error(0, 0, "Invalid symbol name: '123verb'"),
            Warning(0,0),
            Error(5, 2, "Invalid symbol name: '123verb'")
        ]
    });

    
    testSrc({
		desc: '2b. Identifier with a space',
        results: [
            {}
        ],
        errors: [
            Error(0, 0, "Invalid operator: 'verb vorb='"),
            Warning(0,0),
            Error(5, 2, "Error parsing cell: 'verb vorb'")
        ]
    });

    testSrc({
		desc: '2c. Reassigning a symbol',
        results: [
            {text: "moo", gloss: "jump"},
            {text: "foo", gloss: "run"}
        ],
        errors: [
            Error(4, 0, "Reassigning existing symbol: 'word'")
        ]
    });
    
    testSrc({
		desc: '3. Reference to a missing symbol',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        errors: [
            Error(6, 3, "Undefined symbol: 'suffix'")
        ]
    });  

    testSrc({
		desc: '4a. Op missing sibling argument',
        results: [
            {}
        ],
        errors: [
            Warning(9,0),
            Error(9, 1, "Missing content for 'or:'") // "This operator requires content above it, but it's empty or erroneous."
        ]
    });

    testSrc({
		desc: '4b. Bare join op, missing sibling argument',
        symbol: "",
        results: [
            {}
        ],
        errors: [
            Error(0, 0, "Missing content for 'join:'"), // "This operator requires content above it, but it's empty or erroneous."
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
            Error(12, 2, "Wayward assignment: 'suffixless'")
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
            Error(9, 1, "Wayward assignment: 'suffixed'")
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
            Error(9, 1, "Wayward assignment: 'word2'")
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
            Error(4, 4, "Unexpected operator: 'table:'")
        ]
    });
    
    testSrc({
		desc: '8a. Space in a header',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        errors: [
            Error(8, 3, "Invalid header: 'blarg embed'"),
            Warning(9,3)
        ]
    });
    
    testSrc({
		desc: '8b. Header with a literal space',
        results: [
            {}
        ],
        errors: [
            Error(0, 1, "Missing ordinary header for 'table'"),
            Error(0, 1, "Invalid header: 'text text'"),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c0. No header after symbol assignment',
        results: [],
        errors: []
    });

    testSrc({
		desc: '8c1. Space in a header after symbol assignment',
        results: [
            {}
        ],
        errors: [
            Error(0, 1, "Missing ordinary header for 'table'"),
            Error(0, 1, "Invalid header: 'text text'"),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c2. Space in a header between symbol assignment & plain header',
        results: [
            {text: "xxx"},
        ],
        errors: [
            Error(0, 1, "Invalid header: 'text text'"),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c3. Space in a header after symbol assignment & plain header',
        results: [
            {text: "xxx"},
        ],
        errors: [
            Error(0, 2, "Invalid header: 'text text'"),
            Warning(1,2)
        ]
    });

    testSrc({
		desc: '8d. Tape name header beginning with number',
        results: [
            {}
        ],
        errors: [
            Error(0, 1, "Missing ordinary header for 'table'"),
            Error(0, 1, "Invalid header: '9text'"),
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
            Error(0, 2, "Invalid 'unique' header: 'unique text'")
        ]
    });

});
