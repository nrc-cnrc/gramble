

import { SimpleDevEnvironment } from "./devEnv";
import { CounterStack, AstComponent, Root } from "./ast";
import { DevEnvironment, iterTake, StringDict } from "./util";
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";

type GrambleError = { sheet: string, row: number, col: number, msg: string, level: string };

/**
 * A Gramble object acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheet objects, TSTs, ASTs, and deriv objects
 * all interact.
 */
export class Gramble {

    public sheetProject: SheetProject;
    public root: Root | undefined = undefined;

    constructor(
        public devEnv: DevEnvironment,
        public mainSheetName: string
    ) { 
        this.sheetProject = new SheetProject(devEnv, mainSheetName);
    }

    public addSheet(sheetName: string): void {
        this.sheetProject.addSheet(sheetName);
    }

    public allSymbols(): string[] {
        return this.getRoot().allSymbols();
    }

    public getSymbol(symbolName: string): AstComponent | undefined {
        return this.getRoot().getComponent(symbolName);
    }

    public getErrors(): GrambleError[] {
        return this.devEnv.getErrorMessages().map(([sheet, row, col, msg, level]) =>
            { return { sheet: sheet, row: row, col:col, msg:msg, level:level }});
    }
    
    public getTapeNames(symbolName: string): [string, string][] {
        const startState = this.getRoot().getComponent(symbolName);
        if (startState == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        const results: [string, string][] = [];
        const stack = new CounterStack(2);
        for (const tapeName of startState.calculateTapes(stack)) {
            const header = parseHeaderCell(tapeName);
            results.push([tapeName, header.getColor(0.2)]);
        }
        return results;
    }

    public getRoot(): Root {
        if (this.root == undefined) {
            const tst = this.sheetProject.toTST();
            const ast = tst.toAST();
            this.root = ast.getRoot();
        }
        return this.root;
    }

    public generate(symbolName: string = "",
            inputs: StringDict = {},
            maxResults: number = Infinity,
            maxRecursion: number = 4, 
            maxChars: number = 1000): StringDict[] {

        const gen = this.getRoot().generate(symbolName, false, maxRecursion, maxChars);
        //const gen = startState.parse(inputs, false, maxRecursion, maxChars);
        return iterTake(gen, maxResults);
    }

    public stripHiddenFields(entries: StringDict[]): StringDict[] {
        const results: StringDict[] = [];
        for (const entry of entries) {
            const result: StringDict = {};
            for (const [key, value] of Object.entries(entry)) {
                if (!key.startsWith("__")) {
                    result[key] = value;
                }
            }
            results.push(result);
        }
        return results;
    }

    public sample(symbolName: string = "",
            numSamples: number = 1,
            restriction: StringDict = {},
            maxTries: number = 1000,
            maxRecursion: number = 4, 
            maxChars: number = 1000): StringDict[] {

        let results: StringDict[] = [];
        for (let i = 0; i < maxTries; i++) {
            const gen = this.getRoot().generate(symbolName, true, maxRecursion, maxChars);
            results = results.concat(iterTake(gen, 1));
            if (results.length >= numSamples) {
                break;
            }
        }
        return results;
    } 

}