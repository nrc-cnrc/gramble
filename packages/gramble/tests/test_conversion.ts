import {transducerFromTable, NullTransducer, makeTable} from "../src/transducers"
import 'mocha';
import {testNumResults, testOutput} from "./test_util"
import {TextDevEnvironment} from "../src/spreadsheet";

const devEnv = new TextDevEnvironment();
const transducerTable : Map<string, NullTransducer> = new Map();


transducerTable.set("reduce_oo", transducerFromTable(makeTable([[
    ["up", "oo"],
    ["down", "o"]
]]), transducerTable, devEnv));

const oo_reduction_parser = transducerFromTable(makeTable([[
    ["upward text", "reduce_oo"],
    ["text", "foo"],
    ["gloss", "jump"],
    ["text", "bar"],
    ["gloss", "-1SG"],
    ["downward text", "reduce_oo"]
]]), transducerTable, devEnv);

const gloss_input = makeTable([[
    ["gloss", "jump-1SG"],
]])
const text_input = makeTable([[
    ["text", "fobar"],
]]);

const text_input_bad = makeTable([[
    ["text", "foobar"],
]]);

describe('Foobar generator with oo->o reduction', function() {
    const result = [...oo_reduction_parser.transduceFinal(gloss_input, transducerTable, false, -1)];
    testNumResults(result, 1);
    testOutput(result, 0, "text", "fobar");
    testOutput(result, 0, "gloss", "jump-1SG");
});


describe('Fobar parser with oo->o reduction', function() {
    const result = [...oo_reduction_parser.transduceFinal(text_input, transducerTable, false, -1)];
    testNumResults(result, 1);
    testOutput(result, 0, "gloss", "jump-1SG");
    testOutput(result, 0, "text", "fobar");
});

describe('Fobar parser with oo->o reduction, but applied to "foobar"', function() {
    const result = [...oo_reduction_parser.transduceFinal(text_input_bad, transducerTable, false, -1)];
    testNumResults(result, 0);
});
