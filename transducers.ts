import { getEnabledCategories } from "trace_events";

export type GEntry = [GCell, GCell];
export type GRecord = GEntry[];
export type GParse = [GRecord, GRecord];
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

    public toString(): string { return this._text; }
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


interface Transducer {
    transduce(input: GParse,
        randomize: boolean,
        max_results: number): GParse[];
}

class VarTransducer implements Transducer {

    private _value: GCell;
    private _symbol_table: SymbolTable;
    
    public constructor(value: GCell, symbol_table: SymbolTable) {
        this._value = value;
        this._symbol_table = symbol_table;
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        if (this._value.text.length == 0) {
            return [input];
        }
        const table = this._symbol_table.get(this._value.text);
        if (table == undefined) {
            throw new Error(`Could not find symbol: ${this._value.text}`);
        }
        const transducer = transducer_from_table(table, this._symbol_table);
        return transducer.transduce(input, randomize, max_results);
    }
}

class FinalTransducer implements Transducer {

    public transduce([input, past_output]: GParse, randomize=false, max_results=-1): GParse[] {
        const input_is_consumed = !input.some(([key, value]) => value.text.length > 0 );
        if (input_is_consumed) {
            return [[input, past_output]];
        }
        return [];
    }
}

class AlternationTransducer implements Transducer {

    private _children: Transducer[];

    public constructor(children: Transducer[]) {
        this._children = children;
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        const results: GParse[] = [];
        var children = [...this._children];
        if (randomize) {
            children = shuffle(children);
        }

        for (const child of children) {
            for (const result of child.transduce(input, randomize, max_results)) {
                results.push(result);
                if (max_results > 0 && results.length == max_results) {
                    return results;
                }
            }
        }
        return results;
    }
}

class NullParser implements Transducer {
    
    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        return [input];
    }
}

class MaybeTransducer implements Transducer {

    private _child: Transducer;
    
    public constructor(child: Transducer) {
        this._child = new AlternationTransducer([child, new NullParser()]);
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {
        return this._child.transduce(input, randomize, max_results);
    }
}

class UpdownTransducer implements Transducer {

    private _key: GCell;
    private _value: GCell;
    private _input_tier: string;
    private _output_tier: string;
    private _symbol_table: SymbolTable;
    private _direction: string;

    public constructor(key: GCell, 
                        value: GCell, 
                        symbol_table: SymbolTable, 
                        direction: "upward"|"downward") {
        this._key = key;
        this._value = value;
        this._direction = direction;
        if (direction == "upward") {
            this._input_tier = "down";
            this._output_tier = "up";
        } else {
            this._input_tier = "up";
            this._output_tier = "down";
        }
        this._symbol_table = symbol_table;
    }
    
    public apply_conversion(transducer: Transducer,
        parse: GParse,  
        randomize: boolean = false): GParse[] {
        
        const [input, past_output] = parse;

        const record_is_complete = !input.some(([key, value]) => {
            return key.text == this._input_tier && value.text.length > 0; 
        });

        if (record_is_complete) {  // only parse incomplete ones, or else recurse forever
            return [parse];
        }
    
        var outputs = transducer.transduce(parse, randomize, -1);
        if (outputs.length == 0) {
            outputs = [ step_one_character(parse, this._input_tier, this._output_tier) ];
        } 
        
        var results: GParse[][] = outputs.map(output => this.apply_conversion(transducer, output));

        // Flatten the results array:
        return Array.prototype.concat.apply([], results);
    }

    public transduce(parse: GParse, randomize=false, max_results=-1): GParse[] {

        if (this._value.text.length == 0) {
            return [parse];
        }
        var [input, past_output] = parse;

        var wheat: GEntry[] = [];
        var chaff: GEntry[] = [];
        var input_source =  this._direction == "upward" ? input : past_output;
        for (const [key, value] of input_source) {
            if (key.text == this._key.text) {
                wheat.push([new GCell(this._input_tier), value]);
                continue;
            }
            chaff.push([key, value]);
        }

        const parser = this._symbol_table.get(this._value.text);
        if (parser == undefined) {
            throw new Error(`Could not find symbol: ${this._value.text}`);
        }

        const transducer = transducer_from_table(parser, this._symbol_table);
        
        var results: GParse[] = [];

        for (var [remnant, output] of this.apply_conversion(transducer, [wheat, []], randomize)) {
            
            for (const [key, value] of output) {
                if (key.text == this._output_tier) {
                    chaff.push([this._key, value]); // probably want to change this to the original key eventually,
                                                    // so that phonology doesn't mess up origin tracing.
                }
            }

            if (this._direction == "upward") {
                results.push([chaff, past_output]);
            } else {
                results.push([input, chaff]);
            }
        }
        
        return results;
    }
}

function concat_entry([key, value]: GEntry, s: string): GEntry {
    return [key, new GCell(value.text + s, value.sheet, value.row, value.col)];
}


class LiteralTransducer implements Transducer {

    private _key: GCell;
    private _value: GCell;

    public constructor(key: GCell, value: GCell) {
        this._key = key;
        this._value = value;
    }

    public transduce(parse: GParse, randomize=false, max_results=-1): GParse[] {

        if (this._value.text.length == 0) {
            return [parse];
        }

        const [input, past_output] = parse;

        var consumed_input: GRecord = [];
        var output: GRecord = [];

        var my_tier_found = false;

        for (const [key, value] of input) {
            if (key.text != this._key.text) { // not what we're looking for, move along
                consumed_input.push([key, value]);
                continue; 
            }
            if (!value.text.startsWith(this._value.text)) { // parse failed!
                return [];
            }

            const remnant_str = value.text.slice(this._value.text.length);
            const remnant_cell = new GCell(remnant_str, value.sheet, value.row, value.col);
            consumed_input.push([key, remnant_cell]);
        }

        for (const [key, value] of past_output) {
            if (key.text != this._key.text) { 
                output.push([key, value]);
                continue;
            }

            const new_str = value.text + this._value.text;
            const new_cell = new GCell(new_str, value.sheet, value.row, value.col);
            output.push([key, new_cell]);
            my_tier_found = true;
            continue;
        }

        if (!my_tier_found) {
            output.push([this._key, this._value]);
        }
    
        return [[consumed_input, output]];
    }
}


class ConcatenationTransducer implements Transducer {

    private _children: Transducer[];

    public constructor(public children: Transducer[]) {
        this._children = children;
    }

    public transduce(input: GParse, randomize=false, max_results=-1): GParse[] {

        var results = [input];
        for (const child of this._children) {
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
}

function transducer_from_entry([key, value]: [GCell, GCell], symbol_table: SymbolTable): Transducer {

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

    if (keys[0] == "maybe") {
        const remnant = keys.slice(1).join(" ");
        const child_key = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducer_from_entry([child_key, value], symbol_table);
        return new MaybeTransducer(child);
    }

    if (keys.length > 1) {
        throw new Error("Not a valid tier name: " + key.text);
    }

    if (keys[0] == "var") {
        return new VarTransducer(value, symbol_table);
    } 
    
    return new LiteralTransducer(key, value);
}

function transducer_from_record(record: GRecord, symbol_table: SymbolTable) {
    const children = record.map(entry => transducer_from_entry(entry, symbol_table));
    return new ConcatenationTransducer(children);
}

function transducer_from_table(table: GTable, symbol_table: SymbolTable) {
    const children = table.map(record => transducer_from_record(record, symbol_table));
    return new AlternationTransducer(children);
}


function split_trim_lower(s: string, delim: string = " "): string[] {
    return s.split(delim).map(x => x.trim().toLowerCase());
}



function map_keys_in_record(input: GRecord, f: (s: string) => string): GRecord {
    return input.map(([key, value]) => {
        const new_key = new GCell(f(key.text), key.sheet, key.row, key.col);
        return [new_key, value];
    });
}

function step_one_character([input, past_output]: GParse, in_tier: string, out_tier: string): GParse {
    var consumed_input: GRecord = []; 
    var c = "";
    for (const [key, value] of input) {
        if (key.text == in_tier && value.text.length > 0) {
            c = value.text[0];
            const remnant = new GCell(value.text.slice(1), value.sheet, value.row, value.col);
            consumed_input.push([key, remnant]);
            continue;
        }
        consumed_input.push([key, value]);
    }
    var output: GRecord = []; 
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
    }
    return [consumed_input, output];
}


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


export function make_table(cells: [string, string][][]): GTable {
    return cells.map(record =>
        record.map(([key, value]) => [new GCell(key), new GCell(value)])
    );
}

export class GGrammar {

    private _table: GTable;

    public constructor(table: GTable) {
        this._table = table;
    }

    /**
     * This is the main function that interfaces will call; it takes an
     * undoctered input table (e.g. with input tiers just being strings like "text"
     * rather than "_text") and, at the end, discards results with unconsumed input.
     * 
     * @param input 
     * @param symbol_table 
     * @returns parse 
     */
    public transduce(input: GTable, 
                        symbol_table: SymbolTable,
                        randomize: boolean = false,
                        max_results: number = -1): GTable {

        const transducer = new ConcatenationTransducer([ transducer_from_table(this._table, symbol_table),
                                                    new FinalTransducer() ]);

        // add _ to the beginning of each tier string in the input
        //input = input.map_key(function(s: string) { return "_" + s; });
        var results: GTable = [];
        for (var input_record of input) {
            //input_record = map_keys_in_record(input_record, s => "_" + s);

            var input_parse: GParse = [input_record, []];
            for (const [remnant, output] of transducer.transduce(input_parse, randomize, max_results)) {
                /* const result_is_complete = !remnant.some(([key, value]) => value.text.length > 0 );
                if (result_is_complete) {
                    results.push(output);
                } */
                results.push(output);
            }
        }
        return results;
    }

    public generate(symbol_table: SymbolTable,
                    randomize: boolean = false,
                    max_results: number = -1): GTable {
        const input: GTable = make_table([[["",""]]]) // make an empty input to transduce from
        return this.transduce(input, symbol_table, randomize, max_results);
    }
    
    public sample(symbol_table: SymbolTable, n_results: number = 1): GTable {
        var num_failures = 0;
        var max_failures = 100 * n_results;
        var result: GTable = [];

        while (result.length < n_results) {
            const sample_result = this.generate(symbol_table, true, 1);
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
