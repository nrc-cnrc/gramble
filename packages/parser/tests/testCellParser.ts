import { 
    CPUnreserved,
    CPNegation,
    CPAlternation,
    parseBooleanCell,
    CPEmpty
} from "../src/cells";

import * as path from 'path';
import { expect } from "chai";
import { testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Cell ""', function() {
        const cell = parseBooleanCell("");
        testIsType(cell, CPEmpty);
    });

    describe('Cell "()"', function() {
        const cell = parseBooleanCell("()");
        testIsType(cell, CPEmpty);
    });

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
            expect(() => parseBooleanCell('(text')).to.throw();
        });
    });

    describe('Cell "1SG)"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('1SG)')).to.throw();
        });
    });

    describe('Cell "\\(1SG"', function() {
        const cell = parseBooleanCell("\\(1SG");
        testIsType(cell, CPUnreserved);
    });

    describe('Cell "1SG\\)"', function() {
        const cell = parseBooleanCell("1SG\\)");
        testIsType(cell, CPUnreserved);
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

    describe('Cell "\\~1SG"', function() {
        const cell = parseBooleanCell("\\~1SG");
        testIsType(cell, CPUnreserved);
    });

    describe('Cell "~ 1SG"', function() {
        const cell = parseBooleanCell("~ 1SG");
        testIsType(cell, CPNegation);
        if (!(cell instanceof CPNegation)) { return; }
        testIsType(cell.child, CPUnreserved, "child");
    });

    describe('Cell "~"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('~')).to.throw();
        });
    });

    describe('Cell "1SG~"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('1SG~')).to.throw();
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

    describe('Cell "1SG\\|2SG"', function() {
        const cell = parseBooleanCell("1SG\\|2SG");
        testIsType(cell, CPUnreserved);
    });

    describe('Cell "|1SG"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('|1SG')).to.throw();
        });
    });
    
    describe('Cell "1SG|"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('1SG|')).to.throw();
        });
    });
    
    describe('Cell "1SG|()"', function() {
        const cell = parseBooleanCell("1SG|()");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPUnreserved, "child1");
        testIsType(cell.child2, CPEmpty, "child2");
    });

    describe('Cell "()|2SG"', function() {
        const cell = parseBooleanCell("()|2SG");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPEmpty, "child1");
        testIsType(cell.child2, CPUnreserved, "child2");
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

    describe('Cell "~(1SG|2SG)"', function() {
        const cell = parseBooleanCell("~(1SG|2SG)");
        testIsType(cell, CPNegation);
        if (!(cell instanceof CPNegation)) { return; }
        testIsType(cell.child, CPAlternation, "child");
        if (!(cell.child instanceof CPAlternation)) { return; }
        testIsType(cell.child.child1, CPUnreserved, "child1");
        testIsType(cell.child.child2, CPUnreserved, "child2");
    });

    describe('Cell "~1SG|2SG"', function() {
        const cell = parseBooleanCell("~1SG|2SG");
        testIsType(cell, CPAlternation);
        if (!(cell instanceof CPAlternation)) { return; }
        testIsType(cell.child1, CPNegation, "child1");
        testIsType(cell.child2, CPUnreserved, "child2");
    });

    describe('Cell "(1SG|)2SG"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('(1SG|)2SG')).to.throw();
        });
    });
    
    describe('Cell "|"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('|')).to.throw();
        });
    });

    describe('Cell "~|1SG"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('~|1SG')).to.throw();
        });
    });
    
    describe('Cell "~1SG|"', function() {
        it ("should fail to parse", function() {
            expect(() => parseBooleanCell('~1SG|')).to.throw();
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