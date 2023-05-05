import * as path from 'path';
import * as fs from 'fs';

import { SILENT, StringDict } from '../../src/util';
import { sheetFromFile, testErrors, testGrammar } from '../testUtil';
import { expect } from 'chai';

const TEST_DIR = path.dirname(module.filename);

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
    file: string,
    dir?: string,
    results?: StringDict[],
    errors?: ProjectError[],
    verbose?: number,
    symbol?: string
}

export function testProject({
    file,
    dir,
    results,
    errors = [],
    verbose = SILENT,
    symbol = "word"
}: ProjectTest): void {
    const projectName = `${dir}${file}`;
    const filename = `${TEST_DIR}/${dir}/csvs/${projectName}.csv`;
    const fileExists = fs.existsSync(filename);
    if (!fileExists){
        it(`file ${dir}/csvs/${projectName}.csv should exist`, function() {
            expect(fileExists).to.be.true;
        });
        return;
    }
    const project = sheetFromFile(filename, verbose);
    const qualifiedName = [ projectName, symbol ]
                            .filter(s => s !== undefined && s.length > 0)
                            .join(".");
    const expectedErrors: [string, number, number, string][] = errors.map(e => {
        return [ e.sheet || projectName, e.row, e.col, e.severity || "error" ];
    });
    testErrors(project, expectedErrors);
    if (results !== undefined) {
        testGrammar(project, results, verbose, qualifiedName);
    }
}