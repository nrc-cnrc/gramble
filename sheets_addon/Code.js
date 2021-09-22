//import {DevEnvironment, Project, getBackgroundColor, getForegroundColor} from "@gramble/gramble";

function alert(msg) {
    SpreadsheetApp.getUi().alert(msg);
}

const NOTE_COLORS = new Map([
    ["error", "#FF7777"],
    ["warning", "#FFCC66"],
    ["info", "#88FF99"]
]);

const COMMENT_FONT_COLOR = "#449944";

function letterFromNumber(n) { // number -> string
    var letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(n % 26)
    var concat = Math.floor(n / 26);
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
        const a1Notation = getA1Notation("", row, col);
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
        rangeList.setFontColor(this.color);
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

    message(msg) {
        if (msg["type"] == "error") {
            this.markError(msg["sheet"], msg["row"],
                msg["col"], msg["shortMsg"], msg["longMsg"],
                "error");
        } else if (msg["type"] == "warning") {
            this.markError(msg["sheet"], msg["row"],
                msg["col"], msg["shortMsg"], msg["longMsg"],
                "warning");
        } else if (msg["type"] == "info") {
            this.markError(msg["sheet"], msg["row"],
                msg["col"], msg["shortMsg"], msg["longMsg"],
                "info");
        } else if (msg["type"] == "comment") {
            this.markComment(msg["sheet"], 
                msg["row"], msg["col"]);
        } else if (msg["type"] == "header") {
            this.markHeader(msg["sheet"], msg["row"],
                msg["col"], msg["color"]);
        } else if (msg["type"] == "command") {
            this.markCommand(msg["sheet"], 
                msg["row"], msg["col"]);
        } else if (msg["type"] == "content") {
            this.markContent(msg["sheet"], msg["row"],
                msg["col"], msg["color"]);
        } else {
            console.log(`unknown message: ${msg}`);
        }
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

    markComment(sheet, row, col) {

        if (sheet != this.currentSheetName) {
            return;
        }

        var colorStyler = this.fgColorStylers.get(COMMENT_FONT_COLOR);
        if (colorStyler == undefined) {
            colorStyler = new FontColorStyler(COMMENT_FONT_COLOR);
            this.fgColorStylers.set(COMMENT_FONT_COLOR, colorStyler);
        }
        colorStyler.addCell(sheet, row, col);
        this.italicStyler.addCell(sheet, row, col);
    }

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


    markContent(sheet, row, col, color) {

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
function showDialog(htmlString: string, title: string = ""): void {
    var html = HtmlService.createHtmlOutput(htmlString)
        .setWidth(600)
        .setHeight(400);
    SpreadsheetApp.getUi()
        .showModalDialog(html, title);
}
*/

function GrambleComment() {
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
        let value = subrange.getValue();
        if (value.trim().startsWith('#')) {
            continue;
        }
        value = "%%" + value;
        subrange.setValue(value);
    }
    highlight();
}

function GrambleUncomment() {
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
        let value = subrange.getValue();
        if (!value.trim().startsWith('%%')) {
            continue;
        }
        value = value.trim().slice(2); 
        subrange.setValue(value);
    }
    highlight();
}

function makeProject() {
    const spreadsheet = SpreadsheetApp.getActive();
    const sheet = spreadsheet.getActiveSheet();
    const sheetName = sheet.getName();

    const devEnv = new GoogleSheetsDevEnvironment(sheetName);
    const project = new gramble.Gramble(devEnv, sheetName);
    //project.runUnitTests();
    return [project, devEnv];
}

function runUnitTests() {
    const [project, devEnv] = makeProject();
    project.runUnitTests();
    devEnv.highlight();
} 

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

function makeNewSheet(symbolName, sheetName, data) {

    let newSymbolName = sheetName + "_1";

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

    // make the new sheet with the given data
    newSheet = activeSpreadsheet.insertSheet();
    newSheet.setName(newSymbolName);
    setDataInSheet(newSheet, 1, 1, data);

    highlight();

    return { "success": true };
}

function setDataInSheet(sheet, row, col, data) {
    const width = Math.max(...data.map(row => {
        return row.length;
    }));

    // pad the data with empty cells, because setValues() complains at uneven rows
    data = data.map(row => {
        const padding = Array(width - row.length).fill("");
        return row.concat(padding);
    });
        
    const range = sheet.getRange(row, col, data.length, width);
    range.setValues(data);
    sheet.autoResizeColumns(1, width)
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

/**
 * Get status of auto-sidebar, and optionally change it.
 *
 * @var {any} optSet  (optional) Any truthy value will change the setting.
 *
 * @returns {Boolean} Returns true if enabled, false if not.
 *                    Always returns false if ScriptApp.AuthMode.NONE.
 */
function autoEnabled_(optSet) {
    try {
      var autoState = PropertiesService.getUserProperties().getProperty('autoState');
    }
    catch (e) {
      // Called with ScriptApp.AuthMode.NONE
      return false;
    }
  
    if (optSet) {
      autoState = (autoState == 'enabled')?'disabled':'enabled';
      PropertiesService.getUserProperties()
                       .setProperty('autoState',autoState);
      // Re-run the onOpen function to update menu
      onOpen({authMode:ScriptApp.AuthMode.LIMITED});
    }
  
    return autoState == 'enabled';
  }

function onOpen() {
    const ui = SpreadsheetApp.getUi();
    //const project = new Gr.Project();

    ui.createMenu('Gramble')
    
        .addItem('Show sidebar', 'showSidebar')
        .addSeparator()
        .addItem('Run unit tests', 'runUnitTests')
        .addSeparator()
        .addItem('Highlight', 'highlight')
        .addItem('Comment', 'GrambleComment')
        .addItem('Uncomment', 'GrambleUncomment')
        .addToUi();

    if (autoEnabled_()) {
        showSidebar();
    }
}