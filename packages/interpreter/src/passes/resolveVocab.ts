import { AutoPass, Pass, SymbolEnv } from "../passes.js";
import { 
    GreedyCursorGrammar, 
    Grammar,
    CursorGrammar,
    LiteralGrammar,
    SequenceGrammar,
    JoinGrammar,
    SelectionGrammar,
    FilterGrammar,
    RepeatGrammar,
    EmbedGrammar,
    RenameGrammar,
    HideGrammar,
    MatchGrammar,
    ReplaceGrammar,
    PreTapeGrammar,
} from "../grammars.js";
import { Dict, getCaseInsensitive, union, update } from "../utils/func.js";
import { Msg } from "../utils/msgs.js";
import { Options } from "../utils/options.js";
import * as Tapes from "../tapes.js";
import { children } from "../components.js";
import { tokenizeUnicode } from "../utils/strings.js";
import { CounterStack } from "../utils/counter.js";
import { INPUT_TAPE, OUTPUT_TAPE } from "../utils/constants.js";

type VocabMode = "atomic" | "concat" | "join" | "tokenized";

class VocabLibrary {

    constructor(
        public opt: Partial<Options>,
        public tapeToKey: [Dict<string>] = [{}],
        public keyToMode: [Dict<VocabMode>] = [{}],
        public keyToVocab: Dict<VocabContainer|string> = {},
    ) { }

    public pushTape(tapeName: string): void {
        const tapeToKey = this.tapeToKey[this.tapeToKey.length-1];
        const keyToMode = this.keyToMode[this.keyToMode.length-1];

        const newTapeToKey = {...tapeToKey};
        const newKeyToMode = {...keyToMode};
        
        const newKey = Object.keys(this.keyToVocab).length.toString();
        newTapeToKey[tapeName] = newKey;
        newKeyToMode[newKey] = this.opt.optimizeAtomicity 
                                    ? "atomic" 
                                    : "tokenized";

        this.tapeToKey.push(newTapeToKey);
        this.keyToMode.push(newKeyToMode);
        this.keyToVocab[newKey] = new AtomicVocab();
    }

    public popTape(): void {
        this.tapeToKey.pop();
        this.keyToMode.pop();
    }

    public pushRenameTape(oldTapeName: string, newTapeName: string) {

        const tapeToKey = this.tapeToKey[this.tapeToKey.length-1];
        if (!(oldTapeName in tapeToKey)) {
            throw `Tape not found in vocab: ${oldTapeName}, tapeToKey is ${[...Object.entries(tapeToKey)]}`;
        }

        const key = tapeToKey[oldTapeName];
        const newTapeToKey = {...tapeToKey};
        delete newTapeToKey[oldTapeName];
        newTapeToKey[newTapeName] = key;
        this.tapeToKey.push(newTapeToKey);
    }

    public popRenameTape(): void {
        this.tapeToKey.pop();
    }

    public combineMode(oldMode: VocabMode, newMode: VocabMode) {
        switch (newMode) {

            // Changing to atomic just keeps the old mode
            case "atomic": return oldMode;

            // If we're in a joining context, concatting makes
            // it tokenized
            case "concat":
                switch(oldMode) {
                    case "atomic": return "concat";
                    case "concat": return "concat";
                    case "join": return "tokenized";
                    case "tokenized": return "tokenized";
                }

            // Join makes things join.  (Even if we're in a concatting context,
            // it's only join(concat(X,Y)) that we're worried about,
            // not concat(join(X,Y))
            case "join": 
                switch(oldMode) {
                    case "atomic": return "join";
                    case "concat": return "join";
                    case "join": return "join";
                    case "tokenized": return "tokenized";
                }
            // No matter what the old mode was, tokenized
            // makes it tokenized
            case "tokenized": return "tokenized";
        }
    }

    public pushModes(tapeToMode: Dict<VocabMode>): void {
        const tapeToKey = this.tapeToKey[this.tapeToKey.length-1];
        const keyToMode = this.keyToMode[this.keyToMode.length-1];
        const newKeyToMode = {...keyToMode};

        for (const [tape, mode] of Object.entries(tapeToMode)) {
            const key = tapeToKey[tape];
            const oldMode = keyToMode[key];
            const newMode = this.combineMode(oldMode, mode);
            newKeyToMode[key] = newMode;
        }

        this.keyToMode.push(newKeyToMode);
    }


    public popModes(): void {
        this.keyToMode.pop();
    }

    public getKey(tapeName: string): [string, VocabMode] {

        const tapeToKey = this.tapeToKey[this.tapeToKey.length-1];
        const keyToMode = this.keyToMode[this.keyToMode.length-1];

        if (!(tapeName in tapeToKey)) {
            throw `Tape not found in vocab: ${tapeName}, tapeToKey is ${[...Object.entries(tapeToKey)]}`;
        }

        const key = tapeToKey[tapeName]
        return [key, keyToMode[key]];
    }

    public add(tapeName: string, str: string): void {
        const [key, mode] = this.getKey(tapeName);
        this.addAux(key, str, mode);
    }

    public addAux(key: string, str: string, mode: VocabMode): void {
        const vocab = this.keyToVocab[key];
        if (vocab instanceof VocabContainer) {
            this.keyToVocab[key] = vocab.add(str, mode);
            return;
        }

        // vocab is actually a string referencing another vocab
        this.addAux(vocab, str, mode);
    }

    public tokenize(tapeName: string) {
        const [key, _] = this.getKey(tapeName);
        this.tokenizeAux(key);
    }

    public tokenizeAux(key: string) {
        const vocab = this.keyToVocab[key];
        if (vocab instanceof VocabContainer) {
            this.keyToVocab[key] = vocab.tokenize();
            return;
        }

        // vocab is actually a string referencing another vocab
        this.tokenizeAux(vocab);
    }

    public mergeTapes(tapeName1: string, tapeName2: string): void {
        const [key1, _1] = this.getKey(tapeName1);
        const [key2, _2] = this.getKey(tapeName2);
        this.mergeTapesAux(key1, key2);
    }

    public mergeTapesAux(key1: string, key2: string): void {
        const vocab1 = this.keyToVocab[key1];

        if (!(vocab1 instanceof VocabContainer)) {
            this.mergeTapesAux(vocab1, key2);
            return;
        }
        
        const vocab2 = this.keyToVocab[key2];
        if (!(vocab2 instanceof VocabContainer)) {
            this.mergeTapesAux(key1, vocab2);
            return;
        }

        const tokenized1 = vocab1.tokenize();
        const tokenized2 = vocab2.tokenize();
        const allTokens = union(tokenized1.vocab, tokenized2.vocab);
        const merged = new TokenizedVocab(allTokens);

        this.keyToVocab[key1] = key2;
        this.keyToVocab[key2] = merged;
    }

    public getVocab(key: string): [Set<string>, boolean] {
        const vocab = this.keyToVocab[key];
        if (vocab instanceof VocabContainer) {
            return [vocab.vocab, vocab.atomic];
        }

        // it's a reference to another vocab
        return this.getVocab(vocab);
    }

}


abstract class VocabContainer {
    public atomic = false;

    constructor(
        public vocab: Set<string> = new Set()
    ) { }

    public abstract tokenize(): TokenizedVocab;
    public abstract add(str: string, mode: VocabMode): VocabContainer;
}

class AtomicVocab extends VocabContainer {
    public atomic = true;
    
    public tokenize(): TokenizedVocab {
        const newVocab = new TokenizedVocab();
        for (const atom of this.vocab) {
            newVocab.add(atom, "tokenized");
        }
        return newVocab;
    }

    public add(str: string, mode: VocabMode): VocabContainer {
        if (str.length === 0) return this;

        if (mode !== "tokenized") {
            this.vocab.add(str);
            return this;
        }

        // we got an addition in tokenized mode, meaning
        // we have to tokenize everything we've got :/
        const newVocab = this.tokenize();
        return newVocab.add(str, mode);
    }
}

class TokenizedVocab extends VocabContainer {
    public atomic = false;

    public tokenize(): TokenizedVocab {
        return this;
    }

    public add(str: string, mode: VocabMode): VocabContainer {
        if (str.length === 0) return this;

        const tokens = tokenizeUnicode(str);
        for (const token of tokens) {
            this.vocab.add(token);
        }

        return this;

    }
}

export class ResolveVocab extends Pass<Grammar, Grammar> {

    public getEnv(opt: Partial<Options>): SymbolEnv {
        return new SymbolEnv(opt);
    }

    public transform(g: Grammar, env: SymbolEnv): Msg<Grammar> {

        if (g.tapes.tag !== Tapes.Tag.Lit) {
            throw new Error("nonliteral tapes at vocab resolution");
        }

        const vocabLib = new VocabLibrary(env.opt)
        const stack = new CounterStack(2);
        collectVocab(g, vocabLib, stack, env);

        const childPass = new InjectVocab(vocabLib);
        return childPass.transform(g, env);
    }

}

export class InjectVocab extends AutoPass<Grammar> {

    constructor(
        public vocabLib: VocabLibrary
    ) { 
        super();
    }

    public postTransform(g: Grammar, env: SymbolEnv): Grammar {
        switch (g.tag) {
            case "cursor": 
            case "greedyCursor": 
            case "pretape": return this.transformCursor(g, env);
            default: return g;
        }
    }

    public transformCursor(
        g: CursorGrammar | GreedyCursorGrammar | PreTapeGrammar, 
        env: SymbolEnv
    ): Grammar {
        const [vocab, atomic] = this.vocabLib.getVocab(g.key);
        return update(g, {vocab, atomic});
    }
}

function collectVocab(
    g: Grammar,
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv,
): void {
    switch (g.tag) {
        case "epsilon": 
        case "null":
                        return;

        case "lit":     
                        return collectVocabLit(g, vocabLib, stack, env);

        case "selection":
                        return collectVocabSelection(g, vocabLib, stack, env);
        case "cursor":
        case "greedyCursor":
                        return collectVocabCursor(g, vocabLib, stack, env);
        case "pretape":
                        return collectVocabPreTape(g, vocabLib, stack, env);
        case "seq":     return collectVocabSequence(g, vocabLib, stack, env);
        case "repeat":  return collectVocabRepeat(g, vocabLib, stack, env);

        case "join": 
        case "filter":
                        return collectVocabJoin(g, vocabLib, stack, env);
        case "embed":
                        return collectVocabEmbed(g, vocabLib, stack, env);
        case "rename":
                        return collectVocabRename(g, vocabLib, stack, env);
        case "hide":
                        return collectVocabHide(g, vocabLib, stack, env);
        case "match":
                        return collectVocabMatch(g, vocabLib, stack, env);
        case "replace":
                        return collectVocabReplace(g, vocabLib, stack, env);
        case "alt":    
        case "count":
        case "priority":
        case "correspond":
        case "test":
        case "testnot":
                        return collectVocabDefault(g, vocabLib, stack, env); 
        
        case "dot":
        case "short":
        case "not":
                        return collectVocabTokenized(g, vocabLib, stack, env);

        default: 
            throw `No collection function for ${g.tag}`;
    }
}

function collectVocabLit(
    g: LiteralGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {

    return vocabLib.add(g.tapeName, g.text);
}

function collectVocabDefault(    
    g: Grammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    for (const child of children(g)) {
        collectVocab(child, vocabLib, stack, env);
    }
}

/**
 * A generic vocab-collection function for grammars who
 * tokenize all their tapes.  (In practice, all the grammars
 * participating in this should be single-taped anyway, but we
 * don't enforce that here, just loop through it.)
 * @param g 
 * @param vocabLib 
 * @param env 
 */
function collectVocabTokenized(
    g: Grammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    for (const tapeName of g.tapeNames) {
        vocabLib.tokenize(tapeName);
    }
    for (const child of children(g)) {
        collectVocab(child, vocabLib, stack, env);
    }
} 


function collectVocabSequence(    
    g: SequenceGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    
    // we have to determine if we're truly a concat for
    // the purposes of this tape, which means having at least
    // two children with that tape.  this is a dict
    // from tape names to either "atomic" (only 1 child has the
    // tape) or "concat" (at least two do).  This dict is then
    // used by VocabLibrary to decide what mode to use in this
    // scope.  (Note: it's not necessary "atomic" or "concat", these
    // modes may combine with others.)
    const modes: Dict<VocabMode> = {};
    for (const child of children(g)) {
        for (const tapeName of child.tapeNames) {
            if (!(tapeName in modes)) {
                modes[tapeName] = "atomic";
                continue;
            }
            modes[tapeName] = "concat";
        }
    }

    vocabLib.pushModes(modes);

    for (const child of children(g)) {
        collectVocab(child, vocabLib, stack, env);
    }

    vocabLib.popModes();
}

function collectVocabJoin(    
    g: JoinGrammar|FilterGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    
    // we have to determine if we're truly a concat for
    // the purposes of this tape, which means having at least
    // two children with that tape.  this is a dict
    // from tape names to either "atomic" (only 1 child has the
    // tape) or "concat" (at least two do).  This dict is then
    // used by VocabLibrary to decide what mode to use in this
    // scope.  (Note: it's not necessary "atomic" or "concat", these
    // modes may combine with others.)
    const modes: Dict<VocabMode> = {};
    for (const child of children(g)) {
        for (const tapeName of child.tapeNames) {
            if (!(tapeName in modes)) {
                modes[tapeName] = "atomic";
                continue;
            }
            modes[tapeName] = "join";
        }
    }

    vocabLib.pushModes(modes);

    for (const child of children(g)) {
        collectVocab(child, vocabLib, stack, env);
    }

    vocabLib.popModes();
}

function collectVocabRepeat(    
    g: RepeatGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    const nontriv = g.maxReps > 1;

    // A repeat isn't necessarily a true concat-like; only if it's nontrivial.
    // We pass in dictionary from tape names to mode changes, either "atomic" or
    // concat.  See the commentary in collectVocabSeq to better understand
    // what this does.
    const modes: Dict<VocabMode> = {};
    for (const tapeName of g.tapeNames) {
        modes[tapeName] = nontriv ? "concat" : "atomic";
    }

    vocabLib.pushModes(modes);
    collectVocab(g.child, vocabLib, stack, env);
    vocabLib.popModes();
}

function collectVocabSelection(
    g: SelectionGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    const newEnv = env.update(g);
    const referent = getCaseInsensitive(g.symbols, g.selection);
    if (referent === undefined) { 
        // something's wrong, but now is not the time to complain
        return;
    }
    return collectVocab(referent, vocabLib, stack, newEnv);
}

function collectVocabCursor(
    g: CursorGrammar | GreedyCursorGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    vocabLib.pushTape(g.tapeName);
    const [key, _] = vocabLib.getKey(g.tapeName);
    g.key = key;
    collectVocab(g.child, vocabLib, stack, env);
    vocabLib.popTape();
}

function collectVocabPreTape(
    g: PreTapeGrammar,
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    vocabLib.pushTape(g.inputTape);
    const [key, _] = vocabLib.getKey(g.inputTape);
    g.key = key;
    vocabLib.mergeTapes(g.inputTape, g.outputTape);
    collectVocab(g.child, vocabLib, stack, env);
    vocabLib.popTape();
}

function collectVocabEmbed(
    g: EmbedGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    if (stack.get(g.symbol) >= 1)
        return;

    const newStack = stack.add(g.symbol);
    const referent = env.symbolNS[g.symbol];
    if (referent === undefined) {
        throw new Error(`undefined referent ${g.symbol}, candidates are [${Object.keys(env.symbolNS)}]`);
    }

    collectVocab(referent, vocabLib, newStack, env);
}

function collectVocabRename(
    g: RenameGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    vocabLib.pushRenameTape(g.toTape, g.fromTape);
    collectVocab(g.child, vocabLib, stack, env);
    vocabLib.popRenameTape();

}

function collectVocabHide(
    g: HideGrammar, 
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    vocabLib.pushRenameTape(g.toTape, g.tapeName);
    collectVocab(g.child, vocabLib, stack, env);
    vocabLib.popRenameTape();

}

function collectVocabMatch(
    g: MatchGrammar,
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    const names = new Set(g.tapeNames);
    if (!names.has(g.inputTape) || !names.has(g.outputTape)) {
        collectVocab(g.child, vocabLib, stack, env);
        return;
    }
    vocabLib.mergeTapes(g.inputTape, g.outputTape);
    collectVocab(g.child, vocabLib, stack, env);
}

function collectVocabReplace(
    g: ReplaceGrammar,
    vocabLib: VocabLibrary,
    stack: CounterStack,
    env: SymbolEnv
): void {
    vocabLib.mergeTapes(INPUT_TAPE, OUTPUT_TAPE);
    collectVocab(g.inputChild, vocabLib, stack, env);
    collectVocab(g.outputChild, vocabLib, stack, env);
    collectVocab(g.preChild, vocabLib, stack, env);
    collectVocab(g.postChild, vocabLib, stack, env);
}