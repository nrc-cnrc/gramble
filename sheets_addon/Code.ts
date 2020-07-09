import {DevEnvironment, Project, getBackgroundColor} from "./spreadsheet";



function alert(msg: any): void {
    let ui = SpreadsheetApp.getUi();
    ui.alert(msg);
}


type NoteType = "error" | "warning" | "info";

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

class GoogleSheetsDevEnvironment {

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
        const color = getBackgroundColor(tier, 0.15);
        if (!this.bgColorStylers.has(color)) {
            this.bgColorStylers.set(color, new BackgroundColorStyler(color));
        }
        this.bgColorStylers.get(color)?.addCell(row, col);
        this.borderStyler.addCell(row, col);
        this.boldStyler.addCell(row, col);
        this.centerStyler.addCell(row, col);
    }

    public markTier(sheet: string, row: number, col: number, tier: string): void {
        const bgColor = getBackgroundColor(tier, 0.1);
        if (!this.bgColorStylers.has(bgColor)) {
            this.bgColorStylers.set(bgColor, new BackgroundColorStyler(bgColor));
        }
        this.bgColorStylers.get(bgColor)?.addCell(row, col);
        this.centerStyler.addCell(row, col);
    }

    public markCommand(sheet: string, row: number, col: number): void {
        this.boldStyler.addCell(row, col);
        this.centerStyler.addCell(row, col);
    }
    
    public markSymbol(sheet: string, row: number, col: number): void {
        this.boldStyler.addCell(row, col);
        this.centerStyler.addCell(row, col);
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
            const color = getBackgroundColor(key)
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