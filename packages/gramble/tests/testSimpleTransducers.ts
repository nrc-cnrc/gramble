import {makeTable, Transducer, makeEntry, makeRecord, GParse, transducerFromEntry, transducerFromTable, ParseOptions} from "../src/transducers"
import {TextDevEnvironment} from "../src/spreadsheet";

import 'mocha';
import {testNumResults, testOutput, testParseOutput, testParseRemnant} from "./test_util"



const transducerTable : Map<string, Transducer> = new Map();
const devEnv = new TextDevEnvironment();
const defaultOptions = new ParseOptions(transducerTable, false, -1, true, false);
const reverseOptions = new ParseOptions(transducerTable, false, -1, false, false);

const fooParser = transducerFromEntry(makeEntry("text", "foo"), transducerTable, devEnv);
const fooInput = makeRecord([["text", "foo"]]);
const foobarInput = makeRecord([["text", "foobar"]]);

const barParser = transducerFromEntry(makeEntry("text", "bar"), transducerTable, devEnv);

transducerTable.set('ROOT', transducerFromTable(makeTable([
    [["text", "foo"]]
]), transducerTable, devEnv));

const varParser = transducerFromEntry(makeEntry("var", "ROOT"), transducerTable, devEnv);


describe('Simple GEntry parser, no remnant', function() {
    const input : GParse = [fooInput, 1.0, []];
    const result = [...fooParser.transduce(input, defaultOptions)];
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "");
}); 

describe('Simple GEntry parser, with remnant', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = [...fooParser.transduce(input, defaultOptions)];
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "bar");
}); 

describe('Simple var parser, no remnant', function() {
    const input : GParse = [fooInput, 1.0, []];
    const result = [...varParser.transduce(input, defaultOptions)];
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "");
}); 

describe('Simple var parser, with remnant', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = [...varParser.transduce(input, defaultOptions)];
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "bar");
}); 
