import { 
    CounterStack, Expr
} from "./exprs";
import { 
    Msgs,
    Result,
} from "./msgs";

import {
    renameTape,
    Tape, 
    TapeID, 
    TapeNamespace,
    TapeSet,
    tapeToLits,
    tapeToStr,
    TapeUnknown
} from "./tapes";
import { Pass, PassEnv } from "./passes";

import {
    CellPos,
    DEFAULT_SYMBOL_NAME,
    Dict,
    HIDDEN_PREFIX,
    REPLACE_INPUT_TAPE,
    REPLACE_OUTPUT_TAPE,
    setUnion,
    StringSet,
    tokenizeUnicode,
    ValueSet
} from "./util";

import { Component, getChildren } from "./components";
import { determineAtomicity } from "./passes/determineAtomicity";
import { CalculateTapes } from "./passes/calculateTapes";
import { toStr } from "./passes/toStr";

export { CounterStack, Expr };

export type StringPair = [string, string];
export class StringPairSet extends ValueSet<StringPair> { }

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

    public tapeSet: TapeID = TapeUnknown();

    //public _tapes: string[] | undefined = undefined;

    public get tapes(): string[] {
        return tapeToLits(this.tapeSet);
    }

    public getChildren(): Grammar[] {
        return getChildren(this as Grammar);
    }

    public calculateTapes(stack: CounterStack, env: PassEnv): string[] {
        try {
            return tapeToLits(this.tapeSet);
        } catch (e) {
            throw new Error(`Error in ${toStr(this)}: ${e}`);
        }
    }

    /**
     * A convenience method to make sure that results have their tapes calculated, for
     * use in other Passes.  (NOT for calculating the tapes of grammars built from Gramble
     * source, just for grammars that we're making with `new SequenceGrammar(...)` and such.)
     * 
     * It assumes that the structure it's operating on has a sound tape 
     * structure.  If it encounters any error in this process, it throws an exception.
     * (Result-type messages are for the Gramble programmer, not for us.  Nothing we
     * should be doing results in a Result-type message.  So if somehow you're creating
     * structure in a Pass that creates a tape paradox or something, stop doing that.)
     */
    public tapify(env: PassEnv): Grammar {
        const pass = new CalculateTapes();
        const [result, msgs] = pass.go(this as Grammar, env).destructure();
        if (msgs.length > 0) throw new Error(JSON.stringify(msgs));
        return result;
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
            const atomic = determineAtomicity(this as Grammar, tapeName, env);
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

    public allSymbols(): string[] {
        return [];
    }
}

abstract class AtomicGrammar extends AbstractGrammar { }

export class EpsilonGrammar extends AtomicGrammar {
    public readonly tag = "epsilon";
}

const EPSILON_GRAMMAR = new EpsilonGrammar();

export class NullGrammar extends AtomicGrammar {
    public readonly tag = "null";
}

export class LiteralGrammar extends AtomicGrammar {
    public readonly tag = "lit";

    public tokens: string[] = [];

    constructor(
        public tapeName: string,
        public text: string
    ) {
        super();
        this.tokens = tokenizeUnicode(text);
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

}

export class DotGrammar extends AtomicGrammar {
    public readonly tag = "dot";

    constructor(
        public tapeName: string
    ) {
        super();
    }
}

abstract class NAryGrammar extends AbstractGrammar {

    constructor(
        public children: Grammar[]
    ) {
        super();
    }

}

export class SequenceGrammar extends NAryGrammar {
    public readonly tag = "seq";
}

export class AlternationGrammar extends NAryGrammar {
    public readonly tag = "alt";
}

export abstract class UnaryGrammar extends AbstractGrammar {

    constructor(
        public child: Grammar
    ) {
        super();
    }
}

abstract class BinaryGrammar extends AbstractGrammar {

    constructor(
        public child1: Grammar,
        public child2: Grammar
    ) {
        super();
    }
}

export class ShortGrammar extends UnaryGrammar {
    public readonly tag = "short";
}

export class IntersectionGrammar extends BinaryGrammar {
    public readonly tag = "intersect";
}

export class JoinGrammar extends BinaryGrammar {
    public readonly tag = "join";
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
}

export class FilterGrammar extends BinaryGrammar {
    public readonly tag = "filter";
}

abstract class ConditionGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public _tapes: string[] | undefined = undefined
    ) {
        super(child);
        //this._tapes = tapes;
    }
}

export class StartsGrammar extends ConditionGrammar {
    public readonly tag = "starts";
}

export class EndsGrammar extends ConditionGrammar {
    public readonly tag = "ends";
}

export class ContainsGrammar extends ConditionGrammar {
    public readonly tag = "contains";
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

    /*
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
    } */

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
}

export class NegationGrammar extends UnaryGrammar {
    public readonly tag = "not";
}

export class CursorGrammar extends UnaryGrammar {
    public readonly tag = "cursor";

    constructor(
        public tape: string,
        child: Grammar
    ) {
        super(child);
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
}

export class MatchGrammar extends UnaryGrammar {
    public readonly tag = "match";

    constructor(
        child: Grammar,
        public fromTape: string,
        public toTape: string
    ) {
        super(child);
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
        return new CollectionGrammar(this.symbols, symbolName);
    }

    public allSymbols(): string[] {
        return Object.keys(this.symbols);
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

    /*
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
    } */

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
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace, 
        symbolsVisited: StringPairSet, 
        env: PassEnv
    ): StringPairSet {
        const newEnv = env.pushSymbols(this.symbols);
        return super.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, newEnv);    
    }
}

export class EmbedGrammar extends AtomicGrammar {
    public readonly tag = "embed";

    constructor(
        public name: string
    ) {
        super();
    }

    /*
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
    } */

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

}

export abstract class AbstractTestGrammar extends UnaryGrammar {

    constructor(
        child: Grammar,
        public test: Grammar,
        public uniques: LiteralGrammar[] = []
    ) {
        super(child);
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
} 

export class CorrespondGrammar extends UnaryGrammar {
    public readonly tag = "correspond";
    
    constructor(
        child: Grammar,
        public tape1: string = REPLACE_INPUT_TAPE,
        public tape2: string = REPLACE_OUTPUT_TAPE
    ) {
        super(child);
    }

}

let REPLACE_INDEX = 0;
export class ReplaceGrammar extends AbstractGrammar {
    public readonly tag = "replace";

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
    
    public getVocabCopyEdges(
        tapeName: string,
        tapeNS: TapeNamespace,
        symbolsVisited: StringPairSet,
        env: PassEnv
    ): StringPairSet {
        const results = super.getVocabCopyEdges(tapeName, tapeNS, symbolsVisited, env);
        const fromTapeGlobalName = tapeNS.get(REPLACE_INPUT_TAPE).globalName;
        const toTapeGlobalName = tapeNS.get(REPLACE_OUTPUT_TAPE).globalName;
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

        // however, we also need to collect vocab from the contexts as if it were on a toTape
        let newTapeName = renameTape(tapeName, REPLACE_OUTPUT_TAPE, REPLACE_INPUT_TAPE);
        vocab = setUnion(vocab, this.fromGrammar.collectVocab(newTapeName, atomic, symbolsVisited, env));
        vocab = setUnion(vocab, this.preContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        vocab = setUnion(vocab, this.postContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        vocab = setUnion(vocab, this.otherContext.collectVocab(newTapeName, atomic, symbolsVisited, env));
        
        return vocab;
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

}