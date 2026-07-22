import {
    logDebug,
    SILENT,
    VERBOSE_DEBUG
} from "../../interpreter/src/utils/logging.js";

import {
    cliTestSuiteName,
    testCLI,
} from "./testCLIUtil.js";

import {
    logTestSuite, textFromFile, VERBOSE_TEST_L2, 
} from '../testUtil.js';

// File level control over verbose output
const VERBOSE = VERBOSE_TEST_L2;

const GRAMBLE_HOME = "../..";
const GRAMBLE_EXAMPLES = GRAMBLE_HOME + "/examples";

const module = import.meta;

describe(`${cliTestSuiteName(module)}`, function() {

    logTestSuite(this.title);

    testCLI({
        desc: '0. test command execution: ls cli/txts',
        command: "ls cli/txts",
        results: [
            "1-err.txt",
            "2-err.txt",
            "h1.txt",
            "h2.txt",
            "h3.txt",
            "h4.txt",
            "h5-err.txt",
            "h7.txt",
            "h8.txt",
        ],
    });

    testCLI({
        desc: '1. test: gramble',
        command: "gramble",
        results: [
        ],
        errors: textFromFile("cli/txts/1-err.txt"),
    });

    testCLI({
        desc: '2a. test XXX: gramble XXX',
        command: "gramble XXX",
        results: [],
        errors: textFromFile("cli/txts/2-err.txt"),
    });

    testCLI({
        desc: '2b. test XXX: gramble XXX --badopt xxx',
        command: "gramble XXX --badopt xxx",
        results: [],
        errors: textFromFile("cli/txts/2-err.txt"),
    });

    // testing gramble help

    testCLI({
        desc: 'h1. test help: gramble help',
        command: "gramble help",
        results: [],
        errors: textFromFile("cli/txts/h1.txt"),
    });

    testCLI({
        desc: 'h2. test help: gramble help help',
        command: "gramble help help",
        results: [],
        errors: textFromFile("cli/txts/h2.txt"),
    });

    testCLI({
        desc: 'h3. test help: gramble help generate',
        command: "gramble help generate",
        results: [],
        errors: textFromFile("cli/txts/h3.txt"),
    });

    testCLI({
        desc: 'h4. test help: gramble help sample',
        command: "gramble help sample",
        results: [],
        errors: textFromFile("cli/txts/h4.txt"),
    });

    testCLI({
        desc: 'h5. test help: gramble help XXX',
        command: "gramble help XXX",
        results: [],
        errors: textFromFile("cli/txts/h5-err.txt"),
    });

    testCLI({
        desc: 'h6. test help: gramble help --badopt',
        command: "gramble help --badopt",
        results: [],
        errors: [
            "gramble: Error: Error in help command:",
            "Unknown option: --badopt",
            "For usage info, try: gramble help help",
        ],
    });

    testCLI({
        desc: 'h7. test help: gramble help list',
        command: "gramble help list",
        results: [],
        errors: textFromFile("cli/txts/h7.txt"),
    });

    testCLI({
        desc: 'h8. test help: gramble help test',
        command: "gramble help test",
        results: [],
        errors: textFromFile("cli/txts/h8.txt"),
    });

    // testing gramble generate

    testCLI({
        desc: 'g1. test: gramble generate',
        command: "gramble generate",
        results: [],
        errors: [
            "gramble: Error: Must specify a filename"
        ],
    });

    testCLI({
        desc: 'g2a. test generate: gramble generate examples/helloworld.csv',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g2b. test generate: gramble generate examples/none.csv',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/none.csv`,
        results: [],
        errors: [
            `gramble: Error: Cannot find file '${GRAMBLE_EXAMPLES}/none.csv'`,
        ],
    });


    testCLI({
        desc: 'g3a. test generate: gramble generate examples/helloworld.csv -m 3',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -m 3`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
        ],
    });

    testCLI({
        desc: 'g3b. test generate: gramble generate examples/helloworld.csv -m 10',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -m 10`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g3c. test generate: gramble generate examples/helloworld.csv -m 0',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -m 0`,
        results: [
            'text',
        ],
    });

    testCLI({
        desc: 'g3d. test generate: gramble generate examples/helloworld.csv -m',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -m`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
        errors: [
            "gramble: Warning: Missing or invalid count for --max|-m option; " +
                "using default: Infinity",
        ],
    });

    testCLI({
        desc: 'g3e. test generate: gramble generate examples/helloworld.csv -m zero',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -m zero`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
        errors: [
            "gramble: Warning: Missing or invalid count for --max|-m option; " +
                "using default: Infinity",
        ],
    });

    testCLI({
        desc: 'g4a. test generate: gramble generate examples/helloworld.csv ' +
              '-s helloworld.greeting',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                 '-s helloworld.greeting',
        results: [
            'text',
            '"goodbye"',
            '"hello"',
        ],
    });

    testCLI({
        desc: 'g4b. test generate: gramble generate examples/helloworld.csv ' +
              '-s helloworld.all',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                 '-s helloworld.all',
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g4c. test generate: gramble generate examples/helloworld.csv ' +
              '-s Helloworld.All',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                 '-s Helloworld.All',
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g4d. test generate: gramble generate examples/helloworld.csv -s all',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -s all`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g4e. test generate: gramble generate examples/helloworld.csv -s',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -s`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g4f. test generate: gramble generate examples/helloworld.csv -s XXX',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -s XXX`,
        results: [],
        errors: [
            "gramble: Error: Error in generate command:",
            "Cannot find symbol XXX in grammar, candidates: " +
                "helloworld.greeting,helloworld.recipient,helloworld.main,helloworld.all,All.",
            "For usage info, try: gramble help generate",
        ],
    });

    testCLI({
        desc: 'g5a. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:goodbyekitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:goodbyekitty',
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5b. test generate: gramble generate examples/helloworld.csv ' +
                "-q 'text:goodbyekitty'",
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                "-q 'text:goodbyekitty'",
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5c. test generate: gramble generate examples/helloworld.csv ' +
                '-q "text:goodbyekitty"',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                `-q "text:goodbyekitty"`,
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5d. test generate: gramble generate examples/helloworld.csv ' +
                "-q 'text:goodbyekitty '",
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                "-q 'text:goodbyekitty '",
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5e. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:kitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:kitty',
        results: [
            'text',
        ],
    });

    testCLI({
        desc: 'g5f. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:goodbyekitty,text:goodbyekitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:goodbyekitty,text:goodbyekitty',
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5g. test generate: gramble generate examples/helloworld.csv ' +
                "-q 'text:goodbyekitty,text:goodbyekitty'",
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                "-q 'text:goodbyekitty,text:goodbyekitty'",
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5h. test generate: gramble generate examples/helloworld.csv ' +
                '-q "text:goodbyekitty,text:goodbyekitty"',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q "text:goodbyekitty,text:goodbyekitty"',
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5i. test generate: gramble generate examples/helloworld.csv ' +
                '-q " text:goodbyekitty,  text:goodbyekitty "',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q " text:goodbyekitty,  text:goodbyekitty "',
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 'g5j. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:goodbyekitty,text:kitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:goodbyekitty,text:kitty',
        results: [
            'text',
        ],
    });

    testCLI({
        desc: 'g5k. test generate: gramble generate examples/helloworld.csv ' +
                '-q "text:goodbye,text:kitty"',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q "text:goodbye,text:kitty"',
        results: [
            'text',
        ],
    });

    // unknown tape is treated as no query in single-tape query
    testCLI({
        desc: 'g6a. test generate: gramble generate examples/helloworld.csv ' +
                '-q "XXX:goodbye"',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q "XXX:goodbye"',
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    // unknown tape simply dropped in multi-tape query.
    testCLI({
        desc: 'g6b. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:goodbyekitty,XXX:goodbye',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:goodbyekitty,XXX:goodbye',
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    // missing query string
    testCLI({
        desc: 'g7a. test generate: gramble generate examples/helloworld.csv -q',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv -q`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
        errors: [
            "gramble: Warning: Missing query string for --query|-q option",
        ],
    });

    // syntax error - space seperated pairs in query (with quotes)
    // tries to match "goodbyekitty text:goodbyekitty" on tape text.
    testCLI({
        desc: 'g7b. test generate: gramble generate examples/helloworld.csv ' +
                '-q "text:goodbyekitty text:goodbyekitty"',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q "text:goodbyekitty text:goodbyekitty"',
        results: [
            'text',
        ],
    });

    // syntax error - space seperated pairs in query (without quotes)
    testCLI({
        desc: 'g7c. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:goodbyekitty text:goodbyekitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:goodbyekitty text:goodbyekitty',
        results: [
        ],
        errors: [
            "gramble: Error: Error in generate command:",
            "Unknown value: text:goodbyekitty",
            "For usage info, try: gramble help generate"
        ],
    });

    // syntax error - missing tape in second query entry
    testCLI({
        desc: 'g7d. test generate: gramble generate examples/helloworld.csv ' +
                '-q text:goodbyekitty,goodbye',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q text:goodbyekitty,goodbye',
        results: [
        ],
        errors: [
            "gramble: Error: Query must consist of key:value pairs (e.g. \"text:ninapenda\").",
            "Separate multiple pairs by commas (e.g. \"root:pend,subj:1SG\")."
        ],
    });

    // syntax error - missing tape in single query entry
    testCLI({
        desc: 'g7e. test generate: gramble generate examples/helloworld.csv ' +
                '-q goodbyekitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                '-q goodbyekitty',
        results: [
        ],
        errors: [
            "gramble: Error: Query must consist of key:value pairs (e.g. \"text:ninapenda\").",
            "Separate multiple pairs by commas (e.g. \"root:pend,subj:1SG\")."
        ],
    });

    // syntax error - missing quote
    // here the error messages are shell dependant, so we only check the count.
    testCLI({
        desc: 'g7f. test generate: gramble generate examples/helloworld.csv ' +
                '-q "text:goodbyekitty',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv ` +
                `-q 'text:goodbyekitty`,
        results: [
        ],
        errors: 2,
    });

    testCLI({
        desc: 'g8a. test generate: gramble generate examples/helloworld.csv --format csv',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv --format csv`,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 'g8b. test generate: gramble generate examples/helloworld.csv --format json',
        command: `gramble generate ${GRAMBLE_EXAMPLES}/helloworld.csv --format json`,
        results: [
            '[',
            '  {"text":"goodbyekitty"},',
            '  {"text":"goodbyeworld"},',
            '  {"text":"hellokitty"},',
            '  {"text":"helloworld"}',
            ']',
        ],
    });

    testCLI({
        desc: 'g9a. test generate: gramble generate source/basic/csvs/basic5a.csv',
        command: `gramble generate source/basic/csvs/basic5a.csv -s basic5a.word`,
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) " +
                "to the right, but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
            "Generation not run because source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 'g9b. test generate: gramble generate source/basic/csvs/basic5a.csv --strict',
        command: `gramble generate source/basic/csvs/basic5a.csv ` +
                '-s basic5a.word --strict',
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) " +
                "to the right, but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
            "Generation not run because source has 3 Gramble errors.",
        ],
    });

    testCLI({
        desc: 'g9c. test generate: gramble generate source/basic/csvs/basic5a.csv --force',
        command: `gramble generate source/basic/csvs/basic5a.csv ` +
                '-s basic5a.word --force',
        results: [
            'gloss,text',
            '"-1SG","bar"',
            '"-2SG","baz"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) " +
                "to the right, but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
            "Generation running even though source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 'g9d. test generate: gramble generate source/basic/csvs/basic5c.csv',
        command: `gramble generate source/basic/csvs/basic5c.csv ` +
                '-s basic5c.word',
        results: [
            'gloss,text',
            '"-1SG","bar"',
            '"-2SG","baz"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
        ],
    });

    testCLI({
        desc: 'g9e. test generate: gramble generate source/basic/csvs/basic5c.csv -S',
        command: `gramble generate source/basic/csvs/basic5c.csv ` +
                '-s basic5c.word -S',
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
            "Generation not run because source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 'g9f. test generate: gramble generate source/basic/csvs/basic5c.csv -F',
        command: `gramble generate source/basic/csvs/basic5c.csv ` +
                '-s basic5c.word -F',
        results: [
            'gloss,text',
            '"-1SG","bar"',
            '"-2SG","baz"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
        ],
    });

    testCLI({
        desc: 'g9g. test generate: gramble generate source/basic/csvs/basic5c.csv -SF',
        command: `gramble generate source/basic/csvs/basic5c.csv ` +
                '-s basic5c.word -SF',
        results: [
            'gloss,text',
            '"-1SG","bar"',
            '"-2SG","baz"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
            "Generation running even though source has 1 Gramble error.",
        ],
    });


    // testing gramble sample

    testCLI({
        desc: 's1. test: gramble sample',
        command: "gramble sample",
        results: [],
        errors: [
            "gramble: Error: Must specify a filename"
        ],
    });

    testCLI({
        desc: 's2a. test sample: gramble sample examples/helloworld.csv -n 40 --seed',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv -n 40 --seed`,
        sample: 40,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 's2b. test sample: gramble sample examples/helloworld.csv -n 3 --seed',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv -n 3 --seed`,
        sample: 3,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
        ],
    });

    testCLI({
        desc: 's2c. test sample: gramble sample examples/helloworld.csv -n 3 ' +
                '--seed Seed-2024',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv -n 3 ` +
                '--seed Seed-2024',
        sample: 3,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
        ],
    });

    testCLI({
        desc: 's2d. test sample: gramble sample examples/helloworld.csv -n 3 ' +
                '--seed another-seed',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv -n 3 ` +
                '--seed another-seed',
        sample: 3,
        results: [
            'text',
            '"goodbyekitty"',
            '"hellokitty"',
        ],
    });

    testCLI({
        desc: 's3. test sample: gramble sample examples/none.csv --seed -n 40',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/none.csv --seed -n 40`,
        results: [],
        errors: [
            `gramble: Error: Cannot find file '${GRAMBLE_EXAMPLES}/none.csv'`,
        ],
    });

    testCLI({
        desc: 's4. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-s helloworld.greeting',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-s helloworld.greeting',
        sample: 5,
        results: [
            'text',
            '"goodbye"',
            '"hello"',
        ],
    });

    testCLI({
        desc: 's5a. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-s helloworld.greeting -n',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                `-s helloworld.greeting -n`,
        sample: 5,
        results: [
            "text",
            '"goodbye"',
            '"hello"',
        ],
        errors: [
            "gramble: Warning: Missing or invalid count for --num|-n option; " +
                "using default: 5"
        ],
    });

    testCLI({
        desc: 's5b. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-s helloworld.greeting -n NNN',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                `-s helloworld.greeting -n NNN`,
        sample: 5,
        results: [
            "text",
            '"goodbye"',
            '"hello"',
        ],
        errors: [
            "gramble: Warning: Missing or invalid count for --num|-n option; " +
                "using default: 5"
        ],
    });

    testCLI({
        desc: 's6a. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 40 -s helloworld.greeting',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 40 -s helloworld.greeting',
        sample: 40,
        results: [
            'text',
            '"goodbye"',
            '"hello"',
        ],
    });

    testCLI({
        desc: 's6b. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 40 -s Helloworld.All',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 40 -s Helloworld.All',
        sample: 40,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    testCLI({
        desc: 's6c. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 40 -s XXX',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 40 -s XXX',
        results: [],
        errors: [
            "gramble: Error: Error in sample command:",
            "Cannot find symbol XXX in grammar, candidates: " +
                "helloworld.greeting,helloworld.recipient,helloworld.main,helloworld.all,All.",
            "For usage info, try: gramble help sample",
        ],
    });

    testCLI({
        desc: 's7a. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:goodbyekitty',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:goodbyekitty',
        sample: 10,
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 's7b. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q " text:goodbyekitty"',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q " text:goodbyekitty"',
        sample: 10,
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 's7c. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:kitty',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:kitty',
        results: [
            'text',
        ],
    });

    testCLI({
        desc: 's7d. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:goodbyekitty,text:goodbyekitty',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:goodbyekitty,text:goodbyekitty',
        sample: 10,
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 's7e. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q " text:goodbyekitty,  text:goodbyekitty "',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q " text:goodbyekitty,  text:goodbyekitty "',
        sample: 10,
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    testCLI({
        desc: 's7f. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:goodbyekitty,text:kitty',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:goodbyekitty,text:kitty',
        results: [
            'text',
        ],
    });

    // unknown tape is treated as no query in single-tape query
    testCLI({
        desc: 's8a. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 40 -q XXX:goodbye',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 40 -q XXX:goodbye',
        sample: 40,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
    });

    // unknown tape simply dropped in multi-tape query.
    testCLI({
        desc: 's8b. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:goodbyekitty,XXX:goodbye',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:goodbyekitty,XXX:goodbye',
        sample: 10,
        results: [
            'text',
            '"goodbyekitty"',
        ],
    });

    // missing query string
    testCLI({
        desc: 's9a. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 40 -q',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 40 -q',
        sample: 40,
        results: [
            'text',
            '"goodbyekitty"',
            '"goodbyeworld"',
            '"hellokitty"',
            '"helloworld"',
        ],
        errors: [
            "gramble: Warning: Missing query string for --query|-q option",
        ],
    });

    // syntax error - space seperated pairs in query (with quotes)
    // tries to match "goodbyekitty text:goodbyekitty" on tape text.
    testCLI({
        desc: 's9b. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q "text:goodbyekitty text:goodbyekitty"',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q "text:goodbyekitty text:goodbyekitty"',
        results: [
            'text',
        ],
    });

    // syntax error - space seperated pairs in query (without quotes)
    testCLI({
        desc: 's9c. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:goodbyekitty text:goodbyekitty',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:goodbyekitty text:goodbyekitty',
        results: [],
        errors: [
            "gramble: Error: Error in sample command:",
            "Unknown value: text:goodbyekitty",
            "For usage info, try: gramble help sample"
        ],
    });

    // syntax error - missing tape in second query entry
    testCLI({
        desc: 's9d. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q text:goodbyekitty,goodbye',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q text:goodbyekitty,goodbye',
        results: [],
        errors: [
            "gramble: Error: Query must consist of key:value pairs (e.g. \"text:ninapenda\").",
            "Separate multiple pairs by commas (e.g. \"root:pend,subj:1SG\")."
        ],
    });

    // syntax error - missing tape in single query entry
    testCLI({
        desc: 's9e. test sample: gramble sample examples/helloworld.csv --seed ' +
                '-n 10 -q goodbyekitty',
        command: `gramble sample ${GRAMBLE_EXAMPLES}/helloworld.csv --seed ` +
                '-n 10 -q goodbyekitty',
        results: [],
        errors: [
            "gramble: Error: Query must consist of key:value pairs (e.g. \"text:ninapenda\").",
            "Separate multiple pairs by commas (e.g. \"root:pend,subj:1SG\")."
        ],
    });

    testCLI({
        desc: 's10a. test sample: gramble sample source/basic/csvs/basic5a.csv',
        command: 'gramble sample source/basic/csvs/basic5a.csv -s basic5a.word ' +
                '--seed',
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) " +
                "to the right, but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
            "Sampling not run because source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 's10b. test sample: gramble sample source/basic/csvs/basic5a.csv --strict',
        command: 'gramble sample source/basic/csvs/basic5a.csv -s basic5a.word ' +
                '--seed --strict',
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) " +
                "to the right, but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
            "Sampling not run because source has 3 Gramble errors.",
        ],
    });

    testCLI({
        desc: 's10c. test sample: gramble sample source/basic/csvs/basic5a.csv --force',
        command: 'gramble sample source/basic/csvs/basic5a.csv -s basic5a.word ' +
                '--seed --force',
        results: [
            'gloss,text',
            '"-2SG","baz"',
            '"-1SG","bar"',
            '"-2SG","baz"',
            '"-2SG","baz"',
            '"-1SG","bar"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) " +
                "to the right, but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
            "Sampling running even though source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 's10d. test sample: gramble sample source/basic/csvs/basic5c.csv',
        command: 'gramble sample source/basic/csvs/basic5c.csv -s basic5c.word ' +
                '--seed',
        results: [
            'gloss,text',
            '"-2SG","baz"',
            '"-1SG","bar"',
            '"-2SG","baz"',
            '"-2SG","baz"',
            '"-1SG","bar"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
        ],
    });

    testCLI({
        desc: 's10e. test sample: gramble sample source/basic/csvs/basic5c.csv -S',
        command: 'gramble sample source/basic/csvs/basic5c.csv -s basic5c.word ' +
                '--seed -S',
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
            "Sampling not run because source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 's10f. test sample: gramble sample source/basic/csvs/basic5c.csv -F',
        command: 'gramble sample source/basic/csvs/basic5c.csv -s basic5c.word ' +
                '--seed -F',
        results: [
            'gloss,text',
            '"-2SG","baz"',
            '"-1SG","bar"',
            '"-2SG","baz"',
            '"-2SG","baz"',
            '"-1SG","bar"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
        ],
    });

    testCLI({
        desc: 's10g. test sample: gramble sample source/basic/csvs/basic5c.csv -SF',
        command: 'gramble sample source/basic/csvs/basic5c.csv -s basic5c.word ' +
                '--seed -SF',
        results: [
            'gloss,text',
            '"-2SG","baz"',
            '"-1SG","bar"',
            '"-2SG","baz"',
            '"-2SG","baz"',
            '"-1SG","bar"',
        ],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5c:2:3: WARNING: No content cells found for these header(s); " +
                "assuming empty values.",
            "Sampling running even though source has 1 Gramble error.",
        ],
    });

    testCLI({
        desc: 'l1. test list: gramble list source/basic/csvs/basic5a.csv',
        command: 'gramble list source/basic/csvs/basic5a.csv',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
            "",
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l2. test list: gramble list source/basic/csvs/basic5a.csv -a',
        command: 'gramble list source/basic/csvs/basic5a.csv -a',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
            "",
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l3. test list: gramble list source/basic/csvs/basic5a.csv -s',
        command: 'gramble list source/basic/csvs/basic5a.csv -s',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
        ],
    });

    testCLI({
        desc: 'l4. test list: gramble list source/basic/csvs/basic5a.csv -e',
        command: 'gramble list source/basic/csvs/basic5a.csv -e',
        results: [],
        errors: [
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l5. test list: gramble list source/basic/csvs/basic5a.csv -e -s',
        command: 'gramble list source/basic/csvs/basic5a.csv -e -s',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
            "",
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l6. test list: gramble list source/basic/csvs/basic5a.csv -a -e',
        command: 'gramble list source/basic/csvs/basic5a.csv -a -e',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
            "",
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l7. test list: gramble list source/basic/csvs/basic5a.csv -a -s',
        command: 'gramble list source/basic/csvs/basic5a.csv -a -s',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
            "",
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l8. test list: gramble list source/basic/csvs/basic5a.csv -aes',
        command: 'gramble list source/basic/csvs/basic5a.csv -aes',
        results: [],
        errors: [
            "Available symbols:",
            '["basic5a.verb","basic5a.suffix","basic5a.word","basic5a.All","All"]',
            "",
            "Compilation errors/warnings:",
            "⚠️ basic5a:2:1: WARNING: This symbol 'verb' will not contain any content.",
            "❌ basic5a:2:2: ERROR: This 'table' operator requires header(s) to the right, " +
                "but none was found.",
            "⚠️ basic5a:2:2: WARNING: This 'table' operator will not contain any content.",
        ],
    });

    testCLI({
        desc: 'l9. test list: gramble list source/basic/csvs/basic5a.csv -BAD',
        command: 'gramble list source/basic/csvs/basic5a.csv -BAD',
        results: [],
        errors: [
            "gramble: Error: Error in list command:",
            "Unknown option: -B",
            "For usage info, try: gramble help list",
        ],
    });

    testCLI({
        desc: 'l10. test list: gramble list cli/csvs/Sheet1.csv -s',
        command: `gramble list cli/csvs/Sheet1.csv -s`,
        results: [],
        errors: [
            "Available symbols:",
            '["Sheet1.Root","Sheet1.Stem","Sheet1.StemA","Sheet1.StemB","Sheet1.All",' +
                '"sheet2.Root2","sheet2.Root2z","sheet2.Stem2","sheet2.Stem2z",' +
                '"sheet2.Stem2-3","sheet2.All","sheet3.Root3","sheet3.Root3z",' +
                '"sheet3.All","All"]'
        ],
    });

    testCLI({
        desc: 'l11. test list: gramble list cli/csvs/Sheet2.csv -s',
        command: 'gramble list cli/csvs/Sheet2.csv -s',
        results: [],
        errors: [
            "Available symbols:",
            '["Sheet2.Root2","Sheet2.Root2z","Sheet2.Stem2","Sheet2.Stem2z",' +
                '"Sheet2.Stem2-3","Sheet2.All","sheet3.Root3","sheet3.Root3z",' +
                '"sheet3.All","All"]',
        ],
    });

    testCLI({
        desc: 'l12. test list: gramble list cli/csvs/Sheet3.csv -s',
        command: 'gramble list cli/csvs/Sheet3.csv -s',
        results: [],
        errors: [
            "Available symbols:",
            '["Sheet3.Root3","Sheet3.Root3z","Sheet3.All","All"]',
        ],
    });

    testCLI({
        desc: 't1. test test: gramble test cli/csvs/Sheet1.csv -s all -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s all -r',
        results: [],
        errors: [
            "18 tests reached from symbol 'all'",
            "✅ 8/18 tests passed",
            "❌ 10/18 tests failed",
            "⚠️ 0/18 tests skipped",
            "Test Results:",
            "✅ Sheet1:19:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:20:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ Sheet1:28:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:29:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:30:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:31:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "✅ sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ sheet2:35:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ sheet2:36:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't2. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.All -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.All -r',
        results: [],
        errors: [
            "12 tests reached from symbol 'Sheet1.All'",
            "✅ 6/12 tests passed",
            "❌ 6/12 tests failed",
            "⚠️ 0/12 tests skipped",
            "Test Results:",
            "✅ Sheet1:19:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:20:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ Sheet1:28:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:29:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:30:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:31:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "✅ sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't3a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.Root',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.Root',
        results: [],
        errors: [
            "No tests found for symbol 'Sheet1.Root'",
        ],
    });

    testCLI({
        desc: 't3b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.Root -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.Root -r',
        results: [],
        errors: [
            "No tests found for symbol 'Sheet1.Root'",
        ],
    });

    testCLI({
        desc: 't4a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.Stem',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.Stem',
        results: [],
        errors: [
            "2 tests for symbol 'Sheet1.Stem'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ Sheet1:19:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:20:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't4b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.Stem -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.Stem -r',
        results: [],
        errors: [
            "2 tests reached from symbol 'Sheet1.Stem'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ Sheet1:19:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:20:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't5a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.StemA',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.StemA',
        results: [],
        errors: [
            "4 tests for symbol 'Sheet1.StemA'",
            "✅ 2/4 tests passed",
            "❌ 2/4 tests failed",
            "⚠️ 0/4 tests skipped",
            "Test Results:",
            "❌ Sheet1:28:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:29:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:30:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:31:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't5b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.StemA -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.StemA -r',
        results: [],
        errors: [
            "6 tests reached from symbol 'Sheet1.StemA'",
            "✅ 3/6 tests passed",
            "❌ 3/6 tests failed",
            "⚠️ 0/6 tests skipped",
            "Test Results:",
            "❌ Sheet1:28:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:29:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:30:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet1:31:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "✅ sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't6a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.StemB',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.StemB',
        results: [],
        errors: [
            "2 tests for symbol 'Sheet1.StemB'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ Sheet1:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't6b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet1.StemB -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet1.StemB -r',
        results: [],
        errors: [
            "6 tests reached from symbol 'Sheet1.StemB'",
            "✅ 3/6 tests passed",
            "❌ 3/6 tests failed",
            "⚠️ 0/6 tests skipped",
            "Test Results:",
            "✅ Sheet1:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet1:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't7a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2',
        results: [],
        errors: [
            "2 tests for symbol 'Sheet2.Stem2'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't7b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2 -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2 -r',
        results: [],
        errors: [
            "4 tests reached from symbol 'Sheet2.Stem2'",
            "✅ 2/4 tests passed",
            "❌ 2/4 tests failed",
            "⚠️ 0/4 tests skipped",
            "Test Results:",
            "✅ sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't8a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2z',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2z',
        results: [],
        errors: [
            "4 tests for symbol 'Sheet2.Stem2z'",
            "✅ 1/4 tests passed",
            "❌ 3/4 tests failed",
            "⚠️ 0/4 tests skipped",
            "Test Results:",
            "❌ sheet2:35:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ sheet2:36:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't8b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2z -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2z -r',
        results: [],
        errors: [
            "4 tests reached from symbol 'Sheet2.Stem2z'",
            "✅ 1/4 tests passed",
            "❌ 3/4 tests failed",
            "⚠️ 0/4 tests skipped",
            "Test Results:",
            "❌ sheet2:35:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ sheet2:36:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't9a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2-3',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2-3',
        results: [],
        errors: [
            "No tests found for symbol 'Sheet2.Stem2-3'",
        ],
    });

    testCLI({
        desc: 't9b. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2-3 -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.Stem2-3 -r',
        results: [],
        errors: [
            "2 tests reached from symbol 'Sheet2.Stem2-3'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't10a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet2.All -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet2.All -r',
        results: [],
        errors: [
            "10 tests reached from symbol 'Sheet2.All'",
            "✅ 4/10 tests passed",
            "❌ 6/10 tests failed",
            "⚠️ 0/10 tests skipped",
            "Test Results:",
            "✅ sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ sheet2:35:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ sheet2:36:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet2:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet2:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't10b. test test: gramble test cli/csvs/Sheet2.csv -s Sheet2.All -r',
        command: 'gramble test cli/csvs/Sheet2.csv -s Sheet2.All -r',
        results: [],
        errors: [
            "10 tests reached from symbol 'Sheet2.All'",
            "✅ 4/10 tests passed",
            "❌ 6/10 tests failed",
            "⚠️ 0/10 tests skipped",
            "Test Results:",
            "✅ Sheet2:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet2:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet2:23:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet2:24:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ Sheet2:35:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "❌ Sheet2:36:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ Sheet2:37:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet2:38:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
            "✅ sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't11a. test test: gramble test cli/csvs/Sheet1.csv -s Sheet3.All -r',
        command: 'gramble test cli/csvs/Sheet1.csv -s Sheet3.All -r',
        results: [],
        errors: [
            "2 tests reached from symbol 'Sheet3.All'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't11b. test test: gramble test cli/csvs/Sheet2.csv -s Sheet3.All -r',
        command: 'gramble test cli/csvs/Sheet2.csv -s Sheet3.All -r',
        results: [],
        errors: [
            "2 tests reached from symbol 'Sheet3.All'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

    testCLI({
        desc: 't11c. test test: gramble test cli/csvs/Sheet3.csv -s Sheet3.All -r',
        command: 'gramble test cli/csvs/Sheet3.csv -s Sheet3.All -r',
        results: [],
        errors: [
            "2 tests reached from symbol 'Sheet3.All'",
            "✅ 1/2 tests passed",
            "❌ 1/2 tests failed",
            "⚠️ 0/2 tests skipped",
            "Test Results:",
            "✅ Sheet3:6:2: TEST PASSED: The grammar above correctly has outputs compatible with this specification.",
            "❌ Sheet3:7:2: TEST FAILED: The grammar above has no outputs compatible with this specification.",
        ],
    });

});
