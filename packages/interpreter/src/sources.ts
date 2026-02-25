import { Component } from "./components.js";
import { EpsilonGrammar, Grammar } from "./grammars.js";
import { DEFAULT_SYMBOL } from "./utils/constants.js";

export type Source = Workbook
                   | Worksheet

export class Workbook extends Component {
    public readonly tag = "workbook";

    public sheets: {[name: string]: Worksheet} = {};
    public grammar: Grammar = new EpsilonGrammar();

    constructor(
        public mainSheetName: string
    ) { 
        super();
    }

    public hasSheet(name: string): boolean {
        return name in this.sheets;
    }

    public convertToSingleSheet(): string[][] {

        const results: string[][] = [];

        for (const sheet of Object.values(this.sheets)) {
            results.push(...sheet.convertToSingleSheet());
            results.push([]);  // add an extra line just to make it a little more readable
        }

        results.push([DEFAULT_SYMBOL + " =", "embed"]);
        results.push([""                 , this.mainSheetName + ".All"]);
        return results;
    }

}

export class Worksheet {
    public readonly tag = "worksheet";

    constructor(
        public name: string,
        public cells: string[][]
    ) { }

    public convertToSingleSheet(): string[][] {

        if (this.cells.length == 0) {
            return [];
        }

        const results: string[][] = [[ this.name+" =", "collection:" ]];

        for (const row of this.cells) {
            if (row.length > 0 && row[0].trimStart().startsWith("%%")) {
                results.push(row);
                continue;
            }
            results.push([ "", "", ...row ]);
        }

        return results;
    }
}
