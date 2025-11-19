import {VERBOSE_DEBUG } from "../../../interpreter/src/utils/logging.js";
import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "test";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Simple grammar with unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ]
    });

    testSrc({
		desc: '1b. Simple grammar with negative unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ]
    });

    testSrc({
		desc: '2a. Embeds and unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '2b. Embeds and negative unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '3a. Unit test with an empty string',
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
		desc: '3b. Negative unit test with an empty string',
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
		desc: '4a. Testing a grammar directly underneath (no "table:" op)',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '4b. Negative testing a grammar directly underneath (no "table:" op)',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '5a. Failing unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(14, 2, "Failed unit test - no matching outputs"),
            Error(16, 2, "Failed unit test - no matching outputs"),
            Error(17, 2, "Failed unit test - no matching outputs"),
            Error(19, 2, "Failed unit test - no matching outputs"),
            Error(21, 2, "Failed unit test - no matching outputs"),
        ],
    });

    testSrc({
		desc: '5b. Failing negative unit tests',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(14, 2, "Failed unit testnot - has matching outputs"),
            Error(16, 2, "Failed unit testnot - has matching outputs"),
            Error(18, 2, "Failed unit testnot - has matching outputs"),
            Error(20, 2, "Failed unit testnot - has matching outputs"),
        ]
    });

    testSrc({
		desc: '6a. Unit tests with unknown header',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(13, 2, "Ill-formed unit test - no 'pos' header"),
            Error(14, 2, "Failed unit test - no matching outputs"),
            Error(16, 2, "Failed unit test - no matching outputs"),
            Error(17, 2, "Failed unit test - no matching outputs"),
            Error(19, 2, "Failed unit test - no matching outputs"),
        ],
    });

    testSrc({
		desc: '6b. Negative unit tests with unknown header',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(13, 2, "Ill-formed unit testnot - no 'pos' header"),
            Error(15, 2, "Failed unit testnot - has matching outputs"),
        ]
    });

    testSrc({
		desc: '7a. Failing unit tests with an empty string',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobat", gloss: "run"},
            {text: "moobat", gloss: "jump"}
        ],
        errors: [
            Error(15, 2, "Failed unit test - no matching outputs"),
            Error(17, 2, "Failed unit test - no matching outputs"),
            Error(18, 2, "Failed unit test - no matching outputs"),
        ]
    });
    
    testSrc({
		desc: '7b. Failing negative unit tests with an empty string',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foobat", gloss: "run"},
            {text: "moobat", gloss: "jump"}
        ],
        errors: [
            Error(14, 2, "Failed unit testnot - has matching outputs"),
            Error(16, 2, "Failed unit testnot - has matching outputs"),
        ]
    });

    testSrc({
		desc: '8a. Testing nothing',
        results: [
            {}
        ],
        errors: [
            Error(9, 1, "Missing content for 'test:'"),
            Warning(9,0)
        ]
    });
    
    testSrc({
		desc: '8b. Negative testing nothing',
        results: [
            {}
        ],
        errors: [
            Error(9, 1, "Missing content for 'testnot:'"),
            Warning(9,0)
        ],
    });

    testSrc({
		desc: '9a. Testing empty table:',
        results: [
            {}
        ],
        errors: [
            Error(9, 1, "'table' operator requires header(s)"),
            Error(11, 1, "Missing content for 'test:'"),
            Warning(9,0),
            Warning(9,1)
        ]
    });

    testSrc({
		desc: '9b. Negative testing empty table:',
        results: [
            {}
        ],
        errors: [
            Error(9, 1, "'table' operator requires header(s)"),
            Error(11, 1, "Missing content for 'testnot:'"),
            Warning(9,0),
            Warning(9,1)
        ]
    });

    testSrc({
		desc: '10a. Testing empty table: with headers',
        results: [
            {}
        ],
        errors: [
            Error(12, 2, "Failed unit test - no matching outputs"),
            Error(13, 2, "Failed unit test - no matching outputs"),
            Error(14, 2, "Failed unit test - no matching outputs"),
            Warning(9,2),   // No non-empty values for these headers; assuming empty values.
        ]
    });

    testSrc({
		desc: '10b. Negative testing empty table: with headers',
        results: [
            {}
        ],
        errors: [
            Warning(9,2),   // No non-empty values for these headers; assuming empty values.
        ]
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
            Error(12, 1, "'test' operator requires header(s)"),
            Warning(12,1)
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
            Error(12, 1, "'testnot' operator requires header(s)"),
            Warning(12,1)
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
            Error(12, 1, "'test' operator requires header(s), not 'table:'")
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
            Error(12, 1, "'testnot' operator requires header(s), not 'table:'")
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
            Error(12, 1, "'test' operator requires header(s), not 'or:'")
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
            Error(12, 1, "'testnot' operator requires header(s), not 'or:'")
        ]
    });

    testSrc({
		desc: '14a. Uniqueness unit tests, many failing',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobar", gloss: "eat-1SG"},
            {text: "goobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobaz", gloss: "eat-2SG"},
            {text: "goobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "foobaz", gloss: "run-2PL"},
            {text: "foobaz", gloss: "eat-2PL"},
            {text: "goobaz", gloss: "run-2PL"},
            {text: "moobaz", gloss: "jump-2PL"},
        ],
        errors: [
            Error(16, 2, "Failed unit test - unexpected 'gloss' result"),  // foobar, run-1SG
            Error(17, 2, "Failed unit test - unexpected 'gloss' result"),  // foobar, eat-1SG
            Error(20, 2, "Failed unit test - unexpected 'gloss' result"),  // foobaz, run-2SG
            Error(21, 2, "Failed unit test - unexpected 'gloss' result"),  // foobaz, run-2PL
            Error(22, 2, "Failed unit test - unexpected 'gloss' result"),  // foobaz, eat-2SG
            Error(23, 2, "Failed unit test - unexpected 'gloss' result"),  // goobaz, run-2SG
            Error(24, 2, "Failed unit test - unexpected 'gloss' result"),  // goobaz, run-2PL
            Error(25, 2, "Failed unit test - unexpected 'gloss' result"),  // moobaz, jump-2SG
            Error(26, 2, "Failed unit test - unexpected 'gloss' result"),  // moobaz, jump-2PL
            Error(27, 2, "Failed unit test - no matching outputs"),        // foobiz, run-3SG
            Error(28, 2, "Failed unit test - no matching outputs"),        // foobar, run-3SG
            Error(28, 2, "Failed unit test - unexpected 'gloss' result"),
            Error(29, 2, "Failed unit test - no matching outputs"),        // foobaz, run-3SG
            Error(29, 2, "Failed unit test - unexpected 'gloss' result"),
        ],
    });

    testSrc({
		desc: '14b. Negative unit tests don\'t allow unique',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "foobaz", gloss: "run-2PL"},
            {text: "moobaz", gloss: "jump-2PL"},
        ],
        errors: [
            Error(13, 3, "Invalid 'unique' header: 'unique gloss'"),
            Warning(13,1),
        ]
    });

    testSrc({
		desc: '15. Uniqueness tests with multiple uniqueness fields, many failing',
        results: [
            {root: "run",  subj: "[1SG]", text: "foobar", gloss: "run[1SG]"},
            {root: "run",  subj: "[1SG]", text: "goobar", gloss: "run[1SG]"},
            {root: "jump", subj: "[1SG]", text: "moobar", gloss: "jump[1SG]"},
            {root: "run",  subj: "[2SG]", text: "foobaz", gloss: "run[2SG]"},
            {root: "run",  subj: "[2SG]", text: "goobaz", gloss: "run[2SG]"},
            {root: "jump", subj: "[2SG]", text: "moobaz", gloss: "jump[2SG]"},
            {root: "run",  subj: "[2PL]", text: "foobaz", gloss: "run[2PL]"},
            {root: "run",  subj: "[2PL]", text: "goobaz", gloss: "run[2PL]"},
            {root: "jump", subj: "[2PL]", text: "moobaz", gloss: "jump[2PL]"},
        ],
        errors: [
            Error(18, 2, "Failed unit test - unexpected 'text' result"),  // run, [1SG], foobar, run[1SG]
            Error(19, 2, "Failed unit test - unexpected 'text' result"),  // run, [1SG], goobar, run[1SG]
            Error(20, 2, "Failed unit test - unexpected 'text' result"),  // run, [2SG], foobaz, run[2SG]
            Error(21, 2, "Failed unit test - unexpected 'text' result"),  // run, [2SG], goobaz, run[2SG]
            Error(22, 2, "Failed unit test - unexpected 'text' result"),  // run, [2PL], foobaz, run[2PL]
            Error(23, 2, "Failed unit test - unexpected 'text' result"),  // run, [2PL], goobaz, run[2PL]
            Error(25, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobat, jump[2SG]
            Error(25, 2, "Failed unit test - unexpected 'text' result"),
            Error(26, 2, "Failed unit test - no matching outputs"),       // jump, [2PL], moobat, jump[2PL]
            Error(26, 2, "Failed unit test - unexpected 'text' result"),
            Error(27, 2, "Failed unit test - no matching outputs"),       // run, [2SG], foobat, run[2SG]
            Error(27, 2, "Failed unit test - unexpected 'text' result"),
            Error(28, 2, "Failed unit test - no matching outputs"),       // run, [2PL], foobat, run[2PL]
            Error(28, 2, "Failed unit test - unexpected 'text' result"),
            Error(30, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobaz, run[2SG]
            Error(30, 2, "Failed unit test - unexpected 'gloss' result"),
            Error(31, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobaz, jump[3SG]
            Error(31, 2, "Failed unit test - unexpected 'gloss' result"),
            Error(32, 2, "Failed unit test - no matching outputs"),       // jump, [3SG], moobaz, jump[3SG]
            Error(33, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobat, jump[3SG]
            Error(33, 2, "Failed unit test - unexpected 'gloss' result"),
            Error(33, 2, "Failed unit test - unexpected 'text' result"),
        ]
    });

    // The following test explores error messages for uniqueness tests where
    // the "unique" test field doesn't exist in the grammar being tested.
    // Tests with and without "unique" are included for comparison.
    testSrc({
		desc: '16a. Uniqueness tests failing due to unknown header',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobar", gloss: "eat-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobaz", gloss: "eat-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(14, 2, "Failed unit test - no matching outputs"),  // foobar, verb
            Error(14, 2, "Failed unit test - output missing 'pos'"),
            Error(22, 2, "Ill-formed unit test - no 'pos' header"),
        ],
    });

    testSrc({
		desc: '16b. Uniqueness tests with some failing due to missing field',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "foobar", gloss: "eat-1SG", pos: "verb"},
            {text: "goobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG", pos: "verb"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobaz", gloss: "eat-2SG", pos: "verb"},
            {text: "goobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG", pos: "verb"}
        ],
        errors: [
            Error(15, 2, "Failed unit test - output missing 'pos'"),    // foobar, verb
            Error(16, 2, "Failed unit test - unexpected 'pos' result"), // foobar
            Error(18, 2, "Failed unit test - no matching outputs"),     // moobaz
            Error(18, 2, "Failed unit test - unexpected 'pos' result"),
        ],
    });

    testSrc({
		desc: '17a. Unit test with optional header',
        results: [
            {text: "foobar", gloss: "run"}
        ],
        errors: [
            Error(3, 3, "Not an ordinary header: 'optional gloss'"),
            Warning(4,3)
        ],
    });
    
    testSrc({
		desc: '17b. Unit test with a slash header',
        results: [
            {text: "foobar", gloss: "run", eng: "run"}
        ],
        errors: [
            Error(3, 3, "Not an ordinary header: 'gloss/eng'"),
            Warning(4,3)
        ],
    });

    testSrc({
		desc: '17c. Unit test with an embed header',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(6, 3, "Not an ordinary header: 'embed'"),
            Warning(7,3)
        ],
    });

    testSrc({
		desc: '18a. Unit test of a replace',
        results: [
            {text: "Xbc"}
        ],
    });
    
    testSrc({
		desc: '18b. Unit test of a replace, deletion at beginning',
        results: [
            {text: "bc"}
        ],
    });

    testSrc({
		desc: '18c. Unit test of a replace, deletion at end',
        results: [
            {text: "ab"}
        ],
    });

    testSrc({
		desc: '19. Both positive and negative unit tests for same grammar',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

});


