import {GCell, GEntry, GRecord, GTable, SymbolTable, make_record, make_entry, make_one_record_table, make_one_entry_table} from "../transducers"
import { expect } from 'chai';
import 'mocha';

const symbol_table = new SymbolTable();

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


const reduce_oo = new GTable();
reduce_oo.push(make_record([
    ["up", "oo"],
    ["down", "o"]
]));

symbol_table.new_symbol("reduce_oo");
symbol_table.add_to_symbol("reduce_oo", make_record([
    ["up", "oo"],
    ["down", "o"]
]));

const foobar_parser = new GTable();
foobar_parser.push(make_record([
    ["upward text", "reduce_oo"],
    ["text", "foo"],
    ["gloss", "jump"],
    ["text", "bar"],
    ["gloss", "-1SG"],
    ["downward text", "reduce_oo"]
]));

const gloss_input = make_one_entry_table("gloss", "jump-1SG");
const text_input = make_one_entry_table("text", "fobar");
const text_input_bad = make_one_entry_table("text", "foobar");

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
});

describe('Foobar generator with oo->o reduction', function() {
    const result = foobar_parser.full_parse(gloss_input, symbol_table);
    it('should have 1 result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "fobar" on the text tier', function() {
        expect(result.records[0].get("text")).to.equal("fobar");
    });
});


describe('Fobar generator with oo->o reduction', function() {
    const result = foobar_parser.full_parse(gloss_input, symbol_table);
    it('should have 1 result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "fobar" on the text tier', function() {
        expect(result.records[0].get("text")).to.equal("fobar");
    });
});

describe('Fobar parser with oo->o reduction', function() {
    const result = foobar_parser.full_parse(text_input, symbol_table);
    it('should have 1 result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "jump-1SG" on the gloss tier', function() {
        expect(result.records[0].get("gloss")).to.equal("jump-1SG");
    });
});

describe('Fobar parser with oo->o reduction, but applied to "foobar"', function() {
    const result = foobar_parser.full_parse(text_input_bad, symbol_table);
    it('should have no results', function() {
        expect(result.length).to.equal(0);
    });
});