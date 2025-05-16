function alert(msg) {
    SpreadsheetApp.getUi().alert(msg);
}

const NOTE_COLORS = new Map([
    ["error", "#FF7777"],
    ["warning", "#FFCC66"],
    ["success", "#88FF99"]
]);

const DEFAULT_BG_COLOR = "#EEEEEE";

const COMMENT_FONT_COLOR = "#669944";

function letterFromNumber(n) { // number -> string
    let letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(n % 26)
    let concat = Math.floor(n / 26);
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

    addCell(msg) {
        //const a1Notation = `${sheet}!${letterFromNumber(col)}${(row+1)}`;
        const a1Notation = getA1Notation("", msg.row, msg.col);
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

    constructor(currentSheetName, opt) {
        this.currentSheetName = currentSheetName;
        this.noteStylers = new Map(); // :Map<string, NoteStyler>
        this.bgColorStylers  = new Map(); // :Map<string, BackgroundColorStyler>
        this.fontColorStylers = new Map(); // :Map<string, FontColorStyler>
        this.italicStyler = new ItalicStyler();
        this.borderStyler = new BorderStyler();
        this.boldStyler = new BoldStyler();
        this.centerStyler = new CenterStyler();
        this.opt = gramble.Options(opt);
    }

    message(msg) {
        
        if (msg.sheet != this.currentSheetName) return;

        switch (msg.tag) {
            case "error":       return this.markNote(msg);
            case "warning":     return this.markNote(msg);
            case "success":     return this.markNote(msg);
            case "comment":     return this.markComment(msg);
            case "header":      return this.markHeader(msg);
            case "content":     return this.markContent(msg);
            case "op":          return this.markOp(msg);
            default: 
                console.log(`unknown message: ${JSON.stringify(msg)}`);
        }
    }

    hasSource(sheetName) {
        let sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
        return (sheet != undefined);
    }

    loadSource(sheetName) {
        let sheet = SpreadsheetApp.getActive().getSheetByName(sheetName);
        if (sheet == undefined) {
            throw new Error(`There is no sheet named ${sheetName}`);
        }
        const range = sheet.getDataRange();
        const values = range.getDisplayValues();
        return values;
    }

    markNote(msg) {
        const color = NOTE_COLORS.get(msg.tag) || DEFAULT_BG_COLOR;
        let noteStyler = this.noteStylers.get(msg.longMsg);
        if (noteStyler == undefined) {
            noteStyler = new NoteStyler(msg.longMsg, color)
            this.noteStylers.set(msg.longMsg, noteStyler);
        }
        noteStyler.addCell(msg); 
    }

    markComment(msg) {

        let colorStyler = this.fontColorStylers.get(COMMENT_FONT_COLOR);
        if (colorStyler == undefined) {
            colorStyler = new FontColorStyler(COMMENT_FONT_COLOR);
            this.fontColorStylers.set(COMMENT_FONT_COLOR, colorStyler);
        }
        colorStyler.addCell(msg);
        this.italicStyler.addCell(msg);
    }

    markHeader(msg) {

        let bgColorStyler = this.bgColorStylers.get(msg.color);
        if (bgColorStyler == undefined) {
            bgColorStyler = new BackgroundColorStyler(msg.color);
            this.bgColorStylers.set(msg.color, bgColorStyler);
        }
        bgColorStyler.addCell(msg);
        this.borderStyler.addCell(msg);
        this.boldStyler.addCell(msg);
        this.centerStyler.addCell(msg);
    }


    markContent(msg) {

        let bgColorStyler = this.bgColorStylers.get(msg.color);
        if (bgColorStyler == undefined) {
            bgColorStyler = new BackgroundColorStyler(msg.color);
            this.bgColorStylers.set(msg.color, bgColorStyler);
        }
        bgColorStyler.addCell(msg);

        let fontColorStyler = this.fontColorStylers.get(msg.fontColor);
        if (fontColorStyler == undefined) {
            fontColorStyler = new FontColorStyler(msg.fontColor);
            this.fontColorStylers.set(msg.fontColor, fontColorStyler);
        }
        fontColorStyler.addCell(msg);
        this.centerStyler.addCell(msg);
    }

    markOp(msg) {

        this.boldStyler.addCell(msg);
        this.centerStyler.addCell(msg);
    }
    
    markSymbol(msg) {
        
        this.boldStyler.addCell(msg);
        this.centerStyler.addCell(msg);
    }

    highlight() {

        let spreadsheet = SpreadsheetApp.getActive();
        let sheet = spreadsheet.getActiveSheet();
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

    logDebug(...msgs) {
        gramble.logDebug(this.opt.verbose, ...msgs)
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
    let spreadsheet = SpreadsheetApp.getActive();
    let sheet = spreadsheet.getActiveSheet();
    let range = sheet.getActiveRange();
    if (range == undefined) {
        return;
    }
    let row_start = range.getRowIndex();
    let row_end = range.getLastRow();

    for (let i = row_start; i <= row_end; i++) {
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
    let spreadsheet = SpreadsheetApp.getActive();
    let sheet = spreadsheet.getActiveSheet();
    let range = sheet.getActiveRange();
    if (range == undefined) {
        return;
    }
    let row_start = range.getRowIndex();
    let row_end = range.getLastRow();

    for (let i = row_start; i <= row_end; i++) {
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

function makeInterpreter() {
    const spreadsheet = SpreadsheetApp.getActive();
    const sheet = spreadsheet.getActiveSheet();
    const sheetName = sheet.getName();

    const opts = { verbose: gramble.VERBOSE_TIME };
    const devEnv = new GoogleSheetsDevEnvironment(sheetName, opts);
    const interpreter = gramble.Interpreter.fromSheet(devEnv, sheetName);
    return [interpreter, devEnv];
}

function runTests() {
    const [interpreter, devEnv] = makeInterpreter();
    interpreter.runTests();
    devEnv.highlight();
} 

function highlight() {
    const [interpreter, devEnv] = makeInterpreter();
    devEnv.highlight();
} 

function showSidebar() {
    let html = HtmlService.createTemplateFromFile('sidebar')
        .evaluate()
        .setTitle('Gramble Control Panel');
    SpreadsheetApp.getUi() // Or DocumentApp or SlidesApp or FormApp.
        .showSidebar(html);
}

function showAbout() {
    var ui = SpreadsheetApp.getUi(); // Same variations.
    ui.alert(
        'About Gramble',
        "Gramble is a product of the Digital Technologies Research Centre at the National Research Council of Canada.\n\n" +
            "Tutorial: https://nrc-cnrc.github.io/gramble/ \n\n" +
            "GitHub: https://github.com/nrc-cnrc/gramble/\n\n" +
            "Copyright © 2020-2024 National Research Council Canada.",
        ui.ButtonSet.OK
    );
}

function include(filename) {
    return HtmlService.createHtmlOutputFromFile(filename)
        .getContent();
}


const SAMPLE_PAGE = [
    [],
    ["%% this is a comment"],
    [],
    ["Root =", "text", "gloss"],	
    [""      , "kan",	"walk"],	
    [""     , "pala",   "jump"],	
    [""     , "ikar",	"climb"],	
    [""     , "obo",    "play.the.oboe"],
    [],			
    ["Stem =",	"embed",	"text",	 "person/gloss"],
    [""      , "Root",	    "ta",    "[1subj]"],
    [""      , "Root",	    "sa",	 "[2subj]"],
    [""      , "Root",		"",      "[3subj]"],
    [],
    ["replace text:",	"from",	"to",	"context"],
    ["",	            "t",	"d",    "(r|n)_"],
    [],			
    ["test:",	"text",	"gloss"],	
    ["",        "ikarda", "climb[1subj]"],
    ["",        "ikarta", "climb[1subj]"]	
];

const TUTORIAL_1 = [
    ["Root = ", "text"],
    ["", "call"],
    ["", "jump"],
    [],
    ["Suffix = ", "text"],
    ["", "s"],
    ["", "ed"],
    ["", "ing"],
    [],
    ["Verb = ", "embed", "embed"],
    ["", "Root", "Suffix"]
]

const TUTORIAL_2 = [
    ["Root = ", "text/gloss"],
    ["", "call"],
    ["", "jump"],
    [],
    ["Suffix = ", "text", "gloss"],
    ["", "s", "-3SG.PRES"],
    ["", "ed", "-PAST"],
    ["", "ing", "-PRES"],
    [],
    ["Verb = ", "embed", "embed"],
    ["", "Root", "Suffix"]
]

const TUTORIAL_3 = [
    ["Root = ", "text/root"],
    ["", "call"],
    ["", "jump"],
    [],
    ["Suffix = ", "text", "tense"],
    ["", "s", "3SG.PRES"],
    ["", "ed", "PAST"],
    ["", "ing", "PRES"],
    [],
    ["Verb = ", "embed", "embed"],
    ["", "Root", "Suffix"]
]

const TUTORIAL_4 = [
    ["Root = ", "text/root/gloss"],
    ["", "call"],
    ["", "jump"],
    [],
    ["Suffix = ", "text", "tense/gloss"],
    ["", "s", "[3SG.PRES]"],
    ["", "ed", "[PAST]"],
    ["", "ing", "[PRES]"],
    [],
    ["Verb = ", "embed", "embed"],
    ["", "Root", "Suffix"]
]

function makeSampleSheet() {
    makeSampleSheetAux("Sample", SAMPLE_PAGE);
}

function makeTutorial1() {
    makeSampleSheetAux("Tutorial_1", TUTORIAL_1);
}

function makeTutorial2() {
    makeSampleSheetAux("Tutorial_2", TUTORIAL_2);
}

function makeTutorial3() {
    makeSampleSheetAux("Tutorial_3", TUTORIAL_3);
}

function makeTutorial4() {
    makeSampleSheetAux("Tutorial_4", TUTORIAL_4);
}


function makeSampleSheetAux(sheetName, cells) {

    let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();
    let newSheet = activeSpreadsheet.getSheetByName(sheetName);

    if (newSheet == null) {
        newSheet = activeSpreadsheet.insertSheet();
        newSheet.setName(sheetName);
    }

    setDataInSheet(newSheet, 1, 1, cells);

    highlight();

    return { "success": true };
}

function makeNewSheet(symbol, sheetName, data) {

    let newSymbol = sheetName + "_1";

    let activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    let newSheet = activeSpreadsheet.getSheetByName(newSymbol);
    
    while (newSheet != null) {
        // Keep incrementing the sheet name until you find an unused one 
        let sheetNameParts = newSymbol.split("_");
        let lastPart = sheetNameParts[sheetNameParts.length-1];
        let num = 0;
        if (/^\d+$/.test(lastPart)) {
            num = parseInt(lastPart);        
            sheetNameParts.pop();
        }
        let numAsStr = (num+1).toString();
        sheetNameParts.push(numAsStr);
        newSymbol = sheetNameParts.join("_");
        newSheet = activeSpreadsheet.getSheetByName(newSymbol);
    }

    // make the new sheet with the given data
    newSheet = activeSpreadsheet.insertSheet();
    newSheet.setName(newSymbol);
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
    let autoState = undefined;
    try {
      autoState = PropertiesService.getUserProperties().getProperty('autoState');
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

    const tutorialMenu = ui.createMenu('Tutorial sheets')
                           .addItem('1: Simple English', "makeTutorial1")
                           .addItem('2: Text <-> Gloss', "makeTutorial2")
                           .addItem('3: Adding another field', "makeTutorial3")
                           .addItem('4: Multi-field with glosses', "makeTutorial4")

    ui.createMenu('Gramble')
    
        .addItem('Show sidebar', 'showSidebar')
        .addSeparator()
        .addItem('Run unit tests', 'runTests')
        .addSeparator()
        .addItem('Highlight', 'highlight')
        .addItem('Comment', 'GrambleComment')
        .addItem('Uncomment', 'GrambleUncomment')
        .addSeparator()
        .addItem('Create sample project', 'makeSampleSheet')
        .addSubMenu(tutorialMenu)
        .addSeparator()
        .addItem('About Gramble', 'showAbout')
        .addToUi();

    if (autoEnabled_()) {
        showSidebar();
    }
}
