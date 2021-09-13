import { 
    CounterStack, 
    Expr, 
    EPSILON,
    constructRepeat,
    constructSequence,
    constructAlternation,
    constructBinaryConcat,
    constructIntersection,
    constructStar,
    constructLiteral,
    constructDot,
    constructEmbed,
    constructRename,
    constructNegation,
    NULL,
    constructMemo,
    constructMatch,
    SymbolTable,
    constructDotStar,
    constructFilter,
    constructJoin,
    constructTokenizedLiteral,
} from "./exprs";

import { 
    RenamedTape, 
    Tape, 
    TapeCollection, 
    Token
} from "./tapes";

import { 
    Cell, 
    DummyCell, 
    flatten, 
    Gen, 
    listDifference, 
    listIntersection, 
    listUnique, 
    setDifference, 
    setIntersection, 
    StringDict 
} from "./util";

export { CounterStack, Expr };

export class GenOptions {
    public multichar: boolean = true;
    public random: boolean = false;
    public maxRecursion: number = 2; 
    public maxChars: number = 1000;
}

/**
 * Grammar components represent the linguistic grammar that the
 * programmer is expressing (in terms of sequences, alternations, joins and filters,
 * etc.), as opposed to its specific layout on the spreadsheet grids (the "tabular
 * syntax tree or TST), but also as opposed to the specific algebraic expressions
 * that our Brzozowski-style algorithm is juggling (which are even lower-level; a 
 * single "operation" in our grammar might even correspond to a dozen or so lower-level
 * ops.)
 * 
 * It's the main level at which we (the compiler) can ask, "Does this grammar 
 * make any sense?  Do the symbols actually refer to defined things?  Is the 
 * programmer doing things like defining filters that can't possibly have any output
 * because they refer to non-existant fields?"
 * 
 * Grammar components are responsible for the following operations:
 * 
 *   * qualifying and resolving symbol names (e.g., figuring out that
 *     a particular reference to VERB refers to, say, the VERB symbol in the
 *     IntransitiveVerbs namespace, and qualifying that reference so that it
 *     uniquely identifies that symbol (e.g. "IntransitiveVerb.VERB")
 * 
 *   * working out what tapes a particular component refers to.  This is 
 *     necessary for some complex operations (like "startswith embed:X"); 
 *     it's too early to infer tapes when the sheet is parsed (X might refer
 *     to a symbol that hasn't been parsed at all yet), but it still has to be
 *     done before expressions are generated because otherwise we don't 
 *     always know what expressions to generate.
 * 
 *   * sanity-checking and generating certain errors/warnings, like 
 *     whether a symbol X actually has a defined referent, whether a 
 *     filter refers to tapes that the component it's filtering doesn't, etc.
 * 
 *   * finally, generating the Brzozowski expression corresponding to each 
 *     component.
 */

export abstract class GrammarComponent {

    public expr: Expr | undefined = undefined;
    public tapes: string[] | undefined = undefined;

    constructor(
        public cell: Cell
    ) { }

    public message(msg: any): void {
        this.cell.message(msg);
    }

    public abstract getChildren(): GrammarComponent[];

    //public abstract constructExpr(symbols: SymbolTable): Expr;

    public determineConcatenability(opt: GenOptions): Set<string> {

        const stack = new CounterStack(2);
        const tapes = this.calculateTapes(stack);

        if (opt.multichar == false) {
            // if the multichar optimization isn't on, then all tapes are concatenable
            for (const tape of tapes) {
                this.setConcatenable(tape);
            }
            return new Set(tapes);
        }

        const concatenableTapes: Set<string> = new Set();

        // in the following loop of loops, we want to keep testing
        // until no tapes change their status (i.e. change from being
        // non-concat to concat).
        let dirty = true;
        while (dirty) {
            dirty = false;
            for (const tape of tapes) {
                if (concatenableTapes.has(tape)) {
                    continue;
                }

                if (this.tapeIsConcatenable(tape)) {
                    dirty = true;
                    concatenableTapes.add(tape);
                    this.setConcatenable(tape);
                }
            }
        }

        return concatenableTapes;
    }

    /**
     * Determines if, at any point in the grammar, it's possible to 
     * concatenate this tape with itself.
     */
    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        for (const child of this.getChildren()) {
            if (child.tapeIsConcatenable(tapeName, stack)) {
                return true;
            }
        }
        return false;
    }

    public setConcatenable(tapeName: string, stack: string[] = []): void {
        for (const child of this.getChildren()) {
            child.setConcatenable(tapeName, stack);
        }
    }

    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     * 
     * @param tapes A TapeCollection for holding found characters
     * @param stack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab 
     */
    public collectVocab(tapes: Tape, stack: string[] = []): void { 
        for (const child of this.getChildren()) {
            child.collectVocab(tapes, stack);
        }
    }

    public runUnitTests(opt: GenOptions): void {
        this.qualifyNames();
        this.calculateTapes(new CounterStack(2));
        this.determineConcatenability(opt);
        const allTapes = new TapeCollection();
        this.collectVocab(allTapes);
        this.constructExpr({});
        this.runUnitTestsAux(opt);
    }

    public runUnitTestsAux(opt: GenOptions): void {
        for (const child of this.getChildren()) {
            child.runUnitTestsAux(opt);
        }
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            const childTapes = this.getChildren().map(
                                s => s.calculateTapes(stack));
            this.tapes = listUnique(flatten(childTapes));
        }
        return this.tapes;
    }

    public qualifyNames(nsStack: NamespaceGrammar[] = []): string[] {
        return flatten(this.getChildren().map(c => c.qualifyNames(nsStack)));
    }

    public getAllTapes(): TapeCollection {
        const tapes = new TapeCollection();
        this.collectVocab(tapes, []);
        return tapes;
    }

    public abstract constructExpr(symbolTable: {[name: string]: Expr}): Expr;

    public getSymbol(name: string): GrammarComponent | undefined {
        if (name == "") {
            return this;
        }
        return undefined;
    }

    public getDefaultSymbol(): GrammarComponent {
        return this;
    }
    
    public allSymbols(): string[] {
        return [];
    }

    public *generate(
        symbolName: string = "",
        query: StringDict = {},
        opt: GenOptions
    ): Gen<StringDict> {

        this.qualifyNames();
        this.calculateTapes(new CounterStack(2));

        let targetComponent = this.getSymbol(symbolName);
        if (targetComponent == undefined) {
            throw new Error(`Missing symbol: ${symbolName}`);
        }
        const allTapes = new TapeCollection();

        this.determineConcatenability(opt);
        this.collectVocab(allTapes);
        this.constructExpr({});

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
        targetComponent.determineConcatenability(opt);
        targetComponent.collectVocab(allTapes); // in case there's more vocab
        const expr = targetComponent.constructExpr({});
        
        const tapes: Tape[] = [];
        for (const tapeName of tapePriority) {
            const actualTape = allTapes.matchTape(tapeName);
            if (actualTape == undefined) {
                throw new Error(`cannot find priority tape ${tapeName}`);
            }
            tapes.push(actualTape);
        }        
        //console.log(`expr = ${expr.id}`);
        yield* expr.generate(tapes, opt.random, opt.maxRecursion, opt.maxChars);
    }
}

abstract class AtomicGrammar extends GrammarComponent {

    public getChildren(): GrammarComponent[] { return []; }

}

export class EpsilonGrammar extends AtomicGrammar {

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = EPSILON;
        }
        return this.expr;
    }
}

export class NullGrammar extends AtomicGrammar {

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            return NULL;
        }
        return this.expr;
    }
}

export class LiteralGrammar extends AtomicGrammar {

    protected concatenable: boolean = false;
    protected tokens: string[] = [];

    constructor(
        cell: Cell,
        public tape: string,
        public text: string
    ) {
        super(cell);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        this.tokens = tapes.tokenize(this.tape, this.text, this.concatenable).map(([s,t]) => s);
    }
    
    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (tapeName == this.tape) {
            return this.concatenable;
        }
        return false;
    }

    public setConcatenable(tapeName: string, stack: string[] = []): void {
        if (tapeName == this.tape) {
            this.concatenable = true;
        }
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [this.tape];
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructTokenizedLiteral(this.tape, this.tokens);
        }
        return this.expr;
    }
}

export class DotGrammar extends AtomicGrammar {

    constructor(
        cell: Cell,
        public tape: string
    ) {
        super(cell);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes.tokenize(this.tape, "", true);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [this.tape];
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructDot(this.tape);
        }
        return this.expr;
    }
}

abstract class NAryGrammar extends GrammarComponent {

    constructor(
        cell: Cell,
        public children: GrammarComponent[]
    ) {
        super(cell);
    }
    
    public getChildren(): GrammarComponent[] { 
        return this.children; 
    }
}

export class SequenceGrammar extends NAryGrammar {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {        
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructSequence(...childExprs);
        }
        return this.expr;
    }

     public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (super.tapeIsConcatenable(tapeName, stack)) {
            return true;
        }

        // here we see if any tape is present in more than one child; if so,
        // the tape is concatenable
        let tapeSeenOnce = false;
        for (const child of this.getChildren()) {
            if (child.tapes == undefined) {
                throw new Error(`Trying to determine concatenability before calculating tapes`);
            }
            if (child.tapes.indexOf(tapeName) == -1) {
                continue;
            }
            if (tapeSeenOnce) {
                return true;
            }
            tapeSeenOnce = true;
        }
        return false;
    }

    public finalChild(): GrammarComponent {
        if (this.children.length == 0) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return new EpsilonGrammar(DUMMY_CELL);
        }
        return this.children[this.children.length-1];
    }

    public nonFinalChildren(): GrammarComponent[] {
        if (this.children.length <= 1) {
            // shouldn't be possible so long as client used constructX methods,
            // but just in case
            return [];
        }
        return this.children.slice(0, this.children.length-1);
    }
}

export class AlternationGrammar extends NAryGrammar {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructAlternation(...childExprs);
        } 
        return this.expr;
    }
}

abstract class BinaryGrammar extends GrammarComponent {

    constructor(
        cell: Cell,
        public child1: GrammarComponent,
        public child2: GrammarComponent
    ) {
        super(cell);
    }
    
    public getChildren(): GrammarComponent[] { 
        return [this.child1, this.child2];
    }
}

export class IntersectionGrammar extends BinaryGrammar {

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const left = this.child1.constructExpr(symbols);
            const right = this.child2.constructExpr(symbols);
            this.expr = constructIntersection(left, right);
        }
        return this.expr;
    }
}

/*
function fillOutWithDotStar(state: Expr, tapes: string[]) {
    for (const tape of tapes) {
        const dotStar = constructDotStar(tape);
        state = constructBinaryConcat(state, dotStar);
    } 
    return state;
} */

export class JoinGrammar extends BinaryGrammar {

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            const child1Tapes = this.child1.calculateTapes(stack);
            const child2Tapes = this.child2.calculateTapes(stack);
            const intersection = listIntersection(child1Tapes, child2Tapes);
            this.tapes = listUnique([...intersection, ...child1Tapes, ...child2Tapes]);
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            return constructJoin(this.child1.constructExpr(symbols), 
                                this.child2.constructExpr(symbols), 
                                    new Set(this.child1.tapes),
                                    new Set(this.child2.tapes));
        }
        return this.expr;
    }

}

export class FilterGrammar extends BinaryGrammar {

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            const child1Tapes = this.child1.calculateTapes(stack);
            const child2Tapes = this.child2.calculateTapes(stack);
            this.tapes = listUnique([...child2Tapes, ...child1Tapes]);
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child1.tapes == undefined || this.child2.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const expr1 = this.child1.constructExpr(symbols)
            const expr2 = this.constructFilter(symbols);
            const tapes = new Set(listIntersection(this.child1.tapes, this.child2.tapes));
            this.expr = constructFilter(expr1, expr2, tapes);   
            
        }
        return this.expr;
    }

    protected constructFilter(symbols: SymbolTable) {
        return this.child2.constructExpr(symbols);
    }
}

export class StartsWithGrammar extends FilterGrammar {
    
    
    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (this.tapes == undefined) {
            throw new Error("Attempting to determine concatenability before calculating tapes");
        };
        return this.tapes.indexOf(tapeName) != -1;
    }

    protected constructFilter(symbols: SymbolTable) {
        if (this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        let child2 = this.child2.constructExpr(symbols);
        for (const tape of this.child2.tapes) {
            const dot = constructDot(tape);
            const dotStar = constructStar(dot);
            child2 = constructBinaryConcat(child2, dotStar);
        }

        return child2;
    }

}

export class EndsWithGrammar extends FilterGrammar {

    
    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (this.tapes == undefined) {
            throw new Error("Attempting to determine concatenability before calculating tapes");
        };
        return this.tapes.indexOf(tapeName) != -1;
    }

    protected constructFilter(symbols: SymbolTable) {
        if (this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        let child2 = this.child2.constructExpr(symbols);
        for (const tape of this.child2.tapes) {
            const dot = constructDot(tape);
            const dotStar = constructStar(dot);
            child2 = constructBinaryConcat(dotStar, child2);
        }

        return child2;
    }
}


export class ContainsGrammar extends FilterGrammar {
    
    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (this.tapes == undefined) {
            throw new Error("Attempting to determine concatenability before calculating tapes");
        };
        return this.tapes.indexOf(tapeName) != -1;
    }

    protected constructFilter(symbols: SymbolTable) {
        if (this.child2.tapes == undefined) {
            throw new Error("Getting Brz expression with undefined tapes");
        }

        let child2 = this.child2.constructExpr(symbols);
        for (const tape of this.child2.tapes) {
            const dot = constructDot(tape);
            const dotStar = constructStar(dot);
            child2 = constructSequence(dotStar, child2, dotStar);
        }

        return child2;
    }

}

export class UnaryGrammar extends GrammarComponent {

    constructor(
        cell: Cell,
        public child: GrammarComponent
    ) {
        super(cell);
    }

    public getChildren(): GrammarComponent[] { 
        return [this.child]; 
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return this.child.constructExpr(symbols);
    }
}

export class RenameGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: GrammarComponent,
        public fromTape: string,
        public toTape: string
    ) {
        super(cell, child);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }

    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (tapeName == this.fromTape) {
            return false;
        }
        if (tapeName == this.toTape) {
            tapeName = this.fromTape;
        }
        return this.child.tapeIsConcatenable(tapeName, stack);
    }

    public setConcatenable(tapeName: string, stack: string[] = []): void {
        if (tapeName == this.fromTape) {
            return;
        }
        if (tapeName == this.toTape) {
            tapeName = this.fromTape;
        }
        this.child.setConcatenable(tapeName, stack);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.fromTape) {
                    this.tapes.push(this.toTape);
                } else {
                    this.tapes.push(tapeName);
                }
            }
            this.tapes = listUnique(this.tapes);
        }
        return this.tapes;
    }
    
    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRename(childExpr, this.fromTape, this.toTape);
        }
        return this.expr;
    }
}

export class RepeatGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: GrammarComponent,
        public minReps: number = 0,
        public maxReps: number = Infinity
    ) {
        super(cell, child);
    }

     public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (super.tapeIsConcatenable(tapeName, stack)) {
            return true;
        }
        
        // if this repetition is nontrivial (allows more than one rep) and 
        // references this tape, then the tape is concatenable.
        if (this.tapes == undefined) {
            throw new Error("Attempting to determine concatenability before calculating tapes");
        }
        return this.maxReps > 1 && this.tapes.indexOf(tapeName) != -1;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRepeat(childExpr, this.minReps, this.maxReps);
        }
        return this.expr;
    }
}

export class NegationGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: GrammarComponent,
        public maxReps: number = Infinity
    ) {
        super(cell, child);
    }

    /**
     * As implemented, Negation treats its tapes as non-atomic, so any tape
     * going through negation ends up being concatenable.
     */
    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (this.tapes == undefined) {
            throw new Error("Attempting to determine concatenability before calculating tapes");
        };
        return this.tapes.indexOf(tapeName) != -1;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.child.tapes == undefined) {
                throw new Error("Getting Brz expression with undefined tapes");
            }

            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructNegation(childExpr, new Set(this.child.tapes), this.maxReps);
        }
        return this.expr;
    }
}

let HIDE_INDEX = 0; 
export class HideGrammar extends UnaryGrammar {

    public toTape: string;

    constructor(
        cell: Cell,
        child: GrammarComponent,
        public tape: string,
        name: string = ""
    ) {
        super(cell, child);
        if (name == "") {
            name = `HIDDEN${HIDE_INDEX}`;
            HIDE_INDEX++;
        }
        this.toTape = `__${name}_${tape}`;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.tape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.tape) {
                    this.tapes.push(this.toTape);
                } else {
                    this.tapes.push(tapeName);
                }
            }
        }
        return this.tapes;
    }
    
    public constructExpr(symbols: SymbolTable): Expr {

        if (this.expr == undefined) {
            if (this.child.tapes == undefined) {
                throw new Error("Trying to construct an expression before tapes are calculated");
            }

            if (this.child.tapes.indexOf(this.tape) == -1) {   
                this.message({
                    type: "error", 
                    shortMsg: "Hiding missing tape",
                    longMsg: `The grammar to the left does not contain the tape ${this.tape}. " +
                        " Available tapes: [${[...this.child.tapes]}]`
                });
            }

            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRename(childExpr, this.tape, this.toTape);
        }
        return this.expr;
    }
}

export class MatchGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: GrammarComponent,
        public relevantTapes: Set<string>
    ) {
        super(cell, child);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructMatch(childExpr, this.relevantTapes);
        }
        return this.expr;
    }
}

export class NamespaceGrammar extends GrammarComponent {

    constructor(
        cell: Cell,
        public name: string
    ) {
        super(cell);
    }

    public qualifiedNames: Map<string, string> = new Map();
    public symbols: Map<string, GrammarComponent> = new Map();
    public default: GrammarComponent = new EpsilonGrammar(DUMMY_CELL);

    public addSymbol(symbolName: string, component: GrammarComponent): void {

        if (symbolName.indexOf(".") != -1) {
            throw new Error(`Symbol names cannot have . in them`);
        }

        const symbol = this.resolveNameLocal(symbolName);
        if (symbol != undefined) {
            throw new Error(`Symbol ${symbolName} already defined.`);
        }
        this.symbols.set(symbolName, component);
    }

    public getDefaultSymbol(): GrammarComponent {
        if (this.symbols.size == 0) {
            return new EpsilonGrammar(this.cell);
        }

        return [...this.symbols.values()][this.symbols.size-1].getDefaultSymbol();
    }

    public getSymbol(symbolName: string): GrammarComponent | undefined {

        if (symbolName == "") {
            return this.getDefaultSymbol();
        }

        const pieces = symbolName.split(".");
        const child = this.symbols.get(pieces[0]);
        if (child == undefined) {
            return undefined;
        }
        const remnant = pieces.slice(1).join(".");
        return child.getSymbol(remnant);
    }

    public allSymbols(): string[] {
        const results: string[] = [];
        for (const [name, referent] of this.symbols.entries()) {
            results.push(name);
            for (const subname of referent.allSymbols())
            results.push(`${name}.${subname}`);
        }
        return results;
    }

    public getChildren(): GrammarComponent[] { 
        const results: GrammarComponent[] = [];
        for (const referent of this.symbols.values()) {
            if (results.indexOf(referent) == -1) {
                results.push(referent);
            }
        }
        return results;
    }

    public calculateQualifiedName(name: string, nsStack: NamespaceGrammar[]): string {
        const namePrefixes = nsStack.map(n => n.name).filter(s => s.length > 0);
        return [...namePrefixes, name].join(".");
    }
    
    public qualifyNames(nsStack: NamespaceGrammar[] = []): string[] {
        let unqualifiedNames: string[] = [];
        const newStack = [ ...nsStack, this ];
        for (const [symbolName, referent] of this.symbols) {
            const newName = this.calculateQualifiedName(symbolName, newStack);
            this.qualifiedNames.set(symbolName, newName);
            unqualifiedNames = unqualifiedNames.concat(referent.qualifyNames(newStack));
        }
        return unqualifiedNames;
    }

    /**
     * Looks up an unqualified name in this namespace's symbol table,
     * case-insensitive.
     */
    public resolveNameLocal(name: string): [string, GrammarComponent] | undefined {
        for (const symbolName of this.symbols.keys()) {
            if (name.toLowerCase() == symbolName.toLowerCase()) {
                const referent = this.symbols.get(symbolName);
                if (referent == undefined) { return undefined; } // can't happen, just for linting
                return [symbolName, referent];
            }
        }
        return undefined;
    }

    public resolveName(
        unqualifiedName: string, 
        nsStack: NamespaceGrammar[]
    ): [string, GrammarComponent] | undefined {

        // split into (potentially) namespace prefix(es) and symbol name
        const namePieces = unqualifiedName.split(".");

        // it's got no namespace prefix, it's a symbol name
        if (namePieces.length == 1) {

            const localResult = this.resolveNameLocal(unqualifiedName);

            if (localResult == undefined) {
                // it's not a symbol assigned in this namespace
                return undefined;
            }
            
            // it IS a symbol defined in this namespace,
            // so get the fully-qualified name.  we can't just grab this
            // from this.qualifiedNames because that may not have been
            // filled out yet
            const [localName, referent] = localResult;
            const newName = this.calculateQualifiedName(localName, nsStack);
            return [newName, referent.getDefaultSymbol()];
        }

        // it's got a namespace prefix
        const child = this.resolveNameLocal(namePieces[0]);
        if (child == undefined) {
            // but it's not a child of this namespace
            return undefined;
        }

        const [localName, referent] = child;
        if (!(referent instanceof NamespaceGrammar)) {
            // if symbol X isn't a namespace, "X.Y" can't refer to anything real
            return undefined;
        }

        // this namespace has a child of the correct name
        const remnant = namePieces.slice(1).join(".");
        const newStack = [ ...nsStack, referent ];
        return referent.resolveName(remnant, newStack);  // try the child
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
            for (const [name, referent] of this.symbols) {
                const tapes = referent.calculateTapes(stack);
                this.tapes.push(...tapes);
            }
            this.tapes = listUnique(this.tapes);
        }
        return this.tapes;
    }

    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        for (const child of this.symbols.values()) {
            if (child.tapeIsConcatenable(tapeName, stack)) {
                return true;
            }
        }
        return false;
    }
    
    public setConcatenable(tapeName: string, stack: string[] = []): void {
        for (const child of this.symbols.values()) {
            child.setConcatenable(tapeName, stack);
        }
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        for (const child of this.symbols.values()) {
            child.collectVocab(tapes, stack);
        }
    }

    public constructExpr(symbols: {[name: string]: Expr}): Expr {

        if (this.expr == undefined) {

            this.expr = EPSILON; // just in case there are no symbols to iterate through
            for (const [name, referent] of this.symbols) {
                const qualifiedName = this.qualifiedNames.get(name);
                if (qualifiedName == undefined) {
                    throw new Error("Getting Brz expressions without having qualified names yet");
                }
                if (referent.tapes == undefined) {
                    throw new Error("Getting Brz expressions without having calculated tapes");
                }

                this.expr = referent.constructExpr(symbols);            
                symbols[qualifiedName] = this.expr;
                
                // memoize every expr
                //this.expr = constructMemo(this.expr);
            }
        }

        return this.expr;
    }
}

export class EmbedGrammar extends AtomicGrammar {

    public qualifiedName: string;
    public referent: GrammarComponent | undefined = undefined;

    constructor(
        cell: Cell,
        public name: string
    ) {
        super(cell);
        this.qualifiedName = name;
    }

    public qualifyNames(nsStack: NamespaceGrammar[] = []): string[] {
        let resolution: [string, GrammarComponent] | undefined = undefined;
        for (let i = nsStack.length-1; i >=0; i--) {
            // we go down the stack asking each to resolve it
            const subStack = nsStack.slice(0, i+1);
            resolution = nsStack[i].resolveName(this.name, subStack);
            if (resolution != undefined) {              
                const [qualifiedName, referent] = resolution;
                this.qualifiedName = qualifiedName;
                this.referent = referent;
                break;
            }
        }

        if (resolution == undefined) {
            return [ this.name ];
        }
        return [];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            if (stack.exceedsMax(this.qualifiedName) || this.referent == undefined) {
                this.tapes = [];
            } else {
                const newStack = stack.add(this.qualifiedName);
                this.tapes = this.referent.calculateTapes(newStack);
            }
        }
        return this.tapes;
    }

    public tapeIsConcatenable(tapeName: string, stack: string[] = []): boolean {
        if (this.referent == undefined) {
            return false; // failed to find the referent, so it's epsilon
        }
        if (stack.indexOf(this.qualifiedName) != -1) {
            return false;
        }
        const newStack = [...stack, this.qualifiedName];
        return this.referent.tapeIsConcatenable(tapeName, newStack);
    }

    public setConcatenable(tapeName: string, stack: string[] = []): void {
        if (this.referent == undefined) {
            return; // failed to find the referent, so it's epsilon
        }
        if (stack.indexOf(this.qualifiedName) != -1) {
            return;
        }
        const newStack = [...stack, this.qualifiedName];
        this.referent.setConcatenable(tapeName, newStack);
    }
    
    public collectVocab(tapes: Tape, stack: string[] = []): void {
        if (this.referent == undefined) {
            return; // failed to find the referent, so it's epsilon
        }
        if (stack.indexOf(this.qualifiedName) != -1) {
            return;
        }
        const newStack = [...stack, this.qualifiedName];
        this.referent.collectVocab(tapes, newStack);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            if (this.referent == undefined) {
                this.message({
                    type: "error", 
                    shortMsg: "Unknown symbol", 
                    longMsg: `Undefined symbol: ${this.name}`
                });
                return EPSILON;
            }
            this.expr = constructEmbed(this.qualifiedName, symbols);
        }
        return this.expr;
    }
}

export class UnitTestGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: GrammarComponent,
        protected tests: GrammarComponent[]
    ) {
        super(cell, child)
    }

    public runUnitTestsAux(opt: GenOptions): void {
        super.runUnitTestsAux(opt);

        for (const test of this.tests) {
            const testingState = new FilterGrammar(test.cell, this.child, test);
            const results = [...testingState.generate("", {}, opt)];
            this.markResults(test, results);
        }
    }

    public markResults(test: GrammarComponent, results: StringDict[]): void {
        if (results.length == 0) {
            test.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above has no outputs compatible with this row."
            });
        } else {
            test.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above has outputs compatible with this row."
            });
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = this.child.constructExpr(symbols);
        }
        return this.expr;
    }
}


export class NegativeUnitTestGrammar extends UnitTestGrammar {

    public markResults(test: GrammarComponent, results: StringDict[]): void {
        if (results.length > 0) {
            test.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above incorrectly has outputs compatible with this row."
            });
        } else {
            test.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above correctly has no outputs compatible with this row."
            });
        }
    } 

}

const DUMMY_CELL = new DummyCell();

export function Seq(...children: GrammarComponent[]): SequenceGrammar {
    return new SequenceGrammar(DUMMY_CELL, children);
}

export function Uni(...children: GrammarComponent[]): AlternationGrammar {
    return new AlternationGrammar(DUMMY_CELL, children);
}

export function Maybe(child: GrammarComponent): AlternationGrammar {
    return Uni(child, Epsilon());
}

export function Lit(tape: string, text: string): LiteralGrammar {
    return new LiteralGrammar(DUMMY_CELL, tape, text);
}

export function Any(tape: string): DotGrammar {
    return new DotGrammar(DUMMY_CELL, tape);
}

export function Intersect(child1: GrammarComponent, child2: GrammarComponent): IntersectionGrammar {
    return new IntersectionGrammar(DUMMY_CELL, child1, child2);
}

export function Filter(child1: GrammarComponent, child2: GrammarComponent): FilterGrammar {
    return new FilterGrammar(DUMMY_CELL, child1, child2);
}

export function Join(child1: GrammarComponent, child2: GrammarComponent): JoinGrammar {
    return new JoinGrammar(DUMMY_CELL, child1, child2);
}

export function StartsWith(child1: GrammarComponent, child2: GrammarComponent): StartsWithGrammar {
    return new StartsWithGrammar(DUMMY_CELL, child1, child2);
}

export function EndsWith(child1: GrammarComponent, child2: GrammarComponent): EndsWithGrammar {
    return new EndsWithGrammar(DUMMY_CELL, child1, child2);
}

export function Contains(child1: GrammarComponent, child2: GrammarComponent): ContainsGrammar {
    return new ContainsGrammar(DUMMY_CELL, child1, child2);
}

export function Rep(
    child: GrammarComponent, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    return new RepeatGrammar(DUMMY_CELL, child, minReps, maxReps);
}

export function Epsilon(): EpsilonGrammar {
    return new EpsilonGrammar(DUMMY_CELL);
}

export function Null(): NullGrammar {
    return new NullGrammar(DUMMY_CELL);
}

export function Embed(name: string): EmbedGrammar {
    return new EmbedGrammar(DUMMY_CELL, name);
}

export function Match(child: GrammarComponent, ...tapes: string[]): MatchGrammar {
    return new MatchGrammar(DUMMY_CELL, child, new Set(tapes));
}

export function Dot(...tapes: string[]): SequenceGrammar {
    return Seq(...tapes.map(t => Any(t)));
}

export function MatchDot(...tapes: string[]): MatchGrammar {
    return Match(Dot(...tapes), ...tapes);
}

export function MatchDotRep(minReps: number = 0, maxReps: number = Infinity, ...tapes: string[]): MatchGrammar {
    return Match(Rep(Dot(...tapes), minReps, maxReps), ...tapes)
}

export function MatchDotRep2(minReps: number = 0, maxReps: number = Infinity, ...tapes: string[]): MatchGrammar {
    return Match(Seq(...tapes.map((t: string) => Rep(Any(t), minReps, maxReps))), ...tapes);
}

export function MatchDotStar(...tapes: string[]): MatchGrammar {
    return MatchDotRep(0, Infinity, ...tapes)
}

export function MatchDotStar2(...tapes: string[]): MatchGrammar {
    return MatchDotRep2(0, Infinity, ...tapes)
}

export function MatchFrom(firstTape: string, secondTape: string, state: GrammarComponent): MatchGrammar {
    return Match(Seq(state, Rename(state, firstTape, secondTape)),
                 firstTape, secondTape);
}

export function Rename(child: GrammarComponent, fromTape: string, toTape: string): RenameGrammar {
    return new RenameGrammar(DUMMY_CELL, child, fromTape, toTape);
}

export function Not(child: GrammarComponent, maxChars:number=Infinity): NegationGrammar {
    return new NegationGrammar(DUMMY_CELL, child, maxChars);
}

export function Ns(
    name: string, 
    symbols: {[name: string]: GrammarComponent} = {}
): NamespaceGrammar {
    const result = new NamespaceGrammar(DUMMY_CELL, name);
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}

export function Hide(child: GrammarComponent, tape: string, name: string = ""): HideGrammar {
    return new HideGrammar(DUMMY_CELL, child, tape, name);
}

export function Vocab(tape: string, text: string): GrammarComponent {
    return Rep(Lit(tape, text), 0, 0)
}

/**
  * Replace implements general phonological replacement rules.
  * 
  * fromTapeName: name of the input (target) tape
  * toTapeName: name of the output (change) tape
  * fromState: input (target) State (on fromTape)
  * toState: output (change) State (on toTape)
  * preContext: context to match before the target fromState (on fromTape)
  * postContext: context to match after the target fromState (on fromTape)
  * beginsWith: set to True to match at the start of fromTape
  * endsWith: set to True to match at the end of fromTape
  * minReps: minimum number of times the replace rule is applied; normally 0.
  * maxReps: maximum number of times the replace rule is applied
  * maxExtraChars: a character limiter for extra characters at start/end
  * repetitionPatch: if True, expand replacement repetition using Uni
  *     repetitionPatch is a workaround for a bug resulting in a bad interaction
  *         between the old ConcatState and RepetitionState.
  *     Note: repetitionPatch may not be true if maxReps > 100
*/
export function Replace(
    fromTapeName: string, toTapeName: string,
    fromState: GrammarComponent, toState: GrammarComponent,
    preContext: GrammarComponent | undefined, postContext: GrammarComponent | undefined,
    beginsWith: Boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    repetitionPatch: Boolean = false
): GrammarComponent {
    if (beginsWith || endsWith) {
        maxReps = Math.max(1, maxReps);
        minReps = Math.min(minReps, maxReps);
    }

    var states: GrammarComponent[] = [];
    if (preContext != undefined)
        states.push(MatchFrom(fromTapeName, toTapeName, preContext));
    states.push(fromState, toState);
    if (postContext != undefined)
        states.push(MatchFrom(fromTapeName, toTapeName, postContext));

    // Determine if the vocabulary for fromTape is a subset of the vocabulary
    // of toTape, in which case toTape could match the target replacement pattern.
    // sameVocab is used to determine what matchAnythingElse should match, but
    // is not needed if replacing at the start or end of text.
    
    var sameVocab: boolean = false;
    var replaceState: GrammarComponent = Seq(...states);

    const tapeCollection: TapeCollection = replaceState.getAllTapes();
    const fromTape: Tape | undefined = tapeCollection.matchTape(fromTapeName);
    if (fromTape != undefined) {
        const fromVocab: string = fromTape.fromToken(fromTapeName, fromTape.any()).join('');
        sameVocab = tapeCollection.inVocab(toTapeName, fromVocab)
    }

    function matchAnythingElse(replaceNone: boolean = false): GrammarComponent {
        const dotStar: GrammarComponent = Rep(Any(fromTapeName), 0, maxExtraChars);
        // 1. If the fromTape vocab for the replacement operation contains some
        //    characters that are not in the corresponding toTape vocab, then
        //    extra text matched before and after the replacement cannot possibly
        //    contain the from replacement pattern. Furthermore, we don't want to
        //    add those characters to the toTape vocab, so instead we match .*
        // 2. If we are matching an instance at the start of text (beginsWith),
        //    or end of text (endsWith) then matchAnythingElse needs to match any
        //    other instances of the replacement pattern, so we need to match .*
        if( !sameVocab || (beginsWith && !replaceNone) || (endsWith && !replaceNone)) {
            return MatchFrom(fromTapeName, toTapeName, dotStar)
        }
        var fromInstance: GrammarComponent[] = [];
        if (preContext != undefined)
            fromInstance.push(preContext);
        fromInstance.push(fromState);
        if (postContext != undefined)
            fromInstance.push(postContext);
        var notState: GrammarComponent;
        if (beginsWith && replaceNone)
            notState = Not(Seq(...fromInstance, dotStar), maxExtraChars);
        else if (endsWith && replaceNone)
            notState = Not(Seq(dotStar, ...fromInstance), maxExtraChars);
        else
            notState = Not(Seq(dotStar, ...fromInstance, dotStar), maxExtraChars);
        return MatchFrom(fromTapeName, toTapeName, notState)
    }

    if (! endsWith)
        states.push(matchAnythingElse());

    const replaceOne: GrammarComponent = Seq(...states);
    var replaceMultiple: GrammarComponent = Rep(replaceOne, minReps, maxReps);
    
    /*if (repetitionPatch && maxReps <= 100) {
        var multiples: GrammarComponent[] = [];
        for (let n=Math.max(1, minReps); n < maxReps+1; n++) {
            multiples.push(Seq(...Array.from({length: n}).map(x => replaceOne)));
        }
        replaceMultiple = Uni(...multiples);
    } */

    if (beginsWith)
        replaceState = replaceOne;
    else if (endsWith)
        replaceState = Seq(matchAnythingElse(), replaceOne);
    else 
        replaceState = Seq(matchAnythingElse(), replaceMultiple);
        
    if (minReps > 0)
        return replaceState
    // ??? NOTE: matchAnythingElse(true) with beginsWith can result in an
    // "infinite" loop when generate is called (especially if maxChars is
    // high) because the match on notState is not respecting maxExtraChars
    // for some reason.
    return(Uni(matchAnythingElse(true), replaceState));
}
