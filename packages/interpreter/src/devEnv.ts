import { Dict } from "./utils/func.js";
import { logDebug, logObject } from "./utils/logging.js";
import { Pos } from "./utils/cell.js";
import { Message } from "./utils/msgs.js";
import * as Messages from "./utils/msgs.js";
import { Options } from "./utils/options.js";
import { parseCSV } from "./utils/strings.js";

/**
 * DevEnvironment
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an DevEnvironment instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the DevEnvironment instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface DevEnvironment {
    opt: Options;

    logDebug(...msgs: any[]): void;
    logObject(obj: any, depth: number | null): void;

    getErrors(query?: Partial<Message>): Message[];
    logErrors(query?: Partial<Message>): void;

    hasSource(sheet: string): boolean;
    loadSource(sheet: string): string[][];

    addSourceAsText(sheetName: string, text: string): void;
    addSourceAsCells(sheetName: string, cells: string[][]): void;
    
    message(msg: any): void;
    
    highlight(): void;
    alert(msg: string): void;
}

export class SimpleDevEnvironment implements DevEnvironment {

    protected sources: {[name: string]: string[][]} = {};
    protected errors: Dict<Message> = {};

    public opt: Options;

    constructor(opt: Partial<Options> = {}) {
        this.opt = Options(opt);
    }

    public hasSource(sheet: string): boolean {
        return sheet in this.sources;
    }

    public loadSource(sheet: string): string[][] {
        if (!(sheet in this.sources)) {
            throw new Error(`Source not found for ${sheet}`);
        }
        return this.sources[sheet];
    }

    public addSourceAsText(sheetName: string, text: string): void {
        const cells = parseCSV(text);
        this.addSourceAsCells(sheetName, cells);
    }

    public addSourceAsCells(sheetName: string, cells: string[][]) {
        this.sources[sheetName] = cells;
    }

    public message(msg: any): void {
        // The simple dev env only cares about errors, warnings, and test failures.
        switch (msg.tag) {
            case Messages.Tag.Error: return this.markNote(msg);
            case Messages.Tag.Warning: return this.markNote(msg);
            case Messages.Tag.TestFailed:   return this.markNote(msg);
            case Messages.Tag.TestSkipped:  return this.markNote(msg);
        }
    }

    public markNote(msg: Messages.Message): void {

        const sheet = msg.sheet || "???";
        const row = msg.row || 0;
        const col = msg.col || 0;

        const key = `${sheet}___${row}___${col}___${msg.longMsg}`;
        this.errors[key] = msg;
    }

    public logErrors(query: Partial<Message> = {}): void {
        const emojis = {
            error:        "❌ ",
            warning:      "⚠️ ",
            test_passed:  "✅ ",
            test_failed:  "❌ ",
            test_skipped: "⚠️ ",
        }
        for (const msg of this.getErrors(query)) {
            const emoji = msg.tag in emojis ? emojis[msg.tag as keyof typeof emojis] : "";
            console.error(`${emoji}${new Pos(msg.sheet, msg.row, msg.col, this.opt)}: ` +
                        `${msg.tag.toUpperCase().replace(/_/g, ' ')}: ${msg.longMsg}`);
        }
    }

    public getErrors(query: Partial<Message> = {}): Message[] {
        let errors = Object.values(this.errors);
        for (const key of Object.keys(query) as (keyof Message)[]) {
            errors = errors.filter(e => e[key] == query[key]);
        }
        return errors;
    }

    public highlight(): void {}

    public alert(msg: string): void { }

    public logDebug(...msgs: any[]) {
        logDebug(this.opt.verbose, ...msgs);
    }

    public logObject(obj: any, depth: number | null = 2): void {
        logObject(this.opt.verbose, obj, depth);
    }

}
