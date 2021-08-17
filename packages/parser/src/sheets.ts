import { BINARY_OPS } from "./headers";
import { 
    TstAssignment, TstBinaryOp, TstComment, 
    TstEnclosure, TstHeader, TstProject, 
    TstSheet, TstTable, TstTableOp, 
    TstUnitTest, TstNegativeUnitTest, TstComponent } from "./tsts";
import { Cell, CellPos, DevEnvironment, Gen, StringDict } from "./util";


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


function constructOp(cell: SheetCell): TstEnclosure {
    
    var newEnclosure;

    if (!cell.text.endsWith(":")) {
        throw new Error("Tried to construct an op that didn't end with ':'");
    }
    
    const trimmedText = cell.text.slice(0, cell.text.length-1).trim();
    const trimmedTextLower = trimmedText.toLowerCase();
    if (trimmedTextLower in BINARY_OPS) {
        newEnclosure = new TstBinaryOp(cell);
    } else if (trimmedTextLower == "table") {
        newEnclosure = new TstTableOp(cell);
    } else if (trimmedTextLower == "test") {
        newEnclosure = new TstUnitTest(cell);
    } else if (trimmedTextLower == "testnot") {
        newEnclosure = new TstNegativeUnitTest(cell);
    } else if (cell.pos.col == 0) {
        // if it's none of these special operators, it's an assignment,
        // but note that assignments can only occur in column 0.  if an 
        // unknown word appears elsewhere in the tree, it's an error.
        newEnclosure = new TstAssignment(cell);
    } else {
        // this is an error, flag it for the programmer.  EnclosureComponent
        // defines some useful default behavior in case of this kind of error,
        // like making sure that the child and/or sibling are compiled and 
        // checked for errors.
        newEnclosure = new TstEnclosure(cell);
        cell.markError("error", "Unknown operator", `Operator ${trimmedText} not recognized.`);
    }
    newEnclosure.mark();
    return newEnclosure;
}

export abstract class SheetComponent {

    public abstract toTST(): TstComponent;

    public *generate(
        symbolName: string = "",
        query: StringDict = {},
        random: boolean = false,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {
        yield* this.toTST().generate(symbolName, query, 
                    random, maxRecursion, maxChars);

    }

}

export class SheetProject extends SheetComponent {

    protected sheets: {[name: string]: Sheet} = {};

    constructor(
        public devEnv: DevEnvironment,
        public mainSheetName: string
    ) { 
        super();
        this.addSheet(mainSheetName);
    }
    
    public hasSheet(name: string): boolean {
        return name in this.sheets;
    }

    public addSheet(sheetName: string): void {

        if (this.hasSheet(sheetName)) {
            // already loaded it, don't have to do anything
            return;
        }

        if (!this.devEnv.hasSource(sheetName)) {
            // this is probably a programmer error, in which they've attempted
            // to reference a non-existant symbol, and we're trying to load it as
            // a possible source file.  we don't freak out about it here, though;
            // that symbol will generate an error message at the appropriate place.
            return;
        }

        const cells = this.devEnv.loadSource(sheetName);

        const sheet = new Sheet(this, sheetName, cells);
        this.sheets[sheetName] = sheet;

        const tst = this.toTST();
        const ast = tst.toAST();

        // check to see if any names didn't get resolved
        const unresolvedNames: Set<string> = new Set(); 
        for (const name of ast.qualifyNames()) {
            const firstPart = name.split(".")[0];
            unresolvedNames.add(firstPart);
        }

        for (const possibleSheetName of unresolvedNames) {
            this.addSheet(possibleSheetName);
        }

        return;
    }

    public toTST(): TstProject {
        const result = new TstProject();
        for (const [sheetName, sheet] of Object.entries(this.sheets)) {
            if (sheetName == this.mainSheetName) {
                continue; // save this for last
            }
            const tstSheet = sheet.toTST();
            result.addSheet(tstSheet);
        }

        if (!(this.mainSheetName in this.sheets)) { 
            return result; // unset or incorrect main sheet name
        }

        const mainTstSheet = this.sheets[this.mainSheetName].toTST();
        result.addSheet(mainTstSheet);
        return result;
    }

    public markError(
        sheet: string,
        row: number,
        col: number,
        shortMsg: string,
        longMsg: string,
        severity: "error" | "warning"
    ) {
        this.devEnv.markError(sheet, row, col, shortMsg, longMsg, severity);
    }

    public markComment(
        sheet: string,
        row: number,
        col: number
    ): void {
        this.devEnv.markComment(sheet, row, col);
    }

    public markCommand(
        sheet: string,
        row: number,
        col: number
    ): void {
        this.devEnv.markCommand(sheet, row, col);
    }

    markHeader(name: string, row: number, col: number, color: string) {
        this.devEnv.markHeader(name, row, col, color);
    }

    markContent(name: string, row: number, col: number, color: string) {
        this.devEnv.markContent(name, row, col, color);
    }

}

export class Sheet extends SheetComponent {

    constructor(
        public project: SheetProject,
        public name: string,
        public cells: string[][]
    ) { 
        super();
    }

    //public cells: SheetCell[][] = [];

    public markError(
        row: number,
        col: number,
        severity: "error" | "warning",
        shortMsg: string,
        longMsg: string
    ) {
        this.project.markError(this.name, row, col, shortMsg, longMsg, severity);
    }

    public markHeader(row: number, col: number, color: string): void {
        this.project.markHeader(this.name, row, col, color);
    }

    public markContent(row: number, col: number, color: string): void {
        this.project.markContent(this.name, row, col, color);
    }

    public markComment(row: number, col: number): void {
        this.project.markComment(this.name, row, col);
    }

    public markCommand(row: number, col: number): void {
        this.project.markCommand(this.name, row, col);
    }

    /**
     * Parses a grid of cells into a syntax tree -- specifically, a "Tabular Syntax Tree (TST)" that
     * represents structures in the tabular syntax.
     * 
     * This is probably the least-intuitive algorithm in the whole engine, but here's the rough idea:
     * 
     * We conceptualize the grid as a nested set of "enclosures", objects representing a cell (like 
     * the cell labeled "2" below) that "encloses" a rectangular region of cells to its right and 
     * below.  "2" below encloses all the cells labeled A.  Enclosures can contain enclosures; 2 and
     * 3 below are both enclosed by 1.  
     * 
        
        * 1: 2: A  A  A  A  A
        *       A  A  A  A  A
        *       A  A  A  A  A
        *    3: B  B  B  B  B
        *       B  B  B  B  B
        * 4: C  C  C  C  C  C
        *    C  C  C  C  C  C
    
     * Since they can contain each other, the parse algorithm below maintains a stack of them.  When 
     * parsing that first A, for example, the state of the stack would be [1,2].  
     * 
     * Enclosures are defined as enclosing until there's something in the cell below them, or 
     * below and to the left, at which point the enclosure is popped off the stack and we start 
     * a new enclosure.  For example, 3 finishes 2, and 4 finishes both 3 and 1.  
     * 
     * Along with the enclosure object, the stack also stores the top row of that enclosure, and the column
     * index that will pop the enclosure off the stack (if we encounter a filled cell less-than-or-
     * equal-to it).  This isn't always the same as the column it originally started in.  There's a 
     * component called [TstTable] that represents just that rectangle alone -- just the A's, for 
     * example -- and its critical column is the one just to the left of its first cell.  (If this weren't
     * the case, the first A in the second row would pop off the table it was supposed to be added to.) 
     * The critical column info used to be stored by each enclosure object itself, but in the end I
     * felt that was information not relevant to the object itself.  It's only relevant to this algorithm,
     * so it should just stay here.
     */
    public toTST(): TstSheet {
    
        // sheets are treated as having an invisible cell containing "__START__" at 0, -1
        var startCell: SheetCell = new SheetCell(this, "__START__", 0, -1);

        var result = new TstSheet(this.name, startCell);

        var stack: {tst: TstEnclosure, row: number, col: number}[] = 
                [{ tst: result, row: 0, col: -1 }];
    
        // Now iterate through the cells, left-to-right top-to-bottom
        for (var rowIndex = 0; rowIndex < this.cells.length; rowIndex++) {
    
            if (isLineEmpty(this.cells[rowIndex])) {
                continue;
            }
    
            const rowIsComment = this.cells[rowIndex][0].trim().startsWith('%%');
            
            for (var colIndex = 0; colIndex < this.cells[rowIndex].length; colIndex++) {
    
                const cellText = this.cells[rowIndex][colIndex].trim();
                const cell = new SheetCell(this, cellText, rowIndex, colIndex);
                
                if (rowIsComment) {
                    const comment = new TstComment(cell);
                    comment.mark();
                    continue;
                }

                let top = stack[stack.length-1];

                // next check if the current cell pops anything off the stack.  keep popping
                // until the top of the stack is allowed to add this cell as a child op, header,
                // or content
                if (cell.text != "" && rowIndex > top.row) {
                    while (colIndex <= top.col) {
                        stack.pop();
                        top = stack[stack.length-1];
                    }
                }
            
                // next check if this is "content" -- that is, something to the lower left
                // of the topmost op.  NB: This is the only kind of operation we'll do on 
                // empty cells, so that, if appropriate, we can mark them for syntax highlighting.
                if (top.tst instanceof TstTable && colIndex >= top.col && rowIndex > top.row) {
                    top.tst.addContent(cell);
                    continue;
                }
    
                // all of the following steps require there to be some explicit content
                if (cellText.length == 0) {
                    continue;
                }
    
                // either we're still in the spec row, or there's no spec row yet
                if (cellText.endsWith(":")) {
                    // it's an operation, which starts a new enclosure
                    const newOp = constructOp(cell);
                    try {
                        top.tst.addChild(newOp);
                        const newTop = { tst: newOp, row: rowIndex, col: colIndex };
                        stack.push(newTop);
                    } catch (e) {
                        cell.markError("error", `Unexpected operator: ${cell.text}`, 
                            "This looks like an operator, but only a header can follow a header.");
                    }
                    continue;
                } 
    
                // it's a header
                try {
                    const headerCell = new TstHeader(cell);
                    headerCell.mark(); 
                    
                    if (!(top.tst instanceof TstTable)) {
                        const newTable = new TstTable(cell);
                        top.tst.addChild(newTable);
                        top = { tst: newTable, row: rowIndex, col: colIndex-1 };
                        stack.push(top);
                    }
                    (top.tst as TstTable).addHeader(headerCell);
                } catch(e) {
                    cell.markError("error", `Invalid header: ${cell.text}`,
                        (e as Error).message);
                }
            }
        }
    
        return result;
    }
}

export class SheetCell implements Cell {

    constructor(
        public sheet: Sheet,
        public text: string,
        public row: number,
        public col: number
    ) {  }

    public markHeader(color: string): void {
        this.sheet.markHeader(this.row, this.col, color);
    }
    
    public markContent(color: string): void {
        this.sheet.markContent(this.row, this.col, color);
    }
    
    public markError(
        severity: "error" | "warning",
        shortMsg: string,
        longMsg: string
    ): void {
        this.sheet.markError(this.row, this.col, severity, shortMsg, longMsg);
    }

    
    public markComment(): void {
        this.sheet.markComment(this.pos.row, this.pos.col);
    }

    
    public markCommand(): void {
        this.sheet.markCommand(this.pos.row, this.pos.col);
    }

    public get pos(): CellPos {
        return new CellPos(this.sheet.name, this.row, this.col);
    }
}