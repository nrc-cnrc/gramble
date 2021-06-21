

import { SimpleDevEnvironment } from "./devEnv";
import { CounterStack, State, Namespace } from "./stateMachine";
import { CellPosition, DevEnvironment, iterTake, StringDict } from "./util";
import { SheetComponent, parseCells, parseHeaderCell } from "./sheetParser";

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

    public globalNamespace: Namespace = new Namespace("__GLOBAL__");
    public defaultSheetName: string = '';
    public sheets: {[key: string]: SheetComponent} = {};

    constructor(
        public devEnv: DevEnvironment = new SimpleDevEnvironment()
    ) { }

    public allSymbols(): string[] {
        return this.globalNamespace.allSymbols();
    }

    public getSymbol(symbolName: string): State | undefined {
        return this.globalNamespace.getSymbol(symbolName, new CounterStack(4));
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
        for (const tapeName of startState.getRelevantTapes(stack)) {
            const header = parseHeaderCell(tapeName, new CellPosition("?",-1,-1));
            results.push([tapeName, header.getColor(0.2)]);
        }
        return results;
    }

    public compile(symbolName: string, compileLevel: number = 1) {
        const symbol = this.globalNamespace.getSymbol(symbolName);
        if (symbol == undefined) {
            throw new Error(`Cannot find symbol ${symbolName} to compile it`);
        }
        const allTapes = symbol.getAllTapes();
        this.globalNamespace.compileSymbol(symbolName, allTapes, new CounterStack(4), compileLevel);
    }

    public generate(symbolName: string = "",
            inputs: StringDict = {},
            maxResults: number = Infinity,
            maxRecursion: number = 4, 
            maxChars: number = 1000): StringDict[] {

        var startState = this.getSymbol(symbolName);
        if (startState == undefined) {
            throw new Error(`Project does not define a symbol named "${symbolName}"`);
        }

        const gen = startState.parse(inputs, false, maxRecursion, maxChars);
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

        var startState = this.getSymbol(symbolName);
        if (startState == undefined) {
            throw new Error(`Project does not define a symbol named "${symbolName}"`);
        }

        return startState.sample(restriction, numSamples, maxTries, maxRecursion, maxChars);
    }
    
    public addSheetAux(sheetName: string): void {

        if (sheetName in this.sheets) {
            // already loaded it, don't have to do anything
            return;
        }

        if (!this.devEnv.hasSource(sheetName)) {
            // this might or might not be an error.  most of the time, it
            // just means that an embed in some sheet referred to a symbol
            // of this name, and we're checking to see if it refers to a 
            // sheet.  Even if we can't find that sheet, we're probably good,
            // it's probably just a symbol name.
            //
            // if this is indeed a programmer error, don't freak out about it here.
            // it's too early to know what and what isn't an error.
            // later on, we'll put errors on any cells for which we can't
            // resolve the reference.
            return;
        }

        const cells = this.devEnv.loadSource(sheetName);

        // parse the cells into an abstract syntax tree
        const sheetComponent = parseCells(sheetName, cells, this.devEnv);

        // put the raw cells into the sheetComponent, for interfaces
        // that need them (like the sidebar of the GSuite add-on)

        // Create a new namespace for this sheet and add it to the 
        // global namespace
        const sheetNamespace = new Namespace(sheetName);
        this.globalNamespace.addLocalNamespace(sheetName, sheetNamespace);

        // Compile it
        sheetComponent.compile(sheetNamespace, this.devEnv);
        
        // Store it in .sheets
        this.sheets[sheetName] = sheetComponent;

        for (const requiredSheet of this.globalNamespace.requiredNamespaces) {
            this.addSheetAux(requiredSheet);
        }
    }

    public addSheet(sheetName: string): void {
        // add this sheet and any sheets that it refers to
        this.addSheetAux(sheetName);
        this.globalNamespace.setDefaultNamespaceName(sheetName);
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

    public runChecks(): void {
        for (const sheetName of Object.keys(this.sheets)) {
            const localNamespace = this.globalNamespace.getLocalNamespace(sheetName);
            if (localNamespace == undefined) {
                throw new Error(`Trying to find local namespace ${sheetName} but can't.`);
            }
            this.sheets[sheetName].runChecks(localNamespace, this.devEnv);
        }
    }

    public getSheet(sheetName: string): SheetComponent {
        if (!(sheetName in this.sheets)) {
            throw new Error(`Sheet ${sheetName} not found in project`);
        }

        return this.sheets[sheetName];
    }

    public getDefaultSheet(): SheetComponent {
        if (this.defaultSheetName == '') {
            throw new Error("Asking for the default sheet of a project to which no sheets have been added");
        }
        return this.getSheet(this.defaultSheetName);
    } 

}