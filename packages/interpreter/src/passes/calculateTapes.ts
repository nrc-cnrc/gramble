import { Err, Message, Msg } from "../utils/msgs";
import { 
    Grammar,
    CollectionGrammar,
    EmbedGrammar,
    HideGrammar,
    RenameGrammar,
    FilterGrammar,
    ReplaceBlockGrammar,
    EpsilonGrammar,
    LiteralGrammar,
    DotGrammar,
    SingleTapeGrammar,
    MatchGrammar,
    JoinGrammar,
    StartsGrammar,
    EndsGrammar,
    ContainsGrammar,
    SequenceGrammar,
    RepeatGrammar,
    ShortGrammar,
    NegationGrammar,
    CorrespondGrammar,
    CursorGrammar,
    ReplaceGrammar,
    ReplaceParGrammar,
} from "../grammars";
import { AutoPass } from "../passes";
import { 
    mapValues, 
    exhaustive, update, 
    foldRight, dictLen, mapDict 
} from "../utils/func";
import { 
    DEFAULT_TAPE, 
    INPUT_TAPE, 
    OUTPUT_TAPE 
} from "../utils/constants";
import { toStr } from "./toStr";

import { TapeSet, TapeDict } from "../tapes";
import * as Tapes from "../tapes";
import { VocabDict } from "../vocab";
import * as Vocabs from "../vocab";
import { PassEnv, children } from "../components";
import { Env, Options } from "../utils/options";


export class TapesEnv extends Env<Grammar> {

    constructor(
        opt: Partial<Options>,
        public recalculate: boolean = false,
        public tapeMap: TapeDict | undefined = undefined
    ) {
        super(opt);
    }

    public update(g: Grammar): TapesEnv {
        switch (g.tag) {
            case "collection": return this.updateCollection(g);
            default: return this;
        }
    }

    updateCollection(g: CollectionGrammar): TapesEnv {
        const tapeMap = mapDict(g.symbols, (k,_) => Tapes.Ref(k));
        return update(this, {tapeMap});
    }
    
}

/**
 * Goes through the tree and 
 * 
 * (1) flattens the collection structure, replacing the 
 * potentially complex tree of collections with a single 
 * one at the root
 * 
 * (2) replaces unqualified symbol references (like "VERB") to 
 * fully-qualified names (like "MainSheet.VERB")
 */
export class CalculateTapes extends AutoPass<Grammar> {

    public getEnv(opt: Partial<Options>): TapesEnv {
        return new TapesEnv(opt);
    }

    public transform(g: Grammar, env: TapesEnv): Msg<Grammar> {
        if (g.tapes.tag !== Tapes.Tag.Unknown && !env.recalculate) {
            return g.msg();
        }
        
        return super.transform(g, env);
    }

    public postTransform(g: Grammar, env: TapesEnv): Grammar|Msg<Grammar> {
        switch (g.tag) {

            // have no tapes
            case "epsilon":
            case "null": return updateTapes(g, Tapes.Lit());

            // have their own tape name as tapes
            case "lit": return getTapesLit(g, env);
            case "dot": return getTapesDot(g, env);
            
            case "singletape": return getTapesSingleTape(g);

            // just the union of children's tapes
            case "alt":
            case "priority":
            case "count": 
            case "test":
            case "testnot":
            case "context":
            case "pretape": return getTapesDefault(g);
            
            case "cursor":  return getTapesCursor(g, env);
            
            // union of children's tapes but always String vocab
            case "short":      return getTapesShort(g);
            case "not":        return getTapesNot(g);

            // join and filter are special w.r.t. vocabs and wildcards
            case "join":       return getTapesJoin(g);
            case "filter":     return getTapesFilter(g);
            case "starts":
            case "ends":
            case "contains":   return getTapesCondition(g);

            // seq and repeat involve products
            case "seq":         return getTapesSeq(g);
            case "repeat":      return getTapesRepeat(g);

            // something special
            case "embed":           return getTapesEmbed(g, env);
            case "collection":      return this.getTapesCollection(g, env);
            case "rename":          return getTapesRename(g);
            case "hide":            return getTapesHide(g);
            case "match":           return getTapesMatch(g);
            case "replaceblock":    return getTapesReplaceBlock(g);
            case "replacePar":      return getTapesReplacePar(g);
            
            case "replace":     return getTapesReplace(g, env);
            case "correspond":  return getTapesCorrespond(g, env);

            default: exhaustive(g);
            //default: throw new Error(`unhandled grammar in getTapes: ${g.tag}`);
        }

    }
    
    getTapesCollection(g: CollectionGrammar, env: TapesEnv): Msg<Grammar> {
        const msgs: Message[] = [];
        
        while (true) {
            const newMsgs: Message[] = [];

            // first get the initial tapes for each symbol
            let tapeIDs: TapeDict = mapValues(g.symbols, v => v.tapes);

            tapeIDs = Tapes.resolveAll(tapeIDs);

            // check for unresolved content, and throw an exception immediately.
            // otherwise we have to puzzle it out from exceptions elsewhere.
            for (const [k,v] of Object.entries(tapeIDs)) {
                if (v.tag !== Tapes.Tag.Lit) {
                    throw new Error(`Unresolved tape structure in ${k}: ${Tapes.toStr(v)}`);
                }
            }

            // now feed those back into the structure so that every
            // grammar node has only literal tapes
            //const tapePusher = new CalculateTapes(true, tapeIDs);

            const tapePushEnv = new TapesEnv(env.opt, true, tapeIDs);
            g.symbols = mapValues(g.symbols, v => 
                    this.transform(v, tapePushEnv).msgTo(newMsgs));

            msgs.push(...newMsgs);

            if (newMsgs.length === 0) break;
            
            // if there are any errors, the graph may have changed.  we
            // need to restart the process from scratch.
            //const TapeRefresher = new CalculateTapes(true);
            const tapeRefreshEnv = new TapesEnv(env.opt, true).update(g);
                            // update resets the references
            g.symbols = mapValues(g.symbols, v => 
                this.transform(v, tapeRefreshEnv).msgTo(newMsgs));
        }

        // TODO: The following interpretation of tapes is incorrect,
        // but matches what we've been doing previously.  I'm going to
        // get it "working" exactly like the old way, before fixing it to be
        // semantically sound.
        return getTapesDefault(g).msg(msgs);

        /*
        // TODO: This is the correct interpretation, restore it eventually

        // if a symbol is selected, we share its tape set
        const selectedSymbol = g.getSymbol(g.selectedSymbol);
        if (selectedSymbol === undefined) {
            // if there's no selected symbol, the collection as a whole
            // has the semantics of epsilon, and thus its tapes are
            // an empty TapeSet rather than TapeUnknown.   
            return updateTapes(g, TapeSet()).msg(msgs);
        }
        return updateTapes(g, selectedSymbol.tapeSet).msg(msgs);
        */

    }
}

function updateTapes(g: Grammar, tapes: TapeSet): Grammar {
    return update(g, { tapes });
}

function getChildTapes(g: Grammar): TapeSet {
    const childTapes = children(g).map(c => c.tapes);
    if (childTapes.length === 0) return Tapes.Lit();
    return foldRight(childTapes.slice(1), Tapes.Sum, childTapes[0]);
}

function getTapesDefault(
    g: Grammar
): Grammar {
    return updateTapes(g, getChildTapes(g));
}

function getTapesShort(g: ShortGrammar): Grammar {
    let tapes = getChildTapes(g);
    if (tapes.tag !== Tapes.Tag.Lit) {
        // nothing we can do at the moment
        return updateTapes(g, tapes);
    }

    const stringifiers = Tapes.Lit();
    for (const tape of Object.keys(tapes.vocabMap)) {
        // dummy vocab ensures the atomicity is tokenized
        stringifiers.vocabMap[tape] = Vocabs.Tokenized(); 
    }
    tapes = Tapes.Sum(stringifiers, tapes);
    return updateTapes(g, tapes);
}

function getTapesReplace(
    g: ReplaceGrammar,
    env: TapesEnv
): Grammar | Msg<Grammar> {
    let tapes = getChildTapes(g);
    if (tapes.tag !== Tapes.Tag.Lit) {
        // nothing we can do at the moment
        return updateTapes(g, tapes);
    }

    const tapeNames = new Set([INPUT_TAPE, OUTPUT_TAPE]);
    const vocabMap: VocabDict = {
        [INPUT_TAPE]: Vocabs.Tokenized(),
        [OUTPUT_TAPE]: Vocabs.Tokenized()
    }
    const stringifiers = Tapes.Lit(tapeNames, vocabMap);
    tapes = Tapes.Sum(stringifiers, tapes);
    tapes = Tapes.Match(tapes, INPUT_TAPE, OUTPUT_TAPE);
    return updateTapes(g, tapes);
}

function getTapesCorrespond(
    g: CorrespondGrammar, 
    env: TapesEnv
): Grammar | Msg<Grammar> {
    let tapes = getChildTapes(g);
    if (tapes.tag !== Tapes.Tag.Lit) {
        // nothing we can do at the moment
        return updateTapes(g, tapes);
    }

    const tapeNames = new Set([INPUT_TAPE, OUTPUT_TAPE]);
    const vocabMap: VocabDict = {
        [INPUT_TAPE]: Vocabs.Tokenized(),
        [OUTPUT_TAPE]: Vocabs.Tokenized()
    }
    const stringifiers = Tapes.Lit(tapeNames, vocabMap);
    tapes = Tapes.Sum(stringifiers, tapes);
    return updateTapes(g, tapes);

}

function getTapesNot(g: NegationGrammar): Grammar {
    let tapes = getChildTapes(g);
    if (tapes.tag !== Tapes.Tag.Lit) {
        // nothing we can do at the moment
        return updateTapes(g, tapes);
    }

    const stringifiers = Tapes.Lit();
    for (const tape of tapes.tapeNames) {
        stringifiers.vocabMap[tape] = Vocabs.Tokenized();
    }
    tapes = Tapes.Sum(stringifiers, tapes);
    return updateTapes(g, tapes);
}

function getTapesSeq(
    g: SequenceGrammar
): Grammar {
    const childTapes = g.children.map(c => c.tapes);
    if (childTapes.length === 0) 
        return updateTapes(g, Tapes.Lit());
    if (childTapes.length === 1)
        return updateTapes(g, childTapes[0]);
    const tapes = foldRight(childTapes.slice(1), Tapes.Product, childTapes[0]);
    return updateTapes(g, tapes);
}

function getTapesRepeat(
    g: RepeatGrammar
): Grammar {
    // (child⋅child) will give the right atomicity answer for 
    // maxReps > 1.  For <= 1 it'll potentially claim non-atomicity
    // for things that could be atomic, but it doesn't matter, we 
    // don't actually use those.
    const tapes = Tapes.Product(g.child.tapes, g.child.tapes); 
    return updateTapes(g, tapes);
}

function getTapesLit(g: LiteralGrammar, env: TapesEnv): Grammar {
    const tapes = new Set([g.tapeName]);
    const vocab = env.opt.optimizeAtomicity
                        ? Vocabs.Atomic(new Set([g.text]))
                        : Vocabs.Tokenized(new Set(g.tokens));
    const vocabMap = { [g.tapeName]: vocab };
    return updateTapes(g, Tapes.Lit(tapes, vocabMap));
}

function getTapesSingleTape(g: SingleTapeGrammar): Grammar {

    if (g.child.tapes.tag !== Tapes.Tag.Lit) {
        // we know there should be a single tape, but we don't
        // yet know what it is.  let it be the dummy tape for now,
        // we'll be back later to fix it
        const tapes = Tapes.Rename(g.child.tapes, DEFAULT_TAPE, g.tapeName);
        return updateTapes(g, tapes);
    }

    if (dictLen(g.child.tapes.vocabMap) === 0) {
        return g.child;
    }

    // this isn't quite correct (it misses some possible vocab coming from
    // children beyond the first, but I don't think it matters given the restricted 
    // contexts in which single tapes occur.
    const tapeToRename = Object.keys(g.child.tapes.vocabMap)[0];
    const tapes = Tapes.Rename(g.child.tapes, tapeToRename, g.tapeName);
    return updateTapes(g, tapes);
}

function getTapesDot(g: DotGrammar, env: TapesEnv): Grammar {
    const tapes = new Set([g.tapeName]);
    const vocab = { [g.tapeName]: Vocabs.Tokenized() };
    return updateTapes(g, Tapes.Lit(tapes, vocab));
}

function getTapesEmbed(
    g: EmbedGrammar, 
    env: TapesEnv,
): Grammar {
    if (env.tapeMap === undefined || !(g.symbol in env.tapeMap)) 
        throw new Error(`Unknown symbol during tapecalc: ${g.symbol}`);
        // should already be in there
    return updateTapes(g, env.tapeMap[g.symbol]);
}

function getTapesMatch(g: MatchGrammar): Grammar {
    const tapes = Tapes.Match(g.child.tapes, g.inputTape, g.outputTape);
    return updateTapes(g, tapes);
}

function getTapesJoin(g: JoinGrammar | FilterGrammar): Grammar {
    const tapes = Tapes.Join(g.child1.tapes, g.child2.tapes);
    return updateTapes(g, tapes);
}

function getTapesRename(g: RenameGrammar): Grammar {

    const tapes = Tapes.Rename(g.child.tapes, g.fromTape, g.toTape);
    const result = updateTapes(g, tapes);

    if (g.child.tapes.tag !== Tapes.Tag.Lit) {
        return result;
    }

    if (g.child.tapes.vocabMap[g.fromTape] === undefined) {
        throw g.child.err("Renaming missing tape",
            `The grammar to undergo renaming does not contain the tape ${g.fromTape}. ` +
            `Available tapes: [${[...g.child.tapeNames]}]`);
    }

    if (g.fromTape !== g.toTape && g.child.tapes.vocabMap[g.toTape] !== undefined) {
        throw g.child.err("Destination tape already exists",
                  `Trying to rename ${g.fromTape}->${g.toTape} but the grammar ` +
                  `to the left already contains the tape ${g.toTape}.`)
    }

    return result;

}

function getTapesHide(g: HideGrammar): Grammar {
    if (g.child.tapes.tag === Tapes.Tag.Lit &&
        g.child.tapes.vocabMap[g.tapeName] === undefined) {
        throw g.child.err("Hiding missing tape",
                    `The grammar being hidden does not contain the tape ${g.tapeName}. ` +
                    ` Available tapes: [${[...g.child.tapeNames]}]`);
    }

    const tapes = Tapes.Rename(g.child.tapes, g.tapeName, g.toTape);
    return updateTapes(g, tapes);
}

/**
 * FilterGrammars are just a kind of join with a single-tape requirement.
 * Here we check that requirement.  We could do this with SingleTapeGrammars
 * too but handling it specially lets us return a clearer error message. 
 * If we fail, we return the left child and an error message.
 */
function getTapesFilter(g: FilterGrammar): Grammar {

    if (g.child1.tapes.tag !== Tapes.Tag.Lit || 
            g.child2.tapes.tag !== Tapes.Tag.Lit) {
        // there's nothing we can check right now
        return getTapesJoin(g);
    }

    if (dictLen(g.child2.tapes.vocabMap) === 0) {
        // it's an epsilon or failure caught elsewhere
        return getTapesJoin(g);
    }

    if (dictLen(g.child2.tapes.vocabMap) > 1) {
        throw g.child1.err("Filters must be single-tape", 
        `A filter like equals, starts, etc. should only reference a single tape.`);
    }

    const t2 = g.child2.tapeNames[0];
    if (g.child1.tapes.vocabMap[t2] === undefined) {
        throw g.child1.err("Filtering non-existent tape", 
        `This filter references a tape "${t2}" that does not exist`);
    }

    return getTapesJoin(g);
}

function getTapesReplaceBlock(g: ReplaceBlockGrammar): Grammar {

    // make sure the tape we're replacing exists, otherwise
    // we generate infinitely
    if (g.child.tapes.tag === Tapes.Tag.Lit &&
        g.child.tapes.vocabMap[g.inputTape] === undefined) {
        throw g.child.err("Replacing non-existent tape",
                    `The grammar above does not have a tape ` +
                    `${g.inputTape} to replace on`);
    }

    // filter out Tapes.Any non-rules caused by children disappearing
    const isReplace = (r: Grammar): r is ReplaceGrammar => 
                        r instanceof ReplaceGrammar;
    g.rules = g.rules.filter(isReplace);

    if (g.rules.length == 0) {
        throw g.child.warn("This replace has no valid rules");
    }

    let current = g.child.tapes;
    let currentTape = g.inputTape;
    for (const r of g.rules) {
        current = Tapes.Rename(current, currentTape, INPUT_TAPE);
        currentTape = OUTPUT_TAPE;
        current = Tapes.Join(current, r.tapes);
        current = Tapes.Rename(current, INPUT_TAPE, r.hiddenTapeName);
    }
    current = Tapes.Rename(current, OUTPUT_TAPE, g.inputTape);
    return updateTapes(g, current);
}

function getTapesReplacePar(g: ReplaceParGrammar): Grammar {

    // make sure the tape we're replacing exists, otherwise
    // we generate infinitely
    if (g.child.tapes.tag === Tapes.Tag.Lit &&
        g.child.tapes.vocabMap[g.inputTape] === undefined) {
        throw g.child.err("Replacing non-existent tape",
                    `The grammar above does not have a tape ` +
                    `${g.inputTape} to replace on`);
    }

    // filter out Tapes.Any non-rules caused by children disappearing
    const isReplace = (r: Grammar): r is ReplaceGrammar => 
                        r instanceof ReplaceGrammar;
    g.rules = g.rules.filter(isReplace);

    if (g.rules.length == 0) {
        throw g.child.warn("This replace has no valid rules");
    }

    let current = g.child.tapes;
    current = Tapes.Rename(current, g.inputTape, INPUT_TAPE);
    for (const r of g.rules) {
        current = Tapes.Join(current, r.tapes);
    }
    current = Tapes.Rename(current, INPUT_TAPE, g.hiddenTapeName);
    current = Tapes.Rename(current, OUTPUT_TAPE, g.inputTape);
    return updateTapes(g, current);
}


/**
 * Starts/Ends/Contains have the tapes of their child AND a wildcard
 * on its tape (for the dot-star).  Sometimes because of scope adjustment
 * this tape might not actually be on the child Tapes.Anymore, so in that case
 * it's store in .extraTapes.
 */
function getTapesCondition(
    g: StartsGrammar | EndsGrammar | ContainsGrammar
): Grammar {
    const extraTapes = [...g.extraTapes];
    const extraVocab: VocabDict = {};

    if (g.child.tapes.tag === Tapes.Tag.Lit) {
        // if we know what the child tapes are, add those wildcards too
        extraTapes.push(...g.child.tapes.tapeNames);
    }

    for (const t of extraTapes) {
        extraVocab[t] = Vocabs.Tokenized();
    }

    const extras = Tapes.Lit(new Set(extraTapes), extraVocab);
    const tapes = Tapes.Sum(g.child.tapes, extras);
    return updateTapes(g, tapes);
}

function getTapesCursor(
    g: CursorGrammar,
    env: TapesEnv
): Grammar {

    if (g.child.tapes.tag !== Tapes.Tag.Lit) {
        // can't do anything right now
        const tapes = Tapes.Cursor(g.child.tapes, g.tapeName);
        return updateTapes(g, tapes);
    }
    
    if (!(g.tapeName in g.child.tapes.vocabMap)) {
        throw g.child.err("Spurious cursor",
            `Cursor for ${g.tapeName}, but no such tape in its scope.`)
    }
    
    let vocab = g.vocab;
    if (vocab.tag !== Vocabs.Tag.Lit) {
        vocab = g.child.tapes.vocabMap[g.tapeName];
    }
    const tapes = Tapes.Cursor(g.child.tapes, g.tapeName) // this handles deleting for us
    return update(g, {tapes, vocab});
}