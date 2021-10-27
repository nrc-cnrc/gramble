import { 
    CPUnreserved,
    CPNegation,
    CPAlternation,
    parseBooleanCell,
    CPSequence
} from "../src/cells";

import * as path from 'path';
import { expect } from "chai";
import { testCellID, testIsType } from "./testUtils";

describe(`${path.basename(module.filename)}`, function() {

    describe('Parsing cells', function() {
        testCellID("", "[]");
        testCellID("()", "[[]]");
        testCellID("1SG", "[1SG]");
        testCellID("(1SG)", "[[1SG]]");
        testCellID("(1SG", "ERR");
        testCellID("1SG)", "ERR");
        testCellID("\\(1SG", "[(1SG]");
        testCellID("1SG\\)", "[1SG)]");
        testCellID("((1SG))", "[[[1SG]]]");
        testCellID("~1SG", "[NOT[1SG]]");
        testCellID("\\~1SG", "[~1SG]");
        testCellID("~ 1SG", "[NOT[1SG]]");
        testCellID("~", "ERR");    
        testCellID('1SG~', "ERR");
        testCellID("~(1SG)", "[NOT[[1SG]]]");
        testCellID("(~1SG)", "[[NOT[1SG]]]");
        testCellID("1SG|2SG", "[OR[1SG,2SG]]");
        testCellID("1SG\\|2SG", "[1SG|2SG]");
        testCellID("|1SG", "ERR");
        testCellID("1SG|", "ERR");
        testCellID("1SG|()", "[OR[1SG,[]]]");
        testCellID("()|2SG", "[OR[[],2SG]]");
        testCellID("(1SG)|(2SG)", "[OR[[1SG],[2SG]]]");
        testCellID("(1SG|2SG)", "[[OR[1SG,2SG]]]");
        testCellID("~(1SG|2SG)", "[NOT[[OR[1SG,2SG]]]]");
        testCellID("(1SG|)2SG", "ERR");
        testCellID("|", "ERR");
        testCellID("~|1SG", "ERR");
        testCellID("~1SG|", "ERR");
        testCellID("1SG|2SG|3SG", "[OR[1SG,OR[2SG,3SG]]]");
        testCellID("(1SG|2SG)|3SG", "[OR[[OR[1SG,2SG]],3SG]]");
        testCellID("(1)(SG)", "[[1],[SG]]");
        testCellID("(1|2)SG", "[[OR[1,2]],SG]");
        testCellID("1|2SG", "[OR[1,2SG]]");
        testCellID("1~2SG", "[1,NOT[2SG]]");
    });

});