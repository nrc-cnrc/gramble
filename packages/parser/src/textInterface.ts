import { DevEnvironment } from "./devEnv";
import { readFileSync, existsSync } from "fs";
import { join } from "path";

type SyntaxError = [string, number, number, string, "error"|"warning"|"info"];


function posToStr(sheet: string, row: number, col: number) {
    return `${sheet}:${row}:${col}`;
}

function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}

/**
 * TODO: Replace the naive CSV handling of cellSplit() with the robust
 * CSV parsing of papaparse.
 */
export class TextDevEnvironment implements DevEnvironment {

    constructor(
        public dirname: string 
    ) { }

    protected errors: {[key: string]: SyntaxError[]} = {};

    public hasSource(sheet: string): boolean {
        const path = join(this.dirname, sheet + ".csv");
        return existsSync(path);
    }

    public loadSource(sheet: string): string[][] {
        const path = join(this.dirname, sheet + ".csv");
        const text = readFileSync(path, 'utf8');
        return cellSplit(text);
    }

    public markError(sheet: string, 
                     row: number, 
                     col: number, 
                     msg: string, 
                     level: "error" | "warning" | "info" = "error") {
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
                if (level == "any" || lev == level) {
                    result++;
                }
            }
        }
        return result;
    }

    
    public markTier(sheet: string, row: number, col: number, tier: string): void {}
    public markComment(sheet: string, row: number, col: number): void {}
    public markHeader(sheet: string, row: number, col: number, color: string): void {}
    public markCommand(sheet: string, row: number, col: number): void {}
    public markSymbol(sheet: string, row: number, col: number): void {}
    public setColor(tierName: string, color: string): void {}


    public highlight(): void {
        for (const [sheet, row, col, msg, lvl] of this.getErrorMessages()) {
            const rowStr = (row == -1) ? "unknown" : (row + 1).toString();
            const colStr = (col == -1) ? "unknown" : (col + 1).toString();
            console.error(`${lvl.toUpperCase()}:${sheet}:${row}:${col}: ${msg}`);
        }
    }

    public alert(msg: string): void {
        console.log(msg);
    }
}
