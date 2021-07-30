import { DevEnvironment } from "./util";


export function posToStr(sheet: string, row: number, col: number) {
    return `${sheet}:${row}:${col}`;
}

export type SyntaxError = [string, number, number, string, "error"|"warning"|"info"];

export function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}

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

    public addSourceAsText(sheetName: string, text: string) {
        const cells = cellSplit(text);
        this.addSourceAsCells(sheetName, cells);
    }

    public addSourceAsCells(sheetName: string, cells: string[][]) {
        this.sources[sheetName] = cells;
    }

    public markError(sheet: string, 
                     row: number, 
                     col: number, 
                     shortMsg: string,
                     msg: string, 
                     level: "error" | "warning" | "info" = "error"): void {

        // so as not to keep recording identical errors
        const serializedError = `${sheet}___${row}___${col}___${msg}`;
        if (this.serializedErrors.has(serializedError)) {
            return;
        }
        this.serializedErrors.add(serializedError);

        const key = posToStr(sheet, row, col);
        if (!(key in this.errors)) {
            this.errors[key] = [];
        }
        const error: SyntaxError = [sheet, row, col, msg, level];
        this.errors[key].push(error);
    }

    public logErrors(): void {
        for (const error of Object.values(this.errors)) {
            for (const [sheet, row, col, msg, lev] of error) {
                console.log(`${sheet}:${row}:${col}: ${lev.toUpperCase()}:${msg}`);
            }
        }
    }

    public getErrorMessages(): [string, number, number, string, "error"|"warning"|"info"][] {
        var results: SyntaxError[] = [];
        for (const errors of Object.values(this.errors)) {
            results = results.concat(errors);
        }
        return results;
    }

    public getErrors(sheet: string, row: number, col: number): string[] {
        const key = posToStr(sheet, row, col);
        const results: string[] = [];
        if (!(key in this.errors)) {
            return [];
        }
        return this.errors[key].map(e => e.toString());
    }

    public numErrors(level: "error" | "warning"|"any"): number {
        var result = 0;
        for (const error of Object.values(this.errors)) {
            for (const [sheet, row, col, msg, lev] of error) {
                if (level == "any" && lev != "info" || lev == level) {
                    result++;
                }
            }
        }
        return result;
    }
    
    public markContent(sheet: string, row: number, col: number, tape: string): void {}
    public markComment(sheet: string, row: number, col: number): void {}
    public markHeader(sheet: string, row: number, col: number, color: string): void {}
    public markCommand(sheet: string, row: number, col: number): void {}
    public markSymbol(sheet: string, row: number, col: number): void {}
    public setColor(tape: string, color: string): void {}
    public highlight(): void {}

    public alert(msg: string): void { }

}