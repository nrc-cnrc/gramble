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
    constructLiteral,
    constructMatchFrom,
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
    public concatenableTapes: Set<string> = new Set(); 

    constructor(
        public cell: Cell
    ) { }

    public message(msg: any): void {
        this.cell.message(msg);
    }

    public abstract acceptTransformation(t: GrammarTransformation): GrammarComponent;
    
    public abstract getChildren(): GrammarComponent[];

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

    /**
     * When necessary, copies existing characters from other tapes into tapes that 
     * will need them.
     */
     public copyVocab(tapes: Tape, stack: string[] = []): void { 
        for (const child of this.getChildren()) {
            child.copyVocab(tapes, stack);
        }
    }

    public runChecks(): void {
        this.qualifyNames();
        this.calculateTapes(new CounterStack(2));
        this.runChecksAux();
    }

    public runChecksAux(): void {
        for (const child of this.getChildren()) {
            child.runChecksAux();
        }
    }

    public runUnitTests(opt: GenOptions): void {
        this.qualifyNames();
        const tapes = this.calculateTapes(new CounterStack(2));
        const allTapes = new TapeCollection();
        this.collectVocab(allTapes);
        this.copyVocab(allTapes);
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

        //console.log(`compiling`);
        this.qualifyNames();
        this.calculateTapes(new CounterStack(2));

        const transformation = new GrammarTransformation();
        this.acceptTransformation(transformation);
        this.calculateTapes(new CounterStack(2));

        let targetComponent = this.getSymbol(symbolName);
        if (targetComponent == undefined) {
            throw new Error(`Missing symbol: ${symbolName}`);
        }
        
        const allTapes = new TapeCollection();
        this.collectVocab(allTapes);
        this.copyVocab(allTapes);
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
        targetComponent.collectVocab(allTapes); // in case there's more vocab
        targetComponent.copyVocab(allTapes);
        const expr = targetComponent.constructExpr({});
        
        const prioritizedTapes: Tape[] = [];
        for (const tapeName of tapePriority) {
            const actualTape = allTapes.matchTape(tapeName);
            if (actualTape == undefined) {
                throw new Error(`cannot find priority tape ${tapeName}`);
            }
            prioritizedTapes.push(actualTape);
        }        
        //console.log(`expr = ${expr.id}`);
        yield* expr.generate(prioritizedTapes, opt.random, opt.maxRecursion, opt.maxChars);
    }
}

abstract class AtomicGrammar extends GrammarComponent {

    public getChildren(): GrammarComponent[] { return []; }

}

export class EpsilonGrammar extends AtomicGrammar {

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformEpsilon(this);
    }

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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformNull(this);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            return this.expr = NULL;
        }
        return this.expr;
    }
}

export class LiteralGrammar extends AtomicGrammar {

    protected tokens: string[] = [];
    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformLiteral(this);
    }

    constructor(
        cell: Cell,
        public tape: string,
        public text: string
    ) {
        super(cell);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        this.tokens = tapes.tokenize(this.tape, this.text).map(([s,t]) => s);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [this.tape];
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructLiteral(this.tape, this.tokens);
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
    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformDot(this);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes.tokenize(this.tape, "");
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
    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformSequence(this);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {        
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructSequence(...childExprs);
        }
        return this.expr;
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformAlternation(this);
    }

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
    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformIntersection(this);
    }

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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformJoin(this);
    }

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

            this.expr = constructJoin(this.child1.constructExpr(symbols), 
                                this.child2.constructExpr(symbols), 
                                    new Set(this.child1.tapes),
                                    new Set(this.child2.tapes));
        }
        return this.expr;
    }

}

export class FilterGrammar extends BinaryGrammar {

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformFilter(this);
    }

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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformStartsWith(this);
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformEndsWith(this);
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformContains(this);
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformUnary(this);
    }

    public getChildren(): GrammarComponent[] { 
        return [this.child]; 
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = this.child.constructExpr(symbols);
        }
        return this.expr;
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
    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformRename(this);
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.collectVocab(tapes, stack);
    }

    public copyVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.fromTape, this.toTape);
        this.child.copyVocab(tapes, stack);
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

    public runChecksAux(): void {
        
        super.runChecksAux();

        if (this.child.tapes == undefined) {
            throw new Error("Trying to run checks before tapes are calculated");
        }

        if (this.child.tapes.indexOf(this.fromTape) == -1) {   
            this.message({
                type: "error", 
                shortMsg: "Renaming missing tape",
                longMsg: `The grammar to the left does not contain the tape ${this.fromTape}. ` +
                    ` Available tapes: [${[...this.child.tapes]}]`
            });
        }

        if (this.fromTape != this.toTape && this.child.tapes.indexOf(this.toTape) != -1) {   
            this.message({
                type: "error", 
                shortMsg: "Destination tape already exists",
                longMsg: `The grammar to the left already contains the tape ${this.fromTape}. `
            });
        }
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
    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformRepeat(this);
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformNegation(this);
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
        public name: string = ""
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
    
    public copyVocab(tapes: Tape, stack: string[] = []): void {
        tapes = new RenamedTape(tapes, this.tape, this.toTape);
        this.child.copyVocab(tapes, stack);
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
    
    public runChecksAux(): void {
        
        super.runChecksAux();

        if (this.child.tapes == undefined) {
            throw new Error("Trying to run checks before tapes are calculated");
        }

        if (this.child.tapes.indexOf(this.tape) == -1) {   
            this.message({
                type: "error", 
                shortMsg: "Hiding missing tape",
                longMsg: `The grammar to the left does not contain the tape ${this.tape}. ` +
                    ` Available tapes: [${[...this.child.tapes]}]`
            });
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {

        if (this.expr == undefined) {
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformNamespace(this);
    }

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

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        for (const child of this.symbols.values()) {
            child.collectVocab(tapes, stack);
        }
    }

    public copyVocab(tapes: Tape, stack: string[] = []): void {
        for (const child of this.symbols.values()) {
            child.copyVocab(tapes, stack);
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
                //this.expr = constructMemo(this.expr, 10);
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

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformEmbed(this);
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
    
    public copyVocab(tapes: Tape, stack: string[] = []): void {
        if (this.referent == undefined) {
            return; // failed to find the referent, so it's epsilon
        }
        if (stack.indexOf(this.qualifiedName) != -1) {
            return;
        }
        const newStack = [...stack, this.qualifiedName];
        this.referent.copyVocab(tapes, newStack);
    }

    public runChecksAux(): void {
        if (this.referent == undefined) {
            this.message({
                type: "error", 
                shortMsg: "Unknown symbol", 
                longMsg: `Undefined symbol: ${this.name}`
            });
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = EPSILON;
            if (this.referent != undefined) {
                this.expr = constructEmbed(this.qualifiedName, symbols);
            }
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

export function MatchFrom(state:GrammarComponent, firstTape: string, ...otherTapes: string[]): MatchGrammar {
    // Construct a Match for multiple tapes given a grammar for the first tape. 
    return Match(Seq(state, ...otherTapes.map((t: string) => Rename(state, firstTape, t))),
                 firstTape, ...otherTapes);
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
  * NOTE: The defaults for this convenience function differ from those 
  * in the constructor of ReplaceGrammar.  These are the defaults appropriate
  * for testing, whereas the defaults in ReplaceGrammar are appropriate for
  * the purposes of converting tabular syntax into grammars.
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
  * vocabBypass: do we copy the vocab from the "from" tape to the "to" tape?
*/
export function Replace(
    fromState: GrammarComponent, toState: GrammarComponent,
    preContext: GrammarComponent = Epsilon(), postContext: GrammarComponent = Epsilon(),
    beginsWith: Boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    vocabBypass: boolean = false
): GrammarComponent {
    return new ReplaceGrammar(DUMMY_CELL, fromState, toState, 
        preContext, postContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, vocabBypass);
}


/**
 * JoinReplace is a special kind of join that understands how
 * tape renaming has to work in the case of replace rules
 */
export class JoinReplaceGrammar extends GrammarComponent {

    //public renameTapeName: string | undefined = undefined;
    public fromTapeName: string | undefined = undefined;
    //public renamedChild: GrammarComponent | undefined = undefined;
    protected ruleTapes: string[] = [];

    constructor(
        cell: Cell,
        public child: GrammarComponent,
        public rules: ReplaceGrammar[]
    ) {
        super(cell);
    }

    
    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformJoinReplace(this);
    }

    public getChildren(): GrammarComponent[] {
        return [ this.child, ...this.rules ];
    }
    
    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {

            for (const rule of this.rules) {
                // iterate through the rules to see what tape (if any) needs to be hidden
                this.ruleTapes.push(...rule.calculateTapes(stack));

                //console.log(`rule fromtape = ${rule.fromTapeName}, rule renametape = ${rule.renameTapeName}`);
                if (rule.fromTapeName != undefined) {
                    if (this.fromTapeName != undefined && this.fromTapeName != rule.fromTapeName) {
                        rule.message({
                            type: "error",
                            shortMsg: "Inconsistent fields in to/from",
                            longMsg: "Each rule in a block of rules needs to " +
                              "agree on what the to/from fields are. "
                        });
                        continue;
                    }
                    this.fromTapeName = rule.fromTapeName;
                }

                /*
                if (rule.renameTapeName != undefined) {
                    if (this.renameTapeName != undefined && this.renameTapeName != rule.renameTapeName) {
                        rule.message({
                            type: "error",
                            shortMsg: "Inconsistent fields in to/from",
                            longMsg: "Each rule in a block of rules needs to " +
                              "agree on what the to/from fields are. "
                        });
                        continue;
                    }
                    this.renameTapeName = rule.renameTapeName;
                }
                */
            }

            //console.log(`renamed tape name is ${this.renameTapeName}`);

            /*
            if (this.fromTapeName == undefined || this.renameTapeName == undefined) {
                this.message({
                    type: "error",
                    shortMsg: "Unclear 'from' field.",
                    longMsg: "It's unclear here what field should be considered " +
                      "the 'from' field for the purposes of these replacement rules."
                });
                this.renamedChild = this.child;
            } else {
                this.renamedChild = new RenameGrammar(this.cell, this.child, this.fromTapeName, this.renameTapeName);
            }
            */

            const childTapes = this.child.calculateTapes(stack);
            this.tapes = listUnique([...childTapes, ...this.ruleTapes]);
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const ruleExprs = this.rules.map(r => r.constructExpr(symbols));
            const ruleExpr = constructAlternation(...ruleExprs);

            /*
            if (this.renamedChild == undefined || this.renamedChild.tapes == undefined) {
                throw new Error(`Constructing JoinReplace grammar without having calculated tapes`);
            } */
            this.expr = constructJoin(this.child.constructExpr(symbols), 
                                    ruleExpr,
                                    new Set(this.child.tapes),
                                    new Set(this.ruleTapes));
        }
        return this.expr;
    }
}


let REPLACE_INDEX: number = 0;

export class ReplaceGrammar extends GrammarComponent {
    
    public fromTapeName: string = "__UNKNOWN_TAPE__";
    public toTapeName: string = "__UNKNOWN_TAPE__";
    public renameTapeName: string = "__UNKNOWN_TAPE__";

    constructor(
        cell: Cell,
        public fromState: GrammarComponent, 
        public toState: GrammarComponent,
        public preContext: GrammarComponent = Epsilon(), 
        public postContext: GrammarComponent = Epsilon(),
        public beginsWith: Boolean = false, 
        public endsWith: boolean = false,
        public minReps: number = 0, 
        public maxReps: number = Infinity,
        public maxExtraChars: number = Infinity,
        public vocabBypass: boolean = true
    ) {
        super(cell);
    }

    public acceptTransformation(t: GrammarTransformation): GrammarComponent {
        return t.transformReplace(this);
    }

    public getChildren(): GrammarComponent[] { 
        return [this.fromState, this.toState, this.preContext, this.postContext];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = super.calculateTapes(stack);
            if (this.toState.tapes == undefined || this.toState.tapes.length != 1) {
                this.message({
                    type: "error", 
                    shortMsg: "Only 1-tape 'to' allowed", 
                    longMsg: `The 'to' argument of a replacement can only reference 1 tape; this references ${this.toState.tapes?.length}.`
                });
            } else {
                this.toTapeName = this.toState.tapes[0];
            }
            if (this.fromState.tapes == undefined || this.fromState.tapes.length != 1) {
                this.message({
                    type: "error", 
                    shortMsg: "Only 1-tape 'from' allowed", 
                    longMsg: `The 'from' argument of a replacement can only reference 1 tape; this references ${this.toState.tapes?.length}.`
                });
            } else {
                this.fromTapeName = this.fromState.tapes[0];
            }
            
            //this.tapes.push(this.fromTapeName);
            //this.tapes.push(this.toTapeName);
            //this.tapes = listUnique(this.tapes);
        }
        return this.tapes;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        // first, collect vocabulary as normal
        super.collectVocab(tapes, stack);
        //tapes.tokenize(this.fromTapeName, "");
        //tapes.tokenize(this.toTapeName, "");

        // however, we also need to collect vocab from the contexts as if it were on the toTape
        tapes = new RenamedTape(tapes, this.fromTapeName, this.toTapeName);
        
        if (this.vocabBypass) {
            this.fromState.collectVocab(tapes, stack);
        }
        this.preContext.collectVocab(tapes, stack);
        this.postContext.collectVocab(tapes, stack);
    }

    public copyVocab(tapes: Tape, stack: string[] = []): void { 
        super.copyVocab(tapes, stack);
        if (this.vocabBypass) {
            const fromTape = tapes.matchTape(this.fromTapeName);
            if (fromTape == undefined) {
                throw new Error(`Cannot find origin tape ${this.fromTapeName} during vocab copy`);
            }
            const toTape = tapes.matchTape(this.toTapeName);
            if (toTape == undefined) {
                throw new Error(`Cannot find destination tape ${this.toTapeName} during vocab copy`);
            }
            const fromVocab: string[] = fromTape.fromToken(this.fromTapeName, fromTape.any());
            for (const token of fromVocab) {
                toTape.tokenize(this.toTapeName, token);
            }
        }
    }

    public constructExpr(symbolTable: { [name: string]: Expr; }): Expr {
        
        if (this.beginsWith || this.endsWith) {
            this.maxReps = Math.max(1, this.maxReps);
            this.minReps = Math.min(this.minReps, this.maxReps);
        }

        const fromExpr: Expr = this.fromState.constructExpr(symbolTable);
        const toExpr: Expr = this.toState.constructExpr(symbolTable);
        const preContextExpr: Expr = this.preContext.constructExpr(symbolTable);
        const postContextExpr: Expr = this.postContext.constructExpr(symbolTable);
        const states: Expr[] = [
            constructMatchFrom(preContextExpr, this.fromTapeName, this.toTapeName),
            fromExpr,
            toExpr,
            constructMatchFrom(postContextExpr, this.fromTapeName, this.toTapeName)
        ];

        var sameVocab: boolean = this.vocabBypass;
        if (!sameVocab) {
            const tapeCollection: TapeCollection = this.getAllTapes();
            const fromTape: Tape | undefined = tapeCollection.matchTape(this.fromTapeName);
            if (fromTape != undefined) {
                const fromVocab: string[] = fromTape.fromToken(this.fromTapeName, fromTape.any());
                sameVocab = tapeCollection.inVocab(this.toTapeName, fromVocab);
            }
        }

        const that = this;

        function matchAnythingElse(replaceNone: boolean = false): Expr {
            const dotStar: Expr = constructRepeat(constructDot(that.fromTapeName), 0, that.maxExtraChars);
            // 1. If the fromTape vocab for the replacement operation contains some
            //    characters that are not in the corresponding toTape vocab, then
            //    extra text matched before and after the replacement cannot possibly
            //    contain the from replacement pattern. Furthermore, we don't want to
            //    add those characters to the toTape vocab, so instead we match .*
            // 2. If we are matching an instance at the start of text (beginsWith),
            //    or end of text (endsWith) then matchAnythingElse needs to match any
            //    other instances of the replacement pattern, so we need to match .*
            if( !sameVocab || (that.beginsWith && !replaceNone) || (that.endsWith && !replaceNone)) {
                return constructMatchFrom(dotStar, that.fromTapeName, that.toTapeName)
            }
            const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

            // figure out what tapes need to be negated
            const negatedTapes: string[] = [];
            if (that.fromState.tapes == undefined || 
                that.preContext.tapes == undefined ||
                that.postContext.tapes == undefined) {
                throw new Error("Trying to construct expr for replace before calculating tapes");
            }
            negatedTapes.push(...that.fromState.tapes);
            if (that.preContext.tapes != undefined) {
                negatedTapes.push(...that.preContext.tapes);
            }
            if (that.postContext.tapes != undefined) {
                negatedTapes.push(...that.postContext.tapes);
            }

            var notState: Expr;
            if (that.beginsWith && replaceNone) {
                notState = constructNegation(constructSequence(...fromInstance, dotStar),
                                             new Set(negatedTapes), that.maxExtraChars);
            }
            else if (that.endsWith && replaceNone)
                notState = constructNegation(constructSequence(dotStar, ...fromInstance),
                                             new Set(negatedTapes), that.maxExtraChars);
            else
                notState = constructNegation(constructSequence(dotStar, ...fromInstance, dotStar),
                                             new Set(negatedTapes), that.maxExtraChars);
            return constructMatchFrom(notState, that.fromTapeName, that.toTapeName)
        }
        
        if (!this.endsWith)
            states.push(matchAnythingElse());

        const replaceOne: Expr = constructSequence(...states);
        var replaceMultiple: Expr = constructRepeat(replaceOne, this.minReps, this.maxReps);

        let result: Expr;
        if (this.beginsWith)
            result = replaceOne;
        else if (this.endsWith)
            result = constructSequence(matchAnythingElse(), replaceOne);
        else 
            result = constructSequence(matchAnythingElse(), replaceMultiple);
            
        if (this.minReps > 0)
            return result
        // ??? NOTE: matchAnythingElse(true) with beginsWith can result in an
        // "infinite" loop when generate is called (especially if maxChars is
        // high) because the match on notState is not respecting maxExtraChars
        // for some reason.
        return(constructAlternation(matchAnythingElse(true), result));

    }
}

/*
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
        const fromVocab: string[] = fromTape.fromToken(fromTapeName, fromTape.any());
        sameVocab = tapeCollection.inVocab(toTapeName, fromVocab);
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
*/

class GrammarTransformation {

    public transformEpsilon(g: EpsilonGrammar): GrammarComponent {
        return g;
    }

    public transformNull(g: NullGrammar): GrammarComponent {
        return g;
    }

    public transformLiteral(g: LiteralGrammar): GrammarComponent {
        return g;
    }

    public transformDot(g: DotGrammar): GrammarComponent {
        return g;
    }

    public transformSequence(g: SequenceGrammar): GrammarComponent {
        const newChildren = g.children.map(c => c.acceptTransformation(this));
        return new SequenceGrammar(g.cell, newChildren);
    }

    public transformAlternation(g: AlternationGrammar): GrammarComponent {
        const newChildren = g.children.map(c => c.acceptTransformation(this));
        return new AlternationGrammar(g.cell, newChildren);
    }

    public transformIntersection(g: IntersectionGrammar): GrammarComponent {
        const newChild1 = g.child1.acceptTransformation(this);
        const newChild2 = g.child2.acceptTransformation(this);
        return new IntersectionGrammar(g.cell, newChild1, newChild2);
    }

    public transformJoin(g: JoinGrammar): GrammarComponent {
        const newChild1 = g.child1.acceptTransformation(this);
        const newChild2 = g.child2.acceptTransformation(this);
        return new JoinGrammar(g.cell, newChild1, newChild2);     
    }

    public transformFilter(g: FilterGrammar): GrammarComponent {
        const newChild1 = g.child1.acceptTransformation(this);
        const newChild2 = g.child2.acceptTransformation(this);
        return new FilterGrammar(g.cell, newChild1, newChild2);
    }

    public transformStartsWith(g: StartsWithGrammar): GrammarComponent {
        const newChild1 = g.child1.acceptTransformation(this);
        const newChild2 = g.child2.acceptTransformation(this);
        return new StartsWithGrammar(g.cell, newChild1, newChild2);
    }

    public transformEndsWith(g: EndsWithGrammar): GrammarComponent {
        const newChild1 = g.child1.acceptTransformation(this);
        const newChild2 = g.child2.acceptTransformation(this);
        return new EndsWithGrammar(g.cell, newChild1, newChild2);
    }

    public transformContains(g: ContainsGrammar): GrammarComponent {
        const newChild1 = g.child1.acceptTransformation(this);
        const newChild2 = g.child2.acceptTransformation(this);
        return new ContainsGrammar(g.cell, newChild1, newChild2);
    }

    public transformMatch(g: MatchGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        return new MatchGrammar(g.cell, newChild, g.relevantTapes);
    }

    public transformReplace(g: ReplaceGrammar): GrammarComponent {
        const newFrom = g.fromState.acceptTransformation(this);
        const newTo = g.fromState.acceptTransformation(this);
        const newPre = g.preContext?.acceptTransformation(this);
        const newPost = g.postContext?.acceptTransformation(this);
        return new ReplaceGrammar(g.cell, newFrom, newTo, newPre, newPost,
            g.beginsWith, g.endsWith, g.minReps, g.maxReps, g.maxExtraChars,
            g.vocabBypass);
    }
    
    public transformEmbed(g: EmbedGrammar): GrammarComponent {
        return g;
    }

    public transformNamespace(g: NamespaceGrammar): GrammarComponent {
        const result = new NamespaceGrammar(g.cell, g.name);
        for (const [name, child] of g.symbols) {
            const newChild = child.acceptTransformation(this);
            result.addSymbol(name, newChild);
        }
        return result;
    }

    public transformRepeat(g: RepeatGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        return new RepeatGrammar(g.cell, newChild, g.minReps, g.maxReps);
    }

    public transformUnary(g: UnaryGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        return new UnaryGrammar(g.cell, newChild);
    }

    public transformJoinReplace(g: JoinReplaceGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        const newRules = g.rules.map(r => r.acceptTransformation(this));
        return new JoinReplaceGrammar(g.cell, newChild, 
            newRules as ReplaceGrammar[]);
    }

    public transformNegation(g: NegationGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        return new NegationGrammar(g.cell, newChild, g.maxReps);
    }

    public transformRename(g: RenameGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        return new RenameGrammar(g.cell, newChild, g.fromTape, g.toTape);
    }

    public transformHide(g: HideGrammar): GrammarComponent {
        const newChild = g.child.acceptTransformation(this);
        return new HideGrammar(g.cell, newChild, g.tape, g.name);
    }
}

class ReplaceTapeTransformation {





}