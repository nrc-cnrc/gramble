import { getEnabledCategories } from "trace_events";
import { RandomPicker } from "./util";
import { stringify } from "querystring";

export type GEntry = [GCell, GCell];
export type GRecord = GEntry[];
export type GParse = [GRecord, number, GRecord];
export type GTable = GRecord[];
export type SymbolTable = Map<string, GTable>;

export class GPosition {

    protected _sheet: string = "";
    protected _col: number = -1;
    protected _row: number = -1;
    
    /**
     * What sheet this cell corresponds to 
     */
    public get sheet(): string { return this._sheet; }
    /**
     * The column index, starting from 0
     */
    public get col(): number { return this._col; }
    /**
     * The row index, starting from 0
     */
    public get row(): number { return this._row; }

    /**
     * Creates an instance of cell.
     * @param sheet_name What sheet this cell corresponds to 
     * @param row_idx The row index, starting from 0 
     * @param col_idx The column index, starting from 0
     * @param text The text that is in the cell
     */
    constructor(sheet_name: string = "", row_idx: number = -1, col_idx: number = -1) {
        this._sheet = sheet_name;
        this._row = row_idx;
        this._col = col_idx;
    }
}

/**
 * Cell
 * 
 * You can think of a Cell as a string with extra information about where it belongs in a 
 * spreadsheet.  We have to keep that information around for the purposes of syntax highlighting,
 * debugging, etc.
 * 
 * When a table is transformed (e.g. where it represents code that has itself undergone transformation),
 * the positional information represents that of the original table.  That way we can highlight that
 * cell during debugging. 
 */

export class GCell extends GPosition {

    protected _text: string; 
    
    /**
     * The text that was entered into the cell
     */
    public get text(): string { return this._text; }

    public toString(): string { return this._text + "(" + this._row + ")"; }
    /**
     * Creates an instance of GCell.
     * 
     * @param sheet_name What sheet this cell corresponds to 
     * @param row_idx The row index, starting from 0 
     * @param col_idx The column index, starting from 0
     * @param text The text that is in the cell
     */
    constructor(text: string, sheet_name: string = "", row_idx: number = -1, col_idx: number = -1) {
        super(sheet_name, row_idx, col_idx);
        this._text = text;
    }
}

export function table_to_json(table: GTable): [string, string, string, number, number][][] {
    return table.map((record) => {
        return record.map(([key, value]) => {
            return [key.text, value.text, value.sheet, value.row, value.col];
        });
    });
}


export function flatten_to_json(table: GTable): string {
    const results = table.map((record) => {
        const result: any = {};
        for (const [key, value] of record) {
            if (result.hasOwnProperty(key.text)) {
                result[key.text] += value.text;
            } else {
                result[key.text] = value.text;
            }
        }
        return result;
    });
    return JSON.stringify(results);
}

export function getTierAsString(table: GTable, tier: string, delim: string = ", "): string {
    const results = table.map(record => {
        var result = "";
        for (const [key, value] of record) {
            if (key.text == tier) {     
                result = result + value.text;
            }
        }
        return result;
    });
    return results.join(delim);
}


class Transducer {
    
    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        return [input];
    }

    public get_prob(): number {
        return 1.0
    }

    public transduceMany(inputs: GParse[], randomize=false, max_results=-1): GParse[] {
        const results : GParse[] = [];
        for (const input of inputs) {
            for (const result of this.transduce(input, randomize, max_results)) {
                results.push(result);
            }
        } 
        return results;
    }
    
    /**
     * This is the main function that interfaces will call; it takes an
     * input table and, at the end, discards results with unconsumed input.
     * 
     * @param input 
     * @param symbol_table 
     * @returns parse 
     */
    public transduceFinal(input: GTable, 
                        randomize: boolean = false,
                        max_results: number = -1): GTable {

        var transducer = new FinalTransducer(this);
        var results: GTable = [];
        for (var input_record of input) {
            var input_parse: GParse = [input_record, 0.0, []];
            for (const [remnant, logprob, output] of transducer.transduce(input_parse, randomize, max_results)) {
                var prob: string = Math.exp(logprob).toString();
                output.push([new GCell("p"), new GCell(prob)])
                results.push(output);
            }
        }
        return results;
    }

    public generate(randomize: boolean = false,
                    max_results: number = -1): GTable {
        const input: GTable = make_table([[["",""]]]) // make an empty input to transduce from
        return this.transduceFinal(input, randomize, max_results);
    }
    
    public sample(n_results: number = 1): GTable {
        var num_failures = 0;
        var max_failures = 100 * n_results;
        var result: GTable = [];

        while (result.length < n_results) {
            const sample_result = this.generate(true, 1);
            if (sample_result.length == 0) {
                num_failures++;
            }
            if (num_failures > max_failures) {
                throw new Error("Failing to sample from grammar; try generating to see if has any output at all.");
            }
            for (const record of sample_result) {
                result.push(record);
            }
        }
        return result;
    }
}

class VarTransducer extends Transducer {

    
    public constructor(
        private value: GCell, 
        private symbol_table: SymbolTable) {

        super();
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        if (this.value.text.length == 0) {
            return [input];
        }
        const table = this.symbol_table.get(this.value.text);
        if (table == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        const transducer = transducer_from_table(table, this.symbol_table);
        return transducer.transduce(input, randomize, max_results);
    }
}

class InputTransducer extends Transducer {

    public constructor(
        private child: Transducer
    ) {
        super();
    }

    public transduce([input, logprob, past_output]: GParse, randomize=false, max_results=-1): GParse[] {
        const results : GParse[] = [];
        const trivial_input : GRecord = make_record([["",""]]) // make an empty input to transduce from
        for (const [_, newprob, output] of this.child.transduce([trivial_input, logprob, past_output], randomize, max_results)) {
            const new_input = [... input, ... output];
            results.push([new_input, newprob, []]);
        }
        return results;
    }
}

function winnow<T>(items: T[], f: (item: T) => boolean): [T[], T[]] {
    const trueResults : T[] = [];
    const falseResults : T[] = [];
    for (const item of items) {
        if (f(item)) {
            trueResults.push(item);
            continue;
        }
        falseResults.push(item);
        continue;
    }
    return [trueResults, falseResults];
}

function map_keys(items: GRecord, inKey: string, outKey: string): GRecord {
    return items.map(([key, value]) => {
        if (key.text != inKey) {
            return [key, value];
        }
        return [new GCell(outKey, key.sheet, key.row, key.col), value];
    })
}

/**
 * ShiftTransducer
 * 
 * "shift" is a unary transducer that simply copies the value on an input tier into an output tier.
 * E.g., "shift surf":"gloss" would copy "surf" tier of the input into the "gloss" tier of the output.
 * Often will be used for the same tier, e.g. "shift surf":"surf".
 */
class ShiftTransducer extends Transducer {

    public constructor(
        private toTier: GCell,
        private fromTier: GCell
    ) {
        super();
    }

    public transduce([input, logprob, past_output]: GParse, randomize=false, max_results=-1): GParse[] {
        var [output, remnant] = winnow(input, ([key, value]) => key.text == this.fromTier.text); // split entries into relevant and irrelevant
        output = map_keys(output, this.fromTier.text, this.toTier.text);
        return [[remnant, logprob, [...past_output, ...output]]];
    }
}

class FinalTransducer extends Transducer {

    public constructor(
        private child: Transducer
    ) {
        super();
    }

    public transduce(inputParses: GParse, randomize=false, max_results=-1): GParse[] {
        return this.child.transduce(inputParses, randomize, max_results).filter(([remnant, p, o]) => {
            return !remnant.some(([key, value]) => value.text.length > 0 );
        });
    }
}

class JoinTransducer extends Transducer {

    public constructor(
        private tier: GCell,
        private delim: GCell
    ) {
        super();
    }

    public transduce([input, logprob, past_output]: GParse, randomize=false, max_results=-1): GParse[] {
        const parts: string[] = [];
        const output = past_output.filter(([key, value]) => {
            if (key.text == this.tier.text) {
                parts.push(value.text);
                return false;
            }
            return true;
        });
        const flattenedString = parts.join(this.delim.text);
        const flattenedCell = new GCell(flattenedString, this.delim.sheet, this.delim.row, this.delim.col);
        output.push([this.tier, flattenedCell]);
        return [[input, logprob, output]];
    }
}

class AlternationTransducer extends Transducer {

    private children_and_weights: Array<[Transducer, number]> = [];

    public constructor(children: Transducer[]
    ) {
        super();
        var weights = children.map(child => child.get_prob());
        const weight_sum = weights.reduce((a,b) => a + b, 0);
        weights = weights.map(w => w / weight_sum);

        this.children_and_weights = children.map((child, i) => [child, weights[i]]);
    } 

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        const results: GParse[] = [];

        if (randomize) {
            var items: Iterable<[Transducer, number] | undefined > = new RandomPicker([...this.children_and_weights]);
        } else {
            var items: Iterable<[Transducer, number] | undefined > = this.children_and_weights;
        }

        for (var item  of items) {
            if (item == undefined) {
                throw new Error("Received an undefined output from RandomPicker.")
            }
            const [child, prob] = item;
            for (var [new_input, logprob, output] of child.transduce(input, randomize, max_results)) {
                logprob += Math.log(prob);
                results.push([new_input, logprob, output]);
                if (max_results > 0 && results.length == max_results) {
                    return results;
                }
            }
        }
        return results;
    }
}

class ProbTransducer extends Transducer {

    public constructor(
        private p: number
    ) { 
        super();
    }

    public get_prob(): number {
        return this.p;
    }
}

class MaybeTransducer extends Transducer {

    private child: Transducer;
    
    public constructor(child: Transducer) {
        super();
        this.child = new AlternationTransducer([child, new Transducer()]);
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        return this.child.transduce(input, randomize, max_results);
    }
}

class UpdownTransducer extends Transducer {

    private transducer: Transducer;
    private input_tier: string;
    private output_tier: string;

    public constructor(
        private key: GCell, 
        private value: GCell, 
        private symbol_table: SymbolTable, 
        private direction: "upward"|"downward"
    ) {
        super();
        if (direction == "upward") {
            this.input_tier = "down";
            this.output_tier = "up";
        } else {
            this.input_tier = "up";
            this.output_tier = "down";
        }
        
        const table = this.symbol_table.get(this.value.text);
        if (table == undefined) {
            throw new Error(`Could not find symbol: ${this.value.text}`);
        }
        this.transducer = transducer_from_table(table, this.symbol_table);
    }
    
    public apply_conversion(parse: GParse,  
            randomize: boolean = false,
            maxResults: number = -1): GParse[] {
        
        const [input, logprob, past_output] = parse;

        const record_is_complete = !input.some(([key, value]) => {
            return key.text == this.input_tier && value.text.length > 0; 
        });

        if (record_is_complete) {  // only parse incomplete ones, or else recurse forever
            return [parse];
        }
    
        var outputs = this.transducer.transduce(parse, randomize, maxResults);
        if (outputs.length == 0) {
            outputs = [ step_one_character(parse, this.input_tier, this.output_tier) ];
        } 
        
        var results: GParse[][] = outputs.map(output => this.apply_conversion(output, randomize, maxResults));
        return Array.prototype.concat.apply([], results);
    }

    public transduce(parse: GParse, randomize=false, max_results=-1): GParse[] {

        if (this.value.text.length == 0) {
            return [parse];
        }
        var [input, logprob, past_output] = parse;

        var wheat: GRecord = [];
        var chaff: GRecord = [];
        var input_source =  this.direction == "upward" ? input : past_output;
        for (const [key, value] of input_source) {
            if (key.text == this.key.text) {
                wheat.push([new GCell(this.input_tier), value]);
                continue;
            }
            chaff.push([key, value]);
        }

        
        var results: GParse[] = [];

        for (var [remnant, new_logprob, output] of this.apply_conversion([wheat, logprob, []], randomize, max_results)) {
            const result = [...chaff];
            for (const [key, value] of output) {
                if (key.text == this.output_tier) {
                    result.push([this.key, value]); // probably want to change this to the original key eventually,
                                                    // so that phonology doesn't mess up origin tracing.
                }
            }

            if (this.direction == "upward") {
                results.push([result, new_logprob, past_output]);
            } else {
                results.push([input, new_logprob, result]);
            }
        }
        return results;
    }
}

/*
function concat_entry([key, value]: GEntry, s: string): GEntry {
    return [key, new GCell(value.text + s, value.sheet, value.row, value.col)];
} */

class LiteralTransducer extends Transducer {

    public constructor(
        public key: GCell, 
        public value: GCell
    ) {
        super();
    }

    public transduce(parse: GParse, randomize=false, max_results=-1): GParse[] {

        if (this.value.text.length == 0) {
            return [parse];
        }

        const [input, logprob, past_output] = parse;

        var consumed_input: GRecord = [];

        var tier_found_in_input = false;
        var needle = this.value.text;

        for (const [key, value] of input) {
            if (key.text != this.key.text) { // not what we're looking for, move along
                consumed_input.push([key, value]);
                continue; 
            }
            tier_found_in_input = true;
        
            for (var i = 0; i < value.text.length; i++) {
                if (needle.length == 0) {
                    break;
                }

                if (value.text[i] != needle[0]) {
                    return [];
                }

                // it's a match
                needle = needle.slice(1);

            }

            if (needle.length == 0) {
                const remnant_str = value.text.slice(i);
                const remnant_cell = new GCell(remnant_str, value.sheet, value.row, value.col);
                consumed_input.push([key, remnant_cell]);
            }
        }

        if (tier_found_in_input && needle.length > 0) {
            return [];
        }

        var output = [...past_output];
        output.push([this.key, this.value]);
        /*
        for (const [key, value] of past_output) {
            if (key.text != this.key.text) { 
                output.push([key, value]);
                continue;
            }

            const new_str = value.text + this.value.text;
            const new_cell = new GCell(new_str, value.sheet, value.row, value.col);
            output.push([key, new_cell]);
            my_tier_found = true;
            continue;
        }

        if (!my_tier_found) {
            output.push([this.key, this.value]);
        } */

        return [[consumed_input, logprob, output]];
    }
}


class ConcatenationTransducer extends Transducer {


    public constructor(
        public children: Transducer[]
    ) {
        super();
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {

        var results = [input];
        for (const child of this.children) {
            var new_results: GParse[] = [];
            midloop: for (const result1 of results) {
                for (const result2 of child.transduce(result1, randomize, max_results)) {
                    new_results.push(result2);
                    if (max_results > 0 && new_results.length > max_results) {
                        break midloop;
                    }
                }
            }
            results = new_results;
        }  
        return results;
    }

    public get_prob(): number {
        return this.children.reduce((prod, child) => prod * child.get_prob(), 1.0);
    }
}

export function transducer_from_entry([key, value]: [GCell, GCell], symbol_table: SymbolTable): Transducer {

    const comma_separated_tiers = split_trim_lower(key.text, ",");

    if (comma_separated_tiers.length > 1) {
        var children = comma_separated_tiers.map(tier => {
            const new_key = new GCell(tier, key.sheet, key.col, key.row);
            return transducer_from_entry([new_key, value], symbol_table);
        });
        return new ConcatenationTransducer(children);
    }

    const keys = split_trim_lower(key.text);
    if (keys.length == 0) {
        throw new Error("Attempt to call a parser with no tier.");
    }

    if (keys[0] == "upward") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, symbol_table, "upward");
    }
 
    if (keys[0] == "downward") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, symbol_table, "downward");
    }

    if (keys[0] == "join") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new JoinTransducer(remnant, value);
    }

    if (keys[0] == "shift") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new ShiftTransducer(remnant, value);
    }

    if (keys[0] == "maybe") {
        const remnant = keys.slice(1).join(" ");
        const child_key = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducer_from_entry([child_key, value], symbol_table);
        return new MaybeTransducer(child);
    }

    if (keys[0] == "input") {
        const remnant = keys.slice(1).join(" ");
        const child_key = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducer_from_entry([child_key, value], symbol_table);
        return new InputTransducer(child);
    }

    if (keys[0] == "final") {
        const remnant = keys.slice(1).join(" ");
        const child_key = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducer_from_entry([child_key, value], symbol_table);
        return new FinalTransducer(child);
    }


    if (keys.length > 1) {
        throw new Error("Not a valid tier name: " + key.text);
    }

    if (keys[0] == "var") {
        return new VarTransducer(value, symbol_table);
    } 

    if (keys[0] == "p") {
        const p = parseFloat(value.text);
        return new ProbTransducer(p);
    }
    
    return new LiteralTransducer(key, value);
}

function transducer_from_record(record: GRecord, symbol_table: SymbolTable) {
    const children = record.map(entry => transducer_from_entry(entry, symbol_table));
    return new ConcatenationTransducer(children);
}

export function transducer_from_table(table: GTable, symbol_table: SymbolTable) {
    const children = table.map(record => transducer_from_record(record, symbol_table));
    return new AlternationTransducer(children);
}


function split_trim_lower(s: string, delim: string = " "): string[] {
    return s.split(delim).map(x => x.trim().toLowerCase());
}


/*
function map_keys_in_record(input: GRecord, f: (s: string) => string): GRecord {
    return input.map(([key, value]) => {
        const new_key = new GCell(f(key.text), key.sheet, key.row, key.col);
        return [new_key, value];
    });
}
*/

function step_one_character([input, logprob, past_output]: GParse, in_tier: string, out_tier: string): GParse {
    var consumed_input: GRecord = []; 
    var output: GRecord = [... past_output];
    var c_found = false;

    for (const [key, value] of input) {
        if (!c_found && key.text == in_tier && value.text.length > 0) {
            const c = value.text[0];
            const remnant = new GCell(value.text.slice(1), value.sheet, value.row, value.col);
            consumed_input.push([key, remnant]);
            const new_output_entry: GEntry = [new GCell(out_tier), new GCell(c, value.sheet, value.row, value.col)]
            output.push(new_output_entry);
            c_found = true;
            continue;
        }
        consumed_input.push([key, value]);
    }

    /* 
    var found_out_tier = false;
    for (const [key, value] of past_output) {
        if (key.text != out_tier) {
            output.push([key, value]);
            continue;
        }
        output.push(concat_entry([key, value], c));
        found_out_tier = true;
    } 

    if (!found_out_tier) {
        output.push([new GCell(out_tier), new GCell(c)]);
    } */

    return [consumed_input, logprob, output];
}

/*
function shuffle<T>(ar: T[]): T[] {
    ar = [...ar];
    var currentIndex = ar.length;
    var temporaryValue: T;
    var randomIndex: number;
  
    // While there remain elements to shuffle...
    while (0 !== currentIndex) {
  
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex -= 1;
  
      // And swap it with the current element.
      temporaryValue = ar[currentIndex];
      ar[currentIndex] = ar[randomIndex];
      ar[randomIndex] = temporaryValue;
    }
  
    return ar;
}
*/

export function make_record(cells: [string, string][]): GRecord {
    return cells.map(([key, value]) => [new GCell(key), new GCell(value)])
}


export function make_table(cells: [string, string][][]): GTable {
    return cells.map(record =>
        record.map(([key, value]) => [new GCell(key), new GCell(value)])
    );
}
