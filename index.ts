import {GCell, GEntry, GRecord, GTable, SymbolTable, make_record, make_entry, make_one_record_table} from "./transducers"


var parser1 = make_record([
  ["text", "foo"],
  ["gloss", "jump"],
  ["text", "bar"],
  ["gloss", "-1SG"]
]);

var parser2 = make_record([
  ["text", "foob"],
  ["gloss", "run"],
  ["text", "ar"],
  ["gloss", "-3PL"]
]);
  
var parser = new GTable();
parser.push(parser1);
parser.push(parser2);


var input1 = make_one_record_table([
  ["text", "foobar"]
]);


var input2 = make_one_record_table([
  ["gloss", "jump-1SG"]
]);


var input3 = make_one_record_table([
  ["text", "moobar"]
]);

var input4 = make_one_record_table([
  ["", ""]
]);


var input5 = make_one_record_table([
  ["text", "foobarly"]
]);

const symbol_table = new SymbolTable();
var result = parser.full_parse(input1, symbol_table)
console.log(""+result);
console.log();

var result = parser.full_parse(input2, symbol_table)
console.log(""+result);
console.log()

var result = parser.full_parse(input3, symbol_table)
console.log(""+result);
console.log();

var result = parser.full_parse(input4, symbol_table)
console.log(""+result);
console.log();


var result = parser.full_parse(input5, symbol_table)
console.log(""+result);
console.log();