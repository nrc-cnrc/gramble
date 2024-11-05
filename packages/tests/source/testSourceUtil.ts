import { assert, expect } from 'chai';
import { dirname, basename } from "path";
import { existsSync } from "fs";

import { Interpreter } from "../../interpreter/src/interpreter.js";
import { TextDevEnvironment } from "../../interpreter/src/textInterface.js";

import {
    DEFAULT_MAX_RECURSION,
    DEFAULT_MAX_CHARS
} from "../../interpreter/src/utils/constants.js";

import { StringDict } from '../../interpreter/src/utils/func.js';
import { SILENT } from "../../interpreter/src/utils/logging.js";
import { Options } from "../../interpreter/src/utils/options.js";

import { testErrors, testGenerate } from '../testUtil.js';
import { Epsilon } from '../../interpreter/src/grammarConvenience.js';
import { Message } from '../../interpreter/src/utils/msgs.js';
import * as Msgs from '../../interpreter/src/utils/msgs.js';

// const mod = typeof __filename === undefined ? module : import.meta
const module = import.meta

const TEST_DIR = dirname(module.filename);

export function Error(row: number, col: number, sheet?: string): Partial<Message> {
    if (sheet === undefined) return { row, col, tag: Msgs.Tag.Error };
    return {sheet, row, col, tag: Msgs.Tag.Error} 
}

export function Warning(row: number, col: number, sheet?: string):  Partial<Message> {
    if (sheet === undefined) return { row, col, tag: Msgs.Tag.Warning };
    return { row, col, tag: Msgs.Tag.Warning };
}

export interface SourceTestAux extends Options {
    id: string,
    filename: string,
    dir: string,
    symbol: string
    results: StringDict[],
    errors: Partial<Message>[],
}

export function testSourceAux({
    id,
    filename = undefined,
    dir,
    symbol = "word",
    results = undefined,
    errors = [],
    verbose = SILENT,
    directionLTR = true,
    optimizeAtomicity = true,
    maxRecursion = DEFAULT_MAX_RECURSION,
    maxChars = DEFAULT_MAX_CHARS,
}: Partial<SourceTestAux>): void {

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

export interface SourceTest extends SourceTestAux{
    desc: string,
}

export function testSource(params: Partial<SourceTest>): void {
    if (params['desc'] === undefined) {
        it(`desc must be defined`, function() {
            expect(params['desc']).to.not.be.undefined;
        });
        return;
    }

    if (params['id'] === undefined) {
        const id = params["desc"].split(" ")[0];
        params['id'] = id.endsWith(".") ? id.slice(0,-1) : id;
    }

    describe(params['desc'], function() {
        testSourceAux(params);
    });
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
