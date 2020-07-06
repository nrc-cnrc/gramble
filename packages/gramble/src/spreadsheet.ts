import {GCell, GEntry, GRecord, GTable, Literal, Etcetera, Transducer, transducerFromTable} from "./transducers"
import { GPosition } from "./util";
import { Tier } from "./tierParser";

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
            record.push(new Literal(key, cell));
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


function toObj(table: GTable): {[key:string]:string}[][] {
    return table.map(record => {
        return record.map(entry => {
            return { tier: entry.tier.text, 
                    text: entry.value.text,
                    sheet: entry.value.sheet, 
                    row: entry.value.row.toString(),
                    column: entry.value.col.toString() };
        });
    });
}


function objToTable(obj: { [key: string]: string; }): GTable {
    const record : GRecord = [];
    for (const key in obj) {
        record.push(new Literal(new Tier(key), new GCell(obj[key])));
    }
    return [record];
}


function objToEtcTable(obj: { [key: string]: string; }): GTable {
    const record : GRecord = [];
    for (const key in obj) {
        record.push(new Literal(new Tier(key), new GCell(obj[key])));
        record.push(new Etcetera(new Tier(key)));
    }
    return [record];
}



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

    protected transducerTable: Map<string, Transducer> = new Map();

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

    public getTransducer(name: string): Transducer {
        const result = this.transducerTable.get(name);
        if (result == undefined) {
            throw new Error(`Could not find symbol: ${name}`);
        }
        return result;
    }

    public complete(input: {[key: string]: string}, 
                    symbolName: string = 'MAIN', 
                    randomize: boolean = false, 
                    maxResults: number = -1,
                    accelerate: boolean = true): {[key: string]: string}[][] {
        const table = objToEtcTable(input);
        const transducer = this.getTransducer(symbolName);
        const results = [...transducer.transduceFinal(table, this.transducerTable, randomize, maxResults, accelerate)];
        return toObj(results);
    }

    
    public completeFlatten(input: {[key: string]: string}, 
                    symbolName: string = 'MAIN', 
                    randomize: boolean = false, 
                    maxResults: number = -1,
                    accelerate: boolean = true): {[key: string]: string}[]  {
        return this.flatten(this.complete(input, symbolName, randomize, maxResults, accelerate));
    }


    public parse(input: {[key: string]: string}, 
                symbolName: string = 'MAIN', 
                randomize: boolean = false, 
                maxResults: number = -1,
                accelerate: boolean = true): {[key: string]: string}[][] {
        const table = objToTable(input);
        const transducer = this.getTransducer(symbolName);
        const results = [...transducer.transduceFinal(table, this.transducerTable, randomize, maxResults, accelerate)];
        return toObj(results);
    }

    public parseFlatten(input: {[key: string]: string}, 
                symbolName: string = 'MAIN', 
                randomize: boolean = false, 
                maxResults: number = -1,
                accelerate: boolean = true): {[key: string]: string}[] {
        return this.flatten(this.parse(input, symbolName, randomize, maxResults, accelerate));
}

    public generate(symbolName: string = 'MAIN', 
                randomize: boolean = false, 
                maxResults: number = -1,
                accelerate: boolean = true): {[key: string]: string}[][] {
        const transducer = this.getTransducer(symbolName);
        const results = [...transducer.generate(this.transducerTable, randomize, maxResults, accelerate)];
        return toObj(results);
    }

    public generateFlatten(symbolName: string = 'MAIN', 
                randomize: boolean = false, 
                maxResults: number = -1,
                accelerate: boolean = true): {[key: string]: string}[] {
        return this.flatten(this.generate(symbolName, randomize, maxResults, accelerate));
    }

    public sample(symbolName: string = 'MAIN', 
                maxResults: number = 1,
                accelerate: boolean = true): {[key: string]: string}[][] {
        const transducer = this.getTransducer(symbolName);
        const results = [...transducer.sample(this.transducerTable, maxResults, accelerate)];
        return toObj(results);
    }

    public sampleFlatten(symbolName: string = 'MAIN', 
                maxResults: number = -1,
                accelerate: boolean = true): {[key: string]: string}[] {
        return this.flatten(this.sample(symbolName, maxResults, accelerate));
    }
    
    public flatten(input: {[key: string]: string}[][]): {[key: string]: string}[] {
        return input.map(record => {
            var result: {[key: string]: string} = {};
            for (const entry of record) {
                if (entry.tier in result) {
                    result[entry.tier] += entry.text;
                } else {
                    result[entry.tier] = entry.text;
                }
            }
            return result;
        });
    }

    public containsResult(resultTable: {[key: string]: string}[], target: GEntry) {
        for (const resultMap of resultTable) {
            for (const key in resultMap) {
                if (key != target.tier.text) {
                    continue;
                }
                if (resultMap[key] == target.value.text) {
                    return true;
                }
            }
        }
        
        if (target.value.text.length == 0) {
            return true;  // if there's no output, and no output is expected, we're good!
        }
        return false;
    }

    public equalsResult(resultTable: {[key: string]: string}[], target: GEntry) {
        var found = false;
        for (const resultMap of resultTable) {
            for (const key in resultMap) {
                if (key != target.tier.text) {
                    continue;
                }
                if (resultMap[key] == target.value.text) {
                    found = true;
                    continue;
                }
                return false;
            }
        }
        if (!found && target.value.text.length == 0) {
            return true;  // if there's no output, and no output is expected, we're good!
        }
        return found;
    }


    public runTests(highlighter: DevEnvironment): void {
        for (const [symbolName, testTable] of this.testTable.entries()) {
            for (const record of testTable) {
                const inputRecord: {[key: string]: string} = {}; 
                const containsRecord: GRecord = []; 
                const equalsRecord: GRecord = []; 
                
                for (const entry of record) {
                    var parts = entry.tier.text.split(" ");
                    if (parts.length != 2) {
                        highlighter.markError(entry.tier.sheet, entry.tier.row, entry.tier.col,
                            "Invalid test tier: " + entry.tier.text, "error");
                        continue;
                    }
                    const command = parts[0].trim();
                    const tier = parts[1].trim();
                    if (command == "input") {
                        inputRecord[tier] = entry.value.text;
                    } else if (command == "contains") {
                        containsRecord.push(new Literal(new Tier(tier), entry.value));
                    } else if (command == "equals") {
                        equalsRecord.push(new Literal(new Tier(tier), entry.value));
                    }
                }
                
                const result = this.parse(inputRecord, symbolName, false, -1);
                const resultFlattened = this.flatten(result);
                
                for (const target of containsRecord) {
                    if (!this.containsResult(resultFlattened, target)) {
                        highlighter.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result does not contain specified value. " + 
                            "Actual value: \n" + resultFlattened, "error");
                    } else {
                        highlighter.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result contains specified value: \n" + resultFlattened, "info");
                    }
                }

                for (const target of equalsRecord) {
                    if (!this.equalsResult(resultFlattened, target)) {
                        highlighter.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result does not equal specified value. " + 
                            "Actual value: \n" + resultFlattened, "error");
                    } else {
                        highlighter.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result equals specified value: \n" + resultFlattened, "info");
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
            const pos = new GPosition(sheetName, rowIdx, colIdx);
            const cell = new GCell(text.trim(), pos);
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
                    devEnv: DevEnvironment): Project {

        for (var [rowIdx, row] of cells.entries()) {
            this.addRow(row, sheetName, rowIdx, devEnv);
        }

        this.compile(devEnv);

        return this;
    }

    public compile(devEnv: DevEnvironment): Project {
        for (const [name, table] of this.symbolTable.entries()) {
            const transducer : Transducer = transducerFromTable(table, this.transducerTable, devEnv);
            this.transducerTable.set(name, transducer);
        }

        for (const transducer of this.transducerTable.values()) {
            transducer.sanityCheck(this.transducerTable, devEnv);
        }

        return this;
    }
}


/**
 * Utility: fetch the item from the table or throw the appropriate error.
 *
 * @param msg the error message to print
 */
function getTableOrThrow(table: Map<string, GTable>, name: string, msg = `Cannot find symbol ${name} in symbol table`): GTable {
    const maybeTable = table.get(name);
    if (maybeTable == undefined) {
        throw new Error(msg);
    }

    return maybeTable;
} 