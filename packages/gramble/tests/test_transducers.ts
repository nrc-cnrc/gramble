import {makeTable, transducerFromTable} from "../src/transducers"
import 'mocha';
import {test_num_results, test_output} from "./test_util"

//const text_input = make_one_record_table([["_text", "foobar"]]);
//const gloss_input = make_one_record_table([["_gloss", "jump-1SG"]]);
const text_input = makeTable([[["text", "foobar"]]]);
const text_incomplete = makeTable([[["text", "fo"]]]);
const text_no_suffix = makeTable([[["text", "foo"]]]);
const gloss_input = makeTable([[["gloss", "jump-1SG"]]]);
const root_input = makeTable([[["root", "foo"]]]);
const bad_text_input = makeTable([[["text", "moobar"]]]);

const symbol_table = new Map();

/*
const entry: GEntry = [new GCell("text"), new GCell("foo")];
const record: GRecord = [[new GCell("text"), new GCell("foobar")]];
const tr = transducer_from_entry(entry, symbol_table);
const result = tr.transduce([record, 1.0, []], false, -1);
console.log(result.toString());
*/

const ambiguous_foobar_parser = transducerFromTable(makeTable([
    [["text", "foo"], ["gloss", "jump"], ["text", "bar"], ["gloss", "-1SG"]],
    [["text", "foob"], ["gloss", "run"], ["text", "ar"], ["gloss", "-3PL.PAST"]]
]), symbol_table);

symbol_table.set('ROOT', makeTable([
    [["text", "foo"], ["gloss", "jump"]],
    [["text", "foob"], ["gloss", "run"]]
]));

symbol_table.set('SUFFIX', makeTable([
    [["text", "bar"], ["gloss", "-1SG"]],
    [["text", "ar"], ["gloss", "-3SG.PAST"]],
    [["text", "ar"], ["gloss", "-3PL.PAST"]]
]));


const ambiguous_parser_with_var = transducerFromTable(makeTable([
    [["var", "ROOT"], ["var", "SUFFIX"]]
]), symbol_table);

const maybe_indicative_parser = transducerFromTable(makeTable([
    [["text", "foo"], ["gloss", "jump"], ["maybe gloss", "-INDIC"], ["text", "bar"], ["gloss", "-1SG"]]
]), symbol_table);

const maybe_suffix_parser = transducerFromTable(makeTable([
    [["var", "ROOT"], ["maybe var", "SUFFIX"]]
]), symbol_table);

const conjoined_foobar_parser = transducerFromTable(makeTable([
    [["text, root", "foo"], ["gloss", "jump"], ["text", "bar"], ["gloss", "-1SG"]],
    [["text, root", "foob"], ["gloss", "run"], ["text", "ar"], ["gloss", "-3PL.PAST"]]
]), symbol_table);

/*
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
}); */

/*
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
}); */

/*
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
}); */

describe('Ambiguous GTable transducer, transduce', function() {
    const result = ambiguous_foobar_parser.transduceFinal(text_input);
    test_num_results(result, 2);
    test_output(result, 0, "gloss", "jump-1SG");
    test_output(result, 1, "gloss", "run-3PL.PAST");
});


describe('Ambiguous GTable transducer, full_parsing an unparseable input', function() {
    const result = ambiguous_foobar_parser.transduceFinal(bad_text_input);
    test_num_results(result, 0);
});



describe('Ambiguous GTable transducer, full_parsing an incomplete input "fo"', function() {
    const result = ambiguous_foobar_parser.transduceFinal(text_incomplete);
    test_num_results(result, 0);
});

describe('Ambiguous GTable transducer, full_parsing an incomplete input "foo"', function() {
    const result = ambiguous_foobar_parser.transduceFinal(text_no_suffix);
    test_num_results(result, 0);
});


describe('Ambiguous GTable transducer using variables', function() {
    const result = ambiguous_parser_with_var.transduceFinal(text_input);
    test_num_results(result, 3);
    test_output(result, 0, "gloss", "jump-1SG");
    test_output(result, 1, "gloss", "run-3SG.PAST");
    test_output(result, 2, "gloss", "run-3PL.PAST");
});

describe('Unambiguous GTable transducer, with vars, gloss->text', function() {
    const result = ambiguous_parser_with_var.transduceFinal(gloss_input);
    test_num_results(result, 1);
    test_output(result, 0, "text", "foobar");
});

describe('Ambiguous GTable transducer, with max_results=1', function() {
    const result = ambiguous_parser_with_var.transduceFinal(text_input, false, 1);
    test_num_results(result, 1);
    test_output(result, 0, "gloss", "jump-1SG");
});


describe('Maybe parser with optional indicative gloss', function() {
    const result = maybe_indicative_parser.transduceFinal(text_input, false, 2);
    test_num_results(result, 2);
    test_output(result, 0, "gloss", "jump-INDIC-1SG");
    test_output(result, 1, "gloss", "jump-1SG");
});


describe('Maybe parser with optional suffix, parsing input with no suffix', function() {
    const result = maybe_suffix_parser.transduceFinal(text_no_suffix);
    test_num_results(result, 1);
    test_output(result, 0, "gloss", "jump");
});


describe('Maybe parser with optional suffix, parsing input with suffix', function() {
    const result = maybe_suffix_parser.transduceFinal(text_input);
    test_num_results(result, 3);
    test_output(result, 0, "gloss", "jump-1SG");
    test_output(result, 1, "gloss", "run-3SG.PAST");
    test_output(result, 2, "gloss", "run-3PL.PAST");
});


describe('Conjoined foobar transducer, transducing from text', function() {
    const result = conjoined_foobar_parser.transduceFinal(text_input);
    test_num_results(result, 2);
    test_output(result, 0, "root", "foo");
    test_output(result, 1, "root", "foob");
});

describe('Conjoined foobar transducer, transducing from gloss', function() {
    const result = conjoined_foobar_parser.transduceFinal(gloss_input);
    test_num_results(result, 1);
    test_output(result, 0, "root", "foo");
});

describe('Conjoined foobar transducer, transducing from root', function() {
    const result = conjoined_foobar_parser.transduceFinal(root_input);
    test_num_results(result, 1);
    test_output(result, 0, "text", "foobar");
    test_output(result, 0, "gloss", "jump-1SG");
});
