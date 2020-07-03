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

const foobarParser = transducerFromTable(makeTable([
    [["text", "foo"], ["gloss", "jump"], ["text", "bar"], ["gloss", "-1SG"]],
    [["text", "foob"], ["gloss", "run"], ["text", "ar"], ["gloss", "-3PL.PAST"]]
]), transducerTable, devEnv);

transducerTable.set('ROOT', transducerFromTable(makeTable([
    [["text", "foo"]]
]), transducerTable, devEnv));

const varParser = transducerFromEntry(makeEntry("var", "ROOT"), transducerTable, devEnv);



describe('Simple GEntry parser, in reverse', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = [...barParser.transduce(input, reverseOptions)];
    testNumResults(result, 1);
    testParseOutput(result, 0, "text", "bar");
    testParseRemnant(result, 0, "text", "foo");
}); 


describe('Ambiguous GTable transducer, transduce', function() {
    const input : GParse = [foobarInput, 1.0, []];
    const result = [...foobarParser.transduce(input, reverseOptions)];
    testNumResults(result, 2);
    testParseOutput(result, 0, "gloss", "jump-1SG");
    testParseOutput(result, 1, "gloss", "run-3PL.PAST");
});