
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


type SyntaxError = [string, number, number, string, "error"|"warning"|"info"];

function posToStr(sheet: string, row: number, col: number) {
    return `${sheet}:${row}:${col}`;
}

/**
 * An ProgrammerInterface associates [CellPositions]s with error messages, for
 * later display to the user.
 */
export class TextDevEnvironment implements DevEnvironment {

    protected errors: {[key: string]: SyntaxError[]} = {};

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
    public markHeader(sheet: string, row: number, col: number, tier: string): void {}
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
