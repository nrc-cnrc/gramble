import { CompilationLevel, CounterStack, DUMMY_CELL, FilterGrammar, GenOptions, GrammarComponent, LiteralGrammar, NameQualifier, ReplaceAdjuster, SequenceGrammar } from "./grammars";
import { DevEnvironment, Gen, iterTake, StringDict } from "./util";
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";
import { Tape, TapeCollection } from "./tapes";
import { SymbolTable } from "./exprs";
import { SimpleDevEnvironment } from "./devEnv";

type GrambleError = { sheet: string, row: number, col: number, msg: string, level: string };

/**
 * A Gramble object acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheet objects, TSTs, Grammars, and deriv objects
 * all interact.
 */
export class Interpreter {

    constructor(
        public devEnv: DevEnvironment,
        public grammar: GrammarComponent
    ) { }

    public static fromSheet(devEnv: DevEnvironment, mainSheetName: string): Interpreter {
        const sheetProject = new SheetProject(devEnv, mainSheetName);
        const tst = sheetProject.toTST();
        const grammar = tst.toGrammar();
        return new Interpreter(devEnv, grammar);
    }

    public static fromGrammar(grammar: GrammarComponent): Interpreter {
        const devEnv = new SimpleDevEnvironment();
        return new Interpreter(devEnv, grammar);
    }

    public allSymbols(): string[] {
        return this.grammar.allSymbols();
    }
    
    public getSymbol(symbolName: string): GrammarComponent | undefined {
        return this.grammar.getSymbol(symbolName);
    }

    public getErrors(): GrambleError[] {
        return this.devEnv.getErrorMessages().map(([sheet, row, col, msg, level]) =>
            { return { sheet: sheet, row: row, col:col, msg:msg, level:level }});
    }
    
    public getTapeNames(symbolName: string): [string, string][] {
        this.prepare();
        const target = this.grammar.getSymbol(symbolName);
        if (target == undefined || target.tapes == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        const results: [string, string][] = [];
        for (const tapeName of target.tapes) {
            const header = parseHeaderCell(tapeName);
            results.push([tapeName, header.getColor(0.2, 1.0)]);
        }
        return results;
    }


    public generate(
        symbolName: string = "",
        restriction: StringDict = {},
        maxResults: number = Infinity,
        maxRecursion: number = 2, 
        maxChars: number = 1000
    ): StringDict[] {

        const opt: GenOptions = {
            random: false,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }

        const gen = this.generateAux(symbolName, restriction, opt);
        return iterTake(gen, maxResults);
    }
    
    public *generateStream(
        symbolName: string = "",
        restriction: StringDict = {},
        maxRecursion: number = 2, 
        maxChars: number = 1000
    ): Gen<StringDict> {

        const opt: GenOptions = {
            random: false,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }
        
        yield* this.generateAux(symbolName, restriction, opt);
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
            random: true,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }

        let results: StringDict[] = [];
        for (let i = 0; i < numSamples; i++) {
            const gen = this.generateAux(symbolName, restriction, opt);
            results = results.concat(iterTake(gen, 1));
        }
        return results;
    } 

    public tapes: string[] = [];
    public tapeObjs: TapeCollection = new TapeCollection();

    public prepare(): void {

        if (this.grammar.compilationLevel < CompilationLevel.NAMES_QUALIFIED) {
            // resolve names
            const nameQualifier = new NameQualifier();
            this.grammar = nameQualifier.transform(this.grammar);
            this.grammar.compilationLevel = CompilationLevel.NAMES_QUALIFIED;
        }

        if (this.grammar.compilationLevel < CompilationLevel.REPLACE_ADJUSTED) {
            // adjust tapes for replacement operations
            const replaceAdjuster = new ReplaceAdjuster();
            this.grammar = replaceAdjuster.transform(this.grammar);
            this.grammar.compilationLevel = CompilationLevel.REPLACE_ADJUSTED;
        }

        if (this.grammar.compilationLevel < CompilationLevel.VOCAB_COLLECTED) {
            // may be necessary to recalculate tapes
            this.tapes = this.grammar.calculateTapes(new CounterStack(2));
            // collect vocabulary
            this.tapeObjs = new TapeCollection();
            this.grammar.collectVocab(this.tapeObjs);
            this.grammar.copyVocab(this.tapeObjs);
            this.grammar.compilationLevel = CompilationLevel.VOCAB_COLLECTED;
        }
    }

    public runChecks(): void {
        this.prepare();
        this.grammar.runChecksAux();
    }
    
    public *generateAux(
        symbolName: string = "",
        query: StringDict = {},
        opt: GenOptions
    ): Gen<StringDict> {

        this.prepare();
        const symbolTable: SymbolTable = {};
        let expr = this.grammar.constructExpr(symbolTable);

        let targetComponent = this.grammar.getSymbol(symbolName);
        if (targetComponent == undefined) {
            const allSymbols = this.grammar.allSymbols();
            throw new Error(`Missing symbol: ${symbolName}; choices are [${allSymbols}]`);
        }

        if (Object.keys(query).length > 0) {
            const queryLiterals: GrammarComponent[] = [];
            for (const [key, value] of Object.entries(query)) {
                const lit = new LiteralGrammar(DUMMY_CELL, key, value);
                queryLiterals.push(lit);
            }
            const querySeq = new SequenceGrammar(DUMMY_CELL, queryLiterals);
            targetComponent = new FilterGrammar(DUMMY_CELL, targetComponent, querySeq);
        }

        const tapePriority = targetComponent.calculateTapes(new CounterStack(2));
        targetComponent.collectVocab(this.tapeObjs); // in case there's more vocab
        targetComponent.copyVocab(this.tapeObjs);

        expr = targetComponent.constructExpr(symbolTable);

        //console.log(`expr = ${expr.id}`);

        const prioritizedTapes: Tape[] = [];
        for (const tapeName of tapePriority) {
            const actualTape = this.tapeObjs.matchTape(tapeName);
            if (actualTape == undefined) {
                throw new Error(`cannot find priority tape ${tapeName}`);
            }
            prioritizedTapes.push(actualTape);
        }        
        
        yield* expr.generate(prioritizedTapes, opt.random, opt.maxRecursion, opt.maxChars);
    }

    public runUnitTests(): void {
        const opt = new GenOptions();
        this.prepare();
        const symbolTable: SymbolTable = {};
        let expr = this.grammar.constructExpr(symbolTable);

        const tests = this.grammar.gatherUnitTests();

        for (const test of tests) {

            // create a filter for each test
            const targetComponent = new FilterGrammar(test.cell, test.child, test.test);

            const tapePriority = targetComponent.calculateTapes(new CounterStack(2));
            targetComponent.collectVocab(this.tapeObjs); // in case there's more vocab
            targetComponent.copyVocab(this.tapeObjs);
    
            expr = targetComponent.constructExpr(symbolTable);

            const prioritizedTapes: Tape[] = [];
            for (const tapeName of tapePriority) {
                const actualTape = this.tapeObjs.matchTape(tapeName);
                if (actualTape == undefined) {
                    throw new Error(`cannot find priority tape ${tapeName}`);
                }
                prioritizedTapes.push(actualTape);
            }        

            const results = [...expr.generate(prioritizedTapes, opt.random, opt.maxRecursion, opt.maxChars)];
            test.markResults(results);
        }
    }
}