import { dirname, basename } from "path";
import { existsSync } from "fs";
import { expect } from 'chai';

import { StringDict } from '../../src/utils/func';
import { testErrors, testGenerate } from '../testUtil';
import { Interpreter } from "../../src/interpreter";
import { TextDevEnvironment } from "../../src/textInterface";
import { DEFAULT_MAX_RECURSION, DEFAULT_MAX_CHARS } from "../../src/utils/constants";
import { SILENT } from "../../src/utils/logging";
import { Options } from "../../src/utils/options";

const TEST_DIR = dirname(module.filename);

export interface ProjectError {
    sheet?: string,
    row: number,
    col: number,
    severity?: string
}

export function Error(row: number, col: number) {
    return { row: row, col: col, severity: "error" };
}

export function Warning(row: number, col: number) {
    return { row: row, col: col, severity: "warning" };
}

export interface ProjectTest extends Options {
    id: string,
    filename: string,
    dir: string,
    results: StringDict[],
    errors: ProjectError[],
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
    const project = sheetFromFile(abspath, verbose);
    if (project === undefined)
        return;
    const qualifiedName = [ projectName, symbol ]
                            .filter(s => s !== undefined && s.length > 0)
                            .join(".");
    const expectedErrors: [string, number, number, string][] = errors.map(e => {
        const sheet = e.sheet === undefined ? projectName : e.sheet;
        return [ sheet, e.row, e.col, e.severity || "error" ];
    });
    testErrors(project, expectedErrors);
    if (results !== undefined) {
        testGenerate(project, results, opt, qualifiedName);
    }
}

export function sheetFromFile(
    path: string,
    verbose: number = SILENT
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
    return Interpreter.fromSheet(devEnv, sheetName, {verbose:verbose});
}
