import {GCell, GEntry, GRecord, GTable, SymbolTable, make_record, make_entry, make_one_record_table} from "../transducers"
import { expect } from 'chai';
import 'mocha';

const text_input = make_one_record_table([["_text", "foobar"]]);
const gloss_input = make_one_record_table([["_gloss", "jump-1SG"]]);
const raw_text_input = make_one_record_table([["text", "foobar"]]);
const symbol_table = new SymbolTable();

const entry_parser = make_entry("text", "foo");
const record_parser = make_record([
    ["text", "foo"],
    ["gloss", "jump"],
    ["text", "bar"],
    ["gloss", "-1SG"]
]);

const record_parser2 = make_record([
    ["text", "foob"],
    ["gloss", "run"],
    ["text", "ar"],
    ["gloss", "-3PL.PAST"]
]);

const table_parser = new GTable();
table_parser.push(record_parser);
table_parser.push(record_parser2);

symbol_table.new_symbol('ROOT');
symbol_table.add_to_symbol('ROOT', make_record([
    ["text", "foo"],
    ["gloss", "jump"],
]));
symbol_table.add_to_symbol('ROOT', make_record([
    ["text", "foob"],
    ["gloss", "run"],
]));

symbol_table.new_symbol('SUFFIX');
symbol_table.add_to_symbol('SUFFIX', make_record([
    ["text", "bar"],
    ["gloss", "-1SG"],
]));
symbol_table.add_to_symbol('SUFFIX', make_record([
    ["text", "ar"],
    ["gloss", "-3PL.PAST"]
]));

const table_parser_with_var = make_one_record_table([
    ["var", "ROOT"],
    ["var", "SUFFIX"]
]);


describe('Simple GEntry parser', function() {
    const result = entry_parser.parse(text_input, symbol_table);
    it('should have one result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "foo" as its output', function() {
        expect(result.records[0].get("text")).to.equal("foo");
    });
    it('should have "bar" as its remnant', function() {
        expect(result.records[0].get("_text")).to.equal("bar");
    });
});


describe('Simple GRecord transducer, from text to gloss', function() {
    const result = record_parser.parse(text_input, symbol_table);
    it('should have 1 result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "foo" as its text output', function() {
        expect(result.records[0].get("text")).to.equal("foobar");
    });
    it('should have "" as its text remnant', function() {
        expect(result.records[0].get("_text")).to.equal("");
    });
    it('should have "jump-1SG" as its gloss output', function() {
        expect(result.records[0].get("gloss")).to.equal("jump-1SG");
    });
});


describe('Simple GRecord transducer, from gloss to text', function() {
    const result = record_parser.parse(gloss_input, symbol_table);
    it('should have 1 result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "foo" as its text output', function() {
        expect(result.records[0].get("text")).to.equal("foobar");
    });
    it('should have "" as its gloss remnant', function() {
        expect(result.records[0].get("_gloss")).to.equal("");
    });
    it('should have "jump-1SG" as its gloss output', function() {
        expect(result.records[0].get("gloss")).to.equal("jump-1SG");
    });
});

describe('Ambiguous GTable transducer, from text to gloss', function() {
    const result = table_parser.parse(text_input, symbol_table);
    it('should have 2 results', function() {
        expect(result.length).to.equal(2);
    });
    it('should have "jump-1SG" as its first gloss output', function() {
        expect(result.records[0].get("gloss")).to.equal("jump-1SG");
    });
    it('should have "run-3PL.PAST" as its second gloss output', function() {
        expect(result.records[1].get("gloss")).to.equal("run-3PL.PAST");
    });
});


describe('Unambiguous GTable transducer, from gloss to text', function() {
    const result = table_parser.parse(gloss_input, symbol_table);
    it('should have 1 result', function() {
        expect(result.length).to.equal(1);
    });
    it('should have "foobar" as its text output', function() {
        expect(result.records[0].get("text")).to.equal("foobar");
    });
});


describe('Ambiguous GTable transducer, full_parse', function() {
    const result = table_parser.full_parse(raw_text_input, symbol_table);
    it('should have 2 results', function() {
        expect(result.length).to.equal(2);
    });
    it('should have "jump-1SG" as its first gloss output', function() {
        expect(result.records[0].get("gloss")).to.equal("jump-1SG");
    });
    it('should have "run-3PL.PAST" as its second gloss output', function() {
        expect(result.records[1].get("gloss")).to.equal("run-3PL.PAST");
    });
});


describe('Ambiguous GTable transducer using variables', function() {
    const result = table_parser_with_var.full_parse(raw_text_input, symbol_table);
    it('should have 2 results', function() {
        expect(result.length).to.equal(2);
    });
    it('should have "jump-1SG" as its first gloss output', function() {
        expect(result.records[0].get("gloss")).to.equal("jump-1SG");
    });
    it('should have "run-3PL.PAST" as its second gloss output', function() {
        expect(result.records[1].get("gloss")).to.equal("run-3PL.PAST");
    });
});



