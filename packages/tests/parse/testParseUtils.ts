import { expect } from "chai";

import { parseContent } from "../../interpreter/src/content";
import { Grammar } from "../../interpreter/src/grammars";
import { ParseClass, parseHeaderCell } from "../../interpreter/src/headers";
import { parseOp, autoID as opID } from "../../interpreter/src/ops";
import { CombineLiterals } from "../../interpreter/src/passes/combineLiterals";
import { toStr } from "../../interpreter/src/passes/toStr";
import { tokenizeUnicode } from "../../interpreter/src/utils/strings";
import { Message } from "../../interpreter/src/utils/msgs";
//import { autoID } from "../../interpreter/src/components";

export function testHeaderID(
    testPrefix: string,
    text: string,
    expectedID: string
): void {
    const result = parseHeaderCell(text).msgTo([]);
    if (testPrefix != "") {
        testPrefix += '. ';
    }
    it(`${testPrefix}"${text}" should parse as "${expectedID}"`, function() {
        expect(toStr(result)).to.equal(expectedID);
    });
}

export function testOpID(
    testPrefix: string,
    text: string,
    expectedID: string
): void {
    const result = parseOp(text).msgTo([]);
    if (testPrefix != "") {
        testPrefix += '. ';
    }
    it(`${testPrefix}"${text}" should parse as "${expectedID}"`, function() {
        expect(opID(result)).to.equal(expectedID);
    });
}

export function testPlaintextID(
    testPrefix: string,
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    testCellID("plaintext", testPrefix, text, expectedID, numErrorsExpected);
}

export function testSymbolID(
    testPrefix: string,
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    testCellID("symbol", testPrefix, text, expectedID, numErrorsExpected);
}

export function testRegexID(
    testPrefix: string,
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    testCellID("regex", testPrefix, text, expectedID, numErrorsExpected);
}

export function testRuleContextID(
    testPrefix: string,
    text: string, 
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    testCellID("ruleContext", testPrefix, text, expectedID, numErrorsExpected);
}

function testCellID(
    parseClass: ParseClass,
    testPrefix: string,
    text: string,
    expectedID: string,
    numErrorsExpected: number = 0
): void {
    const msgs: Message[] = [];
    const parseResult = parseContent(parseClass, text).msgTo(msgs)

    const result = new CombineLiterals().getEnvAndTransform(parseResult, {}).msgTo(msgs);
    if (testPrefix != "") {
        testPrefix += '. ';
    }
    describe(`${testPrefix}"${text}"`, function() {
        it(`should parse as "${expectedID}"`, function() {
            expect(toStr(result)).to.equal(expectedID);
        });
        it(`should have ${numErrorsExpected} errors`, function() {
            if (msgs.length != numErrorsExpected) {
                console.log(msgs.map(m => m.longMsg));
            }
            expect(msgs.length).to.equal(numErrorsExpected);
            
        });
    });
}

export function testTokenize(s: string, expectedResult: string[]): void {
    s = s.normalize('NFD');
    const result = tokenizeUnicode(s);
    expectedResult = expectedResult.map(s => s.normalize('NFD'));
    it(`${s} should tokenize to [${expectedResult.join(" ")}]`, function() {
        expect(result).to.deep.equal(expectedResult);
    });
}
