import { DEFAULT_SYMBOL_NAME } from "./util";

export class Workbook {

    public sheets: {[name: string]: Worksheet} = {};

    constructor(
        public mainSheetName: string
    ) { }

    public hasSheet(name: string): boolean {
        return name in this.sheets;
    }

    public convertToSingleSheet(): string[][] {

        const results: string[][] = [];

        for (const sheet of Object.values(this.sheets)) {
            results.push(...sheet.convertToSingleSheet());
            results.push([]);  // add an extra line just to make it a little more readable
        }

        results.push([DEFAULT_SYMBOL_NAME, "embed"]);
        results.push([""                 , this.mainSheetName]);
        return results;
    }

}

export class Worksheet {

    constructor(
        public name: string,
        public cells: string[][]
    ) { }

    public convertToSingleSheet(): string[][] {

        if (this.cells.length == 0) {
            return [];
        }

        const results: string[][] = [[ this.name+":", "collection:" ]];

        for (const row of this.cells) {
            if (row.length > 0 && row[0].startsWith("%%")) {
                results.push(row);
                continue;
            }
            results.push([ "", "", ...row ]);
        }

        return results;
    }
}