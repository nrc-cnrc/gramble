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
        testCellID("1SG*", "[STAR[1SG]]");   
        testCellID("1SG\\*", "[1SG*]");   
        testCellID("1S(G)*", "[1S,STAR[[G]]]");   
        testCellID("~1SG*", "[NOT[STAR[1SG]]]");
        testCellID("(~1SG)*", "[STAR[[NOT[1SG]]]]");
        testCellID("1SG|2SG*", "[OR[1SG,STAR[2SG]]]");
        testCellID("(1SG|2SG)*", "[STAR[[OR[1SG,2SG]]]]");
        testCellID("(1SG)(2SG)*", "[[1SG],STAR[[2SG]]]"); 
        testCellID("1SG+", "[PLUS[1SG]]");   
        testCellID("1SG\\+", "[1SG+]");   
        testCellID("1S(G)+", "[1S,PLUS[[G]]]");   
        testCellID("~1SG+", "[NOT[PLUS[1SG]]]");
        testCellID("(~1SG)+", "[PLUS[[NOT[1SG]]]]");
        testCellID("1SG|2SG+", "[OR[1SG,PLUS[2SG]]]");
        testCellID("(1SG|2SG)+", "[PLUS[[OR[1SG,2SG]]]]");
        testCellID("(1SG)(2SG)+", "[[1SG],PLUS[[2SG]]]"); 
        testCellID("1SG?", "[QUES[1SG]]");   
        testCellID("1SG\\?", "[1SG?]");   
        testCellID("1S(G)?", "[1S,QUES[[G]]]");   
        testCellID("~1SG?", "[NOT[QUES[1SG]]]");
        testCellID("(~1SG)?", "[QUES[[NOT[1SG]]]]");
        testCellID("1SG|2SG?", "[OR[1SG,QUES[2SG]]]");
        testCellID("(1SG|2SG)?", "[QUES[[OR[1SG,2SG]]]]");
        testCellID("(1SG)(2SG)?", "[[1SG],QUES[[2SG]]]"); 
    });
});