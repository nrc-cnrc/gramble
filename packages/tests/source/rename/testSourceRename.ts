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
		desc: '2. Renaming an irrelevant tape',
        errors: [ Error(1,4) ],
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
            Error(10,3)
        ]
    });
});
