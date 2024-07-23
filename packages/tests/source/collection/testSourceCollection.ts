import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil";

const DIR = "collection";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1a. Collection containing one assignment',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });
    
    testSrc({
		desc: '1b. Collection containing one assignment, referencing all',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '2a. Collection containing one assignment, generating from symbol inside',
        symbol: "word.verb",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });
    
    testSrc({
		desc: '2b. Collection containing one assignment, generating from all',
        symbol: "word.all",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '3. Collection containing two assignments',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '4. Two-assignment sheet, generating from all',
        symbol: "all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    });
    
    testSrc({
		desc: '5. Collection with auto default',
        symbol: "x.all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    });
    
    testSrc({
		desc: '6a. Nested all',
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    });
    
    testSrc({
		desc: '6b. Reference to .all.all',
        results: [
            {}
        ],
        errors: [
            Error(11,1)
        ]
    });

    testSrc({
		desc: '7a. Explicit all',
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"}
        ]
    });

    testSrc({
		desc: '7b. Explicit all, generating from all',
        symbol: "x.all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"}
        ]
    });

    testSrc({
		desc: '8a. All referencing an explicit all',
        results: [
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    });

    testSrc({
		desc: '8b. Reference to a symbol next to explicit all',
        results: [
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ]
    });
    
    testSrc({
		desc: '9a. Reference to a non-existent collection',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Error(9,2)
        ]
    });

    testSrc({
		desc: '9b. Reference to a non-existent symbol within a collection',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Error(9,2)
        ]
    });
    
    testSrc({
		desc: '9c. Symbol reference without collection prefix',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Error(9,2)
        ]
    });

    
    testSrc({
		desc: '10a. Collection with embeds referring outside of it',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '10b. Collection with embeds referring into a sibling collection',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '10c. Collection with embeds referring to symbols in itself',
        symbol: "word.x",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '11a. Unnamed collection as first child',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Warning(0,0)
        ]
    });
    
    testSrc({
		desc: '11b. Unnamed collection as second child',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Warning(4,0)
        ]
    });
    
    testSrc({
		desc: '11c. Unnamed collection as last child',
        results: undefined,
        errors: [
            Warning(8,0)
        ]
    });
    
    testSrc({
		desc: '12a. Op with collection as a child',
        results: [
            {},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(11,2)
        ]
    });
    
    testSrc({
		desc: '12b. Op with collection as a sibling',
        results: [
            {},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        errors: [
            Error(8,1)
        ]
    });
});
