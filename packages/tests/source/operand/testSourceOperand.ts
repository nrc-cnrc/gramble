import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";
import {
    VERBOSE_DEBUG
} from "../../../interpreter/src/utils/logging.js"

const DIR = "operand";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
        desc: '0. Simple replace',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foovaz", gloss: "run-2SG"},
            {text: "foovar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moovaz", gloss: "jump-2SG"},
            {text: "moovar", gloss: "jump-1SG"},
        ],
    });

    testSrc({
        desc: '1a. Simple replace with bad from operand (ffrom)',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'from' header for 'replace'"),
            Warning(12, 1),
            Error(12, 2, "Invalid ordinary header: 'ffrom'"),
        ]
    });

    testSrc({
        desc: '1b. Simple replace with bad to operand (too)',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'to' header for 'replace'"),
            Warning(12, 1),
            Error(12, 3, "Invalid ordinary header: 'too'"),
        ]
    });

    testSrc({
        desc: '1c. Simple replace with bad context operand (conntext)',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Warning(12, 1),
            Error(12, 4, "Invalid ordinary header: 'conntext'"),
        ]
    });

    testSrc({
        desc: '2a. Simple replace with from/to operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'from' header for 'replace'"),
            Error(12, 1, "Missing 'to' header for 'replace'"),
            Warning(12, 1),
            Error(12, 2, "Invalid ordinary header: 'from/to'"),
        ]
    });

    testSrc({
        desc: '2b. Simple replace with to/from operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'from' header for 'replace'"),
            Error(12, 1, "Missing 'to' header for 'replace'"),
            Warning(12, 1),
            Error(12, 2, "Invalid ordinary header: 'to/from'"),
        ]
    });

    testSrc({
        desc: '2c. Simple replace with from & to/xxx operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'to' header for 'replace'"),
            Warning(12, 1),
            Error(12, 3, "Invalid ordinary header: 'to/xxx'"),
        ]
    });

    testSrc({
        desc: '2d. Simple replace with to/xxx & from operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'to' header for 'replace'"),
            Warning(12, 1),
            Error(12, 2, "Invalid ordinary header: 'to/xxx'"),
        ]
    });

    testSrc({
        desc: '2e. Simple replace with to & from/xxx operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'from' header for 'replace'"),
            Warning(12, 1),
            Error(12, 3, "Invalid ordinary header: 'from/xxx'"),
        ]
    });

    testSrc({
        desc: '2f. Simple replace with from/xxx & to operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Missing 'from' header for 'replace'"),
            Warning(12, 1),
            Error(12, 2, "Invalid ordinary header: 'from/xxx'"),
        ]
    });

    testSrc({
        desc: '3. Simple replace with extra xxx operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Warning(12, 1), // erroneous operands
            Error(12, 4, "Invalid ordinary header: 'xxx'"),
        ]
    });

    testSrc({
        desc: '4a. Simple replace with extra from operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foovaz", gloss: "run-2SG"},
            {text: "foovar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moovaz", gloss: "jump-2SG"},
            {text: "moovar", gloss: "jump-1SG"},
        ],
        errors: [
            Warning(13, 4), // extra from header
        ]
    });

    testSrc({
        desc: '4b. Simple replace with extra to operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foovaz", gloss: "run-2SG"},
            {text: "foovar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moovaz", gloss: "jump-2SG"},
            {text: "moovar", gloss: "jump-1SG"},
        ],
        errors: [
            Warning(13, 4), // extra to header
        ]
    });

    testSrc({
        desc: '4c. Simple replace with extra context operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moovaz", gloss: "jump-2SG"},
            {text: "moovar", gloss: "jump-1SG"},
        ],
        errors: [
            Warning(13, 5), // extra context header
        ]
    });

    testSrc({
        desc: '5. Simple replace with bad context operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foovaz", gloss: "run-2SG"},
            {text: "foovar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moovaz", gloss: "jump-2SG"},
            {text: "moovar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(13, 4, "Error parsing cell: 'BADcontext'"),
        ],
    });

    testSrc({
        desc: '6. to/from/context used as tape names outside of a replace',
        results: [
            {text: "foo", gloss: "run", from: "x", to: "y", context: "z"},
            {text: "moo", gloss: "jump", from: "x", to: "y", context: "z"},
        ]
    });

    testSrc({
        desc: '7a. Simple replace with non-existent from as the tape in replace',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Replacing non-existent tape: 'from'"),
        ]
    });

    testSrc({
        desc: '7b. Simple replace with from as the tape throughout',
        results: [
            {from: "foo",    gloss: "run.3SG"},
            {from: "foovaz", gloss: "run-2SG"},
            {from: "foovar", gloss: "run-1SG"},
            {from: "moo",    gloss: "jump.3SG"},
            {from: "moovaz", gloss: "jump-2SG"},
            {from: "moovar", gloss: "jump-1SG"},
        ],
    });

    testSrc({
        desc: '7c. Simple replace with non-existent to as the tape in replace',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Replacing non-existent tape: 'to'"),
        ]
    });

    testSrc({
        desc: '7d. Simple replace with to as the tape throughout',
        results: [
            {to: "foo",    gloss: "run.3SG"},
            {to: "foovaz", gloss: "run-2SG"},
            {to: "foovar", gloss: "run-1SG"},
            {to: "moo",    gloss: "jump.3SG"},
            {to: "moovaz", gloss: "jump-2SG"},
            {to: "moovar", gloss: "jump-1SG"},
        ],
    });

    testSrc({
        desc: '7e. Simple replace with non-existent context as the tape in replace',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"},
        ],
        errors: [
            Error(12, 1, "Replacing non-existent tape: 'context'"),
        ]
    });

    testSrc({
        desc: '7f. Simple replace with context as the tape throughout',
        results: [
            {context: "foo",    gloss: "run.3SG"},
            {context: "foovaz", gloss: "run-2SG"},
            {context: "foovar", gloss: "run-1SG"},
            {context: "moo",    gloss: "jump.3SG"},
            {context: "moovaz", gloss: "jump-2SG"},
            {context: "moovar", gloss: "jump-1SG"},
        ],
    });

    testSrc({
		desc: '8a. Simple equals with from as the tape',
        results: [
            {from: "v", text: "fao"},
            {from: "v", text: "foo"},
            {from: "v", text: "goo"},
        ]
    });

    testSrc({
		desc: '8b. Simple equals with to as the tape',
        results: [
            {to: "v", text: "fao"},
            {to: "v", text: "foo"},
            {to: "v", text: "goo"},
        ]
    });

    testSrc({
		desc: '8c. Simple equals with context as the tape',
        results: [
            {context: "v", text: "fao"},
            {context: "v", text: "foo"},
            {context: "v", text: "goo"},
        ]
    });

    testSrc({
		desc: '9a. Simple starts with from as the tape',
        results: [
            {from: "faa", pos: "n"},
            {from: "fao", pos: "v"},
        ]
    });

    testSrc({
		desc: '9b. Simple starts with to as the tape',
        results: [
            {to: "faa", pos: "n"},
            {to: "fao", pos: "v"},
        ]
    });

    testSrc({
		desc: '9c. Simple starts with context as the tape',
        results: [
            {context: "faa", pos: "n"},
            {context: "fao", pos: "v"},
        ]
    });

    testSrc({
		desc: '10a. Simple ends with from as the tape',
        results: [
            {from: "foo", pos: "v"},
            {from: "goo", pos: "v"},
            {from: "moo", pos: "n"},
        ]
    });

    testSrc({
		desc: '10b. Simple ends with to as the tape',
        results: [
            {to: "foo", pos: "v"},
            {to: "goo", pos: "v"},
            {to: "moo", pos: "n"},
        ]
    });

    testSrc({
		desc: '10c. Simple ends with context as the tape',
        results: [
            {context: "foo", pos: "v"},
            {context: "goo", pos: "v"},
            {context: "moo", pos: "n"},
        ]
    });

    testSrc({
		desc: '11a. Simple contains with from as the tape',
        results: [
            {from: "faa", pos: "n"},
            {from: "fao", pos: "v"},
        ]
    });

    testSrc({
		desc: '11b. Simple contains with to as the tape',
        results: [
            {to: "faa", pos: "n"},
            {to: "fao", pos: "v"},
        ]
    });

    testSrc({
		desc: '11c. Simple contains with context as the tape',
        results: [
            {context: "faa", pos: "n"},
            {context: "fao", pos: "v"},
        ]
    });

    testSrc({
		desc: '12a. Simple embed with from as the symbol',
        results: [
            {text: "faa", pos: "n"},
            {text: "fao", pos: "v"},
            {text: "foo", pos: "v"},
            {text: "goo", pos: "v"},
            {text: "moo", pos: "n"},
        ]
    });

    testSrc({
		desc: '12b. Simple embed with to as the symbol',
        results: [
            {text: "faa", pos: "n"},
            {text: "fao", pos: "v"},
            {text: "foo", pos: "v"},
            {text: "goo", pos: "v"},
            {text: "moo", pos: "n"},
        ]
    });

    testSrc({
		desc: '12c. Simple embed with context as the symbol',
        results: [
            {text: "faa", pos: "n"},
            {text: "fao", pos: "v"},
            {text: "foo", pos: "v"},
            {text: "goo", pos: "v"},
            {text: "moo", pos: "n"},
        ]
    });

    testSrc({
		desc: '13. Simple table with unique as the tape',
        results: [
            {pos: "n"},
            {pos: "v"},
        ],
        errors: [
            Error(1, 2, "Invalid header: 'unique'"),
            Warning(2, 2),
            Warning(3, 2),
            Warning(4, 2),
            Warning(5, 2),
            Warning(6, 2),
        ]
    });

});
