import { VERBOSE_DEBUG, VERBOSE_EXPR } from "../../../interpreter/src/utils/logging.js";
import {
    testSource, SourceTest,
    Error, Warning
} from "../testSourceUtil.js";

const DIR = "comment";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Column comment after headers of table',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
    });

    testSrc({
		desc: '1b. Column comment between headers of table',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
    });

    testSrc({
		desc: '1c. Column comment before headers of table',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
    });

    testSrc({
		desc: '1d. table op commented out',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
    });
    
    // was source test basic8
    testSrc({
		desc: '2a. Second embed header commented out',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '2b. First embed header commented out',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"},
        ],
        verbose: VERBOSE_DEBUG,
    });

    // was source basic5b
    testSrc({
		desc: '3a. Empty table op followed by column comment header',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(0, 0, "No content for symbol 'verb'"),
            Error(0, 1, "'table' operator requires header(s)"),
            Warning(0, 1, "No content for 'table' operator"),
        ],
    });

    // was source basic5d
    testSrc({
		desc: '3b. table op with empty text content & empty column comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(0, 2, "No content for header(s)"),
        ],
    });

    // was source basic5e
    testSrc({
		desc: '3c. table op with empty text content & non-empty column comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
    });

    // was source basic10b
    testSrc({
		desc: '4. Empty assignment followed by column comment header',
        results: [
            {}
        ],
        errors: [
            Warning(0, 0, "No content for symbol 'word'"),
            Error(0, 2, "Implicit 'table' operator requires header(s)"),
            Warning(0, 2, "No content for implicit 'table' operator"),
        ],
    });

    // was source basic12
    testSrc({
        desc: '5a. Column commented operators & assignments',
        results: [
            {text: "goo1goo2goo3goo4"},
        ],
    });

    testSrc({
        desc: '5b. Column commented operators & assignments, no table operator',
        results: [
            {text: "goo1goo2goo3goo4"},
        ],
    });

    // was source basic14a
    testSrc({
		desc: '6a. Column comment on assignment line, ' +
                'with table op with empty text content ' +
                '& non-empty comment content on the next line',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Error(0, 4, "Implicit 'table' operator requires header(s)"),
            Warning(0, 4, "No content for implicit 'table' operator"),
            Warning(1, 1, "'table:' in an unexpected column"),
        ],
    });

    // was source basic14b
    testSrc({
		desc: '6b. Column comment on assignment line, with empty text content ' +
                '& non-empty comment content on the next line',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(1, 1, "'text' in an unexpected column"),
        ],
    });

    // was source basic14c
    testSrc({
		desc: '6c. Column comment on assignment line, ' +
                'with commented content on the next lines',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(0, 0, "No content for symbol 'verb'"),
            Error(1, 1, "Implicit 'table' operator requires header(s)"),
            Warning(1, 1, "No content for implicit 'table' operator"),
            Warning(1, 1, "'%text' in an unexpected column"),
        ],
    });

    testSrc({
		desc: '7. Replace with to/from/context and surrounding column comments',
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "arba"},
        ],
    });

    testSrc({
        desc: '8. Collection with column comment after collection:',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"},
        ],
        errors: [
            Error(0, 3, "Unexpected assignment: 'verb='"),
            Error(0, 4, "Unexpected table-operator: 'table:'"),
            Error(9, 2, "Undefined symbol: 'x.verb'"),
        ],
        // verbose: VERBOSE_DEBUG
    });

    testSrc({
		desc: '9a. Column comment before assignment',
        results: [
            {text: "IGNORE", gloss: "IGNORE"},
        ],
        errors: [
            Error(3, 0, "Unexpected bare header/op/content: '%comment'"),
            Warning(3, 1, "Unexpected bare header/op/content: 'verb='"),
            Warning(3, 2, "Unexpected bare header/op/content: 'table:'"),
            Warning(3, 3, "Unexpected bare header/op/content: 'text'"),
            Warning(3, 4, "Unexpected bare header/op/content: 'gloss'"),
            Warning(4, 3, "Unexpected bare header/op/content: 'foo'"),
            Warning(4, 4, "Unexpected bare header/op/content: 'run'"),
            Warning(5, 3, "Unexpected bare header/op/content: 'moo'"),
            Warning(5, 4, "Unexpected bare header/op/content: 'jump'"),
            Error(18, 2, "Undefined symbol: 'verb'"),
        ],
    });

    testSrc({
		desc: '9b. Column comment between assignment and table op',
        results: [
            {text: "foobarXZ", gloss: "run-1SG-?-?"},
            {text: "moobarXZ", gloss: "jump-1SG-?-?"},
            {text: "foobazXZ", gloss: "run-2SG-?-?"},
            {text: "moobazXZ", gloss: "jump-2SG-?-?"},
        ],
        errors: [
            Error(4, 2, "Unexpected table-operator: 'table:'"),
        ],
    });

    // Similar to 1c
    testSrc({
		desc: '9c. Column comment after table op following assignment',
        results: [
            {text: "foobarXZ", gloss: "run-1SG-?-?"},
            {text: "moobarXZ", gloss: "jump-1SG-?-?"},
            {text: "foobazXZ", gloss: "run-2SG-?-?"},
            {text: "moobazXZ", gloss: "jump-2SG-?-?"},
        ]
    });

    testSrc({
        desc: '10a. Simple equals preceded by a column comment',
        results: [
            {text: "foo", pos: "v"},
            {text: "goo", pos: "v"},
        ],
    });

    testSrc({
        desc: '10b. Column comments preceding starts and ends',
        results: [
            {text: "foo", pos: "verb"},
        ],
    });

    testSrc({
        desc: '11a. Simple rename preceded by a column comment',
        results: [
            {text: "foo", gloss: "run"}
        ],
    });

    testSrc({
        desc: '11b. Simple rename preceded by two column comments',
        results: [
            {text: "foo", gloss: "run"}
        ],
    });

    testSrc({
        desc: '11c. Simple rename preceded by only column comments',
        results: [
            {gloss: "run"}
        ],
        errors: [
            Error(1, 5, "Renaming missing from header 'verb'"),
        ],
    });

    testSrc({
		desc: '12. Nested hide headers preceded by column comments',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo",    gloss: "run[3SG]"},
            {text: "moo",    gloss: "jump[3SG]"},
        ],
    });

    testSrc({
		desc: '13. Column comment with extra rows',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"},
        ],
    });

    testSrc({
		desc: '14. Column comment below a table op instead of an op like test',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"},
        ],
    });

});
