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
        symbols: [
            "All",
            "basic1a.All",
            "basic1a.word",
        ],
    });
    
    testSrc({
		desc: '1b. Minimal grammar with no table: op',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
    });
    
    testSrc({
		desc: '1c. Minimal grammar with empty row',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
    });

    testSrc({
		desc: '1d. Minimal grammar with empty column',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
    });

    testSrc({
		desc: '2a. Embeds',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "basic2a.All",
            "basic2a.word",
            "basic2a.Verb",
            "basic2a.Suffix",
        ],
    });

    testSrc({
		desc: '2b. Embeds, with varied spacing around symbol names',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "basic2b.All",
            "basic2b.word",
            "basic2b.Verb",
            "basic2b.Suffix",
        ],
    });

    testSrc({
		desc: '3a. Embeds with _ identifiers',
        symbol: "_Word",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "basic3a.All",
            "basic3a._Word",
            "basic3a._Verb",
            "basic3a.Suf_fix",
        ],
    });


    testSrc({
		desc: '3b. Headers with underscores',
        results: [
            {_text: "foobar", gloss_: "run-1SG"},
            {_text: "moobar", gloss_: "jump-1SG"},
            {_text: "foobaz", gloss_: "run-2SG"},
            {_text: "moobaz", gloss_: "jump-2SG"}
        ],
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
        ],
        symbols: [
            "All",
            "basic4.All",
            "basic4.word",
            "basic4.verb",
            "basic4.suffix",
        ],
    });

    testSrc({
		desc: '5a. Empty table op',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 0, "No content for symbol 'verb'"),
            Error(1, 1, "'table' operator requires header(s)"),
            Warning(1, 1, "No content for 'table' operator"),
        ],
        symbols: [
            "All",
            "basic5a.All",
            "basic5a.word",
            "basic5a.verb",
            "basic5a.suffix",
        ],
    });

    testSrc({
		desc: '5b. table op with empty text content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 2, "No content for header(s)"),
        ],
    });

    testSrc({
		desc: '6a. "optional text" header',
        results: [
            {text: "foo"},
            {text: "moo"},
            {text: "foobar"},
            {text: "moobar"},
        ],
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
        ],
    });

    testSrc({
		desc: '7a. Slash header',
        results: [
            {text: "foobar", gloss: "foo-1SG"},
            {text: "moobar", gloss: "moo-1SG"},
            {text: "foobaz", gloss: "foo-2SG"},
            {text: "moobaz", gloss: "moo-2SG"}
        ],
    });
    
    testSrc({
		desc: '7b. Double slash header',
        results: [
            {text: "foobar", gloss: "foo-1SG", root: "foo"},
            {text: "moobar", gloss: "moo-1SG", root: "moo"},
            {text: "foobaz", gloss: "foo-2SG", root: "foo"},
            {text: "moobaz", gloss: "moo-2SG", root: "moo"}
        ],
    });

    testSrc({
		desc: '8. Headers with lots of parens',
        results: [
            {text: "foo", gloss: "foo"},
            {text: "moo", gloss: "moo"}
        ]
    });

    testSrc({
		desc: '9. Empty assignment',
        results: [
            {}
        ],
        errors: [
            Warning(0, 0, "No content for symbol 'word'"),
        ],
        symbols: [
            "All",
            "basic9.All",
            "basic9.word",
        ],
    });

    testSrc({
		desc: '10. Nested tables',
        results: [
            {text: "foo", gloss: "run"},
        ],
        errors: [
            Error(0, 2, "Wayward 'table' operator")
        ]
    });

    testSrc({
		desc: '11a. Line after assignment, empty table op',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 0, "No content for symbol 'verb'"),
            Error(2, 1, "'table' operator requires header(s)"),
            Warning(2, 1, "No content for 'table' operator"),
        ]
    });

    testSrc({
		desc: '11b. Line after assignment, empty table op followed by comment header',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 0, "No content for symbol 'verb'"),
            Error(2, 1, "'table' operator requires header(s)"),
            Warning(2, 1, "No content for 'table' operator"),
        ],
    });

    testSrc({
		desc: '11c. Line after assignment, table op with empty text content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(2, 2, "No content for header(s)"),
        ],
    });

    testSrc({
		desc: '11d. Line after assignment, table op with empty text content ' +
                '& empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(2, 2, "No content for header(s)"),
        ],
    });

    testSrc({
		desc: '11e. Line after assignment, table op with empty text content ' +
                '& non-empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
    });

    testSrc({
		desc: '11f. Line after assignment, empty text content ' +
                '& non-empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
    });

    testSrc({
		desc: '11g. Empty lines after assignment, the empty text content ' +
                '& non-empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
    });

});
