import {GCell, GEntry, GRecord, GTable, SymbolTable} from "./transducers"

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


export interface IHighlighter {
    //errors: [GCell, string][];
    //comments: GCell[];
    //headers: GCell[];
    //highlights: [GCell, string][];

    mark_error(sheet: string, row: number, col: number, msg: string, level: "error"|"warning"): void;
    mark_tier(sheet: string, row: number, col: number, tier: string): void;
    mark_comment(sheet: string, row: number, col: number): void;
    mark_header(sheet: string, row: number, col: number, tier: string): void;
    mark_command(sheet: string, row: number, col: number): void;
    set_color(tier_name: string, color: string): void;
    highlight(): void;
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


var RESERVED_WORDS: string[] = [ "grammar", "apply" ];


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

    public abstract call(cells: GCell[], symbol_table: SymbolTable): void;

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

    public call(cells: GCell[], symbol_table: SymbolTable): void {
        var record = new GRecord();
        if (this._symbol == undefined) {
            throw new Error("Attempted to call table function without active symbol");
        }
        for (const cell of cells) {
            const key = this.get_param(cell.col);
            if (key == undefined) {
                throw new Error("Attempted to call table function with argument not corresponding to any param");
            }
            const new_entry = new GEntry(key, cell);
            record.push(new_entry);
        }
        symbol_table.add_to_symbol(this._symbol.text, record);
    }
}

function make_function(name: GCell, 
                       current_symbol: GCell | undefined, 
                       highlighter: IHighlighter): GFunction {

    if (name.text == 'or') {

        if (current_symbol == undefined) {
            highlighter.mark_error(name.sheet, name.row, name.col, 
                "This command is not preceded by a symbol. " +
                " If you don't assign it to a symbol, it will be ignored.", "warning");
        }
        return new TableFunction(name, current_symbol);
    }

    // it's not a reserved word, so it's a new symbol
    return new TableFunction(name, name);
}

const BUILT_IN_FUNCTIONS: string[] = [
    "or",
]

export class Project {

    //private _cells: Cell[][] = [];
    //private _current_symbol: GCell | null = null;

    private _current_function: GFunction | undefined = undefined;
    private _current_symbol: GCell | undefined = undefined;

    private _symbol_table = new SymbolTable();

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

        this._current_function.call(args, this._symbol_table);
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
