import { AutoPass, Pass } from "../passes.js";
import { 
    GreedyCursorGrammar, 
    Grammar,
    CursorGrammar,
    LiteralGrammar,
    SequenceGrammar,
    AlternationGrammar,
    JoinGrammar,
    SelectionGrammar,
    DotGrammar,
    FilterGrammar,
    RepeatGrammar,
} from "../grammars.js";
import { Dict, exhaustive, getCaseInsensitive, update } from "../utils/func.js";
import { Msg } from "../utils/msgs.js";
import { Env, Options } from "../utils/options.js";
import { VocabDict } from "../vocab.js";
import * as Tapes from "../tapes.js";
import * as Vocabs from "../vocab.js";
import { children } from "../components.js";
import { toStr } from "./toStr.js";
import { tokenizeUnicode } from "../utils/strings.js";

type VocabMode = "atomic" | "concat" | "join" | "tokenized";

abstract class VocabContainer {
    public vocab: Set<string> = new Set();
    public abstract tokenize(): TokenizedVocab;
    public abstract add(str: string, mode: VocabMode): VocabContainer;
}

class AtomicVocab extends VocabContainer {

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

export class ResolveVocabEnv extends Env<Grammar> {

    constructor(
        opt: Partial<Options>,
        public vocabs: VocabDict = {}
    ) { 
        super(opt);
    }
}

export class ResolveVocab extends Pass<Grammar, Grammar> {

    public getEnv(opt: Partial<Options>): ResolveVocabEnv {
        return new ResolveVocabEnv(opt);
    }

    public transform(g: Grammar, env: ResolveVocabEnv): Msg<Grammar> {

        if (g.tapes.tag !== Tapes.Tag.Lit) {
            throw new Error("at tapes at vocab resolution");
        }

        const newEnv = new ResolveVocabEnv(env.opt, g.tapes.vocabMap);
        const child = new ResolveVocabAux();
        return child.transform(g, newEnv);
    }

}

export class ResolveVocabAux extends AutoPass<Grammar> {

    public postTransform(g: Grammar, env: ResolveVocabEnv): Grammar {
        switch (g.tag) {
            case "cursor": 
            case "greedyCursor": return this.transformCursor(g, env);
            
            default: return g;
        }
    }

    public transformCursor(
        g: CursorGrammar | GreedyCursorGrammar, 
        env: ResolveVocabEnv
    ): Grammar {
        
        let voc = new AtomicVocab();
        voc = collectVocab(g.child, g.tapeName, "atomic", voc, env);
        console.log(`${g.tapeName}: ${[...voc.vocab]}`);

        if (g.vocab.tag === Vocabs.Tag.Lit) {
            // we're done already
            return g;
        }

        const vocab = Vocabs.getFromVocabDict(env.vocabs, g.vocab.key);
        if (vocab == undefined) {
            throw new Error(`resolved vocab for ${g.tapeName}, key = ${g.vocab.key}, is undefined! map is ${Vocabs.vocabDictToStr(env.vocabs)}`);
        }
        return update(g, {vocab});
    }

}

function collectVocab(
    g: Grammar,
    tapeName: string,
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    switch (g.tag) {
        case "epsilon": 
        case "null":
                        return vocabSoFar;

        case "lit":     
                        return collectVocabLit(g, tapeName, vocabMode, vocabSoFar, env); 
        case "dot":
                        return collectVocabDot(g, tapeName, vocabMode, vocabSoFar, env);

        case "selection":
                        return collectVocabSelection(g, tapeName, vocabMode, vocabSoFar, env);
        case "cursor":
        case "greedyCursor":
                        return collectVocabCursor(g, tapeName, vocabMode, vocabSoFar, env);

        case "join": 
        case "filter":
                        return collectVocabJoin(g, tapeName, vocabMode, vocabSoFar, env);
        case "seq":     return collectVocabSequence(g, tapeName, vocabMode, vocabSoFar, env);
        case "repeat":  return collectVocabRepeat(g, tapeName, vocabMode, vocabSoFar, env);
                        
        
        case "starts":
        case "ends":
        case "contains":
        case "short":
                        return collectVocabTokenized(g, tapeName, vocabMode, vocabSoFar, env);

        case "alt":    
        case "count":
        case "not":
        case "priority":
        case "correspond":
                        return collectVocabDefault(g, tapeName, vocabMode, vocabSoFar, env); 
        default: 
            console.log(`No collection function for ${g.tag}`);
            return vocabSoFar;
    }
}

function collectVocabLit(
    g: LiteralGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    if (g.tapeName !== tapeName) {
        return vocabSoFar;
    }

    return vocabSoFar.add(g.text, vocabMode);
}

function collectVocabDot(
    g: DotGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    if (g.tapeName !== tapeName) {
        return vocabSoFar;
    }

    return vocabSoFar.tokenize();
}

function collectVocabDefault(    
    g: Grammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    for (const child of children(g)) {
        vocabSoFar = collectVocab(child, tapeName, vocabMode, vocabSoFar, env);
    }
    return vocabSoFar;
}

function collectVocabSequence(    
    g: SequenceGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    
    // to determine in what mode we should collect child vocabs, 
    // we have to determine if we're truly a concat for the purposes of this tape
    let tapeFoundCount = 0;
    for (const child of children(g)) {
        const tapeSet = new Set(child.tapeNames);
        if (tapeSet.has(tapeName)) {
            tapeFoundCount++;
        }
    }

    let hasTape = tapeFoundCount > 1;
    let newVocabMode = vocabMode;
    if (hasTape && vocabMode == "atomic") newVocabMode = "concat";
    if (hasTape && vocabMode == "join") newVocabMode = "tokenized";

    for (const child of children(g)) {
        vocabSoFar = collectVocab(child, tapeName, newVocabMode, vocabSoFar, env);
    }
    return vocabSoFar;
}

function collectVocabRepeat(    
    g: RepeatGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    const hasTape = g.maxReps < 2;
    let newVocabMode = vocabMode;
    if (hasTape && vocabMode === "atomic") newVocabMode = "concat";
    if (hasTape && vocabMode === "join") newVocabMode = "tokenized";
    return vocabSoFar;
}

function collectVocabJoin(    
    g: JoinGrammar | FilterGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    // first determine if we're really a join w.r.t. this tape
    const child1HasTape = new Set(g.child1.tapeNames).has(tapeName);
    const child2HasTape = new Set(g.child2.tapeNames).has(tapeName);
    const hasTape = child1HasTape && child2HasTape;

    // then up the tokenization level if necessary
    let newVocabMode = vocabMode;
    if (hasTape && vocabMode === "atomic") newVocabMode = "join";

    // then collect the children
    vocabSoFar = collectVocab(g.child1, tapeName, newVocabMode, vocabSoFar, env);
    vocabSoFar = collectVocab(g.child2, tapeName, newVocabMode, vocabSoFar, env);
    return vocabSoFar;
}

function collectVocabTokenized(    
    g: Grammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    // we force tokenization on all children
    for (const child of children(g)) {
        vocabSoFar = collectVocab(child, tapeName, "tokenized", vocabSoFar, env);
    }
    return vocabSoFar;
}

function collectVocabSelection(
    g: SelectionGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {

    const referent = getCaseInsensitive(g.symbols, g.selection);
    if (referent === undefined) { 
        // something's wrong, but now is not the time to complain
        return vocabSoFar;
    }
    return collectVocab(referent, tapeName, vocabMode, vocabSoFar, env);
}

function collectVocabCursor(
    g: CursorGrammar | GreedyCursorGrammar, 
    tapeName: string, 
    vocabMode: VocabMode,
    vocabSoFar: VocabContainer,
    env: ResolveVocabEnv
): VocabContainer {
    if (tapeName === g.tapeName) {
        // it's not the same tape, outside and inside a cursor
        return vocabSoFar;
    }
    return collectVocab(g.child, tapeName, vocabMode, vocabSoFar, env);
}