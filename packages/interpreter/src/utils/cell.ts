import { DEFAULT_OPTIONS, Options } from "./options.js";

/**
 * A convenience class encapsulating information about where a cell
 * is.  Every component of the abstract syntax tree has one of these;
 * if it's a cell, that's just its position on a spreadsheet; if it's a
 * complex component, it's the position of its first cell.
 *
 * By convention we treat the spreadsheet itself as a component with 
 * its first cell at -1, -1.
 */
export class Pos {

    public format: string;

    constructor(
        public readonly sheet: string = "?",
        public readonly row: number = -1,
        public readonly col: number = -1,
        opt: Options = DEFAULT_OPTIONS,
    ) {
        this.format = opt.posFormat;
    }

    public toString(): string {
        switch (this.format) {
            case "A1":      return getA1Notation(this.sheet, this.row, this.col);
            case "1-based":
            case "0-based":
            default:        return `${this.sheet}:${this.rowF}:${this.colF}`;
        }
    }

    get colF(): string {
        switch (this.format) {
            case "A1":      return letterFromNumber(this.col);
            case "1-based": return (this.col+1).toString();
            case "0-based":
            default:        return this.col.toString();
        }
    }

    get rowF(): string {
        switch (this.format) {
            case "A1":
            case "1-based": return (this.row+1).toString();
            case "0-based":
            default:        return this.row.toString();
        }
    }
}

function letterFromNumber(n: number): string { 
    let letter = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.charAt(n % 26)
    let concat = Math.floor(n / 26);
    return concat > 0 ? letterFromNumber(concat-1) + letter : letter;
};

function getA1Notation(sheet: string, row: number, col: number): string {
    if (sheet == "") {
        return `${letterFromNumber(col)}${(row+1)}`;
    }
    return `${sheet}!${letterFromNumber(col)}${(row+1)}`;
}

export function hasPos(p: any): p is { pos: Pos } {
    return p !== undefined && p.pos !== undefined;
}

export class Cell {

    constructor(
        public text: string,
        public pos: Pos
    ) { }

    public get id(): string { 
        return this.pos.toString();
    }

    public toString(): string {
        return `${this.pos.toString()} '${this.text}'`;
    }

}
