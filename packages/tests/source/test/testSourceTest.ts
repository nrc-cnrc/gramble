import { Test } from "mocha";
import {VERBOSE_DEBUG } from "../../../interpreter/src/utils/logging.js";
import {
    testSource, SourceTest, 
    Error, TestFailed, TestSkipped, Warning 
} from "../testSourceUtil.js";

const DIR = "test";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Simple grammar with unit tests',
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobarmz"],
            gloss: [..."run-1SGse2"]
        },
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobaz", gloss: "see-2SG"}
        ]
    });
    
    testSrc({
		desc: '1b. Simple grammar with negative unit tests',
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobar"],
            gloss: [..."run-1SG"]
        },
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
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobarmz"],
            gloss: [..."run-1SGjmp2"]
        },
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            TestFailed(14, 2, "Failed unit test - no matching outputs"),
            TestFailed(16, 2, "Failed unit test - no matching outputs"),
            TestFailed(17, 2, "Failed unit test - no matching outputs"),
            TestFailed(19, 2, "Failed unit test - no matching outputs"),
            TestFailed(21, 2, "Failed unit test - no matching outputs"),
        ],
    });

    testSrc({
		desc: '5b. Failing negative unit tests',
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobarmz"],
            gloss: [..."run-1SGjmp2"]
        },
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            TestFailed(14, 2, "Failed unit testnot - has matching outputs"),
            TestFailed(16, 2, "Failed unit testnot - has matching outputs"),
            TestFailed(18, 2, "Failed unit testnot - has matching outputs"),
            TestFailed(20, 2, "Failed unit testnot - has matching outputs"),
        ]
    });

    testSrc({
		desc: '6a. Unit tests with unknown header',
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobarmz"],
            gloss: [..."run-1SGjmp2"]
        },
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12, 4, "Ill-formed unit testblock - no 'pos' header"),
            TestSkipped(13, 2, "Skipped unit test"),
            TestSkipped(14, 2, "Skipped unit test"),
            TestSkipped(15, 2, "Skipped unit test"),
            TestSkipped(16, 2, "Skipped unit test"),
            TestSkipped(17, 2, "Skipped unit test"),
            TestSkipped(18, 2, "Skipped unit test"),
            TestSkipped(19, 2, "Skipped unit test"),
        ],
    });

    testSrc({
		desc: '6b. Negative unit tests with unknown header',
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobarmz"],
            gloss: [..."run-1SGjmp2"]
        },
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12, 4, "Ill-formed unit testblock - no 'pos' header"),
            TestSkipped(13, 2, "Skipped unit test"),
            TestSkipped(14, 2, "Skipped unit test"),
            TestSkipped(15, 2, "Skipped unit test"),
        ]
    });

    testSrc({
		desc: '6c. Unit tests with multiple unknown headers',
        tapes: ["text", "gloss"],
        vocab: {
            text: [..."fobarmz"],
            gloss: [..."run-1SGjmp2"]
        },
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(12, 4, "Ill-formed unit testblock - no 'pos' header"),
            Error(12, 5, "Ill-formed unit testblock - no 'class' header"),
            TestSkipped(13, 2, "Skipped unit test"),
            TestSkipped(14, 2, "Skipped unit test"),
            TestSkipped(15, 2, "Skipped unit test"),
            TestSkipped(16, 2, "Skipped unit test"),
            TestSkipped(17, 2, "Skipped unit test"),
            TestSkipped(18, 2, "Skipped unit test"),
            TestSkipped(19, 2, "Skipped unit test"),
        ],
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
            TestFailed(15, 2, "Failed unit test - no matching outputs"),
            TestFailed(17, 2, "Failed unit test - no matching outputs"),
            TestFailed(18, 2, "Failed unit test - no matching outputs"),
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
            TestFailed(14, 2, "Failed unit testnot - has matching outputs"),
            TestFailed(16, 2, "Failed unit testnot - has matching outputs"),
        ]
    });

    testSrc({
		desc: '8a. Testing nothing',
        results: [
            {}
        ],
        errors: [
            Warning(9, 0, "No content for symbol 'word'"),
            Error(9, 1, "Missing content for 'test' operator"),
        ]
    });
    
    testSrc({
		desc: '8b. Negative testing nothing',
        results: [
            {}
        ],
        errors: [
            Warning(9, 0, "No content for symbol 'word'"),
            Error(9, 1, "Missing content for 'testnot' operator"),
        ],
    });

    testSrc({
		desc: '9a. Testing empty table:',
        results: [
            {}
        ],
        errors: [
            Warning(9, 0, "No content for symbol 'word'"),
            Error(9, 1, "'table' operator requires header(s)"),
            Warning(9, 1, "No content for 'table' operator"),
            Error(11, 1, "Missing content for 'test' operator"),
        ]
    });

    testSrc({
		desc: '9b. Negative testing empty table:',
        results: [
            {}
        ],
        errors: [
            Warning(9, 0, "No content for symbol 'word'"),
            Error(9, 1, "'table' operator requires header(s)"),
            Warning(9, 1, "No content for 'table' operator"),
            Error(11, 1, "Missing content for 'testnot' operator"),
        ]
    });
    
    testSrc({
		desc: '10a. Testing empty table: with headers',
        results: [
            {}
        ],
        errors: [
            TestFailed(12, 2, "Failed unit test - no matching outputs"),
            TestFailed(13, 2, "Failed unit test - no matching outputs"),
            TestFailed(14, 2, "Failed unit test - no matching outputs"),
            Warning(9, 2, "No content for header(s)"),
        ]
    });

    testSrc({
		desc: '10b. Negative testing empty table: with headers',
        results: [
            {}
        ],
        errors: [
            Warning(9, 2, "No content for header(s)"),
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
            Warning(12, 1, "No content for 'test' operator")
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
            Warning(12, 1, "No content for 'testnot' operator")
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
            TestFailed(16, 2, "Failed unit test - unexpected 'gloss' result"),  // foobar, run-1SG
            TestFailed(17, 2, "Failed unit test - unexpected 'gloss' result"),  // foobar, eat-1SG
            TestFailed(20, 2, "Failed unit test - unexpected 'gloss' result"),  // foobaz, run-2SG
            TestFailed(21, 2, "Failed unit test - unexpected 'gloss' result"),  // foobaz, run-2PL
            TestFailed(22, 2, "Failed unit test - unexpected 'gloss' result"),  // foobaz, eat-2SG
            TestFailed(23, 2, "Failed unit test - unexpected 'gloss' result"),  // goobaz, run-2SG
            TestFailed(24, 2, "Failed unit test - unexpected 'gloss' result"),  // goobaz, run-2PL
            TestFailed(25, 2, "Failed unit test - unexpected 'gloss' result"),  // moobaz, jump-2SG
            TestFailed(26, 2, "Failed unit test - unexpected 'gloss' result"),  // moobaz, jump-2PL
            TestFailed(27, 2, "Failed unit test - no matching outputs"),        // foobiz, run-3SG
            TestFailed(28, 2, "Failed unit test - no matching outputs"),        // foobar, run-3SG
            TestFailed(28, 2, "Failed unit test - unexpected 'gloss' result"),
            TestFailed(29, 2, "Failed unit test - no matching outputs"),        // foobaz, run-3SG
            TestFailed(29, 2, "Failed unit test - unexpected 'gloss' result"),
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
            Warning(13, 1, "'testnot' operator has erroneous operands"),
            Error(13, 3, "Invalid 'unique' header: 'unique gloss'"),
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
            TestFailed(18, 2, "Failed unit test - unexpected 'text' result"),  // run, [1SG], foobar, run[1SG]
            TestFailed(19, 2, "Failed unit test - unexpected 'text' result"),  // run, [1SG], goobar, run[1SG]
            TestFailed(20, 2, "Failed unit test - unexpected 'text' result"),  // run, [2SG], foobaz, run[2SG]
            TestFailed(21, 2, "Failed unit test - unexpected 'text' result"),  // run, [2SG], goobaz, run[2SG]
            TestFailed(22, 2, "Failed unit test - unexpected 'text' result"),  // run, [2PL], foobaz, run[2PL]
            TestFailed(23, 2, "Failed unit test - unexpected 'text' result"),  // run, [2PL], goobaz, run[2PL]
            TestFailed(25, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobat, jump[2SG]
            TestFailed(25, 2, "Failed unit test - unexpected 'text' result"),
            TestFailed(26, 2, "Failed unit test - no matching outputs"),       // jump, [2PL], moobat, jump[2PL]
            TestFailed(26, 2, "Failed unit test - unexpected 'text' result"),
            TestFailed(27, 2, "Failed unit test - no matching outputs"),       // run, [2SG], foobat, run[2SG]
            TestFailed(27, 2, "Failed unit test - unexpected 'text' result"),
            TestFailed(28, 2, "Failed unit test - no matching outputs"),       // run, [2PL], foobat, run[2PL]
            TestFailed(28, 2, "Failed unit test - unexpected 'text' result"),
            TestFailed(30, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobaz, run[2SG]
            TestFailed(30, 2, "Failed unit test - unexpected 'gloss' result"),
            TestFailed(31, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobaz, jump[3SG]
            TestFailed(31, 2, "Failed unit test - unexpected 'gloss' result"),
            TestFailed(32, 2, "Failed unit test - no matching outputs"),       // jump, [3SG], moobaz, jump[3SG]
            TestFailed(33, 2, "Failed unit test - no matching outputs"),       // jump, [2SG], moobat, jump[3SG]
            TestFailed(33, 2, "Failed unit test - unexpected 'gloss' result"),
            TestFailed(33, 2, "Failed unit test - unexpected 'text' result"),
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
            Error(13, 3, "Ill-formed unit testblock - no 'pos' header"),
            TestSkipped(14, 2, "Skipped unit test"),
            TestSkipped(15, 2, "Skipped unit test"), 
            TestSkipped(16, 2, "Skipped unit test"),
            Error(21, 3, "Ill-formed unit testblock - no 'pos' header"),
            TestSkipped(22, 2, "Skipped unit test"),    
            TestSkipped(23, 2, "Skipped unit test"),
            TestSkipped(24, 2, "Skipped unit test"),
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
            TestFailed(15, 2, "Failed unit test - output missing 'pos'"),    // foobar, verb
            TestFailed(16, 2, "Failed unit test - unexpected 'pos' result"), // foobar
            TestFailed(18, 2, "Failed unit test - no matching outputs"),     // moobaz
            TestFailed(18, 2, "Failed unit test - unexpected 'pos' result"),
        ],
    });

    testSrc({
		desc: '17a. Unit test with optional header',
        results: [
            {text: "foobar", gloss: "run"}
        ],
        errors: [
            Error(3, 3, "Not an ordinary header: 'optional gloss'"),
            Warning(4, 3, "No valid header above")
        ],
    });
    
    testSrc({
		desc: '17b. Unit test with a slash header',
        results: [
            {text: "foobar", gloss: "run", eng: "run"}
        ],
        errors: [
            Error(3, 3, "Not an ordinary header: 'gloss/eng'"),
            Warning(4, 3, "No valid header above")
        ],
    });

    testSrc({
		desc: '17c. Unit test with an embed header',
        results: [
            {text: "foobar", gloss: "run-1SG"}
        ],
        errors: [
            Error(6, 3, "Not an ordinary header: 'embed'"),
            Warning(7, 3, "No valid header above")
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


