import { parseCSV } from "./utils/strings";
import * as Messages from "./utils/msgs";

/**
 * DevEnvironment
 * 
 * To make an editor (e.g. Google Sheets) "smart" about Gramble, you implement this interface.  Most
 * of the public-facing methods of the Project edifice take an DevEnvironment instance as an argument.
 * When parsing a spreadsheet, executing a unit test, etc., the Parser will notify the DevEnvironment instance
 * that particular cells are errors, comments, column headers, etc.
 */
export interface DevEnvironment {
    getErrorMessages(): [string, number, number, string, "error" | "warning" | "success"][];
    numErrors(level: "error" | "warning"| "any"): number;
    logErrors(): void;
    getErrors(sheet: string, row: number, col: number): string[];

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

export type SyntaxError = [string, number, number, string, "error"|"warning"|"success"];


export class SimpleDevEnvironment implements DevEnvironment {

    protected sources: {[name: string]: string[][]} = {};
    protected errors: {[key: string]: SyntaxError[]} = {};
    protected serializedErrors: Set<string> = new Set();

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
            case Messages.Tag.Error: return this.markNote(msg, "error");
            case Messages.Tag.Warning: return this.markNote(msg, "warning");
        }
    }

    public markNote(msg: Messages.Message, level: "error" | "warning" | "success" = "error"): void {

        const sheet = msg.sheet || "???";
        const row = msg.row || -1;
        const col = msg.col || -1;

        // so as not to keep recording identical errors
        const serializedError = `${sheet}___${row}___${col}___${msg.longMsg}`;
        if (this.serializedErrors.has(serializedError)) {
            return;
        }
        this.serializedErrors.add(serializedError);

        const key = posToStr(sheet, row, col);
        if (!(key in this.errors)) {
            this.errors[key] = [];
        }
        const error: SyntaxError = [sheet, row, col, msg.longMsg, level];
        this.errors[key].push(error);
    }

    public logErrors(): void {
        for (const error of Object.values(this.errors)) {
            for (const [sheet, row, col, msg, lev] of error) {
                console.log(`${sheet}:${row}:${col}: ${lev.toUpperCase()}:${msg}`);
            }
        }
    }

    public getErrorMessages(): [string, number, number, string, "error"|"warning"|"success"][] {
        let results: SyntaxError[] = [];
        for (const errors of Object.values(this.errors)) {
            results = results.concat(errors);
        }
        return results;
    }

    public getErrors(sheet: string, row: number, col: number): string[] {
        const key = posToStr(sheet, row, col);
        if (!(key in this.errors)) {
            return [];
        }
        return this.errors[key].map(e => e.toString());
    }

    public numErrors(level: "error" | "warning"|"any"): number {
        let result = 0;
        for (const error of Object.values(this.errors)) {
            for (const [sheet, row, col, msg, lev] of error) {
                if (level == "any" && lev != "success" || lev == level) {
                    result++;
                }
            }
        }
        return result;
    }

    public highlight(): void {}

    public alert(msg: string): void { }

}