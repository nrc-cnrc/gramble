import { 
    CounterStack, DUMMY_CELL, FilterGrammar, 
    GenOptions, Grammar, 
    LiteralGrammar, SequenceGrammar 
} from "./grammars";
import { DevEnvironment, DummyCell, Gen, iterTake, StringDict } from "./util";
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";
import { Tape, TapeCollection } from "./tapes";
import { SymbolTable } from "./exprs";
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

    constructor(
        public devEnv: DevEnvironment,
        public grammar: Grammar
    ) { 
        // replace unqualified names (e.g. "x") with 
        // fully-qualified ones (e.g. "Namespace.x")
        const nameQualifier = new NameQualifier();
        this.grammar = nameQualifier.transform(this.grammar);

        // adjust tape names for replacement rules
        const replaceAdjuster = new ReplaceAdjuster();
        this.grammar = replaceAdjuster.transform(this.grammar);

        // recalculate tapes
        this.grammar.calculateTapes(new CounterStack(2));
        // collect vocabulary
        this.tapeObjs = new TapeCollection();
        this.grammar.collectVocab(this.tapeObjs);
        this.grammar.copyVocab(this.tapeObjs);

    }

    public static fromSheet(devEnv: DevEnvironment, mainSheetName: string): Interpreter {
        const sheetProject = new SheetProject(devEnv, mainSheetName);
        const tst = sheetProject.toTST();
        const grammar = tst.toGrammar();
        return new Interpreter(devEnv, grammar);
    }

    public static fromGrammar(grammar: Grammar): Interpreter {
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

    public runChecks(): void {
        this.grammar.runChecksAux();
    }
    
    public *generateAux(
        symbolName: string = "",
        query: StringDict = {},
        opt: GenOptions
    ): Gen<StringDict> {
        const symbolTable: SymbolTable = {};
        let tapePriority = this.grammar.calculateTapes(new CounterStack(2));
        
        let expr = this.grammar.constructExpr(symbolTable);

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
            
            // collectVocab on the original target isn't going to catch 
            // anything more, and copyVocab isn't going to do anything 
            // because none of the new structure does any vocab copying.  
            // So all we have to do is:
            querySeq.collectVocab(this.tapeObjs);
        
        }

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
        const symbolTable: SymbolTable = {};
        let expr = this.grammar.constructExpr(symbolTable);

        const tests = this.grammar.gatherUnitTests();

        for (const test of tests) {

            // create a filter for each test
            const targetComponent = new FilterGrammar(test.cell, test.child, test.test);

            const tapePriority = targetComponent.calculateTapes(new CounterStack(2));
            
            // collectVocab on the child isn't going to catch anything more, and
            // copyVocab isn't going to do anything because none of the new
            // structure does any vocab copying.  So all we have to do is:
            test.test.collectVocab(this.tapeObjs); // in case there's more vocab
            
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