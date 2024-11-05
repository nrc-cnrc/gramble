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
});
