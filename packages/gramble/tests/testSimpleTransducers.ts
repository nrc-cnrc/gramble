import {makeTable, makeEntry, makeRecord, GParse, transducerFromEntry, transducerFromTable, ParseOptions} from "../src/transducers"
import 'mocha';
import {testNumResults, testOutput, testParseOutput, testParseRemnant} from "./test_util"


const symbolTable = new Map();
const defaultOptions = new ParseOptions();
const reverseOptions = new ParseOptions(false, -1, false);

const fooParser = transducerFromEntry(makeEntry("text", "foo"), symbolTable);
const fooInput = makeRecord([["text", "foo"]]);
const foobarInput = makeRecord([["text", "foobar"]]);

const barParser = transducerFromEntry(makeEntry("text", "bar"), symbolTable);

symbolTable.set('ROOT', makeTable([
    [["text", "foo"]]
]));

const varParser = transducerFromEntry(makeEntry("var", "ROOT"), symbolTable);


describe('Simple GEntry parser, no remnant', function() {
    const input : GParse = [fooInput, 1.0, []];
    const result = fooParser.transduce(input, defaultOptions);
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "");
}); 

describe('Simple GEntry parser, with remnant', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = fooParser.transduce(input, defaultOptions);
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "bar");
}); 


describe('Simple GEntry parser, in reverse', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = barParser.transduce(input, reverseOptions);
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "bar");
    testParseRemnant(result, 0, "text", "foo");
}); 


describe('Simple var parser, no remnant', function() {
    const input : GParse = [fooInput, 1.0, []];
    const result = varParser.transduce(input, defaultOptions);
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "");
}); 

describe('Simple var parser, with remnant', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = varParser.transduce(input, defaultOptions);
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "foo");
    testParseRemnant(result, 0, "text", "bar");
}); 
