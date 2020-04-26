
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

    public append(text: string): void {
        this._text += text;
    }

    public map(f: (s: string) => string): GCell {
        return new GCell(f(this.text), this._sheet, this._row, this._col);
    }

    public clone(): GCell {
        return new GCell(this._text, this._sheet, this._row, this._col);
    }
}


interface ITransducer {
    parse(input: GTable, 
        symbol_table: SymbolTable,
        randomize: boolean,
        max_results: number): GTable;
}

/**
 * GEntry
 * 
 * An entry represents a key:value pair.
 * 
 * When interpreted as a transducer, a Record is treated as a Literal.
 */
export class GEntry implements ITransducer {

    private _key: GCell;
    private _value: GCell;

    public constructor(key: GCell, value: GCell) {
        this._key = key;
        this._value = value;
    }

    public get key(): GCell { return this._key; }
    public get value(): GCell { return this._value; }
    
    public clone(): GEntry {
        return new GEntry(this._key.clone(), this._value.clone());
    }

    public map_key(f: (s: string) => string): GEntry {
        return new GEntry(this._key.map(f), this._value);
    }

    public map_value(f: (s: string) => string): GEntry {
        return new GEntry(this._key, this._value.map(f));
    }

    public is_incomplete(): boolean {
        return this._key.text.startsWith("_") && this._value.text.length > 0;
    }

    public toString(): string {
        return this._key.toString() + ":" + this._value.toString();
    }

    public concat(s: string) {
        return new GEntry(this.key.clone(), new GCell(this.value.text + s));
    }

    public parse(input: GTable, 
                symbol_table: SymbolTable, 
                randomize: boolean = false,
                max_results: number = -1): GTable {

        if (this.key.text == 'var') {
            // we're a VariableParser
            const parser = symbol_table.get(this._value.text);
            return parser.parse(input, symbol_table, randomize, max_results);
        }

        var result_table = new GTable();

        outer_loop: for (const input_record of input) {
            var result_record = new GRecord();
            var my_tier_found = false;

            // the result is going to be each entry in the input, with the target string
            // parsed off every tier of the appropriate name.  if any tier with a matching 
            // name doesn't begin with this, then the whole thing fails.
            for (const entry of input_record) {

                if (entry.key.text == this.key.text) {
                    result_record.push(entry.concat(this.value.text));
                    my_tier_found = true;
                    continue;
                }

                if (entry.key.text != "_" + this.key.text) {
                    result_record.push(entry);
                    continue;  // not what we're looking for, move along 
                }

                if (!entry.value.text.startsWith(this.value.text)) {
                    // parse failed! 
                    continue outer_loop;
                }

                const remnant_str = entry.value.text.slice(this.value.text.length);
                const remnant_cell = new GCell(remnant_str);
                const remnant_entry = new GEntry(entry.key, remnant_cell);
                result_record.push(remnant_entry);
            }

            if (!my_tier_found) {
                result_record.push(this.clone());
            }

            result_table.push(result_record);
        }
        
        return result_table;
    }
}

/**
 * Record
 * 
 * A Record represnts a list of GEntries (key:value pairs); it's typically used as a dictionary 
 * but keep in mind it's ordered and also allows repeat keys.
 * 
 * When interpreted as a transducer, a Record is treated as a Concatenation of its entries,
 * in order.
 */

export class GRecord implements ITransducer, Iterable<GEntry> {

    private _entries : GEntry[] = [];

    public get entries(): GEntry[] {
        return this._entries;
    }

    public [Symbol.iterator](): Iterator<GEntry> {
        return this._entries[Symbol.iterator]();
    }

    public keys(): string[] {
        return this._entries.map(entry => {
            return entry.key.text;
        });
    }

    public values(): string[] {
        return this._entries.map(entry => {
            return entry.value.text;
        });
    }

    public map(f: (e: GEntry) => GEntry): GRecord {
        const result = new GRecord();
        result._entries = this._entries.map(f);
        return result;
    }

    public map_key(f: (s: string) => string): GRecord {
        return this.map(entry => {
            return entry.map_key(f);
        });
    }

    /**
     * Tests whether there are unconsumed remnants
     * @returns true if any entry is incomplete (represents an unconsumed remnant)
     */
    public is_incomplete(): boolean {
        return this._entries.some(entry => {
            return entry.is_incomplete();
        });
    }

    public trim(): GRecord {
        return this.filter(entry => {
            return !entry.key.text.startsWith("_");
        })
    }

    public filter(f: (e: GEntry) => boolean): GRecord {
        var result = new GRecord();
        result._entries = this._entries.filter(f);
        return result;
    }

    public has(tier: string): boolean {
        for (const entry of this) {
            if (entry.key.text == tier) {
                return true;
            }
        }
        return false;
    }

    public get(tier: string): string {
        for (const entry of this) {
            if (entry.key.text == tier) {
                return entry.value.text;
            }
        }
        throw new Error("Key not found: " + tier);
    }

    public clone(): GRecord {
        var result = new GRecord();
        for (const entry of this) {
            result.push(entry.clone());
        }
        return result;
    }

    public push(entry: GEntry): void {
        this._entries.push(entry);
    }

    public parse(input: GTable, 
        symbol_table: SymbolTable, 
        randomize: boolean = false,
        max_results: number = -1): GTable {
    
        for (const child of this) {
            const new_results = new GTable();
            for (const result2 of child.parse(input, symbol_table, randomize, max_results)) {
                if (max_results > 0 && new_results.length > max_results) {
                    break;
                }
                new_results.push(result2);
            }
            input = new_results;
        }
        return input;
    }

    public toString(): string {
        return this._entries.join(", ");
    }
}

export function make_entry(key: string, value: string): GEntry {
    return new GEntry(new GCell(key), new GCell(value));
}

export function make_one_entry_record(key: string, value:string): GRecord {
    return make_record([[key,value]]);
}

export function make_one_record_table(entries: [string, string][]): GTable {
    var result = new GTable();
    result.push(make_record(entries));
    return result;
}

export function make_one_entry_table(key: string, value: string): GTable {
    var result = new GTable();
    result.push(make_one_entry_record(key, value));
    return result;
}

/**
 * Convenience function for making a GRecord from [key,value] pairs.
 * @param entries Array of [key,value] pairs.
 * @returns record 
 */
export function make_record(entries: [string, string][]): GRecord {
    var result = new GRecord();
    for (const [key, value] of entries) {
        const entry = new GEntry(new GCell(key), new GCell(value));
        result.push(entry);
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

export class GTable implements ITransducer, Iterable<GRecord> {

    private _records : GRecord[] = [];

    public get records(): GRecord[] {
        return this._records;
    }

    public [Symbol.iterator](): Iterator<GRecord> {
        return this._records[Symbol.iterator]();
    }

    public push(record: GRecord) {
        this._records.push(record);
    }

    public get length(): number {
        return this._records.length;
    }

    public truncate(max_records: number): GTable {
        const result = new GTable();
        for (const record of this) {
            result.push(record);
            if (result.length >= max_records) {
                break;
            }
        }
        return result;
    }

    public map_key(f: (s: string) => string): GTable {
        return this.map(record => {
            return record.map_key(f);
        });
    }

    public map(f: (r: GRecord) => GRecord): GTable {
        const result = new GTable();
        result._records = this._records.map(f);
        return result;
    }

    public parse(input: GTable, 
                symbol_table: SymbolTable, 
                randomize: boolean = false,
                max_results: number = -1): GTable {
        var results = new GTable();
        var children = this._records;
        if (randomize) {
            children = shuffle(children);
        }
        for (const child of children) {
            for (const result of child.parse(input, symbol_table, randomize, max_results)) {
                results.push(result);
                if (max_results > 0 && results.length > max_results) {
                    return results.truncate(max_results);
                }
            }
        }
        return results;
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
    public full_parse(input: GTable, 
                        symbol_table: SymbolTable,
                        randomize: boolean = false,
                        max_results: number = -1): GTable {

        // add _ to the beginning of each tier string in the input
        input = input.map_key(function(s: string) { return "_" + s; });
        var results = new GTable();
        for (const result of this.parse(input, symbol_table, randomize, max_results)) {
            if (!result.is_incomplete()) {
                results.push(result.trim());
            }
        }
        return results;
    }

    public generate(symbol_table: SymbolTable): GTable {
        const input = make_one_entry_table('','');
        return this.full_parse(input, symbol_table);
    }
    
    public sample(symbol_table: SymbolTable, n_results: number = 1): GTable {
        const input = make_one_entry_table('','');
        var num_failures = 0;
        var max_failures = 100 * n_results;
        var result = new GTable();

        while (result.length < n_results) {
            const sample_result = this.full_parse(input, symbol_table, true, 1);
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

    public toString(): string {
        return this._records.join("\n");
    }
}

export class SymbolTable {

    private _symbols : Map<string, GTable> = new Map();

    public new_symbol(name: string) {
        this._symbols.set(name, new GTable());
    }

    public all_symbol_names(): string[] {
        return Array.from(this._symbols.keys());
    }

    public has_symbol(name: string): boolean {
        return this._symbols.has(name);
    }

    public get(name: string): GTable {
        const table = this._symbols.get(name);
        if (table == undefined) {
            throw new Error("Cannot find symbol " + name + " in symbol table");
        } 
        return table;
    }

    public add_to_symbol(name: string, record: GRecord) {
        var table = this._symbols.get(name);
        if (table == undefined) {
            throw new Error("Cannot find symbol " + name + " in symbol table");
        }
        table.push(record);
    }
}
