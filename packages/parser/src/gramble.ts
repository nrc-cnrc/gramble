import { CounterStack, GenOptions, GrammarComponent } from "./grammars";
import { DevEnvironment, Gen, iterTake, StringDict } from "./util";
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";

type GrambleError = { sheet: string, row: number, col: number, msg: string, level: string };

/**
 * A Gramble object acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheet objects, TSTs, Grammars, and deriv objects
 * all interact.
 */
export class Gramble {

    public sheetProject: SheetProject;
    public grammar: GrammarComponent | undefined = undefined;

    constructor(
        public devEnv: DevEnvironment,
        public mainSheetName: string
    ) { 
        this.sheetProject = new SheetProject(devEnv, mainSheetName);
    }

    public allSymbols(): string[] {
        return this.getGrammar().allSymbols();
    }
    
    public getSymbol(symbolName: string): GrammarComponent | undefined {
        return this.getGrammar().getSymbol(symbolName);
    }

    public getErrors(): GrambleError[] {
        return this.devEnv.getErrorMessages().map(([sheet, row, col, msg, level]) =>
            { return { sheet: sheet, row: row, col:col, msg:msg, level:level }});
    }
    
    public getTapeNames(symbolName: string): [string, string][] {
        const grammar = this.getGrammar();
        grammar.qualifyNames();
        const target = grammar.getSymbol(symbolName);
        if (target == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        const results: [string, string][] = [];
        const stack = new CounterStack(2);
        for (const tapeName of target.calculateTapes(stack)) {
            const header = parseHeaderCell(tapeName);
            results.push([tapeName, header.getColor(0.2, 1.0)]);
        }
        return results;
    }

    public getGrammar(): GrammarComponent {
        if (this.grammar == undefined) {
            const tst = this.sheetProject.toTST();
            this.grammar = tst.toGrammar();
        }
        return this.grammar;
    } 

    public runUnitTests(): void {
        const opt = new GenOptions();
        this.getGrammar().runUnitTests(opt);
    }

    public generate(symbolName: string = "",
            restriction: StringDict = {},
            maxResults: number = Infinity,
            maxRecursion: number = 2, 
            maxChars: number = 1000): StringDict[] {

        const opt: GenOptions = {
            multichar: true,
            random: false,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }
        const gen = this.getGrammar().generate(symbolName, restriction, opt);
        return iterTake(gen, maxResults);
    }
    
    public *generateStream(symbolName: string = "",
            restriction: StringDict = {},
            maxRecursion: number = 2, 
            maxChars: number = 1000): Gen<StringDict> {

        const opt: GenOptions = {
            multichar: true,
            random: false,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }
        yield* this.getGrammar().generate(symbolName, restriction, opt);
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
        restriction: StringDict | undefined = undefined,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): StringDict[] {

        const opt: GenOptions = {
            multichar: true,
            random: true,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }

        let results: StringDict[] = [];
        for (let i = 0; i < numSamples; i++) {
            const gen = this.getGrammar().generate(symbolName, restriction, opt);
            results = results.concat(iterTake(gen, 1));
        }
        return results;
    } 

}