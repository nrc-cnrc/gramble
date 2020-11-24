//import {DevEnvironment, Project, getBackgroundColor, getForegroundColor} from "@gramble/gramble";

function alert(msg) {
    SpreadsheetApp.getUi().alert(msg);
}

/*
import * as Gr from "./gramble";
import "google-apps-script"

type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type RangeList = GoogleAppsScript.Spreadsheet.RangeList;

type NoteType = "error" | "warning" | "info";

*/

// NOTE_COLORS: Map<NoteType, string>
const NOTE_COLORS = new Map([
    ["error", "#FF7777"],
    ["warning", "#FFCC66"],
    ["info", "#99FF99"]
]);

/* 
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

*/


function letterFromNumber(n) { // number -> string
    var letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(n % 26)
    var concat = Math.round(n / 26);
    return concat > 0 ? letterFromNumber(concat-1) + letter : letter;
};

function getA1Notation(sheet, row, col) {
    if (sheet == "") {
        return `${letterFromNumber(col)}${(row+1)}`;
    }
    return `${sheet}!${letterFromNumber(col)}${(row+1)}`;
}

class Styler {
    
    constructor() {
        this.cells = []; // cells: string[], containing a1Notations referring to cells
    }

    addCell(sheet, row, col) {
        //const a1Notation = `${sheet}!${letterFromNumber(col)}${(row+1)}`;
        const a1Notation = `${letterFromNumber(col)}${(row+1)}`;
        this.cells.push(a1Notation);
    }

    applyToSheet(sheet) {
        if (this.cells.length == 0) return;
        const cells = sheet.getRangeList(this.cells);
        this.apply(cells);
    }

    //protected abstract apply(cells: RangeList): void;
}

class ItalicStyler extends Styler {

    apply(rangeList) { 
        rangeList.setFontStyle("italic");
    }
}

class BoldStyler extends Styler {

    apply(rangeList) { 
        rangeList.setFontWeight("bold");
    }
}


class NoteStyler extends Styler {

    constructor(msg, color) { 
        super();
        this.msg = msg;
        this.color = color;
    }

    apply(rangeList) { 
        rangeList.setNote(this.msg);
        rangeList.setBackground(this.color);
    }
    
} 

class BorderStyler extends Styler {

    apply(rangeList) { 
        rangeList.setBorder(true, false, true, false, false, false);
    }
}

class CenterStyler extends Styler {

    apply(rangeList) { 
        rangeList.setHorizontalAlignment("center");
    }
}

class FontColorStyler extends Styler {

    constructor(color) { 
        super();
        this.color = color;
    }

    apply(rangeList) { 
        cells.setFontColor(this.color);
    }
}

class BackgroundColorStyler extends Styler {

    constructor(color) { 
        super();
        this.color = color;
    }

    apply(rangeList) { 
        rangeList.setBackground(this.color);
    }
}


class GoogleSheetsDevEnvironment {

    constructor(currentSheetName) {
        this.currentSheetName = currentSheetName;
        this.noteStylers = new Map(); // :Map<string, NoteStyler>
        this.bgColorStylers  = new Map(); // :Map<string, BackgroundColorStyler>
        this.fgColorStylers = new Map(); // :Map<string, FontColorStyler>
        this.italicStyler = new ItalicStyler();
        this.borderStyler = new BorderStyler();
        this.boldStyler = new BoldStyler();
        this.centerStyler = new CenterStyler();
    }

    hasSource(sheetName) {
        var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
        return (sheet != undefined);
    }

    loadSource(sheetName) {
        var sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
        if (sheet == undefined) {
            throw new Error(`There is no sheet named ${sheetName}`);
        }
        const range = sheet.getDataRange();
        const values = range.getDisplayValues();
        return values;
    }

    markError(sheet, row, col, shortMsg, msg, level = "error") {

        if (sheet != this.currentSheetName) {
            return;
        }

        const color = NOTE_COLORS.get(level);
        if (color == undefined) {
            throw new Error("Color undefined: " + level);
        }
        var noteStyler = this.noteStylers.get(msg);
        if (noteStyler == undefined) {
            noteStyler = new NoteStyler(msg, color)
            this.noteStylers.set(msg, noteStyler);
        }
        noteStyler.addCell(sheet, row, col); 
    }

    /*
    public markComment(sheet: string, row: number, col: number): void {
        var colorStyler = this.fgColorStylers.get(COMMENT_FONT_COLOR);
        if (colorStyler == undefined) {
            colorStyler = new FontColorStyler(COMMENT_FONT_COLOR);
            this.fgColorStylers.set(COMMENT_FONT_COLOR, colorStyler);
        }
        colorStyler.addCell(row, col);
        this.italicStyler.addCell(row, col);
    }
    */

    markHeader(sheet, row, col, color) {

        if (sheet != this.currentSheetName) {
            return;
        }

        var bgColorStyler = this.bgColorStylers.get(color);
        if (bgColorStyler == undefined) {
            bgColorStyler = new BackgroundColorStyler(color);
            this.bgColorStylers.set(color, bgColorStyler);
        }
        bgColorStyler.addCell(sheet, row, col);
        /*
        const fgColor = getForegroundColor(tier);
        if (!this.fgColorStylers.has(fgColor)) {
            this.fgColorStylers.set(fgColor, new FontColorStyler(fgColor));
        }
        this.fgColorStylers.get(fgColor)?.addCell(row, col);
        */
        this.borderStyler.addCell(sheet, row, col);
        this.boldStyler.addCell(sheet, row, col);
        this.centerStyler.addCell(sheet, row, col);
    }


    markTier(sheet, row, col, color) {

        if (sheet != this.currentSheetName) {
            return;
        }

        var bgColorStyler = this.bgColorStylers.get(color);
        if (bgColorStyler == undefined) {
            bgColorStyler = new BackgroundColorStyler(color);
            this.bgColorStylers.set(color, bgColorStyler);
        }
        bgColorStyler.addCell(sheet, row, col);
        /* const fgColor = getForegroundColor(tier);
        if (!this.fgColorStylers.has(fgColor)) {
            this.fgColorStylers.set(fgColor, new FontColorStyler(fgColor));
        }
        this.fgColorStylers.get(fgColor)?.addCell(row, col);
        */
       
        this.centerStyler.addCell(sheet, row, col);

    }

    markCommand(sheet, row, col) {

        if (sheet != this.currentSheetName) {
            return;
        }

        this.boldStyler.addCell(sheet, row, col);
        this.centerStyler.addCell(sheet, row, col);
    }
    
    markSymbol(sheet, row, col) {

        if (sheet != this.currentSheetName) {
            return;
        }
        
        this.boldStyler.addCell(sheet, row, col);
        this.centerStyler.addCell(sheet, row, col);
    }

    highlight() {

        var spreadsheet = SpreadsheetApp.getActive();
        var sheet = spreadsheet.getActiveSheet();
        sheet.clearNotes();
        sheet.clearFormats();
        for (const styler of this.bgColorStylers.values()) {
            styler.applyToSheet(sheet);
        }
        
        for (const styler of this.fgColorStylers.values()) {
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



/*
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
        // Keep incrementing the sheet name until you find an unused one 
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

*/



/*
function GrambleTest(): void {
    const devEnv = new GoogleSheetsDevEnvironment();
    const project = makeProject(devEnv);
    project.runTests();
    devEnv.highlight();
} */

/*
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
*/

function highlight() {
    const [project, devEnv] = makeProject();
    devEnv.highlight();
} 

function showSidebar() {
    var html = HtmlService.createTemplateFromFile('sidebar')
        .evaluate()
        .setTitle('Gramble Control Panel');
    SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
        .showSidebar(html);
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
  }

function makeProject() {
    const spreadsheet = SpreadsheetApp.getActive();
    const sheet = spreadsheet.getActiveSheet();
    const sheetName = sheet.getName();

    const devEnv = new GoogleSheetsDevEnvironment(sheetName);
    const project = new gramble.Project(devEnv);
    project.addSheet(sheetName);
    return [project, devEnv];
}

function scrollToCell(sheetName, row, col) {
    const spreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = spreadsheet.getSheetByName(sheetName);
    sheet.activate();
    const range = sheet.getRange(getA1Notation("", row, col));
    sheet.setActiveRange(range);
}

function getAllCells() {
    highlight();
    try {
        const results = { "success": true,
                          "payload": { 
                             "startSheet": "",
                             "sheets": {}
                          } 
                        };
        const spreadsheet = SpreadsheetApp.getActive();

        // add the name of the sheet that's currently active
        const sheetName = spreadsheet.getActiveSheet().getName();
        results["payload"]["startSheet"] = sheetName;

        for (const sheet of spreadsheet.getSheets()) {
            const name = sheet.getName();
            const data = sheet.getDataRange().getDisplayValues();
            results["payload"]["sheets"][name] = data;
        }
        return results;
    } catch (e) {
        return { "success": false, "message": e.toString() };
    }
}

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    //const project = new Gr.Project();

    ui.createMenu('Gramble')
        .addItem('Highlight', 'highlight')
        //.addItem('Run Tests', 'GrambleTest')
        //.addSeparator()
        //.addItem('Comment', 'GrambleComment')
        //.addItem('Uncomment', 'GrambleUncomment')
        //.addSeparator()
        //.addItem('Sample 10', 'GrambleSample')
        //.addItem('Generate all', 'GrambleGenerate')
        //.addItem('Generate all to new sheet', 'GrambleGenerateToSheet')
        //.addSeparator()
        .addItem('Show sidebar', 'showSidebar')
        .addToUi();

    showSidebar();
}