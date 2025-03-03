import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "cell";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Content with space',
        results: [
            {text: "moofoo", gloss: "run"}
        ]
    });

    testSrc({
		desc: '1b. Content with escaped space in middle',
        results: [
            {text: "moo foo", gloss: "run"}
        ]
    });
    
    testSrc({
		desc: '1b-2. Content with escaped backslash and space in middle',
        results: [
            {text: "moo\\foo", gloss: "run"}
        ]
    });

    testSrc({
		desc: '1c. Content with escaped space at beginning',
        results: [
            {text: " foo", gloss: "run"}
        ]
    });

    testSrc({
		desc: '1d. Content with escaped space at end',
        results: [
            {text: "foo ", gloss: "run"}
        ]
    });

    testSrc({
        desc: '1e. Content with an escaped backslash at end',
        results: [
            {text: "foo\\", gloss: "run"}
        ]
    });
    
    testSrc({
        desc: '1f. Content with an escaped backslash and space at end',
        results: [
            {text: "foo\\", gloss: "run"}
        ]
    });

    testSrc({
		desc: '2a. Content including alternation',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "run"},
        ]
    });
    
    testSrc({
		desc: '2b. Content including escaped |',
        results: [
            {text: "moo|foo", gloss: "run"},
        ]
    });
    
    testSrc({
		desc: '3a. Content including alternation and spaces',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "run"},
        ]
    });

    testSrc({
		desc: '3b. Content including alternation and spaces 2',
        results: [
            {text: "foogoo", gloss: "run"},
            {text: "moo", gloss: "run"}
        ]
    });

    testSrc({
		desc: '3c. Content including alternation and spaces 3',
        results: [
            {text: "foo", gloss: "run"},
            {text: "goomoo", gloss: "run"}
        ]
    });

    testSrc({
		desc: '3d. Content including alternation and spaces 4',
        results: [
            {text: "foo", gloss: "run"},
            {text: "goo moo", gloss: "run"},
        ]
    });

    testSrc({
		desc: '4a. Content including one backslash',
        results: [
            {text: "foo", gloss: "run"},
        ]
    });

    testSrc({
		desc: '4b. Content including two backslashes',
        results: [
            {text: "\\foo", gloss: "run"},
        ]
    });

    testSrc({
		desc: '4c. Content including escaped backslash',
        results: [
            {text: "\\foo", gloss: "run"},
        ]
    });
    
    testSrc({
		desc: '5a. Content including parens',
        results: [
            {text: "(foo)", gloss: "run"},
        ]
    });

    testSrc({
		desc: '5b. Content including escaped parens',
        results: [
            {text: "(foo)", gloss: "run"},
        ]
    });

    testSrc({
		desc: '6a. Embed with alternation',
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ]
    });
    
    testSrc({
		desc: '6b. Embed with three-way alternation',
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"},
            {"text":"noobar"},
            {"text":"soobar"}
        ]
    });
    
    testSrc({
		desc: '7a. Embed with curly braces',
        results: [
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [
            Warning(5,2)
        ]
    });
    
    testSrc({
		desc: '7b. Embed with alt and curly braces',
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [
            Warning(9,2)
        ]
    });
    
    testSrc({
		desc: '7c. Embed with alt and curly braces 2',
        results: [
            {"text":"boobar"},
            {"text":"goobar"},
            {"text":"foobar"},
            {"text":"moobar"}
        ],
        errors: [
            Warning(9,2)
        ]
    });

    testSrc({
		desc: '8a. Embed with sequence',
        results: [
            {"text":"bar"},
        ],
        errors: [
            Error(9,2)
        ]
    });
    
    testSrc({
		desc: '8b. Embed with alternation and space',
        results: [
            {"text":"bar"},
        ],
        errors: [
            Error(13,2)
        ]
    });
});
