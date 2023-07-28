import { 
    CounterStack, Expr, EPSILON,
    constructRepeat, constructSequence, constructAlternation,
    constructIntersection, constructDot, constructEmbed,
    constructRename, constructNegation, NULL,
    constructFilter, constructJoin,
    constructLiteral, constructMatchFrom,
    constructPriority, EpsilonExpr, constructShort,
    constructPrecede, constructPreTape,
    constructNotContains, constructParallel, 
    ExprNamespace, constructCollection, 
    constructCorrespond, 
    constructDotStar,
    constructCount,
    CollectionExpr,
    constructCursor,
    constructStar
} from "./exprs";
import { 
    Result,
} from "./msgs";

import {
    renameTape,
    Tape, 
    TapeNamespace
} from "./tapes";
import { Pass, PassEnv } from "./passes";

import {
    CellPos,
    DEFAULT_SYMBOL_NAME,
    Dict,
    DUMMY_REGEX_TAPE,
    DUMMY_TAPE,
    flatten,
    HIDDEN_PREFIX,
    listDifference,
    listIntersection,
    listUnique,
    setUnion,
    StringDict,
    StringSet,
    tokenizeUnicode,
    ValueSet
} from "./util";

import { Component } from "./components";

export { CounterStack, Expr };

type TapeClass = {
    joinable: boolean,
    concatenable: boolean
};

type StringPair = [string, string];
class StringPairSet extends ValueSet<StringPair> { }

export class GrammarResult extends Result<Grammar> { }

export abstract class GrammarPass extends Pass<Grammar,Grammar> { 

    public transformRoot(g: Grammar, env: PassEnv): GrammarResult {
        g.calculateTapes(new CounterStack(2), env);
        return this.transform(g, env);
    }
}

export type LengthRange = {
    null: boolean,
    min: number,
    max: number
}

export type Grammar = EpsilonGrammar
             | NullGrammar
             | LiteralGrammar
             | DotGrammar
             | ParallelGrammar
             | SequenceGrammar
             | AlternationGrammar
             | ShortGrammar
             | IntersectionGrammar
             | JoinGrammar
             | FilterGrammar
             | CountGrammar
             | PriorityGrammar
             | StartsGrammar
             | EndsGrammar
             | ContainsGrammar
             | SingleTapeGrammar
             | RenameGrammar
             | RepeatGrammar
             | NegationGrammar
             | PreTapeGrammar
             | CursorGrammar
             | HideGrammar
             | MatchFromGrammar
//             | MatchGrammar
             | CollectionGrammar
             | EmbedGrammar
             | LocatorGrammar
             | TestGrammar
             | TestNotGrammar
             | JoinReplaceGrammar
             | JoinRuleGrammar
             | ReplaceGrammar
             | RuleContextGrammar;
/**
 * Grammar components represent the linguistic grammar that the
 * programmer is expressing (in terms of sequences, alternations, joins,
 * etc.), as opposed to its specific layout on the spreadsheet grids (the "tabular
 * syntax tree" or TST), but also as opposed to the specific algebraic expressions
 * that our Brzozowski-style algorithm is juggling (which are even lower-level; a 
 * single "operation" in our grammar might even correspond to a dozen or so lower-level
 * ops.)
 * 
 * It's the main level at which we (the compiler) can ask, "Does this grammar 
 * make any sense?  Do the symbols actually refer to defined things?  Is the 
 * programmer doing things like defining filters that can't possibly have any output
 * because they refer to non-existent fields?"
 * 
 * At the Grammar level we do the following operations.  Some of these are done
 * within the grammar objects themselves, others are performed by Passes.
 * 
 *   * qualifying and resolving symbol names (e.g., figuring out that
 *     a particular reference to VERB refers to, say, the VERB symbol in the
 *     IntransitiveVerbs collection, and qualifying that reference so that it
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
 *     changes to "b" on tape T, that's not really true underlying; in both
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

export abstract class AbstractGrammar extends Component {

    public mapChildren(f: GrammarPass, env: PassEnv): GrammarResult {
        return super.mapChildren(f, env) as GrammarResult;
    }

    public _tapes: string[] | undefined = undefined;

    public get tapes(): string[] {
        if (this._tapes == undefined) {
            throw new Error("Trying to get tapes before calculating them");
        }
        return this._tapes;
    }

    public get locations(): CellPos[] {
        return flatten(this.getChildren().map(c => c.locations));
    }

    /**
     * A string ID for the grammar, for debugging purposes.
     */
    public abstract get id(): string;

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
    public abstract estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange;
    
    public abstract getChildren(): Grammar[];

    public getAllTapePriority(
        tapeNS: TapeNamespace,
        env: PassEnv
    ): string[] {
        const tapeNames = this.calculateTapes(new CounterStack(2), env);
        const priorities: [string, number][] = tapeNames.map(t => {
            const joinWeight = this.getTapePriority(t, new StringPairSet(), env);
            const tape = tapeNS.get(t);
            const priority = joinWeight * Math.max(tape.vocab.size, 1);
            return [t, priority];
        });
        const result = priorities.filter(([t, priority]) => priority >= 0)
                         .sort((a, b) => b[1] - a[1])
                         .map(([a,_]) => a);
        return result;
    }
    
    public getTapePriority(
        tapeName: string,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        const priorities: number[] = [0];
        for (const child of this.getChildren()) {
            const childPriority = child.getTapePriority(tapeName, symbolsVisited, env);
            if (childPriority < 0) {
                return childPriority;
            }
            priorities.push(childPriority);
        }
        return Math.max(...priorities);
    }

    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     */
    public collectAllVocab(
        tapeNS: TapeNamespace,
        env: PassEnv
    ): void {
        const tapeNames = this.calculateTapes(new CounterStack(2), env);
        for (const tapeName of tapeNames) {
            const tapeInfo = this.getTapeClass(tapeName, new ValueSet(), env);
            const atomic = !tapeInfo.joinable || !tapeInfo.concatenable;
            let tape = tapeNS.attemptGet(tapeName);
            if (tape == undefined) {
                // make a new one if it doesn't exist
                const newTape = new Tape(tapeName, atomic);
                tapeNS.set(tapeName, newTape);
            } 
            tape = tapeNS.get(tapeName); 
            tape.atomic = atomic;
            const strs = this.collectVocab(tapeName, atomic, new StringPairSet(), env);
            tape.registerTokens([...strs]);
        }

        const vocabCopyEdges = new StringPairSet();
        for (const tapeName of tapeNames) {
            const edges = this.getVocabCopyEdges(tapeName, 
                tapeNS, new StringPairSet(), env);
            vocabCopyEdges.add(...edges);
        }
        
        let dirty: boolean = true;
        while (dirty) {
            dirty = false;
            for (const [fromTapeName, toTapeName] of vocabCopyEdges) {
                const fromTape = tapeNS.get(fromTapeName);
                const toTape = tapeNS.get(toTapeName);
                for (const c of fromTape.vocab) {
                    if (!toTape.vocab.has(c)) {
                        dirty = true;
                        toTape.registerTokens([c]);
                    }
                }
            }
        }
    }
    
    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        let result: TapeClass = { joinable: false, concatenable: false };
        for (const child of this.getChildren()) {
            const childTapeClass = child.getTapeClass(tapeName, symbolsVisited, env);
            result.joinable ||= childTapeClass.joinable;
            result.concatenable ||= childTapeClass.concatenable;
        }
        return result;
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        let vocab: StringSet = new Set();
        for (const child of this.getChildren()) {
            const childVocab = child.collectVocab(tapeName, atomic, symbolsVisited, env);
            vocab = setUnion(vocab, childVocab);
        }
        return vocab;
    }

    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        const results = new StringPairSet();
        for (const child of this.getChildren()) {
            results.add(...child.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, env));
        }
        return results;
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            const children = this.getChildren();
            //const children = this.getChildren().reverse();
            const childTapes = children.map(
                                s => s.calculateTapes(stack, env));
            this._tapes = listUnique(flatten(childTapes));
        }
        return this._tapes;
    }

    public abstract constructExpr(
        tapeNS: TapeNamespace
    ): Expr;
    
    public allSymbols(): string[] {
        return [];
    }
}

abstract class AtomicGrammar extends AbstractGrammar {

    public getChildren(): Grammar[] { return []; }

}

export class EpsilonGrammar extends AtomicGrammar {
    public readonly tag = "epsilon";
    
    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return { null: false, min: 0, max: 0 };
    }

    public get id(): string {
        return 'ε';
    }

    public getLiterals(): LiteralGrammar[] {
        return [];
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [ 
                //DUMMY_TAPE
            ];
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return EPSILON;
    }
}

export class NullGrammar extends AtomicGrammar {
    public readonly tag = "null";

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return { null: true, min: 0, max: 0 };
    }
    
    public get id(): string {
        return "∅";
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [ 
                //DUMMY_TAPE
            ];
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return NULL;
    }
}

export class LiteralGrammar extends AtomicGrammar {
    public readonly tag = "lit";
    
    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        if (tapeName != this.tapeName) return { null: false, min: 0, max: 0 };
        return { null: false, min: this.text.length, max: this.text.length };
    }

    protected tokens: string[] = [];

    constructor(
        public tapeName: string,
        public text: string
    ) {
        super();
        this.tokens = tokenizeUnicode(text);
    }

    public get id(): string {
        return `${this.tapeName}:${this.text}`;
    }

    public getLiterals(): LiteralGrammar[] {
        return [this];
    }

    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        return (tapeName == this.tapeName) ? 1 : 0;
    }
    
    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        if (tapeName != this.tapeName) {
            return new Set();
        }
        
        if (atomic) {
            return new Set([this.text]);
        }

        return new Set(this.tokens);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return constructLiteral(this.tapeName, this.text, this.tokens);
    }
}

export class DotGrammar extends AtomicGrammar {
    public readonly tag = "dot";

    constructor(
        public tapeName: string
    ) {
        super();
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        if (tapeName != this.tapeName) return { null: false, min: 0, max: 0 };
        return { null: false, min: 1, max: 1 };
    }

    public get id(): string {
        return `Dot(${this.tapeName})`;
    }
    
    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        return (tapeName == this.tapeName) ? 1 : 0;
    }
    
    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        if (tapeName == this.tapeName) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [this.tapeName];
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return constructDot(this.tapeName);
    }
}

abstract class NAryGrammar extends AbstractGrammar {

    constructor(
        public children: Grammar[]
    ) {
        super();
    }
    
    public getChildren(): Grammar[] { 
        return this.children; 
    }

}

export class ParallelGrammar extends NAryGrammar {
    public readonly tag = "parallel";

    public get id(): string {
        const cs = this.children.map(c => c.id).join(",");
        return `Par(${cs})`;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExprs: Dict<Expr> = {};
        for (const child of this.children) {
            if (child.tapes.length != 1) {
                throw new Error(`Each child of par must have 1 tape`);
            }
            const tapeName = child.tapes[0];
            if (tapeName in childExprs) {
                throw new Error(`Each child of par must have a unique tape`)
            }
            const newChild = child.constructExpr(tapeNS);
            childExprs[tapeName] = newChild;
        }
        return constructParallel(childExprs);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        let min = 0;
        let max = 0;
        for (const child of this.children) {
            const childLength = child.estimateLength(tapeName, stack, env);
            if (childLength.null) { return childLength; } // short-circuit if null
            min += childLength.min;
            max += childLength.max;
        }
        return { null: false, min: min, max: max };
    }

}

export class SequenceGrammar extends NAryGrammar {
    public readonly tag = "seq";

    public get id(): string {
        return this.children.map(c => c.id).join("+");
    }

    public getLiterals(): LiteralGrammar[] {
        return flatten(this.children.map(c => c.getLiterals()));
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet, 
        env: PassEnv
    ): TapeClass {
        const result = super.getTapeClass(tapeName, symbolsVisited, env);
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

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExprs = this.children.map(s => s.constructExpr(tapeNS));
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

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        let min = 0;
        let max = 0;
        for (const child of this.children) {
            const childLength = child.estimateLength(tapeName, stack, env);
            if (childLength.null) { return childLength; } // short-circuit if null
            min += childLength.min;
            max += childLength.max;
        }
        return { null: false, min: min, max: max };
    }
}

export class AlternationGrammar extends NAryGrammar {
    public readonly tag = "alt";

    public get id(): string {
        return this.children.map(c => c.id).join("|");
    }

    public constructExpr(
        tapeNS: TapeNamespace,
    ): Expr {
        const childExprs = this.children.map(s => s.constructExpr(tapeNS));
        return constructAlternation(...childExprs);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        let min = Infinity;
        let max = 0;
        if (this.children.length == 0) {
            return { null: true, min: min, max: max };
        }
        for (const child of this.children) {
            const childLength = child.estimateLength(tapeName, stack, env);
            if (childLength.null) continue;
            min = Math.min(min, childLength.min);
            max = Math.max(max, childLength.max);
        }
        return { null: false, min: min, max: max };
    }
}

export abstract class UnaryGrammar extends AbstractGrammar {

    constructor(
        public child: Grammar
    ) {
        super();
    }

    public getChildren(): Grammar[] { 
        return [this.child]; 
    }

    public constructExpr(
        tapeNS: TapeNamespace,
    ): Expr {
        return this.child.constructExpr(tapeNS);
    }
}

abstract class BinaryGrammar extends AbstractGrammar {

    constructor(
        public child1: Grammar,
        public child2: Grammar
    ) {
        super();
    }
    
    public getChildren(): Grammar[] { 
        return [this.child1, this.child2];
    }
    
    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        const c1priority = this.child1.getTapePriority(tapeName, symbolsVisited, env);
        const c2priority = this.child2.getTapePriority(tapeName, symbolsVisited, env);
        return (c1priority * 10 + c2priority);
    }
}

export class ShortGrammar extends UnaryGrammar {
    public readonly tag = "short";

    public get id(): string {
        return `Pref(${this.child.id})`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }
    
    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const child = this.child.constructExpr(tapeNS);
        return constructShort(child);
    }
}

export class IntersectionGrammar extends BinaryGrammar {
    public readonly tag = "intersect";

    public get id(): string {
        return `Intersect(${this.child1.id},${this.child2.id})`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const child1Length = this.child1.estimateLength(tapeName, stack, env);
        const child2Length = this.child2.estimateLength(tapeName, stack, env);
        if (child1Length.null == true || child2Length.null == true) {
            return { null: true, min: 0, max: 0 };
        }
        return { 
            null: false,
            min: Math.max(child1Length.min, child2Length.min),
            max: Math.min(child1Length.max, child2Length.max)
        }
    }
    
    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const result = super.getTapeClass(tapeName, symbolsVisited, env);
        const child1Tapes = this.child1.tapes;
        const child2Tapes = this.child2.tapes;
        const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
        result.joinable ||= intersection.has(tapeName);
        return result;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const left = this.child1.constructExpr(tapeNS);
        const right = this.child2.constructExpr(tapeNS);
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
    public readonly tag = "join";

    public get id(): string {
        return `Join(${this.child1.id},${this.child2.id})`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const child1Length = this.child1.estimateLength(tapeName, stack, env);
        const child2Length = this.child2.estimateLength(tapeName, stack, env);
        if (child1Length.null == true || child2Length.null == true) {
            return { null: true, min: 0, max: 0 };
        }
        return { 
            null: false,
            min: Math.max(child1Length.min, child2Length.min),
            max: Math.min(child1Length.max, child2Length.max)
        }
    }
    

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const result = super.getTapeClass(tapeName, symbolsVisited, env);
        const child1Tapes = this.child1.tapes;
        const child2Tapes = this.child2.tapes;
        const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
        result.joinable ||= intersection.has(tapeName);
        return result;
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            const child1Tapes = this.child1.calculateTapes(stack, env);
            const child2Tapes = this.child2.calculateTapes(stack, env);
            const intersection = listIntersection(child1Tapes, child2Tapes);
            this._tapes = listUnique([...intersection, ...child1Tapes, ...child2Tapes]);
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return constructJoin(this.child1.constructExpr(tapeNS), 
                                this.child2.constructExpr(tapeNS), 
                                    new Set(this.child1.tapes),
                                    new Set(this.child2.tapes));
    }

}

export class FilterGrammar extends BinaryGrammar {
    public readonly tag = "filter";

    public get id(): string {
        return `Filter(${this.child1.id},${this.child2.id})`;
    }
    

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const child1Length = this.child1.estimateLength(tapeName, stack, env);
        const child2Length = this.child2.estimateLength(tapeName, stack, env);
        if (child1Length.null == true || child2Length.null == true) {
            return { null: true, min: 0, max: 0 };
        }
        return { 
            null: false,
            min: Math.max(child1Length.min, child2Length.min),
            max: Math.min(child1Length.max, child2Length.max)
        }
    }
    

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const result = super.getTapeClass(tapeName, symbolsVisited, env);
        const child1Tapes = this.child1.tapes;
        const child2Tapes = this.child2.tapes;
        const intersection = new Set(listIntersection(child1Tapes, child2Tapes));
        result.joinable ||= intersection.has(tapeName);
        return result;
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            const child1Tapes = this.child1.calculateTapes(stack, env);
            const child2Tapes = this.child2.calculateTapes(stack, env);
            this._tapes = listUnique([...child2Tapes, ...child1Tapes]);
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const expr1 = this.child1.constructExpr(tapeNS);
        const expr2 = this.child2.constructExpr(tapeNS);
        const tapes = new Set(listIntersection(this.child1.tapes, this.child2.tapes));
        return constructFilter(expr1, expr2, tapes);   
    }
}

export class CountGrammar extends UnaryGrammar {
    public readonly tag = "count";

    constructor(
        child: Grammar,
        public tapeName: string,
        public maxChars: number,
        public countEpsilon: boolean,
        public errorOnCountExceeded: boolean,
    ) {
        super(child);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const childLength = this.child.estimateLength(tapeName, stack, env);
        if (tapeName != this.tapeName) return childLength;
        return {
            null: childLength.null,
            min: childLength.min,
            max: Math.min(childLength.max, this.maxChars)
        }
    }

    public get id(): string {
        return `Count_${this.tapeName}:${this.maxChars}(${this.child.id})`;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        let childExpr = this.child.constructExpr(tapeNS);
        return constructCount(childExpr, this.tapeName, this.maxChars,
                              this.countEpsilon, this.errorOnCountExceeded);
    }
}

export class PriorityGrammar extends UnaryGrammar {
    public readonly tag = "priority";
    
    constructor(
        child: Grammar,
        public tapePriority: string[]
    ) {
        super(child);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public get id(): string {
        return `Priority(${this.tapePriority},${this.child.id})`;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        console.log(`Constructing priority with tapes ${this.tapePriority}`);
        const childExpr = this.child.constructExpr(tapeNS);
        if (this.tapePriority.length == 0) {
            return childExpr;
        }
        return constructPriority(this.tapePriority, childExpr);
    }
}

abstract class ConditionGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        tapes: string[] | undefined = undefined
    ) {
        super(child);
        this._tapes = tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        // All descendants of Condition should have been replaced by
        // other grammars by the time exprs are constructed.
        throw new Error("not implemented");
    }
}

export class StartsGrammar extends ConditionGrammar {
    public readonly tag = "starts";

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const childLength = this.child.estimateLength(tapeName, stack, env);
        return {
            null: childLength.null,
            min: childLength.min,
            max: Infinity
        };
    }

    public get id(): string {
        return `Starts(${this.child.id})`;
    }
}

export class EndsGrammar extends ConditionGrammar {
    public readonly tag = "ends";

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const childLength = this.child.estimateLength(tapeName, stack, env);
        return {
            null: childLength.null,
            min: childLength.min,
            max: Infinity
        };
    }

    public get id(): string {
        return `Ends(${this.child.id})`;
    }
}

export class ContainsGrammar extends ConditionGrammar {
    public readonly tag = "contains";

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const childLength = this.child.estimateLength(tapeName, stack, env);
        return {
            null: childLength.null,
            min: childLength.min,
            max: Infinity
        };
    }

    public get id(): string {
        return `Contains(${this.child.id})`;
    }
}

/** This is used internally, to wrap potentially complex grammars
 * so that they work in contexts where only grammars with single 
 * tapes are permitted.
 * 
 * For example, "equals text: q{HighVowel}".  HighVowel might 
 * define multiple tapes, but for this purpose we only care about 
 * its text tape, and the others have to be hidden.  (Not thrown out
 * or ignored, just hidden.)
 * 
 * But when we create this header/regex combination, we don't yet know
 * what HighVowel refers to or what tapes it defines; we only learn that
 * in later stages.  This grammar is a kind of stub that wraps the regex
 * and sticks around until we have that information, at which point we can
 * create the appropriate structures. 
 * 
 */
export class SingleTapeGrammar extends UnaryGrammar {
    public readonly tag = "singletape";

    constructor(
        public tapeName: string,
        child: Grammar
    ) {
        super(child);
    }

    public get id(): string {
        return `Tape<${this.tapeName}>(${this.child.id}`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            // in the scope of a SingleTapeGrammar, there are often
            // grammars with the dummy tape .T.  We don't want to consider
            // this as a genuine tape outside of this scope, outside of this
            // scope that will be tapeName.  
            for (const tapeName of this.child.calculateTapes(stack, env)) {
                if (tapeName == DUMMY_REGEX_TAPE) {
                    this._tapes.push(this.tapeName);
                } else {
                    this._tapes.push(tapeName);
                }
            }
            this._tapes = listUnique(this._tapes);
        }
        return this._tapes;
    }
    
    public getLiterals(): LiteralGrammar[] {
        return this.child.getLiterals()
                    .map(c => {
                        if (c.tapeName == DUMMY_REGEX_TAPE) {
                            return new LiteralGrammar(this.tapeName, c.text);
                        }
                        return c;
                    });
    }

}
function update<T>(orig: T, update: any): T {
    let clone = Object.create(Object.getPrototypeOf(orig));
    Object.assign(clone, orig);
    Object.assign(clone, update);
    clone._tapes = undefined;
    return clone as T;
}

export class RenameGrammar extends UnaryGrammar {
    public readonly tag = "rename";

    constructor(
        child: Grammar,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
    }
    
    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return { null: false, min: 0, max: 0 };
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        return this.child.estimateLength(newTapeName, stack, env);
    }

    public get id(): string {
        return `${this.toTape}<-${this.fromTape}(${this.child.id})`;
    }

    public getLiterals(): LiteralGrammar[] {
        return this.child.getLiterals()
                    .map(c => {
                        if (c.tapeName == this.fromTape) {
                            return new LiteralGrammar(this.toTape, c.text);
                        }
                        return c;
                    });
    }

    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return 0;
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        return this.child.getTapePriority(newTapeName, symbolsVisited, env);
    }
    
    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return {joinable: false, concatenable: false};
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        return this.child.getTapeClass(newTapeName, symbolsVisited, env);
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        if (tapeName != this.toTape && tapeName == this.fromTape) {
            return new Set();
        }

        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        return this.child.collectVocab(newTapeName, atomic, symbolsVisited, env);
    }

    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        const newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
        const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
        return this.child.getVocabCopyEdges(newTapeName, newTapeNS, symbolsVisited, env);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            for (const tapeName of this.child.calculateTapes(stack, env)) {
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

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const newTapeNS = tapeNS.rename(this.toTape, this.fromTape);
        const childExpr = this.child.constructExpr(newTapeNS);
        return constructRename(childExpr, this.fromTape, this.toTape);
    }
}

export class RepeatGrammar extends UnaryGrammar {
    public readonly tag = "repeat";

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
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const result = this.child.getTapeClass(tapeName, symbolsVisited, env);
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            result.concatenable = true;
        }
        return result;
    }
    
    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        const childLength = this.child.estimateLength(tapeName, stack, env);
        return {
            null: childLength.null,
            min: childLength.min * this.minReps,
            max: childLength.max * this.maxReps
        };
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructRepeat(childExpr, this.minReps, this.maxReps);
    }
}

export class NegationGrammar extends UnaryGrammar {
    public readonly tag = "not";

    public get id(): string {
        return `Not(${this.child.id})`;
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return {
            null: false,
            min: 0,
            max: Infinity,
        };
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructNegation(childExpr, new Set(this.child.tapes));
    }
}

export class CursorGrammar extends UnaryGrammar {
    public readonly tag = "cursor";

    constructor(
        public tape: string,
        child: Grammar
    ) {
        super(child);
    }

    public get id(): string {
        return `Pre(${this.child.id})`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public getTapePriority(
        tapeName: string,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        if (tapeName == this.tape) {
            return -1;
        }
        return super.getTapePriority(tapeName, symbolsVisited, env);
    }

    public constructExpr(tapeNS: TapeNamespace): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructCursor(this.tape, childExpr);
    }

}

export function Taper(tape: string, child: Grammar): CursorGrammar {
    return new CursorGrammar(tape, child);
}


export class PreTapeGrammar extends UnaryGrammar {
    public readonly tag = "pretape";

    constructor(
        public fromTape: string,
        public toTape: string,
        child: Grammar
    ) {
        super(child);
    }

    public get id(): string {
        return `Pre(${this.child.id})`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public getTapePriority(
        tapeName: string,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        if (tapeName == this.fromTape) {
            return -1;
        }
        return super.getTapePriority(tapeName, symbolsVisited, env);
    }

    public constructExpr(tapeNS: TapeNamespace): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructPreTape(this.fromTape, this.toTape, childExpr);
    }

}


let HIDE_INDEX = 0; 
export class HideGrammar extends UnaryGrammar {
    public readonly tag = "hide";

    constructor(
        child: Grammar,
        public tapeName: string,
        public toTape: string = ""
    ) {
        super(child);
        if (toTape == "") {
            this.toTape = `${HIDDEN_PREFIX}H${HIDE_INDEX++}_${tapeName}`;
        } else if (!toTape.startsWith(HIDDEN_PREFIX)) {
            this.toTape = `${HIDDEN_PREFIX}${toTape}`;
        }
    }
    
    public get id(): string {
        return `Hide(${this.child.id},${this.tapeName})`;
    }
    
    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        if (tapeName != this.toTape && tapeName == this.tapeName) {
            return 0;
        }
        const newTapeName = renameTape(tapeName, this.toTape, this.tapeName);
        return this.child.getTapePriority(newTapeName, symbolsVisited, env);
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        if (tapeName != this.toTape && tapeName == this.tapeName) {
            return {joinable: false, concatenable: false};
        }
        const newTapeName = renameTape(tapeName, this.toTape, this.tapeName);
        return this.child.getTapeClass(newTapeName, symbolsVisited, env);
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        if (tapeName != this.toTape && tapeName == this.tapeName) {
            return new Set();
        }
        const newTapeName = renameTape(tapeName, this.toTape, this.tapeName);
        return this.child.collectVocab(newTapeName, atomic, symbolsVisited, env);
    }
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        const newTapeName = renameTape(tapeName, this.toTape, this.tapeName);
        const newTapeNS = tapeNS.rename(this.toTape, this.tapeName);
        return this.child.getVocabCopyEdges(newTapeName, newTapeNS, symbolsVisited, env);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            for (const tapeName of this.child.calculateTapes(stack, env)) {
                if (tapeName == this.tapeName) {
                    this._tapes.push(this.toTape);
                } else {
                    this._tapes.push(tapeName);
                }
            }
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructRename(childExpr, this.tapeName, this.toTape);
    }
    
    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        if (tapeName != this.toTape && tapeName == this.tapeName) {
            return { null: false, min: 0, max: 0 };
        }
        const newTapeName = renameTape(tapeName, this.toTape, this.tapeName);
        return this.child.estimateLength(newTapeName, stack, env);
    }
}

export class MatchFromGrammar extends UnaryGrammar {
    public readonly tag = "matchfrom";

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
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        if (tapeName == this.fromTape || tapeName == this.toTape) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    /**
     * For the purposes of calculating what tapes exist, we consider
     * both MatchGrammar.fromTape and .toTape to exist even if they 
     * appear nowhere else in the grammar.
     */
    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = listUnique([
                ...this.child.calculateTapes(stack, env),
                this.fromTape,
                this.toTape
            ]);
        }
        return this._tapes;
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        // collect from the child as-is
        let childVocab = this.child.collectVocab(tapeName, atomic, symbolsVisited, env);

        if (tapeName == this.toTape) {
            // also collect as a rename
            let newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            const renameVocab = this.child.collectVocab(newTapeName, atomic, symbolsVisited, env);
            childVocab = setUnion(childVocab, renameVocab);
        }

        return childVocab;

    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        if (tapeName == this.toTape) {
            // also collect as a rename
            let newTapeName = renameTape(tapeName, this.toTape, this.fromTape);
            return this.child.estimateLength(newTapeName, stack, env);
        }

        return this.child.estimateLength(tapeName, stack, env);
    }

    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        const results = super.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, env);
        if (this.vocabBypass && tapeName == this.fromTape) {    
            results.add([this.fromTape, this.toTape]);
        }
        return results;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructMatchFrom(childExpr, this.fromTape, this.toTape);
    }
}

/*
export class MatchGrammar extends UnaryGrammar {
    public readonly tag = "match";
    
    constructor(
        child: Grammar,
        public relevantTapes: StringSet
    ) {
        super(child);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        if (this.relevantTapes.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    public get id(): string {
        return `Match(${this.child.id},${[...this.relevantTapes]})`;
    }

    public constructExpr(
        tapeNS: TapeNamespace,
        symbols: ExprNamespace
    ): Expr {
        const childExpr = this.child.constructExpr(tapeNS, symbols);
        return constructMatch(childExpr, this.relevantTapes);
    }
}
*/

/**
 * A TapeNsGrammar encapsulates amd memoizes the results 
 * of vocab collection: it stores a common vocab for all the 
 * tapes, a namespace for holding the tapes, and vocab-bypass 
 * relationships between the tapes.
 */
/*
export class TapeNsGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public tapeDict: Dict<Tape> = {},
        public vocabEdges: StringPairSet = new StringPairSet()
    ) {
        super(child);
    }

    public get id(): string {
        return `<tapes>${this.child.id}`;
    }

    public mapChildren(f: GrammarPass, env: PassEnv): GrammarResult {
        return result(this.child)
                    .bind(c => f.transform(c, env))
                    .bind(c => new TapeNsGrammar(c, 
                        this.tapeDict, this.vocabEdges))
    }

    public getChildren(): Grammar[] { 
        return [this.child]; 
    }
    
    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        return new Set();
    }
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: StringPairSet, 
        env: PassEnv
    ): StringPairSet {
        return this.vocabEdges;
    }

    public constructExpr(
        tapeNS: TapeNamespace,
        symbols: ExprNamespace
    ): Expr {
        const newTapeNS = new TapeNamespace(this.tapeDict, tapeNS);
        return this.child.constructExpr(newTapeNS, symbols);
    }

}
*/

export class CollectionGrammar extends AbstractGrammar {
    public readonly tag = "collection";

    constructor(
        public symbols: Dict<Grammar> = {},
        public selectedSymbol: string = DEFAULT_SYMBOL_NAME
    ) {
        super();
    }
    
    public mapChildren(f: GrammarPass, env: PassEnv): GrammarResult {
        const newEnv = env.pushSymbols(this.symbols);
        return super.mapChildren(f, newEnv);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return { null: false, min: 0, max: 0 };
    }

    public selectSymbol(symbolName: string): CollectionGrammar {
        const referent = this.getSymbol(symbolName);
        if (referent == undefined) {
            throw new Error(`cannot find symbol ${symbolName}, candidates are ${Object.keys(this.symbols)}`);
        }
        return new CollectionGrammar(this.symbols, 
                            //this.aliases, 
                            symbolName);
    }

    public get id(): string {
        let results: string[] = [];
        for (const [k, v] of Object.entries(this.symbols)) {
            results.push(`${k}:${v.id}`);
        }
        return `Ns(\n  ${results.join("\n  ")}\n)`;
    }

    public allSymbols(): string[] {
        return Object.keys(this.symbols);
    }

    public getChildren(): Grammar[] { 
        return Object.values(this.symbols);
    }

    /**
     * Looks up a symbol name and returns the referent (if any) 
     */
    public getSymbol(name: string): Grammar | undefined {
        for (const symbolName of Object.keys(this.symbols)) {
            if (name.toLowerCase() == symbolName.toLowerCase()) {
                return this.symbols[symbolName];
            }
        }
        return undefined;
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
            for (const referent of Object.values(this.symbols)) {
                const newEnv = env.pushSymbols(this.symbols);
                const tapes = referent.calculateTapes(stack, newEnv);
                this._tapes.push(...tapes);
            }
            this._tapes = listUnique(this._tapes);
        }
        return this._tapes;
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        let vocab: StringSet = new Set();
        const newEnv = env.pushSymbols(this.symbols);
        for (const child of Object.values(this.symbols)) {
            const childVocab = child.collectVocab(tapeName, atomic, symbolsVisited, newEnv);
            vocab = setUnion(vocab, childVocab);
        }
        return vocab;
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet, 
        env: PassEnv
    ): TapeClass {
        const newEnv = env.pushSymbols(this.symbols);
        return super.getTapeClass(tapeName, symbolsVisited, newEnv);
    }
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: StringPairSet, 
        env: PassEnv
    ): StringPairSet {
        const newEnv = env.pushSymbols(this.symbols);
        return super.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, newEnv);    
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        let newSymbols: Dict<Expr> = {};
        let selectedExpr: Expr = EPSILON;
        let selectedFound = false;
        //const newSymbolNS = symbols.push(newSymbols);
        for (const [name, referent] of Object.entries(this.symbols)) {
            let expr = referent.constructExpr(tapeNS);
            newSymbols[name] = expr;
            if (name.toLowerCase() == this.selectedSymbol.toLowerCase()) {
                selectedExpr = expr;
                selectedFound = true;
            }
        }
        if (selectedFound) {
            return constructCollection(selectedExpr, newSymbols);
        }
        return new CollectionExpr(selectedExpr, newSymbols);
    }
}

export class EmbedGrammar extends AtomicGrammar {
    public readonly tag = "embed";

    constructor(
        public name: string
    ) {
        super();
    }

    public get id(): string {
        return `{${this.name}}`;
    }

    public estimateLength(
        tapeName: string,
        stack: CounterStack,
        env: PassEnv
    ): LengthRange {
        if (stack.get(this.name) >= 1) {
            // we're recursive, so potentially infinite
            return { null: false, min: 0, max: Infinity };
        }
        const newStack = stack.add(this.name);
        const referent = env.symbolNS.get(this.name);
        return referent.estimateLength(tapeName, newStack, env);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            if (stack.exceedsMax(this.name)) {
                this._tapes = [];
            } else {
                const newStack = stack.add(this.name);
                let referent = env.symbolNS.get(this.name);
                this._tapes = referent.calculateTapes(newStack, env);
                if (this._tapes == undefined) {
                    throw new Error(`undefined tapes in referent ${this.name}`);
                }
            }
        }
        return this._tapes;
    }
    
    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        if (symbolsVisited.has([this.name, tapeName])) { 
            return 0;
        }
        symbolsVisited.add([this.name, tapeName]);
        const referent = env.symbolNS.get(this.name);
        return referent.getTapePriority(tapeName, symbolsVisited, env);
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        if (symbolsVisited.has([this.name, tapeName])) { 
            // we already visited.  these might be true or false,
            // but we can just return false here because if it's 
            // true in other contexts it'll end up true in the end
            return { joinable: false, concatenable: false };
        }
        symbolsVisited.add([this.name, tapeName]);
        const referent = env.symbolNS.get(this.name);
        return referent.getTapeClass(tapeName, symbolsVisited, env);
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        if (symbolsVisited.has([this.name, tapeName])) {
            return new Set();
        }
        symbolsVisited.add([this.name, tapeName]);
        const referent = env.symbolNS.get(this.name);
        return referent.collectVocab(tapeName, atomic, symbolsVisited, env);
    }
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        if (symbolsVisited.has([this.name, tapeName])) {
            return new StringPairSet();
        }
        symbolsVisited.add([this.name, tapeName]);
        const referent = env.symbolNS.get(this.name);
        return referent.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, env);
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return constructEmbed(this.name, undefined);
    }

}

/**
 * A LocatorGrammar is a semantically trivial grammar that 
 * associates a grammar with some location in a sheet
 */
export class LocatorGrammar extends UnaryGrammar {
    public readonly tag = "locator";

    constructor(
        public position: CellPos,
        child: Grammar
    ) {
        super(child);
    }
    
    public mapChildren(f: GrammarPass, env: PassEnv): GrammarResult {
        return super.mapChildren(f, env)
                    .localize(this.pos);
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public get pos(): CellPos {
        return this.position;
    }

    public get locations(): CellPos[] {
        return [this.position];
    }

    public get id(): string {
        return this.child.id;
        //return `${this.pos}@${this.child.id}`;
    }

    public getLiterals(): LiteralGrammar[] {
        return this.child.getLiterals();
    }

}

export abstract class AbstractTestGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public test: Grammar,
        public uniques: LiteralGrammar[] = []
    ) {
        super(child);
    }
    
    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public get id(): string {
        return this.child.id;
    }
    
    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        const childVocab = this.child.collectVocab(tapeName, atomic, symbolsVisited, env);
        const testVocab = this.test.collectVocab(tapeName, atomic, symbolsVisited, env);
        return setUnion(childVocab, testVocab);
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return this.child.constructExpr(tapeNS);
    }
}

export class TestGrammar extends AbstractTestGrammar {
    public readonly tag = "test";
}

export class TestNotGrammar extends AbstractTestGrammar {
    public readonly tag = "testnot";
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

export function CharSet(tape: string, chars: string[]): Grammar {
    return new AlternationGrammar(chars.map(c => Lit(tape, c)));
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

export function Filter(child1: Grammar, child2: Grammar): FilterGrammar {
    return new FilterGrammar(child1, child2);
}

export function Join(child1: Grammar, child2: Grammar): JoinGrammar {
    return new JoinGrammar(child1, child2);
}

export function Short(child: Grammar): ShortGrammar {
    return new ShortGrammar(child);
}

export function Starts(child1: Grammar, child2: Grammar): JoinGrammar {
    const filter = new StartsGrammar(child2);
    return new JoinGrammar(child1, filter);
}

export function Ends(child1: Grammar, child2: Grammar): JoinGrammar {
    const filter = new EndsGrammar(child2);
    return new JoinGrammar(child1, filter);
}

export function Contains(child1: Grammar, child2: Grammar): JoinGrammar {
    const filter = new ContainsGrammar(child2);
    return new JoinGrammar(child1, filter);
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

/*
export function Match(child: Grammar, ...tapes: string[]): MatchGrammar {
    return new MatchGrammar(child, new Set(tapes));
}
*/

export function Dot(...tapes: string[]): SequenceGrammar {
    return Seq(...tapes.map(t => Any(t)));
}

/*
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
*/

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

export function Not(child: Grammar): NegationGrammar {
    return new NegationGrammar(child);
}

export function Collection(
    symbols: Dict<Grammar> = {}
): CollectionGrammar {
    const result = new CollectionGrammar();
    for (const [symbolName, component] of Object.entries(symbols)) {
        result.symbols[symbolName] = component;
    }
    return result;
}

export function Hide(child: Grammar, tape: string, toTape: string = ""): HideGrammar {
    return new HideGrammar(child, tape, toTape);
}

export function Vocab(arg1: string | StringDict, arg2: string = ""): Grammar {
    if (typeof arg1 == 'string') {
        return Rep(Lit(arg1, arg2), 0, 0)
    } else {
        let vocabGrammars: LiteralGrammar[] = [];
        for (const tape in arg1 as StringDict) {
            vocabGrammars.push(Lit(tape, arg1[tape]));
        }
        return Rep(Seq(...vocabGrammars), 0, 0);
    }
}

export function Count(
    maxChars: Dict<number>,
    child: Grammar,
    countEpsilon: boolean = false,
    errorOnCountExceeded: boolean = false
): Grammar {
    let result = child;
    for (const [tapeName, max] of Object.entries(maxChars)) {
        result = new CountGrammar(result, tapeName, max,
                                  countEpsilon, errorOnCountExceeded);
    }
    return result;
}

export function Cursor(tape: string | string[], child: Grammar): Grammar {
    let result = child;
    if (!Array.isArray(tape)) tape = [tape];
    for (const t of tape) {
        result = new CursorGrammar(t, result);   
    }
    return result;
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
*/
export function Replace(
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    hiddenTapeName: string = ""
): ReplaceGrammar {
    return new ReplaceGrammar(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, hiddenTapeName, false);
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
*/
export function OptionalReplace(
    fromGrammar: Grammar, toGrammar: Grammar,
    preContext: Grammar = Epsilon(), postContext: Grammar = Epsilon(),
    otherContext: Grammar = Epsilon(),
    beginsWith: boolean = false, endsWith: boolean = false,
    minReps: number = 0, maxReps: number = Infinity,
    hiddenTapeName: string = ""
): ReplaceGrammar {
    return new ReplaceGrammar(fromGrammar, toGrammar, 
        preContext, postContext, otherContext, beginsWith, endsWith, 
        minReps, maxReps, hiddenTapeName, true);
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
export class JoinReplaceGrammar extends AbstractGrammar {
    public readonly tag = "joinreplace";

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
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
        public rules: (ReplaceGrammar|EpsilonGrammar)[]
    ) {
        super();
    }

    public getChildren(): Grammar[] {
        return [ this.child, ...this.rules ];
    }
    
    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {

            for (const rule of this.rules) {

                if (rule instanceof EpsilonGrammar) continue;

                // iterate through the rules to see what tape needs to be renamed, and to what
                this.ruleTapes.push(...rule.calculateTapes(stack, env));

                let fromTapeName: string | undefined = undefined;
                if (rule._fromTapeName != undefined) {
                    if (fromTapeName != undefined && fromTapeName != rule._fromTapeName) {
                        continue;
                    }
                    fromTapeName = rule._fromTapeName;
                }

                let toTapeNames: string[] = [];
                if (rule._toTapeNames !== undefined 
                            && rule._toTapeNames.length) {
                    if (toTapeNames.length && listDifference(toTapeNames, rule._toTapeNames).length) {
                        continue;
                    }
                    toTapeNames = rule._toTapeNames;
                }
            }

            const childTapes = this.child.calculateTapes(stack, env);
            this._tapes = listUnique([...childTapes, ...this.ruleTapes]);
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
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
 * that all rules are from a tape named "$i" to a tape named "$o".
 * 
 * With this restriction, we don't have to try to infer what the tape names
 * are.
 */
export class JoinRuleGrammar extends AbstractGrammar {
    public readonly tag = "joinrule";

    constructor(
        public inputTape: string,
        public child: Grammar,
        public rules: ReplaceGrammar[]
    ) {
        super();
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return this.child.estimateLength(tapeName, stack, env);
    }

    public get id(): string {
        const cs = this.rules.map(r => r.id).join(",");
        return `JoinRule(${this.child.id},${cs})`;
    }
    
    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = this.child.calculateTapes(stack, env);
            for (const rule of this.rules) {
                // we don't need the answer here, but we have to calculate it so that 
                // the grammars have a .tapes property
                rule.calculateTapes(stack, env);
            }
        }
        return this._tapes;
    }

    public getChildren(): Grammar[] {
        return [ this.child, ...this.rules ];
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        throw new Error("Not implemented");
    }    

} 

let REPLACE_INDEX = 0;
export class ReplaceGrammar extends AbstractGrammar {
    public readonly tag = "replace";

    public get id(): string {
        return `Replace(${this.fromGrammar.id}->${this.toGrammar.id}|${this.preContext.id}_${this.postContext.id})`;
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        return { null: false, min: 0, max: Infinity };
    }
    
    public _fromTapeName: string | undefined = undefined;
    public _toTapeNames: string[] | undefined = undefined;

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
        public hiddenTapeName: string = "",
        public optional: boolean
    ) {
        super();
        if (this.hiddenTapeName.length == 0) {
            this.hiddenTapeName = `${HIDDEN_PREFIX}R${REPLACE_INDEX++}`;
        } else if (!this.hiddenTapeName.startsWith(HIDDEN_PREFIX)) {
            this.hiddenTapeName = HIDDEN_PREFIX + this.hiddenTapeName;
        }
    }

    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const ts = new Set(this.tapes);
        if (ts.has(tapeName)) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    public getChildren(): Grammar[] { 
        return [this.fromGrammar, this.toGrammar, this.preContext, this.postContext, this.otherContext];
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = super.calculateTapes(stack, env);
            if (this.toGrammar.tapes.length == 0) {
                //this.message({
                //    type: "error", 
                //    shortMsg: "At least 1 tape-'to' required", 
                //    longMsg: `The 'to' argument of a replacement must reference at least 1 tape; this references zero.`
                //});
            } else {
                if (this._toTapeNames === undefined) {
                    this._toTapeNames = [];
                }
                this._toTapeNames.push(...this.toGrammar.tapes);
            }
            if (this.fromGrammar.tapes.length != 1) {
                //this.message({
                //    type: "error", 
                //    shortMsg: "Only 1-tape 'from' allowed", 
                //    longMsg: `The 'from' argument of a replacement can only reference 1 tape; this references ${this.fromGrammar.tapes?.length}.`
                //});
            } else {
                this._fromTapeName = this.fromGrammar.tapes[0];
            }
        }
        return this._tapes;
    }
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        const results = super.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, env);
        
        if (this._fromTapeName === undefined || this._toTapeNames === undefined) {
            throw new Error("getting vocab copy edges without tapes");
        }
        const fromTapeGlobalName = tapeNS.get(this._fromTapeName).globalName;
        for (const toTapeName of this._toTapeNames) {
            const toTapeGlobalName = tapeNS.get(toTapeName).globalName;
            results.add([fromTapeGlobalName, toTapeGlobalName]);
        }
        return results;
    }

    public collectVocab(
        tapeName: string,
        atomic: boolean,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringSet { 
        // first, collect vocabulary as normal
        let vocab = super.collectVocab(tapeName, atomic, symbolsVisited, env);

        if (this._fromTapeName == undefined || this._toTapeNames == undefined) {
            throw new Error("getting vocab copy edges without tapes");
        }

        // however, we also need to collect vocab from the contexts as if it were on a toTape
        for (const toTapeName of this._toTapeNames) {
            if (tapeName != toTapeName && tapeName == this._fromTapeName) {
                continue;
            }
            let newTapeName = renameTape(tapeName, toTapeName, this._fromTapeName);
            vocab = setUnion(vocab, this.fromGrammar.collectVocab(newTapeName, atomic, symbolsVisited, env));
            vocab = setUnion(vocab, this.preContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
            vocab = setUnion(vocab, this.postContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
            vocab = setUnion(vocab, this.otherContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        }
        return vocab;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        
        if (this._fromTapeName === undefined || this._toTapeNames === undefined) {
            throw new Error("getting vocab copy edges without tapes");
        }

        if (this.beginsWith || this.endsWith) {
            this.maxReps = Math.max(1, this.maxReps);
            this.minReps = Math.min(this.minReps, this.maxReps);
        }

        if (this.fromGrammar.tapes.length != 1) {
            throw new Error(`too many tapes in fromGrammar: ${this.fromGrammar.tapes}`);
        }
        if (this.toGrammar.tapes.length != 1) {
            throw new Error(`too many tapes in toGrammar: ${this.toGrammar.tapes}`);
        }

        const fromTape = this.fromGrammar.tapes[0];
        const toTape = this.toGrammar.tapes[0];

        const fromExpr: Expr = this.fromGrammar.constructExpr(tapeNS);
        const toExpr: Expr = this.toGrammar.constructExpr(tapeNS);
        const preContextExpr: Expr = this.preContext.constructExpr(tapeNS);
        const postContextExpr: Expr = this.postContext.constructExpr(tapeNS);
        let states: Expr[] = [
            constructMatchFrom(preContextExpr, this._fromTapeName, ...this._toTapeNames),
            constructCorrespond(constructPrecede(fromExpr, toExpr), fromTape, 0, toTape, 0),
            constructMatchFrom(postContextExpr, this._fromTapeName, ...this._toTapeNames)
        ];

        const that = this;

        function matchAnythingElse(replaceNone: boolean = false): Expr {
            // 1. If the rule is optional, we just need to match .*
            // 2. If we are matching an instance at the start of text (beginsWith),
            //    or end of text (endsWith), then merely matching the replacement pattern
            //    isn't really matching.  That is, if we're matching "#b", the fact that b
            //    occurs elsewhere is no problem, it's not actually a match.  So we just 
            //    need to match .*
            
            if (that._fromTapeName == undefined || that._toTapeNames == undefined) {
                throw new Error("getting vocab copy edges without tapes");
            }

            if( that.optional ||
                    (that.beginsWith && !replaceNone) ||
                    (that.endsWith && !replaceNone)) {
                return constructMatchFrom(constructDotStar(that._fromTapeName),
                                          that._fromTapeName, ...that._toTapeNames)
            }
            const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

            // figure out what tapes need to be negated
            const negatedTapes: string[] = [];
            negatedTapes.push(...that.fromGrammar.tapes);
            negatedTapes.push(...that.preContext.tapes);
            negatedTapes.push(...that.postContext.tapes);

            let notExpr: Expr = constructNotContains(that._fromTapeName, fromInstance,
                negatedTapes, that.beginsWith && replaceNone, that.endsWith && replaceNone);
            return constructMatchFrom(notExpr, that._fromTapeName, ...that._toTapeNames);
        }
        
        if (!this.endsWith)
            states.push(matchAnythingElse());

        const replaceOne: Expr = constructSequence(...states);
        const replaceMultiple: Expr = constructRepeat(replaceOne, Math.max(1, this.minReps), this.maxReps);
        
        // we need to match the context on other tapes too
        const otherContextExpr: Expr = this.otherContext.constructExpr(tapeNS);
        if (this.beginsWith)
            states = [replaceOne, otherContextExpr]
        else if (this.endsWith)
            states = [matchAnythingElse(), replaceOne, otherContextExpr];
        else
            states = [matchAnythingElse(), replaceMultiple, otherContextExpr];
        let replaceExpr: Expr = constructSequence(...states);
                
        if (this.minReps > 0) {
            return replaceExpr;
        } else {
            let copyExpr: Expr = matchAnythingElse(true);
            if (! (otherContextExpr instanceof EpsilonExpr)) {
                const negatedTapes: string[] = [];
                negatedTapes.push(...this.otherContext.tapes);
                let negatedOtherContext: Expr = 
                    constructNegation(otherContextExpr, new Set(negatedTapes));
                const matchDotStar: Expr =
                    constructMatchFrom(constructDotStar(this._fromTapeName),
                                       this._fromTapeName, ...this._toTapeNames)
                copyExpr = constructAlternation(constructSequence(matchAnythingElse(true), otherContextExpr),
                                                constructSequence(matchDotStar, negatedOtherContext));
            }
            return constructAlternation(copyExpr, replaceExpr);
        }
    }

}

export function Query(
    query: StringDict = {},
): Grammar {
    const queryLiterals = Object.entries(query).map(([key, value]) => {
        key = key.normalize("NFD"); 
        value = value.normalize("NFD");
        return new LiteralGrammar(key, value);
    });
    return new SequenceGrammar(queryLiterals);
}

export function PreTape(
    fromTape: string, 
    toTape: string, 
    child: Grammar
): Grammar {
    return new PreTapeGrammar(fromTape, toTape, child);
}

export function infinityProtection(
    grammar: Grammar,
    tapes: string[],
    symbolName: string,
    maxChars: number,
    env: PassEnv
): Grammar {

    let foundInfinite = false;
    const maxCharsDict: {[tape: string]: number} = {};
    const stack = new CounterStack(2);
    for (const tape of tapes) {
        const length = grammar.estimateLength(tape, stack, env);
        if (length.null == true) continue;
        if (length.max == Infinity && maxChars != Infinity) {
            maxCharsDict[tape] = maxChars-1;
            foundInfinite = true;
        }
    }

    if (!foundInfinite) return grammar;

    if (grammar instanceof CollectionGrammar) {
        const symGrammar = grammar.getSymbol(symbolName);
        if (symGrammar instanceof PriorityGrammar) {
            symGrammar.child = Count(maxCharsDict, symGrammar.child);
        } else {
            grammar = Count(maxCharsDict, grammar);
        }
    } else if (grammar instanceof PriorityGrammar) {
        grammar.child = Count(maxCharsDict, grammar.child);
    } else {
        grammar = Count(maxCharsDict, grammar);
    }

    return grammar;

}

export class RuleContextGrammar extends AbstractGrammar {
    public readonly tag = "context";

    constructor(
        public preContext: Grammar,
        public postContext: Grammar,
        public begins: boolean = false,
        public ends: boolean = false
    ) {
        super();
    }

    public get id(): string {
        throw new Error("Method not implemented.");
    }

    public estimateLength(tapeName: string, stack: CounterStack, env: PassEnv): LengthRange {
        throw new Error("Method not implemented.");
    }

    public getChildren(): Grammar[] {
        throw new Error("Method not implemented.");
    }

    public constructExpr(tapeNS: TapeNamespace): Expr {
        throw new Error("Method not implemented.");
    }

}
