import {DevEnvironment, Project} from "./spreadsheet"
import {GTable} from "./transducers"

/*
class GError {
    protected _position: Position;
    protected _msg: string;

    public constructor(position: Position, msg: string) {
        this._position = position;
        this._msg = msg;
    }

    public get position(): Position { return this._position; }
    public get msg(): string { return this._msg; }
} */


function alert(msg: any): void {
    let ui = SpreadsheetApp.getUi();
    ui.alert(msg);
}

function sum(a: number[]): number {
    var s = 0;
    for (var i = 0; i < a.length; i++) s += a[i];
    return s;
} 
 
function degToRad(a: number): number {
    return Math.PI / 180 * a;
}
 
function meanAngleDeg(a: number[]): number {
    return 180 / Math.PI * Math.atan2(
        sum(a.map(degToRad).map(Math.sin)) / a.length,
        sum(a.map(degToRad).map(Math.cos)) / a.length
    );
}


const DEFAULT_SATURATION = 0.1;
const DEFAULT_VALUE = 1.0;
const MESSAGE_COLOR_ERROR: string = "#DD3333";
const MESSAGE_COLOR_WARNING: string = "#DDDD33";
const MESSAGE_COLOR_INFO: string = "#33DD33";
const NAMED_COLORS: Map<string, number> = new Map([
    ["red", 0],
    ["orange", 30],
    ["yellow", 60],
    ["chartreuse", 90],
    ["green", 120],
    ["aqua", 150],
    ["cyan", 180], 
    ["blue", 210],
    ["indigo", 240],
    ["violet", 270],
    ["magenta", 300],
    ["burgundy", 330],
]);


class GoogleSheetsHighlighter implements DevEnvironment {

    private _error_cells: [string, number, number, string, "error"|"warning"|"info"][] = [];
    private _comment_cells: [string, number, number][] = [];
    private _command_cells: [string, number, number][] = [];
    private _header_cells: [string, number, number, string][] = [];
    private _tier_cells: [string, number, number, string][] = [];
    private _named_colors: Map<string, number> = new Map();
    private _calculated_colors: Map<string, number> = new Map();

    public alert(msg: any): void {
        let ui = SpreadsheetApp.getUi();
        ui.alert(msg);
    }

    private HSVtoRGB(h: number, s: number, v: number): [number, number, number] {
        var r: number, g: number, b: number, i: number, 
            f: number, p: number, q: number, t: number;
        i = Math.floor(h * 6);
        f = h * 6 - i;
        p = v * (1 - s);
        q = v * (1 - f * s);
        t = v * (1 - (1 - f) * s);
        r = 0;
        g = 0;
        b = 0;
        switch (i % 6) {
            case 0: r = v, g = t, b = p; break;
            case 1: r = q, g = v, b = p; break;
            case 2: r = p, g = v, b = t; break;
            case 3: r = p, g = q, b = v; break;
            case 4: r = t, g = p, b = v; break;
            case 5: r = v, g = p, b = q; break;
        }
        r = Math.round(r * 255)
        g = Math.round(g * 255)
        b = Math.round(b * 255)
        return [r, g, b];
    }
    
    public set_color(tier_name: string, color_name: string): void {
        var hues: number[] = [];
        var subcolors: string[] = color_name.split("-");
        for (let subcolor of subcolors) {
            subcolor = subcolor.trim().toLowerCase();
            if (!NAMED_COLORS.has(subcolor)) {
                // this is an error, but don't fail because of it
                continue;
            }
            var hue = NAMED_COLORS.get(subcolor);
            if (hue == undefined) {
                continue; // shouldn't happen, just for linting
            }
            hues.push(hue);
        }
        /* red /= subcolors.length;
        green /= subcolors.length;
        blue /= subcolors.length; */

        if (hues.length == 0) {
            return; // this is an error, but just carry on
        }

        const average_hue = meanAngleDeg(hues) / 360;
        this._named_colors.set(tier_name, average_hue);
    }

    private set_calculated_color(tier_name: string): void {
        var str = tier_name + "extrasalt" // otherwise short strings are boring colors
        var hash = 0; 

        for (let i = 0; i < str.length; i++) { 
            let char = str.charCodeAt(i); 
            hash = ((hash << 5) - hash) + char; 
            hash = hash & hash; 
        } 
        
        const hue = (hash & 0xFF) / 255;
        
        //const [r, g, b] = this.HSVtoRGB(hue, DEFAULT_SATURATION, DEFAULT_VALUE);

        this._calculated_colors.set(tier_name, hue);
    }
    

    private get_color(tier_name: string): string {
        var hues: number[] = [];
        var subnames = tier_name.split(",");
        for (let i = 0; i < subnames.length; i++) {
            var subname = subnames[i].trim().toLowerCase();
            var subname_parts = subname.split(" ");
            subname = subname_parts[subname_parts.length-1];
            if (this._named_colors.has(subname)) {
                var hue = this._named_colors.get(subname);
            } else {
                if (!this._calculated_colors.has(subname)) {
                    this.set_calculated_color(subname);
                }
                var hue = this._calculated_colors.get(subname);
            }
            if (hue == undefined) {
                return "#EEEEEE";  // shouldn't happen, just for linting
            }
            hues.push(hue);

            if (i == 0) { // the first color should dominate
                hues.push(hue);
            }
        }
        const average_hue = meanAngleDeg(hues);
        const [r, g, b] = this.HSVtoRGB(average_hue, DEFAULT_SATURATION, DEFAULT_VALUE);
        return "#" + r.toString(16) + g.toString(16) + b.toString(16);
    }

    public mark_error(sheet: string, 
                    row: number, 
                    col: number, 
                    msg: string, 
                    level: "error" | "warning" | "info"): void {
        this._error_cells.push([sheet, row, col, msg, level]);
    }

    public mark_comment(sheet: string, row: number, col: number): void {
        this._comment_cells.push([sheet, row, col]);
    }

    public mark_header(sheet: string, row: number, col: number, tier: string): void {
        this._header_cells.push([sheet, row, col, tier]);
    }

    public mark_tier(sheet: string, row: number, col: number, tier: string): void {
        this._tier_cells.push([sheet, row, col, tier]);
    }

    public mark_command(sheet: string, row: number, col: number): void {
        this._command_cells.push([sheet, row, col]);
    }

    protected highlight_headers(current_sheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        var rangeNotationsByColor: Map<string,string[]> = new Map();

        for (const [sheet_name, row, col, tier] of this._header_cells) {
            if (sheet_name != current_sheet) {
                continue;
            }
            const color = this.get_color(tier);
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            if (!rangeNotationsByColor.has(color)) {
                rangeNotationsByColor.set(color, []);
            }
            rangeNotationsByColor.get(color).push(cell.getA1Notation());
        }
        
        for (const [color, ranges] of rangeNotationsByColor.entries()) {
            const sheet = spreadsheet.getSheetByName(current_sheet);
            const cells = sheet.getRangeList(ranges);
            cells.setBorder(true, false, true, false, false, false);
            cells.setBackground(color);
            cells.setFontStyle("normal");
            cells.setFontWeight("bold");
            cells.setFontColor(null);
        }
    }

    
    protected highlight_commands(current_sheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheet_name, row, col] of this._command_cells) {
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            cell.setBorder(false, false, false, false, false, false);
            cell.setBackground(null);
            cell.setFontStyle("normal");
            cell.setFontWeight("bold");
            cell.setFontColor(null);
        }
    }


    protected highlight_errors(current_sheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheet_name, row, col, msg, level] of this._error_cells) {
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            if (level == "error") {
                cell.setBackground(MESSAGE_COLOR_ERROR);
            } else if (level == "warning") {    
                cell.setBackground(MESSAGE_COLOR_WARNING);
            } else {
                cell.setBackground(MESSAGE_COLOR_INFO);
            }
            cell.setNote(msg);
            cell.setFontColor(null);
        }
    }

    protected highlight_comments(current_sheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheet_name, row, col] of this._comment_cells) {
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            cell.setFontColor("#449944");
            cell.setFontStyle("italic");
            cell.setBorder(false, false, false, false, false, false);
            cell.setBackground(null);
            cell.setFontWeight("normal");
        }
    }
    
    protected highlight_tiers(current_sheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        
        var rangeNotationsByColor: Map<string,string[]> = new Map();

        for (const [sheet_name, row, col, tier] of this._tier_cells) {
            if (sheet_name != current_sheet) {
                continue;
            }
            const color = this.get_color(tier);
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            if (!rangeNotationsByColor.has(color)) {
                rangeNotationsByColor.set(color, []);
            }
            rangeNotationsByColor.get(color).push(cell.getA1Notation());
        }
        for (const [color, ranges] of rangeNotationsByColor.entries()) {
            const sheet = spreadsheet.getSheetByName(current_sheet);
            const cells = sheet.getRangeList(ranges);
            cells.setBackground(color);
            cells.setFontColor(null);
            cells.setBorder(false, false, false, false, false, false);
            cells.setFontStyle("normal");
            cells.setFontWeight("normal");
        }
    }

    public highlight(): void {

        var spreadsheet = SpreadsheetApp.getActive();
        var sheet = spreadsheet.getActiveSheet();
        var sheet_name = sheet.getName();
        sheet.clearNotes();
        sheet.clearFormats();
        this.highlight_comments(sheet_name);
        this.highlight_commands(sheet_name);
        this.highlight_headers(sheet_name);
        this.highlight_tiers(sheet_name);
        this.highlight_errors(sheet_name);
    }
}

function make_project(highlighter: DevEnvironment): Project {
    var spreadsheet = SpreadsheetApp.getActive();
    var project = new Project();

    for (let sheet of spreadsheet.getSheets()) {
        var sheet_name = sheet.getName();
        var range = sheet.getDataRange();
        var cells = range.getDisplayValues();
        project.add_sheet(sheet_name, cells, highlighter);
    }

    return project;
}

function comments_for_new_sheet(symbol_name: string): string[][] {
    var results: string[][] = [];
    
    results.push(["#", "auto-gen"]);
    results.push(["#", "  from:", symbol_name]);
    const date = new Date();
    results.push(["#", "  date:", date.toUTCString() ])
    return results;
}

function code_from_table(symbol_name: string, table: GTable): string[][] {
    var results: string[][] = [];
    var keys: string[] = [];

    for (const record of table) {

        const new_keys = record.map(([key, value]) => key.text);
        const values = record.map(([key, value]) => value.text);
        if (keys.length == 0) {
            results.push([symbol_name].concat(new_keys));
        } else if (keys.toString() != new_keys.toString()) {
            results.push([]);
            results.push(["and"].concat(new_keys));
        }
        keys = new_keys;
        results.push([""].concat(values));
    }

    return results;
}


function set_data_in_sheet(sheet: Sheet, row: number, col: number, data: string[][]) {
    const width = Math.max(...data.map(row => {
        return row.length;
    }));

    // pad the data with empty cells, because setValues() complains at uneven rows
    data = data.map(row => {
        const padding = Array<string>(width - row.length).fill("");
        return row.concat(padding);
    });
        
    const range = sheet.getRange(row, col, data.length, width);
    range.setValues(data);
    sheet.autoResizeColumns(1, width)
}

function new_sheet_from_table(new_symbol_name: string, old_symbol_name: string, table: GTable): Sheet {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    var new_sheet = activeSpreadsheet.getSheetByName(new_symbol_name);
    
    while (new_sheet != null) {
        var sheet_name_parts = new_symbol_name.split("_");
        var last_part = sheet_name_parts[sheet_name_parts.length-1];
        var num = 0;
        if (/^\d+$/.test(last_part)) {
            var num = parseInt(last_part);        
            sheet_name_parts.pop();
        }
        var num_as_str = (num+1).toString();
        sheet_name_parts.push(num_as_str);
        new_symbol_name = sheet_name_parts.join("_");
        new_sheet = activeSpreadsheet.getSheetByName(new_symbol_name);
    }

    new_sheet = activeSpreadsheet.insertSheet();
    new_sheet.setName(new_symbol_name);
    
    var comments = comments_for_new_sheet(old_symbol_name);
    set_data_in_sheet(new_sheet, 1, 1, comments);
    var code = code_from_table(new_symbol_name, table);
    set_data_in_sheet(new_sheet, comments.length + 2, 1, code);
    return new_sheet;
}

function create_html_from_table(table: GTable, highlighter: DevEnvironment): string {
    var result = '<table style="margin: auto">';
    var previous_keys: string[] = [];
    for (const record of table) {
        result += '<tr style="padding: 5px">';
        var keys: string[] = [];
        var keys_and_colors: [string, string][] = [];
        var values_and_colors: [string, string][] = [];
        for (const [key, value] of record) {
            keys.push(key.text);
            const color = highlighter.get_color(key.text)
            keys_and_colors.push([key.text, color]);
            values_and_colors.push([value.text, color]);
        }
        if (keys.toString() != previous_keys.toString()) {
            result += '<td style="padding: 5px"> </td></tr><tr>'; // leave an emtpy row
            for (const [key, color] of keys_and_colors) {
                result += '<th style="text-align: padding: 5px 10px; center; font-weight: bold; border-bottom: 1pt solid #000; background-color: ' + color + '">' + key + "</th>";
            }
            result += "</tr><tr>";
            previous_keys = keys;
        }
        for (const [value, color] of values_and_colors) {
            result += '<td style="padding: 2px 10px; background-color: ' + color + '">'  + value + "</td>";
        }
        result += "</tr>";
    }
    result += "</table>";
    return result;
}

function showDialog(html_string: string, title: string = ""): void {
    var html = HtmlService.createHtmlOutput(html_string)
        .setWidth(600)
        .setHeight(400);
    SpreadsheetApp.getUi()
        .showModalDialog(html, title);
}


function GrambleSample(): void {
    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to sample.")
        return;
    }

    const highlighter = new GoogleSheetsHighlighter();
    const project = make_project(highlighter);

    const cell_text = range.getCell(1,1).getValue().trim();

    if (cell_text.length == 0) {
        alert("Choose a cell containing a symbol name. " +  
        " Available symbols are " + project.all_symbols().join(", "));
        return;
    }

    if (!project.has_symbol(cell_text)) {
        alert("The symbol [" + cell_text + "] has not been defined. " + 
            " Available symbols are " + project.all_symbols().join(", "));
        return;
    }
    const result = project.sample(cell_text, 10);
    const html_string = create_html_from_table(result, highlighter);
    showDialog(html_string, "Results of " + cell_text);

}

function GrambleGenerate(): void {
    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to generate.")
        return;
    }

    const highlighter = new GoogleSheetsHighlighter();
    const project = make_project(highlighter);

    const cell_text = range.getCell(1,1).getValue().trim();

    if (cell_text.length == 0) {
        alert("Choose a cell containing a symbol name. " +  
        " Available symbols are " + project.all_symbols().join(", "));
        return;
    }

    if (!project.has_symbol(cell_text)) {
        alert("The symbol [" + cell_text + "] has not been defined. " + 
            " Available symbols are " + project.all_symbols().join(", "));
        return;
    }
    const result = project.generate(cell_text);
    const html_string = create_html_from_table(result, highlighter);
    showDialog(html_string, "Results of " + cell_text);

}

function GrambleGenerateToSheet(): void {

    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to generate.")
        return;
    }

    const highlighter = new GoogleSheetsHighlighter();
    const project = make_project(highlighter);

    const cell_text = range.getCell(1,1).getValue().trim();

    if (cell_text.length == 0) {
        alert("Choose a cell containing a symbol name. " +  
        " Available symbols are " + project.all_symbols().join(", "));
        return;
    }

    if (!project.has_symbol(cell_text)) {
        alert("The symbol [" + cell_text + "] has not been defined. " + 
            " Available symbols are " + project.all_symbols().join(", "));
        return;
    }
    const result = project.generate(cell_text);

    const new_symbol_name = cell_text + "_results_1";
    const new_sheet = new_sheet_from_table(new_symbol_name, cell_text, result);
    
    var sheet_name = new_sheet.getName();
    var new_range = new_sheet.getDataRange();
    var cells = new_range.getDisplayValues();
    project.add_sheet(sheet_name, cells, highlighter);
    highlighter.highlight();

    new_sheet.activate();

}

function GrambleHighlighting(): void {
    const highlighter = new GoogleSheetsHighlighter();
    const project = make_project(highlighter);
    highlighter.highlight();
}


function GrambleTest(): void {
    const highlighter = new GoogleSheetsHighlighter();
    const project = make_project(highlighter);
    project.run_tests(highlighter);
    highlighter.highlight();
}

function GrambleComment(): void {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheet = spreadsheet.getActiveSheet();
    var range = sheet.getActiveRange();
    if (range == undefined) {
        return;
    }
    var row_start = range.getRowIndex();
    var row_end = range.getLastRow();

    for (var i = row_start; i <= row_end; i++) {
        let subrange = sheet.getRange(i, 1);
        let value = subrange.getValue() as string;
        if (value.trim().startsWith('#')) {
            continue;
        }
        value = "#" + value;
        subrange.setValue(value);
    }
    GrambleHighlighting();
}

function GrambleUncomment(): void {
    var spreadsheet = SpreadsheetApp.getActive();
    var sheet = spreadsheet.getActiveSheet();
    var range = sheet.getActiveRange();
    if (range == undefined) {
        return;
    }
    var row_start = range.getRowIndex();
    var row_end = range.getLastRow();

    for (var i = row_start; i <= row_end; i++) {
        let subrange = sheet.getRange(i, 1);
        let value = subrange.getValue() as string;
        if (!value.trim().startsWith('#')) {
            continue;
        }
        value = value.trim().slice(1); 
        subrange.setValue(value);
    }
    GrambleHighlighting();
}

function onOpen(): void {
    var ui = SpreadsheetApp.getUi();
    ui.createMenu('Gramble')
        .addItem('Highlight', 'GrambleHighlighting')
        .addItem('Run Tests', 'GrambleTest')
        .addSeparator()
        .addItem('Comment', 'GrambleComment')
        .addItem('Uncomment', 'GrambleUncomment')
        .addSeparator()
        .addItem('Sample 10', 'GrambleSample')
        .addItem('Generate all', 'GrambleGenerate')
        .addItem('Generate all to new sheet', 'GrambleGenerateToSheet')
        .addToUi();
}