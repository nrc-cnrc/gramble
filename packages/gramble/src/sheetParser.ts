


class SheetCell {
    constructor(
        public text: string,
        public sheet: string,
        public row: string,
        public col: string
    ) { }
}

/**
 * SheetParser
 * 
 * A SheetParser object turns sheets into abstract syntax trees,
 * without necessarily knowing what those trees represent.  SheetParser
 * is intended to make it easier to create small tabular languages to
 * try out new ideas.
 */

class SheetParser {

    public reservedCommands: string[] = [];
    public userDefinedCommands: string[] = [];
    public symbols: string[] = [];

    public unitStack: SheetUnit[] = [];

    public parseCells(cells: SheetCell[][]): any {
        
        for (const row of cells) {
            for (const cell of row) {
                


            }
        }
    }


}


class TierCell {
    constructor(
        public text: string,
        public sheet: string,
        public row: string,
        public col: string
    ) { }
}

/**
 *  A sheet unit consists of:
 *    (a) a command symbol (like "table", "template", or a
 *          user-defined command.
 *    (b) a list of tiers that follow on the same line, and the 
 *          columns they're in (so that we can associate table content to tiers)
 *    (c) following lines of content, associated with the tiers.
 * 
 * A sheet unit ends when there is content outside of its columns, in which
 * case we pop the current unit off the stack.
 */

class SheetUnit {

    public tiers: TierCell[] = [];
    public tiersByColumn: {[key: number]: TierCell} = {};

    constructor(
        public command: string
    ) { }

    public containsColumn(col: number) {
        return col in this.tiersByColumn;
    }

    public addTier(tier: TierCell) {
        this.tiers.push(tier);
    }
}