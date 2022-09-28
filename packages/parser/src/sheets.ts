import { NsGrammar } from "./grammars";
import { 
    CommandMsg, CommentMsg, 
    Err, HeaderMsg, 
    MissingSymbolError, Msgs 
} from "./msgs";
import { TransEnv } from "./transforms";
import { NameQualifierTransform } from "./transforms/nameQualifier";

import { 
    TstHeader, TstGrid, 
    TstComponent,
    TstEnclosure, 
    TstOp,
    TstAssignment,
    TstEmpty,
    TstNamespace,
    TstResult
} from "./tsts";
import { ALL_TST_TRANSFORMS } from "./transforms/allTransforms";
import { Cell, CellPos, DevEnvironment } from "./util";
import { NamespaceOp, parseOp, RESERVED_WORDS } from "./ops";
import { parseHeaderCell } from "./headers";

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
    public abstract toTST(): TstResult;
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
        let tst: TstComponent = this.toTST()
                                    .msgTo((_) => {});
        const transEnv = new TransEnv();
        const tstResult = ALL_TST_TRANSFORMS.transform(tst, transEnv)
                                            .msgTo((_) => {});
        const grammar = tstResult.toGrammar(transEnv)
                                 .msgTo((m) => {})
        
        // check to see if any names didn't get resolved
        const nameQualifier = new NameQualifierTransform(grammar as NsGrammar);
        const [_, nameMsgs] = nameQualifier.transform(transEnv).destructure();

        const unresolvedNames: Set<string> = new Set(); 
        for (const msg of nameMsgs) {
            if (!(msg instanceof MissingSymbolError)) { 
                continue;
            }
            const firstPart = msg.symbol.split(".")[0];
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

    public toTST(): TstResult {
        const projectCell = new Cell("", new CellPos("", -1, -1));
        const project = new TstNamespace(projectCell);
        const msgs: Msgs = [];
        for (const [sheetName, sheet] of Object.entries(this.sheets)) {
            if (sheetName == this.mainSheetName) {
                continue; // save this for last
            }
            const tstSheet = sheet.toTST().msgTo(msgs);
            project.addChild(tstSheet).msgTo(msgs);
        }

        if (!(this.mainSheetName in this.sheets)) { 
            return project.msg(msgs); // unset or incorrect main sheet name
        }

        const mainSheet = this.sheets[this.mainSheetName]
                                    .toTST()
                                    .msgTo(msgs);
        project.addChild(mainSheet).msgTo(msgs);
        return project.msg(msgs);
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
    public toTST(): TstResult {
    
        const msgs: Msgs = [];
        
        let name = this.name;
        if (RESERVED_WORDS.has(name)) {
            // we'll never be able to refer to this sheet elsewhere
            msgs.push(Err("Sheet name reserved",
                `You can't call a worksheet ${name}`,
                new CellPos(this.name, 0, 0)));
            name = this.name + "_ERR";
        }

        // sheets are treated as having an invisible cell containing their names at 0, -1
        let startCell = new Cell(name, new CellPos(name, 0, -1));

        let result = new TstOp(startCell, new NamespaceOp());

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
            
            // this loop shouldn't just go to the end of the line-as-written, because there
            // may be semantically meaningful blank cells beyond it. but there will never be
            // a meaningful blank cell beyond the max column number found so far.
            const colWidth = this.cells[rowIndex].length;
            maxCol = Math.max(maxCol, colWidth);

            for (let colIndex = 0; colIndex < maxCol; colIndex++) {
    
                const cellMsgs: Msgs = [];
                const cellText = (colIndex < colWidth)
                               ? this.cells[rowIndex][colIndex].trim().normalize("NFD")
                               : "";
                
                const cellPos = new CellPos(name, rowIndex, colIndex);
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
                        cellMsgs.push(Err(`Unexpected operator`,
                            "This looks like an operator, but only a header can follow a header."));
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
    
        return new TstAssignment(startCell, name, new TstEmpty(), result).msg(msgs);
    }
}