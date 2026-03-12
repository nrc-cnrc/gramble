import { VERBOSE_GRAMMAR, } from "../../../interpreter/src/utils/logging.js";

import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "op";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. or: operation',
        results: [
            {text: "umfoo", gloss: "[1SG]run"},
            {text: "ummoo", gloss: "[1SG]jump"},
            {text: "foobar", gloss: "run[2SG]"},
            {text: "moobar", gloss: "jump[2SG]"}
        ]
    });

    testSrc({
		desc: '2a. Grammar with embeds and a relevant join',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "1SG"},
            {text: "moobar", gloss: "jump[1SG]", subj: "1SG"},
        ]
    });

    testSrc({
		desc: '2b. Table op within a join',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "1SG"},
            {text: "moobar", gloss: "jump[1SG]", subj: "1SG"},
        ]
    });
    
    testSrc({
		desc: '2c. Grammar with embeds and a relevant join, under assignment',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "1SG"},
            {text: "moobar", gloss: "jump[1SG]", subj: "1SG"},
        ]
    });

    testSrc({
		desc: '2d. Grammar with embeds and a relevant join, under assignment 2',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "1SG"},
            {text: "moobar", gloss: "jump[1SG]", subj: "1SG"},
        ]
    });

    testSrc({
		desc: '3. Grammar with embeds and an irrelevant join',
        results: [
            {text: "foobar", gloss: "run[1SG]", lang: "foobese"},
            {text: "moobar", gloss: "jump[1SG]", lang: "foobese"},
            {text: "foobaz", gloss: "run[2SG]", lang: "foobese"},
            {text: "moobaz", gloss: "jump[2SG]", lang: "foobese"}
        ]
    });

    testSrc({
		desc: '4a. Nested joins',
        results: [
            {text: "foo", gloss: "sleep", statClass: "S", 
                class: "stative", transClass: "I", transitivity: "intransitive" },
            {text: "moo", gloss: "jump", statClass: "A", 
                class: "active", transClass: "I", transitivity: "intransitive" },
            {text: "goo", gloss: "love", statClass: "S", 
                class: "stative", transClass: "T", transitivity: "transitive" },
            {text: "zoo", gloss: "chase", statClass: "A", 
                class: "active", transClass: "T", transitivity: "transitive" },
        ],
    });

    testSrc({
		desc: '4b. Nested joins, with an or: in between',
        results: [
            {text: "foo", gloss: "sleep", statClass: "S", 
                class: "stative", transClass: "I", transitivity: "intransitive" },
            {text: "moo", gloss: "jump", statClass: "A", 
                class: "active", transClass: "I", transitivity: "intransitive" },
            {text: "goo", gloss: "love", statClass: "S", 
                class: "stative", transClass: "T", transitivity: "transitive" },
            {text: "zoo", gloss: "chase", statClass: "A", 
                class: "active", transClass: "T", transitivity: "transitive" },
            {text: "boo", gloss: "rain", statClass: "S", class: "stative" }
        ],
    });

    testSrc({
		desc: '5. A join with a table, which itself has a join',
        results: [
            {text: "foo", gloss: "sleep", transClass: "I", transitivity: "intransitive", class: "T" },
            {text: "moo", gloss: "jump", transClass: "I", transitivity: "intransitive", class: "T" },
        ],
    });
});
