import {GCell, GEntry, GRecord, GTable, SymbolTable, GGrammar} from "./transducers"

/**
 * Determines whether a line is empty
 * @param row A list of strings, representing the cell text along that row
 * @returns True if the line is empty
 */

function is_line_empty(row: string[]): boolean {
    if (row.length == 0) {
        return true;
    }

    for (let cell_text of row) {
        if (cell_text.trim().length != 0) {
            return false;
        }
    }

    return true;
}


/**
 * IHighlighter
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an IHighlighter instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the IHighlighter instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface IHighlighter {
    mark_error(sheet: string, row: number, col: number, msg: string, level: "error"|"warning"|"info"): void;
    mark_tier(sheet: string, row: number, col: number, tier: string): void;
    mark_comment(sheet: string, row: number, col: number): void;
    mark_header(sheet: string, row: number, col: number, tier: string): void;
    mark_command(sheet: string, row: number, col: number): void;
    set_color(tier_name: string, color: string): void;
    highlight(): void;
    alert(msg: string): void;
}

const REQUIRED_COLORS: string[] = [
    "red", "orange", "yellow", 
    "chartreuse", "green", "aqua", 
    "cyan", "blue", "indigo",
    "violet", "magenta", "burgundy"
];


function is_valid_color(color_name: string): boolean {
    if (color_name.trim().length == 0) {
        return false;
    }

    for (let subcolor of color_name.split("-")) {
        if (REQUIRED_COLORS.indexOf(subcolor.trim()) < 0) {
            return false;
        }
    }

    return true;
}

/**
 * GFunction
 * 
 * A GFunction is what is created when the programmer places text in the first column of the
 * sheet.  GFunctions guide the interpretation of following rows, both the name of the function that
 * should be executed (e.g. "add" a record to a symbol or add a "test" to a symbol) and the interpretation
 * of positional arguments (e.g. that the third column should be "text", the second column should be "down", etc.)
 */
abstract class GFunction {
    protected _name: GCell;
    protected _symbol: GCell | undefined;
    protected _params: GCell[] = [];
    protected _columns: Map<number, GCell> = new Map();

    public constructor(name: GCell) {
        this._name = name;
    }

    public add_params(cells: GCell[], highlighter: IHighlighter): void {

        var cell_buffer: GCell[] = [];

        for (let cell of cells) {
            cell_buffer.push(cell);
            if (cell.text.length == 0) {
                continue;
            }

            for (const param of cell_buffer) {
                highlighter.mark_header(cell.sheet, cell.row, cell.col, cell.text);
                if (param.text.length == 0) {
                    continue;
                }
                this._params.push(param);
                this._columns.set(param.col, param);
            }
        }
    }

    public has_column(col_idx: number): boolean {
        return this._columns.has(col_idx);
    }

    public get_param(col_idx: number): GCell {
        const result =  this._columns.get(col_idx);
        if (result == undefined) {
            throw new RangeError("Column index " + col_idx + " not found");
        }
        return result;
    }

    public associate_params(cells: GCell[]): GRecord {
        var record: GRecord = []; 
        for (const cell of cells) {
            const key = this.get_param(cell.col);
            record.push([key, cell]);
        }
        return record;
    }

    public abstract call(cells: GCell[], project: Project): void;

    /**
     * Many functions assign or append their results to the most recently declared symbol.
     * @param GCell 
     */
    public set_symbol(symbol: GCell) {
        this._symbol = symbol;
    }
}


class TableFunction extends GFunction {

    public constructor(name: GCell, symbol: GCell | undefined) {
        super(name);
        if (symbol == undefined) {
            return;
        }
        this.set_symbol(symbol);
    }

    public call(cells: GCell[], project: Project): void {
        if (this._symbol == undefined) {
            throw new Error("Attempted to call table function without active symbol");
        }
        const record = this.associate_params(cells);
        project.add_record_to_symbol(this._symbol.text, record);
    }
}

class TestFunction extends GFunction {

    public constructor(name: GCell, symbol: GCell | undefined) {
        super(name);
        if (symbol == undefined) {
            return;
        }
        this.set_symbol(symbol);
    }

    public call(cells: GCell[], project: Project): void {
        if (this._symbol == undefined) {
            throw new Error("Attempted to call table function without active symbol");
        }
        const record = this.associate_params(cells);
        project.add_test_to_symbol(this._symbol.text, record);
    }
}


function make_function(name: GCell, 
                       current_symbol: GCell | undefined, 
                       highlighter: IHighlighter): GFunction {

    if (name.text == 'add') {

        if (current_symbol == undefined) {
            highlighter.mark_error(name.sheet, name.row, name.col, 
                "This command is not preceded by a symbol. " +
                " If you don't assign it to a symbol, it will be ignored.", "warning");
        }
        return new TableFunction(name, current_symbol);
    } else if (name.text == "test") {
        if (current_symbol == undefined) {
            highlighter.mark_error(name.sheet, name.row, name.col, 
                "This test command is not preceded by a symbol. " +
                " Tests without a symbol will not execute", "warning");
        }
        return new TestFunction(name, current_symbol);
    }

    // it's not a reserved word, so it's a new symbol
    return new TableFunction(name, name);
}

const BUILT_IN_FUNCTIONS: string[] = [
    "add",
    "test"
]


/**
 * Project
 * 
 * A project represents a possibly multi-sheet program (e.g. one that exists across
 * multiple worksheets inside a single spreadsheet).  You pass unstructured sheets to it
 * (in the form of string[][] representing the cells of that sheet) and it parses them into
 * parsers and manages the symbol table.
 * 
 * It also serves as an Edifice (in the 
 * design pattern sense) for clients: rather than asking for a parser object and calling parse()
 * on it directly, you just have a Project instance and call parse(symbol_name, input).
 */
export class Project {
    private _current_function: GFunction | undefined = undefined;
    private _current_symbol: GCell | undefined = undefined;

    private _symbol_table: Map<string, GTable> = new Map();
    private _test_table: Map<string, GTable> = new Map();

    public has_symbol(name: string): boolean {
        return this._symbol_table.has(name);
    }

    public all_symbols(): Iterator<string> {
        return this._symbol_table.keys();
    }

    public add_record_to_symbol(name: string, record: GRecord) {
        if (!this._symbol_table.has(name)) {
            throw new Error("Cannot find symbol " + name + " in symbol table");
        }
        this._symbol_table.get(name).push(record);
    }

    public add_test_to_symbol(name: string, record: GRecord) {
        if (!this._test_table.has(name)) {
            throw new Error("Cannot find symbol " + name + " in test table");
        }
        this._test_table.get(name).push(record);
    }
    
    public parse(symbol_name: string, input: GTable): GTable {
        if (!this._symbol_table.has(symbol_name)) {
            throw new Error("Cannot find symbol " + symbol_name + " in symbol table");
        }
        const table = this._symbol_table.get(symbol_name);
        const parser = new GGrammar(table);
        return parser.transduce(input, this._symbol_table);
    }

    public generate(symbol_name: string): GTable {
        if (!this._symbol_table.has(symbol_name)) {
            throw new Error("Cannot find symbol " + symbol_name + " in symbol table");
        }

        const table = this._symbol_table.get(symbol_name);
        const parser = new GGrammar(table);
        return parser.generate(this._symbol_table);
    }

    public sample(symbol_name: string, n_results: number = 1): GTable {
        if (!this._symbol_table.has(symbol_name)) {
            throw new Error("Cannot find symbol " + symbol_name + " in symbol table");
        }

        const table = this._symbol_table.get(symbol_name);
        const parser = new GGrammar(table);
        return parser.sample(this._symbol_table, n_results);
    }

    public contains_result(result_table: GTable, [target_key, target_value]: GEntry) {
        for (const result_record of result_table) {
            for (const [result_key, result_value] of result_record) {
                if (result_key.text != target_key.text) {
                    continue;
                }
                if (result_value.text == target_value.text) {
                    return true;
                }
            }
        }
        
        if (target_value.text.length == 0) {
            return true;  // if there's no output, and no output is expected, we're good!
        }
        return false;
    }

    public equals_result(result_table: GTable, [target_key, target_value]: GEntry) {
        var found = false;
        for (const result_record of result_table) {
            for (const [key, value] of result_record) {
                if (key.text != target_key.text) {
                    continue;
                }
                if (value.text == target_value.text) {
                    found = true;
                    continue;
                }
                return false;
            }
        }
        if (!found && target_value.text.length == 0) {
            return true;  // if there's no output, and no output is expected, we're good!
        }
        return found;
    }


    public run_tests(highlighter: IHighlighter): void {
        for (const [symbol_name, test_table] of this._test_table.entries()) {
            for (const record of test_table) {
                const input_record: GRecord = []; 
                const contains_record: GRecord = []; 
                const equals_record: GRecord = []; 
                
                for (const [key, value] of record) {
                    var parts = key.text.split(" ");
                    if (parts.length != 2) {
                        highlighter.mark_error(key.sheet, key.row, key.col,
                            "Invalid test tier: " + key.text, "error");
                        continue;
                    }
                    const command = parts[0].trim();
                    const tier = parts[1].trim();
                    if (command == "input") {
                        input_record.push([new GCell(tier), value]);
                    } else if (command == "contains") {
                        contains_record.push([new GCell(tier), value]);
                    } else if (command == "equals") {
                        equals_record.push([new GCell(tier), value]);
                    }
                }
                
                const input: GTable = [];
                input.push(input_record);
                const result = this.parse(symbol_name, input);
                
                for (const [target_key, target_value] of contains_record) {
                    if (!this.contains_result(result, [target_key, target_value])) {
                        highlighter.mark_error(target_value.sheet, target_value.row, target_value.col,
                            "Result does not contain specified value. " + 
                            "Actual value: \n" + result.toString(), "error");
                    } else {
                        highlighter.mark_error(target_value.sheet, target_value.row, target_value.col,
                            "Result contains specified value: \n" + result.toString(), "info");
                    }
                }

                for (const [target_key, target_value] of equals_record) {
                    if (!this.equals_result(result, [target_key, target_value])) {
                        highlighter.mark_error(target_value.sheet, target_value.row, target_value.col,
                            "Result does not equal specified value. " + 
                            "Actual value: \n" + result.toString(), "error");
                    } else {
                        highlighter.mark_error(target_value.sheet, target_value.row, target_value.col,
                            "Result equals specified value: \n" + result.toString(), "info");
                    }
                }
            }
        }
    }

    private add_row(cells: GCell[], highlighter: IHighlighter): void {
        if (cells.length == 0) {
            // if it's empty (shouldn't happen, but just in case)
            return;
        }

        let first_cell = cells[0]
        let first_cell_text = first_cell.text.trim();

        if (first_cell_text.startsWith('#')) {  // the row's a comment
            for (const cell of cells) {
                if (cell.text.length == 0) {
                    continue;
                }
                highlighter.mark_comment(cell.sheet, cell.row, cell.col);
            }
            return;
        }

        if (first_cell_text.length > 0) {
            if (BUILT_IN_FUNCTIONS.indexOf(first_cell_text) < 0) {
                // it's not a built-in function/keyword, so treat it as a new symbol
                this._current_symbol = first_cell;
                this._symbol_table.set(first_cell_text, []);
                this._test_table.set(first_cell_text, []);
            }
            this._current_function = make_function(first_cell, this._current_symbol, highlighter);
            this._current_function.add_params(cells.slice(1), highlighter);
            highlighter.mark_command(first_cell.sheet, first_cell.row, first_cell.col);
            return;
        }

        // if none of the above are true, this row represents args to the previous function

        // first make sure there IS a function active
        if (this._current_function == undefined) {
            // shouldn't have args when there's no function.  mark them all as errors
            for (const cell of cells.slice(1)) { 
                if (cell.text.length > 0) {
                    highlighter.mark_error(cell.sheet, cell.row, cell.col, 
                        "Unclear what this cell is here for. " + 
                        "Did you forget a function?", "warning");
                }
            }
            return;
        }

        var args: GCell[] = [];  // a place to hold valid args; don't want to call the function
                                 // with args that (e.g.) don't correspond to a parameter
        for (const cell of cells.slice(1)) { 
            if (!this._current_function.has_column(cell.col)) {
                if (cell.text.length > 0) {
                    highlighter.mark_error(cell.sheet, cell.row, cell.col, 
                        "This cell does not appear to belong to a column. " + 
                        "Did you forget a column header above?", "warning");
                    
                }
                continue;
            }
            const param = this._current_function.get_param(cell.col);
            highlighter.mark_tier(cell.sheet, cell.row, cell.col, param.text);
            args.push(cell);
        }

        this._current_function.call(args, this);
    }

    public add_sheet(sheet_name: string, 
                    cells: string[][], 
                    highlighter: IHighlighter): void {
        for (var [row_idx, row] of cells.entries()) {
            
            if (is_line_empty(row)) {
                continue;
            }

            let row_results: GCell[] = [];
            for (var [col_idx, text] of row.entries()) {
                const cell = new GCell(text.trim(), sheet_name, row_idx, col_idx)
                row_results.push(cell);
            }

            this.add_row(row_results, highlighter);
        }
    }
}
