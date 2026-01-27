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
        ],
        symbols: [
            "All",
            "multi1.All",
            "multi1.word",
            "multi1external.word",
            "multi1external.All",
        ],
    });

    // test 2 is identical to test 1 ?!?
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
            Error(1, 1, "Undefined symbol: 'multi1external'")
        ]
    });
    
    testSrc({
		desc: '4. Multi-sheet project with a "bare" reference to "bare" grammar',
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ],
        symbols: [
            "All",
            "multi4.All",
            "multi4.word",
            "multi4external.Default",
            "multi4external.All",
        ],
    });

    testSrc({
		desc: '5. Multi-sheet project with missing symbol in imported sheet',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1, 1, "Undefined symbol: 'multi5external.prefix'")
        ],
        symbols: [
            "All",
            "multi5.All",
            "multi5.word",
            "multi5external.word",
            "multi5external.All",
        ],
    });
    
    testSrc({
		desc: '6. Multi-sheet with reserved word reference',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1, 1, "Error parsing cell: 'optional.word'")
        ],
        symbols: [
            "All",
            "multi6.All",
            "multi6.word",
        ],
    });

    testSrc({
		desc: '7. Multi-sheet project referencing non-existent sheet',
        results: [
            {text: "able"}
        ],
        errors: [
            Error(1, 1, "Undefined symbol: 'nonexistantGrammar.word'")
        ],
        symbols: [
            "All",
            "multi7.All",
            "multi7.word",
        ],
    });

    testSrc({
		desc: '8. Multi-sheet project where the imported sheet references the original',
        results: [
            {text: "foobarable", gloss: "run-1SG"},
            {text: "moobarable", gloss: "jump-1SG"},
            {text: "foobazable", gloss: "run-2SG"},
            {text: "moobazable", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "multi8.All",
            "multi8.verb",
            "multi8.word",
            "multi8external.suffix",
            "multi8external.word",
            "multi8external.All",
        ],
    });

    testSrc({
		desc: '9. Multi-sheet project with a reference to a collection in an external document',
        results: [
            {text: "foobarable", gloss: "run-1SG"},
            {text: "moobarable", gloss: "jump-1SG"},
            {text: "foobazable", gloss: "run-2SG"},
            {text: "moobazable", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "multi9.All",
            "multi9.word",
            "multi9external.x.verb",
            "multi9external.x.suffix",
            "multi9external.x.word",
            "multi9external.x.All",
            "multi9external.All",
        ],
    });

    testSrc({
		desc: '10. Multi-sheet project with an all reference to a collection in an external document',
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ],
        symbols: [
            "All",
            "multi10.All",
            "multi10.word",
            "multi10external.x.verb",
            "multi10external.x.noun",
            "multi10external.x.All",
            "multi10external.All",
        ],
    });
    
    testSrc({
		desc: '11. Multi-sheet project with the external reference in a collection',
        symbol: "x.word",
        results: [
            {text: "fooable", gloss: "run"},
            {text: "mooable", gloss: "jump"},
        ],
        symbols: [
            "All",
            "multi11.All",
            "multi11.x.word",
            "multi11.x.All",
            "multi1external.word",
            "multi1external.All",
        ],
    });

    testSrc({
		desc: '12. Reference to an external document, shadowed by a local assignment',
        results: [
            {text: "zooable"},
        ],
        symbols: [
            "All",
            "multi12.All",
            "multi12.word",
            "multi12.multi12external",
        ],
    });

    testSrc({
		desc: '13. External reference in a collection, shadowed by a local assignment',
        symbol: "x.word",
        results: [
            {text: "zooable"},
        ],
        symbols: [
            "All",
            "multi13.All",
            "multi13.x.word",
            "multi13.x.All",
            "multi13.multi13external",
        ],
    });
    
    testSrc({
		desc: '14. Collection with the same name as an external sheet',
        symbol: "word",
        results: [
            {text: "zoo"},
        ],
        symbols: [
            "All",
            "multi14.All",
            "multi14.word",
            "multi14.multi14external.word",
            "multi14.multi14external.All",
        ],
    });
    
    testSrc({
		desc: '15. Collection with the same name as an external sheet, with a reference to it inside',
        symbol: "multi15external.w1",
        results: [
            {text: "zoo"},
        ],
        symbols: [
            "All",
            "multi15.All",
            "multi15.multi15external.w1",
            "multi15.multi15external.w2",
            "multi15.multi15external.All",
        ],
    });

    testSrc({
		desc: '16. Two references to the same sheet with different casing',
        symbol: "result",
        results: [
            {text: "foo"},
        ],
        symbols: [
            "All",
            "multi16.All",
            "multi16.result",
            "multi16external.w3",
            "multi16external.All",
        ],
    });
    
    testSrc({
		desc: '17a. Collection with the same name as an external sheet, references both lowercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ],
        symbols: [
            "All",
            "multi17a.All",
            "multi17a.PREF_TENSE_PREV",
            "multi17a.multi17external.w1",
            "multi17a.multi17external.All",
            "multi17a.RESULT",
            "multi17external.w3",
            "multi17external.All",
        ],
    });
    
    testSrc({
		desc: '17b. Same as 17a but sheet ref lowercase, collection ref uppercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ],
        symbols: [
            "All",
            "multi17b.All",
            "multi17b.PREF_TENSE_PREV",
            "multi17b.multi17external.w1",
            "multi17b.multi17external.All",
            "multi17b.RESULT",
            "multi17external.w3",
            "multi17external.All",
        ],
    });

    testSrc({
		desc: '17c. Same as 17a but sheet ref uppercase, collection ref lowercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ],
        symbols: [
            "All",
            "multi17c.All",
            "multi17c.PREF_TENSE_PREV",
            "multi17c.multi17external.w1",
            "multi17c.multi17external.All",
            "multi17c.RESULT",
            "multi17external.w3",
            "multi17external.All",
        ],
    });
    
    testSrc({
		desc: '17d. Same as 17a but references both uppercase',
        symbol: "result",
        results: [
            {text: "fooable"},
        ],
        symbols: [
            "All",
            "multi17d.All",
            "multi17d.PREF_TENSE_PREV",
            "multi17d.multi17external.w1",
            "multi17d.multi17external.All",
            "multi17d.RESULT",
            "multi17external.w3",
            "multi17external.All",
        ],
    });

});
