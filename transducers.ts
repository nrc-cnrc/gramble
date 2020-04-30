
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
    transduce(input: GRecord, 
        symbol_table: SymbolTable,
        randomize: boolean,
        max_results: number): GRecord[];
}

class VarTransducer implements Transducer {

    private _value: GCell;
    
    public constructor(value: GCell) {
        this._value = value;
    }

    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {
        if (this._value.text.length == 0) {
            return [input];
        }
        const table = symbol_table.get(this._value.text);
        const transducer = transducer_from_table(table);
        
        return transducer.transduce(input, symbol_table, randomize, max_results);
    }
}

class AlternationTransducer implements Transducer {

    private _children: Transducer[];

    public constructor(children: Transducer[]) {
        this._children = children;
    }

    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {
        const results: GRecord[] = [];
        var children = [...this._children];
        if (randomize) {
            children = shuffle(children);
        }
        for (const child of children) {
            for (const result of child.transduce(input, symbol_table, randomize, max_results)) {
                results.push(result);
                if (max_results > 0 && results.length > max_results) {
                    return results.slice(0, max_results);
                }
            }
        }
        return results;
    }
}

class NullParser implements Transducer {
    
    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {
        return [input];
    }
}

class MaybeTransducer implements Transducer {

    private _child: Transducer;
    
    public constructor(child: Transducer) {
        this._child = new AlternationTransducer([child, new NullParser()]);
    }

    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {
        return this._child.transduce(input, symbol_table, randomize, max_results);
    }
}

class UpdownTransducer implements Transducer {

    private _key: GCell;
    private _value: GCell;
    private _input_tier: string;
    private _output_tier: string;

    public constructor(key: GCell, value: GCell, input_tier: string, output_tier: string) {
        this._key = key;
        this._value = value;
        this._input_tier = input_tier;
        this._output_tier = output_tier;
    }
    
    public apply_conversion(converter: Transducer,
        input: GRecord, 
        symbol_table: SymbolTable, 
        input_tier: string = "up",
        output_tier: string = "down"): GRecord[] {
        
        const record_is_complete = !input.some(([key, value]) => {
            return key.text == "_" + input_tier && value.text.length > 0;
        });

        if (record_is_complete) {  // only parse incomplete ones, or else recurse forever
            return [input];
        }

        var outputs = converter.transduce(input, symbol_table, false, -1);

        if (outputs.length == 0) {
            outputs = [ step_one_character(input, input_tier, output_tier) ];
        } 

        var results = [];
        for (const output of outputs) {
            for (const recursed_record of this.apply_conversion(converter, output, 
                                                    symbol_table,
                                                    input_tier,
                                                    output_tier)) {
                results.push(recursed_record);
            }
        }
        return results;
    }

    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {

        if (this._value.text.length == 0) {
            return [input];
        }

        input = map_keys_in_record(input, s => {   // map the target tier to the input for conversion, e.g. "_up"
            return (s == this._key.text) ? "_" + this._input_tier : s;  
        })

        const parser = symbol_table.get(this._value.text);
        const transducer = transducer_from_table(parser);
        
        var results: GRecord[] = [];

        for (var result of this.apply_conversion(transducer, input, symbol_table, this._input_tier, this._output_tier)) {
            result = map_keys_in_record(result, s => {  // map the output tier, e.g. "down", to the target tier
                return (s == this._output_tier) ? this._key.text : s;
            }).filter(([key, value]) => {               // and filter out leftover tiers from the conversion, e.g. "in" and "_in"
                return key.text != this._input_tier && key.text != "_" + this._input_tier
            })
            results.push(result);
        }
        return results;
    }
}

export type GEntry = [GCell, GCell];

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

    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {

        if (this._value.text.length == 0) {
            return [input];
        }

        var result_record: GRecord = [];
        var my_tier_found = false;

        // the result is going to be each entry in the input, with the target string
        // parsed off every tier of the appropriate name.  if any tier with a matching 
        // name doesn't begin with this, then the whole thing fails.
        for (const [key, value] of input) {

            if (key.text == this._key.text) {
                result_record.push(concat_entry([key, value], this._value.text))
                my_tier_found = true;
                continue;
            }

            if (key.text != "_" + this._key.text) {
                result_record.push([key, value]);
                continue;  // not what we're looking for, move along 
            }

            if (!value.text.startsWith(this._value.text)) {
                // parse failed! 
                return [];
            }

            const remnant_str = value.text.slice(this._value.text.length);
            const remnant_cell = new GCell(remnant_str, value.sheet, value.row, value.col);
            result_record.push([key, remnant_cell]);
        }

        if (!my_tier_found) {
            result_record.push([this._key, this._value]);
        }
    
        return [result_record];
    }
}


class ConcatenationTransducer implements Transducer {

    private _children: Transducer[];

    public constructor(public children: Transducer[]) {
        this._children = children;
    }

    public transduce(input: GRecord, symbol_table: SymbolTable, randomize=false, max_results=-1): GRecord[] {

        var results = [input];
        for (const child of this._children) {
            var new_results: GRecord[] = [];
            midloop: for (const result1 of results) {
                for (const result2 of child.transduce(result1, symbol_table, randomize, max_results)) {
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

function transducer_from_entry([key, value]: [GCell, GCell]): Transducer {

    const comma_separated_tiers = split_trim_lower(key.text, ",");

    if (comma_separated_tiers.length > 1) {
        var children = comma_separated_tiers.map(tier => {
            const new_key = new GCell(tier, key.sheet, key.col, key.row);
            return transducer_from_entry([new_key, value]);
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
        const remnant = new GCell("_" + keys[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, "down", "up");
    }
 
    if (keys[0] == "downward") {
        if (keys.length > 2) {
            throw new Error("Invalid tier name: " + key.text);
        }
        const remnant = new GCell(keys[1], key.sheet, key.row, key.col);
        return new UpdownTransducer(remnant, value, "up", "down");
    }

    if (keys[0] == "maybe") {
        const remnant = keys.slice(1).join(" ");
        const child_key = new GCell(remnant, key.sheet, key.row, key.col);
        const child = transducer_from_entry([child_key, value]);
        return new MaybeTransducer(child);
    }

    if (keys.length > 1) {
        throw new Error("Not a valid tier name: " + key.text);
    }

    if (keys[0] == "var") {
        return new VarTransducer(value);
    } 
    
    return new LiteralTransducer(key, value);
}

function transducer_from_record(record: GRecord) {
    return new ConcatenationTransducer(record.map(transducer_from_entry));
}

function transducer_from_table(table: GTable) {
    return new AlternationTransducer(table.map(transducer_from_record));
}


function split_trim_lower(s: string, delim: string = " "): string[] {
    return s.split(delim).map(x => x.trim().toLowerCase());
}


export type GRecord = GEntry[];

export function get_tier(record: GRecord, tier: string): string {
    for (const [key, value] of record) {
        if (key.text == tier) {
            return value.text;
        }
    }
    return "";
}

function map_keys_in_record(input: GRecord, f: (s: string) => string): GRecord {
    return input.map(([key, value]) => {
        const new_key = new GCell(f(key.text), key.sheet, key.row, key.col);
        return [new_key, value];
    });
}

function step_one_character(input: GRecord, in_tier: string, out_tier: string): GRecord {
    var temp: GRecord = []; 
    var c = "";
    for (const [key, value] of input) {
        if (key.text == "_" + in_tier && value.text.length > 0) {
            c = value.text[0];
            const remnant = new GCell(value.text.slice(1), value.sheet, value.row, value.col);
            temp.push([key, remnant]);
            continue;
        }
        temp.push([key, value]);
    }
    var result: GRecord = []; 
    var found_out_tier = false;
    for (const [key, value] of temp) {
        if (key.text != out_tier) {
            result.push([key, value]);
            continue;
        }
        result.push(concat_entry([key, value], c));
        found_out_tier = true;
    }

    if (!found_out_tier) {
        result.push([new GCell(out_tier), new GCell(c)]);
    }

    return result;
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

export type GTable = GRecord[];

export type SymbolTable = Map<string, GTable>;

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

        const transducer = transducer_from_table(this._table);

        // add _ to the beginning of each tier string in the input
        //input = input.map_key(function(s: string) { return "_" + s; });
        var results: GTable = [];
        for (var input_record of input) {
            input_record = map_keys_in_record(input_record, s => "_" + s);
            for (const result of transducer.transduce(input_record, symbol_table, randomize, max_results)) {
                const result_is_complete = !result.some(([key, value]) => {
                    return key.text.startsWith("_") && value.text.length > 0;
                });
                if (result_is_complete) {
                    results.push(result.filter(([key, value]) => value.text.length > 0));
                }
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
