import {VERBOSE_DEBUG, VERBOSE_GRAMMAR } from "../../../interpreter/src/utils/logging.js";
import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "replace";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Simple replace',
        results: [
            {text: "ava"}
        ]
    });

    testSrc({
		desc: '2. Trivial replace',
        results: [
            {text: "aba"}
        ]
    });

    testSrc({
		desc: '3. Simple replace multiple times',
        results: [
            {text: "avva"}
        ]
    });

    testSrc({
		desc: '4. Simple replace under assignment',
        results: [
            {text: "ava"}
        ]
    });
    
    testSrc({
		desc: '5. Replacing wrong header',
        results: [
            {text: "aba"}
        ],
        errors: [
            Error(3, 1, "Replacing on non-existent header: 'gloss'")
        ]
    });

    testSrc({
		desc: '6. Replace but the header is a reserved word',
        results: [
            {text: "aba"}
        ],
        errors: [
            Error(3, 1, "Invalid operator: 'replace test:'")
        ]
    });

    testSrc({
		desc: '7a. Simple replace with embed',
        results: [
            {text: "ava"}
        ]
    });
    
    testSrc({
		desc: '7b. Simple replace with two embed',
        results: [
            {text: "ava"}
        ]
    });

    testSrc({
		desc: '7c. Simple replace with two embed 2',
        results: [
            {text: "ava"}
        ]
    });


    testSrc({
		desc: '8a. Replacing, embedded',
        results: [
            {text: "ava"}
        ]
    });

    
    testSrc({
		desc: '8b. Replace cascade, embedded',
        results: [
            {text: "awa"}
        ]
    });

    testSrc({
		desc: '8c. Replacing an embedded replace',
        results: [
            {text: "awa"}
        ]
    });
    
    testSrc({
		desc: '8d. Cascading an embedded cascade',
        results: [
            {text: "ABCD"}
        ]
    });

    testSrc({
		desc: '9a. Nested replace',
        results: [
            {text: "w"}
        ]
    });
    
    testSrc({
		desc: '9b. Nested replace under assignment',
        results: [
            {text: "w"}
        ]
    });
    
    testSrc({
		desc: '9c. Nested replace with some unchanged letters',
        results: [
            {text: "awc"}
        ]
    });

    testSrc({
		desc: '9d. Nested replace 2',
        results: [
            {text: "ev"}
        ]
    });
    
    testSrc({
		desc: '10a. Replace cascade',
        results: [
            {text: "w"}
        ]
    });
    
    testSrc({
		desc: '10b. Replace cascade 2',
        results: [
            {text: "ev"}
        ]
    });

    testSrc({
		desc: '11a. Replace with pre context',
        results: [
            {text: "ava"},
            {text: "arba"}
        ]
    });

    testSrc({
		desc: '11b. Replace with post context',
        results: [
            {text: "ava"},
            {text: "abra"}
        ]
    });
    
    testSrc({
		desc: '11c. Replace with pre and post context',
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "arba"}
        ]
    });

    testSrc({
		desc: '12a. Replace with an empty-string context',
        results: [
            {text: "ava"},
            {text: "arva"}
        ]
    });
    
    testSrc({
		desc: '12b. Replace with an empty context',
        results: [
            {text: "ava"},
            {text: "arva"}
        ]
    });

    testSrc({
		desc: '13a. Replace with an alternation in pre context',
        results: [
            {text: "ava"},
            {text: "arba"},
            {text: "iva"}
        ]
    });

    testSrc({
		desc: '13b. Replace with an alternation in post context',
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "avi"}
        ]
    });

    
    testSrc({
		desc: '13c. Replace with an alternation in from',
        results: [
            {text: "ava"},
            {text: "ava"}
        ]
    });

    testSrc({
		desc: '13d. Replace with an alternation in to',
        results: [
            {text: "apa"},
            {text: "ava"}
        ]
    });
    
    testSrc({
		desc: '14. Replace with a repetition in to',
        results: [
            {text: "av*a"},
        ]
    });

    testSrc({
		desc: '15a. Replace with a repetition in pre context',
        results: [
            {text: "aba"},
            {text: "dava"},
            {text: "daava"},
        ]
    });

    testSrc({
		desc: '15b. Replace with a repetition in post context',
        results: [
            {text: "aba"},
            {text: "avad"},
            {text: "avaad"},
        ]
    });

    testSrc({
		desc: '15c. Replace with a repetition in from',
        results: [
            {"text":"ava"}, 
            {"text":"avva"},
            {"text":"ava"}, // ava occurs twice because there
                            // are two ways to generate it, from
                            // aba or from abba
            {"text":"aa"}
        ]
    });

    // word boundary-sensitive replace tests
    testSrc({
		desc: '16a. Replace at beginning',
        results: [
            {text: "a"},
            {text: "v"},
            {text: "ab"},
            {text: "va"},
            {text: "aba"}
        ]
    });

    testSrc({
		desc: '16b. Replace at end',
        results: [
            {text: "a"},
            {text: "v"},
            {text: "av"},
            {text: "ba"},
            {text: "aba"}
        ]
    });

    testSrc({
		desc: '16c. Replace at beginning and end',
        results: [
            {text: "a"},
            {text: "v"},
            {text: "ab"},
            {text: "ba"},
            {text: "aba"}
        ]
    });
    
    testSrc({
		desc: '17a. Replace with unnamed param',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 4, "Invalid ordinary header: 'surface'"),
            Warning(12,1)
        ]
    });

    testSrc({
		desc: '17b. Replace with invalid param',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 4, "Invalid 'unique' header: 'unique text'"),
            Warning(12,1)
        ]
    });

    testSrc({
		desc: '18a. Replace with no sibling',
        results: [
            {}
        ],
        errors: [
            Error(0, 1, "Missing content for 'replace text:'"),
            Warning(0,0)
        ],
    });
    
    testSrc({
		desc: '18b. Replace with no sibling bare',
        symbol: "",
        results: [
            {}
        ],
        errors: [
            Error(0, 0, "Missing content for 'replace text:'"),
            Warning(0,0)
        ],
    });

    testSrc({
		desc: '18c. Replace with no child',
        results: [
            {text: "aba"}
        ],
        errors: [
            Error(3, 1, "'replace' operator requires header(s)"),
            Warning(3,1)
        ]
    });

    testSrc({
		desc: '19a. Replace with missing "from" param',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 1, "Missing 'from' header for 'replace'")
        ]
    });

    testSrc({
		desc: '19b. Replace with missing "to" param',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 1, "Missing 'to' header for 'replace'")
        ]
    });

    testSrc({
		desc: '20a. Replace with an empty to',
        results: [
            {text: "aa"}
        ]
    });

    testSrc({
		desc: '20b. Shortening replace',
        results: [
            {text: "aba"}
        ]
    });

    testSrc({
		desc: '20c. Shortening replace long',
        results: [
            {text: "aba"}
        ]
    });

    testSrc({
		desc: '20d. Shortening replace empty to',
        results: [
            {text: "aa"}
        ]
    });

    testSrc({
		desc: '21a. Replace with an empty from',
        results: [
            {text: "cacbcac"}
        ]
    });

    testSrc({
		desc: '21b. Replace with an empty from, with pre and post',
        results: [
            {text: "abca"},
        ]
    });

    testSrc({
		desc: '21c. Replace with an empty from, with pre',
        results: [
            {text: "abca"},
        ]
    });

    testSrc({
		desc: '21d. Replace with an empty from, with post',
        results: [
            {text: "cabca"}
        ]
    });
    
    testSrc({
		desc: '21e. Replace with an empty from, begins',
        results: [
            {text: "caba"}
        ]
    });

    testSrc({
		desc: '21f. Replace with an empty from, ends',
        results: [
            {text: "abac"}
        ],
    });

    testSrc({
		desc: '22. Replace cascade with an empty to',
        results: [
            {text: "BC"}
        ]
    });

    testSrc({
		desc: '23a. Replace with a symbol in regex in from',
        results: [
            {text: "ava"},
            {text: "ava"}
        ]
    });

    testSrc({
		desc: '23b. Replace with a symbol in regex in from, but the symbol is defined after',
        results: [
            {text: "ava"},
            {text: "ava"}
        ]
    });
    
    testSrc({
		desc: '23c. Replace with a symbol in regex in pre',
        results: [
            {text: "ava"},
            {text: "arba"},
            {text: "iva"}
        ]
    });

    testSrc({
		desc: '23d. Replace with a symbol in regex in pre, but the symbol is defined after',
        results: [
            {text: "ava"},
            {text: "arba"},
            {text: "iva"}
        ]
    });
    
    testSrc({
		desc: '23e. Replace with a symbol in regex in post',
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "avi"}
        ]
    });

    testSrc({
		desc: '23f. Replace with a symbol in regex in post, but the symbol is defined after',
        results: [
            {text: "ava"},
            {text: "abra"},
            {text: "avi"}
        ]
    });
    
    testSrc({
		desc: '24a. Replace with a multi-field symbol in regex in from',
        results: [
            {text: "abi"},
            {text: "abra"},
            {text: "aba"}
        ],
        errors: [
            Error(10, 2, "Embedding multi-field symbol in regex/rule"),
            Error(9, 1, "Non-single-header rule"),
            Warning(9,1)
        ],
    });

    testSrc({
		desc: '24b. Replace with a multi-field symbol in regex in context',
        results: [
            {text: "ava"},
            {text: "avra"},
            {text: "avi"}
        ],
        errors: [
            Error(10, 4, "Embedding multi-field symbol in regex/rule")
        ]
    });
    
    testSrc({
		desc: '24c. Replace with multiple /-separated names in  operator',
        results: [
            {text: "abi", text2: "ABI"},
            {text: "abra", text2: "ABRA"},
            {text: "aba", text2: "ABA"}
        ],
        errors: [
            Error(9, 1, "Invalid operator: 'replace text/text2:'"),
        ]
    });

    testSrc({
		desc: '25a. Replace with a table: op nested underneath',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 1, "'replace' operator requires header(s), not 'table:'")
        ]
    });
    
    testSrc({
		desc: '25b. Replace with a test: op nested underneath',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 1, "'replace' operator requires header(s)"),
            Warning(12,1),
            Error(12, 2, "Missing content for 'test:'"),
        ]
    });
    
    testSrc({
		desc: '25c. Replace with no operands',
        results: [
            {text: "foo", gloss: "run.3SG"},
            {text: "foobaz", gloss: "run-2SG"},
            {text: "foobar", gloss: "run-1SG"},
            {text: "moo", gloss: "jump.3SG"},
            {text: "moobaz", gloss: "jump-2SG"},
            {text: "moobar", gloss: "jump-1SG"}
        ],
        errors: [
            Error(12, 1, "'replace' operator requires header(s)"),
            Warning(12,1)
        ]
    });

    testSrc({
		desc: '26a. Filtering a deletion at beginning of word',
        results: [
            {text: "bc"}
        ]
    });

    testSrc({
		desc: '26b. Filtering a deletion at middle of word',
        results: [
            {text: "ac"}
        ]
    });

    testSrc({
		desc: '26c. Filtering a deletion at end of word',
        results: [
            {text: "ab"}
        ]
    });
    
    testSrc({
		desc: '27a. Joining a deletion at beginning of word',
        results: [
            {text: "bc"}
        ]
    });

    testSrc({
		desc: '27b. Joining a deletion at middle of word',
        results: [
            {text: "ac"}
        ]
    });

    testSrc({
		desc: '27c. Joining a deletion at end of word',
        results: [
            {text: "ab"}
        ]
    });

    testSrc({
		desc: '28a. Joining a deletion at beginning of word, other direction',
        results: [
            {text: "bc"}
        ],
    });
    
    testSrc({
		desc: '28b. Joining a deletion at middle of word, other direction',
        results: [
            {text: "ac"}
        ],
    });
    
    testSrc({
		desc: '28c. Joining a deletion at end of word, other direction',
        results: [
            {text: "ab"}
        ],
    });

    testSrc({
		desc: '29a. Single-char negation in post-context',
        results: [
            {text: "abXcad"}
        ],
    });
    
    testSrc({
		desc: '29b. Single-char negation in pre-context',
        results: [
            {text: "bacXda"}
        ],
    });

    testSrc({
		desc: '30a. Single-char negation (using ^) in post-context',
        results: [
            {text: "abXcad"}
        ],
    });
    
    testSrc({
		desc: '30b. Single-char negation (using ^) in pre-context',
        results: [
            {text: "bacXda"}
        ],
    });


    testSrc({
		desc: '31. Negation in post-context',
        results: [
            {text: "XbXcXd"},
            {text: "XbXcad"},
            {text: "XbacXd"},
            {text: "Xbacad"},
        ],
    });

    testSrc({
		desc: '32. Negation in post-context',
        results: [
            {text: "bacXdX"},
            {text: "bacadX"},
        ],
    });

    testSrc({
		desc: '33a. Embedding a symbol with a replacement rule, with a literal in the context',
        results: [
            {text: "abX"}
        ]
    });
    
    testSrc({
		desc: '33b. Embedding a symbol with a replacement rule, with a symbol in the context',
        results: [
            {text: "abX"}
        ]
    });

    testSrc({
		desc: '34a. Embedding a symbol with a replacement rule, with a literal in from',
        results: [
            {text: "abX"}
        ]
    });

    testSrc({
		desc: '34b. Embedding a symbol with a replacement rule, with a symbol in from',
        results: [
            {text: "abX"}
        ]
    });

    testSrc({
		desc: '34c. Symbol with a replacement rule, with a symbol in from',
        results: [
            {text: "abX"}
        ]
    });

    testSrc({
		desc: '35a. Embedding a symbol with a replacement rule, with two literals in from',
        results: [
            {text: "abX"}
        ]
    });

    testSrc({
		desc: '35b. Embedding a symbol with a replacement rule, with a symbol and literal in from',
        results: [
            {text: "abX"}
        ]
    });

    testSrc({
		desc: '36a. Embedding a symbol with a replacement rule 2',
        results: [
            {text: "aXc"}
        ]
    });
    
    testSrc({
		desc: '36b. Embedding a symbol with a replacement rule 2, with a symbol in the context',
        results: [
            {text: "aXc"}
        ]
    });
});
