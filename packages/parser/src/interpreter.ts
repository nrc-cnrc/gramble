import { 
    CounterStack, CountGrammar, EqualsGrammar, Grammar, 
    GrammarTransform, 
    LiteralGrammar, NsGrammar, PriorityGrammar, SequenceGrammar, UnitTestGrammar 
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
import { SheetProject } from "./sheets";
import { parseHeaderCell } from "./headers";
import { TapeNamespace, VocabMap } from "./tapes";
import { Expr, SymbolTable } from "./exprs";
import { SimpleDevEnvironment } from "./devEnv";
import { NameQualifierTransform } from "./transforms/nameQualifier";
import { SameTapeReplaceTransform } from "./transforms/sameTapeReplace";
import { RenameFixTransform } from "./transforms/renameFix";
import { FilterTransform } from "./transforms/filter";
import { FlattenTransform } from "./transforms/flatten";
import { generate } from "./generator";
import { RuleReplaceTransform2 } from "./transforms/ruleReplace2";
import { TstComponent } from "./tsts";
import { UnitTestTransform } from "./transforms/unitTests";
import { Msgs } from "./msgs";
import { ALL_GRAMMAR_TRANSFORMS, ALL_TST_TRANSFORMS } from "./transforms/allTransforms";
import { TransEnv } from "./transforms";

/**
 * An interpreter object is responsible for applying the transformations in between sheets
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
    public sheetProject: SheetProject | undefined = undefined;

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
        // This simplifies the API and some of the transformations that follow; rather 
        // than every part having to check whether something is a namespace or not,
        // we wrap non-namespaces in a trivial namespace.
        if (g instanceof NsGrammar) {
            this.grammar = g;
        } else {
            this.grammar = new NsGrammar();
            this.grammar.addSymbol("", g);
        }

        const timeVerbose = (verbose & VERBOSE_TIME) != 0;

        // Next, we perform a variety of grammar-to-grammar transformations in order
        // to get the grammar into an executable state: symbol references fully-qualified,
        // semantically impossible tape structures are massaged into well-formed ones, some 
        // scope problems adjusted, etc.
        
        const env = new TransEnv();
        env.verbose = verbose;
        const [newGrammar, msgs] = this.grammar.msg() // lift to result
                     .bind(g => ALL_GRAMMAR_TRANSFORMS.transformAndLog(g, env))
                     .destructure();
        this.grammar = newGrammar as NsGrammar;
        sendMessages(devEnv, msgs);

        // Next we collect the vocabulary on all tapes
        timeIt(() => {
            // recalculate tapes
            this.grammar.calculateTapes(new CounterStack(2));
            // collect vocabulary
            this.tapeNS = new TapeNamespace();
            this.grammar.collectAllVocab(this.vocab, this.tapeNS);

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
        const sheetProject = new SheetProject(devEnv, mainSheetName);
        let elapsedTime = msToTime(Date.now() - startTime);
        logTime(verbose, `Sheets loaded; ${elapsedTime}`);
        
        startTime = Date.now();
        const transEnv = new TransEnv();
        transEnv.verbose = verbose;
        const tst: TstComponent = sheetProject.toTST()
                                              .handleMsgs(m => devEnv.message(m));
        
        const tstResult = ALL_TST_TRANSFORMS.transformAndLog(tst, transEnv)
                                            .handleMsgs(m => devEnv.message(m));
        const grammar = tstResult.toGrammar(transEnv)
                                 .handleMsgs(m => devEnv.message(m));
        elapsedTime = msToTime(Date.now() - startTime);
        logTime(verbose, `Converted to grammar; ${elapsedTime}`);

        const result = new Interpreter(devEnv, grammar, verbose);
        result.sheetProject = sheetProject;
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
        if (this.sheetProject == undefined) {
            throw new Error('Cannot create tabular source for this project, ' + 
                'because it did not come from source in the first place.');
        }
        return this.sheetProject.convertToSingleSheet();
    }
    
    public prepareExpr(
        symbolName: string = "",
        query: StringDict = {},
        opt: GenOptions,
        tapePriority: string[] = []
    ): Expr {

        if (tapePriority.length == 0) {
            tapePriority = this.grammar.calculateTapes(new CounterStack(2));
        }
        
        let expr = this.grammar.constructExpr(this.symbolTable);

        let targetGrammar = this.grammar.getSymbol(symbolName);
        if (targetGrammar == undefined) {
            const allSymbols = this.grammar.allSymbols();
            throw new Error(`Missing symbol: ${symbolName}; choices are [${allSymbols}]`);
        }

        tapePriority = targetGrammar.calculateTapes(new CounterStack(2));

        if (Object.keys(query).length > 0) {
            const queryLiterals = Object.entries(query).map(([key, value]) => {
                key = key.normalize("NFD"); 
                value = value.normalize("NFD");
                return new LiteralGrammar(key, value);
            });
            const querySeq = new SequenceGrammar(queryLiterals);
            targetGrammar = new EqualsGrammar(targetGrammar, querySeq);
            tapePriority = targetGrammar.calculateTapes(new CounterStack(2));
            
            // we have to collect any new vocab, but only from the new material
            targetGrammar.collectAllVocab(this.vocab, this.tapeNS);
            // we still have to copy though, in case the query added new vocab
            // to something that's eventually a "from" tape of a replace
            //targetGrammar.copyVocab(this.tapeNS, new Set());
        
        }

        const potentiallyInfinite = targetGrammar.potentiallyInfinite(new CounterStack(2));
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

        expr = targetGrammar.constructExpr(this.symbolTable);

        return expr;    
    }

    public runUnitTests(): void {
        this.grammar.constructExpr(this.symbolTable);  // fill the symbol table if it isn't already
        const env = new TransEnv();
        const t = new UnitTestTransform(this.grammar, this.vocab, this.tapeNS, this.symbolTable);
        const [_, msgs] = t.transform(env).destructure(); // results.item isn't important
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