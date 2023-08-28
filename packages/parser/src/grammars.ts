import { 
    CounterStack, Expr, EPSILON,
    constructRepeat, constructSequence, constructAlternation,
    constructIntersection, constructDot, constructEmbed,
    constructRename, constructNegation, NULL,
    constructJoin,
    constructLiteral, constructMatch,
    EpsilonExpr, constructShort,
    constructPrecede, constructPreTape,
    constructNotContains,
    constructCollection, 
    constructDotStar,
    constructCount,
    CollectionExpr,
    constructCursor,
    constructCorrespond,
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
    flatten,
    HIDDEN_PREFIX,
    listIntersection,
    listUnique,
    logDebug,
    REPLACE_INPUT_TAPE,
    REPLACE_OUTPUT_TAPE,
    setUnion,
    StringDict,
    StringSet,
    tokenizeUnicode,
    ValueSet
} from "./util";

import { Component, exhaustive } from "./components";

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
             | SequenceGrammar
             | AlternationGrammar
             | ShortGrammar
             | IntersectionGrammar
             | JoinGrammar
             | CountGrammar
             | StartsGrammar
             | EndsGrammar
             | ContainsGrammar
             | FilterGrammar
             | SingleTapeGrammar
             | RenameGrammar
             | RepeatGrammar
             | NegationGrammar
             | PreTapeGrammar
             | CursorGrammar
             | HideGrammar
             | MatchGrammar
             | CollectionGrammar
             | EmbedGrammar
             | LocatorGrammar
             | TestGrammar
             | TestNotGrammar
             | ReplaceBlockGrammar
             | ReplaceGrammar
             | CorrespondGrammar
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

    public get id(): string {
        return 'ε';
    }

    public getLiterals(): LiteralGrammar[] {
        return [];
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
        }
        return this._tapes;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        return EPSILON;
    }
}

const EPSILON_GRAMMAR = new EpsilonGrammar();

export class NullGrammar extends AtomicGrammar {
    public readonly tag = "null";
    
    public get id(): string {
        return "∅";
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            this._tapes = [];
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

    public getTapePriority(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): number {
        const c1tapes = new Set(this.child1.tapes);
        const c2tapes = new Set(this.child2.tapes);
        const c1priority = this.child1.getTapePriority(tapeName, symbolsVisited, env);
        const c2priority = this.child2.getTapePriority(tapeName, symbolsVisited, env);
        if (c1tapes.has(tapeName) && c2tapes.has(tapeName)) {
            return c1priority + c2priority * 10;
        }
        return (c1priority + c2priority);
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

export class FilterGrammar extends BinaryGrammar {
    public readonly tag = "filter";

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        // All descendants of Condition should have been replaced by
        // other grammars by the time exprs are constructed.
        throw new Error("not implemented");
    }

    public get id(): string {
        return `Filter(${this.child1.id},${this.child2.id})`;
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

    public get id(): string {
        return `Starts(${this.child.id})`;
    }
}

export class EndsGrammar extends ConditionGrammar {
    public readonly tag = "ends";

    public get id(): string {
        return `Ends(${this.child.id})`;
    }
}

export class ContainsGrammar extends ConditionGrammar {
    public readonly tag = "contains";

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
        return `Cursor_${this.tape}(${this.child.id})`;
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
    
}

export class MatchGrammar extends UnaryGrammar {
    public readonly tag = "match";

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
        return constructMatch(childExpr, this.fromTape, this.toTape);
    }
}

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

    public get id(): string {
        return this.child.id;
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        if (this._tapes == undefined) {
            const childTapes = this.child.calculateTapes(stack, env);
            const testTapes = this.test.calculateTapes(stack, env);
            this._tapes = listUnique([...childTapes, ...testTapes]);
        }
        return this._tapes;
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

export class ReplaceBlockGrammar extends AbstractGrammar {
    public readonly tag = "replaceblock";

    constructor(
        public inputTape: string,
        public child: Grammar,
        public rules: ReplaceGrammar[]
    ) {
        super();
    }

    public get id(): string {
        const cs = this.rules.map(r => r.id).join(",");
        return `ReplaceBlock(${this.child.id},${cs})`;
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

export class CorrespondGrammar extends UnaryGrammar {
    public readonly tag = "correspond";

    public get id(): string {
        return `Cor_${this.tape1}>${this.tape2}(${this.child.id})`;
    }
    
    constructor(
        child: Grammar,
        public tape1: string,
        public tape2: string
    ) {
        super(child);
    }
    
    public getTapeClass(
        tapeName: string, 
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): TapeClass {
        const ts = new Set(this.tapes);
        if (tapeName == this.tape1 || tapeName == this.tape2) {
            return { joinable: true, concatenable: true };
        }
        return super.getTapeClass(tapeName, symbolsVisited, env);
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        const childExpr = this.child.constructExpr(tapeNS);
        return constructCorrespond(childExpr, this.tape1, this.tape2);
    }

}

let REPLACE_INDEX = 0;
export class ReplaceGrammar extends AbstractGrammar {
    public readonly tag = "replace";

    public get id(): string {
        return `Replace(${this.fromGrammar.id}->${this.toGrammar.id}|${this.preContext.id}_${this.postContext.id})`;
    }
    
    public _fromTapeName: string | undefined = undefined;
    public _toTapeName: string | undefined = undefined;

    constructor(
        public fromGrammar: Grammar,
        public toGrammar: Grammar,
        public preContext: Grammar,
        public postContext: Grammar, 
        public otherContext: Grammar,
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
            if (this.toGrammar.tapes.length == 1) {
                this._toTapeName = this.toGrammar.tapes[0];
            } 
            if (this.fromGrammar.tapes.length == 1) {
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
        
        if (this._fromTapeName === undefined || this._toTapeName === undefined) {
            throw new Error("getting vocab copy edges without tapes");
        }
        const fromTapeGlobalName = tapeNS.get(this._fromTapeName).globalName;
        const toTapeGlobalName = tapeNS.get(this._toTapeName).globalName;
        results.add([fromTapeGlobalName, toTapeGlobalName]);
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

        if (this._fromTapeName == undefined || this._toTapeName == undefined) {
            throw new Error("getting vocab copy edges without tapes");
        }

        // however, we also need to collect vocab from the contexts as if it were on a toTape
        let newTapeName = renameTape(tapeName, this._toTapeName, this._fromTapeName);
        vocab = setUnion(vocab, this.fromGrammar.collectVocab(newTapeName, atomic, symbolsVisited, env));
        vocab = setUnion(vocab, this.preContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        vocab = setUnion(vocab, this.postContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        vocab = setUnion(vocab, this.otherContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        
        return vocab;
    }

    public constructExpr(
        tapeNS: TapeNamespace
    ): Expr {
        
        if (this._fromTapeName === undefined || this._toTapeName === undefined) {
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

        const fromExpr: Expr = this.fromGrammar.constructExpr(tapeNS);
        const toExpr: Expr = this.toGrammar.constructExpr(tapeNS);
        const preContextExpr: Expr = this.preContext.constructExpr(tapeNS);
        const postContextExpr: Expr = this.postContext.constructExpr(tapeNS);
        let states: Expr[] = [
            constructMatch(preContextExpr, this._fromTapeName, this._toTapeName),
            constructCorrespond(constructPrecede(fromExpr, toExpr), this._fromTapeName, this._toTapeName),
            constructMatch(postContextExpr, this._fromTapeName, this._toTapeName)
        ];

        const that = this;

        function matchAnythingElse(replaceNone: boolean = false): Expr {
            // 1. If the rule is optional, we just need to match .*
            // 2. If we are matching an instance at the start of text (beginsWith),
            //    or end of text (endsWith), then merely matching the replacement pattern
            //    isn't really matching.  That is, if we're matching "#b", the fact that b
            //    occurs elsewhere is no problem, it's not actually a match.  So we just 
            //    need to match .*
            
            if (that._fromTapeName == undefined || that._toTapeName == undefined) {
                throw new Error("getting vocab copy edges without tapes");
            }

            if( that.optional ||
                    (that.beginsWith && !replaceNone) ||
                    (that.endsWith && !replaceNone)) {
                return constructMatch(constructDotStar(that._fromTapeName),
                                          that._fromTapeName, that._toTapeName)
            }
            const fromInstance: Expr[] = [preContextExpr, fromExpr, postContextExpr];

            // figure out what tapes need to be negated
            const negatedTapes: string[] = [];
            negatedTapes.push(...that.fromGrammar.tapes);
            negatedTapes.push(...that.preContext.tapes);
            negatedTapes.push(...that.postContext.tapes);

            let notExpr: Expr = constructNotContains(that._fromTapeName, fromInstance,
                negatedTapes, that.beginsWith && replaceNone, that.endsWith && replaceNone);
            return constructMatch(notExpr, that._fromTapeName, that._toTapeName);
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
                    constructMatch(constructDotStar(this._fromTapeName),
                                       this._fromTapeName, this._toTapeName)
                copyExpr = constructAlternation(constructSequence(matchAnythingElse(true), otherContextExpr),
                                                constructSequence(matchDotStar, negatedOtherContext));
            }
            return constructAlternation(copyExpr, replaceExpr);
        }
    }

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

    public getChildren(): Grammar[] {
        throw new Error("Method not implemented.");
    }

    public constructExpr(tapeNS: TapeNamespace): Expr {
        throw new Error("Method not implemented.");
    }

}
