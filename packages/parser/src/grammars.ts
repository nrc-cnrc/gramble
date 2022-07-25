import { 
    CounterStack, 
    Expr, 
    EPSILON,
    constructRepeat,
    constructSequence,
    constructAlternation,
    constructIntersection,
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
    constructCount,
    constructCountTape,
    constructPriority,
} from "./exprs";

import { 
    BitsetTape,
    renameTape,
    Tape, 
    TapeNamespace, 
    VocabMap
} from "./tapes";

import { 
    Cell,
    DummyCell,
    flatten,
    HIDDEN_TAPE_PREFIX,
    listDifference,
    listIntersection,
    listUnique,
    StringDict
} from "./util";

export { CounterStack, Expr };

export class GenOptions {
    public random: boolean = false;
    public maxRecursion: number = 2; 
    public maxChars: number = 1000;
    public direction: "LTR" | "RTL" = "RTL"
}

export interface Transform {

    transform(g: NsGrammar): NsGrammar;
    readonly desc: string;

}

export interface GrammarTransform<T> extends Transform {   

    transform(g: NsGrammar): NsGrammar;
    readonly desc: string;

    transformEpsilon(g: EpsilonGrammar, ns: NsGrammar, args: T): Grammar;
    transformNull(g: NullGrammar, ns: NsGrammar, args: T): Grammar;
    transformCharSet(g: CharSetGrammar, ns: NsGrammar, args: T): Grammar;
    transformLiteral(g: LiteralGrammar, ns: NsGrammar, args: T): Grammar;
    transformDot(g: DotGrammar, ns: NsGrammar, args: T): Grammar;
    transformSequence(g: SequenceGrammar, ns: NsGrammar, args: T): Grammar;
    transformAlternation(g: AlternationGrammar, ns: NsGrammar, args: T): Grammar;
    transformIntersection(g: IntersectionGrammar, ns: NsGrammar, args: T): Grammar;
    transformJoin(g: JoinGrammar, ns: NsGrammar, args: T): Grammar;
    transformEquals(g: EqualsGrammar, ns: NsGrammar, args: T): Grammar;
    transformStarts(g: StartsGrammar, ns: NsGrammar, args: T): Grammar;
    transformEnds(g: EndsGrammar, ns: NsGrammar, args: T): Grammar;
    transformContains(g: ContainsGrammar, ns: NsGrammar, args: T): Grammar;
    transformMatch(g: MatchGrammar, ns: NsGrammar, args: T): Grammar;
    transformMatchFrom(g: MatchFromGrammar, ns: NsGrammar, args: T): Grammar;
    transformReplace(g: ReplaceGrammar, ns: NsGrammar, args: T): Grammar;
    transformEmbed(g: EmbedGrammar, ns: NsGrammar, args: T): Grammar;
    transformUnresolvedEmbed(g: UnresolvedEmbedGrammar, ns: NsGrammar, args: T): Grammar;
    transformNamespace(g: NsGrammar, ns: NsGrammar, args: T): Grammar;
    transformRepeat(g: RepeatGrammar, ns: NsGrammar, args: T): Grammar;
    transformUnitTest(g: UnitTestGrammar, ns: NsGrammar, args: T): Grammar;
    transformNegativeUnitTest(g: NegativeUnitTestGrammar, ns: NsGrammar, args: T): Grammar;
    transformJoinReplace(g: JoinReplaceGrammar, ns: NsGrammar, args: T): Grammar;
    transformJoinRule(g: JoinRuleGrammar, ns: NsGrammar, args: T): Grammar;
    transformNegation(g: NegationGrammar, ns: NsGrammar, args: T): Grammar;
    transformRename(g: RenameGrammar, ns: NsGrammar, args: T): Grammar;
    transformHide(g: HideGrammar, ns: NsGrammar, args: T): Grammar;
    transformCount(g: CountGrammar, ns: NsGrammar, args: T): Grammar;
    transformCountTape(g: CountTapeGrammar, ns: NsGrammar, args: T): Grammar;
    transformPriority(g: PriorityGrammar, ns: NsGrammar, args: T): Grammar
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
    protected _tapes: string[] | undefined = undefined;
    public concatenableTapes: Set<string> = new Set(); 

    constructor(
        public cell: Cell
    ) { }

    public get tapes(): string[] {
        if (this._tapes == undefined) {
            throw new Error("Trying to get tapes before calculating them");
        }
        return this._tapes;
    }

    /**
     * A string ID for the grammar, for debugging purposes.
     */
    public abstract get id(): string;

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
     * @param tapeNS A TapeCollection for holding found characters
     * @param stack What symbols we've already collected from, to prevent inappropriate recursion
     * @returns vocab 
     */
    public collectAllVocab(vocab: VocabMap, tapeNS: TapeNamespace): void {

        // In all current invocations of this, calculateTapes has already been called.
        // But it memoizes, so there's no harm in calling it again for safety.
        const tapeNames = this.calculateTapes(new CounterStack(2));
        for (const tapeName of tapeNames) {
            const oldTape = tapeNS.attemptGet(tapeName);
            if (oldTape == undefined) {
                // make a new one if it doesn't exist
                const newTape = new BitsetTape(tapeName, vocab);
                tapeNS.set(tapeName, newTape);
            }
    
            this.collectVocab(tapeName, tapeNS, new Set());
        }
        const vocabCopyEdges = this.getVocabCopyEdges(tapeNS, new Set());

        let dirty: boolean = true;
        while (dirty) {
            dirty = false;
            for (const [fromTapeName, toTapeName] of vocabCopyEdges) {
                const fromTape = tapeNS.get(fromTapeName);
                const toTape = tapeNS.get(toTapeName);
                if (!fromTape.vocabIsSubsetOf(toTape)) {
                    dirty = true;
                    for (const token of fromTape.vocab) {
                        toTape.tokenize(token);
                    }
                }
            }
        }
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        for (const child of this.getChildren()) {
            child.collectVocab(tapeName, tapeNS, symbolsVisited);
        }
    }

    public getVocabCopyEdges(
        tapeNS: TapeNamespace,
        symbolsVisited: Set<string>
    ): [string, string][] {
        const results: [string, string][] = [];
        for (const child of this.getChildren()) {
            results.push(...child.getVocabCopyEdges(tapeNS, symbolsVisited));
        }
        return results;
    }
    
    public copyVocab(
        tapeNS: TapeNamespace, 
        vocabCopyEdges: [string, string][],
        stack: string[]
    ): void { 
        if (vocabCopyEdges.length == 0) {
            return;
        }
        const [toTap] = vocabCopyEdges[0];

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
        if (this._tapes == undefined) {
            const children = this.getChildren();
            //const children = this.getChildren().reverse();
            const childTapes = children.map(
                                s => s.calculateTapes(stack));
            this._tapes = listUnique(flatten(childTapes));
        }
        return this._tapes;
    }

    public getUnresolvedNames(): string[] {
        return flatten(this.getChildren().map(c => c.getUnresolvedNames()));
    }

    public getAllTapes(): TapeNamespace {
        const tapes = new TapeNamespace();
        const vocab = new VocabMap();
        this.collectAllVocab(vocab, tapes);
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

    public get id(): string {
        return 'ε';
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformEpsilon(this, ns, args);
    }

    public getLiterals(): LiteralGrammar[] {
        return [];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = EPSILON;
        }
        return this.expr;
    }
}

export class NullGrammar extends AtomicGrammar {
    
    public get id(): string {
        return "∅";
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformNull(this, ns, args);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
        }
        return this._tapes;
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
        public tapeName: string,
        public chars: string[]
    ) {
        super(cell);
    }

    public get id(): string {
        return `CharSet(${this.chars.join(",")})`
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformCharSet(this, ns, args);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        if (tapeName != this.tapeName) {
            return;
        }

        const tape = tapeNS.get(this.tapeName);
        for (const char of this.chars) {
            tape.tokenize(char);
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructCharSet(this.tapeName, this.chars);
        }
        return this.expr;
    }
}

export class LiteralGrammar extends AtomicGrammar {

    protected tokens: string[] = [];

    constructor(
        cell: Cell,
        public tapeName: string,
        public text: string
    ) {
        super(cell);
    }

    public get id(): string {
        return `Literal(${this.tapeName}:${this.text})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformLiteral(this, ns, args);
    }

    public getLiterals(): LiteralGrammar[] {
        return [this];
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void {
        if (tapeName != this.tapeName) {
            return;
        }
        const tape = tapeNS.get(this.tapeName);
        this.tokens = tape.tokenize(this.text);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructLiteral(this.tapeName, this.tokens);
        }
        return this.expr;
    }
}

export class DotGrammar extends AtomicGrammar {

    constructor(
        cell: Cell,
        public tapeName: string
    ) {
        super(cell);
    }

    public get id(): string {
        return `Dot(${this.tapeName})`;
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformDot(this, ns, args);
    }
    
    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructDot(this.tapeName);
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

    public get id(): string {
        const cs = this.children.map(c => c.id).join(",");
        return `Seq(${cs})`;
    }
    
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
            return new EpsilonGrammar(new DummyCell());
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
    
    public get id(): string {
        const cs = this.children.map(c => c.id).join(",");
        return `Uni(${cs})`;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExprs = this.children.map(s => s.constructExpr(symbols));
            this.expr = constructAlternation(...childExprs);
        } 
        return this.expr;
    }
}

export abstract class UnaryGrammar extends Grammar {

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
    
    public get id(): string {
        return `Intersect(${this.child1.id},${this.child2.id})`;
    }

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
    
    public get id(): string {
        return `Join(${this.child1.id},${this.child2.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformJoin(this, ns, args);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            const child1Tapes = this.child1.calculateTapes(stack);
            const child2Tapes = this.child2.calculateTapes(stack);
            const intersection = listIntersection(child1Tapes, child2Tapes);
            this._tapes = listUnique([...intersection, ...child1Tapes, ...child2Tapes]);
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = constructJoin(this.child1.constructExpr(symbols), 
                                this.child2.constructExpr(symbols), 
                                    new Set(this.child1.tapes),
                                    new Set(this.child2.tapes));
        }
        return this.expr;
    }

}

export class EqualsGrammar extends BinaryGrammar {

    public get id(): string {
        return `Filter(${this.child1.id},${this.child2.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformEquals(this, ns, args);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            const child1Tapes = this.child1.calculateTapes(stack);
            const child2Tapes = this.child2.calculateTapes(stack);
            this._tapes = listUnique([...child2Tapes, ...child1Tapes]);
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
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

export class CountGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: Grammar,
        public maxChars: number
    ) {
        super(cell, child);
    }

    public get id(): string {
        return `Count(${this.maxChars},${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformCount(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructCount(childExpr, this.maxChars);
        }
        return this.expr;
    }
}

export class CountTapeGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: Grammar,
        public maxChars: number | {[tape: string]: number}
    ) {
        super(cell, child);
    }

    public get id(): string {
        return `CountTape(${JSON.stringify(this.maxChars)},${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformCountTape(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            let maxCharsDict: {[tape: string]: number} = {};
            if (typeof this.maxChars == 'number') {
                for (const tape of this.tapes) {
                    maxCharsDict[tape] = this.maxChars;
                }
            } else {
                maxCharsDict = this.maxChars;
            }
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructCountTape(childExpr, maxCharsDict);
        }
        return this.expr;
    }
}

export class PriorityGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: Grammar,
        public tapePriority: string[]
    ) {
        super(cell, child);
    }

    public get id(): string {
        return `Priority(${this.tapePriority},${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformPriority(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructPriority(this.tapePriority, childExpr);
        }
        return this.expr;
    }
}

abstract class FilterGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: Grammar,
        tapes: string[] | undefined = undefined
    ) {
        super(cell, child);
        this._tapes = tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        // All descendants of FilterGrammar should have been replaced by
        // other grammars by the time exprs are constructed.
        throw new Error("not implemented");
    }
}

export class StartsGrammar extends FilterGrammar {

    public get id(): string {
        return `StartsWithFilter(${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformStarts(this, ns, args);
    }
}

export class EndsGrammar extends FilterGrammar {

    public get id(): string {
        return `EndsWithFilter(${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformEnds(this, ns, args);
    }
}

export class ContainsGrammar extends FilterGrammar {

    public get id(): string {
        return `ContainsFilter(${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformContains(this, ns, args);
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
    
    public get id(): string {
        return `Rename(${this.fromTape}>${this.toTape},${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformRename(this, ns, args);
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
        this.child.collectVocab(newTapeName, newTapeNS, symbolsVisited);
    }

    public getVocabCopyEdges(
        tapeNS: TapeNamespace,
        symbolsVisited: Set<string>
    ): [string, string][] {
        const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
        return this.child.getVocabCopyEdges(newTapeNS, symbolsVisited);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.fromTape) {
                    this._tapes.push(this.toTape);
                } else {
                    this._tapes.push(tapeName);
                }
            }
            this._tapes = listUnique(this._tapes);
        }
        return this._tapes;
    }

    public runChecksAux(): void {
        
        super.runChecksAux();

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
                longMsg: `The grammar to the left already contains the tape ${this.toTape}. `
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

    public get id(): string {
        if (this.minReps == 0 && this.maxReps == Infinity) {
            return `(${this.child.id})*`;
        }
        return `Repeat(${this.child.id},${this.minReps},${this.maxReps})`;
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
    
    public get id(): string {
        return `Not(${this.child.id})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformNegation(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
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
        public tapeName: string,
        public name: string = ""
    ) {
        super(cell, child);
        if (name == "") {
            this.name = `HIDDEN${HIDE_INDEX}`;
            HIDE_INDEX++;
        }
        this.toTape = `${HIDDEN_TAPE_PREFIX}${name}_${tapeName}`;
    }
    
    public get id(): string {
        return `Hide(${this.child.id},${this.tapeName})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformHide(this, ns, args);
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        if (tapeName != this.toTape && tapeName == this.tapeName) {
            return;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.tapeName);
        const newTapeNS = tapeNS.rename(this.toTape, this.tapeName);
        this.child.collectVocab(newTapeName, newTapeNS, symbolsVisited);
    }
    
    public getVocabCopyEdges(
        tapeNS: TapeNamespace,
        symbolsVisited: Set<string>
    ): [string, string][] {
        const newTapeNS = tapeNS.rename(this.toTape, this.tapeName);
        return this.child.getVocabCopyEdges(newTapeNS, symbolsVisited);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            for (const tapeName of this.child.calculateTapes(stack)) {
                if (tapeName == this.tapeName) {
                    this._tapes.push(this.toTape);
                } else {
                    this._tapes.push(tapeName);
                }
            }
        }
        return this._tapes;
    }
    
    public runChecksAux(): void {
        
        super.runChecksAux();

        if (this.child.tapes.indexOf(this.tapeName) == -1) {   
            this.message({
                type: "error", 
                shortMsg: "Hiding missing tape",
                longMsg: `The grammar to the left does not contain the tape ${this.tapeName}. ` +
                    ` Available tapes: [${[...this.child.tapes]}]`
            });
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {

        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructRename(childExpr, this.tapeName, this.toTape);
        }
        return this.expr;
    }
}

export class MatchFromGrammar extends UnaryGrammar {

    constructor(
        cell: Cell,
        child: Grammar,
        public fromTape: string,
        public toTape: string,
        public vocabBypass: boolean = false
    ) {
        super(cell, child);
    }

    public get id(): string {
        return `Match(${this.fromTape}->${this.toTape}:${this.child.id})`;
    }

    /**
     * For the purposes of calculating what tapes exist, we consider
     * both MatchGrammar.fromTape and .toTape to exist even if they 
     * appear nowhere else in the grammar.
     */
    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = listUnique([
                ...this.child.calculateTapes(stack),
                this.fromTape,
                this.toTape
            ]);
        }
        return this._tapes;
    }

    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        this.child.collectVocab(tapeName, tapeNS, symbolsVisited);

        if (tapeName == this.toTape) {
            let newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            let newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
            this.child.collectVocab(newTapeName, newTapeNS, symbolsVisited);
        }
    }

    public getVocabCopyEdges(
        tapeNS: TapeNamespace,
        symbolsVisited: Set<string>
    ): [string, string][] {
        const results = super.getVocabCopyEdges(tapeNS, symbolsVisited);
        if (this.vocabBypass) {    
            results.push([this.fromTape, this.toTape]);
            //results.push([this.toTape, this.fromTape]);
        }
        return results;
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformMatchFrom(this, ns, args);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        if (this.expr == undefined) {
            const childExpr = this.child.constructExpr(symbols);
            this.expr = constructMatchFrom(childExpr, this.fromTape, this.toTape);
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

    public get id(): string {
        return `Match(${this.child.id},${[...this.relevantTapes]})`;
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
        //public name: string
    ) {
        super(cell);
    }

    public get id(): string {
        let results: string[] = [];
        for (const [k, v] of this.symbols.entries()) {
            results.push(`${k}:${v.id}`);
        }
        return `Ns(\n  ${results.join("\n  ")}\n)`;
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

    public calculateQualifiedName(name: string, nsStack: string[]): string {
        const pieces = [...nsStack, name].filter(s => s.length > 0);
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
        nsStack: string[]
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
        const newStack = [ ...nsStack, localName ];
        return referent.resolveName(remnant, newStack);  // try the child
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            for (const [name, referent] of this.symbols) {
                const tapes = referent.calculateTapes(stack);
                this._tapes.push(...tapes);
            }
            this._tapes = listUnique(this._tapes);
        }
        return this._tapes;
    }

    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        for (const child of this.symbols.values()) {
            child.collectVocab(tapeName, tapeNS, symbolsVisited);
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

    public get id(): string {
        return `Embed(${this.name})`;
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
        if (this._tapes == undefined) {
            if (stack.exceedsMax(this.name)) {
                this._tapes = [];
            } else {
                const newStack = stack.add(this.name);
                this._tapes = this.getReferent().calculateTapes(newStack);
            }
        }
        return this._tapes;
    }
    

    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        if (symbolsVisited.has(this.name)) {
            return;
        }
        symbolsVisited.add(this.name);
        this.getReferent().collectVocab(tapeName, tapeNS, symbolsVisited);
    }
    
    
    public getVocabCopyEdges(
        tapeNS: TapeNamespace,
        symbolsVisited: Set<string>
    ): [string, string][] {
        if (symbolsVisited.has(this.name)) {
            return [];
        }
        symbolsVisited.add(this.name);
        return this.getReferent().getVocabCopyEdges(tapeNS, symbolsVisited);
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
    
    public get id(): string {
        return `Embed(${this.name})`;
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformUnresolvedEmbed(this, ns, args);
    }

    public getUnresolvedNames(): string[] {
        return [ this.name ];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
        }
        return this._tapes;
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
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
            this.expr = EPSILON;
        }
        return this.expr;
    }
}

export class UnitTestGrammar extends UnaryGrammar {

    public get id(): string {
        return this.child.id;
    }

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
                if (result[unique.tapeName] != unique.text) {
                    unique.message({
                        type: "error",
                        shortMsg: "Failed unit test",
                        longMsg: `An output on this line has a conflicting result for this field: ${result[unique.tapeName]}`
                    });
                    break resultLoop;
                }
                if (!(unique.tapeName in result)) {
                    unique.message({
                        type: "error",
                        shortMsg: "Failed unit test",
                        longMsg: `An output on this line does not contain a ${unique.tapeName} field: ${Object.entries(result)}`
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

export function Seq(...children: Grammar[]): SequenceGrammar {
    return new SequenceGrammar(new DummyCell(), children);
}

export function Uni(...children: Grammar[]): AlternationGrammar {
    return new AlternationGrammar(new DummyCell(), children);
}

export function Maybe(child: Grammar): AlternationGrammar {
    return Uni(child, Epsilon());
}

export function CharSet(tape: string, chars: string[]): CharSetGrammar {
    return new CharSetGrammar(new DummyCell(), tape, chars);
}

export function Lit(tape: string, text: string): LiteralGrammar {
    return new LiteralGrammar(new DummyCell(), tape, text);
}

export function Any(tape: string): DotGrammar {
    return new DotGrammar(new DummyCell(), tape);
}

export function Intersect(child1: Grammar, child2: Grammar): IntersectionGrammar {
    return new IntersectionGrammar(new DummyCell(), child1, child2);
}

export function Equals(child1: Grammar, child2: Grammar): EqualsGrammar {
    return new EqualsGrammar(new DummyCell(), child1, child2);
}

export function Join(child1: Grammar, child2: Grammar): JoinGrammar {
    return new JoinGrammar(new DummyCell(), child1, child2);
}

export function Starts(child1: Grammar, child2: Grammar): EqualsGrammar {
    const filter = new StartsGrammar(new DummyCell(), child2);
    return new EqualsGrammar(new DummyCell(), child1, filter);
}

export function Ends(child1: Grammar, child2: Grammar): EqualsGrammar {
    const filter = new EndsGrammar(new DummyCell(), child2);
    return new EqualsGrammar(new DummyCell(), child1, filter);
}

export function Contains(child1: Grammar, child2: Grammar): EqualsGrammar {
    const filter = new ContainsGrammar(new DummyCell(), child2);
    return new EqualsGrammar(new DummyCell(), child1, filter);
}

export function Rep(
    child: Grammar, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    return new RepeatGrammar(new DummyCell(), child, minReps, maxReps);
}

export function Epsilon(): EpsilonGrammar {
    return new EpsilonGrammar(new DummyCell());
}

export function Null(): NullGrammar {
    return new NullGrammar(new DummyCell());
}

export function Embed(name: string): UnresolvedEmbedGrammar {
    return new UnresolvedEmbedGrammar(new DummyCell(), name);
}

export function Match(child: Grammar, ...tapes: string[]): MatchGrammar {
    return new MatchGrammar(new DummyCell(), child, new Set(tapes));
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

export function MatchFrom(state:Grammar, fromTape: string, ...toTapes: string[]): Grammar {
    let result = state;
    for (const tape of toTapes) {
        result = new MatchFromGrammar(new DummyCell(), result, fromTape, tape);
    }
    return result;

    // Construct a Match for multiple tapes given a grammar for the first tape. 
    //return Match(Seq(state, ...otherTapes.map((t: string) => Rename(state, firstTape, t))),
    //             firstTape, ...otherTapes);
}

export function Rename(child: Grammar, fromTape: string, toTape: string): RenameGrammar {
    return new RenameGrammar(new DummyCell(), child, fromTape, toTape);
}

export function Not(child: Grammar, maxChars:number=Infinity): NegationGrammar {
    return new NegationGrammar(new DummyCell(), child, maxChars);
}

export function Ns(
    symbols: {[name: string]: Grammar} = {}
): NsGrammar {
    const result = new NsGrammar(new DummyCell());
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}

export function Hide(child: Grammar, tape: string, name: string = ""): HideGrammar {
    return new HideGrammar(new DummyCell(), child, tape, name);
}

export function Vocab(tape: string, text: string): Grammar {
    return Rep(Lit(tape, text), 0, 0)
}

export function Count(maxChars: number, child: Grammar): Grammar {
    return new CountGrammar(new DummyCell(), child, maxChars);
}

export function CountTape(maxChars: number | {[tape: string]: number}, child: Grammar): Grammar {
    return new CountTapeGrammar(new DummyCell(), child, maxChars);
}

export function Priority(tapes: string[], child: Grammar): Grammar {
    return new PriorityGrammar(new DummyCell(), child, tapes);
}

/**
  * Replace implements general phonological replacement rules.
  * 
  * NOTE: The defaults for this convenience function differ from those 
  * in the constructor of ReplaceGrammar.  These are the defaults appropriate
  * for testing, whereas the defaults in ReplaceGrammar are appropriate for
  * the purposes of converting tabular syntax into grammars.
  * 
  * fromGrammar: input (target) Grammar (on fromTape)
  * toGrammar: output (change) Grammar (on one or more toTapes)
  * preContext: context to match before the target fromGrammar (on fromTape)
  * postContext: context to match after the target fromGrammar (on fromTape)
  * otherContext: context to match on other tapes (other than fromTape & toTapes)
  * beginsWith: set to True to match at the start of fromTape
  * endsWith: set to True to match at the end of fromTape
  * minReps: minimum number of times the replace rule is applied; normally 0
  * maxReps: maximum number of times the replace rule is applied
  * maxExtraChars: a character limiter for extra characters at start/end/between replacements
  * maxCopyChars: a character limiter for copy-through when replacement not applicable
  * vocabBypass: do we copy the vocab from the "from" tape to the "to" tape?
*/
export function Replace(
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    maxExtraChars: number = 100,
    maxCopyChars: number = maxExtraChars,
    vocabBypass: boolean = false,
    hiddenTapeName: string = ""
): ReplaceGrammar {
    return new ReplaceGrammar(new DummyCell(), fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, maxCopyChars, vocabBypass, hiddenTapeName);
}

export function JoinReplace(
    child: Grammar,
    rules: ReplaceGrammar[],
): JoinReplaceGrammar {
    return new JoinReplaceGrammar(new DummyCell(), child, rules);
}

/**
 * JoinReplace is a special kind of join that understands how
 * tape renaming has to work in the case of replace rules
 */
export class JoinReplaceGrammar extends Grammar {

    public get id(): string {
        const cs = this.rules.map(r => r.id).join(",");
        return `JoinReplace(${this.child.id},${cs})`;
    }

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
        if (this._tapes == undefined) {

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

                let toTapeNames: string[] = [];
                if (rule.toTapeNames.length) {
                    if (toTapeNames.length && listDifference(toTapeNames, rule.toTapeNames).length) {
                        rule.message({
                            type: "error",
                            shortMsg: "Inconsistent to fields",
                            longMsg: "All rules in a block of rules need to " +
                              "agree on what the 'to' fields are. "
                        });
                        continue;
                    }
                    toTapeNames = rule.toTapeNames;
                }
            }

            const childTapes = this.child.calculateTapes(stack);
            this._tapes = listUnique([...childTapes, ...this.ruleTapes]);
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        throw new Error("Not implemented");
    }
}

export function JoinRule(
    inputTape: string,
    child: Grammar,
    rules: ReplaceGrammar[]
): JoinRuleGrammar {
    return new JoinRuleGrammar(new DummyCell(), inputTape, child, rules);
}

/**
 * JoinRule is a special case of JoinReplace, where the joiner assumes
 * that all rules are from a tape named ".input" to a tape named ".output".
 * 
 * With this restriction, we don't have to try to infer what the tape names
 * are.
 */
export class JoinRuleGrammar extends Grammar {

    constructor(
        cell: Cell,
        public inputTape: string,
        public child: Grammar,
        public rules: ReplaceGrammar[]
    ) {
        super(cell);
    }

    public get id(): string {
        const cs = this.rules.map(r => r.id).join(",");
        return `JoinRule(${this.child.id},${cs})`;
    }
    
    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformJoinRule(this, ns, args);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = this.child.calculateTapes(stack);
        }
        return this._tapes;
    }

    public getChildren(): Grammar[] {
        return [ this.child, ...this.rules ];
    }

    public constructExpr(symbols: SymbolTable): Expr {
        throw new Error("Not implemented");
    }    

} 

export class ReplaceGrammar extends Grammar {

    public get id(): string {
        return `Replace(${this.fromGrammar.id}->${this.toGrammar.id}|${this.preContext.id}_${this.postContext.id})`;
    }
    
    public fromTapeName: string = "__UNKNOWN_TAPE__";
    public toTapeNames: string[] = [];

    constructor(
        cell: Cell,
        public fromGrammar: Grammar,
        public toGrammar: Grammar,
        public preContext: Grammar = Epsilon(),
        public postContext: Grammar = Epsilon(),
        public otherContext: Grammar = Epsilon(),
        public beginsWith: boolean = false,
        public endsWith: boolean = false,
        public minReps: number = 0,
        public maxReps: number = Infinity,
        public maxExtraChars: number = Infinity,
        public maxCopyChars: number = maxExtraChars,
        public vocabBypass: boolean = true,
        public hiddenTapeName: string = "",
    ) {
        super(cell);
        if (this.hiddenTapeName.length == 0) {
            this.hiddenTapeName = `${HIDDEN_TAPE_PREFIX}R${this.cell.pos.sheet}:${this.cell.pos.row}`;
        } else if (!this.hiddenTapeName.startsWith(HIDDEN_TAPE_PREFIX)) {
            this.hiddenTapeName = HIDDEN_TAPE_PREFIX + this.hiddenTapeName;
        }
    }

    public accept<T>(t: GrammarTransform<T>, ns: NsGrammar, args: T): Grammar {
        return t.transformReplace(this, ns, args);
    }

    public getChildren(): Grammar[] { 
        return [this.fromGrammar, this.toGrammar, this.preContext, this.postContext, this.otherContext];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = super.calculateTapes(stack);
            if (this.toGrammar.tapes.length == 0) {
                this.message({
                    type: "error", 
                    shortMsg: "At least 1 tape-'to' required", 
                    longMsg: `The 'to' argument of a replacement must reference at least 1 tape; this references ${this.toGrammar.tapes?.length}.`
                });
            } else {
                this.toTapeNames.push(...this.toGrammar.tapes);
            }
            if (this.fromGrammar.tapes.length != 1) {
                this.message({
                    type: "error", 
                    shortMsg: "Only 1-tape 'from' allowed", 
                    longMsg: `The 'from' argument of a replacement can only reference 1 tape; this references ${this.fromGrammar.tapes?.length}.`
                });
            } else {
                this.fromTapeName = this.fromGrammar.tapes[0];
            }
        }
        return this._tapes;
    }
    
    public getVocabCopyEdges(
        tapeNS: TapeNamespace,
        symbolsVisited: Set<string>
    ): [string, string][] {
        const results = super.getVocabCopyEdges(tapeNS, symbolsVisited);
        
        if (!this.vocabBypass) {
            return results;
        }
        
        const fromTapeGlobalName = tapeNS.get(this.fromTapeName).globalName;
        for (const toTapeName of this.toTapeNames) {
            const toTapeGlobalName = tapeNS.get(toTapeName).globalName;
            results.push([fromTapeGlobalName, toTapeGlobalName]);
        }
        return results;
    }

    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        // first, collect vocabulary as normal
        super.collectVocab(tapeName, tapeNS, symbolsVisited);

        // however, we also need to collect vocab from the contexts as if it were on a toTape
        for (const toTapeName of this.toTapeNames) {
                
            if (tapeName != toTapeName && tapeName == this.fromTapeName) {
                continue;
            }

            let newTapeName = renameTape(tapeName, toTapeName, this.fromTapeName);
            let newTapeNS = tapeNS.rename(toTapeName, this.fromTapeName);
            if (this.vocabBypass) {
                this.fromGrammar.collectVocab(newTapeName, newTapeNS, symbolsVisited);
            }
            this.preContext.collectVocab(newTapeName, newTapeNS, symbolsVisited);
            this.postContext.collectVocab(newTapeName, newTapeNS, symbolsVisited);
            this.otherContext.collectVocab(newTapeName, newTapeNS, symbolsVisited);
        }
    }

    public constructExpr(symbolTable: SymbolTable): Expr {
        if (this.expr == undefined) {
            this.expr = this.constructExprAux(symbolTable);
        }
        return this.expr;
    }

    public constructExprAux(symbolTable: SymbolTable): Expr {   
        if (this.beginsWith || this.endsWith) {
            this.maxReps = Math.max(1, this.maxReps);
            this.minReps = Math.min(this.minReps, this.maxReps);
        }

        const fromExpr: Expr = this.fromGrammar.constructExpr(symbolTable);
        const toExpr: Expr = this.toGrammar.constructExpr(symbolTable);
        const preContextExpr: Expr = this.preContext.constructExpr(symbolTable);
        const postContextExpr: Expr = this.postContext.constructExpr(symbolTable);
        let states: Expr[] = [
            constructMatchFrom(preContextExpr, this.fromTapeName, ...this.toTapeNames),
            fromExpr,
            toExpr,
            constructMatchFrom(postContextExpr, this.fromTapeName, ...this.toTapeNames)
        ];

        // Determine is the toTape vocabs are supersets of the fromTape vocab.
        // Note: if the vocabBypass parameter is set, then we treat as if the
        // toTape vocabs are supersets of the fromTape vocab without checking.
        let supersetVocab: boolean = this.vocabBypass;
        if (!supersetVocab) {
            const tapeNS: TapeNamespace = this.getAllTapes();
            const fromTape: Tape = tapeNS.get(this.fromTapeName);
            const fromVocab: string[] = fromTape.vocab;
            // The following code sets sameVocab to true if the vocab of ANY
            // toTape is a superset of the fromTape vocab.
            // Perhaps we should throw an Error if some toTape vocabs are
            // supersets of the fromTape vocab and some are not.
            for (const toTapeName of this.toTapeNames) {
                const toTape = tapeNS.get(toTapeName);
                if (toTape == undefined) {
                    continue; // shouldn't happen, just for linting
                }
                if (toTape.inVocab(fromVocab)) {
                    supersetVocab = true;
                }
            }
        }

        const that = this;

        function matchAnythingElse(replaceNone: boolean = false,
                                   maxExtraChars: number = that.maxExtraChars): Expr {
            const dotStar: Expr = constructDotRep(that.fromTapeName, maxExtraChars);
            // 1. If the fromTape vocab for the replacement operation contains some
            //    characters that are not in the corresponding toTape vocab, then
            //    extra text matched before and after the replacement cannot possibly
            //    contain the from replacement pattern. Furthermore, we don't want to
            //    add those characters to the toTape vocab, so instead we match .*
            // 2. If we are matching an instance at the start of text (beginsWith),
            //    or end of text (endsWith) then matchAnythingElse needs to match any
            //    other instances of the replacement pattern, so we need to match .*
            if( !supersetVocab || (that.beginsWith && !replaceNone) || (that.endsWith && !replaceNone)) {
                return constructMatchFrom(dotStar, that.fromTapeName, ...that.toTapeNames)
            }
            const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

            // figure out what tapes need to be negated
            const negatedTapes: string[] = [];
            negatedTapes.push(...that.fromGrammar.tapes);
            negatedTapes.push(...that.preContext.tapes);
            negatedTapes.push(...that.postContext.tapes);

            let notGrammar: Expr;
            if (that.beginsWith && replaceNone) {
                notGrammar = constructNegation(constructSequence(...fromInstance, dotStar),
                                               new Set(negatedTapes), maxExtraChars);
            }
            else if (that.endsWith && replaceNone)
                notGrammar = constructNegation(constructSequence(dotStar, ...fromInstance),
                                               new Set(negatedTapes), maxExtraChars);
            else
                notGrammar = constructNegation(constructSequence(dotStar, ...fromInstance, dotStar),
                                               new Set(negatedTapes), maxExtraChars);
            return constructMatchFrom(notGrammar, that.fromTapeName, ...that.toTapeNames)
        }
        
        if (!this.endsWith)
            states.push(matchAnythingElse());

        const replaceOne: Expr = constructSequence(...states);
        const replaceMultiple: Expr = constructRepeat(replaceOne, Math.max(1, this.minReps), this.maxReps);

        // we need to match the context on other tapes too
        const otherContextExpr: Expr = this.otherContext.constructExpr(symbolTable);
        if (this.beginsWith)
            states = [replaceOne, otherContextExpr]
        else if (this.endsWith)
            states = [matchAnythingElse(), replaceOne, otherContextExpr];
        else
            states = [matchAnythingElse(), replaceMultiple, otherContextExpr];
        const replaceExpr: Expr = constructSequence(...states);
                
        if (this.minReps > 0) {
            return replaceExpr;
        } else {
            let copyExpr: Expr = matchAnythingElse(true, this.maxCopyChars);
            if (otherContextExpr != EPSILON) {
                const negatedTapes: string[] = [];
                negatedTapes.push(...this.otherContext.tapes);
                const negatedOtherContext: Expr = constructNegation(otherContextExpr,
                                                                    new Set(negatedTapes),
                                                                    this.maxCopyChars);
                const matchDotStar: Expr = constructMatchFrom(constructDotRep(this.fromTapeName, this.maxCopyChars),
                                                              this.fromTapeName, ...this.toTapeNames)
                copyExpr = constructAlternation(constructSequence(matchAnythingElse(true, this.maxCopyChars), otherContextExpr),
                                                constructSequence(matchDotStar, negatedOtherContext));
            }
            return constructAlternation(copyExpr, replaceExpr);
        }
    }

}