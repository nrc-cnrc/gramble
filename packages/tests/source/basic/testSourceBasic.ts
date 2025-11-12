import { VERBOSE_DEBUG, VERBOSE_EXPR } from "../../../interpreter/src/utils/logging.js";
import {
    testSource, SourceTest,
    Error, Warning
} from "../testSourceUtil.js";

const DIR = "basic";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Minimal grammar',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
    });
    
    testSrc({
		desc: '1b. Minimal grammar with no table: op',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });
    
    testSrc({
		desc: '1c. Minimal grammar with empty row',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '1d. Minimal grammar with empty column',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '2b. Embeds',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '2b. Embeds, with varied spacing around symbol names',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '3a. Embeds with _ identifiers',
        symbol: "_Word",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });


    testSrc({
		desc: '3b. Headers with underscores',
        results: [
            {_text: "foobar", gloss_: "run-1SG"},
            {_text: "moobar", gloss_: "jump-1SG"},
            {_text: "foobaz", gloss_: "run-2SG"},
            {_text: "moobaz", gloss_: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '4. Table with empty cell',
        results: [
            {text: "foobar", gloss: "run-1SG", pos:"v"},
            {text: "moobar", gloss: "jump-1SG", pos:"v"},
            {text: "foobaz", gloss: "run-2SG", pos:"v"},
            {text: "moobaz", gloss: "jump-2SG", pos:"v"},
            {text: "foo", gloss: "run.3SG", pos:"v"},
            {text: "moo", gloss: "jump.3SG", pos:"v"}
        ]
    });

    testSrc({
		desc: '5a. Empty "table:" op',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 0),  // This symbol will not contain any content.
            Error(1, 1, "'table' operator requires non-empty grid"),
            Warning(1, 1),  // This will not contain any content.
        ]
    });

    testSrc({
		desc: '5b. Empty "table:" op followed by comment header',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 0),  // This symbol will not contain any content.
            Error(1, 1, "'table' operator requires non-empty grid")
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '5c. "table:" op with empty text content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 2),  // No content cells found for these headers; assuming empty values.
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '5d. "table:" op with empty text content & empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 2),  // No content cells found for these headers; assuming empty values.
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '5e. "table:" op with empty text content & non-empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '6a. "optional text" header',
        results: [
            {text: "foo"},
            {text: "moo"},
            {text: "foobar"},
            {text: "moobar"},
        ]
    });

    testSrc({
		desc: '6b. "optional embed" header',
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
		desc: '7a. Slash header',
        results: [
            {text: "foobar", gloss: "foo-1SG"},
            {text: "moobar", gloss: "moo-1SG"},
            {text: "foobaz", gloss: "foo-2SG"},
            {text: "moobaz", gloss: "moo-2SG"}
        ]
    });
    
    testSrc({
		desc: '7b. Double slash header',
        results: [
            {text: "foobar", gloss: "foo-1SG", root: "foo"},
            {text: "moobar", gloss: "moo-1SG", root: "moo"},
            {text: "foobaz", gloss: "foo-2SG", root: "foo"},
            {text: "moobaz", gloss: "moo-2SG", root: "moo"}
        ]
    });

    testSrc({
		desc: '8. Header commented out',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '9. Headers with lots of parens',
        results: [
            {text: "foo", gloss: "foo"},
            {text: "moo", gloss: "moo"}
        ]
    });

    testSrc({
		desc: '10. Empty assignment',
        results: [
            {}
        ],
        errors: [
            Warning(0, 0)
        ]
    });
    
    testSrc({
		desc: '11. Nested tables',
        results: [
            {text: "foo", gloss: "run"},
        ],
        errors: [
            Error(0, 2, "Wayward 'table' operator")
        ]
    });

    testSrc({
        desc: '12. Commented operators & assignments',
        results: [
            {text: "goo1goo2goo3goo4"},
        ],
        // This test yielded the following error messages before we fixed
        // ParseSource.handleWorksheet to correctly parse comment headers that
        // looked like operators or assignments (i.e. ended in ':' or '=').
        // errors: [
        //     Warning(0, 0), // This symbol will not contain any content.
        //     Error(0, 1, "'table' operator requires grid, not 'text'"),
        //     Error(0, 2, "Invalid operator: '%table:'"),
        //     Error(3, 3, "Invalid operator: '%table:'"),
        //     Error(3, 3, "Unexpected operator: '%table:'"),
        //     Warning(6, 0), // This symbol will not contain any content.
        //     Error(6, 1, "'table' operator requires grid, not 'text'"),
        //     Error(6, 2, "Invalid operator: '%noun='"),
        //     Error(9, 3, "Invalid operator: '%noun='"),
        //     Error(9, 3, "Unexpected operator: '%noun='"),
        // ],
    });

});
