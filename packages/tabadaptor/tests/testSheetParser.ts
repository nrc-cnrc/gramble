import { SheetParser, ErrorAccumulator, EnclosureComponent, TabComponent } from "../src/sheetParser";
import { readFileSync } from "fs";
import { expect } from "chai";

const BUILT_IN_OPS = [ "table", "or", "apply", "join" ];

export function sheetFromFile(path: string): [TabComponent, ErrorAccumulator] { 
    const text = readFileSync(path, 'utf8');
    const errors = new ErrorAccumulator();
    const parser = new SheetParser(BUILT_IN_OPS);
    const result = parser.parseString("test", text, errors);
    return [result, errors];
}

describe('Correct grammar', function() {
    
    const [sheet, errors] = sheetFromFile("./tests/csvs/simpleGrammar.csv");

    it("should have 0 errors", function() {
        expect(errors.length).to.equal(0);
    });
    
    it("should have 'word' as its child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.text).to.equal("word");
    });

    it("should have 'suffix' as its child's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.sibling).to.not.be.undefined;
        if (sheet.child.sibling == undefined) return;
        expect(sheet.child.sibling.text).to.equal("suffix");
    });

    it("should have 'table' as its child's sibling's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.sibling).to.not.be.undefined;
        if (sheet.child.sibling == undefined) return;
        expect(sheet.child.sibling.child).to.not.be.undefined;
        if (sheet.child.sibling.child == undefined) return;
        expect(sheet.child.sibling.child.text).to.equal("table");
    });
    
    it("should have 'verb' as its child's sibling's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.sibling).to.not.be.undefined;
        if (sheet.child.sibling == undefined) return;
        expect(sheet.child.sibling.sibling).to.not.be.undefined;
        if (sheet.child.sibling.sibling == undefined) return;
        expect(sheet.child.sibling.sibling.text).to.equal("verb");
    });

    
    it("should have no child's sibling's sibling's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.sibling).to.not.be.undefined;
        if (sheet.child.sibling == undefined) return;
        expect(sheet.child.sibling.sibling).to.not.be.undefined;
        if (sheet.child.sibling.sibling == undefined) return;
        expect(sheet.child.sibling.sibling.sibling).to.be.undefined;
    });
        
    it("should have 'apply' as its child's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.text).to.equal("apply");
    });

    it("should have 'table' as its child's child's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.text).to.equal("table");
    });
}); 



describe('Grammar with two children on the same line', function() {
    
    const [sheet, errors] = sheetFromFile("./tests/csvs/childOnSameLine.csv");

    it("should have 1 errors", function() {
        expect(errors.length).to.equal(1);
    })
    
    it("should have an error at 4:4", function() {
        expect(errors.getErrors("test", 4, 4));
    })
});



describe('Grammar with nested tables', function() {
    
    const [sheet, errors] = sheetFromFile("./tests/csvs/nestedTables.csv");

    it("should have 0 errors", function() {
        expect(errors.length).to.equal(0);
    });
    
    it("should have 'word' as its child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.text).to.equal("word");
    });

    it("should have 'apply' as its child's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.text).to.equal("apply");
    });

    it("should have 'table' as its child's child's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.text).to.equal("table");
    });

    
    it("should have 'table' as its child's child's sibling's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling.sibling == undefined) return;
        expect(sheet.child.child.sibling.sibling.text).to.equal("table");
    });

    
    it("should have 'apply' as its child's child's sibling's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.child).to.not.be.undefined;
        if (sheet.child.child.sibling.child == undefined) return;
        expect(sheet.child.child.sibling.child.text).to.equal("apply");
    });

    
    
    it("should have 'table' as its child's child's sibling's child's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.child).to.not.be.undefined;
        if (sheet.child.child.sibling.child == undefined) return;
        expect(sheet.child.child.sibling.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.child.sibling.text).to.equal("table");
    });


}); 
