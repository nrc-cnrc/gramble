import { 
    CPUnreserved,
    CPNegation,
    CPAlternation,
    parseBooleanCell
} from "../src/cellParser";

import * as path from 'path';
import { expect } from "chai";
import { testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Cell "1SG"', function() {
        const cell = parseBooleanCell("1SG");
        testIsType(cell, CPUnreserved);
    });
    
    describe('Cell "(1SG)"', function() {
        const cell = parseBooleanCell("(1SG)");
        testIsType(cell, CPUnreserved);
    });

    describe('Cell "(1SG"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('(text')).to.throw;
        });
    });

    describe('Cell "1SG)"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('1SG)')).to.throw;
        });
    });
    
    describe('Cell "()"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('()')).to.throw;
        });
    });
    
    describe('Cell "((1SG))"', function() {
        const cell = parseBooleanCell("((1SG))");
        testIsType(cell, CPUnreserved);
    });
    
    describe('Cell "~1SG"', function() {
        const cell = parseBooleanCell("~1SG");
        testIsType(cell, CPNegation);
        if (!(cell instanceof CPNegation)) { return; }
        testIsType(cell.child, CPUnreserved, "child");
    });

    describe('Cell "~ 1SG"', function() {
        const cell = parseBooleanCell("~ 1SG");
        testIsType(cell, CPNegation);
        if (!(cell instanceof CPNegation)) { return; }
        testIsType(cell.child, CPUnreserved, "child");
    });

    describe('Cell "~"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('~')).to.throw;
        });
    });

    describe('Cell "1SG~"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('1SG~')).to.throw;
        });
    });

    describe('Cell "~(1SG)"', function() {
        const cell = parseBooleanCell("~(1SG)");
        testIsType(cell, CPNegation);
        if (!(cell instanceof CPNegation)) { return; }
        testIsType(cell.child, CPUnreserved, "child");
    });

    describe('Cell "(~1SG)"', function() {
        const cell = parseBooleanCell("(~1SG)");
        testIsType(cell, CPNegation);
        if (!(cell instanceof CPNegation)) { return; }
        testIsType(cell.child, CPUnreserved, "child");
    });
    
    describe('Cell "1SG|2SG"', function() {
        const cell = parseBooleanCell("1SG|2SG");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPUnreserved, "child1");
        testIsType(cell.child2, CPUnreserved, "child2");
    });

    
    describe('Cell "|1SG"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('|1SG')).to.throw;
        });
    });
    
    describe('Cell "1SG|"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('1SG|')).to.throw;
        });
    });
    
    describe('Cell "(1SG)|(2SG)"', function() {
        const cell = parseBooleanCell("(1SG)|(2SG)");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPUnreserved, "child1");
        testIsType(cell.child2, CPUnreserved, "child2");
    });

    describe('Cell "(1SG|2SG)"', function() {
        const cell = parseBooleanCell("(1SG|2SG)");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPUnreserved, "child1");
        testIsType(cell.child2, CPUnreserved, "child2");
    });

    describe('Cell "(1SG|)2SG"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('(1SG|)2SG')).to.throw;
        });
    });
    
    describe('Cell "|"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('|')).to.throw;
        });
    });

    describe('Cell "~|1SG"', function() {
        it ("should fail to parse", function() {
            expect(parseBooleanCell.bind('~|1SG')).to.throw;
        });
    });

    describe('Cell "1SG|2SG|3SG"', function() {
        const cell = parseBooleanCell("1SG|2SG|3SG");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPUnreserved, "child1");
        testIsType(cell.child2, CPAlternation, "child2");
        if (!(cell.child2 instanceof CPAlternation)) { return; }
        testIsType(cell.child2.child1, CPUnreserved, "child2.child1");
        testIsType(cell.child2.child2, CPUnreserved, "child2.child2");
    });
    
    describe('Cell "(1SG|2SG)|3SG"', function() {
        const cell = parseBooleanCell("(1SG|2SG)|3SG");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPAlternation, "child1");
        testIsType(cell.child2, CPUnreserved, "child2");
        if (!(cell.child1 instanceof CPAlternation)) { return; }
        testIsType(cell.child1.child1, CPUnreserved, "child2.child1");
        testIsType(cell.child1.child2, CPUnreserved, "child2.child2");
    });
});