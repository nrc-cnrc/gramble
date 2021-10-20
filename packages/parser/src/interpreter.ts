import { 
    CounterStack, DUMMY_CELL, FilterGrammar, 
    GenOptions, Grammar, 
    LiteralGrammar, SequenceGrammar 
} from "./grammars";
import { DevEnvironment, Gen, iterTake, msToTime, StringDict, timeIt } from "./util";
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";
import { Tape, TapeCollection } from "./tapes";
import { Expr, SymbolTable } from "./exprs";
import { SimpleDevEnvironment } from "./devEnv";
import { NameQualifier, ReplaceAdjuster } from "./transforms";

type GrambleError = { sheet: string, row: number, col: number, msg: string, level: string };

/**
 * An interpreter object is responsible for applying the transformations in between sheets
 * and expressions.
 * 
 * It also acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheets, TSTs, 
 * Grammars, Exprs, Tapes, unit tests, etc. all interact.
 */
export class Interpreter {

    // we store previously-collected Tape objects because memoization
    // or compilation is going to require remembering what indices had previously
    // been assigned to which characters.  (we're not, at the moment, using that 
    // functionality, but even if we're not, it doesn't hurt to keep these around.)
    public tapeObjs: TapeCollection = new TapeCollection();

    // the symbol table doesn't change in between invocations because queries
    // and unit tests are only filters containing sequences of literals -- nothing
    // that could change the meaning of a symbol.
    public symbolTable: SymbolTable = {};

    constructor(
        public devEnv: DevEnvironment,
        public grammar: Grammar,
        public verbose: boolean = false
    ) { 

        timeIt("Qualified names", verbose, () => {
            const nameQualifier = new NameQualifier();
            this.grammar = nameQualifier.transform(this.grammar);
        });

        timeIt("Adjusted tape names", verbose, () => {
            const replaceAdjuster = new ReplaceAdjuster();
            this.grammar = replaceAdjuster.transform(this.grammar);
        });

        timeIt("Collected vocab", verbose, () => {
            // recalculate tapes
            this.grammar.calculateTapes(new CounterStack(2));
            // collect vocabulary
            this.tapeObjs = new TapeCollection();
            this.grammar.collectVocab(this.tapeObjs);

        });

        timeIt("Copied vocab", verbose, () => {
            // copy the vocab if necessary
            this.grammar.copyVocab(this.tapeObjs);
        });

    }

    public static fromSheet(
        devEnv: DevEnvironment, 
        mainSheetName: string,
        verbose: boolean = false
    ): Interpreter {

        // First, load all the sheets
        let startTime = Date.now();
        const sheetProject = new SheetProject(devEnv, mainSheetName);
        
        if (verbose) {
            const elapsedTime = msToTime(Date.now() - startTime);
            console.log(`Sheets loaded; ${elapsedTime}`);
        }
        
        startTime = Date.now();

        const tst = sheetProject.toTST();
        const grammar = tst.toGrammar();

        if (verbose) {
            const elapsedTime = msToTime(Date.now() - startTime);
            console.log(`Converted to grammar; ${elapsedTime}`);
        }

        return new Interpreter(devEnv, grammar, verbose);
    }

    public static fromGrammar(
        grammar: Grammar, 
        verbose: boolean = false
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();
        return new Interpreter(devEnv, grammar);
    }

    public allSymbols(): string[] {
        return this.grammar.allSymbols();
    }

    public getErrors(): GrambleError[] {
        return this.devEnv.getErrorMessages().map(([sheet, row, col, msg, level]) =>
            { return { sheet: sheet, row: row, col:col, msg:msg, level:level }});
    }
    
    public getTapeNames(symbolName: string): [string, string][] {
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

        const gen = this.generateStream(symbolName, 
            restriction, maxRecursion, maxChars);
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
        const [expr, tapes] = this.prepareExpr(symbolName, restriction, opt);
        yield* expr.generate(tapes, opt.random, opt.maxRecursion, opt.maxChars);
    }
    
    public sample(symbolName: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): StringDict[] {
        return [...this.sampleStream(symbolName, 
            numSamples, restriction, maxRecursion, maxChars)];
    } 

    public *sampleStream(symbolName: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        maxRecursion: number = 4, 
        maxChars: number = 1000
    ): Gen<StringDict> {

        const opt: GenOptions = {
            random: true,
            maxRecursion: maxRecursion,
            maxChars: maxChars
        }

        const [expr, tapes] = this.prepareExpr(symbolName, restriction, opt);
        for (let i = 0; i < numSamples; i++) {
            const gen = expr.generate(tapes, opt.random, opt.maxRecursion, opt.maxChars);
            yield* iterTake(gen, 1);
        }
    } 

    public runChecks(): void {
        this.grammar.runChecksAux();
    }
    
    public prepareExpr(
        symbolName: string = "",
        query: StringDict = {},
        opt: GenOptions
    ): [Expr, Tape[]] {

        for (const [key, value] of Object.entries(query)) {
            query[key] = value.normalize('NFD');
        }

        let tapePriority = this.grammar.calculateTapes(new CounterStack(2));
        
        let expr = this.grammar.constructExpr(this.symbolTable);

        let targetComponent = this.grammar.getSymbol(symbolName);
        if (targetComponent == undefined) {
            const allSymbols = this.grammar.allSymbols();
            throw new Error(`Missing symbol: ${symbolName}; choices are [${allSymbols}]`);
        }

        if (Object.keys(query).length > 0) {
            const queryLiterals = Object.entries(query).map(([key, value]) => {
                return new LiteralGrammar(DUMMY_CELL, key, value);
            });
            const querySeq = new SequenceGrammar(DUMMY_CELL, queryLiterals);
            targetComponent = new FilterGrammar(DUMMY_CELL, targetComponent, querySeq);
            tapePriority = targetComponent.calculateTapes(new CounterStack(2));
            
            // we have to collect any new vocab, but only from the new material
            querySeq.collectVocab(this.tapeObjs);
            // we still have to copy though, in case the query added new vocab
            // to something that's eventually a "from" tape of a replace
            targetComponent.copyVocab(this.tapeObjs);
        
        }

        expr = targetComponent.constructExpr(this.symbolTable);

        //console.log(`expr = ${expr.id}`);

        const prioritizedTapes: Tape[] = [];
        for (const tapeName of tapePriority) {
            const actualTape = this.tapeObjs.matchTape(tapeName);
            if (actualTape == undefined) {
                throw new Error(`cannot find priority tape ${tapeName}`);
            }
            prioritizedTapes.push(actualTape);
        }        

        return [expr, prioritizedTapes];    
    }

    public runUnitTests(): void {
        const opt = new GenOptions();
        let expr = this.grammar.constructExpr(this.symbolTable);

        const tests = this.grammar.gatherUnitTests();

        for (const test of tests) {

            // create a filter for each test
            const targetComponent = new FilterGrammar(test.cell, test.child, test.test);

            const tapePriority = targetComponent.calculateTapes(new CounterStack(2));
            
            // we have to collect any new vocab, but only from the new material
            test.test.collectVocab(this.tapeObjs);
            // we still have to copy though, in case the query added new vocab
            // to something that's eventually a "from" tape of a replace
            targetComponent.copyVocab(this.tapeObjs);

            expr = targetComponent.constructExpr(this.symbolTable);

            const prioritizedTapes: Tape[] = [];
            for (const tapeName of tapePriority) {
                const actualTape = this.tapeObjs.matchTape(tapeName);
                if (actualTape == undefined) {
                    throw new Error(`cannot find priority tape ${tapeName}`);
                }
                prioritizedTapes.push(actualTape);
            }        

            const results = [...expr.generate(prioritizedTapes, opt.random, opt.maxRecursion, opt.maxChars)];
            test.evalResults(results);
        }
    }
}