import {VERBOSE_DEBUG } from "../../../interpreter/src/utils/logging.js";
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
		desc: '4a. Or op with missing sibling argument',
        results: [
            {}
        ],
        errors: [
            Warning(9,0),
            Error(9, 1, "Missing content for 'or:'") // "This operator requires content above it, but it's empty or erroneous."
        ]
    });

    testSrc({
		desc: '4b. Bare join op with missing sibling argument',
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
		desc: '4c. Or op with missing child argument',
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
		desc: '5a. Assignment to the right of a binary op (or)',
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
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '5b. Assignment beside another assignment above a binary op (or)',
        results: [
            {text: "moo", gloss: "jump"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foo", gloss: "run"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(9, 1, "Wayward assignment: 'suffixed'.")
        ]
    });
    
    testSrc({
		desc: '5c. Assignment beside another assignment',
        results: [
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(9, 1, "Wayward assignment: 'word2'")
        ],
        // verbose: VERBOSE_DEBUG,
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
		desc: '7a. Two children (table ops) on the same row',
        results: [
            {text: "foobarbaz", gloss: "run-1SG-2SG"}
        ],
        errors: [
            Error(4, 4, "Unexpected operator: 'table:'")
        ]
    });

    testSrc({
		desc: '7b. Two consecutive table operators',
        results: [
            {text: "foobarbaz", gloss: "run-1SG-2SG"}
        ],
        errors: [
            Error(4, 2, "Wayward 'table' operator"),
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
            Error(0, 1, "Missing ordinary header for implied 'table'"),
            Error(0, 1, "Invalid header: 'text text'"),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c0. No header on same row as symbol assignment',
        // Note: in this example 'foo' (1,1) is a header!
        results: [
            {},
        ],
        errors: [
            Warning(1, 1)   // No content cells found for these headers; assuming empty values.
        ]
    });

    testSrc({
		desc: '8c1. Space in a header after assignment',
        results: [
            {}
        ],
        errors: [
            Error(0, 1, "Missing ordinary header for implied 'table'"),
            Error(0, 1, "Invalid header: 'text text'"),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c2. Space in a header between assignment & ordinary header',
        results: [
            {text: "xxx"},
        ],
        errors: [
            Error(0, 1, "Invalid header: 'text text'"),
            Warning(1,1)
        ]
    });

    testSrc({
		desc: '8c3. Space in a header after symbol & ordinary header',
        results: [
            {text: "xxx"},
        ],
        errors: [
            Error(0, 2, "Invalid header: 'text text'"),
            Warning(1,2)
        ]
    });

    testSrc({
		desc: '8d. Ordinary header beginning with number',
        results: [
            {}
        ],
        errors: [
            Error(0, 1, "Missing ordinary header for implied 'table'"),
            Error(0, 1, "Invalid header: '9text'"),
            Warning(1,1)
        ]
    });
    
    testSrc({
		desc: '9a. Grammar with weird indentation',
        results: [
            {text: "foobar", gloss: "run-1SG", finite: "true"}
        ],
        errors: [
            Warning(10,1)
        ]
    });

    testSrc({
        desc: '9b. Empty cell after assignment + or op (col 1)',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Warning(11, 1), // This operator is in an unexpected column. ...
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
        desc: '9c. Empty cell after assignment + or op (col 0)',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '10. "unique" header in ordinary table',
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

    testSrc({
        desc: '11a. Wayward assignment',
        results: [
            {text: "goo"},
        ],
        errors: [
            Error(1, 1, "Wayward assignment: 'word2'"),
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
        desc: '11b. Wayward assignment with table op',
        results: [
            {text: "goo"},
        ],
        errors: [
            Error(1, 1, "Wayward assignment: 'word2'"),
        ],
    });

    testSrc({
        desc: '11c. Nested errors: wayward assignment with table op followed by ' +
              'another wayward assignment',
        results: [
            {text: "goo"},
        ],
        errors: [
            Error(1, 1, "Wayward assignment: 'word2'"),
            Error(1, 3, "Wayward assignment: 'word3'"),
        ],
    });

    testSrc({
        desc: '11d. Nested errors: Wayward assignment with table op followed by ' +
              'another wayward assignment and table op',
        results: [
            {text: "goo"},
        ],
        errors: [
            Error(1, 1, "Wayward assignment: 'word2'"),
            Error(1, 3, "Wayward assignment: 'word3'"),
            Error(1, 4, "Wayward 'table' operator"),
        ],
    });

    testSrc({
        desc: '11e. Nested errors: Several wayward assignments and table ops',
        results: [
            {text: "goofoomoo"},
        ],
        errors: [
            Error(1, 1, "Wayward assignment: 'word2'"),
            Error(1, 3, "Wayward assignment: 'word3'"),
            Error(1, 4, "Wayward 'table' operator"),
            Error(1, 6, "Unexpected operator: 'table:'"),
            Error(1, 8, "Unexpected assignment: 'word4='"),
            Error(1, 9, "Unexpected assignment: 'word5='"),
        ],
    });

    testSrc({
        desc: '11f. Nested errors: Several wayward assignments and table ops, different order',
        results: [
            {text: "goofoomoo"},
        ],
        errors: [
            Error(1, 1, "Wayward assignment: 'word2'"),
            Error(1, 3, "Wayward assignment: 'word3'"),
            Error(1, 4, "Wayward 'table' operator"),
            Error(1, 5, "Wayward 'table' operator"),
            Error(1, 6, "Wayward assignment: 'word4'"),
            Error(1, 7, "Wayward assignment: 'word5'"),
            Error(1, 10, "Unexpected operator: 'table:'"),
        ],
    });

    testSrc({
        desc: '12a. Wayward assignment + or op (col 1)',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(8, 1, "Wayward assignment: 'word2'."),
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
        desc: '12b. Wayward assignment + or op (col 0)',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(8, 1, "Wayward assignment: 'word2'."),
        ],
    });

    testSrc({
        desc: '12c. Wayward assignment with table op + or op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(8, 1, "Wayward assignment: 'word2'."),
        ],
    });

    testSrc({
        desc: '12d. Nested errors: 2 wayward assignments with table op + or op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(8, 1, "Wayward assignment: 'word2'."),
            Error(8, 2, "Wayward assignment: 'word3'"),
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
        desc: '12e. Nested errors: wayward assignment with table op followed by ' +
              'another wayward assignment + or op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(8, 1, "Wayward assignment: 'word2'."),
            Error(8, 3, "Wayward assignment: 'word3'"),
        ],
    });

    testSrc({
        desc: '12f. Nested errors: wayward assignment with table op followed by ' +
              'another wayward assignment and table op + or op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(8, 1, "Wayward assignment: 'word2'."),
            Error(8, 3, "Wayward assignment: 'word3'"),
            Error(8, 4, "Wayward 'table' operator"),
        ],
    });

    testSrc({
        desc: '13a. or op with table op (no errors)',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
    });

    testSrc({
        desc: '13b. Or op with wayward assignment',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(11, 2, "Wayward assignment: 'word2'"),
        ],
    });

    testSrc({
        desc: '13c. Or op with wayward assignment + table op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(11, 2, "Wayward assignment: 'word2'"),
        ],
    });

    testSrc({
        desc: '13d. Or op with table op + wayward assignment',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(11, 3, "Wayward assignment: 'word2'"),
        ],
    });

    testSrc({
        desc: '13e. Or op with table op + wayward assignment + table op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(11, 3, "Wayward assignment: 'word2'"),
            Error(11, 4, "Wayward 'table' operator"),
        ],
    });

    testSrc({
        desc: '13f. Nested errors: or op with 2 wayward assignments separated by table op',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(11, 2, "Wayward assignment: 'word2'"),
            Error(11, 4, "Wayward assignment: 'word3'"),
        ],
    });

    testSrc({
        desc: '13g. Nested errors: or op with 2 wayward assignments + table ops',
        results: [
            {text: "goo"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
        errors: [
            Error(11, 2, "Wayward assignment: 'word2'"),
            Error(11, 4, "Wayward assignment: 'word3'"),
            Error(11, 5, "Wayward 'table' operator"),
        ],
    });

});
