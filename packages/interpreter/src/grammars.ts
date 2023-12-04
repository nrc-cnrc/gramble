import { 
    Msg, THROWER,
} from "./utils/msgs";

import {
    OldTape, 
    TapeNamespace,
    TapeSet,
} from "./tapes";

import * as Tapes from "./tapes";

import { Pass } from "./passes";

import {
    Dict,
    ValueSet
} from "./utils/func";

import { Component, PassEnv, children } from "./components";
import { DEFAULT_SYMBOL,  HIDDEN_PREFIX, INPUT_TAPE, OUTPUT_TAPE } from "./utils/constants";
import { tokenizeUnicode } from "./utils/strings";
import { Pos } from "./utils/cell";
import { CalculateTapes } from "./passes/calculateTapes";
import { SymbolQualifier } from "./passes/qualifySymbols";
import { toStr } from "./passes/toStr";
import { INDICES } from "./utils/options";
import * as Vocabs from "./vocab";

export type StringPair = [string, string];
export class StringPairSet extends ValueSet<StringPair> { }

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

    public mapChildren(f: Pass<Grammar,Grammar>, env: PassEnv): Msg<Grammar> {
        return super.mapChildren(f, env) as Msg<Grammar>;
    }
    
    public locate(pos: Pos | undefined): Grammar {
        return super.locate(pos) as Grammar;
    }

    public tapes: TapeSet = Tapes.Unknown();

    //public _tapes: string[] | undefined = undefined;

    public get tapeNames(): string[] {
        if (this.tapes.tag !== Tapes.Tag.Lit) {
            throw new Error(`Grammar ${toStr(this)} references unresolved tapes: ` +
                                `${Tapes.toStr(this.tapes)}`);
        }
        return Object.keys(this.tapes.vocabMap);
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
        return pass.getEnvAndTransform(this as Grammar, {})
                   .msgTo(THROWER);
    }

    /**
     * Collects all explicitly mentioned characters in the grammar for all tapes.
     */
    public collectAllVocab(
        tapeNS: TapeNamespace,
        env: PassEnv
    ): void {
        for (const tapeName of this.tapeNames) {
            //const atomic = determineAtomicity(this as Grammar, tapeName, env);
            
            if (this.tapes.tag !== Tapes.Tag.Lit) throw new Error(`Collecting vocab from unresolved tape ${tapeName}`);
            
            let vocabMap = this.tapes.vocabMap;
            vocabMap = Vocabs.resolveAll(vocabMap);
            const vocab = this.tapes.vocabMap[tapeName];
            
            if (vocab.tag !== Vocabs.Tag.Lit) 
                throw new Error(`Tape ${tapeName} has unresolved vocab: ${toStr(vocab)}`);

            const atomic = vocab.atomicity !== Vocabs.Atomicity.Tokenized;
            
            let tape = tapeNS.attemptGet(tapeName);
            if (tape == undefined) {
                // make a new one if it doesn't exist
                const newTape = new OldTape(tapeName, atomic);
                tapeNS.set(tapeName, newTape);
            } 
            tape = tapeNS.get(tapeName); 
            tape.atomic = atomic;

            const strs = vocab.tokens;
            
            tape.registerTokens([...strs]);
        }
    }

}

abstract class AtomicGrammar extends AbstractGrammar { }

export class EpsilonGrammar extends AtomicGrammar {
    public readonly tag = "epsilon";
}

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
        public extraTapes: string[] = []
    ) {
        super(child);
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
        public tapeName: string,
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

export class HideGrammar extends UnaryGrammar {
    public readonly tag = "hide";

    constructor(
        child: Grammar,
        public tapeName: string,
        public toTape: string = ""
    ) {
        super(child);
        if (toTape == "") {
            this.toTape = `${HIDDEN_PREFIX}H${INDICES.HIDE++}_${tapeName}`;
        } else if (!toTape.startsWith(HIDDEN_PREFIX)) {
            this.toTape = `${HIDDEN_PREFIX}${toTape}`;
        }
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
}

export class CollectionGrammar extends AbstractGrammar {
    public readonly tag = "collection";

    constructor(
        public symbols: Dict<Grammar> = {},
        public selectedSymbol: string = DEFAULT_SYMBOL,
        public qualifier: SymbolQualifier = "leaf"
    ) {
        super();
    }
    
    /**
     * Looks up a symbol name and returns the referent (if any) 
     */
    public getSymbol(symbol: string): Grammar | undefined {
        for (const key of Object.keys(this.symbols)) {
            if (symbol.toLowerCase() == key.toLowerCase()) {
                return this.symbols[key];
            }
        }
        return undefined;
    }
}

export class EmbedGrammar extends AtomicGrammar {
    public readonly tag = "embed";

    constructor(
        public symbol: string
    ) {
        super();
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
        public inputTape: string = INPUT_TAPE,
        public outputTape: string = OUTPUT_TAPE
    ) {
        super(child);
    }

}

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
            this.hiddenTapeName = `${HIDDEN_PREFIX}R${INDICES.REPLACE++}`;
        } else if (!this.hiddenTapeName.startsWith(HIDDEN_PREFIX)) {
            this.hiddenTapeName = HIDDEN_PREFIX + this.hiddenTapeName;
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

}