import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "multi";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Multi-sheet project',
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ]
    });
    
    testSrc({
		desc: '2. Multi-sheet project with lowercase sheet reference', 
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ]
    });

    testSrc({
		desc: '3. Multi-sheet project with a "bare" sheet reference',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1,1)
        ]
    });
    
    testSrc({
		desc: '4. Multi-sheet project with a "bare" reference to "bare" grammar',
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ]
    });

    testSrc({
		desc: '5. Multi-sheet project with missing symbol in imported sheet',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1,1)
        ]
    });
    
    testSrc({
		desc: '6. Multi-sheet with reserved word reference',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1,1)
        ]
    });

    testSrc({
		desc: '7. Multi-sheet project referencing non-existent sheet',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1,1)
        ]
    });

    testSrc({
		desc: '8. Multi-sheet project where the imported sheet references the original',
        results: [
            {text: "foobarable", gloss: "run-1SG"},
            {text: "moobarable", gloss: "jump-1SG"},
            {text: "foobazable", gloss: "run-2SG"},
            {text: "moobazable", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '9. Multi-sheet project with a reference to a collection in an external document',
        results: [
            {text: "foobarable", gloss: "run-1SG"},
            {text: "moobarable", gloss: "jump-1SG"},
            {text: "foobazable", gloss: "run-2SG"},
            {text: "moobazable", gloss: "jump-2SG"}
        ]
    });

    testSrc({
		desc: '10. Multi-sheet project with an all reference to a collection in an external document',
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ]
    });
    
    testSrc({
		desc: '11. Multi-sheet project with the external reference in a collection',
        symbol: "x.word",
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ]
    });

    testSrc({
		desc: '12. Reference to an external document, shadowed by a local assignment',
        results: [
            {text: "zooable"},
        ]
    });

    testSrc({
		desc: '13. External reference in a collection, shadowed by a local assignment',
        symbol: "x.word",
        results: [
            {text: "zooable"},
        ]
    });
    
    testSrc({
		desc: '14. Collection with the same name as an external sheet',
        symbol: "word",
        results: [
            {text: "zoo"},
        ]
    });
    
    testSrc({
		desc: '15. Collection with the same name as an external sheet, with a reference to it inside',
        symbol: "multi15external.w1",
        results: [
            {text: "zoo"},
        ]
    });

    testSrc({
		desc: '16. Two references to the same sheet with different casing',
        symbol: "result",
        results: [
            {text: "foo"},
        ]
    });
    
    testSrc({
		desc: '17a. Collection with the same name as an external sheet, references both lowercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ]
    });
    
    testSrc({
		desc: '17b. Same as 17a but sheet ref lowercase, collection ref uppercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ]
    });

    testSrc({
		desc: '17c. Same as 17a but sheet ref uppercase, collection ref lowercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ]
    });
    
    testSrc({
		desc: '17d. Same as 17a but references both uppercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ]
    });

});