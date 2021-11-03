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
    //constructMemo,
    constructMatch,
    SymbolTable,
    constructFilter,
    constructJoin,
    constructLiteral,
    constructMatchFrom,
    constructCharSet,
    constructDotRep,
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

export interface GrammarTransform<T> {
    transformEpsilon(g: EpsilonGrammar, ns: NsGrammar, args: T): Grammar;
    transformNull(g: NullGrammar, ns: NsGrammar, args: T): Grammar;
    transformCharSet(g: CharSetGrammar, ns: NsGrammar, args: T): Grammar;
    transformLiteral(g: LiteralGrammar, ns: NsGrammar, args: T): Grammar;
    transformDot(g: DotGrammar, ns: NsGrammar, args: T): Grammar;
    transformSequence(g: SequenceGrammar, ns: NsGrammar, args: T): Grammar;
    transformAlternation(g: AlternationGrammar, ns: NsGrammar, args: T): Grammar;
    transformIntersection(g: IntersectionGrammar, ns: NsGrammar, args: T): Grammar;
    transformJoin(g: JoinGrammar, ns: NsGrammar, args: T): Grammar;
    transformFilter(g: FilterGrammar, ns: NsGrammar, args: T): Grammar;
    transformStartsWith(g: StartsWithGrammar, ns: NsGrammar, args: T): Grammar;
    transformEndsWith(g: EndsWithGrammar, ns: NsGrammar, args: T): Grammar;
    transformContains(g: ContainsGrammar, ns: NsGrammar, args: T): Grammar;
    transformMatch(g: MatchGrammar, ns: NsGrammar, args: T): Grammar;
    transformReplace(g: ReplaceGrammar, ns: NsGrammar, args: T): Grammar;
    transformEmbed(g: EmbedGrammar, ns: NsGrammar, args: T): Grammar;
    transformUnresolvedEmbed(g: UnresolvedEmbedGrammar, ns: NsGrammar, args: T): Grammar;
    transformNamespace(g: NsGrammar, ns: NsGrammar, args: T): Grammar;
    transformRepeat(g: RepeatGrammar, ns: NsGrammar, args: T): Grammar;
    transformUnitTest(g: UnitTestGrammar, ns: NsGrammar, args: T): Grammar;
    transformNegativeUnitTest(g: NegativeUnitTestGrammar, ns: NsGrammar, args: T): Grammar;
    transformJoinReplace(g: JoinReplaceGrammar, ns: NsGrammar, args: T): Grammar;
    transformNegation(g: NegationGrammar, ns: NsGrammar, args: T): Grammar;
    transformRename(g: RenameGrammar, ns: NsGrammar, args: T): Grammar;
    transformHide(g: HideGrammar, ns: NsGrammar, args: T): Grammar;
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
 * At the Grammar level we do the following operations.  Some of these are done
 * within the grammar objects themselves, others are performed by GrammarTransformation objects (which are
 * GoF Visitors).  
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
 *   * adjusting tape names in cases (specifically replacement rules) where
 *     the stated to/from tapes can't literally be true.  (If we say that "a" 
 *     changes to "b" on tape T, that's not really true underlyingly; in both
 *     our Turing Machine metaphor and our implementation, we never "back up"
 *     the cursor and change anything.  Once something's written, it's written.
 *     So really, the "from T" and the "two T" have to be two different tapes 
 *     in implementation.  We use RenameGrammars to rename the "from T" to a new
 *     name.
 * 
 *   * sanity-checking and generating certain errors/warnings, like 
 *     whether a symbol X actually has a defined referent, whether a 
 *     filter refers to tapes that the component it's filtering doesn't, etc.
 * 
 *   * finally, generating the Brzozowski expression corresponding to each 
 *     component.
 */

export abstract class Grammar {

    public expr: Expr | undefined = undefined;
    public tapes: string[] | undefined = undefined;
    public concatenableTapes: Set<string> = new Set(); 

    constructor(
        public cell: Cell
    ) { }

    public message(msg: any): void {
        this.cell.message(msg);
    }

    public abstract accept<T>(
        t: GrammarTransform<T>,
        ns: NsGrammar,
        args: T
    ): Grammar;

    public getLiterals(): LiteralGrammar[] {
        throw new Error(`Cannot get literals from this grammar`);
    }
    
    public abstract getChildren(): Grammar[];

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

    public runChecksAux(): void {
        for (const child of this.getChildren()) {
            child.runChecksAux();
        }
    }

    public gatherUnitTests(): UnitTestGrammar[] {
        return flatten(this.getChildren().map(c => c.gatherUnitTests()));
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            const childTapes = this.getChildren().map(
                                s => s.calculateTapes(stack));
            this.tapes = listUnique(flatten(childTapes));
        }
        return this.tapes;
    }

    /*
    public qualifyNames(nsStack: NamespaceGrammar[] = []): string[] {
        //return flatten(this.getChildren().map(c => c.qualifyNames(nsStack)));
    
    } */

    public getUnresolvedNames(): string[] {
        return flatten(this.getChildren().map(c => c.getUnresolvedNames()));
    }

    public getAllTapes(): TapeCollection {
        const tapes = new TapeCollection();
        this.collectVocab(tapes, []);
        return tapes;
    }

    public abstract constructExpr(symbolTable: SymbolTable): Expr;

    public getSymbol(name: string): Grammar | undefined {
        if (name == "") {
            return this;
        }
        return undefined;
    }

    public getDefaultSymbol(): Grammar {
        return this;
    }
    
    public allSymbols(): string[] {
        return [];
    }
}

abstract class AtomicGrammar extends Grammar {

    public getChildren(): Grammar[] { return []; }

}

export class EpsilonGrammar extends AtomicGrammar {

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformEpsilon(this, ns, args);
    }

    public getLiterals(): LiteralGrammar[] {
        return [];
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformNull(this, ns, args);
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

export class CharSetGrammar extends AtomicGrammar {

    constructor(
        cell: Cell,
        public tape: string,
        public chars: string[]
    ) {
        super(cell);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformCharSet(this, ns, args);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [this.tape];
        }
        return this.tapes;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        for (const char of this.chars) {
            tapes.tokenize(this.tape, char, true);
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructCharSet(this.tape, this.chars);
        }
        return this.expr;
    }
}

export class LiteralGrammar extends AtomicGrammar {

    protected tokens: string[] = [];

    constructor(
        cell: Cell,
        public tape: string,
        public text: string
    ) {
        super(cell);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformLiteral(this, ns, args);
    }

    public getLiterals(): LiteralGrammar[] {
        return [this];
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
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformDot(this, ns, args);
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

abstract class NAryGrammar extends Grammar {

    constructor(
        cell: Cell,
        public children: Grammar[]
    ) {
        super(cell);
    }
    
    public getChildren(): Grammar[] { 
        return this.children; 
    }
}

export class SequenceGrammar extends NAryGrammar {
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformSequence(this, ns, args);
    }

    public getLiterals(): LiteralGrammar[] {
        return flatten(this.children.map(c => c.getLiterals()));
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {        
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructSequence(...childExprs);
        }
        return this.expr;
    }

    public finalChild(): Grammar {
        if (this.children.length == 0) {
            return new EpsilonGrammar(DUMMY_CELL);
        }
        return this.children[this.children.length-1];
    }

    public nonFinalChildren(): Grammar[] {
        if (this.children.length <= 1) {
            return [];
        }
        return this.children.slice(0, this.children.length-1);
    }
}

export class AlternationGrammar extends NAryGrammar {

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformAlternation(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructAlternation(...childExprs);
        } 
        return this.expr;
    }
}

abstract class BinaryGrammar extends Grammar {

    constructor(
        cell: Cell,
        public child1: Grammar,
        public child2: Grammar
    ) {
        super(cell);
    }
    
    public getChildren(): Grammar[] { 
        return [this.child1, this.child2];
    }
}

export class IntersectionGrammar extends BinaryGrammar {
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformIntersection(this, ns, args);
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformJoin(this, ns, args);
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformFilter(this, ns, args);
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformStartsWith(this, ns, args);
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformEndsWith(this, ns, args);
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformContains(this, ns, args);
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

abstract class UnaryGrammar extends Grammar {

    constructor(
        cell: Cell,
        public child: Grammar
    ) {
        super(cell);
    }

    public getChildren(): Grammar[] { 
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
        child: Grammar,
        public fromTape: string,
        public toTape: string
    ) {
        super(cell, child);
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformRename(this, ns, args);
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
        child: Grammar,
        public minReps: number = 0,
        public maxReps: number = Infinity
    ) {
        super(cell, child);
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformRepeat(this, ns, args);
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
        child: Grammar,
        public maxReps: number = Infinity
    ) {
        super(cell, child);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformNegation(this, ns, args);
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
        child: Grammar,
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformHide(this, ns, args);
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
        child: Grammar,
        public relevantTapes: Set<string>
    ) {
        super(cell, child);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformMatch(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructMatch(childExpr, this.relevantTapes);
        }
        return this.expr;
    }
}

export class NsGrammar extends Grammar {

    constructor(
        cell: Cell,
        public name: string
    ) {
        super(cell);
    }

    //public qualifiedNames: Map<string, string> = new Map();
    public symbols: Map<string, Grammar> = new Map();
    //public default: GrammarComponent = new EpsilonGrammar(DUMMY_CELL);

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformNamespace(this, ns, args);
    }

    public addSymbol(symbolName: string, component: Grammar): void {
        this.symbols.set(symbolName, component);
    }

    public getDefaultSymbol(): Grammar {
        if (this.symbols.size == 0) {
            return new EpsilonGrammar(this.cell);
        }

        return [...this.symbols.values()][this.symbols.size-1].getDefaultSymbol();
    }

    public getSymbol(symbolName: string): Grammar | undefined {

        if (symbolName == "") {
            return this.getDefaultSymbol();
        }

        const result = this.resolveNameLocal(symbolName);
        if (result == undefined) {
            return undefined;
        }

        const [name, referent] = result;
        return referent;
        
    }

    public allSymbols(): string[] {
        return [...this.symbols.keys()];
    }

    public getChildren(): Grammar[] { 
        const results: Grammar[] = [];
        for (const [name, referent] of this.symbols.entries()) {
            if (results.indexOf(referent) == -1) {
                results.push(referent);
            }
        }
        return results;
    }

    public calculateQualifiedName(name: string, nsStack: NsGrammar[]): string {
        const namePrefixes = nsStack.map(n => n.name);
        const pieces = [...namePrefixes, name].filter(s => s.length > 0);
        return pieces.join(".");
    }

    /**
     * Looks up an unqualified name in this namespace's symbol table,
     * case-insensitive.
     */
    public resolveNameLocal(name: string): [string, Grammar] | undefined {
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
        nsStack: NsGrammar[]
    ): [string, Grammar] | undefined {

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
            // so get the fully-qualified name.
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
        if (!(referent instanceof NsGrammar)) {
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

    public constructExpr(symbols: SymbolTable): Expr {

        if (this.expr == undefined) {

            this.expr = EPSILON;
            for (const [name, referent] of this.symbols) {
                if (name in symbols) {
                    continue;  // don't bother, it won't have changed.
                }
                let expr = referent.constructExpr(symbols);
                //expr = constructMemo(expr, 3);
                symbols[name] = expr;
            }
        }

        return this.expr;
    }
}

export class EmbedGrammar extends AtomicGrammar {

    constructor(
        cell: Cell,
        public name: string,
        public namespace: NsGrammar
    ) {
        super(cell);
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformEmbed(this, ns, args);
    }

    public getReferent(): Grammar {
        const referent = this.namespace.getSymbol(this.name);
        if (referent == undefined) {
            //shouldn't happen!
            throw new Error(`Can't find ${this.name} in namespace, available: [${this.namespace.allSymbols()}]`);
        }
        return referent;
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            if (stack.exceedsMax(this.name)) {
                this.tapes = [];
            } else {
                const newStack = stack.add(this.name);
                this.tapes = this.getReferent().calculateTapes(newStack);
            }
        }
        return this.tapes;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        if (stack.indexOf(this.name) != -1) {
            return;
        }
        const newStack = [...stack, this.name];
        this.getReferent().collectVocab(tapes, newStack);
    }
    
    public copyVocab(tapes: Tape, stack: string[] = []): void {
        if (stack.indexOf(this.name) != -1) {
            return;
        }
        const newStack = [...stack, this.name];
        this.getReferent().copyVocab(tapes, newStack);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructEmbed(this.name, symbols);
        }
        return this.expr;
    }

}

export class UnresolvedEmbedGrammar extends AtomicGrammar {

    constructor(
        cell: Cell,
        public name: string
    ) {
        super(cell);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformUnresolvedEmbed(this, ns, args);
    }

    public getUnresolvedNames(): string[] {
        return [ this.name ];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {
            this.tapes = [];
        }
        return this.tapes;
    }

    public collectVocab(tapes: Tape, stack: string[] = []): void {
        return;
    }
    
    public copyVocab(tapes: Tape, stack: string[] = []): void {
        return;
    }

    public runChecksAux(): void {
        this.message({
            type: "error",  
            shortMsg: "Unknown symbol", 
            longMsg: `Undefined symbol: ${this.name}`
        });
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            //console.log(`warning, unresolved embed ${this.name}`);
            this.expr = EPSILON;
        }
        return this.expr;
    }
}

export class UnitTestGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: Grammar,
        public test: Grammar,
        public uniques: LiteralGrammar[] = []
    ) {
        super(cell, child);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformUnitTest(this, ns, args);
    }

    public gatherUnitTests(): UnitTestGrammar[] {
        return [...super.gatherUnitTests(), this];
    }

    public evalResults(results: StringDict[]): void {

        if (results.length == 0) {
            this.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above has no outputs compatible with these inputs."
            });
        } else {
            this.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above has outputs compatible with these inputs."
            });
        }

        uniqueLoop: for (const unique of this.uniques) {
            resultLoop: for (const result of results) {
                if (result[unique.tape] != unique.text) {
                    unique.message({
                        type: "error",
                        shortMsg: "Failed unit test",
                        longMsg: `An output on this line has a conflicting result for this field: ${result[unique.tape]}`
                    });
                    break resultLoop;
                }
                if (!(unique.tape in result)) {
                    unique.message({
                        type: "error",
                        shortMsg: "Failed unit test",
                        longMsg: `An output on this line does not contain a ${unique.tape} field: ${Object.entries(result)}`
                    });
                    break uniqueLoop;
                }
            }
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

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformNegativeUnitTest(this, ns, args);
    }

    public gatherUnitTests(): UnitTestGrammar[] {
        return [...super.gatherUnitTests(), this];
    }

    public evalResults(results: StringDict[]): void {
        if (results.length > 0) {
            this.message({
                type: "error", 
                shortMsg: "Failed unit test",
                longMsg: "The grammar above incorrectly has outputs compatible with these inputs."
            });
        } else {
            this.message({
                type: "info",
                shortMsg: "Unit test successful",
                longMsg: "The grammar above correctly has no outputs compatible with these inputs."
            });
        }
    } 

}

export const DUMMY_CELL = new DummyCell();

export function Seq(...children: Grammar[]): SequenceGrammar {
    return new SequenceGrammar(DUMMY_CELL, children);
}

export function Uni(...children: Grammar[]): AlternationGrammar {
    return new AlternationGrammar(DUMMY_CELL, children);
}

export function Maybe(child: Grammar): AlternationGrammar {
    return Uni(child, Epsilon());
}

export function CharSet(tape: string, chars: string[]): CharSetGrammar {
    return new CharSetGrammar(DUMMY_CELL, tape, chars);
}

export function Lit(tape: string, text: string): LiteralGrammar {
    return new LiteralGrammar(DUMMY_CELL, tape, text);
}

export function Any(tape: string): DotGrammar {
    return new DotGrammar(DUMMY_CELL, tape);
}

export function Intersect(child1: Grammar, child2: Grammar): IntersectionGrammar {
    return new IntersectionGrammar(DUMMY_CELL, child1, child2);
}

export function Filter(child1: Grammar, child2: Grammar): FilterGrammar {
    return new FilterGrammar(DUMMY_CELL, child1, child2);
}

export function Join(child1: Grammar, child2: Grammar): JoinGrammar {
    return new JoinGrammar(DUMMY_CELL, child1, child2);
}

export function StartsWith(child1: Grammar, child2: Grammar): StartsWithGrammar {
    return new StartsWithGrammar(DUMMY_CELL, child1, child2);
}

export function EndsWith(child1: Grammar, child2: Grammar): EndsWithGrammar {
    return new EndsWithGrammar(DUMMY_CELL, child1, child2);
}

export function Contains(child1: Grammar, child2: Grammar): ContainsGrammar {
    return new ContainsGrammar(DUMMY_CELL, child1, child2);
}

export function Rep(
    child: Grammar, 
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

export function Embed(name: string): UnresolvedEmbedGrammar {
    return new UnresolvedEmbedGrammar(DUMMY_CELL, name);
}

export function Match(child: Grammar, ...tapes: string[]): MatchGrammar {
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

export function MatchFrom(state:Grammar, firstTape: string, ...otherTapes: string[]): MatchGrammar {
    // Construct a Match for multiple tapes given a grammar for the first tape. 
    return Match(Seq(state, ...otherTapes.map((t: string) => Rename(state, firstTape, t))),
                 firstTape, ...otherTapes);
}

export function Rename(child: Grammar, fromTape: string, toTape: string): RenameGrammar {
    return new RenameGrammar(DUMMY_CELL, child, fromTape, toTape);
}

export function Not(child: Grammar, maxChars:number=Infinity): NegationGrammar {
    return new NegationGrammar(DUMMY_CELL, child, maxChars);
}

export function Ns(
    name: string, 
    symbols: {[name: string]: Grammar} = {}
): NsGrammar {
    const result = new NsGrammar(DUMMY_CELL, name);
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}

export function Hide(child: Grammar, tape: string, name: string = ""): HideGrammar {
    return new HideGrammar(DUMMY_CELL, child, tape, name);
}

export function Vocab(tape: string, text: string): Grammar {
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
    fromState: Grammar, toState: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    beginsWith: Boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    vocabBypass: boolean = false
): Grammar {
    return new ReplaceGrammar(DUMMY_CELL, fromState, toState, 
        preContext, postContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, vocabBypass);
}


/**
 * JoinReplace is a special kind of join that understands how
 * tape renaming has to work in the case of replace rules
 */
export class JoinReplaceGrammar extends Grammar {

    //public renameTapeName: string | undefined = undefined;
    //public fromTapeName: string | undefined = undefined;
    //public renamedChild: GrammarComponent | undefined = undefined;
    protected ruleTapes: string[] = [];

    constructor(
        cell: Cell,
        public child: Grammar,
        public rules: ReplaceGrammar[]
    ) {
        super(cell);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformJoinReplace(this, ns, args);
    }

    public getChildren(): Grammar[] {
        return [ this.child, ...this.rules ];
    }
    
    public calculateTapes(stack: CounterStack): string[] {
        if (this.tapes == undefined) {

            for (const rule of this.rules) {
                // iterate through the rules to see what tape needs to be renamed, and to what
                this.ruleTapes.push(...rule.calculateTapes(stack));

                let fromTapeName: string | undefined = undefined;
                if (rule.fromTapeName != undefined) {
                    if (fromTapeName != undefined && fromTapeName != rule.fromTapeName) {
                        rule.message({
                            type: "error",
                            shortMsg: "Inconsistent from fields",
                            longMsg: "Each rule in a block of rules needs to " +
                              "agree on what the 'from' fields are. "
                        });
                        continue;
                    }
                    fromTapeName = rule.fromTapeName;
                }

                let toTapeName: string | undefined = undefined;
                if (rule.toTapeName != undefined) {
                    if (toTapeName != undefined && toTapeName != rule.toTapeName) {
                        rule.message({
                            type: "error",
                            shortMsg: "Inconsistent to fields",
                            longMsg: "Each rule in a block of rules needs to " +
                              "agree on what the 'to' fields are. "
                        });
                        continue;
                    }
                    toTapeName = rule.toTapeName;
                }
            }

            const childTapes = this.child.calculateTapes(stack);
            this.tapes = listUnique([...childTapes, ...this.ruleTapes]);
        }
        return this.tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const ruleExprs = this.rules.map(r => r.constructExpr(symbols));
            const ruleExpr = constructAlternation(...ruleExprs);
            this.expr = constructJoin(this.child.constructExpr(symbols), 
                                    ruleExpr,
                                    new Set(this.child.tapes),
                                    new Set(this.ruleTapes));
        }
        return this.expr;
    }
}

export class ReplaceGrammar extends Grammar {
    
    public fromTapeName: string = "__UNKNOWN_TAPE__";
    public toTapeName: string = "__UNKNOWN_TAPE__";

    constructor(
        cell: Cell,
        public fromState: Grammar, 
        public toState: Grammar,
        public preContext: Grammar = Epsilon(), 
        public postContext: Grammar = Epsilon(),
        public beginsWith: Boolean = false, 
        public endsWith: boolean = false,
        public minReps: number = 0, 
        public maxReps: number = Infinity,
        public maxExtraChars: number = Infinity,
        public vocabBypass: boolean = true
    ) {
        super(cell);
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformReplace(this, ns, args);
    }

    public getChildren(): Grammar[] { 
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

    public constructExpr(symbolTable: SymbolTable): Expr {
        
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

        let sameVocab: boolean = this.vocabBypass;
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
            const dotStar: Expr = constructDotRep(that.fromTapeName, that.maxExtraChars);
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
            negatedTapes.push(...that.preContext.tapes);
            negatedTapes.push(...that.postContext.tapes);

            let notState: Expr;
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
        let replaceMultiple: Expr = constructRepeat(replaceOne, this.minReps, this.maxReps);

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
