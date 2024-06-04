import { 
    Grammar, 
    CollectionGrammar,
} from "./grammars";

import { 
    Gen, iterTake, 
    StringDict,
    Dict,
} from "./utils/func";
import { Worksheet, Workbook } from "./sources";
import { backgroundColor, parseHeaderCell } from "./headers";
import { Expr, CollectionExpr } from "./exprs";
import { DevEnvironment, SimpleDevEnvironment } from "./devEnv";
import { generate } from "./generator";
import { MissingSymbolError, Message, THROWER, msg } from "./utils/msgs";
import { SOURCE_PASSES, GRAMMAR_PASSES } from "./passes/allPasses";
import { ExecuteTests } from "./passes/executeTests";
import { CreateCursors } from "./passes/createCursors";
import { constructExpr } from "./passes/constructExpr";
import { toStr } from "./passes/toStr";
import { DEFAULT_PROJECT_NAME, DEFAULT_SYMBOL, HIDDEN_PREFIX } from "./utils/constants";
import { VERBOSE_GRAMMAR, VERBOSE_TIME, logTime, msToTime } from "./utils/logging";
import { INDICES, Options } from "./utils/options";
import { SelectSymbol } from "./passes/selectSymbol";
import { getAllSymbols } from "./passes/getAllSymbols";
import { qualifySymbol } from "./passes/qualifySymbols";
import { FlattenCollections } from "./passes/flattenCollections";
import { CreateQuery } from "./passes/createQuery";
import { InfinityProtection } from "./passes/infinityProtection";
import { Component, PassEnv } from "./components";

import * as Tapes from "./tapes";
import { ResolveVocab } from "./passes/resolveVocab";

/**
 * An interpreter object is responsible for applying the passes in between sheets
 * and expressions, and forwarding queries on to the resulting object.
 * 
 * It also acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheets, TSTs, 
 * Grammars, Exprs, Tapes, unit tests, etc. all interact.
 */
export class Interpreter {

    // if the grammar came from an actual Gramble source project (as opposed to, e.g.,
    // a test case constructed in code), the project object is stored here.  right now
    // we only need this for constructing single-source projects in the GSuite interface.
    public workbook: Workbook | undefined = undefined;

    // the grammar of the project.  at the point this is assigned,
    // it's gone through everything including the POST_NAME_PASSES,
    // but hasn't undergone SelectSymbol.
    public grammar: Grammar;

    public opt: Options;

    // for convenience, rather than parse it as a header every time
    public tapeColors: Dict<string> = {};

    constructor(
        public devEnv: DevEnvironment,
        g: Grammar,
        opt: Partial<Options> = {}
    ) { 

        // reset indices to zero
        INDICES.HIDE = 0;
        INDICES.REPLACE = 0;

        this.opt = Options(opt);
        const timeVerbose = (this.opt.verbose & VERBOSE_TIME) != 0;

        // Next, we perform a variety of grammar-to-grammar passes in order
        // to get the grammar into an executable state: symbol references fully-qualified,
        // semantically impossible tape structures are massaged into well-formed ones, some 
        // scope problems adjusted, etc.
        const env = new PassEnv(this.opt);  
        this.grammar = msg(g)
                        .bind(g => GRAMMAR_PASSES.getEnvAndTransform(g, opt))
                        .msgTo(m => sendMsg(this.devEnv, m));

        logGrammar(this.opt.verbose, this.grammar);
    }

    public static fromCSV(
        csv: string,
        opt: Partial<Options> = {}
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();
        devEnv.addSourceAsText(DEFAULT_PROJECT_NAME, csv);
        return Interpreter.fromSheet(devEnv, DEFAULT_PROJECT_NAME, opt);
    }

    public static fromSheet(
        devEnv: DevEnvironment, 
        mainSheetName: string,
        opt: Partial<Options> = {}
    ): Interpreter {

        const opts = Options(opt);

        // First, load all the sheets
        let startTime = Date.now();
        const workbook = new Workbook(mainSheetName);
        addSheet(workbook, mainSheetName, devEnv, opts);
        let elapsedTime = msToTime(Date.now() - startTime);
        logTime(opts.verbose, `Sheets loaded; ${elapsedTime}`);
        
        const grammar = SOURCE_PASSES.getEnvAndTransform(workbook, opts)
                                  .msgTo(m => devEnv.message(m));

        const result = new Interpreter(devEnv, grammar, opts);
        result.workbook = workbook;
        return result;
    }

    public static fromGrammar(
        grammar: Grammar | Dict<Grammar>, 
        opt: Partial<Options> = {}
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();

        if ((grammar instanceof CollectionGrammar)) {
            grammar = grammar;
        } else if ((grammar instanceof Component)) {
            const coll = new CollectionGrammar();
            coll.symbols[DEFAULT_SYMBOL] = grammar;
            grammar = coll;
        } else {
            const coll = new CollectionGrammar(grammar);
            grammar = coll;
        }

        return new Interpreter(devEnv, grammar, opt);
    }

    public allSymbols(): string[] {
        return getAllSymbols(this.grammar);
    }

    /*
     * Qualifies `symbol` and gets the grammar it refers to (if it exists)
     */ 
    public getSymbol(symbol: string): Grammar | undefined {
        const result = qualifySymbol(this.grammar, symbol);
        if (result === undefined) return undefined;
        return result[1];
    }

    public getTapeNames(
        symbol: string,
        stripHidden: boolean = true
    ): string[] {
        const referent = this.getSymbol(symbol);
        if (referent == undefined) {
            throw new Error(`Cannot find symbol ${symbol}`);
        }
        if (stripHidden) {
            return referent.tapeNames.filter(t => !t.startsWith(HIDDEN_PREFIX));
        }
        return referent.tapeNames;
    }

    public getTapeColor(
        tapeName: string, 
        saturation: number = 0.2,
        value: number = 1.0
    ): string {
        if (!(tapeName in this.tapeColors)) {
            const header = parseHeaderCell(tapeName).msgTo(THROWER);
            this.tapeColors[tapeName] = backgroundColor(header, saturation, value);
        }
        return this.tapeColors[tapeName];
    }

    public generate(
        symbol: string = "",
        query: Grammar | StringDict[] | StringDict | string = {},
        maxResults: number = Infinity,
        stripHidden: boolean = true
    ): StringDict[] {
        const gen = this.generateStream(symbol, query, stripHidden);
        const [results, _] = iterTake(gen, maxResults);
        return results;
    }
    
    public *generateStream(
        symbol: string = "",
        query: Grammar | StringDict[] | StringDict | string = {},
        stripHidden: boolean = true
    ): Gen<StringDict> {
        const expr = this.prepareExpr(symbol, query);

        if (stripHidden) {
            yield* stripHiddenTapes(generate(expr, false, this.opt));
            return;
        }

        yield* generate(expr, false, this.opt);
    }
    
    public sample(
        symbol: string = "",
        numSamples: number = 1,
        query: StringDict | undefined = undefined,
        stripHidden: boolean = true
    ): StringDict[] {
        return [...this.sampleStream(symbol, 
            numSamples, query, stripHidden)];
    } 

    public *sampleStream(
        symbol: string = "",
        numSamples: number = 1,
        query: StringDict | undefined = undefined,
        stripHidden: boolean = true
    ): Gen<StringDict> {

        const expr = this.prepareExpr(symbol, query);
        for (let i = 0; i < numSamples; i++) {
            let gen = generate(expr, true, this.opt);
            if (stripHidden) {
                gen = stripHiddenTapes(gen);
            }
            const [results, _] = iterTake(gen, 1);
            yield* results;
        }
    } 

    public convertToSingleSource(): string[][] {
        if (this.workbook == undefined) {
            throw new Error('Cannot create tabular source for this project, ' + 
                'because it did not come from source in the first place.');
        }
        return this.workbook.convertToSingleSheet();
    }
    
    public prepareExpr(
        symbol: string = "",
        query: Grammar | StringDict[] | StringDict | string = {}
    ): Expr {

        // qualify the name and select the symbol
        let targetGrammar: Grammar = new SelectSymbol(symbol)
                                       .getEnvAndTransform(this.grammar, this.opt)
                                       .msgTo(THROWER);
        
        // join the client query to the grammar
        targetGrammar = new CreateQuery(query)
                         .getEnvAndTransform(targetGrammar, this.opt)
                         .msgTo(THROWER);
        
        
        // any tape that isn't already inside a Cursor or PreTape needs
        // to have a Cursor made for it, because otherwise that content will
        // never be handled during the generation loop.
        targetGrammar = new CreateCursors()
                             .getEnvAndTransform(targetGrammar, this.opt)
                             .msgTo(THROWER);
        
        // the client probably doesn't want an accidentally-infinite grammar
        // to generate infinitely.  this checks which tapes could potentially
        // generate infinitely and caps them to opt.maxChars.
        targetGrammar = new InfinityProtection()
                              .getEnvAndTransform(targetGrammar, this.opt)
                              .msgTo(THROWER);

        targetGrammar = new ResolveVocab()
                                .getEnvAndTransform(targetGrammar, this.opt)
                                .msgTo(THROWER);
                            
        // turns the Grammars into Exprs
        const env = new PassEnv(this.opt);
        return constructExpr(env, targetGrammar);  
    }

    public runTests(): void {

        const targetGrammar = new ResolveVocab()
                                .getEnvAndTransform(this.grammar, this.opt)
                                .msgTo(THROWER);
        
        const env = new PassEnv(this.opt);
        const expr = constructExpr(env, targetGrammar);
        const symbols = expr instanceof CollectionExpr
                      ? expr.symbols
                      : {};
        const pass = new ExecuteTests(symbols);
        
        pass.getEnvAndTransform(this.grammar, this.opt)
            .msgTo(m => this.devEnv.message(m));
    }
}

function sendMsg(devEnv: DevEnvironment, msg: Message): void {
    devEnv.message(msg);
}

function addSheet(
    project: Workbook, 
    sheetName: string,
    devEnv: DevEnvironment,
    opt: Partial<Options>
): void {

    if (project.hasSheet(sheetName)) {
        // already loaded it, don't have to do anything
        return;
    }

    if (!devEnv.hasSource(sheetName)) {
        // this is probably a programmer error, in which they've attempted
        // to reference a non-existent symbol, and we're trying to load it as
        // a possible source file.  we don't freak out about it here, though;
        // that symbol will generate an error message at the appropriate place.
        return;
    }

    //console.log(`loading source file ${sheetName}`);
    const cells = devEnv.loadSource(sheetName);

    const sheet = new Worksheet(sheetName, cells);
    project.sheets[sheetName] = sheet;
    const grammar = SOURCE_PASSES.getEnvAndTransform(project, opt)
                                     .msgTo((_) => {});
    // check to see if any names didn't get qualified
    const [_, nameMsgs] =  new FlattenCollections()
                                .getEnvAndTransform(grammar, opt)
                                .destructure();

    const unqualifiedSymbols: Set<string> = new Set(); 
    for (const msg of nameMsgs) {
        if (!(msg instanceof MissingSymbolError)) { 
            continue;
        }
        const firstPart = msg.symbol.split(".")[0];
        unqualifiedSymbols.add(firstPart);
    }

    for (const possibleSheetName of unqualifiedSymbols) {
        addSheet(project, possibleSheetName, devEnv, opt);
    } 

    return;
}

function logGrammar(verbose: number, g: Grammar): void {
    if ((verbose & VERBOSE_GRAMMAR) == VERBOSE_GRAMMAR) {
        console.log(toStr(g));
    }
}

function* stripHiddenTapes(gen: Gen<StringDict>): Gen<StringDict> {
    for (const sd of gen) {
        const result: StringDict = {};
        for (const tapeName in sd) {
            if (tapeName.startsWith(HIDDEN_PREFIX)) {
                continue;
            }
            result[tapeName] = sd[tapeName];
        }
        yield result;
    }
}
