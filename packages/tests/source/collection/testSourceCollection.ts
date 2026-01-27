import {VERBOSE_DEBUG } from "../../../interpreter/src/utils/logging.js";
import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

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
        ],
        symbols: [
            "All",
            "collection1a.All",
            "collection1a.x.verb",
            "collection1a.x.All",
            "collection1a.suffix",
            "collection1a.word",
        ],
        // verbose: VERBOSE_DEBUG
    });
    
    testSrc({
		desc: '1b. Collection containing one assignment, referencing all',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
    });

    testSrc({
		desc: '2a. Collection containing one assignment, generating from symbol inside',
        symbol: "word.verb",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        symbols: [
            "All",
            "collection2a.All",
            "collection2a.word.verb",
            "collection2a.word.All",
        ],
    });
    
    testSrc({
		desc: '2b. Collection containing one assignment, generating from all',
        symbol: "word.all",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
    });

    testSrc({
		desc: '3. Collection containing two assignments',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "collection3.All",
            "collection3.word",
            "collection3.x.verb",
            "collection3.x.suffix",
            "collection3.x.All",
        ],
    });

    testSrc({
		desc: '4. Two-assignment sheet, generating from all',
        symbol: "all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ],
        symbols: [
            "All",
            "collection4.All",
            "collection4.verb",
            "collection4.noun",
        ],
    });
    
    testSrc({
		desc: '5. Collection with auto default',
        symbol: "x.all",
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ],
        symbols: [
            "All",
            "collection5.All",
            "collection5.x.verb",
            "collection5.x.noun",
            "collection5.x.All",
        ],
    });
    
    testSrc({
		desc: '6a. Nested all',
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"},
            {"text":"moo","gloss":"jump"},
            {"text":"foo","gloss":"run"}
        ],
        symbols: [
            "All",
            "collection6a.All",
            "collection6a.word",
            "collection6a.x.verb",
            "collection6a.x.noun.nclass1",
            "collection6a.x.noun.nclass2",
            "collection6a.x.noun.All",
            "collection6a.x.All",
        ],
    });
    
    testSrc({
		desc: '6b. Reference to .all.all',
        results: [
            {}
        ],
        errors: [
            Error(11, 1, "Undefined symbol: 'x.all.all'")
        ],
        symbols: [
            "All",
            "collection6b.All",
            "collection6b.word",
            "collection6b.x.verb",
            "collection6b.x.noun.nclass1",
            "collection6b.x.noun.nclass2",
            "collection6b.x.noun.All",
            "collection6b.x.All",
        ],
    });

    testSrc({
		desc: '7a. Explicit all',
        results: [
            {"text":"boo","gloss":"fire"},
            {"text":"goo","gloss":"water"}
        ],
        symbols: [
            "All",
            "collection7a.All",
            "collection7a.word",
            "collection7a.x.verb",
            "collection7a.x.all",
        ],
    });

    testSrc({
		desc: '7b. Explicit all, generating from x.all',
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
        ],
        symbols: [
            "All",
            "collection8a.All",
            "collection8a.word",
            "collection8a.x.verb",
            "collection8a.x.nclass1",
            "collection8a.x.all",
        ],
    });

    // test 8b is identical to test 8a ?!?
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
            Error(9, 2, "Undefined symbol: 'y.verb'")
        ],
        symbols: [
            "All",
            "collection9a.All",
            "collection9a.word",
            "collection9a.x.verb",
            "collection9a.x.All",
            "collection9a.suffix",
        ],
    });

    testSrc({
		desc: '9b. Reference to a non-existent symbol within a collection',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Error(9, 2, "Undefined symbol: 'x.noun'")
        ],
    });
    
    testSrc({
		desc: '9c. Symbol reference without collection prefix',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Error(9, 2, "Undefined symbol: 'verb'")
        ]
    });

    
    testSrc({
		desc: '10a. Collection with embeds referring outside of it',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "collection10a.All",
            "collection10a.word",
            "collection10a.verb",
            "collection10a.suffix",
            "collection10a.x.stem",
            "collection10a.x.All",
        ],
    });

    testSrc({
		desc: '10b. Collection with embeds referring into a sibling collection',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "collection10b.All",
            "collection10b.word",
            "collection10b.x.verb",
            "collection10b.x.suffix",
            "collection10b.x.All",
            "collection10b.y.stem",
            "collection10b.y.All",
        ],
    });

    testSrc({
		desc: '10c. Collection with embeds referring to symbols in itself',
        symbol: "word.x",
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "collection10c.All",
            "collection10c.word.verb",
            "collection10c.word.suffix",
            "collection10c.word.x",
            "collection10c.word.All",
        ],
    });

    testSrc({
		desc: '11a. Unnamed collection as first child',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Warning(0,0)
        ],
        symbols: [
            "All",
            "collection11a.All",
            "collection11a.$Auto1.verb",
            "collection11a.$Auto1.All",
            "collection11a.suffix",
            "collection11a.word",
        ],
    });

    testSrc({
		desc: '11b. Unnamed collection as second child',
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"}
        ],
        errors: [
            Warning(4,0)
        ],
        symbols: [
            "All",
            "collection11b.All",
            "collection11b.suffix",
            "collection11b.$Auto5.verb",
            "collection11b.$Auto5.All",
            "collection11b.word",
        ],
    });

    testSrc({
		desc: '11c. Unnamed collection as last child',
        results: undefined,
        errors: [
            Warning(8,0)
        ],
        symbols: [
            "All",
            "collection11c.All",
            "collection11c.verb",
            "collection11c.suffix",
            "collection11c.$Auto9.word",
            "collection11c.$Auto9.All",
        ],
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
            Error(11, 2, "Wayward collection, operand of 'or'")
        ],
        symbols: [
            "All",
            "collection12a.All",
            "collection12a.verb",
            "collection12a.suffix",
            "collection12a.word",
        ],
        // verbose: VERBOSE_DEBUG,
    });

    // Note tests 12b and 12c should be equivalent, but we get different errors.
    // 12b uses collection:, while 12c uses table: collection:

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
            Error(8, 1, "Wayward collection, operand of 'or'")
        ],
        symbols: [
            "All",
            "collection12b.All",
            "collection12b.verb",
            "collection12b.suffix",
            "collection12b.word",
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '12c. Op with table:collection as a sibling?',
        results: [
            {},
        ],
        errors: [
            Warning(8,0),   // This symbol will not contain any content.
            Error(8, 1, "'table' operator requires header(s), not 'collection:'"),
            Error(11, 1, "Missing content for 'or:'"),
        ],
        symbols: [
            "All",
            "collection12c.All",
            "collection12c.verb",
            "collection12c.suffix",
            "collection12c.word",
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
		desc: '13a. Importing .all from external file',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "collection13a.All",
            "collection13a.word",
            "importedGrammar.Verb",
            "importedGrammar.Suffix",
            "importedGrammar.Word",
            "importedGrammar.All",
        ],
    });

    testSrc({
		desc: '13b. Importing .all from external file with explicit all',
        results: [
            {text: "foobar", gloss: "run-1SG"},
            {text: "moobar", gloss: "jump-1SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "moobaz", gloss: "jump-2SG"}
        ],
        symbols: [
            "All",
            "collection13b.All",
            "collection13b.word",
            "importedGrammar2.Verb",
            "importedGrammar2.Suffix",
            "importedGrammar2.All",
        ],
    });
});
