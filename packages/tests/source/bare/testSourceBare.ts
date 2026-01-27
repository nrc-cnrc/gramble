import {
    testSource, SourceTest,
    Error, Warning
} from "../testSourceUtil.js";

const DIR = "bare";

function testSrc(params: Partial<SourceTest>): void {
    testSource({dir: DIR, ...params});
}

describe(`Source ${DIR}`, function() {

    testSrc({
		desc: '1. Empty grammar',
        results: undefined,
        symbols: [
            "All",
            "bare1.All",
        ],
    });

    testSrc({
		desc: '2a. Bare grammar',
        symbol: "",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        symbols: [
            "All",
            "bare2a.All",
            "bare2a.Default",
        ],
    });

    testSrc({
		desc: '2b. Bare grammar with table op',
        symbol: "",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        symbols: [
            "All",
            "bare2b.All",
            "bare2b.Default",
        ],
    });

    testSrc({
		desc: '3a. Bare grammar with embeds',
        errors: [
            Warning(8,0)
        ],
        symbols: [
            "All",
            "bare3a.All",
            "bare3a.verb",
            "bare3a.suffix",
            "bare3a.$Auto9",
        ],
    });
    
    testSrc({
		desc: '3b. Bare grammar with embeds and table op',
        errors: [
            Warning(8,0)
        ],
        symbols: [
            "All",
            "bare3b.All",
            "bare3b.verb",
            "bare3b.suffix",
            "bare3b.$Auto9",
        ],
    });
    
    testSrc({
		desc: '4. Generating from symbol before bare grammar',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4,0)
        ],
        symbols: [
            "All",
            "bare4.All",
            "bare4.word",
            "bare4.$Auto5",
        ],
    });

    testSrc({
		desc: '5. Content obliteration by bare table',
        errors: [
            Warning(0,0),
            Warning(4,0)
        ],
        symbols: [
            "All",
            "bare5.All",
            "bare5.$Auto1",
            "bare5.$Auto5",
        ],
    });
});
