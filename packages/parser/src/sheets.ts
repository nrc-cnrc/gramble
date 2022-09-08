import { NsGrammar } from "./grammars";
import { parseOpCell } from "./ops";
import { NameQualifierTransform } from "./transforms/nameQualifier";

import { 
    TstEnclosure, TstHeader, TstProject, 
    TstNamespace, TstTable, TstComponent, TstComment, MissingParamsTransform, InvalidAssignmentTransform, TstTransform 
} from "./tsts";
import { Cell, CellPos, DevEnvironment, DummyCell } from "./util";

/**
 * Determines whether a line is empty
 * @param row A list of strings, representing the cell text along that row
 * @returns True if the line is empty
 */

 function isLineEmpty(row: string[]): boolean {
    if (row.length == 0) {
        return true;
    }

    for (const cellText of row) {
        if (cellText.trim().length != 0) {
            return false;
        }
    }

    return true;
}

export abstract class SheetComponent {
    public abstract toTST(): TstComponent;
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
            // to reference a non-existent symbol, and we're trying to load it as
            // a possible source file.  we don't freak out about it here, though;
            // that symbol will generate an error message at the appropriate place.
            return;
        }

        //console.log(`loading source file ${sheetName}`);
        const cells = this.devEnv.loadSource(sheetName);

        const sheet = new Sheet(this, sheetName, cells);
        this.sheets[sheetName] = sheet;

        let tst = this.toTST();
        const transforms: TstTransform[] = [
            new MissingParamsTransform(),
            new InvalidAssignmentTransform()
        ]
        for (const t of transforms) {
            tst = t.transform(tst) as TstProject;
        }
        let grammar = tst.toGrammar() as NsGrammar;

        // check to see if any names didn't get resolved

        const nameQualifier = new NameQualifierTransform();
        grammar = nameQualifier.transform(grammar) as NsGrammar;

        const unresolvedNames: Set<string> = new Set(); 
        for (const name of grammar.getUnresolvedNames()) {
            const firstPart = name.split(".")[0];
            unresolvedNames.add(firstPart);
        }

        for (const possibleSheetName of unresolvedNames) {
            this.addSheet(possibleSheetName);
        } 

        return;
    }

    public convertToSingleSheet(): string[][] {

        const results: string[][] = [];

        for (const sheet of Object.values(this.sheets)) {
            results.push(...sheet.convertToSingleSheet());
            results.push([]);  // add an extra line just to make it a little more readable
        }

        return results;
    }

    public toTST(): TstProject {
        const project = new TstProject(new DummyCell());
        for (const [sheetName, sheet] of Object.entries(this.sheets)) {
            if (sheetName == this.mainSheetName) {
                continue; // save this for last
            }
            const tstSheet = sheet.toTST();
            project.addChild(tstSheet);
        }

        if (!(this.mainSheetName in this.sheets)) { 
            return project; // unset or incorrect main sheet name
        }

        const mainTstSheet = this.sheets[this.mainSheetName].toTST();
        project.addChild(mainTstSheet);
        return project;
    }

    public message(msg: any): void {
        this.devEnv.message(msg);
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

    public message(msg: any): void {
        msg["sheet"] = this.name;
        this.project.message(msg);
    }

    public convertToSingleSheet(): string[][] {

        if (this.cells.length == 0) {
            return [];
        }

        const results: string[][] = [[ this.name+":", "namespace:" ]];

        for (const row of this.cells) {
            if (row.length > 0 && row[0].startsWith("%%")) {
                results.push(row);
                continue;
            }
            results.push([ "", "", ...row ]);
        }

        return results;
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
    public toTST(): TstNamespace {
    
        // sheets are treated as having an invisible cell containing their names at 0, -1
        let startCell: SheetCell = new SheetCell(this, this.name, 0, -1);

        let result = new TstNamespace(startCell);

        let stack: {tst: TstEnclosure, row: number, col: number}[] = 
                [{ tst: result, row: 0, col: -1 }];

        let maxCol: number = 0; // keep track of the rightmost column we've
                                // encountered, because we need to pad rows until
                                // then.  otherwise we can miss empty string content 
                                // at the end of a line
    
        // Now iterate through the cells, left-to-right top-to-bottom
        for (let rowIndex = 0; rowIndex < this.cells.length; rowIndex++) {
    
            if (isLineEmpty(this.cells[rowIndex])) {
                continue;
            }
    
            const rowIsComment = this.cells[rowIndex][0].trim().startsWith('%%');
            
            const colWidth = this.cells[rowIndex].length;
            maxCol = Math.max(maxCol, colWidth);

            for (let colIndex = 0; colIndex < maxCol; colIndex++) {
    
                let cellText = "";

                if (colIndex < colWidth) {
                    cellText = this.cells[rowIndex][colIndex].trim().normalize("NFD");
                }
                
                const cell = new SheetCell(this, cellText, rowIndex, colIndex);
                
                if (rowIsComment) {
                    const comment = new TstComment(cell);
                    comment.message({ type: "comment" });
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
                    // it's an operation, which starts a new enclosures
                    const op = parseOpCell(cell.text);
                    const newEnclosure = op.toTST(cell);
                    cell.message({ type: "command" });
                    try {                    
                        top.tst.addChild(newEnclosure);
                        const newTop = { tst: newEnclosure, row: rowIndex, col: colIndex };
                        stack.push(newTop);
                    } catch (e) {
                        cell.message({
                            type: "error",
                            shortMsg: `Unexpected operator: ${cell.text}`,
                            longMsg: "This looks like an operator, but only a header can follow a header."
                        });
                    }
                    continue;
                } 
    
                // it's a header
                try {
                    const headerCell = new TstHeader(cell);
                    cell.message({ 
                        type: "header", 
                        color: headerCell.getBackgroundColor(0.14) 
                    });
                    
                    if (!(top.tst instanceof TstTable)) {
                        const newTable = new TstTable(cell);
                        top.tst.addChild(newTable);
                        top = { tst: newTable, row: rowIndex, col: colIndex-1 };
                        stack.push(top);
                    }
                    (top.tst as TstTable).addHeader(headerCell);
                } catch(e) {
                    cell.message({
                        type: "error",
                        shortMsg:`Invalid header: ${cell.text}`,
                        longMsg: (e as Error).message
                    });
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

    public message(msg: any): void {
        msg["row"] = this.row;
        msg["col"] = this.col;
        this.sheet.message(msg);
    }

    public get pos(): CellPos {
        return new CellPos(this.sheet.name, this.row, this.col);
    } 

    public get id(): string {
        return `${this.sheet.name}:${this.row}:${this.col}`;
    }
}
