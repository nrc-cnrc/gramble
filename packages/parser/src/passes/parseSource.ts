import { PassEnv, Pass } from "../passes";
import { CommandMsg, CommentMsg, Err, Msgs, Result } from "../msgs";
import { 
    TstAssignment,
    TstEnclosure, 
    TstCollection, 
    TstOp, 
    TstGrid,
    TST
} from "../tsts";
import { exhaustive } from "../components";
import { Worksheet, Workbook, Source } from "../sources";
import { Cell, CellPos } from "../util";
import { CollectionOp, parseOp } from "../ops";
import { RESERVED_WORDS } from "../utils/reserved";

/**
 * This takes grids of cells (Worksheets) and collections of them
 * (Workbooks) and turns them into the basic syntactic objects
 * (TstCollections, TstOps, TstGrids, and TstContent).
 */
export class ParseSource extends Pass<Source,TST> {

    public get desc(): string {
        return "Transforming source to TSTs";
    }

    public transform(s: Source, env: PassEnv): Result<TST> {

        switch(s.tag) {
            case "workbook":  return this.handleWorkbook(s as Workbook, env);
            case "worksheet": return this.handleWorksheet(s as Worksheet, env);
            default: exhaustive(s);
        }
    }

    public handleWorkbook(s: Workbook, env: PassEnv): Result<TST> {

        const projectCell = new Cell("", new CellPos("", -1, -1));
        const project = new TstCollection(projectCell);
        const msgs: Msgs = [];

        for (const [sheetName, sheet] of Object.entries(s.sheets)) {
            
            if (RESERVED_WORDS.has(sheetName.toLowerCase())) {
                msgs.push(Err("Reserved sheet name",
                    `${sheetName} is a reserved word; you cannot name a sheet this.`)
                    .localize(new CellPos(sheetName, 0, 0)))
                continue;
            }
            const tstSheet = this.transform(sheet, env).msgTo(msgs) as TstAssignment;
            project.addChild(tstSheet).msgTo(msgs);
        }

        return project.msg(msgs);

    }
    
    /**
     * Parses a grid of cells into a syntax tree -- specifically, a "Tabular Syntax Tree (TST)" that
     * represents structures in the tabular syntax.
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
    public handleWorksheet(s: Worksheet, env: PassEnv): Result<TST> {

        const msgs: Msgs = [];

        // sheets are treated as having an invisible cell containing their names at 0, -1
        const startCell = new Cell(s.name, new CellPos(s.name, 0, 0));

        const root = new TstOp(startCell, new CollectionOp());

        const stack: {tst: TstEnclosure, row: number, col: number}[] = 
                [{ tst: root, row: 0, col: -1 }];

        let maxCol: number = 0; // keep track of the rightmost column we've
                                // encountered, because we need to pad rows until
                                // then.  otherwise we can miss empty string content 
                                // at the end of a line
    
        // Now iterate through the cells, left-to-right top-to-bottom
        for (let rowIndex = 0; rowIndex < s.cells.length; rowIndex++) {
    
            if (isLineEmpty(s.cells[rowIndex])) {
                continue;
            }
    
            const rowIsComment = s.cells[rowIndex][0].trim().startsWith('%%');
            
            // this loop shouldn't just go to the end of the line-as-written, because there
            // may be semantically meaningful blank cells beyond it. but there will never be
            // a meaningful blank cell beyond the max column number found so far.
            const colWidth = s.cells[rowIndex].length;
            maxCol = Math.max(maxCol, colWidth);

            for (let colIndex = 0; colIndex < maxCol; colIndex++) {
    
                const cellText = (colIndex < colWidth)
                               ? s.cells[rowIndex][colIndex].trim().normalize("NFD")
                               : "";
                
                const cellPos = new CellPos(s.name, rowIndex, colIndex);
                const cell = new Cell(cellText, cellPos);
                let top = stack[stack.length-1];

                // first check if it's a comment row
                if (rowIsComment) {
                    new CommentMsg().msgTo(msgs, cellPos);
                    continue;
                }

                // next check if the current cell pops anything off 
                // the stack.  keep popping until the top of the stack 
                // is allowed to add this cell as a child op, header,
                // or content
                while (cell.text != "" && colIndex <= top.col) {
                    stack.pop();
                    top = stack[stack.length-1];
                }
            
                // next check if this is "content" -- that is, something to the lower left
                // of the topmost op.  NB: This is the only kind of operation we'll do on 
                // empty cells, so that, if appropriate, we can mark them for syntax highlighting.
                if (top.tst instanceof TstGrid && colIndex > top.col && rowIndex > top.row) {
                    top.tst.addContent(cell).localize(cellPos).msgTo(msgs);
                    continue;
                }
    
                // all of the following steps require there to be some explicit content
                if (cellText.length == 0) {
                    continue;
                }
    
                // either we're still in the spec row, or there's no spec row yet
                if (cellText.endsWith(":") || cellText.endsWith("=")) {
                    // it's an operation, which starts a new enclosures
                    const op = parseOp(cellText).localize(cellPos).msgTo(msgs);
                    const newEnclosure = new TstOp(cell, op);
                    new CommandMsg().msgTo(msgs, cellPos);

                    if (top.tst instanceof TstGrid) {
                        Err(`Unexpected operator`,
                            "This looks like an operator, " +
                            " but only a header can follow a header.")
                            .msgTo(msgs, cellPos);
                        continue;
                    }
              
                    top.tst.setChild(newEnclosure).msgTo(msgs);

                    const newTop = { tst: newEnclosure, row: rowIndex, col: colIndex };
                    stack.push(newTop);
                    continue;
                } 
    
                // it's a header, but we don't yet distinguish that
                // from content
                
                // if the top isn't a TstGrid, make it so
                if (!(top.tst instanceof TstGrid)) {
                    const newGrid = new TstGrid(cell);
                    top.tst.setChild(newGrid).localize(cellPos).msgTo(msgs);
                    top = { tst: newGrid, row: rowIndex, col: colIndex-1 };
                    stack.push(top);
                }

                (top.tst as TstGrid).addContent(cell)
                                       .localize(cellPos)
                                       .msgTo(msgs);

            }
        }
    
        return new TstAssignment(startCell, s.name, root).msg(msgs);
    }
}


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
