import {GGrammar, SymbolTable, make_table} from "../transducers"
import { expect } from 'chai';
import 'mocha';
import {test_num_results, test_output} from "./test_util"

const symbol_table = new Map();

/*
const hiatus_conversion = new GTable();
hiatus_conversion.push(make_record([
    ["up", "ia"],
    ["down", "iya"],
]));
hiatus_conversion.push(make_record([
    ["up", "ii"],
    ["down", "i"],
]));

const ambiguous_conversion = new GTable();
ambiguous_conversion.push(make_record([
    ["up", "ia"],
    ["down", "iya"],
]));
ambiguous_conversion.push(make_record([
    ["up", "ii"],
    ["down", "i"],
]));
ambiguous_conversion.push(make_record([
    ["up", "i"],
    ["down", "i"],
]));

const diablo = make_one_entry_table("_up", "diablo");
const diiablo = make_one_entry_table("_up", "diiablo");
*/

symbol_table.set("reduce_oo", make_table([[
    ["up", "oo"],
    ["down", "o"]
]]));

const oo_reduction_parser = new GGrammar(make_table([[
    ["upward text", "reduce_oo"],
    ["text", "foo"],
    ["gloss", "jump"],
    ["text", "bar"],
    ["gloss", "-1SG"],
    ["downward text", "reduce_oo"]
]]))

const gloss_input = make_table([[
    ["gloss", "jump-1SG"],
]])
const text_input = make_table([[
    ["text", "fobar"],
]]);

const text_input_bad = make_table([[
    ["text", "foobar"],
]]);

/*
describe('Hiatus resolving converter, input "diablo"', function() {
    const result = hiatus_conversion.apply_conversion(diablo, symbol_table);
    it('should have one result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "diyablo" as its output', function() {
        expect(result.records[0].get("down")).to.equal("diyablo");
    });
});

describe('Ambiguous converter, input "diiablo"', function() {
    const result = ambiguous_conversion.apply_conversion(diiablo, symbol_table);
    it('should have 3 results', function() {
        expect(result.length).to.equal(3);
    });
    it('should have "diablo" as its first output', function() {
        expect(result.records[0].get("down")).to.equal("diablo");
    });
    it('should have "diiyablo" as its second output', function() {
        expect(result.records[1].get("down")).to.equal("diiyablo");
    });
    it('should have "diiablo" as its second output', function() {
        expect(result.records[2].get("down")).to.equal("diiablo");
    });
}); */

describe('Foobar generator with oo->o reduction', function() {
    const result = oo_reduction_parser.transduce(gloss_input, symbol_table);
    test_num_results(result, 1);
    test_output(result, 0, "text", "fobar");
});


describe('Fobar parser with oo->o reduction', function() {
    const result = oo_reduction_parser.transduce(text_input, symbol_table);
    test_num_results(result, 1);
    test_output(result, 0, "gloss", "jump-1SG");
});

describe('Fobar parser with oo->o reduction, but applied to "foobar"', function() {
    const result = oo_reduction_parser.transduce(text_input_bad, symbol_table);
    test_num_results(result, 0);
});