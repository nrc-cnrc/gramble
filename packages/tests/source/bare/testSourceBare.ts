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
		desc: '2c. Bare grammar shifted by one column',
        symbol: "",
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"}
        ],
        symbols: [
            "All",
            "bare2c.All",
            "bare2c.Default",
        ],
    });

    testSrc({
		desc: '3a. Bare grammar with embeds',
        errors: [
            Warning(8, 0, "Assigning temporary symbol name: '$Auto9'")
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
            Warning(8, 0, "Assigning temporary symbol name: '$Auto9'")
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
		desc: '4a. Generating from symbol before bare grammar',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare4a.All",
            "bare4a.word",
            "bare4a.$Auto5",
        ],
    });

    testSrc({
		desc: '4b. Generating from bare grammar before a symbol assignment',
        symbol: "",
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"},
            {text: "word=", gloss: "table:"},
            {},
        ],
        errors: [
            Warning(4, 2, "No valid header above"),
            Warning(4, 3, "No valid header above"),
            Warning(5, 2, "No valid header above"),
            Warning(5, 3, "No valid header above"),
            Warning(6, 2, "No valid header above"),
            Warning(6, 3, "No valid header above"),
        ],
        symbols: [
            "All",
            "bare4b.All",
            "bare4b.Default",
        ],
    });

    testSrc({
		desc: '4c. Generating from bare grammar between 2 symbols',
        symbol: "$Auto5",
        results: [
            {text: "bar", gloss: "-1SG"},
            {text: "baz", gloss: "-2SG"},
            {text: "word=", gloss: "table:"},
            {},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Warning(8, 2, "No valid header above"),
            Warning(8, 3, "No valid header above"),
            Warning(9, 2, "No valid header above"),
            Warning(9, 3, "No valid header above"),
            Warning(10, 2, "No valid header above"),
            Warning(10, 3, "No valid header above"),
        ],
        symbols: [
            "All",
            "bare4c.All",
            "bare4c.suffix",
            "bare4c.$Auto5",
        ],
    });

    testSrc({
		desc: '4d. Generating from symbol before bare grammar between 2 symbols',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Warning(8, 2, "No valid header above"),
            Warning(8, 3, "No valid header above"),
            Warning(9, 2, "No valid header above"),
            Warning(9, 3, "No valid header above"),
            Warning(10, 2, "No valid header above"),
            Warning(10, 3, "No valid header above"),
        ],
        symbols: [
            "All",
            "bare4d.All",
            "bare4d.word",
            "bare4d.$Auto5",
        ],
    });

    testSrc({
		desc: '4e. Generating from symbol after bare grammar shifted by 1 column',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(0, 1, "Assigning temporary symbol name: '$Auto1'"),
            Warning(4, 0, "'word=' is in an unexpected column"),
        ],
        symbols: [
            "All",
            "bare4e.All",
            "bare4e.word",
            "bare4e.$Auto1",
        ],
    });

    testSrc({
		desc: '5. Content obliteration by bare table',
        errors: [
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'")
        ],
        symbols: [
            "All",
            "bare5.All",
            "bare5.$Auto1",
            "bare5.$Auto5",
        ],
    });

    testSrc({
		desc: '6. Bare grammar with just an invalid header',
        errors: [
            Error(0, 0, "Invalid header: 'X%%'"),
            Error(0, 0, "Missing ordinary header for implied 'table'"),
            Warning(0, 0, "No valid header cells found"),
        ],
        symbols: [
            "All",
            "bare6.All",
            "bare6.Default",
        ],
    });

});
