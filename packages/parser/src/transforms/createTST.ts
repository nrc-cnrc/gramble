import { TransEnv, Transform } from "../transforms";
import { CommandMsg, CommentMsg, Err, HeaderMsg, Msgs } from "../msgs";
import { 
    TstAssignment,
    TstComponent, TstEmpty, TstEnclosure, TstGrid, TstHeader, TstNamespace, 
    TstOp, 
    TstResult, 
} from "../tsts";
import { Sheet, SheetComponent, SheetProject } from "../sheets";
import { Cell, CellPos } from "../util";
import { NamespaceOp, parseOp } from "../ops";
import { parseHeaderCell } from "../headers";

/**
 * Namespace works somewhat differently from other operators,
 * so in this transformation we take "namespace:" TstOps and
 * instantiate them as actual namespaces.
 */
export class CreateTST extends Transform<SheetComponent,TstComponent> {

    public get desc(): string {
        return "Creating namespaces";
    }

    public transform(t: SheetComponent, env: TransEnv): TstResult {

        switch(t.constructor) {
            case SheetProject:
                return this.transformProject(t as SheetProject, env);
            case Sheet:
                return this.transformSheet(t as Sheet, env);
            default: 
                throw new Error(`unhandled ${t.constructor.name}`);
        }
    }

    public transformProject(t: SheetProject, env: TransEnv): TstResult {

        const projectCell = new Cell("", new CellPos("", -1, -1));
        const project = new TstNamespace(projectCell);
        const msgs: Msgs = [];
        for (const [sheetName, sheet] of Object.entries(t.sheets)) {
            if (sheetName == t.mainSheetName) {
                continue; // save this for last
            }
            const tstSheet = this.transform(sheet, env).msgTo(msgs);
            project.addChild(tstSheet).msgTo(msgs);
        }

        if (!(t.mainSheetName in t.sheets)) { 
            return project.msg(msgs); // unset or incorrect main sheet name
        }

        const mainSheet = this.transform(t.sheets[t.mainSheetName], env)
                              .msgTo(msgs);
        project.addChild(mainSheet).msgTo(msgs);
        return project.msg(msgs);

    }
    
    public transformSheet(t: Sheet, env: TransEnv): TstResult {

        const msgs: Msgs = [];

        // sheets are treated as having an invisible cell containing their names at 0, -1
        const startCell = new Cell(t.name, new CellPos(t.name, 0, 0));

        const root = new TstOp(startCell, new NamespaceOp());

        const stack: {tst: TstEnclosure, row: number, col: number}[] = 
                [{ tst: root, row: 0, col: -1 }];

        let maxCol: number = 0; // keep track of the rightmost column we've
                                // encountered, because we need to pad rows until
                                // then.  otherwise we can miss empty string content 
                                // at the end of a line
    
        // Now iterate through the cells, left-to-right top-to-bottom
        for (let rowIndex = 0; rowIndex < t.cells.length; rowIndex++) {
    
            if (isLineEmpty(t.cells[rowIndex])) {
                continue;
            }
    
            const rowIsComment = t.cells[rowIndex][0].trim().startsWith('%%');
            
            // this loop shouldn't just go to the end of the line-as-written, because there
            // may be semantically meaningful blank cells beyond it. but there will never be
            // a meaningful blank cell beyond the max column number found so far.
            const colWidth = t.cells[rowIndex].length;
            maxCol = Math.max(maxCol, colWidth);

            for (let colIndex = 0; colIndex < maxCol; colIndex++) {
    
                const cellMsgs: Msgs = [];
                const cellText = (colIndex < colWidth)
                               ? t.cells[rowIndex][colIndex].trim().normalize("NFD")
                               : "";
                
                const cellPos = new CellPos(t.name, rowIndex, colIndex);
                const cell = new Cell(cellText, cellPos);
                let top = stack[stack.length-1];

                // first check if it's a comment row
                if (rowIsComment) {
                    cellMsgs.push(new CommentMsg());
                    msgs.push(...cellMsgs.map(m => m.localize(cellPos)));
                    continue;
                }


                // next check if the current cell pops anything off 
                // the stack.  keep popping until the top of the stack 
                // is allowed to add this cell as a child op, header,
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
                if (top.tst instanceof TstGrid && colIndex >= top.col && rowIndex > top.row) {
                    top.tst.addContent(cell).msgTo(cellMsgs);
                    msgs.push(...cellMsgs.map(m => m.localize(cellPos)));
                    continue;
                }
    
                // all of the following steps require there to be some explicit content
                if (cellText.length == 0) {
                    msgs.push(...cellMsgs.map(m => m.localize(cellPos)));
                    continue;
                }
    
                // either we're still in the spec row, or there's no spec row yet
                if (cellText.endsWith(":")) {
                    // it's an operation, which starts a new enclosures
                    const op = parseOp(cellText);
                    const newEnclosure = new TstOp(cell, op);
                    cellMsgs.push(new CommandMsg().localize(cellPos))

                    if (top.tst instanceof TstGrid) {
                        Err(`Unexpected operator`,
                            "This looks like an operator, " +
                            " but only a header can follow a header.").msgTo(cellMsgs);
                        msgs.push(...cellMsgs.map(m => m.localize(cellPos)));
                        continue;
                    }
              
                    top.tst.addChild(newEnclosure).msgTo(cellMsgs);

                    const newTop = { tst: newEnclosure, row: rowIndex, col: colIndex };
                    stack.push(newTop);
                    msgs.push(...cellMsgs.map(m => m.localize(cellPos)));
                    continue;
                } 
    
                // it's a header
                const parsedHeader = parseHeaderCell(cell.text).msgTo(cellMsgs);
                const tstHeader = new TstHeader(cell, parsedHeader);
                cellMsgs.push(new HeaderMsg( 
                    tstHeader.getBackgroundColor(0.14) 
                ));
                
                // if the top isn't a TstGrid, make it so
                if (!(top.tst instanceof TstGrid)) {
                    const newTable = new TstGrid(cell);
                    top.tst.addChild(newTable).msgTo(cellMsgs);
                    top = { tst: newTable, row: rowIndex, col: colIndex-1 };
                    stack.push(top);
                }
                
                (top.tst as TstGrid).addHeader(tstHeader);

                msgs.push(...cellMsgs.map(m => m.localize(cellPos)));
            }
        }
    
        return new TstAssignment(startCell, t.name, new TstEmpty(), root).msg(msgs);
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
