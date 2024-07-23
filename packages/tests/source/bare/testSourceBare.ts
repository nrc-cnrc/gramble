import {
    testSource, SourceTest,
    Error, Warning
} from "../testSourceUtil";

const DIR = "bare";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Empty grammar',
        results: undefined
    });

    testSrc({
		desc: '2a. Bare grammar',
        symbol: "",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '2b. Bare grammar with table op',
        symbol: "",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ]
    });

    testSrc({
		desc: '3a. Bare grammar with embeds',
        errors: [
            Warning(8,0)
        ]
    });
    
    testSrc({
		desc: '3b. Bare grammar with embeds and table op',
        errors: [
            Warning(8,0)
        ]
    });
    
    testSrc({
		desc: '4. Generating from symbol before bare grammar',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4,0)
        ]
    });

    testSrc({
		desc: '5. Content obliteration by bare table',
        errors: [
            Warning(0,0),
            Warning(4,0)
        ]
    });
});
