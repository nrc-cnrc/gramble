import { Project, ErrorAccumulator, EnclosureComponent, TabularComponent } from "../src/sheetParser";
import { readFileSync } from "fs";
import { expect } from "chai";
import { Namespace } from "../src/stateMachine";
import { testHasOutput, testNumOutputs, testNumErrors, testErrorInCell } from "./testUtils";
import { DevEnvironment, TextDevEnvironment } from "../src/devEnv";

function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}

export function sheetFromFile(path: string): 
            [EnclosureComponent, Namespace, DevEnvironment ] { 
    const text = readFileSync(path, 'utf8');
    const cells = cellSplit(text);
    const errors = new TextDevEnvironment();
    const parser = new Project();

    const sheet = parser.addSheet("test", cells, errors);
    return [sheet, parser.globalNamespace, errors];
}

export function projectFromFiles(files: [string, string][]):
        [Namespace, DevEnvironment] {

    const errors = new TextDevEnvironment();
    const parser = new Project();
    
    for (const [title, path] of files) {
        const text = readFileSync(path, 'utf8');
        const cells = cellSplit(text);
        parser.addSheet(title, cells, errors);
    }

    return [parser.globalNamespace, errors];

}

describe('Correct grammar', function() {
    
    const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/simpleGrammar.csv");

    testNumErrors(errors, 0, "any");

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
        
    it("should have 'join' as its child's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.text).to.equal("join");
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

    it("should have 3 symbols defined", function() {
        expect(namespace.allSymbols().length).to.equal(3);
    });

    
    const state = namespace.get('test.word');

    it("should have a symbol named 'test.word'", function() {
        expect(state).to.not.be.undefined;
    });
 
    if (state == undefined) return;
    const results = [...state.generate()];

    testNumOutputs(results, 4);
    testHasOutput(results, "text", "foobar");
    testHasOutput(results, "text", "foobaz");
    testHasOutput(results, "text", "moobar");
    testHasOutput(results, "text", "moobaz");
}); 



describe('Grammar with two children on the same line', function() {
    
    const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/childOnSameLine.csv");

    testNumErrors(errors, 1, "error");
    testNumErrors(errors, 0, "warning");
    testErrorInCell(errors, "test", 4, 4);
});


describe('Grammar with reserved word as header', function() {
    
    const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/headerUsingReservedWord.csv");

    testNumErrors(errors, 2, "error");
    testNumErrors(errors, 0, "warning");
    testErrorInCell(errors, "test", 4, 4);
    testErrorInCell(errors, "test", 5, 4);
});

describe('Grammar with nested tables', function() {
    
    const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/nestedTables.csv");

    testNumErrors(errors, 0, "any");

    it("should have 'word' as its child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.text).to.equal("word");
    });

    it("should have 'join' as its child's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.text).to.equal("join");
    });

    it("should have 'or' as its child's child's sibling", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.text).to.equal("or");
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

    
    it("should have 'join' as its child's child's sibling's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.sibling).to.not.be.undefined;
        if (sheet.child.child.sibling == undefined) return;
        expect(sheet.child.child.sibling.child).to.not.be.undefined;
        if (sheet.child.child.sibling.child == undefined) return;
        expect(sheet.child.child.sibling.child.text).to.equal("join");
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


describe('Grammar with table obliteration', function() {
    
    const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/tableObliteration.csv");
    
    testNumErrors(errors, 0, "error");
    testNumErrors(errors, 1, "warning");
    testErrorInCell(errors, "test", 6, 1);
});

describe('Parseable grammar but with weird indentation', function() {
    
    const [sheet, namespace, errors] = sheetFromFile("./tests/csvs/weirdIndentation.csv");

    testNumErrors(errors, 0, "error");
    testNumErrors(errors, 1, "warning");
    
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
        
    it("should have 'join' as its child's child", function() {
        expect(sheet.child).to.not.be.undefined;
        if (sheet.child == undefined) return;
        expect(sheet.child.child).to.not.be.undefined;
        if (sheet.child.child == undefined) return;
        expect(sheet.child.child.text).to.equal("join");
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




describe('Multi-sheet project', function() {
    
    const paths: [string, string][] = [
        [ "Source1", "./tests/csvs/simpleGrammar.csv"],
        [ "Source2", "./tests/csvs/grammarWithExternalRef.csv"]
    ];
    
    const [namespace, errors] = projectFromFiles(paths);

    testNumErrors(errors, 0, "any");

    it("should have 4 symbols defined", function() {
        expect(namespace.allSymbols().length).to.equal(4);
    });
    
    const source1state = namespace.get('Source1.word');
    const source2state = namespace.get('Source2.word');
    
    it("should have a symbol named 'Source1.word'", function() {
        expect(source1state).to.not.be.undefined;
    });

    it("should have a symbol named 'Source2.word'", function() {
        expect(source2state).to.not.be.undefined;
    });

    if (source2state == undefined) return;
    const results = [...source2state.generate()]

    testNumOutputs(results, 4);
    testHasOutput(results, "text", "foobarable");
    testHasOutput(results, "text", "foobazable");
    testHasOutput(results, "text", "moobarable");
    testHasOutput(results, "text", "moobazable");
});