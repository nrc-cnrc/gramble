import {
    testSource, SourceTest, 
    Error, Warning 
} from "../testSourceUtil";

const DIR = "hide";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Hide header',
        results: [
            {text: "foo"}
        ]
    });
    
    testSrc({
		desc: '2. Hiding an irrelevant tape',
        results: [
            {text: "foo", gloss: "run"}
        ],
        errors: [
            Error(1,4)
        ]
    });
    
    testSrc({
		desc: '3. Hide header with embeds',
        results: [
            {text: "foobar", gloss: "run[1SG]", subj: "[1SG]"},
            {text: "moobar", gloss: "jump[1SG]", subj: "[1SG]"},
            {text: "foobaz", gloss: "run[2SG]", subj: "[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]", subj: "[2SG]"},
            {text: "foo", gloss: "run[3SG]", subj: "[3SG]"},
            {text: "moo", gloss: "jump[3SG]", subj: "[3SG]"}
        ]
    });

    testSrc({
		desc: '4. Two hide headers',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });
    
    testSrc({
		desc: '5. Nested hide headers',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });

    testSrc({
		desc: '6. Hide header with a slash value',
        results: [
            {text: "foobar", gloss: "run[1SG]"},
            {text: "moobar", gloss: "jump[1SG]"},
            {text: "foobaz", gloss: "run[2SG]"},
            {text: "moobaz", gloss: "jump[2SG]"},
            {text: "foo", gloss: "run[3SG]"},
            {text: "moo", gloss: "jump[3SG]"}
        ]
    });
});
