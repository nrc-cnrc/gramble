import { 
    Grammar, 
    CollectionGrammar,
    LocatorGrammar,
    JoinGrammar,
} from "./grammars";

import { 
    Query,
    Cursor,
} from "./grammarConvenience";

import { 
    Gen, iterTake, 
    StringDict,
    Dict,
} from "./utils/func";
import { Worksheet, Workbook } from "./sources";
import { backgroundColor, parseHeaderCell } from "./headers";
import { TapeNamespace } from "./tapes";
import { Expr, CollectionExpr } from "./exprs";
import { DevEnvironment, SimpleDevEnvironment } from "./devEnv";
import { generate } from "./generator";
import { MissingSymbolError, Msg, THROWER, result } from "./utils/msgs";
import { PassEnv } from "./passes";
import { 
    SYMBOL_PASSES, 
    POST_SYMBOL_PASSES, 
    PRE_SYMBOL_PASSES, 
    SHEET_PASSES 
} from "./passes/allPasses";
import { ExecuteTests } from "./passes/executeTests";
import { infinityProtection } from "./passes/infinityProtection";
import { prioritizeTapes } from "./passes/prioritizeTapes";
import { constructExpr } from "./passes/constructExpr";
import { toStr } from "./passes/toStr";
import { DEFAULT_PROJECT_NAME, DEFAULT_SYMBOL, HIDDEN_PREFIX } from "./utils/constants";
import { VERBOSE_GRAMMAR, VERBOSE_TIME, logTime, msToTime, timeIt } from "./utils/logging";
import { Options } from "./utils/options";
import { SelectSymbol } from "./passes/selectSymbol";
import { getAllSymbols } from "./passes/getAllSymbols";
import { qualifySymbol } from "./passes/qualifySymbols";

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

    public tapeNS: TapeNamespace = new TapeNamespace();

    // for convenience, rather than parse it as a header every time
    public tapeColors: Dict<string> = {};

    constructor(
        public devEnv: DevEnvironment,
        g: Grammar,
        opt: Partial<Options> = {}
    ) { 

        this.opt = Options(opt);
        const timeVerbose = (this.opt.verbose & VERBOSE_TIME) != 0;

        // Next, we perform a variety of grammar-to-grammar passes in order
        // to get the grammar into an executable state: symbol references fully-qualified,
        // semantically impossible tape structures are massaged into well-formed ones, some 
        // scope problems adjusted, etc.
        
        const env = new PassEnv(this.opt);
                            
        this.grammar = result(g)
                        .bind(g => PRE_SYMBOL_PASSES.go(g, env))
                        .bind(g => SYMBOL_PASSES.go(g, env))
                        .bind(g => POST_SYMBOL_PASSES.go(g, env))
                        .msgTo(m => sendMsg(this.devEnv, m));

        // Next we collect the vocabulary on all tapes
        timeIt(() => {
            // collect vocabulary
            this.tapeNS = new TapeNamespace();
            this.grammar.collectAllVocab(this.tapeNS, env);
        }, timeVerbose, "Collected vocab");

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

        const passOpts = Options(opt);

        // First, load all the sheets
        let startTime = Date.now();
        const workbook = new Workbook(mainSheetName);
        addSheet(workbook, mainSheetName, devEnv, passOpts);
        let elapsedTime = msToTime(Date.now() - startTime);
        logTime(passOpts.verbose, `Sheets loaded; ${elapsedTime}`);
        
        const env = new PassEnv(passOpts);
        const grammar = SHEET_PASSES.go(workbook, env)
                                  .msgTo(m => devEnv.message(m));

        const result = new Interpreter(devEnv, grammar, passOpts);
        result.workbook = workbook;
        return result;
    }

    public static fromGrammar(
        grammar: Grammar, 
        opt: Partial<Options> = {}
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();

        if (!(grammar instanceof CollectionGrammar)) {
            const coll = new CollectionGrammar();
            coll.symbols[DEFAULT_SYMBOL] = grammar;
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
            return referent.tapes.filter(t => !t.startsWith(HIDDEN_PREFIX));
        }
        return referent.tapes;
    }

    public getTapeColor(
        tapeName: string, 
        saturation: number = 0.2,
        value: number = 1.0
    ): string {
        if (!(tapeName in this.tapeColors)) {
            const [header, msgs] = parseHeaderCell(tapeName).destructure();
            this.tapeColors[tapeName] = backgroundColor(header, saturation, value);
        }
        return this.tapeColors[tapeName];
    }

    public generate(
        symbol: string = "",
        restriction: StringDict[] | StringDict = {},
        maxResults: number = Infinity,
        stripHidden: boolean = true
    ): StringDict[] {
        const gen = this.generateStream(symbol, restriction, stripHidden);
        const [results, _] = iterTake(gen, maxResults);
        return results;
    }
    
    public *generateStream(
        symbol: string = "",
        restriction: StringDict[] | StringDict = {},
        stripHidden: boolean = true
    ): Gen<StringDict> {
        const expr = this.prepareExpr(symbol, restriction);

        if (stripHidden) {
            yield* stripHiddenTapes(generate(expr, this.tapeNS, false, this.opt));
            return;
        }

        yield* generate(expr, this.tapeNS, false, this.opt);
    }
    
    public sample(
        symbol: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        stripHidden: boolean = true
    ): StringDict[] {
        return [...this.sampleStream(symbol, 
            numSamples, restriction, stripHidden)];
    } 

    public *sampleStream(
        symbol: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        stripHidden: boolean = true
    ): Gen<StringDict> {

        const expr = this.prepareExpr(symbol, restriction);
        for (let i = 0; i < numSamples; i++) {
            let gen = generate(expr, this.tapeNS, true, this.opt);
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
        query: StringDict[] | StringDict = {}
    ): Expr {
        const env = new PassEnv(this.opt);

        // qualify the name and select the symbol
        const selectSymbol = new SelectSymbol(symbol);
        let targetGrammar: Grammar = selectSymbol.go(this.grammar, env).msgTo(THROWER);
        
        if (Object.keys(query).length > 0) {
            const querySeq = Query(query);
            targetGrammar = new JoinGrammar(targetGrammar, querySeq).tapify(env);
            // there might be new chars in the query
            //targetGrammar.collectAllVocab(this.tapeNS, env);
        }

        targetGrammar.collectAllVocab(this.tapeNS, env);
        
        let tapePriority = prioritizeTapes(targetGrammar, this.tapeNS, env);
        targetGrammar = infinityProtection(targetGrammar, tapePriority, env);
        targetGrammar = Cursor(tapePriority, targetGrammar);
        
        return constructExpr(env, targetGrammar);  
    }

    public runTests(): void {
        const env = new PassEnv(this.opt);
        const expr = constructExpr(env, this.grammar);
        const symbols = expr instanceof CollectionExpr
                      ? expr.symbols
                      : {};
        const pass = new ExecuteTests(this.tapeNS, symbols);
        
        pass.transform(this.grammar, env)
            .msgTo(m => this.devEnv.message(m));
    }
}

function sendMsg(devEnv: DevEnvironment, msg: Msg): void {
    devEnv.message(msg);
}

function addSheet(
    project: Workbook, 
    sheetName: string,
    devEnv: DevEnvironment,
    opt: Options
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
    const transEnv = new PassEnv(opt);
    const grammar = SHEET_PASSES.go(project, transEnv)
                                     .msgTo((_) => {});
    // check to see if any names didn't get qualified
    const [_, nameMsgs] = SYMBOL_PASSES.go(grammar, transEnv)
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