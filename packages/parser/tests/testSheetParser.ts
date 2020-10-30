import { Project, ErrorAccumulator, EnclosureComponent, TabComponent } from "../src/sheetParser";
import { readFileSync } from "fs";
import { expect } from "chai";
import { Namespace } from "../src/stateMachine";

const BUILT_IN_OPS = [ "table", "or", "join", "concat", "join" ];


function cellSplit(s: string): string[][] {
    return s.split("\n").map((line) => line.split(","));
}

export function fromFile(path: string): 
            [EnclosureComponent, Namespace, ErrorAccumulator] { 
    const text = readFileSync(path, 'utf8');
    const cells = cellSplit(text);
    const errors = new ErrorAccumulator();
    const parser = new Project(BUILT_IN_OPS);

    const sheet = parser.addSheet("test", cells, errors);
    return [sheet, parser.globalNamespace, errors];

}

describe('Correct grammar', function() {
    
    const [sheet, namespace, errors] = fromFile("./tests/csvs/simpleGrammar.csv");

    it("should have 0 errors", function() {
        expect(errors.numErrors("error")).to.equal(0);
    });
    
    it("should have 0 warnings", function() {
        expect(errors.numErrors("warning")).to.equal(0);
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
    
    it("should have 4 results", function() {   
        const results = [...state.generate()];
        expect(results.length).to.equal(4);
    });
}); 



describe('Grammar with two children on the same line', function() {
    
    const [sheet, namespace, errors] = fromFile("./tests/csvs/childOnSameLine.csv");

    it("should have 1 errors", function() {
        expect(errors.numErrors("error")).to.equal(1);
    })
    
    it("should have 0 warnings", function() {
        expect(errors.numErrors("warning")).to.equal(0);
    });
    
    it("should have an error at 4:4", function() {
        expect(errors.getErrors("test", 4, 4));
    })
});


describe('Grammar with reserved word as header', function() {
    
    const [sheet, namespace, errors] = fromFile("./tests/csvs/headerUsingReservedWord.csv");

    it("should have 2 errors", function() {
        expect(errors.numErrors("error")).to.equal(2);
    })
    
    it("should have 0 warnings", function() {
        expect(errors.numErrors("warning")).to.equal(0);
    });
    
    it("should have an error at 4:4", function() {
        expect(errors.getErrors("test", 4, 4));
    })

    it("should have an error at 5:4", function() {
        expect(errors.getErrors("test", 5, 4));
    })
});

describe('Grammar with nested tables', function() {
    
    const [sheet, namespace, errors] = fromFile("./tests/csvs/nestedTables.csv");

    it("should have 0 errors", function() {
        expect(errors.numErrors("error")).to.equal(0);
    });

    it("should have 0 warnings", function() {
        expect(errors.numErrors("warning")).to.equal(0);
    });
    
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
    
    const [sheet, namespace, errors] = fromFile("./tests/csvs/tableObliteration.csv");

    it("should have 0 errors", function() {
        expect(errors.numErrors("error")).to.equal(0);
    });

    it("should have 1 warnings", function() {
        expect(errors.numErrors("warning")).to.equal(1);
    });
    
    it("should have an error at 6:1", function() {
        expect(errors.getErrors("test", 6, 1));
    })

});

describe('Parseable grammar but with weird indentation', function() {
    
    const [sheet, namespace, errors] = fromFile("./tests/csvs/weirdIndentation.csv");

    it("should have 0 errors", function() {
        expect(errors.numErrors("error")).to.equal(0);
    });
    
    it("should have 1 warning", function() {
        expect(errors.numErrors("warning")).to.equal(1);
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
