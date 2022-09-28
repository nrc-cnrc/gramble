
export abstract class SheetComponent { }

export class SheetProject extends SheetComponent {

    public sheets: {[name: string]: Sheet} = {};

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

        return results;
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
}