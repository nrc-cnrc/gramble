

import { SimpleDevEnvironment } from "./devEnv";
import { CounterStack, AstComponent, AstNamespace, Root, Epsilon } from "./ast";
import { CellPos, DevEnvironment, DummyCell, iterTake, StringDict } from "./util";
import { TstSheet } from "./tsts";
import { SheetProject, Sheet } from "./sheets";
import { parseHeaderCell } from "./headers";

type GrambleError = { sheet: string, row: number, col: number, msg: string, level: string };

/**
 * A Project does two things:
 * 
 *   (1) Holds multiple SheetComponents (worksheets parsed into a syntax tree and associated 
 *       with States) and a global namespace.
 * 
 *   (2) Acts as a Facade (in the GoF sense) for the client to interact with, so that they
 *       don't necessarily have to understand the ways DevEnvironments, SheetComponents, Namespaces,
 *       and States are related and interact.
 */
export class Project {

    public globalNamespace: AstNamespace = new AstNamespace(new DummyCell(), "__GLOBAL__");
    public defaultSheetName: string = '';
    public sheets: {[key: string]: TstSheet} = {};

    public sheetProject: SheetProject;
    public root: Root | undefined = undefined;

    constructor(
        public devEnv: DevEnvironment = new SimpleDevEnvironment()
    ) { 
        this.sheetProject = new SheetProject(devEnv);
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
        const startState = this.globalNamespace.getSymbol(symbolName);
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

    public compile(symbolName: string, compileLevel: number = 1) {
        /*
        const symbol = this.globalNamespace.getSymbol(symbolName);
        if (symbol == undefined) {
            throw new Error(`Cannot find symbol ${symbolName} to compile it`);
        }
        const allTapes = symbol.getAllTapes();
        this.globalNamespace.compileSymbol(symbolName, allTapes, new CounterStack(4), compileLevel);
        */
    }

    public getRoot(): Root {
        if (this.root == undefined) {
            this.root = this.globalNamespace.getRoot();
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

    /*
    public sample(symbolName: string = "",
            numSamples: number = 1,
            restriction: StringDict = {},
            maxTries: number = 1000,
            maxRecursion: number = 4, 
            maxChars: number = 1000): StringDict[] {

        var startState = this.getSymbol(symbolName);
        if (startState == undefined) {
            throw new Error(`Project does not define a symbol named "${symbolName}"`);
        }

        return startState.sample(restriction, numSamples, maxTries, maxRecursion, maxChars);
    } */
    
    public addSheetAux(sheetName: string): AstComponent | undefined {

        if (sheetName in this.sheets) {
            // already loaded it, don't have to do anything
            return this.globalNamespace.getSymbol(sheetName);
        }

        if (!this.devEnv.hasSource(sheetName)) {
            // this is probably a programmer error, in which they've attempted
            // to reference a non-existant symbol, and we're trying to load it as
            // a possible source file.  we don't freak out about it here, though;
            // that symbol will generate an error message at the appropriate place.
            return Epsilon();
        }

        const cells = this.devEnv.loadSource(sheetName);

        // parse the cells into an abstract syntax tree
        const sheet = new Sheet(this.sheetProject, sheetName, cells);
        const sheetComponent = sheet.toTST();
        const sheetAST = sheetComponent.toAST();
        this.globalNamespace.addSymbol(sheetName, sheetAST);

        // Store it in .sheets
        this.sheets[sheetName] = sheetComponent;

        // check to see if any names didn't get resolved
        const unresolvedNames: Set<string> = new Set(); 
        for (const name of sheetAST.qualifyNames()) {
            const firstPart = name.split(".")[0];
            unresolvedNames.add(firstPart);
        }

        for (const possibleSheetName of unresolvedNames) {
            this.addSheetAux(possibleSheetName);
        }

        return sheetAST;
    }

    public addSheet(sheetName: string): void {
        // add this sheet and any sheets that it refers to
        const ast = this.addSheetAux(sheetName);
        //this.globalNamespace.setDefaultNamespaceName(sheetName);
        if (ast != undefined) {
            this.globalNamespace.addSymbol("__MAIN__", ast);
        }
        this.defaultSheetName = sheetName;
    }

    public addSheetAsText(sheetName: string, text: string) {
        this.devEnv.addSourceAsText(sheetName, text);
        this.addSheet(sheetName);
    }

    public addSheetAsCells(sheetName: string, cells: string[][]) {
        this.devEnv.addSourceAsCells(sheetName, cells);
        this.addSheet(sheetName);
    }

    public getSheet(sheetName: string): TstSheet {
        if (!(sheetName in this.sheets)) {
            throw new Error(`Sheet ${sheetName} not found in project`);
        }

        return this.sheets[sheetName];
    }

    public getDefaultSheet(): TstSheet {
        if (this.defaultSheetName == '') {
            throw new Error("Asking for the default sheet of a project to which no sheets have been added");
        }
        return this.getSheet(this.defaultSheetName);
    } 

}