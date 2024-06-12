import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil";

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
});


