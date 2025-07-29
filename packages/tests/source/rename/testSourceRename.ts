import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil.js";

const DIR = "rename";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Rename header',
        results: [
            {text: "foo", gloss: "run" }
        ]
    });

    testSrc({
		desc: '2. Renaming an irrelevant header',
        errors: [
            Error(1, 4, "Renaming missing from header 'class'")
        ],
        results: [
            {text: "foo", gloss: "run" }
        ]
    });

    testSrc({
		desc: '3. Rename header with embeds',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]", class: "v" },
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]", class: "v" },
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]", class: "v" },
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]", class: "v" },
            {text: "foo", gloss: "run[3SG]", subj: "[3SG]", class: "v" },
            {text: "moo", gloss: "jump[3SG]", subj: "[3SG]", class: "v" }
        ]
    });

    testSrc({
		desc: '4. Renaming to a name that already exists',
        results: [
            {pos: "v", text: "moo", gloss: "jump[3SG]", subj:"[3SG]"},
            {pos: "v", text: "foo", gloss: "run[3SG]", subj:"[3SG]"},
            {pos: "v", text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {pos: "v", text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {pos: "v", text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {pos: "v", text: "foobar", gloss: "run[1SG]", subj: "[1SG]"}
        ],
        errors: [
            Error(10, 3, "Destination header 'gloss' already exists")
        ]
    });

    testSrc({
		desc: '5. Renaming to an invalid header name',        
        errors: [ 
            Error(0, 3, "Invalid header: '$text'"),
            Warning(1,3)
        ],
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });

    testSrc({
		desc: '6. Renaming from an invalid symbol',        
        errors: [ 
            Error(1, 3, "Invalid header name: '$verb'") 
        ],
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });

    testSrc({
		desc: '7. Renaming from two fields',        
        errors: [ 
            Error(4, 2, "Renaming multiple headers error") 
        ],
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });

    testSrc({
		desc: '8a. Renaming from two fields, the first of which is invalid',        
        errors: [ 
            Error(4, 2, "Invalid header name: '$verb'") 
        ],
        results: [
            {verb: "foo", text: "run" }
        ]
    });

    testSrc({
		desc: '8b. Renaming from two fields, the second of which is invalid',        
        errors: [ 
            Error(4, 2, "Invalid header name: '$gloss'") 
        ],
        results: [
            {text: "foo", gloss: "run" }
        ]
    });


    testSrc({
		desc: '9a. Renaming with an extraneous slash before',        
        errors: [ 
            Error(4, 2, "Error parsing cell: '/verb'") 
        ],
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });
    
    testSrc({
		desc: '9b. Renaming with an extraneous slash after',        
        errors: [ 
            Error(4, 2, "Error parsing cell: 'verb/'") 
        ],
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });
    
    testSrc({
		desc: '9c. Renaming with an extraneous slash between',        
        errors: [ 
            Error(4, 2, "Error parsing cell: 'verb//gloss'") 
        ],
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });

    testSrc({
		desc: '10. Empty header name under rename',       
        results: [
            {verb: "foo", gloss: "run" }
        ]
    });
});
