import { 
    FilterGrammar, Grammar, 
    CollectionGrammar, 
    PriorityGrammar, Query, 
    infinityProtection,
    LocatorGrammar,
    Cursor
} from "./grammars";
import { 
    DevEnvironment, Gen, iterTake, 
    msToTime, StringDict, timeIt, 
    stripHiddenTapes, GenOptions,
    SILENT,
    VERBOSE_TIME,
    logTime,
    logGrammar,
    Dict,
    HIDDEN_PREFIX,
    DEFAULT_SYMBOL_NAME
} from "./util";
import { Worksheet, Workbook } from "./sources";
import { backgroundColor, parseHeaderCell } from "./headers";
import { TapeNamespace } from "./tapes";
import { Expr, ExprNamespace, CollectionExpr } from "./exprs";
import { SimpleDevEnvironment } from "./devEnv";
import { generate } from "./generator";
import { MissingSymbolError, Msg, Msgs, result } from "./msgs";
import { PassEnv } from "./passes";
import { 
    NAME_PASSES, 
    POST_NAME_PASSES, 
    PRE_NAME_PASSES, 
    SHEET_PASSES 
} from "./passes/allPasses";
import { ExecuteTests } from "./passes/executeTests";
import { resolveName } from "./passes/qualifyNames";

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

    // an intermediate grammar that we keep around in order to 
    // resolve symbol names for user queries.
    public nameGrammar: CollectionGrammar;

    // the grammar of the project; this variable will be replaced
    // as compilation towards an Expr progresses.
    public grammar: CollectionGrammar;

    public tapeNS: TapeNamespace = new TapeNamespace();

    // for convenience, rather than parse it as a header every time
    public tapeColors: Dict<string> = {};

    constructor(
        public devEnv: DevEnvironment,
        g: Grammar,
        public verbose: number = SILENT
    ) { 

        const timeVerbose = (verbose & VERBOSE_TIME) != 0;

        // Next, we perform a variety of grammar-to-grammar passes in order
        // to get the grammar into an executable state: symbol references fully-qualified,
        // semantically impossible tape structures are massaged into well-formed ones, some 
        // scope problems adjusted, etc.
        
        const env = new PassEnv();
        env.verbose = verbose;

        const nameGrammar = result(g)
                            .bind(g => PRE_NAME_PASSES.go(g, env))
                            .msgTo(m => sendMsg(this.devEnv, m));


        if (nameGrammar instanceof CollectionGrammar) {
            this.nameGrammar = nameGrammar;
        } else if (nameGrammar instanceof LocatorGrammar && nameGrammar.child instanceof CollectionGrammar) {
            this.nameGrammar = nameGrammar.child;
        } else {
            throw new Error("name grammar is not a collection!");
        }

        this.grammar = result(nameGrammar)
                        .bind(g => NAME_PASSES.go(g, env))
                        .bind(g => POST_NAME_PASSES.go(g, env))
                        .msgTo(m => sendMsg(this.devEnv, m)) as CollectionGrammar

        // Next we collect the vocabulary on all tapes
        timeIt(() => {
            // collect vocabulary
            this.tapeNS = new TapeNamespace();
            this.grammar.collectAllVocab(this.tapeNS, env);
        }, timeVerbose, "Collected vocab");

        logGrammar(this.verbose, this.grammar.id)
    }

    public static fromCSV(
        csv: string,
        verbose: number = SILENT
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();
        devEnv.addSourceAsText("", csv);
        return Interpreter.fromSheet(devEnv, "", verbose);
    }

    public static fromSheet(
        devEnv: DevEnvironment, 
        mainSheetName: string,
        verbose: number = SILENT
    ): Interpreter {

        // First, load all the sheets
        let startTime = Date.now();
        const workbook = new Workbook(mainSheetName);
        addSheet(workbook, mainSheetName, devEnv);
        let elapsedTime = msToTime(Date.now() - startTime);
        logTime(verbose, `Sheets loaded; ${elapsedTime}`);
        
        const env = new PassEnv();
        env.verbose = verbose;
        const grammar = SHEET_PASSES.go(workbook, env)
                                  .msgTo(m => devEnv.message(m));

        const result = new Interpreter(devEnv, grammar, verbose);
        result.workbook = workbook;
        return result;
    }

    public static fromGrammar(
        grammar: Grammar, 
        verbose: number = SILENT
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();

        if (!(grammar instanceof CollectionGrammar)) {
            const coll = new CollectionGrammar();
            coll.symbols[DEFAULT_SYMBOL_NAME] = grammar;
            grammar = coll;
        }

        return new Interpreter(devEnv, grammar, verbose);
    }

    public allSymbols(): string[] {
        return this.grammar.allSymbols();
    }

    public resolveName(name: string): string {
        const namePieces = name.split(".").filter(s => s.length > 0);
        const resolution = resolveName(this.nameGrammar, namePieces);
        if (resolution.name == undefined) {
            throw new Error(`Cannot resolve symbol ${name}`);
        }
        if (resolution.error.length > 0) {
            throw new Error(resolution.error);
        }
        return resolution.name;
    }

    /*
     * Resolves `name` and gets the associated symbol (if it exists)
     */ 
    public getSymbol(name: string): Grammar | undefined {
        const qualifiedName = this.resolveName(name);
        return this.grammar.getSymbol(qualifiedName);
    }

    public getTapeNames(
        symbolName: string,
        stripHidden: boolean = true
    ): string[] {
        const qualifiedName = this.resolveName(symbolName);
        const referent = this.getSymbol(qualifiedName);
        if (referent == undefined) {
            throw new Error(`Internal error: symbol ${symbolName} resolves, but ${qualifiedName} ` +
                    ` does not exist`);
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
        symbolName: string = "",
        restriction: StringDict = {},
        maxResults: number = Infinity,
        maxRecursion: number = 2, 
        maxChars: number = 100,
        stripHidden: boolean = true
    ): StringDict[] {
        const gen = this.generateStream(symbolName, 
            restriction, maxRecursion, maxChars, stripHidden);
        return iterTake(gen, maxResults);
    }
    
    public *generateStream(
        symbolName: string = "",
        restriction: StringDict = {},
        maxRecursion: number = 2, 
        maxChars: number = 100,
        stripHidden: boolean = true
    ): Gen<StringDict> {

        const opt: GenOptions = {
            random: false,
            maxRecursion: maxRecursion,
            maxChars: maxChars,
            verbose: this.verbose
        }
        const expr = this.prepareExpr(symbolName, restriction, opt);

        if (stripHidden) {
            yield* stripHiddenTapes(generate(expr, this.tapeNS, opt));
            return;
        }

        yield* generate(expr, this.tapeNS, opt);
    }
    
    public sample(symbolName: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        maxRecursion: number = 4, 
        maxChars: number = 100,
        stripHidden: boolean = true
    ): StringDict[] {
        return [...this.sampleStream(symbolName, 
            numSamples, restriction, maxRecursion, maxChars, stripHidden)];
    } 

    public *sampleStream(symbolName: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        maxRecursion: number = 4, 
        maxChars: number = 100,
        stripHidden: boolean = true
    ): Gen<StringDict> {

        const opt: GenOptions = {
            random: true,
            maxRecursion: maxRecursion,
            maxChars: maxChars,
            verbose: this.verbose
        }

        const expr = this.prepareExpr(symbolName, restriction, opt);
        for (let i = 0; i < numSamples; i++) {
            let gen = generate(expr, this.tapeNS, opt);
            if (stripHidden) {
                gen = stripHiddenTapes(gen);
            }
            yield* iterTake(gen, 1);
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
        symbolName: string = "",
        query: StringDict = {},
        opt: GenOptions
    ): Expr {
        const env = new PassEnv().pushSymbols(this.grammar.symbols);
        const symbols = new ExprNamespace();
        const qualifiedName = this.resolveName(symbolName);
        
        let targetGrammar: Grammar = this.grammar.selectSymbol(qualifiedName);
        if (targetGrammar == undefined) {
            const allSymbols = this.grammar.allSymbols();
            throw new Error(`Missing symbol: ${symbolName}; choices are [${allSymbols}]`);
        }

        if (Object.keys(query).length > 0) {
            const querySeq = Query(query);
            targetGrammar = new FilterGrammar(targetGrammar, querySeq);
            // there might be new chars in the query
            targetGrammar.collectAllVocab(this.tapeNS, env);
        }
        
        let tapePriority = targetGrammar.getAllTapePriority(this.tapeNS, env);
        targetGrammar = infinityProtection(targetGrammar, tapePriority, symbolName, opt.maxChars, env);
        targetGrammar = Cursor(tapePriority, targetGrammar);

        return targetGrammar.constructExpr(this.tapeNS, symbols);  
    }

    public runTests(): void {
        const exprNS = new ExprNamespace();
        const expr = this.grammar.constructExpr(this.tapeNS, exprNS);
        const symbols = expr instanceof CollectionExpr
                      ? expr.symbols
                      : {};
        const pass = new ExecuteTests(this.tapeNS, symbols);
        const env = new PassEnv();
        pass.transform(this.grammar, env)
            .msgTo(m => sendMsg(this.devEnv, m));
    }
}

function sendMsg(devEnv: DevEnvironment, msg: Msg): void {
    if (msg.pos == undefined) {
        // if it's got no location we have nowhere to display it
        return;
    }
    devEnv.message(msg);
}

function addSheet(
    project: Workbook, 
    sheetName: string,
    devEnv: DevEnvironment): void {

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
    const transEnv = new PassEnv();
    const grammar = SHEET_PASSES.go(project, transEnv)
                                     .msgTo((_) => {});
    // check to see if any names didn't get resolved
    const [_, nameMsgs] = NAME_PASSES.go(grammar, transEnv)
                                     .destructure();

    const unresolvedNames: Set<string> = new Set(); 
    for (const msg of nameMsgs) {
        if (!(msg instanceof MissingSymbolError)) { 
            continue;
        }
        const firstPart = msg.symbol.split(".")[0];
        unresolvedNames.add(firstPart);
    }

    for (const possibleSheetName of unresolvedNames) {
        addSheet(project, possibleSheetName, devEnv);
    } 

    return;
}
