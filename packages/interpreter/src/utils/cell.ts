
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

    constructor(
        public readonly sheet: string = "?",
        public readonly row: number = -1,
        public readonly col: number = -1
    ) { }

    public toString(): string {
        return `${this.sheet}:${this.row}:${this.col}`;
    }
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

}
