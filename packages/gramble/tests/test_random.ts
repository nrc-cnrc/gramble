import {RandomPicker} from "../src/util"
import { expect } from 'chai';
import 'mocha';
import {testNumResults, testOutput} from "./test_util";
import {transducerFromTable, makeTable} from "../src/transducers"

const symbol_table = new Map();
const text_input = makeTable([[["text", "foobar"]]]);
const empty_input = makeTable([[["", ""]]]);

symbol_table.set('ROOT', makeTable([
    [["text", "foo"], ["gloss", "jump"]],
    [["text", "foob"], ["gloss", "run"]]
]));

symbol_table.set('SUFFIX', makeTable([
    [["text", "bar"], ["gloss", "-1SG"]],
    [["text", "ar"], ["gloss", "-3SG.PAST"]],
    [["text", "tar"], ["gloss", "-3PL.PAST"]]
]));

const ambiguous_parser_with_var = transducerFromTable(makeTable([
    [["var", "ROOT"], ["var", "SUFFIX"]]
]), symbol_table);


symbol_table.set('SUFFIX_PROBS', makeTable([
    [["text", "bar"], ["gloss", "-1SG"], ["p", "0.0"]],
    [["text", "ar"], ["gloss", "-3SG.PAST"], ["p", "1.0"]],
    [["text", "tar"], ["gloss", "-3PL.PAST"], ["p", "0.5"]]
]));


const ambiguous_parser_with_probs = transducerFromTable(makeTable([
    [["var", "ROOT"], ["var", "SUFFIX_PROBS"]]
]), symbol_table);


describe('Random picker', function() {
    const items: Array<[string, number]> = [ ["foo", 0.2], ["moo", 0.2], ["loo", 0.6] ];
    const picker = new RandomPicker<string>(items);
    const draw1 = picker.pop();
    const draw2 = picker.pop();
    const draw3 = picker.pop();
    const draw4 = picker.pop();
    it("should have all different draws", function() {
        expect(draw1).to.not.equal(draw2);
        expect(draw1).to.not.equal(draw3);
        expect(draw2).to.not.equal(draw3);
    });
    
    it("should return undefined after popping all items", function() {
        expect(draw4).to.be.undefined;
    });
});


describe('Random transducer, with max_results=1', function() {
    const result = ambiguous_parser_with_var.transduceFinal(text_input, true, 1);
    testNumResults(result, 1);
});


describe('Random generator, with max_results=1', function() {
    const result = ambiguous_parser_with_var.transduceFinal(empty_input, true, 1);
    testNumResults(result, 1);
});


describe('Random transducer with weights', function() {
    const result = ambiguous_parser_with_probs.transduceFinal(text_input, true);
    var nonzero_results = [];
    for (const record of result) {
        for (const [key, value] of record) {
            if (key.text == "p" && parseFloat(value.text) != 0) {
                nonzero_results.push(record);
                continue;
            }
        }
    }
    testNumResults(nonzero_results, 1);
    testOutput(nonzero_results, 0, "gloss", "run-3SG.PAST");
});
    
