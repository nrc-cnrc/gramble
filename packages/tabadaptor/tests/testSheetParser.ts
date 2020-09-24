import { SheetParser, ErrorAccumulator, TabComponent } from "../src/sheetParser";
import { readFileSync } from "fs";
import { expect } from "chai";


export function sheetFromFile(path: string): [TabComponent, ErrorAccumulator] { 
    const text = readFileSync(path, 'utf8');
    const errors = new ErrorAccumulator();
    const parser = new SheetParser();
    const result = parser.parseString("test", text, errors);
    return [result, errors];
}


describe('Correct grammar', function() {
    it("should have 0 errors", function() {
        const [sheet, errors] = sheetFromFile("./tests/testSheetParser1.csv");
        expect(errors.length).to.equal(0);
    });
}); 