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
    EpsilonExpr,
    constructShort,
    constructNotContains,
    constructParallel,
    Env
} from "./exprs";
import { Msg, Msgs, Result } from "./msgs";

import { 
    BitsetTape,
    renameTape,
    Tape, 
    TapeNamespace, 
    VocabMap
} from "./tapes";
import { TransEnv } from "./transforms";

import { 
    Cell,
    CellPos,
    Dict,
    flatten,
    HIDDEN_TAPE_PREFIX,
    listDifference,
    listIntersection,
    listUnique,
    tokenizeUnicode
} from "./util";

import { GenOptions } from "./util";

export { CounterStack, Expr };

type TapeClass = {
    joinable: boolean,
    concatenable: boolean
};

export class GrammarResult extends Result<Grammar> { }

export interface GrammarTransform {   

    transform(env: TransEnv): Result<NsGrammar>;
    readonly desc: string;

    transformEpsilon(g: EpsilonGrammar, env: TransEnv): GrammarResult;
    transformNull(g: NullGrammar, env: TransEnv): GrammarResult;
    transformCharSet(g: CharSetGrammar, env: TransEnv): GrammarResult;
    transformLiteral(g: LiteralGrammar, env: TransEnv): GrammarResult;
    transformDot(g: DotGrammar, env: TransEnv): GrammarResult;
    transformSequence(g: SequenceGrammar, env: TransEnv): GrammarResult;
    transformAlternation(g: AlternationGrammar, env: TransEnv): GrammarResult;
    transformIntersection(g: IntersectionGrammar, env: TransEnv): GrammarResult;
    transformJoin(g: JoinGrammar, env: TransEnv): GrammarResult;
    transformEquals(g: EqualsGrammar, env: TransEnv): GrammarResult;
    transformStarts(g: StartsGrammar, env: TransEnv): GrammarResult;
    transformEnds(g: EndsGrammar, env: TransEnv): GrammarResult;
    transformContains(g: ContainsGrammar, env: TransEnv): GrammarResult;
    transformMatch(g: MatchGrammar, env: TransEnv): GrammarResult;
    transformMatchFrom(g: MatchFromGrammar, env: TransEnv): GrammarResult;
    transformReplace(g: ReplaceGrammar, env: TransEnv): GrammarResult;
    transformEmbed(g: EmbedGrammar, env: TransEnv): GrammarResult;
    transformNamespace(g: NsGrammar, env: TransEnv): GrammarResult;
    transformRepeat(g: RepeatGrammar, env: TransEnv): GrammarResult;
    transformUnitTest(g: UnitTestGrammar, env: TransEnv): GrammarResult;
    transformNegativeUnitTest(g: NegativeUnitTestGrammar, env: TransEnv): GrammarResult;
    transformJoinReplace(g: JoinReplaceGrammar, env: TransEnv): GrammarResult;
    transformJoinRule(g: JoinRuleGrammar, env: TransEnv): GrammarResult;
    transformNegation(g: NegationGrammar, env: TransEnv): GrammarResult;
    transformRename(g: RenameGrammar, env: TransEnv): GrammarResult;
    transformHide(g: HideGrammar, env: TransEnv): GrammarResult;
    transformCount(g: CountGrammar, env: TransEnv): GrammarResult;
    transformCountTape(g: CountTapeGrammar, env: TransEnv): GrammarResult;
    transformPriority(g: PriorityGrammar, env: TransEnv): GrammarResult;
    transformShort(g: ShortGrammar, env: TransEnv): GrammarResult;
    transformParallel(g: ParallelGrammar, env: TransEnv): GrammarResult;
    transformLocator(g: LocatorGrammar, env: TransEnv): GrammarResult;
}

/**
 * Grammar components represent the linguistic grammar that the
 * programmer is expressing (in terms of sequences, alternations, joins and filters,
 * etc.), as opposed to its specific layout on the spreadsheet grids (the "tabular
 * syntax tree" or TST), but also as opposed to the specific algebraic expressions
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

    public get pos(): CellPos | undefined {
        return undefined;
    }
    
    public msg(m: Msg | Msgs = []): GrammarResult {
        return new GrammarResult(this).msg(m);
    }
    
    protected _tapes: string[] | undefined = undefined;
    public concatenableTapes: Set<string> = new Set(); 

    public get tapes(): string[] {
        if (this._tapes == undefined) {
            throw new Error("Trying to get tapes before calculating them");
        }
        return this._tapes;
    }

    public get locations(): Cell[] {
        return flatten(this.getChildren().map(c => c.locations));
    }

    /**
     * A string ID for the grammar, for debugging purposes.
     */
    public abstract get id(): string;

    public abstract accept(t: GrammarTransform, env: TransEnv): GrammarResult;

    public getLiterals(): LiteralGrammar[] {
        throw new Error(`Cannot get literals from this grammar`);
    }

    /**
     * This method is used to detect grammars that might be infinite --
     * not *certain* to be infinite, but potentially so, that that we
     * add a CountGrammar to the root just in case.  
     * 
     * I don't think it's possible to be certain that an arbitrary grammar
     * is infinite; for example, we might join two grammars, both of which
     * are infinite, but they actually only have a single entry that both 
     * share.  We wouldn't know that, however, until generation; out of safety
     * we have to treat the joins of two infinite grammars as themselves 
     * infinite.  
     * 
     * It costs us little if we're wrong here; CountExprs have 
     * negligible runtime cost.  We still want to try to get this correct, 
     * though, because it truncates the outputs of the grammar-as-written,
     * we want the addition of CountGrammar to be a last resort.
     */
    public abstract potentiallyInfinite(stack: CounterStack): boolean;
    
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
            const tapeInfo = this.getTapeClass(tapeName, {});
            const atomic = !tapeInfo.joinable || !tapeInfo.concatenable;
            const oldTape = tapeNS.attemptGet(tapeName);
            if (oldTape == undefined) {
                // make a new one if it doesn't exist
                const newTape = new BitsetTape(tapeName, vocab, atomic);
                tapeNS.set(tapeName, newTape);
            }
            tapeNS.get(tapeName).atomic = atomic;
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
                    toTape.registerTokens(fromTape.vocab);
                }
            }
        }
    }
    
    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        let result: TapeClass = { joinable: false, concatenable: false };
        for (const child of this.getChildren()) {
            const childTapeClass = child.getTapeClass(tapeName, cache);
            result.joinable ||= childTapeClass.joinable;
            result.concatenable ||= childTapeClass.concatenable;
        }
        return result;
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

    public potentiallyInfinite(stack: CounterStack): boolean {
        return false;
    }

}

export class EpsilonGrammar extends AtomicGrammar {

    public get id(): string {
        return 'ε';
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformEpsilon(this, env);
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
        return EPSILON;
    }
}

export class NullGrammar extends AtomicGrammar {
    
    public get id(): string {
        return "∅";
    }
    
    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformNull(this, env);
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return NULL;
    }
}

export class CharSetGrammar extends AtomicGrammar {

    constructor(
        public tapeName: string,
        public chars: string[]
    ) {
        super();
    }

    public get id(): string {
        return `CharSet(${this.chars.join(",")})`
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformCharSet(this, env);
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
        tape.registerTokens(this.chars);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return constructCharSet(this.tapeName, this.chars);
    }
}

export class LiteralGrammar extends AtomicGrammar {

    protected tokens: string[] = [];

    constructor(
        public tapeName: string,
        public text: string
    ) {
        super();
        this.tokens = tokenizeUnicode(text);
    }

    public get id(): string {
        return `Literal(${this.tapeName}:${this.text})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformLiteral(this, env);
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
        if (tape.atomic) {
            tape.registerTokens([this.text]);
        } else {
            tape.registerTokens(this.tokens);
        }
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return constructLiteral(this.tapeName, this.text, this.tokens);
    }
}

export class DotGrammar extends AtomicGrammar {

    constructor(
        public tapeName: string
    ) {
        super();
    }

    public get id(): string {
        return `Dot(${this.tapeName})`;
    }
    
    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        if (tapeName == this.tapeName) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, cache);
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformDot(this, env);
    }
    
    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return constructDot(this.tapeName);
    }
}

abstract class NAryGrammar extends Grammar {

    constructor(
        public children: Grammar[]
    ) {
        super();
    }
    
    public getChildren(): Grammar[] { 
        return this.children; 
    }
    
    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.children.some(c => c.potentiallyInfinite(stack));
    }

}

export class ParallelGrammar extends NAryGrammar {

    public get id(): string {
        const cs = this.children.map(c => c.id).join(",");
        return `Par(${cs})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformParallel(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExprs: {[tapeName: string]: Expr} = {};
        for (const child of this.children) {
            if (child.tapes.length != 1) {
                throw new Error(`Each child of par must have 1 tape`);
            }
            const tapeName = child.tapes[0];
            if (tapeName in childExprs) {
                throw new Error(`Each child of par must have a unique tape`)
            }
            const newChild = child.constructExpr(symbols);
            childExprs[tapeName] = newChild;
        }
        return constructParallel(childExprs);
    }

}

export class SequenceGrammar extends NAryGrammar {

    public get id(): string {
        const cs = this.children.map(c => c.id).join(",");
        return `Seq(${cs})`;
    }
    
    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformSequence(this, env);
    }

    public getLiterals(): LiteralGrammar[] {
        return flatten(this.children.map(c => c.getLiterals()));
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const result = super.getTapeClass(tapeName, cache);
        let alreadyFound = false;
        for (const child of this.children) {
            const ts = new Set(child.tapes);
            if (!(ts.has(tapeName))) {
                continue;
            }
            if (alreadyFound) {
                result.concatenable = true;
                return result;
            }
            alreadyFound = true;
        }
        return result;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExprs = this.children.map(s => s.constructExpr(symbols));
        return constructSequence(...childExprs);
    }

    public finalChild(): Grammar {
        if (this.children.length == 0) {
            return new EpsilonGrammar();
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

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformAlternation(this, env);
    }
    
    public get id(): string {
        const cs = this.children.map(c => c.id).join(",");
        return `Uni(${cs})`;
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExprs = this.children.map(s => s.constructExpr(symbols));
        return constructAlternation(...childExprs);
    }
}

export abstract class UnaryGrammar extends Grammar {

    constructor(
        public child: Grammar
    ) {
        super();
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child.potentiallyInfinite(stack);
    }

    public getChildren(): Grammar[] { 
        return [this.child]; 
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return this.child.constructExpr(symbols);
    }
}

abstract class BinaryGrammar extends Grammar {

    constructor(
        public child1: Grammar,
        public child2: Grammar
    ) {
        super();
    }
    
    public getChildren(): Grammar[] { 
        return [this.child1, this.child2];
    }
}

export class ShortGrammar extends UnaryGrammar {

    public get id(): string {
        return `Pref(${this.child.id})`;
    }
    
    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, cache);
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformShort(this, env);
    }
    
    public constructExpr(symbols: SymbolTable): Expr {
        const child = this.child.constructExpr(symbols);
        return constructShort(child);
    }
}

export class IntersectionGrammar extends BinaryGrammar {
    
    public get id(): string {
        return `Intersect(${this.child1.id},${this.child2.id})`;
    }
    
    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const result = super.getTapeClass(tapeName, cache);
        const child1Tapes = this.child1.tapes;
        const child2Tapes = this.child2.tapes;
        const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
        result.joinable ||= intersection.has(tapeName);
        return result;
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child1.potentiallyInfinite(stack) && 
                this.child2.potentiallyInfinite(stack);
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformIntersection(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const left = this.child1.constructExpr(symbols);
        const right = this.child2.constructExpr(symbols);
        return constructIntersection(left, right);
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

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformJoin(this, env);
    }
    
    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child1.potentiallyInfinite(stack) && 
                this.child2.potentiallyInfinite(stack);
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const result = super.getTapeClass(tapeName, cache);
        const child1Tapes = this.child1.tapes;
        const child2Tapes = this.child2.tapes;
        const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
        result.joinable ||= intersection.has(tapeName);
        return result;
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
        return constructJoin(this.child1.constructExpr(symbols), 
                                this.child2.constructExpr(symbols), 
                                    new Set(this.child1.tapes),
                                    new Set(this.child2.tapes));
    }

}

export class EqualsGrammar extends BinaryGrammar {

    public get id(): string {
        return `Filter(${this.child1.id},${this.child2.id})`;
    }
    
    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child1.potentiallyInfinite(stack) && 
                this.child2.potentiallyInfinite(stack);
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const result = super.getTapeClass(tapeName, cache);
        const child1Tapes = this.child1.tapes;
        const child2Tapes = this.child2.tapes;
        const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
        result.joinable ||= intersection.has(tapeName);
        return result;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformEquals(this, env);
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
        const expr1 = this.child1.constructExpr(symbols)
        const expr2 = this.constructFilter(symbols);
        const tapes = new Set(listIntersection(this.child1.tapes, this.child2.tapes));
        return constructFilter(expr1, expr2, tapes);   
    }

    protected constructFilter(symbols: SymbolTable) {
        return this.child2.constructExpr(symbols);
    }
}

export class CountGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public maxChars: number
    ) {
        super(child);
    }

    public get id(): string {
        return `Count(${this.maxChars},${this.child.id})`;
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.maxChars == Infinity
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformCount(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructCount(childExpr, this.maxChars);
    }
}

export class CountTapeGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public maxChars: number | {[tape: string]: number}
    ) {
        super(child);
    }

    public get id(): string {
        return `CountTape(${JSON.stringify(this.maxChars)},${this.child.id})`;
    }
    
    public potentiallyInfinite(stack: CounterStack): boolean {
        if (typeof(this.maxChars) == "number") {
            return this.maxChars == Infinity;
        }
        return Object.values(this.maxChars).some(n => n == Infinity);
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformCountTape(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        let maxCharsDict: {[tape: string]: number} = {};
        if (typeof this.maxChars == 'number') {
            for (const tape of this.tapes) {
                maxCharsDict[tape] = this.maxChars;
            }
        } else {
            maxCharsDict = this.maxChars;
        }
        const childExpr = this.child.constructExpr(symbols);
        return constructCountTape(childExpr, maxCharsDict);
    }
}

export class PriorityGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public tapePriority: string[]
    ) {
        super(child);
    }

    public get id(): string {
        return `Priority(${this.tapePriority},${this.child.id})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformPriority(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructPriority(this.tapePriority, childExpr);
    }
}

abstract class FilterGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        tapes: string[] | undefined = undefined
    ) {
        super(child);
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

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformStarts(this, env);
    }
}

export class EndsGrammar extends FilterGrammar {

    public get id(): string {
        return `EndsWithFilter(${this.child.id})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformEnds(this, env);
    }
}

export class ContainsGrammar extends FilterGrammar {

    public get id(): string {
        return `ContainsFilter(${this.child.id})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformContains(this, env);
    }
}

export class RenameGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }
    
    public get id(): string {
        return `Rename(${this.fromTape}>${this.toTape},${this.child.id})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformRename(this, env);
    }
    
    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        return this.child.getTapeClass(newTapeName, cache);
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

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructRename(childExpr, this.fromTape, this.toTape);
    }
}

export class RepeatGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public minReps: number = 0,
        public maxReps: number = Infinity
    ) {
        super(child);
    }

    public get id(): string {
        if (this.minReps == 0 && this.maxReps == Infinity) {
            return `(${this.child.id})*`;
        }
        return `Repeat(${this.child.id},${this.minReps},${this.maxReps})`;
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const result = this.child.getTapeClass(tapeName, cache);
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            result.concatenable = true;
        }
        return result;
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child.potentiallyInfinite(stack) || this.maxReps == Infinity;
    }
    
    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformRepeat(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructRepeat(childExpr, this.minReps, this.maxReps);
    }
}

export class NegationGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public maxReps: number = Infinity
    ) {
        super(child);
    }
    
    public get id(): string {
        return `Not(${this.child.id})`;
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, cache);
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformNegation(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructNegation(childExpr, new Set(this.child.tapes), this.maxReps);
    }
}

let HIDE_INDEX = 0; 
export class HideGrammar extends UnaryGrammar {

    public toTape: string;

    constructor(
        child: Grammar,
        public tapeName: string,
        public name: string = ""
    ) {
        super(child);
        if (name == "") {
            this.name = `HIDDEN${HIDE_INDEX}`;
            HIDE_INDEX++;
        }
        this.toTape = `${HIDDEN_TAPE_PREFIX}${name}_${tapeName}`;
    }
    
    public get id(): string {
        return `Hide(${this.child.id},${this.tapeName})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformHide(this, env);
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

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructRename(childExpr, this.tapeName, this.toTape);
    }
}

export class MatchFromGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public fromTape: string,
        public toTape: string,
        public vocabBypass: boolean = false
    ) {
        super(child);
    }

    public get id(): string {
        return `Match(${this.fromTape}->${this.toTape}:${this.child.id})`;
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        if (tapeName == this.fromTape || tapeName == this.toTape) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, cache);
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
    
    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformMatchFrom(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructMatchFrom(childExpr, this.fromTape, this.toTape);
    }
}

export class MatchGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public relevantTapes: Set<string>
    ) {
        super(child);
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        if (this.relevantTapes.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, cache);
    }

    public get id(): string {
        return `Match(${this.child.id},${[...this.relevantTapes]})`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformMatch(this, env);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        const childExpr = this.child.constructExpr(symbols);
        return constructMatch(childExpr, this.relevantTapes);
    }
}

export class NsGrammar extends Grammar {

    constructor(
        public symbols: Dict<Grammar> = {}
    ) {
        super();
    }

    public get id(): string {
        let results: string[] = [];
        for (const [k, v] of Object.entries(this.symbols)) {
            results.push(`${k}:${v.id}`);
        }
        return `Ns(\n  ${results.join("\n  ")}\n)`;
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return Object.values(this.symbols).some(
            c => c.potentiallyInfinite(stack));
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformNamespace(this, env);
    }

    public addSymbol(symbolName: string, g: Grammar): void {
        this.symbols[symbolName] = g;
    }

    public getDefaultSymbol(): Grammar {
        const size = Object.values(this.symbols).length;
        if (size == 0) {
            return new EpsilonGrammar();
        }
        return Object.values(this.symbols)[size-1].getDefaultSymbol();
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
        return Object.keys(this.symbols);
    }

    public getChildren(): Grammar[] { 
        const results: Grammar[] = [];
        for (const [name, referent] of Object.entries(this.symbols)) {
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
        for (const symbolName of Object.keys(this.symbols)) {
            if (name.toLowerCase() == symbolName.toLowerCase()) {
                const referent = this.symbols[symbolName];
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
            for (const referent of Object.values(this.symbols)) {
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
        for (const child of Object.values(this.symbols)) {
            child.collectVocab(tapeName, tapeNS, symbolsVisited);
        }
    }

    public constructExpr(symbols: SymbolTable): Expr {
        let result: Expr = EPSILON;
        for (const [name, referent] of Object.entries(this.symbols)) {
            if (name in symbols) {
                continue;  // don't bother, it won't have changed.
            }
            let expr = referent.constructExpr(symbols);
            //expr = constructMemo(expr, 3);
            symbols[name] = expr;
        }
        return result;
    }
}

export class EmbedGrammar extends AtomicGrammar {

    constructor(
        public name: string,
        public namespace: NsGrammar | undefined = undefined
    ) {
        super();
    }

    public get id(): string {
        return `Embed(${this.name})`;
    }
    
    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformEmbed(this, env);
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        const referent = this.getReferent();
        if (stack.get(this.name) >= 1) {
            // we're recursive, so potentially infinite
            return true;
        }
        const newStack = stack.add(this.name);
        return referent.potentiallyInfinite(newStack);
    }

    public getReferent(): Grammar {
        const referent = this.namespace?.getSymbol(this.name);
        if (referent == undefined) {
            //shouldn't happen!
            throw new Error(`Can't find ${this.name} in namespace, available: [${this.namespace?.allSymbols()}]`);
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
    
    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
    ): TapeClass {
        const key = `${this.name}__${tapeName}`
        if (key in cache) {
            return cache[key];
        }
        const result = this.getReferent().getTapeClass(tapeName, cache);
        cache[key] = result;
        return result;
    }

    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        const key = `${this.name}__${tapeName}`
        if (symbolsVisited.has(key)) {
            return;
        }
        symbolsVisited.add(key);
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
        return constructEmbed(this.name, symbols);
    }

}

/**
 * A LocatorGrammar is a semantically trivial grammar that 
 * associates a grammar with some location in a sheet
 */
export class LocatorGrammar extends UnaryGrammar {

    constructor(
        public cell: Cell,
        child: Grammar
    ) {
        super(child);
    }

    public get pos(): CellPos {
        return this.cell.pos;
    }

    public get locations(): Cell[] {
        return [this.cell];
    }


    public get id(): string {
        return `${this.cell.pos}@${this.child.id}`;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformLocator(this, env);
    }

    public getLiterals(): LiteralGrammar[] {
        return this.child.getLiterals();
    }

}

export class UnitTestGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public test: Grammar,
        public uniques: LiteralGrammar[] = []
    ) {
        super(child);
    }

    public get id(): string {
        return this.child.id;
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformUnitTest(this, env);
    }
    
    public collectVocab(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: Set<string>
    ): void { 
        this.child.collectVocab(tapeName, tapeNS, symbolsVisited);
        this.test.collectVocab(tapeName, tapeNS, symbolsVisited);
    }

    public constructExpr(symbols: SymbolTable): Expr {
        return this.child.constructExpr(symbols);
    }
}


export class NegativeUnitTestGrammar extends UnitTestGrammar {

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformNegativeUnitTest(this, env);
    }

}

export function Seq(...children: Grammar[]): SequenceGrammar {
    return new SequenceGrammar(children);
}

export function Par(...children: Grammar[]): ParallelGrammar {
    return new ParallelGrammar(children);
}

export function Uni(...children: Grammar[]): AlternationGrammar {
    return new AlternationGrammar(children);
}

export function Optional(child: Grammar): AlternationGrammar {
    return Uni(child, Epsilon());
}

export function CharSet(tape: string, chars: string[]): CharSetGrammar {
    return new CharSetGrammar(tape, chars);
}

export function Lit(tape: string, text: string): LiteralGrammar {
    return new LiteralGrammar(tape, text);
}

export function Any(tape: string): DotGrammar {
    return new DotGrammar(tape);
}

export function Intersect(child1: Grammar, child2: Grammar): IntersectionGrammar {
    return new IntersectionGrammar(child1, child2);
}

export function Equals(child1: Grammar, child2: Grammar): EqualsGrammar {
    return new EqualsGrammar(child1, child2);
}

export function Join(child1: Grammar, child2: Grammar): JoinGrammar {
    return new JoinGrammar(child1, child2);
}

export function Short(child: Grammar): ShortGrammar {
    return new ShortGrammar(child);
}

export function Starts(child1: Grammar, child2: Grammar): EqualsGrammar {
    const filter = new StartsGrammar(child2);
    return new EqualsGrammar(child1, filter);
}

export function Ends(child1: Grammar, child2: Grammar): EqualsGrammar {
    const filter = new EndsGrammar(child2);
    return new EqualsGrammar(child1, filter);
}

export function Contains(child1: Grammar, child2: Grammar): EqualsGrammar {
    const filter = new ContainsGrammar(child2);
    return new EqualsGrammar(child1, filter);
}

export function Rep(
    child: Grammar, 
    minReps: number = 0, 
    maxReps: number = Infinity
) {
    return new RepeatGrammar(child, minReps, maxReps);
}

export function Epsilon(): EpsilonGrammar {
    return new EpsilonGrammar();
}

export function Null(): NullGrammar {
    return new NullGrammar();
}

export function Embed(name: string): EmbedGrammar {
    return new EmbedGrammar(name);
}

export function Match(child: Grammar, ...tapes: string[]): MatchGrammar {
    return new MatchGrammar(child, new Set(tapes));
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
        result = new MatchFromGrammar(result, fromTape, tape);
    }
    return result;

    // Construct a Match for multiple tapes given a grammar for the first tape. 
    //return Match(Seq(state, ...otherTapes.map((t: string) => Rename(state, firstTape, t))),
    //             firstTape, ...otherTapes);
}

export function Rename(child: Grammar, fromTape: string, toTape: string): RenameGrammar {
    return new RenameGrammar(child, fromTape, toTape);
}

export function Not(child: Grammar, maxChars:number=Infinity): NegationGrammar {
    return new NegationGrammar(child, maxChars);
}

export function Ns(
    symbols: {[name: string]: Grammar} = {}
): NsGrammar {
    const result = new NsGrammar();
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.addSymbol(symbolName, component);
    }
    return result;
}

export function Hide(child: Grammar, tape: string, name: string = ""): HideGrammar {
    return new HideGrammar(child, tape, name);
}

export function Vocab(tape: string, text: string): Grammar {
    return Rep(Lit(tape, text), 0, 0)
}

export function Count(maxChars: number, child: Grammar): Grammar {
    return new CountGrammar(child, maxChars);
}

export function CountTape(maxChars: number | {[tape: string]: number}, child: Grammar): Grammar {
    return new CountTapeGrammar(child, maxChars);
}

export function Priority(tapes: string[], child: Grammar): Grammar {
    return new PriorityGrammar(child, tapes);
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
    return new ReplaceGrammar(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, maxExtraChars, maxCopyChars, vocabBypass, hiddenTapeName);
}

export function JoinReplace(
    child: Grammar,
    rules: ReplaceGrammar[],
): JoinReplaceGrammar {
    return new JoinReplaceGrammar(child, rules);
}

/**
 * JoinReplace is a special kind of join that understands how
 * tape renaming has to work in the case of replace rules
 */
export class JoinReplaceGrammar extends Grammar {

    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child.potentiallyInfinite(stack) &&
                this.rules.every(r => r.potentiallyInfinite(stack));
    }

    public get id(): string {
        const cs = this.rules.map(r => r.id).join(",");
        return `JoinReplace(${this.child.id},${cs})`;
    }

    //public renameTapeName: string | undefined = undefined;
    //public fromTapeName: string | undefined = undefined;
    //public renamedChild: GrammarComponent | undefined = undefined;
    protected ruleTapes: string[] = [];

    constructor(
        public child: Grammar,
        public rules: ReplaceGrammar[]
    ) {
        super();
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformJoinReplace(this, env);
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
                        //rule.message({
                        //    type: "error",
                        //    shortMsg: "Inconsistent from fields",
                        //    longMsg: "Each rule in a block of rules needs to " +
                        //     "agree on what the 'from' fields are. "
                        //});
                        continue;
                    }
                    fromTapeName = rule.fromTapeName;
                }

                let toTapeNames: string[] = [];
                if (rule.toTapeNames.length) {
                    if (toTapeNames.length && listDifference(toTapeNames, rule.toTapeNames).length) {
                        //rule.message({
                        //    type: "error",
                        //    shortMsg: "Inconsistent to fields",
                        //    longMsg: "All rules in a block of rules need to " +
                        //      "agree on what the 'to' fields are. "
                        //});
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
    return new JoinRuleGrammar(inputTape, child, rules);
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
        public inputTape: string,
        public child: Grammar,
        public rules: ReplaceGrammar[]
    ) {
        super();
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return this.child.potentiallyInfinite(stack) &&
                this.rules.every(r => r.potentiallyInfinite(stack));
    }

    public get id(): string {
        const cs = this.rules.map(r => r.id).join(",");
        return `JoinRule(${this.child.id},${cs})`;
    }
    
    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformJoinRule(this, env);
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

let REPLACE_INDEX = 0;
export class ReplaceGrammar extends Grammar {

    public get id(): string {
        return `Replace(${this.fromGrammar.id}->${this.toGrammar.id}|${this.preContext.id}_${this.postContext.id})`;
    }

    public potentiallyInfinite(stack: CounterStack): boolean {
        return true;
    }
    
    public fromTapeName: string = "__UNKNOWN_TAPE__";
    public toTapeNames: string[] = [];

    constructor(
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
        super();
        if (this.hiddenTapeName.length == 0) {
            this.hiddenTapeName = `${HIDDEN_TAPE_PREFIX}R${REPLACE_INDEX++}`;
        } else if (!this.hiddenTapeName.startsWith(HIDDEN_TAPE_PREFIX)) {
            this.hiddenTapeName = HIDDEN_TAPE_PREFIX + this.hiddenTapeName;
        }
    }

    public getTapeClass(
        tapeName: string, 
        cache: {[key: string]: TapeClass}
        ): TapeClass {
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, cache);
    }

    public accept(t: GrammarTransform, env: TransEnv): GrammarResult {
        return t.transformReplace(this, env);
    }

    public getChildren(): Grammar[] { 
        return [this.fromGrammar, this.toGrammar, this.preContext, this.postContext, this.otherContext];
    }

    public calculateTapes(stack: CounterStack): string[] {
        if (this._tapes == undefined) {
            this._tapes = super.calculateTapes(stack);
            if (this.toGrammar.tapes.length == 0) {
                //this.message({
                //    type: "error", 
                //    shortMsg: "At least 1 tape-'to' required", 
                //    longMsg: `The 'to' argument of a replacement must reference at least 1 tape; this references zero.`
                //});
            } else {
                this.toTapeNames.push(...this.toGrammar.tapes);
            }
            if (this.fromGrammar.tapes.length != 1) {
                //this.message({
                //    type: "error", 
                //    shortMsg: "Only 1-tape 'from' allowed", 
                //    longMsg: `The 'from' argument of a replacement can only reference 1 tape; this references ${this.fromGrammar.tapes?.length}.`
                //});
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

        // Determine whether the fromExpr in context is empty (on the fromTape).
        let emptyFromExpr: boolean = false;
        if (supersetVocab) {
            const tapeNS: TapeNamespace = this.getAllTapes();
            const fromExprWithContext: Expr = constructSequence(preContextExpr, fromExpr, postContextExpr);
            const opt: GenOptions = new GenOptions();
            const stack = new CounterStack(opt.maxRecursion);
            const env = new Env(tapeNS, stack, opt);
            const delta = fromExprWithContext.delta(this.fromTapeName, env);
            if (delta instanceof EpsilonExpr) {
                emptyFromExpr = true;
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
            if( !supersetVocab ||
                    emptyFromExpr ||
                    (that.beginsWith && !replaceNone) ||
                    (that.endsWith && !replaceNone)) {
                return constructMatchFrom(dotStar, that.fromTapeName, ...that.toTapeNames)
            }
            const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

            // figure out what tapes need to be negated
            const negatedTapes: string[] = [];
            negatedTapes.push(...that.fromGrammar.tapes);
            negatedTapes.push(...that.preContext.tapes);
            negatedTapes.push(...that.postContext.tapes);

            let notGrammar = constructNotContains(that.fromTapeName, 
                fromInstance, negatedTapes, that.beginsWith && replaceNone, that.endsWith && replaceNone, maxExtraChars);
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
