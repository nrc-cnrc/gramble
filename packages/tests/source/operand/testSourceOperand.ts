import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "operand";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
        desc: '0a. Simple replace',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foovaz", gloss: "run-2SG"},
            {text: "foovar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moovaz", gloss: "jump-2SG"},
            {text: "moovar", gloss: "jump-1SG"}
        ],
    });
    
    testSrc({
        desc: '0b. Simple replace with bad to operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Warning(12,1),
            Error(12, 3, "Invalid plain header: 'too'"),
        ]
    });

    testSrc({
        desc: '1a. Simple replace with from/to operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12,1, "Missing/invalid 'from' header"),
            Error(12,1, "Missing/invalid 'to' header"),
            Error(12,2, "Invalid header: 'from/to'"),
        ]
    });

    testSrc({
        desc: '1b. Simple replace with to/from operand',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12,1, "Missing/invalid 'from' header"),
            Error(12,1, "Missing/invalid 'to' header"),
            Error(12,2, "Invalid header: 'to/from'"),
        ]
    });

    testSrc({
        desc: '1c. Simple replace with from & to/xxx operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12,1, "Missing/invalid 'to' header"),
            Error(12,3, "Invalid header: 'to/xxx'"),
        ]
    });

    testSrc({
        desc: '1d. Simple replace with to/xxx & from operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12,1, "Missing/invalid 'to' header"),
            Error(12,2, "Invalid header: 'to/xxx'"),
        ]
    });

    testSrc({
        desc: '1e. Simple replace with to & from/xxx operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12,1, "Missing/invalid 'from' header"),
            Error(12,3, "Invalid header: 'from/xxx'"),
        ]
    });

    testSrc({
        desc: '1f. Simple replace with from/xxx & to operands',
        results: [
            {text: "foo",    gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo",    gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12,1, "Missing/invalid 'from' header"),
            Error(12,2, "Invalid header: 'from/xxx'"),
        ]
    });

});
