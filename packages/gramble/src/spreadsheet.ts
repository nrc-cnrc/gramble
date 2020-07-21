import { GPos } from "./util";
import {GCell, GEntry, GRecord, GTable, Literal, Etcetera, Transducer, transducerFromTable, get_field_from_record, record_has_key} from "./transducers"
import { Tier, parseTier, CommentTier } from "./tierParser";
import { ENETUNREACH } from "constants";
import { generateKeyPairSync } from "crypto";

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
    getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][];

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

    public getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][] {
        return this.errorMessages;
    }
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

    public errorMessages: [string, number, number, string, "error"|"warning"|"info"][] = [];

    public getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][] {
        return this.errorMessages;
    }

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

type SymbolType = "table" | "template" | "tier";

class GSymbol {

    protected currentCommand: GCommand | undefined = undefined;
    protected commandColumn: number = Number.POSITIVE_INFINITY; 
                    // the number that the command occurs in, if the first 
                    // cell in a row is after this, it's arguments to call that command

    public tableType : SymbolType | undefined = undefined;

    public table: GTable = [];
    public tests: GTable = [];


    public constructor(
        protected name: GCell,
    ) { }

    public set command(c: GCommand | undefined) {
        this.currentCommand = c;
    }

    public get command(): GCommand | undefined {
        return this.currentCommand;
    }

    public addRecord(record: GRecord, recordType: SymbolType): void {
        if (this.tableType != undefined && this.tableType != recordType) {
            throw new Error(`Added a ${recordType} row to a ${this.tableType} system.`);
        }
        this.tableType = recordType;
        this.table.push(record);
    }

    public addTestRow(record: GRecord): void {
        this.tests.push(record);
    }

    public callCurrentCommand(args: GCell[], project: Project): void {

        // first make sure there IS a function active
        if (this.currentCommand == undefined) {
            // shouldn't have args when there's no function.  mark them all as errors
            for (const cell of args) { 
                if (cell.text.length > 0) {
                    project.devEnv.markError(cell.sheet, cell.row, cell.col, 
                        "Unclear what this cell is here for. " + 
                        "Did you forget a function?", "warning");
                }
            }
            return;
        }

        var argBuffer: GCell[] = [];  // a place to hold valid args; don't want to call the function
                                        // with args that (e.g.) don't correspond to a parameter

        for (const cell of args) { 
            if (!this.currentCommand.hasColumn(cell.col)) {
                if (cell.text.length > 0) {
                    project.devEnv.markError(cell.sheet, cell.row, cell.col, 
                        "This cell does not appear to belong to a column. " + 
                        "Did you forget a column header above?", "warning");
                    
                }
                continue;
            }
            const param = this.currentCommand.getParam(cell.col);
            project.devEnv.markTier(cell.sheet, cell.row, cell.col, param.text);
            argBuffer.push(cell);
        }

        this.currentCommand.call(argBuffer, project);
    }
}

/**
 * GCommand
 * 
 * A GCommand is what is created when the programmer places text in the second column of the
 * sheet.  GCommands guide the interpretation of following rows, both the name of the function that
 * should be executed (e.g. "add" a record to a symbol or add a "test" to a symbol) and the interpretation
 * of positional arguments (e.g. that the third column should be "text", the fourth column should be "down", etc.)
 */
abstract class GCommand {

    protected columns: Map<number, Tier> = new Map();
    protected params: Tier[] = [];

    public constructor(
        protected name: GCell,
        protected symbol: GSymbol,
        params: GCell[] = [],
        devEnv: DevEnvironment
    ) {
        var cellBuffer: GCell[] = [];

        for (let cell of params) {
            cellBuffer.push(cell);
            if (cell.text.length == 0) {
                continue;
            }

            for (const param of cellBuffer) {
                if (param.text.length == 0) {
                    continue;
                }
                const tier = new Tier(param.text, param);
                devEnv.markHeader(cell.sheet, cell.row, cell.col, cell.text);
                this.params.push(tier);
                this.columns.set(param.col, tier);
            }
        }
    }

    public hasColumn(col: number): boolean {
        return this.columns.has(col);
    }

    public getParam(col: number): Tier {
        const result =  this.columns.get(col);
        if (result == undefined) {
            throw new RangeError("Column index " + col + " not found");
        }
        return result;
    }

    public associateParams(cells: GCell[], parseTiers: boolean = false): GRecord {
        var record: GRecord = []; 
        for (const cell of cells) {
            var key = this.getParam(cell.col);
            if (parseTiers) {
                key = parseTier(key.text, key);
            }
            record.push(new Literal(key, cell));
        }
        return record;
    }

    public abstract call(cells: GCell[], project: Project): void;

}

class TableCommand extends GCommand {

    public call(cells: GCell[], project: Project): void {
        const record = this.associateParams(cells);
        this.symbol.addRecord(record, "table");
    }

}

abstract class RestrictedTiersCommand extends TableCommand {
    public constructor(
        protected name: GCell,
        protected symbol: GSymbol,
        params: GCell[] = [],
        devEnv: DevEnvironment
    ) {
        super(name, symbol, params, devEnv);
        const permissibleTiers = this.getPermissibleTiers();
        for (const param of params) {
            if (param.text == "") {
                continue;
            }
            if (permissibleTiers.indexOf(param.text) == -1) {
                devEnv.markError(param.sheet, param.row, param.col,
                    `Parameter ${param.text} is invalid for command ${name.text}.`, "error");
            }
        }
    }

    public abstract getPermissibleTiers(): string[];
}

class TierCommand extends RestrictedTiersCommand {

    public call(cells: GCell[], project: Project): void {
        const record = this.associateParams(cells);
        this.symbol.addRecord(record, "tier");
    }

    public getPermissibleTiers(): string[] {
        return ["name", "initial", "medial", "final"];
    }
}

class DummyCommand extends GCommand {

    public call(cells: GCell[], project: Project): void { }
}

class TestCommand extends GCommand {

    public call(cells: GCell[], project: Project): void {
        const record = this.associateParams(cells);
        this.symbol.addTestRow(record);
    }
}

class NewTemplateCommand extends GCommand {

    public call(cells: GCell[], project: Project): void {
        const record = this.associateParams(cells);
        if (this.symbol.tableType == "table") {
            project.devEnv.markError(this.name.sheet, this.name.row, this.name.col,
                "Attempting to add a template row to an ordinary table", "error");
            return;
        }
        this.symbol.addRecord(record, "template");
    }
}

class TemplateCommand extends GCommand {

    public constructor(
        name: GCell,
        symbol: GSymbol,
        params: GCell[] = [],
        devEnv: DevEnvironment
    ) {
        super(name, symbol, params, devEnv);
    }

    protected renderTemplate(template: GSymbol, record: GRecord): GTable {
        const results : GTable = [];
        for (const templateRow of template.table) {
            const resultRow : GRecord = [];
            for (const entry of templateRow) {
                const val = entry.value.text.match(/\$\{(.*?)\}/g);
                if (val == null) {
                    resultRow.push(entry);
                    continue;
                }
                var resultStr = entry.value.text;
                for (const match of val) {
                    const trimmedMatch = match.slice(2,match.length-1);
                    if (!record_has_key(record, trimmedMatch)) {
                        throw new Error(`Cannot find tier ${trimmedMatch} for template ${this.name.text}`);
                    }
                    const [replacement, etc] = get_field_from_record(record, trimmedMatch);
                    resultStr = resultStr.replace(match, replacement);
                }
                const replacementCell = new GCell(resultStr, entry.value);
                resultRow.push(new Literal(entry.tier, replacementCell));
            }
            results.push(resultRow);
        }
        return results;
    }

    public call(cells: GCell[], project: Project): void {
        const template = project.symbolTable.get(this.name.text);
        if (template == undefined || template.tableType != "template") {
            return;
        }
        const inputRecord = this.associateParams(cells);
        for (const record of this.renderTemplate(template, inputRecord)) {
            this.symbol.addRecord(record, "table");
        }
    }

}

const COMMAND_CONSTRUCTORS: {[key: string]: new (name: GCell, 
                                                symbol: GSymbol,
                                                params: GCell[],
                                                devEnv: DevEnvironment) => GCommand} = {
    
    "add": TableCommand,
    "test": TestCommand,
    "template": NewTemplateCommand,
    "tier": TierCommand,
}

function makeCommand(commandCell: GCell, 
                     currentSymbol: GSymbol, 
                     params: GCell[], 
                     project: Project): GCommand {


    if (commandCell.text in COMMAND_CONSTRUCTORS) {
        const constructor = COMMAND_CONSTRUCTORS[commandCell.text];
        return new constructor(commandCell, currentSymbol, params, project.devEnv);
    }

    if (project.symbolTable.has(commandCell.text)) {
        const template = project.symbolTable.get(commandCell.text);
        if (template == undefined) {  // shouldn't occur
            return new DummyCommand(commandCell, currentSymbol, params, project.devEnv); 
        }
        if (template.tableType != "template") {
            project.devEnv.markError(commandCell.sheet, commandCell.row, commandCell.col,
                `${commandCell.text} is not a template`, "error");
            return new DummyCommand(commandCell, currentSymbol, params, project.devEnv); 
        }
        return new TemplateCommand(commandCell, currentSymbol, params, project.devEnv);
    }

    project.devEnv.markError(commandCell.sheet, commandCell.row, commandCell.col,
        `No command called ${commandCell.text}.  If you defined this elsewhere, ` +
        "make sure that it appears above this cell.", "error");

    return new DummyCommand(commandCell, currentSymbol, params, project.devEnv);
}

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



const VAR_FOREGROUND_COLOR = "#000077";
const BLACK_COLOR = "#000000";


const BG_COLOR_CACHE: {[key: string]: string} = {};
const FG_COLOR_CACHE: {[key: string]: string} = {};

export function getBackgroundColor(tierName: string, saturation: number): string {
    if (!(tierName in BG_COLOR_CACHE)) {           
        const tier = parseTier(tierName, {sheet: "", row: -1, col: -1});
        const color = tier.getColor(saturation);
        BG_COLOR_CACHE[tierName] = color;
    }

    return BG_COLOR_CACHE[tierName];
}

export function getForegroundColor(tierName: string): string {
    if (!(tierName in FG_COLOR_CACHE)) {           
        const tier = parseTier(tierName, {sheet: "", row: -1, col: -1});
        const color = tier.getFgColor();
        FG_COLOR_CACHE[tierName] = color;
    }

    return FG_COLOR_CACHE[tierName];
}

function resultListToString(records: {[key: string]: string}[]): string {
    return records.map(record => 
        Object.entries(record).map(([k, v]) => 
            k + ": " + v).join(", ")).join("\n");
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


    protected currentSymbol: GSymbol | undefined = undefined;
    public symbolTable: Map<string, GSymbol> = new Map();
    protected transducerTable: Map<string, Transducer> = new Map();

    public constructor(
        public devEnv: DevEnvironment
    ) { }

    public hasSymbol(name: string): boolean {
        return this.symbolTable.has(name);
    }

    public allSymbols(): string[] {
        return [... this.symbolTable.keys()];
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


    public runTests(): void {
        for (const [symbolName, symbol] of this.symbolTable.entries()) {
            const testTable = symbol.tests;
            for (const record of testTable) {
                const inputRecord: {[key: string]: string} = {}; 
                const containsRecord: GRecord = []; 
                const equalsRecord: GRecord = []; 
                
                for (const entry of record) {
                    var parts = entry.tier.text.split(" ");
                    if (parts.length != 2) {
                        this.devEnv.markError(entry.tier.sheet, entry.tier.row, entry.tier.col,
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
                const resultFlattened = this.flatten(result)
                
                for (const target of containsRecord) {
                    if (!this.containsResult(resultFlattened, target)) {
                        this.devEnv.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result does not contain specified value. " + 
                            "Actual value: \n" + resultListToString(resultFlattened), "error");
                    } else {
                        this.devEnv.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result contains specified value: \n" + resultListToString(resultFlattened), "info");
                    }
                }

                for (const target of equalsRecord) {
                    if (!this.equalsResult(resultFlattened, target)) {
                        this.devEnv.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result does not equal specified value. " + 
                            "Actual value: \n" + resultListToString(resultFlattened), "error");
                    } else {
                        this.devEnv.markError(target.value.sheet, target.value.row, target.value.col,
                            "Result equals specified value: \n" + resultListToString(resultFlattened), "info");
                    }
                }
            }
        }
    }

    protected addRow(cellTexts: string[], sheetName: string, rowIdx: number): void {

        
        if (isLineEmpty(cellTexts)) {
            return;
        }

        const cells: GCell[] = [];
        for (const [colIdx, text] of cellTexts.entries()) {
            const cell = new GCell(text.trim(), { sheet: sheetName, row: rowIdx, col: colIdx });
            cells.push(cell);
        }

            
        if (cells[0].text.startsWith('%%')) {  // the row's a comment
            for (const cell of cells) {
                if (cell.text.length == 0) {
                    continue;
                }
                this.devEnv.markComment(cell.sheet, cell.row, cell.col);
            }
            return;
        }

        
        if (cells[0].text.startsWith('%')) {  // the first cell's a comment
            this.devEnv.markComment(cells[0].sheet, cells[0].row, cells[0].col);
            cells[0].text = '';
        }

        

        if (cells[0].text.length > 0) {
            this.addSymbol(cells[0]);
        }

        
        if (cells[1].text.startsWith('%')) {  // the first cell's a comment
            this.devEnv.markComment(cells[1].sheet, cells[1].row, cells[1].col);
            cells[1].text = '';
        }

        if (cells.length > 1 && cells[1].text.length > 0) {
            // new command

            if (this.currentSymbol == undefined) {
                this.devEnv.markError(cells[1].sheet, cells[1].row, cells[1].col,
                    "This appears to be a command but no symbol precedes it", "error");
                return;
            }

            this.devEnv.markCommand(cells[1].sheet, cells[1].row, cells[1].col);
            this.currentSymbol.command = makeCommand(cells[1], this.currentSymbol, cells.slice(2), this);
            return;
        }

        if (this.currentSymbol != undefined) {
            this.currentSymbol.callCurrentCommand(cells.slice(2), this);
        }
    }

    public addSymbol(cell: GCell): void {
        this.currentSymbol = new GSymbol(cell);
        this.symbolTable.set(cell.text, this.currentSymbol);
        this.devEnv.markSymbol(cell.sheet, cell.row, cell.col);
    }


    public addSheet(sheetName: string, 
                    cells: string[][]): Project {

        for (var [rowIdx, row] of cells.entries()) {
            this.addRow(row, sheetName, rowIdx);
        }

        this.compile();

        return this;
    }

    public compile(): Project {
        for (const [name, symbol] of this.symbolTable.entries()) {
            if (symbol.tableType != "table") {
                continue;
            }
            const table = symbol.table;
            const transducer : Transducer = transducerFromTable(table, this.transducerTable, this.devEnv);
            this.transducerTable.set(name, transducer);
        }

        for (const transducer of this.transducerTable.values()) {
            transducer.sanityCheck(this.transducerTable, this.devEnv);
        }

        return this;
    }
 
    public getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][] {
        return this.devEnv.getErrorMessages();
    }
}


export class TextProject extends Project {

    public constructor() {
        super(new TextDevEnvironment());
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

