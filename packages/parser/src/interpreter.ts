import { 
    CounterStack, FilterGrammar, Grammar, 
    LiteralGrammar, SequenceGrammar 
} from "./grammars";
import { DevEnvironment, Gen, iterTake, msToTime, StringDict, timeIt, setEquals, DummyCell} from "./util";
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";
import { Tape, TapeCollection } from "./tapes";
import { Expr, GenOptions, SymbolTable } from "./exprs";
import { SimpleDevEnvironment } from "./devEnv";
import { NameQualifier, RenameFixTransform, ReplaceAdjuster, FilterCreatorTransform } from "./transforms";

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

    // for convenience, rather than parse it as a header every time
    public tapeColors: {[tapeName: string]: string} = {};

    constructor(
        public devEnv: DevEnvironment,
        public grammar: Grammar,
        public verbose: boolean = false
    ) { 

        //console.log(this.grammar.id);

        timeIt(() => {
            const nameQualifier = new NameQualifier();
            this.grammar = nameQualifier.transform(this.grammar);
        }, verbose, "Qualified names");

        timeIt(() => {
            const replaceAdjuster = new ReplaceAdjuster();
            this.grammar = replaceAdjuster.transform(this.grammar);
        }, verbose, "Adjusted tape names");

        timeIt(() => {
            const renameFixer = new RenameFixTransform();
            this.grammar = renameFixer.transform(this.grammar);
        }, verbose, "Fixed any erroneous renames");

        timeIt(() => {
            const filterCreator = new FilterCreatorTransform();
            this.grammar = filterCreator.transform(this.grammar);
        }, verbose, "Created starts/ends/contains filters");

        console.log(this.grammar.id);

        timeIt(() => {
            // recalculate tapes
            const tapeNames = this.grammar.calculateTapes(new CounterStack(2));
            // collect vocabulary
            this.tapeObjs = new TapeCollection();
            this.grammar.collectAllVocab(this.tapeObjs);

        }, verbose, "Collected vocab");

        timeIt(() => {
            // copy the vocab if necessary
            this.grammar.copyVocab(this.tapeObjs, new Set());
        }, verbose, "Copied vocab");

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
    
    public getTapeNames(symbolName: string): string[] {
        const target = this.grammar.getSymbol(symbolName);
        if (target == undefined || target.tapes == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        return target.tapes;
    }

    public getTapeColor(
        tapeName: string, 
        saturation: number = 0.2,
        value: number = 1.0
    ): string {
        if (!(tapeName in this.tapeColors)) {
            const header = parseHeaderCell(tapeName);
            this.tapeColors[tapeName] = header.getBackgroundColor(saturation, value);
        }
        return this.tapeColors[tapeName];
    }

    public generate(
        symbolName: string = "",
        restriction: StringDict = {},
        maxResults: number = Infinity,
        maxRecursion: number = 2, 
        maxChars: number = 1000
    ): StringDict[] {
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
            maxChars: maxChars,
            direction: "RTL"
        }
        const [expr, tapes] = this.prepareExpr(symbolName, restriction, opt);
        yield* expr.generate(tapes, opt);
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
            maxChars: maxChars,
            direction: "RTL"
        }

        const [expr, tapes] = this.prepareExpr(symbolName, restriction, opt);
        for (let i = 0; i < numSamples; i++) {
            const gen = expr.generate(tapes, opt);
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

        tapePriority = targetComponent.calculateTapes(new CounterStack(2));

        if (Object.keys(query).length > 0) {
            const queryLiterals = Object.entries(query).map(([key, value]) => {
                return new LiteralGrammar(new DummyCell(), key, value);
            });
            const querySeq = new SequenceGrammar(new DummyCell(), queryLiterals);
            targetComponent = new FilterGrammar(new DummyCell(), targetComponent, querySeq);
            tapePriority = targetComponent.calculateTapes(new CounterStack(2));
            
            // we have to collect any new vocab, but only from the new material
            querySeq.collectAllVocab(this.tapeObjs);
            // we still have to copy though, in case the query added new vocab
            // to something that's eventually a "from" tape of a replace
            targetComponent.copyVocab(this.tapeObjs, new Set());
        
        }

        expr = targetComponent.constructExpr(this.symbolTable);

        const prioritizedTapes: Tape[] = [];
        for (const tapeName of tapePriority) {
            const actualTape = this.tapeObjs.matchTape(tapeName);
            if (actualTape == undefined) {
                throw new Error(`cannot find priority tape ${tapeName}`);
            }
            prioritizedTapes.push(actualTape);
        }        

        console.log(expr.id);

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
            test.test.collectAllVocab(this.tapeObjs);
            // we still have to copy though, in case the query added new vocab
            // to something that's eventually a "from" tape of a replace
            targetComponent.copyVocab(this.tapeObjs, new Set());

            expr = targetComponent.constructExpr(this.symbolTable);

            const prioritizedTapes: Tape[] = [];
            for (const tapeName of tapePriority) {
                const actualTape = this.tapeObjs.matchTape(tapeName);
                if (actualTape == undefined) {
                    throw new Error(`cannot find priority tape ${tapeName}`);
                }
                prioritizedTapes.push(actualTape);
            }        

            const results = [...expr.generate(prioritizedTapes, opt)];
            test.evalResults(results);
        }
    }
}