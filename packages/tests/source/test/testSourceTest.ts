import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil";

const DIR = "test";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Simple grammar with unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ]
    });

    testSrc({
		desc: '2. Embeds and unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '3. Test with an empty string',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobat", gloss: "run"},
            {text: "moobat", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '4. Testing a grammar directly underneath (without "table:" op)',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '5. Negative tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(13,2)
        ]
    });

    testSrc({
		desc: '6. Negative test with an empty string',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobat", gloss: "run"},
            {text: "moobat", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '7. Failing unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(13,2),
            Error(14,2),
            Error(15,2),
            Error(16,2)
        ]
    });

    testSrc({
		desc: '8. Failed test with an empty string',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobat", gloss: "run"},
            {text: "moobat", gloss: "jump"}
        ],
        errors: [
            Error(15,2),
        ]
    });

    testSrc({
		desc: '9. Failing negative tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(13,2)
        ]
    });
    
    testSrc({
		desc: '10a. Testing nothing',
        results: [
            {}
        ],
        errors: [
            Error(9,1),
            Warning(9,0)
        ]
    });
    
    testSrc({
		desc: '10b. Negative testing nothing',
        results: [
            {}
        ],
        errors: [
            Error(9,1),
            Warning(9,0)
        ],
    });

    testSrc({
		desc: '11a. Missing unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12,1)
        ]
    });

    testSrc({
		desc: '11b. Missing negative unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12,1)
        ]
    });

    testSrc({
		desc: '12a. table: op under unit test',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12,1)
        ]
    });

    testSrc({
		desc: '12b. table: op under negative unit test',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12,1)
        ]
    });

    testSrc({
		desc: '13a. or: op under unit test',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12,1)
        ],
    });

    testSrc({
		desc: '13b. or: op under negative unit test',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12,1)
        ]
    });

    testSrc({
		desc: '14. Uniqueness tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '15. Uniqueness tests with multiple uniqueness fields',
        results: [
            {root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]"},
            {root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]"},
            {root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]"},
            {root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]"} 
        ]
    });

    testSrc({
		desc: '16. Uniqueness tests failing',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobar", gloss: "eat-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobaz", gloss: "eat-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(14,2),
            Error(16,2),
            Error(17,2)
        ]
    });

    
    testSrc({
		desc: '17. Uniqueness tests failing due to missing field',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobar", gloss: "eat-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobaz", gloss: "eat-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(14,2)
        ],
    });

    testSrc({
		desc: '18. Uniqueness tests with multiple uniqueness fields, failing',
        results: [
            {root: "run", subj: "[1SG]", text: "foobar", gloss: "run[1SG]"},
            {root: "run", subj: "[1SG]", text: "goobar", gloss: "run[1SG]"},
            {root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]"},
            {root: "run", subj: "[2SG]", text: "foobaz", gloss: "run[2SG]"},
            {root: "run", subj: "[2SG]", text: "goobaz", gloss: "run[2SG]"},
            {root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]"}
        ],
        errors: [
            Error(14,2)
        ],
    });
    
    testSrc({
		desc: '19. Unit test with optional header',
        results: [
            {text: "foobar", gloss: "run"}
        ],
        errors: [
            Error(3,3),
            Warning(4,3)
        ],
    });
    
    testSrc({
		desc: '20. Unit test with a slash header',
        results: [
            {text: "foobar", gloss: "run", eng: "run"}
        ],
        errors: [
            Error(3,3),
            Warning(4,3)
        ],
    });

    testSrc({
		desc: '21. Unit test with an embed header',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(6,3),
            Warning(7,3)
        ],
    });

    testSrc({
		desc: '22a. Unit test of a replace',
        results: [
            {text: "Xbc"}
        ],
        errors: []
    });
    
    testSrc({
		desc: '22b. Unit test of a replace, deletion at beginning',
        results: [
            {text: "bc"}
        ],
        errors: []
    });

    testSrc({
		desc: '22c. Unit test of a replace, deletion at end',
        results: [
            {text: "ab"}
        ],
        errors: []
    });


});


