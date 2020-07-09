import {DevEnvironment, Project} from "./spreadsheet";



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
const EXTRA_PASTEL = 0.05;
const DEFAULT_VALUE = 1.0;
const VAR_FOREGROUND_COLOR = "#000077";
const BLACK_COLOR = "#000000";

type NoteType = "error" | "warning" | "message";

const NOTE_COLORS: Map<NoteType, string> = new Map([
    ["error", "#FF9999"],
    ["warning", "#FFCC99"],
    ["info", "#99FF99"]
]);

const COMMENT_FONT_COLOR: string = "#449944";
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

function letterFromNumber(n: number): string {
    var letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(n % 26)
    var concat = Math.round(n / 26);
    return concat > 0 ? letterFromNumber(concat-1) + letter : letter;
};

abstract class Styler {
    
    protected cells: string[] = [];


    public addCell(row: number, col: number): void {
        const a1Notation = letterFromNumber(col) + (row+1).toString();
        this.cells.push(a1Notation);
    }

    public applyToSheet(sheet: Sheet) {
        if (this.cells.length == 0) return;
        const cells = sheet.getRangeList(this.cells);
        this.apply(cells);
    }

    protected abstract apply(cells: RangeList): void;
}

class ItalicStyler extends Styler {

    protected apply(cells: RangeList): void { 
        cells.setFontStyle("italic");
    }
}

class BoldStyler extends Styler {

    protected apply(cells: RangeList): void { 
        cells.setFontWeight("bold");
    }
}

class NoteStyler extends Styler {

    public constructor(
        private msg: string,
        private color: string,
    ) { 
        super();
    }

    protected apply(cells: RangeList): void { 
        cells.setNote(this.msg);
        cells.setBackground(this.color);
    }
    
}

class BorderStyler extends Styler {

    protected apply(cells: RangeList): void { 
        cells.setBorder(true, false, true, false, false, false);
    }
}

class CenterStyler extends Styler {

    protected apply(cells: RangeList): void { 
        cells.setHorizontalAlignment("center");
    }
    
}

class FontColorStyler extends Styler {

    public constructor(
        private color: string
    ) { 
        super();
    }

    protected apply(cells: RangeList): void { 
        cells.setFontColor(this.color);
    }
}

class BackgroundColorStyler extends Styler {

    public constructor(
        private color: string
    ) { 
        super();
    }

    protected apply(cells: RangeList): void { 
        cells.setBackground(this.color);
    }
}

class GoogleSheetsDevEnvironment implements DevEnvironment {

    //private errorCells: [string, number, number, string, "error"|"warning"|"info"][] = [];
   // private commentCells: [string, number, number][] = [];
    //private commandCells: [string, number, number][] = [];
    //private headerCells: [string, number, number, string][] = [];
    //private tierCells: [string, number, number, string][] = [];
    private namedColors: Map<string, number> = new Map();
    private calculatedColors: Map<string, number> = new Map();

    private bgColorStylers: Map<string, BackgroundColorStyler> = new Map();
    private fontColorStylers: Map<string, FontColorStyler> = new Map();
    private italicStyler: ItalicStyler = new ItalicStyler();
    private noteStylers: Map<string, NoteStyler> = new Map();
    private borderStyler: BorderStyler = new BorderStyler();
    private boldStyler: BoldStyler = new BoldStyler();
    private centerStyler: CenterStyler = new CenterStyler();

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
    
    public setColor(tierName: string, colorName: string): void {
        var hues: number[] = [];
        var subcolors: string[] = colorName.split("-");
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

        const averageHue = meanAngleDeg(hues) / 360;
        this.namedColors.set(tierName, averageHue);
    }

    private setCalculatedColor(tierName: string): void {
        var str = tierName + "extrasalt" // otherwise short strings are boring colors
        var hash = 0; 

        for (let i = 0; i < str.length; i++) { 
            let char = str.charCodeAt(i); 
            hash = ((hash << 5) - hash) + char; 
            hash = hash & hash; 
        } 
        
        const hue = (hash & 0xFF) / 255;
        

        this.calculatedColors.set(tierName, hue);
    }
    

    private getBackgroundColor(tierName: string, saturation: number = DEFAULT_SATURATION): string {
        var hues: number[] = [];
        var subnames = tierName.split(",");
        for (let i = 0; i < subnames.length; i++) {
            var subname = subnames[i].trim().toLowerCase();
            var subnameParts = subname.split(" ");
            subname = subnameParts[subnameParts.length-1];
            if (this.namedColors.has(subname)) {
                var hue = this.namedColors.get(subname);
            } else {
                if (!this.calculatedColors.has(subname)) {
                    this.setCalculatedColor(subname);
                }
                var hue = this.calculatedColors.get(subname);
            }
            if (hue == undefined) {
                return "#EEEEEE";  // shouldn't happen, just for linting
            }
            hues.push(hue);

            if (i == 0) { // the first color should dominate
                hues.push(hue);
            }
        }
        const averageHue = meanAngleDeg(hues);
        const [r, g, b] = this.HSVtoRGB(averageHue, saturation, DEFAULT_VALUE);
        return "#" + r.toString(16) + g.toString(16) + b.toString(16);
    }

    private getForegroundColor(tierName: string): string {
        var subnames = tierName.split(",");
        for (const subname of subnames) {
            const subnameParts = subname.trim().toLowerCase().split(" ");
            const lastName = subnameParts[subnameParts.length-1];
            if (lastName == "var") {
                return VAR_FOREGROUND_COLOR;
            }
        }
        return BLACK_COLOR;
    }

    public markError(sheet: string, 
                    row: number, 
                    col: number, 
                    msg: string, 
                    level: NoteType): void {

        const color = NOTE_COLORS.get(level);
        if (color == undefined) {
            throw new Error("Color undefined: " + level);
        }
        if (!this.noteStylers.has(msg)) {
            this.noteStylers.set(msg, new NoteStyler(msg, color));
        }
        this.noteStylers.get(msg)?.addCell(row, col);
    }

    public markComment(sheet: string, row: number, col: number): void {
        if (!this.fontColorStylers.has(COMMENT_FONT_COLOR)) {
            this.fontColorStylers.set(COMMENT_FONT_COLOR, new FontColorStyler(COMMENT_FONT_COLOR));
        }
        this.fontColorStylers.get(COMMENT_FONT_COLOR)?.addCell(row, col);
        this.italicStyler.addCell(row, col);
    }

    public markHeader(sheet: string, row: number, col: number, tier: string): void {
        const color = this.getBackgroundColor(tier, 0.15);
        if (!this.bgColorStylers.has(color)) {
            this.bgColorStylers.set(color, new BackgroundColorStyler(color));
        }
        this.bgColorStylers.get(color)?.addCell(row, col);
        this.borderStyler.addCell(row, col);
        this.boldStyler.addCell(row, col);
        this.centerStyler.addCell(row, col);
    }

    public markTier(sheet: string, row: number, col: number, tier: string): void {
        const bgColor = this.getBackgroundColor(tier, 0.1);
        if (!this.bgColorStylers.has(bgColor)) {
            this.bgColorStylers.set(bgColor, new BackgroundColorStyler(bgColor));
        }
        this.bgColorStylers.get(bgColor)?.addCell(row, col);
        const fgColor = this.getForegroundColor(tier);
        if (!this.fontColorStylers.has(fgColor)) {
            this.fontColorStylers.set(fgColor, new FontColorStyler(fgColor));
        }
        this.fontColorStylers.get(fgColor)?.addCell(row, col);
        if (fgColor == VAR_FOREGROUND_COLOR) {
            this.boldStyler.addCell(row, col);
        }
        this.centerStyler.addCell(row, col);
    }

    public markCommand(sheet: string, row: number, col: number): void {
        this.boldStyler.addCell(row, col);
        this.centerStyler.addCell(row, col);
    }
    
    public markSymbol(sheet: string, row: number, col: number): void {
        this.boldStyler.addCell(row, col);
        this.centerStyler.addCell(row, col);
        if (!this.fontColorStylers.has(VAR_FOREGROUND_COLOR)) {
            this.fontColorStylers.set(VAR_FOREGROUND_COLOR, new FontColorStyler(VAR_FOREGROUND_COLOR));
        }
        this.fontColorStylers.get(VAR_FOREGROUND_COLOR)?.addCell(row, col);
    }

    public highlight(): void {

        var spreadsheet = SpreadsheetApp.getActive();
        var sheet = spreadsheet.getActiveSheet();
        sheet.clearNotes();
        sheet.clearFormats();
        for (const styler of this.bgColorStylers.values()) {
            styler.applyToSheet(sheet);
        }
        for (const styler of this.fontColorStylers.values()) {
            styler.applyToSheet(sheet);
        }
        this.italicStyler.applyToSheet(sheet);
        this.boldStyler.applyToSheet(sheet);
        this.borderStyler.applyToSheet(sheet);
        this.centerStyler.applyToSheet(sheet);
        
        for (const styler of this.noteStylers.values()) {
            styler.applyToSheet(sheet);
        }
    }
}

function makeProject(devEnv: DevEnvironment): Project {
    var spreadsheet = SpreadsheetApp.getActive();
    var project = new Project();
    var sheet = spreadsheet.getActiveSheet();
    var sheetName = sheet.getName();
    var range = sheet.getDataRange();
    var cells = range.getDisplayValues();
    project.addSheet(sheetName, cells, devEnv);
    return project;
}

function commentsForNewSheet(symbolName: string): string[][] {
    var results: string[][] = [];
    
    results.push(["#", "auto-gen"]);
    results.push(["#", "  from:", symbolName]);
    const date = new Date();
    results.push(["#", "  date:", date.toUTCString() ])
    return results;
}

function codeFromTable(symbolName: string, table: {[key: string]:string}[]): string[][] {
    var results: string[][] = [];
    var keys: string[] = [];

    for (const record of table) {
        const newKeys: string[] = [];
        const values: string[] = [];
        for (const key in record) {
            newKeys.push(key);
            values.push(record[key]);
        }
        if (keys.length == 0) {
            results.push([symbolName].concat(newKeys));
        } else if (keys.toString() != newKeys.toString()) {
            results.push([]);
            results.push(["and"].concat(newKeys));
        }
        keys = newKeys;
        results.push([""].concat(values));
    }

    return results;
}


function setDataInSheet(sheet: Sheet, row: number, col: number, data: string[][]) {
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

function newSheetFromTable(newSymbolName: string, oldSymbolName: string, table: {[key: string]:string}[]): Sheet {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    var newSheet = activeSpreadsheet.getSheetByName(newSymbolName);
    
    while (newSheet != null) {
        /* Keep incrementing the sheet name until you find an unused one */
        var sheetNameParts = newSymbolName.split("_");
        var lastPart = sheetNameParts[sheetNameParts.length-1];
        var num = 0;
        if (/^\d+$/.test(lastPart)) {
            var num = parseInt(lastPart);        
            sheetNameParts.pop();
        }
        var numAsStr = (num+1).toString();
        sheetNameParts.push(numAsStr);
        newSymbolName = sheetNameParts.join("_");
        newSheet = activeSpreadsheet.getSheetByName(newSymbolName);
    }

    newSheet = activeSpreadsheet.insertSheet();
    newSheet.setName(newSymbolName);
    
    var comments = commentsForNewSheet(oldSymbolName);
    setDataInSheet(newSheet, 1, 1, comments);
    var code = codeFromTable(newSymbolName, table);
    setDataInSheet(newSheet, comments.length + 2, 1, code);
    return newSheet;
}

function createHTMLFromTable(table: {[key: string]:string}[], devEnv: DevEnvironment): string {
    var result = '<table style="margin: auto">';
    var previousKeys: string[] = [];
    for (const record of table) {
        result += '<tr style="padding: 5px">';
        var keys: string[] = [];
        var keysAndColors: [string, string][] = [];
        var valuesAndColors: [string, string][] = [];
        for (const key in record) {
            if (!record.hasOwnProperty(key)) {
                continue;
            }
            keys.push(key);
            const value = record[key];
            const color = devEnv.getBackgroundColor(key)
            keysAndColors.push([key, color]);
            valuesAndColors.push([value, color]);
        }
        if (keys.toString() != previousKeys.toString()) {
            result += '<td style="padding: 5px"> </td></tr><tr>'; // leave an emtpy row
            for (const [key, color] of keysAndColors) {
                result += '<th style="text-align: padding: 5px 10px; center; font-weight: bold; border-bottom: 1pt solid #000; background-color: ' + color + '">' + key + "</th>";
            }
            result += "</tr><tr>";
            previousKeys = keys;
        }
        for (const [value, color] of valuesAndColors) {
            result += '<td style="padding: 2px 10px; background-color: ' + color + '">'  + value + "</td>";
        }
        result += "</tr>";
    }
    result += "</table>";
    return result;
}

function showDialog(htmlString: string, title: string = ""): void {
    var html = HtmlService.createHtmlOutput(htmlString)
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

    const devEnv = new GoogleSheetsDevEnvironment();
    const project = makeProject(devEnv);

    const cellText = range.getCell(1,1).getValue().trim();

    if (cellText.length == 0) {
        alert("Choose a cell containing a symbol name. " +  
        " Available symbols are " + project.allSymbols().join(", "));
        return;
    }

    if (!project.hasSymbol(cellText)) {
        alert("The symbol [" + cellText + "] has not been defined. " + 
            " Available symbols are " + project.allSymbols().join(", "));
        return;
    }
    const result = project.sampleFlatten(cellText, 10);
    console.log(result);
    const htmlString = createHTMLFromTable(result, devEnv);
    showDialog(htmlString, "Results of " + cellText);

}

function GrambleGenerate(): void {
    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to generate.")
        return;
    }

    const devEnv = new GoogleSheetsDevEnvironment();
    const project = makeProject(devEnv);

    const cellText = range.getCell(1,1).getValue().trim();

    if (cellText.length == 0) {
        alert("Choose a cell containing a symbol name. " +  
        " Available symbols are " + project.allSymbols().join(", "));
        return;
    }

    if (!project.hasSymbol(cellText)) {
        alert("The symbol [" + cellText + "] has not been defined. " + 
            " Available symbols are " + project.allSymbols().join(", "));
        return;
    }
    const result = project.generateFlatten(cellText);
    const html_string = createHTMLFromTable(result, devEnv);
    showDialog(html_string, "Results of " + cellText);

}

function GrambleGenerateToSheet(): void {

    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to generate.")
        return;
    }

    const devEnv = new GoogleSheetsDevEnvironment();
    const project = makeProject(devEnv);

    const cellText = range.getCell(1,1).getValue().trim();

    if (cellText.length == 0) {
        alert("Choose a cell containing a symbol name. " +  
        " Available symbols are " + project.allSymbols().join(", "));
        return;
    }

    if (!project.hasSymbol(cellText)) {
        alert("The symbol [" + cellText + "] has not been defined. " + 
            " Available symbols are " + project.allSymbols().join(", "));
        return;
    }
    const result = project.generateFlatten(cellText);
    const newSymbolName = cellText + "_results_1";
    const newSheet = newSheetFromTable(newSymbolName, cellText, result);
    
    var sheetName = newSheet.getName();
    var new_range = newSheet.getDataRange();
    var cells = new_range.getDisplayValues();

    const newDevEnv = new GoogleSheetsDevEnvironment();
    const newProject = makeProject(newDevEnv);
    newProject.addSheet(sheetName, cells, newDevEnv);
    
    newSheet.activate();
    newDevEnv.highlight();
}

function GrambleHighlighting(): void {
    const devEnv = new GoogleSheetsDevEnvironment();
    const project = makeProject(devEnv);
    devEnv.highlight();
}


function GrambleTest(): void {
    const devEnv = new GoogleSheetsDevEnvironment();
    const project = makeProject(devEnv);
    project.runTests(devEnv);
    devEnv.highlight();
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

function GrambleSidebar(): void {
    var html = HtmlService.createTemplateFromFile('sidebar')
        .evaluate()
        .setTitle('Gramble Results')
        .setWidth(800);
    SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
        .showSidebar(html);
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
  }

function getCurrentSheetData(): string[][] {
    const spreadsheet = SpreadsheetApp.getActive();
    const sheet = spreadsheet.getActiveSheet();
    const range = sheet.getDataRange();
    const cells = range.getDisplayValues() as string[][];
    return cells;
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
        .addSeparator()
        .addItem('Show sidebar', 'GrambleSidebar')
        .addToUi();
}