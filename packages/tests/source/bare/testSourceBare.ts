import {
    testSource, SourceTest,
    Error, Warning
} from "../testSourceUtil.js";
import { VERBOSE_DEBUG } from "../../../interpreter/src/utils/logging.js";

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
            Error(8, 0, "Unexpected bare header/content: 'embed'"),
            Warning(8, 1, "Unexpected bare header/content: 'embed'"),
            Error(9, 0, "Unexpected bare header/content: 'verb'"),
            Warning(9, 1, "Unexpected bare header/content: 'suffix'"),
        ],
        symbols: [
            "All",
            "bare3a.All",
            "bare3a.verb",
            "bare3a.suffix",
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
            Error(4, 0, "Unexpected bare header/content: 'text'"),
            Warning(4, 1, "Unexpected bare header/content: 'gloss'"),
            Error(5, 0, "Unexpected bare header/content: 'bar'"),
            Warning(5, 1, "Unexpected bare header/content: '-1SG'"),
            Error(6, 0, "Unexpected bare header/content: 'baz'"),
            Warning(6, 1, "Unexpected bare header/content: '-2SG'"),
        ],
        symbols: [
            "All",
            "bare4a.All",
            "bare4a.word",
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
		desc: '4c. Generating from symbol after bare grammar between 2 symbols',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Error(4, 0, "Unexpected bare header/content: 'text'"),
            Warning(4, 1, "Unexpected bare header/content: 'gloss'"),
            Error(5, 0, "Unexpected bare header/content: 'bar'"),
            Warning(5, 1, "Unexpected bare header/content: '-1SG'"),
            Error(6, 0, "Unexpected bare header/content: 'baz'"),
            Warning(6, 1, "Unexpected bare header/content: '-2SG'"),
        ],
        symbols: [
            "All",
            "bare4c.All",
            "bare4c.suffix",
            "bare4c.word",
        ],
    });

    testSrc({
		desc: '4d. Generating from symbol before bare grammar between 2 symbols',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Error(4, 0, "Unexpected bare header/content: 'text'"),
            Warning(4, 1, "Unexpected bare header/content: 'gloss'"),
            Error(5, 0, "Unexpected bare header/content: 'bar'"),
            Warning(5, 1, "Unexpected bare header/content: '-1SG'"),
            Error(6, 0, "Unexpected bare header/content: 'baz'"),
            Warning(6, 1, "Unexpected bare header/content: '-2SG'"),
        ],
        symbols: [
            "All",
            "bare4d.All",
            "bare4d.word",
            "bare4d.suffix",
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
            Warning(4, 0, "'word=' in an unexpected column"),
        ],
        symbols: [
            "All",
            "bare4e.All",
            "bare4e.word",
            "bare4e.$Auto1",
        ],
    });

    testSrc({
		desc: '5a. Generating from symbol before bare table',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare5a.All",
            "bare5a.word",
            "bare5a.$Auto5",
        ],
    });

    testSrc({
		desc: '5b. Generating from symbol after bare table',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
        ],
        symbols: [
            "All",
            "bare5b.All",
            "bare5b.$Auto1",
            "bare5b.word",
        ],
    });

    testSrc({
		desc: '5c. Generating from symbol after bare table between 2 symbols',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare5c.All",
            "bare5c.suffix",
            "bare5c.$Auto5",
            "bare5c.word",
        ],
    });

    testSrc({
		desc: '5d. Generating from symbol before bare table between 2 symbols',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare5d.All",
            "bare5d.word",
            "bare5d.$Auto5",
            "bare5d.suffix",
        ],
    });

    testSrc({
		desc: '5e. Generating from symbol after bare table shifted by 1 column',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Warning(0, 1, "Assigning temporary symbol name: '$Auto1'"),
            Warning(4, 0, "'word=' in an unexpected column"),
        ],
        symbols: [
            "All",
            "bare5e.All",
            "bare5e.$Auto1",
            "bare5e.word",
        ],
    });

    testSrc({
		desc: '6. Content obliteration by bare table',
        errors: [
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'")
        ],
        symbols: [
            "All",
            "bare6.All",
            "bare6.$Auto1",
            "bare6.$Auto5",
        ],
    });

    testSrc({
		desc: '7. Bare grammar with just an invalid header',
        errors: [
            Error(0, 0, "Invalid header: 'X%%'"),
            Error(0, 0, "Missing ordinary header for implied 'table'"),
            Warning(0, 0, "No valid header cells found"),
        ],
        symbols: [
            "All",
            "bare7.All",
            "bare7.Default",
        ],
    });

    testSrc({
		desc: '8a. Bare grammar between 2 symbols with variant 4th row',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Error(4, 0, "Unexpected bare header/content: 'text'"),
            Warning(4, 1, "Unexpected bare header/content: 'gloss'"),
            Error(5, 0, "Unexpected bare header/content: 'bar'"),
            Warning(5, 1, "Unexpected bare header/content: '-1SG'"),
            Error(6, 0, "Unexpected bare header/content: 'baz'"),
            Warning(6, 1, "Unexpected bare header/content: '-2SG'"),
            Warning(7, 1, "Unexpected bare header/content: '????'"),
            Warning(7, 2, "Unexpected bare header/content: 'xxx'"),
        ],
        symbols: [
            "All",
            "bare8a.All",
            "bare8a.word",
            "bare8a.suffix",
        ],
        // verbose: VERBOSE_DEBUG,
    });


    testSrc({
		desc: '8b. Bare grammar between 2 symbols that are shifted by 1 column',
        results: [
            {text: "foo", gloss: "run"},
            {text: "moo", gloss: "jump"},
        ],
        errors: [
            Error(4, 0, "Unexpected bare header/content: 'text'"),
            Warning(4, 1, "Unexpected bare header/content: 'gloss'"),
            Error(5, 0, "Unexpected bare header/content: 'bar'"),
            Warning(5, 1, "Unexpected bare header/content: '-1SG'"),
            Error(6, 0, "Unexpected bare header/content: 'baz'"),
            Warning(6, 1, "Unexpected bare header/content: '-2SG'"),
            Warning(8, 1, "Unexpected bare header/content: 'suffix='"),
            Warning(8, 2, "Unexpected bare header/content: 'table:'"),
            Warning(8, 3, "Unexpected bare header/content: 'text'"),
            Warning(8, 4, "Unexpected bare header/content: 'gloss'"),
            Warning(9, 3, "Unexpected bare header/content: 'bar'"),
            Warning(9, 4, "Unexpected bare header/content: '-1SG'"),
            Warning(10, 3, "Unexpected bare header/content: 'baz'"),
            Warning(10, 4, "Unexpected bare header/content: '-2SG'"),
        ],
        symbols: [
            "All",
            "bare8b.All",
            "bare8b.word",
        ],
        // verbose: VERBOSE_DEBUG,
    });

    testSrc({
        desc: '9a. Bare empty table op',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Error(0, 0, "'table' operator requires header(s)"),
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Warning(0, 0, "No content for symbol '$Auto1'"),
            Warning(0, 0, "No content for 'table' operator"),
            Error(7, 2, "Invalid symbol name: '$Auto1'"),
        ],
        symbols: [
            "All",
            "bare9a.All",
            "bare9a.$Auto1",
            "bare9a.suffix",
            "bare9a.word",
        ],
    });

    testSrc({
        desc: '9b. Bare empty table op followed by comment header',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Error(0, 0, "'table' operator requires header(s)"),
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Warning(0, 0, "No content for symbol '$Auto1'"),
            Warning(0, 0, "No content for 'table' operator"),
            Error(7, 2, "Invalid symbol name: '$Auto1'"),
        ],
        symbols: [
            "All",
            "bare9b.All",
            "bare9b.$Auto1",
            "bare9b.suffix",
            "bare9b.word",
        ],
    });

    testSrc({
        desc: '9c. Bare table op with empty text content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Warning(0, 1, "No content for header(s)"),
            Error(8, 2, "Invalid symbol name: '$Auto1'"),
        ],
        symbols: [
            "All",
            "bare9c.All",
            "bare9c.$Auto1",
            "bare9c.suffix",
            "bare9c.word",
        ],
    });

    testSrc({
        desc: '9d. Bare table op with empty text content & empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Warning(0, 1, "No content for header(s)"),
            Error(8, 2, "Invalid symbol name: '$Auto1'"),
        ],
        symbols: [
            "All",
            "bare9d.All",
            "bare9d.$Auto1",
            "bare9d.suffix",
            "bare9d.word",
        ],
    });

    testSrc({
        desc: '9e. Bare table op with empty text content & non-empty comment content',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(0, 0, "Assigning temporary symbol name: '$Auto1'"),
            Error(8, 2, "Invalid symbol name: '$Auto1'"),
        ],
        symbols: [
            "All",
            "bare9e.All",
            "bare9e.$Auto1",
            "bare9e.suffix",
            "bare9e.word",
        ],
    });

    testSrc({
        desc: '10a. Bare empty table op between 2 symbol assignments',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Error(4, 0, "'table' operator requires header(s)"),
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Warning(4, 0, "No content for symbol '$Auto5'"),
            Warning(4, 0, "No content for 'table' operator"),
            Error(7, 2, "Invalid symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare10a.All",
            "bare10a.suffix",
            "bare10a.$Auto5",
            "bare10a.word",
        ],
    });

    testSrc({
        desc: '10b. Bare empty table op followed by comment header, ' +
              'between 2 symbol assignments',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Error(4, 0, "'table' operator requires header(s)"),
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Warning(4, 0, "No content for symbol '$Auto5'"),
            Warning(4, 0, "No content for 'table' operator"),
            Error(7, 2, "Invalid symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare10b.All",
            "bare10b.suffix",
            "bare10b.$Auto5",
            "bare10b.word",
        ],
    });

    testSrc({
        desc: '10c. Bare table op with empty text content, ' +
              'between 2 symbol assignments',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Warning(4, 1, "No content for header(s)"),
            Error(8, 2, "Invalid symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare10c.All",
            "bare10c.suffix",
            "bare10c.$Auto5",
            "bare10c.word",
        ],
    });

    testSrc({
        desc: '10d. Bare table op with empty text content & empty comment content, ' +
              'between 2 symbol assignments',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Warning(4, 1, "No content for header(s)"),
            Error(8, 2, "Invalid symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare10d.All",
            "bare10d.suffix",
            "bare10d.$Auto5",
            "bare10d.word",
        ],
    });

    testSrc({
        desc: '10e. Bare table op with empty text content & non-empty comment content, ' +
              'between 2 symbol assignments',
        results: [
            {text:"bar", gloss:"-1SG"},
            {text:"baz", gloss:"-2SG"},
        ],
        errors: [
            Warning(4, 0, "Assigning temporary symbol name: '$Auto5'"),
            Error(8, 2, "Invalid symbol name: '$Auto5'"),
        ],
        symbols: [
            "All",
            "bare10e.All",
            "bare10e.suffix",
            "bare10e.$Auto5",
            "bare10e.word",
        ],
    });

});
