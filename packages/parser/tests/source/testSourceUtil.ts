import { dirname, basename } from "path";
import { existsSync } from "fs";
import { expect } from 'chai';

import { StringDict, SILENT } from '../../src/util';
import { testErrors, testGenerate } from '../testUtil';
import { Interpreter } from "../../src/interpreter";
import { TextDevEnvironment } from "../../src/textInterface";

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

export interface ProjectTest {
    id: string,
    filename: string,
    dir: string,
    results: StringDict[],
    errors: ProjectError[],
    verbose: number,
    symbol: string
}

export function testProject({
    id,
    filename = undefined,
    dir,
    results = undefined,
    errors = [],
    verbose = SILENT,
    symbol = "word"
}: Partial<ProjectTest>): void {
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
        testGenerate(project, results, verbose, qualifiedName);
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
    return Interpreter.fromSheet(devEnv, sheetName, verbose);
}