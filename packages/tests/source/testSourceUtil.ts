import { assert, expect } from 'chai';
import { dirname, basename } from "path";
import { existsSync } from "fs";

import { Interpreter } from "../../interpreter/src/interpreter";
import { TextDevEnvironment } from "../../interpreter/src/textInterface";

import {
    DEFAULT_MAX_RECURSION,
    DEFAULT_MAX_CHARS
} from "../../interpreter/src/utils/constants";

import { StringDict } from '../../interpreter/src/utils/func';
import { SILENT } from "../../interpreter/src/utils/logging";
import { Options } from "../../interpreter/src/utils/options";

import { testErrors, testGenerate } from '../testUtil';
import { Epsilon } from '../../interpreter/src/grammarConvenience';
import { Message } from '../../interpreter/src/utils/msgs';
import * as Msgs from '../../interpreter/src/utils/msgs';

const TEST_DIR = dirname(module.filename);

export function Error(row: number, col: number, sheet?: string): Partial<Message> {
    if (sheet === undefined) return { row, col, tag: Msgs.Tag.Error };
    return {sheet, row, col, tag: Msgs.Tag.Error} 
}

export function Warning(row: number, col: number, sheet?: string):  Partial<Message> {
    if (sheet === undefined) return { row, col, tag: Msgs.Tag.Warning };
    return { row, col, tag: Msgs.Tag.Warning };
}

export interface ProjectTest extends Options {
    id: string,
    filename: string,
    dir: string,
    results: StringDict[],
    errors: Partial<Message>[],
    symbol: string
}

export function testProject({
    id,
    filename = undefined,
    dir,
    results = undefined,
    errors = [],
    symbol = "word",
    verbose = SILENT,
    directionLTR = true,
    optimizeAtomicity = true,
    maxRecursion = DEFAULT_MAX_RECURSION,
    maxChars = DEFAULT_MAX_CHARS,
}: Partial<ProjectTest>): void {

    const opt = Options({
        verbose: verbose,
        directionLTR: directionLTR,
        optimizeAtomicity: optimizeAtomicity,
        maxRecursion: maxRecursion,
        maxChars: maxChars
    });

    const projectName = filename || `${dir}${id}`;
    const path = `${dir}/csvs/${projectName}.csv`;
    const abspath = `${TEST_DIR}/${path}`;
    const interpreter = sheetFromFile(abspath, opt);
    if (interpreter === undefined)
        return;
    const qualifiedSymbol = [ projectName, symbol ]
                            .filter(s => s !== undefined && s.length > 0)
                            .join(".");
    const expectedErrors: Partial<Message>[] = errors.map(e => {
        const sheet = e.sheet === undefined ? projectName : e.sheet;
        const error = { ...e, sheet };
        return error;
    });
    testErrors(interpreter, expectedErrors);
    if (results !== undefined) {
        testGenerate(interpreter, results, qualifiedSymbol);
    }
}

export function sheetFromFile(
    path: string,
    opt: Partial<Options> = {}
): Interpreter | undefined {
    const fileExists = existsSync(path);
    if (!fileExists){
        it(`file ${path} should exist`, function() {
            expect(fileExists).to.be.true;
        });
        return;
    }
    const dir = dirname(path);
    const sheetName = basename(path, ".csv");
    const devEnv = new TextDevEnvironment(dir);
    try {
        return Interpreter.fromSheet(devEnv, sheetName, opt);
    } catch (e) {
        it("Unexpected Exception", function() {
            console.log("");
            console.log(`[${this.test?.fullTitle()}]`);
            console.log(e);
            assert.fail(JSON.stringify(e));
        });
    }
    return Interpreter.fromGrammar(Epsilon(), opt);
}
