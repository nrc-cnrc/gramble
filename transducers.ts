
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
    parse(input: GTable, symbol_table: SymbolTable): GTable;
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

    public parse(input: GTable, symbol_table: SymbolTable): GTable {

        if (this.key.text == 'var') {
            // we're a VariableParser
            const parser = symbol_table.get(this._value.text);
            return parser.parse(input, symbol_table);
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

    public map_key(f: (s: string) => string): GRecord {
        const result = new GRecord();
        for (const entry of this) {
            result.push(entry.map_key(f));
        }
        return result;
    }

    public is_incomplete(): boolean {
        for (const entry of this) {
            if (entry.is_incomplete()) {
                return true;
            }
        }
        return false;
    }

    public trim(): GRecord {
        var result = new GRecord();
        for (const entry of this) {
            if (!entry.key.text.startsWith("_")) {
                result.push(entry);
            }
        }
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

    public parse(input: GTable, symbol_table: SymbolTable): GTable {
    
        for (const child of this) {
            const new_results = new GTable();
            for (const result2 of child.parse(input, symbol_table)) {
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

export function make_one_entry_record(key: string, value:string) {
    return make_record([[key,value]]);
}

export function make_one_record_table(entries: [string, string][]): GTable {
    var result = new GTable();
    result.push(make_record(entries));
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

    public map_key(f: (s: string) => string): GTable {
        const result = new GTable();
        for (const child of this) {
            result.push(child.map_key(f));
        }
        return result;
    }

    public parse(input: GTable, symbol_table: SymbolTable): GTable {
        var results = new GTable();
        for (const child of this) {
            for (const result of child.parse(input, symbol_table)) {
                results.push(result);
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
    public full_parse(input: GTable, symbol_table: SymbolTable): GTable {

        // add _ to the beginning of each tier string in the input
        input = input.map_key(function(s: string) { return "_" + s; });
        console.log("input = "+input);
        var results = new GTable();

        for (const result of this.parse(input, symbol_table)) {
            if (!result.is_incomplete()) {
                results.push(result.trim());
            }
        }
        return results;
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
            return;
        }
        table.push(record);
    }
}
