import {IHighlighter, Project} from "../spreadsheet"

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
const ERROR_COLOR: string = "#FF0000";
const WARNING_COLOR: string = "#EEDD00";
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

class GoogleSheetsHighlighter implements IHighlighter {

    private _error_cells: [string, number, number, string, "error" | "warning"][] = [];
    private _comment_cells: [string, number, number][] = [];
    private _command_cells: [string, number, number][] = [];
    private _header_cells: [string, number, number, string][] = [];
    private _tier_cells: [string, number, number, string][] = [];
    private _named_colors: Map<string, number> = new Map();
    private _calculated_colors: Map<string, number> = new Map();


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
            const subname = subnames[i].trim().toLowerCase();
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
                    level: "error" | "warning"): void {
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

    protected highlight_headers(): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheet_name, row, col, tier] of this._header_cells) {
            const color = this.get_color(tier);
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            cell.setBorder(true, false, true, false, false, false);
            cell.setBackground(color);
            cell.setFontStyle("normal");
            cell.setFontWeight("bold");
            cell.setFontColor(null);
        }
    }

    
    protected highlight_commands(): void {
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


    protected highlight_errors(): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheet_name, row, col, msg, level] of this._error_cells) {
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            if (level == "error") {
                cell.setBackground(ERROR_COLOR);
            } else {            
                cell.setBackground(WARNING_COLOR);
            }
            cell.setNote(msg);
            cell.setFontColor(null);
        }
    }

    protected highlight_comments(): void {
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
    
    protected highlight_tiers(): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheet_name, row, col, tier] of this._tier_cells) {
            const color = this.get_color(tier);
            let sheet = spreadsheet.getSheetByName(sheet_name);
            if (sheet == undefined) {
                continue;
            }
            let cell = sheet.getRange(row + 1, col + 1);
            cell.setBackground(color);
            cell.setFontColor(null);
            cell.setBorder(false, false, false, false, false, false);
            cell.setFontStyle("normal");
            cell.setFontWeight("normal");
        }
    }

    public highlight(): void {
        this.highlight_comments();
        this.highlight_commands();
        this.highlight_headers();
        this.highlight_tiers();
        this.highlight_errors();
    }
}


function GrambleHighlighting(): void {
    var spreadsheet = SpreadsheetApp.getActive();
    var project = new Project();
    var highlighter = new GoogleSheetsHighlighter();

    for (let sheet of spreadsheet.getSheets()) {
        sheet.clearNotes();
        var sheet_name = sheet.getName();
        var range = sheet.getDataRange();
        var cells = range.getDisplayValues();
        project.add_sheet(sheet_name, cells, highlighter);
    }

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
        .addSeparator()
        .addItem('Comment', 'GrambleComment')
        .addItem('Uncomment', 'GrambleUncomment')
        .addToUi();
}