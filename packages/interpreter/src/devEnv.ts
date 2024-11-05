import { parseCSV } from "./utils/strings.js";
import { Message } from "./utils/msgs.js";
import * as Messages from "./utils/msgs.js";
import { Dict } from "./utils/func.js";

/**
 * DevEnvironment
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an DevEnvironment instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the DevEnvironment instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface DevEnvironment {
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

export function posToStr(sheet: string, row: number, col: number) {
    return `${sheet}:${row}:${col}`;
}

export class SimpleDevEnvironment implements DevEnvironment {

    protected sources: {[name: string]: string[][]} = {};
    protected errors: Dict<Message> = {};

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
        // The simple dev env only cares about errors and warnings
        switch (msg.tag) {
            case Messages.Tag.Error: return this.markNote(msg);
            case Messages.Tag.Warning: return this.markNote(msg);
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
        for (const msg of this.getErrors(query)) {
            console.log(`${msg.sheet}:${msg.row}:${msg.col}: ${msg.tag.toUpperCase()}:${msg.longMsg}`);
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

}
