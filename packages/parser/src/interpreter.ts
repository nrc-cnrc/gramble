import { 
    CounterStack, CountGrammar, 
    EqualsGrammar, Grammar, 
    LiteralGrammar, NsGrammar, 
    PriorityGrammar, SequenceGrammar, 
} from "./grammars";
import { 
    DevEnvironment, Gen, iterTake, 
    msToTime, StringDict, timeIt, 
    stripHiddenTapes, GenOptions, 
    HIDDEN_TAPE_PREFIX,
    SILENT,
    VERBOSE_TIME,
    logTime,
    logGrammar
} from "./util";
import { Worksheet, Workbook } from "./sheets";
import { parseHeaderCell } from "./headers";
import { TapeNamespace, VocabMap } from "./tapes";
import { Expr, SymbolTable } from "./exprs";
import { SimpleDevEnvironment } from "./devEnv";
import { generate } from "./generator";
import { MissingSymbolError, Msgs } from "./msgs";
import { PassEnv } from "./passes";
import { 
    GRAMMAR_PASSES, 
    QUALIFY_NAMES, 
    PRE_GRAMMAR_PASSES 
} from "./passes/allPasses";
import { UnitTestPass } from "./passes/unitTests";

/**
 * An interpreter object is responsible for applying the passes in between sheets
 * and expressions.
 * 
 * It also acts as a Facade (in the GoF sense) for the client to interact with, so that they
 * don't necessarily have to understand the ways DevEnvironments, Sheets, TSTs, 
 * Grammars, Exprs, Tapes, unit tests, etc. all interact.
 */
export class Interpreter {

    // if the grammar came from an actual gramble source project (as opposed to, e.g.,
    // a test case constructed in code), the project object is stored here.  right now
    // we only need this for constructing single-source projects in the GSuite interface.
    public workbook: Workbook | undefined = undefined;

    // we store previously-collected Tape objects because memoization
    // or compilation is going to require remembering what indices had previously
    // been assigned to which characters.  (we're not, at the moment, using that 
    // functionality, but even if we're not, it doesn't hurt to keep these around.)
    public vocab: VocabMap = new VocabMap();
    public tapeNS: TapeNamespace = new TapeNamespace();

    // the symbol table doesn't change in between invocations because queries
    // and unit tests are only filters containing sequences of literals -- nothing
    // that could change the meaning of a symbol.
    public symbolTable: SymbolTable = {};

    // for convenience, rather than parse it as a header every time
    public tapeColors: {[tapeName: string]: string} = {};

    public grammar: NsGrammar;

    constructor(
        public devEnv: DevEnvironment,
        g: Grammar,
        public verbose: number = SILENT
    ) { 

        // First, all grammars within Interpreters must have a namespace as their root.  
        // This simplifies the API and some of the passes that follow; rather 
        // than every part having to check whether something is a namespace or not,
        // we wrap non-namespaces in a trivial namespace.
        if (g instanceof NsGrammar) {
            this.grammar = g;
        } else {
            this.grammar = new NsGrammar();
            this.grammar.addSymbol("", g);
        }

        const timeVerbose = (verbose & VERBOSE_TIME) != 0;

        // Next, we perform a variety of grammar-to-grammar passes in order
        // to get the grammar into an executable state: symbol references fully-qualified,
        // semantically impossible tape structures are massaged into well-formed ones, some 
        // scope problems adjusted, etc.
        
        const env = new PassEnv();
        env.verbose = verbose;
        const [newGrammar, msgs] = this.grammar.msg() // lift to result
                     .bind(g => GRAMMAR_PASSES.go(g, env))
                     .destructure();
        this.grammar = newGrammar as NsGrammar;
        sendMessages(devEnv, msgs);

        // Next we collect the vocabulary on all tapes
        timeIt(() => {
            // recalculate tapes
            this.grammar.calculateTapes(new CounterStack(2), env);
            // collect vocabulary
            this.tapeNS = new TapeNamespace();
            this.grammar.collectAllVocab(this.vocab, this.tapeNS, env);
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
        
        startTime = Date.now();
        const transEnv = new PassEnv();
        transEnv.verbose = verbose;
        const grammar = PRE_GRAMMAR_PASSES.go(workbook, transEnv)
                                  .msgTo(m => devEnv.message(m));
        elapsedTime = msToTime(Date.now() - startTime);
        logTime(verbose, `Converted to grammar; ${elapsedTime}`);

        const result = new Interpreter(devEnv, grammar, verbose);
        result.workbook = workbook;
        return result;
    }

    public static fromGrammar(
        grammar: Grammar, 
        verbose: number = SILENT
    ): Interpreter {
        const devEnv = new SimpleDevEnvironment();
        return new Interpreter(devEnv, grammar, verbose);
    }


    public allSymbols(): string[] {
        return this.grammar.allSymbols();
    }
    
    public getTapeNames(
        symbolName: string,
        stripHidden: boolean = true
    ): string[] {
        const target = this.grammar.getSymbol(symbolName);
        if (target == undefined) {
            throw new Error(`Cannot find symbol ${symbolName}`);
        }
        if (stripHidden) {
            return target.tapes.filter(t => !t.startsWith(HIDDEN_TAPE_PREFIX));
        }
        return target.tapes;
    }

    public getTapeColor(
        tapeName: string, 
        saturation: number = 0.2,
        value: number = 1.0
    ): string {
        if (!(tapeName in this.tapeColors)) {
            const [header, msgs] = parseHeaderCell(tapeName).destructure();
            this.tapeColors[tapeName] = header.getBackgroundColor(saturation, value);
        }
        return this.tapeColors[tapeName];
    }

    public generate(
        symbolName: string = "",
        restriction: StringDict = {},
        maxResults: number = Infinity,
        maxRecursion: number = 2, 
        maxChars: number = 1000,
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
        maxChars: number = 1000,
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
        maxChars: number = 1000,
        stripHidden: boolean = true
    ): StringDict[] {
        return [...this.sampleStream(symbolName, 
            numSamples, restriction, maxRecursion, maxChars, stripHidden)];
    } 

    public *sampleStream(symbolName: string = "",
        numSamples: number = 1,
        restriction: StringDict | undefined = undefined,
        maxRecursion: number = 4, 
        maxChars: number = 1000,
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
        opt: GenOptions,
        tapePriority: string[] = []
    ): Expr {
        const env = new PassEnv().pushSymbols(this.grammar.symbols);
        
        let expr = this.grammar.constructExpr(this.tapeNS, this.symbolTable);
        let targetGrammar = this.grammar.getSymbol(symbolName);
        if (targetGrammar == undefined) {
            const allSymbols = this.grammar.allSymbols();
            throw new Error(`Missing symbol: ${symbolName}; choices are [${allSymbols}]`);
        }

        tapePriority = this.grammar.getAllTapePriority(this.tapeNS, env);

        if (Object.keys(query).length > 0) {
            const queryLiterals = Object.entries(query).map(([key, value]) => {
                key = key.normalize("NFD"); 
                value = value.normalize("NFD");
                return new LiteralGrammar(key, value);
            });
            const querySeq = new SequenceGrammar(queryLiterals);
            targetGrammar = new EqualsGrammar(targetGrammar, querySeq);
            tapePriority = this.grammar.getAllTapePriority(this.tapeNS, env);
            
            // we have to collect any new vocab, but only from the new material
            targetGrammar.collectAllVocab(this.vocab, this.tapeNS, env);
            // we still have to copy though, in case the query added new vocab
            // to something that's eventually a "from" tape of a replace
            //targetGrammar.copyVocab(this.tapeNS, new Set());        
        }

        const potentiallyInfinite = targetGrammar.potentiallyInfinite(new CounterStack(2), env);
        if (potentiallyInfinite && opt.maxChars != Infinity) {
            if (targetGrammar instanceof PriorityGrammar) {
                targetGrammar.child = new CountGrammar(targetGrammar.child, opt.maxChars-1);
            } else {
                targetGrammar = new CountGrammar(targetGrammar, opt.maxChars-1);
            }
        }

        if (!(targetGrammar instanceof PriorityGrammar)) {
            targetGrammar = new PriorityGrammar(targetGrammar, tapePriority);
            //logTime(this.verbose, `priority = ${(targetGrammar as PriorityGrammar).tapePriority}`)
        }

        expr = targetGrammar.constructExpr(this.tapeNS, this.symbolTable);
        return expr;    
    }

    public runUnitTests(): void {
        this.grammar.constructExpr(this.tapeNS, this.symbolTable);  // fill the symbol table if it isn't already
        const env = new PassEnv();
        const t = new UnitTestPass(this.vocab, this.tapeNS, this.symbolTable);
        const [_, msgs] = t.transform(this.grammar, env).destructure(); // results.item isn't important
        sendMessages(this.devEnv, msgs);
    }
}

function sendMessages(devEnv: DevEnvironment, msgs: Msgs): void {
    for (const msg of msgs) {
        if (msg.pos == undefined) {
            // if it's got no location we have nowhere to
            // display it
            continue;
        }
        devEnv.message(msg);
    }
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
    const grammar = PRE_GRAMMAR_PASSES.go(project, transEnv)
                                     .msgTo((_) => {});
    // check to see if any names didn't get resolved
    const [_, nameMsgs] = QUALIFY_NAMES.go(grammar, transEnv)
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
