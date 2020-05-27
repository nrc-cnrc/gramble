import {DevEnvironment, Project} from "./spreadsheet"
import {GTable} from "./transducers"



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

    private errorCells: [string, number, number, string, "error"|"warning"|"info"][] = [];
    private commentCells: [string, number, number][] = [];
    private commandCells: [string, number, number][] = [];
    private headerCells: [string, number, number, string][] = [];
    private tierCells: [string, number, number, string][] = [];
    private namedColors: Map<string, number> = new Map();
    private calculatedColors: Map<string, number> = new Map();

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
    

    private getColor(tierName: string): string {
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
        const [r, g, b] = this.HSVtoRGB(averageHue, DEFAULT_SATURATION, DEFAULT_VALUE);
        return "#" + r.toString(16) + g.toString(16) + b.toString(16);
    }

    public markError(sheet: string, 
                    row: number, 
                    col: number, 
                    msg: string, 
                    level: "error" | "warning" | "info"): void {
        this.errorCells.push([sheet, row, col, msg, level]);
    }

    public markComment(sheet: string, row: number, col: number): void {
        this.commentCells.push([sheet, row, col]);
    }

    public markHeader(sheet: string, row: number, col: number, tier: string): void {
        this.headerCells.push([sheet, row, col, tier]);
    }

    public markTier(sheet: string, row: number, col: number, tier: string): void {
        this.tierCells.push([sheet, row, col, tier]);
    }

    public markCommand(sheet: string, row: number, col: number): void {
        this.commandCells.push([sheet, row, col]);
    }

    protected highlightHeaders(currentSheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        var rangeNotationsByColor: Map<string,string[]> = new Map();

        for (const [sheetName, row, col, tier] of this.headerCells) {
            if (sheetName != currentSheet) {
                continue;
            }
            const color = this.getColor(tier);
            let sheet = spreadsheet.getSheetByName(sheetName);
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
            const sheet = spreadsheet.getSheetByName(currentSheet);
            const cells = sheet.getRangeList(ranges);
            cells.setBorder(true, false, true, false, false, false);
            cells.setBackground(color);
            cells.setFontStyle("normal");
            cells.setFontWeight("bold");
            cells.setFontColor(null);
        }
    }

    
    protected highlightCommands(currentSheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheetName, row, col] of this.commandCells) {
            let sheet = spreadsheet.getSheetByName(sheetName);
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


    protected highlightErrors(currentSheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheetName, row, col, msg, level] of this.errorCells) {
            let sheet = spreadsheet.getSheetByName(sheetName);
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

    protected highlightComments(currentSheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        for (const [sheetName, row, col] of this.commentCells) {
            let sheet = spreadsheet.getSheetByName(sheetName);
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
    
    protected highlightTiers(currentSheet: string): void {
        var spreadsheet = SpreadsheetApp.getActive();
        
        var rangeNotationsByColor: Map<string,string[]> = new Map();

        for (const [sheetName, row, col, tier] of this.tierCells) {
            if (sheetName != currentSheet) {
                continue;
            }
            const color = this.getColor(tier);
            let sheet = spreadsheet.getSheetByName(sheetName);
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
            const sheet = spreadsheet.getSheetByName(currentSheet);
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
        var sheetName = sheet.getName();
        sheet.clearNotes();
        sheet.clearFormats();
        this.highlightComments(sheetName);
        this.highlightCommands(sheetName);
        this.highlightHeaders(sheetName);
        this.highlightTiers(sheetName);
        this.highlightErrors(sheetName);
    }
}

function makeProject(highlighter: DevEnvironment): Project {
    var spreadsheet = SpreadsheetApp.getActive();
    var project = new Project();
    var sheet = spreadsheet.getActiveSheet();
    //for (let sheet of spreadsheet.getSheets()) {
    var sheetName = sheet.getName();
    var range = sheet.getDataRange();
    var cells = range.getDisplayValues();
    project.addSheet(sheetName, cells, highlighter);
    //}

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

function codeFromTable(symbolName: string, table: GTable): string[][] {
    var results: string[][] = [];
    var keys: string[] = [];

    for (const record of table) {

        const newKeys = record.map(([key, value]) => key.text);
        const values = record.map(([key, value]) => value.text);
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

function newSheetFromTable(newSymbolName: string, oldSymbolName: string, table: GTable): Sheet {
    var activeSpreadsheet = SpreadsheetApp.getActiveSpreadsheet();

    var newSheet = activeSpreadsheet.getSheetByName(newSymbolName);
    
    while (newSheet != null) {
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

function createHTMLFromTable(table: GTable, highlighter: DevEnvironment): string {
    var result = '<table style="margin: auto">';
    var previousKeys: string[] = [];
    for (const record of table) {
        result += '<tr style="padding: 5px">';
        var keys: string[] = [];
        var keysAndColors: [string, string][] = [];
        var valuesAndColors: [string, string][] = [];
        for (const [key, value] of record) {
            keys.push(key.text);
            const color = highlighter.getColor(key.text)
            keysAndColors.push([key.text, color]);
            valuesAndColors.push([value.text, color]);
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

    const highlighter = new GoogleSheetsHighlighter();
    const project = makeProject(highlighter);

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
    const result = project.sample(cellText, 10);
    const htmlString = createHTMLFromTable(result, highlighter);
    showDialog(htmlString, "Results of " + cellText);

}

function GrambleGenerate(): void {
    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to generate.")
        return;
    }

    const highlighter = new GoogleSheetsHighlighter();
    const project = makeProject(highlighter);

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
    const result = project.generate(cellText);
    const html_string = createHTMLFromTable(result, highlighter);
    showDialog(html_string, "Results of " + cellText);

}

function GrambleGenerateToSheet(): void {

    const spreadsheet = SpreadsheetApp.getActive();
    const range = spreadsheet.getCurrentCell();
    if (range == undefined) {
        alert("Select one cell (containing a symbol name) that you would like to generate.")
        return;
    }

    const highlighter = new GoogleSheetsHighlighter();
    const project = makeProject(highlighter);

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
    const result = project.generate(cellText);

    const newSymbolName = cellText + "_results_1";
    const newSheet = newSheetFromTable(newSymbolName, cellText, result);
    
    var sheetName = newSheet.getName();
    var new_range = newSheet.getDataRange();
    var cells = new_range.getDisplayValues();
    project.addSheet(sheetName, cells, highlighter);
    highlighter.highlight();

    newSheet.activate();

}

function GrambleHighlighting(): void {
    const highlighter = new GoogleSheetsHighlighter();
    const project = makeProject(highlighter);
    highlighter.highlight();
}


function GrambleTest(): void {
    const highlighter = new GoogleSheetsHighlighter();
    const project = makeProject(highlighter);
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