import {GCell, GEntry, GRecord, GTable, SymbolTable, transducerFromTable, tableToMap, flattenToText, objToTable} from "./transducers"

/**
 * Determines whether a line is empty
 * @param row A list of strings, representing the cell text along that row
 * @returns True if the line is empty
 */

function isLineEmpty(row: string[]): boolean {
    if (row.length == 0) {
        return true;
    }

    for (let cellText of row) {
        if (cellText.trim().length != 0) {
            return false;
        }
    }

    return true;
}


/**
 * DevEnvironment
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an DevEnvironment instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the DevEnvironment instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface DevEnvironment {
    markError(sheet: string, row: number, col: number, msg: string, level: "error"|"warning"|"info"): void;
    markTier(sheet: string, row: number, col: number, tier: string): void;
    markComment(sheet: string, row: number, col: number): void;
    markHeader(sheet: string, row: number, col: number, tier: string): void;
    markCommand(sheet: string, row: number, col: number): void;
    markSymbol(sheet: string, row: number, col: number): void;
    setColor(tierName: string, color: string): void;
    highlight(): void;
    alert(msg: string): void;
}

export class BrowserDevEnvironment {

    private errorMessages: [string, number, number, string, "error"|"warning"|"info"][] = [];
    public markTier(sheet: string, row: number, col: number, tier: string): void {}
    public markComment(sheet: string, row: number, col: number): void {}
    public markHeader(sheet: string, row: number, col: number, tier: string): void {}
    public markCommand(sheet: string, row: number, col: number): void {}
    public markSymbol(sheet: string, row: number, col: number): void {}
    public setColor(tierName: string, color: string): void {}

    public markError(sheet: string, 
            row: number, 
            col: number, 
            msg: string, 
            level: "error"|"warning"|"info"): void {

        this.errorMessages.push([sheet, row, col, msg, level]);
    }

    public highlight(): void {
        var errors : string[] = [];
        for (const error of this.errorMessages) {
            const rowStr = (error[1] == -1) ? "unknown" : (error[1] + 1).toString();
            const colStr = (error[2] == -1) ? "unknown" : (error[2] + 1).toString();
            errors.push(error[4].toUpperCase() + 
                            ": " + error[0] + 
                            ", row " + rowStr + 
                            ", column " + colStr + 
                            ": " + error[3]);
        }
        if (errors.length > 0) {
            alert("ERRORS: \n" + errors.join("\n"));
        }
    }

    public alert(msg: string): void {
        alert(msg);
    }
}


export class TextDevEnvironment {

    private errorMessages: [string, number, number, string, "error"|"warning"|"info"][] = [];

    public markTier(sheet: string, row: number, col: number, tier: string): void {}
    public markComment(sheet: string, row: number, col: number): void {}
    public markHeader(sheet: string, row: number, col: number, tier: string): void {}
    public markCommand(sheet: string, row: number, col: number): void {}
    public markSymbol(sheet: string, row: number, col: number): void {}
    public setColor(tierName: string, color: string): void {}

    public markError(sheet: string, 
            row: number, 
            col: number, 
            msg: string, 
            level: "error"|"warning"|"info"): void {

        this.errorMessages.push([sheet, row, col, msg, level]);
    }

    public highlight(): void {
        for (const error of this.errorMessages) {
            const rowStr = (error[1] == -1) ? "unknown" : (error[1] + 1).toString();
            const colStr = (error[2] == -1) ? "unknown" : (error[2] + 1).toString();
            console.error(error[4].toUpperCase() + 
                            ": " + error[0] + 
                            ", row " + rowStr + 
                            ", column " + colStr + 
                            ": " + error[3]);
        }

    }

    public alert(msg: string): void {
        console.log(msg);
    }
}

const REQUIRED_COLORS: string[] = [
    "red", "orange", "yellow", 
    "chartreuse", "green", "aqua", 
    "cyan", "blue", "indigo",
    "violet", "magenta", "burgundy"
];


function isValidColor(colorName: string): boolean {
    if (colorName.trim().length == 0) {
        return false;
    }

    for (let subcolor of colorName.split("-")) {
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

    public constructor(
        protected name: GCell,
        protected symbol: GCell | undefined = undefined,
        protected params: GCell[] = [],
        protected columns: Map<number, GCell> = new Map()
    ) {}

    public addParams(cells: GCell[], highlighter: DevEnvironment): void {

        var cellBuffer: GCell[] = [];

        for (let cell of cells) {
            cellBuffer.push(cell);
            if (cell.text.length == 0) {
                continue;
            }

            for (const param of cellBuffer) {
                highlighter.markHeader(cell.sheet, cell.row, cell.col, cell.text);
                if (param.text.length == 0) {
                    continue;
                }
                this.params.push(param);
                this.columns.set(param.col, param);
            }
        }
    }

    public hasColumn(col: number): boolean {
        return this.columns.has(col);
    }

    public getParam(col: number): GCell {
        const result =  this.columns.get(col);
        if (result == undefined) {
            throw new RangeError("Column index " + col + " not found");
        }
        return result;
    }

    public associateParams(cells: GCell[]): GRecord {
        var record: GRecord = []; 
        for (const cell of cells) {
            const key = this.getParam(cell.col);
            record.push([key, cell]);
        }
        return record;
    }

    public abstract call(cells: GCell[], project: Project): void;

    /**
     * Many functions assign or append their results to the most recently declared symbol.
     * @param GCell 
     */
    public setSymbol(symbol: GCell) {
        this.symbol = symbol;
    }
}


class TableFunction extends GFunction {

    public constructor(name: GCell, symbol: GCell | undefined) {
        super(name);
        if (symbol == undefined) {
            return;
        }
        this.setSymbol(symbol);
    }

    public call(cells: GCell[], project: Project): void {
        if (this.symbol == undefined) {
            throw new Error("Attempted to call table function without active symbol");
        }
        const record = this.associateParams(cells);
        project.addRecordToSymbol(this.symbol.text, record);
    }
}

class TestFunction extends GFunction {

    public constructor(name: GCell, symbol: GCell | undefined) {
        super(name);
        if (symbol == undefined) {
            return;
        }
        this.setSymbol(symbol);
    }

    public call(cells: GCell[], project: Project): void {
        if (this.symbol == undefined) {
            throw new Error("Attempted to call table function without active symbol");
        }
        const record = this.associateParams(cells);
        project.addTestToSymbol(this.symbol.text, record);
    }
}


function makeFunction(name: GCell, 
                       currentSymbol: GCell | undefined, 
                       highlighter: DevEnvironment): GFunction {

    if (name.text == 'add') {

        if (currentSymbol == undefined) {
            highlighter.markError(name.sheet, name.row, name.col, 
                "This command is not preceded by a symbol. " +
                " If you don't assign it to a symbol, it will be ignored.", "warning");
        }
        return new TableFunction(name, currentSymbol);
    } else if (name.text == "test") {
        if (currentSymbol == undefined) {
            highlighter.markError(name.sheet, name.row, name.col, 
                "This test command is not preceded by a symbol. " +
                " Tests without a symbol will not execute", "warning");
        }
        return new TestFunction(name, currentSymbol);
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
 * on it directly, you just have a Project instance and call parse(symbolName, input).
 */
export class Project {
    protected currentFunction: GFunction | undefined = undefined;
    protected currentSymbol: GCell | undefined = undefined;
    protected symbolTable: Map<string, GTable> = new Map();
    protected testTable: Map<string, GTable> = new Map();

    public hasSymbol(name: string): boolean {
        return this.symbolTable.has(name);
    }

    public allSymbols(): string[] {
        return [... this.symbolTable.keys()];
    }

    public addRecordToSymbol(name: string, record: GRecord) {
        getTableOrThrow(this.symbolTable, name).push(record);
    }

    public addTestToSymbol(name: string, record: GRecord) {
        getTableOrThrow(
            this.testTable,
            name,
            `Cannot find symbol ${name} in test table`
        ).push(record);
    }

    public parse(symbolName: string, input: GTable, randomize: boolean = false, maxResults: number = -1, devEnv: DevEnvironment): GTable {
        const table = getTableOrThrow(this.symbolTable, symbolName);
        const parser = transducerFromTable(table, this.symbolTable, devEnv);
        return parser.transduceFinal(input, randomize, maxResults, devEnv);
    }

    public generate(symbolName: string, randomize: boolean = false, maxResults: number = -1, devEnv: DevEnvironment): GTable {
        const table = getTableOrThrow(this.symbolTable, symbolName);
        const parser = transducerFromTable(table, this.symbolTable, devEnv);
        return parser.generate(randomize, maxResults, devEnv);
    }

    public sample(symbolName: string, maxResults: number = 1, devEnv: DevEnvironment): GTable {
        const table = getTableOrThrow(this.symbolTable, symbolName);
        const parser = transducerFromTable(table, this.symbolTable, devEnv);
        return parser.sample(maxResults, devEnv);
    }

    public containsResult(resultTable: GTable, [targetKey, targetValue]: GEntry) {
        const resultMaps = tableToMap(resultTable);
        for (const resultMap of resultMaps) {
            for (const [resultKey, resultValue] of resultMap.entries()) {
                if (resultKey != targetKey.text) {
                    continue;
                }
                if (resultValue == targetValue.text) {
                    return true;
                }
            }
        }
        
        if (targetValue.text.length == 0) {
            return true;  // if there's no output, and no output is expected, we're good!
        }
        return false;
    }

    public equalsResult(resultTable: GTable, [targetKey, targetValue]: GEntry) {
        var found = false;
        const resultMaps = tableToMap(resultTable);
        for (const resultMap of resultMaps) {
            for (const [key, value] of resultMap.entries()) {
                if (key != targetKey.text) {
                    continue;
                }
                if (value == targetValue.text) {
                    found = true;
                    continue;
                }
                return false;
            }
        }
        if (!found && targetValue.text.length == 0) {
            return true;  // if there's no output, and no output is expected, we're good!
        }
        return found;
    }


    public runTests(highlighter: DevEnvironment): void {
        for (const [symbolName, testTable] of this.testTable.entries()) {
            for (const record of testTable) {
                const inputRecord: GRecord = []; 
                const containsRecord: GRecord = []; 
                const equalsRecord: GRecord = []; 
                
                for (const [key, value] of record) {
                    var parts = key.text.split(" ");
                    if (parts.length != 2) {
                        highlighter.markError(key.sheet, key.row, key.col,
                            "Invalid test tier: " + key.text, "error");
                        continue;
                    }
                    const command = parts[0].trim();
                    const tier = parts[1].trim();
                    if (command == "input") {
                        inputRecord.push([new GCell(tier), value]);
                    } else if (command == "contains") {
                        containsRecord.push([new GCell(tier), value]);
                    } else if (command == "equals") {
                        equalsRecord.push([new GCell(tier), value]);
                    }
                }
                
                const input: GTable = [];
                input.push(inputRecord);
                const result = this.parse(symbolName, input, false, -1, highlighter);
                
                for (const [targetKey, targetValue] of containsRecord) {
                    if (!this.containsResult(result, [targetKey, targetValue])) {
                        highlighter.markError(targetValue.sheet, targetValue.row, targetValue.col,
                            "Result does not contain specified value. " + 
                            "Actual value: \n" + flattenToText(result), "error");
                    } else {
                        highlighter.markError(targetValue.sheet, targetValue.row, targetValue.col,
                            "Result contains specified value: \n" + flattenToText(result), "info");
                    }
                }

                for (const [targetKey, targetValue] of equalsRecord) {
                    if (!this.equalsResult(result, [targetKey, targetValue])) {
                        highlighter.markError(targetValue.sheet, targetValue.row, targetValue.col,
                            "Result does not equal specified value. " + 
                            "Actual value: \n" + flattenToText(result), "error");
                    } else {
                        highlighter.markError(targetValue.sheet, targetValue.row, targetValue.col,
                            "Result equals specified value: \n" + flattenToText(result), "info");
                    }
                }
            }
        }
    }

    protected addRow(cellTexts: string[], sheetName: string, rowIdx: number, devEnv: DevEnvironment): void {

        
        if (isLineEmpty(cellTexts)) {
            return;
        }

        const cells: GCell[] = [];
        for (const [colIdx, text] of cellTexts.entries()) {
            const cell = new GCell(text.trim(), sheetName, rowIdx, colIdx);
            cells.push(cell);
        }

        let firstCell = cells[0]
        let firstCellText = firstCell.text;

        if (firstCellText.startsWith('#')) {  // the row's a comment
            for (const cell of cells) {
                if (cell.text.length == 0) {
                    continue;
                }
                devEnv.markComment(cell.sheet, cell.row, cell.col);
            }
            return;
        }

        if (firstCellText.length > 0) {
            if (BUILT_IN_FUNCTIONS.indexOf(firstCellText) < 0) {
                // it's not a built-in function/keyword, so treat it as a new symbol
                this.currentSymbol = firstCell;
                this.symbolTable.set(firstCellText, []);
                this.testTable.set(firstCellText, []);
                devEnv.markSymbol(firstCell.sheet, firstCell.row, firstCell.col);
            } else {
                devEnv.markCommand(firstCell.sheet, firstCell.row, firstCell.col);
            }
            this.currentFunction = makeFunction(firstCell, this.currentSymbol, devEnv);
            this.currentFunction.addParams(cells.slice(1), devEnv);
            return;
        }

        // if none of the above are true, this row represents args to the previous function

        // first make sure there IS a function active
        if (this.currentFunction == undefined) {
            // shouldn't have args when there's no function.  mark them all as errors
            for (const cell of cells.slice(1)) { 
                if (cell.text.length > 0) {
                    devEnv.markError(cell.sheet, cell.row, cell.col, 
                        "Unclear what this cell is here for. " + 
                        "Did you forget a function?", "warning");
                }
            }
            return;
        }

        var args: GCell[] = [];  // a place to hold valid args; don't want to call the function
                                 // with args that (e.g.) don't correspond to a parameter
        for (const cell of cells.slice(1)) { 
            if (!this.currentFunction.hasColumn(cell.col)) {
                if (cell.text.length > 0) {
                    devEnv.markError(cell.sheet, cell.row, cell.col, 
                        "This cell does not appear to belong to a column. " + 
                        "Did you forget a column header above?", "warning");
                    
                }
                continue;
            }
            const param = this.currentFunction.getParam(cell.col);
            devEnv.markTier(cell.sheet, cell.row, cell.col, param.text);
            args.push(cell);
        }

        this.currentFunction.call(args, this);
    }

    public addSheet(sheetName: string, 
                    cells: string[][], 
                    highlighter: DevEnvironment): void {

        for (var [rowIdx, row] of cells.entries()) {
            this.addRow(row, sheetName, rowIdx, highlighter);
        }
    }
}


/**
 * Utility: fetch the item from the table or throw the appropriate error.
 *
 * @param msg the error message to print
 */
function getTableOrThrow(table: SymbolTable, name: string, msg = `Cannot find symbol ${name} in symbol table`): GTable {
    const maybeTable = table.get(name);
    if (maybeTable == undefined) {
        throw new Error(msg);
    }

    return maybeTable;
}
